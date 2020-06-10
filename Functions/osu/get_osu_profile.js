const cheerio = require('cheerio')
const nodeosu = require('node-osu');
const rippleAPI = require('./rippleAPI')
const request = require('superagent');
const { Profile } = require('./../../Classes/osu')
// Function
const get_mode_detail = require('./get_mode_detail')
// Client
const osu_client = require('../../client').osu_client

let osuApi = new nodeosu.Api(process.env.OSU_KEY, {
    notFoundAsError: false,
    completeScores: true
});

let html_cooldown = 0

module.exports = async function (name, mode, event, html = true, client = true) {
    try {
        let modedetail = get_mode_detail(mode)
        let modenum = modedetail.modenum
        let a_mode = modedetail.a_mode
        let check_type = modedetail.check_type
        if (check_type == 'Bancho') {
            let user = await osuApi.getUser({u: name, m: modenum, event_days: event})
            let bancho_user = ''
            if (client == true) {
                try {
                    bancho_user = await osu_client.getUser(user.name).stats()
                } catch (err) {
                    console.log(err)
                }
            }
            let user_web = ''
            return new Profile([user.name,
                                Number(user.id),
                                Number(user.counts['300']),
                                Number(user.counts['100']),
                                Number(user.counts['50']),
                                Number(user.counts.SS) + Number(user.counts.SSH),
                                Number(user.counts.S) + Number(user.counts.SH),
                                Number(user.counts.A),
                                Number(user.counts.plays),
                                Number(user.scores.ranked),
                                Number(user.scores.total),
                                Number(user.pp.raw).toFixed(2),
                                Number(user.pp.rank),
                                Number(user.pp.countryRank),
                                user.country.toLowerCase(),
                                Number(user.level),
                                Number(user.accuracy).toFixed(2),
                                user.events,
                                '',
                                bancho_user.online == true ? 'https://cdn.discordapp.com/emojis/589092415818694672.png' : 'https://cdn.discordapp.com/emojis/589092383308775434.png?v=1',
                                bancho_user.online == true ? 'Online' : 'Offline',
                                '',
                                ''])
        } else if (check_type == 'Gatari') {
            let options = {u: name, mode: modenum}
            const s_resp = await request.get('https://api.gatari.pw/user/stats').query(options);
            const i_resp = await request.get('https://api.gatari.pw/users/get').query(options);
            let user_stats = (s_resp.body).stats;
            let user_info = (i_resp.body).users[0];
            return new Profile([user_info.username,
                                Number(user_info.id),
                                undefined,
                                undefined,
                                undefined,
                                Number(user_stats.x_count) + Number(user_stats.xh_count),
                                Number(user_stats.s_count) + Number(user_stats.sh_count),
                                Number(user_stats.a_count),
                                Number(user_stats.playcount),
                                Number(user_stats.ranked_score),
                                Number(user_stats.total_score),
                                Number(user_stats.pp).toFixed(2),
                                Number(user_stats.rank),
                                Number(user_stats.country_rank),
                                user_info.country.toLowerCase(),
                                Number(user_stats.level),
                                Number(user_stats.avg_accuracy).toFixed(2),
                                undefined,
                                undefined,
                                undefined,
                                undefined,
                                undefined,
                                undefined])
        } else if (check_type == 'Akatsuki') {
            let user = await rippleAPI.apiCall(`/v1/users/full`, mode, {name: name})
            let relax = (a_mode == 'rx') ? 1 : 0
            a_mode = (a_mode == 'rx') ? 'std' : a_mode
            return new Profile([user.username,
                Number(user.id),
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                Number(user.stats[relax][a_mode].playcount),
                Number(user.stats[relax][a_mode].ranked_score),
                Number(user.stats[relax][a_mode].total_score),
                Number(user.stats[relax][a_mode].pp),
                Number(user.stats[relax][a_mode].global_leaderboard_rank),
                Number(user.stats[relax][a_mode].country_leaderboard_rank),
                user.country.toLowerCase(),
                Number(user.stats[relax][a_mode].level).toFixed(2),
                Number(user.stats[relax][a_mode].accuracy).toFixed(2),
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined])
        } else if (check_type !== 'Bancho' && check_type !== 'Gatari' && check_type !== 'Akatsuki') {
            let ripple_relax = (a_mode == 'rx' && check_type == 'Ripple') ? 1 : 0
            let user = (a_mode == 'rx' && check_type !== 'Ripple') ? await rippleAPI.apiCall(`/v1/users/rxfull`, mode, {name: name}) : await rippleAPI.apiCall(`/v1/users/full`, mode, {name: name, relax: ripple_relax})
            a_mode = (a_mode == 'rx') ? 'std' : a_mode
            let online_status = undefined
            let online_icon = undefined
            if (check_type == 'Horizon') {
                online_status = JSON.parse((await request.get(`https://c.lemres.de/api/v1/playerstatus?uid=${user.id}`)).text).Status
                online_icon = online_status !== 'Offline' ? 'https://cdn.discordapp.com/emojis/589092415818694672.png' : 'https://cdn.discordapp.com/emojis/589092383308775434.png?v=1'
                online_status = online_status !== 'Offline' ? online_status : 'Offline'
            }
            return new Profile([user.username,
                                Number(user.id),
                                undefined,
                                undefined,
                                undefined,
                                undefined,
                                undefined,
                                undefined,
                                Number(user[a_mode].playcount),
                                Number(user[a_mode].ranked_score),
                                Number(user[a_mode].total_score),
                                Number(user[a_mode].pp),
                                Number(user[a_mode].global_leaderboard_rank),
                                Number(user[a_mode].country_leaderboard_rank),
                                user.country.toLowerCase(),
                                Number(user[a_mode].level).toFixed(2),
                                Number(user[a_mode].accuracy).toFixed(2),
                                undefined,
                                undefined,
                                online_icon,
                                online_status,
                                undefined,
                                undefined])
        }
    } catch (error) {
        if (error) {
            console.log(error)
        }
    }
}
