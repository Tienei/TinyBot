const numbermods = [
    {mod_text: "MR", mod_bit: 1 << 30},
    {mod_text: "V2", mod_bit: 1 << 29},
    {mod_text: "2K", mod_bit: 1 << 28},
    {mod_text: "3K", mod_bit: 1 << 27},
    {mod_text: "1K", mod_bit: 1 << 26},
    {mod_text: "KC", mod_bit: 1 << 25},
    {mod_text: "9K", mod_bit: 1 << 24},
    {mod_text: "TG", mod_bit: 1 << 23},
    {mod_text: "CN", mod_bit: 1 << 22},
    {mod_text: "RD", mod_bit: 1 << 21},
    {mod_text: "FI", mod_bit: 1 << 20},
    {mod_text: "8K", mod_bit: 1 << 19},
    {mod_text: "7K", mod_bit: 1 << 18},
    {mod_text: "6K", mod_bit: 1 << 17},
    {mod_text: "5K", mod_bit: 1 << 16},
    {mod_text: "4K", mod_bit: 1 << 15},
    {mod_text: "PF", mod_bit: 1 << 14},
    {mod_text: "AP", mod_bit: 1 << 13},
    {mod_text: "SO", mod_bit: 1 << 12},
    {mod_text: "AU", mod_bit: 1 << 11},
    {mod_text: "FL", mod_bit: 1 << 10},
    {mod_text: "NC", mod_bit: 1 << 9},
    {mod_text: "HT", mod_bit: 1 << 8},
    {mod_text: "RX", mod_bit: 1 << 7},
    {mod_text: "DT", mod_bit: 1 << 6},
    {mod_text: "SD", mod_bit: 1 << 5},
    {mod_text: "HR", mod_bit: 1 << 4},
    {mod_text: "HD", mod_bit: 1 << 3},
    {mod_text: "TD", mod_bit: 1 << 2},
    {mod_text: "EZ", mod_bit: 1 << 1},
    {mod_text: "NF", mod_bit: 1}
]
module.exports = ({mod}) => {
    let mod_text = '+';
    let mod_num = 0
    if (!isNaN(mod)) {
        mod_num = mod
        let bit = mod.toString(2)
        let fullbit = "0000000000000000000000000000000".substr(bit.length) + bit
        for (let i = 30; i >= 0; i--) {
            if (fullbit[i] == 1)  {
                mod_text += numbermods[i].mod_text
            }
        }
    } else {
        mod = mod.toUpperCase()
        if (mod !== 'NM') {
            for (let i = 0; i < mod.length / 2; i++) {
                let find_mod = numbermods.find(m => m.mod_text == mod.substr(i*2, 2))
                mod_text += find_mod.mod_text
                mod_num |= find_mod.mod_bit
            }
        }
    }
    if (mod_text.includes('NC') && mod_text.includes('DT')) mod_text = mod_text.replace('DT', '');
    if (mod_text.includes('PF') && mod_text.includes('SD')) mod_text = mod_text.replace('SD', '');
    if (mod_num == 0) mod_text += 'NM';
    return {mod_text: mod_text, mod_num: mod_num}
}
