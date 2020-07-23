module.exports = function (star) {
    let icon;
    if (star >= 6.5) icon = '<:expert_plus:735476229901385828>'
    else if (star >= 5.3) icon = '<:expert:735474354435129396>'
    else if (star >= 4) icon = '<:insane:735476229905449020>'
    else if (star >= 2.7) icon = '<:hard:735476229926289548>'
    else if (star >= 2) icon = '<:normal:735476229938872360>'
    else  icon = '<:easy:735476229456789517>'
    return icon;
}