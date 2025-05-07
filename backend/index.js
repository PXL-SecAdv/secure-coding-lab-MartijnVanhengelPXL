const pg = require('pg');

const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const port = 3000;

const pool = new pg.Pool({
    user: 'secadv',
    host: 'db',
    database: 'pxldb',
    password: 'ilovesecurity',
    port: 5432,
    connectionTimeoutMillis: 5000
});

console.log("Connecting to PostgreSQL...");

app.use(cors());
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

async function waitForDatabase() {
    let attempts = 0;
    while (attempts < 10) {
        try {
            await pool.query('SELECT NOW()');
            console.log('Database is beschikbaar.');
            return;
        } catch (err) {
            console.log('Database niet beschikbaar, poging ' + (attempts + 1));
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
    throw new Error('Database is niet beschikbaar na meerdere pogingen.');
}

async function updatePasswords() {
    try {
        const result = await pool.query('SELECT id, user_name, password FROM users');

        for (let user of result.rows) {
            const hashedPassword = await bcrypt.hash(user.password, 10);

            await pool.query(
                'UPDATE users SET password = $1 WHERE id = $2',
                [hashedPassword, user.id]
            );

            console.log(`Wachtwoord van gebruiker ${user.user_name} is gehasht en bijgewerkt.`);
        }

        console.log('Alle wachtwoorden zijn geüpdatet.');
    } catch (err) {
        console.error('Fout bij het updaten van wachtwoorden:', err);
    }
}

async function startApp() {
    await waitForDatabase();
    console.log("Database is klaar om verbinding te maken.");
    await updatePasswords(); 
    app.listen(port, () => {
        console.log(`App running on port ${port}.`);
    });
}

startApp();
