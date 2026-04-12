require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const crypto     = require('crypto');
const nodemailer  = require('nodemailer');
const compression = require('compression');
const Anthropic   = require('@anthropic-ai/sdk');

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;
const { Pool }   = require('pg');

const app  = express();
const PORT = process.env.PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

const pool = new Pool({
  host:               process.env.DB_HOST     || '127.0.0.1',
  port:               parseInt(process.env.DB_PORT || '15434'),
  database:           process.env.DB_NAME     || 'kyrooapp',
  user:               process.env.DB_USER     || 'kyroo',
  password:           process.env.DB_PASSWORD || 'kyroo_pass',
  max:                20,
  min:                5,
  idleTimeoutMillis:  30000,
});

// ── Simple in-memory cache ──────────────────────────────────────────────────
const _cache = new Map();
function cached(key, ttlMs, fn) {
  const entry = _cache.get(key);
  if (entry && Date.now() - entry.ts < ttlMs) return Promise.resolve(entry.data);
  return fn().then(data => { _cache.set(key, { data, ts: Date.now() }); return data; });
}

// ── SMTP transporter ────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const BASE_URL = process.env.BASE_URL || 'https://kyroo.de';

async function sendVerificationEmail(email, token) {
  const link = `${BASE_URL}/api/auth/verify-email?token=${token}`;
  await transporter.sendMail({
    from: process.env.SMTP_FROM || `Kyroo <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Activate your Kyroo account',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0A0A0A;color:#F5F5F5;border-radius:16px;">
        <h1 style="font-size:24px;font-weight:800;margin:0 0 8px;">Welcome to <span style="color:#E94560;">Kyroo</span>!</h1>
        <p style="color:#999;font-size:14px;margin:0 0 24px;">Your AI-powered training journey starts here.</p>
        <p style="font-size:15px;line-height:1.6;margin:0 0 24px;">
          Click the button below to activate your account and start training.
        </p>
        <a href="${link}" style="display:inline-block;background:#E94560;color:#fff;font-weight:700;font-size:16px;padding:14px 32px;border-radius:12px;text-decoration:none;">
          Activate Account
        </a>
        <p style="color:#666;font-size:12px;margin:24px 0 0;">
          If the button doesn't work, copy this link:<br/>
          <a href="${link}" style="color:#E94560;word-break:break-all;">${link}</a>
        </p>
      </div>
    `,
  });
}

app.use(compression());
app.use(cors());
app.use(express.json());

// ── Auth middleware ──────────────────────────────────────────────────────────
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token expired or invalid' });
  }
}

function issueToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
}

// ── Program templates ────────────────────────────────────────────────────────
// Exercise name guide (acronyms spelled out for all users):
// OHP  = Overhead Press (push weight above your head)
// RDL  = Romanian Deadlift (hinge forward, feel hamstrings stretch)
// DB   = Dumbbell
// KB   = Kettlebell (ball-shaped weight with a handle)
// LISS = Low-Intensity Steady State (easy, steady cardio like a brisk walk)
// HIIT = High-Intensity Interval Training (short hard bursts with rest)
// CF   = CrossFit
// WOD  = Workout of the Day

const TEMPLATES = {
  HYPERTROPHY: {
    '4-5 days': [
      { day: 'Monday',    focus: 'Push — Chest, Shoulders & Triceps',  exercises: ['Bench Press 4x8', 'Overhead Press (OHP) 3x10', 'Incline Dumbbell Press 3x12', 'Lateral Raises 3x15', 'Tricep Pushdown 3x12'] },
      { day: 'Tuesday',   focus: 'Legs — Quads, Hamstrings & Calves',  exercises: ['Squats 4x8', 'Romanian Deadlift (RDL) 3x10', 'Leg Press 3x12', 'Leg Curl 3x12', 'Calf Raises 4x15'] },
      { day: 'Wednesday', focus: 'Rest & Recovery',                     exercises: ['Light stretching', '20 min easy walk', 'Foam rolling (roll muscles to reduce soreness)'] },
      { day: 'Thursday',  focus: 'Pull — Back & Biceps',               exercises: ['Deadlift 4x6', 'Pull-ups 4xMax', 'Cable Rows 3x10', 'Face Pulls 3x15', 'Bicep Curls 3x12'] },
      { day: 'Friday',    focus: 'Cardio & Core',                      exercises: ['Kettlebell Swings (KB Swings) 4x20', 'Box Jumps 3x12', 'Burpees 3x10', 'Battle Ropes 3x30s', 'Plank 3x45s'] },
      { day: 'Saturday',  focus: 'Rest',                               exercises: ['Rest day', 'Optional: 30 min walk'] },
      { day: 'Sunday',    focus: 'Rest',                               exercises: ['Rest day', 'Tip: prep your meals for the week'] },
    ],
    '2-3 days': [
      { day: 'Monday',    focus: 'Full Body A',  exercises: ['Squats 3x8', 'Bench Press 3x8', 'Cable Rows 3x10', 'Overhead Press (OHP) 3x10', 'Deadlift 3x6'] },
      { day: 'Tuesday',   focus: 'Rest',         exercises: ['Rest day', 'Optional light cardio'] },
      { day: 'Wednesday', focus: 'Full Body B',  exercises: ['Front Squats 3x8', 'Pull-ups 3x8', 'Incline Dumbbell Press 3x10', 'Lunges 3x12', 'Core Work 3x'] },
      { day: 'Thursday',  focus: 'Rest',         exercises: ['Rest day'] },
      { day: 'Friday',    focus: 'Full Body C',  exercises: ['Deadlift 3x6', 'Dips 3x10', 'Rows 3x10', 'Romanian Deadlift (RDL) 3x10', 'Ab Circuit'] },
      { day: 'Saturday',  focus: 'Rest',         exercises: ['Active recovery — light movement, stretching'] },
      { day: 'Sunday',    focus: 'Rest',         exercises: ['Rest day'] },
    ],
    '6+ days': [
      { day: 'Monday',    focus: 'Chest & Triceps',   exercises: ['Bench Press 5x8', 'Incline Dumbbell Press 4x10', 'Cable Fly 3x15', 'Skull Crushers 3x12', 'Tricep Dips 3xMax'] },
      { day: 'Tuesday',   focus: 'Back & Biceps',     exercises: ['Deadlift 5x5', 'Pull-ups 4x8', 'Cable Rows 4x10', 'Hammer Curls 3x12', 'Face Pulls 3x15'] },
      { day: 'Wednesday', focus: 'Legs',              exercises: ['Squats 5x8', 'Leg Press 4x12', 'Romanian Deadlift (RDL) 3x10', 'Leg Curl 3x12', 'Calf Raises 5x15'] },
      { day: 'Thursday',  focus: 'Shoulders & Traps', exercises: ['Overhead Press (OHP) 5x8', 'Lateral Raises 4x15', 'Front Raises 3x12', 'Shrugs 4x15', 'Rear Delt Fly 3x15'] },
      { day: 'Friday',    focus: 'Arms & Core',       exercises: ['Barbell Curls 4x10', 'Tricep Pushdown 4x10', 'Hammer Curls 3x12', 'Plank 3x60s', 'Hanging Leg Raises 3x15'] },
      { day: 'Saturday',  focus: 'Cardio & Fitness',  exercises: ['Kettlebell Swings (KB Swings) 4x20', 'Box Jumps 3x12', 'Battle Ropes 3x30s', 'Sled Push 3x20m', 'HIIT (fast bursts) 15min'] },
      { day: 'Sunday',    focus: 'Rest & Recovery',   exercises: ['Full rest', 'Foam rolling', 'Stretching'] },
    ],
  },
  'FAT LOSS': {
    '4-5 days': [
      { day: 'Monday',    focus: 'Full Body + Cardio',        exercises: ['Squats 3x12', 'Push-ups 3x15', 'Cable Rows 3x12', 'Lunges 3x12', '20min easy steady cardio (LISS — Low-Intensity Steady State)'] },
      { day: 'Tuesday',   focus: 'HIIT — Short Hard Bursts',  exercises: ['Warm up 5min', 'Burpees 4x10', 'Mountain Climbers 4x30s', 'Jump Squats 4x12', 'Cool down 5min'] },
      { day: 'Wednesday', focus: 'Rest',                      exercises: ['Rest day', '30min easy walk'] },
      { day: 'Thursday',  focus: 'Strength + Cardio',         exercises: ['Deadlift 3x8', 'Overhead Press (OHP) 3x10', 'Pull-ups 3xMax', 'Dips 3x12', '15min cardio'] },
      { day: 'Friday',    focus: 'Circuit Training',          exercises: ['Kettlebell Swings (KB Swings) 5x20', 'Box Jumps 5x10', 'Plank 5x45s', 'Battle Ropes 5x30s', 'Cool down'] },
      { day: 'Saturday',  focus: 'Active Recovery',           exercises: ['60min brisk walk or light jog', 'Stretching'] },
      { day: 'Sunday',    focus: 'Rest',                      exercises: ['Full rest day'] },
    ],
    '2-3 days': [
      { day: 'Monday',    focus: 'Full Body — Fast Pace',  exercises: ['Burpees 3x10', 'Squats 3x15', 'Push-ups 3x15', 'Mountain Climbers 3x30s', 'Plank 3x45s'] },
      { day: 'Tuesday',   focus: 'Rest / Walk',            exercises: ['45 min walk', 'Stretching'] },
      { day: 'Wednesday', focus: 'Cardio + Core',          exercises: ['30min jogging', 'Crunches 3x20', 'Russian Twists 3x20', 'Leg Raises 3x15', 'Plank 3x60s'] },
      { day: 'Thursday',  focus: 'Rest',                   exercises: ['Rest day'] },
      { day: 'Friday',    focus: 'Circuit — No Stop',      exercises: ['Kettlebell Swings (KB Swings) 4x20', 'Jump Lunges 4x12', 'Push-ups 4x15', 'Rowing Machine 4x500m (if available)'] },
      { day: 'Saturday',  focus: 'Rest / Active',          exercises: ['Optional 45min walk or bike ride'] },
      { day: 'Sunday',    focus: 'Rest',                   exercises: ['Full rest day'] },
    ],
    '6+ days': [
      { day: 'Monday',    focus: 'Strength A',            exercises: ['Squats 4x12', 'Bench Press 4x12', 'Cable Rows 4x12', 'Core circuit 3x'] },
      { day: 'Tuesday',   focus: 'Cardio — Fast Bursts',  exercises: ['HIIT (High-Intensity Intervals) 20min', 'Cool down 10min', 'Stretching'] },
      { day: 'Wednesday', focus: 'Strength B',            exercises: ['Deadlift 4x10', 'Overhead Press (OHP) 4x12', 'Pull-ups 4xMax', 'Ab circuit'] },
      { day: 'Thursday',  focus: 'Easy Steady Cardio',    exercises: ['45min brisk walk or easy cycle (LISS — Low-Intensity Steady State)', 'Foam rolling'] },
      { day: 'Friday',    focus: 'Full Body',             exercises: ['Lunges 4x12', 'Push-ups 4x15', 'Kettlebell Swings (KB Swings) 4x20', 'Plank 3x60s', 'Battle Ropes 3x30s'] },
      { day: 'Saturday',  focus: 'Cardio',               exercises: ['30-45min jog or bike', 'Cool down'] },
      { day: 'Sunday',    focus: 'Rest',                  exercises: ['Full rest day', 'Tip: prep your meals for the week'] },
    ],
  },
  'FIRST STEPS': {
    '2-3 days': [
      { day: 'Monday',    focus: 'Learn the Basic Moves',   exercises: ['Goblet Squats 3x10', 'Push-ups 3x8', 'Dumbbell Rows 3x10', 'Glute Bridge 3x15', 'Dead Bug 3x8 (core stability move)'] },
      { day: 'Tuesday',   focus: 'Rest / Walk',             exercises: ['20-30 min walk', 'Hip flexor stretch (loosens tight hips from sitting)'] },
      { day: 'Wednesday', focus: 'Full Body Session B',     exercises: ['Light Deadlift 3x8', 'Dumbbell Overhead Press 3x10', 'Lat Pulldown 3x10 (pull cable down to work your back)', 'Lunges 3x10 each side', 'Plank 3x20s'] },
      { day: 'Thursday',  focus: 'Rest',                   exercises: ['Rest day', 'Foam rolling (helps recovery)'] },
      { day: 'Friday',    focus: 'Full Body Session C',     exercises: ['Step-ups 3x10', 'Incline Push-ups 3x10', 'Cable Rows 3x10', 'Romanian Deadlift (RDL) 3x10', 'Side Plank 3x20s'] },
      { day: 'Saturday',  focus: 'Active Recovery',        exercises: ['30 min walk or easy bike ride'] },
      { day: 'Sunday',    focus: 'Rest',                   exercises: ['Full rest day'] },
    ],
    '4-5 days': [
      { day: 'Monday',    focus: 'Push — Chest & Shoulders', exercises: ['Push-ups 3x8', 'Dumbbell Overhead Press 3x10', 'Incline Push-ups 3x10', 'Tricep Dips 3x8'] },
      { day: 'Tuesday',   focus: 'Pull — Back & Biceps',     exercises: ['Lat Pulldown 3x10', 'Dumbbell Rows 3x10', 'Face Pulls 3x12', 'Bicep Curls 3x10'] },
      { day: 'Wednesday', focus: 'Rest',                    exercises: ['Rest day', 'Light stretching'] },
      { day: 'Thursday',  focus: 'Legs',                    exercises: ['Goblet Squats 3x10', 'Glute Bridge 3x15', 'Lunges 3x10', 'Calf Raises 3x15'] },
      { day: 'Friday',    focus: 'Full Body',               exercises: ['Light Deadlift 3x8', 'Push-ups 3x10', 'Cable Rows 3x10', 'Core Circuit 3x'] },
      { day: 'Saturday',  focus: 'Rest',                   exercises: ['Rest day'] },
      { day: 'Sunday',    focus: 'Rest',                   exercises: ['Rest day'] },
    ],
    '6+ days': [
      { day: 'Monday',    focus: 'Upper Body A',  exercises: ['Push-ups 3x10', 'Dumbbell Rows 3x10', 'Dumbbell Overhead Press 3x10', 'Lat Pulldown 3x10'] },
      { day: 'Tuesday',   focus: 'Lower Body A',  exercises: ['Goblet Squats 3x12', 'Glute Bridge 3x15', 'Lunges 3x10', 'Calf Raises 3x15'] },
      { day: 'Wednesday', focus: 'Cardio',        exercises: ['20-30 min brisk walk or light jog', 'Stretching'] },
      { day: 'Thursday',  focus: 'Upper Body B',  exercises: ['Incline Push-ups 3x10', 'Face Pulls 3x12', 'Bicep Curls 3x10', 'Tricep Dips 3x8'] },
      { day: 'Friday',    focus: 'Lower Body B',  exercises: ['Light Deadlift 3x8', 'Step-ups 3x10', 'Romanian Deadlift (RDL) 3x10', 'Plank 3x30s'] },
      { day: 'Saturday',  focus: 'Full Body',     exercises: ['5 exercises x 3 rounds circuit', 'Core work', 'Cool down'] },
      { day: 'Sunday',    focus: 'Rest',          exercises: ['Full rest day'] },
    ],
  },
  'NO GYM': {
    '4-5 days': [
      { day: 'Monday',    focus: 'Push — Arms & Chest',   exercises: ['Push-ups 4x15', 'Pike Push-ups 3x10 (feet up, works shoulders)', 'Diamond Push-ups 3x10 (hands together, works triceps)', 'Chair Dips 3x12'] },
      { day: 'Tuesday',   focus: 'Legs & Glutes',         exercises: ['Squats 4x20', 'Jump Squats 3x15', 'Lunges 3x12', 'Glute Bridge 3x20', 'Calf Raises 4x20'] },
      { day: 'Wednesday', focus: 'Rest',                  exercises: ['Rest day', 'Stretching 15min'] },
      { day: 'Thursday',  focus: 'Back & Core',           exercises: ['Australian Rows 4x10 (lie under a table, pull up)', 'Superman 3x15 (lie face down, lift arms and legs)', 'Inverted Rows 3x10', 'Plank 3x60s', 'Dead Bug 3x10'] },
      { day: 'Friday',    focus: 'Full Body Circuit',     exercises: ['Burpees 4x10', 'Push-ups 4x15', 'Squats 4x20', 'Mountain Climbers 4x30s', 'Plank 4x45s'] },
      { day: 'Saturday',  focus: 'Active Recovery',       exercises: ['30min walk', 'Yoga or stretching'] },
      { day: 'Sunday',    focus: 'Rest',                  exercises: ['Full rest day'] },
    ],
    '2-3 days': [
      { day: 'Monday',    focus: 'Full Body A',            exercises: ['Push-ups 3x15', 'Squats 3x20', 'Glute Bridge 3x20', 'Plank 3x45s', 'Mountain Climbers 3x20'] },
      { day: 'Tuesday',   focus: 'Rest',                   exercises: ['Rest day or 30min walk'] },
      { day: 'Wednesday', focus: 'Full Body B',            exercises: ['Chair Dips 3x10', 'Lunges 3x12', 'Superman 3x15', 'Burpees 3x8', 'Side Plank 3x30s'] },
      { day: 'Thursday',  focus: 'Rest',                   exercises: ['Rest day'] },
      { day: 'Friday',    focus: 'Fast Cardio Circuit',    exercises: ['Jumping Jacks 4x30s', 'Push-ups 4x12', 'Jump Squats 4x12', 'High Knees 4x30s', 'Plank 4x30s'] },
      { day: 'Saturday',  focus: 'Rest',                   exercises: ['Rest or easy walk'] },
      { day: 'Sunday',    focus: 'Rest',                   exercises: ['Full rest day'] },
    ],
  },
};

function getTemplate(category, frequency) {
  const cat = TEMPLATES[category];
  if (!cat) return TEMPLATES['HYPERTROPHY']['4-5 days']; // default fallback
  return cat[frequency] || cat[Object.keys(cat)[0]];
}

function buildWeeks(category, frequency, totalWeeks) {
  const week1 = getTemplate(category, frequency);
  // Simple progression: same structure, exercises scale each week (noted in text)
  return week1;
}

// ── Routes: Health ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// ── Routes: Auth ─────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  if (password.length < 6)  return res.status(400).json({ error: 'Password must be at least 6 characters' });

  try {
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (exists.rows.length) return res.status(409).json({ error: 'An account with this email already exists' });

    const hash = await bcrypt.hash(password, 10);
    const displayName = name || email.split('@')[0];
    const verifyToken = crypto.randomBytes(32).toString('hex');

    await pool.query(
      `INSERT INTO users (email, password_hash, name, email_verified, verify_token)
       VALUES ($1,$2,$3,false,$4)`,
      [email.toLowerCase(), hash, displayName, verifyToken]
    );

    await sendVerificationEmail(email.toLowerCase(), verifyToken);

    res.json({ pending: true, message: 'Check your email to activate your account' });
  } catch (err) {
    console.error('[register]', err.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ── Email verification ──────────────────────────────────────────────────────
app.get('/api/auth/verify-email', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send('Invalid link');

  try {
    const { rows } = await pool.query(
      'UPDATE users SET email_verified = true, verify_token = NULL WHERE verify_token = $1 AND email_verified = false RETURNING email',
      [token]
    );
    if (!rows.length) {
      return res.send(`
        <html><body style="background:#000;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
          <div style="text-align:center;">
            <h1>Link expired or already used</h1>
            <p style="color:#999;">Try logging in — your account may already be active.</p>
          </div>
        </body></html>
      `);
    }
    res.send(`
      <html><body style="background:#000;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
        <div style="text-align:center;">
          <h1 style="margin-bottom:8px;">Account <span style="color:#E94560;">activated</span>!</h1>
          <p style="color:#999;margin-bottom:24px;">You can now log in to Kyroo.</p>
          <a href="${BASE_URL}" style="display:inline-block;background:#E94560;color:#fff;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:16px;">Open Kyroo</a>
        </div>
      </body></html>
    `);
  } catch (err) {
    console.error('[verify-email]', err.message);
    res.status(500).send('Verification failed');
  }
});

// ── Resend verification email ───────────────────────────────────────────────
app.post('/api/auth/resend-verification', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const { rows } = await pool.query(
      'SELECT id, verify_token FROM users WHERE email = $1 AND email_verified = false',
      [email.toLowerCase()]
    );
    if (!rows.length) return res.json({ ok: true }); // don't leak info

    let token = rows[0].verify_token;
    if (!token) {
      token = crypto.randomBytes(32).toString('hex');
      await pool.query('UPDATE users SET verify_token = $1 WHERE id = $2', [token, rows[0].id]);
    }
    await sendVerificationEmail(email.toLowerCase(), token);
    res.json({ ok: true });
  } catch (err) {
    console.error('[resend-verification]', err.message);
    res.status(500).json({ error: 'Failed to resend' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  try {
    const { rows } = await pool.query(
      'SELECT id, email, name, password_hash, is_premium, email_verified FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    if (user.email_verified === false) {
      return res.status(403).json({ error: 'Please verify your email before logging in', unverified: true });
    }

    const { password_hash, email_verified, verify_token, ...safe } = user;
    res.json({ token: issueToken(safe), user: safe });
  } catch (err) {
    console.error('[login]', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Stub — in production send a real reset email
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  // Always return success to avoid email enumeration
  res.json({ ok: true });
});

// ── Routes: Plans ────────────────────────────────────────────────────────────
app.get('/api/plans', async (req, res) => {
  try {
    const rows = await cached('plans', 300_000, async () => {
      const r = await pool.query('SELECT * FROM plans ORDER BY sort_order');
      return r.rows;
    });
    res.json(rows);
  } catch (err) {
    console.error('[plans]', err.message);
    res.status(500).json({ error: 'Failed to load plans' });
  }
});

app.get('/api/plans/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM plans WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Plan not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load plan' });
  }
});

// ── Routes: Questionnaire ────────────────────────────────────────────────────
app.post('/api/questionnaire', auth, async (req, res) => {
  const body = req.body;
  const {
    plan_id, planId,
    goal, primary_goal,
    experience, fitness_level,
    days_per_week, training_frequency,
    session_mins, session_duration,
    equipment, injuries, motivation, commitment,
    gender, age, weight_kg, height_cm,
    training_days,
  } = body;

  // Everything else (plan-specific answers) goes into extra_answers JSONB
  const knownKeys = new Set([
    'plan_id','planId','goal','primary_goal','experience','fitness_level',
    'days_per_week','training_frequency','session_mins','session_duration',
    'equipment','injuries','motivation','commitment',
    'gender','age','weight_kg','height_cm','training_days',
  ]);
  const extraAnswers = {};
  for (const [k, v] of Object.entries(body)) {
    if (!knownKeys.has(k)) extraAnswers[k] = v;
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO questionnaires
         (user_id, plan_id, primary_goal, fitness_level, training_frequency, session_duration,
          experience, days_per_week, session_mins, equipment, injuries, motivation, commitment,
          gender, age, weight_kg, height_cm, training_days, extra_answers)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       RETURNING id`,
      [
        req.user.id,
        plan_id || planId || null,
        goal || primary_goal || null,
        experience || fitness_level || null,
        days_per_week != null ? `${days_per_week} days` : (training_frequency || null),
        session_mins != null ? `${session_mins} min`  : (session_duration || null),
        experience || null,
        days_per_week || null,
        session_mins  || null,
        equipment  || null,
        injuries   || null,
        motivation || null,
        commitment || null,
        gender     || null,
        age        || null,
        weight_kg  || null,
        height_cm  || null,
        Array.isArray(training_days) ? training_days : null,
        JSON.stringify(extraAnswers),
      ]
    );
    res.json({ id: rows[0].id });
  } catch (err) {
    console.error('[questionnaire]', err.message);
    res.status(500).json({ error: 'Failed to save questionnaire' });
  }
});

// ── AI program generation via Claude ────────────────────────────────────────
async function generateProgramWithClaude(q) {
  if (!anthropic) throw new Error('Anthropic API key not configured');

  const extras = q.extra_answers || {};
  const trainingDays = Array.isArray(q.training_days) ? q.training_days.join(', ') : 'any day';
  const totalWeeks = q.total_weeks || 12;

  const userProfile = `
USER PROFILE
- Gender: ${q.gender || 'unspecified'}
- Height: ${q.height_cm || 'unspecified'} cm
- Weight: ${q.weight_kg || 'unspecified'} kg
- Fitness level: ${q.fitness_level || extras.fitness_level || 'unspecified'}

PLAN TYPE: ${q.category || 'general fitness'}
TRAINING FREQUENCY: ${q.days_per_week || 3} days per week
TRAINING DAYS: ${trainingDays}
TOTAL PROGRAM LENGTH: ${totalWeeks} weeks

EQUIPMENT: ${extras.equipment || 'body weight only'}
INJURIES / LIMITATIONS: ${extras.injuries || 'none'}

ADDITIONAL ANSWERS (plan-specific):
${Object.entries(extras)
  .filter(([k]) => !['equipment','injuries','fitness_level'].includes(k))
  .map(([k, v]) => `- ${k}: ${v}`)
  .join('\n')}
`.trim();

  const systemPrompt = `You are a world-class personal trainer and exercise physiologist. You create safe, effective, highly personalised training programs.

Output MUST be valid JSON matching this exact schema:
{
  "name": "Program name (short, motivating)",
  "overview": "One paragraph explaining the program approach",
  "days": [
    {
      "day_name": "Monday|Tuesday|... or Rest Day",
      "focus": "Short focus label (e.g. 'Push Day', 'Long Run', 'Active Recovery')",
      "exercises": [
        { "name": "Exercise name", "sets": 4, "reps": "8-10" }
      ]
    }
  ]
}

RULES:
- Generate exactly 7 entries in "days" — one for each day of the week, in order Mon-Sun
- For rest/off days, use "focus": "Rest Day" and exercises: [{ "name": "Rest or light walk", "sets": 1, "reps": "-" }]
- Training days must match the user's selected TRAINING DAYS exactly
- Tailor intensity to their fitness level (beginner/intermediate/advanced/elite)
- Respect equipment constraints
- Avoid exercises that conflict with their injuries
- Keep exercise names simple and searchable (e.g. "Back Squat" not "Olympic-style back squat 3/4 depth")
- 4-7 exercises per training day
- Reps format: use strings like "8-10", "12", "30s", "5km" — never objects`;

  const resp = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: `Build a personalised weekly program for this user:\n\n${userProfile}` }],
  });

  const text = resp.content.find(c => c.type === 'text')?.text || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Claude did not return JSON');
  const parsed = JSON.parse(jsonMatch[0]);
  if (!parsed.days || !Array.isArray(parsed.days)) throw new Error('Claude JSON missing days array');
  return parsed;
}

// ── Routes: Programs ─────────────────────────────────────────────────────────
app.post('/api/programs/generate', auth, async (req, res) => {
  const { questionnaireId } = req.body;
  if (!questionnaireId) return res.status(400).json({ error: 'questionnaireId is required' });

  try {
    const qRes = await pool.query(
      `SELECT q.*, p.name AS plan_name, p.category, p.total_weeks
       FROM questionnaires q
       LEFT JOIN plans p ON p.id = q.plan_id
       WHERE q.id = $1 AND q.user_id = $2`,
      [questionnaireId, req.user.id]
    );
    if (!qRes.rows.length) return res.status(404).json({ error: 'Questionnaire not found' });

    const q = qRes.rows[0];
    const category = q.category || 'GENERAL';
    const totalWeeks = q.total_weeks || 12;

    // Try Claude first, fall back to template if it fails
    let programName, days, aiGenerated = false;
    try {
      const aiPlan = await generateProgramWithClaude(q);
      programName = aiPlan.name || q.plan_name || `${category} Program`;
      days = aiPlan.days.map(d => ({
        day: d.day_name || d.day || 'Day',
        focus: d.focus || '',
        exercises: Array.isArray(d.exercises) ? d.exercises.map(e => ({
          name: e.name || 'Exercise',
          sets: Number(e.sets) || 1,
          reps: typeof e.reps === 'string' ? e.reps : String(e.reps || '-'),
        })) : [],
      }));
      aiGenerated = true;
    } catch (aiErr) {
      console.error('[generate] Claude failed, falling back to template:', aiErr.message);
      programName = q.plan_name || `${category} Program`;
      const daysNum = q.days_per_week;
      const frequency = daysNum <= 3 ? '2-3 days' : daysNum >= 6 ? '6+ days' : (q.training_frequency || '4-5 days');
      days = buildWeeks(category, frequency, totalWeeks);
    }

    // Auto-assign status: 'active' if none exists, 'queued' otherwise
    const activeCheck = await pool.query(
      `SELECT id FROM programs WHERE user_id = $1 AND status = 'active' LIMIT 1`,
      [req.user.id]
    );
    const autoStatus = activeCheck.rows.length ? 'queued' : 'active';

    const progRes = await pool.query(
      `INSERT INTO programs (user_id, plan_id, questionnaire_id, total_weeks, name, status, ai_generated)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [req.user.id, q.plan_id, questionnaireId, totalWeeks, programName, autoStatus, aiGenerated]
    );
    const programId = progRes.rows[0].id;

    for (let i = 0; i < days.length; i++) {
      const d = days[i];
      await pool.query(
        `INSERT INTO program_days (program_id, day_name, focus, exercises, sort_order)
         VALUES ($1,$2,$3,$4,$5)`,
        [programId, d.day, d.focus, JSON.stringify(d.exercises), i]
      );
    }

    res.json({ id: programId, ai_generated: aiGenerated });
  } catch (err) {
    console.error('[generate]', err.message);
    res.status(500).json({ error: 'Program generation failed' });
  }
});

// Parse "Bench Press 4x8" -> { name: "Bench Press", sets: 4, reps: "8" }
function parseExercise(str) {
  const m = str.match(/^(.+?)\s+(\d+)[x×](\S+)$/);
  if (m) return { name: m[1].trim(), sets: parseInt(m[2]), reps: m[3] };
  // e.g. "Rest day" or "20 min walk"
  return { name: str, sets: 1, reps: '-' };
}

// ── Routes: Programs list + status ───────────────────────────────────────────

app.get('/api/programs', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.id, COALESCE(p.name, pl.name) AS name, pl.category, pl.icon, pl.difficulty,
              p.total_weeks, p.current_week, p.status, p.ai_generated, p.created_at
       FROM programs p
       LEFT JOIN plans pl ON pl.id = p.plan_id
       WHERE p.user_id = $1
       ORDER BY
         CASE p.status
           WHEN 'active'    THEN 0
           WHEN 'queued'    THEN 1
           WHEN 'paused'    THEN 2
           ELSE 3
         END,
         p.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('[programs list]', err.message);
    res.status(500).json({ error: 'Failed to load programs' });
  }
});

app.patch('/api/programs/:id/status', auth, async (req, res) => {
  const { status } = req.body;
  const valid = ['active', 'queued', 'paused', 'completed'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  try {
    const check = await pool.query(
      'SELECT id FROM programs WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!check.rows.length) return res.status(404).json({ error: 'Program not found' });

    if (status === 'active') {
      // Pause the currently active program before activating this one
      await pool.query(
        `UPDATE programs SET status = 'paused' WHERE user_id = $1 AND status = 'active' AND id != $2`,
        [req.user.id, req.params.id]
      );
    }

    await pool.query(
      'UPDATE programs SET status = $1 WHERE id = $2 AND user_id = $3',
      [status, req.params.id, req.user.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[set status]', err.message);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// ── Routes: Current active program (full detail) ──────────────────────────────

app.get('/api/programs/current', auth, async (req, res) => {
  try {
    const progRes = await pool.query(
      `SELECT p.*, COALESCE(p.name, pl.name) AS name, pl.category,
              p.total_weeks AS weeks, p.current_week AS week,
              (SELECT COUNT(*) FROM program_days WHERE program_id = p.id AND focus NOT ILIKE '%rest%') AS days_per_week
       FROM programs p
       LEFT JOIN plans pl ON pl.id = p.plan_id
       WHERE p.user_id = $1 AND p.status = 'active'
       ORDER BY p.created_at DESC
       LIMIT 1`,
      [req.user.id]
    );
    if (!progRes.rows.length) return res.json(null);

    const program = progRes.rows[0];
    const daysRes = await pool.query(
      'SELECT * FROM program_days WHERE program_id = $1 ORDER BY sort_order',
      [program.id]
    );

    program.days = daysRes.rows.map((d, i) => ({
      day_number: i + 1,
      name:       d.day_name,
      focus:      d.focus,
      exercises:  (d.exercises || []).map(parseExercise),
    }));

    res.json(program);
  } catch (err) {
    console.error('[current program]', err.message);
    res.status(500).json({ error: 'Failed to load program' });
  }
});

// ── Routes: Tracking ─────────────────────────────────────────────────────────
app.get('/api/tracking/today', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const habitsRes = await pool.query(
      `SELECT h.id, h.name,
              COUNT(hl.id) > 0 AS completed,
              COALESCE((
                SELECT COUNT(DISTINCT hl2.logged_date)
                FROM habit_logs hl2
                WHERE hl2.user_id = $1 AND hl2.habit_id = h.id
                  AND hl2.logged_date >= (CURRENT_DATE - INTERVAL '30 days')
              ), 0) AS streak
       FROM habits h
       LEFT JOIN habit_logs hl ON hl.habit_id = h.id AND hl.user_id = $1 AND hl.logged_date = $2
       GROUP BY h.id, h.name
       ORDER BY h.id`,
      [req.user.id, today]
    );

    const moodRes = await pool.query(
      'SELECT mood_index FROM mood_logs WHERE user_id = $1 AND logged_date = $2',
      [req.user.id, today]
    );

    res.json({
      habits: habitsRes.rows.map(h => ({ ...h, streak: parseInt(h.streak) })),
      mood:   moodRes.rows[0]?.mood_index ?? null,
      date:   today,
    });
  } catch (err) {
    console.error('[tracking today]', err.message);
    res.status(500).json({ error: 'Failed to load tracking data' });
  }
});

app.post('/api/tracking/habits/:id/toggle', auth, async (req, res) => {
  const habitId = parseInt(req.params.id);
  const today   = new Date().toISOString().split('T')[0];
  try {
    const existing = await pool.query(
      'SELECT id FROM habit_logs WHERE user_id = $1 AND habit_id = $2 AND logged_date = $3',
      [req.user.id, habitId, today]
    );
    if (existing.rows.length) {
      await pool.query(
        'DELETE FROM habit_logs WHERE user_id = $1 AND habit_id = $2 AND logged_date = $3',
        [req.user.id, habitId, today]
      );
      res.json({ completed: false });
    } else {
      await pool.query(
        'INSERT INTO habit_logs (user_id, habit_id, logged_date) VALUES ($1,$2,$3)',
        [req.user.id, habitId, today]
      );
      res.json({ completed: true });
    }
  } catch (err) {
    console.error('[toggle habit]', err.message);
    res.status(500).json({ error: 'Failed to toggle habit' });
  }
});

app.post('/api/tracking/mood', auth, async (req, res) => {
  const { moodIndex } = req.body;
  const today = new Date().toISOString().split('T')[0];
  try {
    await pool.query(
      `INSERT INTO mood_logs (user_id, mood_index, logged_date)
       VALUES ($1,$2,$3)
       ON CONFLICT (user_id, logged_date) DO UPDATE SET mood_index = $2`,
      [req.user.id, moodIndex, today]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[save mood]', err.message);
    res.status(500).json({ error: 'Failed to save mood' });
  }
});

// ── Routes: Profile ──────────────────────────────────────────────────────────
app.get('/api/profile', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, name, is_premium, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });

    const statsRes = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM habit_logs WHERE user_id = $1) AS total_workouts,
         (SELECT COUNT(*) FROM programs WHERE user_id = $1) AS total_plans,
         (SELECT COUNT(DISTINCT logged_date) FROM habit_logs
          WHERE user_id = $1
            AND logged_date >= (CURRENT_DATE - INTERVAL '30 days')) AS streak
       `,
      [req.user.id]
    );

    res.json({ ...rows[0], stats: statsRes.rows[0] });
  } catch (err) {
    console.error('[profile]', err.message);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

app.put('/api/profile', auth, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try {
    const { rows } = await pool.query(
      'UPDATE users SET name = $1 WHERE id = $2 RETURNING id, email, name, is_premium',
      [name, req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ── Routes: Auth extras ───────────────────────────────────────────────────────

app.post('/api/auth/change-password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ error: 'Both passwords are required' });
  if (newPassword.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  try {
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    const ok = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('[change-password]', err.message);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

app.delete('/api/account', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('[delete-account]', err.message);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// ── Start ────────────────────────────────────────────────────────────────────
pool.connect()
  .then(async c => {
    c.release();
    // Add status column to programs if it doesn't exist yet
    await pool.query(
      `ALTER TABLE programs ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'`
    );
    // Performance indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date ON habit_logs(user_id, habit_id, logged_date)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_programs_user_status ON programs(user_id, status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_program_days_program ON program_days(program_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_mood_logs_user_date ON mood_logs(user_id, logged_date)`);
    // AI questionnaire answers + training days
    await pool.query(`ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS extra_answers JSONB`);
    await pool.query(`ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS training_days TEXT[]`);
    await pool.query(`ALTER TABLE programs ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN NOT NULL DEFAULT false`);
    console.log('Database connected.');
  })
  .catch(err => console.error('Database connection failed:', err.message));

app.listen(PORT, () => console.log(`Kyroo API running on http://localhost:${PORT}`));
