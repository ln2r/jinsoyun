const Discord = require("discord.js");
const Twitter = require("twitter");
const secret = require("./secret.json");
const config = require("./config.json");
const dc = require("./daily-challenges.json");

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

// Twitter hook variables
var twtUsername;
var twtScreenName
var twtText;
var twtAvatar;
var twtCreatedAt;
var twtTimestamp;
var twtColor;
var twtFilter;

// Discord stuff start here
clientDiscord.on("ready", () => {
	console.log(" [ "+Date.now()+" ] > bot is alive and ready for command(s)");
	
	clientDiscord.user.setUsername("Jinsoyun");
	clientDiscord.user.setPresence({ game: { name: 'with Hongmoon School' }, status: 'online' })
		.catch(console.error);
});

// User joined the guild
clientDiscord.on("guildMemberAdd", (member) => {
	// Add 'cricket' role so new member so they cant access anything until they do !join for organizing reason
	member.addRole(member.guild.roles.find("name", "cricket"));
	
	// Welcoming message and guide to join
	member.guild.channels.find("name", config.DEFAULT_MEMBER_GATE).send('Hi ***'+member.user.username+'***, welcome to ***'+member.guild.name+'***!\n\nTheres one thing you need to do before you can talk with others, can you tell me your in-game nickname and your class? to do that please write ***!reg "username here" "your class here"***, here is an example how to do so: ***!reg "Jinsoyun" "Blade Master"***, thank you! ^^ \nIf you need some assistance you can **@mention** or **DM** available officers');

	// Console logging
	console.log(" [ "+Date.now()+" ] > "+member.user.username+" has joined");
	console.log(" [ "+Date.now()+" ] > "+member.user.username+" role is changed to 'cricket' until "+member.user.username+" do !reg");
});

// User commands
clientDiscord.on("message", (message) => {
  if (message.toString().substring(0, 1) == '!') {
        var args = message.toString().substring(1).split(' ');
        var cmd = args[0];
       
        args = args.splice(1);
        switch(cmd) {
            // Connection test
			case 'soyun':
				var soyunQuerry = message.toString().substring(1).split(' ');

				soyunQuerry = soyunQuerry.splice(1);

				switch(soyunQuerry[0]){
					case 'help':
						message.channel.send('Here is some stuff you can ask me to do:\n\n> For changing nickname you can do `!username "desired username"` (it will be automatically capitalized dont worry :wink: )\n> For changing class you can do `!class "desired class"`\n> For checking today daily challenges you can do `!dc`\n\nIf you need some assistance you can **@mention** or **DM** availble officers');
					break;

					default:
						message.channel.send("Yes master?");
				};

				// Console logging
				console.log(" [ "+Date.now()+" ] > "+message.author.username+" do "+message);
            break;
			
			// Server join = username change and role add
			case 'reg':
				var joinQuerry = message.toString().substring(1).split('"');
				var joinUsername = (joinQuerry[1]);
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
					joinUsername = joinUsername.replace(/\b\w/g, l => l.toUpperCase());
					
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
				}else{
					// Telling them whats wrong
					message.channel.send("Im sorry, i cant seems to find the class you wrote. If this seems to be a mistake please **@mention** or **DM** available officers for some assistance");
					querryStatus = false;
				}

				// Console logging
				console.log(" [ "+Date.now()+" ] > "+message.author.username+" do "+message+", status: "+payloadStatus);
				payloadStatus = "rejected";
			break;
			
			// Username change
			case 'username':
				var usernameQuerry = message.toString().substring(1).split('"');
				var usernameValue = (usernameQuerry[1]);
				var usernameTemp = message.author.username; // temporary username storage for logging
				
				usernameValue = usernameValue.replace(/\b\w/g, l => l.toUpperCase());

				// Changing message author username
				message.guild.members.get(message.author.id).setNickname(usernameValue);
				message.channel.send("Your username changed to "+usernameValue);

				// Console logging
				console.log(" [ "+Date.now()+" ] > "+message.author.username+" do "+message);
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
						break;
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
				console.log(" [ "+Date.now()+" ] > "+message.author.username+" do "+message+", status: "+payloadStatus);
				payloadStatus = "rejected";
			break;

			case 'twcon':
				clientDiscord.channels.find("name", config.DEFAULT_NEWS_CHANNEL).send({
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

				// Console logging
				console.log(" [ "+Date.now()+" ] > !twcon triggered, "+message);
			break;

			// First time setup (making roles and necesarry channels)
			case 'setup':
				// Console logging
				console.log(" [ "+Date.now()+" ] > !setup triggered, "+message);

				// Making the roles with class array as reference
				for(i = 0; i < classArr.length;){
					message.guild.createRole({
						name: classArr[i]
					}).catch(console.error);
					i++;
					// Console logging
					console.log(" [ "+Date.now()+" ] > "+classArr[i]+" role created");
				};

				// Making "news" channel
				message.guild.createChannel(config.DEFAULT_NEWS_CHANNEL, "text");
				// Console logging
				console.log(" [ "+Date.now()+" ] > "+config.DEFAULT_NEWS_CHANNEL+" channel created");
			break;

			// Testing channel making (remove for release)
			case 'chmake':
				message.guild.createChannel("test-channel", "text");
			break;
			
			// Today daily challenge
			case 'daily':
				// Getting the current date
				var dcDay = new Date();

				var dcColor;
				var dcQuests;

				var dcReward1;
				var dcReward2;
				var dcReward3;
				var dcReward4;

				// Checking the day and inserting the payload
				switch(dcDay.getUTCDay()){
					case 0:
						dcColor = dc.sunday.color;
						dcQuests = dc.sunday.quests;
						dcReward1 = clientDiscord.emojis.find("name", dc.sunday.rewards[0]);
						dcReward2 = clientDiscord.emojis.find("name", dc.sunday.rewards[1]);
						dcReward3 = clientDiscord.emojis.find("name", dc.sunday.rewards[2]);
						dcReward4 = clientDiscord.emojis.find("name", dc.sunday.rewards[3]);

						payloadStatus = "received";
					break;

					case 1:
						dcColor = dc.monday.color;
						dcQuests = dc.monday.quests;
						dcReward1 = clientDiscord.emojis.find("name", dc.monday.rewards[0]);
						dcReward2 = clientDiscord.emojis.find("name", dc.monday.rewards[1]);
						dcReward3 = clientDiscord.emojis.find("name", dc.monday.rewards[2]);
						dcReward4 = clientDiscord.emojis.find("name", dc.monday.rewards[3]);

						payloadStatus = "received";
					break;
					
					case 2:
						dcColor = dc.tuesday.color;
						dcQuests = dc.tuesday.quests;
						dcReward1 = clientDiscord.emojis.find("name", dc.tuesday.rewards[0]);
						dcReward2 = clientDiscord.emojis.find("name", dc.tuesday.rewards[1]);
						dcReward3 = clientDiscord.emojis.find("name", dc.tuesday.rewards[2]);
						dcReward4 = clientDiscord.emojis.find("name", dc.tuesday.rewards[3]);

						payloadStatus = "received";
					break;

					case 3:
						dcColor = dc.wednesday.color;
						dcQuests = dc.wednesday.quests;
						dcReward1 = clientDiscord.emojis.find("name", dc.wednesday.rewards[0]);
						dcReward2 = clientDiscord.emojis.find("name", dc.wednesday.rewards[1]);
						dcReward3 = clientDiscord.emojis.find("name", dc.wednesday.rewards[2]);
						dcReward4 = clientDiscord.emojis.find("name", dc.wednesday.rewards[3]);

						payloadStatus = "received";
					break;

					case 4:
						dcColor = dc.thursday.color;
						dcQuests = dc.thursday.quests;
						dcReward1 = clientDiscord.emojis.find("name", dc.thursday.rewards[0]);
						dcReward2 = clientDiscord.emojis.find("name", dc.thursday.rewards[1]);
						dcReward3 = clientDiscord.emojis.find("name", dc.thursday.rewards[2]);
						dcReward4 = clientDiscord.emojis.find("name", dc.thursday.rewards[3]);

						payloadStatus = "received";
					break;

					case 5:
						dcColor = dc.friday.color;
						dcQuests = dc.friday.quests;
						dcReward1 = clientDiscord.emojis.find("name", dc.friday.rewards[0]);
						dcReward2 = clientDiscord.emojis.find("name", dc.friday.rewards[1]);
						dcReward3 = clientDiscord.emojis.find("name", dc.friday.rewards[2]);
						dcReward4 = clientDiscord.emojis.find("name", dc.friday.rewards[3]);

						payloadStatus = "received";
					break;

					case 6:
						dcColor = dc.saturday.color;
						dcQuests = dc.saturday.quests;
						dcReward1 = clientDiscord.emojis.find("name", dc.saturday.rewards[0]);
						dcReward2 = clientDiscord.emojis.find("name", dc.saturday.rewards[1]);
						dcReward3 = clientDiscord.emojis.find("name", dc.saturday.rewards[2]);
						dcReward4 = clientDiscord.emojis.find("name", dc.saturday.rewards[3]);

						payloadStatus = "received";			
					break;
				}
				
				// Sending out the payload
				message.channel.send("Today Daily Challenges", {
					"embed":{
						"color": dcColor,
						"description": dcQuests
					}
				}).then(function(message){
					// Showing rewards as "reactions"
					message.react(dcReward1);
					message.react(dcReward2);
					message.react(dcReward3);
					message.react(dcReward4);
				}).catch(console.error);

				// Console logging
				console.log(" [ "+Date.now()+" ] > "+message.author.username+" do "+message+", status: "+payloadStatus);
				payloadStatus = "rejected";
			break;
         }
     }
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
				twtUsername = tweet.user.name.toString();
				twtScreenName = tweet.user.screen_name.toString();
				twtText = tweet.text.toString();
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

				// Tringgering the !twcon so the bot will write a message with content from twitter
				clientDiscord.emit("message", "!twcon");
			}
		}
		// Console logging
		console.log(" [ "+Date.now()+" ] > Tweet recived from "+tweet.user.screen_name+", status: "+payloadStatus);
		payloadStatus = "rejected";
	});
  
	stream.on('error', function(error) {
	  console.log(error);
	});
  });