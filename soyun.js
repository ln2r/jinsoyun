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

// Twitter hook variables
var twtUsername;
var twtScreenName
var twtText;
var twtAvatar;
var twtCreatedAt;
var twtTimestamp;
var twtColor;

// for soyun activity randomizer
let statusRandom = 0; 

// for next event data
let nextEventDungeon = []; 
let nextEventName;
let nextEventDuration;
let nextEventRedeem;
let nextEventUrl;
let nextEventTodo;
let nextEventItems;
let nextEventDaily;
let nextEventWeekly;
let nextEventMarket;
let nextEventDungeonData;

// function list start here
// converting number (702501) only format to more readable format (70g 25s 01c)
function setCurrencyFormat(number){
	let str = Math.round(number);
		str = str.toString()
	let len = str.length
	let gold = ""
	let silver = ""
	let copper = ""

	if(len > 4){
		gold = str.substring( 0 , len -4)+ "<:gold:463569669496897547>";
	}
	if(len > 2){
		silver = str.substring( len -2 ,len - 4 )+ "<:silver:463569669442371586>";
	}
	if(len > 0){
		copper = str.substring( len ,len -2 )+ "<:copper:463569668095868928>";
	} 

	let total = gold + silver + copper; 
	return total;
}

// getting quest day and returning array of matched quest index
async function getQuests(dayQuery){
	let day = dayQuery.toString().replace(/(^|\s)\S/g, l => l.toUpperCase());

	let quests = await getFileData("./data/list-quests.json");
	
	let questsID = [];
	let idx = 0;

	for (i = 0; i < quests.length; i++){
		for(j = 0; j < 7; j++){
			if(quests[i].daily_challenge[j] == day){
				questsID[idx] = i;
				idx++;
			}
		}
	}
	return questsID;
}

// time difference return array of time [hour, minutes]
function getTimeDifference(timeQuery){
	let time = new Date();

	// Getting the hour of UTC+1
	let timeNowHour = time.getUTCHours() + 1;
	let timeMinutesNow = time.getUTCMinutes();

	// Making new date data with details from above variable
	let timeNow = new Date(0, 0, 0, timeNowHour, timeMinutesNow, 0);		

	let timeDifferenceValue = [];
	let timeDifference = timeQuery - timeNow;

	// Formatting
	let timeDifferenceHours = Math.floor(timeDifference / 1000 / 60 / 60);

	timeDifference -= timeDifferenceHours * 1000 * 60 * 60;

	let timeDifferenceMinutes = Math.floor(timeDifference / 1000 / 60);

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
	let timeQuery = new Date(0, 0, 0, time[0], 0, 0);
	let timeCheck = getTimeDifference(timeQuery.getTime());
	let timeHours = timeCheck[0];
	let timeMinutes = timeCheck[1];
	let timeStatus;

	//formating
	if(timeHours < 10){
		timeHours = "0"+timeHours;
	}
	if(timeMinutes < 10){
		timeMinutes = "0"+timeMinutes;
	}

	let timeStatus = timeHours+" hour(s) and "+timeMinutes+" minute(s) left"

	return timeStatus;
}

// Data handling, return data or "Custom no data message"
function setDataValue(dataInput){
	let data = dataInput;

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
function getWinRate(gameInput, winInput){
	let game = gameInput;
		game = parseInt(game);

	let win = winInput;
		win = parseInt(win);
	
	let winRate = 0;
	
	if(game != 0 && win != 0){
		winRate = ((win/game)*100).toFixed(2);
	}

	return (winRate + "%");	
}

// Get data from 3rd party source (website)
async function getSiteData(query) {
	return await fetch(query)
		.then((response) => {return response.json()})
		.catch((error) => {
			console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Warning: Unable to fetch data using getSiteData, "+error);
			clientDiscord.emit("message", "!err |"+error.stack+"|");
			return {"status": error}
		})  
}


// Get quest type, return "Dynamic" or "Event"
function getQuestType(typeQuery){
	let type = typeQuery;
	let typeValue;

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
function setDataFormatting(dataQuery){
	let data = dataQuery
	for(var i = 1; i < data.length; i++){
		data[i] = " "+data[i];
	}
	return data;
};

// Getting day value, get day (0-6), return monday (dddd)
function getDay(dayQuery){
	let day = dayQuery
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
	let quests = await getFileData("./data/list-quests.json");

	let weekly = [];
	let j = 0;
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
	let charaSkillsetData = require('./data/class/'+charaClass+'/'+charaElement+'.json');	
	let charaSkillset = [];
	let idx = 0;

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
async function getSkillset(charaClassInput, charaElementInput, charaNameInput){
	let charaSkillsetData = await getFileData("./data/class/"+charaClassInput+"/"+charaElementInput+".json"); 
		charaSkillsetData = charaSkillsetData.records;

	let charaName = charaNameInput.replace(" ", "%20");
	let charaElement = charaElementInput.toLowerCase();
	let charaClass = charaClassInput.replace(" ", "");

	// reference url: http://na-bns.ncsoft.com/ingame/api/skill/characters/Wquin%20Hollow/skills/pages/1.json
	let userSkillset = await getSiteData("http://na-bns.ncsoft.com/ingame/api/skill/characters/"+charaName+"/skills/pages/1.json");	
		userSkillset = userSkillset.records;

	let charaTrainableList = getTrainableSkills(charaClass, charaElement);
	let charaTrainableSkills = "";

	// searching for match
	for(var i = 0; i < userSkillset.length; i++){
		for(let j = 0; j < charaTrainableList.length; j++){
			// checking if the skill_id is the same
			if(userSkillset[i].skill_id == charaTrainableList[j].id){
				// getting the correct variation
				for(let k = 0; k < charaSkillsetData[charaTrainableList[j].idx].variations.length; k++){
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

// formating the text, make text uppercase
function setTextFormat(textInput){
	let text = textInput.toLowerCase();
		text = text.replace(/(^|\s)\S/g, l => l.toUpperCase());

	return text;
}
						
// getting API status
async function getAPIStatus(){
	let configData = await getFileData("./config.json");
	
	let apiStatus = [];
	let apiAdress = configData.API_ADDRESS;

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
	let fileContent;

	try{
		fileContent = fs.readFileSync(path, 'utf8')
		fileContent = JSON.parse(fileContent);
	}catch(error){
		console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Warning: Unable to fetch data using getFileData, "+error);
		clientDiscord.emit("message", "!err |"+error.stack+"|");
	}	

	return fileContent;
}

// Getting the location of searched query data in array
async function getDataIndex(query, dataPath){
	let data = await getFileData(dataPath);	
	let dataIndex = [];
	let itemFuzzRatioSimple = 0;
	let itemFuzzRatioSimpleMatch = 0;
	let i = 0;

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
	let priceStatus = [("" + "0.00%"), "➖"]
	if(priceNew != priceOld){
		let percentage = ((priceNew-priceOld)/ 100).toFixed(2);
		let symbol;
		let emoji;
		
		if(percentage < 0){
			symbol = "";
			emoji = "🔽";
		}else{
			symbol = "+";
			emoji = "🔼";
		}

		priceStatus = [(symbol + percentage+"%"), emoji];
	}					

	return priceStatus;
}

// character PvP placement handling
function setCharacterPlacement(rank){
	let pvpPlacement

	if(rank == "" || rank == null){
		pvpPlacement = "Unranked";
	}else{
		pvpPlacement = rank;
	}

	return pvpPlacement;
}

// getting the active element damage
async function getElementalDamage(activeElementInput, characterData){
	let charaData = characterData;
	let activeElement = activeElementInput.toLowerCase();
	let elementalDamage;

	switch(activeElement){
		case 'flame':
			elementalDamage = charaData.flame + (" ("+(charaData.flameRate*100).toFixed(2)+"%)");
		break;
		case 'frost':
			elementalDamage = charaData.frost + (" ("+(charaData.frostRate*100).toFixed(2)+"%)");
		break;
		case 'wind':
			elementalDamage = charaData.wind + (" ("+(charaData.windRate*100).toFixed(2)+"%)");
		break;
		case 'earth':
			elementalDamage = charaData.earth + (" ("+(charaData.earthRate*100).toFixed(2)+"%)");
		break;
		case 'lightning':
			elementalDamage = charaData.lightning + (" ("+(charaData.lightningRate*100).toFixed(2)+"%)");
		break;
		case 'shadow':
			elementalDamage = charaData.shadow + (" ("+(charaData.shadowRate*100).toFixed(2)+"%)");
		break;
		default:
			elementalDamage = "0.00%";
		break;
	}

	return elementalDamage;
}

// getting user input
function getUserInput(textQuery){
    let text = textQuery.toString().split(" ");
		text = text.splice(1);

    let userInput = "";

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
	let guildConfig = await getFileData('./data/guilds.json');
	let idx;

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
	return " "+item.name+" ("+item.memberCount+")";
}

// getting user role list
function getMemberRoles(item, index){
	return item.name;
}

// Discord stuff start here

// Bot token here
clientDiscord.login(secret.DISCORD_APP_TOKEN).catch(error => {
	console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Warning: Unable to start the bot, "+error);
});

// Starting up the bot
clientDiscord.on("ready", async () => {
	let configData = await getFileData("./config.json");
	let fileData = await getFileData("./data/data-files.json");
	
	let apiStatus = await getAPIStatus();
	let apiAdress = configData.API_ADDRESS;
	let packageFile = await getFileData("package.json");

	// statuspage stuff
	let discordStatus = await getSiteData(configData.API_ADDRESS[3].address); 
	let twitterStatus = await getSiteData(configData.API_ADDRESS[4].address);

	// setting the bot name
	clientDiscord.user.setUsername(setTextFormat(packageFile.name));

	if(configData.MAINTENANCE_MODE == false){
		clientDiscord.user.setPresence({ game: { name: 'at Hongmoon School' }, status: 'online' })
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

	try{
		console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Discord service: "+discordStatus.status.description);
		console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Twitter service: "+twitterStatus.status.description);
	}catch(error){
		console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Warning: There's issue when getting data from statuspage.io, "+error);
		clientDiscord.emit("message", "!err |"+error.stack+"|");
	}

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
	let defaultConfig = await getFileData('config.json');
	let guildConfig = await getFileData('./data/guilds.json');
	let found = false;
	let inviteWarning = "";
	var botInviteAccess = message.channel.permissionsFor(clientDiscord.user).has("CREATE_INSTANT_INVITE", false);
	
	for(var i = 0; i < guildConfig.length; i ++){
		if(guild.id == guildConfig[i].GUILD_ID){
			found = true;
		}
	}

	if(found == false){
		let configData = {
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

		if(botInviteAccess == true){
			inviteWarning = "**Warning! this bot have role to create instant invite, it would be wise to disable it**";
		}

		guild.members.find(x => x.id == guild.ownerID).send("Thank you for adding me to the server, default server configuration data has been added. To setup necessary channel do `"+defaultConfig.DEFAULT_PREFIX+"setup`, to see what can be configure use `"+defaultConfig.DEFAULT_PREFIX+"debug config` "+inviteWarning);
;
		console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: Jinsoyun joined "+guild.name+", config data has been set to default");
	}		
});

// User joined the guild
clientDiscord.on("guildMemberAdd", async (member) => {
	let guildConfig = await getFileData("./data/guilds.json");
	let guildConfigIdx = await getGuildConfig(member.guild.id);

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
	let configData = await getFileData("./config.json");
	let silveressNA = configData.API_ADDRESS[0].address;

	let silveressCharaQuery = silveressNA+member.displayName; // for the Query
	let charaData = await getSiteData(silveressCharaQuery);

	let guildConfig = await getFileData("./data/guilds.json");
	let guildConfigIdx = await getGuildConfig(member.guild.id);

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
	let guildConfig = await getFileData("./data/guilds.json");
	let guildConfigIdx = await getGuildConfig(oldMember.guild.id);

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
	let queryStatus; // for querystatus on reg and class
	let sent; // for announcer counter server sent

	let configData = await getFileData("./config.json");
	let classList = await getFileData("./data/class/list-class.json");
	let rewards = await getFileData("./data/list-challenges-rewards.json");
	let event = await getFileData("./data/data-event.json");
	let quests = await getFileData("./data/list-quests.json");
	let fileData = await getFileData("./data/data-files.json");

	let silveressNA = configData.API_ADDRESS[0].address;
	let guildConfig = await getFileData('./data/guilds.json');
	let guildConfigIdx = await getGuildConfig("426036695931158539");

	if(message.author != null){
		guildConfigIdx = await getGuildConfig(message.guild.id);
	}

	let guildPrefix = guildConfig[guildConfigIdx].PREFIX;
	
  	if (message.toString().substring(0, 1) == guildPrefix) {
		//var args = message.toString().substring(1).split(' ');
		let	args = message.toString();
			args = args.substring(1).split(' ');
			let cmd = args[0];
			cmd = cmd.toLowerCase();

        args = args.splice(1);
        switch(cmd) {
			// Connection test
			case 'soyun':
				let soyunQuery = message.toString().substring(1).split(' ');
				let soyunHelpTxt = '**Account**\n- Nickname: `'+guildPrefix+'username new nickname`\n- Class: `'+guildPrefix+'class new class`\n\n**Blade & Soul**\n- Character Search: `'+guildPrefix+'who` or `'+guildPrefix+'who character name`\n- Daily challenges `'+guildPrefix+'daily` or `'+guildPrefix+'daily tomorrow`\n- Weekly challenges `'+guildPrefix+'weekly`\n- *Koldrak\'s Lair*  time: `'+guildPrefix+'koldrak`\n- Marketplace `'+guildPrefix+'market item name` or `!market event`\n- Current Event `'+guildPrefix+'event` or `'+guildPrefix+'event tomorrow`\n\n**Miscellaneous**\n- Pick: `'+guildPrefix+'pick "item a" or "item b"`\n- Roll dice: `'+guildPrefix+'roll` or `'+guildPrefix+'roll (start number)-(end number)` (`'+guildPrefix+'roll 4-7`)\n- Commands list: `'+guildPrefix+'soyun help`\n- Bot and API status `'+guildPrefix+'soyun status`\n- Try Me! `'+guildPrefix+'soyun`';

				soyunQuery = soyunQuery.splice(1);

				switch(soyunQuery[0]){
					case 'help':
						var adminAccess = message.channel.permissionsFor(message.author).has("ADMINISTRATOR", false);
						
						if(adminAccess == true){
							soyunHelpTxt = soyunHelpTxt + '\n\n**Admin**\n- First Time Setup: `'+guildPrefix+'setup`\n- Bot Settings: `'+guildPrefix+'set`\n-Event Update: `'+guildPrefix+'eventnext help`';
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
										clientDiscord.user.setActivity('at Hongmoon School', {type: 'PLAYING'});
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

						// statuspage stuff
						let discordStatus = await getSiteData(configData.API_ADDRESS[3].address);
						let twitterStatus = await getSiteData(configData.API_ADDRESS[4].address);
						let soyunPackageData = await getFileData("./package.json");
						
						let apiAdress = configData.API_ADDRESS;

						let apiStatus = await getAPIStatus();

						apiStatusList = "**"+apiAdress[0].name+"**: "+apiStatus[0]+"\n**"+apiAdress[1].name+"**: "+apiStatus[1]+"\n";

						//`Ping received, Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(clientDiscord.ping)}ms`
						let msgLatency = (m.createdTimestamp - message.createdTimestamp) + "ms";
						let apiLatency = Math.round(clientDiscord.ping) + "ms";

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
										"name": "Database Last Update",
										"value": "**Market Data**: "+fileData.MARKET_DATA+"\n**Item Data**: "+fileData.ITEM_DATA+"\n**Class Data**: "+fileData.CLASS_DATA+"\n**Event Data**: "+fileData.EVENT_DATA
									},
									{
										"name": "Discord",
										"value": "**Status**: "+discordStatus.status.description
									},
									{
										"name": "API",
										"value": apiStatusList+"\n**Twitter**: "+twitterStatus.status.description
									},
									{
										"name": "About and Special Mentions",
										"value": "- Bot maintaned and developed by **[ln2r](https://ln2r.web.id/)**\n- **Grumpy Butts** discord server for field testing and database maintenance."
									},
									{
										"name": "Built With ❤",
										"value": "- [discord.js](https://discord.js.org/)\n- [Silveress BnS API](https://bns.silveress.ie/)\n- [twitter](https://developer.twitter.com/en/docs.html)\n- [ontime](https://www.npmjs.com/package/ontime)\n- [node-fetch](https://www.npmjs.com/package/node-fetch)\n- [dateformat](https://www.npmjs.com/package/dateformat)\n- [delay](https://www.npmjs.com/package/delay)\n- [fuzzball](https://www.npmjs.com/package/fuzzball)"
									}
								]
							}
						});

						// Console logging
						console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > "+message+" received");
					break;

					default:
						let soyunSay = await getFileData("./data/list-soyundialogue.json");
						let soyunDialogueRNG = Math.floor(Math.random() * soyunSay.text.length) - 0;

						message.channel.send(soyunSay.text[soyunDialogueRNG]);

						// Console logging
						console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > "+message+" received");
					break;	
				};
            break;
			
			// Server join = username change and role add
			case 'reg':
				let joinQuery = message.toString().substring(1).split('"');
				let joinUsername = (joinQuery[1]);

				queryStatus = false;
				
				try{
					var joinClass = (joinQuery[3]);
							
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
						queryStatus = false;

						var silveressCharaQuery = silveressNA+joinUsername; // for the Query
						var charaData = await getSiteData(silveressCharaQuery);

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
				let usernameQuery = getUserInput(message);

				// Changing message author username
				message.guild.members.get(message.author.id).setNickname(usernameQuery);
				message.channel.send("Your username changed to "+usernameQuery);

				// Console logging
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: username change command received");
			break;
			
			// Class change
			case 'class':
				let classQuery = getUserInput(message);
					classQuery = classQuery.toLowerCase(); // Converting to lower case so input wont get missmatched
				let memberRolesList = message.guild.members.get(message.author.id).roles.map(getMemberRoles);
				let memberRemovedIdx;

				classList = await getFileData("./data/class/list-class.json");	
				queryStatus = false;				

				// getting and checking user roles
				for(let i = 0; i < classList.length; i++){
					// getting the index of the user previous class/role
					for(var j = 0; j < memberRolesList.length; j++){
						if(classList[i] == memberRolesList[j] && classQuery != memberRolesList[j]){
							memberRemovedIdx = j;
						}	
					}
					// checking if the user input valid or not
					if(classQuery == classList[i]){
						queryStatus = true;
					};
				};

				// Checking the verification
				if(queryStatus == true){
					// removing the old role
					message.guild.members.get(message.author.id).removeRole(message.guild.roles.find(x => x.name == memberRolesList[memberRemovedIdx]))
					// Adding new role to user according their command
					message.guild.members.get(message.author.id).addRole(message.guild.roles.find(x => x.name == classQuery));

					// Telling the user class has been changed
					message.channel.send("Your class changed to **"+classQuery+"**");
				}else{
					// Telling them whats wrong
					message.channel.send("Im sorry, i cant seems to find the class you wrote. If this seems to be a mistake please **@mention** or **DM** available officers for some assistance");
				}
				// Console logging
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: class change command received");
			break;

			case 'twcon':
				sent = 0;
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
			
			// First time setup (making roles and necesarry channels), Admin only
			case 'setup':
				configData = await getFileData("./config.json");
				classList = await getFileData("./data/class/list-class.json");
				
				var adminAccess = message.channel.permissionsFor(message.author).has("ADMINISTRATOR", false);
				var botInviteAccess = message.channel.permissionsFor(clientDiscord.user).has("CREATE_INSTANT_INVITE", false);

				if(adminAccess == true){
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

						if(botInviteAccess == true){
							message.channel.send("Warning! this bot have role to create instant invite, it would be wise to disable it");
						}
					}else{
						message.channel.send("I'm sorry you can't do that, this server already done first time setup");
					}
				}else{
					message.channel.send("I'm sorry but you don't have permission to use this command")
				}
			break;
			
			// pick between two things
			case 'pick':
				let pickQuery = message.toString().substring(1).split('"');	
				let pickFirstOption = pickQuery[1];
				let pickSecondOption = pickQuery[3];

				let pickResult = Math.floor(Math.random() * 2);
				let pickResultValue;

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
				let rollQuery = message.toString().substring(1).split(' ');	
				let rollStartNumber
				let rollEndNumber;

				if(rollQuery[1] == null){
					rollStartNumber = 1;
					rollEndNumber = 7;
				}else{
					rollStartNumber = rollQuery[1].charAt(0);
					rollEndNumber = rollQuery[1].charAt(2);
				};

				let rollResult = Math.floor(Math.random() * rollEndNumber) - rollStartNumber;

				message.channel.send("You rolled **"+rollResult+"**");

				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: "+cmd+" command received");
			break;

			// Today daily challenge
			case 'daily':
				let dcDate = new Date();
				// Getting the current date
				let dcDay = dcDate.getUTCDay();

				let dailyQuery = message.toString().substring(1).split(' ');
					dailyQuery = dailyQuery.splice(1);
				var dailyPartyAnnouncement = false;
				let dailyQuests = "";
				let dailyRewards = [];
				let questsDailyList;
				let questsDailyListRewards;
				let eventReward;

				sent = 0;
				
				switch(dailyQuery[0]){
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
						questsDailyList = await getQuests("sunday");
						questsDailyListRewards = rewards[0].rewards;
					break;
					case 1:
						questsDailyList = await getQuests("monday");
						questsDailyListRewards = rewards[1].rewards;
					break;
					case 2:
						questsDailyList = await getQuests("tuesday");
						questsDailyListRewards = rewards[2].rewards;
					break;
					case 3:
						questsDailyList = await getQuests("wednesday");
						questsDailyListRewards = rewards[3].rewards;
					break;
					case 4:
						questsDailyList = await getQuests("thursday");
						questsDailyListRewards = rewards[4].rewards;
					break;
					case 5:
						questsDailyList = await getQuests("friday");
						questsDailyListRewards = rewards[5].rewards;
					break;
					case 6:
						questsDailyList = await getQuests("saturday");
						questsDailyListRewards = rewards[6].rewards;
					break;
				}

				for(var i = 0; i < questsDailyList.length; i++){
					dailyQuests = dailyQuests + ("**"+quests[questsDailyList[i]].location+"** - "+quests[questsDailyList[i]].quest+"\n");
				}
				for(var i = 0; i < questsDailyListRewards.length; i++){
					dailyRewards = dailyRewards + (questsDailyListRewards[i]+"\n");
				}

				if(event.rewards.daily != ""){
					eventReward = event.rewards.daily + " (Event)";
				}else{
					eventReward = "";
				}

				dailyRewards = dailyRewards + eventReward;
				
				// Sending out the payload
				if(dailyPartyAnnouncement == false){
					// default, normal payload
					if(configData.MAINTENANCE_MODE == true && message.guild.id != configData.DEFAULT_GUILD_ID){
						message.channel.send("**Maintenance Mode** is enabled, user commands is disabled");
					}else{
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
					}
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
				let koldrakQuery = message.toString().substring(1).split(' ');
					koldrakQuery = koldrakQuery.splice(1);
				let koldrakTime = await getFileData("./data/koldrak-time.json");
				
				configData = await getFileData("./config.json");
				sent = 0;	
				
				// Cheating the search so it will still put hour even if the smallest time is 24
				let koldrakTimeLeft = 25;

				switch(koldrakQuery[0]){
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
						if(configData.MAINTENANCE_MODE == true && message.guild.id != configData.DEFAULT_GUILD_ID){
							message.channel.send("**Maintenance Mode** is enabled, user commands is disabled");
						}else{
							let koldrakTimeHours;
							let koldrakTimeMinutes;
							let koldrakTimeNext;
							let koldrakTimeDiff;

							// Searching when is the closest one
							for(var i = 0; i < 5;){
								// Making new date data with details from koldrak's schedule (koldrak.json)
								koldrakTimeNext = new Date(0, 0, 0, koldrakTime.time[i], 0, 0);
								// Getting the time difference
								koldrakTimeDiff = getTimeDifference(koldrakTimeNext.getTime());

								// Formatting
								koldrakTimeHours = koldrakTimeDiff[0];							
								koldrakTimeMinutes = koldrakTimeDiff[1];

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
						}
					break;	
				};
			break;
			
			// for searching and showing character information, can be triggered via !who for character that have the same name with the nickname or use !who "chara name" for specific one
			case 'who':
				if(configData.MAINTENANCE_MODE == true && message.guild.id != configData.DEFAULT_GUILD_ID){
					message.channel.send("**Maintenance Mode** is enabled, user commands is disabled");
				}else{
					configData = await getFileData("./config.json");

					try{
						message.channel.startTyping();

						let whoQuery = getUserInput(message);

						if(whoQuery == null || whoQuery == undefined){
							whoQuery = [message.member.nickname];
						}else{
							// encoding uri component so character with 'circumflex' still searchable
							whoQuery = encodeURIComponent(whoQuery);
						}				

						let silveressCharaQuery = silveressNA+whoQuery; // for the query
						let charaData = await getSiteData(silveressCharaQuery);
						let characlassQuery = charaData.playerClass.toLowerCase().replace(/\s/g, '');
						let skillsetData = await getSkillset(characlassQuery, charaData.activeElement, encodeURIComponent(charaData.characterName))

						let elementalDamage = await getElementalDamage(charaData.activeElement, charaData);
						
						// for author url so user can look at more detailed version
						let bnstreeProfile = "https://bnstree.com/character/na/"+whoQuery; 
						// replacing the space so discord.js embed wont screaming error
							bnstreeProfile = bnstreeProfile.replace(" ","%20"); 
						
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
									"value": setDataValue(charaData.gem1)+"\n"+setDataValue(charaData.gem2)+"\n"+setDataValue(charaData.gem3)+"\n"+setDataValue(charaData.gem4)+"\n"+setDataValue(charaData.gem5)+"\n"+setDataValue(charaData.gem6)+"\n"+setDataValue(charaData.gem7)+"\n"+setDataValue(charaData.gem8)+"\n",
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
				}				
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: "+cmd+" command received");
			break;
			
			// for searching item in market, can be triggered via !market "item name"
			case 'market':
				if(configData.MAINTENANCE_MODE == true && message.guild.id != configData.DEFAULT_GUILD_ID){
					message.channel.send("**Maintenance Mode** is enabled, user commands is disabled");
				}else{
					let marketQuery = getUserInput(message); // getting the user input

					let marketDataPath = "./data/list-market-data.json";
					let marketData = await getFileData(marketDataPath);	
					let eventData = await getFileData("./data/data-event.json");

					let marketDataValue = "";
					let marketDataItemsCount = "";
					let marketItemIndex;
					let marketDataItems;
					let marketPriceStatus;
					let marketEventItem;
					let marketLastUpdate;

					// for checking marketable/tradeable event items
					if(marketQuery == "Event"){
						if(eventData.tradeableItemId.length != 0 || eventData.tradeableItemId != undefined){
							marketItemIndex = eventData.tradeableItemId;
							marketEventItem = true;
						}else{
							marketEventItem = false;
						}
						marketLastUpdate = fileData.EVENT_DATA;
					}else{
						marketItemIndex = await getDataIndex(marketQuery, marketDataPath);
						marketLastUpdate = marketData[0].updateTime;
					};

					// default image for when data not found
					let imgSource = configData.DEFAULT_MARKET_THUMBNAIL; 

					if(marketItemIndex.length > 6){
						marketDataItems = 6;
						marketDataItemsCount = "**Showing "+marketDataItems+" from "+marketItemIndex.length+" total results**\n";
					}else{
						marketDataItems = marketItemIndex.length;
					}

					// getting set item of data
					for(var i = 0; i < marketDataItems; i++){
						if(marketData.length != 0){
							marketPriceStatus = getPriceStatus(marketData[marketItemIndex[i]].priceEachOld, marketData[marketItemIndex[i]].priceEach);

							marketDataValue = marketDataValue + ("**"+marketData[marketItemIndex[i]].name+"** `"+marketData[marketItemIndex[i]].id+"-"+marketItemIndex[i]+"`\n- Each: "+setCurrencyFormat(marketData[marketItemIndex[i]].priceEach)+" `"+marketPriceStatus[0]+" "+marketPriceStatus[1]+"`\n- Lowest: "+setCurrencyFormat(marketData[marketItemIndex[i]].priceTotal)+" for "+marketData[marketItemIndex[i]].quantity+"\n");

							imgSource = marketData[marketItemIndex[0]].img;
						}
					}

					if(marketDataValue == "" || marketDataValue == null){
						marketDataValue = "*No result on **"+marketQuery+"**\nThe item is either untradable, not in marketplace or maybe it doesn't exist*";
					}else if(marketEventItem == false){
						imgSource = configData.DEFAULT_MARKET_THUMBNAIL;
						marketDataValue = "**No data for "+eventData.name+"'s event items**\n\n*Event item data might not be updated or there's no tradeable/marketable items*";
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
								"text": "Powered by Silveress's BnS API - Last update: "+dateformat(marketLastUpdate, "UTC:dd-mm-yy @ HH:MM")+" UTC"
							},
							"thumbnail": {
								"url": imgSource
							},
						}	
					});
				}
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: "+cmd+" command received");
			break;

			// for getting and annoncing weekly challenges
			case 'weekly':
				let weeklyQuery = message.toString().substring(1).split(' ');
					weeklyQuery = weeklyQuery.splice(1);
				let weeklyIdxList = await getWeeklyQuests();
				let weeklyQuests = "";
				let weeklyRewards = [];
				sent = 0;
				
				for(var i = 0; i < weeklyIdxList.length; i++){
					weeklyQuests = weeklyQuests + ("**"+quests[weeklyIdxList[i]].location+"** - "+quests[weeklyIdxList[i]].quest+"\n");				
				}

				for(var i = 0; i < rewards[7].rewards.length; i++){
					weeklyRewards = weeklyRewards + (rewards[7].rewards[i]+"\n");
				}

				if(event.rewards.weekly != ""){
					weeklyRewards = weeklyRewards + event.rewards.weekly + " (Event)";
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
						if(configData.MAINTENANCE_MODE == true && message.guild.id != configData.DEFAULT_GUILD_ID){
							message.channel.send("**Maintenance Mode** is enabled, user commands is disabled");
						}else{
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
						}	
						console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: "+cmd+" command received");
					break;
				}
			break;

			// for getting the current event information
			case 'event':
				let eventToDo = event.todo;
				let eventQuery = message.toString().substring(1).split(' ');
					eventQuery = eventQuery.splice(1);
				let eventQuests = "";
				
				let today = new Date();
				let currentDate = today;
					today = today.getUTCDay();
				let todayEvent = [];
				var k = 0;
				sent = 0;

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
					for(let j = 0; j < 7; j++){
						if(event.quests[i].day[j] == getDay(today)){							
							todayEvent[k] = i;
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
												"description": "**Duration**: "+event.duration+"\n**Redemption Period**: "+event.redeem+"\n**Event Item**: "+setDataFormatting(event.rewards.items)+"\n**What to do**: "+setDataFormatting(eventToDo)+"\n**Redeemable Event**: "+event.lastEvent+" ("+event.lastEventRedeem+")",
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
						if(configData.MAINTENANCE_MODE == true && message.guild.id != configData.DEFAULT_GUILD_ID){
							message.channel.send("**Maintenance Mode** is enabled, user commands is disabled");
						}else{
							message.channel.send({
								"embed": {
									"author":{
										"name": "Current Event",
										"icon_url": "https://cdn.discordapp.com/emojis/479872059376271360.png?v=1"
									},
									"title": event.name,
									"url": event.url,
									"description": "**Duration**: "+event.duration+"\n**Redemption Period**: "+event.redeem+"\n**Event Item**: "+setDataFormatting(event.rewards.items)+"\n**What to do**: "+setDataFormatting(eventToDo)+"\n**Redeemable Event**: "+event.lastEvent+" ("+event.lastEventRedeem+")",
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
						}	
						console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: "+cmd+" command received");
					break;
				};	
			break;
			
			// for updating and checking next event
			case 'eventnext':
				var adminAccess = message.channel.permissionsFor(message.author).has("ADMINISTRATOR", false);
				let eventNextQuery = message.toString().split(' ');
					eventNextQuery = eventNextQuery.splice(1);

				function getTextFromArray(textQuery, start, lengthMin){
					let fullTextQuery = "";
					if(textQuery.length > lengthMin){
						for(var i = start; i <textQuery.length; i++){
							fullTextQuery = fullTextQuery +" "+ textQuery[i];
						}
						fullTextQuery = fullTextQuery.substr(1);
					}else{
						fullTextQuery = textQuery[1];
					}

					return fullTextQuery;
				}	

				if(adminAccess == true){
					switch(eventNextQuery[0]){
						case 'name':
							nextEventName = setTextFormat(getTextFromArray(eventNextQuery, 1, 2));

							message.channel.send("Next event data name set to `"+nextEventName+"`");
						break;

						case 'duration':
							nextEventDuration = setTextFormat(getTextFromArray(eventNextQuery, 1, 2));
							
							message.channel.send("Next event `duration` data set to `"+nextEventDuration+"`");
						break;

						case 'redeem':
							nextEventRedeem = setTextFormat(getTextFromArray(eventNextQuery, 1, 2));
							
							message.channel.send("Next event `redeem` data set to `"+nextEventRedeem+"`");
						break;

						case 'url':
							nextEventUrl = setTextFormat(getTextFromArray(eventNextQuery, 1, 2));
							
							message.channel.send("Next event `url` data set to `"+nextEventUrl+"`");
						break;

						
						case 'daily':
							nextEventDaily = setTextFormat(getTextFromArray(eventNextQuery, 1, 2));
								
							message.channel.send("Next event `daily reward` data set to `"+nextEventDaily+"`");
						break;

						case 'weekly':
							nextEventWeekly = setTextFormat(getTextFromArray(eventNextQuery, 1, 2));
								
							message.channel.send("Next event `weekly reward` data set to `"+nextEventWeekly+"`");
						break;

						case 'todo':
							nextEventTodo = setTextFormat(getTextFromArray(eventNextQuery, 1, 2));
							nextEventTodo = nextEventTodo.toString().split(',');

							// removing that annoying space
							for(let i = 0; i < nextEventTodo.length; i++){
								nextEventTodo[i] = nextEventTodo[i].trim()
							}

							message.channel.send("Next event `todo list` data set to `"+nextEventTodo+"`");
						break;

						case 'items':
							nextEventItems = setTextFormat(getTextFromArray(eventNextQuery, 1, 2));
							nextEventItems = nextEventItems.toString().split(',');

							// removing that annoying space
							for(let i = 0; i < nextEventItems.length; i++){
								nextEventItems[i] = nextEventItems[i].trim()
							}

							message.channel.send("Next event `items` data set to `"+nextEventItems+"`");
						break;

						case 'market':
							nextEventMarket = setTextFormat(getTextFromArray(eventNextQuery, 1, 2));
							nextEventMarket = nextEventMarket.toString().split(',');

							message.channel.send("Next event `tradeable/marketable` data set to `"+nextEventMarket+"`");
						break;

						case 'dungeon':
							switch(eventNextQuery[1]){
								case 'edit':
									nextEventDungeonData = setTextFormat(getTextFromArray(eventNextQuery, 2, 3));
									nextEventDungeonData = nextEventDungeonData.toString().split(',');

									let idx = nextEventDungeonData[0];

									// checking if there's a quest with that name or not
									for(var i = 0; i < nextEventDungeon.length; i++){
										if(nextEventDungeonData[1].trim() == nextEventDungeon[i].quest){
											idx = i;
										}
									}

									// handling when quest found or not
									if(idx != undefined || idx != null){
										// check day input, if 'all' convert to 'show all day' if not check for '+' as a divider, or just write the day
										if(nextEventDungeonData[3].trim() == "all" || nextEventDungeonData[3].trim() == "All"){
											nextEventDungeonData[3] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
										}else if(nextEventDungeonData[3].includes("+")){
											nextEventDungeonData[3] = nextEventDungeonData[3].split("+")
										}else{
											nextEventDungeonData[3] = nextEventDungeonData[3].trim();
										}

										// removing that annoying space
										for(let i = 0; i < nextEventDungeonData[3].length; i++){
											nextEventDungeonData[3][i] = nextEventDungeonData[3][i].trim()
										}
				
										// modifiying the data
										nextEventDungeon[idx] = {
											"location": nextEventDungeonData[1].trim(),
											"quest": nextEventDungeonData[2].trim(),
											"day": nextEventDungeonData[3],
											"type": parseInt(nextEventDungeonData[4]),
										}
										
										message.channel.send("Data for `"+nextEventDungeonData[2].trim()+"` modified with: ",{
											"embed": {
												"description": "**Location**: "+nextEventDungeon[idx].location+"\n**Quest**: "+nextEventDungeon[idx].quest+"\n**Day**: "+setDataFormatting(nextEventDungeon[idx].day)+"\n**Type**: "+nextEventDungeon[idx].type,
												"color": 16753920,
												},
										})
									}else{
										message.channel.send("I'm sorry I can't find dungeon data with that index `"+idx+"`");
									}
								break;

								case 'list':
									let dungeonList = "";

									if(nextEventDungeon.length != 0){
										for(let i = 0; i < nextEventDungeon.length; i++){
											dungeonList = dungeonList + ("`"+i+"` **"+nextEventDungeon[i].location+"** - "+nextEventDungeon[i].quest+" "+getQuestType(nextEventDungeon[i].type)+"\n")
										}
									}else{
										dungeonList = "No Dungeon Data Available"
									}

									message.channel.send("List of Added Dungeon/Quest",{
										"embed": {
											"description": "`Index` **Quest Location** - Quest Name `Quest Type`\n"+dungeonList,
											},
									})								
								break;

								default:
									nextEventDungeonData = setTextFormat(getTextFromArray(eventNextQuery, 1, 3));
									nextEventDungeonData = nextEventDungeonData.toString().split(',');
									
									// check day input, if 'all' convert to 'show all day' if not check for '+' as a divider, or just write the day
									if(nextEventDungeonData[2].trim() == "all" || nextEventDungeonData[2].trim() == "All"){
										nextEventDungeonData[2] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
									}else if(nextEventDungeonData[2].includes("+")){
										nextEventDungeonData[2] = nextEventDungeonData[2].trim();
										nextEventDungeonData[2] = nextEventDungeonData[2].split("+");

										for(let i = 0; i < nextEventDungeonData[2].length; i++){
											nextEventDungeonData[2][i] = setTextFormat(nextEventDungeonData[2][i])
										};										
									}else{
										nextEventDungeonData[2] = nextEventDungeonData[2].trim();
									}

									// removing that annoying space
									for(let i = 0; i < nextEventDungeonData[2].length; i++){
										nextEventDungeonData[2][i] = nextEventDungeonData[2][i].trim()
									}

									nextEventDungeonData = {
										"location": nextEventDungeonData[0].trim(),
										"quest": nextEventDungeonData[1].trim(),
										"day": nextEventDungeonData[2],
										"type": parseInt(nextEventDungeonData[3]),
									}

									message.channel.send("`"+nextEventDungeonData.quest+"` quest data added",{
										"embed": {
											"description": "**Location**: "+nextEventDungeonData.location+"\n**Quest**: "+nextEventDungeonData.quest+"\n**Day**: "+setDataFormatting(nextEventDungeonData.day)+"\n**Type**: "+nextEventDungeonData.type,
											"color": 16753920,
											},
									})

									nextEventDungeon.push(nextEventDungeonData);
								break;
							}
						break;

						// preview of event data
						case 'temp':
							let todayEventTemp = [];
							var todayEventTempIdx = 0;
							let eventQuestListTemp = "";

							let currentDateTemp = new Date();
								currentDateTemp = currentDateTemp.getUTCDay();

							// getting index of event that have the same day with today
							for(var i = 0; i < nextEventDungeon.length; i++){
								for(var j = 0; j < 7; j++){
									if(nextEventDungeon[i].day[j].trim() == getDay(currentDateTemp)){						
										todayEventTemp[todayEventTempIdx] = i;
										todayEventTempIdx++;
									}
								}
							}

							// empty data handler
							if(nextEventName == undefined || nextEventName == ""){
								nextEventName = "No Event Name Set"
							}
							if(nextEventDuration == undefined || nextEventDuration == ""){
								nextEventDuration = "No Event Duration Time Set"
							}
							if(nextEventRedeem == undefined || nextEventRedeem == ""){
								nextEventRedeem = "No Event Redeem Time Set"
							}
							if(nextEventItems == undefined || nextEventItems == []){
								nextEventItems = ["No Event Items data Set"]
							}
							if(nextEventTodo == undefined || nextEventTodo == []){
								nextEventTodo = ["No Event Todo Data Set"]
							}
							

							// for searching event that have the same index with day searching and then inserting the correct one into variable for output later
							if(todayEventTemp != undefined || todayEventTemp != null){
								for(let i = 0; i < todayEventTemp.length; i++){
									eventQuestListTemp = eventQuestListTemp + ("**"+nextEventDungeon[todayEventTemp[i]].location+"** - "+nextEventDungeon[todayEventTemp[i]].quest+" "+getQuestType(nextEventDungeon[todayEventTemp[i]].type)+"\n")
								}
							}else{
								eventQuestListTemp = "No Dungeon Data Set";
							}
									
							if(nextEventName != null || nextEventName != undefined){
								try{
									message.channel.send("Data below is not saved, please do `"+guildPrefix+"eventnext push` to save the data", {
										"embed": {
											"author":{
												"name": "Current Event",
												"icon_url": "https://cdn.discordapp.com/emojis/479872059376271360.png?v=1"
											},
											"title": nextEventName,
											"url": nextEventUrl,
											"description": "**Duration**: "+nextEventDuration+"\n**Redemption Period**: "+nextEventRedeem+"\n**Event Item**: "+setDataFormatting(nextEventItems)+"\n**What to do**: "+setDataFormatting(nextEventTodo),
											"color": 1879160,
											"footer": {
												"icon_url": "https://static.bladeandsoul.com/img/global/nav-bs-logo.png",
												"text": "Next Blade & Soul Event - Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ HH:MM")+" UTC"
											},
											"fields":[
												{
													"name": dateformat(Date.now(), "UTC:dddd")+"'s To-do List (Location - Quest `Type`)",
													"value": eventQuestListTemp 								
												}
											]
										}
									})
								}catch(error){
									message.channel.send("There's trouble showing temporary event data, some data may be incomplete, `nextEventItems is "+nextEventItems+"`, `nextEventTodo is "+nextEventTodo+"`");
								}
							}else{
								message.channel.send("No event data found in temporary or no event name is set");
							}
						break;

						// save the event data
						case 'push':
							let nextEventTradeableItems = []; // manual for now
							let currentEventData = await getFileData('./data/data-event.json');

							// no data handler
							if(nextEventDaily == undefined || nextEventName == ""){
								nextEventDaily = ""
							}
							if(nextEventWeekly == undefined || nextEventDuration == ""){
								nextEventWeekly = ""
							}
							if(nextEventTradeableItems == undefined || nextEventRedeem == ""){
								nextEventTradeableItems = []
							}

							let newEventData = {
								"name": nextEventName,
								"duration": nextEventDuration,
								"redeem": nextEventRedeem,
								"url": nextEventUrl,
								"lastEvent": currentEventData.name,
								"lastEventRedeem": currentEventData.redeem,
								"rewards": {
									"items": nextEventItems,
									"daily": nextEventDaily,
									"weekly": nextEventWeekly
								},
								"tradeableItemId": nextEventTradeableItems,
								"todo": nextEventTodo,
								"quests": nextEventDungeon
							}

							setFileData('./data/data-event-next.json', newEventData);

							message.channel.send("Next event data `"+nextEventName+"` is saved");
						break;

						// show command list and quick example
						case 'help':
							message.channel.send({
								"embed":{
									"title": "Next Event Update Commands List",
									"color": 16744192,
									"fields": [
										{
											"name": "Name ("+guildPrefix+"eventnext name <event name>)",
											"value": "Set the event name"
										},
										{
											"name": "Duration ("+guildPrefix+"eventnext duration <time>)",
											"value": "Set the event duration"
										},
										{
											"name": "Event Notice Page ("+guildPrefix+"eventnext url <address>)",
											"value": "Set the event notice page"
										},
										{
											"name": "Redeem Duration ("+guildPrefix+"eventnext redeem <time>)",
											"value": "Set the event redeem duration"
										},
										{
											"name": "Daily Rewards ("+guildPrefix+"eventnext daily <item>)",
											"value": "Set the daily challenges rewards item"
										},
										{
											"name": "Weekly Rewards ("+guildPrefix+"eventnext weekly <item>)",
											"value": "Set the weekly challenges rewards item"
										},
										{
											"name": "Items ("+guildPrefix+"eventnext item <item 1, item 2>)",
											"value": "Set the event items, currency goes here too"
										},
										{
											"name": "Todo ("+guildPrefix+"eventnext todo <things to do 1, things to do 2>)",
											"value": "Set the quest to do list (Daily, Weekly, etc etc)"
										},
										{
											"name": "Dungeon/Quests list ("+guildPrefix+"eventnext dungeon <location, quest name/what to do, day, type>)",
											"value": "Set the event dungeon or quests list\n- `location`: Dungeon Location\n- `quest name`: Quest Name\n- `day`: Quest day (day started on sunday, ended at saturday), write `all` if it's all week\n- `type`: Quest type (0 Daily Quest, 1 Dynamic Quest, 2 Event Quest)\n\n * To edit a dungeon/quest data do `"+guildPrefix+"eventnext dungeon edit <index, location, quest name/what to do, day, type>\n - `index`: location of the quest in dungeon array, to check do `"+guildPrefix+"eventnext dungeon list`"
										},
									],
									"footer": {
										"text": "Jinsoyun Bot Configuration - Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ HH:MM")+" UTC"
									},
								}
							});
						break;

						// show saved next event data
						default:
							let eventNext = await getFileData("./data/data-event-next.json");

							let eventToDoNext = eventNext.todo;
							let eventQuestsNext = "";
							let eventDateNext = new Date();
								eventDateNext = eventDateNext.getUTCDay();
							let todayEventNext = [];
							var k = 0;
			
							// getting index of event that have the same day with today
							for(var i = 0; i < eventNext.quests.length; i++){
								for(var j = 0; j < 7; j++){
									if(eventNext.quests[i].day[j] == getDay(eventDateNext)){					
										todayEventNext[k] = i;
										k++;
									}
								}
							}
			
							// for searching event that have the same index with day searching and then inserting the correct one into variable for output later
							for(var i = 0; i < todayEventNext.length; i++){
								eventQuestsNext = eventQuestsNext + ("**"+eventNext.quests[todayEventNext[i]].location+"** - "+eventNext.quests[todayEventNext[i]].quest+" "+getQuestType(eventNext.quests[todayEventNext[i]].type)+"\n")
							}
							
							// output
							message.channel.send("Saved next event data, to edit the data do `"+guildPrefix+"eventnext help`",{
								"embed": {
									"author":{
										"name": "Current Event",
										"icon_url": "https://cdn.discordapp.com/emojis/479872059376271360.png?v=1"
									},
									"title": eventNext.name,
									"url": eventNext.url,
									"description": "**Duration**: "+eventNext.duration+"\n**Redemption Period**: "+eventNext.redeem+"\n**Event Item**: "+setDataFormatting(eventNext.rewards.items)+"\n**What to do**: "+setDataFormatting(eventToDoNext),
									"color": 1879160,
									"footer": {
										"icon_url": "https://static.bladeandsoul.com/img/global/nav-bs-logo.png",
										"text": "Blade & Soul Event - Generated at "+dateformat(Date.now(), "UTC:dd-mm-yy @ HH:MM")+" UTC"
									},
									"fields":[
										{
											"name": dateformat(Date.now(), "UTC:dddd")+"'s To-do List (Location - Quest `Type`)",
											"value": eventQuestsNext 								
										}
									]
								}	
							});	
						break;
					}
				}else{
					message.channel.send("I'm sorry but you don't have permission to use this command");
				}	
				
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: "+cmd+" command received");	
			break;

			// data gathering start from here
			case 'getupdate':	
				let msg;
				if(message.author != null){
					msg = await message.channel.send("Starting data update...");
					
				}	
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: Starting data update..");	
				
				// list of class data source (skillset, elements)
				let classData = await getFileData("./data/class/list-class-dataset-source.json");

				// item data
				let silveressItem = configData.API_ADDRESS[2].address;

				var errCount = 0;
				let errLocation = [];
				let errMsg = "";

				// console logging and message if it's updated manually
				if(message.author != null){
					msg.edit("Updating items data...");
				}
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: Updating items data...");	

				/* description: getting and updating item data
				 * variable   : 'silveressItem' silveress item API address
				 */
				fs.writeFile('./data/list-item.json', JSON.stringify(await getSiteData(silveressItem), null, '\t'), function (err) {
					if(err){
						console.log(err);
						errCount++;
						errLocation[errCount] = "list-item data"
						errMsg = errMsg + (err + "\n");
					}
				})	

				// console logging and message if it's updated manually
				if(message.author != null){
					msg.edit("Updating class data...");
				}
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: Updating class data...");	

				/* description: updating class data
				 */
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

					// console log and status message
					if(message.author != null){
						msg.edit("Updating "+classData[i].name+" data...");
					}
					console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: Fetching "+classData[i].name+" attributes data...");

					/* description: getting and writing attributes data into a .json file
					 * variable:    'classData[i].name' class name
					 */
					fs.writeFile('./data/class/'+classData[i].name+'/attributes.json', JSON.stringify(await getSiteData(classData[i].attributes), null, '\t'), function (err) {
						if(err){
							console.log(err);
							errCount++;
							errLocation[errCount] = classData[i].name + " attributes data"
							errMsg = errMsg + (err + "\n");
						}
					})

					// delay so the server wont get spammed, seems useless but nice touch
					await delay(1000);

					// getting the elements data for said class
					// variable: 'classData[i].name' class name
					var classAttributeData = await getFileData('./data/class/'+classData[i].name+'/attributes.json');

					/* description: getting and writing class skillset depending on its attribute
					 * variable   : 'classData[i].name' for class name
					 *              'classAttributeData.records[j].attribute' for the element
					 *              'classData[i].skillsets[j]' getting the skillset address location (see list-class-dataset-source.json for details)
					 */
					try{
						for(var j = 0; j < classAttributeData.records.length; j++){
							// console log and status message
							console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: Fetching "+classAttributeData.records[j].attribute+" element data...");

							// writing the data
							fs.writeFile('./data/class/'+classData[i].name+'/'+classAttributeData.records[j].attribute+'.json', JSON.stringify(await getSiteData(classData[i].skillsets[j]), null, '\t'), function (err) {
								if(err){
									console.log(err);
									errCount++;
									errLocation[errCount] = classData[i].name + classAttributeData.records[j].attribute + " skillset data"
									errMsg = errMsg + (err + "\n");
								}
							})
						}
					}catch(error){
						errCount++;
						errLocation[errCount] = classData[i].name+" element data"
						errMsg = errMsg + (err + "\n");
					}				
				}
				// console logging
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: Item and class data updated with "+errCount+" problem(s)");

				/* description: checking, counting and telling the errors if there's any (seems not working if the error is in getSiteData function)
				 * variable   : 'errLocation' error location
				 *              'errMsg' error message
				 */				
				if(errCount != 0){
					console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Warning: Problem occured on: "+errLocation+", please check the log");
					message.guild.channels.find(x => x.name == "errors").send("Caught an issue on `"+errLocation+"`\n```"+errMsg+"```");
				}
				
				// writing when the data got updated
				fileData.ITEM_DATA = dateformat(Date.now(), "UTC:dd mmmm yyyy HH:MM:ss");
				fileData.CLASS_DATA = dateformat(Date.now(), "UTC:dd mmmm yyyy HH:MM:ss");

				setFileData("./data/data-files.json", fileData);

				if(message.author != null){
					msg.edit("Item and class data updated manually with "+errCount+" issue(s)");
				}

			break;

			// Fetching the market data
			case 'getmarketdata':
				let itemData = await getFileData("./data/list-item.json"); //item data
				let marketDataStored = await getFileData("./data/list-market-data.json"); //stored market data

				let marketDataCurrent = await getSiteData(configData.API_ADDRESS[1].address); //fecthing the current data (one listing, lowest)

				let marketListCurrent = [];
				let storedPriceEach = 0;	

				let idx = 1;
				let found = false;
				let foundCount = 0;
				var k = 1;

				let archivedData = 0;
				
				// merging the data (item data and market data)
				for(var i = 0; i < itemData.length; i++){
					for(let j = 1; j < marketDataCurrent.length; j++){
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

				let updateDate = new Date();
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

					// making a copy for archive
					setFileData("./archive/market-data-archive "+Date.now()+".json", JSON.stringify(marketListCurrent, null, '\t'))

					archivedData = marketListCurrent.length - 1;	
				}			

				// writing the data into a file
				setFileData("./data/list-market-data.json", marketListCurrent);

				// writing when the data got updated
				fileData.MARKET_DATA = dateformat(Date.now(), "UTC:dd mmmm yyyy HH:MM:ss");
				setFileData("./data/data-files.json", fileData);

				if(message.author != null){
					message.channel.send(foundCount+" market data updated manually");
				}

				
				console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: "+foundCount+" market data updated, "+archivedData+" data archived");
				foundCount = 0;	
			break;

			case 'set':
				var adminAccess = message.channel.permissionsFor(message.author).has("ADMINISTRATOR", false);
				let configQuery = message.toString().split(' ');
					configQuery = configQuery.splice(1);

				let guildConfigData = guildConfig[guildConfigIdx];	

				if(adminAccess == true){
					let guildConfig = await getFileData('./data/guilds.json');

					switch(configQuery[0]){
						case 'add':	
							let defaultConfig = await getFileData('config.json');
							let found = false;
						
							for(var i = 0; i < guildConfig.length; i ++){
									if(message.guild.id == guildConfig[i].GUILD_ID){
									found = true;
								}
							}

							if(found == false){
								configData = {
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
							let guildNameNew = "";

							if(configQuery.length >= 3){
								for(var i = 1; i <configQuery.length; i++){
									guildNameNew = guildNameNew +" "+ configQuery[i];
								}
								guildNameNew = guildNameNew.substr(1);
							}else{
								guildNameNew = configQuery[1];
							}

							guildConfig[guildConfigIdx].GUILD_NAME = guildNameNew;
							guildConfig[guildConfigIdx].GUILD_ICON = message.guild.iconURL;

							setFileData('./data/guilds.json', guildConfig);

							message.channel.send("Your server data is updated");

							console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: Guild data with id '"+message.guild.id+"' has been updated");
						break;

						case 'prefix':
							let guildPrefix = configQuery[1];

							guildConfig[guildConfigIdx].PREFIX = guildPrefix;

							setFileData('./data/guilds.json', guildConfig);

							message.channel.send("Prefix for this server changed to `"+guildPrefix+"`");
							console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: "+message.guild.name+" prefix data updated");
						break;

						case 'channel':
							let typeQuery = configQuery[1];

							let channelNameQuery = "";
							if(configQuery.length > 3){
								for(var i = 2; i <configQuery.length; i++){
									channelNameQuery = channelNameQuery +"-"+ configQuery[i];
								}
								channelNameQuery = channelNameQuery.substr(1);
							}else{
								channelNameQuery = configQuery[2];
							}

							let success = true;

							switch(typeQuery){
								case 'text':
									guildConfig[guildConfigIdx].CHANNEL_TEXT_MAIN = channelNameQuery;
								break;
								case 'intro':
									guildConfig[guildConfigIdx].CHANNEL_MEMBER_GATE = channelNameQuery;
								break;
								case 'news':
									guildConfig[guildConfigIdx].CHANNEL_NEWS_ANNOUNCE = channelNameQuery;
								break;
								case 'admin':
									guildConfig[guildConfigIdx].CHANNEL_ADMIN = channelNameQuery;
								break;
								case 'activity':
									guildConfig[guildConfigIdx].CHANNEL_MEMBERACTIVITY = channelNameQuery;
								break;
								case 'daily':
								guildConfig[guildConfigIdx].CHANNEL_DAILY_ANNOUNCE = channelNameQuery;
								break;
								case 'weekly':
								guildConfig[guildConfigIdx].CHANNEL_WEEKLY_ANNOUNCE = channelNameQuery;
								break;
								case 'event':
								guildConfig[guildConfigIdx].CHANNEL_EVENT_ANNOUNCE = channelNameQuery;
								break;
								case 'koldrak':
								guildConfig[guildConfigIdx].CHANNEL_KOLDRAK_ANNOUNCE = channelNameQuery;
								break;
								
								default:
									message.channel.send("I'm sorry I can't find that type of channel\n\nAvailable type: `text`, `intro`, `news`, `admin`, `activity`, `daily`, `weekly`, `event`, `koldrak`");

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
											"name": "Main Text - `text`",
											"value": "`"+guildConfigData.CHANNEL_TEXT_MAIN+"`"
										},
										{
											"name": "New Member - `intro`",
											"value": "`"+guildConfigData.CHANNEL_MEMBER_GATE+"`"
										},
										{
											"name": "Admin - `admin`",
											"value": "`"+guildConfigData.CHANNEL_ADMIN+"`"
										},
										{
											"name": "Member's Activity Log - `activity`",
											"value": "`"+guildConfigData.CHANNEL_MEMBERACTIVITY+"`"
										},
										{
											"name": "Blade & Soul Twitter News - `news`",
											"value": "`"+guildConfigData.CHANNEL_NEWS_ANNOUNCE+"`"
										},
										{
											"name": "Daily Announcement - `daily`",
											"value": "`"+guildConfigData.CHANNEL_DAILY_ANNOUNCE+"`"
										},
										{
											"name": "Weekly Announcement - `weekly`",
											"value": "`"+guildConfigData.CHANNEL_WEEKLY_ANNOUNCE+"`"
										},
										{
											"name": "Event Announcement - `event`",
											"value": "`"+guildConfigData.CHANNEL_EVENT_ANNOUNCE+"`"
										},
										{
											"name": "Koldrak's Lair Announcement - `koldrak`",
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
											"value": "Changing the default channel for your server\n\n**Type** \n`text` main text channel\n`intro` default new member channel\n`news` default news channel for twitter hook\n`admin` default admin only channel for administrator commands\n`daily` default channel for daily challenges annoucement\n`weekly` default channel for weekly challenges annoucement\n`event` default channel for current event summary\n`koldrak` default channel for koldrak's lair access annoucement\n`activity` default channel for server member activity (joined, left)\n\n**Channel**\n`channel-name` channel name to replace the current one (there can't be space between words)\n`disable` to disable this function"
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

			// bot system related commands, currently only available for bot admin
			case 'debug':
				// debug commands is currently only can be used by bot author only, if you want to change this edit the 'config.json' DEFAULT_BOT_ADMIN variable
				if(message.author.id == configData.DEFAULT_BOT_ADMIN){
					let debugQuery = message.toString().split(' ');
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

								clientDiscord.user.setPresence({ game: { name: 'at Hongmoon School' }, status: 'online' })
									.catch(console.error);
								message.channel.send("Maintenance mode is disabled, all service is returning to normal");	
								console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Warning: Maintenance mode is disabled");		
							break;
							}
						break;

						case 'data':
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
								let nextEvent = await getFileData("./data/data-event-next.json");

								setFileData('./data/data-event.json', nextEvent);

								message.channel.send(nextEvent.name+" event data is now live");
								console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Info: "+nextEvent.name+" event data is now live");
							}else{
								message.channel.send("Maintenance mode is disabled, enable maintenance mode to use this command");
							}

							// save the time when the data got updated
							fileData.EVENT_DATA = dateformat(Date.now(), "UTC:dd mmmm yyyy HH:MM:ss");

							setFileData("./data/data-files.json", fileData);
						break;

						case 'guilds':
							let guildsList = clientDiscord.guilds.map(getGuildName);
							let guildsCount = guildsList.length;
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
							let filePath = debugQuery[1];
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
				let errQuery = message.toString().substring(1).split('|');
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
		let payloadStatus = "rejected";
		// Filtering data so it only getting data from specified user
		if((tweet.user.screen_name == config.TWITTER_STREAM_SCREENNAME[0] || tweet.user.screen_name == config.TWITTER_STREAM_SCREENNAME[1]) || (tweet.user.screen_name == config.TWITTER_STREAM_SCREENNAME[2])){
			// Variable for filtering
			var twtFilter = tweet.text.toString().substring(0).split(" ");

			// Filtering the "RT" and "mention" stuff
			if(twtFilter[0] == "RT" || twtFilter[0].charAt(0) == "@"){
				payloadStatus = "rejected";
			}else{	
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

				payloadStatus = "received";

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
	});
  
	stream.on('error', function(error) {
		console.log(" [ "+dateformat(Date.now(), "UTC:dd-mm-yy HH:MM:ss")+" ] > Unable to get Twitter data, "+error);
		clientDiscord.emit("message", "!err |"+error.stack+"|");
	});
})

/* 
 * ontime runtime for automated message system
 * details: https://www.npmjs.com/package/ontime
 * 'cycle': time when the event triggered
 * 'utc': utc timezone (true if yes)
 * 'clientDiscord.emit("message", "content")': message event emitter
 */ 

// Koldrak (Dragon) notification
ontime({
	// Time format is on UTC
	cycle: ['00:50:00', '03:50:00', '06:50:00', '18:50:00', '21:50:00'], 
	utc: true
}, function (koldrak){
	// emitting message event
	clientDiscord.emit("message", "!koldrak alert");
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