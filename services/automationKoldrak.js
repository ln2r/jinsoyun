const utils = require('../utils/index.js');
const dateformat = require('dateformat');
const sendLog = require('./sendLog');

/**
 * automationKoldrak
 * send koldrak access to enabled guild
 */
module.exports = async function(guildData) {
  // checking global settings
  const globalSettings = await utils.getGlobalSetting('koldrak_announce');
  if (!globalSettings.status) {
    sendLog('warn', 'koldrak-announce', 'koldrak access notification disabled, '+globalSettings.message);
    return;
  }

  guildData.cache.map(async function(guild) {    
    if(guild.available){
      // getting guild setting data
      const guildSettingData = await utils.getGuildSettings(guild.id);

      let koldrakChannel = '';
      if (guildSettingData !== undefined) {
        koldrakChannel = guildSettingData.settings.koldrak;
      }

      let found = 0;
      guild.channels.cache.map((ch) => {
        if (found === 0) {
          if (ch.id === koldrakChannel && koldrakChannel !== '' && koldrakChannel !== 'disable') {
            found = 1;
            if (ch.permissionsFor(guildData.user).has('EMBED_LINKS', 'SEND_MESSAGES', 'VIEW_CHANNEL')) {
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
            }
          }
        }
      });
    }
  });
  sendLog('info', 'Koldrak Announce', 'Koldrak access notification sent');
  return;
};
