const utils = require('../utils/index');

/**
 * getDaily
 * Used to get specified daily data
 * @param {String} day dddd formatted day value
 * @return object, daily data (reward, quests list)
 */
module.exports = async function(day){
  let challengesData = await utils.fetchDB('challenges', {name: day});

  return {
    // getting the quests list
    quests: challengesData[0].quests,
    rewards: await utils.getRewards(day)
    };
}