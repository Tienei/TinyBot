const { threshold } = require('jimp')

class Profile {
    constructor({username, id, playcount, ranked_score, total_score, global_rank, country_rank,
                level, pp, acc, count_ssh, count_ss, count_sh, count_s, count_a, online, supporter, playstyle, country_code,
                rank_history, prev_username, cover_url, discord_tag}) {
        const get_icon = require('../Functions/general/icon_lib')
        this.username = username
        this.prev_username = prev_username?.length ? prev_username : []
        this.id = id
        this.playcount = Number(playcount)
        this.ranked_score = Number(ranked_score)
        this.total_score = Number(total_score)
        this.global_rank = Number(global_rank)
        this.country_rank = Number(country_rank)
        this.level = Number(level) // 
        this.pp = Number(pp) // 
        this.acc = Number(acc)//
        this.count_ssh = Number(count_ssh)
        this.count_ss = Number(count_ss)
        this.count_sh = Number(count_sh)
        this.count_s = Number(count_s)
        this.count_a = Number(count_a)
        this.online = online
        this.supporter = supporter
        if (playstyle) playstyle = playstyle.map(e => e[0].toUpperCase() + e.substring(1))
        this.playstyle = (playstyle?.length) ? playstyle : []
        this.country_code = country_code
        this.online_icon = (online == 'Offline') ? get_icon({type: "osu_offline"}) : get_icon({type: "osu_online"})
        this.rank_history = rank_history
        this.cover_url = cover_url
        this.discord_tag = discord_tag
    }
}

class Score {
    constructor({top, beatmap_id, score, combo, count_50, count_100, count_300, count_miss, count_katu, count_geki,
                perfect, mod_num, user_id, username, date, rank, pp, acc, acc_detail}) {
        const get_icon = require('../Functions/general/icon_lib')
        const get_mod_text = require('../Functions/osu/mods_enum')
        const time_ago = require('../Functions/osu/time_ago')
        // Score
        this.top = Number(top)
        this.beatmap_id = beatmap_id
        this.score = Number(score)
        this.combo = Number(combo)
        this.count_50 = Number(count_50)
        this.count_100 = Number(count_100)
        this.count_300 = Number(count_300)
        this.count_miss = Number(count_miss)
        this.count_katu = Number(count_katu)
        this.count_geki = Number(count_geki)
        this.perfect = Number(perfect)
        this.mod_num = Number(mod_num)
        this.user_id = user_id
        this.username = username
        this.date = date
        this.rank = rank
        this.pp = Number(pp)
        this.acc = Number(acc)
        this.acc_detail = acc_detail
        this.rank_icon = get_icon({type: `rank_${rank}`})
        this.mod_text = get_mod_text({mod: this.mod_num}).mod_text
        let destruct_date = this.date.split(" ")
        destruct_date.splice(1, 0, "T")
        destruct_date.push(".000Z")
        destruct_date = destruct_date.join("")
        this.time_ago = time_ago({time: destruct_date})
    }
    addBeatmapInfo({title, creator, diff, source, artist, bpm, beatmapset_id, fc, star, time_total, time_drain,
                    circle, spinner, slider, od, ar, hp, cs}) {
        const beatmap_detail = require('../Functions/osu/beatmap_detail')
        var {time_total, time_drain, bpm, cs, ar, od, hp} = beatmap_detail({mod: this.mod_text, time_total: Number(time_total), time_drain: Number(time_drain), 
                                                                            bpm: Number(bpm), cs: Number(cs), ar: Number(ar), od: Number(od), hp: Number(hp)})
        this.title = title
        this.creator = creator
        this.diff = diff
        this.source = source
        this.artist = artist
        this.bpm = Number(bpm)
        this.beatmapset_id = beatmapset_id 
        this.fc = Number(fc)
        this.star = Number(star)
        this.time_total = Number(time_total)
        this.time_drain = Number(time_drain)
        this.circle = Number(circle)
        this.slider = Number(slider)
        this.spinner = Number(spinner)
        this.od = Number(od)
        this.cs = Number(cs)
        this.hp = Number(hp)
        this.ar = Number(ar)
    }
    addScoreSkill({acc_skill, speed_skill, aim_skill, star_skill, old_acc_skill}) {
        this.star_skill = star_skill
        this.acc_skill = acc_skill
        this.old_acc_skill = old_acc_skill
        this.speed_skill = speed_skill
        this.aim_skill = aim_skill
    }
}

class Beatmap {
    constructor({beatmap_id, title, creator, diff, bpm, approved, beatmapset_id, fc, star, time_total,
                time_drain, favorite, source, artist, circle, slider, spinner, od, cs, hp, ar, a_mode}) {
        let approvalStatus_list = ['Graveyard', 'WIP', 'Pending', 'Ranked', 'Approved', 'Qualified', 'Loved']
        this.beatmap_id = beatmap_id
        this.title = title
        this.creator = creator
        this.diff = diff
        this.bpm = Number(bpm)
        this.approved = Number(approved)
        this.approvalStatus = approvalStatus_list[this.approved+2]
        this.beatmapset_id = beatmapset_id
        this.fc = (a_mode == 'taiko') ? Number(circle) : (a_mode == 'mania') ? Number(circle) + Number(slider) : Number(fc)
        this.star = Number(star)
        this.time_total = Number(time_total)
        this.time_drain = Number(time_drain)
        this.favorite = favorite
        this.source = source
        this.artist = artist
        this.circle = Number(circle)
        this.slider = Number(slider)
        this.spinner = Number(spinner)
        this.od = Number(od)
        this.cs = Number(cs)
        this.hp = Number(hp)
        this.ar = Number(ar)
    }
}

module.exports = {Profile, Score, Beatmap}