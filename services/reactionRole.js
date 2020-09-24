/* eslint-disable max-len */
const utils = require('../utils/index.js');

/**
 * reactionRole
 * adding or removing user role via reaction
 *
 * @param {Object} reactionData Discord reaction data
 * @param {Object} user Discord user data
 * @param {String} action Reaction action
 * @param {String} botId Bot id
 */
module.exports = async function(reactionData, user, action, botId) {
  if (user.id === botId) return;

  const guildSettings = await utils.getGuildSettings(reactionData.message.channel.guild.id);

  if (guildSettings && guildSettings.react_role) {
    const emojiId = (reactionData.emoji.id)? reactionData.emoji.name+':'+reactionData.emoji.id: reactionData.emoji.name;
    const userMemberData = await reactionData.message.channel.guild.members.fetch(user.id);

    guildSettings.react_role.map((r) => {
      if (reactionData.message.channel.id === r.channel && reactionData.message.id === r.id) {
        r.reactions.map((reactions) => {
          if (reactions.emoji === emojiId) {
            switch (action) {
            case 'add':
              userMemberData.roles.add(reactions.role);
              if (reactions.once) reactionData.users.remove(user.id);
              break;
            case 'remove':
              userMemberData.roles.remove(reactions.role);
              break;
            }
          }
        });
      }
    });
  }
};
