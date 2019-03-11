const { Command } = require('discord.js-commando');
const dateformat = require('dateformat');

const core = require('../../core.js');

module.exports = class KoldrakCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'koldrak',
            aliases: ['dragon'],
            group: 'bns',
            memberName: 'koldrak',
            description: 'Get Koldrak\'s Lair access time',
            examples: ['koldrak'],
        });    
    }

    async run(msg) {
        msg.channel.startTyping();

        let timeData = await core.mongoGetData('challenges', {});
            timeData = timeData[0].koldrak.time;

        let koldrakNextHourMax = 24; // maximum hour distance

        let now = new Date();
        let timeNow = new Date(0, 0, 0, now.getUTCHours(), now.getMinutes());

        let closestTime;
        let koldrakNextTimeData;

        console.debug('[soyun] [koldrak] now: '+timeNow);

        for(let i = 0; i < timeData.length; i++){
            let koldrakAccess = new Date(0, 0, 0, timeData[i], 0);

            let timeRemaining = (koldrakAccess - timeNow);
            //console.debug('[soyun] [koldrak] current: '+koldrakAccess);
            //console.debug('[soyun] [koldrak] remain: '+timeRemaining);

            // formatting the data
            let koldrakNextHour = Math.abs(Math.floor(timeRemaining / 1000 / 60 / 60));
            // use extra variable so 'timerRemaining' variable remain unchanged
            let koldrakNextHourRaw = timeRemaining - (koldrakNextHour * 1000 * 60 *60);
                
            let koldrakNextMinute = Math.abs(Math.floor(koldrakNextHourRaw / 1000 / 60));

            //console.debug('[soyun] [koldrak] left: '+koldrakNextHour+'h '+koldrakNextMinute+'m')
    
            // checking if current time is smaller than last one or not
            if(koldrakNextHour <= koldrakNextHourMax){
                koldrakNextHourMax = koldrakNextHour;
                closestTime = i;
                // storing the formatted data into an array
                koldrakNextTimeData = [koldrakNextHour, koldrakNextMinute];
            }
            /*
            if(koldrakTimeHours <= koldrakTimeLeft){
									if(koldrakTimeHours >= 0){
										koldrakTimeLeft = koldrakTimeHours;
									}
								}
            */
        }    
        console.debug('[soyun] [koldrak] selected: '+new Date(0, 0, 0, timeData[closestTime], 0));
        //console.debug('[soyun] [koldrak] time data '+timeData);

        console.debug('[soyun] [koldrak] time left: '+koldrakNextTimeData[0]+' hours, '+koldrakNextTimeData[1]+' minutes');

        msg.channel.stopTyping();

        let embedData = {
            'embed': {
                'author': {
                    'name': 'Epic Challenge - Koldrak\'s Lair ('+timeData[closestTime]+':00 UTC)',
                },
                'color': 8388736,
                'footer': {
                    'icon_url': 'https://cdn.discordapp.com/emojis/463569669584977932.png?v=1',
                    'text': 'Koldrak\'s Lair - Generated at '+dateformat(Date.now(), 'UTC:dd-mm-yy @ HH:MM')+' UTC'
                },
                'description': 'Available in '+koldrakNextTimeData[0]+' hour(s) and '+koldrakNextTimeData[1]+' minute(s)',
            }

        }
        return msg.say(embedData);
    }
};