const {Command} = require('discord.js-commando');
const utils = require('../../utils/index.js');

module.exports = class KoldrakCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'access',
      group: 'bns',
      memberName: 'access',
      description: 'Get time restricted dungeon access time',
      examples: ['access koldrak', 'access harvest'],
      hidden: true,
    });
  }

  async run(msg, args) {
    msg.channel.startTyping();

    // checking if the command disabled or not
    const globalSettings = await utils.getGlobalSetting('access');
    if (!globalSettings.status) {
      msg.channel.stopTyping();

      return msg.say('This command is currently disabled.\nReason: '+globalSettings.message);
    }

    const start = Date.now();
    let end;
    let serveTime;

    let accessData = await utils.fetchDB('access', {name: args});

    const closestTime = utils.getUTCTimeDifference(accessData[0].time);
    let accessName;
    let embedData;

    switch(args){
    case 'koldrak':
      accessName = 'Koldrak\'s Lair';
      break;
    case 'harvest':
      accessName = 'Grand Harvest Raid';
      break;
    case 'hunter':
      accessName = 'Hunter\'s Refugee';
      break;
    default:
      accessName = false;
    }

    msg.channel.stopTyping();
    end = Date.now();
    serveTime = (end-start)/1000+'s';

    if(accessName){
      embedData = {
        'embed': {
          'author': {
            'name': `Dungeon Access - ${accessName}`,
          },
          'color': 8388736,
          'footer': {
            'icon_url': 'https://cdn.discordapp.com/emojis/463569669584977932.png?v=1',
            'text': 'Dungeon Access - Served in '+serveTime,
          },
          'description': 'Available in '+closestTime.left[0]+' hour(s) and '+closestTime.left[1]+' minute(s)',
        }
      };
    }else{
      embedData = {
        'embed': {
          'author': {
            'name': 'Dungeon Access - Invalid Request',
          },
          'color': 8388736,
          'footer': {
            'icon_url': 'https://cdn.discordapp.com/emojis/463569669584977932.png?v=1',
            'text': 'Dungeon Access - Served in '+serveTime,
          },
          'description': 'Invalid request. Available request:\n-`koldrak`: Koldrak\'s Lair\n-`hunter`: Hunter\'s Refugee\n-`harvest`: Grand Harvest Raid',
        }
      };
    }
    return msg.say(embedData);
  }
};
