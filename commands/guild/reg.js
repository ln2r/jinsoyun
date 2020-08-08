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
      clientPermissions: ['CHANGE_NICKNAME', 'MANAGE_NICKNAMES', 'MANAGE_ROLES'],
    });
  }

  async run(msg, args) {
    args = args.toLowerCase();
    let failed = true;
    let message = 'This guild/server don\'t have member verification set or it\'s possible I don\'t have permission to send message there.';

    // checking if the command disabled or not
    const globalSettings = await utils.getGlobalSetting('reg');
    if (!globalSettings.status) {
      return msg.say('This command is currently disabled.\nReason: '+globalSettings.message);
    }

    const guildSettingData = await utils.getGuildSettings(msg.guild.id);

    // formatting the nickname
    const userCharaName = args.replace(/(^|\s)\S/g, (l) => l.toUpperCase());

    if (guildSettingData) {
      if (guildSettingData.join && guildSettingData.join.status !== 'disable') {
        // changing the nickname
        if (msg.channel.permissionFor(this.client.user).has('MANAGE_ROLES') || msg.author.id !== msg.guild.ownerID) {
          msg.guild.members.cache.get(msg.author.id).setNickname(userCharaName);
        }else{
          message = 'I don\'t have the permission to modify your nickname.';
        }

        // checking and adding the role
        if (guildSettingData.join.role) {
          // checking if the guild have the role, add if yes add them
          if(msg.channel.permissionFor(this.client.user).has('MANAGE_ROLES')){
            if ((msg.guild.roles.cache.find((role) => role.id === guildSettingData.join.role)) !== null) {
              msg.guild.members.cache.get(msg.author.id).roles.add(guildSettingData.join.role);
            }
          }else{
            message = 'I don\'t have the permission to modify your role.';
          }            
        }

        // checking guild setting and permission to send join message
        if ((guildSettingData.join.channel && guildSettingData.join.channel !== null) && (guildSettingData.join.message && guildSettingData.join.message !== null) && (msg.channel.permissionsFor(this.client.user).has('VIEW_CHANNEL') && msg.channel.permissionsFor(this.client.user).has('SEND_MESSAGES'))) {
          const joinMessageAuthor = '<@'+msg.author.id+'>';
          const joinServerName = msg.guild.name;
          let customJoinMessage = guildSettingData.join.message;
          // replacing some stuff
          customJoinMessage = customJoinMessage.replace('MESSAGE_AUTHOR', joinMessageAuthor);
          customJoinMessage = customJoinMessage.replace('SERVER_NAME', joinServerName);

          msg.guild.channels.cache.find((ch) => ch.id === guildSettingData.join.channel).send(customJoinMessage);

          failed = false;
        }
      }
    }

    if(failed) msg.channel.send(message);
  }
};
