// ============================================================
// 18-main.js
// Menu, credits, game-over screens, main loop. Calls initTitle(G); requestAnimationFrame(loop) at end
// depends on: everything above
// (originally sintara_v25.html lines 10046-10288)
// ============================================================

// ======= МЕНЮ =======
function initMenu(G){
  TAP_FIRE=false;G.state='menu';G.menuT=0;G.menuSt=[];
  for(let i=0;i<180;i++)G.menuSt.push({x:Math.random()*LW,y:Math.random()*LH,sp:.05+Math.random()*.18,b:Math.random(),sz:Math.random()<.08?2:1});
  initStars();resetBtns();PTS.length=0;SHK.length=0;
}

function updMenu(G){
  G.menuT++;
  for(const s of G.menuSt){s.x-=s.sp;if(s.x<0){s.x=LW;s.y=Math.random()*LH;}}
  // Звёздные искры — частицы вылетают наружу из звезды
  if(G.menuT%3===0){
    const a=Math.random()*Math.PI*2;
    const r=18+Math.random()*4;
    PTS.push({
      x:64+Math.cos(a)*r,
      y:LH/2+Math.sin(a)*r,
      vx:Math.cos(a)*(.4+Math.random()*.6),
      vy:Math.sin(a)*(.4+Math.random()*.6),
      lf:40+Math.random()*30|0,ml:60,
      col:Math.random()<.4?'#ffffff':(Math.random()<.5?'#ffee88':'#ffaa44'),
      sz:1,gv:0,fade:.55
    });
  }
  updPts();
  if((KD.Enter||KD.Space||mC)&&G.menuT>30){sfxUI2();initAC();mC=false;startTrans(()=>{const fresh=newGame();for(const k in G){if(G.hasOwnProperty(k))delete G[k];}Object.assign(G,fresh);window.G=G;initSpace(G);});}
}

function drwMenu(G){
  rc(0,0,LW,LH,P.BG);
  // Туманности на фоне для глубины
  const t=G.menuT;
  for(let i=0;i<5;i++){
    const nx=((i*73-t*.1)%LW+LW)%LW;
    const ny=30+(i*31)%(LH-60);
    cx.globalAlpha=.10;
    disc(nx|0,ny|0,18+i*3,i%2?'#3a1a4a':'#1a2a5a');
  }
  cx.globalAlpha=1;
  // Звёзды на фоне (мерцающие)
  for(const s of G.menuSt){const b=s.b+Math.sin(G.menuT*.04+s.x*.1)*.3;cx.globalAlpha=Math.max(.04,Math.min(1,b));cx.fillStyle=b>.7?P.S1:b>.4?P.S2:P.S3;cx.fillRect(s.x|0,s.y|0,s.sz,s.sz);}
  cx.globalAlpha=1;

  // === КРАСИВАЯ ЗВЕЗДА (вместо чёрной дыры) ===
  const sx=64,sy=LH/2;
  // Внешнее свечение (несколько слоёв для глубины)
  const breath=1+Math.sin(t*.04)*.06;
  cx.globalAlpha=.10;disc(sx,sy,(38*breath)|0,'#ffaa44');
  cx.globalAlpha=.16;disc(sx,sy,(28*breath)|0,'#ffcc66');
  cx.globalAlpha=.28;disc(sx,sy,(20*breath)|0,'#ffdd88');
  cx.globalAlpha=1;
  // Корона звезды — лучи света
  cx.globalAlpha=.45;
  for(let i=0;i<8;i++){
    const a=i/8*Math.PI*2+t*.005;
    const r1=14,r2=22+Math.sin(t*.05+i)*4;
    const x1=sx+Math.cos(a)*r1,y1=sy+Math.sin(a)*r1;
    const x2=sx+Math.cos(a)*r2,y2=sy+Math.sin(a)*r2;
    line(x1,y1,x2,y2,'#ffee88',1);
  }
  cx.globalAlpha=1;
  drwPts();
  // Тело звезды — горячее ядро
  disc(sx,sy,14,'#ffaa22');
  disc(sx,sy,11,'#ffcc44');
  disc(sx,sy,8,'#ffee88');
  disc(sx,sy,4,'#ffffff');
  // Поверхностные пятна (плазменные образования)
  const sp1A=t*.03,sp2A=t*.04+2;
  cx.globalAlpha=.5;
  cx.fillRect((sx+Math.cos(sp1A)*7)|0,(sy+Math.sin(sp1A)*5)|0,2,2);
  cx.fillRect((sx+Math.cos(sp2A)*6)|0,(sy+Math.sin(sp2A)*7)|0,1,1);
  cx.globalAlpha=1;
  // Мерцание-блик в центре
  if(t%30<5){cx.globalAlpha=.7;cx.fillStyle='#ffffff';cx.fillRect(sx-1,sy-3,2,6);cx.fillRect(sx-3,sy-1,6,2);cx.globalAlpha=1;}
  // Подпись звезды
  txs('SINTARA*',sx-16,sy+22,'#ffcc66',P.BLK,1);

  // Корабль летит
  const shipX=-20+(t*.6%360);if(shipX>-15&&shipX<LW)drwShip(shipX,LH/2-46+Math.sin(t*.05)*3,0,t,false,1);
  // Планета
  disc(LW-26,LH-14,50,P.PLD);disc(LW-26,LH-14,42,P.PL1);disc(LW-42,LH-28,14,P.PL2);disc(LW-28,LH-40,7,P.IC3);cx.globalAlpha=.2;ring(LW-26,LH-14,46,P.IC3,2);cx.globalAlpha=1;
  // Заголовок (двойной слой - светящийся)
  txc('SINTARA',23,P.TINA2,3);txc('SINTARA',21,P.CYA,3);
  if(t%60<10){cx.globalAlpha=.5;txc('SINTARA',21,P.WHT,3);cx.globalAlpha=1;}
  if(t>20){cx.globalAlpha=Math.min(1,(t-20)/22);txc('ОСКОЛКИ ЗВЕЗДЫ',42,P.UIT2,1);cx.globalAlpha=1;}
  // Лор — теперь упоминаем звезду как символ надежды
  if(t>60){cx.globalAlpha=Math.min(1,(t-60)/25);txcs('СИНДИКАТ ЗАКОВАЛ ЗВЕЗДУ В ТИНУ.',LH/2-4,'#ffcc66','#552200',1);txcs('СФЕРА ДАЙСОНА ВЫКАЧИВАЕТ СВЕТ.',LH/2+6,'#ffaa44','#552200',1);cx.globalAlpha=1;}
  if(t>110){cx.globalAlpha=Math.min(1,(t-110)/25);txcs('ТЫ - ПОСЛЕДНИЙ ШАНС СИСТЕМЫ.',LH/2+18,'#ffdd88','#332200',1);cx.globalAlpha=1;}
  if(t>145){const pulse=.7+.3*Math.sin(t*.18);cx.globalAlpha=pulse;const msg=USE_TOUCH_UI?'ТАП - НАЧАТЬ':'ENTER - НАЧАТЬ';txcs(msg,LH-22,P.YEL,P.BLK,1);cx.globalAlpha=1;}
  txt(USE_TOUCH_UI?'TOUCH':'WASD+SPACE',2,LH-7,P.S3,1);
  txt('V0.7 CHAPTER1',LW-72,LH-7,P.S3,1);
  drawTrans();
}

// ======= GAME OVER =======
function updGameOver(G){
  G.goT++;
  updPts();updSHK();
  if((KD.Enter||KD.Space||mC)&&G.goT>120){
    G.goT=0;mC=false;KD.Enter=false;KD.Space=false;sfxUI2();
    startTrans(()=>{
      const cp=G.checkpoint;
      if(cp){
        // Восстанавливаем состояние кампании из чекпоинта
        G.campaignState=deepCopy(cp.campaignState);
        // Восстанавливаем игрока: все апгрейды сохраняются, HP/EN — полные
        const plR=deepCopy(cp.pl);
        plR.hp=plR.mhp;plR.en=plR.men;plR.shield=0;plR.inv=0;plR.boost=0;plR.sCD=0;
        Object.assign(G.pl,plR);
        // Восстанавливаем топливо корабля
        if(cp.ship&&G.ship)Object.assign(G.ship,cp.ship);
        // Чистим боевые объекты
        G.buls=[];G.ebuls=[];G.enms=[];G.pups=[];G.rits=[];G.asts=[];
        G.combo=0;G.comboT=0;G.notif=null;G.notifT=0;G.dlg=null;G.dlgChar=0;
        resetBtns();
        if(cp.type==='space'){
          // Полёт начинается заново от исходной планеты к той же цели
          initSpace(G);
        }else if(cp.type==='tina'){
          // Бой с Тиной начинается заново
          initFinaleTina(G);
        }else{
          const fresh=newGame();
          for(const k in G){if(G.hasOwnProperty(k))delete G[k];}
          Object.assign(G,fresh);window.G=G;resetBtns();initTitle(G);
        }
      }else{
        // Нет чекпоинта — оригинальное поведение (возврат в меню)
        const fresh=newGame();
        for(const k in G){if(G.hasOwnProperty(k))delete G[k];}
        Object.assign(G,fresh);window.G=G;resetBtns();initTitle(G);
      }
    });
  }
}

function drwGameOver(G){
  rc(0,0,LW,LH,'#070003');drwPts();drwSHK();
  // Красные точки помех (визуальный шум — может тикать с рендером, это чисто косметика)
  if(G.goT%3===0){for(let i=0;i<20;i++){cx.globalAlpha=.15;cx.fillStyle=P.RED;cx.fillRect(Math.random()*LW|0,Math.random()*LH|0,1,1);}cx.globalAlpha=1;}
  if(G.goT>20){const bh=Math.min(22,G.goT-20);rc(0,0,LW,bh,'#100006');rc(0,LH-bh,LW,bh,'#100006');}
  if(G.goT>50){cx.globalAlpha=Math.min(1,(G.goT-50)/20);txcs('КОРАБЛЬ УНИЧТОЖЕН',LH/2-18,P.RED,P.BLK,2);txcs('СИНТАРА ПАЛА ВО ТЬМУ',LH/2+8,P.HP,P.BLK,1);cx.globalAlpha=1;}
  if(G.goT>90){cx.globalAlpha=Math.min(1,(G.goT-90)/20);txcs('ЗВЕЗДА ОСТАЁТСЯ В ПЛЕНУ ТИНЫ.',LH/2+22,P.TINA2,P.BLK,1);cx.globalAlpha=1;}
  if(G.goT>120&&Math.floor(G.goT/22)%2){
    if(G.checkpoint){
      const loc=G.checkpoint.type==='tina'?'БОЙ С ТИНОЙ':'ПЕРЕЛЁТ - ПОВТОР';
      const btn=USE_TOUCH_UI?'ТАП':'ENTER';
      txcs(btn+' - ПОВТОР',LH/2+36,P.YEL,P.BLK,1);
      txcs(G.checkpoint.type==='tina'?'[БОЙ С ТИНОЙ]':'[С '+(PLANETS[G.checkpoint.departPlanet]||PLANETS.drosh).name+']',LH/2+44,P.UIT3,P.BLK,1);
    }else{
      const msg=USE_TOUCH_UI?'ТАП - ЕЩЁ РАЗ':'ENTER - ЕЩЁ РАЗ';
      txcs(msg,LH/2+36,P.YEL,P.BLK,1);
    }
  }
  drawTrans();
}

// ======= ГЛАВНЫЙ ЦИКЛ =======
initTitle(G);

// === DELTA-TIME LOOP ===
// Игровая логика всегда тикает на 60 Гц, независимо от частоты обновления экрана.
// Render выполняется один раз за animation-frame.
// На медленных устройствах будет несколько update-тиков на один рендер; на быстрых
// (144/240 Гц) — обновления реже, но рендер чаще.
const _TARGET_FRAME_MS=1000/60;
let _lastFrameTs=0,_frameAccum=0;

function _runUpdate(){
  updateMusicForGame(G);
  // ★ v22 — QRW: пока попап активен — сцена обновляется, но ввод блокируем
  if(G.qrw&&G.qrw.active){
    G.qrw.t++;
    const q=G.qrw,allDone=q.t>20+q.rewards.length*16+14;
    if(allDone&&(KD.Space||KD.Enter||KD.KeyZ||KD.KeyX||KD.Escape||btnJust('fire'))){
      G.qrw.active=false;G.qrw=null;
    } else if(q.t>q.duration){G.qrw.active=false;G.qrw=null;}
    flushIn(); // сбрасываем KD чтобы сцена не среагировала
    return;
  }
  switch(G.state){
    case'title':updTitle(G);break;
    case'intro':updIntro(G);break;
    case'menu':updMenu(G);break;
    case'space':updSpace(G);break;
    case'planet_drosh':updPlanetDrosh(G);break;
    case'planet_bubblika':updPlanetBubblika(G);break;
    case'planet_krasnozem':updPlanetKrasnozem(G);break;
    case'ship_view':updShip(G);break;
    case'finale_tina':updFinaleTina(G);break;
    case'credits':updCredits(G);break;
    case'gameover':updGameOver(G);break;
  }
}

function _runRender(){
  switch(G.state){
    case'title':drwTitle(G);break;
    case'intro':drwIntro(G);break;
    case'menu':drwMenu(G);break;
    case'space':drwSpace(G);break;
    case'planet_drosh':drwPlanetDrosh(G);break;
    case'planet_bubblika':drwPlanetBubblika(G);break;
    case'planet_krasnozem':drwPlanetKrasnozem(G);break;
    case'ship_view':drwShipView(G);break;
    case'finale_tina':drwFinaleTina(G);break;
    case'credits':drwCredits(G);break;
    case'gameover':drwGameOver(G);break;
  }
  // ★ v22 — QRW поверх любой сцены
  if(G.qrw&&G.qrw.active)drwQuestReward(G);
}

function loop(ts){
  requestAnimationFrame(loop);
  if(_lastFrameTs===0){_lastFrameTs=ts||performance.now();}
  const now=ts||performance.now();
  let dt=now-_lastFrameTs;
  _lastFrameTs=now;
  // После переключения вкладки или паузы dt может быть огромным —
  // ограничиваем, чтобы не было «спирали смерти»
  if(dt>250)dt=_TARGET_FRAME_MS;
  _frameAccum+=dt;
  let steps=0;
  // До 4 догоняющих апдейтов за один кадр (для медленных устройств)
  while(_frameAccum>=_TARGET_FRAME_MS&&steps<4){
    if(hitStop>0){
      hitStop--;
    }else{
      _runUpdate();
    }
    flushIn();
    _frameAccum-=_TARGET_FRAME_MS;
    steps++;
  }
  // Если за 4 шага мы так и не догнали — сбрасываем накопитель
  if(steps>=4&&_frameAccum>_TARGET_FRAME_MS*4)_frameAccum=0;
  // Render
  cx.imageSmoothingEnabled=false;
  _runRender();
}
requestAnimationFrame(loop);
