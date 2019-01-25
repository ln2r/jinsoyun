# Jinsoyun
A Discord bot built for a NA Blade &amp; Soul clan Grumpy Butts

## Feature
* Daily challenges information and announcement on reset
* Weekly challenges information and announcement on reset
* Current event summary information and announcement on reset
* Koldrak's lair access announcement
* Character information searching
* Marketplace data

## Installing / Getting Started
This bot is created using if you want to run this bot yourself below here's how to guide.

### Hosted
If you want the hosted version of the bot and just want the invitation url for your server, you can dm me on discord for the invitation url.

### Self-Host
If you want to host the bot yourself just follow the instruction below.

Requirements:
* [Discord App Token](https://discordapp.com/developers/applications/) - [Guide how to get Discord App Token](https://anidiots.guide/getting-started/getting-started-long-version)
* [Twitter API Token](https://developer.twitter.com/) - [Guide how to get Twitter API Token](https://developer.twitter.com/en/docs/basics/authentication/guides/access-tokens.html)
* [node.js](https://nodejs.org/)

How-to:
* Setting up the *secret file* for token
  Make a file called `secret.json` on the root of the bot directory with this line of code in it.

  ```
  {
    "DISCORD_APP_TOKEN" : "YOUR_DISCORD_APP_TOKEN_HERE",
    "TWITTER_CONSUMER_KEY" : "YOUR_TWITTER_CONSUMER_KEY_HERE",
    "TWITTER_CONSUMER_SECRET" : "YOUR_TWITTER_CONSUMER_SECRET_HERE",
    "TWITTER_ACCESS_TOKEN_KEY" : "YOUR_TWITTER_ACCESS_TOKEN_KEY_HERE",
    "TWITTER_ACCESS_TOKEN_SECRET" : "YOUR_TWITTER_ACCESS_TOKEN_SECRET_HERE"
  }
  ```
* Open Node.js command prompt and navigate to your bot directory.
* Do `npm update` to get bot depencies.
* Do `node soyun.js` to run the bot.

## Configuration
To configure the bot to your liking open the `config.json` file, below is the explanation what the variable do

* `MAINTENANCE_MODE` (value: boolean) set the bot to maintenance mode, all user called commnands will be disabled unless the command is called in admin guild.
* `ARCHIVING` (value: boolean) the bot doing hourly archive of the market data, set this to `false` if you see this is as unecesarry.
* `DEFAULT_BOT_ADMIN` (value: snowflake) default admin id for the bot (only accepting one id for now).
* `DEFAULT_GUILD_ID` (value: snowflake) default main guild id for the bot (admin guild for maintenance mode).
* `DEFAULT_PREFIX` (value: character) default bot command prefix.
* `DEFAULT_TEXT_CHANNEL` (value: channel-name, text) default text channel for the bot when get invited to a guild (used for !setup).
* `DEFAULT_MEMBER_GATE` (value: channel-name, text) default text channel for when member joining the guild (used for !setup).
* `DEFAULT_NEWS_CHANNEL` (value: channel-name, text) default text channel for twitter update (used for !setup).
* `DEFAULT_ADMIN_CHANNEL` (value: channel-name, text) default text channel for admin related stuff (used for !setup).
* `DEFAULT_PARTY_CHANNEL` (value: channel-name, text) default text channel for daily, weekly, event announcement (used for !setup).
* `DEFAULT_MEMBER_LOG` (value: channel-name, text) default text channel for guild member activity (role change, name change) (used for !setup).
* `DEFAULT_MARKET_THUMBNAIL` (value: img url) default image for when item not found on marketplace.
* `TWITTER_STREAM_ID` (value: string) twitter id number for twitter account that want to be tracked.
* `TWITTER_STREAM_SCREENNAME` (value: array of text) the screenname for the twitter account that tracked.
* `COMMANDS` (value: boolean) the commands list, set the value to `false` if you want to disable that command.
* `GLOBAL` (value: boolean) list of global annoucement message, set it to `false` if you want to disable it.

## Built With
* [Visual Studio Code](https://code.visualstudio.com/) - Editor
* [discord.js](https://discord.js.org) - Discord API node.js module
* [Silveress](https://bns.silveress.ie/) - BnS unofficial API

## Main Contributor
* **Rizky Sedyanto** - *Initial work* - [ln2r](https://ln2r.web.id; Discord: ln2r#1691)
* **Database Update** - Grumpy Butts clan member

## Acknowledgments
* Thanks to Silveress for BnS API
* Thanks to Grumpy Butts for letting me using their discord guild for field test

## License
*Code of this project is licensed under MIT license*
