// ============================================================
// 05-audio.js
// Web Audio API: music tracks, SFX, fullscreen toggle
// (originally sintara_v25.html lines 82-171)
// ============================================================

let AC=null,musicVol=0.65;
let SFX_ON=true,MUSIC_ON=true;

// ====== МУЗЫКАЛЬНАЯ СИСТЕМА ======
// Просто добавляй/убирай файлы — остальное автоматически.
// Треки в каждой группе сменяются по окончании друг друга.
const MUSIC_CONFIG={
  prologue: [
    'music/prologue_01.mp3',
  ],
  gameplay: [
    'music/gameplay_01.mp3',
    // 'music/gameplay_02.mp3',  // раскомментируй чтобы добавить трек
  ],
  battle: [
    'music/battle_01.mp3',
    // 'music/battle_02.mp3',
  ],
  epilogue: [
    'music/epilogue_01.mp3',
  ],
};

let _mAudio=null;   // текущий Audio-элемент
let _mState=null;   // текущий стейт музыки
let _mIdx=0;        // индекс трека внутри стейта

function _getMusicState(G){
  if(!G)return 'prologue';
  const s=G.state;
  if(s==='title'||s==='intro'||s==='menu')return 'prologue';
  if(s==='credits'||s==='gameover')return 'epilogue';
  if(s==='finale_tina'){
    if(G.finale&&(G.finale.showingVictory||G.finale.catSceneStarted||G.finale.epilogueStarted))return 'epilogue';
    return 'battle';
  }
  return 'gameplay';
}
function _playTrack(stateName,idx){
  const tracks=MUSIC_CONFIG[stateName];
  if(!tracks||tracks.length===0)return;
  if(_mAudio){_mAudio.pause();_mAudio.onended=null;_mAudio=null;}
  _mState=stateName;
  _mIdx=((idx%tracks.length)+tracks.length)%tracks.length;
  const a=new Audio(tracks[_mIdx]);
  a.volume=MUSIC_ON?musicVol:0;
  a.onended=()=>_playTrack(stateName,_mIdx+1); // следующий трек по кругу
  a.play().catch(()=>{});
  _mAudio=a;
}
function updateMusicForGame(G){
  const needed=_getMusicState(G);
  if(needed!==_mState){
    _playTrack(needed,0);
  }else if(_mAudio){
    _mAudio.volume=MUSIC_ON?musicVol:0;
    if(_mAudio.paused&&MUSIC_ON)_mAudio.play().catch(()=>{});
  }else{
    _playTrack(needed,0);
  }
}
function cycleMusicTrack(G){
  const state=_mState||_getMusicState(G);
  const tracks=MUSIC_CONFIG[state];
  if(!tracks||tracks.length===0){sfxUI();return;}
  _playTrack(state,_mIdx+1);
  sfxUI();
}
function getCurrentTrackName(){
  const tracks=MUSIC_CONFIG[_mState];
  if(!tracks||tracks.length===0)return '—';
  return (_mIdx+1)+'/'+tracks.length;
}
function initAC() {
  if (!AC) {
    try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
  }
}

// Простой осциллятор с экспоненциальным затуханием. f0/f1 — старт/конец слайда.
function bip(f, d, v = 0.2, tp = 'square', f0 = null, f1 = null) {
  if (!AC || !SFX_ON) return;
  try {
    const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime;
    o.type = tp;
    if (f0) {
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(Math.max(20, f1 || f), t + d * .8);
    } else {
      o.frequency.setValueAtTime(f, t);
    }
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g); g.connect(AC.destination);
    o.start(t); o.stop(t + d + .01);
  } catch (e) {}
}

// Белый шум через lowpass-фильтр.
function noise(d, v = .2, f = 2000) {
  if (!AC || !SFX_ON) return;
  try {
    const bs = AC.sampleRate * d, buf = AC.createBuffer(1, bs, AC.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bs; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bs);
    const src = AC.createBufferSource(), g = AC.createGain(), flt = AC.createBiquadFilter();
    src.buffer = buf;
    flt.type = 'lowpass'; flt.frequency.value = f;
    g.gain.setValueAtTime(v, AC.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + d);
    src.connect(flt); flt.connect(g); g.connect(AC.destination);
    src.start();
  } catch (e) {}
}

// Лазер — 3 разные тембры по уровню оружия (1..3).
function sfxL(lv) {
  if (!AC) return;
  if (lv === 1) {
    bip(1000, .06, .08, 'square',   1400, 500);
    bip(1500, .04, .05, 'triangle', 1800, 800);
  } else if (lv === 2) {
    bip(500, .12, .13, 'sawtooth', 700, 300);
    bip(800, .08, .06, 'square',   1000, 500);
  } else {
    bip(200, .28, .18, 'sawtooth', 280,  70);
    bip(320, .28, .1,  'square',   430, 110);
    noise(.2, .08, 800);
  }
}

// Взрыв.
function sfxX(sz = 1) {
  if (!AC) return;
  bip( 80, .11 + sz * .09, .22, 'sawtooth', 200, 40);
  bip(120, .07,            .1,  'square',   240, 55);
  noise(.2 + sz * .1, .15, 1200);
}

// Power-up — восходящая трель.
function sfxPU() {
  if (!AC) return;
  bip(660, .05, .1, 'square');
  setTimeout(() => bip( 880, .05, .1, 'square'),  55);
  setTimeout(() => bip(1100, .08, .1, 'square'), 110);
}

function sfxUI()  { if (AC) bip(500, .04, .06, 'square'); }
function sfxUI2() {
  if (!AC) return;
  bip(700, .05, .07, 'square');
  setTimeout(() => bip(900, .05, .06, 'square'), 40);
}

// Приземление — мажорное трезвучие.
function sfxLand() {
  if (!AC) return;
  bip(220, .3,  .12, 'sine', 440, 220);
  setTimeout(() => bip(330, .3,  .1,  'sine', 660, 330), 140);
  setTimeout(() => bip(440, .38, .12, 'sine', 880, 440), 280);
}

function sfxHit() {
  if (!AC) return;
  bip(140, .09, .16, 'sawtooth', 280, 90);
  noise(.1, .1, 500);
}

function sfxShield() {
  if (!AC) return;
  bip(600, .15, .08, 'triangle', 400,  800);
  bip(900, .1,  .05, 'sine',     700, 1000);
}

// Мягкий «писк» во время печати реплики — sine вместо square, тише и ниже.
function sfxDlg() { if (AC) bip(550 + Math.random() * 100, .025, .03, 'sine'); }

function sfxBoss() {
  if (!AC) return;
  bip(100, .4, .2, 'sawtooth', 150, 60);
  noise(.3, .15, 600);
}

function sfxBoom() {
  if (!AC) return;
  bip(80, .18, .22, 'sawtooth', 140, 40);
  noise(.22, .18, 900);
}

function sfxShoot() {
  if (!AC) return;
  bip(350, .06, .12, 'square', 500, 200);
}

// Фанфары победы — мажорная гамма C→E→G→C.
function sfxVictory() {
  if (!AC) return;
  bip(523, .2, .15, 'square');
  setTimeout(() => bip( 659, .2, .15, 'square'), 200);
  setTimeout(() => bip( 784, .2, .15, 'square'), 400);
  setTimeout(() => bip(1047, .4, .2,  'square'), 600);
}

// ★ Phase 5.3: Звук разблокировки достижения — короткая восходящая мажорная гамма.
function sfxAchievement() {
  if (!AC) return;
  bip(523, .12, .10, 'sine');
  setTimeout(() => bip(659, .12, .10, 'sine'),  70);
  setTimeout(() => bip(784, .12, .10, 'sine'), 140);
  setTimeout(() => bip(1047, .28, .14, 'sine'), 210);
}

// ★ Phase 4.4: Низкое урчание перед посадкой — вход в атмосферу.
//   Шум через лоупасс + лёгкий низкий sawtooth-нарастающий тон.
function sfxAtmosphereEnter() {
  if (!AC || !SFX_ON) return;
  noise(.8, .12, 350);
  bip(60, .9, .15, 'sawtooth', 60, 110);
}

// ★ Phase 3.2: Эмоциональная sine-трель для финальной сцены с РАЙГАРОМ.
//   Медленная, мажорная, не торжествующая — благодарная.
function sfxEmotional() {
  if (!AC) return;
  bip(440, .9, .12, 'sine', 440, 660);                      // мягкий подъём
  setTimeout(() => bip(660, .9, .10, 'sine', 660, 523), 350); // спуск
  setTimeout(() => bip(784, 1.4, .12, 'sine', 784, 784), 800);// тёплая сустейн-нота
}

function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) {
      const el = document.documentElement;
      (el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen).call(el);
    } else {
      (document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen).call(document);
    }
  } catch (e) {}
}
