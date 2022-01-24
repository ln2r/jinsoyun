import { discordClient } from "../configs/discord.config.js";

export const event = {
  name: 'ready',
  once: true,
  async execute(client) {
    discordClient.user.setPresence({ activities: [{ name: 'Blade and Soul' }], status: 'online' });

    console.log(`Ready! Logged in as ${client.user.tag}`);
  },
}