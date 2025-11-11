/**
 * X.com (Twitter) platform adapter implementation.
 * Provides X-specific branding, theming, icon rendering, and verified badge support.
 */

import { IPlatformAdapter } from './platform-adapter';
import { SocialMessageOptions } from '../options';

/**
 * X.com (Twitter) logo as Path2D
 * The new X logo introduced after Twitter rebrand
 */
const xIcon = new Path2D(
	'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'
);

/**
 * Verified badge checkmark as Path2D
 * Twitter/X blue verified badge
 */
const verifiedBadge = new Path2D(
	'M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.4-1.4 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z'
);

/**
 * X.com brand color (Twitter blue)
 */
const X_BRAND_COLOR = '#1DA1F2';

/**
 * Verified badge color (blue)
 */
const VERIFIED_BADGE_COLOR = '#1DA1F2';

/**
 * X.com Adapter - implements X/Twitter-specific behavior
 */
export class XAdapter implements IPlatformAdapter {
	public readonly platformName = 'x';

	getBrandColor(): string {
		return X_BRAND_COLOR;
	}

	getDefaultTheme(): Partial<SocialMessageOptions> {
		return {
			cardBackgroundColor: '#000000',
			cardBorderColor: '#2f3336',
			usernameColor: '#e7e9ea',
			messageColor: '#e7e9ea',
			timestampColor: '#71767b',
			hoverBackgroundColor: '#16181c',
		};
	}

	openUrl(url: string): void {
		window.open(url, '_blank', 'noopener,noreferrer');
	}

	renderIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
		ctx.save();

		// Scale the icon to fit the desired size
		// Original icon viewBox is approximately 24x24
		const scale = size / 24;
		ctx.translate(x, y);
		ctx.scale(scale, scale);

		// Fill with X brand color (white on dark backgrounds typically)
		ctx.fillStyle = '#ffffff';
		ctx.fill(xIcon, 'evenodd');

		ctx.restore();
	}

	/**
	 * Renders the verified badge (blue checkmark) for verified users.
	 * This is called when a message has verified=true metadata.
	 *
	 * @param ctx - Canvas rendering context
	 * @param x - X coordinate for badge
	 * @param y - Y coordinate for badge
	 * @param metadata - Should contain { verified: boolean }
	 */
	renderBadge(
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		metadata: Record<string, any>
	): void {
		if (!metadata.verified) {
			return;
		}

		ctx.save();

		// Scale badge to appropriate size (smaller than main icon)
		const badgeSize = 16;
		const scale = badgeSize / 24;
		ctx.translate(x, y);
		ctx.scale(scale, scale);

		// Fill with verified badge color
		ctx.fillStyle = VERIFIED_BADGE_COLOR;
		ctx.fill(verifiedBadge, 'evenodd');

		ctx.restore();
	}
}
