// Functions
const osu_pp_calc = require('./osu_pp_calc')
const other_modes_precalc = require('./other_modes_precalc')
const taiko_pp_calc = require('./taiko_pp_calc')
const ctb_pp_calc = require('./ctb_pp_calc')
const mania_pp_calc = require('./mania_pp_calc')

module.exports = async function (mode, parser, beatmapid, bitpresent, score, combo, fc, count300, count100, count50, countmiss, countgeki, countkatu, acc, perfect, recent = false) {
    let pp = 0
    let fcpp = 0
    let fcacc = 0
    let star = 0
    let fcguess = ''
    let mapcomplete = 0
    if (mode == 'std') {
        let fccalc = osu_pp_calc(parser,bitpresent,fc,count100,count50,0,acc,'fc')
        fcpp = Number(fccalc.pp.total).toFixed(2)
        fcacc = fccalc.acc
        star = Number(fccalc.star.total).toFixed(2)
        if (recent == true) {
            let end = fccalc.star.objects[fccalc.star.objects.length - 1].obj.time - fccalc.star.objects[0].obj.time
            let point = fccalc.star.objects[count300 + count100 + count50 + countmiss - 1].obj.time - fccalc.star.objects[0].obj.time
            mapcomplete = Number((point / end) * 100).toFixed(2)
            let recentcalc = osu_pp_calc(parser,bitpresent,combo,count100,count50,countmiss,acc,'acc')
            pp = Number(recentcalc.pp.total)
        }
    }
    if (mode == 'taiko') {
        let mapinfo = await other_modes_precalc(beatmapid, 1, bitpresent)
        star = Number(mapinfo.star).toFixed(2)
        let count300 = mapinfo.fc - count100
        fcacc = Number((0.5 * count100 + count300) / (count300 + count100 + 0) * 100).toFixed(2)
        fcpp = taiko_pp_calc(mapinfo.star, mapinfo.od, mapinfo.fc, fcacc, 0, bitpresent).toFixed(2)
        mapcomplete = ((count300 + count100 + countmiss) / mapinfo.circle + mapinfo.slider)* 100
        if (recent == true) {
            pp = taiko_pp_calc(mapinfo.star, mapinfo.od, mapinfo.fc, acc, countmiss, bitpresent)
        }
    }
    if (mode == 'ctb') {
        let mapinfo = await other_modes_precalc(beatmapid, 2, bitpresent)
        star = Number(mapinfo.star).toFixed(2)
        let count300 = mapinfo.fc - count100 - countkatu - count50
        fcacc = Number((count50 + count100 + count300) / (countkatu + 0 + count50 + count100 + count300) * 100).toFixed(2)
        fcpp = ctb_pp_calc(mapinfo.star, mapinfo.ar, mapinfo.fc, mapinfo.fc, fcacc, 0, bitpresent).toFixed(2)
        mapcomplete = ((count300 + countkatu + count100 + count50 + countmiss) / (mapinfo.circle + mapinfo.slider))* 100
        if (recent == true) {
            pp = ctb_pp_calc(mapinfo.star, mapinfo.ar, mapinfo.fc, combo, acc, countmiss, bitpresent)
        }
    }
    if (mode == 'mania') {
        let mapinfo = await other_modes_precalc(beatmapid, 3, bitpresent)
        star = Number(mapinfo.star).toFixed(2)
        fcacc = Number(21.7147240951625 * Math.log(score/10000)*10000).toFixed(0)
        fcpp = mania_pp_calc(mapinfo.star, mapinfo.od, fcacc, mapinfo.fc, bitpresent).toFixed(2)
        mapcomplete = ((count300 + countkatu + count100 + countgeki + count50 + countmiss) / (mapinfo.circle + mapinfo.slider))* 100
        if (recent == true) {
            pp = mania_pp_calc(mapinfo.star, mapinfo.od, score, mapinfo.fc, bitpresent)
        }
    }
    if (mode == 'rx') {
        let fccalc = osu_pp_calc(parser,bitpresent,fc,count100,count50,0,acc,'fc')
        fcpp = Number(fccalc.pp.total).toFixed(2)
        fcacc = fccalc.acc
        star = Number(fccalc.star.total).toFixed(2)
    }
    if (perfect == 0) {
        if (mode == 'std' || mode == 'taiko' || mode == 'ctb') {
            fcguess = `**${fcpp}pp for ${fcacc}%**`
        }
        if (mode == 'mania') {
            fcguess = `| **${fcpp}pp for ${fcacc} scores**`
        }
    }
    return {pp, star, fcguess, mapcomplete}
}