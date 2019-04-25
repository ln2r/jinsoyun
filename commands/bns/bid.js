const { Command } = require("discord.js-commando");
const { mongoGetData, setCurrencyFormat } = require("../../core");
const dateformat = require("dateformat");

module.exports = class RemoveCustomRoleCommand extends Command {
    constructor(client) {
        super(client, {
            name: "bid",
            aliases: ["smartbid"],
            group: "bns",
            memberName: "bid",
            description: "Get a calculation how much you should bid for an item. (item price is in copper so 1g = 10000)\nYou can use item name if it's available.",
            examples: ["bid <player count> <item name/item price>","bid 12 moonstone", "bid 12 500"],
            guildOnly: true,
            args:[
                {
                    key: "playerCount",
                    prompt: "How many player are there (excluding offline and or left)?",
                    type: "integer"
                },
                {
                    key: "itemPrice",
                    prompt: "How much is it cost or what is the item called?",
                    type: "string"
                },
            ]
        });
    }

    async run(msg, {playerCount, itemPrice}) {
        msg.channel.startTyping();

        //console.debug("[soyun] [bid] playerCount value: "+playerCount);
        //console.debug("[soyun] [bid] itemPrice value: "+itemPrice);

        // removing "<>" if the user decided to used it
        playerCount = playerCount.toString().replace(/[<>]/g, ""); 
        itemPrice = itemPrice.replace(/[<>]/g, "");

        let dataLastUpdate = Date.now();
        let itemName = itemPrice;
        
        if(isNaN(itemPrice)){
            let regx = new RegExp("(?:^|\W)"+itemPrice+"+(?:$|\W)", "ig");
            let dbSearchQuery = {"name": regx}
            let itemData = await mongoGetData("items", dbSearchQuery);

            itemPrice = itemData[0].market[0].priceEach;
            dataLastUpdate = itemData[0].market[0].updated;
            itemName = itemData[0].name;
        }

        // smart bid algorithm thanks to BnSTools - https://bnstools.info/

        let selfBid = Math.floor(1 * itemPrice * ((playerCount - 1)/playerCount));
        let marketBid = Math.floor((1 * itemPrice * ((playerCount - 1)/playerCount)) * (1 - .05 * 1));

        //console.debug("[soyun] [bid] self: "+selfBid);
        //console.debug("[soyun] [bid] market: "+marketBid);

        let bidData = "**Max bid for the price of "+setCurrencyFormat(itemPrice)+"**\n"+
                    "- Keeping the item for yourself\n"+setCurrencyFormat(selfBid)+"\n"+
                    "- Sell to market\n"+setCurrencyFormat(marketBid);

        msg.channel.stopTyping();

        let embedData = {
            "embed":{
                "author": {
                    "name": "Smart Bid for "+itemName,
                    "icon_url": "https://cdn.discordapp.com/emojis/464036617531686913.png?v=1"
                },
                "description": bidData,
                "color": 16766720,
                "footer": {
                    "icon_url": "https://slate.silveress.ie/docs_bns/images/logo.png",
                    "text": "Powered by Silveress's BnS API - Last update: "+dateformat(dataLastUpdate, "UTC:dd-mm-yy @ HH:MM")+" UTC"
                }
            }
        }

        return msg.say(embedData);
    }
}