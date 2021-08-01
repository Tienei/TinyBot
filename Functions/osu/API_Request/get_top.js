const BanchoAPI = require('./BanchoAPI')
const RippleAPI = require('./RippleAPI')
const { Score, Beatmap } = require('../../../Classes/osu')
const get_mode_detail = require('../get_mode_detail')
const superagent = require('superagent')
const precalc = require('../PP_Calculation/precalc')
const mods_enum = require('../mods_enum')

module.exports = async ({name, mode, limit, type, no_bm = false, ver = 1}) => {
    try {
        let top = []
        let modedetail = get_mode_detail({mode: mode})
        let modenum = modedetail.modenum
        let a_mode = modedetail.a_mode
        let check_type = modedetail.check_type
        if (check_type == 'bancho') {
            if (ver == 1) {
                let req_opt = {u: name, m: modenum, limit: limit}
                let best = await BanchoAPI({ver: 1, endpoint: `get_user_${type}`, param: req_opt})
                for (let i = 0; i < best.length; i++) {
                    let count_300 = Number(best[i].count300)
                    let count_100 = Number(best[i].count100)
                    let count_50 = Number(best[i].count50)
                    let count_miss = Number(best[i].countmiss)
                    let count_geki = Number(best[i].countgeki)
                    let count_katu = Number(best[i].countkatu)
                    let acc = Number((300 * count_300 + 100 * count_100 + 50 * count_50) / (300 * (count_300 + count_100 + count_50 + count_miss)) * 100)
                    let accdetail = `[ ${count_300} • ${count_100} • ${count_50} • ${count_miss} ]`
                    if (modenum == 1) {
                        acc = Number((0.5 * count_100 + count_300) / (count_300 + count_100 + count_miss) * 100)
                        accdetail = `[ ${count_300} • ${count_100} • ${count_miss} ]`
                    }
                    if (modenum == 2) {
                        acc = Number((count_50 + count_100 + count_300) / (count_katu + count_miss + count_50 + count_100 + count_300) * 100)
                        accdetail = `[ ${count_300} • ${count_100} • ${count_katu} • ${count_miss} ]`
                    }
                    if (modenum == 3) {
                        acc = Number((50 * count_50 + 100 * count_100 + 200 * count_katu + 300 * (count_300 + count_geki)) / (300 * (count_miss + count_50 + count_100 + count_katu + count_300 + count_geki)) * 100)
                        accdetail = `[ ${count_geki} • ${count_300} • ${count_katu} • ${count_100} • ${count_50} • ${count_miss} ]`
                    }
                    top[i] = new Score({beatmap_id: best[i].beatmap_id, score: best[i].score, combo: best[i].maxcombo,
                                    count_50: count_50, count_100: count_100, count_300: count_300,
                                    count_miss: count_miss, count_katu: count_katu, count_geki: count_geki,
                                    perfect: best[i].perfect, mod_num: best[i].enabled_mods, user_id: best[i].user_id,
                                    date: best[i].date, rank: best[i].rank, pp: best[i].pp, acc: acc, acc_detail: accdetail, 
                                    top: i+1})
                }
                if (!no_bm) {
                    let beatmaps = top.map(async sc => {
                        let req_opt = {b: sc.beatmap_id, m: modenum, a: 1}
                        if (a_mode !== 'std') {
                            let mod = sc.mod_num
                            let bit = mod.toString(2)
                            let fullbit = "0000000000000000000000000000000".substr(bit.length) + bit
                            let bitpresent = 0
                            if (fullbit[31 - 2] == 1) bitpresent += 2;
                            if (fullbit[31 - 5] == 1) bitpresent += 16;
                            if (fullbit[31 - 7] == 1) bitpresent += 64;
                            if (fullbit[31 - 9] == 1) bitpresent += 256;
                            req_opt.mods = bitpresent
                        }
                        return BanchoAPI({ver: 1, endpoint: 'get_beatmaps', param: req_opt})
                    })
                    beatmaps = await Promise.all(beatmaps)
                    for (let i = 0; i < top.length; i++) {
                        let data = new Beatmap({title: beatmaps[i][0].title, creator: beatmaps[i][0].creator,
                                                diff: beatmaps[i][0].version, source: beatmaps[i][0].source,
                                                artist: beatmaps[i][0].artist, bpm: beatmaps[i][0].bpm,
                                                beatmapset_id: beatmaps[i][0].beatmapset_id,
                                                fc: beatmaps[i][0].max_combo, star: beatmaps[i][0].difficultyrating,
                                                time_total: beatmaps[i][0].total_length,
                                                time_drain: beatmaps[i][0].hit_length, circle: beatmaps[i][0].count_normal,
                                                slider: beatmaps[i][0].count_slider, spinner: beatmaps[i][0].count_spinner,
                                                a_mode: a_mode, ar: beatmaps[i][0].diff_approach, 
                                                hp: beatmaps[i][0].diff_drain, cs: beatmaps[i][0].diff_size,
                                                od: beatmaps[i][0].diff_overall})
                        top[i].addBeatmapInfo(data)
                    }
                }
            } else if (ver == 2) {
                let url_mode_list = ['osu', 'taiko', 'fruits', 'mania']
                let user = await BanchoAPI({ver: 2, endpoint: `users/${name}/${url_mode_list[modenum]}`})
                let best_param = {mode: url_mode_list[modenum], limit: limit}
                let best = await BanchoAPI({ver: 2, endpoint: `users/${user.id}/scores/${type}`, param: best_param})
                for (let i = 0; i < best.length; i++) {
                    let count_300 = Number(best[i].statistics.count_300)
                    let count_100 = Number(best[i].statistics.count_100)
                    let count_50 = Number(best[i].statistics.count_50)
                    let count_miss = Number(best[i].statistics.count_miss)
                    let count_geki = Number(best[i].statistics.count_geki)
                    let count_katu = Number(best[i].statistics.count_katu)
                    let acc = Number((300 * count_300 + 100 * count_100 + 50 * count_50) / (300 * (count_300 + count_100 + count_50 + count_miss)) * 100)
                    let accdetail = `[ ${count_300} • ${count_100} • ${count_50} • ${count_miss} ]`
                    if (modenum == 1) {
                        acc = Number((0.5 * count_100 + count_300) / (count_300 + count_100 + count_miss) * 100)
                        accdetail = `[ ${count_300} • ${count_100} • ${count_miss} ]`
                    }
                    if (modenum == 2) {
                        acc = Number((count_50 + count_100 + count_300) / (count_katu + count_miss + count_50 + count_100 + count_300) * 100)
                        accdetail = `[ ${count_300} • ${count_100} • ${count_katu} • ${count_miss} ]`
                    }
                    if (modenum == 3) {
                        acc = Number((50 * count_50 + 100 * count_100 + 200 * count_katu + 300 * (count_300 + count_geki)) / (300 * (count_miss + count_50 + count_100 + count_katu + count_300 + count_geki)) * 100)
                        accdetail = `[ ${count_geki} • ${count_300} • ${count_katu} • ${count_100} • ${count_50} • ${count_miss} ]`
                    }
                    top[i] = new Score({beatmap_id: best[i].beatmap.id, score: best[i].score, combo: best[i].max_combo,
                                        count_50: count_50, count_100: count_100, count_300: count_300,
                                        count_miss: count_miss, count_katu: count_katu, count_geki: count_geki,
                                        perfect: best[i].perfect, mod_num: mods_enum({mod: best[i].mods.join("")}).mod_num, 
                                        date: best[i].created_at, rank: best[i].rank, pp: best[i].pp, acc: acc, acc_detail: accdetail, 
                                        top: i+1, user_id: best[i].user_id})
                    let bm = await precalc({beatmap_id: best[i].beatmap.id})
                    let data = new Beatmap({title: best[i].beatmapset.title, creator: best[i].beatmapset.creator,
                                            diff: best[i].beatmap.version, source: best[i].beatmapset.source,
                                            artist: best[i].beatmapset.artist, bpm: best[i].beatmap.bpm,
                                            beatmapset_id: best[i].beatmapset.id,
                                            fc: bm.map.max_combo(), star: best[i].beatmap.difficulty_rating,
                                            time_total: best[i].beatmap.total_length,
                                            time_drain: best[i].beatmap.hit_length, circle: best[i].beatmap.circles,
                                            slider: best[i].beatmap.count_sliders, spinner: best[i].beatmap.count_spinners,
                                            a_mode: a_mode, ar: best[i].beatmap.ar, 
                                            hp: best[i].beatmap.drain, cs: best[i].beatmap.cs,
                                            od: best[i].beatmap.accuracy})
                    top[i].addBeatmapInfo(data)
                }
            }
        } else if (check_type == 'gatari') {
            let user_param = {u: name}
            let user = await (await superagent.get("https://api.gatari.pw/users/get").query(user_param)).body
            let best_param = {id: user.users[0].id, mode: modenum, p: 1, l: limit}
            let best = await (await superagent.get(`https://api.gatari.pw/user/scores/${type}`).query(best_param)).body
            for (var i = 0; i < best.scores.length; i++) {
                let count_300 = Number(best.scores[i].count_300)
                let count_100 = Number(best.scores[i].count_100)
                let count_50 = Number(best.scores[i].count_50)
                let count_miss = Number(best.scores[i].count_miss)
                let count_geki = Number(best.scores[i].count_geki)
                let count_katu = Number(best.scores[i].count_katu)
                let acc = Number((300 * count_300 + 100 * count_100 + 50 * count_50) / (300 * (count_300 + count_100 + count_50 + count_miss)) * 100)
                let accdetail = `[ ${count_300} • ${count_100} • ${count_50} • ${count_miss} ]`
                if (modenum == 1) {
                    acc = Number((0.5 * count_100 + count_300) / (count_300 + count_100 + count_miss) * 100)
                    accdetail = `[ ${count_300} • ${count_100} • ${count_miss} ]`
                }
                if (modenum == 2) {
                    acc = Number((count_50 + count_100 + count_300) / (count_katu + count_miss + count_50 + count_100 + count_300) * 100)
                    accdetail = `[ ${count_300} • ${count_100} • ${count_katu} • ${count_miss} ]`
                }
                if (modenum == 3) {
                    acc = Number((50 * count_50 + 100 * count_100 + 200 * count_katu + 300 * (count_300 + count_geki)) / (300 * (count_miss + count_50 + count_100 + count_katu + count_300 + count_geki)) * 100)
                    accdetail = `[ ${count_geki} • ${count_300} • ${count_katu} • ${count_100} • ${count_50} • ${count_miss} ]`
                }
                top[i] = new Score({beatmap_id: best.scores[i].beatmap.beatmap_id, score: Number(best.scores[i].score),
                                combo: Number(best.scores[i].max_combo), count_50: count_50,
                                count_100: count_100, count_300: count_300, count_miss: count_miss, count_geki: count_geki,
                                count_katu: count_katu, perfect: best.scores[i].full_combo == true ? 1 : 0,
                                mod_num: best.scores[i].mods, user_id: user.id, date: best.scores[i].time,
                                rank: best.scores[i].ranking, pp: Number(best.scores[i].pp), acc: acc,
                                acc_detail: accdetail, top: i+1})
            }
            if (!no_bm) {
                let beatmaps = top.map(async sc => {
                    let req_opt = {b: sc.beatmap_id, m: modenum, a: 1}
                    if (a_mode !== 'std') {
                        let mod = sc.mod_num
                        let bit = mod.toString(2)
                        let fullbit = "0000000000000000000000000000000".substr(bit.length) + bit
                        let bitpresent = 0
                        if (fullbit[31 - 2] == 1) bitpresent += 2;
                        if (fullbit[31 - 5] == 1) bitpresent += 16;
                        if (fullbit[31 - 7] == 1) bitpresent += 64;
                        if (fullbit[31 - 9] == 1) bitpresent += 256;
                        req_opt.mods = bitpresent
                    }
                    return BanchoAPI({ver: 1, endpoint: 'get_beatmaps', param: req_opt})
                })
                beatmaps = await Promise.all(beatmaps)
                for (let i = 0; i < top.length; i++) {
                    let data = new Beatmap({title: beatmaps[i][0].title, creator: beatmaps[i][0].creator,
                                            diff: beatmaps[i][0].version, source: beatmaps[i][0].source,
                                            artist: beatmaps[i][0].artist, bpm: beatmaps[i][0].bpm,
                                            beatmapset_id: beatmaps[i][0].beatmapset_id,
                                            fc: beatmaps[i][0].max_combo, star: beatmaps[i][0].difficultyrating,
                                            time_total: beatmaps[i][0].total_length,
                                            time_drain: beatmaps[i][0].hit_length, circle: beatmaps[i][0].count_normal,
                                            slider: beatmaps[i][0].count_slider, spinner: beatmaps[i][0].count_spinner,
                                            a_mode: a_mode, ar: beatmaps[i][0].diff_approach, 
                                            hp: beatmaps[i][0].diff_drain, cs: beatmaps[i][0].diff_size,
                                            od: beatmaps[i][0].diff_overall})
                    top[i].addBeatmapInfo(data)
                }
            }
        } else {
            let ripple_relax = (a_mode == 'rx' && check_type == 'ripple') ? 1 : 0
            let relax = (a_mode == 'rx') ? 1 : 0
            let best = await RippleAPI({endpoint: `/v1/users/scores/${type}`, mode: mode, options: 
                                        {name: name, mode: modenum, rx: relax, l: limit, relax: ripple_relax}})
            let user = await RippleAPI({endpoint: `/v1/users`, mode: mode, options: {name: name}})
            for (let i = 0; i < best.scores.length; i++) {
                let count_300 = Number(best.scores[i].count_300)
                let count_100 = Number(best.scores[i].count_100)
                let count_50 = Number(best.scores[i].count_50)
                let count_miss = Number(best.scores[i].count_miss)
                let count_geki = Number(best.scores[i].count_geki)
                let count_katu = Number(best.scores[i].count_katu)
                let acc = Number((300 * count_300 + 100 * count_100 + 50 * count_50) / (300 * (count_300 + count_100 + count_50 + count_miss)) * 100)
                let accdetail = `[ ${count_300} • ${count_100} • ${count_50} • ${count_miss} ]`
                if (modenum == 1) {
                    acc = Number((0.5 * count_100 + count_300) / (count_300 + count_100 + count_miss) * 100)
                    accdetail = `[ ${count_300} • ${count_100} • ${count_miss} ]`
                }
                if (modenum == 2) {
                    acc = Number((count_50 + count_100 + count_300) / (count_katu + count_miss + count_50 + count_100 + count_300) * 100)
                    accdetail = `[ ${count_300} • ${count_100} • ${count_katu} • ${count_miss} ]`
                }
                if (modenum == 3) {
                    acc = Number((50 * count_50 + 100 * count_100 + 200 * count_katu + 300 * (count_300 + count_geki)) / (300 * (count_miss + count_50 + count_100 + count_katu + count_300 + count_geki)) * 100)
                    accdetail = `[ ${count_geki} • ${count_300} • ${count_katu} • ${count_100} • ${count_50} • ${count_miss} ]`
                }
                top[i] = new Score({beatmap_id: best.scores[i].beatmap.beatmap_id, score: Number(best.scores[i].score),
                                    combo: Number(best.scores[i].max_combo), count_50: count_50,
                                    count_100: count_100, count_300: count_300, count_miss: count_miss, count_geki: count_geki,
                                    count_katu: count_katu, perfect: best.scores[i].full_combo == true ? 1 : 0,
                                    mod_num: best.scores[i].mods, user_id: user.id, date: best.scores[i].time,
                                    rank: best.scores[i].rank, pp: Number(best.scores[i].pp), acc: acc,
                                    acc_detail: accdetail, top: i+1})
            }
            if (!no_bm) {
                let beatmaps = top.map(sc => {return RippleAPI({endpoint: `/get_beatmaps`, mode: mode, options: {b: sc.beatmap_id}})})
                beatmaps = await Promise.all(beatmaps)
                for (let i = 0; i < top.length; i++) {
                    let data = new Beatmap({beatmapset_id: beatmaps[i][0].beatmapset_id, title: beatmaps[i][0].title, 
                                            artist: beatmaps[i][0].artist, bpm: Number(beatmaps[i][0].bpm),
                                            time_drain: Number(beatmaps[i][0].hit_length),
                                            time_total: Number(beatmaps[i][0].total_length),
                                            fc: Number(beatmaps[i][0].max_combo), cs: Number(beatmaps[i][0].diff_size),
                                            od: Number(beatmaps[i][0].diff_overall), ar: Number(beatmaps[i][0].diff_approach),
                                            hp: Number(beatmaps[i][0].diff_drain), diff: beatmaps[i][0].version})  
                    top[i].addBeatmapInfo(data)
                }
            }
        } 
        return top
    } catch (err) {
        console.log(err)
        console.log(`\nget_top.js\n${err}`)
    }
}