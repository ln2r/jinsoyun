const { Command } = require('discord.js-commando');
const dateformat = require('dateformat');
const { mongoGetData } = require('../../core');

module.exports = class GuildSettingsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'setting',
            aliases: ['set', 'config', 'change'],
            group: 'guild',
            memberName: 'setting',
            description: 'Change the bot setting. Use `show` to see the current guild/server settings. \n\tAvailable Settings: \n\t- `reset channel-name or disable` (To configure quest reset notification)\n\t- `twitter channel-name or disable` (To configure blade and soul twitter tweet notification)\n\t- `twitch channel-name or disable` (To configure blade and soul twitch broadcast notification)\n\t- `gate channel-name or disable` (To configure new member message channel)\n\t- `text channel-name or disable` (To configure main text channel)',
            examples: ['setting <option>', 'setting reset channel-name', 'setting reset disable'],
            guildOnly: true,
            args: [
                {
                    key: 'option', 
                    prompt: 'What\'s the name of the option you want to change?', 
                    type: 'string',
                    validate: option => {
                        // if the option is valid or not
                        let optionArg = option.toString().toLowerCase().split(' ');
                        //console.debug('[soyun] [setting] optionArg: '+optionArg);

                        let found = false;
                        let options = ['reset', 'twitter', 'twitch', 'gate', 'text', 'show'];

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

    async run(msg, { option }) {
        function settingsDataHandler(value){
            if(value == 'disable'){
                return '*disabled*';
            }else if(value == null){
                return '*not set*';
            }else{
                return value;
            }
        }

        msg.channel.startTyping();
        let msgData = '';

        let authorPermission = msg.channel.permissionsFor(msg.author).has("MANAGE_ROLES", false);
        if(authorPermission){          
            option = option.toString().toLowerCase().split(' ');

            let channelName = '';
            let gateMsgData = '';

            if(option.length > 2){
                channelName = option.join('-');
                channelName = channelName.replace((option[0]+'-'), '');
            }else{
                channelName = option[1];
            }

            //console.debug('[soyun] [setting] ['+msg.guild.name+'] setting option: '+option[0]);
            //console.debug('[soyun] [setting] ['+msg.guild.name+'] channel name: '+channelName);
            //console.debug('[soyun] [setting] ['+msg.guild.name+'] manage roles permission: '+msg.guild.me.hasPermission('MANAGE_ROLES'))
            //console.debug('[soyun] [setting] ['+msg.guild.name+'] cricket role is: '+(msg.guild.roles.find(role => role.name == 'cricket')))

            switch(option[0]){
                case 'reset':
                    this.client.emit('notificationResetChange', msg.guild.id, channelName);

                    msgData = '`'+option[0]+'` setting changed to `'+channelName+'`'+gateMsgData;
                break;

                case 'twitter':
                    this.client.emit('notificationTwitterChange', msg.guild.id, channelName);

                    msgData = '`'+option[0]+'` setting changed to `'+channelName+'`'+gateMsgData;
                break;
                
                case 'twitch':
                    this.client.emit('notificationTwitchChange', msg.guild.id, channelName);

                    msgData = '`'+option[0]+'` setting changed to `'+channelName+'`'+gateMsgData;
                break;

                case 'gate':
                    this.client.emit('newMemberChannelChange', msg.guild.id, channelName);
                    
                    // create cricket role if the bot have the permission
                    if(channelName != 'disable'){
                        if(msg.guild.me.hasPermission('MANAGE_ROLES')){
                            if((msg.guild.roles.find(role => role.name == 'cricket')) == null){
                                msg.guild.createRole({
                                    'name': 'cricket',
                                    'premission': ['SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
                                })
                                gateMsgData = ', `cricket` role created';
                            }                        
                        }                    
                    }

                    msgData = '`'+option[0]+'` setting changed to `'+channelName+'`'+gateMsgData;
                break;

                case 'text':
                    this.client.emit('mainTextChannelChange', msg.guild.id, channelName);

                    msgData = '`'+option[0]+'` setting changed to `'+channelName+'`'+gateMsgData;
                break;

                case 'show':
                    let guildSettingData = await mongoGetData('guilds', {guild: msg.guild.id});

                    msgData = {
                        'embed': {
                            'author': {
                                'name': 'Jinsoyun Bot Settings - '+msg.guild.name,
                                'icon_url': msg.guild.iconURL
                            },
                            'description': 
                                        'Use `help setting` to see how to configure your settings\n'+
                                        '**Quest reset**: '+settingsDataHandler(guildSettingData[0].settings.quest_reset)+'\n'+
                                        '**Twitter notification**: '+settingsDataHandler(guildSettingData[0].settings.twitter)+'\n'+
                                        '**New member channel**: '+settingsDataHandler(guildSettingData[0].settings.member_gate)+'\n'+
                                        '**Default/main text channel**: '+settingsDataHandler(guildSettingData[0].settings.default_text)+'\n'+
                                        '**Commands prefix**: '+settingsDataHandler(guildSettingData[0].settings.prefix)+'\n',
                            'color': 16741688,
                            'footer': {
                                'text': 'Jinsoyun Bot - '+dateformat(Date.now(), "UTC:dd-mm-yy @ HH:MM")+' UTC'
                            }
                        }
                    };
                break;
            }
        }else{
            msgData = 'You don\'t have the permission to use that command';
        }

        msg.channel.stopTyping();

        return msg.say(msgData);
    }
};