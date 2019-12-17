const { Command } = require("discord.js-commando");
const dateformat = require("dateformat");
const { getGuildSettings, getMentionedChannelId, getMentionedRoleId, getGlobalSettings } = require("../../core");

module.exports = class GuildSettingsCommand extends Command {
    constructor(client) {
        super(client, {
            name: "setting",
            aliases: ["set", "config", "change"],
            group: "guild",
            memberName: "setting",
            description: "Change the bot setting. Use `show` to see the current guild/server settings. \n\tAvailable Settings: \n\t- `reset channel-name or disable` (To configure quest reset notification)\n\t- `twitter #channel-name or disable` (To configure blade and soul twitter tweet notification)\n\t- `gate #welcome-channel #follow-up-channel @role-name or disable` (To configure new member verification)",
            examples: ["setting option value", "setting reset #channel-name", "setting reset disable"],
            guildOnly: true,
        });
    }

    async run(msg, args) {
        msg.channel.startTyping();

        // checking if the command disabled or not
        let globalSettings = await getGlobalSettings("setting");
        if(!globalSettings.status){
            msg.channel.stopTyping();

            return msg.say("This command is currently disabled.\nReason: "+globalSettings.message);
        };

        let msgData = "";
        let embedData;

        let authorPermission = msg.channel.permissionsFor(msg.author).has("MANAGE_ROLES", false);
        if(authorPermission){
            let guildSettings = await getGuildSettings(msg.guild.id);
            let botPrefix;

            if(guildSettings){
                botPrefix = guildSettings.settings.prefix;
            }else{
                botPrefix = "!";
            }
            
            embedData = {
                'embed': {
                    'title': "Jinsoyun Bot - Available Settings",
                    'description': "To configure use `"+botPrefix+"setting option value`, to disable replce `#channel-name` or `@role-name` with disable.\nExamples:",
                    'color': 16741688,
                    'fields': [
                        {
                            'inline': false,
                            'name': "Twitter News",
                            'value': "Change: `"+botPrefix+"setting twitter #channel-name`\nDisable: `"+botPrefix+"setting twitter disable`"
                        },
                        {
                            'inline': false,
                            'name': "Koldrak's Lair Access",
                            'value': "Change: `"+botPrefix+"setting koldrak #channel-name`\nDisable: `"+botPrefix+"setting koldrak disable`"
                        },
                        {
                            'inline': false,
                            'name': "Challenge Quests and Event Summary",
                            'value': "Change: `"+botPrefix+"setting reset #channel-name`\nDisable: `"+botPrefix+"setting reset disable`"
                        },
                        {
                            'inline': false,
                            'name': "New Member Verification",
                            'value': "Change: `"+botPrefix+"setting gate #welcome-channel #follow-up-channel @role-name`\nDisable: `"+botPrefix+"setting gate disable disable disable`\nNote: You can just replace one of them to `disable` if you want that feature disabled (like the follow-up or auto role assignment)."
                        },
                        {
                            'inline': true,
                            'name': "Join Command Custom Message",
                            'value': "Change: `"+botPrefix+"setting joinmsg Your message here.`\nDisable: `"+botPrefix+"setting joinmsg disable `\nNote: If you want to mention the message author use MESSAGE_AUTHOR, and SERVER_NAME when you want to add the server name."
                        },
                    ]
                }
            };    

            let query = args.split(" ");
            let changed = false;

            let setting = query[0];
            let optionDisplayName;
            let optionDescription;
            let optionEmbedData;

            let settingResetChannelText = "*No Channel Selected*";
            let settingTwitterChannelText = "*No Channel Selected*";
            let settingKoldrakChannelText = "*No Channel Selected*";
            let settingGateChannelText = "*No Channel Selected*";
            let settingGateFollowupChannelText = "*No Channel Selected*";
            let settingGateRoleText = "*No Role Selected*";
            let settingFollowupMessageText = "*No Message Set*";

            switch(setting){
                case "reset":
                    if(query[1]){
                        let settingResetChannel;

                        if(query[1] === "disable"){
                            settingResetChannel = null;  
                        }else{
                            let resetChannelId = getMentionedChannelId(query[1]);                            
                            settingResetChannel = resetChannelId;  
                            settingResetChannelText = "<#"+resetChannelId+">";
                        };

                        // update the database
                        this.client.emit('notificationResetChange', msg.guild.id, settingResetChannel);

                        changed = true;
                    };

                    if(!changed){
                        if(guildSettings){
                            if(guildSettings.settings.quest_reset && guildSettings.settings.quest_reset !== null){
                                settingResetChannelText = "<#"+guildSettings.settings.quest_reset+">";
                            }
                        }
                    };

                    optionDisplayName = "Challenge Quests and Event Summary";
                    optionDescription = "Challange quests (daily, weekly) reset and event summary notification.";
                    optionEmbedData = [
                        {
                            'name': "Channel Name",
                            'value': settingResetChannelText,
                        },
                    ]; 
                break;

                case "twitter":
                    if(query[1]){
                        let settingTwitterChannel;

                        if(query[1] === "disable"){
                            settingTwitterChannel = null;  
                        }else{
                            let channelId = getMentionedChannelId(query[1]);

                            settingTwitterChannel = channelId;  
                            settingTwitterChannelText = "<#"+channelId+">";
                        };

                        // update the database
                        this.client.emit('notificationTwitterChange', msg.guild.id, settingTwitterChannel);

                        changed = true;
                    };

                    if(!changed){
                        if(guildSettings){
                            if(guildSettings.settings.twitter && guildSettings.settings.twitter !== null){
                                settingTwitterChannelText = "<#"+guildSettings.settings.twitter+">";
                            }
                        }                        
                    };

                    optionDisplayName = "Twitter News";
                    optionDescription = "Blade & Soul and Blade & Soul Ops's tweets channel.";
                    optionEmbedData = [
                        {
                            'name': "Channel Name",
                            'value': settingTwitterChannelText,
                        },
                    ];
                break;

                case "koldrak":
                    if(query[1]){
                        let settingKoldrakChannel;

                        if(query[1] === "disable"){
                            settingKoldrakChannel = null;  
                        }else{
                            let channelId = getMentionedChannelId(query[1]);

                            settingKoldrakChannel = channelId;  
                            settingKoldrakChannelText = "<#"+channelId+">";
                        };

                        // update the database
                        this.client.emit('notificationKoldrakChange', msg.guild.id, settingKoldrakChannel);

                        changed = true;
                    };

                    if(!changed){
                        if(guildSettings){
                            if(guildSettings.settings.koldrak && guildSettings.settings.koldrak !== null){
                                settingKoldrakChannelText = "<#"+guildSettings.settings.koldrak+">";
                            }
                        }  
                    };

                    optionDisplayName = "Koldrak's Lair Access";
                    optionDescription = "Koldrak's Lair Access Notification.";
                    optionEmbedData = [
                        {
                            'name': "Channel Name",
                            'value': settingKoldrakChannelText,
                        },
                    ];
                break;

                case "gate":
                    let settingGateChannel = null;
                    let settingGateFollowupChannel = null;
                    let settingGateRole = null;
                    if(query[1]){
                        if(query[1] === "disable"){
                            settingGateChannel = null;  
                        }else{
                            let channelId = getMentionedChannelId(query[1]);

                            settingGateChannel = channelId;  
                            settingGateChannelText = "<#"+channelId+">";
                        };

                        changed = true;
                    };

                    if(query[2]){
                        if(query[2] === "disable"){
                            settingGateFollowupChannel = null;  
                        }else{
                            let channelId = getMentionedChannelId(query[2]);

                            settingGateFollowupChannel = channelId;  
                            settingGateFollowupChannelText = "<#"+channelId+">";
                        };

                        changed = true;
                    };

                    if(query[3]){
                        if(query[3] === "disable"){
                            settingGateRole = null;  
                        }else{
                            let roleId = getMentionedRoleId(query[3]);

                            settingGateRole = roleId;  
                            settingGateRoleText = "<@&"+roleId+">";
                        };

                        changed = true;
                    };

                    if(!changed){
                        if(guildSettings){
                            if(guildSettings.settings.member_gate.channel_id && guildSettings.settings.member_gate.channel_id !== null){
                                settingGateChannelText = "<#"+guildSettings.settings.member_gate.channel_id+">";
                            }
                            if(guildSettings.settings.member_gate.next && guildSettings.settings.member_gate.next !== null){
                                settingGateFollowupChannelText = "<#"+guildSettings.settings.member_gate.next+">";
                            }
                            if(guildSettings.settings.member_gate.role_id && guildSettings.settings.member_gate.role_id !== null){
                                settingGateRoleText = "<@&"+guildSettings.settings.member_gate.role_id+">";
                            }
                        }
                    };

                    optionDisplayName = "New Member Verification";
                    optionDescription = "New member varification channel and roles.";
                    optionEmbedData = [
                        {
                            'name': "Welcome Channel",
                            'value': settingGateChannelText
                        },
                        {
                            'name': "Follow-up Channel",
                            'value': settingGateFollowupChannelText
                        },
                        {
                            'name': "Member Role",
                            'value': settingGateRoleText
                        },
                    ];

                    if(changed){
                        // update the database
                        this.client.emit('newMemberChannelChange', msg.guild.id, {
                            channel_id: settingGateChannel,
                            role_id: settingGateRole,
                            next: settingGateFollowupChannel
                        });
                    };
                break;

                case 'joinmsg':
                    query.shift();
                    
                    let settingFollowupMessage = query.join(" ");
                    if(settingFollowupMessage.length !== 0){
                        if(settingFollowupMessage === "disable"){
                            settingFollowupMessage = null;
                        }else{
                            settingFollowupMessageText = settingFollowupMessage;
                        };

                        // update the database
                        this.client.emit('joinCustomMessageChange', msg.guild.id, settingFollowupMessage);

                        changed = true;
                    }

                    if(!changed){
                        if(guildSettings){
                            if(guildSettings.settings.join_message && guildSettings.settings.join_message !== null){
                                settingFollowupMessageText = guildSettings.settings.join_message;
                            }
                        }                        
                    }

                    optionDisplayName = "Join Message";
                    optionDescription = "Custom message after user used join command.";
                    optionEmbedData = [
                        {
                            'name': "Message",
                            'value': settingFollowupMessageText
                        },
                    ];
                break;
            };

            if(setting === "reset" || setting === "twitter" || setting === "koldrak" || setting === "gate" || setting === "joinmsg"){
                if(changed === true){
                    msgData = msg.guild.name+"'s setting for *"+optionDisplayName+"* has been changed.";
                }else{
                    msgData = msg.guild.name+"'s setting for *"+optionDisplayName+"*.";
                };
                embedData = {
                    'embed': {
                        'title': optionDisplayName,
                        'description': optionDescription,
                        'color': 16741688,
                        'fields': optionEmbedData
                    }
                }
            }
        }else{
            msgData = "You don't have the permission to use that command";
        };

        msg.channel.stopTyping();

        return msg.say(msgData, embedData);
    }
};