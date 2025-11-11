import { createChart, AreaSeries } from 'lightweight-charts';
import { DiscordMessagePrimitive } from '../discord-message';
import { generateLineData } from '../../../sample-data';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
	grid: {
		vertLines: {
			visible: false,
		},
		horzLines: {
			visible: false,
		},
	},
}));

const series = chart.addSeries(AreaSeries, {
	topColor: 'rgba(33, 150, 243, 0.56)',
	bottomColor: 'rgba(33, 150, 243, 0.04)',
	lineColor: 'rgba(33, 150, 243, 1)',
});

const data = generateLineData();
series.setData(data);

// Create plugin with fixed positioning
const discordPlugin = new DiscordMessagePrimitive({
	positioningMode: 'fixed',
	showDiscordLogo: true,
	showAvatar: false,
});

series.attachPrimitive(discordPlugin);

// Add sample messages
discordPlugin.addMessage({
	id: 'msg1',
	time: data[50].time,
	price: data[50].value,
	username: 'TradingView',
	message: "Don't even open TradingView today.",
	timestamp: '21 Feb \'18 • 12:00',
	discordUrl: 'https://discord.com/channels/example/123456',
	usernameColor: '#5865F2',
});

discordPlugin.addMessage({
	id: 'msg2',
	time: data[100].time,
	price: data[100].value,
	username: 'CryptoTrader',
	message: 'Broker Awards 2024 by @tradingview — Check out the best online brokers.',
	timestamp: '11 Apr \'18 • 12:00',
	discordUrl: 'https://discord.com/channels/example/789012',
});

discordPlugin.addMessage({
	id: 'msg3',
	time: data[200].time,
	price: data[200].value,
	username: 'ChartWizard',
	message: 'New resistance level confirmed! Watch for breakout.',
	timestamp: '20 Jul \'18 • 12:00',
	discordUrl: 'https://discord.com/channels/example/345678',
	usernameColor: '#FFA500',
});

// Toggle between modes
const toggleButton = document.getElementById('mode-toggle')!;
let currentMode: 'fixed' | 'draggable' = 'fixed';
toggleButton.addEventListener('click', () => {
	currentMode = currentMode === 'fixed' ? 'draggable' : 'fixed';
	discordPlugin.setPositioningMode(currentMode);
	toggleButton.textContent = `Switch to ${currentMode === 'fixed' ? 'Draggable' : 'Fixed'} Mode`;
});
