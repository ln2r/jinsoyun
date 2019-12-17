const dotenv = require('dotenv').config();

const { CommandoClient } = require('discord.js-commando');
const Twitter = require('twitter');
const MongoClient = require('mongodb').MongoClient;
const MongoDBProvider = require('./commando-provider-mongo');
const path = require('path');
const ontime = require('ontime');
const dateformat = require('dateformat');

const {mongoGetData, sendResetNotification, mongoItemDataUpdate, sendBotReport, sendBotStats, getGuildSettings, getGlobalSettings } = require('./core');

// Maintenance mode
const maintenanceMode = process.env.bot_maintenance_mode;

// Discord.js Commando scripts start here
const clientDiscord = new CommandoClient({
  commandPrefix: process.env.bot_default_prefix,
  owner: process.env.bot_owner_id,
  disableEveryone: true,
  unknownCommandResponse: false,
});

const reactionEvents = {
  MESSAGE_REACTION_ADD: 'messageReactionAdd',
	MESSAGE_REACTION_REMOVE: 'messageReactionRemove',
};

clientDiscord.login(process.env.discord_secret);

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
    .on('ready', () => {
      console.log('[soyun] [system] Logged in and ready');

      let botStatus = {
        game: {
          name: '@Jinsoyun help',
          type: 'LISTENING',
        },
      };

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
    })
    .on('guildCreate', async guild => {
      let guildSettingData = await getGuildSettings(guild.id);
      
      if(!guildSettingData){
        clientDiscord.emit('commandPrefixChange', guild.id, process.env.bot_default_prefix);
      };
    })
    .on('guildMemberAdd', async (member) => {
      let guildSettingData = await getGuildSettings(member.guild.id);
      let guildCommandPrefix = guildSettingData.settings.prefix;
      if(guildCommandPrefix === undefined || guildCommandPrefix === null){
        guildCommandPrefix = "!";
      }

      if (guildSettingData) {
        let memberGate = guildSettingData.settings.member_gate;
        
        // checking if the guild have the channel and the message set
        if(memberGate){
          if (memberGate.channel_id) {
            member.guild.channels.find((ch) => ch.id === memberGate.channel_id).send(
              'Hi <@'+member.user.id+'>! Welcome to ***'+member.guild.name+'***!\n\n'+

              'Before I give you access to the rest of the server I need to know your character\'s name, to do that please use the following command with your information in it\n\n'+
            
              '`'+guildCommandPrefix+'join character name`\n'+
              '**Example**:\n'+
              '`'+guildCommandPrefix+'join jinsoyun `\n\n'+

              'if you need any assistance you can mention or DM available admins, thank you ❤'
            );
          };
        };
      };
    })
    .on('commandRun', async () => {
      if(maintenanceMode){
        console.log("[soyun] [stats] command counter disabled");
      }else{
        await sendBotStats(Date.now());
      };
    })
    .on('commandError', (error, command, message) => {
      if(maintenanceMode){
        console.log("[soyun] [error-report] error reporting disabled");
      }else{
        if(message.guild){
          errorLocation = message.guild.name;
          guildOwnerId = message.guild.ownerID;
        }else{
          errorLocation = "DIRECT_MESSAGE";
          guildOwnerId = message.author.id;
        }
        // sending the error report to the database
        sendBotReport(command.name+': '+command.message, error.name+'-'+errorLocation, 'error');
        console.error('[soyun] ['+error.name+'] '+command.name+': '+command.message);

        // dm bot owner for the error
        let found = 0;
        clientDiscord.guilds.map(function(guild) { // looking for the guild owner data (username and discriminator)
          guild.members.map((member) => {
            if (found === 0) {
              if (member.id === guildOwnerId) {
                found = 1;

                for (let i=0; i < clientDiscord.owners.length; i++) {
                  clientDiscord.owners[i].send(
                      'Error Occured on `'+error.name+'`'+
                      '\n__Details__:'+
                      '\n**Time**: '+dateformat(Date.now(), 'dddd, dS mmmm yyyy, h:MM:ss TT')+
                      '\n**Location**: '+errorLocation+
                      '\n**Guild Owner**: '+member.user.username+'#'+member.user.discriminator+
                      '\n**Content**: `'+message.content+'`'+
                      '\n**Message**:\n'+command.name+': '+command.message
                  ).then(
                    function(message) {
                      message.react('✅');
                      message.react('❎');
                    }
                  ).catch((err) => {
                    sendBotReport(err, 'errorDM-soyun', 'error');
                  });
                };
              };
            };
          });
        });
      };
    })
    // event handling for reactions
    .on('raw', async event => {
      /**
       * Original algorithm by Sam-DevZ
       * https://github.com/Sam-DevZ/Discord-RoleReact
       */

      // check if the event have the reactions property
      if(!reactionEvents.hasOwnProperty(event.t)) return;
      const { d: data } = event;
      const user = clientDiscord.users.get(data.user_id);

      // check if it's the bot
      if(data.user_id === clientDiscord.user.id) return;
      
      // get role data from db
      let guildSettings = await getGuildSettings(data.guild_id);

      if(guildSettings && guildSettings.length !== 0){
        guildReactionRoleData = guildSettings.settings.react_role;
    
        if(guildReactionRoleData){
          const channel = clientDiscord.channels.get(data.channel_id);
          // checking channel and finding the message
          let found = false;
          let messageIndex;

          for(let i=0; i<guildReactionRoleData.length; i++){
            if(guildReactionRoleData[i].channel === data.channel_id && guildReactionRoleData[i].id === data.message_id){
              messageIndex = i;
              found = true;
            };
          };

          if(found){
            // checking the message
            if(data.message_id === guildReactionRoleData[messageIndex].id){
              const message = await channel.fetchMessage(data.message_id);
              const member = message.guild.members.get(user.id);

              // checking the emoji and getting the index
              if(guildReactionRoleData[messageIndex].reactions){
                let emojiData;
                if(data.emoji.id){
                  emojiData = data.emoji.name+":"+data.emoji.id;
                }else{
                  emojiData = data.emoji.name;
                };

                // checking the emoji and getting the role id
                let reactionFound = false;
                let reactionIndex;
                for(let i=0; i<guildReactionRoleData[messageIndex].reactions.length; i++){
                  if(guildReactionRoleData[messageIndex].reactions[i].emoji === emojiData){
                    reactionFound = true;
                    reactionIndex = i;
                  };
                };

                if(reactionFound){
                  // checking if once
                  if(guildReactionRoleData[messageIndex].reactions[reactionIndex].once){
                    member.addRole(guildReactionRoleData[messageIndex].reactions[reactionIndex].role);
                    // removing the reaction
                    channel.fetchMessage(guildReactionRoleData[messageIndex].id).then(message => {
                      let filtered = message.reactions.filter(reaction => reaction.emoji.name === data.emoji.name);

                      filtered.forEach(reaction => reaction.remove(user.id));
                    });
                  }else{
                    // check if the event add or remove
                    if(event.t === "MESSAGE_REACTION_ADD"){
                      member.addRole(guildReactionRoleData[messageIndex].reactions[reactionIndex].role);
                    }else{
                      member.removeRole(guildReactionRoleData[messageIndex].reactions[reactionIndex].role)
                    };
                  };
                };
              };                
            };
          };
        };
      };
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
      let payloadStatus = 'received';

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
          payloadStatus = 'rejected';  
        }

        const twtFilter = tweet.text.toString().substring(0).split(' ');

        // Filtering the "RT" and "mention" stuff
        if (twtFilter[0] === 'RT' || twtFilter[0].charAt(0) === '@') {
          payloadStatus = 'rejected';
        }
        
        if(payloadStatus !== "rejected"){
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
      console.log('[soyun] [twitter] Twitter stream activity detected, status: '+payloadStatus);
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
  }, function(koldrakAnnounce){
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
    
    koldrakAnnounce.done();
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