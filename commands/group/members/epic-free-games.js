const { getGames } = require("epic-free-games");
module.exports.command = () => {
  let cmd = ["epic"];
  return { cmd, handler };
};

const downUrl = "https://store.epicgames.com/en-US/p/";
const handler = async (sock, msg, from, args, msgInfoObj) => {
  const { sendMessageWTyping } = msgInfoObj;
  getGames("IN", true)
    .then((res) => {
      const currentGame = res.currentGames;
      const upcomingGame = res.nextGames;
      if (!args[0]) {
        currentGame.forEach((element) => {
          let imgUrl;
          let proUrl = downUrl + element.urlSlug;
          let startdate =
            element.promotions.promotionalOffers[0].promotionalOffers[0].startDate.split("T")[0];
          let enddate =
            element.promotions.promotionalOffers[0].promotionalOffers[0].endDate.split("T")[0];
          element.keyImages.forEach((value) => {
            if (value.type == "Thumbnail") return (imgUrl = value.url);
          });
          const templateButtons = [
            {
              index: 1,
              urlButton: {
                displayText: "🎮Claim Your Game🎮",
                url: proUrl,
              },
            },
          ];
          let mess = `🏷️ *Title :* ${element.title}\n🗒️ *Description :* ${element.description}\n\n📅 *Date :* ${startdate} To ${enddate}`;
          sendMessageWTyping(
            from,
            {
              image: { url: imgUrl },
              caption: mess,
              templateButtons: templateButtons,
            },
            { quoted: msg }
          );
        });
      } else if (args[0] == "next") {
        upcomingGame.forEach((element) => {
          let imgUrl;
          let proUrl = downUrl + element.urlSlug;
          let startdate =
            element.promotions.upcomingPromotionalOffers[0].promotionalOffers[0].startDate.split("T")[0];
          let enddate =
            element.promotions.upcomingPromotionalOffers[0].promotionalOffers[0].endDate.split("T")[0];
          element.keyImages.forEach((value) => {
            if (value.type == "Thumbnail") return (imgUrl = value.url);
          });
          const templateButtons = [
            {
              index: 1,
              urlButton: {
                displayText: "🎮Upcoming Game🎮",
                url: proUrl,
              },
            },
          ];

          let mess = `🏷️ *Title :* ${element.title}\n🗒️ *Description :* ${element.description}\n\n📅 *Date :* ${startdate} To ${enddate}`;
          sendMessageWTyping(
            from,
            {
              image: { url: imgUrl },
              caption: mess,
              templateButtons: templateButtons,
            },
            { quoted: msg }
          );
        });
      }
    })
    .catch((err) => {
      sendMessageWTyping(from, { text: err.toString() }, { quoted: msg });
      console.log("err", err);
    });
};
