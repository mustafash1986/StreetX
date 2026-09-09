import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Quote, Check, Minus, Plus, ArrowUpRight } from "lucide-react";
import { cn } from "../utils/cn";
import { TESTIMONIALS, FAQS } from "../data/content";

export function Testimonials() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % TESTIMONIALS.length), 5200);
    return () => clearInterval(t);
  }, [paused]);
  const t = TESTIMONIALS[idx];
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <div className="reveal text-center">
        <p className="font-mono2 text-xs tracking-[0.25em] text-[var(--accent)]">04 — LOVE LETTERS</p>
        <h2 className="mx-auto mt-3 max-w-2xl font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Clients who came for a site, stayed for everything.
        </h2>
      </div>
      <div
        className="reveal relative mx-auto mt-10 max-w-3xl"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="glass relative overflow-hidden rounded-[28px] p-7 sm:p-10">
          <Quote size={44} className="text-[var(--accent)] opacity-80" />
          <div key={idx} className="animate-pop-in">
            <p className="mt-4 font-display text-xl font-medium leading-snug text-white/90 sm:text-2xl">
              “{t.quote}”
            </p>
            <div className="mt-7 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full text-sm font-bold text-black" style={{ background: t.color }}>
                  {t.initials}
                </span>
                <div>
                  <p className="text-sm font-bold">{t.name}</p>
                  <p className="text-xs text-white/50">{t.role}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIdx((idx - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)} aria-label="Previous testimonial" className="grid h-10 w-10 place-items-center rounded-full border border-white/12 transition hover:border-transparent hover:bg-[var(--accent)] hover:text-black">
                  <ChevronLeft size={18} />
                </button>
                <button onClick={() => setIdx((idx + 1) % TESTIMONIALS.length)} aria-label="Next testimonial" className="grid h-10 w-10 place-items-center rounded-full border border-white/12 transition hover:border-transparent hover:bg-[var(--accent)] hover:text-black">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-center gap-2">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === idx ? "w-8 bg-[var(--accent)]" : "w-2 bg-white/20 hover:bg-white/40"
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function Pricing() {
  const [yearly, setYearly] = useState(true);
  const plans = [
    {
      name: "Sprint",
      blurb: "One sharp problem, solved in 2 weeks.",
      monthly: 4800,
      quarterly: 4800,
      unit: "fixed",
      cta: "Book a sprint",
      featured: false,
      features: ["Landing page or rebrand slice", "Senior designer + engineer", "Motion & CMS included", "Launch in 14 days", "30-day support"],
    },
    {
      name: "Studio Partner",
      blurb: "Your embedded product team, monthly.",
      monthly: 7500,
      quarterly: 6375,
      unit: "/mo",
      cta: "Become a partner",
      featured: true,
      features: ["Design + engineering pod", "Unlimited requests, 1 at a time", "Weekly demos & async Loom", "A/B testing & CRO", "Pause or cancel anytime"],
    },
    {
      name: "Enterprise",
      blurb: "Multi-brand, multi-market firepower.",
      monthly: 14000,
      quarterly: 11900,
      unit: "/mo",
      cta: "Talk to us",
      featured: false,
      features: ["Dedicated pods + SLA", "Design system governance", "Security & SSO review", "Quarterly exec readouts", "Global rollout support"],
    },
  ];
  return (
    <section id="pricing" className="mx-auto max-w-7xl scroll-mt-28 px-4 py-10 sm:px-6">
      <div className="reveal text-center">
        <p className="font-mono2 text-xs tracking-[0.25em] text-[var(--accent)]">05 — PRICING</p>
        <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">Simple pricing, serious output.</h2>
        <div className="mt-6 inline-flex items-center rounded-full border border-white/10 bg-white/5 p-1 text-sm font-semibold">
          <button onClick={() => setYearly(false)} className={cn("rounded-full px-5 py-2 transition", !yearly ? "bg-white text-black" : "text-white/60")}>
            Monthly
          </button>
          <button onClick={() => setYearly(true)} className={cn("flex items-center gap-2 rounded-full px-5 py-2 transition", yearly ? "bg-[var(--accent)] text-black" : "text-white/60")}>
            Quarterly <span className="rounded-full bg-black/20 px-2 py-0.5 text-[10px]">−15%</span>
          </button>
        </div>
      </div>
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {plans.map((p, i) => (
          <div
            key={p.name}
            className={cn(
              "reveal relative rounded-[26px] border p-7 transition sm:p-8",
              p.featured
                ? "border-transparent bg-gradient-to-b from-white/[0.09] to-white/[0.03] shadow-[0_0_80px_-20px_var(--accent)]"
                : "border-white/10 bg-white/[0.02]",
              i === 1 && "reveal-delay-1",
              i === 2 && "reveal-delay-2"
            )}
          >
            {p.featured && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--accent)] px-4 py-1 text-[11px] font-bold uppercase tracking-widest text-black">
                Most popular
              </span>
            )}
            <h3 className="font-display text-xl font-bold">{p.name}</h3>
            <p className="mt-1 text-sm text-white/50">{p.blurb}</p>
            <p className="mt-5 flex items-baseline gap-1">
              <span className="font-display text-5xl font-bold tracking-tight tabular-nums">
                ${(yearly ? p.quarterly : p.monthly).toLocaleString()}
              </span>
              <span className="text-sm text-white/45">{p.unit}</span>
            </p>
            <p className="mt-1 font-mono2 text-[11px] text-white/35">
              {p.name === "Sprint" ? "ONE-TIME · FIXED SCOPE" : yearly ? "BILLED QUARTERLY · PAUSE ANYTIME" : "BILLED MONTHLY · PAUSE ANYTIME"}
            </p>
            <a
              href="#contact"
              className={cn(
                "group mt-6 flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold transition",
                p.featured ? "bg-[var(--accent)] text-black hover:brightness-110" : "border border-white/15 hover:border-white/40"
              )}
            >
              {p.cta} <ArrowUpRight size={16} />
            </a>
            <ul className="mt-6 space-y-2.5 border-t border-white/8 pt-6">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-white/70">
                  <span className={cn("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full", p.featured ? "bg-[var(--accent)] text-black" : "bg-white/10 text-white")}>
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="reveal mt-6 text-center text-[13px] text-white/40">
        Need something bespoke? <a href="#contact" className="font-semibold text-white underline underline-offset-4">Get a fixed quote in 48h →</a>
      </p>
    </section>
  );
}

export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-28 px-4 py-24 sm:px-6">
      <div className="reveal text-center">
        <p className="font-mono2 text-xs tracking-[0.25em] text-[var(--accent)]">06 — FAQ</p>
        <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">Questions? Answered.</h2>
      </div>
      <div className="mt-10 space-y-3">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <div
              key={f.q}
              className={cn(
                "reveal overflow-hidden rounded-2xl border transition",
                isOpen ? "border-white/20 bg-white/[0.05]" : "border-white/8 bg-white/[0.02]"
              )}
            >
              <button
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
              >
                <span className="font-display text-[16px] font-bold sm:text-lg">{f.q}</span>
                <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full transition", isOpen ? "bg-[var(--accent)] text-black" : "bg-white/8")}>
                  {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                </span>
              </button>
              <div className={cn("grid transition-all duration-400", isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                <div className="overflow-hidden">
                  <p className="px-5 pb-6 text-[14.5px] leading-relaxed text-white/60 sm:px-6">{f.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
