const { Command } = require("discord.js-commando");

module.exports = class NicknameChangeCommand extends Command {
    constructor(client) {
        super(client, {
            name: "nickname",
            aliases: ["username", "nickname", "name"],
            group: "guild",
            memberName: "nickname",
            description: "Change your nickname.",
            examples: ["name <your new nickname>", "name Jinsoyun"],
            guildOnly: true,
            clientPermissions: ["CHANGE_NICKNAME", "MANAGE_NICKNAMES"],                    
            args: [
                {
                    key: "name", 
                    prompt: "What's the name you want to change to?", 
                    type: "string",
                    validate: name => {
                        // checking if the input is empty or not
                        if (name.length > 0){return true}
                        return "Nickname can't be empty, please check and try again";
                    }
                }
            ]
        });
    }

    run(msg, { name }) {
        // changing and formatting the nickname
        //console.debug("[soyun] [nickname] ["+msg.guild.name+"] "+msg.author.displayName+" nickname changed to "+name)
        msg.guild.members.get(msg.author.id).setNickname(name.replace(/(^|\s)\S/g, l => l.toUpperCase()));

        return msg.say("Hello **"+name+"**! nice to meet you!");
    }
}