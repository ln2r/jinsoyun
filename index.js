const dotenv = require('dotenv').config();

const { CommandoClient } = require('discord.js-commando');
const Twitter = require('twitter');
const MongoClient = require('mongodb').MongoClient;
const MongoDBProvider = require('./commando-provider-mongo');
const path = require('path');
const ontime = require('ontime');
const dateformat = require('dateformat');

const { mongoGetData, sendResetNotification, mongoItemDataUpdate, sendBotReport} = require('./core');

// Discord.js Commando scripts start here
const clientDiscord = new CommandoClient({
    commandPrefix: process.env.bot_default_prefix,
    owner: process.env.bot_owner_id,
    disableEveryone: true,
    unknownCommandResponse: false,
});

clientDiscord.login(process.env.discord_secret);

clientDiscord.registry
    .registerDefaultTypes()
    .registerGroups([
        ['automation', 'Automation'],
        ['guild', 'Guild'],
        ['bns', 'Blade and Soul'],
        ['dev', 'Bot dev']
    ])
    .registerDefaultGroups()
    .registerDefaultCommands()
    .registerCommandsIn(path.join(__dirname, 'commands'));

clientDiscord
    .on('error', (error) => {
        sendBotReport(error, 'system-soyun', 'error');
        console.error(error);
    })
    .on('warn', (warn) =>{
        sendBotReport(warn, 'system-soyun', 'warning');
        console.warn(warn);
    })
    // remove "//" below to enable debug log
    //.on('debug', console.log)
    .on('disconnect', () => { console.warn('[soyun] [system] Disconnected!'); })
	.on('reconnecting', () => { console.warn('[soyun] [system] Reconnecting...'); })
    .on('ready', () => {
        console.log('[soyun] [system] Logged in and ready');
        clientDiscord.user.setPresence({
                game: { 
                    name: '@Jinsoyun help' ,
                    type: 'LISTENING',
                    }
                }
            )
            .catch((error) => {
                console.error;
                sendBotReport(error, 'onReady-soyun', 'error');
            });
    })
    .on('guildMemberAdd', async (member) => {
        let guildSettingData = await mongoGetData('guilds', {guild: member.guild.id});
            guildSettingData = guildSettingData[0];

        let memberGate = '';
        if(guildSettingData != undefined){
            memberGate = guildSettingData.settings.member_gate
        }

        //console.debug('[soyun] [gate] ['+member.guild.name+'] memberGate value: '+memberGate)
        if(memberGate != '' && memberGate != 'disable' && memberGate != undefined){
            // add cricket role if it's exist so they can't see the rest of the guild until they do join command
            if((member.guild.roles.find(role => role.name == 'cricket')) != null){
                member.addRole(member.guild.roles.find(x => x.name == 'cricket'));
            }
            member.guild.channels.find(ch => ch.id == memberGate).send(
                'Hi <@'+member.user.id+'>! Welcome to *'+member.guild.name+'*!\n\n'+

                'Before I give you access to the rest of the server, I need to know your character\'s name and class you\'re using in our clan, To do that, please use following command with your information in it\n'+
                '`@Jinsoyun join character name class name`\n'+
                '**Example**:\n'+
                '- **If you are our clan member**\n'+
                '`@Jinsoyun join jinsoyun blade dancer`\n'+
                '- **if you are our guest use `guest` instead of `class` in your command**\n'+
                '`@Jinsoyun join jinsoyun guest`\n\n'+
                
                'if you need any assistance you can mention or DM available admins, thank you ❤'
            );
        }
    })
    .on('roleDelete', async (role) => {
        //console.debug('[soyun] [event-roleDelete] role name: '+role.name);
        //console.debug('[soyun] [event-roleDelete] role id: '+role.id);

        let guildSettingsData = await mongoGetData('guilds', {guild: role.guild.id});
            guildSettingsData = guildSettingsData[0];
        
        let foundRoles = [];

        if(guildSettingsData != undefined){
            //console.debug('[soyun] [event-roleDelete] custom_roles length: '+guildSettingsData.settings.custom_roles.length);
            //console.debug('[soyun] [event-roleDelete] custom_roles data: '+guildSettingsData.settings.custom_roles);

            // getting which role is not deleted
            for(let i=0; i<guildSettingsData.settings.custom_roles.length; i++){
                if(role.id != guildSettingsData.settings.custom_roles[i]){
                    foundRoles.push(guildSettingsData.settings.custom_roles[i]);
                }
            }

            //console.debug('[soyun] [event-roleDelete] found roles: '+foundRoles);
            // update the db
            clientDiscord.emit('guildCustomRole', role.guild.id, foundRoles);
        }
    })
    .on('commandError', (error, command, message) => {
        // sending the error report to the database
        sendBotReport(command, error.name+'-'+message.guild.name, 'error');
        console.error('[soyun] ['+error.name+'] '+command.name+': '+command.message);

        // dm bot owner for the error
        let found = 0;
        clientDiscord.guilds.map(function(guild){ //looking for the guild owner data (username and discriminator)
            guild.members.map((member) => {
                if(found == 0){
                    if(member.id == message.guild.ownerID){
                        found = 1;

                        for(let i=0; i < clientDiscord.owners.length; i++){
                            clientDiscord.owners[i].send(
                                'Error Occured on `'+error.name+'`'+
                                '\n__Details__:'+
                                '\n**Time**: '+dateformat(Date.now(), 'dddd, dS mmmm yyyy, h:MM:ss TT')+
                                '\n**Location**: '+message.guild.name+
                                '\n**Guild Owner**: '+member.user.username+'#'+member.user.discriminator+
                                '\n**Content**: `'+message.content+'`'+
                                '\n**Message**:\n'+command.name+': '+command.message
                            )
                        }
                    }
                }
            })
        }) 
    });

clientDiscord.setProvider(
    MongoClient.connect(process.env.bot_mongodb_url, {useNewUrlParser: true}).then(client => new MongoDBProvider(client, process.env.bot_mongodb_db_name))
).catch((error) => {
    console.error;
    sendBotReport(error, 'mongoDBProvider-soyun', 'error');
});

// Discord.js Commando scripts end here

// Twitter stream scripts start here
const clientTwitter = new Twitter({
	consumer_key: process.env.twitter_consumer_key,
	consumer_secret: process.env.twitter_consumer_secret,
	access_token_key: process.env.twitter_access_token_key,
	access_token_secret: process.env.twitter_access_token_secret
});

clientTwitter.stream('statuses/filter', {follow: '3521186773, 819625154'}, async  function(stream) {
    let twitterAPIData = await mongoGetData('apis', {name: 'Twitter'});
    let twitterTrackedUser = twitterAPIData[0].stream_screenname;

    let twitterUserValid = false;

	stream.on('data', function(tweet) {
        let payloadStatus = 'rejected';
        
        // checking if it's valid account
        for(let i=0; i<twitterTrackedUser.length; i++){
            if(tweet.user.screen_name == twitterTrackedUser[i]){
                twitterUserValid = true;
            }
        }

		if(twitterUserValid){        
			var twtFilter = tweet.text.toString().substring(0).split(' ');

			// Filtering the 'RT' and 'mention' stuff
			if(twtFilter[0] == 'RT' || twtFilter[0].charAt(0) == '@'){
				payloadStatus = 'rejected';
			}else{	
				if(tweet.extended_tweet == null){
					twtText = tweet.text.toString().replace('&amp;','&');
				}else{
					twtText = tweet.extended_tweet.full_text.toString().replace('&amp;','&');
                }

                if(tweet.is_quote_status){
                    twtText = twtText+' RT @'+tweet.quoted_status.user.screen_name+' '+(tweet.quoted_status.text.toString().replace('&amp;','&'));
                }

				payloadStatus = 'received';

				// Making the color different for different user
				if(tweet.user.screen_name == twitterTrackedUser[0]){
					twtColor = 16753920;
				}else{
					twtColor = 1879160;
                };

                let embedData = {
                    'embed':{
                        'author':{
                            'name': tweet.user.name,
                            'url': 'https://twitter.com/'+tweet.user.screen_name,
                        },
                        'description': twtText,
                        'color': twtColor,
                        'timestamp' : new Date(),
                        'footer':{
                            'text': tweet.user.name,
                            'icon_url': tweet.user.profile_image_url
                        }
                    }
                }
        
                // sending the tweet
                clientDiscord.guilds.map(async function(guild) {
                    //console.debug('[soyun] [tweet] guild list: '+guild.id+'('+guild.name+')');
        
                    // getting guild setting data
                    let guildSettingData = await mongoGetData('guilds', {guild: guild.id});
                        guildSettingData = guildSettingData[0];
                    //console.debug('[soyun] [tweet] guild setting data: '+JSON.stringify(guildSettingData, null, '\t'));    

                    let twitterChannel = '';
                    if(guildSettingData != undefined){
                        twitterChannel = guildSettingData.settings.twitter
                    }
        
                    let found = 0;
                    guild.channels.map((ch) => {
                        if(found == 0){
                            if(ch.id == twitterChannel && twitterChannel != '' && twitterChannel != 'disable'){
                                found = 1; 
                                ch.send(embedData);                        
                            }
                        }
                    }) 
                })
                console.log('[soyun] [twitter] '+tweet.user.name+'\'s tweet sent');
			}
        }
        console.log('[soyun] [twitter] Twitter stream activity detected, status: '+payloadStatus);
	});
  
	stream.on('error', function(error) {
        sendBotReport(error, 'twitter-soyun', 'error');
        console.error(error);        
	});
});
// Twitter stream script end here

// Automation scripts start here
// Quest reset notification
ontime({
	cycle: ['12:00:00'],
	utc: true
	}, async function(reset){
        sendResetNotification(clientDiscord.guilds);
        reset.done();
		return;
    }
);

// Item data update
ontime({
	cycle: [ '00:02' ],
	utc: true
}, function (itemUpdate) {
    mongoItemDataUpdate();

    itemUpdate.done();
    return
    }
);