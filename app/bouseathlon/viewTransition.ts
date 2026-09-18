import { flushSync } from 'react-dom';

type ViewTransition = { finished: Promise<void> };
type DocumentWithViewTransitions = Document & {
  startViewTransition?: (callback: () => void) => ViewTransition;
};

type Options = {
  /**
   * Runs against the committed DOM, still inside the transition, so scrolling
   * here is captured in the "after" snapshot and animates as part of the same
   * motion instead of playing after it.
   */
  afterCommit?: () => void;
  /**
   * Tags <html> for the duration, letting the stylesheet time opening and
   * closing differently — an opening panel is worth watching, a closing one
   * just needs to get out of the way.
   */
  flavour?: 'open' | 'close';
};

/**
 * Runs a React state update inside a view transition, so the browser tweens
 * the layout between the old and new DOM instead of cutting to it.
 *
 * Falls back to a plain update where the API is missing (Firefox < 139) or the
 * visitor asked for reduced motion — the result is an instant swap.
 */
export function withViewTransition(update: () => void, options: Options = {}): Promise<void> {
  const { afterCommit, flavour = 'open' } = options;
  const doc = document as DocumentWithViewTransitions;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (typeof doc.startViewTransition !== 'function' || reducedMotion) {
    update();
    afterCommit?.();
    return Promise.resolve();
  }

  doc.documentElement.dataset.viewTransition = flavour;

  return doc
    .startViewTransition(() => {
      // flushSync forces React to commit synchronously. Without it React would
      // batch the update for later, and the browser would snapshot the *old*
      // DOM as the "after" state — a transition from a frame to itself.
      flushSync(update);
      afterCommit?.();
    })
    .finished.catch(() => {
      // A transition interrupted by the next click rejects; that is expected.
    })
    .finally(() => {
      delete doc.documentElement.dataset.viewTransition;
    });
}
