/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
const {Command} = require('discord.js-commando');
const Services = require('../../services/index.js');
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
      'show',
      'admin',
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
      // admin role
      let adminRoles;
      let adminRoleText = '*No Role Selected*';

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
          optionDescription = '**Warning: Currently not working**\nBlade & Soul and Blade & Soul Ops\'s tweets.';
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

        // show current settings
        case 'show':
          if (guildSettings) {
            // reset notification
            resetChannelText = (guildSettings.quest_reset)? '<#'+guildSettings.quest_reset+'>' : '*No Data*';
            // twitter
            twitterChannelText = (guildSettings.twitter)? '<#'+guildSettings.twitter+'>' : '*No Data*';
            // koldrak's lair
            koldrakChannelText = (guildSettings.koldrak)? '<#'+guildSettings.koldrak+'>' : '*No Data*';
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
              'name': 'Bot\'s Admin Roles',
              'value': adminRoleText,
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
        }

        Services.sendLog('debug', `cmd-set:${query[0]}-${query[1]}`, `q: ${query}(${query.length}) changed: ${changed}`);

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
