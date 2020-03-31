/**
 * setDataFormatString
 * Used to format String data/handling empty data
 * @param {String} data String data
 * @return handled data
 */
module.exports = function(data) {
  if (data === '' || data === null || data === undefined) {
    data = '';
  }

  return data;
};
