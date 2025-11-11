import { CanvasRenderingTarget2D } from 'fancy-canvas';
import { IPrimitivePaneRenderer } from 'lightweight-charts';
import { RendererData } from './irenderer-data';
import { discordIcon, iconDimensions } from './icons';

/**
 * Discord message card renderer
 */
export class DiscordMessagePaneRenderer implements IPrimitivePaneRenderer {
	private _data: RendererData[] = [];

	draw(target: CanvasRenderingTarget2D): void {
		target.useMediaCoordinateSpace(scope => {
			const ctx = scope.context;

			this._data.forEach(data => {
				const { message, x, y, anchorX, anchorY, options, isHovered } = data;

				// Calculate card dimensions
				const cardWidth = options.cardWidth;
				const cardHeight = this._calculateCardHeight(options);
				const cardX = x;
				const cardY = y;

				// Draw crosshair lines connecting card to anchor point
				if (anchorX !== null && anchorY !== null) {
					ctx.strokeStyle = 'rgba(120, 123, 134, 0.5)';
					ctx.lineWidth = 2;

					// Calculate card edge connection points
					const cardCenterX = cardX + cardWidth / 2;
					const cardTopY = cardY;
					const cardBottomY = cardY + cardHeight;

					// Determine if card is above or below anchor (connect to top or bottom)
					const connectToTop = cardY > anchorY;
					const cardConnectY = connectToTop ? cardTopY : cardBottomY;

					// Check if card is directly above/below anchor (within small threshold)
					const horizontalOffset = Math.abs(cardCenterX - anchorX);
					const isDirectlyAbove = horizontalOffset < 5; // 5px threshold

					if (isDirectlyAbove) {
						// Single vertical line from card to anchor point (price level)
						ctx.beginPath();
						ctx.moveTo(cardCenterX, cardConnectY);
						ctx.lineTo(cardCenterX, anchorY);
						ctx.stroke();
					} else {
						// Three-segment line: vertical from card, horizontal, vertical to anchor point
						ctx.beginPath();

						// 1. Vertical line from card down/up to horizontal connector level
						const horizontalLineY = anchorY;
						ctx.moveTo(cardCenterX, cardConnectY);
						ctx.lineTo(cardCenterX, horizontalLineY);

						// 2. Horizontal line from card's vertical to anchor's vertical
						ctx.lineTo(anchorX, horizontalLineY);

						// 3. Vertical line from horizontal connector to anchor point (price level)
						// (This is just a point, no line needed since we're already at anchorY)

						ctx.stroke();
					}

					// Draw a small dot at the anchor point (where line meets price)
					ctx.fillStyle = 'rgba(120, 123, 134, 0.8)';
					ctx.beginPath();
					ctx.arc(anchorX, anchorY, 3, 0, Math.PI * 2);
					ctx.fill();
				}

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
