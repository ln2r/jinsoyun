const dotenv = require('dotenv').config();

const MongoClient = require('mongodb').MongoClient;
const dateformat = require('dateformat');
const fetch = require('node-fetch');

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
     *  module.exports.getSiteData('https://api.silveress.ie/bns/v3/items');
     *  
     *  // Using the function outside the file
     *  core.getSiteData('https://api.silveress.ie/bns/v3/items');
     */
    getSiteData: async function getSiteData(address) {
        return await fetch(address)
            .then((response) => {return response.json()})
            .catch((error) => {
                console.error('[core] [site-data] Error: '+error);
                module.exports.sendBotReport('site data fetch error', 'getSiteData-core', 'error');

                return {'status': 'error', error}
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
     *  module.exports.mongoGetData('classes', {_id: 0});
     *  
     *  // Using the function outside the file without filter
     *  core.mongoGetData('classes');
     */
    mongoGetData: function mongoGetData(collname, filter) { 
        //console.debug('[core] [mongo-fetch] collname: '+collname+', filter: '+JSON.stringify(filter));

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
     * itemsUpdate
     * Used to update the item data with it's market data
     * @returns array of update status and time took to update
     */
    mongoItemDataUpdate: async function itemsUpdate(){     
        let start = Date.now();

        var dataItems = await module.exports.getSiteData('https://api.silveress.ie/bns/v3/items');
        let marketItems = await module.exports.getSiteData('https://api.silveress.ie/bns/v3/market/na/current/lowest');

        if(dataItems.status == 'error' || dataItems.status == 'error'){
            console.error('[core] [items-update] api data fetch error, please check the log');
            module.exports.sendBotReport('api data fetch error', 'itemUpdate-core', 'error');

            let end = Date.now();
            let updateTime = (end-start)/1000+'s';    
            console.log('[core] [items-update] Update data failed, time: '+updateTime);
        }else{
            let itemsCollectionName = 'items';
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
                            if (collinfo) {
                                dbo.collection(itemsCollectionName).drop(function(err) {
                                    if (err) throw err;
                                });                                    
                            }
                            
                            // inserting the data to the collection
                            dbo.collection(itemsCollectionName).insertMany(latestData, function(err, res) {  
                                if (err) throw err;    
                                db.close();                
                            })

                            let end = Date.now();
                            let updateTime = (end-start)/1000+'s';
                    
                            console.log('[core] [items-update] Data updated, time: '+updateTime); 
                        });                                    
                });
            });
        };

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

        let priceStatus = ('' + '0.00%') + '➖';
        if(priceNew != priceOld){
            let percentage = ((priceNew-priceOld)/ 100).toFixed(2);
            let symbol;
            let emoji;
            
            if(percentage < 0){
                symbol = '';
                emoji = '🔽';
            }else{
                symbol = '+';
                emoji = '🔼';
            }
    
            priceStatus = (symbol + percentage+'%') + emoji;
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
        let gold = ''
        let silver = ''
        let copper = ''
    
        if(len > 4){
            gold = str.substring( 0 , len -4)+ '<:gold:463569669496897547>';
        }
        if(len > 2){
            silver = str.substring( len -2 ,len - 4 )+ '<:silver:463569669442371586>';
        }
        if(len > 0){
            copper = str.substring( len ,len -2 )+ '<:copper:463569668095868928>';
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

        //console.debug('[core] [daily] queried day: '+day);
        //console.debug('[core] [daily] event rewards: '+eventDailyRewards);

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
            //console.debug('[core] [reset] guild list: '+guild.id+'('+guild.name+')');

            // getting guild setting data
            if(guild.available){  
                let guildSettingData = await module.exports.mongoGetData('guilds', {guild: guild.id});
                    guildSettingData = guildSettingData[0];
                //console.debug('[core] [reset] guild setting data: '+JSON.stringify(guildSettingData, null, '\t'));    
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
    },

    /**
     * getTimeDifference
     * Used to get time difference
     * @param {Array} data time data, preferably array of time data
     * @returns {Object} containing closest time index and time difference data
     */
    getTimeDifference: function timeDifference(data){
        if(data.constructor != Array){
            data = [data];
        }

        let now = new Date();
        let timeNow = new Date(0, 0, 0, now.getUTCHours(), now.getMinutes());

        let closestTime;
        let timeDifferenceData;
        let timeDifferenceHourMax = 24;

        //console.debug('[core] [time difference] now: '+timeNow);

        for(let i = 0; i < data.length; i++){
            let timeData = new Date(0, 0, 0, data[i], 0);
            //console.debug('[core] [time difference] time data '+timeData);

            let timeRemaining = (timeData - timeNow);
            //console.debug('[core] [time difference] current: '+timeData);
            //console.debug('[core] [time difference] remain: '+timeRemaining);

            // formatting the data
            let timeDifferenceHour = Math.abs(Math.floor(timeRemaining / 1000 / 60 / 60));
            // use extra variable so 'timerRemaining' variable remain unchanged
            let timeDifferenceHourRaw = timeRemaining - (timeDifferenceHour * 1000 * 60 *60);
                
            let timeDifferenceMinute = Math.abs(Math.floor(timeDifferenceHourRaw / 1000 / 60));

            //console.debug('[core] [time difference] left: '+timeDifferenceHour+'h '+timeDifferenceMinute+'m')
    
            // checking if current time is smaller than last one or not
            if(timeDifferenceHour <= timeDifferenceHourMax && timeRemaining > 0){
                timeDifferenceHourMax = timeDifferenceHour;
                closestTime = i;
                // storing the formatted data into an array
                timeDifferenceData = [timeDifferenceHour, timeDifferenceMinute];
            }
        }    
        //console.debug('[core] [time difference] selected: '+new Date(0, 0, 0, data[closestTime], 0));
        //console.debug('[core] [time difference] time left: '+timeDifferenceData[0]+' hours, '+timeDifferenceData[1]+' minutes');

        return {
            'time_index': closestTime,
            'time_difference_data': timeDifferenceData
        }

    },

    /**
     * sendBotReport
     * Saving log data to database
     * @param {ErrorEvent} logData log message
     * @param {String} location where the event happens
     * @param {String} type event type
     */
    sendBotReport: function sendReport(logData, location, type){
        let now = new Date();

        let logCollectionName = 'logs';

        let logPayload = {
            'location': location,
            'type': type,     
            'time': dateformat(Date.now(), 'dddd, mmmm dS, yyyy, h:MM:ss TT'),     
            'message': logData
        }

        MongoClient.connect(url, {useNewUrlParser: true}, function(err, db) {
            if (err) throw err;
            var dbo = db.db(dbName);

            dbo.collection(logCollectionName).insertOne(logPayload, function(err, res) {  
                if (err) throw err;    
                db.close();                
            });
        });

    }
};

// Exported function end here