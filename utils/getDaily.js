const fetchDB = require('./fetchDB');
const getRewards = require('./getRewards');
const formatArray = require('./formatArray');

/**
 * getDaily
 * Used to get specified daily data
 * @param {String} day dddd formatted day value
 * @return object, daily data (reward, quests list)
 */
module.exports = async function(day) {
  const challengesData = await fetchDB('challenges', {name: day});
  let questsList = [];

  for(let i=0; i<challengesData[0].quests.length; i++){
    questsList.push(`**${challengesData[0].quests[i].name}** - ${challengesData[0].quests[i].location.join(', ')}`);
  }

  return {
  // getting the quests list
    quests: questsList,
    rewards: await getRewards(day),
  };
};
