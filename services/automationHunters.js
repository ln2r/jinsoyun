const utils = require('../utils/index.js');
const dateformat = require('dateformat');
const sendLog = require('./sendLog');

/**
 * automationHunters
 * send koldrak access to enabled guild
 */
module.exports = async function(guildData) {
  // checking global settings
  const globalSettings = await utils.getGlobalSetting('hunters_refugee');
  if (!globalSettings.status) {
    sendLog('warn', 'Hunter\'s Access', 'Access notification disabled, '+globalSettings.message);
    return;
  }

  guildData.cache.map(async function(guild) {
    if(guild.available){
      // getting guild setting data
      const guildSettingData = await utils.getGuildSettings(guild.id);

      let huntersChannel = '';
      if (guildSettingData !== undefined) {
        huntersChannel = guildSettingData.settings.hunters_refugee;
      }

      let found = 0;
      guild.channels.cache.map((ch) => {
        if (found === 0) {
          if (ch.id === huntersChannel && huntersChannel !== '' && huntersChannel !== 'disable') {
            found = 1;
            if (ch.permissionsFor(guildData.user).has('EMBED_LINKS', 'SEND_MESSAGES', 'VIEW_CHANNEL')) {
              ch.send({
                'embed': {
                  'color': 8388736,
                  'description': '**Hunter\'s Refugee** will be accessible in **10 Minutes**',
                  'author': {
                    'name': 'Event Alert',

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
  sendLog('info', 'Hunter\'s Access', 'Access notification sent');
  return;
};
