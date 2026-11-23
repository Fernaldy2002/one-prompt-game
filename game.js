// Star Catch — a tiny browser game built from one prompt.
// The same logic module is used by index.html (real game) and tools/make-video.mjs
// (renders the gameplay segment of the promo clip from this exact game state).

export const GAME = {
  width: 480,
  height: 800,
  gravity: 46,
  spawnEvery: 0.42,
  paddleWidth: 116,
  paddleHeight: 20,
};

export function createGame(seed = 7) {
  let state = seed >>> 0;
  const rand = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
  return {
    rand,
    time: 0,
    spawnTimer: 0,
    paddle: { x: GAME.width / 2, y: GAME.height - 78 },
    drops: [],
    score: 0,
    lives: 3,
    caught: 0,
    flash: 0,
    shake: 0,
    over: false,
  };
}

export function stepGame(game, dt) {
  if (game.over) return game;
  dt = Math.min(dt, 0.05);
  game.time += dt;
  game.flash = Math.max(0, game.flash - dt * 3);
  game.shake = Math.max(0, game.shake - dt * 4);

  // Simple autopilot for the demo: steer toward the nearest falling star.
  const stars = game.drops.filter((d) => d.kind === 'star' && d.y < game.paddle.y);
  let target = GAME.width / 2;
  if (stars.length) {
    const soon = stars.reduce((a, b) => (a.y > b.y ? a : b));
    const eta = (game.paddle.y - soon.y) / Math.max(soon.vy, 1);
    target = soon.x + soon.vx * eta;
  }
  const dir = Math.sign(target - game.paddle.x);
  game.paddle.x = Math.max(
    GAME.paddleWidth / 2,
    Math.min(GAME.width - GAME.paddleWidth / 2, game.paddle.x + dir * 430 * dt),
  );

  game.spawnTimer += dt;
  if (game.spawnTimer >= GAME.spawnEvery) {
    game.spawnTimer -= GAME.spawnEvery;
    const bomb = game.rand() < 0.24;
    game.drops.push({
      x: 40 + game.rand() * (GAME.width - 80),
      y: -30,
      vx: (game.rand() - 0.5) * 30,
      vy: 220 + game.rand() * 120,
      r: bomb ? 20 : 16,
      kind: bomb ? 'bomb' : 'star',
      spin: game.rand() * Math.PI * 2,
    });
  }

  for (const d of game.drops) {
    d.y += d.vy * dt;
    d.x += d.vx * dt;
    d.spin += dt * 2;
    if (d.x < d.r || d.x > GAME.width - d.r) d.vx *= -1;
    if (
      d.y + d.r >= game.paddle.y - GAME.paddleHeight / 2 &&
      d.y - d.r <= game.paddle.y + GAME.paddleHeight / 2 &&
      Math.abs(d.x - game.paddle.x) < GAME.paddleWidth / 2 + d.r * 0.6
    ) {
      if (d.kind === 'star') {
        game.score += 10;
        game.caught += 1;
        game.flash = 1;
      } else {
        game.lives -= 1;
        game.shake = 1;
      }
      d.y = GAME.height + 100;
    }
  }
  game.drops = game.drops.filter((d) => d.y < GAME.height + 60);
  return game;
}
