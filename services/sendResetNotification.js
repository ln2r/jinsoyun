const dateformat = require('dateformat');
const utils = require('../utils/index.js');
const sendLog = require('./sendLog');

/**
 * sendResetNotification
 * Used to send quest reset notification
 * @param {Guild} clientGuildData discord bot client guild/server connected data
 */
module.exports = async function(clientData) {
  const eventSetting = await utils.getGlobalSetting('event');
  const dailySetting = await utils.getGlobalSetting('daily');
  const weeklySetting = await utils.getGlobalSetting('weekly');

  const todayDay = utils.getDay(Date.now(), 'now');

  const fieldsData = [];

  if (eventSetting.status) {
    const eventData = await utils.fetchDB('event');
    const eventQuests = await utils.getEventQuests(eventData[0], todayDay);

    fieldsData.push({
      'name': 'Event',
      'value': '**Name**: ['+eventData[0].name+']('+eventData[0].event_page+')\n'+
              '**Duration**: '+eventData[0].duration+'\n'+
              '**Redemption Period**: '+eventData[0].redeem+'\n'+
              '**Quests**'+utils.formatArray(eventQuests, '- ', true)+'\n\u200B',
    });
  }

  if (dailySetting.status) {
    const dailiesData = await utils.getDaily(todayDay);
    const dailiesRewards = utils.formatRewards(dailiesData.rewards);

    fieldsData.push({
      'name': 'Daily Challenges',
      'value': '**Rewards**'+utils.formatArray(dailiesRewards, '', true)+'\n\u200B'+
              '**Quests**'+utils.formatArray(dailiesData.quests, '- ', true)+'\n\u200B',
    });
  }

  if (todayDay === 'Wednesday' && weeklySetting.status) {
    const weekliesData = await utils.getWeekly();
    const weekliesRewards = utils.formatRewards(weekliesData.rewards);

    fieldsData.push({
      'name': 'Weekly Challenges',
      'value': '**Rewards**'+utils.formatArray(weekliesRewards, '', true)+'\n\u200B'+
                '**Quests**'+utils.formatArray(weekliesData.quests, '- ', true)+'\n\u200B',
    });
  }

  const msgData = 'Hello! It\'s time for reset. Have a good day!';

  const embedData = {
    'embed': {
      'author': {
        'name': todayDay+'\'s List - '+dateformat(Date.now(), 'UTC:dd-mmmm-yyyy'),
        'icon_url': 'https://cdn.discordapp.com/emojis/464038094258307073.png?v=1',
      },
      'color': 1879160,
      'footer': {
        'text': 'Reset Notification - Generated at '+dateformat(Date.now(), 'UTC:dd-mm-yy @ HH:MM')+' UTC',
      },
      'fields': fieldsData,
    },
  };

  clientData.guilds.cache.map(async function(guild) {  
    if (guild.available) {
      // getting guild setting data
      let guildSettingData = await utils.getGuildSettings(guild.id);
      let resetChannel = '';
      if (guildSettingData !== undefined) {
        resetChannel = guildSettingData.quest_reset;
      }

      let found = 0;
      guild.channels.cache.map((ch) => {
        if (found === 0) {
          if (ch.id === resetChannel) {
            found = 1;
            if (ch.permissionsFor(clientData.user).has('EMBED_LINKS', 'SEND_MESSAGES', 'VIEW_CHANNEL')) {
              ch.send(msgData, embedData);
            }
          }
        }
      });
    }
  });
  sendLog('info', 'Reset', 'Reset notification sent');
};
