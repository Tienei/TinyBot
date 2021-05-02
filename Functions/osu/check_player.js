const { Message } = require('discord.js-light')
const error_report = require('../../Utils/error')
const getLocalText = require('../../Lang/lang_handler')

/** 
 * @param {{message: Message}} 
 */
module.exports = ({user_data, message, name, type, prefix, lang}) => {
    try {
        let localText = getLocalText({lang: lang}).osu.fx_check_player
        if (name == '') {
            if (user_data[message.author.id]?.name?.[type.toLowerCase()]) {
                return user_data[message.author.id].name[type.toLowerCase()]
            } else {
                let error_text = localText.author_text.replace('{type}', type).replace('{prefix}', prefix)
                if (type == 'Bancho') error_text = error_text.replace('{server_cmd}', '')
                else error_text = error_text.replace('{server_cmd}', `-${type.toLowerCase()}`)
                message.channel.send(error_report({type: 'custom', err_message: error_text}))
                return null
            }
        } else {
            let id = ''
            if (name.includes('@')) {
                id = message.mentions.users.first().id
                if (user_data[id] && user_data[id]?.name?.[type.toLowerCase()]) {
                    return user_data[id].name[type.toLowerCase()]
                } else {
                    message.channel.send(error_report({type: 'custom', err_message: localText.others_text}))
                    return null
                }
            } else {
                return name
            }
        }
    } catch (err) {
        message.channel.send(error_report({type: 'normal', err_message: err.stack.toString()}))
    }
}