const {Command} = require('discord.js-commando');
const utils = require('../../utils/index.js');

module.exports = class GuildSettingsCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'setting',
      aliases: ['set', 'config', 'change'],
      group: 'guild',
      memberName: 'setting',
      description: 'Change the bot setting. Use `show` to see the current guild/server settings. \n\tAvailable Settings: \n\t- `reset channel-name or disable` (To configure quest reset notification)\n\t- `twitter #channel-name or disable` (To configure blade and soul twitter tweet notification)\n\t- `gate #welcome-channel #follow-up-channel @role-name or disable` (To configure new member verification)',
      examples: ['setting option value', 'setting reset #channel-name', 'setting reset disable'],
      guildOnly: true,
    });
  }

  async run(msg, args) {
    msg.channel.startTyping();

    // checking if the command disabled or not
    const globalSettings = await utils.getGlobalSetting('setting');
    if (!globalSettings.status) {
      msg.channel.stopTyping();

      return msg.say('This command is currently disabled.\nReason: '+globalSettings.message);
    }

    const subQuery = ['reset', 'twitter', 'koldrak', 'welcome', 'joinmsg', 'show', 'admin', 'hunter'];
    let msgData = '';
    let embedData;
    // checking permission
    if (await utils.getAuthorPermission(msg, msg.guild.id)) {
      const guildSettings = await utils.getGuildSettings(msg.guild.id);
      let botPrefix;

      if (guildSettings) {
        botPrefix = guildSettings.prefix;
      } else {
        botPrefix = '!';
      }

      embedData = {
        'embed': {
          'title': 'Jinsoyun Bot - Available Settings',
          'description': 'To configure use `'+botPrefix+'setting option value`, to disable replce `#channel-name` or `@role-name` with disable.\nExamples:',
          'color': 16741688,
          'fields': [
            {
              'name': 'Twitter News',
              'value': 'Change: `'+botPrefix+'setting twitter #channel-name`\nDisable: `'+botPrefix+'setting twitter disable`',
            },
            {
              'name': 'Koldrak\'s Lair Access',
              'value': 'Change: `'+botPrefix+'setting koldrak #channel-name`\nDisable: `'+botPrefix+'setting koldrak disable`',
            },
            {
              'name': 'Hunter\'s Refugee Access',
              'value': 'Change: `'+botPrefix+'setting hunter #channel-name`\nDisable: `'+botPrefix+'setting hunter disable`',
            },
            {
              'name': 'Challenge Quests and Event Summary',
              'value': 'Change: `'+botPrefix+'setting reset #channel-name`\nDisable: `'+botPrefix+'setting reset disable`',
            },
            {
              'name': 'Bot Admin Roles',
              'value': 'Change: `'+botPrefix+'setting admin @mentioned-role.`\nDisable: `'+botPrefix+'setting admin disable `\nNote: Guild/Server owner will always have permission regardles having the roles or not.',
            },
            {
              'name': 'Join Command Custom Message',
              'value': 'Change: `'+botPrefix+'setting joinmsg Your message here.`\nDisable: `'+botPrefix+'setting joinmsg disable `\nNote: If you want to mention the message author use MESSAGE_AUTHOR, and SERVER_NAME when you want to add the server name.',
            },            
            {
              'name': 'New Member Welcome',
              'value':  `**Channel Selection**\nChange: \`${botPrefix}set welcome channel #channel-name\`\nDisable: \`${botPrefix}set welcome channel disable\`\n              
              **Followup Channel Selection (after join command used)**\nChange: \`${botPrefix}set welcome followup #channel-name\`\nDisable: \`${botPrefix}set welcome followup disable\`\n
              **Member Role**\nChange: \`${botPrefix}set welcome role @role-name\`\nDisable: \`${botPrefix}set welcome role disable\`\n
              **Message**\nChange: \`${botPrefix}set welcome msg message here\`\nDisable: \`${botPrefix}set welcome msg disable\`\nNotes: To add member name use \`MEMBER_NAME\`, to add server name use \`SERVER_NAME\`, to add bot prefix use \`BOT_PREFIX\`.`,
            },
          ],
        },
      };

      const query = args.split(' ');
      let changed = false;

      const setting = query[0];
      let optionDisplayName;
      let optionDescription;
      let optionEmbedData;

      let settingResetChannelText = '*No Channel Selected*';
      let settingTwitterChannelText = '*No Channel Selected*';

      let settingKoldrakChannelText = '*No Channel Selected*';
      let settingWelcomeChannelText = '*No Channel Selected*';
      let settingWelcomeFollowupChannelText = '*No Channel Selected*';
      let settingWelcomeRoleText = '*No Role Selected*';
      let settingWelcomeMessageText = '*No Message Set*';

      let settingFollowupMessageText = '*No Message Set*';

      let settingAdminRoleText = '*No Role Set*';

      let settingHuntersRefugeeText = '*No Channel Selected*';

      let welcomeSettings;
      let settingWelcomeMessage;

      let settingFollowupMessage;

      let settingAdminRoles;

      switch (setting) {
      case 'reset':
        if (query[1]) {
          let settingResetChannel;

          if (query[1] === 'disable') {
            settingResetChannel = null;
          } else {
            const resetChannelId = utils.getChannelId(query[1]);
            settingResetChannel = resetChannelId;
            settingResetChannelText = '<#'+resetChannelId+'>';
          }

          // update the database
          this.client.emit('notificationResetChange', msg.guild.id, settingResetChannel);

          changed = true;
        }

        if (!changed) {
          if (guildSettings) {
            if (guildSettings.quest_reset && guildSettings.quest_reset !== null) {
              settingResetChannelText = '<#'+guildSettings.quest_reset+'>';
            }
          }
        }

        optionDisplayName = 'Challenge Quests and Event Summary';
        optionDescription = 'Challange quests (daily, weekly) reset and event summary notification.';
        optionEmbedData = [
          {
            'name': 'Channel Name',
            'value': settingResetChannelText,
          },
        ];
        break;

      case 'twitter':
        if (query[1]) {
          let settingTwitterChannel;

          if (query[1] === 'disable') {
            settingTwitterChannel = null;
          } else {
            const channelId = utils.getChannelId(query[1]);

            settingTwitterChannel = channelId;
            settingTwitterChannelText = '<#'+channelId+'>';
          }

          // update the database
          this.client.emit('notificationTwitterChange', msg.guild.id, settingTwitterChannel);

          changed = true;
        }

        if (!changed) {
          if (guildSettings) {
            if (guildSettings.twitter && guildSettings.twitter !== null) {
              settingTwitterChannelText = '<#'+guildSettings.twitter+'>';
            }
          }
        }

        optionDisplayName = 'Twitter News';
        optionDescription = 'Blade & Soul and Blade & Soul Ops\'s tweets channel.';
        optionEmbedData = [
          {
            'name': 'Channel Name',
            'value': settingTwitterChannelText,
          },
        ];
        break;

      case 'koldrak':
        if (query[1]) {
          let settingKoldrakChannel;

          if (query[1] === 'disable') {
            settingKoldrakChannel = null;
          } else {
            const channelId = utils.getChannelId(query[1]);

            settingKoldrakChannel = channelId;
            settingKoldrakChannelText = '<#'+channelId+'>';
          }

          // update the database
          this.client.emit('notificationKoldrakChange', msg.guild.id, settingKoldrakChannel);

          changed = true;
        }

        if (!changed) {
          if (guildSettings) {
            if (guildSettings.koldrak && guildSettings.koldrak !== null) {
              settingKoldrakChannelText = '<#'+guildSettings.koldrak+'>';
            }
          }
        }

        optionDisplayName = 'Koldrak\'s Lair Access';
        optionDescription = 'Koldrak\'s Lair Access Notification.';
        optionEmbedData = [
          {
            'name': 'Channel Name',
            'value': settingKoldrakChannelText,
          },
        ];
        break;
        
        
      case 'welcome':
        if(guildSettings.welcome){
          welcomeSettings = guildSettings.welcome;
        }

        // Disable welcome system
        switch(query[1]){
        case 'disable':
          welcomeSettings.channel_id = null;
          changed = true;

          optionEmbedData = [
            {
              'name': 'New Member Welcome',
              'value': 'Disabled',
            },
          ];          
          break;

        // channel selection
        case 'channel':
          welcomeSettings.channel_id = utils.getChannelId(query[2]);
          settingWelcomeChannelText = '<#'+utils.getChannelId(query[2])+'>';          
          changed = true;

          optionEmbedData = [
            {
              'name': 'Welcome Channel',
              'value': settingWelcomeChannelText,
            },
          ];
          break;

        // after they did join command
        case 'followup':
          welcomeSettings.next = utils.getChannelId(query[2]);
          settingWelcomeChannelText = '<#'+utils.getChannelId(query[2])+'>';          
          changed = true;

          optionEmbedData = [
            {
              'name': 'Follow-up Channel',
              'value': settingWelcomeFollowupChannelText,
            },
          ];
          break;

        // role given
        case 'role':
          welcomeSettings.role_id = utils.getRoleId(query[2]);
          settingWelcomeRoleText = '<@&'+utils.getRoleId(query[2])+'>';          
          changed = true;

          optionEmbedData = [
            {
              'name': 'Member Role',
              'value': settingWelcomeRoleText,
            },
          ];
          break;
        
        // join msg
        case 'msg': 
          query.shift();

          settingWelcomeMessage = query.join(' ');

          if (settingWelcomeMessage.length > 0) {
            if (settingWelcomeMessage === 'disable') {
              settingWelcomeMessage = null;
            }
          }

          welcomeSettings.message = settingWelcomeMessage;
          changed = true;

          optionEmbedData = [
            {
              'name': 'Welcome Message',
              'value': settingWelcomeMessage,
            },
          ];
          break;   
          
        default:
          optionDisplayName = 'New Member Welcome';
          optionDescription = 'New member Welcome channel roles and message.';

          optionEmbedData = [
            {
              'name': 'To Disable',
              'value': `${botPrefix}set welcome disable`,
            },
            {
              'name': 'Welcome Channel',
              'value': `Change: ${botPrefix}set welcome channel #channel-name\nDisable: ${botPrefix}set welcome channel disable`,
            },
            {
              'name': 'Follow-up Channel',
              'value': `Change: ${botPrefix}set welcome followup #channel-name\nDisable: Change: ${botPrefix}set welcome followup disable`
            },
            {
              'name': 'Member Role',
              'value': `Change: ${botPrefix}set welcome role @role\nDisable: Change: ${botPrefix}set welcome role disable`
            },
            {
              'name': 'Welcome Message',
              'value': `Change: ${botPrefix}set welcome msg message here\nDisable: Change: ${botPrefix}set welcome msg disable\nNotes: To add member name use \`MEMBER_NAME\`, to add server name use \`SERVER_NAME\` to add bot prefix use \`BOT_PREFIX\`.`
            },
          ];
          break;
        }

        if (!changed) {
          if (guildSettings.welcome) {
            if (guildSettings.welcome.channel_id) settingWelcomeChannelText = '<#'+guildSettings.welcome.channel_id+'>';
            if (guildSettings.welcome.next) settingWelcomeFollowupChannelText = '<#'+guildSettings.welcome.next+'>';
            if (guildSettings.welcome.role_id) settingWelcomeRoleText = '<@&'+guildSettings.welcome.role_id+'>';
            if (guildSettings.welcome.message) settingWelcomeMessage = guildSettings.welcome.message;
          }
        }

        optionDisplayName = 'New Member Welcome';
        optionDescription = 'New member Welcome channel roles and message.';

        // update the database
        this.client.emit('newMemberChannelChange', msg.guild.id, welcomeSettings);
        break;

      case 'joinmsg':
        query.shift();

        settingFollowupMessage = query.join(' ');
        if (settingFollowupMessage.length > 0) {
          if (settingFollowupMessage === 'disable') {
            settingFollowupMessage = null;
          } else {
            settingFollowupMessageText = settingFollowupMessage;
          }

          // update the database
          this.client.emit('joinCustomMessageChange', msg.guild.id, settingFollowupMessage);

          changed = true;
        }

        if (!changed) {
          if (guildSettings) {
            if (guildSettings.join_message && guildSettings.join_message !== null) {
              settingFollowupMessageText = guildSettings.join_message;
            }
          }
        }

        optionDisplayName = 'Join Message';
        optionDescription = 'Custom message after user used join command.';
        optionEmbedData = [
          {
            'name': 'Message',
            'value': settingFollowupMessageText,
          },
        ];
        break;

      case 'show':
        if (guildSettings) {
          // reset notification
          if (guildSettings.quest_reset) settingResetChannelText = '<#'+guildSettings.quest_reset+'>';

          // twitter
          if (guildSettings.twitter) settingTwitterChannelText = '<#'+guildSettings.twitter+'>';

          // koldrak's lair
          if (guildSettings.koldrak) settingKoldrakChannelText = '<#'+guildSettings.koldrak+'>';

          // hunter's refugee
          if (guildSettings.hunters_refugee) settingHuntersRefugeeText = '<#'+guildSettings.hunters_refugee+'>';

          // new member welcome
          if (guildSettings.welcome.channel_id) settingWelcomeChannelText = '<#'+guildSettings.welcome.channel_id+'>';
          if (guildSettings.welcome.next) settingWelcomeFollowupChannelText = '<#'+guildSettings.welcome.next+'>';
          if (guildSettings.welcome.role_id) settingWelcomeRoleText = '<@&'+guildSettings.welcome.role_id+'>';
          if (guildSettings.welcome.message) settingWelcomeMessageText = guildSettings.welcome.message;

          // join command custom message
          if (guildSettings.join_message) settingFollowupMessageText = guildSettings.join_message;

          // bot's admins
          if (guildSettings.admin_roles && guildSettings.admin_roles[0] !== null) {
            settingAdminRoleText = []; // emptying the array

            guildSettings.admin_roles.map(roles => {
              settingAdminRoleText.push(`<@&${roles}+>`);
            });
          }
        }

        optionDisplayName = 'Current Guild\'s Settings';
        optionDescription = 'List of current guild\'s settings, use `'+botPrefix+'set` to see the options.';
        optionEmbedData = [
          {
            'name': 'Reset',
            'value': settingResetChannelText,
          },
          {
            'name': 'Twitter',
            'value': settingTwitterChannelText,
          },
          {
            'name': 'Koldrak',
            'value': settingKoldrakChannelText,
          },
          {
            'name': 'Hunter\'s Refugee',
            'value': settingHuntersRefugeeText,
          },
          {
            'name': 'New Member Welcome',
            'value': `Welcome Channel: ${settingWelcomeChannelText}\nFollow-up Channel: ${settingWelcomeFollowupChannelText}\nMember Role: ${settingWelcomeRoleText}\nMessage:\n${settingWelcomeMessageText}`,
          },
          {
            'name': 'Join Command Custom Message',
            'value': settingFollowupMessageText,
          },
          {
            'name': 'Bot\'s Admin Roles',
            'value': settingAdminRoleText,
          },
        ];
        break;

      case 'admin':
        query.shift();
        settingAdminRoles = query;

        if (settingAdminRoles.length !== 0) {
          if (settingAdminRoles[0] === 'disable') {
            settingAdminRoles = null;
          } else {
            settingAdminRoleText = []; // emptying the array

            for (let i=0; i<settingAdminRoles.length; i++) {
              settingAdminRoleText.push(settingAdminRoles[i]);
              settingAdminRoles[i] = utils.getRoleId(settingAdminRoles[i]);
            }
          }

          // update the database
          this.client.emit('adminRolesChange', msg.guild.id, settingAdminRoles);

          changed = true;
        }

        if (!changed) {
          if (guildSettings) {
            if (guildSettings.admin_roles && guildSettings.admin_roles[0] !== null) {
              settingAdminRoleText = []; // emptying the array

              for (let i=0; i<guildSettings.admin_roles.length; i++) {
                settingAdminRoleText.push('<@&'+guildSettings.admin_roles[i]+'>');
              }
            }
          }
        }

        optionDisplayName = 'Bot Admin Roles';
        optionDescription = 'List of admin roles who can modified bot\'s settings';
        optionEmbedData = [
          {
            'name': 'Roles',
            'value': settingAdminRoleText.join(', '),
          },
        ];

        break;

      case 'hunter':
        if (query[1]) {
          let settingHuntersRefugeeChannel;

          if (query[1] === 'disable') {
            settingHuntersRefugeeChannel = null;
          } else {
            const channelId = utils.getChannelId(query[1]);

            settingHuntersRefugeeChannel = channelId;
            settingHuntersRefugeeText = '<#'+channelId+'>';
          }

          // update the database
          this.client.emit('notificationHuntersChange', msg.guild.id, settingHuntersRefugeeChannel);

          changed = true;
        }

        if (!changed) {
          if (guildSettings) {
            if (guildSettings.hunters_refugee && guildSettings.hunters_refugee !== null) {
              settingHuntersRefugeeText = '<#'+guildSettings.hunters_refugee+'>';
            }
          }
        }

        optionDisplayName = 'Hunter\'s Refugee Access';
        optionDescription = 'Hunter\'s Refugee Access Notification.';
        optionEmbedData = [
          {
            'name': 'Channel Name',
            'value': settingHuntersRefugeeText,
          },
        ];
        break;
      }


      if (subQuery.includes(setting)) {
        if (changed === true) {
          msgData = msg.guild.name+'\'s setting for *'+optionDisplayName+'* has been changed.';
        } else {
          msgData = msg.guild.name+'\'s setting for *'+optionDisplayName+'*.';
        }
        embedData = {
          'embed': {
            'title': optionDisplayName,
            'description': optionDescription,
            'color': 16741688,
            'fields': optionEmbedData,
          },
        };
      }
    } else {
      msgData = 'You don\'t have the permission to use that command';
    }

    msg.channel.stopTyping();

    return msg.say(msgData, embedData);
  }
};
