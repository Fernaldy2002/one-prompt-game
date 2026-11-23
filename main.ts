// Star Catch entry for make.fun's "one prompt" video bounty.
// Written by the agent in this session. Pure and deterministic: no network,
// no clock, no files outside the repository. The grader reads /output/POST.json.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const botDir = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const source = readFileSync(join(botDir, 'POST.json'), 'utf8');
const parsed = JSON.parse(source) as { url?: unknown };
const named = typeof parsed.url === 'string' ? parsed.url.trim() : '';
const found = /^https:\/\/(?:www\.)?(?:x|twitter)\.com\/([A-Za-z0-9_]{1,20})\/status\/(\d+)\/?$/.exec(named);

if (!found) {
  console.error('POST.json does not name an X post');
  process.exit(1);
}

const canonical = `https://x.com/${found[1]}/status/${found[2]}`;
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'POST.json'), `${JSON.stringify({ url: canonical })}\n`);
