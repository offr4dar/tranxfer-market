import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, Animated, Dimensions, Easing,
  TouchableOpacity, TextInput, ScrollView, Modal,
  FlatList, ActivityIndicator, Platform, ImageBackground,
} from 'react-native'
import { useRouter, useNavigation, useLocalSearchParams } from 'expo-router'
import { useSignUp, useAuth, useUser, useClerk } from '@clerk/clerk-expo'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import MaskedView from '@react-native-masked-view/masked-view'
import Svg, { Path, Text as SvgText } from 'react-native-svg'
import { SvgXml } from 'react-native-svg'
import { supabase } from '@/lib/supabase'
import { setPendingProfile } from '@/lib/pendingProfile'
import { UK_OUTCODES } from '@/lib/uk-outcodes'
import ConfirmCancelModal from '@/components/ConfirmCancelModal'

const { width: W } = Dimensions.get('window')
const H_PAD = 20
const ACCENT = '#00FF87'

// ─── Bundled SVG icons (inlined for native SVG rendering) ────────────────────
const SVG_PLAYER = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_361_264)"><path d="M41.5456 17.4445C39.8048 16.9307 37.6574 15.9505 35.732 14.1446C39.068 13.93 40.9909 13.7726 41.0171 13.7705C43.2028 13.6398 44.161 14.4574 44.5489 17.1639C44.6319 17.7442 44.7273 18.5608 44.8197 19.5337C44.1469 18.6467 43.1005 17.9047 41.5456 17.4445Z" fill="#00FF87"/><path d="M54.3827 61.8682C53.4482 61.376 52.531 60.8506 51.6326 60.2954C51.6222 60.2889 51.6118 60.2822 51.6014 60.2757L48.8303 62.0195C48.4857 62.2362 47.9732 62.1786 47.6854 61.8909L45.8048 60.0102C45.517 59.7224 45.4594 59.2099 45.6762 58.8654L46.8601 56.984C45.6673 56.0693 44.5039 55.1151 43.3648 54.1334L41.8616 55.0537C41.5145 55.2662 40.9998 55.2052 40.712 54.9174L38.665 52.8704C38.3772 52.5827 38.3162 52.0679 38.5287 51.7208L39.3044 50.4539C38.16 49.3714 37.033 48.2706 35.9208 47.155C30.6029 41.8216 25.6479 36.1487 20.489 30.6655L18.6186 31.8107C18.2715 32.0232 17.7569 31.9623 17.469 31.6744L15.422 29.6274C15.1342 29.3396 15.0732 28.8249 15.2857 28.4778L16.5175 26.466C15.8735 25.7822 15.2129 25.0796 14.5587 24.3828L12.4697 25.6618C12.1226 25.8743 11.6078 25.8133 11.3201 25.5255L9.27304 23.4785C8.98521 23.1906 8.92425 22.6759 9.13674 22.3289L10.5196 20.0703C9.7058 19.1999 9.04019 18.487 8.61731 18.0338C8.33954 17.7362 8.28375 17.2117 8.49504 16.8637C9.65962 14.9454 13.0775 9.00519 15.3384 6.47992C15.677 6.10158 16.0092 5.75047 16.3356 5.42405C16.8703 4.8893 17.3856 4.42949 17.889 4.02074C17.9661 7.56459 19.2702 13.1026 21.2842 17.5948C23.7506 23.0984 25.4927 27.307 24.8741 30.6126C25.4311 31.2412 25.9968 31.8807 26.5707 32.5305L29.9687 36.4167C30.0891 36.5551 30.2099 36.6937 30.3305 36.8324C30.4299 35.3939 30.4018 31.1063 27.3288 25.9819C23.6899 19.9174 18.7329 9.81636 18.9102 3.2523C19.4669 2.86757 20.1612 2.70946 20.6798 2.44927C20.9604 5.07159 22.0978 11.3644 26.6954 19.452C31.4968 27.8945 35.9534 34.7979 34.7086 41.8161C36.3713 43.6776 38.0696 45.5293 39.8246 47.3424C40.1199 45.6889 41.0313 38.0295 34.702 28.7213C27.8115 18.5886 22.8838 9.63161 22.1407 1.83849C23.482 1.38511 24.5762 1.19654 25.6678 1.09583C27.1592 0.958272 30.0305 0.353969 31.1122 1.74471C31.6606 2.44988 31.4362 3.29302 31.2077 4.07041C30.9461 4.95988 30.7538 5.84733 30.7366 6.77907C30.7028 8.60891 31.236 10.4461 32.0937 12.052C34.1351 15.8734 38.6268 18.2712 41.0178 18.9377C42.5845 19.3733 44.2941 20.4917 44.6393 22.1852C44.7576 22.7656 44.7475 23.3579 44.7773 23.9463C44.7873 24.1422 44.8037 24.342 44.822 24.543L41.1773 24.9822C40.6871 25.0348 40.3329 25.4792 40.3875 25.9683C40.4426 26.4589 40.885 26.8132 41.3757 26.7581L45.0597 26.3151C45.2035 27.1158 46.6692 32.1008 46.9973 32.96L43.8633 33.8553C43.3862 33.9702 43.0897 34.4536 43.2052 34.9332C43.3216 35.414 43.8038 35.7083 44.2863 35.5933L47.6684 34.6388C48.3201 36.1985 49.0435 37.7237 49.7682 39.2503C50.0809 39.909 50.3778 40.5784 50.732 41.2161C51.2013 42.0609 51.6703 42.9059 52.142 43.7494C52.7385 44.8164 53.3322 45.885 53.9365 46.9476C54.3394 47.656 54.7553 48.3536 55.1803 49.0489C56.1759 50.6775 57.1928 52.3132 57.9947 54.0487C58.5245 55.1957 59.064 56.5399 58.6945 57.8148C58.5333 58.371 58.1848 59.0652 57.7712 59.4788C57.7414 59.5086 56.3442 60.9025 55.5592 61.6858C55.2711 61.9732 54.7428 62.0579 54.3827 61.8682Z" fill="#00FF87"/></g><defs><clipPath id="clip0_361_264"><rect width="64" height="64" fill="white"/></clipPath></defs></svg>`

const SVG_AGENT = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M49.75 7H14.75C13.0931 7 11.75 8.34315 11.75 10V60C11.75 61.6569 13.0931 63 14.75 63H49.75C51.4069 63 52.75 61.6569 52.75 60V10C52.75 8.34315 51.4069 7 49.75 7Z" fill="#00FF87"/><path d="M32.25 6C33.6307 6 34.75 4.88071 34.75 3.5C34.75 2.11929 33.6307 1 32.25 1C30.8693 1 29.75 2.11929 29.75 3.5C29.75 4.88071 30.8693 6 32.25 6Z" fill="#00FF87"/><path d="M48.75 11H15.75V59H48.75V11Z" fill="#262E24"/><path d="M25.749 4.5H38.751C40.683 4.50019 42.25 6.07117 42.25 8V11.5H22.25V8C22.25 6.06703 23.8165 4.50019 25.749 4.5Z" fill="#287B49" stroke="#00FF87"/><path d="M24.5 52C26.1569 52 27.5 50.6569 27.5 49C27.5 47.3431 26.1569 46 24.5 46C22.8431 46 21.5 47.3431 21.5 49C21.5 50.6569 22.8431 52 24.5 52Z" stroke="#00FF87" stroke-width="2" stroke-linecap="round"/><path d="M26.5 32L32.0445 37.5445M26.5 37.5445L32.0445 32" stroke="#00FF87" stroke-width="2" stroke-linecap="round"/><path d="M38.1643 21.5278C37.9034 21.437 37.6185 21.5749 37.5278 21.8357L36.0494 26.086C35.9587 26.3468 36.0966 26.6318 36.3574 26.7225C36.6182 26.8132 36.9032 26.6753 36.9939 26.4145L38.308 22.6365L42.086 23.9506C42.3468 24.0413 42.6318 23.9034 42.7225 23.6426C42.8132 23.3818 42.6753 23.0968 42.4145 23.0061L38.1643 21.5278ZM30.5 48.5L30.6923 48.9615C31.0112 48.8286 31.3231 48.6928 31.6279 48.554L31.4208 48.099L31.2136 47.6439C30.9189 47.7781 30.6169 47.9096 30.3077 48.0385L30.5 48.5ZM33.2133 47.2034L33.4538 47.6418C34.0716 47.3029 34.6546 46.9491 35.2033 46.5805L34.9244 46.1654L34.6455 45.7504C34.1233 46.1013 33.566 46.4396 32.9729 46.765L33.2133 47.2034ZM36.5242 44.9639L36.8463 45.3464C37.3878 44.8903 37.8852 44.4149 38.3389 43.9204L37.9705 43.5824L37.6021 43.2444C37.1788 43.7058 36.7125 44.1516 36.2021 44.5815L36.5242 44.9639ZM39.2123 42.0158L39.6262 42.2963C40.02 41.7151 40.362 41.1123 40.6532 40.4883L40.2001 40.2769L39.747 40.0654C39.4784 40.6409 39.1627 41.1976 38.7983 41.7354L39.2123 42.0158ZM40.8984 38.4031L41.3792 38.5402C41.567 37.8815 41.7056 37.2039 41.7965 36.5081L41.3007 36.4433L40.8049 36.3785C40.7201 37.0274 40.5912 37.6566 40.4175 38.266L40.8984 38.4031ZM41.4279 34.446L41.9279 34.4464C41.9283 33.777 41.8899 33.093 41.814 32.3948L41.3169 32.4489L40.8199 32.503C40.8921 33.1674 40.9283 33.815 40.9279 34.4457L41.4279 34.446ZM41.008 30.4714L41.4981 30.3727C41.3673 29.723 41.2072 29.0619 41.0186 28.3896L40.5372 28.5246L40.0557 28.6597C40.238 29.3096 40.3922 29.9464 40.5178 30.5701L41.008 30.4714ZM39.9353 26.6155L40.4074 26.4509C40.1904 25.8285 39.9511 25.1971 39.6899 24.5568L39.2269 24.7456L38.764 24.9345C39.019 25.5598 39.2522 26.175 39.4631 26.7801L39.9353 26.6155ZM38.4287 22.9081L38.8829 22.6991C38.7432 22.3954 38.5989 22.0898 38.4501 21.7822L38 22L37.5499 22.2178C37.696 22.5196 37.8375 22.8194 37.9744 23.1171L38.4287 22.9081Z" fill="#00FF87"/></svg>`

type Role = 'player' | 'agent'
type AgentType = 'independent_agent' | 'club_scout' | 'scouting_network'
type GenderType = 'male' | 'female'
type FootType  = 'left' | 'right' | 'both'
interface WizardData {
  role: Role | null
  agentType: AgentType | null
  gender: GenderType | null
  foot: FootType | null
  positions: string[]
  firstName: string; lastName: string; age: string
  outwardCode: string; postcode: string
  email: string; password: string
  termsAccepted: boolean
}
const INIT: WizardData = { role: null, agentType: null, gender: null, foot: null, positions: [], firstName: '', lastName: '', age: '', outwardCode: '', postcode: '', email: '', password: '', termsAccepted: false }
const AGES = Array.from({ length: 60 }, (_, i) => String(i + 16))

// ─── Nationalities ────────────────────────────────────────────────────────────
const NATIONALITIES = [
  'Albanian', 'Algerian', 'American', 'Angolan', 'Argentine', 'Armenian',
  'Australian', 'Austrian', 'Azerbaijani', 'Belarusian', 'Belgian', 'Beninese',
  'Bolivian', 'Bosnian', 'Brazilian', 'Bulgarian', 'Burundian', 'Cameroonian',
  'Canadian', 'Chilean', 'Chinese', 'Colombian', 'Congolese', 'Croatian',
  'Czech', 'Danish', 'Dutch', 'Ecuadorian', 'Egyptian', 'English',
  'Estonian', 'Ethiopian', 'Finnish', 'French', 'Gambian', 'Georgian',
  'German', 'Ghanaian', 'Greek', 'Guinean', 'Hungarian', 'Indian',
  'Irish', 'Ivorian', 'Jamaican', 'Japanese', 'Kenyan', 'Kosovan',
  'Latvian', 'Liberian', 'Lithuanian', 'Macedonian', 'Malian', 'Mexican',
  'Moldovan', 'Montenegrin', 'Moroccan', 'Mozambican', 'Nigerian',
  'Northern Irish', 'Norwegian', 'Paraguayan', 'Peruvian', 'Polish',
  'Portuguese', 'Romanian', 'Russian', 'Rwandan', 'Scottish', 'Senegalese',
  'Serbian', 'Sierra Leonean', 'Slovak', 'Slovenian', 'South African',
  'South Korean', 'Spanish', 'Swedish', 'Swiss', 'Tanzanian', 'Togolese',
  'Trinidadian', 'Tunisian', 'Turkish', 'Ugandan', 'Ukrainian', 'Uruguayan',
  'Venezuelan', 'Welsh', 'Zimbabwean',
].sort()

const GENDERS: { key: GenderType; label: string }[] = [
  { key: 'male', label: 'Male' },
  { key: 'female', label: 'Female' },
]

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
type StepStatus = 'active' | 'complete' | 'inactive' | 'disabled'
function StepCircle({ status }: { status: StepStatus }) {
  if (Platform.OS === 'web') return null
  return (
    <View style={[
      sc.circle,
      status === 'active'   && sc.circleActive,
      status === 'complete' && sc.circleDone,
      status === 'inactive' && sc.circleInactive,
      status === 'disabled' && sc.circleDisabled,
    ]}>
      {status === 'active'   && <View style={sc.dot} />}
      {status === 'complete' && <CheckIcon />}
    </View>
  )
}
function StepRow({ step, opacities, translates, greyDot }: {
  step: number
  opacities: Animated.Value[]
  translates: Animated.Value[]
  greyDot?: number
}) {
  const status = (i: number): StepStatus =>
    i < step ? 'complete' : i === step ? 'active' : 'inactive'
  return (
    <View style={sc.row}>
      {[0, 1, 2, 3, 4].map((i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', flex: i < 4 ? 1 : 0 }}>
          <Animated.View style={[
            { opacity: opacities[i], transform: [{ translateY: translates[i] }] },
          ]}>
            <StepCircle status={i === greyDot ? 'disabled' : status(i)} />
          </Animated.View>
          {i < 4 && <View style={[sc.connector, i < step - 1 && sc.connectorDone]} />}
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
  circleDisabled:  { backgroundColor: '#1f1f1f', borderWidth: 1, borderColor: '#343434' },
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
  { key: 'agent' as Role, label: 'Agent / Scout', svg: SVG_AGENT },
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

// ─── Step 2: About you (age picker, agent sub-type, location) ───────────────
const AGENT_ROLES: { key: AgentType; label: string; sub?: string }[] = [
  { key: 'independent_agent', label: "I'm a FIFA licensed agent" },
  { key: 'club_scout', label: "I'm a club registered scout" },
  { key: 'scouting_network', label: 'Freelance scout', sub: 'Not currently tied to a club' },
]

function RadioOption({
  label, sub, selected, onPress,
}: { label: string; sub?: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Radio circle */}
      <View style={[
        ro.outer,
        selected && ro.outerSelected,
      ]}>
        {selected && <View style={ro.inner} />}
      </View>
      {/* Labels */}
      <View style={{ flex: 1, paddingTop: 7, gap: 4 }}>
        <Text style={fs.label}>{label}</Text>
        {sub && <Text style={fs.hint}>{sub}</Text>}
      </View>
    </TouchableOpacity>
  )
}
const ro = StyleSheet.create({
  outer: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  outerSelected: { borderColor: '#00FF87' },
  inner: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#00FF87',
  },
})

function AboutStep({ data, onChange }: { data: WizardData; onChange: (d: Partial<WizardData>) => void }) {
  const [showAge, setShowAge] = useState(false)
  const [chips, setChips] = useState<string[]>([])

  const search = useCallback((q: string) => {
    if (q.length < 1) { setChips([]); return }
    setChips([...new Set(UK_OUTCODES.filter(c => c.startsWith(q.toUpperCase())))])
  }, [])

  const proximityText = data.role === 'agent'
    ? 'Only the first half is needed. This allows us to determine your proximity to matched players.'
    : 'Only the first half is needed. This allows us to determine your proximity to matched clubs.'

  return (
    <View style={{ gap: 32 }}>
      {/* Agent sub-type — agents only */}
      {data.role === 'agent' && (
        <View style={{ gap: 16 }}>
          <Text style={fs.label}>Which role best describes you?</Text>
          <View style={{ gap: 10 }}>
            {AGENT_ROLES.map(r => (
              <RadioOption
                key={r.key}
                label={r.label}
                sub={r.sub}
                selected={data.agentType === r.key}
                onPress={() => onChange({ agentType: r.key })}
              />
            ))}
          </View>
        </View>
      )}

      {/* Age — players only */}
      {data.role === 'player' && (
        <View style={{ gap: 16 }}>
          <Text style={fs.label}>What's your age?</Text>
          <TouchableOpacity style={fs.select} onPress={() => setShowAge(true)} activeOpacity={0.85}>
            <Text style={data.age ? fs.val : fs.ph}>{data.age || 'Select age'}</Text>
            <ChevronDown />
          </TouchableOpacity>
        </View>
      )}

      {data.role === 'player' && (
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
      )}

      {/* Gender — players only */}
      {data.role === 'player' && (
        <View style={{ gap: 16 }}>
          <View style={{ gap: 2 }}>
            <Text style={fs.label}>What is your gender?</Text>
            <Text style={fs.hint}>Needed so we can identify the right group for you.</Text>
          </View>
          <View style={{ gap: 10 }}>
            {GENDERS.map(g => (
              <RadioOption
                key={g.key}
                label={g.label}
                selected={data.gender === g.key}
                onPress={() => onChange({ gender: g.key })}
              />
            ))}
          </View>
        </View>
      )}

      {/* Location */}
      <View style={{ gap: 16 }}>
        <View style={{ gap: 16 }}>
          <Text style={fs.label}>Where are you based?</Text>
          <Text style={fs.hint}>{proximityText}</Text>
          <TextInput
            style={[fs.input, { marginTop: 4 }]}
            placeholderTextColor="#909090"
            placeholder="e.g. SE1"
            value={data.outwardCode}
            onChangeText={v => { const u = v.toUpperCase(); onChange({ outwardCode: u, postcode: '' }); search(u) }}
            autoCapitalize="characters"
          />
        </View>
        {chips.length > 0 && (
          <View style={{ gap: 16 }}>
            <Text style={[fs.label, { textAlign: 'center' }]}>Select your postcode</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {chips.map(c => (
                <TouchableOpacity key={c} style={[cs.chip, data.postcode === c && cs.chipActive]}
                  onPress={() => onChange({ postcode: c, outwardCode: c })}>
                  <Text style={cs.chipText}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  )
}

// ─── Shirt rack data ──────────────────────────────────────────────────────────
const SHIRT_PATH_D = 'M142.503 2.47149L183.608 16.1731C193.413 19.4415 200 28.5807 200 38.9154V72.3484C200 73.6731 199.194 74.8639 197.964 75.3559L196.545 75.9235V89.6251C196.545 90.9498 195.738 92.1406 194.508 92.6326L165.446 104.258V196.743C165.446 198.532 163.995 199.983 162.206 199.983H37.7937C36.0047 199.983 34.5542 198.532 34.5542 196.743V104.258L5.49153 92.6326C4.26183 92.1411 3.45543 90.9498 3.45543 89.6251V75.9235L2.03611 75.3555C0.80641 74.8639 0 73.6727 0 72.348V38.9154C0 28.5807 6.5869 19.4415 16.3917 16.1731L57.4974 2.47149C62.4171 0.831462 67.541 0 72.7268 0H127.273C132.459 0 137.583 0.831894 142.503 2.47149ZM100 6.47849C99.997 6.47849 99.9944 6.47892 99.9914 6.47892H77.1419L90.2436 27.6434H109.739L122.841 6.47892H100.009C100.006 6.47892 100.003 6.47849 100 6.47849ZM9.93435 78.5146V87.4318L34.5542 97.2797V88.3626L9.93435 78.5146ZM165.446 97.2797L190.066 87.4318V78.5146L165.446 88.3626V97.2797ZM61.8325 8.26316C61.5469 8.34171 61.2688 8.41819 61 8.49133L68 20.4913L62.9147 22.0646L22.811 35.4324C21.3092 35.933 20.3006 37.3324 20.3006 38.9154V62.9902C20.3006 64.7793 18.8502 66.2297 17.0612 66.2297C15.2721 66.2297 13.8217 64.7793 13.8217 62.9902V38.9154C13.8217 34.5391 16.6111 30.6695 20.7624 29.2856L59.4104 16.4033L55.4384 9.98747L18.4403 22.3199C11.2859 24.705 6.47892 31.374 6.47892 38.9154V70.1546L34.5542 81.3848V55.0708C34.5542 53.2818 36.0047 51.8314 37.7937 51.8314C39.5828 51.8314 41.0332 53.2818 41.0332 55.0708V193.504H158.967V55.0717C158.967 53.2827 160.417 51.8322 162.206 51.8322C163.995 51.8322 165.446 53.2827 165.446 55.0717V81.3856L193.521 70.1555V38.9159C193.521 31.3744 188.714 24.705 181.56 22.3203L144.548 9.98315L140.576 16.399L179.238 29.286C183.389 30.6695 186.178 34.5396 186.178 38.9154V62.9902C186.178 64.7793 184.728 66.2297 182.939 66.2297C181.15 66.2297 179.699 64.7793 179.699 62.9902V38.9154C179.699 37.3324 178.691 35.933 177.189 35.4324L137.071 22.0599L132 20.4913L139 7.99133C136.444 7.29679 133.026 6.79552 130.387 6.59857L114.299 32.5877C113.708 33.5414 112.666 34.1219 111.544 34.1219H88.4394C87.3177 34.1219 86.2755 33.5414 85.685 32.5877L69.597 6.59986C67.2359 6.77726 64.2627 7.59488 61.8325 8.26316Z'
const SHIRT_LIST = [
  { id: 'GK'  }, { id: 'RB'  }, { id: 'CB'  }, { id: 'LB'  },
  { id: 'RWB' }, { id: 'LWB' }, { id: 'CDM' }, { id: 'CM'  },
  { id: 'RM'  }, { id: 'LM'  }, { id: 'CAM' }, { id: 'RW'  },
  { id: 'LW'  }, { id: 'CF'  }, { id: 'ST'  }, { id: 'SS'  },
]
const FOOTS: { key: FootType; label: string }[] = [
  { key: 'left',  label: 'Left foot'  },
  { key: 'right', label: 'Right foot' },
  { key: 'both',  label: 'Comfortable playing with both'  },
]

function ShirtSVG({ selected, label }: { selected: boolean; label: string }) {
  return (
    <Svg viewBox="0 0 200 200" width={64} height={64}>
      <Path
        fillRule="evenodd" clipRule="evenodd"
        d={SHIRT_PATH_D}
        fill={selected ? ACCENT : 'rgba(255,255,255,0.10)'}
      />
      <SvgText
        x="100" y="152" textAnchor="middle"
        fontFamily="Anton_400Regular" fontSize={58}
        fill={selected ? '#fff' : 'rgba(255,255,255,0.45)'}
      >
        {label}
      </SvgText>
    </Svg>
  )
}

function ShirtRackSelector({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) {
  const toggle = (id: string) => {
    if (selected.includes(id)) { onChange(selected.filter(s => s !== id)); return }
    if (selected.length < 3) onChange([...selected, id])
  }
  return (
    <View style={{ gap: 10 }}>
      {/* Rail — full width, no edge fades */}
      <View style={{ marginBottom: 16 }}>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: 'rgba(255,255,255,0.11)', zIndex: 10 }} />
        <ScrollView
          horizontal nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 8, gap: 2 }}
        >
          {SHIRT_LIST.map(shirt => {
            const isSel = selected.includes(shirt.id)
            const isDis = !isSel && selected.length >= 3
            return (
              <TouchableOpacity
                key={shirt.id}
                onPress={() => toggle(shirt.id)}
                disabled={isDis}
                activeOpacity={0.75}
                style={{ opacity: isDis ? 0.2 : 1, alignItems: 'center', width: 72, paddingBottom: 4 }}
              >
                <View style={{ width: 11, height: 6, borderWidth: 1.5, borderBottomWidth: 0, borderColor: 'rgba(255,255,255,0.18)', borderTopLeftRadius: 7, borderTopRightRadius: 7 }} />
                <View style={{ width: 1.5, height: 14, backgroundColor: 'rgba(255,255,255,0.12)' }} />
                <ShirtSVG selected={isSel} label={shirt.id} />
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* Selected pills — postcode chip style */}
      {selected.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: H_PAD }}>
          {selected.map(id => (
            <TouchableOpacity key={id} onPress={() => toggle(id)} style={[cs.chip, cs.chipActive]}>
              <Text style={cs.chipText}>{id} ✕</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {selected.length === 3 && (
        <Text style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.28)', letterSpacing: 0.3, paddingHorizontal: H_PAD }}>
          Maximum reached — tap a chip to remove
        </Text>
      )}
    </View>
  )
}

// ─── Step 2 "Your Game": shirt rack + preferred foot ─────────────────────────
function YourGameStep({ data, onChange }: { data: WizardData; onChange: (d: Partial<WizardData>) => void }) {
  return (
    <View style={{ gap: 32 }}>
      {/* Position shirt rack */}
      <View style={{ gap: 6, marginHorizontal: -H_PAD }}>
        <Text style={[fs.label, { paddingHorizontal: H_PAD }]}>Positions played</Text>
        <Text style={[fs.hint, { paddingHorizontal: H_PAD, marginBottom: 30 }]}>Select up to three – swipe to browse</Text>
        <ShirtRackSelector
          selected={data.positions}
          onChange={ids => onChange({ positions: ids })}
        />
      </View>

      {/* Preferred foot */}
      <View style={{ gap: 16 }}>
        <Text style={fs.label}>Preferred foot</Text>
        <View style={{ gap: 10 }}>
          {FOOTS.map(f => (
            <RadioOption
              key={f.key}
              label={f.label}
              selected={data.foot === f.key}
              onPress={() => onChange({ foot: f.key })}
            />
          ))}
        </View>
      </View>
    </View>
  )
}
const yg = StyleSheet.create({
  searchWrap:  { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  searchInput: { height: 40, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 12, fontSize: 15, color: '#fff' },
})

// ─── Step 3: Your details (name) ─────────────────────────────────────────────

/** Returns the full intro label for the details step, tailored to role and agent type */
function detailsIntro(data: WizardData): string {
  if (data.role === 'player') return 'Please enter your first and last name.'
  switch (data.agentType) {
    case 'independent_agent': return 'Please enter the first name and last name as registered on the fa.com'
    case 'club_scout':        return 'Please enter your first name and last name as registered with your current club'
    case 'scouting_network':  return 'Please enter your first name and last name.'
    default:                  return 'Please enter your first and last name.'
  }
}

function DetailsStep({ data, onChange }: { data: WizardData; onChange: (d: Partial<WizardData>) => void }) {
  return (
    <View style={{ gap: 32 }}>
      <Text style={fs.intro}>{detailsIntro(data)}</Text>
      <View style={{ gap: 16 }}>
        <Text style={fs.label}>First name</Text>
        <TextInput style={fs.input} placeholderTextColor="#909090" placeholder="John"
          value={data.firstName} onChangeText={v => onChange({ firstName: v })} autoCapitalize="words" />
      </View>
      <View style={{ gap: 16 }}>
        <Text style={fs.label}>Last name</Text>
        <TextInput style={fs.input} placeholderTextColor="#909090" placeholder="Doe"
          value={data.lastName} onChangeText={v => onChange({ lastName: v })} autoCapitalize="words" />
      </View>
    </View>
  )
}

// ─── Step 4: Account ─────────────────────────────────────────────────────────
function AccountStep({ data, onChange }: { data: WizardData; onChange: (d: Partial<WizardData>) => void }) {
  return (
    <View style={{ gap: 32 }}>
      <View style={{ gap: 16 }}>
        <Text style={fs.label}>Email</Text>
        <TextInput style={fs.input} placeholderTextColor="#909090" placeholder="you@example.com"
          value={data.email} onChangeText={v => onChange({ email: v })} keyboardType="email-address" autoCapitalize="none" />
      </View>
      <View style={{ gap: 16 }}>
        <Text style={fs.label}>Password</Text>
        <TextInput style={fs.input} placeholderTextColor="#909090" placeholder="Min. 8 characters"
          value={data.password} onChangeText={v => onChange({ password: v })} secureTextEntry />
      </View>

      {/* Terms checkbox */}
      <TermsCheckbox
        checked={data.termsAccepted}
        onToggle={() => onChange({ termsAccepted: !data.termsAccepted })}
        isPlayer={data.role === 'player'}
      />
    </View>
  )
}

// ─── Terms checkbox ───────────────────────────────────────────────────────────
function TermsCheckbox({
  checked, onToggle, isPlayer,
}: {
  checked: boolean
  onToggle: () => void
  isPlayer: boolean
}) {
  return (
    <TouchableOpacity
      style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 30 }}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      {/* Custom square checkbox */}
      <View style={[tc.box, checked && tc.boxChecked]}>
        {checked && <CheckIcon />}
      </View>

      {/* Label with underlined link words */}
      <Text style={[fs.label, { flex: 1, lineHeight: 22 }]}>
        {isPlayer
          ? 'I am 16 years old or over and have read and agree to the '
          : 'I have read and agree to the '}
        <Text style={tc.link} onPress={() => { /* TODO: open terms */ }}>terms</Text>
        {', '}
        <Text style={tc.link} onPress={() => { /* TODO: open privacy */ }}>privacy</Text>
        {' and '}
        <Text style={tc.link} onPress={() => { /* TODO: open safeguarding */ }}>safeguarding</Text>
        {' policies'}
      </Text>
    </TouchableOpacity>
  )
}
const tc = StyleSheet.create({
  box: {
    width: 22, height: 22, borderRadius: 5,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 1,
  },
  boxChecked: { backgroundColor: ACCENT, borderWidth: 0 },
  link: { textDecorationLine: 'underline', color: '#ffffff' },
})

// ─── Shared field styles ──────────────────────────────────────────────────────
const fs = StyleSheet.create({
  label: { fontSize: 16, color: '#fff', letterSpacing: 0.32 },
  hint: { fontSize: 14, color: '#c1c1c1', letterSpacing: 0.28 },
  intro: { fontSize: 16, color: '#fff', letterSpacing: 0.32, lineHeight: 22 },
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
  chipActive: { borderWidth: 1, borderColor: '#dedede' },
  chipText: { fontSize: 16, color: '#fff', fontWeight: '700', letterSpacing: 0.32 },
})

// ─── Step 4 (OAuth variant): account exists, just accept terms ──────────────────
function OAuthFinalStep({ data, onChange }: { data: WizardData; onChange: (d: Partial<WizardData>) => void }) {
  return (
    <View style={{ gap: 32 }}>
      <Text style={fs.intro}>
        Your Google account is connected. Accept our policies below to complete your Tranxfer profile.
      </Text>
      <TermsCheckbox
        checked={data.termsAccepted}
        onToggle={() => onChange({ termsAccepted: !data.termsAccepted })}
        isPlayer={data.role === 'player'}
      />
    </View>
  )
}

// ─── Validation ───────────────────────────────────────────────────────────────
function validate(step: number, data: WizardData, isOAuth = false): string {
  const isAgent = data.role === 'agent'
  if (step === 0 && !data.role) return 'Please select your profile type'
  if (step === 1 && data.role === 'player' && !data.age) return 'Please select your age'
  if (step === 1 && data.role === 'agent' && !data.agentType) return 'Please select your role'
  if (step === 1 && !data.postcode) return 'Please select a postcode'
  if (step === 1 && !data.gender && data.role === 'player') return 'Please select your gender'
  // Player-only step 2: Your Game
  if (!isAgent && step === 2 && data.positions.length === 0) return 'Please select at least one position'
  if (!isAgent && step === 2 && !data.foot) return 'Please select your preferred foot'
  // Details step: player=3, agent=2
  const detailsStep = isAgent ? 2 : 3
  if (step === detailsStep && !data.firstName.trim()) return 'Please enter your first name'
  if (step === detailsStep && !data.lastName.trim()) return 'Please enter your last name'
  // Account step: player=4, agent=3
  const accountStep = isAgent ? 3 : 4
  if (!isOAuth && step === accountStep && !data.email.trim()) return 'Please enter your email'
  if (!isOAuth && step === accountStep && data.password.length < 8) return 'Password must be at least 8 characters'
  if (step === accountStep && !data.termsAccepted) return 'Please accept the terms to continue'
  return ''
}
function isStepValid(step: number, data: WizardData, isOAuth = false) { return validate(step, data, isOAuth) === '' }

// ─── Screen titles per step ───────────────────────────────────────────────────
const TITLES_PLAYER = ['SELECT YOUR\nPROFILE', 'ABOUT\nYOU', 'YOUR\nGAME', 'YOUR\nDETAILS', 'CREATE YOUR\nACCOUNT']
const TITLES_AGENT = ['SELECT YOUR\nPROFILE', 'ABOUT\nYOU', 'YOUR\nDETAILS', 'CREATE YOUR\nACCOUNT']

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const router = useRouter()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  const { signUp, setActive, isLoaded } = useSignUp()
  const { userId: authUserId } = useAuth()
  const { user } = useUser()
  const clerk = useClerk()
  const { oauth } = useLocalSearchParams<{ oauth?: string }>()
  const isOAuth = oauth === '1'

  const [step, setStep] = useState(0)
  const [displayStep, setDisplayStep] = useState(0)
  const [data, setData] = useState<WizardData>(INIT)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingStep, setPendingStep] = useState<number | null>(null)
  const [inTrans, setInTrans] = useState(false)
  const [showCancel, setShowCancel] = useState(false)

  // Pre-fill name from Google when arriving via OAuth
  useEffect(() => {
    if (!isOAuth || !user) return
    setData(d => ({
      ...d,
      firstName: d.firstName || user.firstName || '',
      lastName: d.lastName || user.lastName || '',
    }))
  }, [isOAuth, user])

  // Dual-panel parallax
  const currentX = useRef(new Animated.Value(0)).current
  const incomingX = useRef(new Animated.Value(0)).current
  const currentOpacity = useRef(new Animated.Value(1)).current
  // Per-dot opacity and translate — only changing dots animate
  const dotOpacities  = useRef([0,1,2,3,4].map(() => new Animated.Value(1))).current
  const dotTranslates = useRef([0,1,2,3,4].map(() => new Animated.Value(0))).current

  const update = (p: Partial<WizardData>) => { setData(d => ({ ...d, ...p })); setError('') }

  const animateStep = (dir: 1 | -1, next: number) => {
    if (inTrans) return
    // Panels: no parallax — both travel full width simultaneously
    const EXIT_TO = -dir * W
    const ENTER_FROM = dir * W
    const D = 380, ease = Easing.bezier(0.25, 0.46, 0.45, 0.94)

    currentX.setValue(0); incomingX.setValue(ENTER_FROM); currentOpacity.setValue(1)
    setPendingStep(next); setInTrans(true)

    // Dot animation: old active slides down+out, new active slides in from above
    Animated.parallel([
      Animated.timing(dotOpacities[step], { toValue: 0, duration: 150, useNativeDriver: true }),
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
        Animated.timing(dotOpacities[next], { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(dotTranslates[next], { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start()
    })

    // Title + content slide together; outgoing fades out in last 35%
    Animated.parallel([
      Animated.timing(currentX, { toValue: EXIT_TO, duration: D, easing: ease, useNativeDriver: true }),
      Animated.timing(incomingX, { toValue: 0, duration: D, easing: ease, useNativeDriver: true }),
      Animated.timing(currentOpacity, { toValue: 0, duration: D * 0.35, delay: D * 0.65, useNativeDriver: true }),
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
    const err = validate(step, data, isOAuth)
    if (err) { setError(err); return }
    const isAgent  = data.role === 'agent'
    const lastStep = isAgent ? 3 : 4
    // Navigate forward
    if (step < lastStep) {
      const next = step + 1
      animateStep(1, next)
      return
    }

    // ─ OAuth path: account exists, just save profile ──────────────────────────────
    if (isOAuth) {
      if (!authUserId) { setError('Authentication error. Please try again.'); return }
      setLoading(true)
      try {
        const table = data.role === 'player' ? 'player_profiles' : 'agent_profiles'
        const payload: Record<string, unknown> = {
          user_id: authUserId,
          first_name: data.firstName,
          last_name: data.lastName,
          postcode: data.postcode,
          nationality: null,
          gender:      data.gender || null,
          foot:        data.foot   || null,
        }
        if (data.role === 'player') payload.age = parseInt(data.age)
        if (data.role === 'agent') payload.agent_type = data.agentType ?? 'independent_agent'
        await supabase.from(table).upsert(payload)
        router.replace('/(tabs)/feed')
      } catch (e: any) {
        setError(e?.message ?? 'Something went wrong')
      } finally { setLoading(false) }
      return
    }

    // ─ Email/password signup path ───────────────────────────────────────────
    if (!isLoaded) return
    setLoading(true)
    try {
      // Build the profile payload before calling signUp.create so we can stash
      // it for verify-email.tsx — createdUserId is null until status === 'complete'
      const table = data.role === 'player' ? 'player_profiles' : 'agent_profiles'
      const payload: Record<string, unknown> = {
        first_name: data.firstName,
        last_name: data.lastName,
        postcode: data.postcode,
        nationality: null,
        gender:      data.gender || null,
        foot:        data.foot   || null,
      }
      if (data.role === 'player') payload.age = parseInt(data.age)
      if (data.role === 'agent') payload.agent_type = data.agentType ?? 'independent_agent'

      const result = await signUp.create({
        emailAddress: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      })

      if (result.status === 'complete' && setActive) {
        // Rare: verification disabled in Clerk dashboard — save profile immediately
        payload.user_id = result.createdUserId
        await supabase.from(table).upsert(payload)
        await setActive({ session: result.createdSessionId })
        router.replace('/(tabs)/feed')
      } else {
        // Email verification required — stash payload, verify-email.tsx will save it
        setPendingProfile({ table, payload })
        router.push('/(auth)/verify-email')
      }
    } catch (e: any) {
      setError(e?.errors?.[0]?.longMessage ?? e?.errors?.[0]?.message ?? 'Something went wrong')
    } finally { setLoading(false) }
  }

  // Cancel: OAuth users are signed out so they don't loop back to onboarding
  const handleCancelConfirm = useCallback(async () => {
    setShowCancel(false)
    if (isOAuth) { try { await clerk.signOut() } catch { } }
    navigation.setOptions({ animation: 'fade' })
    router.replace('/(auth)/welcome')
  }, [isOAuth, clerk, navigation, router])

  const isAgent = data.role === 'agent'
  const goBack = () => {
    if (step === 0) { router.back(); return }
    const prev = step - 1
    animateStep(-1, prev)
  }
  const valid   = isStepValid(step, data, isOAuth)
  const getCTA  = (s: number) => s === 0 ? 'Next' : s < (isAgent ? 3 : 4) ? 'Continue' : (isOAuth ? 'Continue' : 'Create account')
  const getTitle = (s: number) => {
    if (isAgent) return s === 3 && isOAuth ? 'ALMOST\nTHERE' : (TITLES_AGENT[s] ?? '')
    return s === 4 && isOAuth ? 'ALMOST\nTHERE' : (TITLES_PLAYER[s] ?? '')
  }

  const renderPanel = (s: number, isActive = false) => (
    <ScrollView
      contentContainerStyle={st.panelScroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Title */}
      <View style={st.titleBlock}>
        <GradientTitle text={getTitle(s)} />
      </View>

      {/* Step fields */}
      <View>
        {s === 0 && <RoleStep data={data} onChange={update} />}
        {s === 1 && <AboutStep data={data} onChange={update} />}
        {/* Step 2: YourGame for players, Details for agents */}
        {s === 2 && (isAgent
          ? <DetailsStep data={data} onChange={update} />
          : <YourGameStep data={data} onChange={update} />)}
        {/* Step 3: Details for players, Account for agents */}
        {s === 3 && (isAgent
          ? (isOAuth ? <OAuthFinalStep data={data} onChange={update} /> : <AccountStep data={data} onChange={update} />)
          : <DetailsStep data={data} onChange={update} />)}
        {/* Step 4: Account for players only */}
        {!isAgent && s === 4 && (isOAuth
          ? <OAuthFinalStep data={data} onChange={update} />
          : <AccountStep data={data} onChange={update} />
        )}
      </View>

      {/* Error — sits directly below the last field */}
      {isActive && !!error && <Text style={st.errorText}>{error}</Text>}

      {/* Flex spacer: pushes CTAs to bottom of screen when content is short;
          collapses to minHeight when content overflows so CTAs stay 36px below */}
      <View style={{ flex: 1, minHeight: 36 }} />

      {/* CTAs */}
      <View style={[st.ctas, { paddingBottom: Math.max(insets.bottom + 8, 32) }]}>
        <TouchableOpacity
          style={[st.btn, !valid && st.btnDisabled]}
          onPress={goNext}
          activeOpacity={valid ? 0.85 : 1}
          disabled={loading || inTrans}
        >
          {loading
            ? <ActivityIndicator color={valid ? '#000' : '#507664'} />
            : <Text style={[st.btnText, !valid && st.btnTextDisabled]}>{getCTA(s)}</Text>
          }
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', justifyContent: s === 0 ? 'center' : 'space-between' }}>
          {s !== 0 && (
            <TouchableOpacity onPress={goBack} disabled={inTrans}>
              <Text style={st.cancel}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setShowCancel(true)} disabled={inTrans}>
            <Text style={st.cancel}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )

  return (
    <>
      <View style={StyleSheet.absoluteFill}>
        <ImageBackground source={require('../../assets/bg_onboarding.jpg')} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <LinearGradient colors={['rgba(0,0,0,0.44)', 'rgba(155,155,155,0)']} style={StyleSheet.absoluteFill} />

        <View style={[st.root, { paddingTop: Math.max(insets.top + 20, 60) }]}>

          {/* Step dots */}
          <StepRow
            step={displayStep}
            opacities={dotOpacities}
            translates={dotTranslates}
            greyDot={undefined}
          />

          {/* Slide area — title + form fields move as one unit */}
          <View style={st.slideArea}>
            <Animated.View style={[st.panel, { transform: [{ translateX: currentX }], opacity: currentOpacity }]}>
              {renderPanel(step, true)}
            </Animated.View>
            {inTrans && pendingStep !== null && (
              <Animated.View style={[st.panel, st.panelAbsolute, { transform: [{ translateX: incomingX }] }]}>
                {renderPanel(pendingStep)}
              </Animated.View>
            )}
          </View>

        </View>
      </View>

      <ConfirmCancelModal
        visible={showCancel}
        onConfirm={handleCancelConfirm}
        onDismiss={() => setShowCancel(false)}
      />
    </>
  )
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: H_PAD },
  slideArea: { flex: 1, overflow: 'hidden' },
  panel: { flex: 1 },
  panelAbsolute: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  titleBlock: { marginTop: 32, marginBottom: 32 },
  panelScroll: { flexGrow: 1 },
  errorText: { color: '#EA4335', fontSize: 16, lineHeight: 22, textAlign: 'center', marginTop: 8 },
  ctas: { gap: 16 },
  btn: { height: 57, backgroundColor: ACCENT, borderRadius: 100, alignItems: 'center', justifyContent: 'center' },
  btnDisabled: { backgroundColor: '#354e42' },
  btnText: { fontSize: 14, fontWeight: '700', color: '#000', letterSpacing: 0.28, textTransform: 'uppercase' },
  btnTextDisabled: { color: '#507664' },
  cancel: { fontSize: 16, color: ACCENT, fontWeight: '700', letterSpacing: 0.32 },
})


