const fs = require('fs')
const { Lang: LangClass } = require('../Classes/lang.js')

module.exports = ({lang}) => {
    const data = JSON.parse(fs.readFileSync(`./Lang/${lang}.json`, 'utf-8'))
    return new LangClass(data)
}