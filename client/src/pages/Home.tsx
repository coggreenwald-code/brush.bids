import "./cyrclo.css";
import { useState, useEffect, useRef, useMemo, useCallback, type SyntheticEvent, type CSSProperties } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence, useScroll, useTransform, useVelocity, useSpring, useMotionValue, useAnimationFrame } from "framer-motion";
import { SiInstagram, SiX, SiLinkedin, SiFacebook } from "react-icons/si";
import { SOCIAL_URLS, CHARITY_PERCENT, ARTIST_PERCENT, PAYOUT_TIMING } from "@shared/siteConfig";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useArtworks } from "@/hooks/use-artworks";
import { useAuth } from "@/hooks/use-auth";
import { handleArtworkImageError } from "@/lib/imageFallback";
import { SEOHead } from "@/components/SEOHead";
import { SiteMenu } from "@/components/SiteMenu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import brushBidsLogo from "@assets/BrushBids_Logo_1772561349423.png";

import artSunset from "@assets/art-sunset-mountains.png";
import artPortrait from "@assets/art-abstract-portrait.png";
import artOcean from "@assets/art-ocean-watercolor.png";
import artGeometric from "@assets/art-geometric-abstract.png";
import artFloral from "@assets/art-floral-still-life.png";
import artCityscape from "@assets/art-urban-cityscape.png";
import artFlow from "@assets/art-abstract-flow.png";
import wheelFiller1 from "@assets/image_1780075713790.png";
import wheelFiller2 from "@assets/image_1780075725368.png";
import wheelFiller3 from "@assets/image_1780075735035.png";
import wheelFiller4 from "@assets/image_1780075750287.png";
import wheelFiller5 from "@assets/image_1780075765035.png";
import wheelFiller6 from "@assets/image_1780075773302.png";
import wheelFiller7 from "@assets/image_1780075792373.png";

const wrapValue = (min: number, max: number, v: number) => {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
};

/* ============================================================
   Data
   ============================================================ */
type RingArt = { title: string; artistName: string; imageUrl: string; id: number };

type ArtworkWithArtist = {
  id: number;
  title: string;
  imageUrl: string | null;
  artist?: { firstName?: string | null; lastName?: string | null } | null;
};

const FALLBACK_ART: RingArt[] = [
  { title: "Ethereal Horizons", artistName: "Maya Rodriguez", imageUrl: artSunset, id: 0 },
  { title: "Urban Fragments", artistName: "Liam Chen", imageUrl: artPortrait, id: 0 },
  { title: "Silent Currents", artistName: "Sofia Patel", imageUrl: artOcean, id: 0 },
  { title: "Chromatic Dreams", artistName: "Kai Williams", imageUrl: artGeometric, id: 0 },
  { title: "Whispered Light", artistName: "Elena Torres", imageUrl: artFloral, id: 0 },
  { title: "Golden Reverie", artistName: "Aiden Brooks", imageUrl: artCityscape, id: 0 },
  { title: "Tidal Memory", artistName: "Nora Kim", imageUrl: artFlow, id: 0 },
];

const OUTER_COUNT = 18;
const INNER_COUNT = 12;

const WHEEL_FILLERS = [
  wheelFiller1,
  wheelFiller2,
  wheelFiller3,
  wheelFiller4,
  wheelFiller5,
  wheelFiller6,
  wheelFiller7,
];

function handleWheelImageError(index: number) {
  return (e: SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    if (img.dataset.wheelFallback) return;
    img.dataset.wheelFallback = "1";
    img.src = WHEEL_FILLERS[index % WHEEL_FILLERS.length];
  };
}

function sizedImage(url: string): string {
  if (!url.includes("images.unsplash.com")) return url;
  const [base] = url.split("?");
  return `${base}?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=70`;
}

const SOCIALS = [
  { Icon: SiInstagram, href: SOCIAL_URLS.instagram, label: "Instagram", small: false },
  { Icon: SiX, href: SOCIAL_URLS.x, label: "X", small: true },
  { Icon: SiLinkedin, href: SOCIAL_URLS.linkedin, label: "LinkedIn", small: false },
  { Icon: SiFacebook, href: SOCIAL_URLS.facebook, label: "Facebook", small: false },
].filter((s) => s.href);

const PROCESS = [
  {
    label: "Artists",
    heading: "Start selling your work",
    cta: { href: "/submit-artwork", label: "Start Selling" },
    steps: [
      { n: "01", title: "Submit Your Art", text: "Upload your artwork with a description and set your starting price." },
      { n: "02", title: "Expert Review", text: "Our curators review your submission for quality, supported by advanced tools trained by art professionals." },
      { n: "03", title: "Get Paid", text: `Get paid ${PAYOUT_TIMING}.` },
      { n: "04", title: "Give Back", text: `${CHARITY_PERCENT}% of every sale goes to charity.` },
    ],
  },
  {
    label: "Collectors",
    heading: "Discover emerging talent",
    cta: { href: "/gallery", label: "Browse Gallery" },
    steps: [
      { n: "01", title: "Browse Gallery", text: "Explore curated student artwork from talented emerging artists." },
      { n: "02", title: "Place Bids", text: "Bid on pieces you love and watch the auction unfold." },
      { n: "03", title: "Win Artwork", text: "Secure unique pieces while supporting student artists." },
      { n: "04", title: "Support Causes", text: "Part of your purchase goes to charity." },
    ],
  },
];

const PLANS = [
  {
    name: "✦ For Artists",
    tag: "Free to list",
    price: `${ARTIST_PERCENT}%`,
    per: "/you keep",
    desc: "Built for emerging student artists ready to share their work with collectors and earn from every sale.",
    features: [
      ["Submit", "your work for curated review"],
      ["Give", `${CHARITY_PERCENT}% of every sale to charity`],
      ["Track", "bids and earnings from your dashboard"],
      ["Promote", "listings with optional visibility boosts"],
      ["Flexible", "PayPal, Venmo, Zelle or Stripe payouts"],
      ["Keep", "the majority of every winning bid"],
    ],
  },
  {
    name: "✦ For Collectors",
    tag: "No fees to bid",
    price: "Free",
    per: "/to join",
    desc: "For collectors who want to discover, follow, and win original student art in real-time auctions.",
    features: [
      ["Browse", "a curated gallery of approved artwork"],
      ["Bid", "live with fair anti-sniping protection"],
      ["Discover", "emerging talent before anyone else"],
      ["Support", "charities through every purchase"],
      ["Checkout", "securely with taxes handled for you"],
      ["Collect", "one-of-a-kind original pieces"],
    ],
  },
];

const FAQS = [
  { q: "1. What is BrushBids?", a: "BrushBids is a student art auction platform that connects emerging student artists with collectors through curated, real-time auctions." },
  { q: "2. How does curation work?", a: "Every submission is reviewed by our curators with help from AI tools, so only strong, original pieces enter the auction gallery." },
  { q: "3. How does bidding work?", a: "Auctions run for a set duration with a live countdown. If a bid lands in the final two minutes, the auction extends to keep things fair." },
  { q: "4. How do artists get paid?", a: `Artists keep ${ARTIST_PERCENT}% of every sale and are paid ${PAYOUT_TIMING}, via PayPal, Venmo, Zelle, or Stripe.` },
  { q: "5. How does charity giving work?", a: `${CHARITY_PERCENT}% of every sale goes to charity. We will publish our charity partners once written agreements are signed.` },
  { q: "6. Is BrushBids free to use?", a: "Yes. Browsing and bidding are free for collectors, and artists can list their work at no upfront cost." },
];

/* ============================================================
   Small building blocks
   ============================================================ */
function SocialLinks() {
  if (SOCIALS.length === 0) return null;
  return (
    <div className="social-media-wrapper">
      {SOCIALS.map(({ Icon, href, label, small }) => (
        <a key={label} aria-label={label} href={href} target="_blank" rel="noreferrer" className="social-link w-inline-block">
          <div className={small ? "social-icon-wrap smaller-icon" : "social-icon-wrap"}>
            <div className="social-icon w-embed"><Icon size={small ? 18 : 22} /></div>
            <div className="social-icon w-embed"><Icon size={small ? 18 : 22} /></div>
          </div>
        </a>
      ))}
    </div>
  );
}

function MainButton({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="main-button w-inline-block">
      <div className="button-block">
        <div className="button-text-wrap">
          <div className="button-text">{label}</div>
          <div className="button-text">{label}</div>
        </div>
      </div>
      <div className="button-line"></div>
    </Link>
  );
}

/* ============================================================
   Hero ring
   ============================================================ */

// Largest outer-ring orbit (the `.circle-item` height, in rem) that keeps the
// ring un-clipped at a given viewport width. The effective on-screen radius is
// `(1.75*H - 3.5) * 16 * wrapperScale`px (image-item sits at top:-125% of the
// circle-item height); we require radius + tile-half-width + margin <= vw/2 and
// solve for H. The result is the no-clip MAX, so we only cap the upper end
// (~30% tighter than the old 25rem) — there is no clipping-relevant lower bound.
function computeOuterOrbitRem(vw: number): number {
  let wrapperScale = 1.2; // base (>= 992px)
  let tileWidthRem = 6.3;
  if (vw <= 479) wrapperScale = 0.6;
  else if (vw <= 767) wrapperScale = 0.8;
  else if (vw <= 991) wrapperScale = 1.1;
  else if (vw <= 1439) wrapperScale = 1.2;
  else { wrapperScale = 1.3; tileWidthRem = 7; }
  const margin = Math.max(24, vw * 0.04); // comfortable breathing room
  const halfAvail = vw / 2 - margin;
  const hMax = (halfAvail / (16 * wrapperScale) + 3.5 - tileWidthRem / 2) / 1.75;
  const h = Math.min(18, Number.isFinite(hMax) ? hMax : 18);
  return Math.round(Math.max(0, h) * 100) / 100;
}

/**
 * Mobile hero (below `md`). The orbital ring is too dense for narrow phones, so
 * on mobile we show a clean, simple hero: logo + title, tagline and the CTA
 * buttons only — no artwork imagery. Everything stays inside the page gutters
 * (px-5). Hidden at md+ where the desktop orbital ring takes over (unchanged).
 */
function MobileHero() {
  return (
    <section className="md:hidden relative px-5 pt-28 pb-14 overflow-hidden" data-testid="hero-mobile">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[320px] h-[320px] rounded-full bg-[#A78BFA]/20 blur-[90px]" />
        <div className="absolute top-24 right-0 w-[200px] h-[200px] rounded-full bg-[#F472B6]/15 blur-[80px]" />
      </div>

      <div className="flex flex-col items-center text-center">
        <img src={brushBidsLogo} alt="BrushBids" className="h-[92px] w-auto mb-3" />
        <h1 className="text-5xl font-normal tracking-tight text-white leading-none" style={{ fontWeight: 400 }}>
          Brush<span style={{ color: "#A78BFA" }}>Bids</span>
        </h1>
        <p className="mt-3 text-base text-white/60 max-w-xs">The Premier Marketplace for Student Art.</p>

        <div className="mt-7 flex w-full max-w-xs flex-col gap-3">
          <Link
            href="/submit-artwork"
            style={{ color: "#0a0a0f" }}
            className="flex h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-[#0a0a0f] active:scale-[0.98] transition-transform"
            data-testid="button-hero-mobile-sell"
          >
            Start Selling
          </Link>
          <Link
            href="/gallery"
            className="flex h-12 items-center justify-center rounded-full border border-white/20 px-6 text-sm font-semibold text-white active:scale-[0.98] transition-transform"
            data-testid="button-hero-mobile-browse"
          >
            Browse Gallery
          </Link>
        </div>
      </div>
    </section>
  );
}

function HeroRing({ ringArts }: { ringArts: RingArt[] }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  // Outer ring orbit radius (the `.circle-item` height) is responsive so the
  // ring frames the title on desktop (~30% tighter than the old 25rem) but
  // always shrinks to fit narrow viewports — no tile is ever clipped at any
  // width or on resize. Tile SIZE (1.4x) and the scroll exit are unchanged;
  // only the orbit lever changes. Applied as a CSS var scoped to this ring's
  // container, so the inner wheel and the CTA ring are unaffected. Initialized
  // synchronously so the very first paint is already fit (no clipped frame).
  const [orbitRem, setOrbitRem] = useState(() =>
    typeof window !== "undefined" ? computeOuterOrbitRem(window.innerWidth) : 18,
  );
  useEffect(() => {
    const onResize = () => setOrbitRem(computeOuterOrbitRem(window.innerWidth));
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  // Rings keep their responsive CSS base size at entry (so the full wheel is
  // visible with breathing room). The inner wheel zooms IN and fades as the hero
  // scrolls up, lingering longest before the next section appears.
  // Outer ring exits OUTWARD: the ring's radius expands (block scales up) so the
  // tiles fly away from center, while each tile shrinks (counter-scale) and the
  // whole layer fades to 0. This reads as distinct from the inner wheel's inward
  // zoom. Everything is driven by scroll progress so it reverses cleanly.
  const outerExpand = useTransform(scrollYProgress, [0, 0.55], [1, 1.7]);
  const outerTileScale = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const outerOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const innerZoom = useTransform(scrollYProgress, [0, 0.6], [1, 1.32]);
  const innerOpacity = useTransform(scrollYProgress, [0.55, 0.95], [1, 0]);

  // Both rings rotate; rotation speed reacts to scroll velocity
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 300 });
  const outerRotate = useMotionValue(0);
  const innerRotate = useMotionValue(0);

  useAnimationFrame((_, delta) => {
    const dt = delta / 1000;
    const baseSpeed = 4; // idle deg/s
    const speed = baseSpeed + Math.abs(smoothVelocity.get()) / 55; // scroll faster -> spin faster
    outerRotate.set(outerRotate.get() + speed * dt);
    innerRotate.set(innerRotate.get() - speed * dt); // opposite direction
  });

  const at = (i: number) => ringArts[i % ringArts.length];

  return (
    <>
      <MobileHero />
      <header ref={ref} className="section-home-header hidden md:block">
        <div className="circle-component">
        <div className="w-layout-grid header-component-grid">
          <div className="circle-container" style={{ ["--cy-outer-orbit" as string]: `${orbitRem}rem` } as CSSProperties}>
            <motion.div className="circle-wrapper" style={{ opacity: outerOpacity }}>
              <motion.div className="circle-block" style={{ rotate: outerRotate, scale: outerExpand }}>
                {Array.from({ length: OUTER_COUNT }).map((_, i) => (
                  <div key={i} className={`circle-item _${String(i + 1).padStart(2, "0")}`}>
                    <motion.div className="circle-image-item" style={{ scale: outerTileScale }}>
                      <img src={at(i).imageUrl} onError={handleWheelImageError(i)} alt={at(i).title} loading="eager" className="circle-image" />
                    </motion.div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
          <div className="inner-circle-container">
            <motion.div className="inner-circle-wrapper" style={{ opacity: innerOpacity }}>
              <motion.div className="inner-circle-block" style={{ rotate: innerRotate, scale: innerZoom }}>
                {Array.from({ length: INNER_COUNT }).map((_, i) => (
                  <div key={i} className={`inner-circle-item _${String(i + 1).padStart(2, "0")}`}>
                    <div className="inner-circle-image-item">
                      <img src={at(i + 3).imageUrl} onError={handleWheelImageError(i + 3)} alt={at(i + 3).title} loading="eager" className="card-image" />
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
          <div className="header-content-wrap">
            <div className="header-content">
              <img src={brushBidsLogo} alt="BrushBids" style={{ height: "72px", width: "auto", background: "transparent", display: "block", margin: "0 auto 0.25rem" }} />
              <h1 className="title">Brush<span style={{ color: "#A78BFA" }}>Bids</span></h1>
              <div className="header-description">
                <div className="text-align-center">
                  <div className="text-size-small">The Premier Marketplace for Student Art.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="header-overlay"></div>
        </div>
      </header>
    </>
  );
}

/* ============================================================
   Rotating circle text (decorative badge)
   ============================================================ */
function CircleText() {
  const text = "BRUSHBIDS · STUDENT ART AUCTIONS · ";
  return (
    <div className="circle-text-wrap">
      <svg className="circle-text" viewBox="0 0 200 200" width="160" height="160" aria-hidden="true">
        <defs>
          <path id="cy-textcircle" d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0" />
        </defs>
        <text fill="currentColor" fontSize="13" letterSpacing="2">
          <textPath href="#cy-textcircle">{text}{text}</textPath>
        </text>
      </svg>
    </div>
  );
}

/* ============================================================
   Scroll title (velocity-reactive marquee)
   ============================================================ */
function ScrollTitle() {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], { clamp: false });
  // 4 copies -> one copy is 25% of the track; wrap within that range for a seamless loop
  const x = useTransform(baseX, (v) => `${wrapValue(-25, 0, v)}%`);
  const directionFactor = useRef(1);

  useAnimationFrame((_, delta) => {
    let moveBy = directionFactor.current * 1.5 * (delta / 1000);
    if (velocityFactor.get() < 0) directionFactor.current = -1;
    else if (velocityFactor.get() > 0) directionFactor.current = 1;
    moveBy += directionFactor.current * moveBy * velocityFactor.get();
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div className="scroll-title-wrapper">
      <motion.div className="scroll-title-track" style={{ x, display: "flex", alignItems: "center", flex: "none", willChange: "transform" }}>
        {[0, 1, 2, 3].map((k) => (
          <div className="scroll-title-item" key={k}>
            <h2 className="scroll-title">Student Art, <span className="text-color-grey">Reimagined</span>  ✦</h2>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* ============================================================
   Intro
   ============================================================ */
function Intro() {
  return (
    <section className="section-home-intro">
      <ScrollTitle />
      <div className="padding-global">
        <div className="container-large">
          <div className="padding-section-large">
            <div className="intro-wrap">
              <p className="intro-text">A curated auction experience built for emerging student artists, <span className="text-color-secondary">turning original work into real opportunity.</span></p>
              <div className="spacer-xlarge"></div>
            </div>
            <div className="w-layout-grid intro-grid">
              <div className="max-width-medium">
                <p className="text-size-regular">✦ BrushBids connects student artists with collectors through expert curation, real-time bidding, and built-in charitable giving — so every piece you discover supports a young artist and a good cause.</p>
                <div className="spacer-medium"></div>
                <div className="intro-contact-wrap">
                  <SocialLinks />
                  <div className="button-wrap">
                    <MainButton href="/about" label="Our Story" />
                  </div>
                </div>
              </div>
              <CircleText />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Circle shape ("Keep Scrolling")
   ============================================================ */
function CircleShape() {
  const ref = useRef<HTMLElement>(null);
  // The wrapper is 150vh tall with a 100vh sticky container, so the section
  // pins to the viewport for roughly the first third of this range. We map
  // scroll relative to that pin so the orb grows while the section is pinned.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  // White orb is anchored to the bottom edge of the viewport and grows from a
  // small dot to fill the screen — its bottom half stays off-screen, so only
  // the top emerges, wiping the dark "Our Story" section and revealing the
  // light "Our Solutions" section.
  // Max scale is computed from the viewport so the orb fully covers any screen
  // (incl. ultrawide / 4K). Base orb is 5rem (radius 40px) centered at the
  // bottom edge, so the farthest point to cover is a top corner.
  const [maxScale, setMaxScale] = useState(60);
  useEffect(() => {
    const compute = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const radiusNeeded = Math.sqrt((vw / 2) ** 2 + vh ** 2) * 1.15;
      setMaxScale(Math.max(60, Math.ceil(radiusNeeded / 40)));
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, maxScale]);
  const textOpacity = useTransform(scrollYProgress, [0.08, 0.26], [1, 0]);
  return (
    <section className="circle-shape-wrapper" ref={ref}>
      <div className="circle-shape-container">
        <div className="circle-shape-block">
          <motion.div className="circle-shape" style={{ scale }}></motion.div>
          <motion.div className="scrolling-text-wrap" style={{ opacity: textOpacity }}>
            <div className="scrolling-text">Keep Scrolling</div>
            <div className="scrolling-text">+</div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Service grid
   ============================================================ */
function Services() {
  return (
    <section className="section-home-service">
      <div className="padding-global">
        <div className="container-large">
          <div className="top-content">
            <div className="text-align-center">
              <div className="subtitle text-color-alternate">How It Works</div>
              <div className="spacer-medium"></div>
              <h2 className="heading-style-h2 text-color-alternate">Art That <span className="text-color-grey">Gives Back</span></h2>
            </div>
          </div>
          <div className="process-grid">
            {PROCESS.map((col) => (
              <div className="service-block process-card" key={col.label}>
                <div className="process-card-head">
                  <div className="service-subtitle">{col.label}</div>
                  <h2 className="process-card-heading text-[31px]">{col.heading}</h2>
                  <div className="doted-line process-card-divider"></div>
                </div>
                {col.steps.map((step) => (
                  <div className="process-step" key={step.n}>
                    <div className="process-step-number">{step.n}</div>
                    <div className="process-step-body">
                      <div className="process-step-title">{step.title}</div>
                      <p className="text-size-small text-color-alternate process-step-text">{step.text}</p>
                    </div>
                  </div>
                ))}
                <div className="process-card-button">
                  <MainButton href={col.cta.href} label={col.cta.label} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Featured Works (iPod-style cover flow carousel)
   ============================================================ */
function FeaturedWorks({ items }: { items: RingArt[] }) {
  const coverFlowArtworks = useMemo(() => {
    const list = items && items.length > 0 ? items.slice(0, 12) : FALLBACK_ART;
    return list.length > 0 ? list : FALLBACK_ART;
  }, [items]);

  const [currentIndex, setCurrentIndex] = useState(0);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % coverFlowArtworks.length);
  }, [coverFlowArtworks.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + coverFlowArtworks.length) % coverFlowArtworks.length);
  }, [coverFlowArtworks.length]);

  useEffect(() => {
    const interval = setInterval(goNext, 6000);
    return () => clearInterval(interval);
  }, [goNext]);

  useEffect(() => {
    if (currentIndex > coverFlowArtworks.length - 1) setCurrentIndex(0);
  }, [coverFlowArtworks.length, currentIndex]);

  const currentArt = coverFlowArtworks[currentIndex] ?? coverFlowArtworks[0];

  // Cover-flow uses fixed pixel sizes tuned for desktop. On phones the desktop
  // center (340px) is wider than the viewport gutters, so we scale the whole
  // flow down below `md`. Desktop values are unchanged.
  const [vw, setVw] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1280));
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const isMobile = vw > 0 && vw < 768;
  const centerSize = isMobile ? Math.min(240, vw - 110) : 340;
  const sideSize = isMobile ? Math.round(centerSize * 0.72) : 260;
  const flowCenterGap = isMobile ? Math.round(centerSize * 0.62) : 220;
  const flowStackSpacing = isMobile ? Math.round(centerSize * 0.42) : 110;
  const flowHeight = isMobile ? 360 : 500;
  const centerZ = isMobile ? 60 : 120;

  const flowItems = useMemo(() => {
    const total = coverFlowArtworks.length;
    const half = Math.min(3, Math.floor((total - 1) / 2));
    const result: { artwork: RingArt; offset: number; arrayIdx: number }[] = [];
    for (let i = -half; i <= half; i++) {
      const idx = ((currentIndex + i) % total + total) % total;
      result.push({ artwork: coverFlowArtworks[idx], offset: i, arrayIdx: idx });
    }
    return result;
  }, [coverFlowArtworks, currentIndex]);

  return (
    <section aria-label="Featured Works" className="relative" style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }} data-testid="section-featured-works">
      <div className="relative z-10 pt-16 md:pt-24 pb-0">
        <motion.div
          className="text-left px-6 md:px-12 lg:px-16 mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-xs font-medium text-[#A78BFA] uppercase tracking-[0.3em] mb-3 block">Curated Collection</span>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] text-white">Featured<br />Works</h2>
        </motion.div>

        <div className="relative select-none">
          <div
            className="relative mx-auto overflow-hidden"
            style={{
              height: `${flowHeight}px`,
              perspective: "1400px",
              perspectiveOrigin: "50% 38%",
            }}
            data-testid="cover-flow-container"
          >
            <div className="absolute inset-0 flex items-start justify-center" style={{ paddingTop: "10px" }}>
              {flowItems.map(({ artwork, offset, arrayIdx }) => {
                const isCenter = offset === 0;
                const absOffset = Math.abs(offset);
                const side = offset < 0 ? -1 : offset > 0 ? 1 : 0;

                const coverSize = isCenter ? centerSize : sideSize;
                const centerGap = flowCenterGap;
                const stackSpacing = flowStackSpacing;
                const translateX = isCenter ? 0 : side * (centerGap + (absOffset - 1) * stackSpacing);
                const rotateY = isCenter ? 0 : side * -45;
                const translateZ = isCenter ? centerZ : -(absOffset * 30);
                const zIndex = 20 - absOffset;
                const itemOpacity = absOffset >= 3 ? 0.25 : absOffset === 2 ? 0.6 : 1;

                return (
                  <div
                    key={`flow-${arrayIdx}`}
                    className="absolute cursor-pointer"
                    style={{
                      zIndex,
                      transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg)`,
                      transition: "transform 0.6s cubic-bezier(0.25, 0.1, 0.25, 1), opacity 0.5s ease",
                      transformStyle: "preserve-3d",
                      opacity: itemOpacity,
                      willChange: "transform, opacity",
                    }}
                    onClick={() => {
                      if (offset < 0) goPrev();
                      else if (offset > 0) goNext();
                    }}
                  >
                    <div
                      className="relative overflow-hidden"
                      style={{
                        width: `${coverSize}px`,
                        height: `${coverSize}px`,
                        borderRadius: "4px",
                        boxShadow: isCenter
                          ? "0 12px 40px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3)"
                          : `${side * -4}px 4px 16px rgba(0,0,0,0.4)`,
                      }}
                    >
                      <img
                        src={artwork.imageUrl}
                        alt={artwork.title}
                        onError={handleArtworkImageError}
                        className="w-full h-full object-cover"
                        draggable={false}
                        loading="lazy"
                      />
                      {isCenter && (
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%)",
                            borderRadius: "4px",
                          }}
                        />
                      )}
                    </div>

                    <div
                      className="overflow-hidden pointer-events-none"
                      style={{
                        width: `${coverSize}px`,
                        height: `${coverSize * 0.22}px`,
                        marginTop: "1px",
                        transform: "scaleY(-1)",
                        WebkitMaskImage: "linear-gradient(to top, transparent 20%, rgba(0,0,0,0.18) 100%)",
                        maskImage: "linear-gradient(to top, transparent 20%, rgba(0,0,0,0.18) 100%)",
                        opacity: isCenter ? 0.25 : 0.12,
                      }}
                    >
                      <img
                        src={artwork.imageUrl}
                        alt=""
                        onError={handleArtworkImageError}
                        className="w-full object-cover object-bottom"
                        style={{ height: `${coverSize}px` }}
                        draggable={false}
                        loading="lazy"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="absolute bottom-[90px] left-0 z-20 px-6 md:px-12 lg:px-16 text-left hidden md:block" style={{ maxWidth: "calc(50% - 190px)" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="space-y-0.5"
              >
                <h3 className="text-lg md:text-xl lg:text-2xl font-display font-bold tracking-tight italic text-white" data-testid="text-coverflow-title">
                  {currentArt.title}
                </h3>
                <p className="text-white/50 tracking-wide text-[17px] font-semibold text-left" data-testid="text-coverflow-artist">
                  By {currentArt.artistName}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="md:hidden absolute bottom-[70px] left-0 right-0 z-20 text-center px-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={`mobile-${currentIndex}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="space-y-0.5 mt-6"
              >
                <h3 className="text-base font-display font-bold tracking-tight italic text-white" data-testid="text-coverflow-title-mobile">
                  {currentArt.title}
                </h3>
                <p className="text-white/50 tracking-wide text-sm font-semibold" data-testid="text-coverflow-artist-mobile">
                  {currentArt.artistName}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="absolute bottom-[24px] left-0 right-0 flex items-center justify-center gap-6 z-20">
            <Button
              size="icon"
              variant="outline"
              onClick={goPrev}
              className="rounded-full border-white/20 text-white hover:bg-white/10 bg-transparent"
              data-testid="button-coverflow-prev"
              aria-label="Previous artwork"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-1.5" role="tablist" aria-label="Featured artwork slides">
              {coverFlowArtworks.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={cn(
                    "rounded-full transition-all duration-300",
                    i === currentIndex
                      ? "w-6 h-2 bg-[#A78BFA]"
                      : "w-2 h-2 bg-white/20"
                  )}
                  role="tab"
                  aria-selected={i === currentIndex}
                  aria-label={`Go to artwork ${i + 1}`}
                  data-testid={`coverflow-dot-${i}`}
                />
              ))}
            </div>

            <Button
              size="icon"
              variant="outline"
              onClick={goNext}
              className="rounded-full border-white/20 text-white hover:bg-white/10 bg-transparent"
              data-testid="button-coverflow-next"
              aria-label="Next artwork"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Pricing
   ============================================================ */
function Pricing() {
  return (
    <section className="section-home-pricing">
      <div className="divider-wrap">
        <div className="w-layout-grid background-grid">
          <div className="background-overflow"><div className="menu-background top-background"></div></div>
          <div className="background-overflow"><div className="menu-background bottom-background"></div></div>
        </div>
      </div>
      <div className="padding-global">
        <div className="container-small">
          <div className="padding-section-large">
            <div className="pricing-content-wrapper">
              <div className="top-content">
                <div className="subtitle text-align-center">Join BrushBids</div>
                <div className="spacer-medium"></div>
                <h2 className="heading-style-h2 text-align-center">Built for <span className="text-color-grey">Everyone</span></h2>
              </div>
              <div className="spacer-xlarge"></div>
              <div className="pricing-component">
                <div className="pricing-container">
                  <div className="w-layout-grid pricing-component-grid">
                    {PLANS.map((p, i) => (
                      <div className="pricing-wrapper" key={p.name}>
                        <div className="pricing-wrap">
                          <div className="pricing-block">
                            {i === 1 && <img loading="lazy" src={artFlow} alt="" className="pricing-bg-image" />}
                            <div className="pricing-tag">
                              <div className="plan-name">{p.name}</div>
                              <div className="popular-tag">{p.tag}</div>
                            </div>
                            <h2 className="price-text">{p.price}<span className="text-size-small">{p.per}</span></h2>
                            <div className="text-size-regular">{p.desc}</div>
                            <div className="dark-line"></div>
                            <div className="text-size-small text-color-secondary">Features:</div>
                            <div className="feature-content-wrap">
                              {p.features.map(([strong, rest]) => (
                                <div className="feature-item" key={strong}>
                                  <div className="price-feature-text"><strong className="text-color-primary text-weight-medium">{strong}</strong> {rest}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="pricing-gradient"></div>
                        </div>
                        <Link href={i === 0 ? "/submit-artwork" : "/gallery"} className="main-button widith-100 w-inline-block">
                          <div className="button-block">
                            <div className="button-text-wrap">
                              <div className="button-text">{i === 0 ? "Start Selling" : "Browse Gallery"}</div>
                              <div className="button-text">{i === 0 ? "Start Selling" : "Browse Gallery"}</div>
                            </div>
                          </div>
                          <div className="button-line large-button"></div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   FAQ accordion
   ============================================================ */
function Faq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <section className="faq-section">
      <div className="padding-global">
        <div className="container-large">
          <div className="dividing-line"></div>
          <div className="padding-section-large">
            <div className="faq-component">
              <div className="top-content">
                <div className="subtitle text-align-center">FAQ</div>
                <div className="spacer-medium"></div>
                <h2 className="heading-style-h2 text-align-center">Answered <span className="text-color-grey">Questions</span></h2>
              </div>
              <div className="spacer-xlarge"></div>
              <div className="w-layout-grid faq-grid">
                {FAQS.map((f, i) => {
                  const isOpen = openIdx === i;
                  return (
                    <div
                      className={isOpen ? "accordion-content-item is-open" : "accordion-content-item"}
                      key={f.q}
                      onClick={() => setOpenIdx(isOpen ? null : i)}
                      data-testid={`accordion-faq-${i}`}
                    >
                      <div className="accordion-top-wrap">
                        <div className="accordion-title-item">
                          <h2 className="accordion-heading">{f.q}</h2>
                        </div>
                        <div className="plus-block">
                          <div className="plus-line"></div>
                          <div className="plus-line vertical"></div>
                        </div>
                      </div>
                      <div className="accordion-content-wrap" style={{ maxHeight: isOpen ? "16rem" : "0rem" }}>
                        <div className="accordion-content-block">
                          <p className="accordion-answer-text">{f.a}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Call to action
   ============================================================ */
function CallToAction({ ringArts }: { ringArts: RingArt[] }) {
  const at = (i: number) => ringArts[i % ringArts.length];
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.5, 2.3]);
  return (
    <section ref={ref} className="call-to-action">
      <div className="call-to-action-wrapper">
        <div className="circle-container">
          <motion.div className="circle-wrapper" style={{ scale }}>
            <div className="circle-block cta-circle-block">
              {Array.from({ length: OUTER_COUNT }).map((_, i) => (
                <div key={i} className={`circle-item _${String(i + 1).padStart(2, "0")}`}>
                  <div className="circle-image-item">
                    <img src={at(i).imageUrl} onError={handleWheelImageError(i)} alt={at(i).title} loading="lazy" className="circle-image" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
        <div className="call-to-action-content">
          <div className="top-content">
            <div className="subtitle text-align-center">Start Now</div>
            <div className="spacer-medium"></div>
            <h2 className="heading-style-h2 text-align-center font-bold md:whitespace-nowrap text-[clamp(1.5rem,5vw,3rem)]">Ready to Start Your <span className="text-[#A78BFA]">Journey?</span></h2>
          </div>
          <div className="spacer-small"></div>
          <div className="max-width-medium align-center">
            <div className="text-size-regular text-align-center">Explore curated student artwork, place your bid, and support emerging artists and charity with every piece you collect.</div>
          </div>
          <div className="spacer-large"></div>
          <div className="button-wrap">
            <MainButton href="/gallery" label="Browse Gallery" />
            <MainButton href="/submit-artwork" label="Submit Your Art" />
          </div>
        </div>
        <div className="cta-opacity"></div>
      </div>
    </section>
  );
}

/* ============================================================
   Footer
   ============================================================ */
function SiteFooter() {
  const menu = [
    { label: "Home", href: "/" },
    { label: "Gallery", href: "/gallery" },
    { label: "About", href: "/about" },
    { label: "FAQ", href: "/faq" },
    { label: "Submit Artwork", href: "/submit-artwork" },
    { label: "Contact", href: "/contact" },
    { label: "Terms", href: "/terms" },
  ];
  return (
    <>
      <footer className="footer">
        <div className="padding-global">
          <div className="container-large">
            <div className="dividing-line"></div>
            <div className="footer-padding">
              <div className="footer-top-content">
                <Link href="/" className="footer-link w-inline-block">
                  <img src={brushBidsLogo} loading="lazy" alt="BrushBids" className="footer-logo" style={{ height: "2.5rem", width: "auto" }} />
                </Link>
                <div className="text-size-regular text-align-center">Join a community of student artists and collectors making art accessible and impactful.</div>
                <div className="spacer-xsmall"></div>
                <SocialLinks />
              </div>
              <div className="footer-menu-wrap">
                {menu.map((m) => (
                  <Link href={m.href} className="link-button w-inline-block" key={m.label}>
                    <div className="link-wrap">
                      <div className="link-button-text">{m.label}</div>
                      <div className="link-button-text">{m.label}</div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="dividing-line"></div>
              <div className="w-layout-grid footer-grid">
                <div className="footer-content-block">
                  <div className="footer-block">
                    <div className="footer-text">Curated by</div>
                    <span className="link-button"><div className="link-wrap"><div className="link-button-text">Artists</div></div></span>
                  </div>
                  <div className="footer-block">
                    <div className="footer-text">Supporting</div>
                    <span className="link-button"><div className="link-wrap"><div className="link-button-text">Student Artists</div></div></span>
                  </div>
                </div>
                <div className="back-to-top-wrapper">
                  <a href="#top" className="back-to-top-link w-inline-block">↑</a>
                </div>
                <div className="footer-content-block">
                  <div className="footer-block">
                    <Link href="/terms" className="link-button w-inline-block">
                      <div className="link-wrap"><div className="link-button-text">Terms &amp; Conditions</div><div className="link-button-text">Terms &amp; Conditions</div></div>
                    </Link>
                  </div>
                  <div className="footer-block">
                    <Link href="/faq" className="link-button w-inline-block">
                      <div className="link-wrap"><div className="link-button-text">FAQs</div><div className="link-button-text">FAQs</div></div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="marquee-footer">
          <div className="marquee-text-component">
            {[0, 1].map((k) => (
              <div className="marquee-text-wrapper" key={k}>
                <h2 className="marquee-text opacity">
                  {"BrushBids "}
                  <img src={brushBidsLogo} alt="" aria-hidden="true" className="marquee-logo" style={{ height: "calc(0.7em + 240px)", width: "auto", display: "inline-block", verticalAlign: "middle" }} />
                  {" BrushBids "}
                  <img src={brushBidsLogo} alt="" aria-hidden="true" className="marquee-logo" style={{ height: "calc(0.7em + 240px)", width: "auto", display: "inline-block", verticalAlign: "middle" }} />
                  {" "}
                </h2>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
}

/* ============================================================
   Page
   ============================================================ */
export default function Home() {
  const { data: artworks } = useArtworks({ status: "approved", sortBy: "views" });

  const realArts: RingArt[] = useMemo(() => {
    if (!artworks) return [];
    return (artworks as ArtworkWithArtist[]).slice(0, 30).map((a) => {
      const name = [a.artist?.firstName, a.artist?.lastName].filter(Boolean).join(" ") || "Student Artist";
      return { title: a.title, artistName: name, imageUrl: sizedImage(a.imageUrl || artSunset), id: a.id };
    });
  }, [artworks]);

  const ringArts: RingArt[] = realArts.length > 0 ? realArts : FALLBACK_ART;

  return (
    <div className="cyrclo-page">
      <SEOHead
        title="BrushBids — Student Art Auctions for a Good Cause"
        description="Discover and bid on curated student artwork in real-time auctions. A portion of every sale supports charity."
      />
      <div className="page-wrapper">
        <SiteMenu />
        <main className="main-wrapper">
          <div id="top" className="back-to-top"></div>
          <HeroRing ringArts={ringArts} />
          <div className="header-spacer"></div>
          <div className="overflow-wrapper">
            <Intro />
            <CircleShape />
            <Services />
          </div>
          <div className="divider-wrap">
            <div className="w-layout-grid background-grid">
              <div className="background-overflow"><div className="menu-background bottom"></div></div>
            </div>
          </div>
          <FeaturedWorks items={ringArts} />
          <Pricing />
          <CallToAction ringArts={ringArts} />
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
