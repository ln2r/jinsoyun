const { Command } = require('discord.js-commando');
const dateformat = require('dateformat');

const core = require('../../core.js');

module.exports = class SayCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'daily',
            aliases: ['dc'],
            group: 'bns',
            memberName: 'daily',
            description: 'Get daily challenges quest list and rewards',
            examples: ['daily', 'daily <day>', 'daily tomorrow', 'daily monday'],
        });    
    }

    async run(msg, args) {
        msg.channel.startTyping();

        args = args.toLowerCase();

        let dayQuery = '';

        console.debug('[soyun] [daily] current day: '+core.getDayValue(Date.now(), 'now'));
        console.debug('[soyun] [daily] tomorrow is: '+core.getDayValue(Date.now(), 'tomorrow'));
        console.debug('[soyun] [daily] user query is: '+args);

        
        if(args == ''){
            dayQuery = core.getDayValue(Date.now(), 'now');
        }else if(args == 'tomorrow' || args == 'tmr'){
            dayQuery = core.getDayValue(Date.now(), 'tomorrow');
        }else{
            if(args == 'mon' || args == 'monday'){dayQuery = 'Monday'};
            if(args == 'tue' || args == 'tuesday'){dayQuery = 'Tuesday'};
            if(args == 'wed' || args == 'wednesday'){dayQuery = 'Wednesday'};
            if(args == 'thu' || args == 'thursday'){dayQuery = 'Thursday'};
            if(args == 'fri' || args == 'friday'){dayQuery = 'Friday'};
            if(args == 'sat' || args == 'saturday'){dayQuery = 'Saturday'};
            if(args == 'sun' || args == 'sunday'){dayQuery = 'Sunday'};
        }

        console.debug('[soyun] [daily] dayQuery value: '+dayQuery);

        let dailyData = await core.getDailyData(dayQuery);
        let embedData = {
            'embed': {
                'author':{
                    'name': 'Daily Challenges - '+dayQuery,
                    'icon_url': 'https://cdn.discordapp.com/emojis/464038094258307073.png?v=1'
                },
                'color': 15025535,
                'footer': {
                    'text': 'Daily Challenges - Generated at '+dateformat(Date.now(), 'UTC:dd-mm-yy @ HH:MM')+' UTC'
                },
                'fields':[
                    {
                       'name': 'Completion Rewards',
                       'value':  core.setArrayDataFormat(dailyData.rewards, '', true)
                    },
                    {
                        'name': 'Quests/Dungeons List (Location - Quest)',
                        'value': core.setQuestViewFormat(dailyData.quests, '', true)							
                    }
                ]
            }
        }

        msg.channel.stopTyping();

        return msg.say(embedData);
    }
};