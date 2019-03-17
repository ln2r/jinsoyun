const { Command } = require('discord.js-commando');
const dateformat = require('dateformat');

const core = require('../../core.js');

module.exports = class WhoCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'who', // command name
            aliases: ['ps', 'f2'],
            group: 'bns', // command group
            memberName: 'who', // name of the command in the group
            description: 'Show character gear and equipment.', // command desc
            examples: ['who character name', 'who']
        });
    }

    async run(msg, args) {
        msg.channel.startTyping();

        // getting character equipments api address from the database
        let charaAPIAddress = await core.mongoGetData('apis', {'name': 'Silveress Character'});
            charaAPIAddress = charaAPIAddress[0].address;

        // getting character traits data api address         
        let ncsoftPlayerTraitsAPIAdress = await core.mongoGetData('apis', {'name': 'NCSOFT Player Traits Endpoint'});
            ncsoftPlayerTraitsAPIAdress = ncsoftPlayerTraitsAPIAdress[0].address;        

        // getting bnstree site address
        let bnsTreeCharacterProfileAddress = await core.mongoGetData('apis', {'name': 'BNS Tree Character Profile'});
            bnsTreeCharacterProfileAddress = bnsTreeCharacterProfileAddress[0].address;
        
        // getting the character name, if the user doesn't give any, their discord nickname will be used instead
        let charaQuery;
        if(args.length == 0){
            // check if the message author have nickname or not
            // if not use their display name instead            
            if(msg.member.nickname == null){
                charaQuery = msg.member.displayName
            }else{
                charaQuery = msg.member.nickname;
            }
        }else{
            // encoding uri component so character with 'circumflex' still searchable
            charaQuery = encodeURIComponent(args);
        }

        let bnstreeProfile = bnsTreeCharacterProfileAddress+charaQuery;		
			bnstreeProfile = bnstreeProfile.replace(' ','%20'); // replacing the space so discord.js embed wont screaming error

        // getting the character equipments from silveress api
        let charaData = await core.getSiteData(charaAPIAddress+charaQuery);
        let traitsData = await core.getSiteData(ncsoftPlayerTraitsAPIAdress.replace('CHARACTER_NAME',charaQuery));
            traitsData = traitsData.records;

        // checking if the data fetch return data or error
        if(charaData.status == 'error'){
            console.error('[soyun] [who] ['+msg.guild.name+'] unable to get api data, site might be unreachable or unavailable');
            var messageOutput = 'Unable to get charater data, please try again later';
        }else{
           //console.debug('[soyun] [who] ['+msg.guild.name+'] msg.author.nickname: '+msg.member.nickname);
           //console.debug('[soyun] [who] ['+msg.guild.name+'] charaQuery: '+charaQuery);
           //console.debug('[soyun] [who] ['+msg.guild.name+'] charaData.characterName value: '+charaData.characterName);
            
            if(charaData.characterName == undefined){
                var messageOutput = 'No Result found on **'+charaQuery+'**. Please check your search and try again.'
            }else{
                // getting the traits data
                let traitsDataView = [];
                if(traitsData.length == 0){
                    traitsDataView = ['No data available'];
                }else{
                    for(let i = 0; i < traitsData.length; i++){
                        for(let j = 0; j < traitsData[i].traits.length; j++){
                            //console.debug('[soyun] [who] ['+msg.guild.name+'] '+traitsData[i].traits[j].name+' is: '+traitsData[i].traits[j].selected)
                            if(traitsData[i].traits[j].selected == true){
                                traitsDataView.push(traitsData[i].traits[j].name)
                            }
                        }
                    }
                }
                
   
                let gemData = [charaData.gem1, charaData.gem2, charaData.gem3, charaData.gem4, charaData.gem5, charaData.gem6, charaData.gem7, charaData.gem8];

                let soulshieldData = [charaData.soulshield1, charaData.soulshield2, charaData.soulshield3, charaData.soulshield4, charaData.soulshield5, charaData.soulshield6, charaData.soulshield7, charaData.soulshield8];

               //console.debug('[soyun] [who] ['+msg.guild.name+'] charaAPIAddress: '+charaAPIAddress);
               //console.debug('[soyun] [who] ['+msg.guild.name+'] charaData address: '+charaAPIAddress+charaQuery);
               //console.debug('[soyun] [who] ['+msg.guild.name+'] player traits data address: '+ncsoftPlayerTraitsAPIAdress.replace('CHARACTER_NAME',charaQuery));
               //console.debug('[soyun] [who] ['+msg.guild.name+'] traitsData value: '+traitsData)
               //console.debug('[soyun] [who] ['+msg.guild.name+'] traitsDataView value: '+traitsDataView)       

                var messageOutput = {
                    'embed': {
                        'title':charaData.server+'\'s '+charaData.style+' '+charaData.playerClass+' '+charaData.characterName+' - Level '+charaData.playerLevel+' HM Level '+charaData.playerLevelHM,
                        'url': bnstreeProfile,
                        'fields': [
                            {
                                'name': 'Basic Information',
                                'value': '**Health**: '+core.setDataFormatNumb(charaData.hp)+
                                        '\n**Attack Power**: '+core.setDataFormatNumb(charaData.ap)+
                                        '\n**Defense**: '+core.setDataFormatNumb(charaData.defence)+
                                        '\n**Clan**: '+core.setDataFormatString(charaData.guild)+
                                        '\n**Faction**: '+core.setDataFormatString(charaData.faction)+' ('+core.setDataFormatString(charaData.factionRank)+')'+
                                        '\n**Hongmoon Points Allocation (Atk - Def)**: '+core.setDataFormatNumb(charaData.HMAttackPoint)+' - '+core.setDataFormatNumb(charaData.HMDefencePoint)+'\n\u200B'                                    
                            },
                            {
                                'name': 'Stats',
                                'value': '**Block**: '+core.setDataFormatNumb(charaData.block)+' ('+(core.setDataFormatNumb(charaData.blockRate)*100).toFixed(2)+'%)'+
                                        '\n**Evasion**: '+core.setDataFormatNumb(charaData.evasion)+' ('+(core.setDataFormatNumb(charaData.evasionRate)*100).toFixed(2)+'%)'+
                                        '\n**Boss (Attack Power - Defense)**: '+core.setDataFormatNumb(charaData.ap_boss)+' - '+core.setDataFormatNumb(charaData.defence_boss)+
                                        '\n**Critical Hit**: '+core.setDataFormatNumb(charaData.crit)+' ('+(core.setDataFormatNumb(charaData.critRate)*100).toFixed(2)+'%)'+
                                        '\n**Critical Damage**: '+core.setDataFormatNumb(charaData.critDamage)+' ('+(core.setDataFormatNumb(charaData.critDamageRate)*100).toFixed(2)+'%)'+'\n\u200B'
                            },
                            {
                                'name': 'Equipments',
                                'value': '**Weapon**: '+core.setDataFormatString(charaData.weaponName)+
                                        '\n\n**Gems**: '+core.setArrayDataFormat(gemData, '- ', true)+
                                        '\n\n**Soulshields**: '+core.setArrayDataFormat(soulshieldData, '- ', true)+
                                        '\n\n**Ring**: '+core.setDataFormatString(charaData.ringName)+
                                        '\n**Earring**: '+core.setDataFormatString(charaData.earringName)+
                                        '\n**Necklace**: '+core.setDataFormatString(charaData.necklaceName)+
                                        '\n**Braclet**: '+core.setDataFormatString(charaData.braceletName)+
                                        '\n**Belt**: '+core.setDataFormatString(charaData.beltName)+
                                        '\n**Gloves**: '+core.setDataFormatString(charaData.gloves)+
                                        '\n**Soul**: '+core.setDataFormatString(charaData.soulName)+
                                        '\n**Heart**: '+core.setDataFormatString(charaData.soulName2)+
                                        '\n**Aura Pet**: '+core.setDataFormatString(charaData.petAuraName)+
                                        '\n**Talisman**: '+core.setDataFormatString(charaData.talismanName)+
                                        '\n**Soul Badge**: '+core.setDataFormatString(charaData.soulBadgeName)+
                                        '\n**Mystic Badge**: '+core.setDataFormatString(charaData.mysticBadgeName)+'\n\u200B'
                            },                            
                            {
                                'name': 'Selected Talents',
                                'value': core.setArrayDataFormat(traitsDataView, '- ', true)
                            }
                            
                        ],
                        'color': Math.floor(Math.random() * 16777215) - 0,
                        'footer':{ 
                            'icon_url': 'https://slate.silveress.ie/docs_bns/images/logo.png',
                            'text': 'Powered by Silveress\'s BnS API - Generated at '+dateformat(Date.now(), 'UTC:dd-mm-yy @ HH:MM')+' UTC'
                        },
                        'thumbnail': {
                            'url': charaData.characterImg
                        }           
                    }
                }
            }
        }
        msg.channel.stopTyping();

        return msg.say(messageOutput);        
    }
};