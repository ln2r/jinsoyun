const {Command} = require('discord.js-commando');
const service = require('../../services/index');

module.exports = class ResetNotificationCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'reset',
      group: 'system',
      memberName: 'reset',
      description: 'Send challenges reset notification.',
      hidden: true,
      ownerOnly: true,
    });
  }

  async run() {
    service.automationQuestReset(this.client.guilds);
  }
};
