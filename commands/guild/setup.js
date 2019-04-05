const { Command } = require('discord.js-commando');
const { mongoGetData } = require('../../core');

module.exports = class CreateJoinRoleCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setup',
            group: 'guild',
            memberName: 'setup',
            description: 'Create necessary classes role for `join` or `reg` to work',
            examples: ['setup'],
            guildOnly: true,
            userPermission: ['MANAGE_ROLES'],
        });
    }

    async run(msg) {
        let authorPermission = msg.channel.permissionsFor(msg.author).has("MANAGE_ROLES", false);
        let msgData = '';
        msg.channel.startTyping();

        if(authorPermission){            
            let guildSettingsData = await mongoGetData('guilds', {guild: msg.guild.id});
                guildSettingsData = guildSettingsData[0];
            
            let rolesList = await mongoGetData('configs', {});
                rolesList = rolesList[0];
        
            let rolesSetupStatus = '';
            if(guildSettingsData != undefined){
                rolesSetupStatus = guildSettingsData.roles_setup
            }

            // checking if the guild already done the setup or not
            if(rolesSetupStatus == undefined){
                for(let i = 0; i < rolesList.length; i ++){
                    // checking if the current class role existed or not
                    if((msg.guild.roles.find(role => role.name == rolesList[i])) == null){
                        // creating the roles
                        msg.guild.createRole({
                            'name': rolesList[i],
                            'hoist': true
                        })
                        //console.debug('[soyun] [role-setup] ['+msg.guild.name+'] '+rolesList[i]+' role created @ '+msg.guild.name);
                    }                
                }

                this.client.emit('guildRolesSetup', msg.guild.id, true); // updating the database

                msgData = 'Necessary classes roles created, go to `Server Settings > Roles` to check and configure it'
            }else{
                msgData = 'Classes roles already created, go to `Server Settings > Roles` to check and configure it'
            }
        }else{
            msgData = 'You don\'t have the permission to use that command';
        }
        msg.channel.stopTyping();

        return msg.say(msgData);
    }
};