const { Command } = require("discord.js-commando");
const { mongoGetData, getMentionedRoleId } = require("../../core");

module.exports = class ReactionRoleReactionRemoveCommand extends Command {
    constructor(client) {
        super(client, {
            name: "rremove",
            aliases: ["reactremove", "rre"],
            group: "guild",
            memberName: "rremove",
            description: "Remove reaction from reaction role message",
            examples: ["rremove `emoji`", "rremove :tada:"],
            guildOnly: true,
            args: [
                {
                    key: 'reaction',
                    prompt: 'Which reaction you want to remove?',
                    type: 'string'
                }
            ]
        });
    }

    async run(msg, {reaction}) {
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

                let emojiId;
                // removing unecessary stuff
                if(reaction.match(/\<\:(.*?)\>/gs)){
                    emojiId = reaction.slice(2, -1);
                    msgEmoji = "<:"+emojiId+">";
                }else{
                    emojiId = reaction;
                    msgEmoji = emojiId;
                }
                // console.debug("emoji data: "+emojiId);
                
                // find the message
                let messageIndex;
                let reactionIndex;
                let msgFound = false;
                let emojiFound = false;
                for(let i=0; i<reactionRoleData.length; i++){
                    if(reactionRoleData[i].id === msg.guild.currentMessage){
                        messageIndex = i;
                        msgFound = true;

                        // getting the reaction index
                        for(let j=0; j<reactionRoleData[i].reactions.length; j++){
                            if(reactionRoleData[i].reactions[j].emoji === emojiId){
                                reactionIndex = j;
                                emojiFound = true;
                            };
                        };
                    };
                };

                // removing reaction and update db
                if(msgFound && emojiFound){
                    // getting the channel data
                    const channel = this.client.channels.get(reactionRoleData[messageIndex].channel);
                    // get the message and remove the reaction
                    let emojiName = emojiId.replace(/\:(.*?)$/, "");
                    // console.debug("emoji name: "+emojiName);
                    channel.fetchMessage(msg.guild.currentMessage).then(message => {
                        let filtered = message.reactions.filter(reaction => reaction.emoji.name === emojiName);

                        filtered.forEach(reaction => reaction.remove(this.client.user.id));
                    });

                    // deletion
                    reactionRoleData[messageIndex].reactions.splice(reactionIndex, 1);

                    // saving
                    this.client.emit("guildReactionRoleChange", msg.guild.id, reactionRoleData);

                    msgData = "Deleted "+msgEmoji+" from your reaction-role message.";
                }else{
                    msgData = "I can't find any reaction-role messages or the emoji you inserted isn't used there (you can use `rmessage` to select the correct message).";
                };
            };
        }else{
            msgData = "You don't have the permission to use that command.";
        };

        msg.channel.stopTyping(); 

        return msg.say(msgData);
    };
};