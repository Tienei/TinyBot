const mongojs = require('mongojs')
const db = mongojs(process.env.DB_URL, ["osu_track"], {tls: true})
const config = require('./config')
const fx = require("./Functions/fx_handler")

let osu_track = [
    {
      name: 'Tienei',
      type: 'Bancho',
      modedetail: [ {
        mode: 'Bancho-std',
        lasttotalpp: '4439.86',
        lastrank: 42069,
        lastcountryrank: 727
      }, {
        mode: 'Bancho-ctb',
        lasttotalpp: '798.72',
        lastrank: 42069,
        lastcountryrank: 727
      }],
      trackonchannel: [
        { id: '710425144346279936', modes: [ {limit: 50, mode: 'Bancho-std'} ] }
      ],
      recenttimeplay: '2020-09-04T05:24:21+00:00',
      online: false,
      offlineTry: 0
    }
  ];
let track_time;
let interval;

process.on("message", 
/**
* Process message structure
* @param {Object} message
* @param {String} message.send_type
* @param {String} message.cmd
* @param {Object} message.value
* @param {Object} message.return_value
*/
(message) => {
    if (message.cmd.startsWith('add')) {
        try {
            let {channel_id, mode, limit, check_type, user} = message.value
            let player = osu_track.find(pl => pl.name.toLowerCase() == user.username.toLowerCase() && pl.type.toLowerCase() == check_type)
            if (player) {
                if (player.trackonchannel.find(channel => channel.id == channel_id)) {
                    if (player.trackonchannel.find(channel => channel.id == channel_id).modes.find(m => m.mode == mode)) {
                        player.trackonchannel.find(channel => channel.id == channel_id).modes.find(m => m.mode == mode).limit = limit
                    } else {
                        player.trackonchannel.find(channel => channel.id == channel_id).modes.push({mode: mode, limit: limit})
                    }
                } else {
                    player.trackonchannel.push({id: channel_id, modes: [{mode: mode, limit: limit}]})
                }
                player.name = user.username
                let modedetail = player.modedetail.find(m => m.mode == mode)
                if (modedetail) {
                    modedetail.lasttotalpp = user.pp
                    modedetail.lastrank = user.global_rank
                    modedetail.lastcountryrank = user.country_rank
                } else {
                    player.modedetail.push({
                        "mode": mode,
                        "lasttotalpp":user.pp,
                        "lastrank": user.global_rank,
                        "lastcountryrank": user.country_rank,
                    })
                }
            } else {
                osu_track.push({"name": user.username,
                                "type": check_type,
                                "modedetail": [{    
                                    "mode": mode,
                                    "lasttotalpp":user.pp,
                                    "lastrank":user.rank,
                                    "lastcountryrank":user.countryrank,
                                }],
                                "trackonchannel": [{id: channel_id, modes: [{mode: mode, limit: limit}]}],
                                "recenttimeplay": new Date().getTime()})
            }
            //
            process.send({...message, send_type: 'database', value: {added: true, proc_id: message.value.proc_id}})
        } catch (err) {
            process.send({...message, send_type: 'database', value: {added: false, proc_id: message.value.proc_id, error: err.stack.toString()}})
        }
    } else if (message.cmd.startsWith('remove')) {
        try {
            let {channel_id, suffix, check_type, name} = message.value
            let player = []
            if (suffix["-all"]) {
                for (let pl of osu_track) {
                    if (pl.name.toLowerCase() == name.toLowerCase()) player.push(pl)
                }
            } else {
                let find_plr = osu_track.find(pl => pl.name.toLowerCase() == name.toLowerCase() && pl.type.toLowerCase() == check_type)
                if (find_plr) player.push(find_plr)
            }
            if (player.length > 0) {
                for (let track of player) {
                    if (track.trackonchannel.length > 1) {
                        if (track.trackonchannel.find(channel => channel.id == channel_id)) {
                            osu_track.find(pl => pl.name.toLowerCase() == track.name.toLowerCase() && pl.type.toLowerCase() == check_type)
                            .trackonchannel.splice(track.trackonchannel.findIndex(channel => channel.id == channel_id), 1);
                            if (!config.config.debug.disable_db_save) db.osu_track.findAndModify({query: {}, update: {'0': osu_track}}, function(){})
                            process.send({...message, send_type: 'database', value: {removed: true, proc_id: message.value.proc_id}})
                        } else {
                            process.send({...message, send_type: 'database', value: {removed: false, proc_id: message.value.proc_id, error: 'not found'}})
                        }
                    } else {
                        osu_track.splice(osu_track.findIndex(pl => pl.name.toLowerCase() == track.name.toLowerCase()),1)
                        if (Object.keys(osu_track).length < 1) {
                            osu_track['a'] = 'a'
                        }
                        if (!config.config.debug.disable_db_save) db.osu_track.findAndModify({query: {}, update: {'0': osu_track}}, function(){})
                        process.send({...message, send_type: 'database', value: {removed: true, proc_id: message.value.proc_id}})
                    }
                }
            } else {
                process.send({...message, send_type: 'database', value: {removed: false, proc_id: message.value.proc_id, error: 'not found'}})
            }
        } catch (err) {
            process.send({...message, send_type: 'database', value: {removed: false, proc_id: message.value.proc_id, error: err.stack.toString()}})
        }
    } else if (message.cmd.startsWith('list')) {
        let {channel_id} = message.value
        let players = []
        for (let i = 0; i < osu_track.length; i++) {
            let channel = osu_track[i].trackonchannel.find(channel => channel.id == channel_id)
            if (channel) {
                let modes = ''
                for (mode of channel.modes) {
                    modes += `${fx.osu.get_mode_detail({mode: mode.mode}).modename} (p: ${mode.limit}), `
                }
                if (modes !== '') modes = modes.substring(0,modes.length-2)
                let view = osu_track[i].name + `: \`\`mode:${modes}\`\`\n` 
                players.push(view)
            }
        }
        if (players.length > 0) {
            process.send({...message, send_type: 'database', value: {players: players, proc_id: message.value.proc_id}})
        } else {
            process.send({...message, send_type: 'database', value: {players: null, proc_id: message.value.proc_id, error: 'no player'}})
        }
    }
})

async function real_time_osu_track() {
    console.log('osutrack: Checking')
    track_time = osu_track.length*0.214*1000
    for (let player of osu_track) {
        try {
            let modes = []
            for (let channel of player.trackonchannel) {
                for (let mode of channel.modes) {
                    // temp fix
                    mode.mode = mode.mode.toLowerCase()
                    for (let mode_detail of player.modedetail) {
                        mode_detail.mode = mode_detail.mode.toLowerCase();
                    }
                    //
                    if (mode.limit > 100) {
                        mode.limit = 100
                        if (!config.config.debug.disable_db_save) db.osu_track.findAndModify({query: {}, update: {'0': osu_track}}, function(){})
                    }
                    if (mode.limit < 1) {
                        mode.limit = 1
                        if (!config.config.debug.disable_db_save) db.osu_track.findAndModify({query: {}, update: {'0': osu_track}}, function(){})
                    }
                    if (String(mode.limit).search(/^\d+$/) < 0) {
                        mode.limit = 50
                        if (!config.config.debug.disable_db_save) db.osu_track.findAndModify({query: {}, update: {'0': osu_track}}, function(){})
                    }
                    if (modes.find(m => m.mode == mode.mode) == undefined) {
                        modes.push({"mode": mode.mode, "limit": mode.limit})
                    } else {
                        if (mode.limit > modes.find(m => m.mode == mode.mode).limit) {
                            modes.find(m => m.mode == mode.mode).limit = mode.limit
                        }
                    }
                }
            }
            for (let m of modes) {
                let mode = m.mode
                let limit = m.limit
                let player_mode_detail = player.modedetail.find(m => m.mode == mode)
                let {modename, check_type, modenum, a_mode} = fx.osu.get_mode_detail({mode: mode})
                let best = await fx.osu.api.get_top({name: player.name, mode: mode, limit: limit, type: 'best', no_bm: true})
                best = best.filter(b => new Date(b.date).getTime() > new Date(player.recenttimeplay).getTime())
                best.sort(function(a,b) {return new Date(a.date).getTime()-new Date(b.date).getTime()})
                if (best.length > 0) {
                    player.recenttimeplay = best[best.length-1].date
                    if (!config.config.debug.disable_db_save) db.osu_track.findAndModify({query: {}, update: {'0': osu_track}}, function(){})
                }
                for (let i = 0; i < best.length; i++) {
                    let refresh = Math.round(Math.random()* 2147483648)
                    console.log('Found')
                    let user = await fx.osu.api.get_profile({name: player.name, mode: mode, event: 0, ver: 1})
                    console.log(best[i].beatmap_id, mode)
                    let beatmap = await (await fx.osu.api.get_beatmap({beatmap_id: best[i].beatmap_id, mode: mode}))[0]
                    let pp = best[i].pp
                    let ppgain = (Number(user.pp).toFixed(2) - Number(player_mode_detail.lasttotalpp)).toFixed(2)
                    let parser = ''
                    if (modenum == 0) {parser = await fx.osu.precalc({beatmap_id: best[i].beatmap_id})}
                    let {fcguess, star} = await fx.osu.get_calc_pp({...best[i], parser: parser, mode: mode, lang: 'en'})
                    if (best[i].letter == 'F') {
                        pp = 'No PP'
                    }
                    best[i].addBeatmapInfo({...beatmap, mode: mode, mod_num: best[i].mod_num})
                    let desc = fx.osu.ui.score({...best[i], star: star, fcguess: fcguess, type: 'top', top: -1, a_mode: a_mode})
                    desc = desc.substring(0, desc.length-1)
                    desc += `**#${player_mode_detail.lastrank} → #${user.global_rank} (:flag_${user.country_code}: : #${player_mode_detail.lastcountryrank} → #${user.country_rank})** | Total PP: **${user.pp}**`
                    for (let channel of player.trackonchannel) {
                        for (mode1 of channel.modes) {
                            if (mode1.mode == mode && mode1.limit >= best[i].top) {
                                process.send({send_type: 'all', cmd: 'realtime_osutrack', 
                                value: {
                                    beatmap_id: best[i].beatmap_id,
                                    mode: mode,
                                    channel_id: channel.id,
                                    author_title: `New #${best[i].top} for ${user.username} in osu!${modename}:`,
                                    author_image: `http://s.ppy.sh/a/${best[i].user_id}.png?date=${refresh}`,
                                    thumbnail: `https://b.ppy.sh/thumb/${beatmap.beatmapset_id}l.jpg`,
                                    desc: desc
                                }})
                            }
                        }
                    }
                    player.name = user.username
                    player_mode_detail.lasttotalpp = user.pp
                    player_mode_detail.lastrank = user.global_rank
                    player_mode_detail.lastcountryrank = user.country_rank
                    if (i == best.length - 1) {
                        if (!config.config.debug.disable_db_save) db.osu_track.findAndModify({query: {}, update: {'0': osu_track}}, function(){})
                    }
                }  
            }
        } catch (error) {
            console.log(error.stack)
        }
    }
}

function startTracking() {
    real_time_osu_track()
    clearInterval(interval)
    interval = setInterval(startTracking, track_time)
}

async function load_db() {
    osu_track = await new Promise(resolve => {
        db.osu_track.find((err, docs) => resolve(docs[0]['0']));
    });
    console.log('osu_track done')
    track_time = osu_track.length*0.214*1000
    if (!config.config.debug.disable_osutrack) {
        startTracking()
    }
}

load_db()
