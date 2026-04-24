import { useCallback, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, Animated, Dimensions, Easing,
  TouchableOpacity, TextInput, ScrollView, Modal,
  FlatList, ActivityIndicator, Platform, ImageBackground,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSignUp } from '@clerk/clerk-expo'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import MaskedView from '@react-native-masked-view/masked-view'
import Svg, { Path } from 'react-native-svg'
import { SvgXml } from 'react-native-svg'
import { supabase } from '@/lib/supabase'

const { width: W } = Dimensions.get('window')
const H_PAD = 20
const ACCENT = '#00FF87'

// ─── Bundled SVG icons (inlined for native SVG rendering) ────────────────────
const SVG_PLAYER = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_361_264)"><path d="M41.5456 17.4445C39.8048 16.9307 37.6574 15.9505 35.732 14.1446C39.068 13.93 40.9909 13.7726 41.0171 13.7705C43.2028 13.6398 44.161 14.4574 44.5489 17.1639C44.6319 17.7442 44.7273 18.5608 44.8197 19.5337C44.1469 18.6467 43.1005 17.9047 41.5456 17.4445Z" fill="#00FF87"/><path d="M54.3827 61.8682C53.4482 61.376 52.531 60.8506 51.6326 60.2954C51.6222 60.2889 51.6118 60.2822 51.6014 60.2757L48.8303 62.0195C48.4857 62.2362 47.9732 62.1786 47.6854 61.8909L45.8048 60.0102C45.517 59.7224 45.4594 59.2099 45.6762 58.8654L46.8601 56.984C45.6673 56.0693 44.5039 55.1151 43.3648 54.1334L41.8616 55.0537C41.5145 55.2662 40.9998 55.2052 40.712 54.9174L38.665 52.8704C38.3772 52.5827 38.3162 52.0679 38.5287 51.7208L39.3044 50.4539C38.16 49.3714 37.033 48.2706 35.9208 47.155C30.6029 41.8216 25.6479 36.1487 20.489 30.6655L18.6186 31.8107C18.2715 32.0232 17.7569 31.9623 17.469 31.6744L15.422 29.6274C15.1342 29.3396 15.0732 28.8249 15.2857 28.4778L16.5175 26.466C15.8735 25.7822 15.2129 25.0796 14.5587 24.3828L12.4697 25.6618C12.1226 25.8743 11.6078 25.8133 11.3201 25.5255L9.27304 23.4785C8.98521 23.1906 8.92425 22.6759 9.13674 22.3289L10.5196 20.0703C9.7058 19.1999 9.04019 18.487 8.61731 18.0338C8.33954 17.7362 8.28375 17.2117 8.49504 16.8637C9.65962 14.9454 13.0775 9.00519 15.3384 6.47992C15.677 6.10158 16.0092 5.75047 16.3356 5.42405C16.8703 4.8893 17.3856 4.42949 17.889 4.02074C17.9661 7.56459 19.2702 13.1026 21.2842 17.5948C23.7506 23.0984 25.4927 27.307 24.8741 30.6126C25.4311 31.2412 25.9968 31.8807 26.5707 32.5305L29.9687 36.4167C30.0891 36.5551 30.2099 36.6937 30.3305 36.8324C30.4299 35.3939 30.4018 31.1063 27.3288 25.9819C23.6899 19.9174 18.7329 9.81636 18.9102 3.2523C19.4669 2.86757 20.1612 2.70946 20.6798 2.44927C20.9604 5.07159 22.0978 11.3644 26.6954 19.452C31.4968 27.8945 35.9534 34.7979 34.7086 41.8161C36.3713 43.6776 38.0696 45.5293 39.8246 47.3424C40.1199 45.6889 41.0313 38.0295 34.702 28.7213C27.8115 18.5886 22.8838 9.63161 22.1407 1.83849C23.482 1.38511 24.5762 1.19654 25.6678 1.09583C27.1592 0.958272 30.0305 0.353969 31.1122 1.74471C31.6606 2.44988 31.4362 3.29302 31.2077 4.07041C30.9461 4.95988 30.7538 5.84733 30.7366 6.77907C30.7028 8.60891 31.236 10.4461 32.0937 12.052C34.1351 15.8734 38.6268 18.2712 41.0178 18.9377C42.5845 19.3733 44.2941 20.4917 44.6393 22.1852C44.7576 22.7656 44.7475 23.3579 44.7773 23.9463C44.7873 24.1422 44.8037 24.342 44.822 24.543L41.1773 24.9822C40.6871 25.0348 40.3329 25.4792 40.3875 25.9683C40.4426 26.4589 40.885 26.8132 41.3757 26.7581L45.0597 26.3151C45.2035 27.1158 46.6692 32.1008 46.9973 32.96L43.8633 33.8553C43.3862 33.9702 43.0897 34.4536 43.2052 34.9332C43.3216 35.414 43.8038 35.7083 44.2863 35.5933L47.6684 34.6388C48.3201 36.1985 49.0435 37.7237 49.7682 39.2503C50.0809 39.909 50.3778 40.5784 50.732 41.2161C51.2013 42.0609 51.6703 42.9059 52.142 43.7494C52.7385 44.8164 53.3322 45.885 53.9365 46.9476C54.3394 47.656 54.7553 48.3536 55.1803 49.0489C56.1759 50.6775 57.1928 52.3132 57.9947 54.0487C58.5245 55.1957 59.064 56.5399 58.6945 57.8148C58.5333 58.371 58.1848 59.0652 57.7712 59.4788C57.7414 59.5086 56.3442 60.9025 55.5592 61.6858C55.2711 61.9732 54.7428 62.0579 54.3827 61.8682Z" fill="#00FF87"/></g><defs><clipPath id="clip0_361_264"><rect width="64" height="64" fill="white"/></clipPath></defs></svg>`

const SVG_AGENT = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M49.75 7H14.75C13.0931 7 11.75 8.34315 11.75 10V60C11.75 61.6569 13.0931 63 14.75 63H49.75C51.4069 63 52.75 61.6569 52.75 60V10C52.75 8.34315 51.4069 7 49.75 7Z" fill="#00FF87"/><path d="M32.25 6C33.6307 6 34.75 4.88071 34.75 3.5C34.75 2.11929 33.6307 1 32.25 1C30.8693 1 29.75 2.11929 29.75 3.5C29.75 4.88071 30.8693 6 32.25 6Z" fill="#00FF87"/><path d="M48.75 11H15.75V59H48.75V11Z" fill="#262E24"/><path d="M25.749 4.5H38.751C40.683 4.50019 42.25 6.07117 42.25 8V11.5H22.25V8C22.25 6.06703 23.8165 4.50019 25.749 4.5Z" fill="#287B49" stroke="#00FF87"/><path d="M24.5 52C26.1569 52 27.5 50.6569 27.5 49C27.5 47.3431 26.1569 46 24.5 46C22.8431 46 21.5 47.3431 21.5 49C21.5 50.6569 22.8431 52 24.5 52Z" stroke="#00FF87" stroke-width="2" stroke-linecap="round"/><path d="M26.5 32L32.0445 37.5445M26.5 37.5445L32.0445 32" stroke="#00FF87" stroke-width="2" stroke-linecap="round"/><path d="M38.1643 21.5278C37.9034 21.437 37.6185 21.5749 37.5278 21.8357L36.0494 26.086C35.9587 26.3468 36.0966 26.6318 36.3574 26.7225C36.6182 26.8132 36.9032 26.6753 36.9939 26.4145L38.308 22.6365L42.086 23.9506C42.3468 24.0413 42.6318 23.9034 42.7225 23.6426C42.8132 23.3818 42.6753 23.0968 42.4145 23.0061L38.1643 21.5278ZM30.5 48.5L30.6923 48.9615C31.0112 48.8286 31.3231 48.6928 31.6279 48.554L31.4208 48.099L31.2136 47.6439C30.9189 47.7781 30.6169 47.9096 30.3077 48.0385L30.5 48.5ZM33.2133 47.2034L33.4538 47.6418C34.0716 47.3029 34.6546 46.9491 35.2033 46.5805L34.9244 46.1654L34.6455 45.7504C34.1233 46.1013 33.566 46.4396 32.9729 46.765L33.2133 47.2034ZM36.5242 44.9639L36.8463 45.3464C37.3878 44.8903 37.8852 44.4149 38.3389 43.9204L37.9705 43.5824L37.6021 43.2444C37.1788 43.7058 36.7125 44.1516 36.2021 44.5815L36.5242 44.9639ZM39.2123 42.0158L39.6262 42.2963C40.02 41.7151 40.362 41.1123 40.6532 40.4883L40.2001 40.2769L39.747 40.0654C39.4784 40.6409 39.1627 41.1976 38.7983 41.7354L39.2123 42.0158ZM40.8984 38.4031L41.3792 38.5402C41.567 37.8815 41.7056 37.2039 41.7965 36.5081L41.3007 36.4433L40.8049 36.3785C40.7201 37.0274 40.5912 37.6566 40.4175 38.266L40.8984 38.4031ZM41.4279 34.446L41.9279 34.4464C41.9283 33.777 41.8899 33.093 41.814 32.3948L41.3169 32.4489L40.8199 32.503C40.8921 33.1674 40.9283 33.815 40.9279 34.4457L41.4279 34.446ZM41.008 30.4714L41.4981 30.3727C41.3673 29.723 41.2072 29.0619 41.0186 28.3896L40.5372 28.5246L40.0557 28.6597C40.238 29.3096 40.3922 29.9464 40.5178 30.5701L41.008 30.4714ZM39.9353 26.6155L40.4074 26.4509C40.1904 25.8285 39.9511 25.1971 39.6899 24.5568L39.2269 24.7456L38.764 24.9345C39.019 25.5598 39.2522 26.175 39.4631 26.7801L39.9353 26.6155ZM38.4287 22.9081L38.8829 22.6991C38.7432 22.3954 38.5989 22.0898 38.4501 21.7822L38 22L37.5499 22.2178C37.696 22.5196 37.8375 22.8194 37.9744 23.1171L38.4287 22.9081Z" fill="#00FF87"/></svg>`

const SVG_CLUB = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M31.5 61.6201C24.0758 57.062 19.4787 49.8327 16.7812 42.5635C14.0488 35.2 13.2858 27.8431 13.4883 23.3008L31.5 13.3477V61.6201Z" stroke="#00FF87"/><path d="M32.5 61.6201C39.9242 57.062 44.5213 49.8327 47.2188 42.5635C49.9512 35.2 50.7142 27.8431 50.5117 23.3008L32.5 13.3477V61.6201Z" stroke="#00FF87"/><path d="M32 13.5L14 23.5L30.7 60.52L32 61.4L33.3 60.52L50 23.5L32 13.5Z" fill="#152112"/><path d="M32 15.5L31.9999 58.5C19.1999 51.1099 15.8333 32.7541 16 24.5L32 15.5Z" fill="#00FF87"/><path d="M32 15.5L31.9999 58.5C44.7999 51.1099 48.1666 32.7541 48 24.5L32 15.5Z" fill="#287B49"/><path d="M32.61 42.2536L36.6388 41.2648L34.1478 35.3258L38.5 28L34.4712 28.9888L32.8029 31.7753L32.6724 31.8074L31.7702 29.6501L27.679 30.6517L30.0906 36.321L25.5 44L29.5912 42.9984L31.4297 39.8909L31.5943 39.8523L32.61 42.2536Z" fill="#152112"/><path d="M33.1492 3.4344L32.0392 0L30.9162 3.4344H27.312L30.2371 5.54989L29.1141 8.98429L32.0392 6.8688L34.9513 8.98429L33.8413 5.54989L36.7532 3.4344H33.1492Z" fill="#00FF87"/><path d="M22.7023 5.99388L21.5923 2.55948L20.4823 5.99388H16.8782L19.7902 8.10937L18.6803 11.5438L21.5923 9.42828L24.5174 11.5438L23.3944 8.10937L26.3195 5.99388H22.7023Z" fill="#00FF87"/><path d="M12.3338 9.50662L11.2238 12.941H7.61963L10.5317 15.0565L9.42171 18.4909L12.3338 16.3624L15.2589 18.4909L14.1359 15.0565L17.061 12.941H13.4568L12.3338 9.50662Z" fill="#00FF87"/><path d="M42.3946 2.55948L41.2846 5.99388H37.6804L40.5925 8.10937L39.4825 11.5438L42.3946 9.42828L45.3195 11.5438L44.1965 8.10937L47.1218 5.99388H43.5176L42.3946 2.55948Z" fill="#00FF87"/><path d="M52.776 12.941L51.6529 9.50662L50.5429 12.941H46.9387L49.8509 15.0565L48.7409 18.4909L51.6529 16.3624L54.578 18.4909L53.4551 15.0565L56.3802 12.941H52.776Z" fill="#00FF87"/></svg>`

type Role = 'player' | 'agent' | 'club'
interface WizardData {
  role: Role | null
  firstName: string; lastName: string; age: string
  outwardCode: string; postcode: string
  email: string; password: string
}
const INIT: WizardData = { role: null, firstName: '', lastName: '', age: '', outwardCode: '', postcode: '', email: '', password: '' }
const AGES = Array.from({ length: 60 }, (_, i) => String(i + 16))

// ─── Icons ────────────────────────────────────────────────────────────────────
function CheckIcon() {
  return (
    <Svg width={14} height={11} viewBox="0 0 14 11" fill="none">
      <Path d="M1 5.5L5 9.5L13 1" stroke="#001209" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}
function ChevronDown() {
  return (
    <Svg width={12} height={7} viewBox="0 0 12 7" fill="none">
      <Path d="M1 1L6 6L11 1" stroke="white" strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  )
}
// ─── Step indicator ───────────────────────────────────────────────────────────
type StepStatus = 'active' | 'complete' | 'inactive'
function StepCircle({ status }: { status: StepStatus }) {
  return (
    <View style={[
      sc.circle,
      status === 'active' && sc.circleActive,
      status === 'complete' && sc.circleDone,
      status === 'inactive' && sc.circleInactive,
    ]}>
      {status === 'active' && <View style={sc.dot} />}
      {status === 'complete' && <CheckIcon />}
    </View>
  )
}
function StepRow({ step, opacities, translates }: {
  step: number
  opacities: Animated.Value[]
  translates: Animated.Value[]
}) {
  const status = (i: number): StepStatus =>
    i < step ? 'complete' : i === step ? 'active' : 'inactive'
  return (
    <View style={sc.row}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', flex: i < 3 ? 1 : 0 }}>
          <Animated.View style={{ opacity: opacities[i], transform: [{ translateY: translates[i] }] }}>
            <StepCircle status={status(i)} />
          </Animated.View>
          {i < 3 && <View style={[sc.connector, i < step - 1 && sc.connectorDone]} />}
        </View>
      ))}
    </View>
  )
}
const sc = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  circle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  // Active: green ring outline + bright center dot
  circleActive: { borderWidth: 2, borderColor: ACCENT, backgroundColor: 'transparent' },
  // Done: fully filled bright green + dark checkmark
  circleDone: { backgroundColor: ACCENT, borderWidth: 0 },
  // Inactive: dark solid filled circle, no border
  circleInactive: { backgroundColor: 'rgba(0, 255, 135, 0.06)', borderWidth: 1, borderColor: 'rgba(0,255,135,0.15)' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: ACCENT },
  connector: { flex: 1, height: 3, backgroundColor: 'rgba(217,217,217,0.15)', borderRadius: 100 },
  connectorDone: { backgroundColor: 'rgba(0,255,135,0.35)' },
})

// Line height matches splash screen: fontSize * 1.2, each line rendered separately
const TITLE_SIZE = 50
const TITLE_LH = TITLE_SIZE * 1.2  // 60px — same ratio as splash
const TITLE_GAP = -8                // slight pull between lines

function GradientTitle({ text }: { text: string }) {
  const lines = text.split('\n')
  if (Platform.OS === 'web') {
    return (
      <View>
        {lines.map((l, i) => (
          <Text key={i} style={[gt.text, i < lines.length - 1 && { marginBottom: TITLE_GAP },
          {
            background: 'linear-gradient(214deg, #ffffff 31%, #82c3a5 92%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          } as any]}>
            {l}
          </Text>
        ))}
      </View>
    )
  }
  // Native: MaskedView per line so each clips correctly
  return (
    <View style={{ alignSelf: 'stretch' }}>
      {lines.map((l, i) => (
        <MaskedView
          key={i}
          style={[{ height: TITLE_LH }, i < lines.length - 1 && { marginBottom: TITLE_GAP }]}
          maskElement={
            <View style={{ backgroundColor: 'transparent', height: TITLE_LH, justifyContent: 'center' }}>
              <Text style={gt.text}>{l}</Text>
            </View>
          }
        >
          <LinearGradient
            colors={['#ffffff', '#82c3a5']}
            start={{ x: 0.7, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ width: '100%', height: TITLE_LH }}
          />
        </MaskedView>
      ))}
    </View>
  )
}
const gt = StyleSheet.create({
  text: {
    fontFamily: 'Anton_400Regular',
    fontSize: TITLE_SIZE,
    lineHeight: TITLE_LH,
    color: '#fff',
    letterSpacing: 1,
    textTransform: 'uppercase',
  }
})

// ─── Step 1: Role cards ───────────────────────────────────────────────────────
const ROLES = [
  { key: 'player' as Role, label: 'Player', svg: SVG_PLAYER },
  { key: 'agent' as Role, label: 'Agent', svg: SVG_AGENT },
  { key: 'club' as Role, label: 'Club', svg: SVG_CLUB },
]
function RoleStep({ data, onChange }: { data: WizardData; onChange: (d: Partial<WizardData>) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 16 }}>
      {ROLES.map(r => (
        <TouchableOpacity key={r.key} style={[rs.card, data.role === r.key && rs.cardSelected]}
          onPress={() => onChange({ role: r.key })} activeOpacity={0.8}>
          <SvgXml xml={r.svg} width={64} height={64} />
          <Text style={rs.label}>{r.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}
const rs = StyleSheet.create({
  card: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.26)', padding: 20, alignItems: 'center', gap: 20 },
  cardSelected: { backgroundColor: 'rgba(0,0,0,0.34)', borderColor: '#ffffff' },
  label: { fontSize: 12, color: '#fff', fontWeight: '700', letterSpacing: 0.24, textTransform: 'uppercase', textAlign: 'center' },
})

// ─── Step 2: Profile ──────────────────────────────────────────────────────────
function ProfileStep({ data, onChange }: { data: WizardData; onChange: (d: Partial<WizardData>) => void }) {
  const [showAge, setShowAge] = useState(false)
  return (
    <View style={{ gap: 24 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={fs.label}>First name</Text>
          <TextInput style={fs.input} placeholderTextColor="#909090" placeholder="John"
            value={data.firstName} onChangeText={v => onChange({ firstName: v })} autoCapitalize="words" />
        </View>
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={fs.label}>Last name</Text>
          <TextInput style={fs.input} placeholderTextColor="#909090" placeholder="Doe"
            value={data.lastName} onChangeText={v => onChange({ lastName: v })} autoCapitalize="words" />
        </View>
      </View>
      <View style={{ gap: 5 }}>
        <Text style={fs.label}>What's your age?</Text>
        <TouchableOpacity style={fs.select} onPress={() => setShowAge(true)} activeOpacity={0.85}>
          <Text style={data.age ? fs.val : fs.ph}>{data.age || 'Select age'}</Text>
          <ChevronDown />
        </TouchableOpacity>
      </View>
      <Modal visible={showAge} transparent animationType="slide">
        <View style={fs.pickerBg}>
          <View style={fs.pickerSheet}>
            <View style={fs.pickerHead}>
              <Text style={{ fontSize: 18, color: '#fff', fontWeight: '600' }}>Select age</Text>
              <TouchableOpacity onPress={() => setShowAge(false)}><Text style={{ color: ACCENT, fontSize: 16 }}>Done</Text></TouchableOpacity>
            </View>
            <FlatList data={AGES} keyExtractor={i => i} renderItem={({ item }) => (
              <TouchableOpacity style={{ paddingVertical: 14, paddingHorizontal: 20 }}
                onPress={() => { onChange({ age: item }); setShowAge(false) }}>
                <Text style={{ fontSize: 18, color: data.age === item ? ACCENT : '#fff' }}>{item}</Text>
              </TouchableOpacity>
            )} />
          </View>
        </View>
      </Modal>
    </View>
  )
}

// ─── Step 3: Location ─────────────────────────────────────────────────────────
function LocationStep({ data, onChange }: { data: WizardData; onChange: (d: Partial<WizardData>) => void }) {
  const [chips, setChips] = useState<string[]>([])
  const [fetching, setFetching] = useState(false)
  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setChips([]); return }
    setFetching(true)
    try {
      const res = await fetch(`https://api.postcodes.io/postcodes?q=${encodeURIComponent(q)}&limit=30`)
      const json = await res.json()
      if (json.result) setChips([...new Set<string>(json.result.map((p: any) => p.outcode as string))].sort())
    } catch { setChips([]) } finally { setFetching(false) }
  }, [])
  return (
    <View style={{ gap: 24 }}>
      <View style={{ gap: 5 }}>
        <Text style={fs.label}>Where are you based?</Text>
        <Text style={fs.hint}>Only the first half is needed. This helps determine your proximity to matched clubs.</Text>
        <TextInput style={[fs.input, { marginTop: 4 }]} placeholderTextColor="#909090" placeholder="e.g. SE1"
          value={data.outwardCode}
          onChangeText={v => { const u = v.toUpperCase(); onChange({ outwardCode: u, postcode: '' }); search(u) }}
          autoCapitalize="characters" />
      </View>
      {(chips.length > 0 || fetching) && (
        <View style={{ gap: 8 }}>
          <Text style={[fs.label, { textAlign: 'center' }]}>Select your postcode</Text>
          {fetching ? <ActivityIndicator color={ACCENT} /> : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {chips.map(c => (
                <TouchableOpacity key={c} style={[cs.chip, data.postcode === c && cs.chipActive]}
                  onPress={() => onChange({ postcode: c, outwardCode: c })}>
                  <Text style={cs.chipText}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  )
}

// ─── Step 4: Account ─────────────────────────────────────────────────────────
function AccountStep({ data, onChange }: { data: WizardData; onChange: (d: Partial<WizardData>) => void }) {
  return (
    <View style={{ gap: 24 }}>
      <View style={{ gap: 5 }}>
        <Text style={fs.label}>Email</Text>
        <TextInput style={fs.input} placeholderTextColor="#909090" placeholder="you@example.com"
          value={data.email} onChangeText={v => onChange({ email: v })} keyboardType="email-address" autoCapitalize="none" />
      </View>
      <View style={{ gap: 5 }}>
        <Text style={fs.label}>Password</Text>
        <TextInput style={fs.input} placeholderTextColor="#909090" placeholder="Min. 8 characters"
          value={data.password} onChangeText={v => onChange({ password: v })} secureTextEntry />
      </View>
    </View>
  )
}

// ─── Shared field styles ──────────────────────────────────────────────────────
const fs = StyleSheet.create({
  label: { fontSize: 16, color: '#fff', letterSpacing: 0.32 },
  hint: { fontSize: 14, color: '#c1c1c1', letterSpacing: 0.28 },
  input: { height: 59, backgroundColor: 'rgba(0,0,0,0.31)', borderWidth: 1, borderColor: '#4f4f4f', borderRadius: 10, paddingHorizontal: 20, fontSize: 16, color: '#fff' },
  select: { height: 59, backgroundColor: 'rgba(0,0,0,0.31)', borderWidth: 1, borderColor: '#4f4f4f', borderRadius: 10, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  val: { fontSize: 16, color: '#fff' },
  ph: { fontSize: 16, color: '#909090' },
  pickerBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  pickerSheet: { backgroundColor: '#1a1a1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '60%', paddingBottom: 40 },
  pickerHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
})
const cs = StyleSheet.create({
  chip: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.11)' },
  chipActive: { borderWidth: 1, borderColor: ACCENT, backgroundColor: 'rgba(0,255,135,0.12)' },
  chipText: { fontSize: 16, color: '#fff', fontWeight: '700', letterSpacing: 0.32 },
})

// ─── Validation ───────────────────────────────────────────────────────────────
function validate(step: number, data: WizardData): string {
  if (step === 0 && !data.role) return 'Please select your profile type'
  if (step === 1 && !data.firstName.trim()) return 'Please enter your first name'
  if (step === 1 && !data.lastName.trim()) return 'Please enter your last name'
  if (step === 1 && !data.age) return 'Please select your age'
  if (step === 2 && !data.postcode) return 'Please select a postcode'
  if (step === 3 && !data.email.trim()) return 'Please enter your email'
  if (step === 3 && data.password.length < 8) return 'Password must be at least 8 characters'
  return ''
}
function isStepValid(step: number, data: WizardData) { return validate(step, data) === '' }

// ─── Screen titles per step ───────────────────────────────────────────────────
const TITLES = ['SELECT YOUR\nPROFILE', 'TELL US ABOUT\nYOU', 'WHERE ARE YOU\nBASED?', 'CREATE YOUR\nACCOUNT']

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const router  = useRouter()
  const insets  = useSafeAreaInsets()
  const { signUp, setActive, isLoaded } = useSignUp()

  const [step,        setStep]        = useState(0)
  const [displayStep, setDisplayStep] = useState(0)
  const [data,        setData]        = useState<WizardData>(INIT)
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [pendingStep, setPendingStep] = useState<number | null>(null)
  const [inTrans,     setInTrans]     = useState(false)

  // Dual-panel parallax
  const currentX       = useRef(new Animated.Value(0)).current
  const incomingX      = useRef(new Animated.Value(0)).current
  const currentOpacity = useRef(new Animated.Value(1)).current
  // Per-dot opacity — only changing dots fade
  const dotOpacities   = useRef([0,1,2,3].map(() => new Animated.Value(1))).current
  const dotTranslates  = useRef([0,1,2,3].map(() => new Animated.Value(0))).current

  const update = (p: Partial<WizardData>) => { setData(d => ({ ...d, ...p })); setError('') }

  const animateStep = (dir: 1 | -1, next: number) => {
    if (inTrans) return
    // Panels: no parallax — both travel full width simultaneously
    const EXIT_TO    = -dir * W
    const ENTER_FROM =  dir * W
    const D = 380, ease = Easing.bezier(0.25, 0.46, 0.45, 0.94)

    currentX.setValue(0); incomingX.setValue(ENTER_FROM); currentOpacity.setValue(1)
    setPendingStep(next); setInTrans(true)

    // Dot animation: old active slides down+out, new active slides in from above
    Animated.parallel([
      Animated.timing(dotOpacities[step],  { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(dotTranslates[step], { toValue: 8, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      // Snap old dot back (it now renders as done/inactive — invisible reset)
      dotTranslates[step].setValue(0)
      dotOpacities[step].setValue(1)
      // Position incoming dot above, then slide+fade it in
      dotTranslates[next].setValue(-10)
      dotOpacities[next].setValue(0)
      setDisplayStep(next)
      Animated.parallel([
        Animated.timing(dotOpacities[next],  { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(dotTranslates[next], { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start()
    })

    // Title + content slide together; outgoing fades out in last 35%
    Animated.parallel([
      Animated.timing(currentX,       { toValue: EXIT_TO, duration: D,        easing: ease, useNativeDriver: true }),
      Animated.timing(incomingX,      { toValue: 0,       duration: D,        easing: ease, useNativeDriver: true }),
      Animated.timing(currentOpacity, { toValue: 0,       duration: D * 0.35, delay: D * 0.65, useNativeDriver: true }),
    ]).start(() => {
      // 1. Update step state — React schedules a re-render of the current panel with new content
      setStep(next)
      currentX.setValue(0)
      incomingX.setValue(0)
      // 2. Wait for React to commit that render, THEN reveal the current panel and unmount incoming
      //    Without this, setValue(1) races ahead of setStep() and the old content flashes for a frame
      requestAnimationFrame(() => {
        currentOpacity.setValue(1)
        setPendingStep(null)
        setInTrans(false)
      })
    })
  }

  const goNext = async () => {
    const err = validate(step, data)
    if (err) { setError(err); return }
    if (step < 3) { animateStep(1, step + 1); return }
    if (!isLoaded) return
    setLoading(true)
    try {
      const result = await signUp.create({ emailAddress: data.email, password: data.password, firstName: data.firstName, lastName: data.lastName })
      if (result.createdUserId) {
        await supabase.from('profiles').upsert({ id: result.createdUserId, role: data.role, first_name: data.firstName, last_name: data.lastName, age: parseInt(data.age), postcode: data.postcode })
      }
      if (result.status === 'complete' && setActive) {
        await setActive({ session: result.createdSessionId }); router.replace('/(tabs)/feed')
      } else { router.push('/(auth)/verify-email') }
    } catch (e: any) {
      setError(e?.errors?.[0]?.longMessage ?? e?.errors?.[0]?.message ?? 'Something went wrong')
    } finally { setLoading(false) }
  }

  const goBack = () => step === 0 ? router.back() : animateStep(-1, step - 1)
  const valid  = isStepValid(step, data)
  const CTAS   = ['Next', 'Continue', 'Continue', 'Create account']

  // Title slides with the content as one unit
  const renderPanel = (s: number) => (
    <>
      <View style={st.titleBlock}>
        <GradientTitle text={TITLES[s]} />
      </View>
      <ScrollView contentContainerStyle={st.content}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {s === 0 && <RoleStep     data={data} onChange={update} />}
        {s === 1 && <ProfileStep  data={data} onChange={update} />}
        {s === 2 && <LocationStep data={data} onChange={update} />}
        {s === 3 && <AccountStep  data={data} onChange={update} />}
      </ScrollView>
    </>
  )

  return (
    <View style={StyleSheet.absoluteFill}>
      <ImageBackground source={require('../../assets/bg_onboarding.jpg')} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <LinearGradient colors={['rgba(0,0,0,0.44)', 'rgba(155,155,155,0)']} style={StyleSheet.absoluteFill} />

      <View style={[st.root, { paddingTop: Math.max(insets.top + 20, 60) }]}>

        {/* Step dots — each circle fades independently */}
        <StepRow step={displayStep} opacities={dotOpacities} translates={dotTranslates} />

        {/* Slide area — title + form fields move as one unit */}
        <View style={st.slideArea}>
          <Animated.View style={[st.panel, { transform: [{ translateX: currentX }], opacity: currentOpacity }]}>
            {renderPanel(step)}
          </Animated.View>
          {inTrans && pendingStep !== null && (
            <Animated.View style={[st.panel, st.panelAbsolute, { transform: [{ translateX: incomingX }] }]}>
              {renderPanel(pendingStep)}
            </Animated.View>
          )}
        </View>

        {!!error && <Text style={st.error}>{error}</Text>}

        <View style={[st.ctas, { paddingBottom: Math.max(insets.bottom + 8, 32) }]}>
          <TouchableOpacity style={[st.btn, !valid && st.btnDisabled]}
            onPress={goNext} activeOpacity={valid ? 0.85 : 1} disabled={loading || inTrans}>
            {loading
              ? <ActivityIndicator color={valid ? '#000' : '#507664'} />
              : <Text style={[st.btnText, !valid && st.btnTextDisabled]}>{CTAS[step]}</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity onPress={goBack} style={{ alignSelf: 'flex-start' }} disabled={inTrans}>
            <Text style={st.cancel}>{step === 0 ? 'Cancel' : 'Back'}</Text>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  )
}

const st = StyleSheet.create({
  root:            { flex: 1, backgroundColor: 'transparent', paddingHorizontal: H_PAD },
  slideArea:       { flex: 1, overflow: 'hidden' },
  panel:           { flex: 1 },
  panelAbsolute:   { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  titleBlock:      { marginTop: 32, marginBottom: 32 },
  content:         { paddingBottom: 24 },
  error:           { fontSize: 14, color: '#ea4335', textAlign: 'center', marginBottom: 8 },
  ctas:            { gap: 16, paddingTop: 12 },
  btn:             { height: 57, backgroundColor: ACCENT, borderRadius: 100, alignItems: 'center', justifyContent: 'center' },
  btnDisabled:     { backgroundColor: '#354e42' },
  btnText:         { fontSize: 14, fontWeight: '700', color: '#000', letterSpacing: 0.28, textTransform: 'uppercase' },
  btnTextDisabled: { color: '#507664' },
  cancel:          { fontSize: 16, color: ACCENT, fontWeight: '700', letterSpacing: 0.32 },
})


