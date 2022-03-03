const express = require("express");
const jwtCheck = require("../../middleware/jwtCheck");
const jwt_decode = require('jwt-decode');
const database = require("../../middleware/pg");
const nodemailer = require("nodemailer")
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilio = require('twilio')(accountSid, authToken);
const mailAuth = process.env.NODEMAILER_PASS;
const smtpTransport = require('nodemailer-smtp-transport');
let router = express.Router();

const transporter = nodemailer.createTransport(smtpTransport({
    host: 'smtp.gmail.com',
    port: '465',
    secure: 'true',
    auth: {
        user: 'fishiepedia@gmail.com',
        pass: mailAuth
    }
}));

router
    .post('/', jwtCheck, (req, res) => {

    let contact;
    if (req.body.contacttype === "text") {
        contact = req.body.phone
    } else {
        contact = req.body.email
    }

    const week = 7;
    const days = req.body.interval * week;

    const addDays = (date, days) => {
        return new Date(date.getTime() + days*24*60*60*1000);
    }
        
    let date = new Date(req.body.date);
    date.setHours(24, 0, 0 ,0)
        
    let newDate = addDays(date, days);

    database.query(`INSERT INTO "onTime" ("date", "interval", "contact", "contacttype") VALUES ($1, $2, $3, $4)`, [newDate, req.body.interval, contact, req.body.contacttype], (err, response) => {
        if (err) {
            console.log(err)
        } else {
            console.log("New reminder!")
            res.end()
        }
    })
    
    // const mailOptions = {
    //     from: 'fishiepedia@gmail.com',
    //     to: req.body.email,
    //     subject: 'Time to change your aquarium water!',
    //     text: 'The day has come! Its been 2 weeks since you changed your aquarium water!'
    // };

    // if (req.body.type === 'text') {
    //     twilio.messages
    //     .create({
    //         body: "Todays the day! Time to change your tank water!",
    //         from: "+17094012247",
    //         to: req.body.phone
    //     })
    //     .then(() => {
    //         console.log("SMS sent!")
    //         res.end("New notification!")
    //     });
    // } else {
    //     transporter.sendMail(mailOptions, (err, info) => {
    //         if (err) {
    //             console.log(err)
    //         } else {
    //             console.log('Email sent!')
    //             res.end("New notification!")
    //         }
    //     })
    // }
})

module.exports = router;