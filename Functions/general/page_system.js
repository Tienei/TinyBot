const { Message, MessageEmbed } = require('discord.js')

module.exports = async function (message = new Message(), page_fx, author, thumbnail, color, max_page, max_duration = 120000) {
    var page = 1
    var pages = []
    pages = await page_fx.load(page, pages)
    var t_author = author
    t_author = t_author.replace("{page}", page)
    t_author = t_author.replace("{max_page}", max_page)
    var embed = new MessageEmbed()
    .setAuthor(t_author)
    .setThumbnail(thumbnail)
    .setColor(color)
    .setDescription(pages[page-1]);
    var msg1 = await message.channel.send({embed});
    if (max_page > 1) {
        await msg1.react('⬅')
        await msg1.react('➡')
        var previousfilter = (reaction, user) => reaction.emoji.name == "⬅" && user.id == message.author.id
        var nextfilter = (reaction, user) => reaction.emoji.name == "➡" && user.id == message.author.id
        var previous = msg1.createReactionCollector(previousfilter, {time: max_duration}) 
        var next = msg1.createReactionCollector(nextfilter, {time: max_duration})
        previous.on('collect', reaction => {
            if (page <= 1) {return}
            page -= 1
            t_author = author
            t_author = t_author.replace("{page}", page)
            t_author = t_author.replace("{max_page}", max_page)    
            embed.setAuthor(t_author)
            embed.setDescription(pages[page-1])
            msg1.edit({embed})
        })
        next.on('collect', async reaction => {
            if (page >= max_page) {return}
            page += 1
            msg1.edit('Loading page...')
            if (pages[page-1] == undefined) {
                pages = await page_fx.load(page, pages)
            }
            t_author = author
            t_author = t_author.replace("{page}", page)
            t_author = t_author.replace("{max_page}", max_page)
            embed.setAuthor(t_author)
            embed.setDescription(pages[page-1])
            msg1.edit({embed})
        })
    }
}