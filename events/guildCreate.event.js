import { deployGuildSlashCommands } from "../deployments/guild/add.guild.deployment.js";

export const event = {
  name: 'guildCreate',
  async execute(client) {
    console.log(`Joined "${client.name}" with id: "${client.id}"!`);

    await deployGuildSlashCommands(client);
  }
}