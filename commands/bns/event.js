/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
const {Command} = require('discord.js-commando');
const utils = require('../../utils/index.js');

module.exports = class BnsEventCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'event',
      group: 'bns',
      memberName: 'event',
      description: 'Get current event summary.',
      examples: ['event', 'event <day>', 'event tomorrow', 'event monday'],
    });
  }

  async run(msg, args) {
    msg.channel.startTyping();

    // checking if the command disabled or not
    const globalSettings = await utils.getGlobalSetting('event');
    if (!globalSettings.status) {
      msg.channel.stopTyping();

      return msg.say(`Command disabled. ${globalSettings.message}`);
    }

    const start = Date.now();
    args = args.toLowerCase();

    let dayQuery = '';

    if (args === '') {
      dayQuery = utils.getDay(Date.now(), 'now');
    } else if (args === 'tomorrow' || args === 'tmr') {
      dayQuery = utils.getDay(Date.now(), 'tomorrow');
    } else {
      if (args === 'mon' || args === 'monday') {
        dayQuery = 'Monday';
      }
      if (args === 'tue' || args === 'tuesday') {
        dayQuery = 'Tuesday';
      }
      if (args === 'wed' || args === 'wednesday') {
        dayQuery = 'Wednesday';
      }
      if (args === 'thu' || args === 'thursday') {
        dayQuery = 'Thursday';
      }
      if (args === 'fri' || args === 'friday') {
        dayQuery = 'Friday';
      }
      if (args === 'sat' || args === 'saturday') {
        dayQuery = 'Saturday';
      }
      if (args === 'sun' || args === 'sunday') {
        dayQuery = 'Sunday';
      }
    }

    const eventData = await utils.fetchDB('event');
    const eventQuests = await utils.getEventQuests(eventData[0], dayQuery);
    let embedData;
    let msgData = '';

    const end = Date.now();
    const serveTime = (end-start)/1000+'s';

    if (eventData[0]) {
      embedData = {
        'embed': {
          'author': {
            'name': 'Current Event - '+eventData[0].name,
            'icon_url': 'https://cdn.discordapp.com/emojis/479872059376271360.png?v=1',
          },
          'title': eventData[0].name,
          'url': eventData[0].event_page,
          'description': '**Duration**: '+eventData[0].duration+'\n'+
                         '**Redemption Period**: '+eventData[0].redeem+'\n'+
                         '**To do**: '+utils.formatArray(eventData[0].todo, '- ', true)+'\n'+
                         '**Redeemable**: '+eventData[0].last_event+' ('+eventData[0].last_event_redeem+')',
          'color': 1879160,
          'footer': {
            'icon_url': 'https://static.bladeandsoul.com/img/global/nav-bs-logo.png',
            'text': 'Blade & Soul Event - Served in '+serveTime,
          },
          'fields': [
            {
              'name': 'Quests List',
              'value': utils.formatArray(eventQuests, '', true),
            },
          ],
        },
      };
    } else {
      msgData = 'Can\'t find daily under ***'+args+'***.';
    }

    msg.channel.stopTyping();

    return msg.say(msgData, embedData);
  }
};
