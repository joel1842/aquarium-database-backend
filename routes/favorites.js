const express = require("express");
const jwtCheck = require("../middleware/jwtCheck");
const jwt_decode = require('jwt-decode');
const database = require("../middleware/pg");
let router = express.Router();

router
    .post('/addfav/', jwtCheck, (req, answer) => {

    console.log('ACTIVE')
    let fish = req.body.fish;
    let token = req.headers.authorization
    let decoded = jwt_decode(token)
    let sub = decoded.sub

    let arrayLength;
    let verified = 0;

    database.query('SELECT * FROM "favoritesList"', (err, response) => {

        if (err) {
            console.log(err);
        } else {
            let data = response;

            arrayLength = data.rows.length

            data.rows.forEach((row) => {
                if (row.subID === sub && row.fish === fish) {
                    console.log('duplicate!')
                } else {
                    verified++
                }
            })
        }

        if (verified === arrayLength) {
            database.query('INSERT INTO "favoritesList" ("subID", "fish") VALUES ($1, $2);', [sub, fish], (err, res) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log('New Favorite!')
                    answer.end("Added!")
                }
            })
        }
    })
}) 

router
    .get('/favlist/', jwtCheck, (req, res) => {

    let token = req.headers.authorization
    let decoded = jwt_decode(token)
    let sub = decoded.sub

    let favFish = []

    database.query('SELECT "favoritesList"."id", "favoritesList"."subID", "fishLibrary"."name", "fishLibrary"."pic1" FROM "favoritesList" INNER JOIN "fishLibrary" ON "favoritesList"."fish"="fishLibrary"."id";', (err, response) => {
        if (err) {
            console.log(err)
        } else {

            const data = response;
            console.log(data)

            data.rows.forEach((row) => {
                if (row.subID === sub) {
                    const fishInfo = {
                        id: row.id,
                        pic: row.pic1,
                        name: row.name
                    }
                    favFish.push(fishInfo)
                }
            })

            res.json(favFish);
        }
    })
})

router
    .delete('/removefav/:id/', jwtCheck, (req, res) => {

    const id = req.params.id;
    const queryString = 'DELETE FROM "favoritesList" WHERE id =';

    database.query(queryString + id, (err, response) => {
        if (err) {
            console.log('Error:', err);
        } else {
            console.log('Deleted Favorite!')
            res.end('Deleted Favorite!')
        }
    })
})

module.exports = router;