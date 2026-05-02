import { useRef, useState, useCallback } from 'react'
import {
  View, FlatList, Dimensions, StyleSheet, Text, TouchableOpacity, ViewToken,
} from 'react-native'
import YoutubeIframe from 'react-native-youtube-iframe'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import PerformanceLogSheet from '@/components/PerformanceLogSheet'

const { width: W, height: H } = Dimensions.get('window')

// ─── Dummy data — replace videoId with real skill clip IDs ───────────────────
const FEED_ITEMS = [
  { id: '1',  videoId: '9bZkp7q19f0', player: 'Jordan Ellis',    position: 'ST',  club: 'Bromley FC' },
  { id: '2',  videoId: 'dQw4w9WgXcQ', player: 'Marcus Osei',     position: 'CAM', club: 'Woking FC' },
  { id: '3',  videoId: 'kJQP7kiw5Fk', player: 'Theo Whitfield',  position: 'LW',  club: 'Unattached' },
  { id: '4',  videoId: 'JGwWNGJdvx8', player: 'Danny Nwachukwu', position: 'CM',  club: 'Dulwich Hamlet' },
  { id: '5',  videoId: 'OPf0YbXqDm0', player: 'Callum Reid',     position: 'RB',  club: 'Sutton United' },
  { id: '6',  videoId: 'RgKAFK5djSk', player: 'Ade Sorinola',    position: 'CB',  club: 'Unattached' },
  { id: '7',  videoId: 'CevxZvSJLk8', player: 'Rio Mensah',      position: 'GK',  club: 'Maidstone Utd' },
  { id: '8',  videoId: 'hT_nvWreIhg', player: 'Tobi Adeyemi',    position: 'ST',  club: 'Eastleigh FC' },
  { id: '9',  videoId: 'YqeW9_5kURI', player: 'Sam Denton',      position: 'CDM', club: 'Havant & W' },
  { id: '10', videoId: 'jNQXAC9IVRw', player: 'Kofi Asante',     position: 'LW',  club: 'Aldershot Town' },
]

// ─── Per-item component ───────────────────────────────────────────────────────

interface ItemProps {
  videoId: string
  player: string
  position: string
  club: string
  isNearby: boolean
}

function SkillItem({ videoId, player, position, club, isNearby }: ItemProps) {
  return (
    <View style={styles.item}>
      {isNearby && (
        <YoutubeIframe
          height={H}
          width={W}
          videoId={videoId}
          play={false}
          webViewProps={{
            allowsInlineMediaPlayback: true,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          }}
          webViewStyle={styles.player}
        />
      )}

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.75)']}
        style={styles.gradient}
        pointerEvents="none"
      >
        <Text style={styles.playerName}>{player}</Text>
        <Text style={styles.meta}>{position}  ·  {club}</Text>
      </LinearGradient>
    </View>
  )
}

// ─── Feed screen ──────────────────────────────────────────────────────────────

export default function SkillFeedScreen() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [sheetOpen, setSheetOpen] = useState(false)
  const insets = useSafeAreaInsets()

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index)
      }
    },
    [],
  )

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 }).current

  return (
    <View style={styles.container}>
      <FlatList
        data={FEED_ITEMS}
        keyExtractor={item => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({ length: H, offset: H * index, index })}
        renderItem={({ item, index }) => (
          <SkillItem
            videoId={item.videoId}
            player={item.player}
            position={item.position}
            club={item.club}
            isNearby={Math.abs(index - activeIndex) <= 1}
          />
        )}
      />

      {/* Log activity button */}
      <TouchableOpacity
        style={[styles.logBtn, { bottom: 100 + insets.bottom }]}
        onPress={() => setSheetOpen(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.logBtnText}>+ Log activity</Text>
      </TouchableOpacity>

      <PerformanceLogSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSaved={() => setSheetOpen(false)}
      />
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  item: {
    width: W,
    height: H,
    backgroundColor: '#000',
  },

  player: {
    backgroundColor: '#000',
  },

  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 160,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 170,
  },

  playerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },

  meta: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
    letterSpacing: 0.2,
  },

  logBtn: {
    position: 'absolute',
    right: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#00FF87',
  },
  logBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0A0F1E',
    letterSpacing: 0.3,
  },
})
