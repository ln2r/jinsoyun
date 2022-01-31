import { SlashCommandBuilder } from "@discordjs/builders";
import { MessageEmbed } from "discord.js";
import { getApi } from "../utils/getApi.util.js";
import { getArrayContent } from "../utils/getArrayContent.util.js";

export const command = {
  data: new SlashCommandBuilder()
          .setName('daily')
          .setDescription('See selected or current daily challenges')
          .addStringOption(option => 
            option.setName('day')
                  .setDescription('Day selection')
          ),
  async execute(interaction) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const query = (interaction.options.get('day'))?.value || days[new Date().getUTCDay()];

    // const apiData = await getApi(`${process.env.API_URL}/challenges/${query.toLowerCase()}`);

    // const embed = new MessageEmbed()
    //   .setTitle(`Daily Challenges - ${query.replace(/^\w/, (c) => c.toUpperCase())}`)
    //   .setColor('GREEN')
    //   .setDescription(getArrayContent(apiData.daily))
    //   .setFooter({text: `Daily Challenges - Source: ${apiData.metadata.source}`})
    //   .setTimestamp()

    // await interaction.reply({ 
    //     content: `Daily challenges for **${query.replace(/^\w/, (c) => c.toUpperCase())}**`, 
    //     components: [], 
    //     embeds: [embed]
    //   });

    await interaction.reply({
      content: `Disabled until better source found or hongmoon-archive challenges list back online.`
    })
  },
}