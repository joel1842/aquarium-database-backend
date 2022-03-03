const express = require("express");
const jwtCheck = require("../middleware/jwtCheck");
const jwt_decode = require('jwt-decode');
const database = require("../middleware/pg");
let router = express.Router();

router
    .post('/', jwtCheck, (req, res) => {
    let token = req.headers.authorization
    let decoded = jwt_decode(token)
    let sub = decoded.sub
    console.log('ERROR')

    database.query('INSERT INTO "errorForm" ("pageLink", "error", "user") VALUES ($1, $2, $3);', [req.body.link, req.body.error, sub], (err, response) => {
        if (err) {
            console.log(err)
        } else {
            console.log("New Error!")
            res.end()
        }
    })
})

module.exports = router;