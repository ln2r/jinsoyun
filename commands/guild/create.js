const { Command } = require('discord.js-commando');
const { mongoGetData } = require('../../core');

module.exports = class CreateChCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'create',
            aliases: ['make', 'setup'],
            group: 'guild',
            memberName: 'create',
            description: 'Create classes role',
            examples: ['create'],
            guildOnly: true,
            userPermission: ['ADMINISTRATOR', 'MANAGE_CHANNELS', 'MANAGE_GUILD', 'MANAGE_MESSAGES', 'MANAGE_NICKNAMES', 'MANAGE_ROLES'],
        });
    }

    async run(msg) {
        let msgData = '';
        let guildSettingsData = await mongoGetData('guilds', {guild: msg.guild.id});
        let classList = ['gunslinger', 'blade dancer', 'destroyer', 'summoner', 'kung fu master', 'assassin', 'force master', 'warlock', 'blade master', 'soul fighter', 'warden'];

        // checking if the guild already done the setup or not
        if(guildSettingsData[0].roles_setup == undefined){
            for(let i = 0; i < classList.length; i ++){
                // checking if the current class role existed or not
                if((msg.guild.roles.find(role => role.name == classList[i])) == null){
                    // creating the roles
                    msg.guild.createRole({
                        'name': classList[i],
                        'hoist': true
                    })
                    //console.debug('[soyun] [role-setup] ['+msg.guild.name+'] '+classList[i]+' role created @ '+msg.guild.name);
                }                
            }

            this.client.emit('guildRolesSetup', msg.guild.id, true); // updating the database

            msgData = 'Necessary classes roles created, go to `Server Settings > Roles` to check and configure it'
        }else{
            msgData = 'Classes roles already created, go to `Server Settings > Roles` to check and configure it'
        }

        return msg.say(msgData);
    }
};