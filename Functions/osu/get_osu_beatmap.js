const nodeosu = require('node-osu');

let osuApi = new nodeosu.Api(process.env.OSU_KEY, {
    notFoundAsError: false,
    completeScores: true
});

module.exports = async function (beatmapID, mode) {
    if (mode == 4 || mode == 8 || mode == 12 || mode == 13 || mode == 17) mode = 0
    let beatmap = await osuApi.getBeatmaps({b: beatmapID, m: mode})
    return {
        beatmapid: Number(beatmap[0].id),
        title: beatmap[0].title,
        creator: beatmap[0].creator,
        diff: beatmap[0].version,
        bpm: Number(beatmap[0].bpm),
        approvalStatus: beatmap[0].approvalStatus,
        beatmapsetID: Number(beatmap[0].beatmapSetId),
        fc: Number(beatmap[0].maxCombo),
        star: Number(beatmap[0].difficulty.rating),
        timetotal: Number(beatmap[0].length.total),
        timedrain: Number(beatmap[0].length.drain),
        favorite: Number(beatmap[0].counts.favorites)
    }
}