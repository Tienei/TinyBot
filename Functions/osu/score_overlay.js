module.exports = function ({top = 0, title, id, star, shortenmod, pp, rank, diff, score, letter,
                            combo, fc, acc, accdetail, fcguess, mapcompletion = '', date = '', type}) 
{
    let showtop = ''
    let showtitle = ''
    let showpp = ''
    if (top > 0) showtop = `${top}.`
    if (fcguess !== '') fcguess = '• ' + fcguess
    if (letter == 'F') showpp = `__${pp.toFixed(2)}pp__`
    else showpp = `${pp.toFixed(2)}pp`
    if (type == 'top' || type == 'recent') {
        showtitle = `**[${title}](https://osu.ppy.sh/b/${id})** `
    } else if (type == 'score') {
        showtitle = ''
    }
    let line1 = `${showtop} ${showtitle} (${star}★) \`${shortenmod}\` • ${(score).toLocaleString('en')}`
    let line2 = `\n${rank} *${diff}* • **${showpp}** ${fcguess}`
    let line3 = `\nx${combo}/${fc} • ${acc.toFixed(2)}% \`${accdetail}\``
    let line4 = `\n${mapcompletion} ${date}`
    if (type == 'recent') line4 = '';
    return `${line1}${line2}${line3}${line4}\n\n`
}