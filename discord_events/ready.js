const { Events, ActivityType } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    var startDate = new Date();
    console.log(
      '\x1b[34m%s\x1b[0m', `[${startDate.toLocaleString().padEnd(23)}] 🤖 START | Bot Logged In | ${client.user.username} (${client.user.tag})`
    );

    client.guilds.cache.forEach((guild) => {
      console.log('\x1b[34m%s\x1b[0m', `[${startDate.toLocaleString().padEnd(23)}] 🖥️  GUILD | Guild Joined  | ${guild.name} (${guild.memberCount})`);
    });

    client.user.setPresence({
      status: "online",
      activities: [
        {
          type: ActivityType.Watching,
          name: "Reddit",
        },
      ],
    });
  },
};
