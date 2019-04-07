const { Command } = require('discord.js-commando');
const { mongoGetData, setDataFormatString } = require('../../core');

module.exports = class SyncCustomRoleCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'sync',
            group: 'guild',
            memberName: 'sync',
            description: 'Add existing roles to use as custom roles',
            examples: ['sync friends', 'sync best friend'],
            guildOnly: true,
            userPermission: ['MANAGE_ROLES'],
            args: [
                {
                    key: 'roleName',
                    prompt: 'What is the role name?',
                    type: 'string'
                }
            ]
        });
    }

    async run(msg, {roleName}) {
        msg.channel.startTyping();

        let msgData = '';
        let authorPermission = msg.channel.permissionsFor(msg.author).has("MANAGE_ROLES", false);

        roleName = roleName.toLowerCase(); // converting the role value to lower case

        if(authorPermission){            
            let guildSettings = await mongoGetData('guilds', {guild: msg.guild.id});
                guildSettings = guildSettings[0];
            
            let customRolesData;

            if(guildSettings != undefined){
                let currentCustomRoles = guildSettings.settings.custom_roles;
                let guildRolesData = msg.guild.roles.find(role => role.name == args);

                // checking the role existance
                if(guildRolesData != null){
                    customRolesData = [guildRolesData.id];

                    for(let i=0; i < currentCustomRoles.length; i++){
                        customRolesData.push(currentCustomRoles[i]);
                    }

                    // update the db
                    //this.client.emit('guildCustomRole', msg.guild.id, customRolesData);

                    msgData = '`'+args+'` role added to the database';
                }else{
                    msgData = 'I can\'t find any role with that name';
                }
            }else{
                msgData = 'I can\'t find any custom role for this guild/server, use `create role name` to make new or `sync role name` to add existing role into custom role';
            }
        }else{
            msgData = 'I\'m sorry, you don\'t have the permission to use that command';
        }

        msg.channel.stopTyping(); 

        return msg.say(msgData);
    }
};