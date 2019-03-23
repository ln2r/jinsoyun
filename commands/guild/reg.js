const { Command } = require('discord.js-commando');
const { mongoGetData } = require('../../core');

module.exports = class RegCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'reg',
            aliases: ['join', 'register'],
            group: 'guild',
            memberName: 'reg',
            description: 'Register yourself into the guild so you can access the rest of the guild',
            examples: ['reg <charcter name> <character class', 'reg jinsoyun blade dancer'],
            guildOnly: true,
            clientPermissions: ['CHANGE_NICKNAME', 'MANAGE_NICKNAMES'],                    
        });
    }

    async run(msg, args) {
        args = args.toLowerCase();
        let classList = ['gunslinger', 'blade dancer', 'destroyer', 'summoner', 'kung fu master', 'assassin', 'force master', 'warlock', 'blade master', 'soul fighter', 'warden'];

        // checking if the class input is valid or not
        let classValid = false;
        for(let i = 0; i < classList.length; i++){
            if(args.includes(classList[i])){
                let guildSettingData = await mongoGetData('guilds', {guild: msg.guild.id});
                    guildSettingData = guildSettingData[0];   
                
                // getting the chara name and make it prettier
                let userCharaName = args.replace(classList[i], '');
                    userCharaName = userCharaName.replace(/(^|\s)\S/g, l => l.toUpperCase());

                classValid = true;

                // adding character class role
                if(msg.guild.roles.find(role => role.name == classList[i]) != null){
                    msg.guild.members.get(msg.author.id).addRole(msg.guild.roles.find(role => role.name == classList[i]));
                }
                
                // Adding 'member' role so user can talk
                if(msg.guild.roles.find(role => role.name == 'member') != null){
                    msg.guild.members.get(msg.author.id).addRole(msg.guild.roles.find(role => role.name == 'member'));
                }

                // Removing 'cricket' role
                if(msg.guild.roles.find(role => role.name == 'cricket') != null){
                    msg.guild.members.get(msg.author.id).removeRole(msg.guild.roles.find(role => role.name == 'cricket'));
                }
                
                // changing the nickname
                if(msg.author.id != msg.guild.ownerID){
                    msg.guild.members.get(msg.author.id).setNickname(userCharaName);
                }
               
                let defaultTextChannel = '';
                if(guildSettingData != undefined){
                    defaultTextChannel = guildSettingData.settings.default_text;
                };
                
                if(defaultTextChannel != '' && defaultTextChannel != 'disable' && defaultTextChannel != undefined){
                    // add cricket role so they can't see the rest of the guild until they do join command
                    msg.guild.channels.find(ch => ch.name == defaultTextChannel).send(
                        'Welcome our new '+classList[i]+' <@'+msg.author.id+'>!'
                    );
                }
            }
        }

        //console.debug('[soyun] [reg] ['+msg.guild.name+'] args value: '+args);
        //console.debug('[soyun] [reg] ['+msg.guild.name+'] class input is: '+classValid);

        if(classValid == false){
            return msg.say('I can\'t find the class you wrote, please check and try again (class name need to be it\'s full name)');
        }
    }
};