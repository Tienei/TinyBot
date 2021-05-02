module.exports = ({check_msg, two_arg = false, suffix}) => {
    let check = ''
    let option = check_msg.split(" ")
    let quote = false
    // Split name and arg
    if (check_msg.includes('"')) {
        quote = true
        check = check_msg.split('"')[1]
    }
    // Add position to suffix
    suffix.forEach(s => {
      s.pos = option.indexOf(s.suffix)
      s.value = []
    })
    suffix = suffix.filter(s => s.pos > -1)
    //Check if there is more than 1 argument
    if (!two_arg && suffix.length > 1) throw 'Only one argument please!';
    //Get name if there's no quote
    if (!quote) {
        suffix.sort(function(a,b){return a.pos-b.pos})
        if (suffix.length == 0) {
            check = option.slice(1).join(" ")
        } else if (suffix[0].pos > 1) {
            check = option.slice(1, suffix[0].pos).join(" ")
        } else {
            check = option.slice(option.indexOf(suffix[suffix.length-1].suffix) + suffix[suffix.length-1].v_count + 1).join(" ")
        }
    }
    // Get value from suffix if v_count > 0
    suffix.forEach(s => {
        for (var i = 1; i <= s.v_count; i++) {
            s.value.push(option[option.indexOf(s.suffix)+i])
        }
    })
    //
    let found_suffix = {}
    for (let i in suffix) {
         found_suffix[suffix[i].suffix] = suffix[i].value
    }
    // Making sure if check is undefined then return blank
    if (check == undefined) {
        check = ''
    }
    return {check, ...found_suffix}
}