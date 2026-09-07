const teams = [
  { name: 'Velvet Blitz', record: '7-2', points: '1,184.6', trend: '+48.2' },
  { name: 'Sunday Static', record: '6-3', points: '1,102.4', trend: '+12.9' },
  { name: 'Fourth & Fernet', record: '5-4', points: '1,056.8', trend: '-8.1' },
  { name: 'Red Zone Royals', record: '5-4', points: '1,043.1', trend: '+21.5' },
];

const highlights = [
  {
    tag: 'Matchup of the Week',
    title: 'Velvet Blitz survives a 0.6 point Monday-night sweat',
    meta: 'Final: 132.4 - 131.8',
  },
  {
    tag: 'Waiver Wire',
    title: 'Sunday Static wins the FAAB fight and adds a starting RB',
    meta: '$37 bid, next closest $34',
  },
  {
    tag: 'Power Shift',
    title: 'Red Zone Royals jump two spots after a 41-point WR detonation',
    meta: 'Best weekly score in the league',
  },
];

const navItems = ['Home', 'Highlights'];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050608] text-[#f7f2e8]">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(196,35,35,0.28),transparent_32%),linear-gradient(180deg,#111318_0%,#050608_54%,#020203_100%)]" />
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#050608]/86 backdrop-blur-xl">
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <a href="#home" className="flex items-center gap-3" aria-label="Bose In The Nose home">
            <span className="grid h-11 w-11 place-items-center border border-[#d6a957]/70 bg-[#101217] text-lg font-black text-[#d6a957]">
              BN
            </span>
            <span>
              <span className="block text-sm font-semibold uppercase tracking-[0.24em] text-[#d6a957]">
                Fantasy League
              </span>
              <span className="block text-lg font-black leading-none">Bose In The Nose</span>
            </span>
          </a>
          <div className="flex items-center gap-1 border border-white/10 bg-white/[0.04] p-1">
            {navItems.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="px-3 py-2 text-sm font-semibold text-white/72 transition hover:bg-white/10 hover:text-white sm:px-5"
              >
                {item}
              </a>
            ))}
          </div>
        </nav>
      </header>

      <section id="home" className="relative mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl items-center gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="max-w-3xl">
          <p className="mb-5 text-sm font-bold uppercase tracking-[0.32em] text-[#d6a957]">
            2026 league command center
          </p>
          <h1 className="text-5xl font-black leading-[0.96] tracking-normal text-white sm:text-7xl lg:text-8xl">
            Every week gets its own legend.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-white/70">
            A dark-mode clubhouse for standings, weekly stories, rivalries, and Sleeper-powered league data. Home and Highlights are ready now; live data hooks are staged in the backend.
          </p>
          <div className="mt-9 grid max-w-2xl grid-cols-3 border border-white/10 bg-white/[0.04]">
            {[
              ['12', 'Managers'],
              ['09', 'Weeks tracked'],
              ['1st', 'Playoff seed'],
            ].map(([value, label]) => (
              <div key={label} className="border-r border-white/10 p-5 last:border-r-0">
                <div className="text-3xl font-black text-white">{value}</div>
                <div className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-white/45">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <aside className="border border-white/10 bg-[#0d1015]/92 p-5 shadow-2xl shadow-black/40">
          <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d6a957]">Standings</p>
              <h2 className="mt-1 text-2xl font-black">Top Table</h2>
            </div>
            <span className="border border-[#d6a957]/60 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#d6a957]">
              Live soon
            </span>
          </div>
          <div className="space-y-3">
            {teams.map((team, index) => (
              <div key={team.name} className="grid grid-cols-[36px_1fr_auto] items-center gap-4 border border-white/10 bg-white/[0.035] p-4">
                <span className="text-lg font-black text-white/38">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="font-bold text-white">{team.name}</h3>
                  <p className="text-sm text-white/48">{team.record} | {team.points} PF</p>
                </div>
                <span className={team.trend.startsWith('+') ? 'text-sm font-bold text-emerald-300' : 'text-sm font-bold text-red-300'}>
                  {team.trend}
                </span>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section id="highlights" className="border-t border-white/10 bg-[#090b0f] px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.32em] text-[#d6a957]">Highlights</p>
              <h2 className="mt-3 text-4xl font-black text-white sm:text-5xl">Weekly pulse</h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-white/58">
              This tab is built for recaps, trophies, close games, power rankings, and whatever beautiful nonsense your league chat produces.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {highlights.map((item) => (
              <article key={item.title} className="min-h-64 border border-white/10 bg-[#11141a] p-6 transition hover:border-[#d6a957]/60 hover:bg-[#151922]">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d6a957]">{item.tag}</p>
                <h3 className="mt-8 text-2xl font-black leading-tight text-white">{item.title}</h3>
                <p className="mt-6 border-t border-white/10 pt-4 text-sm font-semibold text-white/50">{item.meta}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
