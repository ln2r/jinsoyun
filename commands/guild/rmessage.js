const { Command } = require("discord.js-commando");
const { mongoGetData } = require("../../core");

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
        let msgData;
        let embedData;

        // get user permission
        let authorPermission = msg.channel.permissionsFor(msg.author).has("MANAGE_ROLES", false);

        // check permission
        if(authorPermission){
            let reactionMessageData;

            // getting guild's reaction-role data from db
            let guildData = await mongoGetData("guilds", {guild: msg.guild.id});
            let reactionRoleData = guildData[0].settings.react_role;

            // initialize if it's empty
            if(!reactionRoleData){
                reactionRoleData = reactionRoleData = [];
            };

            // console.debug("guild reaction-role data: "+reactionRoleData+", with the length of: "+reactionRoleData.length);

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
                // console.debug("messageId value: "+messageId);    
                reactionMessageData = await msg.channel.fetchMessage(messageId).catch(err => (reactionMessageData = false));

                console.log(reactionMessageData);

                // console.debug("message found: "+reactionMessageData);
        
                if(reactionMessageData) {
                    // getting content
                    let reactionMessageContent = reactionMessageData.content;

                    // present message content and url
                    // console.debug("message in db: "+found);

                    if(!found){
                        reactionRoleData.push({id: messageId, channel: msg.channel.id});
                        
                        this.client.emit("guildReactionRoleChange", msg.guild.id, reactionRoleData);

                        msgData = "Reaction-role message has been added and selected.";
                    }else{
                        msgData = "Reaction-role message with id: `"+messageId+"` selected.";
                    }

                    msg.guild.currentMessage = messageId;
                    // console.debug("current message: "+msg.guild.currentMessage);
                    
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