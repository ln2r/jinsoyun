const { Command } = require('discord.js-commando');
const { mongoGetData } = require('../../core');

module.exports = class SyncCustomRoleCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'sync',
            group: 'guild',
            memberName: 'sync',
            description: 'Syncronize the custom roles data with the database, use `sync role name` to add existing role to database',
            examples: ['sync', 'sync role name'],
            guildOnly: true,
            userPermission: ['MANAGE_ROLES'],
        });
    }

    async run(msg, args) {
        msg.channel.startTyping();

        let msgData = '';
        let authorPermission = msg.channel.permissionsFor(msg.author).has("MANAGE_ROLES", false);

        if(authorPermission){            
            let guildSettings = await mongoGetData('guilds', {guild: msg.guild.id});
                guildSettings = guildSettings[0];
            
            let customRolesData;

            if(guildSettings != undefined){
                customRolesData = guildSettings.settings.custom_roles;
            }        

            // sync the role with db
            // if the user isn't specified any roles, the bot will just sync the roles in db by deleteing any roles that the bot can't find in the guild/server
            let foundRoles = [];
            let absentRoles = [];
            if(args == ''){
                // checking if the server have any custom roles
                if(customRolesData != null && guildSettings != undefined){
                    for(let i = 0; i < customRolesData.length; i++){
                        // insert the role into an array if it's exist
                        if(msg.guild.roles.find(role => role.name == customRolesData[i]) != null){
                            foundRoles.push(customRolesData[i]);
                        }else{
                            absentRoles.push(customRolesData[i]);
                        }
                    }

                    // update the db
                    this.client.emit('guildCustomRole', msg.guild.id, foundRoles);

                    msgData = 'Custom roles syncronized, deleted roles: `'+absentRoles+'`';
                }else{
                    msgData = 'No custom roles found on this guild/server, try `create role` to make a new role or `sync role-name` to add existing role into custom roles';
                }
            }else{
                // mergin the roles data
                customRolesData = [args];

                if(guildSettings != undefined){
                    let currentCustomRoles = guildSettings.settings.custom_roles;

                    if(currentCustomRoles.length != 0){
                        for(let i=0; i < currentCustomRoles.length; i++){
                            customRolesData.push(currentCustomRoles[i]);
                        }
                    }
                }

                // update the db
                this.client.emit('guildCustomRole', msg.guild.id, customRolesData);

                msgData = '`'+args+'` role syncronized with the database';
            }
        }else{
            msgData = 'I\'m sorry, you don\'t have the permission to use that command'
        }

        msg.channel.stopTyping(); 

        return msg.say(msgData);
    }
};