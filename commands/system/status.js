const { Command } = require("discord.js-commando");

const { sendBotReport } = require("../../core");

module.exports = class ResetNotificationCommand extends Command {
    constructor(client) {
        super(client, {
            name: "status",
            group: "system",
            memberName: "status",
            description: "Change bot game status.",
            hidden: true,
            ownerOnly: true,
        });
    }

    async run(msg, args) {
        msg.channel.startTyping();

        let payload = args.split(" ");
        let validType = ["playing", "streaming", "listening", "watching"];
        let validStatus = ["online", "idle", "dnd"];
        let statusData;

        let type = payload[0];
        let status = payload[1];

        if(validType.indexOf(type) >= 0 && validStatus.indexOf(status) >= 0){
            let payloadTemp = payload;
                payloadTemp.splice(0, 2)
            let text = payloadTemp.join(" ");
            
            statusData = {
                game: {
                  name: text,
                  type: type,
                },
                status: status,
              };


            // changing bot presence
            this.client.user.setPresence(statusData).catch((error) => {
                console.error;
                sendBotReport(error, 'onReady-soyun', 'error');
            });

            // saving to db
            this.client.emit('botGameStatusChagne', "global", statusData);

            msg.channel.stopTyping();

            return msg.say("Bot status changed to `"+status+"`, with type `"+type+"` and message `"+text+"`")
        }else{
            msg.channel.stopTyping();
            
            return msg.say("Invalid command format.", {
                'embed': {
                    'title': "Valid Format",
                    'color': 16741688,
                    'fields': [
                        {
                            'inline': true,
                            'name': "Valid Type",
                            'value': "- `playing`\n- `streaming`\n- `listening`\n- `watching`",
                        },
                        {
                            'inline': true,
                            'name': "Valid Status",
                            'value': "- `online`\n- `idle`\n- `dnd`",
                        },
                    ]
                }
            })
        }
    }
};