// ============================================================
// 12-scene-space.js
// Space scene (init/upd/drw) + dialog system
// depends on: everything above
// (originally sintara_v25.html lines 2253-2938)
// ============================================================

// ============================================================
// ★ Реестр оружия (Phase 2.2)
//   Источник истины: G.pl.wepIdx (0..5). Поле G.pl.wep остаётся как
//   legacy-маркер (1=L1-семейство, 2=L2-семейство) для финала, который
//   ещё использует только два уровня.
// ============================================================
const WEAPONS=[
  {id:'l1',     idx:0, name:'ЛАЗЕР L1', short:'L1', dmg:2,   en:10, cd:7,  kind:'simple',  col:P.L1,  lv:1, vx:7, range:52, legacyWep:1},
  {id:'spread', idx:1, name:'СПРЕД',     short:'SPR',dmg:1,   en:18, cd:14, kind:'spread',  col:P.L1L, lv:1, vx:6, range:40, legacyWep:1},
  {id:'missile',idx:2, name:'РАКЕТА',    short:'MSL',dmg:5,   en:25, cd:30, kind:'missile', col:P.ORA, lv:1, vx:3, range:90, legacyWep:1},
  {id:'l2',     idx:3, name:'ЛАЗЕР L2', short:'L2', dmg:10,  en:44, cd:28, kind:'simple',  col:P.L3,  lv:3, vx:5, range:40, legacyWep:2},
  {id:'beam',   idx:4, name:'ЛУЧ',       short:'BMM',dmg:0.5, en:1,  cd:0,  kind:'beam',    col:P.L2,  lv:1, vx:14,range:24, legacyWep:2},
  {id:'burst',  idx:5, name:'БЁРСТ',     short:'BST',dmg:3,   en:50, cd:36, kind:'burst',   col:P.YEL, lv:2, vx:7, range:50, legacyWep:2},
];

// Разблокировано ли оружие по индексу WEAPONS
function _wepUnlocked(G,idx){
  const inv=G.campaignState.inventory;
  switch(idx){
    case 0: return true; // L1 — стартовое
    case 1: return !!inv.spreadUnlocked;
    case 2: return !!inv.missileUnlocked;
    case 3: return !!inv.laserStrong;
    case 4: return !!inv.beamUnlocked;
    case 5: return !!inv.burstUnlocked;
  }
  return false;
}

// Переключиться на оружие по индексу. Если заблокировано — уведомление.
// Поддерживает оба пути входа: цифровая клавиша и циклическая кнопка.
function _switchWeapon(G,idx){
  if(!_wepUnlocked(G,idx)){
    G.notif='ЗАБЛОКИРОВАНО — КУПИ В МАСТЕРСКОЙ';
    G.notifT=80;G.notifCol=P.YEL;sfxHit();
    return false;
  }
  const w=WEAPONS[idx];
  G.pl.wepIdx=idx;
  G.pl.wep=w.legacyWep; // синхронизируем legacy-поле для финала/иных мест
  G.pl.burstQueue=0;    // сбрасываем активный бёрст при смене
  sfxUI();
  fText(G.pl.x,G.pl.y-12,w.short,w.col);
  return true;
}

// Цикл к следующему разблокированному оружию (touch UI).
function _cycleWeapon(G){
  const start=G.pl.wepIdx||0;
  for(let step=1;step<=WEAPONS.length;step++){
    const next=(start+step)%WEAPONS.length;
    if(_wepUnlocked(G,next)){_switchWeapon(G,next);return;}
  }
}

// Выстрел из конкретного оружия (используется и в space, и в финале).
//   rangeBoost — множитель дальности (в финале нужно больше: lf=160 вместо 52)
function _fireFromWeapon(G,p,w,rangeBoost){
  const dmgM=_DEV.dmgMult;
  const lf=Math.max(10,(w.range*(rangeBoost||1))|0);
  switch(w.kind){
    case 'simple':
      G.buls.push({x:p.x+12,y:p.y,vx:w.vx,lv:w.lv,lf,dmg:w.dmg*dmgM});
      sfxL(w.lv>=2?2:1);
      if(w.lv>=3){shake(2.5);flash(.2,w.col);}
      spPts(p.x+12,p.y,3,[w.col,P.WHT],.3,1.5,6,0);
      break;
    case 'spread':
      // Веер из 3 пуль: -15°, 0°, +15° (≈ ±0.26 рад)
      for(const ang of [-0.26, 0, 0.26]){
        G.buls.push({x:p.x+12,y:p.y,vx:Math.cos(ang)*w.vx,vy:Math.sin(ang)*w.vx,lv:1,lf,dmg:w.dmg*dmgM,spread:true});
      }
      sfxL(1);
      spPts(p.x+12,p.y,6,[w.col,P.WHT],.5,2,8,0);
      break;
    case 'missile':
      // Самонаведение на ближайшего врага
      let target=null,bd=Infinity;
      for(const e of G.enms){
        const d=Math.hypot(e.x-p.x,e.y-p.y);
        if(d<bd){bd=d;target=e;}
      }
      G.buls.push({x:p.x+12,y:p.y,vx:w.vx,vy:0,lv:1,lf,dmg:w.dmg*dmgM,missile:true,target,t:0});
      sfxShoot();
      spPts(p.x+12,p.y,4,[P.ORA,P.RED,P.WHT],.3,1.5,8,0);
      break;
    case 'beam':
      // Луч — мини-пуля каждый кадр (вызывается из самого боевого цикла, не отсюда)
      G.buls.push({x:p.x+12,y:p.y,vx:w.vx,lv:1,lf,dmg:w.dmg*dmgM,beam:true});
      if(G.sT%6===0)bip(1500,.03,.05,'sawtooth');
      break;
  }
}

// Запуск Burst-режима — 5 пуль за 30 кадров, оплачивается единоразово.
function _startBurst(G,p,w){
  p.burstQueue=5;
  p.burstNext=0;
  shake(2);
}

function initSpace(G){saveCheckpoint(G,'space');TAP_FIRE=true;ALLOW_JOY=true;Object.assign(G,{state:'space',asts:[],buls:[],rits:[],enms:[],ebuls:[],pups:[],sT:0,prog:0,appr:false,landT:0,astST:40,enmST:240,combo:0,comboT:0,transIn:60,landingTriggered:false,_minibossSpawned:false,_sniperAlive:false});Object.assign(G.pl,{x:50,y:LH/2,vx:0,vy:0,inv:0,boost:0,squash:0,drift:0,boostWas:false,wep:Math.min(2,G.pl.wep||1),burstQueue:0,burstNext:0});
// ★ Миграция: если wepIdx ещё не задан, выводим из legacy p.wep (1→0 L1, 2→3 L2)
if(G.pl.wepIdx==null)G.pl.wepIdx=(G.pl.wep===2?3:0);
// Сброс на L1, если выбран недоступный слот (после загрузки старого сейва)
if(!_wepUnlocked(G,G.pl.wepIdx)){G.pl.wepIdx=0;G.pl.wep=1;}
if(G.pl.wep===2&&!G.campaignState.inventory.laserStrong)G.pl.wep=1;G.apprSX=G.pl.x;G.apprSY=G.pl.y;PTS.length=0;SHK.length=0;FTX.length=0;
// ★ Phase 4.3: туманности окрашиваются в биом целевой планеты (холодные/газовые/раскалённые/мёртвые)
initStars(G.campaignState.targetPlanet);
resetBtns();if(USE_TOUCH_UI){addBtn('boost',LW-20,36,14,'>>',P.TH2);addBtn('wcyc',LW-40,LH-22,11,'WP',P.L1);addBtn('ship',LW-20,LH-22,10,'S',P.UIT);}
// ★ Phase 2.4: вход в корабль во время полёта — updSpace не вызывается пока state='ship_view', все процессы (топливо/прогресс/враги) застывают
  // === ТУТОРИАЛ КОСМОСА (только при первом полёте) ===
  if(!G.campaignState.flags.tutSpaceShown){
    G.campaignState.flags.tutSpaceShown=true;
    setTimeout(()=>{
      if(G.state!=='space')return;
      const touch=USE_TOUCH_UI;
      startTutorial(G,[
        {text:['ДОБРО ПОЖАЛОВАТЬ В КОСМОС!','ТЫ - ПОСЛЕДНЯЯ НАДЕЖДА СИСТЕМЫ.'],
         tx:LW/2-90,ty:LH/2-22},
        {text:touch?['ДЖОЙСТИК СЛЕВА:','УПРАВЛЯЙ КОРАБЛЁМ ПЕРЕТАСКИВАНИЕМ.']:['КЛАВИШИ WASD ИЛИ СТРЕЛКИ:','УПРАВЛЯЙ КОРАБЛЁМ.'],
         hx:touch?40:80,hy:touch?LH-30:LH/2,arrow:touch?'down':'left',
         tx:touch?72:120,ty:touch?LH-72:LH/2-22,hr:touch?22:14},
        {text:touch?['ПРАВАЯ ЧАСТЬ ЭКРАНА:','ТАП ДЛЯ СТРЕЛЬБЫ.']:['ПРОБЕЛ:','СТРЕЛЯТЬ.'],
         hx:touch?LW-50:LW/2,hy:touch?LH/2:LH-30,arrow:touch?'right':'up',
         tx:touch?LW-160:LW/2-80,ty:touch?LH/2-22:LH-58,hr:18},
        {text:['СВЕРХУ - HUD:','ХП, ЭНЕРГИЯ, ПРОГРЕСС ПУТИ.','НЕ ДАЙ ХП УПАСТЬ ДО НУЛЯ!'],
         hrect:{x:0,y:0,w:LW,h:14},arrow:'up',hx:LW/2,hy:16,tx:80,ty:24},
        {text:['СОБИРАЙ КРИСТАЛЛЫ И РЕСУРСЫ.','УНИЧТОЖАЙ ПИРАТОВ.','ДОЛЕТАЙ ДО ПЛАНЕТЫ - АВТОМАТ.']},
      ]);
    },200);
  }
}

function spwnAst(G){const sizes=[4,6,9],s=sizes[(Math.random()*3)|0];const y=s+4+Math.random()*(LH-s*2-24);const sp=.6+Math.random()*1.4+(1-G.prog)*.4;const cracks=[];for(let i=0;i<3+((Math.random()*4)|0);i++)cracks.push([Math.floor(Math.random()*s*2-s),Math.floor(Math.random()*s*2-s)]);G.asts.push({x:LW+s+4,y,s,sp,hp:s,maxHp:s,cracks,drop:Math.random()<.5,rot:0,flash:0});}
function spwnPirate(G){const y=30+Math.random()*(LH-60);G.enms.push({type:'pirate',x:LW+12,y,vx:-1.1-Math.random()*.6,vy:0,t:0,hp:6,maxHp:6,shootCD:60+Math.random()*60,flash:0});}

// ★ Танк — медленный, тяжёлый, крупные снаряды. Появляется при prog > 0.4.
function spwnTank(G){
  const y=40+Math.random()*(LH-80);
  G.enms.push({type:'tank',x:LW+14,y,vx:-0.4,vy:0,t:0,hp:60,maxHp:60,shootCD:60+Math.random()*30,flash:0});
}

// ★ Рой дронов-камикадзе — 3-5 штук, преследуют игрока, гибнут на таран.
function spwnDroneSwarm(G){
  const n=3+Math.floor(Math.random()*3);
  const baseY=40+Math.random()*(LH-80);
  for(let i=0;i<n;i++){
    G.enms.push({
      type:'drone',
      x:LW+10+i*8,
      y:baseY+(Math.random()-.5)*30,
      vx:-1.2,vy:0,
      t:i*5,
      hp:4,maxHp:4,shootCD:-1,flash:0,
    });
  }
}

// ★ Снайпер — почти неподвижен. Заряжает выстрел 60 кадров (видимый луч), затем мгновенный высокоурон снаряд.
function spwnSniper(G){
  const y=40+Math.random()*(LH-80);
  G.enms.push({type:'sniper',x:LW+10,y,vx:-0.1,vy:0,t:0,hp:25,maxHp:25,chargeT:0,targetY:y,flash:0});
}

// ★ Мини-босс — кульминация полёта. 2 фазы (стрельба → таран при HP<50%). Один за полёт.
function spwnMiniboss(G){
  const y=LH/2+(Math.random()-.5)*30;
  G.enms.push({type:'miniboss',x:LW+18,y,vx:-0.5,vy:0,t:0,hp:150,maxHp:150,shootCD:90,phase:'shoot',_raged:false,flash:0});
}

// ★ Взвешенный диспетчер спавна — выбирает тип врага по G.prog.
//   Мини-босс — один раз за полёт, при prog > 0.7.
//   Снайпер — одновременно живой только один.
function spwnEnemy(G){
  const prog=G.prog||0;
  // Мини-босс — один раз за полёт (контролируем через G._minibossSpawned)
  if(prog>0.7&&!G._minibossSpawned){
    G._minibossSpawned=true;
    spwnMiniboss(G);
    G.notif='ПИРАТСКИЙ КРЕЙСЕР НА ГОРИЗОНТЕ!';G.notifT=120;G.notifCol=P.RED;
    sfxBoss();
    return;
  }
  // Снайпер — только один живой (контролируем через G._sniperAlive)
  if(prog>0.3&&!G._sniperAlive&&Math.random()<0.15){
    G._sniperAlive=true;
    spwnSniper(G);
    return;
  }
  // Дрон-рой — prog > 0.2
  if(prog>0.2&&Math.random()<0.25){
    spwnDroneSwarm(G);
    return;
  }
  // Танк — prog > 0.4
  if(prog>0.4&&Math.random()<0.3){
    spwnTank(G);
    return;
  }
  // По умолчанию — пират
  spwnPirate(G);
}

function spwnPowerUp(G,x,y){const types=['shield','health','energy'];const type=types[(Math.random()*3)|0];G.pups.push({x,y,vx:-.8,vy:(Math.random()-.5)*1.0,type,t:0,lf:300});}

function updSpace(G){
  handlePauseInput(G);if(G.paused)return;
  // Туториал блокирует игровой ввод
  if(G.tutorial){updTutorial(G);return;}
  // ★ Phase 2.4: вход в корабль во время полёта (Tab или экранная кнопка S)
  //   updSpace перестаёт вызываться сразу же — все процессы (топливо, прогресс,
  //   враги) застывают, состояние сохраняется в G.* до возврата.
  if(KD.Tab||btnJust('ship')){
    startTrans(()=>{
      G.shipReturnState='space';
      G.state='ship_view';
      G.shipT=0;
      TAP_FIRE=false;
      resetBtns();
      addBtn('back',20,24,10,'<',P.UIT);
      ALLOW_JOY=false;TOUCH.joyId=-1;TOUCH.joyActive=false;
    });
    sfxUI2();
    return;
  }
  const p=G.pl;
  G.sT++;
  const sh=G.ship;
  // Топливо теперь отвечает за маршевый ход и ускорение. При нуле остаётся аварийная тяга.
  // ★ Phase 2.4: эффекты распределения рабочих
  ensureShipWorkers(G);
  const _sw=G.ship.workers;
  // Fuel-room снижает расход топлива (1 рабочий = -5% расхода)
  const _fuelEff=1/(1+_sw.fuel*0.05);
  sh.fuel=Math.max(0,sh.fuel-0.009*_fuelEff);
  if(sh.fuel<1&&G.sT%120===0){G.notif='ТОПЛИВО КОНЧИЛОСЬ: АВАРИЙНЫЙ ХОД X0.3';G.notifT=90;G.notifCol=P.RED;sfxHit();}
  else if(sh.fuel<15&&G.sT%180===0){G.notif='КРИТИЧНЫЙ ТОПЛИВО! ЗАГРУЗИ РЕСУРСЫ НА КОРАБЛЬ';G.notifT=110;G.notifCol=P.RED;}
  else if(sh.fuel<30&&G.sT%200===0){G.notif='ТОПЛИВО КОНЧАЕТСЯ... ОСТАЛОСЬ: '+Math.floor(sh.fuel)+'%';G.notifT=80;G.notifCol=P.ORA;}
  // Power-room регенерирует энергию (1 рабочий = +0.18 EN/кадр)
  p.en=Math.min(p.men,p.en+.18*_sw.power);
  // Workshop-room продвигает крафт-очередь (1 рабочий = +1 ед/кадр)
  if(_sw.workshop>0&&G.ship.craftQueue&&G.ship.craftQueue.length>0){
    const item=G.ship.craftQueue[0];
    item.progress=(item.progress||0)+_sw.workshop;
    if(item.progress>=item.total){
      _completeCraft(G,item);
      G.ship.craftQueue.shift();
    }
  }
  if(p.en<15&&G.sT%180===0){G.notif='ЭНЕРГИЯ НИЗКАЯ! ЭКОНОМЬ ВЫСТРЕЛЫ';G.notifT=70;G.notifCol=P.ENL;}
  if(p.shield>0)p.shield--;
  if(p.boost>0)p.boost--;
  if(G.comboT>0)G.comboT--;
  else if(G.combo>1)G.combo=0;

  // Режим посадки
  if(G.appr){
    G.landT++;
    const t=G.landT;
    const rv=Math.min(100,t*0.7);
    const pcx=(LW-42+t*0.15);
    const pcy=(LH/2);
    const tx=Math.min(LW+14,pcx-rv*0.65);
    const ty=pcy;
    const a=Math.min(1,t/280);
    p.x=G.apprSX+(tx-G.apprSX)*a;
    p.y=G.apprSY+(ty-G.apprSY)*a-Math.sin(a*Math.PI)*6;
    p.vx=0;p.vy=0;p.thrT++;
    if(t%2===0){
      const txp=p.x-13;
      PTS.push({x:txp+(Math.random()-.5)*2,y:p.y+(Math.random()-.5)*3,vx:-.8-Math.random()*.8,vy:(Math.random()-.5)*.3,lf:12,ml:16,col:(Math.random()<.5?P.TH1:P.TH2),sz:1,gv:0,fade:.7});
    }
    scrollStars(3+t*.045);
    // ★ Phase 4.4: эффект приближения — низкий рык на старте, шиммер при пересечении границы атмосферы.
    if(t===5)sfxAtmosphereEnter();
    if(t===55)sfxLand();
    if(t===120){
      const pInfo=PLANETS[G.campaignState.targetPlanet]||PLANETS.drosh;
      flash(.35,pInfo.approachCol||P.CYA);
      shake(2);
    }
    if(t===122)shake(2);  // двойной shake для «гулкого» удара по атмосфере
    // Удлинённая посадка (было 170 → стало 280) даёт время прочитать брифинг.
    if(t>280){
      if(!G.landingTriggered){
        G.landingTriggered=true;
        startTrans(()=>landOnTargetPlanet(G));
      }
      return;
    }
    updPts();updSHK();updFTX();
    return;
  }

  // Управление
  let ix=0,iy=0;
  if(K.KeyW||K.ArrowUp)iy-=1;
  if(K.KeyS||K.ArrowDown)iy+=1;
  if(K.KeyA||K.ArrowLeft)ix-=1;
  if(K.KeyD||K.ArrowRight)ix+=1;
  if(USE_TOUCH_UI&&TOUCH.joyActive){ix=TOUCH.joyDX;iy=TOUCH.joyDY;}
  const il=Math.hypot(ix,iy)||1;
  const boostOn=(K.ShiftLeft||btnHeld('boost'))&&p.en>10&&sh.fuel>1;
  const thrust=boostOn?.55:.35;
  if(boostOn){p.en-=.5;sh.fuel=Math.max(0,sh.fuel-.055);p.boost=4;}
  if((ix||iy)&&sh.fuel>0)sh.fuel=Math.max(0,sh.fuel-.018);
  p.vx+=(ix/il)*thrust*(ix?1:0);
  p.vy+=(iy/il)*thrust*(iy?1:0);
  // ★ v22 Drift: если только что отпустили буст — держим инерцию 30 кадров (медленнее трение)
  const wasBoosting=p.boostWas;
  p.boostWas=boostOn;
  if(!boostOn&&wasBoosting)p.drift=30; // запускаем drift-окно
  if(p.drift>0){p.drift--;p.vx*=.94;p.vy*=.94;} // мягкое торможение во время drift
  else{p.vx*=.82;p.vy*=.82;}                      // обычное торможение
  const maxSp=boostOn?2.4:(p.drift>0?2.1:1.8);
  const sp=Math.hypot(p.vx,p.vy);
  if(sp>maxSp){p.vx=p.vx/sp*maxSp;p.vy=p.vy/sp*maxSp;}
  p.x=Math.max(12,Math.min(LW*.52,p.x+p.vx));
  p.y=Math.max(20,Math.min(LH-20,p.y+p.vy));
  p.thrT++;

  // Выхлоп двигателя + drift-след (синеватые искры после буста)
  if(G.sT%2===0){
    const tx=p.x-13-(boostOn?4:0);
    PTS.push({x:tx+(Math.random()-.5)*2,y:p.y+(Math.random()-.5)*3,vx:-.8-Math.random()*.8,vy:(Math.random()-.5)*.3,lf:10+Math.random()*6|0,ml:16,col:boostOn?(Math.random()<.5?P.L1:P.L1L):(Math.random()<.5?P.TH1:P.TH2),sz:1,gv:0,fade:.7});
  }
  // ★ v22 Drift trail: пока скользим — редкие голубые частицы по бокам
  if(p.drift>0&&G.sT%3===0){
    const dAlpha=p.drift/30;
    PTS.push({x:p.x-8+(Math.random()-.5)*4,y:p.y+(Math.random()-.5)*6,vx:-p.vx*.3-Math.random()*.4,vy:-p.vy*.3+(Math.random()-.5)*.3,lf:14+Math.random()*8|0,ml:22,col:Math.random()<.5?P.L1L:'#88eeff',sz:1,gv:0,fade:dAlpha*.6});
  }
  drwShipSmoke(p.x,p.y,p.hp/p.mhp);

  // ★ Переключение оружия — цифры 1..6 или кнопка цикла на тач
  for(let d=0;d<6;d++){
    if(KD['Digit'+(d+1)]||KD['Numpad'+(d+1)]){_switchWeapon(G,d);break;}
  }
  if(btnJust('wcyc'))_cycleWeapon(G);

  // ★ Стрельба — диспетчер по типу оружия (simple/spread/missile/beam/burst)
  p.sCD=Math.max(0,p.sCD-1);
  // Burst-очередь работает независимо от текущего нажатия кнопки
  if(p.burstQueue>0){
    if(p.burstNext<=0){
      // Лёгкий джиттер по Y для визуальной «очерёдности»
      G.buls.push({x:p.x+12,y:p.y+(Math.random()-.5)*4,vx:7,lv:2,lf:50,dmg:3*_DEV.dmgMult,burst:true});
      spPts(p.x+12,p.y,2,[P.YEL,P.WHT],.3,1,5,0);
      sfxL(1);
      p.burstQueue--;
      p.burstNext=6;
    } else {
      p.burstNext--;
    }
  }
  const w=WEAPONS[p.wepIdx||0]||WEAPONS[0];
  const firing=K.Space||K.KeyZ||(USE_TOUCH_UI&&TOUCH.fire);
  if(firing){
    if(w.kind==='beam'){
      // Луч: 1 EN/кадр, мини-пуля каждый кадр (без cooldown)
      if(p.en>=w.en){
        p.en-=w.en;
        _fireFromWeapon(G,p,w);
      } else if(G.sT%15===0){
        fText(p.x,p.y-12,'NET EN',P.ENL);
      }
    } else if(w.kind==='burst'){
      if(p.sCD===0 && p.burstQueue===0){
        if(p.en>=w.en){
          p.en-=w.en;p.sCD=w.cd;
          _startBurst(G,p,w);
        } else if(G.sT%15===0){
          fText(p.x,p.y-12,'NET EN',P.ENL);
        }
      }
    } else if(p.sCD===0){
      // simple / spread / missile — оплачивается каждый выстрел
      if(p.en>=w.en){
        p.en-=w.en;p.sCD=w.cd;
        _fireFromWeapon(G,p,w);
      } else if(G.sT%15===0){
        fText(p.x,p.y-12,'NET EN',P.ENL);
      }
    }
  }

  // Спавн астероидов
  G.astST--;
  if(G.astST<=0){
    spwnAst(G);
    G.astST=Math.max(8,20+Math.floor(Math.random()*22)-Math.floor(G.prog*12));
  }

  // ★ Спавн врагов — взвешенный по G.prog (пират/танк/дрон-рой/снайпер/мини-босс)
  G.enmST--;
  if(G.enmST<=0&&G.sT>400){
    spwnEnemy(G);
    G.enmST=180+Math.floor(Math.random()*160);
  }

  // Обновление астероидов
  for(let i=G.asts.length-1;i>=0;i--){
    const a=G.asts[i];
    a.x-=a.sp;a.rot+=.5;a.flash*=.8;
    if(a.x<-20){G.asts.splice(i,1);continue;}
    if(p.inv<=0&&Math.abs(p.x-a.x)<a.s+7&&Math.abs(p.y-a.y)<a.s+6){
      if(p.shield>0){
        sfxShield();flash(.3,P.CYA);shake(2);
        p.shield=0;p.inv=25;
        spPts(a.x,a.y,10,[P.CYA,P.WHT],.5,2,16);
        addShockwave(a.x,a.y,12,P.CYA);
        G.asts.splice(i,1);
      }else{
        // ★ Phase 2.4: Bridge-рабочие снижают входящий урон (5% за каждого)
        p.hp-=(a.s*2+4)*(1-_sw.bridge*0.05);p.inv=55;p.squash=6;
        shake(5);flash(.35,P.HP);sfxHit();G.combo=0;
        spPts(p.x,p.y,14,[P.HP,'#ff8888',P.WHT],1,3.5,20);
        addShockwave(p.x,p.y,14,P.HP);
        hitStopAdd(4);G.asts.splice(i,1);
      }
    }
  }
  if(p.inv>0)p.inv--;
  if(p.squash>0)p.squash--;
  for(let i=G.buls.length-1;i>=0;i--){
    const b=G.buls[i];
    // ★ Ракета — самонаведение на цель
    if(b.missile){
      b.t=(b.t||0)+1;
      // Перевыбор цели если предыдущая мертва/удалена
      if(!b.target||b.target.hp<=0||G.enms.indexOf(b.target)<0){
        let best=null,bd=Infinity;
        for(const e of G.enms){
          const dd=Math.hypot(e.x-b.x,e.y-b.y);
          if(dd<bd){bd=dd;best=e;}
        }
        b.target=best;
      }
      if(b.target){
        const dx=b.target.x-b.x,dy=b.target.y-b.y,d=Math.hypot(dx,dy)||1;
        const tx=dx/d,ty=dy/d;
        // Плавный поворот к цели + нормировка к константной скорости
        b.vx=b.vx*.88+tx*4*.12;
        b.vy=(b.vy||0)*.88+ty*4*.12;
        const m=Math.hypot(b.vx,b.vy)||1;
        b.vx=b.vx/m*4;b.vy=b.vy/m*4;
      }
      // Хвост дыма
      if(b.t%3===0)PTS.push({x:b.x,y:b.y,vx:-1,vy:0,lf:10,ml:14,col:P.ORA,sz:1,gv:0,fade:.65});
    }
    b.x+=b.vx;b.y+=(b.vy||0);b.lf--;
    if(b.lf<=0||b.x>LW+20||b.x<-10||b.y<-10||b.y>LH+10){G.buls.splice(i,1);continue;}
    let hit=false;
    // Попадание по астероидам
    for(let j=G.asts.length-1;j>=0;j--){
      const a=G.asts[j];
      if(Math.abs(b.x-a.x)<a.s+5&&Math.abs(b.y-a.y)<a.s+4){
        a.hp-=b.dmg;a.flash=1;
        // Частицы летят НАЗАД от точки удара (влево), не внутрь астероида
        for(let _pi=0;_pi<4;_pi++){const _ang=Math.PI+(Math.random()-.5)*Math.PI;const _sp=.5+Math.random()*1.5;PTS.push({x:b.x,y:b.y,vx:Math.cos(_ang)*_sp,vy:Math.sin(_ang)*_sp,lf:8+Math.random()*5|0,ml:14,col:[P.A1,P.A3,P.WHT][(Math.random()*3)|0],sz:1+Math.random(),gv:.02,fade:.75});}
        sfxHit();
        if(a.hp<=0){
          spPts(a.x,a.y,10+a.s,[P.ORA,P.YEL,P.WHT,P.TH1],.4,2.5+a.s*.2,18+a.s*2,.04,1.8);
          addShockwave(a.x,a.y,10+a.s*2,P.YEL);
          sfxX(a.s*.2);shake(a.s*.5);flash(a.s*.04,P.YEL);
          hitStopAdd(2);G.combo++;G.comboT=120;
          if(G.combo>1&&G.combo%3===0)
            fText(a.x,a.y-12,'x'+G.combo+'!',G.combo>=9?P.PUR:G.combo>=6?P.YEL:P.CYA);
          if(a.drop)G.rits.push({x:a.x,y:a.y,vx:-.8,vy:(Math.random()-.5)*1.2,lf:250,t:0});
          if(a.s===9&&Math.random()<.25)spwnPowerUp(G,a.x,a.y);
          p.cr+=a.s;fText(a.x,a.y-8,'+'+a.s+'CR',P.YEL);
          // ★ Phase 5.3: первый астероид + банкир (накопить 500 КР)
          if(!G._aFirstAstKilled){G._aFirstAstKilled=true;unlockAchievement(G,'firstAst');}
          if(p.cr>=500)unlockAchievement(G,'banker');
          G.asts.splice(j,1);
        }
        hit=true;break;
      }
    }
    // ★ Попадание пуль игрока по врагам — per-type хитбокс, дроп и эффекты
    if(!hit){
      for(let j=G.enms.length-1;j>=0;j--){
        const e=G.enms[j];
        const _t=e.type||'pirate';
        // Хитбоксы под размер каждого типа
        let hbW,hbH;
        if(_t==='tank'){     hbW=12;hbH=8; }
        else if(_t==='drone'){ hbW=5; hbH=4; }
        else if(_t==='sniper'){ hbW=10;hbH=4; }
        else if(_t==='miniboss'){ hbW=16;hbH=10; }
        else { hbW=8;hbH=5; } // пират
        if(Math.abs(b.x-e.x)<hbW&&Math.abs(b.y-e.y)<hbH){
          e.hp-=b.dmg;e.flash=1;
          spPts(b.x,b.y,4,[P.PIR3,P.YEL,P.WHT],.4,2,10);
          sfxHit();
          if(e.hp<=0){
            // Per-type награды и эффекты смерти
            let crGain,resGain=0,powerupChance=0,partCols,partN,partSp,shakeAmp,shockR,sfxScale;
            if(_t==='tank'){
              crGain=30;resGain=2;
              partCols=[P.PIR3,P.RED,P.YEL,P.WHT];partN=22;partSp=3.5;
              shakeAmp=4;shockR=22;sfxScale=1.2;
            } else if(_t==='drone'){
              crGain=5;resGain=1;
              partCols=[P.L1,P.L1L,P.WHT];partN=8;partSp=2;
              shakeAmp=1;shockR=10;sfxScale=.4;
            } else if(_t==='sniper'){
              crGain=15;resGain=2;powerupChance=.3;
              partCols=[P.PUR,P.RED,P.YEL,P.WHT];partN=14;partSp=2.5;
              shakeAmp=3;shockR=16;sfxScale=.8;
              G._sniperAlive=false;
            } else if(_t==='miniboss'){
              crGain=80;resGain=5;
              partCols=[P.PIR3,P.YEL,P.WHT,P.RED,P.ORA];partN=40;partSp=5;
              shakeAmp=10;shockR=36;sfxScale=1.8;
              flash(.6,P.YEL);hitStopAdd(8);
              // Материал апгрейда добавляется в campaignState
              G.campaignState.materials=(G.campaignState.materials||0)+1;
              fText(e.x,e.y-16,'+МАТЕРИАЛ',P.CYA);
            } else {
              // пират — оригинальные параметры (без изменений)
              crGain=20;powerupChance=.5;
              partCols=[P.PIR3,P.ORA,P.YEL,P.WHT];partN=14;partSp=3;
              shakeAmp=3;shockR=16;sfxScale=.8;
            }
            spPts(e.x,e.y,partN,partCols,.6,partSp,24,.03,1.6);
            addShockwave(e.x,e.y,shockR,P.PIR3);
            sfxX(sfxScale);shake(shakeAmp);flash(.3,P.ORA);
            hitStopAdd(_t==='miniboss'?6:3);
            G.combo+=(_t==='miniboss'?5:2);G.comboT=120;
            p.cr+=crGain;fText(e.x,e.y-8,'+'+crGain+'CR',P.YEL);
            // ★ Phase 5.3: пиратские убийства + комбо 20 + банкир
            if(_t==='pirate'||_t==='miniboss')G._aTotalPirateKills=(G._aTotalPirateKills||0)+1;
            if(G.combo>=20)unlockAchievement(G,'combo20');
            if(p.cr>=500)unlockAchievement(G,'banker');
            // Дроп ресурсов (несколько, разбросаны)
            for(let r=0;r<resGain;r++){
              G.rits.push({x:e.x,y:e.y+(Math.random()-.5)*4,vx:-.5-Math.random()*.5,vy:(Math.random()-.5)*1.2,lf:250,t:0});
            }
            if(powerupChance>0&&Math.random()<powerupChance)spwnPowerUp(G,e.x,e.y);
            G.enms.splice(j,1);
          }
          hit=true;break;
        }
      }
    }
    if(hit){G.buls.splice(i,1);continue;}
  }

  // ★ Обновление врагов — per-type AI и столкновение с игроком
  for(let i=G.enms.length-1;i>=0;i--){
    const e=G.enms[i];
    const _t=e.type||'pirate';
    e.t++;e.flash*=.8;

    // === AI движения и стрельбы ===
    if(_t==='pirate'){
      e.vy=Math.sin(e.t*.05)*.7;
      e.x+=e.vx;e.y+=e.vy;
      e.shootCD--;
      if(e.shootCD<=0&&e.x<LW-10&&e.x>40){
        G.ebuls.push({x:e.x-5,y:e.y,vx:-2.4,vy:(p.y-e.y)*.015});
        e.shootCD=80+Math.random()*60;
        bip(400,.08,.1,'sawtooth',500,200);
      }
    } else if(_t==='tank'){
      e.vy=Math.sin(e.t*.03)*.3;
      e.x+=e.vx;e.y+=e.vy;
      e.shootCD--;
      if(e.shootCD<=0&&e.x<LW-10&&e.x>20){
        G.ebuls.push({x:e.x-9,y:e.y,vx:-1.6,vy:(p.y-e.y)*.012,kind:'bigshell',dmg:8});
        e.shootCD=60+Math.random()*30;
        bip(180,.18,.18,'sawtooth',280,80);
      }
    } else if(_t==='drone'){
      // Лёгкое самонаведение на игрока
      const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1;
      e.vx=-1.2+dx/d*0.3;
      e.vy=dy/d*1.0;
      e.x+=e.vx;e.y+=e.vy;
      // Хвост частиц
      if(e.t%4===0)PTS.push({x:e.x+3,y:e.y,vx:1.5,vy:(Math.random()-.5)*.2,lf:8,ml:12,col:P.L1L,sz:1,gv:0,fade:.6});
    } else if(_t==='sniper'){
      // Дрейф внутрь до x=LW-25, потом стоит
      if(e.x>LW-25)e.x+=e.vx;
      // Цикл зарядки: 0..60 — телеграф, 60 — выстрел, -120..0 — перезарядка
      const ch=e.chargeT;
      if(ch>=0&&ch<60){
        if(ch===0)e.targetY=p.y; // фиксируем цель в начале зарядки
        e.chargeT=ch+1;
      } else if(ch===60){
        // ★ Bugfix #8: пуля вылетает ОТ снайпера и летит к точке прицела (ранее спавнилась
        //   уже на targetY, что выглядело как "висящая горизонтально" пуля). Теперь —
        //   диагональный вектор (e.x, e.y) → (0, targetY), скорость 5.
        const _dx=-200, _dy=(e.targetY!=null?e.targetY:p.y)-e.y;
        const _dist=Math.hypot(_dx,_dy)||1;
        G.ebuls.push({
          x:e.x-9, y:e.y,
          vx:_dx/_dist*5, vy:_dy/_dist*5,
          kind:'pierce', dmg:15,
        });
        bip(900,.12,.15,'square',1200,600);
        e.chargeT=-120;
      } else {
        // Перезарядка
        e.chargeT=ch+1;
      }
    } else if(_t==='miniboss'){
      if(e.phase==='shoot'){
        e.vy=Math.sin(e.t*.04)*.5;
        e.x+=e.vx;e.y+=e.vy;
        e.shootCD--;
        if(e.shootCD<=0&&e.x<LW-15){
          // Веер из 3 крупных снарядов
          for(let k=-1;k<=1;k++){
            G.ebuls.push({x:e.x-10,y:e.y,vx:-2.2,vy:k*0.6+(p.y-e.y)*.008,kind:'bigshell',dmg:6});
          }
          e.shootCD=80;
          bip(160,.2,.2,'sawtooth',240,80);
        }
        // Переход в фазу тарана при HP<50%
        if(e.hp<=e.maxHp*0.5&&!e._raged){
          e._raged=true;e.phase='ram';
          G.notif='МИНИ-БОСС ИДЁТ НА ТАРАН!';G.notifT=80;G.notifCol=P.RED;
          shake(5);sfxBoss();
        }
      } else if(e.phase==='ram'){
        // Преследование игрока с ускорением
        const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1;
        e.vx=-1.5+dx/d*0.5;
        e.vy=dy/d*0.8;
        e.x+=e.vx;e.y+=e.vy;
      }
    }

    // === Уход за экран — несколько типов имеют разную «зону живучести» слева ===
    const offX=(_t==='drone')?-10:(_t==='miniboss')?-25:-15;
    if(e.x<offX){
      if(_t==='sniper')G._sniperAlive=false;
      G.enms.splice(i,1);
      continue;
    }

    // === Столкновение с игроком — per-type урон тарана ===
    let hbW,hbH,ramDmg;
    if(_t==='tank'){      hbW=14;hbH=10;ramDmg=22; }
    else if(_t==='drone'){ hbW=5; hbH=4; ramDmg=5;  }
    else if(_t==='sniper'){ hbW=10;hbH=4; ramDmg=15; }
    else if(_t==='miniboss'){ hbW=18;hbH=12;ramDmg=25; }
    else { hbW=10;hbH=7;ramDmg=15; } // пират

    if(p.inv<=0&&Math.abs(p.x-e.x)<hbW&&Math.abs(p.y-e.y)<hbH){
      if(p.shield>0){
        sfxShield();flash(.3,P.CYA);shake(2);
        p.shield=0;p.inv=25;
        addShockwave(e.x,e.y,12,P.CYA);
      } else {
        p.hp-=ramDmg*(1-_sw.bridge*0.05);p.inv=55;p.squash=6;
        shake(5);flash(.4,P.HP);sfxHit();G.combo=0;hitStopAdd(4);
      }
      spPts(e.x,e.y,12,[P.PIR3,P.ORA,P.WHT],.5,3,20);
      addShockwave(e.x,e.y,14,P.PIR3);
      sfxX(.7);
      // Большинство врагов взрывается при таране (как пират изначально).
      // Мини-босс — выживает и отскакивает (knockback).
      if(_t==='miniboss'){
        e.x+=10;
      } else {
        if(_t==='sniper')G._sniperAlive=false;
        G.enms.splice(i,1);
      }
    }
  }

  // ★ Обновление вражеских снарядов — учитывается b.dmg и тип (bigshell/pierce крупнее/опаснее)
  for(let i=G.ebuls.length-1;i>=0;i--){
    const b=G.ebuls[i];
    b.x+=b.vx;b.y+=b.vy;
    if(b.x<-10||b.x>LW+10||b.y<10||b.y>LH-10){G.ebuls.splice(i,1);continue;}
    // Хитбокс зависит от типа: лазер 10, bigshell 11, остальные 8
    const hbR=b.kind==='laser'?10:b.kind==='bigshell'?11:8;
    if(p.inv<=0&&Math.hypot(p.x-b.x,p.y-b.y)<hbR){
      if(p.shield>0){
        sfxShield();flash(.2,P.CYA);p.shield=0;p.inv=20;
      } else {
        const dmg=(b.dmg||8)*(1-_sw.bridge*0.05);
        p.hp-=dmg;p.inv=40;p.squash=5;
        shake(b.kind==='pierce'?5:3);flash(.3,P.HP);sfxHit();G.combo=0;
        if(b.kind==='pierce'||b.kind==='bigshell')hitStopAdd(3);
      }
      spPts(b.x,b.y,6,[P.PIR3,P.YEL,P.WHT],.4,2,12);
      G.ebuls.splice(i,1);
    }
  }

  // Обновление ресурсов
  for(let i=G.rits.length-1;i>=0;i--){
    const r=G.rits[i];
    r.x+=r.vx;r.y+=r.vy;r.vy*=.98;r.lf--;r.t++;
    const dx=p.x-r.x,dy=p.y-r.y,d=Math.hypot(dx,dy);
    if(d<56){r.vx+=dx/d*.7;r.vy+=dy/d*.7;}
    if(d<10){
      p.res++;sfxPU();
      // ★ Phase 5.3: суммарный собранный RES → достижение "Ресурсный король"
      G._aTotalResCollected=(G._aTotalResCollected||0)+1;
      if(G._aTotalResCollected>=50)unlockAchievement(G,'resKing');
      fText(r.x,r.y,'+RES',P.RES3);
      spPts(r.x,r.y,6,[P.RES,P.RES3,P.WHT],.5,2,14);
      G.rits.splice(i,1);continue;
    }
    if(r.x<-8||r.lf<=0)G.rits.splice(i,1);
  }

  // Обновление пауэрапов — двигаются также как ресурсы (постоянная скорость влево)
  for(let i=G.pups.length-1;i>=0;i--){
    const pu=G.pups[i];
    pu.x+=pu.vx;pu.y+=pu.vy;pu.vy*=.98;pu.t++;pu.lf--;
    const dx=p.x-pu.x,dy=p.y-pu.y,d=Math.hypot(dx,dy);
    if(d<60){pu.vx+=dx/d*.5;pu.vy+=dy/d*.5;}
    if(d<10){
      if(pu.type==='shield'){
        p.shield=600;fText(pu.x,pu.y,'SHIELD!',P.CYA);
      }else if(pu.type==='health'){
        p.hp=Math.min(p.mhp,p.hp+40);fText(pu.x,pu.y,'+40HP',P.HPH);
      }else{
        p.en=Math.min(p.men,p.en+60);fText(pu.x,pu.y,'+60EN',P.EN);
      }
      sfxPU();setTimeout(sfxPU,90);
      flash(.3,pu.type==='shield'?P.CYA:pu.type==='health'?P.HP:P.EN);
      spPts(pu.x,pu.y,14,[pu.type==='shield'?P.CYA:pu.type==='health'?P.HP:P.EN,P.WHT],.5,2.5,20);
      addShockwave(pu.x,pu.y,18,pu.type==='shield'?P.CYA:pu.type==='health'?P.HP:P.EN);
      G.pups.splice(i,1);continue;
    }
    // ★ v16 r9 #9: В финале Тины используем worldBounds, иначе screen-edge
    const wbLeft=(G.finale&&G.finale.worldBounds)?G.finale.worldBounds.minX-20:-10;
    if(pu.x<wbLeft||pu.lf<=0)G.pups.splice(i,1);
  }

  // Прогресс полёта
  const spNow=Math.hypot(p.vx,p.vy);
  const fuelMult=sh.fuel>0?1:0.32;
  const travelMult=(1+(boostOn?1.25:0)+Math.min(1,spNow/2.2)*0.35)*fuelMult;
  G.prog=Math.min(1,G.prog+0.00022*travelMult*_DEV.speedMult);

  // Триггер посадки
  if(G.prog>=1){
    // ★ v16 r12 #4: Для Тины (центр) пропускаем анимацию приближения — сразу старт битвы
    if(G.campaignState.targetPlanet==='center'){
      if(!G.landingTriggered){
        G.landingTriggered=true;
        G.asts.length=0;G.enms.length=0;
        G.ebuls.length=0;G.buls.length=0;
        G.rits.length=0;G.pups.length=0;
        startTrans(()=>landOnTargetPlanet(G));
      }
      return;
    }
    G.appr=true;G.landT=0;
    G.apprSX=p.x;G.apprSY=p.y;
    G.asts.length=0;G.enms.length=0;
    G.ebuls.length=0;G.buls.length=0;
    G.rits.length=0;G.pups.length=0;
    // Запускаем брифинг от пришельца — продолжит работать и после посадки
    G.briefing={t:0,planet:G.campaignState.targetPlanet};
    sfxUI2();
  }

  // Смерть игрока
  if(_DEV.immortal&&p.hp<=0){p.hp=p.mhp;p.en=p.men;p.shield=0;} // DEV: бессмертие
  if(p.hp<=0){
    spPts(p.x,p.y,34,[P.SH1,P.TH1,P.WHT,P.L1],1,5.5,50,.06,2);
    addShockwave(p.x,p.y,40,P.WHT,25);
    // ★ Усиленный финальный удар при гибели корабля игрока
    sfxX(3);flash(.95,P.WHT);shake(16);hitStopAdd(6);
    G.state='gameover';G.goT=0;resetBtns();
    return;
  }

  updPts();updSHK();updFTX();scrollStars();
}

// Брифинг от пришельца на каждую планету. Печатается посимвольно во время приближения.
function getAlienBriefing(targetPlanet){
  switch(targetPlanet){
    case 'drosh':
      return 'ПИЛОТ, ЭТО ДРОШ - ЛЕДЯНОЙ МИР. ЧТОБЫ ВЫЖИТЬ - ДЕРЖИСЬ У КУПОЛОВ ИЛИ ЗАЖЖЁННЫХ МАЯКОВ. НАЙДИ КОММЕНДАНТА КЛИРРА: ОН ЗНАЕТ КАК ОЖИВИТЬ ПЛАНЕТУ.';
    case 'bubblika':
      return 'БУББЛИКА - ГАЗОВЫЙ ГИГАНТ. ОБЛАКА ПЛОТНЫЕ - МОЖНО ХОДИТЬ. ОПАСАЙСЯ ГЕЙЗЕРОВ ВНИЗУ И ВЕТРА - СНЕСУТ. ИНЖЕНЕР БЛАБ ПОМОЖЕТ СО ЩИТОМ ПРОТИВ ТИНЫ.';
    case 'krasnozem':
      return 'КРАСНОЗЁМ - МЁРТВАЯ ПУСТЫНЯ. ЯДОВИТАЯ ПЫЛЬ И ВНЕЗАПНЫЕ ШТОРМЫ. УКРОЙСЯ ВО ВРЕМЯ БУРИ. КАПИТАН МРАУ КОМАНДУЕТ ОПОЛЧЕНИЕМ - ОНИ ВРАЖДУЮТ С СИНДИКАТОМ.';
    case 'center':
      return 'ЭТО ОНА. ТИНА. ПИЛОТ... БУДЬ ОСТОРОЖЕН. ОНА УБИЛА МНОГИХ ДО ТЕБЯ. ИСПОЛЬЗУЙ ВСЕ УЛУЧШЕНИЯ. ЦЕЛЬ - СВОБОДА ЗВЕЗДЫ. УДАЧИ.';
    // ★ v16: Подсказки на фазах боя с Тиной
    case 'tina_phase1':
      return 'УНИЧТОЖЬ 3 ЭНЕРГОЯДРА НА ОРБИТЕ! ОНИ ПИТАЮТ ЕЁ ЩИТ!';
    case 'tina_phase2':
      return 'ЩИТ ПАЛ! БЕЙ ПО КОРПУСУ! ВЫБЕЙ ТУРЕЛИ — ОНИ ОПАСНЫ!';
    case 'tina_phase3':
      return 'ОТРАЖАЮЩИЙ КОНТУР! СТРЕЛЯЙ В УЯЗВИМЫЕ ТОЧКИ — ИНАЧЕ ПУЛИ ВЕРНУТСЯ!';
    case 'tina_phase4':
      return 'РЕЖИМ ЯРОСТИ! ЩЕЛИ БЫСТРЕЕ. ДРОНЫ АГРЕССИВНЕЕ. ДЕРЖИСЬ!';
    default:
      return null;
  }
}

function drwSpace(G){rc(0,0,LW,LH,P.BG);applyShake();drwNebula();drwStars();
  if(G.appr){
    const t=G.landT,rv=Math.min(100,t*.7);
    cx.globalAlpha=Math.min(1,t/50);
    const pcx=(LW-42+t*0.15)|0,pcy=(LH/2)|0;
    const pInfo=PLANETS[G.campaignState.targetPlanet]||PLANETS.drosh;

    if(G.campaignState.targetPlanet==='center'){
      // === ПРИБЛИЖЕНИЕ К ТИНЕ — иконическая сфера Дайсона ===
      // Внешнее свечение (тёмно-красная аура)
      cx.globalAlpha=0.18;disc(pcx,pcy,(rv+24)|0,'#660000');
      cx.globalAlpha=0.30;disc(pcx,pcy,(rv+8)|0,'#aa1100');
      cx.globalAlpha=1;
      // Тёмная сфера
      disc(pcx,pcy,rv|0,'#1a0800');
      disc(pcx,pcy,(rv-3)|0,'#220c00');
      // Гексагональные панели по поверхности
      const hexCount=Math.min(28,Math.max(8,(rv/3)|0));
      for(let i=0;i<hexCount;i++){
        const golden=Math.PI*(3-Math.sqrt(5));
        const k=i/hexCount;
        const phi=Math.acos(1-2*k);
        const theta=golden*i+t*.012;
        const sx=pcx+Math.sin(phi)*Math.cos(theta)*(rv-3);
        const sy=pcy+Math.sin(phi)*Math.sin(theta)*(rv-3);
        const depth=Math.cos(phi);
        if(depth<-0.05)continue;
        const brightness=Math.max(0.3,depth);
        const litUp=(i+Math.floor(t*0.04))%4===0;
        let panelCol;
        if(litUp){
          panelCol=t%30<8?'#ff8833':'#ff4422';
        }else{
          const cv=Math.floor(50+brightness*100);
          panelCol='rgb('+cv+','+(cv*0.3|0)+','+(cv*0.1|0)+')';
        }
        cx.fillStyle=panelCol;
        const pSize=Math.max(1.5,rv*0.07);
        cx.beginPath();
        for(let h=0;h<6;h++){
          const ha=h/6*Math.PI*2;
          const hx=sx+Math.cos(ha)*pSize*brightness;
          const hy=sy+Math.sin(ha)*pSize*brightness;
          if(h===0)cx.moveTo(hx,hy);else cx.lineTo(hx,hy);
        }
        cx.closePath();cx.fill();
        cx.strokeStyle='#0a0400';cx.lineWidth=0.5;cx.stroke();
      }
      // Большие "пушечные" порты на экваторе
      const portCount=Math.max(4,Math.min(8,(rv/12)|0));
      for(let i=0;i<portCount;i++){
        const a=i/portCount*Math.PI*2+t*.008;
        const gx=pcx+Math.cos(a)*rv;
        const gy=pcy+Math.sin(a)*rv;
        const pSz=Math.max(2,(rv*0.06)|0);
        rc((gx-pSz)|0,(gy-pSz)|0,pSz*2,pSz*2,'#330800');
        rc((gx-pSz+1)|0,(gy-pSz+1)|0,pSz*2-2,pSz*2-2,'#aa3322');
        if((t+i*7)%50<10){
          cx.globalAlpha=.7;
          rc((gx-1)|0,(gy-1)|0,2,2,'#ff6633');
          cx.globalAlpha=1;
        }
      }
      // Просвет в центре — звезда
      cx.globalAlpha=0.4+0.2*Math.sin(t*.10);
      const coreSz=Math.max(2,(rv*0.18)|0);
      disc(pcx,pcy,coreSz,'#aa3322');
      disc(pcx,pcy,(coreSz*0.6)|0,'#ff8844');
      cx.globalAlpha=1;
      // Энергетические лучи
      for(let i=0;i<8;i++){
        const a=i/8*Math.PI*2+t*.006;
        cx.globalAlpha=.30+.18*Math.sin(t*.05+i);
        cx.strokeStyle='#ff8844';cx.lineWidth=1;
        cx.beginPath();
        cx.moveTo(pcx+Math.cos(a)*rv,pcy+Math.sin(a)*rv);
        cx.lineTo(pcx+Math.cos(a)*(rv+12),pcy+Math.sin(a)*(rv+12));
        cx.stroke();
      }
      cx.globalAlpha=1;
    }else{
      // === ПРИБЛИЖЕНИЕ К ОБЫЧНОЙ ПЛАНЕТЕ ===
      disc(pcx,pcy,(rv+18)|0,pInfo.approachAtmo);
      disc(pcx,pcy,rv|0,pInfo.approachCol);
      disc(pcx-(rv*.3)|0,(pcy-rv*.2)|0,(rv*.3)|0,pInfo.approachCap);
      disc(pcx+(rv*.1)|0,(pcy+rv*.4)|0,(rv*.2)|0,pInfo.approachCap);
      disc(pcx,(pcy-rv*.72)|0,(rv*.26)|0,pInfo.approachCap);
      cx.globalAlpha=.3;ring(pcx,pcy,(rv+4)|0,pInfo.approachCap,2);
      cx.globalAlpha=1;
    }
    // === ВЕРХ: НАЗВАНИЕ ПЛАНЕТЫ ===
    if(t>38){
      cx.globalAlpha=Math.min(1,(t-38)/22);
      txcs(pInfo.arrivedText,24,G.campaignState.targetPlanet==='center'?'#ff4422':pInfo.approachCap,P.BLK,2);
      cx.globalAlpha=1;
    }

    // === АЛЬФА-СИГНАЛ ОТ ПРИШЕЛЬЦА (брифинг) — отрисовывается через drwAlienBriefing ===
    // Вынесен в отдельную функцию, чтобы продолжать показ после посадки на планете.
  }
  for(const pu of G.pups)drwPowerUp(pu);
  for(const r of G.rits)drwRes(r);
  for(const a of G.asts)drwAst(a);
  for(const b of G.buls)drwBul(b);
  for(const e of G.enms)drwEnemy(e);
  for(const b of G.ebuls)drwEnemyBul(b);
  drwPts();drwSHK();
  let shipA=1;
  if(G.appr){shipA=Math.max(0,Math.min(1,1-Math.max(0,(G.landT-220))/55));shipA=shipA*shipA;}
  cx.globalAlpha=shipA;
  // ★ v22 Squash: при ударе корабль сжимается на 1–6 кадров (scaleX 0.72, scaleY 1.28)
  const sq=G.pl.squash;
  if(sq>0){
    const t=sq/6; // 1.0→0
    cx.save();
    cx.translate(G.pl.x|0,G.pl.y|0);
    cx.scale(1-0.28*t,1+0.28*t);
    cx.translate(-(G.pl.x|0),-(G.pl.y|0));
    drwShip(G.pl.x,G.pl.y,G.pl.inv,G.pl.thrT,G.pl.boost>0,G.pl.hp/G.pl.mhp);
    cx.restore();
  }else{
    drwShip(G.pl.x,G.pl.y,G.pl.inv,G.pl.thrT,G.pl.boost>0,G.pl.hp/G.pl.mhp);
  }
  if(G.pl.shield>0)drwShield(G.pl.x,G.pl.y,G.sT);
  // ★ Phase 4.4: tint корабля цветом планеты на подлёте — корпус «греется» отражённым светом.
  //   Нарастает по мере приближения, пик на t=140, затухает с фейдом корабля.
  if(G.appr){
    const pInfo=PLANETS[G.campaignState.targetPlanet]||PLANETS.drosh;
    const tintCol=pInfo.approachCol||P.CYA;
    // alpha поднимается с 0 до ~0.3, потом плавно затухает вместе с shipA
    const ramp=Math.min(1,G.landT/140);
    const tintA=0.30*ramp*shipA;
    if(tintA>0.01){
      cx.globalAlpha=tintA;
      cx.fillStyle=tintCol;
      // Перекрашиваем прямоугольную зону вокруг корабля (~26x18 — захватывает корпус и крылья)
      cx.fillRect((G.pl.x-13)|0,(G.pl.y-9)|0,26,18);
    }
  }
  cx.globalAlpha=1;
  drwFTX();drawFlash();clearShake();drwHUD(G);
  drwAlienBriefing(G);
  drwPauseIcon();drwJoystick();drwActionBtns();
  if(G.paused)drwPauseOverlay(G);
  drwTutorial(G);drawTrans();
}
function dlgCurrentLines(G){const d=G.dlg;if(!d)return[];const node=d.mode==='graph'?d.graph.nodes[d.node]:null;return d.mode==='graph'?(node&&node.text?node.text:[]):(d.lines||[]);}
function confirmChoice(G,node){const d=G.dlg;const choice=node.choices[d.choiceIdx];sfxUI2();if(choice.effect)choice.effect(G);if(choice.goto&&d.graph.nodes[choice.goto]){d.node=choice.goto;d.choiceIdx=0;d._ranEffect=false;G.dlgChar=0;}else closeDlg(G);}
function dlgFull(G){const lines=dlgCurrentLines(G);const total=lines.reduce((sum,l)=>sum+l.length,0);return G.dlgChar>=total;}
function closeDlg(G){const prevAllowJoy=G.dlg&&typeof G.dlg.prevAllowJoy==='boolean'?G.dlg.prevAllowJoy:true;G.dlg=null;G.dlgChar=0;setJoyEnabled(prevAllowJoy);if(USE_TOUCH_UI)TOUCH.btns=TOUCH.btns.filter(b=>!b.id.startsWith('ch'));}
function updDialog(G){
  const d=G.dlg;if(!d)return;
  const lines=dlgCurrentLines(G);
  const total=lines.reduce((sum,l)=>sum+l.length,0);
  const full=G.dlgChar>=total;
  if(d.mode==='graph'){
    const graph=d.graph;const node=graph.nodes[d.node];
    if(full){
      // Мобильный выбор ответа: используем хитбоксы из drwDialog (точные координаты под адаптивный диалог)
      if(node.choices&&USE_TOUCH_UI&&mC&&d._choiceBoxes){
        for(let i=0;i<d._choiceBoxes.length;i++){
          const cb=d._choiceBoxes[i];
          if(mX>=8&&mX<=LW-8&&mY>=cb.y0&&mY<=cb.y1){d.choiceIdx=i;confirmChoice(G,node);mC=false;return;}
        }
      }
      if(node.choices){
        if(KD.ArrowUp||KD.KeyW){d.choiceIdx=(d.choiceIdx+node.choices.length-1)%node.choices.length;sfxUI();}
        if(KD.ArrowDown||KD.KeyS){d.choiceIdx=(d.choiceIdx+1)%node.choices.length;sfxUI();}
        if(KD.Enter||KD.KeyE||btnJust('int')||(!d.noSpaceConfirm&&KD.Space)){confirmChoice(G,node);return;}
        for(let i=0;i<node.choices.length;i++)if(btnJust('ch'+i)){d.choiceIdx=i;confirmChoice(G,node);return;}
      }else{
        const advance=KD.Enter||KD.KeyE||btnJust('int')||mC||(!d.noSpaceConfirm&&KD.Space);
        if(advance){mC=false;if(node.effect)node.effect(G);if(node.end)closeDlg(G);else if(node.goto&&graph.nodes[node.goto]){d.node=node.goto;d.choiceIdx=0;G.dlgChar=0;sfxUI2();}else closeDlg(G);}
      }
    }else{
      const skip=KD.Enter||KD.KeyE||btnJust('int')||mC||(!d.noSpaceConfirm&&KD.Space);
      if(skip){mC=false;G.dlgChar=total+5;sfxUI();}
      else G.dlgChar+=2;
    }
    return;
  }
  // Обычные реплики NPC.
  if(full){
    const advance=KD.Enter||KD.KeyE||btnJust('int')||mC||(!d.noSpaceConfirm&&KD.Space);
    if(advance){mC=false;if(d.cb)d.cb(G);closeDlg(G);}
  }else{
    const skip=KD.Enter||KD.KeyE||btnJust('int')||mC||(!d.noSpaceConfirm&&KD.Space);
    if(skip){mC=false;G.dlgChar=total+5;sfxUI();}
    else G.dlgChar+=2;
  }
}
// Разбивает строку на несколько по максимальной ширине (в пикселях)
function wrapText(text, maxWidth){
  const words=text.split(' ');
  const lines=[];let cur='';
  for(const w of words){
    const candidate=cur?cur+' '+w:w;
    if(gw(candidate)<=maxWidth){cur=candidate;}
    else{
      if(cur)lines.push(cur);
      // Если одно слово длиннее ширины — обрезаем по символам
      if(gw(w)>maxWidth){
        let chunk='';
        for(const ch of w){
          if(gw(chunk+ch)<=maxWidth)chunk+=ch;
          else{if(chunk)lines.push(chunk);chunk=ch;}
        }
        cur=chunk;
      }else cur=w;
    }
  }
  if(cur)lines.push(cur);
  return lines;
}

function drwDialog(G){
  const d=G.dlg;if(!d)return;
  const rawLines=dlgCurrentLines(G);if(!rawLines.length)return;
  const innerPad=12;
  const innerW=LW-12-innerPad*2;
  // Переносим каждую строку диалога с учётом ширины окна
  const lines=[];
  for(const l of rawLines){
    const wrapped=wrapText(l, innerW);
    for(const w of wrapped)lines.push(w);
  }
  // Рассчитаем выборы и их высоту
  let choices=null,choiceLines=null;
  if(d.mode==='graph'){
    const node=d.graph.nodes[d.node];
    if(node&&node.choices)choices=node.choices;
  }
  if(choices){
    choiceLines=[];
    for(const ch of choices){
      const wrapped=wrapText(ch.label, innerW-10);
      choiceLines.push(wrapped);
    }
  }
  // Высота окна: padding + строки текста + (если есть варианты) разделитель + строки выбора + footer
  const lineH=9;
  const choiceLineH=8;
  const textH=lines.length*lineH;
  const totalChoiceLines=choiceLines?choiceLines.reduce((s,c)=>s+c.length,0):0;
  const choiceBlockH=choiceLines?(totalChoiceLines*choiceLineH+(choiceLines.length-1)*2+6):0;
  const footerH=10;
  let bh=4+textH+(choices?(4+choiceBlockH):0)+footerH;
  bh=Math.max(48,Math.min(LH-22,bh));
  const by=LH-bh-4;
  // Тело окна
  bx2(6,by,LW-12,bh,P.DLG,P.DLB,1);
  cx.strokeStyle='#0066bb';cx.lineWidth=.5;cx.strokeRect(7,by+1,LW-14,bh-2);
  rc(6,by,3,1,P.CYA);rc(6,by,1,3,P.CYA);rc(LW-9,by,3,1,P.CYA);rc(LW-7,by,1,3,P.CYA);
  rc(6,by+bh-1,3,1,P.CYA);rc(6,by+bh-3,1,3,P.CYA);rc(LW-9,by+bh-1,3,1,P.CYA);rc(LW-7,by+bh-3,1,3,P.CYA);
  // Текст с typewriter эффектом по сырым символам (без учёта переносов)
  const totalShow=Math.floor(G.dlgChar);
  let drawnSoFar=0;
  // Чтобы typewriter работал последовательно, считаем заранее символы каждой строки
  let charBudget=totalShow;
  for(let i=0;i<lines.length;i++){
    const l=lines[i];
    const showLen=Math.max(0,Math.min(l.length,charBudget));
    const toShow=l.substring(0,showLen);
    // Цвет: первая исходная строка (имя говорящего) выделяется. Делаю эвристику — если сырая строка перенеслась на несколько, первая получает имя.
    const col=(i===0)?P.UIT:P.WHT;
    txt(toShow,innerPad,by+4+i*lineH,col,1);
    charBudget-=l.length;
    if(charBudget<=0)break;
  }
  // Считаем суммарное количество символов для проверки "печать завершена"
  const totalChars=lines.reduce((s,l)=>s+l.length,0);
  const doneTyping=G.dlgChar>=totalChars;

  if(choices&&doneTyping){
    let yC=by+4+textH+4;
    rc(innerPad-2,yC-2,LW-innerPad*2+4,choiceBlockH+1,'#001224');
    // Сохраняем хитбоксы для тача
    d._choiceBoxes=[];
    for(let i=0;i<choices.length;i++){
      const isSel=i===d.choiceIdx;
      const blink=isSel&&Math.floor(Date.now()/240)%2;
      const col=isSel?P.YEL:P.UIT2;
      const wrapped=choiceLines[i];
      const startY=yC;
      for(let lj=0;lj<wrapped.length;lj++){
        if(lj===0&&isSel)txt('>',innerPad,yC,blink?P.WHT:col,1);
        txt(wrapped[lj],innerPad+8,yC,col,1);
        yC+=choiceLineH;
      }
      const endY=yC;
      d._choiceBoxes.push({y0:startY-2,y1:endY+1});
      yC+=2; // gap between choices
    }
    if(USE_TOUCH_UI){
      for(let i=0;i<choices.length;i++){
        const id='ch'+i;let b=getBtn(id);
        const box=d._choiceBoxes[i];
        const cy=(box.y0+box.y1)/2;
        if(!b){b=addBtn(id,LW/2,cy,60,'',P.CYA);b.hidden=true;}
        else{b.y=cy;}
      }
    }
    if(Math.floor(Date.now()/280)%2){
      const hint=USE_TOUCH_UI?'ТАП ВАРИАНТ':'UP/DN + ENTER';
      txs(hint,LW-gw(hint)-innerPad,by+bh-9,P.YEL,P.BLK,1);
    }
    return;
  }
  if(Math.floor(Date.now()/280)%2){
    const hint=doneTyping?'[OK]':'...';
    txs(hint,LW-gw(hint)-innerPad,by+bh-9,doneTyping?P.YEL:P.UIT3,P.BLK,1);
  }
}

