const { Message, MessageEmbed } = require('discord.js-light')

/** 
 * @param {{message: Message, embed: MessageEmbed}} 
 */
module.exports = async ({message, embed, update_func, max_duration = 12000, max_page}) => {
    let page = 1
    let page_cache = []
    page_cache[page] = await update_func({page: page})
    let c_footer = embed.footer.text
    embed.footer.text = (max_page > 1) ? embed.footer.text.replace('{page}', `(Page ${page} of ${max_page})`)
                                        : embed.footer.text.replace('{page}', '')
    embed.setDescription(page_cache[page])
    let msg = await message.channel.send({embed})
    embed.setFooter(c_footer)
    if (max_page > 1) {
        let collector = msg.createReactionCollector((reaction, user) => user.id == message.author.id, {time: max_duration}) 
        let divider = (Math.pow(max_page, 0.5))
        let mid_page = Math.floor(max_page/divider)
        // React in order
        await msg.react('⏮️')
        if (mid_page >= 2) {
            await msg.react('⏪')
        }
        if (max_page > 2) {
            await msg.react('⬅')
            await msg.react('➡')
        }
        if (mid_page >= 2) {
            await msg.react('⏩')
        }
        await msg.react('⏭️')
        //
        collector.on('collect', async (reaction) => {
            switch (reaction.emoji.name) {
                case '⏮️': page = 1; break;
                case '⏪': page -= mid_page; break;
                case '⬅': page--; break;
                case '➡': page++; break;
                case '⏩': page += mid_page; break;
                case '⏭️': page = max_page; break;
            }
            if (page < 1) page = 1
            if (page > max_page) page = max_page
            msg.edit('Loading page...')
            // Update
            if (!page_cache[page]) page_cache[page] = await update_func({page: page})
            embed.footer.text = (max_page > 1) ? embed.footer.text.replace('{page}', `(Page ${page} of ${max_page})`)
                                                : embed.footer.text.replace('{page}', '')
            embed.setDescription(page_cache[page])
            msg.edit({embed})
            embed.setFooter(c_footer)
        })
    }
}