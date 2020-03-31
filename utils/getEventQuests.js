const fetchDB = require('./fetchDB');

/**
 * getEventQuests
 * Used to get specified day event data
 * @param {String} day dddd formatted day value
 * @return object, event data (quests list, details)
 */
module.exports = async function(day) {
  let eventData = await fetchDB('event');
  const questList = [];

  for (let i = 0; i < eventData[0].quests.length; i++) {
    for (let j = 0; j < eventData[0].quests[i].day.length; j++) {
      if (eventData[0].quests[i].day[j] === day) {
        questList.push(`**${eventData[0].quests[i].name}** - ${eventData[0].quests[i].location.join(', ')}`);
      }
    }
  }

  return questList;
};
