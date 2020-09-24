/**
 * setDataFormatString
 * Used to format Number data/handling empty data
 * @param {Number} data Number data
 * @return {Number} handled data
 */
module.exports = function(data) {
  if (data === '' || data === null || data === undefined) {
    data = 0;
  }

  return data;
};
