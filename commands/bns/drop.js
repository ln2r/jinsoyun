const { Command } = require("discord.js-commando");
const dateformat = require("dateformat");

const { mongoGetData } = require("../../core");

module.exports = class LootCommand extends Command {
    constructor(client) {
        super(client, {
            name: "drop",
            aliases: ["loot"],
            group: "bns",
            memberName: "drop",
            description: "Get the dungeon info that containing said item drop",
            examples: ["drop <item name>", "drop naryu tablet"],
            hidden: true, // Remove on stable
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

        // query example
        // {"rewards.common": { $all: [/(core)/ig] } }

        //console.debug("[soyun] [drop] ["+msg.guild.name+"] query: "+item);

        let regx = new RegExp("("+item+"+)", "ig"); // regex for search

        // array of query to check rewards for common, normal and hard type rewards
        // query example
        // {"rewards.common": { $all: [/(core)/ig] } }
        let dbQuery = [
            {
                "rewards.common": {$all: [regx]}
            }, 
            {
                "rewards.normal": {$all: [regx]}
            }, 
            {
                "rewards.hard": {$all: [regx]}
            },
        ]

        // getting the data and pushing them into an array
        let dungeonData = [];
        for(let i  = 0; i < dbQuery.length; i++){
            dungeonData.push(await mongoGetData("dungeons", dbQuery[i]));
        }

        // getting the dungeon name and formatting it
        let dropData = "";
        for(let i = 0; i < dungeonData.length; i++){
            //console.debug("[soyun] [drop] ["+msg.guild.name+"] result: "+dungeonData[i].length);
            if(dungeonData[i].length !== 0){
                for(let j = 0; j < dungeonData[i].length; j++){
                    let itemName;

                    //console.debug("[soyun] [drop] item name @ common: "+dungeonData[i][j].rewards.common.find(value => regx.test(value)));
                    //console.debug("[soyun] [drop] item name @ normal: "+dungeonData[i][j].rewards.normal.find(value => regx.test(value)));
                    //console.debug("[soyun] [drop] item name @ hard: "+dungeonData[i][j].rewards.hard.find(value => regx.test(value)));

                    switch(i){
                        case 0:
                            itemName = dungeonData[i][j].rewards.common.find(value => regx.test(value));
                        break;
                        case 1:
                            itemName = dungeonData[i][j].rewards.normal.find(value => regx.test(value));
                        break;
                        case 2:
                            itemName = dungeonData[i][j].rewards.hard.find(value => regx.test(value));
                        break;
                    };                    
                   
                    //console.debug("[soyun] [drop] ["+msg.guild.name+"] dungeon name: "+dungeonData[i][j].name+" ("+itemName+")");
                    dropData = dropData + ("\n- "+dungeonData[i][j].name+" ("+itemName+")");
                }
            }    
        }

        // result formatting
        let result = "Can't find any dungeon that drop **"+item+"**, please check and try again (Item name can't be abbreviated)";
        if(dropData !== ""){
            result = "Dungeon that contain **"+item+"** drop:"+dropData;
        };

        let embedData = {
            "embed": {
                "author": {
                    "name": "Dungeon Item Drop Search - "+item.replace(/(^|\s)\S/g, l => l.toUpperCase()),
                    "icon_url": "https://cdn.discordapp.com/emojis/551588918479290408.png?v=1"
                },
                "color": 16753920,
                "footer": {
                    "text": "Dungeon Item Drop - Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ HH:MM")+" UTC"
                },
                "description": result
            }
        }

        msg.channel.stopTyping();
        
        return msg.say(embedData);     
    }
};