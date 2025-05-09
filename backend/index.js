require('dotenv').config();
const pg = require('pg');
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const port = 3000;

const pool = new pg.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: 'randomPaswoord',
    port: process.env.DB_PORT,
    connectionTimeoutMillis: 5000
});

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

async function waitForDatabase() {
    let attempts = 0;
    while (attempts < 10) {
        try {
            await pool.query('SELECT NOW()');
            return;
        } catch (err) {
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
            if (!user.password.startsWith('$2b$')) { 
                const hashedPassword = await bcrypt.hash(user.password, 10);

                await pool.query(
                    'UPDATE users SET password = $1 WHERE id = $2',
                    [hashedPassword, user.id]
                );
            }
        }
    } catch (err) {
        console.error('Fout bij het updaten van wachtwoorden:', err);
    }
}


async function createDefaultUsers() {
    const users = [
        { username: process.env.USER_NAME_ADMIN, password: process.env.USER_PWD_ADMIN },
        { username: process.env.USER_NAME_GRG, password: process.env.USER_PWD_GRG }
    ];

    for (const user of users) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        try {
            await pool.query(
                'INSERT INTO users (user_name, password) VALUES ($1, $2)',
                [user.username, hashedPassword]
            );
            console.log(`Gebruiker aangemaakt.`);
        } catch (err) {
            console.error(`Fout bij het aanmaken van gebruiker:`, err.message);
        }
    }
}

app.get('/authenticate/:username/:password', async (request, response) => {
    const username = request.params.username;
    const password = request.params.password;

    try {
        const result = await pool.query('SELECT * FROM users WHERE user_name = $1', [username]);
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

app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users (user_name, password) VALUES ($1, $2)', [username, hashedPassword]);
        res.status(201).json({ message: 'User registered' });
    } catch (err) {
        res.status(500).json({ message: 'Error registering user', error: err.message });
    }
});

async function startApp() {
    try {
        await waitForDatabase(); 
        await createDefaultUsers(); 
        await updatePasswords();  
        app.listen(port, () => {
            console.log(`App running on port ${port}.`);
        });
    } catch (err) {
        console.error('Fout bij het starten van de app:', err);
    }
}

startApp();
