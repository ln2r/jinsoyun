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
    const guildsData = this.client.guilds;
    const data = [];
    let count = guildsData.length;

    guildsData.map((g) => {
      data.push(g.id+': '+g.name+' ('+g.owner.user.username+'#'+g.owner.user.discriminator+')');
    });

    const embed = {
      'embed': {
        'description': utils.formatArray(data, '- ', true),
        'color': 16741688,
      },
    };
    return msg.say('Fetched '+count+' connected guilds data', embed);
  }
};
