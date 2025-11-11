import { Delegate } from '../../../helpers/delegate';
import { DiscordMessage } from '../options';

/**
 * Discord messages state management
 */
export class MessagesState {
	private _messageAdded: Delegate<DiscordMessage> = new Delegate();
	private _messageRemoved: Delegate<string> = new Delegate();
	private _messageChanged: Delegate<DiscordMessage> = new Delegate();
	private _messagesChanged: Delegate = new Delegate();
	private _messages: Map<string, DiscordMessage>;

	constructor() {
		this._messages = new Map();
		this._messagesChanged.subscribe(() => {
			this._updateMessagesArray();
		}, this);
	}

	destroy() {
		this._messagesChanged.unsubscribeAll(this);
	}

	messageAdded(): Delegate<DiscordMessage> {
		return this._messageAdded;
	}

	messageRemoved(): Delegate<string> {
		return this._messageRemoved;
	}

	messageChanged(): Delegate<DiscordMessage> {
		return this._messageChanged;
	}

	messagesChanged(): Delegate {
		return this._messagesChanged;
	}

	addMessage(message: DiscordMessage): void {
		this._messages.set(message.id, message);
		this._messageAdded.fire(message);
		this._messagesChanged.fire();
	}

	removeMessage(id: string): void {
		if (!this._messages.has(id)) return;
		this._messages.delete(id);
		this._messageRemoved.fire(id);
		this._messagesChanged.fire();
	}

	updateMessage(message: DiscordMessage): void {
		if (!this._messages.has(message.id)) return;
		this._messages.set(message.id, message);
		this._messageChanged.fire(message);
		this._messagesChanged.fire();
	}

	getMessage(id: string): DiscordMessage | undefined {
		return this._messages.get(id);
	}

	messages(): DiscordMessage[] {
		return this._messagesArray;
	}

	private _messagesArray: DiscordMessage[] = [];
	private _updateMessagesArray() {
		this._messagesArray = Array.from(this._messages.values());
	}
}
