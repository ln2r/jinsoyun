const { Command } = require('discord.js-commando');
const core = require('../../core.js');

module.exports = class SayCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'reg',
            aliases: ['join', 'register'],
            group: 'guild',
            memberName: 'reg',
            description: 'Register yourself into the guild so you can access the rest of the guild',
            examples: ['reg <charcter name> <character class', 'reg jinsoyun blade dancer'],
            guildOnly: true,
            clientPermissions: ['MANAGE_ROLES', 'CHANGE_NICKNAME', 'MANAGE_NICKNAMES'],                    
        });
    }

    async run(msg, args) {
        args = args.toLowerCase();
        let classList = ['gunslinger', 'blade dancer', 'destroyer', 'summoner', 'kung fu master', 'assassin', 'force master', 'warlock', 'blade master', 'soul fighter', 'warden'];

        // checking if the class input is valid or not
        let classValid = false;
        for(let i = 0; i < classList.length; i++){
            if(args.includes(classList[i])){
                let guildSettingData = await core.mongoGetData('guilds', {guild: msg.guild.id});
                    guildSettingData = guildSettingData[0];   
                
                // getting the chara name and make it prettier
                let userCharaName = args.replace(classList[i], '');
                    userCharaName = userCharaName.replace(/(^|\s)\S/g, l => l.toUpperCase());

                classValid = true;

                msg.guild.members.get(msg.author.id).addRole(msg.guild.roles.find(role => role.name == classList[i]));
                // Adding 'member' role so user can talk
                msg.guild.members.get(msg.author.id).addRole(msg.guild.roles.find(role => role.name == 'member'));
                // Removing 'cricket' role
                msg.guild.members.get(msg.author.id).removeRole(msg.guild.roles.find(role => role.name == 'cricket'));
                // changing the nickname
                msg.guild.members.get(msg.author.id).setNickname(userCharaName);

                let defaultTextChannel = '';
                if(guildSettingData != undefined){
                    defaultTextChannel = guildSettingData.settings.default_text;
                };
                
                if(defaultTextChannel != '' && defaultTextChannel != 'disable'){
                    // add cricket role so they can't see the rest of the guild until they do join command
                    msg.guild.channels.find(ch => ch.name == defaultTextChannel).send(
                        'Welcome our new '+classList[i]+' <@'+msg.author.id+'>!'
                    );
                }
            }
        }

        console.debug('[soyun] [reg] args value: '+args);
        console.debug('[soyun] [reg] class input is: '+classValid);

        if(classValid == false){
            return msg.say('I can\'t find the class you wrote, please check and try again (class name need to be it\'s full name)');
        }
    }
};