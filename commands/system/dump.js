/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
const {Command} = require('discord.js-commando');
const {MessageAttachment} = require('discord.js');
const utils = require('../../utils/index');
const configs = require('../../config.json');

module.exports = class BotGetGuildsCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'dump',
      group: 'system',
      memberName: 'dump',
      description: 'Dump bot data to a JSON file.',
      examples: ['dump'],
      hidden: true,
      ownerOnly: true,
    });
  }

  async run(msg) {
    msg.channel.startTyping();

    // getting global settings data
    const globalSettings = await utils.fetchDB('configs');
    let global;

    // getting connected guilds data
    const guildsData = this.client.guilds.cache;
    // eslint-disable-next-line prefer-const
    let guilds = [];

    globalSettings.map((s) => {
      if (s.guild === 0) {
        global = s;
      } else {
        guildsData.map((g) => {
          let setting;
          if (g.id === s.guild) {
            setting = s;

            guilds.push({
              'id': g.id,
              'name': g.name,
              'joined': g.joinedAt,
              'memberCount': g.memberCount,
              'available': g.available,
              'region': g.region,
              'owner': {
                'id': g.owner.id,
                'user': `${g.owner.user.username}#${g.owner.user.discriminator}`,
              },
              'settings': setting,
            });
          }
        });
      }
    });

    const data = {
      'bot': {
        'user': this.client.user,
        'options': this.client.option,
      },
      'settings': {
        configs,
        'global': global,
      },
      'guilds': guilds,
    };

    // converting "data" to buffer
    // https://discord.js.org/#/docs/main/stable/examples/attachments
    // Buffer.from(JSON.stringify(obj))
    const attachment = new MessageAttachment(Buffer.from(JSON.stringify(data, null, 2)), 'jinsoyun.json');

    msg.channel.stopTyping();
    return msg.say(attachment);
  }
};
