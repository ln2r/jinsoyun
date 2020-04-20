/* eslint-disable no-console */
const MongoClient = require('mongodb').MongoClient;
const dateformat = require('dateformat');

const url = process.env.SOYUN_BOT_DB_CONNECT_URL;
const dbName = process.env.SOYUN_BOT_DB_NAME;

/**
 * SendLog
 * for logging
 * @param {String} level log level
 * @param {String} location current log location
 * @param {String} message log message 
 */
module.exports = function(level, location, message){
  const currentTime = new Date();

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
  
      dbo.collection('logs').insertOne(payload, function(err) {
        if (err) throw err;
        db.close();
      });
    });
  }  

  console.log(`${dateformat(currentTime, 'UTC:dd-mmmm-yyyy')} [${location}] ${level}: ${message}`);
};