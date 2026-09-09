import { useEffect, useRef, useState } from "react";
import {
  Fingerprint,
  MonitorSmartphone,
  Layers,
  Orbit,
  Cpu,
  Rocket,
  ArrowUpRight,
  Check,
} from "lucide-react";
import { cn } from "../utils/cn";

const SERVICES = [
  {
    icon: Fingerprint,
    title: "Brand Identity",
    desc: "Strategy, naming, logo systems and guidelines that make you unmistakable — and unforgettable.",
    tags: ["Strategy", "Logo", "Voice"],
    price: "from $6k",
  },
  {
    icon: MonitorSmartphone,
    title: "Web Design & Build",
    desc: "Blazing-fast marketing sites and e-commerce. Designed to wow, engineered to convert.",
    tags: ["Next.js", "Shopify", "CMS"],
    price: "from $12k",
  },
  {
    icon: Layers,
    title: "Product Design",
    desc: "UX research, UI systems and prototypes for web & mobile products your users will love.",
    tags: ["UX/UI", "Systems", "Testing"],
    price: "from $9k",
  },
  {
    icon: Orbit,
    title: "Motion & 3D",
    desc: "WebGL scenes, Lottie, scroll cinema and micro-interactions that make interfaces feel alive.",
    tags: ["WebGL", "Lottie", "Video"],
    price: "from $5k",
  },
  {
    icon: Cpu,
    title: "Creative Engineering",
    desc: "Design engineers embedded in your stack. AI features, realtime, edge, experimentation.",
    tags: ["AI", "Realtime", "Edge"],
    price: "from $8k",
  },
  {
    icon: Rocket,
    title: "Growth & CRO",
    desc: "Analytics, A/B testing and landing-page sprints that compound your launch momentum.",
    tags: ["SEO", "A/B", "Analytics"],
    price: "from $4k",
  },
];

export function Services() {
  const [active, setActive] = useState(1);
  return (
    <section id="services" className="relative mx-auto max-w-7xl scroll-mt-28 px-4 py-24 sm:px-6">
      <div className="reveal flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="font-mono2 text-xs tracking-[0.25em] text-[var(--accent)]">01 — CAPABILITIES</p>
          <h2 className="mt-3 max-w-xl font-display text-4xl font-bold leading-[1.02] tracking-tight sm:text-5xl">
            Everything you need to <span className="text-white/40">launch loud.</span>
          </h2>
        </div>
        <p className="max-w-sm text-[15px] leading-relaxed text-white/55">
          One senior pod covers strategy through ship. Pick a sprint, or plug us in as your
          product team — no agencies-of-agencies, no telephone game.
        </p>
      </div>

      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((s, i) => (
          <button
            key={s.title}
            onMouseEnter={() => setActive(i)}
            onClick={() => setActive(i)}
            className={cn(
              "reveal group relative overflow-hidden rounded-3xl border p-6 text-left transition-all duration-500 sm:p-7",
              i === 1 ? "reveal-delay-1" : i === 2 ? "reveal-delay-2" : "",
              active === i
                ? "border-transparent bg-white/[0.06]"
                : "border-white/8 bg-white/[0.02]"
            )}
          >
            {active === i && (
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[var(--accent)]/15 blur-3xl" />
            )}
            <div className="flex items-start justify-between">
              <span
                className={cn(
                  "grid h-12 w-12 place-items-center rounded-2xl transition-all duration-500",
                  active === i ? "bg-[var(--accent)] text-black" : "bg-white/8 text-white"
                )}
              >
                <s.icon size={21} />
              </span>
              <span className="rounded-full border border-white/10 px-2.5 py-1 font-mono2 text-[10px] text-white/45">
                {s.price}
              </span>
            </div>
            <h3 className="mt-5 font-display text-xl font-bold">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/55">{s.desc}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {s.tags.map((t) => (
                <span key={t} className="rounded-full bg-white/6 px-2.5 py-1 text-[11px] font-medium text-white/60">
                  {t}
                </span>
              ))}
            </div>
            <span
              className={cn(
                "mt-5 inline-flex items-center gap-1 text-[13px] font-semibold transition",
                active === i ? "text-[var(--accent)]" : "text-white/40"
              )}
            >
              Explore capability <ArrowUpRight size={14} />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function Counter({ to, suffix = "", decimals = 0 }: { to: number; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const t0 = performance.now();
          const dur = 1700;
          const tick = (t: number) => {
            const p = Math.min(1, (t - t0) / dur);
            const eased = 1 - Math.pow(1 - p, 4);
            setVal(to * eased);
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to]);
  return (
    <span ref={ref} className="tabular-nums">
      {val.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export function Metrics() {
  const items = [
    { v: 240, suffix: "+", label: "Projects shipped", sub: "across 14 countries" },
    { v: 9, suffix: "", label: "Awwwards SOTD", sub: "plus 21 honorable mentions" },
    { v: 98, suffix: "%", label: "Client retention", sub: "come back within a year" },
    { v: 480, suffix: "M", prefix: "$", label: "Client revenue driven", sub: "attributed to our launches" },
  ];
  return (
    <section className="border-y border-white/8 bg-white/[0.015]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 divide-white/8 px-4 sm:px-6 lg:grid-cols-4 lg:divide-x">
        {items.map((m, i) => (
          <div key={m.label} className={cn("reveal px-2 py-10 text-center sm:px-8", i === 1 && "reveal-delay-1", i === 2 && "reveal-delay-2", i === 3 && "reveal-delay-3")}>
            <p className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
              {(m as { prefix?: string }).prefix}
              <Counter to={m.v} suffix={m.suffix} />
            </p>
            <p className="mt-2 text-sm font-semibold">{m.label}</p>
            <p className="mt-0.5 text-xs text-white/40">{m.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const STEPS = [
  {
    n: "01",
    title: "Discover",
    time: "Week 1–2",
    desc: "Stakeholder interviews, analytics teardown, competitor autopsy. We find the sharp edge — the one thing you'll own.",
    checks: ["Brand & UX audit", "Jobs-to-be-done map", "Opportunity thesis"],
  },
  {
    n: "02",
    title: "Design",
    time: "Week 3–5",
    desc: "Identity directions, hi-fi screens and motion studies. You react to real product, not moodboards, every 72 hours.",
    checks: ["2 creative territories", "Clickable prototype", "Motion language"],
  },
  {
    n: "03",
    title: "Build",
    time: "Week 6–8",
    desc: "Design engineering in your stack with staging previews on every commit. Content, CMS and analytics wired up.",
    checks: ["Weekly staging demos", "CMS + SEO setup", "Perf budget <1s LCP"],
  },
  {
    n: "04",
    title: "Launch & Scale",
    time: "Ongoing",
    desc: "Launch-day war room, then 30 days concierge + CRO roadmap. Most clients 2–3x key metrics in quarter one.",
    checks: ["Launch checklist", "A/B roadmap", "Care plan"],
  },
];

export function Process() {
  const [progress, setProgress] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onScroll = () => {
      if (!ref.current) return;
      const r = ref.current.getBoundingClientRect();
      const total = r.height - window.innerHeight * 0.5;
      const done = Math.min(Math.max(-r.top + 200, 0), total);
      setProgress(total > 0 ? done / total : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <section id="process" ref={ref} className="relative mx-auto max-w-7xl scroll-mt-28 px-4 py-24 sm:px-6">
      <div className="reveal max-w-2xl">
        <p className="font-mono2 text-xs tracking-[0.25em] text-[var(--accent)]">03 — HOW WE WORK</p>
        <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          From kickoff to launch <br className="hidden sm:block" /> in <span className="text-stroke-accent">8 weeks.</span>
        </h2>
      </div>
      <div className="relative mt-12 grid gap-10 lg:grid-cols-[80px_1fr]">
        <div className="relative hidden justify-center lg:flex">
          <div className="absolute inset-y-2 w-[2px] overflow-hidden rounded-full bg-white/10">
            <div className="w-full bg-[var(--accent)] transition-[height] duration-150" style={{ height: `${progress * 100}%` }} />
          </div>
        </div>
        <div className="space-y-4">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className={cn(
                "reveal group grid gap-5 rounded-3xl border border-white/8 bg-white/[0.02] p-6 transition hover:border-white/18 hover:bg-white/[0.045] sm:p-8 md:grid-cols-[120px_1fr_220px]",
                i === 1 && "reveal-delay-1",
                i === 2 && "reveal-delay-2",
                i === 3 && "reveal-delay-3"
              )}
            >
              <div>
                <p className="font-display text-5xl font-bold text-white/12 transition group-hover:text-[var(--accent)]">{s.n}</p>
                <p className="mt-2 inline-block rounded-full bg-white/6 px-2.5 py-1 font-mono2 text-[10px] tracking-widest text-white/50">{s.time.toUpperCase()}</p>
              </div>
              <div>
                <h3 className="font-display text-2xl font-bold">{s.title}</h3>
                <p className="mt-2 max-w-lg text-[14.5px] leading-relaxed text-white/55">{s.desc}</p>
              </div>
              <ul className="space-y-2 self-center">
                {s.checks.map((c) => (
                  <li key={c} className="flex items-center gap-2 text-[13px] text-white/65">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--accent)]/15 text-[var(--accent)]">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
