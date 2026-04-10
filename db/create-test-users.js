// Kyroo App — Create test users
// Usage: node db/create-test-users.js  (from kyrooapp/ root)

const path  = require('path');
const mods  = p => path.join(__dirname, '../backend/node_modules', p);

require(mods('dotenv')).config({ path: __dirname + '/../backend/.env' });
const { Pool } = require(mods('pg'));
const bcrypt   = require(mods('bcryptjs'));

const pool = new Pool({
  host:     process.env.DB_HOST     || '127.0.0.1',
  port:     parseInt(process.env.DB_PORT || '15434'),
  database: process.env.DB_NAME     || 'kyrooapp',
  user:     process.env.DB_USER     || 'kyroo',
  password: process.env.DB_PASSWORD || 'kyroo_pass',
});

const TEST_USERS = [
  { email: 'test@kyroo.de',  password: 'password123', name: 'Test User',   is_premium: false },
  { email: 'pro@kyroo.de',   password: 'password123', name: 'Pro Athlete', is_premium: true  },
  { email: 'demo@kyroo.de',  password: 'demo1234',    name: 'Demo User',   is_premium: false },
];

async function createUsers() {
  const client = await pool.connect();
  try {
    console.log('Creating test users...\n');
    for (const u of TEST_USERS) {
      const hash = await bcrypt.hash(u.password, 10);
      const res  = await client.query(
        `INSERT INTO users (email, password_hash, name, is_premium)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE
           SET password_hash = EXCLUDED.password_hash,
               name          = EXCLUDED.name,
               is_premium    = EXCLUDED.is_premium
         RETURNING id, email, name, is_premium`,
        [u.email, hash, u.name, u.is_premium]
      );
      const row = res.rows[0];
      console.log(`  [${row.is_premium ? 'PRO' : 'FREE'}] ${row.email}  (id=${row.id})`);
      console.log(`         password: ${u.password}`);
    }
    console.log('\nDone.');
  } finally {
    client.release();
    await pool.end();
  }
}

createUsers().catch(err => { console.error('Failed:', err.message); process.exit(1); });
