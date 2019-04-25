const { Command } = require("discord.js-commando");
const dateformat = require("dateformat");

const { mongoGetData, getTimeDifference } = require("../../core");

module.exports = class ShackledIsleCommand extends Command {
    constructor(client) {
        super(client, {
            name: "shackledisle",
            aliases: ["br", "shackled", "isle", "battleroyale"],
            group: "bns",
            memberName: "shackledisle",
            description: "Get Shackled Isle access time",
            examples: ["shackledisle"],
        });    
    }

    async run(msg) {
        msg.channel.startTyping();

        let timeData = await mongoGetData("challenges", {});
            timeData = timeData[0].shackled_isle.time;

        let brModeClosestTime = getTimeDifference(timeData);

        //console.debug("[soyun] [shackled isle] ["+msg.guild.name+"] time diffence data: "+JSON.stringify(brModeClosestTime, null, "\t"));

        msg.channel.stopTyping();

        let embedData = {
            "embed": {
                "author": {
                    "name": "Battle Royale Shackled Isle ("+timeData[brModeClosestTime.time_index]+":00 UTC)",
                },
                "color": 8388736,
                "footer": {
                    "text": "Shackled Isle - Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ HH:MM")+" UTC"
                },
                "description": "Available in "+brModeClosestTime.time_difference_data[0]+" hour(s) and "+brModeClosestTime.time_difference_data[1]+" minute(s)",
            }
        }
        return msg.say(embedData);
    }
}