/**
 * getRoleId
 * getting mentioned role id
 * @param {String} message message data
 * @return {Snowflake | null} mentioned role id
 */
module.exports = function(){
  if(message.startsWith("<@&") && message.endsWith(">")){
    return message.slice(3, -1);
  }else{
    return null;
  }
}