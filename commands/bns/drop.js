const { Command } = require("discord.js-commando");

const { mongoGetData, getGlobalSettings } = require("../../core");

module.exports = class LootCommand extends Command {
    constructor(client) {
        super(client, {
            name: "drop",
            aliases: ["loot"],
            group: "bns",
            memberName: "drop",
            description: "Get the dungeon info that containing said item drop",
            examples: ["drop <item name>", "drop naryu tablet"],
            args: [
                {
                    key: "item",
                    prompt: "What is the item called?",
                    type: "string"
                }
            ]            
        });    
    }

    async run(msg, {item}) {
        msg.channel.startTyping();
        
        // checking if the command disabled or not
        let globalSettings = await getGlobalSettings("drop");
        if(!globalSettings.status){
            msg.channel.stopTyping();

            return msg.say("This command is currently disabled.\nReason: "+globalSettings.message);
        };

        const start = Date.now();
        let end;
        let serveTime;

        let regx = new RegExp("("+item+"+)", "ig"); // regex for search

        // getting the data and pushing them into an array
        let dungeonData = await mongoGetData("dungeons",  {"rewards": {$all: [regx]}});

        // getting the dungeon name and formatting it
        let dropData = "";
        for(let i = 0; i < dungeonData.length; i++){
            dropData = dropData + ("\n- "+dungeonData[i].name+" ("+dungeonData[i].rewards.find(value => regx.test(value))+")");  
        }

        end = Date.now();
        serveTime = (end-start)/1000+'s';

        // result formatting
        let result = "Can't find any dungeon that drop **"+item+"**, please check and try again (Item name can't be abbreviated)";
        if(dropData !== ""){
            result = "Dungeon that contain **"+item+"** drop:"+dropData;
        };

        // filling up the embed data
        let embedData = {
            "embed": {
                "author": {
                    "name": "Dungeon Item Drop Search - "+item.replace(/(^|\s)\S/g, l => l.toUpperCase()),
                    "icon_url": "https://cdn.discordapp.com/emojis/551588918479290408.png?v=1"
                },
                "color": 16753920,
                "footer": {
                    "text": "Dungeon Item Drop - Served in "+serveTime
                },
                "description": result
            }
        }

        msg.channel.stopTyping();
        
        return msg.say(embedData);     
    }
};