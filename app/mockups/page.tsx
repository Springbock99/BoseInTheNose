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
          <a
            href="/"
            className="border border-white/10 bg-black/20 px-4 py-2 text-sm font-bold uppercase tracking-[0.16em] text-white/68 backdrop-blur-md transition hover:border-[#f9d98a]/40 hover:text-[#f9d98a]"
          >
            Back home
          </a>
          <p className="text-right text-xs font-bold uppercase tracking-[0.18em] text-white/42">
            Separate design board
          </p>
        </header>

        <section className="mb-12 max-w-3xl">
          <p className="mb-4 text-sm font-black uppercase tracking-[0.28em] text-[#f9d98a]">
            League name mockups
          </p>
          <h1 className="text-4xl font-black text-white sm:text-6xl">
            Pick the direction, then I’ll apply one to the real page.
          </h1>
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
