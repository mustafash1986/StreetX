import { useMemo, useState } from "react";
import { ArrowUpRight, X, Award, Calendar, User } from "lucide-react";
import { cn } from "../utils/cn";
import { PROJECTS, type Project } from "../data/content";

const FILTERS = ["All", "Branding", "Web", "Product", "Motion"] as const;

export function Work({ onOpen }: { onOpen: (p: Project) => void }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const list = useMemo(
    () => (filter === "All" ? PROJECTS : PROJECTS.filter((p) => p.category === filter)),
    [filter]
  );
  return (
    <section id="work" className="mx-auto max-w-7xl scroll-mt-28 px-4 py-24 sm:px-6">
      <div className="reveal flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="font-mono2 text-xs tracking-[0.25em] text-[var(--accent)]">02 — SELECTED WORK</p>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Proof, not promises.
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full border px-4 py-2 text-[13px] font-semibold transition",
                filter === f
                  ? "border-transparent bg-[var(--accent)] text-black"
                  : "border-white/12 bg-white/[0.03] text-white/60 hover:border-white/30 hover:text-white"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p, i) => (
          <article
            key={p.id}
            onClick={() => onOpen(p)}
            className={cn(
              "reveal group cursor-pointer overflow-hidden rounded-3xl border border-white/8 bg-[#0e0e15] card-hover",
              i === 1 && "reveal-delay-1",
              i === 2 && "reveal-delay-2"
            )}
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              <img
                src={p.image}
                alt={p.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e15] via-transparent to-transparent" />
              <div className="absolute left-4 top-4 flex gap-2">
                <span className="rounded-full bg-black/55 px-3 py-1 font-mono2 text-[10px] tracking-widest text-white backdrop-blur">
                  {p.category.toUpperCase()}
                </span>
                <span className="rounded-full bg-black/55 px-3 py-1 font-mono2 text-[10px] text-white/70 backdrop-blur">
                  {p.year}
                </span>
              </div>
              <span
                className="absolute bottom-4 right-4 grid h-11 w-11 place-items-center rounded-full bg-white text-black opacity-0 transition-all duration-300 group-hover:opacity-100"
                style={{ background: "var(--accent)" }}
              >
                <ArrowUpRight size={18} />
              </span>
            </div>
            <div className="p-5 sm:p-6">
              <p className="font-mono2 text-[11px] tracking-widest text-white/40">{p.client.toUpperCase()}</p>
              <h3 className="mt-1 font-display text-2xl font-bold tracking-tight transition group-hover:text-[var(--accent)]">
                {p.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/55">{p.tagline}</p>
              <div className="mt-4 flex items-center gap-4 border-t border-white/8 pt-4">
                {p.stats.slice(0, 2).map((s) => (
                  <div key={s.label}>
                    <p className="font-display text-lg font-bold" style={{ color: p.accent }}>{s.value}</p>
                    <p className="text-[11px] text-white/45">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function CaseModal({ project, onClose, onNext }: { project: Project | null; onClose: () => void; onNext: () => void }) {
  if (!project) return null;
  return (
    <div className="fixed inset-0 z-[96] flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-pop-in relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-white/12 bg-[#101016] sm:rounded-3xl">
        <div className="relative h-60 overflow-hidden sm:h-80">
          <img src={project.image} alt={project.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#101016] via-[#101016]/30 to-transparent" />
          <button
            onClick={onClose}
            aria-label="Close case study"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-black/60 backdrop-blur transition hover:bg-white hover:text-black"
          >
            <X size={18} />
          </button>
          <div className="absolute bottom-4 left-5 right-5 flex flex-wrap items-end justify-between gap-3 sm:left-8 sm:right-8">
            <div>
              <p className="font-mono2 text-[11px] tracking-[0.2em] text-white/60">
                {project.category.toUpperCase()} — {project.year}
              </p>
              <h3 className="font-display text-3xl font-bold sm:text-4xl">{project.title}</h3>
            </div>
            <span className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-black" style={{ background: project.accent }}>
              <Award size={13} /> {project.stats[0].value} {project.stats[0].label}
            </span>
          </div>
        </div>
        <div className="p-5 sm:p-8">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-white/50">
            <span className="flex items-center gap-1.5"><User size={14} /> {project.client}</span>
            <span className="flex items-center gap-1.5"><Calendar size={14} /> Delivered {project.year}</span>
          </div>
          <p className="mt-4 font-display text-lg font-medium leading-snug text-white/90">{project.tagline}</p>
          <p className="mt-3 text-[14.5px] leading-relaxed text-white/60">{project.description}</p>
          <div className="mt-6 grid grid-cols-3 gap-2.5">
            {project.stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/8 bg-white/[0.03] p-3 text-center sm:p-4">
                <p className="font-display text-xl font-bold sm:text-2xl" style={{ color: project.accent }}>{s.value}</p>
                <p className="mt-1 text-[11px] text-white/50">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {project.tags.map((t) => (
              <span key={t} className="rounded-full bg-white/6 px-3 py-1.5 text-xs font-medium text-white/65">{t}</span>
            ))}
          </div>
          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
            <a href="#contact" onClick={onClose} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-sm font-bold text-black transition hover:bg-[var(--accent)]">
              Get results like this <ArrowUpRight size={16} />
            </a>
            <button onClick={onNext} className="flex-1 rounded-2xl border border-white/12 py-3.5 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:text-white">
              Next project →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Studio() {
  return (
    <section id="studio" className="mx-auto max-w-7xl scroll-mt-28 px-4 py-10 sm:px-6">
      <div className="reveal relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-[#14141d] to-[#0b0b11]">
        <div className="grid lg:grid-cols-2">
          <div className="relative min-h-[280px]">
            <img
              src="https://images.pexels.com/photos/7675029/pexels-photo-7675029.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200"
              alt="PRISM studio team at work"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#101018] opacity-60 lg:opacity-100" style={{ background: "linear-gradient(to right, transparent 40%, #12121a 100%)" }} />
            <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-2xl bg-black/60 px-4 py-3 backdrop-blur">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
              <p className="text-xs font-semibold">Studio live — NYC · LDN · TYO</p>
            </div>
          </div>
          <div className="p-7 sm:p-12">
            <p className="font-mono2 text-xs tracking-[0.25em] text-[var(--accent)]">THE STUDIO</p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              Senior only. <br /> No handoffs, no juniors, no drama.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-white/60">
              We're 18 designers, engineers and strategists who've shipped for unicorns and
              garage startups alike. Every project gets founders' eyes, weekly demos and a
              team that argues with you — respectfully — when it matters.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                ["18", "Senior makers"],
                ["11yrs", "Avg. experience… just kidding — 8"],
                ["04", "Time zones covered"],
                ["72h", "First concepts"],
              ].map(([v, l]) => (
                <div key={l} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <p className="font-display text-2xl font-bold text-[var(--accent)]">{v}</p>
                  <p className="mt-1 text-xs text-white/50">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
