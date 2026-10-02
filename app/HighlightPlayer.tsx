'use client';

import { useEffect, useRef, useState } from 'react';

type VideoPlayer = { destroy(): void; getIframe(): HTMLIFrameElement };
type YouTubeAPI = {
  Player: new (element: HTMLElement, options: {
    videoId: string;
    width: string;
    height: string;
    playerVars: { autoplay: number; playsinline: number; rel: number; origin: string };
    events: { onReady(): void; onError(event: { data: number }): void };
  }) => VideoPlayer;
};

declare global {
  interface Window { YT?: YouTubeAPI; onYouTubeIframeAPIReady?: () => void }
}

let apiPromise: Promise<YouTubeAPI> | undefined;
function loadYouTube() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<YouTubeAPI>((resolve, reject) => {
    const script = document.createElement('script');
    const previous = window.onYouTubeIframeAPIReady;
    const timeout = window.setTimeout(() => reject(new Error('Player timed out')), 15_000);
    window.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(timeout);
      previous?.();
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error('Player unavailable'));
    };
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => { window.clearTimeout(timeout); reject(new Error('Player failed to load')); };
    document.head.appendChild(script);
  }).catch((error) => { apiPromise = undefined; throw error; });
  return apiPromise;
}

export default function HighlightPlayer({ videoId, title }: { videoId: string; title: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;
    let player: VideoPlayer | undefined;
    const timeout = window.setTimeout(() => {
      if (!disposed) setError('The video player could not load. Try another clip or open this one on YouTube.');
    }, 20_000);
    void loadYouTube().then((api) => {
      if (disposed || !host.current) return;
      const target = document.createElement('div');
      host.current.replaceChildren(target);
      player = new api.Player(target, {
        videoId, width: '100%', height: '100%',
        playerVars: { autoplay: 1, playsinline: 1, rel: 0, origin: window.location.origin },
        events: {
          onReady() {
            window.clearTimeout(timeout);
            if (!disposed) setError(null);
          },
          onError(event) {
            window.clearTimeout(timeout);
            if (!disposed) setError(event.data === 101 || event.data === 150
              ? 'The publisher does not allow this clip to play on other websites. Choose another clip or watch this one on YouTube.'
              : 'This clip cannot play here right now. Choose another clip or try it on YouTube.');
          },
        },
      });
      player.getIframe().title = title;
      player.getIframe().referrerPolicy = 'strict-origin-when-cross-origin';
    }).catch(() => {
      window.clearTimeout(timeout);
      if (!disposed) setError('The video player could not load. Try another clip or open this one on YouTube.');
    });
    return () => { disposed = true; window.clearTimeout(timeout); player?.destroy(); };
  }, [videoId, title]);

  return (
    <>
      <div ref={host} className="absolute inset-0 h-full w-full" hidden={Boolean(error)} />
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#111019] px-5 text-center" role="status">
          <p className="text-base font-bold text-[#f9d98a] sm:text-xl">This replay is unavailable here.</p>
          <p className="max-w-sm text-xs leading-relaxed text-white/60 sm:text-sm">{error}</p>
          <a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer" className="border border-[#f9d98a]/40 bg-[#f9d98a]/10 px-4 py-2 text-xs font-bold text-[#f9d98a]">Watch on YouTube ↗</a>
        </div>
      )}
    </>
  );
}
