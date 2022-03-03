const express = require('express');
const app = express();
require('dotenv').config()
const port = process.env.PORT
const allfish = require('./routes/allfish')
const favorites = require('./routes/favorites')
const tanks = require('./routes/tanks/tank')
const myfish = require('./routes/tanks/myfish')
const journal = require('./routes/tanks/journal')
const ontime = require('./routes/tanks/ontime')
const errorform = require('./routes/errorform')

app.listen(port, () => {
    console.log(`Secure server on port ${port} 🚀`)
})

app.use(express.static(__dirname + '/public'));
app.use(express.json());
app.use((req, res, next) => {
    res.set("Access-Control-Allow-Origin", "*");
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

app.use("/allfish", allfish);

app.use("/favorites", favorites);

app.use("/tanks", tanks);

app.use("/myfish", myfish);

app.use("/journal", journal);

app.use("/ontime", ontime);

app.use("/errorform", errorform);