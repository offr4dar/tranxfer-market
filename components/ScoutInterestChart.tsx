import { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, useWindowDimensions,
} from 'react-native'
import { LineChart } from 'react-native-gifted-charts'
import { Colors, Spacing, Radius } from '@/constants/theme'

// ─── Data types ───────────────────────────────────────────────────────────────

export interface ChartDataPoint {
  date: string       // display label e.g. '1 Apr'
  views: number
  shortlists: number
}

interface Props {
  data30: ChartDataPoint[]   // 30 days of data
  data7: ChartDataPoint[]    // 7 days of data (last 7 of data30)
}

// ─── Data colours (not theme — data encoding colours) ────────────────────────

const VIEWS_COLOR = '#888780'
const SHORTLIST_COLOR = '#1D9E75'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pct(a: number, b: number): string {
  if (b === 0) return '0%'
  return `${Math.round((a / b) * 100)}%`
}

function conversionRatio(views: number, shortlists: number): number | null {
  if (shortlists === 0) return null
  return Math.round(views / shortlists)
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ScoutInterestChart({ data30, data7 }: Props) {
  const { width } = useWindowDimensions()
  const [period, setPeriod] = useState<'7' | '30'>('7')
  const [tooltip, setTooltip] = useState<{ index: number } | null>(null)

  const activeData = period === '7' ? data7 : data30

  // ── Computed stats ──
  const totalViews = activeData.reduce((s, d) => s + d.views, 0)
  const totalShortlists = activeData.reduce((s, d) => s + d.shortlists, 0)
  const ratio = conversionRatio(totalViews, totalShortlists)

  // ── Gifted-charts data shape ──
  // Reduce x-axis labels for 30-day view so they don't crowd
  const step = period === '30' ? Math.ceil(activeData.length / 7) : 1
  const viewsData = activeData.map((d, i) => ({
    value: d.views,
    label: i % step === 0 ? d.date : '',
    dataPointText: '',
  }))
  const shortlistsData = activeData.map(d => ({
    value: d.shortlists,
  }))

  const chartWidth = width - 64
  const spacing = Math.max(20, Math.floor(chartWidth / Math.max(activeData.length, 1)))

  const tooltipPoint = tooltip !== null ? activeData[tooltip.index] : null

  return (
    <View style={styles.container}>

      {/* ── Period toggle ── */}
      <View style={styles.toggleRow}>
        {(['7', '30'] as const).map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.toggleBtn, period === p && styles.toggleBtnActive]}
            onPress={() => { setPeriod(p); setTooltip(null) }}
            activeOpacity={0.7}
          >
            <Text style={[styles.toggleText, period === p && styles.toggleTextActive]}>
              {p} days
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Legend ── */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: VIEWS_COLOR, opacity: 0.6 }]} />
          <Text style={styles.legendLabel}>Views</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: SHORTLIST_COLOR }]} />
          <Text style={styles.legendLabel}>Tracking</Text>
        </View>
      </View>

      {/* ── Stat cards ── */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>Total views</Text>
          <Text style={styles.statValue}>{totalViews}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>Tracking</Text>
          <Text style={styles.statValue}>{totalShortlists}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>Conversion</Text>
          <Text style={styles.statValue}>{pct(totalShortlists, totalViews)}</Text>
        </View>
      </View>

      {/* ── Chart ── */}
      <View style={styles.chartWrap}>
        <LineChart
          data={viewsData}
          data2={shortlistsData}
          height={200}
          spacing={spacing}
          initialSpacing={12}
          endSpacing={12}
          curved
          // Dataset 1 — Views (grey)
          color1={VIEWS_COLOR}
          thickness1={2}
          dataPointsColor1={VIEWS_COLOR}
          dataPointsRadius1={3}
          // Dataset 2 — Shortlists (green)
          color2={SHORTLIST_COLOR}
          thickness2={2}
          dataPointsColor2={SHORTLIST_COLOR}
          dataPointsRadius2={4}
          // Axes
          yAxisTextStyle={styles.axisText}
          xAxisLabelTextStyle={styles.axisText}
          xAxisLabelTexts={activeData.map((d, i) => (i % step === 0 ? d.date : ''))}
          // Appearance
          rulesColor="rgba(255,255,255,0.06)"
          backgroundColor="transparent"
          yAxisColor="rgba(255,255,255,0.08)"
          xAxisColor="rgba(255,255,255,0.08)"
          noOfSections={4}
          hideDataPoints={false}
          showVerticalLines={false}
          // Tooltip — onPress gives { item, index }
          onPress={(item: any, index: number) => {
            setTooltip(prev => prev?.index === index ? null : { index })
          }}
        />

        {/* Tooltip overlay */}
        {tooltipPoint !== null && (
          <View style={styles.tooltip} pointerEvents="none">
            <Text style={styles.tooltipDate}>{tooltipPoint.date}</Text>
            <Text style={styles.tooltipRow}>
              <Text style={{ color: VIEWS_COLOR }}>● </Text>
              <Text style={styles.tooltipText}>Views: </Text>
              <Text style={styles.tooltipValue}>{tooltipPoint.views}</Text>
            </Text>
            <Text style={styles.tooltipRow}>
              <Text style={{ color: SHORTLIST_COLOR }}>● </Text>
              <Text style={styles.tooltipText}>Tracking: </Text>
              <Text style={styles.tooltipValue}>{tooltipPoint.shortlists}</Text>
            </Text>
          </View>
        )}
      </View>

      {/* ── Conversion sentence ── */}
      <View style={styles.conversionWrap}>
        {ratio !== null ? (
          <Text style={styles.conversionText}>
            {'1 in every '}
            <Text style={styles.conversionBold}>{ratio}</Text>
            {' scouts who viewed your profile added you to their tracker.'}
          </Text>
        ) : (
          <Text style={styles.conversionText}>
            No tracking activity recorded for this period yet.
          </Text>
        )}
      </View>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  toggleBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: Colors.textSecondary,
  },
  toggleText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: Colors.text,
  },

  // Legend
  legendRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  // Stat cards
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 15,
    gap: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    opacity: 0.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontFamily: 'Anton_400Regular',
    fontSize: 22,
    color: Colors.text,
    textTransform: 'uppercase',
  },

  // Chart
  chartWrap: {
    position: 'relative',
  },
  axisText: {
    color: Colors.textSecondary,
    fontSize: 11,
  } as any,

  // Tooltip
  tooltip: {
    position: 'absolute',
    top: 8,
    left: 16,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.sm,
    padding: 10,
    gap: 2,
    minWidth: 130,
  },
  tooltipDate: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tooltipText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  tooltipValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },

  // Conversion
  conversionWrap: {
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  conversionText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  conversionBold: {
    fontWeight: '500',
    color: Colors.text,
  },
})
