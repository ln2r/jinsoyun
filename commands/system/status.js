const {Command} = require('discord.js-commando');
const services = require('../../services/index');

module.exports = class ResetNotificationCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'status',
      group: 'system',
      memberName: 'status',
      description: 'Change bot game status.',
      hidden: true,
      ownerOnly: true,
    });
  }

  async run(msg, args) {
    msg.channel.startTyping();

    const payload = args.split(' ');
    const validType = ['playing', 'streaming', 'listening', 'watching'];
    const validStatus = ['online', 'idle', 'dnd'];
    let statusData;

    const type = payload[0];
    const status = payload[1];

    if (validType.indexOf(type) >= 0 && validStatus.indexOf(status) >= 0) {
      const payloadTemp = payload;
      payloadTemp.splice(0, 2);
      const text = payloadTemp.join(' ');

      statusData = {
        activity: {
          name: text,
          type: type.toUpperCase(),
        },
        status: status,
      };

      // changing bot presence
      this.client.user.setPresence(statusData).catch((error) => {
        services.sendLog('error', 'CMD Presence', error);
      });

      // saving to db
      this.client.emit('botGameStatusChange', 'global', statusData);

      msg.channel.stopTyping();

      return msg.say('Bot status changed to `'+status+'`, with type `'+type+'` and message `'+text+'`');
    } else {
      msg.channel.stopTyping();

      return msg.say('Invalid command format.', {
        'embed': {
          'title': 'Valid Format',
          'color': 16741688,
          'fields': [
            {
              'inline': true,
              'name': 'Valid Type',
              'value': '- `playing`\n- `streaming`\n- `listening`\n- `watching`',
            },
            {
              'inline': true,
              'name': 'Valid Status',
              'value': '- `online`\n- `idle`\n- `dnd`',
            },
          ],
        },
      });
    }
  }
};
