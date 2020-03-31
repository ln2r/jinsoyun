const {Command} = require('discord.js-commando');
const utils = require('../../utils/index.js');

module.exports = class KoldrakCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'koldrak',
      aliases: ['dragon'],
      group: 'bns',
      memberName: 'koldrak',
      description: 'Get Koldrak\'s Lair access time',
      examples: ['koldrak'],
      hidden: true,
      ownerOnly: true,
    });
  }

  async run(msg) {
    msg.channel.startTyping();

    // checking if the command disabled or not
    const globalSettings = await utils.getGlobalSetting('koldrak');
    if (!globalSettings.status) {
      msg.channel.stopTyping();

      return msg.say('This command is currently disabled.\nReason: '+globalSettings.message);
    }

    const start = Date.now();
    let end;
    let serveTime;

    let timeData = await utils.fetchDB('challenges', {name: 'Koldrak'});
    timeData = timeData[0].time;

    const koldrakClosestTime = utils.getUTCTimeDifference(timeData);

    msg.channel.stopTyping();
    end = Date.now();
    serveTime = (end-start)/1000+'s';

    const embedData = {
      'embed': {
        'author': {
          'name': 'Epic Challenge - Koldrak\'s Lair ('+timeData[koldrakClosestTime.time_index]+':00 UTC)',
        },
        'color': 8388736,
        'footer': {
          'icon_url': 'https://cdn.discordapp.com/emojis/463569669584977932.png?v=1',
          'text': 'Koldrak\'s Lair - Served in '+serveTime,
        },
        'description': 'Available in '+koldrakClosestTime.time_difference_data[0]+' hour(s) and '+koldrakClosestTime.time_difference_data[0]+' minute(s)',
      },

    };
    return msg.say(embedData);
  }
};
