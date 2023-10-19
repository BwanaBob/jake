const { CommentStream, SubmissionStream } = require("snoostorm");
const Snoowrap = require("snoowrap");
require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const options = require("./options.json");
const log = require("./modules/logger.js");

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
var knownAvatars = {};

async function getAvatar(username) {
  var returnURL = 'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_7.png';
  var cached = false;
  if (knownAvatars[username]) {
    returnURL = knownAvatars[username];
    cached = true;
  } else {
    try {
      returnURL = await fetch(`https://api.reddit.com/user/${username}/about`)
        .then(response => response.json())
        .then(data => {
          const returnAvatar = data.data.icon_img.replace(/&amp;/g, '&') || data.data.snoovatar_img.replace(/&amp;/g, '&') || "unknown";
          if (returnAvatar !== "unknown") {
            knownAvatars[username] = returnAvatar;
          }
          return returnAvatar;
        })
    } catch (err) {
      console.error(err);
    }
  }
  return { url: returnURL, cached: cached };
}

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
  const avatarURL = await getAvatar(comment.author.name);
  if (streamChannel == "1121273754857775114") {
    // bot test channel
    discordEmbed = new EmbedBuilder()
      .setColor(0x0079d3)
      .setURL(`https://www.reddit.com${comment.permalink}`)
      .setAuthor({
        name: comment.author.name,
        url: `https://www.reddit.com${comment.permalink}`,
        iconURL: avatarURL.url,
      })
      // .addFields({
      //   name: "Avatar",
      //   value: `${avatarURL}`,
      //   inline: true,
      // })
      .setDescription(`${comment.body.slice(0, options.commentSize)}`);
  } else {
    discordEmbed = new EmbedBuilder()
      .setColor(0x0079d3)
      .setURL(`https://www.reddit.com${comment.permalink}`)
      .setAuthor({
        name: comment.author.name,
        url: `https://www.reddit.com${comment.permalink}`,
        iconURL: avatarURL.url,
      })
      .setDescription(`${comment.body.slice(0, 500)}`);
  }

  discordClient.channels.cache
    .get(streamChannel)
    .send({ embeds: [discordEmbed] })
    .catch(err => { console.error(`[ERROR] Relpying to message ${message.id} -`, err.message); });
    var userEmoji = "📡";
    if (avatarURL.cached) { userEmoji = "👤"; }
  log.execute({ emoji: "💬", guild: comment.subreddit.display_name, userName: `${userEmoji} ${comment.author.name}`, message: comment.body });

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
  const avatarURL = await getAvatar(post.author.name);
  if (streamChannel == "1121273754857775114") { // bot test channel
    discordEmbed = new EmbedBuilder()
      .setColor(0xea0027)
      .setURL(`https://www.reddit.com${post.permalink}`)
      .setAuthor({
        name: `${post.author.name}`,
        url: `https://www.reddit.com${post.permalink}`,
        iconURL: avatarURL.url
      })
    // .addFields({
    //   name: "Self",
    //   value: `${post.is_self}`,
    //   inline: true,
    // })
    // .addFields({
    //   name: "Original",
    //   value: `${post.is_original_content}`,
    //   inline: true,
    // })
    // .addFields({
    //   name: "Video",
    //   value: `${post.is_video}`,
    //   inline: true,
    // })
    // .addFields({
    //   name: "Meta",
    //   value: `${post.is_meta}`,
    //   inline: true,
    // })
    // .addFields({
    //   name: "post hint",
    //   value: `${post.post_hint || "none"}`,
    //   inline: true,
    // })
    // .addFields({
    //   name: "Categories",
    //   value: `${post.content_categories || "none"}`,
    //   inline: false,
    // })
    // .addFields({
    //   name: "Id",
    //   value: `${post.id}`,
    //   inline: false,
    // })
  } else {
    discordEmbed = new EmbedBuilder()
      .setColor(0xea0027)
      .setURL(`https://www.reddit.com${post.permalink}`)
      .setAuthor({
        name: `${post.author.name}`,
        url: `https://www.reddit.com${post.permalink}`,
        iconURL: avatarURL.url
      })
  }

  var postMessage = `**${post.title.slice(0, 300)}**`;
  if (post.selftext) { postMessage += `\n${post.selftext.slice(0, 500)}` };
  var postEmoji = "📌"
  if (!post.is_self) {
    postEmoji = "🔗";
    if (post.post_hint !== "image") {
      postMessage += `\n[Link](${post.url})`;
    }
  }
  if (post.post_hint == "rich:video" || post.is_video == true) { postEmoji = "🎦" }
  if (post.post_hint == "image") {
    postEmoji = "📸";
    discordEmbed.setImage(post.url);
  }
  if (post.poll_data) { postEmoji = "✅" }

  if (post.thumbnail && post.thumbnail !== 'default' && post.thumbnail !== 'self' && post.post_hint !== "image") { discordEmbed.setThumbnail(post.thumbnail) };

  discordEmbed.setDescription(`${postEmoji}  ${postMessage}`);

  discordClient.channels.cache
    .get(streamChannel)
    .send({ embeds: [discordEmbed] })
    .catch(err => { console.error(`[ERROR] Relpying to message ${message.id} -`, err.message); });

    var userEmoji = "📡";
    if (avatarURL.cached) { userEmoji = "👤"; }
    log.execute({ emoji: postEmoji, guild: post.subreddit.display_name, userName: `${userEmoji} ${post.author.name}`, message: post.title });

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
  } else {
    discordClient.on(discordEvent.name, (...args) => discordEvent.execute(...args));
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
    log.execute({ emoji: '💻', module: 'COMMAND', feature: "Command Loaded", message: command.data.name });
  } else {
    console.log(
      `⛔ [WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
    );
  }
}

discordClient.login(process.env.DISCORD_TOKEN);
