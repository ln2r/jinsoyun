const {Command} = require('discord.js-commando');
const MongoClient = require('mongodb').MongoClient;
const utils = require('../../utils/index');
const dateformat = require('dateformat');
const configs = require('../../config.json');

const url = process.env.SOYUN_BOT_DB_CONNECT_URL;
const dbName = process.env.SOYUN_BOT_DB_NAME;

module.exports = class BotAuditCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'audit',
      group: 'system',
      memberName: 'audit',
      description: 'Get bot system reports.',
      examples: ['audit'],
      ownerOnly: true,
    });
  }

  async run(msg) {
    msg.channel.startTyping();

    const currentTime = new Date();

    // getting stats and logs data
    const logsData = await utils.fetchDB(configs.collection.logs, {audit: false});
    const statsData = await utils.fetchDB(configs.collection.stats, {date: dateformat(currentTime, 'UTC:dd-mmmm-yyyy')});

    let logsDataContent = '';
    logsData.map(data => {
      logsDataContent = logsDataContent + `Location: ${data.location}\nMessage: ${data.message}\n\n`;
    });

    MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, db) {
      if (err) throw err;
      const dbo = db.db(dbName);

      // update the audit status
      dbo.collection(configs.collection.logs).updateMany({audit: false},
        {$set: {'audit': true}}, function(err) {
          if (err) throw err;

          db.close();
        });     
    });

    // getting connected guilds data
    const guildsData = this.client.guilds.cache;
    let data = [];
    let guildsCount = 0;

    guildsData.map((g) => {
      data.push(g.id+': '+g.name+' ('+g.owner.user.username+'#'+g.owner.user.discriminator+')');
      guildsCount++;
    });

    msg.channel.stopTyping();
    return msg.say({
      'embed': {
        'title': 'System Report',
        'color': 16741688,
        'description': `Today: ${dateformat(currentTime, 'UTC:dd mmmm yyyy')} UTC\nHeartbeat: ${Math.round(this.client.ws.ping)}ms`,
        'fields': [
          {
            'name': 'Requests',
            'value': `${(statsData.count)? statsData.count:0} requests received.`,
          },
          {
            'name': `${guildsCount} Connected Guilds`,
            'value': utils.formatArray(data, '- ', true),
          },
          {
            'name': 'Errors',
            'value': (logsDataContent === '')? 'Everything is normal, nothing\'s here.':logsDataContent,
          }          
        ],
      },
    });
  }
};
