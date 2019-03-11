const { Command } = require('discord.js-commando');
const core = require('../../core.js');

module.exports = class ClassChangeCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'iam',
            aliases: ['role'],
            group: 'guild',
            memberName: 'iam',
            description: 'Change your default class role.',
            examples: ['iam <class name>', 'iam blade dancer'],
            guildOnly: true,
            clientPermissions: ['MANAGE_ROLES'],                    
            args: [
                {
                    key: 'className', // name of the arg
                    prompt: 'What\'s the class name you want to change to?', // default reply kind of
                    type: 'string',
                    validate: className => {
                        let found = false;
                        let classList = ['gunslinger', 'blade dancer', 'destroyer', 'summoner', 'kung fu master', 'assassin', 'force master', 'warlock', 'blade master', 'soul fighter', 'warden'];

                        for(let i = 0; i < classList.length; i++){
                            if(className.toLowerCase() == classList[i]){
                                found = true;
                            }
                        };

                        if (found) return true;
                        return 'I can\'t find the class you wrote, please check and try again';
                    }
                }
            ]
        });
    }

    run(msg, { className }) {
        function getMemberRoles(item, index){
            return item.name;
        }

        let classList = ['gunslinger', 'blade dancer', 'destroyer', 'summoner', 'kung fu master', 'assassin', 'force master', 'warlock', 'blade master', 'soul fighter', 'warden'];

        let authorRoleList = msg.guild.members.get(msg.author.id).roles.map(getMemberRoles);
        console.debug('[soyun] [class] '+msg.author.username+' role list: '+authorRoleList);

        let removedRoleIdx;

        for(let i = 0; i < authorRoleList.length; i++){
            for(let j = 0; j < classList.length; j++){
                if(authorRoleList[i] == classList[j]){
                    removedRoleIdx = i;
                }
            }
        }
        
        console.debug('[soyun] [class] '+msg.author.username+' old class: '+authorRoleList[removedRoleIdx]);
        
        msg.guild.members.get(msg.author.id).removeRole(msg.guild.roles.find(
            role => role.name == authorRoleList[removedRoleIdx])
        )

        msg.guild.members.get(msg.author.id).addRole(msg.guild.roles.find(
            role => role.name == className)
        )

        console.debug('[soyun] [class] '+msg.author.username+' class changed to '+className)

        return msg.say('Your class changed to ***'+className+'***');
    }
};