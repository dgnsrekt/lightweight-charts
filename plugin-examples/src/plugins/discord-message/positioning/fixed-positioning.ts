import { IChartApi, ISeriesApi, SeriesOptionsMap } from 'lightweight-charts';
import { DiscordMessage } from '../options';
import { IPositioningStrategy, AnchorPoint } from './positioning-strategy';

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
