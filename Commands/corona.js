const request = require('superagent')
const cheerio = require('cheerio')
const { Message, MessageEmbed } = require('discord.js')
const fs = require('fs')
const fx = require('./../Functions/load_fx')

let country_list = JSON.parse(fs.readFileSync('./country-data/country.json', 'utf-8'))

async function corona_live_update(message = new Message()) {
    let web = (await request('https://docs.google.com/spreadsheets/d/e/2PACX-1vQuDj0R6K85sdtI8I-Tc7RCx8CnIxKUQue0TCUdrFOKDw9G3JRtGhl64laDd3apApEvIJTdPFJ9fEUL/pubhtml?gid=0&single=true')).text
    let data = await cheerio.load(web)
    let table = data('table[class="waffle"]').children('tbody').children()
    let country_data = []
    for (let i = 1; i < table.length - 1; i++) {
        let country_name = data(table[i]).children('td').eq(1).text()
        let country_case = data(table[i]).children('td').eq(2).text()
        let country_death = data(table[i]).children('td').eq(3).text()
        let country_recover = data(table[i]).children('td').eq(4).text()
        let exception ={
            "BOSNIA-HERZEGOVINA": "Bosnia and Herzegovina",
            "CABO VERDE": "Cape Verde",
            "CHINA, Mainland": "China",
            "CZECH REPUBLIC": "Czechia",
            "MACAU": "Macao",
            "DPR KOREA": "North Korea",
            "MICRONESIA (FED. STATES OF)": "Micronesia",
            "S. KOREA": "South Korea",
            "S. AFRICA": "South Africa",
            "S. SUDAN": "South Sudan",
            "UAE": "United Arab Emirates",
            "FAEROE ISLANDS": "Faroe Islands"

        }
        if (exception[country_name]) {
            country_name = exception[country_name]
        }
        if (!country_name.includes('noname') && country_case > 0) {
            country_data.push({name: country_name, case: country_case, death: country_death, recover: country_recover})
        }
    }
    country_data.sort((a,b) => b.case - a.case)
    let loadpage = async function (page, pages) {
        let gathering = ''
        for (var n = 0; n < 10; n++) {
            let i = (page - 1) * 10 - 1 + (n+1)
            if (i <= country_data.length- 1) {
                let data = country_list.find(c => c.Country_Name.toLowerCase().includes(country_data[i].name.toLowerCase()))
                let code = ''
                let name = ''
                let continent = ''
                if (data) {
                    code = `:flag_${data.Two_Letter_Country_Code.toLowerCase()}:`
                    name = data.Country_Name
                    continent = data.Continent_Name
                } else {
                    name = country_data[i].name
                    continent = 'unknown'
                }
                let ill = country_data[i].case - country_data[i].death - country_data[i].recover
                gathering += `\n ${code} \`${name}\`, **${continent}**\nTotal Cases: \`${country_data[i].case}\` (:bed:: \`${ill}\` :skull:: \`${country_data[i].death}\` :green_heart:: \`${country_data[i].recover}\`)`
            }
        }
        pages[page-1] = gathering
        return pages
    }
    fx.general.page_system(message, {load: loadpage}, `Live coronavirus update (Updates every 5 mins): (Page {page} of {max_page})`, 'https://cdn.cnn.com/cnnnext/dam/assets/200130165125-corona-virus-cdc-image-super-tease.jpg', ' #FFFF00', Math.ceil(country_data.length / 10), 15000 * Math.ceil(country_data.length / 10))
}

module.exports = {corona_live_update}