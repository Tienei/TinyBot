const { Message, MessageEmbed, Client } = require("discord.js-light")
// Functions
const error_report = require('./../Utils/error')
const fx = require("./../Functions/fx_handler")
// Lang
const getLocalText = require('../Lang/lang_handler')
const { config } = require("../config")
const { get } = require("superagent")

let server_data = {}
let db;

/** 
 * @param {{message: Message}} 
 */
async function avatar({message, embed_color, lang}) {
    try {
        let localText = getLocalText({lang: lang}).avatar
        let msg = message.content.toLowerCase()
        let suffixes = fx.general.check_suffix({check_msg: msg, suffix: [{"suffix": undefined, "v_count": 0}]})
        let user = await fx.general.get_discord_user({message: message, name: suffixes.check})
        if (!user) {
            message.channel.send(error_report({type: 'custom', err_message: "User not found!"}))
            return;
        }
        const embed = new MessageEmbed()
        .setAuthor(localText.text.replace('{username}', user.username))
        .setColor(embed_color)
        .setImage(user.displayAvatarURL({size: 2048, format: "png", dynamic: true}));
        message.channel.send({embed})
    } catch (err) {
        message.channel.send(error_report({type: 'normal', err_message: err.stack.toString()}))
    }
}

/** 
 * @param {{message: Message}} 
 */
async function ping({message}) {
    try {
        let msg = message.content.toLowerCase();
        let timenow = Date.now()
        let edit_msg = await message.channel.send("Checking Discord mental health...");
        let timelater = Date.now()
        let ping = timelater - timenow
        let visual = '['
        for (let i = 0; i < 20; i++) {
            let comp = (50 + Math.pow(63.5, 0.50 * Math.log(i)))
            if (ping < comp) {
                visual += '⎯'
            } else {
                visual += '▬'
            }
        }
        visual += ']'
        edit_msg.edit(`Discord respond! **${ping}ms**                                                         
Good   ${visual}   Bad`)
    } catch (error) {
        message.channel.send(error_report({type: 'normal', err_message: err.stack.toString()}))
    }
}

/** 
 * @param {{message: Message}} 
 */
function checkperm({message, bot_ver}) {
    try {
        let embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)
        let compatibility = []
        let permissions = ['SEND_MESSAGES', 'ATTACH_FILES', 'ADD_REACTIONS', 'EMBED_LINKS', 'USE_EXTERNAL_EMOJIS']
        for (let i in permissions) {
            if (message.guild.me.hasPermission(permissions[i])) compatibility.push('✅')
            else compatibility.push('❌');
        }
        const embed = new MessageEmbed()
        .setAuthor(`Permissions for Tiny Bot ${bot_ver} in ${message.guild.name}`)
        .setThumbnail(message.guild.iconURL())
        .setColor(embedcolor)
        .setDescription(`Send Message: ${compatibility[0]}
Attach Files: ${compatibility[1]}
Add Reactions: ${compatibility[2]}
Embed Links: ${compatibility[3]}
Use External Emojis: ${compatibility[4]}`);
        message.channel.send({embed})
    } catch (error) {
        message.channel.send(String(error))
    }
}

/** 
 * @param {{message: Message}} 
 */
function bug_and_suggest({message, embed_color, type, lang}) {
    let msg = fx.general.check_suffix({check_msg: message.content, suffix: [{"suffix": undefined, "v_count": 0}]})
    if (msg.check?.replace(" ", "") == "") {
        message.channel.send("You need to type a suggestion/bug report!")
        return
    }
    process.send({send_type: 'all', cmd: 'bug_and_suggest', 
                value: {
                    channel_id: message.channel.id, msg: msg.check, type: type,
                    user: message.author, embed_color: embed_color, 
                    avatarURL: message.author.displayAvatarURL({format: 'jpg', size: 128}), lang: lang}})
}

async function childProc_bug_and_suggest({message, DiscordCL = new Client()}) {
    let localText = getLocalText({lang: message.lang}).bug_and_suggest
    let channel_id  =    (message.type == 'bug') ? '564396177878155284'  : '564439362218229760'
    let text =           (message.type == 'bug') ? localText.bug         : localText.suggestion
    let report_text =    (message.type == 'bug') ? 'Bug'                 : 'Suggestion'
    let channel = DiscordCL.channels.cache.get(channel_id)
    if (channel) {
        const embed = new MessageEmbed().setAuthor(`Username: ${message.user.username} (${message.user.id})`, message.avatarURL)
        .setColor(message.embed_color)
        .setDescription(`
Channel ID: **${message.channel_id}**
${text}: ${message.msg}`);
        channel.send({embed})
        await (await DiscordCL.channels.fetch(message.channel_id)).send(`${report_text} has been reported`)
    }
}

/** 
 * @param {{message: Message}} 
 */
function changelog({message}) {
    let embed_color = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)
    let changes = [`\`Performance and UI update:\`
**[August 1st, 2021]**
- Changed scores request from api v1 to api v2
- Changed scores UI
- Updated caching mechanism
- Fixed empty message when doing report/suggestion
** [August 19th, 2021]**
- Improved bot performance
- Fixed \`!score\`
- Fixed other modes \`!top\`, \`!map\`, \`!card\`
- Fixed \`osutrack\` showing incorrect time
- Fixed map's HP showing incorrect value
- Fixed other private server top play showing "undefined"
- Fixed alone_reacton in all tenor related commands
- Fixed \`help\` description
`]
    function load_page({page}) {
        return changes[page-1]
    }
    const embed = new MessageEmbed()
    .setTitle(`Changelog for Tiny Bot ${config.bot_ver}`)
    .setThumbnail(message.client.user.avatarURL({format: 'png', size: 512}))
    .setColor(embed_color)
    .setFooter(`{page}`)
    fx.general.page_system({message: message, embed: embed, update_func: load_page,
                            max_duration: Math.ceil(changes.length / 1) * 30000, max_page: Math.ceil(changes.length / 1)})
}

/** 
 * @param {{message: Message}} 
 */
async function donate({message}) {
    try {
        const embed = new MessageEmbed()
        .setDescription("Support the creator here: [donate](https://ko-fi.com/tienei)" +
"\n\nIf you like the bot and want to support the development of it, please consider donating!" +
"\n\nDonations will mostly go towards the bot development and will make the bot runs 5 times faster and better with more advanced features" +
" and also helped prolong the life of TinyBot since currently the bot is hosted on a cloud server that costs money.")
        .setThumbnail(message.client.user.avatarURL({format: 'png', size: 512}));
        message.channel.send({embed})
    } catch (err) {console.log(err)}
}

/** 
 * @param {{message: Message}} 
 */
async function bot_link({message}) {
    try {
        const embed = new MessageEmbed()
        .setDescription(`[Bot invitation link](https://discordapp.com/api/oauth2/authorize?client_id=470496878941962251&permissions=378944&scope=bot)
[Bot dev server](https://discord.gg/H2mQMxd)
[Bot donation link](https://ko-fi.com/tienei)`)
        .setThumbnail(message.client.user.avatarURL({format: 'png', size: 512}));
        message.channel.send({embed})
    } catch (err) {console.log(err)}
}

/** 
 * @param {{message: Message}} 
 */
function prefix({message, server_data}) {
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
        if (new_prefix == config.bot_default_prefix) {
            message.channel.send(`Prefix has been set back to default: ${config.bot_default_prefix}`)
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
        return server_data
    } catch (error) {
        message.channel.send(error_report({type: 'normal', err_message: error.stack.toString()}))
        return null 
    }
}

let bot_command_help = []
/** 
 * @param {{message: Message}} 
 */
function help({message, prefix}) {
    try {
        let msg = message.content.toLowerCase();
        let command = msg.split(' ')[0]
        let embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)
        function addhelp(helpcommand, fullcommand, description, option, example) {
            let helptext = '```' + `{prefix}` + fullcommand + '```' + `\n${description}\n\n**---[Options]:**\n${option}\n\n**---[Example]:**\n` + `{prefix}`+ example
            bot_command_help.push({command: helpcommand, helptext: helptext})
        }
        if (bot_command_help.length < 1) {
            addhelp('avatar', 'avatar (user)', 'Sends the mentioned user\'s Discord avatar to the channel', 'user: The User you want to get the avatar from (Has to be @user)', 'avatar @Tienei#0000')
            addhelp('changelog', 'changelog', 'View updates and fixes of the bot', 'None', 'changelog')
            addhelp('help', 'help (command)', 'Get the full list of commands or get more information about the one you specify', 'command: Command help you wanted to see', 'help osu')
            addhelp('ping', 'ping', 'Connection between the bot and Discord', 'None', 'ping')
            addhelp('banchoping', 'banchoping', 'Ping Bancho (probably making Bancho mad sometimes lol)\n100ms: Good\n200ms: OK\n300ms: Bad\n600ms: Pretty bad', 'None', 'banchoping')
            addhelp('report', 'report (error)', 'Report an error or bug to my owner', 'error: Type any error or bug you found', 'report osu is broken')
            addhelp('suggestion', 'suggestion (suggestion)', 'Suggest an idea for the bot to the owner', 'suggestion: Type any suggestion you wanted to add', 'add somecommand to the bot')
            addhelp('[invite | invitation]', 'invite', 'Bot\'s invitation link', 'none', 'invite')
            addhelp('server', 'server', 'Bot\'s server link', 'none', 'server')
            addhelp('prefix', 'prefix (prefix)', 'Changes my prefix in the server', 'prefix: The prefix you wanted', 'prefix >')
            addhelp('hug', 'hug (user)', 'Hug someone', 'user: The Discord username of the user', 'hug Tienei')
            addhelp('cuddle', 'cuddle (user)', 'Cuddle someone', 'user: The Discord username of the user', 'cuddle Tienei')
            addhelp('slap', 'slap (user)', 'Slap someone', 'user: The Discord username of the user', 'slap Tienei')
            addhelp('kiss', 'kiss (user)', 'Kiss someone (best not to kiss in public ;) )', 'user: The Discord username of the user', 'kiss Tienei')
            addhelp('pat', 'pat (user)', 'Pat someone', 'user: The Discord username of the user', 'pat Tienei')
            addhelp('poke', 'poke (user)', 'Poke someone', 'user: The Discord username of the user', 'poke Tienei')
            addhelp('cry', 'cry', 'Crying.', 'None', 'cry')
            addhelp('blush', 'blush', 'Blushing.', 'None', 'blush')
            addhelp('pout', 'pout', 'Pouting.', 'None', 'pout')
            addhelp('trivia', 'trivia', 'Ask you a fun trivia question (either multiple choice or true/false question)', 'None', 'trivia')
            addhelp('8ball', '8ball (message)', 'The magic ball that has all the answers to your questions', 'None', '8ball Am i old?')
            addhelp('roll', 'roll (number)', 'Roll a dice', 'None', 'roll 90')
            addhelp('ratewaifu', 'ratewaifu (text)', 'Rate your waifu', 'None', 'ratewaifu TinyBot')
            addhelp('osu', 'osu (username) (options)', 'Get an osuStandard profile', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the details of the player `(no param)`\nTop Skills `(-ts)`: Calculate player skill using bot formula\nAcc Top Skills `(-accts)`: Calculate player acc skill using bot formula\nAim Top Skills `(-aimts)`: Calculate player aim skill using bot formula\Speed Top Skills `(-speedts)`: Calculate player speed skill using bot formula\nServer suffixes: `-akatsuki` `-ripple` `-gatari` `-enjuu` `-horizon` `-datenshi` `-kurikku` `-ezppfarm` `-ainu`', 'osu Tienei -d')
            addhelp('taiko', 'taiko (username)', 'Get an osu!Taiko profile', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the details of the player `(no param)`\nTop Skills `(-ts)`: Calculate player skill using bot formula\nAcc Top Skills `(-accts)`: Calculate player acc skill using bot formula\nAim Top Skills `(-aimts)`: Calculate player aim skill using bot formula\Speed Top Skills `(-speedts)`: Calculate player speed skill using bot formula\nServer suffixes: `-akatsuki` `-ripple` `-gatari` `-enjuu` `-horizon` `-datenshi` `-kurikku` `-ezppfarm` `-ainu`', 'taiko Tienei')
            addhelp('ctb', 'ctb (username)', 'Get an osu!Catch the beat profile', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the details of the player `(no param)`\nTop Skills `(-ts)`: Calculate player skill using bot formula\nAcc Top Skills `(-accts)`: Calculate player acc skill using bot formula\nAim Top Skills `(-aimts)`: Calculate player aim skill using bot formula\Speed Top Skills `(-speedts)`: Calculate player speed skill using bot formula\nServer suffixes: `-akatsuki` `-ripple` `-gatari` `-enjuu` `-horizon` `-datenshi` `-kurikku` `-ezppfarm` `-ainu`', 'ctb Tienei')
            addhelp('mania', 'mania (username)', 'Get an osu!Mania profile', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the details of the player `(no param)`\nTop Skills `(-ts)`: Calculate player skill using bot formula\nAcc Top Skills `(-accts)`: Calculate player acc skill using bot formula\nAim Top Skills `(-aimts)`: Calculate player aim skill using bot formula\Speed Top Skills `(-speedts)`: Calculate player speed skill using bot formula\nServer suffixes: `-akatsuki` `-ripple` `-gatari` `-enjuu` `-horizon` `-datenshi` `-kurikku` `-ezppfarm` `-ainu`', 'mania Tienei')
            addhelp('relax', 'relax (username)', 'Get an osu!Relax profile (Only if a server support relax, else return error)', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the details of the player `(no param)`\nTop Skills `(-ts)`: Calculate player skill using bot formula\nAcc Top Skills `(-accts)`: Calculate player acc skill using bot formula\nAim Top Skills `(-aimts)`: Calculate player aim skill using bot formula\Speed Top Skills `(-speedts)`: Calculate player speed skill using bot formula\nServer suffixes: `-akatsuki` `-ripple` `-gatari` `-enjuu` `-horizon` `-datenshi` `-kurikku` `-ezppfarm` `-ainu`', 'relax Tienei')
            addhelp('osucard', 'osucard (username)', 'Generate an osu!card (Just for fun)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 525\n`Elite`: Acc >= 525 and Acc < 700\n`Super Rare`: Acc >= 700 and Acc < 825\n`Ultra Rare`: Acc >= 825 and Acc < 900\n`Master`: Acc >= 900', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nServer suffixes: `-akatsuki` `-ripple` `-gatari` `-enjuu` `-horizon` `-datenshi` `-kurikku` `-ezppfarm` `-ainu`', 'osucard Tienei')
            addhelp('taikocard', 'taikocard (username)', 'Generate a taiko!card (Just for fun)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 525\n`Elite`: Acc >= 525 and Acc < 700\n`Super Rare`: Acc >= 700 and Acc < 825\n`Ultra Rare`: Acc >= 825 and Acc < 900\n`Master`: Acc >= 900', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nServer suffixes: `-akatsuki` `-ripple` `-gatari` `-enjuu` `-horizon` `-datenshi` `-kurikku` `-ezppfarm` `-ainu`', 'taikocard Tienei')
            addhelp('ctbcard', 'ctbcard (username)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 525\n`Elite`: Acc >= 525 and Acc < 700\n`Super Rare`: Acc >= 700 and Acc < 825\n`Ultra Rare`: Acc >= 825 and Acc < 900\n`Master`: Acc >= 900', 'Generate a ctb!card (Just for fun)', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nServer suffixes: `-akatsuki` `-ripple` `-gatari` `-enjuu` `-horizon` `-datenshi` `-kurikku` `-ezppfarm` `-ainu`', 'ctbcard Tienei')
            addhelp('maniacard', 'maniacard (username)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 525\n`Elite`: Acc >= 525 and Acc < 700\n`Super Rare`: Acc >= 700 and Acc < 825\n`Ultra Rare`: Acc >= 825 and Acc < 900\n`Master`: Acc >= 900', 'Generate a mania!card (Just for fun)', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nServer suffixes: `-akatsuki` `-ripple` `-gatari` `-enjuu` `-horizon` `-datenshi` `-kurikku` `-ezppfarm` `-ainu`', 'maniacard Tienei')
            addhelp('relaxcard', 'relaxcard (username)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 525\n`Elite`: Acc >= 525 and Acc < 700\n`Super Rare`: Acc >= 700 and Acc < 825\n`Ultra Rare`: Acc >= 825 and Acc < 900\n`Master`: Acc >= 900', 'Generate a relax!card (Just for fun)', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nServer suffixes: `-akatsuki` `-ripple` `-gatari` `-enjuu` `-horizon` `-datenshi` `-kurikku` `-ezppfarm` `-ainu`', 'relaxcard Tienei')
            addhelp('osutop', 'osutop (username) (options)', 'View a player\'s osu!Standard top play', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 or a range of top play from top 100`(Number-Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)\nPage `(-page)`: Get top 100 in a form of pages `(No param)`\nSearch `(-s)`: Search for a specific play in top 100\nAccuracy `(-a)`: Sort player\'stop 100 plays by accuracy\nCombo plays`(-c)`: Sort player\'s top 100 plays by combo\nServer suffixes: `-akatsuki` `-ripple` `-gatari` `-enjuu` `-horizon` `-datenshi` `-kurikku` `-ezppfarm` `-ainu`', 'osutop Tienei -m HDHR -p 25-26 | osutop Tienei -r -page')
            addhelp('taikotop', 'taikotop (username) (options)', 'View a player\'s osu!Taiko top play', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 or a range of top play from top 100`(Number-Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)\nPage `(-page)`: Get top 100 in a form of pages `(No param)`\nSearch `(-s)`: Search for a specific play in top 100\nAccuracy `(-a)`: Sort player\'stop 100 plays by accuracy\nCombo plays`(-c)`: Sort player\'s top 100 plays by combo\nServer suffixes: `-akatsuki` `-ripple` `-gatari` `-enjuu` `-horizon` `-datenshi` `-kurikku` `-ezppfarm` `-ainu`', 'taikotop Tienei -r -page')
            addhelp('ctbtop', 'ctbtop (username) (options)', 'View a player\'s osu!Catch the beat top play', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 or a range of top play from top 100`(Number-Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)\nPage `(-page)`: Get top 100 in a form of pages `(No param)`\nSearch `(-s)`: Search for a specific play in top 100\nAccuracy `(-a)`: Sort player\'stop 100 plays by accuracy\nCombo plays`(-c)`: Sort player\'s top 100 plays by combo\nServer suffixes: `-akatsuki` `-ripple` `-gatari` `-enjuu` `-horizon` `-datenshi` `-kurikku` `-ezppfarm` `-ainu`', 'ctbtop Tienei -p 9')
            addhelp('maniatop', 'maniatop (username) (options)', 'View a player\'s osu!Mania top play', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 or a range of top play from top 100`(Number-Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)\nPage `(-page)`: Get top 100 in a form of pages `(No param)`\nSearch `(-s)`: Search for a specific play in top 100\nAccuracy `(-a)`: Sort player\'stop 100 plays by accuracy\nCombo plays`(-c)`: Sort player\'s top 100 plays by combo\nServer suffixes: `-akatsuki` `-ripple` `-gatari` `-enjuu` `-horizon` `-datenshi` `-kurikku` `-ezppfarm` `-ainu`', 'maniatop Tienei -p 4')
            addhelp('relaxtop', 'relaxtop (username) (options)', 'View a player\'s osu!Relax top play', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 or a range of top play from top 100`(Number-Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)\nPage `(-page)`: Get top 100 in a form of pages `(No param)`\nSearch `(-s)`: Search for a specific play in top 100\nAccuracy `(-a)`: Sort player\'stop 100 plays by accuracy\nCombo plays`(-c)`: Sort player\'s top 100 plays by combo\nServer suffixes: `-akatsuki` `-ripple` `-gatari` `-enjuu` `-horizon` `-datenshi` `-kurikku` `-ezppfarm` `-ainu`', 'relaxtop Tienei -p 4')
            addhelp('osutrack', 'osutrack (username) (options)', 'Track a player\'s osu!Standard top 50 (Required MANAGE\_CHANNELS permission). Default: osu!Std, top 50', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nTop Play `(-p)`: Number of top plays to include in tracking `(1-100)`\nModes/Severs: `-std` `-taiko` `-ctb` `-mania` `-akatsuki` `-ripple` `-gatari` `-enjuu` `-horizon` `-datenshi` `-kurikku` `-ezppfarm` `-ainu`', 'osutrack Tienei')
            addhelp('osutracklist', 'osutracklist', 'Get a list of player being tracked in the channel', 'None', 'osutracklist')
            addhelp('untrack', 'untrack (username) (options)', 'Untrack a player from the database (Required MANAGE\_CHANNELS permission), Default: Remove all player with the name', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nOld Name `(-on)`: Remove an old username from the tracking (Case sensitive)\nServer suffixes: `-akatsuki` `-ripple` `-gatari` `-enjuu` `-horizon` `-datenshi` `-kurikku` `-ezppfarm` `-ainu`', 'untrack Tienei')
            addhelp('recent', '[recent|r|rs] (username) (options)', 'Get player\'s most recent play', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nRecent Best `(-b)`: Get player most recent best from top 100 `(No param)`\nRecent List `(-l)`: Get player most recent plays\nModes/Servers: `-std` `-taiko` `-ctb` `-mania` `-rx` `-akatsuki` `-ripple` `-gatari` `-enjuu` `-horizon` `-datenshi` `-kurikku` `-ezppfarm` `-ainu`', 'r Tienei -akat -mania')
            addhelp('compare', '[compare|c] (username) ', 'Compare to the last play in the chat', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nPrevious Play `(-p)`: Get a previous play mentioned in the chat `(Number)`\nModes/Servers: `-std` `-taiko` `-ctb` `-mania` `-rx` `-akatsuki` `-ripple` `-gatari` `-enjuu` `-horizon` `-datenshi` `-kurikku` `-ezppfarm` `-ainu`', 'c Tienei')
            addhelp('osuset', 'osuset (username)', 'Link your profile to an osu! player', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nServer suffixes: `-akatsuki` `-ripple` `-gatari` `-enjuu` `-horizon` `-datenshi` `-kurikku` `-ezppfarm` `-ainu`', 'osuset Tienei')
            addhelp('osuavatar', 'osuavatar (username)', 'Get player\'s osu! avatar', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'osuavatar Tienei')
            addhelp('map', '[map|m] (options)', 'Get details info of the map of the last play in the server\nLeaderboard `(-l)`: Get the leaderboard of the map of the last play in the server', 'Mods: details info of the map with mods `(Shorten mods)`', 'm HDDT')
            addhelp('scores', '[scores|sc] (map link) (username)', 'Get player\'s play on a specific map', 'Map link: Just get a beatmap link\nusername: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'scores https://osu.ppy.sh/b/1157868 Cookiezi')
            addhelp('donate', 'donate', 'Creator\'s donation link', '', 'donate')
        }
        let generalhelp = '**[General]:** `avatar` `changelog` `help` `ping` `report` `suggestion` `invite` `server` `prefix`'
        let funhelp = '**[Fun]:** `hug` `cuddle` `slap` `kiss` `pat` `poke` `cry` `blush` `pout` `trivia`'
        let osuhelp = '**[osu!]:** `banchoping` `osu` `taiko` `ctb` `mania` `relax` `osutop` `taikotop` `ctbtop` `maniatop` `relaxtop` `osutrack` `untrack` `osutracklist` `map` `osuset` `osuavatar` `recent` `compare` `scores` `osucard` `taikocard` `ctbcard` `maniacard`'
        let text = ''
        if (msg.substring(command.length+1) == '') {
            text = `**[Donate]:** \`donate\`\n${generalhelp}\n${funhelp}\n${osuhelp}\n\nFor more detailed infomation, type **${prefix}help (command)**\nIf you forgot the prefix, remember: **<Ping the bot> check_prefix**\n\`Consider donating!:\` [donate](https://ko-fi.com/tienei)`
        } else {
            let getcmd = msg.substring(command.length+1)
            if (bot_command_help.find(helpcmd => helpcmd.command).helptext == undefined) {
                throw 'No command was found!'
            }
            if (getcmd == 'c')             getcmd = 'compare';
            if (getcmd == 'm')             getcmd = 'map';
            if (getcmd == 'sc')            getcmd = 'scores';
            if (getcmd == 'top')           getcmd = 'osutop';
            if (getcmd == 'card')          getcmd = 'osucard';
            if (getcmd == 'r' || getcmd == 'rs') getcmd = 'recent';

            text = bot_command_help.find(helpcmd => helpcmd.command == getcmd).helptext
            for (let i = 0; i < 2; i++) {
                text = text.replace('{prefix}', prefix)
            }
        }
        const embed = new MessageEmbed()
        .setAuthor(`Commands for Tiny Bot ${config.bot_ver}`)
        .setColor(embedcolor)
        .setThumbnail(message.client.user.avatarURL({format: 'png', size: 512}))
        .setDescription(text);
        message.channel.send({embed})
    } catch (error) {
        message.channel.send(String(error))
    }
}

module.exports = {
    avatar,
    ping,
    checkperm,
    bug_and_suggest,
    childProc_bug_and_suggest,
    changelog,
    donate,
    bot_link,
    prefix,
    help
}