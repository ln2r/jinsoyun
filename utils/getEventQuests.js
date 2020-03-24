const utils = require('./index');

/**
 * getEventQuests
 * Used to get specified day event data
 * @param {String} day dddd formatted day value
 * @return object, event data (quests list, details)
 */
module.exports = async function(day){
  let eventData = await utils.fetchDB('events', {});
      eventData = eventData[0];

  const questList = [];

  for (let i = 0; i < eventData.quests.length; i++) {
    for (let j = 0; j < 7; j++) {
      if (eventData.quests[i].day[j] === day) {
        questList.push(eventData.quests[i]);
      }
    }
  }
  
  return questList;
}