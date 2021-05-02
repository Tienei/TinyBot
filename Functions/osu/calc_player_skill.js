const beatmap_detail = require('./beatmap_detail');
const precalc = require('./PP_Calculation/precalc')
const std_pp_calc = require('./PP_Calculation/std_pp_calc');

module.exports = async ({best, modenum}) => {
    try {
        let star_avg = 0, aim_avg = 0, speed_avg = 0, acc_avg = 0;
        let bpm_avg = 0, cs_avg = 0, ar_avg = 0, od_avg = 0, hp_avg = 0, timetotal_avg = 0, timedrain_avg = 0;
        let mod_avg = [];
        for (let i = 0; i < 50; i++) {
            let parser, map_info;
            if (modenum == 0) {
                parser = await precalc({beatmap_id: best[i].beatmap_id})
                map_info = std_pp_calc({parser: parser, mod_num: best[i].mod_num, mode: 'acc'})
                let {hp, cs} = beatmap_detail({mod: best[i].mod_text, hp: parser.map.hp, cs: parser.map.cs})
                // Calc skill
                let star_skill = map_info.star.total
                let aim_skill = (map_info.star.aim * (Math.pow(cs, 0.1) / Math.pow(4, 0.1)))*2
                let speed_skill = (map_info.star.speed * (Math.pow(best[i].bpm, 0.09) / Math.pow(180, 0.09)) * (Math.pow(best[i].ar, 0.1) / Math.pow(6, 0.1)))*2
                let unbalance_limit = (Math.abs(aim_skill - speed_skill)) > (Math.pow(5, Math.log(aim_skill + speed_skill) / Math.log(1.7))/2940)
                aim_avg += aim_skill
                speed_avg += speed_skill
                if ((best[i].mod_text.includes('DT') || best[i].mod_text.includes('NC')) && unbalance_limit) {
                    aim_skill /= 1.06
                    speed_skill /= 1.06
                }
                let acc_skill = (Math.pow(aim_skill / 2, (Math.pow(best[i].acc, 2.5)/Math.pow(100, 2.5)) * (0.083 * Math.log10(map_info.star.nsingles*900000000) * (Math.pow(1.42, best[i].combo/best[i].fc) - 0.3) )) + Math.pow(speed_skill / 2, (Math.pow(best[i].acc, 2.5)/ Math.pow(100, 2.5)) * (0.0945 * Math.log10(map_info.star.nsingles*900000000) * (Math.pow(1.35, best[i].combo/best[i].fc) - 0.3)))) * (Math.pow(best[i].od, 0.02) / Math.pow(6, 0.02)) * (Math.pow(hp, 0.02) / (Math.pow(6, 0.02)))
                if (best[i].mod_text.includes('FL')) {
                    acc_skill *= (0.095 * Math.log10(map_info.star.nsingles*900000000))
                }
                // Set number to var
                star_avg += star_skill
                if (acc_skill !== Infinity) acc_avg += acc_skill
                // Push beatmap top skill
                best[i].addScoreSkill({acc_skill: acc_skill, speed_skill: speed_skill,
                                        aim_skill: aim_skill, star_skill: star_skill})
            } else {
                star_avg += best[i].star
                if (modenum == 1) {
                    let speed_skill = Math.pow(best[i].star/1.1, Math.log(best[i].bpm)/Math.log(best[i].star*20))
                    let acc_skill = Math.pow(best[i].star, (Math.pow(best[i].acc, 3)/Math.pow(100, 3)) * 1.05) * (Math.pow(best[i].od, 0.02) / Math.pow(6, 0.02)) * (Math.pow(best[i].hp, 0.02) / (Math.pow(5, 0.02)))
                    speed_avg += speed_skill
                    if (acc_skill !== Infinity) acc_avg += acc_skill
                    best[i].addScoreSkill({acc_skill: acc_skill, speed_skill: speed_skill, star_skill: best[i].star});
                } else if (modenum == 2) {
                    let aim_skill = Math.pow(best[i].star, Math.log(best[i].bpm)/Math.log(best[i].star*20)) * (Math.pow(best[i].cs, 0.1) / Math.pow(4, 0.1))
                    let acc_skill = Math.pow(best[i].star, (Math.pow(best[i].acc, 3.5)/Math.pow(100, 3.5)) * 1.1) * (Math.pow(best[i].od, 0.02) / Math.pow(6, 0.02)) * (Math.pow(best[i].hp, 0.02) / (Math.pow(5, 0.02)))
                    aim_avg += aim_skill
                    if (acc_skill !== Infinity) acc_avg += acc_skill
                    best[i].addScoreSkill({acc_skill: acc_skill, aim_skill: aim_skill, star_skill: best[i].star});
                } else if (modenum == 3) {
                    let aim_skill = Math.pow(best[i].star/1.1, Math.log(best[i].bpm)/Math.log(best[i].star*20))
                    let acc_skill = Math.pow(best[i].star, (Math.pow(best[i].acc, 3)/Math.pow(100, 3)) * 1.075) * (Math.pow(best[i].od, 0.02) / Math.pow(6, 0.02)) * (Math.pow(best[i].hp, 0.02) / (Math.pow(5, 0.02)))
                    let speed_skill = Math.pow(best[i].star, 1.1 * Math.pow(best[i].bpm/250, 0.4) * (Math.log(best[i].circle + best[i].slider)/Math.log(best[i].star*900)) * (Math.pow(best[i].od, 0.4) / Math.pow(8, 0.4)) * (Math.pow(best[i].hp, 0.2) / Math.pow(7.5, 0.2)) * Math.pow(best[i].cs/4, 0.1))
                    aim_avg += aim_skill
                    speed_avg += speed_skill
                    if (acc_skill !== Infinity) acc_avg += acc_skill
                    best[i].addScoreSkill({acc_skill: acc_skill, aim_skill: aim_skill, speed_skill: speed_skill, star_skill: best[i].star})
                }
            }
            bpm_avg += best[i].bpm
            cs_avg += best[i].cs
            ar_avg += best[i].ar
            od_avg += best[i].od
            hp_avg += best[i].hp
            timetotal_avg += best[i].timetotal
            timedrain_avg += best[i].timedrain
            let find_mod = mod_avg.find(m => m.mod == best[i].mod_text.substr(1))
            if (find_mod == undefined) {
                mod_avg.push({mod: best[i].mod_text.substr(1), count: 1})
            } else {
                find_mod.count += 1
            }
        }
        return {star_avg: star_avg, aim_avg: aim_avg, speed_avg: speed_avg*1.03, acc_avg: acc_avg, 
                bpm_avg: bpm_avg, cs_avg: cs_avg, ar_avg: ar_avg, od_avg: od_avg, hp_avg: hp_avg, 
                timetotal_avg: timetotal_avg, timedrain_avg: timedrain_avg, mod_avg: mod_avg}
    } catch (err) {
        console.log(err)
    }
}