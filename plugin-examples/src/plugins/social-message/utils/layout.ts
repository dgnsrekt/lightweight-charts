import { SocialMessageOptions } from '../options';

/**
 * Calculate the height of a social message card based on options
 *
 * Fixed height formula: padding + username + message + timestamp + padding
 *
 * @param options - Social message options containing cardPadding and lineHeight
 * @returns The calculated card height in pixels
 */
export function calculateCardHeight(options: SocialMessageOptions): number {
	return options.cardPadding * 2 + options.lineHeight * 3;
}

/**
 * Get card dimensions for a social message
 *
 * @param options - Social message options
 * @returns Object containing cardWidth and cardHeight
 */
export function getCardDimensions(options: SocialMessageOptions): { width: number; height: number } {
	return {
		width: options.cardWidth,
		height: calculateCardHeight(options),
	};
}
