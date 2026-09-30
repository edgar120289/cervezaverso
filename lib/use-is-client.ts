import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** `false` en el servidor y en la hidratación, `true` después; para montar portales en <body>. */
export function useIsClient(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
