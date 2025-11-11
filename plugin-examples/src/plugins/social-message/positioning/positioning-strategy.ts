import { IChartApi, ISeriesApi, SeriesOptionsMap, Coordinate } from 'lightweight-charts';
import { SocialMessage } from '../options';

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
		message: SocialMessage,
		chart: IChartApi,
		series: ISeriesApi<keyof SeriesOptionsMap>
	): AnchorPoint;

	/**
	 * Handle mouse down event (for draggable mode)
	 */
	handleMouseDown?(
		message: SocialMessage,
		eventData: MouseEventData,
		chart: IChartApi,
		series: ISeriesApi<keyof SeriesOptionsMap>
	): void;

	/**
	 * Handle mouse move event (for draggable mode)
	 */
	handleMouseMove?(
		message: SocialMessage,
		eventData: MouseEventData,
		chart: IChartApi,
		series: ISeriesApi<keyof SeriesOptionsMap>
	): void;

	/**
	 * Handle mouse up event (for draggable mode)
	 */
	handleMouseUp?(
		message: SocialMessage,
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
