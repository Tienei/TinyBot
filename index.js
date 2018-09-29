const Discord = require('discord.js');
const osu = require('node-osu');
const bot = new Discord.Client();
const request = require('request-promise-native');
const calc = require('ojsama')


var cache =   [{"username":"292523841811513348","osuname":"Tienei"},{"username":"413613781793636352","osuname":"yazzymonkey"},{"username":"175179081397043200","osuname":"pykemis"},{"username":"253376598353379328","osuname":"jpg"},{"username":"183918990446428160","osuname":"Pillows"},{"username":"103139260340633600","osuname":"Jamu"},{"username":"384878793795436545","osuname":"jp0806"},{"username":"179059666159009794","osuname":"Loopy542"},{"username":"253376598353379328","osuname":"jpg"},{"username":"254273747484147713","osuname":"Nashiru"},{"username":"244923259001372672","osuname":"gimli"},{"username":"228166377502932992","osuname":"zwoooz"},{"username":"228166377502932992","osuname":"zwoooz"},{"username":"339968422332858371","osuname":"Nintelda"},{"username":"327449679790866432","osuname":"KGbalaTOK"},{"username":"81826878335225856","osuname":"OzzyOzborne"},{"username":"218885558963798017","osuname":"ryuriu"},{"username":"205339113858138112","osuname":"PotatoBoy123"},{"username":"257022908512206849","osuname":"Great Fog"},{"username":"391571903308890113","osuname":"TatsuMon"}]

 
var osuApi = new osu.Api('70095e8e72a161b213c44dfb47b44daf258c70bb', {
    notFoundAsError: false,
    completeScores: true
});

var refresh = 0

bot.on("ready", (ready) => {
    var date = new Date()
    var day = date.getDate()
    var month = date.getMonth()
    function getTime() {
        console.log('owo')
        date = new Date()   
        day = date.getDate()
        month = date.getMonth()
        if (day == 8 && month == 8) {
            bot.channels.get('487479898903150612').send('Happy Birthday Tiny!!! :tada: :birthday: :tada:')
        }
    }
    
    setInterval(getTime,1500)
});

bot.on("message", (message) => {

    var msg = message.content.toLowerCase();
    refresh = Math.round(Math.random()* 4294967295)

    if (msg.substring(0,5) == '!help') {
        message.channel.send(`
Tiny bot command:
//[General]
!avatar (username): Check user profile picture
// [osu!]
!osu (username): Check user osu status
!taiko (username): Check user taiko status
!ctb (username): Check user ctb status
!mania (username): Check user mania status
!recent (username): Check user most recent play
!compare (username): Compare with other!
!osutop (username,number[1-100]): Check your top best 100 play!
[Note: If your osu username have a space in it, replace it with a "_"]`, {code:"css"})
    }

    // General related

    if(msg.substring(0,7) == '!avatar') {
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

    // Osu related

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
        return {star: stars,pp: pp,acc: accuracy}
    }

    async function osu(name, mode, modename) {
        var user = await osuApi.apiCall('/get_user', {u: `${name}`, m: `${mode}`})
        if (user.length == 0) {
            message.channel.send('Invalid user or data not found')
        }
        var username = user[0].username
        var acc = Number(user[0].accuracy).toFixed(2)
        var id = user[0].user_id
        var pp = Math.round(user[0].pp_raw);
        var played = user[0].playcount
        var rank = user[0].pp_rank
        var countryrank = user[0].pp_country_rank
        var country = user[0].country.toLowerCase();
        var level = user[0].level
        var ss = Number(user[0].count_rank_ss) + Number(user[0].count_rank_ssh)
        var s = Number(user[0].count_rank_s) + Number(user[0].count_rank_sh)
        var a = user[0].count_rank_a

        const embed = new Discord.RichEmbed()
        .setTitle(`Osu!${modename} status for: ${username}`)
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

    if (msg.substring(0,7) == '!osuset') {
        async function osuset () {
            var osuname = message.content.substring(8)
            var detected = false
            var user = await osuApi.getUser({u: `${osuname}`})
            var name = user.name
            if (name == undefined) {
                message.channel.send('Please enter a valid osu username! >:c')
            } else {
                for (var i = 0; i <= cache.length - 1; i++) {
                    if (cache.length <= 0) {
                        cache.push({"username":message.author.id,"osuname":osuname})
                    }
                    if (i < cache.length - 1) {
                        if (cache[i].username == message.author.id) {
                            cache[i].osuname = osuname
                            detected = true
                        }
                    }
                }
                if (detected == false) {
                    cache.push({"username":message.author.id,"osuname":osuname})
                }
                message.channel.send(`You account has been linked to osu! username **${osuname}**`)
                bot.channels.get('487482583362568212').send(`***User set:*** \n ${JSON.stringify(cache)}`)
            }
        }
        osuset()
    }

    if (msg.substring(0,10) == '!osuavatar') {
        async function avatar() {
            var name = message.content.substring(11)
            var user = await osuApi.apiCall('/get_user', {u: `${name}`})
            var username = user[0].username
            var id = user[0].user_id
            const embed = new Discord.RichEmbed()
            .setAuthor(`Avatar for ${username}`)
            .setImage(`https://a.ppy.sh/${id}_1.png`)
            message.channel.send({embed})
        }
        avatar()
    }

    if (msg.substring(0,4) == '!osu' && msg.substring(0,7) !== '!osuset' && msg.substring(0,7) !== '!osutop' && msg.substring(0,5) !== '!osud' && msg.substring(0,10) !== '!osuavatar') {
        var check = message.content.substring(5)
        var name = checkplayer(check)
        osu(name,0,'Standard')
    }

    if (msg.substring(0,6) == '!taiko') {
        var check = message.content.substring(7)
        var name = checkplayer(check)
        osu(name,1,'Taiko')
    }

    if (msg.substring(0,4) == '!ctb') {
        var check = message.content.substring(5)
        var name = checkplayer(check)
        osu(name,2,'Catch The Beat')
    }
    if (msg.substring(0,6) == '!mania') {
        var check = message.content.substring(7)
        var name = checkplayer(check)
        osu(name,3,'Mania')
    }

    if (msg.substring(0,5) == '!osud') {
        message.channel.send('Commands work in progress! >.<')
        async function osud() {
            var check = message.content.substring(8);
            var name = checkplayer(check)
            var best = await osuApi.getUserBest({u: `${name}`, limit: 100})
            for (var i = 0; i < 100; i++) {
                var beatmapid = best[i][1].id
                var thing = await mapcalc(beatmapid,0,0,0,0,0,0,0)
            }
        }
    }

    if (msg.substring(0,8) == '!beatmap') {
        message.channel.send('Commands work in progress! >.<')
        async function beatmap() {
            var check = message.content.substring(9);
            var name = checkplayer(check)
            var beatmap = await osuApi.getBeatmaps({u: name, limit: 50})
            if (beatmap.length == 0) {
                message.channel.send(`${name} didn't map anything yet! Nani? **-Tiny**`)
            }
        }
    }

    if (msg.substring(0,7) == '!recent') {
        async function recent() {
            var check = message.content.substring(8);
            var name = checkplayer(check)
            var recent = await osuApi.getUserRecent({u: `${name}`})
            if (recent.length == 0) {
                message.channel.send('No play found within 24 hours of this user **-Tiny**')
            }
            var getplayer = await osuApi.apiCall('/get_user', {u: `${name}`})
            var beatmapid = recent[0][1].id
            var map = await osuApi.apiCall('/get_beatmaps', {b: `${beatmapid}`})
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
            var beatmapidfixed = map[0].beatmapset_id
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
        recent()
    }

    if (msg.substring(0,8) == '!compare') {
        async function compare() {
            var check = message.content.substring(9);
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
            var scores = await osuApi.getScores({b: `${storedid}`, u: `${name}`})
            if (scores.length == 0) {
                message.channel.send(`${name} didn't play this map! D: **-Tiny**`)
            }
            var beatmap = await osuApi.getBeatmaps({b: `${storedid}`})
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
        compare()
    }

    if (msg.substring(0,7) == '!osutop') {
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
            var best = await osuApi.getUserBest({u: `${name}`, limit: 100})
            if (best.length == 0) {
                message.channel.send(`I think ${name} didn't play anything yet~ **-Chino**`)
            }
            var userid = best[0][0].user.id
            var user = await osuApi.getUser({u: `${userid}`})
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
        osutop()
    }

})
bot.login(process.env.BOT_TOKEN);
