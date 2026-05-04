/**
 * Entry point for `@/services/api` and `../services/api`.
 * Bundlers resolve this path to `api.ts` before `api/index.ts`; keep this shim so builds
 * do not look for a missing file. Implementation: `./api/*`, `./http/client.ts`.
 */
export * from "./api/index";
export { default } from "./api/index";
