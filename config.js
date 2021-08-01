let config = {
    bot_ver: 'v5.1',
    bot_default_prefix: '!',
    debug: {
        cache:                  true,
        dev_only:               false,
        disable_data_db_load:   false,
        disable_db_save:        false,
        disable_osutrack:       false,
        disable_server_count:   false,
        ignore_server_prefix:   false,
    }
}

function update_bot_prefix(prefix) {
    config.bot_prefix = prefix
}

module.exports = {config, update_bot_prefix}
