/**
 * getChannelId
 * getting mentioned channel id
 * @param {String} message message data
 * @return {Snowflake | null} mentioned channel id
 */
module.exports = function(message) {
  if (message) {
    if (message.startsWith('<#') && message.endsWith('>')) {
      return message.slice(2, -1);
    } else {
      return null;
    }
  } else {
    return null;
  }
};
