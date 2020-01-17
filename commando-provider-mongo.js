/**
 * Commando MongoDBProvider by paulhobbel
 *
 * Commando is the official framework for discord.js,
 * I like how easy it is to get started with it and add own commands, types, etc.
 * Recently I started working on a bot that required to be connected to MongoDB.
 * I converted the default SQLLiteProvider into a provider that could use MongoDB as storage.
 *
 * https://github.com/paulhobbel/commando-provider-mongo
 */

const SettingProvider = require('discord.js-commando').SettingProvider;

/**
 * Uses an MongoDB collection to store settings with guilds
 * @extends {SettingProvider}
 */
class MongoDBProvider extends SettingProvider {
  /**
	 * @param {Db} db - Database for the provider
	 */
  constructor(mongoClient, dbName) {
    super();

    /**
		 * Database that will be used for storing/retrieving settings
		 * @type {Db}
		 */
    this.mongoClient = mongoClient;
    this.db = mongoClient.db(dbName);

    /**
		 * Client that the provider is for (set once the client is ready, after using {@link CommandoClient#setProvider})
		 * @name SQLiteProvider#client
		 * @type {CommandoClient}
		 * @readonly
		 */
    Object.defineProperty(this, 'client', {value: null, writable: true});

    /**
		 * Settings cached in memory, mapped by guild ID (or "global")
		 * @type {Map}
		 * @private
		 */
    this.settings = new Map();

    /**
		 * Listeners on the Client, mapped by the event name
		 * @type {Map}
		 * @private
		 */
    this.listeners = new Map();
  }

  async init(client) {
    this.client = client;

    // Load or create the settings collection
    const collection = await this.db.collection('configs');

    // Load all settings
    collection.find().forEach((doc) => {
      const guild = doc.guild !== 0 ? doc.guild : 'global';
      this.settings.set(guild, doc.settings);

      // Guild is not global, and doesn"t exist currently so lets skip it.
      if (guild !== 'global' && !client.guilds.has(doc.guild)) return;

      this.setupGuild(guild, doc.settings);
    });

    // Listen for changes
    this.listeners
        .set('globalSettingChange', (guild, system, setting) => this.set(guild, system, setting))

        //.set('guildOverwatchChange', (guild, channel) => this.set(guild, 'overwatch', channel))
        .set('notificationResetChange', (guild, channel) => this.set(guild, 'quest_reset', channel))
        .set('notificationTwitterChange', (guild, channel) => this.set(guild, 'twitter', channel))
        .set('notificationKoldrakChange', (guild, channel) => this.set(guild, 'koldrak', channel))
        //.set('notificationTwitchChange', (guild, channel) => this.set(guild, 'twitch', channel))
        .set('newMemberChannelChange', (guild, channel) => this.set(guild, 'member_gate', channel))
        .set('joinCustomMessageChange', (guild, message) => this.set(guild, 'join_message', message))
        .set('adminRolesChange', (guild, roles) => this.set(guild, 'admin_roles', roles))
        .set('guildReactionRoleChange', (guild, messageData) => this.set(guild, 'react_role', messageData))

        .set('commandPrefixChange', (guild, prefix) => this.set(guild, 'prefix', prefix))
        .set('commandStatusChange', (guild, command, enabled) => this.set(guild, `cmd-${command.name}`, enabled))
        .set('groupStatusChange', (guild, group, enabled) => this.set(guild, `grp-${group.id}`, enabled))
        .set('guildCreate', (guild) => {
          const settings = this.settings.get(guild.id);
          if (!settings) return;
          this.setupGuild(guild.id, settings);
        })
        .set('commandRegister', (command) => {
          for (const [guild, settings] of this.settings) {
            if (guild !== 'global' && !client.guilds.has(guild)) continue;
            this.setupGuildCommand(client.guilds.get(guild), command, settings);
          }
        })
        .set('groupRegister', (group) => {
          for (const [guild, settings] of this.settings) {
            if (guild !== 'global' && !client.guilds.has(guild)) continue;
            this.setupGuildGroup(client.guilds.get(guild), group, settings);
          }
        });
    for (const [event, listener] of this.listeners) client.on(event, listener);
  }

  async destroy() {
    // Close database connection
    this.mongoClient.close();

    // Remove all listeners from the client
    for (const [event, listener] of this.listeners) this.client.removeListener(event, listener);
    this.listeners.clear();
  }

  get(guild, key, defVal) {
    const settings = this.settings.get(this.constructor.getGuildID(guild));
    return settings ? typeof settings[key] !== 'undefined' ? settings[key] : defVal : defVal;
  }

  async set(guild, key, val) {
    guild = this.constructor.getGuildID(guild);
    let settings = this.settings.get(guild);
    if (!settings) {
      settings = {};
      this.settings.set(guild, settings);
    }

    settings[key] = val;

    await this.updateGuild(guild, settings);

    if (guild === 'global') this.updateOtherShards(key, val);
    return val;
  }

  async remove(guild, key) {
    guild = this.constructor.getGuildID(guild);
    const settings = this.settings.get(guild);
    if (!settings || typeof settings[key] === 'undefined') return;

    const val = settings[key];
    delete settings[key]; // NOTE: I know this isn"t efficient, but it does the job.

    await this.updateGuild(guild, settings);

    if (guild === 'global') this.updateOtherShards(key, undefined);
    return val;
  }

  async clear(guild) {
    guild = this.constructor.getGuildID(guild);
    if (!this.settings.has(guild)) return;
    this.settings.delete(guild);

    const collection = await this.db.collection('configs');
    return collection.deleteOne({guild: guild !== 'global' ? guild : 0});
  }

  async updateGuild(guild, settings) {
    guild = guild !== 'global' ? guild : 0;

    const collection = await this.db.collection('configs');
    return collection.updateOne({guild}, {$set: {guild, settings}}, {upsert: true});
  }

  /**
	 * Loads all settings for a guild
	 * @param {string} guild - Guild ID to load the settings of (or "global")
	 * @param {Object} settings - Settings to load
	 * @private
	 */
  setupGuild(guild, settings) {
    if (typeof guild !== 'string') throw new TypeError('The guild must be a guild ID or "global".');
    guild = this.client.guilds.get(guild) || null;

    // Load the command prefix
    if (typeof settings.prefix !== 'undefined') {
      if (guild) guild._commandPrefix = settings.prefix;
      else this.client._commandPrefix = settings.prefix;
    }

    // Load all command/group statuses
    for (const command of this.client.registry.commands.values()) this.setupGuildCommand(guild, command, settings);
    for (const group of this.client.registry.groups.values()) this.setupGuildGroup(guild, group, settings);
  }

  /**
	 * Sets up a command"s status in a guild from the guild"s settings
	 * @param {?Guild} guild - Guild to set the status in
	 * @param {Command} command - Command to set the status of
	 * @param {Object} settings - Settings of the guild
	 * @private
	 */
  setupGuildCommand(guild, command, settings) {
    if (typeof settings[`cmd-${command.name}`] === 'undefined') return;
    if (guild) {
      if (!guild._commandsEnabled) guild._commandsEnabled = {};
      guild._commandsEnabled[command.name] = settings[`cmd-${command.name}`];
    } else {
      command._globalEnabled = settings[`cmd-${command.name}`];
    }
  }

  /**
	 * Sets up a group"s status in a guild from the guild"s settings
	 * @param {?Guild} guild - Guild to set the status in
	 * @param {CommandGroup} group - Group to set the status of
	 * @param {Object} settings - Settings of the guild
	 * @private
	 */
  setupGuildGroup(guild, group, settings) {
    if (typeof settings[`grp-${group.id}`] === 'undefined') return;
    if (guild) {
      if (!guild._groupsEnabled) guild._groupsEnabled = {};
      guild._groupsEnabled[group.id] = settings[`grp-${group.id}`];
    } else {
      group._globalEnabled = settings[`grp-${group.id}`];
    }
  }

  /**
	 * Updates a global setting on all other shards if using the {@link ShardingManager}.
	 * @param {string} key - Key of the setting to update
	 * @param {*} val - Value of the setting
	 * @private
	 */
  updateOtherShards(key, val) {
    if (!this.client.shard) return;
    key = JSON.stringify(key);
    val = typeof val !== 'undefined' ? JSON.stringify(val) : 'undefined';
    this.client.shard.broadcastEval(`
			if(this.shard.id !== ${this.client.shard.id} && this.provider && this.provider.settings) {
				let global = this.provider.settings.get("global");
				if(!global) {
					global = {};
					this.provider.settings.set("global", global);
				}
				global[${key}] = ${val};
			}
		`);
  }
}

module.exports = MongoDBProvider;
