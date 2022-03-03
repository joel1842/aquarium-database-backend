const express = require("express");
const jwtCheck = require("../../middleware/jwtCheck");
const jwt_decode = require('jwt-decode');
const database = require("../../middleware/pg");
let router = express.Router();

router
    .post('/newentry', jwtCheck, (req, res) => {
    let token = req.headers.authorization
    let decoded = jwt_decode(token)
    let sub = decoded.sub

    let date = Date.now()

    database.query('INSERT INTO "tankJournal" ("user", "date", "ammonia", "nitrites", "nitrates", "phLevel", "khLevel", "ghLevel", "tank", "temp", "tempscale") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);', [sub, date, req.body.ammonia, req.body.nitrite, req.body.nitrate, req.body.phLevel, req.body.khLevel, req.body.ghLevel, req.body.tank, req.body.temp, req.body.tempscale], (err, res) => {
        if (err) {
            console.log('Error:', err);
        } else {
            console.log('New Entry!');
            
        }
    })

    res.end("Added!")

})

router
    .post('/getjournal', jwtCheck, (req, res) => {

    let token = req.headers.authorization
    let decoded = jwt_decode(token)
    let sub = decoded.sub

    let journal = []

    database.query('SELECT "tankJournal"."id", "tankJournal"."user", "tankJournal"."date", "tankJournal"."ammonia", "tankJournal"."nitrites", "tankJournal"."nitrates", "tankJournal"."phLevel", "tankJournal"."khLevel", "tankJournal"."ghLevel", "tankJournal"."temp", "tankJournal"."tempscale", "tanks"."tankName" FROM "tankJournal" INNER JOIN "tanks" ON "tankJournal"."tank"="tanks"."id";', (err, response) => {
        if (err) {
            console.log(err)
        } else {
            const data = response;
            console.log(data)

            data.rows.forEach((row) => {
                if (row.user === sub) {
                    if (row.tankName === req.body.tank) {
                        const entry = {
                            id: row.id,
                            date: row.date,
                            ammonia: row.ammonia,
                            nitrites: row.nitrites,
                            nitrates: row.nitrates,
                            phLevel: row.phLevel,
                            khLevel: row.khLevel,
                            ghLevel: row.ghLevel,
                            temp: row.temp,
                            tempscale: row.tempscale
                        }
                        journal.push(entry)
                    }
                }
            })

            const sortedJournal = journal.sort((a, b) => b.date - a.date)
            res.json(sortedJournal);

        }
    })
})

module.exports = router;