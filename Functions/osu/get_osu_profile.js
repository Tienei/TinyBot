const cheerio = require('cheerio')
const nodeosu = require('node-osu');
const request = require('request-promise-native');
const { Profile } = require('./../../Classes/osu')
// Function
const getServerLink = require('./get_server_link')

let osuApi = new nodeosu.Api(process.env.OSU_KEY, {
    notFoundAsError: false,
    completeScores: true
});

module.exports = async function (name, mode, event, html = true) {
    try {
        if (mode >= 0 && mode <= 3) {
            let user = await osuApi.getUser({u: name, m: mode, event_days: event})
            let user_web = ''
            let playstyle = ""
            if (html == true) {
                let web = await request.get(`https://osu.ppy.sh/users/${user.id}`)
                user_web = await cheerio.load(web)
                user_web = user_web("#json-user").html()
                user_web = user_web.substring(0, user_web.indexOf(',"page"')) + user_web.substring(user_web.indexOf(',"page"')).replace(/<\/?[^>]+>|&quot;/gi, "");
                user_web = user_web.substring(0, user_web.indexOf(',"page"')) + user_web.substring(user_web.indexOf(',"page"')).replace(/\/\//gi, "/")
                user_web = JSON.parse(user_web)
                if (user_web["playstyle"] == null) {
                    playstyle = "None?"
                } else {
                    for (var i in user_web["playstyle"]) {
                        playstyle += user_web["playstyle"][i].charAt(0).toUpperCase() + user_web["playstyle"][i].substring(1)
                        user_web["playstyle"].length - 1 > i ? playstyle += ', ' : ''
                    }
                }
            }
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
                                user_web["is_supporter"] == true ? '<:supporter:582885341413769218>' : '',
                                user_web["is_online"] == true ? 'https://cdn.discordapp.com/emojis/589092415818694672.png' : 'https://cdn.discordapp.com/emojis/589092383308775434.png?v=1',
                                user_web["is_online"] == true ? 'Online' : 'Offline',
                                playstyle,
                                user_web["cover_url"]])
        }
        if (mode >= 4 && mode <= 12) {
            let serverlink = getServerLink(mode)
            let data = mode !== 12 ? await request.get(`https://${serverlink}/api/v1/users/full?name=${name}&mode=0`) : await request.get(`https://${serverlink}/api/v1/users/rxfull?name=${name}&mode=0`)
            let user = JSON.parse(data)
            return new Profile([user.username,
                                Number(user.id),
                                undefined,
                                undefined,
                                undefined,
                                undefined,
                                undefined,
                                undefined,
                                Number(user.std.playcount),
                                Number(user.std.ranked_score),
                                Number(user.std.total_score),
                                Number(user.std.pp),
                                Number(user.std.global_leaderboard_rank),
                                undefined,
                                user.country.toLowerCase(),
                                Number(user.std.level).toFixed(2),
                                Number(user.std.accuracy).toFixed(2),
                                undefined,
                                undefined,
                                undefined,
                                undefined,
                                undefined,
                                undefined])
        }
    } catch (error) {
        if (error) {
            console.log(error)
        }
    }
}