import { useRef, useEffect, useState } from 'react'
import {
  Modal, View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, PanResponder, Dimensions, Linking,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, Spacing, Radius } from '@/constants/theme'

const SCREEN_H = Dimensions.get('window').height

interface Props {
  visible: boolean
  onClose: () => void
}

export default function DbsInfoSheet({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets()
  const [isShown, setIsShown] = useState(false)
  const sheetY = useRef(new Animated.Value(SCREEN_H)).current
  const isDraggingClose = useRef(false)

  useEffect(() => {
    if (visible) {
      isDraggingClose.current = false
      setIsShown(true)
      sheetY.setValue(SCREEN_H)
      Animated.timing(sheetY, { toValue: 0, duration: 300, useNativeDriver: true }).start()
    } else if (!isDraggingClose.current) {
      Animated.timing(sheetY, { toValue: SCREEN_H, duration: 260, useNativeDriver: true }).start(() => {
        setIsShown(false)
      })
    }
  }, [visible])

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, { dy }) => dy > 2,
      onPanResponderMove: (_, { dy }) => {
        if (dy > 0) sheetY.setValue(dy)
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        if (dy > 120 || vy > 0.5) {
          isDraggingClose.current = true
          Animated.timing(sheetY, { toValue: SCREEN_H, duration: 220, useNativeDriver: true }).start(() => {
            setIsShown(false)
            onClose()
          })
        } else {
          Animated.spring(sheetY, { toValue: 0, useNativeDriver: true }).start()
        }
      },
    })
  ).current

  if (!isShown && !visible) return null

  return (
    <Modal visible={isShown} transparent animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <TouchableOpacity style={sh.backdrop} activeOpacity={1} onPress={onClose} />

      <Animated.View style={[sh.sheet, { transform: [{ translateY: sheetY }], paddingBottom: insets.bottom + 24 }]}>
        {/* Drag handle */}
        <View {...panResponder.panHandlers} style={sh.handleArea}>
          <View style={sh.handle} />
        </View>

        {/* Header */}
        <View style={sh.headerRow}>
          <Text style={sh.headerTitle}>DBS VERIFICATION</Text>
          <Text style={sh.headerSub}>What you need to know</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={sh.scrollContent}>

          {/* Why we require this */}
          <Text style={sh.sectionTitle}>Why we require this</Text>
          <Text style={sh.body}>
            Tranxfer Market connects scouts with young players across grassroots football. To protect the safety of young people, the FA and governing bodies require that all adults working with children and young people in football hold a valid Enhanced DBS (Disclosure and Barring Service) certificate.{'\n\n'}
            Before your account can be fully activated, we must verify your DBS status. Your account will be restricted until all three checks below are confirmed by our team.
          </Text>

          {/* Which path */}
          <Text style={sh.sectionTitle}>Which path are you on?</Text>

          {/* Path A */}
          <View style={sh.pathCard}>
            <View style={sh.pathHeader}>
              <Text style={sh.pathLetter}>A</Text>
              <Text style={sh.pathTitle}>I don't have an Enhanced DBS</Text>
            </View>
            <Text style={sh.bullet}>• Apply for an Enhanced DBS through an umbrella body (e.g. Disclosure Scotland or an FA-approved provider)</Text>
            <Text style={sh.bullet}>• Register for the DBS Update Service <Text style={sh.cost}>immediately</Text> — you have a strict 30-day window after your certificate is issued</Text>
            <Text style={sh.bullet}>• Complete identity verification and submit your certificate number here once received</Text>
            <View style={sh.costRow}>
              <Text style={sh.costLabel}>Year 1: </Text>
              <Text style={sh.cost}>~£71–£96</Text>
              <Text style={sh.costLabel}>  ·  Year 2+: </Text>
              <Text style={sh.cost}>£16/year</Text>
            </View>
          </View>

          {/* Path B */}
          <View style={sh.pathCard}>
            <View style={sh.pathHeader}>
              <Text style={sh.pathLetter}>B</Text>
              <Text style={sh.pathTitle}>I have Enhanced DBS + Update Service</Text>
            </View>
            <Text style={sh.bullet}>• Enter your 12-digit certificate number in the DBS section below</Text>
            <Text style={sh.bullet}>• Confirm that you're registered on the DBS Update Service</Text>
            <Text style={sh.bullet}>• We'll verify your current status via the Update Service</Text>
            <View style={sh.costRow}>
              <Text style={sh.costLabel}>Cost: </Text>
              <Text style={sh.cost}>£0 upfront  ·  £16/year</Text>
            </View>
          </View>

          {/* Path C */}
          <View style={sh.pathCard}>
            <View style={sh.pathHeader}>
              <Text style={sh.pathLetter}>C</Text>
              <Text style={sh.pathTitle}>I have Enhanced DBS but NOT on Update Service</Text>
            </View>
            <Text style={sh.body}>
              Unfortunately, you must apply for a new DBS check. The Update Service has a strict <Text style={{ color: Colors.brand }}>30-day registration window</Text> after your certificate is issued — there is no way to add an older certificate retroactively.
            </Text>
            <View style={sh.costRow}>
              <Text style={sh.costLabel}>Cost: </Text>
              <Text style={sh.cost}>Same as Path A</Text>
            </View>
          </View>

          {/* Update Service */}
          <Text style={sh.sectionTitle}>The DBS Update Service</Text>
          <Text style={sh.bullet}>• £16/year — keeps your certificate current without reapplying</Text>
          <Text style={sh.bullet}>• Set up <Text style={sh.cost}>auto-renewal</Text> — if your subscription lapses, you'll need a full new DBS check</Text>
          <Text style={sh.bullet}>• With your consent, we check your status periodically to ensure it remains valid</Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://www.gov.uk/dbs-update-service')}>
            <Text style={sh.link}>→ Sign up for the Update Service (gov.uk)</Text>
          </TouchableOpacity>

          {/* Quick reference table */}
          <Text style={sh.sectionTitle}>Quick reference</Text>
          <View style={sh.table}>
            <View style={sh.tableRow}>
              <Text style={sh.tableHead}>Scenario</Text>
              <Text style={sh.tableHead}>Upfront</Text>
              <Text style={sh.tableHead}>Annual</Text>
            </View>
            {[
              ['New DBS + Update Service',    '~£71–96', '£16'],
              ['Existing DBS + Update Svc',   '£0',      '£16'],
              ['DBS only (no Update Service)', 'N/A',     'Must reapply'],
            ].map(([scenario, upfront, annual]) => (
              <View key={scenario} style={sh.tableRow}>
                <Text style={[sh.tableCell, { flex: 2 }]}>{scenario}</Text>
                <Text style={sh.tableCell}>{upfront}</Text>
                <Text style={sh.tableCell}>{annual}</Text>
              </View>
            ))}
          </View>

          {/* FA Safeguarding */}
          <Text style={sh.sectionTitle}>FA Safeguarding course</Text>
          <Text style={sh.bullet}>• Free online course, approximately 2 hours to complete</Text>
          <Text style={sh.bullet}>• Certificate is valid for <Text style={sh.cost}>2 years</Text> from completion</Text>
          <Text style={sh.bullet}>• Mandatory for all scouts and coaches working with youth players</Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://learn.englandfootball.com')}>
            <Text style={sh.link}>→ Complete the course at learn.englandfootball.com</Text>
          </TouchableOpacity>

          {/* GOT IT */}
          <TouchableOpacity style={sh.gotItBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={sh.gotItText}>GOT IT</Text>
          </TouchableOpacity>

        </ScrollView>
      </Animated.View>
    </Modal>
  )
}

const sh = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: SCREEN_H * 0.85,
    backgroundColor: '#111111',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  headerRow: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 4,
  },
  headerTitle: {
    fontFamily: 'Anton_400Regular',
    fontSize: 22,
    color: Colors.text,
    letterSpacing: 1.5,
  },
  headerSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    letterSpacing: 0.28,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: 16,
    gap: 10,
  },
  sectionTitle: {
    fontFamily: 'Anton_400Regular',
    fontSize: 16,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: Spacing.md,
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    letterSpacing: 0.28,
  },
  bullet: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    letterSpacing: 0.28,
    paddingLeft: 4,
  },
  pathCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 8,
    marginVertical: 4,
  },
  pathHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  pathLetter: {
    fontFamily: 'Anton_400Regular',
    fontSize: 22,
    color: Colors.brand,
    letterSpacing: 1,
  },
  pathTitle: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
    flex: 1,
    letterSpacing: 0.3,
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  costLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    letterSpacing: 0.26,
  },
  cost: {
    fontSize: 13,
    color: Colors.brand,
    fontWeight: '700',
    letterSpacing: 0.26,
  },
  link: {
    fontSize: 14,
    color: Colors.brand,
    letterSpacing: 0.28,
    textDecorationLine: 'underline',
    marginTop: 4,
  },
  table: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginVertical: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    gap: 8,
  },
  tableHead: {
    flex: 1,
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tableCell: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    letterSpacing: 0.26,
  },
  gotItBtn: {
    height: 57,
    backgroundColor: Colors.text,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  gotItText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.28,
    textTransform: 'uppercase',
  },
})
