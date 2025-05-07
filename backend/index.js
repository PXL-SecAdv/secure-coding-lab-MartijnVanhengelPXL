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

app.get('/authenticate/:username/:password', async (request, response) => {
    const username = request.params.username;
    const password = request.params.password;

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE user_name = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return response.status(401).json({ message: 'Invalid username or password' });
        }

        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password);

        if (match) {
            return response.status(200).json({ message: 'Login successful' });
        } else {
            return response.status(401).json({ message: 'Invalid username or password' });
        }
    } catch (err) {
        console.error('Error during authentication:', err);
        return response.status(500).json({ message: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`App running on port ${port}.`);
});
