const Discord = require("discord.js");
const Twitter = require("twitter");
const ontime = require("ontime");
const fetch = require('node-fetch');
const fs = require('fs');
const dateformat = require('dateformat');
const delay = require('delay');
const https = require('https');
const fuzz = require('fuzzball');

const secret = require("./secret.json");
const config = require("./config.json");

const clientDiscord = new Discord.Client();
const clientTwitter = new Twitter({
	consumer_key: secret.TWITTER_CONSUMER_KEY,
	consumer_secret: secret.TWITTER_CONSUMER_SECRET,
	access_token_key: secret.TWITTER_ACCESS_TOKEN_KEY,
	access_token_secret: secret.TWITTER_ACCESS_TOKEN_SECRET
})

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

	var quests = await getFileData("./data/list-quests.json");
	
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
		console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Warning: Unable to handle fetched data using setDataValue, "+error);
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
		console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Warning: Unable to fetch data using getSiteData, "+error);
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
	var quests = await getFileData("./data/list-quests.json");

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
						charaTrainableSkills = charaTrainableSkills + (charaSkillsetData[charaTrainableList[j].idx].variations[k].name+": "+charaSkillsetData[charaTrainableList[j].idx].variations[k].training_icon_desc.replace(/<[^>]+>/g, "")+" (Move ")+charaSkillsetData[charaTrainableList[j].idx].variations[k].variation_no+(")\n")
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
	var configData = await getFileData("./config.json");

	var apiStatus = [];
	var apiAdress = configData.API_ADDRESS;

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
		console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Warning: Unable to fetch data using getFileData, "+error);
		clientDiscord.emit("message", "!err |"+error.stack+"|")
	};

	return content;
}

// Getting the location of searched query data in array
async function getDataIndex(query, dataPath){
	var data = await getFileData(dataPath);	
	var dataIndex = [];
	var itemFuzzRatioSimple = 0;
	var itemFuzzRatioSimpleMatch = 0;
	var i = 0;

	while(i < data.length){
		// data searching using fuzzball package
		//
		// checking if there's exact match with the query
		// if there's one just check the ratio, if not only do ratio check
		if(fuzz.token_set_ratio(query, data[i].name) == 100){
			if(fuzz.ratio(query, data[i].name) >= itemFuzzRatioSimpleMatch){
				itemFuzzRatioSimpleMatch = fuzz.ratio(query, data[i].name);
				dataIndex[0] = i;
			}
		}else{
			if(fuzz.ratio(query, data[i].name) >= itemFuzzRatioSimple){
				itemFuzzRatioSimple = fuzz.ratio(query, data[i].name);
				dataIndex[0] = i;
			}
		}
		i++
	}
	return dataIndex;
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

// getting the active element damage
async function getElementalDamage(activeElement, characterData){
	var charaData = characterData;
	var activeElement = activeElement.toLowerCase();

	switch(activeElement){
		case 'flame':
			var elementalDamage = charaData.flame + (" ("+(charaData.flameRate*100).toFixed(2)+"%)");
		break;
		case 'frost':
			var elementalDamage = charaData.frost + (" ("+(charaData.frostRate*100).toFixed(2)+"%)");
		break;
		case 'wind':
			var elementalDamage = charaData.wind + (" ("+(charaData.windRate*100).toFixed(2)+"%)");
		break;
		case 'earth':
			var elementalDamage = charaData.earth + (" ("+(charaData.earthRate*100).toFixed(2)+"%)");
		break;
		case 'lightning':
			var elementalDamage = charaData.lightning + (" ("+(charaData.lightningRate*100).toFixed(2)+"%)");
		break;
		case 'shadow':
			var elementalDamage = charaData.shadow + (" ("+(charaData.shadowRate*100).toFixed(2)+"%)");
		break;
		default:
			var elementalDamage = "No data available";
		break;
	}

	return elementalDamage;
}

// getting user input
function getUserInput(text){
    var text = text.toString().split(" ");
		text = text.splice(1);

    var userInput = "";

    if(text.length > 1){
        for(var i = 0; i < text.length; i++){
            userInput = userInput +" "+ text[i];
        }
        userInput = userInput.trim();
    }else{
        userInput = text[0];
    }
	
	if(userInput == "" || userInput == null){
		return userInput;
	}else{
		return userInput.replace(/(^|\s)\S/g, l => l.toUpperCase());
	}
	
}

// getting the guild configuration index in configuration database, param: id (guild snowflake id)
async function getGuildConfig(id){
	var guildConfig = await getFileData('./data/guilds.json');
	var idx;

	for(var i=0; i < guildConfig.length; i++){
		if(guildConfig[i].GUILD_ID == id){
			idx = i;
		}
	}
	return idx;
}

// writing data into a file, param: path (file path), data (the file data)
function setFileData(path, data){
	fs.writeFile(path, JSON.stringify(data, null, '\t'), function (err) {
		if(err){
			console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Warning: There's an issue when updating '"+path+"', "+err);
			clientDiscord.emit("message", "!err |"+err.stack+"|");
		}
	})
}

// getting the connected guilds name and member count
function getGuildName(item, index) {
	var guildName = " "+item.name+" ("+item.memberCount+")";
	return guildName;
}

// Discord stuff start here

// Bot token here
clientDiscord.login(secret.DISCORD_APP_TOKEN).catch(error => {
	console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Warning: Unable to start the bot, "+error);
});

// Starting up the bot
clientDiscord.on("ready", async () => {
	var configData = await getFileData("./config.json");
	var fileData = await getFileData("./data/data-files.json");
	
	var apiStatus = await getAPIStatus();
	var apiAdress = configData.API_ADDRESS;
	var packageFile = await getFileData("package.json");

	// statuspage stuff
	var discordStatus = await getSiteData(configData.API_ADDRESS[3].address); 
	var twitterStatus = await getSiteData(configData.API_ADDRESS[4].address);

	clientDiscord.user.setUsername("Jinsoyun");

	if(configData.MAINTENANCE_MODE == false){
		clientDiscord.user.setPresence({ game: { name: 'with Hongmoon School' }, status: 'online' })
		.catch(console.error);
	}else{
		clientDiscord.user.setPresence({ game: { name: 'MAINTENANCE MODE [!]' }, status: 'dnd' })
		.catch(console.error);
		console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Warning: Maintenance mode is enabled");
	}	
	
	console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > "+packageFile.name+" ver."+packageFile.version+" started");
	if(configData.ARCHIVING == false){
		console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Warning: Archiving system is disabled");
	}
	console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Discord service: "+discordStatus.status.description);
	console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Twitter service: "+twitterStatus.status.description);

	for(var i = 0; i < 2; i++){
		console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > "+apiAdress[i].name+" service: "+apiStatus[i]);
	}

	console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Market data last update: "+fileData.MARKET_DATA);
	console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Item data last update: "+fileData.ITEM_DATA);
	console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Class data last update: "+fileData.CLASS_DATA);
	console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Event data last update: "+fileData.EVENT_DATA);

	console.log("");
});

// bot joined the guild
clientDiscord.on("guildCreate", async (guild) => {
	var defaultConfig = await getFileData('config.json');
	var guildConfig = await getFileData('./data/guilds.json');
	var found = false;
	
	for(var i = 0; i < guildConfig.length; i ++){
		if(guild.id == guildConfig[i].GUILD_ID){
			found = true;
		}
	}

	if(found == false){
		var configData = {
			"GUILD_NAME": guild.name,
			"GUILD_ID": guild.id,
			"GUILD_ICON": guild.iconURL,
			"SETUP_STATUS": false,
			"PREFIX": defaultConfig.DEFAULT_PREFIX,
			"CHANNEL_DAILY_ANNOUNCE": "disable",
			"CHANNEL_WEEKLY_ANNOUNCE": "disable",
			"CHANNEL_EVENT_ANNOUNCE": "disable",
			"CHANNEL_NEWS_ANNOUNCE": "disable",
			"CHANNEL_KOLDRAK_ANNOUNCE": "disable",
			"CHANNEL_TEXT_MAIN": "disable",
			"CHANNEL_MEMBER_GATE": "disable",
			"CHANNEL_ADMIN": "disable",
			"CHANNEL_MEMBERACTIVITY": "disable",	
		}
		
		guildConfig.push(configData);

		setFileData('./data/guilds.json', guildConfig);

		guild.members.find(x => x.id == guild.ownerID).send("Thank you for adding me to the server, default server configuration data has been added. To setup necessary channel do `"+defaultConfig.DEFAULT_PREFIX+"setup`, to see what can be configure use `"+defaultConfig.DEFAULT_PREFIX+"debug config`");
;
		console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: Jinsoyun joined "+guild.name+", config data has been set to default");
	}		
});

// User joined the guild
clientDiscord.on("guildMemberAdd", async (member) => {
	var guildConfig = await getFileData("./data/guilds.json");
	var guildConfigIdx = await getGuildConfig(member.guild.id);

	// Welcoming message and guide to join
	// and checking if it's disabled or not
	if(guildConfig[guildConfigIdx].CHANNEL_MEMBER_GATE != "disable"){
		// Add 'cricket' role so new member so they cant access anything until they do !join for organizing reason
		member.addRole(member.guild.roles.find(x => x.name == "cricket"));
	
		member.guild.channels.find(x => x.name == guildConfig[guildConfigIdx].CHANNEL_MEMBER_GATE).send('Hi <@'+member.user.id+'>, welcome to ***'+member.guild.name+'***!\n\nTheres one thing you need to do before you can talk with others, can you tell me your in-game nickname and your class? to do that please write ***!reg "username here" "your class here"***, here is an example how to do so: ***!reg "Jinsoyun" "Blade Master"***, thank you! ^^ \n\nIf you need some assistance you can **@mention** or **DM** available officers');

		// Console logging
		console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > "+member.user.username+" has joined");
		console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > "+member.user.username+" role is changed to 'cricket' until "+member.user.username+" do !reg");
	}	
});

// User left the guild (kicked or just left)
clientDiscord.on("guildMemberRemove", async (member) => {
	var configData = await getFileData("./config.json");
	var silveressNA = configData.API_ADDRESS[0].address;

	var silveressQuerry = silveressNA+member.displayName; // for the querry
	var charaData = await getSiteData(silveressQuerry);

	var guildConfig = await getFileData("./data/guilds.json");
	var guildConfigIdx = await getGuildConfig(member.guild.id);

	if(guildConfig[guildConfigIdx].CHANNEL_MEMBERACTIVITY != "disable"){
		try{
			member.guild.channels.find(x => x.name == guildConfig[guildConfigIdx].CHANNEL_MEMBERACTIVITY).send({
				"embed":{
					"color": 15605837,
					"author":{
						"name": member.nickname+" ("+member.displayName+")",
					},
					"description": charaData.activeElement+" "+charaData.playerClass+" `Level "+charaData.playerLevel+" HM "+charaData.playerLevelHM+"`",
					"footer": {
						"text": "Left - Captured at "+dateformat(Date.now(), "UTC:dd-mm-yy @ HH:MM")+" UTC"
					}
				}
			});
		}catch(error){
			console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Warning: There's issue when recording server's member activity, "+error);
			clientDiscord.emit("message", "!err |"+error.stack+"|");
		}
	}
});

clientDiscord.on("guildMemberUpdate", async (oldMember, newMember) => {
	var guildConfig = await getFileData("./data/guilds.json");
	var guildConfigIdx = await getGuildConfig(oldMember.guild.id);

	if(guildConfig[guildConfigIdx].CHANNEL_MEMBERACTIVITY != "disable"){
		try{
			oldMember.guild.channels.find(x => x.name == guildConfig[guildConfigIdx].CHANNEL_MEMBERACTIVITY).send({
				"embed":{
					"color": 16574595,
					"author":{
						"name": newMember.displayName,
					},
					"description": "User info changed (check audit log for details)",
					"footer": {
						"text": "Edit - Captured at "+dateformat(Date.now(), "UTC:dd-mm-yy @ HH:MM")+" UTC"
					}
				}
			});
		}catch(error){
			console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Warning: There's issue when recording server's member activity, "+error);
			clientDiscord.emit("message", "!err |"+error.stack+"|");
		}
	}	
});

// User commands
clientDiscord.on("message", async (message) => {
	var guildConfig = await getFileData('./data/guilds.json');
	//var guildConfigIdx = await getGuildConfig(message.guild.id);

	if(message.author == null){
		var guildConfigIdx = await getGuildConfig("426036695931158539");
	}else{
		var guildConfigIdx = await getGuildConfig(message.guild.id);
	}
	var guildPrefix = guildConfig[guildConfigIdx].PREFIX;
	
  	if (message.toString().substring(0, 1) == guildPrefix) {
		//var args = message.toString().substring(1).split(' ');
		var	args = message.toString();
			args = args.substring(1).split(' ');
		var cmd = args[0];
			cmd = cmd.toLowerCase();

        args = args.splice(1);
        switch(cmd) {
			// Connection test
			case 'soyun':
				var configData = await getFileData("./config.json");

				var soyunQuerry = message.toString().substring(1).split(' ');
				var soyunHelpTxt = '**Account**\n- Nickname: `'+guildPrefix+'username desired nickname`\n- Class: `'+guildPrefix+'class desired class`\n\n**Blade & Soul**\n- Character Search: `'+guildPrefix+'who` or `'+guildPrefix+'who character name`\n- Daily challenges `'+guildPrefix+'daily` or `'+guildPrefix+'daily tomorrow`\n- Weekly challenges `'+guildPrefix+'weekly`\n- *Koldrak\'s Lair*  time: `'+guildPrefix+'koldrak`\n- Marketplace `'+guildPrefix+'market item name`\n- Current Event `'+guildPrefix+'event` or `'+guildPrefix+'event tomorrow`\n\n**Miscellaneous**\n- Pick: `'+guildPrefix+'pick "item a" or "item b"`\n- Roll dice: `'+guildPrefix+'roll` or `'+guildPrefix+'roll (start number)-(end number)` example: `'+guildPrefix+'roll 4-7`\n- Commands list: `'+guildPrefix+'soyun help`\n- Bot and API status `'+guildPrefix+'soyun status`\n- Try Me! `'+guildPrefix+'soyun`';

				soyunQuerry = soyunQuerry.splice(1);

				switch(soyunQuerry[0]){
					case 'help':
						if(message.channel.name == guildConfig[guildConfigIdx].CHANNEL_ADMIN){
							soyunHelpTxt = soyunHelpTxt + '\n\n**Admin**\n- Announcement: `'+guildPrefix+'say "title" "content"`\n- Bot Settings: `'+guildPrefix+'set`';
						};

						message.channel.send("Here is some stuff you can ask me to do:\n\n"+soyunHelpTxt+"\n\nIf you need some assistance you can **@mention** or **DM** available **officers**.\n\n```Note: Items data list updated @ Wednesday 12AM UTC \n\t  Market data updated every 1 hour```");
						// Console logging
						console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > "+message+" triggered");
					break;

					case 'activity':	
						try{
							if(configData.MAINTENANCE_MODE == false){
								switch(statusRandom){
									case 0:
										clientDiscord.user.setActivity(guildPrefix+'soyun help', {type: 'LISTENING' });
										statusRandom = 1;
									break;
									
									case 1:
										clientDiscord.user.setActivity('with Hongmoon School', {type: 'PLAYING'});
										statusRandom = 0;
									break;
								}
							}
						}catch(error){
							console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Warning: Unable to change bot activity, "+error);	
							clientDiscord.emit("message", "!err |"+error.stack+"|");
						}
					break;

					case 'status':
						const m = await message.channel.send("Checking...");
						/*
						var dateNow = Date.now();
							dateNow = dateNow.toISOString();
						*/

						// statuspage stuff
						var discordStatus = await getSiteData(configData.API_ADDRESS[3].address);
						var twitterStatus = await getSiteData(configData.API_ADDRESS[4].address);
						var marketData = await getFileData("./data/list-market-data.json");	
						var soyunPackageData = await getFileData("./package.json");
						     
						  
						var apiStatus = [];
						var apiStatusList = [];
						var apiAdress = configData.API_ADDRESS;
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
									"text": "Created and maintained by ln2r - Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ HH:MM")+" UTC"
								},
								"fields":[
									{
										"name": "Jinsoyun `Bot`",
										"value": "**Server Latency**: "+msgLatency+"\n**API Latency**: "+apiLatency+"\n**Version**: "+soyunPackageData.version
									},
									{
										"name": "Market Data",
										"value": "**Last Update**: "+dateformat(marketData[0].updateTime, "UTC:ddd dd-mm-yy @ HH:MM:ss")+" UTC\n**Data Updated**: "+marketData[0].dataUpdated+"\n**Data Count**: "+marketData[0].dataCount
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
										"name": "About and Special Mentions",
										"value": "- Bot maintaned and developed by **[ln2r](https://ln2r.web.id/)**\n- **Grumpy Butts** discord server for field testing and database maintenance."
									},
									{
										"name": "Built With Help of ❤",
										"value": "- [discord.js](https://discord.js.org/)\n- [Silveress BnS API](https://bns.silveress.ie/)\n- [twitter](https://developer.twitter.com/en/docs.html)\n- [ontime](https://www.npmjs.com/package/ontime)\n- [node-fetch](https://www.npmjs.com/package/node-fetch)\n- [dateformat](https://www.npmjs.com/package/dateformat)\n- [delay](https://www.npmjs.com/package/delay)\n- [fuzzball](https://www.npmjs.com/package/fuzzball)"
									}
								]
							}
						});

						// Console logging
						console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > "+message+" received");
					break;

					default:
						var soyunSay = await getFileData("./data/list-soyundialogue.json");
						var soyunDialogueRNG = Math.floor(Math.random() * soyunSay.text.length) - 0;

						message.channel.send(soyunSay.text[soyunDialogueRNG]);

						// Console logging
						console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > "+message+" received");
					break;	
				};
            break;
			
			// Server join = username change and role add
			case 'reg':
				var joinQuerry = message.toString().substring(1).split('"');
				var joinUsername = (joinQuerry[1]);

				var configData = await getFileData("./config.json");
				var silveressNA = configData.API_ADDRESS[0].address;

				var classList = await getFileData("./data/class/list-class.json");

				var queryStatus = false;
				
				try{
					var joinClass = (joinQuerry[3]);
							
					joinClass = joinClass.toLowerCase(); // Converting class value to lower case so input wont be missmatched
					
					// Checking the class input
					for(var i = 0; i < classList.length; i++){
						// Class input verification (inefficient af)
						if(joinClass == classList[i]){
							queryStatus = true;
							break;
						};
					};

					// Checking the verification
					if(queryStatus == true){
						// Convert to capitalize to make it easy and 'prettier'
						joinUsername = joinUsername.replace(/(^|\s)\S/g, l => l.toUpperCase());
						// #Collection.find(x => x.name === "name")
						// Setting user role to match the user class
						message.guild.members.get(message.author.id).addRole(message.guild.roles.find(x => x.name == joinClass));
						// Adding "member" role so user can talk
						message.guild.members.get(message.author.id).addRole(message.guild.roles.find(x => x.name == "member"));
						// Removing "cricket" role
						message.guild.members.get(message.author.id).removeRole(message.guild.roles.find(x => x.name == "cricket"));
						
						// Setting message author username (guild owner or lower)
						message.guild.members.get(message.author.id).setNickname(joinUsername);

						// Welcoming message on general channel
						message.guild.channels.find(x => x.name == guildConfig[guildConfigIdx].CHANNEL_TEXT_MAIN).send("Please welcome our new "+joinClass+" ***"+joinUsername+"***!");
						payloadStatus = "received";
						queryStatus = false;

						var silveressQuerry = silveressNA+joinUsername; // for the querry
						var charaData = await getSiteData(silveressQuerry);

						// checking if the member log disabled or not, if it isn't write a log in the channel
						if(guildConfig[guildConfigIdx].CHANNEL_MEMBERACTIVITY != "disable"){
							try{
								message.guild.channels.find(x => x.name == guildConfig[guildConfigIdx].CHANNEL_MEMBERACTIVITY).send({
									"embed":{
										"color": 1879160,
										"author":{
											"name": message.author.username+" ("+joinUsername+")",
										},
										"description": charaData.activeElement+" "+charaData.playerClass+" `Level "+charaData.playerLevel+" HM "+charaData.playerLevelHM+"`",
										"footer": {
											"text": "Joined - Captured at "+dateformat(Date.now(), "UTC:dd-mm-yy @ HH:MM")+" UTC"
										}
									}
								});
							}catch(error){
								console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Warning: There's issue when recording server's member activity, "+error);
								clientDiscord.emit("message", "!err |"+error.stack+"|");
							}
						}
					}else{
						// Telling them whats wrong
						message.channel.send("Im sorry, I cant find the class you wrote. If this seems to be a mistake please **@mention** or **DM** available officers for some assistance");
						queryStatus = false;
					}
				}catch(err){
					message.channel.send('Im sorry, I cant read that, can you try again?\n\nExample: **!reg "Jinsoyun" "Blade Master"**');
				};

				// Console logging
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: "+cmd+" command received");
			break;
			
			// Username change
			case 'username':
				var usernameQuerry = getUserInput(message);

				// Changing message author username
				message.guild.members.get(message.author.id).setNickname(usernameQuerry);
				message.channel.send("Your username changed to "+usernameQuerry);

				// Console logging
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: username change command received");
			break;
			
			// Class change
			case 'class':
				var classQuerry = getUserInput(message);
					classQuerry = classQuerry.toLowerCase(); // Converting class value to lower case so input wont be missmatched

				var classList = await getFileData("./data/class/list-class.json");	

				var queryStatus;				

				// Removing user current class
				// I know this is stupid way to do it, but it have to do for now
				for(var i = 0; i < classList.length;){
					// Class input verification (inefficient af)
					if(classQuerry == classList[i]){
						queryStatus = true;
					};
					message.guild.members.get(message.author.id).removeRole(message.guild.roles.find(x => x.name == classList[i]));					
					i++
				};

				// Checking the verification
				if(queryStatus == true){
					// Adding new role to user according their command
					message.guild.members.get(message.author.id).addRole(message.guild.roles.find(x => x.name == classQuerry));

					// Telling the user class has been changed
					message.channel.send("Your class changed to **"+classQuerry+"**");
					payloadStatus = "received";
					queryStatus = false;
				}else{
					// Telling them whats wrong
					message.channel.send("Im sorry, i cant seems to find the class you wrote. If this seems to be a mistake please **@mention** or **DM** available officers for some assistance");
					queryStatus = false;
				}
				// Console logging
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: class change command received");
			break;

			case 'twcon':
				var configData = await getFileData("./config.json");
				var sent = 0;

				// Twitter's tweet output
				clientDiscord.guilds.map((guild) => {
					let found = 0;

					// getting the channel name for the notification
					for(var i = 0;i < guildConfig.length; i++){
						if(guild.id == guildConfig[i].GUILD_ID){								
							if(guildConfig[i].CHANNEL_NEWS_ANNOUNCE != "disable"){
								var channelNewsName = guildConfig[i].CHANNEL_NEWS_ANNOUNCE;
							}							
						}
					}
					guild.channels.map((ch) =>{
						if(found == 0){
							if(ch.name == channelNewsName){
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
								sent++;
							}
						}
					});
				});
				// Console logging
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: "+twtScreenName+"'s tweet sent to "+sent+" server(s)");
			break;
			
			// Writing message via bot for announcement or notice, Admin only
			case 'say':
				var configData = await getFileData("./config.json");

				if(message.channel.name == guildConfig[guildConfigIdx].CHANNEL_ADMIN){
					var sayQuerry = message.toString().substring(1).split('"');

					var sayTitle = (sayQuerry[1]);
						sayTitle = sayTitle.replace(/(^|\s)\S/g, l => l.toUpperCase());

						// Default title
						if(sayTitle == ""){
							sayTitle = "Announcement";
						}

					// Writing the content
					message.guild.channels.find(x => x.name == guildConfig[guildConfigIdx].CHANNEL_NEWS_ANNOUNCE).send({
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
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: "+cmd+" command received");
			break;

			// First time setup (making roles and necesarry channels), Admin only
			case 'setup':
				var configData = await getFileData("./config.json");
				var classList = await getFileData("./data/class/list-class.json");	

				if(guildConfig[guildConfigIdx].SETUP_STATUS == false){
					// Making the roles with class array as reference
					for(i = 0; i < classList.length;){
						message.guild.createRole({
							name: classList[i]
						}).catch(console.error);
						i++;
						// Console logging
						console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > "+classList[i]+" role created");
					};

					// Making "news" channel
					message.guild.createChannel(configData.DEFAULT_NEWS_CHANNEL, "text");
					message.guild.createChannel(configData.DEFAULT_PARTY_CHANNEL, "text");

					// Console logging
					console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > "+configData.DEFAULT_NEWS_CHANNEL+" channel created at "+message.guild.name);
					console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > "+configData.DEFAULT_PARTY_CHANNEL+" channel created at "+message.guild.name);					
				
					// Console logging
					console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > "+message.author.username+" did first time setup, "+message.guild.name+" setup status changed to true");

					guildConfig[guildConfigIdx].SETUP_STATUS = true;
					guildConfig[guildConfigIdx].CHANNEL_TEXT_MAIN = defaultConfig.DEFAULT_TEXT_CHANNEL;
					guildConfig[guildConfigIdx].CHANNEL_MEMBER_GATE = defaultConfig.DEFAULT_MEMBER_GATE;
					guildConfig[guildConfigIdx].CHANNEL_NEWS_ANNOUNCE = defaultConfig.DEFAULT_NEWS_CHANNEL;
					guildConfig[guildConfigIdx].CHANNEL_ADMIN = defaultConfig.DEFAULT_ADMIN_CHANNEL;
					guildConfig[guildConfigIdx].CHANNEL_MEMBERACTIVITY = defaultConfig.DEFAULT_MEMBER_LOG;
					guildConfig[guildConfigIdx].CHANNEL_DAILY_ANNOUNCE = defaultConfig.DEFAULT_PARTY_CHANNEL;
					guildConfig[guildConfigIdx].CHANNEL_WEEKLY_ANNOUNCE = defaultConfig.DEFAULT_PARTY_CHANNEL;
					guildConfig[guildConfigIdx].CHANNEL_EVENT_ANNOUNCE = defaultConfig.DEFAULT_PARTY_CHANNEL;
					guildConfig[guildConfigIdx].CHANNEL_KOLDRAK_ANNOUNCE = defaultConfig.DEFAULT_PARTY_CHANNEL;
					
					

					setFileData('./data/guilds.json', guildConfig);

					message.channel.send("All necessary channel created, all channel setting set to default");
				}else{
					message.channel.send("I'm sorry you can't do that, this server already done first time setup");
				}
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
				
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: "+cmd+" command received");
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

				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: "+cmd+" command received");
			break;

			// Today daily challenge
			case 'daily':
				var rewards = await getFileData("./data/list-challenges-rewards.json");
				var event = await getFileData("./data/data-event.json");
				var quests = await getFileData("./data/list-quests.json");
				var configData = await getFileData("./config.json");

				var dcDate = new Date();
				// Getting the current date
				var dcDay = dcDate.getUTCDay();

				var dailyQuerry = message.toString().substring(1).split(' ');
					dailyQuerry = dailyQuerry.splice(1);
				var dailyPartyAnnouncement = false;
				var dailyQuests = "";
				var dailyRewards = [];

				var sent = 0;
				
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
								"text": "Data maintained by Grumpy Butts - Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ HH:MM")+" UTC"
							},
							"fields":[
								{
									"name": "Quests/Dungeons List (Location - Quest)",
									"value": dailyQuests 								
								}
							]
						}
					});

					console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: "+cmd+" command received");
				}else{
					clientDiscord.guilds.map((guild) => {
						let found = 0;
						// getting the channel name for announcement
						for(var i = 0;i < guildConfig.length; i++){
							if(guild.id == guildConfig[i].GUILD_ID){								
								if(guildConfig[i].CHANNEL_DAILY_ANNOUNCE != "disable"){
									var channelPartyName = guildConfig[i].CHANNEL_DAILY_ANNOUNCE;
								}							
							}
						}
						guild.channels.map((ch) =>{
							if(found == 0){
								if(ch.name == channelPartyName){
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
												"text": "Data maintained by Grumpy Butts - Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ HH:MM")+" UTC"
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
									sent++;
								}
							}
						});
					});
					console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: "+cmd+" notification sent to "+sent+" server(s)");
						
				};
			break;

			// Koldrak's lair notification and closest time
			case 'koldrak':
				var koldrakQuerry = message.toString().substring(1).split(' ');
					koldrakQuerry = koldrakQuerry.splice(1);
				var koldrakTime = await getFileData("./data/koldrak-time.json");
				var configData = await getFileData("./config.json");
				var sent = 0;	
				
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
									"text": "Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ HH:MM")+" UTC"
								}
							}
						})

						console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: "+cmd+" command received");
					break;

					// Doing "Alert" at specific time(s)
					case 'alert':
						// Sending "Alert" to every "party-forming" channel
						clientDiscord.guilds.map((guild) => {
							let found = 0;
							// getting the channel name for announcement
							for(var i = 0;i < guildConfig.length; i++){
								if(guild.id == guildConfig[i].GUILD_ID){								
									if(guildConfig[i].CHANNEL_KOLDRAK_ANNOUNCE != "disable"){
										var channelPartyName = guildConfig[i].CHANNEL_KOLDRAK_ANNOUNCE;
									}							
								}
							}
							guild.channels.map((ch) =>{
								if(found == 0){
									if(ch.name == channelPartyName){
										ch.send({
											"embed":{
												"color": 8388736,
												"description": "**Koldrak's Lair** will be accessible in **10 Minutes**",
												"author":{
													"name": "Epic Challenge Alert",
													
												},
												"footer":{
													"icon_url": "https://cdn.discordapp.com/emojis/463569669584977932.png?v=1",
													"text": "Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ HH:MM")+" UTC"
												}
											}
										});
										found = 1;
										sent++;
									}
								}
							});
						});

						console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: "+cmd+" notification sent to "+sent+" server(s)");
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
						console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: "+cmd+" command received");
				};
			break;
			
			// for searching and showing character information, can be triggered via !who for character that have the same name with the nickname or use !who "chara name" for specific one
			case 'who':
				var configData = await getFileData("./config.json");
				var silveressNA = configData.API_ADDRESS[0].address;

				try{
					message.channel.startTyping();

					var whoQuerry = getUserInput(message);

					if(whoQuerry == null || whoQuerry == ""){
						whoQuerry = [message.member.nickname];
					}				

					var silveressQuerry = silveressNA+whoQuerry; // for the querry
					var charaData = await getSiteData(silveressQuerry);
					var characlassQuerry = charaData.playerClass.toLowerCase().replace(/\s/g, '');				
					var skillsetData = await getSkillset(characlassQuerry, charaData.activeElement, charaData.characterName)
					var elementalDamage = await getElementalDamage(charaData.activeElement, charaData);

					var bnstreeProfile = "https://bnstree.com/character/na/"+whoQuerry; // for author url so user can look at more detailed version
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
								"value": "Elemental Damage: "+elementalDamage+"\nBoss Attack Power: "+charaData.ap_boss+"\nCritical Hit: "+charaData.crit+" ("+(charaData.critRate*100).toFixed(2)+"%)\nCritical Damage: "+charaData.critDamage+" ("+(charaData.critDamageRate*100).toFixed(2)+"%)",
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
								"icon_url": "https://slate.silveress.ie/docs_bns/images/logo.png",
								"text": "Powered by Silveress's BnS API - Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ HH:MM")+" UTC"
							},
							"thumbnail": {
								"url": charaData.characterImg
							}
						}
					});	
				}catch(error){
					message.channel.stopTyping();
					message.channel.send("I can't find the character you are looking for, can you try again?");

					console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Warning: issue occured on "+cmd+", "+error);
					clientDiscord.emit("message", "!err |"+error.stack+"|");
				}				
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: "+cmd+" command received");
			break;
			
			// for searching item in market, can be triggered via !market "item name"
			case 'market':
				var marketQuery = getUserInput(message); // getting the user input

				var marketDataPath = "./data/list-market-data.json";
				var marketData = await getFileData(marketDataPath);	
				var marketDataValue = "";
				var marketDataItemsCount = "";

				// item exception
				if(marketQuery == "Golden Harvest Festival"){
					var marketItemIndex = [1240, 616, 506, 1266, 123, 1909];
				}else{
					var marketItemIndex = await getDataIndex(marketQuery, marketDataPath);
				};

				var imgSource = "https://cdn.discordapp.com/attachments/426043840714244097/493252746087235585/0ig1OR0.png"; // default image for when data not found

				if(marketItemIndex.length > 6){
					var marketDataItems = 6;
					marketDataItemsCount = "**Showing "+marketDataItems+" from "+marketItemIndex.length+" total results**\n";
				}else{
					var marketDataItems = marketItemIndex.length;
				}

				var dataAge = marketData[0].updateTime;

				// getting set item of data
				for(var i = 0; i < marketDataItems; i++){
					if(marketData.length != 0){
						var priceStatus = getPriceStatus(marketData[marketItemIndex[i]].priceEachOld, marketData[marketItemIndex[i]].priceEach);

						marketDataValue = marketDataValue + ("**"+marketData[marketItemIndex[i]].name+"** `"+marketData[marketItemIndex[i]].id+"-"+marketItemIndex[i]+"`\n- Each: "+setCurrencyFormat(marketData[marketItemIndex[i]].priceEach)+" `"+priceStatus[0]+" "+priceStatus[1]+"`\n- Lowest: "+setCurrencyFormat(marketData[marketItemIndex[i]].priceTotal)+" for "+marketData[marketItemIndex[i]].quantity+"\n");

						imgSource = marketData[marketItemIndex[0]].img;
					}
				}

				if(marketDataValue == "" || marketDataValue == null){
					marketDataValue = "*No result on **"+marketQuery+"**\nThe item is either untradable, not in marketplace or maybe it doesn't exist*"
				}

				message.channel.send({
					"embed": {
						"author":{
							"name": "Marketplace - Search result of "+marketQuery,
							"icon_url": "https://cdn.discordapp.com/emojis/464036617531686913.png?v=1"
						},
						"description": marketDataItemsCount+"\n"+marketDataValue,
						"color": 16766720,
						"footer": {
							"icon_url": "https://slate.silveress.ie/docs_bns/images/logo.png",
							"text": "Powered by Silveress's BnS API - Last update: "+dateformat(dataAge, "UTC:dd-mm-yy @ HH:MM")+" UTC"
						},
						"thumbnail": {
							"url": imgSource
						},
					}	
				});

				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: "+cmd+" command received");
			break;

			// for getting the current event information
			case 'event':
				var event = await getFileData("./data/data-event.json");
				var configData = await getFileData("./config.json");

				var eventToDo = event.rewards.sources;
				var eventQuery = message.toString().substring(1).split(' ');
					eventQuery = eventQuery.splice(1);
				var eventQuests = "";
				
				var today = new Date();
				var currentDate = today;
					today = today.getUTCDay();
				var todayEvent = [];
				var k = 0;
				var sent = 0;

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

							// getting the channel name for announcement
							for(var i = 0;i < guildConfig.length; i++){
								if(guild.id == guildConfig[i].GUILD_ID){								
									if(guildConfig[i].CHANNEL_EVENT_ANNOUNCE != "disable"){
										var channelPartyName = guildConfig[i].CHANNEL_EVENT_ANNOUNCE;
									}							
								}
							}
							guild.channels.map((ch) =>{
								if(found == 0){
									if(ch.name == channelPartyName){
										ch.send(event.name+" event is on-going, here\'s the summary",{
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
													"text": "Blade & Soul Event - Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ HH:MM")+" UTC"
												},
												"fields":[
													{
														"name": dateformat(currentDate, "UTC:dddd")+"'s To-do List (Location - Quest `Type`)",
														"value": eventQuests 								
													}
												]
											}
										}).catch(console.error);
										found = 1;
										sent++;
									}
								}
							});
						});

					console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: "+cmd+" notification sent to "+sent+" server(s)");

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
								"description": "**Duration**: "+event.duration+"\n**Redemption Period**: "+event.redeem+"\n**Event Item**: "+setDataFormatting(event.rewards.name)+"\n**Event Currency**: "+setDataFormatting(event.rewards.currency)+"\n**What to do**: "+setDataFormatting(eventToDo),
								"color": 1879160,
								"footer": {
									"icon_url": "https://static.bladeandsoul.com/img/global/nav-bs-logo.png",
									"text": "Blade & Soul Event - Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ HH:MM")+" UTC"
								},
								"fields":[
									{
										"name": dateformat(currentDate, "UTC:dddd")+"'s To-do List (Location - Quest `Type`)",
										"value": eventQuests 								
									}
								]
							}	
						})
						console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: "+cmd+" command received");
					break;
				};	
			break;

			case 'weekly':
				var rewards = await getFileData("./data/list-challenges-rewards.json");
				var quests = await getFileData("./data/list-quests.json");
				var configData = await getFileData("./config.json");

				var weeklyQuery = message.toString().substring(1).split(' ');
					weeklyQuery = weeklyQuery.splice(1);
				var weeklyIdxList = await getWeeklyQuests();
				var weeklyQuests = "";
				var weeklyRewards = [];
				var sent = 0;
				
				for(var i = 0; i < weeklyIdxList.length; i++){
					weeklyQuests = weeklyQuests + ("**"+quests[weeklyIdxList[i]].location+"** - "+quests[weeklyIdxList[i]].quest+"\n");				
				}
				for(var i = 0; i < rewards[7].rewards.length; i++){
					weeklyRewards = weeklyRewards + (rewards[7].rewards[i]+"\n");
				}
				
				switch(weeklyQuery[0]){
					case 'announce':
						clientDiscord.guilds.map((guild) => {
							let found = 0;
							// getting the channel name for announcement
							for(var i = 0;i < guildConfig.length; i++){
								if(guild.id == guildConfig[i].GUILD_ID){								
									if(guildConfig[i].CHANNEL_WEEKLY_ANNOUNCE != "disable"){
										var channelPartyName = guildConfig[i].CHANNEL_WEEKLY_ANNOUNCE;
									}							
								}
							}
							guild.channels.map((ch) =>{
								if(found == 0){
									if(ch.name == channelPartyName){
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
													"text": "Data maintained by Grumpy Butts - Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ HH:MM")+" UTC"
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
										sent++;
									}
								}
							});
						});

						console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: "+cmd+" notification sent to "+sent+" server(s)");
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
									"text": "Data maintained by Grumpy Butts - Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ HH:MM")+" UTC"
								},
								"fields":[
									{
										"name": "Quests/Dungeons List (Location - Quest)",
										"value": weeklyQuests 								
									}
								]
							}
						});
						console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: "+cmd+" command received");
					break;
				}
			break;

			case 'craft':
				var craftingQuery = getUserInput(message);

				var craftingData = await getFileData("./data/list-crafting.json");
				var craftingItemIdx = await getDataIndex(craftingQuery, "./data/list-crafting.json");
				var craftingDataValue = "";
				var craftingMaterialsData = "";

				if(craftingItemIdx.length > 3){
					var craftDataItems = 3;
					marketDataItemsCount = "**Showing "+craftDataItems+" from "+craftingItemIdx.length+" total results**\n";
				}else{
					var craftDataItems = craftingItemIdx.length;
				}

				for(var i=0; i < craftDataItems; i++){
					for(var j=0; j < craftingData[craftingItemIdx[i]].materials.length; j++){
						craftingMaterialsData = craftingMaterialsData + (craftingData[craftingItemIdx[i]].materials[j].name+" x"+craftingData[craftingItemIdx[i]].materials[j].qty+"\n");
					}

					craftingDataValue = craftingDataValue + ("**"+craftingData[craftingItemIdx[i]].name+"** `"+craftingData[craftingItemIdx[i]].id+"-"+craftingItemIdx[i]+"`\n- Source: "+craftingData[craftingItemIdx[i]].source+"\n- Cost: "+setCurrencyFormat(craftingData[craftingItemIdx[i]].cost)+"\n- Duration: "+craftingData[craftingItemIdx[i]].duration+"\n- Materials: \n"+craftingMaterialsData+"\n");

					craftingMaterialsData = "";
				}

				var dataAge = craftingData[0].updated;

				message.channel.send({
					"embed": {
						"author":{
							"name": "Crafting/Upgrade - Search result of "+craftingQuery,
							"icon_url": "https://cdn.discordapp.com/emojis/464036617531686913.png?v=1"
						},
						"description": craftingDataValue,
						"color": 16766720,
						"footer": {
							"icon_url": "https://slate.silveress.ie/docs_bns/images/logo.png",
							"text": "Powered by Silveress's BnS API - Last update: "+dateformat(dataAge, "UTC:dd-mm-yy @ HH:MM")+" UTC"
						},
						"thumbnail": {
							"url": imgSource
						},
					}	
				});

			break;
			
			// data gathering start from here
			case 'getupdate':				
				var classData = await getFileData("./data/list-classdata-source.json");
				var configData = await getFileData("./config.json");
				var fileData = await getFileData("./data/data-files.json");

				var silveressItem = configData.API_ADDRESS[2].address;

				var errCount = 0;
				var errLocation = [];
				var errMsg = "";

				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: Starting data update..");
				
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
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: Item and class data updated with "+errCount+" problem(s)");

				if(errCount != 0){
					console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Warning: Problem occured on: "+errLocation+", please check the log");
					message.guild.channels.find(x => x.name == "errors").send("Caught an issue on `"+errLocation+"`\n```"+errMsg+"```");
				}
				
				// writing when the data got updated
				fileData.ITEM_DATA = dateformat(Date.now(), "UTC:dd mmmm yyyy HH:MM:ss");
				fileData.CLASS_DATA = dateformat(Date.now(), "UTC:dd mmmm yyyy HH:MM:ss");

				setFileData("./data/data-files.json", fileData);

				try{
					if(message.channel.name == guildConfig[guildConfigIdx].CHANNEL_ADMIN){
						message.channel.send("Item and class data updated manually with "+errCount+" issue(s)");
					}
				}catch(error){

				}
			break;

			// Fetching the market data
			case 'getmarketdata':
				var marketQuery = message.toString().substring(1).split(" ");
					marketQuery = marketQuery.splice(1);

				var itemData = await getFileData("./data/list-item.json"); //item data
				var marketDataStored = await getFileData("./data/list-market-data.json"); //stored market data
				var configData = await getFileData("./config.json");
				var fileData = await getFileData("./data/data-files.json");

				var marketDataCurrent = await getSiteData(configData.API_ADDRESS[1].address); //fecthing the current data (one listing, lowest)

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
					//"dataAge": marketDataCurrent[1].ISO, disabled until properly implemented
					"dataUpdated": foundCount,
					"dataCount": marketListCurrent.length - 1
				}

				// checking if archive directory exist or not
				if(configData.ARCHIVING == true){
					if(!fs.existsSync('./archive')){
						console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Warning: archive directory not found, creating the directory now...");
						fs.mkdirSync('./archive', function (err) {
							if(err){
								console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Warning: Unable to make archive directory, please manually make one to avoid errors, "+err);
								clientDiscord.emit("message", "!err |"+err.stack+"|");
							}
						});
					}	
				}				

				// writing the data into a file
				fs.writeFile('./data/list-market-data.json', JSON.stringify(marketListCurrent, null, '\t'), function (err) {
					if(err){
						console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Warning: There's an issue when updating 'list-market-data.json', "+err);
						clientDiscord.emit("message", "!err |"+err.stack+"|");
					}
				})

				// making a copy for archive
				fs.writeFile('./archive/market-data-archive '+Date.now()+'.json', JSON.stringify(marketListCurrent, null, '\t'), function (err) {
					if(err){
						console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Warning: There's an issue when archiving 'list-market-data.json', "+err);
						clientDiscord.emit("message", "!err |"+err.stack+"|");
					}
				});

				// writing when the data got updated
				fileData.MARKET_DATA = dateformat(Date.now(), "UTC:dd mmmm yyyy HH:MM:ss");
				setFileData("./data/data-files.json", fileData);

				try{
					if(message.channel.name == guildConfig[guildConfigIdx].CHANNEL_ADMIN){
						message.channel.send(foundCount+" market data updated manually");
					}
				}catch(error){
					
				}
				
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: "+foundCount+" market data updated, "+(marketListCurrent.length - 1)+" data archived");
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
							"text": "Blade & Soul Event - Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ HH:MM")+" UTC"
						},
						"fields":[
							{
								"name": dateformat(currentDate, "UTC:dddd")+"'s To-do List (Location - Quest `Type`)",
								"value": eventQuests 								
							}
						]
					}	
				});
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: "+cmd+" command received");			
			break;

			case 'set':
				var adminAccess = message.channel.permissionsFor(message.author).has("ADMINISTRATOR", false);
				var configQuery = message.toString().split(' ');
					configQuery = configQuery.splice(1);

				if(adminAccess == true){
					var guildConfig = await getFileData('./data/guilds.json');
					var guildConfigDataLocation = await getGuildConfig(message.guild.id);						

					switch(configQuery[0]){
						case 'add':	
							var defaultConfig = await getFileData('config.json');
							var found = false;
						
							for(var i = 0; i < guildConfig.length; i ++){
									if(message.guild.id == guildConfig[i].GUILD_ID){
									found = true;
								}
							}

							if(found == false){
								var configData = {
									"GUILD_NAME": message.guild.name,
									"GUILD_ID": message.guild.id,
									"GUILD_ICON": message.guild.iconURL,
									"SETUP_STATUS": false,
									"PREFIX": defaultConfig.DEFAULT_PREFIX,
									"CHANNEL_DAILY_ANNOUNCE": defaultConfig.DEFAULT_PARTY_CHANNEL,
									"CHANNEL_WEEKLY_ANNOUNCE": defaultConfig.DEFAULT_PARTY_CHANNEL,
									"CHANNEL_EVENT_ANNOUNCE": defaultConfig.DEFAULT_PARTY_CHANNEL,
									"CHANNEL_NEWS_ANNOUNCE": defaultConfig.DEFAULT_NEWS_CHANNEL,
									"CHANNEL_KOLDRAK_ANNOUNCE": defaultConfig.DEFAULT_PARTY_CHANNEL,
									"CHANNEL_TEXT_MAIN": defaultConfig.DEFAULT_TEXT_CHANNEL,
									"CHANNEL_MEMBER_GATE": defaultConfig.DEFAULT_MEMBER_GATE,
									"CHANNEL_ADMIN": defaultConfig.DEFAULT_ADMIN_CHANNEL,
									"CHANNEL_MEMBERACTIVITY": defaultConfig.DEFAULT_MEMBER_LOG
								}
								
								guildConfig.push(configData);

								setFileData('./data/guilds.json', guildConfig);

								message.channel.send("Server configuration data has been added, to see what can be configure use `"+guildPrefix+"debug config`");
								console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: Configuration data for "+message.guild.name+" has been added");
							}else{
								message.channel.send("There's already a configuration data for this server, to see what can be configure use `"+guildPrefix+"debug config` or `"+guildPrefix+"debug config current` to see the current setting");
							}

							console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: 'setting add' command received");
						break;

						case 'update':
							var guildNameNew = getUserInput(message);

							guildConfig[guildConfigDataLocation].GUILD_NAME = guildNameNew;
							guildConfig[guildConfigDataLocation].GUILD_ICON = message.guild.iconURL;

							setFileData('./data/guilds.json', guildConfig);
							console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: Guild data with id '"+message.guild.id+"' has been updated");
						break;

						case 'prefix':
							var guildPrefix = configQuery[1];

							guildConfig[guildConfigDataLocation].PREFIX = guildPrefix;

							setFileData('./data/guilds.json', guildConfig);

							message.channel.send("Prefix for this server changed to `"+guildPrefix+"`");
							console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: "+message.guild.name+" prefix data updated");
						break;

						case 'channel':
							var typeQuery = configQuery[1];
								typeQuery = typeQuery.toLocaleUpperCase();

							var channelNameQuery = "";
							if(configQuery.length > 3){
								for(var i = 3; i <configQuery.length; i++){
									channelNameQuery = channelNameQuery +"-"+ configQuery[i];
								}
								channelNameQuery = channelNameQuery.substr(1);
							}else{
								channelNameQuery = configQuery[2];
							}
							var success = true;

							switch(typeQuery){
								case 'CHANNEL_TEXT_MAIN':
									guildConfig[guildConfigDataLocation].CHANNEL_TEXT_MAIN = channelNameQuery;
								break;
								case 'CHANNEL_MEMBER_GATE':
									guildConfig[guildConfigDataLocation].CHANNEL_MEMBER_GATE = channelNameQuery;
								break;
								case 'CHANNEL_NEWS_ANNOUNCE':
									guildConfig[guildConfigDataLocation].CHANNEL_NEWS_ANNOUNCE = channelNameQuery;
								break;
								case 'CHANNEL_ADMIN':
									guildConfig[guildConfigDataLocation].CHANNEL_ADMIN = channelNameQuery;
								break;
								case 'CHANNEL_MEMBERACTIVITY':
									guildConfig[guildConfigDataLocation].CHANNEL_MEMBERACTIVITY = channelNameQuery;
								break;
								case 'CHANNEL_DAILY_ANNOUNCE':
								guildConfig[guildConfigDataLocation].CHANNEL_DAILY_ANNOUNCE = channelNameQuery;
								break;
								case 'CHANNEL_WEEKLY_ANNOUNCE':
								guildConfig[guildConfigDataLocation].CHANNEL_WEEKLY_ANNOUNCE = channelNameQuery;
								break;
								case 'CHANNEL_EVENT_ANNOUNCE':
								guildConfig[guildConfigDataLocation].CHANNEL_EVENT_ANNOUNCE = channelNameQuery;
								break;
								case 'CHANNEL_KOLDRAK_ANNOUNCE':
								guildConfig[guildConfigDataLocation].CHANNEL_KOLDRAK_ANNOUNCE = channelNameQuery;
								break;
								
								default:
									message.channel.send("I'm sorry I can't find that type of channel\n\nAvailable type: `\"CHANNEL_TEXT_MAIN\"`, `\"CHANNEL_MEMBER_GATE\"`, `\"CHANNEL_NEWS_ANNOUNCE\"`, `\"CHANNEL_ADMIN\"`, `\"CHANNEL_MEMBERACTIVITY\"`, `\"CHANNEL_DAILY_ANNOUNCE\"`, `\"CHANNEL_WEEKLY_ANNOUNCE\"`, `\"CHANNEL_EVENT_ANNOUNCE\"`, `\"CHANNEL_KOLDRAK_ANNOUNCE\"`");

									success = false
								break;
							}
							
							if(success == true){
								setFileData('./data/guilds.json', guildConfig);

								message.channel.send("`"+typeQuery+"` for this server changed to `"+channelNameQuery+"`");
								console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: "+message.guild.name+" default channel data updated");
							}
							
							console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: 'set channel' command received");
						break;

						case 'current':
							var guildConfigDataLocation = await getGuildConfig(message.guild.id);
							var guildConfigData = guildConfig[guildConfigDataLocation];

							message.channel.send({
								"embed":{
									"title": message.guild.name+"'s Configuration Data",
									"color": 16744192,
									"thumbnail": {
										"url": guildConfigData.GUILD_ICON
									},
									"fields": [
										{
											"name": "Commands Prefix - `PREFIX`",
											"value": "`"+guildConfigData.PREFIX+"`"
										},
										{
											"name": "Main Text - `CHANNEL_TEXT_MAIN`",
											"value": "`"+guildConfigData.CHANNEL_TEXT_MAIN+"`"
										},
										{
											"name": "New Member - `CHANNEL_MEMBER_GATE`",
											"value": "`"+guildConfigData.CHANNEL_MEMBER_GATE+"`"
										},
										{
											"name": "Admin - `CHANNEL_ADMIN`",
											"value": "`"+guildConfigData.CHANNEL_ADMIN+"`"
										},
										{
											"name": "Member's Activity Log - `CHANNEL_MEMBERACTIVITY`",
											"value": "`"+guildConfigData.CHANNEL_MEMBERACTIVITY+"`"
										},
										{
											"name": "Blade & Soul Twitter News - `CHANNEL_NEWS_ANNOUNCE`",
											"value": "`"+guildConfigData.CHANNEL_NEWS_ANNOUNCE+"`"
										},
										{
											"name": "Daily Announcement - `CHANNEL_DAILY_ANNOUNCE`",
											"value": "`"+guildConfigData.CHANNEL_DAILY_ANNOUNCE+"`"
										},
										{
											"name": "Weekly Announcement - `CHANNEL_WEEKLY_ANNOUNCE`",
											"value": "`"+guildConfigData.CHANNEL_WEEKLY_ANNOUNCE+"`"
										},
										{
											"name": "Event Announcement - `CHANNEL_EVENT_ANNOUNCE`",
											"value": "`"+guildConfigData.CHANNEL_EVENT_ANNOUNCE+"`"
										},
										{
											"name": "Koldrak's Lair Announcement - `CHANNEL_KOLDRAK_ANNOUNCE`",
											"value": "`"+guildConfigData.CHANNEL_KOLDRAK_ANNOUNCE+"`"
										},
									],
									"footer": {
										"text": "Jinsoyun Bot Configuration - Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ HH:MM")+" UTC"
									},
								}
							})

							console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: 'set current' command received");
						break;

						default:
							var guildConfigDataLocation = await getGuildConfig(message.guild.id);
							var guildConfigData = guildConfig[guildConfigDataLocation];

							message.channel.send({
								"embed":{
									"title": "Configuration Commands",
									"color": 16744192,
									"fields": [
										{
											"name": "Current ("+guildConfigData.PREFIX+"set current)",
											"value": "Show the current bot configuration for this server"
										},
										{
											"name": "Prefix ("+guildConfigData.PREFIX+"set prefix <character>)",
											"value": "Changing the bot prefix for your server"
										},
										{
											"name": "Udate Server Data ("+guildConfigData.PREFIX+"set update <server name>)",
											"value": "Update server name and picture data"
										},
										{
											"name": "Default Channel ("+guildConfigData.PREFIX+"set channel <type> <channel>)",
											"value": "Changing the default channel for your server\n\n**Type** \n`CHANNEL_TEXT_MAIN` main text channel\n`CHANNEL_MEMBER_GATE` default new member channel\n`CHANNEL_NEWS_ANNOUNCE` default news channel for twitter hook\n`CHANNEL_ADMIN` default admin only channel for administrator commands\n`CHANNEL_DAILY_ANNOUNCE` default channel for daily challenges annoucement\n`CHANNEL_WEEKLY_ANNOUNCE` default channel for weekly challenges annoucement\n`CHANNEL_EVENT_ANNOUNCE` default channel for current event summary\n`CHANNEL_KOLDRAK_ANNOUNCE` default channel for koldrak's lair access annoucement\n`CHANNEL_MEMBERACTIVITY` default channel for server member activity (joined, left)\n\n**Channel**\n`channel-name` channel name to replace the current one (there can't be space between words)\n`disable` to disable this function"
										}
									],
									"footer": {
										"text": "Jinsoyun Bot Configuration - Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ HH:MM")+" UTC"
									},
								}
							});
						break;
					}
				}else{
					message.channel.send("I'm sorry but you don't have permission to use this command");
				}
			break;			

			case 'debug':
				var configData = await getFileData("./config.json");
				var fileData = await getFileData("./data/data-files.json");

				// debug commands is currently only can be used by bot author only, if you want to change this edit the 'config.json' DEFAULT_BOT_ADMIN variable
				if(message.author.id == configData.DEFAULT_BOT_ADMIN){
					var debugQuery = message.toString().split(' ');
						debugQuery = debugQuery.splice(1);

					switch(debugQuery[0]){
						case 'maint':
							switch(debugQuery[1]){
								case 'enable':
								configData.MAINTENANCE_MODE = true;

								setFileData('config.json', configData);

								clientDiscord.user.setPresence({ game: { name: 'MAINTENANCE MODE [!]' }, status: 'dnd' })
									.catch(console.error);
								message.channel.send("Maintenance mode is enabled, only essential service is active");

								console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Warning: Maintenance mode is enabled");	
							break;
							case 'disable':
								configData.MAINTENANCE_MODE = false;

								setFileData('config.json', configData);

								clientDiscord.user.setPresence({ game: { name: 'with Hongmoon School' }, status: 'online' })
									.catch(console.error);
								message.channel.send("Maintenance mode is disabled, all service is returning to normal");	
								console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Warning: Maintenance mode is disabled");		
							break;
							}
						break;

						case 'data':
							var fileData = await getFileData("./data/data-files.json");
							message.channel.send({
								"embed":{
									"title": "Jinsoyun Database Last Update",
									"description": "- Market Data: "+fileData.MARKET_DATA+"\n- Item Data: "+fileData.ITEM_DATA+"\n- Class Data: "+fileData.CLASS_DATA+"\n- Event Data: "+fileData.EVENT_DATA,
									"color": 16744192
								}
							})
						break;

						// this command is for updating the current event data with the updated one
						case 'event':
							if(configData.MAINTENANCE_MODE == true){
								var nextEvent = await getFileData("./data/data-event-next.json");

								var currentEvent = {
									"name": nextEvent.name,
									"duration": nextEvent.duration,
									"redeem": nextEvent.redeem,
									"url": nextEvent.url,
									"rewards": nextEvent.rewards,
									"typeMean": nextEvent.typeMean,
									"quests": nextEvent.quests
								}

								setFileData('./data/data-event.json', currentEvent);

								message.channel.send(+nextEvent.name+" event data is now live");
								console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: "+nextEvent.name+" event data is now live");
							}else{
								message.channel.send("Maintenance mode is disabled, enable maintenance mode to use this command");
							}

							// save the time when the data got updated
							fileData.EVENT_DATA = dateformat(Date.now(), "UTC:dd mmmm yyyy HH:MM:ss");

							setFileData("./data/data-files.json", fileData);
						break;

						case 'guilds':
							var guildsList = clientDiscord.guilds.map(getGuildName);
							var guildsCount = guildsList.length;
								guildsList = guildsList.toString();
							message.channel.send({
								"embed":{
									"title": "Proudly Serving "+guildsCount+" Guilds",
									"color": 16744192,
									"description": guildsList
								}
							});

							console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: 'debug guilds' command received");
						break;

						case 'file':
							var filePath = debugQuery[1];
							var fileData = await getFileData(filePath);
								fileData = JSON.stringify(fileData,  null, "\t");

							if(filePath != null || fileData != null){
								message.channel.send("Content of `"+filePath+"`\n```"+fileData+"```");
							}else{
								message.channel.send("`"+filePath+"` doesn't exist or inaccesible");
							}

							console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: 'debug file' command received");
						break;

						case 'archive':
							switch(debugQuery[1]){
								case 'enable':
								configData.ARCHIVING = true;

								setFileData('config.json', configData);

								message.channel.send("Archive system is enabled, market data will be saved");	

								console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Warning: Archive system is enabled");	
							break;
							case 'disable':
								configData.ARCHIVING = false;

								setFileData('config.json', configData);

								message.channel.send("Archive system is disabled, no market data will be saved");

								console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Warning: Archive system is disabled");		
							break;
							}
						break;
					}
				}else{
					message.channel.send("I'm sorry but you don't have permission to use this command");
					console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Warning: Unauthorized access to debug commands by "+message.author.username);
				}
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
						console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Warning: Unable to notify the errors, please check the log");	
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
		console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: Tweet received, status: "+payloadStatus);
		payloadStatus = "rejected";
	});
  
	stream.on('error', function(error) {
		console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Unable to get Twitter data, "+error);
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
	cycle: [ '00:02' ],
	utc: true
}, function (marketUpdate) {
    clientDiscord.emit("message", "!getmarketdata");
    marketUpdate.done();
    return
})