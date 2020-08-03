const { Message } = require('discord.js-light')

function easter_detection(message = new Message(), easter_egg, ee_number) {
    let number = ee_number
    if (easter_egg[message.author.id] == undefined) {
        easter_egg[message.author.id] = number
    }
    if (easter_egg[message.author.id].length < number.length) {
        easter_egg[message.author.id] = easter_egg[message.author.id].substring(0, easter_egg[message.author.id].length) + number.substring(easter_egg[message.author.id].length)
    }
    if (easter_egg[message.author.id].substring(ee[msg].bit, ee[msg].bit + 1) == '0') {
        easter_egg[message.author.id] = easter_egg[message.author.id].substring(0, ee[msg].bit) + "1" + easter_egg[message.author.id].substring(ee[msg].bit + 1)
    }
    if (ee[msg].type == "normal") {
        message.channel.send(ee[msg].respond)   
    }
    return easter_egg
}

module.exports = {
    easter_detection
}