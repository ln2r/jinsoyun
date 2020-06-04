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
  const start = Date.now();

  // getting api data
  const apiData = await utils.fetchDB('apis', {}, {_id: 1});
  // getting items api address
  const itemsData = apiData[2].address;
  // getting market api address
  const marketData = apiData[1].address;

  if (itemsData.status === 'error' || marketData.status === 'error') {
    const end = Date.now();
    const updateTime = (end-start)/1000+'s';
    await sendLog('warn', 'Items', `'Data update failed. (${updateTime})\n${itemsData}`);
  } else {
    MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, db) {
      if (err) throw err;
      const dbo = db.db(dbName);

      dbo.listCollections({name: configs.collection.items})
        .next(async function(err, collinfo) {
          if (err) throw err;

          // checking if the collection is exist or not
          if (collinfo) {
            dbo.collection(configs.collection.items).drop(function(err) {
              if (err) throw err;
            });
          }

          // updating items data
          dbo.collection(configs.collection.items).insertMany(itemsData, function(err) {
            if (err) throw err;
            db.close();
          });

          // updating market data
          dbo.collection(configs.collection.market).insertMany(marketData, function(err) {
            if (err) throw err;
            db.close();
          });

          const end = Date.now();
          const updateTime = (end-start)/1000+'s';
                    
          await sendLog('info', 'Items', 'Data updated, time: '+updateTime);
        });
    });
  }
};
