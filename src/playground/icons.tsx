/** The few icons the playground draws, as 16-pixel strokes in the text's colour. */
import type { Sx } from "@kirana-style/core"

type Props = { sx?: Sx }

const svg = {
  width: 16,
  height: 16,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
}

export const SplitIcon = ({ sx }: Props) => (
  <svg {...svg} sx={sx}>
    <rect x="1.75" y="2.75" width="12.5" height="10.5" rx="1.5" />
    <path d="M8 2.75v10.5" />
  </svg>
)
export const StackIcon = ({ sx }: Props) => (
  <svg {...svg} sx={sx}>
    <rect x="1.75" y="2.75" width="12.5" height="10.5" rx="1.5" />
    <path d="M1.75 8h12.5" />
  </svg>
)
export const CodeIcon = ({ sx }: Props) => (
  <svg {...svg} sx={sx}>
    <path d="M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5" />
  </svg>
)
export const EyeIcon = ({ sx }: Props) => (
  <svg {...svg} sx={sx}>
    <path d="M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8 12.1 12.5 8 12.5 1.5 8 1.5 8Z" />
    <circle cx="8" cy="8" r="2" />
  </svg>
)
export const LinkIcon = ({ sx }: Props) => (
  <svg {...svg} sx={sx}>
    <path d="M6.5 9.5a3 3 0 0 0 4.2 0l2-2a3 3 0 0 0-4.2-4.2l-.6.6M9.5 6.5a3 3 0 0 0-4.2 0l-2 2a3 3 0 0 0 4.2 4.2l.6-.6" />
  </svg>
)
export const PlusIcon = ({ sx }: Props) => (
  <svg {...svg} sx={sx}>
    <path d="M8 3v10M3 8h10" />
  </svg>
)
export const CloseIcon = ({ sx }: Props) => (
  <svg {...svg} sx={sx}>
    <path d="m4.5 4.5 7 7m0-7-7 7" />
  </svg>
)
export const CopyIcon = ({ sx }: Props) => (
  <svg {...svg} sx={sx}>
    <rect x="5.25" y="5.25" width="8" height="8" rx="1.5" />
    <path d="M10.75 5.25v-1.5a1.5 1.5 0 0 0-1.5-1.5h-5a1.5 1.5 0 0 0-1.5 1.5v5a1.5 1.5 0 0 0 1.5 1.5h1.5" />
  </svg>
)
export const SunIcon = ({ sx }: Props) => (
  <svg {...svg} sx={sx}>
    <circle cx="8" cy="8" r="2.75" />
    <path d="M8 1.5v1.25M8 13.25v1.25M1.5 8h1.25M13.25 8h1.25M3.4 3.4l.9.9M11.7 11.7l.9.9M3.4 12.6l.9-.9M11.7 4.3l.9-.9" />
  </svg>
)
export const MoonIcon = ({ sx }: Props) => (
  <svg {...svg} sx={sx}>
    <path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7Z" />
  </svg>
)
export const MonitorIcon = ({ sx }: Props) => (
  <svg {...svg} sx={sx}>
    <rect x="1.75" y="2.75" width="12.5" height="8.5" rx="1.5" />
    <path d="M5.5 14h5M8 11.25V14" />
  </svg>
)
export const ChevronIcon = ({ sx }: Props) => (
  <svg {...svg} sx={sx}>
    <path d="m5 6.5 3 3 3-3" />
  </svg>
)
export const FileIcon = ({ sx }: Props) => (
  <svg {...svg} sx={sx}>
    <path d="M9 1.75H4.75a1.5 1.5 0 0 0-1.5 1.5v9.5a1.5 1.5 0 0 0 1.5 1.5h6.5a1.5 1.5 0 0 0 1.5-1.5V5.5L9 1.75Z" />
    <path d="M9 1.75V5.5h3.75" />
  </svg>
)
export const GearIcon = ({ sx }: Props) => (
  <svg {...svg} sx={sx}>
    <circle cx="8" cy="8" r="2" />
    <path d="M8 1.75v1.5M8 12.75v1.5M14.25 8h-1.5M3.25 8h-1.5M12.4 3.6l-1.05 1.05M4.65 11.35 3.6 12.4M12.4 12.4l-1.05-1.05M4.65 4.65 3.6 3.6" />
  </svg>
)
