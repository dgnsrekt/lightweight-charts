import { Coordinate } from 'lightweight-charts';
import { DiscordMessage, DiscordMessageOptions } from '../options';

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
