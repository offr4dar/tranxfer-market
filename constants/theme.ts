export const Colors = {
  brand: '#00FF87',
  brandDark: '#00CC6A',
  background: '#0E0E0E',
  surface: '#0D1526',
  surfaceElevated: '#111827',
  border: 'rgba(255,255,255,0.08)',
  text: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.5)',
  textMuted: 'rgba(255,255,255,0.25)',
  error: '#FF4444',
  success: '#00FF87',
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
}

// ─── Mini card — shared style tokens ──────────────────────────────────────────
// Used everywhere we render a data chip (Profile Insights, Performance Log,
// Scout Interest Chart). Import MiniCardStyles and spread into your StyleSheet.
export const MiniCardStyles = {
  miniCardRow: {
    flexDirection: 'row' as const,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  miniCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 14,
    justifyContent: 'space-between' as const,
    minHeight: 82,
    gap: 6,
  },
  miniCardLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
    lineHeight: 14,
  },
  miniCardValue: {
    fontFamily: 'Anton_400Regular',
    fontSize: 28,
    color: '#ffffff',
  },
}
