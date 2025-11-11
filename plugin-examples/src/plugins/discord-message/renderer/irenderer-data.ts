import { Coordinate } from 'lightweight-charts';
import { DiscordMessage, DiscordMessageOptions } from '../options';

/**
 * Renderer data for a single message
 */
export interface RendererData {
	message: DiscordMessage;
	x: Coordinate; // Card position X
	y: Coordinate; // Card position Y
	anchorX: Coordinate | null; // Original time anchor point
	anchorY: Coordinate | null; // Original price anchor point
	options: DiscordMessageOptions;
	isHovered: boolean;
}
