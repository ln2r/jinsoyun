const Discord = require("discord.js");
const Twitter = require("twitter");
const config = require("./config.json");
const emitterDiscord = require('events');

const hookTwitter = new Discord.WebhookClient(config.DISCORD_WEBHOOK_ID, config.DISCORD_WEBHOOK_TOKEN);

const clientDiscord = new Discord.Client();
const clientTwitter = new Twitter({
	consumer_key: config.TWITTER_CONSUMER_KEY,
	consumer_secret: config.TWITTER_CONSUMER_SECRET,
	access_token_key: config.TWITTER_ACCESS_TOKEN_KEY,
	access_token_secret: config.TWITTER_ACCESS_TOKEN_SECRET
  });

// Default class list
var classArr = ["blade master", "destroyer", "summoner", "force master", "kung fu master", "assassin", "blade dancer", "warlock", "soul fighter", "gunslinger"];
// Twitter hook variables
var twtUsername;
var twtText;
var twtAvatar;
var twtCreatedAt;
var twtTimestamp;


// Discord stuff start here
clientDiscord.on("ready", () => {
	console.log(" [ "+Date.now()+" ] > bot is alive and ready for command(s)");
	
	clientDiscord.user.setUsername("Jinsoyun - Beta");
	clientDiscord.user.setPresence({ game: { name: 'with Hongmoon School' }, status: 'online' })
		.catch(console.error);
});

// User joined the guild
clientDiscord.on("guildMemberAdd", (member) => {
	// Add 'cricket' role so new member so they cant access anything until they do !join for organizing reason
	member.addRole(member.guild.roles.find("name", "cricket"));
	
	// Welcoming message and guide to join
	member.guild.channels.find("name", "welcome").send('Hi ***'+member.user.username+'***, welcome to ***'+member.guild.name+'***!\n\nTheres a one thing you need to do before you can talk with others, can you tell me your in-game nickname and your main class? to do that please write ***!join "username here" "your class here"***, here is an example: ***!join "Jinsoyun" "Blade Master"***, thank you! ^^ ');

	// Console logging
	console.log(" [ "+Date.now()+" ] > "+member.user.username+" has joined");
	console.log(" [ "+Date.now()+" ] > "+member.user.username+" role is changed to 'cricket' until "+member.user.username+" do !join");
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
						message.channel.send('Here is some stuff you can ask me to do:\n\n> For changing nickname you can do `!username "desired username"` (it will be automatically capitalized dont worry ;) )\n> For changing class you can do `!class "desired class"`\n\nIf you need more assistance you can ***@mention*** available officers');
					break;

					default:
						message.channel.send("Yes master?");
				};

				// Console logging
				console.log(" [ "+Date.now()+" ] > "+message.author.username+" do "+message);
            break;
			
			// Server join = username change and role add
			case 'join':
				var joinQuerry = message.toString().substring(1).split('"');
				var joinUsername = (joinQuerry[1]);
				var joinClass = (joinQuerry[3]);
								
				joinClass = joinClass.toLowerCase(); // Converting class value to lower case so input wont be missmatched

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
				clientDiscord.channels.find("name", "general").send("Please welcome our new "+joinClass+" ***"+joinUsername+"***!");
				
				// Console logging
				console.log(" [ "+Date.now()+" ] > "+message.author.username+" do "+message);
			break;
			
			// Username change
			case 'username':
				var usernameQuerry = message.toString().substring(1).split('"');
				var usernameValue = (usernameQuerry[1]);
				var usernameTemp = message.author.username; // temporary username storage for logging
				
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
				var i; // for loop, ignore

				classValue = classValue.toLowerCase(); // Converting class value to lower case so input wont be missmatched

				// Removing user current class
				// I know this is stupid way to do it, but it have to do for now
				for(i = 0; i < classArr.length;){
					message.guild.members.get(message.author.id).removeRole(message.guild.roles.find("name", classArr[i]));
					i++
				};

				// Adding new role to user according their command
				message.guild.members.get(message.author.id).addRole(message.guild.roles.find("name", classValue));

				// Output so user know it class changed
				message.channel.send("Your class changed to **"+classValue+"**");

				// Console logging
				console.log(" [ "+Date.now()+" ] > "+message.author.username+" do "+message);
			break;

			case 'twcon':
				clientDiscord.channels.find("name", "lab").send("triggered, payload:\n `"+twtUsername+"`\n `"+twtText+"`\n `"+twtTimestamp+"`\n `"+twtAvatar+"`");
				hookTwitter.send("["+twtUsername+" - "+twtCreatedAt+" UTC]\n`"+twtText+"`");

				/* Got limited, moved to comment for now
				hookTwitter.sendSlackMessage({
					"attachments": 	[{
							"color": "#ffa500",
							"title": twtUsername,
							"title_link": "https://twitter.com/BladeAndSoulOps",
							"text": twtText,
							"footer": twtUsername,
							"footer_icon": twtAvatar,
							"ts": twtTimestamp
					}]
				}).catch(console.error);
				*/

				// Console logging
				console.log(" [ "+Date.now()+" ] > !twcon happened "+message);
			break;
         }
     }
});

// Bot token here
clientDiscord.login(config.DISCORD_APP_TOKEN);

// Twitter hook
// Getting user tweet, parameter used: user id, e.g: "12345". You can get user id via http://gettwitterid.com/
clientTwitter.stream('statuses/filter', {follow: config.TWITTER_STREAM_ID},  function(stream) {
	stream.on('data', function(tweet) {
		// Filtering data so it only getting data from specified user
		if(tweet.user.screen_name == config.TWITTER_STREAM_SCREENNAME){
			twtUsername = tweet.user.name;
			twtText = tweet.text;
			twtAvatar = tweet.user.profile_image_url;
			twtCreatedAt = tweet.created_at;
			twtTimestamp = tweet.timestamp_ms;

			clientDiscord.emit("message", "!twcon");
		}
		console.log(" [ "+Date.now()+" ] > Tweet recived from "+tweet.user.screen_name);
	});
  
	stream.on('error', function(error) {
	  console.log(error);
	});
  });
