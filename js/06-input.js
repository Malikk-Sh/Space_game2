// ============================================================
// 06-input.js
// Keyboard + touch input handling, joystick, on-screen buttons
// depends on: 01-core.js, 05-audio.js (initAC)
// (originally sintara_v25.html lines 173-258)
// ============================================================

// ======= КЛАВИАТУРА =======
// K  — какие клавиши сейчас зажаты
// KD — какие клавиши «только что» нажаты (one-shot, сбрасывается в flushIn)
const K = {}, KD = {};
let mX = 0, mY = 0, mC = false;     // курсор + только что был клик
let ALLOW_JOY = true;                // разрешён ли тач-джойстик в текущей сцене
let TAP_FIRE = false;                // в космосе любой тач — выстрел

const _PREVENT_DEFAULT_KEYS = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'];
addEventListener('keydown', e => {
  if (!K[e.code]) KD[e.code] = true;
  K[e.code] = true;
  if (_PREVENT_DEFAULT_KEYS.includes(e.code)) e.preventDefault();
});
addEventListener('keyup', e => { K[e.code] = false; });

// ======= ТАЧ =======
const TOUCH = {
  joyId: -1, joyActive: false,
  joyBaseX: 0, joyBaseY: 0,
  joyX: 0, joyY: 0, joyDX: 0, joyDY: 0,
  btns: [], pointerTouchIds: {},
  fire: false, fireId: -1,
};

function setJoyEnabled(enabled) {
  ALLOW_JOY = enabled;
  if (!enabled) {
    TOUCH.joyId = -1;
    TOUCH.joyActive = false;
    TOUCH.joyDX = 0;
    TOUCH.joyDY = 0;
  }
}

// Перевод координат клиентского события в внутренние координаты canvas (LWxLH).
function canvasCoord(clientX, clientY) {
  const r = CV.getBoundingClientRect();
  return {
    x: (clientX - r.left) * (LW / r.width),
    y: (clientY - r.top)  * (LH / r.height),
  };
}
function handlePointerDown(id, x, y){
  mX=x;mY=y;
  // Если игра на паузе — пропускаем джойстик, fire, кнопки сцены: только mC для опций меню паузы.
  if(window.G && window.G.paused){
    mC=true;
    return;
  }
  // Если активен туториал — ЛЮБОЙ клик/тап должен переключать его шаг.
  // Иначе джойстик/TAP_FIRE/кнопки перехватят тап и mC никогда не выставится.
  if(window.G && window.G.tutorial && window.G.tutorial.visible){
    mC=true;
    return;
  }
  // Иконка паузы должна нажиматься поверх джойстика, особенно в космосе на мобильных.
  if(mX>=PAUSE_ICON_X-8&&mX<=PAUSE_ICON_X+PAUSE_ICON_W+8&&mY>=PAUSE_ICON_Y-8&&mY<=PAUSE_ICON_Y+PAUSE_ICON_H+8){
    mC=true;
    return;
  }
  for(let i=0;i<TOUCH.btns.length;i++){
    const b=TOUCH.btns[i];
    if(!b.enabled)continue;
    if(b.hidden && !(b.id&&b.id.indexOf('ch')===0))continue;
    if(Math.hypot(mX-b.x,mY-b.y)<=b.r){
      b.pressed=true;b.justPressed=true;
      TOUCH.pointerTouchIds[id]=i;
      if(b.id==='fire'){TOUCH.fire=true;TOUCH.fireId=id;}
      return;
    }
  }
  // Джойстик: только в левой нижней части экрана
  if(USE_TOUCH_UI&&ALLOW_JOY&&mX<LW*0.42&&mY>LH*0.28){
    TOUCH.joyActive=true;TOUCH.joyId=id;TOUCH.joyBaseX=mX;TOUCH.joyBaseY=mY;TOUCH.joyX=mX;TOUCH.joyY=mY;TOUCH.joyDX=0;TOUCH.joyDY=0;
    return;
  }
  // TAP_FIRE: тап в правой части экрана = стрельба (вне кнопок и джойстика)
  if(USE_TOUCH_UI&&TAP_FIRE&&mX>=LW*0.42){
    TOUCH.fire=true;TOUCH.fireId=id;
    return;
  }
  mC=true;
}
function handlePointerMove(id,x,y){
  if(TOUCH.joyId===id){
    const dx=x-TOUCH.joyBaseX,dy=y-TOUCH.joyBaseY;const MAX=24;const d=Math.hypot(dx,dy);
    if(d>MAX){TOUCH.joyX=TOUCH.joyBaseX+dx/d*MAX;TOUCH.joyY=TOUCH.joyBaseY+dy/d*MAX;TOUCH.joyDX=dx/d;TOUCH.joyDY=dy/d;}
    else{TOUCH.joyX=x;TOUCH.joyY=y;TOUCH.joyDX=dx/MAX;TOUCH.joyDY=dy/MAX;}
  }
  const bi=TOUCH.pointerTouchIds[id];
  if(bi!=null){
    const b=TOUCH.btns[bi];const dx=x-b.x,dy=y-b.y;
    if(dx*dx+dy*dy>(b.r+8)*(b.r+8)){
      b.pressed=false;
      if(b.id==='fire'&&TOUCH.fireId===id){TOUCH.fire=false;TOUCH.fireId=-1;}
      delete TOUCH.pointerTouchIds[id];
    }
  }
  mX=x;mY=y;
}
function handlePointerUp(id){
  if(TOUCH.fireId===id){TOUCH.fire=false;TOUCH.fireId=-1;}
  if(TOUCH.joyId===id){TOUCH.joyId=-1;TOUCH.joyActive=false;TOUCH.joyDX=0;TOUCH.joyDY=0;}
  const bi=TOUCH.pointerTouchIds[id];
  if(bi!=null){if(TOUCH.btns[bi])TOUCH.btns[bi].pressed=false;delete TOUCH.pointerTouchIds[id];}
  // На мобильных уводим курсор за экран, чтобы hover не залипал на кнопке паузы / иконках.
  if(USE_TOUCH_UI){mX=-100;mY=-100;}
}
// ======= СЛУШАТЕЛИ CANVAS =======
CV.addEventListener('touchstart', e => {
  e.preventDefault();
  for (const t of e.changedTouches) {
    const c = canvasCoord(t.clientX, t.clientY);
    handlePointerDown(t.identifier, c.x, c.y);
  }
}, { passive: false });

CV.addEventListener('touchmove', e => {
  e.preventDefault();
  for (const t of e.changedTouches) {
    const c = canvasCoord(t.clientX, t.clientY);
    handlePointerMove(t.identifier, c.x, c.y);
  }
}, { passive: false });

CV.addEventListener('touchend', e => {
  e.preventDefault();
  for (const t of e.changedTouches) handlePointerUp(t.identifier);
}, { passive: false });

CV.addEventListener('touchcancel', e => {
  for (const t of e.changedTouches) handlePointerUp(t.identifier);
});

CV.addEventListener('mousemove', e => {
  const c = canvasCoord(e.clientX, e.clientY);
  mX = c.x; mY = c.y;
});

CV.addEventListener('mousedown', e => {
  const c = canvasCoord(e.clientX, e.clientY);
  mX = c.x; mY = c.y; mC = true;
  initAC();   // первый клик «разблокирует» Web Audio Context
});

CV.addEventListener('contextmenu', e => e.preventDefault());

// ======= УПРАВЛЕНИЕ КНОПКАМИ И СБРОСОМ ВВОДА =======
// Сбрасывается каждый кадр в loop() — KD/mC/justPressed это «one-shot».
function flushIn() {
  for (const k in KD) delete KD[k];
  mC = false;
  for (const b of TOUCH.btns) b.justPressed = false;
}

function resetBtns() {
  TOUCH.btns = [];
  TOUCH.pointerTouchIds = {};
}

function addBtn(id, x, y, r, label, col) {
  const b = {
    id, x, y, r, label,
    col: col || P.UIT,
    pressed: false, justPressed: false,
    enabled: true, hidden: false,
  };
  TOUCH.btns.push(b);
  return b;
}

function getBtn(id)  { return TOUCH.btns.find(b => b.id === id); }
function btnJust(id) { const b = getBtn(id); return b && b.justPressed; }
function btnHeld(id) { const b = getBtn(id); return b && b.pressed; }

