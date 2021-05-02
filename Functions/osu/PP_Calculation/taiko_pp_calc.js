module.exports = ({star, od, combo, acc, miss, mod}) => {
    // Maximum combo for converted taiko map is roughly estimated sadly :c
    let mods = []
    mod = mod.replace('+', '').toUpperCase()
    for (let i = 0; i < mod.length; i+=2) {
        mods.push(mod.substr(i,2))
    }
    od = Math.max(Math.min(od,10),0)
    let max = 20
    let min = 50
    let result = min + (max - min) * od / 10
    result = Math.floor(result) - 0.5
    result /= mods.includes('HT') ? 0.75 : mods.includes('DT') ? 1.5 : 1
    let od_300 = Math.round(result * 100) / 100
    //
    let StrainValue = Math.pow(Math.max(1,star/0.0075) * 5 - 4,2)/100000
    let LengthBonus = Math.min(1,combo/1500) * 0.1 + 1
    StrainValue *= LengthBonus * Math.pow(0.985,miss) * Math.min(Math.pow(combo - miss,0.5) / Math.pow(combo,0.5),1) * (acc/100)
    let AccValue = Math.pow(150/od_300,1.1) * Math.pow(acc/100,15) * 22 * Math.min(Math.pow(combo/1500,0.3),1.15)
    let modMultiplier = 1.10
    modMultiplier *= mods.includes('HD') ? 1.10 : mods.includes('NF') ? 0.90 : 1
    StrainValue *= mods.includes('HD') ? 1.025 : mods.includes('FL') ? 1.05 * LengthBonus : 1
    return Math.pow(Math.pow(StrainValue,1.1) + Math.pow(AccValue,1.1),1.0/1.1) * modMultiplier;
}