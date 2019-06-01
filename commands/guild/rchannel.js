const { Command } = require("discord.js-commando");
const { mongoGetData, getMentionedChannelId } = require("../../core");

module.exports = class ReactionRoleChannelCommand extends Command {
    constructor(client) {
        super(client, {
            name: "rchannel",
            aliases: ["reactchannel", "rc"],
            group: "guild",
            memberName: "rchannel",
            description: "Set/remove a channel for reaction role",
            examples: ["rchannel", "rchannel `#channel-name`", "rchannel `#roles`"],
            guildOnly: true,
        });
    };

    async run(msg, args) {
        msg.channel.startTyping();
        let msgData;

        // get user permission
        let authorPermission = msg.channel.permissionsFor(msg.author).has("MANAGE_ROLES", false);

        // check permission
        if(authorPermission){
            // getting guild's reaction-role data from db
            let guildData = await mongoGetData("guilds", {guild: msg.guild.id});
            let reactionRoleData = guildData[0].settings.react_role;

            let channelId;

            // checking if the user mentioned a channel
            if(args.length === 0){
                // use current channel
                channelId = msg.channel.id;
            }else{
                // use mentioned channel
                channelId = getMentionedChannelId(args);
            };

            // checking if the selected channel is saved
            let found = false;
            let idx;
            for(let i=0; i<reactionRoleData.channels.length; i++){
                if(reactionRoleData.channels[i] === channelId){
                    found = true;
                    idx = i;
                }
            };

            console.debug("Is role found: "+found);
            console.debug("channels data: "+reactionRoleData.channels);

            // save the channel when not found, delete when found
            if(!found){
                if(reactionRoleData.channels.length !== 0){
                    reactionRoleData.channels.push(channelId);
                }else{
                    reactionRoleData.channels = [channelId];
                };

                msgData = "Added <#"+channelId+"> to reaction-role channel list";
            }else{
                if(reactionRoleData.channels.length === 1){
                    reactionRoleData.channels = [];
                }else{
                    reactionRoleData.channels = reactionRoleData.channels.splice(idx, 1);
                }               

                msgData = "<#"+channelId+"> has been removed from reaction-role channel list";
            };
            
            // save to db
            this.client.emit("guildReactionRoleChange", msg.guild.id, reactionRoleData);
        }else{
            msgData = "You don't have the permission to use that command.";
        };

        msg.channel.stopTyping(); 

        return msg.say(msgData);
    };
};