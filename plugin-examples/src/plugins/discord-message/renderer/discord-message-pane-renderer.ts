import { CanvasRenderingTarget2D } from 'fancy-canvas';
import { IPrimitivePaneRenderer } from 'lightweight-charts';
import { RendererData } from './irenderer-data';
import { discordIcon, iconDimensions } from './icons';
import { positionsLine } from '../../../helpers/dimensions/positions';

/**
 * Discord message card renderer
 */
export class DiscordMessagePaneRenderer implements IPrimitivePaneRenderer {
	private _data: RendererData[] = [];

	draw(target: CanvasRenderingTarget2D): void {
		// First pass: Draw crosshair reference lines FROM anchor point in bitmap space
		target.useBitmapCoordinateSpace(scope => {
			const ctx = scope.context;

			this._data.forEach(data => {
				const { x, y } = data;

				// x, y represent the anchor point (time/price location on chart)
				const anchorX = x;
				const anchorY = y;

				// More visible color for better clarity
				ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';

				// VERTICAL LINE - from anchor point down to time axis (bottom)
				const verticalLinePos = positionsLine(anchorX, scope.horizontalPixelRatio, 1);
				const anchorYBitmap = anchorY * scope.verticalPixelRatio;

				ctx.fillRect(
					verticalLinePos.position,
					anchorYBitmap,  // Start FROM anchor point
					verticalLinePos.length,
					scope.bitmapSize.height - anchorYBitmap  // Down to bottom
				);

				// HORIZONTAL LINE - from anchor point left to price axis
				const horizontalLinePos = positionsLine(anchorY, scope.verticalPixelRatio, 1);
				const anchorXBitmap = anchorX * scope.horizontalPixelRatio;

				ctx.fillRect(
					0,  // Start from left edge (price axis)
					horizontalLinePos.position,
					anchorXBitmap,  // Extend to anchor point
					horizontalLinePos.length
				);
			});
		});

		// Second pass: Draw message cards in media space
		target.useMediaCoordinateSpace(scope => {
			const ctx = scope.context;

			this._data.forEach(data => {
				const { message, x, y, options, isHovered } = data;

				// Calculate card dimensions
				const cardWidth = options.cardWidth;
				const cardHeight = this._calculateCardHeight(options);
				const cardX = x;
				const cardY = y;

				// Draw card background
				ctx.fillStyle = isHovered
					? options.hoverBackgroundColor
					: options.cardBackgroundColor;
				ctx.strokeStyle = options.cardBorderColor;
				ctx.lineWidth = 1;
				ctx.beginPath();
				ctx.roundRect(
					cardX,
					cardY,
					cardWidth,
					cardHeight,
					options.cardBorderRadius
				);
				ctx.fill();
				ctx.stroke();

				// Layout positions
				let currentY = cardY + options.cardPadding;
				const contentX = cardX + options.cardPadding;

				// Draw Discord logo (if enabled)
				if (options.showDiscordLogo) {
					ctx.save();
					ctx.fillStyle = '#5865F2'; // Discord blurple
					ctx.translate(contentX, currentY);
					const scale = 16 / iconDimensions;
					ctx.scale(scale, scale);
					ctx.fill(discordIcon, 'evenodd');
					ctx.restore();
				}

				// Draw username
				const usernameX = contentX + (options.showDiscordLogo ? 24 : 0);
				ctx.font = options.usernameFont;
				ctx.fillStyle = message.usernameColor || options.usernameColor;
				ctx.fillText(message.username, usernameX, currentY + 12);
				currentY += options.lineHeight;

				// Draw message content
				ctx.font = options.messageFont;
				ctx.fillStyle = options.messageColor;
				const truncatedMessage = this._truncateText(
					message.message,
					cardWidth - options.cardPadding * 2,
					ctx
				);
				ctx.fillText(truncatedMessage, contentX, currentY + 12);
				currentY += options.lineHeight;

				// Draw timestamp
				ctx.font = options.timestampFont;
				ctx.fillStyle = options.timestampColor;
				ctx.fillText(message.timestamp, contentX, currentY + 10);
			});
		});
	}

	update(data: RendererData[]): void {
		this._data = data;
	}

	private _calculateCardHeight(
		options: any
	): number {
		// Fixed height: padding + username + message + timestamp + padding
		return options.cardPadding * 2 + options.lineHeight * 3;
	}

	private _truncateText(
		text: string,
		maxWidth: number,
		ctx: CanvasRenderingContext2D
	): string {
		const ellipsis = '...';
		let truncated = text;

		while (ctx.measureText(truncated).width > maxWidth && truncated.length > 0) {
			truncated = truncated.slice(0, -1);
		}

		if (truncated.length < text.length) {
			truncated = truncated.slice(0, -ellipsis.length) + ellipsis;
		}

		return truncated;
	}
}
