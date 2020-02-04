const Discord = require('discord.js');
const bot = new Discord.Client();
bot.login(process.env.BOT_TOKEN)

module.exports = {
    bot
}