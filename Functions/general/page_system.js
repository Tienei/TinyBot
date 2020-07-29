const { Message, MessageEmbed } = require('discord.js-light')

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
        function create_collector(emote, fx) {
            let filter = (reaction, user) => reaction.emoji.name == emote && user.id == message.author.id
            let collector = msg1.createReactionCollector(filter, {time: max_duration}) 
            collector.on('collect', reaction => {
                fx.load()
            })
        }
        async function load_fx() {
            if (pages[page-1] == undefined) pages = await page_fx.load(page, pages);
            t_author = author
            t_author = t_author.replace("{page}", page)
            t_author = t_author.replace("{max_page}", max_page)    
            embed.setAuthor(t_author)
            embed.setDescription(pages[page-1])
            msg1.edit({embed})
        }
        let divider = (Math.pow(max_page, 0.5))
        let begin_fx = async function () {
            page = 1
            msg1.edit('Loading page...')
            await load_fx()
        }
        let backward_fx = async function() {
            page -= Math.floor(max_page/divider)
            if (page <= 1) page = 1
            msg1.edit('Loading page...')
            await load_fx()
        }
        let previous_fx = async function() {
            if (page > 1) page -= 1
            msg1.edit('Loading page...')
            await load_fx()
        }
        let next_fx = async function() {
            if (page < max_page) page += 1
            msg1.edit('Loading page...')
            await load_fx()
        }
        let forward_fx = async function() {
            page += Math.floor(max_page/divider)
            if (page >= max_page) page = max_page
            msg1.edit('Loading page...')
            await load_fx()
        }
        let end_fx = async function () {
            page = max_page
            msg1.edit('Loading page...')
            await load_fx()
        }
        await msg1.react('⏮️')
        create_collector('⏮️', {load: begin_fx})
        if (Math.floor(max_page/divider) >= 2) {
            await msg1.react('⏪')
            create_collector('⏪', {load: backward_fx})
        }
        if (max_page >= 2) {
            await msg1.react('⬅')
            await msg1.react('➡')
            create_collector('⬅', {load: previous_fx})
            create_collector('➡', {load: next_fx})
        }
        if (Math.floor(max_page/divider) >= 2) {
            await msg1.react('⏩')
            create_collector('⏩', {load: forward_fx})
        }
        await msg1.react('⏭️')
        create_collector('⏭️', {load: end_fx})
    }
}
