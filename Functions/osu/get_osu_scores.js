const nodeosu = require('node-osu');

let osuApi = new nodeosu.Api(process.env.OSU_KEY, {
    notFoundAsError: false,
    completeScores: true
});

module.exports = async function (name, mode, beatmapID, limit) {
    let top = []
    let scores = await osuApi.getScores({u: name, m: mode, b: beatmapID, limit: limit})
    for (var i = 0; i < scores.length; i++) {
        let count300 = Number(scores[i].counts['300'])
        let count100 = Number(scores[i].counts['100'])
        let count50 = Number(scores[i].counts['50'])
        let countmiss = Number(scores[i].counts.miss)
        let countgeki = Number(scores[i].counts.geki)
        let countkatu = Number(scores[i].counts.katu)
        let acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100)
        let accdetail = `[${count300}/${count100}/${count50}/${countmiss}]`
        if (mode == 1) {
            acc = Number((0.5 * count100 + count300) / (count300 + count100 + countmiss) * 100)
            accdetail = `[${count300}/${count100}/${countmiss}]`
        }
        if (mode == 2) {
            acc = Number((count50 + count100 + count300) / (countkatu + countmiss + count50 + count100 + count300) * 100)
        }
        if (mode == 3) {
            acc = Number((50 * count50 + 100 * count100 + 200 * countkatu + 300 * (count300 + countgeki)) / (300 * (countmiss + count50 + count100 + countkatu + count300 + countgeki)) * 100)
            accdetail = `[${countgeki}/${count300}/${countkatu}/${count100}/${count50}/${countmiss}]`
        }
        top[i] = {
            score: Number(scores[i].score),
            userid: Number(scores[i].user.id),
            username: scores[i].user.name,
            count300: count300,
            count100: count100,
            count50: count50,
            countmiss: countmiss,
            countgeki: countgeki,
            countkatu: countkatu,
            acc: acc,
            accdetail: accdetail,
            combo: Number(scores[i].maxCombo),
            perfect: scores[i].perfect,
            date: scores[i].date,
            letter: scores[i].rank,
            pp: Number(scores[i].pp),
            mod: scores[i].raw_mods
        }
    }
    return top
}