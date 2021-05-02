module.exports = ({star, ar, fc, combo, acc, miss, mod}) => {
    // Mod to binary
    let mods = []
    mod = mod.replace('+', '')
    for (let i = 0; i < mod.length; i+=2) {
        mods.push(mod.substr(i,2))
    }
    // Conversion from Star rating to pp
    let final = Math.pow(((5*(star)/ 0.0049)-4),2)/100000; 
    // Length Bonus
    let lengthbonus = (0.95 + 0.3 * Math.min(1.0, fc / 2500.0) + (fc > 2500 ? Math.log10(fc / 2500.0) * 0.475 : 0.0));
    final *= lengthbonus;
    // Miss Penalty
    final *= Math.pow(0.97, miss);
    // Not FC combo penalty
    final *= Math.pow(combo/fc,0.8);
    // AR Bonus
    let arbonus = 1
    if (ar>9)  arbonus += 0.1 * (ar - 9.0);
    if (ar>10) arbonus += 0.1 * (value - 10.0)
    if (ar<8)  arbonus += 0.025 * (8.0 - ar);
    final *= arbonus
    // Hidden bonus
    let hiddenbonus = 1;
    if (ar>10) hiddenbonus= 1.01 + 0.04 * (11 - Math.min(11,ar));
    else       hiddenbonus= 1.05 + 0.075 * (10 - ar);
    // Acc Penalty
    final *=  Math.pow(acc/100, 5.5);
    if (mods.includes('HD')) final *= hiddenbonus
    if (mods.includes('FL')) final *= 1.35 * lengthbonus
    return final
}