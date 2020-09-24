/* eslint-disable require-jsdoc */
const {Command} = require('discord.js-commando');
const utils = require('../../utils/index.js');

module.exports = class DungeonCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'dungeon',
      aliases: ['dg', 'guide'],
      group: 'bns',
      memberName: 'dungeon',
      description: 'Get dungeon info.',
      examples: ['dungeon <dungeon name>', 'dungeon naryu sanctum'],
      args: [
        {
          key: 'dungeon',
          prompt: 'What is the dungeon called?',
          type: 'string',
        },
      ],
    });
  }

  async run(msg, {dungeon}) {
    msg.channel.startTyping();

    // checking if the command disabled or not
    const globalSettings = await utils.getGlobalSetting('dungeon');
    if (!globalSettings.status) {
      msg.channel.stopTyping();

      return msg.say(`Command disabled. ${globalSettings.message}`);
    }

    const start = Date.now();
    let end;
    let serveTime;

    const regx = new RegExp('('+dungeon+'+)', 'ig'); // doing rough search
    const dbSearchQuery = {'name': regx};
    let dungeonsData = await utils.fetchDB('dungeons', dbSearchQuery);
    dungeonsData = dungeonsData[0];

    let embedData;
    let msgData = '';

    if (dungeonsData) {
      // formatting
      let apInfo = '*Unspecified*';
      const apEasy = (dungeonsData.attack_power.easy === 0)?
        '' : 'Easy: '+dungeonsData.attack_power.easy+'+ ';

      const apNormal = (dungeonsData.attack_power.normal === 0)?
        '' : 'Normal: '+dungeonsData.attack_power.normal+'+ ';

      const apHard = (dungeonsData.attack_power.hard === 0)?
        '' : 'Hard: '+dungeonsData.attack_power.hard+'+ ';

      if (apEasy !== '' || apNormal !== '' || apHard !== '') {
        apInfo = apEasy+apNormal+apHard;
      }

      let instanceType;
      switch (dungeonsData.type) {
      case 6:
        instanceType = '6 Players';
        break;
      case 12:
        instanceType = '12 Players';
        break;
      case 1:
        instanceType = 'Solo Instance';
        break;
      default:
        instanceType = 'Unspecified';
        break;
      }

      const guidesData = [];
      if (dungeonsData.guides.length !== 0) {
        for (let i=0; i<dungeonsData.guides.length; i++) {
          // eslint-disable-next-line max-len
          guidesData.push(`[${dungeonsData.guides[i].author}](${dungeonsData.guides[i].url})`);
        }
      }

      const weaponSuggestion = (dungeonsData.weapon === '')?
        '*Unspecified Weapon*': dungeonsData.weapon;

      const challengesInfo = await utils.getChallengesList(dungeonsData.id);

      end = Date.now();
      serveTime = (end-start)/1000+'s';

      // filling up the embed data
      // eslint-disable-next-line max-len
      const dungeonName = dungeon.replace(/(^|\s)\S/g, (l) => l.toUpperCase())+' ('+instanceType+')';
      embedData = {
        'embed': {
          'author': {
            'name': 'Dungeon Info - '+dungeonName,
            'icon_url': 'https://cdn.discordapp.com/emojis/463569668045537290.png?v=1',
          },
          'color': 10040319,
          'footer': {
            'text': 'Dungeon Data - Served in '+serveTime,
          },
          'fields': [
            {
              'name': 'Entry Requirements',
              'value': utils.formatArray(dungeonsData.requirements, '- ', true),
            },
            {
              'name': 'Challenges',
              'value': (challengesInfo.length === 0)?
                '*Not in any challenges*' : challengesInfo.join(', '),
            },
            {
              'name': 'Recommended Attack Power',
              'value': apInfo,
            },
            {
              'name': 'Cross-Server Matching Weapon',
              'value': weaponSuggestion,
            },
            {
              'name': 'Guides',
              'value': (guidesData[0] === '[]()' || guidesData.length === 0)?
                '*No data*' : utils.formatArray(guidesData, '- ', true),
            },
            {
              'name': 'Rewards',
              'value': utils.formatArray(dungeonsData.rewards, '- ', true),
            },
          ],
        },
      };

      msg.channel.stopTyping();
    } else {
      end = Date.now();
      serveTime = (end-start)/1000+'s';

      msgData = 'Can\'t find dungeon with name ***'+dungeon+'***.';
      msg.channel.stopTyping();
    }

    return msg.say(msgData, embedData);
  }
};
