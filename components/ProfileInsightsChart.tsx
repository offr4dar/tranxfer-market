import { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg'
import { Colors, Spacing, Radius } from '@/constants/theme'

const CHART_H  = 80
const TOP_PAD  = 20  // room for peak annotation above the line
const VIEWS_COLOR    = 'rgba(255,255,255,0.22)'
const SHORT_COLOR    = Colors.brand  // #00FF87

interface Props {
  viewPoints:      number[]  // 7 values, oldest → newest
  shortlistPoints: number[]  // 7 values
  dayLabels:       string[]  // ['Mon', 'Tue', ...]
  totalViews:      number
  totalShortlists: number
}

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return ''
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`
  }
  return d
}

export default function ProfileInsightsChart({
  viewPoints, shortlistPoints, dayLabels, totalViews, totalShortlists,
}: Props) {
  const [chartWidth, setChartWidth] = useState(0)
  const n = viewPoints.length
  const maxVal = Math.max(1, ...viewPoints, ...shortlistPoints)

  const toY = (v: number) => TOP_PAD + (1 - v / maxVal) * (CHART_H - TOP_PAD)
  const toX = (i: number) => chartWidth > 0 ? (i / (n - 1)) * chartWidth : 0

  const viewPts  = viewPoints.map((v, i)      => ({ x: toX(i), y: toY(v) }))
  const shortPts = shortlistPoints.map((v, i) => ({ x: toX(i), y: toY(v) }))

  // Find peak shortlist day
  let peakIdx = 0
  shortlistPoints.forEach((v, i) => { if (v > shortlistPoints[peakIdx]) peakIdx = i })
  const peakCount = shortlistPoints[peakIdx]

  // Conversion insight text
  let conversionText: string
  if (totalViews > 0 && totalShortlists > 0) {
    const ratio = Math.round(totalViews / totalShortlists)
    conversionText = `1 in ${ratio} scouts who viewed you shortlisted you`
  } else if (totalViews > 0) {
    conversionText = 'No shortlists yet this week'
  } else {
    conversionText = 'No activity recorded this week'
  }

  return (
    <View>
      {/* ── Totals header ── */}
      <View style={styles.totalsRow}>
        <Text style={styles.totalViews}>
          {totalViews}
          <Text style={styles.totalSuffix}> views</Text>
        </Text>
        <Text style={styles.divider}>·</Text>
        <Text style={styles.totalShortlists}>
          {totalShortlists}
          <Text style={styles.totalSuffix}> shortlists</Text>
        </Text>
      </View>

      {/* ── Chart ── */}
      <View
        style={styles.chartWrap}
        onLayout={e => setChartWidth(e.nativeEvent.layout.width)}
      >
        {chartWidth > 0 && (
          <Svg width={chartWidth} height={CHART_H}>
            {/* Views line — muted */}
            <Path
              d={smoothPath(viewPts)}
              stroke={VIEWS_COLOR}
              strokeWidth={1.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Shortlists line — brand green */}
            <Path
              d={smoothPath(shortPts)}
              stroke={SHORT_COLOR}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Peak shortlist annotation */}
            {peakCount > 0 && shortPts[peakIdx] && (
              <>
                <Circle
                  cx={shortPts[peakIdx].x}
                  cy={shortPts[peakIdx].y}
                  r={4}
                  fill={SHORT_COLOR}
                />
                <SvgText
                  x={Math.min(Math.max(shortPts[peakIdx].x, 36), chartWidth - 36)}
                  y={Math.max(shortPts[peakIdx].y - 9, 10)}
                  fill={SHORT_COLOR}
                  fontSize={9}
                  fontWeight="700"
                  textAnchor="middle"
                >
                  {peakCount} on {dayLabels[peakIdx]}
                </SvgText>
              </>
            )}
          </Svg>
        )}
      </View>

      {/* ── Day labels ── */}
      <View style={styles.labelsRow}>
        {dayLabels.map((label, i) => (
          <Text key={i} style={styles.dayLabel}>{label}</Text>
        ))}
      </View>

      {/* ── Conversion indicator ── */}
      <Text style={styles.conversion}>{conversionText}</Text>

      {/* ── Legend ── */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: VIEWS_COLOR }]} />
          <Text style={styles.legendLabel}>Views</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: SHORT_COLOR }]} />
          <Text style={styles.legendLabel}>Shortlists</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  totalsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  totalViews: {
    fontSize: 20,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
  },
  totalShortlists: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.brand,
  },
  totalSuffix: {
    fontSize: 13,
    fontWeight: '500',
  },
  divider: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.2)',
  },
  chartWrap: {
    width: '100%',
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  dayLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
    width: 28,
    textTransform: 'uppercase',
  },
  conversion: {
    marginTop: Spacing.md,
    fontSize: 12,
    color: Colors.brand,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  legend: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
})
