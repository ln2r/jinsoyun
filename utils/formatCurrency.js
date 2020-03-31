/**
 * formatCurrency
 * Used to set the currency format to more readable version
 * Note: for this one the function using discord emoji as the symbol
 * @param {Number} Number nominal
 * @return formatted data
 * @example
 * formatCurrency(2000) // return 20s0c
 */
module.exports = function(data) {
  let str = Math.round(data);
  str = str.toString();
  const len = str.length;
  let gold = '';
  let silver = '';
  let copper = '';

  if (len > 4) {
    gold = str.substring( 0, len -4)+ '<:gold:463569669496897547>';
  }
  if (len > 2) {
    silver = str.substring( len -2, len - 4 )+ '<:silver:463569669442371586>';
  }
  if (len > 0) {
    copper = str.substring( len, len -2 )+ '<:copper:463569668095868928>';
  }

  const total = gold + silver + copper;
  return total;
};
