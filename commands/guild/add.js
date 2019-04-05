const { Command } = require('discord.js-commando');
const { mongoGetData } = require('../../core');

module.exports = class JoinCustomRoleCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'add',
            aliases: ['addme'],
            group: 'guild',
            memberName: 'add',
            description: 'Add yourself some custom role',
            examples: ['add'],
            guildOnly: true,
        });
    }

    async run(msg, args) {
        msg.channel.startTyping();

        let guildSettings = await mongoGetData('guilds', {guild: msg.guild.id});
            guildSettings = guildSettings[0];
        let customRoles = [];

        args = args.toLowerCase(); // converting the role value to lower case

        if(guildSettings != undefined){
            customRoles = guildSettings.settings.custom_roles;
        }
        // default message
        let msgData = ''; 
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
                            found = true;
                        }
                    } 

                    // add role if user don't have it
                    if(!found){
                        if(msg.guild.roles.find(role => role.name == customRoles[i]) != null){
                            //console.debug('[soyun] [add-custom-role] add role permission: '+msg.channel.permissionsFor(this.client.user).has("MANAGE_ROLES", false))

                            // checking the bot permission
                            if(msg.channel.permissionsFor(this.client.user).has("MANAGE_ROLES", false)){
                                msg.guild.members.get(msg.author.id).addRole(msg.guild.roles.find(role => role.name == customRoles[i]));
    
                                msgData = 'Successfully added `'+customRoles[i]+'` role';
                            }else{
                                msgData = 'I\'m sorry, I don\'t have the permission to do that';
                            }                                                    
                        }                        
                    }else{
                        msgData = 'I think you already have that role';
                    }
                }
            }
        }else{
            msgData = 'Hmm there\'s no custom roles on this server, maybe make one first?';
        }

        msg.channel.stopTyping(); 

        return msg.say(msgData);
    }
};