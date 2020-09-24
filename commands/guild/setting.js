/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
const {Command} = require('discord.js-commando');
const utils = require('../../utils/index.js');

module.exports = class GuildSettingsCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'setting',
      aliases: ['set', 'config', 'change'],
      group: 'guild',
      memberName: 'setting',
      description: 'Change bot setting.',
      examples: [
        'setting option value',
        'setting reset #channel-name',
        'setting reset disable',
      ],
      guildOnly: true,
    });
  }

  async run(msg, args) {
    msg.channel.startTyping();

    // checking if the command disabled or not
    const globalSettings = await utils.getGlobalSetting('setting');
    if (!globalSettings.status) {
      msg.channel.stopTyping();

      return msg.say(`Command disabled. ${globalSettings.message}`);
    }

    const subQuery = ['reset',
      'twitter',
      'koldrak',
      'welcome',
      'join',
      'show',
      'admin',
      'hunter',
    ];
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

      const query = args.split(' ');
      let changed = false;

      const setting = query[0];
      let optionDisplayName;
      let optionDescription;
      let optionEmbedData;

      // reset
      let resetChannelText = '*No Channel Selected*';
      // twitter
      let twitterChannelText = '*No Channel Selected*';
      // koldrak
      let koldrakChannelText = '*No Channel Selected*';
      // hunter's
      let huntersRefugeeText = '*No Channel Selected*';
      // admin role
      let adminRoles;
      let adminRoleText = '*No Role Selected*';
      // welcome
      let welcomeSettings;
      let welcomeMessage;
      let welcomeChannelText = '*No Channel Selected*';
      let welcomeMessageText = '*No Message Selected*';
      // join
      let joinSettings;
      let joinMessage;
      let joinMessageText = '*No Message Selected*';
      let joinRoleText = '*No Role Selected*';
      let joinChannelText = '*No Channel Selected*';
      let joinStatusText = '*Disabled*';

      embedData = {
        'embed': {
          'title': 'Jinsoyun Bot - Available Settings',
          'description': `To configure use \`${botPrefix}setting option value\`, to disable replce \`#channel-name\` or \`@role-name\` with disable.`,
          'color': 16741688,
          'fields': [
            {
              'name': 'Twitter News',
              'value': `Change: \`${botPrefix}setting twitter #channel-name\`
                       Disable: \`${botPrefix}setting twitter disable\``,
            },
            {
              'name': 'Koldrak\'s Lair Access',
              'value': `Change: \`${botPrefix}setting koldrak #channel-name\`
                       Disable: \`${botPrefix}setting koldrak disable\``,
            },
            {
              'name': 'Hunter\'s Refugee Access',
              'value': `Change: \`${botPrefix}setting hunter #channel-name\`
                        Disable: \`'${botPrefix}'setting hunter disable\``,
            },
            {
              'name': 'Challenge Quests and Event Summary',
              'value': `Change: \`${botPrefix}setting reset #channel-name\`
                        Disable: \`${botPrefix}setting reset disable\``,
            },
            {
              'name': 'Bot Admin Roles',
              'value': `Change: \`${botPrefix}setting admin @mentioned-role.\`
              Disable: \`${botPrefix}'setting admin disable\`
              Note: Guild/Server owner will always have permission regardles having the roles or not.`,
            },
            {
              'name': 'Join Command',
              'value': `**Channel Selection (after join command used)**
              Change: \`${botPrefix}setting join ch #channel-name\`
              Disable: \`${botPrefix}setting join ch disable\`
              **Member Role**
              Change: \`${botPrefix}setting join role @role-name\`
              Disable: \`${botPrefix}setting join role disable\`
              **Message**
              Change: \`${botPrefix}setting join msg Your message here.\`
              Disable: \`${botPrefix}setting join msg disable \`
              Note: If you want to mention the message author use \`MESSAGE_AUTHOR\`, and \`SERVER_NAME\` when you want to add the server name.`,
            },
            {
              'name': 'New Member Welcome',
              'value': `**Channel Selection**
              Change: \`${botPrefix}setting welcome ch #channel-name\`
              Disable: \`${botPrefix}setting welcome ch disable\`
              **Message**
              Change: \`${botPrefix}setting welcome msg message here\`
              Disable: \`${botPrefix}setting welcome msg disable\`
              Notes: To add member name use \`MEMBER_NAME\`, to add server name use \`SERVER_NAME\`, to add bot prefix use \`BOT_PREFIX\`.`,
            },
          ],
        },
      };

      if (subQuery.includes(setting)) {
        switch (setting) {
        // quests reset
        case 'reset':
          if (query[1]) {
            let settingResetChannel;

            if (query[1] === 'disable') {
              settingResetChannel = null;
            } else {
              const resetChannelId = utils.getChannelId(query[1]);
              settingResetChannel = resetChannelId;
              resetChannelText = '<#'+resetChannelId+'>';
            }

            // update the database
            this.client.emit('notificationResetChange', msg.guild.id, settingResetChannel);

            changed = true;
          }

          if (!changed) {
            if (guildSettings.quest_reset && guildSettings.quest_reset !== null) {
              resetChannelText = '<#'+guildSettings.quest_reset+'>';
            }
          }

          optionDisplayName = 'Challenge Quests and Event Summary';
          optionDescription = 'Challange reset and event summary notification.';
          optionEmbedData = [
            {
              'name': 'Channel Name',
              'value': resetChannelText,
            },
          ];
          break;

        // twitter
        case 'twitter':
          if (query[1]) {
            let settingTwitterChannel;

            if (query[1] === 'disable') {
              settingTwitterChannel = null;
            } else {
              const channelId = utils.getChannelId(query[1]);
              settingTwitterChannel = channelId;
              twitterChannelText = '<#'+channelId+'>';
            }

            // update the database
            this.client.emit('notificationTwitterChange', msg.guild.id, settingTwitterChannel);

            changed = true;
          }

          if (!changed) {
            if (guildSettings.twitter && guildSettings.twitter !== null) {
              twitterChannelText = '<#'+guildSettings.twitter+'>';
            }
          }

          optionDisplayName = 'Twitter News';
          optionDescription = 'Blade & Soul and Blade & Soul Ops\'s tweets.';
          optionEmbedData = [
            {
              'name': 'Channel Name',
              'value': twitterChannelText,
            },
          ];
          break;

        // koldrak's lair
        case 'koldrak':
          if (query[1]) {
            let settingKoldrakChannel;

            if (query[1] === 'disable') {
              settingKoldrakChannel = null;
            } else {
              const channelId = utils.getChannelId(query[1]);

              settingKoldrakChannel = channelId;
              koldrakChannelText = '<#'+channelId+'>';
            }

            // update the database
            this.client.emit('notificationKoldrakChange', msg.guild.id, settingKoldrakChannel);

            changed = true;
          }

          if (!changed) {
            if (guildSettings.koldrak && guildSettings.koldrak !== null) {
              koldrakChannelText = '<#'+guildSettings.koldrak+'>';
            }
          }

          optionDisplayName = 'Koldrak\'s Lair Access';
          optionDescription = 'Koldrak\'s Lair Access Notification.';
          optionEmbedData = [
            {
              'name': 'Channel Name',
              'value': koldrakChannelText,
            },
          ];
          break;

        // welcome system
        case 'welcome':
          optionDisplayName = 'New Member Welcome';
          optionDescription = 'New member Welcome channel roles and message.';

          welcomeSettings = (guildSettings.welcome)?guildSettings.welcome : {};
          changed = false;

          // Disable welcome system
          switch (query[1]) {
          case 'disable':
            welcomeSettings.status = 'disable';
            changed = true;

            optionEmbedData = [
              {
                'name': 'New Member Welcome',
                'value': 'Disabled',
              },
            ];
            break;

          case 'enable':
            welcomeSettings.status = 'enable';
            changed = true;

            optionEmbedData = [
              {
                'name': 'New Member Welcome',
                'value': 'Enabled',
              },
            ];
            break;

          // channel selection
          case 'ch':
            welcomeSettings.channel = utils.getChannelId(query[2]);
            welcomeChannelText = '<#'+utils.getChannelId(query[2])+'>';
            changed = true;

            optionEmbedData = [
              {
                'name': 'Welcome Channel',
                'value': welcomeChannelText,
              },
            ];
            break;

          // welcome message
          case 'msg':
            query.splice(0, 2);

            welcomeMessage = query.join(' ');

            if (welcomeMessage.length > 0) {
              if (welcomeMessage === 'disable') {
                welcomeMessage = null;
              }
            }

            welcomeSettings.message = welcomeMessage;
            changed = true;

            optionEmbedData = [
              {
                'name': 'Welcome Message',
                'value': welcomeMessage,
              },
            ];
            break;

          default:
            optionEmbedData = [
              {
                'name': 'To Disable',
                'value': `${botPrefix}setting welcome disable`,
              },
              {
                'name': 'Welcome Channel',
                'value': `Change: \`${botPrefix}setting welcome channel #channel-name\`
                Disable: \`${botPrefix}setting welcome channel disable\``,
              },
              {
                'name': 'Welcome Message',
                'value': `Change: \`${botPrefix}setting welcome msg message here\`
                Disable: \`${botPrefix}setting welcome msg disable\`
                Notes: To add member name use \`MEMBER_NAME\`, to add server name use \`SERVER_NAME\` to add bot prefix use \`BOT_PREFIX\`.`,
              },
            ];
            break;
          }

          if (!changed) {
            if (guildSettings.welcome.channel) welcomeChannelText = '<#'+guildSettings.welcome.channel+'>';
            if (guildSettings.welcome.message) welcomeMessage = guildSettings.welcome.message;
          } else {
            // update the database
            this.client.emit('newMemberChannelChange', msg.guild.id, welcomeSettings);
          }
          break;

        // join command
        case 'join':
          optionDisplayName = 'Join Command';
          optionDescription = 'Join command, role and channel selection.';

          joinSettings = (guildSettings.join)? guildSettings.join : {};
          changed = false;

          // member joined message
          switch (query[1]) {
          case 'disable':
            joinSettings.status = 'disable';
            changed = true;

            optionEmbedData = [
              {
                'name': 'Join Message',
                'value': 'Disabled',
              },
            ];
            break;

          case 'enable':
            joinSettings.status = 'enable';
            changed = true;

            optionEmbedData = [
              {
                'name': 'Join Message',
                'value': 'Enabled',
              },
            ];
            break;

          case 'msg':
            query.splice(0, 2);
            joinMessage = query.join(' ');

            if (joinMessage.length > 0) {
              if (joinMessage === 'disable') {
                joinSettings.message = null;
              } else {
                joinSettings.message = joinMessage;
                joinMessageText = joinMessage;
              }
              changed = true;
            }

            optionEmbedData = [
              {
                'name': 'Join Message',
                'value': joinMessageText,
              },
            ];
            break;

          // after they did join command
          case 'ch':
            if (query[2] == 'disable') {
              joinSettings.channel = 'disable';
              joinChannelText = 'disable';
              changed = true;
            } else {
              joinSettings.channel = utils.getChannelId(query[2]);
              joinChannelText = '<#'+utils.getChannelId(query[2])+'>';
              changed = true;
            }

            optionEmbedData = [
              {
                'name': 'Join Channel',
                'value': joinChannelText,
              },
            ];
            break;

          // role given
          case 'role':
            if (query[2] == 'disable') {
              joinSettings.role = 'disable';
              joinRoleText = 'disable';
              changed = true;
            } else {
              joinSettings.role = utils.getRoleId(query[2]);
              joinRoleText = '<@&'+utils.getRoleId(query[2])+'>';
              changed = true;
            }

            optionEmbedData = [
              {
                'name': 'Member Role',
                'value': joinRoleText,
              },
            ];
            break;

          default:
            optionEmbedData = [
              {
                'name': 'To Disable',
                'value': `${botPrefix}setting join disable`,
              },
              {
                'name': 'Join Channel',
                'value': `Change: \`${botPrefix}setting join channel #channel-name\`
                Disable: \`${botPrefix}setting join channel disable\``,
              },
              {
                'name': 'Member Role',
                'value': `Change: \`${botPrefix}setting join role @role-name\`
                Disable: \`${botPrefix}setting join role disable\``,
              },
              {
                'name': 'Join Message',
                'value': `Change: \`${botPrefix}setting join msg message here\`
                Disable: \`${botPrefix}setting join msg disable\`
                Notes: To add member name use \`MEMBER_NAME\`, to add server name use \`SERVER_NAME\` to add bot prefix use \`BOT_PREFIX\`.`,
              },
            ];
            break;
          }

          if (!changed) {
            joinStatusText = (guildSettings.join.status)? '*Enabled*':'*Disabled*';
            joinMessageText = (guildSettings.join.message)? guildSettings.join.message : '*No Data*';
            joinChannelText = (guildSettings.join.channel)? '<#'+guildSettings.join.next+'>' : '*No Data*';
            joinRoleText = (guildSettings.join.role)? '<@&'+guildSettings.join.role_id+'>' : '*No Data*';
          } else {
            // update the database
            this.client.emit('joinSettingsChange', msg.guild.id, joinSettings);
          }
          break;

        // show current settings
        case 'show':
          if (guildSettings) {
            // reset notification
            resetChannelText = (guildSettings.quest_reset)? '<#'+guildSettings.quest_reset+'>' : '*No Data*';
            // twitter
            twitterChannelText = (guildSettings.twitter)? '<#'+guildSettings.twitter+'>' : '*No Data*';
            // koldrak's lair
            koldrakChannelText = (guildSettings.koldrak)? '<#'+guildSettings.koldrak+'>' : '*No Data*';
            // hunter's refugee
            huntersRefugeeText = (guildSettings.hunters_refugee)? '<#'+guildSettings.hunters_refugee+'>' : '*No Data*';
            // new member welcome
            if (guildSettings.welcome) {
              welcomeChannelText = (guildSettings.welcome.channel)? '<#'+guildSettings.welcome.channel+'>' : '*No Data*';
              welcomeMessageText = (guildSettings.welcome.message)? guildSettings.welcome.message : '*No Data*';
            }
            // join command custom message
            if (guildSettings.join) {
              joinStatusText = (guildSettings.join.status)? '*Enabled*':'*Disabled*';
              joinMessageText = (guildSettings.join.message)? guildSettings.join.message : '*No Data*';
              joinChannelText = (guildSettings.join.channel)?'<#'+guildSettings.join.channel+'>' : '*No Data*';
              joinRoleText = (guildSettings.join.role)? '<@&'+guildSettings.join.role+'>' : '*No Data*';
            }
            // bot's admins
            if (guildSettings.admin_roles && guildSettings.admin_roles[0] !== null) {
              adminRoleText = []; // emptying the array
              guildSettings.admin_roles.map((roles) => {
                adminRoleText.push(`<@&${roles}>`);
              });
            }
          }
          optionDisplayName = 'Current Guild\'s Settings';
          optionDescription = `Current settings, use \`${botPrefix}setting\` for options.`;
          optionEmbedData = [
            {
              'name': 'Reset',
              'value': resetChannelText,
            },
            {
              'name': 'Twitter',
              'value': twitterChannelText,
            },
            {
              'name': 'Koldrak',
              'value': koldrakChannelText,
            },
            {
              'name': 'Hunter\'s Refugee',
              'value': huntersRefugeeText,
            },
            {
              'name': 'Bot\'s Admin Roles',
              'value': adminRoleText,
            },
            {
              'name': 'New Member Welcome',
              'value': `Welcome Channel: ${welcomeChannelText}
              Message:\n${welcomeMessageText}`,
            },
            {
              'name': 'Join Command',
              'value': `Status: ${joinStatusText}
              Channel: ${joinChannelText}
              Member Role: ${joinRoleText}
              Message:\n${joinMessageText}`,
            },
          ];
          break;

        // bot admin
        case 'admin':
          query.shift();
          adminRoles = query;

          if (adminRoles.length !== 0) {
            if (adminRoles[0] === 'disable') {
              adminRoles = null;
            } else {
              adminRoleText = []; // emptying the array

              for (let i=0; i<adminRoles.length; i++) {
                adminRoleText.push(adminRoles[i]);
                adminRoles[i] = utils.getRoleId(adminRoles[i]);
              }
            }

            // update the database
            this.client.emit('adminRolesChange', msg.guild.id, adminRoles);

            changed = true;
          }

          if (!changed) {
            if (guildSettings.admin_roles && guildSettings.admin_roles[0] !== null) {
              adminRoleText = []; // emptying the array

              for (let i=0; i<guildSettings.admin_roles.length; i++) {
                adminRoleText.push('<@&'+guildSettings.admin_roles[i]+'>');
              }
            }
          }

          optionDisplayName = 'Bot Admin Roles';
          optionDescription = 'List of roles who can modified bot\'s settings';
          optionEmbedData = [
            {
              'name': 'Roles',
              'value': adminRoleText.join(', '),
            },
          ];

          break;

        // hunter
        case 'hunter':
          if (query[1]) {
            let settingHuntersRefugeeChannel;

            if (query[1] === 'disable') {
              settingHuntersRefugeeChannel = null;
            } else {
              const channelId = utils.getChannelId(query[1]);

              settingHuntersRefugeeChannel = channelId;
              huntersRefugeeText = '<#'+channelId+'>';
            }

            // update the database
            this.client.emit('notificationHuntersChange', msg.guild.id, settingHuntersRefugeeChannel);

            changed = true;
          }

          if (!changed) {
            if (guildSettings.hunters_refugee && guildSettings.hunters_refugee !== null) {
              huntersRefugeeText = '<#'+guildSettings.hunters_refugee+'>';
            }
          }

          optionDisplayName = 'Hunter\'s Refugee Access';
          optionDescription = 'Hunter\'s Refugee Access Notification.';
          optionEmbedData = [
            {
              'name': 'Channel Name',
              'value': huntersRefugeeText,
            },
          ];
          break;
        }

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
      } else {
        msgData = `Invalid setting. Use \`${botPrefix}setting\` to see available settings.`;
      }
    } else {
      msgData = 'You don\'t have the permission to use that command';
    }

    msg.channel.stopTyping();

    return msg.say(msgData, embedData);
  }
};
