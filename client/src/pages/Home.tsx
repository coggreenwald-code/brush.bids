import "./cyrclo.css";
import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { motion, useScroll, useTransform, useVelocity, useSpring, useMotionValue, useAnimationFrame } from "framer-motion";
import { SiInstagram, SiX, SiLinkedin, SiFacebook } from "react-icons/si";
import { useArtworks } from "@/hooks/use-artworks";
import { useAuth } from "@/hooks/use-auth";
import { handleArtworkImageError } from "@/lib/imageFallback";
import { SEOHead } from "@/components/SEOHead";
import brushBidsLogo from "@assets/BrushBids_Logo_1772561349423.png";

import artSunset from "@assets/art-sunset-mountains.png";
import artPortrait from "@assets/art-abstract-portrait.png";
import artOcean from "@assets/art-ocean-watercolor.png";
import artGeometric from "@assets/art-geometric-abstract.png";
import artFloral from "@assets/art-floral-still-life.png";
import artCityscape from "@assets/art-urban-cityscape.png";
import artFlow from "@assets/art-abstract-flow.png";

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

function sizedImage(url: string): string {
  if (!url.includes("images.unsplash.com")) return url;
  const [base] = url.split("?");
  return `${base}?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=70`;
}

const SOCIALS = [
  { Icon: SiInstagram, href: "https://www.instagram.com/", label: "Instagram Link", small: false },
  { Icon: SiX, href: "https://www.x.com/", label: "X Link", small: true },
  { Icon: SiLinkedin, href: "https://www.linkedin.com/", label: "Linkedin Link", small: false },
  { Icon: SiFacebook, href: "https://www.facebook.com/", label: "Facebook Link", small: false },
];

const TESTIMONIALS: { quote: string; name: string; role: string }[] = [
  { quote: "I discovered an incredible student painter here and won the piece in the final minute. The whole auction felt alive.", name: "Daniel Carter", role: "Collector" },
  { quote: "As a student artist, BrushBids gave my work a real audience — and a portion of my sale went to a cause I care about.", name: "Sophia Mitchell", role: "Student Artist" },
  { quote: "The curation is thoughtful and the bidding is genuinely exciting. It's the most fun I've had collecting art online.", name: "Ethan Walker", role: "Collector" },
  { quote: "From submission to payout, everything was clear and supportive. It felt built for emerging artists like me.", name: "Isabella Reed", role: "Student Artist" },
  { quote: "The anti-sniping timer keeps every auction fair and thrilling right up to the last second.", name: "Olivia Bennett", role: "Collector" },
  { quote: "I love that buying a piece also gives back to charity. Beautiful art and a good cause in one place.", name: "Ryan Thompson", role: "Collector" },
];

const BUBBLES_OUTER = ["Impressive", "Unmatched", "Brilliant", "Exceptional"];
const BUBBLES_INNER = ["I loved it", "Incredible", "Amazing"];

const PROCESS = [
  {
    label: "Artists",
    heading: "Start selling your work",
    cta: { href: "/submit-artwork", label: "Start Selling" },
    steps: [
      { n: "01", title: "Submit Your Art", text: "Upload your artwork with a description and set your starting price." },
      { n: "02", title: "Expert Review", text: "Our curators review your submission for quality, supported by advanced tools trained by art professionals." },
      { n: "03", title: "Get Paid", text: "Immediately get paid when your art sells." },
      { n: "04", title: "Give Back", text: "A portion of the sale goes to your chosen charity, making a positive impact." },
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
    price: "75%",
    per: "/you keep",
    desc: "Built for emerging student artists ready to share their work with collectors and earn from every sale.",
    features: [
      ["Submit", "your work for curated review"],
      ["Choose", "a charity to support with each sale"],
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
  { q: "4. How do artists get paid?", a: "Artists keep the majority of every winning bid and can receive payouts via PayPal, Venmo, Zelle, or Stripe Connect." },
  { q: "5. How does charity giving work?", a: "A portion of every sale goes to a charity chosen by the artist, so each purchase supports a cause alongside the art." },
  { q: "6. Is BrushBids free to use?", a: "Yes. Browsing and bidding are free for collectors, and artists can list their work at no upfront cost." },
];

/* ============================================================
   Small building blocks
   ============================================================ */
function SocialLinks() {
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

function ReviewStars() {
  return (
    <div className="review-wrap">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className="review-icon" width="16" height="16" viewBox="0 0 24 24" fill="#F472B6" aria-hidden="true">
          <path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.8 5.9 20.4l1.5-6.8L2.2 9l6.9-.7L12 2z" />
        </svg>
      ))}
    </div>
  );
}

/* ============================================================
   Navbar (notch menu)
   ============================================================ */
function Navbar() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = open ? "hidden" : prev;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const links = [
    { label: "Home", href: "/" },
    { label: "Gallery", href: "/gallery" },
    { label: "About", href: "/about" },
    { label: "FAQ", href: "/faq" },
    { label: isAuthenticated ? "Dashboard" : "Sign In", href: isAuthenticated ? "/dashboard" : "/auth" },
  ];

  return (
    <div role="banner" className="navbar w-nav">
      <div className="nav-wrapper">
        <div className="nav-block">
          <nav role="navigation" className={open ? "nav-menu w-nav-menu is-open" : "nav-menu w-nav-menu"}>
            <div className="nav-menu-container">
              <div className="nav-menu-content">
                <div className="nav-menu-list">
                  {links.map((l) => (
                    <div className="nav-overflow" key={l.label}>
                      <Link href={l.href} onClick={() => setOpen(false)} className="nav-link w-inline-block" data-testid={`nav-${l.label.toLowerCase().replace(/\s+/g, "-")}`}>
                        <div className="nav-text">{l.label}</div>
                        <div className="nav-text">{l.label}</div>
                      </Link>
                    </div>
                  ))}
                  <div className="nav-overflow">
                    <div className="nav-social-media">
                      <SocialLinks />
                    </div>
                  </div>
                </div>
              </div>
              <div className="nav-background"></div>
            </div>
          </nav>
          <div className="menu-button w-nav-button" onClick={() => setOpen((v) => !v)} role="button" aria-label={open ? "Close menu" : "Open menu"} data-testid="button-menu">
            <div className="nav-menu-block">
              <div className="menu-button-wrap">
                <div className="menu-line-item"><div className="menu-line top"></div></div>
                <div className="menu-line-item"><div className="menu-line middle"></div></div>
                <div className="menu-line-item"><div className="menu-line bottom"></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Hero ring
   ============================================================ */
function HeroRing({ ringArts }: { ringArts: RingArt[] }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1.4, 3.6]);
  const innerScale = useTransform(scrollYProgress, [0, 1], [1.4, 3.6]);
  const opacity = useTransform(scrollYProgress, [0, 0.85, 1], [1, 1, 0]);

  // Middle (inner) ring spreads out slightly as you scroll
  const innerSpread = useTransform(scrollYProgress, [0, 1], [1, 1.18]);

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
    <header ref={ref} className="section-home-header">
      <div className="circle-component">
        <div className="w-layout-grid header-component-grid">
          <div className="circle-container">
            <motion.div className="circle-wrapper" style={{ scale, opacity }}>
              <motion.div className="circle-block" style={{ rotate: outerRotate }}>
                {Array.from({ length: OUTER_COUNT }).map((_, i) => (
                  <div key={i} className={`circle-item _${String(i + 1).padStart(2, "0")}`}>
                    <div className="circle-image-item">
                      <img src={at(i).imageUrl} onError={handleArtworkImageError} alt={at(i).title} loading="eager" className="circle-image" />
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
          <div className="inner-circle-container">
            <motion.div className="inner-circle-wrapper" style={{ scale: innerScale, opacity }}>
              <motion.div className="inner-circle-block" style={{ rotate: innerRotate, scale: innerSpread }}>
                {Array.from({ length: INNER_COUNT }).map((_, i) => (
                  <div key={i} className={`inner-circle-item _${String(i + 1).padStart(2, "0")}`}>
                    <div className="inner-circle-image-item">
                      <img src={at(i + 3).imageUrl} onError={handleArtworkImageError} alt={at(i + 3).title} loading="eager" className="card-image" />
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
          <div className="header-content-wrap">
            <div className="header-content">
              <img src={brushBidsLogo} alt="BrushBids" style={{ height: "72px", width: "auto", background: "transparent", display: "block", margin: "0 auto 0.25rem" }} />
              <h1 className="title">BrushBids</h1>
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
                <div className="service-subtitle">{col.label}</div>
                <h2 className="process-card-heading">{col.heading}</h2>
                <div className="doted-line process-card-divider"></div>
                <div className="process-steps">
                  {col.steps.map((step) => (
                    <div className="process-step" key={step.n}>
                      <div className="process-step-number">{step.n}</div>
                      <div className="process-step-body">
                        <div className="process-step-title">{step.title}</div>
                        <p className="text-size-small text-color-alternate process-step-text">{step.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
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
   Case studies (sticky stacking)
   ============================================================ */
function CaseStudies({ items }: { items: RingArt[] }) {
  const cards = items.slice(0, 4);
  while (cards.length < 4) cards.push(FALLBACK_ART[cards.length]);

  return (
    <section className="section-home-case-studies">
      <div className="padding-global">
        <div className="container-large">
          <div className="padding-section-large">
            <div className="top-content">
              <div className="subtitle text-align-center">Featured</div>
              <div className="spacer-medium"></div>
              <h2 className="heading-style-h2 text-align-center">Art In <span className="text-color-grey">Auction</span></h2>
            </div>
            <div className="spacer-medium"></div>
            <div className="case-study-top-content">
              <div className="text-size-small">Curated Picks©</div>
              <div className="text-size-small">(2025/26)</div>
            </div>
            <div className="spacer-large"></div>
            <div className="case-study-component">
              <div className="w-layout-grid case-study-component-grid">
                {cards.map((art, i) => (
                  <div className="w-dyn-list" key={i} style={{ position: "sticky", top: `${6 + i * 1.5}rem` }}>
                    <div role="list" className="w-dyn-items">
                      <div role="listitem" className="w-dyn-item">
                        <Link href={art.id ? `/artwork/${art.id}` : "/gallery"} className="case-study-link-wrap w-inline-block">
                          <div className="case-study-container">
                            <div className="case-study-bg-image" style={{ backgroundImage: `url(${art.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}>
                              <div className="case-study-overlay"></div>
                            </div>
                            <div className="case-study-thumbnail-wrap">
                              <div className="case-study-content-wrap">
                                <div className="case-study-content">
                                  <div className="case-study-text-item">
                                    <div className="case-study-text">(</div>
                                    <div className="case-study-text">{String(i + 1).padStart(2, "0")}</div>
                                  </div>
                                  <div className="doted-line"></div>
                                  <div className="case-study-text-item">
                                    <div className="case-study-text">{art.artistName}</div>
                                  </div>
                                  <div className="doted-line"></div>
                                  <div className="case-study-text-item">
                                    <div className="case-study-text">{art.title}</div>
                                    <div className="case-study-text">)</div>
                                  </div>
                                </div>
                                <div className="case-study-thumbnail-block">
                                  <img src={art.imageUrl} onError={handleArtworkImageError} alt={art.title} loading="lazy" className="case-study-thumbnail" />
                                </div>
                                <div className="view-wrapper">
                                  <div className="view-block">View</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Testimonials (rotating avatar circle + slider)
   ============================================================ */
function Bubble({ text }: { text: string }) {
  return (
    <div className="message-bubble-wrap">
      <p className="bubble-text">&quot;{text}&quot;</p>
      <div className="bubble-icon-block">
        <div className="bubble-icon w-embed">
          <svg width="16" height="9" viewBox="0 0 16 9" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M8.00451 7.76042L1.1459 2.09935C0.422777 1.50248 0.84483 0.328126 1.78247 0.328126L8.69231 0.328126L14.5199 0.328125C15.4199 0.328126 15.8618 1.42415 15.2135 2.04845L9.33471 7.70951C8.96866 8.06201 8.39643 8.08391 8.00451 7.76042Z" fill="#1C1839"></path>
          </svg>
        </div>
      </div>
    </div>
  );
}

function Testimonials({ avatars }: { avatars: RingArt[] }) {
  const [slide, setSlide] = useState(0);
  const a = (i: number) => avatars[i % avatars.length].imageUrl;
  const slides = useMemo(() => {
    const out: typeof TESTIMONIALS[] = [];
    for (let i = 0; i < TESTIMONIALS.length; i += 2) out.push(TESTIMONIALS.slice(i, i + 2));
    return out;
  }, []);

  return (
    <section className="section-home-testimonial">
      <div className="padding-global">
        <div className="container-medium">
          <div className="padding-section-large">
            <div className="content-wrapper">
              <div className="top-content">
                <div className="text-align-center">
                  <div className="subtitle text-color-alternate">Trusted by Our Community</div>
                  <div className="spacer-medium"></div>
                  <h2 className="heading-style-h2 text-color-alternate">What People <span className="text-color-grey text-[94px]">What Our Clients Say</span></h2>
                </div>
              </div>
              <div className="testimonial-component">
                <div className="testimonial-circle-wrap">
                  <div className="testimonial-container">
                    <div className="testimonial-circle-01">
                      {BUBBLES_OUTER.map((b, i) => (
                        <div className={`image-circle _${String(i + 1).padStart(2, "0")}`} key={b}>
                          <Bubble text={b} />
                          <img src={a(i)} onError={handleArtworkImageError} alt="Community" loading="lazy" className="testimonial-avatar" />
                        </div>
                      ))}
                    </div>
                    <div className="testimonial-circle-03">
                      {BUBBLES_INNER.map((b, i) => (
                        <div className={`inner-image-circle _${String(i + 1).padStart(2, "0")}`} key={b}>
                          <Bubble text={b} />
                          <img src={a(i + 4)} onError={handleArtworkImageError} alt="Community" loading="lazy" className="testimonial-avatar" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="testimonial-slider w-slider">
                  <div className="mask w-slider-mask">
                    <div className="testimonial-slide w-slide">
                      <div className="w-layout-grid slide-component-grid">
                        {slides[slide].map((t, idx) => (
                          <div className="testimonial-content-wrap" key={idx}>
                            <div className="w-layout-grid testimonials-inner-grid">
                              <div className="testimonial-content-item">
                                <ReviewStars />
                                <p className="testimonial-text">&quot;{t.quote}&quot;</p>
                              </div>
                              <div className="doted-line"></div>
                              <div className="testimonial-content-item">
                                <div className="client-info-block">
                                  <div className="text-weight-semibold">
                                    <div className="text-size-regular text-color-alternate">{t.name}</div>
                                  </div>
                                  <div className="text-size-small text-color-alternate">{t.role}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="left-arrow w-slider-arrow-left" onClick={() => setSlide((s) => (s - 1 + slides.length) % slides.length)} role="button" aria-label="Previous" data-testid="button-testimonial-prev">
                    <div className="arrow-wrap">‹</div>
                  </div>
                  <div className="right-arrow w-slider-arrow-right" onClick={() => setSlide((s) => (s + 1) % slides.length)} role="button" aria-label="Next" data-testid="button-testimonial-next">
                    <div className="arrow-wrap">›</div>
                  </div>
                  <div className="slide-nav w-slider-nav"></div>
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
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.8, 3.2]);
  return (
    <section ref={ref} className="call-to-action">
      <div className="call-to-action-wrapper">
        <div className="circle-container">
          <motion.div className="circle-wrapper" style={{ scale }}>
            <div className="circle-block cta-circle-block">
              {Array.from({ length: OUTER_COUNT }).map((_, i) => (
                <div key={i} className={`circle-item _${String(i + 1).padStart(2, "0")}`}>
                  <div className="circle-image-item">
                    <img src={at(i).imageUrl} onError={handleArtworkImageError} alt={at(i).title} loading="lazy" className="circle-image" />
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
            <h2 className="heading-style-h2 text-align-center">Let&rsquo;s Discover <span className="text-color-grey">Art</span></h2>
          </div>
          <div className="spacer-small"></div>
          <div className="max-width-medium align-center">
            <div className="text-size-regular text-align-center">Explore curated student artwork, place your bid, and support emerging artists and charity with every piece you collect.</div>
          </div>
          <div className="spacer-large"></div>
          <div className="button-wrap">
            <MainButton href="/gallery" label="Browse Gallery" />
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
                <div className="text-size-regular text-align-center">Student art auctions for a good cause.</div>
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
                    <span className="link-button"><div className="link-wrap"><div className="link-button-text">BrushBids</div></div></span>
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
        <Navbar />
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
          <CaseStudies items={ringArts} />
          <Testimonials avatars={ringArts} />
          <Pricing />
          <CallToAction ringArts={ringArts} />
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
