const { render } = require('ejs');
const express = require('express');
const app = express();
const jwt = require('express-jwt');
const jwt_decode = require('jwt-decode')
const jwks = require('jwks-rsa');
const https = require('https')
const fs = require('fs')
const { Client } = require('pg');
require('dotenv').config()
const audience = process.env.AUTH0_AUDIENCE;
const issuer = process.env.AUTH0_ISSUER
const connectionString = process.env.connectionString;
const nodemailer = require("nodemailer")
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilio = require('twilio')(accountSid, authToken);
const mailAuth = process.env.NODEMAILER_PASS;
const smtpTransport = require('nodemailer-smtp-transport')
const multer = require('multer');
const bodyParser = require('body-parser')

const urlencodedParser = bodyParser.urlencoded({extended: false})

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'img')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '--' + file.originalname)
    }
})

const upload = multer({storage: storage})

const sslServer = https.createServer({
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
}, app)

sslServer.listen(8000, () => {console.log("Secure server on port 8000 🚀")})

const transporter = nodemailer.createTransport(smtpTransport({
    host: 'smtp.gmail.com',
    port: '465',
    secure: 'true',
    auth: {
        user: 'fishiepedia@gmail.com',
        pass: mailAuth
    }
}));

const jwtCheck = jwt({
    secret: jwks.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: 'https://dev-3443m6xg.us.auth0.com/.well-known/jwks.json'
  }),
  audience: audience,
  issuer: issuer,
  algorithms: ['RS256']
});

const client = new Client({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
})

client.connect((err) => {
    if (err) throw err;
    console.log('Connected!');
})

app.use(express.static(__dirname + '/public'));
app.use(express.json());
app.use('/css', express.static(__dirname + '/css'));
app.use('/img', express.static(__dirname + '/img'));
app.use((req, res, next) => {
    res.set("Access-Control-Allow-Origin", "http://localhost:3000");
    res.set("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin, Accept, X-Requested-With, X-Custom-Header, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Authorization");
    res.set("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS")
    res.set("Access-Control-Allow-Credentials", "true")

    next();
})

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('home.ejs')
})

app.get('/allfish', (req, res) => {

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
        client.query(`SELECT * FROM "fishLibrary" WHERE LOWER(`+ category +`) LIKE LOWER($1) LIMIT $2 OFFSET $3;`, [`%${search}%`, limit, offset], (err, response) => {
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

        client.query(`SELECT * FROM "fishLibrary" LIMIT $1 OFFSET $2`, [limit, offset], (err, response) => {
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

app.post('/favorites', jwtCheck, (req, answer) => {

    let fish = req.body.fish;
    let token = req.headers.authorization
    let decoded = jwt_decode(token)
    let sub = decoded.sub

    let arrayLength;
    let verified = 0;

    client.query('SELECT * FROM "favoritesList"', (err, response) => {

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
            client.query('INSERT INTO "favoritesList" ("subID", "fish") VALUES ($1, $2);', [sub, fish], (err, res) => {
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

app.get('/favlist', jwtCheck, (req, res) => {

    let token = req.headers.authorization
    let decoded = jwt_decode(token)
    let sub = decoded.sub

    let favFish = []

    client.query('SELECT "favoritesList"."id", "favoritesList"."subID", "fishLibrary"."name", "fishLibrary"."pic1" FROM "favoritesList" INNER JOIN "fishLibrary" ON "favoritesList"."fish"="fishLibrary"."id";', (err, response) => {
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

app.delete('/removefav/:id/', jwtCheck, (req, res) => {

    const id = req.params.id;
    const queryString = 'DELETE FROM "favoritesList" WHERE id =';

    client.query(queryString + id, (err, response) => {
        if (err) {
            console.log('Error:', err);
        } else {
            console.log('Deleted Favorite!')
            res.end('Deleted Favorite!')
        }
    })
})

app.post('/createtank', jwtCheck, (req, res) => {

    let token = req.headers.authorization
    let decoded = jwt_decode(token)
    let sub = decoded.sub

    client.query('INSERT INTO "tanks" ("user", "tankName", "tankSize", "unit", "tankType") VALUES ($1, $2, $3, $4, $5);', [sub, req.body.tankName, req.body.tankSize, req.body.unit, req.body.tankType], (err, res) => {
        if (err) {
            console.log(err);
        } else {
            console.log('Tank Created!')
            console.log(res);
        }
    })
})

app.post('/mytanks', jwtCheck, (req, res) => {

    let token = req.headers.authorization
    let decoded = jwt_decode(token)
    let sub = decoded.sub
    let tanks = []

    client.query('SELECT * FROM "tanks"', (err, response) => {
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

app.post('/myfish', jwtCheck, (req, res) => {
    const tank = req.body.tank
    let fishies = []

    client.query(`SELECT "tankFish"."id", "tankFish"."user", "tanks"."tankName", "tankFish"."quantity", "fishLibrary"."name", "fishLibrary"."pic1" FROM "tankFish" INNER JOIN "fishLibrary" ON "tankFish"."fish"="fishLibrary"."id" INNER JOIN "tanks" ON "tankFish"."tank"="tanks"."id"`, (err, response) => {
        if (err) {
            console.log(err)
        } else {

            const data = response;
            data.rows.forEach((row) => {
                if (row.tankName === tank) {
                    const fish = {
                        id: row.id,
                        name: row.name,
                        pic: row.pic1,
                        quantity: row.quantity
                    }
                    fishies.push(fish)
                }
            })

            res.json(fishies);
        }
    })
})

app.post('/addfish', jwtCheck, (req, response) => {

    let token = req.headers.authorization
    let decoded = jwt_decode(token)
    let sub = decoded.sub

    client.query('INSERT INTO "tankFish" ("user", "tank", "fish", "quantity") VALUES ($1, $2, $3, $4);', [sub, req.body.tank, req.body.fish, req.body.quantity], (err, res) => {
        if (err) {
            console.log(err);
        } else {
            console.log('Added fish to tank!')
            response.end("Added!")
        }
    })
})

app.post('/editfish/:id/', jwtCheck, (req, res) => {
    client.query(`UPDATE "tankFish" SET quantity = $1 WHERE id = $2`, [req.body.fishQuantity, req.params.id], (err, response) => {
        if (err) {
            console.log(err)
        } else {
            console.log("Quantity updated!")
            res.end()
        }
    })
})

app.delete('/deletetank/:id/', jwtCheck, (req, res) => {
    const id = req.params.id;
    const queryString = 'DELETE FROM "tanks" WHERE id =';

    client.query(queryString + id, (err, response) => {
        if (err) {
            console.log('Error:', err);
        } else {
            console.log('Deleted Tank!');
            res.end("Deleted Tank!")
        }
    })
})

app.delete('/deletetankfish/:id/', jwtCheck, (req, res) => {
    const id = req.params.id;
    console.log(id)
    const queryString = 'DELETE FROM "tankFish" WHERE id =';

    client.query(queryString + id, (err, response) => {
        if (err) {
            console.log('Error:', err);
        } else {
            console.log('Deleted Fish!');
            res.end("Deleted!")
        }
    })
})

app.post('/newentry', jwtCheck, (req, res) => {
    let token = req.headers.authorization
    let decoded = jwt_decode(token)
    let sub = decoded.sub

    let date = Date.now()

    client.query('INSERT INTO "tankJournal" ("user", "date", "ammonia", "nitrites", "nitrates", "phLevel", "khLevel", "ghLevel", "tank", "temp", "tempscale") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);', [sub, date, req.body.ammonia, req.body.nitrite, req.body.nitrate, req.body.phLevel, req.body.khLevel, req.body.ghLevel, req.body.tank, req.body.temp, req.body.tempscale], (err, res) => {
        if (err) {
            console.log('Error:', err);
        } else {
            console.log('New Entry!');
            
        }
    })

    res.end("Added!")

})

app.post('/getjournal', jwtCheck, (req, res) => {

    let token = req.headers.authorization
    let decoded = jwt_decode(token)
    let sub = decoded.sub

    let journal = []

    client.query('SELECT "tankJournal"."id", "tankJournal"."user", "tankJournal"."date", "tankJournal"."ammonia", "tankJournal"."nitrites", "tankJournal"."nitrates", "tankJournal"."phLevel", "tankJournal"."khLevel", "tankJournal"."ghLevel", "tankJournal"."temp", "tankJournal"."tempscale", "tanks"."tankName" FROM "tankJournal" INNER JOIN "tanks" ON "tankJournal"."tank"="tanks"."id";', (err, response) => {
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

app.post('/errorform', jwtCheck, (req, res) => {
    let token = req.headers.authorization
    let decoded = jwt_decode(token)
    let sub = decoded.sub

    client.query('INSERT INTO "errorForm" ("pageLink", "error", "user") VALUES ($1, $2, $3);', [req.body.link, req.body.error, sub], (err, response) => {
        if (err) {
            console.log(err)
        } else {
            console.log("New Error!")
        }
    })
})

app.post('/ontime', jwtCheck, (req, res) => {
    
    const mailOptions = {
        from: 'fishiepedia@gmail.com',
        to: req.body.email,
        subject: 'Time to change your aquarium water!',
        text: 'The day has come! Its been 2 weeks since you changed your aquarium water!'
    };


    if (req.body.type === 'text') {
        twilio.messages
        .create({
            body: "Todays the day! Time to change your tank water!",
            from: "+17094012247",
            to: req.body.phone
        })
        .then(() => {
            console.log("SMS sent!")
            res.end("New notification!")
        });
    } else {
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.log(err)
            } else {
                console.log('Email sent!')
                res.end("New notification!")
            }
        })
    }
})

app.post('/upload', jwtCheck, urlencodedParser, upload.single('image'), (req, res) => {
    let file = req.file.filename
    let id = req.body.tankid

    console.log(file)
    console.log(req.body.tankid)

    client.query(`UPDATE tanks SET tankimg = '${file}' WHERE id =` + id, (err, response) => {
        if (err) {
            console.log(err)
        } else {
            console.log("Added file")
            res.end()
        }
    })

})