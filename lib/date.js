const Discord = require('discord.js');
const osu = require('node-osu');
const bot = new Discord.Client();
const request = require('request-promise-native');
const calc = require('ojsama')

var cache = [{"username":"292523841811513348","osuname":"Tienei"},{"username":"413613781793636352","osuname":"yazzymonkey"},{"username":"175179081397043200","osuname":"pykemis"},{"username":"253376598353379328","osuname":"jpg"},{"username":"183918990446428160","osuname":"Pillows"},{"username":"103139260340633600","osuname":"Jamu"},{"username":"384878793795436545","osuname":"jp0806"},{"username":"179059666159009794","osuname":"Loopy542"},{"username":"253376598353379328","osuname":"jpg"},{"username":"254273747484147713","osuname":"Nashiru"},{"username":"244923259001372672","osuname":"gimli"},{"username":"228166377502932992","osuname":"zwoooz"},{"username":"228166377502932992","osuname":"zwoooz"},{"username":"339968422332858371","osuname":"Nintelda"},{"username":"327449679790866432","osuname":"KGbalaTOK"},{"username":"81826878335225856","osuname":"OzzyOzborne"}]
var storedmapid = []
 
var osuApi = new osu.Api('70095e8e72a161b213c44dfb47b44daf258c70bb', {
    notFoundAsError: false,
    completeScores: true
});

bot.on('message', (message) => {
 if (message.author.bot == false){
  bot.channels.get('457727640527175694').send('oof')
 }
});
bot.login(process.env.BOT_TOKEN);
