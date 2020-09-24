/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
const {Command} = require('discord.js-commando');
const utils = require('../../utils/index.js');
const services = require('../../services/index');

module.exports = class ReactionRoleMessageCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'rmessage',
      aliases: ['reactmessage', 'rm'],
      group: 'guild',
      memberName: 'rmessage',
      description: 'Set/remove a message for reaction role',
      examples: ['rmessage `message-id`', 'rmessage 123451234512345123'],
      guildOnly: true,
    });
  }

  async run(msg, args) {
    msg.channel.startTyping();

    // checking if the command disabled or not
    const globalSettings = await utils.getGlobalSetting('rmessage');
    if (!globalSettings.status) {
      msg.channel.stopTyping();

      return msg.say(`Command disabled. ${globalSettings.message}`);
    }

    let msgData;
    let embedData;

    // check permission
    if (await utils.getAuthorPermission(msg, msg.guild.id)) {
      let reactionMessageData;

      // getting guild's reaction-role data from db
      const guildData = await utils.getGuildSettings(msg.guild.id);
      let reactionRoleData = guildData.react_role;

      // initialize if it's empty
      if (!reactionRoleData) {
        reactionRoleData = reactionRoleData = [];
      }

      // checking if the user gave something like a message id
      if (args.length >= 15 && /^[0-9]*$/.test(args)) {
        const messageId = args;

        // checking if the selected message is saved
        let found = false;
        for (let i=0; i<reactionRoleData.length; i++) {
          if (reactionRoleData[i].id === messageId) {
            found = true;
          }
        }

        // check and get message data
        reactionMessageData = await msg.channel.messages.fetch(messageId).catch(async (err) => {
          await services.sendLog('error', 'Reaction Message', err);
          reactionMessageData = false;
        });

        if (reactionMessageData) {
          // present message content and url
          if (!found) {
            reactionRoleData.push({id: messageId, channel: msg.channel.id});

            this.client.emit('guildReactionRoleChange', msg.guild.id, reactionRoleData);

            msgData = 'Reaction-role message has been added and selected.';
          } else {
            msgData = 'Reaction-role message with id: `'+messageId+'` selected.';
          }

          const messageFields = [{
            'name': 'Message Id',
            'value': messageId,
          },
          {
            'name': 'Content',
            'value': reactionMessageData.content,
          }];

          // adding embeds data if available
          if (reactionMessageData.embeds) {
            reactionMessageData.embeds.map((embeds, index) => {
              messageFields.push({
                'name': `Message Embed ${index+1}`,
                'value': `Title: ${embeds.title}
                Description: ${embeds.description}`,
              });
            });
          }

          msg.guild.currentMessage = messageId;
          embedData = {
            'embed': {
              'title': 'Message Data',
              'url': 'https://discordapp.com/channels/'+msg.guild.id+'/'+msg.channel.id+'/'+messageId,
              'description': 'Click title to see the original message.',
              'color': 2061822,
              'fields': messageFields,
            },
          };
        } else {
          msgData = 'Can\'t find message with id: `'+messageId+'` (use command on the same channel).';
        }
      } else {
        msgData = 'That doesn\'t look like a message id';
      }
    } else {
      msgData = 'You don\'t have the permission to use that command.';
    }

    msg.channel.stopTyping();

    return msg.say(msgData, embedData);
  }
};
