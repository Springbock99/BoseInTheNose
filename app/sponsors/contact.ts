// The sponsorship address comes from the environment, so it is not baked into
// the repo and can differ between local and production.
//
// NEXT_PUBLIC_ is required because the home-page strip renders inside a client
// component: only prefixed variables reach the browser bundle. That also means
// the value is public — which is fine for an address that has to be clickable
// on the page, but never use the prefix for an actual secret.
//
// Set it in .env.local for development and in the Vercel project settings for
// production. .env* is git-ignored; .env.example lists the key.

const configured = process.env.NEXT_PUBLIC_SPONSOR_EMAIL?.trim();

// An obviously fake fallback rather than a plausible one: if the variable is
// missing, that should be visible on the page, not silently wrong.
export const sponsorshipEmail = configured || 'not-configured@example.com';

export const isSponsorshipEmailConfigured = Boolean(configured);

export const sponsorshipSubject = 'Bouse In The Nose sponsorship';

export const sponsorshipMailto = `mailto:${sponsorshipEmail}?subject=${encodeURIComponent(
  sponsorshipSubject,
)}`;
