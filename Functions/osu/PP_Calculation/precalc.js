const request = require('superagent');
const calc = require('ojsama')
const fs = require('fs')
const lz_string = require('lz-string')
const config = require('../../../config')
const path = './beatmap-cache/'
let current_process = []

async function downloadFile({beatmap_id}) {
    let map = undefined
    try {
        map = (await request.get(`https://osu.ppy.sh/osu/${beatmap_id}`)).text
    } catch (error) {}
    if (map == undefined) {
        map = (await request.get(`https://bloodcat.com/osu/b/${beatmap_id}`)).text
    } 
    return map
}

module.exports = async function ({beatmap_id}) {
    let parser = new calc.parser()
    if (fs.existsSync(`${path}${beatmap_id}.osu`)) {
        let decode = fs.readFileSync(`${path}${beatmap_id}.osu`, 'ascii')
        let map = lz_string.decompressFromEncodedURIComponent(decode)
        parser.feed(map)
        return parser
    } else if (current_process.includes(`${path}${beatmap_id}.osu`)) {
        console.log("Already saving file")  
        let map = await downloadFile({beatmap_id})
        parser.feed(map)
        return parser
    } else {
        current_process.push(`${path}${beatmap_id}.osu`)
        let map = await downloadFile({beatmap_id})
        if (config.config.debug.cache) {
            let encode = lz_string.compressToEncodedURIComponent(map)
            fs.writeFileSync(`${path}${beatmap_id}.osu`, encode)
        }
        parser.feed(map)
        current_process.shift()
        return parser
    }
}