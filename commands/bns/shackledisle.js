const {Command} = require('discord.js-commando');
const utils = require('../../utils/index.js');

module.exports = class ShackledIsleCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'shackledisle',
      aliases: ['br', 'shackled', 'isle', 'battleroyale'],
      group: 'bns',
      memberName: 'shackledisle',
      description: 'Get Shackled Isle access time',
      examples: ['shackledisle'],
      hidden: true,
    });
  }

  async run(msg) {
    msg.channel.startTyping();

    // checking if the command disabled or not
    const globalSettings = await utils.getGlobalSetting('shackledisle');
    if (!globalSettings.status) {
      msg.channel.stopTyping();

      return msg.say('This command is currently disabled.\nReason: '+globalSettings.message);
    }

    const start = Date.now();
    let end;
    let serveTime;

    let timeData = await utils.fetchDB('challenges', {name: 'Shackled Isle'});
    timeData = timeData[0].time;

    const brModeClosestTime = utils.getUTCTimeDifference(timeData);

    msg.channel.stopTyping();
    end = Date.now();
    serveTime = (end-start)/1000+'s';

    const embedData = {
      'embed': {
        'author': {
          'name': 'Battle Royale Shackled Isle ('+timeData[brModeClosestTime.time_index]+':00 UTC)',
        },
        'color': 8388736,
        'footer': {
          'text': 'Shackled Isle - Served in '+serveTime,
        },
        'description': 'Available in '+brModeClosestTime.time_difference_data[0]+' hour(s) and '+brModeClosestTime.time_difference_data[1]+' minute(s)',
      },
    };
    return msg.say(embedData);
  }
};
