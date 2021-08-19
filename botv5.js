const Discord = require('discord.js-light')
const {DiscordCL} = require('./client.js')
// Utils
const error_report = require('./Utils/error')
// Functions
const cmds = require('./Commands/load_cmd')
const fx = require('./Functions/fx_handler')
// Config
const config = require('./config')
// Database
const mongojs = require('mongojs')
const db = mongojs(process.env.DB_URL, ["user_data_v5", "server_data", "saved_map_id"], {tls: true})
let server_data = {}
//
if (!config.config.debug.disable_server_count) {
    // top.gg
    const topgg = require("dblapi.js")
    topgg_client = new topgg(process.env.TOPGG_KEY, DiscordCL)
}

let loading = 1

function sync_prefix_db({new_prefix, guild_id}) {
    if (new_prefix == config.config.bot_default_prefix) {
        delete server_data[guild_id]
    } else {
        if (server_data?.[guild_id] == undefined) {
            server_data[guild_id] = {}
            server_data[guild_id].prefix = new_prefix
        } else {
            server_data[guild_id].prefix = new_prefix
        }
    }
}

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
    if (message == 'ping') {
        console.log(`pong-${process.env.PROCESS_ID}`)
        process.send("pong");
    }
    if (message.send_type == 'all') {
        switch (message.cmd) {
            case 'respond': 
                cmds.owner.childProc_respond({...message.value, DiscordCL: DiscordCL}); break;
            case 'bug_and_suggest':
                cmds.general.childProc_bug_and_suggest({message: {...message.value}, DiscordCL: DiscordCL}); break;
            case 'realtime_osutrack':
            {
                let channel = DiscordCL.channels.cache.get(message.value.channel_id)
                if (channel) {
                    cmds.osu.cache_beatmap_ID({message: message, beatmap_id: message.value.beatmap_id, mode: message.value.mode, 
                                                channel_id: message.value.channel_id, track: true})
                    const embed = new Discord.MessageEmbed()
                    .setAuthor(message.value.author_title, message.value.author_image)
                    .setThumbnail(message.value.thumbnail)
                    .setDescription(message.value.desc)
                    channel.send({embed})
                    break;
                }
            }
            case 'server_count':
            {
                let channel = DiscordCL.channels.cache.get(message.value.channel_id)
                if (channel) {
                    channel.setName(`Server Count: ${message.value.total_server_count}`)
                }
            }
        }
    } else if (message.send_type == 'return_value') {
        if (message.cmd == 'server_count') {
            process.send({send_type: 'returning', cmd: 'server_count', value: DiscordCL.guilds.cache.size})
        }
    } else if (message.send_type == 'returned') {
        
    } else if (message.send_type == 'db') {
        switch (message.cmd) {
            case 'prefix': {
                sync_prefix_db(message.value)
            }
            case 'osuset': {
                cmds.osu.sync_user_data_db(message.value)
            }
            case 'saved_beatmap': {
                cmds.osu.sync_saved_beatmap_db(message.value)
            }
        }
    }
}) 

DiscordCL.on("ready", () => {
    console.log(`Started, ID: ${process.env.PROCESS_ID}`)
    console.log(DiscordCL.guilds.cache.size)
    async function load_db() {
        try {
            console.log("Loading data")
            if (!config.config.debug.disable_data_db_load) {
                // Get User data
                let user_data = await new Promise(resolve => {
                    db.user_data_v5.find((err, docs) => resolve(docs[0]));
                });
                // Get server data
                server_data = await new Promise(resolve => {
                    db.server_data.find((err, docs) => resolve(docs[0]));
                });
                let saved_map_id = await new Promise(resolve => {
                    db.saved_map_id.find((err, docs) => resolve(docs[0]['0']));
                });
                cmds.osu.push_db({user: user_data, saved_map_id: saved_map_id})
            }
            console.log("Done")
            loading -= 1
        } catch(err) {
            console.log("Something went wrong when loading database, please restart the bot")
            loading -= 1
        }
    }
    load_db()
    // Server count
    const server_count = async () => {
        process.send({send_type: 'return_value', cmd: 'server_count'})
        let total_server_count = await new Promise((resolve) => {
            process.on("message", (message) => {
                if (message.send_type == 'returned' && message.cmd == 'server_count') {
                    resolve(message.return_value)
                }
            })
        })
        total_server_count = total_server_count.reduce((a,b) => a+b)
        process.send({send_type: 'all', cmd: 'server_count', value: {channel_id: "572093442042232842", total_server_count: total_server_count}})
        topgg_client.postStats(total_server_count)
    }
    if (!config.config.debug.disable_server_count && process.env.PROCESS_ID == 0) {
        server_count()
        setInterval(server_count, 1800000)
    }
})

DiscordCL.on("message", (message) => {
    try {
        if (config.config.debug.dev_only && message.author.id !== "292523841811513348") {
            return;
        }
        if (!message.author.bot && loading == 0) {
            const msg = message.content.toLowerCase()
            const command = msg.split(' ')[0]
            let embed_color = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)
            let refresh = Math.round(Math.random()* 2147483648)
            let bot_prefix = config.config.bot_default_prefix

            if (message.guild !== null && !config.config.debug.ignore_server_prefix) {
                if (server_data?.[message.guild.id] !== undefined) {
                    bot_prefix = server_data[message.guild.id].prefix
                }
            }

            let bot_lang = 'en'
            let dflt_obj_param = {message: message, embed_color: embed_color, refresh: refresh, 
                                lang: bot_lang, prefix: bot_prefix}

            function prefix() {
                try {
                    let msg = message.content.toLowerCase();
                    if (message.member.hasPermission("MANAGE_CHANNELS") == false) {
                        message.channel.send(error_report({type: 'custom', err_message: 'You need to have `MANAGE_CHANNELS` permission to set prefix'}))
                        return
                    }
                    let command = msg.split(' ')[0]
                    if (fx.general.cmd_cooldown.cooldown[message.author.id] !== undefined && fx.general.cmd_cooldown.cooldown[message.author.id].indexOf(command) !== -1) {
                        message.channel.send(error_report({type: 'custom', err_message: 'You need to wait 30 seconds before using this again!'}))
                        return
                    }
                    fx.general.cmd_cooldown.set({message: message, cmd: command, time: 0000})
                    let sync_db_value = {
                        new_prefix: undefined,
                        guild_id: message.guild.id,
                        proc_id: process.env.PROCESS_ID
                    }
                    let new_prefix = msg.split(' ')[1]
                    if (new_prefix == undefined) {
                        message.channel.send(error_report({type: 'custom', err_message: "You need to specify what prefix the bot should be using"}))
                        return
                    }
                    sync_db_value.new_prefix = new_prefix
                    if (new_prefix == config.config.bot_default_prefix) {
                        message.channel.send(`Prefix has been set back to default: ${config.config.bot_default_prefix}`)
                        delete server_data[message.guild.id]
                    } else {
                        if (server_data?.[message.guild.id] == undefined) {
                            server_data[message.guild.id] = {}
                            server_data[message.guild.id].prefix = new_prefix
                        } else {
                            server_data[message.guild.id].prefix = new_prefix
                        }
                        message.channel.send(`Prefix has been set to: ${new_prefix}`)
                    }
                    if (Object.keys(server_data).length < 1) {
                        server_data['a'] = 'a'
                    }
                    process.send({send_type: "db", cmd: "prefix", value: sync_db_value})
                    if (!config.config.debug.disable_db_save) db.server_data.findAndModify({query: {}, update: server_data}, function(){});
                } catch (error) {
                    message.channel.send(error_report({type: 'normal', err_message: error.stack.toString()}))
                }
            }

            const cmd_list = {
                'avatar':       () => cmds.general.avatar(dflt_obj_param),
                'ping':         () => cmds.general.ping(dflt_obj_param),
                'checkperm':    () => cmds.general.checkperm({...dflt_obj_param, bot_ver: config.config.bot_ver}),
                'report':       () => cmds.general.bug_and_suggest({...dflt_obj_param, type: 'bug'}),
                'suggestion':   () => cmds.general.bug_and_suggest({...dflt_obj_param, type: 'suggestion'}),
                'changelog':    () => cmds.general.changelog(dflt_obj_param),
                'donate':       () => cmds.general.donate(dflt_obj_param),
                'invite':       () => cmds.general.bot_link(dflt_obj_param),
                'server':       () => cmds.general.bot_link(dflt_obj_param),
                'invitation':   () => cmds.general.bot_link(dflt_obj_param),
                'prefix':       () => prefix(),
                'help':         () => cmds.general.help(dflt_obj_param),
                //
                'hug':          () => cmds.fun.tenor({message: message, search: 'anime hug', action: 'you got a hug from', alone_action: 'Sorry to see you alone...'}),
                'cuddle':       () => cmds.fun.tenor({message: message, search: 'anime cuddle', action: 'you got a cuddle from', alone_action: 'Sorry to see you alone...'}),
                'slap':         () => cmds.fun.tenor({message: message, search: 'anime slap', action: 'you got a slap from', alone_action: 'Are you trying to slap yourself?'}),
                'kiss':         () => cmds.fun.tenor({message: message, search: 'anime kiss', action: 'you got a kiss from', alone_action: 'Are you trying to kiss yourself?'}),
                'pat':          () => cmds.fun.tenor({message: message, search: 'anime pat', action: 'you got a pat from', alone_action: 'Pat pat'}),
                'poke':         () => cmds.fun.tenor({message: message, search: 'anime poke', action: 'you got a poke from', alone_action: 'Poking yourself huh? Heh'}),
                'cry':          () => cmds.fun.tenor({message: message, search: 'anime cry', action: undefined, alone_action: 'Awww why are you crying :('}),
                'blush':        () => cmds.fun.tenor({message: message, search: 'anime blush', action: undefined, alone_action: `<@${message.author.id}> w-why are u blushing`}),
                'pout':         () => cmds.fun.tenor({message: message, search: 'anime pout', action: 'you got a pout from', alone_action: `Poutu Poutu`}),
                'trivia':       () => cmds.fun.trivia({message: message}),
                'roll':         () => cmds.fun.roll({message: message}),
                '8ball':        () => cmds.fun.eight_ball({message: message}),
                'ratewaifu':    () => cmds.fun.rate_waifu({message: message}),
                // 
                'osuavatar':    () => cmds.osu.osuavatar(dflt_obj_param),
                'osu':          () => cmds.osu.osu({...dflt_obj_param, a_mode: 'std'}),
                'taiko':        () => cmds.osu.osu({...dflt_obj_param, a_mode: 'taiko'}),
                'ctb':          () => cmds.osu.osu({...dflt_obj_param, a_mode: 'ctb'}),
                'mania':        () => cmds.osu.osu({...dflt_obj_param, a_mode: 'mania'}),
                'relax':        () => cmds.osu.osu({...dflt_obj_param, a_mode: 'rx'}),
                'osutop':       () => cmds.osu.osutop({...dflt_obj_param, a_mode: 'std'}),
                'taikotop':     () => cmds.osu.osutop({...dflt_obj_param, a_mode: 'taiko'}),
                'ctbtop':       () => cmds.osu.osutop({...dflt_obj_param, a_mode: 'ctb'}),
                'maniatop':     () => cmds.osu.osutop({...dflt_obj_param, a_mode: 'mania'}),
                'relaxtop':     () => cmds.osu.osutop({...dflt_obj_param, a_mode: 'rx'}),
                'osucard':      () => cmds.osu.osucard({...dflt_obj_param, a_mode: 'std'}),
                'taikocard':    () => cmds.osu.osucard({...dflt_obj_param, a_mode: 'taiko'}),
                'ctbcard':      () => cmds.osu.osucard({...dflt_obj_param, a_mode: 'ctb'}),
                'maniacard':    () => cmds.osu.osucard({...dflt_obj_param, a_mode: 'mania'}),
                'recent':       () => cmds.osu.recent(dflt_obj_param),
                'compare':      () => cmds.osu.compare(dflt_obj_param),
                'map':          () => cmds.osu.map(dflt_obj_param),
                'scores':       () => cmds.osu.scores(dflt_obj_param),
                'osuset':       () => cmds.osu.osuset(dflt_obj_param),
                'osutrack':     () => cmds.osu.osutrack(dflt_obj_param),
                'untrack':      () => cmds.osu.untrack(dflt_obj_param),
                'osutracklist': () => cmds.osu.osutracklist(dflt_obj_param),
                // Shorten command
                'rx':           () => cmds.osu.osu({...dflt_obj_param, a_mode: 'rx'}),
                'top':          () => cmds.osu.osutop({...dflt_obj_param, a_mode: 'std'}),
                'rxtop':        () => cmds.osu.osutop({...dflt_obj_param, a_mode: 'rx'}),
                'card':         () => cmds.osu.osucard({...dflt_obj_param, a_mode: 'std'}),
                'r':            () => cmds.osu.recent(dflt_obj_param),
                'rs':           () => cmds.osu.recent(dflt_obj_param),
                'c':            () => cmds.osu.compare(dflt_obj_param),
                'sc':           () => cmds.osu.scores(dflt_obj_param),
                'm':            () => cmds.osu.map(dflt_obj_param),
            }
            if (msg.startsWith(bot_prefix)) cmd_list[command.substring(bot_prefix.length)]?.()
            if (msg.startsWith('https://osu.ppy.sh/b/') || msg.startsWith('https://osu.ppy.sh/beatmapsets/')) {
                cmds.osu.beatmap_link_detection(dflt_obj_param)
            }
            if (message.author.id == "292523841811513348") {
               const owner_cmd_list = {
                   'respond': () => cmds.owner.respond({message: message})
                }
                if (msg.startsWith(bot_prefix)) owner_cmd_list[command.substring(bot_prefix.length)]?.()
            }
            // Mention bot
            if (msg.includes(`<@${DiscordCL.user.id}>`) == true || msg.includes(`<@!${DiscordCL.user.id}>`) == true) {
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
                                `Me is busy working for ${DiscordCL.guilds.cache.size} servers right now`,
                                `Poked you! :3`,
                                `Me don't know what me is doing right now qwq`,
                                `Me love my senpai`,
                                `Please don't bully my senpai!`]
                    let roll = Math.floor(Math.random()*respone.length)
                    message.channel.send(respone[roll])
                }
            }
    
        }
    } catch(err) {
        message.channel.send(error_report({type: 'normal', err_message: err.stack.toString()}))
    }
})