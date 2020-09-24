/* eslint-disable require-jsdoc */
const {Command} = require('discord.js-commando');
const utils = require('../../utils/index.js');
const services = require('../../services/index.js');

module.exports = class WhoCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'who', // command name
      aliases: ['ps', 'f2'],
      group: 'bns', // command group
      memberName: 'who', // name of the command in the group
      description: 'Show character gear and equipment.', // command desc
      examples: ['who character name', 'who'],
    });
  }

  async run(msg, args) {
    msg.channel.startTyping();

    // checking if the command disabled or not
    const globalSettings = await utils.getGlobalSetting('who');
    if (!globalSettings.status) {
      msg.channel.stopTyping();

      return msg.say('Command\'s currently disabled.'+globalSettings.message);
    }

    const start = Date.now();

    let messageOutput;
    let imageUrl;
    let description;
    let embedColour;

    let charaStats;

    let errorStatus = false;

    // getting the character name, if the user doesn't give any
    // their discord nickname will be used instead
    let query;
    if (args.length === 0) {
      // check if it's on dm
      if (msg.member) {
        // check if the message author have nickname or not
        // if not use their display name instead
        const authorNick = msg.member.nickname;
        query = (authorNick)? authorNick : msg.member.user.username;
      } else {
        query = msg.author.username;
      }
    } else {
      // encoding uri component so character with "circumflex" still searchable
      query = encodeURIComponent(args);
    }

    // temp fix for silver's api
    query = query.toLowerCase();

    // getting api data
    const apiData = await utils.fetchDB('apis', {}, {_id: 1});

    services.sendLog('debug', 'cmd-who', JSON.stringify(apiData, null, 2));

    // getting character equipments api address from the database
    const charaAPIAddress = apiData[0].address;
    // getting character traits data api address
    const playerTraitsAPI = apiData[6].address.replace('CHARACTER_NAME', query);
    // getting character skills data api address
    const playerSkillsAPI = apiData[4].address.replace('CHARACTER_NAME', query);
    // getting bnstree site address
    const playerInformationAPI = apiData[5].address;
    // getting class icon for embed
    const characterClassImage = apiData[7].address;

    let f2ProfileURL = playerInformationAPI+query;
    // replacing the space so discord.js embed wont screaming error
    f2ProfileURL = f2ProfileURL.replace(' ', '%20');

    // getting character equipments from silveress api
    const charaData = await utils.fetchSite(charaAPIAddress+query);
    // getting character selected traits from f2 page
    let traitsData = await utils.fetchSite(playerTraitsAPI);
    traitsData = traitsData.records;
    // getting character skills points distributions
    let skillsData = await utils.fetchSite(playerSkillsAPI);
    skillsData = skillsData.records;

    // checking if the data fetch return data or error
    if (charaData.status === 'error') {
      // getting default image
      imageUrl = await utils.getGlobalSetting('not_found');
      description = 'Unable to get character data.\nSite might be unreachable.';
      embedColour = 15605837;

      await services.sendLog('error', 'who', charaData);

      errorStatus = true;
    } else if (charaData.error || !traitsData || !skillsData) {
      imageUrl = await utils.getGlobalSetting('not_found');
      description = `No result on **${query}**`;
      embedColour = 16574595;

      errorStatus = true;
    }

    if (!errorStatus) {
      // getting the traits data
      let traitsDataView = [];
      if (traitsData.length === 0) {
        traitsDataView = ['*No data available*'];
      } else {
        for (let i = 0; i < traitsData.length; i++) {
          for (let j = 0; j < traitsData[i].traits.length; j++) {
            if (traitsData[i].traits[j].selected === true) {
              traitsDataView.push(traitsData[i].traits[j].name);
            }
          }
        }
      }

      // getting the skills data
      let SPData = [];
      if (skillsData.length === 0) {
        SPData = ['*No data available*'];
      } else {
        for (let i = 0; i < skillsData.length; i++) {
          for (let j = 0; j < skillsData[i].skills.length; j++) {
            if (skillsData[i].skills[j].buildup_max_level !== 0) {
              // eslint-disable-next-line max-len
              SPData.push(`${skillsData[i].skills[j].name} (${skillsData[i].skills[j].buildup_level}/${skillsData[i].skills[j].buildup_max_level})`);
            }
          }
        }
      }

      // gems data
      const gemData = [
        charaData.gem1,
        charaData.gem2,
        charaData.gem3,
        charaData.gem4,
        charaData.gem5,
        charaData.gem6,
        charaData.gem7,
        charaData.gem8,
      ];

      // soulshields
      const soulshieldData = [
        charaData.soulshield1,
        charaData.soulshield2,
        charaData.soulshield3,
        charaData.soulshield4,
        charaData.soulshield5,
        charaData.soulshield6,
        charaData.soulshield7,
        charaData.soulshield8,
      ];

      // equipments
      const gearData = [
        charaData.ringName,
        charaData.earringName,
        charaData.necklaceName,
        charaData.braceletName,
        charaData.beltName,
        charaData.gloves,
        charaData.soulName,
        charaData.soulName2,
        charaData.petAuraName,
        charaData.talismanName,
        charaData.soulBadgeName,
        charaData.mysticBadgeName,
      ];

      const clanName = (charaData.guild)? charaData.guild:'*Not in any clan*';

      // eslint-disable-next-line max-len
      const aliases = (charaData.otherNames.length > 0)? charaData.otherNames.join(', '):'*No known aliases*';

      const className = charaData.playerClass.toLowerCase().replace(/ /gm, '');
      // eslint-disable-next-line max-len
      const imageName = (className === 'Kung Fu Master')?'kungfufighter': className;
      imageUrl = characterClassImage+imageName+'.png';

      // eslint-disable-next-line max-len
      const faction = (charaData.faction !== '')? charaData.faction : '*Not in any faction*';

      // stats data
      const mystic = utils.formatNumber(charaData.mystic);
      const mysticRate = utils.formatNumber(charaData.mysticRate) * 100;
      const block = utils.formatNumber(charaData.block);
      const blockRate = utils.formatNumber(charaData.blockRate) * 100;
      const evasion = utils.formatNumber(charaData.evasion);
      const evasionRate = utils.formatNumber(charaData.evasionRate) * 100;
      const bossAP = utils.formatNumber(charaData.ap_boss);
      const bossDef = utils.formatNumber(charaData.defence_boss);
      const crit = utils.formatNumber(charaData.crit);
      const critRate = utils.formatNumber(charaData.critRate) * 100;
      const critDamage = utils.formatNumber(charaData.critDamage);
      const critDamageRate = utils.formatNumber(charaData.critDamageRate) * 100;

      embedColour = 1879160;
      charaStats = [
        {
          'name': 'Basic Information',
          'value': `**Class**: ${charaData.style} ${charaData.playerClass}\n`+
          `**Health**: ${utils.formatNumber(charaData.hp)}\n`+
          `**Level**: ${charaData.playerLevel} HM ${charaData.playerLevelHM}\n`+
          `**Attack Power**: ${utils.formatNumber(charaData.ap)}\n`+
          `**Defense**: ${utils.formatNumber(charaData.defence)}\n`+
          `**Clan**: ${clanName}\n`+
          `**Faction**: ${faction}\n`+
          `**Aliases**: ${aliases}`,
        },
        {
          'name': 'Stats',
          'value': `**Mystic**: ${mystic} (${mysticRate})\n`+
          `**Block**: ${block} (${blockRate})\n`+
          `**Evasion**: ${evasion} (${evasionRate})\n`+
          `**Boss (Attack Power - Defense)**: ${bossAP} - ${bossDef}\n`+
          `**Critical**: ${crit} (${critRate})\n`+
          `**Critical Damage**: ${critDamage} (${critDamageRate})`,
        },
        {
          'name': 'Weapon',
          'value': utils.formatString(charaData.weaponName),
        },
        {
          'name': 'Accesories',
          'value': utils.formatArray(gearData, '- ', true),
        },
        {
          'name': 'Gems',
          'value': utils.formatArray(gemData, '- ', true),
        },
        {
          'name': 'Soulshields',
          'value': utils.formatArray(soulshieldData, '- ', true),
        },
        {
          'inline': true,
          'name': 'Points Allocation',
          'value': utils.formatArray(SPData, '- ', true),
        },
        {
          'inline': true,
          'name': 'Selected Talents',
          'value': utils.formatArray(traitsDataView, '- ', true),
        },
      ];
    }

    const end = Date.now();
    const serveTime = (end-start)/1000+'s';

    if (errorStatus) {
      messageOutput = {
        'embed': {
          'title': 'Character Search',
          'color': embedColour,
          'description': description,
          'footer': {
            'icon_url': 'https://slate.silveress.ie/docs_bns/images/logo.png',
            'text': 'Powered by Silveress\'s BnS API - Served in '+serveTime,
          },
          'thumbnail': {
            'url': imageUrl,
          },
        },
      };
    } else {
      messageOutput = {
        'embed': {
          'title': `Character Information - ${charaData.characterName}`,
          'url': f2ProfileURL,
          'color': embedColour,
          'fields': charaStats,
          'footer': {
            'text': 'Powered by Silveress\'s BnS API - Served in '+serveTime,
          },
          'thumbnail': {
            'url': charaData.characterImg,
          },
        },
      };
    }

    msg.channel.stopTyping();

    return msg.say(messageOutput);
  }
};
