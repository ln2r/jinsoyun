const utils = require('../utils/index');
const services = require('./index');

/**
 * automationQuestReset
 * send quest reset notification to enabled guilds
 * @param {Object} guildsData connected guilds data
 */
module.exports = async function(guildsData){
  // checking if it disabled or not
  let globalSettings = await utils.getGlobalSettings("reset");
  if(!globalSettings.status){
      console.log("[soyun] [reset] reset notification currently disabled, "+globalSettings.message);
  }else{
    services.sendResetNotification(guildsData);
  };

  reset.done();
  return;
}