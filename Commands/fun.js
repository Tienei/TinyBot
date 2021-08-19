const { Message, MessageEmbed } = require("discord.js")
const fx = require('./../Functions/fx_handler')
const request = require('superagent')

/** 
* @param {{message: Message}} 
*/
async function trivia({message}){
    function shuffle(arr) {
        arr.sort(() => Math.random() - 0.5);
        return arr;
      }
    function isCorrect(answers, correct_awnser, pos) {
        let correct = false
        if (decodeURIComponent(correct_awnser) == answers[pos]) {
            correct = true
        }
        return correct
    }
    function stopCollection(reactions, reason) {
        for (let i in reactions) {
            reactions[i].stop(reason)
        }
    }
    function checkAnswer(reactions, shuffled_answers, question, pos) {
        if (isCorrect(shuffled_answers, question.results[0].correct_answer, pos)) {
            message.channel.send('Congratulations! Your answer is correct!')
            stopCollection(reactions, 'correct')
        } else {
            message.channel.send(`Incorrect! The correct answer is **${decodeURIComponent(question.results[0].correct_answer)}**`)
            stopCollection(reactions, 'incorrect')
        }
    }
    let embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)
    let question = (await request.get('https://opentdb.com/api.php?amount=1&encode=url3986')).body
    let question_type = question.results[0].type
    let answers = []
    let shuffled_answers = []
    if (question_type == 'multiple') {
        answers.push(decodeURIComponent(question.results[0].correct_answer))
        for (let i in question.results[0].incorrect_answers) {
            answers.push(decodeURIComponent(question.results[0].incorrect_answers[i]))
        }
        shuffled_answers = shuffle(answers)
    } else if (question_type == 'boolean') {
        if (decodeURIComponent(question.results[0].correct_answer) == 'True') {
            shuffled_answers[0] = decodeURIComponent(question.results[0].correct_answer)
            shuffled_answers[1] = decodeURIComponent(question.results[0].incorrect_answers[0])
        } else {
            shuffled_answers[1] = decodeURIComponent(question.results[0].correct_answer)
            shuffled_answers[0] = decodeURIComponent(question.results[0].incorrect_answers[0])
        }
    }
    let diff = question.results[0].difficulty
    diff = diff.charAt(0).toUpperCase() + diff.slice(1)
    let description = `**--- [Difficulty: ${diff}]**
**Question: ** ${decodeURIComponent(question.results[0].question)}`
    if (question_type == 'multiple') {
        description += `\n:one: ◆ ${shuffled_answers[0]}
:two: ◆ ${shuffled_answers[1]}
:three: ◆ ${shuffled_answers[2]}
:four: ◆ ${shuffled_answers[3]}`
    } else if (question_type == 'boolean') {
        description += `\n :heavy_check_mark: ◆ ${shuffled_answers[0]}
:x: ◆ ${shuffled_answers[1]}`
    }
    let embed = new MessageEmbed()
    .setColor(embedcolor)
    .setAuthor(`Category: ${decodeURIComponent(question.results[0].category)}`, message.client.user.avatarURL())
    .setDescription(description)
    let msg1 = await message.channel.send({embed})
    if (question_type == 'multiple') {
        await msg1.react('1️⃣')
        await msg1.react('2️⃣')
        await msg1.react('3️⃣')
        await msg1.react('4️⃣')
        let onefilter = (reaction, user) => reaction.emoji.name == "1️⃣" && user.id == message.author.id
        let twofilter = (reaction, user) => reaction.emoji.name == "2️⃣" && user.id == message.author.id
        let threefilter = (reaction, user) => reaction.emoji.name == "3️⃣" && user.id == message.author.id
        let fourfilter = (reaction, user) => reaction.emoji.name == "4️⃣" && user.id == message.author.id
        let react_one = msg1.createReactionCollector(onefilter, {time: 10000, maxEmojis: 1}) 
        let react_two = msg1.createReactionCollector(twofilter, {time: 10000, maxEmojis: 1})
        let react_three = msg1.createReactionCollector(threefilter, {time: 10000, maxEmojis: 1}) 
        let react_four = msg1.createReactionCollector(fourfilter, {time: 10000, maxEmojis: 1})
        react_one.on('collect', reaction => {
            checkAnswer([react_one, react_two, react_three, react_four], shuffled_answers, question, 0)
        })
        react_two.on('collect', reaction => {
            checkAnswer([react_one, react_two, react_three, react_four], shuffled_answers, question, 1)
        })
        react_three.on('collect', reaction => {
            checkAnswer([react_one, react_two, react_three, react_four], shuffled_answers, question, 2)
        })
        react_four.on('collect', reaction => {
            checkAnswer([react_one, react_two, react_three, react_four], shuffled_answers, question, 3)
        })
        react_one.on('end', (collected, reason) => {
            if (reason !== 'correct' && reason !== 'incorrect') {
                message.channel.send(`Time's up! The correct answer is **${decodeURIComponent(question.results[0].correct_answer)}**`)
            }
        })
    } else if (question_type == 'boolean') {
        await msg1.react('❌')
        await msg1.react('✔️')
        let falsefilter = (reaction, user) => reaction.emoji.name == "❌" && user.id == message.author.id
        let truefilter = (reaction, user) => reaction.emoji.name == "✔️" && user.id == message.author.id
        let react_false = msg1.createReactionCollector(falsefilter, {time: 10000, maxEmojis: 1}) 
        let react_true = msg1.createReactionCollector(truefilter, {time: 10000, maxEmojis: 1})
        react_false.on('collect', reaction => {
            checkAnswer([react_false, react_true], shuffled_answers, question, 1)
        })
        react_true.on('collect', reaction => {
            checkAnswer([react_false, react_true], shuffled_answers, question, 0)
        })
        react_false.on('end', (collected, reason) => {
            if (reason !== 'correct' && reason !== 'incorrect') {
                message.channel.send(`Time's up! The correct answer is **${decodeURIComponent(question.results[0].correct_answer)}**`)
            }
        })
    }
}

/** 
 * @param {{message: Message}} 
 */
async function tenor({message, search, action, alone_action}) {
    try {
        let msg = message.content.toLowerCase();
        let embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)
        let text = ''
        let suffix = fx.general.check_suffix({check_msg: msg, two_arg: false, suffix: [{"suffix": undefined, "v_count": 0}]})
        let user = suffix.check.replace(/[<@>]/gm, '')
        if ((user == '' || user == message.author.id) || (action == undefined)) {
            text = alone_action
        } else {
            text = `<@${user}>, ${action} <@${message.author.id}>`
        }
        let gif = await (await request.get(`https://api.tenor.com/v1/search?q=${search}&key=${process.env.TENOR_KEY}&limit=25&media_filter=minimal&contentfilter=medium`)).body
        const embed = new MessageEmbed()
        .setColor(embedcolor)
        .setDescription(text)
        .setImage(gif.results[Math.floor(Math.random()*24)].media[0].gif.url);
        message.channel.send({embed})
    } catch (error) {
       message.channel.send(String(error))
    }
}

/** 
 * @param {{message: Message}} 
 */
function roll({message}) {
    try {
        let msg = message.content.toLowerCase()
        let number = msg.split(' ')[1]
        if (isNaN(number) || number < 1) number = 100;
        let rolled = Math.floor(Math.random() * number)
        message.channel.send(`You roll ${rolled}!`)
    } catch (error) {
        message.channel.send(String(error))
    }
}

/** 
 * @param {{message: Message}} 
 */
function eight_ball({message}) {
    try {
        let msg = message.content.toLowerCase()
        let command = msg.split(' ')[0]
        let text = msg.substring(command.length + 1)
        if (text == '') {
            throw 'Enter a message to guess your fate'
        }
        let random_respond = ['It is certain.', 'It is decidedly so.', 'Without a doubt.', 'Yes – definitely.', 'You may rely on it.',
                            'As I see it, yes.', 'Most likely.', 'Outlook good.', 'Yes.', 'Signs point to yes.',
                            'Reply hazy, try again.', 'Ask again later.', 'Better not tell you now.', 'Cannot predict now.', 'Concentrate and ask again.',
                            "Don't count on it.", 'My reply is no.', 'My sources say no.', 'Outlook not so good.', 'Very doubtful.']
        let random = Math.floor(Math.random() * 19)
        if (random > 20) random = 19
        message.channel.send(random_respond[random])
    } catch (error) {
        message.channel.send(String(error))
    }
}

/** 
 * @param {{message: Message}} 
 */
function rate_waifu({message}) {
    try {
        let msg = message.content.toLowerCase()
        let command = msg.split(' ')[0]
        let waifu = msg.substring(command.length + 1)
        if (waifu == '') {
            throw 'Type your waifu name please'
        }
        let score = Math.floor(Math.random() * 101)
        if (score >= 101) score = 100;
        let random_respond = [`Hmm... i rate ${waifu} a ${score}/100`, `This is tough... ${score}/100`, `Maybe ${waifu} is a ${score}/100`,
                            `I would rate ${waifu} a ${score}/100`, `I rate ${waifu} a solid ${score}/100`]
        let random = Math.floor(Math.random() * 5)
        if (random > 6) random = 5
        if (score == 0) message.channel.send(`Your ${waifu} is too ugly! ${score}/100`);
        else if (score == 100) message.channel.send(`Woah! A pefect match! ${score}/100`);
        else message.channel.send(random_respond[random])
    } catch (error) {
        message.channel.send(String(error))
    }
}

module.exports = {
    tenor,
    trivia,
    roll,
    eight_ball,
    rate_waifu
}