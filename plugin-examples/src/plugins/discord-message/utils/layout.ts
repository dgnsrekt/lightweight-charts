import { DiscordMessageOptions } from '../options';

/**
 * Calculate the height of a Discord message card based on options
 *
 * Fixed height formula: padding + username + message + timestamp + padding
 *
 * @param options - Discord message options containing cardPadding and lineHeight
 * @returns The calculated card height in pixels
 */
export function calculateCardHeight(options: DiscordMessageOptions): number {
	return options.cardPadding * 2 + options.lineHeight * 3;
}

/**
 * Get card dimensions for a Discord message
 *
 * @param options - Discord message options
 * @returns Object containing cardWidth and cardHeight
 */
export function getCardDimensions(options: DiscordMessageOptions): { width: number; height: number } {
	return {
		width: options.cardWidth,
		height: calculateCardHeight(options),
	};
}
