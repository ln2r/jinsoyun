/**
 * setArrayDataFormat
 * Used to format array data to list style data
 * @param {Array} data the array data
 * @param {String} symbol list symbol
 * @param {Boolean} newline add new line at every start of the item or not
 * @return {String} formatted list-like data
 */
module.exports = function(data, symbol, newline) {
  if (data.length === 0) {
    return '\n- *No data available*';
  }

  let formattedData = '';

  if (newline === true) {
    newline = '\n';
  } else {
    newline = '';
  }

  for (let i = 0; i < data.length; i++) {
  // checking if the data in that index is empty or not
    if (data[i] !== '' || data[i] !== undefined) {
      formattedData = formattedData + (newline + symbol + data[i]);
    }
  }

  if (formattedData === '') {
    formattedData = '\n- *No data available*';
  }

  return formattedData;
};
