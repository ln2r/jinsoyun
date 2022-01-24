import { SlashCommandBuilder } from "@discordjs/builders";
import { MessageEmbed } from "discord.js";
import { getApi } from "../utils/getApi.util.js";
import { getArrayContent } from "../utils/getArrayContent.util.js";

export const command = {
  data: new SlashCommandBuilder()
          .setName('weekly')
          .setDescription('See current weekly challenges'),
  async execute(interaction) {
    const apiData = await getApi(`${process.env.API_URL}/challenges/weekly`);

    const embed = new MessageEmbed()
      .setTitle(`Weekly Challenges`)
      .setColor('GREEN')
      .setDescription(getArrayContent(apiData.weekly))
      .setFooter({text: `Weekly Challenges - Source: ${apiData.metadata.source}`})
      .setTimestamp()

    await interaction.reply({ 
        content: `Current weekly challenges`, 
        components: [], 
        embeds: [embed]
      });
  },
}