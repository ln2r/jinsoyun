const { Command } = require("discord.js-commando");
const dateformat = require("dateformat");

const { mongoGetData, setArrayDataFormat, getGlobalSettings } = require("../../core");

module.exports = class DungeonCommand extends Command {
    constructor(client) {
        super(client, {
            name: "dungeon",
            aliases: ["dg", "guide"],
            group: "bns",
            memberName: "dungeon",
            description: "Get the dungeon info and it's guide if available",
            examples: ["dungeon <dungeon name>", "dungeon naryu sanctum"],
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

        // checking if the command disabled or not
        let globalSettings = await getGlobalSettings("dungeon");
        if(!globalSettings.status){
            msg.channel.stopTyping();

            return msg.say("This command is currently disabled.\nReason: "+globalSettings.message);
        };

        let regx = new RegExp("("+dungeon+"+)", "ig"); // doing rough search
        let dbSearchQuery = {"name": regx};
        let dungeonsData = await mongoGetData("dungeons", dbSearchQuery);
            dungeonsData = dungeonsData[0];
        
        let embedData;
        let msgData = "";
        
        if(dungeonsData){
            // formatting 
            let apInfo = "*Unspecified*";
            let apEasy = (dungeonsData.attackPower.easy === 0)? "" : "Easy: "+dungeonsData.attackPower.easy+"+ ";
            let apNormal = (dungeonsData.attackPower.normal === 0)? "" : "Normal: "+dungeonsData.attackPower.normal+"+ ";
            let apHard = (dungeonsData.attackPower.hard === 0)? "" : "Hard: "+dungeonsData.attackPower.hard+"+ ";

            if(apEasy !== "" || apNormal !== "" || apHard !== ""){
                apInfo = apEasy+apNormal+apHard;
            }

            let instanceType;
            switch(dungeonsData.type){
                case 6:
                    instanceType = "6 Players";
                break;
                case 12:
                    instanceType = "12 Players";
                break;
                case 1:
                    instanceType = "Solo Instance";
                break;
                default:
                    instanceType = "Unspecified";
                break;
            }

            let guidesData = [];
            if(dungeonsData.guides.length !== 0){
                for(let i=0;i<dungeonsData.guides.length;i++){
                    guidesData.push("["+dungeonsData.guides[i].author+"]("+dungeonsData.guides[i].url+")")
                }
            }

            let weaponSuggestion = (dungeonsData.weapon === "")? "*Unspecified Weapon*": dungeonsData.weapon;

            // filling up the embed data
            embedData = {
                "embed": {
                    "author": {
                        "name": "Dungeon Info - "+dungeon.replace(/(^|\s)\S/g, l => l.toUpperCase())+" ("+instanceType+")",
                        "icon_url": "https://cdn.discordapp.com/emojis/463569668045537290.png?v=1"
                    },
                    "color": 10040319,
                    "footer": {
                        "text": "Dungeon Data - Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ HH:MM")+" UTC"
                    },
                    "fields":[
                        {
                            "name": "Entry Requirements",
                            "value": setArrayDataFormat(dungeonsData.requirements, "- ", true)
                        },
                        {
                            "name": "Recommended Attack Power",
                            "value": apInfo
                        },
                        {
                            "name": "Cross-Server Matching Weapon",
                            "value": weaponSuggestion
                        },                    
                        {
                            "name": "Guides",
                            "value": setArrayDataFormat(guidesData, "- ", true)
                        },
                        {
                            "name": "Rewards",
                            "value": setArrayDataFormat(dungeonsData.rewards, "- ", true)
                        },
                    ]
                }
            }

            msg.channel.stopTyping();
        }else{
            msgData = "I can't find dungeon data under ***"+dungeon+"***, please check your command and try again.";
            msg.channel.stopTyping();
        }
            
        return msg.say(msgData, embedData);       
    }
};