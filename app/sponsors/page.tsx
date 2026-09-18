import type { Metadata } from 'next';
import Link from 'next/link';
import PageBackground from '../PageBackground';
import { sponsorshipEmail, sponsorshipMailto } from './contact';

export const metadata: Metadata = {
  title: 'Partnerships · Bose In The Nose',
  description: 'Sponsorship and partnership enquiries for the BouseInTheNose fantasy league.',
};

// Deliberately not a price list. Nothing here commits to a package — these are
// conversation starters, and the last one invites the sponsor to propose.
const leagueFacts = [
  { value: '14', label: 'managers', detail: 'one per team, every week' },
  { value: '17', label: 'weeks', detail: 'regular season into the playoffs' },
  { value: 'Live', label: 'all season', detail: 'scores update automatically' },
];

const ideas = [
  {
    title: 'Your logo on the site',
    text: 'A slot on the home page, visible every time someone checks the standings.',
  },
  {
    title: 'Your name on an event',
    text: 'The Bouseathlon runs ten events on draft day. Any one of them could carry your name.',
  },
  {
    title: 'Something we have not thought of',
    text: 'Prizes, kit, a trophy, drinks on the day — tell us what you had in mind and we will talk.',
  },
];

export default function SponsorsPage() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#050608] px-5 py-10 text-[#f5f8fb] sm:px-8">
      <PageBackground />

      <div className="relative z-10 mx-auto min-w-0 max-w-5xl">
        <header className="mb-12 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="border border-white/10 bg-black/20 px-4 py-2 text-sm font-bold uppercase tracking-[0.16em] text-white/68 backdrop-blur-md transition hover:border-[#62dfff]/40 hover:text-[#62dfff]"
          >
            Back home
          </Link>
          <p className="text-right text-xs font-bold uppercase tracking-[0.18em] text-white/42">
            Partnerships
          </p>
        </header>

        <section className="mb-12">
          <p className="mb-4 text-sm font-black uppercase tracking-[0.32em] text-[#62dfff]">
            Looking for partners
          </p>
          <h1 className="max-w-3xl text-4xl font-black leading-[1.02] text-white sm:text-6xl">
            Back the season.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/58">
            Bouse In The Nose is a fantasy football league that runs from the draft in September to
            the final in December, with a live site the whole way through. We are open to working
            with businesses that want to be part of it — and we are not precious about what that
            looks like.
          </p>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="border border-white/10 bg-[#0b0d12]/70 p-6 backdrop-blur-sm">
            <h2 className="text-xs font-black uppercase tracking-[0.22em] text-[#62dfff]">
              The league
            </h2>
            <dl className="mt-6 space-y-5">
              {leagueFacts.map((fact) => (
                <div key={fact.label} className="flex items-baseline gap-4">
                  <dt className="w-20 shrink-0 text-2xl font-black leading-none text-white">
                    {fact.value}
                  </dt>
                  <dd className="min-w-0">
                    <p className="text-sm font-black uppercase tracking-[0.14em] text-white/72">
                      {fact.label}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-white/45">{fact.detail}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="border border-[#a78bfa]/20 bg-[#0d0b16]/70 p-6 backdrop-blur-sm">
            <h2 className="text-xs font-black uppercase tracking-[0.22em] text-[#a78bfa]">
              What this could be
            </h2>
            <ul className="mt-6 space-y-5">
              {ideas.map((idea) => (
                <li key={idea.title}>
                  <p className="text-sm font-black text-white">{idea.title}</p>
                  <p className="mt-1 text-sm leading-6 text-white/45">{idea.text}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="relative mt-4 overflow-hidden border border-[#62dfff]/28 bg-[#0d0b16]/92 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_24px_70px_rgba(167,139,250,0.12)] backdrop-blur-sm sm:p-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#62dfff] via-[#a78bfa] to-transparent" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-[#62dfff]">
                Get in touch
              </p>
              <p className="mt-2 text-xl font-black leading-snug text-white sm:text-2xl">
                Tell us about your business.
              </p>
              <p className="mt-2 break-words text-sm text-white/45">{sponsorshipEmail}</p>
            </div>
            <a
              href={sponsorshipMailto}
              className="shrink-0 border border-[#62dfff]/45 bg-[#62dfff]/10 px-5 py-3 text-center text-sm font-black uppercase tracking-[0.16em] text-[#62dfff] transition hover:border-[#62dfff] hover:bg-[#62dfff]/20"
            >
              Email us →
            </a>
          </div>
        </section>

        <p className="mt-10 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white/25">
          Bouse In The Nose · season 26/27
        </p>
      </div>
    </main>
  );
}
