const Discord = require('discord.js');
const bot = new Discord.Client();


var date = new Date()
var day = date.getDate()
var month = date.getMonth()
bot.on("ready", (ready) => {
    do {
        date = new Date()
        day = date.getDate()
        month = date.getMonth()
        if (day == 8 && month == 8) {
            bot.channels.get('442183985536303104').send('Happy Birthday Tiny!!! :tada: :birthday: :tada:')
        }
    }
    while(day !== 8 || month !== 8)
});
bot.login(process.env.BOT_TOKEN);
