const bot = require('./../client').bot
const config = require('../config')
const fx = require('./../Functions/load_fx')
const package = require('../package.json')
const { Message, MessageEmbed } = require('discord.js-light')

let bot_command_help = []

function help(message = new Message(), command) {
    try {
        let msg = message.content.toLowerCase();
        let embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)
        function addhelp(helpcommand, fullcommand, description, option, example) {
            let helptext = '```' + `{prefix}` + fullcommand + '```' + `\n${description}\n\n**---[Options]:**\n${option}\n\n**---[Example]:**\n` + `{prefix}`+ example
            bot_command_help.push({command: helpcommand, helptext: helptext})
        }
        if (bot_command_help.length < 1) {
            addhelp('avatar', 'avatar (user)', 'Sends the mentioned user\'s Discord avatar to the channel', 'user: The User you want to get the avatar from (Has to be @user)', 'avatar @Tienei#0000')
            addhelp('credit', 'credit', 'A list of users who have helped the bot to grow!', 'None', 'credit')
            addhelp('changelog', 'changelog', 'View updates and fixes of the bot', 'None', 'changelog')
            addhelp('help', 'help (command)', 'Get the full list of commands or get more information about the one you specify', 'command: Command help you wanted to see', 'help osu')
            addhelp('ping', 'ping', 'Connection between the bot and Discord', 'None', 'ping')
            addhelp('banchoping', 'banchoping', 'Ping Bancho (probably making Bancho mad sometimes lol)\n100ms: Good\n200ms: OK\n300ms: Bad\n600ms: Pretty bad', 'None', 'banchoping')
            addhelp('report', 'report (error)', 'Report an error or bug to my owner', 'error: Type any error or bug you found', 'report osu is broken')
            addhelp('suggestion', 'suggestion (suggestion)', 'Suggest an idea for the bot to the owner', 'suggestion: Type any suggestion you wanted to add', 'add somecommand to the bot')
            addhelp('bot', 'bot', 'Get invitation link of the bot', 'None', 'bot')
            addhelp('checkcomp', 'checkcomp', 'Check the permissions of the bot', 'None', 'checkcomp')
            addhelp('prefix', 'prefix (prefix)', 'Changes my prefix in the server', 'prefix: The prefix you wanted', 'prefix >')
            addhelp('ee', 'ee', 'View how many easter eggs you have found', 'None', 'ee')
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
            addhelp('osu', 'osu (username) (options)', 'Get an osuStandard profile', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the details of the player `(no param)`\nRank `(-rank)`: Get an osu!Standard profile by rank\nTop Skills `(-ts)`: Calculate player skill using bot formula\nAcc Top Skills `(-accts)`: Calculate player acc skill using bot formula\nServer suffixes: `-akatsuki` `-ripple` `-gatari` `-enjuu` `-horizon`', 'osu Tienei -d')
            addhelp('taiko', 'taiko (username)', 'Get an osu!Taiko profile', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the details of the player `(no param)`\nRank `(-rank)`: Get an osu!Standard profile by rank\nTop Skills `(-ts)`: Calculate player skill using bot formula\nAcc Top Skills `(-accts)`: Calculate player acc skill using bot formula\nServer suffixes: `-akatsuki` `-ripple` `-gatari` `-enjuu` `-horizon`', 'taiko Tienei')
            addhelp('ctb', 'ctb (username)', 'Get an osu!Catch the beat profile', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the details of the player `(no param)`\nRank `(-rank)`: Get an osu!Standard profile by rank\nTop Skills `(-ts)`: Calculate player skill using bot formula\nAcc Top Skills `(-accts)`: Calculate player acc skill using bot formula\nServer suffixes: `-akatsuki` `-ripple` `-gatari` `-enjuu` `-horizon`', 'ctb Tienei')
            addhelp('mania', 'mania (username)', 'Get an osu!Mania profile', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the details of the player `(no param)`\nRank `(-rank)`: Get an osu!Standard profile by rank\nTop Skills `(-ts)`: Calculate player skill using bot formula\nAcc Top Skills `(-accts)`: Calculate player acc skill using bot formula\nServer suffixes: `-akatsuki` `-ripple` `-gatari` `-enjuu` `-horizon`', 'mania Tienei')
            addhelp('relax', 'relax (username)', 'Get an osu!Relax profile (Only if a server support relax, else return error)', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the details of the player `(no param)`\nRank `(-rank)`: Get an osu!Standard profile by rank\nTop Skills `(-ts)`: Calculate player skill using bot formula\nAcc Top Skills `(-accts)`: Calculate player acc skill using bot formula\nServer suffixes: `-akatsuki` `-ripple` `-gatari` `-enjuu` `-horizon`', 'relax Tienei')
            addhelp('osucard', 'osucard (username)', 'Generate an osu!card (Just for fun)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 525\n`Elite`: Acc >= 525 and Acc < 700\n`Super Rare`: Acc >= 700 and Acc < 825\n`Ultra Rare`: Acc >= 825 and Acc < 900\n`Master`: Acc >= 900', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nServer suffixes: `-akatsuki` `-ripple` `-gatari` `-enjuu` `-horizon`', 'osucard Tienei')
            addhelp('taikocard', 'taikocard (username)', 'Generate a taiko!card (Just for fun)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 525\n`Elite`: Acc >= 525 and Acc < 700\n`Super Rare`: Acc >= 700 and Acc < 825\n`Ultra Rare`: Acc >= 825 and Acc < 900\n`Master`: Acc >= 900', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nServer suffixes: `-akatsuki` `-ripple` `-gatari` `-enjuu` `-horizon`', 'taikocard Tienei')
            addhelp('ctbcard', 'ctbcard (username)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 525\n`Elite`: Acc >= 525 and Acc < 700\n`Super Rare`: Acc >= 700 and Acc < 825\n`Ultra Rare`: Acc >= 825 and Acc < 900\n`Master`: Acc >= 900', 'Generate a ctb!card (Just for fun)', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nServer suffixes: `-akatsuki` `-ripple` `-gatari` `-enjuu` `-horizon`', 'ctbcard Tienei')
            addhelp('maniacard', 'maniacard (username)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 525\n`Elite`: Acc >= 525 and Acc < 700\n`Super Rare`: Acc >= 700 and Acc < 825\n`Ultra Rare`: Acc >= 825 and Acc < 900\n`Master`: Acc >= 900', 'Generate a mania!card (Just for fun)', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nServer suffixes: `-akatsuki` `-ripple` `-gatari` `-enjuu` `-horizon`', 'maniacard Tienei')
            addhelp('relaxcard', 'relaxcard (username)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 525\n`Elite`: Acc >= 525 and Acc < 700\n`Super Rare`: Acc >= 700 and Acc < 825\n`Ultra Rare`: Acc >= 825 and Acc < 900\n`Master`: Acc >= 900', 'Generate a relax!card (Just for fun)', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nServer suffixes: `-akatsuki` `-ripple` `-gatari` `-enjuu` `-horizon`', 'relaxcard Tienei')
            addhelp('osustatus', 'osustatus', 'Check osu current status (Information from @osustatus twitter)', 'one', '!osustatus')
            addhelp('osutop', 'osutop (username) (options)', 'View a player\'s osu!Standard top play', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)\nPage `(-page)`: Get top 100 in a form of pages `(No param)`\nSearch `(-s)`: Search for a specific play in top 100\nAccuracy `(-a)`: Sort player\'stop 100 plays by accuracy\nServer suffixes: `-akatsuki` `-ripple` `-gatari` `-enjuu` `-horizon`', 'osutop Tienei -m HDHR')
            addhelp('taikotop', 'taikotop (username) (options)', 'View a player\'s osu!Taiko top play', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)\nServer suffixes: `-akatsuki` `-ripple` `-gatari` `-enjuu` `-horizon`', 'taikotop Tienei -p 8')
            addhelp('ctbtop', 'ctbtop (username) (options)', 'View a player\'s osu!Catch the beat top play', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)\nServer suffixes: `-akatsuki` `-ripple` `-gatari` `-enjuu` `-horizon`', 'ctbtop Tienei -p 9')
            addhelp('maniatop', 'maniatop (username) (options)', 'View a player\'s osu!Mania top play', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)\nServer suffixes: `-akatsuki` `-ripple` `-gatari` `-enjuu` `-horizon`', 'maniatop Tienei -p 4')
            addhelp('relaxtop', 'relaxtop (username) (options)', 'View a player\'s osu!Relax top play', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)\nServer suffixes: `-akatsuki` `-ripple` `-gatari` `-enjuu` `-horizon`', 'relaxtop Tienei -p 4')
            addhelp('osutrack', 'osutrack (username) (options)', 'Track a player\'s osu!Standard top 50 (Required MANAGE\_CHANNELS permission). Default: osu!Std, top 50', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nTop Play `(-p)`: Number of top plays to include in tracking `(1-100)`\nModes/Severs: `-std` `-taiko` `-ctb` `-mania` `-ripple` `-akat` `-rxakat` `-hrz` `-rxhrz`', 'osutrack Tienei')
            addhelp('osutracklist', 'osutracklist', 'Get a list of player being tracked in the channel', 'None', 'osutracklist')
            addhelp('untrack', 'untrack (username) (options)', 'Untrack a player from the database (Required MANAGE\_CHANNELS permission), Default: Remove all player with the name', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nBancho `(-bc)`: Remove a Bancho player with the name from tracking\nRipple `(-rp)`: Remove a Ripple player with the name from tracking\nAkatsuki `(-akat)`: Remove an Akatsuki player with the name from tracking\nHorizon `(-hrz)`: Remove a Horizon player with the name from tracking\nOld Name `(-on)`: Remove an old username from the tracking (Case sensitive)', 'untrack Tienei')
            addhelp('recent', '[recent|r] (username) (options)', 'Get player\'s most recent play', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nRecent Best `(-b)`: Get player most recent best from top 100 `(No param)`\nRecent List `(-l)`: Get player 5 most recent plays\nModes/Servers: `-std` `-taiko` `-ctb` `-mania` `-akatsuki` `-ripple` `-horizon` `-enjuu` `-gatari` `-rx`', 'r Tienei -akat -mania')
            addhelp('compare', '[compare|c] (username) ', 'Compare to the last play in the chat', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nPrevious Play `(-p)`: Get a previous play mentioned in the chat `(Number)`\nModes/Servers: `-std` `-taiko` `-ctb` `-mania` `-akat` `-rxakat` `-ripple` `-hrz` `-rxhrz` `-enjuu` `-gatari`', 'c Tienei')
            addhelp('osuset', 'osuset (username)', 'Link your profile to an osu! player', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nServer suffixes: `-akatsuki` `-ripple` `-gatari` `-enjuu` `-horizon`', 'osuset Tienei')
            addhelp('osuavatar', 'osuavatar (username)', 'Get player\'s osu! avatar', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'osuavatar Tienei')
            addhelp('map', '[map|m] (options)', 'Get details info of the map of the last play in the server\nLeaderboard `(-l)`: Get the leaderboard of the map of the last play in the server', 'Mods: details info of the map with mods `(Shorten mods)`', 'm HDDT')
            addhelp('topglobal', 'topglobal', 'Get a list of top 50 osu!Standard player', '', 'topglobal')
            addhelp('topcountry', 'topcountry (country code)', 'Get a list of top 50 osu!Standard player of a country', 'country code: You can see a list right here: https://en.wikipedia.org/wiki/List_of_ISO_3166_country_codes (Look at ISO 3166-1, Alpha-2 code)', 'topcountry US')
            addhelp('scores', 'scores (map link) (username)', 'Get player\'s play on a specific map', 'Map link: Just get a beatmap link\nusername: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'scores https://osu.ppy.sh/b/1157868 Cookiezi')
            addhelp('acc', 'acc (300) (100) (50) (miss)', 'Accuracy calculator', '**Needs all options to be calculated**', 'acc 918 23 2 0')
            addhelp('leaderboard', 'leaderboard', 'Get a list of top player in the server\nNote: The player stats will only be updated if the you type **!osu** or a specific player **!osu (player name)** only if they in the server', 'None', 'leaderboard')
            addhelp('corona', 'corona', 'Check the stats for current corona virus pandemic\n`Total Cases`: Total corona virus cases in a country\n:bed:: Active cases in a country (Still ill)\n:skull:: Total deaths in a country\n:green_heart:: Total recoveries in a country', 'None', 'corona')
            addhelp('donate', 'donate', 'Creator\'s donation link', '', 'donate')
        }
        let generalhelp = '**[General]:** `avatar` `credit` `changelog` `help` `ping` `report` `suggestion` `ee` `bot` `prefix` `corona` `checkperm` `donate` '
        let funhelp = '**[Fun]:** `hug` `cuddle` `slap` `kiss` `pat` `poke` `cry` `blush` `pout` `trivia`'
        let osuhelp = '**[osu!]:** `banchoping` `osu` `taiko` `ctb` `mania` `relax` `osutop` `taikotop` `ctbtop` `maniatop` `relaxtop` `osutrack` `untrack` `osutracklist` `map` `osuset` `osuavatar` `recent` `compare` `scores` `acc` `topglobal` `topcountry` `leaderboard` `osucard` `taikocard` `ctbcard` `maniacard`'
        let text = ''
        if (msg.substring(command.length+1) == '') {
            text = `${generalhelp}\n${funhelp}\n${osuhelp}\n\nFor more detailed infomation, type **${config.config.bot_prefix}help (command)**\nIf you forgot the prefix, remember: **<Ping the bot> check_prefix**\nConsider donating if you like the bot and help the creator: [donate](https://ko-fi.com/tienei)`
        } else {
            let getcmd = msg.substring(command.length+1)
            if (bot_command_help.find(helpcmd => helpcmd.command).helptext == undefined) {
                throw 'No command was found!'
            }
            if (getcmd == 'c')             getcmd = 'compare';
            if (getcmd == 'm')             getcmd = 'map';
            if (getcmd == 'bg')            getcmd = 'background';
            if (getcmd == 'lb')            getcmd = 'leaderboard';
            if (getcmd == 'akattop')       getcmd = 'akatsukitop';
            if (getcmd == 'taikoakattop')  getcmd = 'taikoakatsukitop';
            if (getcmd == 'ctbakattop')    getcmd = 'ctbakatsukitop';
            if (getcmd == 'maniaakattop')  getcmd = 'maniaakatsukitop';
            if (getcmd == 'akatcard')      getcmd = 'akatsukicard';
            if (getcmd == 'taikoakatcard') getcmd = 'taikoakatsukicard';
            if (getcmd == 'ctbakatcard')   getcmd = 'ctbakatsukicard';
            if (getcmd == 'maniaakatcard') getcmd = 'maniaakatsukicard';

            if (getcmd == 'r' || getcmd == 'rs') getcmd = 'recent';

            text = bot_command_help.find(helpcmd => helpcmd.command == getcmd).helptext
            for (let i = 0; i < 2; i++) {
                text = text.replace('{prefix}', config.config.bot_prefix)
            }
        }
        const embed = new MessageEmbed()
        .setAuthor(`Commands for Tiny Bot ${config.config.bot_ver}`)
        .setColor(embedcolor)
        .setThumbnail(bot.user.avatarURL())
        .setDescription(text);
        message.channel.send({embed})
    } catch (error) {
        message.channel.send(String(error))
    }
}

function credit(message = new Message()) {
    let embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)
    const embed = new MessageEmbed()
    .setAuthor(`Special thanks to:`)
    .setColor(embedcolor)
    .setThumbnail(bot.user.avatarURL())
    .setDescription(`
**--- Special helper ❤:**
Great Fog (!m, partial !osud, !acc, total pp in !osud, v3, !osutop -a)
**--- Command idea from:**
Yeong Yuseong (!calcpp, !compare sorted by pp, !r Map completion, !osutop -p with ranges, !suggestion, !osu -d common mods, !c -p, !osutop -s), 1OneHuman (!mosutop, !rosutop, !scores), Shienei (!c Unranked pp calculation), jpg (Time ago), lokser (!osu -d length avg), Xpekade (Economy), Rimu (new !osu design), zibi (!topglobal, !topcountry), PotatoBoy123 (!lb)
**--- Tester:**
ReiSevia, Shienei, FinnHeppu, Hugger, rinku, Rosax, -Seoul`);
    message.channel.send({embed})
}

function avatar(message = new Message(), command) {
    try {
        let embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)
        let user = fx.general.find_discord_user(message, message.content.substring(command.length+1))
        if (user == null) throw 'User not found!'
        let username = user.username
        let image = user.avatarURL()
        const embed = new MessageEmbed()
        .setAuthor(`Avatar for ${username}`)
        .setColor(embedcolor)
        .setImage(image);
        message.channel.send({embed})
    } catch (err) {
        message.channel.send(String(err))
    }
}

function changelog(message = new Message()) {
    let embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)
    let changes = [`\`Quality and Performance update:\`
**[July 23rd, 2020]:**
- Changed scores UI
- Changed maps UI
- Removed custom command
- Fixed beatmap links
**[July 29th, 2020]:**
- Changed library to reduce RAM usage
**[August 3rd, 2020]:**
- Changed osu commands
The new osu commands now follow this theme: **(prefix)(mode name)command name -(server name)**
**[October 10th, 2020]:**
- Fixed map related commands`]

    let loadpage = async function (page, pages) {
        pages = changes
        return pages
    }
    fx.general.page_system(message, {load: loadpage}, `Changelog for TinyBot ${config.config.bot_ver} (Page {page} of {max_page})`, message.client.user.avatarURL(), embedcolor, changes.length)
}

function bot_info(message = new Message()) {
    let embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)
    const embed = new MessageEmbed()
    .setColor(embedcolor)
    .setThumbnail(bot.user.avatarURL())
    .addField('Information', `◆ Hello! I am Tiny Bot, a bot made by Tienei <:chinoHappy:450684046129758208>. This bot is primarily for osu! and most of the commands is the same as owo with more functionality`)
    .addField('Bot setup', `◆ To get started, type **\`!help\`** to get a list of command and then type **\`!help (command)\`** to get more detailed information
◆ If you wanted to help me improve, type **\`!report\`** or **\`!suggestion\`** if you have a suggestion/bugs`)
    .addField('Links', `◆ Link to invite me: [invite](https://discordapp.com/api/oauth2/authorize?client_id=470496878941962251&permissions=378944&scope=bot)
◆ My senpai server: [server](https://discord.gg/H2mQMxd)
◆ Consider donating if you like the bot and help the creator: [donate](https://ko-fi.com/tienei)`)
    .addField('Supported osu servers', `◆ \`Bancho\` \`Ripple\` \`Akatsuki\` \`Enjuu\` \`Horizon\` \`Gatari\``)
    .addField('Dependencies',`\`discord.js-light\`: ${package.dependencies['discord.js-light']}, \`ojsama\`: ${package.dependencies.ojsama}, \`osu!api\`: 1.0, \`Ripple API\`: 1.0`);
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
        return null
    }
}

async function report(message = new Message()) {
    try {
        let msg = message.content.toLowerCase();
        let command = msg.split(' ')[0]
        let embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)
        if (fx.general.cmd_cooldown.cooldown[message.author.id] !== undefined && fx.general.cmd_cooldown.cooldown[message.author.id].indexOf(command) !== -1) {
            throw 'You need to wait 30 seconds before using this again!'
        }
        fx.general.cmd_cooldown.set(message, command, 30000)
        let error = message.content.substring(command.length + 1)
        if (error == '') {
            throw "Type an error"
        }
        let channelid = message.channel.id
        let user = message.author.username
        let pfp = message.author.avatarURL()
        const embed = new MessageEmbed()
        .setAuthor(`Username: ${user} (${message.author.id})`, pfp)
        .setColor(embedcolor)
        .setDescription(`
Channel ID: **${channelid}**
Problem: ${error}`);
        bot.channels.cache.get('564396177878155284').send({embed})
        message.channel.send('Error has been reported')
    } catch (error) {
        message.channel.send(String(error))
    }
}

async function suggestion(message = new Message()) {
    try {
        let msg = message.content.toLowerCase();
        let command = msg.split(' ')[0]
        let embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)
        if (fx.general.cmd_cooldown.cooldown[message.author.id] !== undefined && fx.general.cmd_cooldown.cooldown[message.author.id].indexOf(command) !== -1) {
            throw 'You need to wait 30 seconds before using this again!'
        }
        fx.general.cmd_cooldown.set(message, command, 30000)
        let suggestion = message.content.substring(command.length + 1)
        if (suggestion == '') {
            throw 'Type a suggestion for the bot'
        }
        let channelid = message.channel.id
        let user = message.author.username
        let pfp = message.author.avatarURL()
        const embed = new MessageEmbed()
        .setAuthor(`Username: ${user} (${message.author.id})`, pfp)
        .setColor(embedcolor)
        .setDescription(`
Channel ID: **${channelid}**
Suggestion: ${suggestion}`);
        bot.channels.cache.get('564439362218229760').send({embed})
        message.channel.send('Suggestion has been reported')
    } catch (error) {
        message.channel.send(String(error))
    }
}

function checkcomp(message = new Message()) {
    try {
        let embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)
        let compatibility = []
        let permissions = ['SEND_MESSAGES', 'ATTACH_FILES', 'ADD_REACTIONS', 'EMBED_LINKS', 'USE_EXTERNAL_EMOJIS']
        for (let i in permissions) {
            if (message.guild.me.hasPermission(permissions[i])) compatibility.push('✅')
            else compatibility.push('❌');
        }
        const embed = new MessageEmbed()
        .setAuthor(`Permissions for Tiny Bot ${config.config.bot_ver} in ${message.guild.name}`)
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

async function ping(message = new Message()) {
    try {
        let msg = message.content.toLowerCase();
        let command = msg.split(' ')[0]
        if (fx.general.cmd_cooldown.cooldown[message.author.id] !== undefined && fx.general.cmd_cooldown.cooldown[message.author.id].indexOf(command) !== -1) {
            throw 'You need to wait 5 seconds before using this again!'
        }
        fx.general.cmd_cooldown.set(message, command, 5000)
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
        message.channel.send(String(error))
    }
}

async function donate(message = new Message()) {
    try {
        const embed = new MessageEmbed()
        .setDescription("Support the creator here: [donate](https://ko-fi.com/tienei)");
        message.channel.send({embed})
    } catch (err) {}
}

module.exports = {
    ping,
    help,
    credit,
    avatar,
    changelog,
    bot_info,
    prefix,
    report,
    suggestion,
    checkcomp,
    donate
}