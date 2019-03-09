const dotenv = require('dotenv').config();

const MongoClient = require('mongodb').MongoClient;
const Discord = require("discord.js");
const dateformat = require('dateformat');
const fetch = require('node-fetch');
const delay = require('delay');

let url = process.env.bot_mongodb_url;
let dbName = process.env.bot_mongodb_db_name;

// Exported function start here
module.exports = {

    /** 
     * getSiteData
     * Used to get JSON data from the 3rd party source
     * @param {String} address site address
     * @returns data fetched from site in JSON format
     * @example
     *  // Using the function locally
     *  module.exports.getSiteData("https://api.silveress.ie/bns/v3/items");
     *  
     *  // Using the function outside the file
     *  core.getSiteData("https://api.silveress.ie/bns/v3/items");
     */
    getSiteData: async function getSiteData(address) {
        return await fetch(address)
            .then((response) => {return response.json()})
            .catch((error) => {
                console.error('[core] [site-data] Error: '+error);
                return {"status": "error", error}
            })  
    },

    /** 
     * mongoGetData
     * Used to get data from MongoDB database
     * @param {String} collname data collection name
     * @param {Object} filter data filter
     * @returns data fetched from databse
     * @example
     *  // Using the function locally with id as it filter
     *  module.exports.mongoGetData("classes", {_id: 0});
     *  
     *  // Using the function outside the file without filter
     *  core.mongoGetData("classes");
     */
    mongoGetData: function mongoGetData(collname, filter) { 
        console.debug('[core] [mongo-fetch] collname: '+collname+', filter: '+JSON.stringify(filter));

        return MongoClient.connect(url, {useNewUrlParser: true})
                    .then(function(db) {
                        let dbo = db.db(dbName);
                        let collection = dbo.collection(collname);                        
                        return collection.find(filter).toArray()
                               .then(db.close());
                        
                    })
                    .then(function(items){                        
                        return items;                        
                    })                   
    },  

   /** 
     * classUpdate
     * Used to update the class data
     * @returns array of update status and time took to update
     */
    mongoClassDataUpdate: async function classUpdate () {
        let start = Date.now();
        

        console.debug('[core] [mongo-classes-update] Starting class data update');

        let resources = await module.exports.mongoGetData('classes', {});

        let classData = []; // class data storage
        let classCollectionName = "classes"; // the collection name
        let fetchTime = new Date();
            fetchTime = fetchTime.toISOString();
   
        let status;    
   
       for(let i = 0; i < resources.length; i++){
           console.debug('[core] [mongo-classes-update] Updating '+resources[i].name);                          
        
            // getting the attributes/element data
            let attributeSource = resources[i].sources[0].attributes;
            let attributesData = await module.exports.getSiteData(attributeSource);
   
            let skillsetSource = resources[i].sources[1].skillsets;
            let skillsetsData = [];
   
            // getting the skillset data for each attribute and store it in an array for later
            for(let j = 0; j < skillsetSource.length; j++){
                let data = await module.exports.getSiteData(skillsetSource[j]);
                    data = data.records;

                skillsetsData.push(data);
            }
   
            // formating the data
            let data = {
                "_id": i,
                "name": resources[i].name,
                "updated": fetchTime,
                "sources":[
                    {
                        "attributes": attributeSource,
                    },
                    {
                        "skillsets": skillsetSource,
                    },
                ],
                "attributes": attributesData,
                "skillsetA": skillsetsData[0],
                "skillsetB": skillsetsData[1],
            }
   
            // storing the data to an array for push later
            classData.push(data);
               
   
            // delay so the server wont get spammed, seems useless but nice touch
            await delay(500);
        }
   
        // pushing the array data to database
        MongoClient.connect(url, {useNewUrlParser: true}, function(err, db) {
            let dbo = db.db(dbName);
            dbo.listCollections({name: classCollectionName})
               .next(function(err, collinfo) {
                    if(err) throw err;
   
                    // checking if the collection is exist or not
                    // true: drop
                    // false: do nothing
                    if (collinfo) {
                        dbo.collection(classCollectionName).drop(function(err) {
                            if (err) console.error(err);
                        });
                    }
    
                    // inserting the data to the collection
                    dbo.collection(classCollectionName).insertMany(classData, function(err, res) {
                        if (err) throw err; 
                        db.close(); 
                    });
                    status = 'updated';                    
                });
            });
   
        let end = Date.now();
   
        let updateTime = (end-start)/1000+"s";
           
        console.debug('[core] [mongo-classes-update] Did class data update, updated: '+status+', time: '+updateTime);
    },
    
   /** 
     * itemsUpdate
     * Used to update the item data with it's market data
     * @returns array of update status and time took to update
     * 
     */
    mongoItemDataUpdate: async function itemsUpdate(){     
        let start = Date.now();

        var dataItems = await module.exports.getSiteData("https://api.silveress.ie/bns/v3/items");
        let marketItems = await module.exports.getSiteData("https://api.silveress.ie/bns/v3/market/na/current/lowest");

        if(dataItems.status == 'error' || dataItems.status == 'error'){
            console.error('[soyun] [item] api data fetch error, please check the log');
        }else{
            let itemsCollectionName = "items";
            MongoClient.connect(url, {useNewUrlParser: true}, function(err, db) {
                if (err) throw err;
                var dbo = db.db(dbName);

                dbo.collection(itemsCollectionName).find({}).toArray(function(err, result) {
                    if (err) throw err;
                    let dbData = result;
                               
                    let fetchTime = new Date();
                        fetchTime = fetchTime.toISOString();
                    var latestData = [];
                        
                    // formatting and merging the data between item data and the market data
                    for(let i = 0; i < marketItems.length; i++){
                        
                        // updating the and formating data
                        for(let j = 0; j < dataItems.length; j++){
                            // getting the data with same id
                            if(marketItems[i].id == dataItems[j].id){
                                let marketData = [{
                                        updated: marketItems[i].ISO,
                                        totalListings: marketItems[i].totalListings,
                                        priceEach: marketItems[i].priceEach,
                                        priceTotal: marketItems[i].priceTotal,
                                        quantity: marketItems[i].quantity,   
                                    }];

                                // merging the old market data with the new one
                                if(dbData != null){
                                    for(let k = 0; k < dbData.length; k++){
                                        if(marketItems[i].id == dbData[k]._id && dbData[k].market.length > 0){
                                            for(let l = 0; l < dbData[k].market.length; l++){
                                                marketData.push(dbData[k].market[l]);
                                            }
                                        }
                                    }
                                }    

                                let data = {
                                    _id: dataItems[j].id, 
                                    updated: fetchTime,
                                    firstAdded: dataItems[j].firstAdded,  
                                    name: dataItems[j].name, 
                                    itemTaxRate: dataItems[j].itemTaxRate, 
                                    img: dataItems[j].img, 
                                    rank: dataItems[j].rank, 
                                    merchantValue: dataItems[j].merchantValue, 
                                    characterLevel: dataItems[j].characterLevel, 
                                    class: dataItems[j].class,
                                    market: marketData,
                                }

                                latestData.push(data);
                            }
                        }            
                    }                   
                
                    dbo.listCollections({name: itemsCollectionName})
                        .next(function(err, collinfo) {
                            if(err) throw err;

                            // checking if the collection is exist or not
                            // true: drop
                            // false: do nothing                    
                            if (collinfo) {
                                dbo.collection(itemsCollectionName).drop(function(err) {
                                    if (err) throw err;
                                });                                    
                            }     
                        });

                    // inserting the data to the collection
                    dbo.collection(itemsCollectionName).insertMany(latestData, function(err, res) {  
                        if (err) throw err;    
                        db.close();                
                    });                
                });
                status = 'updated'; 
            }); 
        };
        let end = Date.now();
        let updateTime = (end-start)/1000+"s";

        console.debug('[core] [mongo-items-update] Did items data update, time: '+updateTime);
    },

    /** 
     * setArrayDataFormat
     * Used to format array data to list style data
     * @param {Array} data the array data
     * @param {String} symbol list symbol
     * @param {Boolean} newline add new line at every start of the item or not
     * @returns formatted list-like data
     */
    setArrayDataFormat: function formatArray(data, symbol, newline){
        if(data == null || data == undefined || data == ''){
            return '-'
        };

        let formattedData = '';

        if(newline == true){
            newline = '\n';
        }else{
            newline = '';
        };

        for(let i = 0; i < data.length; i++){
            // checking if the data in that index is empty or not
            if(data[i] == '' || data[i] == null){
                formattedData = formattedData
            }else{
                formattedData = formattedData + (newline + symbol + data[i]);
            };         
        };

        return formattedData;
    },

    /** 
     * setDataFormatString
     * Used to format String data/handling empty data
     * @param {String} data String data
     * @returns handled data
     */
    setDataFormatString: function formatDataString(data){
        if(data == '' || data == null || data == undefined){
            data = ''
        }

        return data;
    },

    /** 
     * setDataFormatString
     * Used to format Number data/handling empty data
     * @param {Number} data Number data
     * @returns handled data
     */
    setDataFormatNumb: function formatDataNumb(data){
        if(data == '' || data == null || data == undefined){
            data = 0;
        }

        return data;
    },

    /** 
     * getPriceStatus
     * Used to get price status compared to last one
     * @param {Number} priceOld old price
     * @param {Number} priceNew the latest price
     * @returns status price
     * @example
     * getPriceStatus(2000, 3000) // return +10🔼
     */
    getPriceStatus: function priceStatus(priceOld, priceNew){
        if(priceOld == null || priceOld == undefined){
            priceOld = 0;
        }

        let priceStatus = ("" + "0.00%") + "➖";
        if(priceNew != priceOld){
            let percentage = ((priceNew-priceOld)/ 100).toFixed(2);
            let symbol;
            let emoji;
            
            if(percentage < 0){
                symbol = "";
                emoji = "🔽";
            }else{
                symbol = "+";
                emoji = "🔼";
            }
    
            priceStatus = (symbol + percentage+"%") + emoji;
        }					
    
        return priceStatus;
    },

    /** 
     * setCurrencyFormat
     * Used to set the currency format to more readable version
     * Note: for this one the function using discord emoji as the symbol
     * @param {Number} Number nominal
     * @returns formatted data
     * @example
     * setCurrencyFormat(2000) // return 20s0c
     */
    setCurrencyFormat: function currencyFormat(Number){
        let str = Math.round(Number);
            str = str.toString()
        let len = str.length
        let gold = ""
        let silver = ""
        let copper = ""
    
        if(len > 4){
            gold = str.substring( 0 , len -4)+ "<:gold:463569669496897547>";
        }
        if(len > 2){
            silver = str.substring( len -2 ,len - 4 )+ "<:silver:463569669442371586>";
        }
        if(len > 0){
            copper = str.substring( len ,len -2 )+ "<:copper:463569668095868928>";
        } 
    
        let total = gold + silver + copper; 
        return total;
    },

    /** 
     * getDayValue
     * Used to get the text value of the current date
     * @param {Date} date date data
     * @param {String} type return type, currently only support 'now'
     * @returns day value
     * @example
     * getDayValue('Fri Mar 01 2019 14:49:58 GMT+0700', 'now') // return Friday
     */
    getDayValue: function getDay(date, type){
        let dayValue;

        if(type == 'now'){
            dayValue = dateformat(date, 'dddd', true);
        }else{
            date = new Date(date);
            date.setDate(date.getDate()+ 1);

            dayValue = dateformat(date, 'dddd', true);
        }
        
        return dayValue;
    },

    /** 
     * setQuestViewFormat
     * Used to set the quest data format (same like arrayDataFormat but with extra data)
     * @param {Object|Array} data the quest data
     * @param {String} symbol separator symbol
     * @param {Boolean} newline add new line or not
     * @returns formatted string data
     */
    setQuestViewFormat: function setQuestView(data, symbol, newline){
        let formattedData = '';

        if(newline == true){
            newline = '\n';
        }else{
            newline = '';
        }

        for(let i = 0; i < data.length; i++){
            // checking if the data in that index is empty or not
            if(data[i] == '' || data[i] == null){
                formattedData = formattedData
            }else{
                formattedData = formattedData + (newline + symbol + '**'+data[i].quest+'** - ' + data[i].location);
            }            
        }

        return formattedData
    },
    /**
     * getDailyData
     * Used to get specified daily data 
     * @param {String} day dddd formatted day value
     * @returns object, daily data (reward, quests list)
     */
    getDailyData: async function getDaily(day){
        let dailyData = await module.exports.mongoGetData('challenges', {});
            dailyData = dailyData[0];

        let eventDailyRewards = await module.exports.mongoGetData('events', {});
            eventDailyRewards = eventDailyRewards[0].rewards.daily;    

        let dailies;

        console.debug('[core] [daily] queried day: '+day);
        console.debug('[core] [daily] event rewards: '+eventDailyRewards);

        switch(day){
            case 'Monday':
                dailies = dailyData.monday;
            break;
            case 'Tuesday':
                dailies = dailyData.tuesday;
            break;
            case 'Wednesday':
                dailies = dailyData.wednesday;
            break;
            case 'Thursday':
                dailies = dailyData.thursday;
            break;
            case 'Friday':
                dailies = dailyData.friday;
            break;
            case 'Saturday':
                dailies = dailyData.saturday;
            break;
            case 'Sunday':
                dailies = dailyData.sunday;
            break;
        };

        // adding event daily challenges rewards to rewards list if it's not empty
        if(eventDailyRewards != ''){dailies.rewards.push(eventDailyRewards + ' (Event)')};

        return dailies;
    },

    /**
     * getWeeklyData
     * Used to get weekly quest data 
     * @returns object, weekly data (quests list, rewards)
     */
    getWeeklyData: async function getWeekly(){
        let weeklies = await module.exports.mongoGetData('challenges', {});
            weeklies = weeklies[0].weekly;

        let eventWeeklyRewards = await module.exports.mongoGetData('events', {});
            eventWeeklyRewards = eventWeeklyRewards[0].rewards.weekly;    

        // adding event daily challenges rewards to rewards list if it's not empty
        if(eventWeeklyRewards != ''){weeklies.rewards.push(eventWeeklyRewards + ' (Event)')};    

        //console.debug('[core] [weekly] weeklies data: '+JSON.stringify(weeklies, null, '\t'))    
        
        return weeklies;
    },

    /**
     * getEventData
     * Used to get specified day event data
     * @param {String} day dddd formatted day value 
     * @returns object, event data (quests list, details)
     */
    getEventData: async function getEvent(day){
        let eventData = await module.exports.mongoGetData('events', {});
            eventData = eventData[0];
        let questList = [];

        for(let i = 0; i < eventData.quests.length; i++){
            for(let j = 0; j < 7; j++){
                if(eventData.quests[i].day[j] == day){
                    questList.push(eventData.quests[i])
                };
            };
        };

        //console.debug('[core] [event] questsList value: '+JSON.stringify(questList, null, '\t'));

        eventData.quests = questList;

        return eventData;
    },
    /**
     * sendResetNotification
     * Used to send quest reset notification
     * @param {Guild} clientGuildData discord bot client guild/server connected data
     */
    sendResetNotification: async function sendReset(clientGuildData){
        let todayDay = module.exports.getDayValue(Date.now(), 'now');

        let dailiesData = await module.exports.getDailyData(todayDay);
        let eventData = await module.exports.getEventData(todayDay);
        let weekliesData = await module.exports.getWeeklyData();

        let fieldsData = [
            {
                'name': 'Event',
                'value': '**Name**: ['+eventData.name+']('+eventData.url+')\n'+
                         '**Duration**: '+eventData.duration+'\n'+
                         '**Redemption Period**: '+eventData.redeem+'\n'+
                         '**Quests**'+
                         module.exports.setQuestViewFormat(eventData.quests, '- ', true)+'\n\u200B'
            },
            {
                'name': 'Daily Challenges',
                'value': '**Rewards**'+
                        module.exports.setArrayDataFormat(dailiesData.rewards, '- ', true)+'\n'+
                        '**Quests**'+
                        module.exports.setQuestViewFormat(dailiesData.quests, '- ', true)+'\n\u200B'
            }            
        ];

        if(todayDay == 'Wednesday'){
            fieldsData.push(
                {
                    'name': 'Weekly Challenges',
                    'value': '**Rewards**'+
                            module.exports.setArrayDataFormat(weekliesData.rewards, '- ', true)+'\n'+
                            '**Quests**'+
                            module.exports.setQuestViewFormat(weekliesData.quests, '- ', true)+'\n\u200B'
                }
            )
        }

        let msgData = 'Hello! \nIt\'s time for reset, below is today\'s/this week\'s list. Have a good day!'

        let embedData = {
            'embed':{
                'author':{
                    'name': todayDay+'\'s List - '+dateformat(Date.now(), 'UTC:dd-mmmm-yyyy'),
                    'icon_url': 'https://cdn.discordapp.com/emojis/464038094258307073.png?v=1'
                },
                'color': 1879160,
                'footer': {
                    'text': 'Reset Notification - Generated at '+dateformat(Date.now(), 'UTC:dd-mm-yy @ HH:MM')+' UTC'
                },
                'fields': fieldsData
            }
        }

        clientGuildData.map(async function(guild){
            //console.debug('[soyun] [reset] guild list: '+guild.id+'('+guild.name+')');

            // getting guild setting data
            if(guild.available){  
                let guildSettingData = await module.exports.mongoGetData('guilds', {guild: guild.id});
                    guildSettingData = guildSettingData[0];
                //console.debug('[soyun] [reset] guild setting data: '+JSON.stringify(guildSettingData, null, '\t'));    
                let resetChannel = '';
                if(guildSettingData != undefined){
                    resetChannel = guildSettingData.settings.quest_reset
                }

                let found = 0;
                guild.channels.map((ch) => {
                    if(found == 0){
                        if(ch.name == resetChannel && resetChannel != undefined && resetChannel != 'disable'){
                            found = 1; 
                            ch.send(msgData, embedData);                        
                        }
                    }
                }) 
            }
        })
        console.log('[core] [reset] reset notification sent');
    }
};

// Exported function end here