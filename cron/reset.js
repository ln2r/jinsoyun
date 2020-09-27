/* eslint-disable max-len */
const dateformat = require('dateformat');
const utils = require('../utils/index.js');
const services = require('../services/index');

/**
 * sendResetNotification
 * Used to send quest reset notification
 * @param {Guild} clientData discord bot client guild/server connected data
 */
module.exports = async (clientData) => {
  // checking global settings
  const globalSettings = await utils.getGlobalSetting('reset');
  if (!globalSettings.status) {
    services.sendLog('warn', 'Reset', `Reset notification disabled, ${globalSettings.message}`);
    return;
  }

  services.sendLog('info', 'Reset', 'Sending reset notification...');
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
      'value': '**Rewards**'+utils.formatArray(dailiesRewards, '', true)+'\n'+
              '**Quests**'+utils.formatArray(dailiesData.quests, '- ', true)+'\n\u200B',
    });
  }

  if (todayDay === 'Wednesday' && weeklySetting.status) {
    const weekliesData = await utils.getWeekly();
    const weekliesRewards = utils.formatRewards(weekliesData.rewards);

    fieldsData.push({
      'name': 'Weekly Challenges',
      'value': '**Rewards**'+utils.formatArray(weekliesRewards, '', true)+'\n'+
                '**Quests**'+utils.formatArray(weekliesData.quests, '- ', true)+'\n\u200B',
    });
  }

  const msgData = 'Quest\'s and dungeon lockout reset in **10 minutes**';

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
      const guildSettingData = await utils.getGuildSettings(guild.id);
      let resetChannel = '';
      if (guildSettingData !== undefined) {
        resetChannel = guildSettingData.quest_reset;
      }

      let found = 0;
      guild.channels.cache.map((ch) => {
        if (found === 0) {
          if (ch.id === resetChannel && resetChannel !== '' && resetChannel !== 'disable') {
            found = 1;
            services.sendLog('debug', 'Reset', `Sending one to "${guild.name}"...`);
            if (ch.permissionsFor(clientData.user).has('VIEW_CHANNEL') && ch.permissionsFor(clientData.user).has('SEND_MESSAGES')) {
              ch.send(msgData, embedData);
              services.sendLog('debug', 'Reset', 'Notification sent sucessfully.');
            } else {
              services.sendLog('warn', 'Reset', `Failed to notify "${guild.name}", issue with permission.`);
            }
          }
        }
      });
    }
  });
  services.sendLog('info', 'Reset', 'Reset notification sent to guilds.');
};
