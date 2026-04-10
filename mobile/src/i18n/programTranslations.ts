// Translations for backend-generated program content.
// Keys are the exact English strings stored by server.js TEMPLATES.

type Lang = 'en' | 'de';

// ── Focus areas ───────────────────────────────────────────────────────────────

const FOCUS_DE: Record<string, string> = {
  // Rest
  'Rest':                               'Ruhetag',
  'Rest & Recovery':                    'Ruhe & Regeneration',
  'Rest / Active':                      'Ruhe / Aktiv',
  'Rest / Walk':                        'Ruhe / Spaziergang',
  'Active Recovery':                    'Aktive Erholung',

  // Push / Pull / Legs
  'Push — Chest, Shoulders & Triceps':  'Push — Brust, Schultern & Trizeps',
  'Push — Chest & Shoulders':           'Push — Brust & Schultern',
  'Push — Arms & Chest':                'Push — Arme & Brust',
  'Pull — Back & Biceps':               'Pull — Rücken & Bizeps',

  // Muscle groups
  'Chest & Triceps':                    'Brust & Trizeps',
  'Back & Biceps':                      'Rücken & Bizeps',
  'Back & Core':                        'Rücken & Core',
  'Legs & Glutes':                      'Beine & Gesäß',
  'Legs — Quads, Hamstrings & Calves':  'Beine — Quadrizeps, Ischio & Waden',
  'Legs':                               'Beine',
  'Lower Body A':                       'Unterkörper A',
  'Lower Body B':                       'Unterkörper B',
  'Upper Body A':                       'Oberkörper A',
  'Upper Body B':                       'Oberkörper B',
  'Shoulders & Traps':                  'Schultern & Trapez',
  'Arms & Core':                        'Arme & Core',

  // Full Body
  'Full Body':                          'Ganzkörper',
  'Full Body A':                        'Ganzkörper A',
  'Full Body B':                        'Ganzkörper B',
  'Full Body C':                        'Ganzkörper C',
  'Full Body Circuit':                  'Ganzkörper-Circuit',
  'Full Body Session B':                'Ganzkörper-Einheit B',
  'Full Body Session C':                'Ganzkörper-Einheit C',
  'Full Body + Cardio':                 'Ganzkörper + Cardio',
  'Full Body — Fast Pace':              'Ganzkörper — Hohes Tempo',

  // Strength
  'Strength A':                         'Kraft A',
  'Strength B':                         'Kraft B',
  'Strength + Cardio':                  'Kraft + Cardio',

  // Cardio
  'Cardio':                             'Cardio',
  'Cardio & Core':                      'Cardio & Core',
  'Cardio & Fitness':                   'Cardio & Fitness',
  'Cardio + Core':                      'Cardio + Core',
  'Cardio — Fast Bursts':               'Cardio — Schnelle Intervalle',
  'Easy Steady Cardio':                 'Lockeres Ausdauertraining',
  'Fast Cardio Circuit':                'Schneller Cardio-Circuit',

  // Circuit / HIIT
  'Circuit Training':                   'Zirkeltraining',
  'Circuit — No Stop':                  'Zirkel — Non-Stop',
  'HIIT — Short Hard Bursts':           'HIIT — Kurze, intensive Intervalle',

  // Beginner
  'Learn the Basic Moves':              'Die Grundbewegungen erlernen',
};

// ── Weekday names ─────────────────────────────────────────────────────────────

const WEEKDAY_DE: Record<string, string> = {
  'Monday':    'Montag',
  'Tuesday':   'Dienstag',
  'Wednesday': 'Mittwoch',
  'Thursday':  'Donnerstag',
  'Friday':    'Freitag',
  'Saturday':  'Samstag',
  'Sunday':    'Sonntag',
};

// ── Exercise names ────────────────────────────────────────────────────────────
// Covers every exercise name produced by parseExercise() from the TEMPLATES.

const EXERCISE_DE: Record<string, string> = {
  // Barbell / compound
  'Bench Press':                                        'Bankdrücken',
  'Incline Dumbbell Press':                             'Schrägbanke Kurzhantel-Drücken',
  'Overhead Press (OHP)':                               'Schulterdrücken (OHP)',
  'Dumbbell Overhead Press':                            'Kurzhantel-Schulterdrücken',
  'Squats':                                             'Kniebeugen',
  'Front Squats':                                       'Frontkniebeugen',
  'Goblet Squats':                                      'Goblet-Kniebeugen',
  'Jump Squats':                                        'Sprungkniebeugen',
  'Deadlift':                                           'Kreuzheben',
  'Light Deadlift':                                     'Leichtes Kreuzheben',
  'Romanian Deadlift (RDL)':                            'Rumänisches Kreuzheben (RDL)',
  'Leg Press':                                          'Beinpresse',
  'Leg Curl':                                           'Beinbeuger',
  'Calf Raises':                                        'Wadenheben',

  // Pulls / back
  'Pull-ups':                                           'Klimmzüge',
  'Lat Pulldown':                                       'Latziehen',
  'Cable Rows':                                         'Kabelrudern',
  'Dumbbell Rows':                                      'Kurzhantel-Rudern',
  'Inverted Rows':                                      'Austrischer Zug',
  'Australian Rows (lie under a table, pull up)':       'Australischer Zug (unter Tisch hinlegen, hochziehen)',
  'Face Pulls':                                         'Face Pulls',
  'Hammer Curls':                                       'Hammer-Curls',
  'Bicep Curls':                                        'Bizeps-Curls',
  'Barbell Curls':                                      'Langhantel-Curls',
  'Rear Delt Fly':                                      'Hintere Schulter-Fly',
  'Shrugs':                                             'Schulterziehen',

  // Push / shoulders / triceps
  'Lateral Raises':                                     'Seitheben',
  'Front Raises':                                       'Vorwärtsheben',
  'Tricep Pushdown':                                    'Trizepsdrücken am Kabel',
  'Tricep Dips':                                        'Trizeps-Dips',
  'Dips':                                               'Dips',
  'Skull Crushers':                                     'Skull Crusher',
  'Cable Fly':                                          'Kabel-Fly',

  // Legs / glutes
  'Lunges':                                             'Ausfallschritte',
  'Jump Lunges':                                        'Sprung-Ausfallschritte',
  'Step-ups':                                           'Step-ups',
  'Glute Bridge':                                       'Hüftbrücke',

  // Bodyweight
  'Push-ups':                                           'Liegestütze',
  'Incline Push-ups':                                   'Erhöhte Liegestütze',
  'Diamond Push-ups (hands together, works triceps)':   'Diamant-Liegestütze (Hände zusammen, Trizeps)',
  'Pike Push-ups (feet up, works shoulders)':           'Pike-Liegestütze (Füße erhöht, Schultern)',
  'Chair Dips':                                         'Stuhl-Dips',
  'Burpees':                                            'Burpees',
  'Mountain Climbers':                                  'Mountain Climbers',
  'Superman 3x15 (lie face down, lift arms and legs)':  'Superman (bäuchlings, Arme & Beine heben)',
  'Dead Bug 3x8 (core stability move)':                 'Dead Bug (Core-Stabilisierung)',
  'Dead Bug 3x10':                                      'Dead Bug',
  'Side Plank':                                         'Seitstütz',
  'Plank':                                              'Unterarmstütz',

  // Kettlebell / conditioning
  'Kettlebell Swings (KB Swings)':                      'Kettlebell-Schwingen',
  'Box Jumps':                                          'Box-Sprünge',
  'Battle Ropes':                                       'Battle Ropes',
  'Sled Push':                                          'Schlittenschieben',

  // Cardio / recovery
  'Light stretching':                                   'Leichtes Dehnen',
  '20 min easy walk':                                   '20 Min. lockerer Spaziergang',
  '20-30 min walk':                                     '20–30 Min. Spaziergang',
  '20-30 min brisk walk or light jog':                  '20–30 Min. zügiges Gehen oder leichtes Joggen',
  '30 min walk':                                        '30 Min. Spaziergang',
  '30min walk':                                         '30 Min. Spaziergang',
  '30 min walk or easy bike ride':                      '30 Min. Spaziergang oder leichtes Radfahren',
  '45 min walk':                                        '45 Min. Spaziergang',
  '45min brisk walk or easy cycle (LISS — Low-Intensity Steady State)': '45 Min. zügiges Gehen oder leichtes Radfahren (LISS)',
  '60min brisk walk or light jog':                      '60 Min. zügiges Gehen oder leichter Lauf',
  '30-45min jog or bike':                               '30–45 Min. Laufen oder Radfahren',
  '30min jogging':                                      '30 Min. Joggen',
  'Foam rolling (roll muscles to reduce soreness)':     'Faszienrolle (Muskeln ausrollen gegen Muskelkater)',
  'Foam rolling (helps recovery)':                      'Faszienrolle (unterstützt die Regeneration)',
  'Foam rolling':                                       'Faszienrolle',
  'Stretching':                                         'Dehnen',
  'Yoga or stretching':                                 'Yoga oder Dehnen',
  'Hip flexor stretch (loosens tight hips from sitting)': 'Hüftbeuger-Dehnung (lockert verspannte Hüften)',
  'Full rest':                                          'Voller Ruhetag',
  'Full rest day':                                      'Voller Ruhetag',
  'Rest day':                                           'Ruhetag',
  'Optional: 30 min walk':                              'Optional: 30 Min. Spaziergang',
  'Optional light cardio':                              'Optionales leichtes Cardio',
  'Optional 45min walk or bike ride':                   'Optional: 45 Min. Spaziergang oder Radfahren',
  'Active recovery — light movement, stretching':       'Aktive Erholung — leichte Bewegung, Dehnen',
  'Tip: prep your meals for the week':                  'Tipp: Mahlzeiten für die Woche vorbereiten',
  'Warm up 5min':                                       '5 Min. Aufwärmen',
  'Cool down 5min':                                     '5 Min. Abkühlen',
  'Cool down 10min':                                    '10 Min. Abkühlen',
  'Cool down':                                          'Abkühlen',
  'Lat Pulldown 3x10 (pull cable down to work your back)': 'Latziehen (Kabel nach unten ziehen, Rücken trainieren)',
  'HIIT (fast bursts) 15min':                           'HIIT (schnelle Intervalle) 15 Min.',
  'HIIT (High-Intensity Intervals) 20min':              'HIIT (hochintensive Intervalle) 20 Min.',
  '5 exercises x 3 rounds circuit':                     '5 Übungen × 3 Runden Zirkel',
  'Core work':                                          'Core-Training',
  'Core Work 3x':                                       'Core-Training 3 Runden',
  'Core Circuit 3x':                                    'Core-Zirkel 3 Runden',
  'Core circuit 3x':                                    'Core-Zirkel 3 Runden',
  'Ab Circuit':                                         'Bauch-Zirkel',
  'Ab circuit':                                         'Bauch-Zirkel',
  'Rows':                                               'Rudern',
  'Jumping Jacks':                                      'Hampelmänner',
  'High Knees':                                         'Knie heben',
  'Crunches':                                           'Crunches',
  'Russian Twists':                                     'Russian Twists',
  'Leg Raises':                                         'Beinheben',
  'Hanging Leg Raises':                                 'Hängendes Beinheben',
};

// ── Public helpers ────────────────────────────────────────────────────────────

/** Translate a weekday or day-name string. Falls back to the original. */
export function translateDayName(text: string, lang: Lang): string {
  if (lang === 'en' || !text) return text;
  return WEEKDAY_DE[text] ?? text;
}

/** Translate a focus string. Falls back to the original. */
export function translateFocus(text: string, lang: Lang): string {
  if (lang === 'en' || !text) return text;
  return FOCUS_DE[text] ?? text;
}

/** Translate an exercise name. Falls back to the original. */
export function translateExercise(text: string, lang: Lang): string {
  if (lang === 'en' || !text) return text;
  return EXERCISE_DE[text] ?? text;
}

/** Translate the "rest" label that follows a rest duration (e.g. "60s rest"). */
export function translateRest(lang: Lang): string {
  return lang === 'de' ? 'Pause' : 'rest';
}
