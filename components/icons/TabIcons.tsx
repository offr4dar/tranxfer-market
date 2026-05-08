import Svg, { Path } from 'react-native-svg'

interface IconProps {
  color: string
  size?: number
}

// size = rendered height in px; width scales proportionally from Figma aspect ratio

// ─── Search — magnifying glass (24×24) ───────────────────────────────────────
export function SearchIcon({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 20L15.8033 15.8033M18 10.5C18 6.35786 14.6421 3 10.5 3C6.35786 3 3 6.35786 3 10.5C3 14.6421 6.35786 18 10.5 18C14.6421 18 18 14.6421 18 10.5Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

// ─── Feed — brand X mark (Figma: 488:746, 19×20) ─────────────────────────────
export function FeedIcon({ color, size = 20 }: IconProps) {
  const w = Math.round(size * 19 / 20)
  return (
    <Svg width={w} height={size} viewBox="0 0 19 20" fill="none">
      <Path
        d="M10.3915 17.817L16.2798 16.5811L12.639 9.1573L19 0L13.1117 1.23596L10.6735 4.7191L10.4828 4.75923L9.16412 2.0626L3.18464 3.31461L6.7093 10.4013L0 20L5.97949 18.748L8.66652 14.8636L8.90703 14.8154L10.3915 17.817Z"
        fill={color}
      />
    </Svg>
  )
}

// ─── Alerts — lightning bolt (24×24) ─────────────────────────────────────────
export function BellIcon({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 4H9L6 13H10L8 21L19 10H13.6L16 4Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

// ─── Inbox — chat bubble (24×24) ─────────────────────────────────────────────
export function InboxIcon({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 8H16M8 12H13M7 16V21L12 16H20V4H4V16H7Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

// ─── Profile — person (24×24) ─────────────────────────────────────────────────
export function ProfileIcon({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 15H8C5.79086 15 4 16.7909 4 19V21H20V19C20 16.7909 18.2091 15 16 15Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

// ─── XLogoMark — kept for use outside the tab bar (e.g. headers) ─────────────
export function XLogoMark({
  color = '#00FF87',
  size = 57,
}: {
  color?: string
  size?: number
}) {
  const h = Math.round(size * 37 / 57)
  return (
    <Svg width={size} height={h} viewBox="0 0 57 37" fill="none">
      <Path
        d="M9.94029 17.484L15.5728 16.2712L12.0902 8.98617L18.1749 0L12.5424 1.21286L10.21 4.63091L10.0275 4.67029L8.76617 2.02405L3.04635 3.25266L6.41795 10.2069L0 19.6262L5.71983 18.3976L8.29018 14.5858L8.52024 14.5385L9.94029 17.484Z"
        fill={color}
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.06305 31.4083L57 19.6262L55.937 25.218L0 37L1.06305 31.4083Z"
        fill={color}
      />
    </Svg>
  )
}

// ─── SkillFeed — play button (24×24) ─────────────────────────────────────────
export function SkillFeedIcon({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 4L20 12L6 20V4Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

// ─── Tracker — pencil + lines (192×192) ────────────────────────────────────
export function WatchlistIcon({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 192 192" fill="none">
      <Path
        d="M55 139.591 61.173 171l26.432-17.816L136 35.594 103.394 22 55 139.591ZM22 42h72m40 0h36M22 78h57m41 0h50M22 114h41m41 0h66M22 150h34m34 0h32"
        stroke={color}
        strokeWidth={12}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

// ─── MessagesIcon alias (keeps BadgeIcon usage in _layout working) ────────────
export function MessagesIcon({ color, size = 25 }: IconProps) {
  return <InboxIcon color={color} size={size} />
}

// ─── Filter icon — three decreasing horizontal lines ─────────────────────────
export function FilterIcon({ color, size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6H20M7 12H17M10 18H14"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  )
}
