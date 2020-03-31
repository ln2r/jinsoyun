const fetchDB = require('./fetchDB');

/**
 * getRewards
 * getting rewards list with the tier
 * @param {String} challengesType challenges day/type
 * @return {Array} formatted rewards list
 */
module.exports = async function(name) {
  const eventData = await fetchDB('event', {});
  let eventRewards;
  const challengesData = await fetchDB('challenges', {name: name});
  let challengesRewards;

  challengesRewards = challengesData[0].rewards;
  eventRewards = (name === 'Weekly')? eventData[0].rewards.weekly : eventData[0].rewards.daily;

  // adding event rewards
  if (eventRewards.length !== 0) {
    for (let i=0; i<eventRewards.length; i++) {
      challengesRewards.push(
        {
          name: eventRewards[i].name + ' (Event)',
          tier: eventRewards[i].tier,
        }
      );
    }
  }

  let tieredRewardsList = [];
  // getting the tier
  for (let i=0; i<challengesRewards.length; i++) {
    const currentTier = challengesRewards[i].tier;
    if (challengesRewards[i].tier === currentTier) {
      // gathering rewards which have the same tier
      const currentTierRewards = [];
      for (let j=0; j<challengesRewards.length; j++) {
        if (challengesRewards[j].tier === currentTier) {
          currentTierRewards.push(challengesRewards[j].name);
        }
      }

      // checking if the tier already exist to prevent duplicate
      let found = false;
      for (let j=0; j<tieredRewardsList.length; j++) {
        if (tieredRewardsList[j].tier === currentTier) {
          found = true;
        }
      }
      if (!found) {
        tieredRewardsList.push({
          tier: currentTier,
          rewards: currentTierRewards,
        });
      }
    }
  }

  // sorting the rewards
  tieredRewardsList = tieredRewardsList.sort(function(a, b) {
    return a.tier - b.tier;
  });

  return tieredRewardsList;
};
