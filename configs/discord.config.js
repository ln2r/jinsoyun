import { Client, Intents } from 'discord.js'

export const discordClient = new Client({ intents: [Intents.FLAGS.GUILDS]});