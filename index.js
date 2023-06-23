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

var streamChannel = "";
const connectedAt = Date.now() / 1000;

const options = require("./options.json");
// const testSub = "OnPatrolLive"
// console.log(options.subreddits[testSub].channelId);

const comments = new CommentStream(redditClient, {
  subreddit: options.commentSubs,
  limit: options.commentLimit,
  pollTime: options.commentPollTime,
});

comments.on("item", async comment => {
  // console.log(comment);
  if (connectedAt > comment.created_utc) return;
  streamChannel = options.subreddits[comment.subreddit.display_name].channelId || false;
  if (!streamChannel) { return; }
  const discordEmbed = new EmbedBuilder()
    .setColor(0x0079d3)
    .setDescription(`[💬  **${comment.author.name}**](https://www.reddit.com${comment.permalink})  ${comment.body.slice(0, 500)}`);
  discordClient.channels.cache
    .get(streamChannel)
    .send({ embeds: [discordEmbed] });

  const uniDate = new Date().toLocaleString();
  console.log(
    `[${uniDate}] 💬 ${comment.subreddit.display_name} | ${comment.author.name} | ${comment.body.slice(0, 50)}`
  );
});

const submissions = new SubmissionStream(redditClient, {
  subreddit: options.submissionSubs,
  limit: options.submissionLimit,
  pollTime: options.submissionPollTime,
});
submissions.on("item", async post => {
  if (connectedAt > post.created_utc) return;

  streamChannel = options.subreddits[post.subreddit.display_name].channelId || false;
  if (!streamChannel) { return; }

  const discordEmbed = new EmbedBuilder()
    .setColor(0xea0027)
    .setDescription(`[📌  **${post.author.name}**](https://www.reddit.com${post.permalink})  ${post.title.slice(0, 500)}`);
  discordClient.channels.cache
    .get(streamChannel)
    .send({ embeds: [discordEmbed] });

  const uniDate = new Date().toLocaleString();
  console.log(
    `[${uniDate}] 📌 ${post.subreddit.display_name} | ${post.author.name} | ${post.title.slice(0, 50)}`
  );
});

discordClient.login(process.env.DISCORD_TOKEN);
