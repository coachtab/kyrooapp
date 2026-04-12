import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { api } from '@/api';
import { colors } from '@/theme';
import { useT } from '@/i18n';
import { useAuth } from '@/context/AuthContext';

// ── Level ring — partial circle indicator (25/50/75/100%) ─────────────────
function LevelRing({ percent, color, size = 34 }: { percent: number; color: string; size?: number }) {
  const strokeWidth = 3;
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const dash = (percent / 100) * c;
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke="#2a2a2a" strokeWidth={strokeWidth} fill="none" />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${dash} ${c}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}

// ── Intro steps: gender + height + weight (Ochy-style) ──────────────────────
const INTRO_EN: Step[] = [
  {
    key: 'gender',
    question: 'How would you',
    questionAccent: 'identify yourself?',
    type: 'iconSelect',
    iconOptions: [
      { label: 'Man',              icon: 'male-outline'        },
      { label: 'Woman',            icon: 'female-outline'      },
      { label: 'Non-binary',       icon: 'male-female-outline' },
      { label: 'Prefer not to say' },
    ],
  },
  { key: 'height_cm', question: 'What is your', questionAccent: 'height?', type: 'height' },
  { key: 'weight_kg', question: 'What is your', questionAccent: 'weight?', type: 'weight' },
  {
    key: 'fitness_level',
    question: 'How would you rate your',
    questionAccent: 'fitness level?',
    type: 'levelSelect',
    iconOptions: [
      { label: 'Beginner',     subtitle: "You've just started exercising",       ringPercent: 25  },
      { label: 'Intermediate', subtitle: 'You train regularly — 1 to 3 years',   ringPercent: 50  },
      { label: 'Advanced',     subtitle: 'You train seriously — 3+ years',       ringPercent: 75  },
      { label: 'Elite',        subtitle: 'Competitive or professional athlete',  ringPercent: 100 },
    ],
  },
];

const INTRO_DE: Step[] = [
  {
    key: 'gender',
    question: 'Wie würdest du dich',
    questionAccent: 'identifizieren?',
    type: 'iconSelect',
    iconOptions: [
      { label: 'Mann',                       icon: 'male-outline'        },
      { label: 'Frau',                       icon: 'female-outline'      },
      { label: 'Non-binary',                 icon: 'male-female-outline' },
      { label: 'Möchte ich nicht angeben'  },
    ],
  },
  { key: 'height_cm', question: 'Wie',    questionAccent: 'groß bist du?', type: 'height' },
  { key: 'weight_kg', question: 'Wie',    questionAccent: 'viel wiegst du?', type: 'weight' },
  {
    key: 'fitness_level',
    question: 'Wie würdest du dein',
    questionAccent: 'Fitnesslevel bewerten?',
    type: 'levelSelect',
    iconOptions: [
      { label: 'Anfänger',      subtitle: 'Du hast gerade erst angefangen',           ringPercent: 25  },
      { label: 'Fortgeschritten', subtitle: 'Du trainierst regelmäßig — 1 bis 3 Jahre', ringPercent: 50  },
      { label: 'Profi',         subtitle: 'Du trainierst ernsthaft — 3+ Jahre',       ringPercent: 75  },
      { label: 'Elite',         subtitle: 'Wettkampfsport oder Profi',                ringPercent: 100 },
    ],
  },
];

interface StepOption {
  label: string;
  subtitle?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  ringPercent?: number;
}
interface Step {
  key:      string;
  question: string;
  questionAccent?: string;
  hint?:    string;
  type:     'select' | 'slider' | 'iconSelect' | 'levelSelect' | 'height' | 'weight' | 'daySelect';
  options?: string[];
  iconOptions?: StepOption[];
  min?:     number;
  max?:     number;
  unit?:    string;
}

// ── Day selection step — inserted after days_per_week in every plan ────────
const DAY_SELECT_EN: Step = {
  key: 'training_days',
  question: 'Now pick your',
  questionAccent: 'training days',
  type: 'daySelect',
};
const DAY_SELECT_DE: Step = {
  key: 'training_days',
  question: 'Wähle jetzt deine',
  questionAccent: 'Trainingstage',
  type: 'daySelect',
};

const DAY_LABELS_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_LABELS_DE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

// ── Shared building blocks ───────────────────────────────────────────────────
const INJURIES_EN: StepOption[] = [
  { label: 'None — I feel fine',   icon: 'checkmark-circle-outline' },
  { label: 'Lower back pain',      icon: 'body-outline'             },
  { label: 'Knee pain',            icon: 'walk-outline'             },
  { label: 'Shoulder pain',        icon: 'hand-left-outline'        },
  { label: 'Something else',       icon: 'help-circle-outline'      },
];

const EQUIPMENT_EN: StepOption[] = [
  { label: 'Full gym',         icon: 'barbell-outline'  },
  { label: 'Home gym',         icon: 'home-outline'     },
  { label: 'Dumbbells only',   icon: 'fitness-outline'  },
  { label: 'Bodyweight only',  icon: 'body-outline'     },
];

// ── English steps ─────────────────────────────────────────────────────────────

const EN: Record<string, Step[]> = {

  'FAT LOSS': [
    { key: 'goal', question: 'What is your', questionAccent: 'main reason?', type: 'iconSelect',
      iconOptions: [
        { label: 'Feel healthier',     icon: 'heart-outline'    },
        { label: 'Look better',        icon: 'sparkles-outline' },
        { label: 'Special event',      icon: 'calendar-outline' },
        { label: 'More energy',        icon: 'flash-outline'    },
      ]},
    { key: 'diet', question: 'How is your current', questionAccent: 'diet?', type: 'iconSelect',
      iconOptions: [
        { label: 'Lots of takeaways',  icon: 'fast-food-outline'  },
        { label: 'Average',            icon: 'restaurant-outline' },
        { label: 'Mostly healthy',     icon: 'leaf-outline'       },
        { label: 'Very clean',         icon: 'nutrition-outline'  },
      ]},
    { key: 'days_per_week', question: 'How many days per week', questionAccent: 'can you train?', type: 'slider', min: 2, max: 6, unit: ' days' },
    { key: 'equipment',     question: 'What do you', questionAccent: 'train with?', type: 'iconSelect', iconOptions: EQUIPMENT_EN },
    { key: 'injuries',      question: 'Any pain or', questionAccent: 'injuries?',   type: 'iconSelect', iconOptions: INJURIES_EN },
  ],

  'HYPERTROPHY': [
    { key: 'muscle_goal', question: 'Your main', questionAccent: 'muscle goal?', type: 'iconSelect',
      iconOptions: [
        { label: 'Overall size',    icon: 'expand-outline'     },
        { label: 'Raw strength',    icon: 'flash-outline'      },
        { label: 'Upper body',      icon: 'chevron-up-outline' },
        { label: 'Lower body',      icon: 'chevron-down-outline' },
      ]},
    { key: 'weak_spot', question: 'Which group do you want to', questionAccent: 'grow most?', type: 'iconSelect',
      iconOptions: [
        { label: 'Arms',     icon: 'barbell-outline' },
        { label: 'Chest',    icon: 'body-outline'    },
        { label: 'Back',     icon: 'square-outline'  },
        { label: 'Legs',     icon: 'walk-outline'    },
        { label: 'Shoulders',icon: 'triangle-outline'},
      ]},
    { key: 'days_per_week', question: 'How many days per week', questionAccent: 'can you lift?', type: 'slider', min: 3, max: 6, unit: ' days' },
    { key: 'equipment',     question: 'What equipment', questionAccent: 'do you have?', type: 'iconSelect', iconOptions: EQUIPMENT_EN },
    { key: 'injuries',      question: 'Any pain or', questionAccent: 'injuries?',       type: 'iconSelect', iconOptions: INJURIES_EN },
  ],

  'TRANSFORMATION': [
    { key: 'transform_goal', question: 'After 90 days, you want to be', questionAccent: 'more...', type: 'iconSelect',
      iconOptions: [
        { label: 'Leaner',         icon: 'flame-outline'    },
        { label: 'More muscular',  icon: 'barbell-outline'  },
        { label: 'Fitter',         icon: 'flash-outline'    },
        { label: 'All of it',      icon: 'rocket-outline'   },
      ]},
    { key: 'diet_willing', question: 'Ready to improve your', questionAccent: 'diet too?', type: 'iconSelect',
      iconOptions: [
        { label: 'Yes, fully',      icon: 'checkmark-circle-outline' },
        { label: 'A little',        icon: 'remove-circle-outline'    },
        { label: 'Just the training', icon: 'close-circle-outline'  },
      ]},
    { key: 'days_per_week', question: 'How many days per week', questionAccent: 'can you train?', type: 'slider', min: 3, max: 6, unit: ' days' },
    { key: 'equipment',     question: 'What do you', questionAccent: 'train with?', type: 'iconSelect', iconOptions: EQUIPMENT_EN },
    { key: 'injuries',      question: 'Any pain or', questionAccent: 'injuries?',   type: 'iconSelect', iconOptions: INJURIES_EN },
  ],

  'FIRST STEPS': [
    { key: 'why_start', question: 'What pushed you to', questionAccent: 'start now?', type: 'iconSelect',
      iconOptions: [
        { label: 'Be healthier',         icon: 'heart-outline'     },
        { label: 'More daily energy',    icon: 'flash-outline'     },
        { label: 'Doctor recommended',   icon: 'medkit-outline'    },
        { label: 'Feel better in myself',icon: 'happy-outline'     },
      ]},
    { key: 'biggest_fear', question: 'What worries', questionAccent: 'you most?', type: 'iconSelect',
      iconOptions: [
        { label: 'Looking silly',        icon: 'eye-outline'        },
        { label: 'Not being fit enough', icon: 'pulse-outline'      },
        { label: 'No time',              icon: 'time-outline'       },
        { label: 'Giving up',            icon: 'trending-down-outline' },
      ]},
    { key: 'days_per_week', question: 'How many days feel', questionAccent: 'manageable?', hint: 'Starting with 2–3 days is totally fine', type: 'slider', min: 2, max: 4, unit: ' days' },
    { key: 'equipment',     question: 'What do you', questionAccent: 'have access to?', type: 'iconSelect', iconOptions: EQUIPMENT_EN },
    { key: 'injuries',      question: 'Any pain we', questionAccent: 'should know?',    type: 'iconSelect', iconOptions: INJURIES_EN },
  ],

  'NO GYM': [
    { key: 'home_preference', question: 'What type of training do you', questionAccent: 'enjoy most?', type: 'iconSelect',
      iconOptions: [
        { label: 'Strength',   icon: 'barbell-outline'  },
        { label: 'Cardio',     icon: 'flame-outline'    },
        { label: 'Low impact', icon: 'leaf-outline'     },
        { label: 'A mix',      icon: 'shuffle-outline'  },
      ]},
    { key: 'home_space', question: 'What is your', questionAccent: 'home setup?', type: 'iconSelect',
      iconOptions: [
        { label: 'Small, no equipment',    icon: 'bed-outline'        },
        { label: 'Small with dumbbells',   icon: 'fitness-outline'    },
        { label: 'Good space, some gear',  icon: 'home-outline'       },
        { label: 'Full home gym',          icon: 'barbell-outline'    },
      ]},
    { key: 'days_per_week', question: 'How many days per week', questionAccent: 'at home?', type: 'slider', min: 2, max: 6, unit: ' days' },
    { key: 'injuries',      question: 'Any pain or', questionAccent: 'injuries?', type: 'iconSelect', iconOptions: INJURIES_EN },
  ],

  'POOL': [
    { key: 'swim_goal', question: 'Your', questionAccent: 'swimming goal?', type: 'iconSelect',
      iconOptions: [
        { label: 'Get fitter',          icon: 'pulse-outline'   },
        { label: 'Improve technique',   icon: 'trophy-outline'  },
        { label: 'Joint-friendly cardio', icon: 'leaf-outline' },
        { label: 'Compete / open water',icon: 'flag-outline'    },
      ]},
    { key: 'stroke', question: 'Your main', questionAccent: 'stroke?', type: 'iconSelect',
      iconOptions: [
        { label: 'Freestyle',     icon: 'water-outline'     },
        { label: 'Breaststroke',  icon: 'repeat-outline'    },
        { label: 'Backstroke',    icon: 'arrow-back-outline'},
        { label: 'Dolphin (butterfly)', icon: 'fish-outline' },
        { label: 'Mix of all',    icon: 'shuffle-outline'   },
      ]},
    { key: 'days_per_week', question: 'How many pool sessions', questionAccent: 'per week?', type: 'slider', min: 2, max: 5, unit: ' days' },
    { key: 'pool_access',  question: 'What pool can you', questionAccent: 'access?', type: 'iconSelect',
      iconOptions: [
        { label: 'Public pool',   icon: 'business-outline' },
        { label: 'Private pool',  icon: 'home-outline'     },
        { label: 'Open water',    icon: 'water-outline'    },
      ]},
    { key: 'injuries',      question: 'Any pain or', questionAccent: 'injuries?', type: 'iconSelect', iconOptions: INJURIES_EN },
  ],

  'RACE READY': [
    { key: 'race_timing', question: 'When is your', questionAccent: 'next Hyrox?', type: 'iconSelect',
      iconOptions: [
        { label: 'Within 3 months',  icon: 'alarm-outline'    },
        { label: '3 to 6 months',    icon: 'calendar-outline' },
        { label: 'Over 6 months',    icon: 'hourglass-outline'},
        { label: 'None planned',     icon: 'help-circle-outline' },
      ]},
    { key: 'hyrox_experience', question: 'How much', questionAccent: 'Hyrox experience?', type: 'iconSelect',
      iconOptions: [
        { label: 'First timer',        icon: 'rocket-outline'  },
        { label: 'Watched one',        icon: 'eye-outline'     },
        { label: 'Done 1 or 2',        icon: 'medal-outline'   },
        { label: 'Multiple races',     icon: 'trophy-outline'  },
      ]},
    { key: 'days_per_week', question: 'How many days per week', questionAccent: 'can you train?', type: 'slider', min: 3, max: 6, unit: ' days' },
    { key: 'equipment',     question: 'What equipment', questionAccent: 'do you have?', type: 'iconSelect', iconOptions: EQUIPMENT_EN },
    { key: 'injuries',      question: 'Any pain or', questionAccent: 'injuries?',       type: 'iconSelect', iconOptions: INJURIES_EN },
  ],

  'HALF OR FULL': [
    { key: 'race_distance', question: 'What are you', questionAccent: 'training for?', type: 'iconSelect',
      iconOptions: [
        { label: 'Half marathon (21 km)',  icon: 'walk-outline'    },
        { label: 'Full marathon (42 km)',  icon: 'trophy-outline'  },
        { label: 'Both',                   icon: 'medal-outline'   },
        { label: 'Not sure yet',           icon: 'help-circle-outline' },
      ]},
    { key: 'race_date', question: 'When is your', questionAccent: 'race?', type: 'iconSelect',
      iconOptions: [
        { label: 'Within 3 months',  icon: 'alarm-outline'    },
        { label: '3 to 6 months',    icon: 'calendar-outline' },
        { label: 'Over 6 months',    icon: 'hourglass-outline'},
        { label: 'No race yet',      icon: 'help-circle-outline' },
      ]},
    { key: 'days_per_week', question: 'How many running days', questionAccent: 'per week?', type: 'slider', min: 3, max: 6, unit: ' days' },
    { key: 'long_run_km',   question: 'Your longest run', questionAccent: 'so far?', hint: 'In kilometres', type: 'slider', min: 3, max: 30, unit: ' km' },
    { key: 'injuries',      question: 'Any pain or', questionAccent: 'injuries?', type: 'iconSelect', iconOptions: INJURIES_EN },
  ],

  'FUNCTIONAL': [
    { key: 'weak_area', question: 'What is your', questionAccent: 'weakest area?', type: 'iconSelect',
      iconOptions: [
        { label: 'Lifting',      icon: 'barbell-outline'  },
        { label: 'Gymnastics',   icon: 'body-outline'     },
        { label: 'Cardio',       icon: 'pulse-outline'    },
        { label: 'All equal',    icon: 'swap-horizontal-outline' },
      ]},
    { key: 'cf_experience', question: 'Your', questionAccent: 'CrossFit experience?', type: 'iconSelect',
      iconOptions: [
        { label: 'Brand new',         icon: 'rocket-outline' },
        { label: 'Tried a few times', icon: 'flash-outline'  },
        { label: 'Regular athlete',   icon: 'trophy-outline' },
      ]},
    { key: 'days_per_week', question: 'How many days per week', questionAccent: 'can you WOD?', type: 'slider', min: 3, max: 6, unit: ' days' },
    { key: 'equipment',     question: 'What box or', questionAccent: 'gym do you have?', type: 'iconSelect', iconOptions: EQUIPMENT_EN },
    { key: 'injuries',      question: 'Any pain or', questionAccent: 'injuries?',         type: 'iconSelect', iconOptions: INJURIES_EN },
  ],

  'HIGH INTENSITY': [
    { key: 'hiit_reason', question: 'Why do you want', questionAccent: 'HIIT?', type: 'iconSelect',
      iconOptions: [
        { label: 'Burn fat fast',      icon: 'flame-outline' },
        { label: 'Workout in less time', icon: 'time-outline' },
        { label: 'Heart health',       icon: 'heart-outline' },
        { label: 'Just fun',           icon: 'happy-outline' },
      ]},
    { key: 'motivation_style', question: 'What keeps you', questionAccent: 'going?', type: 'iconSelect',
      iconOptions: [
        { label: 'Music',       icon: 'musical-notes-outline' },
        { label: 'Timer',       icon: 'timer-outline'         },
        { label: 'Competition', icon: 'trophy-outline'        },
        { label: 'The finish',  icon: 'flag-outline'          },
      ]},
    { key: 'days_per_week', question: 'How many HIIT sessions', questionAccent: 'per week?', hint: '3–4 days is plenty', type: 'slider', min: 2, max: 5, unit: ' days' },
    { key: 'equipment',     question: 'What do you', questionAccent: 'have?', type: 'iconSelect', iconOptions: EQUIPMENT_EN },
    { key: 'injuries',      question: 'Any pain or', questionAccent: 'injuries?', type: 'iconSelect', iconOptions: INJURIES_EN },
  ],
};

const EN_DEFAULT: Step[] = [
  { key: 'goal', question: 'Your main', questionAccent: 'goal?', type: 'iconSelect',
    iconOptions: [
      { label: 'Build muscle',  icon: 'barbell-outline' },
      { label: 'Lose fat',      icon: 'flame-outline'   },
      { label: 'Get fitter',    icon: 'pulse-outline'   },
      { label: 'Stay active',   icon: 'happy-outline'   },
    ]},
  { key: 'days_per_week', question: 'How many days per week', questionAccent: 'can you train?', type: 'slider', min: 2, max: 6, unit: ' days' },
  { key: 'equipment',     question: 'What do you', questionAccent: 'train with?', type: 'iconSelect', iconOptions: EQUIPMENT_EN },
  { key: 'injuries',      question: 'Any pain or', questionAccent: 'injuries?',   type: 'iconSelect', iconOptions: INJURIES_EN },
];

// ── German steps ──────────────────────────────────────────────────────────────

const INJURIES_DE: StepOption[] = [
  { label: 'Keine',              icon: 'checkmark-circle-outline' },
  { label: 'Rückenschmerzen',    icon: 'body-outline'             },
  { label: 'Knieschmerzen',      icon: 'walk-outline'             },
  { label: 'Schulterschmerzen',  icon: 'hand-left-outline'        },
  { label: 'Etwas anderes',      icon: 'help-circle-outline'      },
];

const EQUIPMENT_DE: StepOption[] = [
  { label: 'Volles Gym',       icon: 'barbell-outline'  },
  { label: 'Heimstudio',       icon: 'home-outline'     },
  { label: 'Nur Kurzhanteln',  icon: 'fitness-outline'  },
  { label: 'Nur Körpergewicht',icon: 'body-outline'     },
];

const DE: Record<string, Step[]> = {

  'FAT LOSS': [
    { key: 'goal', question: 'Was ist dein', questionAccent: 'Hauptgrund?', type: 'iconSelect',
      iconOptions: [
        { label: 'Gesünder werden',   icon: 'heart-outline'    },
        { label: 'Besser aussehen',   icon: 'sparkles-outline' },
        { label: 'Besonderes Event',  icon: 'calendar-outline' },
        { label: 'Mehr Energie',      icon: 'flash-outline'    },
      ]},
    { key: 'diet', question: 'Wie ist deine', questionAccent: 'Ernährung?', type: 'iconSelect',
      iconOptions: [
        { label: 'Viel Fast Food',     icon: 'fast-food-outline'  },
        { label: 'Durchschnittlich',   icon: 'restaurant-outline' },
        { label: 'Meist gesund',       icon: 'leaf-outline'       },
        { label: 'Sehr sauber',        icon: 'nutrition-outline'  },
      ]},
    { key: 'days_per_week', question: 'Wie viele Tage pro Woche', questionAccent: 'kannst du?', type: 'slider', min: 2, max: 6, unit: ' Tage' },
    { key: 'equipment',     question: 'Womit', questionAccent: 'trainierst du?', type: 'iconSelect', iconOptions: EQUIPMENT_DE },
    { key: 'injuries',      question: 'Schmerzen oder', questionAccent: 'Verletzungen?', type: 'iconSelect', iconOptions: INJURIES_DE },
  ],

  'HYPERTROPHY': [
    { key: 'muscle_goal', question: 'Dein Haupt-', questionAccent: 'Muskelziel?', type: 'iconSelect',
      iconOptions: [
        { label: 'Mehr Masse',     icon: 'expand-outline'     },
        { label: 'Mehr Kraft',     icon: 'flash-outline'      },
        { label: 'Oberkörper',     icon: 'chevron-up-outline' },
        { label: 'Unterkörper',    icon: 'chevron-down-outline' },
      ]},
    { key: 'weak_spot', question: 'Welche Gruppe soll', questionAccent: 'wachsen?', type: 'iconSelect',
      iconOptions: [
        { label: 'Arme',     icon: 'barbell-outline' },
        { label: 'Brust',    icon: 'body-outline'    },
        { label: 'Rücken',   icon: 'square-outline'  },
        { label: 'Beine',    icon: 'walk-outline'    },
        { label: 'Schultern',icon: 'triangle-outline'},
      ]},
    { key: 'days_per_week', question: 'Wie viele Tage pro Woche', questionAccent: 'kannst du?', type: 'slider', min: 3, max: 6, unit: ' Tage' },
    { key: 'equipment',     question: 'Welches', questionAccent: 'Equipment hast du?', type: 'iconSelect', iconOptions: EQUIPMENT_DE },
    { key: 'injuries',      question: 'Schmerzen oder', questionAccent: 'Verletzungen?',  type: 'iconSelect', iconOptions: INJURIES_DE },
  ],

  'TRANSFORMATION': [
    { key: 'transform_goal', question: 'Nach 90 Tagen willst du', questionAccent: 'sein...', type: 'iconSelect',
      iconOptions: [
        { label: 'Schlanker',      icon: 'flame-outline'    },
        { label: 'Muskulöser',     icon: 'barbell-outline'  },
        { label: 'Fitter',         icon: 'flash-outline'    },
        { label: 'Alles davon',    icon: 'rocket-outline'   },
      ]},
    { key: 'diet_willing', question: 'Bereit, auch die', questionAccent: 'Ernährung zu verbessern?', type: 'iconSelect',
      iconOptions: [
        { label: 'Ja, voll dabei',      icon: 'checkmark-circle-outline' },
        { label: 'Etwas',               icon: 'remove-circle-outline'    },
        { label: 'Erstmal nur Training',icon: 'close-circle-outline'     },
      ]},
    { key: 'days_per_week', question: 'Wie viele Tage pro Woche', questionAccent: 'kannst du?', type: 'slider', min: 3, max: 6, unit: ' Tage' },
    { key: 'equipment',     question: 'Womit', questionAccent: 'trainierst du?', type: 'iconSelect', iconOptions: EQUIPMENT_DE },
    { key: 'injuries',      question: 'Schmerzen oder', questionAccent: 'Verletzungen?', type: 'iconSelect', iconOptions: INJURIES_DE },
  ],

  'FIRST STEPS': [
    { key: 'why_start', question: 'Warum willst du', questionAccent: 'jetzt starten?', type: 'iconSelect',
      iconOptions: [
        { label: 'Gesünder werden',     icon: 'heart-outline'     },
        { label: 'Mehr Energie',        icon: 'flash-outline'     },
        { label: 'Arzt empfahl es',     icon: 'medkit-outline'    },
        { label: 'Mich besser fühlen',  icon: 'happy-outline'     },
      ]},
    { key: 'biggest_fear', question: 'Was bereitet dir', questionAccent: 'Sorgen?', type: 'iconSelect',
      iconOptions: [
        { label: 'Dumm aussehen',     icon: 'eye-outline'           },
        { label: 'Nicht fit genug',   icon: 'pulse-outline'         },
        { label: 'Keine Zeit',        icon: 'time-outline'          },
        { label: 'Aufgeben',          icon: 'trending-down-outline' },
      ]},
    { key: 'days_per_week', question: 'Wie viele Tage fühlen sich', questionAccent: 'machbar an?', hint: '2–3 Tage sind völlig OK', type: 'slider', min: 2, max: 4, unit: ' Tage' },
    { key: 'equipment',     question: 'Was hast du', questionAccent: 'zur Verfügung?', type: 'iconSelect', iconOptions: EQUIPMENT_DE },
    { key: 'injuries',      question: 'Schmerzen, die wir', questionAccent: 'kennen sollten?', type: 'iconSelect', iconOptions: INJURIES_DE },
  ],

  'NO GYM': [
    { key: 'home_preference', question: 'Welches Training', questionAccent: 'magst du?', type: 'iconSelect',
      iconOptions: [
        { label: 'Kraft',         icon: 'barbell-outline'  },
        { label: 'Cardio',        icon: 'flame-outline'    },
        { label: 'Gelenkschonend',icon: 'leaf-outline'     },
        { label: 'Ein Mix',       icon: 'shuffle-outline'  },
      ]},
    { key: 'home_space', question: 'Dein', questionAccent: 'Heimsetup?', type: 'iconSelect',
      iconOptions: [
        { label: 'Wenig Platz, nichts',   icon: 'bed-outline'     },
        { label: 'Wenig Platz, Hanteln',  icon: 'fitness-outline' },
        { label: 'Gut, etwas Equipment',  icon: 'home-outline'    },
        { label: 'Volles Heimstudio',     icon: 'barbell-outline' },
      ]},
    { key: 'days_per_week', question: 'Wie viele Tage pro Woche', questionAccent: 'zu Hause?', type: 'slider', min: 2, max: 6, unit: ' Tage' },
    { key: 'injuries',      question: 'Schmerzen oder', questionAccent: 'Verletzungen?', type: 'iconSelect', iconOptions: INJURIES_DE },
  ],

  'POOL': [
    { key: 'swim_goal', question: 'Dein', questionAccent: 'Schwimmziel?', type: 'iconSelect',
      iconOptions: [
        { label: 'Fitter werden',        icon: 'pulse-outline'   },
        { label: 'Technik verbessern',   icon: 'trophy-outline'  },
        { label: 'Gelenkschonendes Cardio', icon: 'leaf-outline' },
        { label: 'Wettkampf / Freiwasser',icon: 'flag-outline'   },
      ]},
    { key: 'stroke', question: 'Dein Haupt-', questionAccent: 'Stil?', type: 'iconSelect',
      iconOptions: [
        { label: 'Kraul',                icon: 'water-outline'     },
        { label: 'Brust',                icon: 'repeat-outline'    },
        { label: 'Rücken',               icon: 'arrow-back-outline'},
        { label: 'Delphin (Schmetterling)', icon: 'fish-outline'   },
        { label: 'Mix aus allem',        icon: 'shuffle-outline'   },
      ]},
    { key: 'days_per_week', question: 'Wie viele Pool-Einheiten', questionAccent: 'pro Woche?', type: 'slider', min: 2, max: 5, unit: ' Tage' },
    { key: 'pool_access',  question: 'Welches Becken', questionAccent: 'hast du?', type: 'iconSelect',
      iconOptions: [
        { label: 'Öffentliches Bad', icon: 'business-outline' },
        { label: 'Privatpool',       icon: 'home-outline'     },
        { label: 'Freiwasser',       icon: 'water-outline'    },
      ]},
    { key: 'injuries',      question: 'Schmerzen oder', questionAccent: 'Verletzungen?', type: 'iconSelect', iconOptions: INJURIES_DE },
  ],

  'RACE READY': [
    { key: 'race_timing', question: 'Wann ist dein', questionAccent: 'nächstes Hyrox?', type: 'iconSelect',
      iconOptions: [
        { label: 'In 3 Monaten',     icon: 'alarm-outline'    },
        { label: '3 bis 6 Monate',   icon: 'calendar-outline' },
        { label: 'Über 6 Monate',    icon: 'hourglass-outline'},
        { label: 'Noch nicht geplant', icon: 'help-circle-outline' },
      ]},
    { key: 'hyrox_experience', question: 'Wie viel', questionAccent: 'Hyrox-Erfahrung?', type: 'iconSelect',
      iconOptions: [
        { label: 'Neu dabei',        icon: 'rocket-outline'  },
        { label: 'Schon zugeschaut', icon: 'eye-outline'     },
        { label: '1 bis 2 Rennen',   icon: 'medal-outline'   },
        { label: 'Mehrere Rennen',   icon: 'trophy-outline'  },
      ]},
    { key: 'days_per_week', question: 'Wie viele Tage pro Woche', questionAccent: 'trainieren?', type: 'slider', min: 3, max: 6, unit: ' Tage' },
    { key: 'equipment',     question: 'Welches', questionAccent: 'Equipment hast du?', type: 'iconSelect', iconOptions: EQUIPMENT_DE },
    { key: 'injuries',      question: 'Schmerzen oder', questionAccent: 'Verletzungen?',    type: 'iconSelect', iconOptions: INJURIES_DE },
  ],

  'HALF OR FULL': [
    { key: 'race_distance', question: 'Wofür', questionAccent: 'trainierst du?', type: 'iconSelect',
      iconOptions: [
        { label: 'Halbmarathon (21 km)', icon: 'walk-outline'        },
        { label: 'Marathon (42 km)',     icon: 'trophy-outline'      },
        { label: 'Beides',               icon: 'medal-outline'       },
        { label: 'Noch unsicher',        icon: 'help-circle-outline' },
      ]},
    { key: 'race_date', question: 'Wann ist dein', questionAccent: 'Rennen?', type: 'iconSelect',
      iconOptions: [
        { label: 'In 3 Monaten',     icon: 'alarm-outline'    },
        { label: '3 bis 6 Monate',   icon: 'calendar-outline' },
        { label: 'Über 6 Monate',    icon: 'hourglass-outline'},
        { label: 'Noch kein Rennen', icon: 'help-circle-outline' },
      ]},
    { key: 'days_per_week', question: 'Wie viele Lauf-Tage', questionAccent: 'pro Woche?', type: 'slider', min: 3, max: 6, unit: ' Tage' },
    { key: 'long_run_km',   question: 'Dein längster Lauf', questionAccent: 'bisher?', hint: 'In Kilometern', type: 'slider', min: 3, max: 30, unit: ' km' },
    { key: 'injuries',      question: 'Schmerzen oder', questionAccent: 'Verletzungen?', type: 'iconSelect', iconOptions: INJURIES_DE },
  ],

  'FUNCTIONAL': [
    { key: 'weak_area', question: 'Dein', questionAccent: 'schwächster Bereich?', type: 'iconSelect',
      iconOptions: [
        { label: 'Heben',         icon: 'barbell-outline'           },
        { label: 'Turnen',        icon: 'body-outline'              },
        { label: 'Cardio',        icon: 'pulse-outline'             },
        { label: 'Alles gleich',  icon: 'swap-horizontal-outline'   },
      ]},
    { key: 'cf_experience', question: 'Deine', questionAccent: 'CrossFit-Erfahrung?', type: 'iconSelect',
      iconOptions: [
        { label: 'Komplett neu',     icon: 'rocket-outline' },
        { label: 'Paarmal probiert', icon: 'flash-outline'  },
        { label: 'Regelmäßig dabei', icon: 'trophy-outline' },
      ]},
    { key: 'days_per_week', question: 'Wie viele Tage pro Woche', questionAccent: 'für WODs?', type: 'slider', min: 3, max: 6, unit: ' Tage' },
    { key: 'equipment',     question: 'Welche Box', questionAccent: 'oder Gym?', type: 'iconSelect', iconOptions: EQUIPMENT_DE },
    { key: 'injuries',      question: 'Schmerzen oder', questionAccent: 'Verletzungen?', type: 'iconSelect', iconOptions: INJURIES_DE },
  ],

  'HIGH INTENSITY': [
    { key: 'hiit_reason', question: 'Warum', questionAccent: 'HIIT?', type: 'iconSelect',
      iconOptions: [
        { label: 'Fett verbrennen',      icon: 'flame-outline' },
        { label: 'Training in kurzer Zeit', icon: 'time-outline' },
        { label: 'Herzgesundheit',       icon: 'heart-outline' },
        { label: 'Einfach Spaß',         icon: 'happy-outline' },
      ]},
    { key: 'motivation_style', question: 'Was hält dich', questionAccent: 'am Laufen?', type: 'iconSelect',
      iconOptions: [
        { label: 'Musik',          icon: 'musical-notes-outline' },
        { label: 'Timer',          icon: 'timer-outline'         },
        { label: 'Wettbewerb',     icon: 'trophy-outline'        },
        { label: 'Das Ziel',       icon: 'flag-outline'          },
      ]},
    { key: 'days_per_week', question: 'Wie viele HIIT-Einheiten', questionAccent: 'pro Woche?', hint: '3–4 Tage sind genug', type: 'slider', min: 2, max: 5, unit: ' Tage' },
    { key: 'equipment',     question: 'Was hast', questionAccent: 'du?', type: 'iconSelect', iconOptions: EQUIPMENT_DE },
    { key: 'injuries',      question: 'Schmerzen oder', questionAccent: 'Verletzungen?', type: 'iconSelect', iconOptions: INJURIES_DE },
  ],
};

const DE_DEFAULT: Step[] = [
  { key: 'goal', question: 'Dein', questionAccent: 'Hauptziel?', type: 'iconSelect',
    iconOptions: [
      { label: 'Muskeln aufbauen', icon: 'barbell-outline' },
      { label: 'Fett verlieren',   icon: 'flame-outline'   },
      { label: 'Fitter werden',    icon: 'pulse-outline'   },
      { label: 'Aktiv bleiben',    icon: 'happy-outline'   },
    ]},
  { key: 'days_per_week', question: 'Wie viele Tage pro Woche', questionAccent: 'kannst du?', type: 'slider', min: 2, max: 6, unit: ' Tage' },
  { key: 'equipment',     question: 'Womit', questionAccent: 'trainierst du?', type: 'iconSelect', iconOptions: EQUIPMENT_DE },
  { key: 'injuries',      question: 'Schmerzen oder', questionAccent: 'Verletzungen?', type: 'iconSelect', iconOptions: INJURIES_DE },
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
  const categorySteps: Step[] = (category ? byCategory[category] : undefined) ?? defaultSteps;
  const intro = lang === 'de' ? INTRO_DE : INTRO_EN;

  // Inject "pick training days" step right after days_per_week
  const daySelectStep = lang === 'de' ? DAY_SELECT_DE : DAY_SELECT_EN;
  const withDaySelect: Step[] = [];
  for (const s of categorySteps) {
    withDaySelect.push(s);
    if (s.key === 'days_per_week') withDaySelect.push(daySelectStep);
  }
  const STEPS: Step[] = [...intro, ...withDaySelect];

  const dayLabels = lang === 'de' ? DAY_LABELS_DE : DAY_LABELS_EN;
  const { user } = useAuth();

  // Pre-fill from stored user profile when available
  const storedHeight = user?.height_cm ?? null;
  const storedWeight = user?.weight_kg ?? null;

  // Slider initial positions — start at the minimum so user can see the value
  // increasing as they slide up
  const HEIGHT_MIN = 140;
  const WEIGHT_MIN = 40;

  const [step,        setStep]        = useState(0);
  const [answers,     setAnswers]     = useState<Record<string, string | number>>({
    height_cm: storedHeight ?? HEIGHT_MIN,
    weight_kg: storedWeight ?? WEIGHT_MIN,
    ...(user?.gender ? { gender: user.gender } : {}),
  });
  const [loading,     setLoading]     = useState(false);
  const [heightUnit,  setHeightUnit]  = useState<'cm' | 'ft'>('cm');
  const [weightUnit,  setWeightUnit]  = useState<'kg' | 'lbs'>('kg');
  const [touchedKeys, setTouchedKeys] = useState<Set<string>>(() => {
    const init = new Set<string>();
    if (storedHeight != null) init.add('height_cm');
    if (storedWeight != null) init.add('weight_kg');
    if (user?.gender) init.add('gender');
    return init;
  });
  const touch = (key: string) => setTouchedKeys(s => (s.has(key) ? s : new Set(s).add(key)));

  const current    = STEPS[step];
  const total      = STEPS.length;
  const sliderVal  = (answers[current.key] as number) ?? current.min ?? 0;

  // Reset training_days every time user enters the daySelect step,
  // so going back always starts the day picker fresh
  useEffect(() => {
    if (current.type === 'daySelect') {
      setAnswers(a => ({ ...a, training_days: [] as any }));
    }
  }, [step, current.type]);

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

  const cancel = () => {
    const msg = lang === 'de'
      ? 'Fortschritt verwerfen und zurück zur Startseite?'
      : 'Discard progress and go back home?';
    const leave = () => router.replace('/(tabs)');
    const hasAnswers = Object.keys(answers).length > 2; // height+weight defaults don't count
    if (!hasAnswers) return leave();
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) leave();
    } else {
      Alert.alert('', msg, [
        { text: lang === 'de' ? 'Abbrechen' : 'Cancel', style: 'cancel' },
        { text: lang === 'de' ? 'Verlassen' : 'Leave', style: 'destructive', onPress: leave },
      ]);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* Top bar — X close button, always visible, can't miss */}
      <View style={s.topBar}>
        <View style={{ flex: 1 }}>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${((step + 1) / total) * 100}%` as any, backgroundColor: diffColor }]} />
          </View>
        </View>
        <TouchableOpacity style={[s.close, { borderColor: diffColor, backgroundColor: diffColor + '15' }]} onPress={cancel} hitSlop={16} activeOpacity={0.7}>
          <Ionicons name="close" size={22} color={diffColor} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Question — Ochy style with accent word */}
        <Text style={s.question}>
          {current.question}
          {current.questionAccent && <> <Text style={[s.questionAccent, { color: diffColor }]}>{current.questionAccent}</Text></>}
        </Text>
        {current.hint && <Text style={s.hint}>{current.hint}</Text>}

        {/* Icon select — gender screen */}
        {current.type === 'iconSelect' && (
          <View style={s.iconOptions}>
            {current.iconOptions!.map(opt => {
              const active = answers[current.key] === opt.label;
              return (
                <TouchableOpacity
                  key={opt.label}
                  style={[s.iconOption, active && { borderColor: diffColor, backgroundColor: diffColor + '10' }]}
                  onPress={() => answer(opt.label)}
                  activeOpacity={0.75}
                >
                  {opt.icon && <Ionicons name={opt.icon} size={22} color={active ? diffColor : colors.text} style={{ width: 26 }} />}
                  {!opt.icon && <View style={{ width: 26 }} />}
                  <Text style={[s.iconOptionText, active && { color: diffColor, fontWeight: '700' }]}>{opt.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={active ? diffColor : colors.muted} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Level select — fitness level with ring indicator */}
        {current.type === 'levelSelect' && (
          <View style={s.iconOptions}>
            {current.iconOptions!.map(opt => {
              const active = answers[current.key] === opt.label;
              return (
                <TouchableOpacity
                  key={opt.label}
                  style={[s.levelOption, active && { borderColor: diffColor, backgroundColor: diffColor + '10' }]}
                  onPress={() => answer(opt.label)}
                  activeOpacity={0.75}
                >
                  <LevelRing percent={opt.ringPercent ?? 25} color={diffColor} />
                  <View style={s.levelText}>
                    <Text style={[s.levelLabel, active && { color: diffColor }]}>{opt.label}</Text>
                    <Text style={s.levelSubtitle}>{opt.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={active ? diffColor : colors.muted} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Day select — pick specific training days, constrained to days_per_week count */}
        {current.type === 'daySelect' && (() => {
          const needed = (answers.days_per_week as number) ?? 3;
          const selected: string[] = (answers.training_days as unknown as string[]) ?? [];
          const remaining = needed - selected.length;
          return (
            <>
              <Text style={[s.dayCounter, { color: diffColor }]}>
                {remaining > 0
                  ? (lang === 'de'
                      ? `Wähle noch ${remaining} ${remaining === 1 ? 'Tag' : 'Tage'} (${selected.length}/${needed})`
                      : `Pick ${remaining} more ${remaining === 1 ? 'day' : 'days'} (${selected.length}/${needed})`)
                  : (lang === 'de'
                      ? `Perfekt! ${needed} Tage gewählt`
                      : `Perfect! ${needed} days selected`)
                }
              </Text>
              <View style={s.dayList}>
                {dayLabels.map(day => {
                  const active = selected.includes(day);
                  const locked = !active && remaining <= 0;
                  return (
                    <TouchableOpacity
                      key={day}
                      style={[
                        s.dayRow,
                        active && { borderColor: diffColor, backgroundColor: diffColor + '10' },
                        locked && { opacity: 0.4 },
                      ]}
                      onPress={() => {
                        if (locked) return;
                        const next = active
                          ? selected.filter(d => d !== day)
                          : [...selected, day];
                        setAnswers(a => ({ ...a, training_days: next as any }));
                      }}
                      activeOpacity={0.7}
                      disabled={locked}
                    >
                      <Text style={[s.dayLabel, active && { color: diffColor, fontWeight: '700' }]}>{day}</Text>
                      {active
                        ? <Ionicons name="checkmark-circle" size={20} color={diffColor} />
                        : <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                      }
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          );
        })()}

        {/* Height picker — cm/ft toggle + value */}
        {current.type === 'height' && (
          <View style={s.measureWrap}>
            <View style={s.unitToggle}>
              {(['cm', 'ft'] as const).map(u => (
                <TouchableOpacity key={u} style={[s.unitBtn, heightUnit === u && { backgroundColor: colors.card2, borderColor: diffColor }]} onPress={() => setHeightUnit(u)}>
                  <Text style={[s.unitText, heightUnit === u && { color: diffColor, fontWeight: '700' }]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.measureDisplay}>
              <Text style={[s.measureVal, { color: touchedKeys.has('height_cm') ? diffColor : colors.muted }]}>
                {heightUnit === 'cm'
                  ? Math.round(answers.height_cm as number)
                  : `${Math.floor((answers.height_cm as number) / 30.48)}'${Math.round(((answers.height_cm as number) / 2.54) % 12)}"`}
              </Text>
              <Text style={s.measureUnit}>{heightUnit}</Text>
            </View>
            <Slider
              style={s.measureSlider}
              minimumValue={140}
              maximumValue={210}
              step={1}
              value={answers.height_cm as number}
              minimumTrackTintColor={diffColor}
              maximumTrackTintColor={colors.border}
              thumbTintColor={diffColor}
              onValueChange={val => { touch('height_cm'); setAnswers(a => ({ ...a, height_cm: val })); }}
            />
          </View>
        )}

        {/* Weight picker — kg/lbs toggle + value */}
        {current.type === 'weight' && (
          <View style={s.measureWrap}>
            <View style={s.unitToggle}>
              {(['kg', 'lbs'] as const).map(u => (
                <TouchableOpacity key={u} style={[s.unitBtn, weightUnit === u && { backgroundColor: colors.card2, borderColor: diffColor }]} onPress={() => setWeightUnit(u)}>
                  <Text style={[s.unitText, weightUnit === u && { color: diffColor, fontWeight: '700' }]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.measureDisplay}>
              <Text style={[s.measureVal, { color: touchedKeys.has('weight_kg') ? diffColor : colors.muted }]}>
                {weightUnit === 'kg'
                  ? Math.round(answers.weight_kg as number)
                  : Math.round((answers.weight_kg as number) * 2.20462)}
              </Text>
              <Text style={s.measureUnit}>{weightUnit}</Text>
            </View>
            <Slider
              style={s.measureSlider}
              minimumValue={40}
              maximumValue={150}
              step={1}
              value={answers.weight_kg as number}
              minimumTrackTintColor={diffColor}
              maximumTrackTintColor={colors.border}
              thumbTintColor={diffColor}
              onValueChange={val => { touch('weight_kg'); setAnswers(a => ({ ...a, weight_kg: val })); }}
            />
          </View>
        )}

        {/* Select options */}
        {current.type === 'select' && (
          <View style={s.options}>
            {current.options!.map(opt => {
              const active = answers[current.key] === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[s.option, active && { borderColor: diffColor, backgroundColor: diffColor + '15' }]}
                  onPress={() => answer(opt)}
                >
                  <Text style={[s.optionText, active && { color: diffColor, fontWeight: '700' }]}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Slider */}
        {current.type === 'slider' && (
          <View style={s.sliderWrap}>
            <View style={s.sliderDisplay}>
              <Text style={[s.sliderVal, { color: touchedKeys.has(current.key) ? diffColor : colors.muted }]}>
                {sliderVal}
              </Text>
              <Text style={s.sliderUnit}>{current.unit}</Text>
            </View>
            <Slider
              style={s.slider}
              minimumValue={current.min}
              maximumValue={current.max}
              step={1}
              value={sliderVal}
              minimumTrackTintColor={diffColor}
              maximumTrackTintColor={colors.border}
              thumbTintColor={diffColor}
              onValueChange={val => { touch(current.key); setAnswers(a => ({ ...a, [current.key]: val })); }}
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
            <TouchableOpacity
              style={[s.back, { borderColor: diffColor, backgroundColor: diffColor + '10' }]}
              onPress={() => setStep(s => s - 1)}
            >
              <Text style={[s.backText, { color: diffColor }]}>{tr('form_back')}</Text>
            </TouchableOpacity>
          )}
          {(() => {
            // Validate current step: must have a real answer
            const isSlider = current.type === 'slider' || current.type === 'height' || current.type === 'weight';
            const isDaySelect = current.type === 'daySelect';
            const isChoice = current.type === 'iconSelect' || current.type === 'levelSelect' || current.type === 'select';

            const isAnswered =
              isDaySelect
                ? ((answers.training_days as unknown as string[])?.length ?? 0) === ((answers.days_per_week as number) ?? 3)
                : isSlider
                  ? touchedKeys.has(current.key)
                  : isChoice
                    ? answers[current.key] != null
                    : true;

            const isLast = step === total - 1;

            // For sliders, day select, and the FINAL step: render an explicit Next/Build button
            // (choice steps on non-final rely on auto-advance, so no button is shown)
            if (!isSlider && !isDaySelect && !isLast) return null;

            return (
              <TouchableOpacity
                style={[s.cta, { backgroundColor: diffColor }, (!isAnswered || loading) && s.disabled]}
                onPress={() => {
                  if (!isAnswered || loading) return;
                  if (isLast) submit();
                  else setStep(st => st + 1);
                }}
                disabled={!isAnswered || loading}
              >
                <Text style={s.ctaText}>
                  {isLast
                    ? (loading ? tr('form_building') : tr('form_build'))
                    : tr('form_next')}
                </Text>
              </TouchableOpacity>
            );
          })()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: colors.bg },
  topBar:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, gap: 14 },
  progressBar:      { height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' },
  progressFill:     { height: 4, backgroundColor: colors.accent, borderRadius: 2 },
  close:            {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: colors.card,
    borderWidth:     1,
    borderColor:     colors.border,
    alignItems:      'center',
    justifyContent:  'center',
  },
  scroll:           { padding: 24, paddingTop: 24, paddingBottom: 48 },
  question:         { fontSize: 24, fontWeight: '800', color: colors.text, lineHeight: 32, marginBottom: 6, textAlign: 'center' },
  questionAccent:   {},
  hint:             { fontSize: 13, color: colors.muted, lineHeight: 18, marginBottom: 24, textAlign: 'center' },

  // Icon select (gender)
  iconOptions:      { gap: 10, marginTop: 32 },
  iconOption:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0d0d0d', borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 16, gap: 14 },
  iconOptionText:   { flex: 1, fontSize: 16, color: colors.text, fontWeight: '500' },

  // Level select (fitness level with ring)
  levelOption:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0d0d0d', borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 14, gap: 14 },
  levelText:        { flex: 1 },
  levelLabel:       { fontSize: 16, color: colors.text, fontWeight: '700', marginBottom: 2 },
  levelSubtitle:    { fontSize: 12, color: colors.muted, lineHeight: 16 },

  // Day select
  dayCounter:       { fontSize: 13, fontWeight: '700', textAlign: 'center', marginTop: 16, marginBottom: 16 },
  dayList:          { gap: 8 },
  dayRow:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0d0d0d', borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 16 },
  dayLabel:         { fontSize: 16, color: colors.text, fontWeight: '500' },

  // Height/weight measure
  measureWrap:      { alignItems: 'center', marginTop: 24 },
  unitToggle:       { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 10, padding: 4, marginBottom: 40, gap: 4 },
  unitBtn:          { paddingHorizontal: 24, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: 'transparent' },
  unitText:         { fontSize: 13, fontWeight: '600', color: colors.muted },
  measureDisplay:   { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 24 },
  measureVal:       { fontSize: 56, fontWeight: '800', color: colors.text },
  measureUnit:      { fontSize: 18, color: colors.muted, fontWeight: '500' },
  measureSlider:    { width: '100%' as any, height: 40 },

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
  nav:              { flexDirection: 'row', alignItems: 'stretch', marginTop: 32, gap: 12 },
  back:             { flex: 1, borderWidth: 1.5, borderColor: colors.border, borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  backText:         { fontSize: 16, color: colors.text, fontWeight: '700' },
  cta:              { flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  ctaText:          { fontSize: 16, fontWeight: '700', color: '#fff' },
  disabled:         { opacity: 0.6 },
});
