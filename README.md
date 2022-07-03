# Jinsoyun
Blade and Soul related Discord bot, originally built for Grumpy Butts clan.

## Noteable Features
* Daily and weekly challenges data.
* Character information.
* Marketplace information.

## Installation / Getting Started
### Invitation Url
You can invite Jinsoyun to your server [here](https://discord.com/api/oauth2/authorize?client_id=427677590359375873&permissions=2147534848&scope=bot%20applications.commands).

### Self-Host
**Requirements**:
* [Discord App Token](https://discordapp.com/developers/applications/) - [Guide how to get Discord App Token](https://anidiots.guide/getting-started/getting-started-long-version)
* [node.js](https://nodejs.org/)
* [Backend API](https://github.com/ln2r/jinsoyun-api)

**How-to**:
* Make `.env` config file which is located in root folder (the one with `package.json`) [Template](https://github.com/ln2r/jinsoyun/blob/.env.example)
  * `DISCORD_TOKEN` = your Discord bot token
  * `DISCORD_CLIENT_ID` = your Discord bot user id (right click on the bot > copy id)
  * `API_URL` = your backend api url

* Open command prompt or any console interface which you like and navigate to the application root directory.
* Do `npm i` or `npm update` to get dependencies.
* Do `node index.js` to start the bot

## Credits
* Challenges data obtained from [Hongmoon Archives](https://www.hongmoon-archives.com/challenge/list-of-challenges)
* Market data obtained from [Silver BNS API](https://gitlab.com/Silver_BnS)
* Character data obtained from Blade and Soul character information page.
* Event data obtained from Blade and Soul news page.

## Contact
* Discord: ln2r#1691

## License
*Code of this project is licensed under MIT license*
