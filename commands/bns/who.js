const { Command } = require("discord.js-commando");
const dateformat = require("dateformat");

const { mongoGetData, getSiteData, setDataFormatNumb, setDataFormatString, setArrayDataFormat, getGlobalSettings } = require("../../core");

module.exports = class WhoCommand extends Command {
    constructor(client) {
        super(client, {
            name: "who", // command name
            aliases: ["ps", "f2"],
            group: "bns", // command group
            memberName: "who", // name of the command in the group
            description: "Show character gear and equipment.", // command desc
            examples: ["who character name", "who"]
        });
    }

    async run(msg, args) {
        msg.channel.startTyping();

        // checking if the command disabled or not
        let globalSettings = await getGlobalSettings("who");
        if(!globalSettings.status){
            msg.channel.stopTyping();

            return msg.say("This command is currently disabled.\nReason: "+globalSettings.message);
        };

        let messageOutput;

        // getting character equipments api address from the database
        let charaAPIAddress = await mongoGetData("apis", {"name": "Silveress Character"});
            charaAPIAddress = charaAPIAddress[0].address;

        // getting character traits data api address         
        let ncsoftPlayerTraitsAPIAddress = await mongoGetData("apis", {"name": "NCSOFT Player Traits Endpoint"});
            ncsoftPlayerTraitsAPIAddress = ncsoftPlayerTraitsAPIAddress[0].address;
            
        // getting character skills data api address
        let ncsoftPlayerSkillsAPIAddress = await mongoGetData("apis", {"name": "NCSOFT Player Skills Endpoint"});
            ncsoftPlayerSkillsAPIAddress = ncsoftPlayerSkillsAPIAddress[0].address;

        // getting bnstree site address
        let bnsTreeCharacterProfileAddress = await mongoGetData("apis", {"name": "BNS Tree Character Profile"});
            bnsTreeCharacterProfileAddress = bnsTreeCharacterProfileAddress[0].address;
        
        // getting the character name, if the user doesn't give any, their discord nickname will be used instead
        let charaQuery;
        if(args.length === 0){
            // check if the message author have nickname or not
            // if not use their display name instead            
            if(msg.member.nickname === null){
                charaQuery = msg.member.displayName;
            }else{
                charaQuery = msg.member.nickname;
            }
        }else{
            // encoding uri component so character with "circumflex" still searchable
            charaQuery = encodeURIComponent(args);
        }

        let bnstreeProfile = bnsTreeCharacterProfileAddress+charaQuery;		
			bnstreeProfile = bnstreeProfile.replace(" ","%20"); // replacing the space so discord.js embed wont screaming error

        // getting character equipments from silveress api
        let charaData = await getSiteData(charaAPIAddress+charaQuery);
        // getting character selected traits from f2 page
        let traitsData = await getSiteData(ncsoftPlayerTraitsAPIAddress.replace("CHARACTER_NAME",charaQuery));
            traitsData = traitsData.records;
        // getting character skills points distributions
        let skillsData = await getSiteData(ncsoftPlayerSkillsAPIAddress.replace("CHARACTER_NAME",charaQuery));
            skillsData = skillsData.records;

        // checking if the data fetch return data or error
        if(charaData.status === "error"){
            // getting default image
            let defaultImage = await getGlobalSettings("not_found");

            messageOutput = {
                "embed": {
                    "title": "Character Information",
                    "thumbnail": {
                        "url": defaultImage
                    },
                    "color": 15605837,
                    "description": "Unable to get character data.\nSite might be unreachable or unavailable.",  
                }
            };
        }else if(charaData.error || !traitsData || !skillsData){
            let defaultImage = await getGlobalSettings("not_found");

            messageOutput = {
                "embed": {
                    "title": "Character Information",
                    "thumbnail": {
                        "url": defaultImage
                    },
                    "color": 16574595,
                    "description": "No Result found on **"+charaQuery+"**.\nPlease check your search and try again.",  
                }
            };
        }else{
            //console.debug("[soyun] [who] ["+msg.guild.name+"] msg.author.nickname: "+msg.member.nickname);
            //console.debug("[soyun] [who] ["+msg.guild.name+"] charaQuery: "+charaQuery);
            //console.debug("[soyun] [who] ["+msg.guild.name+"] charaData.characterName value: "+charaData.characterName);

            // getting the traits data
            let traitsDataView = [];
            if(traitsData.length === 0){
                traitsDataView = ["*No data available*"];
            }else{
                for(let i = 0; i < traitsData.length; i++){
                    for(let j = 0; j < traitsData[i].traits.length; j++){
                        //console.debug("[soyun] [who] ["+msg.guild.name+"] "+traitsData[i].traits[j].name+" is: "+traitsData[i].traits[j].selected)
                        if(traitsData[i].traits[j].selected === true){
                            traitsDataView.push(traitsData[i].traits[j].name);
                        }
                    }
                }
            }

            // getting the skills data
            let SPData = [];
            if(skillsData.length === 0){
                SPData = ["*No data available*"];
            }else{
                for(let i = 0; i < skillsData.length; i++){
                    for(let j = 0; j < skillsData[i].skills.length; j++){
                        if(skillsData[i].skills[j].buildup_max_level === 5){
                            //console.debug("[soyun] [who] ["+msg.guild.name+"] "+skillsData[i].skills[j].name+" is: "+skillsData[i].skills[j].buildup_level+"/"+skillsData[i].skills[j].buildup_max_level);
                            SPData.push(skillsData[i].skills[j].name+" ("+skillsData[i].skills[j].buildup_level+"/"+skillsData[i].skills[j].buildup_max_level+")");
                        }
                    }
                }
            }
            
            let gemData = [charaData.gem1, charaData.gem2, charaData.gem3, charaData.gem4, charaData.gem5, charaData.gem6, charaData.gem7, charaData.gem8];

            let soulshieldData = [charaData.soulshield1, charaData.soulshield2, charaData.soulshield3, charaData.soulshield4, charaData.soulshield5, charaData.soulshield6, charaData.soulshield7, charaData.soulshield8];

            let gearData = [charaData.ringName, charaData.earringName, charaData.necklaceName, charaData.braceletName, charaData.beltName, charaData.gloves, charaData.soulName, charaData.soulName2, charaData.petAuraName, charaData.talismanName, charaData.soulBadgeName, charaData.mysticBadgeName];

            let charaClanName;
            if(setDataFormatString(charaData.guild) !== ""){
                charaClanName = setDataFormatString(charaData.guild);
            }else{
                charaClanName = "*Not in any clan*";
            }

            let charaAliases;
            if(charaData.otherNames.length !== 0){
                charaAliases = charaData.otherNames.join(", ");
            }else{
                charaAliases = "*No known aliases*"
            };

            //console.debug("[soyun] [who] ["+msg.guild.name+"] charaAPIAddress: "+charaAPIAddress);
            //console.debug("[soyun] [who] ["+msg.guild.name+"] charaData address: "+charaAPIAddress+charaQuery);
            //console.debug("[soyun] [who] ["+msg.guild.name+"] player traits data address: "+ncsoftPlayerTraitsAPIAddress.replace("CHARACTER_NAME",charaQuery));
            //console.debug("[soyun] [who] ["+msg.guild.name+"] traitsData value: "+traitsData)
            //console.debug("[soyun] [who] ["+msg.guild.name+"] traitsDataView value: "+traitsDataView) 
            //console.debug("[soyun] [who] ["+msg.guild.name+"] gems data: "+gemData)  
            //console.debug("[soyun] [who] ["+msg.guild.name+"] soulshield data: "+soulshieldData)        

            messageOutput = {
                "embed": {
                    "title":charaData.server+"'s "+charaData.style+" "+charaData.playerClass+" "+charaData.characterName+" - Level "+charaData.playerLevel+" HM Level "+charaData.playerLevelHM,
                    "url": bnstreeProfile,
                    "fields": [
                        {
                            "name": "Basic Information",
                            "value": "**Health**: "+setDataFormatNumb(charaData.hp)+
                                    "\n**Attack Power**: "+setDataFormatNumb(charaData.ap)+
                                    "\n**Defense**: "+setDataFormatNumb(charaData.defence)+
                                    "\n**Clan**: "+charaClanName+
                                    "\n**Faction**: "+setDataFormatString(charaData.faction)+" ("+setDataFormatString(charaData.factionRank)+")"+
                                    "\n**Aliases**: "+charaAliases+
                                    "\n\u200B"                                    
                        },
                        {
                            "name": "Stats",
                            "value": "**Mystic**: "+setDataFormatNumb(charaData.mystic)+" ("+(setDataFormatNumb(charaData.mysticRate)*100).toFixed(2)+"%)"+ 
                                    "\n**Block**: "+setDataFormatNumb(charaData.block)+" ("+(setDataFormatNumb(charaData.blockRate)*100).toFixed(2)+"%)"+
                                    "\n**Evasion**: "+setDataFormatNumb(charaData.evasion)+" ("+(setDataFormatNumb(charaData.evasionRate)*100).toFixed(2)+"%)"+
                                    "\n**Boss (Attack Power - Defense)**: "+setDataFormatNumb(charaData.ap_boss)+" - "+setDataFormatNumb(charaData.defence_boss)+
                                    "\n**Critical Hit**: "+setDataFormatNumb(charaData.crit)+" ("+(setDataFormatNumb(charaData.critRate)*100).toFixed(2)+"%)"+
                                    "\n**Critical Damage**: "+setDataFormatNumb(charaData.critDamage)+" ("+(setDataFormatNumb(charaData.critDamageRate)*100).toFixed(2)+"%)"+
                                    "\n\u200B"
                        },
                        {
                            "name": "Weapon",
                            "value": setDataFormatString(charaData.weaponName)
                                    +"\n\u200B"
                        }, 
                        {
                            "name": "Gems",
                            "value": setArrayDataFormat(gemData, "- ", true)
                                    +"\n\u200B"
                        }, 
                        {
                            "name": "Soulshield",
                            "value": setArrayDataFormat(soulshieldData, "- ", true)
                                    +"\n\u200B"
                        },
                        {
                            "name": "Accesories",
                            "value": setArrayDataFormat(gearData, "- ", true)
                                    +"\n\u200B"
                        },   
                        {
                            "inline": true,
                            "name": "Points Allocation",
                            "value": setArrayDataFormat(SPData, "- ", true)+"\n\u200B"
                        },                    
                        {
                            "inline": true,
                            "name": "Selected Talents",
                            "value": setArrayDataFormat(traitsDataView, "- ", true)
                        },                        
                    ],
                    "color": 1879160,
                    "footer":{ 
                        "icon_url": "https://slate.silveress.ie/docs_bns/images/logo.png",
                        "text": "Powered by Silveress's BnS API - Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ HH:MM")+" UTC"
                    },
                    "thumbnail": {
                        "url": charaData.characterImg
                    }           
                }
            }
        };
        msg.channel.stopTyping();

        return msg.say(messageOutput);        
    }
};