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
            hidden: true,
            ownerOnly: true,
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

        const start = Date.now();
        let end;
        let serveTime;

        let timeData = await mongoGetData("challenges", {});
            timeData = timeData[0].grand_harvest_raid.time;

        let grandHarvestClosestTime = getTimeDifference(timeData);

        msg.channel.stopTyping();
        end = Date.now();
        serveTime = (end-start)/1000+'s';

        let embedData = {
            "embed": {
                "author": {
                    "name": "Grand Harvest Raid ("+timeData[grandHarvestClosestTime.time_index]+":00 UTC)",
                },
                "color": 8388736,
                "footer": {
                    "text": "Grand Harvest Raid - Served in "+serveTime
                },
                "description": "Available in "+grandHarvestClosestTime.time_difference_data[0]+" hour(s) and "+grandHarvestClosestTime.time_difference_data[1]+" minute(s)",
            }
        };
        return msg.say(embedData);
    }
};