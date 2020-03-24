const utils = require('./index')

/**
 * getGlobalSettings
 * getting the bot global settings
 * @param {String} system system name (daily, reset, etc)
 * @return {Object} selected system status
 */
module.exports = async function(system){
  let settingsData = await utils.fetchDB("configs", {"guild": 0});

  switch(system){
    case "not_found":
      return settingsData[0].settings.not_found;
    case "koldrak_announce":
      return settingsData[0].settings.koldrak_announce;
    case "hunters_refugee":
      return settingsData[0].settings.hunters_refugee;
    case "reset":
      return settingsData[0].settings.reset;
    case "twitter":
      return settingsData[0].settings.twitter;
      
    case "bid":
      return settingsData[0].settings.bid;
    case "daily":
      return settingsData[0].settings.daily;
    case "drop":
      return settingsData[0].settings.drop;
    case "dungeon":
      return settingsData[0].settings.dungeon;
    case "event":
      return settingsData[0].settings.event;
    case "grandharvest":
      return settingsData[0].settings.grandharvest;
    case "koldrak":
      return settingsData[0].settings.koldrak;
    case "market":
      return settingsData[0].settings.market;
    case "shackedisle":
      return settingsData[0].settings.shackedisle;
    case "weekly":
      return settingsData[0].settings.weekly;
    case "who":
      return settingsData[0].settings.who;
    case "nickname":
      return settingsData[0].settings.nickname;
    case "radd":
      return settingsData[0].settings.radd;
    case "raddonce":
      return settingsData[0].settings.raddonce;
    case "reg":
      return settingsData[0].settings.reg;
    case "rmessage":
      return settingsData[0].settings.rmessage;
    case "rremove":
      return settingsData[0].settings.rremove;
    case "setting":
      return settingsData[0].settings.setting;
  }
}