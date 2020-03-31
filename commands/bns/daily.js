const {Command} = require('discord.js-commando');
const utils = require('../../utils/index.js');

module.exports = class DailyCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'daily',
      aliases: ['dc'],
      group: 'bns',
      memberName: 'daily',
      description: 'Get daily challenges quest list and rewards',
      examples: ['daily', 'daily <day>', 'daily tomorrow', 'daily monday'],
    });
  }

  async run(msg, args) {
    msg.channel.startTyping();

    args = args.toLowerCase();
    let dayQuery = '';

    // checking if the command disabled or not
    const globalSettings = await utils.getGlobalSetting('daily');
    if (!globalSettings.status) {
      msg.channel.stopTyping();

      return msg.say('This command is currently disabled.\nReason: '+globalSettings.message);
    }

    const start = Date.now();
    let end;
    let serveTime;

    if (args === '') {
      dayQuery = utils.getDay(Date.now(), 'now');
    } else if (args === 'tomorrow' || args === 'tmr' || args === 't') {
      dayQuery = utils.getDay(Date.now(), 'tomorrow');
    } else if (args === 'mon' || args === 'monday') {
      dayQuery = 'Monday';
    } else if (args === 'tue' || args === 'tuesday') {
      dayQuery = 'Tuesday';
    } else if (args === 'wed' || args === 'wednesday') {
      dayQuery = 'Wednesday';
    } else if (args === 'thu' || args === 'thursday') {
      dayQuery = 'Thursday';
    } else if (args === 'fri' || args === 'friday') {
      dayQuery = 'Friday';
    } else if (args === 'sat' || args === 'saturday') {
      dayQuery = 'Saturday';
    } else if (args === 'sun' || args === 'sunday') {
      dayQuery = 'Sunday';
    } else {
      dayQuery = utils.getDay(Date.now(), 'now');
    }

    const dailyData = await utils.getDaily(dayQuery);
    const rewardsList = utils.formatRewards(dailyData.rewards);
    let embedData;
    let msgData = '';

    end = Date.now();
    serveTime = (end-start)/1000+'s';

    if (dailyData) {
      embedData = {
        'embed': {
          'author': {
            'name': 'Daily Challenges - '+dayQuery,
            'icon_url': 'https://cdn.discordapp.com/emojis/464038094258307073.png?v=1',
          },
          'color': 15025535,
          'footer': {
            'text': 'Daily Challenges - Served in '+serveTime,
          },
          'fields': [
            {
              'name': 'Completion Rewards',
              'value': utils.formatArray(rewardsList, '', true),
            },
            {
              'name': 'Quests/Dungeons List (Location - Quest)',
              'value': utils.formatArray(dailyData.quests, '', true),
            },
          ],
        },
      };
    } else {
      msgData = 'I can\'t find daily data under ***'+args+'***, please check your command and try again.';
    }

    msg.channel.stopTyping();

    return msg.say(msgData, embedData);
  }
};
