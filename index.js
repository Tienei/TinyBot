var cache = []
var track = []
var storedmapid = []
const Discord = require('discord.js');
const osu = require('node-osu');
const bot = new Discord.Client();
const request = require('request-promise-native');
const calc = require('ojsama')

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
        return '<:rankingA:486804739443523584>';
    }
    if (letter == "B") {
        return '<:rankingB:486804764424667136>';
    }
    if (letter == "C") {
        return '<:rankingC:486804776756183040>';
    }
    if (letter == "D") {
        return '<:rankingD:486804789531770881>';
    }
    if (letter == "S") {
        return '<:rankingS:486804806909034496>';
    }
    if (letter == "SH") {
        return '<:rankingSH:486804839016431626>';
    }
    if (letter == "X") {
        return '<:rankingX:486804867554344965>';
    }
    if (letter == "XH") {
        return '<:rankingXH:486804895966691328>';
    }
}

function mods(mod) {
    var mods = {
        NoFail     : "NF", NoFailBit: 1,
        Easy       : "EZ", EasyBit: 2,
        TouchDevice: "TD", TouchDeviceBit: 4,
        Hidden     : "HD", HiddenBit: 8,
        HardRock   : "HR", HardRockBit: 16,
        DoubleTime : "DT", DoubleTimeBit: 64,
        Relax      : "RX", RelaxBit: 128,
        HalfTime   : "HT", HalfTimeBit: 256,
        Nightcore  : "NC", NightcoreBit: 512,
        Flashlight : "FL", FlashLightBit: 1024
    }
    var shortenmod = '+';
    var bitpresent = 0
    for (var i = 0; i < mod.length; i++) {
        if (shortenmod.includes('DT') == true && mods[mod[i]] == 'NC') {
            shortenmod = shortenmod.substring(0,shortenmod.length - 2)
        }
        if (mods[mod[i]]) {
            shortenmod += mods[mod[i]];
            bitpresent += mods[mod[i] + "Bit"];
        }
    }
    if (mod.length == 0 || shortenmod == '+'){
        shortenmod += 'No Mod';
    }
    return {shortenmod: shortenmod, bitpresent: bitpresent}
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
    async function getData() {
        var backupmessage = await bot.channels.get('487482583362568212').fetchMessages({limit: 1})
        var backup = backupmessage.first().content
        cache = JSON.parse(backup.substring(18))
        var trackmessage = await bot.channels.get('497302830558871552').fetchMessages({limit: 1})
        var trackbackup = trackmessage.first().content
        track = JSON.parse(trackbackup.substring(19))
        console.log(track.length)
    }
    getData()
    var date = new Date()
    var day = date.getDate()
    var month = date.getMonth()
    function getTime() {
        date = new Date()   
        day = date.getDate()
        month = date.getMonth()
        if (day == 8 && month == 8) {
            bot.channels.get('487479898903150612').send('Happy Birthday Tiny!!! :tada: :birthday: :tada:')
        }
    }

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
                                var pp = best[i][0].pp
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
                                    fcguess = `${fcpp}pp for ${fcacc}%`
                                }
                                storedmapid.push({id:beatmapid,server:track[player].trackonchannel})
                                const embed = new Discord.RichEmbed()
                                .setAuthor(`New #${i+1} for ${name} in osu!Standard:`, `http://s.ppy.sh/a/${user[0].user_id}.png?date=${refresh}`)
                                .setThumbnail(`https://b.ppy.sh/thumb/${beatmapidfixed}l.jpg`)
                                .setColor('#7f7fff')
                                .setDescription(`
        **[${beatmap} [${diff}]](https://osu.ppy.sh/b/${beatmapid}) ${shortenmod} (${star}★)**
        **▸ #${track[player].lastrank} → #${user[0].pp_rank} (:flag_${country}: : #${track[player].lastcountryrank} → #${user[0].pp_country_rank})**
        ▸ Scores: ${scores}
        ▸ **Rank: ${rank} ▸ Combo: ${combo}/${fc}** 
        ▸ **PP: ${pp} (+${ppgain}pp)** [${fcguess}]
        ▸ **Accuracy: ${acc}%** [${count300}/${count100}/${count50}/${countmiss}]`)
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
    
    setInterval(realtimeosutrack, 10000)
});

bot.on("message", (message) => {

    var msg = message.content.toLowerCase();
    refresh = Math.round(Math.random()* 4294967295)
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
--- [General]
!avatar (username): Check user profile picture
--- [osu!]
!osu (username): Check user osu status
!osuavatar (username): Check osu user profile picture
!taiko (username): Check user taiko status
!ctb (username): Check user ctb status
!mania (username): Check user mania status
!osuavatar (username): Check osu user profile picture
!recent (username): Check user most recent play
!compare (username): Compare with other!
!osutop (username,number[1-100]): Check your top best 100 play!
!osutrack (username): Track your osu top play (top 50)
Note: 
- If your osu username have a space in it, replace it with a "_"
- Every mode (beside Standard) is not fully supported!`
            )
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

        if (msg.includes(`<@${bot.user.id}>`) == true) {
            var roll = Math.floor(Math.random()*6)
            var respone =  [`Yes? ${message.author.username} <:chinohappy:450684046129758208>`,`Why you keep pinged me?`,`Stop pinged me! <:chinoangry:450686707881213972>`,`What do you need senpai? <:chinohappy:450684046129758208>`,`<:chinopinged:450680698613792783>`]
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
        
**SS:** ${ss}  **S:** ${s}  **A:** ${a} `)
            .setThumbnail(`http://s.ppy.sh/a/${id}.png?date=${refresh}`)
            .setColor('#7f7fff')
            message.channel.send({embed});

        }

        async function osuset () {
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
                bot.channels.get('487482583362568212').send(`***User set:*** \n ${JSON.stringify(cache)}`)
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
            console.log(beatmapid,beatmapidfixed)
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
                pp = 'No PP'
            }
            if (perfect == 0) {
                fcguess = `${fcpp}pp for ${fcacc}%`
            }
            const embed = new Discord.RichEmbed()
            .setAuthor(`Most recent osu! Standard play for ${osuname}:`, `http://s.ppy.sh/a/${userid}.png?date=${refresh}`)
            .setThumbnail(`https://b.ppy.sh/thumb/${beatmapidfixed}l.jpg`)
            .setColor('#7f7fff')
            .setDescription(`
**[${beatmap} [${diff}]](https://osu.ppy.sh/b/${beatmapid}) ${shortenmod} (${star}★)**
▸ Scores: ${scores}
▸ **Rank: ${rank} ▸ Combo: ${combo}/${fc}** 
▸ **PP: ${pp}** [${fcguess}]
▸ **Accuracy: ${acc}%** [${count300}/${count100}/${count50}/${countmiss}]`)
            message.channel.send({embed});
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
                message.channel.send(`**${name}** has been tracked on **#${message.channel.name}**`)
                bot.channels.get('497302830558871552').send(`***Track set:*** \n ${JSON.stringify(track)}`)
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
            for (var i = storedmapid.length-1; i > -1; i--) {
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
            var star = 0
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
                    fcguess = `${fcpp}pp for ${fcacc}%`
                }
                    highscore += `
${i+1}. **${shortenmod}** Score
▸ Score: ${score}
**▸ Rank: ${rank} ▸ Combo: ${combo}/${fc}** 
**▸ PP: ${pp}** [${fcguess}]
**▸ Accuracy: ${acc}%** [${count300}/${count100}/${count50}/${countmiss}]`         
            }
            const embed = new Discord.RichEmbed()
            .setAuthor(`Top osu!Standard Plays for ${osuname} on ${beatmapname} [${diff}] (${star}★)`, `http://s.ppy.sh/a/${osuid}.png?=date${refresh}`)
            .setThumbnail(`https://b.ppy.sh/thumb/${beatmapimageid}l.jpg`)
            .setDescription(highscore)
            message.channel.send({embed});
        }

        async function osutop() {
            var player = ''
            var start = 0
            var loop = 0
            let word = []
            var startword = 8
            for (var i = 8; i < msg.length; i++) {
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
            if (msg.length == 7) {
                player = ''
                start = 0
                loop = 5
            }
            var name = checkplayer(player)
            var top = ''
            var best = await osuApi.getUserBest({u: name, limit: loop})
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
                    fcguess = `${fcpp}pp for ${fcacc}%`
                }
                top += `
${i+1}. **[${title} [${diff}]](https://osu.ppy.sh/b/${beatmapid}) ${shortenmod}** (${star}★)
▸ Score: ${score}
**▸ Rank: ${rank} ▸ Combo: ${combo}/${fc}** 
**▸ PP: ${pp}** [${fcguess}]
**▸ Accuracy: ${acc}%** [${count300}/${count100}/${count50}/${countmiss}]`
            }
            const embed = new Discord.RichEmbed()
            .setAuthor(`Top osu!Standard Plays for ${username}`)
            .setThumbnail(`http://s.ppy.sh/a/${userid}.png?date=${refresh}`)
            .setColor('#7f7fff')
            .setDescription(top)
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
                            beatmapid.push(msg.substring(start,i-4))
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
                if (msg.substr(m,31) == 'https://osu.ppy.sh/beatmapsets/') {
                    start = m + 31
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
                    fl: 1024
                }
                for (var m = 0; m <= mods[i].length; m++) {
                    if (mod[mods[i].substr(m*2,2)]) {
                        bitpresent += mod[mods[i].substr(m*2,2)]
                    }
                }
                var map = await osuApi.getBeatmaps({b: beatmapid[i]})
                var beatmapidfixed = map[0].beatmapSetId
                var title = map[0].title
                var mapper = map[0].creator
                var totallength = map[0].time.total
                var bpm = map[0].bpm
                if (mods[i].includes('dt') == true){
                    totallength = Number(totallength / 1.5).toFixed(0)
                    bpm = Number(bpm * 1.5).toFixed(0)
                }
                var time = `${Math.floor(totallength / 60)}:${totallength - Math.floor(totallength / 60) * 60}`
                var version = map[0].version
                var maxCombo = map[0].maxCombo
                var acc95 = await mapcalc(beatmapid[i],bitpresent,maxCombo,0,0,0,95,0)
                var acc99 = await mapcalc(beatmapid[i],bitpresent,maxCombo,0,0,0,99,0)
                var acc100 = await mapcalc(beatmapid[i],bitpresent,maxCombo,0,0,0,100,0)
                var ar = acc100.ar
                var od = acc100.od
                var hp = acc100.hp
                var cs = acc100.cs
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
<:difficultyIcon:507522545759682561> __${version}__  ▸ **Max Combo:** ${maxCombo}
▸**AR:** ${ar} ▸**OD:** ${od} ▸**HP:** ${hp} ▸**CS:** ${cs}
▸**PP:** | **95%**-${Number(acc95.pp.total).toFixed(2)}pp | **99%**-${Number(acc99.pp.total).toFixed(2)}pp | **100%**-${Number(acc100.pp.total).toFixed(2)}pp`)
                message.channel.send({embed});
            }

        }

        async function osud() {
            var check = message.content.substring(8);
            var name = checkplayer(check)
            var best = await osuApi.getUserBest({u: name, limit: 100})
            for (var i = 0; i < 100; i++) {
                var beatmapid = best[i][1].id
                var thing = await mapcalc(beatmapid,0,0,0,0,0,0,0)
            }
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

        if (msg.substring(0,10) == '!osuavatar' && msg.substring(0,10) == command) {
            osuavatar()
        }

        if (msg.substring(0,4) == '!osu' && msg.substring(0,4) == command) {
            var check = message.content.substring(5)
            var name = checkplayer(check)
            osu(name,0,'Standard')
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
        if (msg.substring(0,5) == '!osud' && msg.substring(0,5) == command) {
            message.channel.send('Commands work in progress! >.<')
        }

        if (msg.substring(0,8) == '!beatmap' && msg.substring(0,8) == command) {
            message.channel.send('Commands work in progress! >.<')
        }

        if (msg.substring(0,7) == '!recent' && msg.substring(0,7) == command) {
            recent(8)
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
            osutop()
        }

        // Detection
        beatmapdetail()

    }

})
bot.login(process.env.BOT_TOKEN);
