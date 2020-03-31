/**
 * getUTCTimeDifference
 * Used to get time difference in UTC
 * @param {Array} data time data, preferably array of time data
 * @return {Object} containing closest time index and time difference data
 */
module.exports = function(data) {
  if (data.constructor !== Array) {
    data = [data];
  }

  const now = new Date();
  const timeNow = new Date(0, 0, 0, now.getUTCHours(), now.getMinutes());

  let closestTime;
  let timeDifferenceData;
  let timeDifferenceHourMax = 24;

  // console.debug("[core] [time difference] now: "+timeNow);

  for (let i = 0; i < data.length; i++) {
    const timeData = new Date(0, 0, 0, data[i], 0);
    // console.debug("[core] [time difference] time data "+timeData);

    const timeRemaining = (timeData - timeNow);
    // console.debug("[core] [time difference] current: "+timeData);
    // console.debug("[core] [time difference] remain: "+timeRemaining);

    // formatting the data
    const timeDifferenceHour = Math.abs(Math.floor(timeRemaining / 1000 / 60 / 60));
    // use extra variable so "timerRemaining" variable remain unchanged
    const timeDifferenceHourRaw = timeRemaining - (timeDifferenceHour * 1000 * 60 *60);

    const timeDifferenceMinute = Math.abs(Math.floor(timeDifferenceHourRaw / 1000 / 60));

    // console.debug("[core] [time difference] left: "+timeDifferenceHour+"h "+timeDifferenceMinute+"m")

    // checking if current time is smaller than last one or not
    if (timeDifferenceHour <= timeDifferenceHourMax && timeRemaining > 0) {
      timeDifferenceHourMax = timeDifferenceHour;
      closestTime = i;
      // storing the formatted data into an array
      timeDifferenceData = [timeDifferenceHour, timeDifferenceMinute];
    }
  }
  // console.debug("[core] [time difference] selected: "+new Date(0, 0, 0, data[closestTime], 0));
  // console.debug("[core] [time difference] time left: "+timeDifferenceData[0]+" hours, "+timeDifferenceData[1]+" minutes");

  return {
    'time_index': closestTime,
    'time_difference_data': timeDifferenceData,
  };
};
