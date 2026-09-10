import Link from 'next/link';

const statIdeas = [
  ['Weekly Recap', 'High score, closest game, bench pain, and weekly story feed.'],
  ['Hall of Fame / Shame', 'Record wall, painful losses, streaks, and permanent receipts.'],
  ['Manager Awards', 'Manager of the week, unlucky loss, table boss, and chaos watch.'],
];

export default function StatsPage() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#050608] px-5 py-10 text-[#f5f8fb] sm:px-8">
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center opacity-[0.46] blur-[0.5px] saturate-[1.02] contrast-[0.92]"
        style={{ backgroundImage: "url('/stadium-background.png')" }}
      />
      <div className="pointer-events-none fixed inset-0 z-[1] bg-[linear-gradient(90deg,rgba(2,3,5,0.88)_0%,rgba(2,3,5,0.58)_50%,rgba(2,3,5,0.82)_100%),linear-gradient(180deg,rgba(2,3,5,0.44)_0%,rgba(2,3,5,0.86)_76%,#020305_100%)]" />
      <div className="pointer-events-none fixed inset-0 z-[2] bg-[radial-gradient(circle_at_50%_8%,rgba(98,223,255,0.18),transparent_34%),radial-gradient(circle_at_82%_24%,rgba(167,139,250,0.16),transparent_30%)]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <header className="mb-16 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="border border-white/10 bg-black/20 px-4 py-2 text-sm font-bold uppercase tracking-[0.16em] text-white/68 backdrop-blur-md transition hover:border-[#62dfff]/40 hover:text-[#62dfff]"
          >
            Back home
          </Link>
          <p className="text-right text-xs font-bold uppercase tracking-[0.18em] text-white/42">
            Stats room
          </p>
        </header>

        <section className="max-w-4xl">
          <p className="mb-5 text-sm font-black uppercase tracking-[0.32em] text-[#62dfff]">
            Sleeper stats
          </p>
          <h1 className="text-5xl font-black leading-[0.96] text-white sm:text-7xl">
            The busy stuff can live here.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-white/62">
            This page is ready for the recap, records, awards, and deeper Sleeper-powered stats once you pick what should stay.
          </p>
        </section>

        <section className="mt-14 grid gap-4 lg:grid-cols-3">
          {statIdeas.map(([title, copy]) => (
            <article
              key={title}
              className="relative min-h-56 overflow-hidden border border-[#a78bfa]/20 bg-[#0d0b16]/80 p-6 shadow-[0_24px_90px_rgba(167,139,250,0.10)] backdrop-blur-md"
            >
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(118deg,rgba(167,139,250,0.20),transparent_38%),radial-gradient(circle_at_88%_10%,rgba(98,223,255,0.16),transparent_32%)]" />
              <div className="relative">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#62dfff]">Parked idea</p>
                <h2 className="mt-5 text-3xl font-black text-white">{title}</h2>
                <p className="mt-4 text-sm font-semibold leading-6 text-white/54">{copy}</p>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
