const { Attachment, MessageEmbed, Message } = require('discord.js')
const cheerio = require('cheerio')
const generate = require('node-chartist');
const sharp = require('sharp')
const text2png = require('text2png')
const jimp = require('jimp')
const request = require('superagent');
const fx = require('../Functions/load_fx')
const nodeosu = require('node-osu');
const config = require('./../config')
let osuApi = new nodeosu.Api(process.env.OSU_KEY, {
    notFoundAsError: false,
    completeScores: true
});

let osuApi_no_bm = new nodeosu.Api(process.env.OSU_KEY, {
    notFoundAsError: false,
    completeScores: false
}); //This is unused.

let db = ''
let user_data = {}
let stored_map_ID = []
let saved_map_id = []

 /*
osu!Standard: 0
osu!Taiko: 1
osu!CTB: 2
osu!Mania: 3
Ripple: 4
Akatsuki: 8
Relax Akatsuki: 12
Horizon: 13
Relax Horizon: 17
*/

function get_db(data1, data2, data3, data4) {
    user_data = data1
    stored_map_ID = data2
    saved_map_id = data3
    db = data4
}

function cache_beatmap_ID(message = new Message(), beatmapid, mode) {
    if (message.guild !== null) {
        for (let i = 0; i < stored_map_ID.length; i++) {
            if (stored_map_ID[i].server == message.channel.id) {
                stored_map_ID.splice(i, 1)
                i--
            }
        }
        if (!config.config.debug.disable_db_save) db.saved_map_id.findAndModify({query: {}, update: {'0': stored_map_ID}}, function(){})
        stored_map_ID.push({id:beatmapid,server:message.channel.id, mode: mode})
    } else {
        stored_map_ID.push({id:beatmapid,user:message.author.id, mode: mode})
    }
}

function ping(message = new Message(), command) {
    try {
        let msg = message.content.toLowerCase();
        let command = msg.split(' ')[0]
        if (fx.general.cmd_cooldown.cooldown[message.author.id] !== undefined && fx.general.cmd_cooldown.cooldown[message.author.id].indexOf(command) !== -1) {
            throw 'You need to wait 5 seconds before using this again!'
        }
        fx.general.cmd_cooldown.set(message, command, 5000)
        async function Bancho() {
            let timenow = Date.now()
            let test = await osuApi.getUser({u: "peppy"})
            let timelater = Date.now()
            let ping = timelater - timenow
            let visual = '['
            for (let i = 0; i < 20; i++) {
                let comp = (100 + Math.pow(100, 0.50 * Math.log(i)))
                if (ping < comp) {
                    visual += '⎯'
                } else {
                    visual += '▬'
                }
            }
            visual += ']'

            message.channel.send(`Bancho respond! **${ping}ms**                                                         
Good   ${visual}   Bad`) 
        }
        Bancho()
    } catch (error) {
        message.channel.send(String(error))
    }
}

async function osuavatar(message = new Message(), mode) {
    let msg = message.content.toLowerCase();
    let refresh = Math.round(Math.random()* 2147483648)
    let embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)
    let suffix = fx.osu.check_suffix(msg, false, [{"suffix": undefined, "v_count": 0}])
    let check_type = fx.osu.get_mode_detail(mode).check_type
    let name = fx.osu.check_player(user_data, message, suffix.check, check_type)
    let pfp_link = ''
    let username = ''
    let id = 0
    if (check_type == 'Bancho') {
        let user = await osuApi.apiCall('/get_user', {u: name})
        username = user[0].username
        id = user[0].user_id
        pfp_link = `https://a.ppy.sh/${id}_1?date=${refresh}`
    } else if (check_type == 'Gatari') {
        let options = {u: name, mode: 0}
        const i_resp = await request.get('https://api.gatari.pw/users/get').query(options);
        let user_info = (i_resp.body).users[0];
        username = user_info.username
        id = user_info.id
        pfp_link = `https://a.gatari.pw/${id}?date=${refresh}`
    } else {
        let serverlink = fx.osu.get_mode_detail(mode).link
        let user = await fx.osu.rippleAPI.apiCall(`/v1/users`, mode, {name: name})
        username = user.username
        id = user.id
        pfp_link = `https://a.${serverlink}/${id}?date=${refresh}`
    }
    const embed = new MessageEmbed()
    .setAuthor(`Avatar for ${username}`)
    .setColor(embedcolor)
    .setImage(pfp_link);
    message.channel.send({embed})
}

async function osu(message = new Message(), mode) {
    try {
        let msg = message.content.toLowerCase();
        let refresh = Math.round(Math.random()* 2147483648)
        let command = msg.split(' ')[0]
        let embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)
        if (fx.general.cmd_cooldown.cooldown[message.author.id] !== undefined && fx.general.cmd_cooldown.cooldown[message.author.id].indexOf(command) !== -1) {
            throw 'You need to wait 3 seconds before using this again!'
        }
        fx.general.cmd_cooldown.set(message, command, 3000)
        let suffix = fx.osu.check_suffix(msg, false, [{"suffix": "-d", "v_count": 0},
                                                        {"suffix": "-rank", "v_count": 1},
                                                        {"suffix": "-ts", "v_count": 0},
                                                        {"suffix": "-accts", "v_count": 0},
                                                        {"suffix": "-g", "v_count": 0}])
        let modedetail = fx.osu.get_mode_detail(mode)
        let a_mode = modedetail.a_mode
        let modename = modedetail.modename
        let modeicon = modedetail.modeicon
        let modenum = modedetail.modenum
        let check_type = modedetail.check_type
        let name = fx.osu.check_player(user_data, message, suffix.check, check_type)
        if (a_mode !== 'rx' && suffix.suffix.find(s => s.suffix == "-d").position > -1) {
            let user = await fx.osu.get_osu_profile(name, mode, 30, false)
            if (user == null) {
                throw 'User not found!'
            }
            let best = await fx.osu.get_osu_top(name, mode, 50, 'best')
            let event = ``
            // User
            let totalrank = user.ss + user.s + user.a
            let events = 0
            if (check_type == 'Bancho') {
                if (user.events.length > 3) events = 3;
                else events = user.events.length;
            }
            for (let i = 0; i < events; i++) {
                let text = user.events[i].html.replace(/(<([^>]+)>)/ig,"")
                event += `\n ${text}`
            }
            if (events == 0) event = 'No event';
            let supporter = user.supporter !== undefined ? user.supporter : ''

            let desc = ''; let field1 = ''
            if (modeicon) desc += `${modeicon} `
            if (supporter) desc += `${supporter}`
            if (user.rank) field1 += `**Global Rank:** #${user.rank} `;
            if (user.countryrank) field1 += `(:flag_${user.country}:: #${user.countryrank}) `;
            if (user.pp) field1 += `| ***${user.pp}pp***\n`;
            if (user.level) field1 += `**Level:** ${user.level}\n`;
            if (user.acc) field1 += `**Accuracy:** ${user.acc}%\n`;
            if (user.playcount) field1 += `**Playcount:** ${(user.playcount).toLocaleString('en')}\n`;
            if (user.totalscore && user.rankedscore) field1 += `**Ranked Score:** ${(user.rankedscore).toLocaleString('en')} | **Total Score:** ${(user.totalscore).toLocaleString('en')}`;
            if (user.playstyle) field1 += `**Play Style:** ${user.playstyle}\n`;
            if (user.ss && user.s && user.a) field1 += `<:rankingX:520932410746077184> : ${user.ss} (${Number(user.ss/totalrank*100).toFixed(2)}%) <:rankingS:520932426449682432> : ${user.s} (${Number(user.s/totalrank*100).toFixed(2)}%) <:rankingA:520932311613571072> : ${user.a} (${Number(user.a/totalrank*100).toFixed(2)}%)`;

            let profile_link = ''
            let pfp_link = ''
            if (check_type == 'Bancho') {
                profile_link = `https://osu.ppy.sh/users/${user.id}`
                pfp_link = `http://s.ppy.sh/a/${user.id}.png?date=${refresh}`
            } else if (check_type == 'Ripple') {
                profile_link = `https://ripple.moe/u/${user.id}`
                pfp_link = `http://a.ripple.moe/${user.id}?date=${refresh}`
            } else if (check_type == 'Akatsuki') {
                profile_link = `https://akatsuki.pw/u/${user.id}`
                pfp_link = `http://a.akatsuki.pw/${user.id}?date=${refresh}`
            } else if (check_type == 'Horizon') {
                profile_link = `https://lemres.de/u/${user.id}`
                pfp_link = `http://a.lemres.de/${user.id}?date=${refresh}`
            } else if (check_type == 'Enjuu') {
                profile_link = `https://enjuu.click/u/${user.id}`
                pfp_link = `http://a.enjuu.click/${user.id}?date=${refresh}`
            } else if (check_type == 'Gatari') {
                profile_link = `https://gatari.pw/u/${user.id}`
                pfp_link = `http://a.gatari.pw/${user.id}?date=${refresh}`
            }

            let embed = new MessageEmbed()
            .setDescription(`${desc}**osu!${modename} Statistics for [${user.username}](${profile_link})**`)
            .setThumbnail(pfp_link)
            .setColor(embedcolor)
            .addField(`Performance:`, field1)
            .addField(`${user.username} recent events:`, event)
            if (user.statusicon && user.statustext) embed.setFooter(user.statustext, user.statusicon);
            let msg1 = await message.channel.send('Calculating skills...', {embed});
            // Calculating skills
            if (best.length < 50) {
                throw "You don't have enough plays to calculate skill (Atleast 50 top plays)"
            }
            let star_avg = 0
            let aim_avg = 0
            let speed_avg = 0
            let finger_control_avg = 0
            let acc_avg = 0
            let old_acc_avg = 0
            let bpm_avg = 0
            let cs_avg = 0
            let ar_avg = 0
            let od_avg = 0
            let hp_avg = 0
            let timetotal_avg = 0
            let timedrain_avg = 0
            let mod_avg = []
            let sortedmod = ''
            for (let i = 0; i < 50; i++) {
                let modandbit = fx.osu.mods_enum(best[i].mod)
                if (modenum == 0) {
                    let parser = await fx.osu.precalc(best[i].beatmapid)
                    let thing = fx.osu.osu_pp_calc(parser,modandbit.bitpresent,0,0,0,0,0,'acc')
                    let detail = fx.osu.beatmap_detail(modandbit.shortenmod, best[i].timetotal, best[i].timedrain,Number(best[i].bpm),thing.cs,thing.ar,thing.od,thing.hp)
                    star_avg += thing.star.total
                    let aim_skill = (thing.star.aim * (Math.pow(detail.cs, 0.1) / Math.pow(4, 0.1)))*2
                    let speed_skill = (thing.star.speed * (Math.pow(detail.bpm, 0.09) / Math.pow(200, 0.09)) * (Math.pow(detail.ar, 0.1) / Math.pow(6, 0.1)))*2
                    console.log(aim_skill,speed_skill)
                    aim_avg += aim_skill
                    speed_avg +=  speed_skill
                    old_acc_avg += (Math.pow(thing.star.aim, (Math.pow(best[i].acc, 2.5)/Math.pow(100, 2.5)) * (0.092 * Math.log10(thing.star.nsingles*900000000) * (Math.pow(1.3, best[i].combo/best[i].fc) - 0.3))) + Math.pow(thing.star.speed, (Math.pow(best[i].acc, 2.5)/ Math.pow(100, 2.5)) * (0.099 * Math.log10(thing.star.nsingles*900000000) * (Math.pow(1.35, best[i].combo/best[i].fc) - 0.3)))) * (Math.pow(detail.od, 0.02) / Math.pow(6, 0.02)) * (Math.pow(detail.hp, 0.02) / (Math.pow(6, 0.02)))
                    //
                    let unbalance_limit = (Math.abs(aim_skill - speed_skill)) > (Math.pow(5, Math.log(aim_skill + speed_skill) / Math.log(1.7))/2940)
                    if ((modandbit.shortenmod.includes('DT') || modandbit.shortenmod.includes('NC')) && unbalance_limit) {
                        aim_skill /= 1.05
                        speed_skill /= 1.05
                    }
                    let acc_skill = (Math.pow(aim_skill / 2, (Math.pow(best[i].acc, 2.5)/Math.pow(100, 2.5)) * (0.083 * Math.log10(thing.star.nsingles*900000000) * (Math.pow(1.42, best[i].combo/best[i].fc) - 0.3) )) + Math.pow(speed_skill / 2, (Math.pow(best[i].acc, 2.5)/ Math.pow(100, 2.5)) * (0.0945 * Math.log10(thing.star.nsingles*900000000) * (Math.pow(1.35, best[i].combo/best[i].fc) - 0.3)))) * (Math.pow(detail.od, 0.02) / Math.pow(6, 0.02)) * (Math.pow(detail.hp, 0.02) / (Math.pow(6, 0.02)))
                    if (modandbit.shortenmod.includes('FL')) {
                        acc_skill *= (0.095 * Math.log10(thing.star.nsingles*900000000))
                    }
                    if (acc_skill !== Infinity) acc_avg += acc_skill
                    bpm_avg += detail.bpm
                    cs_avg += detail.cs
                    ar_avg += detail.ar
                    od_avg += detail.od
                    hp_avg += detail.hp
                    timetotal_avg += detail.timetotal
                    timedrain_avg += detail.timedrain
                }
                if (modenum == 1) {
                    let mapinfo = await fx.osu.other_modes_precalc(best[i].beatmapid, 1, modandbit.bitpresent)
                    let detail = fx.osu.beatmap_detail(modandbit.shortenmod, best[i].timetotal, best[i].timedrain, Number(best[i].bpm), 0, 0, mapinfo.od, mapinfo.hp)
                    star_avg += mapinfo.star
                    speed_avg += Math.pow(mapinfo.star/1.1, Math.log(detail.bpm)/Math.log(mapinfo.star*20))
                    let temp_acc = Math.pow(mapinfo.star, (Math.pow(best[i].acc, 3)/Math.pow(100, 3)) * 1.05) * (Math.pow(detail.od, 0.02) / Math.pow(6, 0.02)) * (Math.pow(detail.hp, 0.02) / (Math.pow(5, 0.02)))
                    if (temp_acc !== Infinity) acc_avg += temp_acc
                    bpm_avg += detail.bpm
                    od_avg += detail.od
                    hp_avg += detail.hp
                    timetotal_avg += detail.timetotal
                    timedrain_avg += detail.timedrain
                }
                if (modenum == 2) {
                    let mapinfo = await fx.osu.other_modes_precalc(best[i].beatmapid, 2, modandbit.bitpresent)
                    let detail = fx.osu.beatmap_detail(modandbit.shortenmod, best[i].timetotal, best[i].timedrain, Number(best[i].bpm), mapinfo.cs, mapinfo.ar, mapinfo.od, mapinfo.hp)
                    star_avg += mapinfo.star
                    aim_avg += Math.pow(mapinfo.star, Math.log(detail.bpm)/Math.log(mapinfo.star*20)) * (Math.pow(mapinfo.cs, 0.1) / Math.pow(4, 0.1))
                    let temp_acc = Math.pow(mapinfo.star, (Math.pow(best[i].acc, 3.5)/Math.pow(100, 3.5)) * 1.1) * (Math.pow(detail.od, 0.02) / Math.pow(6, 0.02)) * (Math.pow(detail.hp, 0.02) / (Math.pow(5, 0.02)))
                    if (temp_acc !== Infinity) acc_avg += temp_acc
                    bpm_avg += detail.bpm
                    cs_avg += detail.cs
                    ar_avg += detail.ar
                    od_avg += detail.od
                    hp_avg += detail.hp
                    timetotal_avg += detail.timetotal
                    timedrain_avg += detail.timedrain
                }
                if (modenum == 3) {
                    let mapinfo = await fx.osu.other_modes_precalc(best[i].beatmapid, 3, modandbit.bitpresent)
                    let detail = fx.osu.beatmap_detail(modandbit.shortenmod, best[i].timetotal, best[i].timedrain, Number(best[i].bpm), 0,0,0,0)
                    star_avg += mapinfo.star
                    speed_avg += Math.pow(mapinfo.star/1.1, Math.log(detail.bpm)/Math.log(mapinfo.star*20))
                    let temp_acc = Math.pow(mapinfo.star, (Math.pow(best[i].acc, 3)/Math.pow(100, 3)) * 1.075) * (Math.pow(mapinfo.od, 0.02) / Math.pow(6, 0.02)) * (Math.pow(mapinfo.hp, 0.02) / (Math.pow(5, 0.02)))
                    if (temp_acc !== Infinity) acc_avg += temp_acc
                    finger_control_avg += Math.pow(mapinfo.star, 1.1 * Math.pow(detail.bpm/250, 0.4) * (Math.log(mapinfo.circle + mapinfo.slider)/Math.log(mapinfo.star*900)) * (Math.pow(mapinfo.od, 0.4) / Math.pow(8, 0.4)) * (Math.pow(mapinfo.hp, 0.2) / Math.pow(7.5, 0.2)) * Math.pow(mapinfo.cs/4, 0.1))
                    bpm_avg += detail.bpm
                    od_avg += mapinfo.od
                    hp_avg += mapinfo.hp
                    timetotal_avg += detail.timetotal
                    timedrain_avg += detail.timedrain
                }
                let find_mod = mod_avg.find(m => m.mod == modandbit.shortenmod.substr(1))
                if (find_mod == undefined) {
                    mod_avg.push({mod: modandbit.shortenmod.substr(1), count: 1})
                } else {
                    find_mod.count += 1
                }
            }
            mod_avg.sort((a,b) => b.count - a.count)
            for (let i in mod_avg) {
                sortedmod += '`' + mod_avg[i].mod + '`: ' + `${Number(mod_avg[i].count / 50 * 100).toFixed(2)}% **(${mod_avg[i].count})**, `
            }
            sortedmod = sortedmod.substring(0, sortedmod.length-2)
            timetotal_avg = Number(timetotal_avg / 50).toFixed(0)
            timedrain_avg = Number(timedrain_avg / 50).toFixed(0)
            
            if (modenum == 0) {
                embed.addField(`${user.username} average skill:`, `
Star: ${Number(star_avg/50).toFixed(2)}★
Aim skill: ${Number(aim_avg/50).toFixed(2)}★
Speed skill: ${Number(speed_avg/50*1.03).toFixed(2)}★
Accuracy skill: ${Number(acc_avg/50).toFixed(2)}★ (Old formula: ${Number(old_acc_avg/50).toFixed(2)}★)
Length: (Total: ${Math.floor(timetotal_avg / 60)}:${('0' + (timetotal_avg - Math.floor(timetotal_avg / 60) * 60)).slice(-2)}, Drain: ${Math.floor(timedrain_avg / 60)}:${('0' + (timedrain_avg - Math.floor(timedrain_avg / 60) * 60)).slice(-2)})
BPM: ${Number(bpm_avg/50).toFixed(0)} / CS: ${Number(cs_avg/50).toFixed(2)} / AR: ${Number(ar_avg/50).toFixed(2)} / OD: ${Number(od_avg/50).toFixed(2)} / HP: ${Number(hp_avg/50).toFixed(2)}
Most common mods: ${sortedmod}`)
            }
            if (modenum == 1) {
                embed.addField(`${user.username} average skill:`, `
Star: ${Number(star_avg/50).toFixed(2)}★
Speed skill: ${Number(speed_avg/50).toFixed(2)}★
Accuracy skill: ${Number(acc_avg/50).toFixed(2)}★
Length: (Total: ${Math.floor(timetotal_avg / 60)}:${('0' + (timetotal_avg - Math.floor(timetotal_avg / 60) * 60)).slice(-2)}, Drain: ${Math.floor(timedrain_avg / 60)}:${('0' + (timedrain_avg - Math.floor(timedrain_avg / 60) * 60)).slice(-2)})
BPM: ${Number(bpm_avg/50).toFixed(0)} / OD: ${Number(od_avg/50).toFixed(2)} / HP: ${Number(hp_avg/50).toFixed(2)}
Most common mods: ${sortedmod}`)
            }
            if (modenum == 2) {
                embed.addField(`${user.username} average skill:`, `
Star: ${Number(star_avg/50).toFixed(2)}★
Aim skill: ${Number(aim_avg/50).toFixed(2)}★
Accuracy skill: ${Number(acc_avg/50).toFixed(2)}★
Length: (Total: ${Math.floor(timetotal_avg / 60)}:${('0' + (timetotal_avg - Math.floor(timetotal_avg / 60) * 60)).slice(-2)}, Drain: ${Math.floor(timedrain_avg / 60)}:${('0' + (timedrain_avg - Math.floor(timedrain_avg / 60) * 60)).slice(-2)})
BPM: ${Number(bpm_avg/50).toFixed(0)} / CS: ${Number(cs_avg/50).toFixed(2)} / AR: ${Number(ar_avg/50).toFixed(2)} / OD: ${Number(od_avg/50).toFixed(2)} / HP: ${Number(hp_avg/50).toFixed(2)}
Most common mods: ${sortedmod}`)
            }
            if (modenum == 3) {
                embed.addField(`${user.username} average skill:`, `
Star: ${Number(star_avg/50).toFixed(2)}★
Finger control skill: ${Number(finger_control_avg/50).toFixed(2)}★
Speed skill: ${Number(speed_avg/50).toFixed(2)}★
Accuracy skill: ${Number(acc_avg/50).toFixed(2)}★
Length: (Total: ${Math.floor(timetotal_avg / 60)}:${('0' + (timetotal_avg - Math.floor(timetotal_avg / 60) * 60)).slice(-2)}, Drain: ${Math.floor(timedrain_avg / 60)}:${('0' + (timedrain_avg - Math.floor(timedrain_avg / 60) * 60)).slice(-2)})
BPM: ${Number(bpm_avg/50).toFixed(0)} / OD: ${Number(od_avg/50).toFixed(2)} / HP: ${Number(hp_avg/50).toFixed(2)}
Most common mods: ${sortedmod}`)
            }
            msg1.edit({embed})
            if (mode == "Bancho-std") {
                for (let [key,value] of Object.entries(user_data)) {
                    if (value.osuname == user.username) {
                        user_data[key].osurank = user.rank
                        user_data[key].osucountry = user.country
                        if (!config.config.debug.disable_db_save) db.user_data.findAndModify({query: {}, update: user_data}, function(){})
                        break
                    }
                }
            }
        } else if (suffix.suffix.find(s => s.suffix == "-rank").position > -1 && mode == "Bancho-std") {
            let rank = Number(suffix.suffix.find(s => s.suffix == "-rank").value[0])
            if (rank < 1 || rank > 10000) {
                throw 'Please provide a number between 1-10000'
            }
            let page = 1 + Math.floor((rank - 1) / 50)
            let web_leaderboard = (await request(`https://osu.ppy.sh/rankings/osu/performance?page=${page}#scores`)).text
            let leaderboard = await cheerio.load(web_leaderboard)
            let table = leaderboard('table[class="ranking-page-table"]').children('tbody').children()
            let player = leaderboard(table[49 - ((page*50) - rank)]).children('td').children('div[class=ranking-page-table__user-link]').children('a[class="ranking-page-table__user-link-text js-usercard"]').attr('href').split('/')
            player = player[player.length-1]
            let user = await fx.osu.get_osu_profile(player,'Bancho-std',0,false,false)
            if (user.username == undefined) {
                throw 'User not found!'
            }
            let embed = fx.osu.profile_overlay(message,
                                                check_type,
                                                modeicon, 
                                                user.supporter, 
                                                modename, 
                                                user.username, 
                                                user.id, 
                                                user.pp, 
                                                user.rank, 
                                                user.country, 
                                                user.countryrank, 
                                                user.acc, 
                                                user.playcount, 
                                                user.level, 
                                                user.playstyle, 
                                                user.ss, 
                                                user.s, 
                                                user.a, 
                                                user.statustext, 
                                                user.statusicon,
                                                refresh)
            message.channel.send({embed});
            if (mode == "Bancho-std") {
                for (let [key,value] of Object.entries(user_data)) {
                    if (value.osuname == user.username) {
                        user_data[key].osurank = user.rank
                        user_data[key].osucountry = user.country
                        if (!config.config.debug.disable_db_save) db.user_data.findAndModify({query: {}, update: user_data}, function(){})
                        break
                    }
                }
            }
        } else if (suffix.suffix.find(s => s.suffix == "-ts").position > -1 && a_mode == 'std') {
            let user = await fx.osu.get_osu_profile(name, mode, 30, false, false)
            if (user == null) {
                throw 'User not found!'
            }
            let best = await fx.osu.get_osu_top(name, mode, 50, 'best')
            if (best.length < 50) {
                throw "You don't have enough plays to calculate skill (Atleast 50 top plays)"
            }
            let msg1 = await message.channel.send('Calculating skills...') 
            let star_avg = 0
            let aim_avg = 0
            let speed_avg = 0
            let finger_control_avg = 0
            let acc_avg = 0
            let old_acc_avg = 0
            let top_star = []
            let top_aim = []
            let top_speed = []
            let top_old_acc = []
            let top_acc = []
            for (let i = 0; i < 50; i++) {
                let modandbit = fx.osu.mods_enum(best[i].mod)
                if (modenum == 0) {
                    let parser = await fx.osu.precalc(best[i].beatmapid)
                    let thing = fx.osu.osu_pp_calc(parser,modandbit.bitpresent,0,0,0,0,0,0)
                    let detail = fx.osu.beatmap_detail(modandbit.shortenmod, best[i].timetotal, best[i].timedrain,Number(best[i].bpm),thing.cs,thing.ar,thing.od,thing.hp)
                    let star_skill = thing.star.total
                    let aim_skill = (thing.star.aim * (Math.pow(detail.cs, 0.1) / Math.pow(4, 0.1)))*2
                    let speed_skill = (thing.star.speed * (Math.pow(detail.bpm, 0.09) / Math.pow(200, 0.09)) * (Math.pow(detail.ar, 0.1) / Math.pow(6, 0.1)))*2
                    let old_acc_skill = (Math.pow(thing.star.aim, (Math.pow(best[i].acc, 2.5)/Math.pow(100, 2.5)) * (0.092 * Math.log10(thing.star.nsingles*900000000) * (Math.pow(1.3, best[i].combo/best[i].fc) - 0.3))) + Math.pow(thing.star.speed, (Math.pow(best[i].acc, 2.5)/ Math.pow(100, 2.5)) * (0.099 * Math.log10(thing.star.nsingles*900000000) * (Math.pow(1.35, best[i].combo/best[i].fc) - 0.3)))) * (Math.pow(detail.od, 0.02) / Math.pow(6, 0.02)) * (Math.pow(detail.hp, 0.02) / (Math.pow(6, 0.02)))
                    star_avg += star_skill
                    aim_avg += aim_skill
                    speed_avg += speed_skill
                    old_acc_avg += old_acc_skill
                    let unbalance_limit = (Math.abs(aim_skill - speed_skill)) > (Math.pow(5, Math.log(aim_skill + speed_skill) / Math.log(1.7))/2940)
                    if ((modandbit.shortenmod.includes('DT') || modandbit.shortenmod.includes('NC')) && unbalance_limit) {
                        aim_skill /= 1.05
                        speed_skill /= 1.05
                    }
                    let acc_skill = (Math.pow(aim_skill / 2, (Math.pow(best[i].acc, 2.5)/Math.pow(100, 2.5)) * (0.083 * Math.log10(thing.star.nsingles*900000000) * (Math.pow(1.42, best[i].combo/best[i].fc) - 0.3) )) + Math.pow(speed_skill / 2, (Math.pow(best[i].acc, 2.5)/ Math.pow(100, 2.5)) * (0.0945 * Math.log10(thing.star.nsingles*900000000) * (Math.pow(1.35, best[i].combo/best[i].fc) - 0.3)))) * (Math.pow(detail.od, 0.02) / Math.pow(6, 0.02)) * (Math.pow(detail.hp, 0.02) / (Math.pow(6, 0.02)))
                    if (modandbit.shortenmod.includes('FL')) {
                        acc_skill *= (0.095 * Math.log10(thing.star.nsingles*900000000))
                    }
                    if (acc_skill !== Infinity) acc_avg += acc_skill
                    top_star.push({beatmap: `${best[i].title} [${best[i].diff}]`, skill: star_skill})
                    top_aim.push({beatmap: `${best[i].title} [${best[i].diff}]`, skill: aim_skill})
                    top_speed.push({beatmap: `${best[i].title} [${best[i].diff}]`, skill: speed_skill})
                    top_old_acc.push({beatmap: `${best[i].title} [${best[i].diff}]`, skill: old_acc_skill})
                    top_acc.push({beatmap: `${best[i].title} [${best[i].diff}]`, skill: acc_skill})
                }
            }
            top_star.sort(function(a,b){return b.skill-a.skill}).splice(3,100)
            top_aim.sort(function(a,b){return b.skill-a.skill}).splice(3,100)
            top_speed.sort(function(a,b){return b.skill-a.skill}).splice(3,100)
            top_old_acc.sort(function(a,b){return b.skill-a.skill}).splice(3,100)
            top_acc.sort(function(a,b){return b.skill-a.skill}).splice(3,100)
            let field = []
            let text = ''
            function textloading (top) {
                let text = ''
                for (let i in top) {
                    text += `${top[i].beatmap}: **${Number(top[i].skill).toFixed(2)}★**\n`
                }
                field.push(text)
            }
            textloading(top_star)
            textloading(top_aim)
            textloading(top_speed)
            textloading(top_old_acc)
            textloading(top_acc)
            let profile_link = ''
            let pfp_link = ''
            if (check_type == 'Bancho') {
                profile_link = `https://osu.ppy.sh/users/${user.id}`
                pfp_link = `http://s.ppy.sh/a/${user.id}.png?date=${refresh}`
            } else if (check_type == 'Ripple') {
                profile_link = `https://ripple.moe/u/${user.id}`
                pfp_link = `http://a.ripple.moe/${user.id}?date=${refresh}`
            } else if (check_type == 'Akatsuki') {
                profile_link = `https://akatsuki.pw/u/${user.id}`
                pfp_link = `http://a.akatsuki.pw/${user.id}?date=${refresh}`
            } else if (check_type == 'Horizon') {
                profile_link = `https://lemres.de/u/${user.id}`
                pfp_link = `http://a.lemres.de/${user.id}?date=${refresh}`
            } else if (check_type == 'Enjuu') {
                profile_link = `https://enjuu.click/u/${user.id}`
                pfp_link = `http://a.enjuu.click/${user.id}?date=${refresh}`
            } else if (check_type == 'Gatari') {
                profile_link = `https://gatari.pw/u/${user.id}`
                pfp_link = `http://a.gatari.pw/${user.id}?date=${refresh}`
            }
            const embed = new MessageEmbed()
            .setDescription(`${modeicon} **Osu!${modename} top skill for: [${user.username}](${profile_link})**`)
            .setThumbnail(pfp_link)
            .addField(`${user.username} average skill:`, `
Star: ${Number(star_avg/50).toFixed(2)}★
Aim skill: ${Number(aim_avg/50).toFixed(2)}★
Speed skill: ${Number(speed_avg/50*1.03).toFixed(2)}★
Accuracy skill: ${Number(acc_avg/50).toFixed(2)}★ (Old formula: ${Number(old_acc_avg/50).toFixed(2)}★)`)
            .addField('Top star skill:', field[0])
            .addField('Top aim skill:', field[1])
            .addField('Top speed skill:', field[2])
            .addField('Top old acc skill:', field[3])
            .addField('Top acc skill:', field[4]);
            msg1.edit({embed})
            if (mode == "Bancho-std") {
                for (let [key,value] of Object.entries(user_data)) {
                    if (value.osuname == user.username) {
                        user_data[key].osurank = user.rank
                        user_data[key].osucountry = user.country
                        if (!config.config.debug.disable_db_save) db.user_data.findAndModify({query: {}, update: user_data}, function(){})
                        break
                    }
                }
            }
        } else if (suffix.suffix.find(s => s.suffix == "-accts").position > -1 && mode == 'Bancho-std') {
            let user = await fx.osu.get_osu_profile(name, mode, 30, false, false)
            if (user == null) {
                throw 'User not found!'
            }
            let best = await fx.osu.get_osu_top(name, mode, 50, 'best')
            if (best.length < 50) {
                throw "You don't have enough plays to calculate skill (Atleast 50 top plays)"
            }
            let msg1 = await message.channel.send('Calculating skills...') 
            let acc_avg = 0
            let top_acc = []
            for (let i = 0; i < 50; i++) {
                let modandbit = fx.osu.mods_enum(best[i].mod)
                if (modenum == 0) {
                    let parser = await fx.osu.precalc(best[i].beatmapid)
                    let thing = fx.osu.osu_pp_calc(parser,modandbit.bitpresent,0,0,0,0,0,0)
                    let detail = fx.osu.beatmap_detail(modandbit.shortenmod, best[i].timetotal, best[i].timedrain,Number(best[i].bpm),thing.cs,thing.ar,thing.od,thing.hp)
                    let aim_skill = (thing.star.aim * (Math.pow(detail.cs, 0.1) / Math.pow(4, 0.1)))*2
                    let speed_skill = (thing.star.speed * (Math.pow(detail.bpm, 0.09) / Math.pow(200, 0.09)) * (Math.pow(detail.ar, 0.1) / Math.pow(6, 0.1)))*2
                    let unbalance_limit = (Math.abs(aim_skill - speed_skill)) > (Math.pow(5, Math.log(aim_skill + speed_skill) / Math.log(1.7))/2940)
                    if ((modandbit.shortenmod.includes('DT') || modandbit.shortenmod.includes('NC')) && unbalance_limit) {
                        aim_skill /= 1.05
                        speed_skill /= 1.05
                    }
                    let acc_skill = (Math.pow(aim_skill / 2, (Math.pow(best[i].acc, 2.5)/Math.pow(100, 2.5)) * (0.083 * Math.log10(thing.star.nsingles*900000000) * (Math.pow(1.42, best[i].combo/best[i].fc) - 0.3) )) + Math.pow(speed_skill / 2, (Math.pow(best[i].acc, 2.5)/ Math.pow(100, 2.5)) * (0.0945 * Math.log10(thing.star.nsingles*900000000) * (Math.pow(1.35, best[i].combo/best[i].fc) - 0.3)))) * (Math.pow(detail.od, 0.02) / Math.pow(6, 0.02)) * (Math.pow(detail.hp, 0.02) / (Math.pow(6, 0.02)))
                    if (modandbit.shortenmod.includes('FL')) {
                        acc_skill *= (0.095 * Math.log10(thing.star.nsingles*900000000))
                    }
                    if (acc_skill !== Infinity) acc_avg += acc_skill
                    let rank = fx.osu.ranking_letter(best[i].letter)
                    top_acc.push({title: best[i].title, diff: best[i].diff, skill: acc_skill, mod: modandbit.shortenmod, rank: rank, acc: best[i].acc, star: thing.star.total, id: best[i].beatmapid})
                }
            }
            top_acc.sort(function(a,b){return b.skill-a.skill})
            let loadpage = async function (page, pages) {
                let gathering = ''
                for (let n = 0; n < 5; n++) {
                    let i = (page - 1) * 5 - 1 + (n+1)
                    if (i <= best.length- 1) {
                        gathering += `${i+1}. **[${top_acc[i].title}](https://osu.ppy.sh/b/${top_acc[i].id})** (${Number(top_acc[i].star).toFixed(2)}★) ${top_acc[i].mod}
${top_acc[i].rank} *${top_acc[i].diff}* ◆ **Acc:** ${Number(top_acc[i].acc).toFixed(2)}%
\`Acc skill: ${Number(top_acc[i].skill).toFixed(2)}★\`\n\n`
                    }
                }
                pages[page-1] = gathering
                return pages
            }
            let profile_link = ''
            let pfp_link = ''
            if (check_type == 'Bancho') {
                profile_link = `https://osu.ppy.sh/users/${user.id}`
                pfp_link = `http://s.ppy.sh/a/${user.id}.png?date=${refresh}`
            }
            fx.general.page_system(message, {load: loadpage}, `Osu!${modename} top acc skill for: ${user.username} (Page {page} of {max_page})`, pfp_link, embedcolor, 50/5, 240000)
            if (mode == "Bancho-std") {
                for (let [key,value] of Object.entries(user_data)) {
                    if (value.osuname == user.username) {
                        user_data[key].osurank = user.rank
                        user_data[key].osucountry = user.country
                        if (!config.config.debug.disable_db_save) db.user_data.findAndModify({query: {}, update: user_data}, function(){})
                        break
                    }
                }
            }
        } else {
            let user = await fx.osu.get_osu_profile(name, mode, 0, false)
            if (user == null) {
                throw 'User not found!'
            }
            let embed = fx.osu.profile_overlay(message,
                                                check_type,
                                                modeicon, 
                                                user.supporter, 
                                                modename, 
                                                user.username, 
                                                user.id, 
                                                user.pp, 
                                                user.rank, 
                                                user.country, 
                                                user.countryrank, 
                                                user.acc, 
                                                user.playcount, 
                                                user.level, 
                                                user.playstyle, 
                                                user.ss, 
                                                user.s, 
                                                user.a, 
                                                user.statustext, 
                                                user.statusicon,
                                                refresh)
            message.channel.send({embed});
            if (mode == "Bancho-std") {
                for (let [key,value] of Object.entries(user_data)) {
                    if (value.osuname == user.username) {
                        user_data[key].osurank = user.rank
                        user_data[key].osucountry = user.country
                        if (!config.config.debug.disable_db_save) db.user_data.findAndModify({query: {}, update: user_data}, function(){})
                        break
                    }
                }
            }
        }
    } catch (error) {
        message.channel.send(String(error))
    }
}

async function osu_card(message = new Message(), mode) {
    try {
        let msg = message.content.toLowerCase();
        let refresh = Math.round(Math.random()* 2147483648)
        let suffix = fx.osu.check_suffix(msg, false, [{"suffix": undefined, "v_count": 0}])
        // Get Information
        let modedetail = fx.osu.get_mode_detail(mode)
        let modenum = modedetail.modenum
        let check_type = modedetail.check_type
        let a_mode = modedetail.a_mode
        let name = fx.osu.check_player(user_data, message, suffix.check, check_type)
        if (a_mode == 'rx') {
            throw 'Card is only available for other modes except relax'
        }
        let user = await fx.osu.get_osu_profile(name, mode, 1, false, false)
        if (user == null) {
            throw 'User not found!'
        }
        let best = await fx.osu.get_osu_top(name, mode, 50, 'best')
        if (best.length < 50) {
            throw "You don't have enough plays to calculate skill (Atleast 50 top plays)"
        }
        let msg1 = await message.channel.send('Calculating skills...') 
        let star_avg = 0
        let aim_avg = 0
        let speed_avg = 0
        let finger_control_avg = 0
        let acc_avg = 0
        for (let i = 0; i < 50; i++) {
            let modandbit = fx.osu.mods_enum(best[i].mod)
            if (modenum == 0) {
                let parser = await fx.osu.precalc(best[i].beatmapid)
                let thing = fx.osu.osu_pp_calc(parser,modandbit.bitpresent,0,0,0,0,0,0)
                let detail = fx.osu.beatmap_detail(modandbit.shortenmod, best[i].timetotal, best[i].timedrain,Number(best[i].bpm),thing.cs,thing.ar,thing.od,thing.hp)
                star_avg += thing.star.total
                let aim_skill = (thing.star.aim * (Math.pow(detail.cs, 0.1) / Math.pow(4, 0.1)))*2
                let speed_skill = (thing.star.speed * (Math.pow(detail.bpm, 0.09) / Math.pow(200, 0.09)) * (Math.pow(detail.ar, 0.1) / Math.pow(6, 0.1)))*2
                aim_avg += aim_skill
                speed_avg += speed_skill
                let unbalance_limit = (Math.abs(aim_skill - speed_skill)) > (Math.pow(5, Math.log(aim_skill + speed_skill) / Math.log(1.7))/2940)
                if ((modandbit.shortenmod.includes('DT') || modandbit.shortenmod.includes('NC')) && unbalance_limit) {
                    aim_skill /= 1.05
                    speed_skill /= 1.05
                }
                let acc_skill = (Math.pow(aim_skill / 2, (Math.pow(best[i].acc, 2.5)/Math.pow(100, 2.5)) * (0.083 * Math.log10(thing.star.nsingles*900000000) * (Math.pow(1.42, best[i].combo/best[i].fc) - 0.3) )) + Math.pow(speed_skill / 2, (Math.pow(best[i].acc, 2.5)/ Math.pow(100, 2.5)) * (0.0945 * Math.log10(thing.star.nsingles*900000000) * (Math.pow(1.35, best[i].combo/best[i].fc) - 0.3)))) * (Math.pow(detail.od, 0.02) / Math.pow(6, 0.02)) * (Math.pow(detail.hp, 0.02) / (Math.pow(6, 0.02)))
                if (modandbit.shortenmod.includes('FL')) {
                    acc_skill *= (0.095 * Math.log10(thing.star.nsingles*900000000))
                }
                if (acc_skill !== Infinity) acc_avg += acc_skill
            }
            if (modenum == 1) {
                let mapinfo = await fx.osu.other_modes_precalc(best[i].beatmapid, 1, modandbit.bitpresent)
                let detail = fx.osu.beatmap_detail(modandbit.shortenmod, best[i].timetotal, best[i].timedrain, Number(best[i].bpm), 0, 0, mapinfo.od, mapinfo.hp)
                star_avg += mapinfo.star
                speed_avg += Math.pow(mapinfo.star/1.1, Math.log(detail.bpm)/Math.log(mapinfo.star*20))
                let temp_acc = Math.pow(mapinfo.star, (Math.pow(best[i].acc, 3)/Math.pow(100, 3)) * 1.05) * (Math.pow(detail.od, 0.02) / Math.pow(6, 0.02)) * (Math.pow(detail.hp, 0.02) / (Math.pow(5, 0.02)))
                if (temp_acc !== Infinity) acc_avg += temp_acc
            }
            if (modenum == 2) {
                let mapinfo = await fx.osu.other_modes_precalc(best[i].beatmapid, 2, modandbit.bitpresent)
                let detail = fx.osu.beatmap_detail(modandbit.shortenmod, best[i].timetotal, best[i].timedrain, Number(best[i].bpm), mapinfo.cs, mapinfo.ar, mapinfo.od, mapinfo.hp)
                star_avg += mapinfo.star
                aim_avg += Math.pow(mapinfo.star, Math.log(detail.bpm)/Math.log(mapinfo.star*20)) * (Math.pow(mapinfo.cs, 0.1) / Math.pow(4, 0.1))
                let temp_acc = Math.pow(mapinfo.star, (Math.pow(best[i].acc, 3.5)/Math.pow(100, 3.5)) * 1.1) * (Math.pow(detail.od, 0.02) / Math.pow(6, 0.02)) * (Math.pow(detail.hp, 0.02) / (Math.pow(5, 0.02)))
                if (temp_acc !== Infinity) acc_avg += temp_acc
            }
            if (modenum == 3) {
                let mapinfo = await fx.osu.other_modes_precalc(best[i].beatmapid, 3, modandbit.bitpresent)
                let detail = fx.osu.beatmap_detail(modandbit.shortenmod, best[i].timetotal, best[i].timedrain, Number(best[i].bpm), 0,0,0,0)
                star_avg += mapinfo.star
                speed_avg += Math.pow(mapinfo.star/1.1, Math.log(detail.bpm)/Math.log(mapinfo.star*20))
                let temp_acc = Math.pow(mapinfo.star, (Math.pow(best[i].acc, 3)/Math.pow(100, 3)) * 1.075) * (Math.pow(mapinfo.od, 0.02) / Math.pow(6, 0.02)) * (Math.pow(mapinfo.hp, 0.02) / (Math.pow(5, 0.02)))
                if (temp_acc !== Infinity) acc_avg += temp_acc
                finger_control_avg += Math.pow(mapinfo.star, 1.1 * Math.pow(detail.bpm/250, 0.4) * (Math.log(mapinfo.circle + mapinfo.slider)/Math.log(mapinfo.star*900)) * (Math.pow(mapinfo.od, 0.4) / Math.pow(8, 0.4)) * (Math.pow(mapinfo.hp, 0.2) / Math.pow(7.5, 0.2)) * Math.pow(mapinfo.cs/4, 0.1))
            }
        }
        star_avg = Number(star_avg / 50)
        aim_avg = Number(aim_avg / 50 * 100).toFixed(0)
        speed_avg = Number(speed_avg / 50 * 100*1.03).toFixed(0)
        acc_avg = Number(acc_avg / 50 * 100).toFixed(0)
        finger_control_avg = Number(finger_control_avg/50 * 100).toFixed(0)
        // Process image
        msg1.edit('Processing Image...')
        let card = ''
        if (acc_avg >= 0 && acc_avg < 300) {
            card = await jimp.read('./osu_card/card/common_osu.png')
        } else if (acc_avg >= 300 && acc_avg < 525) {
            card = await jimp.read('./osu_card/card/rare_osu.png')
        } else if (acc_avg >= 525 && acc_avg < 700) {
            card = await jimp.read('./osu_card/card/elite_osu.png')
        } else if (acc_avg >= 700 && acc_avg < 825) {
            card = await jimp.read('./osu_card/card/super_rare_osu.png')
        } else if (acc_avg >= 825 && acc_avg < 900) {
            card = await jimp.read('./osu_card/card/ultra_rare_osu.png')
        } else if (acc_avg >= 900) {
            card = await jimp.read('./osu_card/card/master_osu.png')
        }
        // Special card
        let special;
        if (modenum == 0 && check_type == "Bancho") {
            let s_player = [124493, 39828, 50265, 2558286, 5339515, 4650315]
            for (let i in s_player) {
                if (user.id == s_player[i]) {
                    special = 'normal'
                    card = await jimp.read('./osu_card/card/legendary_osu.png')
                    star_avg = 10
                    break
                }
                if (user.id == 4504101) {
                    special = 'whitecat'
                    card = await jimp.read('./osu_card/card/legendary_osu_whitecat.png')
                    star_avg = 10
                    break
                }
                if (user.id == 6447454) {
                    special = 'merami'
                    card = await jimp.read('./osu_card/card/legendary_osu_merami.png')
                    star_avg = 10
                    break
                }
            }
            if (special) {
                if (user.id == 124493) { // Cokiezi
                    aim_avg *= 1.05
                    speed_avg *= 1.075
                    acc_avg *= 1.075
                } else if (user.id == 39828) { // WWW
                    aim_avg *= 1.075
                    speed_avg *= 1.025
                    acc_avg *= 1.05
                } else if (user.id == 50265) { // hvick
                    aim_avg *= 1.05
                    speed_avg *= 1.05
                    acc_avg *= 1.075
                } else if (user.id == 2558286) { // Rafis
                    aim_avg *= 1.05
                    speed_avg *= 1.05
                    acc_avg *= 1.025
                } else if (user.id == 5339515) { // Mathi
                    aim_avg *= 1.05
                    speed_avg *= 1.05
                    acc_avg *= 1.025
                } else if (user.id == 4650315) { // idke
                    aim_avg *= 1.05
                    speed_avg *= 1.05
                    acc_avg *= 1.075
                } else if (user.id == 4504101) { // whitecat
                    aim_avg *= 1.075
                    speed_avg *= 1.025
                    acc_avg *= 1.025
                } else if (user.id == 6447454) { // merami
                    aim_avg *= 1.025
                    speed_avg *= 1.075
                    acc_avg *= 1.025
                }
                aim_avg = aim_avg.toFixed(0)
                speed_avg = speed_avg.toFixed(0)
                acc_avg = acc_avg.toFixed(0)
            }
        }

        let pfp_link = ''
        if (check_type == 'Bancho')        pfp_link = `http://s.ppy.sh/a/${user.id}.png?date=${refresh}`;
        else if (check_type == 'Ripple')   pfp_link = `http://a.ripple.moe/${user.id}?date=${refresh}`;
        else if (check_type == 'Akatsuki') pfp_link = `http://a.akatsuki.pw/${user.id}?date=${refresh}`;
        else if (check_type == 'Horizon')  pfp_link = `http://a.lemres.de/${user.id}?date=${refresh}`;
        else if (check_type == 'Enjuu')    pfp_link = `http://a.enjuu.click/${user.id}?date=${refresh}`;
        else if (check_type == 'Gatari')   pfp_link = `http://a.gatari.pw/${user.id}?date=${refresh}`;
        let pfp = await jimp.read(pfp_link)
        pfp.resize(320,320)
        card.composite(pfp, 40,110)
        // Get mode icon
        const icon_path = './osu_card/icon/'
        const path_suffix = mode.toLowerCase().replace('-', '_') 
        let mode_icon = await jimp.read(`${icon_path}${path_suffix}.png`)
        mode_icon.resize(80,80)
        card.composite(mode_icon, 20, 20)
        // Get username
        let text_color = 'white'
        let n_text_color = 'white'
        if (special == 'whitecat') {
            n_text_color = '#D19D23'
        }
        let nametext = await jimp.read(text2png(user.username, {
            color: n_text_color,
            font: '80px Antipasto',
            localFontPath: './font/Antipasto.otf',
            localFontName: 'Antipasto',
            lineSpacing: 15}))
        let nametextw = nametext.getWidth()
        let nametexth = nametext.getHeight()
        if (nametextw / 220 >= nametexth / 27) {
            nametext.resize(220, jimp.AUTO)
        } else {
            nametext.resize(jimp.AUTO, 27)
        }
        nametext.contain(220, 27, jimp.HORIZONTAL_ALIGN_CENTER)
        card.composite(nametext, 150, 50)
        // Stat
        let skillname = ''
        let skillnumber = ''
        let text_line_spacing = 10
        let stat_number_x = 0
        if (modenum == 0) {
            skillname = `Aim:\nSpeed:\nAccuracy:`
            skillnumber = `${aim_avg}\n${speed_avg}\n${acc_avg}`
            stat_number_x = 170
            if (special) {
                skillnumber = `${aim_avg}+\n${speed_avg}+\n${acc_avg}+`
            }
        }
        if (modenum == 1) {
            skillname = `Speed:\nAccuracy:`
            skillnumber = `${speed_avg}\n${acc_avg}`
            stat_number_x = 170
        }
        if (modenum == 2) {
            skillname = `Aim:\nAccuracy:`
            skillnumber = `${aim_avg}\n${acc_avg}`
            stat_number_x = 170
        }
        if (modenum == 3) {
            skillname = `Finger Control:\nSpeed:\nAccuracy:`
            skillnumber = `${finger_control_avg}\n${speed_avg}\n${acc_avg}`
            stat_number_x = 230
        }
        let stattext = await jimp.read(text2png(skillname, {
            color: text_color,
            font: '34px Antipasto',
            localFontPath: './font/Antipasto.otf',
            localFontName: 'Antipasto',
            lineSpacing: text_line_spacing,
            textAlign: 'right'}))
        card.composite(stattext, 20, 444)
        let statnumber = await jimp.read(text2png(skillnumber, {
            color: text_color,
            font: '34px Antipasto',
            localFontPath: './font/Antipasto.otf',
            localFontName: 'Antipasto',
            lineSpacing: 16,
            textAlign: 'left'}))
        card.composite(statnumber, stat_number_x, 444)
        // Star
        let fullstar = await jimp.read('./osu_card/full_star.png')
        let halfstar = await jimp.read('./osu_card/half_star.png')
        let star_width = 32
        let width = (Math.floor(star_avg) + ((star_avg % 1) >= 0.5 ? 1 : 0)) * star_width + 2
        let starholder = await new jimp(width, 33, 0x00000000)
        for (let i = 0; i < Math.ceil(star_avg); i++) {
            if (i+1 > Math.floor(star_avg)) {
                starholder.composite(halfstar, i*star_width, 0)
            } else {
                starholder.composite(fullstar, i*star_width, 0)
            }
        }
        if (special == undefined || special == 'normal') {
            starholder.contain(400,33, jimp.HORIZONTAL_ALIGN_CENTER)
            card.composite(starholder, 10, 551)
        } else {
            starholder.contain(240,27, jimp.HORIZONTAL_ALIGN_CENTER)
            card.composite(starholder, 15, 556)
        }
        
        msg1.edit('Done!')
        message.channel.send({
            files: [{
              attachment: await card.getBufferAsync(jimp.MIME_PNG),
              name: 'card.png'
            }]
          })
    } catch (error) {
        message.channel.send(String(error))
    }
}

async function osutop(message = new Message(), mode) {
    try {
        let msg = message.content.toLowerCase();
        let refresh = Math.round(Math.random()* 2147483648)
        let command = msg.split(' ')[0]
        let embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)
        if (fx.general.cmd_cooldown.cooldown[message.author.id] !== undefined && fx.general.cmd_cooldown.cooldown[message.author.id].indexOf(command) !== -1) {
            throw 'You need to wait 3 seconds before using this again!'
        }
        fx.general.cmd_cooldown.set(message, command, 3000)
        let suffix = fx.osu.check_suffix(msg, false, [{"suffix": "-p", "v_count": 1},
                                                    {"suffix": "-r", "v_count": 0},
                                                    {"suffix": "-m", "v_count": 1},
                                                    {"suffix": "-g", "v_count": 1},
                                                    {"suffix": "-s", "v_count": 1},
                                                    {"suffix": "-a", "v_count": 0},
                                                    {"suffix": "-page", "v_count": 0}])
        let top = ''
        let modedetail = fx.osu.get_mode_detail(mode)
        let modename = modedetail.modename
        let check_type = modedetail.check_type
        let modenum = modedetail.modenum
        let a_mode = modedetail.a_mode
        let pfp_link = `http://a.${modedetail.link}/{user_id}?date=${refresh}`
        let name = fx.osu.check_player(user_data, message, suffix.check, check_type)
        if (suffix.suffix.find(s => s.suffix == "-p").position > -1) {
            let numberoption = suffix.suffix.find(s => s.suffix == "-p").value[0]
            let range = false
            let numberrange = ''
            if (numberoption.includes('-') == true) {
                range = true
                numberrange = numberoption.split('-')
            } else {
                numberrange = [numberoption, Number(numberoption)]
            }
            if (range == true && Math.abs(Number(numberrange[0]) - Number(numberrange[1])) > 4) {
                throw 'Range limited to 5 top play'
            }
            if (range == false && (Number(numberrange[0]) < 1 || Number(numberrange[0]) > 100)) {
                throw 'Please provide a number between 1-100'
            }
            let user = await fx.osu.get_osu_profile(name, mode, 0, false, false)
            if (user == null) {
                throw 'User not found!'
            }
            pfp_link = pfp_link.replace('{user_id}', user.id)
            console.log(pfp_link)
            let username = user.username
            let best = await fx.osu.get_osu_top(name, mode, Number(numberrange[1]), 'best', true)
            if (best[Number(numberrange[0]) - 1] == undefined) {
                throw "Top play doesn't found!"
            }
            for (let i = Number(numberrange[0]) - 1; i < Number(numberrange[1]) ; i++) {
                let beatmap = await fx.osu.get_osu_beatmap(best[i].beatmapid, mode)
                let rank = fx.osu.ranking_letter(best[i].letter)
                let modandbit = fx.osu.mods_enum(best[i].mod)
                let shortenmod = modandbit.shortenmod
                let bitpresent = modandbit.bitpresent
                let date = fx.osu.time_played(best[i].date)
                cache_beatmap_ID(message, best[i].beatmapid, mode)
                let parser = ''
                if (modenum == 0) {parser = await fx.osu.precalc(best[i].beatmapid)}
                let fc_stat = await fx.osu.get_pp(a_mode, parser, best[i].beatmapid, bitpresent, best[i].score, best[i].combo, beatmap.fc, best[i].count300, best[i].count100, best[i].count50, best[i].countmiss, best[i].countgeki, best[i].countkatu, best[i].acc, best[i].perfect)
                let scoreoverlay = fx.osu.score_overlay(i+1,beatmap.title,best[i].beatmapid,fc_stat.star,shortenmod,best[i].pp,undefined,rank,beatmap.diff,best[i].score,best[i].combo,beatmap.fc,best[i].acc,best[i].accdetail,fc_stat.fcguess,undefined,date,'beatmap')
                top += scoreoverlay
            }
            const embed = new MessageEmbed()
            .setAuthor(`Top osu!${modename} Plays for ${username}`)
            .setThumbnail(pfp_link)
            .setColor(embedcolor)
            .setDescription(top);
            message.channel.send({embed});
        } else if (suffix.suffix.find(s => s.suffix == "-r").position > -1) {
            let user = await fx.osu.get_osu_profile(name, mode, 0, false, false)
            if (user == null) {
                throw 'User not found!'
            }
            pfp_link = pfp_link.replace('{user_id}', user.id)
            let username = user.username
            let best = await fx.osu.get_osu_top(name, mode, 100, 'best', true)
            if (best.length == 0) {
                throw `I think ${name} didn't play anything yet~`
            }
            let userid = best[0].userid
            best.sort(function (a,b) {
                a1 = Date.parse(a.date)
                b1 = Date.parse(b.date)
                return b1 - a1
            })
            for (let i = 0; i < (best.length > 5 ? 5 : best.length); i++) {
                let beatmap = await fx.osu.get_osu_beatmap(best[i].beatmapid, mode)
                let rank = fx.osu.ranking_letter(best[i].letter)
                let modandbit = fx.osu.mods_enum(best[i].mod)
                let shortenmod = modandbit.shortenmod
                let bitpresent = modandbit.bitpresent
                let date = fx.osu.time_played(best[i].date)
                cache_beatmap_ID(message, best[i].beatmapid, mode)
                let parser = ''
                if (modenum == 0) {parser = await fx.osu.precalc(best[i].beatmapid)}
                let fc_stat = await fx.osu.get_pp(a_mode, parser, best[i].beatmapid, bitpresent, best[i].score, best[i].combo, beatmap.fc, best[i].count300, best[i].count100, best[i].count50, best[i].countmiss, best[i].countgeki, best[i].countkatu, best[i].acc, best[i].perfect)
                let scoreoverlay = fx.osu.score_overlay(best[i].top,beatmap.title,best[i].beatmapid,fc_stat.star,shortenmod,best[i].pp,undefined,rank,beatmap.diff,best[i].score,best[i].combo,beatmap.fc,best[i].acc,best[i].accdetail,fc_stat.fcguess,undefined,date,'beatmap')
                top += scoreoverlay
            }
            const embed = new MessageEmbed()
            .setAuthor(`Top osu!${modename} most recent plays for ${username}`)
            .setThumbnail(pfp_link)
            .setColor(embedcolor)
            .setDescription(top);
            message.channel.send({embed});
        } else if (suffix.suffix.find(s => s.suffix == "-m").position > -1) {
            let getmod = suffix.suffix.find(s => s.suffix == "-m").value[0]
            let mod = fx.osu.mods_enum(getmod).bitpresent
            let user = await fx.osu.get_osu_profile(name, mode, 0, false, false)
            if (user == null) {
                throw 'User not found!'
            }
            pfp_link = pfp_link.replace('{user_id}', user.id)
            let best = await fx.osu.get_osu_top(name, mode, 100, 'best', true)
            let checktop = 0
            let username = user.username
            for (let i = 0; i < best.length; i++) {
                let score_mod = best[i].mod
                if (score_mod == mod && checktop < 5) {
                    checktop += 1
                    let beatmap = await fx.osu.get_osu_beatmap(best[i].beatmapid, mode)
                    let rank = fx.osu.ranking_letter(best[i].letter)
                    let modandbit = fx.osu.mods_enum(best[i].mod)
                    let shortenmod = modandbit.shortenmod
                    let bitpresent = modandbit.bitpresent
                    let date = fx.osu.time_played(best[i].date)
                    cache_beatmap_ID(message, best[i].beatmapid, mode)
                    let parser = ''
                    if (modenum == 0) {parser = await fx.osu.precalc(best[i].beatmapid)}
                    let fc_stat = await fx.osu.get_pp(a_mode, parser, best[i].beatmapid, bitpresent, best[i].score, best[i].combo, beatmap.fc, best[i].count300, best[i].count100, best[i].count50, best[i].countmiss, best[i].countgeki, best[i].countkatu, best[i].acc, best[i].perfect)
                    let scoreoverlay = fx.osu.score_overlay(i+1,beatmap.title,best[i].beatmapid,fc_stat.star,shortenmod,best[i].pp,undefined,rank,beatmap.diff,best[i].score,best[i].combo,beatmap.fc,best[i].acc,best[i].accdetail,fc_stat.fcguess,undefined,date,'beatmap')
                    top += scoreoverlay
                } else if (checktop > 4) {
                    break
                }
            }
            if (top.length == 0) {
                top += `This user doesn't have any ${getmod.toUpperCase()} top play`
            }
            const embed = new MessageEmbed()
            .setAuthor(`Top osu!${modename} Plays with ${getmod.toUpperCase()} for ${username}`)
            .setThumbnail(pfp_link)
            .setColor(embedcolor)
            .setDescription(top);
            message.channel.send({embed});
        } else if (suffix.suffix.find(s => s.suffix == "-g").position > -1) {
            let gtpp = Number(suffix.suffix.find(s => s.suffix == "-g").value[0])
            if (gtpp < 0) {
                throw 'How you even have negative pp? Are you the reverse farmer or something?'
            }
            let user = await fx.osu.get_osu_profile(name, mode, 0, false, false)
            if (user == null) {
                throw 'User not found!'
            }
            let best = await fx.osu.get_osu_top(name, mode, 100, 'best', true)
            let username = user.username
            for (let i = best.length - 1; i > -1; i--) {
                if (best[i].pp > gtpp) {
                    message.channel.send(`${username} has **${i+1} plays** worth more than **${gtpp}pp**`)
                    break
                }
                if (i < 1) {
                    message.channel.send(`${username} has **0 plays** worth more than **${gtpp}pp**`)
                    break
                }
            }
        } else if (check_type == "Bancho" && suffix.suffix.find(s => s.suffix == "-page").position > -1) {
            let user = await osuApi.getUser({u: name})
            if (user == null) {
                throw 'User not found!'
            }
            pfp_link = pfp_link.replace('{user_id}', user.id)
            let best = await fx.osu.get_osu_top(name, mode, 100, 'best')
            let username = user.name
            let loadpage = async function (page, pages) {
                let gathering = ''
                for (let n = 0; n < 5; n++) {
                    let i = (page - 1) * 5 - 1 + (n+1)
                    if (i <= best.length- 1) {
                        let rank = fx.osu.ranking_letter(best[i].letter)
                        let modandbit = fx.osu.mods_enum(best[i].mod)
                        let shortenmod = modandbit.shortenmod
                        let bitpresent = modandbit.bitpresent
                        let date = fx.osu.time_played(best[i].date)
                        cache_beatmap_ID(message, best[i].beatmapid, mode)
                        let parser = ''
                        if (modenum == 0) {parser = await fx.osu.precalc(best[i].beatmapid)}
                        let fc_stat = await fx.osu.get_pp(a_mode, parser, best[i].beatmapid, bitpresent, best[i].score, best[i].combo, best[i].fc, best[i].count300, best[i].count100, best[i].count50, best[i].countmiss, best[i].countgeki, best[i].countkatu, best[i].acc, best[i].perfect)
                        let scoreoverlay = fx.osu.score_overlay(i+1,best[i].title,best[i].beatmapid,fc_stat.star,shortenmod,best[i].pp,undefined,rank,best[i].diff,best[i].score,best[i].combo,best[i].fc,best[i].acc,best[i].accdetail,fc_stat.fcguess,undefined,date,'beatmap')
                        gathering += scoreoverlay
                    }
                }
                pages[page-1] = gathering
                return pages
            }
            fx.general.page_system(message, {load: loadpage}, `Top osu!${modename} Plays for ${username} (Page {page} of {max_page})`, pfp_link, embedcolor, Math.ceil(best.length / 5), 240000)
        } else if (check_type == "Bancho" && suffix.suffix.find(s => s.suffix == "-s").position > -1) { 
            let map_name = suffix.suffix.find(s => s.suffix == "-s").value[0].replace("_", " ")
            let get = await fx.osu.get_osu_top(name, mode, 100, 'best')
            let user = await osuApi.getUser({u: name})
            if (user == null) {
                throw 'User not found!'
            }
            pfp_link = pfp_link.replace('{user_id}', user.id)
            let username = user.name
            let best = get.filter(function(map) {return map.title.toLowerCase().includes(map_name) || map.creator.toLowerCase().includes(map_name) || map.diff.toLowerCase().includes(map_name) || map.source.toLowerCase().includes(map_name) || map.artist.toLowerCase().includes(map_name)})
            if (best.length == 0) {
                throw 'No search result found!'
            }
            let maplength = best.length > 5 ? 5 : best.length
            for (let i = 0; i < maplength; i++) {
                let rank = fx.osu.ranking_letter(best[i].letter)
                let modandbit = fx.osu.mods_enum(best[i].mod)
                let shortenmod = modandbit.shortenmod
                let bitpresent = modandbit.bitpresent
                let date = fx.osu.time_played(best[i].date)
                cache_beatmap_ID(message, best[i].beatmapid, mode)
                let parser = ''
                if (modenum == 0) {parser = await fx.osu.precalc(best[i].beatmapid)}
                let fc_stat = await fx.osu.get_pp(a_mode, parser, best[i].beatmapid, bitpresent, best[i].score, best[i].combo, best[i].fc, best[i].count300, best[i].count100, best[i].count50, best[i].countmiss, best[i].countgeki, best[i].countkatu, best[i].acc, best[i].perfect)
                let scoreoverlay = fx.osu.score_overlay(best[i].top,best[i].title,best[i].beatmapid,fc_stat.star,shortenmod,best[i].pp,undefined,rank,best[i].diff,best[i].score,best[i].combo,best[i].fc,best[i].acc,best[i].accdetail,fc_stat.fcguess,undefined,date,'beatmap')
                top += scoreoverlay
            }
            const embed = new MessageEmbed()
            .setAuthor(`Top osu!${modename} Plays for ${username} (Searching: ${map_name})`)
            .setThumbnail(pfp_link)
            .setColor(embedcolor)
            .setDescription(top);
            message.channel.send({embed});
        } else if (check_type == "Bancho" && suffix.suffix.find(s => s.suffix == "-a").position > -1) { 
            let best = await fx.osu.get_osu_top(name, mode, 100, 'best')
            best.sort(function (a,b) {
                return b.acc - a.acc
            })
            let user = await osuApi.getUser({u: name})
            if (user == null) {
                throw 'User not found!'
            }
            pfp_link = pfp_link.replace('{user_id}', user.id)
            let username = user.name
            let loadpage = async function (page, pages) {
                let gathering = ''
                for (let n = 0; n < 5; n++) {
                    let i = (page - 1) * 5 - 1 + (n+1)
                    if (i <= best.length- 1) {
                        let rank = fx.osu.ranking_letter(best[i].letter)
                        let modandbit = fx.osu.mods_enum(best[i].mod)
                        let shortenmod = modandbit.shortenmod
                        let bitpresent = modandbit.bitpresent
                        let date = fx.osu.time_played(best[i].date)
                        cache_beatmap_ID(message, best[i].beatmapid, mode)
                        let parser = ''
                        if (modenum == 0) {parser = await fx.osu.precalc(best[i].beatmapid)}
                        let fc_stat = await fx.osu.get_pp(a_mode, parser, best[i].beatmapid, bitpresent, best[i].score, best[i].combo, best[i].fc, best[i].count300, best[i].count100, best[i].count50, best[i].countmiss, best[i].countgeki, best[i].countkatu, best[i].acc, best[i].perfect)
                        let scoreoverlay = fx.osu.score_overlay(best[i].top,best[i].title,best[i].beatmapid,fc_stat.star,shortenmod,best[i].pp,undefined,rank,best[i].diff,best[i].score,best[i].combo,best[i].fc,best[i].acc,best[i].accdetail,fc_stat.fcguess,undefined,date,'beatmap')
                        gathering += scoreoverlay
                    }
                }
                pages[page-1] = gathering
                return pages
            }
            fx.general.page_system(message, {load: loadpage}, `Top osu!${modename} Plays for ${username} (Page {page} of {max_page})`, pfp_link, embedcolor, Math.ceil(best.length / 5), 240000)
        } else {
            let user = await fx.osu.get_osu_profile(name, mode, 0, false, false)
            if (user == null) {
                throw 'User not found!'
            }
            pfp_link = pfp_link.replace('{user_id}', user.id)
            let best = await fx.osu.get_osu_top(name, mode, 5, 'best')
            if (best.length == 0) {
                throw `I think ${name} didn't play anything yet~`
            }
            let username = user.username
            for (let i = 0; i < (best.length > 5 ? 5 : best.length); i++) {
                let rank = fx.osu.ranking_letter(best[i].letter)
                let modandbit = fx.osu.mods_enum(best[i].mod)
                let shortenmod = modandbit.shortenmod
                let bitpresent = modandbit.bitpresent
                let date = fx.osu.time_played(best[i].date)
                cache_beatmap_ID(message, best[i].beatmapid, mode)
                let parser = ''
                if (modenum == 0) {parser = await fx.osu.precalc(best[i].beatmapid)}
                let fc_stat = await fx.osu.get_pp(a_mode, parser, best[i].beatmapid, bitpresent, best[i].score, best[i].combo, best[i].fc, best[i].count300, best[i].count100, best[i].count50, best[i].countmiss, best[i].countgeki, best[i].countkatu, best[i].acc, best[i].perfect)
                let scoreoverlay = fx.osu.score_overlay(i+1,best[i].title,best[i].beatmapid,fc_stat.star,shortenmod,best[i].pp,undefined,rank,best[i].diff,best[i].score,best[i].combo,best[i].fc,best[i].acc,best[i].accdetail,fc_stat.fcguess,undefined,date,'beatmap')
                top += scoreoverlay
            }
            const embed = new MessageEmbed()
            .setAuthor(`Top osu!${modename} Plays for ${username}`)
            .setThumbnail(pfp_link)
            .setColor(embedcolor)
            .setDescription(top);
            message.channel.send({embed});
        }
    } catch (error) {
        message.channel.send(String(error))
    }
}

async function recent(message = new Message()) {
    try {
        let msg = message.content.toLowerCase();
        let refresh = Math.round(Math.random()* 2147483648)
        let command = msg.split(' ')[0]
        let embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)
        if (fx.general.cmd_cooldown.cooldown[message.author.id] !== undefined && fx.general.cmd_cooldown.cooldown[message.author.id].indexOf(command) !== -1) {
            throw 'You need to wait 3 seconds before using this again!'
        }
        fx.general.cmd_cooldown.set(message, command, 3000)
        let suffix = fx.osu.check_suffix(msg, true, [{"suffix": "-b", "v_count": 0},
                                                    {"suffix": "-l", "v_count": 0},
                                                    {"suffix": "-std", "v_count": 0},
                                                    {"suffix": "-taiko", "v_count": 0},
                                                    {"suffix": "-ctb", "v_count": 0},
                                                    {"suffix": "-mania", "v_count": 0},
                                                    {"suffix": "-rx", "v_count": 0},
                                                    {"suffix": "-bancho", "v_count": 0},
                                                    {"suffix": "-ripple", "v_count": 0},
                                                    {"suffix": "-akat", "v_count": 0},
                                                    {"suffix": "-hrz", "v_count": 0},
                                                    {"suffix": "-enjuu", "v_count": 0},
                                                    {"suffix": "-gatari", "v_count": 0},])
        let mode = "Bancho"
        if (suffix.suffix.find(s => s.suffix == "-bancho").position > -1) {
            mode = 'Bancho'
        } else if (suffix.suffix.find(s => s.suffix == "-ripple").position > -1) {
            mode = 'Ripple'
        } else if (suffix.suffix.find(s => s.suffix == "-akat").position > -1) {
            mode = 'Akatsuki'
        } else if (suffix.suffix.find(s => s.suffix == "-hrz").position > -1) {
            mode = 'Horizon'
        } else if (suffix.suffix.find(s => s.suffix == "-enjuu").position > -1) {
            mode = 'Enjuu'
        } else if (suffix.suffix.find(s => s.suffix == "-gatari").position > -1) {
            mode = 'Gatari'
        }
        let osu_mode_check = ["-std", "-taiko", "-ctb", "-mania", "-rx"]
        for (let osu_mode of osu_mode_check) {
            if (suffix.suffix.find(s => s.suffix == osu_mode).position > -1) {
                mode += osu_mode
            }
        }
        if (!mode.includes('-')) {
            mode += '-std'
        }
        // Make recent best get modes later
        let modedetail = fx.osu.get_mode_detail(mode)
        let modenum = modedetail.modenum
        let a_mode = modedetail.a_mode
        let check_type = modedetail.check_type
        let modename = modedetail.modename
        let name = fx.osu.check_player(user_data, message, suffix.check, check_type)
        if (suffix.suffix.find(s => s.suffix == "-b").position > -1) {
            let best = await fx.osu.get_osu_top(name, mode, 100, 'best', true)
            if (best.length == 0) {
                throw `I think ${name} didn't play anything yet`
            }
            let user = await fx.osu.get_osu_profile(name, mode, 0, false, false)
            let username = user.username
            let userid = user.id
            best.sort(function (a,b) {
                a1 = Date.parse(a.date)
                b1 = Date.parse(b.date)
                return b1 - a1
            })
            let beatmap = await fx.osu.get_osu_beatmap(best[0].beatmapid, mode)
            let rank = fx.osu.ranking_letter(best[0].letter)
            let modandbit = fx.osu.mods_enum(best[0].mod)
            let shortenmod = modandbit.shortenmod
            let bitpresent = modandbit.bitpresent
            let date = fx.osu.time_played(best[0].date)
            cache_beatmap_ID(message, best[0].beatmapid, mode)
            let parser = await fx.osu.precalc(best[0].beatmapid)     
            if (modenum == 0) {parser = await fx.osu.precalc(best[0].beatmapid)}
            let fc_stat = await fx.osu.get_pp(a_mode, parser, best[0].beatmapid, bitpresent, best[0].score, best[0].combo, best[0].fc, best[0].count300, best[0].count100, best[0].count50, best[0].countmiss, best[0].countgeki, best[0].countkatu, best[0].acc, best[0].perfect, true)
            let scoreoverlay = fx.osu.score_overlay(undefined,beatmap.title,best[0].beatmapid,fc_stat.star,shortenmod,best[0].pp,undefined,rank,beatmap.diff,best[0].score,best[0].combo,beatmap.fc,best[0].acc,best[0].accdetail,fc_stat.fcguess,undefined,date,'beatmap')
            const embed = new MessageEmbed()
            .setAuthor(`Top ${best[0].top} osu!${modename} play for ${username}:`, `http://s.ppy.sh/a/${userid}.png?date=${refresh}`)
            .setThumbnail(`https://b.ppy.sh/thumb/${beatmap.beatmapsetID}l.jpg`)
            .setColor(embedcolor)
            .setDescription(scoreoverlay);
            message.channel.send({embed})
        } else if (mode == "Bancho-std" && suffix.suffix.find(s => s.suffix == "-l").position > -1) { 
            let top = ''
            let getplayer = await fx.osu.get_osu_profile(name, mode, 0, false, false)
            let recent = await fx.osu.get_osu_top(name, mode, 5, 'recent')
            if (recent.length == 0) {
                throw 'No play found within 24 hours of this user'
            }
            let osuname = getplayer.username
            for (let i in recent) {
                let rank = fx.osu.ranking_letter(recent[i].letter)
                let modandbit = fx.osu.mods_enum(recent[i].mod)
                let shortenmod = modandbit.shortenmod
                let bitpresent = modandbit.bitpresent
                let date = fx.osu.time_played(recent[i].date)
                let nopp = ''
                let mapcompleted = ''
                let parser = ''
                if (modenum == 0) {parser = await fx.osu.precalc(recent[i].beatmapid)}
                let fc_stat = await fx.osu.get_pp(a_mode, parser, recent[i].beatmapid, bitpresent, recent[i].score, recent[i].combo, recent[i].fc, recent[i].count300, recent[i].count100, recent[i].count50, recent[i].countmiss, recent[i].countgeki, recent[i].countkatu, recent[i].acc, recent[i].perfect, true)
                cache_beatmap_ID(message, recent[i].beatmapid, mode)
                if (recent[i].letter == 'F') {
                    nopp = '(No pp)'
                    date = '⬥ ' + date
                    mapcompleted = `**Map Completion:** ${Number(fc_stat.mapcomplete).toFixed(2)}%`
                }
                let scoreoverlay = fx.osu.score_overlay(undefined,recent[i].title,recent[i].beatmapid,fc_stat.star,shortenmod,fc_stat.pp,nopp,rank,recent[i].diff,recent[i].score,recent[i].combo,recent[i].fc,recent[i].acc,recent[i].accdetail,fc_stat.fcguess,mapcompleted,date,'beatmap')
                top += scoreoverlay
            }
            const embed = new MessageEmbed()
            .setAuthor(`Most recent osu! ${modename} play for ${osuname}:`)
            .setThumbnail(`http://s.ppy.sh/a/${recent[0].userid}.png?date=${refresh}`)
            .setColor(embedcolor)
            .setDescription(top);
            message.channel.send({embed})
        } else {
            let getplayer = await fx.osu.get_osu_profile(name, mode, 0, false, false)
            let recent = await fx.osu.get_osu_top(name, mode, 1, 'recent')
            if (recent.length == 0) {
                throw 'No play found within 24 hours of this user'
            }
            let rank = fx.osu.ranking_letter(recent[0].letter)
            let modandbit = fx.osu.mods_enum(recent[0].mod)
            let shortenmod = modandbit.shortenmod
            let bitpresent = modandbit.bitpresent
            let date = fx.osu.time_played(recent[0].date)
            let nopp = ''
            let mapcompleted = ''
            let parser = ''
            if (modenum == 0 ) {parser = await fx.osu.precalc(recent[0].beatmapid)}
            let fc_stat = await fx.osu.get_pp(a_mode, parser, recent[0].beatmapid, bitpresent, recent[0].score, recent[0].combo, recent[0].fc, recent[0].count300, recent[0].count100, recent[0].count50, recent[0].countmiss, recent[0].countgeki, recent[0].countkatu, recent[0].acc, recent[0].perfect, true)
            let osuname = getplayer.username
            cache_beatmap_ID(message, recent[0].beatmapid, mode)
            if (recent[0].letter == 'F') {
                nopp = '(No pp)'
                date = '⬥ ' + date
                mapcompleted = `**Map Completion:** ${Number(fc_stat.mapcomplete).toFixed(2)}%`
            }
            let scoreoverlay = fx.osu.score_overlay(undefined,recent[0].title,recent[0].beatmapid,fc_stat.star,shortenmod,fc_stat.pp,nopp,rank,recent[0].diff,recent[0].score,recent[0].combo,recent[0].fc,recent[0].acc,recent[0].accdetail,fc_stat.fcguess,mapcompleted,date,'beatmap')
            const embed = new MessageEmbed()
            .setAuthor(`Most recent osu! ${modename} play for ${osuname}:`, `http://s.ppy.sh/a/${recent[0].userid}.png?date=${refresh}`)
            .setThumbnail(`https://b.ppy.sh/thumb/${recent[0].beatmapsetID}l.jpg`)
            .setColor(embedcolor)
            .setDescription(scoreoverlay);
            message.channel.send({embed})
        }
    } catch (error) {
        message.channel.send(String(error))
    }
}

async function compare(message = new Message()) {
    try {
        let msg = message.content.toLowerCase();
        let refresh = Math.round(Math.random()* 2147483648)
        let command = msg.split(' ')[0]
        let embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)
        if (fx.general.cmd_cooldown.cooldown[message.author.id] !== undefined && fx.general.cmd_cooldown.cooldown[message.author.id].indexOf(command) !== -1) {
            throw 'You need to wait 3 seconds before using this again!'
        }
        fx.general.cmd_cooldown.set(message, command, 3000)
        let suffix = fx.osu.check_suffix(msg, false, [{"suffix": "-p", "v_count": 1}])
        let mode = ''
        let storedid = 0
        // Loop variable
        let counter = 0
        let get = 1
        let m = stored_map_ID.length - 1
        if (suffix.suffix.find(s => s.suffix == "-p").position > -1) {
            if (Number(suffix.suffix.find(s => s.suffix == "-p").value[0]) < 1) {
                throw "Please type a number larger than 1"
            } else {
                get = Number(suffix.suffix.find(s => s.suffix == "-p").value[0])
            }
        }
        do {
            if (m > -1) {
                if (message.guild !== null) {
                    if (stored_map_ID[m].server !== undefined) {
                        if (message.channel.id == stored_map_ID[m].server) {
                            storedid = stored_map_ID[m].id
                            mode = stored_map_ID[m].mode
                            counter += 1
                        }
                    }
                } else {
                    if (stored_map_ID[m].user !== undefined) {
                        if (message.author.id == stored_map_ID[m].user) {
                            storedid = stored_map_ID[m].id
                            mode = stored_map_ID[m].mode
                            counter += 1
                        }
                    }
                }
                m -= 1
            } else {
                throw "No beatmap found this far back!"
            }
        } while (counter < get)
        let modedetail = fx.osu.get_mode_detail(mode)
        let modename = modedetail.modename
        let check_type = modedetail.check_type
        let modenum = modedetail.modenum
        let a_mode = modedetail.a_mode
        let name = fx.osu.check_player(user_data, message, suffix.check, check_type)
        let scores = await fx.osu.get_osu_scores(name, mode, storedid)
        scores.sort(function (a,b) {
            a1 = Number(a.pp)
            b1 = Number(b.pp)
            return b1 - a1
        })
        if (scores.length == 0) {
            throw `${name} didn't play this map! (${mode})`
        }
        let beatmap = await fx.osu.get_osu_beatmap(storedid, mode)
        let parser = ''
        if (modenum == 0) {parser = await fx.osu.precalc(storedid)}
        let loadpage = async function (page, pages) {
            let gathering = ''
            for (let n = 0; n < 5; n++) {
                let i = (page - 1) * 5 - 1 + (n+1)
                if (i <= scores.length- 1) {
                    let rank = fx.osu.ranking_letter(scores[i].letter)
                    let modandbit = fx.osu.mods_enum(scores[i].mod)
                    let shortenmod = modandbit.shortenmod
                    let bitpresent = modandbit.bitpresent
                    let date = fx.osu.time_played(scores[i].date)
                    let unrankedpp = ''
                    if (modenum == 0) {
                        if (beatmap.approvalStatus !== "Ranked" && beatmap.approvalStatus !== "Approved") {
                            let comparepp = fx.osu.osu_pp_calc(parser,bitpresent,scores[i].combo,scores[i].count100,scores[i].count50,scores[i].countmiss,scores[i].acc,'acc')
                            unrankedpp = `(Loved: ${Number(comparepp.pp.total).toFixed(2)}pp)`
                        }
                    }
                    let fc_stat = await fx.osu.get_pp(a_mode, parser, beatmap.beatmapid, bitpresent, scores[i].score, scores[i].combo, beatmap.fc, scores[i].count300, scores[i].count100, scores[i].count50, scores[i].countmiss, scores[i].countgeki, scores[i].countkatu, scores[i].acc, scores[i].perfect)
                    gathering += `
${i+1}. **${shortenmod}** Score (${fc_stat.star}★) | ***${scores[i].pp.toFixed(2)}pp*** ${unrankedpp}
${rank} **Score:** ${scores[i].score} | **Combo:** ${scores[i].combo}/${beatmap.fc}
**Accuracy:** ${scores[i].acc.toFixed(2)}% ${scores[i].accdetail} ${fc_stat.fcguess}
${date}
`         
                }
            }
            pages[page-1] = gathering
            return pages
        }
        fx.general.page_system(message, {load: loadpage}, `Top osu!${modename} Plays for ${scores[0].username} on ${beatmap.title} [${beatmap.diff}] (Page {page} of {max_page})`, `https://b.ppy.sh/thumb/${beatmap.beatmapsetID}l.jpg`, embedcolor, Math.ceil(scores.length / 5))
    } catch (error) {
        message.channel.send(String(error))
    }
}

async function score(message = new Message()) {
    try {
        let msg = message.content.toLowerCase();
        let refresh = Math.round(Math.random()* 2147483648)
        let command = msg.split(' ')[0]
        let embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)
        if (fx.general.cmd_cooldown.cooldown[message.author.id] !== undefined && fx.general.cmd_cooldown.cooldown[message.author.id].indexOf(command) !== -1) {
            throw 'You need to wait 3 seconds before using this again!'
        }
        fx.general.cmd_cooldown.set(message, command, 3000)
        let beatmapid = 0
        let mode = 'Bancho-'
        let link = msg.split(' ').find(l => l.includes("https://osu.ppy.sh/"))
        link = link.toString().replace(',', '')
        if (link.startsWith("https://osu.ppy.sh/b/")) {
            let args = link.split("/")
            beatmapid = args[4].split('?')[0]
            let osu_mode = ["std", "taiko", "ctb", "mania"]
            if (link.includes("?m=")) {
                mode += osu_mode[args[4].split('?')[1].substr(2)]
            } else {
                mode += 'std'
            }
        } else if (link.startsWith("https://osu.ppy.sh/beatmapsets/")) {
            let args = link.split("/")
            if (args.length == 5) {
                throw "Sorry the bot doesn't support beatmapset displaying yet"
            }
            args = link.split("#")[1].split('/')
            beatmapid = args[1]
            let osu_mode = {"osu": "std", "taiko": "taiko", "fruits": "ctb", "mania": "mania"}
            mode += osu_mode[args[0]]
            console.log(args[0], mode)
        }
        let suffix = fx.osu.check_suffix(msg, false, [{"suffix": link, "v_count": 0}])
        console.log(suffix.check)
        let modedetail = fx.osu.get_mode_detail(mode)
        let modename = modedetail.modename
        let modenum = modedetail.modenum
        let a_mode = modedetail.a_mode
        let name = fx.osu.check_player(user_data, message, suffix.check, 'Bancho')
        let scores = await fx.osu.get_osu_scores(name, modenum, beatmapid)
        scores.sort(function (a,b) {
            a1 = Number(a.pp)
            b1 = Number(b.pp)
            return b1 - a1
        })
        if (scores.length == 0) {
            throw `${name} didn't play this map!`
        }
        let beatmap = await fx.osu.get_osu_beatmap(beatmapid, mode)
        let parser = ''
        if (modenum == 0) {parser = await fx.osu.precalc(beatmap.beatmapid)}
        cache_beatmap_ID(message, beatmap.beatmapid, mode)
        let loadpage = async function (page, pages) {
            let gathering = ''
            for (let n = 0; n < 5; n++) {
                let i = (page - 1) * 5 - 1 + (n+1)
                if (i <= scores.length- 1) {
                    let rank = fx.osu.ranking_letter(scores[i].letter)
                    let modandbit = fx.osu.mods_enum(scores[i].mod)
                    let shortenmod = modandbit.shortenmod
                    let bitpresent = modandbit.bitpresent
                    let date = fx.osu.time_played(scores[i].date)
                    let unrankedpp = undefined
                    if (beatmap.approvalStatus !== "Ranked" && beatmap.approvalStatus !== "Approved") {
                        let comparepp = await fx.osu.get_pp(a_mode, parser, scores[i].beatmapid, bitpresent, scores[i].score, scores[i].combo, scores[i].fc, scores[i].count300, scores[i].count100, scores[i].count50, scores[i].countmiss, scores[i].countgeki, scores[i].countkatu, scores[i].acc, scores[i].perfect, true)
                        unrankedpp = `(❤: ${Number(comparepp.pp).toFixed(2)}pp)`
                    }
                    let fc_stat = await fx.osu.get_pp(a_mode, parser, beatmap.beatmapid, bitpresent, scores[i].score, scores[i].combo, scores[i].fc, scores[i].count300, scores[i].count100, scores[i].count50, scores[i].countmiss, scores[i].countgeki, scores[i].countkatu, scores[i].acc, scores[i].perfect)
                    gathering += fx.osu.score_overlay(i+1,shortenmod,beatmap.beatmapid,fc_stat.star,'',scores[i].pp,unrankedpp,rank,beatmap.diff,scores[i].score,scores[i].combo,beatmap.fc,scores[i].acc,scores[i].accdetail,fc_stat.fcguess,undefined,date,'none')
                }
            }
            pages[page-1] = gathering
            return pages
        }
        fx.general.page_system(message, {load: loadpage}, `Top osu!${modename} Plays for ${scores[0].username} on ${beatmap.title} [${beatmap.diff}] (Page {page} of {max_page})`, `https://b.ppy.sh/thumb/${beatmap.beatmapsetID}l.jpg`, embedcolor, Math.ceil(scores.length / 5))
    } catch (error) {
        message.channel.send(String(error))
    }
}

async function osuset(message = new Message(), type) {
    try {
        let msg = message.content.toLowerCase();
        let refresh = Math.round(Math.random()* 2147483648)
        let embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)
        let suffix = fx.osu.check_suffix(msg, false, [{"suffix": undefined, "v_count": 0}])
        let user = ''
        let name = ''
        let settype = ''
        let profilelink = ''
        let imagelink = ''
        if (type == 'Osu') {
            user = await osuApi.getUser({u: suffix.check})
            settype = 'osuname'
            name = user.name
            profilelink = `https://osu.ppy.sh/users/${user.id}`
            imagelink = `http://s.ppy.sh/a/${user.id}.png?date=${refresh}`
        } else if (type == 'Akatsuki') {
            user = await fx.osu.rippleAPI.apiCall(`/v1/users`, 'Akatsuki-std', {name: suffix.check})
            settype = 'akatsukiname'
            name = user.username
            profilelink = `https://akatsuki.pw/u/${user.id}`
            imagelink = `http://a.akatsuki.pw/${user.id}?date=${refresh}`
        } else if (type == 'Ripple') {
            user = await fx.osu.rippleAPI.apiCall(`/v1/users`, 'Ripple-std', {name: suffix.check})
            settype = 'ripplename'
            name = user.username
            profilelink = `https://ripple.moe/u/${user.id}`
            imagelink = `http://a.ripple.moe/${user.id}?date=${refresh}`
        } else if (type == 'Horizon') {
            user = await fx.osu.rippleAPI.apiCall(`/v1/users`, 'Horizon-std', {name: suffix.check})
            settype = 'horizonname'
            name = user.username
            profilelink = `https://lemres.de/u/${user.id}`
            imagelink = `http://a.lemres.de/${user.id}?date=${refresh}`
        } else if (type == 'Enjuu') {
            user = await fx.osu.rippleAPI.apiCall(`/v1/users`, 'Enjuu-std', {name: suffix.check})
            settype = 'enjuuname'
            name = user.username
            profilelink = `https://enjuu.click/u/${user.id}`
            imagelink = `http://a.enjuu.click/${user.id}?date=${refresh}`
        } else if (type == 'Gatari') {
            let options = {u: suffix.check, mode: 0}
            const i_resp = await request.get('https://api.gatari.pw/users/get').query(options);
            let user_info = (i_resp.body).users[0];
            settype = 'gatariname'
            name = user_info.username
            profilelink = `https://gatari.pw/u/${user_info.id}`
            imagelink = `http://a.gatari.pw/${user_info.id}?date=${refresh}`
        } 
        if (name == undefined) {
            throw 'User not found!'
        } else {
            if (user_data[message.author.id] !== undefined && user_data[message.author.id][settype] !== undefined) {
                user_data[message.author.id][settype] = name
            } else if (user_data[message.author.id] !== undefined && user_data[message.author.id][settype] == undefined) {
                user_data[message.author.id][settype] = name
            } else {
                user_data[message.author.id] = {}
                user_data[message.author.id][settype] = name
            }
            const embed = new MessageEmbed()
            .setAuthor(`Your account has been linked to ${type} username: ${name}`,'', profilelink)
            .setColor(embedcolor)
            .setImage(imagelink);
            message.channel.send({embed})
            if (!config.config.debug.disable_db_save) db.user_data.findAndModify({query: {}, update: user_data}, function(){})
        }
    } catch (error) {
        message.channel.send(String(error))
    }
}

async function map(message = new Message()){
    try {
        let msg = message.content.toLowerCase();
        let command = msg.split(' ')[0]
        let embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)
        if (fx.general.cmd_cooldown.cooldown[message.author.id] !== undefined && fx.general.cmd_cooldown.cooldown[message.author.id].indexOf(command) !== -1) {
            throw 'You need to wait 5 seconds before using this again!'
        }
        fx.general.cmd_cooldown.set(message, command, 5000)
        let beatmapid = 0
        let mods = ''
        let suffix = fx.osu.check_suffix(msg, false, [{"suffix": "-l", "v_count": 0}])
        mods = suffix.check
        if (mods == '') {
            mods = 'NM'
        }
        let bitpresent = fx.osu.mods_enum(mods).bitpresent
        let mode = ''
        for (let i = stored_map_ID.length -1 ; i > -1; i--) {
            if (message.guild !== null) {
                if (stored_map_ID[i].server !== undefined) {
                    if (message.channel.id == stored_map_ID[i].server) {
                        beatmapid = stored_map_ID[i].id
                        mode = stored_map_ID[i].mode
                        break;
                    }
                }
            } else {
                if (stored_map_ID[i].user !== undefined) {
                    if (message.author.id == stored_map_ID[i].user) {
                        beatmapid = stored_map_ID[i].id
                        mode = stored_map_ID[i].mode
                        break;
                    }
                }
            }
        }
        let modedetail = fx.osu.get_mode_detail(mode)
        let modename = modedetail.modename
        let modenum = modedetail.modenum
        let a_mode = modedetail.a_mode
        if (suffix.suffix.find(s => s.suffix == "-l").position > -1) {
            let scores = await fx.osu.get_osu_scores(undefined, mode, beatmapid, 50)
            let beatmap = await fx.osu.get_osu_beatmap(beatmapid, mode)
            if (modenum == 0) {parser = await fx.osu.precalc(beatmap.beatmapid)}
            let loadpage = async function (page, pages) {
                let gathering = ''
                for (let n = 0; n < 5; n++) {
                    let i = (page - 1) * 5 - 1 + (n+1)
                    if (i <= scores.length- 1) {
                        let rank = fx.osu.ranking_letter(scores[i].letter)
                        let modandbit = fx.osu.mods_enum(scores[i].mod)
                        let shortenmod = modandbit.shortenmod
                        let bitpresent = modandbit.bitpresent
                        let date = fx.osu.time_played(scores[i].date)
                        let unrankedpp = undefined
                        if (beatmap.approvalStatus !== "Ranked" && beatmap.approvalStatus !== "Approved") {
                            let comparepp = await fx.osu.get_pp(a_mode, parser, scores[i].beatmapid, bitpresent, scores[i].score, scores[i].combo, scores[i].fc, scores[i].count300, scores[i].count100, scores[i].count50, scores[i].countmiss, scores[i].countgeki, scores[i].countkatu, scores[i].acc, scores[i].perfect, true)
                            unrankedpp = `(❤: ${Number(comparepp.pp).toFixed(2)}pp)`
                        }
                        let fc_stat = await fx.osu.get_pp(a_mode, parser, beatmap.beatmapid, bitpresent, scores[i].score, scores[i].combo, scores[i].fc, scores[i].count300, scores[i].count100, scores[i].count50, scores[i].countmiss, scores[i].countgeki, scores[i].countkatu, scores[i].acc, scores[i].perfect)
                        let scoreoverlay = fx.osu.score_overlay(i+1,scores[i].username,scores[i].userid,fc_stat.star,shortenmod,scores[i].pp,unrankedpp,rank,beatmap.diff,scores[i].score,scores[i].combo,beatmap.fc,scores[i].acc,scores[i].accdetail,fc_stat.fcguess,undefined,date,'profile')
                        gathering += scoreoverlay
                    }
                }
                pages[page-1] = gathering
                return pages
            }
            fx.general.page_system(message, {load: loadpage}, `Top osu!${modename} Plays for ${beatmap.title} (Page {page} of {max_page})`, `https://b.ppy.sh/thumb/${beatmap.beatmapsetID}l.jpg`, embedcolor, Math.ceil(scores.length / 5), 240000)
        } else {
            let map = await fx.osu.get_osu_beatmap(beatmapid, mode)
            let map_embed = await fx.osu.map_detail_overlay(map, beatmapid, modenum, bitpresent, mods)
            cache_beatmap_ID(message, beatmapid, mode)
            const embed = new MessageEmbed()
            .setAuthor(`${map.title} by ${map.creator}`,'',`https://osu.ppy.sh/b/${beatmapid}?m=${mode}`)
            .setThumbnail(`https://b.ppy.sh/thumb/${map.beatmapsetID}l.jpg`)
            .setColor(embedcolor)
            .setDescription(map_embed)
            .setFooter(`${map.approvalStatus} ◆ ❤: ${map.favorite}`);
            message.channel.send({embed});
        }
    } catch (error) {
        message.channel.send(String(error))
    }
}

async function beatmapfiledetail(message = new Message()) {
    try {
        let msg = message.content.toLowerCase();
        let embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)
        let file = message.attachments.first().url
        let parser = new calc.parser()
        let fmap = (await request.get(file)).text
        parser.feed(fmap)
        let map = parser.map
        let mode = map.mode
        let maxCombo = map.max_combo()
        // Mods
        let mods = ''
        let modintext = msg.split(' ')
        if (modintext[0] == undefined) {
            mods = 'NM'
        } else {
            mods = modintext[0]
        }
        let bitpresent = fx.osu.mods_enum(mods).bitpresent
        let diffdetail = ''
        let mapdetail = ''
        let ppdetail = ''
        let star, bpm
        if (mode == 0) {
            let acc95 = fx.osu.osu_pp_calc(parser,bitpresent,maxCombo,0,0,0,95,'acc')
            let acc97 = fx.osu.osu_pp_calc(parser,bitpresent,maxCombo,0,0,0,97,'acc')
            let acc99 = fx.osu.osu_pp_calc(parser,bitpresent,maxCombo,0,0,0,99,'acc')
            let acc100 = fx.osu.osu_pp_calc(parser,bitpresent,maxCombo,0,0,0,100,'acc')
            let detail = fx.osu.beatmap_detail(mods[i],0,0,acc100.bpm,acc100.cs, acc100.ar,acc100.od,acc100.hp)
            star = Number(acc100.star.total).toFixed(2)
            bpm = Number(detail.bpm).toFixed(0)
            let ar = Number(detail.ar).toFixed(2)
            let od = Number(detail.od).toFixed(2)
            let hp = Number(detail.hp).toFixed(2)
            let cs = Number(detail.cs).toFixed(2)
            diffdetail = `(Aim: ${Number(acc100.star.aim).toFixed(2) * 2}★, Speed: ${Number(acc100.star.speed).toFixed(2) * 2}★)`
            mapdetail = `**AR:** ${ar} / **OD:** ${od} / **HP:** ${hp} / **CS:** ${cs}`
            ppdetail = `**95%**-${Number(acc95.pp.total).toFixed(2)}pp | **97%**-${Number(acc97.pp.total).toFixed(2)}pp | **99%**-${Number(acc99.pp.total).toFixed(2)}pp | **100%**-${Number(acc100.pp.total).toFixed(2)}pp`
        }
        const embed = new MessageEmbed()
        .setAuthor(`${map.title} by ${map.creator}`)
        .setColor(embedcolor)
        .setDescription(`
**BPM:** ${bpm} **Mods:** ${mods[i].toUpperCase()}
<:difficultyIcon:507522545759682561> __${map.version}__  
**Difficulty:** ${star}★ ${diffdetail}
**Max Combo:** ${maxCombo}
${mapdetail}
**PP:** ${ppdetail}`);
    message.channel.send({embed});
    } catch (error) {
        message.channel.send(String(error))
    }
}

async function beatmaplinkdetail(message = new Message(), bot_prefix) {
    try {
        let msg = message.content.toLowerCase();
        let embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)
        let option = msg.split(" ")
        if (option[0].substring(0, bot_prefix.length) == bot_prefix) return;
        let beatmapid = []
        let mods = 'nm'
        let mode = 'Bancho-'
        let link = msg
        if (link.startsWith("https://osu.ppy.sh/b/")) {
            let args = link.split("/")
            beatmapid.push(args[4].split(" ")[0].split('?')[0])
            let osu_mode = ["std", "taiko", "ctb", "mania"]
            if (link.includes("?m=")) {
                mode += osu_mode[args[4].split(" ")[0].split('?')[1].substr(2)]
            } else {
                mode += 'std'
            }
            if (args[4].includes("+")) {
                mods = args[4].split("+")[1]
            }
        } else if (link.startsWith("https://osu.ppy.sh/beatmapsets/")) {
            let args = link.split("/")
            if (args.length == 5) {
                throw "Sorry the bot doesn't support beatmapset displaying yet"
            }
            args = link.split("#")[1].split('/')
            beatmapid.push(args[1].split(" ")[0])
            let osu_mode = {"osu": "std", "taiko": "taiko", "fruits": "ctb", "mania": "mania"}
            mode += osu_mode[args[0]]
            console.log(args[0], mode)
            if (args[1].includes("+")) {
                mods = args[1].split("+")[1]
            }
        }
        for (i = 0; i < beatmapid.length; i++) {
            let bitpresent = fx.osu.mods_enum(mods).bitpresent
            let map = await fx.osu.get_osu_beatmap(beatmapid[i], mode)
            if (map.length == 0) {
                throw 'Is this even a valid link?'
            }
            let modedetail = fx.osu.get_mode_detail(mode)
            let modenum = modedetail.modenum
            let map_embed = await fx.osu.map_detail_overlay(map, beatmapid, modenum, bitpresent, mods)
            cache_beatmap_ID(message, beatmapid, mode)
            const embed = new MessageEmbed()
            .setAuthor(`${map.title} by ${map.creator}`,'',`https://osu.ppy.sh/b/${beatmapid[i]}?m=${mode}`)
            .setThumbnail(`https://b.ppy.sh/thumb/${map.beatmapsetID}l.jpg`)
            .setColor(embedcolor)
            .setDescription(map_embed)
            .setFooter(`${map.approvalStatus} ◆ ❤: ${map.favorite}`);
            message.channel.send({embed});
        }
    } catch (error) {
        message.channel.send(String(error))
    }
}

async function topleaderboard(message = new Message(), type) {
    try {
        let msg = message.content.toLowerCase();
        let command = msg.split(' ')[0]
        let embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)
        if (fx.general.cmd_cooldown.cooldown[message.author.id] !== undefined && fx.general.cmd_cooldown.cooldown[message.author.id].indexOf(command) !== -1) {
            throw 'You need to wait 30 seconds before using this again! (HTML scrapping reason)'
        }
        fx.general.cmd_cooldown.set(message, command, 30000)
        let link = ''
        let mode = 'osu'
        let countryname = ''
        //
        let suffix = fx.osu.check_suffix(msg, true, [{"suffix": "-std", "v_count": 0},
                                                    {"suffix": "-taiko", "v_count": 0},
                                                    {"suffix": "-ctb", "v_count": 0},
                                                    {"suffix": "-mania", "v_count": 0}])
        if (type == 'country') {
            countryname = suffix.check
        }
        if (suffix.suffix.find(s => s.suffix == "-taiko").position > -1) {
            mode = 'taiko'
        } else if (suffix.suffix.find(s => s.suffix == "-ctb").position > -1) {
            mode = 'fruits'
        } else if (suffix.suffix.find(s => s.suffix == "-mania").position > -1) {
            mode = 'mania'
        }
        if (type == 'global') {
            link = `https://osu.ppy.sh/rankings/${mode}/performance?page=1`
        } else if (type == 'country') {
            link = `https://osu.ppy.sh/rankings/${mode}/performance?country=${countryname.toUpperCase()}&page=1`
        }
        let web = (await request(link)).text
        let leaderboard = await cheerio.load(web)
        let table = leaderboard('table[class="ranking-page-table"]').children('tbody').children()
        let country = ''
        if (type == 'country') {
            country = leaderboard('div[class="ranking-country-filter__item"]').text().trim()
        }
        let loadpage = function (page, pages) {
            let gathering = ''
            for (let n = 0; n < 10; n++) {
                let i = (page - 1) * 10 - 1 + (n+1)
                if (i <= table.length- 1) {
                    let player = leaderboard(table[i]).children('td').children('div[class=ranking-page-table__user-link]').children().text().replace(/\s+/g," ").substring(1)
                    let flag  = leaderboard(table[i]).children('td').children('div[class=ranking-page-table__user-link]').children().first().attr('href')
                    let pp = leaderboard(table[i]).children('td[class="ranking-page-table__column ranking-page-table__column--focused"]').text().replace(/\s+/g," ").substring(1)
                    let acc = leaderboard(table[i]).children('td[class="ranking-page-table__column ranking-page-table__column--dimmed"]').first().text().replace(/\s+/g," ").substring(1)
                    let topnumber = `**${i+1}:**`
                    let playertext = `**${player}**`
                    let flagicon = `:flag_${flag.substring(flag.length-2, flag.length).toLowerCase()}:`
                    let acctext = `Acc: ${acc}`
                    let pptext = `**PP: ${pp}**`
                    gathering += `${topnumber} ${flagicon} ${playertext} | ${acctext} | ${pptext}\n`
                }
            }
            pages[page-1] = gathering
            return pages
        }
        if (type == 'global') {
            title = `Global leaderboard for osu!${mode} (Page {page} of {max_page})`
        } else if (type == 'country') {
            title = `${country} country leaderboard for osu!${mode} (Page {page} of {max_page})`
        }
        fx.general.page_system(message, {load: loadpage}, title, 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Osu%21Logo_%282015%29.svg/220px-Osu%21Logo_%282015%29.svg.png', embedcolor, Math.ceil(table.length / 10), 180000)
    } catch (error) {
        message.channel.send(String(error))
    }
}

async function serverleaderboard(message = new Message()) {
    try {
        let msg = message.content.toLowerCase();
        let command = msg.split(' ')[0]
        let embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)
        if (fx.general.cmd_cooldown.cooldown[message.author.id] !== undefined && fx.general.cmd_cooldown.cooldown[message.author.id].indexOf(command) !== -1) {
            throw 'You need to wait 3 seconds before using this again!'
        }
        fx.general.cmd_cooldown.set(message, command, 3000)
        let player = []
        let members = message.guild.members.cache.array()
        for (let i = 0; i < members.length; i++) {
            let user = members[i]
            if (user_data[user.id]) {
                if (user_data[user.id].osurank !== undefined) {
                    player.push({username: user.user.username, osuname: user_data[user.id].osuname, rank: user_data[user.id].osurank, country: user_data[user.id].osucountry})
                }
            }
        }
        player.sort(function(a,b){
            return a.rank - b.rank
        })
        let loadpage = function (page, pages) {
            let gathering = ''
            for (let n = 0; n < 10; n++) {
                let top = (page - 1) * 10 - 1 + (n+1)
                if (top <= player.length - 1) {
                    gathering += `${top+1}. :flag_${player[top].country}: **${player[top].osuname}** (${player[top].username}) | **Rank:** ${player[top].rank}\n`
                }
            }
            pages[page-1] = gathering
            return pages
        }
        fx.general.page_system(message, {load: loadpage}, `Server leaderboard for ${message.guild.name} (Page {page} of {max_page})`, message.guild.iconURL(), embedcolor, Math.ceil(player.length / 10), 15000 * Math.ceil(player.length / 10))
    } catch (error) {
        message.channel.send(String(error))
    }
}

function acccalc(message = new Message()) {
    let msg = message.content.toLowerCase();
    let option = msg.split(" ")
    let count300 = Number(option[1])
    let count100 = Number(option[2])
    let count50 = Number(option[3])
    let countmiss = Number(option[4])
    let acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
    message.channel.send(`**Accuracy:** ${acc}%`)

}

module.exports = {
    get_db,
    ping,
    osuavatar,
    osu,
    osu_card,
    osutop,
    recent,
    compare,
    score,
    osuset,
    map,
    beatmapfiledetail,
    beatmaplinkdetail,
    topleaderboard,
    serverleaderboard,
    acccalc,
    cache_beatmap_ID
}
