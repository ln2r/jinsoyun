const { Command } = require("discord.js-commando");
const { mongoItemDataUpdate} = require("../../core");

module.exports = class ItemsUpdateCommand extends Command {
    constructor(client) {
        super(client, {
            name: "items", // command name
            group: "automation", // command group
            memberName: "items", // name of the command in the group
            description: "Force update item data.", // command desc
            examples: ["items"], 
            ownerOnly: true
        });
    }

    run(msg) {
        // what command do here
        mongoItemDataUpdate();
        return msg.say("Updating items data");
    }
};