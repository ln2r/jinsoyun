require('dotenv').config();

const {CommandoClient} = require('discord.js-commando');
const MongoClient = require('mongodb').MongoClient;
const MongoDBProvider = require('./commando-provider-mongo');
const path = require('path');
const ontime = require('ontime');

const config = require('./config.json');
const services = require('./services/index.js');
const utils = require('./utils/index.js');
const dateformat = require('dateformat');

// Load config file
//services.loadConfig();

// Error handler
process.on('uncaughtException', async (err) => {
  await services.sendLog('error', err.name, `${err.message}\n${err.stack}`);
});

// Discord.js Commando scripts start here
const clientDiscord = new CommandoClient({
  commandPrefix: config.bot.default_prefix,
  owner: config.bot.author_id,
  disableEveryone: true,
  unknownCommandResponse: false,
  partials: ['MESSAGE', 'CHANNEL', 'REACTION']
});

clientDiscord.login(process.env.SOYUN_BOT_DISCORD_SECRET);

clientDiscord.registry
  .registerDefaultTypes()
  .registerGroups([
    ['system', 'Bot System'],
    ['guild', 'Guild'],
    ['bns', 'Blade and Soul'],
    ['dev', 'Bot Dev'],
  ])
  .registerDefaultGroups()
  .registerDefaultCommands({
    unknownCommand:false
  })
  .registerCommandsIn(path.join(__dirname, 'commands'));

clientDiscord
  .on('error', async (error) => {
    await services.sendLog('error', 'Discord', error);
  })
  .on('warn', async (warn) => {
    await services.sendLog('warn', 'Discord', warn);
  })
// remove "//" below to enable debug log
// .on("debug", console.log)
  .on('disconnect', async () => {
    await services.sendLog('warn', 'Discord', 'Connection disconnected!');
  })
  .on('reconnecting', async () => {
    await services.sendLog('info', 'Discord', 'Trying to reconnect...');
  })
  .on('ready', async () => {
    const globalSettings = await utils.getGuildSettings(0);
    let botStatus = globalSettings.status;

    if (config.bot.maintenance) {
      await services.sendLog('warn', 'Bot', 'Maintenance mode is enabled, some services disabled.');
    }

    clientDiscord.user.setPresence(botStatus).catch(async (error) => {
      await services.sendLog('error', 'Bot', error);
    });
    await services.sendLog('info', 'Bot', 'Logged in and ready.');
  })
  .on('guildCreate', async (guild) => {
    const guildSettingData = await utils.getGuildSettings(guild.id);

    if (!guildSettingData) {
      clientDiscord.emit('commandPrefixChange', guild.id, process.env.bot_default_prefix);
    }
  })
  .on('commandRun', async (command) => {
    if (config.bot.maintenance) {
      await services.sendLog('warn', 'Stats', 'Maintenance mode is enabled, command stats disabled.');
    } else {
      await services.sendLog('query', command.name, 'Request received.');
    }
  })
  .on('guildMemberAdd', async (member) => {
    const guildSettings = await utils.getGuildSettings(member.guild.id);
    const globalSettings = await utils.getGlobalSetting('welcome');

    if (guildSettings) {
      if(guildSettings.welcome){
        // checking if the guild have the channel and the message set
        if (guildSettings.welcome.status !== 'disable') {
          const guildCommandPrefix = (guildSettings.prefix)? guildSettings.prefix:config.bot.default_prefix;

          let guildWelcomeMessage = (guildSettings.welcome.message)? guildSettings.welcome.message: globalSettings;
          guildWelcomeMessage = guildWelcomeMessage.replace(/SERVER_NAME/gm, member.guild.name);
          guildWelcomeMessage = guildWelcomeMessage.replace(/MEMBER_NAME/gm, `<@${member.user.id}>`);
          guildWelcomeMessage = guildWelcomeMessage.replace(/BOT_PREFIX/gm, guildCommandPrefix);

          if (guildSettings.welcome.channel) {
            member.guild.channels.cache.find((ch) => ch.id === guildSettings.welcome.channel).send(guildWelcomeMessage);
          }

          await services.sendLog('query', 'Welcome', 'Server welcome requested.');
        }
      }
    }
  })
  .on('commandError', async (error, command, message) => {
    let errorLocation;
    let guildOwnerId;
    let guildOwnerData;
  
    if (config.bot.maintenance) {
      await services.sendLog('info', 'onCommandError', 'Error dm reporting is disabled');
    } else {
      if (message.guild) {
        errorLocation = message.guild.name;
        guildOwnerId = message.guild.ownerID;
      } else {
        errorLocation = 'DIRECT_MESSAGE';
        guildOwnerId = message.author.id;
      }

      let found = 0;
      clientDiscord.guilds.cache.map(function(guild) {
        // looking for the guild owner data (username and discriminator)
        guild.members.cache.map((member) => {
          if (found === 0) {
            if (member.id === guildOwnerId) {
              found = 1;
              guildOwnerData = member.user.username+'#'+member.user.discriminator;
            }
          }
        });
      });
  
      // sending dm
      for (let i=0; i < clientDiscord.owners.length; i++) {
        clientDiscord.owners[i].send(
          'Error Occured on `'+error.name+'`'+
            '\n__Details__:'+
            '\n**Time**: '+dateformat(Date.now(), 'dddd, dS mmmm yyyy, h:MM:ss TT')+
            '\n**Location**: '+errorLocation+
            '\n**Guild Owner**: '+guildOwnerData+
            '\n**Content**: `'+message.content+'`'+
            '\n**Message**:\n'+command.name+': '+command.message
        ).catch(async (err) => {
          await services.sendLog('error', 'onCommandError', err);
        });
      }

      // logging the error report
      await services.sendLog('error', errorLocation, command.message);
    }  
  })
  .on('messageReactionAdd', async (reaction, user) => {
    // fetching the reaction data
    if (reaction.message.partial) await reaction.message.fetch();
    if (reaction.partial) await reaction.fetch();

    services.reactionRole(reaction, user, 'add', clientDiscord.user.id);
  })
  .on('messageReactionRemove', async (reaction, user) => {
    // fetching the reaction data
    if (reaction.message.partial) await reaction.message.fetch();
    if (reaction.partial) await reaction.fetch();

    services.reactionRole(reaction, user, 'remove', clientDiscord.user.id);
  });

clientDiscord.setProvider(
  MongoClient.connect(process.env.SOYUN_BOT_DB_CONNECT_URL, {useNewUrlParser: true, useUnifiedTopology: true}).then((client) => new MongoDBProvider(client, process.env.SOYUN_BOT_DB_NAME))
).catch(async (error) => {
  await services.sendLog('error', 'Database', error);
});

// Discord.js Commando scripts end here

// Twitter stream
services.twitterStream(clientDiscord);

// Automation
// Quest reset notification
if (config.bot.maintenance) {
  services.sendLog('warn', 'Automation', 'Maintenance mode is enabled, automation disabled.');
} else {
  ontime({
    cycle: ['12:00:00'],
    utc: true,
  }, async function(reset) {
    await services.automationQuestReset(clientDiscord);

    reset.done();
    return;
  });

  // Koldrak's Lair access
  ontime({
    cycle: ['00:50:00', '03:50:00', '06:50:00', '18:50:00', '21:50:00'],
    utc: true,
  }, async function(koldrak) {
    await services.automationKoldrak(clientDiscord);

    koldrak.done();
    return;
  });

  // Hunter's Refugee access
  ontime({
    cycle: ['01:50:00'],
    utc: true,
  }, async function(hunter) {
    await services.automationHunters(clientDiscord);

    hunter.done();
    return;
  });

  // Item data update
  ontime({
    cycle: ['00:02'],
    utc: true,
  }, function(items) {
    services.automationItemUpdate();

    items.done();
    return;
  });
}
