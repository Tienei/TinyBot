const bot = require('./../client').bot
const config = require('../config')
const fx = require('./../Functions/load_fx')
const package = require('../package.json')
const { Message, MessageEmbed } = require('discord.js')

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
            addhelp('avatar', 'avatar (user)', 'View a user\'s discord avatar', 'user: User you want to view (Has to be @user)', 'avatar @Tienei#0000')
            addhelp('credit', 'credit', 'A list of users who has helped the bot to grow!', 'None', 'credit')
            addhelp('changelog', 'changelog', 'View update and fix for the bot', 'None', 'changelog')
            addhelp('help', 'help (command)', 'Get a full command list or view a specific command help', 'command: Command help you wanted to see', 'help osu')
            addhelp('ping', 'ping', 'Ping Bancho (probably making Bancho mad sometimes lol)\n100ms: Good\n200ms: OK\n300ms: Bad\n600ms: Pretty bad', 'None', 'ping')
            addhelp('report', 'report (error)', 'Report an error or bug to the owner', 'error: Type any error or bug you found', 'report osu is broken')
            addhelp('suggestion', 'suggestion (suggestion)', 'Suggesting an idea for the bot to the owner', 'error: Type any error or bug you found', 'report osu is broken')
            addhelp('bot', 'bot', 'Get invitation of the bot', 'None', 'bot')
            addhelp('checkcomp', 'checkcomp', 'Check the permission of the bot', 'None', 'checkcomp')
            addhelp('prefix', 'prefix (prefix)', 'Change the prefix for the entire server', 'prefix: The prefix you wanted', 'prefix >')
            addhelp('command', 'command (action) (command_category)', 'Disable/Enable/List a list of commands', '`action`: enable, disable, list\n`command_category`: custom_cmd, fun, osu', 'command disable custom_cmd')
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
            addhelp('8ball', '8ball (message)', 'The magic ball that has all the answers for your questoin', 'None', '8ball Am i old?')
            addhelp('roll', 'roll (number)', 'Roll a dice', 'None', 'roll 90')
            addhelp('ratewaifu', 'ratewaifu (text)', 'Rate your waifu', 'None', 'ratewaifu TinyBot')
            addhelp('osu', 'osu (username) (options)', 'Get an osuStandard profile', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the details of the player `(no param)`\nRank `(-rank)`: Get an osu!Standard profile by rank\nTop Skills `(-ts)`: Calculate player skill using bot formula', 'osu Tienei -d')
            addhelp('taiko', 'taiko (username)', 'Get an osu!Taiko profile', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the details of the player `(no param)`\nTop Skills `(-ts)`: Calculate player skill using bot formula', 'taiko Tienei')
            addhelp('ctb', 'ctb (username)', 'Get an osu!Catch the beat profile', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the details of the player `(no param)`\nTop Skills `(-ts)`: Calculate player skill using bot formula', 'ctb Tienei')
            addhelp('mania', 'mania (username)', 'Get an osu!Mania profile', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the details of the player `(no param)`\nTop Skills `(-ts)`: Calculate player skill using bot formula', 'mania Tienei')
            addhelp('osucard', 'osucard (username)', 'Generate an osu!card (Just for fun)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 525\n`Elite`: Acc >= 525 and Acc < 700\n`Super Rare`: Acc >= 700 and Acc < 825\n`Ultra Rare`: Acc >= 825 and Acc < 900\n`Master`: Acc >= 900', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'osucard Tienei')
            addhelp('taikocard', 'taikocard (username)', 'Generate a taiko!card (Just for fun)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 525\n`Elite`: Acc >= 525 and Acc < 700\n`Super Rare`: Acc >= 700 and Acc < 825\n`Ultra Rare`: Acc >= 825 and Acc < 900\n`Master`: Acc >= 900', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'taikocard Tienei')
            addhelp('ctbcard', 'ctbcard (username)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 525\n`Elite`: Acc >= 525 and Acc < 700\n`Super Rare`: Acc >= 700 and Acc < 825\n`Ultra Rare`: Acc >= 825 and Acc < 900\n`Master`: Acc >= 900', 'Generate a ctb!card (Just for fun)', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'ctbcard Tienei')
            addhelp('maniacard', 'maniacard (username)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 525\n`Elite`: Acc >= 525 and Acc < 700\n`Super Rare`: Acc >= 700 and Acc < 825\n`Ultra Rare`: Acc >= 825 and Acc < 900\n`Master`: Acc >= 900', 'Generate a mania!card (Just for fun)', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'maniacard Tienei')
            addhelp('osustatus', 'osustatus', 'Check osu current status (Information from @osustatus twitter)', 'one', '!osustatus')
            addhelp('osutop', 'osutop (username) (options)', 'View a player\'s osu!Standard top play', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)\nPage `(-page)`: Get top 100 in a form of pages `(No param)`\nSearch `(-s)`: Search for a specific play in top 100\nAccuracy `(-a)`: Sort player\'stop 100 plays by accuracy', 'osutop Tienei -m HDHR')
            addhelp('taikotop', 'taikotop (username) (options)', 'View a player\'s osu!Taiko top play', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)', 'taikotop Tienei -p 8')
            addhelp('ctbtop', 'ctbtop (username) (options)', 'View a player\'s osu!Catch the beat top play', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)', 'ctbtop Tienei -p 9')
            addhelp('maniatop', 'maniatop (username) (options)', 'View a player\'s osu!Mania top play', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)', 'maniatop Tienei -p 4')
            addhelp('osutrack', 'osutrack (username) (options)', 'Track a player\'s osu!Standard top 50 (Required MANAGE\_CHANNELS permission). Default: osu!Std, top 50', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nTop Play `(-p)`: Number of top plays to include in tracking `(1-100)`\nModes/Severs: `-std` `-taiko` `-ctb` `-mania` `-ripple` `-akat` `-rxakat` `-hrz` `-rxhrz`', 'osutrack Tienei')
            addhelp('osutracklist', 'osutracklist', 'Get a list of player being tracked in the channel', 'None', 'osutracklist')
            addhelp('untrack', 'untrack (username) (options)', 'Untrack a player from the database (Required MANAGE\_CHANNELS permission), Default: Remove all player with the name', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nBancho `(-bc)`: Remove a Bancho player with the name from tracking\nRipple `(-rp)`: Remove a Ripple player with the name from tracking\nAkatsuki `(-akat)`: Remove an Akatsuki player with the name from tracking\nHorizon `(-hrz)`: Remove a Horizon player with the name from tracking\nOld Name `(-on)`: Remove an old username from the tracking (Case sensitive)', 'untrack Tienei')
            addhelp('recent', '[recent|r|rs] (username) (options)', 'Get player\'s most recent play', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nRecent Best `(-b)`: Get player most recent best from top 100 `(No param)`\nRecent List `(-l)`: Get player 5 most recent plays\nModes/Servers: `-std` `-taiko` `-ctb` `-mania` `-akat` `-ripple` `-hrz` `-enjuu` `-gatari` `-rx`', 'r Tienei -akat -mania')
            addhelp('compare', '[compare|c] (username) ', 'Compare to the last play in the chat', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)\nPrevious Play `(-p)`: Get a previous play mentioned in the chat `(Number)`\nModes/Servers: `-std` `-taiko` `-ctb` `-mania` `-akat` `-rxakat` `-ripple` `-hrz` `-rxhrz` `-enjuu` `-gatari`', 'c Tienei')
            addhelp('osuset', 'osuset (username)', 'Link your profile to an osu! player', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'osuset Tienei')
            addhelp('osuavatar', 'osuavatar (username)', 'Get player\'s osu! avatar', 'username: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'osuavatar Tienei')
            addhelp('map', '[map|m] (options)', 'Get details info of the map of the last play in the server\nLeaderboard `(-l)`: Get the leaderboard of the map of the last play in the server', 'Mods: details info of the map with mods `(Shorten mods)`', 'm HDDT')
            addhelp('topglobal', 'topglobal', 'Get a list of top 50 osu!Standard player', '', 'topglobal')
            addhelp('topcountry', 'topcountry (country code)', 'Get a list of top 50 osu!Standard player of a country', 'country code: You can see a list right here: https://en.wikipedia.org/wiki/List_of_ISO_3166_country_codes (Look at ISO 3166-1, Alpha-2 code)', 'topcountry US')
            addhelp('scores', 'scores (map link) (username)', 'Get player\'s play on a specific map', 'Map link: Just get a beatmap link\nusername: osu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'scores https://osu.ppy.sh/b/1157868 Cookiezi')
            addhelp('acc', 'acc (300) (100) (50) (miss)', 'Accuracy calculator', '**Needs all options to be calculated**', 'acc 918 23 2 0')
            addhelp('rec', 'rec', 'Recommend you an osu beatmap', 'None', '!rec')
            addhelp('leaderboard', 'leaderboard', 'Get a list of top player in the server\nNote: The player stats will only be updated if the you type **!osu** or a specific player **!osu (player name)** only if they in the server', 'None', 'leaderboard')
            addhelp('akatsuki', 'akatsuki (username) (options)', 'Get an Standard Akatuski profile', 'username: Akatsuki username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the details of the player `(no param)`\nTop Skills `(-ts)`: Calculate player skill using bot formula', 'akatsuki Tienei -d')
            addhelp('taikoakatsuki', 'taikoakatsuki (username) (options)', 'Get a Taiko Akatuski profile', 'username: Akatsuki username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the details of the player `(no param)`\nTop Skills `(-ts)`: Calculate player skill using bot formula', 'taikoakatsuki Tienei -d')
            addhelp('ctbakatsuki', 'ctbakatsuki (username) (options)', 'Get a CTB profile', 'username: Akatsuki username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the details of the player `(no param)`\nTop Skills `(-ts)`: Calculate player skill using bot formula', 'ctbakatsuki Tienei -d')
            addhelp('maniaakatsuki', 'maniaakatsuki (username) (options)', 'Get a Mania Akatuski profile', 'username: Akatsuki username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the details of the player `(no param)`\nTop Skills `(-ts)`: Calculate player skill using bot formula', 'maniaakatsuki Tienei -d')
            addhelp('akatsukicard', '[akatcard|akatsukicard] (username)', 'Generate an osu!card (Just for fun)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 525\n`Elite`: Acc >= 525 and Acc < 700\n`Super Rare`: Acc >= 700 and Acc < 825\n`Ultra Rare`: Acc >= 825 and Acc < 900\n`Master`: Acc >= 900', 'username: Akatsuki!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'akatsukicard Tienei')
            addhelp('taikoakatsukicard', '[taikoakatcard|taikoakatsukicard] (username)', 'Generate an osu!card (Just for fun)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 525\n`Elite`: Acc >= 525 and Acc < 700\n`Super Rare`: Acc >= 700 and Acc < 825\n`Ultra Rare`: Acc >= 825 and Acc < 900\n`Master`: Acc >= 900', 'username: Akatsuki!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'taikoakatsukicard Tienei')
            addhelp('ctbakatsukicard', '[ctbakatcard|ctbakatsukicard] (username)', 'Generate an osu!card (Just for fun)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 525\n`Elite`: Acc >= 525 and Acc < 700\n`Super Rare`: Acc >= 700 and Acc < 825\n`Ultra Rare`: Acc >= 825 and Acc < 900\n`Master`: Acc >= 900', 'username: Akatsuki!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'ctbakatsukicard Tienei')
            addhelp('maniaakatsukicard', '[maniaakatcard|maniaakatsukicard] (username)', 'Generate an osu!card (Just for fun)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 525\n`Elite`: Acc >= 525 and Acc < 700\n`Super Rare`: Acc >= 700 and Acc < 825\n`Ultra Rare`: Acc >= 825 and Acc < 900\n`Master`: Acc >= 900', 'username: Akatsuki!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'maniaakatsukicard Tienei')
            addhelp('akatsukiset', 'akatsukiset (username)', 'Link your profile to an Akatsuki player', 'username: Akatsuki username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'akatsukiset Tienei')
            addhelp('akatsukitop', '[akatsukitop|akattop] (username) (options)', 'View a player\'s Akatsuki Standard top play', 'username: Akatsuki username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)', 'akatsukitop Tienei -p 8')
            addhelp('taikoakatsukitop', '[taikoakatsukitop|taikoakattop] (username) (options)', 'View a player\'s Akatsuki Taiko top play', 'username: Akatsuki username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)', 'taikoakatsukitop Tienei -p 8')
            addhelp('ctbakatsukitop', '[ctbakatsukitop|ctbakattop] (username) (options)', 'View a player\'s Akatsuki CTB top play', 'username: Akatsuki username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)', 'ctbakatsukitop Tienei -p 8')
            addhelp('maniaakatsukitop', '[maniaakatsukitop|maniaakattop] (username) (options)', 'View a player\'s Akatsuki Mania top play', 'username: Akatsuki username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)', 'maniaakatsukitop Tienei -p 8')
            addhelp('akatavatar', 'akatavatar (username)', 'Get player\'s Akatsuki avatar', 'username: Akatsuki username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'akatavatar Tienei')
            addhelp('rxakatsuki', 'rxakatsuki (username) (options)', 'Get a Relax Akatuski Standard profile', 'username: Akatsuki username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetails `(-d)`: Get all the details of the player `(no param)`', 'rxakatsuki Tienei -d')
            addhelp('rxakatsukitop', '[rxakatsukitop|rxakattop] (username) (options)', 'View a player\'s Relax Akatsuki Standard top play', 'username: Akatsuki username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)', 'rxakattop Tienei -p 8')
            addhelp('ripple', 'ripple (username) (options)', 'Get an Standard Ripple profile', 'username: Ripple username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the details of the player `(no param)`\nTop Skills `(-ts)`: Calculate player skill using bot formula', 'ripple Tienei -d')
            addhelp('taikoripple', 'taikoripple (username) (options)', 'Get a Taiko Ripple profile', 'username: Ripple username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the details of the player `(no param)`\nTop Skills `(-ts)`: Calculate player skill using bot formula', 'taikoripple Tienei -d')
            addhelp('ctbripple', 'ctbripple (username) (options)', 'Get a CTB Ripple profile', 'username: Ripple username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the details of the player `(no param)`\nTop Skills `(-ts)`: Calculate player skill using bot formula', 'ctbripple Tienei -d')
            addhelp('maniaripple', 'maniaripple (username) (options)', 'Get a Mania Ripple profile', 'username: Ripple username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the details of the player `(no param)`\nTop Skills `(-ts)`: Calculate player skill using bot formula', 'maniaripple Tienei -d')
            addhelp('ripplecard', 'ripplecard (username)', 'Generate an osu!card (Just for fun)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 525\n`Elite`: Acc >= 525 and Acc < 700\n`Super Rare`: Acc >= 700 and Acc < 825\n`Ultra Rare`: Acc >= 825 and Acc < 900\n`Master`: Acc >= 900', 'username: Ripple!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'ripplecard Tienei')
            addhelp('taikoripplecard', 'taikoripplecard (username)', 'Generate an osu!card (Just for fun)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 525\n`Elite`: Acc >= 525 and Acc < 700\n`Super Rare`: Acc >= 700 and Acc < 825\n`Ultra Rare`: Acc >= 825 and Acc < 900\n`Master`: Acc >= 900', 'username: Ripple!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'taikoripplecard Tienei')
            addhelp('ctbripplecard', 'ctbripplecard (username)', 'Generate an osu!card (Just for fun)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 525\n`Elite`: Acc >= 525 and Acc < 700\n`Super Rare`: Acc >= 700 and Acc < 825\n`Ultra Rare`: Acc >= 825 and Acc < 900\n`Master`: Acc >= 900', 'username: Ripple!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'ctbripplecard Tienei')
            addhelp('maniaripplecard', 'maniaripplecard (username)', 'Generate an osu!card (Just for fun)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 525\n`Elite`: Acc >= 525 and Acc < 700\n`Super Rare`: Acc >= 700 and Acc < 825\n`Ultra Rare`: Acc >= 825 and Acc < 900\n`Master`: Acc >= 900', 'username: Ripple!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'maniaripplecard Tienei')
            addhelp('rippleset', 'rippleset (username)', 'Link your profile to an Ripple player', 'username: Ripple username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'rippleset Tienei')
            addhelp('rippletop', 'rippletop (username) (options)', 'View a player\'s Ripple Standard top play', 'username: Ripple username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)', 'rippletop Tienei -p 8')
            addhelp('taikorippletop', 'taikorippletop (username) (options)', 'View a player\'s Ripple Taiko top play', 'username: Ripple username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)', 'taikorippletop Tienei -p 8')
            addhelp('ctbrippletop', 'ctbrippletop (username) (options)', 'View a player\'s Ripple CTB top play', 'username: Ripple username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)', 'ctbrippletop Tienei -p 8')
            addhelp('maniarippletop', 'maniarippletop (username) (options)', 'View a player\'s Ripple Mania top play', 'username: Ripple username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)', 'maniarippletop Tienei -p 8')
            addhelp('rippleavatar', 'rippleavatar (username)', 'Get player\'s Ripple avatar', 'username: Ripple username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'rippleavatar Tienei')
            addhelp('rippleset', 'rippleset (username)', 'Link your profile to a Ripple player', 'username: Ripple username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'rippleset Tienei')
            addhelp('horizon', 'horizon (username) (options)', 'Get a Standard Horizon profile', 'username: Horizon username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the details of the player `(no param)`\nTop Skills `(-ts)`: Calculate player skill using bot formula', 'horizon Tienei -d')
            addhelp('taikohorizon', 'taikohorizon (username) (options)', 'Get a Taiko Horizon profile', 'username: Horizon username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the details of the player `(no param)`\nTop Skills `(-ts)`: Calculate player skill using bot formula', 'taikohorizon Tienei -d')
            addhelp('ctbhorizon', 'ctbhorizon (username) (options)', 'Get a CTB Horizon profile', 'username: Horizon username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the details of the player `(no param)`\nTop Skills `(-ts)`: Calculate player skill using bot formula', 'ctbhorizon Tienei -d')
            addhelp('maniahorizon', 'maniahorizon (username) (options)', 'Get a Mania Horizon profile', 'username: Horizon username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the details of the player `(no param)`\nTop Skills `(-ts)`: Calculate player skill using bot formula', 'maniahorizon Tienei -d')
            addhelp('horizoncard', 'horizoncard (username)', 'Generate an osu!card (Just for fun)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 525\n`Elite`: Acc >= 525 and Acc < 700\n`Super Rare`: Acc >= 700 and Acc < 825\n`Ultra Rare`: Acc >= 825 and Acc < 900\n`Master`: Acc >= 900', 'username: Horizon!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'horizoncard Tienei')
            addhelp('taikohorizoncard', 'taikohorizoncard (username)', 'Generate an osu!card (Just for fun)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 525\n`Elite`: Acc >= 525 and Acc < 700\n`Super Rare`: Acc >= 700 and Acc < 825\n`Ultra Rare`: Acc >= 825 and Acc < 900\n`Master`: Acc >= 900', 'username: Horizon!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'taikohorizoncard Tienei')
            addhelp('ctbhorizoncard', 'ctbhorizoncard (username)', 'Generate an osu!card (Just for fun)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 525\n`Elite`: Acc >= 525 and Acc < 700\n`Super Rare`: Acc >= 700 and Acc < 825\n`Ultra Rare`: Acc >= 825 and Acc < 900\n`Master`: Acc >= 900', 'username: Horizon!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'ctbhorizoncard Tienei')
            addhelp('maniahorizoncard', 'maniahorizoncard (username)', 'Generate an osu!card (Just for fun)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 525\n`Elite`: Acc >= 525 and Acc < 700\n`Super Rare`: Acc >= 700 and Acc < 825\n`Ultra Rare`: Acc >= 825 and Acc < 900\n`Master`: Acc >= 900', 'username: Horizon!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'maniahorizoncard Tienei')
            addhelp('horizonset', 'horizonset (username)', 'Link your profile to a Horizon player', 'username: Horizon username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'horizonset Tienei')
            addhelp('horizontop', 'horizontop (username) (options)', 'View a player\'s Horizon Standard top play', 'username: Horizon username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)', 'horizontop Tienei -p 8')
            addhelp('taikohorizontop', 'taikohorizontop (username) (options)', 'View a player\'s Horizon Taiko top play', 'username: Horizon username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)', 'taikohorizontop Tienei -p 8')
            addhelp('ctbhorizontop', 'ctbhorizontop (username) (options)', 'View a player\'s Horizon CTB top play', 'username: Horizon username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)', 'ctbhorizontop Tienei -p 8')
            addhelp('maniahorizontop', 'maniahorizontop (username) (options)', 'View a player\'s Horizon Mania top play', 'username: Horizon username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)', 'maniahorizontop Tienei -p 8')
            addhelp('horizonavatar', 'horizonavatar (username)', 'Get player\'s Horizon avatar', 'username: Horizon username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'horizonavatar Tienei')
            addhelp('rxhorizon', 'rxhorizon (username) (options)', 'Get a Relax Horizon Standard profile', 'username: Horizon username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetails `(-d)`: Get all the details of the player `(no param)`', 'rxhorizon Tienei -d')
            addhelp('rxhorizontop', 'rxhorizontop (username) (options)', 'View a player\'s Relax Horizon Standard top play', 'username: Horizon username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)', 'rxhorizontop Tienei -p 8')
            addhelp('enjuu', 'enjuu (username) (options)', 'Get an Standard Enjuu profile', 'username: Enjuu username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the details of the player `(no param)`\nTop Skills `(-ts)`: Calculate player skill using bot formula', 'enjuu Tienei -d')
            addhelp('taikoenjuu', 'taikoenjuu (username) (options)', 'Get a Taiko Enjuu profile', 'username: Enjuu username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the details of the player `(no param)`\nTop Skills `(-ts)`: Calculate player skill using bot formula', 'taikoenjuu Tienei -d')
            addhelp('ctbenjuu', 'ctbenjuu (username) (options)', 'Get a CTB Enjuu profile', 'username: Enjuu username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the details of the player `(no param)`\nTop Skills `(-ts)`: Calculate player skill using bot formula', 'ctbenjuu Tienei -d')
            addhelp('maniaenjuu', 'maniaenjuu (username) (options)', 'Get a Mania Enjuu profile', 'username: Enjuu username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the details of the player `(no param)`\nTop Skills `(-ts)`: Calculate player skill using bot formula', 'maniaenjuu Tienei -d')
            addhelp('enjuucard', 'enjuucard (username)', 'Generate an osu!card (Just for fun)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 525\n`Elite`: Acc >= 525 and Acc < 700\n`Super Rare`: Acc >= 700 and Acc < 825\n`Ultra Rare`: Acc >= 825 and Acc < 900\n`Master`: Acc >= 900', 'username: Enjuu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'enjuucard Tienei')
            addhelp('taikoenjuucard', 'taikoenjuucard (username)', 'Generate an osu!card (Just for fun)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 525\n`Elite`: Acc >= 525 and Acc < 700\n`Super Rare`: Acc >= 700 and Acc < 825\n`Ultra Rare`: Acc >= 825 and Acc < 900\n`Master`: Acc >= 900', 'username: Enjuu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'taikoenjuucard Tienei')
            addhelp('ctbenjuucard', 'ctbenjuucard (username)', 'Generate an osu!card (Just for fun)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 525\n`Elite`: Acc >= 525 and Acc < 700\n`Super Rare`: Acc >= 700 and Acc < 825\n`Ultra Rare`: Acc >= 825 and Acc < 900\n`Master`: Acc >= 900', 'username: Enjuu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'ctbenjuucard Tienei')
            addhelp('maniaenjuucard', 'maniaenjuucard (username)', 'Generate an osu!card (Just for fun)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 525\n`Elite`: Acc >= 525 and Acc < 700\n`Super Rare`: Acc >= 700 and Acc < 825\n`Ultra Rare`: Acc >= 825 and Acc < 900\n`Master`: Acc >= 900', 'username: Enjuu!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'maniaenjuucard Tienei')
            addhelp('enjuuset', 'enjuuset (username)', 'Link your profile to an Enjuu player', 'username: Enjuu username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'enjuuset Tienei')
            addhelp('enjuutop', 'enjuutop (username) (options)', 'View a player\'s Enjuu Standard top play', 'username: Enjuu username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)', 'enjuutop Tienei -p 8')
            addhelp('taikoenjuutop', 'taikoenjuutop (username) (options)', 'View a player\'s Enjuu Taiko top play', 'username: Enjuu username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)', 'taikoenjuutop Tienei -p 8')
            addhelp('ctbenjuutop', 'ctbenjuutop (username) (options)', 'View a player\'s Enjuu CTB top play', 'username: Enjuu username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)', 'ctbenjuutop Tienei -p 8')
            addhelp('maniaenjuutop', 'maniaenjuutop (username) (options)', 'View a player\'s Enjuu Mania top play', 'username: Enjuu username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)', 'maniaenjuutop Tienei -p 8')
            addhelp('enjuuavatar', 'enjuuavatar (username)', 'Get player\'s Enjuu avatar', 'username: Enjuu username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'enjuuavatar Tienei')
            addhelp('gatari', 'gatari (username) (options)', 'Get a Standard Gatari profile', 'username: Gatari username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the details of the player `(no param)`\nTop Skills `(-ts)`: Calculate player skill using bot formula', 'gatari Tienei')
            addhelp('taikogatari', 'taikogatari (username) (options)', 'Get a Taiko Gatari profile', 'username: Gatari username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the details of the player `(no param)`\nTop Skills `(-ts)`: Calculate player skill using bot formula', 'taikogatari Tienei')
            addhelp('ctbgatari', 'ctbgatari (username) (options)', 'Get a CTB Gatari profile', 'username: Gatari username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the details of the player `(no param)`\nTop Skills `(-ts)`: Calculate player skill using bot formula', 'ctbgatari Tienei')
            addhelp('maniagatari', 'maniagatari (username) (options)', 'Get a Mania Gatari profile', 'username: Gatari username of the player (Space replaced with "_" or just use quotation mark ``"``)\nDetailed `(-d)`: Get all the details of the player `(no param)`\nTop Skills `(-ts)`: Calculate player skill using bot formula', 'maniagatari Tienei')
            addhelp('gataricard', 'gataricard (username)', 'Generate an osu!card (Just for fun)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 525\n`Elite`: Acc >= 525 and Acc < 700\n`Super Rare`: Acc >= 700 and Acc < 825\n`Ultra Rare`: Acc >= 825 and Acc < 900\n`Master`: Acc >= 900', 'username: Gatari!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'gataricard Tienei')
            addhelp('taikogataricard', 'taikogataricard (username)', 'Generate an osu!card (Just for fun)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 525\n`Elite`: Acc >= 525 and Acc < 700\n`Super Rare`: Acc >= 700 and Acc < 825\n`Ultra Rare`: Acc >= 825 and Acc < 900\n`Master`: Acc >= 900', 'username: Gatari!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'taikogataricard Tienei')
            addhelp('ctbgataricard', 'ctbgataricard (username)', 'Generate an osu!card (Just for fun)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 525\n`Elite`: Acc >= 525 and Acc < 700\n`Super Rare`: Acc >= 700 and Acc < 825\n`Ultra Rare`: Acc >= 825 and Acc < 900\n`Master`: Acc >= 900', 'username: Gatari!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'ctbgataricard Tienei')
            addhelp('maniagataricard', 'maniagataricard (username)', 'Generate an osu!card (Just for fun)\nRequirement for rarity:\n`Common`: Acc < 300\n`Rare`: Acc >= 300 and Acc < 525\n`Elite`: Acc >= 525 and Acc < 700\n`Super Rare`: Acc >= 700 and Acc < 825\n`Ultra Rare`: Acc >= 825 and Acc < 900\n`Master`: Acc >= 900', 'username: Gatari!username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'maniagataricard Tienei')
            addhelp('gatariset', 'gatariset (username)', 'Link your profile to a Gatari player', 'username: Gatari username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'gatariset Tienei')
            addhelp('gataritop', 'gataritop (username) (options)', 'View a player\'s Gatari Standard top play', 'username: Gatari username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)', 'gataritop Tienei -p 8')
            addhelp('taikogataritop', 'taikogataritop (username) (options)', 'View a player\'s Gatari Taiko top play', 'username: Gatari username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)', 'taikogataritop Tienei -p 8')
            addhelp('ctbgataritop', 'ctbgataritop (username) (options)', 'View a player\'s Gatari CTB top play', 'username: Gatari username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)', 'ctbgataritop Tienei -p 8')
            addhelp('maniagataritop', 'maniagataritop (username) (options)', 'View a player\'s Gatari Mania top play', 'username: Gatari username of the player (Space replaced with "_" or just use quotation mark ``"``)\nSpecific Play `(-p)`: Get a specific play from top 100 `(Number)`\nRecent Play `(-r)`: Get a top recent play from top 100 `(No param)`\nMods Play `(-m)`: Get a top mods play from top 100 `(Shorten mods)`\nGreater than `(-g)`: Get number of plays greater than certain amount of pp (Number)', 'maniagataritop Tienei -p 8')
            addhelp('gatariavatar', 'gatariavatar (username)', 'Get player\'s Gatari avatar', 'username: Gatari username of the player (Space replaced with "_" or just use quotation mark ``"``)', 'gatariavatar Tienei')
            addhelp('corona', 'corona', 'Check the stats for current corona virus pandemic\n`Total Cases`: Total corona virus cases in a country\n:bed:: Active cases in a country (Still ill)\n:skull:: Total deaths in a country\n:green_heart:: Total recoveries in a country', 'None', 'corona')
            addhelp('definevar', 'Defined Variable for Custom command', 'user: ``selfname`` ``selfping`` ``selfcreatedtime`` ``selfpresence`` ``othercreatedtime`` ``otherpresence`` channel: ``selfname`` ``selflink`` ``members`` server: ``name`` ``members`` ``channels`` ``roles`` ``defaultchannel`` ``owner`` ``region`` ``createdtime``', '{require:admin}: Need Administrator to enable the command {$N}: Get text in message seperated by space (Not include command) {send:channelname "message"}: Send to a channel with a specific message', 'do ``!help customcmd``')
            addhelp('osu -d calculation', 'Osu -d calculation', 'Star: Avg stars of the top 50 plays\nAim: Aim stars play * (CS ^ 0.1 / 4 ^ 0.1)\nSpeed: Speed stars play * (BPM ^ 0.3 / 180 ^ 0.3) * (AR ^ 0.1 / 6 ^ 0.1)\nAccuracy: (Plays accuracy ^ 2.5 / 100 ^ 2.5) * 1.08 * Map stars * (OD ^ 0.03 / 6 ^ 0.03) * (HP ^ 0.03 / 6 ^ 0.03)', 'None', 'None')
        }
        let generalhelp = '**[General]:** `avatar` `credit` `changelog` `help` `ping` `report` `suggestion` `ee` `customcmd` `bot` `prefix` `corona` `checkperm`'
        let funhelp = '**[Fun]:** `hug` `cuddle` `slap` `kiss` `pat` `poke` `cry` `blush` `pout` `trivia`'
        let osuhelp = '**[osu!]:** `banchoping` `osu` `taiko` `ctb` `mania` `osutop` `taikotop` `ctbtop` `maniatop` `osutrack` `untrack` `osutracklist` `map` `osuset` `osuavatar` `recent` `compare` `scores` `acc` `topglobal` `topcountry` `leaderboard` `osucard` `taikocard` `ctbcard` `maniacard`'
        let akatsukihelp = '**[Akatsuki]:** `(mode name)akatsuki` `akatsukiset` `akatavatar` `(mode name)akattop` `rxakatsuki` `rxakattop` `(mode name)akatcard`'
        let ripplehelp = '**[Ripple]:** `(mode name)ripple` `rippleset` `rippleavatar` `(mode name)rippletop` `(mode name)ripplecard`'
        let horizonhelp = '**[Horizon]:** `(mode name)horizon` `horizonset` `horizonavatar` `(mode name)horizontop` `rxhorizon` `(mode name)horizoncard`'
        let enjuuhelp = '**[Enjuu]:** `(mode name)enjuu` `enjuuset` `enjuuavatar` `(mode name)enjuutop` `(mode name)enjuucard`'
        let gatarihelp = '**[Gatari]:** `(mode name)gatari` `gatariset` `gatariavatar` `(mode name)gataritop` `(mode name)gataricard`'
        let otherhelp = '**[Other]:** `definevar` `osu -d calculation`'
        let text = ''
        if (msg.substring(command.length+1) == '') {
            text = `${generalhelp}\n${funhelp}\n${osuhelp}\n${akatsukihelp}\n${ripplehelp}\n${horizonhelp}\n${enjuuhelp}\n${otherhelp}\n${gatarihelp}\n\n**Mode name:** \`std\`: None, \`taiko\`, \`ctb\`, \`mania\`\nFor more detailed infomation, type **${config.config.bot_prefix}help (command)**\nIf you forgot the prefix, remember: **<Ping the bot> check_prefix**`
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
    let changes = [`**[June 8th, 2020]:**
- Readded checkcomp
- Added ping (Discord ping)
- Added a way to check prefix if you forgot
** [June 11th, 2020]: **
- Added compare for Ripple API based server`]

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
    .addField('Dependencies',`\`discord.js\`: ${package.dependencies['discord.js']}, \`ojsama\`: ${package.dependencies.ojsama}, \`osu!api\`: 1.0, \`Ripple API\`: 1.0`);
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
    checkcomp
}