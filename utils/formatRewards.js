const formatArray = require('./formatArray');

/**
 * setRewardsDataFormat
 * formatting the rewards data
 * @param {Array} data array of rewards items
 * @return {Array} formatted rewards data
 */
module.exports = function(data) {
  const formattedData = [];
  for (let i=0; i<data.length; i++) {
    const itemsList = formatArray(data[i].rewards, '- ', true);
    formattedData.push('**'+data[i].tier+' Completions**'+itemsList);
  }

  return formattedData;
};
