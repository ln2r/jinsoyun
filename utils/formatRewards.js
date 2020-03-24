const utils = require('./index')

/**
 * setRewardsDataFormat
 * formatting the rewards data
 * @param {Array} data array of rewards items
 * @return {Array} formatted rewards data
 */
module.exports = function(data){
  let formattedData = [];
  for(let i=0; i<data.length; i++){
      let itemsList = utils.formatArray(data[i].rewards, "- ", true);
      formattedData.push("**"+data[i].tier+" Completions**"+itemsList);
  }

  return formattedData;
}