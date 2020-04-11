const { Message, MessageEmbed } = require("discord.js")
const fx = require('./../Functions/load_fx')
const request = require('superagent')

async function trivia(message = new Message()){
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
            message.channel.send('Congratulation! Your answer is correct!')
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
        console.log(decodeURIComponent(question.results[0].correct_answer))
        if (decodeURIComponent(question.results[0].correct_answer) == 'True') {
            shuffled_answers[0] = decodeURIComponent(question.results[0].correct_answer)
            shuffled_answers[1] = decodeURIComponent(question.results[0].incorrect_answers[0])
        } else {
            shuffled_answers[1] = decodeURIComponent(question.results[0].correct_answer)
            shuffled_answers[0] = decodeURIComponent(question.results[0].incorrect_answers[0])
        }
        console.log(shuffled_answers)
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
    .setAuthor(`Catergory: ${decodeURIComponent(question.results[0].category)}`, message.client.user.avatarURL())
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

async function tenor(message = new Message(), start, search, action, aloneaction) {
    try {
        let msg = message.content.toLowerCase();
        let embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)
        let text = ''
        let user_to_find = msg.substring(start)
        let user = fx.general.find_discord_user(message, user_to_find)
        if ((user == null || user.id == message.author.id) || (action == undefined)) {
            text = aloneaction
        } else {
            text = `<@${user.id}>, ${action} <@${message.author.id}>`
        }
        let gif = (await request.get(`https://api.tenor.com/v1/search?q=${search}&key=LIVDSRZULELA&limit=25&media_filter=minimal&contentfilter=medium`)).body
        const embed = new MessageEmbed()
        .setColor(embedcolor)
        .setDescription(text)
        .setImage(gif.results[Math.floor(Math.random()*24)].media[0].gif.url);
        message.channel.send({embed})
    } catch (error) {
       message.channel.send(String(error))
    }
}

module.exports = {
    tenor,
    trivia
}