const { Command } = require('discord.js-commando');
const dateformat = require('dateformat');

const core = require('../../core.js');

module.exports = class ResetNotificationCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'reset',
            group: 'automation',
            memberName: 'reset',
            description: 'Send challenges reset notification.',
            guildOnly: true,
            hidden: true,
        });
    }

    async run(msg) {
        core.sendResetNotification(this.client.guilds);
    }
};