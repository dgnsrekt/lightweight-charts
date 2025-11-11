import {
	ISeriesPrimitive,
	IPrimitivePaneView,
	PrimitiveHoveredItem,
	Time,
	MouseEventParams,
	MouseEventHandler,
	SeriesAttachedParameter,
} from 'lightweight-charts';
import { PluginBase } from '../plugin-base';
import { DiscordMessage, DiscordMessageOptions, defaultOptions, PositioningMode } from './options';
import { MessagesState } from './state/messages-state';
import { IPositioningStrategy } from './positioning/positioning-strategy';
import { FixedPositioningStrategy } from './positioning/fixed-positioning';
import { DraggablePositioningStrategy } from './positioning/draggable-positioning';
import { DiscordMessagePaneView } from './view/discord-message-pane-view';
import { calculateCardHeight } from './utils/layout';
import { AnimationScheduler } from './utils/animation-scheduler';

/**
 * Discord Message Plugin
 *
 * Displays Discord messages as card annotations on the chart.
 * Supports both fixed (time/price anchored) and draggable positioning modes.
 */
export class DiscordMessagePrimitive extends PluginBase implements ISeriesPrimitive<Time> {
	private _state: MessagesState;
	private _options: DiscordMessageOptions;
	private _views: DiscordMessagePaneView[];
	private _strategy: IPositioningStrategy;
	private _hoveredMessageId: string | null = null;
	private _dragState: { messageId: string; message: DiscordMessage } | null = null;
	private _crosshairMoveHandler: MouseEventHandler<Time> | null = null;
	private _mouseDownHandler: ((e: MouseEvent) => void) | null = null;
	private _documentMouseMoveHandler: ((e: MouseEvent) => void) | null = null;
	private _documentMouseUpHandler: ((e: MouseEvent) => void) | null = null;
	private _isDragging: boolean = false;
	private _dragStartPos: { x: number; y: number } | null = null;
	private readonly _dragThreshold: number = 5; // pixels
	private _animationScheduler: AnimationScheduler = new AnimationScheduler();

	constructor(options: Partial<DiscordMessageOptions> = {}) {
		super();
		this._state = new MessagesState();
		this._options = { ...defaultOptions, ...options };
		this._views = [];
		this._strategy = new FixedPositioningStrategy();

		// Subscribe to state changes
		this._state.messagesChanged().subscribe(() => {
			this.requestUpdate();
		}, this);
	}

	attached(param: SeriesAttachedParameter<Time>) {
		super.attached(param);
		this._views = [new DiscordMessagePaneView(this)];

		// Attach strategy if needed
		if (this._strategy.attach) {
			this._strategy.attach(this.chart);
		}

		// Subscribe to click events
		this.chart.subscribeClick(this._clickHandler);

		// Subscribe to crosshair move for hover detection
		this._crosshairMoveHandler = this._onCrosshairMove.bind(this);
		this.chart.subscribeCrosshairMove(this._crosshairMoveHandler);

		// Subscribe to mousedown for draggable mode
		if (this._options.positioningMode === 'draggable') {
			this._attachDragListeners();
		}
	}

	detached() {
		// Critical: Remove document listeners first to prevent post-detach callbacks
		this._removeDocumentDragListeners();

		// Detach drag listeners if needed
		this._detachDragListeners();

		// Cancel any pending animation frames
		this._animationScheduler.cancel();

		// Unsubscribe from click events
		this.chart.unsubscribeClick(this._clickHandler);

		// Unsubscribe from crosshair move
		if (this._crosshairMoveHandler) {
			this.chart.unsubscribeCrosshairMove(this._crosshairMoveHandler);
			this._crosshairMoveHandler = null;
		}

		// Detach strategy
		if (this._strategy.detach) {
			this._strategy.detach();
		}

		// Clean up state subscriptions
		this._state.messagesChanged().unsubscribeAll(this);
		this._state.destroy();

		super.detached();
	}

	paneViews(): readonly IPrimitivePaneView[] {
		return this._views;
	}

	updateAllViews(): void {
		this._views.forEach(view => view.update());
	}

	/**
	 * Get hovered message ID (for view rendering)
	 */
	hoveredMessageId(): string | null {
		return this._hoveredMessageId;
	}

	/**
	 * Find message at given point coordinates
	 * Single source of truth for hit detection
	 */
	private _messageAtPoint(x: number, y: number): DiscordMessage | null {
		const chart = this.chart;
		const series = this.series;

		for (const message of this._state.messages()) {
			const anchor = this._strategy.resolveAnchor(message, chart, series);

			if (anchor.x !== null && anchor.y !== null) {
				const cardWidth = this._options.cardWidth;
				const cardHeight = calculateCardHeight(this._options);

				if (
					x >= anchor.x &&
					x <= anchor.x + cardWidth &&
					y >= anchor.y &&
					y <= anchor.y + cardHeight
				) {
					return message;
				}
			}
		}

		return null;
	}

	hitTest(x: number, y: number): PrimitiveHoveredItem | null {
		const message = this._messageAtPoint(x, y);

		if (message) {
			return {
				cursorStyle: this._options.cursorOnHover,
				externalId: `discord-message-${message.id}`,
				zOrder: 'top',
			};
		}

		return null;
	}

	/**
	 * Add a Discord message
	 */
	addMessage(message: DiscordMessage): void {
		this._state.addMessage(message);
	}

	/**
	 * Remove a Discord message
	 */
	removeMessage(id: string): void {
		this._state.removeMessage(id);
	}

	/**
	 * Update an existing message
	 */
	updateMessage(message: DiscordMessage): void {
		this._state.updateMessage(message);
	}

	/**
	 * Get all messages
	 */
	messages(): DiscordMessage[] {
		return this._state.messages();
	}

	/**
	 * Update plugin options
	 */
	applyOptions(options: Partial<DiscordMessageOptions>): void {
		this._options = { ...this._options, ...options };

		// If positioning mode changed, recreate strategy
		if (options.positioningMode) {
			this.updatePositioningMode(options.positioningMode);
		}

		this.requestUpdate();
	}

	/**
	 * Get current options
	 */
	options(): DiscordMessageOptions {
		return { ...this._options };
	}

	/**
	 * Get positioning strategy
	 */
	strategy(): IPositioningStrategy {
		return this._strategy;
	}

	/**
	 * Set positioning mode
	 */
	setPositioningMode(mode: PositioningMode): void {
		this._options.positioningMode = mode;
		this.updatePositioningMode(mode);
		this.requestUpdate();
	}

	/**
	 * Update positioning strategy based on mode
	 */
	updatePositioningMode(mode: PositioningMode): void {
		// Critical: Force-end any active drag before switching strategies
		if (this._dragState) {
			// Simulate mouseup to properly end drag and persist state
			const syntheticEvent = new MouseEvent('mouseup', {
				bubbles: true,
				cancelable: true,
				view: window
			});
			this._onDocumentMouseUp(syntheticEvent);
		}

		// Detach drag listeners if switching from draggable
		if (this._options.positioningMode === 'draggable') {
			this._detachDragListeners();
		}

		// Detach old strategy
		if (this._strategy.detach) {
			this._strategy.detach();
		}

		// Create new strategy
		if (mode === 'fixed') {
			this._strategy = new FixedPositioningStrategy();
		} else {
			this._strategy = new DraggablePositioningStrategy();
		}

		// Attach new strategy if chart is available
		if (this.chart && this._strategy.attach) {
			this._strategy.attach(this.chart);
		}

		// Attach drag listeners if switching to draggable
		if (mode === 'draggable' && this.chart) {
			this._attachDragListeners();
		}

		this.requestUpdate();
	}

	/**
	 * Handle crosshair move for hover detection
	 */
	private _onCrosshairMove(param: MouseEventParams<Time>): void {
		// Don't update hover state during drag - pin it to dragged card
		if (this._dragState && this._isDragging) {
			const newHoveredId = this._dragState.message.id;
			if (this._hoveredMessageId !== newHoveredId) {
				this._hoveredMessageId = newHoveredId;
				this.requestUpdate();
			}
			return;
		}

		if (!param.point) {
			// Crosshair left the chart
			if (this._hoveredMessageId !== null) {
				this._hoveredMessageId = null;
				this.requestUpdate();
			}
			return;
		}

		const message = this._messageAtPoint(param.point.x, param.point.y);
		const newHoveredId = message ? message.id : null;

		if (this._hoveredMessageId !== newHoveredId) {
			this._hoveredMessageId = newHoveredId;
			this.requestUpdate();
		}
	}

	/**
	 * Attach drag listeners for draggable mode
	 */
	private _attachDragListeners(): void {
		const chartElement = this.chart.chartElement();
		this._mouseDownHandler = this._onMouseDown.bind(this);
		chartElement.addEventListener('mousedown', this._mouseDownHandler);
	}

	/**
	 * Remove document-level drag listeners
	 * Called during cleanup to prevent memory leaks
	 */
	private _removeDocumentDragListeners(): void {
		if (this._documentMouseMoveHandler) {
			document.removeEventListener('mousemove', this._documentMouseMoveHandler);
			this._documentMouseMoveHandler = null;
		}
		if (this._documentMouseUpHandler) {
			document.removeEventListener('mouseup', this._documentMouseUpHandler);
			this._documentMouseUpHandler = null;
		}
	}

	/**
	 * Detach drag listeners
	 */
	private _detachDragListeners(): void {
		// Remove document listeners first
		this._removeDocumentDragListeners();

		// Remove chart element listener
		if (this._mouseDownHandler) {
			const chartElement = this.chart.chartElement();
			chartElement.removeEventListener('mousedown', this._mouseDownHandler);
			this._mouseDownHandler = null;
		}

		// Reset drag state
		this._dragState = null;
		this._isDragging = false;
		this._dragStartPos = null;
	}

	/**
	 * Handle mouse down for drag start
	 */
	private _onMouseDown(event: MouseEvent): void {
		const rect = this.chart.chartElement().getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;

		const message = this._messageAtPoint(x, y);
		if (!message) return;

		// Disable chart panning during drag
		this.chart.applyOptions({
			handleScroll: {
				mouseWheel: true,
				pressedMouseMove: false,
				horzTouchDrag: false,
				vertTouchDrag: false,
			}
		});

		// Initialize potential drag (not yet confirmed as drag)
		this._dragState = { messageId: message.id, message };
		this._isDragging = false;
		this._dragStartPos = { x: event.clientX, y: event.clientY };

		this._strategy.handleMouseDown?.(
			message,
			{ x, y, event },
			this.chart,
			this.series
		);

		// Bind and attach document-level move and up handlers
		this._documentMouseMoveHandler = this._onDocumentMouseMove.bind(this);
		this._documentMouseUpHandler = this._onDocumentMouseUp.bind(this);
		document.addEventListener('mousemove', this._documentMouseMoveHandler);
		document.addEventListener('mouseup', this._documentMouseUpHandler);
	}

	/**
	 * Handle document mouse move during drag
	 */
	private _onDocumentMouseMove(event: MouseEvent): void {
		if (!this._dragState || !this._dragStartPos) return;

		// Check if we've exceeded the drag threshold
		if (!this._isDragging) {
			const dx = event.clientX - this._dragStartPos.x;
			const dy = event.clientY - this._dragStartPos.y;
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance < this._dragThreshold) {
				return; // Still might be a click, not a drag
			}

			// Confirmed as drag
			this._isDragging = true;
		}

		const rect = this.chart.chartElement().getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;

		this._strategy.handleMouseMove?.(
			this._dragState.message,
			{ x, y, event },
			this.chart,
			this.series
		);

		// Schedule update on next animation frame to avoid excessive re-renders
		this._animationScheduler.schedule(() => this.requestUpdate());
	}

	/**
	 * Handle document mouse up to end drag
	 */
	private _onDocumentMouseUp(event: MouseEvent): void {
		if (!this._dragState) return;

		// Only process drag end if we actually dragged
		if (this._isDragging) {
			const rect = this.chart.chartElement().getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;

			this._strategy.handleMouseUp?.(
				this._dragState.message,
				{ x, y, event },
				this.chart,
				this.series
			);

			// Critical: Persist the updated message coordinates to state
			this._state.updateMessage(this._dragState.message);
		}

		// Re-enable chart panning after drag
		this.chart.applyOptions({
			handleScroll: {
				mouseWheel: true,
				pressedMouseMove: true,
				horzTouchDrag: true,
				vertTouchDrag: true,
			}
		});

		// Clean up using centralized method
		this._removeDocumentDragListeners();
		this._dragState = null;
		this._dragStartPos = null;

		// Reset isDragging after a small delay to allow click handler to check it
		setTimeout(() => {
			this._isDragging = false;
		}, 0);

		this.requestUpdate();
	}

	private _clickHandler = (param: MouseEventParams<Time>) => {
		if (!param.point) return;

		// Don't open URL if we just finished dragging
		if (this._isDragging) {
			return;
		}

		const message = this._messageAtPoint(param.point.x, param.point.y);
		if (message) {
			// Open Discord URL
			window.open(message.discordUrl, '_blank');
		}
	};
}
