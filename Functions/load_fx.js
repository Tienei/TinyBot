module.exports = {
    general: {
        cmd_cooldown        : require('./general/cmd_cooldown'),
        find_discord_user   : require('./general/find_discord_user'),
        page_system         : require('./general/page_system')
    },
    osu: {
        // PP Calculation
        precalc             : require('./osu/precalc'),
        osu_pp_calc         : require('./osu/osu_pp_calc'),
        other_modes_precalc : require('./osu/other_modes_precalc'),
        taiko_pp_calc       : require('./osu/taiko_pp_calc'),
        ctb_pp_calc         : require('./osu/ctb_pp_calc'),
        mania_pp_calc       : require('./osu/mania_pp_calc'),
        // Get player's data
        get_mode_detail     : require('./osu/get_mode_detail'),
        get_osu_profile     : require('./osu/get_osu_profile'),
        get_osu_top         : require('./osu/get_osu_top'),
        get_osu_beatmap     : require('./osu/get_osu_beatmap'),
        get_osu_scores      : require('./osu/get_osu_scores'),
        get_pp              : require('./osu/get_pp'),
        // Overlays
        profile_overlay     : require('./osu/profile_overlay'),
        score_overlay       : require('./osu/score_overlay'),
        map_detail_overlay  : require('./osu/map_detail_overlay'),
        // Checks
        check_player        : require('./osu/check_player'),
        check_suffix        : require('./osu/check_suffix'),
        // Others
        ranking_letter      : require('./osu/ranking_letter'),
        mods_enum           : require('./osu/mods_enum'),
        time_played         : require('./osu/time_played'),
        beatmap_detail      : require('./osu/beatmap_detail'),
        rippleAPI           : require('./osu/rippleAPI')
    }
}
