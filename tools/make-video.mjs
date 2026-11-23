// Renders the promo clip entirely in this agent session.
// The gameplay segment is drawn from game.js's own state, i.e. the real game.
// Run from the repository: node tools/make-video.mjs
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createGame, stepGame, GAME } from '../game.js';

const FFMPEG = process.env.FFMPEG ?? '/home/fernaldy2002/makefun/tools/node_modules/ffmpeg-static/ffmpeg';
const CANVAS_DIR = process.env.FRAMES ?? '/home/fernaldy2002/makefun/frames';
const OUT = process.env.OUT ?? '/home/fernaldy2002/makefun/clip-final.mp4';
const W = 1080, H = 1920, FPS = 24;
const REFERRAL = 'dxscpvzv';
const CARD_URL = 'https://make.fun/press/referral-card/9x16/makefun-card-9x16.mp4';
const CARD = '/home/fernaldy2002/makefun/press-card-9x16.mp4';

GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 'DJ');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 'DJR');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', 'DJM');

const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');
mkdirSync(CANVAS_DIR, { recursive: true });

const HOOK_END = 4.5;
const TERM_END = 11.5;
const GAME_END = 25.5;
const CTA_END = 28.5;
const TOTAL = CTA_END;

function text(str, x, y, size, color, font = 'DJ', align = 'left') {
  ctx.font = `${size}px ${font}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
  ctx.textAlign = 'left';
}
function roundRect(x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
}
function background(t, top = '#0c0a1e', bottom = '#1b0b30') {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, top); g.addColorStop(1, bottom);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.045)'; ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 90) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 90) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  const glow = ctx.createRadialGradient(W / 2, H * 0.42, 40, W / 2, H * 0.42, 700);
  glow.addColorStop(0, 'rgba(255,79,216,0.16)'); glow.addColorStop(1, 'rgba(255,79,216,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
}

const PROMPT = 'build me a game: catch stars, dodge bombs, keep score';

function drawHook(t) {
  background(t);
  text('ONE PROMPT.', 70, 400, 108, '#ffffff');
  text('ONE PLAYABLE GAME.', 70, 530, 78, '#ff4fd8');
  roundRect(64, 640, 952, 260, 26, 'rgba(255,255,255,0.06)', 'rgba(255,79,216,0.6)');
  text('THE PROMPT', 96, 706, 30, '#8d86a8', 'DJM');
  const p1 = PROMPT.slice(0, 16), p2 = PROMPT.slice(16);
  const s1 = p1.slice(0, Math.max(0, Math.min(p1.length, Math.floor((t - 0.7) * 18))));
  const s2 = p2.slice(0, Math.max(0, Math.min(p2.length, Math.floor((t - 1.7) * 18))));
  text(s1, 96, 790, 40, '#ffd84d', 'DJM');
  text(s2, 96, 852, 40, '#ffd84d', 'DJM');
  if (t < 3.4 && Math.floor(t * 3) % 2 === 0) {
    if (s2.length < p2.length) text('|', 96 + s2.length * 24, 852, 40, '#ffd84d', 'DJM');
    else if (s1.length < p1.length) text('|', 96 + s1.length * 24, 790, 40, '#ffd84d', 'DJM');
  }
  text('Now watch an AI agent build it.', 70, 1080, 40, '#c9c2e0', 'DJR');
  if (t > 3.2) {
    ctx.globalAlpha = Math.min(1, (t - 3.2) * 2);
    text('make.fun', W / 2, 1600, 84, '#ff4fd8', 'DJ', 'center');
    ctx.globalAlpha = 1;
  }
}

const TERM_LINES = [
  ['$', 'agent --prompt "catch stars, dodge bombs, keep score"', '#ffd84d'],
  ['✓', 'read prompt', '#7dffb2'],
  ['✓', 'write  index.html    (canvas + controls)', '#7dffb2'],
  ['✓', 'write  game.js       (physics, scoring, lives)', '#7dffb2'],
  ['✓', 'run    local build   (node 22)', '#7dffb2'],
  ['✓', 'playable in 3.2s', '#ffffff'],
];
function drawTerminal(t) {
  background(t, '#080716', '#160a24');
  text('THE AGENT GETS TO WORK', W / 2, 330, 54, '#ffffff', 'DJ', 'center');
  text('one prompt → a working game', W / 2, 400, 32, '#9b93b8', 'DJR', 'center');
  roundRect(50, 500, 980, 980, 24, '#05050c', '#ff4fd8aa');
  roundRect(50, 500, 980, 80, 24, '#1a1230');
  ctx.fillStyle = '#ff5f56'; ctx.beginPath(); ctx.arc(92, 540, 13, 0, 7); ctx.fill();
  ctx.fillStyle = '#ffbd2e'; ctx.beginPath(); ctx.arc(134, 540, 13, 0, 7); ctx.fill();
  ctx.fillStyle = '#27c93f'; ctx.beginPath(); ctx.arc(176, 540, 13, 0, 7); ctx.fill();
  text('agent@make.fun  ~  /star-catch', 520, 550, 28, '#9b93b8', 'DJR', 'center');
  const local = t - HOOK_END;
  for (let i = 0; i < TERM_LINES.length; i++) {
    const start = 0.4 + i * 0.85;
    if (local < start) break;
    const [mark, line, color] = TERM_LINES[i];
    const chars = Math.floor(Math.min(1, (local - start) * 7) * line.length);
    const y = 640 + i * 100;
    text(mark, 90, y, 34, color, 'DJM');
    text(line.slice(0, chars), 145, y, 26, color, 'DJM');
    if (chars < line.length && Math.floor(t * 4) % 2 === 0) text('▋', 145 + chars * 15.6, y, 26, color, 'DJM');
  }
  const p = Math.max(0, Math.min(1, (local - 5.1) / 1.4));
  roundRect(90, 1290, 900, 26, 13, '#241a38');
  roundRect(90, 1290, 900 * p, 26, 13, '#ff4fd8');
  text(`${Math.round(p * 100)}%`, 990, 1355, 28, '#ff4fd8', 'DJM', 'right');
}

const game = createGame(7);
const S = 2.25; // 480 x 800 -> 1080 x 1800
function drawGame(t) {
  background(t, '#060814', '#1a0730');
  const local = t - TERM_END;
  stepGame(game, 1 / FPS);
  ctx.save();
  ctx.translate(0, 90);
  ctx.scale(S, S);
  if (game.shake > 0) ctx.translate((Math.random() - 0.5) * game.shake * 8, (Math.random() - 0.5) * game.shake * 8);
  ctx.fillStyle = '#12102a'; ctx.fillRect(0, 0, GAME.width, GAME.height);
  for (let i = 0; i < game.drops.length; i++) {
    const d = game.drops[i];
    ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.spin);
    ctx.fillStyle = d.kind === 'star' ? '#ffd84d' : '#ff4d6d';
    ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 22;
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const a = (k * Math.PI) / 5 - Math.PI / 2;
      const r = k % 2 ? d.r * 0.45 : d.r;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  ctx.fillStyle = game.flash > 0 ? '#ffffff' : '#4de8ff';
  ctx.shadowColor = '#4de8ff'; ctx.shadowBlur = 26;
  ctx.fillRect(game.paddle.x - GAME.paddleWidth / 2, game.paddle.y - 10, GAME.paddleWidth, 20);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#f7f3ff'; ctx.font = 'bold 28px DJM';
  ctx.fillText(`SCORE ${game.score}`, 18, 42);
  ctx.fillStyle = '#ff77a8'; ctx.fillText(`LIVES ${game.lives}`, 350, 42);
  ctx.restore();
  roundRect(40, 40, 1000, 76, 38, 'rgba(255,79,216,0.18)', '#ff4fd8');
  text('● LIVE GAMEPLAY  •  BUILT FROM ONE PROMPT', W / 2, 92, 30, '#ffb3eb', 'DJM', 'center');
  text(`score ${game.score}  ·  ${game.caught} stars caught  ·  ${game.lives} lives`, W / 2, 1872, 32, '#c9c2e0', 'DJR', 'center');
}

function drawCta(t) {
  background(t, '#15051f', '#3b0b46');
  const a = Math.min(1, (t - GAME_END) * 2);
  ctx.globalAlpha = a;
  text('YOUR TURN.', W / 2, 560, 96, '#ffffff', 'DJ', 'center');
  text('Come build on', W / 2, 840, 66, '#d6cfe8', 'DJR', 'center');
  const g = ctx.createLinearGradient(180, 900, 900, 1180);
  g.addColorStop(0, '#ff4fd8'); g.addColorStop(1, '#ffd84d');
  ctx.fillStyle = g; ctx.font = '200px DJ'; ctx.textAlign = 'center';
  ctx.fillText('make.fun', W / 2, 1180);
  ctx.textAlign = 'left';
  text('one prompt is all it takes', W / 2, 1310, 40, '#d6cfe8', 'DJR', 'center');
  text('@makefunai', W / 2, 1500, 38, '#ff8fe2', 'DJM', 'center');
  ctx.globalAlpha = 1;
}

function renderFrame(t) {
  ctx.clearRect(0, 0, W, H);
  if (t < HOOK_END) drawHook(t);
  else if (t < TERM_END) drawTerminal(t);
  else if (t < GAME_END) drawGame(t);
  else drawCta(t);
}

const FRAMES = Math.round(TOTAL * FPS);
for (let i = 0; i < FRAMES; i++) {
  renderFrame(i / FPS);
  const buf = canvas.toBuffer('image/png');
  writeFileSync(`${CANVAS_DIR}/frame-${String(i).padStart(5, '0')}.png`, buf);
  if (i % 100 === 0) console.log(`rendered frame ${i}/${FRAMES}`);
}

function run(args) {
  console.log('+ ffmpeg', args.slice(0, 6).join(' '), '...');
  execFileSync(FFMPEG, args, { stdio: ['ignore', 'ignore', 'pipe'] });
}
const base = '/home/fernaldy2002/makefun/base.mp4';
run(['-y', '-framerate', String(FPS), '-i', `${CANVAS_DIR}/frame-%05d.png`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-crf', '20', '-preset', 'veryfast', base]);

if (!existsSync(CARD)) execFileSync('curl', ['-sSL', CARD_URL, '-o', CARD]);
// Read the card's duration from ffmpeg's own probe output.
let probe = '';
try { execFileSync(FFMPEG, ['-i', CARD], { stdio: ['ignore', 'pipe', 'pipe'] }); }
catch (e) { probe = String(e.stderr ?? ''); }
const dm = probe.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
const cardDur = dm ? Number(dm[1]) * 3600 + Number(dm[2]) * 60 + Number(dm[3]) : 3.5;
console.log('card duration', cardDur);

// Overlay the referral code into the card's field (positions from press manifest).
const codeCanvas = createCanvas(W, H);
const cc = codeCanvas.getContext('2d');
cc.fillStyle = '#ffffff';
cc.fillRect(208, 1230, 9, 82);
cc.font = 'bold 62px DJM';
cc.fillStyle = '#191419';
cc.textBaseline = 'alphabetic';
cc.fillText(REFERRAL, 210, 1293);
const codePng = '/home/fernaldy2002/makefun/referral-code.png';
writeFileSync(codePng, codeCanvas.toBuffer('image/png'));

const audio = "aevalsrc=0.05*sin(2*PI*220*t)+0.035*sin(2*PI*330*t)+0.025*sin(2*PI*440*t):s=44100";
const enable = `enable='gte(t,${(TOTAL + 1.45).toFixed(3)})'`;
run([
  '-y', '-i', base, '-i', CARD, '-i', codePng, '-f', 'lavfi', '-i', audio,
  '-filter_complex',
  `[0:v]fps=${FPS},format=yuv420p[a];[1:v]fps=${FPS},format=yuv420p[b];[a][b]concat=n=2:v=1:a=0[vcat];[vcat][2:v]overlay=0:0:${enable}[v]`,
  '-map', '[v]', '-map', '3:a', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20',
  '-preset', 'veryfast', '-c:a', 'aac', '-b:a', '128k', '-shortest', OUT,
]);
console.log('WROTE', OUT, 'duration ~', (TOTAL + cardDur).toFixed(2));
