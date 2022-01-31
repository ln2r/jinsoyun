import { discordClient } from "../configs/discord.config.js";
import { getApi } from "../utils/getApi.util.js";

export const event = {
  name: 'ready',
  once: true,
  async execute(client) {
    // checking api connection
    const api = await getApi(`${process.env.API_URL}/`, { cache: false });
    if (api) console.log(`API connection established, all good!`);

    discordClient.user.setPresence({ activities: [{ name: 'Blade and Soul' }], status: 'online' });

    console.log(`Ready! Logged in as ${client.user.tag}`);
  },
}