const { Command } = require("discord.js-commando");
const { mongoGetData, setArrayDataFormat } = require("../../core");
const dateformat = require("dateformat");

module.exports = class ShowGuildCustomRolesCommand extends Command {
    constructor(client) {
        super(client, {
            name: "roles",
            group: "guild",
            memberName: "roles",
            description: "Show server/guild available custom roles",
            examples: ["roles"],
            guildOnly: true,
        });
    }

    async run(msg) {
        msg.channel.startTyping();

        let guildSettings = await mongoGetData("guilds", {guild: msg.guild.id});
            guildSettings = guildSettings[0];
        let customRolesName = [];

        if(guildSettings !==undefined){
            let guildCustomRolesData = guildSettings.settings.custom_roles;

            for(let i=0; i<guildCustomRolesData.length; i++){
                let guildRolesData = msg.guild.roles.find(role => role.id === guildCustomRolesData[i]);

                if(guildRolesData !==null){
                    customRolesName.push(guildRolesData.name);
                }                
            }
        }
        
        let embedData = {
            "embed": {
                "title": msg.guild.name+" Custom Roles",
                "color": 1879160,
                "description": "You can use `add role name` command to add yourself the custom role"+setArrayDataFormat(customRolesName, "- ", true),
                "footer": {
                    "text": "Jinsoyun Bot - "+dateformat(Date.now(), "UTC:dd-mm-yy @ HH:MM")+" UTC"
                }
            }
        }

        msg.channel.stopTyping();

        return msg.say(embedData);
    }
};