class MessageQueue {
	constructor() {
		this.queues = new Map(); // Per-chat queues
		this.processing = new Map(); // Track processing status
		this.messageDelay = 50; // Reduced delay for faster processing (ms)
		this.groupMessageDelay = 100; // Reduced delay for group messages (ms)
		this.maxConcurrent = 10; // Increased for better throughput (was 3)
		this.activeSends = 0;
		this.batchSize = 5; // Process messages in batches
		this.groupBatchDelay = 200; // Delay between batches for groups
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
	 * Process the queue for a specific chat with batch support
	 */
	async processQueue(chatId) {
		if (this.processing.get(chatId)) return;
		this.processing.set(chatId, true);

		const queue = this.queues.get(chatId);
		if (!queue) {
			this.processing.set(chatId, false);
			return;
		}

		const isGroup = chatId.endsWith("@g.us");

		while (queue.length > 0) {
			// Process in batches for better performance
			const batchSize = isGroup ? this.batchSize : 1;
			const batch = [];

			// Collect batch
			for (let i = 0; i < batchSize && queue.length > 0; i++) {
				// Wait if too many concurrent sends
				while (this.activeSends >= this.maxConcurrent) {
					await new Promise((resolve) => setTimeout(resolve, 50));
				}

				const message = queue.shift();
				if (message) {
					batch.push(message);
					this.activeSends++;
				}
			}

			// Send batch in parallel
			const batchPromises = batch.map(async (message) => {
				try {
					await message.sendFunction();
				} catch (err) {
					console.error(`Queue send error for ${chatId}:`, err.message);
				} finally {
					this.activeSends--;
				}
			});

			// Wait for batch to complete
			await Promise.all(batchPromises);

			// Apply delay between batches
			if (queue.length > 0) {
				const delay = isGroup ? this.groupBatchDelay : this.messageDelay;
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
