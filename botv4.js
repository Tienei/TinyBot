let user_data = {}
let osu_track = []
let stored_map_ID = []
let saved_map_id = []
let easter_egg = {}
let custom_command = {}
let server_data = {}

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

let osuApi = new nodeosu.Api(process.env.OSU_KEY, {
    notFoundAsError: false,
    completeScores: true
});

let osuApi_no_bm = new nodeosu.Api(process.env.OSU_KEY, {
    notFoundAsError: false,
    completeScores: false
});

let ee = JSON.parse(process.env.EASTER_EGG)
let ee_number = 0

let loading = 2
let refresh = 0

console.log(!config.config.debug.disable_db_save ? `
-----------------------------------------[WARNING]-----------------------------------------
                                        !!!!!!!!!!!
   IF YOU'RE TESTING THE BOT THEN SET THIS TO TRUE OR ELSE THE DATABASE CAN BE OVERWRITED
                                        !!!!!!!!!!!
-------------------------------------------------------------------------------------------` 
: `Disable database save is currently true`)

osu_client.connect().then(() => {
    console.log("osu! client is ready")
    loading -= 1
})

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
            for (let i = 0 ; i < Object.keys(ee).length; i++) {
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
    const server_count = async () => bot.channels.cache.get("572093442042232842").setName(`Server Count: ${bot.guilds.cache.size}`)
    setInterval(server_count, 10000)

    // osutrack
    async function real_time_osu_track() {
        console.log('osutrack: Checking')
        for (let player of osu_track) {
            try {
                let modes = []
                for (let channel of player.trackonchannel) {
                    if (bot.channels.cache.get(channel.id) == undefined) {
                        if (player.trackonchannel.length > 1) {
                            player.trackonchannel.splice(player.trackonchannel.findIndex(c => c.id == channel.id), 1)
                            if (!config.config.debug.disable_db_save) db.osu_track.findAndModify({query: {}, update: {'0': osu_track}}, function(){})
                        } else {
                            osu_track.splice(osu_track.findIndex(p => p.name == player.name && p.type == player.type), 1)
                            if (!config.config.debug.disable_db_save) db.osu_track.findAndModify({query: {}, update: {'0': osu_track}}, function(){})
                        }
                    } else {
                        for (let mode of channel.modes) {
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
                }
                for (let m of modes) {
                    let mode = m.mode
                    let limit = m.limit
                    let player_mode_detail = player.modedetail.find(m => m.mode == mode)
                    let modedetail = fx.osu.get_mode_detail(mode)
                    let modename = modedetail.modename
                    let check_type = modedetail.check_type
                    let modenum = modedetail.modenum
                    let a_mode = modedetail.a_mode
                    let best = await fx.osu.get_osu_top(player.name, mode, limit, 'best', true)
                    best = best.filter(b => new Date(b.date).getTime() > new Date(player.recenttimeplay).getTime())
                    for (let i = 0; i < best.length; i++) {
                        console.log('Found')
                        let user = await fx.osu.get_osu_profile(player.name, mode, 0, false, false)
                        console.log(best[i].beatmapid, mode)
                        let beatmap = await fx.osu.get_osu_beatmap(best[i].beatmapid, mode)
                        let rank = fx.osu.ranking_letter(best[i].letter)
                        let modandbit = fx.osu.mods_enum(best[i].mod, 'text')
                        let shortenmod = modandbit.shortenmod
                        let bitpresent = modandbit.bitpresent
                        let pp = best[i].pp
                        let ppgain = (Number(user.pp).toFixed(2) - Number(player_mode_detail.lasttotalpp)).toFixed(2)
                        let parser = ''
                        if (modenum == 0) {parser = await fx.osu.precalc(best[0].beatmapid)}
                        let fc_stat = await fx.osu.get_pp(a_mode, parser, best[0].beatmapid, bitpresent, best[0].score, best[0].combo, best[0].fc, best[0].count300, best[0].count100, best[0].count50, best[0].countmiss, best[0].countgeki, best[0].countkatu, best[0].acc, best[0].perfect, true)
                        let star = fc_stat.star
                        let fcguess = ''
                        if (best[i].letter == 'F') {
                            pp = 'No PP'
                        }
                        if (best[i].perfect == 0) {
                            fcguess = fc_stat.fcguess
                        }
                        let embed = new Discord.MessageEmbed()
                        .setAuthor(`New #${best[i].top} for ${user.username} in osu!${modename}:`, `http://s.ppy.sh/a/${best[i].userid}.png?date=${refresh}`)
                        .setThumbnail(`https://b.ppy.sh/thumb/${beatmap.beatmapsetID}l.jpg`)
                        .setDescription(`
**[${beatmap.title}](https://osu.ppy.sh/b/${beatmap.beatmapid})** (${star}★) ${shortenmod} | **${pp}pp** (+${ppgain}pp)
${rank} *${beatmap.diff}* | **Scores:** ${best[i].score} | **Combo:** ${best[i].combo}/${beatmap.fc}
**Accuracy:** ${Number(best[i].acc).toFixed(2)}% ${best[i].accdetail} ${fcguess}
**#${player_mode_detail.lastrank} → #${user.rank} (:flag_${user.country}: : #${player_mode_detail.lastcountryrank} → #${user.countryrank})** | Total PP: **${user.pp}**`);
                        for (let channel of player.trackonchannel) {
                            for (mode1 of channel.modes) {
                                if (mode1.mode == mode && mode1.limit >= best[i].top) {
                                    stored_map_ID.push({id:beatmap.beatmapid,server: channel.id, mode: check_type})
                                    embed.setColor(bot.channels.cache.get(channel.id).guild.me.displayColor)
                                    bot.channels.cache.get(channel.id).send({embed})
                                }
                            }
                        }
                        player_mode_detail.lasttotalpp = user.pp
                        player_mode_detail.lastrank = user.rank
                        player_mode_detail.lastcountryrank = user.countryrank
                        player.recenttimeplay = best[i].date
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
    if (config.config.debug.osutrack == false) {
        setInterval(real_time_osu_track, 150000)
    }
});

bot.on("guildMemberAdd", (member) => {
    async function welcome_message() {
        if (member.guild.id == "450576647976910869") {
            let imageholder = await jimp.read('./image/welcomebanner.png')
            let avatar = await jimp.read(member.user.avatarURL())
            let placeholder = await new jimp(563, 125)
            avatar.resize(105,105)
            placeholder.composite(avatar, 214, 10)
            placeholder.composite(imageholder,0,0)
            let text = await jimp.loadFont('./font/anjelika_36_white.fnt')
            placeholder.print(text, 347, 10, member.user.username + ',')
            placeholder.write('./welcome.png')
            bot.channels.cache.get("487479898903150612").send(`<@${member.id}>`, {files: ['./welcome.png']})
        }
    }
   welcome_message()
})

bot.on("message", (message) => {
    if (config.config.debug.command == true && message.author.id !== "292523841811513348") {
        return;
    }
    if (message.author.bot == false && loading == 0) {
        let msg = message.content.toLowerCase();
        refresh = Math.round(Math.random()* 2147483648)
        let command = msg.split(' ')[0]
        let embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)

        let bot_prefix = config.config.bot_default_prefix

        if (message.guild !== null) {
            if (server_data[message.guild.id] !== undefined) {
                bot_prefix = server_data[message.guild.id].prefix
            }
        }
        config.update_bot_prefix(bot_prefix)

        // General related

        if (command == bot_prefix + 'help') {
            cmds.general.help(message, command)
        }
        if (command == bot_prefix + 'credit') {
            cmds.general.credit(message)
        }
        if (command == bot_prefix + 'avatar') {
            cmds.general.avatar(message, command)
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
                if (!config.config.debug.disable_db_save) db.server_data.findAndModify({query: {}, update: server_data}, function(){});
            }
        }
        if (command == bot_prefix + 'report' && message.guild !== null) {
            cmds.general.report(message)
        }

        if (command == bot_prefix + 'suggestion' && message.guild !== null) {
            cmds.general.suggestion(message)
        }

        if (msg.includes(`<@${bot.user.id}>`) == true || msg.includes(`<@!${bot.user.id}>`) == true) {
            let respone =  [`Yes? ${message.author.username} <:chinohappy:450684046129758208>`,
                            `Why you keep pinging me?`,
                            `Stop pinging me! <:chinoangry:450686707881213972>`,
                            `What do you need senpai? <:chinohappy:450684046129758208>`,
                            `<:chinopinged:450680698613792783>`,
                            `Hewwo ${message.author.username}! <:chinohappy:450684046129758208>`,
                            `Me is sleepy Zzz.........`,
                            `Where is my senpai? :c`,
                            `Me is busy working for ${bot.guilds.cache.size} servers right now`,
                            `Poked you! :3`,
                            `Me don't know what me is doing right now qwq`,
                            `Me love my senpai`,
                            `Please don't bully my senpai!`]
            let roll = Math.floor(Math.random()*respone.length)
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
                if (!config.config.debug.disable_db_save) db.custom_command.findAndModify({query: {}, update: custom_command}, function(){})
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
                let number = easter_egg[message.author.id]
                message.channel.send(`You have found: **${number.match(/1/g).length} easter egg(s)**`)
            } else {
                message.channel.send("You haven't found any!")
            }
        }

        if (ee[msg] !== undefined) {
            easter_egg = cmds.easter_egg.easter_detection(message, easter_egg)
            if (!config.config.debug.disable_db_save) db.easter_egg.findAndModify({query: {}, update: easter_egg}, function(){})
        }

        // Corona related

        if (command == bot_prefix + 'corona') {
            cmds.corona.corona_live_update(message)
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
        if (command == bot_prefix + 'roll') {
            cmds.fun.roll(message)
        }
        if (command == bot_prefix + '8ball') {
            cmds.fun.eight_ball(message)
        }
        if (command == bot_prefix + 'ratewaifu') {
            cmds.fun.rate_waifu(message)
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
                                                            {"suffix": "-enjuu", "v_count": 0},
                                                            {"suffix": "-gatari", "v_count": 0},
                                                            {"suffix": "-p", "v_count": 1}])
                let mode = "Bancho-std"
                let limit = 50
                if (suffix.suffix.find(s => s.suffix == "-p").position > -1) {
                    limit = suffix.suffix.find(s => s.suffix == "-p").value[0]
                }
                if (suffix.suffix.find(s => s.suffix == "-taiko").position > -1) {
                    mode = "Bancho-taiko"
                } else if (suffix.suffix.find(s => s.suffix == "-ctb").position > -1) {
                    mode = "Bancho-ctb"
                } else if (suffix.suffix.find(s => s.suffix == "-mania").position > -1) {
                    mode = "Bancho-mania"
                } else if (suffix.suffix.find(s => s.suffix == "-ripple").position > -1) {
                    mode = "Ripple-std"
                } else if (suffix.suffix.find(s => s.suffix == "-akat").position > -1) {
                    mode = "Akatsuki-std"
                } else if (suffix.suffix.find(s => s.suffix == "-rxakat").position > -1) {
                    mode = "Akatsuki-rx"
                } else if (suffix.suffix.find(s => s.suffix == "-hrz").position > -1) {
                    mode = "Horizon-std"
                } else if (suffix.suffix.find(s => s.suffix == "-rxhrz").position > -1) {
                    mode = "Horizon-rx"
                } else if (suffix.suffix.find(s => s.suffix == "-enjuu").position > -1) {
                    mode = "Enjuu-std"
                } else if (suffix.suffix.find(s => s.suffix == "-gatari").position > -1) {
                    mode = "Gatari-std"
                }
                if (limit > 100 || limit < 1) {
                    throw 'You can only set from top 1-100. Please try again'
                }
                if (String(limit).search(/^\d+$/) < 0) {
                    throw 'You can only set top as a numeric value. Please try again'
                }
                let type = fx.osu.get_mode_detail(mode).check_type
                let user = await fx.osu.get_osu_profile(suffix.check, mode, 0, false, false)
                let name = user.username
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
                if (!config.config.debug.disable_db_save) db.osu_track.findAndModify({query: {}, update: {'0': osu_track}}, function(){})
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
                                                            {"suffix": "-hrz", "v_count": 0},
                                                            {"suffix": "-enjuu", "v_count": 0},
                                                            {"suffix": "-gatari", "v_count": 0},])
                let type = 'All'
                let mode = 'Bancho-std'
                if (suffix.suffix.find(s => s.suffix == "-bc").position > -1) {
                   type = 'Bancho'
                } else if (suffix.suffix.find(s => s.suffix == "-akat").position > -1) {
                    type = 'Akatsuki'
                    mode = 'Akatsuki-std'
                } else if (suffix.suffix.find(s => s.suffix == "-rp").position > -1) {
                    type = 'Ripple'
                    mode = 'Ripple-std'
                } else if (suffix.suffix.find(s => s.suffix == "-hrz").position > -1) {
                    type = 'Horizon'
                    mode = 'Horizon-std'
                } else if (suffix.suffix.find(s => s.suffix == "-enjuu").position > -1) {
                    type = 'Enjuu'
                    mode = 'Enjuu-std'
                } else if (suffix.suffix.find(s => s.suffix == "-gatari").position > -1) {
                    type = 'Gatari'
                    mode = 'Gatari-std'
                }
                let user = await fx.osu.get_osu_profile(suffix.check, mode, 0, false, false)
                let name = user.username
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
                            if (!config.config.debug.disable_db_save) db.osu_track.findAndModify({query: {}, update: {'0': osu_track}}, function(){})
                        } else {
                            osu_track.splice(osu_track.findIndex(pl => pl.name.toLowerCase() == track.name.toLowerCase()),1)
                            if (Object.keys(osu_track).length < 1) {
                                osu_track['a'] = 'a'
                            }
                            if (!config.config.debug.disable_db_save) db.osu_track.findAndModify({query: {}, update: {'0': osu_track}}, function(){})
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
            let players = []
            for (let i = 0; i < osu_track.length; i++) {
                let channel = osu_track[i].trackonchannel.find(channel => channel.id == message.channel.id)
                if (channel) {
                    let modes = ''
                    for (mode of channel.modes) {
                        modes += `${fx.osu.get_mode_detail(mode.mode).modename} (p: ${mode.limit}), `
                    }
                    if (modes !== '') modes = modes.substring(0,modes.length-2)
                    let view = osu_track[i].name + `: \`\`mode:${modes}\`\`\n` 
                    players.push(view)
                }
            }
            let loadpage = async function (page, pages) {
                let gathering = ''
                for (let n = 0; n < 15; n++) {
                    let i = (page - 1) * 15 - 1 + (n+1)
                    if (i < players.length) {
                        gathering += players[i]
                    }
                }
                pages[page-1] = gathering
                return pages
            }
            fx.general.page_system(message, {load: loadpage}, `Player(s) currently being tracked on #${message.channel.name} (Page {page} of {max_page})`, message.guild.iconURL(), embedcolor, Math.ceil(players.length / 15), 15000 * Math.ceil(players.length / 15))
        }

        // Osu
        if (command == bot_prefix + 'osu')          cmds.osu.osu(message, 'Bancho-std');
        if (command == bot_prefix + 'taiko')        cmds.osu.osu(message, 'Bancho-taiko');
        if (command == bot_prefix + 'ctb')          cmds.osu.osu(message, 'Bancho-ctb') ;
        if (command == bot_prefix + 'mania')        cmds.osu.osu(message, 'Bancho-mania');
        if (command == bot_prefix + 'osucard')      cmds.osu.osu_card(message, 'Bancho-std');
        if (command == bot_prefix + 'taikocard')    cmds.osu.osu_card(message, 'Bancho-taiko');
        if (command == bot_prefix + 'ctbcard')      cmds.osu.osu_card(message, 'Bancho-ctb');
        if (command == bot_prefix + 'maniacard')    cmds.osu.osu_card(message, 'Bancho-mania');
        if (command == bot_prefix + 'osuavatar')    cmds.osu.osuavatar(message, 'Bancho-std');
        if (command == bot_prefix + 'topglobal')    cmds.osu.topleaderboard(message, 'global');
        if (command == bot_prefix + 'topcountry')   cmds.osu.topleaderboard(message, 'country');
        if (command == bot_prefix + 'osutop')       cmds.osu.osutop(message, 'Bancho-std');
        if (command == bot_prefix + 'taikotop')     cmds.osu.osutop(message, 'Bancho-taiko');
        if (command == bot_prefix + 'ctbtop')       cmds.osu.osutop(message, 'Bancho-ctb');
        if (command == bot_prefix + 'maniatop')     cmds.osu.osutop(message, 'Bancho-mania');
        if (command == bot_prefix + 'scores')       cmds.osu.score(message);
        if (command == bot_prefix + 'osuset')       cmds.osu.osuset(message, 'Osu');
        if (command == bot_prefix + 'acc')          cmds.osu.acccalc(message);
        if (command == bot_prefix + 'osutrack')     osutrack();          
        if (command == bot_prefix + 'osutracklist') osutracklist();
        if (command == bot_prefix + 'untrack')      untrack();

        if (command == bot_prefix + 'lb' || command == bot_prefix + 'leaderboard') cmds.osu.serverleaderboard(message);
        if (command == bot_prefix + 'recent' || command == bot_prefix + 'r')       cmds.osu.recent(message);
        if (command == bot_prefix + 'compare' || command == bot_prefix + 'c')      cmds.osu.compare(message);
        if (command == bot_prefix + 'map' || command == bot_prefix + 'm')          cmds.osu.map(message);

        // Akatuski

        if (command == bot_prefix + 'akatsuki')      cmds.osu.osu(message, 'Akatsuki-std');
        if (command == bot_prefix + 'taikoakatsuki') cmds.osu.osu(message, 'Akatsuki-taiko');
        if (command == bot_prefix + 'ctbakatsuki')   cmds.osu.osu(message, 'Akatsuki-ctb');
        if (command == bot_prefix + 'maniaakatsuki') cmds.osu.osu(message, 'Akatsuki-mania');
        if (command == bot_prefix + 'akatavatar')    cmds.osu.osuavatar(message, 'Akatsuki-std');
        if (command == bot_prefix + 'akatsukiset')   cmds.osu.osuset(message, 'Akatsuki');
        if (command == bot_prefix + 'rxakatsuki')    cmds.osu.osu(message, 'Akatsuki-rx');

        if (command == bot_prefix + 'akattop' || command == bot_prefix + 'akatsukitop')             cmds.osu.osutop(message, 'Akatsuki-std');
        if (command == bot_prefix + 'taikoakattop' || command == bot_prefix + 'taikoakatsukitop')   cmds.osu.osutop(message, 'Akatsuki-taiko');
        if (command == bot_prefix + 'ctbakattop' || command == bot_prefix + 'ctbakatsukitop')       cmds.osu.osutop(message, 'Akatsuki-ctb');
        if (command == bot_prefix + 'maniaakattop' || command == bot_prefix + 'maniaakatsukitop')   cmds.osu.osutop(message, 'Akatsuki-mania');
        if (command == bot_prefix + 'rxakattop' || command == bot_prefix + 'rxakatsukitop')         cmds.osu.osutop(message, 'Akatsuki-rx');
        if (command == bot_prefix + 'akatsukicard' || command == bot_prefix + 'akatcard')           cmds.osu.osu_card(message, 'Akatsuki-std');
        if (command == bot_prefix + 'taikoakatsukicard' || command == bot_prefix + 'taikoakatcard') cmds.osu.osu_card(message, 'Akatsuki-taiko');
        if (command == bot_prefix + 'ctbakatsukicard' || command == bot_prefix + 'ctbakatcard')     cmds.osu.osu_card(message, 'Akatsuki-ctb');
        if (command == bot_prefix + 'maniaakatuskicard' || command == bot_prefix + 'maniaakatcard') cmds.osu.osu_card(message, 'Akatsuki-mania');

        // Ripple

        if (command == bot_prefix + 'ripple')          cmds.osu.osu(message, 'Ripple-std');
        if (command == bot_prefix + 'taikoripple')     cmds.osu.osu(message, 'Ripple-taiko');
        if (command == bot_prefix + 'ctbripple')       cmds.osu.osu(message, 'Ripple-ctb');
        if (command == bot_prefix + 'maniaripple')     cmds.osu.osu(message, 'Ripple-mania');
        if (command == bot_prefix + 'rxripple')        cmds.osu.osu(message, 'Ripple-rx');
        if (command == bot_prefix + 'rippleavatar')    cmds.osu.osuavatar(message, 'Ripple-std');
        if (command == bot_prefix + 'rippletop')       cmds.osu.osutop(message, 'Ripple-std');
        if (command == bot_prefix + 'taikorippletop')  cmds.osu.osutop(message, 'Ripple-taiko');
        if (command == bot_prefix + 'ctbrippletop')    cmds.osu.osutop(message, 'Ripple-ctb');
        if (command == bot_prefix + 'maniarippletop')  cmds.osu.osutop(message, 'Ripple-mania');
        if (command == bot_prefix + 'rxrippletop')     cmds.osu.osutop(message, 'Ripple-rx');
        if (command == bot_prefix + 'rippleset')       cmds.osu.osuset(message, 'Ripple');
        if (command == bot_prefix + 'ripplecard')      cmds.osu.osu_card(message, 'Ripple-std');
        if (command == bot_prefix + 'taikoripplecard') cmds.osu.osu_card(message, 'Ripple-taiko');
        if (command == bot_prefix + 'ctbripplecard')   cmds.osu.osu_card(message, 'Ripple-ctb');
        if (command == bot_prefix + 'maniaripplecard') cmds.osu.osu_card(message, 'Ripple-mania');

        // Horizon

        if (command == bot_prefix + 'horizon')          cmds.osu.osu(message, 'Horizon-std');
        if (command == bot_prefix + 'taikohorizon')     cmds.osu.osu(message, 'Horizon-taiko');
        if (command == bot_prefix + 'ctbhorizon')       cmds.osu.osu(message, 'Horizon-ctb');
        if (command == bot_prefix + 'maniahorizon')     cmds.osu.osu(message, 'Horizon-mania');
        if (command == bot_prefix + 'horizonavatar')    cmds.osu.osuavatar(message, 'Horizon-std');
        if (command == bot_prefix + 'horizontop')       cmds.osu.osutop(message, 'Horizon-std');
        if (command == bot_prefix + 'taikohorizontop')  cmds.osu.osutop(message, 'Horizon-taiko');
        if (command == bot_prefix + 'ctbhorizontop')    cmds.osu.osutop(message, 'Horizon-ctb');
        if (command == bot_prefix + 'maniahorizontop')  cmds.osu.osutop(message, 'Horizon-mania');
        if (command == bot_prefix + 'horizonset')       cmds.osu.osuset(message, 'Horizon');
        if (command == bot_prefix + 'rxhorizon')        cmds.osu.osu(message, 'Horizon-rx');
        if (command == bot_prefix + 'rxhorizontop')     cmds.osu.osutop(message, 'Horizon-rx');
        if (command == bot_prefix + 'horizoncard')      cmds.osu.osu_card(message, 'Horizon-std');
        if (command == bot_prefix + 'taikohorizoncard') cmds.osu.osu_card(message, 'Horizon-taiko');
        if (command == bot_prefix + 'ctbhorizoncard')   cmds.osu.osu_card(message, 'Horizon-ctb');
        if (command == bot_prefix + 'maniahorizoncard') cmds.osu.osu_card(message, 'Horizon-mania');

        // Enjuu

        if (command == bot_prefix + 'enjuu')          cmds.osu.osu(message, 'Enjuu-std');
        if (command == bot_prefix + 'taikoenjuu')     cmds.osu.osu(message, 'Enjuu-taiko');
        if (command == bot_prefix + 'ctbenjuu')       cmds.osu.osu(message, 'Enjuu-ctb');
        if (command == bot_prefix + 'maniaenjuu')     cmds.osu.osu(message, 'Enjuu-mania');
        if (command == bot_prefix + 'enjuuavatar')    cmds.osu.osuavatar(message, 'Enjuu-std');
        if (command == bot_prefix + 'enjuutop')       cmds.osu.osutop(message, 'Enjuu-std');
        if (command == bot_prefix + 'taikoenjuutop')  cmds.osu.osutop(message, 'Enjuu-taiko');
        if (command == bot_prefix + 'ctbenjuutop')    cmds.osu.osutop(message, 'Enjuu-ctb');
        if (command == bot_prefix + 'maniaenjuutop')  cmds.osu.osutop(message, 'Enjuu-mania');
        if (command == bot_prefix + 'enjuuset')       cmds.osu.osuset(message, 'Enjuu');
        if (command == bot_prefix + 'enjuucard')      cmds.osu.osu_card(message, 'Enjuu-std');
        if (command == bot_prefix + 'taikoenjuucard') cmds.osu.osu_card(message, 'Enjuu-taiko');
        if (command == bot_prefix + 'ctbenjuucard')   cmds.osu.osu_card(message, 'Enjuu-ctb');
        if (command == bot_prefix + 'maniaenjuucard') cmds.osu.osu_card(message, 'Enjuu-mania');

        // Gatari
        if (command == bot_prefix + 'gatari')          cmds.osu.osu(message, 'Gatari-std');
        if (command == bot_prefix + 'taikogatari')     cmds.osu.osu(message, 'Gatari-taiko');
        if (command == bot_prefix + 'ctbgatari')       cmds.osu.osu(message, 'Gatari-ctb');
        if (command == bot_prefix + 'maniagatari')     cmds.osu.osu(message, 'Gatari-mania');
        if (command == bot_prefix + 'gatariavatar')    cmds.osu.osuavatar(message, 'Gatari-std');
        if (command == bot_prefix + 'gataritop')       cmds.osu.osutop(message, 'Gatari-std');
        if (command == bot_prefix + 'taikogataritop')  cmds.osu.osutop(message, 'Gatari-taiko');
        if (command == bot_prefix + 'ctbgataritop')    cmds.osu.osutop(message, 'Gatari-ctb');
        if (command == bot_prefix + 'maniagataritop')  cmds.osu.osutop(message, 'Gatari-mania');
        if (command == bot_prefix + 'gatariset')       cmds.osu.osuset(message, 'Gatari');
        if (command == bot_prefix + 'gataricard')      cmds.osu.osu_card(message, 'Gatari-std');
        if (command == bot_prefix + 'taikogataricard') cmds.osu.osu_card(message, 'Gatari-taiko');
        if (command == bot_prefix + 'ctbgataricard')   cmds.osu.osu_card(message, 'Gatari-ctb');
        if (command == bot_prefix + 'maniagataricard') cmds.osu.osu_card(message, 'Gatari-mania');

        // Detection
        // Beatmap Detection
        if (msg.includes("https://osu.ppy.sh/beatmapsets/") || msg.includes("https://osu.ppy.sh/b/")) {
            cmds.osu.beatmaplinkdetail(message, bot_prefix)
        }
        // .osu Detection
        if (message.attachments.array().length > 0) {
            let file = message.attachments.first()
            if (file.name.substring(file.name.length - 4, file.name.length) == ".osu") {
                cmds.osu.beatmapfiledetail(message)           
            }
        }
        // Bot Owner commands

        if (message.author.id == "292523841811513348") {
            if (command == bot_prefix + 'announce') {
                try {
                    let guilds = bot.guilds.array()
                    let msg_send = message.content.substring(9)
                    for (let i in guilds) {
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
                    let channelid = msg.split(" ")[1]
                    let msg_send = message.content.substring(msg.indexOf(channelid) + channelid.length)
                    const embed = new Discord.MessageEmbed()
                    .setAuthor(`${message.author.username} responded`, message.author.avatarURL())
                    .setColor(embedcolor)
                    .setDescription(msg_send);
                    bot.channels.cache.get(channelid).send({embed})
                    let msg1 = await message.channel.send('Message has been sent')
                    setTimeout(function(){ msg1.delete(); }, 3000);
                }
                respond()
            }
            if (command == bot_prefix + 'say') {
                let option = msg.split(" ")
                let msg_quote = message.content.split('"')
                if (option[1] == 'text') {
                    message.channel.send(msg_quote[1])
                    message.delete(0)
                } else if (option[1] == 'embed') {
                    const embed = new Discord.MessageEmbed()
                    .setAuthor(msg_quote[1], bot.user.avatarURL())
                    .setColor(embedcolor)
                    .setDescription(msg_quote[3]);
                    message.channel.send({embed})
                    message.delete(0)
                }
            }
        }
    }
})
    