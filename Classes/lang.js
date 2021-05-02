class Lang {
    constructor(lang_file) {
        this.avatar = {
            "text": lang_file["avatar"]?.text
        },
        this.bug_and_suggest = {
            "bug": lang_file["bug_and_suggest"]?.bug,
            "suggestion": lang_file["bug_and_suggest"]?.suggestion
        }
        this.osu = {
            "profile": {
                "desc1": lang_file["osu"]?.profile?.desc1,
                "desc2": lang_file["osu"]?.profile?.desc2,
                "prev_username": lang_file["osu"]?.profile?.prev_username,
                "performance": lang_file["osu"]?.profile?.performance,
                "global_rank": lang_file["osu"]?.profile?.global_rank,
                "acc": lang_file["osu"]?.profile?.acc,
                "play_count": lang_file["osu"]?.profile?.play_count,
                "play_style": lang_file["osu"]?.profile?.play_style,
                "lvl": lang_file["osu"]?.profile?.lvl,
                "rank": lang_file["osu"]?.profile?.rank,
                "ranked_score": lang_file["osu"]?.profile?.ranked_score,
                "total_score": lang_file["osu"]?.profile?.total_score
            },
            "fx_calc_pp": {
                "completed": lang_file["osu"]?.fx_calc_pp?.completed,
                "fc_guess": lang_file["osu"]?.fx_calc_pp?.fc_guess
            },
            "fx_check_player": {
                "author_text": lang_file["osu"]?.fx_check_player?.author_text,
                "others_text": lang_file["osu"]?.fx_check_player?.others_text
            }
        }
        this.errors = {
            "osu": {
                "player_null": lang_file["errors"]?.osu?.player_null,
                "no_recent_play": lang_file["errors"]?.osu?.no_recent_play,
                "relax_err": lang_file["osu"]?.osu?.relax_err
            }
        }
    }
}

module.exports = {Lang}