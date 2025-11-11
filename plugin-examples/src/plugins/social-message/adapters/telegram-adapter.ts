/**
 * Telegram platform adapter implementation.
 * Provides Telegram-specific branding, theming, and icon rendering.
 */

import { IPlatformAdapter } from './platform-adapter';
import { SocialMessageOptions } from '../options';

/**
 * Telegram logo as Path2D
 * Paper airplane icon from Telegram's official branding
 */
const telegramIcon = new Path2D(
	'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z'
);

/**
 * Telegram brand color (light blue)
 */
const TELEGRAM_BRAND_COLOR = '#2AABEE';

/**
 * Telegram Adapter - implements Telegram-specific behavior
 */
export class TelegramAdapter implements IPlatformAdapter {
	public readonly platformName = 'telegram';

	getBrandColor(): string {
		return TELEGRAM_BRAND_COLOR;
	}

	getDefaultTheme(): Partial<SocialMessageOptions> {
		return {
			cardBackgroundColor: '#17212b',
			cardBorderColor: '#0e1621',
			usernameColor: '#ffffff',
			messageColor: '#f5f5f5',
			timestampColor: '#707579',
			hoverBackgroundColor: '#242f3d',
		};
	}

	openUrl(url: string): void {
		window.open(url, '_blank', 'noopener,noreferrer');
	}

	renderIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
		ctx.save();

		// Scale the icon to fit the desired size
		// Original icon viewBox is 24x24
		const scale = size / 24;
		ctx.translate(x, y);
		ctx.scale(scale, scale);

		// Fill with Telegram brand color
		ctx.fillStyle = this.getBrandColor();
		ctx.fill(telegramIcon, 'evenodd');

		ctx.restore();
	}
}
