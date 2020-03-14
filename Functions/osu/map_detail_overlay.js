const precalc = require('./precalc')
const other_modes_precalc = require('./other_modes_precalc')
const osu_pp_calc = require('./osu_pp_calc')
const taiko_pp_calc = require('./taiko_pp_calc')
const ctb_pp_calc = require('./ctb_pp_calc')
const mania_pp_calc = require('./mania_pp_calc')
const beatmap_detail = require('./beatmap_detail')


module.exports = async function (map, beatmapid, modenum, bitpresent, mods) {
    let maxCombo = ''
    let diffdetail = ''
    let mapdetail = ''
    let ppdetail = ''
    let star, bpm, time
    if (modenum == 0) {
        maxCombo = map.fc
        let parser = await precalc(beatmapid)
        let acc95 = osu_pp_calc(parser,bitpresent,maxCombo,0,0,0,95,'acc')
        let acc97 = osu_pp_calc(parser,bitpresent,maxCombo,0,0,0,97,'acc')
        let acc99 = osu_pp_calc(parser,bitpresent,maxCombo,0,0,0,99,'acc')
        let acc100 = osu_pp_calc(parser,bitpresent,maxCombo,0,0,0,100,'acc')
        let detail = beatmap_detail(mods,map.timetotal,0,map.bpm,acc100.cs, acc100.ar,acc100.od,acc100.hp)
        let totallength = Number(detail.timetotal).toFixed(0)
        star = Number(acc100.star.total).toFixed(2)
        bpm = Number(detail.bpm).toFixed(0)
        let ar = Number(detail.ar).toFixed(2)
        let od = Number(detail.od).toFixed(2)
        let hp = Number(detail.hp).toFixed(2)
        let cs = Number(detail.cs).toFixed(2)
        time = `${Math.floor(totallength / 60)}:${('0' + (totallength - Math.floor(totallength / 60) * 60)).slice(-2)}`
        diffdetail = `(Aim: ${Number(acc100.star.aim).toFixed(2) * 2}★, Speed: ${Number(acc100.star.speed).toFixed(2) * 2}★)`
        mapdetail = `**AR:** ${ar} / **OD:** ${od} / **HP:** ${hp} / **CS:** ${cs}`
        ppdetail = `**95%**-${Number(acc95.pp.total).toFixed(2)}pp | **97%**-${Number(acc97.pp.total).toFixed(2)}pp | **99%**-${Number(acc99.pp.total).toFixed(2)}pp | **100%**-${Number(acc100.pp.total).toFixed(2)}pp`
    } else if (modenum == 1) {
        maxCombo = "Can't calculated"
        let mapinfo = await other_modes_precalc(beatmapid, 1, bitpresent)
        let acc95 = taiko_pp_calc(mapinfo.star, mapinfo.od, mapinfo.fc, 95, 0, bitpresent).toFixed(2)
        let acc97 = taiko_pp_calc(mapinfo.star, mapinfo.od, mapinfo.fc, 97, 0, bitpresent).toFixed(2)
        let acc99 = taiko_pp_calc(mapinfo.star, mapinfo.od, mapinfo.fc, 99, 0, bitpresent).toFixed(2)
        let acc100 = taiko_pp_calc(mapinfo.star, mapinfo.od, mapinfo.fc, 100, 0, bitpresent).toFixed(2)
        let detail = beatmap_detail(mods, map.timetotal, 0, map.bpm, 0, 0, mapinfo.od, mapinfo.hp)
        let totallength = Number(detail.timetotal).toFixed(0)
        star = Number(mapinfo.star).toFixed(2)
        bpm = Number(detail.bpm).toFixed(0)
        let od = Number(detail.od).toFixed(2)
        let hp = Number(detail.hp).toFixed(2)
        time = `${Math.floor(totallength / 60)}:${('0' + (totallength - Math.floor(totallength / 60) * 60)).slice(-2)}`
        mapdetail = `**OD:** ${od} / **HP:** ${hp}`
        ppdetail = `**95%**-${Number(acc95).toFixed(2)}pp | **97%**-${Number(acc97).toFixed(2)}pp | **99%**-${Number(acc99).toFixed(2)}pp | **100%**-${Number(acc100).toFixed(2)}pp`
    } else if (modenum == 2) {
        maxCombo = map.fc
        let mapinfo = await other_modes_precalc(beatmapid, 2, bitpresent)
        let acc95 = ctb_pp_calc(mapinfo.star, mapinfo.ar, mapinfo.fc, mapinfo.fc, 95, 0, bitpresent).toFixed(2)
        let acc97 = ctb_pp_calc(mapinfo.star, mapinfo.ar, mapinfo.fc, mapinfo.fc, 97, 0, bitpresent).toFixed(2)
        let acc99 = ctb_pp_calc(mapinfo.star, mapinfo.ar, mapinfo.fc, mapinfo.fc, 99, 0, bitpresent).toFixed(2)
        let acc100 = ctb_pp_calc(mapinfo.star, mapinfo.ar, mapinfo.fc, mapinfo.fc, 100, 0, bitpresent).toFixed(2)
        let detail = beatmap_detail(mods,map.timetotal,0, map.bpm, mapinfo.cs, mapinfo.ar, mapinfo.od, mapinfo.hp)
        let totallength = Number(detail.timetotal).toFixed(0)
        star = Number(mapinfo.star).toFixed(2)
        bpm = Number(detail.bpm).toFixed(0)
        let ar = Number(detail.ar).toFixed(2)
        let od = Number(detail.od).toFixed(2)
        let hp = Number(detail.hp).toFixed(2)
        let cs = Number(detail.cs).toFixed(2)
        time = `${Math.floor(totallength / 60)}:${('0' + (totallength - Math.floor(totallength / 60) * 60)).slice(-2)}`
        mapdetail = `**AR:** ${ar} / **OD:** ${od} / **HP:** ${hp} / **CS:** ${cs}`
        ppdetail = `**95%**-${Number(acc95).toFixed(2)}pp | **97%**-${Number(acc97).toFixed(2)}pp | **99%**-${Number(acc99).toFixed(2)}pp | **100%**-${Number(acc100).toFixed(2)}pp`
    } else if (modenum == 3) {
        maxCombo = "Can't calculated"
        let mapinfo = await other_modes_precalc(beatmapid, 3, bitpresent)
        let score700k = mania_pp_calc(mapinfo.star, mapinfo.od, 700000, mapinfo.fc, bitpresent).toFixed(2)
        let score800k = mania_pp_calc(mapinfo.star, mapinfo.od, 800000, mapinfo.fc, bitpresent).toFixed(2)
        let score900k = mania_pp_calc(mapinfo.star, mapinfo.od, 900000, mapinfo.fc, bitpresent).toFixed(2)
        let score1m = mania_pp_calc(mapinfo.star, mapinfo.od, 1000000, mapinfo.fc, bitpresent).toFixed(2)
        let detail = beatmap_detail(mods, map.timetotal, 0, map.bpm, 0, 0, 0, 0)
        let totallength = Number(detail.timetotal).toFixed(0)
        star = Number(mapinfo.star).toFixed(2)
        bpm = Number(detail.bpm).toFixed(0)
        let key = Number(mapinfo.cs).toFixed(0)
        let od = Number(mapinfo.od).toFixed(2)
        let hp = Number(mapinfo.hp).toFixed(2)
        time = `${Math.floor(totallength / 60)}:${('0' + (totallength - Math.floor(totallength / 60) * 60)).slice(-2)}`
        mapdetail = `**Keys:** ${key} / **OD:** ${od} / **HP:** ${hp}`
        ppdetail = `**700k**-${Number(score700k).toFixed(2)}pp | **800k**-${Number(score800k).toFixed(2)}pp | **900k**-${Number(score900k).toFixed(2)}pp | **1m**-${Number(score1m).toFixed(2)}pp`
    }
    let embed = `
**Length:** ${time} **BPM:** ${bpm} **Mods:** ${mods.toUpperCase()}
**Download:** [map](https://osu.ppy.sh/d/${map.beatmapsetID}) ([no vid](https://osu.ppy.sh/d/${map.beatmapsetID}n))
<:difficultyIcon:507522545759682561> __${map.diff}__  
**Difficulty:** ${star}★ ${diffdetail}
**Max Combo:** ${maxCombo}
${mapdetail}
**PP:** ${ppdetail}`
    return embed
}