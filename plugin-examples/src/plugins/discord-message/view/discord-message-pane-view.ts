import {
	IPrimitivePaneView,
	IPrimitivePaneRenderer,
	PrimitivePaneViewZOrder,
} from 'lightweight-charts';
import { DiscordMessagePrimitive } from '../discord-message';
import { DiscordMessagePaneRenderer } from '../renderer/discord-message-pane-renderer';
import { RendererData } from '../renderer/irenderer-data';

/**
 * Discord message pane view
 */
export class DiscordMessagePaneView implements IPrimitivePaneView {
	private _source: DiscordMessagePrimitive;
	private _renderer: DiscordMessagePaneRenderer;

	constructor(source: DiscordMessagePrimitive) {
		this._source = source;
		this._renderer = new DiscordMessagePaneRenderer();
	}

	zOrder(): PrimitivePaneViewZOrder {
		return 'top';
	}

	renderer(): IPrimitivePaneRenderer {
		return this._renderer;
	}

	update(): void {
		const data: RendererData[] = [];
		const chart = this._source.chart;
		const series = this._source.series;
		const strategy = this._source.strategy();
		const options = this._source.options();
		const hoveredId = this._source.hoveredMessageId();

		// Resolve each message to screen coordinates
		for (const message of this._source.messages()) {
			const anchor = strategy.resolveAnchor(message, chart, series);

			if (anchor.x !== null && anchor.y !== null) {
				// Calculate original time/price anchor point (base position without offsets)
				const timeScale = chart.timeScale();
				const baseX = timeScale.timeToCoordinate(message.time);
				const baseY = series.priceToCoordinate(message.price);

				data.push({
					message,
					x: anchor.x, // Card position (may include drag offset)
					y: anchor.y,
					anchorX: baseX, // Original time/price anchor
					anchorY: baseY,
					options,
					isHovered: message.id === hoveredId,
				});
			}
		}

		this._renderer.update(data);
	}
}
