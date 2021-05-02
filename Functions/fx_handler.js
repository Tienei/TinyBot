module.exports = {
    general: {
        get_discord_user: require('./general/get_discord_user'),
        check_suffix: require('./general/check_suffix'),
        page_system: require('./general/page_system'),
        cmd_cooldown: require('./general/cmd_cooldown')
    },
    osu: {
        ui: {
            profile: require('./osu/UI/profile'),
            score: require('./osu/UI/score'),
            beatmap: require('./osu/UI/beatmap'),
        },
        api: {
            get_profile: require('./osu/API_Request/get_profile'),
            get_top: require('./osu/API_Request/get_top'),
            get_score: require('./osu/API_Request/get_score'),
            get_beatmap: require('./osu/API_Request/get_beatmap'),
        },
        get_mode_detail: require('./osu/get_mode_detail'),
        get_icon: require('./osu/icon_lib'),
        check_player: require('./osu/check_player'),
        get_profile_link: require('./osu/get_profile_link'),
        precalc: require('./osu/PP_Calculation/precalc'),
        get_calc_pp: require('./osu/PP_Calculation/get_calc_pp'),
        mods_enum: require('./osu/mods_enum'),
        calc_player_skill: require('./osu/calc_player_skill'),
        time_ago: require('./osu/time_ago'),
    }
}