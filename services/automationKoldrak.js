const utils = require('../utils/index.js');
const dateformat = require('dateformat');
const sendLog = require('./sendLog');

/**
 * automationKoldrak
 * send koldrak access to enabled guild
 */
module.exports = async function(clientData) {
  sendLog('info', 'Announce-Koldrak', 'Sending Koldrak notification...');
  // checking global settings
  const globalSettings = await utils.getGlobalSetting('koldrak_announce');
  if (!globalSettings.status) {
    await sendLog('warn', 'Announce-Koldrak', 'koldrak access notification disabled, '+globalSettings.message);
    return;
  }

  clientData.guilds.cache.map(async function(guild) {    
    if(guild.available){
      // getting guild setting data
      const guildSettingData = await utils.getGuildSettings(guild.id);

      let koldrakChannel = '';
      if (guildSettingData !== undefined) {
        koldrakChannel = guildSettingData.koldrak;
      }

      let found = 0;
      guild.channels.cache.map((ch) => {
        if (found === 0) {
          if (ch.id === koldrakChannel && koldrakChannel !== '' && koldrakChannel !== 'disable') {
            sendLog('debug', 'Announce-Koldrak', `Sending one to ${guild.name}...`);
            found = 1;
            if (ch.permissionsFor(clientData.user).has('VIEW_CHANNEL') && ch.permissionsFor(clientData.user).has('SEND_MESSAGES')) {
              ch.send({
                'embed': {
                  'color': 8388736,
                  'description': '**Koldrak\'s Lair** will be accessible in **10 Minutes**',
                  'author': {
                    'name': 'Epic Challenge Alert',

                  },
                  'footer': {
                    'icon_url': 'https://cdn.discordapp.com/emojis/463569669584977932.png?v=1',
                    'text': 'Generated at '+dateformat(Date.now(), 'UTC:dd-mm-yy @ HH:MM')+' UTC',
                  },
                },
              });
              
              sendLog('debug', 'Announce-Koldrak', 'Notification sent sucessfully.');
            }else{
              sendLog('warn', 'Announce-Koldrak', `Failed to notify "${guild.name}", issue with permission.`);
            }
          }
        }
      });
    }
  });
  await sendLog('info', 'Announce-Koldrak', 'Koldrak access notification sent to guilds.');
  return;
};
