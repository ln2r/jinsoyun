/* eslint-disable max-len */
const utils = require('../utils/index.js');
const sendLog = require('./sendLog');
const config = require('../config.json');

const MongoClient = require('mongodb').MongoClient;
const url = process.env.SOYUN_BOT_DB_CONNECT_URL;
const dbName = process.env.SOYUN_BOT_DB_NAME;

/**
 * checkConfig
 * checking global settings data in db
 */
module.exports = async () => {
  sendLog('info', 'Configs', 'Checking global settings data...');
  const globalSettings = await utils.fetchDB(config.collection.configs, {guild: 0});

  if (globalSettings.length == 0) {
    sendLog('info', 'Configs', 'Global settings not found, creating one...');

    const globalBase = require('../globalSettings.example.json');

    MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, async function(err, db) {
      if (err) sendLog('error', 'Configs', err);
      const dbo = db.db(dbName);

      dbo.collection(config.collection.configs).insert(globalBase, async function(err) {
        if (err) sendLog('error', 'Configs', err);
        db.close();

        sendLog('info', 'Configs', 'Global setting data added.');
      });
    });
  } else {
    sendLog('info', 'Configs', 'Global settings found, proceeding normally.');
  }
};
