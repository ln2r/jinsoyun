const MongoClient = require('mongodb').MongoClient;
const utils = require('../utils/index.js');
const services = require('../services/index');
const configs = require('../config.json');

const url = process.env.SOYUN_BOT_DB_CONNECT_URL;
const dbName = process.env.SOYUN_BOT_DB_NAME;

/**
 * itemsUpdate
 * Used to update the item and market data
 */
module.exports = async () => {
  services.sendLog('info', 'Auto-Items', 'Running items update...');
  const start = Date.now();

  // getting api data
  const apiData = await utils.fetchDB('apis', {name: 'Silveress Item'});
  // getting items api address
  const itemsData = await utils.fetchSite(apiData[0].address);

  if (itemsData.status === 'error') {
    const end = Date.now();
    const updateTime = (end-start)/1000+'s';

    services.sendLog('warn', 'Items', `Data update failed. (${updateTime})`);
    if(itemsData.status === 'error') services.sendLog('error', 'Auto-Items', itemsData.err);

  } else {
    services.sendLog('debug', 'Auto-Items', `Connecting to ${url}...`);
    MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, async function(err, db) {
      if (err) services.sendLog('error', 'Auto-Items', err);
      const dbo = db.db(dbName);

      dbo.listCollections({name: configs.collection.items})
        .next(async function(err, collinfo) {
          if (err) services.sendLog('error', 'Auto-Items', err);

          // "clean" the collection if its exist
          if (collinfo) {
            dbo.collection(configs.collection.items).drop(async function(err) {
              if (err) services.sendLog('error', 'Auto-Items', err);
            });
          }

          // updating
          services.sendLog('debug', 'Auto-Items', `Updating "${configs.collection.items}" data...`);
          dbo.collection(configs.collection.items).insertMany(itemsData, async function(err) {
            if (err) services.sendLog('error', 'Auto-Items', err);
            db.close();
          });

          const end = Date.now();
          const updateTime = (end-start)/1000+'s';
                    
          services.sendLog('info', 'Auto-Items', 'Data updated, time: '+updateTime);
        });
    });
  }
};
