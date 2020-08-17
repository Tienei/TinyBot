const { Client, Intents } = require('discord.js-light');
const TinyIntents = new Intents()
TinyIntents.add('GUILDS', 'GUILD_EMOJIS', 'GUILD_INVITES','GUILD_MESSAGES','GUILD_MESSAGE_REACTIONS','DIRECT_MESSAGES','DIRECT_MESSAGE_REACTIONS', 'GUILD_MEMBERS')
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
    ws: {intents: TinyIntents}});
bot.login(process.env.BOT_TOKEN)
const bancho = require('bancho.js')
const osu_client = new bancho.BanchoClient({ username: process.env.BANCHO_USERNAME, password: process.env.BANCHO_PASSWORD, limiterTimespan: 60000, limiterPrivate: 270, limiterPublic: 54 });

module.exports = {
    bot,
    osu_client
}