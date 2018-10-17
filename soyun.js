const Discord = require("discord.js");
const Twitter = require("twitter");
const ontime = require("ontime");
const fetch = require('node-fetch');
const fs = require('fs');
const dateformat = require('dateformat');
const delay = require('delay');
const https = require('https');

const secret = require("./secret.json");
const config = require("./config.json");

const clientDiscord = new Discord.Client();
const clientTwitter = new Twitter({
	consumer_key: secret.TWITTER_CONSUMER_KEY,
	consumer_secret: secret.TWITTER_CONSUMER_SECRET,
	access_token_key: secret.TWITTER_ACCESS_TOKEN_KEY,
	access_token_secret: secret.TWITTER_ACCESS_TOKEN_SECRET
})

// Default class list
var classArr = ["blade master", "destroyer", "summoner", "force master", "kung fu master", "assassin", "blade dancer", "warlock", "soul fighter", "gunslinger", "warden"];

// Querry payload status
var payloadStatus = "rejected";

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
const silveressNA = config.API_ADDRESS[0].address;
const silveressItem = config.API_ADDRESS[2].address;

// Soyun activity
var statusRandom = 0;

// function list

// converting number (702501) only format to more readable format (70g 25s 01c)
function setCurrencyFormat(number){
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
async function getQuests(day){
	var day = day.toString().replace(/(^|\s)\S/g, l => l.toUpperCase());

	var quests = await getFileData("./data/list-quest.json");
	
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

// Data handling, return data or "Custom no data message"
function setDataValue(data){
	var data = data;

	try{
		if(data == "" || data == null){
			data = "No data available";
		}else{
			data = data;
		}
	}catch(error){
		console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Warning: Unable to handle fetched data using setDataValue, "+error);
		clientDiscord.emit("message", "!err |"+error.stack+"|");
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

	return (winRate + "%");	
}

// Get data from 3rd party source (website)
async function getSiteData(query) {
	try{
		const response = await fetch(query);

		return response.json();
	}catch(error){
		console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Warning: Unable to fetch data using getSiteData, "+error);
		clientDiscord.emit("message", "!err |"+error.stack+"|");
	}	
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
async function getWeeklyQuests(){
	var quests = await getFileData("./data/list-quest.json");

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
	var charaSkillsetData = await getFileData("./data/class/"+charaClass+"/"+charaElement+".json"); 
		charaSkillsetData = charaSkillsetData.records;

	var charaName = charaName.replace(" ", "%20");
	var charaElement = charaElement.toLowerCase();
	var charaClass = charaClass.replace(" ", "");

	// reference url: http://na-bns.ncsoft.com/ingame/api/skill/characters/Wquin%20Hollow/skills/pages/1.json
	var userSkillset = await getSiteData("http://na-bns.ncsoft.com/ingame/api/skill/characters/"+charaName+"/skills/pages/1.json");	
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

// getting data from a file
async function getFileData(path){
	//const fs = require('fs').promises;
	var content = "";

	try{
		var content = fs.readFileSync(path, 'utf8');
			content = JSON.parse(content);
	}catch(error){
		console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Warning: Unable to fetch data using getFileData, "+error);
		clientDiscord.emit("message", "!err |"+error.stack+"|")
	};

	return content;
}

// Getting an array of the location of searched query data
async function getDataIndex(query, dataPath){
	var data = await getFileData(dataPath);	
	var dataIndexArray = [];
	var idx = 0;

	for(var i = 1; i < data.length; i++){
		var dataSearchName = data[i].name;
			dataSearchName = dataSearchName.replace("'", "").toLowerCase().split(" ");
		var dataSearchQuery = query;
			dataSearchQuery = dataSearchQuery.replace("'", "").toLowerCase().split(" ");
	
		if(data[i].name.includes(query)){
			dataIndexArray[idx] = i;
			idx++;
		}				
	}

	return dataIndexArray;
}		

function getPriceStatus(priceOld, priceNew){
	if(priceNew == priceOld){
		var priceStatus = [("" + "0.00%"), "➖"];
	}else{
		var percentage = ((priceNew-priceOld)/ 100).toFixed(2);
		
		if(percentage < 0){
			var symbol = "";
			var emoji = "🔽";
		}else{
			var symbol = "+";
			var emoji = "🔼";
		}

		var priceStatus = [(symbol + percentage+"%"), emoji];
	}					

	return priceStatus;
}

// character PvP placement handling
function setCharacterPlacement(rank){
	if(rank == "" || rank == null){
		var pvpPlacement = "Unranked";
	}else{
		var pvpPlacement = rank;
	}

	return pvpPlacement;
}

// Discord stuff start here

// Bot token here
clientDiscord.login(secret.DISCORD_APP_TOKEN).catch(error => {
	console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Warning: Unable to start the bot, "+error);
});

// Starting up the bot
clientDiscord.on("ready", async () => {
	var apiStatus = await getAPIStatus();
	var apiAdress = config.API_ADDRESS;

	// statuspage stuff
	var discordStatus = await getSiteData(config.API_ADDRESS[3].address); 
	var twitterStatus = await getSiteData(config.API_ADDRESS[4].address);

	clientDiscord.user.setUsername("Jinsoyun");
	clientDiscord.user.setPresence({ game: { name: 'with Hongmoon School' }, status: 'online' })
		.catch(console.error);
	
	console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Bot service: Started");
	if(config.ARCHIVING == false){
		console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Warning: Archiving system is disabled");
	}
	console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Discord service: "+discordStatus.status.description);
	console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Twitter service: "+twitterStatus.status.description);

	for(var i = 0; i < 2; i++){
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
	var charaData = await getSiteData(silveressQuerry);

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
	if(oldMember.guild.channels.find(x => x.name == config.DEFAULT_MEMBER_LOG) == true){
		oldMember.guild.channels.find(x => x.name == config.DEFAULT_MEMBER_LOG).send({
			"embed":{
				"color": 16574595,
				"author":{
					"name": newMember.displayName,
				},
				"description": "User detail changed (check audit log for details)",
				"footer": {
					"text": "Edit - Captured at "+dateformat(Date.now(), "UTC:dd-mm-yy @ hh:MM")+" UTC"
				}
			}
		});
	}else{
		console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Warning: Unable to find"+config.DEFAULT_MEMBER_LOG+" channel, member log won't be saved");
	};
});

// User commands
clientDiscord.on("message", async (message) => {
  	if (message.toString().substring(0, 1) == '!') {
		//var args = message.toString().substring(1).split(' ');
		var	args = message.toString();
			args = args.substring(1).split(' ');
		var cmd = args[0];
			cmd = cmd.toLowerCase();

        args = args.splice(1);
        switch(cmd) {
			// Connection test
			case 'soyun':
				var soyunQuerry = message.toString().substring(1).split(' ');
				var soyunHelpTxt = '**Account**\n- Nickname: `!username "desired nickname"`\n- Class: `!class "desired class"`\n\n**Blade & Soul**\n- Character Search: `!who` or `!who "character name"`\n- Daily challenges `!daily` or `!daily tomorrow`\n- Weekly challenges `!weekly`\n- *Koldrak\'s Lair*  time: `!koldrak`\n- Marketplace `!market "item name"`\n- Current Event `!event` or `!event tomorrow`\n\n**Miscellaneous**\n- Pick: `!pick "item a" or "item b"`\n- Roll dice: `!roll` or `!roll (start number)-(end number)` example: `!roll 4-7`\n- Commands list: `!soyun help`\n- Bot and API status `!soyun status`\n- Try Me! `!soyun`';

				soyunQuerry = soyunQuerry.splice(1);

				switch(soyunQuerry[0]){
					case 'help':
						if(message.channel.name == config.DEFAULT_ADMIN_CHANNEL){
							soyunHelpTxt = soyunHelpTxt + '\n\n**Admin**\n- Announcement: `!say "title" "content"`';
						};

						message.channel.send("Here is some stuff you can ask me to do:\n\n"+soyunHelpTxt+"\n\nIf you need some assistance you can **@mention** or **DM** available **officers**.\n\n```Note: Items data list updated @ Wednesday 12AM UTC \n\t  Market data updated every 1 hour```");
						// Console logging
						console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+message+" triggered");
					break;

					case 'activity':	
						try{
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
						}catch(error){
							console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Warning: Unable to change bot activity, "+error);	
							clientDiscord.emit("message", "!err |"+error.stack+"|");
						}
					break;

					case 'status':
						const m = await message.channel.send("Checking...");
						var dateNow = Date.now();
							dateNow = dateNow.toISOString();

						// statuspage stuff
						var discordStatus = await getSiteData(config.API_ADDRESS[3].address);
						var twitterStatus = await getSiteData(config.API_ADDRESS[4].address);
						var marketData = await getFileData("./data/list-market-data.json");	
						var soyunPackageData = await getFileData("./package.json");
						     
						  
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
										"name": "Market Data",
										"value": "**Last Update**: "+dateformat(marketData[0].updateTime, "UTC:ddd dd-mm-yy @ hh:mm:ss")+" UTC\n**Data Updated**: "+marketData[0].dataUpdated+"\n**Data Age**: "+marketData[0].dataAge+"\n**Data Count**: "+marketData[0].dataCount
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
									},
									{
										"name": "About",
										"value": "- Bot maintaned and developed by **[ln2r](https://ln2r.web.id/)** using **[discord.js](https://discord.js.org/)** node.js module. \n- Market and player data fetched using **[Silveress BnS API](https://bns.silveress.ie/)**. \n- Special thanks to **Grumpy Butts** discord server for letting me using their server for field testing."
									}
								]
							}
						});

						// Console logging
						console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+message+" received");
					break;

					default:
						var soyunSay = await getFileData("./data/list-soyundialogue.json");
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

				var queryStatus = false;
				
				try{
					var joinClass = (joinQuerry[3]);
							
					joinClass = joinClass.toLowerCase(); // Converting class value to lower case so input wont be missmatched
					
					// Checking the class input
					for(var i = 0; i < classArr.length; i++){
						// Class input verification (inefficient af)
						if(joinClass == classArr[i]){
							queryStatus = true;
							break;
						};
					};

					// Checking the verification
					if(queryStatus == true){
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
						queryStatus = false;

						var silveressQuerry = silveressNA+joinUsername; // for the querry
						var charaData = await getSiteData(silveressQuerry);

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
						queryStatus = false;
					}
				}catch(err){
					message.channel.send('Im sorry, I cant read that, can you try again?\n\nExample: **!reg "Jinsoyun" "Blade Master"**');
				};

				// Console logging
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Info: "+cmd+" command received");
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
				var queryStatus;
				var i; // for loop, ignore

				classValue = classValue.toLowerCase(); // Converting class value to lower case so input wont be missmatched

				// Removing user current class
				// I know this is stupid way to do it, but it have to do for now
				for(i = 0; i < classArr.length;){
					// Class input verification (inefficient af)
					if(classValue == classArr[i]){
						queryStatus = true;
					};
					message.guild.members.get(message.author.id).removeRole(message.guild.roles.find(x => x.name == classArr[i]));					
					i++
				};

				// Checking the verification
				if(queryStatus == true){
					// Adding new role to user according their command
					message.guild.members.get(message.author.id).addRole(message.guild.roles.find(x => x.name == classValue));

					// Telling the user class has been changed
					message.channel.send("Your class changed to **"+classValue+"**");
					payloadStatus = "received";
					queryStatus = false;
				}else{
					// Telling them whats wrong
					message.channel.send("Im sorry, i cant seems to find the class you wrote. If this seems to be a mistake please **@mention** or **DM** available officers for some assistance");
					queryStatus = false;
				}
				// Console logging
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Info: "+cmd+" command received");
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
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Info: "+cmd+" command received");
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
				}else{
					message.channel.send("You don't have permission to use that command here.");
				};
				// Console logging
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Info: "+cmd+" command received");
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
					
				};	
				// Console logging
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > "+message.author.username+" do "+message);
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
				
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Info: "+cmd+" command received");
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

				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Info: "+cmd+" command received");
			break;

			// Today daily challenge
			case 'daily':
				var rewards = await getFileData("./data/list-challenges-rewards.json");
				var event = await getFileData("./data/data-event.json");
				var quests = await getFileData("./data/list-quest.json");

				var dcDate = new Date();
				// Getting the current date
				var dcDay = dcDate.getUTCDay();

				var dailyQuerry = message.toString().substring(1).split(' ');
					dailyQuerry = dailyQuerry.splice(1);
				var dailyPartyAnnouncement = false;
				var dailyQuests = "";
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
						var questsDailyList = await getQuests("sunday");
						var questsDailyListRewards = rewards[0].rewards;
					break;
					case 1:
						var questsDailyList = await getQuests("monday");
						var questsDailyListRewards = rewards[1].rewards;
					break;
					case 2:
						var questsDailyList = await getQuests("tuesday");
						var questsDailyListRewards = rewards[2].rewards;
					break;
					case 3:
						var questsDailyList = await getQuests("wednesday");
						var questsDailyListRewards = rewards[3].rewards;
					break;
					case 4:
						var questsDailyList = await getQuests("thursday");
						var questsDailyListRewards = rewards[4].rewards;
					break;
					case 5:
						var questsDailyList = await getQuests("friday");
						var questsDailyListRewards = rewards[5].rewards;
					break;
					case 6:
						var questsDailyList = await getQuests("saturday");
						var questsDailyListRewards = rewards[6].rewards;
					break;
				}

				for(var i = 0; i < questsDailyList.length; i++){
					dailyQuests = dailyQuests + ("**"+quests[questsDailyList[i]].location+"** - "+quests[questsDailyList[i]].quest+"\n");
				}
				for(var i = 0; i < questsDailyListRewards.length; i++){
					dailyRewards = dailyRewards + (questsDailyListRewards[i]+"\n");
				}

				if(event.rewards.daily != ""){
					var eventReward = event.rewards.daily + " (Event)";
				}else{
					var eventReward = "";
				}

				dailyRewards = dailyRewards + eventReward;
				
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
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Info: "+cmd+" command received");
			break;

			// Koldrak's lair notification and closest time
			case 'koldrak':
				var koldrakQuerry = message.toString().substring(1).split(' ');
					koldrakQuerry = koldrakQuerry.splice(1);
				var koldrakTime = await getFileData("./data/koldrak-time.json");	
				
				// Cheating the search so it will still put hour even if the smallest time is 24
				var koldrakTimeLeft = 25;

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

						console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Info: "+cmd+" command received");
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

						console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Info: Koldrak's lair access is notified");
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
						console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Info: "+cmd+" command received");
				};
			break;
			
			// for searching and showing character information, can be triggered via !who for character that have the same name with the nickname or use !who "chara name" for specific one
			case 'who':
				try{
					message.channel.startTyping();

					var whoQuerry = message.toString().substring(1).split('"');
						whoQuerry = whoQuerry.splice(1);

					if(whoQuerry[0] == null){
						whoQuerry = [message.member.nickname];
					}				

					var silveressQuerry = silveressNA+whoQuerry[0]; // for the querry
					var charaData = await getSiteData(silveressQuerry);
					var charaClassValue = charaData.playerClass.toLowerCase().replace(" ", "");				
					var skillsetData = await getSkillset(charaClassValue, charaData.activeElement, charaData.characterName)

					var bnstreeProfile = "https://bnstree.com/character/na/"+whoQuerry[0]; // for author url so user can look at more detailed version
						bnstreeProfile = bnstreeProfile.replace(" ","%20"); // replacing the space so discord.js embed wont screaming error
					
					message.channel.stopTyping();

					message.channel.send({
						"embed": {
							"author": {
							"name": charaData.activeElement+" "+charaData.playerClass+" "+charaData.characterName	
							},
							"title": charaData.characterName+" is a Level "+charaData.playerLevel+" HM "+charaData.playerLevelHM+" "+charaData.activeElement+" "+charaData.playerClass+" from "+setDataValue(charaData.guild)+"\n ",
							"url": bnstreeProfile,
							"fields": [
							{
								"name": "Basic Stats",
								"value": "HP: "+charaData.hp+"\nAttack Power: "+charaData.ap+"\nHongmoon Points Allocation (Atk - Def): "+charaData.HMAttackPoint+" - "+charaData.HMDefencePoint
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
								"value": setDataValue(charaData.weaponName)+"\n\n ",
							},
							{
								"name": "Gems",
								"value": setDataValue(charaData.gem1)+"\n"+setDataValue(charaData.gem2)+"\n"+setDataValue(charaData.gem3)+"\n"+setDataValue(charaData.gem4)+"\n"+setDataValue(charaData.gem5)+"\n"+setDataValue(charaData.gem6)+"\n",
							},
							{
								"name": "Equipments",
								"value": "Ring: "+setDataValue(charaData.ringName)+"\nEarring: "+setDataValue(charaData.earringName)+"\nNecklace: "+setDataValue(charaData.necklaceName)+"\nBraclet: "+setDataValue(charaData.braceletName)+"\nBelt: "+setDataValue(charaData.beltName)+"\nGloves: "+setDataValue(charaData.gloves)+"\nSoul: "+setDataValue(charaData.soulName)+"\nHeart: "+setDataValue(charaData.soulName2)+"\nAura Pet: "+setDataValue(charaData.petAuraName)+"\nSoul Badge: "+setDataValue(charaData.soulBadgeName)+"\nMystic Badge: "+setDataValue(charaData.mysticBadgeName), 
							},
							{
								"name": "Soulshield",
								"value": setDataValue(charaData.soulshield1)+"\n"+setDataValue(charaData.soulshield2)+"\n"+setDataValue(charaData.soulshield3)+"\n"+setDataValue(charaData.soulshield4)+"\n"+setDataValue(charaData.soulshield5)+"\n"+setDataValue(charaData.soulshield6)+"\n"+setDataValue(charaData.soulshield7)+"\n"+setDataValue(charaData.soulshield8), 
							},
							{
								"name": "Trainable Skills (Skill Name: Type)",
								"value": skillsetData

							},
							{
								"name": "Arena Stats",
								"value": "Games (Play - Win - Lose): "+charaData.tournamentTotalGames+" - "+charaData.tournamentTotalWins+" - "+(charaData.tournamentTotalGames-charaData.tournamentTotalWins)+" ("+getWinRate(charaData.tournamentTotalGames, charaData.tournamentTotalWins)+" win rate)\nSolo Wins: "+charaData.tournamentSoloWins+" ("+setCharacterPlacement(charaData.tournamentSoloTier)+")\nTag Team Wins: "+charaData.tournamentTagWins+" ("+setCharacterPlacement(charaData.tournamentTagTier)+")"
							},
							{
								"name": "Miscellaneous",
								"value": "Server: "+setDataValue(charaData.server)+"\nFaction: "+setDataValue(charaData.faction)+" ("+setDataValue(charaData.factionRank)+")\nBnS Tools Whale Score (PvE - PvP): "+setDataValue(charaData.bnsToolsPvEScore)+" - "+setDataValue(charaData.bnsToolsPvPScore),
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
					});	
				}catch(error){
					message.channel.stopTyping();
					message.channel.send("I can't find the character you are looking for, can you try again?");

					console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Warning: issue occured on "+cmd+", "+error);
					clientDiscord.emit("message", "!err |"+error.stack+"|");
				}				
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Info: "+cmd+" command received");
			break;
			
			// for searching item in market, can be triggered via !market "item name"
			case 'market':
				var marketQuery = message.toString().substring(1).split('"');
					marketQuery = marketQuery.splice(1); // removing the command text
					marketQuery = setTextFormat(marketQuery[0]);

				var marketDataPath = "./data/list-market-data.json";
				var marketData = await getFileData(marketDataPath);	
				var marketDataValue = "";

				// item exception
				if(marketQuery == "Soulstone"){
					var marketItemIndex = [1, 2, 1926];
				}else{
					var marketItemIndex = await getDataIndex(marketQuery, marketDataPath);
				};

				var imgSource = "https://cdn.discordapp.com/attachments/426043840714244097/493252746087235585/0ig1OR0.png"; // default image for when data not found

				// getting set item of data
				for(var i = 0; i < marketItemIndex.length; i++){
					if(marketData.length != 0){
						var priceStatus = getPriceStatus(marketData[marketItemIndex[i]].priceEachOld, marketData[marketItemIndex[i]].priceEach);

						marketDataValue = marketDataValue + ("**"+marketData[marketItemIndex[i]].name+"** `"+marketData[marketItemIndex[i]].id+"`\n- Each: "+setCurrencyFormat(marketData[marketItemIndex[i]].priceEach)+" `"+priceStatus[0]+" "+priceStatus[1]+"`\n- Lowest: "+setCurrencyFormat(marketData[marketItemIndex[i]].priceTotal)+" for "+marketData[marketItemIndex[i]].quantity+"\n");

						fetchTime = marketData[0].updateTime;
						imgSource = marketData[marketItemIndex[0]].img;
					}
				}

				if(marketDataValue == "" || marketDataValue == null){
					marketDataValue = "*No result on **"+marketQuery+"**\nThe item is either untradable, not in marketplace or maybe it doesn't exist*"
				}

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
						"description": marketDataValue + "\n`*Data updated every hour`",
						"color": 16766720,
						"footer": {
							"icon_url": "https://slate.silveress.ie/images/logo.png",
							"text": "Powered by Silveress's BnS API - Retrieved at "+dateformat(fetchTime, "UTC:dd-mm-yy @ hh:MM")+" UTC"
						},
						"thumbnail": {
							"url": imgSource
						},
					}	
				});

				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Info: "+cmd+" command received");
			break;

			// for getting the current event information
			case 'event':
				var event = await getFileData("./data/data-event.json");

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
														"name": dateformat(currentDate, "UTC:dddd")+" Quests/Dungeons List (Location - Quest `Type`)",
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
										"name": dateformat(currentDate, "UTC:dddd")+" Quests/Dungeons List (Location - Quest `Type`)",
										"value": eventQuests 								
									}
								]
							}	
						})
					break;
				};
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Info: "+cmd+" command received");	
			break;

			case 'weekly':
				var rewards = await getFileData("./data/list-challenges-rewards.json");
				var quests = await getFileData("./data/list-quest.json");

				var weeklyQuery = message.toString().substring(1).split(' ');
					weeklyQuery = weeklyQuery.splice(1);
				var weeklyIdxList = await getWeeklyQuests();
				var weeklyQuests = "";
				var weeklyRewards = [];
				
				for(var i = 0; i < weeklyIdxList.length; i++){
					weeklyQuests = weeklyQuests + ("**"+quests[weeklyIdxList[i]].location+"** - "+quests[weeklyIdxList[i]].quest+"\n");				
				}
				for(var i = 0; i < rewards[7].rewards.length; i++){
					weeklyRewards = weeklyRewards + (rewards[7].rewards[i]+"\n");
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
														"name": "Quests/Dungeons List (Location - Quest)",
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
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Info: "+cmd+" command received");
			break;
			
			// data gathering start from here
			case 'getupdate':				
				var classData = await getFileData("./data/list-classdata-source.json");
				var errCount = 0;
				var errLocation = [];
				var errMsg = "";

				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Starting data update..");
				
				// item data
				fs.writeFile('./data/list-item.json', JSON.stringify(await getSiteData(silveressItem), null, '\t'), function (err) {
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
					fs.writeFile('./data/class/'+classData[i].name+'/attributes.json', JSON.stringify(await getSiteData(classData[i].attributes), null, '\t'), function (err) {
						if(err){
							console.log(err);
							errCount++;
							errLocation[errCount] = classData[i].name + " attributes data"
							errMsg = errMsg + (err + "\n");
						}
					})

					await delay(500);

					var classAttributeData = await getFileData('./data/class/'+classData[i].name+'/attributes.json');
					// getting class attribute value
					for(var j = 0; j < classAttributeData.records.length; j++){
						var classAttributeValue = classAttributeData.records[j].attribute;
						//console.log("current attribute @ "+classData[i].name+": "+classAttributeValue);

						// getting and writing class skillset depending on its attribute
						fs.writeFile('./data/class/'+classData[i].name+'/'+classAttributeValue+'.json', JSON.stringify(await getSiteData(classData[i].skillsets[j]), null, '\t'), function (err) {
							if(err){
								console.log(err);
								errCount++;
								errLocation[errCount] = classData[i].name + classAttributeValue + " skillset data"
								errMsg = errMsg + (err + "\n");
							}
						})
					}				
				}
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Info: Item and class data updated with "+errCount+" problem(s)");

				if(errCount != 0){
					console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Warning: Problem occured on: "+errLocation+", please check the log");
					message.guild.channels.find(x => x.name == "errors").send("Caught an issue on `"+errLocation+"`\n```"+errMsg+"```");
				}
				
				if(message.channel.name == "high-council"){
					message.channel.send("Data updated manually with "+errCount+" issue(s)");
				}
			break;

			// Fetching the market data
			case 'getmarketdata':
				var marketQuery = message.toString().substring(1).split(" ");
					marketQuery = marketQuery.splice(1);

				var itemData = await getFileData("./data/list-item.json"); //item data
				var marketDataStored = await getFileData("./data/list-market-data.json"); //stored market data
				var marketDataCurrent = await getSiteData(config.API_ADDRESS[1].address); //fecthing the current data (one listing, lowest)

				var marketListCurrent = [];
				var storedPriceEach = 0;	

				var idx = 1;
				var found = false;
				var foundCount = 0;
				var k = 1;
				
				// merging the data (item data and market data)
				for(var i = 0; i < itemData.length; i++){
					for(var j = 1; j < marketDataCurrent.length; j++){
						if(itemData[i].id == marketDataCurrent[j].id){
							// getting and storing the old price for comparison
							while(k < marketDataStored.length && found == false){
								if(marketDataCurrent[j].id == marketDataStored[k].id){
									storedPriceEach = marketDataStored[k].priceEach;
									found = true;
									foundCount++;
								}else{
									storedPriceEach = marketDataCurrent[j].priceEach;
								}
								k++;
							}
							found = false;	

							// storing data into array for saving later
							marketListCurrent[idx] = 
								{
									"id": itemData[i].id,
									"updated": marketDataCurrent[j].ISO,
									"firstAdded": itemData[i].firstAdded,
									"name": itemData[i].name,
									"img": itemData[i].img,
									"totalListings": marketDataCurrent[j].totalListings,
									"priceEachOld": storedPriceEach,
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
					"updateTime": updateDate,
					"dataAge": marketDataCurrent[1].ISO,
					"dataUpdated": foundCount,
					"dataCount": marketListCurrent.length - 1
				}

				// checking if archive directory exist or not
				if(config.ARCHIVING == true){
					if(!fs.existsSync('./archive')){
						console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Warning: archive directory not found, creating the directory now...");
						fs.mkdirSync('./archive', function (err) {
							if(err){
								console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Warning: Unable to make archive directory, please manually make one to avoid errors, "+err);
								clientDiscord.emit("message", "!err |"+err.stack+"|");
							}
						});
					}	
				}				

				// writing the data into a file
				fs.writeFile('./data/list-market-data.json', JSON.stringify(marketListCurrent, null, '\t'), function (err) {
					if(err){
						console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Warning: There's an issue when updating 'list-market-data.json', "+err);
						clientDiscord.emit("message", "!err |"+err.stack+"|");
					}
				})

				// making a copy for archive
				fs.writeFile('./archive/market-data-archive '+Date.now()+'.json', JSON.stringify(marketListCurrent, null, '\t'), function (err) {
					if(err){
						console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Warning: There's an issue when archiving 'list-market-data.json', "+err);
						clientDiscord.emit("message", "!err |"+err.stack+"|");
					}
				});
				
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Info: "+foundCount+" market data updated, "+(marketListCurrent.length - 1)+" data archived");
				foundCount = 0;
			break;

			// For testing the next event data
			case 'eventnext':
				var eventNext = await getFileData("./data/data-event-next.json");

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
								"name": "Today Quests/Dungeons List (Location - Quest `Type`)",
								"value": eventQuests 								
							}
						]
					}	
				});
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Info: "+cmd+" command received");			
			break;

			// For error notification so I know when something went wrong
			case 'err':
				var errQuery = message.toString().substring(1).split('|');
					errQuery = errQuery.splice(1);
					try{
						clientDiscord.guilds.map((guild) => {
							let found = 0;
							guild.channels.map((ch) =>{
								if(found == 0){
									if(ch.name == "errors"){
										ch.send("Caught an issue within the code\n```"+errQuery[0]+"```").catch(console.error);
										found = 1;
									}
								}
							});
						});
					}catch(error){
						console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Warning: Unable to notify the errors, please check the log");	
					}	
			break;
		 };
     };
});

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
		console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Info: Tweet received, status: "+payloadStatus);
		payloadStatus = "rejected";
	});
  
	stream.on('error', function(error) {
		console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy hh:MM:ss")+" ] > Unable to get Twitter data, "+error);
		clientDiscord.emit("message", "!err |"+error.stack+"|");
	});
})


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

// market data update
ontime({
	cycle: [ '00:00' ],
	utc: true
}, function (marketUpdate) {
    clientDiscord.emit("message", "!getmarketdata");
    marketUpdate.done();
    return
})