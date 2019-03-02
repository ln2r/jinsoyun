const { Command } = require('discord.js-commando');
const dateformat = require('dateformat');

const core = require('../../core.js');

module.exports = class SayCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'dungeon',
            aliases: ['dg', 'guide'],
            group: 'bns',
            memberName: 'dungeon',
            description: 'Get the dungeon info and it\'s guide if available',
            examples: ['dungeon <dungeon name>', 'dungeon naryu sanctum'],
            hidden: true, // Remove on stable
            args: [
                {
                    key: 'dungeon',
                    prompt: 'What is the dungeon called?',
                    type: 'string'
                }
            ]            
        });    
    }

    async run(msg, {dungeon}) {
        msg.channel.startTyping();

        let regx = new RegExp('('+dungeon+'+)', 'ig'); // doing rough search
        let dbSearchQuery = {'name': regx};
        let dungeonData = await core.mongoGetData('dungeons', dbSearchQuery);
            dungeonData = dungeonData[0];

        if(dungeonData == null){
            msg.channel.stopTyping();
            return msg.say('I can\'t find the dungeon you are looking for, please check and try again (dungeon name need to be it\'s full name)');
        }else{
            let dungeonType;    

            switch(dungeonData.type){
                case 12:
                    dungeonType = '12 Players'
                break;
                case 6:
                    dungeonType = '6 Players'
                break;
                case 1:
                    dungeonType = 'Solo Instance'
                break;
            }
            // empty rewards data handler
            let rewardsCommon = '';
            let rewardsNormal = '';
            let rewardsHard = '';

            // handling empty data
            function emptyDataHandler(data){
                if(data == '' || data == undefined){
                    return '-';
                }else{
                    return data
                }
            }

            // handling the guide data
            function getGuideData(data){
                if(data == '' || data == null || data == undefined){
                    return '-';
                }

                let guideData = [];
                for(let i = 0; i < data.length; i++){
                    guideData.push('['+data[i].owner+']('+data[i].url+')');
                };

                return guideData.join(', ');
            }
            console.debug('[soyun] [dungeon] query: '+dungeon);
            console.debug('[soyun] [dungeon] common data: '+!!dungeonData.rewards.common);
            console.debug('[soyun] [dungeon] normal data: '+!!dungeonData.rewards.normal);
            console.debug('[soyun] [dungeon] hard data: '+!!dungeonData.rewards.hard);

            if(dungeonData.rewards.common != null){
                rewardsCommon = '\n**Common**'+
                                '\nWeapon: '+emptyDataHandler(dungeonData.rewards.common.weapon)+
                                '\nSoulshield:'+core.setArrayDataFormat(dungeonData.rewards.common.soulshield, '- ', true)+
                                '\nAccessory: '+core.setArrayDataFormat(dungeonData.rewards.common.accessory, '- ', true)+
                                '\nOther: '+core.setArrayDataFormat(dungeonData.rewards.common.other, '- ', true)+
                                '\nOutfit: '+core.setArrayDataFormat(dungeonData.rewards.common.outfit, '- ', true)+'\n'     
            }

            if(dungeonData.rewards.normal != null){
                rewardsNormal = '\n**Normal**'+
                                '\nWeapon: '+emptyDataHandler(dungeonData.rewards.normal.weapon)+
                                '\nSoulshield:'+core.setArrayDataFormat(dungeonData.rewards.normal.soulshield, '- ', true)+
                                '\nAccessory: '+core.setArrayDataFormat(dungeonData.rewards.normal.accessory, '- ', true)+
                                '\nOther: '+core.setArrayDataFormat(dungeonData.rewards.normal.other, '- ', true)+
                                '\nOutfit: '+core.setArrayDataFormat(dungeonData.rewards.normal.outfit, '- ', true)+'\n'
                                
            }
            
            if(dungeonData.rewards.hard != null){
                rewardsHard = '\n**Hard**'+
                            '\nWeapon: '+emptyDataHandler(dungeonData.rewards.hard.weapon)+
                            '\nSoulshield:'+core.setArrayDataFormat(dungeonData.rewards.hard.soulshield, '- ', true)+
                            '\nAccessory: '+core.setArrayDataFormat(dungeonData.rewards.hard.accessory, '- ', true)+
                            '\nOther: '+core.setArrayDataFormat(dungeonData.rewards.hard.other, '- ', true)+
                            '\nOutfit: '+core.setArrayDataFormat(dungeonData.rewards.hard.outfit, '- ', true)+'\n'              
            }



            let embedData = {
                'embed': {
                    'author': {
                        'name': 'Dungeon Info - '+dungeon.replace(/(^|\s)\S/g, l => l.toUpperCase())+' ('+dungeonType+')',
                        'icon_url': 'https://cdn.discordapp.com/emojis/463569668045537290.png?v=1'
                    },
                    'color': 10040319,
                    'footer': {
                        'text': 'Dungeon Data - Generated at '+dateformat(Date.now(), 'UTC:dd-mm-yy @ HH:MM')+' UTC'
                    },
                    'fields':[
                        {
                            'name': 'Recommended Attack Power',
                            'value': 'Normal: '+dungeonData.attackPower.normal+'+  Hard: '+dungeonData.attackPower.hard+'+'
                        },
                        {
                            'name': 'Entry Requirements',
                            'value': core.setArrayDataFormat(dungeonData.requirements, '- ', true)
                        },
                        {
                            'name': 'Guide',
                            'value': getGuideData(dungeonData.guides)
                        },
                        {
                            'name': 'Rewards',
                            'value': rewardsCommon + rewardsNormal + rewardsHard
                        },
                    ]
                }

            }
            msg.channel.stopTyping();
        
            return msg.say(embedData);
        }        
    }
};