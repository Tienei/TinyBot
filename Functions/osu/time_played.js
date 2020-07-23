module.exports = function (time) {
    let dateago = new Date(time).getTime()
    let datenow = Date.now()
    let datenew = new Date(datenow - dateago)
    let time_table = [{value: (datenew.getUTCFullYear() - 1970), suffix: 'y'},
                        {value: datenew.getUTCMonth(), suffix: 'mo'},
                        {value: (datenew.getUTCDate() - 1), suffix: 'd'},
                        {value: datenew.getUTCHours(), suffix: 'h'},
                        {value: datenew.getUTCMinutes(), suffix: 'm'},
                        {value: datenew.getUTCSeconds(), suffix: 's'},]
    let text = ''
    let count = 0
    for (let i = 0; i < time_table.length; i++) {
        if (count < 2) {
            if (time_table[i].value > 0) {
                text += `${time_table[i].value + time_table[i].suffix} `
                count++
            } 
        } else {
            break
        }
    }
    text += 'ago'
    return text
}