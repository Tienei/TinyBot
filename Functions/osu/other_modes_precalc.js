const nodeosu = require('node-osu')
// Functions
const mods_enum = require('./mods_enum')
const beatmap_detail = require('./beatmap_detail')

let osuApi = new nodeosu.Api(process.env.OSU_KEY, {
    notFoundAsError: false,
    completeScores: true
});

// fullbit[fullbit.length - (Math.log2( Mod's bitpresent ) + 1)] == 1

module.exports = async function (beatmapid, mode, mod) {
    let bit = mod.toString(2)
    let fullbit = "0000000000000000000000000000000".substr(bit.length) + bit
    let bitpresent = 0
    let map = ''
    if (fullbit[fullbit.length - (Math.log2(64) + 1)] == 1) {
        bitpresent += 64
    }
    if (fullbit[fullbit.length - (Math.log2(256) + 1)] == 1) {
        bitpresent += 256
    }
    if (fullbit[fullbit.length - (Math.log2(16) + 1)] == 1) {
        bitpresent += 16
    }
    if (fullbit[fullbit.length - (Math.log2(2) + 1)] == 1) {
        bitpresent += 2
    }
    if (bitpresent > 0) {
        map = await osuApi.apiCall('/get_beatmaps', {b: beatmapid, m: mode, a: 1, mods: bitpresent})
    } else {
        map = await osuApi.apiCall('/get_beatmaps', {b: beatmapid, m: mode, a: 1})
    }
    let ar = map[0].diff_approach
    let fc = Number(map[0].count_normal) + Number(map[0].count_slider)
    if (mode == 2) {
        let textmod = mods_enum(mod, "number")
        ar = beatmap_detail(textmod.shortenmod, 0, 0, 0, 0, map[0].diff_approach, 0, 0).ar
        fc = map[0].max_combo
    }
    return {
        star: Number(map[0].difficultyrating), 
        cs: Number(map[0].diff_size),
        ar: Number(ar),
        od: Number(map[0].diff_overall),
        hp: Number(map[0].diff_drain),
        circle: Number(map[0].count_normal),
        slider: Number(map[0].count_slider),
        fc: fc
    }
}
