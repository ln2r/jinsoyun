const utils = require('../utils/index');
const dateformat = require('dateformat');

/**
 * automationKoldrak
 * send koldrak access to enabled guild
 */
module.exports = async function(guildData){
  // checking global settings
  let globalSettings = await utils.getGlobalSetting("koldrak_announce");
  if(!globalSettings.status){
    console.log("[soyun] [koldrak] koldrak access notification disabled, "+globalSettings.message);
    return;
  };

  guildData.guilds.map(async function(guild) {
    // getting guild setting data
    let guildSettingData = await utils.getGuildSettings(guild.id);

    let koldrakChannel = '';
    if (guildSettingData !== undefined) {
      koldrakChannel = guildSettingData.settings.koldrak;
    }

    let found = 0;
    guild.channels.map((ch) => {
      if (found === 0) {
        if (ch.id === koldrakChannel && koldrakChannel !== '' && koldrakChannel !== 'disable') {
          found = 1;
          if(ch.permissionsFor(guildData.user).has('EMBED_LINKS', 'SEND_MESSAGES', 'VIEW_CHANNEL')){
            ch.send({
              "embed":{
                "color": 8388736,
                "description": "**Koldrak's Lair** will be accessible in **10 Minutes**",
                "author":{
                  "name": "Epic Challenge Alert",
                  
                },
                "footer":{
                  "icon_url": "https://cdn.discordapp.com/emojis/463569669584977932.png?v=1",
                  "text": "Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ HH:MM")+" UTC"
                }
              }
            });
          };
        };
      };
    });
  });

  console.log("[soyun] [koldrak] koldrak access notification sent");
  
  return;
}