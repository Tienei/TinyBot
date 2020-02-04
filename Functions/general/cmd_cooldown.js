var cooldown = {}
const { Message } = require('discord.js')

function set(message = new Message(),cdcommand,time) {
    if (cooldown[message.author.id] == undefined) {
        cooldown[message.author.id] = [cdcommand]
    } else {
        cooldown[message.author.id].push(cdcommand)
    }
    setTimeout(() => {
        if (cooldown[message.author.id].length > 1) {
            let pos = cooldown[message.author.id].indexOf(cdcommand)
            cooldown[message.author.id].splice(pos,1)
        } else {
            delete cooldown[message.author.id]
        }
    }, time)
}

module.exports = {
    set,
    cooldown
}