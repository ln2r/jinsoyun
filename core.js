const dotenv = require('dotenv').config();

const MongoClient = require('mongodb').MongoClient;
const dateformat = require('dateformat');
const fetch = require('node-fetch');

const url = process.env.bot_mongodb_url;
const dbName = process.env.bot_mongodb_db_name;

// Exported function start here
module.exports = {

  /**
     * getSiteData
     * Used to get JSON data from the 3rd party source
     * @param {String} address site address
     * @return data fetched from site in JSON format
     * @example
     *  // Using the function locally
     *  module.exports.getSiteData("https://api.silveress.ie/bns/v3/items");
     *
     *  // Using the function outside the file
     *  core.getSiteData("https://api.silveress.ie/bns/v3/items");
     */
  getSiteData: async function getSiteData(address) {
    return await fetch(address)
        .then((response) => {
          return response.json();
        })
        .catch((error) => {
          console.error('[core] [site-data] Error: '+error);
          module.exports.sendBotReport({'name': 'SiteFetchError', 'message': 'Unable to get site data, site unreachable', 'path': 'core.js (getSiteData)', 'code': 10400, 'method': 'GET'}, 'itemUpdate-core', 'error');

          return {'status': 'error', error};
        });
  },

  /**
     * mongoGetData
     * Used to get data from MongoDB database
     * @param {String} collname data collection name
     * @param {Object} filter data filter
     * @param {Object} sorting data sorting
     * @param {Number} limit returned data limit
     * @return data fetched from databse
     * @example
     *  // Using the function locally with id as it filter
     *  module.exports.mongoGetData("classes", {_id: 0});
     *
     *  // Using the function outside the file without filter
     *  core.mongoGetData("classes");
     */
    
  mongoGetData: function mongoGetData(collname, filter, sorting, limit) {
    filter = (filter === null || filter === undefined)? {} : filter;
    sorting = (sorting === null || sorting === undefined)? {} : sorting;
    limit = (limit === null || limit === undefined)? 0 : limit;  
    
    return MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true})
      .then(async function(db) {
        const dbo = db.db(dbName);
        const result = await dbo.collection(collname).find(filter).sort(sorting).limit(limit).toArray();
        
        db.close();

        return result;
      })
      .then(function(items) {
        return items;
      });      
  },

  /**
     * itemsUpdate
     * Used to update the item data with it"s market data
     * @return array of update status and time took to update
     */
  mongoItemDataUpdate: async function itemsUpdate() {
    const start = Date.now();

    const itemsData = await module.exports.getSiteData('https://api.silveress.ie/bns/v3/items');
    const marketData = await module.exports.getSiteData('https://api.silveress.ie/bns/v3/market/na/current/lowest');

    if (itemsData.status === 'error' || itemsData.status === 'error') {
      console.error('[core] [items-update] api data fetch error, please check the log');
      module.exports.sendBotReport({'name': 'APIFetchError', 'message': 'Unable to get api data, site unreachable', 'path': 'core.js (getSiteData)', 'code': 10400, 'method': 'GET'}, 'itemUpdate-core', 'error');

      const end = Date.now();
      const updateTime = (end-start)/1000+'s';
      console.log('[core] [items-update] Update data failed, time: '+updateTime);
    } else {
      let itemsCollectionName = "items";
      let marketCollectionName = "market";
      
      MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, db) {
        if (err) throw err;
        const dbo = db.db(dbName);

        dbo.listCollections({name: itemsCollectionName})
          .next(function(err, collinfo) {
            if (err) throw err;

            // checking if the collection is exist or not
            if (collinfo) {
              dbo.collection(itemsCollectionName).drop(function(err) {
                if (err) throw err;
              });
            }

            // updating items data
            dbo.collection(itemsCollectionName).insertMany(itemsData, function(err, res) {
              if (err) throw err;
              db.close();
            });

            // updating market data
            dbo.collection(marketCollectionName).insertMany(marketData, function(err, res) {
              if (err) throw err;
              db.close();
            });

            const end = Date.now();
            const updateTime = (end-start)/1000+'s';

            console.log('[core] [items-update] Data updated, time: '+updateTime);
          });
      });
    }
  },

  /**
     * setArrayDataFormat
     * Used to format array data to list style data
     * @param {Array} data the array data
     * @param {String} symbol list symbol
     * @param {Boolean} newline add new line at every start of the item or not
     * @return formatted list-like data
     */
  setArrayDataFormat: function formatArray(data, symbol, newline) {
    if (data.length === 0) {
      return '\n- *No data available*';
    }

    let formattedData = '';

    if (newline === true) {
      newline = '\n';
    } else {
      newline = '';
    }

    for (let i = 0; i < data.length; i++) {
      // checking if the data in that index is empty or not
      if(data[i] === "" || data[i] === undefined){
        formattedData = formattedData;
      }else{
        formattedData = formattedData + (newline + symbol + data[i]);
      }      
    }

    if(formattedData === ""){
      formattedData = "\n- *No data available*"
    }

    return formattedData;
  },

  /**
     * setDataFormatString
     * Used to format String data/handling empty data
     * @param {String} data String data
     * @return handled data
     */
  setDataFormatString: function formatDataString(data) {
    if (data === '' || data === null || data === undefined) {
      data = '';
    }

    return data;
  },

  /**
     * setDataFormatString
     * Used to format Number data/handling empty data
     * @param {Number} data Number data
     * @return handled data
     */
  setDataFormatNumb: function formatDataNumb(data) {
    if (data === '' || data === null || data === undefined) {
      data = 0;
    }

    return data;
  },

  /**
     * getPriceStatus
     * Used to get price status compared to last one
     * @param {Number} priceOld old price
     * @param {Number} priceNew the latest price
     * @return status price
     * @example
     * getPriceStatus(2000, 3000) // return +50.00%🔼
     */
  getPriceStatus: function priceStatus(priceOld, priceNew) {
    let priceStatus = ('0.00%') + '➖';
    
    if(priceNew !== priceOld) {     
      const percentage = (((priceNew - priceOld) / priceOld) * 100).toFixed(2);
      let symbol;
      let emoji;

      if (percentage < 0) {
          symbol = '';
          emoji = '🔽';
      } else {
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
     * @return formatted data
     * @example
     * setCurrencyFormat(2000) // return 20s0c
     */
  setCurrencyFormat: function currencyFormat(Number) {
    let str = Math.round(Number);
    str = str.toString();
    const len = str.length;
    let gold = '';
    let silver = '';
    let copper = '';

    if (len > 4) {
      gold = str.substring( 0, len -4)+ '<:gold:463569669496897547>';
    }
    if (len > 2) {
      silver = str.substring( len -2, len - 4 )+ '<:silver:463569669442371586>';
    }
    if (len > 0) {
      copper = str.substring( len, len -2 )+ '<:copper:463569668095868928>';
    }

    const total = gold + silver + copper;
    return total;
  },

  /**
     * getDayValue
     * Used to get the text value of the current date
     * @param {Date} date date data
     * @param {String} type return type, currently only support "now"
     * @return day value
     * @example
     * getDayValue("Fri Mar 01 2019 14:49:58 GMT+0700", "now") // return Friday
     */
  getDayValue: function getDay(date, type) {
    let dayValue;

    if (type === 'now') {
      dayValue = dateformat(date, 'dddd', true);
    } else {
      date = new Date(date);
      date.setDate(date.getDate()+ 1);

      dayValue = dateformat(date, 'dddd', true);
    }

    return dayValue;
  },

  /**
     * getDailyData
     * Used to get specified daily data
     * @param {String} day dddd formatted day value
     * @return object, daily data (reward, quests list)
     */
  getDailyData: async function getDaily(day) {
    let challengesData = await module.exports.mongoGetData('challenges', {name: day});

    let eventDailyRewards = await module.exports.mongoGetData('events', {});
        eventDailyRewards = eventDailyRewards[0].rewards.daily;

    return {
      // getting the quests list
      quests: await module.exports.getQuestsList(challengesData[0].quests),
      rewards: await module.exports.getRewardsList(day)
    };
  },

  /**
     * getWeeklyData
     * Used to get weekly quest data
     * @return object, weekly data (quests list, rewards)
     */
  getWeeklyData: async function getWeekly() {
    let challengesData = await module.exports.mongoGetData('challenges', {name: "Weekly"});

    return {
      // getting quests
      quests: await module.exports.getQuestsList(challengesData[0].quests),
      // getting rewards
      rewards: await module.exports.getRewardsList("Weekly")      
    };
  },

  /**
     * getEventData
     * Used to get specified day event data
     * @param {String} day dddd formatted day value
     * @return object, event data (quests list, details)
     */
  getEventData: async function getEvent(day) {
    let eventData = await module.exports.mongoGetData('events', {});
    eventData = eventData[0];

    const questList = [];

    for (let i = 0; i < eventData.quests.length; i++) {
      for (let j = 0; j < 7; j++) {
        if (eventData.quests[i].day[j] === day) {
          questList.push(eventData.quests[i]);
        }
      }
    }

    // console.debug("[core] [event] questsList value: "+JSON.stringify(questList, null, "\t"));

    for(let i=0; i<questList.length; i++){
      questList[i] = questList[i].quest;
    }
    eventData.quests = await module.exports.getQuestsList(questList);;

    return eventData;
  },
  /**
     * sendResetNotification
     * Used to send quest reset notification
     * @param {Guild} clientGuildData discord bot client guild/server connected data
     */
  sendResetNotification: async function sendReset(clientGuildData) {
    let todayDay = module.exports.getDayValue(Date.now(), 'now');

    let dailiesData = await module.exports.getDailyData(todayDay);
    let dailiesRewards = module.exports.setRewardsDataFormat(dailiesData.rewards);
    let eventData = await module.exports.getEventData(todayDay);
    
    let fieldsData = [
      {
        'name': 'Event',
        'value': '**Name**: ['+eventData.name+']('+eventData.url+')\n'+
                '**Duration**: '+eventData.duration+'\n'+
                '**Redemption Period**: '+eventData.redeem+'\n'+
                '**Quests**'+module.exports.setArrayDataFormat(eventData.quests, '- ', true)+'\n\u200B',
      },
      {
        'name': 'Daily Challenges',
        'value': '**Rewards**'+module.exports.setArrayDataFormat(dailiesRewards, "", true)+'\n\u200B'+
                '**Quests**'+module.exports.setArrayDataFormat(dailiesData.quests, '- ', true)+'\n\u200B',
      },
    ];

    if (todayDay === 'Wednesday') {
      let weekliesData = await module.exports.getWeeklyData();
      let weekliesRewards = module.exports.setRewardsDataFormat(weekliesData.rewards);
      fieldsData.push(
          {
            'name': 'Weekly Challenges',
            'value': '**Rewards**'+module.exports.setArrayDataFormat(weekliesRewards, "", true)+'\n\u200B'+
                     '**Quests**'+module.exports.setArrayDataFormat(weekliesData.quests, '- ', true)+'\n\u200B',
          }
      );
    }

    let msgData = 'Hello! \nIt\'s time for reset, below is today\'s/this week\'s list. Have a good day!';

    let embedData = {
      'embed': {
        'author': {
          'name': todayDay+'\'s List - '+dateformat(Date.now(), 'UTC:dd-mmmm-yyyy'),
          'icon_url': 'https://cdn.discordapp.com/emojis/464038094258307073.png?v=1',
        },
        'color': 1879160,
        'footer': {
          'text': 'Reset Notification - Generated at '+dateformat(Date.now(), 'UTC:dd-mm-yy @ HH:MM')+' UTC',
        },
        'fields': fieldsData,
      },
    };

    clientGuildData.map(async function(guild) {
      // console.debug("[core] [reset] guild list: "+guild.id+"("+guild.name+")");

      // getting guild setting data
      if (guild.available) {
        let guildSettingData = await module.exports.mongoGetData('configs', {guild: guild.id});
        guildSettingData = guildSettingData[0];
        // console.debug("[core] [reset] guild setting data: "+JSON.stringify(guildSettingData, null, "\t"));
        let resetChannel = '';
        if (guildSettingData !== undefined) {
          resetChannel = guildSettingData.settings.quest_reset;
        }

        let found = 0;
        guild.channels.map((ch) => {
          if (found === 0) {
            if (ch.id === resetChannel && resetChannel !== undefined && resetChannel !== 'disable') {
              found = 1;
              ch.send(msgData, embedData);
            }
          }
        });
      }
    });
    console.log('[core] [reset] reset notification sent');
  },

  /**
     * getTimeDifference
     * Used to get time difference
     * @param {Array} data time data, preferably array of time data
     * @return {Object} containing closest time index and time difference data
     */
  getTimeDifference: function timeDifference(data) {
    if (data.constructor !== Array) {
      data = [data];
    }

    const now = new Date();
    const timeNow = new Date(0, 0, 0, now.getUTCHours(), now.getMinutes());

    let closestTime;
    let timeDifferenceData;
    let timeDifferenceHourMax = 24;

    // console.debug("[core] [time difference] now: "+timeNow);

    for (let i = 0; i < data.length; i++) {
      const timeData = new Date(0, 0, 0, data[i], 0);
      // console.debug("[core] [time difference] time data "+timeData);

      const timeRemaining = (timeData - timeNow);
      // console.debug("[core] [time difference] current: "+timeData);
      // console.debug("[core] [time difference] remain: "+timeRemaining);

      // formatting the data
      const timeDifferenceHour = Math.abs(Math.floor(timeRemaining / 1000 / 60 / 60));
      // use extra variable so "timerRemaining" variable remain unchanged
      const timeDifferenceHourRaw = timeRemaining - (timeDifferenceHour * 1000 * 60 *60);

      const timeDifferenceMinute = Math.abs(Math.floor(timeDifferenceHourRaw / 1000 / 60));

      // console.debug("[core] [time difference] left: "+timeDifferenceHour+"h "+timeDifferenceMinute+"m")

      // checking if current time is smaller than last one or not
      if (timeDifferenceHour <= timeDifferenceHourMax && timeRemaining > 0) {
        timeDifferenceHourMax = timeDifferenceHour;
        closestTime = i;
        // storing the formatted data into an array
        timeDifferenceData = [timeDifferenceHour, timeDifferenceMinute];
      }
    }
    // console.debug("[core] [time difference] selected: "+new Date(0, 0, 0, data[closestTime], 0));
    // console.debug("[core] [time difference] time left: "+timeDifferenceData[0]+" hours, "+timeDifferenceData[1]+" minutes");

    return {
      'time_index': closestTime,
      'time_difference_data': timeDifferenceData,
    };
  },

  /**
     * sendBotReport
     * Saving log data to database
     * @param {Object} logData log message
     * @param {String} location where the event happens
     * @param {String} type event type
     */
  sendBotReport: function sendReport(logData, location, type) {
    const now = new Date();

    const logCollectionName = 'logs';

    const logPayload = {
      'location': location,
      'type': type,
      'time': now,
      'message': logData,
    };

    MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, db) {
      if (err) throw err;
      const dbo = db.db(dbName);

      dbo.collection(logCollectionName).insertOne(logPayload, function(err, res) {
        if (err) throw err;
        db.close();
      });
    });
  },

  /**
     * sendBotStats
     * Counting current day commands call
     * @param {Date} date current date
     */
  sendBotStats: async function sendStats(date) {
    const statsCollectionName = 'botStats';
    const statsData = await module.exports.mongoGetData(statsCollectionName, {date: dateformat(date, 'UTC:dd-mmmm-yyyy')});
    let todayStats = 0;
    let payload;

    // console.debug("[core] [bot-stats] stats data: "+JSON.stringify(statsData));

    if (statsData.length === 0) {
      todayStats++;

      payload = {
        'date': dateformat(date, 'UTC:dd-mmmm-yyyy'),
        'count': todayStats,
      };
    } else {
      todayStats = statsData[0].count + 1;
    }

    MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, db) {
      if (err) throw err;
      const dbo = db.db(dbName);

      if (statsData.length === 0) {
        dbo.collection(statsCollectionName).insertOne(payload, function(err, res) {
          if (err) throw err;
          db.close();
        });
      } else {
        dbo.collection(statsCollectionName).updateOne({'date': dateformat(date, 'UTC:dd-mmmm-yyyy')},
            {$set: {'count': todayStats}}, function(err, res) {
              if (err) throw err;
              db.close();
            });
      }
    });
  },

  /**
   * getMentionedChannel
   * getting mentioned channel id
   * @param {String} message message data
   * @return {Snowflake | null} mentioned channel id
   */
  getMentionedChannelId: function getChannelId(message){
    if(message.startsWith("<#") && message.endsWith(">")){
      return message.slice(2, -1);
    }else{
      return null;
    };
  },

  /**
   * getMentionedRoleId
   * getting mentioned role id
   * @param {String} message message data
   * @return {Snowflake | null} mentioned role id
   */
  getMentionedRoleId: function getRoleId(message){
    if(message.startsWith("<@&") && message.endsWith(">")){
      return message.slice(3, -1);
    }else{
      return null;
    }
  },

  /**
   * getGuildSettings
   * getting guild setting data
   * @param {Snowflake} guildId current guild id
   * @return {Object | null} guild setting data
   */
  getGuildSettings: async function getSettings(guildId){
    let guildData = await module.exports.mongoGetData('configs', {guild: guildId});
    
    if(guildData.length !== 0){
      return guildData[0];
    }else{
      return undefined;
    }
  },

  /**
   * getQuestsList
   * getting quests list data
   * @param {Array} questsList array of quests's id
   * @return {Array} formatted quests list
   */
  getQuestsList: async function getQuests(questsIdList){
    let questsData = await module.exports.mongoGetData("quests", {});
    let questsList = [];

    let dungeonsData = await module.exports.mongoGetData("dungeons", {});

    // getting the quests name and location
    for(let i=0; i<questsIdList.length; i++){
      for(let j=0; j<questsData.length; j++){
        if(questsIdList[i] === questsData[j].id){
          let questName = questsData[j].name;
          let questLocations = [];

          // getting the location
          for(let k=0; k<questsData[j].location.length; k++){
            for(let l=0; l<dungeonsData.length; l++){
              if(questsData[j].location[k] === dungeonsData[l].id){
                if(questsData[j].type === 2) questName = questName + " (Dynamic)";

                questLocations.push(dungeonsData[l].name);
              }
            }
          }          

          questsList.push("**"+questName+"** - "+questLocations.join(", "));
        }
      }
    }

    return questsList;
  },

  /**
   * getRewardsList
   * getting rewards list with the tier
   * @param {String} challengesType challenges day/type
   * @return {Array} formatted rewards list
   */
  getRewardsList: async function getRewards(challengesType){
    let eventData = await module.exports.mongoGetData("events", {});
    let eventRewards;
    let challengesData = await module.exports.mongoGetData("challenges", {name: challengesType});
    let challengesRewards;

    challengesRewards = challengesData[0].rewards;
    eventRewards = eventData[0].rewards.daily;

    // adding event rewards
    if (eventRewards.length !== 0) {
      for(let i=0; i<eventRewards.length; i++){
        challengesRewards.push(
          {
            name: eventRewards[i].name + " (Event)",
            tier: eventRewards[i].tier
          }
        );
      }      
    };

    let tieredRewardsList = []
    // getting the tier
    for(let i=0; i<challengesRewards.length; i++){
      let currentTier = challengesRewards[i].tier;
      if(challengesRewards[i].tier === currentTier){
        // gathering rewards which have the same tier
        let currentTierRewards = [];
        for(let j=0; j<challengesRewards.length; j++){
          if(challengesRewards[j].tier === currentTier){
            currentTierRewards.push(challengesRewards[j].name);
          }
        }

        // checking if the tier already exist to prevent duplicate
        let found = false;
        for(let j=0; j<tieredRewardsList.length; j++){
          if(tieredRewardsList[j].tier === currentTier){
            found = true;
          }
        }
        if(!found){
          tieredRewardsList.push({
            tier: currentTier,
            rewards: currentTierRewards
          });
        }
      }
    }

    // sorting the rewards
    tieredRewardsList = tieredRewardsList.sort(function(a, b){return a.tier - b.tier});

    return tieredRewardsList;
  },

  /**
   * setRewardsDataFormat
   * formatting the rewards data
   * @param {Array} data array of rewards items
   * @return {Array} formatted rewards data
   */
  setRewardsDataFormat: function setRewardsFormat(data){
    let formattedData = [];
    for(let i=0; i<data.length; i++){
        let itemsList = module.exports.setArrayDataFormat(data[i].rewards, "- ", true);
        formattedData.push("**"+data[i].tier+" Completions**"+itemsList);
    }

    return formattedData;
  },

  /**
   * getGlobalSettings
   * getting the bot global settings
   * @param {String} system system name (daily, reset, etc)
   * @return {Object} selected system status
   */
  getGlobalSettings: async function getSettings(system){
    let settingsData = await module.exports.mongoGetData("configs", {"guild": 0});

    switch(system){
      case "not_found":
        return settingsData[0].settings.not_found;
      case "koldrak_announce":
        return settingsData[0].settings.koldrak_announce;
      case "reset":
        return settingsData[0].settings.reset;
      case "twitter":
        return settingsData[0].settings.twitter;
        
      case "bid":
        return settingsData[0].settings.bid;
      case "daily":
        return settingsData[0].settings.daily;
      case "drop":
        return settingsData[0].settings.drop;
      case "dungeon":
        return settingsData[0].settings.dungeon;
      case "event":
        return settingsData[0].settings.event;
      case "grandharvest":
        return settingsData[0].settings.grandharvest;
      case "koldrak":
        return settingsData[0].settings.koldrak;
      case "market":
        return settingsData[0].settings.market;
      case "shackedisle":
        return settingsData[0].settings.shackedisle;
      case "weekly":
        return settingsData[0].settings.weekly;
      case "who":
        return settingsData[0].settings.who;
      case "nickname":
        return settingsData[0].settings.nickname;
      case "radd":
        return settingsData[0].settings.radd;
      case "raddonce":
        return settingsData[0].settings.raddonce;
      case "reg":
        return settingsData[0].settings.reg;
      case "rmessage":
        return settingsData[0].settings.rmessage;
      case "rremove":
        return settingsData[0].settings.rremove;
      case "setting":
        return settingsData[0].settings.setting;
    }
  },

  /**
   * getChallengesInfo
   * getting any data if the dungeon is in any challenges
   * @param {Number} id dungeon id
   * @return {Array} challenges list
   */
  getChallengesInfo: async function getChallenges(id){
    let challengesData = await module.exports.mongoGetData("challenges", {});
    let questsData = await module.exports.mongoGetData("quests", {});
    let challengesList = [];

    // checking the quests list
    for(let i=0; i<(challengesData.length - 2); i++){
      // getting the quest
      for(let j=0; j<challengesData[i].quests.length; j++){
        for(let k=0; k<questsData.length; k++){
          if(challengesData[i].quests[j] === questsData[k].id){
            // getting the location
            for(let l=0; l<questsData[k].location.length; l++){
              if(questsData[k].location[l] == id){
                // pushing the challenges to the array list
                challengesList.push(challengesData[i].name);
              }
            }
          }
        }
      }
    }

    return challengesList;
  },

  /**
   * getAuthorPermission
   * getting message author permission for commands
   * @param {Object} messageData 
   * @param {String} guildId 
   * @return {Boolean} permission boolean
   */
  getAuthorPermission: async function getPermission(messageData, guildId){
    let configsData = await module.exports.getGuildSettings(guildId);
    let guildAdminRolesData = configsData.settings.admin_roles;
    let found;

    // checking if the guild have admin roles set
    if(guildAdminRolesData && guildAdminRolesData !== null){
      // check if its the guild owner
      if(messageData.author.id === messageData.guild.ownerID){
        return true;
      }

      // checking author roles
      messageData.member.roles.map((role) => {
        for(let i=0; i<guildAdminRolesData.length; i++){
          if(guildAdminRolesData[i] === role.id){
            found = true;
          }
        }
      })

      return (found)? true : false;
    }else{
      return messageData.channel.permissionsFor(messageData.author).has("MANAGE_ROLES", false)
    }
  },
};

// Exported function end here
