var user_data = {}
var osu_track = []
var stored_map_ID = []
var easter_egg = {}
var cooldown = {}
var custom_command = {}
var user_economy_data = {}
var server_data = {}

var osuApik = process.env.OSU_KEY

const Discord = require('discord.js');
const nodeosu = require('node-osu');
const request = require('request-promise-native');
const calc = require('ojsama')
const rxcalc = require('rx-akatsuki-pp')
const fs = require('fs')
const cheerio = require('cheerio')
const jimp = require('jimp')
const generate = require('node-chartist');
const sharp = require('sharp')

const bot = new Discord.Client();

var osuApi = new nodeosu.Api(osuApik, {
    notFoundAsError: false,
    completeScores: true
});

var trackApi = new nodeosu.Api(osuApik, {
    notFoundAsError: false,
    completeScores: false
});

var ee = JSON.parse(process.env.EASTER_EGG)
var ee_number = 0

var loading = 1
var bot_ver = 'v4.0-osu-beta3'
var refresh = 0
var bot_command_help = []

function osu_ranking_letters(letter) {
    const lettericon = {
        "SSH": '<:rankingXH:520932395080482858>',
        "SS": '<:rankingX:520932410746077184>',
        "XH": '<:rankingXH:520932395080482858>',
        "X": '<:rankingX:520932410746077184>',
        "SH": '<:rankingSH:520932441687588864>',
        "S": '<:rankingS:520932426449682432>',
        "A": '<:rankingA:520932311613571072>',
        "B": '<:rankingB:520932334061748224>',
        "C": '<:rankingC:520932353103626271>',
        "D": '<:rankingD:520932369172004869>',
        "F": '<:rankingF:557836461077168138>'
    }
    return lettericon[letter]
}

function osu_mods_enum(mod, type) {
    const numbermods = {
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
    const textmods = {
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
    if (type == 'text') {
        for (var i = 0; i < mod.length; i++) {
            if (shortenmod.includes('DT') == true && textmods[mod[i]] == 'NC') {
                shortenmod = shortenmod.substring(0,shortenmod.length - 2)
            }
            if (shortenmod.includes('SD') == true && textmods[mod[i]] == 'PF') {
                shortenmod = shortenmod.substring(0,shortenmod.length - 2)
            }
            if (textmods[mod[i]]) {
                shortenmod += textmods[mod[i]];
                bitpresent += nodeosu.Constants.Mods[mod[i]]
            }
        }
        if (mod.length == 0 || shortenmod == '+'){
            shortenmod += 'No Mod';
        }
    } else if (type == 'number') {
        bitpresent = mod
        var bit = mod.toString(2)
        var fullbit = "0000000000000000000000000000000".substr(bit.length) + bit
        for (var i = 31; i >= 0; i--) {
            if (fullbit[i] == 1) {
                shortenmod += numbermods[i+1]
            }
        }
        if (mod == 0) {
            shortenmod += 'No Mod'
        }
    }
    return {shortenmod: shortenmod, bitpresent: Number(bitpresent)}
}

function time_played(time) {
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
    var count = 0
    if (year > 0 && count < 2) {
        text += year > 1 ? `${year} Years ` : `${year} Year `
        count += 1
    } 
    if (month > 0 && count < 2) {
        text += month > 1 ? `${month} Months ` : `${month} Month `
        count += 1
    } 
    if (day > 0 && count < 2) {
        text += day > 1 ? `${day} Days ` : `${day} Day `
        count += 1
    }
    if (hour > 0 && count < 2)  {
        text += hour > 1 ? `${hour} Hours ` : `${hour} Hour `
        count += 1
    } 
    if (min > 0 && count < 2) {
        text += min > 1 ? `${min} Minutes ` : `${min} Minute `
        count += 1
    }
    if (sec > 0 && count < 2) {
        text += sec > 1 ? `${sec} Seconds ` : `${sec} Second `
        count += 1
    }
    text += ' ago'
    return text
}

function beatmap_detail(mods,timetotal,timedrain,bpm,cs,ar,od,hp) {
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
        if (od < 5) {
            odms = 66 - ((5 - od) * 8)
        }
        if (od == 5) {
            odms = 66
        }
        if (od > 5) {
            odms = 66 - ((od - 5) * 8)
        }
        od = (odms - 79.6) / -6
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
        if (arms > 1200) {
            ar = (1200 + 600 - arms) / 120
        }
        if (od < 5) {
            odms = 33 + ((5 - od) * 4)
        }
        if (od == 5) {
            odms = 33
        }
        if (od > 5) {
            odms = 33 - ((od - 5) * 4)
        }
        od = (odms - 79.6) / -6
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
    return {bpm: bpm, cs: cs, ar: ar, od: od, hp: hp, timetotal: timetotal, timedrain: timedrain}
}

async function precalc(beatmapid) {
    var parser = new calc.parser()
    var map = await request.get(`https://osu.ppy.sh/osu/${beatmapid}`)
    parser.feed(map)
    return parser
}

function osu_pp_calculator(parser,mods,combo,count100,count50,countmiss,acc,mode) {
    var stars = new calc.diff().calc({map: parser.map, mods: mods})
    var bpm = 0
    var bpmchanged = 0
    for (var i = 0; i < stars.map.timing_points.length; i++) {
        if (stars.map.timing_points[i].change == true) {
            bpmchanged += 1
            bpm += 60000 / Number(stars.map.timing_points[i].ms_per_beat)
        }
    }
    bpm = Math.round(bpm / bpmchanged)
    var object = Number(stars.objects.length)
    var accuracy = 0
    if (mode == 'fc') {
        var count300 = object - count100 - count50
        accuracy = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
    }
    if (mode == 'acc') {
        accuracy = acc
    }
    var score = {
        stars: stars,
        combo: combo,
        nmiss: countmiss,
        acc_percent: accuracy
    }
    var pp = ''
    if (mode == 'fc' || mode == 'acc') {
        pp = calc.ppv2(score)
    } else if (mode == 'rx_fc') {
        pp = rxcalc.ppv2(score)
    }
    return {star: stars,pp: pp,acc: accuracy, bpm: bpm, ar: stars.map.ar, od: stars.map.od, hp: stars.map.hp, cs: stars.map.cs}
}

// fullbit[fullbit.length - (Math.log2( Mod's bitpresent ) + 1)] == 1

async function other_modes_precalc(beatmapid, mode, mod) {
    var bit = mod.toString(2)
    var fullbit = "0000000000000000000000000000000".substr(bit.length) + bit
    var bitpresent = 0
    var map = ''
    if (fullbit[fullbit.length - (Math.log2(64) + 1)] == 1) {
        bitpresent += 64
    }
    if (fullbit[fullbit.length - (Math.log2(256) + 1)] == 1) {
        bitpresent += 256
    }
    if (fullbit[fullbit.length - (Math.log2(16) + 1)] == 1) {
        bitpresent += 16
    }
    if (fullbit[fullbit.length - (Math.log2(2) + 1)] == 1) {
        bitpresent += 2
    }
    if (bitpresent > 0) {
        map = await osuApi.apiCall('/get_beatmaps', {b: beatmapid, m: mode, a: 1, mods: bitpresent})
    } else {
        map = await osuApi.apiCall('/get_beatmaps', {b: beatmapid, m: mode, a: 1})
    }
    var ar = map[0].diff_approach
    var fc = Number(map[0].count_normal) + Number(map[0].count_slider)
    if (mode == 2) {
        var textmod = osu_mods_enum(mod, "number")
        ar = beatmap_detail(textmod.shortenmod, 0, 0, 0, 0, map[0].diff_approach, 0, 0).ar
        fc = map[0].max_combo
    }
    return {
        star: Number(map[0].difficultyrating), 
        cs: Number(map[0].diff_size),
        ar: Number(ar),
        od: Number(map[0].diff_overall),
        hp: Number(map[0].diff_drain),
        circle: Number(map[0].count_normal),
        slider: Number(map[0].count_slider),
        fc: fc
    }
}

function taiko_pp_calculator(star, od, fc, acc, miss, mod) {
    // Maximum combo for converted taiko map is roughly estimated sadly :c
    // Mod to binary
    var bit = mod.toString(2)
    var fullbit = "0000000000000000000000000000000".substr(bit.length) + bit
    // Calc
    if (fullbit[fullbit.length - (Math.log2(2) + 1)] == 1) {
        od /= 2
    }
    if (fullbit[fullbit.length - (Math.log2(16) + 1)] == 1) {
        od *= 1.4
    }
    od = Math.max(Math.min(od,10),0)
    var max = 20
    var min = 50
    var result = min + (max - min) * od / 10
    result = Math.floor(result) - 0.5
    if (fullbit[fullbit.length - (Math.log2(256) + 1)] == 1) {
        result /= 0.75
    }
    if (fullbit[fullbit.length - (Math.log2(64) + 1)] == 1 || fullbit[fullbit.length - (Math.log2(512) + 1)] == 1) {
        result /= 1.5
    }
    od = Math.round(result * 100) / 100
    var StrainValue = Math.pow(Math.max(1,star/0.0075) * 5 - 4,2)/100000
    var LengthBonus = Math.min(1,fc/1500) * 0.1 + 1
    StrainValue *= LengthBonus
    StrainValue *= Math.pow(0.985,miss)
    StrainValue *= Math.min(Math.pow(fc - miss,0.5) / Math.pow(fc,0.5),1)
    StrainValue *= acc/100
    var AccValue = Math.pow(150/od,1.1) * Math.pow(acc/100,15) * 22
    AccValue *= Math.min(Math.pow(fc/1500,0.3),1.15)
    var modMultiplier = 1.10
    if (fullbit[fullbit.length - (Math.log2(8) + 1)] == 1) {
        modMultiplier *= 1.10
        StrainValue *= 1.025
    }
    if (fullbit[fullbit.length - (Math.log2(1) + 1)] == 1) {
        modMultiplier *= 0.90
    }
    if (fullbit[fullbit.length - (Math.log2(1024) + 1)] == 1) {
        StrainValue *= 1.05 * LengthBonus
    }
    return Math.pow(Math.pow(StrainValue,1.1) + Math.pow(AccValue,1.1),1.0/1.1) * modMultiplier;
}

function ctb_pp_calculator(star, ar, fc, combo, acc, miss, mod) {
    // Mod to binary
    var bit = mod.toString(2)
    var fullbit = "0000000000000000000000000000000".substr(bit.length) + bit
    // Conversion from Star rating to pp
    var final = Math.pow(((5*(star)/ 0.0049)-4),2)/100000; 
    // Length Bonus
    lengthbonus = (0.95 + 0.4 * Math.min(1.0, fc / 3000.0) + (fc > 3000 ? Math.log10(fc / 3000.0) * 0.5 : 0.0));
    final *= lengthbonus;
    // Miss Penalty
    final *= Math.pow(0.97, miss);
    // Not FC combo penalty
    final *= Math.pow(combo/fc,0.8);
    // AR Bonus
    if (ar>9) {
        final*= 1+  0.1 * (ar - 9.0);
    }
    if (ar<8) {
        final*= 1+  0.025 * (8.0 - ar);
    }
    // Acc Penalty
    final *=  Math.pow(acc/100, 5.5);
    // Mod applied
    if (fullbit[fullbit.length - (Math.log2(8) + 1)] == 1) {
        return final* (1.05 + 0.075 * (10.0 - Math.min(10, ar)))
    } else if (fullbit[fullbit.length - (Math.log2(1024) + 1)] == 1) {
        return final * 1.35 * lengthbonus
    } else if (fullbit[fullbit.length - (Math.log2(1024) + 1)] == 1 && fullbit[fullbit.length - (Math.log2(8) + 1)] == 1) {
        return final* 1.35 * lengthbonus*(1.05 + 0.075 * (10.0 - Math.min(10, ar)))
    } else {
        return final
    }
}

function mania_pp_calculator(star, od, score, objects, mod) {
    // Mod to binary
    var bit = mod.toString(2)
    var fullbit = "0000000000000000000000000000000".substr(bit.length) + bit
    // Calc
    var nerfod = fullbit[fullbit.length - (Math.log2(2) + 1)] == 1 ? 0.5 : 1
    var nerfpp = (fullbit[fullbit.length - (Math.log2(2) + 1)] == 1 ? 0.5 : 1) * (fullbit[fullbit.length - (Math.log2(1) + 1)] == 1 ? 0.9 : 1)
     //StrainBase
    var sb = Math.pow(5*Math.max(1,star/0.2)-4,2.2)/135*(1+0.1*Math.min(1,objects/1500));
     //StrainMultiplier
    var sm = (score<500000) ? score/500000*0.1 : ((score<600000) ? (score-500000)/100000*0.3 : ((score<700000) ? (score-600000)/100000*0.25+0.3 : ((score<800000) ? (score-700000)/100000*0.2+0.55 : ((score<900000) ? (score-800000)/100000*0.15+0.75 : (score-900000)/100000*0.1+0.9))));
    //AccValue
	var av = (score>=960000) ? od*nerfod*0.02*sb*Math.pow((score-960000)/40000,1.1) : 0 
	return (0.73*Math.pow(Math.pow(av,1.1)+Math.pow(sb*sm,1.1),1/1.1)*1.1*nerfpp);
}

bot.on("ready", (ready) => {
    async function getFile() {
        try {
            // Get User data
            var backupmessage = await bot.channels.get('487482583362568212').fetchMessages({limit: 1})  
            var backup = backupmessage.first().attachments
            var fileurl = backup.first().url
            var file = await request.get(fileurl)
            user_data = JSON.parse(file)
            // Get track data
            var trackmessage = await bot.channels.get('497302830558871552').fetchMessages({limit: 1})
            var trackbackup = trackmessage.first().attachments
            var trackurl = trackbackup.first().url
            var trackdata = await request.get(trackurl)
            osu_track = JSON.parse(trackdata)
            // Get easter egg data
            var eemessage = await bot.channels.get('569168849992417315').fetchMessages({limit: 1})
            var eebackup = eemessage.first().attachments
            var eeurl = eebackup.first().url
            var eedata = await request.get(eeurl)
            easter_egg = JSON.parse(eedata)
            for (var i = 0 ; i < Object.keys(ee).length; i++) {
                ee_number += '0'
            }
            // Get custom commands data
            var ccmessage = await bot.channels.get('572585703989575683').fetchMessages({limit: 1})
            var ccbackup = ccmessage.first().attachments
            var ccurl = ccbackup.first().url
            var ccdata = await request.get(ccurl)
            custom_command = JSON.parse(ccdata)
            // Get economy data
            var ecomessage = await bot.channels.get('578105172237221889').fetchMessages({limit: 1})
            var ecobackup = ecomessage.first().attachments
            var ecourl = ecobackup.first().url
            var ecodata = await request.get(ecourl)
            user_economy_data = JSON.parse(ecodata)
            // Get server data
            var servermessage = await bot.channels.get('586397586802343936').fetchMessages({limit: 1})
            var serverbackup = servermessage.first().attachments
            var serverurl = serverbackup.first().url
            var serverdata = await request.get(serverurl)
            server_data = JSON.parse(serverdata)
            loading = 0
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
        for (var player = 0; player < osu_track.length ; player++) {
            for (var i = 0; i < osu_track[player].trackonchannel.length; i++) {
                if (bot.channels.get(osu_track[player].trackonchannel[i]) == undefined) {
                    if (osu_track[player].trackonchannel.length > 1) {
                        osu_track[player].trackonchannel.splice(i,1)
                    } else {
                        osu_track.splice(player,1)
                    }
                }
            }
            // New
            var name = osu_track[player].osuname
            var top50 = osu_track[player].top50pp
            var recent = await trackApi.getUserRecent({u: name, limit: 1})
            if (recent.length !== 0) {
                if (String(osu_track[player].recenttimeplay) !== String(recent[0].date)) {
                    console.log(osu_track[player].osuname + ' new recent')
                    osu_track[player].recenttimeplay = recent[0].date
                    var beatmapid = recent[0].beatmapId
                    var beatmap = await osuApi.getBeatmaps({b: beatmapid})
                    var beatmaptitle = beatmap[0].title
                    var beatmapidfixed = beatmap[0].beatmapSetId
                    var diff = beatmap[0].version
                    var count300 = Number(recent[0].counts['300'])
                    var count100 = Number(recent[0].counts['100'])
                    var count50 = Number(recent[0].counts['50'])
                    var countmiss = Number(recent[0].counts.miss)
                    var combo = recent[0].maxCombo
                    var fc = beatmap[0].maxCombo
                    var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100)
                    var mod = recent[0].mods 
                    var modandbit = osu_mods_enum(mod, 'text')
                    var shortenmod = modandbit.shortenmod
                    var bitpresent = modandbit.bitpresent
                    var parser = await precalc(beatmapid)
                    var recentcalc = osu_pp_calculator(parser,bitpresent,combo,count100,count50,countmiss,acc,'acc')
                    // if calc pp > top 50 then new osutop play
                    if(Number(recentcalc.pp.total) > Number(top50)) {
                        var best = await trackApi.getUserBest({u: name, limit: 50})
                        for (var i = 0; i < best.length; i++) {
                            if (String(best[i].date) === String(recent[0].date)) {
                                console.log(osu_track[player].osuname + ' new top play')
                                var user = await osuApi.getUser({u: name})
                                var country = String(user.country).toLowerCase()
                                var pp = Number(best[i].pp).toFixed(2)
                                var ppgain = (Number(user.pp.raw).toFixed(2) - Number(osu_track[player].lasttotalpp)).toFixed(2)
                                var scores = best[i].score
                                var perfect = best[i].perfect
                                var letter = best[i].rank
                                var rank = osu_ranking_letters(letter)
                                var fccalc = osu_pp_calculator(parser,bitpresent,fc,count100,count50,0,acc,'fc')
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
                                .setAuthor(`New #${i+1} for ${name} in osu!Standard:`, `http://s.ppy.sh/a/${user.id}.png?date=${refresh}`)
                                .setThumbnail(`https://b.ppy.sh/thumb/${beatmapidfixed}l.jpg`)
                                .setDescription(`
**[${beatmaptitle}](https://osu.ppy.sh/b/${beatmapid})** (${star}★) ${shortenmod} | **${pp}pp** (+${ppgain}pp)
${rank} *${diff}* | **Scores:** ${scores} | **Combo:** ${combo}/${fc}
**Accuracy:** ${acc.toFixed(2)}% [${count300}/${count100}/${count50}/${countmiss}] ${fcguess}
**#${osu_track[player].lastrank} → #${user.pp.rank} (:flag_${country}: : #${osu_track[player].lastcountryrank} → #${user.pp.countryRank})** | Total PP: **${user.pp.raw}**`)
                                for (var i = 0; i < osu_track[player].trackonchannel.length; i++) {
                                    var server = bot.channels.get(osu_track[player].trackonchannel[i]).guild.id
                                    stored_map_ID.push({id:beatmapid,server: server, mode: "Standard"})
                                    embed.setColor(bot.channels.get(osu_track[player].trackonchannel[i]).guild.me.displayColor)
                                    bot.channels.get(osu_track[player].trackonchannel[i]).send({embed})
                                }
                                osu_track[player].lasttotalpp = user.pp.raw
                                osu_track[player].lastrank = user.pp.rank
                                osu_track[player].lastcountryrank = user.pp.countryRank
                                osu_track[player].top50pp = best[49].pp
                                break;
                            }
                        }
                    }
                }
            }
        }
    }
    setInterval(real_time_osu_track, 60000)
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
    if (message.author.bot == false && loading == 0){
        var msg = message.content.toLowerCase();
        refresh = Math.round(Math.random()* 2147483648)
        var command = msg.split(' ')[0]
        var embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)

        var bot_prefix = '!'

        if (message.guild !== null && server_data[message.guild.id] !== undefined) {
            bot_prefix = server_data[message.guild.id].prefix
        }

        function set_Command_cooldown(cdcommand,time) {
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

        function find_discord_user(name) {
            if (name !== '') {
                if (name.includes('@') == true) {
                    var id = message.mentions.users.first().id
                    if (id == message.author.id) {
                        return message.author
                    } else {    
                        return message.mentions.users.first()
                    }
                } else if (message.guild !== null) {
                    var member = message.guild.members.array()
                    for (var i = 0; i < message.guild.memberCount; i++) {
                        if (member[i].nickname !== null) {
                            if (member[i].nickname.substring(0, name.length).toLowerCase() == name) {
                                return member[i].user
                            }
                        } else {
                            if (member[i].user.username.substring(0, name.length).toLowerCase() == name) {
                                return member[i].user
                            }
                        }
                    }
                }
            } else {
                return null
            }
        }

        // General related

        if (command == bot_prefix + 'help') {
            try {
                function addhelp(helpcommand, fullcommand, description, option, example) {
                    var helptext = '```' + fullcommand + '```' + `\n${description}\n\n**---[Options]:**\n${option}\n\n**---[Example]:**\n` + example
                    bot_command_help.push({command: helpcommand, helptext: helptext})
                }
                if (bot_command_help.length < 1) {
                    // General
                    addhelp('avatar', '!avatar (user)', "View a user's discord avatar", 'user: User you want to view (Has to be @user)', '!avatar @Tienei#0000')
                    addhelp('changelog', '!changelog', 'View update and fix for the bot', 'None', '!changelog')
                    addhelp('help', '!help (command)', 'Get a full command list or view a specific command help', 'command: Command help you wanted to see', '!help osu')
                    addhelp('ping', '!ping', 'Ping Bancho (probably making Bancho mad sometimes lol)', 'None', '!ping')
                    addhelp('report', '!report (error)', 'Report an error or bug to the owner', 'error: Type any error or bug you found', '!report osu is broken')
                    addhelp('suggestion', '!suggestion (suggestion)', 'Suggesting an idea for the bot to the owner', 'error: Type any error or bug you found', '!report osu is broken')
                    addhelp('bot', '!bot', 'Get invitation of the bot', 'None', '!bot')
                    addhelp('checkbot', '!checkbot', 'Check the compatibility of the bot to the server permissions', 'None', '!checkbot')
                    addhelp('prefix','!prefix (prefix)', 'Change the prefix for the entire server','prefix: The prefix you wanted','!prefix >')
                    // Easter Egg
                    addhelp('ee', '!ee', 'View how many easter eggs you have', 'None', '!ee')
                    // Custom command
                    addhelp('customcmd', '!customcmd (action) (command)', 'Set a custom commands (Required Administration)', 'action: ``add`` ``list`` ``remove``\ncommand: Set a command you liked (do ``!help definedvar`` for more information)', '!customcmd add !hi Hello $0 and welcome to {server.name}')
                    // Fun
                    addhelp('hug', '!hug (user)', 'Hug someone', 'user: The name of the user (Discord)', '!hug Tienei')
                    addhelp('cuddle', '!cuddle (user)', 'Cuddle someone', 'user: The name of the user (Discord)', '!cuddle Tienei')
                    addhelp('slap', '!slap (user)', 'Slap someone', 'user: The name of the user (Discord)', '!slap Tienei')
                    addhelp('kiss', '!kiss (user)', 'Kiss someone (best not to kiss in public ;) )', 'user: The name of the user (Discord)', '!kiss Tienei')
                    addhelp('pat', '!pat (user)', 'Pat someone', 'user: The name of the user (Discord)', '!pat Tienei')
                    // Osu
                    addhelp('osu', '!osu (username) (options)', 'Get an osu!Standard profile', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the details of the player `(no param)`\nRank `(-rank)`: Get an osu!Standard profile by rank\nTop Skills `(-ts)`: Calculate player skill using bot formula', '!osu Tienei -d')
                    addhelp('taiko', '!taiko (username)', 'Get an osu!Taiko profile', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', '!taiko Tienei')
                    addhelp('ctb', '!ctb (username)', 'Get an osu!Catch the beat profile', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', '!ctb Tienei')
                    addhelp('mania', '!mania (username)', 'Get an osu!Mania profile', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', '!mania Tienei')
                    addhelp('osutop', '!osutop (username) (options)', "View a player's osu!Standard top play", 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)\nPage `(-page)`: Get top 100 in a form of pages `(No param)`\nSearch `(-search)`: Search for a specific play in top 100', '!osutop Tienei -m HDHR')
                    addhelp('taikotop', '!taikotop (username) (options)', "View a player's osu!Taiko top play", 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)\nPage `(-page)`: Get top 100 in a form of pages `(No param)`\nSearch `(-search)`: Search for a specific play in top 100', '!taikotop Tienei -p 8')
                    addhelp('ctbtop', '!ctbtop (username) (options)', "View a player's osu!Catch the beat top play", 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)\nPage `(-page)`: Get top 100 in a form of pages `(No param)`\nSearch `(-search)`: Search for a specific play in top 100', '!ctbtop Tienei -p 9')
                    addhelp('maniatop', '!maniatop (username) (options)', "View a player's osu!Mania top play", 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)\nPage `(-page)`: Get top 100 in a form of pages `(No param)`\nSearch `(-search)`: Search for a specific play in top 100', '!maniatop Tienei -p 4')
                    addhelp('osutrack', '!osutrack (username)', "Track a player's osu!Standard top 50 (Required Administration)", 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', '!osutrack Tienei')
                    addhelp('osutracklist', '!osutracklist', 'Get a list of player being tracked in the channel', 'None', '!osutracklist')
                    addhelp('untrack', '!untrack (username)', 'Untrack a player from the database (Required Administration)', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', '!untrack Tienei')
                    addhelp('recent', '![recent|r] (username) (options)', "Get player's most recent play", 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nRecent Best `(-b)`: Get player most recent best from top 100 `(No param)`\nStandard `(-Standard)`\nTaiko `(-Taiko)`\nCTB `(-CTB)`\nMania `(-Mania)`', '!r Tienei -b')
                    addhelp('compare', '![compare|c] (username) ', 'Compare to the last play in the chat', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nPrevious Play `(-p)`: Get a previous play mentioned in the chat `(Number)`', '!c Tienei')
                    addhelp('osuset', '!osuset (username)', 'Link your profile to an osu! player', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', '!osuset Tienei')
                    addhelp('osuavatar', '!osuavatar (username)', "Get player's osu! avatar", 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', '!osuavatar Tienei')
                    addhelp('osusig', '!osusig (username)', "Generate a signature of a player's profile", 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', '!osusig Tienei')
                    addhelp('map', '![map|m] (options)', 'Get details info of the map of the last play in the server', 'Mods: details info of the map with mods `(Shorten mods)`', '!m HDDT')
                    addhelp('topglobal', '!topglobal', 'Get a list of top 50 osu!Standard player', '', '!topglobal')
                    addhelp('topcountry', '!topcountry (country code)', 'Get a list of top 50 osu!Standard player of a country', 'country code: You can see a list right here: https://en.wikipedia.org/wiki/List_of_ISO_3166_country_codes (Look at ISO 3166-1, Alpha-2 code)', '!topcountry US')
                    addhelp('calcpp', '!calcpp (map id) (mods) (acc) (combo) (miss)', "Calculate a play's pp", '**Needs all options to be calculated**', '!calcpp 1157868 nomod 100 1642 0')
                    addhelp('scores', '!scores (map link) (username)', "Get player's play on a specific map", 'Map link: Just get a beatmap link\nusername: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', '!scores https://osu.ppy.sh/b/1157868 Cookiezi')
                    addhelp('acc', '!acc (300) (100) (50) (miss)', 'Accuracy calculator', '**Needs all options to be calculated**', '!acc 918 23 2 0')
                    addhelp('rec', '!rec', 'Recommend you an osu beatmap', 'None', '!rec')
                    addhelp('leaderboard', '!leaderboard', 'Get a list of top player in the server\nNote: The player stats will only be updated if the you type **!osu** or a specific player **!osu (player name)** only if they in the server', 'None', '!leaderboard')
                    // Akatsuki
                    addhelp('akatsuki', '!akatsuki (username) (options)', 'Get an Akatuski Standard profile', 'username: Akatsuki username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetails `(-d)`: Get all the details of the player `(no param)`', '!akatsuki Tienei -d')
                    addhelp('akatr', '!akatr (username)', "Get player's most recent play", 'username: Akatsuki username of the player (Space replaced with "_" or just use quotation mark ``"``)', '!akatr Tienei')
                    addhelp('akattop', '!akattop (username) (options)', "View a player's Akatsuki Standard top play", 'username: Akatsuki username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`', '!akattop Tienei -p 8')
                    addhelp('akatavatar', '!akatavatar (username)', "Get player's Akatsuki avatar", 'username: Akatsuki username of the player (Space replaced with "_" or just use quotation mark ``"``)', '!akatavatar Tienei')
                    addhelp('akatsukiset', '!akatsukiset (username)', 'Link your profile to an Akatsuki player', 'username: Akatsuki username of the player (Space replaced with "_" or just use quotation mark ``"``)', '!akatsukiset RelaxTiny')
                    addhelp('rxakatsuki', '!rxakatsuki (username) (options)', 'Get a Relax Akatuski Standard profile', 'username: Akatsuki username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetails `(-d)`: Get all the details of the player `(no param)`', '!akatsuki Tienei -d')
                    addhelp('rxakatr', '!rxakatr (username)', "Get player's most recent play", 'username: Akatsuki username of the player (Space replaced with "_" or just use quotation mark ``"``)', '!akatr Tienei')
                    addhelp('rxakattop', '!rxakattop (username) (options)', "View a player's Relax Akatsuki Standard top play", 'username: Akatsuki username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`', '!akattop Tienei -p 8')
                    addhelp('calcrxpp', '!calrxcpp (map id) (mods) (acc) (combo) (miss)', "Calculate a play's relax pp (Akatsuki)", '**Needs all options to be calculated**', '!calcpp 1157868 nomod 100 1642 0')
                    // Ripple
                    addhelp('ripple', '!ripple (username) (options)', 'Get an  Ripple Standard profile', 'username: Ripple username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the detailed of the player `(no param)`', '!ripple Tienei -d')
                    addhelp('rippler', '!rippler (username)', "Get player's most recent play", 'username: Ripple username of the player (Space replaced with "_" or just use quotation mark ``"``)', '!rippler Tienei')
                    addhelp('rippletop', '!rippletop (username) (options)', "View a player's Ripple Standard top play", 'username: Ripple username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`', '!rippletop Tienei -p 8')
                    addhelp('rippleavatar', '!rippleavatar (username)', "Get player's Ripple avatar", 'username: Ripple username of the player (Space replaced with "_" or just use quotation mark ``"``)', '!rippleavatar Tienei')
                    addhelp('rippleset', '!rippleset (username)', 'Link your profile to a Ripple player', 'username: Ripple username of the player (Space replaced with "_" or just use quotation mark ``"``)', '!rippleset RelaxTiny')
                    // Others
                    addhelp('definevar', 'Defined Variable for Custom command', 'user: ``selfname`` ``selfping`` ``selfcreatedtime`` ``selfpresence`` ``othercreatedtime`` ``otherpresence`` channel: ``selfname`` ``selflink`` ``members`` server: ``name`` ``members`` ``channels`` ``roles`` ``defaultchannel`` ``owner`` ``region`` ``createdtime``', '{require:admin}: Need Administrator to enable the command {$N}: Get text in message seperated by space (Not include command) {send:channelname "message"}: Send to a channel with a specific message', 'do ``!help customcmd``')
                    addhelp('osu -d calculation', 'Osu -d calculation', 'Star: Avg stars of the top 50 plays\nAim: Aim stars play * (CS ^ 0.1 / 4 ^ 0.1)\nSpeed: Speed stars play * (BPM ^ 0.3 / 180 ^ 0.3) * (AR ^ 0.1 / 6 ^ 0.1)\nAccuracy: (Plays accuracy ^ 2.5 / 100 ^ 2.5) * 1.08 * Map stars * (OD ^ 0.03 / 6 ^ 0.03) * (HP ^ 0.03 / 6 ^ 0.03)', 'None', 'None')
                }
                var generalhelp = '**--- [General]:**\n`avatar` `changelog` `help` `ping` `report` `suggestion` `ee` `customcmd` `bot` `prefix`'
                var funhelp = '**--- [Fun]:**\n`hug` `cuddle` `slap` `kiss` `pat`'
                var osuhelp = '**--- [osu!]:**\n`osu` `taiko` `ctb` `mania` `osutop` `taikotop` `ctbtop` `maniatop` `osutrack` `untrack` `map` `osuset` `osuavatar` `osusig` `recent` `compare` `calcpp` `scores` `acc` `rec` `topglobal` `topcountry` `leaderboard`'
                var akatsukihelp = '**--- [Akatsuki]:**\n`akatsuki` `akatr` `akatavatar` `akattop` `rxakatsuki` `rxakatr` `rxakattop`'
                var ripplehelp = '**--- [Ripple]:**\n`ripple` `rippler` `rippleavatar` `rippletop`'
                var otherhelp = '**--- [Other]:**\n`definevar` `osu -d calculation`'
                var text = ''
                if (msg.substring(6) == '') {
                    text = `${generalhelp}\n\n${funhelp}\n\n${osuhelp}\n\n${akatsukihelp}\n\n${ripplehelp}\n\n${otherhelp}\n\nFor more detailed infomation, type **!help (command)**`
                } else {
                    var getcmd = msg.substring(6)
                    if (bot_command_help.find(helpcmd => helpcmd.command).helptext == undefined) {
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
                    if (getcmd == 'lb') {
                        getcmd = 'leaderboard'
                    }
                    text = bot_command_help.find(helpcmd => helpcmd.command == getcmd).helptext
                }
                const embed = new Discord.RichEmbed()
                .setAuthor(`Commands for Tiny Bot ${bot_ver}`)
                .setColor(embedcolor)
                .setThumbnail(bot.user.avatarURL)
                .setDescription(text)
                message.channel.send({embed})
            } catch (error) {
                message.channel.send(String(error))
            }
        }
        if (command == bot_prefix + 'credit') {
            const embed = new Discord.RichEmbed()
            .setAuthor(`Special thanks to:`)
            .setColor(embedcolor)
            .setThumbnail(bot.user.avatarURL)
            .setDescription(`
**--- Special helper ❤:**
Great Fog (!m, partial !osud, !acc, total pp in !osud, v3, !osutop -a)

**--- Command idea from:**
Yeong Yuseong (!calcpp, !compare sorted by pp, !r Map completion, !osutop -p with ranges, !suggestion, !osu -d common mods), 1OneHuman (!mosutop, !rosutop, !scores), Shienei (!c Unranked pp calculation), jpg (Time ago), lokser (!osu -d length avg), Xpekade (Economy), Rimu (new !osu design), zibi (!topglobal, !topcountry), PotatoBoy123 (!lb)

**--- Tester:**
ReiSevia, Shienei, FinnHeppu, Hugger, rinku, Rosax, -Seoul`)
            message.channel.send({embed})
        }
        if (command == bot_prefix + 'avatar') {
            var user = find_discord_user(msg.substring(8))
            var username = user.username
            var image = user.avatarURL
            const embed = new Discord.RichEmbed()
            .setAuthor(`Avatar for ${username}`)
            .setColor(embedcolor)
            .setImage(image)
            message.channel.send({embed})
        }
        if (command == bot_prefix + 'changelog') {
            const embed = new Discord.RichEmbed()
            .setAuthor(`Changelog for Tiny Bot ${bot_ver}`)
            .setColor(embedcolor)
            .setThumbnail(bot.user.avatarURL)
            .setDescription(`
**September Update:**
--- [September 18th]:
+ Added !c -p, !osutop -s (Idea by Yeong Yuseong)
+ Redesign text display
Note: This is an osu beta version, which mean it's still in development and new feature is coming later`)
            message.channel.send({embed})
        }
        if (command == bot_prefix + 'bot') {
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
        if (command == bot_prefix + 'ping') {
            try {
                if (cooldown[message.author.id] !== undefined && cooldown[message.author.id].indexOf(command) !== -1) {
                    throw 'You need to wait 5 seconds before using this again!'
                }
                set_Command_cooldown(command, 5000)
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
        if (command == bot_prefix + 'prefix' && message.guild !== null) {
            try {
                if (message.member.hasPermission("ADMINISTRATOR") == false) {
                    throw 'You need to have administrator to set prefix'
                }
                var new_prefix = msg.split(' ')[1]
                set_Command_cooldown(command, 30000)
                if (new_prefix == '!') {
                    message.channel.send('Prefix has been set back to default: !')
                    delete server_data[message.guild.id]
                } else {
                    if (server_data[message.guild.id] == undefined) {
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
                fs.writeFileSync('server.txt', JSON.stringify(server_data))
                bot.channels.get('586397586802343936').send({files: [{
                    attachment: './server.txt',
                    name: 'server.txt'
                }]})
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        if (command == bot_prefix + 'report' && message.guild !== null) {
            try {
                if (cooldown[message.author.id] !== undefined && cooldown[message.author.id].indexOf(command) !== -1) {
                    throw 'You need to wait 30 seconds before using this again!'
                }
                set_Command_cooldown(command, 30000)
                var error = message.content.substring(8)
                if (error == '') {
                    throw "Type an error"
                }
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

        if (command == bot_prefix + 'suggestion' && message.guild !== null) {
            try {
                if (cooldown[message.author.id] !== undefined && cooldown[message.author.id].indexOf(command) !== -1) {
                    throw 'You need to wait 30 seconds before using this again!'
                }
                set_Command_cooldown(command, 30000)
                var suggestion = message.content.substring(12)
                if (suggestion == '') {
                    throw 'Type a suggestion for the bot'
                }
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

        if (command == bot_prefix + 'customcmd' && message.guild !== null) {
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
                    if (custom_command[message.guild.id] !== undefined) {
                        if (custom_command[message.guild.id].find(savedcmd => savedcmd.cmd == cmd) !== undefined) {
                            custom_command[message.guild.id].find(savedcmd => savedcmd.cmd == cmd).respond = respond
                        } else {
                            custom_command[message.guild.id].push({cmd: cmd, respond: respond})
                        }
                    } else {
                        custom_command[message.guild.id] = [{cmd: cmd, respond: respond}]
                    }
                    message.channel.send('Custom command was added')
                    fs.writeFileSync('customcmd.txt', JSON.stringify(custom_command))
                    bot.channels.get('572585703989575683').send({files: [{
                    attachment: './customcmd.txt',
                    name: 'customcmd.txt'
                    }]})
                }
                if (option == "list") {
                    var savedcmd = ""
                    for (var i = 0; i < custom_command[message.guild.id].length; i++) {
                        savedcmd += "``" + custom_command[message.guild.id][i].cmd + "``: " + custom_command[message.guild.id][i].respond
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
                    if (custom_command[message.guild.id].length > 1) {
                        for (var i = 0; i < custom_command[message.guild.id].length; i++) {
                            if (custom_command[message.guild.id][i] == cmd) {
                                custom_command[message.guild.id].splice(i,1)
                            }
                        }
                    } else {
                        delete custom_command[message.guild.id]
                    }
                    if (Object.keys(custom_command).length < 1) {
                        custom_command['a'] = 'a'
                    }
                    message.channel.send('Custom command was removed')
                    fs.writeFileSync('customcmd.txt', JSON.stringify(custom_command))
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
            if (custom_command[message.guild.id] !== undefined && custom_command[message.guild.id].find(cmd => cmd.cmd == command) !== undefined) {
                try {
                    var respond = custom_command[message.guild.id].find(cmd => cmd.cmd == command).respond
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
                                    var found = false
                                    if (type[0].substring(0,1) == "$") {
                                        var number = Number(type[0].substring(1))
                                        var option = message.content.split(" ", 10)
                                        option.splice(0,1)
                                        respond = respond.replace(respond.substring(s,e+1), option[number])
                                        found = true
                                    }
                                    if (type[0] == "require:admin") {
                                        requireAdmin = true
                                        found = true
                                    }
                                    if (type[0].substring(0,5) == "send:") {
                                        var channel = message.guild.channels.find(c => c.name == type[0].substring(5))
                                        var custommsg = respond.substring(s+1,e).split('"')
                                        channel.send(custommsg[1])
                                        found = true
                                    }
                                    if (found == false) {
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

        if (command == bot_prefix + 'ee') {
            if (easter_egg[message.author.id] !== undefined) {
                var number = easter_egg[message.author.id]
                message.channel.send(`You have found: **${number.match(/1/g).length} easter egg(s)**`)
            } else {
                message.channel.send("You haven't found any!")
            }
        }

        if (ee[msg] !== undefined) {
            var number = ee_number
            if (easter_egg[message.author.id] == undefined) {
                easter_egg[message.author.id] = number
            }
            if (easter_egg[message.author.id].length < number.length) {
                easter_egg[message.author.id] = easter_egg[message.author.id].substring(0, easter_egg[message.author.id].length) + number.substring(easter_egg[message.author.id].length)
            }
            if (easter_egg[message.author.id].substring(ee[msg].bit, ee[msg].bit + 1) == '0') {
                easter_egg[message.author.id] = easter_egg[message.author.id].substring(0, ee[msg].bit) + "1" + easter_egg[message.author.id].substring(ee[msg].bit + 1)
                fs.writeFileSync('ee.txt', JSON.stringify(easter_egg))
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
                var user_to_find = msg.substring(start)
                var user = find_discord_user(user_to_find)
                if (user == null || user.id == message.author.id) {
                    text = aloneaction
                } else {
                    text = `<@${user.id}>, ${action} <@${message.author.id}>`
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

         if (command == bot_prefix + 'hug') {
            tenor(5, 'anime hug', 'you got a hug from', 'Sorry to see you alone...')
        }
        if (command == bot_prefix + 'cuddle') {
            tenor(8, 'anime cuddle', 'you got a cuddle from', 'Sorry to see you alone...')
        }
        if (command == bot_prefix + 'slap') {
            tenor(6, 'anime slap', 'you got a slap from', 'Are you trying to slap yourself?')
        }
        if (command == bot_prefix + 'kiss') {
            tenor(6, 'anime kiss', 'you got a kiss from', 'Are you trying to kiss yourself?')
        }
        if (command == bot_prefix + 'pat') {
            tenor(5, 'anime pat', 'you got a pat from', 'Pat pat')
        }
        if (command == bot_prefix + 'poke') {
            tenor(6, 'anime poke', 'you got a poke from', 'Poking yourself huh? Heh')
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

        var url_command = false
        
        function check_player(name, type) {
            var osuname = ''
            if (name == '') {
                if (user_data[message.author.id] !== undefined) {
                    if (type == 'osu') {
                        osuname = user_data[message.author.id].osuname
                    } else if (type == 'akatsuki.pw') {
                        osuname = user_data[message.author.id].akatsukiname
                    } else if (type == 'ripple.moe') {
                        osuname = user_data[message.author.id].ripplename
                    }
                    return osuname
                } else {
                    return name
                }
            } else {
                var id = ''
                if (name.includes('@') == true) {
                    var id = message.mentions.users.first().id
                    if (user_data[id] !== undefined) {
                        if (type == 'osu') {
                            osuname = user_data[id].osuname
                        } else if (type == 'akatsuki.pw') {
                            osuname = user_data[id].akatsukiname
                        } else if (type == 'ripple.moe') {
                            osuname = user_data[id].ripplename
                        }
                        return osuname
                    } else {
                        return name
                    }
                } else {
                    return name
                }
        
            }
        }

        function cache_beatmap_ID(beatmapid, mode) {
            if (message.guild !== null) {
                stored_map_ID.push({id:beatmapid,server:message.guild.id, mode: mode})
            } else {
                stored_map_ID.push({id:beatmapid,user:message.author.id, mode: mode})
            }
        }

        /*
        osu!Standard: 0
        osu!Taiko: 1
        osu!CTB: 2
        osu!Mania: 3
        Ripple: 4
        Akatsuki: 8
        Relax Akatsuki: 12
        */

        function get_mode_detail(mode) {
            const modelist = [{name: "Standard", icon: '<:osu:582883671501963264>'},
                            {name: "Taiko", icon: '<:taiko:582883837554458626>'},
                            {name: "CTB", icon: '<:ctb:582883855627845703>'},
                            {name: "Mania", icon: '<:mania:582883872568639490>'},
                            {name: "Ripple", icon: ''},,,,
                            {name: "Akatsuki", icon: '<:akatsukiosu:583310654648352796>'},,,,
                            {name: "Relax Akatsuki", icon: '<:rxakatsuki:583314118933610497>'}]
            return {modename: modelist[mode].name, modeicon: modelist[mode].icon}
        }

        async function get_osu_profile(name, mode, event) {
            var user = await osuApi.getUser({u: name, m: mode, event_days: event})
            var web = await request.get(`https://osu.ppy.sh/users/${user.id}`)
            var user_web = await cheerio.load(web)
            user_web = user_web("#json-user").html()
            user_web = user_web.substring(0, user_web.indexOf(',"page"')) + user_web.substring(user_web.indexOf(',"page"')).replace(/<\/?[^>]+>|&quot;/gi, "");
            user_web = user_web.substring(0, user_web.indexOf(',"page"')) + user_web.substring(user_web.indexOf(',"page"')).replace(/\/\//gi, "/")
            user_web = JSON.parse(user_web)
            var playstyle = ""
            if (user_web["playstyle"] == null) {
                playstyle = "None?"
            } else {
                for (var i in user_web["playstyle"]) {
                    playstyle += user_web["playstyle"][i].charAt(0).toUpperCase() + user_web["playstyle"][i].substring(1)
                    user_web["playstyle"].length - 1 > i ? playstyle += ', ' : ''
                }
            }
            return {
                username: user.name,
                id: Number(user.id),
                count300: Number(user.counts['300']),
                count100: Number(user.counts['100']),
                count50: Number(user.counts['50']),
                ss: Number(user.counts.SS) + Number(user.counts.SSH),
                s: Number(user.counts.S) + Number(user.counts.SH),
                a: Number(user.counts.A),
                playcount: Number(user.counts.plays),
                rankedscore: Number(user.scores.ranked),
                totalscore: Number(user.scores.total),
                pp: Number(user.pp.raw).toFixed(2),
                rank: Number(user.pp.rank),
                countryrank: Number(user.pp.countryRank),
                country: user.country.toLowerCase(),
                level: Number(user.level),
                acc: Number(user.accuracy).toFixed(2),
                events: user.events,
                supporter: user_web["is_supporter"] == true ? '<:supporter:582885341413769218>' : '',
                statusicon: user_web["is_online"] == true ? 'https://cdn.discordapp.com/emojis/589092415818694672.png' : 'https://cdn.discordapp.com/emojis/589092383308775434.png?v=1',
                statustext: user_web["is_online"] == true ? 'Online' : 'Offline',
                playstyle: playstyle,
                bannerurl: user_web["cover_url"]
            }  
        }

        async function get_osu_top(name, mode, limit, type) {
            var top = []
            var best = type == 'best' ? await osuApi.getUserBest({u: name, m: mode, limit: limit}) : await osuApi.getUserRecent({u: name, m: mode})
            for (var i = 0; i < best.length; i++) {
                var count300 = Number(best[i][0].counts['300'])
                var count100 = Number(best[i][0].counts['100'])
                var count50 = Number(best[i][0].counts['50'])
                var countmiss = Number(best[i][0].counts.miss)
                var countgeki = Number(best[i][0].counts.geki)
                var countkatu = Number(best[i][0].counts.katu)
                var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100)
                var accdetail = `[${count300}/${count100}/${count50}/${countmiss}]`
                var star = 0
                if (mode == 1 || mode == 2 || mode == 3) {
                    fc = ''
                    star = Number(best[i][1].difficulty.rating).toFixed(2)
                }
                if (mode == 1) {
                    acc = Number((0.5 * count100 + count300) / (count300 + count100 + countmiss) * 100)
                    accdetail = `[${count300}/${count100}/${countmiss}]`
                }
                if (mode == 2) {
                    acc = Number((count50 + count100 + count300) / (countkatu + countmiss + count50 + count100 + count300) * 100)
                }
                if (mode == 3) {
                    acc = Number((50 * count50 + 100 * count100 + 200 * countkatu + 300 * (count300 + countgeki)) / (300 * (countmiss + count50 + count100 + countkatu + count300 + countgeki)) * 100)
                    accdetail = `[${countgeki}/${count300}/${countkatu}/${count100}/${count50}/${countmiss}]`
                }
                top[i] = {
                    //Score
                    score: Number(best[i][0].score),
                    userid: Number(best[i][0].user.id),
                    count300: count300,
                    count100: count100,
                    count50: count50,
                    countmiss: countmiss,
                    countgeki: countgeki,
                    countkatu: countkatu,
                    acc: acc,
                    accdetail: accdetail,
                    combo: Number(best[i][0].maxCombo),
                    perfect: best[i][0].perfect,
                    date: best[i][0].date,
                    letter: best[i][0].rank,
                    pp: type == 'best' ? Number(best[i][0].pp) : 0,
                    mod: best[i][0].mods,
                    //Beatmap
                    beatmapid: Number(best[i][1].id),
                    title: best[i][1].title,
                    creator: best[i][1].creator,
                    diff: best[i][1].version,
                    source: best[i][1].source,
                    artist: best[i][1].artist,
                    bpm: Number(best[i][1].bpm),
                    beatmapsetID: Number(best[i][1].beatmapSetId),
                    fc: (mode == 0 || mode == 2) ? Number(best[i][1].maxCombo) : '',
                    star: star,
                    timetotal: Number(best[i][1].time.total),
                    timedrain: Number(best[i][1].time.drain)
                }
            }
            return top
        }

        async function get_osu_beatmap(beatmapID, mode) {
            var beatmap = await osuApi.getBeatmaps({b: beatmapID, m: mode})
            return {
                beatmapid: Number(beatmap[0].id),
                title: beatmap[0].title,
                creator: beatmap[0].creator,
                diff: beatmap[0].version,
                bpm: Number(beatmap[0].bpm),
                approvalStatus: beatmap[0].approvalStatus,
                beatmapsetID: Number(beatmap[0].beatmapSetId),
                fc: Number(beatmap[0].maxCombo),
                star: Number(beatmap[0].difficulty.rating),
                timetotal: Number(beatmap[0].time.total),
                timedrain: Number(beatmap[0].time.drain)
            }
        }

        async function get_osu_scores(name, mode, beatmapID) {
            var top = []
            var scores = await osuApi.getScores({u: name, m: mode, b: beatmapID})
            for (var i = 0; i < scores.length; i++) {
                var count300 = Number(scores[i].counts['300'])
                var count100 = Number(scores[i].counts['100'])
                var count50 = Number(scores[i].counts['50'])
                var countmiss = Number(scores[i].counts.miss)
                var countgeki = Number(scores[i].counts.geki)
                var countkatu = Number(scores[i].counts.katu)
                var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100)
                var accdetail = `[${count300}/${count100}/${count50}/${countmiss}]`
                if (mode == 1) {
                    acc = Number((0.5 * count100 + count300) / (count300 + count100 + countmiss) * 100)
                    accdetail = `[${count300}/${count100}/${countmiss}]`
                }
                if (mode == 2) {
                    acc = Number((count50 + count100 + count300) / (countkatu + countmiss + count50 + count100 + count300) * 100)
                }
                if (mode == 3) {
                    acc = Number((50 * count50 + 100 * count100 + 200 * countkatu + 300 * (count300 + countgeki)) / (300 * (countmiss + count50 + count100 + countkatu + count300 + countgeki)) * 100)
                    accdetail = `[${countgeki}/${count300}/${countkatu}/${count100}/${count50}/${countmiss}]`
                }
                top[i] = {
                    score: Number(scores[i].score),
                    userid: Number(scores[i].user.id),
                    username: scores[i].user.name,
                    count300: count300,
                    count100: count100,
                    count50: count50,
                    countmiss: countmiss,
                    countgeki: countgeki,
                    countkatu: countkatu,
                    acc: acc,
                    accdetail: accdetail,
                    combo: Number(scores[i].maxCombo),
                    perfect: scores[i].perfect,
                    date: scores[i].date,
                    letter: scores[i].rank,
                    pp: Number(scores[i].pp),
                    mod: scores[i].mods
                }
            }
            return top
        }

        function score_overlay(top = 0, title, beatmapid, star, shortenmod, pp, nopp = '', rank, diff, score, combo, fc, acc, accdetail, fcguess, mapcompletion = '', date) {
            var showtop = ''
            if (top > 0) {
                showtop = `${top}. `
            }
            if (fcguess !== '') {
                fcguess = '⬥ ' + fcguess
            }
            return `
${showtop}**[${title}](https://osu.ppy.sh/b/${beatmapid})** (${star}★) ${shortenmod} ⬥ ${score}
${rank} *${diff}* ⬥ ***${pp.toFixed(2)}pp*** ${nopp} ${fcguess}
x${combo}/${fc} ⬥ **Acc:** ${acc.toFixed(2)}% ${accdetail} 
${mapcompletion} ${date}
`
        }
        
        async function osu(mode) {
            try {
                if (cooldown[message.author.id] !== undefined && cooldown[message.author.id].indexOf(command) !== -1) {
                    throw 'You need to wait 3 seconds before using this again!'
                }
                set_Command_cooldown(command, 3000)
                var check = ''
                var option = ''
                var quote = false
                // Split name and arg
                if (msg.includes('"')) {
                    quote = true
                    option = msg.split('"')
                    check = option[1]
                    option = msg.split(" ")
                } else {
                    option = msg.split(" ")
                }
                // Find name and arg
                var a_d = option.indexOf("-d")
                var a_rank = option.indexOf("-rank")
                var a_g = option.indexOf("-g")
                var a_ts = option.indexOf("-ts")
                //Check if there is more than 1 argument
                var findarg = [a_d, a_rank, a_g, a_ts]
                var find = false
                for (var i = 0; i < findarg.length; i++) {
                    if (findarg[i] > -1) {
                        if (find == false) {
                            find = true
                        } else {
                            throw 'Only one argument please!'
                        }
                    }
                }
                //Get name if there's no quote
                if (quote == false) {
                    var pass = [0, a_d, a_rank, a_g, a_ts]
                    for (var i = 0; i < pass.length;) {
                        if (pass[i] == -1) {
                            pass.splice(i,1)
                        } else {
                            i++
                        }
                    }
                    pass.sort(function(a,b){return a-b})
                    if (pass[1] > 1) {
                        check = option[1]
                    } else {
                        if (a_d > -1) {
                            check = option[option.indexOf("-d") + 1]
                        } else if (a_rank > -1) {
                            check = option[option.indexOf("-rank") + 1]
                        } else if (a_g > -1) {
                            check = option[option.indexOf("-g") + 1]
                        } else if (a_ts > -1) {
                            check = option[option.indexOf("-ts") + 1]
                        }else if (option.length > 1) {
                            check = option[1]
                        }
                        if (check == undefined) {
                            check = ''
                        }
                    }
                }
                var name = check_player(check, 'osu')
                var modedetail = get_mode_detail(mode, 'osu')
                var modename = modedetail.modename
                var modeicon = modedetail.modeicon
                if (a_d > -1) {
                    var user = await get_osu_profile(name, mode, 30)
                    var best = await get_osu_top(name, mode, 50, 'best')
                    var event = ``
                    // User
                    var totalrank = user.ss + user.s + user.a
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
                    var embed = new Discord.RichEmbed()
                    .setDescription(`${modeicon} ${user.supporter} **osu!${modename} Statistics for [${user.username}](https://osu.ppy.sh/users/${user.id})**`)
                    .setThumbnail(`http://s.ppy.sh/a/${user.id}.png?date=${refresh}`)
                    .setColor(embedcolor)
                    .addField(`Performance:`, `
**Global Rank:** #${user.rank} (:flag_${user.country}:: #${user.countryrank}) | ***${user.pp}pp***
**Level:** ${user.level}
**Accuracy:** ${user.acc}%
**Playcount:** ${user.playcount}
**Ranked Score:** ${user.rankedscore} | **Total Score:** ${user.totalscore}
**Play Style:** ${user.playstyle}
<:rankingX:520932410746077184> : ${user.ss} (${Number(user.ss/totalrank*100).toFixed(2)}%) <:rankingS:520932426449682432> : ${user.s} (${Number(user.s/totalrank*100).toFixed(2)}%) <:rankingA:520932311613571072> : ${user.a} (${Number(user.a/totalrank*100).toFixed(2)}%)`)
                    .addField(`${user.username} recent events:`, event)
                    .setFooter(user.statustext, user.statusicon)
                    var msg1 = await message.channel.send('Calculating skills...', {embed});
                    // Calculating skills
                    if (best.length < 50) {
                        throw "You don't have enough plays to calculate skill (Atleast 50 top plays)"
                    }
                    var star_avg = 0
                    var aim_avg = 0
                    var speed_avg = 0
                    var finger_control_avg = 0
                    var acc_avg = 0
                    var old_acc_avg = 0
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
                    for (var i = 0; i < 50; i++) {
                        var modandbit = osu_mods_enum(best[i].mod, 'text')
                        if (mode == 0) {
                            var parser = await precalc(best[i].beatmapid)
                            var thing = osu_pp_calculator(parser,modandbit.bitpresent,0,0,0,0,0,0)
                            var detail = beatmap_detail(modandbit.shortenmod, best[i].timetotal, best[i].timedrain,Number(best[i].bpm),thing.cs,thing.ar,thing.od,thing.hp)
                            star_avg += thing.star.total
                            aim_avg += thing.star.aim * (Math.pow(detail.cs, 0.1) / Math.pow(4, 0.1))
                            speed_avg += thing.star.speed * (Math.pow(detail.bpm, 0.3) / Math.pow(180, 0.3)) * (Math.pow(detail.ar, 0.1) / Math.pow(6, 0.1))
                            old_acc_avg += (Math.pow(thing.star.aim, (Math.pow(best[i].acc, 2.5)/Math.pow(100, 2.5)) * 1.05) + Math.pow(thing.star.speed, (Math.pow(best[i].acc, 2.5)/ Math.pow(100, 2.5)) * 1.1) + (thing.star.nsingles / 2000)) * (Math.pow(detail.od, 0.02) / Math.pow(6, 0.02)) * (Math.pow(detail.hp, 0.02) / (Math.pow(6, 0.02)))
                            acc_avg += (Math.pow(thing.star.aim, (Math.pow(best[i].acc, 2.5)/Math.pow(100, 2.5)) * (0.093 * Math.log10(thing.star.nsingles*900000000))) + Math.pow(thing.star.speed, (Math.pow(best[i].acc, 2.5)/ Math.pow(100, 2.5)) * (0.1 * Math.log10(thing.star.nsingles*900000000)))) * (Math.pow(detail.od, 0.02) / Math.pow(6, 0.02)) * (Math.pow(detail.hp, 0.02) / (Math.pow(6, 0.02)))
                            bpm_avg += detail.bpm
                            cs_avg += detail.cs
                            ar_avg += detail.ar
                            od_avg += detail.od
                            hp_avg += detail.hp
                            timetotal_avg += detail.timetotal
                            timedrain_avg += detail.timedrain
                        }
                        if (mode == 1) {
                            var mapinfo = await other_modes_precalc(best[i].beatmapid, 1, modandbit.bitpresent)
                            var detail = beatmap_detail(modandbit.shortenmod, best[i].timetotal, best[i].timedrain, Number(best[i].bpm), 0, 0, mapinfo.od, mapinfo.hp)
                            star_avg += mapinfo.star
                            speed_avg += Math.pow(mapinfo.star/1.1, Math.log(detail.bpm)/Math.log(mapinfo.star*20))
                            acc_avg += Math.pow(mapinfo.star, (Math.pow(best[i].acc, 3)/Math.pow(100, 3)) * 1.035) * (Math.pow(detail.od, 0.02) / Math.pow(6, 0.02)) * (Math.pow(detail.hp, 0.02) / (Math.pow(5, 0.02)))
                            bpm_avg += detail.bpm
                            od_avg += detail.od
                            hp_avg += detail.hp
                            timetotal_avg += detail.timetotal
                            timedrain_avg += detail.timedrain
                        }
                        if (mode == 2) {
                            var mapinfo = await other_modes_precalc(best[i].beatmapid, 2, modandbit.bitpresent)
                            var detail = beatmap_detail(modandbit.shortenmod, best[i].timetotal, best[i].timedrain, Number(best[i].bpm), mapinfo.cs, mapinfo.ar, mapinfo.od, mapinfo.hp)
                            star_avg += mapinfo.star
                            aim_avg += Math.pow(mapinfo.star, Math.log(detail.bpm)/Math.log(mapinfo.star*20)) * (Math.pow(mapinfo.cs, 0.1) / Math.pow(4, 0.1))
                            acc_avg += Math.pow(mapinfo.star, (Math.pow(best[i].acc, 3.5)/Math.pow(100, 3.5)) * 1.025) * (Math.pow(detail.od, 0.02) / Math.pow(6, 0.02)) * (Math.pow(detail.hp, 0.02) / (Math.pow(5, 0.02)))
                            bpm_avg += detail.bpm
                            cs_avg += detail.cs
                            ar_avg += detail.ar
                            od_avg += detail.od
                            hp_avg += detail.hp
                            timetotal_avg += detail.timetotal
                            timedrain_avg += detail.timedrain
                        }
                        if (mode == 3) {
                            var mapinfo = await other_modes_precalc(best[i].beatmapid, 3, modandbit.bitpresent)
                            var detail = beatmap_detail(modandbit.shortenmod, best[i].timetotal, best[i].timedrain, Number(best[i].bpm), 0,0,0,0)
                            star_avg += mapinfo.star
                            speed_avg += Math.pow(mapinfo.star/1.1, Math.log(detail.bpm)/Math.log(mapinfo.star*20))
                            acc_avg += Math.pow(mapinfo.star, (Math.pow(best[i].acc, 3)/Math.pow(100, 3)) * 1.035) * (Math.pow(mapinfo.od, 0.02) / Math.pow(6, 0.02)) * (Math.pow(mapinfo.hp, 0.02) / (Math.pow(5, 0.02)))
                            finger_control_avg += Math.pow(mapinfo.star, 1.1 * Math.pow(detail.bpm/250, 0.4) * (Math.log(mapinfo.circle + mapinfo.slider)/Math.log(mapinfo.star*900)) * (Math.pow(mapinfo.od, 0.4) / Math.pow(8, 0.4)) * (Math.pow(mapinfo.hp, 0.2) / Math.pow(7.5, 0.2)) * Math.pow(mapinfo.cs/4, 0.1))
                            bpm_avg += detail.bpm
                            od_avg += mapinfo.od
                            hp_avg += mapinfo.hp
                            timetotal_avg += detail.timetotal
                            timedrain_avg += detail.timedrain
                        }
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
                    if (mode == 0) {
                        embed.addField(`${user.username} average skill:`, `
Star: ${Number(star_avg/50).toFixed(2)}★
Aim skill: ${Number(aim_avg/50).toFixed(2)*2}★
Speed skill: ${Number(speed_avg/50).toFixed(2)*2}★
Accuracy skill: ${Number(acc_avg/50).toFixed(2)}★ (Old formula: ${Number(old_acc_avg/50).toFixed(2)}★)
Length: (Total: ${Math.floor(timetotal_avg / 60)}:${('0' + (timetotal_avg - Math.floor(timetotal_avg / 60) * 60)).slice(-2)}, Drain: ${Math.floor(timedrain_avg / 60)}:${('0' + (timedrain_avg - Math.floor(timedrain_avg / 60) * 60)).slice(-2)})
BPM: ${Number(bpm_avg/50).toFixed(0)} / CS: ${Number(cs_avg/50).toFixed(2)} / AR: ${Number(ar_avg/50).toFixed(2)} / OD: ${Number(od_avg/50).toFixed(2)} / HP: ${Number(hp_avg/50).toFixed(2)}
Most common mods: ${sortedmod}`)
                    }
                    if (mode == 1) {
                        embed.addField(`${user.username} average skill:`, `
Star: ${Number(star_avg/50).toFixed(2)}★
Speed skill: ${Number(speed_avg/50).toFixed(2)}★
Accuracy skill: ${Number(acc_avg/50).toFixed(2)}★
Length: (Total: ${Math.floor(timetotal_avg / 60)}:${('0' + (timetotal_avg - Math.floor(timetotal_avg / 60) * 60)).slice(-2)}, Drain: ${Math.floor(timedrain_avg / 60)}:${('0' + (timedrain_avg - Math.floor(timedrain_avg / 60) * 60)).slice(-2)})
BPM: ${Number(bpm_avg/50).toFixed(0)} / OD: ${Number(od_avg/50).toFixed(2)} / HP: ${Number(hp_avg/50).toFixed(2)}
Most common mods: ${sortedmod}`)
                    }
                    if (mode == 2) {
                        embed.addField(`${user.username} average skill:`, `
Star: ${Number(star_avg/50).toFixed(2)}★
Aim skill: ${Number(aim_avg/50).toFixed(2)}★
Accuracy skill: ${Number(acc_avg/50).toFixed(2)}★
Length: (Total: ${Math.floor(timetotal_avg / 60)}:${('0' + (timetotal_avg - Math.floor(timetotal_avg / 60) * 60)).slice(-2)}, Drain: ${Math.floor(timedrain_avg / 60)}:${('0' + (timedrain_avg - Math.floor(timedrain_avg / 60) * 60)).slice(-2)})
BPM: ${Number(bpm_avg/50).toFixed(0)} / CS: ${Number(cs_avg/50).toFixed(2)} / AR: ${Number(ar_avg/50).toFixed(2)} / OD: ${Number(od_avg/50).toFixed(2)} / HP: ${Number(hp_avg/50).toFixed(2)}
Most common mods: ${sortedmod}`)
                    }
                    if (mode == 3) {
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
                    if (mode == 0) {
                        for (var [key,value] of Object.entries(user_data)) {
                            if (value.osuname == user.username) {
                                user_data[key].osurank = user.rank
                                user_data[key].osucountry = user.country
                                fs.writeFileSync('data.txt', JSON.stringify(user_data))
                                bot.channels.get('487482583362568212').send({files: [{
                                    attachment: './data.txt',
                                    name: 'data.txt'
                                }]})
                                break
                            }
                        }
                    }
                } else if (a_rank > -1 && mode == 0) {
                    var rank = Number(option[option.indexOf('-rank') + 1])
                    var page = 1 + Math.floor((rank - 1) / 50)
                    var web_leaderboard = await request(`https://osu.ppy.sh/rankings/osu/performance?page=${page}#scores`)
                    var leaderboard = await cheerio.load(web_leaderboard)
                    var table = leaderboard('table[class="ranking-page-table"]').children('tbody').children()
                    var player = leaderboard(table[49 - ((page*50) - rank)]).children('td').children('div[class=ranking-page-table__user-link]').children().text().replace(/\s+/g," ").substring(1)
                    var user = await get_osu_profile(player,0 ,0)
                    if (user.username == undefined) {
                        throw 'User not found!'
                    }
                    const embed = new Discord.RichEmbed()
                    .setDescription(`
${modeicon} ${user.supporter}   **Osu!${modename} status for: [${user.username}](https://osu.ppy.sh/users/${user.id})**`)
                    .addField('Performance:',`--- **${user.pp}pp**
**Global Rank:** #${user.rank} (:flag_${user.country}:: #${user.countryrank})
**Accuracy:** ${user.acc}%
**Play count:** ${user.playcount}
**Level:** ${user.level}
**Play Style:**
${user.playstyle}`, true)
                    .addField('Rank:', `<:rankingX:520932410746077184>: ${user.ss}

<:rankingS:520932426449682432>: ${user.s}

<:rankingA:520932311613571072>: ${user.a}`, true)
                    .setThumbnail(`http://s.ppy.sh/a/${user.id}.png?date=${refresh}`)
                    .setColor(embedcolor)
                    .setFooter(user.statustext, user.statusicon)
                    message.channel.send({embed});
                    if (mode == 0) {
                        for (var [key,value] of Object.entries(user_data)) {
                            if (value.osuname == user.username) {
                                user_data[key].osurank = user.rank
                                user_data[key].osucountry = user.country
                                fs.writeFileSync('data.txt', JSON.stringify(user_data))
                                bot.channels.get('487482583362568212').send({files: [{
                                    attachment: './data.txt',
                                    name: 'data.txt'
                                }]})
                                break
                            }
                        }
                    }
                } else if (a_g > -1) {
                    var user = await get_osu_profile(name, mode)
                    var web = await request.get(`https://osu.ppy.sh/users/${user.id}/osu`)
                    var user_history = await cheerio.load(web)
                    user_history = user_history("#json-rankHistory").html()
                    user_history = JSON.parse(user_history)
                    var rankHistory = user_history["data"]
                    //Graph
                    const options = {
                        width: 600,
                        height: 200,
                        axisX: {title: ''},
                        axisY: {title: '', labelOffset: {x: 0, y: 10}, onlyInteger: true,labelInterpolationFnc: function(value) {
                            return -value;
                        }},
                        showLine: true,
                        fullWidth: true,
                        chartPadding: {left: 60},
                    };
                  
                    for (var i = 0 in rankHistory) {
                        rankHistory[i] = rankHistory[i] * -1
                    }

                    var line = await generate('line', options, {
                        labels: [],
                        series: [
                            {value: rankHistory},
                        ]
                    })
                  
                    // CSS Layout
                  
                    // Load graph
            
                    var graph = cheerio.load(line)
                  
                    // Get line
                  
                    var graphline = graph('path')
                    for (var i = 0; i < graphline.length; i++) {
                        graph(graphline[i]).attr('style', 'stroke: rgb(255,0,255); stroke-width: 3; fill: none')
                    }
                  
                    // Get grid (h/v)
                  
                    var gridline = graph('line[class="ct-grid ct-horizontal"]')
                    for (var i = 0; i < gridline.length; i+=Math.round(gridline.length / 6)) {
                        graph(gridline[i]).attr('style', 'stroke: white; stroke-width: 2')
                    }
                    graph(gridline[gridline.length-1]).attr('style', 'stroke: white; stroke-width: 2')
                    gridline = graph('line[class="ct-grid ct-vertical"]')
                    for (var i = 0; i < gridline.length; i++) {
                        graph(gridline[i]).attr('style', 'stroke: white; stroke-width: 2')
                    }
                  
                    // Get Text
                  
                    var text = graph('text')
                    for (var i = 0; i < text.length; i++) {
                        graph(text[i]).attr('style', 'font-family: Arial; font-size: 18px; font-weight: 900; fill: white;')
                    }
                    text = graph('text[class="ct-label ct-vertical ct-start"]')
                    for (var i = 0; i < text.length; i++) {
                        graph(text[i]).attr('style', 'font-family: Arial; font-size: 18px; font-weight: 900; fill: white; text-anchor: end')
                    }
                    var linegraph = graph('div[class="ct-chart"]').html()
                    linegraph = linegraph.substring(0, linegraph.indexOf('<div class="ct-legend">'))
                  
                    // Format SVG to PNG
                    var svg = new Buffer(linegraph)
                    await sharp(svg).png().toFile('image.png')
                    var image = await jimp.read('./image.png')                   
                    var banner = await jimp.read(user.bannerurl)
                    var bannerwidth = banner.getWidth()
                    var bannerHeight = banner.getHeight()
                    if (bannerwidth / 600 >= bannerHeight / 200) {
                        banner.resize(jimp.AUTO, 200)
                    } else {
                        banner.resize(600, jimp.AUTO)
                    }         
                    banner.crop(0, 0, 600, 200)
                    banner.brightness(-0.5)
                    banner.blur(5)
                    image.brightness(0.25)
                    banner.composite(image, 0, 0)
                    await banner.write('./rankhistory.png')

                    const attachment = new Discord.Attachment('./rankhistory.png', 'rank.png')
                    const embed = new Discord.RichEmbed()
                    .setDescription(`${modeicon} ${user.supporter} **osu!Standard rank history for [${user.username}](https://osu.ppy.sh/users/${user.id})**`)
                    .addField('Current rank', `Global: ${user.rank} (:flag_${user.country}:: ${user.countryrank})`, true)
                    .addField('Current PP', user.pp, true)
                    .attachFile(attachment)
                    .setImage('attachment://rank.png')
                    message.channel.send({embed})
                    if (mode == 0) {
                        for (var [key,value] of Object.entries(user_data)) {
                            if (value.osuname == user.username) {
                                user_data[key].osurank = user.rank
                                user_data[key].osucountry = user.country
                                fs.writeFileSync('data.txt', JSON.stringify(user_data))
                                bot.channels.get('487482583362568212').send({files: [{
                                    attachment: './data.txt',
                                    name: 'data.txt'
                                }]})
                                break
                            }
                        }
                    }
                } else if (a_ts > -1 && mode == 0) {
                    var user = await get_osu_profile(name, mode, 30)
                    var best = await get_osu_top(name, mode, 50, 'best')
                    if (best.length < 50) {
                        throw "You don't have enough plays to calculate skill (Atleast 50 top plays)"
                    }
                    var msg1 = await message.channel.send('Calculating skills...') 
                    var star_avg = 0
                    var aim_avg = 0
                    var speed_avg = 0
                    var finger_control_avg = 0
                    var acc_avg = 0
                    var old_acc_avg = 0
                    var top_star = []
                    var top_aim = []
                    var top_speed = []
                    var top_old_acc = []
                    var top_acc = []
                    for (var i = 0; i < 50; i++) {
                        var modandbit = osu_mods_enum(best[i].mod, 'text')
                        if (mode == 0) {
                            var parser = await precalc(best[i].beatmapid)
                            var thing = osu_pp_calculator(parser,modandbit.bitpresent,0,0,0,0,0,0)
                            var detail = beatmap_detail(modandbit.shortenmod, best[i].timetotal, best[i].timedrain,Number(best[i].bpm),thing.cs,thing.ar,thing.od,thing.hp)
                            var star_skill = thing.star.total
                            var aim_skill = (thing.star.aim * (Math.pow(detail.cs, 0.1) / Math.pow(4, 0.1)))*2
                            var speed_skill = (thing.star.speed * (Math.pow(detail.bpm, 0.3) / Math.pow(180, 0.3)) * (Math.pow(detail.ar, 0.1) / Math.pow(6, 0.1)))*2
                            var old_acc_skill = (Math.pow(thing.star.aim, (Math.pow(best[i].acc, 2.5)/Math.pow(100, 2.5)) * 1.05) + Math.pow(thing.star.speed, (Math.pow(best[i].acc, 2.5)/ Math.pow(100, 2.5)) * 1.1) + (thing.star.nsingles / 2000)) * (Math.pow(detail.od, 0.02) / Math.pow(6, 0.02)) * (Math.pow(detail.hp, 0.02) / (Math.pow(6, 0.02)))
                            var acc_skill = (Math.pow(thing.star.aim, (Math.pow(best[i].acc, 2.5)/Math.pow(100, 2.5)) * (0.093 * Math.log10(thing.star.nsingles*900000000))) + Math.pow(thing.star.speed, (Math.pow(best[i].acc, 2.5)/ Math.pow(100, 2.5)) * (0.1 * Math.log10(thing.star.nsingles*900000000)))) * (Math.pow(detail.od, 0.02) / Math.pow(6, 0.02)) * (Math.pow(detail.hp, 0.02) / (Math.pow(6, 0.02)))
                            star_avg += star_skill
                            aim_avg += aim_skill
                            speed_avg += speed_skill
                            old_acc_avg += old_acc_skill
                            acc_avg += acc_skill
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
                    var field = []
                    var text = ''
                    function textloading (top) {
                        var text = ''
                        for (var i in top) {
                            text += `${top[i].beatmap}: **${Number(top[i].skill).toFixed(2)}★**\n`
                        }
                        field.push(text)
                    }
                    textloading(top_star)
                    textloading(top_aim)
                    textloading(top_speed)
                    textloading(top_old_acc)
                    textloading(top_acc)
                    const embed = new Discord.RichEmbed()
                    .setDescription(`${modeicon} **Osu!${modename} top skill for: [${user.username}](https://osu.ppy.sh/users/${user.id})**`)
                    .setThumbnail(`http://s.ppy.sh/a/${user.id}.png?date=${refresh}`)
                    .addField(`${user.username} average skill:`, `
Star: ${Number(star_avg/50).toFixed(2)}★
Aim skill: ${Number(aim_avg/50).toFixed(2)}★
Speed skill: ${Number(speed_avg/50).toFixed(2)}★
Accuracy skill: ${Number(acc_avg/50).toFixed(2)}★ (Old formula: ${Number(old_acc_avg/50).toFixed(2)}★)`)
                    .addField('Top star skill:', field[0])
                    .addField('Top aim skill:', field[1])
                    .addField('Top speed skill:', field[2])
                    .addField('Top old acc skill:', field[3])
                    .addField('Top acc skill:', field[4])
                    msg1.edit({embed})
                    if (mode == 0) {
                        for (var [key,value] of Object.entries(user_data)) {
                            if (value.osuname == user.username) {
                                user_data[key].osurank = user.rank
                                user_data[key].osucountry = user.country
                                fs.writeFileSync('data.txt', JSON.stringify(user_data))
                                bot.channels.get('487482583362568212').send({files: [{
                                    attachment: './data.txt',
                                    name: 'data.txt'
                                }]})
                                break
                            }
                        }
                    }
                } else {
                    var user = await get_osu_profile(name, mode, 0)
                    var web = await request.get(`https://osu.ppy.sh/users/${user.id}`)
                    var user_web = await cheerio.load(web)
                    user_web = user_web("#json-user").html()
                    user_web = user_web.substring(0, user_web.indexOf(',"page"')) + user_web.substring(user_web.indexOf(',"page"')).replace(/<\/?[^>]+>|&quot;/gi, "");
                    user_web = user_web.substring(0, user_web.indexOf(',"page"')) + user_web.substring(user_web.indexOf(',"page"')).replace(/\/\//gi, "/")
                    user_web = JSON.parse(user_web)
                    var playstyle = ""
                    if (user_web["playstyle"] == null) {
                        playstyle = "None?"
                    } else {
                        for (var i in user_web["playstyle"]) {
                            playstyle += user_web["playstyle"][i].charAt(0).toUpperCase() + user_web["playstyle"][i].substring(1)
                            user_web["playstyle"].length - 1 > i ? playstyle += ', ' : ''
                        }
                    }
                    var supporter = user_web["is_supporter"] == true ? '<:supporter:582885341413769218>' : ''
                    var statusicon = user_web["is_online"] == true ? 'https://cdn.discordapp.com/emojis/589092415818694672.png' : 'https://cdn.discordapp.com/emojis/589092383308775434.png?v=1'
                    var statustext = user_web["is_online"] == true ? 'Online' : 'Offline'
                    if (user.username == undefined) {
                        throw 'User not found!'
                    }
                    const embed = new Discord.RichEmbed()
                    .setDescription(`
${modeicon} ${supporter} **Osu!${modename} status for: [${user.username}](https://osu.ppy.sh/users/${user.id})**`)
                    .addField('Performance:',`--- **${user.pp}pp**
**Global Rank:** #${user.rank} (:flag_${user.country}:: #${user.countryrank})
**Accuracy:** ${user.acc}%
**Play count:** ${user.playcount}
**Level:** ${user.level}
**Play Style:**
${playstyle}`, true)
                    .addField('Rank:', `<:rankingX:520932410746077184>: ${user.ss}

<:rankingS:520932426449682432>: ${user.s}

<:rankingA:520932311613571072>: ${user.a}`, true)
                    .setThumbnail(`http://s.ppy.sh/a/${user.id}.png?date=${refresh}`)
                    .setColor(embedcolor)
                    .setFooter(statustext, statusicon)
                    message.channel.send({embed});
                    if (mode == 0) {
                        for (var [key,value] of Object.entries(user_data)) {
                            if (value.osuname == user.username) {
                                user_data[key].osurank = user.rank
                                user_data[key].osucountry = user.country
                                fs.writeFileSync('data.txt', JSON.stringify(user_data))
                                bot.channels.get('487482583362568212').send({files: [{
                                    attachment: './data.txt',
                                    name: 'data.txt'
                                }]})
                                break
                            }
                        }
                    }
                }
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        async function topleaderboard(type) {
            try {
                if (cooldown[message.author.id] !== undefined && cooldown[message.author.id].indexOf(command) !== -1) {
                    throw 'You need to wait 3 seconds before using this again!'
                }
                set_Command_cooldown(command, 3000)
                var option = msg.split(' ')
                var link = ''
                var mode = 'osu'
                var countryname = ''
                // Find country name and arg
                var a_osu = option.indexOf("-osu")
                var a_taiko = option.indexOf("-taiko")
                var a_ctb = option.indexOf("-ctb")
                var a_mania = option.indexOf("-mania")
                //Check if there is more than 1 argument
                var findarg = [a_osu, a_taiko, a_ctb, a_mania]
                var find = false
                for (var i = 0; i < findarg.length; i++) {
                    if (findarg[i] > -1) {
                        if (find == false) {
                            find = true
                        } else {
                            throw 'Only one argument please!'
                        }
                    }
                }
                //Get country name if the type is country
                if (type == 'country') {
                    var pass = [0, a_osu, a_taiko, a_ctb, a_mania]
                    for (var i = 0; i < pass.length;) {
                        if (pass[i] == -1) {
                            pass.splice(i,1)
                        } else {
                            i++
                        }
                    }
                    pass.sort(function(a,b){return a-b})
                    if (pass[1] > 1) {
                        countryname = option[1]
                    } else {
                        if (a_osu > -1) {
                            countryname = option[option.indexOf("-osu") + 1]
                        } else if (a_taiko > -1) {
                            countryname = option[option.indexOf("-taiko") + 1]
                        } else if (a_ctb > -1) {
                            countryname = option[option.indexOf("-ctb") + 1]
                        } else if (a_mania > -1) {
                            countryname = option[option.indexOf("-mania") + 1]
                        } else if (option.length > 1) {
                            countryname = option[1]
                        }
                        if (countryname == undefined) {
                            countryname = ''
                        }
                    }
                }
                if (a_taiko > -1) {
                    mode = 'taiko'
                } else if (a_ctb > -1) {
                    mode = 'fruits'
                } else if (a_mania > -1) {
                    mode = 'mania'
                }
                if (type == 'global') {
                    link = `https://osu.ppy.sh/rankings/${mode}/performance?page=1#scores`
                } else if (type == 'country') {
                    link = `https://osu.ppy.sh/rankings/${mode}/performance?country=${option[1].toUpperCase()}&page=1#scores`
                }
                var web = await request(link)
                var leaderboard = await cheerio.load(web)
                var table = leaderboard('table[class="ranking-page-table"]').children('tbody').children()
                var country = ''
                if (type == 'country') {
                    country = leaderboard('span[class="flag-country"]').attr('title')
                }
                // Page function
                var page = 1
                var pages = []
                function loadpage() {
                    var gathering = ''
                    for (var n = 0; n < 10; n++) {
                        var i = (page - 1) * 10 - 1 + (n+1)
                        if (i < table.length- 1) {
                            var player = leaderboard(table[i]).children('td').children('div[class=ranking-page-table__user-link]').children().text().replace(/\s+/g," ").substring(1)
                            var flag  = leaderboard(table[i]).children('td').children('div[class=ranking-page-table__user-link]').children().first().attr('href')
                            var pp = leaderboard(table[i]).children('td[class="ranking-page-table__column ranking-page-table__column--focused"]').text().replace(/\s+/g," ").substring(1)
                            var acc = leaderboard(table[i]).children('td[class="ranking-page-table__column ranking-page-table__column--dimmed"]').first().text().replace(/\s+/g," ").substring(1)
                            var topnumber = `**${i+1}:**`
                            var playertext = `**${player}**`
                            var flagicon = `:flag_${flag.substring(flag.length-2, flag.length).toLowerCase()}:`
                            var acctext = `Acc: ${acc}`
                            var pptext = `**PP: ${pp}**`
                            gathering += `${topnumber} ${flagicon} ${playertext} | ${acctext} | ${pptext}\n`
                        }
                    }
                    pages[page-1] = gathering
                }
                var title = ''
                function loadtitle() {
                    if (type == 'global') {
                        title = `Global leaderboard for osu!${mode} (Page ${page} of ${Math.ceil(table.length / 10)})`
                    } else if (type == 'country') {
                        title = `${country} country leaderboard for osu!${mode} (Page ${page} of ${Math.ceil(table.length / 10)})`
                    }
                }
                await loadpage()
                loadtitle()
                var embed = new Discord.RichEmbed()
                .setAuthor(title)
                .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Osu%21Logo_%282015%29.svg/220px-Osu%21Logo_%282015%29.svg.png')
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
                    loadtitle()
                    embed.setAuthor(title)
                    embed.setDescription(pages[page-1])
                    msg1.edit({embed})
                })
                next.on('collect', reaction => {
                    if (page >= Math.ceil(table.length / 10)) {return}
                    page += 1
                    msg1.edit('Loading page...')
                    if (pages[page-1] == undefined) {
                        loadpage()
                    }
                    loadtitle()
                    embed.setAuthor(title)
                    embed.setDescription(pages[page-1])
                    msg1.edit({embed})
                })
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        async function serverleaderboard() {
            try {
                if (cooldown[message.author.id] !== undefined && cooldown[message.author.id].indexOf(command) !== -1) {
                    throw 'You need to wait 3 seconds before using this again!'
                }
                set_Command_cooldown(command, 3000)
                var player = []
                var pages = []
                var page = 1
                var members = message.guild.members.array()
                for (var i = 0; i < members.length; i++) {
                    var user = members[i]
                    if (user_data[user.id]) {
                        if (user_data[user.id].osurank !== undefined) {
                            player.push({username: user.user.username, osuname: user_data[user.id].osuname, rank: user_data[user.id].osurank, country: user_data[user.id].osucountry})
                        }
                    }
                }
                player.sort(function(a,b){
                    return a.rank - b.rank
                })
                function loadpage() {
                    var gathering = ''
                    for (var n = 0; n < 10; n++) {
                        var top = (page - 1) * 10 - 1 + (n+1)
                        if (top < player.length) {
                            gathering += `${top+1}. :flag_${player[top].country}: **${player[top].osuname}** (${player[top].username}) | **Rank:** ${player[top].rank}\n`
                        }
                    }
                    pages[page-1] = gathering
                }
                var title = ''
                function loadtitle() {
                    title = `Server leaderboard for ${message.guild.name} (Page ${page} of ${Math.ceil(player.length / 10)})`
                }
                await loadpage()
                loadtitle()
                var embed = new Discord.RichEmbed()
                .setAuthor(title)
                .setThumbnail(message.guild.iconURL)
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
                    loadtitle()
                    embed.setAuthor(title)
                    embed.setDescription(pages[page-1])
                    msg1.edit({embed})
                })
                next.on('collect', reaction => {
                    if (page >= Math.ceil(player.length / 10)) {return}
                    page += 1
                    msg1.edit('Loading page...')
                    if (pages[page-1] == undefined) {
                        loadpage()
                    }
                    loadtitle()
                    embed.setAuthor(title)
                    embed.setDescription(pages[page-1])
                    msg1.edit({embed})
                })
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
            var name = checkplayer(check, 'osu')
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

        async function osuset(type) {
            try {
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
                var user = ''
                var name = ''
                var settype = ''
                var profilelink = ''
                var imagelink = ''
                if (type == 'Osu') {
                    user = await osuApi.getUser({u: check})
                    settype = 'osuname'
                    name = user.name
                    profilelink = `https://osu.ppy.sh/users/${user.id}`
                    imagelink = `http://s.ppy.sh/a/${user.id}.png?date=${refresh}`
                } else if (type == 'Akatsuki') {
                    user = await request(`http://akatsuki.pw/api/v1/users?name=${check}`)
                    user = JSON.parse(user)
                    settype = 'akatsukiname'
                    name = user.username
                    profilelink = `https://akatsuki.pw/u/${user.id}`
                    imagelink = `http://a.akatsuki.pw/${user.id}.png?date=${refresh}`
                } else if (type == 'Ripple') {
                    user = await request(`http://ripple.moe/api/v1/users?name=${check}`)
                    user = JSON.parse(user)
                    settype = 'ripplename'
                    name = user.username
                    profilelink = `https://ripple.moe/u/${user.id}`
                    imagelink = `http://a.ripple.moe/${user.id}.png?date=${refresh}`
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
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`Your account has been linked to ${type} username: ${name}`,'', profilelink)
                    .setColor(embedcolor)
                    .setImage(imagelink)
                    message.channel.send({embed})
                    fs.writeFileSync('data.txt', JSON.stringify(user_data))
                    bot.channels.get('487482583362568212').send({files: [{
                        attachment: './data.txt',
                        name: 'data.txt'
                    }]})
                }
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        async function recent() {
            try {
                if (cooldown[message.author.id] !== undefined && cooldown[message.author.id].indexOf(command) !== -1) {
                    throw 'You need to wait 3 seconds before using this again!'
                }
                set_Command_cooldown(command, 3000)
                var check = ''
                var option = ''
                var quote = false
                // Split name and arg
                if (msg.includes('"')) {
                    quote = true
                    option = msg.split('"')
                    check = option[1]
                    option = msg.split(" ")
                } else {
                    option = msg.split(" ")
                }
                // Find name and arg
                var a_b = option.indexOf("-b")
                var a_osu = option.indexOf("-standard")
                var a_taiko = option.indexOf("-taiko")
                var a_ctb = option.indexOf("-ctb")
                var a_mania = option.indexOf("-mania")
                //Get name if there's no quote
                if (quote == false) {
                    var pass = [0, a_b, a_osu, a_taiko, a_ctb, a_mania]
                    for (var i = 0; i < pass.length;) {
                        if (pass[i] == -1) {
                            pass.splice(i,1)
                        } else {
                            i++
                        }
                    }
                    pass.sort(function(a,b){return a-b})
                    if (pass[1] > 1) {
                        check = option[1]
                    } else {
                        if (a_b > -1) {
                            check = option[option.indexOf("-b") + 1]
                        } else if (a_osu > -1) {
                            check = option[option.indexOf("-standard") + 1]
                        } else if (a_taiko > -1) {
                            check = option[option.indexOf("-taiko") + 1]
                        } else if (a_ctb > -1) {
                            check = option[option.indexOf("-ctb") + 1]
                        } else if (a_mania > -1) {
                            check = option[option.indexOf("-mania") + 1]
                        } else if (option.length > 1) {
                            check = option[1]
                        }
                        if (check == undefined) {
                            check = ''
                        }
                    }
                }
                var mode = a_taiko > -1 ? 1 : a_ctb > -1 ? 2 : a_mania > -1 ? 3 : 0
                var name = check_player(check, 'osu')
                var modename = get_mode_detail(mode).modename
                if (a_b > -1) {
                    var best = await get_osu_top(name, 0, 100, 'best')
                    if (best.length == 0) {
                        throw `I think ${name} didn't play anything yet~ **-Chino**`
                    }
                    var userid = best[0].userid
                    var user = await osuApi.getUser({u: userid})
                    var username = user.name
                    for (var i = 0; i < 100; i++) {
                        best[i].top = i+1
                    }
                    best.sort(function (a,b) {
                        a1 = Date.parse(a.date)
                        b1 = Date.parse(b.date)
                        return b1 - a1
                    })
                    var rank = osu_ranking_letters(best[0].letter)
                    var modandbit = osu_mods_enum(best[0].mod, 'text')
                    var shortenmod = modandbit.shortenmod
                    var bitpresent = modandbit.bitpresent
                    var date = time_played(best[0].date)
                    cache_beatmap_ID(best[0].beatmapid, modename)
                    var parser = await precalc(best[0].beatmapid)     
                    var fccalc = osu_pp_calculator(parser,bitpresent,best[0].fc,best[0].count100,best[0].count50,0,best[0].acc,'fc')
                    var fcpp = Number(fccalc.pp.total).toFixed(2)
                    var fcacc = fccalc.acc
                    var star = Number(fccalc.star.total).toFixed(2)
                    var fcguess = ''
                    if (best[0].perfect == 0) {
                        fcguess = `**${fcpp}pp for ${fcacc}%**`
                    }
                    var scoreoverlay = score_overlay(undefined,best[0].title,best[0].beatmapid,star,shortenmod,best[0].pp,undefined,rank,best[0].diff,best[0].score,best[0].combo,best[0].fc,best[0].acc,best[0].accdetail,fcguess,undefined,date)
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`Top ${best[0].top} osu!Standard play for ${username}:`, `http://s.ppy.sh/a/${userid}.png?date=${refresh}`)
                    .setThumbnail(`https://b.ppy.sh/thumb/${best[0].beatmapsetID}l.jpg`)
                    .setColor(embedcolor)
                    .setDescription(scoreoverlay)
                    message.channel.send({embed})
                } else {
                    var recent = await get_osu_top(name, mode, 0, 'recent')
                    if (recent.length == 0) {
                        throw 'No play found within 24 hours of this user **-Tiny**'
                    }
                    var getplayer = await osuApi.getUser({u: name})
                    var rank = osu_ranking_letters(recent[0].letter)
                    var modandbit = osu_mods_enum(recent[0].mod, 'text')
                    var shortenmod = modandbit.shortenmod
                    var bitpresent = modandbit.bitpresent
                    var date = time_played(recent[0].date)
                    var star = ''
                    var pp = ''
                    var nopp = ''
                    var mapcompleted = ''
                    var mapcomplete = ''
                    var fcpp = ''
                    var fcacc = ''
                    if (mode == 0) {
                        var parser = await precalc(recent[0].beatmapid)
                        var recentcalc = osu_pp_calculator(parser,bitpresent,recent[0].combo,recent[0].count100,recent[0].count50,recent[0].countmiss,recent[0].acc,'acc')
                        star = Number(recentcalc.star.total).toFixed(2)
                        pp = Number(recentcalc.pp.total)
                        var end = recentcalc.star.objects[recentcalc.star.objects.length - 1].obj.time - recentcalc.star.objects[0].obj.time
                        var point = recentcalc.star.objects[recent[0].count300 + recent[0].count100 + recent[0].count50 + recent[0].countmiss - 1].obj.time - recentcalc.star.objects[0].obj.time
                        mapcomplete = Number((point / end) * 100).toFixed(2)
                        var fccalc = osu_pp_calculator(parser,bitpresent,recent[0].fc,recent[0].count100,recent[0].count50,0,recent[0].acc,'fc')
                        fcpp = Number(fccalc.pp.total).toFixed(2)
                        fcacc = fccalc.acc
                    }
                    if (mode == 1) {
                        var mapinfo = await other_modes_precalc(recent[0].beatmapid, 1, bitpresent)
                        star = Number(mapinfo.star).toFixed(2)
                        pp = taiko_pp_calculator(mapinfo.star, mapinfo.od, mapinfo.fc, recent[0].acc, recent[0].countmiss, bitpresent)
                        var count300 = mapinfo.fc - recent[0].count100
                        fcacc = Number((0.5 * recent[0].count100 + count300) / (count300 + recent[0].count100 + 0) * 100).toFixed(2)
                        fcpp = taiko_pp_calculator(mapinfo.star, mapinfo.od, mapinfo.fc, fcacc, 0, bitpresent).toFixed(2)
                        mapcomplete = ((recent[0].count300 + recent[0].count100 + recent[0].countmiss) / mapinfo.circle + mapinfo.slider)* 100
                    }
                    if (mode == 2) {
                        var mapinfo = await other_modes_precalc(recent[0].beatmapid, 2, bitpresent)
                        star = Number(mapinfo.star).toFixed(2)
                        pp = ctb_pp_calculator(mapinfo.star, mapinfo.ar, mapinfo.fc, recent[0].combo, recent[0].acc, recent[0].countmiss, bitpresent)
                        var count300 = mapinfo.fc - recent[0].count100 - recent[0].countkatu - recent[0].count50
                        fcacc = Number((recent[0].count50 + recent[0].count100 + count300) / (recent[0].countkatu + 0 + recent[0].count50 + recent[0].count100 + count300) * 100).toFixed(2)
                        fcpp = ctb_pp_calculator(mapinfo.star, mapinfo.ar, mapinfo.fc, mapinfo.fc, fcacc, 0, bitpresent).toFixed(2)
                        mapcomplete = ((recent[0].count300 + recent[0].countkatu + recent[0].count100 + recent[0].count50 + recent[0].countmiss) / (mapinfo.circle + mapinfo.slider))* 100
                    }
                    if (mode == 3) {
                        var mapinfo = await other_modes_precalc(recent[0].beatmapid, 3, bitpresent)
                        star = Number(mapinfo.star).toFixed(2)
                        pp = mania_pp_calculator(mapinfo.star, mapinfo.od, recent[0].score, mapinfo.fc, bitpresent)
                        fcacc = Number(21.7147240951625 * Math.log(recent[0].score/10000)*10000).toFixed(0)
                        fcpp = mania_pp_calculator(mapinfo.star, mapinfo.od, fcacc, mapinfo.fc, bitpresent).toFixed(2)
                        mapcomplete = ((recent[0].count300 + recent[0].countkatu + recent[0].count100 + recent[0].countgeki + recent[0].count50 + recent[0].countmiss) / (mapinfo.circle + mapinfo.slider))* 100
                    }
                    var osuname = getplayer.name
                    cache_beatmap_ID(recent[0].beatmapid, modename)
                    var fcguess = ``
                    if (recent[0].letter == 'F') {
                        nopp = '(No pp)'
                        date = '⬥ ' + date
                        mapcompleted = `**Map Completion:** ${Number(mapcomplete).toFixed(2)}%`
                    }
                    if (recent[0].perfect == 0) {
                        if (mode == 0 || mode == 1 || mode == 2) {
                            fcguess = `**${fcpp}pp for ${fcacc}%**`
                        }
                        if (mode == 3) {
                            fcguess = `**${fcpp}pp for ${fcacc} scores**`
                        }
                    }
                    var scoreoverlay = score_overlay(undefined,recent[0].title,recent[0].beatmapid,star,shortenmod,pp,nopp,rank,recent[0].diff,recent[0].score,recent[0].combo,recent[0].fc,recent[0].acc,recent[0].accdetail,fcguess,mapcompleted,date)
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`Most recent osu! ${modename} play for ${osuname}:`, `http://s.ppy.sh/a/${recent[0].userid}.png?date=${refresh}`)
                    .setThumbnail(`https://b.ppy.sh/thumb/${recent[0].beatmapsetID}l.jpg`)
                    .setColor(embedcolor)
                    .setDescription(scoreoverlay)
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
                set_Command_cooldown(command, 3000)
                var check = ''
                var option = ''
                var modename = ''
                var quote = false
                // Split name and arg
                if (msg.includes('"')) {
                    quote = true
                    option = msg.split('"')
                    check = option[1]
                    option = msg.split(" ")
                } else {
                    option = msg.split(" ")
                }
                // Find name and arg
                var a_p = option.indexOf("-p")
                //Get name if there's no quote
                if (quote == false) {
                    var pass = [0, a_p]
                    for (var i = 0; i < pass.length;) {
                        if (pass[i] == -1) {
                            pass.splice(i,1)
                        } else {
                            i++
                        }
                    }
                    pass.sort(function(a,b){return a-b})
                    if (pass[1] > 1) {
                        check = option[1]
                    } else {
                        if (a_p > -1) {
                            check = option[option.indexOf("-p") + 2]
                        }  else if (option.length > 1) {
                            check = option[1]
                        }
                        if (check == undefined) {
                            check = ''
                        }
                    }
                }
                var name = check_player(check, 'osu')
                var storedid = 0
                var counter = 0
                var get = 1
                if (a_p > -1) {
                    if (option[option.indexOf('-p') + 1] < 1) {
                        throw "Please type a number larger than 1"
                    } else {
                        get = Number(option[option.indexOf('-p') + 1])
                    }
                }
                do {
                    for (var i = stored_map_ID.length -1 ; i > -1; i--) {
                        if (message.guild !== null) {
                            if (stored_map_ID[i].server !== undefined) {
                                if (message.guild.id == stored_map_ID[i].server) {
                                    storedid = stored_map_ID[i].id
                                    modename = stored_map_ID[i].mode
                                    counter += 1
                                }
                            }
                        } else {
                            if (stored_map_ID[i].user !== undefined) {
                                if (message.author.id == stored_map_ID[i].user) {
                                    storedid = stored_map_ID[i].id
                                    modename = stored_map_ID[i].mode
                                    counter += 1
                                }
                            }
                        }
                    }
                } while (counter < get)
                if (modename == 'Standard' || modename == 'Taiko' || modename == 'CTB' || modename == 'Mania') {
                    var modenumber = {
                        Standard: 0,
                        Taiko: 1,
                        CTB: 2,
                        Mania: 3
                    }
                    var mode = modenumber[modename]
                    var scores = await get_osu_scores(name, mode, storedid)
                    scores.sort(function (a,b) {
                        a1 = Number(a.pp)
                        b1 = Number(b.pp)
                        return b1 - a1
                    })
                    if (scores.length == 0) {
                        throw `${name} didn't play this map! D: **-Tiny**`
                    }
                    var beatmap = await get_osu_beatmap(storedid)
                    var highscore = ''
                    var parser = ''
                    if (mode == 0) {parser = await precalc(storedid)}
                    for (var i = 0; i <= scores.length - 1; i++) {
                        var rank = osu_ranking_letters(scores[i].letter)
                        var modandbit = osu_mods_enum(scores[i].mod, 'text')
                        var shortenmod = modandbit.shortenmod
                        var bitpresent = modandbit.bitpresent
                        var date = time_played(scores[i].date)
                        var star = 0
                        var fcpp = 0
                        var fcacc = 0
                        var unrankedpp = ''
                        if (mode == 0) {
                            var fccalc = osu_pp_calculator(parser,bitpresent,beatmap.fc,scores[i].count100,scores[i].count50,0,scores[i].acc,'fc')
                            fcpp = Number(fccalc.pp.total).toFixed(2)
                            fcacc = fccalc.acc
                            star = Number(fccalc.star.total).toFixed(2)
                            if (beatmap.approvalStatus !== "Ranked" && beatmap.approvalStatus !== "Approved") {
                                var comparepp = osu_pp_calculator(parser,bitpresent,scores[i].combo,scores[i].count100,scores[i].count50,scores[i].countmiss,scores[i].acc,'acc')
                                unrankedpp = `(Loved: ${Number(comparepp.pp.total).toFixed(2)}pp)`
                            }
                        }
                        if (mode == 1) {
                            var mapinfo = await other_modes_precalc(storedid, 1, bitpresent)
                            star = Number(mapinfo.star).toFixed(2)
                            var count300 = mapinfo.fc - scores[i].count100
                            fcacc = Number((0.5 * scores[i].count100 + count300) / (count300 + scores[i].count100 + 0) * 100).toFixed(2)
                            fcpp = taiko_pp_calculator(mapinfo.star, mapinfo.od, mapinfo.fc, fcacc, 0, bitpresent).toFixed(2)
                        }
                        if (mode == 2) {
                            var mapinfo = await other_modes_precalc(storedid, 2, bitpresent)
                            star = Number(mapinfo.star).toFixed(2)
                            var count300 = mapinfo.fc - scores[i].count100 - scores[i].countkatu - scores[i].count50
                            fcacc = Number((scores[i].count50 + scores[i].count100 + count300) / (scores[i].countkatu + 0 + scores[i].count50 + scores[i].count100 + count300) * 100).toFixed(2)
                            fcpp = ctb_pp_calculator(mapinfo.star, mapinfo.ar, mapinfo.fc, mapinfo.fc, fcacc, 0, bitpresent).toFixed(2)
                        }
                        if (mode == 3) {
                            var mapinfo = await other_modes_precalc(storedid, 3, bitpresent)
                            star = Number(mapinfo.star).toFixed(2)
                            fcacc = Number(21.7147240951625 * Math.log(scores[i].score/10000)*10000).toFixed(0)
                            fcpp = mania_pp_calculator(mapinfo.star, mapinfo.od, fcacc, mapinfo.fc, bitpresent).toFixed(2)
                        }
                        var fcguess = ''
                        if (scores[i].perfect == 0) {
                            if (mode == 0 || mode == 1 || mode == 2) {
                                fcguess = `**${fcpp}pp for ${fcacc}%**`
                            }
                            if (mode == 3) {
                                fcguess = `| **${fcpp}pp for ${fcacc} scores**`
                            }
                        }
                        highscore += `
${i+1}. **${shortenmod}** Score (${star}★) | ***${scores[i].pp.toFixed(2)}pp*** ${unrankedpp}
${rank} **Score:** ${scores[i].score} | **Combo:** ${scores[i].combo}/${beatmap.fc}
**Accuracy:** ${scores[i].acc.toFixed(2)}% ${scores[i].accdetail} ${fcguess}
${date}
`         
                    }
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`Top osu!${modename} Plays for ${scores[0].username} on ${beatmap.title} [${beatmap.diff}]`, `http://s.ppy.sh/a/${scores[0].userid}.png?=date${refresh}`)
                    .setColor(embedcolor)
                    .setThumbnail(`https://b.ppy.sh/thumb/${beatmap.beatmapsetID}l.jpg`)
                    .setDescription(highscore)
                    message.channel.send({embed});
                } else {
                    var modelink = {
                        'Akatsuki': 'akatsuki.pw',
                        'Relax Akatsuki': 'akatsuki.pw',
                        'Ripple': 'ripple.moe'
                    }
                    var serverlink = modelink[modename]
                    if (modename == "Relax Akatsuki" || modename == 'Akatsuki') {
                        throw 'Told cmyui to add **api/v1/user/scores** for me~ ありがとうございます!'
                    }
                    if (modename == 'Rippler') {
                        throw 'Told Howl or Nyo to add **api/v1/user/scores** for me~ ありがとうございます!'
                    }
                }
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        async function osutop(mode) {
            try {
                if (cooldown[message.author.id] !== undefined && cooldown[message.author.id].indexOf(command) !== -1) {
                    throw 'You need to wait 3 seconds before using this again!'
                }
                set_Command_cooldown(command, 3000)
                var check = ''
                var option = ''
                var modename = ''
                var top = ''
                var quote = false
                // Split name and arg
                if (msg.includes('"')) {
                    quote = true
                    option = msg.split('"')
                    check = option[1]
                    option = msg.split(" ")
                } else {
                    option = msg.split(" ")
                }
                // Find name and arg
                var a_p = option.indexOf("-p")
                var a_r = option.indexOf("-r")
                var a_m = option.indexOf("-m")
                var a_g = option.indexOf("-g")
                var a_s = option.indexOf("-s")
                var a_page = option.indexOf("-page")
                //Check if there is more than 1 argument
                var findarg = [a_p, a_r, a_m, a_g, a_page, a_s]
                var find = false
                for (var i = 0; i < findarg.length; i++) {
                    if (findarg[i] > -1) {
                        if (find == false) {
                            find = true
                        } else {
                            throw 'Only one argument please!'
                        }
                    }
                }
                //Get name if there's no quote
                if (quote == false) {
                    var pass = [0, a_p, a_r, a_m, a_g, a_page, a_s]
                    for (var i = 0; i < pass.length;) {
                        if (pass[i] == -1) {
                            pass.splice(i,1)
                        } else {
                            i++
                        }
                    }
                    pass.sort(function(a,b){return a-b})
                    if (pass[1] > 1) {
                        check = option[1]
                    } else {
                        if (a_p > -1) {
                            check = option[option.indexOf("-p") + 2]
                        } else if (a_r > -1) {
                            check = option[option.indexOf("-r") + 1]
                        } else if (a_m > -1) {
                            check = option[option.indexOf("-m") + 2]
                        } else if (a_g > -1) {
                            check = option[option.indexOf("-g") + 2]
                        } else if (a_page > -1) {
                            check = option[option.indexOf("-page") + 1]
                        } else if (a_s > -1) {
                            check = option[option.indexOf("-s") + 2]
                        } else if (option.length > 1) {
                            check = option[1]
                        }
                        if (check == undefined) {
                            check = ''
                        }
                    }
                }
                var name = check_player(check, 'osu')
                var modename = get_mode_detail(mode).modename
                if (a_p > -1) {
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
                    var best = await get_osu_top(name, mode, Number(numberrange[1]), 'best')
                    var userid = best[0].userid
                    var user = await osuApi.getUser({u: name})
                    var username = user.name
                    for (var n = Number(numberrange[0]) - 1; n < Number(numberrange[1]) ; n++) {
                        var rank = osu_ranking_letters(best[n].letter)
                        var modandbit = osu_mods_enum(best[n].mod, 'text')
                        var shortenmod = modandbit.shortenmod
                        var bitpresent = modandbit.bitpresent
                        var date = time_played(best[n].date)
                        cache_beatmap_ID(best[n].beatmapid, modename)
                        var star = 0
                        var fcpp = 0
                        var fcacc = 0
                        if (mode == 0) {
                            var parser = await precalc(best[n].beatmapid)
                            var fccalc = osu_pp_calculator(parser,bitpresent,best[n].fc,best[n].count100,best[n].count50,0,best[n].acc,'fc')
                            fcpp = Number(fccalc.pp.total).toFixed(2)
                            fcacc = fccalc.acc
                            star = Number(fccalc.star.total).toFixed(2)
                        }
                        if (mode == 1) {
                            var mapinfo = await other_modes_precalc(best[n].beatmapid, 1, bitpresent)
                            star = Number(mapinfo.star).toFixed(2)
                            var count300 = mapinfo.fc - best[n].count100
                            fcacc = Number((0.5 * best[n].count100 + count300) / (count300 + best[n].count100 + 0) * 100).toFixed(2)
                            fcpp = taiko_pp_calculator(mapinfo.star, mapinfo.od, mapinfo.fc, fcacc, 0, bitpresent).toFixed(2)
                        }
                        if (mode == 2) {
                            var mapinfo = await other_modes_precalc(best[n].beatmapid, 2, bitpresent)
                            star = Number(mapinfo.star).toFixed(2)
                            var count300 = mapinfo.fc - best[n].count100 - best[n].countkatu - best[n].count50
                            fcacc = Number((best[n].count50 + best[n].count100 + count300) / (best[n].countkatu + 0 + best[n].count50 + best[n].count100 + count300) * 100).toFixed(2)
                            fcpp = ctb_pp_calculator(mapinfo.star, mapinfo.ar, mapinfo.fc, mapinfo.fc, fcacc, 0, bitpresent).toFixed(2)
                        }
                        if (mode == 3) {
                            var mapinfo = await other_modes_precalc(best[n].beatmapid, 3, bitpresent)
                            star = Number(mapinfo.star).toFixed(2)
                            fcacc = Number(21.7147240951625 * Math.log(best[n].score/10000)*10000).toFixed(0)
                            fcpp = mania_pp_calculator(mapinfo.star, mapinfo.od, fcacc, mapinfo.fc, bitpresent).toFixed(2)
                        }
                        var fcguess = ''
                        if (best[n].perfect == 0) {
                            if (mode == 0 || mode == 1 || mode == 2) {
                                fcguess = `**${fcpp}pp for ${fcacc}%**`
                            }
                            if (mode == 3) {
                                fcguess = `| **${fcpp}pp for ${fcacc} scores**`
                            }
                        }
                        var scoreoverlay = score_overlay(n+1,best[n].title,best[n].beatmapid,star,shortenmod,best[n].pp,undefined,rank,best[n].diff,best[n].score,best[n].combo,best[n].fc,best[n].acc,best[n].accdetail,fcguess,undefined,date)
                        top += scoreoverlay
                    }
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`Top osu!${modename} Plays for ${username}`)
                    .setThumbnail(`http://s.ppy.sh/a/${userid}.png?date=${refresh}`)
                    .setColor(embedcolor)
                    .setDescription(top)
                    message.channel.send({embed});
                    // work til here
                } else if (a_r > -1) {
                    var best = await get_osu_top(name, mode, 100, 'best')
                    if (best.length == 0) {
                        throw `I think ${name} didn't play anything yet~ **-Chino**`
                    }
                    var userid = best[0].userid
                    var user = await osuApi.getUser({u: userid})
                    var username = user.name
                    for (var i = 0; i < 100; i++) {
                        best[i].top = i+1
                    }
                    best.sort(function (a,b) {
                        a1 = Date.parse(a.date)
                        b1 = Date.parse(b.date)
                        return a1 - b1
                    })
                    for (var i = best.length-1; i > best.length - 6; i--) {
                        var rank = osu_ranking_letters(best[i].letter)
                        var modandbit = osu_mods_enum(best[i].mod, 'text')
                        var shortenmod = modandbit.shortenmod
                        var bitpresent = modandbit.bitpresent
                        var date = time_played(best[i].date)
                        cache_beatmap_ID(best[i].beatmapid, modename)
                        var star = 0
                        var fcpp = 0
                        var fcacc = 0
                        if (mode == 0) {
                            var parser = await precalc(best[i].beatmapid)
                            var fccalc = osu_pp_calculator(parser,bitpresent,best[i].fc,best[i].count100,best[i].count50,0,best[i].acc,'fc')
                            fcpp = Number(fccalc.pp.total).toFixed(2)
                            fcacc = fccalc.acc
                            star = Number(fccalc.star.total).toFixed(2)
                        }
                        if (mode == 1) {
                            var mapinfo = await other_modes_precalc(best[i].beatmapid, 1, bitpresent)
                            star = Number(mapinfo.star).toFixed(2)
                            var count300 = mapinfo.fc - best[i].count100
                            fcacc = Number((0.5 * best[i].count100 + count300) / (count300 + best[i].count100 + 0) * 100).toFixed(2)
                            fcpp = taiko_pp_calculator(mapinfo.star, mapinfo.od, mapinfo.fc, fcacc, 0, bitpresent).toFixed(2)
                        }
                        if (mode == 2) {
                            var mapinfo = await other_modes_precalc(best[i].beatmapid, 2, bitpresent)
                            star = Number(mapinfo.star).toFixed(2)
                            var count300 = mapinfo.fc - best[i].count100 - best[i].countkatu - best[i].count50
                            fcacc = Number((best[i].count50 + best[i].count100 + count300) / (best[i].countkatu + 0 + best[i].count50 + best[i].count100 + count300) * 100).toFixed(2)
                            fcpp = ctb_pp_calculator(mapinfo.star, mapinfo.ar, mapinfo.fc, mapinfo.fc, fcacc, 0, bitpresent).toFixed(2)
                        }
                        if (mode == 3) {
                            var mapinfo = await other_modes_precalc(best[i].beatmapid, 3, bitpresent)
                            star = Number(mapinfo.star).toFixed(2)
                            fcacc = Number(21.7147240951625 * Math.log(best[i].score/10000)*10000).toFixed(0)
                            fcpp = mania_pp_calculator(mapinfo.star, mapinfo.od, fcacc, mapinfo.fc, bitpresent).toFixed(2)
                        }
                        var fcguess = ''
                        if (best[i].perfect == 0) {
                            if (mode == 0 || mode == 1 || mode == 2) {
                                fcguess = `**${fcpp}pp for ${fcacc}%**`
                            }
                            if (mode == 3) {
                                fcguess = `| **${fcpp}pp for ${fcacc} scores**`
                            }
                        }
                        var scoreoverlay = score_overlay(best[i].top,best[i].title,best[i].beatmapid,star,shortenmod,best[i].pp,undefined,rank,best[i].diff,best[i].score,best[i].combo,best[i].fc,best[i].acc,best[i].accdetail,fcguess,undefined,date)
                        top += scoreoverlay
                    }
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`Top osu!${modename} most recent plays for ${username}`)
                    .setThumbnail(`http://s.ppy.sh/a/${userid}.png?date=${refresh}`)
                    .setColor(embedcolor)
                    .setDescription(top)
                    message.channel.send({embed});
                } else if (a_m > -1) {
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
                        "4k": 'Key4',
                        "5k": 'Key5',
                        "6k": 'Key6',
                        "7k": 'Key7',
                        "8k": 'Key8',
                        "9k": 'Key9',
                        nomod: 'No Mod'
                    }
                    for (var i = 0; i < getmod.length; i=i+2) {
                        if (definemod[getmod.substring(i, i+2)]) {
                            mod.push(definemod[getmod.substring(i, i+2)])
                        }
                        if (getmod == 'nomod') {
                            mod.push(definemod['nomod'])
                            break
                        }
                    }
                    var best = await get_osu_top(name, mode, 100, 'best')
                    var user = await osuApi.getUser({u: name})
                    var checktop = 0
                    var userid = best[0].userid
                    var username = user.name
                    for (var i = 0; i < best.length; i++) {
                        var bestmod = best[i].mod
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
                            var rank = osu_ranking_letters(best[i].letter)
                            var modandbit = osu_mods_enum(best[i].mod, 'text')
                            var shortenmod = modandbit.shortenmod
                            var bitpresent = modandbit.bitpresent
                            var date = time_played(best[i].date)
                            cache_beatmap_ID(best[i].beatmapid, modename)
                            var star = 0
                            var fcpp = 0
                            var fcacc = 0
                            if (mode == 0) {
                                var parser = await precalc(best[i].beatmapid)
                                var fccalc = osu_pp_calculator(parser,bitpresent,best[i].fc,best[i].count100,best[i].count50,0,best[i].acc,'fc')
                                fcpp = Number(fccalc.pp.total).toFixed(2)
                                fcacc = fccalc.acc
                                star = Number(fccalc.star.total).toFixed(2)
                            }
                            if (mode == 1) {
                                var mapinfo = await other_modes_precalc(best[i].beatmapid, 1, bitpresent)
                                star = Number(mapinfo.star).toFixed(2)
                                var count300 = mapinfo.fc - best[i].count100
                                fcacc = Number((0.5 * best[i].count100 + count300) / (count300 + best[i].count100 + 0) * 100).toFixed(2)
                                fcpp = taiko_pp_calculator(mapinfo.star, mapinfo.od, mapinfo.fc, fcacc, 0, bitpresent).toFixed(2)
                            }
                            if (mode == 2) {
                                var mapinfo = await other_modes_precalc(best[i].beatmapid, 2, bitpresent)
                                star = Number(mapinfo.star).toFixed(2)
                                var count300 = mapinfo.fc - best[i].count100 - best[i].countkatu - best[i].count50
                                fcacc = Number((best[i].count50 + best[i].count100 + count300) / (best[i].countkatu + 0 + best[i].count50 + best[i].count100 + count300) * 100).toFixed(2)
                                fcpp = ctb_pp_calculator(mapinfo.star, mapinfo.ar, mapinfo.fc, mapinfo.fc, fcacc, 0, bitpresent).toFixed(2)
                            }
                            if (mode == 3) {
                                var mapinfo = await other_modes_precalc(best[i].beatmapid, 3, bitpresent)
                                star = Number(mapinfo.star).toFixed(2)
                                fcacc = Number(21.7147240951625 * Math.log(best[i].score/10000)*10000).toFixed(0)
                                fcpp = mania_pp_calculator(mapinfo.star, mapinfo.od, fcacc, mapinfo.fc, bitpresent).toFixed(2)
                            }
                            var fcguess = ''
                            if (best[i].perfect == 0) {
                                if (mode == 0 || mode == 1 || mode == 2) {
                                    fcguess = `**${fcpp}pp for ${fcacc}%**`
                                }
                                if (mode == 3) {
                                    fcguess = `| **${fcpp}pp for ${fcacc} scores**`
                                }
                            }
                            var scoreoverlay = score_overlay(i+1,best[i].title,best[i].beatmapid,star,shortenmod,best[i].pp,undefined,rank,best[i].diff,best[i].score,best[i].combo,best[i].fc,best[i].acc,best[i].accdetail,fcguess,undefined,date)
                            top += scoreoverlay
                        }
                    }
                    if (top.length == 0) {
                        top += `This user doesn't have any ${getmod.toUpperCase()} top play`
                    }
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`Top osu!${modename} Plays with ${getmod.toUpperCase()} for ${username}`)
                    .setThumbnail(`http://s.ppy.sh/a/${userid}.png?date=${refresh}`)
                    .setColor(embedcolor)
                    .setDescription(top)
                    message.channel.send({embed});
                } else if (a_g > -1) {
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
                } else if (a_page > -1) {
                    var best = await get_osu_top(name, mode, 100, 'best')
                    var userid = best[0].userid
                    var user = await osuApi.getUser({u: name})
                    var username = user.name
                    var page = 1
                    var pages = []
                    async function loadpage() {
                        var gathering = ''
                        for (var n = 0; n < 5; n++) {
                            var i = (page - 1) * 5 - 1 + (n+1)
                            if (i < best.length- 1) {
                                var rank = osu_ranking_letters(best[i].letter)
                                var modandbit = osu_mods_enum(best[i].mod, 'text')
                                var shortenmod = modandbit.shortenmod
                                var bitpresent = modandbit.bitpresent
                                var date = time_played(best[i].date)
                                cache_beatmap_ID(best[i].beatmapid, modename)
                                var star = 0
                                var fcpp = 0
                                var fcacc = 0
                                if (mode == 0) {
                                    var parser = await precalc(best[i].beatmapid)
                                    var fccalc = osu_pp_calculator(parser,bitpresent,best[i].fc,best[i].count100,best[i].count50,0,best[i].acc,'fc')
                                    fcpp = Number(fccalc.pp.total).toFixed(2)
                                    fcacc = fccalc.acc
                                    star = Number(fccalc.star.total).toFixed(2)
                                }
                                if (mode == 1) {
                                    var mapinfo = await other_modes_precalc(best[i].beatmapid, 1, bitpresent)
                                    star = Number(mapinfo.star).toFixed(2)
                                    var count300 = mapinfo.fc - best[i].count100
                                    fcacc = Number((0.5 * best[i].count100 + count300) / (count300 + best[i].count100 + 0) * 100).toFixed(2)
                                    fcpp = taiko_pp_calculator(mapinfo.star, mapinfo.od, mapinfo.fc, fcacc, 0, bitpresent).toFixed(2)
                                }
                                if (mode == 2) {
                                    var mapinfo = await other_modes_precalc(best[i].beatmapid, 2, bitpresent)
                                    star = Number(mapinfo.star).toFixed(2)
                                    var count300 = mapinfo.fc - best[i].count100 - best[i].countkatu - best[i].count50
                                    fcacc = Number((best[i].count50 + best[i].count100 + count300) / (best[i].countkatu + 0 + best[i].count50 + best[i].count100 + count300) * 100).toFixed(2)
                                    fcpp = ctb_pp_calculator(mapinfo.star, mapinfo.ar, mapinfo.fc, mapinfo.fc, fcacc, 0, bitpresent).toFixed(2)
                                }
                                if (mode == 3) {
                                    var mapinfo = await other_modes_precalc(best[i].beatmapid, 3, bitpresent)
                                    star = Number(mapinfo.star).toFixed(2)
                                    fcacc = Number(21.7147240951625 * Math.log(best[i].score/10000)*10000).toFixed(0)
                                    fcpp = mania_pp_calculator(mapinfo.star, mapinfo.od, fcacc, mapinfo.fc, bitpresent).toFixed(2)
                                }
                                var fcguess = ''
                                if (best[i].perfect == 0) {
                                    if (mode == 0 || mode == 1 || mode == 2) {
                                        fcguess = `**${fcpp}pp for ${fcacc}%**`
                                    }
                                    if (mode == 3) {
                                        fcguess = `| **${fcpp}pp for ${fcacc} scores**`
                                    }
                                }
                                var scoreoverlay = score_overlay(i+1,best[i].title,best[i].beatmapid,star,shortenmod,best[i].pp,undefined,rank,best[i].diff,best[i].score,best[i].combo,best[i].fc,best[i].acc,best[i].accdetail,fcguess,undefined,date)
                                gathering += scoreoverlay
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
                } else if (a_s > -1) { 
                    var map_name = option[option.indexOf('-s') + 1].replace("_", " ")
                    var top = []
                    var get = await get_osu_top(name, mode, 100, 'best')
                    for (var i = 0; i < 100; i++) {
                        get[i].top = i+1
                    }
                    var best = get.filter(function(map) {return map.title.toLowerCase().includes(map_name) || map.creator.toLowerCase().includes(map_name) || map.diff.toLowerCase().includes(map_name) || map.source.toLowerCase().includes(map_name) || map.artist.toLowerCase().includes(map_name)})
                    console.log(best)
                    var userid = best[0].userid
                    var user = await osuApi.getUser({u: name})
                    var username = user.name
                    var maplength = best.length > 5 ? 5 : best.length
                    for (var i = 0; i < maplength; i++) {
                        var rank = osu_ranking_letters(best[i].letter)
                        var modandbit = osu_mods_enum(best[i].mod, 'text')
                        var shortenmod = modandbit.shortenmod
                        var bitpresent = modandbit.bitpresent
                        var date = time_played(best[i].date)
                        cache_beatmap_ID(best[i].beatmapid, modename)
                        var star = 0
                        var fcpp = 0
                        var fcacc = 0
                        if (mode == 0) {
                            var parser = await precalc(best[i].beatmapid)
                            var fccalc = osu_pp_calculator(parser,bitpresent,best[i].fc,best[i].count100,best[i].count50,0,best[i].acc,'fc')
                            fcpp = Number(fccalc.pp.total).toFixed(2)
                            fcacc = fccalc.acc
                            star = Number(fccalc.star.total).toFixed(2)
                        }
                        if (mode == 1) {
                            var mapinfo = await other_modes_precalc(best[i].beatmapid, 1, bitpresent)
                            star = Number(mapinfo.star).toFixed(2)
                            var count300 = mapinfo.fc - best[i].count100
                            fcacc = Number((0.5 * best[i].count100 + count300) / (count300 + best[i].count100 + 0) * 100).toFixed(2)
                            fcpp = taiko_pp_calculator(mapinfo.star, mapinfo.od, mapinfo.fc, fcacc, 0, bitpresent).toFixed(2)
                        }
                        if (mode == 2) {
                            var mapinfo = await other_modes_precalc(best[i].beatmapid, 2, bitpresent)
                            star = Number(mapinfo.star).toFixed(2)
                            var count300 = mapinfo.fc - best[i].count100 - best[i].countkatu - best[i].count50
                            fcacc = Number((best[i].count50 + best[i].count100 + count300) / (best[i].countkatu + 0 + best[i].count50 + best[i].count100 + count300) * 100).toFixed(2)
                            fcpp = ctb_pp_calculator(mapinfo.star, mapinfo.ar, mapinfo.fc, mapinfo.fc, fcacc, 0, bitpresent).toFixed(2)
                        }
                        if (mode == 3) {
                            var mapinfo = await other_modes_precalc(best[i].beatmapid, 3, bitpresent)
                            star = Number(mapinfo.star).toFixed(2)
                            fcacc = Number(21.7147240951625 * Math.log(best[i].score/10000)*10000).toFixed(0)
                            fcpp = mania_pp_calculator(mapinfo.star, mapinfo.od, fcacc, mapinfo.fc, bitpresent).toFixed(2)
                        }
                        var fcguess = ''
                        if (best[i].perfect == 0) {
                            if (mode == 0 || mode == 1 || mode == 2) {
                                fcguess = `**${fcpp}pp for ${fcacc}%**`
                            }
                            if (mode == 3) {
                                fcguess = `| **${fcpp}pp for ${fcacc} scores**`
                            }
                        }
                        var scoreoverlay = score_overlay(best[i].top,best[i].title,best[i].beatmapid,star,shortenmod,best[i].pp,undefined,rank,best[i].diff,best[i].score,best[i].combo,best[i].fc,best[i].acc,best[i].accdetail,fcguess,undefined,date)
                        top += scoreoverlay
                    }
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`Top osu!${modename} Plays for ${username} (Searching: ${map_name})`)
                    .setThumbnail(`http://s.ppy.sh/a/${userid}.png?date=${refresh}`)
                    .setColor(embedcolor)
                    .setDescription(top)
                    message.channel.send({embed});
                } else {
                    var best = await get_osu_top(name, mode, 5, 'best')
                    var userid = best[0].userid
                    var user = await osuApi.getUser({u: name})
                    var username = user.name
                    for (var i = 0; i < 5; i++) {
                        var rank = osu_ranking_letters(best[i].letter)
                        var modandbit = osu_mods_enum(best[i].mod, 'text')
                        var shortenmod = modandbit.shortenmod
                        var bitpresent = modandbit.bitpresent
                        var date = time_played(best[i].date)
                        cache_beatmap_ID(best[i].beatmapid, modename)
                        var star = 0
                        var fcpp = 0
                        var fcacc = 0
                        if (mode == 0) {
                            var parser = await precalc(best[i].beatmapid)
                            var fccalc = osu_pp_calculator(parser,bitpresent,best[i].fc,best[i].count100,best[i].count50,0,best[i].acc,'fc')
                            fcpp = Number(fccalc.pp.total).toFixed(2)
                            fcacc = fccalc.acc
                            star = Number(fccalc.star.total).toFixed(2)
                        }
                        if (mode == 1) {
                            var mapinfo = await other_modes_precalc(best[i].beatmapid, 1, bitpresent)
                            star = Number(mapinfo.star).toFixed(2)
                            var count300 = mapinfo.fc - best[i].count100
                            fcacc = Number((0.5 * best[i].count100 + count300) / (count300 + best[i].count100 + 0) * 100).toFixed(2)
                            fcpp = taiko_pp_calculator(mapinfo.star, mapinfo.od, mapinfo.fc, fcacc, 0, bitpresent).toFixed(2)
                        }
                        if (mode == 2) {
                            var mapinfo = await other_modes_precalc(best[i].beatmapid, 2, bitpresent)
                            star = Number(mapinfo.star).toFixed(2)
                            var count300 = mapinfo.fc - best[i].count100 - best[i].countkatu - best[i].count50
                            fcacc = Number((best[i].count50 + best[i].count100 + count300) / (best[i].countkatu + 0 + best[i].count50 + best[i].count100 + count300) * 100).toFixed(2)
                            fcpp = ctb_pp_calculator(mapinfo.star, mapinfo.ar, mapinfo.fc, mapinfo.fc, fcacc, 0, bitpresent).toFixed(2)
                        }
                        if (mode == 3) {
                            var mapinfo = await other_modes_precalc(best[i].beatmapid, 3, bitpresent)
                            star = Number(mapinfo.star).toFixed(2)
                            fcacc = Number(21.7147240951625 * Math.log(best[i].score/10000)*10000).toFixed(0)
                            fcpp = mania_pp_calculator(mapinfo.star, mapinfo.od, fcacc, mapinfo.fc, bitpresent).toFixed(2)
                        }
                        var fcguess = ''
                        if (best[i].perfect == 0) {
                            if (mode == 0 || mode == 1 || mode == 2) {
                                fcguess = `**${fcpp}pp for ${fcacc}%**`
                            }
                            if (mode == 3) {
                                fcguess = `| **${fcpp}pp for ${fcacc} scores**`
                            }
                        }
                        var scoreoverlay = score_overlay(i+1,best[i].title,best[i].beatmapid,star,shortenmod,best[i].pp,undefined,rank,best[i].diff,best[i].score,best[i].combo,best[i].fc,best[i].acc,best[i].accdetail,fcguess,undefined,date)
                        top += scoreoverlay
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

        async function map(){
            try {
                if (cooldown[message.author.id] !== undefined && cooldown[message.author.id].indexOf(command) !== -1) {
                    throw 'You need to wait 5 seconds before using this again!'
                }
                set_Command_cooldown(command, 5000)
                var beatmapid = 0
                var mods = []
                var modintext = msg.split(' ')
                if (modintext[1] == undefined) {
                    mods.push('No Mod')
                } else {
                    mods.push(modintext[1])
                }
                var bitpresent = 0
                var modename = ''
                var mode = 0
                for (var i = stored_map_ID.length -1 ; i > -1; i--) {
                    if (message.guild !== null) {
                        if (stored_map_ID[i].server !== undefined) {
                            if (message.guild.id == stored_map_ID[i].server) {
                                beatmapid = stored_map_ID[i].id
                                modename = stored_map_ID[i].mode
                                break;
                            }
                        }
                    } else {
                        if (stored_map_ID[i].user !== undefined) {
                            if (message.author.id == stored_map_ID[i].user) {
                                beatmapid = stored_map_ID[i].id
                                modename = stored_map_ID[i].mode
                                break;
                            }
                        }
                    }
                }
                if (modename == 'Standard' || modename == 'Ripple' || modename == 'Akatsuki') {
                    mode = 0
                } else if (modename == 'Taiko') {
                    mode = 1
                } else if (modename == 'CTB') {
                    mode = 2
                } else if (modename == 'Mania') {
                    mode = 3
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
                var map = await get_osu_beatmap(beatmapid)
                var maxCombo = ''
                var diffdetail = ''
                var mapdetail = ''
                var ppdetail = ''
                var star, bpm, time
                if (mode == 0) {
                    maxCombo = map.fc
                    var parser = await precalc(beatmapid)
                    var acc95 = osu_pp_calculator(parser,bitpresent,maxCombo,0,0,0,95,'acc')
                    var acc97 = osu_pp_calculator(parser,bitpresent,maxCombo,0,0,0,97,'acc')
                    var acc99 = osu_pp_calculator(parser,bitpresent,maxCombo,0,0,0,99,'acc')
                    var acc100 = osu_pp_calculator(parser,bitpresent,maxCombo,0,0,0,100,'acc')
                    var detail = beatmap_detail(mods[0],map.timetotal,0,map.bpm,acc100.cs, acc100.ar,acc100.od,acc100.hp)
                    var totallength = Number(detail.timetotal).toFixed(0)
                    star = Number(acc100.star.total).toFixed(2)
                    bpm = Number(detail.bpm).toFixed(0)
                    var ar = Number(detail.ar).toFixed(2)
                    var od = Number(detail.od).toFixed(2)
                    var hp = Number(detail.hp).toFixed(2)
                    var cs = Number(detail.cs).toFixed(2)
                    time = `${Math.floor(totallength / 60)}:${('0' + (totallength - Math.floor(totallength / 60) * 60)).slice(-2)}`
                    diffdetail = `(Aim: ${Number(acc100.star.aim).toFixed(2) * 2}★, Speed: ${Number(acc100.star.speed).toFixed(2) * 2}★)`
                    mapdetail = `**AR:** ${ar} / **OD:** ${od} / **HP:** ${hp} / **CS:** ${cs}`
                    ppdetail = `**95%**-${Number(acc95.pp.total).toFixed(2)}pp | **97%**-${Number(acc97.pp.total).toFixed(2)}pp | **99%**-${Number(acc99.pp.total).toFixed(2)}pp | **100%**-${Number(acc100.pp.total).toFixed(2)}pp`
                } else if (mode == 1) {
                    maxCombo = "Can't calculated"
                    var mapinfo = await other_modes_precalc(beatmapid, 1, bitpresent)
                    var acc95 = taiko_pp_calculator(mapinfo.star, mapinfo.od, mapinfo.fc, 95, 0, bitpresent).toFixed(2)
                    var acc97 = taiko_pp_calculator(mapinfo.star, mapinfo.od, mapinfo.fc, 97, 0, bitpresent).toFixed(2)
                    var acc99 = taiko_pp_calculator(mapinfo.star, mapinfo.od, mapinfo.fc, 99, 0, bitpresent).toFixed(2)
                    var acc100 = taiko_pp_calculator(mapinfo.star, mapinfo.od, mapinfo.fc, 100, 0, bitpresent).toFixed(2)
                    var detail = beatmap_detail(mods[0], map.timetotal, 0, map.bpm, 0, 0, mapinfo.od, mapinfo.hp)
                    var totallength = Number(detail.timetotal).toFixed(0)
                    star = Number(mapinfo.star).toFixed(2)
                    bpm = Number(detail.bpm).toFixed(0)
                    var od = Number(detail.od).toFixed(2)
                    var hp = Number(detail.hp).toFixed(2)
                    time = `${Math.floor(totallength / 60)}:${('0' + (totallength - Math.floor(totallength / 60) * 60)).slice(-2)}`
                    mapdetail = `**OD:** ${od} / **HP:** ${hp}`
                    ppdetail = `**95%**-${Number(acc95).toFixed(2)}pp | **97%**-${Number(acc97).toFixed(2)}pp | **99%**-${Number(acc99).toFixed(2)}pp | **100%**-${Number(acc100).toFixed(2)}pp`
                } else if (mode == 2) {
                    maxCombo = map.fc
                    var mapinfo = await other_modes_precalc(beatmapid, 2, bitpresent)
                    var acc95 = ctb_pp_calculator(mapinfo.star, mapinfo.ar, mapinfo.fc, mapinfo.fc, 95, 0, bitpresent).toFixed(2)
                    var acc97 = ctb_pp_calculator(mapinfo.star, mapinfo.ar, mapinfo.fc, mapinfo.fc, 97, 0, bitpresent).toFixed(2)
                    var acc99 = ctb_pp_calculator(mapinfo.star, mapinfo.ar, mapinfo.fc, mapinfo.fc, 99, 0, bitpresent).toFixed(2)
                    var acc100 = ctb_pp_calculator(mapinfo.star, mapinfo.ar, mapinfo.fc, mapinfo.fc, 100, 0, bitpresent).toFixed(2)
                    var detail = beatmap_detail(mods[0],map.timetotal,0, map.bpm, mapinfo.cs, mapinfo.ar, mapinfo.od, mapinfo.hp)
                    var totallength = Number(detail.timetotal).toFixed(0)
                    star = Number(mapinfo.star).toFixed(2)
                    bpm = Number(detail.bpm).toFixed(0)
                    var ar = Number(detail.ar).toFixed(2)
                    var od = Number(detail.od).toFixed(2)
                    var hp = Number(detail.hp).toFixed(2)
                    var cs = Number(detail.cs).toFixed(2)
                    time = `${Math.floor(totallength / 60)}:${('0' + (totallength - Math.floor(totallength / 60) * 60)).slice(-2)}`
                    mapdetail = `**AR:** ${ar} / **OD:** ${od} / **HP:** ${hp} / **CS:** ${cs}`
                    ppdetail = `**95%**-${Number(acc95).toFixed(2)}pp | **97%**-${Number(acc97).toFixed(2)}pp | **99%**-${Number(acc99).toFixed(2)}pp | **100%**-${Number(acc100).toFixed(2)}pp`
                } else if (mode == 3) {
                    maxCombo = "Can't calculated"
                    var mapinfo = await other_modes_precalc(beatmapid, 3, bitpresent)
                    var score700k = mania_pp_calculator(mapinfo.star, mapinfo.od, 700000, mapinfo.fc, bitpresent).toFixed(2)
                    var score800k = mania_pp_calculator(mapinfo.star, mapinfo.od, 800000, mapinfo.fc, bitpresent).toFixed(2)
                    var score900k = mania_pp_calculator(mapinfo.star, mapinfo.od, 900000, mapinfo.fc, bitpresent).toFixed(2)
                    var score1m = mania_pp_calculator(mapinfo.star, mapinfo.od, 1000000, mapinfo.fc, bitpresent).toFixed(2)
                    var detail = beatmap_detail(mods[0], map.timetotal, 0, map.bpm, 0, 0, 0, 0)
                    var totallength = Number(detail.timetotal).toFixed(0)
                    star = Number(mapinfo.star).toFixed(2)
                    bpm = Number(detail.bpm).toFixed(0)
                    var key = Number(mapinfo.cs).toFixed(0)
                    var od = Number(mapinfo.od).toFixed(2)
                    var hp = Number(mapinfo.hp).toFixed(2)
                    time = `${Math.floor(totallength / 60)}:${('0' + (totallength - Math.floor(totallength / 60) * 60)).slice(-2)}`
                    mapdetail = `**Keys:** ${key} / **OD:** ${od} / **HP:** ${hp}`
                    ppdetail = `**700k**-${Number(score700k).toFixed(2)}pp | **800k**-${Number(score800k).toFixed(2)}pp | **900k**-${Number(score900k).toFixed(2)}pp | **1m**-${Number(score1m).toFixed(2)}pp`
                }
                cache_beatmap_ID(beatmapid, modename)
                const embed = new Discord.RichEmbed()
                .setAuthor(`${map.title} by ${map.creator}`,'',`https://osu.ppy.sh/b/${beatmapid[i]}?m=${mode}`)
                .setThumbnail(`https://b.ppy.sh/thumb/${map.beatmapsetID}l.jpg`)
                .setColor(embedcolor)
                .setDescription(`
**Length:** ${time} **BPM:** ${bpm} **Mods:** ${mods[0].toUpperCase()}
**Download:** [map](https://osu.ppy.sh/d/${map.beatmapsetID}) ([no vid](https://osu.ppy.sh/d/${map.beatmapsetID}n))
<:difficultyIcon:507522545759682561> __${map.diff}__  
**Difficulty:** ${star}★ ${diffdetail}
**Max Combo:** ${maxCombo}
${mapdetail}
**PP:** ${ppdetail}`)
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
                set_Command_cooldown(command, 3000)
                url_command = true
                var beatmapid = 0
                var check = ''
                var mode = 0
                if (msg.substr(8,21) == 'https://osu.ppy.sh/b/') {
                    var data = msg.split("/")[4]
                    beatmapid = data.split(" ")[0]
                    if (msg.substring(0, msg.length).includes('?m=') == true) {
                        beatmapid = msg.substring(msg.indexOf(beatmapid[0]), msg.indexOf('?m='))
                        mode = msg.substr(msg.indexOf('?m=')+3, 1)
                    }
                }
                if (msg.substr(8,31) == 'https://osu.ppy.sh/beatmapsets/') {
                    var data = msg.split("/")[5]
                    beatmapid = data.split(" ")[0]
                    var modedata = msg.split("/")[4]
                    if (modedata.includes('#osu')) {
                        mode = 0
                    } else if (modedata.includes('#taiko')) {
                        mode = 1
                    } else if (modedata.includes('#fruits')) {
                        mode = 2
                    } else if (modedata.includes('#mania')) {
                        mode = 3
                    }
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
                var name = check_player(check, 'osu')
                var scores = await get_osu_scores(name, mode, beatmapid)
                scores.sort(function (a,b) {
                    a1 = Number(a.pp)
                    b1 = Number(b.pp)
                    return b1 - a1
                })
                if (scores.length == 0) {
                    throw `${name} didn't play this map! D: **-Tiny**`
                }
                var beatmap = await get_osu_beatmap(beatmapid)
                var highscore = ''
                var modename = get_mode_detail(mode).modename
                var parser = await precalc(beatmapid)
                for (var i = 0; i < scores.length; i++) {
                    var rank = osu_ranking_letters(scores[i].letter)
                    var modandbit = osu_mods_enum(scores[i].mod, 'text')
                    var shortenmod = modandbit.shortenmod
                    var bitpresent = modandbit.bitpresent
                    var date = time_played(scores[i].date)
                    var star = 0
                    var fcpp = 0
                    var fcacc = 0
                    var unrankedpp = ''
                    if (mode == 0) {
                        var fccalc = osu_pp_calculator(parser,bitpresent,beatmap.fc,scores[i].count100,scores[i].count50,0,scores[i].acc,'fc')
                        fcpp = Number(fccalc.pp.total).toFixed(2)
                        fcacc = fccalc.acc
                        star = Number(fccalc.star.total).toFixed(2)
                        if (beatmap.approvalStatus !== "Ranked" && beatmap.approvalStatus !== "Approved") {
                            var comparepp = osu_pp_calculator(parser,bitpresent,scores[i].combo,scores[i].count100,scores[i].count50,scores[i].countmiss,scores[i].acc,'acc')
                            unrankedpp = `(Loved: ${Number(comparepp.pp.total).toFixed(2)}pp)`
                        }
                    }
                    if (mode == 1) {
                        var mapinfo = await other_modes_precalc(beatmapid, 1, bitpresent)
                        star = Number(mapinfo.star).toFixed(2)
                        var count300 = mapinfo.fc - scores[i].count100
                        fcacc = Number((0.5 * scores[i].count100 + count300) / (count300 + scores[i].count100 + 0) * 100).toFixed(2)
                        fcpp = taiko_pp_calculator(mapinfo.star, mapinfo.od, mapinfo.fc, fcacc, 0, bitpresent).toFixed(2)
                    }
                    if (mode == 2) {
                        var mapinfo = await other_modes_precalc(beatmapid, 2, bitpresent)
                        star = Number(mapinfo.star).toFixed(2)
                        var count300 = mapinfo.fc - scores[i].count100 - scores[i].countkatu - scores[i].count50
                        fcacc = Number((scores[i].count50 + scores[i].count100 + count300) / (scores[i].countkatu + 0 + scores[i].count50 + scores[i].count100 + count300) * 100).toFixed(2)
                        fcpp = ctb_pp_calculator(mapinfo.star, mapinfo.ar, mapinfo.fc, mapinfo.fc, fcacc, 0, bitpresent).toFixed(2)
                    }
                    if (mode == 3) {
                        var mapinfo = await other_modes_precalc(beatmapid, 3, bitpresent)
                        star = Number(mapinfo.star).toFixed(2)
                        fcacc = Number(21.7147240951625 * Math.log(scores[i].score/10000)*10000).toFixed(0)
                        fcpp = mania_pp_calculator(mapinfo.star, mapinfo.od, fcacc, mapinfo.fc, bitpresent).toFixed(2)
                    }
                    var fcguess = ''
                    if (scores[i].perfect == 0) {
                        if (mode == 0 || mode == 1 || mode == 2) {
                            fcguess = `**${fcpp}pp for ${fcacc}%**`
                        }
                        if (mode == 3) {
                            fcguess = `| **${fcpp}pp for ${fcacc} scores**`
                        }
                    }
                    highscore += `
${i+1}. **${shortenmod}** Score (${star}★) | ***${scores[i].pp.toFixed(2)}pp*** ${unrankedpp}
${rank} **Score:** ${scores[i].score} | **Combo:** ${scores[i].combo}/${beatmap.fc}
**Accuracy:** ${scores[i].acc.toFixed(2)}% ${scores[i].accdetail} ${fcguess}
${date}
`           
                }
                const embed = new Discord.RichEmbed()
                .setAuthor(`Top osu!${modename} Plays for ${scores[0].username} on ${beatmap.title} [${beatmap.diff}]`, `http://s.ppy.sh/a/${scores[0].userid}.png?=date${refresh}`)
                .setColor(embedcolor)
                .setThumbnail(`https://b.ppy.sh/thumb/${beatmap.beatmapsetID}l.jpg`)
                .setDescription(highscore)
                message.channel.send({embed});
                url_command = false
            } catch (error) {
                message.channel.send(String(error))
                url_command = false
            }
        }

        async function beatmapdetail() {
            try {
                var beatmapid = []
                var mods = []
                var mode = 0
                for (var m = 0; m < msg.length; m++) {
                    if (msg.substr(m,21) == 'https://osu.ppy.sh/b/') {
                        var data = msg.split("/")[4]
                        beatmapid.push(data.split(" ")[0])
                        if (msg.substring(0, msg.length).includes('?m=') == true) {
                            beatmapid[0] = msg.substring(msg.indexOf(beatmapid[0]), msg.indexOf('?m='))
                            mode = msg.substr(msg.indexOf('?m=')+3, 1)
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
                        var modedata = msg.split("/")[4]
                        if (modedata.includes('#osu')) {
                            mode = 0
                        } else if (modedata.includes('#taiko')) {
                            mode = 1
                        } else if (modedata.includes('#fruits')) {
                            mode = 2
                        } else if (modedata.includes('#mania')) {
                            mode = 3
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
                    var map = await get_osu_beatmap(beatmapid[i])
                    if (map.length == 0) {
                        throw 'Is this even a valid link?'
                    }
                    var maxCombo = ''
                    var diffdetail = ''
                    var mapdetail = ''
                    var ppdetail = ''
                    var star, bpm, time
                    var modename = get_mode_detail(mode).modename
                    if (mode == 0) {
                        maxCombo = map.fc
                        var parser = await precalc(beatmapid[i])
                        var acc95 = osu_pp_calculator(parser,bitpresent,maxCombo,0,0,0,95,'acc')
                        var acc97 = osu_pp_calculator(parser,bitpresent,maxCombo,0,0,0,97,'acc')
                        var acc99 = osu_pp_calculator(parser,bitpresent,maxCombo,0,0,0,99,'acc')
                        var acc100 = osu_pp_calculator(parser,bitpresent,maxCombo,0,0,0,100,'acc')
                        var detail = beatmap_detail(mods[i],map.timetotal,0,map.bpm,acc100.cs, acc100.ar,acc100.od,acc100.hp)
                        var totallength = Number(detail.timetotal).toFixed(0)
                        star = Number(acc100.star.total).toFixed(2)
                        bpm = Number(detail.bpm).toFixed(0)
                        var ar = Number(detail.ar).toFixed(2)
                        var od = Number(detail.od).toFixed(2)
                        var hp = Number(detail.hp).toFixed(2)
                        var cs = Number(detail.cs).toFixed(2)
                        time = `${Math.floor(totallength / 60)}:${('0' + (totallength - Math.floor(totallength / 60) * 60)).slice(-2)}`
                        diffdetail = `(Aim: ${Number(acc100.star.aim).toFixed(2) * 2}★, Speed: ${Number(acc100.star.speed).toFixed(2) * 2}★)`
                        mapdetail = `**AR:** ${ar} / **OD:** ${od} / **HP:** ${hp} / **CS:** ${cs}`
                        ppdetail = `**95%**-${Number(acc95.pp.total).toFixed(2)}pp | **97%**-${Number(acc97.pp.total).toFixed(2)}pp | **99%**-${Number(acc99.pp.total).toFixed(2)}pp | **100%**-${Number(acc100.pp.total).toFixed(2)}pp`
                    } else if (mode == 1) {
                        maxCombo = "Can't calculated"
                        var mapinfo = await other_modes_precalc(beatmapid[i], 1, bitpresent)
                        var acc95 = taiko_pp_calculator(mapinfo.star, mapinfo.od, mapinfo.fc, 95, 0, bitpresent).toFixed(2)
                        var acc97 = taiko_pp_calculator(mapinfo.star, mapinfo.od, mapinfo.fc, 97, 0, bitpresent).toFixed(2)
                        var acc99 = taiko_pp_calculator(mapinfo.star, mapinfo.od, mapinfo.fc, 99, 0, bitpresent).toFixed(2)
                        var acc100 = taiko_pp_calculator(mapinfo.star, mapinfo.od, mapinfo.fc, 100, 0, bitpresent).toFixed(2)
                        var detail = beatmap_detail(mods[i], map.timetotal, 0, map.bpm, 0, 0, mapinfo.od, mapinfo.hp)
                        var totallength = Number(detail.timetotal).toFixed(0)
                        star = Number(mapinfo.star).toFixed(2)
                        bpm = Number(detail.bpm).toFixed(0)
                        var od = Number(detail.od).toFixed(2)
                        var hp = Number(detail.hp).toFixed(2)
                        time = `${Math.floor(totallength / 60)}:${('0' + (totallength - Math.floor(totallength / 60) * 60)).slice(-2)}`
                        mapdetail = `**OD:** ${od} / **HP:** ${hp}`
                        ppdetail = `**95%**-${Number(acc95).toFixed(2)}pp | **97%**-${Number(acc97).toFixed(2)}pp | **99%**-${Number(acc99).toFixed(2)}pp | **100%**-${Number(acc100).toFixed(2)}pp`
                    } else if (mode == 2) {
                        maxCombo = map.fc
                        var mapinfo = await other_modes_precalc(beatmapid[i], 2, bitpresent)
                        var acc95 = ctb_pp_calculator(mapinfo.star, mapinfo.ar, mapinfo.fc, mapinfo.fc, 95, 0, bitpresent).toFixed(2)
                        var acc97 = ctb_pp_calculator(mapinfo.star, mapinfo.ar, mapinfo.fc, mapinfo.fc, 97, 0, bitpresent).toFixed(2)
                        var acc99 = ctb_pp_calculator(mapinfo.star, mapinfo.ar, mapinfo.fc, mapinfo.fc, 99, 0, bitpresent).toFixed(2)
                        var acc100 = ctb_pp_calculator(mapinfo.star, mapinfo.ar, mapinfo.fc, mapinfo.fc, 100, 0, bitpresent).toFixed(2)
                        var detail = beatmap_detail(mods[i],map.timetotal,0, map.bpm, mapinfo.cs, mapinfo.ar, mapinfo.od, mapinfo.hp)
                        var totallength = Number(detail.timetotal).toFixed(0)
                        star = Number(mapinfo.star).toFixed(2)
                        bpm = Number(detail.bpm).toFixed(0)
                        var ar = Number(detail.ar).toFixed(2)
                        var od = Number(detail.od).toFixed(2)
                        var hp = Number(detail.hp).toFixed(2)
                        var cs = Number(detail.cs).toFixed(2)
                        time = `${Math.floor(totallength / 60)}:${('0' + (totallength - Math.floor(totallength / 60) * 60)).slice(-2)}`
                        mapdetail = `**AR:** ${ar} / **OD:** ${od} / **HP:** ${hp} / **CS:** ${cs}`
                        ppdetail = `**95%**-${Number(acc95).toFixed(2)}pp | **97%**-${Number(acc97).toFixed(2)}pp | **99%**-${Number(acc99).toFixed(2)}pp | **100%**-${Number(acc100).toFixed(2)}pp`
                    } else if (mode == 3) {
                        maxCombo = "Can't calculated"
                        var mapinfo = await other_modes_precalc(beatmapid[i], 3, bitpresent)
                        var score700k = mania_pp_calculator(mapinfo.star, mapinfo.od, 700000, mapinfo.fc, bitpresent).toFixed(2)
                        var score800k = mania_pp_calculator(mapinfo.star, mapinfo.od, 800000, mapinfo.fc, bitpresent).toFixed(2)
                        var score900k = mania_pp_calculator(mapinfo.star, mapinfo.od, 900000, mapinfo.fc, bitpresent).toFixed(2)
                        var score1m = mania_pp_calculator(mapinfo.star, mapinfo.od, 1000000, mapinfo.fc, bitpresent).toFixed(2)
                        var detail = beatmap_detail(mods[i], map.timetotal, 0, map.bpm, 0, 0, 0, 0)
                        var totallength = Number(detail.timetotal).toFixed(0)
                        star = Number(mapinfo.star).toFixed(2)
                        bpm = Number(detail.bpm).toFixed(0)
                        var key = Number(mapinfo.cs).toFixed(0)
                        var od = Number(mapinfo.od).toFixed(2)
                        var hp = Number(mapinfo.hp).toFixed(2)
                        time = `${Math.floor(totallength / 60)}:${('0' + (totallength - Math.floor(totallength / 60) * 60)).slice(-2)}`
                        mapdetail = `**Keys:** ${key} / **OD:** ${od} / **HP:** ${hp}`
                        ppdetail = `**700k**-${Number(score700k).toFixed(2)}pp | **800k**-${Number(score800k).toFixed(2)}pp | **900k**-${Number(score900k).toFixed(2)}pp | **1m**-${Number(score1m).toFixed(2)}pp`
                    }
                    cache_beatmap_ID(beatmapid, modename)
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`${map.title} by ${map.creator}`,'',`https://osu.ppy.sh/b/${beatmapid[i]}?m=${mode}`)
                    .setThumbnail(`https://b.ppy.sh/thumb/${map.beatmapsetID}l.jpg`)
                    .setColor(embedcolor)
                    .setDescription(`
**Length:** ${time} **BPM:** ${bpm} **Mods:** ${mods[i].toUpperCase()}
**Download:** [map](https://osu.ppy.sh/d/${map.beatmapsetID}) ([no vid](https://osu.ppy.sh/d/${map.beatmapsetID}n))
<:difficultyIcon:507522545759682561> __${map.diff}__  
**Difficulty:** ${star}★ ${diffdetail}
**Max Combo:** ${maxCombo}
${mapdetail}
**PP:** ${ppdetail}`)
                message.channel.send({embed});
                }
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        async function osubeatmapdetail() {
            try {
                var file = message.attachments.first().url
                var parser = new calc.parser()
                var fmap = await request.get(file)
                parser.feed(fmap)
                var map = parser.map
                var mode = map.mode
                var maxCombo = map.max_combo()
                // Mods
                var bitpresent = 0
                var mods = []
                var modintext = msg.split(' ')
                if (modintext[0] == undefined) {
                    mods.push('No Mod')
                } else {
                    mods.push(modintext[0])
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
                var diffdetail = ''
                var mapdetail = ''
                var ppdetail = ''
                var star, bpm
                if (mode == 0) {
                    var acc95 = osu_pp_calculator(parser,bitpresent,maxCombo,0,0,0,95,'acc')
                    var acc97 = osu_pp_calculator(parser,bitpresent,maxCombo,0,0,0,97,'acc')
                    var acc99 = osu_pp_calculator(parser,bitpresent,maxCombo,0,0,0,99,'acc')
                    var acc100 = osu_pp_calculator(parser,bitpresent,maxCombo,0,0,0,100,'acc')
                    var detail = beatmap_detail(mods[i],0,0,acc100.bpm,acc100.cs, acc100.ar,acc100.od,acc100.hp)
                    star = Number(acc100.star.total).toFixed(2)
                    bpm = Number(detail.bpm).toFixed(0)
                    var ar = Number(detail.ar).toFixed(2)
                    var od = Number(detail.od).toFixed(2)
                    var hp = Number(detail.hp).toFixed(2)
                    var cs = Number(detail.cs).toFixed(2)
                    diffdetail = `(Aim: ${Number(acc100.star.aim).toFixed(2) * 2}★, Speed: ${Number(acc100.star.speed).toFixed(2) * 2}★)`
                    mapdetail = `**AR:** ${ar} / **OD:** ${od} / **HP:** ${hp} / **CS:** ${cs}`
                    ppdetail = `**95%**-${Number(acc95.pp.total).toFixed(2)}pp | **97%**-${Number(acc97.pp.total).toFixed(2)}pp | **99%**-${Number(acc99.pp.total).toFixed(2)}pp | **100%**-${Number(acc100.pp.total).toFixed(2)}pp`
                }
                const embed = new Discord.RichEmbed()
                .setAuthor(`${map.title} by ${map.creator}`)
                .setColor(embedcolor)
                .setDescription(`
**BPM:** ${bpm} **Mods:** ${mods[i].toUpperCase()}
<:difficultyIcon:507522545759682561> __${map.version}__  
**Difficulty:** ${star}★ ${diffdetail}
**Max Combo:** ${maxCombo}
${mapdetail}
**PP:** ${ppdetail}`)
            message.channel.send({embed});
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        async function calculateplay() {
            try {
                if (cooldown[message.author.id] !== undefined && cooldown[message.author.id].indexOf(command) !== -1) {
                    throw 'You need to wait 3 seconds before using this again!'
                }
                set_Command_cooldown(command, 3000)
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
                cacheBeatmapID(beatmapid, 'Standard')
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

        function acccalc() {
            var option = msg.split(" ")
            var count300 = Number(option[1])
            var count100 = Number(option[2])
            var count50 = Number(option[3])
            var countmiss = Number(option[4])
            var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
            message.channel.send(`**Accuracy:** ${acc}%`)

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
                    for (var i = 0; i < osu_track.length; i++) {
                        if (osu_track[i].osuname == name) {
                            detected = true
                            if (osu_track[i].trackonchannel.includes(message.channel.id) == true) {
                                osu_track[i].osuname = name
                                osu_track[i].top50pp = best[49][0].pp
                                osu_track[i].lasttotalpp = user.pp.raw
                                osu_track[i].lastrank = user.pp.rank
                                osu_track[i].lastcountryrank = user.pp.countryRank
                                break
                            } else {
                                osu_track[i].osuname = name
                                osu_track[i].top50pp = best[49][0].pp
                                osu_track[i].lasttotalpp = user.pp.raw
                                osu_track[i].lastrank = user.pp.rank
                                osu_track[i].lastcountryrank = user.pp.countryRank
                                osu_track[i].trackonchannel.push(message.channel.id)
                                break
                            }
                        }
                    }
                    if (detected == false) {
                        osu_track.push({"osuname":name,"top50pp":best[49][0].pp,"lasttotalpp":user.pp.raw,"lastrank":user.pp.rank,"lastcountryrank":user.pp.countryRank,"trackonchannel": [message.channel.id],"recenttimeplay": ""})
                    }
                    message.channel.send(`**${name}** is now being tracked on **#${message.channel.name}**`)
                    fs.writeFileSync('track.txt', JSON.stringify(osu_track))
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
                for (var i = 0; i < osu_track.length; i++) {
                    if (osu_track[i].osuname == message.content.substring(9)) {
                        if (osu_track[i].trackonchannel.includes(message.channel.id) == true && osu_track[i].trackonchannel.length > 1) {
                            osu_track[i].trackonchannel.splice(osu_track[i].trackonchannel.indexOf(message.channel.id), 1)
                            message.channel.send(`**${message.content.substring(9)}** has been removed from #${message.channel.name}`)
                            fs.writeFileSync('track.txt', JSON.stringify(osu_track))
                            bot.channels.get('497302830558871552').send({files: [{
                                attachment: './track.txt',
                                name: 'track.txt'
                            }]})
                            break
                        } else {
                            osu_track.splice(i,1)
                            if (Object.keys(osu_track).length < 1) {
                                osu_track['a'] = 'a'
                            }
                            message.channel.send(`**${message.content.substring(9)}** has been removed from #${message.channel.name}`)
                            fs.writeFileSync('track.txt', JSON.stringify(osu_track))
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
            for (var i = 0; i < osu_track.length; i++) {
                if (osu_track[i].trackonchannel.includes(message.channel.id) == true) {
                    currentlytrack += "``" + osu_track[i].osuname + "`` "
                }
            }
            const embed = new Discord.RichEmbed()
            .setAuthor(`Player(s) currently being tracked on #${message.channel.name}`)
            .setColor(embedcolor)
            .setDescription(currentlytrack)
            message.channel.send(embed)
        }

        // Other server (Akatsuki, Ripple) Function

        function getServerLink(mode) {
            if (mode == 4) {
                return 'ripple.moe'
            } else if (mode == 8 || mode == 12) {
                return 'akatsuki.pw'
            }
        }

        async function otherserveravatar(start, mode) {
            var serverlink = getServerLink(mode)
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

        async function otherserverosu(mode) {
            try {
                if (cooldown[message.author.id] !== undefined && cooldown[message.author.id].indexOf(command) !== -1) {
                    throw 'You need to wait 3 seconds before using this again!'
                }
                set_Command_cooldown(command, 3000)
                var check = ''
                var option = ''
                var quote = false
                // Split name and arg
                if (msg.includes('"')) {
                    quote = true
                    option = msg.split('"')
                    check = option[1]
                    option = msg.split(" ")
                } else {
                    option = msg.split(" ")
                }
                // Find name and arg
                var a_d = option.indexOf("-d")
                //Get name if there's no quote
                if (quote == false) {
                    var pass = [0, a_d]
                    for (var i = 0; i < pass.length;) {
                        if (pass[i] == -1) {
                            pass.splice(i,1)
                        } else {
                            i++
                        }
                    }
                    pass.sort(function(a,b){return a-b})
                    if (pass[1] > 1) {
                        check = option[1]
                    } else {
                        if (a_d > -1) {
                            check = option[option.indexOf("-d") + 1]
                        } else if (option.length > 1) {
                            check = option[1]
                        }
                        if (check == undefined) {
                            check = ''
                        }
                    }
                }
                var serverlink = getServerLink(mode)
                var name = check_player(check, serverlink)
                var modedetail = get_mode_detail(mode)
                var servername = modedetail.modename
                var servericon = modedetail.modeicon
                if (a_d > -1 && mode !== 12) {
                    var data1 = await request.get(`https://${serverlink}/api/v1/users/scores/best?name=${name}&mode=0&l=50`)
                    var data2 = await request.get(`https://${serverlink}/api/v1/users/full?name=${name}&mode=0`)
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
                        var shortenmod = osu_mods_enum(mod, 'number').shortenmod
                        var count300 = Number(best.scores[i].count_300)
                        var count100 = Number(best.scores[i].count_100)
                        var count50 = Number(best.scores[i].count_50)
                        var countmiss = Number(best.scores[i].count_miss)
                        var scoreacc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                        var parser = await precalc(beatmapid)
                        var thing = osu_pp_calculator(parser,mod,0,0,0,0,0,0)
                        var detail = beatmap_detail(shortenmod,0,0,thing.cs,thing.ar,thing.od,thing.hp)
                        star_avg += thing.star.total
                        aim_avg += thing.star.aim * (Math.pow(detail.cs, 0.1) / Math.pow(4, 0.1))
                        speed_avg += thing.star.speed * 1.1 * (Math.pow(detail.ar, 0.1) / (Math.pow(6, 0.1)))
                        acc_avg += (Math.pow(scoreacc, 2.5)/Math.pow(100, 2.5)) * 1.08 * thing.star.total * (Math.pow(detail.od, 0.03) / (Math.pow(6, 0.03)) * (Math.pow(detail.hp, 0.03) / (Math.pow(6, 0.03))))
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
                } else if (a_d > -1 && mode == 12) {
                    var data1 = await request.get(`https://${serverlink}/api/v1/users/scores/best?name=${name}&mode=0&l=50&rx=1`)
                    var data2 = await request.get(`https://${serverlink}/api/v1/users/rxfull?name=${name}&mode=0`)
                    var best = JSON.parse(data1)
                    var user = JSON.parse(data2)
                    if (best.length == 0) {
                        throw 'Either invalid user or not enough top play to calcuate'
                    }
                    var star_avg = 0
                    var aim_avg = 0
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
                        var shortenmod = osu_mods_enum(mod, 'number').shortenmod
                        var count300 = Number(best.scores[i].count_300)
                        var count100 = Number(best.scores[i].count_100)
                        var count50 = Number(best.scores[i].count_50)
                        var countmiss = Number(best.scores[i].count_miss)
                        var scoreacc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100).toFixed(2)
                        var parser = await precalc(beatmapid)
                        var thing = osu_pp_calculator(parser,mod,0,0,0,0,0,0)
                        var detail = beatmap_detail(shortenmod,0,0,thing.cs,thing.ar,thing.od,thing.hp)
                        star_avg += thing.star.total
                        aim_avg += thing.star.aim * (Math.pow(detail.cs, 0.1) / Math.pow(4, 0.1)) * (Math.pow(detail.ar, 0.1) / Math.pow(9, 0.1))
                        acc_avg += (Math.pow(scoreacc, 5)/Math.pow(100, 5)) * 1.07 * thing.star.total * (Math.pow(detail.od, 0.05) / (Math.pow(9, 0.05)))
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
Aim skill: ${Number(aim_avg/50).toFixed(2) * 2}★
Accuracy skill: ${Number(acc_avg/50).toFixed(2)}★
CS: ${Number(cs_avg/50).toFixed(2)} / AR: ${Number(ar_avg/50).toFixed(2)} / OD: ${Number(od_avg/50).toFixed(2)} / HP: ${Number(hp_avg/50).toFixed(2)}`)
                    message.channel.send({embed});
                } else {
                    var data = ''
                    if (mode == 12) {
                        data = await request.get(`https://${serverlink}/api/v1/users/rxfull?name=${name}&mode=0`)
                    } else {
                        data = await request.get(`https://${serverlink}/api/v1/users/full?name=${name}&mode=0`)
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
                    .setDescription(`
${servericon} **${servername} status for: [${username}](https://${serverlink}/u/${id})**`)
                    .addField('Performance:',`--- **${pp}pp**
**Global Rank:** #${rank} (:flag_${country}:: #${countryrank})
**Accuracy:** ${acc}%
**Play count:** ${played}
**Level:** ${level}
`)
                    .setThumbnail(`https://a.${serverlink}/${id}.png?date=${refresh}`)
                    .setColor(embedcolor)
                    message.channel.send({embed});
                }
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        async function otherserverrecent(mode) {
            try {
                if (cooldown[message.author.id] !== undefined && cooldown[message.author.id].indexOf(command) !== -1) {
                    throw 'You need to wait 3 seconds before using this again!'
                }
                set_Command_cooldown(command, 3000)
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
                var serverlink = getServerLink(mode)
                var linkoption = (mode == 12) ? '&rx=1' : ''
                var name = check_player(check, serverlink)
                var data1 = await request.get(`https://${serverlink}/api/v1/users/scores/recent?name=${name}${linkoption}`)
                var data2 = await request.get(`https://${serverlink}/api/v1/users?name=${name}`)
                var recent = JSON.parse(data1)
                var user = JSON.parse(data2)
                var servername = get_mode_detail(mode).modename
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
                var rank = osu_ranking_letters(letter)
                var bit = recent.scores[0].mods
                var mod = osu_mods_enum(bit, 'number').shortenmod
                var acc = Number(recent.scores[0].accuracy)
                var parser = await precalc(beatmapid)
                var pp = Number(recent.scores[0].pp).toFixed(2)
                var star = 0
                cache_beatmap_ID(beatmapid, servername)
                var fcpp = 0
                var fcacc = 0
                if (mode == 12) {
                    var fccalc = osu_pp_calculator(parser,bit,fc,count100,count50,0,acc,2)
                    fcpp = Number(fccalc.pp.total).toFixed(2)
                    fcacc = fccalc.acc
                    star = Number(fccalc.star.total).toFixed(2)
                } else {
                    var fccalc = osu_pp_calculator(parser,bit,fc,count100,count50,0,acc,1)
                    fcpp = Number(fccalc.pp.total).toFixed(2)
                    fcacc = fccalc.acc
                    star = Number(fccalc.star.total).toFixed(2)
                }
                var fcguess = ``
                var nopp = ''
                if (letter == 'F') {
                    nopp = '(No pp)'
                }
                if (perfect == 0 && linkoption !== '&rx=1') {
                    fcguess = `**${fcpp}pp for ${fcacc}%**`
                }
                const embed = new Discord.RichEmbed()
                .setAuthor(`Most recent ${servername} play for ${username}:`, `https://a.${serverlink}/${userid}.png?date=${refresh}`)
                .setThumbnail(`https://b.ppy.sh/thumb/${beatmapsetid}l.jpg`)
                .setColor(embedcolor)
                .setDescription(`
**[${beatmap}](https://osu.ppy.sh/b/${beatmapid})** (${star}★) ${mod} | ***${pp}pp*** ${nopp}
${rank} **Scores:** ${score} | **Combo:** ${combo}/${fc}
**Accuracy:** ${acc.toFixed(2)}% [${count300}/${count100}/${count50}/${countmiss}] ${fcguess}`)
                message.channel.send({embed})
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        async function otherservertop(mode) {
            try{
                if (cooldown[message.author.id] !== undefined && cooldown[message.author.id].indexOf(command) !== -1) {
                    throw 'You need to wait 3 seconds before using this again!'
                }
                set_Command_cooldown(command, 3000)
                var check = ''
                var top = ''
                var option = ''
                var quote = false
                // Split name and arg
                if (msg.includes('"')) {
                    quote = true
                    option = msg.split('"')
                    check = option[1]
                    option = msg.split(" ")
                } else {
                    option = msg.split(" ")
                }
                // Find name and arg
                var a_p = option.indexOf("-p")
                var a_m = option.indexOf("-m")
                //Check if there is more than 1 argument
                var findarg = [a_p, a_m]
                var find = false
                for (var i = 0; i < findarg.length; i++) {
                    if (findarg[i] > -1) {
                        if (find == false) {
                            find = true
                        } else {
                            throw 'Only one argument please!'
                        }
                    }
                }
                //Get name if there's no quote
                if (quote == false) {
                    var pass = [0, a_p, a_m]
                    for (var i = 0; i < pass.length;) {
                        if (pass[i] == -1) {
                            pass.splice(i,1)
                        } else {
                            i++
                        }
                    }
                    pass.sort(function(a,b){return a-b})
                    if (pass[1] > 1) {
                        check = option[1]
                    } else {
                        if (a_p > -1) {
                            check = option[option.indexOf("-p") + 2]
                        } else if (a_m > -1) {
                            check = option[option.indexOf("-m") + 2]
                        } else if (option.length > 1) {
                            check = option[1]
                        }
                        if (check == undefined) {
                            check = ''
                        }
                    }
                }
                var serverlink = getServerLink(mode)
                var linkoption = (mode == 12) ? '&rx=1' : ''
                var name = check_player(check, serverlink)
                var servername = get_mode_detail(mode).modename
                if (a_p > -1) {
                    var n = Number(option[option.indexOf('-p') + 1]) - 1
                    var data1 = await request.get(`https://${serverlink}/api/v1/users/scores/best?name=${name}&mode=0&l=${n+1}${linkoption}`)
                    var data2 = await request.get(`https://${serverlink}/api/v1/users?name=${name}`)
                    var best = JSON.parse(data1)
                    var user = JSON.parse(data2)
                    var userid = user.id
                    var username = user.username
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
                    var rank = osu_ranking_letters(letter)
                    var pp = Number(best.scores[n].pp).toFixed(2)
                    var mod = best.scores[n].mods
                    var shortenmod = mods(mod, 'number').shortenmod
                    var date = time_played(best.scores[n].time)
                    cache_beatmap_ID(beatmapid, servername)
                    var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100)
                    var parser = await precalc(beatmapid)
                    var fccalc = osu_pp_calculator(parser,mod,fc,count100,count50,0,acc,1)
                    var fcpp = Number(fccalc.pp.total).toFixed(2)
                    var fcacc = fccalc.acc
                    var fcguess = ``
                    if (perfect == 0 && linkoption !== '&rx=1') {
                        fcguess = `**${fcpp}pp for ${fcacc}%**`
                    }
                    var star = Number(fccalc.star.total).toFixed(2)
                    top += `
${n+1}. **[${title}](https://osu.ppy.sh/b/${beatmapid})** (${star}★) ${shortenmod} | ***${pp}pp***
${rank} **Scores**: ${score} | **Combo:** ${combo}/${fc}
**Accuracy:** ${acc.toFixed(2)}% [${count300}/${count100}/${count50}/${countmiss}] ${fcguess}
${date}
`
                const embed = new Discord.RichEmbed()
                .setAuthor(`Top ${servername} Plays for ${username}`)
                .setThumbnail(`http://a.${serverlink}/${userid}.png?date=${refresh}`)
                .setColor(embedcolor)
                .setDescription(top)
                message.channel.send({embed});
                } else if (a_m > -1) {
                    var mod = 0
                    var getmod = option[option.indexOf('-m') + 1]
                    var definemod = {
                        nf: 1,
                        ez: 2,
                        td: 4,
                        hd: 8,
                        hr: 16,
                        sd: 32,
                        dt: 64,
                        rx: 128,
                        ht: 256,
                        nc: 512,
                        fl: 1024,
                        so: 4096,
                        nomod: 0
                    }
                    for (var i = 0; i < getmod.length; i=i+2) {
                        if (definemod[getmod.substring(i, i+2)]) {
                            mod += definemod[getmod.substring(i, i+2)]
                        }
                        if (getmod == 'nomod') {
                            mod += definemod['nomod']
                            break
                        }
                    }
                    var data1 = await request.get(`https://${serverlink}/api/v1/users/scores/best?name=${name}&mode=0&l=100${linkoption}`)
                    var data2 = await request.get(`https://${serverlink}/api/v1/users?name=${name}`)
                    var best = JSON.parse(data1)
                    var user = JSON.parse(data2)
                    var checktop = 0
                    var userid = user.id
                    var username = user.username
                    for (var i = 0; i < best.scores.length; i++) {
                        var bestmod = best.scores[i].mods
                        var match = false
                        if (mod == 0) {
                            if (bestmod == 0){
                                match = true
                            } else {match = false}
                        } else {
                            if (bestmod == mod){
                                match = true
                            } else {match = false}
                        }
                        if (match == true && checktop < 5) {
                            checktop += 1
                            var title = best.scores[i].beatmap.song_name
                            var beatmapid = best.scores[i].beatmap.beatmap_id
                            var score = best.scores[i].score
                            var count300 = Number(best.scores[i].count_300)
                            var count100 = Number(best.scores[i].count_100)
                            var count50 = Number(best.scores[i].count_50)
                            var countmiss = Number(best.scores[i].count_miss)
                            var perfect = best.scores[i].full_combo
                            var combo = best.scores[i].max_combo
                            var fc = best.scores[i].beatmap.max_combo
                            var letter = best.scores[i].rank
                            var rank = osu_ranking_letters(letter)
                            var pp = Number(best.scores[i].pp).toFixed(2)
                            var mod = best.scores[i].mods
                            var shortenmod = osu_mods_enum(mod, 'number').shortenmod
                            var date = time_played(best.scores[i].time)
                            cache_beatmap_ID(beatmapid, servername)
                            var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100)
                            var parser = await precalc(beatmapid)
                            var fccalc = osu_pp_calculator(parser,mod,fc,count100,count50,0,acc,1)
                            var fcpp = Number(fccalc.pp.total).toFixed(2)
                            var fcacc = fccalc.acc
                            var fcguess = ``
                            if (perfect == 0 && linkoption !== '&rx=1') {
                                fcguess = `**${fcpp}pp for ${fcacc}%**`
                            }
                            var star = Number(fccalc.star.total).toFixed(2)
                            top += `
${i+1}. **[${title}](https://osu.ppy.sh/b/${beatmapid})** (${star}★) ${shortenmod} | ***${pp}pp***
${rank} **Scores**: ${score} | **Combo:** ${combo}/${fc}
**Accuracy:** ${acc.toFixed(2)}% [${count300}/${count100}/${count50}/${countmiss}] ${fcguess}
${date}
`
                        }
                    }
                    if (top.length == 0) {
                        top += `This user doesn't have any ${getmod.toUpperCase()} top play`
                    }
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`Top ${servername} Standard Plays with ${getmod.toUpperCase()} for ${username}`)
                    .setThumbnail(`http://a.${serverlink}/${userid}.png?date=${refresh}`)
                    .setColor(embedcolor)
                    .setDescription(top)
                    message.channel.send({embed});
                } else {
                    var data1 = await request.get(`https://${serverlink}/api/v1/users/scores/best?name=${name}&mode=0&l=5${linkoption}`)
                    var data2 = await request.get(`https://${serverlink}/api/v1/users?name=${name}`)
                    var best = JSON.parse(data1)
                    var user = JSON.parse(data2)
                    var userid = user.id
                    var username = user.username
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
                        var rank = osu_ranking_letters(letter)
                        var pp = Number(best.scores[i].pp).toFixed(2)
                        var mod = best.scores[i].mods
                        var shortenmod = osu_mods_enum(mod, 'number').shortenmod
                        var date = time_played(best.scores[i].time)
                        cache_beatmap_ID(beatmapid, servername)
                        var acc = Number((300 * count300 + 100 * count100 + 50 * count50) / (300 * (count300 + count100 + count50 + countmiss)) * 100)
                        var parser = await precalc(beatmapid)
                        var fccalc = osu_pp_calculator(parser,mod,fc,count100,count50,0,acc,1)
                        var fcpp = Number(fccalc.pp.total).toFixed(2)
                        var fcacc = fccalc.acc
                        var fcguess = ``
                        if (perfect == 0 && linkoption !== '&rx=1') {
                            fcguess = `**${fcpp}pp for ${fcacc}%**`
                        }
                        var star = Number(fccalc.star.total).toFixed(2)
                        top += `
${i+1}. **[${title}](https://osu.ppy.sh/b/${beatmapid})** (${star}★) ${shortenmod} | ***${pp}pp***
${rank} **Scores**: ${score} | **Combo:** ${combo}/${fc}
**Accuracy:** ${acc.toFixed(2)}% [${count300}/${count100}/${count50}/${countmiss}] ${fcguess}
${date}
`                   }
                    const embed = new Discord.RichEmbed()
                    .setAuthor(`Top ${servername} Plays for ${username}`)
                    .setThumbnail(`http://a.${serverlink}/${userid}.png?date=${refresh}`)
                    .setColor(embedcolor)
                    .setDescription(top)
                    message.channel.send({embed});
                }
            } catch (error) {
                message.channel.send(String(error))
            }
        }

        async function calculaterxplay() {
            try {
                if (cooldown[message.author.id] !== undefined && cooldown[message.author.id].indexOf(command) !== -1) {
                    throw 'You need to wait 3 seconds before using this again!'
                }
                set_Command_cooldown(command, 3000)
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
                var calc = ppcalc(parser,bitpresent,combo,0,0,miss,acc,2)
                var beatmapidfixed = map[0].beatmapSetId
                var title = map[0].title
                var mapper = map[0].creator
                var version = map[0].version
                cache_beatmap_ID(beatmapid, 'Standard')
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

        // Osu

        if (command == bot_prefix + 'osu') {
            osu(0)
        }
        if (command == bot_prefix + 'taiko') {
            osu(1)
        }
        if (command == bot_prefix + 'ctb') {
            osu(2)
        }
        if (command == bot_prefix + 'mania') {
            osu(3)
        }
        if (command == bot_prefix + 'osusig') {
            osusig()
        }
        if (command == bot_prefix + 'osuavatar') {
            osuavatar()
        }
        if (command == bot_prefix + 'topglobal') {
            topleaderboard('global')
        }
        if (command == bot_prefix + 'topcountry') {
            topleaderboard('country')
        }
        if (command == bot_prefix + 'lb' || command == bot_prefix + 'leaderboard') {
            serverleaderboard()
        }
        if (command == bot_prefix + 'recent' || command == bot_prefix + 'r') {
            recent()
        }
        if (command == bot_prefix + 'compare' || command == bot_prefix + 'c') {
            compare()
        }
        if (command == bot_prefix + 'osutop') {
            osutop(0)
        }
        if (command == bot_prefix + 'taikotop') {
            osutop(1)
        }
        if (command == bot_prefix + 'ctbtop') {
            osutop(2)
        }
        if (command == bot_prefix + 'maniatop') {
            osutop(3)
        }
        if (command == bot_prefix + 'map' || command == bot_prefix + 'm') {
            map()
        }
        if (command == bot_prefix + 'scores') {
            osuscore()
        }
        if (command == bot_prefix + 'osuset') {
            osuset('Osu')
        }
        if (command == bot_prefix + 'calcpp') {
            calculateplay()
        }
        if (command == bot_prefix + 'acc') {
            acccalc()
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

        if (command == bot_prefix + 'akatavatar') {
            otherserveravatar(12,8)
        }
        if (command == bot_prefix + 'akatsuki') {
            otherserverosu(8)
        }
        if (command == bot_prefix + 'akatr') {
            otherserverrecent(8)
        }
        if (command == bot_prefix + 'akattop') {
            otherservertop(8)
        }
        if (command == bot_prefix + 'akatsukiset') {
            osuset('Akatsuki')
        }
        if (command == bot_prefix + 'rxakatsuki') {
            otherserverosu(12)
        }
        if (command == bot_prefix + 'rxakatr') {
            otherserverrecent(12)
        }
        if (command == bot_prefix + 'rxakattop') {
            otherservertop(12)
        }
        if (command == bot_prefix + 'rxcalcpp') {
            calculaterxplay()
        }

        // Ripple

        if (command == bot_prefix + 'rippleavatar') {
            otherserveravatar(14,4)
        }
        if (command == bot_prefix + 'ripple') {
            otherserverosu(4)
        }
        if (command == bot_prefix + 'rippler') {
            otherserverrecent(4)
        }
        if (command == bot_prefix + 'rippletop') {
            otherservertop(4)
        }
        if (command == bot_prefix + 'rippleset') {
            osuset('Ripple')
        }

        // Detection
        // Beatmap Detection
        if (url_command == false) {
            beatmapdetail()
        }
        // .osu Detection
        if (message.attachments.array().length > 0) {
            var file = message.attachments.first()
            if (file.filename.substring(file.filename.length - 4, file.filename.length) == ".osu") {
                osubeatmapdetail()               
            }
        }
        // Bot Owner commands

        if (command == bot_prefix + 'respond' && message.author.id == "292523841811513348") {
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
        if (command == bot_prefix + 'say' && message.author.id == "292523841811513348") {
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
})

bot.login(process.env.BOT_TOKEN);
