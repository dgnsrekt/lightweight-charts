import { createChart, AreaSeries } from 'lightweight-charts';
import { SocialMessagePrimitive } from '../social-message';
import { DiscordAdapter, XAdapter, TelegramAdapter } from '../adapters';
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

// Create platform adapters
const discordAdapter = new DiscordAdapter();
const xAdapter = new XAdapter();
const telegramAdapter = new TelegramAdapter();

// Create plugin with Discord as the default platform
const socialMessagePlugin = new SocialMessagePrimitive(discordAdapter, {
	positioningMode: 'fixed',
	showPlatformIcon: true,
	showAvatar: false,
});

series.attachPrimitive(socialMessagePlugin);

// Add sample Discord message
socialMessagePlugin.addMessage({
	id: 'discord1',
	platform: 'discord',
	time: data[50].time,
	price: data[50].value,
	username: 'TradingView',
	message: "Don't even open TradingView today.",
	timestamp: '21 Feb \'18 • 12:00',
	platformUrl: 'https://discord.com/channels/example/123456',
	usernameColor: '#5865F2',
});

// Add sample X.com (Twitter) message with verified badge
socialMessagePlugin.addMessage({
	id: 'x1',
	platform: 'x',
	time: data[100].time,
	price: data[100].value,
	username: 'elonmusk',
	message: 'Bitcoin is the future of finance.',
	timestamp: '11 Apr \'18 • 14:23',
	platformUrl: 'https://x.com/elonmusk/status/1234567890',
	metadata: {
		verified: true, // Show verified badge
	},
});

// Add another X.com message without verified badge
socialMessagePlugin.addMessage({
	id: 'x2',
	platform: 'x',
	time: data[150].time,
	price: data[150].value,
	username: 'CryptoTrader',
	message: 'Broker Awards 2024 by @tradingview — Check out the best online brokers.',
	timestamp: '15 May \'18 • 09:30',
	platformUrl: 'https://x.com/CryptoTrader/status/9876543210',
});

// Add sample Telegram message
socialMessagePlugin.addMessage({
	id: 'telegram1',
	platform: 'telegram',
	time: data[200].time,
	price: data[200].value,
	username: 'ChartWizard',
	message: 'New resistance level confirmed! Watch for breakout.',
	timestamp: '20 Jul \'18 • 16:45',
	platformUrl: 'https://t.me/trading_signals/12345',
	usernameColor: '#2AABEE',
});

// Add another Discord message
socialMessagePlugin.addMessage({
	id: 'discord2',
	platform: 'discord',
	time: data[250].time,
	price: data[250].value,
	username: 'MarketAnalyst',
	message: 'Strong support at this level. Expecting bounce.',
	timestamp: '15 Sep \'18 • 11:20',
	platformUrl: 'https://discord.com/channels/example/789012',
	usernameColor: '#43B581',
});

// Platform switcher functionality
const platformButtons = {
	discord: document.getElementById('platform-discord'),
	x: document.getElementById('platform-x'),
	telegram: document.getElementById('platform-telegram'),
};

// Update plugin with new platform adapter
function switchPlatform(adapter: DiscordAdapter | XAdapter | TelegramAdapter, platformName: string) {
	socialMessagePlugin.applyOptions({
		platformAdapter: adapter,
		...adapter.getDefaultTheme(),
	});

	// Update active button styling
	Object.entries(platformButtons).forEach(([name, button]) => {
		if (button) {
			if (name === platformName) {
				button.classList.add('active');
			} else {
				button.classList.remove('active');
			}
		}
	});
}

// Attach platform switcher event listeners
platformButtons.discord?.addEventListener('click', () => {
	switchPlatform(discordAdapter, 'discord');
});

platformButtons.x?.addEventListener('click', () => {
	switchPlatform(xAdapter, 'x');
});

platformButtons.telegram?.addEventListener('click', () => {
	switchPlatform(telegramAdapter, 'telegram');
});

// Toggle between fixed and draggable positioning modes
const toggleButton = document.getElementById('mode-toggle')!;
let currentMode: 'fixed' | 'draggable' = 'fixed';
toggleButton.addEventListener('click', () => {
	currentMode = currentMode === 'fixed' ? 'draggable' : 'fixed';
	socialMessagePlugin.setPositioningMode(currentMode);
	toggleButton.textContent = `Switch to ${currentMode === 'fixed' ? 'Draggable' : 'Fixed'} Mode`;
});

// Expose for debugging
(window as any).socialMessagePlugin = socialMessagePlugin;
(window as any).adapters = { discordAdapter, xAdapter, telegramAdapter };
