let config = {
    bot_ver: 'v4.0',
    bot_default_prefix: '!',
    debug: {
        osutrack: false,
        command: false
    },
    // Modify by code
    bot_prefix: '!'
}

function update_bot_prefix(prefix) {
    config.bot_prefix = prefix
}

module.exports = {config, update_bot_prefix}