---
name: Cyrclo hero ring transform conflict
description: Why hero carousel rotation/zoom must live in one system, and how scale/opacity/responsiveness are split between wrapper and block.
---

# Cyrclo hero art-wheel: transform ownership

The homepage hero (`client/src/pages/Home.tsx` `HeroRing`, styles in `cyrclo.css`
scoped under `.cyrclo-page`) has a two-ring art carousel. Getting its scroll
behavior right depends on NOT letting two systems fight over `transform`.

## Rule: rotation + zoom must come from ONE system
A CSS keyframe animation on `transform` (e.g. `cy-spin` / `cy-spin-rev`) OVERRIDES
a Framer-Motion inline `style={{ rotate, scale }}` on the same element while the
animation is running. So if a ring block has both a CSS spin animation and a
motion `rotate`, the CSS spin wins and the motion rotation/zoom is silently dead.

**Why:** running CSS animations take precedence over inline style for the animated
property. This previously made the scroll-velocity-driven spin a no-op even though
the code looked correct.

**How to apply:** the hero `.circle-block` / `.inner-circle-block` rotation +
scroll zoom are owned by Framer Motion (a `useAnimationFrame` loop does idle base
spin + velocity boost). Do NOT add CSS `animation` on those two block classes. The
CTA wheel is separate — it uses `.cta-circle-block` and keeps its own CSS spin.

## Rule: split scale (responsive base) vs zoom (scroll) vs opacity
- The ring WRAPPER (`.circle-wrapper` / `.inner-circle-wrapper`) carries the
  responsive base `transform: scale(...)` from CSS media queries (desktop, ≥1440,
  tablet, mobile). Apply ONLY `opacity` to the wrapper via motion — opacity does
  not touch `transform`, so the responsive CSS scale is preserved.
- The ring BLOCK gets the scroll-driven zoom via motion `scale` (composed with
  `rotate`). This zooms the wheel contents without clobbering the responsive base.

**Why:** hardcoding `style={{ scale }}` on the wrapper overrides every responsive
CSS scale, so the wheel renders one fixed size at all breakpoints (too big on
tablet/mobile, wrong vs the reference at desktop). Keeping base-size in CSS and
zoom on the block keeps it responsive.

## Reference target
The wheel is a port of the stock Cyrclo template (brushbids.webflow.io). Match its
behavior: at entry the full two rings are visible with breathing room; on scroll
both rings zoom IN while the hero is pinned; then the outer ring fades out as the
hero scrolls up and the inner ring lingers longest before the next section.
