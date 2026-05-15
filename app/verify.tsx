import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  LayoutAnimation, Linking, ActivityIndicator,
  Platform, UIManager, Alert
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import { Colors, Spacing, Radius } from '@/constants/theme'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@clerk/clerk-expo'
import { useDevRole } from '@/lib/devRole'
import { DEMO_SCOUT_FREE_PROFILE, DEMO_SCOUT_PRO_PROFILE, DEMO_SCOUT_UNVERIFIED_PROFILE } from '@/lib/demoData'
import { ScoutProfile } from '@/types'

// Shared Components
import ScreenBackground from '@/components/ScreenBackground'
import GradientTitle from '@/components/GradientTitle'
import Input from '@/components/Input'
import RadioOption from '@/components/RadioOption'
import Button from '@/components/Button'
import DbsInfoSheet from '@/components/DbsInfoSheet'

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

// ─── Icons ──────────────────────────────────────────────────────────────────

const CheckIcon = ({ color = Colors.brand }: { color?: string }) => (
  <View style={[ic.circle, { backgroundColor: color }]}>
    <Text style={{ color: '#000', fontSize: 10, fontWeight: 'bold' }}>✓</Text>
  </View>
)

const StepNumber = ({ num, active, locked }: { num: number, active?: boolean, locked?: boolean }) => (
  <View style={[
    ic.circle,
    active && { backgroundColor: '#3B82F6' },
    locked && { backgroundColor: 'rgba(255,255,255,0.1)' }
  ]}>
    <Text style={[ic.number, locked && { color: 'rgba(255,255,255,0.3)' }]}>{num}</Text>
  </View>
)

const InfoIcon = () => (
  <View style={ic.infoCircle}>
    <Text style={ic.infoText}>i</Text>
  </View>
)

const ic = StyleSheet.create({
  circle: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.brand },
  number: { color: '#fff', fontSize: 12, fontWeight: '700' },
  infoCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center' },
  infoText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 'bold' },
})

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function VerifyScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { userId } = useAuth()
  const { isDemoMode, devRole } = useDevRole()

  const [profile, setProfile] = useState<ScoutProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [dbsInfoVisible, setDbsInfoVisible] = useState(false)

  // Form states
  const [dbsCert, setDbsCert] = useState('')
  const [isOnUpdateService, setIsOnUpdateService] = useState<boolean | null>(null)
  const [safeguardingDone, setSafeguardingDone] = useState(false)
  const [safeguardingRef, setSafeguardingRef] = useState('')
  // Step 2 mock state: 'idle' | 'verifying' | 'submitted'
  const [idCheckState, setIdCheckState] = useState<'idle' | 'verifying' | 'submitted'>('idle')

  useEffect(() => {
    fetchProfile()
  }, [userId, isDemoMode, devRole])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      if (isDemoMode) {
        if (devRole === 'scout_subscribed') {
          setProfile(DEMO_SCOUT_PRO_PROFILE as any)
        } else if (devRole === 'scout_unverified') {
          setProfile(DEMO_SCOUT_UNVERIFIED_PROFILE as any)
        } else {
          setProfile(DEMO_SCOUT_FREE_PROFILE as any)
        }
      } else if (userId) {
        const { data, error } = await supabase
          .from('scout_profiles')
          .select('*')
          .eq('user_id', userId)
          .single()
        if (data) setProfile(data)
      }
    } catch (e) {
      console.error('Error fetching profile:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleDbsSubmit = async () => {
    if (dbsCert.length !== 12) {
      Alert.alert('Invalid Certificate', 'Please enter a valid 12-digit DBS certificate number.')
      return
    }
    if (isOnUpdateService === null) {
      Alert.alert('Update Service', 'Please confirm if you are on the DBS Update Service.')
      return
    }

    setSubmitting(true)
    try {
      if (isDemoMode) {
        setProfile(prev => prev ? { ...prev, dbs_certificate_number: dbsCert, dbs_on_update_service: !!isOnUpdateService } : null)
      } else {
        const { error } = await supabase
          .from('scout_profiles')
          .update({
            dbs_certificate_number: dbsCert,
            dbs_on_update_service: isOnUpdateService,
            dbs_verified: false // Awaiting admin review
          })
          .eq('user_id', userId)
        if (error) throw error
        await fetchProfile()
      }
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Something went wrong saving your DBS details.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSafeguardingSubmit = async () => {
    if (!safeguardingDone) {
      Alert.alert('Safeguarding', 'Please confirm you have completed the course.')
      return
    }

    setSubmitting(true)
    try {
      if (isDemoMode) {
        setProfile(prev => prev ? { ...prev, safeguarding_certified: true, layer1_verified: true } : null)
      } else {
        const now = new Date()
        const expiry = new Date()
        expiry.setFullYear(now.getFullYear() + 2)

        const { error } = await supabase
          .from('scout_profiles')
          .update({
            safeguarding_certified: true,
            safeguarding_certified_at: now.toISOString(),
            safeguarding_expiry: expiry.toISOString()
          })
          .eq('user_id', userId)
        if (error) throw error
        await fetchProfile()
      }
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <View style={[st.root, { justifyContent: 'center' }]}>
        <ActivityIndicator color={Colors.brand} size="large" />
      </View>
    )
  }

  const step2Done = profile?.id_verified || false
  const step3Done = profile?.dbs_verified || false
  const step4Done = profile?.safeguarding_certified || false
  const allDone   = profile?.layer1_verified || (step2Done && step3Done && step4Done)

  let activeStep = 2
  if (!step2Done) activeStep = 2
  else if (!step3Done) activeStep = 3
  else if (!step4Done) activeStep = 4
  else activeStep = 5

  return (
    <ScreenBackground>
      {/* Header */}
      <View style={[st.header, { paddingTop: insets.top + 10 }]}>
        {router.canGoBack() && (
          <TouchableOpacity onPress={() => router.back()} style={st.backBtn} hitSlop={12} activeOpacity={0.7}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                d="M19 12H5M12 19l-7-7 7-7"
                stroke={Colors.text}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        )}
        <Text style={st.headerTitle}>Verification</Text>
        <View style={st.headerSpacer} />
      </View>

      <ScrollView 
        contentContainerStyle={[st.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Large Page Title */}
        <View style={st.titleBlock}>
          <GradientTitle text={'GET\nVERIFIED'} />
          <Text style={st.subtitle}>
            Complete these steps to appear as a{'\n'}
            verified scout on Tranxfer Market.
          </Text>
        </View>

        {/* Steps */}
        <View style={st.stepsContainer}>
          
          <StepItem
            done
            title="Create account"
            desc="Sign up and choose your scout type."
            badge="Done"
          />

          <StepItem
            num={2}
            active={activeStep === 2}
            done={step2Done}
            locked={activeStep < 2}
            title="Verify your identity"
            desc={step2Done ? "Identity verified." : "Scan your ID and take a selfie. Takes ~2 minutes. We cover the cost."}
            badge={step2Done ? "Done" : activeStep === 2 ? "Next" : "Locked"}
            expanded={activeStep === 2}
          >
            {/* Step 2 expand content */}
            <View style={st.expandContent}>
              {idCheckState === 'submitted' ? (
                <View style={[st.infoBox, { borderColor: 'rgba(0,255,135,0.2)' }]}>
                  <Text style={[st.infoBoxTitle, { color: Colors.brand }]}>Submitted ✓</Text>
                  <Text style={st.infoBoxText}>
                    We're checking your documents. This usually takes a few seconds.
                  </Text>
                </View>
              ) : (
                <>
                  <View style={st.infoBox}>
                    <Text style={st.infoBoxTitle}>What happens</Text>
                    <Text style={st.infoBoxText}>
                      You'll be asked to photograph your passport or driving licence, then take a live selfie. Our provider checks they match.
                    </Text>
                  </View>
                  <Text style={st.freeLabel}>FREE — paid by Tranxfer Market</Text>
                </>
              )}
            </View>
          </StepItem>

          <StepItem
            num={3}
            active={activeStep === 3}
            done={step3Done}
            locked={activeStep < 3}
            title="DBS check"
            desc={step3Done ? "DBS certificate verified." : "Enhanced DBS with Children's Barred List. Required for safeguarding."}
            badge={step3Done ? "Done" : activeStep === 3 ? "Next" : "Locked"}
            expanded={activeStep === 3}
            onInfo={() => setDbsInfoVisible(true)}
          >
            <View style={st.expandContent}>
              <Text style={st.fieldLabel}>Which situation are you in?</Text>
              <View style={{ gap: 16 }}>
                <RadioOption 
                  label="I have an Enhanced DBS and I'm on the Update Service"
                  selected={isOnUpdateService === true}
                  onPress={() => setIsOnUpdateService(true)}
                />
                <RadioOption 
                  label="I need to apply for a new Enhanced DBS (or my existing one isn't on the Update Service)"
                  selected={isOnUpdateService === false}
                  onPress={() => setIsOnUpdateService(false)}
                />
              </View>

              {isOnUpdateService !== null && (
                <View style={{ marginTop: 24 }}>
                  {isOnUpdateService === false && (
                    <View style={[st.infoBox, { marginBottom: 20, borderColor: '#F59E0B' }]}>
                      <Text style={[st.infoBoxTitle, { color: '#F59E0B' }]}>What to do</Text>
                      <Text style={st.infoBoxText}>
                        1. Apply for an Enhanced DBS check through our partner or any DBS provider.{'\n'}
                        2. Register for the DBS Update Service immediately — within 30 days of your certificate being issued.{'\n'}
                        3. Once you have your certificate, come back and enter your 12-digit number here.
                      </Text>
                      <TouchableOpacity onPress={() => Linking.openURL('https://www.gov.uk/dbs-update-service')} style={st.applyBtn}>
                        <Text style={st.applyBtnText}>APPLY FOR DBS CHECK →</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <Text style={st.inputLabel}>DBS certificate number</Text>
                  <Input
                    placeholder="Enter 12-digit number"
                    keyboardType="number-pad"
                    maxLength={12}
                    value={dbsCert}
                    onChangeText={setDbsCert}
                  />
                  <Text style={st.inputHint}>Found on your DBS certificate.</Text>

                  {isOnUpdateService === false && dbsCert.length > 0 && (
                     <View style={st.warningBox}>
                        <Text style={st.warningText}>
                          ⚠ You must be registered on the DBS Update Service for us to verify your certificate.
                        </Text>
                     </View>
                  )}
                </View>
              )}
              
              <Text style={st.costLabelSecondary}>
                {isOnUpdateService === true ? '£0 upfront — verified via Update Service' : '£55–£96 — you pay (one-off)'}
              </Text>
            </View>
          </StepItem>

          <StepItem
            num={4}
            active={activeStep === 4}
            done={step4Done}
            locked={activeStep < 4}
            title="FA Safeguarding course"
            desc={step4Done ? "Safeguarding certified." : "Complete The FA's online safeguarding course (~2 hours)."}
            badge={step4Done ? "Done" : activeStep === 4 ? "Next" : "Locked"}
            expanded={activeStep === 4}
          >
            <View style={st.expandContent}>
              <View style={st.infoBox}>
                <Text style={st.infoBoxText}>
                  The FA Safeguarding Children course is free and takes approximately 2 hours online.
                </Text>
                <TouchableOpacity onPress={() => Linking.openURL('https://learn.englandfootball.com')} style={st.applyBtn}>
                   <Text style={st.applyBtnText}>GO TO FA LEARNING →</Text>
                </TouchableOpacity>
              </View>

              <View style={st.divider} />

              <TouchableOpacity 
                style={st.checkboxRow} 
                onPress={() => setSafeguardingDone(!safeguardingDone)}
                activeOpacity={0.8}
              >
                <View style={[st.checkbox, safeguardingDone && st.checkboxActive]}>
                  {safeguardingDone && <Text style={{ color: '#000', fontSize: 10 }}>✓</Text>}
                </View>
                <Text style={st.checkboxText}>I have completed the FA Safeguarding Children course</Text>
              </TouchableOpacity>

              <Text style={st.inputLabel}>Certificate reference (optional)</Text>
              <Input
                placeholder="e.g. FAL-12345"
                value={safeguardingRef}
                onChangeText={setSafeguardingRef}
              />
              <Text style={st.freeLabel}>FREE — via The FA's learning platform</Text>
            </View>
          </StepItem>

        </View>

        {/* Cost Summary */}
        <View style={st.costSummary}>
          <Text style={st.costSummaryTitle}>COST SUMMARY</Text>
          <View style={st.costRow}>
             <Text style={st.costItemLabel}>Identity check</Text>
             <Text style={st.costItemValueFree}>Free (we pay)</Text>
          </View>
          <View style={st.costRow}>
             <Text style={st.costItemLabel}>DBS check (new applicants)</Text>
             <Text style={st.costItemValuePaid}>£55–£96</Text>
          </View>
          <View style={st.costRow}>
             <Text style={st.costItemLabel}>DBS check (existing + Update)</Text>
             <Text style={st.costItemValueFree}>£0</Text>
          </View>
          <View style={st.costRow}>
             <Text style={st.costItemLabel}>FA Safeguarding course</Text>
             <Text style={st.costItemValueFree}>Free</Text>
          </View>
          <View style={st.costDivider} />
          <View style={st.costRow}>
             <Text style={st.costItemLabel}>Ongoing (DBS Update Service)</Text>
             <Text style={st.costItemValuePaid}>£16/year</Text>
          </View>
        </View>

        {/* Primary CTA */}
        <View style={st.ctaContainer}>
          <Button
            label={
              allDone ? 'CONTINUE TO APP' :
              activeStep === 2 && idCheckState === 'verifying' ? 'LAUNCHING…' :
              activeStep === 2 && idCheckState === 'submitted' ? 'CHECKING…' :
              activeStep === 2 ? 'VERIFY MY IDENTITY' :
              activeStep === 3 ? 'SUBMIT DBS DETAILS' :
              'CONFIRM SAFEGUARDING'
            }
            onPress={() => {
            if (allDone) {
                router.replace('/(tabs)/profile' as any)
              } else if (activeStep === 2) {
                if (isDemoMode) {
                  // Mock: spinner → submitted → advance
                  setIdCheckState('verifying')
                  setTimeout(() => {
                    setIdCheckState('submitted')
                    setTimeout(() => {
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
                      setProfile(prev => prev ? { ...prev, id_verified: true } : null)
                      setIdCheckState('idle')
                    }, 2000)
                  }, 1500)
                } else {
                  Alert.alert('Coming Soon', 'Identity verification via ComplyCube will be available once the SDK integration is complete.')
                }
              } else if (activeStep === 3) {
                handleDbsSubmit()
              } else if (activeStep === 4) {
                handleSafeguardingSubmit()
              }
            }}
            style={{ width: '100%' }}
          />
          <Text style={st.stepIndicator}>
            {allDone ? 'All steps complete!' : `Step ${activeStep} of 4 — ${activeStep === 2 ? 'Identity check' : activeStep === 3 ? 'DBS verification' : 'Safeguarding'}`}
          </Text>
        </View>

      </ScrollView>

      <DbsInfoSheet visible={dbsInfoVisible} onClose={() => setDbsInfoVisible(false)} />
    </ScreenBackground>
  )
}

function StepItem({ 
  num, active, done, locked, title, desc, badge, expanded, children, onInfo 
}: { 
  num?: number, active?: boolean, done?: boolean, locked?: boolean, 
  title: string, desc: string, badge: string, 
  expanded?: boolean, children?: React.ReactNode,
  onInfo?: () => void
}) {
  return (
    <View style={[st.stepItem, active && st.stepItemActive, done && st.stepItemDone]}>
      <View style={st.stepHeader}>
        <View style={st.stepIconWrap}>
          {done ? <CheckIcon /> : <StepNumber num={num!} active={active} locked={locked} />}
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[st.stepTitle, locked && { color: 'rgba(255,255,255,0.4)' }]}>{title}</Text>
            {onInfo && (
              <TouchableOpacity onPress={onInfo}>
                <InfoIcon />
              </TouchableOpacity>
            )}
          </View>
          <Text style={[st.stepDesc, locked && { color: 'rgba(255,255,255,0.2)' }]}>{desc}</Text>
        </View>
        <View style={[st.badge, active && st.badgeActive, locked && st.badgeLocked]}>
          <Text style={[st.badgeText, locked && { color: 'rgba(255,255,255,0.3)' }]}>{badge}</Text>
        </View>
      </View>
      {expanded && children}
    </View>
  )
}

const st = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.lg },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    fontFamily: 'Anton_400Regular',
    fontSize: 20,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  headerSpacer: { width: 36 },

  titleBlock: { marginTop: Spacing.xl, marginBottom: Spacing.xl },
  subtitle: { fontSize: 14, color: Colors.textSecondary, letterSpacing: 0.28, marginTop: 8, lineHeight: 22 },
  
  stepsContainer: { gap: 12 },
  stepItem: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  stepItemActive: { borderColor: 'rgba(59, 130, 246, 0.3)', backgroundColor: 'rgba(59, 130, 246, 0.05)' },
  stepItemDone: { borderColor: 'rgba(0, 255, 135, 0.1)' },
  
  stepHeader: { flexDirection: 'row', gap: 12 },
  stepIconWrap: { paddingTop: 2 },
  stepTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, letterSpacing: 0.32 },
  stepDesc: { fontSize: 13, color: Colors.textSecondary, letterSpacing: 0.26, marginTop: 2, lineHeight: 18 },
  
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.08)', height: 24, alignItems: 'center', justifyContent: 'center' },
  badgeActive: { backgroundColor: '#3B82F6' },
  badgeLocked: { backgroundColor: 'rgba(255,255,255,0.05)' },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },

  expandContent: { marginTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 16 },
  infoBox: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: Radius.md, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  infoBoxTitle: { fontSize: 12, fontWeight: '700', color: Colors.text, textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.5 },
  infoBoxText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  freeLabel: { fontSize: 12, color: Colors.brand, fontWeight: '700', marginTop: 12, letterSpacing: 0.5 },
  
  fieldLabel: { fontSize: 14, color: Colors.text, fontWeight: '600', marginBottom: 16 },
  
  applyBtn: { backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 6, marginTop: 12, alignSelf: 'flex-start' },
  applyBtnText: { color: Colors.text, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  
  inputLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputHint: { fontSize: 12, color: Colors.textMuted, marginTop: 6 },
  warningBox: { marginTop: 12, padding: 10, backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: 6, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)' },
  warningText: { color: '#F59E0B', fontSize: 12, lineHeight: 16 },
  costLabelSecondary: { fontSize: 12, color: Colors.brand, fontWeight: '700', marginTop: 16, textAlign: 'right' },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 16 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { borderColor: Colors.brand, backgroundColor: Colors.brand },
  checkboxText: { flex: 1, fontSize: 14, color: Colors.textSecondary },

  costSummary: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: Radius.lg, padding: Spacing.md, marginTop: Spacing.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  costSummaryTitle: { fontSize: 12, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1, marginBottom: 12 },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  costItemLabel: { fontSize: 13, color: Colors.textSecondary },
  costItemValueFree: { fontSize: 13, color: Colors.brand, fontWeight: '700' },
  costItemValuePaid: { fontSize: 13, color: '#F59E0B', fontWeight: '700' },
  costDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 8 },

  ctaContainer: { marginTop: Spacing.xl, alignItems: 'center' },
  stepIndicator: { fontSize: 12, color: Colors.textMuted, marginTop: 12, fontWeight: '600' },
})
