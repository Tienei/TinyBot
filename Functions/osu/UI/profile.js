const get_profile_link = require('./../get_profile_link')
const get_icon = require('./../../general/icon_lib')
const { MessageEmbed } = require('discord.js-light')
const getLocalText = require('../../../Lang/lang_handler')

module.exports = ({mode, refresh, modeicon, embed_color, lang, supporter, modename, username, id, pp, global_rank,
                country_code, country_rank, acc, playcount, level, playstyle, count_ssh, count_ss, count_sh, count_s, count_a, 
                online, online_icon, discord_tag, user_tag}) => {
    let localText = getLocalText({lang: lang, cmd: "osu"}).osu.profile
    let {profile_link, pfp_link} = get_profile_link({id: id, mode: mode, refresh: refresh})
    let desc = ''
    if (modeicon) desc += `${modeicon}`;
    if (discord_tag == user_tag) desc += `${get_icon({type: "osu_verified"})}`
    desc += ` **${localText.desc1.replace("{modename}", modename).replace("{username}", username).replace("{profile_link}", profile_link)}**`
    // Field 1
    let field1 = ''
    if (pp > -1) field1 += `--- **${pp}pp**\n`
    if (global_rank > -1) {
        field1 += `**${localText.global_rank}** #${global_rank}`
        if (country_code && country_rank)   field1 += ` (:flag_${country_code}:: #${country_rank})\n`
        else                                field1 += `\n`
    }
    if (acc > -1)                field1 += `**${localText.acc}:** ${acc}%\n`
    if (playcount > -1)          field1 += `**${localText.play_count}:** ${(playcount).toLocaleString('en')}\n`
    if (level > -1)              field1 += `**${localText.lvl}:** ${level}\n`
    if (!!playstyle.length) field1 += `**${localText.play_style}:**\n${playstyle.join(', ')}`
    if (field1.substr(-1) == "\n") field1 = field1.substring(0, field1.length-1)
    // Field 2
    let field2 = ''
    if (count_ss > -1 && count_s > -1 && count_a > -1) {
        field2 += `${get_icon({type: "rank_SSH"})}: ${count_ssh}\n${get_icon({type: "rank_SS"})}: ${count_ss}\n` +
                    `${get_icon({type: "rank_SH"})}: ${count_sh}\n${get_icon({type: "rank_S"})}: ${count_s}\n`+
                    `${get_icon({type: "rank_A"})}: ${count_a}`
    }
    let embed = new MessageEmbed()
    embed.setColor(embed_color)
    embed.setThumbnail(pfp_link) 
    if (desc) embed.setDescription(desc)
    if (field1) embed.addField(localText.performance, field1, true)
    if (field2) embed.addField(localText.rank, field2, true)
    if (online) embed.setFooter(online, online_icon)
    return embed
}