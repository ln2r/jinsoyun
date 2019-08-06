const { Command } = require("discord.js-commando");
const dateformat = require("dateformat");

const { getDayValue, getDailyData, setArrayDataFormat, setQuestViewFormat } = require("../../core");

module.exports = class DailyCommand extends Command {
    constructor(client) {
        super(client, {
            name: "daily",
            aliases: ["dc"],
            group: "bns",
            memberName: "daily",
            description: "Get daily challenges quest list and rewards",
            examples: ["daily", "daily <day>", "daily tomorrow", "daily monday"],
        });    
    }

    async run(msg, args) {
        msg.channel.startTyping();

        args = args.toLowerCase();

        let dayQuery = "";

        //console.debug("[soyun] [daily] ["+msg.guild.name+"] current day: "+getDayValue(Date.now(), "now"));
        //console.debug("[soyun] [daily] ["+msg.guild.name+"] tomorrow is: "+getDayValue(Date.now(), "tomorrow"));
        //console.debug("[soyun] [daily] ["+msg.guild.name+"] user query is: "+args);

        
        if(args === ""){
            dayQuery = getDayValue(Date.now(), "now");
        }else if(args === "tomorrow" || args === "tmr"){
            dayQuery = getDayValue(Date.now(), "tomorrow");
        }else{
            if(args === "mon" || args === "monday"){dayQuery = "Monday";};
            if(args === "tue" || args === "tuesday"){dayQuery = "Tuesday";};
            if(args === "wed" || args === "wednesday"){dayQuery = "Wednesday";};
            if(args === "thu" || args === "thursday"){dayQuery = "Thursday";};
            if(args === "fri" || args === "friday"){dayQuery = "Friday";};
            if(args === "sat" || args === "saturday"){dayQuery = "Saturday";};
            if(args === "sun" || args === "sunday"){dayQuery = "Sunday";};
        }

        //console.debug("[soyun] [daily] dayQuery value: "+dayQuery);

        let dailyData = await getDailyData(dayQuery);
        let embedData;
        let msgData;
        if(dailyData){
            embedData = {
                "embed": {
                    "author":{
                        "name": "Daily Challenges - "+dayQuery,
                        "icon_url": "https://cdn.discordapp.com/emojis/464038094258307073.png?v=1"
                    },
                    "color": 15025535,
                    "footer": {
                        "text": "Daily Challenges - Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ HH:MM")+" UTC"
                    },
                    "fields":[
                        {
                        "name": "Completion Rewards",
                        "value":  setArrayDataFormat(dailyData.rewards, "", true)
                        },
                        {
                            "name": "Quests/Dungeons List (Location - Quest)",
                            "value": setQuestViewFormat(dailyData.quests, "", true)							
                        }
                    ]
                }
            }
        }else{
            msgData = "I can't find daily data under ***"+args+"***, please check your command and try again."
        };

        msg.channel.stopTyping();

        return msg.say(msgData, embedData);
    }
};