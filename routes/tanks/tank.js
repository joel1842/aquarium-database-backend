const express = require("express");
const jwtCheck = require("../../middleware/jwtCheck");
const jwt_decode = require('jwt-decode');
const database = require("../../middleware/pg");
let router = express.Router();

router
    .post('/createtank', jwtCheck, (req, res) => {

    let token = req.headers.authorization
    let decoded = jwt_decode(token)
    let sub = decoded.sub

    database.query('INSERT INTO "tanks" ("user", "tankName", "tankSize", "unit", "tankType") VALUES ($1, $2, $3, $4, $5);', [sub, req.body.tankName, req.body.tankSize, req.body.unit, req.body.tankType], (err, response) => {
        if (err) {
            console.log(err);
        } else {
            console.log('Tank Created!')
            console.log(res);
            res.end()
        }
    })
})

router
    .post('/mytanks', jwtCheck, (req, res) => {

    let token = req.headers.authorization
    let decoded = jwt_decode(token)
    let sub = decoded.sub
    let tanks = []

    database.query('SELECT * FROM "tanks"', (err, response) => {
        if (err) {
            console.log(err)
        } else {

            const data = response;

            data.rows.forEach((row) => {
                if (row.user === sub) {
                    const tank = {
                        id: row.id,
                        tankName: row.tankName,
                        tankSize: row.tankSize,
                        tankType: row.tankType,
                        unit: row.unit,
                        tankimg: row.tankimg
                    }
                    tanks.push(tank)
                }
            })

            res.json(tanks);
        }
    })
})

router
    .delete('/deletetank/:id/', jwtCheck, (req, res) => {
    const id = req.params.id;
    const queryString = 'DELETE FROM "tanks" WHERE id =';

    database.query(queryString + id, (err, response) => {
        if (err) {
            console.log('Error:', err);
        } else {
            console.log('Deleted Tank!');
            res.end("Deleted Tank!")
        }
    })
})

router
    .post('/upload', jwtCheck, (req, res) => {
    let url = req.body.url
    let id = req.body.id

    database.query(`UPDATE tanks SET tankimg = '${url}' WHERE id =` + id, (err, response) => {
        if (err) {
            console.log(err)
        } else {
            console.log("Added file")
            res.end()
        }
    })

})

module.exports = router;