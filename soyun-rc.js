const Discord = require("discord.js");
const client = new Discord.Client();

// Initializing
client.on("ready", () => {
	console.log("Starting.../");
	console.log("Connected!");
	console.log("------------");
	console.log("bot is ready\n");
	
	client.user.setUsername("Jinsoyun - Beta");
	client.user.setPresence({ game: { name: 'with Hongmoon School' }, status: 'online' })
		.catch(console.error);
		
	console.log("\n-------------\n");	
});

// Bot global variable
// Default class list
var classArr = ["blade master", "destroyer", "summoner", "force master", "kung fu master", "assassin", "blade dancer", "warlock", "soul fighter", "gunslinger"];

// User joined the guild
client.on("guildMemberAdd", (member) => {
	// Add 'cricket' role so new member so they cant access anything until they do !join for organizing reason
	member.addRole(member.guild.roles.find("name", "cricket"));
	
	// Welcoming message and guide to join
	member.guild.channels.find("name", "welcome").send('Hi ***'+member.user.username+'***, welcome to ***'+member.guild.name+'***!\n\nTheres a one thing you need to do before you can talk with others, can you tell me your in-game nickname and your main class? to do that please write ***!join "username here" "your class here"***, here is an example: ***!join "Jinsoyun" "Blade Master"***, thank you! ^^ ');

	// Console logging
	console.log("\n > "+member.user.username+" has joined\n");
	console.log("\n > "+member.user.username+" role is changed to 'cricket' until "+member.user.username+" do !join\n");
});

// User commands
client.on("message", (message) => {
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
				client.channels.find("name", "general").send("Please welcome our new "+joinClass+" ***"+joinUsername+"***!");
				
				// Console logging
				console.log("\n > "+message.author.username+" do !join on "+message.createdAt+" ["+message+"] ");
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
				console.log("\n > "+usernameTemp+" do !username on "+message.createdAt+" ["+message+"] ");
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
				message.channel.send("Your class changed to ***"+classValue+"***");
				
				// Console logging
				console.log("\n > "+message.author.username+" do !class on "+message.createdAt+" ["+message+"] ");
			break;
         }
     }
});

// Bot token here
client.login("NDI3Njc3NTkwMzU5Mzc1ODcz.DbHRxQ.4eNdBk5nJgTLsU-KdziCCkikSlY");