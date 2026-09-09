import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Play,
  Pause,
  Star,
  Zap,
  Globe,
  TrendingUp,
  MousePointerClick,
  BadgeCheck,
} from "lucide-react";
import { cn } from "../utils/cn";

function useLiveSeries(seed: number[], live: boolean) {
  const [data, setData] = useState(seed);
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => {
      setData((d) => {
        const next = [...d.slice(1), Math.max(18, Math.min(96, d[d.length - 1] + (Math.random() * 22 - 10)))];
        return next;
      });
    }, 1400);
    return () => clearInterval(t);
  }, [live]);
  return data;
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const path = useMemo(() => {
    const w = 560, h = 160, pad = 8;
    const min = Math.min(...data) - 4;
    const max = Math.max(...data) + 4;
    const pts = data.map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (w - pad * 2);
      const y = h - pad - ((v - min) / (max - min)) * (h - pad * 2);
      return [x, y] as const;
    });
    const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
    const area = `${line} L${w - pad},${h} L${pad},${h} Z`;
    return { line, area, last: pts[pts.length - 1] };
  }, [data]);
  return (
    <svg viewBox="0 0 560 160" className="h-36 w-full sm:h-44" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[32, 72, 112].map((y) => (
        <line key={y} x1="0" x2="560" y1={y} y2={y} stroke="rgba(255,255,255,0.07)" strokeDasharray="4 6" />
      ))}
      <path d={path.area} fill="url(#sparkFill)" />
      <path d={path.line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={path.last[0]} cy={path.last[1]} r="5" fill={color} stroke="#08080c" strokeWidth="3" />
      <circle cx={path.last[0]} cy={path.last[1]} r="10" fill={color} opacity="0.25">
        <animate attributeName="r" values="8;16;8" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.35;0;0.35" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

const TABS = ["Overview", "Analytics", "Activity"] as const;

export default function Hero() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [live, setLive] = useState(true);
  const [range, setRange] = useState(30);
  const seed = useMemo(() => [42, 48, 45, 55, 52, 61, 58, 66, 63, 72, 69, 78, 82, 79, 88, 91], []);
  const series = useLiveSeries(seed, live);
  const [visitors, setVisitors] = useState(48210);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => setVisitors((v) => v + Math.floor(Math.random() * 180 + 20)), 1400);
    return () => clearInterval(t);
  }, [live]);

  const conversion = (3.2 + (range / 30) * 1.4).toFixed(2);

  return (
    <section id="top" ref={heroRef} className="relative overflow-hidden pb-10 pt-32 sm:pt-40">
      {/* backdrop */}
      <div className="bg-grid absolute inset-0" />
      <div className="animate-orb absolute -top-32 left-1/2 h-[560px] w-[860px] -translate-x-1/2 rounded-full bg-[#7c5cff]/18 blur-[130px]" />
      <div className="animate-orb absolute -left-40 top-64 h-[420px] w-[420px] rounded-full bg-[var(--accent)]/10 blur-[120px] [animation-delay:2s]" />
      <div className="absolute -right-40 top-40 h-[380px] w-[380px] rounded-full bg-[#ff5ca8]/10 blur-[120px]" />
      <div className="bg-noise pointer-events-none absolute inset-0 opacity-[0.05]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="animate-reveal-up inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-4 text-xs backdrop-blur">
            <span className="flex items-center gap-1 rounded-full bg-[var(--accent)] px-2.5 py-1 font-semibold text-black">
              <Zap size={11} strokeWidth={2.8} /> NEW
            </span>
            <span className="text-white/70">Booking Q4 builds — 2 senior pods left</span>
            <a href="#contact" className="font-semibold text-white underline-offset-4 hover:underline">
              Claim →
            </a>
          </div>

          <h1
            className="animate-reveal-up mt-7 font-display text-[13vw] font-bold leading-[0.92] tracking-[-0.04em] sm:text-7xl lg:text-[92px]"
            style={{ animationDelay: "80ms" }}
          >
            We build brands
            <br />
            <span className="text-stroke">that refuse to</span>
            <br />
            <span className="shimmer-text">blend in.</span>
          </h1>

          <p
            className="animate-reveal-up mx-auto mt-6 max-w-2xl text-balance text-[15px] leading-relaxed text-white/60 sm:text-lg"
            style={{ animationDelay: "160ms" }}
          >
            PRISM is an award-winning studio for ambitious teams — identity, websites and
            products engineered to convert. Strategy, design, motion & code under one roof.
          </p>

          <div
            className="animate-reveal-up mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
            style={{ animationDelay: "240ms" }}
          >
            <a
              href="#contact"
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-7 py-4 text-[15px] font-bold text-black shadow-[0_0_48px_-8px_var(--accent)] transition hover:brightness-110 sm:w-auto"
            >
              Start your project
              <ArrowUpRight size={18} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <a
              href="#work"
              className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-7 py-4 text-[15px] font-semibold text-white backdrop-blur transition hover:border-white/30 hover:bg-white/10 sm:w-auto"
            >
              <Play size={16} className="fill-current" /> See the proof
            </a>
          </div>

          <div
            className="animate-reveal-up mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-[13px] text-white/50"
            style={{ animationDelay: "320ms" }}
          >
            <span className="flex items-center gap-1.5">
              <span className="flex text-[var(--accent)]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={13} className="fill-current" />
                ))}
              </span>
              <b className="text-white">5.0</b> · 84 reviews
            </span>
            <span className="hidden h-4 w-px bg-white/15 sm:block" />
            <span className="flex items-center gap-1.5">
              <BadgeCheck size={15} className="text-emerald-400" /> Awwwards SOTD ×9
            </span>
            <span className="hidden h-4 w-px bg-white/15 sm:block" />
            <span className="flex items-center gap-1.5">
              <Globe size={14} /> Trusted in 14 countries
            </span>
          </div>
        </div>

        {/* Interactive product window */}
        <div className="animate-reveal-up relative mx-auto mt-14 max-w-5xl" style={{ animationDelay: "380ms" }}>
          <div className="absolute -inset-x-8 -top-8 bottom-10 rounded-[32px] bg-gradient-to-b from-[var(--accent)]/12 via-[#7c5cff]/10 to-transparent blur-2xl" />
          <div className="glass relative overflow-hidden rounded-3xl shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]">
            {/* window bar */}
            <div className="flex items-center justify-between border-b border-white/8 px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                <span className="ml-3 hidden items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 font-mono2 text-[11px] text-white/50 sm:flex">
                  <MousePointerClick size={12} /> prism.studio/live-demo
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLive((v) => !v)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition",
                    live ? "bg-emerald-400/15 text-emerald-300" : "bg-white/8 text-white/60"
                  )}
                >
                  {live ? <Pause size={11} /> : <Play size={11} />}
                  {live ? "LIVE" : "PAUSED"}
                  {live && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />}
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-[220px_1fr]">
              {/* sidebar */}
              <div className="hidden border-r border-white/8 p-4 lg:block">
                <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-white/5 p-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#7c5cff] to-[#ff5ca8] text-xs font-bold">L</span>
                  <div>
                    <p className="text-[12px] font-semibold">Lumen Finance</p>
                    <p className="font-mono2 text-[10px] text-white/40">PRODUCTION</p>
                  </div>
                </div>
                <div className="space-y-1">
                  {TABS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={cn(
                        "w-full rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition",
                        tab === t ? "bg-[var(--accent)] font-semibold text-black" : "text-white/55 hover:bg-white/6 hover:text-white"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                  {["Prototype", "Experiments", "Settings"].map((t) => (
                    <button key={t} className="w-full rounded-xl px-3 py-2.5 text-left text-[13px] text-white/35 transition hover:bg-white/5 hover:text-white/70">
                      {t}
                    </button>
                  ))}
                </div>
                <div className="mt-6 rounded-xl border border-white/8 bg-gradient-to-br from-white/6 to-transparent p-3">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold"><TrendingUp size={12} className="text-[var(--accent)]" /> Health score</p>
                  <p className="mt-1 font-display text-2xl font-bold">98<span className="text-sm text-white/40">/100</span></p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[98%] rounded-full bg-[var(--accent)]" />
                  </div>
                </div>
              </div>

              {/* main */}
              <div className="p-4 sm:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-2 lg:hidden">
                    {TABS.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={cn(
                          "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                          tab === t ? "bg-[var(--accent)] text-black" : "bg-white/8 text-white/60"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <h3 className="hidden font-display text-lg font-bold lg:block">
                    {tab === "Overview" ? "Growth overview" : tab === "Analytics" ? "Realtime analytics" : "Team activity"}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <span className="font-mono2">RANGE</span>
                    <input
                      type="range" min={7} max={90} value={range}
                      onChange={(e) => setRange(Number(e.target.value))}
                      className="w-24 sm:w-32"
                    />
                    <span className="rounded-md bg-white/8 px-2 py-1 font-mono2 text-white">{range}d</span>
                  </div>
                </div>

                {tab === "Overview" && (
                  <div className="animate-pop-in">
                    <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                      {[
                        { k: "Visitors", v: visitors.toLocaleString(), d: "+18.2%", up: true },
                        { k: "Conversion", v: `${conversion}%`, d: "+0.8pt", up: true },
                        { k: "Revenue", v: `$${(visitors * 1.9 / 1000).toFixed(1)}k`, d: "+24%", up: true },
                      ].map((s) => (
                        <div key={s.k} className="rounded-2xl border border-white/8 bg-white/[0.03] p-3 sm:p-4">
                          <p className="text-[10px] font-medium uppercase tracking-widest text-white/40 sm:text-[11px]">{s.k}</p>
                          <p className="mt-1 font-display text-base font-bold tabular-nums sm:text-2xl">{s.v}</p>
                          <p className="mt-0.5 text-[11px] font-semibold text-emerald-400">{s.d} ↗</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 rounded-2xl border border-white/8 bg-white/[0.02] p-3 sm:p-4">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-semibold text-white/70">Signup velocity</span>
                        <span className="flex items-center gap-1.5 font-mono2 text-white/40">
                          <span className="h-2 w-2 rounded-full" style={{ background: "var(--accent)" }} /> live feed
                        </span>
                      </div>
                      <Sparkline data={series} color="var(--accent)" />
                    </div>
                  </div>
                )}

                {tab === "Analytics" && (
                  <div className="animate-pop-in grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <p className="text-xs font-semibold text-white/60">Traffic by channel</p>
                      <div className="mt-3 space-y-2.5">
                        {[
                          ["Organic", 72, "var(--accent)"],
                          ["Referral", 48, "#7c5cff"],
                          ["Social", 61, "#ff5ca8"],
                          ["Paid", 34, "#38e1ff"],
                        ].map(([label, pct, c]) => (
                          <div key={label as string}>
                            <div className="mb-1 flex justify-between text-[11px]">
                              <span className="text-white/60">{label}</span>
                              <span className="font-mono2 text-white">{pct}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/8">
                              <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: c as string }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <p className="text-xs font-semibold text-white/60">Top pages</p>
                      <div className="mt-3 space-y-2">
                        {[["/pricing", "12.4k", "+31%"], ["/features", "9.8k", "+18%"], ["/manifesto", "7.1k", "+64%"], ["/changelog", "4.2k", "+9%"]].map(([p, v, d]) => (
                          <div key={p} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2.5 text-[12px]">
                            <span className="font-mono2 text-white/70">{p}</span>
                            <span className="flex items-center gap-2"><b>{v}</b><span className="text-emerald-400">{d}</span></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {tab === "Activity" && (
                  <div className="animate-pop-in space-y-2">
                    {[
                      ["MC", "Maya shipped Onboarding v3", "2 min ago", "#d4ff3f"],
                      ["JW", "Jonas approved hero motion", "18 min ago", "#7c5cff"],
                      ["AO", "Amara left 4 comments on pricing", "1 hr ago", "#38e1ff"],
                      ["DF", "Deploy to production succeeded", "3 hrs ago", "#ff5ca8"],
                    ].map(([ini, msg, time, c]) => (
                      <div key={msg} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-bold text-black" style={{ background: c }}>{ini}</span>
                        <p className="flex-1 text-[13px] text-white/75">{msg}</p>
                        <span className="font-mono2 text-[10px] text-white/35">{time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* floating chips */}
          <div className="absolute -left-4 top-24 hidden animate-[float_7s_ease-in-out_infinite] items-center gap-2 rounded-2xl border border-white/10 bg-[#121219]/95 px-4 py-3 shadow-2xl backdrop-blur xl:flex">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-400/15 text-emerald-300"><TrendingUp size={17} /></span>
            <div><p className="text-xs font-bold">+212% conversion</p><p className="text-[11px] text-white/45">Lumen · after relaunch</p></div>
          </div>
          <div className="absolute -right-4 bottom-24 hidden animate-[float_8s_ease-in-out_1.2s_infinite] items-center gap-2 rounded-2xl border border-white/10 bg-[#121219]/95 px-4 py-3 shadow-2xl backdrop-blur xl:flex">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent)]/15 text-[var(--accent)]"><Zap size={17} /></span>
            <div><p className="text-xs font-bold">0.9s LCP</p><p className="text-[11px] text-white/45">Edge-rendered worldwide</p></div>
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <a href="#services" className="flex flex-col items-center gap-2 text-[11px] font-medium tracking-[0.2em] text-white/35 transition hover:text-white">
            SCROLL <ArrowDown size={15} className="animate-bounce" />
          </a>
        </div>
      </div>
    </section>
  );
}
