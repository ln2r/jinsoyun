const utils = require('./index');

/**
 * getAuthorPermission
 * getting message author permission for commands
 * @param {Object} messageData 
 * @param {String} guildId 
 * @return {Boolean} permission boolean
 */
module.exports = async function(messageData, guildId){
  let configsData = await utils.fetchDB(guildId);
  let guildAdminRolesData = configsData.settings.admin_roles;
  let found;

  // checking if the guild have admin roles set
  if(guildAdminRolesData && guildAdminRolesData !== null){
    // check if its the guild owner
    if(messageData.author.id === messageData.guild.ownerID){
      return true;
    }

    // checking author roles
    messageData.member.roles.map((role) => {
      for(let i=0; i<guildAdminRolesData.length; i++){
        if(guildAdminRolesData[i] === role.id){
          found = true;
        }
      }
    })

    return (found)? true : false;
  }else{
    return messageData.channel.permissionsFor(messageData.author).has("MANAGE_ROLES", false)
  }
}