import type { SyntheticEvent } from "react";

const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a1530"/>
      <stop offset="50%" stop-color="#2a1a3e"/>
      <stop offset="100%" stop-color="#0f1729"/>
    </linearGradient>
    <radialGradient id="orb1" cx="0.3" cy="0.3" r="0.5">
      <stop offset="0%" stop-color="#A78BFA" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#A78BFA" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="orb2" cx="0.7" cy="0.7" r="0.5">
      <stop offset="0%" stop-color="#F472B6" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#F472B6" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="400" height="500" fill="url(#bg)"/>
  <rect width="400" height="500" fill="url(#orb1)"/>
  <rect width="400" height="500" fill="url(#orb2)"/>
  <g transform="translate(200 230)" fill="none" stroke="#ffffff" stroke-opacity="0.55" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="-44" y="-34" width="88" height="68" rx="6"/>
    <circle cx="-18" cy="-12" r="7" fill="#ffffff" fill-opacity="0.55" stroke="none"/>
    <path d="M-44 22 L-14 -4 L8 16 L26 0 L44 22 Z" fill="#ffffff" fill-opacity="0.18"/>
  </g>
  <text x="200" y="310" font-family="Inter, system-ui, sans-serif" font-size="15" font-weight="500" fill="#ffffff" fill-opacity="0.75" text-anchor="middle" letter-spacing="0.5">Artwork</text>
  <text x="200" y="332" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#ffffff" fill-opacity="0.45" text-anchor="middle">image unavailable</text>
</svg>`;

export const ARTWORK_FALLBACK_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(FALLBACK_SVG)}`;

export function handleArtworkImageError(
  e: SyntheticEvent<HTMLImageElement, Event>,
) {
  const img = e.currentTarget;
  if (img.src === ARTWORK_FALLBACK_IMAGE) return;
  img.src = ARTWORK_FALLBACK_IMAGE;
}
