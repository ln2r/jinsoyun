const Discord = require("discord.js");
const client = new Discord.Client();

client.on("ready", () => {
	console.log("Starting.../");
	console.log("Connected!");
	console.log("------------");
	console.log("bot is ready\n");
	
	client.user.setUsername("Jinsoyun");
	client.user.setPresence({ game: { name: 'with Hongmoon School' }, status: 'online' })
		.catch(console.error);
		
	console.log("\n-------------\n");	
});

client.on("guildMemberAdd", member => {
	let newMember = member.guild;
	console.log(newMember+" joined");
});

client.on("message", (message) => {
  if (message.toString().substring(0, 1) == '!') {
        var args = message.toString().substring(1).split(' ');
        var cmd = args[0];
       
        args = args.splice(1);
        switch(cmd) {
            // Ping-Pong bot test
            case 'ping':
				message.channel.send("pong!")
            break;
			
			// Server join = username change and role add
			case 'join':
				var joinQuerry = message.toString().substring(1).split('"');
				var joinUsername = (joinQuerry[1]);
				var joinClass = (joinQuerry[3]);
				
				// Convert to capitalize to make it easy and 'prettier'
				joinClass = joinClass.replace(/\b\w/g, l => l.toUpperCase());
				joinUsername = joinUsername.replace(/\b\w/g, l => l.toUpperCase());
				
				// Setting user role to match the user class
				message.guild.members.get(message.author.id).addRole(message.guild.roles.find("name", joinClass));
				// Adding "member" role so user can talk
				message.guild.members.get(message.author.id).addRole(message.guild.roles.find("name", "member"));
				// Removing "fresh blood" role
				message.guild.members.get(message.author.id).removeRole(message.guild.roles.find("name", "fresh blood"));
				
				// Setting message author username (guild owner or lower)
				message.guild.members.get(message.author.id).setNickname(joinUsername);
				message.channel.send("Thank you for joining ***"+message.guild.name+"***.\nYour username is ***"+joinUsername+"***, and your class is ***"+joinClass+"***");
				
				// Console logging
				console.log("\n > "+message.author.id+" do !join on "+message.createdTimestamp+" ["+message+"] ");
			break;
			
			// Username change
			case 'username':
				var usernameChangeQuerry = message.toString().substring(1).split('"');
				var usernameChangeValue = (usernameChangeQuerry[1]);
				
				// Changing message author username
				message.guild.members.get(message.author.id).setNickname(usernameChangeValue);
				
				// Console logging
				console.log("\n > "+message.author.id+" do !username on "+message.createdTimestamp+" ["+message+"] ");
			break;
			
			// Class change
			case 'class':
				var classChangeQuerry = message.toString().substring(1).split('"');
				var classChangeValue = (usernameChangeQuerry[1]);
				
				// Changing message author username
				
				
				// Console logging
				console.log("\n > "+message.author.id+" do !username on "+message.createdTimestamp+" ["+message+"] ");
			break;
            // Just add any case commands if you want to..
         }
     }
});

// Bot token here
client.login("NDM0MjIxOTYxMTQ5ODA4NjQw.DbHS7Q.o7RRnRybW5U1bmB6TLyruv8Ny8s");