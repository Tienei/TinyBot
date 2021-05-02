const { Client, Intents } = require('discord.js-light');
const TinyIntents = new Intents()
TinyIntents.add('GUILDS', 'GUILD_EMOJIS', 'GUILD_INVITES', 'GUILD_MESSAGES','GUILD_MESSAGE_REACTIONS',
                'DIRECT_MESSAGES','DIRECT_MESSAGE_REACTIONS')

const bot = new Client({
    cacheGuilds: true,
    cacheChannels: true,
    cacheOverwrites: false,
    cacheRoles: true,
    cacheEmojis: false,
    cachePresences: false,
    messageCacheMaxSize: 10, 
    messageCacheLifetime: 60, 
    messageSweepInterval: 120,
    shardCount: Number(process.env.PROCESS_COUNT),
    shards: Number(process.env.PROCESS_ID),
    ws: {intents: TinyIntents}
});

bot.login(process.env.BOT_TOKEN)

module.exports = {
    DiscordCL: bot
}