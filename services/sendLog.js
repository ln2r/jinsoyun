/* eslint-disable no-console */
const MongoClient = require('mongodb').MongoClient;
const dateformat = require('dateformat');
const utils = require('../utils/index.js');
const configs = require('../config.json');

const url = process.env.SOYUN_BOT_DB_CONNECT_URL;
const dbName = process.env.SOYUN_BOT_DB_NAME;

/**
 * SendLog
 * for logging
 * @param {String} level log level
 * @param {String} location current log location
 * @param {String} message log message 
 */
module.exports = async function(level, location, message){
  const currentTime = new Date();

  // error logging
  if(level === 'error'){
    const payload = {
      'date': dateformat(currentTime, 'UTC:dd-mmmm-yyyy'),
      'level': level,
      'location': location,
      'message': message,
    };

    MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, db) {
      if (err) throw err;
      const dbo = db.db(dbName);    
  
      dbo.collection(configs.collection.logs).insertOne(payload, function(err) {
        if (err) throw err;
        db.close();
      });
    });
  }
  
  // bot request counting
  if(level === 'query'){
    const statsData = await utils.fetchDB(configs.collection.stats, {currentTime: dateformat(currentTime, 'UTC:dd-mmmm-yyyy')});
    let todayStats = 0;
    let payload;
  
    if (statsData.length === 0) {
      todayStats++;
  
      payload = {
        'date': dateformat(currentTime, 'UTC:dd-mmmm-yyyy'),
        'count': todayStats,
      };
    } else {
      todayStats = statsData[0].count + 1;
    }
  
    MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, db) {
      if (err) throw err;
      const dbo = db.db(dbName);
  
      if (statsData.length === 0) {
        dbo.collection(configs.collection.stats).insertOne(payload, function(err) {
          if (err) throw err;
          db.close();
        });
      } else {
        dbo.collection(configs.collection.stats).updateOne({'date': dateformat(currentTime, 'UTC:dd-mmmm-yyyy')},
          {$set: {'count': todayStats}}, function(err) {
            if (err) throw err;
            db.close();
          });
      }
    });  
  }

  console.log(`${dateformat(currentTime, 'UTC:dd-mm-yyyy HH:MM:ss')} UTC [${location}] ${level}: ${message}`);
};