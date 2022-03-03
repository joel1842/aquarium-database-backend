const express = require("express");
const database = require('../middleware/pg')
let router = express.Router();

router
    .get('/', (req, res) => {

    const page = req.query.page - 1
    const limit = 21

    const offset = page * limit

    let search = undefined
    let category;

    if (req.query.search !== 'undefined') {
        search = req.query.search
        category = req.query.category

        console.log(category)
    }

    if (search !== undefined) {
        // couldn't get $1 to work in place of category, will have to find solution
        database.query(`SELECT * FROM "fishLibrary" WHERE LOWER(`+ category +`) LIKE LOWER($1) LIMIT $2 OFFSET $3;`, [`%${search}%`, limit, offset], (err, response) => {
            if (err) {
                console.log(err)
            } else {
    
                const fish = response.rows
                const fishCount = fish.length
    
                const data = {
                    fish: fish,
                    fishCount: fishCount
                }

                res.json(data)
            }
        })
    } else {

        database.query(`SELECT * FROM "fishLibrary" LIMIT $1 OFFSET $2`, [limit, offset], (err, response) => {
            if (err) {
                console.log(err)
            } else {
    
                const fish = response.rows
                const fishCount = fish.length

                const data = {
                    fish: fish,
                    fishCount: fishCount
                }

                res.json(data)
            }
        })
    }
})

module.exports = router;