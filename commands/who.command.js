import { SlashCommandBuilder } from "@discordjs/builders";
import { MessageEmbed } from "discord.js";
import { getAccessories } from "../utils/getAccessories.util.js";
import { getApi } from '../utils/getApi.util.js';
import { getArrayContent } from "../utils/getArrayContent.util.js";

export const command = {
  data: new SlashCommandBuilder()
          .setName('who')
          .setDescription('Get a character information')
          .addStringOption(option => 
            option.setName('region')
                  .setDescription('Character region origin (na/eu)')
                  .setRequired(true)  
          )
          .addStringOption(option => 
            option.setName('name')
                  .setDescription('Character name')
                  .setRequired(true)
          ),
  async execute(interaction) {
    const query = interaction.options.get('name');
    const region = interaction.options.get('region');

    const apiData = await getApi(`${process.env.API_URL}/character/${region.value}/${query.value}`);

    if (apiData === 'Not Found') {
      return await interaction.reply({
        content: `No data found on **${query.value}**`, 
        components: [], 
        embeds: []
      })  
    }

    const embed = new MessageEmbed()
      .setColor('BLUE')
      .setTitle(`${apiData.server} ${apiData.race} ${apiData.class} ${apiData.name}`)
      .setDescription(`
        **Level:** ${apiData.level}
        **Attack Power**: ${apiData.stats.attackPower.value}
        **Defense**: ${apiData.stats.defense.value}
        **Guild**: ${apiData.guild}
        **Faction**: ${(apiData.faction.name === null)? 'No Data' : apiData.faction.name } (${(apiData.faction.rank === null)? 'No Data' : apiData.faction.rank })
        **Last Seen**: ${apiData.lastSeen}
      `)
      .addFields(
        { name: 'Stats', 
          value: `
            **HP**: ${apiData.stats.hp.value}
            **Regeneration (In-Combat)**: ${apiData.stats.hp.regenCombat}
            **Recovery**: ${apiData.stats.hp.recovery} (${apiData.stats.hp.recoveryRate}%)
            **Critical**: ${apiData.stats.critical.value} (${apiData.stats.critical.rate}%)
            **Critical Damage**: ${apiData.stats.critical.damage} (${apiData.stats.critical.damageRate}%)
            **Mystic Damage**: ${apiData.stats.mystic.value} (${apiData.stats.mystic.rate}%)
            **Block**: ${apiData.stats.block.value} (${apiData.stats.block.rate}%)
            **Damage Reduction**: ${apiData.stats.block.reduction}%
            **Evasion**: ${apiData.stats.evasion.value} (${apiData.stats.evasion.rate}%)
            **Boss (Attack Power - Defense)**: ${apiData.stats.attackPower.boss} - ${apiData.stats.defense.boss}
            **PVP (Attack Power - Defense)**: ${apiData.stats.attackPower.pvp} - ${apiData.stats.defense.pvp}
          `
        },
      )
      .addFields(
        { name: 'Weapon', value: apiData.equipments.weapon },
        { name: 'Accesories', value: getAccessories(apiData) },
        { name: 'Gems', value: getArrayContent(apiData.equipments.gems) },
        { name: 'Soulshields', value: getArrayContent(apiData.equipments.soulshields) },
      )
      .setThumbnail(apiData.profileImage)
      .setFooter({text: `Character Information - Source: ${apiData.metadata.source}`})
      .setTimestamp();

      await interaction.reply({ 
        content: `Information on **${apiData.name}**`, 
        components: [], 
        embeds: [embed]
      });
  },
}