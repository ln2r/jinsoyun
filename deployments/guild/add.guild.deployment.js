import { readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { REST } from '@discordjs/rest'; 
import { Routes } from 'discord-api-types/v9';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// getting .env
config({path: resolve(__dirname, '../../.env')});

export const deployGuildSlashCommands = async (guildObject) => {
  const commands = [];
  const commandFiles = readdirSync(resolve(__dirname, '../../commands')).filter(file => file.endsWith('.command.js'));

  for (const file of commandFiles) {
    // console.log(`Adding: ${file}`);
    const commandFile = await import(`../../commands/${file}`);

    commands.push(commandFile.command.data.toJSON());
  }

  console.log(`Starting slash commands deployment process...`);
  const rest = new REST({ version: 9 }).setToken(process.env.DISCORD_TOKEN);
  (async () => {
    try {
      console.log(`Deploying to ${guildObject.name}...`);
      await rest.put(
        Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guildObject.id),
        {
          body: commands,
        }
      );

      console.log(`Deployed!`);
    } catch (err) {
      console.error(err)
    }
  })();
};
