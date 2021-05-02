const { Message, MessageEmbed, Client } = require('discord.js-light')

/** 
 * @param {{message: Message}} 
 */
async function respond({message}) {
    const msg = message.content.toLowerCase()
    let channelid = msg.split(" ")[1]
    let msg_send = message.content.substring(msg.indexOf(channelid) + channelid.length)
    process.send({send_type: 'all', cmd: 'respond', 
                value: {
                    send_id: message.channel.id, receive_id: channelid, msg_send: msg_send, 
                    author_name: message.author.username, embed_color: '0', 
                    avatarURL: message.author.displayAvatarURL({format: 'jpg', size: 2048})
                }})
}

async function childProc_respond({author_name, embed_color, send_id, receive_id, msg_send, avatarURL, DiscordCL = new Client()}) {
    let channel = DiscordCL.channels.cache.get(receive_id)
    if (channel) {
        const embed = new MessageEmbed()
        .setAuthor(`${author_name} responded`, avatarURL)
        .setColor(embed_color)
        .setDescription(msg_send);
        channel.send({embed})
        let send_channel = await DiscordCL.channels.fetch(send_id, false, false)
        let msg1 = await send_channel.send('Message has been sent')
        setTimeout(function(){ msg1.delete() }, 3000);
    }
}

module.exports = {
    respond,
    childProc_respond
}