const Twitter = require('twitter');
const utils = require('../utils/index.js');
const config = require('../config.json');
const sendLog = require('./sendLog');

// Maintenance mode
const maintenanceMode = config.bot.maintenance;

/**
 * twitterStream
 * send twitter's tweet to enabled guild
 */
module.exports = async function(clientDiscord) {
  if (maintenanceMode) {
    sendLog('warn', 'Twitter', 'Maintenance mode is enabled, twitter disabled.');
  } else {
    const clientTwitter = new Twitter({
      consumer_key: process.env.SOYUN_BOT_TWITTER_CONSUMER_KEY,
      consumer_secret: process.env.SOYUN_BOT_TWITTER_CONSUMER_SECRET,
      access_token_key: process.env.SOYUN_BOT_TWITTER_ACCESS_KEY,
      access_token_secret: process.env.SOYUN_BOT_TWITTER_ACCESS_SECRET,
    });

    sendLog('info', 'Twitter', 'Twitter stream started.');

    clientTwitter.stream('statuses/filter', {follow: config.twitter.id}, async function(stream) {
      const twitterAPIData = await utils.fetchDB('apis', {name: 'Twitter'});
      const twitterTrackedUser = twitterAPIData[0].stream_screenname;
      let twitterUserValid = false;
      let twtText;
      let twtColor;
      let twtThumbnail;

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
          const globalSettings = await utils.getGlobalSetting('twitter');
          if (!globalSettings.status) {
            sendLog('warn', 'Twitter', 'Twitter stream disabled, '+globalSettings.message);
            payloadStatus = false;
          }

          const twtFilter = tweet.text.toString().substring(0).split(' ');

          // Filtering the "RT" and "mention" stuff
          if (twtFilter[0] === 'RT' || twtFilter[0].charAt(0) === '@') {
            payloadStatus = false;
          }

          if (payloadStatus) {
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
            if (tweet.entities.media) {
              twtThumbnail = tweet.entities.media[0].media_url;
            } else {
              twtThumbnail = '';
            }

            const embedData = {
              'embed': {
                'title': tweet.user.name,
                'url': 'https://twitter.com/'+tweet.user.screen_name,
                'description': twtText,
                'image': {
                  'url': twtThumbnail,
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
            clientDiscord.guilds.cache.map(async function(guild) {
              // getting guild setting data
              const guildSettingData = await utils.getGuildSettings(guild.id);

              let twitterChannel = '';
              if (guildSettingData !== undefined) {
                twitterChannel = guildSettingData.settings.twitter;
              }

              let found = 0;
              guild.channels.cache.map((ch) => {
                if (found === 0) {
                  if (ch.id === twitterChannel && twitterChannel !== '' && twitterChannel !== 'disable') {
                    found = 1;
                    if (ch.permissionsFor(clientDiscord.user).has('EMBED_LINKS', 'SEND_MESSAGES', 'VIEW_CHANNEL')) {
                      ch.send(embedData);
                    }
                  }
                }
              });
            });
            sendLog('info', 'Twitter', tweet.user.name+'\'s tweet sent');
          }
        }
        sendLog('info', 'Twitter', 'Stream activity detected');
      });

      stream.on('error', function(error) {
        sendLog('info', 'Twitter', 'Error occured on Twitter stream.\n'+error);
      });
    });
  }
};
