import express from 'express'
import pg from 'pg'
import path from 'path'
import { fileURLToPath } from 'url'

const { Pool } = pg

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const port = process.env.PORT || 4000

const pool = new Pool({
    connectionString:
        process.env.DATABASE_URL ||
        'postgres://postgres:postgres@localhost:5432/couplefinder',
})

app.use(express.static(path.join(__dirname, 'public')))

app.get('/api/users', async (req, res) => {
    try {
        const { search = '', gender = '' } = req.query

        const query = `
            SELECT
                u.id,
                u.name,
                u.gender,
                u.age,
                u.city,
                u.relationship_goal,
                u.lifestyle,
                u.bio,
                p.preferred_gender,
                p.age_from,
                p.age_to,
                p.preferred_city,
                p.preferred_goal,
                p.preferred_lifestyle
            FROM users u
                     JOIN user_preferences p ON p.user_id = u.id
            WHERE
                ($1 = '' OR LOWER(u.name) LIKE LOWER($1) OR LOWER(u.city) LIKE LOWER($1))
              AND ($2 = '' OR u.gender = $2)
            ORDER BY u.id DESC
        `

        const searchValue = search ? `%${search}%` : ''
        const result = await pool.query(query, [searchValue, gender])

        const users = []
        for (const row of result.rows) {
            const interestsResult = await pool.query(
                `SELECT interest FROM user_interests WHERE user_id = $1 ORDER BY interest`,
                [row.id],
            )

            const badHabitsResult = await pool.query(
                `SELECT bad_habit FROM user_bad_habits WHERE user_id = $1 ORDER BY bad_habit`,
                [row.id],
            )

            const preferredBadHabitsResult = await pool.query(
                `SELECT bad_habit FROM user_preferred_bad_habits WHERE user_id = $1 ORDER BY bad_habit`,
                [row.id],
            )

            users.push({
                ...row,
                interests: interestsResult.rows.map((r) => r.interest),
                bad_habits: badHabitsResult.rows.map((r) => r.bad_habit),
                preferred_bad_habits: preferredBadHabitsResult.rows.map((r) => r.bad_habit),
            })
        }

        res.json(users)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'failed to load users' })
    }
})

app.listen(port, () => {
    console.log(`DB Viewer started on http://localhost:${port}`)
})