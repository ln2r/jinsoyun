const { Command } = require("discord.js-commando");
const dateformat = require("dateformat");

const { mongoGetData, getPriceStatus, setCurrencyFormat } = require("../../core");

module.exports = class MarketCommand extends Command {
    constructor(client) {
        super(client, {
            name: "market",
            aliases: ["mp", "f5"],
            group: "bns",
            memberName: "market",
            description: "Get item marketplace data. Use `<>` to get exact item match",
            examples: ["market item name", "market <item name>"],
            args: [
                {
                    key: "searchQuery",
                    prompt: "What is the item name?",
                    type: "string"
                }
            ]
        });    
    }

    async run(msg, { searchQuery }) {
        msg.channel.startTyping();

        let regx;

        let embedData = "";
        let msgData = "";
        let itemData = ""; 
        let itemImage = await mongoGetData("configs", {"_id": 0});
            itemImage = itemImage[0].not_found;  
            
        let dataLastUpdate = Date.now();
        let maxItemLength;

        // checking the search query
        if(searchQuery.match(/[<>]/g)){
            searchQuery = searchQuery.replace(/[<>]/g, ""); // removing the "<>" characters
            searchQuery = searchQuery.replace(/(^|\s)\S/g, l => l.toUpperCase());

            regx = new RegExp("(?:^|\W)"+searchQuery+"+(?:$|\W)", "ig"); // exact search           

            //console.debug("[soyun] [market] ["+msg.guild.name+"] exact search is used");
        }else{
            regx = new RegExp("("+searchQuery+"+)", "ig"); // rough search
            //console.debug("[soyun] [market] ["+msg.guild.name+"] rough search is used");
        }      
        
        //console.debug("[soyun] [market] ["+msg.guild.name+"] searchQuery value: "+searchQuery);
        //console.debug("[soyun] [market] ["+msg.guild.name+"] regx value: "+regx);

        let dbSearchQuery = {"name": regx};
        //console.debug("[soyun] [market] ["+msg.guild.name+"] dbSearchQuery value: "+JSON.stringify(dbSearchQuery))
       
        let marketData = [];
        let marketError = false;
        try{
            marketData = await mongoGetData("items", dbSearchQuery);
        }catch(err){
            marketError = true;
        };
        //let marketData = await mongoGetData("items", dbSearchQuery);

        //console.debug("[soyun] [market] ["+msg.guild.name+"] total result: "+marketData.length);

        if(!marketError){
            if(marketData.length === 0){
                itemData = "No Result found on **"+searchQuery+"**.\nPlease check your search and try again.";
            }else{
                itemImage = marketData[0].img;
                dataLastUpdate = marketData[0].updated;

                if(marketData.length > 5){
                    msgData = "Found **"+marketData.length+"** matching items, please use exact search to get more accurate result";
                    maxItemLength = 5;
                }else{
                    maxItemLength = marketData.length;
                }

                for(let i = 0; i < maxItemLength; i++){
                    let oldPrice = 0;
                    if(marketData[i].market[1].priceEach === null || marketData[i].market[1].priceEach === undefined){
                        oldPrice = 0;
                    }else{
                        oldPrice = marketData[i].market[1].priceEach;
                    }

                    let priceStatus = getPriceStatus(oldPrice, marketData[i].market[0].priceEach);

                    itemData = itemData + (
                        "**"+marketData[i].name+"** `"+marketData[i]._id+"`\n"+
                        "- Each: "+setCurrencyFormat(marketData[i].market[0].priceEach)+" `"+priceStatus+"`\n"+
                        "- Lowest: "+setCurrencyFormat(marketData[i].market[0].priceTotal)+" for "+marketData[i].market[0].quantity+"\n"
                    );
                }            
            }
            
            
        }else{
            itemData = "Unable to get result on **"+searchQuery+"**.\nPlease try to be more specific with your search and try again.";
        };

        embedData = {
            "embed": {
                "author": {
                    "name": "Marketplace - Search result of "+searchQuery.replace(/(^|\s)\S/g, l => l.toUpperCase()),
                    "icon_url": "https://cdn.discordapp.com/emojis/464036617531686913.png?v=1"
                },
                "description": itemData,
                "color": 16766720,
                "footer": {
                    "icon_url": "https://slate.silveress.ie/docs_bns/images/logo.png",
                    "text": "Powered by Silveress's BnS API - Last update: "+dateformat(dataLastUpdate, "UTC:dd-mm-yy @ HH:MM")+" UTC"
                },
                "thumbnail": {
                    "url": itemImage
                },
            }
        };

        msg.channel.stopTyping();

        return msg.say(msgData, embedData);
    }
};