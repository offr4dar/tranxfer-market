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
    player.age ? `${player.age} YRS` : null,
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
            {player.is_minor && (
              <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
                <Path d="M16.45 10.95L13.05 8.4C12.4278 7.93333 11.5722 7.93333 10.95 8.4L7.55 10.95C7.21863 11.1985 7.15147 11.6686 7.4 12C7.64853 12.3314 8.11863 12.3985 8.45 12.15L11.85 9.6C11.9389 9.53333 12.0611 9.53333 12.15 9.6L15.55 12.15C15.8814 12.3985 16.3515 12.3314 16.6 12C16.8485 11.6686 16.7814 11.1985 16.45 10.95Z" fill="rgba(0,255,135,0.55)" />
                <Path d="M14.45 13.45L12.45 11.95C12.1833 11.75 11.8167 11.75 11.55 11.95L9.55 13.45C9.21863 13.6985 9.15147 14.1686 9.4 14.5C9.64853 14.8314 10.1186 14.8985 10.45 14.65L12 13.4875L13.55 14.65C13.8814 14.8985 14.3515 14.8314 14.6 14.5C14.8485 14.1686 14.7814 13.6985 14.45 13.45Z" fill="rgba(0,255,135,0.55)" />
                <Path fillRule="evenodd" clipRule="evenodd" d="M12 1.25C11.0625 1.25 10.1673 1.55658 8.72339 2.05112L7.99595 2.30014C6.51462 2.8072 5.3714 3.19852 4.55303 3.53099C4.14078 3.69846 3.78637 3.86067 3.50098 4.02641C3.22634 4.1859 2.95082 4.38484 2.76363 4.65154C2.5786 4.91516 2.48293 5.23924 2.42281 5.55122C2.36031 5.87556 2.32262 6.26464 2.2983 6.71136C2.25 7.59836 2.25 8.81351 2.25 10.3896V11.9914C2.25 18.0924 6.85803 21.0175 9.59833 22.2146L9.62543 22.2264C9.96523 22.3749 10.2846 22.5144 10.6516 22.6084C11.0391 22.7076 11.4507 22.75 12 22.75C12.5493 22.75 12.9609 22.7076 13.3484 22.6084C13.7154 22.5144 14.0348 22.3749 14.3745 22.2264L14.4017 22.2146C17.142 21.0175 21.75 18.0924 21.75 11.9914V10.3898C21.75 8.81361 21.75 7.5984 21.7017 6.71136C21.6774 6.26464 21.6397 5.87556 21.5772 5.55122C21.5171 5.23924 21.4214 4.91516 21.2364 4.65154C21.0492 4.38484 20.7737 4.1859 20.499 4.02641C20.2136 3.86067 19.8592 3.69846 19.447 3.53099C18.6286 3.19852 17.4854 2.8072 16.004 2.30013L15.2766 2.05112C13.8327 1.55658 12.9375 1.25 12 1.25ZM9.08062 3.5143C10.6951 2.96164 11.3423 2.75 12 2.75C12.6577 2.75 13.3049 2.96164 14.9194 3.5143L15.4922 3.71037C17.0048 4.22814 18.1079 4.60605 18.8824 4.92069C19.269 5.07774 19.5491 5.20935 19.7457 5.32353C19.8428 5.3799 19.9097 5.42642 19.9543 5.46273C19.9922 5.49349 20.0066 5.51092 20.0087 5.51348C20.0106 5.5166 20.0231 5.53737 20.0406 5.58654C20.0606 5.64265 20.0827 5.72309 20.1043 5.83506C20.148 6.06169 20.1811 6.37301 20.2039 6.79292C20.2497 7.63411 20.25 8.80833 20.25 10.4167V11.9914C20.25 17.1665 16.3801 19.7135 13.8012 20.84C13.4297 21.0023 13.2152 21.0941 12.9764 21.1552C12.7483 21.2136 12.47 21.25 12 21.25C11.53 21.25 11.2517 21.2136 11.0236 21.1552C10.7848 21.0941 10.5703 21.0023 10.1988 20.84C7.6199 19.7135 3.75 17.1665 3.75 11.9914V10.4167C3.75 8.80833 3.75028 7.63411 3.79608 6.79292C3.81894 6.37301 3.85204 6.06169 3.89571 5.83506C3.91729 5.72309 3.93944 5.64265 3.95943 5.58654C3.97693 5.5374 3.98936 5.51663 3.99129 5.51349C3.99336 5.51095 4.0078 5.49351 4.04567 5.46273C4.09034 5.42642 4.15722 5.3799 4.25429 5.32353C4.4509 5.20935 4.731 5.07774 5.11759 4.92069C5.8921 4.60605 6.99521 4.22814 8.5078 3.71037L9.08062 3.5143Z" fill="rgba(0,255,135,0.55)" />
              </Svg>
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
