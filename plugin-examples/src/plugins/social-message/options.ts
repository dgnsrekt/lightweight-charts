import { Time } from 'lightweight-charts';
import { IPlatformAdapter } from './adapters/platform-adapter';

/**
 * Social media message data structure
 * Generic interface that works with any social platform (Discord, X, Telegram, etc.)
 */
export interface SocialMessage {
	/** Unique identifier */
	id: string;
	/** Time coordinate for positioning */
	time: Time;
	/** Price coordinate for positioning */
	price: number;
	/** Platform identifier (e.g., 'discord', 'x', 'telegram') */
	platform: string;
	/** Username or display name */
	username: string;
	/** Message content */
	message: string;
	/** Display timestamp (e.g., "04 Apr '25 • 23:43") */
	timestamp: string;
	/** URL to original platform message */
	platformUrl: string;
	/** Optional avatar URL (not fetched, display placeholder) */
	avatarUrl?: string;
	/** Optional username color override */
	usernameColor?: string;
	/** Optional platform-specific metadata (e.g., verified status, badges) */
	metadata?: Record<string, any>;
}

/**
 * Positioning mode
 */
export type PositioningMode = 'fixed' | 'draggable';

/**
 * Plugin customization options
 */
export interface SocialMessageOptions {
	/** Platform adapter for platform-specific behavior */
	platformAdapter?: IPlatformAdapter;

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
	showPlatformIcon: boolean;
	showAvatar: boolean;

	/** Interaction */
	hoverBackgroundColor: string;
	cursorOnHover: string;
}

/**
 * Creates default options, optionally merged with platform-specific theme
 * @param platformAdapter - Optional platform adapter to apply platform-specific defaults
 * @returns Default options with optional platform theme applied
 */
export function createDefaultOptions(
	platformAdapter?: IPlatformAdapter
): SocialMessageOptions {
	const baseOptions: SocialMessageOptions = {
		platformAdapter,
		positioningMode: 'fixed',

		// Neutral default theme (can be overridden by platform adapter)
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

		showPlatformIcon: true,
		showAvatar: false,

		hoverBackgroundColor: '#2f3136',
		cursorOnHover: 'pointer',
	};

	// Merge platform-specific theme if adapter provided
	if (platformAdapter) {
		const platformTheme = platformAdapter.getDefaultTheme();
		return { ...baseOptions, ...platformTheme };
	}

	return baseOptions;
}

/**
 * Default options (for backward compatibility and simple usage)
 */
export const defaultOptions: SocialMessageOptions = createDefaultOptions();
