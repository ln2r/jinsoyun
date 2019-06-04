const { Command } = require("discord.js-commando");
const dateformat = require("dateformat");
const { mongoGetData } = require("../../core");

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
        let msgData = "";
        let embedData;

        let authorPermission = msg.channel.permissionsFor(msg.author).has("MANAGE_ROLES", false);
        if(authorPermission){
            let guildsData = await mongoGetData("guilds", {guild: msg.guild.id});
            let guildSettings = guildsData[0].settings;

            let botPrefix = guildSettings.prefix || "!";
            
            embedData = {
                'embed': {
                    'title': "Jinsoyun Bot - Available Settings",
                    'description': "To configure use `"+botPrefix+"setting option value`.\nExamples:",
                    'color': 16741688,
                    'fields': [
                        {
                            'inline': true,
                            'name': "Twitter News",
                            'value': "`"+botPrefix+"setting twitter #channel-name`"
                        },
                        {
                            'inline': true,
                            'name': "Challanges Quests",
                            'value': "`"+botPrefix+"setting twitter #channel-name`"
                        },
                        {
                            'inline': false,
                            'name': "New Member Verification",
                            'value': "`"+botPrefix+"setting gate #welcome-channel #follow-up-channel @role-name`"
                        }
                    ]
                }
            };    

            if(guildSettings){
                let query = args.split(" ");

                let setting = query[0];
                let value = query[1];
                let optionDisplayName;
                let optionDescription;
                let optionEmbedData;

                switch(setting){
                    case "reset":
                        optionDisplayName = "Challenge Quests";
                        optionDescription = "Challange quests (daily, weekly) reset and event summary notification.";
                        optionEmbedData = [
                            {
                                'name': "Channel Name",
                                'value': "#CHANNEL-NAME-HERE",
                            },
                        ];
                    break;

                    case "twitter":
                        optionDisplayName = "Twitter News";
                        optionDescription = "Blade & Soul and Blade & Soul Ops's tweets channel.";
                        optionEmbedData = [
                            {
                                'name': "Channel Name",
                                'value': "#CHANNEL-NAME-HERE",
                            },
                        ];
                    break;

                    case "gate":
                        optionDisplayName = "New Member Verification";
                        optionDescription = "New member varification channel and roles.";
                        optionEmbedData = [
                            {
                                'name': "Welcome Channel",
                                'value': "#CHANNEL-NAME-HERE"
                            },
                            {
                                'name': "Follow-up Channel",
                                'value': "#CHANNEL-NAME-HERE",
                            },
                            {
                                'name': "Member Role",
                                'value': "`@ROLE_NAME`",
                            },
                        ];
                    break;

                    case "show":
                    break;
                };

                if(setting === "reset" || setting === "twitter" || setting === "gate"){
                    msgData = msg.guild.name+"'s setting for *"+optionDisplayName+"* has been changed.";
                    embedData = {
                        'embed': {
                            'title': optionDisplayName,
                            'description': optionDescription,
                            'color': 16741688,
                            'fields': optionEmbedData
                        }
                    }
                }
                console.log(query);
            };
        }else{
            msgData = "You don't have the permission to use that command";
        };

        msg.channel.stopTyping();

        return msg.say(msgData, embedData);
    }
};