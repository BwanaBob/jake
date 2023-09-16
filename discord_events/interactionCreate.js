const { Events, Component } = require("discord.js");
const log = require("../modules/logger.js");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isChatInputCommand()) {

      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        console.error(
          `⛔ No command matching ${interaction.commandName} was found.`
        );
        return;
      }

      // const logDate = new Date(interaction.createdTimestamp).toLocaleString();
      if (!interaction.guild) {
        log.execute({ emoji: '💻', module: 'COMMAND', feature: interaction.commandName, userName: interaction.user.username, nickname: interaction.member.nickname, message: "Private Message" });

      } else {
        log.execute({ emoji: '💻', module: 'COMMAND', feature: interaction.commandName, userName: interaction.user.username, nickname: interaction.member.nickname, guild: interaction.guild.name, channel: interaction.channel.name });
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`⛔ Error executing ${interaction.commandName}`);
        console.error(error);
      }
    }
  },
};
