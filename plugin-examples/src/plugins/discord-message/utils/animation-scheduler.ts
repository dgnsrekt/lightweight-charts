/**
 * Animation frame scheduler for throttling updates
 *
 * Ensures that updates are batched to the next animation frame,
 * preventing excessive re-renders during high-frequency events like drag.
 */
export class AnimationScheduler {
	private _rafId: number | null = null;
	private _callback: (() => void) | null = null;

	/**
	 * Schedule a callback to run on the next animation frame
	 *
	 * If a callback is already scheduled, it will be replaced with the new one.
	 * This ensures only one callback runs per frame.
	 *
	 * @param callback - Function to execute on next frame
	 */
	schedule(callback: () => void): void {
		// Cancel previous scheduled frame if exists
		if (this._rafId !== null) {
			cancelAnimationFrame(this._rafId);
		}

		// Store callback to execute
		this._callback = callback;

		// Schedule execution on next animation frame
		this._rafId = requestAnimationFrame(() => {
			this._rafId = null;
			if (this._callback) {
				this._callback();
				this._callback = null;
			}
		});
	}

	/**
	 * Cancel any pending scheduled callback
	 */
	cancel(): void {
		if (this._rafId !== null) {
			cancelAnimationFrame(this._rafId);
			this._rafId = null;
		}
		this._callback = null;
	}

	/**
	 * Check if a callback is currently scheduled
	 */
	isPending(): boolean {
		return this._rafId !== null;
	}
}
