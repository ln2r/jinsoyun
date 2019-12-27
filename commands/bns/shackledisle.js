const { Command } = require("discord.js-commando");
const dateformat = require("dateformat");

const { mongoGetData, getTimeDifference, getGlobalSettings } = require("../../core");

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

        // checking if the command disabled or not
        let globalSettings = await getGlobalSettings("shackledisle");
        if(!globalSettings.status){
            msg.channel.stopTyping();

            return msg.say("This command is currently disabled.\nReason: "+globalSettings.message);
        };

        let timeData = await mongoGetData("challenges_", {name: "Shackled Isle"});
            timeData = timeData[0].time;

        let brModeClosestTime = getTimeDifference(timeData);

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
};