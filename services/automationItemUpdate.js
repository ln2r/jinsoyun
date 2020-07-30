const MongoClient = require('mongodb').MongoClient;
const utils = require('../utils/index.js');
const sendLog = require('./sendLog');
const configs = require('../config.json');

const url = process.env.SOYUN_BOT_DB_CONNECT_URL;
const dbName = process.env.SOYUN_BOT_DB_NAME;

/**
 * itemsUpdate
 * Used to update the item data with it"s market data
 */
module.exports = async function() {
  sendLog('info', 'Auto-Items', 'Running items update...');
  const start = Date.now();

  // getting api data
  const apiData = await utils.fetchDB('apis', {}, {_id: 1});
  // getting items api address
  const itemsData = await utils.fetchSite(apiData[2].address);
  // getting market api address
  const marketData = await utils.fetchSite(apiData[1].address);

  if (itemsData.status === 'error' || marketData.status === 'error') {
    const end = Date.now();
    const updateTime = (end-start)/1000+'s';

    sendLog('warn', 'Items', `Data update failed. (${updateTime})`);
    if(itemsData.status === 'error') sendLog('error', 'Auto-Items', itemsData.err);
    if(marketData.status === 'error') sendLog('error', 'Auto-Items', marketData.err);

  } else {
    sendLog('debug', 'Auto-Items', `Connecting to ${url}...`);
    MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, async function(err, db) {
      if (err) sendLog('error', 'Auto-Items', err);
      const dbo = db.db(dbName);

      dbo.listCollections({name: configs.collection.items})
        .next(async function(err, collinfo) {
          if (err) sendLog('error', 'Auto-Items', err);

          // checking if the collection is exist or not
          if (collinfo) {
            dbo.collection(configs.collection.items).drop(async function(err) {
              if (err) sendLog('error', 'Auto-Items', err);
            });
          }

          // updating items data
          sendLog('debug', 'Auto-Items', `Updating "${configs.collection.items}" data...`);
          dbo.collection(configs.collection.items).insertMany(itemsData, async function(err) {
            if (err) sendLog('error', 'Auto-Items', err);
            db.close();
          });

          // updating market data
          sendLog('debug', 'Auto-Items', `Updating "${configs.collection.market}" data...`);
          dbo.collection(configs.collection.market).insertMany(marketData, async function(err) {
            if (err) sendLog('error', 'Auto-Items', err);
            db.close();
          });

          const end = Date.now();
          const updateTime = (end-start)/1000+'s';
                    
          sendLog('info', 'Auto-Items', 'Data updated, time: '+updateTime);
        });
    });
  }
};
