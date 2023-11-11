const { CommentStream, SubmissionStream, ModQueueStream } = require("snoostorm");
const Snoowrap = require("snoowrap");
require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const options = require("./options.json");
const log = require("./modules/logger.js");
const users = require("./modules/users.js");

const { Client, GatewayIntentBits, EmbedBuilder, Collection } = require("discord.js");
const { runInThisContext } = require("node:vm");
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
var modPing = "";
const connectedAt = Date.now() / 1000;

const comments = new CommentStream(redditClient, {
  subreddit: options.commentSubs,
  limit: options.commentLimit,
  pollTime: options.commentPollTime,
});

comments.on("item", async comment => {
  if (connectedAt > comment.created_utc) return;
  // console.log(comment.banned_at_utc == null);
  streamChannel = options.subreddits[comment.subreddit.display_name].channelId || false;
  if (!streamChannel) { return; }
  var thisCommentColor = options.commentEmbedColor;
  if (comment.banned_at_utc != null && comment.spam) { thisCommentColor = options.spamCommentEmbedColor }
  if (comment.banned_at_utc != null && !comment.spam) { return; } // these should be shown by the modqueue function
  var discordEmbed = new EmbedBuilder()
  const avatarURL = await users.getAvatar(comment.author.name);
  if (streamChannel == "1121273754857775114") {
    // bot test channel
    discordEmbed = new EmbedBuilder()
      .setColor(thisCommentColor)
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
      .setColor(thisCommentColor)
      .setURL(`https://www.reddit.com${comment.permalink}`)
      .setAuthor({
        name: comment.author.name,
        url: `https://www.reddit.com${comment.permalink}`,
        iconURL: avatarURL.url,
      })
      .setDescription(`${comment.body.slice(0, options.commentSize)}`);
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
  const avatarURL = await users.getAvatar(post.author.name);
  if (streamChannel == "1121273754857775114") { // bot test channel
    discordEmbed = new EmbedBuilder()
      .setColor(options.submissionEmbedColor)
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
      .setColor(options.submissionEmbedColor)
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
    .catch(err => { console.error(`[ERROR] Sending message ${message.id} -`, err.message); });

  var userEmoji = "📡";
  if (avatarURL.cached) { userEmoji = "👤"; }
  log.execute({ emoji: postEmoji, guild: post.subreddit.display_name, userName: `${userEmoji} ${post.author.name}`, message: post.title });

});


const modQueue = new ModQueueStream(redditClient, {
  subreddit: options.modQueueSubs,
  limit: options.modQueueLimit,
  pollTime: options.modQueuePollTime,
});

modQueue.on("item", async queueItem => {
  // console.log((queueItem));
  if (connectedAt > queueItem.created_utc) return;
  modPing = options.subreddits[queueItem.subreddit.display_name].modQueueNotifyRole || false;
  streamChannel = options.subreddits[queueItem.subreddit.display_name].channelId || false;
  debugChannel = options.subreddits["OPLTesting"].channelId || false;
  if (!streamChannel) { return; }      //
  const avatarURL = await users.getAvatar(queueItem.author.name);
  const bannedByUser = await queueItem.banned_by?.name || "Unknown";
  switch (queueItem.constructor.name) {
    case "Comment":
      var discordEmbed = new EmbedBuilder()
        .setColor(options.modQueueCommentEmbedColor)
        .setTitle("Mod Queue Comment")
        .setURL(`https://www.reddit.com${queueItem.permalink}`)
        .setAuthor({
          name: queueItem.author.name,
          url: `https://www.reddit.com${queueItem.permalink}`,
          iconURL: avatarURL.url,
        })
        .setDescription(`${queueItem.body.slice(0, options.commentSize)}`);

      var debugEmbed = new EmbedBuilder()
        .setColor(options.modQueueCommentEmbedColor)
        .setTitle("Mod Queue Comment")
        .setURL(`https://www.reddit.com${queueItem.permalink}`)
        .setAuthor({
          name: queueItem.author.name,
          url: `https://www.reddit.com${queueItem.permalink}`,
          iconURL: avatarURL.url,
        })
        .addFields({
          name: "Subreddit",
          value: `${queueItem.subreddit_name_prefixed}`,
          inline: true,
        })
        .addFields({
          name: "Banned By",
          value: `${bannedByUser}`,
          inline: true,
        })
        .addFields({
          name: "Ban Note",
          value: `${queueItem.ban_note}`,
          inline: true,
        })
        .addFields({
          name: "Removed",
          value: `${queueItem.removed}`,
          inline: true,
        })
        .addFields({
          name: "Removal Reason",
          value: `${queueItem.removal_reason}`,
          inline: true,
        })
        .addFields({
          name: "Spam",
          value: `${queueItem.spam}`,
          inline: true,
        })
        .setDescription(`${queueItem.body.slice(0, options.commentSize)}`);

      if (modPing) {
        discordClient.channels.cache
          .get(streamChannel)
          .send({ embeds: [discordEmbed], content: `<@&${modPing}>` })
          .catch(err => { console.error(`[ERROR] Sending message ${message.id} -`, err.message); });
      } else {
        discordClient.channels.cache
          .get(streamChannel)
          .send({ embeds: [discordEmbed] })
          .catch(err => { console.error(`[ERROR] Sending message ${message.id} -`, err.message); });
      }
      discordClient.channels.cache
        .get(debugChannel)
        .send({ embeds: [debugEmbed] })
        .catch(err => { console.error(`[ERROR] Sending message ${message.id} -`, err.message); });

      var userEmoji = "📡";
      if (avatarURL.cached) { userEmoji = "👤"; }
      log.execute({ emoji: "✅", guild: queueItem.subreddit.display_name, userName: `${userEmoji} ${queueItem.author.name}`, message: queueItem.body });
      break;
    case "Submission":
      var discordEmbed = new EmbedBuilder()
        .setColor(options.modQueuePostEmbedColor)
        .setTitle("Mod Queue Post")
        .setURL(`https://www.reddit.com${queueItem.permalink}`)
        .setAuthor({
          name: queueItem.author.name,
          url: `https://www.reddit.com${queueItem.permalink}`,
          iconURL: avatarURL.url,
        })
        .setDescription(`${queueItem.title}`);

      var debugEmbed = new EmbedBuilder()
        .setColor(options.modQueuePostEmbedColor)
        .setTitle("Mod Queue Post")
        .setURL(`https://www.reddit.com${queueItem.permalink}`)
        .setAuthor({
          name: queueItem.author.name,
          url: `https://www.reddit.com${queueItem.permalink}`,
          iconURL: avatarURL.url,
        })
        .addFields({
          name: "Subreddit",
          value: `${queueItem.subreddit_name_prefixed}`,
          inline: true,
        })
        .addFields({
          name: "Banned By",
          value: `${bannedByUser}`,
          inline: true,
        })
        .addFields({
          name: "Ban Note",
          value: `${queueItem.ban_note}`,
          inline: true,
        })
        .addFields({
          name: "Removed",
          value: `${queueItem.removed}`,
          inline: true,
        })
        .addFields({
          name: "Removal Reason",
          value: `${queueItem.removal_reason}`,
          inline: true,
        })
        .addFields({
          name: "Removal By Category",
          value: `${queueItem.removed_by_category}`,
          inline: true,
        })
        .addFields({
          name: "Spam",
          value: `${queueItem.spam}`,
          inline: true,
        })
        .setDescription(`${queueItem.title}`);

      if (modPing) {
        discordClient.channels.cache
          .get(streamChannel)
          .send({ embeds: [discordEmbed], content: `<@&${modPing}>` })
          .catch(err => { console.error(`[ERROR] Sending message ${message.id} -`, err.message); });
      } else {
        discordClient.channels.cache
          .get(streamChannel)
          .send({ embeds: [discordEmbed] })
          .catch(err => { console.error(`[ERROR] Sending message ${message.id} -`, err.message); });
      }
      discordClient.channels.cache
        .get(debugChannel)
        .send({ embeds: [debugEmbed] })
        .catch(err => { console.error(`[ERROR] Sending message ${message.id} -`, err.message); });

      var userEmoji = "📡";
      if (avatarURL.cached) { userEmoji = "👤"; }
      log.execute({ emoji: "✅", guild: queueItem.subreddit.display_name, userName: `${userEmoji} ${queueItem.author.name}`, message: queueItem.title });
      break;

  }

});


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
