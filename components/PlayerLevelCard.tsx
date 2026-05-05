import { View, Text, Image, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors } from '@/constants/theme'

interface Props {
  playingLevel: string      // e.g. "Grassroots" → renders as "GRASSROOTS LEVEL"
  performanceLevel: string  // e.g. "medium skill level" → bolded in the description
}

const DESC_PREFIX = 'This player has described themselves as '

export default function PlayerLevelCard({ playingLevel, performanceLevel }: Props) {
  return (
    <View style={styles.card}>
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.45)']}
        start={{ x: 0.9, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <Image
        source={require('../assets/player-level.png')}
        style={styles.image}
        resizeMode="contain"
      />

      <View style={styles.textWrap}>
        <Text style={styles.title}>{playingLevel}{'\n'}Level</Text>
        <Text style={styles.desc}>
          {DESC_PREFIX}
          <Text style={styles.descBold}>{performanceLevel}</Text>
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.brand,
    borderRadius: 10,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  image: {
    width: 110,
    height: 96,
  },
  textWrap: {
    flex: 1,
    gap: 10,
  },
  title: {
    fontFamily: 'Anton_400Regular',
    fontSize: 28,
    color: '#000000',
    textTransform: 'uppercase',
    lineHeight: 38,
  },
  desc: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
  },
  descBold: {
    fontWeight: '700',
  },
})
