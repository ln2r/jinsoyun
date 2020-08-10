const utils = require('../utils/index');
const sendLog = require('./sendLog');
const configs = require('../config.json');

/**
 * newMember
 * New member welcome system
 * @param {Object} member 
 */
module.exports = async (member) =>{
  const guildSettings = await utils.getGuildSettings(member.guild.id);
  const globalSettings = await utils.getGlobalSetting('welcome');

  if (guildSettings) {
    if(guildSettings.welcome){
      // checking if the guild have the channel and the message set
      if (guildSettings.welcome.status !== 'disable') {
        const guildCommandPrefix = (guildSettings.prefix)? guildSettings.prefix:configs.bot.default_prefix;

        let guildWelcomeMessage = (guildSettings.welcome.message)? guildSettings.welcome.message: globalSettings;
        guildWelcomeMessage = guildWelcomeMessage.replace(/SERVER_NAME/gm, member.guild.name);
        guildWelcomeMessage = guildWelcomeMessage.replace(/MEMBER_NAME/gm, `<@${member.user.id}>`);
        guildWelcomeMessage = guildWelcomeMessage.replace(/BOT_PREFIX/gm, guildCommandPrefix);

        if (guildSettings.welcome.channel) {
          member.guild.channels.cache.find((ch) => ch.id === guildSettings.welcome.channel).send(guildWelcomeMessage);
        }

        sendLog('query', 'Welcome', 'Server welcome requested.');
      }
    }
  }
};