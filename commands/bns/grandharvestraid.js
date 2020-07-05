const {Command} = require('discord.js-commando');
const utils = require('../../utils/index.js');

module.exports = class GrandHarvestCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'grandharvest',
      aliases: ['ghr', 'grandharvestraid'],
      group: 'bns',
      memberName: 'grandharvest',
      description: 'Get Grand Harvest Raid access time',
      examples: ['grandharvest'],
      hidden: true,
    });
  }

  async run(msg) {
    msg.channel.startTyping();

    // checking if the command disabled or not
    const globalSettings = await utils.getGlobalSetting('grandharvest');
    if (!globalSettings.status) {
      msg.channel.stopTyping();

      return msg.say('This command is currently disabled.\nReason: '+globalSettings.message);
    }

    const start = Date.now();
    let end;
    let serveTime;

    let timeData = await utils.fetchDB('challenges', {});
    timeData = timeData[0].grand_harvest_raid.time;

    const grandHarvestClosestTime = utils.getUTCTimeDifference(timeData);

    msg.channel.stopTyping();
    end = Date.now();
    serveTime = (end-start)/1000+'s';

    const embedData = {
      'embed': {
        'author': {
          'name': 'Grand Harvest Raid ('+timeData[grandHarvestClosestTime.time_index]+':00 UTC)',
        },
        'color': 8388736,
        'footer': {
          'text': 'Grand Harvest Raid - Served in '+serveTime,
        },
        'description': 'Available in '+grandHarvestClosestTime.time_difference_data[0]+' hour(s) and '+grandHarvestClosestTime.time_difference_data[1]+' minute(s)',
      },
    };
    return msg.say(embedData);
  }
};
