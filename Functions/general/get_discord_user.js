const { Message } = require('discord.js-light')

/** 
 * @param {{message: Message}} 
 */
module.exports = async ({message, name = name.toLowerCase()}) => {
    let user = null
    if (name) {
        if (name.includes('@')) {
            user = message.mentions.users.first()
        } else if (!isNaN(name)) {
            let member = await message.guild.members.fetch(name)
            if (member) user = member.user;
        } else if (message.guild) {
            let member = await message.guild.members.fetch({query: name, limit: 1})
            if (!!member.size) user = member.first().user;
        }
    } 
    return user || message.author
}