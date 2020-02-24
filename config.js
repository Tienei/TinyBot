let config = {
    bot_ver: 'v4.1',
    bot_default_prefix: 't!',
    debug: {
        osutrack: true,
        command: true,
        disable_db_save: true
    },
    // Modify by code
    bot_prefix: 't!'
}

function update_bot_prefix(prefix) {
    config.bot_prefix = prefix
}

module.exports = {config, update_bot_prefix}