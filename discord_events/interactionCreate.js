const { Events, Component } = require("discord.js");

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

      const logDate = new Date(interaction.createdTimestamp).toLocaleString();
      if (!interaction.guild) {
        console.log(
          '\x1b[34m%s\x1b[0m', `[${logDate.padEnd(23)}] 💻 COMAND| Private Message | ${interaction.user.tag} | ${interaction.commandName}`
        );
      } else {
        console.log(
          '\x1b[34m%s\x1b[0m', `[${logDate.padEnd(23)}] 💻 COMAND| ${interaction.guild.name} | ${interaction.channel.name} | ${interaction.member.displayName} (${interaction.user.tag}) | ${interaction.commandName}`
        );
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
