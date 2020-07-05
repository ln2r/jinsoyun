const {Command} = require('discord.js-commando');
const utils = require('../../utils/index.js');
const configs = require('../../config.json');

module.exports = class ResetNotificationCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'global',
      group: 'system',
      memberName: 'global',
      description: 'Change bot global settings.',
      hidden: true,
      ownerOnly: true,
    });
  }

  async run(msg, args) {
    msg.channel.startTyping();

    let botPrefix = configs.bot.default_prefix;
    if(msg.guild.id){
      const guildSettings = await utils.getGuildSettings(msg.guild.id);
      (guildSettings.prefix)? botPrefix = guildSettings.prefix : botPrefix;
    }

    let optionDisplayStatus;
    let optionDisplayMessage;

    let settingData;


    let msgData = '';
    let embedData = {
      'embed': {
        'title': 'Jinsoyun Bot - Global Settings',
        'description': 'To configure use `'+botPrefix+'global system-name (enable/disable) message`. Examples:',
        'color': 16741688,
        'fields': [
          {
            'inline': true,
            'name': 'Annoucement',
            'value': 'Format: `'+botPrefix+'global twitter/reset/koldrak_announce disable/enable status message`\nExample: `'+botPrefix+'global twitter disable disabled for maintenance`',
          },
          {
            'inline': true,
            'name': 'Commands',
            'value': 'Format: `'+botPrefix+'global command name disable/enable status message`\nExample: `'+botPrefix+'global daily disable disabled for maintenance`\nNote: To check full commands list which can be disabled use `'+botPrefix+'help`',
          },
        ],
      },
    };

    const query = args.split(' ');
    let changed = false;

    const systems = ['hunters_refugee', 'koldrak_announce', 'reset', 'twitter', 'bid', 'daily', 'drop', 'dungeon', 'event', 'grandharvest', 'koldrak', 'shackledisle', 'market', 'weekly', 'who', 'nickname', 'radd', 'raddonce', 'reg', 'rmessage', 'rremove', 'setting'];

    const system = query[0];
    const valid = systems.indexOf(system);

    if (valid >= 0 && query[1]) {
      const setting = ((query[1] === 'disable')? false : true);
      let message = '';

      if (query.length > 2) {
        query.splice(0, 2);
        message = query.join(' ');
      }

      settingData = {
        status: setting,
        message: message,
      };

      // updating the change
      changed = true;
      this.client.emit('globalSettingChange', 'global', system, settingData);
    }

    // changing the message data when the query is valid
    if (valid >= 0) {
      if (changed) {
        msgData = 'Setting for *'+system+'* has been changed.';

        embedData = '';
      } else {
        const globalSetting = await utils.getGlobalSetting(system);

        // filling the embed display info
        optionDisplayStatus = (globalSetting.status)? 'Enabled' : 'Disabled';
        optionDisplayMessage = (globalSetting.message === '')? '*No Message Set*' : globalSetting.message;

        msgData = 'Setting for *'+system+'*.';

        embedData = {
          'embed': {
            'title': system.replace(/(^|\s)\S/g, (l) => l.toUpperCase()),
            'color': 16741688,
            'fields': [
              {
                'name': 'Configuration',
                'value': 'Status: '+optionDisplayStatus+' \nMessage: '+optionDisplayMessage,
              },
            ],
          },
        };
      }
    }

    msg.channel.stopTyping();
    return msg.say(msgData, embedData);
  }
};
