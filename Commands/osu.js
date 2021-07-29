const { Message, MessageEmbed, MessageAttachment } = require('discord.js-light')
const error_report = require('../Utils/error')
const svg2img = require('svg2img')
const chartist = require('node-chartist')
const cheerio = require('cheerio')
const jimp = require('jimp')
const text2png = require('text2png')
const superagent = require('superagent')
const config = require('../config')
// Function
const getLocalText = require('../Lang/lang_handler')
const fx = require('../Functions/fx_handler')
// Data
const { measureText } = require('jimp')
const score = require('../Functions/osu/UI/score')
// Database
const mongojs = require('mongojs')
const db = mongojs(process.env.DB_URL, ["user_data_v5", "server_data", "saved_map_id"], {tls: true})
let user_data = {}
let beatmapID_cache = []
//
const check_server_suffix = [{"suffix": "-bancho", "v_count": 0},
                            {"suffix": "-akatsuki", "v_count": 0},
                            {"suffix": "-ripple", "v_count": 0},
                            {"suffix": "-gatari", "v_count": 0},
                            {"suffix": "-enjuu", "v_count": 0},
                            {"suffix": "-horizon", "v_count": 0},
                            {"suffix": "-ainu", "v_count": 0},
                            {"suffix": "-datenshi", "v_count": 0},
                            {"suffix": "-ezppfarm", "v_count": 0},
                            {"suffix": "-kurikku", "v_count": 0}]
const check_mode_suffix = [{"suffix": "-std", "v_count": 0},
                            {"suffix": "-taiko", "v_count": 0},
                            {"suffix": "-ctb", "v_count": 0},
                            {"suffix": "-mania", "v_count": 0},
                            {"suffix": "-rx", "v_count": 0},]

// Sync db
function sync_user_data_db({name, check_type, user_id}) {
    if (user_data[user_id]) {
        user_data[user_id].name[check_type] = name
    } else {
        user_data[user_id] = {
            name: {

            }
        }
        user_data[user_id].name[check_type] = name
    }
}

function sync_saved_beatmap_db({mode, beatmap_id, channel_id, type}) {
    for (let i = 0; i < beatmapID_cache.length; i++) {
        if (beatmapID_cache[i].channel == channel_id) {
            beatmapID_cache.splice(i, 1)
            i--
        }
    }
    beatmapID_cache.push({beatmap_id: beatmap_id, channel: channel_id, mode: mode, type: type})
}
//

/** 
 * @param {{message: Message}} 
 */
function cache_beatmap_ID({message, beatmap_id, mode, track = false, channel_id}) {
    let sync_db_value = {
        mode: mode,
        beatmap_id: beatmap_id,
        channel_id: (!channel_id) ? message.channel.id : channel_id,
        type: (message.guild !== null || track) ? 'server' : 'user',
        proc_id: process.env.PROCESS_ID
    }
    let type = (message.guild !== null || track) ? 'server' : 'user'
    if (!channel_id) channel_id = message.channel.id
    for (let i = 0; i < beatmapID_cache.length; i++) {
        if (beatmapID_cache[i].channel == channel_id) {
            beatmapID_cache.splice(i, 1)
            i--
        }
    }
    beatmapID_cache.push({beatmap_id: beatmap_id, channel: channel_id, mode: mode, type: type})
    process.send({send_type: "db", cmd: "saved_beatmap", value: sync_db_value})
    if (!config.config.debug.disable_db_save) db.saved_map_id.findAndModify({query: {}, update: {'0': beatmapID_cache}}, function(){})
}

function push_db({user, saved_map_id}) {
    user_data = user
    beatmapID_cache = saved_map_id
}

function set_mode({suffix, a_mode = undefined, default_a_mode = 'std', default_check_type = 'bancho'}) {
    if (!a_mode) {
        a_mode = check_mode_suffix.find(m => suffix?.[m.suffix])?.suffix
        a_mode = (a_mode) ? a_mode.replace('-', '') : default_a_mode
    }
    let check_type = check_server_suffix.find(s => suffix?.[s.suffix])?.suffix
    check_type = (check_type) ? check_type.replace('-', '') : default_check_type
    return `${check_type}-${a_mode}`
}

/** 
 * @param {{message: Message}} 
 */
async function osu_ts({message, embed_color, refresh, name, mode, skill, skill_name}) {
    let {modename, modenum} = fx.osu.get_mode_detail({mode: mode})
    let user = await fx.osu.api.get_profile({name: name, mode: mode, ver: 1})
    if (!user) {
        message.channel.send(error_report({type: 'custom', err_message: errorLocalText.osu.player_null}))
        return
    }
    let best = await fx.osu.api.get_top({name: name, mode: mode, limit: 50, type: 'best'})
    if (best.length < 50) {
        throw "You don't have enough plays to calculate skill (Atleast 50 top plays)"
    }
    let msg1 = await message.channel.send('Calculating skills...')
    let {calc_count} = await fx.osu.calc_player_skill({best: best, modenum: modenum})
    best = best.filter(a => a[skill])
    best.sort((a,b) => b[skill] - a[skill])
    // Page function
    async function load_page({page}) {
        let desc = ''
        let start = (page - 1) * 5
        for (let i = start; i < start + 5; i++) {
            if (!best[i]) break
            let overlay = `${i+1}. **[${best[i].title}](https://osu.ppy.sh/b/${best[i].id})** (${Number(best[i].star_skill).toFixed(2)}★) ${best[i].mod_text}
${best[i].rank_icon} *${best[i].diff}* ◆ **Acc:** ${Number(best[i].acc).toFixed(2)}%
\`${skill_name.charAt(0).toUpperCase() + skill_name.slice(1)}: ${Number(best[i][skill]).toFixed(2)}★\`\n\n`
            desc += overlay
        }
        return desc
    }

    if (calc_count == 50) msg1.delete()
    else msg1.edit(`**Some top play(s) have missing info, some numbers on the embed may not be accurate. Calculated top play: ${calc_count}/50**`);
    let {pfp_link} = fx.osu.get_profile_link({id: user.id, mode: mode, refresh: refresh})
    const embed = new MessageEmbed()
    .setAuthor(`osu!${modename} top ${skill_name} for: ${user.username}`)
    .setThumbnail(pfp_link)
    .setColor(embed_color)
    .setFooter(`{page}`);
    fx.general.page_system({message: message, embed: embed, update_func: load_page,
                            max_duration: Math.ceil(best.length / 5) * 30000, max_page: Math.ceil(best.length / 5)})
}

/** 
 * @param {{message: Message}} 
 */
async function osuavatar({message, embed_color, refresh, lang, prefix}) {
    let msg = message.content.toLowerCase();
    let command = msg.split(' ')[0]
    if (fx.general.cmd_cooldown.cooldown[message.author.id] !== undefined && fx.general.cmd_cooldown.cooldown[message.author.id].indexOf(command) !== -1) {
        message.channel.send(error_report({type: 'custom', err_message: 'You need to wait 5 seconds before using this again!'}))
        return;
    }
    fx.general.cmd_cooldown.set({message: message, cmd: command, time: 5000})
    let suffix = fx.general.check_suffix({check_msg: msg, two_arg: false, suffix: check_server_suffix})
    // Set the correct mode
    let mode = set_mode({suffix: suffix, a_mode: 'std'})
    let {check_type} = fx.osu.get_mode_detail({mode: mode})
    //
    let name = fx.osu.check_player({user_data: user_data, message: message, name: suffix.check, type: check_type, 
                                    prefix: prefix, lang: lang})
    
    // Get Information
    let user = await fx.osu.api.get_profile({name: name, mode: mode, ver: 1})
    let {pfp_link} = fx.osu.get_profile_link({id: user.id, mode: mode, refresh: refresh})
    const embed = new MessageEmbed()
    .setAuthor(`Avatar for ${user.username}`)
    .setColor(embed_color)
    .setImage(pfp_link);
    message.channel.send({embed})
}

/** 
 * @param {{message: Message}} 
 */
async function osu({message, embed_color, refresh, a_mode, lang, prefix}) {
    try {
        let msg = message.content.toLowerCase()
        let command = msg.split(' ')[0]
        if (fx.general.cmd_cooldown.cooldown[message.author.id] !== undefined && fx.general.cmd_cooldown.cooldown[message.author.id].indexOf(command) !== -1) {
            message.channel.send(error_report({type: 'custom', err_message: 'You need to wait 3 seconds before using this again!'}))
            return;
        }
        fx.general.cmd_cooldown.set({message: message, cmd: command, time: 3000})
        const errorLocalText = getLocalText({lang: lang}).errors
        let suffix = fx.general.check_suffix({check_msg: msg, two_arg: true, 
                                            suffix: [{"suffix": "-d", "v_count": 0},
                                                    {"suffix": "-rank", "v_count": 1},
                                                    {"suffix": "-ts", "v_count": 0},
                                                    {"suffix": "-accts", "v_count": 0},
                                                    {"suffix": "-speedts", "v_count": 0},
                                                    {"suffix": "-aimts", "v_count": 0},
                                                    {"suffix": "-fcts", "v_count": 0},
                                                    {"suffix": "-g", "v_count": 0},
                                                    ...check_server_suffix]})
        // Set the correct mode
        let mode = set_mode({suffix: suffix, a_mode : a_mode})
        //
        let {modename, modeicon, modenum, check_type} = fx.osu.get_mode_detail({mode: mode})
        let name = fx.osu.check_player({user_data: user_data, message: message, name: suffix.check, type: check_type, 
                                        prefix: prefix, lang: lang})
        if (!name) return
        if (suffix["-d"]) {
            let user = await fx.osu.api.get_profile({name: name, mode: mode, ver: 2})
            if (!user) {
                message.channel.send(error_report({type: 'custom', err_message: errorLocalText.osu.player_null}))
                return
            }
            let {pfp_link, profile_link} = fx.osu.get_profile_link({id: user.id, mode: mode, refresh: refresh})
            let localText = getLocalText({lang: lang}).osu.profile
            let verified = (user.discord_tag == message.author.tag) ? fx.general.get_icon({type: "osu_verified"}) : ''
            let desc = `${modeicon}${verified} **Detailed statistic of [${user.username}](${profile_link})**`
            desc += (user.prev_username.length) ? `\n${localText.prev_username}: ${user.prev_username.join(', ')}` : ''
            desc += (user.playstyle.length) ? `\n${localText.play_style}: ${user.playstyle.join(', ')}` : ''
            let field1 = `**${localText.global_rank}:** #${user.global_rank}`
            field1 += (user.country_rank) ? ` (:flag_${user.country_code}:: #${user.country_rank})` : ''
            field1 += ` • **${user.pp}pp**\n`
            field1 += `**${localText.lvl}:** ${user.level}\n**${localText.acc}:** ${user.acc}%\n**${localText.play_count}:** ${user.playcount.toLocaleString('en')}\n`
            field1 += `**${localText.ranked_score}:** ${user.ranked_score.toLocaleString('en')} • **${localText.total_score}:** ${user.total_score.toLocaleString('en')}\n`
            let total_count_rank = user.count_ssh + user.count_ss + user.count_sh + user.count_s + user.count_a
            field1 += `${fx.general.get_icon({type: "rank_SSH"})}: ${user.count_ssh.toLocaleString('en')} (${(user.count_ssh/total_count_rank*100).toFixed(2)}%) • `
            field1 += `${fx.general.get_icon({type: "rank_SS"})}: ${user.count_ss.toLocaleString('en')} (${(user.count_ss/total_count_rank*100).toFixed(2)}%)\n`
            field1 += `${fx.general.get_icon({type: "rank_SH"})}: ${user.count_sh.toLocaleString('en')} (${(user.count_sh/total_count_rank*100).toFixed(2)}%) • `
            field1 += `${fx.general.get_icon({type: "rank_S"})}: ${user.count_s.toLocaleString('en')} (${(user.count_s/total_count_rank*100).toFixed(2)}%)\n`
            field1 += `${fx.general.get_icon({type: "rank_A"})}: ${user.count_a.toLocaleString('en')} (${(user.count_a/total_count_rank*100).toFixed(2)}%)`
            // Rank history image
            const g_options = 
            {width: 800, height: 222, 
            axisX: {offset: 0, showGrid: false},
            axisY: {offset: 40, scaleMinSpace: 44, labelOffset: {x: 0, y: -5}, 
                    onlyInteger: true, labelInterpolationFnc: (value, i) => {return -value}},
            chartPadding: {top: 35, right: 40, bottom: 35, left: 0}};
            const g_data = {labels: [], series: [user.rank_history.map(r => r * -1)]}
            let g_graph = await chartist('line', g_options, g_data)
            // SVG to HTML
            let graph = cheerio.load(g_graph)
            graph('.ct-series path').attr('style', 'stroke: rgb(255,0,255); stroke-width: 3; fill: none')
            graph('.ct-grids').attr('style', 'stroke: white; stroke-width: 2')
            graph('text').attr('style', 'font-family: Arial; font-size: 24px; font-weight: normal; fill: white;')
            graph('.ct-chart .ct-legend').remove()
            // HTML to PNG and composite the image
            let svg = new Buffer.from(graph('.ct-chart').html())
            async function convert() {
                return new Promise(resolve => {
                    svg2img(svg, (err, buffer) => resolve(buffer))
                })
            }
            svg = await convert()
            let graph_img = await jimp.read(svg)
            let cover_img = await jimp.read(user.cover_url)
            if (cover_img.getHeight()/cover_img.getWidth()<0.2775) cover_img.resize(jimp.AUTO, 222)
            else cover_img.resize(800, jimp.AUTO);
            cover_img.crop(0,0,800,222).brightness(-0.5).blur(5)
            cover_img.composite(graph_img, 0, 0)
            const attachment = new MessageAttachment(await cover_img.getBufferAsync(jimp.MIME_PNG), 'rank.png')
            // Embed
            const embed = new MessageEmbed()
            .setDescription(desc)
            .setColor(embed_color)
            .addField(`${localText.performance}:`, field1)
            .setThumbnail(pfp_link)
            .attachFiles([attachment])
            .setImage('attachment://rank.png')
            message.channel.send({embed})
        } else if (suffix["-ts"]) { 
            let user = await fx.osu.api.get_profile({name: name, mode: mode, ver: 1})
            if (!user) {
                message.channel.send(error_report({type: 'custom', err_message: errorLocalText.osu.player_null}))
                return
            }
            let best = await fx.osu.api.get_top({name: name, mode: mode, limit: 50, type: 'best'})
            if (best.length < 50) {
                throw "You don't have enough plays to calculate skill (Atleast 50 top plays)"
            }
            let msg1 = await message.channel.send('Calculating skills...')
            let {star_avg, aim_avg, speed_avg, acc_avg, calc_count} = await fx.osu.calc_player_skill({best: best, modenum: modenum})
            let field = []
            function textloading (skill) {
                let text = ''
                let top = best.sort((a,b) => b[skill] - a[skill])
                for (let i = 0; i < 3; i++) {
                    text += `\`${Number(top[i][skill]).toFixed(2)}★\` ${top[i].rank_icon} [${top[i].title} [${top[i].diff}]](https://osu.ppy.sh/b/${top[i].beatmap_id})\n`
                }
                field.push(text)
            }
            textloading('star_skill')
            textloading('aim_skill')
            textloading('speed_skill')
            textloading('acc_skill')
            let {profile_link, pfp_link} = fx.osu.get_profile_link({id: user.id, refresh: refresh, mode: mode})
            let aim_field = 'Top aim skill:'
            if (modenum == 3) aim_field = 'Top finger control skill:'
            if (calc_count !== 50) msg1.edit(`**Some top play(s) have missing info, some numbers on the embed may not be accurate. Calculated top play: ${calc_count}/50**`);
            const embed = new MessageEmbed()
            .setDescription(`${modeicon} **Osu!${modename} top skill for: [${user.username}](${profile_link})**`)
            .setThumbnail(pfp_link)
            .addField(`${user.username} average skill:`, `
    Star: \`${Number(star_avg/50).toFixed(2)}★\`
    Aim skill: \`${Number(aim_avg/50).toFixed(2)}★\`
    Speed skill: \`${Number(speed_avg/50).toFixed(2)}★\`
    Accuracy skill: \`${Number(acc_avg/50).toFixed(2)}★\``)
            .addField('Top star skill:', field[0])
            .addField(aim_field, field[1])
            .addField('Top speed skill:', field[2])
            .addField('Top acc skill:', field[3]);
            msg1.edit({embed})
        } else if (suffix["-accts"]) { 
            osu_ts({message: message, embed_color: embed_color, refresh: refresh, name: name, mode: mode,
                    skill: 'acc_skill', skill_name: 'acc skill'})
        } else if (suffix["-speedts"]  && a_mode !== 'ctb') { 
            osu_ts({message: message, embed_color: embed_color, refresh: refresh, name: name, mode: mode,
                    skill: 'speed_skill', skill_name: 'speed skill'})
        } else if (suffix["-aimts"] && (a_mode == 'std' || a_mode == 'ctb')) { 
            osu_ts({message: message, embed_color: embed_color, refresh: refresh, name: name, mode: mode,
                    skill: 'aim_skill', skill_name: 'aim skill'})
        } else if (suffix["-fcts"] && a_mode == 'mania') { 
            osu_ts({message: message, embed_color: embed_color, refresh: refresh, name: name, mode: mode,
                    skill: 'aim_skill', skill_name: 'finger control skill'})
        } else {
            let user = await fx.osu.api.get_profile({name: name, mode: mode, ver: 2})
            if (!user) {
                message.channel.send(error_report({type: 'custom', err_message: errorLocalText.osu.player_null}))
                return
            }
            const embed = fx.osu.ui.profile({mode: mode, refresh: refresh, modeicon: modeicon, embed_color: embed_color,
                                                    modename: modename, lang: lang, user_tag: message.author.tag ,...user})
            message.channel.send({embed})
        }
    } catch (err) {
        message.channel.send(error_report({type: 'normal', err_message: err.stack.toString()}))
    }
}

/** 
 * @param {{message: Message}} 
 */
async function osucard({message, embed_color, refresh, a_mode, lang, prefix}) {
    try {
        const errorLocalText = getLocalText({lang: lang}).errors
        let msg = message.content.toLowerCase()
        let command = msg.split(' ')[0]
        if (fx.general.cmd_cooldown.cooldown[message.author.id] !== undefined && fx.general.cmd_cooldown.cooldown[message.author.id].indexOf(command) !== -1) {
            message.channel.send(error_report({type: 'custom', err_message: 'You need to wait 5 seconds before using this again!'}))
            return;
        }
        fx.general.cmd_cooldown.set({message: message, cmd: command, time: 5000})
        let suffix = fx.general.check_suffix({check_msg: msg, two_arg: false, suffix: check_server_suffix})
        // Set the correct mode
        let mode = set_mode({suffix: suffix, a_mode: a_mode})
        //
        let {modenum, check_type} = fx.osu.get_mode_detail({mode: mode})
        let name = fx.osu.check_player({user_data: user_data, message: message, name: suffix.check, type: check_type, 
                                        prefix: prefix, lang: lang})
        if (a_mode == 'rx') {
            message.channel.send(error_report({type: 'custom', err_message: errorLocalText.osu.relax_err}))
            return
        }
        let user = await fx.osu.api.get_profile({name: name, mode: mode, event: 0, ver: 1})
        if (!user) {
            message.channel.send(error_report({type: 'custom', err_message: errorLocalText.osu.player_null}))
            return
        }
        let best = await fx.osu.api.get_top({name: name, mode: mode, limit: 50, type: 'best'})
        if (best.length < 50) {
            message.channel.send(error_report({type: 'custom', err_message: "You don't have enough plays to calculate skill (Atleast 50 top plays)"}))
            return
        }
        let msg1 = await message.channel.send('Calculating skills...');
        let {star_avg, aim_avg, speed_avg, acc_avg,
            finger_control_avg, calc_count} = await fx.osu.calc_player_skill({best: best, modenum: modenum})
        star_avg = Number(star_avg / calc_count)
        aim_avg = Number(aim_avg / calc_count * 100).toFixed(0)
        speed_avg = Number(speed_avg / calc_count * 100).toFixed(0)
        acc_avg = Number(acc_avg / calc_count * 100).toFixed(0)
        finger_control_avg = Number(finger_control_avg/ calc_count * 100).toFixed(0)
        // Process image
        msg1.edit('Processing Image...')
        let card_name = ['common_osu', 'rare_osu', 'elite_osu', 'super_rare_osu', 'ultra_rare_osu', 'master_osu']
        let get_card_name = Number(acc_avg >= 300) + Number(acc_avg >= 525) + Number(acc_avg >= 700) + Number(acc_avg >= 825) + Number(acc_avg >= 900)
        let card;
        // Special card
        let special;
        if (modenum == 0 && check_type == "bancho") {
            let s_player = [39828, 50265, 2558286, 5339515, 4650315]
            for (let i in s_player) {
                if (user.id == s_player[i]) {
                    special = 'normal'
                    card = await jimp.read('./osu_card/card/legendary_osu.png')
                    star_avg = 10
                    break
                }
                if (user.id == 4504101) {
                    special = 'whitecat'
                    card = await jimp.read('./osu_card/card/legendary_osu_whitecat.png')
                    star_avg = 10
                    break
                }
                if (user.id == 124493) {
                    special = 'cookiezi'
                    card = await jimp.read('./osu_card/card/legendary_osu_cookiezi.png')
                    star_avg = 10
                    break
                }
                if (user.id == 6447454) {
                    special = 'merami'
                    card = await jimp.read('./osu_card/card/legendary_osu_merami.png')
                    star_avg = 10
                    break
                }
                if (user.id == 2611813) {
                    special = 'lunpai'
                    card = await jimp.read('./osu_card/card/lunpai.png')
                    break
                }
                if (user.id == 7464885) {
                    special = 'celsea'
                    card = await jimp.read('./osu_card/card/rin.png')
                    break
                }
                if (user.id == 7990747) {
                    special = 'aika_asphyxia'
                    card = await jimp.read('./osu_card/card/aika_asphyxia.png')
                }
                if (user.id == 8926244) {
                    special = 'kahli'
                    card = await jimp.read('./osu_card/card/kahli.png')
                }
            }
            if (special) {
                let multiplier = [1, 1.025, 1.05, 1.075]
                let player_id = [{id: '124493', skill_mul: [3,3,3]}, {id: '39828', skill_mul: [3,1,2]}, 
                                {id: '50265', skill_mul: [2,2,3]}, {id: '2558286', skill_mul: [2,2,1]}, 
                                {id: '5339515', skill_mul: [2,2,1]}, {id: '4650315', skill_mul: [2,2,3]},
                                {id: '4504101', skill_mul: [3,1,1]}, {id: '6447454', skill_mul: [1,3,1]},
                                {id: '2611813', skill_mul: [0,0,0]}, {id: '7464885', skill_mul: [0,0,0]},
                                {id: '7990747', skill_mul: [0,0,0]}, {id: '8926244', skill_mul: [0,0,0]}]
                // Cookiezi, WWW, hvick, Rafis, Mathi, idke, WhiteCar, Merami. Skill_mul order: aim, speed, acc
                let player = player_id.find(p => p.id == user.id)
                aim_avg *= multiplier[player.skill_mul[0]]
                speed_avg *= multiplier[player.skill_mul[1]]
                acc_avg *= multiplier[player.skill_mul[2]]
                aim_avg = aim_avg.toFixed(0)
                speed_avg = speed_avg.toFixed(0)
                acc_avg = acc_avg.toFixed(0)
            }
        }
        if (card == undefined) card = await jimp.read(`./osu_card/card/${card_name[get_card_name]}.png`);
        let {pfp_link} = fx.osu.get_profile_link({id: user.id, refresh: refresh, mode: mode})
        if (special == "lunpai") pfp_link = "https://i.imgur.com/3epazAt.png";
        let pfp = await jimp.read(pfp_link)
        pfp.resize(320,320)
        card.composite(pfp, 40,110)
        // Get mode icon
        const icon_path = './osu_card/icon/'
        const path_suffix = mode.toLowerCase().replace('-', '_') 
        let mode_icon = await jimp.read(`${icon_path}${path_suffix}.png`)
        mode_icon.resize(80,80)
        card.composite(mode_icon, 20, 20)
        // Get username
        let name_color = 'white'
        if (special == 'whitecat') {
            name_color = '#D19D23'
        }
        let local_font = {localFontPath: './font/Somatic.otf', localFontName: 'Somatic'}
        let nametext = await jimp.read(text2png(user.username, {
            color: name_color,
            font: '160px Somatic',
            lineSpacing: 15,
            ...local_font}))
        let nametextw = nametext.getWidth()
        let nametexth = nametext.getHeight()
        let max_name_h = (user.username.search(/[gjpqy]/gm) > -1) ? 35 : 27
        if (nametextw / 220 >= nametexth / max_name_h) {
            nametext.resize(220, jimp.AUTO).quality(100)
        } else {
            nametext.resize(jimp.AUTO, max_name_h).quality(100)
        }
        nametext.contain(220, max_name_h, jimp.HORIZONTAL_ALIGN_CENTER)
        card.composite(nametext, 150, 50)
        // Stat
        function card_stat() {
            let skill_holder = [aim_avg, speed_avg, acc_avg]
            let skill_name_holder = ['Aim', 'Speed', 'Accuracy', 'Finger Control']
            let modenum_skill = [{skill: [0,1,2]}, {skill: [1,2]}, {skill: [0,2]}, {skill: [0,1,2]}]
            let skillname = '', skillnumber = '', stat_number_x = 170;
            for (let num of modenum_skill[modenum].skill) {
                if (modenum == 3 && num == 0) skillname += `${skill_name_holder[3]}:\n`;
                else skillname += `${skill_name_holder[num]}:\n`;
                skillnumber += `${skill_holder[num]}\n`
            }
            if (modenum == 3) {
                stat_number_x = 230
            }
            return {skillname: skillname, skillnumber: skillnumber, stat_number_x: stat_number_x}
        }
        let {skillname, skillnumber, stat_number_x} = card_stat()
        let stat_color = 'white'
        let stat_shadow = {size: 1, opacity: 0.35, x: 2, y: 2, blur: 1}
        if (special == 'kahli') {
            stat_color = '#e0ffff'
            stat_shadow.opacity = 0.75
        }
        let text_line_spacing = 8
        let special_except = ["lunpai", "celsea", "aika_asphyxia", "kahli"]
        if (special && !special_except.includes(special)) {
            skillnumber = `${aim_avg}+\n${speed_avg}+\n${acc_avg}+`
        }
        let stattext = await jimp.read(text2png(skillname, {
            color: stat_color,
            font: '28px Somatic',
            lineSpacing: text_line_spacing,
            textAlign: 'right',
            ...local_font}))
        let stattext_cv = new jimp(stattext.getWidth() * 1.1, stattext.getHeight() * 1.1, 0x00000000)
        stattext_cv.composite(stattext, 0, 0).shadow(stat_shadow)
        card.composite(stattext_cv, 24, 444)
        let statnumber = await jimp.read(text2png(skillnumber, {
            color: stat_color,
            font: '28px Somatic',
            lineSpacing: 15.2,
            textAlign: 'left',
            ...local_font}))
        let statnumber_cv = new jimp(stattext.getWidth() * 1.1, stattext.getHeight() * 1.1, 0x00000000)
        statnumber_cv.composite(statnumber, 0, 0).shadow(stat_shadow)
        card.composite(statnumber_cv, stat_number_x, 444)
        // Star
        let fullstar, halfstar;
        if (special == "lunpai") {
            fullstar = await jimp.read('./osu_card/full_paw.png')   
            halfstar = await jimp.read('./osu_card/half_paw.png')
        } else if (special == "cookiezi") {
            fullstar = await jimp.read('./osu_card/full_chocomint.png')
            halfstar = await jimp.read('./osu_card/half_chocomint.png')
        } else if (special == "aika_asphyxia") {
            fullstar = await jimp.read('./osu_card/aika_asphyxia_full_star.png')
            halfstar = await jimp.read('./osu_card/aika_asphyxia_half_star.png')
        } else if (special == "kahli") {
            fullstar = await jimp.read('./osu_card/full_shooting_star.png')
            halfstar = await jimp.read('./osu_card/half_shooting_star.png')
        } else {
            fullstar = await jimp.read('./osu_card/full_star.png')
            halfstar = await jimp.read('./osu_card/half_star.png')
        }
        let star_width = 32
        let width = (Math.floor(star_avg) + ((star_avg % 1) >= 0.5 ? 1 : 0)) * star_width + 2
        let starholder = await new jimp(width, 33, 0x00000000)
        for (let i = 0; i < Math.ceil(star_avg); i++) {
            if (i+1 > Math.floor(star_avg)) {
                starholder.composite(halfstar, i*star_width, 0)
            } else {
                starholder.composite(fullstar, i*star_width, 0)
            }
        }
        if (special == undefined || special == 'normal') {
            starholder.contain(400,33, jimp.HORIZONTAL_ALIGN_CENTER)
            card.composite(starholder, 10, 551)
        } else {
            starholder.contain(240,27, jimp.HORIZONTAL_ALIGN_CENTER)
            card.composite(starholder, 15, 556)
        }
        
        if (calc_count == 50) msg1.delete()
        else msg1.edit(`**Some top play(s) have missing info, some numbers on the card may not be accurate. Calculated top play: ${calc_count}/50**`);
        message.channel.send({
            files: [{
              attachment: await card.getBufferAsync(jimp.MIME_PNG),
              name: 'card.png'
            }]
        })
    } catch (err) {
        message.channel.send(error_report({type: 'normal', err_message: err.stack.toString()}))
    }
}

/** 
 * @param {{message: Message}} 
 */
async function osutop({message, embed_color, refresh, a_mode, lang, prefix}) {
    try {
        let msg = message.content.toLowerCase()
        let command = msg.split(' ')[0]
        if (fx.general.cmd_cooldown.cooldown[message.author.id] !== undefined && fx.general.cmd_cooldown.cooldown[message.author.id].indexOf(command) !== -1) {
            message.channel.send(error_report({type: 'custom', err_message: 'You need to wait 3 seconds before using this again!'}))
            return;
        }
        fx.general.cmd_cooldown.set({message: message, cmd: command, time: 3000})
        const errorLocalText = getLocalText({lang: lang}).errors
        let suffix = fx.general.check_suffix({check_msg: msg, two_arg: true, suffix: [{"suffix": "-p", "v_count": 1},
                                                                                    {"suffix": "-r", "v_count": 0},
                                                                                    {"suffix": "-m", "v_count": 1},
                                                                                    {"suffix": "-g", "v_count": 1},
                                                                                    {"suffix": "-s", "v_count": 1},
                                                                                    {"suffix": "-a", "v_count": 0},
                                                                                    {"suffix": "-c", "v_count": 0},
                                                                                    {"suffix": "-page", "v_count": 0},
                                                                                    ...check_server_suffix]})
        // Set the correct mode
        let mode = set_mode({suffix: suffix, a_mode: a_mode})
        //
        let {modename, check_type, modenum} = fx.osu.get_mode_detail({mode})
        let name = fx.osu.check_player({user_data: user_data, message: message, name: suffix.check, type: check_type,
                                        prefix: prefix, lang: lang})
        let user = await fx.osu.api.get_profile({name: name, mode: mode, ver: 1})
        if (!user) {
            message.channel.send(error_report({type: 'custom', err_message: errorLocalText.osu.player_null}))
            return
        }
        let {pfp_link} = fx.osu.get_profile_link({id: user.id, mode: mode, refresh: refresh})
        // Get top play
        let embed_title = `Top osu!${modename} plays for ${user.username}`
        let best = []
        let display_top = [0, 5]
        if (suffix["-r"]) {
            best = await fx.osu.api.get_top({name: name, mode: mode, limit: 100, no_bm: true, type: 'best'})
            best = best.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            embed_title = `Top osu!${modename} recent plays for ${user.username}`
        } else if (suffix["-m"]) {
            let mod = fx.osu.mods_enum({mod: suffix["-m"][0]})
            best = await fx.osu.api.get_top({name: name, mode: mode, limit: 100, no_bm: true, type: 'best'})
            best = best.filter(b => b.mod_num == mod.mod_num).sort((a,b) => b.pp - a.pp)
            embed_title = `Top osu!${modename} ${mod.mod_text.substr(1)} plays for ${user.username}`
        } else if (suffix["-g"]) {
            let g_pp = suffix["-g"][0]
            best = await fx.osu.api.get_top({name: name, mode: mode, limit: 100, no_bm: true, type: 'best'})
            best = best.filter(b => b.pp >= g_pp)
            message.channel.send(`${user.username} has **${best.length}** play(s) above ${g_pp}pp`)
            return
        } else if (suffix["-s"]) {
            let map_name = suffix["-s"][0].replace("_", " ")
            best = await fx.osu.api.get_top({name: name, mode: mode, limit: 100, no_bm: false, type: 'best'})
            best = best.filter(function(map) {
                return map.title.toLowerCase().includes(map_name) || map.creator.toLowerCase().includes(map_name) || map.diff.toLowerCase().includes(map_name) 
                    || map.source.toLowerCase().includes(map_name) || map.artist.toLowerCase().includes(map_name)
            })
            if (best.length == 0) {
                message.channel.send(error_report({type: 'custom', err_message: 'No search result found!'}))
                return;
            }
            embed_title = `Top osu!${modename} "${map_name}" map plays for ${user.username}`
        } else if (suffix["-a"]) {
            best = await fx.osu.api.get_top({name: name, mode: mode, limit: 100, no_bm: true, type: 'best'})
            best.sort(function (a,b) {
                return b.acc - a.acc
            })
            embed_title = `Top osu!${modename} accuracy plays for ${user.username}`
        } else if (suffix["-c"]) {
            best = await fx.osu.api.get_top({name: name, mode: mode, limit: 100, no_bm: true, type: 'best'})
            best.sort(function (a,b) {
                return b.combo - a.combo
            })
            embed_title = `Top osu!${modename} combo plays for ${user.username}`
        } else {
            best = await fx.osu.api.get_top({name: name, mode: mode, limit: 100, no_bm: true, type: 'best'})
        }
        if (suffix["-p"]) {
            let p_value = suffix["-p"][0]?.split('-').map(num => Number(num)).sort((a,b) => a - b)
            if (p_value?.length == 1) display_top = [p_value[0]-1, p_value[0]]
            else display_top = [p_value[0]-1, p_value[1]]
            if (p_value[0]-1 >= best.length || p_value[1]-1 >= best.length) {
                message.channel.send(error_report({type: 'custom', err_message: 'One of the value exceeded the maximum length of the top play'}))
                return
            }
        } else if (suffix["-page"]) {
            display_top = [0, best.length]
        }
        best = best.splice(display_top[0], display_top[1] - display_top[0])
        // Page function
        async function load_page({page}) {
            let desc = ''
            let start = (page - 1) * 5
            for (let i = start; i < start + 5; i++) {
                if (!best[i]) break
                cache_beatmap_ID({message: message, beatmap_id: best[i].beatmap_id, mode: mode})
                let beatmap = await fx.osu.api.get_beatmap({beatmap_id: best[i].beatmap_id, mode: mode})
                best[i].addBeatmapInfo(beatmap[0])
                let parser = (modenum == 0) ? await fx.osu.precalc({beatmap_id: best[i].beatmap_id}) : ''
                let {fcguess, mapcomplete, star} = await fx.osu.get_calc_pp({...best[i], parser: parser, mode: mode, lang: lang})
                let score_overlay = fx.osu.ui.score({...best[i], star: star, fcguess: fcguess,
                                                        mapcomplete: mapcomplete, type: 'top'})
                desc += score_overlay
            }
            return desc
        }
        const embed = new MessageEmbed()
        .setAuthor(embed_title)
        .setThumbnail(pfp_link)
        .setColor(embed_color)
        .setFooter(`{page}`);
        fx.general.page_system({message: message, embed: embed, update_func: load_page,
                                max_duration: Math.ceil(best.length / 5) * 30000, max_page: Math.ceil(best.length / 5)})
    } catch (err) {
        message.channel.send(error_report({type: 'normal', err_message: err.stack.toString()}))
    }
}

/** 
 * @param {{message: Message}} 
 */
async function recent({message, embed_color, refresh, lang, prefix}) {
    try {
        let msg = message.content.toLowerCase()
        const errorLocalText = getLocalText({lang: lang}).errors
        let suffix = fx.general.check_suffix({check_msg: msg, two_arg: true, suffix: [{"suffix": "-b", "v_count": 0},
                                                                                    {"suffix": "-l", "v_count": 0},
                                                                                    {"suffix": "-p", "v_count": 1},
                                                                                    ...check_mode_suffix,
                                                                                    ...check_server_suffix]})
        // Set the correct mode
        let mode = set_mode({suffix: suffix})
        //
        let {modename, check_type, modenum, a_mode} = fx.osu.get_mode_detail({mode})
        let name = fx.osu.check_player({user_data: user_data, message: message, name: suffix.check, type: check_type,
                                        prefix: prefix, lang: lang})
        if (suffix["-b"]) {
            let user = await fx.osu.api.get_profile({name: name, mode: mode, ver: 1})
            if (!user) {
                message.channel.send(error_report({type: 'custom', err_message: errorLocalText.osu.player_null}))
                return
            }
            let best = await fx.osu.api.get_top({name: name, mode: mode, limit: 100, type: 'best'})
            best.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            cache_beatmap_ID({message: message, beatmap_id: best[0].beatmap_id, mode: mode})
            let {pfp_link} = fx.osu.get_profile_link({id: user.id, mode: mode, refresh: refresh})
            let parser = (modenum == 0) ? await fx.osu.precalc({beatmap_id: best[0].beatmap_id}) : ''
            let {fcguess, mapcomplete, star} = await fx.osu.get_calc_pp({...best[0], parser: parser, mode: mode, lang: lang})
            let score_overlay = fx.osu.ui.score({...best[0], star: star, fcguess: fcguess,
                                                    mapcomplete: mapcomplete, type: 'top'})
            const embed = new MessageEmbed()    
            .setAuthor(`Best osu!${modename} recent plays for ${user.username}`, pfp_link)
            .setThumbnail(`https://assets.ppy.sh/beatmaps/${best[0].beatmapset_id}/covers/list@2x.jpg`)
            .setColor(embed_color)
            .setDescription(score_overlay);
            message.channel.send({embed});
        } else if (suffix['-l']) {
            let user = await fx.osu.api.get_profile({name: name, mode: mode, ver: 1})
            if (!user) {
                message.channel.send(error_report({type: 'custom', err_message: errorLocalText.osu.player_null}))
                return
            }
            let {pfp_link} = fx.osu.get_profile_link({id: user.id, mode: mode, refresh: refresh})
            let recents = await fx.osu.api.get_top({name: name, mode: mode, limit: 50, type: 'recent'})
            if (recents.length < 1) message.channel.send(error_report({type: 'custom', err_message: 'No recent plays by this player'}))
            async function load_page({page}) {
                let desc = ''
                let start = (page - 1) * 5
                for (let i = start; i < start + 5; i++) {
                    if (!recents[i]) break
                    cache_beatmap_ID({message: message, beatmap_id: recents[i].beatmap_id, mode: mode})
                    let beatmap = await fx.osu.api.get_beatmap({beatmap_id: recents[i].beatmap_id, mode: mode})
                    recents[i].addBeatmapInfo(beatmap[0])
                    let parser = (modenum == 0) ? await fx.osu.precalc({beatmap_id: recents[i].beatmap_id}) : ''
                    let {fcguess, mapcomplete, star, pp} = await fx.osu.get_calc_pp({...recents[i], parser: parser, mode: mode, lang: lang, recent: true})
                    let score_overlay = fx.osu.ui.score({...recents[i], mapcomplete: mapcomplete, star: star, fcguess: fcguess, pp: pp, type: 'top'})
                    desc += score_overlay
                }
                return desc
            }
            const embed = new MessageEmbed()
            .setAuthor(`osu!${modename} recent plays for ${user.username}`)
            .setThumbnail(pfp_link)
            .setColor(embed_color)
            .setFooter(`{page}`);
            fx.general.page_system({message: message, embed: embed, update_func: load_page,
                                    max_duration: Math.ceil(recents.length / 5) * 30000, max_page: Math.ceil(recents.length / 5)})
        } else {
            let user = await fx.osu.api.get_profile({name: name, mode: mode, ver: 1})
            if (!user) {
                message.channel.send(error_report({type: 'custom', err_message: errorLocalText.osu.player_null}))
                return
            }
            let recents = await fx.osu.api.get_top({name: name, mode: mode, limit: 1, type: 'recent'})
            if (!recents.length) {
                message.channel.send(error_report({type: 'custom', err_message: errorLocalText.osu.no_recent_play}))
                return
            }
            let {pfp_link} = fx.osu.get_profile_link({id: user.id, mode: mode, refresh: refresh})
            cache_beatmap_ID({message: message, beatmap_id: recents[0].beatmap_id, mode: mode})
            let parser = (modenum == 0) ? await fx.osu.precalc({beatmap_id: recents[0].beatmap_id}) : ''
            let {fcguess, mapcomplete, star, pp} = await fx.osu.get_calc_pp({...recents[0], parser: parser, mode: mode, lang: lang, recent: true})
            let score_overlay = fx.osu.ui.score({...recents[0], star: star, fcguess: fcguess, pp: pp, type: 'recent'})
            let line4 = recents[0].time_ago
            if (recents[0].rank == 'F') line4 = `${mapcomplete} • ${line4}`;
            const embed = new MessageEmbed()
            .setAuthor(`Most recent osu! ${modename} play for ${user.username}:`, pfp_link)
            .setThumbnail(`https://assets.ppy.sh/beatmaps/${recents[0].beatmapset_id}/covers/list@2x.jpg`)
            .setColor(embed_color)
            .setDescription(score_overlay)
            .setFooter(line4);
            message.channel.send({embed})
        }
    } catch (err) {
        message.channel.send(error_report({type: 'normal', err_message: err.stack.toString()}))
    }
}

/** 
 * @param {{message: Message}} 
 */
async function compare({message, embed_color, refresh, lang, prefix}) {
    try {
        let msg = message.content.toLowerCase()
        let command = msg.split(' ')[0]
        if (fx.general.cmd_cooldown.cooldown[message.author.id] !== undefined && fx.general.cmd_cooldown.cooldown[message.author.id].indexOf(command) !== -1) {
            message.channel.send(error_report({type: 'custom', err_message: 'You need to wait 3 seconds before using this again!'}))
            return;
        }
        fx.general.cmd_cooldown.set({message: message, cmd: command, time: 3000})
        let suffix = fx.general.check_suffix({check_msg: msg, two_arg: true, suffix: [{"suffix": "-b", "v_count": 0},
                                                                                    {"suffix": "-l", "v_count": 0},
                                                                                    ...check_mode_suffix,
                                                                                    ...check_server_suffix]})
        let beatmap_cache = beatmapID_cache.find(c => c.channel == message.channel.id)
        if (!beatmap_cache)  {
            message.channel.send(error_report({type: 'custom', err_message: "No play found in this channel"}))
            return;
        }
        let beatmap_id = beatmap_cache.beatmap_id
        // Set the correct mode
        let mode_type = beatmap_cache.mode.split("-")
        let mode = set_mode({suffix: suffix, default_a_mode: mode_type[1], default_check_type: mode_type[0]})
        //
        let {modename, check_type, modenum} = fx.osu.get_mode_detail({mode: mode})
        let name = fx.osu.check_player({user_data: user_data, message: message, name: suffix.check, type: check_type,
                                        prefix: prefix, lang: lang})
        let score = await fx.osu.api.get_score({name: name, mode: mode, beatmap_id: beatmap_id})
        score.sort(function (a,b) {
            a1 = Number(a.pp)
            b1 = Number(b.pp)
            return b1 - a1
        })
        if (score.length == 0) {
            message.channel.send(error_report({type: 'custom', err_message: `${name} didn't play this map! (${mode})`}))
            return;
        }
        let beatmap = await fx.osu.api.get_beatmap({beatmap_id: beatmap_id, mode: mode})
        let parser = (modenum == 0) ? await fx.osu.precalc({beatmap_id: beatmap_id}) : null
        async function load_page({page}) {
            let desc = ''
            let start = (page - 1) * 5
            for (let i = start; i < start + 5; i++) {
                if (!score[i]) break
                let unrankedpp = '';
                if (modenum == 0 && beatmap[0].approvalStatus == "Loved") {
                    let comparepp = fx.osu.get_calc_pp({...score[i], ...beatmap[0], mode: mode, parser: parser, lang: lang})
                    unrankedpp = `(Loved: ${Number(comparepp.pp.total).toFixed(2)}pp)`
                }
                let {fcguess, mapcomplete, star} = await fx.osu.get_calc_pp({...score[i], ...beatmap[0], 
                                                                            parser: parser, mode: mode, lang: lang})
                desc += fx.osu.ui.score({...score[i], ...beatmap[0], star: star, fcguess: fcguess, type: 'compare', top: i+1})
            }
            return desc
        }
        const embed = new MessageEmbed()
        .setAuthor(`Top osu!${modename} plays for ${score[0].username} on ${beatmap[0].title} [${beatmap[0].diff}]`, undefined, `https://osu.ppy.sh/b/${beatmap_id}`)
        .setThumbnail(`https://b.ppy.sh/thumb/${beatmap[0].beatmapset_id}l.jpg`)
        .setColor(embed_color)
        .setFooter(`{page}`)
        fx.general.page_system({message: message, embed: embed, update_func: load_page, 
                                max_duration: Math.ceil(score.length / 5) * 30000, max_page: Math.ceil(score.length / 5)})
    } catch (err) {
        message.channel.send(error_report({type: 'normal', err_message: err.stack.toString()}))
    }
}

/** 
 * @param {{message: Message}} 
 */
async function scores({message, embed_color, refresh, lang, prefix}) {
    try {
        let msg = message.content.toLowerCase()
        let command = msg.split(' ')[0]
        if (fx.general.cmd_cooldown.cooldown[message.author.id] !== undefined && fx.general.cmd_cooldown.cooldown[message.author.id].indexOf(command) !== -1) {
            message.channel.send(error_report({type: 'custom', err_message: 'You need to wait 3 seconds before using this again!'}))
            return;
        }
        fx.general.cmd_cooldown.set({message: message, cmd: command, time: 3000})
        let beatmap_id, mode = "Bancho-";
        if (msg.includes("https://osu.ppy.sh/b/")) {
            let a_mode_list = ['std', 'taiko', 'ctb', 'mania']
            let args = msg.split('/')[4].split(' ')[0].split('?')
            beatmap_id = args[0]
            mode += args[1] ? a_mode_list[args[1].substr(-1)] : 'std'
        } else if (msg.includes("https://osu.ppy.sh/beatmapsets/")) {
            let a_mode_list = {"osu": "std", "taiko": "taiko",
                                "fruits": "ctb", "mania": "mania"}
            let args = msg.split('#')[1].split('/')
            beatmap_id = args[1].split(" ")[0]
            mode += a_mode_list[args[0]]
        }
        let link = msg.split(' ').find(l => l.includes("https://osu.ppy.sh/")).toString().replace(',', '')
        let suffix = fx.general.check_suffix({check_msg: msg, two_arg: false, 
                                            suffix: [{"suffix": link, v_count: 0}]})
        //
        let {modenum, modename, a_mode, check_type} = fx.osu.get_mode_detail({mode: mode})
        let name = fx.osu.check_player({user_data: user_data, message: message, name: suffix.check, type: check_type,
            prefix: prefix, lang: lang})
        let score = await fx.osu.api.get_score({name: name, mode: mode, beatmap_id: beatmap_id})
        let {profile_link} = fx.osu.get_profile_link({id: score[0].user_id, refresh: refresh, mode: mode})
        score.sort(function (a,b) {
            a1 = Number(a.pp)
            b1 = Number(b.pp)
            return b1 - a1
        })
        if (score.length == 0) {
            message.channel.send(error_report({type: 'custom', err_message: `${name} didn't play this map! (${mode})`}))
            return;
        }
        let beatmap = await fx.osu.api.get_beatmap({beatmap_id: beatmap_id, mode: mode})
        let parser = (modenum == 0) ? await fx.osu.precalc({beatmap_id: beatmap_id}) : null
        async function load_page({page}) {
            let desc = `**Top osu!${modename} plays for [${score[0].username}](${profile_link}) on [${beatmap[0].title}](https://osu.ppy.sh/b/${beatmap_id})**\n\n`
            let start = (page - 1) * 5
            for (let i = start; i < start + 5; i++) {
                if (!score[i]) break
                cache_beatmap_ID({message: message, beatmap_id: beatmap_id, mode: mode})
                let unrankedpp = '';
                if (modenum == 0 && beatmap[0].approvalStatus == "Loved") {
                    let comparepp = fx.osu.get_calc_pp({...score[i], ...beatmap[0], mode: mode, parser: parser, lang: lang})
                    unrankedpp = `(Loved: ${Number(comparepp.pp.total).toFixed(2)}pp)`
                }
                let {fcguess, mapcomplete, star} = await fx.osu.get_calc_pp({...score[i], ...beatmap[0], 
                                                                            parser: parser, mode: mode, lang: lang})
                desc += fx.osu.ui.score({...score[i], ...beatmap[0], star: star, fcguess: fcguess, type: 'compare', top: i+1})
            }
            return desc
        }
        const embed = new MessageEmbed()
        .setThumbnail(`https://b.ppy.sh/thumb/${beatmap[0].beatmapset_id}l.jpg`)
        .setColor(embed_color)
        .setFooter(`{page}`)
        fx.general.page_system({message: message, embed: embed, update_func: load_page,
                                max_duration: Math.ceil(score.length / 5) * 30000,  max_page: Math.ceil(score.length / 5)})
    } catch (err) {
        message.channel.send(error_report({type: 'normal', err_message: err.stack.toString()}))
    }
}

/** 
 * @param {{message: Message}} 
 */
async function map({message, embed_color, refresh, lang, prefix}) {
    try {
        let msg = message.content.toLowerCase()
        let command = msg.split(' ')[0]
        if (fx.general.cmd_cooldown.cooldown[message.author.id] !== undefined && fx.general.cmd_cooldown.cooldown[message.author.id].indexOf(command) !== -1) {
            message.channel.send(error_report({type: 'custom', err_message: 'You need to wait 3 seconds before using this again!'}))
            return;
        }
        fx.general.cmd_cooldown.set({message: message, cmd: command, time: 3000})
        let suffix = fx.general.check_suffix({check_msg: msg, two_arg: false, suffix: [{"suffix": "-l", v_count: 0}]})
        let beatmap_cache = beatmapID_cache.find(c => c.channel == message.channel.id)
        if (!beatmap_cache)  message.channel.send(error_report({type: 'custom', err_message: "No play found in this channel"}))
        let mode = beatmap_cache.mode
        let beatmap_id = beatmap_cache.beatmap_id
        let mods = suffix.check ? suffix.check.replace('+', '') : 'NM';
        let {modenum, modename, a_mode, check_type} = fx.osu.get_mode_detail({mode: mode})
        let {mod_num, mod_text} = fx.osu.mods_enum({mod: mods})
        if (suffix['-l']) {
            let scores = await fx.osu.api.get_score({name: undefined, mode: mode, beatmap_id: beatmap_id, limit: 100})
            let beatmap = await fx.osu.api.get_beatmap({beatmap_id: beatmap_id, mode: mode})
            let parser;
            if (modenum == 0) parser = await fx.osu.precalc({beatmap_id: beatmap_id}) 
            cache_beatmap_ID({message: message, beatmap_id: beatmap_id, mode: mode})
            async function load_page({page}) {
                let desc = ''
                let start = (page - 1) * 5
                for (let i = start; i < start + 5; i++) {
                    if (!scores[i]) break
                    scores[i].addBeatmapInfo(beatmap[0])
                    let {fcguess, mapcomplete, star} = await fx.osu.get_calc_pp({...scores[i], parser: parser, mode: mode, lang: lang})
                    desc += fx.osu.ui.score({...scores[i], title: scores[i].username, star: star, fcguess: fcguess, type: 'map', top: i+1})
                }
                return desc
            }
            const embed = new MessageEmbed()
            .setAuthor(`Top osu!${modename} Plays for ${beatmap[0].title}`, undefined, undefined,`https://osu.ppy.sh/b/${beatmap_id}`)
            .setThumbnail(`https://b.ppy.sh/thumb/${beatmap[0].beatmapset_id}l.jpg`)
            .setColor(embed_color)
            .setFooter(`{page}`)
            fx.general.page_system({message: message, embed: embed, update_func: load_page,
                                    max_duration: Math.ceil(score.length / 5) * 30000, max_page: Math.ceil(scores.length / 5)})
        } else {
            cache_beatmap_ID({message: message, beatmap_id: beatmap_id, mode: mode})
            let map = await fx.osu.api.get_beatmap({beatmap_id: beatmap_id, limit: 1, mode: mode})
            let creator_user = await fx.osu.api.get_profile({name: map[0].creator, mode: mode, ver: 1})
            let parser = (modenum == 0) ? await fx.osu.precalc({beatmap_id: beatmap_id}) : ''
            let embed = fx.osu.ui.beatmap({map: map[0], parser: parser, mode: mode, mod_num: mod_num, mod_text: mod_text, 
                                            creator_user: creator_user, embed_color: embed_color})
            message.channel.send({embed});
        }
    } catch (err) {
        message.channel.send(error_report({type: 'normal', err_message: err.stack.toString()}))
    }
}

/** 
 * @param {{message: Message}} 
 */
async function beatmap_link_detection({message, embed_color, refresh, lang, prefix}) {
    let msg = message.cleanContent.toLowerCase()
    let command = msg.split(' ')[0]
    if (fx.general.cmd_cooldown.cooldown[message.author.id] !== undefined && fx.general.cmd_cooldown.cooldown[message.author.id].indexOf(command) !== -1) {
        message.channel.send(error_report({type: 'custom', err_message: 'You need to wait 3 seconds before using this again!'}))
        return;
    }
    fx.general.cmd_cooldown.set({message: message, cmd: command, time: 3000})
    let beatmap_id;
    let mode = 'bancho-';
    if (msg.startsWith("https://osu.ppy.sh/b/")) {
        let a_mode_list = ['std', 'taiko', 'ctb', 'mania']
        let args = msg.split('/')[4].split(' ')[0].split('?')
        beatmap_id = args[0]
        mode += args[1] ? a_mode_list[args[1].substr(-1)] : 'std'
    } else if (msg.startsWith("https://osu.ppy.sh/beatmapsets/")) {
        let a_mode_list = {"osu": "std", "taiko": "taiko",
                            "fruits": "ctb", "mania": "mania"}
        let args = msg.split('#')[1].split('/')
        beatmap_id = args[1].split(" ")[0]
        mode += a_mode_list[args[0]]
    }
    let link = msg.split(' ').find(l => l.includes("https://osu.ppy.sh/")).toString().replace(',', '')
    let suffix = fx.general.check_suffix({check_msg: msg, two_arg: false, 
                                        suffix: [{"suffix": link, v_count: 0}]})
    let mods = suffix.check ? suffix.check.replace('+', '') : 'NM';
    let {modenum} = fx.osu.get_mode_detail({mode: mode})
    let {mod_num, mod_text} = fx.osu.mods_enum({mod: mods})
    cache_beatmap_ID({message: message, beatmap_id: beatmap_id, mode: mode})
    let map = await fx.osu.api.get_beatmap({beatmap_id: beatmap_id, limit: 1, mode: mode})
    let creator_user = await fx.osu.api.get_profile({name: map[0].creator, mode: mode, ver: 1})
    let parser = (modenum == 0) ? await fx.osu.precalc({beatmap_id: beatmap_id}) : ''
    let embed = fx.osu.ui.beatmap({map: map[0], parser: parser, mode: mode, mod_num: mod_num, mod_text: mod_text, 
                                    creator_user: creator_user, embed_color: embed_color})
    message.channel.send({embed});
}

/** 
 * @param {{message: Message}} 
 */
async function osuset({message, embed_color, refresh, lang, prefix}) {
    try {
        // New
        let msg = message.content.toLowerCase();
        let command = msg.split(' ')[0]
        if (fx.general.cmd_cooldown.cooldown[message.author.id] !== undefined && fx.general.cmd_cooldown.cooldown[message.author.id].indexOf(command) !== -1) {
            message.channel.send(error_report({type: 'custom', err_message: 'You need to wait 5 seconds before using this again!'}))
            return;
        }
        fx.general.cmd_cooldown.set({message: message, cmd: command, time: 5000})
        let sync_db_value = {
            type: undefined,
            name: undefined,
            check_type: undefined,
            user_id: message.author.id,
            proc_id: process.env.PROCESS_ID
        }
        let suffix = fx.general.check_suffix({check_msg: msg, two_arg: false, suffix: check_server_suffix})
        // Set the correct mode
        let mode = set_mode({suffix: suffix, a_mode : 'std'})
        //
        let {check_type} = fx.osu.get_mode_detail({mode: mode})
        let user = await fx.osu.api.get_profile({name: suffix.check, mode: mode, ver: 1})
        let name = user.username
        let {profile_link, pfp_link} = fx.osu.get_profile_link({id: user.id, mode: mode, refresh: refresh})
        if (name == undefined) {
            message.channel.send(error_report({type: 'custom', err_message: 'User not found!'}))
        } else {
            if (user_data[message.author.id]) {
                user_data[message.author.id].name[check_type.toLowerCase()] = name
                sync_db_value.check_type = check_type.toLowerCase()
                sync_db_value.name = name
            } else {
                user_data[message.author.id] = {
                    name: {

                    }
                }
                user_data[message.author.id].name[check_type.toLowerCase()] = name
                sync_db_value.check_type = check_type.toLowerCase()
                sync_db_value.name = name
            }
            const embed = new MessageEmbed()
            .setAuthor(`Your account has been linked to ${check_type} username: ${name}`,'', profile_link)
            .setColor(embed_color)
            .setImage(pfp_link);
            message.channel.send({embed})
            process.send({send_type: "db", cmd: "prefix", value: sync_db_value})
            if (!config.config.debug.disable_db_save) db.user_data_v5.findAndModify({query: {}, update: user_data}, function(){})
        }
    } catch (error) {
        message.channel.send(error_report({type: 'normal', err_message: err}))
    }
}

/** 
 * @param {{message: Message}} 
 */
async function osutrack({message, embed_color, refresh, lang, prefix}) {
    try {
        if (message.member.hasPermission("MANAGE_CHANNELS") == false) {
            message.channel.send(error_report({type: 'custom', err_message: 'You need to have `Manage Channels` permission to set osutrack'}))
            return;
        }
        let msg = message.content.toLowerCase();
        let command = msg.split(' ')[0]
        if (fx.general.cmd_cooldown.cooldown[message.author.id] !== undefined && fx.general.cmd_cooldown.cooldown[message.author.id].indexOf(command) !== -1) {
            message.channel.send(error_report({type: 'custom', err_message: 'You need to wait 10 seconds before using this again!'}))
            return;
        }
        fx.general.cmd_cooldown.set({message: message, cmd: command, time: 10000})
        let suffix = fx.general.check_suffix({check_msg: msg, two_arg: true, suffix: [...check_mode_suffix,
                                                                                    ...check_server_suffix,
                                                                                    {"suffix": "-p", "v_count": 1}]})
        // Set the correct mode
        let mode = set_mode({suffix: suffix})
        let limit = 50
        if (suffix['-p']) limit = suffix['-p'][0]
        if (limit > 100 || limit < 1) {
            message.channel.send(error_report({type: 'custom', err_message: 'You can only set from top 1-100. Please try again'}))
        }
        if (String(limit).search(/^\d+$/) < 0) {
            message.channel.send(error_report({type: 'custom', err_message: 'You can only set top as a numeric value. Please try again'}))
        }
        let {modename, check_type} = fx.osu.get_mode_detail({mode: mode})
        let user = await fx.osu.api.get_profile({name: suffix.check, mode: mode, ver: 1})
        if (!user) message.channel.send(error_report({type: 'custom', err_message: 'Please enter a valid username!'}))
        process.send({send_type: "osutrack", cmd: `add-${process.env.PROCESS_ID}-${user.id}-${message.channel.id}`, 
                        value: {channel_id: message.channel.id,
                                mode: mode,
                                limit: limit,
                                check_type: check_type,
                                user: user,
                                proc_id: process.env.PROCESS_ID
                                }})
        let {added, error} = await new Promise(resolve => {
            process.on('message', (proc_msg) => {
                if (proc_msg.cmd == `add-${process.env.PROCESS_ID}-${user.id}-${message.channel.id}`) {
                    resolve(proc_msg.value)
                }
            })
        })
        if (added) {
            message.channel.send(`**${user.username}** is now being tracked on **#${message.channel.name}**\n\`mode\`: ${modename}\n\`top\`: ${limit}`)
        } else {
            message.channel.send(error_report({type: 'normal', err_message: error}))
        }
    } catch (err) {
        message.channel.send(error_report({type: 'normal', err_message: err}))
    }
}

/** 
 * @param {{message: Message}} 
 */
async function untrack({message, embed_color, refresh, lang, prefix}) {
    try {
        if (message.member.hasPermission("MANAGE_CHANNELS") == false) {
            message.channel.send(error_report({type: 'custom', err_message: 'You need to have `Manage Channels` permission to untrack'}))
            return;
        }
        let msg = message.content.toLowerCase();
        let command = msg.split(' ')[0]
        if (fx.general.cmd_cooldown.cooldown[message.author.id] !== undefined && fx.general.cmd_cooldown.cooldown[message.author.id].indexOf(command) !== -1) {
            message.channel.send(error_report({type: 'custom', err_message: 'You need to wait 10 seconds before using this again!'}))
            return;
        }
        fx.general.cmd_cooldown.set({message: message, cmd: command, time: 10000})
        let suffix = fx.general.check_suffix({check_msg: msg, two_arg: false, suffix: [...check_server_suffix,
                                                                                        {"suffix": "-on", "v_count": 0},
                                                                                        {"suffix": "-all", "v_count": 0}]})
        // Set the correct mode
        let mode = set_mode({suffix: suffix, a_mode : 'std'})
        let {check_type} = fx.osu.get_mode_detail({mode: mode})
        let name = ''
        if (suffix["-on"])  name = suffix.check;
        else { 
            let user = await fx.osu.api.get_profile({name: suffix.check, mode: mode, ver: 1})
            name = user.username
        }
        if (name == undefined)
            message.channel.send(error_report({type: 'custom', err_message: 'Please enter a valid osu username! >:c'}))
        process.send({send_type: "osutrack", cmd: `remove-${process.env.PROCESS_ID}-${name}-${message.channel.id}`, 
                    value: {channel_id: message.channel.id,
                            mode: mode,
                            check_type: check_type,
                            name: name,
                            suffix: suffix,
                            proc_id: process.env.PROCESS_ID
                            }})
        let {removed, error} = await new Promise(resolve => {
            process.on('message', (proc_msg) => {
                if (proc_msg.cmd == `remove-${process.env.PROCESS_ID}-${name}-${message.channel.id}`) {
                    resolve(proc_msg.value)
                }
            })
        })
        if (removed) {
            message.channel.send(`**${name}** (${check_type}) has been removed from #${message.channel.name}`)
        } else if (error == 'not found') {
            message.channel.send(error_report({type: 'custom', err_message: `**${name}** (${check_type}) not found in the tracking database`}))
        } else {
            message.channel.send(error_report({type: 'custom', err_message: `Something went wrong please try again`}))
        }
    } catch (error) {
        message.channel.send(error_report({type: 'normal', err_message: err}))
    }
}

/** 
 * @param {{message: Message}} 
 */
async function osutracklist({message, embed_color, refresh, lang, prefix}) {
    let value = process.send({send_type: "osutrack", cmd: `list-${process.env.PROCESS_ID}-${message.channel.id}`, 
                            value: {
                                    channel_id: message.channel.id,
                                    proc_id: process.env.PROCESS_ID
                                    }})
    let {players, error} = await new Promise(resolve => {
        process.on('message', (proc_msg) => {
            if (proc_msg.cmd == `list-${process.env.PROCESS_ID}-${message.channel.id}`) {
                resolve(proc_msg.value)
            }
        })
    })
    if (error) {
        message.channel.send(error_report({type: 'custom', err_message: 'No player found in the database'}))
    }
    let load_page = async function ({page}) {
        let gathering = ''
        for (let n = 0; n < 15; n++) {
            let i = (page - 1) * 15 - 1 + (n+1)
            if (i < players.length) {
                gathering += players[i]
            }
        }
        return gathering
    }
    const embed = new MessageEmbed()
    .setTitle(`Player(s) currently being tracked on #${message.channel.name}`)
    .setThumbnail(message.guild.iconURL({format: 'png', size: 512}))
    .setColor(embed_color)
    .setFooter(`{page}`)
    fx.general.page_system({message: message, embed: embed, update_func: load_page,
                            max_duration: Math.ceil(players.length / 15) * 30000, max_page: Math.ceil(players.length / 15)})
}
module.exports = {
    osuavatar,
    osu,
    osutop,
    push_db,
    recent,
    beatmap_link_detection,
    compare,
    map,
    osucard,
    scores,
    osuset,
    osutrack,
    untrack,
    osutracklist,
    cache_beatmap_ID,
    sync_user_data_db,
    sync_saved_beatmap_db
}