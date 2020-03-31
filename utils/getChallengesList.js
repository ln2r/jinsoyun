const fetchDB = require('./fetchDB');

/**
 * getChallengesList
 * getting any data if the dungeon is in any challenges
 * @param {Number} id dungeon id
 * @return {Array} challenges list
 */
module.exports = async function(name) {
  const challengesData = await fetchDB('challenges');
  const challengesList = [];

  // loop for challenges data
  for (let i=0; i<(challengesData.length); i++) {
  // loop for quests list
    for (let j=0; j<challengesData[i].quests.length; j++) {
      // loop for location list
      for (let k=0; k<challengesData[i].quests[j].location.length; k++) {
        // checking the location with the name
        if (challengesData[i].quests[j].location[k] === name) {
          challengesList.push(challengesData[i].name);
        }
      }
    }
  }

  return challengesList;
};
