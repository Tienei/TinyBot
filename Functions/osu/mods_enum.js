const { Constants } = require('node-osu')

module.exports = function (mod) {
    const numbermods = [
        {mod: "NF", bitpresent: Constants.Mods.NoFail,      pos: 31},
        {mod: "EZ", bitpresent: Constants.Mods.Easy,        pos: 30},
        {mod: "TD", bitpresent: Constants.Mods.TouchDevice, pos: 29},
        {mod: "HD", bitpresent: Constants.Mods.Hidden,      pos: 28},
        {mod: "HR", bitpresent: Constants.Mods.HardRock,    pos: 27},
        {mod: "SD", bitpresent: Constants.Mods.SuddenDeath, pos: 26},
        {mod: "DT", bitpresent: Constants.Mods.DoubleTime,  pos: 25},
        {mod: "RX", bitpresent: Constants.Mods.Relax,       pos: 24},
        {mod: "HT", bitpresent: Constants.Mods.HalfTime,    pos: 23},
        {mod: "NC", bitpresent: Constants.Mods.Nightcore,   pos: 22},
        {mod: "FL", bitpresent: Constants.Mods.Flashlight,  pos: 21},
        {mod: "AU", bitpresent: Constants.Mods.Autoplay,    pos: 20},
        {mod: "SO", bitpresent: Constants.Mods.SpunOut,     pos: 19},
        {mod: "AP", bitpresent: Constants.Mods.Relax2,      pos: 18},
        {mod: "PF", bitpresent: Constants.Mods.Perfect,     pos: 17},
        {mod: "4K", bitpresent: Constants.Mods.Key4,        pos: 16},
        {mod: "5K", bitpresent: Constants.Mods.Key5,        pos: 15},
        {mod: "6K", bitpresent: Constants.Mods.Key6,        pos: 14},
        {mod: "7K", bitpresent: Constants.Mods.Key7,        pos: 13},
        {mod: "8K", bitpresent: Constants.Mods.Key8,        pos: 12},
        {mod: "FI", bitpresent: Constants.Mods.FadeIn,      pos: 11},
        {mod: "RD", bitpresent: Constants.Mods.Random,      pos: 10},
        {mod: "CN", bitpresent: Constants.Mods.Cinema,      pos: 9},
        {mod: "TG", bitpresent: Constants.Mods.Target,      pos: 8},
        {mod: "9K", bitpresent: Constants.Mods.Key9,        pos: 7},
        {mod: "KC", bitpresent: Constants.Mods.KeyCoop,     pos: 6},
        {mod: "1K", bitpresent: Constants.Mods.Key1,        pos: 5},
        {mod: "3K", bitpresent: Constants.Mods.Key3,        pos: 4},
        {mod: "2K", bitpresent: Constants.Mods.Key2,        pos: 3},
        {mod: "V2", bitpresent: Constants.Mods.ScoreV2,     pos: 2},
        {mod: "MR", bitpresent: Constants.Mods.Mirror,      pos: 1}
    ]
    let shortenmod = '+';
    let bitpresent = 0
    if (isNaN(mod) == false) {
        bitpresent = mod
        let bit = mod.toString(2)
        let fullbit = "0000000000000000000000000000000".substr(bit.length) + bit
        for (var i = 31; i >= 0; i--) {
            if (fullbit[i] == 1) {
                shortenmod += numbermods.find(m => m.pos == i+1).mod
            }
        }
    } else {
        mod = mod.toUpperCase()
        if (mod !== 'NM') {
            for (var i = 0; i < mod.length / 2; i++) {
                let find_mod = numbermods.find(m => m.mod == mod.substr(i*2, 2))
                shortenmod += find_mod.mod
                bitpresent += find_mod.bitpresent
                if (find_mod.mod == 'NC') {
                    bitpresent += Constants.Mods.DoubleTime
                }
                if (find_mod.mod == 'PF') {
                    bitpresent += Constants.Mods.SuddenDeath
                }
            }
        }
    }
    if (shortenmod.includes('NC') && shortenmod.includes('DT')) {
        shortenmod = shortenmod.replace('DT', '')
    }
    if (shortenmod.includes('PF') && shortenmod.includes('SD')) {
        shortenmod = shortenmod.replace('SD', '')
    }
    if (bitpresent == 0) {
        shortenmod += 'NM'
    }
    return {shortenmod: shortenmod, bitpresent: Number(bitpresent)}
}