const BanchoAPI = require('./BanchoAPI')
const { Beatmap } = require('../../../Classes/osu')
const get_mode_detail = require('../get_mode_detail')


module.exports = async ({beatmap_id = undefined, beatmapset_id = undefined, creator = undefined, limit = 1, mode}) => {
    try {
        let beatmap = []
        let {modenum, a_mode} = get_mode_detail({mode: mode})
        let param = {b: beatmap_id, s: beatmapset_id, u: creator, m: modenum, a: 1, limit: limit}
        let beatmaps = await BanchoAPI({ver: 1, endpoint: 'get_beatmaps', param: param})
        for (let i = 0; i < beatmaps.length; i++) {
            beatmap[i] = new Beatmap({beatmap_id: beatmaps[i].beatmap_id, title: beatmaps[i].title, creator: beatmaps[i].creator,
                                    diff: beatmaps[i].version, bpm: beatmaps[i].bpm, approved: beatmaps[i].approved,
                                    beatmapset_id: beatmaps[i].beatmapset_id, fc: beatmaps[i].max_combo,
                                    star: beatmaps[i].difficultyrating, time_total: beatmaps[i].total_length,
                                    time_drain: beatmaps[i].hit_length, favorite: beatmaps[i].favourite_count,
                                    source: beatmaps[i].source, artist: beatmaps[i].artist, circle: beatmaps[i].count_normal,
                                    slider: beatmaps[i].count_slider, spinner: beatmaps[i].count_spinner,
                                    cs: beatmaps[i].diff_size, od: beatmaps[i].diff_overall, ar: beatmaps[i].diff_approach,
                                    hp: beatmaps[i].diff_drain, a_mode: a_mode})
        }
        return beatmap
    } catch (err) {
        console.log(`\ngetbeatmap.js\n${err}`)
    }
}