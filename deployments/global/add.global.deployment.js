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

const commands = [];
const commandFiles = readdirSync(resolve(__dirname, '../../commands')).filter(file => file.endsWith('.command.js'));

for (const file of commandFiles) {
  console.log(`Adding: ${file}`);
  const commandFile = await import(`../../commands/${file}`);

  commands.push(commandFile.command.data.toJSON());
}

console.log(`Starting deployment process`);
const rest = new REST({ version: 9 }).setToken(process.env.DISCORD_TOKEN);
(async () => {
  try {
    console.log(`Deploying to global`);
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      {
        body: commands,
      }
    );

    console.log(`Deployed and refreshed`);
  } catch (err) {
    console.error(err)
  }
})();