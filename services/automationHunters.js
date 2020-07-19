const utils = require('../utils/index.js');
const dateformat = require('dateformat');
const sendLog = require('./sendLog');

/**
 * automationHunters
 * send koldrak access to enabled guild
 */
module.exports = async function(clientData) {
  sendLog('info', 'Announce-Hunter\'s', 'Sending Hunter\'s Refugee notification...');
  // checking global settings
  const globalSettings = await utils.getGlobalSetting('hunters_refugee');
  if (!globalSettings.status) {
    await sendLog('warn', 'Announce-Hunter\'s', 'Access notification disabled, '+globalSettings.message);
    return;
  }

  clientData.guilds.cache.map(async function(guild) {
    if(guild.available){
      // getting guild setting data
      const guildSettingData = await utils.getGuildSettings(guild.id);

      let huntersChannel = '';
      if (guildSettingData !== undefined) {
        huntersChannel = guildSettingData.hunters_refugee;
      }

      let found = 0;
      guild.channels.cache.map((ch) => {
        if (found === 0) {
          if (ch.id === huntersChannel && huntersChannel !== '' && huntersChannel !== 'disable') {
            sendLog('debug', 'Announce-Hunter\'s', `Sending one to ${guild.name}...`);
            found = 1;
            if (ch.permissionsFor(clientData.user).has('VIEW_CHANNEL') && ch.permissionsFor(clientData.user).has('SEND_MESSAGES')) {
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

              sendLog('debug', 'Announce-Hunter\'s', 'Notification sent sucessfully.');
            }else{
              sendLog('warn', 'Announce-Hunter\'s', `Failed to notify "${guild.name}", issue with permission.`);
            }
          }
        }
      });
    }
  });
  await sendLog('info', 'Announce-Hunter\'s', 'Access notification sent to guilds.');
  return;
};
