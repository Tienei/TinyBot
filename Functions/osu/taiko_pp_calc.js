module.exports = function (star, od, fc, acc, miss, mod) {
    // Maximum combo for converted taiko map is roughly estimated sadly :c
    // Mod to binary
    let bit = mod.toString(2)
    let fullbit = "0000000000000000000000000000000".substr(bit.length) + bit
    // Calc
    if (fullbit[fullbit.length - (Math.log2(2) + 1)] == 1) {
        od /= 2
    }
    if (fullbit[fullbit.length - (Math.log2(16) + 1)] == 1) {
        od *= 1.4
    }
    od = Math.max(Math.min(od,10),0)
    let max = 20
    let min = 50
    let result = min + (max - min) * od / 10
    result = Math.floor(result) - 0.5
    if (fullbit[fullbit.length - (Math.log2(256) + 1)] == 1) {
        result /= 0.75
    }
    if (fullbit[fullbit.length - (Math.log2(64) + 1)] == 1 || fullbit[fullbit.length - (Math.log2(512) + 1)] == 1) {
        result /= 1.5
    }
    od = Math.round(result * 100) / 100
    let StrainValue = Math.pow(Math.max(1,star/0.0075) * 5 - 4,2)/100000
    let LengthBonus = Math.min(1,fc/1500) * 0.1 + 1
    StrainValue *= LengthBonus
    StrainValue *= Math.pow(0.985,miss)
    StrainValue *= Math.min(Math.pow(fc - miss,0.5) / Math.pow(fc,0.5),1)
    StrainValue *= acc/100
    let AccValue = Math.pow(150/od,1.1) * Math.pow(acc/100,15) * 22
    AccValue *= Math.min(Math.pow(fc/1500,0.3),1.15)
    let modMultiplier = 1.10
    if (fullbit[fullbit.length - (Math.log2(8) + 1)] == 1) {
        modMultiplier *= 1.10
        StrainValue *= 1.025
    }
    if (fullbit[fullbit.length - (Math.log2(1) + 1)] == 1) {
        modMultiplier *= 0.90
    }
    if (fullbit[fullbit.length - (Math.log2(1024) + 1)] == 1) {
        StrainValue *= 1.05 * LengthBonus
    }
    return Math.pow(Math.pow(StrainValue,1.1) + Math.pow(AccValue,1.1),1.0/1.1) * modMultiplier;
}