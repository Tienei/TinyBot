const superagent = require('superagent')

let expire_time = 0;

async function get_v2_token() {
    let token = await superagent.post("https://osu.ppy.sh/oauth/token").set('Content-Type', 'application/json').send(
                {"grant_type": "client_credentials",
                "client_id": process.env.OSU_CLIENT_ID,
                "client_secret": process.env.OSU_CLIENT_SECRET,
                "scope": "public"})
    process.env.OSU_V2_KEY = token.body.access_token
    expire_time = new Date().getTime()
}

module.exports = async ({ver, endpoint, param = {}}) => {
    try {
        let data = ''
        if (ver == 1) {
            let key = process.env.OSU_KEY
            data = await superagent.get(`https://osu.ppy.sh/api/${endpoint}`).query({...param, k: key})
        } else if (ver == 2) {
            if (!process.env.OSU_V2_KEY || new Date().getTime() - new Date(expire_time).getTime() > 72000000) await get_v2_token()
            data = await superagent.get(`https://osu.ppy.sh/api/v2/${encodeURI(endpoint)}`).query(param).set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${process.env.OSU_V2_KEY}`)
        }
        return data.body
    } catch (err) {
        console.log(`\nBanchoAPI.js\n${err}`)
        return null
    }
}