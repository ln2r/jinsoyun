const { Command } = require('discord.js-commando');
const { mongoGetData, setArrayDataFormat } = require('../../core');
const dateformat = require('dateformat');

module.exports = class ShowGuildCustomRolesCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'roles',
            group: 'guild',
            memberName: 'roles',
            description: 'Show server/guild custom available roles',
            examples: ['roles'],
            guildOnly: true,
        });
    }

    async run(msg) {
        msg.channel.startTyping();

        let guildSettings = await mongoGetData('guilds', {guild: msg.guild.id});
            guildSettings = guildSettings[0];
        let customRoles = ['*No data*'];

        if(guildSettings != undefined){
            customRoles = guildSettings.settings.custom_roles;
        }
        
        let embedData = {
            'embed': {
                'title': msg.guild.name+' Custom Roles',
                'color': 1879160,
                'description': 'You can use `add` command to add yourself the custom role'+setArrayDataFormat(customRoles, '- ', true),
                'footer': {
                    'text': 'Jinsoyun Bot - '+dateformat(Date.now(), 'UTC:dd-mm-yy @ HH:MM')+' UTC'
                }
            }
        }

        msg.channel.stopTyping();

        return msg.say(embedData);
    }
};