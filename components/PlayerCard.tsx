import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { supabase } from '@/lib/supabase'
import { PlayerProfile } from '@/types'
import { Colors, Spacing, Radius } from '@/constants/theme'

// ─── Nationality → flag emoji ─────────────────────────────────────────────────
// Keyed by country name (lowercase); falls back gracefully to no flag.
const NATIONALITY_FLAGS: Record<string, string> = {
  england: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  scotland: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  wales: '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  ireland: '🇮🇪',
  'northern ireland': '🇬🇧',
  france: '🇫🇷',
  spain: '🇪🇸',
  germany: '🇩🇪',
  italy: '🇮🇹',
  portugal: '🇵🇹',
  netherlands: '🇳🇱',
  belgium: '🇧🇪',
  brazil: '🇧🇷',
  argentina: '🇦🇷',
  nigeria: '🇳🇬',
  ghana: '🇬🇭',
  senegal: '🇸🇳',
  'ivory coast': '🇨🇮',
  cameroon: '🇨🇲',
  morocco: '🇲🇦',
  algeria: '🇩🇿',
  egypt: '🇪🇬',
  jamaica: '🇯🇲',
  'united states': '🇺🇸',
  canada: '🇨🇦',
  australia: '🇦🇺',
  sweden: '🇸🇪',
  norway: '🇳🇴',
  denmark: '🇩🇰',
  poland: '🇵🇱',
  'czech republic': '🇨🇿',
  turkey: '🇹🇷',
  greece: '🇬🇷',
  croatia: '🇭🇷',
  serbia: '🇷🇸',
  slovenia: '🇸🇮',
  hungary: '🇭🇺',
  romania: '🇷🇴',
  bulgaria: '🇧🇬',
  ukraine: '🇺🇦',
  russia: '🇷🇺',
  japan: '🇯🇵',
  'south korea': '🇰🇷',
  china: '🇨🇳',
  india: '🇮🇳',
  mexico: '🇲🇽',
  colombia: '🇨🇴',
  uruguay: '🇺🇾',
  chile: '🇨🇱',
  peru: '🇵🇪',
  ecuador: '🇪🇨',
}

// ─── Demonym → country name ───────────────────────────────────────────────────
// Converts adjective/demonym form stored in the DB to a proper country name.
const DEMONYM_TO_COUNTRY: Record<string, string> = {
  english: 'England',
  scottish: 'Scotland',
  welsh: 'Wales',
  irish: 'Ireland',
  'northern irish': 'Northern Ireland',
  french: 'France',
  spanish: 'Spain',
  german: 'Germany',
  italian: 'Italy',
  portuguese: 'Portugal',
  dutch: 'Netherlands',
  belgian: 'Belgium',
  brazilian: 'Brazil',
  argentinian: 'Argentina',
  argentine: 'Argentina',
  nigerian: 'Nigeria',
  ghanaian: 'Ghana',
  senegalese: 'Senegal',
  ivorian: 'Ivory Coast',
  cameroonian: 'Cameroon',
  moroccan: 'Morocco',
  algerian: 'Algeria',
  egyptian: 'Egypt',
  jamaican: 'Jamaica',
  american: 'United States',
  canadian: 'Canada',
  australian: 'Australia',
  swedish: 'Sweden',
  norwegian: 'Norway',
  danish: 'Denmark',
  polish: 'Poland',
  czech: 'Czech Republic',
  turkish: 'Turkey',
  greek: 'Greece',
  croatian: 'Croatia',
  serbian: 'Serbia',
  slovenian: 'Slovenia',
  hungarian: 'Hungary',
  romanian: 'Romania',
  bulgarian: 'Bulgaria',
  ukrainian: 'Ukraine',
  russian: 'Russia',
  japanese: 'Japan',
  'south korean': 'South Korea',
  chinese: 'China',
  indian: 'India',
  mexican: 'Mexico',
  colombian: 'Colombia',
  uruguayan: 'Uruguay',
  chilean: 'Chile',
  peruvian: 'Peru',
  ecuadorian: 'Ecuador',
}

/** Normalise a nationality value to a country name (handles both demonym and country-name forms). */
function toCountryName(nationality?: string | null): string {
  if (!nationality) return ''
  return DEMONYM_TO_COUNTRY[nationality.toLowerCase()] ?? nationality
}

function getFlagEmoji(nationality?: string | null): string {
  if (!nationality) return ''
  // Resolve to country name first so the flag lookup always works
  const country = toCountryName(nationality)
  return NATIONALITY_FLAGS[country.toLowerCase()] ?? ''
}

// ─── "Last active X" label ────────────────────────────────────────────────────
function activityLabel(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (days === 0)  return 'Last active today'
  if (days === 1)  return 'Last active yesterday'
  if (days === 2)  return 'Last active 2 days ago'
  if (days === 3)  return 'Last active 3 days ago'
  if (days <= 7)   return 'Last active this week'
  if (days <= 60)  return 'Last active recently'
  return null
}

// ─── Contract status config ───────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  available_now: {
    label: 'Available now',
    bg: Colors.brand,
    text: '#000000',
  },
  available_eot: {
    label: 'Available EOT',
    bg: '#C49B1E',
    text: '#000000',
  },
  under_contract: {
    label: 'Under contract',
    bg: 'rgba(0,0,0,0.69)',
    text: 'rgba(255,255,255,0.3)',
  },
  trial: {
    label: 'On trial',
    bg: 'rgba(110,140,255,0.15)',
    text: '#8AABFF',
  },
}

// ─── Position pill ────────────────────────────────────────────────────────────
function PositionPill({ label }: { label: string }) {
  return (
    <View style={styles.positionPill}>
      <Text style={styles.positionPillText}>{label.toUpperCase()}</Text>
    </View>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  player: PlayerProfile
  onPress?: () => void
  scoutId?: string
  isShortlisted?: boolean
  isSubscribed?: boolean
  isDemoMode?: boolean
  onShortlistToggle?: (playerId: string, shortlisted: boolean) => void
  /** Called when a free scout taps shortlist — used to redirect to upgrade */
  onUpgradePress?: () => void
}

export default function PlayerCard({
  player,
  onPress,
  scoutId,
  isShortlisted = false,
  isSubscribed = true,
  isDemoMode = false,
  onShortlistToggle,
  onUpgradePress,
}: Props) {
  const [shortlisted, setShortlisted] = useState(isShortlisted)
  const [toggling, setToggling] = useState(false)

  const isScout = !!scoutId

  // Identity masking for unsubscribed scouts
  const showIdentity = !isScout || isSubscribed
  const maskedFirst = showIdentity
    ? (player.first_name ?? '').toUpperCase()
    : `${(player.first_name?.[0] ?? '').toUpperCase()}.`
  const maskedLast = showIdentity
    ? (player.last_name ?? '').toUpperCase()
    : '*'.repeat(player.last_name?.length ?? 6)

  const initials = [player.first_name?.[0], player.last_name?.[0]].filter(Boolean).join('').toUpperCase()
  const flag = getFlagEmoji(player.nationality)
  const activity = activityLabel(player.last_activity_at)

  // Build the "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England · U18" style line
  const countryName = toCountryName(player.nationality)
  const nationalityParts = [
    flag ? `${flag} ${countryName}` : countryName,
    player.age ? `U${player.age}` : null,
  ].filter(Boolean)
  const nationalityLine = showIdentity ? nationalityParts.join(' · ') : null

  const positions = [
    player.primary_position,
    ...(player.secondary_positions ?? []),
  ].filter(Boolean).slice(0, 3) as string[]

  const status = player.contract_status ?? 'under_contract'
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.under_contract

  const toggleShortlist = async () => {
    if (toggling) return

    // Free scouts → redirect to upgrade instead of shortlisting
    if (!isSubscribed) {
      onUpgradePress?.()
      return
    }

    if (isDemoMode) {
      setShortlisted(v => !v)
      onShortlistToggle?.(player.id, !shortlisted)
      return
    }

    if (!scoutId) return
    setToggling(true)
    if (shortlisted) {
      await supabase.from('watchlist_items').delete().eq('scout_id', scoutId).eq('player_id', player.id)
      setShortlisted(false)
    } else {
      await supabase.from('watchlist_items').insert({ scout_id: scoutId, player_id: player.id })
      setShortlisted(true)
    }
    onShortlistToggle?.(player.id, !shortlisted)
    setToggling(false)
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>

      {/* ── Top row: Name block + Avatar ── */}
      <View style={styles.topRow}>
        <View style={styles.nameBlock}>
          {/* Name + verified badge inline */}
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
              {maskedFirst} {maskedLast}
            </Text>
            {player.is_verified && showIdentity && (
              <View style={styles.verifiedBadge}>
                <Svg width={10} height={10} viewBox="0 0 12 12" fill="none">
                  <Path
                    d="M2 6l2.5 2.5L10 3.5"
                    stroke="#000"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
            )}
          </View>

          {/* Activity subtitle */}
          {activity && (
            <Text style={styles.activity}>{activity}</Text>
          )}
        </View>

        {/* Avatar */}
        <View style={[styles.avatar, !showIdentity && styles.avatarRedacted]}>
          {player.profile_photo_url && showIdentity ? (
            <Image source={{ uri: player.profile_photo_url }} style={styles.avatarImg} />
          ) : (
            <Text style={[styles.avatarInitials, !showIdentity && styles.avatarInitialsRedacted]}>
              {showIdentity ? initials : '?'}
            </Text>
          )}
        </View>
      </View>

      {/* ── Divider ── */}
      <View style={styles.divider} />

      {/* ── Nationality · Age row ── */}
      <View style={styles.infoRow}>
        {nationalityLine ? (
          <Text style={styles.nationality} numberOfLines={1}>
            {nationalityLine.toUpperCase()}
          </Text>
        ) : (
          <Text style={styles.nationality}>{'● ● ●'}</Text>
        )}
        {player.current_club && showIdentity ? (
          <Text style={styles.club} numberOfLines={1}>
            {player.current_club.toUpperCase()}
          </Text>
        ) : null}
      </View>

      {/* ── Position pills + contract status ── */}
      <View style={styles.bottomRow}>
        <View style={styles.positionList}>
          {positions.map((pos, i) => (
            <PositionPill key={i} label={pos} />
          ))}
        </View>
        <View style={[styles.contractPill, { backgroundColor: statusCfg.bg }]}>
          <Text style={[styles.contractText, { color: statusCfg.text }]}>
            {statusCfg.label.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* ── Track footer ── */}
      {isScout && (
        <View style={styles.footerRow}>
          <TouchableOpacity
            onPress={toggleShortlist}
            disabled={toggling}
            activeOpacity={0.65}
            style={[
              styles.shortlistBtn,
              shortlisted && styles.shortlistBtnActive,
              !isSubscribed && styles.shortlistBtnLocked,
            ]}
          >
            <Text style={[
              styles.shortlistText,
              shortlisted && styles.shortlistTextActive,
              !isSubscribed && styles.shortlistTextLocked,
            ]}>
              {!isSubscribed ? '🔒 Track player' : shortlisted ? '✓ Added to tracker' : '+ Track player'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    overflow: 'hidden',
    padding: 15,
    marginBottom: Spacing.sm,
    gap: 12,
  },

  // ── Top row ───────────────────────────────────────────────────────────────
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  nameBlock: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'nowrap',
  },
  name: {
    fontFamily: 'Anton_400Regular',
    fontSize: 22,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    flexShrink: 1,
  },
  verifiedBadge: {
    width: 19,
    height: 19,
    borderRadius: 9.5,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  activity: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C5C5C5',
    letterSpacing: 0.1,
  },

  // ── Avatar ────────────────────────────────────────────────────────────────
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,255,135,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(0,255,135,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  avatarRedacted: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  avatarImg: {
    width: 50,
    height: 50,
  },
  avatarInitials: {
    fontFamily: 'Anton_400Regular',
    fontSize: 16,
    color: Colors.brand,
    letterSpacing: 0.5,
  },
  avatarInitialsRedacted: {
    color: 'rgba(255,255,255,0.2)',
  },

  // ── Divider ───────────────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: '#404040',
    marginHorizontal: -15, // bleed to card edges
    marginTop: -4,
  },

  // ── Info row (nationality · club) ─────────────────────────────────────────
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nationality: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C5C5C5',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  club: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brand,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 8,
  },

  // ── Bottom row (positions + contract) ─────────────────────────────────────
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  positionList: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  positionPill: {
    backgroundColor: 'rgba(255,255,255,0.11)',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  positionPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.28,
  },
  contractPill: {
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 5,
    height: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contractText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ── Tracker footer ───────────────────────────────────────────────────────
  footerRow: {
    alignItems: 'flex-end',
    marginTop: -4,
  },
  shortlistBtn: {
    paddingHorizontal: 4,
    paddingVertical: 5,
  },
  shortlistBtnActive: {},
  shortlistBtnLocked: {},
  shortlistText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  shortlistTextActive: {
    color: Colors.brand,
  },
  shortlistTextLocked: {
    color: 'rgba(255,255,255,0.25)',
  },
})
