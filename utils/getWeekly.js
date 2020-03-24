const utils = require('../utils/index');

/**
 * getWeekly
 * Used to get weekly quest data
 * @return object, weekly data (quests list, rewards)
 */
module.exports = async function(){
  let challengesData = await utils.fetchDB('challenges', {name: "Weekly"});

  return {
    quests: challengesData[0].quests,
    rewards: await utils.getRewards("Weekly")   
  };
}