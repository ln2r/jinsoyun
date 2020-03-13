const { Command } = require('discord.js-commando');
const { setArrayDataFormat } = require('../../core')

module.exports = class GetGuildsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'getguilds',
            group: 'dev',
            memberName: 'getguilds',
            description: 'get guilds data',
            guildOnly: true,
            hidden: true,
            ownerOnly: true,
        });    
    }

    async run(msg) {       
        const guildsData = this.client.guilds;
        let data = [];
        
        guildsData.map((g) => {
            data.push(g.id+": "+g.name+" ("+g.owner.user.username+"#"+g.owner.user.discriminator+")")
        })

        let embed = {
            'embed': {
                'description': setArrayDataFormat(data, "- ", true),
                'color': 16741688
            }
        }
        return msg.say('Fetched all connected guilds data', embed);
    }
};