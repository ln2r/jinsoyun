const { Command } = require("discord.js-commando");
const dateformat = require("dateformat");

const { getWeeklyData, setArrayDataFormat, setRewardsDataFormat, getGlobalSettings } = require("../../core");

module.exports = class WeeklyCommand extends Command {
    constructor(client) {
        super(client, {
            name: "weekly",
            aliases: ["wc"],
            group: "bns",
            memberName: "weekly",
            description: "Get weekly challenges quest list and rewards",
            examples: ["weekly", "wc"],
        });    
    }

    async run(msg) {
        msg.channel.startTyping();

        // checking if the command disabled or not
        let globalSettings = await getGlobalSettings("weekly");
        if(!globalSettings.status){
            msg.channel.stopTyping();

            return msg.say("This command is currently disabled.\nReason: "+globalSettings.message);
        };

        const start = Date.now();
        let end;
        let serveTime;

        let weeklyData = await getWeeklyData();
        let weeklyRewards = setRewardsDataFormat(weeklyData.rewards);

        end = Date.now();
        serveTime = (end-start)/1000+'s';

        let embedData = {
            "embed": {
                "author":{
                    "name": "Weekly Challenges",
                    "icon_url": "https://cdn.discordapp.com/emojis/464038094258307073.png?v=1"
                },
                "color": 15025535,
                "footer": {
                    "text": "Weekly Challenges - Served in "+serveTime
                },
                "fields":[
                    {
                       "name": "Completion Rewards",
                       "value":  setArrayDataFormat(weeklyRewards, "", true)
                    },
                    {
                        "name": "Quests/Dungeons List (Location - Quest)",
                        "value": setArrayDataFormat(weeklyData.quests, "", true)					
                    }
                ]
            }
        };

        msg.channel.stopTyping();

        return msg.say(embedData);
    }
};