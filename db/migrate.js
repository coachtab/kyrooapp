// Kyroo App — Run migration + seed
// Usage: node db/migrate.js  (from kyrooapp/ root)

const path = require('path');
const mods = p => path.join(__dirname, '../backend/node_modules', p);

require(mods('dotenv')).config({ path: __dirname + '/../backend/.env' });
const { Pool } = require(mods('pg'));
const fs       = require('fs');

const pool = new Pool({
  host:     process.env.DB_HOST     || '127.0.0.1',
  port:     parseInt(process.env.DB_PORT || '15434'),
  database: process.env.DB_NAME     || 'kyrooapp',
  user:     process.env.DB_USER     || 'kyroo',
  password: process.env.DB_PASSWORD || 'kyroo_pass',
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running migration...');
    const sql = fs.readFileSync(path.join(__dirname, 'migrate.sql'), 'utf8');
    await client.query(sql);
    console.log('Migration complete.');

    // Update plans with proper metadata (names must match seed.js exactly)
    const planMeta = [
      { name: 'Burn Fat & Slim Down',          difficulty: 'beginner',     duration_weeks: 10, frequency_per_week: 4, total_weeks: 10 },
      { name: 'Build Muscle & Strength',       difficulty: 'intermediate', duration_weeks: 16, frequency_per_week: 5, total_weeks: 16 },
      { name: '90-Day Body Challenge',         difficulty: 'intermediate', duration_weeks: 13, frequency_per_week: 4, total_weeks: 13 },
      { name: 'Perfect Start for Beginners',   difficulty: 'beginner',     duration_weeks:  8, frequency_per_week: 3, total_weeks:  8 },
      { name: 'Home Workout — No Gym Needed',  difficulty: 'beginner',     duration_weeks:  6, frequency_per_week: 4, total_weeks:  6 },
      { name: 'Swim Fit Program',              difficulty: 'beginner',     duration_weeks: 12, frequency_per_week: 3, total_weeks: 12 },
      { name: 'Hyrox Race Prep',               difficulty: 'advanced',     duration_weeks: 12, frequency_per_week: 5, total_weeks: 12 },
      { name: 'Run a Marathon',                difficulty: 'intermediate', duration_weeks: 20, frequency_per_week: 4, total_weeks: 20 },
      { name: 'CrossFit-Style Training',       difficulty: 'advanced',     duration_weeks: 12, frequency_per_week: 5, total_weeks: 12 },
      { name: 'HIIT Cardio Blast',             difficulty: 'beginner',     duration_weeks:  6, frequency_per_week: 4, total_weeks:  6 },
      { name: 'Mobility & Recovery',           difficulty: 'beginner',     duration_weeks:  8, frequency_per_week: 5, total_weeks:  8 },
      { name: 'Calisthenics & Skills',         difficulty: 'intermediate', duration_weeks: 12, frequency_per_week: 4, total_weeks: 12 },
      { name: 'Sport Season Prep',             difficulty: 'intermediate', duration_weeks: 10, frequency_per_week: 4, total_weeks: 10 },
    ];

    console.log('Updating plan metadata...');
    for (const p of planMeta) {
      await client.query(
        `UPDATE plans SET difficulty=$1, duration_weeks=$2, frequency_per_week=$3, total_weeks=$4 WHERE name=$5`,
        [p.difficulty, p.duration_weeks, p.frequency_per_week, p.total_weeks, p.name]
      );
    }
    console.log('Plan metadata updated.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => { console.error('Migration failed:', err.message); process.exit(1); });
