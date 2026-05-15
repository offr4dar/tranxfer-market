import { useState, useEffect } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'
import Svg, { Path } from 'react-native-svg'
import { useDevRole } from '@/lib/devRole'
import { supabase } from '@/lib/supabase'
import PerformanceLogSheet from '@/components/PerformanceLogSheet'

export default function PersistentFAB() {
  const insets     = useSafeAreaInsets()
  const router     = useRouter()
  const { userId } = useAuth()
  const { devRole, isDemoMode } = useDevRole()

  const [isScout,      setIsScout]      = useState(false)
  const [logSheetOpen, setLogSheetOpen] = useState(false)

  useEffect(() => {
    if (!userId) return
    ;(async () => {
      const { data } = await supabase
        .from('scout_profiles')
        .select('subscription_tier')
        .eq('user_id', userId)
        .maybeSingle()
      if (data) setIsScout(true)
    })()
  }, [userId])

  // In demo mode the Exit Demo button is rendered at root layout — nothing to show here
  if (isDemoMode) return null

  const resolvedIsScout = isScout || devRole !== 'player'

  return (
    <>
      <View style={[styles.wrapper, { bottom: 100 + insets.bottom }]} pointerEvents="box-none">

        {/* Player: log activity */}
        {!resolvedIsScout && (
          <TouchableOpacity
            style={styles.btn}
            onPress={() => setLogSheetOpen(true)}
            activeOpacity={0.85}
          >
            <Svg width={23} height={23} viewBox="0 0 23 23" fill="none">
              <Path
                d="M1.25 11.25H21.25M11.25 1.25V21.25"
                stroke="black"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        )}

        {/* Scout: shortlist */}
        {resolvedIsScout && (
          <TouchableOpacity
            style={styles.btn}
            onPress={() => router.push('/(tabs)/shortlist' as any)}
            activeOpacity={0.85}
          >
            <Svg width={20} height={24} viewBox="0 0 20 24" fill="none">
              <Path
                d="M3 1H17C17.5523 1 18 1.44772 18 2V23L10 18.5L2 23V2C2 1.44772 2.44772 1 3 1Z"
                stroke="black"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        )}

      </View>

      <PerformanceLogSheet
        visible={logSheetOpen}
        onClose={() => setLogSheetOpen(false)}
        onSaved={() => setLogSheetOpen(false)}
      />
    </>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 16,
    alignItems: 'center',
    gap: 12,
  },
  btn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
