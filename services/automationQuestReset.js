const utils = require('../utils/index.js');
const sendResetNotification = require('./sendResetNotification');
const sendLog = require('./sendLog');

/**
 * automationQuestReset
 * send quest reset notification to enabled guilds
 * @param {Object} guildsData connected guilds data
 */
module.exports = async function(guildsData) {
  // checking if it disabled or not
  const globalSettings = await utils.getGlobalSetting('reset');
  if (!globalSettings.status) {
    sendLog('warn', 'Reset', 'Notification disabled, '+globalSettings.message);
  } else {
    sendResetNotification(guildsData);
  }
};
