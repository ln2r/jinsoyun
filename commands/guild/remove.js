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
        let customRoles = [];

        if(guildSettings != undefined){
            customRoles = guildSettings[0].settings.custom_roles;
        }
        // default message
        let msgData = 'No custom role exist with that name, try again?\nAvailable roles: `'+customRoles+'`'; 
        let userRolesList = [];
        let userRolesData = msg.guild.members.get(msg.author.id).roles;
            userRolesData.map((role) =>{
                userRolesList.push(role.name)
            })

        let found = false;
        // checking if the server have custom roles
        if(customRoles.length != 0){
            // checking if the role valid
            for(let i = 0; i < customRoles.length; i++){                
                if(args.includes(customRoles[i])){ 
                    // checking if the user have the role
                    for(var j = 0; j < userRolesList.length; j++){ 
                        if(userRolesList[j] == customRoles[i]){
                            if(msg.guild.roles.find(role => role.name == customRoles[i]) != null){
                        
                                msg.guild.members.get(msg.author.id).removeRole(msg.guild.roles.find(role => role.name == customRoles[i]));
        
                                msgData = 'Successfully removed `'+customRoles[i]+'` role';                        
                            }
                            found = true;
                        }
                    }
                    
                    // telling user can't remove role he didn't join
                    if(j == userRolesList.length && found == false){
                        msgData = 'You can\'t remove what you didn\'t join'
                    }
                }
            }
        }else{
            msgData = 'There\'s no custom roles on this server, maybe make one first?';
        } 

        msg.channel.stopTyping();

        return msg.say(msgData);
    }
};