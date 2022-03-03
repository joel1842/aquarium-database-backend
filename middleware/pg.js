const { Client } = require('pg');
const connectionString = process.env.connectionString;

const database = new Client({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
})

database.connect((err) => {
    if (err) throw err;
    console.log('Connected to database!');
})

module.exports = database;