module.exports = function (top = 0, title, id, star, shortenmod, pp, nopp = '', rank, diff, score, combo, fc, acc, accdetail, fcguess, mapcompletion = '', date, type) {
    let showtop = ''
    let showtitle = ''
    if (top > 0) {
        showtop = `${top}. `
    }
    if (fcguess !== '') {
        fcguess = '◆ ' + fcguess
    }
    if (type == 'beatmap') {
        showtitle = `[${title}](https://osu.ppy.sh/b/${id})`
    } else if (type == 'profile') {
        showtitle = `[${title}](https://osu.ppy.sh/u/${id})`
    } else if (type == 'none') {
        showtitle = title
    }
    return `
${showtop}**${showtitle}** (${star}★) ${shortenmod} ◆ ${(score).toLocaleString('en')}
${rank} *${diff}* ◆ ***${pp.toFixed(2)}pp*** ${nopp} ${fcguess}
x${combo}/${fc} ◆ **Acc:** ${acc.toFixed(2)}% ${accdetail} 
${mapcompletion} ${date}
`
}