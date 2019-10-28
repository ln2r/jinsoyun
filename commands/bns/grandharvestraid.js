const { Command } = require("discord.js-commando");
const dateformat = require("dateformat");

const { mongoGetData, getTimeDifference, getGlobalSettings } = require("../../core");

module.exports = class GrandHarvestCommand extends Command {
    constructor(client) {
        super(client, {
            name: "grandharvest",
            aliases: ["ghr", "grandharvestraid"],
            group: "bns",
            memberName: "grandharvest",
            description: "Get Grand Harvest Raid access time",
            examples: ["grandharvest"],
        });    
    }

    async run(msg) {
        msg.channel.startTyping();

        // checking if the command disabled or not
        let globalSettings = await getGlobalSettings("grandharvest");
        if(!globalSettings.status){
            msg.channel.stopTyping();

            return msg.say("This command is currently disabled.\nReason: "+globalSettings.message);
        };

        let timeData = await mongoGetData("challenges", {});
            timeData = timeData[0].grand_harvest_raid.time;

        let grandHarvestClosestTime = getTimeDifference(timeData);

        //console.debug("[soyun] [grand harvest raid] ["+msg.guild.name+"] time diffence data: "+JSON.stringify(grandHarvestClosestTime, null, "\t"));

        msg.channel.stopTyping();

        let embedData = {
            "embed": {
                "author": {
                    "name": "Grand Harvest Raid ("+timeData[grandHarvestClosestTime.time_index]+":00 UTC)",
                },
                "color": 8388736,
                "footer": {
                    "text": "Grand Harvest Raid - Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ HH:MM")+" UTC"
                },
                "description": "Available in "+grandHarvestClosestTime.time_difference_data[0]+" hour(s) and "+grandHarvestClosestTime.time_difference_data[1]+" minute(s)",
            }
        };
        return msg.say(embedData);
    }
};