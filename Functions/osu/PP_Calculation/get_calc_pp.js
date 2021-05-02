const get_mode_detail = require('../get_mode_detail')
const std_pp_calc = require('./std_pp_calc')
const taiko_pp_calc = require('./taiko_pp_calc')
const ctb_pp_calc = require('./ctb_pp_calc')
const mania_pp_calc = require('./mania_pp_calc')
const getLocalText = require('../../../Lang/lang_handler')

module.exports = ({pp, mode, parser, mod_num, mod_text, score, combo, fc, star, count_300, count_100, count_50, 
                count_miss, count_geki, count_katu, acc, perfect, recent = false, cs, od, ar, hp, circle, slider, lang}) => {
    try {
        let localText = getLocalText({lang: lang}).osu.fx_calc_pp
        let fcpp = 0
        let fcacc = 0
        let fcguess = ''
        let mapcomplete = ''
        let {a_mode, check_type} = get_mode_detail({mode: mode})
        if (a_mode == 'std') {
            if (!parser.map.objects.length) return null;
            let fccalc = std_pp_calc({parser: parser, mod_num: mod_num, combo: fc, count_100: count_100, count_50: count_50,
                                    count_miss: 0, acc: acc, mode: 'fc'})
            fcpp = Number(fccalc.pp.total).toFixed(2)
            fcacc = fccalc.acc
            star = Number(fccalc.star.total).toFixed(2)
            if (check_type == "Bancho" && recent) {
                let end = fccalc.star.objects[fccalc.star.objects.length - 1].obj.time - fccalc.star.objects[0].obj.time
                let point = fccalc.star.objects[count_300 + count_100 + count_50 + count_miss - 1].obj.time - fccalc.star.objects[0].obj.time
                mapcomplete = `${localText.completed}: ${Number((point / end) * 100).toFixed(2)}%`
                let recentcalc = std_pp_calc({parser: parser, mod_num: mod_num, combo: combo, count_100: count_100, count_50: count_50,
                                            count_miss: count_miss, acc: acc, mode: 'acc'})
                pp = Number(recentcalc.pp.total)
            }
        } else if (a_mode == 'taiko') {
            let count_300 = fc - count_100
            fcacc = Number(Number((0.5 * count_100 + count_300) / (count_300 + count_100) * 100).toFixed(2))
            fcpp = taiko_pp_calc({star: star, od: od, combo: fc, acc: fcacc, miss: 0, mod: mod_text}).toFixed(2)
            if (check_type == "Bancho" && recent) {
                mapcomplete = `${localText.completed}: ${((count_300 + count_100 + count_miss) / circle + slider)* 100}%`
                pp = taiko_pp_calc({star: star, od: od, combo: fc, acc: acc, miss: count_miss, mod: mod_text}).toFixed(2)
            }
        } else if (a_mode == 'ctb') {
            let count_300 = fc - count_100 - count_50
            fcacc = Number((count_50 + count_100 + count_300) / (count_50 + count_100 + count_300) * 100).toFixed(2)
            fcpp = ctb_pp_calc({star: star, ar: ar, fc: fc, combo: fc, acc: fcacc, miss: 0, mod: mod_text}).toFixed(2)
            if (check_type == "Bancho" && recent) {
                mapcomplete = `${localText.completed}: ${((count_300 + count_katu + count_100 + count_50 + count_miss) / (circle + slider))* 100}%`
                pp = ctb_pp_calc({star: star, ar: ar, fc: fc, combo: combo, acc: acc, miss: count_miss, mod: mod_text}).toFixed(2)
            }
        } else if (a_mode == 'mania') {
            fcacc = Number(21.7147240951625 * Math.log(score/10000)*10000).toFixed(0)
            fcpp = mania_pp_calc({mod: mod_text, star: star, score: fcacc, od: od, obj_count: fc}).toFixed(2)
            if (check_type == "Bancho" && recent) {
                mapcomplete = `${localText.completed}: ${((count_300 + count_katu + count_100 + count_geki + count_50 + count_miss) / (circle + slider))* 100}%`
                pp = mania_pp_calc({mod: mod_text, star: star, score: score, od: od, obj_count: fc})
            }
        }
        if (perfect == 0) {
            fcguess = localText.fc_guess.replace("{fcpp}", fcpp).replace("{fcacc}", fcacc)
            if (a_mode == 'std' || a_mode == 'taiko' || a_mode == 'ctb') {
                fcguess += `%`
            }
        }
        return {pp: Number(pp), star: Number(star).toFixed(2), fcguess: fcguess, mapcomplete: mapcomplete}
    } catch (err) {
        console.log(`\nget_calc_pp.js\n${err}`)
    }
}