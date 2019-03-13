const { Command } = require('discord.js-commando');
const dateformat = require('dateformat');

const core = require('../../core.js');

module.exports = class BnsEventCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'event',
            group: 'bns',
            memberName: 'event',
            description: 'Get current event summary.',
            examples: ['event', 'event <day>', 'event tomorrow', 'event monday'],
        });    
    }

    async run(msg, args) {
        msg.channel.startTyping();

        args = args.toLowerCase();

        let dayQuery = '';

        //console.debug('[soyun] [event] ['+msg.guild.name+'] current day: '+core.getDayValue(Date.now(), 'now'));
        //console.debug('[soyun] [event] ['+msg.guild.name+'] tomorrow is: '+core.getDayValue(Date.now(), 'tomorrow'));
        //console.debug('[soyun] [event] ['+msg.guild.name+'] user query is: '+args);

        
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

        //console.debug('[soyun] [event] ['+msg.guild.name+'] dayQuery value: '+dayQuery);

        let eventData = await core.getEventData(dayQuery);

        let embedData = {
            'embed': {
                'author':{
                    'name': 'Current Event - '+dayQuery,
                    'icon_url': 'https://cdn.discordapp.com/emojis/479872059376271360.png?v=1'
                },
                'title': eventData.name,
                'url': eventData.url,
                'description': '**Duration**: '+eventData.duration+'\n'+
                                '**Redemption Period**: '+eventData.redeem+'\n'+
                                '**Event Item**: '+core.setArrayDataFormat(eventData.rewards.items, '- ', true)+'\n'+
                                '**What to do**: '+core.setArrayDataFormat(eventData.todo, '- ', true)+'\n'+
                                '**Redeemable Event**: '+eventData.lastEvent+' ('+eventData.lastEventRedeem+')',
                'color': 1879160,
                'footer': {
                    'icon_url': 'https://static.bladeandsoul.com/img/global/nav-bs-logo.png',
                    'text': 'Blade & Soul Event - Generated at '+dateformat(Date.now(), 'UTC:dd-mm-yy @ HH:MM')+' UTC'
                },
                'fields':[
                    {
                        'name': 'Quests List',
                        'value':  core.setQuestViewFormat(eventData.quests, '', true) 								
                    }
                ]
            }
        }

        msg.channel.stopTyping();

        return msg.say(embedData);
    }
};