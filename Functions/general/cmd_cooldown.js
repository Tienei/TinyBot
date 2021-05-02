var cooldown = {}
const { Message } = require('discord.js-light')

function set({message, cmd, time}) {
    if (cooldown[message.author.id] == undefined) {
        cooldown[message.author.id] = [cmd]
    } else {
        cooldown[message.author.id].push(cmd)
    }
    setTimeout(() => {
        if (cooldown[message.author.id].length > 1) {
            let pos = cooldown[message.author.id].indexOf(cmd)
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