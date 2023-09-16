const { Events, ActivityType } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const log = require("../modules/logger.js");

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    log.execute({ emoji: '🤖', module: 'READY', feature: 'Bot Logged In', message: `${client.user.username} (${client.user.tag})` });

    client.guilds.cache.forEach((guild) => {
      log.execute({ emoji: '🖥️ ', module: 'READY', feature: 'Guild Joined', message: `${guild.name} (${guild.memberCount})` });
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
