const BanchoAPI = require('./BanchoAPI')
const RippleAPI = require('./RippleAPI')
const { Score } = require('../../../Classes/osu')
const get_mode_detail = require('../get_mode_detail')

module.exports = async ({name, mode, beatmap_id, limit}) => {
    try {
        let {modenum, a_mode, check_type} = get_mode_detail({mode: mode})
        let scores = []
        if (check_type == 'Bancho') {
            let score = await BanchoAPI({ver: 1, endpoint: 'get_scores', param: {u: name, b: beatmap_id, limit: limit, m: modenum}})
            for (let i = 0; i < score.length; i++) {
                let count_300 = Number(score[i].count300)
                let count_100 = Number(score[i].count100)
                let count_50 = Number(score[i].count50)
                let count_miss = Number(score[i].countmiss)
                let count_geki = Number(score[i].countgeki)
                let count_katu = Number(score[i].countkatu)
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
                scores[i] = new Score({user_id: score[i].user_id, beatmap_id: beatmap_id, count_300: count_300,
                                    count_100: count_100, count_50: count_50, count_miss: count_miss, count_geki: count_geki,
                                    count_katu: count_katu, combo: score[i].maxcombo, mod_num: score[i].enabled_mods,
                                    perfect: score[i].perfect, date: score[i].date, rank: score[i].rank, pp: score[i].pp,
                                    score: score[i].score, acc: acc, acc_detail: accdetail, username: score[i].username})
            }
        }
        return scores
    } catch (err) {
        console.log(`\nget_score.js\n${err}`)
    }
}