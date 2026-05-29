---
name: BrushBids homepage Webflow source
description: What brushbids.webflow.io actually is, and the user's chosen approach for matching it.
---

# BrushBids homepage ↔ Webflow reference

`brushbids.webflow.io` is the stock **"Cyrclo" marketing-agency Webflow template** with only the brand name swapped to "BrushBids". All its copy (Strategies That Scale, $1,500/mo plans, SPARK/VIBE/ECHO/LUMOS case studies, "Let's Drive Growth", Blog/Services links, "Created by Flowaze") is generic placeholder — it is NOT real BrushBids content.

**User's chosen approach (confirmed):** match the template's *design, layout & animations* exactly, but keep real BrushBids art-auction content. Do NOT import the agency placeholder copy.

**Why:** The site looks like a finished product but is a template; literally copying it would put marketing-agency text on an art-auction site. The user wants the *visual structure* (Cyrclo) wearing BrushBids content.

**How to apply:** `client/src/pages/Home.tsx` maps each Cyrclo section to a BrushBids equivalent — hero photo-ring → artwork ring; "Growth In Action" case studies → "Featured Auctions" sticky-stacking cards; "What Our Clients Say" floating avatar bubbles → testimonials; intro rotating circular badge; cream/dark section alternation. Reference frames can be re-extracted from the recording `.mov` in `attached_assets/` via ffmpeg if needed.

**Exact Cyrclo CSS tokens** (from the official Webflow export the user pasted as attachments — search `attached_assets/Pasted--font-face*` for the full sheet): hero `.title` is `font-size:4.5rem; font-weight:500; letter-spacing:.1rem; top:-.5rem` (NOT a giant 7rem bold title) with a `.registered-symbol` ® at `2rem` above it; `.circle-component` is `height:100vh; position:sticky; top:0` inside a `.section-home-header` that is `height:200vh` (scroll-driven ring scale/rotate). Outer ring = 18 `.circle-item` (`4.5rem×18rem`, `rotate` 20° apart); inner = 12 items 30° apart; `.circle-wrapper` has `mix-blend-mode:difference; transform:scale(1.4)`. Marquee `.scroll-title` = `font-size:12rem; letter-spacing:-.5rem; line-height:1.3; margin-right:5rem` in a `mix-blend-mode:difference` wrapper. `.intro-text` = `3.5rem; text-align:center`. Font is Google Sans Flex (not available locally — we keep Inter).

## Gotcha: fixed navbar paints below the hero (stacking context)
On the ported homepage, the fixed `.navbar` had no `z-index`, so it formed its own stacking context that painted *below* `.main-wrapper` (which follows it in the DOM). The hero's `.header-content-wrap` (z-index 5) then intercepted clicks on the top-center menu button — the overlay would never open. Fix: give `.cyrclo-page .navbar { z-index: 1000 }` so the fixed bar paints above main content.
**Why:** `position:fixed` always creates a stacking context regardless of z-index; an inner `z-index:20` cannot escape it to rise above a later sibling.
**How to apply:** any fixed/sticky overlay/nav that sits earlier in the DOM than the main scroll content needs an explicit high z-index, or it gets covered.

## Webflow IX2 animations were JS-driven (no CSS keyframes)
The Cyrclo export has NO `@keyframes` — all motion was Webflow Interactions (IX2 JSON + webflow.js). Reproduced manually: appended keyframes to `cyrclo.css` (marquees, ring/badge spins, accordion, nav open/close) + framer-motion `useScroll` for the hero ring scale/fade only. `@font-face` blocks were stripped (fonts 404'd); Inter is the fallback.

## Fidelity gotchas (Cyrclo reproduction)
- The template's fonts are Google's "Google Sans Flex" (display/body) and "Google Sans Code" (mono labels). The Webflow export's @font-face pointed at local font files that were NOT included, so the page silently fell back to Arial and "looked wrong." Both families ARE on the public Google Fonts CDN — load them via a <link> in client/index.html (family=Google+Sans+Flex:wght@1..1000 and Google+Sans+Code). cyrclo.css :root already references them by name.
- Section color alternation is real and correct: hero/intro/case-studies/cta are black; the services section (.section-home-service) is light #f2f2f2 (var --background-color--secondary-background) with dark text; service cards are white; many panels use --primary-color--dark #1f1f1f. These resolve fine from cyrclo.css :root — verified .section-home-service computes to rgb(242,242,242).
- Hero has TWO concentric rings (.circle-wrapper outer 18rem radius + .inner-circle-wrapper inner 12rem); both share identical CSS (mix-blend-mode:difference, scale 1.4). There is NO opacity difference in the source — the outer just reads as "less visible" because it's larger/spread to screen edges. Don't add artificial fades.
- Ring "image unavailable" placeholders were NOT a layout bug: 5 of the seed artworks' Unsplash photo IDs had 404'd (removed upstream). Verify seed image URLs with a HEAD request and replace dead ones; don't chase CSS. Hero ring imgs should be loading="eager" (above the fold).

## Webflow-export missing image assets + scroll interactions
- The Webflow CSS export references local images via relative url('../images/...') that are NOT included in pasted exports. For this template: notch.svg (the white rounded-bottom TAB that forms the top menu bar / .nav-block background) and circle-shape.svg (the orb that expands into the light section). Recreate them under client/src/images/ (relative to cyrclo.css) — Vite resolves+bundles relative CSS url(). Missing notch.svg = the top menu bar looks broken/empty.
- notch.svg is WHITE (flat top flush to viewport, rounded bottom corners) with DARK hamburger lines (.menu-line uses --background-color--primary-background = #000). Confirm appearance from the recording, not by guessing — a dark notch makes the black hamburger invisible.
- The hero rings + "Reimagined" title are scroll-VELOCITY reactive (Webflow interaction). Reproduce with framer-motion: useVelocity(scrollY) -> useSpring -> drive rotation via useAnimationFrame (rings spin opposite directions, speed = base + |velocity|) and a ParallaxText-style marquee for the scroll-title (baseX + velocityFactor, wrap with 4 copies). The middle/inner ring also spreads out slightly on scroll (extra scale ~1.0->1.18 on .inner-circle-block via scrollYProgress).
