const config = require('../config.json');
const utils = require('../utils/index.js');

module.exports = async function(member) {
  const guildSettingData = await utils.fetchDB(member.guild.id);
  let guildCommandPrefix = guildSettingData.settings.prefix;

  if (guildCommandPrefix === undefined || guildCommandPrefix === null) {
    guildCommandPrefix = config.bot.default_prefix;
  }

  if (guildSettingData) {
    const memberGate = guildSettingData.settings.member_gate;

    // checking if the guild have the channel and the message set
    // TODO: make the message customizable
    if (memberGate) {
      if (memberGate.channel_id) {
        member.guild.channels.find((ch) => ch.id === memberGate.channel_id).send(
          'Hi <@'+member.user.id+'>! Welcome to ***'+member.guild.name+'***!\n\n'+

          'Before I give you access to the rest of the server I need to know your character\'s name, to do that please use the following command with your information in it\n\n'+

          '`'+guildCommandPrefix+'join character name`\n'+
          '**Example**:\n'+
          '`'+guildCommandPrefix+'join jinsoyun `\n\n'+

          'if you need any assistance you can mention or DM available admins, thank you ❤'
        );
      }
    }
  }
};

