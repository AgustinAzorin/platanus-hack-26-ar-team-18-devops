import { useEffect, useLayoutEffect } from 'react';

/**
 * `useLayoutEffect` warns in SSR because there's no layout phase. We only ever
 * run it on the client (after `mounted` flips to true), but React still complains
 * about its mere presence during server render. This helper falls back to
 * `useEffect` on the server to silence the warning, while using
 * `useLayoutEffect` in the browser so animations apply BEFORE the first paint
 * (essential for entrance tweens — otherwise the user sees the final position
 * for one frame, then GSAP snaps to the initial state and animates from there).
 */
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;
