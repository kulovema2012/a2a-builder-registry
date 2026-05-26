"use client";

import React from "react";

type IconName = keyof typeof ICONS;

const ICONS: Record<string, React.ReactNode> = {
  search: <><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  check: <><path d="M5 12l5 5L20 7"/></>,
  x: <><path d="M6 6l12 12M18 6l-12 12"/></>,
  chevronDown: <><path d="M6 9l6 6 6-6"/></>,
  chevronRight: <><path d="M9 6l6 6-6 6"/></>,
  chevronLeft: <><path d="M15 6l-6 6 6 6"/></>,
  chevronUp: <><path d="M6 15l6-6 6 6"/></>,
  arrowRight: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
  arrowUpRight: <><path d="M7 17L17 7M9 7h8v8"/></>,
  filter: <><path d="M4 5h16M7 12h10M10 19h4"/></>,
  grid: <><rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/></>,
  list: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
  table: <><rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 9h16M4 15h16M10 4v16"/></>,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></>,
  external: <><path d="M14 5h5v5M19 5l-9 9M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></>,
  bolt: <><path d="M13 3L4 14h7l-1 7 9-11h-7z"/></>,
  shield: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></>,
  key: <><circle cx="8" cy="14" r="4"/><path d="M11 11l9-9M16 6l3 3M14 8l2 2"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 20c1-4 4-6 8-6s7 2 8 6"/></>,
  users: <><circle cx="9" cy="8" r="3.5"/><path d="M2 19c1-3.5 3.5-5 7-5s6 1.5 7 5"/><path d="M16 4a3.5 3.5 0 0 1 0 7M22 19c-.6-2.6-2.3-4.3-5-4.8"/></>,
  building: <><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h2M13 16h2"/></>,
  database: <><ellipse cx="12" cy="5" rx="8" ry="2.5"/><path d="M4 5v6c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V5M4 11v6c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-6"/></>,
  cube: <><path d="M12 3L4 7v10l8 4 8-4V7z"/><path d="M4 7l8 4 8-4M12 11v10"/></>,
  cog: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.7l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.7-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.4 1.6 1.6 0 0 0-1.7.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.7 1.6 1.6 0 0 0-1.4-1H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.4-1 1.6 1.6 0 0 0-.3-1.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.7.3h.1a1.6 1.6 0 0 0 1-1.4V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.4 1.6 1.6 0 0 0 1.7-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.7v.1a1.6 1.6 0 0 0 1.4 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.4 1z"/></>,
  bell: <><path d="M6 10a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10 20a2 2 0 0 0 4 0"/></>,
  bookmark: <><path d="M6 4h12v17l-6-4-6 4z"/></>,
  star: <><path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6.2L12 16.9 6.7 19.8l1.1-6.2L3.4 9.4l6-.8z"/></>,
  globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>,
  eyeOff: <><path d="M3 3l18 18M10.6 6.2A10.5 10.5 0 0 1 12 6c6.5 0 10 7 10 7a14 14 0 0 1-3.3 4M6.6 6.6A14 14 0 0 0 2 12s3.5 7 10 7c1.4 0 2.7-.3 3.9-.8"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></>,
  send: <><path d="M5 12l16-8-6 18-4-7z"/></>,
  play: <><path d="M7 4l13 8-13 8z"/></>,
  pause: <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>,
  refresh: <><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/></>,
  download: <><path d="M12 4v12M6 11l6 5 6-5M4 20h16"/></>,
  upload: <><path d="M12 20V8M6 13l6-5 6 5M4 4h16"/></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.3 1.3"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.3-1.3"/></>,
  code: <><path d="M9 7l-5 5 5 5M15 7l5 5-5 5M14 4l-4 16"/></>,
  fileText: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 14h8M8 18h5"/></>,
  fileJson: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M9 12.5C8 12.5 7.5 13 7.5 14v1c0 1-.5 1.5-1.5 1.5C7 16.5 7.5 17 7.5 18v1c0 1 .5 1.5 1.5 1.5M15 12.5c1 0 1.5.5 1.5 1.5v1c0 1 .5 1.5 1.5 1.5-1 0-1.5.5-1.5 1.5v1c0 1-.5 1.5-1.5 1.5"/></>,
  activity: <><path d="M3 12h4l3-9 4 18 3-9h4"/></>,
  zap: <><path d="M13 3L4 14h7l-1 7 9-11h-7z"/></>,
  alert: <><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9L2.5 17a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/></>,
  check2: <><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></>,
  warning: <><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  history: <><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5M12 8v4l3 2"/></>,
  hash: <><path d="M4 9h16M4 15h16M10 4l-2 16M16 4l-2 16"/></>,
  tag: <><path d="M20 12l-7 7a2 2 0 0 1-2.8 0L3 11.8V3h8.8z"/><circle cx="8" cy="8" r="1.5"/></>,
  cpu: <><rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/></>,
  inbox: <><path d="M3 13h5l1 3h6l1-3h5"/><path d="M3 13l3-8h12l3 8v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></>,
  flag: <><path d="M4 21V4M4 5h14l-3 4 3 4H4"/></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
  more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
  trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/></>,
  edit: <><path d="M14 4l6 6L8 22H2v-6z"/></>,
  sliders: <><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></>,
  package: <><path d="M3 7l9-4 9 4M3 7v10l9 4M3 7l9 4m0 0v10m0-10l9-4M21 7v10l-9 4"/></>,
  beaker: <><path d="M9 3h6M10 3v6L4 19a2 2 0 0 0 1.8 3h12.4A2 2 0 0 0 20 19L14 9V3"/><path d="M7 14h10"/></>,
  terminal: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M13 15h4"/></>,
  layers: <><path d="M12 2l10 5-10 5L2 7z"/><path d="M2 12l10 5 10-5M2 17l10 5 10-5"/></>,
  pier: <><path d="M3 17h18M6 21V11M18 21V11M3 11h18M9 11V7M15 11V7M9 7h6M12 7V3"/></>,
  pierMark: <><path d="M4 16h16M7 19V9M17 19V9M7 9h10"/></>,
  signal: <><path d="M2 17a15 15 0 0 1 20 0M5 13a10 10 0 0 1 14 0M8 9a5 5 0 0 1 8 0"/><circle cx="12" cy="20" r="1.5"/></>,
  agent: <><circle cx="12" cy="9" r="5"/><path d="M3 21a9 9 0 0 1 18 0"/><circle cx="9" cy="8" r="1" fill="currentColor"/><circle cx="15" cy="8" r="1" fill="currentColor"/></>,
};

interface IconProps {
  name: string;
  size?: number;
  stroke?: number;
  style?: React.CSSProperties;
  className?: string;
}

export function Icon({ name, size = 16, stroke = 1.5, style, className }: IconProps) {
  const path = ICONS[name];
  if (!path) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className={className}
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}

export { ICONS };
export type { IconName };
