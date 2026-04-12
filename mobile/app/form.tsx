import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { api } from '@/api';
import { colors } from '@/theme';
import { useT } from '@/i18n';

interface Step {
  key:      string;
  question: string;
  hint?:    string;
  type:     'select' | 'slider';
  options?: string[];
  min?:     number;
  max?:     number;
  unit?:    string;
}

// ── English steps ─────────────────────────────────────────────────────────────

const EN: Record<string, Step[]> = {

  'FAT LOSS': [
    { key: 'goal', question: 'Why do you want to lose fat? 🔥', type: 'select',
      options: ['❤️ I want to feel healthier', '🪞 I want to look better', '👗 I have a special event coming up', '😊 I just want more energy'] },
    { key: 'current_activity', question: 'How active are you right now? 🚶', type: 'select',
      hint: "Be honest — there's no wrong answer!",
      options: ["🛋️ Mostly sitting — I don't move much", '🚶 Light walks — I move a little', '🏃 Sometimes — I exercise now and then', '💪 Often — I work out regularly'] },
    { key: 'days_per_week', question: 'How many days a week can you work out?', type: 'slider', min: 2, max: 6, unit: ' days' },
    { key: 'session_mins',  question: 'How long can each session be?', hint: 'Even 20 minutes burns fat!', type: 'slider', min: 20, max: 60, unit: ' min' },
    { key: 'equipment', question: 'What do you have to train with? 🏋️', type: 'select',
      options: ['🏢 Full gym — I have a membership', '🏠 Home gym — I have some equipment', '🪆 Just dumbbells', '🙌 Nothing — bodyweight only'] },
    { key: 'injuries', question: 'Any pain or injuries we should avoid? 🩹', type: 'select',
      options: ["✅ None — I'm good to go", '🔙 Lower back pain', '🦵 Knee pain', '💪 Shoulder pain', '❓ Something else'] },
    { key: 'diet', question: 'How would you describe your eating habits? 🍽️', type: 'select',
      options: ['🍔 Not great — lots of takeaways', '🍞 Average — could be better', '🥗 Pretty good — mostly healthy', '💪 Very clean — I eat well'] },
    { key: 'commitment', question: 'How serious are you about this? 🔥', hint: '1 = just curious, 10 = nothing will stop me', type: 'slider', min: 1, max: 10, unit: '/10' },
  ],

  'HYPERTROPHY': [
    { key: 'muscle_goal', question: "What's your main muscle goal? 💪", type: 'select',
      options: ['🦾 Get bigger overall — more size everywhere', '⚡ Get stronger — lift heavier weights', '🔝 Focus on upper body — chest, back, arms', '🦵 Focus on legs — quads, hamstrings, glutes'] },
    { key: 'experience', question: 'How long have you been lifting weights? 🏋️', hint: 'Lifting = using dumbbells, barbells, or machines', type: 'select',
      options: ["🌱 Never — this is brand new to me", '🚶 Under 6 months — just getting started', '🏃 6 months to 2 years — I know the basics', "⚡ Over 2 years — I'm experienced"] },
    { key: 'days_per_week', question: 'How many days a week can you train?', hint: 'More days = more muscle (but rest is important too)', type: 'slider', min: 3, max: 6, unit: ' days' },
    { key: 'session_mins',  question: 'How long is each gym session?', type: 'slider', min: 30, max: 90, unit: ' min' },
    { key: 'equipment', question: 'What equipment do you have? 🏢', type: 'select',
      options: ['🏢 Full gym — barbells, machines, cables', '🏠 Home gym — dumbbells and a bench', '🪆 Dumbbells only', '🙌 Bodyweight only'] },
    { key: 'injuries', question: 'Any pain or injuries to avoid? 🩹', type: 'select',
      options: ['✅ None — fully fit', '🔙 Lower back pain', '🦵 Knee pain', '💪 Shoulder pain', '❓ Something else'] },
    { key: 'weak_spot', question: 'Which muscle group do you most want to grow? 🎯', type: 'select',
      options: ['💪 Arms — biceps and triceps', '🫁 Chest — bigger pecs', '🦋 Back — wider and thicker', '🦵 Legs — bigger quads and glutes', '⬆️ Shoulders — broader look'] },
    { key: 'commitment', question: 'How dedicated are you to the gym? 🔥', hint: '1 = casual, 10 = I live for this', type: 'slider', min: 1, max: 10, unit: '/10' },
  ],

  'TRANSFORMATION': [
    { key: 'transform_goal', question: 'What do you want to look and feel like after 90 days? 🌟', type: 'select',
      options: ['🔥 Leaner — less fat, more definition', '💪 More muscular — bigger and stronger', '⚡ Fitter — better stamina and energy', '🌈 All of the above — a total change'] },
    { key: 'current_fitness', question: 'How fit are you right now? 📊', type: 'select',
      options: ["😴 Not very — I get tired easily", '🚶 A little — I can walk but not run far', '🏃 Moderate — I exercise sometimes', '💪 Quite fit — I train regularly'] },
    { key: 'days_per_week', question: 'How many days a week can you train?', type: 'slider', min: 3, max: 6, unit: ' days' },
    { key: 'session_mins',  question: 'How long can each session be?', type: 'slider', min: 30, max: 60, unit: ' min' },
    { key: 'equipment', question: 'What do you have to work with? 🏋️', type: 'select',
      options: ['🏢 Full gym', '🏠 Home gym with weights', '🪆 Just dumbbells', '🙌 No equipment'] },
    { key: 'injuries', question: 'Any pain or injuries we should avoid? 🩹', type: 'select',
      options: ['✅ None', '🔙 Lower back', '🦵 Knees', '💪 Shoulders', '❓ Other'] },
    { key: 'diet_willing', question: 'Are you also willing to improve your eating? 🍽️', hint: 'Exercise + better food = faster results', type: 'select',
      options: ["🥗 Yes — I'll track my food and eat better", "🍞 Partly — I'll try to eat healthier", '🍔 Not yet — just the workouts for now'] },
    { key: 'commitment', question: 'On a scale of 1–10, how committed are you? 🔥', type: 'slider', min: 1, max: 10, unit: '/10' },
  ],

  'FIRST STEPS': [
    { key: 'why_start', question: 'Why do you want to start exercising? 🌱', type: 'select',
      options: ['❤️ I want to be healthier', '😊 I want more energy every day', '😰 My doctor told me to move more', '🪞 I want to feel better about myself'] },
    { key: 'tried_before', question: 'Have you tried exercising regularly before? 🤔', type: 'select',
      options: ['🚫 Never really tried', '🔄 I tried but stopped', '✅ A little here and there', '📅 I used to be active but stopped long ago'] },
    { key: 'days_per_week', question: 'How many days a week feels manageable? 😊', hint: 'Starting with 2–3 days is totally fine!', type: 'slider', min: 2, max: 4, unit: ' days' },
    { key: 'session_mins',  question: 'How long can you exercise at a time?', hint: 'Even 15 minutes is a great start', type: 'slider', min: 15, max: 45, unit: ' min' },
    { key: 'equipment', question: 'What do you have access to? 🏠', type: 'select',
      options: ['🏢 A gym nearby I can join', '🏠 Some home equipment', '🪆 Just a few dumbbells', '🙌 Nothing at all — just myself'] },
    { key: 'injuries', question: 'Any pain we should know about? 🩹', hint: 'This helps us keep you safe', type: 'select',
      options: ["✅ Nothing — I feel fine", '🔙 My lower back hurts sometimes', '🦵 My knees bother me', '💪 My shoulders are sore', '❓ I have something else'] },
    { key: 'biggest_fear', question: 'What worries you most about starting? 😬', type: 'select',
      options: ['😳 Looking silly or doing it wrong', '😓 Not being fit enough yet', '⏰ Not having enough time', '😩 Giving up after a few days'] },
    { key: 'commitment', question: 'How ready do you feel to start? 🌟', hint: "1 = not sure yet, 10 = I'm ready to go!", type: 'slider', min: 1, max: 10, unit: '/10' },
  ],

  'NO GYM': [
    { key: 'home_reason', question: 'Why are you training at home? 🏠', type: 'select',
      options: ['💸 Gym memberships cost too much', '⏰ No time to travel to a gym', '😌 I prefer privacy at home', '🌍 I travel a lot and need flexibility'] },
    { key: 'current_activity', question: 'How active are you right now? 🚶', type: 'select',
      options: ['🛋️ Very little — mostly sitting', '🚶 A little — light walks', '🏃 Sometimes — occasional workouts', '💪 Often — I exercise regularly'] },
    { key: 'days_per_week', question: 'How many days a week can you train at home?', type: 'slider', min: 2, max: 6, unit: ' days' },
    { key: 'session_mins',  question: 'How long can each home session be?', type: 'slider', min: 15, max: 60, unit: ' min' },
    { key: 'home_space', question: 'What space and equipment do you have? 🏠', type: 'select',
      options: ['🛋️ Small space, no equipment', '🪆 Small space, have dumbbells', '🏠 Good space, some equipment', '🏋️ Full home gym setup'] },
    { key: 'injuries', question: 'Any pain or injuries to avoid? 🩹', type: 'select',
      options: ['✅ None', '🔙 Lower back', '🦵 Knees', '💪 Shoulders', '❓ Other'] },
    { key: 'home_preference', question: 'What type of exercise do you enjoy most? 🎯', type: 'select',
      options: ['💪 Strength — feeling strong and building muscle', '🔥 Cardio — sweating and getting fit', '🧘 Low impact — gentle on my joints', '⚡ Mix — I like variety'] },
    { key: 'commitment', question: 'How committed are you to training at home? 🔥', type: 'slider', min: 1, max: 10, unit: '/10' },
  ],

  'POOL': [
    { key: 'swim_ability', question: 'Can you swim already? 🏊', type: 'select',
      options: ["🚫 Not really — I'm learning", '🌊 A little — I can swim slowly', '🏊 Yes — I\'m comfortable in the water', '🏅 Very well — I swim regularly and fast'] },
    { key: 'swim_goal', question: 'What is your swimming goal? 🎯', type: 'select',
      options: ['💪 Get fitter using swimming', '🏆 Swim faster and improve my technique', "🧘 Low-impact exercise that's easy on joints", '🌊 Eventually compete or do open water'] },
    { key: 'days_per_week', question: 'How many times a week can you get to the pool?', type: 'slider', min: 2, max: 5, unit: ' days' },
    { key: 'session_mins',  question: 'How long is each pool session?', type: 'slider', min: 20, max: 60, unit: ' min' },
    { key: 'stroke', question: 'Which swimming stroke do you use most? 🏊', hint: 'A stroke is the style you swim in', type: 'select',
      options: ['🌊 Freestyle (front crawl) — the classic fast stroke', '🦋 Breaststroke — the frog kick style', '🔄 Backstroke — swimming on your back', '🦋 Butterfly — the powerful wave stroke', "🤷 I mix them all"] },
    { key: 'injuries', question: 'Any pain or physical issues to be aware of? 🩹', hint: 'Swimming is gentle but some issues still matter', type: 'select',
      options: ["✅ None — I'm fine", '💪 Shoulder pain', '🔙 Lower back issues', '🦵 Knee problems', '❓ Something else'] },
    { key: 'pool_access', question: 'What pool do you have access to? 🏊', type: 'select',
      options: ['🏢 Public leisure centre pool', '🏫 School or university pool', '🏨 Hotel or private pool', '🌊 Open water (lake, sea, river)'] },
    { key: 'commitment', question: 'How committed are you to swimming regularly? 🔥', type: 'slider', min: 1, max: 10, unit: '/10' },
  ],

  'RACE READY': [
    { key: 'hyrox_experience', question: 'Have you done a Hyrox race before? 🏁', hint: 'Hyrox = run 8 km + complete 8 exercise stations', type: 'select',
      options: ['🚫 No — this would be my first', "👀 I've watched one but not competed", '🏅 Yes — once or twice', '🏆 Yes — several times'] },
    { key: 'current_fitness', question: 'How fit are you right now? 💪', type: 'select',
      options: ['😴 Not very — this is a big challenge', '🚶 Moderate — I exercise sometimes', '🏃 Good — I train regularly', '⚡ Very fit — I already train hard'] },
    { key: 'days_per_week', question: 'How many days a week can you train?', type: 'slider', min: 3, max: 6, unit: ' days' },
    { key: 'session_mins',  question: 'How long can each session be?', type: 'slider', min: 30, max: 90, unit: ' min' },
    { key: 'equipment', question: 'What do you have access to for training? 🏋️', type: 'select',
      options: ['🏢 Full gym with sled, rower, ski erg', '🏋️ Most gym equipment but not everything', '🏠 Home setup with some weights', '🙌 Mostly bodyweight and running'] },
    { key: 'injuries', question: 'Any injuries to train around? 🩹', type: 'select',
      options: ['✅ None', '🔙 Lower back', '🦵 Knees', '💪 Shoulders', '❓ Other'] },
    { key: 'race_timing', question: 'When is your next Hyrox race? ⏰', type: 'select',
      options: ['🚨 Soon — within 3 months', '📅 Moderate — 3 to 6 months away', '🗓️ Plenty of time — over 6 months away', '🤷 No race yet — just training for fun'] },
    { key: 'commitment', question: 'How serious are you about race prep? 🏁', type: 'slider', min: 1, max: 10, unit: '/10' },
  ],

  'HALF OR FULL': [
    { key: 'race_distance', question: 'What are you training for? 🏃', type: 'select',
      options: ['🏃 Half marathon — 21 km (about 13 miles)', '🏆 Full marathon — 42 km (about 26 miles)', "🤷 Not sure yet — I'll decide as I go", '🌟 Both — I want to do them all eventually'] },
    { key: 'current_run', question: 'How far can you run right now without stopping? 🏃', type: 'select',
      options: ['😅 Under 5 km (3 miles) — short distances only', '🚶 5–10 km (3–6 miles) — I can manage a bit', '🏃 10–20 km (6–12 miles) — I run regularly', '💪 Over 20 km (12 miles) — I\'m already a strong runner'] },
    { key: 'days_per_week', question: 'How many days a week can you run or train?', type: 'slider', min: 3, max: 6, unit: ' days' },
    { key: 'long_run_km',   question: 'What is your longest run so far (in km)?', hint: 'This helps us set your starting long run distance', type: 'slider', min: 3, max: 30, unit: ' km' },
    { key: 'surface', question: 'Where do you mainly run? 👟', type: 'select',
      options: ['🛣️ Roads and pavements', '🌲 Trails and off-road', '🏃 Treadmill at home or gym', '🔀 Mix of everything'] },
    { key: 'injuries', question: 'Any running injuries to be careful about? 🩹', hint: 'Common running issues: shin splints (front of lower leg pain), knee pain, plantar fasciitis (heel pain)', type: 'select',
      options: ["✅ None — I feel great", '🦵 Knee pain', '🦵 Shin splints (front of lower leg pain)', '🦶 Heel or foot pain', '💪 Hip or back pain', '❓ Something else'] },
    { key: 'race_date', question: 'When is your race? 📅', type: 'select',
      options: ['🚨 Very soon — within 3 months', '📅 Coming up — 3 to 6 months away', '🗓️ Plenty of time — 6 months or more away', '🤷 No race booked yet'] },
    { key: 'commitment', question: 'How committed are you to your training? 🏃', type: 'slider', min: 1, max: 10, unit: '/10' },
  ],

  'FUNCTIONAL': [
    { key: 'cf_experience', question: 'Have you done CrossFit (CF) before? 🏋️', hint: 'CrossFit = mix of weightlifting, gymnastics, and cardio workouts', type: 'select',
      options: ['🚫 Never — brand new to me', '👀 Watched it but never tried', '✅ Yes — a few times', '🏆 Yes — I train CrossFit regularly'] },
    { key: 'current_fitness', question: 'How is your overall fitness right now? 💪', type: 'select',
      options: ['😴 Low — I get tired quickly', '🚶 Moderate — average fitness', '🏃 Good — I train regularly', "⚡ High — I'm in great shape"] },
    { key: 'days_per_week', question: 'How many days a week can you train?', type: 'slider', min: 3, max: 6, unit: ' days' },
    { key: 'session_mins',  question: 'How long per session?', hint: 'CrossFit WODs (Workouts of the Day) are short but intense', type: 'slider', min: 45, max: 90, unit: ' min' },
    { key: 'equipment', question: 'What do you have access to? 🏢', type: 'select',
      options: ['🏢 Full CrossFit box (CF gym with all equipment)', '🏋️ Regular gym — barbells, pull-up bar, rower', '🏠 Home setup — some weights and pull-up bar', '🙌 Mostly bodyweight only'] },
    { key: 'injuries', question: 'Any injuries to train around? 🩹', type: 'select',
      options: ['✅ None', '🔙 Lower back', '🦵 Knees', '💪 Shoulders', '❓ Other'] },
    { key: 'weak_area', question: 'What is your weakest area? 🎯', hint: 'This helps us focus on what needs the most work', type: 'select',
      options: ['🏋️ Lifting — I struggle with heavy weights', '🤸 Gymnastics — pull-ups, handstands, muscle-ups', '🏃 Cardio — running, rowing, ski erg tire me out fast', '⚖️ Everything is about equal'] },
    { key: 'commitment', question: 'How serious are you about CrossFit training? 🔥', type: 'slider', min: 1, max: 10, unit: '/10' },
  ],

  'HIGH INTENSITY': [
    { key: 'hiit_reason', question: 'Why do you want to do HIIT? ⚡', hint: 'HIIT = High-Intensity Interval Training — short hard bursts followed by rest', type: 'select',
      options: ['🔥 Burn fat and lose weight fast', '⏰ Get a great workout in less time', '❤️ Improve my heart health and fitness', '😄 I find it fun and exciting'] },
    { key: 'cardio_level', question: 'How is your cardio fitness right now? 🫁', hint: 'Cardio = how well your heart and lungs handle exercise', type: 'select',
      options: ['😮‍💨 Low — I get breathless very quickly', '🚶 OK — I can walk fast but struggle to run', '🏃 Good — I can run and keep going', '💪 High — I rarely get out of breath'] },
    { key: 'days_per_week', question: 'How many HIIT sessions a week can you do?', hint: 'HIIT is intense — 3–4 days is plenty!', type: 'slider', min: 2, max: 5, unit: ' days' },
    { key: 'session_mins',  question: 'How long can each session be?', hint: 'HIIT works great even in 15 minutes', type: 'slider', min: 15, max: 45, unit: ' min' },
    { key: 'equipment', question: 'Do you have any equipment? 🏋️', type: 'select',
      options: ['🏢 Full gym access', '🪆 Some home equipment (dumbbells, jump rope)', '🙌 Nothing — bodyweight only', '🌳 Outdoor space — park, track, etc.'] },
    { key: 'injuries', question: 'Any pain or injuries to avoid? 🩹', type: 'select',
      options: ["✅ None — I'm ready to go hard", '🔙 Lower back pain', '🦵 Knee pain', '💪 Shoulder pain', '❓ Something else'] },
    { key: 'motivation_style', question: 'What gets you going during a hard workout? 🎧', type: 'select',
      options: ['🎵 Music — loud beats push me harder', '⏱️ Timer — racing against the clock', '🏆 Competition — beating my last score', '✅ Finishing — I love the feeling after'] },
    { key: 'commitment', question: 'How committed are you to showing up every session? 💥', type: 'slider', min: 1, max: 10, unit: '/10' },
  ],
};

const EN_DEFAULT: Step[] = [
  { key: 'goal', question: 'What do you most want to achieve? 🎯', type: 'select',
    options: ['💪 Build muscle — get bigger and stronger', '🔥 Lose fat — slim down and feel lighter', '🏃 Get fitter — more energy and stamina', '😊 Stay active — move more, feel good'] },
  { key: 'experience', question: 'How much exercise experience do you have? 🤔', type: 'select',
    options: ["🌱 Total beginner — I'm just starting out", '🚶 A little — I exercise now and then', '🏋️ Some — I train regularly', '⚡ A lot — I train hard most weeks'] },
  { key: 'days_per_week', question: 'How many days a week can you work out?', type: 'slider', min: 2, max: 6, unit: ' days' },
  { key: 'session_mins',  question: 'How long is each workout session?', type: 'slider', min: 20, max: 90, unit: ' min' },
  { key: 'equipment', question: 'What do you have to work out with? 🏠', type: 'select',
    options: ['🏢 Full gym — I have access to a gym', '🏠 Home gym — I have weights at home', '🪆 Just dumbbells — a few weights only', '🙌 Nothing — bodyweight only'] },
  { key: 'injuries', question: 'Any pain or injuries we should avoid? 🩹', type: 'select',
    options: ["✅ None — I'm good to go", '🔙 Lower back pain', '🦵 Knee pain', '💪 Shoulder pain', '❓ Something else'] },
  { key: 'motivation', question: 'What keeps you going? 🚀', type: 'select',
    options: ['🪞 Looking good', '🏆 Getting stronger', '❤️ Health & long life', '🥇 Competing'] },
  { key: 'commitment', question: 'How serious are you about sticking to this? 🔥', hint: '1 = just curious, 10 = nothing will stop me', type: 'slider', min: 1, max: 10, unit: '/10' },
];

// ── German steps ──────────────────────────────────────────────────────────────

const DE: Record<string, Step[]> = {

  'FAT LOSS': [
    { key: 'goal', question: 'Warum möchtest du Fett verbrennen? 🔥', type: 'select',
      options: ['❤️ Ich möchte gesünder leben', '🪞 Ich möchte besser aussehen', '👗 Ich habe ein besonderes Ereignis', '😊 Ich möchte einfach mehr Energie'] },
    { key: 'current_activity', question: 'Wie aktiv bist du gerade? 🚶', type: 'select',
      hint: 'Sei ehrlich — es gibt keine falsche Antwort!',
      options: ['🛋️ Meist sitzen — ich bewege mich wenig', '🚶 Leichte Spaziergänge — ich bewege mich etwas', '🏃 Manchmal — ich trainiere ab und zu', '💪 Oft — ich trainiere regelmäßig'] },
    { key: 'days_per_week', question: 'Wie viele Tage pro Woche kannst du trainieren?', type: 'slider', min: 2, max: 6, unit: ' Tage' },
    { key: 'session_mins',  question: 'Wie lang kann jede Einheit sein?', hint: 'Schon 20 Minuten verbrennen Fett!', type: 'slider', min: 20, max: 60, unit: ' Min.' },
    { key: 'equipment', question: 'Was hast du zum Trainieren? 🏋️', type: 'select',
      options: ['🏢 Fitnessstudio — ich habe eine Mitgliedschaft', '🏠 Heimstudio — ich habe etwas Equipment', '🪆 Nur Kurzhanteln (Dumbbells)', '🙌 Nichts — nur mein Körpergewicht'] },
    { key: 'injuries', question: 'Hast du Schmerzen oder Verletzungen, die wir beachten sollen? 🩹', type: 'select',
      options: ['✅ Keine — ich bin fit', '🔙 Rückenschmerzen', '🦵 Knieschmerzen', '💪 Schulterschmerzen', '❓ Etwas anderes'] },
    { key: 'diet', question: 'Wie würdest du deine Essgewohnheiten beschreiben? 🍽️', type: 'select',
      options: ['🍔 Nicht gut — viel Fast Food', '🍞 Durchschnittlich — könnte besser sein', '🥗 Ziemlich gut — meist gesund', '💪 Sehr sauber — ich esse gut'] },
    { key: 'commitment', question: 'Wie ernst nimmst du das Ganze? 🔥', hint: '1 = nur neugierig, 10 = nichts kann mich aufhalten', type: 'slider', min: 1, max: 10, unit: '/10' },
  ],

  'HYPERTROPHY': [
    { key: 'muscle_goal', question: 'Was ist dein wichtigstes Ziel beim Muskelaufbau? 💪', type: 'select',
      options: ['🦾 Insgesamt größer werden — mehr Masse überall', '⚡ Stärker werden — schwerere Gewichte heben', '🔝 Oberkörper — Brust, Rücken, Arme', '🦵 Beine — Oberschenkel, Hamstrings, Gesäß'] },
    { key: 'experience', question: 'Wie lange trainierst du schon mit Gewichten? 🏋️', hint: 'Training = Kurzhanteln (Dumbbells), Langhantel (Barbell) oder Maschinen', type: 'select',
      options: ['🌱 Nie — das ist komplett neu für mich', '🚶 Unter 6 Monate — ich fange gerade an', '🏃 6 Monate bis 2 Jahre — ich kenne die Grundlagen', '⚡ Über 2 Jahre — ich bin erfahren'] },
    { key: 'days_per_week', question: 'Wie viele Tage pro Woche kannst du trainieren?', hint: 'Mehr Tage = mehr Muskeln (aber Erholung ist auch wichtig)', type: 'slider', min: 3, max: 6, unit: ' Tage' },
    { key: 'session_mins',  question: 'Wie lange dauert jede Gym-Einheit?', type: 'slider', min: 30, max: 90, unit: ' Min.' },
    { key: 'equipment', question: 'Welches Equipment hast du? 🏢', type: 'select',
      options: ['🏢 Volles Gym — Langhantel, Maschinen, Kabel', '🏠 Heimstudio — Kurzhanteln und Bank', '🪆 Nur Kurzhanteln', '🙌 Nur Körpergewicht'] },
    { key: 'injuries', question: 'Hast du Schmerzen oder Verletzungen, die wir umgehen sollen? 🩹', type: 'select',
      options: ['✅ Keine — ich bin fit', '🔙 Rückenschmerzen', '🦵 Knieschmerzen', '💪 Schulterschmerzen', '❓ Etwas anderes'] },
    { key: 'weak_spot', question: 'Welche Muskelgruppe soll am stärksten wachsen? 🎯', type: 'select',
      options: ['💪 Arme — Bizeps und Trizeps', '🫁 Brust — größere Pektoralis', '🦋 Rücken — breiter und dicker', '🦵 Beine — größere Oberschenkel und Gesäß', '⬆️ Schultern — breiter wirken'] },
    { key: 'commitment', question: 'Wie engagiert bist du für das Gym? 🔥', hint: '1 = gelegentlich, 10 = ich lebe dafür', type: 'slider', min: 1, max: 10, unit: '/10' },
  ],

  'TRANSFORMATION': [
    { key: 'transform_goal', question: 'Wie möchtest du nach 90 Tagen aussehen und dich fühlen? 🌟', type: 'select',
      options: ['🔥 Schlanker — weniger Fett, mehr Definition', '💪 Muskulöser — größer und stärker', '⚡ Fitter — bessere Ausdauer und mehr Energie', '🌈 Alles — eine totale Veränderung'] },
    { key: 'current_fitness', question: 'Wie fit bist du gerade? 📊', type: 'select',
      options: ['😴 Nicht sehr — ich werde schnell müde', '🚶 Ein wenig — ich kann gehen, aber nicht weit laufen', '🏃 Mittel — ich trainiere manchmal', '💪 Ziemlich fit — ich trainiere regelmäßig'] },
    { key: 'days_per_week', question: 'Wie viele Tage pro Woche kannst du trainieren?', type: 'slider', min: 3, max: 6, unit: ' Tage' },
    { key: 'session_mins',  question: 'Wie lang kann jede Einheit sein?', type: 'slider', min: 30, max: 60, unit: ' Min.' },
    { key: 'equipment', question: 'Was hast du zum Trainieren? 🏋️', type: 'select',
      options: ['🏢 Volles Gym', '🏠 Heimstudio mit Gewichten', '🪆 Nur Kurzhanteln', '🙌 Kein Equipment'] },
    { key: 'injuries', question: 'Hast du Schmerzen oder Verletzungen, die wir vermeiden sollen? 🩹', type: 'select',
      options: ['✅ Keine', '🔙 Rücken', '🦵 Knie', '💪 Schultern', '❓ Anderes'] },
    { key: 'diet_willing', question: 'Bist du auch bereit, deine Ernährung zu verbessern? 🍽️', hint: 'Training + besseres Essen = schnellere Ergebnisse', type: 'select',
      options: ['🥗 Ja — ich werde mein Essen verfolgen und besser essen', '🍞 Zum Teil — ich werde versuchen, gesünder zu essen', '🍔 Noch nicht — erstmal nur das Training'] },
    { key: 'commitment', question: 'Auf einer Skala von 1–10: Wie engagiert bist du? 🔥', type: 'slider', min: 1, max: 10, unit: '/10' },
  ],

  'FIRST STEPS': [
    { key: 'why_start', question: 'Warum möchtest du mit dem Sport anfangen? 🌱', type: 'select',
      options: ['❤️ Ich möchte gesünder werden', '😊 Ich möchte mehr Energie im Alltag', '😰 Mein Arzt hat mir geraten, mich mehr zu bewegen', '🪞 Ich möchte mich besser in meiner Haut fühlen'] },
    { key: 'tried_before', question: 'Hast du schon einmal regelmäßig Sport gemacht? 🤔', type: 'select',
      options: ['🚫 Eigentlich nie', '🔄 Ich hab\'s versucht, aber aufgehört', '✅ Ein bisschen hier und da', '📅 Früher war ich aktiv, habe aber aufgehört'] },
    { key: 'days_per_week', question: 'Wie viele Tage pro Woche fühlen sich machbar an? 😊', hint: 'Mit 2–3 Tagen anzufangen ist völlig in Ordnung!', type: 'slider', min: 2, max: 4, unit: ' Tage' },
    { key: 'session_mins',  question: 'Wie lange kannst du auf einmal trainieren?', hint: 'Schon 15 Minuten sind ein toller Start', type: 'slider', min: 15, max: 45, unit: ' Min.' },
    { key: 'equipment', question: 'Was hast du zur Verfügung? 🏠', type: 'select',
      options: ['🏢 Ein Fitnessstudio in der Nähe', '🏠 Etwas Equipment zu Hause', '🪆 Nur ein paar Kurzhanteln', '🙌 Gar nichts — nur ich selbst'] },
    { key: 'injuries', question: 'Hast du Schmerzen, die wir kennen sollten? 🩹', hint: 'Das hilft uns, dich sicher zu halten', type: 'select',
      options: ['✅ Nichts — mir geht\'s gut', '🔙 Mein Rücken schmerzt manchmal', '🦵 Meine Knie machen Probleme', '💪 Meine Schultern tun weh', '❓ Ich habe etwas anderes'] },
    { key: 'biggest_fear', question: 'Was bereitet dir beim Anfangen am meisten Sorgen? 😬', type: 'select',
      options: ['😳 Dumm aussehen oder Fehler machen', '😓 Noch nicht fit genug sein', '⏰ Keine Zeit haben', '😩 Nach ein paar Tagen aufgeben'] },
    { key: 'commitment', question: 'Wie bereit fühlst du dich, loszulegen? 🌟', hint: '1 = noch unsicher, 10 = ich bin startklar!', type: 'slider', min: 1, max: 10, unit: '/10' },
  ],

  'NO GYM': [
    { key: 'home_reason', question: 'Warum trainierst du zu Hause? 🏠', type: 'select',
      options: ['💸 Fitnessstudio-Mitgliedschaften sind zu teuer', '⏰ Keine Zeit, zum Gym zu fahren', '😌 Ich mag die Privatsphäre zu Hause', '🌍 Ich reise viel und brauche Flexibilität'] },
    { key: 'current_activity', question: 'Wie aktiv bist du gerade? 🚶', type: 'select',
      options: ['🛋️ Sehr wenig — meist sitzen', '🚶 Ein wenig — leichte Spaziergänge', '🏃 Manchmal — gelegentliche Einheiten', '💪 Oft — ich trainiere regelmäßig'] },
    { key: 'days_per_week', question: 'Wie viele Tage pro Woche kannst du zu Hause trainieren?', type: 'slider', min: 2, max: 6, unit: ' Tage' },
    { key: 'session_mins',  question: 'Wie lang kann jede Heimeinheit sein?', type: 'slider', min: 15, max: 60, unit: ' Min.' },
    { key: 'home_space', question: 'Welchen Platz und welches Equipment hast du? 🏠', type: 'select',
      options: ['🛋️ Wenig Platz, kein Equipment', '🪆 Wenig Platz, habe Kurzhanteln', '🏠 Guter Platz, etwas Equipment', '🏋️ Vollständiges Heimstudio'] },
    { key: 'injuries', question: 'Hast du Schmerzen oder Verletzungen, die wir umgehen sollen? 🩹', type: 'select',
      options: ['✅ Keine', '🔙 Rücken', '🦵 Knie', '💪 Schultern', '❓ Anderes'] },
    { key: 'home_preference', question: 'Welche Art von Training magst du am liebsten? 🎯', type: 'select',
      options: ['💪 Kraft — stark werden und Muskeln aufbauen', '🔥 Cardio — schwitzen und fitter werden', '🧘 Gelenkschonend — sanft für meine Gelenke', '⚡ Mix — ich mag Abwechslung'] },
    { key: 'commitment', question: 'Wie engagiert bist du für das Training zu Hause? 🔥', type: 'slider', min: 1, max: 10, unit: '/10' },
  ],

  'POOL': [
    { key: 'swim_ability', question: 'Kannst du schon schwimmen? 🏊', type: 'select',
      options: ['🚫 Nicht wirklich — ich lerne noch', '🌊 Ein bisschen — ich kann langsam schwimmen', '🏊 Ja — ich fühle mich im Wasser sicher', '🏅 Sehr gut — ich schwimme regelmäßig und schnell'] },
    { key: 'swim_goal', question: 'Was ist dein Schwimmziel? 🎯', type: 'select',
      options: ['💪 Fitter werden durch Schwimmen', '🏆 Schneller werden und Technik verbessern', '🧘 Gelenkschonendes Training', '🌊 Irgendwann im Wettkampf oder Freiwasser schwimmen'] },
    { key: 'days_per_week', question: 'Wie oft pro Woche kannst du ins Schwimmbad?', type: 'slider', min: 2, max: 5, unit: ' Tage' },
    { key: 'session_mins',  question: 'Wie lang ist jede Pool-Einheit?', type: 'slider', min: 20, max: 60, unit: ' Min.' },
    { key: 'stroke', question: 'Welchen Schwimmstil benutzt du am meisten? 🏊', hint: 'Ein Stil ist die Art, wie du schwimmst', type: 'select',
      options: ['🌊 Kraul (Freestyle) — der klassische schnelle Stil', '🦋 Brustschwimmen — der Frosch-Kick-Stil', '🔄 Rückenschwimmen — auf dem Rücken', '🦋 Schmetterling (Butterfly) — der kraftvolle Wellenstil', '🤷 Ich mische alles'] },
    { key: 'injuries', question: 'Hast du Schmerzen oder körperliche Einschränkungen? 🩹', hint: 'Schwimmen ist sanft, aber manche Beschwerden spielen trotzdem eine Rolle', type: 'select',
      options: ['✅ Keine — mir geht\'s gut', '💪 Schulterschmerzen', '🔙 Rückenprobleme', '🦵 Knieprobleme', '❓ Etwas anderes'] },
    { key: 'pool_access', question: 'Welches Schwimmbad hast du zur Verfügung? 🏊', type: 'select',
      options: ['🏢 Öffentliches Freibad oder Hallenbad', '🏫 Schul- oder Uni-Schwimmbad', '🏨 Hotel- oder Privatpool', '🌊 Freiwasser (See, Meer, Fluss)'] },
    { key: 'commitment', question: 'Wie engagiert bist du fürs regelmäßige Schwimmen? 🔥', type: 'slider', min: 1, max: 10, unit: '/10' },
  ],

  'RACE READY': [
    { key: 'hyrox_experience', question: 'Hast du schon an einem Hyrox-Rennen teilgenommen? 🏁', hint: 'Hyrox = 8 km laufen + 8 Übungsstationen absolvieren', type: 'select',
      options: ['🚫 Nein — es wäre mein erstes', '👀 Ich habe eins gesehen, aber nicht mitgemacht', '🏅 Ja — ein oder zweimal', '🏆 Ja — mehrmals'] },
    { key: 'current_fitness', question: 'Wie fit bist du gerade? 💪', type: 'select',
      options: ['😴 Nicht sehr — das ist eine große Herausforderung', '🚶 Mittel — ich trainiere manchmal', '🏃 Gut — ich trainiere regelmäßig', '⚡ Sehr fit — ich trainiere bereits hart'] },
    { key: 'days_per_week', question: 'Wie viele Tage pro Woche kannst du trainieren?', type: 'slider', min: 3, max: 6, unit: ' Tage' },
    { key: 'session_mins',  question: 'Wie lang kann jede Einheit sein?', type: 'slider', min: 30, max: 90, unit: ' Min.' },
    { key: 'equipment', question: 'Was steht dir zum Trainieren zur Verfügung? 🏋️', type: 'select',
      options: ['🏢 Volles Gym mit Schlitten (Sled), Rudergerät, Ski Erg', '🏋️ Die meisten Gym-Geräte, aber nicht alles', '🏠 Heimsetup mit etwas Gewichten', '🙌 Meist Körpergewicht und Laufen'] },
    { key: 'injuries', question: 'Hast du Verletzungen, die wir berücksichtigen sollen? 🩹', type: 'select',
      options: ['✅ Keine', '🔙 Rücken', '🦵 Knie', '💪 Schultern', '❓ Anderes'] },
    { key: 'race_timing', question: 'Wann ist dein nächstes Hyrox-Rennen? ⏰', type: 'select',
      options: ['🚨 Bald — innerhalb von 3 Monaten', '📅 Mittel — 3 bis 6 Monate', '🗓️ Noch viel Zeit — über 6 Monate', '🤷 Kein Rennen geplant — ich trainiere zum Spaß'] },
    { key: 'commitment', question: 'Wie ernst nimmst du die Wettkampfvorbereitung? 🏁', type: 'slider', min: 1, max: 10, unit: '/10' },
  ],

  'HALF OR FULL': [
    { key: 'race_distance', question: 'Wofür trainierst du? 🏃', type: 'select',
      options: ['🏃 Halbmarathon — 21 km', '🏆 Marathon — 42 km', '🤷 Noch nicht sicher — ich entscheide unterwegs', '🌟 Beides — ich möchte irgendwann beides laufen'] },
    { key: 'current_run', question: 'Wie weit kannst du gerade ohne Pause laufen? 🏃', type: 'select',
      options: ['😅 Unter 5 km — nur kurze Strecken', '🚶 5–10 km — ich schaffe ein bisschen', '🏃 10–20 km — ich laufe regelmäßig', '💪 Über 20 km — ich bin bereits ein starker Läufer'] },
    { key: 'days_per_week', question: 'Wie viele Tage pro Woche kannst du laufen oder trainieren?', type: 'slider', min: 3, max: 6, unit: ' Tage' },
    { key: 'long_run_km',   question: 'Wie weit war dein längster Lauf bisher (in km)?', hint: 'Das hilft uns, deine Startdistanz für den langen Lauf festzulegen', type: 'slider', min: 3, max: 30, unit: ' km' },
    { key: 'surface', question: 'Wo läufst du hauptsächlich? 👟', type: 'select',
      options: ['🛣️ Straßen und Bürgersteige', '🌲 Trails und Gelände', '🏃 Laufband zu Hause oder im Gym', '🔀 Mix aus allem'] },
    { key: 'injuries', question: 'Hast du Laufverletzungen, auf die wir achten sollen? 🩹', hint: 'Typische Läuferverletzungen: Schienbeinkantensyndrom (Schmerzen an der Schienbeinkante), Knieschmerzen, Fersensporn (Fersenschmerzen)', type: 'select',
      options: ['✅ Keine — mir geht\'s prima', '🦵 Knieschmerzen', '🦵 Schienbeinkantensyndrom (Schmerzen am Unterschenkelknochen)', '🦶 Fersen- oder Fußschmerzen', '💪 Hüft- oder Rückenschmerzen', '❓ Etwas anderes'] },
    { key: 'race_date', question: 'Wann ist dein Rennen? 📅', type: 'select',
      options: ['🚨 Sehr bald — innerhalb von 3 Monaten', '📅 Demnächst — 3 bis 6 Monate', '🗓️ Noch viel Zeit — 6 Monate oder mehr', '🤷 Noch kein Rennen gebucht'] },
    { key: 'commitment', question: 'Wie engagiert bist du für dein Training? 🏃', type: 'slider', min: 1, max: 10, unit: '/10' },
  ],

  'FUNCTIONAL': [
    { key: 'cf_experience', question: 'Hast du schon CrossFit (CF) gemacht? 🏋️', hint: 'CrossFit = Mix aus Gewichtheben, Turnen und Cardio-Workouts', type: 'select',
      options: ['🚫 Nie — das ist komplett neu', '👀 Zugeschaut, aber nie selbst probiert', '✅ Ja — ein paarmal', '🏆 Ja — ich trainiere CrossFit regelmäßig'] },
    { key: 'current_fitness', question: 'Wie ist deine allgemeine Fitness gerade? 💪', type: 'select',
      options: ['😴 Niedrig — ich werde schnell müde', '🚶 Mittel — durchschnittliche Fitness', '🏃 Gut — ich trainiere regelmäßig', '⚡ Hoch — ich bin in sehr guter Form'] },
    { key: 'days_per_week', question: 'Wie viele Tage pro Woche kannst du trainieren?', type: 'slider', min: 3, max: 6, unit: ' Tage' },
    { key: 'session_mins',  question: 'Wie lange pro Einheit?', hint: 'CrossFit WODs (Workouts of the Day) sind kurz, aber intensiv', type: 'slider', min: 45, max: 90, unit: ' Min.' },
    { key: 'equipment', question: 'Was hast du zur Verfügung? 🏢', type: 'select',
      options: ['🏢 Vollständiges CrossFit-Box (CF-Gym mit allem Equipment)', '🏋️ Normales Gym — Langhantel, Klimmzugstange, Rudergerät', '🏠 Heimsetup — etwas Gewichte und Klimmzugstange', '🙌 Meist nur Körpergewicht'] },
    { key: 'injuries', question: 'Hast du Verletzungen, die wir berücksichtigen sollen? 🩹', type: 'select',
      options: ['✅ Keine', '🔙 Rücken', '🦵 Knie', '💪 Schultern', '❓ Anderes'] },
    { key: 'weak_area', question: 'Was ist dein schwächster Bereich? 🎯', hint: 'Das hilft uns, das zu fokussieren, was am meisten Arbeit braucht', type: 'select',
      options: ['🏋️ Heben — ich habe Mühe mit schweren Gewichten', '🤸 Turnen — Klimmzüge (Pull-ups), Handstand, Muscle-ups', '🏃 Cardio — Laufen, Rudern, Ski Erg ermüden mich schnell', '⚖️ Alles ist ungefähr gleich'] },
    { key: 'commitment', question: 'Wie ernst nimmst du das CrossFit-Training? 🔥', type: 'slider', min: 1, max: 10, unit: '/10' },
  ],

  'HIGH INTENSITY': [
    { key: 'hiit_reason', question: 'Warum möchtest du HIIT machen? ⚡', hint: 'HIIT = High-Intensity Interval Training — kurze harte Phasen gefolgt von Erholung', type: 'select',
      options: ['🔥 Fett verbrennen und schnell abnehmen', '⏰ In kurzer Zeit gut trainieren', '❤️ Meine Herzgesundheit und Fitness verbessern', '😄 Ich finde es Spaß und aufregend'] },
    { key: 'cardio_level', question: 'Wie ist deine Cardio-Fitness gerade? 🫁', hint: 'Cardio = wie gut dein Herz und deine Lungen beim Sport mitmachen', type: 'select',
      options: ['😮‍💨 Niedrig — ich werde sehr schnell außer Atem', '🚶 OK — ich kann schnell gehen, aber Laufen ist schwer', '🏃 Gut — ich kann laufen und durchhalten', '💪 Hoch — ich werde kaum außer Atem'] },
    { key: 'days_per_week', question: 'Wie viele HIIT-Einheiten pro Woche kannst du machen?', hint: 'HIIT ist intensiv — 3–4 Tage sind genug!', type: 'slider', min: 2, max: 5, unit: ' Tage' },
    { key: 'session_mins',  question: 'Wie lang kann jede Einheit sein?', hint: 'HIIT funktioniert super, sogar in 15 Minuten', type: 'slider', min: 15, max: 45, unit: ' Min.' },
    { key: 'equipment', question: 'Hast du Equipment? 🏋️', type: 'select',
      options: ['🏢 Volles Gym', '🪆 Etwas Heimequipment (Kurzhanteln, Springseil)', '🙌 Nichts — nur mein Körpergewicht', '🌳 Outdoor-Fläche — Park, Laufbahn, etc.'] },
    { key: 'injuries', question: 'Hast du Schmerzen oder Verletzungen, die wir vermeiden sollen? 🩹', type: 'select',
      options: ['✅ Keine — ich bin bereit, Gas zu geben', '🔙 Rückenschmerzen', '🦵 Knieschmerzen', '💪 Schulterschmerzen', '❓ Etwas anderes'] },
    { key: 'motivation_style', question: 'Was motiviert dich während eines harten Workouts? 🎧', type: 'select',
      options: ['🎵 Musik — laute Beats pushen mich', '⏱️ Timer — gegen die Uhr kämpfen', '🏆 Wettbewerb — besser als beim letzten Mal', '✅ Fertig sein — das Gefühl danach ist alles'] },
    { key: 'commitment', question: 'Wie engagiert bist du, bei jeder Einheit dabei zu sein? 💥', type: 'slider', min: 1, max: 10, unit: '/10' },
  ],
};

const DE_DEFAULT: Step[] = [
  { key: 'goal', question: 'Was möchtest du am meisten erreichen? 🎯', type: 'select',
    options: ['💪 Muskeln aufbauen — größer und stärker werden', '🔥 Fett verlieren — abnehmen und leichter fühlen', '🏃 Fitter werden — mehr Energie und Ausdauer', '😊 Aktiv bleiben — mehr bewegen, besser fühlen'] },
  { key: 'experience', question: 'Wie viel Sport-Erfahrung hast du? 🤔', type: 'select',
    options: ['🌱 Totaler Anfänger — ich fange gerade an', '🚶 Ein wenig — ich trainiere ab und zu', '🏋️ Etwas — ich trainiere regelmäßig', '⚡ Viel — ich trainiere die meiste Woche hart'] },
  { key: 'days_per_week', question: 'Wie viele Tage pro Woche kannst du trainieren?', type: 'slider', min: 2, max: 6, unit: ' Tage' },
  { key: 'session_mins',  question: 'Wie lang ist jede Trainingseinheit?', type: 'slider', min: 20, max: 90, unit: ' Min.' },
  { key: 'equipment', question: 'Was hast du zum Trainieren? 🏠', type: 'select',
    options: ['🏢 Fitnessstudio — ich habe Zugang zu einem Gym', '🏠 Heimstudio — ich habe Gewichte zu Hause', '🪆 Nur Kurzhanteln — nur ein paar Gewichte', '🙌 Nichts — nur mein Körpergewicht'] },
  { key: 'injuries', question: 'Hast du Schmerzen oder Verletzungen, die wir beachten sollen? 🩹', type: 'select',
    options: ['✅ Keine — ich bin fit', '🔙 Rückenschmerzen', '🦵 Knieschmerzen', '💪 Schulterschmerzen', '❓ Etwas anderes'] },
  { key: 'motivation', question: 'Was hält dich am Laufen? 🚀', type: 'select',
    options: ['🪞 Gut aussehen', '🏆 Stärker werden', '❤️ Gesundheit & langes Leben', '🥇 Wettkämpfen'] },
  { key: 'commitment', question: 'Wie ernst nimmst du das Durchhalten? 🔥', hint: '1 = nur neugierig, 10 = nichts kann mich aufhalten', type: 'slider', min: 1, max: 10, unit: '/10' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function Form() {
  const { planId, category, difficulty } = useLocalSearchParams<{ planId?: string; category?: string; difficulty?: string }>();
  const router  = useRouter();
  const { tr, lang } = useT();

  const DIFFICULTY_COLOR: Record<string, string> = {
    beginner:     '#4CAF50',
    intermediate: '#F59E0B',
    advanced:     '#E94560',
  };
  const diffColor = DIFFICULTY_COLOR[(difficulty || '').toLowerCase()] || colors.accent;

  const byCategory = lang === 'de' ? DE : EN;
  const defaultSteps = lang === 'de' ? DE_DEFAULT : EN_DEFAULT;
  const STEPS: Step[] = (category ? byCategory[category] : undefined) ?? defaultSteps;

  const [step,    setStep]    = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [loading, setLoading] = useState(false);

  const current    = STEPS[step];
  const total      = STEPS.length;
  const sliderVal  = (answers[current.key] as number) ?? current.min ?? 0;

  const answer = (value: string | number) => {
    setAnswers(a => ({ ...a, [current.key]: value }));
    if (step < total - 1) {
      setTimeout(() => setStep(s => s + 1), current.type === 'select' ? 300 : 0);
    }
  };

  const submit = async () => {
    setLoading(true);
    try {
      const q = await api.questionnaire.save({ ...answers, plan_id: planId ? Number(planId) : undefined });
      router.replace({ pathname: '/generating', params: { questionnaireId: q.id } });
    } catch {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* Progress bar */}
      <View style={s.progressBar}>
        <View style={[s.progressFill, { width: `${((step + 1) / total) * 100}%` as any, backgroundColor: diffColor }]} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={s.stepNum}>{tr('form_question')} {step + 1} {tr('form_of')} {total}</Text>
        <Text style={s.question}>{current.question}</Text>
        {current.hint && <Text style={s.hint}>{current.hint}</Text>}

        {/* Select options */}
        {current.type === 'select' && (
          <View style={s.options}>
            {current.options!.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[s.option, answers[current.key] === opt && s.optionActive]}
                onPress={() => answer(opt)}
              >
                <Text style={[s.optionText, answers[current.key] === opt && s.optionTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Slider */}
        {current.type === 'slider' && (
          <View style={s.sliderWrap}>
            <View style={s.sliderDisplay}>
              <Text style={s.sliderVal}>{sliderVal}</Text>
              <Text style={s.sliderUnit}>{current.unit}</Text>
            </View>
            <Slider
              style={s.slider}
              minimumValue={current.min}
              maximumValue={current.max}
              step={1}
              value={sliderVal}
              minimumTrackTintColor={colors.accent}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.accent}
              onValueChange={val => setAnswers(a => ({ ...a, [current.key]: val }))}
            />
            <View style={s.sliderLabels}>
              <Text style={s.sliderMin}>{current.min}{current.unit}</Text>
              <Text style={s.sliderMax}>{current.max}{current.unit}</Text>
            </View>
          </View>
        )}

        {/* Nav */}
        <View style={s.nav}>
          {step > 0 && (
            <TouchableOpacity style={s.back} onPress={() => setStep(s => s - 1)}>
              <Text style={s.backText}>{tr('form_back')}</Text>
            </TouchableOpacity>
          )}
          {current.type === 'slider' && step < total - 1 && (
            <TouchableOpacity style={s.cta} onPress={() => answer(sliderVal)}>
              <Text style={s.ctaText}>{tr('form_next')}</Text>
            </TouchableOpacity>
          )}
          {step === total - 1 && (
            <TouchableOpacity style={[s.cta, loading && s.disabled]} onPress={submit} disabled={loading}>
              <Text style={s.ctaText}>{loading ? tr('form_building') : tr('form_build')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: colors.bg },
  progressBar:      { height: 3, backgroundColor: colors.border },
  progressFill:     { height: 3, backgroundColor: colors.accent },
  scroll:           { padding: 24, paddingTop: 28, paddingBottom: 48 },
  stepNum:          { fontSize: 12, color: colors.muted, fontWeight: '600', letterSpacing: 1, marginBottom: 10 },
  question:         { fontSize: 22, fontWeight: '800', color: colors.text, lineHeight: 30, marginBottom: 6 },
  hint:             { fontSize: 13, color: colors.muted, lineHeight: 18, marginBottom: 24 },
  options:          { gap: 10, marginTop: 16 },
  option:           { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: 16, padding: 16 },
  optionActive:     { borderColor: colors.accent, backgroundColor: colors.accent + '15' },
  optionText:       { fontSize: 15, color: colors.text, fontWeight: '500' },
  optionTextActive: { color: colors.accent, fontWeight: '700' },
  sliderWrap:       { marginTop: 20 },
  sliderDisplay:    { alignItems: 'center', marginBottom: 16 },
  sliderVal:        { fontSize: 72, fontWeight: '800', color: colors.text, lineHeight: 80 },
  sliderUnit:       { fontSize: 16, color: colors.muted },
  slider:           { width: '100%', height: 40 },
  sliderLabels:     { flexDirection: 'row', justifyContent: 'space-between' },
  sliderMin:        { fontSize: 12, color: colors.muted },
  sliderMax:        { fontSize: 12, color: colors.muted },
  nav:              { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, gap: 12 },
  back:             { flex: 1, paddingVertical: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  backText:         { fontSize: 16, color: colors.text, fontWeight: '600' },
  cta:              { flex: 1, backgroundColor: colors.cta, borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  ctaText:          { fontSize: 16, fontWeight: '700', color: colors.bg },
  disabled:         { opacity: 0.6 },
});
