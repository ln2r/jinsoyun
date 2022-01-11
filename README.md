# Jinsoyun
Blade and Soul related Discord bot, originally built for Grumpy Butts clan

## Noteable Features
* Daily and weekly challenges data.
* Character information.
* Marketplace information.

## Installation / Getting Started
### Invitation Url
~~You can invite Jinsoyun to your server by going [here](https://ln2r.github.io/jinsoyun.html).~~ **(TBA)**

### Self-Host
**Requirements**:
* [Discord App Token](https://discordapp.com/developers/applications/) - [Guide how to get Discord App Token](https://anidiots.guide/getting-started/getting-started-long-version)
* [node.js](https://nodejs.org/)
* [redis](https://redis.io/)
* [Backend API](https://github.com/ln2r/jinsoyun-api)

**How-to**:
* Configuration located in `.env` file [Example](https://github.com/ln2r/jinsoyun/blob/.env.example)
  * `DISCORD_TOKEN` = your Discord bot token
  * `DISCORD_CLIENT_ID` = your Discord bot user id (right click on the bot > copy id)
  * `DISCORD_GUILD_ID` = your guild id (same as how you obtain client id, right click on your server and copy id)
  * `REDIS_URL` = your redis instance connection url
  * `API_URL` = your backend api url

* Open Node.js command prompt and navigate to your root directory.
* Do `npm i` or `npm update` to get dependencies.
* Do `node index.js` to start the bot

## Credits
* Challenges data obtained from [Hongmoon Archives](https://www.hongmoon-archives.com/challenge/list-of-challenges)
* Character data obtained from Blade and Soul character information page.
* Market data obtained from [Silver BNS API](https://gitlab.com/Silver_BnS)

## Contact
* Discord: ln2r#1691

## License
*Code of this project is licensed under MIT license*
