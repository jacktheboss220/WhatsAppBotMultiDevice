const handler = async (sock, msg, from, args, msgInfoObj) => {
	const { sendMessageWTyping } = msgInfoObj;

	try {
		const response = await fetch(
			"https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=en-US&country=IN&allowCountries=IN"
		);

		if (!response.ok) {
			throw new Error(`Failed to fetch data: ${response.status}`);
		}

		const data = await response.json();
		const now = Date.now();

		// Filter and process free games
		const freeGames = data.data.Catalog.searchStore.elements
			.filter((game) => {
				// Check if game is free
				if (game.price.totalPrice.discountPrice !== 0) return false;
				// Check if game has promotional offers
				if (!game.promotions?.promotionalOffers || game.promotions.promotionalOffers.length === 0) return false;
				return true;
			})
			.map((game) => {
				// Get the promotional offers
				const offers = game.promotions.promotionalOffers[0]?.promotionalOffers || [];

				return offers
					.map((offer) => {
						// Parse dates
						const startDate = new Date(offer.startDate).getTime();
						const endDate = new Date(offer.endDate).getTime();

						// Check if offer is currently active
						if (startDate <= now && endDate >= now) {
							return {
								title: game.title,
								ends: offer.endDate,
								endTs: endDate,
								description: game.description || "No description available",
							};
						}
						return null;
					})
					.filter((item) => item !== null);
			})
			.flat()
			.sort((a, b) => a.endTs - b.endTs);

		if (freeGames.length === 0) {
			return sendMessageWTyping(
				from,
				{ text: "😔 No free games available on Epic Games Store right now. Check back later!" },
				{ quoted: msg }
			);
		}

		// Format the response
		let message = "*FREE EPIC GAMES*\n\n";
		message += "━━━━━━━━━━━━━━━━━━━━\n\n";

		freeGames.forEach((game, index) => {
			const endDate = new Date(game.ends);
			const formattedDate = endDate.toLocaleString("en-US", {
				timeZone: "Asia/Kolkata",
				month: "short",
				day: "numeric",
				year: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			});

			// Calculate time remaining
			const timeLeft = game.endTs - now;
			const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
			const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
			const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

			message += `*${index + 1}. ${game.title}*\n`;
			message += `⏰ Free until: ${formattedDate}\n`;
			message += `⌛ Time left: ${daysLeft}d ${hoursLeft}h ${minutesLeft}m\n`;
			message += `\n`;
		});

		message += "━━━━━━━━━━━━━━━━━━━━\n";
		message += "🔗 Claim at: epicgames.com/en-US/free-games\n";
		message += "\n_Hurry up and claim your free games!_ 🎁";

		return sendMessageWTyping(from, { text: message }, { quoted: msg });
	} catch (error) {
		console.error("Epic Games error:", error);
		return sendMessageWTyping(
			from,
			{ text: `❌ Error fetching Epic Games data:\n${error.message}` },
			{ quoted: msg }
		);
	}
};

export default () => ({
	cmd: ["epicgames", "epic", "freegames"],
	desc: "Get current free games on Epic Games Store",
	usage: "epicgames | epic | freegames",
	handler,
});
