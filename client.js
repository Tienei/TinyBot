const { Client } = require('discord.js-light');
const bot = new Client({
    cacheGuilds: true,
    cacheChannels: true,
    cacheOverwrites: false,
    cacheRoles: true,
    cacheEmojis: false,
    cachePresences: false,
    fetchAllMembers: true,
    messageCacheMaxSize: 20, 
    messageCacheLifetime: 120, 
    messageSweepInterval: 240});
bot.login(process.env.BOT_TOKEN)
const bancho = require('bancho.js')
const osu_client = new bancho.BanchoClient({ username: process.env.BANCHO_USERNAME, password: process.env.BANCHO_PASSWORD, limiterTimespan: 60000, limiterPrivate: 270, limiterPublic: 54 });

module.exports = {
    bot,
    osu_client
}