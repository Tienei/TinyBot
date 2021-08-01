const get_icon = require("../general/icon_lib")

module.exports = ({star, a_mode}) => {
    a_mode = (a_mode == "rx") ? "std" : a_mode
    let diff = 1
    if (star >= 7 && star < 8) diff = 9
    else if (star >= 8) diff = 10
    else {
        diff += Math.ceil((star - 1.74999) / 0.75)
    }
    return get_icon({type: `diff_${a_mode}_${diff}`})
}