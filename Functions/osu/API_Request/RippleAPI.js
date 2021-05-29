const request = require('superagent')
const get_mode_detail = require('../get_mode_detail')

function websiteKey(mode) {
    let type = get_mode_detail({mode: mode}).check_type
    let apiKey = {
        'Akatsuki': process.env.AKATSUKI_KEY,
        'Ripple': process.env.RIPPLE_KEY,
        'Horizon': process.env.HORIZON_KEY,
        'Enjuu': process.env.ENJUU_KEY
    }
    return apiKey[type]
}

function websiteBaseURL(mode) {
    console.log(mode)
    let url = get_mode_detail({mode: mode}).link
    return `https://${url}/api`
}

async function apiCall({endpoint, mode, options}) {
    let apiKey = websiteKey(mode)
    options.k = apiKey;
    let baseURL = websiteBaseURL(mode)
    console.log(baseURL + endpoint)
    console.log(options)
    try {
        const resp = await request.get(baseURL + endpoint).query(options);
        return resp.body;
    } catch (error) {
        throw new Error(error.response || error);
    }
}

module.exports = apiCall