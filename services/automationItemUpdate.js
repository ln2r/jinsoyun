const MongoClient = require('mongodb').MongoClient;
const utils = require('../utils/index.js');

const url = process.env.SOYUN_BOT_DB_CONNECT_URL;
const dbName = process.env.SOYUN_BOT_DB_NAME;

/**
 * itemsUpdate
 * Used to update the item data with it"s market data
 */
module.exports = async function() {
  const start = Date.now();

  const itemsData = await utils.fetchSite('https://api.silveress.ie/bns/v3/items');
  const marketData = await utils.fetchSite('https://api.silveress.ie/bns/v3/market/na/current/lowest');

  if (itemsData.status === 'error' || itemsData.status === 'error') {
    //TODO: winston integration
    console.error('[core] [items-update] api data fetch error, please check the log');

    const end = Date.now();
    const updateTime = (end-start)/1000+'s';
    //TODO: winston integration
    console.log('[core] [items-update] Update data failed, time: '+updateTime);
  } else {
    const itemsCollectionName = 'items';
    const marketCollectionName = 'market';

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
          dbo.collection(itemsCollectionName).insertMany(itemsData, function(err) {
            if (err) throw err;
            db.close();
          });

          // updating market data
          dbo.collection(marketCollectionName).insertMany(marketData, function(err) {
            if (err) throw err;
            db.close();
          });

          const end = Date.now();
          const updateTime = (end-start)/1000+'s';
          
          //TODO: winston integration
          console.log('[core] [items-update] Data updated, time: '+updateTime);
        });
    });
  }
};
