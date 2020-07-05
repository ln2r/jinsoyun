const {Command} = require('discord.js-commando');
const service = require('../../services/index');

module.exports = class ItemsUpdateCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'items',
      group: 'system',
      memberName: 'items',
      description: 'Force update item data.',
      examples: ['items'],
      hidden: true,
      ownerOnly: true,
    });
  }

  run(msg) {
    service.automationItemUpdate();

    return msg.say('Updating items data');
  }
};
