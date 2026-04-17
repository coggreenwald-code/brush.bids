import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { DollarSign, Heart, GraduationCap, Frame } from "lucide-react";

import shape3dTorusPurple from "@assets/3d-torus-purple.png";
import shape3dSphereBlue from "@assets/3d-sphere-blue.png";
import shape3dGemGreen from "@assets/3d-gem-green.png";

function parseStatValue(value: string): { prefix: string; number: number; suffix: string } {
  const match = value.match(/^([^0-9]*)([0-9,]+(?:\.\d+)?)(.*)$/);
  if (!match) return { prefix: "", number: 0, suffix: value };
  return {
    prefix: match[1],
    number: parseFloat(match[2].replace(/,/g, "")),
    suffix: match[3],
  };
}

function CountUpNumber({ value, duration = 2000 }: { value: string; duration?: number }) {
  const { prefix, number, suffix } = parseStatValue(value);
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const startTime = performance.now();
          const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * number));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasAnimated, number, duration]);

  const formatted = count >= 1000 ? count.toLocaleString() : count.toString();
  return <span ref={ref}>{prefix}{formatted}{suffix}</span>;
}

export function ImpactSection() {
  const stats = [
    { value: "500+", label: "Student Artists", icon: GraduationCap },
    { value: "$125K", label: "Earned by Artists", icon: DollarSign },
    { value: "$18K", label: "Donated to Charity", icon: Heart },
    { value: "2,000+", label: "Artworks Sold", icon: Frame },
  ];

  return (
    <section aria-label="Platform Statistics" className="relative py-24 md:py-32 perspective-section" style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }} data-testid="section-stats">
      <div className="absolute inset-0 bg-mesh-blue section-tint-blue bg-dots" />
      <div className="floating-orb gradient-orb-blue w-[280px] h-[280px] -top-16 -left-20 animate-float-slow opacity-35" />
      <div className="floating-orb gradient-orb-pink w-[220px] h-[220px] -bottom-12 -right-16 animate-float-reverse opacity-30" />
      <div className="absolute left-[5%] top-[8%] pointer-events-none z-[1] hidden md:block">
        <img src={shape3dTorusPurple} alt="" className="w-[110px] h-[110px] animate-spin-float" draggable={false} />
        <img src={shape3dGemGreen} alt="" className="w-[45px] h-[45px] ml-16 -mt-2 animate-rock-orbit" draggable={false} />
      </div>
      <img src={shape3dSphereBlue} alt="" className="absolute bottom-[10%] right-[6%] w-[55px] h-[55px] pointer-events-none z-[1] animate-spin-float-reverse hidden md:block" draggable={false} />
      <div className="watermark-text">Impact</div>
      <div className="relative z-10 px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
        <div className="section-outlined p-8 md:p-12 lg:p-16">
          <div className="mb-12 relative z-10">
            <span className="text-xs font-medium text-[#60A5FA] uppercase tracking-[0.3em] mb-3 block">By The Numbers</span>
          </div>
          <div className="divider-line mb-12 relative z-10" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 relative z-10">
            {stats.map((stat, i) => {
              const statColors = ["#A78BFA", "#34D399", "#F472B6", "#60A5FA"];
              const color = statColors[i % statColors.length];
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: 0.08 * i, duration: 0.4 }}
                  className="rounded-xl p-6 border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-default"
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: `${color}15`, borderColor: `${color}30`, borderWidth: '1px' }}>
                    <stat.icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <p className="text-3xl md:text-4xl font-bold tabular-nums text-white" data-testid={`text-stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                    <CountUpNumber value={stat.value} />
                  </p>
                  <p className="text-sm text-white/40 mt-2 tracking-wide uppercase">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
