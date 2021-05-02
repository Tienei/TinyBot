module.exports = ({send_type, cmd}) => {
    return new Promise((resolve, reject) => {
        process.on("message", (proc_msg) => {
            if (proc_msg.send_type == send_type && proc_msg.cmd == cmd) {
                resolve(proc_msg.value);
            }
        })
    })
}