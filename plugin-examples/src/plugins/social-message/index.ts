/**
 * Social Message Plugin
 * Multi-platform social media message annotations for lightweight-charts
 */

// Main plugin
export { SocialMessagePrimitive } from './social-message';

// Types and interfaces
export type { SocialMessage, SocialMessageOptions, PositioningMode } from './options';
export { createDefaultOptions, defaultOptions } from './options';

// Platform adapters
export type { IPlatformAdapter } from './adapters';
export {
	DiscordAdapter,
	XAdapter,
	TelegramAdapter,
} from './adapters';

// Positioning strategies (for advanced usage)
export type { IPositioningStrategy } from './positioning/positioning-strategy';
export { FixedPositioningStrategy } from './positioning/fixed-positioning';
export { DraggablePositioningStrategy } from './positioning/draggable-positioning';
