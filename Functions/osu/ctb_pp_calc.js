module.exports = function (star, ar, fc, combo, acc, miss, mod) {
    // Mod to binary
    let bit = mod.toString(2)
    let fullbit = "0000000000000000000000000000000".substr(bit.length) + bit
    // Conversion from Star rating to pp
    let final = Math.pow(((5*(star)/ 0.0049)-4),2)/100000; 
    // Length Bonus
    lengthbonus = (0.95 + 0.4 * Math.min(1.0, fc / 3000.0) + (fc > 3000 ? Math.log10(fc / 3000.0) * 0.5 : 0.0));
    final *= lengthbonus;
    // Miss Penalty
    final *= Math.pow(0.97, miss);
    // Not FC combo penalty
    final *= Math.pow(combo/fc,0.8);
    // AR Bonus
    if (ar>9) {
        final*= 1+  0.1 * (ar - 9.0);
    }
    if (ar<8) {
        final*= 1+  0.025 * (8.0 - ar);
    }
    // Acc Penalty
    final *=  Math.pow(acc/100, 5.5);
    // Mod applied
    if (fullbit[fullbit.length - (Math.log2(8) + 1)] == 1) {
        return final* (1.05 + 0.075 * (10.0 - Math.min(10, ar)))
    } else if (fullbit[fullbit.length - (Math.log2(1024) + 1)] == 1) {
        return final * 1.35 * lengthbonus
    } else if (fullbit[fullbit.length - (Math.log2(1024) + 1)] == 1 && fullbit[fullbit.length - (Math.log2(8) + 1)] == 1) {
        return final* 1.35 * lengthbonus*(1.05 + 0.075 * (10.0 - Math.min(10, ar)))
    } else {
        return final
    }
}