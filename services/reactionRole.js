const utils = require('../utils/index.js');

const reactionEvents = {
  MESSAGE_REACTION_ADD: 'messageReactionAdd',
	MESSAGE_REACTION_REMOVE: 'messageReactionRemove',
};

module.exports = function(event, clientDiscord){
  /**
   * Original algorithm by Sam-DevZ
   * https://github.com/Sam-DevZ/Discord-RoleReact
   */

  // check if the event have the reactions property
  if(!reactionEvents.hasOwnProperty(event.t)) return;
  const { d: data } = event;
  const user = clientDiscord.users.get(data.user_id);

  // check if it's the bot
  if(data.user_id === clientDiscord.user.id) return;
  
  // get role data from db
  let guildSettings = await getGuildSettings(data.guild_id);

  if(guildSettings && guildSettings.length !== 0){
    guildReactionRoleData = guildSettings.settings.react_role;

    if(guildReactionRoleData){
      const channel = clientDiscord.channels.get(data.channel_id);
      // checking channel and finding the message
      let found = false;
      let messageIndex;

      for(let i=0; i<guildReactionRoleData.length; i++){
        if(guildReactionRoleData[i].channel === data.channel_id && guildReactionRoleData[i].id === data.message_id){
          messageIndex = i;
          found = true;
        };
      };

      if(found){
        // checking the message
        if(data.message_id === guildReactionRoleData[messageIndex].id){
          let message;
          let member;

          // for error debugging, remove later
          try{
            message = await channel.fetchMessage(data.message_id);
            member = message.guild.members.get(user.id);
          }catch(err){
            clientDiscord.owners[i].send(
              'Error Occured on `'+error.name+'`'+
                '\n__Details__:'+
                '\n**Time**: '+dateformat(Date.now(), 'dddd, dS mmmm yyyy, h:MM:ss TT')+
                '\n**Location**: '+data.guild_id+
                '\n**Content**: '+err+
                '\n**Message**:\n'+message
            )
          }

          // checking the emoji and getting the index
          if(guildReactionRoleData[messageIndex].reactions){
            let emojiData;
            if(data.emoji.id){
              emojiData = data.emoji.name+":"+data.emoji.id;
            }else{
              emojiData = data.emoji.name;
            };

            // checking the emoji and getting the role id
            let reactionFound = false;
            let reactionIndex;
            for(let i=0; i<guildReactionRoleData[messageIndex].reactions.length; i++){
              if(guildReactionRoleData[messageIndex].reactions[i].emoji === emojiData){
                reactionFound = true;
                reactionIndex = i;
              };
            };

            if(reactionFound){
              // checking if once
              if(guildReactionRoleData[messageIndex].reactions[reactionIndex].once){
                member.addRole(guildReactionRoleData[messageIndex].reactions[reactionIndex].role);
                // removing the reaction
                channel.fetchMessage(guildReactionRoleData[messageIndex].id).then(message => {
                  let filtered = message.reactions.filter(reaction => reaction.emoji.name === data.emoji.name);

                  filtered.forEach(reaction => reaction.remove(user.id));
                });
              }else{
                // check if the event add or remove
                if(event.t === "MESSAGE_REACTION_ADD"){
                  member.addRole(guildReactionRoleData[messageIndex].reactions[reactionIndex].role);
                }else{
                  member.removeRole(guildReactionRoleData[messageIndex].reactions[reactionIndex].role)
                };
              };
            };
          };                
        };
      };
    };
  };
}