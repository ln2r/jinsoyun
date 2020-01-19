const { Command } = require("discord.js-commando");
const dateformat = require("dateformat");

const { mongoGetData, getPriceStatus, setCurrencyFormat, getGlobalSettings } = require("../../core");

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

        // checking if the command disabled or not
        let globalSettings = await getGlobalSettings("market");
        if(!globalSettings.status){
            msg.channel.stopTyping();

            return msg.say("This command is currently disabled.\nReason: "+globalSettings.message);
        };

        let regx;

        let embedData = "";
        let msgData = "";
        let queryResult = ""; 
        let itemImage = await getGlobalSettings("not_found");
            
        let maxItemLength;

        const start = Date.now();
        let end;
        let serveTime;

        // checking the search query
        if(searchQuery.match(/[<>]/g)){
            searchQuery = searchQuery.replace(/[<>]/g, ""); // removing the "<>" characters
            searchQuery = searchQuery.replace(/(^|\s)\S/g, l => l.toUpperCase());

            regx = new RegExp("(?:^|\W)"+searchQuery+"+(?:$|\W)", "ig"); // exact search           

        }else{
            regx = new RegExp("("+searchQuery+"+)", "ig"); // rough search
        }      

        let dbSearchQuery = {"name": regx};
       
        let itemsData;
        let marketError = false;
        
        // getting the item data
        try{
            itemsData = await mongoGetData("items", dbSearchQuery);
        }catch(err){
            marketError = true;
        };
        

        // checking the market status
        if(!marketError){
            if(itemsData.length === 0){
                end = Date.now();
                serveTime = (end-start)/1000+'s';

                queryResult = "No Result found on **"+searchQuery+"**.\nPlease check your search and try again.";
            }else{
                itemImage = itemsData[0].img;
                
                // adding limit to the result
                if(itemsData.length > 5){
                    msgData = "Found **"+itemsData.length+"** matching items, please use exact search to get more accurate result. (`market <"+searchQuery+">`)";
                    maxItemLength = 5;
                }else{
                    maxItemLength = itemsData.length;
                }

                // populating the results
                for(let i = 0; i < maxItemLength; i++){
                    // getting the item price
                    let marketData = await mongoGetData("market", {id: itemsData[i].id}, {ISO: -1}, 2);

                    // checking if the item have market data
                    if(marketData.length !== 0){
                        // comparising the prices
                        let oldPrice = (marketData[1] !== undefined)? marketData[1].priceEach : 0;
                        let priceStatus = getPriceStatus(oldPrice, marketData[0].priceEach);
    
                        queryResult = queryResult + (
                            "**"+itemsData[i].name+"** `"+dateformat(marketData[0].ISO, "UTC:dd-mm-yy:HH.MM")+" UTC`\n"+
                            "- Each: "+setCurrencyFormat(marketData[0].priceEach)+" `"+priceStatus+"`\n"+
                            "- Lowest: "+setCurrencyFormat(marketData[0].priceTotal)+" for "+marketData[0].quantity+"\n"
                        );
                    }                  
                }
                
                end = Date.now();
                serveTime = (end-start)/1000+'s';
            } 
        }else{
            end = Date.now();
            serveTime = (end-start)/1000+'s';

            queryResult = "Unable to get result on **"+searchQuery+"**.\nPlease try to be more specific with your search and try again.";
        };

        embedData = {
            "embed": {
                "author": {
                    "name": "Marketplace - Search result of "+searchQuery.replace(/(^|\s)\S/g, l => l.toUpperCase()),
                    "icon_url": "https://cdn.discordapp.com/emojis/464036617531686913.png?v=1"
                },
                "description": queryResult,
                "color": 16766720,
                "footer": {
                    "icon_url": "https://slate.silveress.ie/docs_bns/images/logo.png",
                    "text": "Powered by Silveress's BnS API - Served in "+serveTime
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