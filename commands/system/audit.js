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
      hidden: true,
      ownerOnly: true,
    });
  }

  async run(msg) {
    msg.channel.startTyping();

    const currentTime = new Date();

    // getting logs data
    const logsData = await utils.fetchDB(configs.collection.logs, {audit: false});

    let logsDataError = '';
    let logsDataWarn =  '';
    logsData.map(data => {
      if(data.level === 'warn') logsDataWarn + `Location: ${data.location}\nMessage: ${data.message}\n\n`;
      if(data.level === 'error') logsDataError + `Location: ${data.location}\nMessage: ${data.message}\n\n`;
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

    msg.channel.stopTyping();
    return msg.say({
      'embed': {
        'title': 'System Report',
        'color': 16741688,
        'description': `Today: ${dateformat(currentTime, 'UTC:dd mmmm yyyy')} UTC\nHeartbeat: ${Math.round(this.client.ws.ping)}ms`,
        'fields': [
          {
            'name': 'Warnings',
            'value': (logsDataWarn === '')? 'Everything is normal, nothing\'s here.':logsDataWarn,
          }, 
          {
            'name': 'Errors',
            'value': (logsDataError === '')? 'Everything is normal, nothing\'s here.':logsDataError,
          }      
        ],
      },
    });
  }
};
