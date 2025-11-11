/**
 * Platform adapter interface for multi-platform social message support.
 * Each platform (Discord, X.com, Telegram, etc.) implements this interface
 * to provide platform-specific behavior, styling, and branding.
 */

import { SocialMessageOptions } from '../options';

/**
 * Interface that each platform adapter must implement.
 * Provides platform-specific icons, colors, themes, and URL handling.
 */
export interface IPlatformAdapter {
	/**
	 * Unique identifier for the platform (e.g., 'discord', 'x', 'telegram')
	 */
	readonly platformName: string;

	/**
	 * Returns the platform's brand/icon color (e.g., Discord blurple #5865F2)
	 */
	getBrandColor(): string;

	/**
	 * Returns default theme options specific to this platform.
	 * These will be merged with user-provided options.
	 */
	getDefaultTheme(): Partial<SocialMessageOptions>;

	/**
	 * Opens a platform-specific URL in a new tab/window.
	 * Allows platforms to customize URL handling if needed.
	 *
	 * @param url - The platform-specific URL to open
	 */
	openUrl(url: string): void;

	/**
	 * Renders the platform icon on the canvas.
	 * Each platform can implement custom rendering logic for its icon.
	 *
	 * @param ctx - The canvas rendering context
	 * @param x - X coordinate for the icon
	 * @param y - Y coordinate for the icon
	 * @param size - Size of the icon (width and height)
	 */
	renderIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void;

	/**
	 * Optional: Render additional platform-specific badges or indicators.
	 * For example, X.com verified badge, Telegram pinned indicator, etc.
	 *
	 * @param ctx - The canvas rendering context
	 * @param x - X coordinate for the badge
	 * @param y - Y coordinate for the badge
	 * @param metadata - Platform-specific metadata (e.g., verified status)
	 */
	renderBadge?(
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		metadata: Record<string, any>
	): void;
}
