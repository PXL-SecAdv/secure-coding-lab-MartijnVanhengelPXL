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

async function updatePasswords() {
    try {
        const result = await pool.query('SELECT id, user_name, password FROM users');

        for (let user of result.rows) {
            if (user.password && user.password === user.password.trim()) {
                const hashedPassword = await bcrypt.hash(user.password, 10);

                await pool.query(
                    'UPDATE users SET password = $1 WHERE id = $2',
                    [hashedPassword, user.id]
                );
            }
        }

        console.log('Alle wachtwoorden zijn geüpdatet.');
    } catch (err) {
        console.error('Fout bij het updaten van wachtwoorden:', err);
    }
}

updatePasswords().then(() => {
    app.listen(port, () => {
        console.log(`App running on port ${port}.`);
    });
}).catch(err => {
    console.error('Er is een fout opgetreden bij het updaten van wachtwoorden, de server wordt niet gestart.', err);
});
