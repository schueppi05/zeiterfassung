import { Pool } from 'pg'

let pool: Pool | undefined

export function db(): Pool {
  pool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: true },
    max: 5,
  })
  return pool
}
