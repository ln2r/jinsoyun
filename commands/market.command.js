import { SlashCommandBuilder } from "@discordjs/builders";
import { MessageEmbed } from "discord.js";

import { getApi } from "../utils/getApi.util.js";
import { getMarketData } from "../utils/getMarketData.util.js";

export const command = {
  data: new SlashCommandBuilder()
          .setName('market')
          .setDescription('Get marketplace info for an item')
          .addStringOption(option => 
            option.setName('region')
                  .setDescription('Market region (na/eu)')
                  .setRequired(true)  
          )
          .addStringOption(option => 
            option.setName('name')
                  .setDescription('Item name')
                  .setRequired(true)
          ),
  async execute(interaction) {
    const query = interaction.options.get('name');
    const region = interaction.options.get('region');

    const apiData = await getApi(`${process.env.API_URL}/market/${region.value}/${query.value}`);
    
    if (apiData === 'Not Found') {
      return await interaction.reply({
        content: `Nothing found under **${query.value}**`, 
        components: [], 
        embeds: []
      })
    }

    const embed = new MessageEmbed()
      .setTitle(`Marketplace - ${(region.value).toUpperCase()}`)
      .setColor('YELLOW')
      .setDescription(getMarketData(apiData))
      .setFooter({text: `Marketplace Information - Source: Silver's BnS API`})
      .setTimestamp()

    await interaction.reply({ 
      content: `Results for **${query.value}**`, 
      components: [], 
      embeds: [embed]
    });
  },
}