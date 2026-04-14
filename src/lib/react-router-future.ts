/**
 * Opt-in to React Router v7 behaviors (v6.30+).
 * Removes console warnings and aligns the app with the next major version.
 */
export const reactRouterFutureFlags = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;
