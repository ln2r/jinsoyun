const { Command } = require('discord.js-commando');
const dateformat = require('dateformat');

const core = require('../../core.js');

module.exports = class SayCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'weekly',
            aliases: ['wc'],
            group: 'bns',
            memberName: 'weekly',
            description: 'Get weekly challenges quest list and rewards',
            examples: ['weekly', 'wc'],
        });    
    }

    async run(msg) {
        msg.channel.startTyping();

        let weeklyData = await core.getWeeklyData();

        let embedData = {
            'embed': {
                'author':{
                    'name': 'Weekly Challenges',
                    'icon_url': 'https://cdn.discordapp.com/emojis/464038094258307073.png?v=1'
                },
                'color': 15025535,
                'footer': {
                    'text': 'Weekly Challenges - Generated at '+dateformat(Date.now(), 'UTC:dd-mm-yy @ HH:MM')+' UTC'
                },
                'fields':[
                    {
                       'name': 'Completion Rewards',
                       'value':  core.setArrayDataFormat(weeklyData.rewards, '', true)
                    },
                    {
                        'name': 'Quests/Dungeons List (Location - Quest)',
                        'value': core.setQuestViewFormat(weeklyData.quests, '', true)							
                    }
                ]
            }
        }

        msg.channel.stopTyping();

        return msg.say(embedData);
    }
};