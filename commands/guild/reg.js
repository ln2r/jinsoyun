const { Command } = require("discord.js-commando");
const { mongoGetData } = require("../../core");

module.exports = class RegCommand extends Command {
    constructor(client) {
        super(client, {
            name: "reg",
            aliases: ["join", "register"],
            group: "guild",
            memberName: "reg",
            description: "Register yourself into the guild so you can access the rest of the guild",
            examples: ["reg <charcter name> <character class>", "reg jinsoyun blade dancer"],
            guildOnly: true,
            hidden: true,
            clientPermissions: ["CHANGE_NICKNAME", "MANAGE_NICKNAMES"],                    
        });
    }

    async run(msg, args) {
        args = args.toLowerCase();
        //console.debug("[soyun] [reg] ["+msg.guild.name+"] roles data: "+rolesList);
        let guildSettingData = await mongoGetData("guilds", {guild: msg.guild.id});
            guildSettingData = guildSettingData[0];

        // formatting the nickname
        let userCharaName = args.replace(/(^|\s)\S/g, l => l.toUpperCase());

        // changing the nickname
        if(msg.author.id !== msg.guild.ownerID){
            msg.guild.members.get(msg.author.id).setNickname(userCharaName);
        }

        if(guildSettingData.settings != undefined){        
            // checking and adding the role
            if(guildSettingData.settings.member_gate.role_id !== "" && guildSettingData.settings.member_gate.role_id !== undefined){
                // checking if the guild have the role, add if yes
                if ((msg.guild.roles.find((role) => role.id === guildSettingData.settings.member_gate.role_id)) !== null) {
                    msg.guild.members.get(msg.author.id).addRole(guildSettingData.settings.member_gate.role_id);
                }
            }

            if(guildSettingData.settings.member_gate.next !== "" && guildSettingData.settings.member_gate.next !== undefined){
                msg.guild.channels.find((ch) => ch.id === guildSettingData.settings.member_gate.next).send("Hello <@"+msg.author.id+">, we've been waiting for you. Please follow the instruction above to continue");
            }
        }
        //console.debug("[soyun] [reg] ["+msg.guild.name+"] args value: "+args);
        //console.debug("[soyun] [reg] ["+msg.guild.name+"] class input is: "+classValid);
    }
};