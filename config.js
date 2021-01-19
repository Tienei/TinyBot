let config = {
    bot_ver: 'v4.4',
    bot_default_prefix: '!',
    debug: {
        osutrack: false,
        command: false,
        disable_db_save: false,
        cache: true
    },
    // Modify by code
    bot_prefix: '!'
}

function update_bot_prefix(prefix) {
    config.bot_prefix = prefix
}

module.exports = {config, update_bot_prefix}
