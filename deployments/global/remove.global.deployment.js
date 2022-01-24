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

console.log(`Starting removal process`);
const rest = new REST({ version: 9 }).setToken(process.env.DISCORD_TOKEN);
(async () => {
  try {
    console.log(`Removing from global`);
    rest.get(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID))
      .then(data => {
        const promises = [];
        for (const command of data) {
          const url = `${Routes.applicationCommands(process.env.DISCORD_CLIENT_ID)}/${command.id}`;
          console.log(`Removed from global: "${url}"`)
          promises.push(rest.delete(url));
        }

        return Promise.all(promises);
      })

    console.log(`Removed and refreshed`);
  } catch (err) {
    console.error(err)
  }
})();