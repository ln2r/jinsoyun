const { Command } = require("discord.js-commando");
const dateformat = require("dateformat");

const { getDayValue, getEventData, setArrayDataFormat, getGlobalSettings } = require("../../core");

module.exports = class BnsEventCommand extends Command {
    constructor(client) {
        super(client, {
            name: "event",
            group: "bns",
            memberName: "event",
            description: "Get current event summary.",
            examples: ["event", "event <day>", "event tomorrow", "event monday"],
        });    
    }

    async run(msg, args) {
        msg.channel.startTyping();

        // checking if the command disabled or not
        let globalSettings = await getGlobalSettings("event");
        if(!globalSettings.status){
            msg.channel.stopTyping();

            return msg.say("This command is currently disabled.\nReason: "+globalSettings.message);
        };

        args = args.toLowerCase();

        let dayQuery = "";
        
        if(args === ""){
            dayQuery = getDayValue(Date.now(), "now");
        }else if(args === "tomorrow" || args === "tmr"){
            dayQuery = getDayValue(Date.now(), "tomorrow");
        }else{
            if(args === "mon" || args === "monday"){dayQuery = "Monday"};
            if(args === "tue" || args === "tuesday"){dayQuery = "Tuesday"};
            if(args === "wed" || args === "wednesday"){dayQuery = "Wednesday"};
            if(args === "thu" || args === "thursday"){dayQuery = "Thursday"};
            if(args === "fri" || args === "friday"){dayQuery = "Friday"};
            if(args === "sat" || args === "saturday"){dayQuery = "Saturday"};
            if(args === "sun" || args === "sunday"){dayQuery = "Sunday"};
        };

        let eventData = await getEventData(dayQuery);
        let embedData;
        let msgData = "";

        if(eventData){
            embedData = {
                "embed": {
                    "author":{
                        "name": "Current Event - "+dayQuery,
                        "icon_url": "https://cdn.discordapp.com/emojis/479872059376271360.png?v=1"
                    },
                    "title": eventData.name,
                    "url": eventData.url,
                    "description": "**Duration**: "+eventData.duration+"\n"+
                                    "**Redemption Period**: "+eventData.redeem+"\n"+
                                    "**Event Item**: "+setArrayDataFormat(eventData.rewards.items, "- ", true)+"\n"+
                                    "**What to do**: "+setArrayDataFormat(eventData.todo, "- ", true)+"\n"+
                                    "**Redeemable Event**: "+eventData.lastEvent+" ("+eventData.lastEventRedeem+")",
                    "color": 1879160,
                    "footer": {
                        "icon_url": "https://static.bladeandsoul.com/img/global/nav-bs-logo.png",
                        "text": "Blade & Soul Event - Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ HH:MM")+" UTC"
                    },
                    "fields":[
                        {
                            "name": "Quests List",
                            "value":  setArrayDataFormat(eventData.quests, "", true)							
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