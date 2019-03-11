const { Command } = require('discord.js-commando');
const core = require('../../core.js');

module.exports = class ClassUpdateCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'class', // command name
            group: 'automation', // command group
            memberName: 'class', // name of the command in the group
            description: 'Force update class data.', // command desc
            examples: ['class'],
            ownerOnly: true
        });
    }

    run(msg) {
        // what command do here
        core.mongoClassDataUpdate();
        return msg.say('Updating classes data');
    }
};