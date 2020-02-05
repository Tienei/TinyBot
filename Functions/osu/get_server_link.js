module.exports = function (mode) {
    if (mode >= 0 && mode <= 3) {
        return 'osu'
    } else if (mode >= 4 && mode <= 7) {
        return 'ripple.moe'
    } else if (mode >= 8 && mode <= 12) {
        return 'akatsuki.pw'
    }
}