const database = require("./pg");

const onTimeManager = () => {
    let dates;
    database.query(`SELECT * FROM "onTime"`, (err, res) => {
        if (err) {
            console.log(err) 
        } else {
            dates = res.rows
        }
    })
}

module.exports = onTimeManager;