const { Command } = require("discord.js-commando");
const { mongoGetData, setArrayDataFormat } = require("../../core");

module.exports = class ReactionRoleCommand extends Command {
    constructor(client) {
        super(client, {
            name: "reactrole",
            aliases: ["reactsetup", "rr", "rs"],
            group: "guild",
            memberName: "reactrole",
            description: "Add user a role by clicking on specified reaction emoji",
            examples: ["reactrole `message id`", "reactrole `123451234512345123`"],
            guildOnly: true,
        });
    }

    async run(msg, args) {
        msg.channel.startTyping();
        let authorPermission = msg.channel.permissionsFor(msg.author).has("MANAGE_ROLES", false);

        let msgData;
        let embedData;

        if(authorPermission){   
            // getting reaction role data from db
            let guildReactionRoleData = await mongoGetData("guilds", {guild: msg.guild.id});
                
            
            if(guildReactionRoleData[0].settings.react_role === undefined){
                guildReactionRoleData = []
            }else{
                guildReactionRoleData = guildReactionRoleData[0].settings.react_role;
            }
            
            let reactionEmojiName = [];
            let reactionRoleId = [];
            let reactionRoleName = [];
            let reactionData;
            let reactionMessageContent;

            // check if message exist        
            var reactionMessageData = await msg.channel.fetchMessage(args).catch(err => (reactionMessageData = false));
    
            if(reactionMessageData) {
                // getting reaction data
                reactionData = reactionMessageData.reactions;
                // getting content
                reactionMessageContent = reactionMessageData.content;
            };  
            
            //console.debug("[soyun] [react-role] ["+msg.guild.name+"] reactionMessageData data: "+reactionMessageData);
            //console.debug("[soyun] [react-role] ["+msg.guild.name+"] reactionData data:");console.log(reactionData);
        
            if(reactionMessageData){
                // adding the emoji name to array for searching role with the same name
                reactionData.map(msg =>{
                    reactionEmojiName.push(msg._emoji.name);
                });

                if(reactionEmojiName.length === 0){
                    reactionEmojiName = ["*No Reaction Found*"];
                };

                // adding and check the role id
                reactionEmojiName.forEach(element => {
                    //console.debug("[soyun] [react-role] ["+msg.guild.name+"] checking "+element+": "+msg.guild.roles.find(role => role.name === element));    

                    if(msg.guild.roles.find(role => role.name === element)) { 
                        let roleData = msg.guild.roles.find(role => role.name === element);
                        
                        reactionRoleId.push(roleData.id);
                        reactionRoleName.push(roleData.name);
                    };
                });

                //console.debug("[soyun] [react-role] ["+msg.guild.name+"] reactionEmojiName data: "+reactionEmojiName);    
                //console.debug("[soyun] [react-role] ["+msg.guild.name+"] reactionRoleId data: "+reactionRoleId);    

                // check the db if the message exist
                // yes: ignore, no: add new 
                let messageFound = false;           
                for(let i = 0; i < guildReactionRoleData.length; i++){
                    if(args === guildReactionRoleData[i]){
                        messageFound = true;
                    };
                };

                if(!messageFound) guildReactionRoleData.push(args);

                //console.debug("[soyun] [react-role] ["+msg.guild.name+"] reactionRoleMessageData data:"); //console.debug(guildReactionRoleData);    

                this.client.emit('guildReactionRoleMessageChange', msg.guild.id, guildReactionRoleData);

                msgData = "Reaction based role addition/removal message has been set";
                embedData = {
                    'embed': {
                        'title': "Message Data",
                        'url': "https://discordapp.com/channels/"+msg.guild.id+"/"+msg.channel.id+"/"+args,
                        'description': "Click this embed title to see the original message.",
                        'color': 2061822,
                        'fields': [
                            {
                                'name': "Content",
                                'value': reactionMessageContent
                            },
                            {
                                'name': "Reactions",
                                'value': setArrayDataFormat(reactionEmojiName, "- ", true)
                            },
                            {
                                'name': "Roles Checker",
                                'value': "If the the role you wanted isn't here please check if the role name and reaction name is the same or not, use `reactrole` with the same message id again to check if everything is correct.\n"+setArrayDataFormat(reactionRoleName, "- ", true)
                            }
                        ],
                    }
                }
            }else{
                msgData = "I can't find the message you're referring to, please check the id and try again."
            }
        }else{
            msgData = "You don't have the permission to use that command";
        }

        msg.channel.stopTyping(); 

        return msg.say(msgData, embedData);
    }
};