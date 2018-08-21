const Discord = require("discord.js");
const Twitter = require("twitter");
const ontime = require("ontime");
const fetch = require('node-fetch');
const fs = require('fs');
const dateFormat = require('dateFormat');
const delay = require('delay');
const https = require('https');

const secret = require("./secret.json");
const config = require("./config.json");

const koldrakTime = require("./data/koldrak-time.json");
const items = require("./data/list-item.json");
const quests = require("./data/list-quest.json");
const rewards = require("./data/list-challenges-rewards.json");
const recipes = require("./data/list-recipe.json");
const classDataSource = require("./data/list-classdata-source.json");
const soyunDialogue = require("./data/list-soyundialogue.json");
const event = require("./data/data-event.json");

const clientDiscord = new Discord.Client();
const clientTwitter = new Twitter({
	consumer_key: secret.TWITTER_CONSUMER_KEY,
	consumer_secret: secret.TWITTER_CONSUMER_SECRET,
	access_token_key: secret.TWITTER_ACCESS_TOKEN_KEY,
	access_token_secret: secret.TWITTER_ACCESS_TOKEN_SECRET
});

// Default class list
var classArr = ["blade master", "destroyer", "summoner", "force master", "kung fu master", "assassin", "blade dancer", "warlock", "soul fighter", "gunslinger"];

// Querry payload status
var payloadStatus = "rejected";
var querryStatus = false;

// Global variable
var koldrakAlertSystem = true;

// Twitter hook variables
var twtUsername;
var twtScreenName
var twtText;
var twtAvatar;
var twtCreatedAt;
var twtTimestamp;
var twtColor;
var twtFilter;

// silveress character data
var silveressCharacterData;

var charaDataName;
var charaDataImg;
var charaDataLvl;
var charaDataLvlHM;
var charaDataHMAllocationDef;
var charaDataHMAllocationAtk;

var charaDataHP;
var charaDataAP;
var charaDataBossAP;
var charaDataElement;
var charaDataClass;
var charaDataWeapon;

var charaDataDef;
var charaDataBossDef;
var charaDataEva;
var charaDataEvaRate;
var charaDataBlock;
var charaDataBlockRate;
				
var charaDataCritHit;
var charaDataCritHitRate;
var charaDataCritDmg;
var charaDataCritDmgRate;

var charaDataGem1;
var charaDataGem2;
var charaDataGem3;
var charaDataGem4;
var charaDataGem5;
var charaDataGem6;

var charaDataSoulShield1;
var charaDataSoulShield2;
var charaDataSoulShield3;
var charaDataSoulShield4;
var charaDataSoulShield5;
var charaDataSoulShield6;
var charaDataSoulShield7;
var charaDataSoulShield8;

var charaDataRing;
var charaDataEarring;
var charaDataNecklace;
var charaDataBraclet;
var charaDataBelt;
var charaDataGloves;
var charaDataSoul;
var cahraDataHeart;
var charaDataPet;
var charaDataSoulBadge;
var charaDataMysticBadge;

var charaDataFaction;
var charaDataServer;
var charaDataGuild;
var charaDataFactionRank;

var charaDataPVPTotalGames;
var charaDataPVPTotalWins;
var charaDataPVPSoloWins;
var charaDataPVPSoloTier;
var charaDataPVPTagWins;
var charaDataPVPTagTier;

// silveress API point
const silveressNA = "https://api.silveress.ie/bns/v3/character/full/na/";
const silveressEU = "https://api.silveress.ie/bns/v3/character/full/eu/";
const silveressItem = "https://api.silveress.ie/bns/v3/items";
const silveressMarket = "https://api.silveress.ie/bns/v3/market/na/current/";
const silveressQuest = "https://api.silveress.ie/bns/v3/dungeons/quests";
const silveressRecipe = "https://api.silveress.ie/bns/v3/recipe/current?active=true";

// Soyun status
var statusRandom = 0;

// celestial basin ticker
var basinTime = 0;
var basinStatus = "Announce: 43mins";
var basinStatusMsgID;

// function list
// code "stolen" from silveress marketPage.js
// find the item id by searching item-list.json
function getItemID(name){
	var id = "";
	var match =  0;
	var prevMatch = 0;
	var itemQuerryLength = 1;

	// searching the item using word match
	for(i = 31; i < items.length; i++){
		var itemSearchName = items[i].name;
			itemSearchName = itemSearchName.replace("'", "").toLowerCase().split(" ");
		var itemSearchQuerry = name;
			itemSearchQuerry = itemSearchQuerry.replace("'", "").toLowerCase().split(" ");

		if(itemSearchName.length > itemSearchQuerry.length){
			itemQuerryLength = itemSearchName.length;
		}else{
			itemQuerryLength = itemSearchQuerry.length;
		}

		for(j = 0; j < itemSearchName.length; j++){
			for(k = 0; k < itemQuerryLength; k++){
				if(itemSearchName[j] == itemSearchQuerry[k]){
					match = match + 1;
				}
			}
		}

		// getting the highest matching number and store the item id to the variable
		if(match > prevMatch){
			prevMatch = match;
			var id = items[i].id;
		}
		match = 0;
	}
	return id
}

// find the item img url by searching item-list.json
function getItemImg(id){
	var imgUrl;
	for(i = 0; i < items.length; i++){
		if(items[i].id == id){
			var imgUrl = items[i].img
		}
	}
	return imgUrl
}

// converting number (702501) only format to more readable format (70g 25s 01c)
function currencyConvert(number){
	var str = Math.round(number);
	var str = str.toString()
	var len = str.length
	var gold = ""
	var silver = ""
	var copper = ""

	if(len > 4){
		var gold = str.substring( 0 , len -4)+ "<:gold:463569669496897547> ";
	}
	if(len > 2){
		var silver = str.substring( len -2 ,len - 4 )+ "<:silver:463569669442371586> ";
	}
	if(len > 0){
		var copper = str.substring( len ,len -2 )+ "<:copper:463569668095868928> ";
	} 

	var total = gold + silver + copper; 
	return total;
}

// getting quest day and returning array of matched quest index
function getQuests(day){
	var day = day.toString().replace(/(^|\s)\S/g, l => l.toUpperCase());
	var questsID = [0,0,0,0,0,0,0,0,0];
	var k = 0;

	for (i = 0; i < quests.length; i++){
		for(j = 0; j < 7; j++){
			if(quests[i].daily_challenge[j] == day){
				var questMatchedLocation = i;
				k = k+1;
				questsID[k] = questMatchedLocation;
			}
		}
	}
	return questsID;
}

// time difference return array of time [hour, minutes]
function getTimeDifference(timeQuery){
	var timeNow = new Date();

	// Getting the hour of UTC+1
	var timeNowHour = timeNow.getUTCHours() + 1;
	var timeMinutesNow = timeNow.getUTCMinutes();

	// Making new date data with details from above variable
	var timeNow = new Date(0, 0, 0, timeNowHour, timeMinutesNow, 0);		

	var timeDifferenceValue = [];
	var timeDifference = timeQuery - timeNow;

	// Formatting
	var timeDifferenceHours = Math.floor(timeDifference / 1000 / 60 / 60);

	timeDifference -= timeDifferenceHours * 1000 * 60 * 60;

	var timeDifferenceMinutes = Math.floor(timeDifference / 1000 / 60);

	// Making it 24 hours format
	if(timeDifferenceHours < 0){
		timeDifferenceHours = timeDifferenceHours + 24;
	}

	// UTC + 1 formatting
	timeDifferenceHours = timeDifferenceHours - 1;

	timeDifferenceValue[0] = timeDifferenceHours;
	timeDifferenceValue[1] = timeDifferenceMinutes;

	return timeDifferenceValue;
}

// time status receive array of time [hour, minutes] return status
function getTimeStatus(time){
	var timeQuery = new Date(0, 0, 0, time[0], 0, 0);
	var timeCheck = getTimeDifference(timeQuery.getTime());
	var timeHours = timeCheck[0];
	var timeMinutes = timeCheck[1];
	var timeStatus;

	//formating
	if(timeHours < 10){
		var timeHours = "0"+timeHours;
	}
	if(timeMinutes < 10){
		var timeMinutes = "0"+timeMinutes;
	}

	var timeStatus = timeHours+" hour(s) and "+timeMinutes+" minute(s) left"

	return timeStatus;
}

// Empty data fetched handling, return data or "Nothing"
function fetchData(data){
	var data = data;
		data = data.toString();

	if(data == "" || data == null){
		var data = "N/A"
	}else{
		var data = data;
	}

	return data;
}

// Getting PVP win rate, return percentage rate
function getWinRate(game, win){
	var game = game;
		game = parseInt(game);

	var win = win;
		win = parseInt(win);
	
	if(game == 0 && win == 0){
		var winRate = 0;
	}else{
		var winRate = ((win/game)*100).toFixed(2);
	}

	return winRate;	
}

// Data fetching
async function getData(query) {
	const response = await fetch(query);

	return response.json()
}

// Get quest type, return "Dynamic" or "Event"
function getQuestType(type){
	var type = type;
	var typeValue;

	switch(type){
		case 1:
			typeValue = "Dynamic";
		break;
		case 2:
			typeValue = "Event";
		break;
		default:
			typeValue = "";
		break;
	}

	if(typeValue != ""){
		typeValue = "`"+typeValue+"`";
	}

	return typeValue;
}

// formating array data so it have space after coma (,)
function setDataFormatting(data){
	var data = data
	for(var i = 1; i < data.length; i++){
		data[i] = " "+data[i];
	}
	return data;
};

// Getting day value, get day (0-6), return monday (dddd)
function getDay(day){
	var day = day
	switch(day){
		case 0:
			day = "Sunday";
		break;
		case 1:
			day = "Monday";		
		break;
		case 2:
			day = "Tuesday";
		break;
		case 3:
			day = "Wednesday";
		break;
		case 4:
			day = "Thursday";
		break;
		case 5:
			day = "Friday";
		break;
		case 6:
			day = "Saturday";
		break;
	}

	return day;
}

// getting weekly data
function getWeeklyQuests(){
	var weekly = [];
	var j = 0;
	for(var i = 0; i < quests.length; i++){
		if(quests[i].weekly_challenge == true){
			weekly[j] = i;
			j++;
		}
	}
	return weekly;
}

// Getting character skillset
function getCharacterSkillset(charaClass, charaElement){
	var charaClass = charaClass.toLowerCase();
	var charaElement = charaElement.toLowerCase();
	
	for(var i = 0; i < classDataSource.length; i++){
		if(classDataSource[i].name == charaClass){
			var classIndex = i;
		}
	}

	if(charaElement == "element"){
		var charaSkillset = classDataSource[classIndex].skillsets[0];
	}else{
		var charaSkillset = classDataSource[classIndex].skillsets[1];
	}
}

// Discord stuff start here
clientDiscord.on("ready", () => {
	console.log(" [ "+dateFormat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > bot is alive and ready");
	
	clientDiscord.user.setUsername("Jinsoyun");
	clientDiscord.user.setPresence({ game: { name: 'with Hongmoon School' }, status: 'online' })
		.catch(console.error);
});

// User joined the guild
clientDiscord.on("guildMemberAdd", (member) => {
	// Add 'cricket' role so new member so they cant access anything until they do !join for organizing reason
	member.addRole(member.guild.roles.find("name", "cricket"));
	
	// Welcoming message and guide to join
	member.guild.channels.find("name", config.DEFAULT_MEMBER_GATE).send('Hi <@'+member.user.id+'>, welcome to ***'+member.guild.name+'***!\n\nTheres one thing you need to do before you can talk with others, can you tell me your in-game nickname and your class? to do that please write ***!reg "username here" "your class here"***, here is an example how to do so: ***!reg "Jinsoyun" "Blade Master"***, thank you! ^^ \n\nIf you need some assistance you can **@mention** or **DM** available officers');

	// Console logging
	console.log(" [ "+dateFormat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+member.user.username+" has joined");
	console.log(" [ "+dateFormat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+member.user.username+" role is changed to 'cricket' until "+member.user.username+" do !reg");
});

// User commands
clientDiscord.on("message", async (message) => {
  if (message.toString().substring(0, 1) == '!') {
		//var args = message.toString().substring(1).split(' ');
		var	args = message.toString().replace(/[‘’“”'']/g, '"');
			args = args.substring(1).split(' ');
		var cmd = args[0];
			cmd = cmd.toLowerCase();

        args = args.splice(1);
        switch(cmd) {
			// Connection test
			case 'soyun':
				var soyunQuerry = message.toString().substring(1).split(' ');
				var soyunHelpTxt = '**Account**\n- Nickname: `!username "desired nickname"`\n- Class: `!class "desired class"`\n\n**Blade & Soul**\n- Character Search: `!who` or `!who "character name"`\n- Daily challenges `!daily` or `!daily tomorrow`\n- Weekly challenges `!weekly`\n- *Koldrak\'s Lair*  time: `!koldrak`\n- Marketplace `!market "item name"`\n- Current Event `!event`\n\n**Miscellaneous**\n- Pick: `!pick "item a" or "item b"`\n- Roll dice: `!roll` or `!roll (start number)-(end number)` example: `!roll 4-7`\n- Commands list: `!soyun help`';

				soyunQuerry = soyunQuerry.splice(1);

				switch(soyunQuerry[0]){
					case 'help':
						if(message.channel.name == config.DEFAULT_ADMIN_CHANNEL){
							soyunHelpTxt = soyunHelpTxt + '\n\n**Admin**\n- Announcement: `!say "title" "content"`';
						};

						message.channel.send("Here is some stuff you can ask me to do:\n\n"+soyunHelpTxt+"\n\nIf you need some assistance you can **@mention** or **DM** available **officers**.\n\n```Note: Items and quests list updated @ Wednesday 12AM UTC \n\t  Market listing updated every 1 hour```");
						// Console logging
						console.log(" [ "+dateFormat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+message+" triggered");
					break;

					case 'activity':						
						switch(statusRandom){
							case 0:
								clientDiscord.user.setActivity('!soyun help', {type: 'LISTENING' });
								statusRandom = 1;
							break;
							
							case 1:
								clientDiscord.user.setActivity('with Hongmoon School', {type: 'PLAYING'});
								statusRandom = 0;
							break;
						}
					break;

					case 'status':
						const m = await message.channel.send("Checking...");      
						  
						var apiStatus = [];
						var apiStatusList = [];
						var apiAdress = config.API_ADDRESS;

						function getDiscordStatus(){
							return fetch('https://srhpyqt94yxb.statuspage.io/api/v2/status.json')
										.then(res => {return res.json()});

						};	
						
						async function getAPIStatus(){
							var apiStatus = [];
							var apiAdress = config.API_ADDRESS;

							await https.get(apiAdress[0].address, function (res) {
								apiStatus[0] = "alive";
							}).on('error', function(e) {
								apiStatus[0] = "dead";
							});
							await delay(1000);
							await https.get(apiAdress[1].address, function (res) {
								apiStatus[1] = "alive";
							}).on('error', function(e) {
								apiStatus[1] = "dead";
							});
							await delay(1000);

							return apiStatus;
						}
						var discordStatus = await getDiscordStatus();
						var apiStatus = await getAPIStatus();

						apiStatusList = "**"+apiAdress[0].name+"** is "+apiStatus[0]+"\n **"+apiAdress[1].name+"** is "+apiStatus[1]+"\n";

						//`Ping received, Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(clientDiscord.ping)}ms`
						var msgLatency = (m.createdTimestamp - message.createdTimestamp) + "ms";
						var apiLatency = Math.round(clientDiscord.ping) + "ms";
						await delay(1000);
						m.edit("Current Status",{
							"embed": {
								"author":{
									"name": "Jinsoyun and API Status",
									"icon_url": "https://cdn.discordapp.com/emojis/481356415332646912.png?v=1"
								},
								"title": "Jinsoyun Status",
								"description": "**Server Latency**: "+msgLatency+"\n**API Latency**: "+apiLatency,
								"color": 16753920,
								"footer": {
									"text": "Created and maintained by ln2r - Generated at "+dateFormat(Date.now(), "UTC:dd-mm-yy @ hh:MM")+" UTC"
								},
								"fields":[
									{
										"name": "Discord",
										"value": "**Status**: "+discordStatus.status.description
									},
									{
										"name": "API",
										"value": apiStatusList
									}
								]
							}
						});

						// Console logging
						console.log(" [ "+dateFormat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+message+" received");
					break;

					default:
						var soyunSay = soyunDialogue
						message.channel.send("Hi master! I\'m hungry, please give me dumplings!");

						// Console logging
						console.log(" [ "+dateFormat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+message+" received");
					break;	
				};
            break;
			
			// Server join = username change and role add
			case 'reg':
				var joinQuerry = message.toString().substring(1).split('"');
				var joinUsername = (joinQuerry[1]);
				
				try{
					var joinClass = (joinQuerry[3]);
							
					joinClass = joinClass.toLowerCase(); // Converting class value to lower case so input wont be missmatched
					
					// Checking the class input
					for(i = 0; i < classArr.length;){
						// Class input verification (inefficient af)
						if(joinClass == classArr[i]){
							querryStatus = true;
							break;
						};
						i++
					};

					// Checking the verification
					if(querryStatus == true){
						// Convert to capitalize to make it easy and 'prettier'
						joinUsername = joinUsername.replace(/(^|\s)\S/g, l => l.toUpperCase());
						
						// Setting user role to match the user class
						message.guild.members.get(message.author.id).addRole(message.guild.roles.find("name", joinClass));
						// Adding "member" role so user can talk
						message.guild.members.get(message.author.id).addRole(message.guild.roles.find("name", "member"));
						// Removing "cricket" role
						message.guild.members.get(message.author.id).removeRole(message.guild.roles.find("name", "cricket"));
						
						// Setting message author username (guild owner or lower)
						message.guild.members.get(message.author.id).setNickname(joinUsername);

						// Welcoming message on general channel
						message.guild.channels.find("name", config.DEFAULT_TEXT_CHANNEL).send("Please welcome our new "+joinClass+" ***"+joinUsername+"***!");
						payloadStatus = "received";
						querryStatus = false;

						message.guild.channels.find("name", config.DEFAULT_MEMBER_LOG).send(message.author.username+" joined `"+dateFormat(Date.now(), "UTC:dd-mm-yy @ hh:MM)+UTC`"),{

						});
					}else{
						// Telling them whats wrong
						message.channel.send("Im sorry, I cant find the class you wrote. If this seems to be a mistake please **@mention** or **DM** available officers for some assistance");
						querryStatus = false;
					}
				}catch(err){
					message.channel.send('Im sorry, I cant read that, can you try again?\n\nExample: **!reg "Jinsoyun" "Blade Master"**');
					payloadStatus = "rejected";
				};

				// Console logging
				console.log(" [ "+dateFormat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+cmd+" command received");
				payloadStatus = "rejected";
			break;
			
			// Username change
			case 'username':
				var usernameQuerry = message.toString().substring(1).split('"');
				var usernameValue = (usernameQuerry[1]);
				
				// capitalizing
				usernameValue = usernameValue.replace(/(^|\s)\S/g, l => l.toUpperCase());

				// Changing message author username
				message.guild.members.get(message.author.id).setNickname(usernameValue);
				message.channel.send("Your username changed to "+usernameValue);

				// Console logging
				console.log(" [ "+dateFormat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+message+" triggered");
			break;
			
			// Class change
			case 'class':
				var classQuerry = message.toString().substring(1).split('"');
				var classValue = (classQuerry[1]);
				var classUserRolesArr = message.author.role; // Array of author roles
				var querryStatus;
				var i; // for loop, ignore

				classValue = classValue.toLowerCase(); // Converting class value to lower case so input wont be missmatched

				// Removing user current class
				// I know this is stupid way to do it, but it have to do for now
				for(i = 0; i < classArr.length;){
					// Class input verification (inefficient af)
					if(classValue == classArr[i]){
						querryStatus = true;
					};
					message.guild.members.get(message.author.id).removeRole(message.guild.roles.find("name", classArr[i]));					
					i++
				};

				// Checking the verification
				if(querryStatus == true){
					// Adding new role to user according their command
					message.guild.members.get(message.author.id).addRole(message.guild.roles.find("name", classValue));

					// Telling the user class has been changed
					message.channel.send("Your class changed to **"+classValue+"**");
					payloadStatus = "received";
					querryStatus = false;
				}else{
					// Telling them whats wrong
					message.channel.send("Im sorry, i cant seems to find the class you wrote. If this seems to be a mistake please **@mention** or **DM** available officers for some assistance");
					querryStatus = false;
				}
				// Console logging
				console.log(" [ "+dateFormat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+cmd+" command received");
				payloadStatus = "rejected";
			break;

			case 'twcon':
				// Twitter's tweet output
				clientDiscord.guilds.map((guild) => {
					let found = 0;
					guild.channels.map((ch) =>{
						if(found == 0){
							if(ch.name == config.DEFAULT_NEWS_CHANNEL){
								ch.send({
									"embed":{
										"color": twtColor,
										"timestamp" : new Date(),
										"description": twtText,
										"author":{
											"name": twtUsername,
											"url": "https://twitter.com/"+twtScreenName,
										},
										"footer":{
											"text": twtUsername,
											"icon_url": twtAvatar
										}
									}
								});
								found = 1;
							}
						}
					});
				});
				// Console logging
				console.log(" [ "+dateFormat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+cmd+" command received");
			break;
			
			// Writing message via bot for announcement or notice, Admin only
			case 'say':
				if(message.channel.name == config.DEFAULT_ADMIN_CHANNEL){
					var sayQuerry = message.toString().substring(1).split('"');

					var sayTitle = (sayQuerry[1]);
						sayTitle = sayTitle.replace(/(^|\s)\S/g, l => l.toUpperCase());

						// Default title
						if(sayTitle == ""){
							sayTitle = "Announcement";
						}

					// Writing the content
					message.guild.channels.find("name", config.DEFAULT_NEWS_CHANNEL).send({
						"embed":{
							"color": 16753920,
							"timestamp" : new Date(),
							"description": sayQuerry[3],
							"author":{
								"name": sayTitle,
							},
							"footer":{
								"text": message.author.username,
								"icon_url": message.author.avatarURL
							}
						}
					});
					payloadStatus = "recieved";
				}else{
					payloadStatus = 'rejected';
				};
				// Console logging
				console.log(" [ "+dateFormat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+cmd+" command received");
				payloadStatus = "rejected";
			break;

			// First time setup (making roles and necesarry channels), Admin only
			case 'setup':
				if(message.channel.name == config.DEFAULT_ADMIN_CHANNEL){
					// Making the roles with class array as reference
					for(i = 0; i < classArr.length;){
						message.guild.createRole({
							name: classArr[i]
						}).catch(console.error);
						i++;
						// Console logging
						console.log(" [ "+dateFormat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+classArr[i]+" role created");
					};

					// Making "news" channel
					message.guild.createChannel(config.DEFAULT_NEWS_CHANNEL, "text");
					// Console logging
					console.log(" [ "+dateFormat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+config.DEFAULT_NEWS_CHANNEL+" channel created");
					
					payloadStatus = "recieved";
				};	
				// Console logging
				console.log(" [ "+dateFormat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+message.author.username+" do "+message+", status: "+payloadStatus);
				payloadStatus = "rejected";
			break;
			
			// pick between two things
			case 'pick':
				var pickQuerry = message.toString().substring(1).split('"');	
				var pickFirstOption = pickQuerry[1];
				var pickSecondOption = pickQuerry[3];

				var pickResult = Math.floor(Math.random() * 2);
				var pickResultValue;

				if(pickResult == 0){
					pickResultValue = pickFirstOption;
				}else{
					pickResultValue = pickSecondOption;
				};

				message.channel.send("Hmmm, I'll go with **"+pickResultValue+"**");
				
				console.log(" [ "+dateFormat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+cmd+" command received");
			break;

			// die roll
			case 'roll':
				var rollQuerry = message.toString().substring(1).split(' ');	
				var rollStartNumber
				var rollEndNumber;

				if(rollQuerry[1] == null){
					rollStartNumber = 1;
					rollEndNumber = 7;
				}else{
					rollStartNumber = rollQuerry[1].charAt(0);
					rollEndNumber = rollQuerry[1].charAt(2);
				};

				var rollResult = Math.floor(Math.random() * rollEndNumber) - rollStartNumber;

				message.channel.send("You rolled **"+rollResult+"**");

				console.log(" [ "+dateFormat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+cmd+" command received");
			break;

			// Today daily challenge
			case 'daily':
				var dcDate = new Date();
				// Getting the current date
				var dcDay = dcDate.getUTCDay();

				var dailyQuerry = message.toString().substring(1).split(' ');
					dailyQuerry = dailyQuerry.splice(1);
				var dailyPartyAnnouncement = false;
				var dailyQuests = [];
				var dailyRewards = [];
				
				switch(dailyQuerry[0]){
					case 'tomorrow':
						// For checking tomorrow daily
						dcDay = dcDay + 1;
					break;

					case 'announce':
						// Daily reset announcement
						dailyPartyAnnouncement = true;
					break;

					default:
						dcDay = dcDay;
				};
				
				switch(dcDay){
					case 0:
						var questsDailyList = getQuests("sunday");
						var questsDailyListRewards = rewards.sunday.rewards;
					break;
					case 1:
						var questsDailyList = getQuests("monday");
						var questsDailyListRewards = rewards.monday.rewards;
					break;
					case 2:
						var questsDailyList = getQuests("tuesday");
						var questsDailyListRewards = rewards.tuesday.rewards;
					break;
					case 3:
						var questsDailyList = getQuests("wednesday");
						var questsDailyListRewards = rewards.wednesday.rewards;
					break;
					case 4:
						var questsDailyList = getQuests("thursday");
						var questsDailyListRewards = rewards.thursday.rewards;
					break;
					case 5:
						var questsDailyList = getQuests("friday");
						var questsDailyListRewards = rewards.friday.rewards;
					break;
					case 6:
						var questsDailyList = getQuests("saturday");
						var questsDailyListRewards = rewards.saturday.rewards;
					break;
				}

				for(var i = 0; i < questsDailyList.length; i++){
					dailyQuests = dailyQuests + ("**"+quests[questsDailyList[i]].location+"** - "+quests[questsDailyList[i]].quest+" `"+quests[questsDailyList[i]].pve_or_pvp+"`\n");
				}
				for(var i = 0; i < questsDailyListRewards.length; i++){
					dailyRewards = dailyRewards + (questsDailyListRewards[i]+"\n");
				}
				// Sending out the payload
				if(dailyPartyAnnouncement == false){
					// default, normal payload
					message.channel.send({
						"embed": {
							"author":{
								"name": "Daily Challenges",
								"icon_url": "https://cdn.discordapp.com/emojis/464038094258307073.png?v=1"
							},
							"title": "Completion Rewards",
							"description": dailyRewards,
							"color": 15025535,
							"footer": {
								"icon_url": "https://cdn.discordapp.com/icons/434004985227771905/ff307183ff8d5a623ae9d0d0976f2a06.png",
								"text": "Data maintained by Grumpy Butts - Generated at "+dateFormat(Date.now(), "UTC:dd-mm-yy @ hh:MM")+" UTC"
							},
							"fields":[
								{
									"name": "Quests/Dungeons List (Location - Quest `Type`)",
									"value": dailyQuests 								
								}
							]
						}
					});
				}else{
					clientDiscord.guilds.map((guild) => {
						let found = 0;
						guild.channels.map((ch) =>{
							if(found == 0){
								if(ch.name == config.DEFAULT_PARTY_CHANNEL){
									ch.send("Daily challenges has been reset, today's challenges are",{
										"embed": {
											"author":{
												"name": "Daily Challenges",
												"icon_url": "https://cdn.discordapp.com/emojis/464038094258307073.png?v=1"
											},
											"title": "Completion Rewards",
											"description": dailyRewards,
											"color": 15025535,
											"footer": {
												"icon_url": "https://cdn.discordapp.com/icons/434004985227771905/ff307183ff8d5a623ae9d0d0976f2a06.png",
												"text": "Data maintained by Grumpy Butts - Generated at "+dateFormat(Date.now(), "UTC:dd-mm-yy @ hh:MM")+" UTC"
											},
											"fields":[
												{
													"name": "Quests/Dungeons List (Location - Quest `Type`)",
													"value": dailyQuests 								
												}
											]
										}
									}).catch(console.error);
									found = 1;
								}
							}
						});
					});
				};
				// Console logging
				console.log(" [ "+dateFormat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+cmd+" command received");
				payloadStatus = "rejected";
			break;

			// Koldrak's lair notification and closest time
			case 'koldrak':
				var koldrakDateVariable = new Date();
				var koldrakQuerry = message.toString().substring(1).split(' ');
					koldrakQuerry = koldrakQuerry.splice(1);

				// Getting the hour of UTC+1
				var koldrakTimeHourNow = koldrakDateVariable.getUTCHours() + 1;
				var koldrakTimeMinutesNow = koldrakDateVariable.getUTCMinutes();
				
				// Cheating the search so it will still put hour even if the smallest time is 24
				var koldrakTimeLeft = 25;
				
				// Making new date data with details from above variable
				var koldrakTimeNow = new Date(0, 0, 0, koldrakTimeHourNow, koldrakTimeMinutesNow, 0);	

				switch(koldrakQuerry[0]){
					case 'list':
						message.channel.send({
							"embed":{
								"color": 8388736,
								"description": "- `01:00:00 UTC ("+getTimeStatus([1,0])+")`\n- `04:00:00 UTC ("+getTimeStatus([4,0])+")`\n- `07:00:00 UTC ("+getTimeStatus([7,0])+")`\n- `19:00:00 UTC ("+getTimeStatus([19,0])+")`\n- `22:00:00 UTC ("+getTimeStatus([22,0])+")`",
								"author":{
									"name": "Koldrak's Lair Timetable",
									
								},
								"footer":{
									"icon_url": "https://cdn.discordapp.com/emojis/463569669584977932.png?v=1",
									"text": "Generated at "+dateFormat(Date.now(), "UTC:dd-mm-yy @ hh:MM")+" UTC"
								}
							}
						})

						console.log(" [ "+dateFormat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+message+" triggered");
					break;

					// Doing "Alert" at specific time(s)
					case 'alert':
						// Sending "Alert" to every "party-forming" channel
						clientDiscord.guilds.map((guild) => {
							let found = 0;
							guild.channels.map((ch) =>{
								if(found == 0){
									if(ch.name == config.DEFAULT_PARTY_CHANNEL){
										ch.send({
											"embed":{
												"color": 8388736,
												"description": "**Koldrak's Lair** will be accessible in **10 Minutes**",
												"author":{
													"name": "Epic Challenge Alert",
													
												},
												"footer":{
													"icon_url": "https://cdn.discordapp.com/emojis/463569669584977932.png?v=1",
													"text": "Generated at "+dateFormat(Date.now(), "UTC:dd-mm-yy @ hh:MM")+" UTC"
												}
											}
										});
										found = 1;
									}
								}
							});
						});

						console.log(" [ "+dateFormat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > !koldrak alert triggered");
					break;
					
					// Showing when is the closest Koldrak's lair time
					default:
						// Searching when is the closest one
						for(var i = 0; i < 5;){
							// Making new date data with details from koldrak's schedule (koldrak.json)
							var koldrakTimeNext = new Date(0, 0, 0, koldrakTime.time[i], 0, 0);
							// Getting the time difference
							var koldrakTimeDiff = getTimeDifference(koldrakTimeNext.getTime());

							// Formatting
							var koldrakTimeHours = koldrakTimeDiff[0];							
							var koldrakTimeMinutes = koldrakTimeDiff[1];

							// Storing the closest for later
							if(koldrakTimeHours <= koldrakTimeLeft){
								if(koldrakTimeHours >= 0){
									koldrakTimeLeft = koldrakTimeHours;
								}
							}
							i++;
						}

						// Output
						message.channel.send("Closest **Koldrak's Lair** is accessible in **"+koldrakTimeLeft+" hour(s)** and **"+koldrakTimeMinutes+" minute(s)**");

						// Console Logging
						console.log(" [ "+dateFormat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+message+" triggered");
				};
			break;
			
			// for searching and showing character information, can be triggered via !who for character that have the same name with the nickname or use !who "chara name" for specific one
			case 'who':
				var whoQuerry = message.toString().substring(1).split('"');
					whoQuerry = whoQuerry.splice(1);

				if(whoQuerry[0] == null){
					whoQuerry = [message.member.nickname];
				}				

				var silveressQuerry = silveressNA+whoQuerry[0]; // for the querry

				// fetching data from api site
				var bnstreeProfile = "https://bnstree.com/character/na/"+whoQuerry[0]; // for author url so user can look at more detailed version
					bnstreeProfile = bnstreeProfile.replace(" ","%20"); // replacing the space so discord.js embed wont screaming error

				fetch(silveressQuerry)
					.then(res => res.json())
					.then(data => silveressCharacterData = data)
					.then(() => {
						charaDataName = fetchData(silveressCharacterData.characterName);
						charaDataImg = fetchData(silveressCharacterData.characterImg);
						charaDataLvl = fetchData(silveressCharacterData.playerLevel);
						charaDataLvlHM = fetchData(silveressCharacterData.playerLevelHM);
						charaDataHMAllocationAtk = fetchData(silveressCharacterData.HMAttackPoint);
						charaDataHMAllocationDef = fetchData(silveressCharacterData.HMDefencePoint);

						charaDataHP = fetchData(silveressCharacterData.hp);
						charaDataAP = fetchData(silveressCharacterData.ap);
						charaDataBossAP = fetchData(silveressCharacterData.ap_boss);
						charaDataElement = fetchData(silveressCharacterData.activeElement);
						charaDataClass = fetchData(silveressCharacterData.playerClass);
						charaDataWeapon = fetchData(silveressCharacterData.weaponName);

						charaDataCritHit = fetchData(silveressCharacterData.crit);
						charaDataCritHitRate = fetchData(silveressCharacterData.critRate);
						charaDataCritDmg = fetchData(silveressCharacterData.critDamage);
						charaDataCritDmgRate = fetchData(silveressCharacterData.critDamageRate);

						charaDataDef = fetchData(silveressCharacterData.defence);
						charaDataBossDef = fetchData(silveressCharacterData.defence_boss);
						charaDataEva = fetchData(silveressCharacterData.evasion);
						charaDataEvaRate = fetchData(silveressCharacterData.evasionRate);
						charaDataBlock = fetchData(silveressCharacterData.block);
						charaDataBlockRate = fetchData(silveressCharacterData.blockRate);

						charaDataGem1 = fetchData(silveressCharacterData.gem1);
						charaDataGem2 = fetchData(silveressCharacterData.gem2);
						charaDataGem3 = fetchData(silveressCharacterData.gem3);
						charaDataGem4 = fetchData(silveressCharacterData.gem4);
						charaDataGem5 = fetchData(silveressCharacterData.gem5);
						charaDataGem6 = fetchData(silveressCharacterData.gem6);

						charaDataSoulShield1 = fetchData(silveressCharacterData.soulshield1);
						charaDataSoulShield2 = fetchData(silveressCharacterData.soulshield2);
						charaDataSoulShield3 = fetchData(silveressCharacterData.soulshield3);
						charaDataSoulShield4 = fetchData(silveressCharacterData.soulshield4);
						charaDataSoulShield5 = fetchData(silveressCharacterData.soulshield5);
						charaDataSoulShield6 = fetchData(silveressCharacterData.soulshield6);
						charaDataSoulShield7 = fetchData(silveressCharacterData.soulshield7);
						charaDataSoulShield8 = fetchData(silveressCharacterData.soulshield8);

						charaDataRing = fetchData(silveressCharacterData.ringName);
						charaDataEarring = fetchData(silveressCharacterData.earringName);
						charaDataNecklace = fetchData(silveressCharacterData.necklaceName);
						charaDataBraclet = fetchData(silveressCharacterData.braceletName);
						charaDataBelt = fetchData(silveressCharacterData.beltName);
						charaDataGloves = fetchData(silveressCharacterData.gloves);
						charaDataSoul = fetchData(silveressCharacterData.soulName);
						cahraDataHeart = fetchData(silveressCharacterData.soulName2);
						charaDataPet = fetchData(silveressCharacterData.petAuraName);
						charaDataSoulBadge = fetchData(silveressCharacterData.soulBadgeName);
						charaDataMysticBadge = fetchData(silveressCharacterData.mysticBadgeName);

						charaDataServer = fetchData(silveressCharacterData.server);
						charaDataFaction = fetchData(silveressCharacterData.faction);
						charaDataGuild = fetchData(silveressCharacterData.guild);
						charaDataFactionRank = fetchData(silveressCharacterData.factionRank);

						charaDataPVPTotalGames = fetchData(silveressCharacterData.tournamentTotalGames);
						charaDataPVPTotalWins = fetchData(silveressCharacterData.tournamentTotalWins);

						charaDataPVPSoloWins = fetchData(silveressCharacterData.tournamentSoloWins);
						charaDataPVPSoloTier = fetchData(silveressCharacterData.tournamentSoloTier);

						charaDataPVPTagWins = fetchData(silveressCharacterData.tournamentTagWins);
						charaDataPVPTagTier = fetchData(silveressCharacterData.tournamentTagTier);
					})
					.then(() =>{
						if(charaDataName == "undefined"){
							payloadStatus = 'rejected';

							message.channel.send('Im sorry i cant find the character you are looking for, can you try again?\n\nExample: **!who "Jinsoyun"**');				
						}else{
							payloadStatus = 'recieved';
							message.channel.send({
								"embed": {
									"author": {
									"name": charaDataGuild+"\'s "+charaDataName	
									},
									"title": charaDataName+" is a Level "+charaDataLvl+" HM "+charaDataLvlHM+" "+charaDataElement+" "+charaDataClass+"\n ",
									"url": bnstreeProfile,
									"fields": [
									{
										"name": "Basic Stats",
										"value": "HP: "+charaDataHP+"\nAttack Power: "+charaDataAP+"\nHongmoon Points Allocation (Atk - Def): "+charaDataHMAllocationAtk+" - "+charaDataHMAllocationDef
									},
									{
										"name": "\nOffensive Stats",
										"value": "Boss Attack Power: "+charaDataBossAP+"\nCritical Hit: "+charaDataCritHit+" ("+(charaDataCritHitRate*100).toFixed(2)+"%)\nCritical Damage: "+charaDataCritDmg+" ("+(charaDataCritDmgRate*100).toFixed(2)+"%)",
									},
									{
										"name": "\nDefensive Stats",
										"value": "Defense: "+charaDataDef+"\nBoss Defense: "+charaDataBossDef+"\nEvasion: "+charaDataEva+" ("+(charaDataEvaRate*100).toFixed(2)+"%)\nBlock: "+charaDataBlock+" ("+(charaDataBlockRate*100).toFixed(2)+"%)",
									},
									{
										"name": "Weapon",
										"value": charaDataWeapon+"\n\n ",
									},
									{
										"name": "Gems",
										"value": charaDataGem1+"\n"+charaDataGem2+"\n"+charaDataGem3+"\n"+charaDataGem4+"\n"+charaDataGem5+"\n"+charaDataGem6+"\n",
									},
									{
										"name": "Equipments",
										"value": "Ring: "+charaDataRing+"\nEarring: "+charaDataEarring+"\nNecklace: "+charaDataNecklace+"\nBraclet: "+charaDataBraclet+"\nBelt: "+charaDataBelt+"\nGloves: "+charaDataGloves+"\nSoul: "+charaDataSoul+"\nHeart: "+cahraDataHeart+"\nAura Pet: "+charaDataPet+"\nSoul Badge: "+charaDataSoulBadge+"\nMystic Badge: "+charaDataMysticBadge, 
									},
									{
										"name": "Soulshield",
										"value": charaDataSoulShield1+"\n"+charaDataSoulShield2+"\n"+charaDataSoulShield3+"\n"+charaDataSoulShield4+"\n"+charaDataSoulShield5+"\n"+charaDataSoulShield6+"\n"+charaDataSoulShield7+"\n"+charaDataSoulShield8, 
									},
									{
										"name": "Arena Stats",
										"value": "Games (Play - Win - Lose): "+charaDataPVPTotalGames+" - "+charaDataPVPTotalWins+" - "+(charaDataPVPTotalGames-charaDataPVPTotalWins)+" ("+getWinRate(charaDataPVPTotalGames, charaDataPVPTotalWins)+"% win rate)\nSolo Wins: "+charaDataPVPSoloWins+" ("+charaDataPVPSoloTier+")\nTag Team Wins: "+charaDataPVPTagWins+" ("+charaDataPVPTagTier+")"
									},
									{
										"name": "Miscellaneous",
										"value": "Server: "+charaDataServer+"\nFaction: "+charaDataFaction+" ("+charaDataFactionRank+")",
									}],
									"description": "",
									"color": Math.floor(Math.random() * 16777215) - 0,
									"footer": {
										"icon_url": "https://slate.silveress.ie/images/logo.png",
										"text": "Powered by Silveress's BnS API - Generated at "+dateFormat(Date.now(), "UTC:dd-mm-yy @ hh:MM")+" UTC"
									},
									"thumbnail": {
										"url": charaDataImg
									}
								}
							})
						}		
					})	
					
				console.log(" [ "+dateFormat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+cmd+" command received");
				payloadStatus = "rejected";
			break;
			
			// for searching item in market, can be triggered via !market "item name"
			case 'market':
				var marketQuerry = message.toString().substring(1).split('"');
					marketQuerry = marketQuerry.splice(1);
				
				if(marketQuerry[0] == null){
					message.channel.send('I\'m sorry, you haven\'t specified the item you are looking for, can you try again?\n\nExample: `!market "moonstone"`');
				}else{
					// formating so it can be searched
					marketQuerry[0] = marketQuerry[0].replace(/(^|\s)\S/g, l => l.toUpperCase());

					var marketItemID = getItemID(marketQuerry[0]);
					if(marketItemID == ""){
						// search if tradeable or not by looking at the item-list.json
						message.channel.send({
							"embed": {
								"description":"No result on ***"+marketQuerry[0]+"***\nItem might be untradable or not in marketplace.",
								"color": Math.floor(Math.random() * 16777215) - 0,
								"footer": {
									"icon_url": "https://slate.silveress.ie/images/logo.png",
									"text": "Powered by Silveress's BnS API - Retrieved at "+dateFormat(Date.now(), "UTC:dd-mm-yy @ hh:MM")+" UTC"
								},
								"thumbnail": {
									"url": getItemImg(marketItemID)
								},
								"author": {
									"name": marketQuerry[0]+" [N/A]",														
								}
							}
						});
					}else{
						var silveressMarketData;
						// fetching the market data
						fetch(silveressMarket+marketItemID)
						.then(res => res.json())
						.then(data => silveressMarketData = data)
						.then(() => {
							var itemData = silveressMarketData[0];
							
							if(itemData == null){
								message.channel.send({
									"embed": {
										"description":"No result on ***"+marketQuerry[0]+"***\nItem might be untradable or not in marketplace.",
										"color": Math.floor(Math.random() * 16777215) - 0,
										"footer": {
											"icon_url": "https://slate.silveress.ie/images/logo.png",
											"text": "Powered by Silveress's BnS API - Retrieved at "+dateFormat(Date.now(), "UTC:dd-mm-yy @ hh:MM")+" UTC"
										},
										"thumbnail": {
											"url": getItemImg(marketItemID)
										},
										"author": {
											"name": marketQuerry[0]+" ["+marketItemID+"]",														
										}
									}
								});
							}else{
								var itemDataName = itemData.name;
								var firstData = itemData.listings[0];
								var itemDataPrice = firstData.price;
								var itemDataCount = firstData.count;
								var itemDataEach = firstData.each;

								var otherListingData = ["","","","",""];
								var otherListingPrice = ["","","","",""];
								var otherListingCount = ["","","","",""];
								var otherListingEach = ["","","","",""];

								if(itemData.totalListings > 1){							
									for(i = 1; i < 6; i++){
										otherListingData[i-1] = itemData.listings[i];
										otherListingPrice[i-1] = otherListingData[i-1].price;
										otherListingCount[i-1] = otherListingData[i-1].count;
										otherListingEach[i-1] = otherListingData[i-1].each;
									}
								}else{
									for(i = 1; i < 6; i++){
										otherListingData[i-1] = "";
										otherListingPrice[i-1] = 0;
										otherListingCount[i-1] = 0;
										otherListingEach[i-1] = 0;
									}
								}

								message.channel.send({
									"embed": {
										"fields":[
											{
												"name": "Lowest Listing",
												"value": "**Price**: "+currencyConvert(itemDataPrice)+"\n**Count**: "+itemDataCount+"\n**Price Each**: "+currencyConvert(itemDataEach)
											},
											{
												"name": "Other Listing",
												"value": "- "+currencyConvert(otherListingPrice[0])+" for "+otherListingCount[0]+"\n- "+currencyConvert(otherListingPrice[1])+" for "+otherListingCount[1]+"\n- "+currencyConvert(otherListingPrice[2])+" for "+otherListingCount[2]+"\n- "+currencyConvert(otherListingPrice[3])+" for "+otherListingCount[3]+"\n- "+currencyConvert(otherListingPrice[4])+" for "+otherListingCount[4]+"\n"
											}
										],
										"color": Math.floor(Math.random() * 16777215) - 0,
										"footer": {
											"icon_url": "https://slate.silveress.ie/images/logo.png",
											"text": "Powered by Silveress's BnS API - Retrieved at "+dateFormat(itemData.ISO, "UTC:dd-mm-yy @ hh:MM")+" UTC"
										},
										"thumbnail": {
											"url": getItemImg(marketItemID)
										},
										"author": {
											"name": itemDataName+" ["+marketItemID+"]",														
										}
									}
								});
							}
							payloadStatus = "recieved";							
						})
						.catch(err => {
							console.log(err);
							if(err){
								payloadStatus = 'rejected';
							}
						});
					}
				}		 
				console.log(" [ "+dateFormat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+cmd+" command received");
				payloadStatus = "rejected";
			break;

			// for getting the current event information
			case 'event':
				var eventToDo = event.rewards.sources;
				var eventQuery = message.toString().substring(1).split(' ');
					eventQuery = eventQuery.splice(1);
				var eventQuests = "";
				var today = new Date();
					today = today.getUTCDay();
				var todayEvent = [];
				var k = 0;

				// getting index of event that have the same day with today
				for(var i = 0; i < event.quests.length; i++){
					for(var j = 0; j < 7; j++){
						if(event.quests[i].day[j] == getDay(today)){
							var idx = i;							
							todayEvent[k] = idx;
							k++;
						}
					}
				}

				// for searching event that have the same index with day searching and then inserting the correct one into variable for output later
				for(var i = 0; i < event.quests.length; i++){
					if(event.quests[i].id == todayEvent[i]){
						eventQuests = eventQuests + ("**"+event.quests[i].location+"** - "+event.quests[i].quest+" "+getQuestType(event.quests[i].type)+"\n")
					}
				}
				
				// for either picking announcing the event details as daily notification or just normal query
				switch(eventQuery[0]){
					case 'announce':
						clientDiscord.guilds.map((guild) => {
							let found = 0;
							guild.channels.map((ch) =>{
								if(found == 0){
									if(ch.name == config.DEFAULT_PARTY_CHANNEL){
										ch.send(event.name+" event is on-going, here\'s the details",{
											"embed": {
												"author":{
													"name": "Current Event",
													"icon_url": "https://cdn.discordapp.com/emojis/479872059376271360.png?v=1"
												},
												"title": event.name,
												"url": event.url,
												"description": "**Duration**: "+event.duration+"\n**Event Item**: "+setDataFormatting(event.rewards.name)+"\n**Event Currency**: "+setDataFormatting(event.rewards.currency)+"\n**What to do**: "+setDataFormatting(eventToDo),
												"color": 1879160,
												"footer": {
													"icon_url": "https://static.bladeandsoul.com/img/global/nav-bs-logo.png",
													"text": "Blade & Soul Event - Generated at "+dateFormat(Date.now(), "UTC:dd-mm-yy @ hh:MM")+" UTC"
												},
												"fields":[
													{
														"name": "Quests/Dungeons List (Location - Quest `Type`)",
														"value": eventQuests 								
													}
												]
											}
										}).catch(console.error);
										found = 1;
									}
								}
							});
						});
					break;
					default:
						message.channel.send({
							"embed": {
								"author":{
									"name": "Current Event",
									"icon_url": "https://cdn.discordapp.com/emojis/479872059376271360.png?v=1"
								},
								"title": event.name,
								"url": event.url,
								"description": "**Duration**: "+event.duration+"\n**Event Item**: "+setDataFormatting(event.rewards.name)+"\n**Event Currency**: "+setDataFormatting(event.rewards.currency)+"\n**What to do**: "+setDataFormatting(eventToDo),
								"color": 1879160,
								"footer": {
									"icon_url": "https://static.bladeandsoul.com/img/global/nav-bs-logo.png",
									"text": "Blade & Soul Event - Generated at "+dateFormat(Date.now(), "UTC:dd-mm-yy @ hh:MM")+" UTC"
								},
								"fields":[
									{
										"name": "Quests/Dungeons List (Location - Quest `Type`)",
										"value": eventQuests 								
									}
								]
							}	
						})
					break;
				};
				console.log(" [ "+dateFormat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+cmd+" command received");
				payloadStatus = "rejected";				
			break;

			case 'weekly':
				var weeklyQuery = message.toString().substring(1).split(' ');
					weeklyQuery = weeklyQuery.splice(1);
				var weeklyIdxList = getWeeklyQuests();
				var weeklyQuests = [];
				var weeklyRewards = [];
				
				for(var i = 0; i < weeklyIdxList.length; i++){
					weeklyQuests = weeklyQuests + ("**"+quests[weeklyIdxList[i]].location+"** - "+quests[weeklyIdxList[i]].quest+" `"+quests[weeklyIdxList[i]].pve_or_pvp+"`\n");				
				}
				for(var i = 0; i < rewards.weekly.rewards.length; i++){
					weeklyRewards = weeklyRewards + (rewards.weekly.rewards[i]+"\n");
				}
				
				switch(weeklyQuery[0]){
					case 'announce':
					//Weekly challenges has been reset, this week challenges are
						clientDiscord.guilds.map((guild) => {
							let found = 0;
							guild.channels.map((ch) =>{
								if(found == 0){
									if(ch.name == config.DEFAULT_PARTY_CHANNEL){
										ch.send("Weekly challenges has been reset, this week challenges are",{
											"embed": {
												"author":{
													"name": "Weekly Challenges",
													"icon_url": "https://cdn.discordapp.com/emojis/464038094258307073.png?v=1"
												},
												"title": "Completion Rewards",
												"description": weeklyRewards,
												"color": 6193367,
												"footer": {
													"icon_url": "https://cdn.discordapp.com/icons/434004985227771905/ff307183ff8d5a623ae9d0d0976f2a06.png",
													"text": "Data maintained by Grumpy Butts - Generated at "+dateFormat(Date.now(), "UTC:dd-mm-yy @ hh:MM")+" UTC"
												},
												"fields":[
													{
														"name": "Quests/Dungeons List (Location - Quest `Type`)",
														"value": weeklyQuests 								
													}
												]
											}
										}).catch(console.error);
										found = 1;
									}
								}
							});
						});
					break;
					default:
						message.channel.send({
							"embed": {
								"author":{
									"name": "Weekly Challenges",
									"icon_url": "https://cdn.discordapp.com/emojis/464038094258307073.png?v=1"
								},
								"title": "Completion Rewards",
								"description": weeklyRewards,
								"color": 6193367,
								"footer": {
									"icon_url": "https://cdn.discordapp.com/icons/434004985227771905/ff307183ff8d5a623ae9d0d0976f2a06.png",
									"text": "Data maintained by Grumpy Butts - Generated at "+dateFormat(Date.now(), "UTC:dd-mm-yy @ hh:MM")+" UTC"
								},
								"fields":[
									{
										"name": "Quests/Dungeons List (Location - Quest `Type`)",
										"value": weeklyQuests 								
									}
								]
							}
						});
					break;
				}
				console.log(" [ "+dateFormat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+cmd+" command received");
				payloadStatus = "rejected";	
			break;
			
			case 'getupdate':
				var silveressItemData;
				var silveressQuestData;
				var silveressRecipeData

				fetch(silveressItem)
					.then(res => res.json())
					.then(data => silveressItemData = data)
					.then(() => {
						silveressItemData = JSON.stringify(silveressItemData, null, '\t');
						payloadStatus = "recieved";

						fs.writeFile('./data/list-item.json', silveressItemData, function (err) {
							if(err){
								console.log(err);
								payloadStatus = "rejected";
							}
						});
						console.log(" [ "+dateFormat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Item data fetched, status: "+payloadStatus);
					});
				
				/* 
				> api data inaccurate, disable for now
				fetch(silveressQuest)
					.then(res => res.json())
					.then(data => silveressQuestData = data)
					.then(() =>{
						silveressQuestData = JSON.stringify(silveressQuestData, null, '\t');
						payloadStatus = "recieved";

						fs.writeFile('./data/list-quest.json', silveressQuestData, function (err) {
							if(err){
								console.log(err);
								payloadStatus = "rejected";
							}
						});
						console.log(" [ "+dateFormat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Quest data fetched, status: "+payloadStatus);
					});
				
				> recipe data out of date
				fetch(silveressRecipe)
					.then(res => res.json())
					.then(data => silveressRecipeData = data)
					.then(() =>{
						silveressRecipeData = JSON.stringify(silveressRecipeData, null, '\t');
						payloadStatus = "recieved";

						fs.writeFile('./data/list-recipe.json', silveressRecipeData, function (err) {
							if(err){
								console.log(err);
								payloadStatus = "rejected";
							}
						});
						console.log(" [ "+dateFormat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Recipe data fetched, status: "+payloadStatus);
					});
				*/	
			break;

			case 'getclassdata':
				var classData = classDataSource;

				for(var i = 0; i < classData.length; i++){
					if(!fs.existsSync('./data/class/'+classData[i].name)){
						fs.mkdirSync('./data/class/'+classData[i].name);

						console.log(" [ "+dateFormat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+classData[i].name+" directory made");
					}

					fs.writeFile('./data/class/'+classData[i].name+'/attributes.json', JSON.stringify(await getData(classData[i].attributes), null, '\t'), function (err) {
						if(err){
							console.log(err);
						}
					})
					
					console.log(" [ "+dateFormat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+classData[i].name+" fetched");					
				}
			break;

			case 'basin':
				var basinQuery = message.toString().substring(1).split(' ');
					basinQuery = basinQuery.splice(1);
				switch(basinQuery[0]){
					case 'start':
						basinStatus = "";
						message.channel.send("Current *Celestial Basin* status: "+basinStatus)
							.then(basinStatusMsgID = message.channel.lastMessageID);
						console.log("id: "+basinStatusMsgID);
						basinTime = 0;
					break;
					case 'sync':
						basinTime = 0;
						console.log(" [ "+dateFormat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Celestial Basin time has been reset");
					break;
					case 'status':
						if(basinStatusMsgID != null || basinStatusMsgID != ""){

						}
					break;
					default:
						message.channel.send("Current *Celestial Basin* status: "+basinStatus);
					break;
				}
			break;

			case 'getdaily':
				var dailydata = "https://api.silveress.ie/bns/v3/dungeons/daily";
				var silveressDailyData;
				fetch(dailydata)
					.then(res => res.json())
					.then(data => silveressDailyData = data)
					.then(() => {
						var dailyData = silveressDailyData;
						var dailyDataCurrent = dailyData[0];
						var dailyDataCurrent = JSON.stringify(dailyDataCurrent, null, '\t')

						message.channel.send("Current Data:```"+dailyDataCurrent+"```");
					});
			break;
         };
     };
});

// Bot token here
clientDiscord.login(secret.DISCORD_APP_TOKEN);

// Twitter hook
// Getting user tweet, parameter used: user id, e.g: "3521186773". You can get user id via http://gettwitterid.com/

clientTwitter.stream('statuses/filter', {follow: secret.TWITTER_STREAM_ID},  function(stream) {
	stream.on('data', function(tweet) {
		// Filtering data so it only getting data from specified user
		if((tweet.user.screen_name == secret.TWITTER_STREAM_SCREENNAME[0] || tweet.user.screen_name == secret.TWITTER_STREAM_SCREENNAME[1]) || (tweet.user.screen_name == secret.TWITTER_STREAM_SCREENNAME[2])){
			// Variable for filtering
			twtFilter = tweet.text.toString().substring(0).split(" ");

			// Filtering the "RT" and "mention" stuff
			if(twtFilter[0] == "RT" || twtFilter[0].charAt(0) == "@"){
				payloadStatus = "rejected";
			}else{		
				// Payload loading
				if(tweet.extended_tweet == null){
					twtText = tweet.text.toString().replace("&amp;","&");
				}else{
					twtText = tweet.extended_tweet.full_text.toString().replace("&amp;","&");
				}

				twtUsername = tweet.user.name.toString();
				twtScreenName = tweet.user.screen_name.toString();				
				twtAvatar = tweet.user.profile_image_url.toString();
				twtCreatedAt = tweet.created_at.toString();
				twtTimestamp = tweet.timestamp_ms.toString();

				payloadStatus = "received"

				// Making the color different for different user
				if(tweet.user.screen_name == secret.TWITTER_STREAM_SCREENNAME[0]){
					twtColor = 16753920;
				}else{
					twtColor = 1879160;
				};

				// Tringgering the !twcon so the bot will write a message with content from twitter (see "!twcon" for details)
				clientDiscord.emit("message", "!twcon");
			}
		}
		// Console logging
		console.log(" [ "+dateFormat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Tweet recived, status: "+payloadStatus);
		payloadStatus = "rejected";
	});
  
	stream.on('error', function(error) {
	  console.log(error);
	});
  });

  // Koldrak (Dragon) notification

  ontime({
		// Time format is on UTC
		cycle: ['00:50:00', '03:50:00', '06:50:00', '18:50:00', '21:50:00'], 
		utc: true
  }, function (koldrak){
		// Triggering "!koldrak alert" so the bot will write the alert (see "!koldrak" for details)
		if(koldrakAlertSystem == false){
			clientDiscord.emit("message", "!koldrak debug");
		}else{
			clientDiscord.emit("message", "!koldrak alert");
		};
		koldrak.done();
		return;
  }
) 

// Daily reset notification
ontime({
	cycle: ['12:00:00'],
	utc: true
	}, function(daily){
		clientDiscord.emit("message", "!daily announce");
		clientDiscord.emit("message", "!event announce");
		daily.done();
		return;
});

// Weekly reset notification
ontime({
	cycle: ['wed 12:00:00'],
	utc: true
	}, function(weekly){
		clientDiscord.emit("message", "!weekly announce");
		weekly.done();
		return;
});

// Soyun activity changer
ontime({
    cycle: ['00']
}, function (soyunActivity) {
    	clientDiscord.emit("message", "!soyun activity");
		soyunActivity.done();
		return;
})

// Data fetching
ontime({
	cycle: ['thu 00:00:00'],
	utc: true
}, function (dataUpdate) {
    	clientDiscord.emit("message", "!getupdate");
		dataUpdate.done();
		return;
})

// basin status
/*
ontime({
	cycle: ['00']
	}, function (basinTicker){
		if(basinTime <= 42){
			basinStatus = "Announce: "+(43 - basinTime)+"mins"
			//clientDiscord.emit("message", "!basin status");
		}else if(basinTime >= 43 && basinTime <= 44 ){
			basinStatus = "Spawn: "+(45 - basinTime)+"mins"
			//clientDiscord.emit("message", "!basin status");
		}else if(basinTime >= 45 && basinTime <= 55){
			basinStatus = "End: "+(55 - basinTime)+"mins"
			//clientDiscord.emit("message", "!basin status");
		}
		basinTime++;

		basinTicker.done();
		return;
})
*/