"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [navLoginOpen, setNavLoginOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (!res || res.error) {
      setError("That email and password don't match our records.");
      return;
    }

    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();
    router.push(
      session?.user?.role === "SUPERADMIN"
        ? "/master"
        : session?.user?.role === "ADMIN"
        ? "/admin"
        : "/dashboard"
    );
  }

  const bg = "#0D2318";
  const bgSoft = "#122E20";
  const cream = "#F3EFE2";
  const acid = "#CFF443";
  const line = "rgba(243,239,226,0.14)";

  return (
    <main style={{ background: bg, color: cream, fontFamily: "var(--font-bricolage), sans-serif" }} className="min-h-screen">
      {/* Nav */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between px-6 sm:px-10 py-5"
        style={{ background: bg, borderBottom: `1px solid ${line}` }}
      >
        <p className="font-bold tracking-tight text-sm sm:text-base">THE COACHING HUB</p>
        <nav className="hidden md:flex items-center gap-6 text-sm" style={{ color: "rgba(243,239,226,0.7)" }}>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          <a href="#for-coaches" className="hover:text-white transition-colors">For coaches</a>
          <a href="#why" className="hover:text-white transition-colors">About</a>
          <a href="#start" className="hover:text-white transition-colors">Contact</a>
        </nav>

        <div className="relative">
          {!navLoginOpen ? (
            <button
              onClick={() => setNavLoginOpen(true)}
              className="focus-ring text-sm font-medium px-4 py-2 rounded-full"
              style={{ background: cream, color: bg }}
            >
              Log in
            </button>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="absolute right-0 top-0 flex items-center gap-2 rounded-full px-2 py-1.5 shadow-lg"
              style={{ background: cream }}
            >
              <input
                type="email"
                required
                autoFocus
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-32 sm:w-40 rounded-full px-3 py-1.5 text-xs"
                style={{ background: "#fff", color: bg }}
              />
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-24 sm:w-32 rounded-full px-3 py-1.5 text-xs"
                style={{ background: "#fff", color: bg }}
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap"
                style={{ background: bg, color: cream }}
              >
                {loading ? "…" : "Sign in"}
              </button>
              <button
                type="button"
                onClick={() => setNavLoginOpen(false)}
                className="text-xs px-1"
                style={{ color: bg }}
                aria-label="Close login"
              >
                ✕
              </button>
            </form>
          )}
          {error && navLoginOpen && (
            <p
              className="absolute right-0 top-12 w-64 text-xs rounded-md px-3 py-2"
              style={{ background: "#5c1d1d", color: "#fde8e8" }}
            >
              {error}
            </p>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 sm:px-10 pt-16 pb-20 text-center max-w-4xl mx-auto">
        <span
          className="inline-block text-[11px] tracking-widest uppercase px-3 py-1 rounded-full mb-8"
          style={{ border: `1px solid ${line}`, color: "rgba(243,239,226,0.7)" }}
        >
          For business coaches &amp; strategists
        </span>
        <h1 className="font-extrabold leading-[0.95] text-5xl sm:text-6xl md:text-7xl mb-8">
          We remember,
          <br />
          so you can listen.
        </h1>
        <p className="max-w-xl mx-auto text-base sm:text-lg mb-10" style={{ color: "rgba(243,239,226,0.75)" }}>
          Every client, every note, every thing they swore they'd do by Friday — in
          one hub that holds the lot. You turn up and coach. It does the
          remembering.
        </p>
        <a
          href="#start"
          className="focus-ring inline-block rounded-full px-7 py-3 text-sm font-semibold mb-4"
          style={{ background: cream, color: bg }}
        >
          Nose around first
        </a>
        <p className="text-[11px] tracking-wide uppercase" style={{ color: "rgba(243,239,226,0.45)" }}>
          Free forever for your first three clients · No card · No demo call gatekeeping
        </p>
      </section>

      {/* Dashboard mock */}
      <section className="px-6 sm:px-10 mb-14">
        <div
          className="max-w-3xl mx-auto rounded-2xl overflow-hidden"
          style={{ background: bgSoft, border: `1px solid ${line}` }}
        >
          <div className="grid sm:grid-cols-[160px_1fr]">
            <div className="p-5 text-xs space-y-3" style={{ borderRight: `1px solid ${line}` }}>
              <p className="uppercase tracking-wide" style={{ color: "rgba(243,239,226,0.4)" }}>Practice</p>
              <div className="flex justify-between rounded-md px-2 py-1.5" style={{ background: "rgba(243,239,226,0.08)" }}>
                <span>Clients</span><span>14</span>
              </div>
              <div className="flex justify-between px-2"><span>This week</span><span>3</span></div>
              <div className="flex justify-between px-2"><span>Promises due</span><span>7</span></div>
              <div className="px-2" style={{ color: "rgba(243,239,226,0.55)" }}>Programmes</div>
              <div className="px-2" style={{ color: "rgba(243,239,226,0.55)" }}>Notes</div>
            </div>

            <div className="p-5">
              <p className="font-semibold text-sm mb-1">Nadia Osman</p>
              <p className="text-[10px] uppercase tracking-wide mb-3" style={{ color: "rgba(243,239,226,0.4)" }}>
                Founder, Meridian Labs
              </p>
              <div className="rounded-lg p-3 mb-3 text-xs leading-relaxed" style={{ background: "rgba(243,239,226,0.06)" }}>
                <span className="uppercase tracking-wide mr-2" style={{ color: "rgba(243,239,226,0.4)" }}>
                  Note · 24 Jul
                </span>
                Still running sales herself, and defending it beautifully. She'll
                revisit the org chart before we speak again, and Tom takes the
                pipeline review off her.
              </div>
              <div className="text-xs space-y-1.5" style={{ color: "rgba(243,239,226,0.6)" }}>
                <div className="flex justify-between"><span>Shortlist 2 AEs · Nadia</span><span>7 Aug</span></div>
                <div className="flex justify-between"><span>Draft new pricing page · Tom</span><span>12 Aug</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Before/after */}
      <section className="px-6 sm:px-10 mb-24 max-w-3xl mx-auto grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl p-6" style={{ border: `1px solid ${line}` }}>
          <p className="text-[11px] uppercase tracking-wide mb-3" style={{ color: "rgba(243,239,226,0.4)" }}>
            Your Monday, currently
          </p>
          <ul className="space-y-2 text-sm" style={{ color: "rgba(243,239,226,0.7)" }}>
            <li>✕ Four documents open, none of them the right one</li>
            <li>✕ "Remind me where we left it?"</li>
            <li>✕ Actions living in a notebook you left at home</li>
            <li>✕ Nine minutes of every session spent reconstructing the last one</li>
          </ul>
        </div>
        <div className="rounded-xl p-6" style={{ background: bgSoft, border: `1px solid ${line}` }}>
          <p className="text-[11px] uppercase tracking-wide mb-3" style={{ color: acid }}>
            Your Monday, in the hub
          </p>
          <ul className="space-y-2 text-sm">
            <li style={{ color: cream }}>✓ One page per client, open before the call connects</li>
            <li style={{ color: cream }}>✓ Last session's promises, ticked or not</li>
            <li style={{ color: cream }}>✓ Notes written where they belong, in one keystroke</li>
            <li style={{ color: cream }}>✓ You start at minute one, on the actual work</li>
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 sm:px-10 mb-24 max-w-4xl mx-auto">
        <div className="flex items-baseline justify-between mb-8 flex-wrap gap-2">
          <h2 className="text-3xl sm:text-4xl font-extrabold">How it works</h2>
          <span className="text-xs uppercase tracking-wide" style={{ color: "rgba(243,239,226,0.4)" }}>
            Three things, then you're off
          </span>
        </div>
        <div className="space-y-4">
          {[
            {
              n: "01",
              title: "Move your clients in",
              body: "Drag in the spreadsheet you've been calling a system. Contact, goals and history land on one page each.",
              meta: "Ten minutes · once · ever",
            },
            {
              n: "02",
              title: "Log a session, tick a promise",
              body: "Highlight the bit where they commit to something. It becomes a promise, with their name and a date on it.",
              meta: "Ninety seconds · each session",
            },
            {
              n: "03",
              title: "Turn up already knowing",
              body: "They see what's theirs to do. You see what moved. Nobody has to remember a Tuesday in June.",
              meta: "Eight minutes back · every time",
            },
          ].map((s) => (
            <div key={s.n} className="rounded-xl p-6 sm:p-8" style={{ background: cream, color: bg }}>
              <p className="text-4xl sm:text-5xl font-extrabold mb-2">{s.n}</p>
              <h3 className="text-xl font-bold mb-2">{s.title}</h3>
              <p className="text-sm mb-3" style={{ color: "rgba(13,35,24,0.75)" }}>
                {s.body}
              </p>
              <p className="text-[11px] uppercase tracking-wide" style={{ color: "rgba(13,35,24,0.45)" }}>
                {s.meta}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Opinionated */}
      <section id="for-coaches" className="px-6 sm:px-10 mb-24 max-w-3xl mx-auto">
        <p className="text-[11px] uppercase tracking-wide mb-2" style={{ color: "rgba(243,239,226,0.4)" }}>
          For coaches
        </p>
        <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Opinionated, so you needn't be</h2>
        <p className="text-sm mb-8" style={{ color: "rgba(243,239,226,0.7)" }}>
          A blank document makes no decisions. We've made them for you: notes
          belong to sessions, promises belong to people, and your framework is
          something you build once.
        </p>
        <div className="space-y-5">
          {[
            ["Private stays private.", "The unflattering observation is safe in here."],
            ["Programmes, not templates.", "Build it once, run it with all fourteen."],
            ["We do the chasing.", "Nobody enjoys writing \u201cjust circling back\u201d."],
            ["Leave whenever.", "Export the lot, no awkward conversation."],
          ].map(([bold, rest], i) => (
            <p key={i} className="text-sm">
              <span className="font-semibold mr-1" style={{ color: acid }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-semibold">{bold}</span> {rest}
            </p>
          ))}
        </div>
      </section>

      {/* Why we built it */}
      <section id="why" className="px-6 sm:px-10 mb-16 max-w-3xl mx-auto">
        <p className="text-[11px] uppercase tracking-wide mb-2" style={{ color: "rgba(243,239,226,0.4)" }}>
          Why we built it
        </p>
        <h2 className="text-2xl sm:text-3xl font-extrabold mb-4 leading-snug">
          We were coaches with brilliant sessions and a filing system made of
          good intentions.
        </h2>
        <p className="text-sm" style={{ color: "rgba(243,239,226,0.7)" }}>
          The coaching was never the hard part. Holding onto it was. So we
          built the dull infrastructure under the interesting work — then made
          it good-looking, because you'll be in it every day.
        </p>
      </section>

      {/* CTA */}
      <section id="start" className="px-6 sm:px-10 pb-20 max-w-md mx-auto">
        <div className="rounded-2xl p-8 text-center" style={{ background: cream, color: bg }}>
          <h3 className="text-xl font-bold mb-2">Start with the client you're most behind on</h3>
          <p className="text-sm mb-5" style={{ color: "rgba(13,35,24,0.7)" }}>
            Set them up in ten minutes. Or book twenty and we'll do it while
            you make a cup of tea.
          </p>
          <Link
            href="/signup"
            className="focus-ring block w-full rounded-full py-3 text-sm font-semibold mb-3"
            style={{ background: bg, color: cream }}
          >
            Get started free
          </Link>
          <a href="#" className="text-xs underline" style={{ color: "rgba(13,35,24,0.6)" }}>
            or book twenty minutes
          </a>
        </div>
      </section>

      <footer
        className="px-6 sm:px-10 py-6 flex items-center justify-between text-xs"
        style={{ borderTop: `1px solid ${line}`, color: "rgba(243,239,226,0.4)" }}
      >
        <span>THE COACHING HUB</span>
        <span>How it works · For coaches · About · Contact</span>
      </footer>
    </main>
  );
}
