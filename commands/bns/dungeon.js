const { Command } = require("discord.js-commando");
const dateformat = require("dateformat");

const { mongoGetData, setArrayDataFormat} = require("../../core");

module.exports = class DungeonCommand extends Command {
    constructor(client) {
        super(client, {
            name: "dungeon",
            aliases: ["dg", "guide"],
            group: "bns",
            memberName: "dungeon",
            description: "Get the dungeon info and it's guide if available",
            examples: ["dungeon <dungeon name>", "dungeon naryu sanctum"],
            hidden: true, // Remove on stable
            args: [
                {
                    key: "dungeon",
                    prompt: "What is the dungeon called?",
                    type: "string"
                }
            ]            
        });    
    }

    async run(msg, {dungeon}) {
        msg.channel.startTyping();

        let regx = new RegExp("("+dungeon+"+)", "ig"); // doing rough search
        let dbSearchQuery = {"name": regx}
        let dungeonData = await mongoGetData("dungeons", dbSearchQuery);
            dungeonData = dungeonData[0];

        if(dungeonData === null){
            msg.channel.stopTyping();
            return msg.say("I can't find the dungeon you are looking for, please check and try again (dungeon name need to be it's full name)");
        }else{
            let dungeonType;    

            switch(dungeonData.type){
                case 12:
                    dungeonType = "12 Players"
                break;
                case 6:
                    dungeonType = "6 Players"
                break;
                case 1:
                    dungeonType = "Solo Instance"
                break;
            }
            // empty rewards data handler
            let rewardsCommon = "";
            let rewardsNormal = "";
            let rewardsHard = "";

            // handling the guide data
            function getGuideData(data){
                if(data === "" || data === null || data === undefined){
                    return "-";
                }

                let guideData = [];
                for(let i = 0; i < data.length; i++){
                    guideData.push("["+data[i].author+"]("+data[i].url+")");
                }

                return guideData.join(", ");
            }
            //console.debug("[soyun] [dungeon] ["+msg.guild.name+"] query: "+dungeon);
            //console.debug("[soyun] [dungeon] ["+msg.guild.name+"] common first data: "+dungeonData.rewards.common[0]);
            //console.debug("[soyun] [dungeon] ["+msg.guild.name+"] normal first data: "+dungeonData.rewards.normal[0]);
            //console.debug("[soyun] [dungeon] ["+msg.guild.name+"] hard first data: "+dungeonData.rewards.hard[0]);

            if(dungeonData.rewards.common[0] != ""){
                rewardsCommon = "\n**Common**"+setArrayDataFormat(dungeonData.rewards.common, "- ", true)+"\n\u200B";   
            }

            if(dungeonData.rewards.normal[0] != ""){
                rewardsNormal = "\n**Normal**"+setArrayDataFormat(dungeonData.rewards.normal, "- ", true)+"\n\u200B";   
                                
            }
            
            if(dungeonData.rewards.hard[0] != ""){
                rewardsHard = "\n**Hard**"+setArrayDataFormat(dungeonData.rewards.hard, "- ", true)+"\n\u200B";         
            }

            let embedData = {
                "embed": {
                    "author": {
                        "name": "Dungeon Info - "+dungeon.replace(/(^|\s)\S/g, l => l.toUpperCase())+" ("+dungeonType+")",
                        "icon_url": "https://cdn.discordapp.com/emojis/463569668045537290.png?v=1"
                    },
                    "color": 10040319,
                    "footer": {
                        "text": "Dungeon Data - Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ HH:MM")+" UTC"
                    },
                    "fields":[
                        {
                            "name": "Recommended Attack Power",
                            "value": "Normal: "+dungeonData.attackPower.normal+"+  Hard: "+dungeonData.attackPower.hard+"+"
                        },
                        {
                            "name": "Entry Requirements",
                            "value": setArrayDataFormat(dungeonData.requirements, "- ", true)
                        },
                        {
                            "name": "Guide",
                            "value": getGuideData(dungeonData.guides)
                        },
                        {
                            "name": "Rewards",
                            "value": rewardsCommon + rewardsNormal + rewardsHard
                        },
                    ]
                }
            }
            msg.channel.stopTyping();
        
            return msg.say(embedData);
        }        
    }
}