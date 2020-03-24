const { CommandoClient } = require('discord.js-commando');
const Twitter = require('twitter');
const MongoClient = require('mongodb').MongoClient;
const MongoDBProvider = require('./commando-provider-mongo');
const path = require('path');
const ontime = require('ontime');
const dateformat = require('dateformat');

const config = require('config.json');
const services = require('./services/index.js');
const events = require('./events/index.js');
const utils = require('./utils/index.js');

const {mongoGetData, sendResetNotification, mongoItemDataUpdate, sendBotReport, sendBotStats, getGuildSettings, getGlobalSettings } = require('./core');

// Load config file
services.loadConfig();

// Maintenance mode
const maintenanceMode = config.bot.maintenance;

// Discord.js Commando scripts start here
const clientDiscord = new CommandoClient({
  commandPrefix: config.bot.default_prefix,
  owner: config.bot.author_id,
  disableEveryone: true,
  unknownCommandResponse: false,
});

const reactionEvents = {
  MESSAGE_REACTION_ADD: 'messageReactionAdd',
	MESSAGE_REACTION_REMOVE: 'messageReactionRemove',
};

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
  .registerDefaultCommands()
  .registerCommandsIn(path.join(__dirname, 'commands'));

clientDiscord
  .on('error', (error) => {
    sendBotReport(error, 'system-soyun', 'error');
    console.error(error);
  })
  .on('warn', (warn) => {
    sendBotReport(warn, 'system-soyun', 'warning');
    console.warn(warn);
  })
  // remove "//" below to enable debug log
  // .on("debug", console.log)
  .on('disconnect', () => {
    console.warn('[soyun] [system] Disconnected!');
  })
  .on('reconnecting', () => {
    console.warn('[soyun] [system] Reconnecting...');
  })
  .on('ready', async () => {    
    let globalSettings = await getGuildSettings(0);
    let botStatus = globalSettings.settings.status;

    if(maintenanceMode){
      console.log("[soyun] [system] maintenance mode is enabled, only commands will run normally");
      botStatus = {
        game: {
          name: "MAINTENANCE MODE",
          type: "PLAYING"
        },
        status: "dnd",
      };
    };

    clientDiscord.user.setPresence(botStatus).catch((error) => {
      console.error;
      sendBotReport(error, 'onReady-soyun', 'error');
    });

    console.log('[soyun] [system] Logged in and ready');
  })
  .on('guildCreate', async guild => {
    let guildSettingData = await getGuildSettings(guild.id);
    
    if(!guildSettingData){
      clientDiscord.emit('commandPrefixChange', guild.id, process.env.bot_default_prefix);
    };
  })
  .on('guildMemberAdd', async (member) => {
    await events.onMemberAdd(member);
  })
  .on('commandRun', async () => {
    if(maintenanceMode){
      console.log("[soyun] [stats] command counter disabled");
    }else{
      await services.sendStats(Date.now());
    };
  })
  .on('commandError', (error, command, message) => {
    events.onCommandError(error, command, message);
  })
  // event handling for reactions
  .on('raw', async event => {
    services.reactionRole(event, clientDiscord);
  });

clientDiscord.setProvider(
  MongoClient.connect(process.env.bot_mongodb_url, {useNewUrlParser: true, useUnifiedTopology: true}).then((client) => new MongoDBProvider(client, process.env.bot_mongodb_db_name))
).catch((error) => {
  console.error;
  sendBotReport(error, 'mongoDBProvider-soyun', 'error');
});

// Discord.js Commando scripts end here

// Twitter stream
await services.twitterStream();

// Automation scripts start here
// Quest reset notification
if(maintenanceMode){
  console.log("[soyun] [automation] system automation is disabled");
}else{
  ontime({
    cycle: ['12:00:00'],
    utc: true,
  }, await services.automationQuestReset(clientDiscord.guilds));

  // Koldrak's Lair access
  ontime({
    cycle: ['00:50:00', '03:50:00', '06:50:00', '18:50:00', '21:50:00'],
    utc: true,
  }, await services.automationKoldrak(clientDiscord.guilds));

  // Hunter's Refugee access
  ontime({
    cycle: ['01:50:00'],
    utc: true,
  }, await services.automationHunters(clientDiscord.guilds));

  // Item data update
  ontime({
    cycle: ['00:02'],
    utc: true,
  }, function(itemUpdate) {
    mongoItemDataUpdate();

    itemUpdate.done();
    return;
  }
  );
};