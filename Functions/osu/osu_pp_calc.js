const calc = require('ojsama')
const rxcalc = require('rx-akatsuki-pp')

module.exports = function (parser,mods,combo,count100,count50,countmiss,acc,mode) {
    let stars = new calc.diff().calc({map: parser.map, mods: mods})
    let bpm = 0
    let bpmchanged = 0
    for (var i = 0; i < stars.map.timing_points.length; i++) {
        if (stars.map.timing_points[i].change == true) {
            bpmchanged += 1
            bpm += 60000 / Number(stars.map.timing_points[i].ms_per_beat)
        }
    }
    bpm = Math.round(bpm / bpmchanged)
    let object = Number(stars.objects.length)
    let accuracy = 0
    if (mode == 'fc') {
        let count300 = object - count100 - count50
        accuracy = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
    }
    if (mode == 'acc') {
        accuracy = acc
    }
    let score = {
        stars: stars,
        combo: combo,
        nmiss: countmiss,
        acc_percent: accuracy
    }
    let pp = ''
    if (mode == 'fc' || mode == 'acc') {
        pp = calc.ppv2(score)
    } else if (mode == 'rx_fc') {
        pp = rxcalc.ppv2(score)
    }
    return {star: stars,pp: pp,acc: accuracy, bpm: bpm, ar: stars.map.ar, od: stars.map.od, hp: stars.map.hp, cs: stars.map.cs}
}