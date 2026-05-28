import { useEffect, useRef, useState, Suspense, Component, ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment } from "@react-three/drei";
import { motion, useMotionValue, animate as fmAnimate } from "framer-motion";
import * as THREE from "three";

const COLORS = {
  cream: "#f5f0e8",
  ink: "#0e0c0a",
  rust: "#c8401a",
  amber: "#e8a020",
  taupe: "#7a7060",
  bronze: "#b8860b",
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  show: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as any, delay },
  }),
};

/* ------------------------- 3D Frame ------------------------- */

interface FrameProps {
  position: [number, number, number];
  rotation: [number, number, number];
  artColor: string;
  scale?: number;
  parallaxStrength?: number;
  mouseRef: React.MutableRefObject<{ x: number; y: number }>;
}

function PictureFrame({ position, rotation, artColor, scale = 1, parallaxStrength = 0.4, mouseRef }: FrameProps) {
  const groupRef = useRef<THREE.Group>(null);
  const basePos = useRef(new THREE.Vector3(...position));
  const targetOffset = useRef(new THREE.Vector2(0, 0));
  const currentOffset = useRef(new THREE.Vector2(0, 0));

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    targetOffset.current.set(
      mouseRef.current.x * parallaxStrength,
      mouseRef.current.y * parallaxStrength * 0.6,
    );
    currentOffset.current.lerp(targetOffset.current, 0.06);
    groupRef.current.position.x = basePos.current.x + currentOffset.current.x;
    groupRef.current.position.y = basePos.current.y + currentOffset.current.y;
    groupRef.current.rotation.z += 0.05 * delta;
  });

  // Frame thickness depth & width
  const w = 1.4 * scale;
  const h = 1.8 * scale;
  const d = 0.08 * scale;
  const border = 0.08 * scale;

  return (
    <Float speed={1.4} rotationIntensity={0.2} floatIntensity={0.3}>
      <group ref={groupRef} position={position} rotation={rotation} castShadow>
        {/* Frame body */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={COLORS.bronze} metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Inner artwork plane (slightly in front of frame) */}
        <mesh position={[0, 0, d / 2 + 0.001]}>
          <planeGeometry args={[w - border * 2, h - border * 2]} />
          <meshStandardMaterial color={artColor} roughness={0.85} metalness={0.0} />
        </mesh>
      </group>
    </Float>
  );
}

/* ------------------------- Scene ------------------------- */

function FrameScene() {
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -((e.clientY / window.innerHeight) * 2 - 1);
      mouseRef.current.x = x;
      mouseRef.current.y = y;
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 5, 5]} intensity={0.9} castShadow />
      <directionalLight position={[-3, -2, 2]} intensity={0.25} color={COLORS.amber} />

      <PictureFrame
        position={[-1.1, 0.6, 0]}
        rotation={[0, 0.2, -0.1]}
        artColor={COLORS.rust}
        scale={1.0}
        parallaxStrength={0.55}
        mouseRef={mouseRef}
      />
      <PictureFrame
        position={[1.0, -0.3, -0.8]}
        rotation={[0, -0.25, 0.08]}
        artColor={COLORS.amber}
        scale={1.15}
        parallaxStrength={0.4}
        mouseRef={mouseRef}
      />
      <PictureFrame
        position={[0.2, 1.2, -1.6]}
        rotation={[0, 0.1, 0.15]}
        artColor={COLORS.ink}
        scale={0.75}
        parallaxStrength={0.25}
        mouseRef={mouseRef}
      />
      <PictureFrame
        position={[-0.6, -1.1, -2.2]}
        rotation={[0, 0.3, -0.2]}
        artColor={COLORS.taupe}
        scale={0.65}
        parallaxStrength={0.15}
        mouseRef={mouseRef}
      />

      <Environment preset="apartment" />
    </>
  );
}

/* ------------------------- Count-Up Stat ------------------------- */

function CountUp({ to, prefix = "", suffix = "", decimals = 0, delay = 0 }: {
  to: number; prefix?: string; suffix?: string; decimals?: number; delay?: number;
}) {
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    const controls = fmAnimate(mv, to, {
      duration: 1.6,
      delay,
      ease: "easeOut",
      onUpdate: (v) => {
        setDisplay(v.toFixed(decimals));
      },
    });
    return () => controls.stop();
  }, [to, delay, decimals, mv]);

  return <>{prefix}{display}{suffix}</>;
}

/* ------------------------- Canvas Error Boundary ------------------------- */

class CanvasErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { hasError: boolean }> {
  constructor(props: { fallback: ReactNode; children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.warn("HeroSection 3D canvas failed, using fallback:", error.message);
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

/* ------------------------- Main Component ------------------------- */

export default function HeroSection() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 767px)").matches;
  });

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return (
    <section
      data-testid="hero-section"
      className="relative w-full min-h-screen overflow-hidden"
      style={{ backgroundColor: COLORS.cream, color: COLORS.ink }}
    >
      <style>{`
        @keyframes brushbids-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.6); opacity: 0.4; }
        }
        .bb-pulse-dot::before {
          content: '';
          width: 8px; height: 8px;
          border-radius: 9999px;
          background: ${COLORS.rust};
          display: inline-block;
          animation: brushbids-pulse 1.6s ease-in-out infinite;
        }
        .bb-cta-arrow { transition: transform 0.3s ease; display: inline-block; }
        .bb-cta-link:hover .bb-cta-arrow { transform: translateX(6px); }
      `}</style>

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 pt-24 md:pt-28 pb-16">
        <div className="flex flex-col md:flex-row gap-10 md:gap-6 items-stretch">

          {/* ============ LEFT (55%) ============ */}
          <div className="w-full md:basis-[55%] md:max-w-[55%] flex flex-col justify-center">

            {/* Eyebrow */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="show"
              custom={0}
              className="flex items-center gap-3 mb-6"
              data-testid="hero-eyebrow"
            >
              <span
                className="block h-px w-10"
                style={{ background: COLORS.rust }}
              />
              <span
                style={{
                  color: COLORS.rust,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "12px",
                  letterSpacing: "0.18em",
                  fontWeight: 500,
                }}
                className="uppercase"
              >
                Curator-Approved Student Marketplace
              </span>
            </motion.div>

            {/* Headline */}
            <h1
              className="mb-8 leading-[0.92]"
              style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.005em" }}
              data-testid="hero-headline"
            >
              <motion.span
                variants={fadeInUp}
                initial="hidden"
                animate="show"
                custom={0.1}
                className="block"
                style={{
                  color: COLORS.ink,
                  fontSize: isMobile ? "72px" : "clamp(96px, 11vw, 168px)",
                }}
              >
                BID ON
              </motion.span>
              <motion.span
                variants={fadeInUp}
                initial="hidden"
                animate="show"
                custom={0.2}
                className="block italic"
                style={{
                  color: COLORS.rust,
                  fontFamily: "'DM Serif Display', serif",
                  fontStyle: "italic",
                  fontSize: isMobile ? "60px" : "clamp(80px, 9.5vw, 144px)",
                  letterSpacing: "-0.02em",
                  lineHeight: "1",
                  marginTop: "-0.05em",
                  marginBottom: "-0.05em",
                }}
              >
                original
              </motion.span>
              <motion.span
                variants={fadeInUp}
                initial="hidden"
                animate="show"
                custom={0.3}
                className="block"
                style={{
                  color: COLORS.ink,
                  fontSize: isMobile ? "72px" : "clamp(96px, 11vw, 168px)",
                }}
              >
                STUDENT ART
              </motion.span>
            </h1>

            {/* Body */}
            <motion.p
              variants={fadeInUp}
              initial="hidden"
              animate="show"
              custom={0.4}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 300,
                color: COLORS.taupe,
                fontSize: "17px",
                lineHeight: 1.6,
                maxWidth: "520px",
              }}
              className="mb-10"
              data-testid="hero-body"
            >
              Every piece on BrushBids is hand-selected by our curatorial team.
              Discover emerging student artists. Bid live. Own something real.
              10% of every sale goes to charity.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="show"
              custom={0.5}
              className="flex flex-wrap items-center gap-6 mb-12"
              data-testid="hero-ctas"
            >
              <a
                href="/gallery"
                className="inline-block transition-colors duration-200"
                style={{
                  backgroundColor: COLORS.ink,
                  color: COLORS.cream,
                  padding: "20px 36px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "13px",
                  letterSpacing: "0.16em",
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS.rust)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.ink)}
                data-testid="button-explore-auctions"
              >
                EXPLORE AUCTIONS
              </a>
              <a
                href="/about"
                className="bb-cta-link inline-flex items-center gap-2"
                style={{
                  color: COLORS.taupe,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "15px",
                  fontWeight: 400,
                }}
                data-testid="link-how-it-works"
              >
                How it works <span className="bb-cta-arrow">→</span>
              </a>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="show"
              custom={0.6}
              className="pt-8"
              style={{ borderTop: `1px solid ${COLORS.ink}1a` }}
              data-testid="hero-stats"
            >
              <div className={`grid ${isMobile ? "grid-cols-2 gap-y-6 gap-x-4" : "grid-cols-3 gap-8"}`}>
                <Stat label="Active Bidders" value={<CountUp to={2.4} decimals={1} suffix="K" delay={0.7} />} />
                <Stat label="Artists" value={<CountUp to={840} delay={0.75} suffix="+" />} />
                <Stat label="Art Sold" value={<CountUp to={1.2} decimals={1} prefix="$" suffix="M" delay={0.8} />} />
              </div>
            </motion.div>
          </div>

          {/* ============ RIGHT (45%) — 3D Canvas ============ */}
          <div className="relative w-full md:basis-[45%] md:max-w-[45%]">
            <div
              className="relative w-full"
              style={{
                height: isMobile ? "360px" : "min(680px, 78vh)",
                minHeight: isMobile ? "320px" : "560px",
              }}
            >
              {isMobile ? (
                <div
                  className="w-full h-full rounded-md"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.rust} 0%, ${COLORS.amber} 45%, ${COLORS.taupe} 100%)`,
                  }}
                  aria-hidden="true"
                  data-testid="hero-mobile-gradient"
                />
              ) : (
                <CanvasErrorBoundary
                  fallback={
                    <div
                      className="w-full h-full"
                      style={{
                        background: `linear-gradient(135deg, ${COLORS.rust} 0%, ${COLORS.amber} 45%, ${COLORS.taupe} 100%)`,
                      }}
                      aria-hidden="true"
                      data-testid="hero-canvas-fallback"
                    />
                  }
                >
                  <Canvas
                    shadows
                    dpr={[1, 1.75]}
                    camera={{ position: [0, 0, 5], fov: 45 }}
                    gl={{ alpha: true, antialias: true, failIfMajorPerformanceCaveat: false }}
                    style={{ background: "transparent" }}
                    onCreated={({ gl }) => {
                      gl.domElement.addEventListener("webglcontextlost", (e) => e.preventDefault());
                    }}
                  >
                    <Suspense fallback={null}>
                      <FrameScene />
                    </Suspense>
                  </Canvas>
                </CanvasErrorBoundary>
              )}

              {/* LIVE Tag — top right */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7, ease: "easeOut" }}
                className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2"
                style={{
                  background: "rgba(245,240,232,0.95)",
                  padding: "12px 18px",
                  backdropFilter: "blur(8px)",
                }}
                data-testid="hero-live-tag"
              >
                <span className="bb-pulse-dot" />
                <span
                  className="uppercase"
                  style={{
                    color: COLORS.ink,
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "12px",
                    letterSpacing: "0.16em",
                    fontWeight: 500,
                  }}
                >
                  Live Auction Now
                </span>
              </motion.div>

              {/* Current Bid Badge — bottom left */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
                className="absolute bottom-4 left-4 md:bottom-6 md:left-6"
                style={{
                  background: COLORS.amber,
                  padding: "16px 24px",
                }}
                data-testid="hero-current-bid"
              >
                <div
                  className="uppercase"
                  style={{
                    color: "rgba(14,12,10,0.6)",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "10px",
                    letterSpacing: "0.18em",
                    fontWeight: 500,
                  }}
                >
                  Current Bid
                </div>
                <div
                  style={{
                    color: COLORS.ink,
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "26px",
                    letterSpacing: "0.01em",
                    lineHeight: 1.1,
                    marginTop: "2px",
                  }}
                >
                  $3,200
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------- Stat ------------------------- */

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div data-testid={`stat-${label.replace(/\s+/g, "-").toLowerCase()}`}>
      <div
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "42px",
          color: COLORS.ink,
          letterSpacing: "0.01em",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        className="uppercase mt-2"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "12px",
          letterSpacing: "0.18em",
          color: COLORS.taupe,
          fontWeight: 500,
        }}
      >
        {label}
      </div>
    </div>
  );
}
