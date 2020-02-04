const bot = require('./../client').bot
const bot_ver = require('./../config').bot_ver
const bot_prefix = require('./../config').bot_default_prefix
const fx = require('./../Functions/load_fx')
const { Message, RichEmbed } = require('discord.js')

var bot_command_help = []

function help(message = new Message()) {
    try {
        let msg = message.content.toLowerCase();
        let embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)
        function addhelp(helpcommand, fullcommand, description, option, example) {
            let helptext = '```' + `{prefix}` + fullcommand + '```' + `\n${description}\n\n**---[Options]:**\n${option}\n\n**---[Example]:**\n` + `{prefix}`+ example
            bot_command_help.push({command: helpcommand, helptext: helptext})
        }
        if (bot_command_help.length < 1) {
            addhelp('avatar', 'avatar (user)', 'View a user\'s discord avatar', 'user: User you want to view (Has to be @user)', 'avatar @Tienei#0000')
            addhelp('credit', 'credit', 'A list of users who has helped the bot to grow!', 'None', 'credit')
            addhelp('changelog', 'changelog', 'View update and fix for the bot', 'None', 'changelog')
            addhelp('help', 'help (command)', 'Get a full command list or view a specific command help', 'command: Command help you wanted to see', 'help osu')
            addhelp('ping', 'ping', 'Ping Bancho (probably making Bancho mad sometimes lol)\n100ms: Good\n200ms: OK\n300ms: Bad\n600ms: Pretty bad', 'None', 'ping')
            addhelp('report', 'report (error)', 'Report an error or bug to the owner', 'error: Type any error or bug you found', 'report osu is broken')
            addhelp('suggestion', 'suggestion (suggestion)', 'Suggesting an idea for the bot to the owner', 'error: Type any error or bug you found', 'report osu is broken')
            addhelp('bot', 'bot', 'Get invitation of the bot', 'None', 'bot')
            addhelp('checkcomp', 'checkcomp', 'Check the compatibility of the bot to the server permissions', 'None', 'checkcomp')
            addhelp('prefix', 'prefix (prefix)', 'Change the prefix for the entire server', 'prefix: The prefix you wanted', 'prefix >')
            addhelp('ee', 'ee', 'View how many easter eggs you have', 'None', 'ee')
            addhelp('customcmd', 'customcmd (action) (command)', 'Set a custom commands (Required Administration)', 'action: ``add`` ``list`` ``remove``\ncommand: Set a command you liked (do ``!help definedvar`` for more information)', 'customcmd add !hi Hello $0 and welcome to {server.name}')
            addhelp('hug', 'hug (user)', 'Hug someone', 'user: The name of the user (Discord)', 'hug Tienei')
            addhelp('cuddle', 'cuddle (user)', 'Cuddle someone', 'user: The name of the user (Discord)', 'cuddle Tienei')
            addhelp('slap', 'slap (user)', 'Slap someone', 'user: The name of the user (Discord)', 'slap Tienei')
            addhelp('kiss', 'kiss (user)', 'Kiss someone (best not to kiss in public ;) )', 'user: The name of the user (Discord)', 'kiss Tienei')
            addhelp('pat', 'pat (user)', 'Pat someone', 'user: The name of the user (Discord)', 'pat Tienei')
            addhelp('poke', 'poke (user)', 'Poke someone', 'user: The name of the user (Discord)', 'poke Tienei')
            addhelp('cry', 'cry', 'Crying.', 'None', 'cry')
            addhelp('blush', 'blush', 'Blushing.', 'None', 'blush')
            addhelp('pout', 'pout', 'Pouting.', 'None', 'pout')
            addhelp('trivia', 'trivia', 'Ask you a fun trivia questions (either a multiple question or true/false question)', 'None', 'trivia')
            addhelp('osu', 'osu (username) (options)', 'Get an osuStandard profile', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the details of the player `(no param)`\nRank `(-rank)`: Get an osu!Standard profile by rank\nTop Skills `(-ts)`: Calculate player skill using bot formula', 'osu Tienei -d')
            addhelp('taiko', 'taiko (username)', 'Get an osu!Taiko profile', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'taiko Tienei')
            addhelp('ctb', 'ctb (username)', 'Get an osu!Catch the beat profile', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'ctb Tienei')
            addhelp('mania', 'mania (username)', 'Get an osu!Mania profile', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'mania Tienei')
            addhelp('osucard', 'osucard (username)', 'Generate an osu!card (Just for fun)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 500\n`Elite`: Acc >= 500 and Acc < 650\n`Super Rare`: Acc >= 650 and Acc < 750\n`Ultra Rare`: Acc >= 750', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'osucard Tienei')
            addhelp('taikocard', 'taikocard (username)', 'Generate a taiko!card (Just for fun)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 500\n`Elite`: Acc >= 500 and Acc < 650\n`Super Rare`: Acc >= 650 and Acc < 750\n`Ultra Rare`: Acc >= 750', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'taikocard Tienei')
            addhelp('ctbcard', 'ctbcard (username)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 500\n`Elite`: Acc >= 500 and Acc < 650\n`Super Rare`: Acc >= 650 and Acc < 750\n`Ultra Rare`: Acc >= 750', 'Generate a ctb!card (Just for fun)', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'ctbcard Tienei')
            addhelp('maniacard', 'maniacard (username)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 500\n`Elite`: Acc >= 500 and Acc < 650\n`Super Rare`: Acc >= 650 and Acc < 750\n`Ultra Rare`: Acc >= 750', 'Generate a mania!card (Just for fun)', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'maniacard Tienei')
            addhelp('osustatus', 'osustatus', 'Check osu current status (Information from @osustatus twitter)', 'one', '!osustatus')
            addhelp('osutop', 'osutop (username) (options)', 'View a player\'s osu!Standard top play', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)\nPage `(-page)`: Get top 100 in a form of pages `(No param)`\nSearch `(-s)`: Search for a specific play in top 100\nAccuracy `(-a)`: Sort player\'stop 100 plays by accuracy', 'osutop Tienei -m HDHR')
            addhelp('taikotop', 'taikotop (username) (options)', 'View a player\'s osu!Taiko top play', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)\nPage `(-page)`: Get top 100 in a form of pages `(No param)`\nSearch `(-s)`: Search for a specific play in top 100\nAccuracy `(-a)`: Sort player\'stop 100 plays by accuracy', 'taikotop Tienei -p 8')
            addhelp('ctbtop', 'ctbtop (username) (options)', 'View a player\'s osu!Catch the beat top play', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)\nPage `(-page)`: Get top 100 in a form of pages `(No param)`\nSearch `(-s)`: Search for a specific play in top 100\nAccuracy `(-a)`: Sort player\'stop 100 plays by accuracy', 'ctbtop Tienei -p 9')
            addhelp('maniatop', 'maniatop (username) (options)', 'View a player\'s osu!Mania top play', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)\nPage `(-page)`: Get top 100 in a form of pages `(No param)`\nSearch `(-s)`: Search for a specific play in top 100\nAccuracy `(-a)`: Sort player\'stop 100 plays by accuracy', 'maniatop Tienei -p 4')
            addhelp('osutrack', 'osutrack (username)', 'Track a player\'s osu!Standard top 50 (Required Administration)', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'osutrack Tienei')
            addhelp('osutracklist', 'osutracklist', 'Get a list of player being tracked in the channel', 'None', 'osutracklist')
            addhelp('untrack', 'untrack (username)', 'Untrack a player from the database (Required Administration)', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'untrack Tienei')
            addhelp('recent', '[recent|r] (username) (options)', 'Get player\'s most recent play', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nRecent Best `(-b)`: Get player most recent best from top 100 `(No param)`\nRecent List `(-l)`: Get player 5 most recent plays\nModes/Servers: `-std` `-taiko` `-ctb` `-mania` `-akat` `-rxakat` `-ripple`', 'r Tienei -b')
            addhelp('compare', '[compare|c] (username) ', 'Compare to the last play in the chat', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nPrevious Play `(-p)`: Get a previous play mentioned in the chat `(Number)`', 'c Tienei')
            addhelp('osuset', 'osuset (username)', 'Link your profile to an osu! player', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'osuset Tienei')
            addhelp('osuavatar', 'osuavatar (username)', 'Get player\'s osu! avatar', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'osuavatar Tienei')
            addhelp('map', '[map|m] (options)', 'Get details info of the map of the last play in the server\nLeaderboard `(-l)`: Get the leaderboard of the map of the last play in the server', 'Mods: details info of the map with mods `(Shorten mods)`', 'm HDDT')
            addhelp('topglobal', 'topglobal', 'Get a list of top 50 osu!Standard player', '', 'topglobal')
            addhelp('topcountry', 'topcountry (country code)', 'Get a list of top 50 osu!Standard player of a country', 'country code: You can see a list right here: https://en.wikipedia.org/wiki/List_of_ISO_3166_country_codes (Look at ISO 3166-1, Alpha-2 code)', 'topcountry US')
            addhelp('scores', 'scores (map link) (username)', 'Get player\'s play on a specific map', 'Map link: Just get a beatmap link\nusername: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'scores https://osu.ppy.sh/b/1157868 Cookiezi')
            addhelp('acc', 'acc (300) (100) (50) (miss)', 'Accuracy calculator', '**Needs all options to be calculated**', 'acc 918 23 2 0')
            addhelp('rec', 'rec', 'Recommend you an osu beatmap', 'None', '!rec')
            addhelp('leaderboard', 'leaderboard', 'Get a list of top player in the server\nNote: The player stats will only be updated if the you type **!osu** or a specific player **!osu (player name)** only if they in the server', 'None', 'leaderboard')
            addhelp('akatsuki', 'akatsuki (username) (options)', 'Get an Akatuski Standard profile', 'username: Akatsuki username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'akatsuki Tienei -d')
            addhelp('akatsukiset', 'akatsuki (username)', 'Link your profile to an Akatsuki player', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'akatsukiset Tienei')
            addhelp('akattop', 'akattop (username) (options)', 'View a player\'s Akatsuki Standard top play', 'username: Akatsuki username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`', 'akattop Tienei -p 8')
            addhelp('akatavatar', 'akatavatar (username)', 'Get player\'s Akatsuki avatar', 'username: Akatsuki username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'akatavatar Tienei')
            addhelp('akatsukiset', 'akatsukiset (username)', 'Link your profile to an Akatsuki player', 'username: Akatsuki username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'akatsukiset RelaxTiny')
            addhelp('rxakatsuki', 'rxakatsuki (username) (options)', 'Get a Relax Akatuski Standard profile', 'username: Akatsuki username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetails `(-d)`: Get all the details of the player `(no param)`', 'akatsuki Tienei -d')
            addhelp('rxakattop', 'rxakattop (username) (options)', 'View a player\'s Relax Akatsuki Standard top play', 'username: Akatsuki username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`', 'rxakattop Tienei -p 8')
            addhelp('ripple', 'ripple (username) (options)', 'Get an  Ripple Standard profile', 'username: Ripple username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'ripple Tienei -d')
            addhelp('rippleset', 'rippleset (username)', 'Link your profile to an Ripple player', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'rippleset Tienei')
            addhelp('rippletop', 'rippletop (username) (options)', 'View a player\'s Ripple Standard top play', 'username: Ripple username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`', 'rippletop Tienei -p 8')
            addhelp('rippleavatar', 'rippleavatar (username)', 'Get player\'s Ripple avatar', 'username: Ripple username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'rippleavatar Tienei')
            addhelp('rippleset', 'rippleset (username)', 'Link your profile to a Ripple player', 'username: Ripple username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'rippleset RelaxTiny')
            addhelp('definevar', 'Defined Variable for Custom command', 'user: ``selfname`` ``selfping`` ``selfcreatedtime`` ``selfpresence`` ``othercreatedtime`` ``otherpresence`` channel: ``selfname`` ``selflink`` ``members`` server: ``name`` ``members`` ``channels`` ``roles`` ``defaultchannel`` ``owner`` ``region`` ``createdtime``', '{require:admin}: Need Administrator to enable the command {$N}: Get text in message seperated by space (Not include command) {send:channelname "message"}: Send to a channel with a specific message', 'do ``!help customcmd``')
            addhelp('osu -d calculation', 'Osu -d calculation', 'Star: Avg stars of the top 50 plays\nAim: Aim stars play * (CS ^ 0.1 / 4 ^ 0.1)\nSpeed: Speed stars play * (BPM ^ 0.3 / 180 ^ 0.3) * (AR ^ 0.1 / 6 ^ 0.1)\nAccuracy: (Plays accuracy ^ 2.5 / 100 ^ 2.5) * 1.08 * Map stars * (OD ^ 0.03 / 6 ^ 0.03) * (HP ^ 0.03 / 6 ^ 0.03)', 'None', 'None')
        }
        var generalhelp = '**--- [General]:**\n`avatar` `credit` `changelog` `help` `ping` `report` `suggestion` `ee` `customcmd` `bot` `prefix` `checkbot`'
        var funhelp = '**--- [Fun]:**\n`hug` `cuddle` `slap` `kiss` `pat` `poke` `cry` `blush` `pout` `trivia`'
        var osuhelp = '**--- [osu!]:**\n`osu` `taiko` `ctb` `mania` `osutop` `taikotop` `ctbtop` `maniatop` `osutrack` `untrack` `osutracklist` `map` `osuset` `osuavatar` `recent` `compare` `scores` `acc` `topglobal` `topcountry` `leaderboard` `osucard` `taikocard` `ctbcard` `maniacard`'
        var akatsukihelp = '**--- [Akatsuki]:**\n`akatsuki` `akatsukiset` `akatavatar` `akattop` `rxakatsuki` `rxakattop`'
        var ripplehelp = '**--- [Ripple]:**\n`ripple` `rippleset` `rippleavatar` `rippletop`'
        var otherhelp = '**--- [Other]:**\n`definevar` `osu -d calculation`'
        var text = ''
        if (msg.substring(6) == '') {
            text = `${generalhelp}\n\n${funhelp}\n\n${osuhelp}\n\n${akatsukihelp}\n\n${ripplehelp}\n\n${otherhelp}\n\nFor more detailed infomation, type **${bot_prefix}help (command)**`
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
            for (var i = 0; i < 2; i++) {
                text = text.replace('{prefix}', bot_prefix)
            }
        }
        const embed = new RichEmbed()
        .setAuthor(`Commands for Tiny Bot ${bot_ver}`)
        .setColor(embedcolor)
        .setThumbnail(bot.user.avatarURL)
        .setDescription(text)
        message.channel.send({embed})
    } catch (error) {
        //message.channel.send(String(error))
        console.log(error)
    }
}

function credit(message = new Message()) {
    let embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)
    const embed = new RichEmbed()
    .setAuthor(`Special thanks to:`)
    .setColor(embedcolor)
    .setThumbnail(bot.user.avatarURL)
    .setDescription(`
**--- Special helper ❤:**
Great Fog (!m, partial !osud, !acc, total pp in !osud, v3, !osutop -a)
**--- Command idea from:**
Yeong Yuseong (!calcpp, !compare sorted by pp, !r Map completion, !osutop -p with ranges, !suggestion, !osu -d common mods, !c -p, !osutop -s), 1OneHuman (!mosutop, !rosutop, !scores), Shienei (!c Unranked pp calculation), jpg (Time ago), lokser (!osu -d length avg), Xpekade (Economy), Rimu (new !osu design), zibi (!topglobal, !topcountry), PotatoBoy123 (!lb)
**--- Tester:**
ReiSevia, Shienei, FinnHeppu, Hugger, rinku, Rosax, -Seoul`)
    message.channel.send({embed})
}

function avatar(message = new Message()) {
    let embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)
    let user = fx.general.find_discord_user(message, message.content.substring(8))
    let username = user.username
    let image = user.avatarURL
    const embed = new RichEmbed()
    .setAuthor(`Avatar for ${username}`)
    .setColor(embedcolor)
    .setImage(image)
    message.channel.send({embed})
}

function changelog(message = new Message()) {
    let embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)
    let changes = [`**[February 4th, 2020]:**
--- **Update:**
Rewriting bot's code, making all osu private server works together nicely
Merging Akatsuki, Ripple and Bancho command code
Moving user data to a new database
Improved commands latency respond (!osutop -p, -r, -m; !r -b)
Improved tracking latency
Better suffixes check
Makes osucard rarity based on acc
Makes Akatsuki and Ripple use the same text overlay as Bancho
Changed mod abbreviation 
Added trivia
Added commas in score/playcount (osu -d and every other commands that had scores)
Added recent -l
Added osutop -a, akattop -r, rippletop -r
Added compare -p
Added map -l
Added approval status for beatmap
Added legendary osucard`, `Moved akatr, rxakatr, rippler to recent (-akat, -rxakat, -ripple)
Removed akatsuki -d, !ripple -d (for now)
Removed osusig
--- **Bug fixes:**
Mirror mods appears as no mod in mania
Fixed "DTNC" and "SDPF" mods
Fixed "undefined" prefix
Fixed help commands display
Fixed recent wrong time display
Fixed osuavatar won't get osu! avatar
Fixed avatar won't get Discord avatar
Fixed beatmapid cache
Fixed osutop -m`]

    let loadpage = async function (page, pages) {
        pages = changes
        return pages
    }
    fx.general.page_system(message, {load: loadpage}, `Changelog for TinyBot ${bot_ver} (Page {page} of {max_page})`, message.client.user.avatarURL, embedcolor, changes.length)
}

function bot_info(message = new Message()) {
    let embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)
    const embed = new RichEmbed()
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

function prefix(message = new Message(), server_data) {
    try {
        let msg = message.content.toLowerCase();
        let command = msg.split(' ')[0]
        if (message.member.hasPermission("MANAGE_CHANNELS") == false) {
            throw 'You need to have `MANAGE_CHANNELS` permission to set prefix'
        }
        if (fx.general.cmd_cooldown.cooldown[message.author.id] !== undefined && fx.general.cmd_cooldown.cooldown[message.author.id].indexOf(command) !== -1) {
            throw 'You need to wait 30 seconds before using this again!'
        }
        fx.general.cmd_cooldown.set(message, command, 30000)
        let new_prefix = msg.split(' ')[1]
        if (new_prefix == undefined) {
            throw "You need to specify what prefix the bot should be"
        }
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
        return server_data
    } catch (error) {
        message.channel.send(String(error))
    }
}

function report(message = new Message()) {
    try {
        let msg = message.content.toLowerCase();
        let command = msg.split(' ')[0]
        let embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)
        if (fx.general.cmd_cooldown.cooldown[message.author.id] !== undefined && fx.general.cmd_cooldown.cooldown[message.author.id].indexOf(command) !== -1) {
            throw 'You need to wait 30 seconds before using this again!'
        }
        fx.general.cmd_cooldown.set(message, command, 30000)
        let error = message.content.substring(8)
        if (error == '') {
            throw "Type an error"
        }
        let channelid = message.channel.id
        let user = message.author.username
        let pfp = message.author.avatarURL
        const embed = new RichEmbed()
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

function suggestion(message = new Message()) {
    try {
        let msg = message.content.toLowerCase();
        let command = msg.split(' ')[0]
        let embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)
        if (fx.general.cmd_cooldown.cooldown[message.author.id] !== undefined && fx.general.cmd_cooldown.cooldown[message.author.id].indexOf(command) !== -1) {
            throw 'You need to wait 30 seconds before using this again!'
        }
        fx.general.cmd_cooldown.set(message, command, 30000)
        let suggestion = message.content.substring(12)
        if (suggestion == '') {
            throw 'Type a suggestion for the bot'
        }
        let channelid = message.channel.id
        let user = message.author.username
        let pfp = message.author.avatarURL
        const embed = new RichEmbed()
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

function checkcomp(message = new Message()) {
    let embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)
    let compatibility = []
    let permissions = ['SEND_MESSAGES', 'ATTACH_FILES', 'ADD_REACTIONS', 'EMBED_LINKS', 'READ_MESSAGE_HISTORY', 'USE_EXTERNAL_EMOJIS']
    for (var i in permissions) {
        if (message.guild.me.hasPermission(permissions[i]) == true) {
            compatibility.push('✅')
        } else {
            compatibility.push('❌')
        }
    }
    const embed = new RichEmbed()
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

module.exports = {
    help,
    credit,
    avatar,
    changelog,
    bot_info,
    prefix,
    report,
    suggestion,
    checkcomp
}