const { CommentStream, SubmissionStream } = require("snoostorm");
const Snoowrap = require("snoowrap");
require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");

const { Client, GatewayIntentBits, EmbedBuilder, Collection } = require("discord.js");
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
    .send({ embeds: [discordEmbed] })
    .catch(err => { console.error(`[ERROR] Relpying to message ${message.id} -`, err.message); });

  const uniDate = new Date().toLocaleString();
  console.log(
    '\x1b[34m%s\x1b[0m', `[${uniDate.padEnd(23)}] 💬 ${comment.subreddit.display_name.padEnd(15)} | ${comment.author.name.padEnd(15)} | ${comment.body.slice(0, 45).replace(/(\r?\n|\r)/gm, " ")}`
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
  var postEmoji = "📌"
  if (!post.is_self){postEmoji = "🔗"}
  if (post.post_hint == "rich:video" || post.is_video == true){postEmoji = "🎦"}
  if (post.post_hint == "image"){postEmoji = "📸"}
  if (post.poll_data){postEmoji = "✅"}

  var discordEmbed = new EmbedBuilder()
  if (streamChannel == "1121273754857775114") { // bot test channel
    // console.log(post);
    discordEmbed = new EmbedBuilder()
      .setColor(0xea0027)
      .setAuthor({
        name: `${post.author.name}`,
        iconURL: `https://styles.redditmedia.com/t5_21pumx/styles/profileIcon_snoo07765e5a-d55f-46e6-aaee-b1dc1051eda5-headshot.png?width=256&height=256&crop=256:256,smart&v=enabled&s=4ac765f4d46488e6f81b27cca652435c9645aaec`
        // iconURL: `${post.author.icon_img}`,
      })
      .addFields({
        name: "Self",
        value: `${post.is_self}`,
        inline: true,
      })
      .addFields({
        name: "Original",
        value: `${post.is_original_content}`,
        inline: true,
      })
      .addFields({
        name: "Video",
        value: `${post.is_video}`,
        inline: true,
      })
      .addFields({
        name: "Meta",
        value: `${post.is_meta}`,
        inline: true,
      })
      .addFields({
        name: "post hint",
        value: `${post.post_hint || "none"}`,
        inline: true,
      })
      .addFields({
        name: "Categories",
        value: `${post.content_categories || "none"}`,
        inline: false,
      })
      .addFields({
        name: "Id",
        value: `${post.id}`,
        inline: false,
      })
      .setDescription(`${postEmoji}  [**${post.author.name}**](https://www.reddit.com${post.permalink})  ${post.title.slice(0, 500)}`);
  } else {
    discordEmbed = new EmbedBuilder()
      .setColor(0xea0027)
      .setDescription(`${postEmoji}  [**${post.author.name}**](https://www.reddit.com${post.permalink})  ${post.title.slice(0, 500)}`);
  }
  discordClient.channels.cache
    .get(streamChannel)
    .send({ embeds: [discordEmbed] })
    .catch(err => { console.error(`[ERROR] Relpying to message ${message.id} -`, err.message); });

  const uniDate = new Date().toLocaleString();
  console.log(
    '\x1b[34m%s\x1b[0m', `[${uniDate.padEnd(23)}] ${postEmoji} ${post.subreddit.display_name.padEnd(15)} | ${post.author.name.padEnd(15)} | ${post.title.slice(0, 45)}`
  );
});

// Reddit events handler - TBD
// const redditSubmissionEvent = require("./reddit_events/submissions.js");
// redditClient.on(discordEvent.name, (...args) => discordEvent.execute(...args));
// submissions.on("item", async post => {

// Discord events handler
const discordEventsPath = path.join(__dirname, "discord_events");
const discordEventFiles = fs
  .readdirSync(discordEventsPath)
  .filter((discordFile) => discordFile.endsWith(".js"));

for (const discordFile of discordEventFiles) {
  const discordFilePath = path.join(discordEventsPath, discordFile);
  const discordEvent = require(discordFilePath);
  if (discordEvent.once) {
    discordClient.once(discordEvent.name, (...args) => discordEvent.execute(...args));
    // console.log(discordEvent.name);
  } else {
    discordClient.on(discordEvent.name, (...args) => discordEvent.execute(...args));
    // console.log(discordEvent.name);
  }
}


// Slash command Collection setup
discordClient.commands = new Collection();
const commandsPath = path.join(__dirname, "discord_commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  // Set a new item in the Collection with the key as the command name and the value as the exported module
  if ("data" in command && "execute" in command) {
    discordClient.commands.set(command.data.name, command);
    const cLoadedDate = new Date().toLocaleString();
    console.log('\x1b[34m%s\x1b[0m', `[${cLoadedDate.padEnd(23)}] 💻 COMAND| Command Loaded| ${command.data.name}`)
  } else {
    console.log(
      `⛔ [WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
    );
  }
}

discordClient.login(process.env.DISCORD_TOKEN);
