'use client';

import { useEffect, useState } from 'react';

/** Scroll distance (px) in one direction before the bar reacts, so jitter does not toggle it. */
const SCROLL_THRESHOLD = 8;
/** Near the top or the end of the page the bar always shows. */
const EDGE_MARGIN = 48;

/**
 * Whether the bottom bar should be hidden: it slides away while the reader
 * scrolls the page's `Screen` down and comes back on any scroll up, near the
 * top and at the end of the page (so the footer is never left alone). It
 * re-attaches when `key` (the pathname) changes, as each page owns its own
 * `Screen`.
 */
export const useHideOnScroll = (key: string) => {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const screen = document.querySelector<HTMLElement>('main[data-mode]');
    if (!screen) return;

    setHidden(false);
    let last = screen.scrollTop;

    const onScroll = () => {
      const top = screen.scrollTop;
      const atTop = top < EDGE_MARGIN;
      const atEnd = top + screen.clientHeight >= screen.scrollHeight - EDGE_MARGIN;
      const delta = top - last;

      if (atTop || atEnd) {
        setHidden(false);
        last = top;
      } else if (Math.abs(delta) >= SCROLL_THRESHOLD) {
        setHidden(delta > 0);
        last = top;
      }
    };

    screen.addEventListener('scroll', onScroll, { passive: true });
    return () => screen.removeEventListener('scroll', onScroll);
  }, [key]);

  return { hidden, show: () => setHidden(false) };
};
