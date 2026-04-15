import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Alert, LayoutChangeEvent, GestureResponderEvent } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { api } from '@/api';
import { colors } from '@/theme';
import { useT } from '@/i18n';

// ── BigSlider ───────────────────────────────────────────────────────────────
// Custom slider built on top of View+touch responders so it renders the same
// on web and native: thick 10-px track, 32-px thumb with white ring, filled
// segment in the accent colour. Much more visible than the platform slider.
interface BigSliderProps {
  value:    number;
  min:      number;
  max:      number;
  step?:    number;
  color:    string;
  onChange: (v: number) => void;
}
function BigSlider({ value, min, max, step = 1, color, onChange }: BigSliderProps) {
  const [width, setWidth] = useState(1);
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const handle = (e: GestureResponderEvent) => {
    const x = e.nativeEvent.locationX;
    const rawPct = Math.max(0, Math.min(1, x / Math.max(width, 1)));
    const raw    = min + rawPct * (max - min);
    const snapped = Math.round(raw / step) * step;
    const clamped = Math.max(min, Math.min(max, snapped));
    if (clamped !== value) onChange(clamped);
  };

  return (
    <View
      style={bs.wrap}
      onLayout={onLayout}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handle}
      onResponderMove={handle}
    >
      <View style={bs.track}>
        <View style={[bs.fill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
      </View>
      <View
        pointerEvents="none"
        style={[
          bs.thumb,
          {
            left:            Math.max(0, pct * width - 16),
            backgroundColor: color,
            shadowColor:     color,
          },
        ]}
      />
    </View>
  );
}
const bs = StyleSheet.create({
  wrap:  { width: '100%' as any, height: 48, justifyContent: 'center', paddingVertical: 4 },
  track: { height: 10, borderRadius: 5, backgroundColor: '#1f1f22', overflow: 'hidden' },
  fill:  { height: 10, borderRadius: 5 },
  thumb: {
    position:      'absolute',
    top:           8,
    width:         32,
    height:        32,
    borderRadius:  16,
    borderWidth:   3,
    borderColor:   '#FFFFFF',
    shadowOpacity: 0.6,
    shadowRadius:  10,
    shadowOffset:  { width: 0, height: 0 },
    elevation:     6,
  },
});
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
    question: 'What is your',
    questionAccent: 'biological physique?',
    type: 'iconSelect',
    iconOptions: [
      { label: 'Male',   icon: 'male-outline'   },
      { label: 'Female', icon: 'female-outline' },
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
    question: 'Was ist dein',
    questionAccent: 'biologischer Körperbau?',
    type: 'iconSelect',
    iconOptions: [
      { label: 'Männlich', icon: 'male-outline'   },
      { label: 'Weiblich', icon: 'female-outline' },
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
  // Sub-points that appear when this option is expanded — all multi-select.
  subOptions?: string[];
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
  // When true, iconSelect allows picking multiple options (no auto-advance).
  multi?:   boolean;
  // When true, the "None/Keine" option is mutually exclusive with the rest.
  exclusiveNone?: boolean;
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
    { key: 'equipment',     question: 'What do you', questionAccent: 'train with?', type: 'iconSelect', multi: true, iconOptions: EQUIPMENT_EN },
    { key: 'injuries',      question: 'Any pain or', questionAccent: 'injuries?',   type: 'iconSelect', multi: true, exclusiveNone: true, iconOptions: INJURIES_EN },
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
    { key: 'equipment',     question: 'What equipment', questionAccent: 'do you have?', type: 'iconSelect', multi: true, iconOptions: EQUIPMENT_EN },
    { key: 'injuries',      question: 'Any pain or', questionAccent: 'injuries?',       type: 'iconSelect', multi: true, exclusiveNone: true, iconOptions: INJURIES_EN },
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
    { key: 'equipment',     question: 'What do you', questionAccent: 'train with?', type: 'iconSelect', multi: true, iconOptions: EQUIPMENT_EN },
    { key: 'injuries',      question: 'Any pain or', questionAccent: 'injuries?',   type: 'iconSelect', multi: true, exclusiveNone: true, iconOptions: INJURIES_EN },
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
    { key: 'equipment',     question: 'What do you', questionAccent: 'have access to?', type: 'iconSelect', multi: true, iconOptions: EQUIPMENT_EN },
    { key: 'injuries',      question: 'Any pain we', questionAccent: 'should know?',    type: 'iconSelect', multi: true, exclusiveNone: true, iconOptions: INJURIES_EN },
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
    { key: 'injuries',      question: 'Any pain or', questionAccent: 'injuries?', type: 'iconSelect', multi: true, exclusiveNone: true, iconOptions: INJURIES_EN },
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
    { key: 'injuries',      question: 'Any pain or', questionAccent: 'injuries?', type: 'iconSelect', multi: true, exclusiveNone: true, iconOptions: INJURIES_EN },
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
    { key: 'equipment',     question: 'What equipment', questionAccent: 'do you have?', type: 'iconSelect', multi: true, iconOptions: EQUIPMENT_EN },
    { key: 'injuries',      question: 'Any pain or', questionAccent: 'injuries?',       type: 'iconSelect', multi: true, exclusiveNone: true, iconOptions: INJURIES_EN },
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
    { key: 'injuries',      question: 'Any pain or', questionAccent: 'injuries?', type: 'iconSelect', multi: true, exclusiveNone: true, iconOptions: INJURIES_EN },
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
    { key: 'equipment',     question: 'What box or', questionAccent: 'gym do you have?', type: 'iconSelect', multi: true, iconOptions: EQUIPMENT_EN },
    { key: 'injuries',      question: 'Any pain or', questionAccent: 'injuries?',         type: 'iconSelect', multi: true, exclusiveNone: true, iconOptions: INJURIES_EN },
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
    { key: 'equipment',     question: 'What do you', questionAccent: 'have?', type: 'iconSelect', multi: true, iconOptions: EQUIPMENT_EN },
    { key: 'injuries',      question: 'Any pain or', questionAccent: 'injuries?', type: 'iconSelect', multi: true, exclusiveNone: true, iconOptions: INJURIES_EN },
  ],

  'MOBILITY': [
    { key: 'mobility_goal', question: 'Why do you want', questionAccent: 'more mobility?', type: 'iconSelect',
      iconOptions: [
        { label: 'Undo desk posture',     icon: 'laptop-outline'    },
        { label: 'Recover from training', icon: 'refresh-outline'   },
        { label: 'Unlock tight muscles',  icon: 'body-outline'      },
        { label: 'Stay flexible as I age',icon: 'heart-outline'     },
      ]},
    { key: 'tight_area', question: 'Your most', questionAccent: 'problematic area?', type: 'iconSelect',
      iconOptions: [
        { label: 'Lower back',          icon: 'body-outline'     },
        { label: 'Hips & glutes',       icon: 'walk-outline'     },
        { label: 'Shoulders & neck',    icon: 'hand-left-outline'},
        { label: 'Hamstrings',          icon: 'fitness-outline'  },
        { label: 'Whole body tight',    icon: 'shuffle-outline'  },
      ]},
    { key: 'using_with', question: 'How will you', questionAccent: 'use this?', type: 'iconSelect',
      iconOptions: [
        { label: 'Standalone program',   icon: 'leaf-outline'    },
        { label: 'With strength training', icon: 'barbell-outline'},
        { label: 'With running/cardio',  icon: 'walk-outline'    },
        { label: 'Coming back from injury', icon: 'medkit-outline'},
      ]},
    { key: 'days_per_week', question: 'How many days per week', questionAccent: 'can you stretch?', hint: 'Daily works great — even 10 minutes helps', type: 'slider', min: 3, max: 7, unit: ' days' },
    { key: 'injuries',      question: 'Any pain or', questionAccent: 'injuries?', type: 'iconSelect', multi: true, exclusiveNone: true, iconOptions: INJURIES_EN },
  ],

  'CALISTHENICS': [
    { key: 'target_skill', question: 'Which skill are you', questionAccent: 'chasing?', hint: 'Your whole program will be built around this', type: 'iconSelect',
      iconOptions: [
        { label: 'Muscle-up',          icon: 'arrow-up-circle-outline' },
        { label: 'Handstand',          icon: 'accessibility-outline'   },
        { label: 'Front lever',        icon: 'resize-outline'          },
        { label: 'First pull-up',      icon: 'fitness-outline'         },
        { label: 'Pistol squat',       icon: 'walk-outline'            },
        { label: 'Human flag',         icon: 'flag-outline'            },
      ]},
    { key: 'calisthenics_level', question: 'Your', questionAccent: 'current level?', type: 'levelSelect',
      iconOptions: [
        { label: 'Beginner',     subtitle: "Can't do a full pull-up yet",            ringPercent: 25  },
        { label: 'Intermediate', subtitle: '5+ pull-ups, basic pushing',             ringPercent: 50  },
        { label: 'Advanced',     subtitle: 'I have some skills already',             ringPercent: 75  },
        { label: 'Elite',        subtitle: 'Multiple skills mastered',               ringPercent: 100 },
      ]},
    { key: 'cal_equipment', question: 'What equipment do', questionAccent: 'you have?', type: 'iconSelect',
      iconOptions: [
        { label: 'Pull-up bar only',       icon: 'remove-outline'    },
        { label: 'Bar + parallettes',      icon: 'grid-outline'      },
        { label: 'Bar + rings + parallettes', icon: 'ellipse-outline'},
        { label: 'Outdoor calisthenics park', icon: 'leaf-outline'   },
      ]},
    { key: 'days_per_week', question: 'How many days per week', questionAccent: 'can you train?', type: 'slider', min: 3, max: 6, unit: ' days' },
    { key: 'injuries',      question: 'Any pain or', questionAccent: 'injuries?', type: 'iconSelect', multi: true, exclusiveNone: true, iconOptions: INJURIES_EN },
  ],

  'SPORT PREP': [
    { key: 'target_sport', question: 'Which sport are you', questionAccent: 'training for?', hint: 'Your whole program will be built around this', type: 'iconSelect',
      iconOptions: [
        { label: 'Boxing / combat',      icon: 'hand-left-outline'    },
        { label: 'Cycling',              icon: 'bicycle-outline'      },
        { label: 'Triathlon',            icon: 'water-outline'        },
        { label: 'Climbing',             icon: 'trending-up-outline'  },
        { label: 'BJJ / grappling',      icon: 'body-outline'         },
        { label: 'Soccer / football',    icon: 'football-outline'     },
        { label: 'Tennis / racket',      icon: 'tennisball-outline'   },
        { label: 'Basketball / team',    icon: 'basketball-outline'   },
      ]},
    { key: 'season_timing', question: 'When is your next', questionAccent: 'competition?', type: 'iconSelect',
      iconOptions: [
        { label: 'Within 4 weeks',        icon: 'alarm-outline'    },
        { label: '4–8 weeks',             icon: 'calendar-outline' },
        { label: '8–16 weeks',            icon: 'hourglass-outline'},
        { label: 'No competition',        icon: 'infinite-outline' },
      ]},
    { key: 'sport_focus', question: 'What do you need', questionAccent: 'most work on?', type: 'iconSelect',
      iconOptions: [
        { label: 'Power & explosiveness', icon: 'flash-outline'   },
        { label: 'Endurance & stamina',   icon: 'pulse-outline'   },
        { label: 'Speed & agility',       icon: 'walk-outline'    },
        { label: 'Strength foundation',   icon: 'barbell-outline' },
      ]},
    { key: 'days_per_week', question: 'How many prep sessions', questionAccent: 'per week?', hint: 'On top of your sport practice', type: 'slider', min: 3, max: 6, unit: ' days' },
    { key: 'injuries',      question: 'Any pain or', questionAccent: 'injuries?', type: 'iconSelect', multi: true, exclusiveNone: true, iconOptions: INJURIES_EN },
  ],

  'ACTIVE AGING': [
    { key: 'aging_goal', question: 'What matters', questionAccent: 'most to you?',
      hint: 'Tap any that apply — you can choose more than one',
      type: 'iconSelect', multi: true,
      iconOptions: [
        { label: 'Stay independent', icon: 'walk-outline', subOptions: [
          'Walking without support',
          'Getting up from a chair or floor',
          'Climbing stairs',
          'Carrying groceries',
        ]},
        { label: 'Prevent falls', icon: 'shield-checkmark-outline', subOptions: [
          'Better reaction time',
          'Stronger legs and hips',
          'Steadier footing',
          'Coordination & awareness',
        ]},
        { label: 'Better balance', icon: 'swap-horizontal-outline', subOptions: [
          'Standing balance',
          'Walking on uneven ground',
          'Single-leg control',
          'Core stability',
        ]},
        { label: 'Strength for daily life', icon: 'barbell-outline', subOptions: [
          'Lifting everyday objects',
          'Opening jars and doors',
          'Standing up from low seats',
          'Carrying bags and shopping',
        ]},
      ]},
    { key: 'current_mobility', question: 'How active are you', questionAccent: 'right now?', type: 'iconSelect',
      iconOptions: [
        { label: 'Very active — regular activities', icon: 'flash-outline'  },
        { label: 'Moderate — some limitations',      icon: 'leaf-outline'   },
        { label: 'Limited — daily tasks challenging', icon: 'walk-outline'  },
        { label: 'Recovering from surgery/illness',   icon: 'medkit-outline'},
      ]},
    { key: 'concern_area', question: 'Your main', questionAccent: 'concern area?', type: 'iconSelect',
      iconOptions: [
        { label: 'Balance & stability',   icon: 'swap-horizontal-outline' },
        { label: 'Knees & legs',          icon: 'walk-outline'            },
        { label: 'Back & core',           icon: 'body-outline'            },
        { label: 'Arms & shoulders',      icon: 'hand-left-outline'       },
        { label: 'General weakness',      icon: 'pulse-outline'           },
      ]},
    { key: 'days_per_week', question: 'How many days', questionAccent: 'feel manageable?', hint: '3–4 days is plenty — rest is important', type: 'slider', min: 3, max: 5, unit: ' days' },
    { key: 'injuries',      question: 'Any pain or', questionAccent: 'medical concerns?', type: 'iconSelect', multi: true, exclusiveNone: true, iconOptions: INJURIES_EN },
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
  { key: 'equipment',     question: 'What do you', questionAccent: 'train with?', type: 'iconSelect', multi: true, iconOptions: EQUIPMENT_EN },
  { key: 'injuries',      question: 'Any pain or', questionAccent: 'injuries?',   type: 'iconSelect', multi: true, exclusiveNone: true, iconOptions: INJURIES_EN },
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
    { key: 'equipment',     question: 'Womit', questionAccent: 'trainierst du?', type: 'iconSelect', multi: true, iconOptions: EQUIPMENT_DE },
    { key: 'injuries',      question: 'Schmerzen oder', questionAccent: 'Verletzungen?', type: 'iconSelect', multi: true, exclusiveNone: true, iconOptions: INJURIES_DE },
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
    { key: 'equipment',     question: 'Welches', questionAccent: 'Equipment hast du?', type: 'iconSelect', multi: true, iconOptions: EQUIPMENT_DE },
    { key: 'injuries',      question: 'Schmerzen oder', questionAccent: 'Verletzungen?',  type: 'iconSelect', multi: true, exclusiveNone: true, iconOptions: INJURIES_DE },
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
    { key: 'equipment',     question: 'Womit', questionAccent: 'trainierst du?', type: 'iconSelect', multi: true, iconOptions: EQUIPMENT_DE },
    { key: 'injuries',      question: 'Schmerzen oder', questionAccent: 'Verletzungen?', type: 'iconSelect', multi: true, exclusiveNone: true, iconOptions: INJURIES_DE },
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
    { key: 'equipment',     question: 'Was hast du', questionAccent: 'zur Verfügung?', type: 'iconSelect', multi: true, iconOptions: EQUIPMENT_DE },
    { key: 'injuries',      question: 'Schmerzen, die wir', questionAccent: 'kennen sollten?', type: 'iconSelect', multi: true, exclusiveNone: true, iconOptions: INJURIES_DE },
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
    { key: 'injuries',      question: 'Schmerzen oder', questionAccent: 'Verletzungen?', type: 'iconSelect', multi: true, exclusiveNone: true, iconOptions: INJURIES_DE },
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
    { key: 'injuries',      question: 'Schmerzen oder', questionAccent: 'Verletzungen?', type: 'iconSelect', multi: true, exclusiveNone: true, iconOptions: INJURIES_DE },
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
    { key: 'equipment',     question: 'Welches', questionAccent: 'Equipment hast du?', type: 'iconSelect', multi: true, iconOptions: EQUIPMENT_DE },
    { key: 'injuries',      question: 'Schmerzen oder', questionAccent: 'Verletzungen?',    type: 'iconSelect', multi: true, exclusiveNone: true, iconOptions: INJURIES_DE },
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
    { key: 'injuries',      question: 'Schmerzen oder', questionAccent: 'Verletzungen?', type: 'iconSelect', multi: true, exclusiveNone: true, iconOptions: INJURIES_DE },
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
    { key: 'equipment',     question: 'Welche Box', questionAccent: 'oder Gym?', type: 'iconSelect', multi: true, iconOptions: EQUIPMENT_DE },
    { key: 'injuries',      question: 'Schmerzen oder', questionAccent: 'Verletzungen?', type: 'iconSelect', multi: true, exclusiveNone: true, iconOptions: INJURIES_DE },
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
    { key: 'equipment',     question: 'Was hast', questionAccent: 'du?', type: 'iconSelect', multi: true, iconOptions: EQUIPMENT_DE },
    { key: 'injuries',      question: 'Schmerzen oder', questionAccent: 'Verletzungen?', type: 'iconSelect', multi: true, exclusiveNone: true, iconOptions: INJURIES_DE },
  ],

  'MOBILITY': [
    { key: 'mobility_goal', question: 'Warum möchtest du', questionAccent: 'mehr Beweglichkeit?', type: 'iconSelect',
      iconOptions: [
        { label: 'Schreibtischhaltung lösen', icon: 'laptop-outline'  },
        { label: 'Nach dem Training regenerieren', icon: 'refresh-outline' },
        { label: 'Verspannungen lösen',       icon: 'body-outline'    },
        { label: 'Im Alter beweglich bleiben',icon: 'heart-outline'   },
      ]},
    { key: 'tight_area', question: 'Deine größte', questionAccent: 'Problemzone?', type: 'iconSelect',
      iconOptions: [
        { label: 'Unterer Rücken',  icon: 'body-outline'     },
        { label: 'Hüfte & Gesäß',   icon: 'walk-outline'     },
        { label: 'Schulter & Nacken', icon: 'hand-left-outline'},
        { label: 'Beinrückseite',   icon: 'fitness-outline'  },
        { label: 'Alles verspannt', icon: 'shuffle-outline'  },
      ]},
    { key: 'using_with', question: 'Wie wirst du es', questionAccent: 'nutzen?', type: 'iconSelect',
      iconOptions: [
        { label: 'Als eigenständiges Programm', icon: 'leaf-outline'    },
        { label: 'Mit Krafttraining',           icon: 'barbell-outline' },
        { label: 'Mit Laufen/Cardio',           icon: 'walk-outline'    },
        { label: 'Reha nach Verletzung',        icon: 'medkit-outline'  },
      ]},
    { key: 'days_per_week', question: 'Wie viele Tage pro Woche', questionAccent: 'kannst du dehnen?', hint: 'Täglich ist super — schon 10 Minuten helfen', type: 'slider', min: 3, max: 7, unit: ' Tage' },
    { key: 'injuries',      question: 'Schmerzen oder', questionAccent: 'Verletzungen?', type: 'iconSelect', multi: true, exclusiveNone: true, iconOptions: INJURIES_DE },
  ],

  'CALISTHENICS': [
    { key: 'target_skill', question: 'Welchen Skill willst du', questionAccent: 'erreichen?', hint: 'Dein gesamtes Programm wird darauf aufgebaut', type: 'iconSelect',
      iconOptions: [
        { label: 'Muscle-up',            icon: 'arrow-up-circle-outline' },
        { label: 'Handstand',            icon: 'accessibility-outline'   },
        { label: 'Front Lever',          icon: 'resize-outline'          },
        { label: 'Erster Klimmzug',      icon: 'fitness-outline'         },
        { label: 'Pistol Squat',         icon: 'walk-outline'            },
        { label: 'Human Flag',           icon: 'flag-outline'            },
      ]},
    { key: 'calisthenics_level', question: 'Dein', questionAccent: 'aktuelles Level?', type: 'levelSelect',
      iconOptions: [
        { label: 'Anfänger',        subtitle: 'Noch kein vollständiger Klimmzug',   ringPercent: 25  },
        { label: 'Fortgeschritten', subtitle: '5+ Klimmzüge, einfache Drückübungen', ringPercent: 50  },
        { label: 'Profi',           subtitle: 'Einige Skills beherrsche ich schon', ringPercent: 75  },
        { label: 'Elite',           subtitle: 'Mehrere Skills gemeistert',          ringPercent: 100 },
      ]},
    { key: 'cal_equipment', question: 'Welches Equipment', questionAccent: 'hast du?', type: 'iconSelect',
      iconOptions: [
        { label: 'Nur Klimmzugstange',        icon: 'remove-outline'    },
        { label: 'Stange + Parallettes',      icon: 'grid-outline'      },
        { label: 'Stange + Ringe + Parallettes', icon: 'ellipse-outline' },
        { label: 'Outdoor Calisthenics-Park', icon: 'leaf-outline'      },
      ]},
    { key: 'days_per_week', question: 'Wie viele Tage pro Woche', questionAccent: 'kannst du trainieren?', type: 'slider', min: 3, max: 6, unit: ' Tage' },
    { key: 'injuries',      question: 'Schmerzen oder', questionAccent: 'Verletzungen?', type: 'iconSelect', multi: true, exclusiveNone: true, iconOptions: INJURIES_DE },
  ],

  'SPORT PREP': [
    { key: 'target_sport', question: 'Für welche Sportart', questionAccent: 'trainierst du?', hint: 'Dein gesamtes Programm wird darauf aufgebaut', type: 'iconSelect',
      iconOptions: [
        { label: 'Boxen / Kampfsport',   icon: 'hand-left-outline'    },
        { label: 'Radfahren',            icon: 'bicycle-outline'      },
        { label: 'Triathlon',            icon: 'water-outline'        },
        { label: 'Klettern',             icon: 'trending-up-outline'  },
        { label: 'BJJ / Grappling',      icon: 'body-outline'         },
        { label: 'Fußball',              icon: 'football-outline'     },
        { label: 'Tennis / Schläger',    icon: 'tennisball-outline'   },
        { label: 'Basketball / Team',    icon: 'basketball-outline'   },
      ]},
    { key: 'season_timing', question: 'Wann ist dein nächster', questionAccent: 'Wettkampf?', type: 'iconSelect',
      iconOptions: [
        { label: 'In 4 Wochen',           icon: 'alarm-outline'    },
        { label: '4–8 Wochen',            icon: 'calendar-outline' },
        { label: '8–16 Wochen',           icon: 'hourglass-outline'},
        { label: 'Kein Wettkampf',        icon: 'infinite-outline' },
      ]},
    { key: 'sport_focus', question: 'Woran musst du am meisten', questionAccent: 'arbeiten?', type: 'iconSelect',
      iconOptions: [
        { label: 'Power & Explosivität',  icon: 'flash-outline'   },
        { label: 'Ausdauer',              icon: 'pulse-outline'   },
        { label: 'Schnelligkeit & Agilität', icon: 'walk-outline' },
        { label: 'Kraft-Grundlagen',      icon: 'barbell-outline' },
      ]},
    { key: 'days_per_week', question: 'Wie viele Prep-Einheiten', questionAccent: 'pro Woche?', hint: 'Zusätzlich zum eigentlichen Training', type: 'slider', min: 3, max: 6, unit: ' Tage' },
    { key: 'injuries',      question: 'Schmerzen oder', questionAccent: 'Verletzungen?', type: 'iconSelect', multi: true, exclusiveNone: true, iconOptions: INJURIES_DE },
  ],

  'ACTIVE AGING': [
    { key: 'aging_goal', question: 'Was ist dir am', questionAccent: 'wichtigsten?',
      hint: 'Tippe alles an, was passt — Mehrfachauswahl möglich',
      type: 'iconSelect', multi: true,
      iconOptions: [
        { label: 'Selbstständig bleiben', icon: 'walk-outline', subOptions: [
          'Ohne Hilfe gehen',
          'Vom Stuhl oder Boden aufstehen',
          'Treppen steigen',
          'Einkäufe tragen',
        ]},
        { label: 'Stürze vermeiden', icon: 'shield-checkmark-outline', subOptions: [
          'Schnellere Reaktion',
          'Stärkere Beine und Hüften',
          'Sichererer Stand',
          'Koordination & Wahrnehmung',
        ]},
        { label: 'Bessere Balance', icon: 'swap-horizontal-outline', subOptions: [
          'Standgleichgewicht',
          'Gehen auf unebenem Grund',
          'Einbeinstand',
          'Rumpfstabilität',
        ]},
        { label: 'Kraft für den Alltag', icon: 'barbell-outline', subOptions: [
          'Alltagsgegenstände heben',
          'Gläser und Türen öffnen',
          'Aus niedrigen Sitzen aufstehen',
          'Taschen und Einkäufe tragen',
        ]},
      ]},
    { key: 'current_mobility', question: 'Wie aktiv', questionAccent: 'bist du gerade?', type: 'iconSelect',
      iconOptions: [
        { label: 'Sehr aktiv — regelmäßig unterwegs',  icon: 'flash-outline'  },
        { label: 'Mittel — einige Einschränkungen',    icon: 'leaf-outline'   },
        { label: 'Eingeschränkt — Alltag ist anstrengend', icon: 'walk-outline'  },
        { label: 'Nach Operation/Krankheit',            icon: 'medkit-outline'},
      ]},
    { key: 'concern_area', question: 'Dein Haupt-', questionAccent: 'problembereich?', type: 'iconSelect',
      iconOptions: [
        { label: 'Balance & Stabilität',    icon: 'swap-horizontal-outline' },
        { label: 'Knie & Beine',            icon: 'walk-outline'            },
        { label: 'Rücken & Rumpf',          icon: 'body-outline'            },
        { label: 'Arme & Schultern',        icon: 'hand-left-outline'       },
        { label: 'Allgemeine Schwäche',     icon: 'pulse-outline'           },
      ]},
    { key: 'days_per_week', question: 'Wie viele Tage', questionAccent: 'sind machbar?', hint: '3–4 Tage sind ideal — Erholung ist wichtig', type: 'slider', min: 3, max: 5, unit: ' Tage' },
    { key: 'injuries',      question: 'Schmerzen oder', questionAccent: 'medizinische Bedenken?', type: 'iconSelect', multi: true, exclusiveNone: true, iconOptions: INJURIES_DE },
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
  { key: 'equipment',     question: 'Womit', questionAccent: 'trainierst du?', type: 'iconSelect', multi: true, iconOptions: EQUIPMENT_DE },
  { key: 'injuries',      question: 'Schmerzen oder', questionAccent: 'Verletzungen?', type: 'iconSelect', multi: true, exclusiveNone: true, iconOptions: INJURIES_DE },
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

  // Default to a middle-of-range value so the slider thumb isn't parked at
  // the edge — users still need to touch the slider to confirm, but at least
  // they see a realistic starting number.
  const HEIGHT_DEFAULT = 170;
  const WEIGHT_DEFAULT = 70;

  const [step,        setStep]        = useState(0);
  const [answers,     setAnswers]     = useState<Record<string, string | number | string[] | Record<string, string[]>>>({
    height_cm: storedHeight ?? HEIGHT_DEFAULT,
    weight_kg: storedWeight ?? WEIGHT_DEFAULT,
    ...(user?.gender ? { gender: user.gender } : {}),
  });
  const [loading,     setLoading]     = useState(false);
  const [heightUnit,  setHeightUnit]  = useState<'cm' | 'ft'>('cm');
  const [weightUnit,  setWeightUnit]  = useState<'kg' | 'lbs'>('kg');
  // Height/weight always start with a visible value, so they count as
  // "answered" from the start — user can still slide to change. Gender is
  // considered answered only if pre-filled from the user profile.
  const [touchedKeys, setTouchedKeys] = useState<Set<string>>(() => {
    const init = new Set<string>(['height_cm', 'weight_kg']);
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
      // Serialize array answers and drop the internal __subs buckets by
      // merging their sub-picks into the main key as a comma-separated list.
      const payload: Record<string, any> = {};
      const subBuckets: Record<string, Record<string, string[]>> = {};
      for (const [k, v] of Object.entries(answers)) {
        if (k.endsWith('__subs')) {
          subBuckets[k.slice(0, -'__subs'.length)] = v as Record<string, string[]>;
        } else {
          payload[k] = v;
        }
      }
      for (const [k, v] of Object.entries(payload)) {
        if (Array.isArray(v)) {
          const subs = subBuckets[k];
          if (subs) {
            // Expand each selected main option with its sub-picks:
            //   "Stay independent (Walking without support, Climbing stairs), Prevent falls"
            payload[k] = (v as string[]).map(main => {
              const picks = subs[main];
              return picks && picks.length ? `${main} (${picks.join(', ')})` : main;
            }).join(', ');
          } else {
            payload[k] = (v as string[]).join(', ');
          }
        }
      }
      const q = await api.questionnaire.save({ ...payload, plan_id: planId ? Number(planId) : undefined });
      router.replace({ pathname: '/generating', params: { questionnaireId: q.id, difficulty: difficulty || '' } });
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

        {/* Icon select — single OR multi-select, with optional sub-points */}
        {current.type === 'iconSelect' && (() => {
          const isMulti = current.multi === true;
          const rawSelected = answers[current.key];
          const selectedLabels: string[] = isMulti
            ? (Array.isArray(rawSelected) ? rawSelected as string[] : [])
            : [];
          const selectedSubs: Record<string, string[]> = (answers[current.key + '__subs'] as any) ?? {};
          const noneLabels = new Set(['None', 'Keine', 'None ✅', '✅ None — fit and healthy', '✅ Keine — ich bin fit und gesund']);

          const toggleMain = (label: string, hasSubs: boolean) => {
            if (!isMulti) {
              answer(label);
              return;
            }
            setAnswers(a => {
              const prev = Array.isArray(a[current.key]) ? [...(a[current.key] as string[])] : [];
              const prevSubs = { ...(a[current.key + '__subs'] as Record<string, string[]> ?? {}) };
              const i = prev.indexOf(label);
              let next: string[];
              if (i >= 0) {
                next = prev.filter(l => l !== label);
                delete prevSubs[label];
              } else {
                // Handle "None" exclusivity
                if (current.exclusiveNone && /^(none|keine)/i.test(label)) {
                  next = [label];
                } else if (current.exclusiveNone) {
                  next = prev.filter(l => !/^(none|keine)/i.test(l));
                  next.push(label);
                } else {
                  next = [...prev, label];
                }
              }
              touch(current.key);
              return { ...a, [current.key]: next, [current.key + '__subs']: prevSubs };
            });
          };

          const toggleSub = (parent: string, sub: string) => {
            setAnswers(a => {
              const prevSubs = { ...(a[current.key + '__subs'] as Record<string, string[]> ?? {}) };
              const list = prevSubs[parent] ? [...prevSubs[parent]] : [];
              const i = list.indexOf(sub);
              if (i >= 0) list.splice(i, 1); else list.push(sub);
              prevSubs[parent] = list;

              // Make sure the parent is in the selected list if at least one sub is picked
              const prev = Array.isArray(a[current.key]) ? [...(a[current.key] as string[])] : [];
              if (list.length > 0 && !prev.includes(parent)) prev.push(parent);

              touch(current.key);
              return { ...a, [current.key]: prev, [current.key + '__subs']: prevSubs };
            });
          };

          return (
            <View style={s.iconOptions}>
              {current.iconOptions!.map(opt => {
                const active = isMulti
                  ? selectedLabels.includes(opt.label)
                  : answers[current.key] === opt.label;
                const subs = opt.subOptions ?? [];
                const hasSubs = subs.length > 0;
                const pickedSubs = selectedSubs[opt.label] ?? [];

                return (
                  <View key={opt.label}>
                    <TouchableOpacity
                      style={[s.iconOption, active && { borderColor: diffColor, backgroundColor: diffColor + '10' }]}
                      onPress={() => toggleMain(opt.label, hasSubs)}
                      activeOpacity={0.75}
                    >
                      {opt.icon && <Ionicons name={opt.icon} size={22} color={active ? diffColor : colors.text} style={{ width: 26 }} />}
                      {!opt.icon && <View style={{ width: 26 }} />}
                      <Text style={[s.iconOptionText, active && { color: diffColor, fontWeight: '700' }]}>{opt.label}</Text>
                      {isMulti ? (
                        <View style={[s.checkBox, active && { borderColor: diffColor, backgroundColor: diffColor }]}>
                          {active && <Ionicons name="checkmark" size={14} color="#fff" />}
                        </View>
                      ) : (
                        <Ionicons name="chevron-forward" size={18} color={active ? diffColor : colors.muted} />
                      )}
                    </TouchableOpacity>

                    {/* Sub-options: always visible when the parent has them */}
                    {hasSubs && active && (
                      <View style={[s.subList, { borderColor: diffColor + '40' }]}>
                        {subs.map(sub => {
                          const subActive = pickedSubs.includes(sub);
                          return (
                            <TouchableOpacity
                              key={sub}
                              style={s.subRow}
                              onPress={() => toggleSub(opt.label, sub)}
                              activeOpacity={0.7}
                            >
                              <View style={[s.subCheck, subActive && { borderColor: diffColor, backgroundColor: diffColor }]}>
                                {subActive && <Ionicons name="checkmark" size={12} color="#fff" />}
                              </View>
                              <Text style={[s.subText, subActive && { color: diffColor, fontWeight: '700' }]}>{sub}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })()}

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
        {current.type === 'height' && (() => {
          const h = Number(answers.height_cm) || 170;
          return (
            <View style={s.measureWrap}>
              <View style={s.unitToggle}>
                {(['cm', 'ft'] as const).map(u => (
                  <TouchableOpacity key={u} style={[s.unitBtn, heightUnit === u && { backgroundColor: colors.card2, borderColor: diffColor }]} onPress={() => setHeightUnit(u)}>
                    <Text style={[s.unitText, heightUnit === u && { color: diffColor, fontWeight: '700' }]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={s.measureDisplay}>
                <Text style={[s.measureVal, { color: diffColor }]}>
                  {heightUnit === 'cm'
                    ? Math.round(h)
                    : `${Math.floor(h / 30.48)}'${Math.round((h / 2.54) % 12)}"`}
                </Text>
                <Text style={s.measureUnit}>{heightUnit}</Text>
              </View>
              <BigSlider
                value={h}
                min={120}
                max={230}
                step={1}
                color={diffColor}
                onChange={val => { touch('height_cm'); setAnswers(a => ({ ...a, height_cm: val })); }}
              />
              <View style={s.measureLabels}>
                <Text style={s.measureLabel}>120 cm</Text>
                <Text style={s.measureLabel}>230 cm</Text>
              </View>
            </View>
          );
        })()}

        {/* Weight picker — kg/lbs toggle + value */}
        {current.type === 'weight' && (() => {
          const w = Number(answers.weight_kg) || 70;
          return (
            <View style={s.measureWrap}>
              <View style={s.unitToggle}>
                {(['kg', 'lbs'] as const).map(u => (
                  <TouchableOpacity key={u} style={[s.unitBtn, weightUnit === u && { backgroundColor: colors.card2, borderColor: diffColor }]} onPress={() => setWeightUnit(u)}>
                    <Text style={[s.unitText, weightUnit === u && { color: diffColor, fontWeight: '700' }]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={s.measureDisplay}>
                <Text style={[s.measureVal, { color: diffColor }]}>
                  {weightUnit === 'kg'
                    ? Math.round(w)
                    : Math.round(w * 2.20462)}
                </Text>
                <Text style={s.measureUnit}>{weightUnit}</Text>
              </View>
              <BigSlider
                value={w}
                min={30}
                max={200}
                step={1}
                color={diffColor}
                onChange={val => { touch('weight_kg'); setAnswers(a => ({ ...a, weight_kg: val })); }}
              />
              <View style={s.measureLabels}>
                <Text style={s.measureLabel}>30 kg</Text>
                <Text style={s.measureLabel}>200 kg</Text>
              </View>
            </View>
          );
        })()}

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
            <BigSlider
              value={sliderVal}
              min={current.min!}
              max={current.max!}
              step={1}
              color={diffColor}
              onChange={val => { touch(current.key); setAnswers(a => ({ ...a, [current.key]: val })); }}
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
            const isMulti = current.type === 'iconSelect' && current.multi === true;
            const isChoice = current.type === 'iconSelect' || current.type === 'levelSelect' || current.type === 'select';

            const isAnswered =
              isDaySelect
                ? ((answers.training_days as unknown as string[])?.length ?? 0) === ((answers.days_per_week as number) ?? 3)
                : isSlider
                  ? touchedKeys.has(current.key)
                  : isMulti
                    ? Array.isArray(answers[current.key]) && (answers[current.key] as string[]).length > 0
                    : isChoice
                      ? answers[current.key] != null
                      : true;

            const isLast = step === total - 1;

            // Sliders, day select, multi-select, and the FINAL step all render
            // an explicit Next/Build button (single-choice steps use auto-advance).
            if (!isSlider && !isDaySelect && !isMulti && !isLast) return null;

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

  // Multi-select checkbox + sub-point list
  checkBox: {
    width:          22,
    height:         22,
    borderRadius:   6,
    borderWidth:    2,
    borderColor:    colors.border,
    alignItems:     'center',
    justifyContent: 'center',
  },
  subList: {
    marginTop:        -4,
    marginBottom:     6,
    marginLeft:       14,
    paddingLeft:      14,
    borderLeftWidth:  2,
    paddingVertical:  4,
  },
  subRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  subCheck: {
    width:          18,
    height:         18,
    borderRadius:   5,
    borderWidth:    2,
    borderColor:    colors.border,
    alignItems:     'center',
    justifyContent: 'center',
  },
  subText: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '500' },

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
  measureLabels:    { width: '100%' as any, flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  measureLabel:     { fontSize: 12, color: colors.muted, fontWeight: '600' },

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
