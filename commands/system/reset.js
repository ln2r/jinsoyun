const { Command } = require("discord.js-commando");
const dateformat = require("dateformat");

const { sendResetNotification } = require("../../core");

module.exports = class ResetNotificationCommand extends Command {
    constructor(client) {
        super(client, {
            name: "reset",
            group: "system",
            memberName: "reset",
            description: "Send challenges reset notification.",
            hidden: true,
            ownerOnly: true,
        });
    }

    async run(msg) {
        sendResetNotification(this.client.guilds);
    }
};