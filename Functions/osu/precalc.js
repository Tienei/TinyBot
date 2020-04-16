const request = require('superagent');
const calc = require('ojsama')

module.exports = async function (beatmapid) {
    let parser = new calc.parser()
    let map = (await request.get(`https://osu.ppy.sh/osu/${beatmapid}`).timeout({deadline: 30000})).text
    parser.feed(map)
    return parser
}