const { CommentStream, SubmissionStream } = require("snoostorm");
const Snoowrap = require("snoowrap");
require("dotenv").config();

const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
});

const redditClient = new Snoowrap({
  userAgent: process.env.REDDIT_USER_AGENT,
  clientId: process.env.REDDIT_CLIENT_ID,
  clientSecret: process.env.REDDIT_CLIENT_SECRET,
  username: process.env.REDDIT_USERNAME,
  password: process.env.REDDIT_PASSWORD,
});

const subreddit = "OnPatrolLive+LAFireandRescue+OPLTesting";
var streamChannel = "";
const lafrStreamChannel = "1121279878570967040";
const oplStreamChannel = "1121307801453596722";
const testStreamChannel = "1121273754857775114";
const pollTime = 10000;
const itemLimit = 20;
const connectedAt = Date.now() / 1000;

// Comments
const comments = new CommentStream(redditClient, {
  subreddit: subreddit,
  limit: itemLimit,
  pollTime: pollTime,
});

comments.on("item", async comment => {
  // console.log(comment);
  if (connectedAt > comment.created_utc) return;
  if (comment.subreddit.display_name == "OnPatrolLive") { streamChannel = oplStreamChannel }
  else if (comment.subreddit.display_name == "LAFireandRescue") { streamChannel = lafrStreamChannel }
  else if (comment.subreddit.display_name == "OPLTesting") { streamChannel = testStreamChannel }
  else return;
  // const discordComment = `💬 **${comment.author.name}** ${comment.body}`
  // discordClient.channels.cache
  //   .get(streamChannel)
  //   .send({ content: discordComment });

  const discordEmbed = new EmbedBuilder()
    .setColor(0x0079d3)
    .setDescription(`[💬  **${comment.author.name}**](https://www.reddit.com${comment.permalink})  ${comment.body.slice(0,500)}`);
    discordClient.channels.cache
    .get(streamChannel)
    .send({ embeds: [discordEmbed] });

  const uniDate = new Date().toLocaleString();
  console.log(
    `[${uniDate}] 💬 ${comment.subreddit.display_name} | ${comment.author.name} | ${comment.body.slice(0,50)}`
  );
});

const submissions = new SubmissionStream(redditClient, {
  subreddit: subreddit,
  limit: itemLimit,
  pollTime: pollTime,
});
submissions.on("item", async post => {
  if (connectedAt > post.created_utc) return;
  if (post.subreddit.display_name == "OnPatrolLive") { streamChannel = oplStreamChannel }
  else if (post.subreddit.display_name == "LAFireandRescue") { streamChannel = lafrStreamChannel }
  else if (post.subreddit.display_name == "OPLTesting") { streamChannel = testStreamChannel }
  else return;

  // const discordMessage = `📌 **${post.author.name}** ${post.title}`
  // discordClient.channels.cache
  //   .get(streamChannel)
  //   .send({ content: discordMessage });

  // const uniDate = new Date().toLocaleString();
  // console.log(
  //   `[${uniDate}] 📌 ${post.subreddit.display_name} | ${post.author.name} | ${post.title}`
  // );

  const discordEmbed = new EmbedBuilder()
    .setColor(0xea0027)
    .setDescription(`[📌  **${post.author.name}**](https://www.reddit.com${post.permalink})  ${post.title.slice(0,500)}`);
    discordClient.channels.cache
    .get(streamChannel)
    .send({ embeds: [discordEmbed] });

  const uniDate = new Date().toLocaleString();
  console.log(
    `[${uniDate}] 📌 ${post.subreddit.display_name} | ${post.author.name} | ${post.title.slice(0,50)}`
  );

});

discordClient.login(process.env.DISCORD_TOKEN);
