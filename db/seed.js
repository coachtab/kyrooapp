// Kyroo App — Seed Script
// Usage: node db/seed.js  (run from kyrooapp/ root)
// Requires backend/.env to be present for DB credentials

const path = require('path');
const mods = p => path.join(__dirname, '../backend/node_modules', p);

require(mods('dotenv')).config({ path: __dirname + '/../backend/.env' });
const { Pool } = require(mods('pg'));

const pool = new Pool({
  host:     process.env.DB_HOST     || '127.0.0.1',
  port:     parseInt(process.env.DB_PORT || '15434'),
  database: process.env.DB_NAME     || 'kyrooapp',
  user:     process.env.DB_USER     || 'kyroo',
  password: process.env.DB_PASSWORD || 'kyroo_pass',
});

const plans = [
  { name: 'Burn Fat & Slim Down',  description: 'Lose body fat (extra fat stored in your body) by moving more and eating smarter. A mix of cardio (heart-pumping exercise) and strength (lifting) sessions done at your own pace.',                         tag: 'YOUR PACE', category: 'FAT LOSS',       icon: 'fire', color: '#FF6B35', sort_order: 1 },
  { name: 'Build Muscle & Strength', description: 'Get bigger and stronger over 16 weeks. You will gradually lift heavier weights each week — this is called progressive overload (doing a little more each time so your muscles grow).',                  tag: 'YOUR PACE', category: 'HYPERTROPHY',    icon: 'arm',  color: '#E94560', sort_order: 2 },
  { name: '90-Day Body Challenge',  description: 'A 3-month (90-day) plan split into three phases. Each phase gets harder. You will hit milestones (mini-goals) along the way to keep you motivated.',                                                    tag: '90 DAYS',   category: 'TRANSFORMATION', icon: 'bolt', color: '#FFC107', sort_order: 3 },
  { name: 'Perfect Start for Beginners', description: 'Never worked out before? No worries. You will learn the 5 key moves that every fit person knows. After 8 weeks you will feel confident walking into any gym.',                                    tag: 'YOUR PACE', category: 'FIRST STEPS',    icon: 'leaf', color: '#4CAF50', sort_order: 4 },
  { name: 'Home Workout — No Gym Needed', description: 'Train anywhere using just your bodyweight (no equipment at all). Every week gets a little harder. Perfect for home, travel, or small spaces.',                                                   tag: 'YOUR PACE', category: 'NO GYM',         icon: 'home', color: '#7C4DFF', sort_order: 5 },
  { name: 'Swim Fit Program',       description: 'Structured pool sessions with a warm-up (easy start), drills (practice moves), main set (hard work), and cool-down (easy finish). Great for all swim levels.',                                         tag: 'YOUR PACE', category: 'POOL',           icon: 'swim', color: '#00BCD4', sort_order: 6 },
  { name: 'Hyrox Race Prep',        description: 'Hyrox is a fitness race — 8km (5 miles) of running broken up by 8 exercise stations. This plan builds your fitness and teaches you the race format step by step.',                                     tag: 'YOUR PACE', category: 'RACE READY',     icon: 'flag', color: '#FF5722', sort_order: 7 },
  { name: 'Run a Marathon',         description: 'Train for a half marathon (21km / 13 miles) or full marathon (42km / 26 miles). Includes long runs, tempo runs (comfortably hard pace), and a taper (easy week before race day).',                     tag: 'YOUR PACE', category: 'HALF OR FULL',   icon: 'run',  color: '#2196F3', sort_order: 8 },
  { name: 'CrossFit-Style Training', description: 'CrossFit (CF) mixes weightlifting, gymnastics, and fast cardio workouts called WODs (Workout of the Day). Every session is different and includes both easy (scaled) and hard (Rx — full difficulty) options.', tag: 'YOUR PACE', category: 'FUNCTIONAL', icon: 'lift', color: '#FF9800', sort_order: 9 },
  { name: 'HIIT Cardio Blast',      description: 'HIIT stands for High-Intensity Interval Training — short bursts of hard effort followed by rest. Burns lots of calories in less time. Every session uses a different fun format.',                      tag: 'YOUR PACE', category: 'HIGH INTENSITY',  icon: 'zap',  color: '#F44336', sort_order: 10 },
  { name: 'Mobility & Recovery',    description: 'Daily stretching, yoga-style flows, and recovery routines. Perfect as a standalone program or alongside any other plan. Undoes desk posture and keeps you moving well.',                                 tag: 'DAILY',     category: 'MOBILITY',        icon: 'flower', color: '#34D399', sort_order: 11 },
  { name: 'Calisthenics & Skills',  description: 'Chase specific calisthenics skills — muscle-up, handstand, front lever, one-arm pull-up. Progression-based training toward concrete skill milestones.',                                                  tag: 'SKILL',     category: 'CALISTHENICS',    icon: 'body',   color: '#EAB308', sort_order: 12 },
  { name: 'Sport Season Prep',      description: 'Sport-specific conditioning for boxing, cycling, triathlon, climbing, BJJ, and any team sport. Periodised around your season.',                                                                           tag: 'PERIODISED',category: 'SPORT PREP',      icon: 'trophy', color: '#3B82F6', sort_order: 13 },
];

const habits = [
  'Morning Workout',
  'Hit Protein Goal',
  '8hrs Sleep',
  '2L Water',
  'Stretch 10min',
];

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding plans...');
    for (const p of plans) {
      await client.query(
        `INSERT INTO plans (name, description, tag, category, icon, color, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT DO NOTHING`,
        [p.name, p.description, p.tag, p.category, p.icon, p.color, p.sort_order]
      );
    }

    console.log('Seeding habits...');
    for (const name of habits) {
      await client.query(
        `INSERT INTO habits (name) VALUES ($1) ON CONFLICT DO NOTHING`,
        [name]
      );
    }

    console.log('Seed complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => { console.error('Seed failed:', err.message); process.exit(1); });
