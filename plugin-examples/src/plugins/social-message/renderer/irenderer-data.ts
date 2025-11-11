import { Coordinate } from 'lightweight-charts';
import { SocialMessage, SocialMessageOptions } from '../options';

/**
 * Renderer data for a single message
 */
export interface RendererData {
	message: SocialMessage;
	x: Coordinate; // Card position X
	y: Coordinate; // Card position Y
	anchorX: Coordinate | null; // Original time anchor point
	anchorY: Coordinate | null; // Original price anchor point
	options: SocialMessageOptions;
	isHovered: boolean;
}
