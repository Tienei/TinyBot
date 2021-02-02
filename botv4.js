let user_data = {}
let osu_track = []
let stored_map_ID = []
let saved_map_id = []
let server_data = {}
let report_ban_data = {}

require('dotenv').config();
const Discord = require('discord.js-light');
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
const db = mongojs(process.env.DB_URL, ["user_data","osu_track","server_data", "saved_map_id", "report_ban"])

let topgg_client = ''
if (!config.config.debug.command) {
    // top.gg
    const topgg = require("dblapi.js")
    topgg_client = new topgg(process.env.TOPGG_KEY, bot)
}

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

            // Get server data
            server_data = await new Promise(resolve => {
                db.server_data.find((err, docs) => resolve(docs[0]));
            });

            // Get report ban data
            report_ban_data = await new Promise(resolve => {
                db.report_ban.find((err, docs) => resolve(docs[0]));
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
    const topgg_server_count = async () => topgg_client.postStats(bot.guilds.cache.size);
    setInterval(server_count, 1800000)
    if (!config.config.debug.command) setInterval(topgg_server_count, 1800000)

    // osutrack
    async function real_time_osu_track() {
        console.log('osutrack: Checking')
        for (let player of osu_track) {
            try {
                let modes = []
                for (let channel of player.trackonchannel) {
                    
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
                    best.sort(function(a,b) {return new Date(a.date).getTime()-new Date(b.date).getTime()})
                    if (best.length > 0) {
                        player.recenttimeplay = best[best.length-1].date
                        if (!config.config.debug.disable_db_save) db.osu_track.findAndModify({query: {}, update: {'0': osu_track}}, function(){})
                    }
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
                        let fc_stat = await fx.osu.get_pp(pp, check_type, a_mode, parser, best[0].beatmapid, bitpresent, best[0].score, best[0].combo, best[0].fc, best[0].count300, best[0].count100, best[0].count50, best[0].countmiss, best[0].countgeki, best[0].countkatu, best[0].acc, best[0].perfect, true)
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
                                    embed.setColor(bot.channels.cache.get(channel.id).guild.me.displayColor)
                                    let msg = await bot.channels.cache.get(channel.id).send({embed})
                                    cmds.osu.cache_beatmap_ID(msg, beatmap.beatmapid, mode)
                                }
                            }
                        }
                        player.name = user.username
                        player_mode_detail.lasttotalpp = user.pp
                        player_mode_detail.lastrank = user.rank
                        player_mode_detail.lastcountryrank = user.countryrank
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
        setInterval(real_time_osu_track, 300000)
    }
});

bot.on("guildMemberAdd", (member) => {
    async function welcome_message() {
        if (member.guild.id == "450576647976910869") {
            let imageholder = await jimp.read('./image/welcomebanner.png')
            let avatar = await jimp.read(member.user.avatarURL({size: 512, format: 'png'}))
            let placeholder = await new jimp(563, 125)
            avatar.resize(105,105)
            placeholder.composite(avatar, 214, 10)
            placeholder.composite(imageholder,0,0)
            let text = await jimp.loadFont('./font/anjelika_36_white.fnt')
            placeholder.print(text, 347, 10, member.user.username + ',')
            placeholder.write('./welcome.png')
            bot.channels.cache.get("487479898903150612").send(`<@${member.id}>`, {files: ['./welcome.png']})
            member.roles.add(member.guild.roles.cache.find(r => r.id == "495543009107116032"))
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
        let embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor) // Bot crash

        let bot_prefix = config.config.bot_default_prefix

        if (message.guild !== null && config.config.debug.command == false) {
            if (server_data[message.guild.id] !== undefined) {
                bot_prefix = server_data[message.guild.id].prefix
            }
        }
        config.update_bot_prefix(bot_prefix)

        // Commands function
        function prefix() {
            let data = cmds.general.prefix(message, server_data)
            if (data !== null) {
                server_data = data 
                if (!config.config.debug.disable_db_save) db.server_data.findAndModify({query: {}, update: server_data}, function(){});
            }
        }
        function memory() {
            let total_memory = '**512** MB' //hardcoded
            let memory = process.memoryUsage()
            message.channel.send(`Memory Usage: **${Math.round(memory.heapUsed / 1024 / 1024 * 100)/100}** MB/${total_memory}`)
        }
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
                let suffix = fx.osu.check_suffix(message.content, true, [{"suffix": "-bc", "v_count": 0},
                                                                        {"suffix": "-akat", "v_count": 0},
                                                                        {"suffix": "-rp", "v_count": 0},
                                                                        {"suffix": "-hrz", "v_count": 0},
                                                                        {"suffix": "-enjuu", "v_count": 0},
                                                                        {"suffix": "-gatari", "v_count": 0},
                                                                        {"suffix": "-on", "v_count": 0}])
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
                let name = ''
                if (suffix.suffix.find(s => s.suffix == "-on").position > -1)  name = suffix.check;
                else { 
                    let user = await fx.osu.get_osu_profile(suffix.check, mode, 0, false, false)
                    name = user.username
                }
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

        // Execute commands
        if (command.startsWith(bot_prefix)) {
            const commands_list = {
                // General
                'ping':         () => cmds.general.ping(message),
                'help':         () => cmds.general.help(message, command),
                'credit':       () => cmds.general.credit(message),
                'avatar':       () => cmds.general.avatar(message, command),
                'changelog':    () => cmds.general.changelog(message),
                'bot':          () => cmds.general.bot_info(message),
                'suggestion':   () => cmds.general.suggestion(message),
                'report':       () => cmds.general.report(message),
                'prefix':       () => {if (message.guild) prefix()},
                'memory':       () => memory(),
                'checkperm':    () => {if (message.guild) cmds.general.checkcomp(message)},
                'corona':       () => cmds.corona.corona_live_update(message),
                'donate':       () => cmds.general.donate(message),
                // Fun
                'hug':          () => cmds.fun.tenor(message, 5, 'anime hug', 'you got a hug from', 'Sorry to see you alone...'),
                'cuddle':       () => cmds.fun.tenor(message, 8, 'anime cuddle', 'you got a cuddle from', 'Sorry to see you alone...'),
                'slap':         () => cmds.fun.tenor(message, 6, 'anime slap', 'you got a slap from', 'Are you trying to slap yourself?'),
                'kiss':         () => cmds.fun.tenor(message, 6, 'anime kiss', 'you got a kiss from', 'Are you trying to kiss yourself?'),
                'pat':          () => cmds.fun.tenor(message, 5, 'anime pat', 'you got a pat from', 'Pat pat'),
                'poke':         () => cmds.fun.tenor(message, 6, 'anime poke', 'you got a poke from', 'Poking yourself huh? Heh'),
                'cry':          () => cmds.fun.tenor(message, 5, 'anime cry', undefined, 'Awww why are you crying :('),
                'blush':        () => cmds.fun.tenor(message, 7, 'anime blush', undefined, `<@${message.author.id}> w-why are u blushing`),
                'pout':         () => cmds.fun.tenor(message, 6, 'anime pout', 'you got a pout from', `Poutu Poutu`),
                'trivia':       () => cmds.fun.trivia(message),
                'roll':         () => cmds.fun.roll(message),
                '8ball':        () => cmds.fun.eight_ball(message),
                'ratewaifu':    () => cmds.fun.rate_waifu(message),
                // Osu
                'banchoping':   () => cmds.osu.ping(message, command),
                'osu':          () => cmds.osu.osu(message, 'std'),
                'taiko':        () => cmds.osu.osu(message, 'taiko'),
                'ctb':          () => cmds.osu.osu(message, 'ctb') ,
                'mania':        () => cmds.osu.osu(message, 'mania'),
                'relax':        () => cmds.osu.osu(message, 'rx'),
                'rx':           () => cmds.osu.osu(message, 'rx'),
                'osucard':      () => cmds.osu.osu_card(message, 'std'),
                'taikocard':    () => cmds.osu.osu_card(message, 'taiko'),
                'ctbcard':      () => cmds.osu.osu_card(message, 'ctb'),
                'maniacard':    () => cmds.osu.osu_card(message, 'mania'),
                'osuavatar':    () => cmds.osu.osuavatar(message, 'std'),
                'topglobal':    () => cmds.osu.topleaderboard(message, 'global'),
                'topcountry':   () => cmds.osu.topleaderboard(message, 'country'),
                'osutop':       () => cmds.osu.osutop(message, 'std'),
                'taikotop':     () => cmds.osu.osutop(message, 'taiko'),
                'ctbtop':       () => cmds.osu.osutop(message, 'ctb'),
                'maniatop':     () => cmds.osu.osutop(message, 'mania'),
                'relaxtop':     () => cmds.osu.osutop(message, 'rx'),
                'rxtop':        () => cmds.osu.osutop(message, 'rx'),
                'scores':       () => cmds.osu.score(message),
                'osuset':       () => cmds.osu.osuset(message),
                'acc':          () => cmds.osu.acccalc(message),
                'osutrack':     () => osutrack(),
                'osutracklist': () => osutracklist(),
                'untrack':      () => untrack(),
                'lb':           () => cmds.osu.serverleaderboard(message),
                'leaderboard':  () => cmds.osu.serverleaderboard(message),
                'c':            () => cmds.osu.compare(message),
                'compare':      () => cmds.osu.compare(message),
                'm':            () => cmds.osu.map(message),
                'map':          () => cmds.osu.map(message),
                'r':            () => cmds.osu.recent(message),
                'rs':           () => cmds.osu.recent(message),
                'recent':       () => cmds.osu.recent(message)
            }
            if (commands_list[command.substring(bot_prefix.length)]) {
                commands_list[command.substring(bot_prefix.length)]()
            }
        }

        // Other commands

        if (msg.includes(`<@${bot.user.id}>`) == true || msg.includes(`<@!${bot.user.id}>`) == true) {
            let cmd = msg.split(' ')[1]
            if (cmd == 'check_prefix') {
                message.channel.send(`Your current prefix in the server is: ${bot_prefix}`)
            } else {
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
        }

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
            if (command == bot_prefix + 'reportban') {
                let userid = msg.split(" ")[1]
                if (report_ban_data.hasOwnProperty(userid)) message.channel.send('You already ban this user')
                else {
                    report_ban_data[userid] = true
                    if (!config.config.debug.disable_db_save) db.report_ban.findAndModify({query: {}, update: report_ban_data}, function(){})
                    message.channel.send(`${userid} has been ban from making any report`)
                }
            }
            if (command == bot_prefix + 'reportunban') {
                let userid = msg.split(" ")[1]
                if (!report_ban_data.hasOwnProperty(userid)) message.channel.send('This user isnt found in the database')
                else {
                    delete report_ban_data[userid]
                    if (Object.keys(report_ban_data).length == 0) {
                        report_ban_data.a = true
                    }
                    if (!config.config.debug.disable_db_save) db.report_ban.findAndModify({query: {}, update: report_ban_data}, function(){})
                    message.channel.send(`${userid} has been unban from making any report`)
                }
            }
        }
    }
})
