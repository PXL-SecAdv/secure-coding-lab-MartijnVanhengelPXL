const pg = require('pg')
const express = require('express')
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')
const cors = require('cors')

const app = express()
const port = 3000

const pool = new pg.Pool({
    user: 'secadv',
    host: 'db',
    database: 'pxldb',
    password: 'ilovesecurity',
    port: 5432,
    connectionTimeoutMillis: 5000
})

console.log("Connecting to PostgreSQL...")

app.use(cors())
app.use(bodyParser.json())
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
)

async function waitForDatabase() {
    let attempts = 0
    while (attempts < 10) {
        try {
            await pool.query('SELECT NOW()')
            console.log('Database is beschikbaar.')
            return
        } catch (err) {
            console.log('Database niet beschikbaar, poging ' + (attempts + 1))
            attempts++
            await new Promise(resolve => setTimeout(resolve, 5000))
        }
    }
    throw new Error('Database is niet beschikbaar na meerdere pogingen.')
}

async function updatePasswords() {
    try {
        const result = await pool.query('SELECT id, user_name, password FROM users')

        for (let user of result.rows) {
            const hashedPassword = await bcrypt.hash(user.password, 10)

            await pool.query(
                'UPDATE users SET password = $1 WHERE id = $2',
                [hashedPassword, user.id]
            )

            console.log(`Wachtwoord van gebruiker ${user.user_name} is gehasht en bijgewerkt.`)
        }

        console.log('Alle wachtwoorden zijn geüpdatet.')
    } catch (err) {
        console.error('Fout bij het updaten van wachtwoorden:', err)
    }
}

app.get('/authenticate/:username/:password', async (request, response) => {
    const username = request.params.username
    const password = request.params.password

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE user_name = $1',
            [username]
        )

        if (result.rows.length === 0) {
            return response.status(401).json({ message: 'Invalid username or password' })
        }

        const user = result.rows[0]
        const match = await bcrypt.compare(password, user.password)

        if (match) {
            return response.status(200).json({ message: 'Login successful' })
        } else {
            return response.status(401).json({ message: 'Invalid username or password' })
        }
    } catch (err) {
        console.error('Error during authentication:', err)
        return response.status(500).json({ message: 'Internal server error' })
    }
})

app.post('/register', async (req, res) => {
    const { username, password } = req.body

    try {
        const hashedPassword = await bcrypt.hash(password, 10)
        await pool.query('INSERT INTO users (user_name, password) VALUES ($1, $2)', [username, hashedPassword])
        res.status(201).json({ message: 'User registered' })
    } catch (err) {
        res.status(500).json({ message: 'Error registering user', error: err.message })
    }
})

async function startApp() {
    await waitForDatabase()
    console.log("Database is klaar om verbinding te maken.")
    await updatePasswords()
    app.listen(port, () => {
        console.log(`App running on port ${port}.`)
    })
}

startApp()