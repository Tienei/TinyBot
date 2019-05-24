var cache = {}
var track = []
var storedmapid = []
var storedee = {}
var cooldown = {}
var customcmd = {}
var economy = []

const Discord = require('discord.js');
const nodeosu = require('node-osu');
const bot = new Discord.Client();
const request = require('request-promise-native');
const calc = require('ojsama')
const fs = require('fs')
const san = require('sanitize-html')
const jimp = require('jimp')

var osuApi = new nodeosu.Api(process.env.OSU_KEY, {
    notFoundAsError: false,
    completeScores: true
});

var ee = JSON.parse(process.env.EASTER_EGG)
var eenumber = ''

var loading = 1
var botver = 'v3'
var botsubver = 'v3.1'
var refresh = 0

function rankingletters(letter) {
    if (letter == "F") {
        return '<:rankingF:557836461077168138>';
    }
    if (letter == "A") {
        return '<:rankingA:520932311613571072>';
    }
    if (letter == "B") {
        return '<:rankingB:520932334061748224>';
    }
    if (letter == "C") {
        return '<:rankingC:520932353103626271>';
    }
    if (letter == "D") {
        return '<:rankingD:520932369172004869>';
    }
    if (letter == "S") {
        return '<:rankingS:520932426449682432>';
    }
    if (letter == "SH") {
        return '<:rankingSH:520932441687588864>';
    }
    if (letter == "X") {
        return '<:rankingX:520932410746077184>';
    }
    if (letter == "XH") {
        return '<:rankingXH:520932395080482858>';
    }
}

function mods(mod) {
    var mods = {
        NoFail     : "NF",
        Easy       : "EZ",
        TouchDevice: "TD",
        Hidden     : "HD",
        HardRock   : "HR",
        SuddenDeath: "SD",
        DoubleTime : "DT",
        HalfTime   : "HT",
        Nightcore  : "NC",
        Flashlight : "FL",
        SpunOut    : "SO",
        Perfect    : "PF"
    }
    var shortenmod = '+';
    var bitpresent = 0
    for (var i = 0; i < mod.length; i++) {
        if (shortenmod.includes('DT') == true && mods[mod[i]] == 'NC') {
            shortenmod = shortenmod.substring(0,shortenmod.length - 2)
        }
        if (shortenmod.includes('SD') == true && mods[mod[i]] == 'PF') {
            shortenmod = shortenmod.substring(0,shortenmod.length - 2)
        }
        if (mods[mod[i]]) {
            shortenmod += mods[mod[i]];
            bitpresent += nodeosu.Constants.Mods[mod[i]]
        }
    }
    if (mod.length == 0 || shortenmod == '+'){
        shortenmod += 'No Mod';
    }
    return {shortenmod: shortenmod, bitpresent: bitpresent}
}

function bittomods(number) {
    var bit = number.toString(2)
    var shortenmod = "+"
    var fullbit = "0000000000000000000000000000000".substr(bit.length) + bit
    var modlist = {
        17: 'PF',
        19: 'SO',
        21: 'FL',
        22: 'NC',
        23: 'HT',
        24: 'RX',
        25: 'DT',
        26: 'SD',
        27: 'HR',
        28: 'HD',
        29: 'TD',
        30: 'EZ',
        31: 'NF'
    }
    for (var i = 31; i >= 0; i--) {
        if (fullbit[i] == 1) {
            shortenmod += modlist[i+1]
        }
    }
    if (number == 0) {
        shortenmod += 'No Mod'
    }
    return shortenmod
}

function timeago(time) {
    var dateago = new Date(time).getTime()
    var datenow = new Date().getTime()
    var datenew = new Date(datenow - 28800000 - dateago)
    var sec = datenew.getUTCSeconds()
    var min = datenew.getUTCMinutes()
    var hour = datenew.getUTCHours()
    var day = (datenew.getUTCDate() - 1)
    var month = datenew.getUTCMonth()
    var year = (datenew.getUTCFullYear() - 1970)
    var text = ''
    if (year > 0) {
        text = `${year} year and ${month} month ago`
    } else if (month > 0) {
        text = `${month} month and ${day} day ago`
    } else if (day > 0) {
        text = `${day} day and ${hour} hour ago`
    } else if (hour > 0)  {
        text = `${hour} hour and ${min} minute ago`
    } else {
        text = `${min} minute and ${sec} second ago`
    }
    return text
}

function mapdetail(mods,length,bpm,cs,ar,od,hp,timetotal,timedrain) {
    var arms = 0
    var odms = 0
    mods = mods.toLowerCase()
    function EZ() {
        cs = cs / 2
        ar = ar / 2
        od = od / 2
        hp = hp / 2
    }

    function HT() {
        length = length * 1.33
        bpm = bpm / 1.33
        if (ar < 5) {
            arms = 1600 + ((5 - ar) * 160)
        }
        if (ar == 5) {
            arms = 1600
        }
        if (ar > 5) {
            arms = 1600 - ((ar - 5) * 200)
        }
        if (arms < 1200) {
            ar = (1200 + 750 - arms) / 150
        }
        if (arms == 1200) {
            ar = 5
        }
        if (arms > 1200) {
            ar = (1200 + 600 - arms) / 120
        }
        odms = (50 + 30 * (5 - od) / 5) * 0.75
        od = (30 + 50 - odms) / 6
        hp = hp / 1.5
        timetotal *= 1.5
        timedrain *= 1.5
    }

    function HR() {
        cs = cs * 1.3
        ar = ar * 1.4
        od = od * 1.4
        hp = hp * 1.4
        if (ar > 10) {
            ar = 10
        }
        if (od > 10) {
            od = 10
        }
        if (hp > 10) {
            hp = 10
        }
    }

    function DT() {
        length = length / 1.5
        bpm = bpm * 1.5
        if (ar < 5) {
            arms = 800 + ((5 - ar) * 80)
        }
        if (ar == 5) {
            arms = 800
        }
        if (ar > 5) {
            arms = 800 - ((ar - 5) * 100)
        }
        if (arms < 1200) {
            ar = (1200 + 750 - arms) / 150
        }
        if (arms == 1200) {
            ar = 5
        }
        odms = (50 + 30 * (5 - od) / 5) * 0.67
        od = (30 + 50 - odms) / 6
        hp = hp * 1.5
        timetotal /= 1.5
        timedrain /= 1.5
    }

    if (mods.includes("ez") == true) {
        EZ()
    }
    if (mods.includes("hr") == true) {
        HR()
    }
    if (mods.includes("ht") == true) {
        HT()
    }
    if (mods.includes("dt") == true || mods.includes("nc") == true) {
        DT()
    }
    if (ar < 0) {
        ar = 0
    }
    if (od < 0) {
        od = 0
    }
    if (hp < 0) {
        hp = 0
    }
    if (cs > 10) {
        cs = 10
    }
    if (ar > 11) {
        ar = 11
    }
    if (od > 11) {
        od = 11
    }
    if (hp > 11) {
        hp = 11
    }
    return {length: length, bpm: bpm, cs: cs, ar: ar, od: od, hp: hp, timetotal: timetotal, timedrain: timedrain}
}

async function precalc(beatmapid) {
    var parser = new calc.parser()
    var map = await request.get(`https://osu.ppy.sh/osu/${beatmapid}`)
    parser.feed(map)
    return parser
}

function ppcalc(parser,mods,combo,count100,count50,countmiss,acc,mode) {
    var stars = new calc.diff().calc({map: parser.map, mods: mods})
    var object = Number(stars.objects.length)
    var accuracy = 0
    if (mode == 1) {
        var count300 = object - count100 - count50
        accuracy = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
    } else {
        accuracy = acc
    }
    var score = {
        stars: stars,
        combo: combo,
        nmiss: countmiss,
        acc_percent: accuracy
    }
    var pp = calc.ppv2(score)
    return {star: stars,pp: pp,acc: accuracy, ar: stars.map.ar, od: stars.map.od, hp: stars.map.hp, cs: stars.map.cs}
}

bot.on("ready", (ready) => {
    async function getFile() {
        // Get User data
        var backupmessage = await bot.channels.get('487482583362568212').fetchMessages({limit: 1})
        var backup = backupmessage.first().attachments
        var fileurl = backup.first().url
        var file = await request.get(fileurl)
        cache = JSON.parse(file)
        // Get track data
        var trackmessage = await bot.channels.get('497302830558871552').fetchMessages({limit: 1})
        var trackbackup = trackmessage.first().attachments
        var trackurl = trackbackup.first().url
        var trackdata = await request.get(trackurl)
        track = JSON.parse(trackdata)
        // Get easter egg data
        var eemessage = await bot.channels.get('569168849992417315').fetchMessages({limit: 1})
        var eebackup = eemessage.first().attachments
        var eeurl = eebackup.first().url
        var eedata = await request.get(eeurl)
        storedee = JSON.parse(eedata)
        for (var i = 0 ; i < Object.keys(ee).length; i++) {
            eenumber += '0'
        }
        // Get custom commands data
        var ccmessage = await bot.channels.get('572585703989575683').fetchMessages({limit: 1})
        var ccbackup = ccmessage.first().attachments
        var ccurl = ccbackup.first().url
        var ccdata = await request.get(ccurl)
        customcmd = JSON.parse(ccdata)
        // Get economy data
        var ecomessage = await bot.channels.get('578105172237221889').fetchMessages({limit: 1})
        var ecobackup = ecomessage.first().attachments
        var ecourl = ecobackup.first().url
        var ecodata = await request.get(ecourl)
        economy = JSON.parse(ecodata)
        loading = 0
    }
    getFile()
    
    // Server count

    function servercount() {
        bot.channels.get("572093442042232842").setName(`Server Count: ${bot.guilds.size}`)
    }
    setInterval(servercount, 10000)

    // osutrack
    async function realtimeosutrack() {
        for (var player = 0; player < track.length ; player++) {
            console.log(track[player].osuname)
            var name = track[player].osuname
            var top50 = track[player].top50pp
            var recent = await osuApi.getUserRecent({u: name})
            if (recent.length !== 0) {
                var beatmapid = recent[0][1].id
                var count300 = Number(recent[0][0].counts['300'])
                var count100 = Number(recent[0][0].counts['100'])
                var count50 = Number(recent[0][0].counts['50'])
                var countmiss = Number(recent[0][0].counts.miss)
                var combo = recent[0][0].maxCombo
                var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                var mod = recent[0][0].mods 
                var modandbit = mods(mod)
                var bitpresent = modandbit.bitpresent
                var parser = await precalc(beatmapid)
                var recentcalc = ppcalc(parser,bitpresent,combo,count100,count50,countmiss,acc,0)
                if (String(track[player].recenttimeplay) !== String(recent[0][0].date)) {
                    console.log('new recent')
                    track[player].recenttimeplay = recent[0][0].date
                    var user = await osuApi.apiCall('/get_user', {u: name})
                    if(Number(recentcalc.pp.total) > Number(top50)) {
                        var best = await osuApi.getUserBest({u: name, limit: 50})
                        for (var i = 0; i < best.length; i++) {
                            if (String(best[i][0].date) === String(recent[0][0].date)) {
                                console.log('new top play')
                                var country = String(user[0].country).toLowerCase()
                                var pp = Number(best[i][0].pp).toFixed(2)
                                var ppgain = (Number(user[0].pp_raw).toFixed(2) - Number(track[player].lasttotalpp)).toFixed(2)
                                var beatmap = best[i][1].title
                                var beatmapidfixed = best[i][1].beatmapSetId
                                var diff = best[i][1].version
                                var scores = best[i][0].score
                                var combo = best[i][0].maxCombo
                                var fc = best[i][1].maxCombo
                                var perfect = best[i][0].perfect
                                var letter = best[i][0].rank
                                var rank = rankingletters(letter)
                                var modandbit = mods(mod)
                                var shortenmod = modandbit.shortenmod
                                var bitpresent = modandbit.bitpresent
                                var count300 = Number(best[i][0].counts['300'])
                                var count100 = Number(best[i][0].counts['100'])
                                var count50 = Number(best[i][0].counts['50'])
                                var countmiss = Number(best[i][0].counts.miss)
                                var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                                var fccalc = ppcalc(parser,bitpresent,fc,count100,count50,0,acc,1)
                                var star = Number(fccalc.star.total).toFixed(2)
                                var fcpp = Number(fccalc.pp.total).toFixed(2)
                                var fcacc = fccalc.acc
                                var fcguess = ``
                                if (letter == 'F') {
                                pp = 'No PP'
                                }
                                if (perfect == 0) {
                                    fcguess = `| **${fcpp}pp for ${fcacc}%**`
                                }               
                                var embed = new Discord.RichEmbed()
                                .setAuthor(`New #${i+1} for ${name} in osu!Standard:`, `http://s.ppy.sh/a/${user[0].user_id}.png?date=${refresh}`)
                                .setThumbnail(`https://b.ppy.sh/thumb/${beatmapidfixed}l.jpg`)
                                .setDescription(`
**[${beatmap}](https://osu.ppy.sh/b/${beatmapid})** (${star}★) ${shortenmod} | **${pp}pp** (+${ppgain}pp)
${rank} *${diff}* | **Scores:** ${scores} | **Combo:** ${combo}/${fc}
**Accuracy:** ${acc}% [${count300}/${count100}/${count50}/${countmiss}] ${fcguess}
**#${track[player].lastrank} → #${user[0].pp_rank} (:flag_${country}: : #${track[player].lastcountryrank} → #${user[0].pp_country_rank})** | Total PP: **${user[0].pp_raw}**`)
                                for (var i = 0; i < track[player].trackonchannel.length; i++) {
                                    var server = bot.channels.get(track[player].trackonchannel[i]).guild.id
                                    storedmapid.push({id:beatmapid,server: server})
                                    embed.setColor(bot.channels.get(track[player].trackonchannel[i]).guild.me.displayColor)
                                    bot.channels.get(track[player].trackonchannel[i]).send({embed})
                                }
                                track[player].lasttotalpp = user[0].pp_raw
                                track[player].lastrank = user[0].pp_rank
                                track[player].lastcountryrank = user[0].pp_country_rank
                                track[player].top50pp = best[49][0].pp
                                break;
                            }
                        }
                    } else {
                        track[player].lasttotalpp = user[0].pp_raw
                        track[player].lastrank = user[0].pp_rank
                        track[player].lastcountryrank = user[0].pp_country_rank
                    }
                }
            }
        }
    }
    setInterval(realtimeosutrack, 25000)
});

bot.on("guildMemberAdd", (member) => {
    async function welcomeMessage() {
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
   welcomeMessage()
})

bot.on("message", (message) => {
    var msg = message.content.toLowerCase();
    refresh = Math.round(Math.random()* 2147483648)
    var command = ''
    var embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)

    if (message.author.bot == false && loading == 0){
        for (var i = 0; i < msg.length; i++) {
            if (msg[i] == ' ') {
                command = msg.substring(0,i)
                break;
            } else if (msg[i+1] == undefined) {
                command = msg.substring(0,i+1)
                break;
            }
        }

        function setCommandCooldown(cdcommand,time) {
            if (cooldown[message.author.id] == undefined) {
                cooldown[message.author.id] = [cdcommand]
            } else {
                cooldown[message.author.id].push(cdcommand)
            }
            setTimeout(() => {
                if (cooldown[message.author.id].length > 1) {
                    var pos = cooldown[message.author.id].indexOf(cdcommand)
                    cooldown[message.author.id].splice(pos,1)
                } else {
                    delete cooldown[message.author.id]
                }
            }, time)
        }

        // General related

        if (msg.substring(0,5) == '!help' && msg.substring(0,5) == command) {
            try {
                var help = {
                    // General
                    'avatar': {
                        helpcommand: '!avatar (user)',
                        description: "View a user's discord avatar",
                        option: 'user: User you want to view (Has to be @user)',
                        example: '!avatar @Tienei#0000'
                    },
                    'changelog': {
                        helpcommand: '!changelog',
                        description: 'View update and fix for the bot',
                        option: 'None',
                        example: '!changelog'
                    },
                    'help': {
                        helpcommand: '!help (command)',
                        description: 'Get a full command list or view a specific command help',
                        option: 'command: Command help you wanted to see',
                        example: '!help osu'
                    },
                    'ping': {
                        helpcommand: '!ping',
                        description: 'Ping Bancho (probably making Bancho mad sometimes lol)',
                        option: 'None',
                        example: '!ping'
                    },
                    'report': {
                        helpcommand: '!report (error)',
                        description: 'Report an error or bug to the owner',
                        option: 'error: Type any error or bug you found',
                        example: '!report osu is broken'
                    },
                    'suggestion': {
                        helpcommand: '!suggestion (suggestion)',
                        description: 'Suggesting an idea for the bot to the owner',
                        option: 'error: Type any error or bug you found',
                        example: '!report osu is broken'
                    },
                    'bot': {
                        helpcommand: '!bot',
                        description: 'Get invitation of the bot',
                        option: 'None',
                        example: '!bot'
                    },
                    'ee': {
                        helpcommand: '!ee',
                        description: 'View how many easter eggs you have',
                        option: 'None',
                        example: '!ee'
                    },
                    'checkbot': {
                        helpcommand: '!checkbot',
                        description: 'Check the compatibility of the bot to the server permissions',
                        option: 'None',
                        example: '!checkbot'
                    },
                    'customcmd': {
                        helpcommand: '!customcmd (action) (command)',
                        description: 'Set a custom commands (Required Administration)',
                        option: 'action: ``add`` ``list`` ``remove``\ncommand: Set a command you liked (do ``!help definedvar`` for more information)',
                        example: '!customcmd add !hi Hello $0 and welcome to {server.name}'
                    },
                    // Fun
                    'hug': {
                        helpcommand: '!hug (user)',
                        description: 'Hug someone',
                        option: 'user: The name of the user (Discord)',
                        example: '!hug Tienei'
                    },
                    'cuddle': {
                        helpcommand: '!cuddle (user)',
                        description: 'Cuddle someone',
                        option: 'user: The name of the user (Discord)',
                        example: '!cuddle Tienei'
                    },
                    'slap': {
                        helpcommand: '!slap (user)',
                        description: 'Slap someone',
                        option: 'user: The name of the user (Discord)',
                        example: '!slap Tienei'
                    },
                    'kiss': {
                        helpcommand: '!kiss (user)',
                        description: 'Kiss someone (best not to kiss in public ;) )',
                        option: 'user: The name of the user (Discord)',
                        example: '!kiss Tienei'
                    },
                    'pat': {
                        helpcommand: '!pat (user)',
                        description: 'Pat someone',
                        option: 'user: The name of the user (Discord)',
                        example: '!pat Tienei'
                    },
                    // Osu
                    'osu': {
                        helpcommand: '!osu (username) (options)',
                        description: 'Get an osu!Standard profile',
                        option: 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the details of the player `(no param)`',
                        example: '!osu Tienei -d'
                    },
                    'taiko': {
                        helpcommand: '!taiko (username)',
                        description: 'Get an osu!Taiko profile',
                        option: 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)',
                        example: '!taiko Tienei'
                    },
                    'ctb': {
                        helpcommand: '!ctb (username)',
                        description: 'Get an osu!Catch the beat profile',
                        option: 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)',
                        example: '!ctb Tienei'
                    },
                    'mania': {
                        helpcommand: '!mania (username)',
                        description: 'Get an osu!Mania profile',
                        option: 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)',
                        example: '!mania Tienei'
                    },
                    'osutop': {
                        helpcommand: '!osutop (username) (options)',
                        description: "View a player's osu!Standard top play",
                        option: 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nAccuracy Play `(-a)`: Get a top accuracy play from top 100 `(Comparasion symbol, Number)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)\nPage `(-page)`: Get top 100 in a form of pages `(No param)`',
                        example: '!osutop Tienei -m HDHR'
                    },
                    'taikotop': {
                        helpcommand: '!taikotop (username) (options)',
                        description: "View a player's osu!Taiko top play",
                        option: 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nAccuracy Play `(-a)`: Get a top accuracy play from top 100 `(Comparasion symbol, Number)`',
                        example: '!taikotop Tienei -p 8'
                    },
                    'ctbtop': {
                        helpcommand: '!ctbtop (username) (options)',
                        description: "View a player's osu!Catch the beat top play",
                        option: 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nAccuracy Play `(-a)`: Get a top accuracy play from top 100 `(Comparasion symbol, Number)`',
                        example: '!ctbtop Tienei -p 9'
                    },
                    'maniatop': {
                        helpcommand: '!maniatop (username) (options)',
                        description: "View a player's osu!Mania top play",
                        option: 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nAccuracy Play `(-a)`: Get a top accuracy play from top 100 `(Comparasion symbol, Number)`',
                        example: '!maniatop Tienei -p 4'
                    },
                    'osutrack': {
                        helpcommand: '!osutrack (username)',
                        description: "Track a player's osu!Standard top 50 (Required Administration)",
                        option: 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)',
                        example: '!osutrack Tienei'
                    },
                    'osutracklist': {
                        helpcommand: '!osutracklist',
                        description: "Get a list of player being tracked in the channel",
                        option: 'None',
                        example: '!osutracklist'
                    },
                    'untrack': {
                        helpcommand: '!untrack (username)',
                        description: "Untrack a player from the database (Required Administration)",
                        option: 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)',
                        example: '!untrack Tienei'
                    },
                    'recent': {
                        helpcommand: '![recent|r] (username) (options)',
                        description: "Get player's most recent play",
                        option: 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nRecent Best `(-b)`: Get player most recent best from top 100 `(No param)`',
                        example: '!r Tienei -b'
                    },
                    'compare': {
                        helpcommand: '![compare|c] (username) ',
                        description: "Compare to the last play in the chat",
                        option: 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)',
                        example: '!c Tienei'
                    },
                    'osuset': {
                        helpcommand: '!osuset (username)',
                        description: 'Link your profile to an osu! player',
                        option: 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)',
                        example: '!osuset Tienei'
                    },
                    'osuavatar': {
                        helpcommand: '!osuavatar (username)',
                        description: "Get player's osu! avatar",
                        option: 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)',
                        example: '!osuavatar Tienei'
                    },
                    'osusig': {
                        helpcommand: '!osusig (username)',
                        description: "Generate a signature of a player's profile",
                        option: 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)',
                        example: '!osusig Tienei'
                    },
                    'map': {
                        helpcommand: '![map|m] (options)',
                        description: "Get details info of the map of the last play in the server",
                        option: 'Mods: details info of the map with mods `(Shorten mods)`',
                        example: '!m HDDT'
                    },
                    'calcpp': {
                        helpcommand: '!calcpp (map id) (mods) (acc) (combo) (miss)',
                        description: "Calculate a play's pp",
                        option: '**Needs all options to be calculated**',
                        example: '!calcpp 1157868 nomod 100 1642 0'
                    },
                    'scores': {
                        helpcommand: '!scores (map link) (username)',
                        description: "Get player's play on a specific map",
                        option: 'Map link: Just get a beatmap link\nusername: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)',
                        example: '!scores https://osu.ppy.sh/b/1157868 Cookiezi'
                    },
                    'acc': {
                        helpcommand: '!acc (300) (100) (50) (miss)',
                        description: "Accuracy calculator",
                        option: '**Needs all options to be calculated**',
                        example: '!acc 918 23 2 0'
                    },
                    'rec': {
                        helpcommand: '!rec',
                        description: "Recommends you an osu beatmap",
                        option: 'None',
                        example: '!rec'
                    },
                    //Akatsuki
                    'akatsuki': {
                        helpcommand: '!akatsuki (username) (options)',
                        description: 'Get an Akatuski Standard profile',
                        option: 'username: Akatsuki username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetails `(-d)`: Get all the details of the player `(no param)`',
                        example: '!akatsuki Tienei -d'
                    },
                    'akatr': {
                        helpcommand: '!akatr (username)',
                        description: "Get player's most recent play",
                        option: 'username: Akatsuki username of the player (Space replaced with "_" or just use quotation mark ``"``)',
                        example: '!akatr Tienei'
                    },
                    'akattop': {
                        helpcommand: '!akattop (username) (options)',
                        description: "View a player's Akatsuki Standard top play",
                        option: 'username: Akatsuki username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`',
                        example: '!akattop Tienei -p 8'
                    },
                    'akatavatar': {
                        helpcommand: '!akatavatar (username)',
                        description: "Get player's Akatsuki avatar",
                        option: 'username: Akatsuki username of the player (Space replaced with "_" or just use quotation mark ``"``)',
                        example: '!akatavatar Tienei'
                    },
                    'rxakatsuki': {
                        helpcommand: '!rxakatsuki (username) (options)',
                        description: 'Get a Relax Akatuski Standard profile',
                        option: 'username: Akatsuki username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetails `(-d)`: Get all the details of the player `(no param)`',
                        example: '!akatsuki Tienei -d'
                    },
                    'rxakatr': {
                        helpcommand: '!rxakatr (username)',
                        description: "Get player's most recent play",
                        option: 'username: Akatsuki username of the player (Space replaced with "_" or just use quotation mark ``"``)',
                        example: '!akatr Tienei'
                    },
                    'rxakattop': {
                        helpcommand: '!rxakattop (username) (options)',
                        description: "View a player's Relax Akatsuki Standard top play",
                        option: 'username: Akatsuki username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`',
                        example: '!akattop Tienei -p 8'
                    },
                    // Ripple
                    'ripple': {
                        helpcommand: '!ripple (username) (options)',
                        description: 'Get an  Ripple Standard profile',
                        option: 'username: Ripple username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the detailed of the player `(no param)`',
                        example: '!ripple Tienei -d'
                    },
                    'rippler': {
                        helpcommand: '!rippler (username)',
                        description: "Get player's most recent play",
                        option: 'username: Ripple username of the player (Space replaced with "_" or just use quotation mark ``"``)',
                        example: '!rippler Tienei'
                    },
                    'rippletop': {
                        helpcommand: '!rippletop (username) (options)',
                        description: "View a player's Ripple Standard top play",
                        option: 'username: Ripple username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`',
                        example: '!rippletop Tienei -p 8'
                    },
                    'rippleavatar': {
                        helpcommand: '!rippleavatar (username)',
                        description: "Get player's Ripple avatar",
                        option: 'username: Ripple username of the player (Space replaced with "_" or just use quotation mark ``"``)',
                        example: '!rippleavatar Tienei'
                    },
                    //Economy
                    'daily': {
                        helpcommand: '!daily (mention)',
                        description: "Get your daily award",
                        option: '`mention:`\n**none:** Get your daily award\n**mention:** Give your daily award to someone else `(discord user mention)`',
                        example: '!daily @Tienei#7463'
                    },
                    'bank': {
                        helpcommand: '!bank (type)',
                        description: "Global leaderboard of credit/rep or checking your credit",
                        option: '`type:`\n**repglobal:** Global leaderboard for rep\n**xpglobal:** Global leaderboard for xp\n**credit:** Your credit amounts `(no param)` or give it to someone else `(Number)`',
                        example: '!bank global'
                    },
                    'rep': {
                        helpcommand: '!rep (mention)',
                        description: "Check rep's availability or reputate someone",
                        option: "`mention:`\n**none:** Check rep's availability\n**mention:** Give someone else rep`(discord user mention)`",
                        example: '!rep @Tienei#7463'
                    },
                    'profile': {
                        helpcommand: '!profile (mention)',
                        description: "Get profile image (Not avatar)",
                        option: "`mention:`\n**none:** Get your profile image\n**mention:** Get someone else profile image `(discord user mention)`",
                        example: '!profile @Tienei#7463'
                    },
                    'rank': {
                        helpcommand: '!rank (mention)',
                        description: "Get rank image",
                        option: "`mention:`\n**none:** Get your rank image\n**mention:** Get someone else rank image `(discord user mention)`",
                        example: '!rank @Tienei#7463'
                    },
                    'mine': {
                        helpcommand: '!mine',
                        description: "Mining stuff",
                        option: "If you mine one of this up, you'll get:\n`Coal`: 4 credits\n`Iron`: 8 credits\n`Gold`: 16 credits\n`Diamond`: 36 credits\n`Opal`: 56 credits\n`Ruby`: 80 credits",
                        example: '!mine'
                    },
                    'background': {
                        helpcommand: '![background|bg] (type)',
                        description: "Buy a background, set a specific background or list of the backgrounds",
                        option: "`type:`\n**buy:** `profile` `rank` `levelup`\nBuy a specific background\n**set:** `profile` `rank` `levelup` `nickname` `description`\nSet a specific things\n**list:** List all types of backgrounds available",
                        example: '!background list'
                    },
                    'background buy': {
                        helpcommand: '!background buy (bg_type) (bg_name)',
                        description: "Buy a specific type of background",
                        option: "bg_type: `profile` `rank` `levelup`\nbg_name: The background's name",
                        example: '!background buy profile rem'
                    },
                    'background set': {
                        helpcommand: '!background set (type) (string)',
                        description: "Set a specific background or setting your nickname / description",
                        option: "type: `profile` `rank` `levelup` `nickname` `description`\nstring: `Background's name or string`",
                        example: '!background set profile rem\n!background set nickname Tiny'
                    },
                    'pickaxe': {
                        helpcommand: '!pickaxe',
                        description: "Buying pickaxe (100 credits) to add 10 durability to your pickaxe",
                        option: "None",
                        example: '!pickaxe'
                    },
                    //Other
                    'definevar': {
                        helpcommand: 'Defined Variable for Custom command',
                        description: 'user: ``selfname`` ``selfping`` ``selfcreatedtime`` ``selfpresence`` ``othercreatedtime`` ``otherpresence``\nchannel: ``selfname`` ``selflink`` ``members``\nserver: ``name`` ``members`` ``channels`` ``roles`` ``defaultchannel`` ``owner`` ``region`` ``createdtime``',
                        option: '{require:admin}: Need Administrator to enable the command\n{$N}: Get text in message seperated by space (Not include command)\n{send:channelname "message"}: Send to a channel with a specific message',
                        example: 'do ``!help customcmd``'
                    },
                    'osu -d calculation': {
                        helpcommand: 'Osu -d calculation',
                        description: 'Star: Avg stars of the top 50 plays\nAim: Aim stars play * (CS ^ 0.1 / 4 ^ 0.1)\nSpeed: Speed stars play * (BPM ^ 0.3 / 180 ^ 0.3) * (AR ^ 0.1 / 6 ^ 0.1)\nAccuracy: (Plays accuracy ^ 2.5 / 100 ^ 2.5) * 1.08 * Map stars * (OD ^ 0.03 / 6 ^ 0.03) * (HP ^ 0.03 / 6 ^ 0.03)',
                        option: 'None',
                        example: 'None'
                    }
                }
                var generalhelp = '**--- [General]:**\n`avatar` `changelog` `help` `ping` `report` `suggestion` `ee` `customcmd` `bot`'
                var funhelp = '**--- [Fun]:**\n`hug` `cuddle` `slap` `kiss` `pat`'
                var osuhelp = '**--- [osu!]:**\n`osu` `taiko` `ctb` `mania` `osutop` `taikotop` `ctbtop` `maniatop` `osutrack` `untrack` `map` `osuset` `osuavatar` `osusig` `recent` `compare` `calcpp` `scores` `acc` `rec`'
                var akatsukihelp = '**--- [Akatsuki]:**\n`akatsuki` `akatr` `akatavatar` `akattop` `rxakatsuki` `rxakatr` `rxakattop`'
                var ripplehelp = '**--- [Ripple]:**\n`ripple` `rippler` `rippleavatar` `rippletop`'
                var economyhelp = '**--- [Economy]:**\n`daily` `bank` `rep` `profile` `background` `mine` `rank` `pickaxe`'
                var otherhelp = '**--- [Other]:**\n`definevar` `osu -d calculation`'
                var text = ''
                if (msg.substring(6) == '') {
                    text = `${generalhelp}\n\n${funhelp}\n\n${osuhelp}\n\n${akatsukihelp}\n\n${ripplehelp}\n\n${economyhelp}\n\n${otherhelp}`
                } else {
                    var getcmd = msg.substring(6)
                    if (help[getcmd] == undefined) {
                        throw 'No command was found!'
                    }
                    if (getcmd == 'r') {
                        getcmd = 'recent'
                    }
                    if (getcmd == 'c') {
                        getcmd = 'compare'
                    }
                    if (getcmd == 'm') {
                        getcmd = 'map'
                    }
                    if (getcmd == 'bg') {
                        getcmd = 'background'
                    }
                    text = '```' + help[getcmd].helpcommand + '```' + `\n${help[getcmd].description}\n\n**---[Options]:**\n${help[getcmd].option}\n\n**---[Example]:**\n` + help[getcmd].example
                }
                const embed = new Discord.RichEmbed()
                .setAuthor(`Commands for Tiny Bot ${botver}`)
                .setColor(embedcolor)
                .setThumbnail(bot.user.avatarURL)
                .setDescription(text)
                message.channel.send({embed})
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        if(msg.substring(0,7) == '!credit' && msg.substring(0,7) == command) {
            const embed = new Discord.RichEmbed()
            .setAuthor(`Special thanks to:`)
            .setColor(embedcolor)
            .setThumbnail(bot.user.avatarURL)
            .setDescription(`
**--- Special helper ❤:**
Great Fog (!m, partial !osud, !acc, total pp in !osud, v3, !osutop -a)

**--- Command idea from:**
Yeong Yuseong (!calcpp, !compare sorted by pp, !r Map completion, !osutop -p with ranges, !suggestion, !osu -d common mods), 1OneHuman (!mosutop, !rosutop, !scores), Shienei (!c Unranked pp calculation), jpg (Time ago), lokser (!osu -d length avg), Xpekade (Economy)

**--- Tester:**
ReiSevia, Shienei, FinnHeppu, Hugger, rinku, Rosax, -Seoul, Rimu`)
            message.channel.send({embed})
        }

        if(msg.substring(0,7) == '!avatar' && msg.substring(0,7) == command) {
            var image = ''
            var username = ''
            if (msg.substring(8) == '') {
                image = message.author.avatarURL    
                username = message.author.username
            } else {
                user = message.mentions.users.first()
                if (user !== undefined) {
                    image = user.avatarURL
                    username = user.username
                }
            }
            const embed = new Discord.RichEmbed()
            .setAuthor(`Avatar for ${username}`)
            .setColor(embedcolor)
            .setImage(image)
            message.channel.send({embed})
        }

        if (msg.substring(0,10) == '!changelog' && msg.substring(0,10) == command) {
            const embed = new Discord.RichEmbed()
            .setAuthor(`Changelog for Tiny Bot ${botsubver}`)
            .setColor(embedcolor)
            .setThumbnail(bot.user.avatarURL)
            .setDescription(`
**Economy Update:**
Includes:
- Added !rep
- Added !daily
- Added !bank
- Added !background
- Added !mine
- Added !profile
- Added !rank
- Added !pickaxe

---------------------
**May Update:**
- Added !checkbot
- Added !osu -d length (Idea by lokser)
- Added !osu -d common mods (Idea by Yeong Yuseong)`)
            message.channel.send({embed})
        }

        if (msg.substring(0,4) == "!bot" && msg.substring(0,4) == command) {
            const embed = new Discord.RichEmbed()
            .setColor(embedcolor)
            .setThumbnail(bot.user.avatarURL)
            .setDescription(`**----- [Info]:**
Hello! I am Tiny Bot, a bot made by Tienei
こんにちは！ 私はTieneiによって作られたボット、Tiny Botです <:chinoHappy:450684046129758208>
**-----**
To get started, type **"!help"** to get a list of command and then type **"!help (command)"** to get more detailed information
If you wanted to help me improve, type **"!report"** or **"!suggestion"**
**-----**
Link to invite me: [invite](https://discordapp.com/api/oauth2/authorize?client_id=470496878941962251&permissions=378944&scope=bot)
My senpai server: [server](https://discord.gg/H2mQMxd)`)
            message.channel.send({embed})
        }

        if (msg.substring(0,5) == '!ping' && msg.substring(0,5) == command) {
            try {
                if (cooldown[message.author.id] !== undefined && cooldown[message.author.id].indexOf(command) !== -1) {
                    throw 'You need to wait 5 seconds before using this again!'
                }
                setCommandCooldown(command, 5000)
                async function Bancho() {
                    var timenow = Date.now()
                    var test = await osuApi.getUser({u: "peppy"})
                    var timelater = Date.now()
                    message.channel.send(`Bancho respond! **${timelater - timenow}ms**`) 
                }
                Bancho()
            } catch (error) {
                message.channel.send(String(error))
            }
        }
        
        if (msg.substring(0,7) == '!report' && msg.substring(0,7) == command && message.guild !== null) {
            try {
                if (cooldown[message.author.id] !== undefined && cooldown[message.author.id].indexOf(command) !== -1) {
                    throw 'You need to wait 30 seconds before using this again!'
                }
                setCommandCooldown(command, 30000)
                var error = message.content.substring(8)
                var channelid = message.channel.id
                var user = message.author.username
                var pfp = message.author.avatarURL
                const embed = new Discord.RichEmbed()
                .setAuthor(`Username: ${user}`, pfp)
                .setColor(embedcolor)
                .setDescription(`
Channel ID: **${channelid}**
Problem: ${error}`)
                bot.channels.get('564396177878155284').send({embed})
                message.channel.send('Error has been reported')
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        if (msg.substring(0,11) == '!suggestion' && msg.substring(0,11) == command && message.guild !== null) {
            try {
                if (cooldown[message.author.id] !== undefined && cooldown[message.author.id].indexOf(command) !== -1) {
                    throw 'You need to wait 30 seconds before using this again!'
                }
                setCommandCooldown(command, 30000)
                var suggestion = message.content.substring(12)
                var channelid = message.channel.id
                var user = message.author.username
                var pfp = message.author.avatarURL
                const embed = new Discord.RichEmbed()
                .setAuthor(`Username: ${user}`, pfp)
                .setColor(embedcolor)
                .setDescription(`
Channel ID: **${channelid}**
Suggestion: ${suggestion}`)
                bot.channels.get('564439362218229760').send({embed})
                message.channel.send('Suggestion has been reported')
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        if (msg.substring(0,8) == '!respond' && msg.substring(0,8) == command && message.author.id == "292523841811513348") {
            var start = 9
            var msgoption = message.content.split('"')
            var channelid = msgoption[2].split(" ")[1]
            var type = msgoption[2].split(" ")[2]
            var statuscode = msgoption[2].split(" ")[3]
            var defindcode = {
                'e0': 'Fixed',
                'e1': 'Currently being fixed',
                'e2': 'Unfixable',
                'spam': 'Spam',
                's0': 'Approved',
                's1': 'Disapproved'
            }
            if (type == "error") {
                const embed = new Discord.RichEmbed()
                .setAuthor(`${message.author.username} respond`, message.author.avatarURL)
                .setColor(embedcolor)
                .setDescription(`
Error: ${msgoption[1]}
Status: **${defindcode[statuscode]}**`)
                bot.channels.get(channelid).send({embed})
            }
            if (type == "suggest") {
                bot.channels.get(channelid).send(`Suggestion **"${msgoption[1]}"** has been **${defindcode[statuscode]}**`)
            }
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

        if (msg.substring(0,9) == '!checkbot' && msg.substring(0,9) == command && message.guild !== null) {
            var compatibility = []
            var permissions = ['SEND_MESSAGES', 'ATTACH_FILES', 'ADD_REACTIONS', 'EMBED_LINKS', 'READ_MESSAGE_HISTORY', 'USE_EXTERNAL_EMOJIS']
            for (var i in permissions) {
                if (message.guild.me.hasPermission(permissions[i]) == true) {
                    compatibility.push('✅')
                } else {
                    compatibility.push('❌')
                }
            }
            const embed = new Discord.RichEmbed()
            .setAuthor(`Compatibility for Tiny Bot ${botver} in ${message.guild.name}`)
            .setThumbnail(message.guild.iconURL)
            .setColor(embedcolor)
            .setDescription(`Send Message: ${compatibility[0]}
Attach Files: ${compatibility[1]}
Add Reactions: ${compatibility[2]}
Embed Links: ${compatibility[3]}
Read Message History: ${compatibility[4]}
Use External Emojis: ${compatibility[5]}`)
            message.channel.send({embed})
        }

        // Custom commands

        if (msg.substring(0,10) == '!customcmd' && msg.substring(0,10) == command && message.guild !== null) {
            try {
                if (message.member.hasPermission("ADMINISTRATOR") == false) {
                    throw 'You need to have administrator to set custom command'
                }
                var start = 11
                var option = ''
                for (var i = start; i <= msg.length; i++) {
                    if (msg.substr(i,1) == ' ' || msg.substr(i,1) == '') {
                        option = msg.substring(start,i)
                        start = i + 1
                        break
                    }
                }
                if (option == "add") {
                    var cmd = ""
                    var respond = ""
                    for (var i = start; i < msg.length; i++) {
                        if (msg.substr(i,1) == ' ') {
                            cmd = message.content.substring(start,i)
                            respond = message.content.substring(i+1)
                            break
                        }
                    }
                    if (customcmd[message.guild.id] !== undefined) {
                        if (customcmd[message.guild.id].find(savedcmd => savedcmd.cmd == cmd) !== undefined) {
                            customcmd[message.guild.id].find(savedcmd => savedcmd.cmd == cmd).respond = respond
                        } else {
                            customcmd[message.guild.id].push({cmd: cmd, respond: respond})
                        }
                    } else {
                        customcmd[message.guild.id] = [{cmd: cmd, respond: respond}]
                    }
                    message.channel.send('Custom command was added')
                    fs.writeFileSync('customcmd.txt', JSON.stringify(customcmd))
                    bot.channels.get('572585703989575683').send({files: [{
                    attachment: './customcmd.txt',
                    name: 'customcmd.txt'
                    }]})
                }
                if (option == "list") {
                    var savedcmd = ""
                    for (var i = 0; i < customcmd[message.guild.id].length; i++) {
                        savedcmd += "``" + customcmd[message.guild.id][i].cmd + "``: " + customcmd[message.guild.id][i].respond
                    }
                    const embed = new Discord.RichEmbed()
                    .setThumbnail(message.guild.iconURL)
                    .setColor(embedcolor)
                    .setDescription(savedcmd)
                    message.channel.send({embed})
                }
                if (option == "remove") {
                    var cmd = ""
                    for (var i = start; i <= msg.length; i++) {
                        if (msg.substr(i,1) == ' ' || msg.substr(i,1) == '') {
                            cmd = msg.substring(start,i)
                            break
                        }
                    }
                    if (customcmd[message.guild.id].length > 1) {
                        for (var i = 0; i < customcmd[message.guild.id].length; i++) {
                            if (customcmd[message.guild.id][i] == cmd) {
                                customcmd[message.guild.id].splice(i,1)
                            }
                        }
                    } else {
                        delete customcmd[message.guild.id]
                    }
                    message.channel.send('Custom command was removed')
                    fs.writeFileSync('customcmd.txt', JSON.stringify(customcmd))
                    bot.channels.get('572585703989575683').send({files: [{
                    attachment: './customcmd.txt',
                    name: 'customcmd.txt'
                    }]})
                }
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        if (message.guild !== null) {
            if (customcmd[message.guild.id] !== undefined && customcmd[message.guild.id].find(cmd => cmd.cmd == command) !== undefined) {
                try {
                    var respond = customcmd[message.guild.id].find(cmd => cmd.cmd == command).respond
                    var define = {
                        "user": {
                            "selfname": message.author.username,
                            "selfping": `<@${message.author.id}>`,
                            "selfcreatedtime": message.author.createdAt,
                            "selfpresence": message.author.presence.status,
                            "othercreatedtime": message.mentions.users.size > 0 ? message.mentions.users.first().createdAt : null,
                            "otherpresence": message.mentions.users.size > 0 ? message.mentions.users.first().presence.status : null
                        },
                        "channel": {
                            "selfname": message.channel.name,
                            "selflink": `<@${message.channel.id}>`,
                            "members": message.channel.members
                        },
                        "server": {
                            "name": message.guild.name,
                            "members": message.guild.members.filter(x => x.user.bot == false).size,
                            "bots": message.guild.members.filter(x => x.user.bot == true).size,
                            "channels": message.guild.channels.size,
                            "roles": message.guild.roles.size,
                            "defaultchannel": message.guild.defaultChannel,
                            "owner": message.guild.owner,
                            "region": message.guild.region,
                            "createdtime": message.guild.createdAt
                        }
                    }
                    var requireAdmin = false
                    for (var s = 0; s < respond.length; s++) {
                        if (respond.substr(s,1) == '{') {
                            for (var e = s; e < respond.length; e++) {
                                if (respond.substr(e,1) == '}') {
                                    var type = respond.substring(s+1,e)
                                    type = type.replace(".", " ")
                                    type = type.split(" ")
                                    if (type[0].substring(0,1) == "$") {
                                        var number = Number(type[0].substring(1))
                                        var option = message.content.split(" ", 10)
                                        option.splice(0,1)
                                        respond = respond.replace(respond.substring(s,e+1), option[number])
                                    } else if (type[0] == "require:admin") {
                                        requireAdmin = true
                                    } else {
                                        respond = respond.replace(respond.substring(s,e+1), define[type[0]][type[1]])
                                    }
                                    break
                                }
                            }
                        }
                    }
                    if (requireAdmin == true) {
                        if (message.member.hasPermission("ADMINISTRATOR") == false) {
                            throw "You need administrator enabled to use this!"
                        }
                    }
                    message.channel.send(respond)
                } catch (error) {
                    message.channel.send(String(error))
                }
            }
        }

        // Easter Egg

        if (msg.substring(0,3) == '!ee' && msg.substring(0,3) == command) {
            if (storedee[message.author.id] !== undefined) {
                var number = storedee[message.author.id]
                message.channel.send(`You have found: **${number.match(/1/g).length} easter egg(s)**`)
            } else {
                message.channel.send("You haven't found any!")
            }
        }

        if (ee[msg] !== undefined) {
            var number = eenumber
            if (storedee[message.author.id] == undefined) {
                storedee[message.author.id] = number
            }
            if (storedee[message.author.id].length < number.length) {
                storedee[message.author.id] = storedee[message.author.id].substring(0, storedee[message.author.id].length) + number.substring(storedee[message.author.id].length)
            }
            if (storedee[message.author.id].substring(ee[msg].bit, ee[msg].bit + 1) == '0') {
                storedee[message.author.id] = storedee[message.author.id].substring(0, ee[msg].bit) + "1" + storedee[message.author.id].substring(ee[msg].bit + 1)
                fs.writeFileSync('ee.txt', JSON.stringify(storedee))
                bot.channels.get('569168849992417315').send({files: [{
                    attachment: './ee.txt',
                    name: 'ee.txt'
                }]})
            }
            if (ee[msg].type == "normal") {
                message.channel.send(ee[msg].respond)   
            }
        }

        // Fun related

        async function tenor(start, search, action, aloneaction) {
           try {
                var text = ''
                if (msg.substring(start) !== '') {
                    if (msg.substring(start).includes('@') == true) {
                        var id = message.mentions.users.first().id
                        if (id == message.author.id) {
                            text = aloneaction
                        } else {
                            text = `<@${id}>, ${action} <@${message.author.id}>`
                        }
                    } else if (message.guild !== null) {
                        var member = message.guild.members.array()
                        for (var i = 0; i < message.guild.memberCount; i++) {
                            if (member[i].nickname !== null) {
                                if (member[i].nickname.substring(0, msg.length - start).toLowerCase() == msg.substring(start)) {
                                    var id = member[i].id
                                    text = `<@${id}>, ${action} <@${message.author.id}>`
                                    break
                                }
                            } else {
                                if (member[i].user.username.substring(0, msg.length - start).toLowerCase() == msg.substring(start)) {
                                    var id = member[i].id
                                    text = `<@${id}>, ${action} <@${message.author.id}>`
                                    break
                                }
                            }
                        }
                    }
                } else {
                    text = aloneaction
                }
                if (text == '') {
                    throw 'No user was found!'
                }
                var data = await request.get(`https://api.tenor.com/v1/search?q=${search}&key=LIVDSRZULELA&limit=10&media_filter=minimal&contentfilter=high`)
                var gif = JSON.parse(data)
                const embed = new Discord.RichEmbed()
                .setColor(embedcolor)
                .setDescription(text)
                .setImage(gif.results[Math.floor(Math.random()*9)].media[0].gif.url)
                message.channel.send({embed})
           } catch (error) {
               message.channel.send(String(error))
           }
        }

        if (msg.substring(0,4) == '!hug' && msg.substring(0,4) == command) {
            tenor(5, 'anime hug', 'you got a hug from', 'Sorry to see you alone...')
        }
        if (msg.substring(0,7) == '!cuddle' && msg.substring(0,7) == command) {
            tenor(8, 'anime cuddle', 'you got a cuddle from', 'Sorry to see you alone...')
        }
        if (msg.substring(0,5) == '!slap' && msg.substring(0,5) == command) {
            tenor(6, 'anime slap', 'you got a slap from', 'Are you trying to slap yourself?')
        }
        if (msg.substring(0,5) == '!kiss' && msg.substring(0,5) == command) {
            tenor(6, 'anime kiss', 'you got a kiss from', 'Are you trying to kiss yourself?')
        }
        if (msg.substring(0,4) == '!pat' && msg.substring(0,5) == command) {
            tenor(5, 'anime pat', 'you got a pat from', 'Pat pat')
        }
        if (msg.substring(0,5) == '!poke' && msg.substring(0,5) == command) {
            tenor(6, 'anime poke', 'you got a poke from', 'Poking yourself huh? Heh')
        }

        // Osu related

        var urlcommand = false
        
        function checkplayer(name) {
            if (name == '') {
                var osuname = ''
                if (cache[message.author.id] !== undefined) {
                    osuname = cache[message.author.id].osuname
                    return osuname
                } else {
                    return name
                }
            } else {
                var osuname = ''
                var id = ''
                if (name.includes('@') == true) {
                   var id = message.mentions.users.first().id
                   if (cache[id] !== undefined) {
                        osuname = cache[id].osuname
                        return osuname
                   } else {
                        return name
                   }
                } else {
                    return name
                }

            }
        }

        async function osu(mode) {
            try {
                if (cooldown[message.author.id] !== undefined && cooldown[message.author.id].indexOf(command) !== -1) {
                    throw 'You need to wait 3 seconds before using this again!'
                }
                setCommandCooldown(command, 3000)
                var check = ''
                var option = ''
                if (msg.includes('"') == true) {
                    option = msg.split('"')
                    check = option[1]
                    if (option[option.indexOf(check) - 1] == command + " ") {
                        option = option[2]
                    } else {
                        option = option[0]   
                    }
                    option = option.split(" ")
                    optionpos = 1
                } else {
                    option = msg.split(" ")
                    var cmdcheck = ['-d']
                    var optionpos = -1
                    if (cmdcheck.indexOf(option[2]) > -1) {
                        check = option[1]
                        optionpos = 2
                    } else if (cmdcheck.indexOf(option[1]) > -1) {
                        check = ''
                        optionpos = 1
                    } else {
                        if (option.length > 1) {
                            check = option[1]
                        } else {
                            check = ''
                        }
                    }
                }
                var d = (option[optionpos] == '-d')
                var name = checkplayer(check)
                if (d == true && mode == 0) {
                    var user = await osuApi.getUser({u: name, event_days: 31})
                    var best = await osuApi.getUserBest({u: name, limit: 50})
                    var event = ``
                    var star_avg = 0
                    var aim_avg = 0
                    var speed_avg = 0
                    var acc_avg = 0
                    var bpm_avg = 0
                    var cs_avg = 0
                    var ar_avg = 0
                    var od_avg = 0
                    var hp_avg = 0
                    var timetotal_avg = 0
                    var timedrain_avg = 0
                    var mod_avg_all = []
                    var mod_avg = []
                    var sortedmod = ''
                    var username = user.name
                    var acc = Number(user.accuracy).toFixed(2)
                    var userid = user.id
                    var pp = Number(user.pp.raw).toFixed(2);
                    var playcount = user.counts.plays
                    var rank = user.pp.rank
                    var countryrank = user.pp.countryRank
                    var country = user.country.toLowerCase();
                    var level = user.level
                    var rankedscore = user.scores.ranked
                    var totalscore = user.scores.total
                    var ss = Number(user.counts.SS) + Number(user.counts.SSH)
                    var s = Number(user.counts.S) + Number(user.counts.SH)
                    var a = Number(user.counts.A)
                    var totalrank = ss + s + a
                    var events = 0
                    if (user.events.length > 3) {
                        events = 3
                    } else {
                        events = user.events.length
                    }
                    for (var i = 0; i < events; i++) {
                        var text = user.events[i].html.replace(/(<([^>]+)>)/ig,"")
                        event += `\n ${text}`
                    }
                    for (var i = 0; i < 50; i++) {
                        var beatmapid = best[i][1].id
                        var mod = best[i][0].mods
                        var modandbit = mods(mod)
                        var count300 = Number(best[i][0].counts['300'])
                        var count100 = Number(best[i][0].counts['100'])
                        var count50 = Number(best[i][0].counts['50'])
                        var countmiss = Number(best[i][0].counts.miss)
                        var timetotal = Number(best[i][1].time.total)
                        var timedrain = Number(best[i][1].time.drain)
                        var scoreacc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                        var parser = await precalc(beatmapid)
                        var thing = ppcalc(parser,modandbit.bitpresent,0,0,0,0,0,0)
                        var detail = mapdetail(modandbit.shortenmod,0,Number(best[i][1].bpm),thing.cs,thing.ar,thing.od,thing.hp, timetotal, timedrain)
                        star_avg += thing.star.total
                        aim_avg += thing.star.aim * (Math.pow(detail.cs, 0.1) / Math.pow(4, 0.1))
                        speed_avg += thing.star.speed * (Math.pow(detail.bpm, 0.3) / Math.pow(180, 0.3)) * (Math.pow(detail.ar, 0.1) / (Math.pow(6, 0.1)))
                        acc_avg += (Math.pow(scoreacc, 2.5)/Math.pow(100, 2.5)) * 1.08 * thing.star.total * (Math.pow(detail.od, 0.03) / (Math.pow(6, 0.03)) * (Math.pow(detail.hp, 0.03) / (Math.pow(6, 0.03))))
                        bpm_avg += detail.bpm
                        cs_avg += detail.cs
                        ar_avg += detail.ar
                        od_avg += detail.od
                        hp_avg += detail.hp
                        timetotal_avg += detail.timetotal
                        timedrain_avg += detail.timedrain
                        if (modandbit.shortenmod == "+No Mod") {
                            mod_avg_all.push('No Mod')
                        } else {
                            for (var m = 0; m < modandbit.shortenmod.length-1; m+=2) {
                                mod_avg_all.push(modandbit.shortenmod.substr(m+1, 2))
                            }
                        }
                    }
                    timetotal_avg = Number(timetotal_avg / 50).toFixed(0)
                    timedrain_avg = Number(timedrain_avg / 50).toFixed(0)
                    var modtofind = ['No Mod','NF','EZ','TD','HD','HR','SD','DT','HT','NC','FL','SO','PF']
                    for (var i in modtofind) {
                        var count = 0
                        for (var m in mod_avg_all) {
                            if (mod_avg_all[m] == modtofind[i]) {
                                count += 1
                            }
                        }
                        if (count > 0) {
                            mod_avg.push({mod: modtofind[i], count: count})
                        }
                        count = 0
                    }
                    mod_avg.sort(function (a,b) {return b.count - a.count})
                    mod_avg.splice(3,3)
                    for (var i in mod_avg) {
                        sortedmod += '``' + mod_avg[i].mod + '``: ' + `${Number(mod_avg[i].count / mod_avg_all.length * 100).toFixed(2)}% `
                    }
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`osu! Statistics for ${username}`)
                    .setThumbnail(`http://s.ppy.sh/a/${userid}.png?date=${refresh}`)
                    .setColor(embedcolor)
                    .setDescription(`***Performance:***
**Global Rank:** #${rank} (:flag_${country}:: #${countryrank}) | ***${pp}pp***
**Level:** ${level}
**Accuracy:** ${acc}%
**Playcount:** ${playcount}
**Ranked Score:** ${rankedscore} | **Total Score:** ${totalscore}
<:rankingX:520932410746077184>: ${ss} (${Number(ss/totalrank*100).toFixed(2)}%) | <:rankingS:520932426449682432>: ${s} (${Number(s/totalrank*100).toFixed(2)}%) | <:rankingA:520932311613571072>: ${a} (${Number(a/totalrank*100).toFixed(2)}%)
        
***${username} recent events:***
${event}
        
***${username} average skill:***
Star: ${Number(star_avg/50).toFixed(2)}★
Aim skill: ${Number(aim_avg/50).toFixed(2) *2}★
Speed skill: ${Number(speed_avg/50).toFixed(2) *2}★
Accuracy skill: ${Number(acc_avg/50).toFixed(2)}★
Length: (Total: ${Math.floor(timetotal_avg / 60)}:${('0' + (timetotal_avg - Math.floor(timetotal_avg / 60) * 60)).slice(-2)}, Drain: ${Math.floor(timedrain_avg / 60)}:${('0' + (timedrain_avg - Math.floor(timedrain_avg / 60) * 60)).slice(-2)})
BPM: ${Number(bpm_avg/50).toFixed(0)} / CS: ${Number(cs_avg/50).toFixed(2)} / AR: ${Number(ar_avg/50).toFixed(2)} / OD: ${Number(od_avg/50).toFixed(2)} / HP: ${Number(hp_avg/50).toFixed(2)}
Most common mods: ${sortedmod}`)
                    message.channel.send({embed});
                } else {
                    var user = await osuApi.getUser({u: name, m: mode})
                    var modename = ''
                    if (mode == 0) {
                        modename = 'Standard'
                    } else if (mode == 1) {
                        modename = 'Taiko'
                    } else if (mode == 2) {
                        modename = 'CTB'
                    } else if (mode == 3) {
                        modename = 'Mania'
                    }
                    var username = user.name
                    if (username == undefined) {
                        throw 'User not found!'
                    }
                    var acc = Number(user.accuracy).toFixed(2)
                    var id = user.id
                    var pp = Number(user.pp.raw).toFixed(2);
                    var played = user.counts.plays
                    var rank = user.pp.rank
                    var countryrank = user.pp.countryRank
                    var country = user.country.toLowerCase();
                    var level = user.level
                    var ss = Number(user.counts.SS) + Number(user.counts.SSH)
                    var s = Number(user.counts.S) + Number(user.counts.SH)
                    var a = user.counts.A

                    const embed = new Discord.RichEmbed()
                    .setAuthor(`Osu!${modename} status for: ${username}`,'',`https://osu.ppy.sh/users/${id}`)
                    .setDescription(`
▸**Performance:** ${pp}pp 
▸**Rank:** #${rank} (:flag_${country}:: #${countryrank})
▸**Accuracy:** ${acc}%
▸**Play count:** ${played}
▸**Level:** ${level}
                
<:rankingX:520932410746077184>: ${ss}  <:rankingS:520932426449682432>: ${s}  <:rankingA:520932311613571072>: ${a} `)
                    .setThumbnail(`http://s.ppy.sh/a/${id}.png?date=${refresh}`)
                    .setColor(embedcolor)
                    message.channel.send({embed});
                }
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        async function osusig() {
            var option = ''
            if (msg.includes('"') == true) {
                option = msg.split('"')
                check = option[1]
            } else {
                option = msg.split(' ')
                if (option.length < 2) {
                    check = ''
                } else {
                    check = option[1]
                }
            }
            var check = option[1]
            var name = checkplayer(check)
            const embed = new Discord.RichEmbed()
            .setAuthor(`Signature for ${name}`)
            .setColor(embedcolor)
            .setImage(`http://lemmmy.pw/osusig/sig.php?colour=hex7f7fff&uname=${name}&pp=2&countryrank&onlineindicator=undefined&xpbar&xpbarhex&date=${refresh}`)
            message.channel.send({embed})
        }

        async function osuavatar() {
            var option = ''
            if (msg.includes('"') == true) {
                option = msg.split('"')
                check = option[1]
            } else {
                option = msg.split(' ')
                if (option.length < 2) {
                    check = ''
                } else {
                    check = option[1]
                }
            }
            var check = option[1]
            var user = await osuApi.apiCall('/get_user', {u: check})
            var username = user[0].username
            var id = user[0].user_id
            const embed = new Discord.RichEmbed()
            .setAuthor(`Avatar for ${username}`)
            .setColor(embedcolor)
            .setImage(`https://a.ppy.sh/${id}_1?date=${refresh}.png`)
            message.channel.send({embed})
        }

        async function osuset() {
            var option = ''
            if (msg.includes('"') == true) {
                option = msg.split('"')
                check = option[1]
            } else {
                option = msg.split(' ')
                if (option.length < 2) {
                    check = ''
                } else {
                    check = option[1]
                }
            }
            var check = option[1]
            var user = await osuApi.getUser({u: check})
            var name = user.name
            if (name == undefined) {
                throw 'Please enter a valid osu username! >:c'
            } else {
                if (cache.length = 0) {
                    cache[message.author.id] = {osuname: name}
                }
                if (cache[message.author.id] !== undefined) {
                    cache[message.author.id].osuname = name
                } else {
                    cache[message.author.id] = {osuname: name}
                }
                const embed = new Discord.RichEmbed()
                .setAuthor(`Your account has been linked to osu! username: ${name}`,'',`https://osu.ppy.sh/users/${user.id}`)
                .setColor(embedcolor)
                .setImage(`http://s.ppy.sh/a/${user.id}.png?date=${refresh}`)
                message.channel.send({embed})
                fs.writeFileSync('data.txt', JSON.stringify(cache))
                bot.channels.get('487482583362568212').send({files: [{
                    attachment: './data.txt',
                    name: 'data.txt'
                }]})
            }
        }

        async function recent() {
            try {
                if (cooldown[message.author.id] !== undefined && cooldown[message.author.id].indexOf(command) !== -1) {
                    throw 'You need to wait 3 seconds before using this again!'
                }
                setCommandCooldown(command, 3000)
                var check = ''
                var option = ''
                if (msg.includes('"') == true) {
                    option = msg.split('"')
                    check = option[1]
                    if (option[option.indexOf(check) - 1] == command + " ") {
                        option = option[2]
                    } else {
                        option = option[0]   
                    }
                    option = option.split(" ")
                    optionpos = 1
                } else {
                    option = msg.split(" ")
                    var cmdcheck = ['-b']
                    var optionpos = -1
                    if (cmdcheck.indexOf(option[2]) > -1) {
                        check = option[1]
                        optionpos = 2
                    } else if (cmdcheck.indexOf(option[1]) > -1) {
                        check = ''
                        optionpos = 1
                    } else {
                        if (option.length > 1) {
                            check = option[1]
                        } else {
                            check = ''
                        }
                    }
                }
                var b = (option[optionpos] == '-b')
                var name = checkplayer(check)
                if (b == true) {
                    var best = await osuApi.getUserBest({u: name, limit:100})
                    if (best.length == 0) {
                        throw `I think ${name} didn't play anything yet~ **-Chino**`
                    }
                    var userid = best[0][0].user.id
                    var user = await osuApi.getUser({u: userid})
                    var username = user.name
                    for (var i = 0; i < 100; i++) {
                        best[i][0].top = i+1
                    }
                    best.sort(function (a,b) {
                        a1 = Date.parse(a[0].date)
                        b1 = Date.parse(b[0].date)
                        return b1 - a1
                    })
                    var title = best[0][1].title
                    var diff = best[0][1].version
                    var beatmapid = best[0][1].id
                    var beatmapidfixed = best[0][1].beatmapSetId
                    var score = best[0][0].score
                    var count300 = Number(best[0][0].counts['300'])
                    var count100 = Number(best[0][0].counts['100'])
                    var count50 = Number(best[0][0].counts['50'])
                    var countmiss = Number(best[0][0].counts.miss)
                    var combo = best[0][0].maxCombo
                    var fc = best[0][1].maxCombo
                    var letter = best[0][0].rank
                    var rank = rankingletters(letter)
                    var pp = Number(best[0][0].pp).toFixed(2)
                    var mod = best[0][0].mods
                    var perfect = best[0][0].perfect
                    var modandbit = mods(mod)
                    var shortenmod = modandbit.shortenmod
                    var bitpresent = modandbit.bitpresent
                    var date = timeago(best[0][0].date)
                    if (message.guild !== null) {
                        storedmapid.push({id:beatmapid,server:message.guild.id})
                    } else {
                        storedmapid.push({id:beatmapid,user:message.author.id})
                    }
                    var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                    var parser = await precalc(beatmapid)     
                    var fccalc = ppcalc(parser,bitpresent,fc,count100,count50,0,acc,1)
                    var fcpp = Number(fccalc.pp.total).toFixed(2)
                    var fcacc = fccalc.acc
                    var star = Number(fccalc.star.total).toFixed(2)
                    var fcguess = ''
                    if (perfect == 0) {
                        fcguess = `| **${fcpp}pp for ${fcacc}%**`
                    }
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`Top ${best[0][0].top} osu!Standard play for ${username}:`, `http://s.ppy.sh/a/${userid}.png?date=${refresh}`)
                    .setThumbnail(`https://b.ppy.sh/thumb/${beatmapidfixed}l.jpg`)
                    .setColor(embedcolor)
                    .setDescription(`
**[${title}](https://osu.ppy.sh/b/${beatmapid})** (${star}★) ${shortenmod} | ***${pp}pp***
${rank} *${diff}* | **Scores:** ${score} | **Combo:** ${combo}/${fc}
**Accuracy:** ${acc}% [${count300}/${count100}/${count50}/${countmiss}] ${fcguess}
${date}
`)
                    message.channel.send({embed})
                } else {
                    var recent = await osuApi.getUserRecent({u: name, limit: 1})
                    if (recent.length == 0) {
                        throw 'No play found within 24 hours of this user **-Tiny**'
                    }
                    var getplayer = await osuApi.getUser({u: name})
                    var beatmapidfixed = recent[0][1].beatmapSetId
                    var beatmapid = recent[0][1].id
                    var scores = recent[0][0].score
                    var userid = recent[0][0].user.id
                    var beatmap = recent[0][1].title
                    var diff = recent[0][1].version
                    var count300 = Number(recent[0][0].counts['300'])
                    var count100 = Number(recent[0][0].counts['100'])
                    var count50 = Number(recent[0][0].counts['50'])
                    var countmiss = Number(recent[0][0].counts.miss)
                    var combo = recent[0][0].maxCombo   
                    var fc = recent[0][1].maxCombo
                    var mod = recent[0][0].mods
                    var letter = recent[0][0].rank
                    var rank = rankingletters(letter)
                    var perfect = recent[0][0].perfect
                    var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                    var modandbit = mods(mod)
                    var shortenmod = modandbit.shortenmod
                    var bitpresent = modandbit.bitpresent
                    var date = timeago(recent[0][0].date)
                    var parser = await precalc(beatmapid)
                    var recentcalc = ppcalc(parser,bitpresent,combo,count100,count50,countmiss,acc,0)
                    var star = Number(recentcalc.star.total).toFixed(2)
                    var pp = Number(recentcalc.pp.total).toFixed(2)
                    var nopp = ''
                    var end = recentcalc.star.objects[recentcalc.star.objects.length - 1].obj.time - recentcalc.star.objects[0].obj.time
                    var point = recentcalc.star.objects[count300 + count100 + count50 + countmiss - 1].obj.time - recentcalc.star.objects[0].obj.time
                    var mapcomplete = Number((point / end) * 100).toFixed(2)
                    var mapcompleted = ''
                    var osuname = getplayer.name
                    if (message.guild !== null) {
                        storedmapid.push({id:beatmapid,server:message.guild.id})
                    } else {
                        storedmapid.push({id:beatmapid,user:message.author.id})
                    }
                    var fccalc = ppcalc(parser,bitpresent,fc,count100,count50,0,acc,1)
                    var fcpp = Number(fccalc.pp.total).toFixed(2)
                    var fcacc = fccalc.acc
                    var fcguess = ``
                    if (letter == 'F') {
                        nopp = '(No pp)'
                        mapcompleted = `**Map Completion:** ${mapcomplete}%`
                        date = '| ' + date
                    }
                    if (perfect == 0) {
                        fcguess = `| **${fcpp}pp for ${fcacc}%**`
                    }
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`Most recent osu! Standard play for ${osuname}:`, `http://s.ppy.sh/a/${userid}.png?date=${refresh}`)
                    .setThumbnail(`https://b.ppy.sh/thumb/${beatmapidfixed}l.jpg`)
                    .setColor(embedcolor)
                    .setDescription(`
**[${beatmap}](https://osu.ppy.sh/b/${beatmapid})** (${star}★) ${shortenmod} | ***${pp}pp*** ${nopp}
${rank} *${diff}* | **Scores:** ${scores} | **Combo:** ${combo}/${fc}
**Accuracy:** ${acc}% [${count300}/${count100}/${count50}/${countmiss}] ${fcguess}
${mapcompleted} ${date}
`)
                    message.channel.send({embed})
                }
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        async function compare() {
            try {
                if (cooldown[message.author.id] !== undefined && cooldown[message.author.id].indexOf(command) !== -1) {
                    throw 'You need to wait 3 seconds before using this again!'
                }
                setCommandCooldown(command, 3000)
                var option = ''
                var check = ''
                if (msg.includes('"') == true) {
                    option = msg.split('"')
                    check = option[1]
                } else {
                    option = msg.split(' ')
                    if (option.length < 2) {
                        check = ''
                    } else {
                        check = option[1]
                    }
                }
                var name = checkplayer(check)
                var storedid = 0
                for (var i = storedmapid.length -1 ; i > -1; i--) {
                    if (message.guild !== null) {
                        if (storedmapid[i].server !== undefined) {
                            if (message.guild.id == storedmapid[i].server) {
                                storedid = storedmapid[i].id
                                break;
                            }
                        }
                    } else {
                        if (storedmapid[i].user !== undefined) {
                            if (message.author.id == storedmapid[i].user) {
                                storedid = storedmapid[i].id
                                break;
                            }
                        }
                    }
                }
                var scores = await osuApi.getScores({b: storedid, u: `${name}`})
                scores.sort(function (a,b) {
                    a1 = Number(a.pp)
                    b1 = Number(b.pp)
                    return b1 - a1
                })
                if (scores.length == 0) {
                    throw `${name} didn't play this map! D: **-Tiny**`
                }
                var beatmap = await osuApi.getBeatmaps({b: storedid})
                var highscore = ''
                var beatmapname = beatmap[0].title
                var diff = beatmap[0].version
                var beatmapimageid = beatmap[0].beatmapSetId
                var osuname = scores[0].user.name
                var osuid = scores[0].user.id
                var parser = await precalc(storedid)
                for (var i = 0; i <= scores.length - 1; i++) {
                    var score = scores[i].score
                    var count300 = Number(scores[i].counts['300'])
                    var count100 = Number(scores[i].counts['100'])
                    var count50 = Number(scores[i].counts['50'])
                    var countmiss = Number(scores[i].counts.miss)
                    var combo = scores[i].maxCombo
                    var fc = beatmap[0].maxCombo
                    var letter = scores[i].rank
                    var rank = rankingletters(letter)
                    var mod = scores[i].mods
                    var perfect = scores[i].perfect
                    var modandbit = mods(mod)
                    var shortenmod = modandbit.shortenmod
                    var bitpresent = modandbit.bitpresent
                    var date = timeago(scores[i].date)
                    var pp = Number(scores[i].pp).toFixed(2)
                    var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                    var unrankedpp = ''
                    if (beatmap[0].approvalStatus !== "Ranked" && beatmap[0].approvalStatus !== "Approved") {
                        var comparepp = ppcalc(parser,bitpresent,combo,count100,count50,countmiss,acc,0)
                        unrankedpp = `(Loved: ${Number(comparepp.pp.total).toFixed(2)}pp)`
                    }
                    var fccalc = ppcalc(parser,bitpresent,fc,count100,count50,0,acc,1)
                    var fcpp = Number(fccalc.pp.total).toFixed(2)
                    var fcacc = fccalc.acc
                    var star = Number(fccalc.star.total).toFixed(2)
                    var fcguess = ''
                    if (perfect == 0) {
                        fcguess = `| **${fcpp}pp for ${fcacc}%**`
                    }
                        highscore += `
${i+1}. **${shortenmod}** Score (${star}★) | ***${pp}pp*** ${unrankedpp}
${rank} **Score:** ${score} | **Combo:** ${combo}/${fc}
**Accuracy:** ${acc}% [${count300}/${count100}/${count50}/${countmiss}] ${fcguess}
${date}
`         
                }
                const embed = new Discord.RichEmbed()
                .setAuthor(`Top osu!Standard Plays for ${osuname} on ${beatmapname} [${diff}]`, `http://s.ppy.sh/a/${osuid}.png?=date${refresh}`)
                .setColor(embedcolor)
                .setThumbnail(`https://b.ppy.sh/thumb/${beatmapimageid}l.jpg`)
                .setDescription(highscore)
                message.channel.send({embed});
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        async function osutop(mode) {
            try {
                if (cooldown[message.author.id] !== undefined && cooldown[message.author.id].indexOf(command) !== -1) {
                    throw 'You need to wait 3 seconds before using this again!'
                }
                setCommandCooldown(command, 3000)
                var check = ''
                var top = ''
                var modename = ''
                var option = ''
                if (msg.includes('"') == true) {
                    option = msg.split('"')
                    check = option[1]
                    if (option[option.indexOf(check) - 1] == command + " ") {
                        option = option[2]
                    } else {
                        option = option[0]   
                    }
                    option = option.split(" ")
                    optionpos = 1
                } else {
                    option = msg.split(" ")
                    var cmdcheck = ['-p', '-r', '-m', '-a', '-g', '-page']
                    var optionpos = -1
                    if (cmdcheck.indexOf(option[2]) > -1) {
                        check = option[1]
                        optionpos = 2
                    } else if (cmdcheck.indexOf(option[1]) > -1) {
                        check = ''
                        optionpos = 1
                    } else {
                        if (option.length > 1) {
                            check = option[1]
                        } else {
                            check = ''
                        }
                    }
                }
                var p = (option[optionpos] == '-p')
                var r = (option[optionpos] == '-r')
                var m = (option[optionpos] == '-m')
                var a = (option[optionpos] == '-a')
                var g = (option[optionpos] == '-g')
                var page = (option[optionpos] == '-page')
                if (mode == 0) {
                    modename = 'Standard'
                }
                if (mode == 1) {
                    modename = 'Taiko'
                }
                if (mode == 2) {
                    modename = 'CTB'
                }
                if (mode == 3) {
                    modename = 'Mania'
                }
                var name = checkplayer(check)
                if (p == true && m == false && r == false && a == false && g == false && page == false) {
                    var numberoption = option[option.indexOf('-p') + 1]
                    var range = false
                    var numberrange = ''
                    if (numberoption.includes('-') == true) {
                        range = true
                        numberrange = numberoption.split('-')
                    } else {
                        numberrange = [numberoption, Number(numberoption)]
                    }
                    if (range == true && Math.abs(Number(numberrange[0]) - Number(numberrange[1])) > 4) {
                        throw 'Range limited to 5 top play'
                    }
                    var best = await osuApi.getUserBest({u: name, limit: Number(numberrange[1]), m: mode})
                    var userid = best[0][0].user.id
                    var user = await osuApi.getUser({u: name})
                    var username = user.name
                    for (var n = Number(numberrange[0]) - 1; n < Number(numberrange[1]) ; n++) {
                        var title = best[n][1].title
                        var diff = best[n][1].version
                        var beatmapid = best[n][1].id
                        var score = best[n][0].score
                        var count300 = Number(best[n][0].counts['300'])
                        var count100 = Number(best[n][0].counts['100'])
                        var count50 = Number(best[n][0].counts['50'])
                        var countmiss = Number(best[n][0].counts.miss)
                        var countgeki = Number(best[n][0].counts.geki)
                        var countkatu = Number(best[n][0].counts.katu)
                        var combo = best[n][0].maxCombo
                        var fc = best[n][1].maxCombo
                        var letter = best[n][0].rank
                        var rank = rankingletters(letter)
                        var pp = Number(best[n][0].pp).toFixed(2)
                        var mod = best[n][0].mods
                        var perfect = best[n][0].perfect
                        var modandbit = mods(mod)
                        var shortenmod = modandbit.shortenmod
                        var bitpresent = modandbit.bitpresent
                        var date = timeago(best[n][0].date)
                        if (message.guild !== null) {
                            storedmapid.push({id:beatmapid,server:message.guild.id})
                        } else {
                            storedmapid.push({id:beatmapid,user:message.author.id})
                        }
                        var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                        var star = 0
                        var accdetail = `[${count300}/${count100}/${count50}/${countmiss}]`
                        if (mode == 0) {
                            var parser = await precalc(beatmapid)
                            var fccalc = ppcalc(parser,bitpresent,fc,count100,count50,0,acc,1)
                            var fcpp = Number(fccalc.pp.total).toFixed(2)
                            var fcacc = fccalc.acc
                            star = Number(fccalc.star.total).toFixed(2)
                        }
                        if (mode == 1 || mode == 2 || mode == 3) {
                            fc = ''
                            star = Number(best[n][1].difficulty.rating).toFixed(2)
                        }
                        if (mode == 1) {
                            acc = Number((0.5 * count100 + count300) / (count300 + count100 + countmiss) * 100).toFixed(2)
                            accdetail = `[${count300}/${count100}/${countmiss}]`
                        }
                        if (mode == 2) {
                            acc = Number((count50 + count100 + count300) / (countkatu + countmiss + count50 + count100 + count300) * 100).toFixed(2)
                        }
                        if (mode == 3) {
                            acc = Number((50 * count50 + 100 * count100 + 200 * countkatu + 300 * (count300 + countgeki)) / (300 * (countmiss + count50 + count100 + countkatu + count300 + countgeki)) * 100).toFixed(2)
                            accdetail = `[${countgeki}/${count300}/${countkatu}/${count100}/${count50}/${countmiss}]`
                        }
                        var fcguess = ''
                        if (perfect == 0 && mode == 0) {
                            fcguess = `| **${fcpp}pp for ${fcacc}%**`
                        }
                        top += `
${n+1}. **[${title}](https://osu.ppy.sh/b/${beatmapid})** (${star}★) ${shortenmod} | ***${pp}pp***
${rank} *${diff}* | **Scores**: ${score} | **Combo:** ${combo}/${fc}
**Accuracy:** ${acc}% ${accdetail} ${fcguess}
${date}
`   
                    }
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`Top osu!${modename} Plays for ${username}`)
                    .setThumbnail(`http://s.ppy.sh/a/${userid}.png?date=${refresh}`)
                    .setColor(embedcolor)
                    .setDescription(top)
                    message.channel.send({embed});
                } else if (r == true && p == false && m == false && a == false && g == false && page == false && mode == 0) {
                    var best = await osuApi.getUserBest({u: name, limit:100})
                    if (best.length == 0) {
                        throw `I think ${name} didn't play anything yet~ **-Chino**`
                    }
                    var userid = best[0][0].user.id
                    var user = await osuApi.getUser({u: userid})
                    var username = user.name
                    for (var i = 0; i < 100; i++) {
                        best[i][0].top = i+1
                    }
                    best.sort(function (a,b) {
                        a1 = Date.parse(a[0].date)
                        b1 = Date.parse(b[0].date)
                        return a1 - b1
                    })
                    for (var i = best.length-1; i > best.length - 6; i--) {
                        var title = best[i][1].title
                        var diff = best[i][1].version
                        var beatmapid = best[i][1].id
                        var score = best[i][0].score
                        var count300 = Number(best[i][0].counts['300'])
                        var count100 = Number(best[i][0].counts['100'])
                        var count50 = Number(best[i][0].counts['50'])
                        var countmiss = Number(best[i][0].counts.miss)
                        var combo = best[i][0].maxCombo
                        var fc = best[i][1].maxCombo
                        var letter = best[i][0].rank
                        var rank = rankingletters(letter)
                        var pp = Number(best[i][0].pp).toFixed(2)
                        var mod = best[i][0].mods
                        var perfect = best[i][0].perfect
                        var modandbit = mods(mod)
                        var shortenmod = modandbit.shortenmod
                        var bitpresent = modandbit.bitpresent
                        var date = timeago(best[i][0].date)
                        if (message.guild !== null) {
                            storedmapid.push({id:beatmapid,server:message.guild.id})
                        } else {
                            storedmapid.push({id:beatmapid,user:message.author.id})
                        }
                        var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                        var parser = await precalc(beatmapid)     
                        var fccalc = ppcalc(parser,bitpresent,fc,count100,count50,0,acc,1)
                        var fcpp = Number(fccalc.pp.total).toFixed(2)
                        var fcacc = fccalc.acc
                        var star = Number(fccalc.star.total).toFixed(2)
                        var fcguess = ''
                        if (perfect == 0) {
                            fcguess = `| **${fcpp}pp for ${fcacc}%**`
                        }
                        top += `
${best[i][0].top}. **[${title}](https://osu.ppy.sh/b/${beatmapid})** (${star}★) ${shortenmod} | ***${pp}pp***
${rank} *${diff}* | **Scores**: ${score} | **Combo:** ${combo}/${fc}
**Accuracy:** ${acc}% [${count300}/${count100}/${count50}/${countmiss}] ${fcguess}
${date}
`
                    }
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`Top osu!Standard most recent plays for ${username}`)
                    .setThumbnail(`http://s.ppy.sh/a/${userid}.png?date=${refresh}`)
                    .setColor(embedcolor)
                    .setDescription(top)
                    message.channel.send({embed});
                } else if (m == true && p == false && r == false && a == false && g == false && page == false && mode == 0) {
                    var mod = []
                    var getmod = option[option.indexOf('-m') + 1]
                    var definemod = {
                        nf: 'NoFail',
                        ez: 'Easy',
                        td: 'TouchDevice',
                        hd: 'Hidden',
                        hr: 'HardRock',
                        sd: 'SuddenDeath',
                        dt: 'DoubleTime',
                        rx: 'Relax',
                        ht: 'HalfTime',
                        nc: 'Nightcore',
                        fl: 'Flashlight',
                        so: 'SpunOut',
                        nomod: 'No Mod'
                    }
                    for (var i = 0; i < getmod.length; i=i+2) {
                        if (definemod[getmod.substring(i, i+2)]) {
                            mod.push(definemod[getmod.substring(i, i+2)])
                        }
                        if (definemod[getmod.substring(i, i+5)]) {
                            mod.push(definemod[getmod.substring(i, i+5)])
                        }
                    }
                    var best = await osuApi.getUserBest({u: name, limit: 100})
                    var user = await osuApi.getUser({u: name})
                    var checktop = 0
                    var userid = best[0][0].user.id
                    var username = user.name
                    for (var i = 0; i < best.length; i++) {
                        var bestmod = best[i][0].mods
                        var match = false
                        if (mod.includes('No Mod') == true) {
                            if (bestmod.length == 0){
                                match = true
                            } else {match = false}
                        } else {
                            for (var m1 = 0; m1 < mod.length; m1++) {
                                if (bestmod.includes(mod[m1]) == true) {               
                                    match = true
                                } else { 
                                    match = false
                                    break; 
                                }
                                
                            }
                        }
                        if (match == true && checktop < 5) {
                            checktop += 1
                            var title = best[i][1].title
                            var diff = best[i][1].version
                            var beatmapid = best[i][1].id
                            var score = best[i][0].score
                            var count300 = Number(best[i][0].counts['300'])
                            var count100 = Number(best[i][0].counts['100'])
                            var count50 = Number(best[i][0].counts['50'])
                            var countmiss = Number(best[i][0].counts.miss)
                            var combo = best[i][0].maxCombo
                            var fc = best[i][1].maxCombo
                            var letter = best[i][0].rank
                            var rank = rankingletters(letter)
                            var pp = Number(best[i][0].pp).toFixed(2)
                            var perfect = best[i][0].perfect
                            var modandbit = mods(bestmod)
                            var shortenmod = modandbit.shortenmod
                            var bitpresent = modandbit.bitpresent
                            var date = timeago(best[i][0].date)
                            if (message.guild !== null) {
                                storedmapid.push({id:beatmapid,server:message.guild.id})
                            } else {
                                storedmapid.push({id:beatmapid,user:message.author.id})
                            }
                            var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                            var parser = await precalc(beatmapid)
                            var fccalc = ppcalc(parser,bitpresent,fc,count100,count50,0,acc,1)
                            var fcpp = Number(fccalc.pp.total).toFixed(2)
                            var fcacc = fccalc.acc
                            var star = Number(fccalc.star.total).toFixed(2)
                            var fcguess = ''
                            if (perfect == 0) {
                                fcguess = `| **${fcpp}pp for ${fcacc}%**`
                            }
                            top += `
${i+1}. **[${title}](https://osu.ppy.sh/b/${beatmapid})** (${star}★) ${shortenmod} | ***${pp}pp***
${rank} *${diff}* | **Scores**: ${score} | **Combo:** ${combo}/${fc}
**Accuracy:** ${acc}% [${count300}/${count100}/${count50}/${countmiss}] ${fcguess}
${date}
`
                        }
                    }
                    if (top.length == 0) {
                        top += `This user doesn't have any ${getmod.toUpperCase()} top play`
                    }
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`Top osu!Standard Plays with ${getmod.toUpperCase()} for ${username}`)
                    .setThumbnail(`http://s.ppy.sh/a/${userid}.png?date=${refresh}`)
                    .setColor(embedcolor)
                    .setDescription(top)
                    message.channel.send({embed});
                } else if (a == true && p == false && r == false && m == false && g == false && page == false && mode == 0) {
                    var best = await osuApi.getUserBest({u: name, limit: 100, m: mode})
                    var compare = option[option.indexOf('-a') + 1]
                    var compareacc = Number(option[option.indexOf('-a') + 2])
                    if (best.length == 0) {
                        throw `I think ${name} didn't play anything yet~ **-Chino**`
                    }
                    var userid = best[0][0].user.id
                    var user = await osuApi.getUser({u: userid})
                    var username = user.name
                    for (var i = 0; i < best.length; i++) {
                        best[i][0].top = i+1
                    }
                    for (var i = 0; i < best.length; i++) {
                        var count300 = Number(best[i][0].counts['300'])
                        var count100 = Number(best[i][0].counts['100'])
                        var count50 = Number(best[i][0].counts['50'])
                        var countmiss = Number(best[i][0].counts.miss)
                        var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100)
                        if (compare == ">" && acc < compareacc) {
                            best.splice(i, 1)
                            i -= 1
                        }
                        if (compare == "<" && acc > compareacc) {
                            best.splice(i, 1)
                            i -= 1
                        }
                    }
                    best.sort(function (a,b) {
                        var a_count300 = Number(a[0].counts['300'])
                        var a_count100 = Number(a[0].counts['100'])
                        var a_count50 = Number(a[0].counts['50'])
                        var a_countmiss = Number(a[0].counts.miss)
                        var b_count300 = Number(b[0].counts['300'])
                        var b_count100 = Number(b[0].counts['100'])
                        var b_count50 = Number(b[0].counts['50'])
                        var b_countmiss = Number(b[0].counts.miss)
                        var a1 = Number((300 * a_count300 + 100 * a_count100 + 50 * a_count50) / (300 * (a_count300 + a_count100 + a_count50 + a_countmiss)) * 100)
                        var b1 = Number((300 * b_count300 + 100 * b_count100 + 50 * b_count50) / (300 * (b_count300 + b_count100 + b_count50 + b_countmiss)) * 100)
                        return a1 - b1
                    })
                    for (var i = best.length-1; i > best.length - 6; i--) {
                        var title = best[i][1].title
                        var diff = best[i][1].version
                        var beatmapid = best[i][1].id
                        var score = best[i][0].score
                        var count300 = Number(best[i][0].counts['300'])
                        var count100 = Number(best[i][0].counts['100'])
                        var count50 = Number(best[i][0].counts['50'])
                        var countmiss = Number(best[i][0].counts.miss)
                        var combo = best[i][0].maxCombo
                        var fc = best[i][1].maxCombo
                        var letter = best[i][0].rank
                        var rank = rankingletters(letter)
                        var pp = Number(best[i][0].pp).toFixed(2)
                        var mod = best[i][0].mods
                        var perfect = best[i][0].perfect
                        var modandbit = mods(mod)
                        var shortenmod = modandbit.shortenmod
                        var bitpresent = modandbit.bitpresent
                        var date = timeago(best[i][0].date)
                        if (message.guild !== null) {
                            storedmapid.push({id:beatmapid,server:message.guild.id})
                        } else {
                            storedmapid.push({id:beatmapid,user:message.author.id})
                        }
                        var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                        var parser = await precalc(beatmapid)     
                        var fccalc = ppcalc(parser,bitpresent,fc,count100,count50,0,acc,1)
                        var fcpp = Number(fccalc.pp.total).toFixed(2)
                        var fcacc = fccalc.acc
                        var star = Number(fccalc.star.total).toFixed(2)
                        var fcguess = ''
                        if (perfect == 0) {
                            fcguess = `| **${fcpp}pp for ${fcacc}%**`
                        }
                        top += `
${best[i][0].top}. **[${title}](https://osu.ppy.sh/b/${beatmapid})** (${star}★) ${shortenmod} | ***${pp}pp***
${rank} *${diff}* | **Scores**: ${score} | **Combo:** ${combo}/${fc}
**Accuracy:** ${acc}% [${count300}/${count100}/${count50}/${countmiss}] ${fcguess}
${date}
`
                    }
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`Top osu!Standard best accuracy plays for ${username}`)
                    .setThumbnail(`http://s.ppy.sh/a/${userid}.png?date=${refresh}`)
                    .setColor(embedcolor)
                    .setDescription(top)
                    message.channel.send({embed});
                } else if (g == true && p == false && r == false && m == false && a == false && page == false) {
                    var best = await osuApi.getUserBest({u: name, limit: 100, m: mode})
                    var user = await osuApi.getUser({u: name})
                    var username = user.name
                    var gtpp = Number(option[option.indexOf('-g') + 1])
                    for (var i = best.length - 1; i > -1; i--) {
                        if (best[i][0].pp > gtpp) {
                            message.channel.send(`${username} has **${i+1} plays** worth more than **${gtpp}pp**`)
                            break
                        }
                        if (i < 1) {
                            message.channel.send(`${username} has **0 plays** worth more than **${gtpp}pp**`)
                            break
                        }
                    }
                } else if (page == true && g == false && p == false && r == false && m == false && a == false) {
                    var best = await osuApi.getUserBest({u: name, limit: 100, m: mode})
                    var userid = best[0][0].user.id
                    var user = await osuApi.getUser({u: name})
                    var username = user.name
                    var page = 1
                    var pages = []
                    async function loadpage() {
                        var gathering = ''
                        for (var n = 0; n < 5; n++) {
                            var i = (page - 1) * 5 - 1 + (n+1)
                            if ((page - 1) * 4 + n < best.length- 1) {
                                var title = best[i][1].title
                                var diff = best[i][1].version
                                var beatmapid = best[i][1].id
                                var score = best[i][0].score
                                var count300 = Number(best[i][0].counts['300'])
                                var count100 = Number(best[i][0].counts['100'])
                                var count50 = Number(best[i][0].counts['50'])
                                var countmiss = Number(best[i][0].counts.miss)
                                var countgeki = Number(best[i][0].counts.geki)
                                var countkatu = Number(best[i][0].counts.katu)
                                var combo = best[i][0].maxCombo
                                var fc = best[i][1].maxCombo
                                var letter = best[i][0].rank
                                var rank = rankingletters(letter)
                                var pp = Number(best[i][0].pp).toFixed(2)
                                var mod = best[i][0].mods
                                var perfect = best[i][0].perfect
                                var modandbit = mods(mod)
                                var shortenmod = modandbit.shortenmod
                                var bitpresent = modandbit.bitpresent
                                var date = timeago(best[i][0].date)
                                if (message.guild !== null) {
                                    storedmapid.push({id:beatmapid,server:message.guild.id})
                                } else {
                                    storedmapid.push({id:beatmapid,user:message.author.id})
                                }
                                var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                                var star = 0
                                var accdetail = `[${count300}/${count100}/${count50}/${countmiss}]`
                                if (mode == 0) {
                                    var parser = await precalc(beatmapid)
                                    var fccalc = ppcalc(parser,bitpresent,fc,count100,count50,0,acc,1)
                                    var fcpp = Number(fccalc.pp.total).toFixed(2)
                                    var fcacc = fccalc.acc
                                    star = Number(fccalc.star.total).toFixed(2)
                                }
                                if (mode == 1 || mode == 2 || mode == 3) {
                                    fc = ''
                                    star = Number(best[i][1].difficulty.rating).toFixed(2)
                                }
                                if (mode == 1) {
                                    acc = Number((0.5 * count100 + count300) / (count300 + count100 + countmiss) * 100).toFixed(2)
                                    accdetail = `[${count300}/${count100}/${countmiss}]`
                                }
                                if (mode == 2) {
                                    acc = Number((count50 + count100 + count300) / (countkatu + countmiss + count50 + count100 + count300) * 100).toFixed(2)
                                }
                                if (mode == 3) {
                                    acc = Number((50 * count50 + 100 * count100 + 200 * countkatu + 300 * (count300 + countgeki)) / (300 * (countmiss + count50 + count100 + countkatu + count300 + countgeki)) * 100).toFixed(2)
                                    accdetail = `[${countgeki}/${count300}/${countkatu}/${count100}/${count50}/${countmiss}]`
                                }
                                var fcguess = ''
                                if (perfect == 0 && mode == 0) {
                                    fcguess = `| **${fcpp}pp for ${fcacc}%**`
                                }
                                gathering += `
${i+1}. **[${title}](https://osu.ppy.sh/b/${beatmapid})** (${star}★) ${shortenmod} | ***${pp}pp***
${rank} *${diff}* | **Scores**: ${score} | **Combo:** ${combo}/${fc}
**Accuracy:** ${acc}% ${accdetail} ${fcguess}
${date}
`   
                            }
                        }
                        pages[page-1] = gathering
                    }
                    await loadpage()
                    var embed = new Discord.RichEmbed()
                    .setAuthor(`Top osu!${modename} Plays for ${username} (Page ${page} of ${Math.ceil(best.length / 5)})`)
                    .setThumbnail(`http://s.ppy.sh/a/${userid}.png?date=${refresh}`)
                    .setColor(embedcolor)
                    .setDescription(pages[page-1])
                    var msg1 = await message.channel.send({embed});
                    await msg1.react('⬅')
                    await msg1.react('➡')
                    var previousfilter = (reaction, user) => reaction.emoji.name == "⬅" && user.id == message.author.id
                    var nextfilter = (reaction, user) => reaction.emoji.name == "➡" && user.id == message.author.id
                    var previous = msg1.createReactionCollector(previousfilter, {time: 120000}) 
                    var next = msg1.createReactionCollector(nextfilter, {time: 120000})
                    previous.on('collect', reaction => {
                        if (page <= 1) {return}
                        page -= 1
                        embed.setAuthor(`Top osu!${modename} Plays for ${username} (Page ${page} of ${Math.ceil(best.length / 5)})`)
                        embed.setDescription(pages[page-1])
                        msg1.edit({embed})
                    })
                    next.on('collect', async reaction => {
                        if (page >= Math.ceil(best.length / 4)) {return}
                        page += 1
                        msg1.edit('Loading page...')
                        if (pages[page-1] == undefined) {
                            await loadpage()
                        }
                        embed.setAuthor(`Top osu!${modename} Plays for ${username} (Page ${page} of ${Math.ceil(best.length / 5)})`)
                        embed.setDescription(pages[page-1])
                        msg1.edit({embed})
                    })
                } else {
                    var best = await osuApi.getUserBest({u: name, limit: 5, m: mode})
                    var userid = best[0][0].user.id
                    var user = await osuApi.getUser({u: name})
                    var username = user.name
                    for (var i = 0; i < 5; i++) {
                        var title = best[i][1].title
                        var diff = best[i][1].version
                        var beatmapid = best[i][1].id
                        var score = best[i][0].score
                        var count300 = Number(best[i][0].counts['300'])
                        var count100 = Number(best[i][0].counts['100'])
                        var count50 = Number(best[i][0].counts['50'])
                        var countmiss = Number(best[i][0].counts.miss)
                        var countgeki = Number(best[i][0].counts.geki)
                        var countkatu = Number(best[i][0].counts.katu)
                        var combo = best[i][0].maxCombo
                        var fc = best[i][1].maxCombo
                        var letter = best[i][0].rank
                        var rank = rankingletters(letter)
                        var pp = Number(best[i][0].pp).toFixed(2)
                        var mod = best[i][0].mods
                        var perfect = best[i][0].perfect
                        var modandbit = mods(mod)
                        var shortenmod = modandbit.shortenmod
                        var bitpresent = modandbit.bitpresent
                        var date = timeago(best[i][0].date)
                        if (message.guild !== null) {
                            storedmapid.push({id:beatmapid,server:message.guild.id})
                        } else {
                            storedmapid.push({id:beatmapid,user:message.author.id})
                        }
                        var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                        var star = 0
                        var accdetail = `[${count300}/${count100}/${count50}/${countmiss}]`
                        if (mode == 0) {
                            var parser = await precalc(beatmapid)
                            var fccalc = ppcalc(parser,bitpresent,fc,count100,count50,0,acc,1)
                            var fcpp = Number(fccalc.pp.total).toFixed(2)
                            var fcacc = fccalc.acc
                            star = Number(fccalc.star.total).toFixed(2)
                        }
                        if (mode == 1 || mode == 2 || mode == 3) {
                            fc = ''
                            star = Number(best[i][1].difficulty.rating).toFixed(2)
                        }
                        if (mode == 1) {
                            acc = Number((0.5 * count100 + count300) / (count300 + count100 + countmiss) * 100).toFixed(2)
                            accdetail = `[${count300}/${count100}/${countmiss}]`
                        }
                        if (mode == 2) {
                            acc = Number((count50 + count100 + count300) / (countkatu + countmiss + count50 + count100 + count300) * 100).toFixed(2)
                        }
                        if (mode == 3) {
                            acc = Number((50 * count50 + 100 * count100 + 200 * countkatu + 300 * (count300 + countgeki)) / (300 * (countmiss + count50 + count100 + countkatu + count300 + countgeki)) * 100).toFixed(2)
                            accdetail = `[${countgeki}/${count300}/${countkatu}/${count100}/${count50}/${countmiss}]`
                        }
                        var fcguess = ''
                        if (perfect == 0 && mode == 0) {
                            fcguess = `| **${fcpp}pp for ${fcacc}%**`
                        }
                        top += `
${i+1}. **[${title}](https://osu.ppy.sh/b/${beatmapid})** (${star}★) ${shortenmod} | ***${pp}pp***
${rank} *${diff}* | **Scores**: ${score} | **Combo:** ${combo}/${fc}
**Accuracy:** ${acc}% ${accdetail} ${fcguess}
${date}
`   
                    }
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`Top osu!${modename} Plays for ${username}`)
                    .setThumbnail(`http://s.ppy.sh/a/${userid}.png?date=${refresh}`)
                    .setColor(embedcolor)
                    .setDescription(top)
                    message.channel.send({embed});
                }
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        async function map(start){
            try {
                if (cooldown[message.author.id] !== undefined && cooldown[message.author.id].indexOf(command) !== -1) {
                    throw 'You need to wait 5 seconds before using this again!'
                }
                setCommandCooldown(command, 5000)
                var beatmapid = 0
                var mods = []
                if (msg.substring(start) == "") {
                    mods.push('No Mod')
                } else {
                    mods.push(msg.substring(start))
                }
                var bitpresent = 0
                for (var i = storedmapid.length -1 ; i > -1; i--) {
                    if (message.guild !== null) {
                        if (storedmapid[i].server !== undefined) {
                            if (message.guild.id == storedmapid[i].server) {
                                beatmapid = storedmapid[i].id
                                break;
                            }
                        }
                    } else {
                        if (storedmapid[i].user !== undefined) {
                            if (message.author.id == storedmapid[i].user) {
                                beatmapid = storedmapid[i].id
                                break;
                            }
                        }
                    }
                }
                var mod = {
                    nf: 1,
                    ez: 2,
                    td: 4,
                    hd: 8,
                    hr: 16,
                    dt: 64,
                    rx: 128,
                    ht: 256,
                    nc: 512,
                    fl: 1024,
                    so: 4096
                }
                var validmod = false
                for (var m = 0; m <= mods[0].length; m++) {
                    if (mod[mods[0].substr(m*2,2)]) {
                        bitpresent += mod[mods[0].substr(m*2,2)]
                        validmod = true
                    }
                }
                if (validmod == false) {
                    mods[0] = 'No Mod'
                }
                var map = await osuApi.getBeatmaps({b: beatmapid})
                var beatmapidfixed = map[0].beatmapSetId
                var title = map[0].title
                var mapper = map[0].creator
                var version = map[0].version
                var maxCombo = map[0].maxCombo
                var parser = await precalc(beatmapid)
                var acc95 = ppcalc(parser,bitpresent,maxCombo,0,0,0,95,0)
                var acc97 = ppcalc(parser,bitpresent,maxCombo,0,0,0,97,0)
                var acc99 = ppcalc(parser,bitpresent,maxCombo,0,0,0,99,0)
                var acc100 = ppcalc(parser,bitpresent,maxCombo,0,0,0,100,0)
                var detail = mapdetail(mods[0],map[0].time.total,map[0].bpm,acc100.cs, acc100.ar,acc100.od,acc100.hp)
                var totallength = Number(detail.length).toFixed(0)
                var bpm = Number(detail.bpm).toFixed(0)
                var ar = Number(detail.ar).toFixed(2)
                var od = Number(detail.od).toFixed(2)
                var hp = Number(detail.hp).toFixed(2)
                var cs = Number(detail.cs).toFixed(2)
                var time = `${Math.floor(totallength / 60)}:${('0' + (totallength - Math.floor(totallength / 60) * 60)).slice(-2)}`
                const embed = new Discord.RichEmbed()
                .setAuthor(`${title} by ${mapper}`,'',`https://osu.ppy.sh/b/${beatmapid}`)
                .setThumbnail(`https://b.ppy.sh/thumb/${beatmapidfixed}l.jpg`)
                .setColor(embedcolor)
                .setDescription(`
**Length:** ${time} **BPM:** ${bpm} **Mods:** ${mods[0].toUpperCase()}
**Download:** [map](https://osu.ppy.sh/d/${beatmapidfixed}) ([no vid](https://osu.ppy.sh/d/${beatmapidfixed}n))
<:difficultyIcon:507522545759682561> __${version}__  
**Difficulty:** ${Number(acc100.star.total).toFixed(2)}★ (Aim: ${Number(acc100.star.aim).toFixed(2) * 2}★, Speed: ${Number(acc100.star.speed).toFixed(2) * 2}★)
**Max Combo:** ${maxCombo}
**AR:** ${ar} / **OD:** ${od} / **HP:** ${hp} / **CS:** ${cs}
**PP:** | **95%**-${Number(acc95.pp.total).toFixed(2)}pp | **97%**-${Number(acc97.pp.total).toFixed(2)}pp | **99%**-${Number(acc99.pp.total).toFixed(2)}pp | **100%**-${Number(acc100.pp.total).toFixed(2)}pp`)
                message.channel.send({embed});
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        async function beatmapdetail() {
            try {
                var beatmapid = []
                var mods = []
                for (var m = 0; m < msg.length; m++) {
                    if (msg.substr(m,21) == 'https://osu.ppy.sh/b/') {
                        var data = msg.split("/")[4]
                        beatmapid.push(data.split(" ")[0])
                        if (msg.substring(0, msg.length).includes('?m=') == true) {
                            beatmapid[0] = msg.substring(msg.indexOf(beatmapid[0]), msg.indexOf('?m='))
                        }
                        if (data.split(" ")[1] !== undefined) {
                            mods.push(data.split(" ")[1])
                        } else {
                            mods.push('No Mod')
                        }
                        break
                    }
                    if (msg.substr(m,31) == 'https://osu.ppy.sh/beatmapsets/') {
                        var data = msg.split("/")[5]
                        beatmapid.push(data.split(" ")[0])
                        if (data.split(" ")[1] !== undefined) {
                            mods.push(data.split(" ")[1])
                        } else {
                            mods.push('No Mod')
                        }
                        break
                    }
                }
                for (i = 0; i < beatmapid.length; i++) {
                    var bitpresent = 0
                    var mod = {
                        nf: 1,
                        ez: 2,
                        td: 4,
                        hd: 8,
                        hr: 16,
                        dt: 64,
                        rx: 128,
                        ht: 256,
                        nc: 512,
                        fl: 1024,
                        so: 4096
                    }
                    var validmod = false
                    for (var m = 0; m <= mods[i].length; m++) {
                        if (mod[mods[i].substr(m*2,2)]) {
                            bitpresent += mod[mods[i].substr(m*2,2)]
                            validmod = true
                        }
                    }
                    if (validmod == false) {
                        mods[0] = 'No Mod'
                    }
                    var map = await osuApi.getBeatmaps({b: beatmapid[i]})
                    if (map.length == 0) {
                        throw 'Is this even a valid link?'
                    }
                    var beatmapidfixed = map[0].beatmapSetId
                    var title = map[0].title
                    var mapper = map[0].creator
                    var version = map[0].version
                    var maxCombo = map[0].maxCombo
                    var parser = await precalc(beatmapid[i])
                    var acc95 = ppcalc(parser,bitpresent,maxCombo,0,0,0,95,0)
                    var acc97 = ppcalc(parser,bitpresent,maxCombo,0,0,0,97,0)
                    var acc99 = ppcalc(parser,bitpresent,maxCombo,0,0,0,99,0)
                    var acc100 = ppcalc(parser,bitpresent,maxCombo,0,0,0,100,0)
                    var detail = mapdetail(mods[i],map[0].time.total,map[0].bpm,acc100.cs, acc100.ar,acc100.od,acc100.hp)
                    var totallength = Number(detail.length).toFixed(0)
                    var bpm = Number(detail.bpm).toFixed(0)
                    var ar = Number(detail.ar).toFixed(2)
                    var od = Number(detail.od).toFixed(2)
                    var hp = Number(detail.hp).toFixed(2)
                    var cs = Number(detail.cs).toFixed(2)
                    var time = `${Math.floor(totallength / 60)}:${('0' + (totallength - Math.floor(totallength / 60) * 60)).slice(-2)}`
                    if (message.guild !== null) {
                        storedmapid.push({id:beatmapid,server:message.guild.id})
                    } else {
                        storedmapid.push({id:beatmapid,user:message.author.id})
                    }
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`${title} by ${mapper}`,'',`https://osu.ppy.sh/b/${beatmapid[i]}`)
                    .setThumbnail(`https://b.ppy.sh/thumb/${beatmapidfixed}l.jpg`)
                    .setColor(embedcolor)
                    .setDescription(`
**Length:** ${time} **BPM:** ${bpm} **Mods:** ${mods[i].toUpperCase()}
**Download:** [map](https://osu.ppy.sh/d/${beatmapidfixed}) ([no vid](https://osu.ppy.sh/d/${beatmapidfixed}n))
<:difficultyIcon:507522545759682561> __${version}__  
**Difficulty:** ${Number(acc100.star.total).toFixed(2)}★ (Aim: ${Number(acc100.star.aim).toFixed(2) * 2}★, Speed: ${Number(acc100.star.speed).toFixed(2) * 2}★)
**Max Combo:** ${maxCombo}
**AR:** ${ar} / **OD:** ${od} / **HP:** ${hp} / **CS:** ${cs}
**PP:** | **95%**-${Number(acc95.pp.total).toFixed(2)}pp | **97%**-${Number(acc97.pp.total).toFixed(2)}pp | **99%**-${Number(acc99.pp.total).toFixed(2)}pp | **100%**-${Number(acc100.pp.total).toFixed(2)}pp`)
                message.channel.send({embed});
                }
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        async function calculateplay() {
            try {
                if (cooldown[message.author.id] !== undefined && cooldown[message.author.id].indexOf(command) !== -1) {
                    throw 'You need to wait 3 seconds before using this again!'
                }
                setCommandCooldown(command, 3000)
                var option = msg.split(" ")
                var beatmapid = option[1]
                var mods = [option[2]]
                var acc = Number(option[3])
                var combo = Number(option[4])
                var miss = Number(option[5])
                var bitpresent = 0
                var mod = {
                    nomod: 0,
                    nf: 1,
                    ez: 2,
                    td: 4,
                    hd: 8,
                    hr: 16,
                    dt: 64,
                    rx: 128,
                    ht: 256,
                    nc: 512,
                    fl: 1024,
                    so: 4096
                }
                for (var m = 0; m <= mods[0].length; m++) {
                    if (mod[mods[0].substr(m*2,2)]) {
                        bitpresent += mod[mods[0].substr(m*2,2)]
                    }
                }
                var map = await osuApi.getBeatmaps({b: beatmapid})
                if (map.length == 0) {
                    throw 'Please check the ID of the map is correct or not'
                }
                var parser = await precalc(beatmapid)
                var calc = ppcalc(parser,bitpresent,combo,0,0,miss,acc,0)
                var beatmapidfixed = map[0].beatmapSetId
                var title = map[0].title
                var mapper = map[0].creator
                var version = map[0].version
                const embed = new Discord.RichEmbed()
                    .setAuthor(`${title} by ${mapper}`,'',`https://osu.ppy.sh/b/${beatmapid}`)
                    .setThumbnail(`https://b.ppy.sh/thumb/${beatmapidfixed}l.jpg`)
                    .setColor(embedcolor)
                    .setDescription(`
Difficulty: *${version}*
With **${mods[0].toUpperCase()}**, **${acc}%** accuracy, **${combo}x** combo and **${miss}** miss:
-- **${Number(calc.pp.total).toFixed(2)}pp**`)
                message.channel.send({embed});
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        async function osuscore() {
            try {
                if (cooldown[message.author.id] !== undefined && cooldown[message.author.id].indexOf(command) !== -1) {
                    throw 'You need to wait 3 seconds before using this again!'
                }
                setCommandCooldown(command, 3000)
                urlcommand = true
                var beatmapid = 0
                var check = ''
                if (msg.substr(8,21) == 'https://osu.ppy.sh/b/') {
                    beatmapid = msg.split("/")[4].split(' ')[0]
                    if (msg.substring(0, msg.length).includes('?m=') == true) {
                        beatmapid = msg.substring(msg.indexOf(beatmapid), msg.indexOf('?m='))
                    }
                }
                if (msg.substr(8,31) == 'https://osu.ppy.sh/beatmapsets/') {
                    beatmapid = msg.split("/")[5].split(' ')[0]
                }
                var option = ''
                if (msg.includes('"') == true) {
                    option = msg.split('"')
                    check = option[1]
                } else {
                    option = msg.split(' ')
                    if (option.length < 3) {
                        check = ''
                    } else {
                        check = option[2]
                    }
                }
                var name = checkplayer(check)
                var scores = await osuApi.getScores({b: beatmapid, u: name})
                scores.sort(function (a,b) {
                    a1 = Number(a.pp)
                    b1 = Number(b.pp)
                    return b1 - a1
                })
                if (scores.length == 0) {
                    throw `${name} didn't play this map! D: **-Tiny**`
                }
                var beatmap = await osuApi.getBeatmaps({b: beatmapid})
                var highscore = ''
                var beatmapname = beatmap[0].title
                var diff = beatmap[0].version
                var beatmapimageid = beatmap[0].beatmapSetId
                var osuname = scores[0].user.name
                var osuid = scores[0].user.id
                var parser = await precalc(beatmapid)
                for (var i = 0; i < scores.length; i++) {
                    var score = scores[i].score
                    var count300 = Number(scores[i].counts['300'])
                    var count100 = Number(scores[i].counts['100'])
                    var count50 = Number(scores[i].counts['50'])
                    var countmiss = Number(scores[i].counts.miss)
                    var combo = scores[i].maxCombo
                    var fc = beatmap[0].maxCombo
                    var letter = scores[i].rank
                    var rank = rankingletters(letter)
                    var mod = scores[i].mods
                    var perfect = scores[i].perfect
                    var modandbit = mods(mod)
                    var shortenmod = modandbit.shortenmod
                    var bitpresent = modandbit.bitpresent
                    var date = timeago(scores[i].date)
                    var pp = Number(scores[i].pp).toFixed(2)
                    if (message.guild !== null) {
                        storedmapid.push({id:beatmapid,server:message.guild.id})
                    } else {
                        storedmapid.push({id:beatmapid,user:message.author.id})
                    }
                    var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                    var unrankedpp = ''
                    if (beatmap[0].approvalStatus !== "Ranked" && beatmap[0].approvalStatus !== "Approved") {
                        var comparepp = ppcalc(parser,bitpresent,combo,count100,count50,countmiss,acc,0)
                        unrankedpp = `(Loved: ${Number(comparepp.pp.total).toFixed(2)}pp)`
                    }
                    var fccalc = ppcalc(parser,bitpresent,fc,count100,count50,0,acc,1)
                    var fcpp = Number(fccalc.pp.total).toFixed(2)
                    var fcacc = fccalc.acc
                    var star = Number(fccalc.star.total).toFixed(2)
                    var fcguess = ''
                    if (perfect == 0) {
                        fcguess = `| **${fcpp}pp for ${fcacc}%**`
                    }
                        highscore += `
${i+1}. **${shortenmod}** Score (${star}★) | ***${pp}pp*** ${unrankedpp}
${rank} **Score:** ${score} | **Combo:** ${combo}/${fc}
**Accuracy:** ${acc}% [${count300}/${count100}/${count50}/${countmiss}] ${fcguess}
${date}
`         
                }
                const embed = new Discord.RichEmbed()
                .setAuthor(`Top osu!Standard Plays for ${osuname} on ${beatmapname} [${diff}]`, `http://s.ppy.sh/a/${osuid}.png?=date${refresh}`)
                .setColor(embedcolor)
                .setThumbnail(`https://b.ppy.sh/thumb/${beatmapimageid}l.jpg`)
                .setDescription(highscore)
                message.channel.send({embed});
                urlcommand = false
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        function acccalc() {
            var option = msg.split(" ")
            var count300 = Number(option[1])
            var count100 = Number(option[2])
            var count50 = Number(option[3])
            var countmiss = Number(option[4])
            var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
            message.channel.send(`**Accuracy:** ${acc}%`)

        }

        async function tourneydetail() {
            try {
                var error, respone, html = await request(message.embeds[0].url)
                const information = {
                    tourneyname: '',
                    tourneytype: '',
                    range: '',
                    prize: {},
                    score: '',
                    customrange: {}
                }
                var start = 0
                var clean = san(html, {allowedTags: []})
                if (clean.substring(17500).includes('tournament') == true) {
                    var name = message.embeds[0].title.indexOf('forums')
                    information.tourneyname = message.embeds[0].title.substring(0, name - 3)
                    var range = clean.toLowerCase().indexOf('range')
                    if (range == -1) {
                        range = clean.toLowerCase().indexOf('rank')
                    }
                    if (range == -1) {
                        information.range = "Can't get range data"
                    } 
                    if (range !== -1) {
                        for (var i = range; i < clean.length; i++) {
                            if (String(Number(clean.substr(i,1))) !== "NaN" && clean.substr(i,1) !== " ") {
                                start = i
                                break
                            }
                        }
                        for (var i = start; i < clean.length; i++) {
                            if (String(Number(clean.substr(i,1))) !== "NaN" && clean.substr(i,1) !== " ") {
                                start = i
                                break
                            }
                        }
                        for (var i = start; i < clean.length; i++) {
                            if (String(Number(clean.substr(i+1,1))) == "NaN" && clean.substr(i+1,1) !== "k" && clean.substr(i+1,1) !== "~"  && clean.substr(i+1,1) !== " "  && clean.substr(i+1,1) !== "-"  && clean.substr(i+1,1) !== "."  && clean.substr(i+1,1) !== ",") {
                                information.range = clean.substring(start,i)
                                break
                            }
                            if (clean.substr(i-1,2) == "k.") {
                                information.range = clean.substring(start,i)
                                break
                            }
                        }
                    }
                    var prize = clean.toLowerCase().indexOf('supporter')
                    var check = '1st'
                    if (prize !== -1) {
                        for (var p = 0; p < 5; p++) {
                            for (var i = prize; i > prize - 100; i--) {
                                if (clean.substring(i-3, i) == check) {
                                    information.prize[check] = clean.substring(prize+9,i+1)
                                    var plus = clean.toLowerCase().indexOf('badge', prize)
                                    if (plus > prize && plus < prize + 50) {
                                        information.prize[check] += ' + badge'
                                    }
                                    if (information.prize[check].toLowerCase().includes('place') == true) {
                                        var pos = information.prize[check].toLowerCase().indexOf('place')
                                        information.prize[check] =  information.prize[check].substring(pos+7)
                                    }
                                    prize = clean.toLowerCase().indexOf('supporter', prize + 10)
                                    break
                                }
                            }
                            if (p == 0) {
                                check = '2nd'
                            }
                            if (p == 1) {
                                check = '3rd'
                            }
                            if (p == 2) {
                                check = '4th'
                            }
                            if (p == 3) {
                                check = '5th'
                            }
                        }
                    }
                    for (var i = 1; i < 9; i++) {
                        if (clean.toLowerCase().includes(`${i}v${i}`) == true) {
                            information.tourneytype = `${i}v${i}`
                            break
                        }
                    }
                    if (clean.toLowerCase().includes('scorev2') == true || clean.toLowerCase().includes('score v2') == true) {
                        information.score = 'ScoreV2'
                    }
                    if (clean.toLowerCase().includes('scorev1') == true || clean.toLowerCase().includes('score v1') == true) {
                        information.score = 'ScoreV1'
                    }
                    // Init
                    if (information.score == ' ' || information.score == '' ) {
                        information.score = 'ScoreV2?'
                    }
                    var prizetext = ''
                    var prefix = '1st'
                    if (information.prize[prefix] !== undefined) {
                        for (var i = 0; i < 5; i++) {
                            if (information.prize[prefix] !== undefined) {
                                prizetext += `${prefix}: ${information.prize[prefix]}
                                `
                            }
                            if (i == 0) {
                                prefix = '2nd'
                            }
                            if (i == 1) {
                                prefix = '3rd'
                            }
                            if (i == 2) {
                                prefix = '4th'
                            }
                            if (i == 3) {
                                prefix = '5th'
                            }
                        }   
                    }
                    if (prizetext == '') {
                        prizetext = "Can't get prize data"
                    }
                    const embed = new Discord.RichEmbed()
                    .setAuthor(information.tourneyname)
                    .setColor(embedcolor)
                    .setDescription(`
**--- [tl;dr]**

**Range:** ${information.range}
**Type:** ${information.tourneytype}
**Score:** ${information.score}
**Prize:** 
${prizetext}`)
                    .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Osu%21Logo_%282015%29.svg/600px-Osu%21Logo_%282015%29.svg.png')
                    message.channel.send({embed})
                }
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        async function osutrack() {
            try {
                if (message.member.hasPermission("ADMINISTRATOR") == false) {
                    throw 'You need to have administrator to set osutrack'
                }
                var osuname = message.content.substring(10)
                var detected = false
                var user = await osuApi.getUser({u: osuname})
                var name = user.name
                var best = await osuApi.getUserBest({u: osuname, limit: 50})
                if (name == undefined) {
                    throw 'Please enter a valid osu username! >:c'
                } else {
                    for (var i = 0; i < track.length; i++) {
                        if (track[i].osuname == name) {
                            detected = true
                            if (track[i].trackonchannel.includes(message.channel.id) == true) {
                                track[i].osuname = name
                                track[i].top50pp = best[49][0].pp
                                track[i].lasttotalpp = user.pp.raw
                                track[i].lastrank = user.pp.rank
                                track[i].lastcountryrank = user.pp.countryRank
                                break
                            } else {
                                track[i].osuname = name
                                track[i].top50pp = best[49][0].pp
                                track[i].lasttotalpp = user.pp.raw
                                track[i].lastrank = user.pp.rank
                                track[i].lastcountryrank = user.pp.countryRank
                                track[i].trackonchannel.push(message.channel.id)
                                break
                            }
                        }
                    }
                    if (detected == false) {
                        track.push({"osuname":name,"top50pp":best[49][0].pp,"lasttotalpp":user.pp.raw,"lastrank":user.pp.rank,"lastcountryrank":user.pp.countryRank,"trackonchannel": [message.channel.id],"recenttimeplay": ""})
                    }
                    message.channel.send(`**${name}** is now being tracked on **#${message.channel.name}**`)
                    fs.writeFileSync('track.txt', JSON.stringify(track))
                    bot.channels.get('497302830558871552').send({files: [{
                        attachment: './track.txt',
                        name: 'track.txt'
                    }]})
                }
            } catch(error) {
                message.channel.send(String(error))
            }
        }

        async function untrack() {
            try {
                if (message.member.hasPermission("ADMINISTRATOR") == false) {
                    throw 'You need to have administrator to set untrack'
                }
                for (var i = 0; i < track.length; i++) {
                    if (track[i].osuname == message.content.substring(9)) {
                        if (track[i].trackonchannel.includes(message.channel.id) == true && track[i].trackonchannel.length > 1) {
                            track[i].trackonchannel.splice(track[i].trackonchannel.indexOf(message.channel.id), 1)
                            message.channel.send(`**${message.content.substring(9)}** has been removed from #${message.channel.name}`)
                            fs.writeFileSync('track.txt', JSON.stringify(track))
                            bot.channels.get('497302830558871552').send({files: [{
                                attachment: './track.txt',
                                name: 'track.txt'
                            }]})
                            break
                        } else {
                            track.splice(i,1)
                            message.channel.send(`**${message.content.substring(9)}** has been removed from #${message.channel.name}`)
                            fs.writeFileSync('track.txt', JSON.stringify(track))
                            bot.channels.get('497302830558871552').send({files: [{
                                attachment: './track.txt',
                                name: 'track.txt'
                            }]})
                            break
                        }
                        
                    }
                }
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        async function osutracklist() {
            var currentlytrack = ''
            for (var i = 0; i < track.length; i++) {
                if (track[i].trackonchannel.includes(message.channel.id) == true) {
                    currentlytrack += "``" + track[i].osuname + "`` "
                }
            }
            const embed = new Discord.RichEmbed()
            .setAuthor(`Player(s) currently being tracked on #${message.channel.name}`)
            .setColor(embedcolor)
            .setDescription(currentlytrack)
            message.channel.send(embed)
        }

        async function recommendation() {
            try {
                if (cooldown[message.author.id] !== undefined && cooldown[message.author.id].indexOf(command) !== -1) {
                    throw 'You need to wait 5 seconds before using this again!'
                }
                setCommandCooldown(command, 5000)
                if (cache[message.author.id] == undefined) {
                    throw "You didn't link your profile to osu"
                }
                var name = cache[message.author.id].osuname
                var best = await osuApi.getUserBest({u: name, limit: 50})
                var otherbest = ''
                var minPP = 0
                var averageAcc = 0
                var averageCombo = 0
                var averageMiss = 0
                for (var i = 0; i < best.length; i ++) {
                    minPP += Number(best[i][0].pp)
                    var count300 = Number(best[0][0].counts['300'])
                    var count100 = Number(best[0][0].counts['100'])
                    var count50 = Number(best[0][0].counts['50'])
                    var countmiss = Number(best[0][0].counts.miss)
                    averageAcc += Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100)
                    averageCombo += Number(best[i][1].maxCombo)
                    averageMiss += countmiss
                }
                minPP = minPP / best.length * 0.95
                var maxPP = minPP * 1.25
                averageAcc = averageAcc / best.length
                if (averageAcc > 100) {averageAcc = 100}
                averageCombo = Number((averageCombo / best.length * 1.9).toFixed(0))
                averageMiss = Number((averageMiss / best.length).toFixed(0))
                var pos = Math.floor(Math.random() * 49)
                var pickedTopPlay = best[pos][1].id
                var mod = mods(best[pos][0].mods).bitpresent
                var pick = Math.floor(Math.random() * 24.99)
                var topplayfrom = ''
                if (pick == 0) {
                    // Get own top play
                    averageAcc *= 1.02
                    for (var i = 0; i < 10; i++) {
                        var parser = await precalc(pickedTopPlay)
                        var recommend = ppcalc(parser, mod, best[pos][1].maxCombo, 0, 0, 0, averageAcc, 0)
                        if (recommend.pp.total >= minPP && recommend.pp.total <= maxPP && recommend.pp.total > best[pos][0].pp) {
                            topplayfrom = 'own'
                            break
                        } else {
                            pos = Math.floor(Math.random() * 49)
                            pickedTopPlay = best[pos][1].id
                            mod = mods(best[pos][0].mods).bitpresent
                        }
                    }
                } else if (pick > 0) {
                    averageAcc *= 0.99
                    // Get other top play
                    var beatmapTopPlay = await osuApi.getScores({b: pickedTopPlay, m: mod, limit: 100})
                    beatmapTopPlay.sort(function(a,b) {return Math.abs(minPP - a) - Math.abs(minPP - b)})
                    beatmapTopPlay.splice(49,50)
                    var getRandomPlayer = beatmapTopPlay[Math.floor(Math.random() * 49)].user.id
                    otherbest = await osuApi.getUserBest({u: getRandomPlayer, limit: 100})
                    otherbest.sort(function(a,b) {return Math.abs(minPP - a) - Math.abs(minPP - b)})
                    otherbest.splice(49,50)
                    pickedTopPlay = otherbest[pos][1].id
                    mod = mods(otherbest[pos][0].mods).bitpresent
                    for (var i = 0; i < 10; i++) {
                        // Mod Play
                        var parser = await precalc(pickedTopPlay)
                        var recommend = ppcalc(parser, mod, otherbest[pos][1].maxCombo, 0, 0, 0, averageAcc, averageMiss)
                        if (recommend.pp.total >= minPP && recommend.pp.total <= maxPP && otherbest[pos][1].maxCombo < averageCombo) {
                            topplayfrom = 'other'
                            break
                        }
                        // No mod play
                        mod = 0
                        recommend = ppcalc(parser, mod, otherbest[pos][1].maxCombo, 0, 0, 0, averageAcc, averageMiss)
                        if (recommend.pp.total >= minPP && recommend.pp.total <= maxPP && otherbest[pos][1].maxCombo < averageCombo) {
                            topplayfrom = 'other'
                            break
                        } else {
                            pos = Math.floor(Math.random() * 49)
                            pickedTopPlay = otherbest[pos][1].id
                            mod = mods(otherbest[pos][0].mods).bitpresent
                            
                        }
                    }
                }
            
                // Gather data
            
                var maprecommendeded = ''
                var misses = 0
                if (topplayfrom == 'own') {
                    maprecommendeded = best[pos]
                } else if (topplayfrom == 'other') {
                    maprecommendeded = otherbest[pos]
                    misses = averageMiss
                } else {
                    throw 'No recommended map was found'
                }
                var beatmapidfixed = maprecommendeded[1].beatmapSetId
                var title = maprecommendeded[1].title
                var mapper = maprecommendeded[1].creator
                var version = maprecommendeded[1].version
                var maxCombo = maprecommendeded[1].maxCombo
                var shortenmod = bittomods(mod)
                var parser = await precalc(pickedTopPlay)
                var acc95 = ppcalc(parser,mod,maxCombo,0,0,0,95,0)
                var acc97 = ppcalc(parser,mod,maxCombo,0,0,0,97,0)
                var acc99 = ppcalc(parser,mod,maxCombo,0,0,0,99,0)
                var acc100 = ppcalc(parser,mod,maxCombo,0,0,0,100,0)
                var pppredicttoget = ppcalc(parser,mod,maxCombo,0,0,0,averageAcc,misses)
                var detail = mapdetail(shortenmod,maprecommendeded[1].time.total,maprecommendeded[1].bpm,acc100.cs, acc100.ar,acc100.od,acc100.hp)
                var totallength = Number(detail.length).toFixed(0)
                var bpm = Number(detail.bpm).toFixed(0)
                var ar = Number(detail.ar).toFixed(2)
                var od = Number(detail.od).toFixed(2)
                var hp = Number(detail.hp).toFixed(2)
                var cs = Number(detail.cs).toFixed(2)
                var time = `${Math.floor(totallength / 60)}:${('0' + (totallength - Math.floor(totallength / 60) * 60)).slice(-2)}`
                const embed = new Discord.RichEmbed()
                .setAuthor(`${title} by ${mapper}`,'',`https://osu.ppy.sh/b/${pickedTopPlay}`)
                .setThumbnail(`https://b.ppy.sh/thumb/${beatmapidfixed}l.jpg`)
                .setColor(embedcolor)
                .setDescription(`
**Length:** ${time} **BPM:** ${bpm} **Mods:** ${shortenmod}
**Download:** [map](https://osu.ppy.sh/d/${beatmapidfixed}) ([no vid](https://osu.ppy.sh/d/${beatmapidfixed}n))
<:difficultyIcon:507522545759682561> __${version}__  
**Difficulty:** ${Number(acc100.star.total).toFixed(2)}★ (Aim: ${Number(acc100.star.aim).toFixed(2) * 2}★, Speed: ${Number(acc100.star.speed).toFixed(2) * 2}★)
**Max Combo:** ${maxCombo}
**AR:** ${ar} / **OD:** ${od} / **HP:** ${hp} / **CS:** ${cs}
**PP:** | **95%**-${Number(acc95.pp.total).toFixed(2)}pp | **97%**-${Number(acc97.pp.total).toFixed(2)}pp | **99%**-${Number(acc99.pp.total).toFixed(2)}pp | **100%**-${Number(acc100.pp.total).toFixed(2)}pp
**Predicted PP you'll get: ${Number(pppredicttoget.pp.total).toFixed(2)}pp**`)
                message.channel.send('Found 1 map')
                message.channel.send({embed});
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        // Other server (Akatsuki, Ripple) Function

        async function otherserveravatar(start, serverlink) {
            var data = await request.get(`https://${serverlink}/api/v1/users?name=${message.content.substring(start)}`)
            var user = JSON.parse(data)
            var username = user.username
            var id = user.id
            const embed = new Discord.RichEmbed()
            .setAuthor(`Avatar for ${username}`)
            .setColor(embedcolor)
            .setImage(`https://a.${serverlink}/${id}.png?date=${refresh}.png`)
            message.channel.send({embed})
        }

        async function otherserverosu(serverlink,linkoption) {
            try {
                if (cooldown[message.author.id] !== undefined && cooldown[message.author.id].indexOf(command) !== -1) {
                    throw 'You need to wait 3 seconds before using this again!'
                }
                setCommandCooldown(command, 3000)
                var check = ''
                var option = ''
                if (msg.includes('"') == true) {
                    option = msg.split('"')
                    check = option[1]
                    if (option[option.indexOf(check) - 1] == command + " ") {
                        option = option[2]
                    } else {
                        option = option[0]   
                    }
                    option = option.split(" ")
                    optionpos = 1
                } else {
                    option = msg.split(" ")
                    var cmdcheck = ['-d']
                    var optionpos = -1
                    if (cmdcheck.indexOf(option[2]) > -1) {
                        check = option[1]
                        optionpos = 2
                    } else if (cmdcheck.indexOf(option[1]) > -1) {
                        check = ''
                        optionpos = 1
                    } else {
                        if (option.length > 1) {
                            check = option[1]
                        } else {
                            check = ''
                        }
                    }
                }
                var d = (option[optionpos] == '-d')
                var servername = ''
                if (serverlink == 'akatsuki.pw') {
                    if (linkoption == '&rx=1') {
                        servername = 'Relax Akatsuki'
                    } else {
                        servername = 'Akatsuki'
                    }
                }
                if (serverlink == 'ripple.moe') {
                    servername = 'Ripple'
                }
                if (d == true && linkoption !== '&rx=1') {
                    var data1 = await request.get(`https://${serverlink}/api/v1/users/scores/best?name=${check}&mode=0&l=50`)
                    var data2 = await request.get(`https://${serverlink}/api/v1/users/whatid?name=${check}&mode=0`)
                    var best = JSON.parse(data1)
                    var user = JSON.parse(data2)
                    if (best.length == 0) {
                        throw 'Either invalid user or not enough top play to calcuate'
                    }
                    var star_avg = 0
                    var aim_avg = 0
                    var speed_avg = 0
                    var acc_avg = 0
                    var cs_avg = 0
                    var ar_avg = 0
                    var od_avg = 0
                    var hp_avg = 0
                    var userid = user.id
                    var username = user.username
                    var rank = user.std.global_leaderboard_rank
                    var country = user.country.toLowerCase()
                    var countryrank = null
                    var level = user.std.level
                    var pp = user.std.pp
                    var acc = Number(user.std.accuracy).toFixed(2)
                    var playcount = user.std.playcount
                    var rankedscore = user.std.ranked_score
                    var totalscore = user.std.total_score

                    for (var i = 0; i < 50; i++) {
                        var beatmapid = best.scores[i].beatmap.beatmap_id
                        var mod = best.scores[i].mods
                        var shortenmod = bittomods(mod)
                        var count300 = Number(best.scores[i].count_300)
                        var count100 = Number(best.scores[i].count_100)
                        var count50 = Number(best.scores[i].count_50)
                        var countmiss = Number(best.scores[i].count_miss)
                        var scoreacc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                        var parser = await precalc(beatmapid)
                        var thing = ppcalc(parser,mod,0,0,0,0,0,0)
                        var detail = mapdetail(shortenmod,0,0,thing.cs,thing.ar,thing.od,thing.hp)
                        star_avg += thing.star.total
                        aim_avg += thing.star.aim * (Math.pow(detail.cs, 0.1) / Math.pow(4, 0.1))
                        speed_avg += thing.star.speed
                        acc_avg += (Math.pow(scoreacc, 3)/Math.pow(100, 3)) * 1.1 * thing.star.total * (Math.pow(detail.od, 0.05) / (Math.pow(6, 0.05)))
                        cs_avg += detail.cs
                        ar_avg += detail.ar
                        od_avg += detail.od
                        hp_avg += detail.hp
                    }
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`${servername} Statistics for ${username}`)
                    .setThumbnail(`https://a.${serverlink}/${userid}.png?date=${refresh}`)
                    .setColor(embedcolor)
                    .setDescription(`***Performance:***
**Global Rank:** #${rank} (:flag_${country}:: #${countryrank}) | ***${pp}pp***
**Level:** ${level}
**Accuracy:** ${acc}%
**Playcount:** ${playcount}
**Ranked Score:** ${rankedscore} | **Total Score:** ${totalscore}

***${username} average skill:***
Star: ${Number(star_avg/50).toFixed(2)}★
Aim skill: ${Number(aim_avg/50).toFixed(2) *2}★
Speed skill: ${Number(speed_avg/50).toFixed(2) *2}★
Accuracy skill: ${Number(acc_avg/50).toFixed(2)}★
CS: ${Number(cs_avg/50).toFixed(2)} / AR: ${Number(ar_avg/50).toFixed(2)} / OD: ${Number(od_avg/50).toFixed(2)} / HP: ${Number(hp_avg/50).toFixed(2)}`)
                    message.channel.send({embed});
                } else {
                    var data = ''
                    if (linkoption == '&rx=1') {
                        data = await request.get(`https://${serverlink}/api/v1/users/rxfull?name=${check}&mode=0`)
                    } else {
                        data = await request.get(`https://${serverlink}/api/v1/users/full?name=${check}&mode=0`)
                    }
                    var user = JSON.parse(data)
                    var username = user.username
                    var id = user.id
                    var acc = Number(user.std.accuracy).toFixed(2)
                    var level = Number(user.std.level).toFixed(2)
                    var played = user.std.playcount
                    var pp = user.std.pp
                    var rank = user.std.global_leaderboard_rank
                    var countryrank = user.std.country_leaderboard_rank
                    var country = String(user.country).toLowerCase()
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`${servername} status for: ${username}`,'',`https://${serverlink}/u/${id}`)
                    .setDescription(`
▸**Performance:** ${pp}pp 
▸**Rank:** #${rank} (:flag_${country}:: #${countryrank})
▸**Accuracy:** ${acc}%
▸**Play count:** ${played}
▸**Level:** ${level}
`)
                .setThumbnail(`https://a.${serverlink}/${id}.png?date=${refresh}`)
                .setColor(embedcolor)
                    message.channel.send({embed});
                }
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        async function otherserverrecent(serverlink, linkoption) {
            try {
                if (cooldown[message.author.id] !== undefined && cooldown[message.author.id].indexOf(command) !== -1) {
                    throw 'You need to wait 3 seconds before using this again!'
                }
                setCommandCooldown(command, 3000)
                var option = ''
                var check = ''
                if (msg.includes('"') == true) {
                    option = msg.split('"')
                    check = option[1]
                } else {
                    option = msg.split(' ')
                    if (option.length < 2) {
                        check = ''
                    } else {
                        check = option[1]
                    }
                }
                var data1 = await request.get(`https://${serverlink}/api/v1/users/scores/recent?name=${check}${linkoption}`)
                var data2 = await request.get(`https://${serverlink}/api/v1/users/whatid?name=${check}`)
                var recent = JSON.parse(data1)
                var user = JSON.parse(data2)
                var servername = ''
                if (serverlink == 'akatsuki.pw') {
                    if (linkoption == '&rx=1') {
                        servername = 'Relax Akatsuki'
                    } else {
                        servername = 'Akatsuki'
                    }
                }
                if (serverlink == 'ripple.moe') {
                    servername = 'Ripple'
                }
                var userid = user.id
                var username = user.username
                var beatmapid = recent.scores[0].beatmap.beatmap_id
                var beatmapsetid = recent.scores[0].beatmap.beatmapset_id
                var beatmap = recent.scores[0].beatmap.song_name
                var score = recent.scores[0].score
                var combo = recent.scores[0].max_combo
                var fc = recent.scores[0].beatmap.max_combo
                var count300 = Number(recent.scores[0].count_300)
                var count100 = Number(recent.scores[0].count_100)
                var count50 = Number(recent.scores[0].count_50)
                var countmiss = Number(recent.scores[0].count_miss)
                var perfect = recent.scores[0].full_combo
                var letter = recent.scores[0].rank
                var rank = rankingletters(letter)
                var bit = recent.scores[0].mods
                var mods = bittomods(bit)   
                var acc = Number(recent.scores[0].accuracy).toFixed(2)
                var parser = await precalc(beatmapid)
                var recentcalc = ppcalc(parser,bit,combo,count100,count50,countmiss,acc,0)
                var star = Number(recentcalc.star.total).toFixed(2)
                var pp = Number(recentcalc.pp.total).toFixed(2)
                if (message.guild !== null) {
                    storedmapid.push({id:beatmapid,server:message.guild.id})
                } else {
                    storedmapid.push({id:beatmapid,user:message.author.id})
                }
                var fccalc = ppcalc(parser,bit,fc,count100,count50,0,acc,1)
                var fcpp = Number(fccalc.pp.total).toFixed(2)
                var fcacc = fccalc.acc
                var fcguess = ``
                var nopp = ''
                if (letter == 'F') {
                    nopp = '(No pp)'
                }
                if (perfect == 0 && linkoption !== '&rx=1') {
                    fcguess = `| **${fcpp}pp for ${fcacc}%**`
                }
                const embed = new Discord.RichEmbed()
                .setAuthor(`Most recent ${servername} play for ${username}:`, `https://a.${serverlink}/${userid}.png?date=${refresh}`)
                .setThumbnail(`https://b.ppy.sh/thumb/${beatmapsetid}l.jpg`)
                .setColor(embedcolor)
                .setDescription(`
**[${beatmap}](https://osu.ppy.sh/b/${beatmapid})** (${star}★) ${mods} | ***${pp}pp*** ${nopp}
${rank} **Scores:** ${score} | **Combo:** ${combo}/${fc}
**Accuracy:** ${acc}% [${count300}/${count100}/${count50}/${countmiss}] ${fcguess}`)
                message.channel.send({embed})
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        async function otherservertop(serverlink, linkoption) {
            try{
                if (cooldown[message.author.id] !== undefined && cooldown[message.author.id].indexOf(command) !== -1) {
                    throw 'You need to wait 3 seconds before using this again!'
                }
                setCommandCooldown(command, 3000)
                var check = ''
                var top = ''
                var option = ''
                if (msg.includes('"') == true) {
                    option = msg.split('"')
                    check = option[1]
                    if (option[option.indexOf(check) - 1] == command + " ") {
                        option = option[2]
                    } else {
                        option = option[0]   
                    }
                    option = option.split(" ")
                    optionpos = 1
                } else {
                    option = msg.split(" ")
                    var cmdcheck = ['-p']
                    var optionpos = -1
                    if (cmdcheck.indexOf(option[2]) > -1) {
                        check = option[1]
                        optionpos = 2
                    } else if (cmdcheck.indexOf(option[1]) > -1) {
                        check = ''
                        optionpos = 1
                    } else {
                        if (option.length > 1) {
                            check = option[1]
                        } else {
                            check = ''
                        }
                    }
                }
                var p = (option[optionpos] == '-p')
                var servername = ''
                if (serverlink == 'akatsuki.pw') {
                    if (linkoption == '&rx=1') {
                        servername = 'Relax Akatsuki'
                    } else {
                        servername = 'Akatsuki'
                    }
                }
                if (serverlink == 'ripple.moe') {
                    servername = 'Ripple'
                }
                if (p == true) {
                    var n = Number(option[option.indexOf('-p') + 1]) - 1
                    var data1 = await request.get(`https://${serverlink}/api/v1/users/scores/best?name=${check}&mode=0&l=${n}${linkoption}`)
                    var data2 = await request.get(`https://${serverlink}/api/v1/users/whatid?name=${check}`)
                    var best = JSON.parse(data1)
                    var user = JSON.parse(data2)
                    var userid = user.id
                    var title = best.scores[n].beatmap.song_name
                    var beatmapid = best.scores[n].beatmap.beatmap_id
                    var score = best.scores[n].score
                    var count300 = Number(best.scores[n].count_300)
                    var count100 = Number(best.scores[n].count_100)
                    var count50 = Number(best.scores[n].count_50)
                    var countmiss = Number(best.scores[n].count_miss)
                    var perfect = best.scores[n].full_combo
                    var combo = best.scores[n].max_combo
                    var fc = best.scores[n].beatmap.max_combo
                    var letter = best.scores[n].rank
                    var rank = rankingletters(letter)
                    var pp = Number(best.scores[n].pp).toFixed(2)
                    var mod = best.scores[n].mods
                    var shortenmod = bittomods(mod)
                    var date = timeago(best.scores[n].time)
                    if (message.guild !== null) {
                        storedmapid.push({id:beatmapid,server:message.guild.id})
                    } else {
                        storedmapid.push({id:beatmapid,user:message.author.id})
                    }
                    var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                    var parser = await precalc(beatmapid)
                    var fccalc = ppcalc(parser,mod,fc,count100,count50,0,acc,1)
                    var fcpp = Number(fccalc.pp.total).toFixed(2)
                    var fcacc = fccalc.acc
                    var fcguess = ``
                    if (perfect == 0 && linkoption !== '&rx=1') {
                        fcguess = `| **${fcpp}pp for ${fcacc}%**`
                    }
                    var star = Number(fccalc.star.total).toFixed(2)
                    top += `
${n+1}. **[${title}](https://osu.ppy.sh/b/${beatmapid})** (${star}★) ${shortenmod} | ***${pp}pp***
${rank} **Scores**: ${score} | **Combo:** ${combo}/${fc}
**Accuracy:** ${acc}% [${count300}/${count100}/${count50}/${countmiss}] ${fcguess}
${date}
`
                const embed = new Discord.RichEmbed()
                .setAuthor(`Top ${servername} Plays for ${check}`)
                .setThumbnail(`http://a.${serverlink}/${userid}.png?date=${refresh}`)
                .setColor(embedcolor)
                .setDescription(top)
                message.channel.send({embed});
                } else {
                    var data1 = await request.get(`https://${serverlink}/api/v1/users/scores/best?name=${check}&mode=0&l=5${linkoption}`)
                    var data2 = await request.get(`https://${serverlink}/api/v1/users/whatid?name=${check}`)
                    var best = JSON.parse(data1)
                    var user = JSON.parse(data2)
                    var userid = user.id
                    for (var i = 0; i < 5; i++) {
                        var title = best.scores[i].beatmap.song_name
                        var beatmapid = best.scores[i].beatmap.beatmap_id
                        var score = best.scores[i].score
                        var count300 = Number(best.scores[i].count_300)
                        var count100 = Number(best.scores[i].count_100)
                        var count50 = Number(best.scores[i].count_50)
                        var countmiss = Number(best.scores[i].count_miss)
                        var combo = best.scores[i].max_combo
                        var fc = best.scores[i].beatmap.max_combo
                        var letter = best.scores[i].rank
                        var rank = rankingletters(letter)
                        var pp = Number(best.scores[i].pp).toFixed(2)
                        var mod = best.scores[i].mods
                        var shortenmod = bittomods(mod)
                        var date = timeago(best.scores[i].time)
                        if (message.guild !== null) {
                            storedmapid.push({id:beatmapid,server:message.guild.id})
                        } else {
                            storedmapid.push({id:beatmapid,user:message.author.id})
                        }
                        var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                        var parser = await precalc(beatmapid)
                        var fccalc = ppcalc(parser,mod,fc,count100,count50,0,acc,1)
                        var fcpp = Number(fccalc.pp.total).toFixed(2)
                        var fcacc = fccalc.acc
                        var fcguess = ``
                        if (perfect == 0 && linkoption !== '&rx=1') {
                            fcguess = `| **${fcpp}pp for ${fcacc}%**`
                        }
                        var star = Number(fccalc.star.total).toFixed(2)
                        top += `
${i+1}. **[${title}](https://osu.ppy.sh/b/${beatmapid})** (${star}★) ${shortenmod} | ***${pp}pp***
${rank} **Scores**: ${score} | **Combo:** ${combo}/${fc}
**Accuracy:** ${acc}% [${count300}/${count100}/${count50}/${countmiss}] ${fcguess}
${date}
`                   }
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`Top ${servername} Plays for ${check}`)
                    .setThumbnail(`http://a.${serverlink}/${userid}.png?date=${refresh}`)
                    .setColor(embedcolor)
                    .setDescription(top)
                    message.channel.send({embed});
                }
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        // Osu

        if (msg.substring(0,4) == '!osu' && msg.substring(0,4) == command) {
            osu(0)
        }
        if (msg.substring(0,6) == '!taiko' && msg.substring(0,6) == command) {
            osu(1)
        }
        if (msg.substring(0,4) == '!ctb' && msg.substring(0,4) == command) {
            osu(2)
        }
        if (msg.substring(0,6) == '!mania' && msg.substring(0,6) == command) {
            osu(3)
        }
        if (msg.substring(0,7) == '!osusig' && msg.substring(0,7) == command) {
            osusig()
        }
        if (msg.substring(0,10) == '!osuavatar' && msg.substring(0,10) == command) {
            osuavatar()
        }
        if (msg.substring(0,7) == '!osuset' && msg.substring(0,7) == command) {
            osuset()
        }
        if (msg.substring(0,7) == '!recent' && msg.substring(0,7) == command) {
            recent(8)
        }
        if (msg.substring(0,2) == '!r' && msg.substring(0,2) == command) {
            recent(3)
        }
        if (msg.substring(0,7) == '!compare' && msg.substring(0,7) == command) {
            compare()
        }
        if (msg.substring(0,2) == '!c' && msg.substring(0,2) == command) {
            compare()
        }
        if (msg.substring(0,7) == '!osutop' && msg.substring(0,7) == command) {
            osutop(0)
        }
        if (msg.substring(0,9) == '!taikotop' && msg.substring(0,9) == command) {
            osutop(1)
        }
        if (msg.substring(0,7) == '!ctbtop' && msg.substring(0,7) == command) {
            osutop(2)
        }
        if (msg.substring(0,9) == '!maniatop' && msg.substring(0,9) == command) {
            osutop(3)
        }
        if (msg.substring(0,4) == '!map' && msg.substring(0,4) == command) {
            map(5)
        }
        if (msg.substring(0,2) == '!m' && msg.substring(0,2) == command) {
            map(3)
        }
        if (msg.substring(0,7) == '!calcpp' && msg.substring(0,7) == command) {
            calculateplay()
        }
        if (msg.substring(0,7) == '!scores' && msg.substring(0,7) == command) {
            osuscore()
        }
        if (msg.substring(0,4) == '!acc' && msg.substring(0,4) == command) {
            acccalc()
        }
        if (msg.substring(0,9) == '!osutrack' && msg.substring(0,9) == command && message.channel.name !== undefined) {
            osutrack()            
        }
        if (msg.substring(0,13) == '!osutracklist' && msg.substring(0,13) == command && message.channel.name !== undefined) {
            osutracklist()            
        }
        if (msg.substring(0,8) == '!untrack' && msg.substring(0,8) == command && message.channel.name !== undefined) {
            untrack()
        }
        if (msg.substring(0,84) == '!rec' && msg.substring(0,4) == command) {
            recommendation()
        }

        // Akatuski

        if (msg.substring(0,11) == '!akatavatar' && msg.substring(0,11) == command) {
            otherserveravatar(12,'akatsuki.pw')
        }
        if (msg.substring(0,9) == '!akatsuki' && msg.substring(0,9) == command) {
            otherserverosu('akatsuki.pw')
        }
        if (msg.substring(0,6) == '!akatr' && msg.substring(0,6) == command) {
            otherserverrecent('akatsuki.pw')
        }
        if (msg.substring(0,8) == '!akattop' && msg.substring(0,8) == command) {
            otherservertop('akatsuki.pw')
        }
        if (msg.substring(0,11) == '!rxakatsuki' && msg.substring(0,11) == command) {
            otherserverosu('akatsuki.pw', '&rx=1')
        }
        if (msg.substring(0,8) == '!rxakatr' && msg.substring(0,8) == command) {
            otherserverrecent('akatsuki.pw', '&rx=1')
        }
        if (msg.substring(0,10) == '!rxakattop' && msg.substring(0,10) == command) {
            otherservertop('akatsuki.pw', '&rx=1')
        }

        // Ripple

        if (msg.substring(0,13) == '!rippleavatar' && msg.substring(0,13) == command) {
            otherserveravatar(14,'ripple.moe')
        }
        if (msg.substring(0,7) == '!ripple' && msg.substring(0,7) == command) {
            otherserverosu('ripple.moe')
        }
        if (msg.substring(0,8) == '!rippler' && msg.substring(0,8) == command) {
            otherserverrecent('ripple.moe')
        }
        if (msg.substring(0,10) == '!rippletop' && msg.substring(0,10) == command) {
            otherservertop('ripple.moe')
        }

        // Detection
        var embed = message.embeds
        // Beatmap Detection
        if (urlcommand == false) {
            beatmapdetail()
        }
        // Tourney Detection
        if (embed.length > 0) {
            if (message.embeds[0].url.substring(0,43) == "https://osu.ppy.sh/community/forums/topics/" || message.embeds[0].url.substring(0,42) == "http://osu.ppy.sh/community/forums/topics/")
            tourneydetail()
        }

        // Economy
        
        var bgprofile = [{"name": "megumin", "link": "https://i.imgur.com/0AD3DrI.png", "credit": 2000},
                        {"name": "rem", "link": "https://i.imgur.com/cr5MbyB.png", "credit": 2000},
                        {"name": "chino", "link": "https://i.imgur.com/2fkmS19.png", "credit": 2000},
                        {"name": "default", "link": "https://i.imgur.com/m6tTSvi.png", "credit": 0},
                        {"name": "shooting star", "link": "https://i.imgur.com/ETuIQuq.png", "credit": 2000},
                        {"name": "cherry blossom", "link" : "https://i.imgur.com/8a9TB5u.png", "credit": 2000}]

        var bgrank = [{"name": "default", "link": "https://i.imgur.com/uznJK64.png", "credit": 0},
                    {"name": "rainbow", "link": "https://i.imgur.com/zALamkT.png", "credit": 2000},
                    {"name": "sidewalk", "link": "https://i.imgur.com/wnlHshg.png", "credit": 2000},
                    {"name": "sunrise", "link": "https://i.imgur.com/7cUpVWe.png", "credit": 2000},
                    {"name": "pink city", "link": "https://i.imgur.com/GTFbc3O.png", "credit": 2000}]

        var bglevelup = [{"name": "default", "link": "https://i.imgur.com/CyNeayl.png", "credit": 0}]

        async function xpleveler() {
            if (message.guild !== null) {
                if (cooldown[message.author.id] !== undefined && cooldown[message.author.id].indexOf('message') !== -1) {} else {
                    var user = economy.find(u => u.id == message.author.id)
                    if (user == undefined) {
                        economy.push(
                            {"id": message.author.id,
                            "xp": 0,
                            "totalxp": 0,
                            "level": 1,
                            "credit": 0,
                            "rep": 0,
                            "repcooldown": new Date().getTime(),
                            "dailycooldown": new Date().getTime(),
                            "dailycount": 0,
                            "purchased": {
                                "levelup": ["default"],
                                "profile": ["default"],
                                "rank": ["default"]
                            },
                            "equipped": {
                                "levelup": 'default',
                                "profile": 'default',
                                "rank": 'default',
                            },
                            "badge": [],
                            "pickaxe": 0,
                            "nickname": "",
                            "description": ""    
                        })
                        user = economy.find(u => u.id == message.author.id)
                    }
                    if (user !== undefined) {
                        var earn = (15 + Math.floor(Math.random()*5))
                        user.xp += earn
                        user.totalxp += earn
                        fs.writeFileSync('economy.txt', JSON.stringify(economy))
                        bot.channels.get('578105172237221889').send({files: [{
                            attachment: './economy.txt',
                            name: 'economy.txt'
                        }]})
                        setCommandCooldown('message', 60000)
                    }
                    if (user.xp > Math.floor(10 + 2 * Math.pow(user.level, 2) + 90 * user.level)) {
                        var awarded = Math.floor(10 + Math.pow(user.level, 1.5))
                        user.xp = user.xp - Math.floor(10 + 2 * Math.pow(user.level, 2) + 90 * user.level)
                        user.level += 1
                        user.credit += awarded
                        var background = await jimp.read(bglevelup.find(bg => bg.name == user.equipped.profile).link)
                        var overlay = await jimp.read('./image/bglevelupoverlay.png')
                        var avatar = await jimp.read(message.author.avatarURL)
                        var primer18 = await jimp.loadFont('./font/primer_18_white.fnt')
                        avatar.resize(48,48)
                        background.composite(overlay, 0, 0)
                        background.composite(avatar,21,12)
                        background.print(primer18,18,60,'Level up!')
                        background.print(primer18, 0, 81, {text: `LVL ${user.level}`, alignmentX: jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: jimp.VERTICAL_ALIGN_MIDDLE}, 90, 20)
                        background.write('./levelup.png')
                        message.channel.send(`${message.author.username}, you got awarded with ${awarded} credits!`,{
                            file: "./levelup.png"
                        })
                        fs.writeFileSync('economy.txt', JSON.stringify(economy))
                        bot.channels.get('578105172237221889').send({files: [{
                            attachment: './economy.txt',
                            name: 'economy.txt'
                        }]})
                    }
                }
            }
        }

        async function getEconomyProfile() {
            var discorduser = ''
            if (msg.substring(9) == "") {
                discorduser = message.author
            } else {
                discorduser = message.mentions.members.first().user
            }
            var user = economy.find(u => u.id == discorduser.id)
            var requirexp = Math.floor(10 + 2 * Math.pow(user.level, 2) + 90 * user.level)
            var globalrank = economy.sort(function (a,b) {return b.totalxp - a.totalxp})
            globalrank = globalrank.findIndex(u => u.id == discorduser.id) + 1
            var background = await jimp.read(bgprofile.find(bg => bg.name == user.equipped.profile).link)
            var overlay = await jimp.read('./image/bgprofileoverlay.png')
            var avatar = await jimp.read(discorduser.avatarURL)
            var primer22 = await jimp.loadFont('./font/primer_22_white_bold.fnt')
            var primer28 = await jimp.loadFont('./font/primer_28_white.fnt')
            var primer18 = await jimp.loadFont('./font/primer_18_white.fnt')
            var primer16 = await jimp.loadFont('./font/primer_16_white.fnt')
            var namew = jimp.measureText(primer22, discorduser.username) + 10
            var repw = jimp.measureText(primer18, `+${user.rep}rep`) + 12
            var mainbg = await new jimp(347,347, 'rgba(0,0,0,0)')
            var namebg = await new jimp(namew, 25, 'rgba(0,0,0,0.686)')
            var repbg = await new jimp(repw, 20, 'rgba(127,127,255,1)')
            namebg.print(primer22, 5, -2, discorduser.username)
            repbg.print(primer18, 5, 0, `+${user.rep}rep`)
            avatar.resize(96, 96)
            mainbg.composite(background, 3, 3)
            mainbg.composite(overlay, 0, 0)
            mainbg.composite(avatar, 24, 119)
            mainbg.composite(namebg, 122, 117)
            mainbg.composite(repbg, 122, 170)
            mainbg.print(primer28, 45, 216, "Level")
            mainbg.print(primer28, 22, 247, {text: String(user.level), alignmentX: jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: jimp.VERTICAL_ALIGN_MIDDLE}, 96, 24)
            mainbg.print(primer18, 133, 218, `EXP: ${user.xp}/${requirexp}`)
            mainbg.print(primer18, 133, 236, `Rank: #${globalrank}`)
            mainbg.print(primer18, 133, 253, `Credits: ¥${user.credit}`)
            if (user.nickname !== '') {
                var nicknamew = jimp.measureText(primer18, user.nickname) + 10
                var nicknamebg = await new jimp(nicknamew, 20, 'rgba(0,0,0,0.686)')
                nicknamebg.print(primer18, 5, 0, user.nickname)
                mainbg.composite(nicknamebg, 122, 146)
            }
            if (user.description !== '') {
                mainbg.print(primer16, 18, 276, user.description) 
            }
            mainbg.write('./profile.png')
            message.channel.send({
                file: "./profile.png"
            })
        }

        async function getEconomyRank() {
            var discorduser = ''
            if (msg.substring(6) == "") {
                discorduser = message.author
            } else {
                discorduser = message.mentions.members.first().user
            }
            var user = economy.find(u => u.id == discorduser.id)
            var requirexp = Math.floor(10 + 2 * Math.pow(user.level, 2) + 90 * user.level)
            var globalrank = economy.sort(function (a,b) {return b.totalxp - a.totalxp})
            globalrank = globalrank.findIndex(u => u.id == discorduser.id) + 1
            var background = await jimp.read(bgrank.find(bg => bg.name == user.equipped.rank).link)
            var overlay = await jimp.read('./image/bgrankoverlay.png')
            var avatar = await jimp.read(discorduser.avatarURL)
            var primer26 = await jimp.loadFont('./font/primer_26_white.fnt')
            var primer22 = await jimp.loadFont('./font/primer_22_white.fnt')
            var primer16 = await jimp.loadFont('./font/primer_16_white.fnt')
            var primer13 = await jimp.loadFont('./font/primer_13_black_bold.fnt')
            avatar.resize(80, 80)
            background.composite(overlay, 0, 0)
            background.composite(avatar, 15, 10)
            background.print(primer22, 100, 4, discorduser.username)
            background.print(primer13, 99, 28, {text: `XP: ${user.xp}/${requirexp}`, alignmentX: jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: jimp.VERTICAL_ALIGN_MIDDLE}, 215, 10)
            background.print(primer26, 101, 34, `Level: ${user.level}`)
            background.print(primer16, 101, 59, `Rank: #${globalrank}`)
            background.print(primer16, 101, 74, `Credits: ¥${user.credit}`)
            background.write('./rank.png')
            message.channel.send({
                file: "./rank.png"
            })
        }

        async function getBackground() {
            try {
                var option = msg.split(' ')
                var page = 1
                var pages = []
                var user = economy.find(u => u.id == message.author.id)

                function loadpage(bgtype) {
                    var loadpage = ''
                    loadpage += '**back:** Go to the previous page'
                    for (var i = 0; i < 10; i++) {
                        if ((page - 1) * 10 - 1 + (i+1) < bgtype.length) {
                            loadpage += `\n**${i}:** [${bgtype[(page-1) * 10 - 1 + (i+1)].name}](${bgtype[(page-1) * 10 - 1 + (i+1)].link})`
                        }
                    }
                    loadpage += '**\nnext:** Go to the next page'
                    pages[page-1] = loadpage
                }

                async function loademote(msg1) {
                    await msg1.react('⬅')
                    await msg1.react('0⃣')
                    await msg1.react('1⃣')
                    await msg1.react('2⃣')
                    await msg1.react('3⃣')
                    await msg1.react('4⃣')
                    await msg1.react('5⃣')
                    await msg1.react('6⃣')
                    await msg1.react('7⃣')
                    await msg1.react('8⃣')
                    await msg1.react('9⃣')
                    await msg1.react('➡')
                }

                async function reaction(msg1, bgtype, type, embed) {
                    var previousfilter = (reaction, user) => reaction.emoji.name == "⬅" && user.id == message.author.id
                    var zerofilter = (reaction, user) => reaction.emoji.name == "0⃣" && user.id == message.author.id
                    var onefilter = (reaction, user) => reaction.emoji.name == "1⃣" && user.id == message.author.id
                    var twofilter = (reaction, user) => reaction.emoji.name == "2⃣" && user.id == message.author.id
                    var threefilter = (reaction, user) => reaction.emoji.name == "3⃣" && user.id == message.author.id
                    var fourfilter = (reaction, user) => reaction.emoji.name == "4⃣" && user.id == message.author.id
                    var fivefilter = (reaction, user) => reaction.emoji.name == "5⃣" && user.id == message.author.id
                    var sixfilter = (reaction, user) => reaction.emoji.name == "6⃣" && user.id == message.author.id
                    var sevenfilter = (reaction, user) => reaction.emoji.name == "7⃣" && user.id == message.author.id
                    var eightfilter = (reaction, user) => reaction.emoji.name == "8⃣" && user.id == message.author.id
                    var ninefilter = (reaction, user) => reaction.emoji.name == "9⃣" && user.id == message.author.id
                    var nextfilter = (reaction, user) => reaction.emoji.name == "➡" && user.id == message.author.id
                    var previous = msg1.createReactionCollector(previousfilter, {time: 60000}) 
                    var zero = msg1.createReactionCollector(zerofilter, {time: 60000}) 
                    var one = msg1.createReactionCollector(onefilter, {time: 60000}) 
                    var two = msg1.createReactionCollector(twofilter, {time: 60000}) 
                    var three = msg1.createReactionCollector(threefilter, {time: 60000}) 
                    var four = msg1.createReactionCollector(fourfilter, {time: 60000}) 
                    var five = msg1.createReactionCollector(fivefilter, {time: 60000}) 
                    var six = msg1.createReactionCollector(sixfilter, {time: 60000}) 
                    var seven = msg1.createReactionCollector(sevenfilter, {time: 60000})
                    var eight = msg1.createReactionCollector(eightfilter, {time: 60000})
                    var nine = msg1.createReactionCollector(ninefilter, {time: 60000})
                    var next = msg1.createReactionCollector(nextfilter, {time: 60000})
                    function endreactioncollector() {
                        previous.stop()
                        zero.stop()
                        one.stop()
                        two.stop()
                        three.stop()
                        four.stop()
                        five.stop()
                        six.stop()
                        seven.stop()
                        eight.stop()
                        nine.stop()
                        next.stop()
                    }
                    function buyBackground(bg) {
                        if (bg !== undefined) {
                            if (user.purchased[type].indexOf(bg.name) > -1) {
                                message.channel.send('You already bought that!')
                            } else if (user.credit < bg.credit) {
                                message.channel.send("You don't have enough credits!")
                            } else {
                                user.credit -= bg.credit
                                user.purchased[type].push(bg.name)
                                message.channel.send(`**${bg.name}** has been purchased!`)
                                fs.writeFileSync('economy.txt', JSON.stringify(economy))
                                bot.channels.get('578105172237221889').send({files: [{
                                    attachment: './economy.txt',
                                    name: 'economy.txt'
                                }]})
                                endreactioncollector()
                            }
                        }
                    }
                    previous.on('collect', reaction => {
                        if (page <= 1) {return}
                        page -= 1
                        embed.setAuthor(`Page ${page} of ${Math.ceil(bgtype.length / 10)}`)
                        embed.setDescription(pages[page-1])
                        msg1.edit({embed})
                    })
                    next.on('collect', reaction => {
                        if (page >= Math.ceil(bgtype.length / 10)) {return}
                        page += 1
                        if (pages[page-1] == undefined) {
                            loadpage(bgtype)
                        }
                        embed.setAuthor(`Page ${page} of ${Math.ceil(bgtype.length / 10)}`)
                        embed.setDescription(pages[page-1])
                        msg1.edit({embed})
                    })
                    zero.on('collect', reaction => {
                        var bg = bgtype[(page-1) * 10 - 1 + 1]
                        buyBackground(bg)
                    })
                    one.on('collect', reaction => {
                        var bg = bgtype[(page-1) * 10 - 1 + 2]
                        buyBackground(bg)
                    })
                    two.on('collect', reaction => {
                        var bg = bgtype[(page-1) * 10 - 1 + 3]
                        buyBackground(bg)
                    })
                    three.on('collect', reaction => {
                        var bg = bgtype[(page-1) * 10 - 1 + 4]
                        buyBackground(bg)
                    })
                    four.on('collect', reaction => {
                        var bg = bgtype[(page-1) * 10 - 1 + 5]
                        buyBackground(bg)
                    })
                    five.on('collect', reaction => {
                        var bg = bgtype[(page-1) * 10 - 1 + 6]
                        buyBackground(bg)
                    })
                    six.on('collect', reaction => {
                        var bg = bgtype[(page-1) * 10 - 1 + 7]
                        buyBackground(bg)
                    })
                    seven.on('collect', reaction => {
                        var bg = bgtype[(page-1) * 10 - 1 + 8]
                        buyBackground(bg)
                    })
                    eight.on('collect', reaction => {
                        var bg = bgtype[(page-1) * 10 - 1 + 9]
                        buyBackground(bg)
                    })
                    nine.on('collect', reaction => {
                        var bg = bgtype[(page-1) * 10 - 1 + 10]
                        buyBackground(bg)
                    })
                }

                if (option[1] == "buy") {
                    if (option[2] == "profile") {
                        loadpage(bgprofile)
                        var embed = new Discord.RichEmbed()
                        .setAuthor(`Page ${page} of ${Math.ceil(bgprofile.length / 10)}`)
                        .setThumbnail(bot.user.avatarURL)
                        .setColor(embedcolor)
                        .setDescription(pages[page-1])
                        var msg1 = await message.channel.send({embed})
                        loademote(msg1)
                        reaction(msg1, bgprofile, option[2], embed)
                    }
                    if (option[2] == 'rank') {
                        loadpage(bgrank)
                        var embed = new Discord.RichEmbed()
                        .setAuthor(`Page ${page} of ${Math.ceil(bgrank.length / 10)}`)
                        .setThumbnail(bot.user.avatarURL)
                        .setColor(embedcolor)
                        .setDescription(pages[page-1])
                        var msg1 = await message.channel.send({embed})
                        loademote(msg1)
                        reaction(msg1, bgrank, option[2], embed)
                    }
                    if (option[2] == 'levelup') {
                        loadpage(bglevelup)
                        var embed = new Discord.RichEmbed()
                        .setAuthor(`Page ${page} of ${Math.ceil(bglevelup.length / 10)}`)
                        .setThumbnail(bot.user.avatarURL)
                        .setColor(embedcolor)
                        .setDescription(pages[page-1])
                        var msg1 = await message.channel.send({embed})
                        loademote(msg1)
                        reaction(msg1, bglevelup, option[2], embed)
                    }
                }
                if (option[1] == 'set') {
                    if (option[2] == 'profile') {
                        if (user.purchased.profile.indexOf(option[3]) !== -1) {
                            user.equipped.profile = option[3]
                            message.channel.send(`Profile background is now set to: **${option[3]}**`)
                        } else {
                            throw "Can't find background!"
                        }
                    }
                    if (option[2] == 'rank') {
                        if (user.purchased.rank.indexOf(option[3]) !== -1) {
                            user.equipped.rank = option[3]
                            message.channel.send(`Rank background is now set to: **${option[3]}**`)
                        } else {
                            throw "Can't find background!"
                        }
                    }
                    if (option[2] == 'levelup') {
                        if (user.purchased.levelup.indexOf(option[3]) !== -1) {
                            user.equipped.levelup = option[3]
                            message.channel.send(`Level up background is now set to: **${option[3]}**`)
                        } else {
                            throw "Can't find background!"
                        }
                    }
                    if (option[2] == 'nickname') {
                        var nickname = message.content.substring(msg.indexOf('nickname') + 9)
                        if (nickname.length < 20) {
                            user.nickname = nickname
                            message.channel.send('Nickname is set!')
                        } else {
                            throw 'Nickname is limited to 20 characters'
                        }
                    }
                    if (option[2] == 'description') {
                        var description = message.content.substring(msg.indexOf('description') + 12)
                        if (description.length < 100) {
                            user.description = description
                            message.channel.send('Description is set!')
                        } else {
                            throw 'Description is limited to 100 characters'
                        }
                    }
                }
                if (option[1] == 'list') {
                    var purchasedprofile = ''
                    var purchasedrank = ''
                    var purchasedlevelup = ''
                    for (var i in user.purchased.profile) {
                        purchasedprofile += '``' + user.purchased.profile[i] + '`` '
                    }
                    for (var i in user.purchased.rank) {
                        purchasedrank += '``' + user.purchased.rank[i] + '`` '
                    }
                    for (var i in user.purchased.levelup) {
                        purchasedlevelup += '``' + user.purchased.levelup[i] + '`` '
                    }
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`List of profile background purchased for ${message.author.username}`)
                    .setColor(embedcolor)
                    .setThumbnail(message.author.avatarURL)
                    .setDescription(`***-----[Profile]:***
${purchasedprofile}
***-----[Rank]:***
${purchasedrank}
***-----[Level Up]:***
${purchasedlevelup}`)
                    message.channel.send({embed})
                }
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        function daily() {
            try {
                var earn = 200
                var discorduser = economy.find(u => u.id == message.author.id)
                if (new Date().getTime() - Number(discorduser.dailycooldown) >= 172800000) {
                    discorduser.dailycount = 0
                }
                if (new Date().getTime() - Number(discorduser.dailycooldown) >= 86400000)  {
                    if (msg.substring(7) == "") {
                        if (discorduser.dailycount >= 5) {
                            earn = Math.floor(earn * (1 + Math.random()*0.5))
                        }
                        discorduser.credit += earn
                        message.channel.send(`**${message.author.username}**, you received your **${earn}** credits`)
                    } else {
                        earn = Math.floor(earn * (1 + Math.random()*0.75))
                        var user = message.mentions.members.first()
                        economy.find(u => u.id == user.id).credit += earn
                        message.channel.send(`**${message.author.username}** has given ${user.displayName} **${earn}** credits`)
                    }
                    discorduser.daily = new Date().getTime()
                    discorduser.dailycount += 1
                    fs.writeFileSync('economy.txt', JSON.stringify(economy))
                    bot.channels.get('578105172237221889').send({files: [{
                        attachment: './economy.txt',
                        name: 'economy.txt'
                    }]})
                } else {
                    throw `You need to wait ${Math.ceil((86400000 - (new Date().getTime() - discorduser.dailycooldown))/3600000)} hours to do daily again`
                }
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        function rep(start) {
            try {
                if (new Date().getTime() - economy.find(u => u.id == message.author.id).repcooldown < 43200000) {
                    throw `You need to wait ${Math.ceil((43200000 - (new Date().getTime() - economy.find(u => u.id == message.author.id).repcooldown))/3600000)} hours to rep again`
                } else {
                    if (msg.substring(start) == "") {
                        message.channel.send('You can rep! OwO')
                    } else if (message.mentions.members.size > 0) {
                        var user = message.mentions.members.first()
                        if (economy.find(u => u.id == user.id) !== undefined) {
                            economy.find(u => u.id == message.author.id).repcooldown = new Date().getTime()
                            economy.find(u => u.id == user.id).rep += 1
                            message.channel.send(`${message.author.username} has given ${user.user.username} a reputation!`)
                            fs.writeFileSync('economy.txt', JSON.stringify(economy))
                            bot.channels.get('578105172237221889').send({files: [{
                                attachment: './economy.txt',
                                name: 'economy.txt'
                            }]})
                        }
                    } else {
                        throw "Can't find that user!"
                    }
                }
            } catch (error) {
                message.channel.send(String(error))
            }
        }     

        function getEconomyBank() {
            try {
                var option = msg.split(' ')
                if (option[1] == 'repglobal') {
                    var leaderboard = economy.sort(function(a,b) {return b.rep - a.rep})
                    leaderboard.splice(10, leaderboard.length)
                    var top = ''
                    for (var i = 0; i < leaderboard.length; i++) {
                        top += `${i+1}. ${bot.users.find(u => u.id == leaderboard[i].id).username} (Rep: ${leaderboard[i].rep})\n`
                    }
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`Global leaderboard for rep`)
                    .setColor(embedcolor)
                    .setThumbnail(bot.user.avatarURL)
                    .setDescription(top)
                    message.channel.send({embed})
                }
                if (option[1] == 'xpglobal') {
                    var leaderboard = economy.sort(function(a,b) {return b.totalxp - a.totalxp})
                    leaderboard.splice(10, leaderboard.length)
                    var top = ''
                    for (var i = 0; i < leaderboard.length; i++) {
                        top += `${i+1}. ${bot.users.find(u => u.id == leaderboard[i].id).username} (Total XP: ${leaderboard[i].totalxp})\n`
                    }
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`Global leaderboard for xp`)
                    .setColor(embedcolor)
                    .setThumbnail(bot.user.avatarURL)
                    .setDescription(top)
                    message.channel.send({embed})
                }
                if (option[1] == 'credit') {
                    if (option[2] == undefined) {
                        var credit = economy.find(u => u.id == message.author.id).credit
                        message.channel.send(`You have a total of **${credit}** credits`)
                    } else if (message.mentions.members.size > 0) {
                        var credits = Number(msg.split(" ")[3])
                        if (economy.find(u => u.id == message.author.id).credit < credits) {
                            throw "You don't have enough credits!"
                        } else {
                            var user = message.mentions.members.first()
                            economy.find(u => u.id == message.author.id).credit -= credits
                            economy.find(u => u.id == user.id).credit += credits
                            message.channel.send(`${message.author.username} has gifted ${user.user.username} **${credits}** credits!`)
                            fs.writeFileSync('economy.txt', JSON.stringify(economy))
                            bot.channels.get('578105172237221889').send({files: [{
                                attachment: './economy.txt',
                                name: 'economy.txt'
                            }]})
                        }
                    }
                }
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        function mine() {
            try {
                var user = economy.find(u => u.id == message.author.id)
                if (cooldown[message.author.id] !== undefined && cooldown[message.author.id].indexOf(command) !== -1) {
                    throw "You can't mine yet! Sowwy :c"
                }
                if (user.pickaxe <= 0) {
                    throw "You need to buy a new pickaxe!"
                }
                setCommandCooldown(command, 5000)
                var random = Math.random() * 100
                if (random >= 0 && random < 25) {
                    message.channel.send('You found nothing sadly...')
                }
                if (random >= 25 && random < 50) {
                    user.credit += 4
                    message.channel.send(`What's this? You found coal ore (+4 credits)`)
                }
                if (random >= 50 && random < 70) {
                    user.credit += 8
                    message.channel.send(`What's this? You found iron ore (+8 credits)`)
                }
                if (random >= 70 && random < 85) {
                    user.credit += 16
                    message.channel.send(`What's this? You found gold ore! (+16 credits)`)
                }
                if (random >= 85 && random < 95) {
                    user.credit += 36
                    message.channel.send(`What's this? You found diamond ore! (+36 credits)`)
                }
                if (random >= 95 && random < 99) {
                    user.credit += 56
                    message.channel.send(`What's this? You found opal ore!!! Sparkly~ (+56 credits)`)
                }
                if (random >= 99 && random < 100) {
                    user.credit += 80
                    message.channel.send(`What's this? You found ruby ore!!!!! (+80 credits)`)
                }
                economy.find(u => u.id == message.author.id).pickaxe -= 1
                fs.writeFileSync('economy.txt', JSON.stringify(economy))
                bot.channels.get('578105172237221889').send({files: [{
                    attachment: './economy.txt',
                    name: 'economy.txt'
                }]})
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        xpleveler()

        if (msg.substring(0,4) == "!rep" && msg.substring(0,4) == command) {
            rep(5)
        }
        if (msg.substring(0,6) == "!daily" && msg.substring(0,6) == command) {
            daily()
        }
        if (msg.substring(0,5) == "!mine" && msg.substring(0,5) == command) {
            mine()
        }
        if (msg.substring(0,11) == "!background" && msg.substring(0,11) == command) {
            getBackground()
        }
        if (msg.substring(0,3) == "!bg" && msg.substring(0,3) == command) {
            getBackground()
        }
        if (msg.substring(0,8) == "!profile" && msg.substring(0,8) == command) {
            getEconomyProfile()
        }
        if (msg.substring(0,5) == "!rank" && msg.substring(0,5) == command) {
            getEconomyRank()
        }
        if (msg.substring(0,5) == "!bank" && msg.substring(0,5) == command) {
            getEconomyBank()
        }
        if (msg.substring(0,8) == "!pickaxe" && msg.substring(0,8) == command) {
            var user = economy.find(u => u.id == message.author.id)
            if (user.credit <= 100) {
                throw 'You need 100 credits to add durability to your pickaxe'
            } else {
                user.credit -= 100
                user.pickaxe += 10
                message.channel.send('Added 10 durability to your pickaxe')
            }
        }
    }
})

bot.login(process.env.BOT_TOKEN);
