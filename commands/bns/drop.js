/* eslint-disable require-jsdoc */
const {Command} = require('discord.js-commando');
const utils = require('../../utils/index.js');

module.exports = class LootCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'drop',
      aliases: ['loot'],
      group: 'bns',
      memberName: 'drop',
      description: 'Get the dungeon info that containing said item drop',
      examples: ['drop <item name>', 'drop naryu tablet'],
      args: [
        {
          key: 'item',
          prompt: 'What is the item called?',
          type: 'string',
        },
      ],
    });
  }

  async run(msg, {item}) {
    msg.channel.startTyping();

    // checking if the command disabled or not
    const globalSettings = await utils.getGlobalSetting('drop');
    if (!globalSettings.status) {
      msg.channel.stopTyping();

      return msg.say(`Command disabled. ${globalSettings.message}`);
    }

    const start = Date.now();
    const regx = new RegExp('('+item+'+)', 'ig'); // regex for search

    // getting the data and pushing them into an array
    // eslint-disable-next-line max-len
    const dungeonData = await utils.fetchDB('dungeons', {'rewards': {$all: [regx]}});

    // getting the dungeon name and formatting it
    let dropData = '';
    for (let i = 0; i < dungeonData.length; i++) {
      // eslint-disable-next-line max-len
      dropData = dropData + ('\n- '+dungeonData[i].name+' ('+dungeonData[i].rewards.find((value) => regx.test(value))+')');
    }

    const end = Date.now();
    const serveTime = (end-start)/1000+'s';

    // result formatting
    let result = 'Can\'t find dungeon contain **'+item+'**.';
    if (dropData !== '') {
      result = 'Dungeon which has **'+item+'** drop:'+dropData;
    }

    // filling up the embed data
    const itemName = item.replace(/(^|\s)\S/g, (l) => l.toUpperCase());
    const embedData = {
      'embed': {
        'author': {
          'name': `Item Drop Search - ${itemName}`,
          'icon_url': 'https://cdn.discordapp.com/emojis/551588918479290408.png?v=1',
        },
        'color': 16753920,
        'footer': {
          'text': 'Dungeon Item Drop - Served in '+serveTime,
        },
        'description': result,
      },
    };

    msg.channel.stopTyping();

    return msg.say(embedData);
  }
};
