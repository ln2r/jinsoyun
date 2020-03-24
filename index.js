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

// Twitter stream scripts start here
if(maintenanceMode){
  console.log("[soyun] [twitter] twitter is disabled");
}else{
  const clientTwitter = new Twitter({
    consumer_key: process.env.twitter_consumer_key,
    consumer_secret: process.env.twitter_consumer_secret,
    access_token_key: process.env.twitter_access_token_key,
    access_token_secret: process.env.twitter_access_token_secret,
  });

  clientTwitter.stream('statuses/filter', {follow: '3521186773, 819625154'}, async function(stream) {
    const twitterAPIData = await mongoGetData('apis', {name: 'Twitter'});
    const twitterTrackedUser = twitterAPIData[0].stream_screenname;
    let twitterUserValid = false;

    stream.on('data', async function(tweet) {
      let payloadStatus = true;

      // checking if it's valid account
      for (let i=0; i<twitterTrackedUser.length; i++) {
        if (tweet.user.screen_name === twitterTrackedUser[i]) {
          twitterUserValid = true;
        }
      }

      if (twitterUserValid) {
        // checking global settings
        let globalSettings = await getGlobalSettings("twitter");
        if(!globalSettings.status){
          console.log('[soyun] [twitter] Twitter post notification disabled, '+globalSettings.message);
          payloadStatus = false;  
        }

        const twtFilter = tweet.text.toString().substring(0).split(' ');

        // Filtering the "RT" and "mention" stuff
        if (twtFilter[0] === 'RT' || twtFilter[0].charAt(0) === '@') {
          payloadStatus = false;
        }
        
        if(payloadStatus){
          if (tweet.extended_tweet) {
            twtText = tweet.extended_tweet.full_text.toString().replace('&amp;', '&');
          } else {
            twtText = tweet.text.toString().replace('&amp;', '&');
          }

          if (tweet.is_quote_status) {
            twtText = twtText+' RT @'+tweet.quoted_status.user.screen_name+' '+(tweet.quoted_status.text.toString().replace('&amp;', '&'));
          }

          // Making the color different for different user
          if (tweet.user.screen_name === twitterTrackedUser[0]) {
            twtColor = 16753920;
          } else {
            twtColor = 1879160;
          }

          // getting image if there's any
          if(tweet.entities.media){
            twtThumbnail = tweet.entities.media[0].media_url;
          }else{
            twtThumbnail = "";
          }

          const embedData = {
            'embed': {
              'title': tweet.user.name,
              'url': 'https://twitter.com/'+tweet.user.screen_name,
              'description': twtText,
              'image': {
                'url': twtThumbnail
              },
              'color': twtColor,
              'timestamp': new Date(),
              'footer': {
                'text': tweet.user.name,
                'icon_url': tweet.user.profile_image_url,
              },
            },
          };

          // sending the tweet
          clientDiscord.guilds.map(async function(guild) {
            // getting guild setting data
            let guildSettingData = await getGuildSettings(guild.id);

            let twitterChannel = '';
            if (guildSettingData !== undefined) {
              twitterChannel = guildSettingData.settings.twitter;
            }

            let found = 0;
            guild.channels.map((ch) => {
              if (found === 0) {
                if (ch.id === twitterChannel && twitterChannel !== '' && twitterChannel !== 'disable') {
                  found = 1;
                  if(ch.permissionsFor(clientDiscord.user).has('EMBED_LINKS', 'SEND_MESSAGES', 'VIEW_CHANNEL')){
                    ch.send(embedData);
                  };
                };
              };
            });
          });
          console.log('[soyun] [twitter] '+tweet.user.name+'\'s tweet sent');
        }
      }
      console.log('[soyun] [twitter] Twitter stream activity detected');
    });

    stream.on('error', function(error) {
      sendBotReport(error, 'twitter-soyun', 'error');
      console.error(error);
    });
  });
}
// Twitter stream script end here

// Automation scripts start here
// Quest reset notification
if(maintenanceMode){
  console.log("[soyun] [automation] system automation is disabled");
}else{
  ontime({
    cycle: ['12:00:00'],
    utc: true,
  }, async function(reset) {
    // checking if it disabled or not
    let globalSettings = await getGlobalSettings("reset");
    if(!globalSettings.status){
        console.log("[soyun] [reset] reset notification currently disabled, "+globalSettings.message);
    }else{
      sendResetNotification(clientDiscord.guilds);
    };

    reset.done();
    return;
  }
  );

  // Koldrak's Lair access
  ontime({
    cycle: ['00:50:00', '03:50:00', '06:50:00', '18:50:00', '21:50:00'],
    utc: true,
  }, async function(koldrakAnnounce){
    
    // checking global settings
    let globalSettings = await getGlobalSettings("koldrak_announce");
    if(!globalSettings.status){
      console.log("[soyun] [koldrak] koldrak access notification disabled, "+globalSettings.message);
    
      huntersAnnounce.done();

      return;
    };

    clientDiscord.guilds.map(async function(guild) {
      // getting guild setting data
      let guildSettingData = await getGuildSettings(guild.id);

      let koldrakChannel = '';
      if (guildSettingData !== undefined) {
        koldrakChannel = guildSettingData.settings.koldrak;
      }

      let found = 0;
      guild.channels.map((ch) => {
        if (found === 0) {
          if (ch.id === koldrakChannel && koldrakChannel !== '' && koldrakChannel !== 'disable') {
            found = 1;
            if(ch.permissionsFor(clientDiscord.user).has('EMBED_LINKS', 'SEND_MESSAGES', 'VIEW_CHANNEL')){
              ch.send({
                "embed":{
                  "color": 8388736,
                  "description": "**Koldrak's Lair** will be accessible in **10 Minutes**",
                  "author":{
                    "name": "Epic Challenge Alert",
                    
                  },
                  "footer":{
                    "icon_url": "https://cdn.discordapp.com/emojis/463569669584977932.png?v=1",
                    "text": "Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ HH:MM")+" UTC"
                  }
                }
              });
            };
          };
        };
      });
    });

    console.log("[soyun] [koldrak] koldrak access notification sent");
    
    koldrakAnnounce.done();
    return;
  })

  // Hunter's Refugee access
  ontime({
    cycle: ['01:50:00'],
    utc: true,
  }, async function(huntersAnnounce){

    // checking global settings
    let globalSettings = await getGlobalSettings("hunters_refugee");
    if(!globalSettings.status){
      console.log("[soyun] [hunter's] hunter's access notification disabled, "+globalSettings.message);
    
      huntersAnnounce.done();

      return;
    };

    clientDiscord.guilds.map(async function(guild) {
      // getting guild setting data
      let guildSettingData = await getGuildSettings(guild.id);

      let huntersChannel = '';
      if (guildSettingData !== undefined) {
        huntersChannel = guildSettingData.settings.hunters_refugee;
      }

      let found = 0;
      guild.channels.map((ch) => {
        if (found === 0) {
          if (ch.id === huntersChannel && huntersChannel !== '' && huntersChannel !== 'disable') {
            found = 1;
            if(ch.permissionsFor(clientDiscord.user).has('EMBED_LINKS', 'SEND_MESSAGES', 'VIEW_CHANNEL')){
              ch.send({
                "embed":{
                  "color": 8388736,
                  "description": "**Hunter's Refugee** will be accessible in **10 Minutes**",
                  "author":{
                    "name": "Event Alert",
                    
                  },
                  "footer":{
                    "icon_url": "https://cdn.discordapp.com/emojis/463569669584977932.png?v=1",
                    "text": "Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ HH:MM")+" UTC"
                  }
                }
              });
            };
          };
        };
      });
    });

    console.log("[soyun] [hunter's] hunter's access notification sent");
    
    huntersAnnounce.done();
    return;
  })

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