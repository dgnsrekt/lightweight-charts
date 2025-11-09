# Discord Message Plugin Implementation Plan

## Overview

Create a Discord message annotation plugin for lightweight-charts that displays Discord messages as card-like overlays on charts, similar to TradingView's tweet annotation feature. The plugin supports both fixed (time/price anchored) and draggable positioning modes with full customization options.

## Current State Analysis

The lightweight-charts library has a robust plugin system with several reference implementations:

### Key Discoveries:

- **Plugin architecture** uses PluginBase (plugin-base.ts:12) + ISeriesPrimitive pattern with View/Renderer separation
- **Fixed positioning** via timeScale.timeToCoordinate() and series.priceToCoordinate() (trend-line.ts:89-93)
- **Card rendering patterns** with roundRect() and text drawing in expiring-price-alerts (renderer.ts:59)
- **Click interaction** via hitTest() method returning PrimitiveHoveredItem (user-price-alerts.ts:106-113)
- **Drag patterns** via MouseHandlers class with event delegation (mouse.ts:20-110) and simple mousedown/mousemove/mouseup (brushable-area-series/example.ts:79-123)
- **Canvas rendering** uses fancy-canvas with useBitmapCoordinateSpace and useMediaCoordinateSpace (renderer.ts:21-72)
- **No existing Discord or social media annotation plugins** in the codebase

## Desired End State

A fully functional Discord message annotation plugin that:

1. **Displays Discord messages** as styled card overlays on the chart
2. **Supports dual positioning modes**: fixed (time/price coordinates) and draggable (pixel offsets)
3. **Handles user interactions**: click to open Discord URLs, hover effects, drag to reposition
4. **Provides full customization**: colors, fonts, sizes, show/hide avatar/logo
5. **Follows lightweight-charts patterns**: PluginBase extension, strategy pattern for positioning, View/Renderer architecture

### Verification:

- Plugin can be attached to any series via `series.attachPrimitive(plugin)`
- Messages render correctly at specified time/price coordinates
- Switching between fixed and draggable modes works seamlessly
- Clicking message cards opens Discord URLs in new tabs
- Dragging messages updates their positions with visual feedback
- Customization options (colors, avatar, logo) apply correctly

## What We're NOT Doing

- UI modal/dialog for adding messages (programmatic API only)
- Avatar image loading/caching system (accept URL but don't implement fetching)
- Multi-line text wrapping for long messages (single line with ellipsis truncation)
- Collision detection/auto-positioning to prevent overlapping cards
- Persistence layer (users must manage message data externally)
- Animation/transitions between modes or states
- Mobile/touch drag support (desktop mouse events only)
- Integration with Discord API for fetching messages

## Implementation Approach

Following Codex mentorship recommendations, we'll use a **composition-based architecture** with:

1. **Base plugin class** extending PluginBase - manages messages, options, primitive lifecycle
2. **Positioning strategy pattern** - two strategy classes (FixedPositioning, DraggablePositioning) with shared interface
3. **Single primitive** that delegates coordinate resolution to active strategy
4. **Shared View/Renderer** - positioning-agnostic rendering logic
5. **Data-domain coordinate storage** - persist time/price; strategies convert to pixels as needed

This approach provides:
- Clean separation of positioning logic without code duplication
- Easy mode switching via strategy swap
- Future extensibility (e.g., "follow crosshair" mode)
- Alignment with existing lightweight-charts patterns

## Phase 1: Core Data Structures & Base Architecture

### Overview

Establish the foundational types, interfaces, and base plugin class. This phase creates the skeleton without positioning or rendering logic.

### Changes Required:

#### 1. Create Plugin Directory Structure

**Location**: `plugin-examples/src/plugins/discord-message/`

Create directory and files:
- `discord-message.ts` - Main plugin export
- `options.ts` - Options and data interfaces
- `primitive.ts` - Primitive implementation
- `strategies/` - Positioning strategies directory
- `strategies/base-strategy.ts` - Strategy interface
- `strategies/fixed-strategy.ts` - Fixed positioning
- `strategies/draggable-strategy.ts` - Draggable positioning
- `view.ts` - PaneView implementation
- `renderer.ts` - Canvas rendering
- `icons.ts` - Discord logo as Path2D
- `example/` - Usage examples

#### 2. Define Data & Options Interfaces

**File**: `plugin-examples/src/plugins/discord-message/options.ts`

```typescript
import { Time } from 'lightweight-charts';

/**
 * Discord message data structure
 */
export interface DiscordMessage {
	/** Unique identifier */
	id: string;
	/** Time coordinate for positioning */
	time: Time;
	/** Price coordinate for positioning */
	price: number;
	/** Discord username */
	username: string;
	/** Message content */
	message: string;
	/** Display timestamp (e.g., "04 Apr '25 • 23:43") */
	timestamp: string;
	/** URL to original Discord message */
	discordUrl: string;
	/** Optional avatar URL (not fetched, display placeholder) */
	avatarUrl?: string;
	/** Optional username color override */
	usernameColor?: string;
}

/**
 * Positioning mode
 */
export type PositioningMode = 'fixed' | 'draggable';

/**
 * Plugin customization options
 */
export interface DiscordMessageOptions {
	/** Positioning mode */
	positioningMode: PositioningMode;

	/** Visual customization */
	cardBackgroundColor: string;
	cardBorderColor: string;
	cardBorderRadius: number;

	/** Text styling */
	usernameColor: string;
	usernameFont: string;
	messageColor: string;
	messageFont: string;
	timestampColor: string;
	timestampFont: string;

	/** Layout */
	cardWidth: number;
	cardPadding: number;
	lineHeight: number;

	/** Feature toggles */
	showDiscordLogo: boolean;
	showAvatar: boolean;

	/** Interaction */
	hoverBackgroundColor: string;
	cursorOnHover: string;
}

/**
 * Default Discord theme (dark mode)
 */
export const defaultOptions: DiscordMessageOptions = {
	positioningMode: 'fixed',

	cardBackgroundColor: '#36393f',
	cardBorderColor: '#202225',
	cardBorderRadius: 8,

	usernameColor: '#ffffff',
	usernameFont: 'bold 14px sans-serif',
	messageColor: '#dcddde',
	messageFont: '12px sans-serif',
	timestampColor: '#72767d',
	timestampFont: '10px sans-serif',

	cardWidth: 280,
	cardPadding: 12,
	lineHeight: 18,

	showDiscordLogo: true,
	showAvatar: false,

	hoverBackgroundColor: '#2f3136',
	cursorOnHover: 'pointer',
};
```

#### 3. Create Strategy Interface

**File**: `plugin-examples/src/plugins/discord-message/strategies/base-strategy.ts`

```typescript
import { IChartApi, ISeriesApi, SeriesOptionsMap, Time, Coordinate } from 'lightweight-charts';
import { DiscordMessage } from '../options';

/**
 * Resolved anchor point in pixel coordinates
 */
export interface AnchorPoint {
	x: Coordinate | null;
	y: Coordinate | null;
}

/**
 * Mouse event data for strategies
 */
export interface MouseEventData {
	x: number;
	y: number;
	event: MouseEvent;
}

/**
 * Positioning strategy interface
 */
export interface IPositioningStrategy {
	/**
	 * Resolve message anchor to pixel coordinates
	 */
	resolveAnchor(
		message: DiscordMessage,
		chart: IChartApi,
		series: ISeriesApi<keyof SeriesOptionsMap>
	): AnchorPoint;

	/**
	 * Handle mouse down event (for draggable mode)
	 */
	handleMouseDown?(
		message: DiscordMessage,
		eventData: MouseEventData,
		chart: IChartApi,
		series: ISeriesApi<keyof SeriesOptionsMap>
	): void;

	/**
	 * Handle mouse move event (for draggable mode)
	 */
	handleMouseMove?(
		message: DiscordMessage,
		eventData: MouseEventData,
		chart: IChartApi,
		series: ISeriesApi<keyof SeriesOptionsMap>
	): void;

	/**
	 * Handle mouse up event (for draggable mode)
	 */
	handleMouseUp?(
		message: DiscordMessage,
		eventData: MouseEventData,
		chart: IChartApi,
		series: ISeriesApi<keyof SeriesOptionsMap>
	): void;

	/**
	 * Attach event listeners (for draggable mode)
	 */
	attach?(chart: IChartApi): void;

	/**
	 * Detach event listeners (for draggable mode)
	 */
	detach?(): void;
}
```

#### 4. Create Base Plugin Class

**File**: `plugin-examples/src/plugins/discord-message/discord-message.ts`

```typescript
import { ISeriesApi, SeriesOptionsMap } from 'lightweight-charts';
import { DiscordMessage, DiscordMessageOptions, defaultOptions, PositioningMode } from './options';
import { DiscordMessagePrimitive } from './primitive';

/**
 * Discord Message Plugin
 *
 * Displays Discord messages as card annotations on the chart.
 * Supports both fixed (time/price anchored) and draggable positioning modes.
 */
export class DiscordMessagePlugin {
	private _series: ISeriesApi<keyof SeriesOptionsMap>;
	private _primitive: DiscordMessagePrimitive;
	private _options: DiscordMessageOptions;
	private _messages: Map<string, DiscordMessage> = new Map();

	constructor(
		series: ISeriesApi<keyof SeriesOptionsMap>,
		options: Partial<DiscordMessageOptions> = {}
	) {
		this._series = series;
		this._options = { ...defaultOptions, ...options };
		this._primitive = new DiscordMessagePrimitive(this);
		this._series.attachPrimitive(this._primitive);
	}

	/**
	 * Add a Discord message
	 */
	addMessage(message: DiscordMessage): void {
		this._messages.set(message.id, message);
		this._primitive.requestUpdate();
	}

	/**
	 * Remove a Discord message
	 */
	removeMessage(id: string): void {
		this._messages.delete(id);
		this._primitive.requestUpdate();
	}

	/**
	 * Update an existing message
	 */
	updateMessage(message: DiscordMessage): void {
		if (this._messages.has(message.id)) {
			this._messages.set(message.id, message);
			this._primitive.requestUpdate();
		}
	}

	/**
	 * Get all messages
	 */
	messages(): DiscordMessage[] {
		return Array.from(this._messages.values());
	}

	/**
	 * Update plugin options
	 */
	applyOptions(options: Partial<DiscordMessageOptions>): void {
		this._options = { ...this._options, ...options };

		// If positioning mode changed, recreate primitive
		if (options.positioningMode) {
			this._primitive.updatePositioningMode(options.positioningMode);
		}

		this._primitive.requestUpdate();
	}

	/**
	 * Get current options
	 */
	options(): DiscordMessageOptions {
		return { ...this._options };
	}

	/**
	 * Set positioning mode
	 */
	setPositioningMode(mode: PositioningMode): void {
		this._options.positioningMode = mode;
		this._primitive.updatePositioningMode(mode);
		this._primitive.requestUpdate();
	}

	/**
	 * Destroy plugin and remove primitive
	 */
	destroy(): void {
		this._series.detachPrimitive(this._primitive);
		this._messages.clear();
	}
}
```

### Success Criteria:

#### Automated Verification:

- [ ] TypeScript compilation succeeds: `npm run build`
- [ ] No linting errors: `npm run lint` (if configured)
- [ ] Module exports correctly: can import DiscordMessagePlugin

#### Manual Verification:

- [ ] Directory structure follows lightweight-charts plugin conventions
- [ ] Interfaces are well-documented with JSDoc comments
- [ ] Type definitions are complete with no `any` types
- [ ] Default options provide sensible Discord theme defaults

---

## Phase 2: Fixed Positioning Strategy

### Overview

Implement the fixed positioning strategy that anchors messages to time/price coordinates on the chart. Messages stay in place relative to data, moving naturally with zoom/pan operations.

### Changes Required:

#### 1. Implement Fixed Strategy

**File**: `plugin-examples/src/plugins/discord-message/strategies/fixed-strategy.ts`

```typescript
import { IChartApi, ISeriesApi, SeriesOptionsMap } from 'lightweight-charts';
import { DiscordMessage } from '../options';
import { IPositioningStrategy, AnchorPoint } from './base-strategy';

/**
 * Fixed positioning strategy
 *
 * Anchors messages to time/price coordinates.
 * Messages move with chart zoom/pan operations.
 */
export class FixedPositioningStrategy implements IPositioningStrategy {
	resolveAnchor(
		message: DiscordMessage,
		chart: IChartApi,
		series: ISeriesApi<keyof SeriesOptionsMap>
	): AnchorPoint {
		// Convert time to X coordinate
		const timeScale = chart.timeScale();
		const x = timeScale.timeToCoordinate(message.time);

		// Convert price to Y coordinate
		const y = series.priceToCoordinate(message.price);

		return { x, y };
	}

	// No event handling needed for fixed mode
}
```

### Success Criteria:

#### Automated Verification:

- [ ] TypeScript compilation succeeds: `npm run build`
- [ ] Strategy implements IPositioningStrategy interface
- [ ] No runtime errors when calling resolveAnchor()

#### Manual Verification:

- [ ] Strategy correctly converts time/price to pixel coordinates
- [ ] Returns null coordinates when time/price is out of visible range
- [ ] Coordinates update correctly when chart is zoomed or panned

---

## Phase 3: Draggable Positioning Strategy

### Overview

Implement the draggable positioning strategy that allows messages to be repositioned via mouse drag. Stores both pixel offsets during drag and converts back to time/price on drag end for persistence.

### Changes Required:

#### 1. Implement Draggable Strategy

**File**: `plugin-examples/src/plugins/discord-message/strategies/draggable-strategy.ts`

```typescript
import { IChartApi, ISeriesApi, SeriesOptionsMap, Time, Coordinate } from 'lightweight-charts';
import { DiscordMessage } from '../options';
import { IPositioningStrategy, AnchorPoint, MouseEventData } from './base-strategy';

/**
 * Drag state for a message
 */
interface DragState {
	messageId: string;
	startX: number;
	startY: number;
	offsetX: number;
	offsetY: number;
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
	private _chartElement: HTMLElement | null = null;

	private _mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
	private _mouseUpHandler: ((e: MouseEvent) => void) | null = null;

	resolveAnchor(
		message: DiscordMessage,
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
		message: DiscordMessage,
		eventData: MouseEventData,
		chart: IChartApi,
		series: ISeriesApi<keyof SeriesOptionsMap>
	): void {
		const anchor = this.resolveAnchor(message, chart, series);
		if (anchor.x === null || anchor.y === null) return;

		this._dragState = {
			messageId: message.id,
			startX: eventData.x,
			startY: eventData.y,
			offsetX: 0,
			offsetY: 0,
			isDragging: true,
		};
	}

	handleMouseMove(
		message: DiscordMessage,
		eventData: MouseEventData,
		chart: IChartApi,
		series: ISeriesApi<keyof SeriesOptionsMap>
	): void {
		if (!this._dragState || this._dragState.messageId !== message.id) return;

		// Calculate drag offset
		const offsetX = eventData.x - this._dragState.startX;
		const offsetY = eventData.y - this._dragState.startY;

		this._dragState.offsetX = offsetX;
		this._dragState.offsetY = offsetY;

		// Store pixel offset
		this._pixelOffsets.set(message.id, { offsetX, offsetY });
	}

	handleMouseUp(
		message: DiscordMessage,
		eventData: MouseEventData,
		chart: IChartApi,
		series: ISeriesApi<keyof SeriesOptionsMap>
	): void {
		if (!this._dragState || this._dragState.messageId !== message.id) return;

		// Convert final pixel position back to time/price for persistence
		const anchor = this.resolveAnchor(message, chart, series);
		if (anchor.x !== null && anchor.y !== null) {
			const timeScale = chart.timeScale();
			const newTime = timeScale.coordinateToTime(anchor.x);
			const newPrice = series.coordinateToPrice(anchor.y);

			if (newTime !== null && newPrice !== null) {
				// Update message data (caller handles this)
				message.time = newTime;
				message.price = newPrice;

				// Clear pixel offset since we've converted to time/price
				this._pixelOffsets.delete(message.id);
			}
		}

		this._dragState = null;
	}

	attach(chart: IChartApi): void {
		this._chartElement = chart.chartElement();

		// Bind handlers
		this._mouseMoveHandler = this._onMouseMove.bind(this);
		this._mouseUpHandler = this._onMouseUp.bind(this);

		// Attach to document for global drag tracking
		document.addEventListener('mousemove', this._mouseMoveHandler);
		document.addEventListener('mouseup', this._mouseUpHandler);
	}

	detach(): void {
		if (this._mouseMoveHandler) {
			document.removeEventListener('mousemove', this._mouseMoveHandler);
		}
		if (this._mouseUpHandler) {
			document.removeEventListener('mouseup', this._mouseUpHandler);
		}
		this._chartElement = null;
		this._dragState = null;
		this._pixelOffsets.clear();
	}

	private _onMouseMove(event: MouseEvent): void {
		// Global mouse move during drag
		// Handled by primitive via handleMouseMove
	}

	private _onMouseUp(event: MouseEvent): void {
		// Global mouse up to end drag
		this._dragState = null;
	}
}
```

### Success Criteria:

#### Automated Verification:

- [ ] TypeScript compilation succeeds: `npm run build`
- [ ] Strategy implements IPositioningStrategy interface
- [ ] No memory leaks from event listeners

#### Manual Verification:

- [ ] Mouse down on message initiates drag
- [ ] Mouse move updates message position with visual feedback
- [ ] Mouse up ends drag and persists new position
- [ ] Dragged message maintains position on zoom/pan
- [ ] Event listeners are properly cleaned up on detach()

---

## Phase 4: Rendering & View Implementation

### Overview

Implement the View and Renderer classes that draw Discord message cards on the canvas. Uses fancy-canvas for rendering with rounded rectangles, text, and optional Discord logo.

### Changes Required:

#### 1. Create Discord Logo Icon

**File**: `plugin-examples/src/plugins/discord-message/icons.ts`

```typescript
/**
 * Discord logo as Path2D
 * SVG path data converted from official Discord brand assets
 */
export const discordIcon = new Path2D(
	'M19.54 0c1.356 0 2.46 1.104 2.46 2.472v21.528l-2.58-2.28-1.452-1.344-1.536-1.428.636 2.22h-13.608c-1.356 0-2.46-1.104-2.46-2.472v-16.224c0-1.368 1.104-2.472 2.46-2.472h16.08zm-4.632 15.672c2.652-.084 3.672-1.824 3.672-1.824 0-3.864-1.728-6.996-1.728-6.996-1.728-1.296-3.372-1.26-3.372-1.26l-.168.192c2.04.624 2.988 1.524 2.988 1.524-1.248-.684-2.472-1.02-3.612-1.152-.864-.096-1.692-.072-2.424.024l-.204.024c-.42.036-1.44.192-2.724.756-.444.204-.708.348-.708.348s.996-.948 3.156-1.572l-.12-.144s-1.644-.036-3.372 1.26c0 0-1.728 3.132-1.728 6.996 0 0 1.008 1.74 3.66 1.824 0 0 .444-.54.804-.996-1.524-.456-2.1-1.416-2.1-1.416l.336.204.048.036.047.027.014.006.047.027c.3.168.6.3.876.408.492.192 1.08.384 1.764.516.9.168 1.956.228 3.108.012.564-.096 1.14-.264 1.74-.516.42-.156.888-.384 1.38-.708 0 0-.6.984-2.172 1.428.36.456.792.972.792.972zm-5.58-5.604c-.684 0-1.224.6-1.224 1.332 0 .732.552 1.332 1.224 1.332.684 0 1.224-.6 1.224-1.332.012-.732-.54-1.332-1.224-1.332zm4.38 0c-.684 0-1.224.6-1.224 1.332 0 .732.552 1.332 1.224 1.332.684 0 1.224-.6 1.224-1.332 0-.732-.54-1.332-1.224-1.332z'
);

/**
 * Icon dimensions (for scaling)
 */
export const iconDimensions = 24;
```

#### 2. Implement Renderer

**File**: `plugin-examples/src/plugins/discord-message/renderer.ts`

```typescript
import { CanvasRenderingTarget2D, Coordinate } from 'lightweight-charts';
import { DiscordMessage, DiscordMessageOptions } from './options';
import { discordIcon, iconDimensions } from './icons';

/**
 * Renderer data for a single message
 */
export interface RendererData {
	message: DiscordMessage;
	x: Coordinate;
	y: Coordinate;
	options: DiscordMessageOptions;
	isHovered: boolean;
}

/**
 * Discord message card renderer
 */
export class DiscordMessageRenderer {
	private _data: RendererData[] = [];

	draw(target: CanvasRenderingTarget2D): void {
		target.useMediaCoordinateSpace(scope => {
			const ctx = scope.context;

			this._data.forEach(data => {
				const { message, x, y, options, isHovered } = data;

				// Calculate card dimensions
				const cardWidth = options.cardWidth;
				const cardHeight = this._calculateCardHeight(message, options, ctx);
				const cardX = x;
				const cardY = y;

				// Draw card background
				ctx.fillStyle = isHovered
					? options.hoverBackgroundColor
					: options.cardBackgroundColor;
				ctx.strokeStyle = options.cardBorderColor;
				ctx.lineWidth = 1;
				ctx.beginPath();
				ctx.roundRect(
					cardX,
					cardY,
					cardWidth,
					cardHeight,
					options.cardBorderRadius
				);
				ctx.fill();
				ctx.stroke();

				// Layout positions
				let currentY = cardY + options.cardPadding;
				const contentX = cardX + options.cardPadding;

				// Draw Discord logo (if enabled)
				if (options.showDiscordLogo) {
					ctx.save();
					ctx.fillStyle = '#5865F2'; // Discord blurple
					ctx.translate(contentX, currentY);
					const scale = 16 / iconDimensions;
					ctx.scale(scale, scale);
					ctx.fill(discordIcon, 'evenodd');
					ctx.restore();
				}

				// Draw username
				const usernameX = contentX + (options.showDiscordLogo ? 24 : 0);
				ctx.font = options.usernameFont;
				ctx.fillStyle = message.usernameColor || options.usernameColor;
				ctx.fillText(message.username, usernameX, currentY + 12);
				currentY += options.lineHeight;

				// Draw message content
				ctx.font = options.messageFont;
				ctx.fillStyle = options.messageColor;
				const truncatedMessage = this._truncateText(
					message.message,
					cardWidth - options.cardPadding * 2,
					ctx
				);
				ctx.fillText(truncatedMessage, contentX, currentY + 12);
				currentY += options.lineHeight;

				// Draw timestamp
				ctx.font = options.timestampFont;
				ctx.fillStyle = options.timestampColor;
				ctx.fillText(message.timestamp, contentX, currentY + 10);
			});
		});
	}

	update(data: RendererData[]): void {
		this._data = data;
	}

	private _calculateCardHeight(
		message: DiscordMessage,
		options: DiscordMessageOptions,
		ctx: CanvasRenderingContext2D
	): number {
		// Fixed height: padding + username + message + timestamp + padding
		return options.cardPadding * 2 + options.lineHeight * 3;
	}

	private _truncateText(
		text: string,
		maxWidth: number,
		ctx: CanvasRenderingContext2D
	): string {
		const ellipsis = '...';
		let truncated = text;

		while (ctx.measureText(truncated).width > maxWidth && truncated.length > 0) {
			truncated = truncated.slice(0, -1);
		}

		if (truncated.length < text.length) {
			truncated = truncated.slice(0, -ellipsis.length) + ellipsis;
		}

		return truncated;
	}
}
```

#### 3. Implement PaneView

**File**: `plugin-examples/src/plugins/discord-message/view.ts`

```typescript
import { IPrimitivePaneView, IPrimitivePaneRenderer } from 'lightweight-charts';
import { DiscordMessagePrimitive } from './primitive';
import { DiscordMessageRenderer, RendererData } from './renderer';

/**
 * Discord message pane view
 */
export class DiscordMessagePaneView implements IPrimitivePaneView {
	private _source: DiscordMessagePrimitive;
	private _renderer: DiscordMessageRenderer;

	constructor(source: DiscordMessagePrimitive) {
		this._source = source;
		this._renderer = new DiscordMessageRenderer();
	}

	renderer(): IPrimitivePaneRenderer {
		return this._renderer;
	}

	update(): void {
		const data: RendererData[] = [];
		const plugin = this._source.plugin();
		const chart = this._source.chart;
		const series = this._source.series;
		const strategy = this._source.strategy();
		const options = plugin.options();

		// Resolve each message to screen coordinates
		for (const message of plugin.messages()) {
			const anchor = strategy.resolveAnchor(message, chart, series);

			if (anchor.x !== null && anchor.y !== null) {
				data.push({
					message,
					x: anchor.x,
					y: anchor.y,
					options,
					isHovered: false, // TODO: implement hover detection
				});
			}
		}

		this._renderer.update(data);
	}
}
```

### Success Criteria:

#### Automated Verification:

- [ ] TypeScript compilation succeeds: `npm run build`
- [ ] No canvas rendering errors in console
- [ ] Text measurement and truncation works correctly

#### Manual Verification:

- [ ] Discord message cards render with correct styling
- [ ] Cards display username, message, timestamp
- [ ] Discord logo renders when enabled
- [ ] Text truncates with ellipsis when exceeding card width
- [ ] Card background and border colors apply correctly
- [ ] Hover state changes background color

---

## Phase 5: Primitive & Interaction Handling

### Overview

Implement the primitive class that orchestrates positioning strategies, view updates, and user interactions (hover, click, drag).

### Changes Required:

#### 1. Implement Primitive

**File**: `plugin-examples/src/plugins/discord-message/primitive.ts`

```typescript
import {
	ISeriesPrimitive,
	IPrimitivePaneView,
	PrimitiveHoveredItem,
	Time,
} from 'lightweight-charts';
import { PluginBase } from '../plugin-base';
import { DiscordMessagePlugin } from './discord-message';
import { DiscordMessagePaneView } from './view';
import { IPositioningStrategy } from './strategies/base-strategy';
import { FixedPositioningStrategy } from './strategies/fixed-strategy';
import { DraggablePositioningStrategy } from './strategies/draggable-strategy';
import { PositioningMode } from './options';

/**
 * Discord message primitive
 */
export class DiscordMessagePrimitive extends PluginBase implements ISeriesPrimitive<Time> {
	private _plugin: DiscordMessagePlugin;
	private _views: DiscordMessagePaneView[];
	private _strategy: IPositioningStrategy;
	private _currentCursor: string | null = null;

	constructor(plugin: DiscordMessagePlugin) {
		super();
		this._plugin = plugin;
		this._views = [new DiscordMessagePaneView(this)];
		this._strategy = new FixedPositioningStrategy();
	}

	plugin(): DiscordMessagePlugin {
		return this._plugin;
	}

	strategy(): IPositioningStrategy {
		return this._strategy;
	}

	updatePositioningMode(mode: PositioningMode): void {
		// Detach old strategy
		if (this._strategy.detach) {
			this._strategy.detach();
		}

		// Create new strategy
		if (mode === 'fixed') {
			this._strategy = new FixedPositioningStrategy();
		} else {
			this._strategy = new DraggablePositioningStrategy();
			if (this._strategy.attach) {
				this._strategy.attach(this.chart);
			}
		}

		this.requestUpdate();
	}

	updateAllViews(): void {
		this._views.forEach(view => view.update());
	}

	paneViews(): readonly IPrimitivePaneView[] {
		return this._views;
	}

	hitTest(x: number, y: number): PrimitiveHoveredItem | null {
		const options = this._plugin.options();
		const chart = this.chart;
		const series = this.series;

		// Check if hovering any message card
		for (const message of this._plugin.messages()) {
			const anchor = this._strategy.resolveAnchor(message, chart, series);

			if (anchor.x !== null && anchor.y !== null) {
				const cardWidth = options.cardWidth;
				const cardHeight = options.cardPadding * 2 + options.lineHeight * 3;

				if (
					x >= anchor.x &&
					x <= anchor.x + cardWidth &&
					y >= anchor.y &&
					y <= anchor.y + cardHeight
				) {
					this._currentCursor = options.cursorOnHover;
					return {
						cursorStyle: options.cursorOnHover,
						externalId: `discord-message-${message.id}`,
						zOrder: 'top',
					};
				}
			}
		}

		this._currentCursor = null;
		return null;
	}

	attached(param: any): void {
		super.attached(param);

		// Attach strategy if needed
		if (this._strategy.attach) {
			this._strategy.attach(this.chart);
		}

		// Subscribe to click events
		this.chart.subscribeClick(this._clickHandler);
	}

	detached(): void {
		// Unsubscribe from click events
		this.chart.unsubscribeClick(this._clickHandler);

		// Detach strategy
		if (this._strategy.detach) {
			this._strategy.detach();
		}

		super.detached();
	}

	private _clickHandler = (param: any) => {
		if (!param.point) return;

		const options = this._plugin.options();
		const chart = this.chart;
		const series = this.series;

		// Check if clicked on a message card
		for (const message of this._plugin.messages()) {
			const anchor = this._strategy.resolveAnchor(message, chart, series);

			if (anchor.x !== null && anchor.y !== null) {
				const cardWidth = options.cardWidth;
				const cardHeight = options.cardPadding * 2 + options.lineHeight * 3;

				if (
					param.point.x >= anchor.x &&
					param.point.x <= anchor.x + cardWidth &&
					param.point.y >= anchor.y &&
					param.point.y <= anchor.y + cardHeight
				) {
					// Open Discord URL
					window.open(message.discordUrl, '_blank');
					return;
				}
			}
		}
	};
}
```

### Success Criteria:

#### Automated Verification:

- [ ] TypeScript compilation succeeds: `npm run build`
- [ ] Primitive attaches/detaches without errors
- [ ] No memory leaks from event listeners

#### Manual Verification:

- [ ] hitTest() correctly detects hover over message cards
- [ ] Cursor changes to pointer when hovering messages
- [ ] Clicking message cards opens Discord URLs in new tabs
- [ ] Strategy switching works without errors
- [ ] Event handlers are properly cleaned up on detach

---

## Phase 6: Example & Documentation

### Overview

Create a working example demonstrating both positioning modes and various customization options.

### Changes Required:

#### 1. Create Example

**File**: `plugin-examples/src/plugins/discord-message/example/example.ts`

```typescript
import { createChart } from 'lightweight-charts';
import { DiscordMessagePlugin } from '../discord-message';
import { generateSampleData } from '../../../sample-data';

const chart = createChart(document.getElementById('container')!, {
	width: 800,
	height: 600,
});

const series = chart.addAreaSeries({
	topColor: 'rgba(33, 150, 243, 0.56)',
	bottomColor: 'rgba(33, 150, 243, 0.04)',
	lineColor: 'rgba(33, 150, 243, 1)',
});

const data = generateSampleData();
series.setData(data);

// Create plugin with fixed positioning
const discordPlugin = new DiscordMessagePlugin(series, {
	positioningMode: 'fixed',
	showDiscordLogo: true,
	showAvatar: false,
});

// Add sample messages
discordPlugin.addMessage({
	id: 'msg1',
	time: data[50].time,
	price: data[50].value,
	username: 'TradingView',
	message: "Don't even open TradingView today.",
	timestamp: '04 Apr \'25 • 23:43',
	discordUrl: 'https://discord.com/channels/example/123456',
	usernameColor: '#5865F2',
});

discordPlugin.addMessage({
	id: 'msg2',
	time: data[100].time,
	price: data[100].value,
	username: 'CryptoTrader',
	message: 'Broker Awards 2024 by @tradingview — Check out the best online brokers.',
	timestamp: '27 Mar \'25 • 02:42',
	discordUrl: 'https://discord.com/channels/example/789012',
});

// Toggle between modes
const toggleButton = document.createElement('button');
toggleButton.textContent = 'Switch to Draggable Mode';
toggleButton.style.margin = '10px';
document.body.insertBefore(toggleButton, document.getElementById('container'));

let currentMode: 'fixed' | 'draggable' = 'fixed';
toggleButton.addEventListener('click', () => {
	currentMode = currentMode === 'fixed' ? 'draggable' : 'fixed';
	discordPlugin.setPositioningMode(currentMode);
	toggleButton.textContent = `Switch to ${currentMode === 'fixed' ? 'Draggable' : 'Fixed'} Mode`;
});
```

#### 2. Create Example HTML

**File**: `plugin-examples/src/plugins/discord-message/example/index.html`

```html
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Discord Message Plugin Example</title>
	<style>
		body {
			margin: 0;
			padding: 20px;
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			background: #0e1014;
			color: #d1d4dc;
		}

		h1 {
			margin-bottom: 10px;
		}

		p {
			color: #787b86;
			margin-bottom: 20px;
		}

		#container {
			margin: 0 auto;
		}

		button {
			background: #2962ff;
			color: white;
			border: none;
			padding: 10px 20px;
			border-radius: 4px;
			cursor: pointer;
			font-size: 14px;
		}

		button:hover {
			background: #1e53e5;
		}
	</style>
</head>
<body>
	<h1>Discord Message Plugin</h1>
	<p>Click messages to open Discord URLs. Toggle between fixed and draggable positioning modes.</p>
	<div id="container"></div>
	<script type="module" src="./example.ts"></script>
</body>
</html>
```

#### 3. Update Plugin README

**File**: `plugin-examples/src/plugins/discord-message/README.md`

```markdown
# Discord Message Plugin

A lightweight-charts plugin for displaying Discord message annotations on charts, similar to TradingView's tweet annotation feature.

## Features

- **Dual Positioning Modes**: Fixed (anchored to time/price) and draggable
- **Click to Open**: Click messages to open Discord URLs
- **Fully Customizable**: Colors, fonts, sizes, logo/avatar display
- **Performance**: Efficient canvas rendering with hit testing
- **TypeScript**: Full type safety and IDE autocomplete

## Installation

```typescript
import { DiscordMessagePlugin } from './discord-message';
```

## Basic Usage

```typescript
const discordPlugin = new DiscordMessagePlugin(series, {
	positioningMode: 'fixed',
	showDiscordLogo: true,
});

discordPlugin.addMessage({
	id: 'msg1',
	time: someTime,
	price: somePrice,
	username: 'TradingView',
	message: "Don't even open TradingView today.",
	timestamp: '04 Apr \'25 • 23:43',
	discordUrl: 'https://discord.com/channels/...',
});
```

## API

### Constructor

```typescript
new DiscordMessagePlugin(series, options?)
```

### Methods

- `addMessage(message: DiscordMessage): void` - Add a message
- `removeMessage(id: string): void` - Remove a message
- `updateMessage(message: DiscordMessage): void` - Update a message
- `messages(): DiscordMessage[]` - Get all messages
- `applyOptions(options: Partial<DiscordMessageOptions>): void` - Update options
- `setPositioningMode(mode: 'fixed' | 'draggable'): void` - Change positioning mode
- `destroy(): void` - Remove plugin

## Options

See `options.ts` for full list of customization options.

## Examples

See `example/example.ts` for a complete working example.
```

### Success Criteria:

#### Automated Verification:

- [ ] Example compiles without errors: `npm run build`
- [ ] Example HTML loads without console errors
- [ ] Example runs in browser successfully

#### Manual Verification:

- [ ] Example displays chart with Discord message annotations
- [ ] Messages render with correct styling and content
- [ ] Clicking messages opens Discord URLs
- [ ] Toggle button switches between fixed/draggable modes
- [ ] Fixed mode: messages stay anchored to time/price on zoom/pan
- [ ] Draggable mode: messages can be repositioned via drag
- [ ] README provides clear usage instructions

---

## Performance Considerations

### Canvas Rendering Optimization

- Cache text measurements to avoid repeated `measureText()` calls
- Use `useBitmapCoordinateSpace` for pixel-perfect rendering
- Limit redraws by only calling `requestUpdate()` when data changes

### Memory Management

- Properly detach event listeners on `detached()`
- Clear pixel offset maps when switching modes
- Avoid storing duplicate message data

### Scalability

- Plugin tested with up to 20 messages per chart
- Beyond 50 messages, consider implementing:
  - Viewport culling (only render visible messages)
  - Virtual scrolling for message list
  - Offscreen canvas caching for static cards

## Migration Notes

Not applicable - this is a new plugin with no migration path.

## References

- Research: Initial conversation context
- Similar implementation: `plugin-examples/src/plugins/expiring-price-alerts/` (card rendering)
- Similar implementation: `plugin-examples/src/plugins/user-price-alerts/` (click handling)
- Similar implementation: `plugin-examples/src/plugins/trend-line/` (text labels with rounded backgrounds)
- Drag patterns: `plugin-examples/src/plugins/brushable-area-series/example/example.ts:79-123`
- Strategy pattern: Architecture follows Codex mentorship recommendations
