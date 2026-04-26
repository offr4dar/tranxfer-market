import {
  Modal, View, Text, TouchableOpacity,
  StyleSheet, Pressable,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path } from 'react-native-svg'

// ─── Close (×) icon ───────────────────────────────────────────────────────────
function CloseIcon() {
  return (
    <Svg width={21} height={21} viewBox="0 0 21 21" fill="none">
      <Path
        d="M1.5 1.5L19.5 19.5M19.5 1.5L1.5 19.5"
        stroke="#ffffff"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
type Props = {
  /** Whether the modal is visible */
  visible: boolean
  /** Called when the user confirms (YES, CANCEL) */
  onConfirm: () => void
  /** Called when the user dismisses (NO, STAY / X / backdrop tap) */
  onDismiss: () => void
  /** Optional override for the title line */
  title?: string
  /** Optional override for the body copy */
  body?: string
  /** Label for the confirm CTA */
  confirmLabel?: string
  /** Label for the dismiss CTA */
  dismissLabel?: string
}

export default function ConfirmCancelModal({
  visible,
  onConfirm,
  onDismiss,
  title       = 'ARE YOU SURE?',
  body        = 'Confirm below to cancel the registration process',
  confirmLabel = 'YES, CANCEL',
  dismissLabel = 'NO, STAY',
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      {/* ── Blurred dark backdrop ─────────────────────────────────────────── */}
      <BlurView intensity={50} tint="dark" style={st.backdrop}>
        {/* Extra dark veil on top of the blur */}
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(7,7,7,0.72)' }]}
          pointerEvents="none"
        />

        {/* Tap-outside = dismiss */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />

        {/* ── Centered modal card ───────────────────────────────────────── */}
        <View style={st.card}>
          {/* Gradient background layer */}
          <LinearGradient
            colors={['rgba(0,0,0,0.44)', 'rgba(155,155,155,0)']}
            start={{ x: 0, y: 1 }}     // bottom-left → top-right (≈ 20°)
            end={{ x: 0.4, y: 0 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 30 }]}
            pointerEvents="none"
          />

          {/* × Close button */}
          <TouchableOpacity
            style={st.closeBtn}
            onPress={onDismiss}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <CloseIcon />
          </TouchableOpacity>

          {/* Content */}
          <View style={st.content}>
            <Text style={st.title}>{title}</Text>
            <Text style={st.body}>{body}</Text>

            {/* CTAs */}
            <View style={st.ctaRow}>
              {/* Dismiss — green primary (now first) */}
              <TouchableOpacity
                style={st.btnPrimary}
                onPress={onDismiss}
                activeOpacity={0.85}
              >
                <Text style={st.btnPrimaryText}>{dismissLabel}</Text>
              </TouchableOpacity>

              {/* Confirm — outlined (now second) */}
              <TouchableOpacity
                style={st.btnOutlined}
                onPress={onConfirm}
                activeOpacity={0.85}
              >
                <Text style={st.btnOutlinedText}>{confirmLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </BlurView>
    </Modal>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ACCENT = '#00FF87'

const st = StyleSheet.create({
  // Full-screen blurred backdrop that also centres the card
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  // Modal card
  card: {
    width: 335,
    backgroundColor: '#1a1a1a',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    overflow: 'hidden',
  },

  // × close — absolute top-right of the card
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
  },

  // Content sits below the X button
  content: {
    paddingTop: 40,
    gap: 10,
    alignItems: 'center',
  },

  title: {
    fontFamily: 'Anton_400Regular',
    fontSize: 24,
    color: '#ffffff',
    letterSpacing: 0.48,
    textTransform: 'uppercase',
    textAlign: 'center',
    paddingBottom: 9,
  },

  body: {
    fontSize: 16,
    color: '#ffffff',
    letterSpacing: 0.32,
    textAlign: 'center',
    lineHeight: 19.4, // 16 × 1.21
  },

  ctaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    width: '100%',
  },

  // Green primary CTA
  btnPrimary: {
    flex: 1,
    height: 57,
    backgroundColor: ACCENT,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.28,
    textTransform: 'uppercase',
  },

  // Outlined secondary CTA
  btnOutlined: {
    flex: 1,
    height: 57,
    backgroundColor: 'rgba(0,0,0,0.31)',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutlinedText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.28,
    textTransform: 'uppercase',
  },
})
