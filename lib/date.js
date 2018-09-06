const Discord = require('discord.js');
const bot = new Discord.Client();


var date = new Date()
var day = date.getDate()
var month = date.getMonth()
bot.on("ready", (ready) => {
    console.log('ready')
    do {
        date = new Date()
        day = date.getDate()
        month = date.getMonth()
        if (day == 6 && month == 8) {
            bot.channels.get('457727640527175694').send('Happy Birthday Tiny!!! :tada: :birthday: :tada:')
        }
    }
    while(day !== 6 || month !== 8)
});
bot.login('NDcwNDk2ODc4OTQxOTYyMjUx.DjXLDg.bZcRST-D7YlB9f5ahN3S6gALCzo');
