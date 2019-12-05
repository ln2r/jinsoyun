const { Command } = require("discord.js-commando");
const dateformat = require("dateformat");

const { getDayValue, getDailyData, setArrayDataFormat, setRewardsDataFormat, getGlobalSettings } = require("../../core");

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

        // checking if the command disabled or not
        let globalSettings = await getGlobalSettings("daily");
        if(!globalSettings.status){
            msg.channel.stopTyping();

            return msg.say("This command is currently disabled.\nReason: "+globalSettings.message);
        };
        
        if(args === ""){
            dayQuery = getDayValue(Date.now(), "now");
        }else if(args === "tomorrow" || args === "tmr" || args === "t"){dayQuery = getDayValue(Date.now(), "tomorrow");            
        }else if(args === "mon" || args === "monday"){dayQuery = "Monday";
        }else if(args === "tue" || args === "tuesday"){dayQuery = "Tuesday";
        }else if(args === "wed" || args === "wednesday"){dayQuery = "Wednesday";
        }else if(args === "thu" || args === "thursday"){dayQuery = "Thursday";
        }else if(args === "fri" || args === "friday"){dayQuery = "Friday";
        }else if(args === "sat" || args === "saturday"){dayQuery = "Saturday";
        }else if(args === "sun" || args === "sunday"){dayQuery = "Sunday";
        }else{
            dayQuery = getDayValue(Date.now(), "now");
        }

        //console.debug("[soyun] [daily] dayQuery value: "+dayQuery);

        let dailyData = await getDailyData(dayQuery);
        let rewardsList = setRewardsDataFormat(dailyData.rewards);
        let embedData;
        let msgData = "";

        
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
                        "value":  setArrayDataFormat(rewardsList, "", true)
                        },
                        {
                            "name": "Quests/Dungeons List (Location - Quest)",
                            "value": setArrayDataFormat(dailyData.quests, "", true)							
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