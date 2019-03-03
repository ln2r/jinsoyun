const { Command } = require('discord.js-commando');
const core = require('../../core.js');

module.exports = class SayCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setting',
            aliases: ['set', 'config'],
            group: 'guild',
            memberName: 'setting',
            description: 'Change the bot setting. \n\tAvailable Settings: \n\t- `reset channel-name|disable` (To configure quest reset notification)\n\t- `twitter channel-name|disable` (To configure blade and soul twitter tweet notification)\n\t- `twitch channel-name|disable` (To configure blade and soul twitch broadcast notification)\n\t- `gate channel-name|disable` (To configure new member message channel)\n\t- `text channel-name|disable` (To configure main text channel)',
            examples: ['setting <option>', 'setting reset channel-name', 'setting reset disable'],
            guildOnly: true,
            userPermission: ['ADMINISTRATOR', 'MANAGE_CHANNELS', 'MANAGE_GUILD', 'MANAGE_MESSAGES', 'MANAGE_NICKNAMES', 'MANAGE_ROLES'],
            args: [
                {
                    key: 'option', 
                    prompt: 'What\'s the name of the option you want to change?', 
                    type: 'string',
                    validate: option => {
                        // if the option is valid or not
                        let optionArg = option.toString().toLowerCase().split(' ');
                        console.debug('[soyun] [setting] optionArg: '+optionArg);

                        let found = false;
                        let options = ['reset', 'twitter', 'twitch', 'gate', 'text'];

                        for(let i = 0; i < options.length; i++){
                            if(optionArg[0] == options[i]){
                                found = true;
                            }
                        }
                        if (found) return true;
                        return 'Setting option is invalid, please check and try again';
                    }
                }
            ]
        });
    }

    run(msg, { option }) {
        option = option.toString().toLowerCase().split(' ');

        let channelName = '';

        if(option.length > 2){
            channelName = option.join('-');
            channelName = channelName.replace((option[0]+'-'), '');
        }else{
            channelName = option[1];
        }

        console.debug('[soyun] [setting] setting option: '+option[0]);
        console.debug('[soyun] [setting] channel name: '+channelName);

        switch(option[0]){
            case 'reset':
                this.client.emit('notificationResetChange', msg.guild.id, channelName);
            break;

            case 'twitter':
                this.client.emit('notificationTwitterChange', msg.guild.id, channelName);
            break;
            
            case 'twitch':
                this.client.emit('notificationTwitchChange', msg.guild.id, channelName);
            break;

            case 'gate':
                this.client.emit('newMemberChannelChange', msg.guild.id, channelName);
            break;

            case 'text':
                this.client.emit('mainTextChannelChange', msg.guild.id, channelName);
            break;
        }

        return msg.say('`'+option[0]+'` setting changed to `'+channelName+'`');
    }
};