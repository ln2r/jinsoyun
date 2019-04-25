const { Command } = require("discord.js-commando");
const { mongoGetData } = require("../../core");

module.exports = class JoinCustomRoleCommand extends Command {
    constructor(client) {
        super(client, {
            name: "add",
            aliases: ["addme"],
            group: "guild",
            memberName: "add",
            description: "Add yourself some custom role",
            examples: ["add"],
            guildOnly: true,
        });
    }

    async run(msg, args) {
        msg.channel.startTyping();

        let guildSettings = await mongoGetData("guilds", {guild: msg.guild.id});
            guildSettings = guildSettings[0];
        let customRoles = [];

        let msgData;
        let argsValid = false; 

        args = args.toLowerCase(); // converting the role value to lower case

        let guildCustomRolesData = [];
        if(guildSettings !== undefined){
            customRoles = guildSettings.settings.custom_roles;

            // getting the roles name
            for(let i=0; i<customRoles.length; i++){
                let guildRolesData = msg.guild.roles.find(role => role.id === customRoles[i]);
                if(guildRolesData !== null){
                    guildCustomRolesData.push(guildRolesData.name);
                }                 
            }
        }        

        // checking if the server have custom roles
        let userRolesData;
        let roleFound = false;
        if(customRoles.length !== 0){
            // checking if the role valid
            let guildRolesData = msg.guild.roles.find(role => role.name === args);
            
            if(guildRolesData !== null){
                userRolesData = msg.guild.members.get(msg.author.id).roles.find(role => role.id === guildRolesData.id);
                roleFound = true;
            }
            //console.debug("[soyun] [custom-roles-add] role data: "+guildRolesData);
            //console.debug("[soyun] [custom-roles-add] user role data: "+userRolesData);
            //console.debug("[soyun] [custom-roles-add] guild custom roles data:"+guildCustomRolesData);

            // checking if the args is valid
            for(let i=0; i<guildCustomRolesData.length; i++){
                if(args.includes(guildCustomRolesData[i])){
                    argsValid = true;
                }
            }

            if(guildRolesData !== null && argsValid && roleFound){
                // checking if user have role
                if(userRolesData === null){
                    // checking if the bot have the permission
                    if(msg.channel.permissionsFor(this.client.user).has("MANAGE_ROLES", false)){
                        // adding the role
                        msg.guild.members.get(msg.author.id).addRole(guildRolesData.id);

                        msgData = "Successfully added `"+args+"` role";
                    }else{
                        msgData = "I'm sorry, I don't have the permission to do that";
                    }    
                }else{
                    msgData = "I think you already have that role";
                }
            }else{
                msgData = "I can't find custom role with that name, try again?\nAvailable roles: `"+guildCustomRolesData+"`";
            }
        }else{
            msgData = "Hmm there's no custom roles on this server, maybe make one first?";
        }

        msg.channel.stopTyping(); 

        return msg.say(msgData);
    }
};