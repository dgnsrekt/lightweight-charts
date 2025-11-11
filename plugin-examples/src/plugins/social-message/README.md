# Social Message Plugin

A multi-platform lightweight-charts plugin for displaying social media message annotations from Discord, X.com (Twitter), Telegram, and other platforms. Features platform-specific themes, icons, and special badges (like verified checkmarks).

## Features

- **Multi-Platform Support**: Built-in adapters for Discord, X.com, and Telegram
- **Platform Adapters**: Extensible architecture for adding custom platforms
- **Dynamic Theming**: Each platform has authentic colors and branding
- **Special Badges**: X.com verified badges, with support for platform-specific indicators
- **Dual Positioning Modes**: Fixed (anchored to time/price) or draggable
- **Crosshair Lines**: TradingView-style connecting lines to chart positions
- **Interactive**: Click messages to open original platform URLs
- **Hover Effects**: Visual feedback on mouse hover
- **Type-Safe**: Full TypeScript support with generics

## Installation

```typescript
import {
  SocialMessagePrimitive,
  DiscordAdapter,
  XAdapter,
  TelegramAdapter
} from './social-message';
```

## Basic Usage

### With Discord Platform

```typescript
import { createChart } from 'lightweight-charts';
import { SocialMessagePrimitive, DiscordAdapter } from './social-message';

const chart = createChart(document.getElementById('chart'));
const series = chart.addLineSeries();

// Create plugin with Discord adapter
const discordAdapter = new DiscordAdapter();
const plugin = new SocialMessagePrimitive(discordAdapter, {
  positioningMode: 'fixed',
  showPlatformIcon: true,
});

series.attachPrimitive(plugin);

// Add Discord message
plugin.addMessage({
  id: 'msg1',
  platform: 'discord',
  time: { year: 2023, month: 4, day: 15 },
  price: 100.5,
  username: 'TradingView',
  message: 'Market update: Strong support at this level',
  timestamp: '15 Apr \'23 • 14:30',
  platformUrl: 'https://discord.com/channels/123456/789012',
  usernameColor: '#5865F2',
});
```

### With X.com (Twitter) Platform

```typescript
import { XAdapter } from './social-message';

const xAdapter = new XAdapter();
const plugin = new SocialMessagePrimitive(xAdapter);

// Add X.com message with verified badge
plugin.addMessage({
  id: 'tweet1',
  platform: 'x',
  time: { year: 2023, month: 4, day: 16 },
  price: 102.3,
  username: 'elonmusk',
  message: 'Bitcoin is the future of finance',
  timestamp: '16 Apr \'23 • 09:15',
  platformUrl: 'https://x.com/elonmusk/status/1234567890',
  metadata: {
    verified: true, // Shows blue checkmark
  },
});
```

### With Telegram Platform

```typescript
import { TelegramAdapter } from './social-message';

const telegramAdapter = new TelegramAdapter();
const plugin = new SocialMessagePrimitive(telegramAdapter);

plugin.addMessage({
  id: 'tg1',
  platform: 'telegram',
  time: { year: 2023, month: 4, day: 17 },
  price: 98.7,
  username: 'CryptoSignals',
  message: 'Breaking: Major resistance level approaching',
  timestamp: '17 Apr \'23 • 16:45',
  platformUrl: 'https://t.me/crypto_signals/12345',
});
```

## Dynamic Platform Switching

You can change the platform theme dynamically:

```typescript
import { DiscordAdapter, XAdapter, TelegramAdapter } from './social-message';

const discordAdapter = new DiscordAdapter();
const xAdapter = new XAdapter();
const telegramAdapter = new TelegramAdapter();

// Start with Discord
const plugin = new SocialMessagePrimitive(discordAdapter);

// Switch to X.com theme
plugin.applyOptions({
  platformAdapter: xAdapter,
  ...xAdapter.getDefaultTheme(),
});

// Switch to Telegram theme
plugin.applyOptions({
  platformAdapter: telegramAdapter,
  ...telegramAdapter.getDefaultTheme(),
});
```

## Architecture

### Platform Adapter System

The plugin uses a **platform adapter pattern** to support multiple social media platforms. Each adapter implements the `IPlatformAdapter` interface:

```typescript
interface IPlatformAdapter {
  platformName: string;
  getBrandColor(): string;
  getDefaultTheme(): Partial<SocialMessageOptions>;
  openUrl(url: string): void;
  renderIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void;
  renderBadge?(ctx: CanvasRenderingContext2D, x: number, y: number, metadata: Record<string, any>): void;
}
```

### Built-in Adapters

| Adapter | Platform | Brand Color | Special Features |
|---------|----------|-------------|------------------|
| `DiscordAdapter` | Discord | #5865F2 (Blurple) | Discord logo icon |
| `XAdapter` | X.com (Twitter) | #1DA1F2 (Twitter Blue) | Verified badge support |
| `TelegramAdapter` | Telegram | #2AABEE (Telegram Blue) | Paper airplane icon |

### Creating Custom Adapters

You can easily create adapters for new platforms:

```typescript
import { IPlatformAdapter, SocialMessageOptions } from './social-message';

class SlackAdapter implements IPlatformAdapter {
  platformName = 'slack';

  getBrandColor(): string {
    return '#4A154B'; // Slack purple
  }

  getDefaultTheme(): Partial<SocialMessageOptions> {
    return {
      cardBackgroundColor: '#1a1d21',
      cardBorderColor: '#4A154B',
      usernameColor: '#ffffff',
      messageColor: '#d1d2d3',
      timestampColor: '#868789',
    };
  }

  openUrl(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  renderIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    // Draw Slack logo SVG path
    const slackIcon = new Path2D('M12.5 3c-.9 0-1.6.7-1.6 1.6...');
    ctx.save();
    const scale = size / 24;
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = this.getBrandColor();
    ctx.fill(slackIcon);
    ctx.restore();
  }
}

// Use custom adapter
const slackAdapter = new SlackAdapter();
const plugin = new SocialMessagePrimitive(slackAdapter);
```

## API Reference

### Constructor

```typescript
new SocialMessagePrimitive(
  platformAdapter?: IPlatformAdapter,
  options?: Partial<SocialMessageOptions>
)
```

**Parameters:**

- `platformAdapter` (optional): Platform adapter for platform-specific behavior
- `options` (optional): Configuration options (see below)

### Methods

#### `addMessage(message: SocialMessage): void`

Add a social media message to the chart.

```typescript
plugin.addMessage({
  id: 'unique-id',
  platform: 'discord', // or 'x', 'telegram', etc.
  time: { year: 2023, month: 4, day: 15 },
  price: 100.5,
  username: 'Username',
  message: 'Message content',
  timestamp: '15 Apr \'23 • 14:30',
  platformUrl: 'https://...',
  usernameColor: '#5865F2', // optional
  metadata: { verified: true }, // optional, platform-specific
});
```

#### `removeMessage(id: string): void`

Remove a message by ID.

```typescript
plugin.removeMessage('msg1');
```

#### `updateMessage(message: SocialMessage): void`

Update an existing message.

```typescript
plugin.updateMessage({
  id: 'msg1',
  // ... updated fields
});
```

#### `messages(): SocialMessage[]`

Get all messages.

```typescript
const allMessages = plugin.messages();
```

#### `applyOptions(options: Partial<SocialMessageOptions>): void`

Update plugin options dynamically.

```typescript
plugin.applyOptions({
  platformAdapter: new XAdapter(),
  cardWidth: 320,
  showPlatformIcon: false,
});
```

#### `setPositioningMode(mode: 'fixed' | 'draggable'): void`

Switch between positioning modes.

```typescript
plugin.setPositioningMode('draggable');
```

### Types

#### `SocialMessage`

```typescript
interface SocialMessage {
  id: string;                    // Unique identifier
  platform: string;              // Platform name ('discord', 'x', 'telegram')
  time: Time;                    // Time coordinate
  price: number;                 // Price coordinate
  username: string;              // Username/display name
  message: string;               // Message content
  timestamp: string;             // Display timestamp (e.g., "15 Apr '23 • 14:30")
  platformUrl: string;           // URL to original message
  avatarUrl?: string;            // Optional avatar URL
  usernameColor?: string;        // Optional username color override
  metadata?: Record<string, any>; // Platform-specific metadata
}
```

#### `SocialMessageOptions`

```typescript
interface SocialMessageOptions {
  platformAdapter?: IPlatformAdapter; // Platform adapter
  positioningMode: 'fixed' | 'draggable'; // Positioning mode

  // Visual customization
  cardBackgroundColor: string;
  cardBorderColor: string;
  cardBorderRadius: number;

  // Text styling
  usernameColor: string;
  usernameFont: string;
  messageColor: string;
  messageFont: string;
  timestampColor: string;
  timestampFont: string;

  // Layout
  cardWidth: number;
  cardPadding: number;
  lineHeight: number;

  // Feature toggles
  showPlatformIcon: boolean;
  showAvatar: boolean;

  // Interaction
  hoverBackgroundColor: string;
  cursorOnHover: string;
}
```

## Positioning Modes

### Fixed Mode (Default)

Messages are anchored to specific time/price coordinates and move with chart zoom/pan.

```typescript
plugin.setPositioningMode('fixed');
```

### Draggable Mode

Messages can be repositioned via drag-and-drop while maintaining their time/price anchor.

```typescript
plugin.setPositioningMode('draggable');
```

## Customization

### Custom Colors

```typescript
const plugin = new SocialMessagePrimitive(new DiscordAdapter(), {
  cardBackgroundColor: '#1e1e1e',
  cardBorderColor: '#404040',
  usernameColor: '#00ff00',
  messageColor: '#cccccc',
  timestampColor: '#888888',
  hoverBackgroundColor: '#2a2a2a',
});
```

### Custom Card Size

```typescript
plugin.applyOptions({
  cardWidth: 350,
  cardPadding: 16,
  lineHeight: 20,
});
```

### Hide Platform Icons

```typescript
plugin.applyOptions({
  showPlatformIcon: false,
});
```

## Examples

See the [example directory](./example/) for a complete working demonstration with:

- Multiple platforms on the same chart
- Platform switcher UI
- Fixed and draggable positioning modes
- Verified badge display for X.com messages

## Browser Compatibility

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+

Requires Canvas 2D API support.

## License

This plugin follows the same license as [lightweight-charts](https://github.com/tradingview/lightweight-charts).
