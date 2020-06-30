const nodeosu = require('node-osu');
const rippleAPI = require('./rippleAPI')
const request = require('superagent');
const { Score } = require('./../../Classes/osu')
// Function
const get_mode_detail = require('./get_mode_detail')

let osuApi = new nodeosu.Api(process.env.OSU_KEY, {
    notFoundAsError: false,
    completeScores: true
});

module.exports = async function (name, mode, beatmapID, limit) {
    try {
        let modedetail = get_mode_detail(mode)
        let modenum = modedetail.modenum
        let a_mode = modedetail.a_mode
        let check_type = modedetail.check_type
        let top = []
        if (check_type == "Bancho") {
            let scores = await osuApi.getScores({u: name, m: modenum, b: beatmapID, limit: limit})
            for (var i = 0; i < scores.length; i++) {
                let count300 = Number(scores[i].counts['300'])
                let count100 = Number(scores[i].counts['100'])
                let count50 = Number(scores[i].counts['50'])
                let countmiss = Number(scores[i].counts.miss)
                let countgeki = Number(scores[i].counts.geki)
                let countkatu = Number(scores[i].counts.katu)
                let acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100)
                let accdetail = `[ ${count300} • ${count100} • ${count50} • ${countmiss} ]`
                if (modenum == 1) {
                    acc = Number((0.5 * count100 + count300) / (count300 + count100 + countmiss) * 100)
                    accdetail = `[ ${count300} • ${count100} • ${countmiss} ]`
                }
                if (modenum == 2) {
                    acc = Number((count50 + count100 + count300) / (countkatu + countmiss + count50 + count100 + count300) * 100)
                }
                if (modenum == 3) {
                    acc = Number((50 * count50 + 100 * count100 + 200 * countkatu + 300 * (count300 + countgeki)) / (300 * (countmiss + count50 + count100 + countkatu + count300 + countgeki)) * 100)
                    accdetail = `[ ${countgeki} • ${count300} • ${countkatu} • ${count100} • ${count50} • ${countmiss} ]`
                }
                top[i] = new Score([
                    "",
                    scores[i].score,
                    scores[i].user.name,
                    count300,
                    count100,
                    count50,
                    countmiss,
                    Number(scores[i].maxCombo),
                    countgeki,
                    countkatu,
                    scores[i].perfect,
                    scores[i].raw_mods,
                    Number(scores[i].user.id),
                    scores[i].date,
                    scores[i].rank,
                    Number(scores[i].pp),
                    acc,
                    accdetail
                ])
            }
        } else if (check_type !== "Gatari") {
            let scores = await rippleAPI.apiCall("/get_scores", mode, {b: beatmapID, u: name})
            if (scores == null) {
                return []
            }
            for (var i = 0; i < scores.length; i++) {
                let count300 = Number(scores[i].count300)
                let count100 = Number(scores[i].count100)
                let count50 = Number(scores[i].count50)
                let countmiss = Number(scores[i].countmiss)
                let countgeki = Number(scores[i].countgeki)
                let countkatu = Number(scores[i].countkatu)
                let acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100)
                let accdetail = `[ ${count300} • ${count100} • ${count50} • ${countmiss} ]`
                if (modenum == 1) {
                    acc = Number((0.5 * count100 + count300) / (count300 + count100 + countmiss) * 100)
                    accdetail = `[ ${count300} • ${count100} • ${countmiss} ]`
                }
                if (modenum == 2) {
                    acc = Number((count50 + count100 + count300) / (countkatu + countmiss + count50 + count100 + count300) * 100)
                }
                if (modenum == 3) {
                    acc = Number((50 * count50 + 100 * count100 + 200 * countkatu + 300 * (count300 + countgeki)) / (300 * (countmiss + count50 + count100 + countkatu + count300 + countgeki)) * 100)
                    accdetail = `[ ${countgeki} • ${count300} • ${countkatu} • ${count100} • ${count50} • ${countmiss} ]`
                }
                top[i] = new Score([
                    "",
                    scores[i].score,
                    scores[i].username,
                    count300,
                    count100,
                    count50,
                    countmiss,
                    Number(scores[i].maxcombo),
                    countgeki,
                    countkatu,
                    scores[i].perfect,
                    Number(scores[i].enabled_mods),
                    Number(scores[i].user_id),
                    scores[i].date,
                    scores[i].rank,
                    Number(scores[i].pp),
                    acc,
                    accdetail
                ])
            }
        }
        return top
    } catch (error) {
        if (error) {
            console.log(error)
        }
    }
}