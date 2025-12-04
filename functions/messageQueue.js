class MessageQueue {
	constructor() {
		this.queues = new Map(); // Per-chat queues
		this.processing = new Map(); // Track processing status
		this.messageDelay = 100; // Minimum delay between messages (ms)
		this.groupMessageDelay = 300; // Delay for group messages (ms)
		this.maxConcurrent = 3; // Max concurrent sends
		this.activeSends = 0;
	}

	/**
	 * Add a message to the queue
	 * @param {string} chatId - Chat identifier
	 * @param {Function} sendFunction - Async function that sends the message
	 * @param {number} priority - Priority (lower = higher priority)
	 */
	async enqueue(chatId, sendFunction, priority = 1) {
		if (!this.queues.has(chatId)) {
			this.queues.set(chatId, []);
		}

		const queue = this.queues.get(chatId);
		queue.push({ sendFunction, priority, timestamp: Date.now() });

		// Sort by priority (lower number = higher priority)
		queue.sort((a, b) => a.priority - b.priority);

		// Start processing if not already processing
		if (!this.processing.get(chatId)) {
			this.processQueue(chatId);
		}
	}

	/**
	 * Process the queue for a specific chat
	 */
	async processQueue(chatId) {
		if (this.processing.get(chatId)) return;
		this.processing.set(chatId, true);

		const queue = this.queues.get(chatId);
		if (!queue) {
			this.processing.set(chatId, false);
			return;
		}

		while (queue.length > 0) {
			// Wait if too many concurrent sends
			while (this.activeSends >= this.maxConcurrent) {
				await new Promise((resolve) => setTimeout(resolve, 50));
			}

			const message = queue.shift();
			if (!message) break;

			this.activeSends++;

			try {
				await message.sendFunction();
			} catch (err) {
				console.error(`Queue send error for ${chatId}:`, err.message);
			} finally {
				this.activeSends--;
			}

			// Apply delay based on chat type
			const delay = chatId.endsWith("@g.us") ? this.groupMessageDelay : this.messageDelay;
			if (queue.length > 0) {
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}

		this.processing.set(chatId, false);
	}

	/**
	 * Get queue stats
	 */
	getStats() {
		const stats = {
			totalQueued: 0,
			queuesByChat: {},
			activeSends: this.activeSends,
		};

		for (const [chatId, queue] of this.queues.entries()) {
			stats.totalQueued += queue.length;
			stats.queuesByChat[chatId] = queue.length;
		}

		return stats;
	}

	/**
	 * Clear queue for a specific chat
	 */
	clearQueue(chatId) {
		if (this.queues.has(chatId)) {
			this.queues.get(chatId).length = 0;
		}
	}
}

// Singleton instance
const messageQueue = new MessageQueue();

export default messageQueue;
