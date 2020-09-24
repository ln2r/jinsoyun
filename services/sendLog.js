/* eslint-disable max-len */
/* eslint-disable no-console */
const MongoClient = require('mongodb').MongoClient;
const dateformat = require('dateformat');
const fetchDB = require('../utils/fetchDB.js');
const configs = require('../config.json');

const url = process.env.SOYUN_BOT_DB_CONNECT_URL;
const dbName = process.env.SOYUN_BOT_DB_NAME;
const maintenance = configs.bot.maintenance;

// TODO: better dm notification
/**
 * SendLog
 * for logging
 *
 * @param {String} level log level
 * @param {String} location current log location
 * @param {String} message log message
 * @param {Object} clientData discord cliemt data
 */
module.exports = async (level, location, message, clientData) => {
  const currentTime = new Date();

  // error logging
  if (!maintenance) {
    if ((level === 'error' || level === 'warn') && configs.logs.save) {
      const payload = {
        'date': dateformat(currentTime, 'UTC:dd-mmmm-yyyy'),
        'level': level,
        'location': location,
        'message': message,
        'audit': false,
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

    if (clientData) {
      // sending dm
      for (let i=0; i < clientData.owners.length; i++) {
        clientData.owners[i].send(
          `Issue Occured on \`${location}\``+
            '\n__Details__:'+
            `\nType: ${level}`+
            `\n**Time**: ${dateformat(Date.now(), 'dddd, dS mmmm yyyy, h:MM:ss TT')}`+
            `\n**Location**: ${location}`+
            `\n**Content**: ${message}`,
        );
      }
    }
  }

  // bot request counter
  if (level === 'query') {
    const statsData = await fetchDB(configs.collection.stats, {date: dateformat(currentTime, 'UTC:dd-mmmm-yyyy')});
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
        dbo.collection(configs.collection.stats).updateOne({date: dateformat(currentTime, 'UTC:dd-mmmm-yyyy')},
          {$set: {'count': todayStats}}, function(err) {
            if (err) throw err;
            db.close();
          });
      }
    });
  }

  // inefficient, pls fix
  const format = (configs.logs.time)? `${dateformat(currentTime, 'UTC:dd-mm-yyyy HH:MM:ss')} UTC [${location}] ${level}: ${message}` : `[${location}] ${level}: ${message}`;

  if (level !== 'debug') {
    console.log(format);
  } else {
    if (maintenance) console.log(format);
  }
};
