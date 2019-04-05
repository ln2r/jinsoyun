const { Command } = require('discord.js-commando');
const { mongoGetData } = require('../../core');

module.exports = class CreateCustomRoleCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'create',
            aliases: ['make'],
            group: 'guild',
            memberName: 'create',
            description: 'Create custom role',
            examples: ['create'],
            guildOnly: true,
            userPermission: ['MANAGE_ROLES'],
        });
    }

    async run(msg, args) {
        msg.channel.startTyping();

        let authorPermission = msg.channel.permissionsFor(msg.author).has("MANAGE_ROLES", false);
        let msgData = '';

        args = args.toLowerCase(); // converting the role value to lower case        

        if(authorPermission){            
            let guildSettings = await mongoGetData('guilds', {guild: msg.guild.id});
                guildSettings = guildSettings[0];

            // checking if the role already exist
            if((msg.guild.roles.find(role => role.name == args)) == null){
                // creating the roles
                msg.guild.createRole({
                    'name': args,
                })

                // mergin the roles data if exist
                let customRoles = [args];
                let currentCustomRoles = [];

                if(guildSettings != undefined){
                    currentCustomRoles = guildSettings.settings.custom_roles;

                    if(currentCustomRoles.length != 0){
                        for(let i=0; i < currentCustomRoles.length; i++){
                            customRoles.push(currentCustomRoles[i]);
                        }
                    }
                }                

                this.client.emit('guildCustomRole', msg.guild.id, customRoles); // updating the database

                //console.debug('[soyun] [role-custom-create] ['+msg.guild.name+'] role name: '+args)
                //console.debug('[soyun] [role-custom-create] ['+msg.guild.name+'] '+args+' role created @ '+msg.guild.name);
                //console.debug('[soyun] [role-custom-create] ['+msg.guild.name+'] db roles data: '+currentCustomRoles);
                //console.debug('[soyun] [role-custom-create] ['+msg.guild.name+'] saved roles data: '+customRoles);
                //console.debug('[soyun] [role-custom-create] ['+msg.guild.name+'] guild settings data: '+JSON.stringify(guildSettings, null, '\t'));

                msgData = '`'+args+'` role created with basic permission, go to `Server Settings > Roles` to check and configure it';
            }else{
                msgData = 'Unable to create `'+args+'` role, role already exist';
            } 
        }else{
            msgData = 'I\'m sorry, you don\'t have the permission to use that command';
        }
        msg.channel.stopTyping();

        return msg.say(msgData);
    }
};