import Link from 'next/link';

const titleMockups = [
  {
    name: 'Field Crest',
    eyebrow: 'Fantasy Football League',
    className: 'league-mark-brush text-5xl sm:text-7xl',
    note: 'closest to the painted field logo',
  },
  {
    name: 'Championship Stamp',
    eyebrow: 'Bouse In The Nose',
    className: 'league-mark-stamp text-5xl sm:text-7xl',
    note: 'more badge-like and loud',
  },
  {
    name: 'Tunnel Script',
    eyebrow: 'Fantasy League',
    className: 'league-mark-slash text-5xl sm:text-7xl',
    note: 'fast, angled, sporty',
  },
  {
    name: 'Broadcast Lockup',
    eyebrow: 'Bouse In The Nose',
    className: 'league-mark-broadcast text-5xl sm:text-7xl',
    note: 'cleaner for navigation and headers',
  },
];

const recapCards = [
  ['High Score', 'Bier Football Fame', '148.72', '+22.4 over league avg'],
  ['Closest Win', 'Bouse House', '0.86', 'won by less than a point'],
  ['Bench Pain', 'Nordic Blitz', '38.10', 'points left sitting'],
  ['Cold Snap', 'Goal Line Gold', '71.44', 'lowest weekly total'],
];

const records = [
  ['Highest Week', '184.92', 'Vikings Valhalla', 'Week 11'],
  ['Biggest Blowout', '+76.38', 'Bier Football Fame', '2025 semis'],
  ['Worst Beat', '0.12', 'Touchdown Taste', 'lost on Monday'],
  ['Longest Streak', '8W', 'Bouse House', 'regular season'],
];

export default function MockupsPage() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#050608] px-5 py-10 text-[#f5f8fb] sm:px-8">
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center opacity-[0.42] blur-[0.5px] saturate-[1.02] contrast-[0.92]"
        style={{ backgroundImage: "url('/stadium-background.png')" }}
      />
      <div className="pointer-events-none fixed inset-0 z-[1] bg-[linear-gradient(90deg,rgba(2,3,5,0.88)_0%,rgba(2,3,5,0.54)_50%,rgba(2,3,5,0.82)_100%),linear-gradient(180deg,rgba(2,3,5,0.42)_0%,rgba(2,3,5,0.82)_76%,#020305_100%)]" />
      <div className="pointer-events-none fixed inset-0 z-[2] bg-[radial-gradient(circle_at_50%_10%,rgba(255,190,89,0.20),transparent_30%),radial-gradient(circle_at_50%_40%,rgba(98,223,255,0.14),transparent_36%)]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <header className="mb-10 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="border border-white/10 bg-black/20 px-4 py-2 text-sm font-bold uppercase tracking-[0.16em] text-white/68 backdrop-blur-md transition hover:border-[#f9d98a]/40 hover:text-[#f9d98a]"
          >
            Back home
          </Link>
          <p className="text-right text-xs font-bold uppercase tracking-[0.18em] text-white/42">
            Separate design board
          </p>
        </header>

        <section className="mb-12 max-w-3xl">
          <p className="mb-4 text-sm font-black uppercase tracking-[0.28em] text-[#f9d98a]">
            Design board
          </p>
          <h1 className="text-4xl font-black text-white sm:text-6xl">
            Weekly Recap and Hall of Fame/Shame directions.
          </h1>
        </section>

        <section className="mb-16">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-[#62dfff]">
                Feature 4
              </p>
              <h2 className="mt-2 text-3xl font-black text-white sm:text-5xl">Weekly Recap</h2>
            </div>
            <p className="max-w-xl text-sm font-semibold leading-6 text-white/50">
              Smooth futuristic recap dashboard for high score, close wins, unlucky losses, and weekly chaos.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <article className="relative min-h-[32rem] overflow-hidden border border-[#62dfff]/18 bg-[#061018]/72 p-6 shadow-[0_30px_100px_rgba(98,223,255,0.10)] backdrop-blur-md">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(98,223,255,0.20),transparent_34%),linear-gradient(160deg,rgba(255,190,89,0.12),transparent_38%)]" />
              <div className="relative flex h-full flex-col justify-between gap-10">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-[#62dfff]">Pulse Recap</p>
                  <h3 className="mt-4 text-4xl font-black leading-none text-white">Week 1 Control Room</h3>
                  <p className="mt-4 max-w-md text-sm font-semibold leading-6 text-white/50">
                    A single weekly command panel with the biggest story first and smaller drama cards underneath.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {recapCards.map(([label, team, value, meta]) => (
                    <div key={label} className="border border-white/10 bg-black/24 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                      <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/35">{label}</p>
                      <p className="mt-3 text-3xl font-black text-[#f9d98a]">{value}</p>
                      <h4 className="mt-3 truncate text-sm font-bold text-white">{team}</h4>
                      <p className="mt-1 text-xs font-semibold text-white/42">{meta}</p>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <article className="relative min-h-[32rem] overflow-hidden border border-white/10 bg-black/30 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.32)] backdrop-blur-md">
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(98,223,255,0.16),transparent_28%),radial-gradient(circle_at_82%_20%,rgba(167,139,250,0.18),transparent_30%)]" />
              <div className="relative">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f9d98a]">Story Feed</p>
                <h3 className="mt-4 text-4xl font-black leading-none text-white">The Week In Receipts</h3>
                <div className="mt-8 space-y-3">
                  {[
                    ['01', 'Bier Football Fame posted the first monster week of the season.'],
                    ['02', 'Bouse House escaped with a margin small enough to start arguments.'],
                    ['03', 'Nordic Blitz left a starter-sized regret on the bench.'],
                    ['04', 'Goal Line Gold needs a rebound before the chat gets creative.'],
                  ].map(([index, copy]) => (
                    <div key={index} className="grid grid-cols-[2.5rem_1fr] gap-4 border border-white/10 bg-white/[0.035] p-4">
                      <span className="text-sm font-black text-[#62dfff]/70">{index}</span>
                      <p className="text-sm font-semibold leading-6 text-white/68">{copy}</p>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="mb-16">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-[#f9d98a]">
                Feature 11
              </p>
              <h2 className="mt-2 text-3xl font-black text-white sm:text-5xl">Hall of Fame / Shame</h2>
            </div>
            <p className="max-w-xl text-sm font-semibold leading-6 text-white/50">
              Permanent league records with a cinematic trophy-wall feel and enough edge for the shame side.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <article className="relative overflow-hidden border border-[#f9d98a]/20 bg-[#120d08]/70 p-6 shadow-[0_30px_110px_rgba(255,190,89,0.12)] backdrop-blur-md">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(255,190,89,0.30),transparent_34%),linear-gradient(135deg,rgba(98,223,255,0.10),transparent_42%)]" />
              <div className="relative">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f9d98a]">Record Wall</p>
                <h3 className="mt-4 text-4xl font-black leading-none text-white">Immortal Receipts</h3>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {records.map(([label, value, team, meta]) => (
                    <div key={label} className="border border-white/10 bg-black/26 p-5">
                      <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/34">{label}</p>
                      <p className="mt-4 text-4xl font-black text-[#f9d98a]">{value}</p>
                      <h4 className="mt-4 truncate text-base font-black text-white">{team}</h4>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/38">{meta}</p>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <article className="relative overflow-hidden border border-[#ff425c]/20 bg-[#110910]/70 p-6 shadow-[0_30px_110px_rgba(255,66,92,0.10)] backdrop-blur-md">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_16%,rgba(255,66,92,0.18),transparent_32%),linear-gradient(160deg,rgba(167,139,250,0.14),transparent_42%)]" />
              <div className="relative">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#ff7a8f]">Shame Index</p>
                <h3 className="mt-4 text-4xl font-black leading-none text-white">The Cold Case Shelf</h3>
                <div className="mt-8 space-y-3">
                  {[
                    ['Bench Crime', '42.6 points sat untouched'],
                    ['Lowest Win', '88.1 points and somehow survived'],
                    ['Trade Regret', 'Moved the breakout RB one week early'],
                  ].map(([label, copy]) => (
                    <div key={label} className="border border-white/10 bg-black/24 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff7a8f]/78">{label}</p>
                      <p className="mt-3 text-lg font-black text-white">{copy}</p>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="mb-8 max-w-3xl">
          <p className="mb-4 text-sm font-black uppercase tracking-[0.28em] text-[#f9d98a]">
            League name mockups
          </p>
          <h2 className="text-3xl font-black text-white sm:text-5xl">
            Saved here for later.
          </h2>
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          {titleMockups.map((mockup) => (
            <article
              key={mockup.name}
              className="relative min-h-72 overflow-hidden border border-white/10 bg-black/28 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-sm"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_32%,rgba(255,190,89,0.18),transparent_32%),linear-gradient(135deg,rgba(98,223,255,0.10),transparent_38%)]" />
              <div className="relative flex h-full flex-col justify-between gap-8">
                <div>
                  <p className="mb-5 text-xs font-black uppercase tracking-[0.24em] text-[#f9d98a]/80">
                    {mockup.name}
                  </p>
                  <p className="text-sm font-bold uppercase tracking-[0.28em] text-white/48">
                    {mockup.eyebrow}
                  </p>
                </div>
                <h2 className={mockup.className}>Bouse In The Nose</h2>
                <p className="border-t border-white/10 pt-4 text-sm font-semibold text-white/46">
                  {mockup.note}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
