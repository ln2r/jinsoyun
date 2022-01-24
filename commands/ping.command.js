import { SlashCommandBuilder } from "@discordjs/builders";

export const command = {
  data: new SlashCommandBuilder()
          .setName('ping')
          .setDescription('hi!'),
  async execute(interaction) {
    await interaction.reply('hello!');
  },
}