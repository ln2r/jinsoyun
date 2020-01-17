const { Command } = require("discord.js-commando");
const { mongoGetData, getGlobalSettings, getAuthorPermission } = require("../../core");

module.exports = class ReactionRoleMessageCommand extends Command {
    constructor(client) {
        super(client, {
            name: "rmessage",
            aliases: ["reactmessage", "rm"],
            group: "guild",
            memberName: "rmessage",
            description: "Set/remove a message for reaction role",
            examples: ["rmessage `message-id`", "rmessage 123451234512345123"],
            guildOnly: true,
        });
    };

    async run(msg, args) {
        msg.channel.startTyping();

        // checking if the command disabled or not
        let globalSettings = await getGlobalSettings("rmessage");
        if(!globalSettings.status){
            msg.channel.stopTyping();

            return msg.say("This command is currently disabled.\nReason: "+globalSettings.message);
        };

        let msgData;
        let embedData;

        // check permission
        if(await getAuthorPermission(msg, msg.guild.id)){
            let reactionMessageData;

            // getting guild's reaction-role data from db
            let guildData = await mongoGetData("configs", {guild: msg.guild.id});
            let reactionRoleData = guildData[0].settings.react_role;

            // initialize if it's empty
            if(!reactionRoleData){
                reactionRoleData = reactionRoleData = [];
            };

            // checking if the user gave something like a message id
            if(args.length >= 15 && /^[0-9]*$/.test(args)){
                let messageId = args

                // checking if the selected message is saved
                let found = false;
                for(let i=0; i<reactionRoleData.length; i++){
                    if(reactionRoleData[i].id === messageId){
                        found = true;
                    }
                };

                // check and get message data    
                reactionMessageData = await msg.channel.fetchMessage(messageId).catch(err => (reactionMessageData = false));
        
                if(reactionMessageData) {
                    // getting content
                    let reactionMessageContent = reactionMessageData.content;

                    // present message content and url
                    if(!found){
                        reactionRoleData.push({id: messageId, channel: msg.channel.id});
                        
                        this.client.emit("guildReactionRoleChange", msg.guild.id, reactionRoleData);

                        msgData = "Reaction-role message has been added and selected.";
                    }else{
                        msgData = "Reaction-role message with id: `"+messageId+"` selected.";
                    }

                    msg.guild.currentMessage = messageId;
                    
                    embedData = {
                        'embed': {
                            'title': "Message Data",
                            'url': "https://discordapp.com/channels/"+msg.guild.id+"/"+msg.channel.id+"/"+messageId,
                            'description': "Click this embed title to see the original message.",
                            'color': 2061822,
                            'fields': [
                                {
                                    'name': "Message Id",
                                    'value': messageId
                                },
                                {
                                    'name': "Content",
                                    'value': reactionMessageContent
                                },                            
                            ],
                        }
                    };
                }else{
                    msgData = "Can't find message with id: `"+messageId+"` in this channel (try to use the command on the same channel as the message).";
                };               
            }else{
                msgData = "That doesn't look like a message id";
            };
        }else{
            msgData = "You don't have the permission to use that command.";
        };

        msg.channel.stopTyping(); 

        return msg.say(msgData, embedData);
    };
};