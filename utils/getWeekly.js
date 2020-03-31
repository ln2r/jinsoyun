const fetchDB = require('./fetchDB');
const getRewards = require('./getRewards');

/**
 * getWeekly
 * Used to get weekly quest data
 * @return object, weekly data (quests list, rewards)
 */
module.exports = async function() {
  const challengesData = await fetchDB('challenges', {name: 'Weekly'});
  let questsList = [];

  for(let i=0; i<challengesData[0].quests.length; i++){
    questsList.push(`**${challengesData[0].quests[i].name}** - ${challengesData[0].quests[i].location.join(', ')}`);
  }

  return {
    quests: questsList,
    rewards: await getRewards('Weekly'),
  };
};
