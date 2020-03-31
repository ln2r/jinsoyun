const dateformat = require('dateformat');
const config = require('../config.json');

module.exports = function(error, command, message, discordClient) {
  let errorLocation;
  let guildOwnerId;

  if (config.bot.maintenance) {
    console.log('[soyun] [error-report] error reporting disabled');
  } else {
    if (message.guild) {
      errorLocation = message.guild.name;
      guildOwnerId = message.guild.ownerID;
    } else {
      errorLocation = 'DIRECT_MESSAGE';
      guildOwnerId = message.author.id;
    }
    // sending the error report to the database
    //sendBotReport(command.name+': '+command.message, error.name+'-'+errorLocation, 'error');
    console.error('[soyun] ['+error.name+'] '+command.name+': '+command.message);

    // dm bot owner for the error
    let found = 0;
    discordClient.guilds.map(function(guild) { // looking for the guild owner data (username and discriminator)
      guild.members.map((member) => {
        if (found === 0) {
          if (member.id === guildOwnerId) {
            found = 1;

            for (let i=0; i < discordClient.owners.length; i++) {
              discordClient.owners[i].send(
                'Error Occured on `'+error.name+'`'+
                  '\n__Details__:'+
                  '\n**Time**: '+dateformat(Date.now(), 'dddd, dS mmmm yyyy, h:MM:ss TT')+
                  '\n**Location**: '+errorLocation+
                  '\n**Guild Owner**: '+member.user.username+'#'+member.user.discriminator+
                  '\n**Content**: `'+message.content+'`'+
                  '\n**Message**:\n'+command.name+': '+command.message
              ).then(
                function(message) {
                  message.react('✅');
                  message.react('❎');
                }
              ).catch((err) => {
                //sendBotReport(err, 'errorDM-soyun', 'error');
              });
            }
          }
        }
      });
    });
  }
};
