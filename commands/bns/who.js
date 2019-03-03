const { Command } = require('discord.js-commando');
const dateformat = require('dateformat');

const core = require('../../core.js');

module.exports = class ReplyCommand extends Command {
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

        // getting character skill data api address 
        let ncsoftPlayerSkillAPIAddress = await core.mongoGetData('apis', {'name': 'NCSOFT Player Skills Endpoint'});
            ncsoftPlayerSkillAPIAddress = ncsoftPlayerSkillAPIAddress[0].address;
        
        // getting bnstree site address
        let bnsTreeCharacterProfileAddress = await core.mongoGetData('apis', {'name': 'BNS Tree Character Profile'});
            bnsTreeCharacterProfileAddress = bnsTreeCharacterProfileAddress[0].address;

        // getting the character name, if the user doesn't give any, their discord nickname will be used instead
        let charaQuery;
        if(args.length == 0){
            charaQuery = msg.member.nickname;
        }else{
            // encoding uri component so character with 'circumflex' still searchable
            charaQuery = encodeURIComponent(args);
        }

        let bnstreeProfile = bnsTreeCharacterProfileAddress+charaQuery;		
			bnstreeProfile = bnstreeProfile.replace(' ','%20'); // replacing the space so discord.js embed wont screaming error

        // getting the character equipments from silveress api
        let charaData = await core.getSiteData(charaAPIAddress+charaQuery);

        // checking if the data fetch return data or error
        if(charaData.status == 'error'){
            console.error('[soyun] [who] api data fetch error, please check the log');
            var messageOutput = 'Unable to get charater data, please try again later';
        }else{
            console.debug('[soyun] [who] msg.author.nickname: '+msg.member.nickname);
            console.debug('[soyun] [who] charaQuery: '+charaQuery);
            console.debug('[soyun] [who] charaData.characterName value: '+charaData.characterName);
            
            if(charaData.characterName == undefined){
                var messageOutput = 'No Result found on **'+charaQuery+'**. Please check your search and try again.'
            }else{       
                // formatting chara class for searching
                let charaClass = charaData.playerClass.replace(' ', '');
                    charaClass = charaClass.toLowerCase();

                // getting class skills data from database
                let classData = await core.mongoGetData('classes', {'name': charaClass});

                // getting elemental damage
                let elementalDamage = '0.00%';
                switch(charaData.activeElement){
                    case 'flame':
                        elementalDamage = charaData.flame + (' ('+(charaData.flameRate*100).toFixed(2)+'%)');
                    break;
                    case 'frost':
                        elementalDamage = charaData.frost + (' ('+(charaData.frostRate*100).toFixed(2)+'%)');
                    break;
                    case 'wind':
                        elementalDamage = charaData.wind + (' ('+(charaData.windRate*100).toFixed(2)+'%)');
                    break;
                    case 'earth':
                        elementalDamage = charaData.earth + (' ('+(charaData.earthRate*100).toFixed(2)+'%)');
                    break;
                    case 'lightning':
                        elementalDamage = charaData.lightning + (' ('+(charaData.lightningRate*100).toFixed(2)+'%)');
                    break;
                    case 'shadow':
                        elementalDamage = charaData.shadow + (' ('+(charaData.shadowRate*100).toFixed(2)+'%)');
                    break;
                }
                
                // getting the skill data
                let skillData;
                if(charaData.activeElement == classData[0].attributes.records[0].attribute){
                    skillData = classData[0].skillsetA;
                }else{
                    skillData = classData[0].skillsetB;
                };

                // player character skill data
                let playerSkillData = await core.getSiteData(ncsoftPlayerSkillAPIAddress.replace('CHARACTER_NAME',charaQuery));
                    playerSkillData = playerSkillData.records; // formatting the data, so it's easier to call

                // empty playerSKillData handling
                if(playerSkillData == null){            
                    console.warn('[soyun] [who] can\'t fetch player skill data');
                    playerSkillData = [];
                };   

                // getting and formatting the skill data
                let skillDataView = [];
                for(let i = 0; i < skillData.length; i++){
                    for(let j = 0; j < playerSkillData.length; j++){
                        // checking the id and the variations length
                        if(skillData[i].id == playerSkillData[j].skill_id && skillData[i].variations.length > 1){
                            for(let k = 0; k < skillData[i].variations.length; k++){
                                if(skillData[i].variations[k].variation_index == playerSkillData[j].variation_index){
                                    skillDataView.push(
                                        '**'+skillData[i].variations[k].name+'**: '+
                                        skillData[i].variations[k].training_icon_desc.replace(/<[^>]+>/g, '')+
                                        ' (Move '+skillData[i].variations[k].variation_no+')'                                
                                    );
                                };
                            };
                        };
                    };           
                ;}

                // data handling if for some reason the skill data can't be fetched
                if(skillDataView.length == 0){
                    skillDataView = 'No skill data available';
                }else{
                    skillDataView.shift(); // removing windwalk stuff

                    // formatting the data          
                    skillDataView = core.setArrayDataFormat(skillDataView, '', true);
                };
                
                let gemData = [charaData.gem1, charaData.gem2, charaData.gem3, charaData.gem4, charaData.gem5, charaData.gem6, charaData.gem7, charaData.gem8];

                let soulshieldData = [charaData.soulshield1, charaData.soulshield2, charaData.soulshield3, charaData.soulshield4, charaData.soulshield5, charaData.soulshield6, charaData.soulshield7, charaData.soulshield8];

                console.debug('[soyun] [who] charaAPIAddress: '+charaAPIAddress);
                console.debug('[soyun] [who] charaData address: '+charaAPIAddress+charaQuery);
                console.debug('[soyun] [who] playerSkillData address: '+ncsoftPlayerSkillAPIAddress.replace('CHARACTER_NAME',charaQuery));       

                var messageOutput = {
                    'embed': {
                        'title':charaData.server+'\'s '+charaData.activeElement+' '+charaData.playerClass+' '+charaData.characterName+' - Level '+charaData.playerLevel+' HM Level '+charaData.playerLevelHM,
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
                                        '\n**Elemental Damage**: '+elementalDamage+
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
                                        '\n**Soul Badge**: '+core.setDataFormatString(charaData.soulBadgeName)+
                                        '\n**Mystic Badge**: '+core.setDataFormatString(charaData.mysticBadgeName)+'\n\u200B'
                            },
                            {
                                'name': 'Trainable Skillset',
                                'value': skillDataView
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