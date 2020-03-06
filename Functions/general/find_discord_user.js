const { Message } = require('discord.js')

module.exports = function (message = new Message(), name = name.toLowerCase()) {
    if (name !== '') {
        if (name.includes('@') == true) {
            let id = message.mentions.users.first().id
            if (id == message.author.id) {
                user = message.author
            } else {    
                user = message.mentions.users.first()
            }
        } else if (message.guild !== null) {
            let member = message.guild.members.array()
            for (var i = 0; i < message.guild.memberCount; i++) {
                if (member[i].nickname !== null) {
                    if (member[i].nickname.substring(0, name.length).toLowerCase() == name) {
                        user = member[i].user
                    }
                } else {
                    if (member[i].user.username.substring(0, name.length).toLowerCase() == name) {
                        user = member[i].user
                    }
                }
            }
        } else {
            user = null
        }
    } else {
        user = message.author
    }
    return user
}