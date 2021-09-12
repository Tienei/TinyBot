const get_mode_detail = require('./get_mode_detail')

module.exports = ({mod_num, mode, time_total,time_drain,bpm,cs,ar,od,hp}) => {
    let {modenum} = get_mode_detail({mode})
    function EZ() {
        if (modenum !== 3) cs /= 2; 
        ar /= 2; od /= 2; hp /= 2;
    }
    function HR() {
        if (modenum !== 3) cs *= 1.3; 
        ar *= 1.4; od *= 1.4; hp *= 1.4;
        ar = (ar > 10) ? 10 : ar
        od = (od > 10) ? 10 : od
        hp = (hp > 10) ? 10 : hp
    }
    function HT() {
        bpm = bpm / 1.33
        time_total *= 1.5
        time_drain *= 1.5
        if (modenum == 0 || modenum == 2) {
            let arms = (ar < 6) ? 1600 + ((5 - ar) * 160) : 1600 - ((ar - 5) * 200)
            ar = (arms <= 1200) ? 5 + ((1200 - arms) / 150) : 5 - ((1200 - arms) / 120)
            let odms = 106 - (od * 8)
            od = (79.5 - odms) / 6
        } else if (modenum == 1) {
            let odms = 66.66 - (od * 4)
            od = (49.5 - odms) / 3
        }
    }
    function DT() {
        bpm *= 1.5
        time_total /= 1.5
        time_drain /= 1.5
        if (modenum == 0 || modenum == 2) {
            let arms = (ar < 6) ? 800 + ((5 - ar) * 80) : 800 - ((ar - 5) * 100)
            ar = (arms <= 1200) ? 5 + ((1200 - arms) / 150) : 5 - ((1200 - arms) / 120)
            let odms = 53 - (od * 4)
            od = (79.5 - odms) / 6
        } else if (modenum == 1) {
            let odms = 33.33 - (od * 2)
            od = (49.5 - odms) / 3
        }
    }
    if ((mod_num & 2) == 2)                                 EZ();
    if ((mod_num & 16) == 16)                               HR();
    if ((mod_num & 64) == 64 || (mod_num & 512) == 512)     DT();
    if ((mod_num & 256) == 256)                             HT();
    ar = (ar > 11) ? 11 : ar
    od = (od > 11) ? 11 : od
    hp = (hp > 11) ? 11 : hp
    return {bpm: bpm, cs: cs, ar: ar, od: od, hp: hp, time_total: time_total, time_drain: time_drain}
}