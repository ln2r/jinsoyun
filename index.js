const dotenv = require('dotenv').config();

const { CommandoClient } = require('discord.js-commando');
const Twitter = require('twitter');
const MongoClient = require('mongodb').MongoClient;
const MongoDBProvider = require('commando-provider-mongo');
const path = require('path');
const ontime = require('ontime');
const dateformat = require('dateformat');

const core = require('./core.js');

// Discord.js Commando scripts start here
const clientDiscord = new CommandoClient({
    commandPrefix: process.env.bot_default_prefix,
    owner: process.env.bot_owner_id,
    disableEveryone: true
});

clientDiscord.login(process.env.discord_secret);

clientDiscord.registry
    .registerDefaultTypes()
    .registerGroups([
        ['admin', 'Bot Admin'],
        ['automation', 'Automation'],
        ['guild', 'Guild'],
        ['bns', 'Blade and Soul'],
    ])
    .registerDefaultGroups()
    .registerDefaultCommands()
    .registerCommandsIn(path.join(__dirname, 'commands'));

clientDiscord
    .on('error', console.error)
    .on('warn', console.warn)
    // remove "//" below to enable debug log
    //.on('debug', console.log)
    .on('disconnect', () => { console.warn('Disconnected!'); })
	.on('reconnecting', () => { console.warn('Reconnecting...'); })
    .on('ready', () => {
        console.log('[soyun] [system] Logged in and ready');
        clientDiscord.user.setPresence({
                 game: { 
                     name: process.env.bot_default_prefix+'help' ,
                     type: 'LISTENING'
                    }
                }
            )
            .catch(console.error);
    })
    .on('guildMemberAdd', async (member) => {
        let guildSettingData = await core.mongoGetData('guilds', {guild: member.guild.id});
            guildSettingData = guildSettingData[0];

        let memberGate = '';
        if(guildSettingData != undefined){
            memberGate = guildSettingData.settings.member_gate
        }

        console.debug('[soyun] [gate] memberGate value: '+memberGate)
        if(memberGate != '' && memberGate != 'disable'){
            // add cricket role so they can't see the rest of the guild until they do join command
            member.addRole(member.guild.roles.find(x => x.name == 'cricket'));
            member.guild.channels.find(ch => ch.name == memberGate).send(
                'Hi <@'+member.user.id+'>! Welcome to *'+member.guild.name+'*!\n\n'+

                'Before I give you access to the rest of the server, I need to know your character name and class that you use in our clan, to do that please write this following command with your information in it\n\n'+

                '```'+
                '@Jinsoyun reg <character name> <class name>\nExample: @Jinsoyun reg jinsoyun blade dancer'+
                '```\n\n'+
                
                'If you need some assistance you can mention or DM available admin'
            );
        }
    });

clientDiscord.setProvider(
    MongoClient.connect(process.env.bot_mongodb_url, {useNewUrlParser: true}).then(client => new MongoDBProvider(client, process.env.bot_mongodb_db_name))
).catch(console.error);    
// Discord.js Commando scripts end here

// Twitter stream scripts start here
const clientTwitter = new Twitter({
	consumer_key: process.env.twitter_consumer_key,
	consumer_secret: process.env.twitter_consumer_secret,
	access_token_key: process.env.twitter_access_token_key,
	access_token_secret: process.env.twitter_access_token_secret
});

clientTwitter.stream('statuses/filter', {follow: '3521186773, 819625154'}, async  function(stream) {
    let twitterAPIData = await core.mongoGetData('apis', {name: 'Twitter'});
        twitterAPIData = twitterAPIData[0];

	stream.on('data', function(tweet) {
        let payloadStatus = 'rejected';
        
		// Filtering data so it only getting data from specified user
		if((tweet.user.screen_name == twitterAPIData.stream_screenname[0] || tweet.user.screen_name == twitterAPIData.stream_screenname[1] || tweet.user.screen_name == twitterAPIData.stream_screenname[2])){
			// Variable for filtering
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

				payloadStatus = 'received';

				// Making the color different for different user
				if(tweet.user.screen_name == twitterAPIData.stream_screenname[0]){
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
                let sent = 0;
                clientDiscord.guilds.map(async function(guild) {
                    //console.debug('[soyun] [tweet] guild list: '+guild.id+'('+guild.name+')');
        
                    // getting guild setting data
                    let guildSettingData = await core.mongoGetData('guilds', {guild: guild.id});
                        guildSettingData = guildSettingData[0];
                    //console.debug('[soyun] [tweet] guild setting data: '+JSON.stringify(guildSettingData, null, '\t'));    

                    let twitterChannel = '';
                    if(guildSettingData != undefined){
                        twitterChannel = guildSettingData.settings.twitter
                    }
        
                    let found = 0;
                    guild.channels.map((ch) => {
                        if(found == 0){
                            if(ch.name == twitterChannel && twitterChannel != '' && twitterChannel != 'disable'){
                                found = 1; 
                                sent++;
                                ch.send(embedData);                        
                            }
                        }
                    }) 
                })
                console.log('[soyun] [twitter] '+tweet.user.name+'\'s tweet sent to '+sent+' channels');
			}
        }
        console.debug('[soyun] [twitter] Twitter stream activity detected, status: '+payloadStatus);
	});
  
	stream.on('error', function(error) {
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
		let todayDay = core.getDayValue(Date.now(), 'now');

        let dailiesData = await core.getDailyData(todayDay);
        let eventData = await core.getEventData(todayDay);
        let weekliesData = await core.getWeeklyData();

        let fieldsData = [
            {
                'name': 'Event',
                'value': '**Name**: ['+eventData.name+']('+eventData.url+')\n'+
                         '**Duration**: '+eventData.duration+'\n'+
                         '**Redemption Period**: '+eventData.redeem+'\n'+
                         '**Quests**'+
                         core.setQuestViewFormat(eventData.quests, '- ', true)+'\n\u200B'
            },
            {
                'name': 'Daily Challenges',
                'value': '**Rewards**'+
                        core.setArrayDataFormat(dailiesData.rewards, '- ', true)+'\n'+
                        '**Quests**'+
                        core.setQuestViewFormat(dailiesData.quests, '- ', true)+'\n\u200B'
            }            
        ];

        if(todayDay == 'Wednesday'){
            fieldsData.push(
                {
                    'name': 'Weekly Challenges',
                    'value': '**Rewards**'+
                            core.setArrayDataFormat(weekliesData.rewards, '- ', true)+'\n'+
                            '**Quests**'+
                            core.setQuestViewFormat(weekliesData.quests, '- ', true)+'\n\u200B'
                }
            )
        }

        let msgData = 'Hello! It\'s time for reset, below is today\'s/this week\'s list. Have a good day!'

        let embedData = {
            'embed':{
                'author':{
                    'name': todayDay+'\'s List - '+dateformat(Date.now(), 'UTC:dd-mmmm-yyyy'),
                    'icon_url': 'https://cdn.discordapp.com/emojis/464038094258307073.png?v=1'
                },
                'color': 1879160,
                'footer': {
                    'text': 'Reset Notification - Generated at '+dateformat(Date.now(), 'UTC:dd-mm-yy @ HH:MM')+' UTC'
                },
                'fields': fieldsData
            }
        }

        let sent = 0;
        clientDiscord.guilds.map(async function(guild){
            //console.debug('[soyun] [reset] guild list: '+guild.id+'('+guild.name+')');

           

            // getting guild setting data
            let guildSettingData = await core.mongoGetData('guilds', {guild: guild.id});
                guildSettingData = guildSettingData[0];
            //console.debug('[soyun] [reset] guild setting data: '+JSON.stringify(guildSettingData, null, '\t'));  
            
            let resetChannel = '';
            if(guildSettingData != undefined){
                resetChannel = guildSettingData.settings.quest_reset
            }

            let found = 0;
            guild.channels.map((ch) => {
                if(found == 0){
                    if(ch.name == resetChannel && resetChannel != undefined && resetChannel != 'disable'){
                        found = 1; 
                        sent ++;
                        ch.send(msgData, embedData);                        
                    }
                }
            }) 
        })
        console.log('[soyun] [reset] reset notification sent to '+sent+' channels');

        reset.done();
		return;
    }
);

// Item data update
ontime({
	cycle: [ '00:02' ],
	utc: true
}, function (itemUpdate) {
    core.mongoItemDataUpdate();

    itemUpdate.done();
    return
    }
);

// Class data update
ontime({
	cycle: ['thu 00:00:00'],
	utc: true
}, function (classUpdate) {
        core.mongoClassDataUpdate();

		classUpdate.done();
		return;
    }
);