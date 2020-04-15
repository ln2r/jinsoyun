const {Command} = require('discord.js-commando');
const utils = require('../../utils/index.js');

module.exports = class RegCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'reg',
      aliases: ['join', 'register'],
      group: 'guild',
      memberName: 'reg',
      description: 'Register yourself into the guild so you can access the rest of the guild',
      examples: ['reg <charcter name> <character class>', 'reg jinsoyun blade dancer'],
      guildOnly: true,
      hidden: true,
      clientPermissions: ['CHANGE_NICKNAME', 'MANAGE_NICKNAMES'],
    });
  }

  async run(msg, args) {
    args = args.toLowerCase();

    // checking if the command disabled or not
    const globalSettings = await utils.getGlobalSetting('reg');
    if (!globalSettings.status) {
      msg.channel.stopTyping();

      return msg.say('This command is currently disabled.\nReason: '+globalSettings.message);
    }

    // console.debug("[soyun] [reg] ["+msg.guild.name+"] roles data: "+rolesList);
    let guildSettingData = await utils.getGuildSettings(msg.guild.id);

    // formatting the nickname
    const userCharaName = args.replace(/(^|\s)\S/g, (l) => l.toUpperCase());

    if (guildSettingData.settings) {
      if (guildSettingData.member_gate) {
        // changing the nickname
        if (msg.author.id !== msg.guild.ownerID) {
          msg.guild.members.cache.get(msg.author.id).setNickname(userCharaName);
        }

        // checking and adding the role
        if (guildSettingData.member_gate.role_id) {
          // checking if the guild have the role, add if yes
          if ((msg.guild.roles.cache.find((role) => role.id === guildSettingData.member_gate.role_id)) !== null) {
            msg.guild.members.cache.get(msg.author.id).roles.add(guildSettingData.member_gate.role_id);
          }
        }

        if ((guildSettingData.member_gate.next && guildSettingData.member_gate.next !== null) && (guildSettingData.join_message && guildSettingData.join_message !== null)) {
          const joinMessageAuthor = '<@'+msg.author.id+'>';
          const joinServerName = msg.guild.name;
          let customJoinMessage = guildSettingData.join_message;
          // replacing some stuff
          customJoinMessage = customJoinMessage.replace('MESSAGE_AUTHOR', joinMessageAuthor);
          customJoinMessage = customJoinMessage.replace('SERVER_NAME', joinServerName);

          msg.guild.channels.cache.find((ch) => ch.id === guildSettingData.member_gate.next).send(customJoinMessage);
        }
      }
    } else {
      msg.channel.send('This guild/server don\'t have member verification set.');
    }
  }
};
