// ---- Pixel Plumber: a tiny Mario-style platformer ----

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

const GRAVITY = 0.6;
const FRICTION = 0.8;
const MOVE_SPEED = 4.2;
const JUMP_FORCE = -13.5;
const TILE = 40;

const scoreEl = document.getElementById('score');
const coinsEl = document.getElementById('coins');
const livesEl = document.getElementById('lives');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayText = document.getElementById('overlay-text');
const overlayBtn = document.getElementById('overlay-btn');

const keys = {};
const NAV_KEYS = ['Space', ' ', 'Spacebar', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
function setKey(e, val) {
  if (e.code) keys[e.code] = val;
  if (e.key) keys[e.key] = val;
}
window.addEventListener('keydown', e => {
  setKey(e, true);
  if (NAV_KEYS.includes(e.code) || NAV_KEYS.includes(e.key)) e.preventDefault();
});
window.addEventListener('keyup', e => { setKey(e, false); });

function isDown(...names) {
  return names.some(n => keys[n]);
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// Level layout: a grid of platforms (x, y in tile units, width in tiles)
function buildLevel() {
  const platforms = [
    { x: 0, y: 12, w: 14 },
    { x: 15, y: 12, w: 6 },
    { x: 22, y: 9, w: 3 },
    { x: 26, y: 12, w: 10 },
    { x: 37, y: 7, w: 3 },
    { x: 41, y: 12, w: 16 },
    { x: 44, y: 9, w: 2 },
    { x: 50, y: 6, w: 2 },
    { x: 58, y: 12, w: 20 },
    { x: 63, y: 9, w: 3 },
    { x: 70, y: 6, w: 3 },
  ].map(p => ({ x: p.x * TILE, y: p.y * TILE, w: p.w * TILE, h: (13 - p.y) * TILE + 40 }));

  const coins = [
    [22, 8], [23, 8], [24, 8],
    [37, 6], [38, 6],
    [44, 8], [50, 5],
    [59, 11], [61, 11], [63, 8], [64, 8],
    [70, 5], [71, 5],
  ].map(([tx, ty]) => ({ x: tx * TILE + 8, y: ty * TILE + 8, w: 24, h: 24, taken: false }));

  const enemies = [
    { x: 17 * TILE, y: 12 * TILE - 32, w: 32, h: 32, dir: -1, range: [15 * TILE, 20 * TILE], alive: true },
    { x: 28 * TILE, y: 12 * TILE - 32, w: 32, h: 32, dir: 1, range: [26 * TILE, 35 * TILE], alive: true },
    { x: 45 * TILE, y: 12 * TILE - 32, w: 32, h: 32, dir: 1, range: [41 * TILE, 56 * TILE], alive: true },
    { x: 62 * TILE, y: 12 * TILE - 32, w: 32, h: 32, dir: -1, range: [58 * TILE, 77 * TILE], alive: true },
    { x: 68 * TILE, y: 12 * TILE - 32, w: 32, h: 32, dir: 1, range: [58 * TILE, 77 * TILE], alive: true },
  ];

  const pits = [
    { x: 14 * TILE, w: 1 * TILE },
    { x: 21 * TILE, w: 1 * TILE },
    { x: 36 * TILE, w: 1 * TILE },
    { x: 57 * TILE, w: 1 * TILE },
  ];

  const flag = { x: 77 * TILE, y: 4 * TILE, w: 12, h: 8 * TILE };
  const levelWidth = 80 * TILE;

  return { platforms, coins, enemies, pits, flag, levelWidth };
}

let level = buildLevel();

function makePlayer() {
  return {
    x: 60, y: 300, w: 30, h: 40,
    vx: 0, vy: 0,
    onGround: false,
    facing: 1,
    invuln: 0,
  };
}

let player = makePlayer();
let camX = 0;
let score = 0, coins = 0, lives = 3;
let state = 'playing'; // playing | dead | won
let fallReset = false;

function resetGame() {
  level = buildLevel();
  player = makePlayer();
  camX = 0;
  score = 0; coins = 0; lives = 3;
  state = 'playing';
  updateHud();
  overlay.classList.add('hidden');
}

function loseLife() {
  lives--;
  updateHud();
  if (lives <= 0) {
    state = 'dead';
    showOverlay('Game Over', `Final score: ${score}`);
  } else {
    player = makePlayer();
    player.x = Math.max(60, camX + 60);
    camX = Math.max(0, player.x - 200);
  }
}

function showOverlay(title, text) {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  overlay.classList.remove('hidden');
}

overlayBtn.addEventListener('click', resetGame);

function updateHud() {
  scoreEl.textContent = `Score: ${score}`;
  coinsEl.textContent = `Coins: ${coins}`;
  livesEl.textContent = `Lives: ${lives}`;
}

function isOverPit(x, w) {
  const groundTop = 12 * TILE;
  return level.pits.some(p => x + w > p.x && x < p.x + p.w);
}

function update() {
  if (state !== 'playing') return;

  // Horizontal input
  if (isDown('ArrowLeft', 'Left', 'KeyA', 'a', 'A')) {
    player.vx -= 0.9;
    player.facing = -1;
  }
  if (isDown('ArrowRight', 'Right', 'KeyD', 'd', 'D')) {
    player.vx += 0.9;
    player.facing = 1;
  }
  player.vx *= FRICTION;
  if (Math.abs(player.vx) > MOVE_SPEED) player.vx = MOVE_SPEED * Math.sign(player.vx);
  if (Math.abs(player.vx) < 0.05) player.vx = 0;

  // Jump
  if (isDown('Space', ' ', 'Spacebar', 'ArrowUp', 'Up', 'KeyW', 'w', 'W') && player.onGround) {
    player.vy = JUMP_FORCE;
    player.onGround = false;
  }

  player.vy += GRAVITY;
  if (player.vy > 18) player.vy = 18;

  // Move vertically first and resolve collisions, so a player landing on top
  // of a platform is snapped onto it before the horizontal pass runs (otherwise
  // horizontal velocity can misread a landing as a side hit and shove the
  // player sideways off the platform it just reached).
  player.y += player.vy;
  player.onGround = false;
  for (const p of level.platforms) {
    if (rectsOverlap(player, p)) {
      if (player.vy > 0) {
        player.y = p.y - player.h;
        player.vy = 0;
        player.onGround = true;
      } else if (player.vy < 0) {
        player.y = p.y + p.h;
        player.vy = 0;
      }
    }
  }

  // Move horizontally, resolve collisions
  player.x += player.vx;
  player.x = Math.max(0, Math.min(player.x, level.levelWidth - player.w));
  for (const p of level.platforms) {
    if (rectsOverlap(player, p)) {
      if (player.vx > 0) player.x = p.x - player.w;
      else if (player.vx < 0) player.x = p.x + p.w;
      player.vx = 0;
    }
  }

  if (player.invuln > 0) player.invuln--;

  // Fell into a pit / off the map
  if (player.y > H + 100) {
    loseLife();
    return;
  }

  // Coins
  for (const c of level.coins) {
    if (!c.taken && rectsOverlap(player, c)) {
      c.taken = true;
      coins++;
      score += 100;
      updateHud();
    }
  }

  // Enemies
  for (const e of level.enemies) {
    if (!e.alive) continue;
    e.x += e.dir * 1.6;
    if (e.x < e.range[0] || e.x + e.w > e.range[1]) e.dir *= -1;

    if (rectsOverlap(player, e)) {
      const playerBottom = player.y + player.h;
      const stomping = player.vy > 0 && playerBottom - e.h / 2 < e.y + e.h * 0.5;
      if (stomping) {
        e.alive = false;
        player.vy = JUMP_FORCE * 0.6;
        score += 200;
        updateHud();
      } else if (player.invuln === 0) {
        loseLife();
        player.invuln = 90;
        return;
      }
    }
  }

  // Win condition
  if (rectsOverlap(player, level.flag)) {
    state = 'won';
    showOverlay('You Win!', `Score: ${score}  |  Coins: ${coins}`);
  }

  // Camera follows player
  camX = Math.max(0, Math.min(player.x - W / 2.5, level.levelWidth - W));
}

function drawBackground() {
  ctx.fillStyle = '#5c94fc';
  ctx.fillRect(0, 0, W, H);

  // Parallax hills
  ctx.fillStyle = '#3aa447';
  for (let i = -1; i < 6; i++) {
    const bx = i * 260 - (camX * 0.3) % 260;
    ctx.beginPath();
    ctx.arc(bx + 130, H - 40, 90, Math.PI, 0);
    ctx.fill();
  }
  // Clouds
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  for (let i = -1; i < 8; i++) {
    const cx = i * 300 - (camX * 0.5) % 300;
    drawCloud(cx + 80, 70 + (i % 3) * 20);
  }
}

function drawCloud(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  ctx.arc(x + 20, y - 8, 22, 0, Math.PI * 2);
  ctx.arc(x + 42, y, 18, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlatforms() {
  for (const p of level.platforms) {
    const sx = p.x - camX;
    if (sx + p.w < 0 || sx > W) continue;
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(sx, p.y, p.w, p.h);
    ctx.fillStyle = '#3aa447';
    ctx.fillRect(sx, p.y, p.w, 10);
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    for (let gx = 0; gx < p.w; gx += TILE) {
      ctx.strokeRect(sx + gx, p.y, TILE, p.h);
    }
  }
}

function drawCoins() {
  for (const c of level.coins) {
    if (c.taken) continue;
    const sx = c.x - camX;
    if (sx + c.w < 0 || sx > W) continue;
    ctx.fillStyle = '#ffd54a';
    ctx.beginPath();
    ctx.arc(sx + c.w / 2, c.y + c.h / 2, c.w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c98f0a';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawEnemies() {
  for (const e of level.enemies) {
    if (!e.alive) continue;
    const sx = e.x - camX;
    if (sx + e.w < 0 || sx > W) continue;
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(sx, e.y, e.w, e.h);
    ctx.fillStyle = '#000';
    ctx.fillRect(sx + 6, e.y + 8, 6, 6);
    ctx.fillRect(sx + e.w - 12, e.y + 8, 6, 6);
    ctx.fillStyle = '#5a2d0c';
    ctx.fillRect(sx, e.y + e.h - 8, e.w, 8);
  }
}

function drawFlag() {
  const f = level.flag;
  const sx = f.x - camX;
  ctx.fillStyle = '#ccc';
  ctx.fillRect(sx, f.y, 6, f.h);
  ctx.fillStyle = '#e52521';
  ctx.beginPath();
  ctx.moveTo(sx + 6, f.y + 6);
  ctx.lineTo(sx + 46, f.y + 20);
  ctx.lineTo(sx + 6, f.y + 34);
  ctx.closePath();
  ctx.fill();
}

function drawPits() {
  for (const p of level.pits) {
    const sx = p.x - camX;
    ctx.fillStyle = '#0d1436';
    ctx.fillRect(sx, 12 * TILE, p.w, H - 12 * TILE);
  }
}

function drawPlayer() {
  const sx = player.x - camX;
  if (player.invuln > 0 && Math.floor(player.invuln / 5) % 2 === 0) return;

  ctx.save();
  ctx.translate(sx + player.w / 2, player.y + player.h / 2);
  ctx.scale(player.facing, 1);

  // Body
  ctx.fillStyle = '#e52521';
  ctx.fillRect(-player.w / 2, -player.h / 2 + 14, player.w, player.h - 14);
  // Head
  ctx.fillStyle = '#f6b98f';
  ctx.fillRect(-player.w / 2 + 4, -player.h / 2, player.w - 8, 18);
  // Cap
  ctx.fillStyle = '#e52521';
  ctx.fillRect(-player.w / 2 + 2, -player.h / 2 - 4, player.w - 4, 8);
  ctx.fillRect(player.w / 2 - 10, -player.h / 2, 12, 4);
  // Mustache
  ctx.fillStyle = '#3b2411';
  ctx.fillRect(-2, -player.h / 2 + 12, player.w / 2 - 2, 4);

  ctx.restore();
}

function draw() {
  drawBackground();
  drawPits();
  drawPlatforms();
  drawCoins();
  drawFlag();
  drawEnemies();
  drawPlayer();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

updateHud();
loop();
