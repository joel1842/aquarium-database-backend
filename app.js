const { render } = require('ejs');
const express = require('express');
const cors = require('cors');
const app = express();
const { auth } = require('express-oauth2-jwt-bearer');
const { Client } = require('pg');
const e = require('express');
require('dotenv').config()
const audience = process.env.AUTH0_AUDIENCE;
const connectionString = process.env.connectionString;

app.listen(process.env.PORT || 3001);

const checkJwt = auth({
    audience: audience,
    issuerBaseURL: `https://dev-3443m6xg.us.auth0.com/`,
});

// app.use(jwtCheck);

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
  res.set("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin, Accept, X-Requested-With, X-Custom-Header, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
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
    client.query('SELECT "pic1", "pic2", "pic3", "fishID", "scientificName", "name", "origin", "careLevel", "temperament", "sizeCM", "sizeIN", "lifespan", "tankSizeL", "tankSizeG", "phLevelLow", "phLevelHigh", "dhLevelLow", "dhLevelHigh", "tempLowC", "tempHighC", "tempLowF", "tempHighF", "dietType" FROM goldfish UNION SELECT "pic1", "pic2", "pic3", "fishID", "scientificName", "name", "origin", "careLevel", "temperament", "sizeCM", "sizeIN", "lifespan", "tankSizeL", "tankSizeG", "phLevelLow", "phLevelHigh", "dhLevelLow", "dhLevelHigh", "tempLowC", "tempHighC", "tempLowF", "tempHighF", "dietType" FROM catfish UNION SELECT "pic1", "pic2", "pic3", "fishID", "scientificName", "name", "origin", "careLevel", "temperament", "sizeCM", "sizeIN", "lifespan", "tankSizeL", "tankSizeG", "phLevelLow", "phLevelHigh", "dhLevelLow", "dhLevelHigh", "tempLowC", "tempHighC", "tempLowF", "tempHighF", "dietType" FROM gourami UNION SELECT "pic1", "pic2", "pic3", "fishID", "scientificName", "name", "origin", "careLevel", "temperament", "sizeCM", "sizeIN", "lifespan", "tankSizeL", "tankSizeG", "phLevelLow", "phLevelHigh", "dhLevelLow", "dhLevelHigh", "tempLowC", "tempHighC", "tempLowF", "tempHighF", "dietType" FROM pufferfish UNION SELECT "pic1", "pic2", "pic3", "fishID", "scientificName", "name", "origin", "careLevel", "temperament", "sizeCM", "sizeIN", "lifespan", "tankSizeL", "tankSizeG", "phLevelLow", "phLevelHigh", "dhLevelLow", "dhLevelHigh", "tempLowC", "tempHighC", "tempLowF", "tempHighF", "dietType" FROM cyprinids UNION SELECT "pic1", "pic2", "pic3", "fishID", "scientificName", "name", "origin", "careLevel", "temperament", "sizeCM", "sizeIN", "lifespan", "tankSizeL", "tankSizeG", "phLevelLow", "phLevelHigh", "dhLevelLow", "dhLevelHigh", "tempLowC", "tempHighC", "tempLowF", "tempHighF", "dietType" FROM loaches UNION SELECT "pic1", "pic2", "pic3", "fishID", "scientificName", "name", "origin", "careLevel", "temperament", "sizeCM", "sizeIN", "lifespan", "tankSizeL", "tankSizeG", "phLevelLow", "phLevelHigh", "dhLevelLow", "dhLevelHigh", "tempLowC", "tempHighC", "tempLowF", "tempHighF", "dietType" FROM characidae', (err, response) => {
        if (err) {
            console.log(err)
        } else {
            res.json(response.rows)
        }
    })
})

app.post('/favorites', checkJwt, (req, res) => {

    let user = req.body.user;
    let fishName = req.body.name;
    let arrayLength;
    let verified = 0;

    client.query('SELECT * FROM "favoritesList"', (err, response) => {

        if (err) {
            console.log(err);
        } else {
            let data = response;

            arrayLength = data.rows.length

            data.rows.forEach((row) => {
                if (row.userID === user && row.fishName === fishName) {
                    console.log('duplicate!')
                } else {
                    verified++
                }
            })
        }

        if (verified === arrayLength) {
            client.query('INSERT INTO "favoritesList" ("userID", "pic1", "fishName") VALUES ($1, $2, $3);', [req.body.user, req.body.pic, req.body.name], (err, res) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log('New Favorite!')
                    console.log(res);
                }
            })
        }
    })
}) 

app.post('/favlist', (req, res) => {

    const user = req.body.user
    let favFish = []

    client.query('SELECT * FROM "favoritesList"', (err, response) => {
        if (err) {
            console.log(err)
        } else {

            const data = response;

            data.rows.forEach((row) => {
                if (row.userID === user) {
                    const fishInfo = {
                        id: row.id,
                        pic: row.pic1,
                        fishName: row.fishName
                    }
                    favFish.push(fishInfo)
                }
            })

            res.json(favFish);
        }
    })
})

app.delete('/removefav/:id/', (req, res) => {

    const id = req.params.id;
    const queryString = 'DELETE FROM "favoritesList" WHERE id =';

    client.query(queryString + id, (err, response) => {
        if (err) {
            console.log('Error:', err);
        } else {
            console.log('Deleted Favorite!')
        }
    })
})

app.post('/createtank', (req, res) => {
    client.query('INSERT INTO "tanks" ("user", "tankName", "tankSize", "unit") VALUES ($1, $2, $3, $4);', [req.body.user, req.body.tankName, req.body.tankSize, req.body.unit], (err, res) => {
        if (err) {
            console.log(err);
        } else {
            console.log('Tank Created!')
            console.log(res);
        }
    })
})

app.post('/mytanks', (req, res) => {

    const user = req.body.user
    let tanks = []

    client.query('SELECT * FROM "tanks"', (err, response) => {
        if (err) {
            console.log(err)
        } else {

            const data = response;

            data.rows.forEach((row) => {
                if (row.user === user) {
                    const tank = {
                        id: row.id,
                        tankName: row.tankName,
                        tankSize: row.tankSize,
                        unit: row.unit
                    }
                    tanks.push(tank)
                }
            })

            res.json(tanks);
        }
    })
})

app.post('/myfish', (req, res) => {
    const tank = req.body.tank
    let fishies = []

    client.query('SELECT * FROM "tankFish"', (err, response) => {
        if (err) {
            console.log(err)
        } else {

            const data = response;

            data.rows.forEach((row) => {
                if (row.tankName === tank) {
                    const fish = {
                        id: row.id,
                        pic: row.fishPic,
                        name: row.fishName
                    }
                    fishies.push(fish)
                }
            })

            res.json(fishies);
        }
    })
})

app.post('/addfish', (req, res) => {
    client.query('INSERT INTO "tankFish" ("user", "tankName", "fishPic", "fishName") VALUES ($1, $2, $3, $4);', [req.body.user, req.body.tank, req.body.pic, req.body.name], (err, res) => {
        if (err) {
            console.log(err);
        } else {
            console.log('Added fish to tank!')
            console.log(res);
        }
    })
})

app.delete('/deletetank/:id/', (req, res) => {
    const id = req.params.id;
    const queryString = 'DELETE FROM "tanks" WHERE id =';

    client.query(queryString + id, (err, response) => {
        if (err) {
            console.log('Error:', err);
        } else {
            console.log('Deleted Tank!');
        }
    })
})