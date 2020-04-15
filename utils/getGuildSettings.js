const fetchDB = require('./fetchDB');

/**
 * getGuildSettings
 * getting guild setting data
 * @param {Snowflake} guildId current guild id
 * @return {Object | null} guild setting data
 */
module.exports = async function(guildId) {
  const guildData = await fetchDB('configs', {guild: guildId});

  if (guildData.length !== 0) {
    return guildData[0].settings;
  } else {
    return null;
  }
};
