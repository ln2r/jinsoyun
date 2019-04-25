const { Command } = require("discord.js-commando");
const dateformat = require("dateformat");

const { sendResetNotification } = require("../../core");

module.exports = class ResetNotificationCommand extends Command {
    constructor(client) {
        super(client, {
            name: "reset",
            group: "automation",
            memberName: "reset",
            description: "Send challenges reset notification.",
            guildOnly: true,
            hidden: true,
        });
    }

    async run(msg) {
        sendResetNotification(this.client.guilds);
    }
}