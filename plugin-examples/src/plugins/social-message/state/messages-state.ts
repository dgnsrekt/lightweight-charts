import { Delegate } from '../../../helpers/delegate';

/**
 * Generic messages state management
 * Can be used with any message type that has an `id` field
 */
export class MessagesState<T extends { id: string }> {
	private _messageAdded: Delegate<T> = new Delegate();
	private _messageRemoved: Delegate<string> = new Delegate();
	private _messageChanged: Delegate<T> = new Delegate();
	private _messagesChanged: Delegate = new Delegate();
	private _messages: Map<string, T>;

	constructor() {
		this._messages = new Map();
		this._messagesChanged.subscribe(() => {
			this._updateMessagesArray();
		}, this);
	}

	destroy() {
		this._messagesChanged.unsubscribeAll(this);
	}

	messageAdded(): Delegate<T> {
		return this._messageAdded;
	}

	messageRemoved(): Delegate<string> {
		return this._messageRemoved;
	}

	messageChanged(): Delegate<T> {
		return this._messageChanged;
	}

	messagesChanged(): Delegate {
		return this._messagesChanged;
	}

	addMessage(message: T): void {
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

	updateMessage(message: T): void {
		if (!this._messages.has(message.id)) return;
		this._messages.set(message.id, message);
		this._messageChanged.fire(message);
		this._messagesChanged.fire();
	}

	getMessage(id: string): T | undefined {
		return this._messages.get(id);
	}

	messages(): T[] {
		return this._messagesArray;
	}

	private _messagesArray: T[] = [];
	private _updateMessagesArray() {
		this._messagesArray = Array.from(this._messages.values());
	}
}
