const precalc = require('./../PP_Calculation/precalc')
const std_pp_calc = require('./../PP_Calculation/std_pp_calc')
const taiko_pp_calc = require('./../PP_Calculation/taiko_pp_calc')
const ctb_pp_calc = require('./../PP_Calculation/ctb_pp_calc')
const mania_pp_calc = require('./../PP_Calculation/mania_pp_calc')
const { MessageEmbed } = require('discord.js-light') 
const get_mode_detail = require('./../get_mode_detail')
const beatmap_detail = require('./../beatmap_detail')
const get_diff_icon = require('../get_diff_icon')

module.exports = ({map, parser, mode, mod_num, mod_text, creator_user, embed_color}) => {
    let {modenum, a_mode} = get_mode_detail({mode: mode})
    let diffdetail = '', ppdetail = '', mapdetail = '';
    let star = (modenum !== 0) ? Number(map.star).toFixed(2) : 0
    let acc_calc_list = [95,97,99,100]
    let detail = beatmap_detail({mod: mod_text, time_total: map.time_total, bpm: map.bpm, 
                                cs: map.cs, ar: map.ar,od: map.od, hp: map.hp})
    for (let d in detail) {
        if (d == 'bpm' || d == 'time_total') detail[d] = Number(Number(detail[d]).toFixed(0))
        else detail[d] = Number(Number(detail[d]).toFixed(2))
    }
    let {cs, ar, od , hp, bpm, time_total} = detail
    let time = `${Math.floor(time_total / 60)}:${('0' + (time_total - Math.floor(time_total / 60) * 60)).slice(-2)}`
    if (modenum == 0) {
        let acc_list = acc_calc_list.map(a => std_pp_calc({parser: parser, mod_num: mod_num, 
                                                            combo: map.fc, mode: 'acc', acc: a}))
        star = Number(acc_list[0].star.total).toFixed(2)
        diffdetail = `(Aim: ${Number(acc_list[0].star.aim).toFixed(2) * 2}★, Speed: ${Number(acc_list[0].star.speed).toFixed(2) * 2}★)`
        mapdetail = `**AR:** ${ar} • **OD:** ${od} • **HP:** ${hp} • **CS:** ${cs}`
        ppdetail = acc_calc_list.map((v, i) => `**${v}%**-${Number(acc_list[i].pp.total).toFixed(2)}pp`).join(' • ')
    } else if (modenum == 1) {
        let acc_list = acc_calc_list.map(a => taiko_pp_calc({star: map.star, od: map.od, combo: map.fc, 
                                                            miss: 0, mod: mod_text, acc: a}))
        
        mapdetail = `**OD:** ${od} • **HP:** ${hp}`
        ppdetail = acc_calc_list.map((v, i) => `**${v}%**-${Number(acc_list[i]).toFixed(2)}pp`).join(' • ')
    } else if (modenum == 2) {
        let acc_list = acc_calc_list.map(a => ctb_pp_calc({star: star, ar: ar, fc: map.fc, combo: map.fc,
                                                            miss: 0, mod: mod_text, acc: a}))
        mapdetail = `**AR:** ${ar} • **OD:** ${od} • **HP:** ${hp} • **CS:** ${cs}`
        ppdetail = acc_calc_list.map((v, i) => `**${v}%**-${Number(acc_list[i]).toFixed(2)}pp`).join(' • ')
    } else if (modenum == 3) {
        let score_calc_list = [700000, 800000, 900000, 1000000]
        let score_text_list = ['700k', '800k', '900k', '1m']
        let score_list = score_calc_list.map(s => mania_pp_calc({mod: mod_text, star: map.star, od: od, 
                                                                obj_count: map.fc, score: s}))
        mapdetail = `**Keys:** ${cs} • **OD:** ${od} • **HP:** ${hp}`
        ppdetail = score_calc_list.map((v, i) => `**${score_text_list[i]}**-${Number(score_list[i]).toFixed(2)}pp`).join(' • ')
    }
    let diff_icon = get_diff_icon({star: star, a_mode: a_mode})
    
    if (creator_user?.id == undefined) {
        creator_user = {
            id: null
        }
    }

    let embed_desc = `${diff_icon} __${map.diff}__ \`${mod_text}\`
Mapped by: [**${map.creator}**](https://osu.ppy.sh/users/${creator_user.id})
**Difficulty:** ${star}★ ${diffdetail}
**Max Combo:** ${map.fc}
${mapdetail}`
    let embed_mapdetail = `<:length:734962023154319431>: ${time}
<:bpm:734963724317753394>: ${bpm}
<:circle:734965464630820934>: ${map.circle}
<:slider:735088149323186197>: ${map.slider}
<:spinner:735088149411266620>: ${map.spinner}`
    let embed_download = `[bancho](https://osu.ppy.sh/d/${map.beatmapset_id}) • [bancho no vid](https://osu.ppy.sh/d/${map.beatmapset_id}n) • [bloodcat](http://bloodcat.com/osu/s/${map.beatmapset_id})`
    let embed_pp = `${ppdetail}`
    let embed = new MessageEmbed()
    embed.setAuthor(`${map.title} (${map.artist})`, `https://a.ppy.sh/${creator_user.id}?0.png`, `https://osu.ppy.sh/b/${map.beatmap_id}`)
    embed.addField('\u200B', embed_desc, true)
    embed.addField('\u200B', embed_mapdetail, true)
    embed.addField('Downloads', embed_download)
    embed.addField('Estimated PP if FC', embed_pp)
    embed.setImage(`https://assets.ppy.sh/beatmaps/${map.beatmapset_id}/covers/cover@2x.jpg`)
    embed.setColor(embed_color)
    embed.setFooter(`${map.approvalStatus} • ❤: ${map.favorite}`);
    return embed
}