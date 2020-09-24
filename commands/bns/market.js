/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
/* eslint-disable no-useless-escape */
const {Command} = require('discord.js-commando');
const utils = require('../../utils/index.js');
const services = require('../../services/index.js');

module.exports = class MarketCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'market',
      aliases: ['mp', 'f5'],
      group: 'bns',
      memberName: 'market',
      description: 'Get item marketplace data. Use `<>` to get exact match',
      examples: [
        'market item name',
        'market <item name>',
      ],
      args: [
        {
          key: 'searchQuery',
          prompt: 'What is the item name?',
          type: 'string',
        },
      ],
    });
  }

  async run(msg, {searchQuery}) {
    msg.channel.startTyping();

    // checking if the command disabled or not
    const globalSettings = await utils.getGlobalSetting('market');
    if (!globalSettings.status) {
      msg.channel.stopTyping();

      return msg.say(`Command disabled. ${globalSettings.message}`);
    }

    let regx;

    let embedData = '';
    let msgData = '';
    let queryResult = '';
    let itemImage = await utils.getGlobalSetting('not_found');

    let maxItemLength;

    const start = Date.now();
    let end;
    let serveTime;

    // checking the search query
    if (searchQuery.match(/[<>]/g)) {
      // removing the "<>" characters
      searchQuery = searchQuery.replace(/[<>]/g, '');
      searchQuery = searchQuery.replace(/(^|\s)\S/g, (l) => l.toUpperCase());

      // exact search
      regx = new RegExp('(?:^|\W)'+searchQuery+'+(?:$|\W)', 'ig');
    } else {
      // rough search
      regx = new RegExp('('+searchQuery+'+)', 'ig');
    }

    const dbSearchQuery = {'name': regx};

    let itemsData;
    let marketError = false;

    services.sendLog('debug', 'cmd-market', `q: ${searchQuery} r:${regx}`);

    // getting the item data
    try {
      itemsData = await utils.fetchDB('items', dbSearchQuery);
    } catch (err) {
      marketError = true;
    }

    services.sendLog('debug', 'cmd-market', JSON.stringify(itemsData, null, 2));

    // checking the market status
    if (!marketError) {
      if (itemsData.length === 0) {
        end = Date.now();
        serveTime = (end-start)/1000+'s';

        queryResult = 'No Result on **'+searchQuery+'**.';
      } else {
        itemImage = itemsData[0].img;

        // adding limit to the result
        if (itemsData.length > 5) {
          msgData = 'Found **'+itemsData.length+'** matching items. Use exact search for more accurate result. (`market <'+searchQuery+'>`)';
          maxItemLength = 5;
        } else {
          maxItemLength = itemsData.length;
        }

        // populating the results
        for (let i = 0; i < maxItemLength; i++) {
          queryResult = queryResult + (
            `**${itemsData[i].name}** \`${itemsData[i].price_update}\`
            - Each: ${utils.formatCurrency(itemsData[i].price_min)}
            - Lowest: ${utils.formatCurrency(itemsData[i].price_min * itemsData[i].quantity_min)} for ${itemsData[i].quantity_min}\n`
          );
        }

        services.sendLog('debug', 'cmd-market', queryResult);

        end = Date.now();
        serveTime = (end-start)/1000+'s';
      }
    } else {
      end = Date.now();
      serveTime = (end-start)/1000+'s';

      queryResult = 'No result on **'+searchQuery+'**.';
    }

    const itemName = searchQuery.replace(/(^|\s)\S/g, (l) => l.toUpperCase());
    embedData = {
      'embed': {
        'author': {
          'name': 'Marketplace - '+itemName,
          'icon_url': 'https://cdn.discordapp.com/emojis/464036617531686913.png?v=1',
        },
        'description': queryResult,
        'color': 16766720,
        'footer': {
          'icon_url': 'https://slate.silveress.ie/docs_bns/images/logo.png',
          'text': 'Powered by Silveress\'s BnS API - Served in '+serveTime,
        },
        'thumbnail': {
          'url': itemImage,
        },
      },
    };

    msg.channel.stopTyping();

    return msg.say(msgData, embedData);
  }
};
