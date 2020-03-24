const utils = require('./index');

/**
 * getRewards
 * getting rewards list with the tier
 * @param {String} challengesType challenges day/type
 * @return {Array} formatted rewards list
 */
module.exports = async function(name){
  let eventData = await utils.fetchDB("events", {});
  let eventRewards;
  let challengesData = await utils.fetchDB("challenges", {name: name});
  let challengesRewards;

  challengesRewards = challengesData[0].rewards;
  eventRewards = eventData[0].rewards.daily;

  // adding event rewards
  if (eventRewards.length !== 0) {
    for(let i=0; i<eventRewards.length; i++){
      challengesRewards.push(
        {
          name: eventRewards[i].name + " (Event)",
          tier: eventRewards[i].tier
        }
      );
    }      
  };

  let tieredRewardsList = []
  // getting the tier
  for(let i=0; i<challengesRewards.length; i++){
    let currentTier = challengesRewards[i].tier;
    if(challengesRewards[i].tier === currentTier){
      // gathering rewards which have the same tier
      let currentTierRewards = [];
      for(let j=0; j<challengesRewards.length; j++){
        if(challengesRewards[j].tier === currentTier){
          currentTierRewards.push(challengesRewards[j].name);
        }
      }

      // checking if the tier already exist to prevent duplicate
      let found = false;
      for(let j=0; j<tieredRewardsList.length; j++){
        if(tieredRewardsList[j].tier === currentTier){
          found = true;
        }
      }
      if(!found){
        tieredRewardsList.push({
          tier: currentTier,
          rewards: currentTierRewards
        });
      }
    }
  }

  // sorting the rewards
  tieredRewardsList = tieredRewardsList.sort(function(a, b){return a.tier - b.tier});

  return tieredRewardsList;
}