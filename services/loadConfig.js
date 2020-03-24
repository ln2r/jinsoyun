const config = require('../config.json');

module.exports = function(){
    process.env.SOYUN_BOT_DB_CONNECT_URL = config.database.url;
    process.env.SOYUN_BOT_DB_NAME = config.database.name;
    
    process.env.SOYUN_BOT_DISCORD_SECRET = config.key.discord;
    process.env.SOYUN_BOT_TWITTER_CONSUMER_KEY = config.key.discord;
    process.env.SOYUN_BOT_TWITTER_CONSUMER_SECRET = config.key.discord;
    process.env.SOYUN_BOT_TWITTER_ACCESS_KEY = config.key.twitter.token_key;
    process.env.SOYUN_BOT_TWITTER_ACCESS_SECRET = config.key.twitter.token_secret;

    console.log(`[soyun] [bot] Config data loaded`);
}