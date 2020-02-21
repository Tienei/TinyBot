const { Message } = require('discord.js')
const config = require('../../config')

module.exports = function (user_data, message = new Message(), name, type) {
    try {
        let osuname = ''
        if (name == '') {
            if (user_data[message.author.id] !== undefined) {
                if (type == 'Bancho') {
                    osuname = user_data[message.author.id].osuname
                } else if (type == 'Akatsuki') {
                    osuname = user_data[message.author.id].akatsukiname
                } else if (type == 'Ripple') {
                    osuname = user_data[message.author.id].ripplename
                } else if (type == 'Horizon') {
                    osuname = user_data[message.author.id].horizonname
                }
                return osuname
            } else {
                throw `Looks like you didn't link your profile to an osu account, do **${config.config.bot_prefix}osuset (username)** to link your account`
            }
        } else {
            let id = ''
            if (name.includes('@') == true) {
                let id = message.mentions.users.first().id
                if (user_data[id] !== undefined) {
                    if (type == 'Bancho') {
                        osuname = user_data[id].osuname
                    } else if (type == 'Akatsuki') {
                        osuname = user_data[id].akatsukiname
                    } else if (type == 'Ripple') {
                        osuname = user_data[id].ripplename
                    } else if (type == 'Horizon') {
                        osuname = user_data[id].horizonname
                    }
                    return osuname
                } else {
                    return name
                }
            } else {
                return name
            }
    
        }
    } catch (error) {
        message.channel.send(String(error))
    }
}