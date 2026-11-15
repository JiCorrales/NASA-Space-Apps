// The two Node calls the stylesheet test needs (the web project does not carry @types/node).
declare module "node:fs" { export function readFileSync(path: string | URL, encoding: "utf8"): string }
declare const process: { cwd(): string };
