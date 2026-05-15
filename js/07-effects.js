// ============================================================
// 07-effects.js
// Screen shake, hit-stop, flash, particles, shockwaves, floating text, quest reward, notifications
// depends on: 01-core.js, 04-font.js
// (originally sintara_v25.html lines 259-282)
// ============================================================

// ======= SCREEN SHAKE =======
let shX = 0, shY = 0, shM = 0;
function shake(m) { shM = Math.max(shM, m); }
function applyShake() {
  if (shM > .1) {
    shX = (Math.random() - .5) * shM;
    shY = (Math.random() - .5) * shM;
    shM *= .80;
    cx.save();
    cx.translate(shX | 0, shY | 0);
  } else {
    shX = shY = shM = 0;
  }
}
function clearShake() { if (shX || shY) cx.restore(); }

// ======= HIT-STOP (заморозка кадра при попадании) =======
let hitStop = 0;
function hitStopAdd(f) { hitStop = Math.max(hitStop, f); }

// ======= SCREEN FLASH =======
let flashA = 0, flashCol = '#fff';
function flash(a = 0.3, col = '#fff') { flashA = Math.max(flashA, a); flashCol = col; }
function drawFlash() {
  if (flashA > 0.01) {
    cx.globalAlpha = flashA;
    cx.fillStyle = flashCol;
    cx.fillRect(0, 0, LW, LH);
    cx.globalAlpha = 1;
    flashA *= 0.78;
  }
}

// ======= ЧАСТИЦЫ =======
const PTS = [];
function spPts(x, y, n, cols, s1 = .5, s2 = 2, lf = 28, gv = .03, sz = 1.4) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = s1 + Math.random() * (s2 - s1);
    PTS.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      lf: lf + Math.random() * 4 | 0,
      ml: lf,
      col: cols[(Math.random() * cols.length) | 0],
      sz: 1 + Math.random() * sz,
      gv,
      fade: Math.random() * .2 + .7,
    });
  }
}
function updPts() {
  for (let i = PTS.length - 1; i >= 0; i--) {
    const p = PTS[i];
    p.x += p.vx; p.y += p.vy;
    p.vy += p.gv;
    p.vx *= .98; p.vy *= .99;
    p.lf--;
    if (p.lf <= 0) PTS.splice(i, 1);
  }
}
function drwPts() {
  for (const p of PTS) {
    const a = Math.min(1, p.lf / (p.ml * p.fade));
    cx.globalAlpha = a;
    cx.fillStyle = p.col;
    const s = Math.max(1, (p.sz * a) | 0) || 1;
    cx.fillRect((p.x - s / 2) | 0, (p.y - s / 2) | 0, s, s);
  }
  cx.globalAlpha = 1;
}

// ======= УДАРНЫЕ ВОЛНЫ (расширяющиеся кольца) =======
const SHK = [];
function addShockwave(x, y, r, col = P.WHT, lf = 16) {
  SHK.push({ x, y, r: 0, rMax: r, lf, ml: lf, col });
}
function updSHK() {
  for (let i = SHK.length - 1; i >= 0; i--) {
    const s = SHK[i];
    s.r += (s.rMax - s.r) * .22;
    s.lf--;
    if (s.lf <= 0) SHK.splice(i, 1);
  }
}
function drwSHK() {
  for (const s of SHK) {
    const a = s.lf / s.ml;
    cx.globalAlpha = a * .8;
    cx.strokeStyle = s.col;
    cx.lineWidth = 1;
    cx.beginPath(); cx.arc(s.x | 0, s.y | 0, s.r | 0, 0, Math.PI * 2); cx.stroke();
    if (s.r > 4) {
      cx.globalAlpha = a * .35;
      cx.beginPath(); cx.arc(s.x | 0, s.y | 0, (s.r * .7) | 0, 0, Math.PI * 2); cx.stroke();
    }
  }
  cx.globalAlpha = 1;
}

// ======= ВСПЛЫВАЮЩИЙ ТЕКСТ (урон/бонусы) =======
const FTX = [];
function fText(x, y, s, col) {
  FTX.push({ x, y, s, col, lf: 40, ml: 40, vy: -.8 });
}
function updFTX() {
  for (let i = FTX.length - 1; i >= 0; i--) {
    const f = FTX[i];
    f.y += f.vy;
    f.vy *= .92;
    f.lf--;
    if (f.lf <= 0) FTX.splice(i, 1);
  }
}
function drwFTX() {
  for (const f of FTX) {
    cx.globalAlpha = Math.min(1, f.lf / 12);
    txs(f.s, ((f.x - gw(f.s) / 2) | 0), f.y | 0, f.col, P.BLK);
    cx.globalAlpha = 1;
  }
}
