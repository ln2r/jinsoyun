import { SlashCommandBuilder } from "@discordjs/builders";
import { MessageEmbed } from "discord.js";
import { getApi } from "../utils/getApi.util.js";

export const command = {
  data: new SlashCommandBuilder()
          .setName('event')
          .setDescription('Get current running event'),
  async execute(interaction) {
    const apiData = await getApi(`${process.env.API_URL}/event/`);
    const events = []
    apiData.events.map(event => {
      events.push(`**${event.title}**
      *${event.summary.replace(':', '.')}*
      - Duration: ${event.duration}
      - Redeem: ${event.redemption}
      - Currency: ${event.currency}
      `)
    })

    const embed = new MessageEmbed()
      .setTitle(`Current Event`)
      .setURL(apiData.metadata.source)
      .setColor('BLUE')
      .setDescription(events.join('\n'))
      .setFooter({text: `Current Event - Source: Blade and Soul`})
      .setTimestamp()

      await interaction.reply({ 
        content: `Current running events`, 
        components: [], 
        embeds: [embed]
      });
  },
}