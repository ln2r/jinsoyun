const {Command} = require('discord.js-commando');
const utils = require('../../utils/index.js');

module.exports = class NicknameChangeCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'nickname',
      aliases: ['username', 'nickname', 'name'],
      group: 'guild',
      memberName: 'nickname',
      description: 'Change your nickname.',
      examples: ['name <your new nickname>', 'name Jinsoyun'],
      guildOnly: true,
      clientPermissions: ['CHANGE_NICKNAME', 'MANAGE_NICKNAMES'],
      args: [
        {
          key: 'name',
          prompt: 'What\'s the name you want to change to?',
          type: 'string',
          validate: (name) => {
            // checking if the input is empty or not
            if (name.length > 0) {
              return true;
            }
            return 'Nickname can\'t be empty, please check and try again';
          },
        },
      ],
    });
  }

  async run(msg, {name}) {
    msg.channel.startTyping();

    // checking if the command disabled or not
    const globalSettings = await utils.getGlobalSetting('nickname');
    if (!globalSettings.status) {
      msg.channel.stopTyping();

      return msg.say('This command is currently disabled.\nReason: '+globalSettings.message);
    }

    // changing and formatting the nickname
    msg.guild.members.get(msg.author.id).setNickname(name.replace(/(^|\s)\S/g, (l) => l.toUpperCase()));

    msg.channel.stopTyping();
    return msg.say('successfully changed your nickname. hello **'+name+'**! nice to meet you!');
  }
};
