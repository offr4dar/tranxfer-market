import Svg, { Path } from 'react-native-svg'

interface IconProps {
  color: string
  size?: number
}

// ─── Feed — pulse/activity wave (exact Figma path) ────────────────────────────
export function FeedIcon({ color, size = 27 }: IconProps) {
  return (
    <Svg width={size} height={Math.round(size * 20 / 27)} viewBox="0 0 27 20" fill="none">
      <Path
        d="M13.0781 20C12.9094 20 12.6984 19.9565 12.4875 19.8261C12.15 19.6522 11.8969 19.261 11.8125 18.8698L8.52188 5.30737L5.77969 11.7843C5.61094 12.3059 5.14688 12.6102 4.64062 12.6102H0.84375C0.379687 12.6102 0 12.219 0 11.7408V10.8714C0 10.3933 0.379687 10.0021 0.84375 10.0021H3.79688L7.67813 0.786555C7.88906 0.264923 8.39531 -0.0393617 8.94375 0.00410767C9.49219 0.047577 9.95625 0.438801 10.0828 1.0039L13.4156 14.7402L17.8031 4.6988C18.0141 4.17716 18.5203 3.87288 19.0688 3.91635C19.5328 3.95982 19.9547 4.30757 20.1656 4.78573L22.3594 10.0021H26.1562C26.6203 10.0021 27 10.3933 27 10.8714V11.7408C27 12.219 26.6203 12.6102 26.1562 12.6102H21.5156C21.0094 12.6102 20.5453 12.3059 20.3344 11.8278L18.9422 8.48063L14.2172 19.2176C14.0063 19.6957 13.5844 20 13.0781 20Z"
        fill={color}
      />
    </Svg>
  )
}

// ─── Search — magnifying glass (exact Figma path) ─────────────────────────────
export function SearchIcon({ color, size = 23 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 23 23" fill="none">
      <Path
        d="M16.5917 16.5568L21.4 21.3999M19.1778 10.2888C19.1778 15.198 15.1981 19.1777 10.2889 19.1777C5.37971 19.1777 1.40002 15.198 1.40002 10.2888C1.40002 5.37959 5.37971 1.3999 10.2889 1.3999C15.1981 1.3999 19.1778 5.37959 19.1778 10.2888Z"
        stroke={color}
        strokeWidth={2.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

// ─── Notifications — bell (exact Figma path) ──────────────────────────────────
export function BellIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={Math.round(size * 18 / 22)} height={size} viewBox="0 0 18 22" fill="none">
      <Path
        d="M9.00301 3.77778C12.0872 3.77778 14.5875 6.26509 14.5875 9.33333V11.8218C14.5875 12.366 14.7883 12.8913 15.1518 13.2981L16.5765 14.8928C17.5369 15.9676 16.77 17.6667 15.3244 17.6667H2.68162C1.23605 17.6667 0.469059 15.9676 1.42944 14.8928L2.85424 13.2981C3.2177 12.8913 3.41848 12.366 3.41848 11.8218L3.4185 9.33333C3.4185 6.26509 5.91878 3.77778 9.00301 3.77778ZM9.00301 3.77778V1M7.886 21H10.1198"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

// ─── Messages — envelope (exact Figma path) ───────────────────────────────────
export function MessagesIcon({ color, size = 25 }: IconProps) {
  return (
    <Svg width={size} height={Math.round(size * 20 / 25)} viewBox="0 0 25 20" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M25 3.33333V16.6667C25 18.5026 23.4685 20 21.5909 20H3.40909C1.5315 20 0 18.5026 0 16.6667V3.33333C0 1.49239 1.52631 0 3.40909 0H21.5909C23.4737 0 25 1.49239 25 3.33333ZM2.39384 2.83772C2.58177 2.47436 2.96823 2.22222 3.40909 2.22222H21.5909C22.0318 2.22222 22.4182 2.47436 22.6061 2.83772L12.5 9.75478L2.39384 2.83772ZM2.27273 5.4674L11.1967 11.5753C11.9792 12.111 13.0208 12.111 13.8033 11.5753L22.7273 5.4674V16.6667C22.7273 17.2752 22.2133 17.7778 21.5909 17.7778H3.40909C2.78668 17.7778 2.27273 17.2752 2.27273 16.6667V5.4674Z"
        fill={color}
      />
    </Svg>
  )
}

// ─── Official brand mark — profile tab ───────────────────────────────────────
// Header (dark bg):  color="#00FF87"
// Profile nav tab:   color={tintColor}  (black on green nav)
export function XLogoMark({
  color = '#00FF87',
  size  = 40,
}: {
  color?: string
  size?:  number
}) {
  const h = Math.round(size * 37 / 57)
  return (
    <Svg width={size} height={h} viewBox="0 0 57 37" fill="none">
      {/* X mark */}
      <Path
        d="M9.94029 17.484L15.5728 16.2712L12.0902 8.98617L18.1749 0L12.5424 1.21286L10.21 4.63091L10.0275 4.67029L8.76617 2.02405L3.04635 3.25266L6.41795 10.2069L0 19.6262L5.71983 18.3976L8.29018 14.5858L8.52024 14.5385L9.94029 17.484Z"
        fill={color}
      />
      {/* Swoosh */}
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.06305 31.4083L57 19.6262L55.9369 25.218L0 37L1.06305 31.4083Z"
        fill={color}
      />
    </Svg>
  )
}

// Profile tab icon — same brand mark, inherits tab tint colour
export function ProfileIcon({ color, size = 26 }: IconProps) {
  return <XLogoMark color={color} size={size} />
}
