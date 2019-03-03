# Jinsoyun
A Discord bot built for a NA Blade &amp; Soul clan Grumpy Butts.

## Features
### Bot
* Daily challenges information and announcement on reset
* Weekly challenges information and announcement on reset
* Current event summary information and announcement on reset
* Koldrak's lair access announcement
* Character information searching
* Marketplace data

### Other
* MongoDB based database system.
* React based website for bot database frontend.
* API endpoints for less automated data.

## Installation / Getting Started
### Invitation Url
DM me on discord for the invitation url (Username and tag on the bottom of this file).

### Self-Host
If you want to host the bot yourself just follow the instruction below. The downside is you need to update daily, weekly and event data manually (updated data usually will be provided via API endpoints when available).

**Requirements**:
* [Discord App Token](https://discordapp.com/developers/applications/) - [Guide how to get Discord App Token](https://anidiots.guide/getting-started/getting-started-long-version)
* [Twitter API Token](https://developer.twitter.com/) - [Guide how to get Twitter API Token](https://developer.twitter.com/en/docs/basics/authentication/guides/access-tokens.html)
* [node.js](https://nodejs.org/)
* [MongoDB](https://www.mongodb.com/)
* [Jinsoyun Bot Database] (WIP)

**How-to**:
* To configure the bot, make `.env` file in `bot` folder with this data:
  ```
  # bot stuff
  bot_mongodb_url = MONGODB_CONNECTION_URL
  bot_mongodb_db_name = MONGODB_DATABASE_NAME
  bot_default_prefix = DEFAULT_BOT_PREFIX
  bot_owner_id = YOUR_DISCORD_ID

  # keys and secrets
  discord_secret = YOUR_DISCORD_APP_TOKEN
  twitter_consumer_key = YOUR_TWITTER_CONSUMER_KEY
  twitter_consumer_secret = YOUR_TWITTER_CONSUMER_SECRET
  twitter_access_token_key = YOUR_TWITTER_ACCESS_TOKEN_KEY
  twitter_access_token_secret = YOUR_TWITTER_ACCESS_TOKEN_SECRET
  ```
* Make a MongoDB database with the name you specified and then make these collections ( check `mongoexport` folder)
  * `apis` api info 
  * `challenges` dailies and weeklies rewards and quests
  * `classes` classes info and data
  * `configs` configuration data (only containing default market image placeholder for now)
  * `dungeons` dungeon data
  * `events` event info and details
  * `items` item data and it's market data

* Open Node.js command prompt and navigate to your bot directory.
* Do `npm update` to get bot depencies.
* Go to `bot` directory and do `node index.js` to run the bot.

## Bot Configurations
Bot configuration data is located in 2 places, the one in `.env` file and the other one is in the MongoDB collection

### .env File
* `bot_mongodb_url` MongoDB connection url
* `bot_mongodb_db_name` bot MongoDB database name
* `bot_default_prefix` bot command default prefix
* `bot_owner_id` your discord profile id

### MongoDB Collection Called configs
* `DEFAULT_MARKET_THUMBNAIL` default image placeholder when market command can't find item(s)

## Acknowledgments & Credits
* **Rizky Sedyanto** - *Initial work* - [ln2r](https://ln2r.web.id/); Discord: ln2r#1691
* **Built With**
  * [Visual Studio Code](https://code.visualstudio.com/) - Editor
  * [discord.js](https://discord.js.org/) - Discord API node.js module
  * [Silveress](https://bns.silveress.ie/) - BnS unofficial API
  * [React](https://reactjs.org/) - Backend database interface
  * [discord.js commando](https://github.com/discordjs/Commando) - discord.js command framework
  * [Commando MongoDBProvider](https://github.com/paulhobbel/commando-provider-mongo) - MongoDB provider for Commando
* **Database Contributor**
  * Daily, Weekly and Challenges Rewards data - **Maeyuka**

## License
*Code of this project is licensed under MIT license*
