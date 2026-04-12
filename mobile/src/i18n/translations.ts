// File encoding: UTF-8
// German umlauts (ä ö ü Ä Ö Ü ß) and all other non-ASCII characters are
// stored as UTF-8 literals.  The Metro bundler + Hermes/JSC engine convert
// them to UTF-16 code units at runtime — no manual escaping required.

export type Lang = 'en' | 'de';

const t = {
  en: {
    // ── Tabs ──────────────────────────────────────────────────────────
    tab_home:     'Home',
    tab_plans:    'My Plans',
    tab_track:    'Track',
    tab_profile:  'Profile',

    // ── Welcome ───────────────────────────────────────────────────────
    welcome_brand:    'KYROO',
    welcome_h1a:      'The',
    welcome_h1b:      'Coach',
    welcome_h1c:      'in Your Pocket',
    welcome_sub:      'AI-powered fitness plans built entirely around you. Your goals. Your pace. Your results.',
    welcome_cta:      'Get Started',
    welcome_login:    'I already have an account',

    // ── Login ─────────────────────────────────────────────────────────
    login_title:      'Welcome back',
    login_divider:    'Sign in with email',
    login_email:      'Email Address',
    login_password:   'Password',
    login_forgot:     'Forgot password?',
    login_submit:     'Login',
    login_loading:    'Logging in…',
    login_apple:      'Continue with Apple',
    login_google:     'Continue with Google',
    login_footer:     "Don't have an account?",
    login_register:   'Register here',

    // ── Register ──────────────────────────────────────────────────────
    register_title:   'Sign Up',
    register_divider: 'With a mail address',
    register_email:   'Email Address',
    register_password:'Password',
    register_ph_pass: 'Choose a password (min. 6 chars)',
    register_submit:  'Continue',
    register_loading: 'Creating account…',
    register_legal:   "By continuing, you agree to Kyroo's Privacy Policy and Terms and Conditions",
    register_apple:   'Continue with Apple',
    register_google:  'Continue with Google',
    register_footer:  'Already have an account?',
    register_login:   'Login',

    // ── Reset ─────────────────────────────────────────────────────────
    reset_title:      'Reset',
    reset_accent:     'Password',
    reset_sub:        "Enter your email and we'll send you a link to reset your password.",
    reset_label:      'Email Address',
    reset_ph:         'your@email.com',
    reset_submit:     'Send Reset Link',
    reset_loading:    'Sending…',
    reset_sent_title: 'Check your',
    reset_sent_accent:'inbox',
    reset_sent_sub:   "We've sent a password reset link to your email.",
    reset_sent_back:  'Back to Login',

    // ── Home ──────────────────────────────────────────────────────────
    home_morning:     'Good morning',
    home_afternoon:   'Good afternoon',
    home_evening:     'Good evening',
    home_streak:      'day streak',
    home_today_label: "TODAY'S WORKOUT",
    home_view_prog:   'View Full Program',
    home_no_prog:     'No active program',
    home_no_prog_sub: 'Browse plans to get started',
    home_mood_label:  'HOW ARE YOU FEELING?',
    home_habits_label:'DAILY HABITS',
    home_headline_1:  'Kyroo ',
    home_headline_2:  'helps you',
    home_headline_3:  ' in many\nways',
    home_choose_plan: 'Choose your plan',
    home_todays:      "Today's ",
    home_workout:     'workout',

    // ── Plans ─────────────────────────────────────────────────────────
    plans_title:      'Training',
    plans_accent:     'Plans',
    plans_sub:        'Find the perfect program for your goals',
    plans_filter_all:         'All',
    plans_filter_hypertrophy: 'Hypertrophy',
    plans_filter_fat_loss:    'Fat Loss',
    plans_filter_beginner:    'Beginner',
    plans_filter_no_gym:      'No Gym',
    plans_weeks:      'weeks',
    plans_per_week:   '×/week',
    plans_empty:      'No plans found',
    plan_start:       'Create This Plan',
    plan_overview:    'PROGRAM OVERVIEW',
    plan_needs:       "WHAT YOU'LL NEED",
    plan_gym:         'Access to a gym with free weights and machines',
    plan_no_gym:      'No equipment needed — bodyweight only',

    // ── Tracking ──────────────────────────────────────────────────────
    track_title:      'Daily',
    track_accent:     'Check-in',
    track_streak:     'Day Streak 🔥',
    track_habits_done:'Habits Done',
    track_progress:   "TODAY'S PROGRESS",
    track_mood_label: 'HOW ARE YOU FEELING TODAY?',
    track_habits:     'HABITS',
    track_workout:    "TODAY'S WORKOUT",
    mood_exhausted:   'Exhausted',
    mood_meh:         'Meh',
    mood_good:        'Good',
    mood_great:       'Great',
    mood_fire:        'On fire',

    // ── Profile ───────────────────────────────────────────────────────
    profile_tap_name:   'Tap to add name',
    profile_save:       'Save',
    profile_account:    'ACCOUNT',
    profile_email:      'Email',
    profile_plan:       'Plan',
    profile_plan_pro:   'Kyroo Pro',
    profile_plan_free:  'Free',
    profile_notif:      'Notifications',
    profile_privacy:    'Privacy & Security',
    profile_support:    'SUPPORT',
    profile_help:       'Help & FAQ',
    profile_terms:      'Terms & Privacy',
    profile_language:   'Language',
    profile_lang_en:    'English',
    profile_lang_de:    'Deutsch',
    profile_logout:     'Log Out',
    profile_logout_msg: 'Are you sure you want to log out?',
    profile_cancel:     'Cancel',
    profile_workouts:   'Workouts',
    profile_streak:     'Streak 🔥',
    profile_plans:      'Plans',
    profile_programs:   'My Programs',
    profile_programs_empty: 'No programs yet. Browse plans to get started.',
    profile_version:    'Kyroo v1.0',

    // ── Form ──────────────────────────────────────────────────────────
    form_question:    'Question',
    form_of:          'of',
    form_back:        'Back',
    form_next:        'Next',
    form_build:       'Build My Plan',
    form_building:    'Building…',

    // ── Generating ────────────────────────────────────────────────────
    generating_headline: 'Building Your\nProgram',
    generating_messages: [
      'Analysing your goals…',
      'Designing your program…',
      'Scheduling your workouts…',
      'Adding progressive overload…',
      'Finalising your plan…',
    ],

    // ── Program ───────────────────────────────────────────────────────
    program_label:     'YOUR PROGRAM',
    program_schedule:  'WORKOUT SCHEDULE',
    program_rest:      'Rest day — recovery & mobility',
    program_go_home:   'Go to Home',
    program_no_prog:   'No program yet',
    program_no_sub:    'Complete the questionnaire to build your plan',
    program_browse:    'Browse Plans',
    program_weeks:     'weeks',
    program_per_week:  '×/week',
    program_sessions:  'days total',
    program_week_label:'Week',
    program_of_label:  'of',
    program_activate:  'Start Now',
    program_resume:    'Resume',
    program_view:      'View',
    program_mark_done: 'Mark Done',
    status_active:     'ACTIVE',
    status_queued:     'QUEUED',
    status_paused:     'PAUSED',
    status_completed:  'DONE',

    // ── Help & FAQ ─────────────────────────────────────────────────────
    help_title:        'Help &',
    help_accent:       'FAQ',
    help_sub:          'Everything you need to know about Kyroo',
    help_support:      'Still need help? Email us at',
    help_email:        'support@kyroo.app',

    // ── Terms & Privacy ────────────────────────────────────────────────
    terms_title:       'Terms &',
    terms_accent:      'Privacy',
    terms_last_updated:'Last updated: January 2025',

    // ── Privacy & Security ─────────────────────────────────────────────
    psec_title:        'Privacy &',
    psec_accent:       'Security',
    psec_pw_section:   'CHANGE PASSWORD',
    psec_pw_current:   'Current password',
    psec_pw_new:       'New password',
    psec_pw_confirm:   'Confirm new password',
    psec_pw_save:      'Update Password',
    psec_pw_mismatch:  'New passwords do not match',
    psec_pw_short:     'Password must be at least 6 characters',
    psec_pw_success:   'Password updated successfully',
    psec_data_section: 'YOUR DATA',
    psec_delete:       'Delete Account',
    psec_delete_msg:   'This will permanently delete your account and all data. This cannot be undone.',
    psec_delete_confirm:'Type DELETE to confirm',
    psec_delete_done:  'Account deleted',

    // ── Logout ──────────────────────────────────────────────────────────
    logout_title:      'Log Out',
    logout_msg:        'You\'ll need to sign in again to access your account.',

    // ── Form questions — keys shared across categories ─────────────────
    fq_days:   'How many days a week can you work out?',
    fq_mins:   'How long can each session be?',
    fq_commit: 'How serious are you about sticking to this? 🔥',
    fq_commit_hint: '1 = just curious, 10 = nothing will stop me',
    fq_injuries:    'Any pain or injuries we should avoid? 🩹',
    fq_inj_none:    '✅ None — I\'m good to go',
    fq_inj_back:    '🔙 Lower back pain',
    fq_inj_knee:    '🦵 Knee pain',
    fq_inj_shoulder:'💪 Shoulder pain',
    fq_inj_other:   '❓ Something else',
    fq_equipment:   'What do you have to work out with? 🏠',
    fq_eq_full:     '🏢 Full gym — I have access to a gym',
    fq_eq_home:     '🏠 Home gym — I have weights at home',
    fq_eq_dumbbells:'🪆 Just dumbbells — a few weights only',
    fq_eq_none:     '🙌 Nothing — bodyweight only',

    // ── Plan names (keyed by category) ───────────────────────────────────
    plan_name_FAT_LOSS:      'Burn Fat & Slim Down',
    plan_name_HYPERTROPHY:   'Build Muscle & Strength',
    plan_name_TRANSFORMATION:'90-Day Body Challenge',
    plan_name_FIRST_STEPS:   'Perfect Start for Beginners',
    plan_name_NO_GYM:        'Home Workout — No Gym Needed',
    plan_name_POOL:          'Swim Fit Program',
    plan_name_RACE_READY:    'Hyrox Race Prep',
    plan_name_HALF_OR_FULL:  'Run a Marathon',
    plan_name_FUNCTIONAL:    'CrossFit-Style Training',
    plan_name_HIGH_INTENSITY:'HIIT Cardio Blast',

    // ── Plan descriptions (keyed by category) ────────────────────────────
    plan_desc_FAT_LOSS:      'Lose body fat by moving more and eating smarter. A mix of cardio (heart-pumping exercise) and strength (lifting) sessions done at your own pace.',
    plan_desc_HYPERTROPHY:   'Get bigger and stronger over 16 weeks. You will gradually lift heavier weights each week — this is called progressive overload (doing a little more each time so your muscles grow).',
    plan_desc_TRANSFORMATION:'A 3-month (90-day) plan split into three phases. Each phase gets harder. You will hit milestones (mini-goals) along the way to keep you motivated.',
    plan_desc_FIRST_STEPS:   'Never worked out before? No worries. You will learn the 5 key moves that every fit person knows. After 8 weeks you will feel confident walking into any gym.',
    plan_desc_NO_GYM:        'Train anywhere using just your bodyweight — no equipment at all. Every week gets a little harder. Perfect for home, travel, or small spaces.',
    plan_desc_POOL:          'Structured pool sessions with a warm-up (easy start), drills (practice moves), main set (hard work), and cool-down (easy finish). Great for all swim levels.',
    plan_desc_RACE_READY:    'Hyrox is a fitness race — 8 km (5 miles) of running broken up by 8 exercise stations. This plan builds your fitness and teaches you the race format step by step.',
    plan_desc_HALF_OR_FULL:  'Train for a half marathon (21 km / 13 miles) or full marathon (42 km / 26 miles). Includes long runs, tempo runs (comfortably hard pace), and a taper (easy week before race day).',
    plan_desc_FUNCTIONAL:    'CrossFit (CF) mixes weightlifting, gymnastics, and fast cardio workouts called WODs (Workout of the Day). Every session is different and includes both easy (scaled) and hard (Rx) options.',
    plan_desc_HIGH_INTENSITY:'HIIT stands for High-Intensity Interval Training — short bursts of hard effort followed by rest. Burns lots of calories in less time. Every session uses a different fun format.',

    // ── Plan program overviews (keyed by category) ───────────────────────
    plan_detail_FAT_LOSS:
      '10 weeks of fat-burning training, built in 3 progressive phases.\n\n' +
      '• Weeks 1–3 — build the habit with steady cardio and basic strength\n' +
      '• Weeks 4–7 — ramp up intensity with interval sessions\n' +
      '• Weeks 8–10 — maximum effort for visible results\n\n' +
      '4 days per week · active rest on off days',

    plan_detail_HYPERTROPHY:
      '16 weeks to build real muscle using progressive overload.\n\n' +
      '• Weeks 1–4 — learn the fundamental lifts\n' +
      '• Weeks 5–8 — add volume and intensity\n' +
      '• Weeks 9–12 — push past your personal records\n' +
      '• Weeks 13–16 — peak strength and size\n\n' +
      '5 days per week · Push / Pull / Legs split',

    plan_detail_TRANSFORMATION:
      '13 weeks of total-body transformation in 3 phases.\n\n' +
      '• Phase 1 (weeks 1–4) — build your base: cardio + strength\n' +
      '• Phase 2 (weeks 5–9) — combine fat loss with muscle gain\n' +
      '• Phase 3 (weeks 10–13) — intense sessions for maximum definition\n\n' +
      '4 training days per week',

    plan_detail_FIRST_STEPS:
      '8 weeks designed for complete beginners — build lasting habits.\n\n' +
      '• Weeks 1–2 — learn proper form on 5 key exercises\n' +
      '• Weeks 3–4 — add reps and duration\n' +
      '• Weeks 5–6 — introduce light weights and resistance\n' +
      '• Weeks 7–8 — combine everything into a full routine\n\n' +
      '3 short sessions per week · easy to start, hard to quit',

    plan_detail_NO_GYM:
      '6 weeks of bodyweight-only training — zero equipment needed.\n\n' +
      '• Weeks 1–2 — master the basics (push-ups, squats, planks)\n' +
      '• Weeks 3–4 — add variations and increase reps\n' +
      '• Weeks 5–6 — advanced circuits for maximum burn\n\n' +
      '4 sessions per week · 15–45 minutes each',

    plan_detail_POOL:
      '12 weeks of structured pool training for every ability.\n\n' +
      '• Weeks 1–3 — build base endurance and refine your stroke\n' +
      '• Weeks 4–7 — interval sets (swim fast → rest → repeat)\n' +
      '• Weeks 8–10 — longer distances and mixed strokes\n' +
      '• Weeks 11–12 — peak fitness, go for personal bests\n\n' +
      '3 pool sessions per week',

    plan_detail_RACE_READY:
      '12 weeks of Hyrox race-specific preparation.\n\n' +
      '• Weeks 1–3 — aerobic base and learn all 8 stations\n' +
      '• Weeks 4–7 — running + stations combined, build race pace\n' +
      '• Weeks 8–10 — full race simulations at high intensity\n' +
      '• Weeks 11–12 — taper and race strategy\n\n' +
      '5 sessions per week',

    plan_detail_HALF_OR_FULL:
      '20 weeks of progressive marathon training.\n\n' +
      '• Weeks 1–5 — build weekly mileage gradually\n' +
      '• Weeks 6–12 — tempo runs and long-run progression\n' +
      '• Weeks 13–17 — peak mileage, your hardest block\n' +
      '• Weeks 18–19 — taper: reduce volume, stay sharp\n' +
      '• Week 20 — race week\n\n' +
      '4 runs per week · one long run',

    plan_detail_FUNCTIONAL:
      '12 weeks of functional fitness in the CrossFit style.\n\n' +
      '• Weeks 1–3 — fundamentals: Olympic lifts, gymnastics, cardio\n' +
      '• Weeks 4–7 — increase load and complexity\n' +
      '• Weeks 8–10 — benchmark WODs to measure progress\n' +
      '• Weeks 11–12 — peak performance\n\n' +
      '5 sessions per week · strength + skill + met-con',

    plan_detail_HIGH_INTENSITY:
      '6 weeks of HIIT — maximum burn in minimum time.\n\n' +
      '• Weeks 1–2 — longer rest (20s work / 40s rest)\n' +
      '• Weeks 3–4 — balanced intervals (30s / 30s)\n' +
      '• Weeks 5–6 — Tabata (20s / 10s) and AMRAP circuits\n\n' +
      '4 sessions per week · 15–45 minutes each',
  },

  de: {
    // ── Tabs ──────────────────────────────────────────────────────────
    tab_home:     'Start',
    tab_plans:    'Meine Pläne',
    tab_track:    'Tracking',
    tab_profile:  'Profil',

    // ── Welcome ───────────────────────────────────────────────────────
    welcome_brand:    'KYROO',
    welcome_h1a:      'Dein',
    welcome_h1b:      'Coach',
    welcome_h1c:      'immer dabei',
    welcome_sub:      'KI-gestützte Trainingspläne, die komplett auf dich zugeschnitten sind. Deine Ziele. Dein Tempo. Deine Ergebnisse.',
    welcome_cta:      'Jetzt starten',
    welcome_login:    'Ich habe bereits ein Konto',

    // ── Login ─────────────────────────────────────────────────────────
    login_title:      'Willkommen zurück',
    login_divider:    'Mit E-Mail anmelden',
    login_email:      'E-Mail-Adresse',
    login_password:   'Passwort',
    login_forgot:     'Passwort vergessen?',
    login_submit:     'Anmelden',
    login_loading:    'Anmeldung läuft…',
    login_apple:      'Mit Apple fortfahren',
    login_google:     'Mit Google fortfahren',
    login_footer:     'Noch kein Konto?',
    login_register:   'Hier registrieren',

    // ── Register ──────────────────────────────────────────────────────
    register_title:   'Konto erstellen',
    register_divider: 'Mit E-Mail-Adresse',
    register_email:   'E-Mail-Adresse',
    register_password:'Passwort',
    register_ph_pass: 'Passwort wählen (mind. 6 Zeichen)',
    register_submit:  'Weiter',
    register_loading: 'Konto wird erstellt…',
    register_legal:   'Mit dem Fortfahren stimmst du Kyroos Datenschutzrichtlinie und den Nutzungsbedingungen zu.',
    register_apple:   'Mit Apple fortfahren',
    register_google:  'Mit Google fortfahren',
    register_footer:  'Bereits ein Konto?',
    register_login:   'Anmelden',

    // ── Reset ─────────────────────────────────────────────────────────
    reset_title:      'Passwort',
    reset_accent:     'zurücksetzen',
    reset_sub:        'Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen.',
    reset_label:      'E-Mail-Adresse',
    reset_ph:         'deine@email.de',
    reset_submit:     'Link senden',
    reset_loading:    'Wird gesendet…',
    reset_sent_title: 'Sieh in dein',
    reset_sent_accent:'Postfach',
    reset_sent_sub:   'Wir haben dir einen Link zum Zurücksetzen deines Passworts gesendet.',
    reset_sent_back:  'Zurück zur Anmeldung',

    // ── Home ──────────────────────────────────────────────────────────
    home_morning:     'Guten Morgen',
    home_afternoon:   'Guten Nachmittag',
    home_evening:     'Guten Abend',
    home_streak:      'Tage am Stück',
    home_today_label: 'HEUTIGES TRAINING',
    home_view_prog:   'Gesamtprogramm ansehen',
    home_no_prog:     'Kein aktives Programm',
    home_no_prog_sub: 'Wähle einen Plan, um zu starten',
    home_mood_label:  'WIE FÜHLST DU DICH?',
    home_habits_label:'TÄGLICHE GEWOHNHEITEN',
    home_headline_1:  'Kyroo ',
    home_headline_2:  'hilft dir',
    home_headline_3:  ' auf vielen\nWegen',
    home_choose_plan: 'Wähle deinen Plan',
    home_todays:      'Heutiges ',
    home_workout:     'Training',

    // ── Plans ─────────────────────────────────────────────────────────
    plans_title:      'Trainings-',
    plans_accent:     'Pläne',
    plans_sub:        'Finde das perfekte Programm für deine Ziele',
    plans_filter_all:         'Alle',
    plans_filter_hypertrophy: 'Hypertrophie',
    plans_filter_fat_loss:    'Fettabbau',
    plans_filter_beginner:    'Anfänger',
    plans_filter_no_gym:      'Ohne Gym',
    plans_weeks:      'Wochen',
    plans_per_week:   '×/Woche',
    plans_empty:      'Keine Pläne gefunden',
    plan_start:       'Diesen Plan erstellen',
    plan_overview:    'PROGRAMMÜBERSICHT',
    plan_needs:       'WAS DU BRAUCHST',
    plan_gym:         'Zugang zu einem Fitnessstudio mit Geräten und freien Gewichten',
    plan_no_gym:      'Kein Equipment nötig — nur dein Körpergewicht',

    // ── Tracking ──────────────────────────────────────────────────────
    track_title:      'Tägliches',
    track_accent:     'Check-in',
    track_streak:     'Tage am Stück 🔥',
    track_habits_done:'Gewohnheiten erledigt',
    track_progress:   'HEUTIGER FORTSCHRITT',
    track_mood_label: 'WIE FÜHLST DU DICH HEUTE?',
    track_habits:     'GEWOHNHEITEN',
    track_workout:    'HEUTIGES TRAINING',
    mood_exhausted:   'Erschöpft',
    mood_meh:         'Naja',
    mood_good:        'Gut',
    mood_great:       'Super',
    mood_fire:        'Top-Form',

    // ── Profile ───────────────────────────────────────────────────────
    profile_tap_name:   'Tippe um Namen hinzuzufügen',
    profile_save:       'Speichern',
    profile_account:    'KONTO',
    profile_email:      'E-Mail',
    profile_plan:       'Plan',
    profile_plan_pro:   'Kyroo Pro',
    profile_plan_free:  'Kostenlos',
    profile_notif:      'Benachrichtigungen',
    profile_privacy:    'Datenschutz & Sicherheit',
    profile_support:    'SUPPORT',
    profile_help:       'Hilfe & FAQ',
    profile_terms:      'Nutzungsbedingungen & Datenschutz',
    profile_language:   'Sprache',
    profile_lang_en:    'English',
    profile_lang_de:    'Deutsch',
    profile_logout:     'Abmelden',
    profile_logout_msg: 'Möchtest du dich wirklich abmelden?',
    profile_cancel:     'Abbrechen',
    profile_workouts:   'Trainings',
    profile_streak:     'Serie 🔥',
    profile_plans:      'Pläne',
    profile_programs:   'Meine Programme',
    profile_programs_empty: 'Noch keine Programme. Stöbere in den Plänen.',
    profile_version:    'Kyroo v1.0',

    // ── Form ──────────────────────────────────────────────────────────
    form_question:    'Frage',
    form_of:          'von',
    form_back:        'Zurück',
    form_next:        'Weiter',
    form_build:       'Meinen Plan erstellen',
    form_building:    'Wird erstellt…',

    // ── Generating ────────────────────────────────────────────────────
    generating_headline: 'Dein Programm\nwird erstellt',
    generating_messages: [
      'Deine Ziele werden analysiert…',
      'Dein Programm wird gestaltet…',
      'Deine Trainingseinheiten werden eingeplant…',
      'Progressive Überlastung (mehr Gewicht jede Woche) wird hinzugefügt…',
      'Dein Plan wird abgeschlossen…',
    ],

    // ── Program ───────────────────────────────────────────────────────
    program_label:     'DEIN PROGRAMM',
    program_schedule:  'TRAININGSPLAN',
    program_rest:      'Ruhetag — Erholung & Mobilität',
    program_go_home:   'Zur Startseite',
    program_no_prog:   'Noch kein Programm',
    program_no_sub:    'Fülle den Fragebogen aus, um deinen Plan zu erstellen',
    program_browse:    'Pläne durchsuchen',
    program_weeks:     'Wochen',
    program_per_week:  '×/Woche',
    program_sessions:  'Einheiten gesamt',
    program_week_label:'Woche',
    program_of_label:  'von',
    program_activate:  'Starten',
    program_resume:    'Fortsetzen',
    program_view:      'Ansehen',
    program_mark_done: 'Als fertig markieren',
    status_active:     'AKTIV',
    status_queued:     'WARTEND',
    status_paused:     'PAUSIERT',
    status_completed:  'FERTIG',

    // ── Help & FAQ ─────────────────────────────────────────────────────
    help_title:        'Hilfe &',
    help_accent:       'FAQ',
    help_sub:          'Alles, was du über Kyroo wissen musst',
    help_support:      'Noch Fragen? Schreib uns an',
    help_email:        'support@kyroo.app',

    // ── Terms & Privacy ────────────────────────────────────────────────
    terms_title:       'Nutzungs-',
    terms_accent:      'bedingungen',
    terms_last_updated:'Zuletzt aktualisiert: Januar 2025',

    // ── Privacy & Security ─────────────────────────────────────────────
    psec_title:        'Datenschutz &',
    psec_accent:       'Sicherheit',
    psec_pw_section:   'PASSWORT ÄNDERN',
    psec_pw_current:   'Aktuelles Passwort',
    psec_pw_new:       'Neues Passwort',
    psec_pw_confirm:   'Neues Passwort bestätigen',
    psec_pw_save:      'Passwort aktualisieren',
    psec_pw_mismatch:  'Die neuen Passwörter stimmen nicht überein',
    psec_pw_short:     'Das Passwort muss mindestens 6 Zeichen lang sein',
    psec_pw_success:   'Passwort erfolgreich aktualisiert',
    psec_data_section: 'DEINE DATEN',
    psec_delete:       'Konto löschen',
    psec_delete_msg:   'Dadurch wird dein Konto und alle Daten dauerhaft gelöscht. Dies kann nicht rückgängig gemacht werden.',
    psec_delete_confirm:'Tippe LÖSCHEN zur Bestätigung',
    psec_delete_done:  'Konto gelöscht',

    // ── Logout ──────────────────────────────────────────────────────────
    logout_title:      'Abmelden',
    logout_msg:        'Du musst dich erneut anmelden, um auf dein Konto zuzugreifen.',

    // ── Form questions — shared keys ──────────────────────────────────
    fq_days:   'Wie viele Tage pro Woche kannst du trainieren?',
    fq_mins:   'Wie lange kann jede Trainingseinheit sein?',
    fq_commit: 'Wie ernst nimmst du das Ganze? 🔥',
    fq_commit_hint: '1 = nur neugierig, 10 = nichts kann mich aufhalten',
    fq_injuries:    'Hast du Schmerzen oder Verletzungen, die wir beachten sollen? 🩹',
    fq_inj_none:    '✅ Keine — ich bin fit und gesund',
    fq_inj_back:    '🔙 Rückenschmerzen',
    fq_inj_knee:    '🦵 Knieschmerzen',
    fq_inj_shoulder:'💪 Schulterschmerzen',
    fq_inj_other:   '❓ Etwas anderes',
    fq_equipment:   'Was hast du zum Trainieren? 🏠',
    fq_eq_full:     '🏢 Fitnessstudio — ich habe Zugang zu einem Gym',
    fq_eq_home:     '🏠 Heimtraining — ich habe Gewichte zu Hause',
    fq_eq_dumbbells:'🪆 Nur Kurzhanteln (Dumbbells)',
    fq_eq_none:     '🙌 Nichts — nur mein Körpergewicht',

    // ── Plannamen (nach Kategorie) ────────────────────────────────────────
    plan_name_FAT_LOSS:      'Fett verbrennen & schlanker werden',
    plan_name_HYPERTROPHY:   'Muskeln aufbauen & stärker werden',
    plan_name_TRANSFORMATION:'90-Tage Body-Challenge',
    plan_name_FIRST_STEPS:   'Perfekter Einstieg für Anfänger',
    plan_name_NO_GYM:        'Home-Workout — kein Gym nötig',
    plan_name_POOL:          'Schwimm-Fit-Programm',
    plan_name_RACE_READY:    'Hyrox Wettkampfvorbereitung',
    plan_name_HALF_OR_FULL:  'Marathon laufen',
    plan_name_FUNCTIONAL:    'CrossFit-Style Training',
    plan_name_HIGH_INTENSITY:'HIIT Cardio Blast',

    // ── Planbeschreibungen (nach Kategorie) ──────────────────────────────
    plan_desc_FAT_LOSS:      'Körperfett abbauen durch mehr Bewegung und cleveres Essen. Eine Mischung aus Cardio- (Herztraining) und Krafteinheiten (Gewichtheben) — in deinem eigenen Tempo.',
    plan_desc_HYPERTROPHY:   'Größer und stärker werden in 16 Wochen. Du steigerst das Gewicht Woche für Woche — das nennt sich Progressive Überlastung (Progressives Overload) — damit deine Muskeln kontinuierlich wachsen.',
    plan_desc_TRANSFORMATION:'Ein 90-Tage-Plan in drei Phasen. Jede Phase wird anspruchsvoller. Unterwegs erreichst du Meilensteine (Mini-Ziele), die dich motiviert halten.',
    plan_desc_FIRST_STEPS:   'Noch nie trainiert? Kein Problem. Du lernst die 5 wichtigsten Grundübungen, die jeder fitte Mensch kennt. Nach 8 Wochen betrittst du selbstbewusst jedes Fitnessstudio.',
    plan_desc_NO_GYM:        'Trainiere überall nur mit deinem Körpergewicht — ohne jegliches Equipment. Jede Woche wird etwas anspruchsvoller. Perfekt für zu Hause, auf Reisen oder auf kleinstem Raum.',
    plan_desc_POOL:          'Strukturierte Pool-Einheiten mit Warm-up (leichter Einstieg), Drills (Technikübungen), Hauptteil (intensive Arbeit) und Cool-down (entspannter Ausklang). Für alle Schwimmniveaus geeignet.',
    plan_desc_RACE_READY:    'Hyrox ist ein Fitness-Wettkampf — 8 km Laufen aufgeteilt durch 8 Übungsstationen. Dieser Plan steigert deine Ausdauer und erklärt das Rennformat Schritt für Schritt.',
    plan_desc_HALF_OR_FULL:  'Training für einen Halbmarathon (21 km) oder Marathon (42 km). Mit langen Läufen, Tempo-Runs (angenehm hartes Tempo) und einem Taper (leichte Woche vor dem Renntag).',
    plan_desc_FUNCTIONAL:    'CrossFit (CF) kombiniert Gewichtheben, Turnen und schnelle Cardio-Einheiten — sogenannte WODs (Workout of the Day). Jede Einheit ist anders und bietet eine leichtere (Scaled) sowie eine volle (Rx) Option.',
    plan_desc_HIGH_INTENSITY:'HIIT steht für High-Intensity Interval Training — kurze intensive Belastungsphasen gefolgt von Erholung. Verbrennt viele Kalorien in kurzer Zeit. Jede Einheit hat ein anderes Format.',

    // ── Programmübersichten (nach Kategorie) ─────────────────────────────
    plan_detail_FAT_LOSS:
      '10 Wochen Fettverbrennung in 3 progressiven Phasen.\n\n' +
      '• Wochen 1–3 — Gewohnheit aufbauen mit Cardio und Grundkraft\n' +
      '• Wochen 4–7 — Intensität mit Intervallen steigern\n' +
      '• Wochen 8–10 — volle Leistung für sichtbare Ergebnisse\n\n' +
      '4 Tage pro Woche · aktive Erholung an Ruhetagen',

    plan_detail_HYPERTROPHY:
      '16 Wochen Muskelaufbau mit progressivem Overload.\n\n' +
      '• Wochen 1–4 — Grundübungen erlernen\n' +
      '• Wochen 5–8 — Volumen und Intensität steigern\n' +
      '• Wochen 9–12 — persönliche Bestwerte übertreffen\n' +
      '• Wochen 13–16 — maximale Kraft und Masse\n\n' +
      '5 Tage pro Woche · Push / Pull / Beine',

    plan_detail_TRANSFORMATION:
      '13 Wochen Gesamtverwandlung in 3 Phasen.\n\n' +
      '• Phase 1 (Wochen 1–4) — Basis aufbauen: Cardio + Kraft\n' +
      '• Phase 2 (Wochen 5–9) — Fettabbau + Muskelaufbau kombinieren\n' +
      '• Phase 3 (Wochen 10–13) — intensive Einheiten für Definition\n\n' +
      '4 Trainingstage pro Woche',

    plan_detail_FIRST_STEPS:
      '8 Wochen für absolute Anfänger — baue nachhaltige Gewohnheiten auf.\n\n' +
      '• Wochen 1–2 — 5 Grundübungen korrekt lernen\n' +
      '• Wochen 3–4 — Wiederholungen und Dauer steigern\n' +
      '• Wochen 5–6 — leichte Gewichte einführen\n' +
      '• Wochen 7–8 — alles zu einer vollständigen Routine verbinden\n\n' +
      '3 kurze Einheiten pro Woche · machbar und motivierend',

    plan_detail_NO_GYM:
      '6 Wochen Körpergewichtstraining — kein Equipment nötig.\n\n' +
      '• Wochen 1–2 — Grundübungen meistern (Liegestütze, Squats, Planks)\n' +
      '• Wochen 3–4 — Variationen und mehr Wiederholungen\n' +
      '• Wochen 5–6 — fortgeschrittene Circuits für maximale Intensität\n\n' +
      '4 Einheiten pro Woche · je 15–45 Minuten',

    plan_detail_POOL:
      '12 Wochen strukturiertes Schwimmtraining für alle Levels.\n\n' +
      '• Wochen 1–3 — Grundausdauer aufbauen, Technik verbessern\n' +
      '• Wochen 4–7 — Intervallsätze (schnell schwimmen → Pause → wiederholen)\n' +
      '• Wochen 8–10 — längere Distanzen, gemischte Stile\n' +
      '• Wochen 11–12 — Bestform, persönliche Bestzeiten\n\n' +
      '3 Pool-Einheiten pro Woche',

    plan_detail_RACE_READY:
      '12 Wochen wettkampfspezifische Hyrox-Vorbereitung.\n\n' +
      '• Wochen 1–3 — aerobe Basis und alle 8 Stationen kennenlernen\n' +
      '• Wochen 4–7 — Laufen + Stationen kombinieren, Renntempo aufbauen\n' +
      '• Wochen 8–10 — vollständige Rennsimulationen\n' +
      '• Wochen 11–12 — Taper und Rennstrategie\n\n' +
      '5 Einheiten pro Woche',

    plan_detail_HALF_OR_FULL:
      '20 Wochen progressives Marathon-Training.\n\n' +
      '• Wochen 1–5 — Wochenkilometer schrittweise steigern\n' +
      '• Wochen 6–12 — Tempo-Läufe und lange Läufe ausbauen\n' +
      '• Wochen 13–17 — Höchstkilometer, deine härteste Phase\n' +
      '• Wochen 18–19 — Taper: Volumen runter, Form halten\n' +
      '• Woche 20 — Rennwoche\n\n' +
      '4 Läufe pro Woche · ein langer Lauf',

    plan_detail_FUNCTIONAL:
      '12 Wochen funktionelles Training im CrossFit-Stil.\n\n' +
      '• Wochen 1–3 — Grundlagen: Olympisches Heben, Turnen, Cardio\n' +
      '• Wochen 4–7 — Last und Komplexität steigern\n' +
      '• Wochen 8–10 — Benchmark-WODs zur Fortschrittsmessung\n' +
      '• Wochen 11–12 — Spitzenleistung\n\n' +
      '5 Einheiten pro Woche · Kraft + Technik + Met-Con',

    plan_detail_HIGH_INTENSITY:
      '6 Wochen HIIT — maximale Wirkung in minimaler Zeit.\n\n' +
      '• Wochen 1–2 — längere Pausen (20 Sek. Arbeit / 40 Sek. Pause)\n' +
      '• Wochen 3–4 — ausgeglichene Intervalle (30 / 30)\n' +
      '• Wochen 5–6 — Tabata (20 / 10) und AMRAP-Circuits\n\n' +
      '4 Einheiten pro Woche · je 15–45 Minuten',
  },
} as const;

export type TKey = keyof typeof t.en;
export default t;
