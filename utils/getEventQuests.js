/**
 * getEventQuests
 * Used to get specified day event data
 * @param {Object} eventData event data object
 * @param {String} day dddd formatted day value
 * @return {Object} event data (quests list, details)
 */
module.exports = async function(eventData, day) {
  const questList = [];

  for (let i = 0; i < eventData.quests.length; i++) {
    for (let j = 0; j < eventData.quests[i].day.length; j++) {
      if (eventData.quests[i].day[j] === day) {
        // eslint-disable-next-line max-len
        questList.push(`**${eventData.quests[i].name}** - ${eventData.quests[i].location.join(', ')}`);
      }
    }
  }

  return questList;
};
