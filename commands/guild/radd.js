const { Command } = require("discord.js-commando");
const { mongoGetData, getMentionedRoleId } = require("../../core");

module.exports = class ReactionRoleReactionAddCommand extends Command {
    constructor(client) {
        super(client, {
            name: "radd",
            aliases: ["reactadd", "ra"],
            group: "guild",
            memberName: "radd",
            description: "Add reaction to message for reaction role",
            examples: ["radd `role` `emoji`", "radd @role-name :tada:"],
            guildOnly: true,
        });
    }

    async run(msg, args) {
        msg.channel.startTyping();
        let msgData;
        let msgEmoji;

        // get user permission
        let authorPermission = msg.channel.permissionsFor(msg.author).has("MANAGE_ROLES", false);

        // check permission
        if(authorPermission){
            // check if message is selected
            if(!msg.guild.currentMessage){
                msgData = "Please select a message first using `rmessage message-id`";
            }else{
                // getting guild's reaction-role data from db
                let guildData = await mongoGetData("guilds", {guild: msg.guild.id});
                let reactionRoleData = guildData[0].settings.react_role;

                // checking if user give role
                let roleIdRaw = args.match(/\<\@(.*?)\>/gs);
                if(roleIdRaw){
                    let roleId = getMentionedRoleId(roleIdRaw.toString());
                    let emojiId;
                    // removing unecessary stuff
                    if(args.match(/\<\:(.*?)\>/gs)){
                        emojiId = args.replace(roleIdRaw.toString(), "").trim().slice(2, -1);
                        msgEmoji = "<:"+emojiId+">";
                    }else{
                        emojiId = args.replace(roleIdRaw.toString(), "").trim();
                        msgEmoji = emojiId;
                    }                    
                    // console.debug("args data: "+args);
                    // console.debug("role id: "+roleId);
                    // console.debug("emoji data: "+emojiId);
                    
                    // check if role exist
                    let roleData = msg.guild.roles.find(role => role.id === roleId);
                    if(roleData){
                        // find the message
                        let messageIndex;
                        for(let i=0; i<reactionRoleData.length; i++){
                            if(reactionRoleData[i].id === msg.guild.currentMessage){
                                messageIndex = i;
                            };
                        };

                        // add reaction and save to db
                        if(messageIndex){
                            // get the message
                            var messageData = await msg.channel.fetchMessage(msg.guild.currentMessage).catch(err => (messageData = false));
                            if(messageData){
                                messageData.react(emojiId);
                            };

                            // check if the reaction already exist
                            let reactionIndex;
                            if(reactionRoleData[messageIndex].reactions){
                                for(let i=0; i<reactionRoleData[messageIndex].reactions.length; i++){
                                    if(reactionRoleData[messageIndex].reactions[i].emoji === emojiId){
                                        reactionIndex = i;
                                    }
                                }
                            }

                            // replace the role if it is, insert new if it isn't
                            if(reactionIndex){    
                                reactionRoleData[messageIndex].reactions[reactionIndex].role = roleId;

                                msgData = "Replaced "+msgEmoji+" with <@&"+roleId+">";
                            }else{
                                if(reactionRoleData[messageIndex].reactions === undefined || reactionRoleData[messageIndex].reactions.length === 0){
                                    reactionRoleData[messageIndex].reactions = [{emoji: emojiId, role: roleId, once: false}];
                                }else{
                                    reactionRoleData[messageIndex].reactions.push({emoji: emojiId, role: roleId, once: false});
                                };

                                msgData = "Assigned "+msgEmoji+" with <@&"+roleId+">";
                            };

                            // saving
                            this.client.emit("guildReactionRoleChange", msg.guild.id, reactionRoleData);
                        }else{
                            msgData = "I can't find any messages, try to add or select one using `rmessage`";
                        };
                    }else{
                        msgData = "It seems I can't find that role.";
                    };
                }else{
                    msgData = "It seems I can't find any role there.";
                };
            };
        }else{
            msgData = "You don't have the permission to use that command.";
        };

        msg.channel.stopTyping(); 

        return msg.say(msgData);
    };
};