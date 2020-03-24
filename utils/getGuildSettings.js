const utils = require('./index');

/**
 * getGuildSettings
 * getting guild setting data
 * @param {Snowflake} guildId current guild id
 * @return {Object | null} guild setting data
 */
module.exports = function(){
  let guildData = await utils.fetchDB('configs', {guild: guildId});
    
  if(guildData.length !== 0){
    return guildData[0];
  }else{
    return null;
  }
}