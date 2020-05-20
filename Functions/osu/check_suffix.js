module.exports = function (check_msg, two_arg = false, suffix) {
    let check = ''
    let option = ''
    let quote = false
    // Split name and arg
    if (check_msg.includes('"')) {
        quote = true
        option = check_msg.split('"')
        check = option[1]
        option = check_msg.split(" ")
    } else {
        option = check_msg.split(" ")
    }
    // Add position to suffix
    for (var i in suffix) {
        suffix[i].position = -1
        suffix[i].value = []
    }
    // Find name and arg
    for (var i in suffix) {
        suffix[i].position = option.indexOf(suffix[i].suffix)
    }
    //Check if there is more than 1 argument
    if (two_arg == false) {
        let count = suffix.filter(s => s.position > -1);
        if (count.length > 1) {
            throw 'Only one argument please!'
        }
    }
    //Get name if there's no quote
    if (quote == false) {
        let pass = suffix
        pass = pass.filter(p => p.position > -1)
        pass.sort(function(a,b){return a.position-b.position})
        if (pass.length == 0) {
            check = option.slice(1).join(" ")
            console.log(check)
        } else if (pass[0].position > 1) {
            check = option.slice(1, pass[0].position).join(" ")
            console.log(check)
        } else {
            pass.sort(function(a,b){return b.position-a.position})
            check = option.slice(option.indexOf(pass[0].suffix) + pass[0].v_count + 1).join(" ")
            console.log(check)
        }
    }
    // Get value from suffix if v_count > 0
    for (var i in suffix) {
        if (suffix[i].v_count > 0) {
            for (var v = 1; v <= suffix[i].v_count; v++) {
                suffix[i].value.push(option[option.indexOf(suffix[i].suffix)+v])
            }
        }
    }
    // Making sure if check is undefined then return blank
    if (check == undefined) {
        check = ''
    }
    return {check, suffix}
}