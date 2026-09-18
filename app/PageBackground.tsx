// The league's backdrop: stadium photo, a wash that darkens it enough for text
// to sit on, and a glow that tints the top of the page.
//
// Single source of truth — every page renders this rather than its own copy,
// so the site cannot drift into three slightly different backgrounds.

const background = {
  imageUrl: '/stadium-background.png',
  imageClass: 'opacity-[0.52] blur-[0.5px] saturate-[1.02] contrast-[0.92]',
  washClass:
    'bg-[linear-gradient(90deg,rgba(2,3,5,0.84)_0%,rgba(2,3,5,0.42)_50%,rgba(2,3,5,0.78)_100%),linear-gradient(180deg,rgba(2,3,5,0.34)_0%,rgba(2,3,5,0.72)_76%,#020305_100%)]',
  glowClass:
    'bg-[radial-gradient(circle_at_50%_4%,rgba(98,223,255,0.24),transparent_36%),radial-gradient(circle_at_16%_22%,rgba(167,139,250,0.13),transparent_22%)]',
};

export default function PageBackground() {
  return (
    <>
      <div
        className={`pointer-events-none fixed inset-0 z-0 bg-cover bg-center transition duration-500 ${background.imageClass}`}
        style={{ backgroundImage: `url('${background.imageUrl}')` }}
      />
      <div
        className={`pointer-events-none fixed inset-0 z-[1] transition duration-500 ${background.washClass}`}
      />
      <div
        className={`pointer-events-none fixed inset-0 z-[2] transition duration-500 ${background.glowClass}`}
      />
    </>
  );
}
