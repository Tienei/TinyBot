const request = require('superagent');
const calc = require('ojsama')
const fs = require('fs')
const lz_string = require('lz-string')
const config = require('./../../config')
const path = './beatmap-cache/'
let current_process = []

async function downloadFile(beatmapid) {
    let map = undefined
    try {
        map = (await request.get(`https://osu.ppy.sh/osu/${beatmapid}`)).text
    } catch (error) {}
    if (map == undefined) {
        map = (await request.get(`https://bloodcat.com/osu/b/${beatmapid}`)).text
    } 
    return map
}

module.exports = async function (beatmapid) {
    let parser = new calc.parser()
    if (fs.existsSync(`${path}${beatmapid}.osu`)) {
        let decode = fs.readFileSync(`${path}${beatmapid}.osu`, 'ascii')
        let map = lz_string.decompressFromEncodedURIComponent(decode)
        parser.feed(map)
        return parser
    } else if (current_process.includes(`${path}${beatmapid}.osu`)) {
        console.log("Already saving file")  
        let map = await downloadFile(beatmapid)
        parser.feed(map)
        return parser
    } else {
        current_process.push(`${path}${beatmapid}.osu`)
        let map = await downloadFile(beatmapid)
        if (!config.config.debug.command) {
            let encode = lz_string.compressToEncodedURIComponent(map)
            fs.writeFileSync(`${path}${beatmapid}.osu`, encode)
        }
        parser.feed(map)
        current_process.shift()
        return parser
    }
}
