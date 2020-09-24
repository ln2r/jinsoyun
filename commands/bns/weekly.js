/* eslint-disable require-jsdoc */
const {Command} = require('discord.js-commando');
const utils = require('../../utils/index.js');

module.exports = class WeeklyCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'weekly',
      aliases: ['wc'],
      group: 'bns',
      memberName: 'weekly',
      description: 'Get weekly challenges quest list and rewards',
      examples: ['weekly', 'wc'],
    });
  }

  async run(msg) {
    msg.channel.startTyping();

    // checking if the command disabled or not
    const globalSettings = await utils.getGlobalSetting('weekly');
    if (!globalSettings.status) {
      msg.channel.stopTyping();

      return msg.say(`Command disabled. ${globalSettings.message}`);
    }

    const start = Date.now();
    const weeklyData = await utils.getWeekly();
    const weeklyRewards = utils.formatRewards(weeklyData.rewards);
    const end = Date.now();
    const serveTime = (end-start)/1000+'s';

    const embedData = {
      'embed': {
        'author': {
          'name': 'Weekly Challenges',
          'icon_url': 'https://cdn.discordapp.com/emojis/464038094258307073.png?v=1',
        },
        'color': 15025535,
        'footer': {
          'text': 'Weekly Challenges - Served in '+serveTime,
        },
        'fields': [
          {
            'name': 'Completion Rewards',
            'value': utils.formatArray(weeklyRewards, '', true),
          },
          {
            'name': 'Quests/Dungeons List (Location - Quest)',
            'value': utils.formatArray(weeklyData.quests, '', true),
          },
        ],
      },
    };

    msg.channel.stopTyping();

    return msg.say(embedData);
  }
};
