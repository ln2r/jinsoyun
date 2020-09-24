/* eslint-disable require-jsdoc */
const {Command} = require('discord.js-commando');
const items = require('../../cron/items');

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
    items();

    return msg.say('Updating items data');
  }
};
