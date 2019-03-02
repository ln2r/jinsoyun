const { Command } = require('discord.js-commando');
const dateformat = require('dateformat');

const core = require('../../core.js');

module.exports = class SayCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'reset',
            group: 'automation',
            memberName: 'reset',
            description: 'Send challenges reset notification update.',
            guildOnly: true,
            hidden: true,
        });
    }

    async run(msg) {
        let todayDay = core.getDayValue(Date.now(), 'now');

        let dailiesData = await core.getDailyData(todayDay);
        let eventData = await core.getEventData(todayDay);
        let weekliesData = await core.getWeeklyData();

        let fieldsData = [
            {
                'name': 'Event',
                'value': '**Name**: ['+eventData.name+']('+eventData.url+')\n'+
                         '**Duration**: '+eventData.duration+'\n'+
                         '**Redemption Period**: '+eventData.redeem+'\n'+
                         '**Quests**'+
                         core.setQuestViewFormat(eventData.quests, '- ', true)+'\n\u200B'
            },
            {
                'name': 'Daily Challenges',
                'value': '**Rewards**'+
                        core.setArrayDataFormat(dailiesData.rewards, '- ', true)+'\n'+
                        '**Quests**'+
                        core.setQuestViewFormat(dailiesData.quests, '- ', true)+'\n\u200B'
            }            
        ];

        if(todayDay == 'Wednesday'){
            fieldsData.push(
                {
                    'name': 'Weekly Challenges',
                    'value': '**Rewards**'+
                            core.setArrayDataFormat(weekliesData.rewards, '- ', true)+'\n'+
                            '**Quests**'+
                            core.setQuestViewFormat(weekliesData.quests, '- ', true)+'\n\u200B'
                }
            )
        }

        let msgData = 'Hello *'+msg.guild.name+'*! \nIt\'s time for reset, below is today\'s/this week\'s week list. Have a good day!'

        let embedData = {
            'embed':{
                'author':{
                    'name': todayDay+'\'s List - '+dateformat(Date.now(), 'UTC:dd-mmmm-yyyy'),
                    'icon_url': 'https://cdn.discordapp.com/emojis/464038094258307073.png?v=1'
                },
                'color': 1879160,
                'footer': {
                    'text': 'Reset Notification - Generated at '+dateformat(Date.now(), 'UTC:dd-mm-yy @ HH:MM')+' UTC'
                },
                'fields': fieldsData
            }
        }

        let sent = 0;
        this.client.guilds.map(async function(guild){
            //console.debug('[soyun] [reset] guild list: '+guild.id+'('+guild.name+')');

            // getting guild setting data
            let guildSettingData = await core.mongoGetData('guilds', {guild: guild.id});
                guildSettingData = guildSettingData[0];
            //console.debug('[soyun] [reset] guild setting data: '+JSON.stringify(guildSettingData, null, '\t'));    
            let resetChannel = '';
            if(guildSettingData != undefined){
                resetChannel = guildSettingData.settings.quest_reset
            }

            let found = 0;
            guild.channels.map((ch) => {
                if(found == 0){
                    if(ch.name == resetChannel && resetChannel != undefined && resetChannel != 'disable'){
                        found = 1; 
                        sent++;
                        ch.send(msgData, embedData);                        
                    }
                }
            }) 
        })
        console.debug('[soyun] [reset] reset notification sent to '+sent+' channels');
    }
};