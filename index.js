import { config } from 'dotenv';
import fs from 'fs';
import { Collection } from 'discord.js';

import { discordClient } from './configs/discord.config.js';

// loading .env
config();

discordClient.commands = new Collection();

// commands data
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.command.js'));
for (const file of commandFiles) {
  const commandFile = await import(`./commands/${file}`);

  discordClient.commands.set(commandFile.command.data.name, commandFile.command);
}

// events
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.event.js'));
for (const file of eventFiles) {
  const eventFile = await import(`./events/${file}`);

  if (eventFile.once) {
    discordClient.once(eventFile.event.name, (...args) => eventFile.event.execute(...args));
  } else {
    discordClient.on(eventFile.event.name, (...args) => eventFile.event.execute(...args));
  }
}

// discord login
discordClient.login(process.env.DISCORD_TOKEN);