const {Command} = require('discord.js-commando');
const utils = require('../../utils/index');
const dateformat = require('dateformat');
const configs = require('../../config.json');

module.exports = class BotGetGuildsCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'guilds',
      group: 'system',
      memberName: 'guilds',
      description: 'Get bot connected guilds data.',
      examples: ['guilds'],
      hidden: true,
      ownerOnly: true,
    });
  }

  async run(msg) {
    msg.channel.startTyping();

    const currentTime = new Date();

    // getting stats
    const statsData = await utils.fetchDB(configs.collection.stats, {date: dateformat(currentTime, 'UTC:dd-mmmm-yyyy')});

    // getting connected guilds data
    const guildsData = this.client.guilds.cache;
    let data = [];
    let guildsCount = 0;

    guildsData.map((g) => {
      data.push(g.id+': '+g.name+' ('+g.owner.user.username+'#'+g.owner.user.discriminator+')');
      guildsCount++;
    });

    msg.channel.stopTyping();
    return msg.say({
      'embed': {
        'title': 'List of Connected Guilds',
        'color': 16741688,
        'fields': [
          {
            'name': 'Requests',
            'value': `${(statsData[0])? statsData[0].count:0} requests received.`,
          },
          {
            'name': `${guildsCount} Connected Guilds`,
            'value': utils.formatArray(data, '- ', true),
          }        
        ],
      },
    });
  }
};
