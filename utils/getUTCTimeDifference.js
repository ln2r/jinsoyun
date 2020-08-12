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
  let timeDifferenceHourMax = 24;

  sendLog('debug', 'getUTCTimeDifference', `It's now "${timeNow}"`);

  for (let i = 0; i < data.length; i++) {
    const timeData = new Date(0, 0, 0, data[i], 0);
    sendLog('debug', 'getUTCTimeDifference', `Checking ${timeData}`);

    const timeRemaining = (timeData - timeNow);
    sendLog('debug', 'getUTCTimeDifference', `Time remaining: ${timeRemaining}`);

    // formatting the data
    const timeDifferenceHour = Math.abs(Math.floor(timeRemaining / 1000 / 60 / 60));
    // use extra variable so "timerRemaining" variable remain unchanged
    const timeDifferenceHourRaw = timeRemaining - (timeDifferenceHour * 1000 * 60 *60);

    const timeDifferenceMinute = Math.abs(Math.floor(timeDifferenceHourRaw / 1000 / 60));

    sendLog('debug', 'getUTCTimeDifference', `Exact timing: ${timeDifferenceHour}h ${timeDifferenceMinute}m`);

    // checking if current time is smaller than last one or not
    if (timeDifferenceHour <= timeDifferenceHourMax && timeRemaining > 0) {
      timeDifferenceHourMax = timeDifferenceHour;
      closestTime = i;
      // storing the formatted data into an array
      timeDifferenceData = [timeDifferenceHour, timeDifferenceMinute];
    }
  }

  sendLog('debug', 'getUTCTimeDifference', `Selected: ${new Date(0, 0, 0, data[closestTime], 0)}`);
  sendLog('debug', 'getUTCTimeDifference', `Time left: ${timeDifferenceData[0]}h ${timeDifferenceData[1]}`);

  return {
    'index': closestTime,
    'left': timeDifferenceData,
  };
};
