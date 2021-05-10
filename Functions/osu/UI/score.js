const score_fm = require('../score_format')

module.exports = function ({top = 0, title, beatmap_id, star, mod_text, pp, rank_icon, diff, score, rank,
    combo, fc, acc, acc_detail, fcguess, mapcomplete = '', time_ago = '', type})  {
    let showtop = ''
    let showtitle = ''
    let showpp = ''
    let showmapcomplete = ''
    if (top > 0) showtop = `${top}.`
    if (fcguess !== '') fcguess = '• ' + fcguess
    if (rank == 'F') {
        showpp = `__${Number(pp).toFixed(2)}pp__`
        showmapcomplete = mapcomplete
    }
    else showpp = `${Number(pp).toFixed(2)}pp`
    if (type == 'top' || type == 'recent') {
        showtitle = `**[${title}](https://osu.ppy.sh/b/${beatmap_id})** `
    } else if (type == 'compare') {
        showtitle = ''
    } else if (type == 'map') {
        showtitle = `**[${title}](https://osu.ppy.sh/osu/${beatmap_id})** `
    }
    let line1 = `${showtop} ${showtitle} (${star}★) \`${mod_text}\` • ${score_fm({score: score})}`
    let line2 = `\n${rank_icon} *${diff}* • **${showpp}** • x${combo}/${fc}\n`
    let line3 = `${acc.toFixed(2)}% \`${acc_detail}\` ${fcguess}`
    let line4 = `\n${showmapcomplete}${time_ago}`
    if (type == 'recent') line4 = '';
    return `${line1}${line2}${line3}${line4}\n\n`
}