const precalc = require('./precalc')
const other_modes_precalc = require('./other_modes_precalc')
const osu_pp_calc = require('./osu_pp_calc')
const taiko_pp_calc = require('./taiko_pp_calc')
const ctb_pp_calc = require('./ctb_pp_calc')
const mania_pp_calc = require('./mania_pp_calc')
const beatmap_detail = require('./beatmap_detail')
const diff_icon = require('./get_diff_icon')
const { MessageEmbed } = require('discord.js-light')


module.exports = async function ({map, beatmapid, modenum, bitpresent, mods, embedcolor, creator_user}) {
    let maxCombo = ''
    let diffdetail = ''
    let mapdetail = ''
    let ppdetail = ''
    let star, bpm, time
    function getMapDetail({mods, timetotal, timedrain=0, bpm, cs, ar, od, hp}) {
        let detail = beatmap_detail(mods, timetotal, timedrain, bpm, cs, ar, od, hp) 
        return {ar: Number(detail.ar).toFixed(2), od: Number(detail.od).toFixed(2),
                hp: Number(detail.hp).toFixed(2), cs: Number(detail.cs).toFixed(2),
                d_bpm: Number(detail.bpm).toFixed(0), totallength: Number(detail.timetotal).toFixed(0)}
    }
    if (modenum == 0) {
        maxCombo = map.fc
        let parser = await precalc(beatmapid)
        let acc95 = osu_pp_calc(parser,bitpresent,maxCombo,0,0,0,95,'acc')
        let acc97 = osu_pp_calc(parser,bitpresent,maxCombo,0,0,0,97,'acc')
        let acc99 = osu_pp_calc(parser,bitpresent,maxCombo,0,0,0,99,'acc')
        let acc100 = osu_pp_calc(parser,bitpresent,maxCombo,0,0,0,100,'acc')
        let {totallength, d_bpm, cs, ar, od, hp} = getMapDetail({mods, timetotal: map.timetotal,
                                                                bpm: map.bpm, cs: acc100.cs, ar: acc100.ar,
                                                                od: acc100.od, hp:acc100.hp})
        star = Number(acc100.star.total).toFixed(2)
        bpm = d_bpm
        time = `${Math.floor(totallength / 60)}:${('0' + (totallength - Math.floor(totallength / 60) * 60)).slice(-2)}`
        diffdetail = `(Aim: ${Number(acc100.star.aim).toFixed(2) * 2}★, Speed: ${Number(acc100.star.speed).toFixed(2) * 2}★)`
        mapdetail = `**AR:** ${ar} • **OD:** ${od} • **HP:** ${hp} • **CS:** ${cs}`
        ppdetail = `**95%**-${Number(acc95.pp.total).toFixed(2)}pp • **97%**-${Number(acc97.pp.total).toFixed(2)}pp • **99%**-${Number(acc99.pp.total).toFixed(2)}pp • **100%**-${Number(acc100.pp.total).toFixed(2)}pp`
    } else if (modenum == 1) {
        maxCombo = "Can't calculated"
        let mapinfo = await other_modes_precalc(beatmapid, 1, bitpresent)
        let acc95 = taiko_pp_calc(mapinfo.star, mapinfo.od, mapinfo.fc, 95, 0, bitpresent).toFixed(2)
        let acc97 = taiko_pp_calc(mapinfo.star, mapinfo.od, mapinfo.fc, 97, 0, bitpresent).toFixed(2)
        let acc99 = taiko_pp_calc(mapinfo.star, mapinfo.od, mapinfo.fc, 99, 0, bitpresent).toFixed(2)
        let acc100 = taiko_pp_calc(mapinfo.star, mapinfo.od, mapinfo.fc, 100, 0, bitpresent).toFixed(2)
        let {totallength, d_bpm, cs, ar, od, hp} = getMapDetail({mods, timetotal: map.timetotal,
                                                                bpm: map.bpm, cs: acc100.cs, ar: acc100.ar,
                                                                od: acc100.od, hp:acc100.hp})
        star = Number(mapinfo.star).toFixed(2)
        bpm = d_bpm
        time = `${Math.floor(totallength / 60)}:${('0' + (totallength - Math.floor(totallength / 60) * 60)).slice(-2)}`
        mapdetail = `**OD:** ${od} • **HP:** ${hp}`
        ppdetail = `**95%**-${Number(acc95.pp.total).toFixed(2)}pp • **97%**-${Number(acc97.pp.total).toFixed(2)}pp • **99%**-${Number(acc99.pp.total).toFixed(2)}pp • **100%**-${Number(acc100.pp.total).toFixed(2)}pp`
    } else if (modenum == 2) {
        maxCombo = map.fc
        let mapinfo = await other_modes_precalc(beatmapid, 2, bitpresent)
        let acc95 = ctb_pp_calc(mapinfo.star, mapinfo.ar, mapinfo.fc, mapinfo.fc, 95, 0, bitpresent).toFixed(2)
        let acc97 = ctb_pp_calc(mapinfo.star, mapinfo.ar, mapinfo.fc, mapinfo.fc, 97, 0, bitpresent).toFixed(2)
        let acc99 = ctb_pp_calc(mapinfo.star, mapinfo.ar, mapinfo.fc, mapinfo.fc, 99, 0, bitpresent).toFixed(2)
        let acc100 = ctb_pp_calc(mapinfo.star, mapinfo.ar, mapinfo.fc, mapinfo.fc, 100, 0, bitpresent).toFixed(2)
        let {totallength, d_bpm, cs, ar, od, hp} = getMapDetail({mods, timetotal: map.timetotal,
                                                                bpm: map.bpm, cs: acc100.cs, ar: acc100.ar,
                                                                od: acc100.od, hp:acc100.hp})
        star = Number(mapinfo.star).toFixed(2)
        bpm = d_bpm
        time = `${Math.floor(totallength / 60)}:${('0' + (totallength - Math.floor(totallength / 60) * 60)).slice(-2)}`
        mapdetail = `**AR:** ${ar} • **OD:** ${od} • **HP:** ${hp} • **CS:** ${cs}`
        ppdetail = `**95%**-${Number(acc95.pp.total).toFixed(2)}pp • **97%**-${Number(acc97.pp.total).toFixed(2)}pp • **99%**-${Number(acc99.pp.total).toFixed(2)}pp • **100%**-${Number(acc100.pp.total).toFixed(2)}pp`
    } else if (modenum == 3) {
        maxCombo = "Can't calculated"
        let mapinfo = await other_modes_precalc(beatmapid, 3, bitpresent)
        let score700k = mania_pp_calc(mapinfo.star, mapinfo.od, 700000, mapinfo.fc, bitpresent).toFixed(2)
        let score800k = mania_pp_calc(mapinfo.star, mapinfo.od, 800000, mapinfo.fc, bitpresent).toFixed(2)
        let score900k = mania_pp_calc(mapinfo.star, mapinfo.od, 900000, mapinfo.fc, bitpresent).toFixed(2)
        let score1m = mania_pp_calc(mapinfo.star, mapinfo.od, 1000000, mapinfo.fc, bitpresent).toFixed(2)
        let {totallength, d_bpm, cs, ar, od, hp} = getMapDetail({mods, timetotal: map.timetotal,
                                                                bpm: map.bpm, cs: acc100.cs, ar: acc100.ar,
                                                                od: acc100.od, hp:acc100.hp})
        star = Number(mapinfo.star).toFixed(2)
        bpm = d_bpm
        time = `${Math.floor(totallength / 60)}:${('0' + (totallength - Math.floor(totallength / 60) * 60)).slice(-2)}`
        mapdetail = `**Keys:** ${cs} • **OD:** ${od} • **HP:** ${hp}`
        ppdetail = `**700k**-${Number(score700k).toFixed(2)}pp • **800k**-${Number(score800k).toFixed(2)}pp • **900k**-${Number(score900k).toFixed(2)}pp • **1m**-${Number(score1m).toFixed(2)}pp`
    }
    let embed_desc = `${diff_icon(star)} __${map.diff}__
Mapped by: [**${map.creator}**](https://osu.ppy.sh/users/${creator_user.id})
**Difficulty:** ${star}★ ${diffdetail}
**Max Combo:** ${maxCombo}
${mapdetail}`
    let embed_mapdetail = `<:length:734962023154319431>: ${time}
<:bpm:734963724317753394>: ${bpm}
<:circle:734965464630820934>: ${map.circle}
<:slider:735088149323186197>: ${map.slider}
<:spinner:735088149411266620>: ${map.spinner}`
    let embed_download = `[bancho](https://osu.ppy.sh/d/${map.beatmapsetID}) • [bancho no vid](https://osu.ppy.sh/d/${map.beatmapsetID}n) • [bloodcat](http://bloodcat.com/osu/s/${map.beatmapsetID})`
    let embed_pp = `${ppdetail}`
    let embed = new MessageEmbed()
    embed.setAuthor(`${map.title} (${map.artist})`, `https://a.ppy.sh/${creator_user.id}?0.png`)
    embed.addField('\u200B', embed_desc, true)
    embed.addField('\u200B', embed_mapdetail, true)
    embed.addField('Downloads', embed_download)
    embed.addField('Estimated PP if FC', embed_pp)
    embed.setImage(`https://assets.ppy.sh/beatmaps/${map.beatmapsetID}/covers/cover.jpg`)
    embed.setColor(embedcolor)
    embed.setFooter(`${map.approvalStatus} • ❤: ${map.favorite}`);
    return embed
}