# Jinsoyun
A discord bot built for Blade &amp; Soul's NA Server

## Noteable Features
* Daily, weekly and event information and announcement on reset
* Character searching
* Marketplace data

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
Bot configuration data is located in 2 places, theres one in `config.json` and the other one is in the MongoDB collection

### .env File
* `bot.default_prefix` - `String`: bot command default prefix
* `bot.author_id` - `Array`: array of bot author id
* `bot.maintenance` - `Boolean`: bot maintenance mode, will disable some feature if enabled
* `database.url` - `String` MongoDB database connection URL
* `database.name` - `String`: name of MongoDB database which will be used
* `key.discord` - `String` discord bot app token
* `key.twitter.consumer_key` - `String`: twitter app consumer key
* `key.twitter.consumer_secret` - `String`: twitter app consumer secret key
* `key.twitter.token_key` - `String`: twitter app access token key
* `key.twitter.token_secret` - `String`: twitter app access token secret key
* `twitter.id` - `String`: followed accounts id

Template:
  ```JSON
  {
    "bot":{
      "default_prefix": "!",
      "author_id": ["YOUR DISCORD ID HERE"],
      "maintenance": false
    },
    "database":{
      "url": "YOUR MONGODB CONNECTION URL HERE",
      "name": "YOUR MONGODB DATABASE NAME HERE"
    },
    "key":{
      "discord": "YOUR DISCORD TOKEN HERE",
      "twitter":{
        "consumer_key": "YOUR TWITTER CONSUMER KEY HERE",
        "consumer_secret": "YOUR TWITTER CONSUMER SECRET KEY HERE",
        "token_key": "YOUR TWITTER TOKEN KEY HERE",
        "token_secret": "YOUR TWITTER TOKEN SECRET HERE"
      }
    },
    "twitter":{
      "id": "TWITTER ID NUMBER HERE"
    }
  }
  ```

### Bot Configuration Data
Bot configuration is now saved in `configs` with `guild` id `0`, you can check the data in [mongoexport/config.json](https://github.com/ln2r/jinsoyun/blob/dev/mongoexport/configs.json)
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

## Support
If you find this bot useful and want to give some tips or something like that you can use this thing below.
* [ko-fi](https://ko-fi.com/ln2rworks)

## License
*Code of this project is licensed under MIT license*
