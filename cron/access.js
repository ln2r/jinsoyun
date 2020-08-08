const utils = require('../utils/index.js');
const dateformat = require('dateformat');
const services = require('../services/index');

/**
 * access
 * Used to send access Notification
 * @param {Object} clientData 
 * @param {String} type 
 */
module.exports = async (clientData, type) => {
  let typeName = type.replace(/(^|\s)\S/g, (l) => l.toUpperCase());
  let settingName = `${type}_announce`;

  services.sendLog('info', typeName, `Sending ${typeName} notification...`);
  services.sendLog('debug', 'Access', `type: ${type}, typeName: ${typeName}, settingName: ${settingName}`);

  // checking global settings
  const globalSettings = await utils.getGlobalSetting(settingName);
  if (!globalSettings.status) {
    services.sendLog('warn', typeName, `${typeName} access notification disabled, ${globalSettings.message}`);
    return;
  }

  clientData.guilds.cache.map(async function(guild) {    
    if(guild.available){
      // getting guild setting data
      const guildSettingData = await utils.getGuildSettings(guild.id);

      // getting settings data and selecting dungeon names
      let selectedChannel;
      let dungonName;
      if (guildSettingData !== undefined) {       
        switch(type){
        case'koldrak':
          selectedChannel = guildSettingData.koldrak;
          dungonName = 'Koldrak\'s Lair';
          break;
        case 'hunter':
          selectedChannel = guildSettingData.hunter;
          dungonName = 'Hunter\'s Refugee';
          break;
        }
      }

      services.sendLog('debug', 'Access', `selectedChannel: ${selectedChannel}, dungeonName: ${dungonName}`);

      // finding and sending the message
      let found = 0;
      guild.channels.cache.map((ch) => {
        if (found === 0) {
          if (ch.id === selectedChannel && selectedChannel !== '' && selectedChannel !== 'disable') {
            services.sendLog('debug', typeName, `Sending one to ${guild.name}...`);
            found = 1;
            if (ch.permissionsFor(clientData.user).has('VIEW_CHANNEL') && ch.permissionsFor(clientData.user).has('SEND_MESSAGES')) {
              ch.send({
                'embed': {
                  'color': 8388736,
                  'description': `**${dungonName}** will be accessible in **10 Minutes**`,
                  'author': {
                    'name': 'Dungeon Access Alert',

                  },
                  'footer': {
                    'icon_url': 'https://cdn.discordapp.com/emojis/463569668045537290.png',
                    'text': 'Generated at '+dateformat(Date.now(), 'UTC:dd-mm-yy @ HH:MM')+' UTC',
                  },
                },
              });
              
              services.sendLog('debug', typeName, 'Notification sent sucessfully.');
            }else{
              services.sendLog('warn', typeName, `Failed to notify "${guild.name}", issue with permission.`);
            }
          }
        }
      });
    }
  });
  await services.sendLog('info', typeName, 'Koldrak access notification sent to guilds.');
  return;
};
