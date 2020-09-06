const {Command} = require('discord.js-commando');
const Utils = require('../../Utils/index.js');
const Services = require('../../Services/index.js');

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
      clientPermissions: ['CHANGE_NICKNAME', 'MANAGE_NICKNAMES'],
    });
  }

  async run(msg, args) {
    args = args.toLowerCase();
    let Failed = true;
    let Message = '';

    // checking if the command disabled or not
    const GlobalSettings = await Utils.getGlobalSetting('reg');
    if (!GlobalSettings.status) {
      return msg.say('This command is currently disabled.\nReason: '+GlobalSettings.Message);
    }

    const GuildSettingData = await Utils.getGuildSettings(msg.guild.id);

    // formatting the nickname
    const UserNickname = args.replace(/(^|\s)\S/g, (l) => l.toUpperCase());

    if (GuildSettingData) {
      if (GuildSettingData.join && GuildSettingData.join.status !== 'disable') {
        // changing the nickname
        if (msg.channel.permissionsFor(this.client.user).has('MANAGE_NICKNAMES') && msg.author.id !== msg.guild.owner.id) {
          msg.guild.members.cache.get(msg.author.id).setNickname(UserNickname);
        }else{
          Message = 'Warning: Nickname isn\'t changed, permission not granted.';
        }

        // checking and adding the role
        if (GuildSettingData.join.role) {
          // checking if the guild have the role, add if yes add them
          if(msg.channel.permissionsFor(this.client.user).has('MANAGE_ROLES')){
            if ((msg.guild.roles.cache.find((role) => role.id === GuildSettingData.join.role)) !== null) {
              msg.guild.members.cache.get(msg.author.id).roles.add(GuildSettingData.join.role);
            }
          }else{
            Message = 'Warning: Role isn\'t added, permission not granted';
          }            
        }

        // checking guild setting 
        Services.sendLog('debug', 'Cmd-Join', `ch: ${GuildSettingData.join.channel}, msg: ${GuildSettingData.join.message}`);

        if ((GuildSettingData.join.channel && GuildSettingData.join.channel !== null) && (GuildSettingData.join.message && GuildSettingData.join.Message !== null)) {

          // checking permission
          const PermissionView = msg.channel.permissionsFor(this.client.user).has('VIEW_CHANNEL');
          const PermissionSend = msg.channel.permissionsFor(this.client.user).has('SEND_MESSAGES');
          Services.sendLog('debug', 'Cmd-Join', `perm-view: ${PermissionView}, perm-send: ${PermissionSend}`);

          if(PermissionView && PermissionSend){
            const joinMessageAuthor = '<@'+msg.author.id+'>';
            const joinServerName = msg.guild.name;

            let customJoinMessage = GuildSettingData.join.message;
            // replacing some stuff
            customJoinMessage = customJoinMessage.replace('MESSAGE_AUTHOR', joinMessageAuthor);
            customJoinMessage = customJoinMessage.replace('SERVER_NAME', joinServerName);

            msg.guild.channels.cache.find((ch) => ch.id === GuildSettingData.join.channel).send(`${customJoinMessage}\n\n${Message}`);

            Failed = false;
          }else{
            Message = 'I don\'t have permission to see or write on that channel.';
          }          
        }else{
          Message = 'This guild/server don\'t have member verification set.';
        }
      }else{
        Message = 'This guild/server don\'t have member verification set.';
      }
    }

    if(Failed) msg.channel.send(Message);
  }
};
