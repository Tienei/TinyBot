module.exports = ({type, err_message, parameters}) => {
    try {
        let msg = ''
        if (type == 'normal') {
            let err = err_message.split('\n')
            err_message = err[0]
            let filename = err[1].split('(')[1]
            let dir_type = '/'
            if (filename.includes('\\')) {
                dir_type = '\\'
            }
            let file = filename.split(dir_type)
            file = `file: ${file[file.length-1].split(':')[0].replace(')', '')}`
            let line = filename.split(':')
            line = `(line: ${line[line.length-2].replace(')', '')}, char: ${line[line.length-1].replace(')', '')})`
            msg = `\`Error\`: ${err_message}\n${file}, ${line}`
        } else if (type == 'custom') {
            msg = err_message
            if (parameters) {
                msg = 'Missing parameter(s): '
                for (let param of parameters) {
                    msg += `\`${param}\`, `
                }
                msg = msg.substring(0, msg.length-2) + `. Please re-check the inputted message.`
            }
        }
        return msg
    } catch (err) {
        return err_message
    }
}