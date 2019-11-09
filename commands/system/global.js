const { Command } = require("discord.js-commando");

const { getGuildSettings, getGlobalSettings } = require("../../core");

module.exports = class ResetNotificationCommand extends Command {
    constructor(client) {
        super(client, {
            name: "global",
            group: "system",
            memberName: "global",
            description: "Change bot global settings.",
            hidden: true,
            ownerOnly: true,
        });
    }

    async run(msg, args) {
        msg.channel.startTyping();

        let guildSettings = await getGuildSettings(msg.guild.id);
        let botPrefix;

        let optionDisplayStatus;
        let optionDisplayMessage;

        let settingData;

        if(guildSettings){
            botPrefix = guildSettings.settings.prefix;
        }else{
            botPrefix = "!";
        }

        let msgData = "";
        let embedData = {
            'embed': {
                'title': "Jinsoyun Bot - Global Settings",
                'description': "To configure use `"+botPrefix+"global system-name (enable/disable) message`. Examples:",
                'color': 16741688,
                'fields': [
                    {
                        'inline': true,
                        'name': "Annoucement",
                        'value': "Format: `"+botPrefix+"global twitter/reset/koldrak_announce disable/enable status message`\nExample: `"+botPrefix+"global twitter disable disabled for maintenance`"
                    },
                    {
                        'inline': true,
                        'name': "Commands",
                        'value': "Format: `"+botPrefix+"global command name disable/enable status message`\nExample: `"+botPrefix+"global daily disable disabled for maintenance`\nNote: To check full commands list which can be disabled use `"+botPrefix+"help`"
                    },
                ]
            }
        };

        let query = args.split(" ");
        let changed = false;

        let system = query[0];

        let globalSetting = await getGlobalSettings(system);

        let valid = (
            system === "koldrak_announce" || 
            system === "reset" || 
            system === "twitter" ||
            system === "daily" ||
            system === "drop" ||
            system === "dungeon" ||
            system === "event" ||
            system === "grandharvest" ||
            system === "koldrak" ||
            system === "market" ||
            system === "shackedisle" ||
            system === "weekly" ||
            system === "who" ||
            system === "nickname" ||
            system === "radd" ||
            system === "raddonce" ||
            system === "reg" ||
            system === "rmessage" ||
            system === "rremove" ||
            system === "setting"
        )? true : false;

        if(valid && query[1]){
            let setting = ((query[1] === "disable")? false : true);
            let message = "";

            if(query.length > 2){
                query.splice(0, 2);
                message = query.join(" ");
            }

            settingData = {
                reset:{
                    status : setting,
                    message: message
                }
            }

            // checking the query type and updating the change
            if(system === "koldrak_announce" || system === "reset" || system === "twitter"){       
                changed = true;
                this.client.emit('globalSettingChange', "global", "announce", settingData);
            }else{            
                changed = true;
                this.client.emit('globalSettingChange', "global", "commands", settingData);
            }
        }

        // changing the message data when the query is valid
        if(valid){
            if(changed){
                msgData = "Setting for *"+system+"* has been changed.";

                embedData = "";
            }else{
                // filling the embed display info
                optionDisplayStatus = (globalSetting.status)? "Enabled" : "Disabled";
                optionDisplayMessage = (globalSetting.message === "")? "*No Message Set*" : globalSetting.message;

                msgData = "Setting for *"+system+"*.";

                embedData = {
                    'embed': {
                        'title': system.replace(/(^|\s)\S/g, l => l.toUpperCase()),
                        'color': 16741688,
                        'fields': [
                            {
                                'name': "Configuration",
                                'value': "Status: "+optionDisplayStatus+" \nMessage: "+optionDisplayMessage,
                            },
                        ]
                    }
                }
            }
        }

        msg.channel.stopTyping();
        return msg.say(msgData, embedData);
    }
};