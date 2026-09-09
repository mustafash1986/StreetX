import { useState } from "react";
import {
  ArrowUpRight,
  Check,
  Mail,
  MapPin,
  Phone,
  Globe,
  AtSign,
  Palette,
  Briefcase,
  Loader2,
  CalendarCheck,
} from "lucide-react";
import { cn } from "../utils/cn";

const BUDGETS = ["<$10k", "$10–25k", "$25–50k", "$50k+"];
const TYPES = ["Brand", "Website", "Product", "Motion/3D", "Growth"];

export function Contact() {
  const [form, setForm] = useState({ name: "", email: "", budget: "$10–25k", types: ["Website"] as string[], message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const toggleType = (t: string) =>
    setForm((f) => ({
      ...f,
      types: f.types.includes(t) ? f.types.filter((x) => x !== t) : [...f.types, t],
    }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = "Tell us your name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Enter a valid email";
    if (form.types.length === 0) errs.types = "Pick at least one";
    if (form.message.trim().length < 10) errs.message = "Give us a little more detail (10+ chars)";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setStatus("sending");
    setTimeout(() => setStatus("sent"), 1400);
  };

  if (status === "sent") {
    return (
      <section id="contact" className="mx-auto max-w-7xl scroll-mt-28 px-4 pb-24 sm:px-6">
        <div className="animate-pop-in relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-[#15151f] to-[#0b0b11] p-10 text-center sm:p-16">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[var(--accent)] text-black">
            <Check size={36} strokeWidth={3} />
          </div>
          <h2 className="mx-auto mt-6 max-w-xl font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Brief received. <span className="text-[var(--accent)]">We're on it.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-white/60">
            Thanks {form.name.split(" ")[0]} — a senior strategist (not a bot) will reply within
            one business day with next steps and a fixed quote window.
          </p>
          <div className="mx-auto mt-8 flex max-w-md flex-col gap-2.5 sm:flex-row">
            <button onClick={() => { setStatus("idle"); setForm({ name: "", email: "", budget: "$10–25k", types: [], message: "" }); }} className="flex-1 rounded-2xl border border-white/15 py-3.5 text-sm font-semibold transition hover:border-white/40">
              Send another brief
            </button>
            <a href="#top" className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] py-3.5 text-sm font-bold text-black">
              Back to top <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="mx-auto max-w-7xl scroll-mt-28 px-4 pb-24 sm:px-6">
      <div className="reveal relative overflow-hidden rounded-[28px] border border-white/10">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[var(--accent)]/15 blur-[100px]" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[#7c5cff]/20 blur-[100px]" />
        <div className="relative grid lg:grid-cols-[1fr_1.1fr]">
          {/* left */}
          <div className="bg-[#0e0e15]/90 p-7 sm:p-10">
            <p className="font-mono2 text-xs tracking-[0.25em] text-[var(--accent)]">07 — CONTACT</p>
            <h2 className="mt-3 font-display text-4xl font-bold leading-[1.02] tracking-tight sm:text-5xl">
              Let's make something <span className="shimmer-text">iconic.</span>
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-white/55">
              Tell us where you want to go. We'll reply within 24h with honest advice,
              a fixed price and a start date — even if we're not the right fit.
            </p>
            <div className="mt-7 space-y-3 text-sm">
              <a href="mailto:hello@prism.studio" className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition hover:border-white/25">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent)]/15 text-[var(--accent)]"><Mail size={18} /></span>
                <span><b>hello@prism.studio</b><br /><span className="text-xs text-white/45">Replies within 24h</span></span>
              </a>
              <div className="grid grid-cols-2 gap-3">
                <span className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-[13px] text-white/70">
                  <Phone size={16} className="text-[var(--accent)]" /> +1 212 555 0184
                </span>
                <span className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-[13px] text-white/70">
                  <MapPin size={16} className="text-[var(--accent)]" /> NYC · LDN · TYO
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-[var(--accent)]/25 bg-[var(--accent)]/8 p-4">
                <CalendarCheck size={22} className="shrink-0 text-[var(--accent)]" />
                <p className="text-[13px] leading-snug text-white/75">
                  <b className="text-white">Next availability: Sept 22.</b> 2 sprint slots + 1 partner slot for Q4.
                </p>
              </div>
            </div>
          </div>

          {/* form */}
          <form onSubmit={submit} className="border-t border-white/10 bg-[#121219] p-7 sm:p-10 lg:border-l lg:border-t-0" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-white/50">Name *</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ada Lovelace"
                  className={cn("w-full rounded-xl border bg-white/[0.04] px-4 py-3 text-sm outline-none transition placeholder:text-white/25 focus:border-[var(--accent)]", errors.name ? "border-red-500/60" : "border-white/10")}
                />
                {errors.name && <span className="mt-1 block text-xs text-red-400">{errors.name}</span>}
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-white/50">Email *</span>
                <input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="ada@company.com"
                  type="email"
                  className={cn("w-full rounded-xl border bg-white/[0.04] px-4 py-3 text-sm outline-none transition placeholder:text-white/25 focus:border-[var(--accent)]", errors.email ? "border-red-500/60" : "border-white/10")}
                />
                {errors.email && <span className="mt-1 block text-xs text-red-400">{errors.email}</span>}
              </label>
            </div>

            <div className="mt-5">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-widest text-white/50">Project type *</span>
              <div className="flex flex-wrap gap-2">
                {TYPES.map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => toggleType(t)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-[13px] font-semibold transition",
                      form.types.includes(t) ? "border-transparent bg-[var(--accent)] text-black" : "border-white/12 text-white/60 hover:border-white/30 hover:text-white"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {errors.types && <span className="mt-1 block text-xs text-red-400">{errors.types}</span>}
            </div>

            <div className="mt-5">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-widest text-white/50">Budget</span>
              <div className="grid grid-cols-4 gap-2">
                {BUDGETS.map((b) => (
                  <button
                    type="button"
                    key={b}
                    onClick={() => setForm({ ...form, budget: b })}
                    className={cn(
                      "rounded-xl border px-2 py-2.5 font-mono2 text-[11px] transition sm:text-xs",
                      form.budget === b ? "border-transparent bg-white text-black font-bold" : "border-white/12 text-white/55 hover:border-white/30"
                    )}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <label className="mt-5 block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-white/50">About the project *</span>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={4}
                placeholder="Goals, timeline, links to what you love (and hate)…"
                className={cn("w-full resize-none rounded-xl border bg-white/[0.04] px-4 py-3 text-sm outline-none transition placeholder:text-white/25 focus:border-[var(--accent)]", errors.message ? "border-red-500/60" : "border-white/10")}
              />
              {errors.message && <span className="mt-1 block text-xs text-red-400">{errors.message}</span>}
            </label>

            <button
              type="submit"
              disabled={status === "sending"}
              className="group mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] py-4 text-[15px] font-bold text-black transition hover:brightness-110 disabled:opacity-70"
            >
              {status === "sending" ? (<><Loader2 size={18} className="animate-spin" /> Sending brief…</>) : (<>Send the brief <ArrowUpRight size={18} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></>)}
            </button>
            <p className="mt-3 text-center text-[11px] text-white/35">NDA-friendly · No spam, ever · Avg. reply time 7h</p>
          </form>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/8 bg-[#07070b]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="flex flex-col justify-between gap-10 lg:flex-row">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent)] font-display text-lg font-bold text-black">P</span>
              <span className="font-display text-lg font-bold">PRISM<sup className="text-[10px] text-white/50">®</sup></span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/50">
              Award-winning digital product studio. Brands, websites and products
              that defy ordinary — designed & engineered under one roof.
            </p>
            <div className="mt-5 flex gap-2">
              {[Globe, AtSign, Palette, Briefcase].map((Icon, i) => (
                <a key={i} href="#top" aria-label="Social link" className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/60 transition hover:border-transparent hover:bg-[var(--accent)] hover:text-black">
                  <Icon size={17} />
                </a>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {[
              { h: "Studio", links: ["Work", "Services", "Process", "Pricing", "Journal"] },
              { h: "Company", links: ["About", "Careers", "Press kit", "Contact", "Legal"] },
              { h: "Socials", links: ["X / Twitter", "Instagram", "Dribbble", "LinkedIn", "Are.na"] },
            ].map((col) => (
              <div key={col.h}>
                <p className="font-mono2 text-[11px] tracking-[0.2em] text-white/35">{col.h.toUpperCase()}</p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a href="#top" className="text-sm text-white/60 transition hover:text-[var(--accent)]">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 select-none overflow-hidden">
          <p className="whitespace-nowrap text-center font-display text-[16.5vw] font-bold leading-none tracking-tight text-white/[0.045] lg:text-[180px]">
            PRISM®
          </p>
        </div>
        <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-white/8 pt-6 text-xs text-white/35 sm:flex-row">
          <p>© 2026 PRISM Studio LLC. All rights reserved.</p>
          <p className="font-mono2">DESIGNED & BUILT WITH OBSESSION IN NYC — v4.2.0</p>
        </div>
      </div>
    </footer>
  );
}
