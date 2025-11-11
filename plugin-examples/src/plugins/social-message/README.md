# Discord Message Plugin

A lightweight-charts plugin for displaying Discord message annotations on charts, similar to TradingView's tweet annotation feature.

## Features

- **Dual Positioning Modes**: Fixed (anchored to time/price) and draggable
- **Click to Open**: Click messages to open Discord URLs
- **Fully Customizable**: Colors, fonts, sizes, logo/avatar display
- **Performance**: Efficient canvas rendering with hit testing
- **TypeScript**: Full type safety and IDE autocomplete

## Installation

```typescript
import { DiscordMessagePrimitive } from './discord-message';
```

## Basic Usage

```typescript
const discordPlugin = new DiscordMessagePrimitive({
  positioningMode: 'fixed',
  showDiscordLogo: true,
});

series.attachPrimitive(discordPlugin);

discordPlugin.addMessage({
  id: 'msg1',
  time: someTime,
  price: somePrice,
  username: 'TradingView',
  message: "Don't even open TradingView today.",
  timestamp: '04 Apr \'25 • 23:43',
  discordUrl: 'https://discord.com/channels/...',
});
```

## API

### Constructor

```typescript
new DiscordMessagePrimitive(options?)
```

### Methods

- `addMessage(message: DiscordMessage): void` - Add a message
- `removeMessage(id: string): void` - Remove a message
- `updateMessage(message: DiscordMessage): void` - Update a message
- `messages(): DiscordMessage[]` - Get all messages
- `applyOptions(options: Partial<DiscordMessageOptions>): void` - Update options
- `setPositioningMode(mode: 'fixed' | 'draggable'): void` - Change positioning mode

## Options

See `options.ts` for full list of customization options.

## Examples

See `example/example.ts` for a complete working example.
