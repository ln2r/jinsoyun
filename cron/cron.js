/* eslint-disable max-len */
const utils = require('../utils/index');
const services = require('../services/index');
const items = require('./items');
const reset = require('./reset');
const access = require('./access');

/**
 * cron
 * The heart of soyun's automation
 * @param {Object} clientData Discord's client data
 */
module.exports = async (clientData) => {
  const t = new Date();
  const time = t.getUTCHours();

  // items update
  const autoItemsStatus = await utils.getGlobalSetting('auto_items');
  if (autoItemsStatus.status) {
    items();
  } else {
    services.sendLog('warn', 'Auto-Items', `Items update disabled, ${autoItemsStatus.message}`);
  }

  // selecting which one
  switch (time) {
  case 0:
    // koldrak
    access(clientData, 'koldrak');
    break;
  case 3:
    // koldrak
    access(clientData, 'koldrak');
    break;
  case 6:
    // koldrak
    access(clientData, 'koldrak');
    break;
  case 18:
    // koldrak
    access(clientData, 'koldrak');
    break;
  case 21:
    // koldrak
    access(clientData, 'koldrak');
    break;
  case 1:
    // hunter
    access(clientData, 'hunter');
    break;
  case 11:
    reset(clientData);
    break;
  }
};
