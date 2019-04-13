const { Command } = require('discord.js-commando');
const { mongoGetData } = require('../../core');

module.exports = class RemoveCustomRoleCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'remove',
            aliases: ['leave'],
            group: 'guild',
            memberName: 'remove',
            description: 'Remove your custom role',
            examples: ['remove'],
            guildOnly: true,
        });
    }

    async run(msg, args) {
        msg.channel.startTyping();

        let guildSettings = await mongoGetData('guilds', {guild: msg.guild.id});
            guildSettings = guildSettings[0];
        let customRoles = [];

        let msgData;
        let argsValid = false; 

        args = args.toLowerCase(); // converting the role value to lower case

        let guildCustomRolesData = [];
        if(guildSettings != undefined){
            customRoles = guildSettings.settings.custom_roles;

            // getting the roles name
            for(let i=0; i<customRoles.length; i++){
                let guildRolesData = msg.guild.roles.find(role => role.id == customRoles[i]);
                if(guildRolesData != null){
                    guildCustomRolesData.push(guildRolesData.name);
                }                 
            }
        }        

        // checking if the server have custom roles
        if(customRoles.length != 0){
            // checking if the role valid
            let guildRolesData = msg.guild.roles.find(role => role.name == args);
            if(guildRolesData != undefined){
                var userRolesData = msg.guild.members.get(msg.author.id).roles.find(role => role.id == guildRolesData.id);
            }
            
            //console.debug('[soyun] [custom-roles-remove] role data: '+guildRolesData);
            //console.debug('[soyun] [custom-roles-remove] user role data: '+userRolesData);
            //console.debug('[soyun] [custom-roles-remove] guild custom roles data:'+guildCustomRolesData);

            // checking if the args is valid
            for(let i=0; i<guildCustomRolesData.length; i++){
                if(args.includes(guildCustomRolesData[i])){
                    argsValid = true;
                }
            }

            if(guildRolesData != null && argsValid){
                // checking if user have role
                if(userRolesData != null && userRolesData != undefined){
                    // checking if the bot have the permission
                    if(msg.channel.permissionsFor(this.client.user).has("MANAGE_ROLES", false)){
                        // removing the role
                        msg.guild.members.get(msg.author.id).removeRole(guildRolesData.id);

                        msgData = 'Successfully removed `'+args+'` role';
                    }else{
                        msgData = 'I\'m sorry, I don\'t have the permission to do that';
                    }    
                }else{
                    msgData = 'I don\'t think you have that role';
                }
            }else{
                msgData = 'I can\'t find custom role with that name, try again?\nAvailable roles: `'+guildCustomRolesData+'`'
            }
        }else{
            msgData = 'Hmm there\'s no custom roles on this server, maybe make one first?';
        } 

        msg.channel.stopTyping();

        return msg.say(msgData);
    }
};