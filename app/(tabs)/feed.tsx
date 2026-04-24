import { View, Text, StyleSheet, FlatList } from 'react-native'
import { Colors, Spacing, Radius } from '@/constants/theme'

const PLACEHOLDER_PLAYERS = [
  { id: '1', name: 'Marcus Reid', position: 'Left Back', age: 19, club: 'Brixton FC', available: true },
  { id: '2', name: 'Jordan Osei', position: 'Centre Midfielder', age: 21, club: 'Available', available: true },
  { id: '3', name: 'Tyrese Williams', position: 'Striker', age: 18, club: 'Peckham Athletic', available: false },
  { id: '4', name: 'Kwame Asante', position: 'Right Winger', age: 20, club: 'Available', available: true },
  { id: '5', name: 'Darius Emmanuel', position: 'Centre Back', age: 23, club: 'Lewisham FC', available: false },
  { id: '6', name: 'Eli Morgan', position: 'Goalkeeper', age: 17, club: 'Available', available: true },
]

export default function FeedScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.wordmark}>
          Tranxfer<Text style={styles.dot}>.</Text>
        </Text>
        <Text style={styles.headerSub}>Player Feed</Text>
      </View>

      <FlatList
        data={PLACEHOLDER_PLAYERS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>⚽</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.playerName}>{item.name}</Text>
              <Text style={styles.playerMeta}>{item.position} · {item.age} yrs</Text>
              <View style={[styles.badge, !item.available && styles.badgeMuted]}>
                <Text style={[styles.badgeText, !item.available && styles.badgeTextMuted]}>
                  {item.available ? '🟢 Available' : item.club}
                </Text>
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  wordmark: { fontSize: 22, fontWeight: '800', color: Colors.text },
  dot: { color: Colors.brand },
  headerSub: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  list: { padding: Spacing.lg },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,255,135,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 22 },
  cardBody: { flex: 1, gap: 3 },
  playerName: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  playerMeta: { color: Colors.textSecondary, fontSize: 13 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,255,135,0.08)',
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  badgeMuted: { backgroundColor: 'rgba(255,255,255,0.04)' },
  badgeText: { color: Colors.brand, fontSize: 11, fontWeight: '600' },
  badgeTextMuted: { color: Colors.textSecondary },
  chevron: { color: Colors.textMuted, fontSize: 22 },
})
