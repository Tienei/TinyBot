var user_data = {}
var osu_track = []
var stored_map_ID = []
var saved_map_id = []
var easter_egg = {}
var custom_command = {}
var server_data = {}

require('dotenv').config();
const Discord = require('discord.js');
const nodeosu = require('node-osu');
const jimp = require('jimp')
const config = require('./config.js');
// Get Functions
const fx = require('./Functions/load_fx')
// Get Commands
const cmds = require('./Commands/load_cmd')
const clients = require('./client')
const bot = clients.bot
const osu_client = clients.osu_client
// Database
const mongojs = require('mongojs')
const db = mongojs(process.env.DB_URL, ["user_data","osu_track","easter_egg","custom_command","server_data", "saved_map_id"])

var osuApi = new nodeosu.Api(process.env.OSU_KEY, {
    notFoundAsError: false,
    completeScores: true
});

var osuApi_no_bm = new nodeosu.Api(process.env.OSU_KEY, {
    notFoundAsError: false,
    completeScores: false
});

var ee = JSON.parse(process.env.EASTER_EGG)
var ee_number = 0

var loading = 2
var refresh = 0

osu_client.connect().then(() => {
    console.log("osu! client is ready")
    loading -= 1
})

/*

Added other modes r -b

*/

bot.on("ready", (ready) => {
    console.log("Discord client is ready")
    async function getFile() {
        try {
            // Get User data
            user_data = await new Promise(resolve => {
                db.user_data.find((err, docs) => resolve(docs[0]));
            });

            // Get track data
            osu_track = await new Promise(resolve => {
                db.osu_track.find((err, docs) => resolve(docs[0]['0']));
            });

            // Get easter egg data
            easter_egg = await new Promise(resolve => {
                db.easter_egg.find((err, docs) => resolve(docs[0]));
            });
            for (var i = 0 ; i < Object.keys(ee).length; i++) {
                ee_number += '0'
            }

            // Get custom commands data
            custom_command = await new Promise(resolve => {
                db.custom_command.find((err, docs) => resolve(docs[0]));
            });

            // Get server data
            server_data = await new Promise(resolve => {
                db.server_data.find((err, docs) => resolve(docs[0]));
            });

            // Get cached map id
            saved_map_id = await new Promise(resolve => {
                db.saved_map_id.find((err, docs) => resolve(docs[0]['0']));
            });
            stored_map_ID = saved_map_id
            cmds.osu.get_db(user_data, stored_map_ID, saved_map_id, db)

            loading -= 1
        } catch(error) {
            loading = 0
        }
    }
    getFile()
    
    // Server count
    function server_count() {
        bot.channels.get("572093442042232842").setName(`Server Count: ${bot.guilds.size}`)
    }
    setInterval(server_count, 10000)

    // osutrack
    async function real_time_osu_track() {
        console.log('osutrack: Checking')
        for (let player of osu_track) {
            let modes = []
            for (let channel of player.trackonchannel) {
                for (let mode of channel.modes) {
                    if (!modes.includes(mode)) modes.push(mode)
                }
            }
            for (let m of modes) {
                let mode = m.mode
                let limit = m.limit
                let player_mode_detail = player.modedetail.find(m => m.mode == mode) 
                let best = await fx.osu.get_osu_top(player.name, mode, limit, 'best', true)
                best = best.filter(b => new Date(b.date).getTime() > new Date(player.recenttimeplay).getTime())
                for (var i = 0; i < best.length; i++) {
                    console.log('Found')
                    let mode_detail = fx.osu.get_mode_detail(mode)
                    var user = await fx.osu.get_osu_profile(player.name, mode, 0, false)
                    var beatmap = await fx.osu.get_osu_beatmap(best[i].beatmapid)
                    var rank = fx.osu.ranking_letter(best[i].letter)
                    var modandbit = fx.osu.mods_enum(best[i].mod, 'text')
                    var shortenmod = modandbit.shortenmod
                    var bitpresent = modandbit.bitpresent
                    var pp = best[i].pp
                    var ppgain = (Number(user.pp).toFixed(2) - Number(player_mode_detail.lasttotalpp)).toFixed(2)
                    let parser = ''
                    if (mode == 0 || mode == 4 || mode == 8 || mode == 12 || mode == 13 || mode == 17) {parser = await fx.osu.precalc(best[0].beatmapid)}
                    let fc_stat = await fx.osu.get_pp(mode, parser, best[0].beatmapid, bitpresent, best[0].score, best[0].combo, best[0].fc, best[0].count300, best[0].count100, best[0].count50, best[0].countmiss, best[0].countgeki, best[0].countkatu, best[0].acc, best[0].perfect, true)
                    var star = fc_stat.star
                    let fcguess = ''
                    if (best[i].letter == 'F') {
                        pp = 'No PP'
                    }
                    if (best[i].perfect == 0) {
                        fcguess = fc_stat.fcguess
                    }
                    let embed = new Discord.RichEmbed()
                    .setAuthor(`New #${best[i].top} for ${user.username} in osu!${mode_detail.modename}:`, `http://s.ppy.sh/a/${best[i].userid}.png?date=${refresh}`)
                    .setThumbnail(`https://b.ppy.sh/thumb/${beatmap.beatmapsetID}l.jpg`)
                    .setDescription(`
**[${beatmap.title}](https://osu.ppy.sh/b/${beatmap.beatmapid})** (${star}★) ${shortenmod} | **${pp}pp** (+${ppgain}pp)
${rank} *${beatmap.diff}* | **Scores:** ${best[i].score} | **Combo:** ${best[i].combo}/${beatmap.fc}
**Accuracy:** ${Number(best[i].acc).toFixed(2)}% ${best[i].accdetail} ${fcguess}
**#${player_mode_detail.lastrank} → #${user.rank} (:flag_${user.country}: : #${player_mode_detail.lastcountryrank} → #${user.countryrank})** | Total PP: **${user.pp}**`)
                    for (let channel of player.trackonchannel) {
                        for (mode1 of channel.modes) {
                            if (mode1.mode == mode) {
                                stored_map_ID.push({id:beatmap.beatmapid,server: channel.id, mode: mode_detail.check_type})
                                embed.setColor(bot.channels.get(channel.id).guild.me.displayColor)
                                bot.channels.get(channel.id).send({embed})
                            }
                        }
                    }
                    player_mode_detail.lasttotalpp = user.pp
                    player_mode_detail.lastrank = user.rank
                    player_mode_detail.lastcountryrank = user.countryrank
                    player.recenttimeplay = best[i].date
                    if (i == best.length - 1) {
                        db.osu_track.findAndModify({query: {}, update: {'0': osu_track}}, function(){})
                    }
                }  
            }
        }
    }
    if (config.config.debug.osutrack == false) {
        setInterval(real_time_osu_track, 90000)
    }
});

bot.on("guildMemberAdd", (member) => {
    async function welcome_message() {
        if (member.guild.id == "450576647976910869") {
            var imageholder = await jimp.read('./image/welcomebanner.png')
            var avatar = await jimp.read(member.user.avatarURL)
            var placeholder = await new jimp(563, 125)
            avatar.resize(105,105)
            placeholder.composite(avatar, 214, 10)
            placeholder.composite(imageholder,0,0)
            var text = await jimp.loadFont('./font/anjelika_36_white.fnt')
            placeholder.print(text, 347, 10, member.user.username + ',')
            placeholder.write('./welcome.png')
            bot.channels.get("487479898903150612").send(`<@${member.id}>`, {files: ['./welcome.png']})
        }
    }
   welcome_message()
})

bot.on("message", (message) => {
    if (config.config.debug.command == true && message.author.id !== "292523841811513348") {
        return;
    }
    if (message.author.bot == false && loading == 0) {
        var msg = message.content.toLowerCase();
        refresh = Math.round(Math.random()* 2147483648)
        var command = msg.split(' ')[0]
        var embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)

        var bot_prefix = config.config.bot_default_prefix

        if (message.guild !== null) {
            if (server_data[message.guild.id] !== undefined) {
                bot_prefix = server_data[message.guild.id].prefix
            }
        }
        config.update_bot_prefix(bot_prefix)

        // General related

        if (command == bot_prefix + 'help') {
            cmds.general.help(message, bot_prefix)
        }
        if (command == bot_prefix + 'credit') {
            cmds.general.credit(message)
        }
        if (command == bot_prefix + 'avatar') {
            cmds.general.avatar(message)
        }
        if (command == bot_prefix + 'changelog') {
            cmds.general.changelog(message)
        }
        if (command == bot_prefix + 'bot') {
            cmds.general.bot_info(message)
        }
        if (command == bot_prefix + 'ping') {
            cmds.osu.ping(message, command)
        }
        if (command == bot_prefix + 'prefix' && message.guild !== null) {
            let data = cmds.general.prefix(message, server_data)
            if (data !== null) {
                server_data = data 
                db.server_data.findAndModify({query: {}, update: server_data}, function(){});
            }
        }
        if (command == bot_prefix + 'report' && message.guild !== null) {
            cmds.general.report(message)
        }

        if (command == bot_prefix + 'suggestion' && message.guild !== null) {
            cmds.general.suggestion(message)
        }

        if (msg.includes(`<@${bot.user.id}>`) == true || msg.includes(`<@!${bot.user.id}>`) == true) {
            var respone =  [`Yes? ${message.author.username} <:chinohappy:450684046129758208>`,
                            `Why you keep pinging me?`,
                            `Stop pinging me! <:chinoangry:450686707881213972>`,
                            `What do you need senpai? <:chinohappy:450684046129758208>`,
                            `<:chinopinged:450680698613792783>`,
                            `Hewwo ${message.author.username}! <:chinohappy:450684046129758208>`,
                            `Me is sleepy Zzz.........`,
                            `Where is my senpai? :c`,
                            `Me is busy working for ${bot.guilds.size} servers right now`,
                            `Poked you! :3`,
                            `Me don't know what me is doing right now qwq`,
                            `Me love my senpai`,
                            `Please don't bully my senpai!`]
            var roll = Math.floor(Math.random()*respone.length)
            message.channel.send(respone[roll])
        }

        if (command == bot_prefix + 'checkcomp' && message.guild !== null) {
            cmds.general.checkcomp(message)
        }

        // Custom commands

        if (command == bot_prefix + 'customcmd' && message.guild !== null) {
            let data = cmds.custom_cmd.custom_cmd(message, custom_command)
            if (data !== null) {
                custom_command = data
                db.custom_command.findAndModify({query: {}, update: custom_command}, function(){})
            }
        }

        if (message.guild !== null) {
            if (custom_command[message.guild.id] !== undefined && custom_command[message.guild.id].find(cmd => cmd.cmd == command) !== undefined) {
                cmds.custom_cmd.cmd_detection(message, custom_command)
            }
        }   

        // Easter Egg

        if (command == bot_prefix + 'ee') {
            if (easter_egg[message.author.id] !== undefined) {
                var number = easter_egg[message.author.id]
                message.channel.send(`You have found: **${number.match(/1/g).length} easter egg(s)**`)
            } else {
                message.channel.send("You haven't found any!")
            }
        }

        if (ee[msg] !== undefined) {
            easter_egg = cmds.easter_egg.easter_detection(message, easter_egg)
            db.easter_egg.findAndModify({query: {}, update: easter_egg}, function(){})
        }

        // Fun related

        if (command == bot_prefix + 'hug') {
            cmds.fun.tenor(message, 5, 'anime hug', 'you got a hug from', 'Sorry to see you alone...')
        }
        if (command == bot_prefix + 'cuddle') {
            cmds.fun.tenor(message, 8, 'anime cuddle', 'you got a cuddle from', 'Sorry to see you alone...')
        }
        if (command == bot_prefix + 'slap') {
            cmds.fun.tenor(message, 6, 'anime slap', 'you got a slap from', 'Are you trying to slap yourself?')
        }
        if (command == bot_prefix + 'kiss') {
            cmds.fun.tenor(message, 6, 'anime kiss', 'you got a kiss from', 'Are you trying to kiss yourself?')
        }
        if (command == bot_prefix + 'pat') {
            cmds.fun.tenor(message, 5, 'anime pat', 'you got a pat from', 'Pat pat')
        }
        if (command == bot_prefix + 'poke') {
            cmds.fun.tenor(message, 6, 'anime poke', 'you got a poke from', 'Poking yourself huh? Heh')
        }
        if (command == bot_prefix + 'cry') {
            cmds.fun.tenor(message, 5, 'anime cry', undefined, 'Awww why are you crying :(')
        }
        if (command == bot_prefix + 'blush') {
            cmds.fun.tenor(message, 7, 'anime blush', undefined, `<@${message.author.id}> w-why are u blushing`)
        }
        if (command == bot_prefix + 'pout') {
            cmds.fun.tenor(message, 6, 'anime pout', 'you got a pout from', `Poutu Poutu`)
        }
        if (command == bot_prefix + 'trivia') {
            cmds.fun.trivia(message)
        }

        /* Supported:   
        
        Osu (General): calcpp, osuavatar, osuset, acc
        Osu (Standard): osu, recent, compare, osutop, osusig, map, osutrack, scores, topglobal, topcountry
        Osu (Taiko): taiko, compare, taikotop, scores, topglobal, topcountry
        Osu (CTB): ctb, compare, ctbtop, scores, topglobal, topcountry
        Osu (Mania): mania, compare, maniatop, scores, topglobal, topcountry
        Ripple: ripple, rippler, rippletop (-p), rippleset, rippleavatar
        Akatsuki (Standard): akatsuki, akatr, akattop (-p), akatsukiset, akatavatar
        Akatsuki (Relax): rxakatsuki, rxakatr, rxakattop (-p), akatsukiset, akatavatar, calcrxpp
        */

        async function osutrack() {
            try {
                if (message.member.hasPermission("MANAGE_CHANNELS") == false) {
                    throw 'You need to have `Manage Channels` permission to set osutrack'
                }
                let suffix = fx.osu.check_suffix(msg, true, [{"suffix": "-std", "v_count": 0},
                                                            {"suffix": "-taiko", "v_count": 0},
                                                            {"suffix": "-ctb", "v_count": 0},
                                                            {"suffix": "-mania", "v_count": 0},
                                                            {"suffix": "-ripple", "v_count": 0},
                                                            {"suffix": "-akat", "v_count": 0},
                                                            {"suffix": "-rxakat", "v_count": 0},
                                                            {"suffix": "-hrz", "v_count": 0},
                                                            {"suffix": "-rxhrz", "v_count": 0},
                                                            {"suffix": "-p", "v_count": 1}])
                let mode = 0 
                let limit = 50
                if (suffix.suffix.find(s => s.suffix == "-p").position > -1) {
                    limit = suffix.suffix.find(s => s.suffix == "-p").value[0]
                }
                if (suffix.suffix.find(s => s.suffix == "-taiko").position > -1) {
                    mode = 1
                } else if (suffix.suffix.find(s => s.suffix == "-ctb").position > -1) {
                    mode = 2
                } else if (suffix.suffix.find(s => s.suffix == "-mania").position > -1) {
                    mode = 3
                } else if (suffix.suffix.find(s => s.suffix == "-ripple").position > -1) {
                    mode = 4
                } else if (suffix.suffix.find(s => s.suffix == "-akat").position > -1) {
                    mode = 8
                } else if (suffix.suffix.find(s => s.suffix == "-rxakat").position > -1) {
                    mode = 12
                } else if (suffix.suffix.find(s => s.suffix == "-hrz").position > -1) {
                    mode = 13
                } else if (suffix.suffix.find(s => s.suffix == "-rxhrz").position > -1) {
                    mode = 17
                }
                let type = fx.osu.get_mode_detail(mode).check_type
                var user = await fx.osu.get_osu_profile(suffix.check, mode, 0, false)
                var name = user.username
                if (name == undefined) {
                    throw 'Please enter a valid osu username! >:c'
                }
                let player = osu_track.find(pl => pl.name.toLowerCase() == name.toLowerCase() && pl.type == type)
                if (player) {
                    if (player.trackonchannel.find(channel => channel.id == message.channel.id)) {
                        if (player.trackonchannel.find(channel => channel.id == message.channel.id).modes.find(m => m.mode == mode)) {
                            player.trackonchannel.find(channel => channel.id == message.channel.id).modes.find(m => m.mode == mode).limit = limit
                        } else {
                            player.trackonchannel.find(channel => channel.id == message.channel.id).modes.push({mode: mode, limit: limit})
                        }
                    } else {
                        player.trackonchannel.push({id: message.channel.id, modes: [{mode: mode, limit: limit}]})
                    }
                    player.name = name
                    let modedetail = player.modedetail.find(m => m.mode == mode)
                    if (modedetail) {
                        modedetail.lasttotalpp = user.pp
                        modedetail.lastrank = user.rank
                        modedetail.lastcountryrank = user.countryrank
                    } else {
                        player.modedetail.push({
                            "mode": mode,
                            "lasttotalpp":user.pp,
                            "lastrank":user.rank,
                            "lastcountryrank":user.countryrank,
                        })
                    }
                } else {
                    osu_track.push({"name": name,
                                    "type": type,
                                    "modedetail": [{    
                                        "mode": mode,
                                        "lasttotalpp":user.pp,
                                        "lastrank":user.rank,
                                        "lastcountryrank":user.countryrank,
                                    }],
                                    "trackonchannel": [{id: message.channel.id, modes: [{mode: mode, limit: limit}]}],
                                    "recenttimeplay": new Date().getTime()})
                }
                message.channel.send(`**${user.username}** is now being tracked on **#${message.channel.name}**`)
                db.osu_track.findAndModify({query: {}, update: {'0': osu_track}}, function(){})
            } catch(error) {
                message.channel.send(String(error))
            }
        }

        async function untrack() {
            try {
                if (message.member.hasPermission("MANAGE_CHANNELS") == false) {
                    throw 'You need to have `Manage Channels` permission to untrack'
                }
                let suffix = fx.osu.check_suffix(msg, false, [{"suffix": "-bc", "v_count": 0},
                                                            {"suffix": "-akat", "v_count": 0},
                                                            {"suffix": "-rp", "v_count": 0},
                                                            {"suffix": "-hrz", "v_count": 0},])
                let type = 'All'
                let mode = 0
                if (suffix.suffix.find(s => s.suffix == "-bc").position > -1) {
                   type = 'Bancho'
                } else if (suffix.suffix.find(s => s.suffix == "-akat").position > -1) {
                    type = 'Akatsuki'
                    mode = 8
                } else if (suffix.suffix.find(s => s.suffix == "-rp").position > -1) {
                    type = 'Ripple'
                    mode = 4
                } else if (suffix.suffix.find(s => s.suffix == "-hrz").position > -1) {
                    type = 'Horizon'
                    mode = 13
                }
                var user = await fx.osu.get_osu_profile(suffix.check, mode, 0, false)
                var name = user.username
                if (name == undefined) {
                    throw 'Please enter a valid osu username! >:c'
                }
                let player = []
                if (type == 'All') {
                    for (let pl of osu_track) {
                        if (pl.name.toLowerCase() == name.toLowerCase()) player.push(pl)
                    }
                } else {
                    player.push(osu_track.find(pl => pl.name.toLowerCase() == name.toLowerCase() && pl.type == type))
                }
                if (player.length > 0) {
                    for (let track of player) {
                        if (track.trackonchannel.find(channel => channel.id == message.channel.id) && track.trackonchannel.length > 1) {
                            osu_track.find(pl => pl.name.toLowerCase() == track.name.toLowerCase()).trackonchannel.splice(track.trackonchannel.findIndex(channel => channel.id == message.channel.id), 1)
                            db.osu_track.findAndModify({query: {}, update: {'0': osu_track}}, function(){})
                        } else {
                            osu_track.splice(osu_track.findIndex(pl => pl.name.toLowerCase() == track.name.toLowerCase()),1)
                            if (Object.keys(osu_track).length < 1) {
                                osu_track['a'] = 'a'
                            }
                            db.osu_track.findAndModify({query: {}, update: {'0': osu_track}}, function(){})
                        }
                    }
                    message.channel.send(`**${name}** (${type}) has been removed from #${message.channel.name}`)
                } else {
                    throw `**${name}** (${type}) not found in the tracking database`
                }
            } catch (error) {
                message.channel.send(String(error))
            }
        }
        
        async function osutracklist() {
            var currentlytrack = ''
            for (var i = 0; i < osu_track.length; i++) {
                let channel = osu_track[i].trackonchannel.find(channel => channel.id == message.channel.id)
                if (channel) {
                    let modes = ''
                    for (mode of channel.modes) {
                        modes += `${fx.osu.get_mode_detail(mode.mode).modename} (p: ${mode.limit}), `
                    }
                    if (modes !== '') modes = modes.substring(0,modes.length-2)
                    currentlytrack += osu_track[i].name + `: \`\`mode:${modes}\`\`, ` 
                }
            }
            if (currentlytrack !== '') currentlytrack = currentlytrack.substring(0,currentlytrack.length-2)
            const embed = new Discord.RichEmbed()
            .setAuthor(`Player(s) currently being tracked on #${message.channel.name}`)
            .setColor(embedcolor)
            .setDescription(currentlytrack)
            message.channel.send(embed)
        }

        // Osu
        if (command == bot_prefix + 'osu') {
            cmds.osu.osu(message, 0)
        }
        if (command == bot_prefix + 'taiko') {
            cmds.osu.osu(message, 1)
        }
        if (command == bot_prefix + 'ctb') {
            cmds.osu.osu(message, 2)
        }
        if (command == bot_prefix + 'mania') {
            cmds.osu.osu(message, 3)
        }
        if (command == bot_prefix + 'osucard') {
            cmds.osu.osu_card(message, 0)
        }
        if (command == bot_prefix + 'taikocard') {
            cmds.osu.osu_card(message, 1)
        }
        if (command == bot_prefix + 'ctbcard') {
            cmds.osu.osu_card(message, 2)
        }
        if (command == bot_prefix + 'maniacard') {
            cmds.osu.osu_card(message, 3)
        }
        if (command == bot_prefix + 'osuavatar') {
            cmds.osu.osuavatar(message, 0)
        }
        if (command == bot_prefix + 'topglobal') {
            cmds.osu.topleaderboard(message, 'global')
        }
        if (command == bot_prefix + 'topcountry') {
            cmds.osu.topleaderboard(message, 'country')
        }
        if (command == bot_prefix + 'lb' || command == bot_prefix + 'leaderboard') {
            cmds.osu.serverleaderboard(message)
        }
        if (command == bot_prefix + 'recent' || command == bot_prefix + 'r') {
            cmds.osu.recent(message)
        }
        if (command == bot_prefix + 'compare' || command == bot_prefix + 'c') {
            cmds.osu.compare(message)
        }
        if (command == bot_prefix + 'osutop') {
            cmds.osu.osutop(message, 0)
        }
        if (command == bot_prefix + 'taikotop') {
            cmds.osu.osutop(message, 1)
        }
        if (command == bot_prefix + 'ctbtop') {
            cmds.osu.osutop(message, 2)
        }
        if (command == bot_prefix + 'maniatop') {
            cmds.osu.osutop(message, 3)
        }
        if (command == bot_prefix + 'map' || command == bot_prefix + 'm') {
            cmds.osu.map(message)
        }
        if (command == bot_prefix + 'scores') {
            cmds.osu.score(message)
        }
        if (command == bot_prefix + 'osuset') {
            cmds.osu.osuset(message, 'Osu')
        }
        if (command == bot_prefix + 'acc') {
            cmds.osu.acccalc(message)
        }
        if (command == bot_prefix + 'osutrack') {
            osutrack()            
        }
        if (command == bot_prefix + 'osutracklist') {
            osutracklist()            
        }
        if (command == bot_prefix + 'untrack') {
            untrack()
        }

        // Akatuski

        if (command == bot_prefix + 'akatsuki') {
            cmds.osu.osu(message, 8)
        }
        if (command == bot_prefix + 'akatavatar') {
            cmds.osu.osuavatar(message, 8)
        }
        if (command == bot_prefix + 'akattop') {
            cmds.osu.osutop(message, 8)
        }
        if (command == bot_prefix + 'akatsukiset') {
            cmds.osu.osuset(message, 'Akatsuki')
        }
        if (command == bot_prefix + 'rxakatsuki') {
            cmds.osu.osu(message, 12)
        }
        if (command == bot_prefix + 'rxakattop') {
            cmds.osu.osutop(message, 12)
        }

        // Ripple

        if (command == bot_prefix + 'ripple') {
            cmds.osu.osu(message, 4)
        }
        if (command == bot_prefix + 'rippleavatar') {
            cmds.osu.osuavatar(message, 4)
        }
        if (command == bot_prefix + 'rippletop') {
            cmds.osu.osutop(message, 4)
        }
        if (command == bot_prefix + 'rippleset') {
            cmds.osu.osuset(message, 'Ripple')
        }

        // Horizon

        if (command == bot_prefix + 'horizon') {
            cmds.osu.osu(message, 13)
        }
        if (command == bot_prefix + 'horizonavatar') {
            cmds.osu.osuavatar(message, 13)
        }
        if (command == bot_prefix + 'horizontop') {
            cmds.osu.osutop(message, 13)
        }
        if (command == bot_prefix + 'horizonset') {
            cmds.osu.osuset(message, 'Horizon')
        }
        if (command == bot_prefix + 'rxhorizon') {
            cmds.osu.osu(message, 17)
        }
        if (command == bot_prefix + 'rxhorizontop') {
            cmds.osu.osutop(message, 17)
        }

        // Detection
        // Beatmap Detection
        if (msg.includes("https://osu.ppy.sh/beatmapsets/") || msg.includes("https://osu.ppy.sh/b/")) {
            cmds.osu.beatmaplinkdetail(message)
        }
        // .osu Detection
        if (message.attachments.array().length > 0) {
            var file = message.attachments.first()
            if (file.filename.substring(file.filename.length - 4, file.filename.length) == ".osu") {
                cmds.osu.beatmapfiledetail(message)           
            }
        }
        // Bot Owner commands

        if (message.author.id == "292523841811513348") {
            if (command == bot_prefix + 'announce') {
                try {
                    let guilds = bot.guilds.array()
                    let msg_send = message.content.substring(9)
                    for (var i in guilds) {
                        let channels = guilds[i].channels.array().reverse()
                        let osu_filter = (c) => c.name.toLowerCase().substring(0,3) == 'osu' && c.guild.me.permissionsIn(c).has(['VIEW_CHANNEL', 'SEND_MESSAGES']) && c.type == 'text'
                        let bot_cmd_filter = (c) => c.name.toLowerCase().substring(0,3) == 'bot' && c.guild.me.permissionsIn(c).has(['VIEW_CHANNEL', 'SEND_MESSAGES']) && c.type == 'text'
                        let channel_to_send = undefined
                        channel_to_send = channels.find(osu_filter)
                        if (channel_to_send == undefined) channel_to_send = channels.find(bot_cmd_filter)
                        if (channel_to_send !== undefined) {
                            channel_to_send.send(msg_send)
                        }
                    }
                } catch (error) {
                    message.channel.send(String(error))
                }
            }
            if (command == bot_prefix + 'respond') {
                async function respond() {
                    var channelid = msg.split(" ")[1]
                    var msg_send = message.content.substring(msg.indexOf(channelid) + channelid.length)
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`${message.author.username} responded`, message.author.avatarURL)
                    .setColor(embedcolor)
                    .setDescription(msg_send)
                    bot.channels.get(channelid).send({embed})
                    var msg1 = await message.channel.send('Message has been sent')
                    setTimeout(function(){ msg1.delete(); }, 3000);
                }
                respond()
            }
            if (command == bot_prefix + 'say') {
                var option = msg.split(" ")
                var msg_quote = message.content.split('"')
                if (option[1] == 'text') {
                    message.channel.send(msg_quote[1])
                    message.delete(0)
                } else if (option[1] == 'embed') {
                    const embed = new Discord.RichEmbed()
                    .setAuthor(msg_quote[1], bot.user.avatarURL)
                    .setColor(embedcolor)
                    .setDescription(msg_quote[3])
                    message.channel.send({embed})
                    message.delete(0)
                }
            }
        }
    }
})
