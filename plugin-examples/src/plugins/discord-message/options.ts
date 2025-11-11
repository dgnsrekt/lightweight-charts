import { Time } from 'lightweight-charts';

/**
 * Discord message data structure
 */
export interface DiscordMessage {
	/** Unique identifier */
	id: string;
	/** Time coordinate for positioning */
	time: Time;
	/** Price coordinate for positioning */
	price: number;
	/** Discord username */
	username: string;
	/** Message content */
	message: string;
	/** Display timestamp (e.g., "04 Apr '25 • 23:43") */
	timestamp: string;
	/** URL to original Discord message */
	discordUrl: string;
	/** Optional avatar URL (not fetched, display placeholder) */
	avatarUrl?: string;
	/** Optional username color override */
	usernameColor?: string;
}

/**
 * Positioning mode
 */
export type PositioningMode = 'fixed' | 'draggable';

/**
 * Plugin customization options
 */
export interface DiscordMessageOptions {
	/** Positioning mode */
	positioningMode: PositioningMode;

	/** Visual customization */
	cardBackgroundColor: string;
	cardBorderColor: string;
	cardBorderRadius: number;

	/** Text styling */
	usernameColor: string;
	usernameFont: string;
	messageColor: string;
	messageFont: string;
	timestampColor: string;
	timestampFont: string;

	/** Layout */
	cardWidth: number;
	cardPadding: number;
	lineHeight: number;

	/** Feature toggles */
	showDiscordLogo: boolean;
	showAvatar: boolean;

	/** Interaction */
	hoverBackgroundColor: string;
	cursorOnHover: string;
}

/**
 * Default Discord theme (dark mode)
 */
export const defaultOptions: DiscordMessageOptions = {
	positioningMode: 'fixed',

	cardBackgroundColor: '#36393f',
	cardBorderColor: '#202225',
	cardBorderRadius: 8,

	usernameColor: '#ffffff',
	usernameFont: 'bold 14px sans-serif',
	messageColor: '#dcddde',
	messageFont: '12px sans-serif',
	timestampColor: '#72767d',
	timestampFont: '10px sans-serif',

	cardWidth: 280,
	cardPadding: 12,
	lineHeight: 18,

	showDiscordLogo: true,
	showAvatar: false,

	hoverBackgroundColor: '#2f3136',
	cursorOnHover: 'pointer',
};
