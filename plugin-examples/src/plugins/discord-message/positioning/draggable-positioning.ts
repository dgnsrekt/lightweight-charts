import { IChartApi, ISeriesApi, SeriesOptionsMap, Coordinate } from 'lightweight-charts';
import { DiscordMessage } from '../options';
import { IPositioningStrategy, AnchorPoint, MouseEventData } from './positioning-strategy';

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
		_chart: IChartApi,
		_series: ISeriesApi<keyof SeriesOptionsMap>
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
		_eventData: MouseEventData,
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

	attach(_chart: IChartApi): void {
		// Strategy is now stateless - primitive manages all event lifecycle
	}

	detach(): void {
		// Clear any cached offsets and state
		this._dragState = null;
		this._pixelOffsets.clear();
	}
}
