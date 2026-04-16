export const colors = {
  accent:  '#E94560',
  cta:     '#E94560',  // unified with accent — one brand color
  ctaText: '#FFFFFF',  // text on CTA buttons (was dark bg)
  bg:      '#0A0A0A',
  card:    '#161618',
  card2:   '#1E1E22',
  muted:   '#6B7280',
  text:    '#F5F5F5',
  border:  '#2A2A2E',
  error:   '#FF6B6B',
} as const;

export const spacing = {
  xs: 6,
  sm: 12,
  md: 20,
  lg: 24,
  xl: 40,
} as const;

// Each plan category has its own brand color, used everywhere: Home cards,
// plan detail, program detail, My Plans cards, and the questionnaire form.
// The first value is the primary, the second is the gradient-end for Home cards.
export const CATEGORY_GRADIENT: Record<string, [string, string]> = {
  'FAT LOSS':        ['#FF6B6B', '#EE4444'],
  'HYPERTROPHY':     ['#7C5CFC', '#5B3AE0'],
  'TRANSFORMATION':  ['#F59E0B', '#E07A08'],
  'FIRST STEPS':     ['#4ADE80', '#22C55E'],
  'NO GYM':          ['#60A5FA', '#3B82F6'],
  'POOL':            ['#22D3EE', '#06B6D4'],
  'RACE READY':      ['#FB923C', '#F97316'],
  'HALF OR FULL':    ['#F472B6', '#EC4899'],
  'FUNCTIONAL':      ['#A78BFA', '#8B5CF6'],
  'HIGH INTENSITY':  ['#EF4444', '#DC2626'],
  'MOBILITY':        ['#34D399', '#10B981'],
  'CALISTHENICS':    ['#818CF8', '#6366F1'],
  'SPORT PREP':      ['#FBBF24', '#D97706'],
  'ACTIVE AGING':    ['#2DD4BF', '#14B8A6'],
};

// Quick accessor for the primary color of a category.
export function categoryColor(category?: string | null): string {
  if (!category) return colors.accent;
  const g = CATEGORY_GRADIENT[category.toUpperCase()];
  return g ? g[0] : colors.accent;
}
