/* eslint-disable no-useless-escape */
const {Command} = require('discord.js-commando');
const utils = require('../../utils/index.js');
const services = require('../../services/index');

module.exports = class ReactionRoleReactionAddCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'radd',
      aliases: ['reactadd', 'ra'],
      group: 'guild',
      memberName: 'radd',
      description: 'Add reaction to message for reaction role',
      examples: ['radd `role` `emoji`', 'radd @role-name :tada:'],
      guildOnly: true,
    });
  }

  async run(msg, args) {
    msg.channel.startTyping();

    // checking if the command disabled or not
    const globalSettings = await utils.getGlobalSetting('radd');
    if (!globalSettings.status) {
      msg.channel.stopTyping();

      return msg.say('This command is currently disabled.\nReason: '+globalSettings.message);
    }

    let msgData;
    let msgEmoji;

    // check permission
    if (await utils.getAuthorPermission(msg, msg.guild.id)) {
      // check if message is selected
      if (!msg.guild.currentMessage) {
        msgData = 'Please select a message first using `rmessage message-id`';
      } else {
        // getting guild's reaction-role data from db
        const guildData = await utils.fetchDB('configs', {guild: msg.guild.id});
        let reactionRoleData;

        // get data from db if there's already some
        if (guildData) {
          reactionRoleData = guildData[0].settings.react_role;
        }

        // checking if user give role
        const roleIdRaw = args.match(/\<\@(.*?)\>/gs);
        if (roleIdRaw) {
          const roleId = utils.getRoleId(roleIdRaw.toString());
          let emojiId;
          // removing unecessary stuff
          if (args.match(/\<\:(.*?)\>/gs)) {
            emojiId = args.replace(roleIdRaw.toString(), '').trim().slice(2, -1);
            msgEmoji = '<:'+emojiId+'>';
          } else {
            emojiId = args.replace(roleIdRaw.toString(), '').trim();
            msgEmoji = emojiId;
          }

          // check if role exist
          const roleData = msg.guild.roles.cache.find((role) => role.id === roleId);
          if (roleData) {
            // find the message
            let messageIndex;
            let messageFound = false;
            for (let i=0; i<reactionRoleData.length; i++) {
              if (reactionRoleData[i].id === msg.guild.currentMessage) {
                messageIndex = i;
                messageFound = true;
              }
            }

            // add reaction and save to db
            if (messageFound) {
              // get the message
              msg.channel.fetch(msg.guild.currentMessage)
                .then(m => {
                  m.messages.cache.map(x =>{
                    if(x.id == msg.guild.currentMessage){
                      x.react(emojiId);
                    }
                  });
                })
                .catch((err) => {
                  services.sendLog('error', 'Reaction Add', err);
                });
              
              // check if the reaction already exist
              let reactionIndex;
              let reactionFound = false;
              if (reactionRoleData[messageIndex].reactions) {
                for (let i=0; i<reactionRoleData[messageIndex].reactions.length; i++) {
                  if (reactionRoleData[messageIndex].reactions[i].emoji === emojiId) {
                    reactionIndex = i;
                    reactionFound = true;
                  }
                }
              }

              // replace the role if it is, insert new if it isn't
              if (reactionFound) {
                reactionRoleData[messageIndex].reactions[reactionIndex].role = roleId;

                msgData = 'Replaced '+msgEmoji+' with <@&'+roleId+'>';
              } else {
                if (reactionRoleData[messageIndex].reactions === undefined || reactionRoleData[messageIndex].reactions.length === 0) {
                  reactionRoleData[messageIndex].reactions = [{emoji: emojiId, role: roleId, once: false}];
                } else {
                  reactionRoleData[messageIndex].reactions.push({emoji: emojiId, role: roleId, once: false});
                }

                msgData = 'Assigned '+msgEmoji+' with <@&'+roleId+'>';
              }

              // saving
              this.client.emit('guildReactionRoleChange', msg.guild.id, reactionRoleData);
            } else {
              msgData = 'I can\'t find any messages, try to add or select one using `rmessage`';
            }
          } else {
            msgData = 'It seems I can\'t find that role.';
          }
        } else {
          msgData = 'It seems I can\'t find any role there.';
        }
      }
    } else {
      msgData = 'You don\'t have the permission to use that command.';
    }

    msg.channel.stopTyping();

    return msg.say(msgData);
  }
};
