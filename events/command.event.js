import { discordClient } from '../configs/discord.config.js';

export const event = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isCommand()) return;

      const command = discordClient.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'Error occured!', ephemeral: true });
      };
  }
}