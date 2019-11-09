# Jinsoyun
A Discord bot built for a NA Blade &amp; Soul clan Grumpy Butts.

## Features
* Daily challenges information and announcement on reset
* Weekly challenges information and announcement on reset
* Current event summary information and announcement on reset
* Character information searching
* Marketplace data
* Smart bid calculator

## Installation / Getting Started
### Invitation Url
DM me on discord for the invitation url (Username and tag on the bottom of this file).

### Self-Host
If you want to host the bot yourself just follow the instruction below. The downside is you need to update daily, weekly and event data manually.

**Requirements**:
* [Discord App Token](https://discordapp.com/developers/applications/) - [Guide how to get Discord App Token](https://anidiots.guide/getting-started/getting-started-long-version)
* [Twitter API Token](https://developer.twitter.com/) - [Guide how to get Twitter API Token](https://developer.twitter.com/en/docs/basics/authentication/guides/access-tokens.html)
* [node.js](https://nodejs.org/)
* [MongoDB](https://www.mongodb.com/)
* [Jinsoyun Bot Database](http://jinsoyun.ln2r.web.id/api/)

**How-to**:
* Make a MongoDB database with the name you specified and then make these collections (check [`mongoexport`](https://github.com/ln2r/jinsoyun/tree/stable/mongoexport) folder (challenges and events data might be outdated))
  - `apis` api info 
  - `challenges` dailies and weeklies rewards and quests
  - `configs` bot configuration data
  - `dungeons` dungeons data
  - `events` event info and details
  - `items` item data and it's market data
  - `quests` quests data
* [Create `.env` file](https://github.com/ln2r/jinsoyun/blob/dev/README.md#env-file)
* Open Node.js command prompt and navigate to your bot directory.
* Do `npm install` to get bot dependencies.
* Do `node index.js` to run the bot.

## Bot Configurations
Bot configuration data is located in 2 places, the one in `.env` file and the other one is in the MongoDB collection

### .env File
* `bot_mongodb_url` - `String`: MongoDB connection url
* `bot_mongodb_db_name` - `String`: bot MongoDB database name
* `bot_default_prefix` - `String`: bot command default prefix
* `bot_owner_id` - `String` your discord profile id
* `bot_maintenance_mode` - `Boolean`: bot maintenance mode, will disable some feature if enabled
* `discord_secret` - `String` discord bot app token
* `twitter_consumer_key` - `String`: twitter app consumer key
* `twitter_consumer_secret` - `String`: twitter app consumer secret key
* `twitter_access_token_key` - `String`: twitter app access token key
* `twitter_access_token_secret` - `String`: twitter app access token secret key

Template:
  ```env
  # bot stuff
  bot_mongodb_url = MONGODB_CONNECTION_URL
  bot_mongodb_db_name = MONGODB_DATABASE_NAME
  bot_default_prefix = DEFAULT_BOT_PREFIX
  bot_owner_id = YOUR_DISCORD_ID
  bot_maintenance_mode = false

  # keys and secrets
  discord_secret = YOUR_DISCORD_APP_TOKEN
  twitter_consumer_key = YOUR_TWITTER_CONSUMER_KEY
  twitter_consumer_secret = YOUR_TWITTER_CONSUMER_SECRET
  twitter_access_token_key = YOUR_TWITTER_ACCESS_TOKEN_KEY
  twitter_access_token_secret = YOUR_TWITTER_ACCESS_TOKEN_SECRET
  ```

### Bot Configuration Data
Bot configuration is now saved in `configs` with `guild` id `0`, you can check the data in [mongoexport/config.json]()
Explanation:
* `reset`: Reset notification containing daily, weekly challenges and event summary.
* `twitter`: Blade & Soul and Blade & Soul ops twitter post.
* `koldrak`: Koldrak's Lair access notification.
* `commands` : List of commands.
* `not_found` : Default image when item/character can't be found.

## Acknowledgments & Credits
* **Rizky Sedyanto** - *Initial work* - [ln2r](https://ln2r.tumblr.com/); Discord: ln2r#1691
* **Built With**
  * [Visual Studio Code](https://code.visualstudio.com/) - Editor
  * [discord.js](https://discord.js.org/) - Discord API node.js module
  * [Silveress](https://bns.silveress.ie/) - Blade and Soul unofficial API
  * [discord.js commando](https://github.com/discordjs/Commando) - discord.js command framework
  * [Commando MongoDBProvider](https://github.com/paulhobbel/commando-provider-mongo) - MongoDB provider for Commando

## License
*Code of this project is licensed under MIT license*
