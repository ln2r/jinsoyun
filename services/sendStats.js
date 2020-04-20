const MongoClient = require('mongodb').MongoClient;
const dateformat = require('dateformat');
const utils = require('../utils/index.js');

const url = process.env.SOYUN_BOT_DB_CONNECT_URL;
const dbName = process.env.SOYUN_BOT_DB_NAME;

/**
 * sendBotStats
 * Counting current day commands call
 * @param {Date} date current date
 */
module.exports = async function(date) {
  const statsCollectionName = 'botStats';
  const statsData = await utils.fetchDB(statsCollectionName, {date: dateformat(date, 'UTC:dd-mmmm-yyyy')});
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
      dbo.collection(statsCollectionName).insertOne(payload, function(err) {
        if (err) throw err;
        db.close();
      });
    } else {
      dbo.collection(statsCollectionName).updateOne({'date': dateformat(date, 'UTC:dd-mmmm-yyyy')},
        {$set: {'count': todayStats}}, function(err) {
          if (err) throw err;
          db.close();
        });
    }
  });
};
