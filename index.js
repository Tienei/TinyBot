var cache = []
var track = []
var storedmapid = []

const Discord = require('discord.js');
const osu = require('node-osu');
const bot = new Discord.Client();
const request = require('request-promise-native');
const calc = require('ojsama')
const rippleAPI = require('rippleapi')
const fs = require('fs')

var osuApi = new osu.Api(process.env.OSU_KEY, {
    notFoundAsError: false,
    completeScores: true
});

var refresh = 0

function rankingletters(letter) {
    if (letter == "F") {
        return '**F**';
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
        SpunOut    : "SO"
    }
    var shortenmod = '+';
    var bitpresent = 0
    for (var i = 0; i < mod.length; i++) {
        if (shortenmod.includes('DT') == true && mods[mod[i]] == 'NC') {
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
        19: 'SO',
        21: 'FL',
        22: 'NC',
        23: 'HT',
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

function mapdetail(mods,length,bpm,cs,ar,od,hp) {
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
    return {length: length, bpm: bpm, cs: cs, ar: ar, od: od, hp: hp}
}

async function mapcalc(beatmapid,mods,combo,count100,count50,countmiss,acc,mode) {
    let parser = new calc.parser()
    var map = await request.get(`https://osu.ppy.sh/osu/${beatmapid}`)
    parser.feed(map)
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
    }
    getFile()
    var date = new Date()
    var day = date.getDate()
    var month = date.getMonth()
    var hour = date.getHours()
    var minute = date.getMinutes()
    var check = false
    function getTime() {
        date = new Date()   
        day = date.getDate()
        month = date.getMonth()
        minute = date.getMinutes()
        hour = date.getHours()
        if (day == 1 && month == 0 && hour == 0 && minute == 0 && check == false) {
            bot.channels.get('487479898903150612').send(`@everyone
This is Tienei/Tiny here and Merry Chirstmas everybody!!! :D I hope you guys have a fantastic, happy day with your friends or your family!
Dit is Tienei/Tiny hier en Merry Christmas iedereen!!! :D Ik hoop dat jullie een fantastische, gelukkige dag hebben met je vrienden of je familie!
Это Tienei/Tiny здесь и с Рождеством всех!!! :D Надеюсь, у вас, ребята, фантастический, счастливый день с друзьями или семьей!
Ini adalah Tienei/Tiny di sini dan semua orang Merry Christmas!!! :D Saya harap anda mempunyai hari yang hebat dan bahagia dengan rakan-rakan atau keluarga anda! (Especially Naomi wherever you are i'll still remember you)`)
            bot.channels.get('487479898903150612').send('https://media.giphy.com/media/lmsRHBoMSXDm8/giphy.gif')
        }
        check = true
    }

    //setInterval(getTime, 1000)

    // osutrack
    async function realtimeosutrack() {
        for (var player = 0; player <= track.length -1; player++) {
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
                var recentcalc = await mapcalc(beatmapid,bitpresent,combo,count100,count50,countmiss,acc,0)
                if (String(track[player].recenttimeplay) !== String(recent[0][0].date)) {
                    console.log('new recent')
                    track[player].recenttimeplay = recent[0][0].date
                    var user = await osuApi.apiCall('/get_user', {u: name})
                    if(Number(recentcalc.pp.total) > Number(top50)) {
                        var best = await osuApi.getUserBest({u: name, limit: 50})
                        for (var i = 0; i <= best.length; i++) {
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
                                var fccalc = await mapcalc(beatmapid,bitpresent,fc,count100,count50,0,acc,1)
                                var star = Number(fccalc.star.total).toFixed(2)
                                var fcpp = Number(fccalc.pp.total).toFixed(2)
                                var fcacc = fccalc.acc
                                var fcguess = ``
                                if (letter == 'F') {
                                pp = 'No PP'
                                }
                                if (perfect == 0) {
                                    fcguess = `| ${fcpp}pp for ${fcacc}%`
                                }
                                var server = bot.channels.get(track[player].trackonchannel).guild.id
                                storedmapid.push({id:beatmapid,server: server})
                                const embed = new Discord.RichEmbed()
                                .setAuthor(`New #${i+1} for ${name} in osu!Standard:`, `http://s.ppy.sh/a/${user[0].user_id}.png?date=${refresh}`)
                                .setThumbnail(`https://b.ppy.sh/thumb/${beatmapidfixed}l.jpg`)
                                .setColor('#7f7fff')
                                .setDescription(`
**[${beatmap}](https://osu.ppy.sh/b/${beatmapid})** (${star}★) ${shortenmod} | **${pp}pp** (+${ppgain}pp)
${rank} *${diff}* | **Scores:** ${scores} | **Combo:** ${combo}/${fc}
**Accuracy:** ${acc}% [${count300}/${count100}/${count50}/${countmiss}] ${fcguess}
**#${track[player].lastrank} → #${user[0].pp_rank} (:flag_${country}: : #${track[player].lastcountryrank} → #${user[0].pp_country_rank})**`)
                                bot.channels.get(track[player].trackonchannel).send({embed})
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
    
    setInterval(realtimeosutrack, 20000)
});

bot.on("message", (message) => {

    var msg = message.content.toLowerCase();
    refresh = Math.round(Math.random()* 2147483648)
    var command = ''

    if (message.author.bot == false){

        for (var i = 0; i < msg.length; i++) {
            if (msg[i] == ' ') {
                command = msg.substring(0,i)
                break;
            } else if (msg[i+1] == undefined) {
                command = msg.substring(0,i+1)
                break;
            }
        }
        // General Related

        if (msg.substring(0,5) == '!help' && msg.substring(0,5) == command) {
            const embed = new Discord.RichEmbed()
            .setAuthor(`Commands for Tiny Bot v2`)
            .setThumbnail(bot.user.avatarURL)
            .setDescription(`
**--- [General]**
!avatar (username): Check user's profile picture
!changelog: Changes of the bot
!help: **Uh then how you open this?**
!ping: Ping Bancho

**--- [osu!]**
**+ osu! Profile:** !(command) (username): !osu, !taiko, !ctb, !mania
**+ osu! Top play:** !(command) (username) (number): !osutop, !taikotop, !ctbtop, !maniatop
**+ osu! Track:** !(command) (username): !osutrack, !untrack
**+ Others:**
!map [!m] (mods): Get info from the latest map display in the chat
!osuset (username): Link your discord to your osu!
!osuavatar (username): Check osu player's profile picture
!osusig (username): Get player's profile signature
!recent [!r] (username): Check player's most recent play
!compare [!c] (username): Compare with the latest play in chat
!recentosutop [!rosutop] (username): Get player top most recent play
!modsosutop [!mosutop] (username) (mods): Get player top play with mods
!osud (username): Detail statistics of user / Please wait about 30-60 seconds
!calcpp (mods) (acc) (combo) (miss): Calculate a beatmap pp

**--- [Akatsuki]**
Just add "akatsuki" (full command) or "akat" (shorten command) in front of osu! commands

Note: 
- If your osu username have a space in it, replace it with a "_"
- () means paramater, [] means shorten commands, {} means extra parameter needed 
- Every mode (besides Standard) is not fully supported!`
            )
            message.channel.send({embed})
        }

        if(msg.substring(0,7) == '!credit' && msg.substring(0,7) == command) {
            const embed = new Discord.RichEmbed()
            .setAuthor(`Special thanks to:`)
            .setThumbnail(bot.user.avatarURL)
            .setDescription(`
**--- Command idea from:**
Yeong Yuseong (!calcpp), 1OneHuman (!mosutop, !rosutop), Great Fog (!m, partial !osud)

**--- Tester:**
ReiSevia, Shienei, FinnHeppu, Hugger, rinku, Rosax, -Seoul`)
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
            .setImage(image)
            message.channel.send({embed})
        }

        if (msg.substring(0,10) == '!changelog' && msg.substring(0,10) == command) {
            const embed = new Discord.RichEmbed()
            .setAuthor(`Changelog for Tiny Bot v2.7`)
            .setThumbnail(bot.user.avatarURL)
            .setDescription(`
**Akatsuki and Ripple Update:**
- Added !akatsuki
- Added !recentakatsuki (!rakat)`)
            message.channel.send({embed})
        }

        if (msg.substring(0,5) == '!ping' && msg.substring(0,5) == command) {
            async function Bancho() {
                var timenow = Date.now()
                var test = await osuApi.getUser({u: "peppy"})
                var timelater = Date.now()
                message.channel.send(`Bancho respond! **${timelater - timenow}ms**`)
            }
            Bancho()
        }

        if (msg.includes(`<@${bot.user.id}>`) == true || msg.includes(`<@!${bot.user.id}>`) == true) {
            var roll = Math.floor(Math.random()*6)
            var respone =  [`Yes? ${message.author.username} <:chinohappy:450684046129758208>`,`Why you keep pinging me?`,`Stop pinging me! <:chinoangry:450686707881213972>`,`What do you need senpai? <:chinohappy:450684046129758208>`,`<:chinopinged:450680698613792783>`]
            message.channel.send(respone[roll])
        }

        // Osu related
        
        //Function
        function checkplayer(name) {
            if (name == '') {
                var osuname = ''
                var found = false
                for (var i = 0; i < cache.length; i++) {
                    if (cache[i].username == message.author.id) {
                        osuname = cache[i].osuname
                        found = true
                    }
                }
                if (found == false) {
                    return name;
                }
                return osuname;
            } else {
                var osuname = ''
                var found = false
                for (var i = 0; i < cache.length; i++) {
                    if (name.includes('@') == true) {
                        if (name.includes(cache[i].username) == true) {
                            osuname = cache[i].osuname
                            found = true
                        }
                    }
                }
                if (found == false) {
                    return name;
                }
                return osuname;
            }
        }

        async function osu(name, mode, modename) {
            var user = await osuApi.apiCall('/get_user', {u: name, m: mode})
            if (user.length == 0) {
                message.channel.send('Invalid user or data not found')
            }
            var username = user[0].username
            var acc = Number(user[0].accuracy).toFixed(2)
            var id = user[0].user_id
            var pp = Number(user[0].pp_raw).toFixed(2);
            var played = user[0].playcount
            var rank = user[0].pp_rank
            var countryrank = user[0].pp_country_rank
            var country = user[0].country.toLowerCase();
            var level = user[0].level
            var ss = Number(user[0].count_rank_ss) + Number(user[0].count_rank_ssh)
            var s = Number(user[0].count_rank_s) + Number(user[0].count_rank_sh)
            var a = user[0].count_rank_a

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
            .setColor('#7f7fff')
            message.channel.send({embed});

        }

        async function ripple() {
            var user = await rippleAPI.getFullUserByName(message.content.substring(8))
            if (user.length == 0) {
                message.channel.send('Invalid user or data not found')
            }
            var username = user.username
            var acc = Number(user.std.accuracy).toFixed(2)
            var id = user.id
            var pp = Number(user.std.pp).toFixed(2);
            var played = user.std.playcount
            var rank = user.std.global_leaderboard_rank
            var countryrank = user.std.country_leaderboard_rank
            var country = user.country.toLowerCase();
            var level = Number(user.std.level).toFixed(2)
            const embed = new Discord.RichEmbed()
            .setAuthor(`Ripple Standard status for: ${username}`,'',`https://ripple.moe/u/${id}?mode=0`)
            .setDescription(`
▸**Performance:** ${pp}pp 
▸**Rank:** #${rank} (:flag_${country}:: #${countryrank})
▸**Accuracy:** ${acc}%
▸**Play count:** ${played}
▸**Level:** ${level}`)
            .setThumbnail(`https://a.ripple.moe/${id}?date=${refresh}`)
            .setColor('#7f7fff')
            message.channel.send({embed});
        }

        async function akatsuki() {
            var data = await request.get(`https://akatsuki.pw/api/v1/users/full?name=${message.content.substring(10)}`)
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
            .setAuthor(`Akatsuki status for: ${username}`,'',`https://akatsuki.pw/u/${id}`)
            .setDescription(`
▸**Performance:** ${pp}pp 
▸**Rank:** #${rank} (:flag_${country}:: #${countryrank})
▸**Accuracy:** ${acc}%
▸**Play count:** ${played}
▸**Level:** ${level}
`)
            .setThumbnail(`https://a.akatsuki.pw/${id}.png?date=${refresh}`)
            .setColor('#7f7fff')
            message.channel.send({embed});
        }

        async function osusig() {
            var check = message.content.substring(8)
            var name = checkplayer(check)
            const embed = new Discord.RichEmbed()
            .setAuthor(`Signature for ${name}`)
            .setImage(`http://lemmmy.pw/osusig/sig.php?colour=pink&uname=${name}&pp=2&countryrank&onlineindicator=undefined&xpbar&xpbarhex&date=${refresh}`)
            message.channel.send({embed})
        }

        async function osuset() {
            var osuname = message.content.substring(8)
            var detected = false
            var user = await osuApi.getUser({u: osuname})
            var name = user.name
            if (name == undefined) {
                message.channel.send('Please enter a valid osu username! >:c')
            } else {
                for (var i = 0; i <= cache.length - 1; i++) {
                    if (cache.length <= 0) {
                        cache.push({"username":message.author.id,"osuname":name})
                    }
                    if (i < cache.length - 1 || cache.length == 1) {
                        if (cache[i].username == message.author.id) {
                            cache[i].osuname = name
                            detected = true
                        }
                    }
                }
                if (detected == false) {
                    cache.push({"username":message.author.id,"osuname":name})
                }
                const embed = new Discord.RichEmbed()
                .setAuthor(`Your account has been linked to osu! username: ${name}`,'',`https://osu.ppy.sh/users/${user.id}`)
                .setImage(`http://s.ppy.sh/a/${user.id}.png?date=${refresh}`)
                message.channel.send({embed})
                fs.writeFileSync('data.txt', JSON.stringify(cache))
                bot.channels.get('487482583362568212').send({files: [{
                    attachment: './data.txt',
                    name: 'data.txt'
                }]})
            }
        }

        async function recent(start) {
            var check = message.content.substring(start);
            var name = checkplayer(check)
            var recent = await osuApi.getUserRecent({u: name})
            if (recent.length == 0) {
                message.channel.send('No play found within 24 hours of this user **-Tiny**')
            }
            var getplayer = await osuApi.apiCall('/get_user', {u: name})
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
            var recentcalc = await mapcalc(beatmapid,bitpresent,combo,count100,count50,countmiss,acc,0)
            var star = Number(recentcalc.star.total).toFixed(2)
            var pp = Number(recentcalc.pp.total).toFixed(2)
            var nopp = ''
            var osuname = getplayer[0].username
            if (message.guild !== null) {
                storedmapid.push({id:beatmapid,server:message.guild.id})
            } else {
                storedmapid.push({id:beatmapid,user:message.author.id})
            }
            var fccalc = await mapcalc(beatmapid,bitpresent,fc,count100,count50,0,acc,1)
            var fcpp = Number(fccalc.pp.total).toFixed(2)
            var fcacc = fccalc.acc
            var fcguess = ``
            if (letter == 'F') {
                nopp = '(No pp)'
            }
            if (perfect == 0) {
                fcguess = `| **${fcpp}pp for ${fcacc}%**`
            }
            const embed = new Discord.RichEmbed()
            .setAuthor(`Most recent osu! Standard play for ${osuname}:`, `http://s.ppy.sh/a/${userid}.png?date=${refresh}`)
            .setThumbnail(`https://b.ppy.sh/thumb/${beatmapidfixed}l.jpg`)
            .setColor('#7f7fff')
            .setDescription(`
**[${beatmap}](https://osu.ppy.sh/b/${beatmapid})** (${star}★) ${shortenmod} | ***${pp}pp*** ${nopp}
${rank} *${diff}* | **Scores:** ${scores} | **Combo:** ${combo}/${fc}
**Accuracy:** ${acc}% [${count300}/${count100}/${count50}/${countmiss}] ${fcguess}`)
            message.channel.send({embed})
        }

        async function akatsukirecent(start) {
            var data = await request.get(`https://akatsuki.pw/api/v1/users/scores/recent?name=${message.content.substring(start)}`)
            var recent = JSON.parse(data)
            var userid = recent.scores[0].id
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
            var recentcalc = await mapcalc(beatmapid,bit,combo,count100,count50,countmiss,acc,0)
            var star = Number(recentcalc.star.total).toFixed(2)
            var pp = Number(recentcalc.pp.total).toFixed(2)
            if (message.guild !== null) {
                storedmapid.push({id:beatmapid,server:message.guild.id})
            } else {
                storedmapid.push({id:beatmapid,user:message.author.id})
            }
            var fccalc = await mapcalc(beatmapid,bit,fc,count100,count50,0,acc,1)
            var fcpp = Number(fccalc.pp.total).toFixed(2)
            var fcacc = fccalc.acc
            var fcguess = ``
            var nopp = ''
            if (letter == 'F') {
                nopp = '(No pp)'
            }
            if (perfect == 0) {
                fcguess = `| **${fcpp}pp for ${fcacc}%**`
            }
            const embed = new Discord.RichEmbed()
            .setAuthor(`Most recent Akatsuki Standard play for ${message.content.substring(start)}:`, `https://a.akatsuki.pw/${userid}.png?date=${refresh}`)
            .setThumbnail(`https://b.ppy.sh/thumb/${beatmapsetid}l.jpg`)
            .setColor('#7f7fff')
            .setDescription(`
**[${beatmap}](https://osu.ppy.sh/b/${beatmapid})** (${star}★) ${mods} | ***${pp}pp*** ${nopp}
${rank} **Scores:** ${score} | **Combo:** ${combo}/${fc}
**Accuracy:** ${acc}% [${count300}/${count100}/${count50}/${countmiss}] ${fcguess}`)
            message.channel.send({embed})
        }

        async function osutrack() {
            var osuname = message.content.substring(10)
            var detected = false
            var user = await osuApi.getUser({u: osuname})
            var name = user.name
            var best = await osuApi.getUserBest({u: osuname, limit: 50})
            if (name == undefined) {
                message.channel.send('Please enter a valid osu username! >:c')
            } else {
                for (var i = 0; i < track.length; i++) {
                    if (track.length <= 0) {
                        track.push({"osuname":name,"top50pp":best[49][0].pp,"lasttotalpp":user.pp.raw,"lastrank":user.pp.rank,"lastcountryrank":user.pp.countryRank,"trackonchannel": message.channel.id,"recenttimeplay": ""})
                    }
                    if (i < track.length || track.length == 1) {
                        if (track[i].trackonchannel == message.channel.id && track[i].osuname == name) {
                            track[i].osuname = name
                            track[i].lasttotalpp = user.pp.raw
                            track[i].lastrank = user.pp.rank
                            track[i].lastcountryrank = user.pp.countryRank
                            detected = true
                        }
                    }
                }
                if (detected == false) {
                    track.push({"osuname":name,"top50pp":best[49][0].pp,"lasttotalpp":user.pp.raw,"lastrank":user.pp.rank,"lastcountryrank":user.pp.countryRank,"trackonchannel": message.channel.id,"recenttimeplay": ""})
                }
                message.channel.send(`**${name}** is now being tracked on **#${message.channel.name}**`)
                fs.writeFileSync('track.txt', JSON.stringify(track))
                bot.channels.get('497302830558871552').send({files: [{
                    attachment: './track.txt',
                    name: 'track.txt'
                }]})
            }
        }

        async function untrack() {
            for (var i = 0; i < track.length; i++) {
                if (track[i].trackonchannel == message.channel.id && track[i].osuname == message.content.substring(9)) {
                    track.splice(i,1)
                    message.channel.send(`**${message.content.substring(9)}** has been removed from #${message.channel.name}`)
                    fs.writeFileSync('track.txt', JSON.stringify(track))
                    bot.channels.get('497302830558871552').send({files: [{
                        attachment: './track.txt',
                        name: 'track.txt'
                    }]})
                }
            }
        }

        async function osuavatar() {
            var name = message.content.substring(11)
            var user = await osuApi.apiCall('/get_user', {u: name})
            var username = user[0].username
            var id = user[0].user_id
            const embed = new Discord.RichEmbed()
            .setAuthor(`Avatar for ${username}`)
            .setImage(`https://a.ppy.sh/${id}_1?date=${refresh}.png`)
            message.channel.send({embed})
        }

        async function compare(start) {
            var check = message.content.substring(start);
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
            if (scores.length == 0) {
                message.channel.send(`${name} didn't play this map! D: **-Tiny**`)
            }
            var beatmap = await osuApi.getBeatmaps({b: storedid})
            var highscore = ''
            var beatmapname = beatmap[0].title
            var diff = beatmap[0].version
            var beatmapimageid = beatmap[0].beatmapSetId
            var osuname = scores[0].user.name
            var osuid = scores[0].user.id
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
                var pp = Number(scores[i].pp).toFixed(2)
                var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                var fccalc = await mapcalc(storedid,bitpresent,fc,count100,count50,0,acc,1)
                var fcpp = Number(fccalc.pp.total).toFixed(2)
                var fcacc = fccalc.acc
                var star = Number(fccalc.star.total).toFixed(2)
                var fcguess = ''
                if (perfect == 0) {
                    fcguess = `| **${fcpp}pp for ${fcacc}%**`
                }
                    highscore += `
${i+1}. **${shortenmod}** Score (${star}★) | ***${pp}pp***
${rank} **Score:** ${score} | **Combo:** ${combo}/${fc}
**Accuracy:** ${acc}% [${count300}/${count100}/${count50}/${countmiss}] ${fcguess}
`         
            }
            const embed = new Discord.RichEmbed()
            .setAuthor(`Top osu!Standard Plays for ${osuname} on ${beatmapname} [${diff}]`, `http://s.ppy.sh/a/${osuid}.png?=date${refresh}`)
            .setThumbnail(`https://b.ppy.sh/thumb/${beatmapimageid}l.jpg`)
            .setDescription(highscore)
            message.channel.send({embed});
        }

        async function osutop(mode, startpos, modename) {
            var player = ''
            var start = 0
            var loop = 0
            var word = []
            var startword = startpos
            for (var i = startword; i < msg.length; i++) {
                if (msg[i] == ' ') {
                    word.push(msg.substring(startword,i))
                    startword = i + 1
                }
            }
            word.push(msg.substring(startword,msg.length))
            if (word.length == 2) {
                player = word[0]
                start = Number(word[1]) - 1
                loop = start + 1
            }
            if (word.length == 1) {
                if (isNaN(word[0]) == true) {
                    player = word[0]
                    start = 0
                    loop = 5
                } else {
                    player = ''
                    start = Number(word[0]) - 1
                    loop = start + 1    
                }
            }
            if (msg.length == startpos - 1) {
                player = ''
                start = 0
                loop = 5
            }
            var name = checkplayer(player)
            var top = ''
            var best = await osuApi.getUserBest({u: name, limit: loop, m: mode})
            if (best.length == 0) {
                message.channel.send(`I think ${name} didn't play anything yet~ **-Chino**`)
            }
            var userid = best[0][0].user.id
            var user = await osuApi.getUser({u: userid})
            var username = user.name
            for (var i = start; i < loop; i++) {
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
                if (message.guild !== null) {
                    storedmapid.push({id:beatmapid,server:message.guild.id})
                } else {
                    storedmapid.push({id:beatmapid,user:message.author.id})
                }
                var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                var star = 0
                var accdetail = `[${count300}/${count100}/${count50}/${countmiss}]`
                if (mode == 0) {
                    var fccalc = await mapcalc(beatmapid,bitpresent,fc,count100,count50,0,acc,1)
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
`   
            }
            const embed = new Discord.RichEmbed()
            .setAuthor(`Top ${modename}!Standard Plays for ${username}`)
            .setThumbnail(`http://s.ppy.sh/a/${userid}.png?date=${refresh}`)
            .setColor('#7f7fff')
            .setDescription(top)
            message.channel.send({embed});
        }

        async function recentosutop(textstart) {
            var check = message.content.substring(textstart)
            var name = checkplayer(check)
            var top = ''
            var best = await osuApi.getUserBest({u: name, limit:100})
            if (best.length == 0) {
                message.channel.send(`I think ${name} didn't play anything yet~ **-Chino**`)
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
                if (message.guild !== null) {
                    storedmapid.push({id:beatmapid,server:message.guild.id})
                } else {
                    storedmapid.push({id:beatmapid,user:message.author.id})
                }
                var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                var fccalc = await mapcalc(beatmapid,bitpresent,fc,count100,count50,0,acc,1)
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
`
                
            }
            const embed = new Discord.RichEmbed()
            .setAuthor(`Top osu!Standard most recent plays for ${username}`)
            .setThumbnail(`http://s.ppy.sh/a/${userid}.png?date=${refresh}`)
            .setColor('#7f7fff')
            .setDescription(top)
            message.channel.send({embed});
        }

        async function modsosutop(textstart) {
            var getmod = ''
            var mod = []
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
            var word = []
            var start = textstart
            var player = ''
            for (var i = textstart; i < msg.length; i++) {
                if (msg[i] == ' ') {
                    word.push(msg.substring(start,i))
                    start = i + 1
                }
            }
            word.push(msg.substring(start,msg.length))
            if (word.length == 2) {
                player = word[0]
                getmod = word[1]
            }
            if (word.length == 1) {
                getmod = word[0]
            }
            for (var i = 0; i < getmod.length; i=i+2) {
                if (definemod[getmod.substring(i, i+2)]) {
                    mod.push(definemod[getmod.substring(i, i+2)])
                }
                if (definemod[getmod.substring(i, i+5)]) {
                    mod.push(definemod[getmod.substring(i, i+5)])
                }
            }
            var name = checkplayer(player)
            var best = await osuApi.getUserBest({u: name, limit: 100})
            var user = await osuApi.getUser({u: name})
            var top = []
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
                    for (var m = 0; m < mod.length; m++) {
                        if (bestmod.includes(mod[m]) == true) {               
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
                    if (message.guild !== null) {
                        storedmapid.push({id:beatmapid,server:message.guild.id})
                    } else {
                        storedmapid.push({id:beatmapid,user:message.author.id})
                    }
                    var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                    var fccalc = await mapcalc(beatmapid,bitpresent,fc,count100,count50,0,acc,1)
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
`
                }
            }
            if (top.length == 0) {
                top += `This user doesn't have any ${getmod.toUpperCase()} top play`
            }
            const embed = new Discord.RichEmbed()
            .setAuthor(`Top osu!Standard Plays with ${getmod.toUpperCase()} for ${username}`)
            .setThumbnail(`http://s.ppy.sh/a/${userid}.png?date=${refresh}`)
            .setColor('#7f7fff')
            .setDescription(top)
            message.channel.send({embed});
        }

        async function map(start){
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
            console.log(mods)
            for (var m = 0; m <= mods[0].length; m++) {
                if (mod[mods[0].substr(m*2,2)]) {
                    bitpresent += mod[mods[0].substr(m*2,2)]
                }
            }
            var map = await osuApi.getBeatmaps({b: beatmapid})
            var beatmapidfixed = map[0].beatmapSetId
            var title = map[0].title
            var mapper = map[0].creator
            var version = map[0].version
            var maxCombo = map[0].maxCombo
            var acc95 = await mapcalc(beatmapid,bitpresent,maxCombo,0,0,0,95,0)
            var acc97 = await mapcalc(beatmapid,bitpresent,maxCombo,0,0,0,97,0)
            var acc99 = await mapcalc(beatmapid,bitpresent,maxCombo,0,0,0,99,0)
            var acc100 = await mapcalc(beatmapid,bitpresent,maxCombo,0,0,0,100,0)
            var detail = mapdetail(mods[0],map[0].time.total,map[0].bpm,acc100.cs, acc100.ar,acc100.od,acc100.hp)
            var totallength = Number(detail.length).toFixed(0)
            var bpm = Number(detail.bpm).toFixed(0)
            var ar = Number(detail.ar).toFixed(2)
            var od = Number(detail.od).toFixed(2)
            var hp = Number(detail.hp).toFixed(2)
            var cs = Number(detail.cs).toFixed(2)
            var time = `${Math.floor(totallength / 60)}:${('0' + (totallength - Math.floor(totallength / 60) * 60)).slice(-2)}`
            const embed = new Discord.RichEmbed()
            .setAuthor(`${title} by ${mapper}`,'',`https://osu.ppy.sh/b/${beatmapid[i]}`)
            .setThumbnail(`https://b.ppy.sh/thumb/${beatmapidfixed}l.jpg`)
            .setColor('#7f7fff')
            .setDescription(`
**Length:** ${time} **BPM:** ${bpm} **Mods:** ${mods[0].toUpperCase()}
**Download:** [map](https://osu.ppy.sh/d/${beatmapidfixed}) ([no vid](https://osu.ppy.sh/d/${beatmapidfixed}n))
<:difficultyIcon:507522545759682561> __${version}__  
**Difficulty:** ${Number(acc100.star.total).toFixed(2)}★ (Aim: ${Number(acc100.star.aim).toFixed(2) * 2}★, Speed: ${Number(acc100.star.speed).toFixed(2) * 2}★)
**Max Combo:** ${maxCombo}
**AR:** ${ar} / **OD:** ${od} / **HP:** ${hp} / **CS:** ${cs}
**PP:** | **95%**-${Number(acc95.pp.total).toFixed(2)}pp | **97%**-${Number(acc97.pp.total).toFixed(2)}pp | **99%**-${Number(acc99.pp.total).toFixed(2)}pp | **100%**-${Number(acc100.pp.total).toFixed(2)}pp`)
                message.channel.send({embed});
        }

        async function beatmapdetail() {
            var beatmapid = []
            var start = 0
            var mods = []
            for (var m = 0; m < msg.length; m++) {
                if (msg.substr(m,21) == 'https://osu.ppy.sh/b/') {
                    start = m + 21
                    for (var i = start; i <= msg.length; i++) {
                        if (msg.substr(i,1) == ' ' || msg.substr(i,1) == '') {
                            if (msg.substring(start, msg.length).includes('?m=') == true) {
                                beatmapid.push(msg.substring(start,i-4))
                                start = i
                                break;
                            } else {
                                beatmapid.push(msg.substring(start,i))
                                start = i
                                break;
                            }
                        }
                    }
                    if (msg.substr(start+1,1) == "+") {
                        for (var i = start+2; i <= msg.length; i++) {
                            if (msg.substr(i,1) == ' ' || msg.substr(i,1) == ''){
                                mods.push(msg.substring(start+2,i))
                                start = i + 1
                                break;
                            }
                        }
                    } else {
                        mods.push('No Mod')
                    }

                }
                if (msg.substr(m,31) == 'https://osu.ppy.sh/beatmapsets/') {
                    start = m + 31
                    for (var i = start; i < msg.length; i++) {
                        if (msg.substr(i,1) == '#') {
                            start = i+1
                            break;
                        }
                    }
                    for (var i = start; i < msg.length; i++) {
                        if (msg.substr(i,1) == '/') {
                            start = i+1
                            break;
                        }
                    }
                    for (var i = start; i <= msg.length; i++) {
                        if (msg.substr(i,1) == ' ' || msg.substr(i,1) == ''){
                            beatmapid.push(msg.substring(start,i))
                            start = i
                            break;
                        }
                    }
                    if (msg.substr(start+1,1) == "+") {
                        for (var i = start+2; i <= msg.length; i++) {
                            if (msg.substr(i,1) == ' ' || msg.substr(i,1) == ''){
                                mods.push(msg.substring(start+2,i))
                                start = i + 1
                                break;
                            }
                        }
                    } else {
                        mods.push('No Mod')
                    }
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
                for (var m = 0; m <= mods[i].length; m++) {
                    if (mod[mods[i].substr(m*2,2)]) {
                        bitpresent += mod[mods[i].substr(m*2,2)]
                    }
                }
                var map = await osuApi.getBeatmaps({b: beatmapid[i]})
                if (map.length == 0) {
                    message.channel.send('Is this even a valid link?')
                }
                var beatmapidfixed = map[0].beatmapSetId
                var title = map[0].title
                var mapper = map[0].creator
                var version = map[0].version
                var maxCombo = map[0].maxCombo
                var acc95 = await mapcalc(beatmapid[i],bitpresent,maxCombo,0,0,0,95,0)
                var acc97 = await mapcalc(beatmapid[i],bitpresent,maxCombo,0,0,0,97,0)
                var acc99 = await mapcalc(beatmapid[i],bitpresent,maxCombo,0,0,0,99,0)
                var acc100 = await mapcalc(beatmapid[i],bitpresent,maxCombo,0,0,0,100,0)
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
                .setColor('#7f7fff')
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

        }

        async function calculateplay() {
            var start = 8
            var beatmapid = 0
            var mods = []
            var acc = 0
            var combo = 0
            var miss = 0
            var bitpresent = 0
            for (var i = start; i < msg.length; i++) {
                if (msg.substr(i,1) == ' ') {
                    beatmapid = msg.substring(start,i)
                    start = i + 1
                    break
                }
            }
            for (var i = start; i < msg.length; i++) {
                if (msg.substr(i,1) == ' ') {
                    mods.push(msg.substring(start,i))
                    start = i + 1
                    break
                }
            }
            for (var i = start; i < msg.length; i++) {
                if (msg.substr(i,1) == ' ') {
                    acc = Number(msg.substring(start,i))
                    start = i + 1
                    break
                }
            }
            for (var i = start; i < msg.length; i++) {
                if (msg.substr(i,1) == ' ') {
                    combo = Number(msg.substring(start,i))
                    start = i + 1
                    break
                }
            }
            for (var i = start; i <= msg.length; i++) {
                if (msg.substr(i,1) == ' ' || msg.substr(i,1) == ''){
                    miss = Number(msg.substring(start,i))
                    break
                }
            }
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
                message.channel.send('Please check the ID of the map is correct or not')
            }
            var calc = await mapcalc(beatmapid,bitpresent,combo,0,0,miss,acc,0)
            var beatmapidfixed = map[0].beatmapSetId
            var title = map[0].title
            var mapper = map[0].creator
            var version = map[0].version
            const embed = new Discord.RichEmbed()
                .setAuthor(`${title} by ${mapper}`,'',`https://osu.ppy.sh/b/${beatmapid}`)
                .setThumbnail(`https://b.ppy.sh/thumb/${beatmapidfixed}l.jpg`)
                .setColor('#7f7fff')
                .setDescription(`
Difficulty: *${version}*
With **${mods[0].toUpperCase()}**, **${acc}%** accuracy, **${combo}x** combo and **${miss}** miss:
-- **${Number(calc.pp.total).toFixed(2)}pp**`)
            message.channel.send({embed});
        }

        async function osud() {
            var check = message.content.substring(6);
            var name = checkplayer(check)
            var best = await osuApi.getUserBest({u: name, limit: 50})
            if (best.length == 0) {
                message.channel.send('Either invalid user or not enough top play to calcuate')
            }
            var user = await osuApi.apiCall('/get_user', {u: name, m: 0, event_days: 31})
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
            var userid = user[0].user_id
            var username = user[0].username
            var rank = user[0].pp_rank
            var country = user[0].country.toLowerCase()
            var countryrank = user[0].pp_country_rank
            var level = user[0].level
            var pp = user[0].pp_raw
            var acc = Number(user[0].accuracy).toFixed(2)
            var playcount = user[0].playcount
            var rankedscore = user[0].ranked_score
            var totalscore = user[0].total_score
            var ss = Number(user[0].count_rank_ss) + Number(user[0].count_rank_ssh)
            var s = Number(user[0].count_rank_s) + Number(user[0].count_rank_sh) 
            var a = Number(user[0].count_rank_a)
            var totalhourplay = Number(user[0].total_seconds_played / 3600).toFixed(0)
            var totalrank = ss + s + a
            var events = 0
            if (user[0].events.length > 3) {
                events = 3
            } else {
                events = user[0].events.length
            }
            for (var i = 0; i < events; i++) {
                var text = user[0].events[i].display_html.replace(/(<([^>]+)>)/ig,"")
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
                var scoreacc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                var thing = await mapcalc(beatmapid,modandbit.bitpresent,0,0,0,0,0,0)
                var detail = mapdetail(modandbit.shortenmod,0,Number(best[i][1].bpm),thing.cs,thing.ar,thing.od,thing.hp)
                star_avg += thing.star.total
                aim_avg += thing.star.aim
                speed_avg += thing.star.speed
                acc_avg += (Math.pow(scoreacc, 3)/Math.pow(100, 3)) * 1.1 * thing.star.total
                bpm_avg += detail.bpm
                cs_avg += detail.cs
                ar_avg += detail.ar
                od_avg += detail.od
                hp_avg += detail.hp
            }
            const embed = new Discord.RichEmbed()
            .setAuthor(`osu! Statistics for ${username}`)
            .setThumbnail(`http://s.ppy.sh/a/${userid}.png?date=${refresh}`)
            .setColor('#7f7fff')
            .setDescription(`***Performance:***
**Global Rank:** #${rank} (:flag_${country}:: #${countryrank}) | ***${pp}pp***
**Level:** ${level}
**Accuracy:** ${acc}%
**Playcount:** ${playcount} | **Total Play Time:** ${totalhourplay}h
**Ranked Score:** ${rankedscore} | **Total Score:** ${totalscore}
<:rankingX:520932410746077184>: ${ss} (${Number(ss/totalrank*100).toFixed(2)}%) | <:rankingS:520932426449682432>: ${s} (${Number(s/totalrank*100).toFixed(2)}%) | <:rankingA:520932311613571072>: ${a} (${Number(a/totalrank*100).toFixed(2)}%)

***${username} recent events:***
${event}

***${username} average skill:***
Star: ${Number(star_avg/50).toFixed(2)}★
Aim skill: ${Number(aim_avg/50).toFixed(2) *2}★
Speed skill: ${Number(speed_avg/50).toFixed(2) *2}★
Accuracy skill: ${Number(acc_avg/50).toFixed(2)}★
BPM: ${Number(bpm_avg/50).toFixed(0)} / CS: ${Number(cs_avg/50).toFixed(2)} / AR: ${Number(ar_avg/50).toFixed(2)} / OD: ${Number(od_avg/50).toFixed(2)} / HP: ${Number(hp_avg/50).toFixed(2)}`)
            message.channel.send({embed});
        }

        async function beatmap() {
            var check = message.content.substring(9);
            var name = checkplayer(check)
            var beatmap = await osuApi.getBeatmaps({u: name, limit: 50})
            if (beatmap.length == 0) {
                message.channel.send(`${name} didn't map anything yet! Nani? **-Tiny**`)
            }
        }
        
        //Commands

        if (msg.substring(0,7) == '!osuset' && msg.substring(0,7) == command) {
            osuset()
        }

        if (msg.substring(0,9) == '!osutrack' && msg.substring(0,9) == command && message.channel.name !== undefined) {
            osutrack()            
        }

        if (msg.substring(0,8) == '!untrack' && msg.substring(0,8) == command && message.channel.name !== undefined) {
            untrack()
        }

        if (msg.substring(0,10) == '!osuavatar' && msg.substring(0,10) == command) {
            osuavatar()
        }

        if (msg.substring(0,4) == '!osu' && msg.substring(0,4) == command) {
            var check = message.content.substring(5)
            var name = checkplayer(check)
            osu(name,0,'Standard')
        }

        if (msg.substring(0,7) == '!ripple' && msg.substring(0,7) == command) {
            ripple()
        }

        if (msg.substring(0,9) == '!akatsuki' && msg.substring(0,9) == command) {
            akatsuki()
        }

        if (msg.substring(0,6) == '!taiko' && msg.substring(0,6) == command) {
            var check = message.content.substring(7)
            var name = checkplayer(check)
            osu(name,1,'Taiko')
        }

        if (msg.substring(0,4) == '!ctb' && msg.substring(0,4) == command) {
            var check = message.content.substring(5)
            var name = checkplayer(check)
            osu(name,2,'Catch The Beat')
        }
        if (msg.substring(0,6) == '!mania' && msg.substring(0,6) == command) {
            var check = message.content.substring(7)
            var name = checkplayer(check)
            osu(name,3,'Mania')
        }

        if (msg.substring(0,7) == '!osusig' && msg.substring(0,7) == command) {
            osusig()
        }

        if (msg.substring(0,5) == '!osud' && msg.substring(0,5) == command) {
            osud()
        }

        if (msg.substring(0,8) == '!beatmap' && msg.substring(0,8) == command) {
            message.channel.send('Commands work in progress! >.<')
        }

        if (msg.substring(0,9) == '!27112018' && msg.substring(0,9) == command) {
            const embed = new Discord.RichEmbed()
            .setAuthor(`Did you know that Naomi and Tienei are together on November 27th 2018?
Naomi if you seeing this here's what i feel about you: <3`)
            .setImage(`https://thumbs.gfycat.com/PopularHideousAcornweevil-size_restricted.gif`)
            message.channel.send({embed})
        }

        if (msg.substring(0,7) == '!recent' && msg.substring(0,7) == command) {
            recent(8)
        }

        if (msg.substring(0,15) == '!recentakatsuki' && msg.substring(0,15) == command) {
            akatsukirecent(16)
        }

        if (msg.substring(0,6) == '!rakat' && msg.substring(0,6) == command) {
            akatsukirecent(7)
        }

        if (msg.substring(0,8) == '!compare' && msg.substring(0,8) == command) {
            compare(9)
        }

        if (msg.substring(0,2) == '!r' && msg.substring(0,2) == command) {
            recent(3)
        }

        if (msg.substring(0,2) == '!c' && msg.substring(0,2) == command) {
            compare(3)
        }

        if (msg.substring(0,7) == '!osutop' && msg.substring(0,7) == command) {
            osutop(0,8,'osu')
        }

        if (msg.substring(0,9) == '!taikotop' && msg.substring(0,9) == command) {
            osutop(1,10,'taiko')
        }

        if (msg.substring(0,7) == '!ctbtop' && msg.substring(0,7) == command) {
            osutop(2,8,'ctb')
        }

        if (msg.substring(0,9) == '!maniatop' && msg.substring(0,9) == command) {
            osutop(3,10,'mania')
        }

        if (msg.substring(0,13) == '!recentosutop' && msg.substring(0,13) == command) {
            recentosutop(14)
        }

        if (msg.substring(0,8) == '!rosutop' && msg.substring(0,8) == command) {
            recentosutop(9)
        }

        if (msg.substring(0,11) == '!modsosutop' && msg.substring(0,11) == command) {
            modsosutop(12)
        }

        if (msg.substring(0,8) == '!mosutop'  && msg.substring(0,8) == command) {
            modsosutop(9)
        }

        if (msg.substring(0,4) == '!map' && msg.substring(0,4) == command) {
            map(5)
        }

        if (msg.substring(0,2) == '!m' && msg.substring(0,2) == command) {
            map(3)
        }

        if (msg.substring(0,7) == '!calcpp'  && msg.substring(0,7) == command) {
            calculateplay()
        }

        // Detection
        beatmapdetail()

    }

})
bot.login(process.env.BOT_TOKEN);
