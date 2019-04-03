const { Command, FriendlyError } = require('discord.js-commando');
const dateformat = require('dateformat');

const { mongoGetData, getSiteData, setDataFormatNumb, setDataFormatString, setArrayDataFormat, sendBotReport } = require('../../core');

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
        let charaAPIAddress = await mongoGetData('apis', {'name': 'Silveress Character'});
            charaAPIAddress = charaAPIAddress[0].address;

        // getting character traits data api address         
        let ncsoftPlayerTraitsAPIAdress = await mongoGetData('apis', {'name': 'NCSOFT Player Traits Endpoint'});
            ncsoftPlayerTraitsAPIAdress = ncsoftPlayerTraitsAPIAdress[0].address;        

        // getting bnstree site address
        let bnsTreeCharacterProfileAddress = await mongoGetData('apis', {'name': 'BNS Tree Character Profile'});
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
        let charaData = await getSiteData(charaAPIAddress+charaQuery);
        let traitsData = await getSiteData(ncsoftPlayerTraitsAPIAdress.replace('CHARACTER_NAME',charaQuery));
            traitsData = traitsData.records;

        // checking if the data fetch return data or error
        if(charaData.status == 'error'){
            console.error('[soyun] [who] ['+msg.guild.name+'] unable to get api data, site might be unreachable or unavailable');
            sendBotReport({'name':'APIFetchError', 'message':'Unable to get api data, site might be unreachable or unavailable', 'path':'main/commands/bns/who', 'code':10400, 'method':'GET'}, 'who-'+msg.guild.name, 'error');

            // dm bot owner for the error
            let found = 0;
            clientDiscord.guilds.map(function(guild){
                guild.members.map((member) => {
                    if(found == 0){
                        if(member.id == message.guild.ownerID){
                            found = 1;

                            for(let i=0; i < clientDiscord.owners.length; i++){
                                clientDiscord.owners[i].send(
                                    'Error Occured on `'+error.name+'`'+
                                    '\n__Details__:'+
                                    '\n**Time**: '+dateformat(Date.now(), 'dddd, dS mmmm yyyy, h:MM:ss TT')+
                                    '\n**Location**: '+message.guild.name+
                                    '\n**Guild Owner**: '+member.user.username+'#'+member.user.discriminator+
                                    '\n**Message**:\n'+command.name+': '+command.message
                                )
                            }
                        }
                    }
                })
            }) 


            var messageOutput = 'Unable to get charater data, please try again later';
        }else{
           //console.debug('[soyun] [who] ['+msg.guild.name+'] msg.author.nickname: '+msg.member.nickname);
           //console.debug('[soyun] [who] ['+msg.guild.name+'] charaQuery: '+charaQuery);
           //console.debug('[soyun] [who] ['+msg.guild.name+'] charaData.characterName value: '+charaData.characterName);
            
            if(charaData.characterName == undefined){
                var messageOutput = 'No result found on **'+charaQuery+'**. Please check your search and try again.'
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

                let gearData = [charaData.ringName, charaData.earringName, charaData.necklaceName, charaData.braceletName, charaData.beltName, charaData.gloves, charaData.soulName, charaData.soulName2, charaData.petAuraName, charaData.talismanName, charaData.soulBadgeName, charaData.mysticBadgeName]

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
                                'value': '**Health**: '+setDataFormatNumb(charaData.hp)+
                                        '\n**Attack Power**: '+setDataFormatNumb(charaData.ap)+
                                        '\n**Defense**: '+setDataFormatNumb(charaData.defence)+
                                        '\n**Clan**: '+setDataFormatString(charaData.guild)+
                                        '\n**Faction**: '+setDataFormatString(charaData.faction)+' ('+setDataFormatString(charaData.factionRank)+')'+
                                        '\n\u200B'                                    
                            },
                            {
                                'name': 'Stats',
                                'value': '**Mystic**: '+setDataFormatNumb(charaData.mystic)+' ('+(setDataFormatNumb(charaData.mysticRate)*100).toFixed(2)+'%)'+ 
                                        '\n**Block**: '+setDataFormatNumb(charaData.block)+' ('+(setDataFormatNumb(charaData.blockRate)*100).toFixed(2)+'%)'+
                                        '\n**Evasion**: '+setDataFormatNumb(charaData.evasion)+' ('+(setDataFormatNumb(charaData.evasionRate)*100).toFixed(2)+'%)'+
                                        '\n**Boss (Attack Power - Defense)**: '+setDataFormatNumb(charaData.ap_boss)+' - '+setDataFormatNumb(charaData.defence_boss)+
                                        '\n**Critical Hit**: '+setDataFormatNumb(charaData.crit)+' ('+(setDataFormatNumb(charaData.critRate)*100).toFixed(2)+'%)'+
                                        '\n**Critical Damage**: '+setDataFormatNumb(charaData.critDamage)+' ('+(setDataFormatNumb(charaData.critDamageRate)*100).toFixed(2)+'%)'+
                                        '\n\u200B'
                            },
                            {
                                'name': 'Equipments',
                                'value': '**Weapon**: '+setDataFormatString(charaData.weaponName)+
                                        '\n\n**Gems**: '+setArrayDataFormat(gemData, '- ', true)+
                                        '\n\n**Soulshields**: '+setArrayDataFormat(soulshieldData, '- ', true)+
                                        '\n\n**Accessories**: '+setArrayDataFormat(gearData, '- ', true)+
                                        '\n\u200B'
                            },                            
                            {
                                'name': 'Selected Talents',
                                'value': setArrayDataFormat(traitsDataView, '- ', true)
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