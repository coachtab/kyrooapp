// One-shot script: backfill nutrition JSON for existing body-comp programs
// that were built before the nutrition feature was deployed.
// Usage: node backfill-nutrition.js

require('dotenv').config();
const { Pool } = require('pg');
const Anthropic = require('@anthropic-ai/sdk');

const pool = new Pool({
  host:     process.env.DB_HOST     || '127.0.0.1',
  port:     parseInt(process.env.DB_PORT || '15434'),
  database: process.env.DB_NAME     || 'kyrooapp',
  user:     process.env.DB_USER     || 'kyroo',
  password: process.env.DB_PASSWORD || 'kyroo_pass',
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `Output ONLY a valid JSON object matching this schema exactly:
{
  "calories_per_day": 2400,
  "protein_g": 180,
  "carbs_g": 260,
  "fat_g": 75,
  "meal_frequency": "3 meals + 1 snack",
  "sample_meals": [
    { "when": "Breakfast", "name": "Greek yogurt with berries and granola", "kcal": 450 },
    { "when": "Lunch",     "name": "Grilled chicken, quinoa, roasted veg",   "kcal": 650 },
    { "when": "Snack",     "name": "Apple with almond butter",               "kcal": 250 },
    { "when": "Dinner",    "name": "Salmon, sweet potato, broccoli",         "kcal": 700 },
    { "when": "Optional",  "name": "Protein shake post-workout",             "kcal": 200 }
  ],
  "notes": "One short practical sentence."
}

Base calories on goal:
- FAT LOSS: 15-20% deficit
- HYPERTROPHY: 10-15% surplus
- TRANSFORMATION: maintenance to slight deficit
- FIRST STEPS: maintenance

Protein target: 1.6-2.2 g/kg bodyweight.
5 simple, realistic, culturally-neutral meals with kcal.
Notes: one practical reminder tailored to the plan.
Output ONLY the JSON, no markdown or prose.`;

(async () => {
  const { rows } = await pool.query(
    `SELECT p.id, p.name, q.gender, q.height_cm, q.weight_kg, q.fitness_level, q.extra_answers, pl.category
     FROM programs p
     LEFT JOIN questionnaires q ON q.id = p.questionnaire_id
     LEFT JOIN plans pl ON pl.id = p.plan_id
     WHERE p.nutrition IS NULL
       AND pl.category IN ('FAT LOSS', 'HYPERTROPHY', 'TRANSFORMATION', 'FIRST STEPS')`
  );

  console.log(`Programs to backfill: ${rows.length}`);

  for (const r of rows) {
    console.log(`→ ${r.name} (${r.category})`);
    const extras = r.extra_answers || {};
    const profile = `
- Gender: ${r.gender || 'unspecified'}
- Height: ${r.height_cm || 'unspecified'} cm
- Weight: ${r.weight_kg || 'unspecified'} kg
- Fitness level: ${r.fitness_level || 'unspecified'}
- Plan type: ${r.category}
- Equipment: ${extras.equipment || 'unspecified'}
- Goal: ${extras.goal || extras.muscle_goal || extras.transform_goal || extras.why_start || 'general'}
`.trim();

    try {
      const resp = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        system: SYSTEM,
        messages: [{ role: 'user', content: `Generate personalised nutrition JSON for this user:\n\n${profile}` }],
      });
      const text = resp.content.find(c => c.type === 'text')?.text || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        console.log('  ✗ no JSON in response');
        continue;
      }
      const nutrition = JSON.parse(match[0]);
      await pool.query('UPDATE programs SET nutrition = $1 WHERE id = $2', [JSON.stringify(nutrition), r.id]);
      console.log(`  ✓ ${nutrition.calories_per_day} kcal, ${nutrition.protein_g}g protein, ${nutrition.sample_meals?.length || 0} meals`);
    } catch (e) {
      console.log(`  ✗ ${e.message}`);
    }
  }

  await pool.end();
  console.log('Done.');
})();
