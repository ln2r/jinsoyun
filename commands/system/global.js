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

        let systems = ["koldrak_announce", "reset", "twitter", "daily", "drop", "dungeon", "event", "grandharvest", "shackedisle", "weekly", "who", "nickname", "radd", "raddonce", "rmessage", "rremove", "setting"];

        let system = query[0];
        let valid = systems.indexOf(system);

        let globalSetting = await getGlobalSettings(system);

        if(valid >= 0 && query[1]){
            let setting = ((query[1] === "disable")? false : true);
            let message = "";

            if(query.length > 2){
                query.splice(0, 2);
                message = query.join(" ");
            }

            switch(system){
                case 'koldrak_announce':
                    settingData = {
                        koldrak_announce:{
                            status: setting, 
                            message: message
                        }
                    }
                break;
                case 'reset':
                    settingData = {
                        reset:{
                            status: setting, 
                            message: message
                        }
                    }
                break;
                case 'twitter':
                    settingData = {
                        twitter:{
                            status: setting, 
                            message: message
                        }
                    }
                break;  
                
                case 'daily':
                    settingData = {
                        daily:{
                            status: setting, 
                            message: message
                        }
                    }
                break; 
                case 'drop':
                    settingData = {
                        drop:{
                            status: setting, 
                            message: message
                        }
                    }
                break; 
                case 'dungeon':
                    settingData = {
                        dungeon:{
                            status: setting, 
                            message: message
                        }
                    }
                break; 
                case 'event':
                    settingData = {
                        event:{
                            status: setting, 
                            message: message
                        }
                    }
                break; 
                case 'grandharvest':
                    valid = true;
                    settingData = {
                        grandharvest:{
                            status: setting, 
                            message: message
                        }
                    }
                break; 
                case 'market':
                    settingData = {
                        market:{
                            status: setting, 
                            message: message
                        }
                    }
                break; 
                case 'shackedisle':
                    settingData = {
                        shackedisle:{
                            status: setting, 
                            message: message
                        }
                    }
                break; 
                case 'weekly':
                    settingData = {
                        weekly:{
                            status: setting, 
                            message: message
                        }
                    }
                break; 
                case 'who':
                    settingData = {
                        who:{
                            status: setting, 
                            message: message
                        }
                    }
                break; 
                case 'nickname':
                    settingData = {
                        nickname:{
                            status: setting, 
                            message: message
                        }
                    }
                break; 
                case 'radd':
                    settingData = {
                        radd:{
                            status: setting, 
                            message: message
                        }
                    }
                break; 
                case 'raddonce':
                    settingData = {
                        raddonce:{
                            status: setting, 
                            message: message
                        }
                    }
                break; 
                case 'reg':
                    settingData = {
                        reg:{
                            status: setting, 
                            message: message
                        }
                    }
                break; 
                case 'rmessage':
                    settingData = {
                        rmessage:{
                            status: setting, 
                            message: message
                        }
                    }
                break; 
                case 'rremove':
                    settingData = {
                        rremove:{
                            status: setting, 
                            message: message
                        }
                    }
                break; 
                case 'setting':
                    settingData = {
                        setting:{
                            status: setting, 
                            message: message
                        }
                    }
                break; 
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
        if(valid >= 0){
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