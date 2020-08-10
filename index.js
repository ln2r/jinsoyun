require('dotenv').config();

const {CommandoClient} = require('discord.js-commando');
const MongoClient = require('mongodb').MongoClient;
const MongoDBProvider = require('./commando-provider-mongo');
const path = require('path');
const ontime = require('ontime');

const config = require('./config.json');
const services = require('./services/index.js');
const utils = require('./utils/index.js');

const cron = require('./cron/cron');

// checking global setting
services.checkConfig();

// Error handler
process.on('uncaughtException', (err) => {
  services.sendLog('error', err.name, `${err.message}\n${err.stack}`);
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
  .on('error', (error) => {
    services.sendLog('error', 'Discord', error);
  })
  .on('warn', (warn) => {
    services.sendLog('warn', 'Discord', warn);
  })
// remove "//" below to enable debug log
// .on("debug", console.log)
  .on('disconnect', () => {
    services.sendLog('warn', 'Discord', 'Connection disconnected!');
  })
  .on('reconnecting', () => {
    services.sendLog('info', 'Discord', 'Trying to reconnect...');
  })
  .on('ready', async () => {
    const globalSettings = await utils.getGuildSettings(0);
    let botStatus = globalSettings.status;

    if (config.bot.maintenance) {
      services.sendLog('warn', 'Bot', 'Maintenance mode is enabled, some services disabled.');
    }

    clientDiscord.user.setPresence(botStatus).catch(async (error) => {
      services.sendLog('error', 'Bot', error);
    });
    services.sendLog('info', 'Bot', 'Logged in and ready.');
  })
  .on('guildCreate', async (guild) => {
    const guildSettingData = await utils.getGuildSettings(guild.id);

    if (!guildSettingData) {
      clientDiscord.emit('commandPrefixChange', guild.id, process.env.bot_default_prefix);
    }

    services.sendLog('info', 'Bot', `Joined new legendary guild called "${guild.name}"`);
  })
  .on('commandRun', (command) => {
    if (config.bot.maintenance) {
      services.sendLog('warn', 'Stats', 'Maintenance mode is enabled, command stats disabled.');
    } else {
      services.sendLog('query', command.name, 'Request received.');
    }
  })
  .on('guildMemberAdd', async (member) => {
    
    services.newMember(member);
  })
  .on('commandError', (error, command, message) => {
    let errorLocation;
    let guildOwnerId;
    let guildOwnerData;
  
    if (config.bot.maintenance) {
      services.sendLog('info', 'onCommandError', 'Error dm reporting is disabled');
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

      // sending report
      services.sendLog('error', 'Commands', `\`${error.name}:${command.name}\` - "${message.content}\n${command.name}:${command.message}" @ ${errorLocation} (${guildOwnerData})`, clientDiscord);
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
if (config.bot.maintenance) {
  services.sendLog('warn', 'Automation', 'Maintenance mode is enabled, automation disabled.');
} else {
  ontime({
    cycle: ['50:00'],
    utc: true,
  }, async (hourly) => {
    services.sendLog('info', 'Automation', 'Running "hourly" automation process...');
    
    await cron(clientDiscord);
    hourly.done();
    return;
  });
}
