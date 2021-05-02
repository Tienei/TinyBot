let config = {
    bot_ver: 'v5.0',
    bot_default_prefix: '!',
    debug: {
        disable_osutrack: false,
        dev_only: false,
        disable_db_save: false,
        cache: true,
        ignore_server_prefix: false,
        disable_server_count: false
    }
}

function update_bot_prefix(prefix) {
    config.bot_prefix = prefix
}

module.exports = {config, update_bot_prefix}
