import Link from 'next/link';
import { sponsorshipMailto } from './sponsors/contact';

// The teaser at the foot of the home page. No panel behind it on purpose —
// the text sits straight on the stadium backdrop so the crest shows through.
// It deliberately promises nothing specific: the open slots show there is room
// without naming a package. The detail lives on /sponsors.
const openSlots = [1, 2, 3];

export default function SponsorStrip() {
  return (
    <section id="sponsors" className="relative z-10 px-5 pb-24 pt-4 sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="min-w-0">
          <p className="text-sm font-bold uppercase tracking-[0.32em] text-[#62dfff]">
            Partnerships
          </p>
          <h2 className="mt-3 text-4xl font-black leading-[1.02] text-white sm:text-5xl">
            Back the season.
          </h2>
          {/* Drop shadow rather than a panel: keeps the copy readable wherever
              it lands on the photo without boxing it in. */}
          <p className="mt-4 max-w-xl text-base leading-7 text-white/70 [text-shadow:0_1px_12px_rgba(2,3,5,0.85)]">
            Put your business in front of the league — on the site, every week, all the way to the
            final.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
            <a
              href={sponsorshipMailto}
              className="border border-[#62dfff]/45 bg-[#62dfff]/10 px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#62dfff] backdrop-blur-sm transition hover:border-[#62dfff] hover:bg-[#62dfff]/20"
            >
              Get in touch →
            </a>
            <Link
              href="/sponsors"
              className="text-sm font-bold uppercase tracking-[0.16em] text-white/55 transition hover:text-white"
            >
              What&rsquo;s involved →
            </Link>
          </div>
        </div>

        {/* Dashed and unfilled, so the backdrop reads through the slots too;
            swapping one for a real logo is then a one-line change. */}
        <div className="grid grid-cols-3 gap-3">
          {openSlots.map((slot) => (
            <div
              key={slot}
              className="flex min-h-28 flex-col items-center justify-center gap-2 border border-dashed border-white/20 p-3 text-center"
            >
              <span className="font-mono text-xs font-bold text-white/30">
                {String(slot).padStart(2, '0')}
              </span>
              <span className="text-[0.6rem] font-black uppercase tracking-[0.18em] text-white/45">
                Slot open
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
