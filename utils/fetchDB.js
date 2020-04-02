const MongoClient = require('mongodb').MongoClient;
const services = require('../services/index');

const url = process.env.SOYUN_BOT_DB_CONNECT_URL;
const dbName = process.env.SOYUN_BOT_DB_NAME;

/**
 * fetchDB
 * Used to get data from MongoDB database
 * @param {String} collname data collection name
 * @param {Object} filter data filter
 * @param {Object} sorting sort data filter
 * @param {Number} limit max data fetched
 * @return data fetched from databse
 */
module.exports = function (collname, filter, sorting, limit) {
  filter = (filter === null || filter === undefined)? {} : filter;
  sorting = (sorting === null || sorting === undefined)? {} : sorting;
  limit = (limit === null || limit === undefined)? 0 : limit;

  try {
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
  } catch (err) {
    services.sendLog('error', 'fetchDB', err);
  }
};
