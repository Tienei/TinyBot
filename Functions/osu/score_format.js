module.exports = ({score}) => {
    let fm_score = score;
    if (score >= 1000) {
        let units = ['k', 'M', 'B', 'T']
        let div = Math.floor((score.toFixed(0).length - 4) / 3)
        fm_score = `${Number(score / Math.pow(1000, 1 + div)).toFixed(2)}${units[div]}`
    }
    return fm_score
}