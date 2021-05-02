const BanchoAPI = require('./BanchoAPI')
const RippleAPI = require('./RippleAPI')
const { Profile } = require('../../../Classes/osu')
const get_mode_detail = require('../get_mode_detail')
const superagent = require('superagent')

module.exports = async ({name, mode, event = false, ver}) => {
    try {
        let {a_mode, check_type, modenum} = get_mode_detail({mode: mode})
        if (check_type == 'Bancho') {
            if (ver == 2) {
                let url_mode_list = ['osu', 'taiko', 'fruits', 'mania']
                let user = await BanchoAPI({ver: 2, endpoint: `users/${name}/${url_mode_list[modenum]}`})
                if (!user) return null
                let online = (user.is_online) ? 'Online' : 'Offline'
                return new Profile({username: user.username, id: user.id, playcount: user.statistics.play_count,
                                    ranked_score: user.statistics.ranked_score, total_score: user.statistics.total_score,
                                    global_rank: user.statistics.global_rank, country_rank: user.statistics.rank.country,
                                    level: user.statistics.level.current, pp: user.statistics.pp, 
                                    acc: Number(user.statistics.hit_accuracy.toFixed(2)),
                                    count_ssh: user.statistics.grade_counts.ssh,
                                    count_ss: user.statistics.grade_counts.ss,
                                    count_sh: user.statistics.grade_counts.sh,
                                    count_s: user.statistics.grade_counts.s,
                                    count_a: user.statistics.grade_counts.a, online: online,
                                    supporter: user.is_supporter, playstyle: user.playstyle,
                                    country_code: user.country.code.toLowerCase(),
                                    rank_history: user.rank_history.data, prev_username: user.previous_usernames,
                                    cover_url: user.cover_url, discord_tag: user.discord})
            } else {
                let user = await BanchoAPI({ver: 1, endpoint: `get_user`, param: {u: name, m: modenum}})
                return new Profile({username: user[0].username, id: user[0].user_id, global_rank: user[0].pp_rank,
                                    country_rank: user[0].pp_country_rank, country_code: user[0].country.toLowerCase(), 
                                    pp: user[0].pp_raw})
            }
        } else if (check_type == 'Gatari') {
            let options = {u: name, mode: modenum}
            const s_resp = await superagent.get('https://api.gatari.pw/user/stats').query(options);
            const i_resp = await superagent.get('https://api.gatari.pw/users/get').query(options);
            let user_stats = (s_resp.body).stats;
            if (!user_stats) return null
            let user_info = (i_resp.body).users[0];
            return new Profile({username: user_info.username, id: Number(user_info.id),
                                count_ss: Number(user_stats.x_count) + Number(user_stats.xh_count),
                                count_s: Number(user_stats.s_count) + Number(user_stats.sh_count),
                                count_a: Number(user_stats.a_count), playcount: Number(user_stats.playcount),
                                ranked_score: Number(user_stats.ranked_score), total_score: Number(user_stats.total_score),
                                pp: Number(user_stats.pp).toFixed(2), global_rank: Number(user_stats.rank),
                                country_rank: Number(user_stats.country_rank), country_code: user_info.country.toLowerCase(),
                                level: Number(user_stats.level), acc: Number(user_stats.avg_accuracy).toFixed(2)})
        } else if (check_type == 'Akatsuki') {
            let user = await RippleAPI({endpoint: `/v1/users/full`, mode: mode, options: {name: name}})
            if (!user) return null
            let relax = (a_mode == 'rx') ? 1 : 0
            a_mode = (a_mode == 'rx') ? 'std' : a_mode
            return new Profile({username: user.username, id: Number(user.id), 
                                playcount: Number(user.stats[relax][a_mode].playcount),
                                ranked_score: Number(user.stats[relax][a_mode].ranked_score),
                                total_score: Number(user.stats[relax][a_mode].total_score),
                                pp: Number(user.stats[relax][a_mode].pp),
                                global_rank: Number(user.stats[relax][a_mode].global_leaderboard_rank),
                                country_rank: Number(user.stats[relax][a_mode].country_leaderboard_rank),
                                country_code: user.country.toLowerCase(),
                                level: Number(user.stats[relax][a_mode].level).toFixed(2),
                                acc: Number(user.stats[relax][a_mode].accuracy).toFixed(2),})
        } else {
            let ripple_relax = (a_mode == 'rx' && check_type == 'Ripple') ? 1 : 0
            let user = (a_mode == 'rx' && check_type !== 'Ripple') 
            ? await RippleAPI({endpoint: `/v1/users/rxfull`, mode: mode, options: {name: name}})
            : await RippleAPI({endpoint: `/v1/users/full`, mode: mode, options: {name: name, relax: ripple_relax}});
            if (!user) return null  
            a_mode = (a_mode == 'rx') ? 'std' : a_mode
            let online_status = undefined
            if (check_type == 'Horizon') {
                online_status = await (await superagent.get(`https://c.lemres.de/api/v1/playerstatus?uid=${user.id}`)).body.Status
                online_status = online_status !== 'Offline' ? online_status : 'Offline'
            }
            return new Profile({username: user.username, id: Number(user.id), playcount: Number(user[a_mode].playcount),
                                ranked_score: Number(user[a_mode].ranked_score), total_score: Number(user[a_mode].total_score),
                                pp: Number(user[a_mode].pp), global_rank: Number(user[a_mode].global_leaderboard_rank),
                                country_rank: Number(user[a_mode].country_leaderboard_rank), 
                                country_code: user.country.toLowerCase(), level: Number(user[a_mode].level).toFixed(2),
                                acc: Number(user[a_mode].accuracy).toFixed(2), online: online_status})
        }
    } catch (err) {
        console.log(`\nget_profile.js\n${err}`)
    }
}