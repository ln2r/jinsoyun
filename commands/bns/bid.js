/* eslint-disable require-jsdoc */
const {Command} = require('discord.js-commando');
const utils = require('../../utils/index.js');

module.exports = class RemoveCustomRoleCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'bid',
      aliases: ['smartbid'],
      group: 'bns',
      memberName: 'bid',
      description: 'Get calculation for how much you should bid for an item.',
      examples: [
        'bid <player count> <item name/item price>',
        'bid 12 moonstone',
        'bid 12 500',
      ],
      args: [
        {
          key: 'playerCount',
          prompt: 'How many player are there (excluding offline and or left)?',
          type: 'integer',
        },
        {
          key: 'itemPrice',
          prompt: 'How much is it cost or what is the item called?',
          type: 'string',
        },
      ],
    });
  }

  async run(msg, {playerCount, itemPrice}) {
    msg.channel.startTyping();

    const start = Date.now();

    // checking if the command disabled or not
    const globalSettings = await utils.getGlobalSetting('bid');
    if (!globalSettings.status) {
      msg.channel.stopTyping();

      return msg.say(`Command disabled. ${globalSettings.message}`);
    }

    // removing "<>" if the user decided to used it
    playerCount = playerCount.toString().replace(/[<>]/g, '');
    itemPrice = itemPrice.replace(/[<>]/g, '');

    let itemName = itemPrice;
    let invalidItem = false;
    let bidData;

    // getting item price from market
    if (isNaN(itemPrice)) {
      // eslint-disable-next-line no-useless-escape
      const regx = new RegExp('(?:^|\W)'+itemPrice+'+(?:$|\W)', 'ig');
      const dbSearchQuery = {'name': regx};
      const itemData = await utils.fetchDB('items', dbSearchQuery);

      if (itemData.length === 0) {
        invalidItem = true;
      } else {
        const marketData = await utils.fetchDB('market', {id: itemData[0].id});

        itemPrice = marketData[0].priceEach;
        itemName = itemData[0].name;
      }
    }

    // smart bid algorithm thanks to BnSTools - https://bnstools.info/

    if (invalidItem) {
      // eslint-disable-next-line max-len
      bidData = `No Result on **${itemName}**.\nCheck your search and try again.`;
    } else {
      // eslint-disable-next-line max-len
      const selfBid = Math.floor(1 * itemPrice * ((playerCount - 1)/playerCount));
      // eslint-disable-next-line max-len
      const marketBid = Math.floor((1 * itemPrice * ((playerCount - 1)/playerCount)) * (1 - .05 * 1));

      bidData = '**Max bid: '+utils.formatCurrency(itemPrice)+'**\n'+
      '- Keep:'+utils.formatCurrency(selfBid)+'\n'+
      '- Sell:'+utils.formatCurrency(marketBid);
    }

    msg.channel.stopTyping();
    const end = Date.now();
    const serveTime = (end-start)/1000+'s';

    const embedData = {
      'embed': {
        'author': {
          'name': 'Smart Bid for '+itemName,
          'icon_url': 'https://cdn.discordapp.com/emojis/464036617531686913.png?v=1',
        },
        'description': bidData,
        'color': 16766720,
        'footer': {
          'icon_url': 'https://slate.silveress.ie/docs_bns/images/logo.png',
          'text': 'Powered by Silveress\'s BnS API - Served in '+serveTime,
        },
      },
    };

    return msg.say(embedData);
  }
};
