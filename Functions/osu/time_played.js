module.exports = function (time) {
    let dateago = new Date(time).getTime()
    let datenow = Date.now()
    let datenew = new Date(datenow - dateago)
    let sec = datenew.getUTCSeconds()
    let min = datenew.getUTCMinutes()
    let hour = datenew.getUTCHours()
    let day = (datenew.getUTCDate() - 1)
    let month = datenew.getUTCMonth()
    let year = (datenew.getUTCFullYear() - 1970)
    let text = ''
    let count = 0
    if (year > 0 && count < 2) {
        text += year > 1 ? `${year} Years ` : `${year} Year `
        count += 1
    } 
    if (month > 0 && count < 2) {
        text += month > 1 ? `${month} Months ` : `${month} Month `
        count += 1
    } 
    if (day > 0 && count < 2) {
        text += day > 1 ? `${day} Days ` : `${day} Day `
        count += 1
    }
    if (hour > 0 && count < 2)  {
        text += hour > 1 ? `${hour} Hours ` : `${hour} Hour `
        count += 1
    } 
    if (min > 0 && count < 2) {
        text += min > 1 ? `${min} Minutes ` : `${min} Minute `
        count += 1
    }
    if (sec > 0 && count < 2) {
        text += sec > 1 ? `${sec} Seconds ` : `${sec} Second `
        count += 1
    }
    text += ' ago'
    return text
}