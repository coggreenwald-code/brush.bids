import { useEffect, useRef, useState, Suspense, useMemo, Component, ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, useTexture } from "@react-three/drei";
import { motion, AnimatePresence, useInView } from "framer-motion";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ============================================================
   PALETTE
   ============================================================ */
const C = {
  ink: "#0a0a14",
  ink2: "#0e0e1a",
  wall: "#1a1a24",
  cream: "#f0f0f6",
  warm: "#e0e0ec",
  accent: "#6c3ce0",
  accent2: "#3b82f6",
  muted: "#6b6b80",
  border: "rgba(240,240,246,0.08)",
  glowPurple: "rgba(108,60,224,0.15)",
  glowBlue: "rgba(59,130,246,0.12)",
  dim: "rgba(240,240,246,0.55)",
  textMuted: "rgba(240,240,246,0.4)",
};

const EASE = [0.25, 0.1, 0.25, 1] as const;
const REVEAL = {
  hidden: { opacity: 0, y: 50 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

/* ============================================================
   DATA
   ============================================================ */
const HERO_FRAMES = [
  { src: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1800&q=80&auto=format&fit=crop" },
  { src: "https://images.unsplash.com/photo-1575505586569-646b2ca898fc?w=1800&q=80&auto=format&fit=crop" },
  { src: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1800&q=80&auto=format&fit=crop" },
  { src: "https://images.unsplash.com/photo-1564399263809-d2e89a3280a6?w=1800&q=80&auto=format&fit=crop" },
  { src: "https://images.unsplash.com/photo-1577720643272-265f09367456?w=1800&q=80&auto=format&fit=crop" },
];

const AUCTIONS = [
  { id: 1, large: true, title: "Fractured Light Series IV", artist: "Maya Ashby", medium: "Oil on canvas, 36×48\"", bid: "$4,800", left: "2h 14m", badge: { label: "✦ CURATOR'S PICK", bg: C.accent2, fg: C.ink }, image: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=900&q=80&auto=format&fit=crop" },
  { id: 2, title: "Urban Dusk", artist: "Taro Nakamura", medium: "Acrylic, 24×24\"", bid: "$2,100", left: "5h 30m", image: "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?w=700&q=80&auto=format&fit=crop" },
  { id: 3, title: "Gold & Ash No. 3", artist: "Priya Delacroix", medium: "Mixed media, 20×30\"", bid: "$1,350", left: "1d 2h", badge: { label: "✦ NEW ARTIST", bg: C.accent, fg: "#fff" }, image: "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=700&q=80&auto=format&fit=crop" },
  { id: 4, title: "Still Life No. 7", artist: "René Brandt", medium: "Watercolor, 18×24\"", bid: "$1,750", left: "3d 6h", image: "https://images.unsplash.com/photo-1530968033775-2c92736b131e?w=700&q=80&auto=format&fit=crop" },
  { id: 5, title: "Layers III", artist: "Kofi Osei", medium: "Oil pastel, 30×40\"", bid: "$6,500", left: "12h 45m", image: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=700&q=80&auto=format&fit=crop" },
];

/* ============================================================
   ERROR BOUNDARY
   ============================================================ */
class GLBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { err: boolean }> {
  state = { err: false };
  static getDerivedStateFromError() { return { err: true }; }
  componentDidCatch(e: Error) { console.warn("3D scene fallback:", e.message); }
  render() { return this.state.err ? this.props.fallback : this.props.children; }
}

/* ============================================================
   CUSTOM CURSOR
   ============================================================ */
function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: -100, y: -100 });
  const pos = useRef({ x: -100, y: -100 });
  const stateRef = useRef<"default" | "hover">("default");
  const clickingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("ontouchstart" in window || window.matchMedia("(pointer: coarse)").matches) return;

    document.body.classList.add("bb-cursor-none");

    let last = 0;
    const onMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - last < 16) return;
      last = now;
      target.current.x = e.clientX;
      target.current.y = e.clientY;
    };

    const setHover = (h: boolean) => {
      if (!cursorRef.current) return;
      stateRef.current = h ? "hover" : "default";
      cursorRef.current.dataset.state = stateRef.current;
    };

    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t || !t.closest) return;
      const interactive = !!t.closest('a, button, [role="button"], input, select, textarea, [data-cursor-hover]')
        || document.body.classList.contains("bb-cursor-force-hover");
      setHover(interactive);
    };
    const onForce = () => setHover(document.body.classList.contains("bb-cursor-force-hover"));
    const observer = new MutationObserver(onForce);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    const onDown = () => {
      clickingRef.current = true;
      if (cursorRef.current) cursorRef.current.dataset.click = "1";
      setTimeout(() => {
        clickingRef.current = false;
        if (cursorRef.current) cursorRef.current.dataset.click = "0";
      }, 150);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    window.addEventListener("mousedown", onDown);

    let raf = 0;
    const tick = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.15;
      pos.current.y += (target.current.y - pos.current.y) * 0.15;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      document.body.classList.remove("bb-cursor-none");
      document.body.classList.remove("bb-cursor-force-hover");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mousedown", onDown);
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <style>{`
        .bb-cursor-none, .bb-cursor-none * { cursor: none !important; }
        @media (pointer: coarse) { .bb-cursor { display: none !important; } }
        .bb-cursor {
          position: fixed; left: 0; top: 0;
          width: 20px; height: 20px;
          pointer-events: none; z-index: 9999;
          mix-blend-mode: difference;
          will-change: transform;
        }
        .bb-cursor .bb-c-circle {
          position: absolute; inset: 0; border-radius: 999px;
          border: 1px solid rgba(240,240,246,0.6); background: transparent;
          transition: width 0.25s ease, height 0.25s ease, top 0.25s, left 0.25s, background-color 0.25s, border-color 0.25s, transform 0.15s;
          width: 100%; height: 100%; top: 0; left: 0;
        }
        .bb-cursor .bb-c-line { position: absolute; background: rgba(240,240,246,0.55); transition: opacity 0.25s ease; }
        .bb-cursor .bb-c-line.h { top: 50%; left: -16px; right: -16px; height: 1px; transform: translateY(-50%); }
        .bb-cursor .bb-c-line.v { left: 50%; top: -16px; bottom: -16px; width: 1px; transform: translateX(-50%); }
        .bb-cursor[data-state="hover"] .bb-c-circle {
          width: 48px; height: 48px; top: -14px; left: -14px;
          background-color: rgba(108,60,224,0.15);
          border-color: rgba(240,240,246,0.85);
        }
        .bb-cursor[data-state="hover"] .bb-c-line { opacity: 0; }
        .bb-cursor[data-click="1"] .bb-c-circle { transform: scale(0.85); }
      `}</style>
      <div ref={cursorRef} className="bb-cursor" data-state="default" data-click="0">
        <span className="bb-c-line h" />
        <span className="bb-c-line v" />
        <span className="bb-c-circle" />
      </div>
    </>
  );
}

/* ============================================================
   NAV
   ============================================================ */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Auctions", href: "#auctions" },
    { label: "How It Works", href: "#process" },
    { label: "Artists", href: "#artists" },
    { label: "About", href: "#about" },
  ];

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: `rgba(10,10,20,${scrolled ? 0.95 : 0.85})`,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: `1px solid ${C.border}`,
          paddingTop: scrolled ? 12 : 20,
          paddingBottom: scrolled ? 12 : 20,
          transition: "padding 0.3s ease, background 0.3s ease",
        }}
        data-testid="nav"
      >
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 flex items-center justify-between">
          <a href="/home-v2" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: "0.02em" }} data-testid="nav-logo">
            <span style={{ color: C.cream }}>Brush</span>
            <span style={{ color: C.accent }}>Bids</span>
          </a>

          <div className="hidden md:flex items-center" style={{ gap: 0 }}>
            {links.map((l, i) => (
              <span key={l.label} className="flex items-center">
                <a
                  href={l.href}
                  className="uppercase transition-colors"
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: "0.08em", color: C.dim, fontWeight: 500, padding: "0 14px" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = C.cream)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = C.dim)}
                  data-testid={`nav-link-${l.label.toLowerCase().replace(/\s/g, "-")}`}
                >
                  {l.label}
                </a>
                {i < links.length - 1 && <span style={{ color: C.accent, fontSize: 10 }}>✦</span>}
              </span>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <a
              href="/auth"
              style={{ padding: "10px 18px", border: `1px solid rgba(240,240,246,0.3)`, color: C.cream, fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: "0.08em", fontWeight: 500, textTransform: "uppercase", transition: "all 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.cream; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(240,240,246,0.3)"; }}
              data-testid="button-login"
            >
              Log In
            </a>
            <a
              href="/auth"
              style={{ padding: "10px 18px", background: C.accent, color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: "0.08em", fontWeight: 500, textTransform: "uppercase", transition: "all 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 0 30px ${C.glowPurple}`; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
              data-testid="button-start-bidding"
            >
              Start Bidding
            </a>
          </div>

          <button className="md:hidden" onClick={() => setOpen(true)} style={{ color: C.cream, padding: 8 }} aria-label="Menu" data-testid="button-mobile-menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 8h18M3 16h18" /></svg>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[60] md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} style={{ background: "rgba(10,10,20,0.9)", backdropFilter: "blur(8px)" }} onClick={() => setOpen(false)}>
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease: EASE }}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-0 right-0 bottom-0 w-[82%] max-w-[340px] flex flex-col gap-6 p-8"
              style={{ background: C.ink, borderLeft: `1px solid ${C.border}` }}
              data-testid="mobile-menu"
            >
              <button onClick={() => setOpen(false)} className="self-end" style={{ color: C.cream, padding: 8 }} aria-label="Close">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 6l12 12M6 18L18 6" /></svg>
              </button>
              {links.map((l) => (
                <a key={l.label} href={l.href} onClick={() => setOpen(false)} className="uppercase flex items-center gap-3" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, letterSpacing: "0.08em", color: C.cream, fontWeight: 500 }}>
                  <span style={{ color: C.accent, fontSize: 11 }}>✦</span>
                  {l.label}
                </a>
              ))}
              <a href="/auth" style={{ marginTop: 12, padding: "14px 18px", background: C.accent, color: "#fff", textAlign: "center", fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: "0.08em", fontWeight: 500, textTransform: "uppercase" }}>
                Start Bidding
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ============================================================
   ROTATING CIRCULAR TEXT (hero corner)
   ============================================================ */
function RotatingMark({ visible }: { visible: boolean }) {
  const text = "BRUSHBIDS ✦ CURATED ART ✦ LIVE AUCTIONS ✦ ";
  return (
    <div
      className="pointer-events-none"
      style={{
        position: "absolute",
        right: 32,
        bottom: 32,
        width: 110,
        height: 110,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.6s ease",
      }}
    >
      <svg viewBox="0 0 110 110" width="110" height="110" style={{ animation: "bb-spin 8s linear infinite" }}>
        <defs>
          <path id="bb-circle" d="M 55,55 m -42,0 a 42,42 0 1,1 84,0 a 42,42 0 1,1 -84,0" />
        </defs>
        <text fontFamily="'DM Sans', sans-serif" fontSize="10" fontWeight="500" fill={C.dim} letterSpacing="2">
          <textPath href="#bb-circle">{text + text}</textPath>
        </text>
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: C.accent, fontSize: 14 }}>✦</div>
    </div>
  );
}

/* ============================================================
   HERO PHASE 1 — Pinned scroll sequence
   ============================================================ */
function HeroPhase1() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const frameRefs = useRef<(HTMLDivElement | null)[]>([]);
  const text1Ref = useRef<HTMLDivElement>(null);
  const text3Ref = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const progressMarkRef = useRef<HTMLDivElement>(null);
  const progressWrapRef = useRef<HTMLDivElement>(null);
  const rotMarkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wrapRef.current || !pinRef.current) return;
    const ctx = gsap.context(() => {
      frameRefs.current.forEach((el, i) => {
        if (!el) return;
        gsap.set(el, { opacity: i === 0 ? 1 : 0, scale: 1 });
      });

      // Master pinned timeline
      gsap.timeline({
        scrollTrigger: {
          trigger: wrapRef.current!,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          pin: pinRef.current!,
          pinSpacing: false,
        },
      }).addLabel("a");

      // Per-frame ranges (0..1)
      const ranges = [
        { start: 0.00, end: 0.20 },
        { start: 0.20, end: 0.40 },
        { start: 0.40, end: 0.55 },
        { start: 0.55, end: 0.70 },
        { start: 0.70, end: 0.90 },
      ];

      ranges.forEach((r, i) => {
        const el = frameRefs.current[i];
        if (!el) return;
        const dur = r.end - r.start;
        // Ken Burns zoom across full range
        gsap.fromTo(el, { scale: 1 }, {
          scale: 1.04, ease: "none",
          scrollTrigger: { trigger: wrapRef.current!, start: `${r.start * 100}% top`, end: `${r.end * 100}% top`, scrub: 0.6 },
        });
        // Fade in (skip 0 — already opacity 1)
        if (i > 0) {
          gsap.fromTo(el, { opacity: 0 }, {
            opacity: 1, ease: "none",
            scrollTrigger: { trigger: wrapRef.current!, start: `${(r.start - 0.04) * 100}% top`, end: `${r.start * 100}% top`, scrub: 0.5 },
          });
        }
        // Fade out (skip last — handled separately)
        if (i < ranges.length - 1) {
          gsap.fromTo(el, { opacity: 1 }, {
            opacity: 0, ease: "none",
            scrollTrigger: { trigger: wrapRef.current!, start: `${(r.end - 0.04) * 100}% top`, end: `${r.end * 100}% top`, scrub: 0.5 },
          });
        }
      });

      // Frame 5 fades to ink at the very end
      const last = frameRefs.current[4];
      if (last) {
        gsap.to(last, {
          opacity: 0, ease: "none",
          scrollTrigger: { trigger: wrapRef.current!, start: "90% top", end: "98% top", scrub: 0.5 },
        });
      }

      // Frame 1 text (fade in 5% → fade out 18%)
      if (text1Ref.current) {
        gsap.fromTo(text1Ref.current, { opacity: 0 }, {
          opacity: 1, ease: "none",
          scrollTrigger: { trigger: wrapRef.current!, start: "5% top", end: "10% top", scrub: 0.4 },
        });
        gsap.to(text1Ref.current, {
          opacity: 0, ease: "none",
          scrollTrigger: { trigger: wrapRef.current!, start: "15% top", end: "20% top", scrub: 0.4 },
        });
      }
      // Frame 3 text
      if (text3Ref.current) {
        gsap.fromTo(text3Ref.current, { opacity: 0 }, {
          opacity: 1, ease: "none",
          scrollTrigger: { trigger: wrapRef.current!, start: "44% top", end: "50% top", scrub: 0.4 },
        });
        gsap.to(text3Ref.current, {
          opacity: 0, ease: "none",
          scrollTrigger: { trigger: wrapRef.current!, start: "53% top", end: "56% top", scrub: 0.4 },
        });
      }

      // Progress indicator
      if (progressRef.current) {
        gsap.to(progressRef.current, {
          scaleY: 1, transformOrigin: "top", ease: "none",
          scrollTrigger: { trigger: wrapRef.current!, start: "top top", end: "bottom bottom", scrub: true },
        });
      }
      if (progressMarkRef.current) {
        gsap.to(progressMarkRef.current, {
          top: "100%", ease: "none",
          scrollTrigger: { trigger: wrapRef.current!, start: "top top", end: "bottom bottom", scrub: true },
        });
      }
      if (progressWrapRef.current) {
        gsap.to(progressWrapRef.current, {
          opacity: 0, ease: "none",
          scrollTrigger: { trigger: wrapRef.current!, start: "88% top", end: "95% top", scrub: 0.4 },
        });
      }

      // Rotating mark visibility
      if (rotMarkRef.current) {
        gsap.fromTo(rotMarkRef.current, { opacity: 0 }, {
          opacity: 1, ease: "none",
          scrollTrigger: { trigger: wrapRef.current!, start: "8% top", end: "12% top", scrub: 0.4 },
        });
        gsap.to(rotMarkRef.current, {
          opacity: 0, ease: "none",
          scrollTrigger: { trigger: wrapRef.current!, start: "82% top", end: "88% top", scrub: 0.4 },
        });
      }
    }, wrapRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={wrapRef} style={{ height: "500vh", position: "relative" }} data-testid="hero-phase1">
      <style>{`@keyframes bb-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div ref={pinRef} className="w-full overflow-hidden relative" style={{ height: "100vh", background: C.ink }}>
        {HERO_FRAMES.map((f, i) => (
          <div key={i} ref={(el) => (frameRefs.current[i] = el)} className="absolute inset-0 w-full h-full" style={{ willChange: "opacity, transform" }}>
            <img src={f.src} alt="" loading={i === 0 ? "eager" : "lazy"} className="w-full h-full object-cover" />
            {i === 3 && (
              <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(10,10,20,0.6) 100%)" }} />
            )}
          </div>
        ))}

        {/* Frame 1 text */}
        <div ref={text1Ref} className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none" style={{ opacity: 0 }}>
          <div style={{ position: "relative", padding: "40px 32px" }}>
            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(10,10,20,0.55) 0%, transparent 75%)" }} />
            <div style={{ position: "relative" }}>
              <div style={{ color: C.accent, fontSize: 24, marginBottom: 14 }}>✦</div>
              <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(52px, 7vw, 90px)", color: C.cream, letterSpacing: "0.02em", lineHeight: 1, margin: 0 }}>
                WHERE ART FINDS
              </h1>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontSize: "clamp(40px, 5.5vw, 72px)", color: C.accent, lineHeight: 1.1, marginTop: 6 }}>
                its next home
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, fontSize: 16, color: C.dim, marginTop: 20 }}>
                Curator-approved student art auctions
              </p>
            </div>
          </div>
        </div>

        {/* Frame 3 text */}
        <div ref={text3Ref} className="absolute bottom-20 left-0 right-0 text-center pointer-events-none" style={{ opacity: 0 }}>
          <span style={{ color: C.accent2, fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", fontWeight: 500 }}>
            STEP INSIDE ✦
          </span>
        </div>

        {/* Progress indicator */}
        <div ref={progressWrapRef} className="absolute right-8" style={{ top: "20vh", height: "60vh", width: 2, background: "rgba(240,240,246,0.08)" }}>
          <div ref={progressRef} className="w-full h-full" style={{ background: C.accent, transform: "scaleY(0)", transformOrigin: "top" }} />
          <div ref={progressMarkRef} className="absolute" style={{ left: "50%", top: 0, transform: "translate(-50%, -50%)", color: C.accent, fontSize: 12 }}>✦</div>
        </div>

        {/* Rotating circular mark */}
        <div ref={rotMarkRef} style={{ opacity: 0 }}>
          <RotatingMark visible={true} />
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   HERO PHASE 2 — 3D Gallery Wall
   ============================================================ */
const PAINTINGS = [
  { id: "p1", pos: [0, 0.2, 0] as [number, number, number], size: [2.8, 3.6] as [number, number], texture: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=700&q=80&auto=format&fit=crop", title: "Fractured Light Series IV", artist: "Maya Ashby", bid: "$4,800", badge: "✦ CURATOR'S PICK" },
  { id: "p2", pos: [-3.6, 1.4, 0] as [number, number, number], size: [1.8, 2.3] as [number, number], texture: "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?w=600&q=80&auto=format&fit=crop", title: "Urban Dusk", artist: "Taro Nakamura", bid: "$2,100" },
  { id: "p3", pos: [3.6, -1.2, 0] as [number, number, number], size: [1.8, 2.3] as [number, number], texture: "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=600&q=80&auto=format&fit=crop", title: "Gold & Ash No. 3", artist: "Priya Delacroix", bid: "$1,350", badge: "✦ NEW ARTIST" },
  { id: "p4", pos: [-5.8, -0.4, 0] as [number, number, number], size: [1.3, 1.7] as [number, number], texture: "https://images.unsplash.com/photo-1530968033775-2c92736b131e?w=500&q=80&auto=format&fit=crop", title: "Still Life No. 7", artist: "René Brandt", bid: "$1,750" },
  { id: "p5", pos: [5.8, 0.8, 0] as [number, number, number], size: [1.3, 1.7] as [number, number], texture: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=500&q=80&auto=format&fit=crop", title: "Layers III", artist: "Kofi Osei", bid: "$6,500" },
];

function Painting({ data, onHover }: { data: (typeof PAINTINGS)[number]; onHover: (h: boolean) => void }) {
  const ref = useRef<THREE.Group>(null);
  const [hov, setHov] = useState(false);
  const tex = useTexture(data.texture);

  useFrame(() => {
    if (!ref.current) return;
    const z = hov ? 0.3 : 0;
    ref.current.position.z += (z - ref.current.position.z) * 0.12;
  });

  const [w, h] = data.size;
  const depth = 0.06;
  const border = 0.12;

  return (
    <group
      ref={ref}
      position={data.pos}
      onPointerOver={(e) => { e.stopPropagation(); setHov(true); onHover(true); if (typeof document !== "undefined") document.body.classList.add("bb-cursor-force-hover"); }}
      onPointerOut={() => { setHov(false); onHover(false); if (typeof document !== "undefined") document.body.classList.remove("bb-cursor-force-hover"); }}
    >
      {hov && (
        <mesh position={[0, 0, -0.05]}>
          <planeGeometry args={[w + 0.7, h + 0.7]} />
          <meshBasicMaterial color={C.accent} transparent opacity={0.35} />
        </mesh>
      )}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, depth]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0, depth / 2 + 0.001]}>
        <planeGeometry args={[w - border * 2, h - border * 2]} />
        <meshStandardMaterial map={tex} roughness={0.85} />
      </mesh>

      {hov && (
        <Html position={[0, -h / 2 - 0.5, 0]} center distanceFactor={7} style={{ pointerEvents: "none", width: 260 }}>
          <div style={{ background: "rgba(10,10,20,0.92)", backdropFilter: "blur(8px)", padding: "14px 16px", border: `1px solid ${C.border}`, color: C.cream, textAlign: "center" }}>
            {data.badge && (
              <div style={{ display: "inline-block", background: C.accent, color: "#fff", padding: "3px 8px", fontFamily: "'DM Sans', sans-serif", fontSize: 9, letterSpacing: "0.14em", marginBottom: 8 }}>{data.badge}</div>
            )}
            <div style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontSize: 20 }}>{data.title}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.dim, marginTop: 4 }}>{data.artist}</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: C.accent2, marginTop: 6, letterSpacing: "0.02em" }}>{data.bid}</div>
            <div style={{ marginTop: 10, padding: "8px 12px", background: C.accent, color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500 }}>
              Place Bid →
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function GalleryScene() {
  const mouse = useRef({ x: 0, y: 0 });
  const { camera } = useThree();

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame(() => {
    const maxRad = (2 * Math.PI) / 180;
    const tY = mouse.current.x * maxRad;
    const tX = -mouse.current.y * maxRad;
    camera.rotation.y += (tY - camera.rotation.y) * 0.05;
    camera.rotation.x += (tX - camera.rotation.x) * 0.05;
  });

  return (
    <>
      <ambientLight intensity={0.3} />
      <spotLight position={[-5, 6, 6]} angle={0.5} penumbra={0.6} intensity={0.7} castShadow color={C.cream} />
      <spotLight position={[5, 6, 6]} angle={0.5} penumbra={0.6} intensity={0.7} castShadow color={C.cream} />

      {/* Dark gallery wall */}
      <mesh position={[0, 0, -1.5]} receiveShadow>
        <planeGeometry args={[30, 14]} />
        <meshStandardMaterial color={C.wall} roughness={0.9} />
      </mesh>
      {/* Reflective dark floor */}
      <mesh position={[0, -4, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 20]} />
        <meshStandardMaterial color={C.ink} roughness={0.15} metalness={0.5} />
      </mesh>

      {PAINTINGS.map((p) => (
        <Painting key={p.id} data={p} onHover={() => {}} />
      ))}
    </>
  );
}

function Gallery3DFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: C.ink }}>
      <div style={{ animation: "bb-pulse 1.5s ease-in-out infinite", color: C.accent, fontSize: 48 }}>✦</div>
      <style>{`@keyframes bb-pulse { 0%,100%{ transform: scale(1); opacity: 0.6;} 50%{ transform: scale(1.2); opacity: 1;} }`}</style>
    </div>
  );
}

function MobileGalleryGrid() {
  return (
    <div className="grid grid-cols-2 gap-[2px] p-2" style={{ background: C.ink }}>
      {PAINTINGS.map((p) => (
        <div key={p.id} className="relative overflow-hidden" style={{ aspectRatio: "3/4", background: C.wall }}>
          <img src={p.texture} alt={p.title} loading="lazy" className="w-full h-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 p-3" style={{ background: "linear-gradient(to top, rgba(10,10,20,0.95), transparent)" }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontSize: 14, color: C.cream, lineHeight: 1.2 }}>{p.title}</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: C.accent2, marginTop: 4 }}>{p.bid}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function HeroPhase2({ isMobile }: { isMobile: boolean }) {
  return (
    <section className="w-full relative" style={{ background: C.ink, height: isMobile ? "auto" : "80vh", minHeight: isMobile ? "auto" : 600 }} data-testid="hero-phase2">
      {isMobile ? (
        <MobileGalleryGrid />
      ) : (
        <GLBoundary fallback={<MobileGalleryGrid />}>
          <Suspense fallback={<Gallery3DFallback />}>
            <Canvas shadows dpr={[1, 1.75]} camera={{ position: [0, 0, 7], fov: 50 }} gl={{ alpha: false, antialias: true }} style={{ background: C.ink }}>
              <Suspense fallback={null}>
                <GalleryScene />
              </Suspense>
            </Canvas>
          </Suspense>
        </GLBoundary>
      )}
    </section>
  );
}

/* ============================================================
   STATS + SOCIAL PROOF
   ============================================================ */
function CountUp({ to, prefix = "", suffix = "" }: { to: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const dur = 1500;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(to * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);

  const format = (v: number) => {
    if (to >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (to >= 1000) return `${(v / 1000).toFixed(1)}K`;
    return Math.round(v).toLocaleString();
  };

  return <span ref={ref}>{prefix}{format(val)}{suffix}</span>;
}

function StatsSection() {
  const avatars = [
    { c: C.accent, i: "M" },
    { c: C.accent2, i: "K" },
    { c: "#5b3aa5", i: "T" },
    { c: "#2563eb", i: "R" },
    { c: C.accent, i: "P" },
  ];
  return (
    <section style={{ background: C.ink, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: "70px 0" }} data-testid="stats-section">
      <div className="max-w-[1440px] mx-auto px-6 md:px-10">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} variants={{ show: { transition: { staggerChildren: 0.12 } } }} className="grid grid-cols-3">
          {[
            { num: 2400, prefix: "", suffix: "", label: "Active Bidders" },
            { num: 840, prefix: "", suffix: "+", label: "Student Artists" },
            { num: 1200000, prefix: "$", suffix: "", label: "Art Sold to Date" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              variants={REVEAL}
              className="text-center"
              style={{ borderLeft: i > 0 ? `1px solid ${C.border}` : "none", padding: "12px 18px" }}
            >
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(36px, 5vw, 52px)", color: C.cream, letterSpacing: "0.02em", lineHeight: 1 }}>
                <CountUp to={s.num} prefix={s.prefix} suffix={s.suffix} />
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "0.2em", color: C.dim, textTransform: "uppercase", marginTop: 12, fontWeight: 500 }}>
                {s.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={REVEAL} className="flex items-center justify-center gap-4 mt-14 flex-wrap">
          <div className="flex">
            {avatars.map((a, i) => (
              <div key={i} style={{ width: 40, height: 40, borderRadius: 999, background: a.c, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, marginLeft: i === 0 ? 0 : -8, border: `2px solid ${C.ink}` }}>
                {a.i}
              </div>
            ))}
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.textMuted }}>
            <span style={{ color: C.accent2, marginRight: 8 }}>✦</span>
            Loved by collectors and student artists worldwide
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================
   TICKER (purple bg)
   ============================================================ */
function Ticker() {
  const items = useMemo(() => [
    "Crimson Flow by M. Ashby — $4,800",
    "Urban Dusk by T. Nakamura — $2,100",
    "Layers III by C. Osei — $6,500",
    "Still Life No. 7 by R. Brandt — $1,750",
    "10% OF EVERY SALE → CHARITY",
  ], []);

  const row = (k: string) => (
    <div key={k} className="flex items-center shrink-0">
      {items.map((it, i) => (
        <span key={i} className="flex items-center shrink-0" style={{ paddingRight: 32 }}>
          <span style={{ color: C.accent2, fontSize: 14, marginRight: 16 }}>✦</span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>{it}</span>
        </span>
      ))}
    </div>
  );

  return (
    <section style={{ background: C.accent, padding: "16px 0", overflow: "hidden" }} data-testid="ticker">
      <style>{`
        @keyframes bb-marquee { from { transform: translateX(0); } to { transform: translateX(-33.333%); } }
        .bb-marquee-track { animation: bb-marquee 24s linear infinite; }
        @media (max-width: 767px) { .bb-marquee-track { animation-duration: 18s; } }
      `}</style>
      <div className="bb-marquee-track flex" style={{ width: "max-content" }}>
        {row("a")}{row("b")}{row("c")}
      </div>
    </section>
  );
}

/* ============================================================
   FEATURED AUCTIONS
   ============================================================ */
function TiltCard({ children, onMouseEnter, onMouseLeave }: { children: ReactNode; onMouseEnter?: () => void; onMouseLeave?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const isTouchRef = useRef(false);
  const lastT = useRef(0);

  useEffect(() => { isTouchRef.current = "ontouchstart" in window; }, []);

  const onMove = (e: React.MouseEvent) => {
    if (isTouchRef.current || !ref.current) return;
    const now = performance.now();
    if (now - lastT.current < 16) return;
    lastT.current = now;
    const r = ref.current.getBoundingClientRect();
    const cx = (e.clientX - r.left) / r.width - 0.5;
    const cy = (e.clientY - r.top) / r.height - 0.5;
    ref.current.style.transform = `perspective(800px) rotateX(${(-cy * 5).toFixed(2)}deg) rotateY(${(cx * 5).toFixed(2)}deg)`;
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg)";
    onMouseLeave?.();
  };

  return (
    <div
      ref={ref}
      className="w-full h-full"
      style={{ transition: "transform 0.4s ease, box-shadow 0.4s ease", willChange: "transform" }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onMouseEnter={onMouseEnter}
    >
      {children}
    </div>
  );
}

function AuctionCard({ a }: { a: (typeof AUCTIONS)[number] }) {
  const [hov, setHov] = useState(false);
  return (
    <TiltCard onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div
        className="relative overflow-hidden w-full h-full"
        data-cursor-hover
        style={{
          background: C.wall,
          minHeight: a.large ? 540 : 265,
          boxShadow: hov ? `0 0 40px ${C.glowPurple}` : "none",
          transition: "box-shadow 0.4s ease",
        }}
        data-testid={`card-auction-${a.id}`}
      >
        <img
          src={a.image}
          alt={a.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: hov ? 0.7 : 0.85,
            transform: hov ? "scale(1.06)" : "scale(1)",
            transition: "transform 0.7s cubic-bezier(0.25,0.1,0.25,1), opacity 0.5s ease",
          }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,10,20,0.95) 0%, rgba(10,10,20,0) 50%)" }} />
        {/* Top accent border */}
        <div className="absolute top-0 left-0 h-px" style={{ background: C.accent, width: hov ? "100%" : "0%", transition: "width 0.3s ease" }} />

        {a.badge && (
          <div className="absolute top-4 left-4" style={{ background: a.badge.bg, color: a.badge.fg, padding: "5px 9px", fontFamily: "'DM Sans', sans-serif", fontSize: 9, letterSpacing: "0.14em", fontWeight: 500 }}>
            {a.badge.label}
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
          <div style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", color: C.cream, fontSize: a.large ? 30 : 20, lineHeight: 1.15 }}>{a.title}</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, color: C.dim, fontSize: 13, marginTop: 4 }}>
            {a.artist} · {a.medium}
          </div>
          <div className="flex items-end justify-between mt-4">
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: a.large ? 32 : 24, color: C.cream, letterSpacing: "0.02em", lineHeight: 1 }}>{a.bid}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.accent2 }}>{a.left}</div>
          </div>
          <div className="overflow-hidden" style={{ maxHeight: hov ? 50 : 0, marginTop: hov ? 14 : 0, transition: "max-height 0.35s ease, margin-top 0.35s ease" }}>
            <a href="/gallery" className="block w-full text-center" style={{ background: C.accent, color: "#fff", padding: "10px 14px", fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "0.14em", fontWeight: 500, textTransform: "uppercase" }}>
              Place Bid →
            </a>
          </div>
        </div>
      </div>
    </TiltCard>
  );
}

function FeaturedAuctions() {
  return (
    <section id="auctions" style={{ background: C.ink, padding: "110px 0" }} data-testid="featured-auctions">
      <div className="max-w-[1440px] mx-auto px-6 md:px-10">
        <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: EASE }} className="h-px mb-8" style={{ background: C.border, transformOrigin: "left" }} />
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={REVEAL} className="flex items-end justify-between gap-6 flex-wrap mb-8">
          <div>
            <div style={{ color: C.accent2, fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 500, marginBottom: 14 }}>
              ✦ Ending Soon
            </div>
            <h2 style={{ margin: 0, lineHeight: 1 }}>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(46px, 6vw, 60px)", color: C.cream, letterSpacing: "0.01em" }}>Featured </span>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontSize: "clamp(36px, 5vw, 48px)", color: C.textMuted }}>lots</span>
            </h2>
          </div>
          <a href="/gallery" className="group" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.cream, borderBottom: `1px solid ${C.cream}`, paddingBottom: 4, transition: "color 0.2s" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = C.accent2; e.currentTarget.style.borderColor = C.accent2; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = C.cream; e.currentTarget.style.borderColor = C.cream; }}
          >
            View all auctions →
          </a>
        </motion.div>
        <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: EASE }} className="h-px mb-10" style={{ background: C.border, transformOrigin: "left" }} />

        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={{ show: { transition: { staggerChildren: 0.12 } } }} className="grid grid-cols-1 md:grid-cols-3 gap-[3px]" style={{ gridAutoRows: "265px" }}>
          {AUCTIONS.map((a) => (
            <motion.div key={a.id} variants={REVEAL} className={a.large ? "md:col-span-1 md:row-span-2" : ""}>
              <AuctionCard a={a} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================
   HOW IT WORKS
   ============================================================ */
const STEPS = [
  { n: "01", title: "Create your account", icon: "person", desc: "Sign up free in under two minutes. Verify your identity and add a payment method to start bidding immediately." },
  { n: "02", title: "Browse curated lots", icon: "search", desc: "Every artwork is reviewed and approved by our expert curators before listing. No fakes, no filler — only quality work." },
  { n: "03", title: "Place your bid", icon: "star", desc: "Your card is securely held — not charged — when you bid. If you're outbid, the hold releases instantly. Win and we charge at close." },
  { n: "04", title: "Own original art", icon: "check", desc: "Won the auction? Your payment processes automatically. The artist ships directly to you with a certificate of authenticity." },
];

function StepIcon({ name }: { name: string }) {
  const p = { stroke: "#fff", strokeWidth: 1.6, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "person") return (<svg viewBox="0 0 24 24" width="22" height="22" {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" /></svg>);
  if (name === "search") return (<svg viewBox="0 0 24 24" width="22" height="22" {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-5-5" /></svg>);
  if (name === "star") return (<svg viewBox="0 0 24 24" width="22" height="22" {...p}><path d="M12 2l3 6.9 7.6.6-5.8 5 1.8 7.4L12 17.8 5.4 21.9l1.8-7.4-5.8-5 7.6-.6L12 2z" /></svg>);
  return (<svg viewBox="0 0 24 24" width="22" height="22" {...p}><path d="M5 12l5 5L20 7" /></svg>);
}

function HowItWorks() {
  return (
    <section id="process" className="relative overflow-hidden" style={{ background: `linear-gradient(180deg, ${C.ink} 0%, ${C.ink2} 100%)`, padding: "120px 0" }} data-testid="how-it-works">
      <div className="absolute pointer-events-none select-none" style={{ top: "40%", right: "-2vw", transform: "translateY(-50%)", fontFamily: "'Bebas Neue', sans-serif", fontSize: 200, color: "rgba(240,240,246,0.015)", letterSpacing: "0.05em", whiteSpace: "nowrap" }} aria-hidden>
        PROCESS
      </div>

      <div className="max-w-[1440px] mx-auto px-6 md:px-10 relative">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={REVEAL} className="mb-12">
          <div style={{ color: C.accent, fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 500, marginBottom: 14 }}>
            ✦ Simple Process
          </div>
          <h2 style={{ margin: 0, lineHeight: 1 }}>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(46px, 6vw, 58px)", color: C.cream, letterSpacing: "0.01em" }}>How it </span>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontSize: "clamp(36px, 5vw, 48px)", color: C.textMuted }}>works</span>
          </h2>
        </motion.div>

        <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1.4, ease: EASE }} className="h-px mb-6" style={{ background: `linear-gradient(to right, ${C.accent}, ${C.accent2})`, transformOrigin: "left" }} />

        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} variants={{ show: { transition: { staggerChildren: 0.12 } } }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              variants={REVEAL}
              className="relative p-8 md:p-10 transition-all overflow-hidden"
              style={{ background: "rgba(240,240,246,0.03)", border: `1px solid ${C.border}`, minHeight: 250 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(240,240,246,0.06)"; e.currentTarget.style.borderColor = "rgba(108,60,224,0.2)"; e.currentTarget.style.boxShadow = `0 0 30px ${C.glowPurple}`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(240,240,246,0.03)"; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}
              data-testid={`step-${s.n}`}
            >
              <span className="absolute select-none pointer-events-none" style={{ right: 14, top: -8, fontFamily: "'Bebas Neue', sans-serif", fontSize: 90, color: "rgba(240,240,246,0.04)", letterSpacing: "0.02em", lineHeight: 1 }}>{s.n}</span>
              <div className="w-12 h-12 flex items-center justify-center mb-6" style={{ background: i % 2 === 0 ? C.accent : C.accent2 }}>
                <StepIcon name={s.icon} />
              </div>
              <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: C.cream, lineHeight: 1.2 }}>{s.title}</h3>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, fontSize: 14, color: C.dim, marginTop: 14, lineHeight: 1.75 }}>{s.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================
   CHARITY + ARTIST SPLIT
   ============================================================ */
function CharityArtistSplit() {
  return (
    <section id="artists" className="grid grid-cols-1 md:grid-cols-2" style={{ borderTop: `1px solid ${C.border}` }} data-testid="charity-artist-split">
      <motion.div
        initial="hidden" whileInView="show" viewport={{ once: true }} variants={REVEAL}
        className="flex flex-col justify-center"
        style={{ background: C.accent, padding: "80px 48px", minHeight: 420, borderRight: `1px solid ${C.border}` }}
      >
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>
          ✦ Our Mission
        </div>
        <h2 style={{ margin: "16px 0 0", lineHeight: 1.05 }}>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(36px, 5vw, 44px)", color: "#fff", letterSpacing: "0.01em" }}>10% OF EVERY SALE </span>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontSize: "clamp(28px, 4vw, 36px)", color: C.accent2 }}>goes to charity</span>
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, fontSize: 15, color: "rgba(255,255,255,0.75)", marginTop: 20, maxWidth: 520, lineHeight: 1.7 }}>
          Every purchase on BrushBids directly supports arts education. We believe creativity changes lives — and every bid proves it.
        </p>
        <a href="/about" className="inline-block mt-7 self-start" style={{ color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 13, borderBottom: "1px solid #fff", paddingBottom: 3, transition: "color 0.2s" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = C.accent2; e.currentTarget.style.borderColor = C.accent2; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#fff"; }}
        >
          Learn More →
        </a>
      </motion.div>

      <motion.div
        initial="hidden" whileInView="show" viewport={{ once: true }} variants={REVEAL}
        className="flex flex-col justify-center"
        style={{ background: C.ink2, padding: "80px 48px", minHeight: 420 }}
      >
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: C.accent2, fontWeight: 500 }}>
          ✦ For Artists
        </div>
        <h2 style={{ margin: "16px 0 0", lineHeight: 1.05 }}>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(36px, 5vw, 44px)", color: C.cream, letterSpacing: "0.01em" }}>SHARE YOUR WORK </span>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontSize: "clamp(28px, 4vw, 36px)", color: C.accent }}>Reach real collectors.</span>
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, fontSize: 15, color: C.dim, marginTop: 20, maxWidth: 520, lineHeight: 1.7 }}>
          Any artist can apply to list on BrushBids. Our curatorial team reviews every submission to ensure quality. No listing fees — we only earn when you do.
        </p>
        <a href="/submit-artwork" className="inline-block mt-7 self-start transition-all"
          style={{ background: "#fff", color: C.ink, padding: "14px 22px", fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500 }}
          onMouseEnter={(e) => { e.currentTarget.style.background = C.accent; e.currentTarget.style.color = "#fff"; e.currentTarget.style.boxShadow = `0 0 30px ${C.glowPurple}`; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = C.ink; e.currentTarget.style.boxShadow = "none"; }}
        >
          Apply as an Artist
        </a>
      </motion.div>
    </section>
  );
}

/* ============================================================
   FOOTER
   ============================================================ */
function SocialIcon({ name }: { name: string }) {
  const p = { fill: "currentColor" };
  if (name === "ig") return (<svg width="14" height="14" viewBox="0 0 24 24" {...p}><path d="M12 2.2c3.2 0 3.6 0 4.85.07 1.17.05 1.8.25 2.22.42.56.22.96.48 1.38.9.42.42.68.82.9 1.38.17.42.37 1.05.42 2.22C21.84 8.4 21.85 8.8 21.85 12s0 3.6-.07 4.85c-.05 1.17-.25 1.8-.42 2.22-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.17-1.05.37-2.22.42-1.25.06-1.65.07-4.85.07s-3.6 0-4.85-.07c-1.17-.05-1.8-.25-2.22-.42-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.17-.42-.37-1.05-.42-2.22C2.16 15.6 2.15 15.2 2.15 12s0-3.6.07-4.85c.05-1.17.25-1.8.42-2.22.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.17 1.05-.37 2.22-.42C8.4 2.2 8.8 2.2 12 2.2zM12 0C8.74 0 8.33 0 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.13 1.38S.93 3.35.63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.13.66.66 1.34 1.08 2.13 1.38.76.3 1.64.5 2.91.56C8.33 24 8.74 24 12 24s3.67 0 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.3 1.46-.72 2.13-1.38.66-.66 1.08-1.34 1.38-2.13.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.3-.79-.72-1.46-1.38-2.13C21.51 1.35 20.83.93 20.04.63 19.28.33 18.4.13 17.13.07 15.85.01 15.44 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zm0 10.16a4 4 0 110-8 4 4 0 010 8zm6.4-10.4a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z" /></svg>);
  if (name === "x") return (<svg width="13" height="13" viewBox="0 0 24 24" {...p}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.65l-5.208-6.84-5.96 6.84H1.7l7.73-8.834L1.27 2.25h6.815l4.71 6.231zM17.083 19.77h1.832L7.084 4.126H5.117z" /></svg>);
  if (name === "li") return (<svg width="14" height="14" viewBox="0 0 24 24" {...p}><path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-9h3v9zm-1.5-10.3a1.7 1.7 0 110-3.4 1.7 1.7 0 010 3.4zm12.5 10.3h-3v-4.5c0-1.1-.02-2.5-1.5-2.5s-1.75 1.2-1.75 2.4v4.6h-3v-9h2.9v1.2h.04c.4-.75 1.4-1.5 2.85-1.5 3 0 3.55 2 3.55 4.5v4.8z" /></svg>);
  return (<svg width="14" height="14" viewBox="0 0 24 24" {...p}><path d="M19.6 6.32a4.83 4.83 0 01-3.77-2.65V3h-3.4v13.67a2.89 2.89 0 11-2.05-2.77V10.4a6.27 6.27 0 105.45 6.21v-6.92a8.16 8.16 0 003.77.92z" /></svg>);
}

function Footer() {
  const cols = [
    { title: "Marketplace", links: ["Browse auctions", "Ending soon", "New listings", "Categories"] },
    { title: "Artists", links: ["Apply to list", "How payouts work", "Curation standards", "Artist FAQ"] },
    { title: "Company", links: ["About BrushBids", "Our curators", "Contact", "Press"] },
  ];

  return (
    <footer id="about" style={{ background: C.ink, borderTop: `1px solid ${C.border}`, padding: "72px 24px 32px" }} data-testid="footer">
      <div className="max-w-[1440px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2 md:col-span-1">
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: "0.02em" }}>
            <span style={{ color: C.cream }}>Brush</span>
            <span style={{ color: C.accent }}>Bids</span>
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, fontSize: 14, color: C.textMuted, marginTop: 14, lineHeight: 1.7, maxWidth: 280 }}>
            A curator-approved marketplace for original student art. Every piece vetted. Every bid secured.
          </p>
          <div className="flex gap-3 mt-6">
            {["ig", "x", "li", "tt"].map((s) => (
              <a key={s} href="#" aria-label={s} style={{ width: 32, height: 32, borderRadius: 999, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.dim, transition: "all 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.cream; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.dim; }}
              >
                <SocialIcon name={s} />
              </a>
            ))}
          </div>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "0.14em", color: C.textMuted, textTransform: "uppercase", fontWeight: 500, marginBottom: 20 }}>{c.title}</div>
            <ul className="flex flex-col gap-3">
              {c.links.map((l) => (
                <li key={l}>
                  <a href="#" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.dim, transition: "color 0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = C.cream)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = C.dim)}
                  >{l}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="max-w-[1440px] mx-auto mt-14 pt-7 flex flex-col md:flex-row md:items-center md:justify-between gap-4" style={{ borderTop: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.textMuted }}>
          © 2026 BrushBids <span style={{ color: C.accent, margin: "0 6px" }}>✦</span> All rights reserved.
        </div>
        <div className="flex gap-2 items-center">
          {["Privacy", "Terms", "Cookie Policy"].map((l, i) => (
            <span key={l} className="flex items-center">
              <a href="#" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.textMuted, transition: "color 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.cream)}
                onMouseLeave={(e) => (e.currentTarget.style.color = C.textMuted)}
              >{l}</a>
              {i < 2 && <span style={{ color: C.accent, margin: "0 8px", fontSize: 10 }}>✦</span>}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}

/* ============================================================
   PAGE
   ============================================================ */
export default function HomeV2() {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", h);
    return () => mql.removeEventListener("change", h);
  }, []);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => { document.documentElement.style.scrollBehavior = ""; };
  }, []);

  return (
    <div style={{ background: C.ink, color: C.cream, fontFamily: "'DM Sans', sans-serif" }} data-testid="home-v2">
      <CustomCursor />
      <Nav />
      <HeroPhase1 />
      <HeroPhase2 isMobile={isMobile} />
      <StatsSection />
      <Ticker />
      <FeaturedAuctions />
      <HowItWorks />
      <CharityArtistSplit />
      <Footer />
    </div>
  );
}
