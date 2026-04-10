import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/theme';
import { useT } from '@/i18n';
import type { ProgramStatus } from '@/api';

export function BackArrow() {
  return <Text style={{ fontSize: 22, color: colors.text, lineHeight: 26 }}>‹</Text>;
}

export function Divider({ label }: { label: string }) {
  return (
    <View style={s.row}>
      <View style={s.line} />
      <Text style={s.label}>{label}</Text>
      <View style={s.line} />
    </View>
  );
}

export function Tag({ color, children }: { color?: string; children: string }) {
  const c = color ?? colors.accent;
  return (
    <View style={[s.tag, { borderColor: c + '50', backgroundColor: c + '18' }]}>
      <Text style={[s.tagText, { color: c }]}>{children}</Text>
    </View>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<ProgramStatus, string> = {
  active:    '#A8E10C',  // lime  — you're doing it
  queued:    '#E94560',  // red   — up next
  paused:    '#F59E0B',  // amber — on hold
  completed: '#6B7280',  // gray  — done
};

export function StatusBadge({ status }: { status: ProgramStatus }) {
  const { tr } = useT();
  const color = STATUS_COLOR[status];
  const label = tr(`status_${status}` as any);
  return (
    <View style={[sb.pill, { backgroundColor: color + '22', borderColor: color + '60' }]}>
      <View style={[sb.dot, { backgroundColor: color }]} />
      <Text style={[sb.text, { color }]}>{label}</Text>
    </View>
  );
}

const sb = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1, gap: 4 },
  dot:  { width: 5, height: 5, borderRadius: 3 },
  text: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
});

// ── Program card ──────────────────────────────────────────────────────────────

export interface ProgramSummary {
  id:           number;
  name:         string;
  category:     string;
  total_weeks:  number;
  current_week: number;
  status:       ProgramStatus;
}

export function ProgramCard({
  program,
  onActivate,
  onView,
  onMarkDone,
}: {
  program:     ProgramSummary;
  onActivate?: () => void;
  onView?:     () => void;
  onMarkDone?: () => void;
}) {
  const { tr, trPlan } = useT();
  const { status, total_weeks, current_week } = program;
  const progress = total_weeks > 0 ? Math.min((current_week ?? 0) / total_weeks, 1) : 0;
  const isDone   = status === 'completed';

  return (
    <View style={[pc.card, isDone && pc.cardDone]}>
      {/* Top row: status badge + category */}
      <View style={pc.topRow}>
        <StatusBadge status={status} />
        {program.category ? (
          <Tag color={isDone ? colors.muted : undefined}>{program.category}</Tag>
        ) : null}
      </View>

      {/* Name */}
      <Text style={[pc.name, isDone && pc.nameDone]} numberOfLines={2}>
        {trPlan(program.category, 'name', program.name)}
      </Text>

      {/* Progress / info row */}
      {status === 'active' || status === 'paused' ? (
        <View style={pc.progressBlock}>
          <View style={pc.barTrack}>
            <View style={[pc.barFill, { flex: progress }]} />
            <View style={{ flex: 1 - progress }} />
          </View>
          <Text style={pc.progressLabel}>
            {tr('program_week_label')} {current_week ?? 0} {tr('program_of_label')} {total_weeks}
          </Text>
        </View>
      ) : status === 'queued' ? (
        <Text style={pc.infoText}>{total_weeks} {tr('program_weeks')} · {tr('program_activate')}</Text>
      ) : (
        <Text style={pc.infoText}>✓ {total_weeks} {tr('program_weeks')}</Text>
      )}

      {/* Action buttons */}
      {!isDone && (
        <View style={pc.actions}>
          {status === 'active' && onView && (
            <TouchableOpacity style={pc.btnPrimary} onPress={onView}>
              <Text style={pc.btnPrimaryText}>{tr('program_view')} →</Text>
            </TouchableOpacity>
          )}
          {(status === 'queued' || status === 'paused') && onActivate && (
            <TouchableOpacity style={pc.btnPrimary} onPress={onActivate}>
              <Text style={pc.btnPrimaryText}>
                {status === 'paused' ? tr('program_resume') : tr('program_activate')} →
              </Text>
            </TouchableOpacity>
          )}
          {status === 'active' && onMarkDone && (
            <TouchableOpacity style={pc.btnGhost} onPress={onMarkDone}>
              <Text style={pc.btnGhostText}>{tr('program_mark_done')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const pc = StyleSheet.create({
  card:          { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
  cardDone:      { opacity: 0.55 },
  topRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  name:          { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 10 },
  nameDone:      { color: colors.muted },
  progressBlock: { marginBottom: 8 },
  barTrack:      { height: 5, flexDirection: 'row', backgroundColor: colors.border, borderRadius: 3, marginBottom: 5 },
  barFill:       { height: 5, backgroundColor: colors.cta, borderRadius: 3 },
  progressLabel: { fontSize: 11, color: colors.muted },
  infoText:      { fontSize: 12, color: colors.muted, marginBottom: 8 },
  actions:       { flexDirection: 'row', gap: 8, marginTop: 4 },
  btnPrimary:    { backgroundColor: colors.cta, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14 },
  btnPrimaryText:{ fontSize: 13, fontWeight: '700', color: colors.bg },
  btnGhost:      { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14 },
  btnGhostText:  { fontSize: 13, color: colors.muted },
});

// ── Shared styles ─────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  line:    { flex: 1, height: 1, backgroundColor: colors.border },
  label:   { fontSize: 14, color: colors.muted },
  tag:     { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  tagText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
});
