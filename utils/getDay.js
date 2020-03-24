/**
 * getDay
 * Used to get the text value of the current date
 * @param {Date} date date data
 * @param {String} type return type, currently only support "now"
 * @return day value
 * @example
 * getDay("Fri Mar 01 2019 14:49:58 GMT+0700", "now") // return Friday
 */
module.exports = function(date, type){
  let dayValue;

  if (type === 'now') {
    dayValue = dateformat(date, 'dddd', true);
  } else {
    date = new Date(date);
    date.setDate(date.getDate()+ 1);

    dayValue = dateformat(date, 'dddd', true);
  }

  return dayValue;
}