/* eslint-disable max-len */
const sendLog = require('../services/sendLog');

/**
 * getUTCTimeDifference
 * Used to get time difference in UTC
 * @param {Array} data time data, preferably array of time data
 * @return {Object} containing closest time index and time difference data
 */
module.exports = (data) => {
  if (data.constructor !== Array) {
    data = [data];
  }

  const now = new Date();
  const timeNow = new Date(0, 0, 0, now.getUTCHours(), now.getMinutes());

  let closestTime;
  let timeDifferenceData;
  let differenceHourMax = 24;

  sendLog('debug', 'getUTCTimeDifference', `It's now "${timeNow}"`);

  for (let i = 0; i < data.length; i++) {
    const timeData = new Date(0, 0, 0, data[i], 0);
    sendLog('debug', 'getUTCTimeDifference', `Checking ${timeData}`);

    const timeRemaining = (timeData - timeNow);
    sendLog('debug', 'getUTCTimeDifference', `Time remaining: ${timeRemaining}`);

    // formatting the data
    const differenceHour = Math.abs(Math.floor(timeRemaining / 1000 / 60 / 60));
    // use extra variable so "timerRemaining" variable remain unchanged
    const differenceHourRaw = timeRemaining - (differenceHour * 1000 * 60 *60);

    const differenceMinute = Math.abs(Math.floor(differenceHourRaw / 1000 / 60));

    sendLog('debug', 'getUTCTimeDifference', `Exact timing: ${differenceHour}h ${differenceMinute}m`);

    // checking if current time is smaller than last one or not
    if (differenceHour <= differenceHourMax ) {
      differenceHourMax = differenceHour;
      closestTime = i;
      // storing the formatted data into an array
      timeDifferenceData = [differenceHour, differenceMinute];
    }
  }

  sendLog('debug', 'timeDiff', `Index: ${closestTime}, ${data[closestTime]}`);
  sendLog('debug', 'timeDiff', `Selected: ${new Date(0, 0, 0, data[closestTime], 0)}`);
  sendLog('debug', 'timeDiff', `Time left: ${timeDifferenceData[0]}h ${timeDifferenceData[1]}`);

  return {
    'index': closestTime,
    'left': timeDifferenceData,
  };
};
