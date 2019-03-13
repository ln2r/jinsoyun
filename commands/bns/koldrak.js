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

        let koldrakClosestTime = core.getTimeDifference(timeData);
        //console.debug('[soyun] [koldrak\'s lair] ['+msg.guild.name+'] time diffence data: '+JSON.stringify(koldrakClosestTime, null, '\t'));
    
        msg.channel.stopTyping();

        let embedData = {
            'embed': {
                'author': {
                    'name': 'Epic Challenge - Koldrak\'s Lair ('+timeData[koldrakClosestTime.time_index]+':00 UTC)',
                },
                'color': 8388736,
                'footer': {
                    'icon_url': 'https://cdn.discordapp.com/emojis/463569669584977932.png?v=1',
                    'text': 'Koldrak\'s Lair - Generated at '+dateformat(Date.now(), 'UTC:dd-mm-yy @ HH:MM')+' UTC'
                },
                'description': 'Available in '+koldrakClosestTime.time_difference_data[0]+' hour(s) and '+koldrakClosestTime.time_difference_data[0]+' minute(s)',
            }

        }
        return msg.say(embedData);
    }
};