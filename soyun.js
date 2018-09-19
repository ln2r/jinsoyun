const Discord = require("discord.js");
const Twitter = require("twitter");
const ontime = require("ontime");
const fetch = require('node-fetch');
const fs = require('fs');
const dateformat = require('dateformat');
const delay = require('delay');
const https = require('https');
const ping = require('ping');

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
const eventNext = require("./data/data-event-next.json"); // For testing the next event data

const clientDiscord = new Discord.Client();
const clientTwitter = new Twitter({
	consumer_key: secret.TWITTER_CONSUMER_KEY,
	consumer_secret: secret.TWITTER_CONSUMER_SECRET,
	access_token_key: secret.TWITTER_ACCESS_TOKEN_KEY,
	access_token_secret: secret.TWITTER_ACCESS_TOKEN_SECRET
});

// Default class list
var classArr = ["blade master", "destroyer", "summoner", "force master", "kung fu master", "assassin", "blade dancer", "warlock", "soul fighter", "gunslinger", "warden"];

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

// silveress API point
const silveressNA = "https://api.silveress.ie/bns/v3/character/full/na/";
const silveressEU = "https://api.silveress.ie/bns/v3/character/full/eu/";
const silveressItem = "https://api.silveress.ie/bns/v3/items";
const silveressMarket = "https://api.silveress.ie/bns/v3/market/na/current/";
const silveressQuest = "https://api.silveress.ie/bns/v3/dungeons/quests";
const silveressRecipe = "https://api.silveress.ie/bns/v3/recipe/current?active=true";

// Soyun activity
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
	for(var i = 0; i < items.length; i++){
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
		var gold = str.substring( 0 , len -4)+ "<:gold:463569669496897547>";
	}
	if(len > 2){
		var silver = str.substring( len -2 ,len - 4 )+ "<:silver:463569669442371586>";
	}
	if(len > 0){
		var copper = str.substring( len ,len -2 )+ "<:copper:463569668095868928>";
	} 

	var total = gold + silver + copper; 
	return total;
}

// getting quest day and returning array of matched quest index
function getQuests(day){
	var day = day.toString().replace(/(^|\s)\S/g, l => l.toUpperCase());
	var questsID = [];
	var idx = 0;

	for (i = 0; i < quests.length; i++){
		for(j = 0; j < 7; j++){
			if(quests[i].daily_challenge[j] == day){
				var questMatchedLocation = i;
				questsID[idx] = questMatchedLocation;
				idx++;
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

// Empty data fetched handling, return data or "Custom no data message"
function fetchData(data){
	var data = data;

	if(data == "" || data == null){
		data = "No data available";
	}else{
		data = data;
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
			typeValue = "Dynamic Quest";
		break;
		case 2:
			typeValue = "Event Quest";
		break;
		default:
			typeValue = "";
		break;
	}

	if(typeValue != ""){
		typeValue = "("+typeValue+")";
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

// Getting character skillset, get: class;element, return: file loc
function getTrainableSkills(charaClass, charaElement){
	var charaSkillsetData = require('./data/class/'+charaClass+'/'+charaElement+'.json');	

	var charaClass = charaClass.toLowerCase();
	var charaElement = charaElement.toLowerCase();
	var charaSkillset = [];
	var idx = 0;

	for(var i = 0; i < charaSkillsetData.records.length; i++){
		if(charaSkillsetData.records[i].variations.length > 1){
			charaSkillset[idx] = {"id": charaSkillsetData.records[i].id, "idx": i};
			idx++;
		}
	}
	charaSkillset.shift(); // removing "windwalk" skill
	return charaSkillset;
}

// Getting skill type, get: chara class, element, name - return: skills, type
async function getSkillset(charaClass, charaElement, charaName){
	var charaSkillsetData = require("./data/class/"+charaClass+"/"+charaElement+".json");
		charaSkillsetData = charaSkillsetData.records;

	var charaName = charaName.replace(" ", "%20");
	var charaElement = charaElement.toLowerCase();
	var charaClass = charaClass.replace(" ", "");

	// reference url: http://na-bns.ncsoft.com/ingame/api/skill/characters/Wquin%20Hollow/skills/pages/1.json
	var userSkillset = await getData("http://na-bns.ncsoft.com/ingame/api/skill/characters/"+charaName+"/skills/pages/1.json");	
		userSkillset = userSkillset.records;

	var charaTrainableList = getTrainableSkills(charaClass, charaElement);
	var charaTrainableSkills = "";

	// searching for match
	for(var i = 0; i < userSkillset.length; i++){
		for(var j = 0; j < charaTrainableList.length; j++){
			// checking if the skill_id is the same
			if(userSkillset[i].skill_id == charaTrainableList[j].id){
				// getting the correct variation
				for(var k = 0; k < charaSkillsetData[charaTrainableList[j].idx].variations.length; k++){
					if(userSkillset[i].variation_index == charaSkillsetData[charaTrainableList[j].idx].variations[k].variation_index){
						charaTrainableSkills = charaTrainableSkills + (charaSkillsetData[charaTrainableList[j].idx].variations[k].name+": "+charaSkillsetData[charaTrainableList[j].idx].variations[k].training_icon_desc.replace(/<[^>]+>/g, "")+"\n")
					}
				}							
			}
		}
	}

	// error handling for character that haven't got trainable skills
	if(charaTrainableSkills == null || charaTrainableSkills == "" || charaTrainableSkills == false){
		return charaTrainableSkills = "No data available";
	}else{
		return charaTrainableSkills;		
	}		
}

// formating the text
function setTextFormat(text){
	text = text.toLowerCase();
	text = text.replace(/(^|\s)\S/g, l => l.toUpperCase());

	return text;
}

// get an array of item id for item that contain query item
function getItemIDArray(query){
	var itemIDArray = [];
	var idx = 0;

	for(var i = 0; i < items.length; i++){
		var itemSearchName = items[i].name;
			itemSearchName = itemSearchName.replace("'", "").toLowerCase().split(" ");
		var itemSearchQuery = query;
			itemSearchQuery = itemSearchQuery.replace("'", "").toLowerCase().split(" ");

		if(items[i].name.includes(query)){
			itemIDArray[idx] = items[i].id;
			idx++;
		}				
	}
	
	// item exception
	if(query == "Soulstone"){
		itemIDArray = itemIDArray.slice(0, 4);
	};

	return itemIDArray;
}

				

// twitter https://zjttvm6ql9lp.statuspage.io/api/v2/components.json
// discord https://srhpyqt94yxb.statuspage.io/api/v2/status.json
						
async function getAPIStatus(){
	var apiStatus = [];
	var apiAdress = config.API_ADDRESS;

	await https.get(apiAdress[0].address, function (res) {
		apiStatus[0] = "Operational";
	}).on('error', function(e) {
		apiStatus[0] = "Unreachable";
	});
	await delay(1000);
	await https.get(apiAdress[1].address, function (res) {
		apiStatus[1] = "Operational";
	}).on('error', function(e) {
		apiStatus[1] = "Unreachable";
	});
	await delay(1000);

	return apiStatus;
}

// Discord stuff start here

// Starting up the bot
clientDiscord.on("ready", async () => {
	var apiStatus = await getAPIStatus();
	var apiAdress = config.API_ADDRESS;
	// statuspage stuff
	var discordStatus = await getData("https://srhpyqt94yxb.statuspage.io/api/v2/status.json");
	var twitterStatus = await getData("https://zjttvm6ql9lp.statuspage.io/api/v2/summary.json");

	clientDiscord.user.setUsername("Jinsoyun");
	clientDiscord.user.setPresence({ game: { name: 'with Hongmoon School' }, status: 'online' })
		.catch(console.error);
	
	console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > bot is alive and ready");
	console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Discord service: "+discordStatus.status.description);
	console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Twitter service: "+twitterStatus.status.description);

	for(var i = 0; i < apiStatus.length; i++){
		console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+apiAdress[i].name+" service: "+apiStatus[i]);
	}
});

// User joined the guild
clientDiscord.on("guildMemberAdd", (member) => {
	// Add 'cricket' role so new member so they cant access anything until they do !join for organizing reason
	member.addRole(member.guild.roles.find(x => x.name == "cricket"));
	
	// Welcoming message and guide to join
	member.guild.channels.find(x => x.name == config.DEFAULT_MEMBER_GATE).send('Hi <@'+member.user.id+'>, welcome to ***'+member.guild.name+'***!\n\nTheres one thing you need to do before you can talk with others, can you tell me your in-game nickname and your class? to do that please write ***!reg "username here" "your class here"***, here is an example how to do so: ***!reg "Jinsoyun" "Blade Master"***, thank you! ^^ \n\nIf you need some assistance you can **@mention** or **DM** available officers');

	// Console logging
	console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+member.user.username+" has joined");
	console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+member.user.username+" role is changed to 'cricket' until "+member.user.username+" do !reg");
});

// User left the guild (kicked or just left)
clientDiscord.on("guildMemberRemove", async (member) => {
	var silveressQuerry = silveressNA+member.displayName; // for the querry
	var charaData = await getData(silveressQuerry);

	member.guild.channels.find(x => x.name == config.DEFAULT_MEMBER_LOG).send({
		"embed":{
			"color": 15605837,
			"author":{
				"name": member.nickname+" ("+member.displayName+")",
			},
			"description": charaData.activeElement+" "+charaData.playerClass+" `Level "+charaData.playerLevel+" HM "+charaData.playerLevelHM+"`",
			"footer": {
				"text": "Left - Captured at "+dateformat(Date.now(), "UTC:dd-mm-yy @ hh:MM")+" UTC"
			}
		}
	});
});

clientDiscord.on("guildMemberUpdate", async (oldMember, newMember) => {
	if(oldMember.nickname != newMember.displayName || oldMember.nickname != null){
		oldMember.guild.channels.find(x => x.name == config.DEFAULT_MEMBER_LOG).send({
			"embed":{
				"color": 16574595,
				"author":{
					"name": oldMember.nickname+" ("+newMember.displayName+")",
				},
				"description": "Display name changed ("+oldMember.displayName+" to "+newMember.displayName+")",
				"footer": {
					"text": "Edit - Captured at "+dateformat(Date.now(), "UTC:dd-mm-yy @ hh:MM")+" UTC"
				}
			}
		});
	}else{
		oldMember.guild.channels.find(x => x.name == config.DEFAULT_MEMBER_LOG).send({
			"embed":{
				"color": 16574595,
				"author":{
					"name": oldMember.nickname+" ("+newMember.displayName+")",
				},
				"description": "Role changed",
				"footer": {
					"text": "Edit - Captured at "+dateformat(Date.now(), "UTC:dd-mm-yy @ hh:MM")+" UTC"
				}
			}
		});
	}
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
				var soyunHelpTxt = '**Account**\n- Nickname: `!username "desired nickname"`\n- Class: `!class "desired class"`\n\n**Blade & Soul**\n- Character Search: `!who` or `!who "character name"`\n- Daily challenges `!daily` or `!daily tomorrow`\n- Weekly challenges `!weekly`\n- *Koldrak\'s Lair*  time: `!koldrak`\n- Marketplace `!market "item name"`\n- Current Event `!event`\n\n**Miscellaneous**\n- Pick: `!pick "item a" or "item b"`\n- Roll dice: `!roll` or `!roll (start number)-(end number)` example: `!roll 4-7`\n- Commands list: `!soyun help`\n- Try Me! `!soyun`';

				soyunQuerry = soyunQuerry.splice(1);

				switch(soyunQuerry[0]){
					case 'help':
						if(message.channel.name == config.DEFAULT_ADMIN_CHANNEL){
							soyunHelpTxt = soyunHelpTxt + '\n\n**Admin**\n- Announcement: `!say "title" "content"`';
						};

						message.channel.send("Here is some stuff you can ask me to do:\n\n"+soyunHelpTxt+"\n\nIf you need some assistance you can **@mention** or **DM** available **officers**.\n\n```Note: Items and quests list updated @ Wednesday 12AM UTC \n\t  Market listing updated every 1 hour```");
						// Console logging
						console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+message+" triggered");
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

						// statuspage stuff
						var discordStatus = await getData("https://srhpyqt94yxb.statuspage.io/api/v2/status.json");
						var twitterStatus = await getData("https://zjttvm6ql9lp.statuspage.io/api/v2/summary.json"); 
						var soyunPackageData = require("./package.json");     
						  
						var apiStatus = [];
						var apiStatusList = [];
						var apiAdress = config.API_ADDRESS;
						//var idx = 0;

						var apiStatus = await getAPIStatus();

						apiStatusList = "**"+apiAdress[0].name+"**: "+apiStatus[0]+"\n **"+apiAdress[1].name+"**: "+apiStatus[1]+"\n";

						//`Ping received, Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(clientDiscord.ping)}ms`
						var msgLatency = (m.createdTimestamp - message.createdTimestamp) + "ms";
						var apiLatency = Math.round(clientDiscord.ping) + "ms";

						m.edit("Current Status",{
							"embed": {
								"author":{
									"name": "Jinsoyun and API Status",
									"icon_url": "https://cdn.discordapp.com/emojis/481356415332646912.png?v=1"
								},
								"color": 16753920,
								"footer": {
									"text": "Created and maintained by ln2r - Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ hh:MM")+" UTC"
								},
								"fields":[
									{
										"name": "Jinsoyun `Bot`",
										"value": "**Server Latency**: "+msgLatency+"\n**API Latency**: "+apiLatency+"\n**Version**: "+soyunPackageData.version
									},
									{
										"name": "Discord",
										"value": "**Status**: "+discordStatus.status.description
									},
									{
										"name": "Twitter",
										"value": "**Status**: "+twitterStatus.status.description
									},
									{
										"name": "API",
										"value": apiStatusList
									}
								]
							}
						});

						// Console logging
						console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+message+" received");
					break;

					default:
						var soyunSay = soyunDialogue
						var soyunDialogueRNG = Math.floor(Math.random() * soyunSay.text.length) - 0;
						message.channel.send(soyunSay.text[soyunDialogueRNG]);

						// Console logging
						console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+message+" received");
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
					for(var i = 0; i < classArr.length; i++){
						// Class input verification (inefficient af)
						if(joinClass == classArr[i]){
							querryStatus = true;
							break;
						};
					};

					// Checking the verification
					if(querryStatus == true){
						// Convert to capitalize to make it easy and 'prettier'
						joinUsername = joinUsername.replace(/(^|\s)\S/g, l => l.toUpperCase());
						//#Collection.find(x => x.name === "name")
						// Setting user role to match the user class
						message.guild.members.get(message.author.id).addRole(message.guild.roles.find(x => x.name == joinClass));
						// Adding "member" role so user can talk
						message.guild.members.get(message.author.id).addRole(message.guild.roles.find(x => x.name == "member"));
						// Removing "cricket" role
						message.guild.members.get(message.author.id).removeRole(message.guild.roles.find(x => x.name == "cricket"));
						
						// Setting message author username (guild owner or lower)
						message.guild.members.get(message.author.id).setNickname(joinUsername);

						// Welcoming message on general channel
						message.guild.channels.find(x => x.name == config.DEFAULT_TEXT_CHANNEL).send("Please welcome our new "+joinClass+" ***"+joinUsername+"***!");
						payloadStatus = "received";
						querryStatus = false;

						var silveressQuerry = silveressNA+joinUsername; // for the querry
						var charaData = await getData(silveressQuerry);

						message.guild.channels.find(x => x.name == config.DEFAULT_MEMBER_LOG).send({
							"embed":{
								"color": 1879160,
								"author":{
									"name": message.author.username+" ("+joinUsername+")",
								},
								"description": charaData.activeElement+" "+charaData.playerClass+" `Level "+charaData.playerLevel+" HM "+charaData.playerLevelHM+"`",
								"footer": {
									"text": "Joined - Captured at "+dateformat(Date.now(), "UTC:dd-mm-yy @ hh:MM")+" UTC"
								}
							}
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
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+cmd+" command received");
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
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+message+" triggered");
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
					message.guild.members.get(message.author.id).removeRole(message.guild.roles.find(x => x.name == classArr[i]));					
					i++
				};

				// Checking the verification
				if(querryStatus == true){
					// Adding new role to user according their command
					message.guild.members.get(message.author.id).addRole(message.guild.roles.find(x => x.name == classValue));

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
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+cmd+" command received");
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
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+cmd+" command received");
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
					message.guild.channels.find(x => x.name == config.DEFAULT_NEWS_CHANNEL).send({
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
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+cmd+" command received");
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
						console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+classArr[i]+" role created");
					};

					// Making "news" channel
					message.guild.createChannel(config.DEFAULT_NEWS_CHANNEL, "text");
					// Console logging
					console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+config.DEFAULT_NEWS_CHANNEL+" channel created");
					
					payloadStatus = "recieved";
				};	
				// Console logging
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+message.author.username+" do "+message+", status: "+payloadStatus);
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
				
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+cmd+" command received");
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

				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+cmd+" command received");
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
						dcDate = dcDate.setDate(dcDate.getDate() + 1);

						if(dcDay == 7){
							dcDay = 0;
						}
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
					dailyQuests = dailyQuests + ("**"+quests[questsDailyList[i]].location+"** - "+quests[questsDailyList[i]].quest+"\n");
				}
				for(var i = 0; i < questsDailyListRewards.length; i++){
					dailyRewards = dailyRewards + (questsDailyListRewards[i]+"\n");
				}
				dailyRewards = dailyRewards + event.rewards.daily;
				// Sending out the payload
				if(dailyPartyAnnouncement == false){
					// default, normal payload
					message.channel.send({
						"embed": {
							"author":{
								"name": "Daily Challenges - "+dateformat(dcDate, "UTC:dddd"),
								"icon_url": "https://cdn.discordapp.com/emojis/464038094258307073.png?v=1"
							},
							"title": "Completion Rewards",
							"description": dailyRewards,
							"color": 15025535,
							"footer": {
								"icon_url": "https://cdn.discordapp.com/icons/434004985227771905/ff307183ff8d5a623ae9d0d0976f2a06.png",
								"text": "Data maintained by Grumpy Butts - Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ hh:MM")+" UTC"
							},
							"fields":[
								{
									"name": "Quests/Dungeons List (Location - Quest)",
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
												"name": "Daily Challenges - "+dateformat(dcDate, "UTC:dddd"),
												"icon_url": "https://cdn.discordapp.com/emojis/464038094258307073.png?v=1"
											},
											"title": "Completion Rewards",
											"description": dailyRewards,
											"color": 15025535,
											"footer": {
												"icon_url": "https://cdn.discordapp.com/icons/434004985227771905/ff307183ff8d5a623ae9d0d0976f2a06.png",
												"text": "Data maintained by Grumpy Butts - Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ hh:MM")+" UTC"
											},
											"fields":[
												{
													"name": "Quests/Dungeons List (Location - Quest)",
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
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+cmd+" command received");
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
									"text": "Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ hh:MM")+" UTC"
								}
							}
						})

						console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+message+" triggered");
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
													"text": "Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ hh:MM")+" UTC"
												}
											}
										});
										found = 1;
									}
								}
							});
						});

						console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > !koldrak alert triggered");
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
						console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+message+" triggered");
				};
			break;
			
			// for searching and showing character information, can be triggered via !who for character that have the same name with the nickname or use !who "chara name" for specific one
			case 'who':
				message.channel.startTyping();

				var whoQuerry = message.toString().substring(1).split('"');
					whoQuerry = whoQuerry.splice(1);

				if(whoQuerry[0] == null){
					whoQuerry = [message.member.nickname];
				}				

				var silveressQuerry = silveressNA+whoQuerry[0]; // for the querry
				var charaData = await getData(silveressQuerry);
				var skillsetData = await getSkillset(charaData.playerClass.toLowerCase().replace(" ", ""), charaData.activeElement, charaData.characterName)

				var bnstreeProfile = "https://bnstree.com/character/na/"+whoQuerry[0]; // for author url so user can look at more detailed version
					bnstreeProfile = bnstreeProfile.replace(" ","%20"); // replacing the space so discord.js embed wont screaming error
				
				message.channel.stopTyping();

				if(charaData.characterName == "undefined"){
					message.channel.send('Im sorry i cant find the character you are looking for, can you try again?\n\nExample: **!who "Jinsoyun"**');

					payloadStatus = 'rejected';
					
				}else{
					message.channel.send({
						"embed": {
							"author": {
							"name": fetchData(charaData.guild)+"\'s "+fetchData(charaData.characterName)	
							},
							"title": fetchData(charaData.characterName)+" is a Level "+fetchData(charaData.playerLevel)+" HM "+fetchData(charaData.playerLevelHM)+" "+fetchData(charaData.activeElement)+" "+fetchData(charaData.playerClass)+"\n ",
							"url": bnstreeProfile,
							"fields": [
							{
								"name": "Basic Stats",
								"value": "HP: "+fetchData(charaData.hp)+"\nAttack Power: "+fetchData(charaData.ap)+"\nHongmoon Points Allocation (Atk - Def): "+fetchData(charaData.HMAttackPoint)+" - "+fetchData(charaData.HMDefencePoint)
							},
							{
								"name": "\nOffensive Stats",
								"value": "Boss Attack Power: "+charaData.ap_boss+"\nCritical Hit: "+charaData.crit+" ("+(charaData.critRate*100).toFixed(2)+"%)\nCritical Damage: "+charaData.critDamage+" ("+(charaData.critDamageRate*100).toFixed(2)+"%)",
							},
							{
								"name": "\nDefensive Stats",
								"value": "Defense: "+charaData.defence+"\nBoss Defense: "+charaData.defence_boss+"\nEvasion: "+charaData.evasion+" ("+(charaData.evasionRate*100).toFixed(2)+"%)\nBlock: "+charaData.block+" ("+(charaData.blockRate*100).toFixed(2)+"%)",
							},
							{
								"name": "Weapon",
								"value": fetchData(charaData.weaponName)+"\n\n ",
							},
							{
								"name": "Gems",
								"value": fetchData(charaData.gem1)+"\n"+fetchData(charaData.gem2)+"\n"+fetchData(charaData.gem3)+"\n"+fetchData(charaData.gem4)+"\n"+fetchData(charaData.gem5)+"\n"+fetchData(charaData.gem6)+"\n",
							},
							{
								"name": "Equipments",
								"value": "Ring: "+fetchData(charaData.ringName)+"\nEarring: "+fetchData(charaData.earringName)+"\nNecklace: "+fetchData(charaData.necklaceName)+"\nBraclet: "+fetchData(charaData.braceletName)+"\nBelt: "+fetchData(charaData.beltName)+"\nGloves: "+fetchData(charaData.gloves)+"\nSoul: "+fetchData(charaData.soulName)+"\nHeart: "+fetchData(charaData.soulName2)+"\nAura Pet: "+fetchData(charaData.petAuraName)+"\nSoul Badge: "+fetchData(charaData.soulBadgeName)+"\nMystic Badge: "+fetchData(charaData.mysticBadgeName), 
							},
							{
								"name": "Soulshield",
								"value": fetchData(charaData.soulshield1)+"\n"+fetchData(charaData.soulshield2)+"\n"+fetchData(charaData.soulshield3)+"\n"+fetchData(charaData.soulshield4)+"\n"+fetchData(charaData.soulshield5)+"\n"+fetchData(charaData.soulshield6)+"\n"+fetchData(charaData.soulshield7)+"\n"+fetchData(charaData.soulshield8), 
							},
							{
								"name": "Trainable Skills (Skill Name: Type)",
								"value": skillsetData

							},
							{
								"name": "Arena Stats",
								"value": "Games (Play - Win - Lose): "+charaData.tournamentTotalGames+" - "+charaData.tournamentTotalWins+" - "+(charaData.tournamentTotalGames-charaData.tournamentTotalWins)+" ("+getWinRate(charaData.tournamentTotalGames, charaData.tournamentTotalWins)+"% win rate)\nSolo Wins: "+charaData.tournamentSoloWins+" ("+charaData.tournamentSoloTier+")\nTag Team Wins: "+charaData.tournamentTagWins+" ("+charaData.tournamentTagTier+")"
							},
							{
								"name": "Miscellaneous",
								"value": "Server: "+fetchData(charaData.server)+"\nFaction: "+fetchData(charaData.faction)+" ("+fetchData(charaData.factionRank)+")\nBnS Tools Whale Score (PvE): "+fetchData(charaData.bnsToolsPvEScore),
							}],
							"description": "",
							"color": Math.floor(Math.random() * 16777215) - 0,
							"footer": {
								"icon_url": "https://slate.silveress.ie/images/logo.png",
								"text": "Powered by Silveress's BnS API - Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ hh:MM")+" UTC"
							},
							"thumbnail": {
								"url": charaData.characterImg
							}
						}
					})
				}
				
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+cmd+" command received");
			break;
			
			// for searching item in market, can be triggered via !market "item name"
			case 'market':
				var marketQuery = message.toString().substring(1).split('"');
					marketQuery = marketQuery.splice(1); // removing the command text
					marketQuery = setTextFormat(marketQuery[0]);

				var marketItemIDList = getItemIDArray(marketQuery);
				var marketDataValue = "";
				var marketData = [];

				message.channel.startTyping();

				// getting set item of data
				for(var i = 0; i < marketItemIDList.length; i++){
					
					marketData = await getData(silveressMarket+marketItemIDList[i]);

					if(marketData.length != 0){
						marketDataValue = marketDataValue + ("**"+marketData[0].name+"** `"+marketData[0].id+"`\n- Each: "+currencyConvert(marketData[0].listings[0].each)+"\n- Lowest: "+currencyConvert(marketData[0].listings[0].price)+" for "+marketData[0].listings[0].count+"\n");

						fetchTime = marketData[0].ISO
					}
				}

				if(marketDataValue == "" || marketDataValue == null){
					marketDataValue = "*No result on **"+marketQuery+"**\n The item is either untradable, not in marketplace or maybe it's not exist*"
				}

				message.channel.stopTyping();

				//console.log(marketData);
				//message.channel.send(marketDataValue);

				if(marketData == null){
					var fetchTime = Date.now();
				}else{
					var fetchTime = fetchTime;
				}

				message.channel.send({
					"embed": {
						"author":{
							"name": "Marketplace - "+marketQuery,
							"icon_url": "https://cdn.discordapp.com/emojis/464036617531686913.png?v=1"
						},
						"description": marketDataValue,
						"color": 16766720,
						"footer": {
							"icon_url": "https://slate.silveress.ie/images/logo.png",
							"text": "Powered by Silveress's BnS API - Retrieved at "+dateformat(fetchTime, "UTC:dd-mm-yy @ hh:MM")+" UTC"
						},
						"thumbnail": {
							"url": getItemImg(marketItemIDList[0])
						},
					}	
				})		 
					console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+cmd+" command received");
				break;

			// for getting the current event information
			case 'event':
				var eventToDo = event.rewards.sources;
				var eventQuery = message.toString().substring(1).split(' ');
					eventQuery = eventQuery.splice(1);
				var eventQuests = "";
				
				var today = new Date();
				var currentDate = today;
					today = today.getUTCDay();
				var todayEvent = [];
				var k = 0;

				// for checking tomorrow event quests
				if(eventQuery[0] == "tomorrow"){
					if(today == 6){
						today = 0;
						currentDate = currentDate.setDate(currentDate.getDate() - 6);	
					}else{
						today = today + 1;
						currentDate = currentDate.setDate(currentDate.getDate() + 1);
					}
				}

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
				for(var i = 0; i < todayEvent.length; i++){
						eventQuests = eventQuests + ("**"+event.quests[todayEvent[i]].location+"** - "+event.quests[todayEvent[i]].quest+" "+getQuestType(event.quests[todayEvent[i]].type)+"\n")
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
												"description": "**Duration**: "+event.duration+"\n**Redemption Period**: "+event.redeem+"\n**Event Item**: "+setDataFormatting(event.rewards.name)+"\n**Event Currency**: "+setDataFormatting(event.rewards.currency)+"\n**What to do**: "+setDataFormatting(eventToDo),
												"color": 1879160,
												"footer": {
													"icon_url": "https://static.bladeandsoul.com/img/global/nav-bs-logo.png",
													"text": "Blade & Soul Event - Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ hh:MM")+" UTC"
												},
												"fields":[
													{
														"name": dateformat(currentDate, "UTC:dddd")+" Quests/Dungeons List (Location - Quest (Type))",
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
									"text": "Blade & Soul Event - Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ hh:MM")+" UTC"
								},
								"fields":[
									{
										"name": dateformat(currentDate, "UTC:dddd")+" Quests/Dungeons List (Location - Quest (Type))",
										"value": eventQuests 								
									}
								]
							}	
						})
					break;
				};
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+cmd+" command received");
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
													"text": "Data maintained by Grumpy Butts - Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ hh:MM")+" UTC"
												},
												"fields":[
													{
														"name": "Quests/Dungeons List (Location - Quest (Type))",
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
									"text": "Data maintained by Grumpy Butts - Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ hh:MM")+" UTC"
								},
								"fields":[
									{
										"name": "Quests/Dungeons List (Location - Quest (Type))",
										"value": weeklyQuests 								
									}
								]
							}
						});
					break;
				}
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+cmd+" command received");
				payloadStatus = "rejected";	
			break;
			
			// data gathering start from here
			case 'getupdate':				
				var classData = classDataSource;
				var errCount = 0;
				var errLocation = [];
				var errMsg = "";

				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > starting data update..");
				
				// item data
				fs.writeFile('./data/list-item.json', JSON.stringify(await getData(silveressItem), null, '\t'), function (err) {
					if(err){
						console.log(err);
						errCount++;
						errLocation[errCount] = "list-item data"
						errMsg = errMsg + (err + "\n");
					}
				})	

				// class data
				for(var i = 0; i < classData.length; i++){
					// checking if directory is exist or not, if not make one
					if(!fs.existsSync('./data/class/'+classData[i].name)){
						fs.mkdirSync('./data/class/'+classData[i].name, function (err) {
							if(err){
								console.log(err);
								errCount++;
								errLocation[errCount] = classData[i].name +" folder"
								errMsg = errMsg + (err + "\n");
							}
						});
					}

					// getting and writing attributes data into a .json file
					fs.writeFile('./data/class/'+classData[i].name+'/attributes.json', JSON.stringify(await getData(classData[i].attributes), null, '\t'), function (err) {
						if(err){
							console.log(err);
							errCount++;
							errLocation[errCount] = classData[i].name + " attributes data"
							errMsg = errMsg + (err + "\n");
						}
					})

					await delay(500);

					var classAttributeData = require('./data/class/'+classData[i].name+'/attributes.json');
					// getting class attribute value
					for(var j = 0; j < classAttributeData.records.length; j++){
						var classAttributeValue = classAttributeData.records[j].attribute;
						//console.log("current attribute @ "+classData[i].name+": "+classAttributeValue);

						// getting and writing class skillset depending on its attribute
						fs.writeFile('./data/class/'+classData[i].name+'/'+classAttributeValue+'.json', JSON.stringify(await getData(classData[i].skillsets[j]), null, '\t'), function (err) {
							if(err){
								console.log(err);
								errCount++;
								errLocation[errCount] = classData[i].name + classAttributeValue + " skillset data"
								errMsg = errMsg + (err + "\n");
							}
						})
					}				
				}
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > all data updated with "+errCount+" problem(s)");

				if(errCount != 0){
					console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > problem occured on: "+errLocation);
					message.guild.channels.find(x => x.name == "errors").send("Caught an issue on `"+errLocation+"`\n```"+errMsg+"```");
				}	
				
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
						console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Quest data fetched, status: "+payloadStatus);
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
						console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Recipe data fetched, status: "+payloadStatus);
					});
				*/	
			break;

			// For testing the next event data
			case 'eventnext':
				var eventToDo = eventNext.rewards.sources;
				var eventQuery = message.toString().substring(1).split(' ');
					eventQuery = eventQuery.splice(1);
				var eventQuests = "";
				var today = new Date();
					today = today.getUTCDay();
				var todayEvent = [];
				var k = 0;

				// getting index of event that have the same day with today
				for(var i = 0; i < eventNext.quests.length; i++){
					for(var j = 0; j < 7; j++){
						if(eventNext.quests[i].day[j] == getDay(today)){
							var idx = i;							
							todayEvent[k] = idx;
							k++;
						}
					}
				}

				// for searching event that have the same index with day searching and then inserting the correct one into variable for output later
				for(var i = 0; i < todayEvent.length; i++){
					eventQuests = eventQuests + ("**"+eventNext.quests[todayEvent[i]].location+"** - "+eventNext.quests[todayEvent[i]].quest+" "+getQuestType(eventNext.quests[todayEvent[i]].type)+"\n")
				}
				
				// output
				message.channel.send({
					"embed": {
						"author":{
							"name": "Current Event",
							"icon_url": "https://cdn.discordapp.com/emojis/479872059376271360.png?v=1"
						},
						"title": eventNext.name,
						"url": eventNext.url,
						"description": "**Duration**: "+eventNext.duration+"\n**Redemption Period**: "+eventNext.redeem+"\n**Event Item**: "+setDataFormatting(eventNext.rewards.name)+"\n**Event Currency**: "+setDataFormatting(eventNext.rewards.currency)+"\n**What to do**: "+setDataFormatting(eventToDo),
						"color": 1879160,
						"footer": {
							"icon_url": "https://static.bladeandsoul.com/img/global/nav-bs-logo.png",
							"text": "Blade & Soul Event - Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ hh:MM")+" UTC"
						},
						"fields":[
							{
								"name": "Today Quests/Dungeons List (Location - Quest (Type))",
								"value": eventQuests 								
							}
						]
					}	
				});
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+cmd+" command received");
				payloadStatus = "rejected";				
			break;

			// Fetching the market data
			case 'getmarketdata':
				var marketQuery = message.toString().substring(1).split(" ");
					marketQuery = marketQuery.splice(1);
				var marketFetchUrl = "https://api.silveress.ie/bns/v3/market/na/current/lowest";

				var itemData = require("./data/list-item.json"); //item data
				var marketDataCurrent = await getData(marketFetchUrl); //fecthing the current data (one listing, lowest)

				var marketListCurrent = [];
				var idx = 1;

				// merging the data (item data and market data)
				for(var i = 0; i < itemData.length; i++){
					for(var j = 0; j < marketDataCurrent.length; j++){
						if(itemData[i].id == marketDataCurrent[j].id){
							marketListCurrent[idx] = 
								{
									"id": itemData[i].id,
									"updated": marketDataCurrent[j].ISO,
									"firstAdded": itemData[i].firstAdded,
									"name": itemData[i].name,
									"img": itemData[i].img,
									"totalListings": marketDataCurrent[j].totalListings,
									"priceEach": marketDataCurrent[j].priceEach,
									"priceTotal": marketDataCurrent[j].priceTotal,
									"quantity": marketDataCurrent[j].quantity
								}
							idx++;	
						}
					}
				}

				var updateDate = new Date();
					updateDate = updateDate.toISOString();

				// meta-data for comparing update time later
				marketListCurrent[0] = {
					"id": 0000000,
					"name": "meta-data",
					"update-time": updateDate,
					"data-count": marketListCurrent.length - 1
				}

				// writing the data into a file
				fs.writeFile('./data/list-market-data.json', JSON.stringify(marketListCurrent, null, '\t'), function (err) {
					if(err){
						console.log(err);
						message.guild.channels.find(x => x.name == "errors").send("Caught an issue on `"+cmd+"`\n```"+err+"```");
					}
				})
			break;

			// For error notification so I know when something went wrong
			case 'err':
				var errQuery = message.toString().substring(1).split('|');
					errQuery = errQuery.splice(1);
				message.guild.channels.find(x => x.name == "errors").send("Caught an error\n```"+errQuery[0]+"```");
			break;
		 };
     };
});

// Bot token here
clientDiscord.login(secret.DISCORD_APP_TOKEN);

// Twitter hook
// Getting user tweet, parameter used: user id, e.g: "3521186773". You can get user id via http://gettwitterid.com/

clientTwitter.stream('statuses/filter', {follow: config.TWITTER_STREAM_ID},  function(stream) {
	stream.on('data', function(tweet) {
		// Filtering data so it only getting data from specified user
		if((tweet.user.screen_name == config.TWITTER_STREAM_SCREENNAME[0] || tweet.user.screen_name == config.TWITTER_STREAM_SCREENNAME[1]) || (tweet.user.screen_name == config.TWITTER_STREAM_SCREENNAME[2])){
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
				if(tweet.user.screen_name == config.TWITTER_STREAM_SCREENNAME[0]){
					twtColor = 16753920;
				}else{
					twtColor = 1879160;
				};

				// Tringgering the !twcon so the bot will write a message with content from twitter (see "!twcon" for details)
				clientDiscord.emit("message", "!twcon");
			}
		}
		// Console logging
		console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Tweet received, status: "+payloadStatus);
		payloadStatus = "rejected";
	});
  
	stream.on('error', function(error) {
		member.guild.channels.find(x => x.name == "errors").send("Caught an issue on `clientTwitter.stream`\n```"+error+"```");
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

// Error catching (just for notification not handling)
/*
process.on('uncaughtException', function(err) {
	clientDiscord.emit("message", "!err |"+err+"|")
});
process.on('unhandledRejection', function(err) {
	clientDiscord.emit("message", "!err |"+err+"|")
});
*/