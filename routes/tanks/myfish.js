const express = require("express");
const jwtCheck = require("../../middleware/jwtCheck");
const jwt_decode = require('jwt-decode');
const database = require("../../middleware/pg");
let router = express.Router();

router
    .post('/catchfish', jwtCheck, (req, res) => {
    const tank = req.body.tank
    let fishies = []

    database.query(`SELECT "tankFish"."id", "tankFish"."user", "tanks"."tankName", "tankFish"."quantity", "fishLibrary"."name", "fishLibrary"."pic1", "fishLibrary"."sizecm", "fishLibrary"."phlevellow", "fishLibrary"."phlevelhigh", "fishLibrary"."templowc", "fishLibrary"."temphighc" FROM "tankFish" INNER JOIN "fishLibrary" ON "tankFish"."fish"="fishLibrary"."id" INNER JOIN "tanks" ON "tankFish"."tank"="tanks"."id"`, (err, response) => {
        if (err) {
            console.log(err)
        } else {

            const data = response;
            console.log(data)
            data.rows.forEach((row) => {
                if (row.tankName === tank) {
                    const fish = {
                        id: row.id,
                        name: row.name,
                        pic: row.pic1,
                        quantity: row.quantity,
                        size: row.sizecm,
                        phlow: row.phlevellow,
                        phhigh: row.phlevelhigh,
                        templow: row.templowc,
                        temphigh: row.temphighc
                    }
                    fishies.push(fish)
                }
            })

            res.json(fishies);
        }
    })
})

router
    .post('/addfish', jwtCheck, (req, response) => {

    let token = req.headers.authorization
    let decoded = jwt_decode(token)
    let sub = decoded.sub

    database.query('INSERT INTO "tankFish" ("user", "tank", "fish", "quantity") VALUES ($1, $2, $3, $4);', [sub, req.body.tank, req.body.fish, req.body.quantity], (err, res) => {
        if (err) {
            console.log(err);
        } else {
            console.log('Added fish to tank!')
            response.end("Added!")
        }
    })
})

router
    .post('/editfish/:id/', jwtCheck, (req, res) => {
    database.query(`UPDATE "tankFish" SET quantity = $1 WHERE id = $2`, [req.body.fishQuantity, req.params.id], (err, response) => {
        if (err) {
            console.log(err)
        } else {
            console.log("Quantity updated!")
            res.end()
        }
    })
})

router
    .delete('/deletetankfish/:id/', jwtCheck, (req, res) => {
    const id = req.params.id;
    console.log(id)
    const queryString = 'DELETE FROM "tankFish" WHERE id =';

    database.query(queryString + id, (err, response) => {
        if (err) {
            console.log('Error:', err);
        } else {
            console.log('Deleted Fish!');
            res.end("Deleted!")
        }
    })
})

module.exports = router;