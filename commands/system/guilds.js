/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
const {Command} = require('discord.js-commando');
const utils = require('../../utils/index');

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

    // getting connected guilds data
    const guildsData = this.client.guilds.cache;
    // eslint-disable-next-line prefer-const
    let data = [];
    let count = 0;

    guildsData.map((g) => {
      if (g.owner && g) {
        data.push(`${g.name} - ${g.owner.user.username}#${g.owner.user.discriminator}`);
      } else {
        data.push(`[REDACTED]`);
      }
      count++;
    });

    msg.channel.stopTyping();
    return msg.say({
      'embed': {
        'title': 'List of Connected Guilds',
        'color': 16741688,
        'description': 'Showing connected guilds, use `dump` for detailed info.',
        'fields': [
          {
            'name': `${count} Connected Guilds`,
            'value': utils.formatArray(data, '- ', true),
          },
        ],
      },
    });
  }
};
