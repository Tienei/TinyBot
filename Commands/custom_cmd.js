const { Message, MessageEmbed } = require('discord.js')

function custom_cmd(message = new Message(), custom_command) {
    try {
        if (message.member.hasPermission("ADMINISTRATOR") == false) {
            throw 'You need to have administrator to set custom command'
        }
        let msg = message.content.toLowerCase();
        let embedcolor = (message.guild == null ? "#7f7fff": message.guild.me.displayColor)
        let start = 11
        let option = ''
        for (var i = start; i <= msg.length; i++) {
            if (msg.substr(i,1) == ' ' || msg.substr(i,1) == '') {
                option = msg.substring(start,i)
                start = i + 1
                break
            }
        }
        if (option == "add") {
            let cmd = ""
            let respond = ""
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
            return custom_command
        }
        if (option == "list") {
            let savedcmd = ""
            for (var i = 0; i < custom_command[message.guild.id].length; i++) {
                savedcmd += "``" + custom_command[message.guild.id][i].cmd + "``: " + custom_command[message.guild.id][i].respond
            }
            const embed = new MessageEmbed()
            .setThumbnail(message.guild.iconURL())
            .setColor(embedcolor)
            .setDescription(savedcmd);
            message.channel.send({embed})
        }
        if (option == "remove") {
            let cmd = ""
            for (var i = start; i <= msg.length; i++) {
                if (msg.substr(i,1) == ' ' || msg.substr(i,1) == '') {
                    cmd = msg.substring(start,i)
                    break
                }
            }
            if (custom_command[message.guild.id].length > 1) {
                for (var i = 0; i < custom_command[message.guild.id].length; i++) {
                    if (custom_command[message.guild.id][i].cmd == cmd) {
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
        }
    } catch (error) {
        message.channel.send(String(error))
        return null
    }
}

function cmd_detection(message = new Message(), custom_command) {
    let msg = message.content.toLowerCase();
    let command = msg.split(' ')[0]
    let respond = custom_command[message.guild.id].find(cmd => cmd.cmd == command).respond
    let define = {
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
    let requireAdmin = false
    for (var s = 0; s < respond.length; s++) {
        if (respond.substr(s,1) == '{') {
            for (var e = s; e < respond.length; e++) {
                if (respond.substr(e,1) == '}') {
                    let type = respond.substring(s+1,e)
                    type = type.replace(".", " ")
                    type = type.split(" ")
                    let found = false
                    if (type[0].substring(0,1) == "$") {
                        if (type[0].substring(1,3) == "n+") {
                            let option = message.content.split(" ")
                            let cmd = option[0].length
                            respond = respond.replace(respond.substring(s,e+1), message.content.substring(cmd+1))
                        } else {
                            let number = Number(type[0].substring(1))
                            let option = message.content.split(" ")
                            option.splice(0,1)
                            respond = respond.replace(respond.substring(s,e+1), option[number])
                            found = true
                        }
                    }
                    if (type[0].substring(0,2) == "@&") {
                        let roles = message.guild.roles.array()
                        let rolename = type[0].substring(2)
                        let role = roles.find(role => role.name.toLowerCase() == rolename).id
                        respond = respond.replace(respond.substring(s,e+1), `<@&${role}>`)
                        found = true
                    }
                    if (type[0] == "require:admin") {
                        requireAdmin = true
                        found = true
                    }
                    if (type[0].substring(0,5) == "send:") {
                        let channel = message.guild.channels.find(c => c.name == type[0].substring(5))
                        let custommsg = respond.substring(s+1,e).split('"')
                        channel.send(custommsg[1])
                        found = true
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
}

module.exports = {
    custom_cmd,
    cmd_detection
}