const fetchDB = require('./fetchDB');
const getRewards = require('./getRewards');

/**
 * getDaily
 * Used to get specified daily data
 * @param {String} day dddd formatted day value
 * @return {Object} daily data (reward, quests list)
 */
module.exports = async function(day) {
  const challengesData = await fetchDB('challenges', {name: day});
  // eslint-disable-next-line prefer-const
  let questsList = [];

  for (let i=0; i<challengesData[0].quests.length; i++) {
    // eslint-disable-next-line max-len
    questsList.push(`**${challengesData[0].quests[i].name}** - ${challengesData[0].quests[i].location.join(', ')}`);
  }

  return {
  // getting the quests list
    quests: questsList,
    rewards: await getRewards(day),
  };
};
