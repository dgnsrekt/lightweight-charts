import { IChartApi, ISeriesApi, SeriesOptionsMap, Coordinate } from 'lightweight-charts';
import { SocialMessage } from '../options';
import { IPositioningStrategy, AnchorPoint, MouseEventData } from './positioning-strategy';

/**
 * Drag state for a message
 */
interface DragState {
	messageId: string;
	startX: number;
	startY: number;
	initialOffsetX: number; // Offset that existed before this drag started
	initialOffsetY: number;
	isDragging: boolean;
}

/**
 * Draggable positioning strategy
 *
 * Allows messages to be repositioned via drag.
 * Stores pixel offsets during drag, converts to time/price on drag end.
 */
export class DraggablePositioningStrategy implements IPositioningStrategy {
	private _dragState: DragState | null = null;
	private _pixelOffsets: Map<string, { offsetX: number; offsetY: number }> = new Map();

	resolveAnchor(
		message: SocialMessage,
		chart: IChartApi,
		series: ISeriesApi<keyof SeriesOptionsMap>
	): AnchorPoint {
		// Get base position from time/price
		const timeScale = chart.timeScale();
		const baseX = timeScale.timeToCoordinate(message.time);
		const baseY = series.priceToCoordinate(message.price);

		// Apply pixel offset if exists
		const offset = this._pixelOffsets.get(message.id);
		if (offset && baseX !== null && baseY !== null) {
			return {
				x: (baseX + offset.offsetX) as Coordinate,
				y: (baseY + offset.offsetY) as Coordinate,
			};
		}

		return { x: baseX, y: baseY };
	}

	handleMouseDown(
		message: SocialMessage,
		eventData: MouseEventData,
		chart: IChartApi,
		series: ISeriesApi<keyof SeriesOptionsMap>
	): void {
		const anchor = this.resolveAnchor(message, chart, series);
		if (anchor.x === null || anchor.y === null) return;

		// Capture the existing offset so we can add to it, not replace it
		const existingOffset = this._pixelOffsets.get(message.id) || { offsetX: 0, offsetY: 0 };

		this._dragState = {
			messageId: message.id,
			startX: eventData.x,
			startY: eventData.y,
			initialOffsetX: existingOffset.offsetX,
			initialOffsetY: existingOffset.offsetY,
			isDragging: true,
		};
	}

	handleMouseMove(
		message: SocialMessage,
		eventData: MouseEventData,
		_chart: IChartApi,
		_series: ISeriesApi<keyof SeriesOptionsMap>
	): void {
		if (!this._dragState || this._dragState.messageId !== message.id) return;

		// Calculate drag delta from the start position
		const dragDeltaX = eventData.x - this._dragState.startX;
		const dragDeltaY = eventData.y - this._dragState.startY;

		// Add the drag delta to the initial offset (prevents jumping)
		const newOffsetX = this._dragState.initialOffsetX + dragDeltaX;
		const newOffsetY = this._dragState.initialOffsetY + dragDeltaY;

		// Store the accumulated offset
		this._pixelOffsets.set(message.id, { offsetX: newOffsetX, offsetY: newOffsetY });
	}

	handleMouseUp(
		message: SocialMessage,
		_eventData: MouseEventData,
		_chart: IChartApi,
		_series: ISeriesApi<keyof SeriesOptionsMap>
	): void {
		if (!this._dragState || this._dragState.messageId !== message.id) return;

		// Keep the pixel offset persistent - DO NOT update message.time/price
		// The anchor point (message.time, message.price) should remain fixed
		// Only the card position (base + offset) changes

		this._dragState = null;
	}

	attach(_chart: IChartApi): void {
		// Strategy is now stateless - primitive manages all event lifecycle
	}

	detach(): void {
		// Clear any cached offsets and state
		this._dragState = null;
		this._pixelOffsets.clear();
	}
}
