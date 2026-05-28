import { useEffect, useRef, useState, Suspense, useMemo, Component, ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, useTexture } from "@react-three/drei";
import { motion, useMotionValue, animate as fmAnimate, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const C = {
  ink: "#0a0a14",
  cream: "#f0f0f6",
  warm: "#e0e0ec",
  accent: "#6c3ce0",
  accent2: "#3b82f6",
  muted: "#6b6b80",
  border: "rgba(10,10,20,0.10)",
  glowPurple: "rgba(108,60,224,0.15)",
  glowBlue: "rgba(59,130,246,0.15)",
};

/* ============================================================
   HERO IMAGES + ARTWORKS DATA
   ============================================================ */
const HERO_FRAMES = [
  { src: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1600&q=80&auto=format&fit=crop" },
  { src: "https://images.unsplash.com/photo-1575505586569-646b2ca898fc?w=1600&q=80&auto=format&fit=crop" },
  { src: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1600&q=80&auto=format&fit=crop" },
  { src: "https://images.unsplash.com/photo-1564399263809-d2e89a3280a6?w=1600&q=80&auto=format&fit=crop" },
  { src: "https://images.unsplash.com/photo-1577720643272-265f09367456?w=1600&q=80&auto=format&fit=crop" },
];

const AUCTIONS = [
  { id: 1, title: "Fractured Light Series IV", artist: "Maya Ashby", medium: "Oil on canvas 36×48", bid: "$4,800", left: "2h 14m", badge: { label: "Curator's Pick", color: C.accent2 }, image: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&q=80&auto=format&fit=crop", large: true },
  { id: 2, title: "Urban Dusk", artist: "Taro Nakamura", medium: "Acrylic 24×24", bid: "$2,100", left: "5h 30m", image: "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?w=600&q=80&auto=format&fit=crop" },
  { id: 3, title: "Gold & Ash No. 3", artist: "Priya Delacroix", medium: "Mixed media 20×30", bid: "$1,350", left: "1d 2h", badge: { label: "New Artist", color: C.accent }, image: "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=600&q=80&auto=format&fit=crop" },
  { id: 4, title: "Still Life No. 7", artist: "Rene Brandt", medium: "Watercolor 18×24", bid: "$1,750", left: "3d 6h", image: "https://images.unsplash.com/photo-1530968033775-2c92736b131e?w=600&q=80&auto=format&fit=crop" },
  { id: 5, title: "Layers III", artist: "Kofi Osei", medium: "Oil pastel 30×40", bid: "$6,500", left: "12h 45m", image: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=600&q=80&auto=format&fit=crop" },
];

/* ============================================================
   ERROR BOUNDARY for 3D
   ============================================================ */
class GLBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { err: boolean }> {
  state = { err: false };
  static getDerivedStateFromError() { return { err: true }; }
  componentDidCatch(e: Error) { console.warn("3D scene fallback:", e.message); }
  render() { return this.state.err ? this.props.fallback : this.props.children; }
}

/* ============================================================
   NAV
   ============================================================ */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
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
      <motion.nav
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: "rgba(240,240,246,0.8)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: `1px solid ${C.border}`,
          paddingTop: scrolled ? 12 : 20,
          paddingBottom: scrolled ? 12 : 20,
          transition: "padding 0.3s ease",
        }}
        data-testid="nav"
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 flex items-center justify-between">
          <a
            href="/home-v2"
            style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: "0.02em" }}
            data-testid="nav-logo"
          >
            <span style={{ color: C.ink }}>Brush</span>
            <span style={{ color: C.accent }}>Bids</span>
          </a>

          <div className="hidden md:flex items-center gap-9">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="uppercase transition-colors"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  letterSpacing: "0.06em",
                  color: C.muted,
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.ink)}
                onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
                data-testid={`nav-link-${l.label.toLowerCase().replace(/\s/g, "-")}`}
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <a
              href="/auth"
              className="transition-all"
              style={{
                padding: "10px 18px",
                border: `1px solid ${C.ink}`,
                color: C.ink,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                letterSpacing: "0.06em",
                fontWeight: 500,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.ink; e.currentTarget.style.color = C.cream; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.ink; }}
              data-testid="button-login"
            >
              LOG IN
            </a>
            <a
              href="/auth"
              className="transition-all"
              style={{
                padding: "10px 18px",
                background: C.accent,
                color: "#fff",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                letterSpacing: "0.06em",
                fontWeight: 500,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#5a2cc0")}
              onMouseLeave={(e) => (e.currentTarget.style.background = C.accent)}
              data-testid="button-start-bidding"
            >
              START BIDDING
            </a>
          </div>

          <button
            className="md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            style={{ color: C.ink, padding: 8 }}
            aria-label="Menu"
            data-testid="button-mobile-menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-0 right-0 bottom-0 z-[60] w-[80%] max-w-[320px] md:hidden flex flex-col gap-6 p-8"
            style={{ background: C.cream, borderLeft: `1px solid ${C.border}` }}
            data-testid="mobile-menu"
          >
            <button onClick={() => setMenuOpen(false)} className="self-end" style={{ color: C.ink, padding: 8 }} aria-label="Close">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M6 18L18 6"/></svg>
            </button>
            {links.map((l) => (
              <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)} className="uppercase" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, letterSpacing: "0.08em", color: C.ink, fontWeight: 500 }}>
                {l.label}
              </a>
            ))}
            <a href="/auth" style={{ marginTop: 12, padding: "14px 18px", background: C.accent, color: "#fff", textAlign: "center", fontFamily: "'DM Sans', sans-serif", fontSize: 13, letterSpacing: "0.06em", fontWeight: 500 }}>
              START BIDDING
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ============================================================
   HERO PHASE 1 — Scroll-pinned image sequence (GSAP)
   ============================================================ */
function HeroPhase1() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const frameRefs = useRef<(HTMLDivElement | null)[]>([]);
  const progressRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const text1Ref = useRef<HTMLDivElement>(null);
  const text3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wrapRef.current || !pinRef.current) return;
    const ctx = gsap.context(() => {
      // Initial states
      frameRefs.current.forEach((el, i) => {
        if (!el) return;
        gsap.set(el, { opacity: i === 0 ? 1 : 0, scale: 1 });
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapRef.current!,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.5,
          pin: pinRef.current!,
          pinSpacing: false,
        },
      });

      // Define ranges (out of 1.0 total scroll progress)
      // Each frame: [enter, full, exit] timing
      const ranges = [
        { in: 0.00, hold: 0.18, out: 0.22 },
        { in: 0.20, hold: 0.32, out: 0.42 },
        { in: 0.40, hold: 0.50, out: 0.58 },
        { in: 0.55, hold: 0.65, out: 0.72 },
        { in: 0.70, hold: 0.88, out: 0.92 },
      ];

      ranges.forEach((r, i) => {
        const el = frameRefs.current[i];
        if (!el) return;
        if (i > 0) tl.to(el, { opacity: 1, duration: r.in - (ranges[i - 1].out * 0.6) || 0.05, ease: "none" }, r.in);
        tl.to(el, { scale: 1.05, duration: r.hold - r.in + 0.1, ease: "none" }, r.in);
        if (i < ranges.length - 1) tl.to(el, { opacity: 0, duration: 0.08, ease: "none" }, r.out - 0.04);
      });

      // Final fade to ink at end
      tl.to(frameRefs.current[4], { opacity: 0, duration: 0.05, ease: "none" }, 0.93);

      // Text overlays
      if (text1Ref.current) {
        gsap.to(text1Ref.current, {
          opacity: 0,
          scrollTrigger: { trigger: wrapRef.current!, start: "top top", end: "20% top", scrub: true },
        });
      }
      if (text3Ref.current) {
        gsap.fromTo(text3Ref.current,
          { opacity: 0 },
          { opacity: 1, scrollTrigger: { trigger: wrapRef.current!, start: "42% top", end: "52% top", scrub: true } },
        );
        gsap.to(text3Ref.current, {
          opacity: 0,
          scrollTrigger: { trigger: wrapRef.current!, start: "55% top", end: "60% top", scrub: true },
        });
      }

      // Progress indicator height
      if (progressRef.current) {
        gsap.to(progressRef.current, {
          scaleY: 1,
          transformOrigin: "top",
          ease: "none",
          scrollTrigger: { trigger: wrapRef.current!, start: "top top", end: "bottom bottom", scrub: true },
        });
      }
      // Fade out indicator near end
      if (indicatorRef.current) {
        gsap.to(indicatorRef.current, {
          opacity: 0,
          scrollTrigger: { trigger: wrapRef.current!, start: "85% top", end: "95% top", scrub: true },
        });
      }
    }, wrapRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={wrapRef} style={{ height: "400vh", position: "relative" }} data-testid="hero-phase1">
      <div ref={pinRef} className="w-full overflow-hidden" style={{ height: "100vh", position: "relative", background: C.ink }}>
        {/* Frames */}
        {HERO_FRAMES.map((f, i) => (
          <div
            key={i}
            ref={(el) => (frameRefs.current[i] = el)}
            className="absolute inset-0 w-full h-full"
            style={{ willChange: "opacity, transform" }}
          >
            <img
              src={f.src}
              alt=""
              className="w-full h-full object-cover"
              style={{ filter: i === 3 ? "brightness(0.85)" : undefined }}
            />
            {i === 3 && (
              <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 0 200px 80px rgba(0,0,0,0.55)" }} />
            )}
          </div>
        ))}

        {/* Frame 1 overlay text */}
        <div ref={text1Ref} className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none">
          <div style={{ background: "rgba(10,10,20,0.35)", padding: "28px 38px", backdropFilter: "blur(2px)" }}>
            <h1
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "clamp(48px, 7vw, 80px)",
                color: C.cream,
                letterSpacing: "0.02em",
                lineHeight: 1,
                margin: 0,
              }}
            >
              WHERE ART FINDS ITS NEXT HOME
            </h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, fontSize: 18, color: C.warm, marginTop: 18 }}>
              BrushBids — Curator-approved student art auctions
            </p>
          </div>
        </div>

        {/* Frame 3 overlay text */}
        <div ref={text3Ref} className="absolute bottom-20 left-0 right-0 text-center pointer-events-none" style={{ opacity: 0 }}>
          <span style={{ color: C.accent2, fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: "0.2em", fontWeight: 500 }}>
            STEP INSIDE
          </span>
        </div>

        {/* Scroll progress indicator */}
        <div ref={indicatorRef} className="absolute right-6 top-12 bottom-12 w-[2px]" style={{ background: "rgba(255,255,255,0.12)" }}>
          <div ref={progressRef} className="w-full h-full" style={{ background: C.accent, transform: "scaleY(0)", transformOrigin: "top" }} />
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   HERO PHASE 2 — 3D Gallery Wall (r3f)
   ============================================================ */
const PAINTINGS = [
  { id: "p1", pos: [0, 0.2, 0] as [number, number, number], size: [2.6, 3.4] as [number, number], texture: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=600&q=80&auto=format&fit=crop", title: "Fractured Light Series IV", artist: "Maya Ashby", bid: "$4,800" },
  { id: "p2", pos: [-3.4, 1.4, 0] as [number, number, number], size: [1.8, 2.2] as [number, number], texture: "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?w=500&q=80&auto=format&fit=crop", title: "Urban Dusk", artist: "Taro Nakamura", bid: "$2,100" },
  { id: "p3", pos: [3.4, -1.2, 0] as [number, number, number], size: [1.8, 2.2] as [number, number], texture: "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=500&q=80&auto=format&fit=crop", title: "Gold & Ash No. 3", artist: "Priya Delacroix", bid: "$1,350" },
  { id: "p4", pos: [-5.6, -0.4, 0] as [number, number, number], size: [1.3, 1.7] as [number, number], texture: "https://images.unsplash.com/photo-1530968033775-2c92736b131e?w=500&q=80&auto=format&fit=crop", title: "Still Life No. 7", artist: "Rene Brandt", bid: "$1,750" },
  { id: "p5", pos: [5.6, 0.8, 0] as [number, number, number], size: [1.3, 1.7] as [number, number], texture: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=500&q=80&auto=format&fit=crop", title: "Layers III", artist: "Kofi Osei", bid: "$6,500" },
];

function Painting({ data, onHoverChange }: { data: (typeof PAINTINGS)[number]; onHoverChange: (h: boolean) => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const targetZ = useRef(0);
  const tex = useTexture(data.texture);

  useFrame(() => {
    if (!groupRef.current) return;
    targetZ.current = hovered ? 0.3 : 0;
    groupRef.current.position.z += (targetZ.current - groupRef.current.position.z) * 0.12;
  });

  const [w, h] = data.size;
  const frameDepth = 0.06;
  const border = 0.12;

  return (
    <group
      ref={groupRef}
      position={data.pos}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHoverChange(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHovered(false); onHoverChange(false); document.body.style.cursor = "default"; }}
    >
      {/* Purple glow plane behind frame when hovered */}
      {hovered && (
        <mesh position={[0, 0, -0.05]}>
          <planeGeometry args={[w + 0.6, h + 0.6]} />
          <meshBasicMaterial color={C.accent} transparent opacity={0.35} />
        </mesh>
      )}
      {/* Frame */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, frameDepth]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Canvas */}
      <mesh position={[0, 0, frameDepth / 2 + 0.001]}>
        <planeGeometry args={[w - border * 2, h - border * 2]} />
        <meshStandardMaterial map={tex} roughness={0.85} />
      </mesh>

      {hovered && (
        <Html
          position={[0, -h / 2 - 0.4, 0]}
          center
          distanceFactor={8}
          style={{ pointerEvents: "none", width: 240 }}
        >
          <div
            style={{
              background: "rgba(10,10,20,0.85)",
              backdropFilter: "blur(8px)",
              padding: "14px 16px",
              border: `1px solid rgba(255,255,255,0.08)`,
              color: "#fff",
              textAlign: "center",
            }}
          >
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 14 }}>{data.artist}</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontSize: 18, marginTop: 4 }}>{data.title}</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: C.accent2, marginTop: 6, letterSpacing: "0.02em" }}>{data.bid}</div>
            <div
              style={{
                marginTop: 10, padding: "8px 12px", background: C.accent, color: "#fff",
                fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: "0.1em", fontWeight: 500, textTransform: "uppercase",
              }}
            >
              Place Bid
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
  const [anyHover, setAnyHover] = useState(false);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);

  useFrame(() => {
    const maxRad = (2 * Math.PI) / 180; // 2 degrees
    const targetRotY = mouse.current.x * maxRad;
    const targetRotX = -mouse.current.y * maxRad;
    camera.rotation.y += (targetRotY - camera.rotation.y) * 0.05;
    camera.rotation.x += (targetRotX - camera.rotation.x) * 0.05;
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <spotLight position={[-6, 6, 6]} angle={0.4} penumbra={0.6} intensity={0.8} castShadow color="#ffffff" />
      <spotLight position={[6, 6, 6]} angle={0.4} penumbra={0.6} intensity={0.8} castShadow color="#dde6ff" />

      {/* Wall */}
      <mesh position={[0, 0, -1.5]} receiveShadow>
        <planeGeometry args={[30, 14]} />
        <meshStandardMaterial color="#e8e8f0" roughness={0.9} />
      </mesh>
      {/* Floor */}
      <mesh position={[0, -4, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 20]} />
        <meshStandardMaterial color={C.ink} roughness={0.25} metalness={0.5} />
      </mesh>

      {PAINTINGS.map((p) => (
        <Painting key={p.id} data={p} onHoverChange={setAnyHover} />
      ))}
    </>
  );
}

function Hero3DLoading() {
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: C.ink }}>
      <div className="animate-pulse" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: "0.02em" }}>
        <span style={{ color: C.cream }}>Brush</span>
        <span style={{ color: C.accent }}>Bids</span>
      </div>
    </div>
  );
}

function MobileGalleryGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4" style={{ background: C.ink }}>
      {PAINTINGS.map((p) => (
        <div key={p.id} className="relative overflow-hidden" style={{ aspectRatio: "3/4", background: "#1a1a2a" }}>
          <img src={p.texture} alt={p.title} className="w-full h-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 p-3" style={{ background: "linear-gradient(to top, rgba(10,10,20,0.95), transparent)" }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 12, color: "#fff" }}>{p.artist}</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontSize: 15, color: "#fff" }}>{p.title}</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: C.accent2 }}>{p.bid}</div>
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
          <Suspense fallback={<Hero3DLoading />}>
            <Canvas
              shadows
              dpr={[1, 1.75]}
              camera={{ position: [0, 0, 7], fov: 50 }}
              gl={{ alpha: false, antialias: true }}
              style={{ background: C.ink }}
            >
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
   TICKER
   ============================================================ */
function Ticker() {
  const items = useMemo(() => [
    { artist: "M. Ashby", title: "Crimson Flow", price: "$4,800" },
    { artist: "T. Nakamura", title: "Urban Dusk", price: "$2,100" },
    { artist: "C. Osei", title: "Layers III", price: "$6,500" },
    { artist: "R. Brandt", title: "Still Life No. 7", price: "$1,750" },
  ], []);

  const renderRow = (key: string) => (
    <div key={key} className="flex items-center shrink-0">
      {items.map((it, i) => (
        <span key={i} className="flex items-center shrink-0" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,240,246,0.6)", paddingRight: 32 }}>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", color: "rgba(240,240,246,0.85)" }}>"{it.title}"</span>
          <span style={{ margin: "0 8px" }}>by</span>
          <span style={{ color: C.accent2 }}>{it.artist}</span>
          <span style={{ margin: "0 8px" }}>—</span>
          <span style={{ color: "#fff" }}>{it.price}</span>
          <span style={{ width: 6, height: 6, borderRadius: 99, background: C.accent, margin: "0 18px" }} />
        </span>
      ))}
      <span className="shrink-0" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: C.accent, paddingRight: 32, fontWeight: 500 }}>
        10% of every sale to charity
        <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 99, background: C.accent, marginLeft: 18, verticalAlign: "middle" }} />
      </span>
    </div>
  );

  return (
    <section style={{ background: C.ink, padding: "22px 0", overflow: "hidden", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }} data-testid="ticker">
      <style>{`
        @keyframes bb-marquee { from { transform: translateX(0); } to { transform: translateX(-33.333%); } }
        .bb-marquee-track { animation: bb-marquee 28s linear infinite; }
      `}</style>
      <div className="bb-marquee-track flex" style={{ width: "max-content" }}>
        {renderRow("a")}{renderRow("b")}{renderRow("c")}
      </div>
    </section>
  );
}

/* ============================================================
   FEATURED AUCTIONS
   ============================================================ */
function TiltCard({ children, className = "", style = {}, ...rest }: { children: ReactNode; className?: string; style?: React.CSSProperties } & React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  const isTouchRef = useRef(false);

  useEffect(() => {
    isTouchRef.current = "ontouchstart" in window;
  }, []);

  const onMove = (e: React.MouseEvent) => {
    if (isTouchRef.current || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const cx = (e.clientX - r.left) / r.width - 0.5;
    const cy = (e.clientY - r.top) / r.height - 0.5;
    const rx = (-cy * 10).toFixed(2);
    const ry = (cx * 10).toFixed(2);
    ref.current.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  };
  const onLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg)";
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{ transition: "transform 0.3s ease, box-shadow 0.3s ease", willChange: "transform", ...style }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      {...rest}
    >
      {children}
    </div>
  );
}

function AuctionCard({ a }: { a: (typeof AUCTIONS)[number] }) {
  const [hover, setHover] = useState(false);
  return (
    <TiltCard
      className={`relative overflow-hidden group ${a.large ? "md:row-span-2 md:col-span-1" : ""}`}
      style={{
        background: "#222",
        minHeight: a.large ? 640 : 314,
        boxShadow: hover ? `0 30px 60px -20px ${C.glowPurple}` : "none",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      data-testid={`card-auction-${a.id}`}
    >
      <img
        src={a.image}
        alt={a.title}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: hover ? "scale(1.04)" : "scale(1)", transition: "transform 0.5s ease" }}
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,10,20,0.92) 0%, rgba(10,10,20,0.35) 45%, transparent 70%)" }} />

      {a.badge && (
        <div className="absolute top-4 left-4" style={{ background: a.badge.color, color: "#fff", padding: "6px 12px", fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500 }}>
          {a.badge.label}
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
        <div style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", color: "#fff", fontSize: a.large ? 32 : 22, lineHeight: 1.1 }}>{a.title}</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(240,240,246,0.7)", fontSize: 13, marginTop: 4 }}>
          {a.artist} · {a.medium}
        </div>
        <div className="flex items-end justify-between mt-3">
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, letterSpacing: "0.16em", color: "rgba(240,240,246,0.5)", textTransform: "uppercase" }}>Current Bid</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: a.large ? 42 : 30, color: "#fff", letterSpacing: "0.02em", lineHeight: 1 }}>{a.bid}</div>
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.accent2, letterSpacing: "0.1em", textTransform: "uppercase" }}>{a.left}</div>
        </div>
        <div
          className="overflow-hidden"
          style={{
            maxHeight: hover ? 60 : 0,
            transition: "max-height 0.35s ease, margin-top 0.35s ease",
            marginTop: hover ? 14 : 0,
          }}
        >
          <a href="/gallery" style={{ display: "inline-block", background: C.accent, color: "#fff", padding: "10px 18px", fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: "0.14em", fontWeight: 500, textTransform: "uppercase" }}>
            Place Bid
          </a>
        </div>
      </div>
    </TiltCard>
  );
}

function FeaturedAuctions() {
  return (
    <section id="auctions" style={{ background: C.cream, padding: "100px 0" }} data-testid="featured-auctions">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-end justify-between mb-10 flex-wrap gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span style={{ display: "inline-block", width: 36, height: 1, background: C.accent }} />
              <span style={{ color: C.accent, fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 500 }}>
                Ending Soon
              </span>
            </div>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(48px, 7vw, 88px)", color: C.ink, letterSpacing: "0.005em", lineHeight: 1 }}>
              Featured{" "}
              <span style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", color: C.muted }}>lots</span>
            </h2>
          </div>
          <a href="/gallery" className="group" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.ink, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500 }}>
            View all auctions <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
          </a>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-1 md:grid-cols-3 gap-[2px]"
        >
          {AUCTIONS.map((a) => (
            <motion.div
              key={a.id}
              variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } }}
              className={a.large ? "md:col-span-1 md:row-span-2" : ""}
            >
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
  if (name === "person") return (<svg viewBox="0 0 24 24" width="22" height="22" {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>);
  if (name === "search") return (<svg viewBox="0 0 24 24" width="22" height="22" {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/></svg>);
  if (name === "star") return (<svg viewBox="0 0 24 24" width="22" height="22" {...p}><path d="M12 2l3 6.9 7.6.6-5.8 5 1.8 7.4L12 17.8 5.4 21.9l1.8-7.4-5.8-5 7.6-.6L12 2z"/></svg>);
  return (<svg viewBox="0 0 24 24" width="22" height="22" {...p}><path d="M5 12l5 5L20 7"/></svg>);
}

function HowItWorks() {
  return (
    <section id="process" className="relative overflow-hidden" style={{ background: C.ink, padding: "120px 0" }} data-testid="how-it-works">
      <div
        className="absolute pointer-events-none select-none"
        style={{
          top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 220, color: "rgba(255,255,255,0.02)", letterSpacing: "0.05em",
          whiteSpace: "nowrap",
        }}
        aria-hidden="true"
      >
        PROCESS
      </div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-14">
          <div className="flex items-center gap-3 mb-4">
            <span style={{ display: "inline-block", width: 36, height: 1, background: C.accent2 }} />
            <span style={{ color: C.accent2, fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 500 }}>
              Simple Process
            </span>
          </div>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(48px, 7vw, 88px)", color: C.cream, letterSpacing: "0.005em", lineHeight: 1 }}>
            How it{" "}
            <span style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", color: "rgba(240,240,246,0.35)" }}>works</span>
          </h2>
        </motion.div>

        {/* Connecting gradient line */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          className="h-px mb-8"
          style={{ background: `linear-gradient(to right, ${C.accent}, ${C.accent2})`, transformOrigin: "left" }}
        />

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ show: { transition: { staggerChildren: 0.12 } } }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {STEPS.map((s, i) => {
            const color = i % 2 === 0 ? C.accent : C.accent2;
            return (
              <motion.div
                key={s.n}
                variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
                className="relative p-7 transition-all group"
                style={{
                  background: "rgba(240,240,246,0.04)",
                  border: "1px solid rgba(240,240,246,0.08)",
                  minHeight: 240,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(240,240,246,0.07)"; e.currentTarget.style.borderColor = `${C.accent}4D`; e.currentTarget.style.boxShadow = `0 20px 40px -15px ${C.glowPurple}`; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(240,240,246,0.04)"; e.currentTarget.style.borderColor = "rgba(240,240,246,0.08)"; e.currentTarget.style.boxShadow = "none"; }}
                data-testid={`step-${s.n}`}
              >
                <span
                  className="absolute right-4 top-2 pointer-events-none select-none"
                  style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 80, color: "rgba(255,255,255,0.04)", letterSpacing: "0.02em", lineHeight: 1 }}
                >
                  {s.n}
                </span>
                <div className="w-12 h-12 flex items-center justify-center mb-5" style={{ background: color }}>
                  <StepIcon name={s.icon} />
                </div>
                <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: C.cream, lineHeight: 1.2 }}>{s.title}</h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, fontSize: 14, color: "rgba(240,240,246,0.65)", marginTop: 12, lineHeight: 1.6 }}>{s.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================
   CHARITY + ARTIST CTA
   ============================================================ */
function CharityArtistSplit() {
  return (
    <section id="artists" className="grid grid-cols-1 md:grid-cols-2" data-testid="charity-artist-split">
      {/* Charity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="flex flex-col justify-center"
        style={{ background: C.accent, padding: "80px 48px", minHeight: 400 }}
      >
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>
          10% of every sale
        </div>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(40px, 5.5vw, 64px)", color: "#fff", letterSpacing: "0.01em", marginTop: 14, lineHeight: 1 }}>
          GOES DIRECTLY TO CHARITY
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, fontSize: 16, color: "rgba(255,255,255,0.85)", marginTop: 18, maxWidth: 520, lineHeight: 1.6 }}>
          Every purchase on BrushBids directly supports arts education. We believe creativity changes lives — and every bid proves it.
        </p>
        <a href="/about" className="inline-block mt-7 self-start" style={{ color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", borderBottom: "1px solid #fff", paddingBottom: 4 }}>
          Learn More
        </a>
      </motion.div>

      {/* Artist */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex flex-col justify-center"
        style={{ background: C.ink, padding: "80px 48px", minHeight: 400 }}
      >
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: C.accent2, fontWeight: 500 }}>
          For Artists
        </div>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(40px, 5.5vw, 64px)", color: C.cream, letterSpacing: "0.01em", marginTop: 14, lineHeight: 1 }}>
          SHARE YOUR WORK{" "}
          <span style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", color: C.accent, fontSize: "0.7em" }}>Reach real collectors.</span>
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, fontSize: 16, color: "rgba(240,240,246,0.7)", marginTop: 18, maxWidth: 520, lineHeight: 1.6 }}>
          Any artist can apply to list on BrushBids. Our curatorial team reviews every submission to ensure quality. No listing fees — we only earn when you do.
        </p>
        <a
          href="/submit-artwork"
          className="inline-block mt-7 self-start transition-all"
          style={{ background: "#fff", color: C.accent, padding: "14px 22px", fontFamily: "'DM Sans', sans-serif", fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500 }}
          onMouseEnter={(e) => { e.currentTarget.style.background = C.ink; e.currentTarget.style.color = C.cream; e.currentTarget.style.boxShadow = `0 0 0 1px ${C.cream}`; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = C.accent; e.currentTarget.style.boxShadow = "none"; }}
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
function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "0.2em", color: "rgba(240,240,246,0.5)", textTransform: "uppercase", fontWeight: 500, marginBottom: 18 }}>
        {title}
      </div>
      <ul className="flex flex-col gap-3">
        {links.map((l) => (
          <li key={l}>
            <a href="#" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "rgba(240,240,246,0.8)" }}>{l}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Footer() {
  return (
    <footer id="about" style={{ background: C.ink, borderTop: "1px solid rgba(240,240,246,0.06)", padding: "72px 24px 40px" }} data-testid="footer">
      <div className="max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: "0.02em" }}>
            <span style={{ color: C.cream }}>Brush</span>
            <span style={{ color: C.accent }}>Bids</span>
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300, fontSize: 13, color: "rgba(240,240,246,0.55)", marginTop: 14, lineHeight: 1.6, maxWidth: 240 }}>
            Curator-approved student art auctions. Where art finds its next home.
          </p>
        </div>
        <FooterCol title="Marketplace" links={["Browse auctions", "Ending soon", "New listings", "Categories"]} />
        <FooterCol title="Artists" links={["Apply to list", "How payouts work", "Curation standards", "Artist FAQ"]} />
        <FooterCol title="Company" links={["About BrushBids", "Our curators", "Contact", "Press"]} />
      </div>
      <div className="max-w-[1400px] mx-auto mt-14 pt-7 flex flex-col md:flex-row md:items-center md:justify-between gap-4" style={{ borderTop: "1px solid rgba(240,240,246,0.06)" }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(240,240,246,0.45)" }}>
          © 2026 BrushBids. All rights reserved.
        </div>
        <div className="flex gap-6">
          {["Privacy", "Terms", "Cookie Policy"].map((l) => (
            <a key={l} href="#" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(240,240,246,0.55)" }}>{l}</a>
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
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 767px)").matches;
  });

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", h);
    return () => mql.removeEventListener("change", h);
  }, []);

  useEffect(() => {
    // Smooth scroll for anchor links
    document.documentElement.style.scrollBehavior = "smooth";
    return () => { document.documentElement.style.scrollBehavior = ""; };
  }, []);

  return (
    <div style={{ background: C.cream, color: C.ink, fontFamily: "'DM Sans', sans-serif" }} data-testid="home-v2">
      <Nav />
      <HeroPhase1 />
      <HeroPhase2 isMobile={isMobile} />
      <Ticker />
      <FeaturedAuctions />
      <HowItWorks />
      <CharityArtistSplit />
      <Footer />
    </div>
  );
}
