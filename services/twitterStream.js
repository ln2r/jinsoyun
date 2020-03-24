const Twitter = require('twitter');
const utils = require('../utils/index');

const config = require('../config.json');

// Maintenance mode
const maintenanceMode = config.bot.maintenance;

/**
 * twitterStream
 * send twitter's tweet to enabled guild
 */
module.exports = async function(){
  if(maintenanceMode){
    console.log("[soyun] [twitter] twitter is disabled");
  }else{
    const clientTwitter = new Twitter({
      consumer_key: process.env.twitter_consumer_key,
      consumer_secret: process.env.twitter_consumer_secret,
      access_token_key: process.env.twitter_access_token_key,
      access_token_secret: process.env.twitter_access_token_secret,
    });

    clientTwitter.stream('statuses/filter', {follow: config.twitter.id}, async function(stream) {
      const twitterAPIData = await utils.fetchDB('apis', {name: 'Twitter'});
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
          let globalSettings = await utils.getGlobalSetting("twitter");
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
              let guildSettingData = await utils.getGuildSettings(guild.id);

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
}