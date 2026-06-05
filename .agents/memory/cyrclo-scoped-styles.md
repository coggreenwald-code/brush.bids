---
name: Cyrclo scoped styles reuse
description: How to reuse Cyrclo (homepage) components/markup on non-homepage routes without losing styles
---

All Cyrclo template CSS is scoped under the `.cyrclo-page` ancestor selector and is loaded by `import "./cyrclo.css"` — historically only from the homepage. So any Cyrclo-styled markup rendered outside the homepage will be unstyled unless you account for both of these.

**Rule:** To reuse Cyrclo markup anywhere, the component must (1) render its DOM inside a `<div className="cyrclo-page">` wrapper and (2) `import` `cyrclo.css` itself so the stylesheet is present even on routes that never load the homepage.

**Why:** The stylesheet is a global side-effect import; if the only importer (Home.tsx) isn't mounted, the rules never load. And every rule is prefixed `.cyrclo-page …`, so without that ancestor class the selectors don't match.

**How to apply:** The shared nav (`client/src/components/SiteMenu.tsx` — the notch/hamburger overlay menu used site-wide) follows this pattern. Wrapping just a fixed-position nav in `.cyrclo-page` is safe: the wrapper collapses to zero height (children are fixed/absolute), so its inherited dark background never paints a visible block.
