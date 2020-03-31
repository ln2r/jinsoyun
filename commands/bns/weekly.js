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

      return msg.say('This command is currently disabled.\nReason: '+globalSettings.message);
    }

    const start = Date.now();
    let end;
    let serveTime;

    const weeklyData = await utils.getWeekly();
    const weeklyRewards = utils.formatRewards(weeklyData.rewards);

    end = Date.now();
    serveTime = (end-start)/1000+'s';

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
