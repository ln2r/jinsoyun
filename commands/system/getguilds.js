const {Command} = require('discord.js-commando');
const utils = require('../../utils/index.js');

module.exports = class GetGuildsCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'getguilds',
      group: 'dev',
      memberName: 'getguilds',
      description: 'get guilds data',
      guildOnly: true,
      hidden: true,
      ownerOnly: true,
    });
  }

  async run(msg) {
    const guildsData = this.client.guilds.cache;
    let data = [];
    let guildsCount = 0;

    guildsData.map((g) => {
      data.push(g.id+': '+g.name+' ('+g.owner.user.username+'#'+g.owner.user.discriminator+')');
      guildsCount++;
    });

    const embed = {
      'embed': {
        'description': utils.formatArray(data, '- ', true),
        'color': 16741688,
      },
    };
    return msg.say('Fetched '+guildsCount+' connected guilds data', embed);
  }
};
