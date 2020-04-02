const dateformat = require('dateformat');
const utils = require('../utils/index.js');
const sendLog = require('./sendLog');

/**
 * sendResetNotification
 * Used to send quest reset notification
 * @param {Guild} clientGuildData discord bot client guild/server connected data
 */
module.exports = async function(clientGuildData) {
  const eventSetting = await utils.fetchDB('event');
  const dailySetting = await utils.fetchDB('daily');
  const weeklySetting = await utils.fetchDB('weekly');

  const todayDay = utils.getDay(Date.now(), 'now');

  const fieldsData = [];

  if (eventSetting.status) {
    const eventData = await utils.getEventQuests(todayDay);

    fieldsData.push({
      'name': 'Event',
      'value': '**Name**: ['+eventData.name+']('+eventData.url+')\n'+
              '**Duration**: '+eventData.duration+'\n'+
              '**Redemption Period**: '+eventData.redeem+'\n'+
              '**Quests**'+utils.formatArray(eventData.quests, '- ', true)+'\n\u200B',
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

  clientGuildData.cache.map(async function(guild) {
  // getting guild setting data
    if (guild.available) {
      let guildSettingData = await utils.fetchDB('configs', {guild: guild.id});
      guildSettingData = guildSettingData[0];
      let resetChannel = '';
      if (guildSettingData !== undefined) {
        resetChannel = guildSettingData.settings.quest_reset;
      }

      let found = 0;
      guild.channels.cache.map((ch) => {
        if (found === 0) {
          if (ch.id === resetChannel) {
            found = 1;
            ch.send(msgData, embedData);
          }
        }
      });
    }
  });
  sendLog('info', 'Reset', 'Reset notification sent');
};
