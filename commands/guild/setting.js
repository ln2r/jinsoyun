const { Command } = require("discord.js-commando");
const dateformat = require("dateformat");
const { getGuildSettings, getMentionedChannelId, getMentionedRoleId, getGlobalSettings, getAuthorPermission } = require("../../core");

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

        let subQuery = ["reset", "twitter", "koldrak", "gate", "joinmsg", "show", "admin"];
        let msgData = "";
        let embedData;

        // checking permission
        if(await getAuthorPermission(msg, msg.guild.id)){
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
                            'name': "Twitter News",
                            'value': "Change: `"+botPrefix+"setting twitter #channel-name`\nDisable: `"+botPrefix+"setting twitter disable`"
                        },
                        {
                            'name': "Koldrak's Lair Access",
                            'value': "Change: `"+botPrefix+"setting koldrak #channel-name`\nDisable: `"+botPrefix+"setting koldrak disable`"
                        },
                        {
                            'name': "Challenge Quests and Event Summary",
                            'value': "Change: `"+botPrefix+"setting reset #channel-name`\nDisable: `"+botPrefix+"setting reset disable`"
                        },
                        {
                            'name': "New Member Verification",
                            'value': "Change: `"+botPrefix+"setting gate #welcome-channel #follow-up-channel @role-name`\nDisable: `"+botPrefix+"setting gate disable disable disable`\nNote: You can just replace one of them to `disable` if you want that feature disabled (like the follow-up or auto role assignment)."
                        },
                        {
                            'name': "Join Command Custom Message",
                            'value': "Change: `"+botPrefix+"setting joinmsg Your message here.`\nDisable: `"+botPrefix+"setting joinmsg disable `\nNote: If you want to mention the message author use MESSAGE_AUTHOR, and SERVER_NAME when you want to add the server name."
                        },
                        {
                            'name': "Bot Admin Roles",
                            'value': "Change: `"+botPrefix+"setting admin @mentioned-role.`\nDisable: `"+botPrefix+"setting admin disable `\nNote: Guild/Server owner will always have permission regardles having the roles or not."
                        }
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
            let settingAdminRoleText = ["*No Role Set*"];

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

                case "show":
                    if(guildSettings){
                        // reset notification
                        if(guildSettings.settings.quest_reset && guildSettings.settings.quest_reset !== null){
                            settingResetChannelText = "<#"+guildSettings.settings.quest_reset+">";
                        }

                        // twitter
                        if(guildSettings.settings.twitter && guildSettings.settings.twitter !== null){
                            settingTwitterChannelText = "<#"+guildSettings.settings.twitter+">";
                        }

                        // koldrak's lair
                        if(guildSettings.settings.koldrak && guildSettings.settings.koldrak !== null){
                            settingKoldrakChannelText = "<#"+guildSettings.settings.koldrak+">";
                        }

                        // new member gate
                        if(guildSettings.settings.member_gate.channel_id && guildSettings.settings.member_gate.channel_id !== null){
                            settingGateChannelText = "<#"+guildSettings.settings.member_gate.channel_id+">";
                        }
                        if(guildSettings.settings.member_gate.next && guildSettings.settings.member_gate.next !== null){
                            settingGateFollowupChannelText = "<#"+guildSettings.settings.member_gate.next+">";
                        }
                        if(guildSettings.settings.member_gate.role_id && guildSettings.settings.member_gate.role_id !== null){
                            settingGateRoleText = "<@&"+guildSettings.settings.member_gate.role_id+">";
                        }

                        // join command custom message
                        if(guildSettings.settings.join_message && guildSettings.settings.join_message !== null){
                            settingFollowupMessageText = guildSettings.settings.join_message;
                        }
                    } 

                    optionDisplayName = "Current Guild's Settings";
                    optionDescription = "List of current guild's settings, use `"+botPrefix+"set` to see the options.";
                    optionEmbedData = [
                        {
                            'name': "Reset",
                            'value': settingResetChannelText
                        },
                        {
                            'name': "Twitter",
                            'value': settingTwitterChannelText
                        },
                        {
                            'name': "Koldrak",
                            'value': settingKoldrakChannelText
                        },
                        {
                            'name': "New Member Verification",
                            'value': "Welcome Channel: "+settingGateChannelText+"\nFollow-up Channel: "+settingGateFollowupChannelText+"\nMember Role: "+settingGateRoleText
                        },
                        {
                            'name': "Join Command Custom Message",
                            'value': settingFollowupMessageText
                        },
                    ];
                break;

                case 'admin':
                    query.shift();
                    let settingAdminRoles = query;

                    if(settingAdminRoles.length !== 0){
                        if(settingAdminRoles[0] === "disable"){
                            settingAdminRoles = null;
                        }else{
                            settingAdminRoleText = []; // emptying the array

                            for(let i=0; i<settingAdminRoles.length; i++){
                                settingAdminRoleText.push(settingAdminRoles[i]);
                                settingAdminRoles[i] = getMentionedRoleId(settingAdminRoles[i]);
                            }
                        };

                        // update the database
                        this.client.emit('adminRolesChange', msg.guild.id, settingAdminRoles);

                        changed = true;
                    }

                    if(!changed){
                        if(guildSettings){
                            if(guildSettings.settings.admin_roles && guildSettings.settings.admin_roles[0] !== null){
                                settingAdminRoleText = []; // emptying the array

                                for(let i=0; i<guildSettings.settings.admin_roles.length; i++){
                                    settingAdminRoleText.push("<@&"+guildSettings.settings.admin_roles[i]+">");
                                }
                            }
                        }                        
                    }
                    
                    optionDisplayName = "Bot Admin Roles";
                    optionDescription = "List of admin roles who can modified bot's settings";
                    optionEmbedData = [
                        {
                            'name': "Roles",
                            'value': settingAdminRoleText.join(", ")
                        }
                    ];
                    
                break;
            };

            if(subQuery.includes(setting)){
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