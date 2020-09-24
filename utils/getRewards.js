const fetchDB = require('./fetchDB');
const getGlobalSetting = require('./getGlobalSetting');
const sendLog = require('../services/sendLog');

/**
 * getRewards
 * getting rewards list with the tier
 * @param {String} name challenges name/type
 * @return {Array} formatted rewards list
 */
module.exports = async function(name) {
  const ChallengesData = await fetchDB('challenges', {name: name});
  // eslint-disable-next-line prefer-const
  let ChallengesRewards = ChallengesData[0].rewards;

  // adding event rewards
  const EventStatus = await getGlobalSetting('event');
  if (EventStatus.status) {
    const EventData = await fetchDB('event', {});
    // eslint-disable-next-line max-len
    const EventRewards = (name === 'Weekly')? EventData[0].rewards.weekly : EventData[0].rewards.daily;

    if (EventRewards.length !== 0) {
      for (let i=0; i<EventRewards.length; i++) {
        ChallengesRewards.push(
          {
            name: EventRewards[i].name + ' (Event)',
            tier: EventRewards[i].tier,
          },
        );
      }
    }
  } else {
    sendLog('warn', 'getRewards', 'Event rewards not shown, event disabled.');
  }

  let TieredRewardsList = [];
  // getting the tier
  for (let i=0; i<ChallengesRewards.length; i++) {
    const currentTier = ChallengesRewards[i].tier;
    if (ChallengesRewards[i].tier === currentTier) {
      // gathering rewards which have the same tier
      const currentTierRewards = [];
      for (let j=0; j<ChallengesRewards.length; j++) {
        if (ChallengesRewards[j].tier === currentTier) {
          currentTierRewards.push(ChallengesRewards[j].name);
        }
      }

      // checking if the tier already exist to prevent duplicate
      let Found = false;
      for (let j=0; j<TieredRewardsList.length; j++) {
        if (TieredRewardsList[j].tier === currentTier) {
          Found = true;
        }
      }
      if (!Found) {
        TieredRewardsList.push({
          tier: currentTier,
          rewards: currentTierRewards,
        });
      }
    }
  }

  // sorting the rewards
  TieredRewardsList = TieredRewardsList.sort(function(a, b) {
    return a.tier - b.tier;
  });

  return TieredRewardsList;
};
