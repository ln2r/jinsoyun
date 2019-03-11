const { Command } = require('discord.js-commando');
const core = require('../../core.js');

module.exports = class ItemsUpdateCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'items', // command name
            group: 'automation', // command group
            memberName: 'items', // name of the command in the group
            description: 'Force update item data.', // command desc
            examples: ['items'], 
            ownerOnly: true
        });
    }

    run(msg) {
        // what command do here
        core.mongoItemDataUpdate();
        return msg.say('Updating items data');
    }
};