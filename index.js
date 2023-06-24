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

const comments = new CommentStream(redditClient, {
  subreddit: options.commentSubs,
  limit: options.commentLimit,
  pollTime: options.commentPollTime,
});

comments.on("item", async comment => {
  if (connectedAt > comment.created_utc) return;
  streamChannel = options.subreddits[comment.subreddit.display_name].channelId || false;
  if (!streamChannel) { return; }
  var discordEmbed = new EmbedBuilder()
  if (streamChannel === "1121273754857775114") {
    // bot test channel
    // console.log(JSON.stringify(comment.author.pref_show_snoovatar))
    // console.log(comment.author_patreon_flair)

    discordEmbed = new EmbedBuilder()
      .setColor(0x0079d3)
      .setTitle("Comment")
      .setURL(`https://www.reddit.com${comment.permalink}`)
      .setAuthor({
        name: comment.author.name,
        url: `https://www.reddit.com${comment.permalink}`,
        iconURL: `https://styles.redditmedia.com/t5_21pumx/styles/profileIcon_snoo07765e5a-d55f-46e6-aaee-b1dc1051eda5-headshot.png?width=256&height=256&crop=256:256,smart&v=enabled&s=4ac765f4d46488e6f81b27cca652435c9645aaec`
        //   iconURL: `${comment.author.icon_img}`,
      })
      .setDescription(`💬  ${comment.body.slice(0, 500)}`);
  } else {
    discordEmbed = new EmbedBuilder()
      .setColor(0x0079d3)
      .setDescription(`💬  [**${comment.author.name}**](https://www.reddit.com${comment.permalink})  ${comment.body.slice(0, 500)}`);
  }

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
  var discordEmbed = new EmbedBuilder()
  if (streamChannel == "1121273754857775114") { // bot test channel
    discordEmbed = new EmbedBuilder()
      .setColor(0xea0027)
      .setAuthor({
        name: `${post.author.name})`,
        iconURL: `${post.author.icon_img}`,
      })
      .setDescription(`📌  [**${post.author.name}**](https://www.reddit.com${post.permalink})  ${post.title.slice(0, 500)}`);
  } else {
    discordEmbed = new EmbedBuilder()
      .setColor(0xea0027)
      .setDescription(`📌  [**${post.author.name}**](https://www.reddit.com${post.permalink})  ${post.title.slice(0, 500)}`);
  }
  discordClient.channels.cache
    .get(streamChannel)
    .send({ embeds: [discordEmbed] });

  const uniDate = new Date().toLocaleString();
  console.log(
    `[${uniDate}] 📌 ${post.subreddit.display_name} | ${post.author.name} | ${post.title.slice(0, 50)}`
  );
});

discordClient.login(process.env.DISCORD_TOKEN);
