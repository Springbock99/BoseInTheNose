'use client';

import { useState } from 'react';

// Headshots come straight from Sleeper's CDN, which needs no key. A player
// without one answers 403 rather than serving a placeholder, so every image
// carries its own fallback. Team defences use the club logo instead, since
// they are keyed by abbreviation and have no headshot at all.
export function PlayerAvatar({
  playerId,
  player,
  className,
}: {
  playerId: string;
  player?: { position?: string };
  className: string;
}) {
  const [failed, setFailed] = useState(false);
  const isDefence = playerId.length <= 3 || player?.position === 'DEF';
  const source = isDefence
    ? `https://sleepercdn.com/images/team_logos/nfl/${playerId.toLowerCase()}.png`
    : `https://sleepercdn.com/content/nfl/players/thumb/${playerId}.jpg`;

  return (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-[#111520] ${className}`}
    >
      {failed ? (
        <span className="text-[0.55rem] font-black uppercase tracking-[0.06em] text-white/38">
          {player?.position || '—'}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- remote CDN image, no loader needed
        <img
          src={source}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className={`h-full w-full ${isDefence ? 'object-contain p-1' : 'object-cover'}`}
        />
      )}
    </span>
  );
}

export function TeamAvatar({ team, className }: { team: { name: string; avatarUrl?: string }; className: string }) {
  return (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden border border-[#62dfff]/20 bg-[#061826] bg-cover bg-center shadow-[0_0_22px_rgba(98,223,255,0.10)] ${className}`}
      style={team.avatarUrl ? { backgroundImage: `url(${team.avatarUrl})` } : undefined}
      aria-label={`${team.name} avatar`}
      data-avatar-status={team.avatarUrl ? 'custom' : 'placeholder'}
    >
      {!team.avatarUrl && (
        <>
          <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(98,223,255,0.34),transparent_44%),linear-gradient(145deg,rgba(167,139,250,0.20),rgba(98,223,255,0.08))]" />
          <span className="relative grid h-[52%] w-[52%] place-items-center rounded-full border border-[#62dfff]/25 bg-black/22">
            <span className="absolute top-[24%] h-[26%] w-[26%] rounded-full bg-[#9beeff]" />
            <span className="absolute bottom-[20%] h-[28%] w-[54%] rounded-t-full bg-[#9beeff]" />
          </span>
        </>
      )}
    </span>
  );
}

