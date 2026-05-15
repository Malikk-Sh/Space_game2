// ============================================================
// 17-scenes-intro-title.js
// Intro cutscene + title screen + dev menu
// depends on: everything above
// (originally sintara_v25.html lines 8542-10045)
// ============================================================


// ======= ИНТРО-КАТСЦЕНА =======
// Длинная процедурная катсцена в пиксельном стиле, рассказывающая предысторию.
// Состоит из 11 сцен: предыстория, осада, сфера, дрейфующий пришелец, диалог в кокпите.
// Игрок может пропустить (ENTER/ТАП) после показа подсказки.
function initIntro(G){
  TAP_FIRE=false;ALLOW_JOY=false;G.state='intro';
  // Длительности сцен (60Гц). Разумные паузы для каждого нарративного бита.
  // [titlecard, peace, warning, pirates, sphere_build, tina_done, frozen_planets,
  //  time_skip, ship_arrives, detect_alien, pickup, cockpit_dialog, mission_map]
  const dur=[160,310,210,270,370,270,270,230,270,270,250,1510,230];
  G.intro={
    sceneIdx:0,sceneT:0,totalT:0,
    skipShown:false,
    durations:dur,
    // Камера: общий пан/зум для плавности
    camX:0,camY:0,camZoom:1,
    // Гражданские огни на планетах (показываем что миры жили)
    civilLights:[],
    // Замораживание планет (видим последствия Тины)
    iceProgress:0,
    // Пираты — корабли которые прилетают
    pirates:Array.from({length:6},(_,i)=>({
      x:LW+30+i*30,y:25+(i*23)%(LH-60),
      vx:-0.45-Math.random()*0.3,
      vy:(Math.random()-0.5)*0.12,
      sz:1,
      arr:false,arrT:0,delay:i*15,
    })),
    // Куски сферы — собираются вокруг звезды постепенно
    spherePieces:Array.from({length:14},(_,i)=>({
      angle:i/14*Math.PI*2,
      r:90,
      tr:30,
      placed:false,
      placeT:i*22,  // более долгая, размеренная сборка
      pieceT:0,
    })),
    // Звезда: яркость
    starBright:1,
    // Сканирующие лучи к пришельцу
    scanLines:[],
    // Состояние пришельца (положение, поза)
    alien:{x:LW/2,y:LH/2,rotT:0,onShip:false,bobT:0,wakeT:0},
    // Диалог в кокпите — больше реплик и более медленная подача
    dialogStep:0,dialogChar:0,dialogT:0,dialogHold:0,
    // Анимация трактор-луча
    beam:0,
    // Карта системы
    mapT:0,mapPing:0,
    // Стартовые данные звезды
    starX:LW/2,starY:LH/2-4,
    starParticleT:0,
    // Годы для скачка
    yearTicker:1,
    // Мерцающая планета (умирает)
    planetFlicker:0,
    // Между сценами — фейд: 0 = непрозрачно (видимо), 1 = чёрный экран
    sceneFade:1,
    // Подсказка-таймер для "пропуск"
    skipFadeIn:0,
  };
  PTS.length=0;SHK.length=0;FTX.length=0;
  initStars();resetBtns();
}

// === ОБЩИЕ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ КАТСЦЕНЫ ===

// Рисует красивую пиксельную звезду с лучами и короной (используется в нескольких сценах)
function drwCutsceneStar(sx,sy,radius,bright,t,withCorona){
  // Внешнее свечение
  const breath=1+Math.sin(t*.04)*.06;
  cx.globalAlpha=.10*bright;disc(sx,sy,((radius+18)*breath)|0,'#ffaa44');
  cx.globalAlpha=.16*bright;disc(sx,sy,((radius+8)*breath)|0,'#ffcc66');
  cx.globalAlpha=.28*bright;disc(sx,sy,(radius*breath)|0,'#ffdd88');
  cx.globalAlpha=1;
  if(withCorona&&bright>.3){
    // Корона
    cx.globalAlpha=.45*bright;
    for(let i=0;i<8;i++){
      const a=i/8*Math.PI*2+t*.005;
      const r1=radius-6,r2=radius+8+Math.sin(t*.05+i)*4;
      line(sx+Math.cos(a)*r1,sy+Math.sin(a)*r1,sx+Math.cos(a)*r2,sy+Math.sin(a)*r2,'#ffee88',1);
    }
    cx.globalAlpha=1;
  }
  // Тело звезды
  const coreAlpha=Math.max(0.2,bright);
  cx.globalAlpha=coreAlpha;disc(sx,sy,radius-4|0,'#ffaa22');
  cx.globalAlpha=Math.min(1,coreAlpha+0.05);disc(sx,sy,radius-7|0,'#ffcc44');
  cx.globalAlpha=Math.min(1,coreAlpha+0.1);disc(sx,sy,radius-10|0,'#ffee88');
  if(bright>.5){disc(sx,sy,radius-13|0,'#ffffff');}
  cx.globalAlpha=1;
}

// Рисует пиксельного пришельца. Поза: 'drift' (космос) или 'sit' (на скамье)
function drwAlien(x,y,t,pose,facing){
  facing=facing||1;
  // Вместо непрерывного вращения (которое даёт subpixel blur) используем
  // лёгкий bob по вертикали + горизонтальный flip для покачивания.
  const bob=pose==='drift'?Math.sin(t*.06)*1:0;
  cx.save();cx.translate(x|0,(y+bob)|0);
  cx.scale(facing,1);
  // Тень (только если на корабле)
  if(pose==='sit'){cx.fillStyle='rgba(0,0,0,0.35)';cx.fillRect(-5,5,11,2);}
  // Тело — мягкое грушевидное, фиолетовое
  rc(-3,-2,7,7,'#7744aa');     // основное тело
  rc(-2,-2,5,1,'#aa66cc');     // верхняя плашка светлее
  rc(-3,4,7,1,'#552288');      // низ темнее
  // Щупальца-ножки
  if(pose==='drift'){
    // Дрейф — щупальца расходятся
    const spread=Math.sin(t*.08);
    rc(-3-(spread>0?1:0),5,2,2,'#7744aa');
    rc(2+(spread<0?1:0),5,2,2,'#7744aa');
    rc(-1,5,2,3,'#7744aa');
  }else{
    // Сидит — щупальца под ним
    rc(-3,5,2,1,'#552288');
    rc(2,5,2,1,'#552288');
    rc(-1,5,2,2,'#552288');
  }
  // Голова — пузырь с антеннами
  cx.globalAlpha=0.85;disc(0,-7,5,'#aaeeff');cx.globalAlpha=1;
  ring(0,-7,5,'#88ccee',1);
  // Внутри пузыря — лицо
  cx.fillStyle=P.BLK;
  if(pose==='drift'&&t%80<70){
    // Без сознания — глаза-крестики
    cx.fillRect(-2,-9,1,1);cx.fillRect(-1,-8,1,1);
    cx.fillRect(0,-9,1,1);cx.fillRect(1,-8,1,1);
    cx.fillRect(-2,-7,1,1);cx.fillRect(0,-7,1,1);
  }else{
    // Большие глаза
    const blink=Math.floor(t/55)%5===0;
    if(!blink){cx.fillRect(-2,-9,2,2);cx.fillRect(1,-9,2,2);}
    else{cx.fillRect(-2,-8,2,1);cx.fillRect(1,-8,2,1);}
    // Блики в глазах
    cx.fillStyle='#ffffff';cx.fillRect(-2,-9,1,1);cx.fillRect(1,-9,1,1);
    // Маленький рот
    cx.fillStyle='#552288';cx.fillRect(-1,-5,2,1);
  }
  // Антенны
  cx.fillStyle='#aaeeff';
  rc(-2,-13,1,2,'#aaeeff');rc(2,-13,1,2,'#aaeeff');
  rc(-2,-14,1,1,'#ff44aa');rc(2,-14,1,1,'#ff44aa');
  cx.restore();
  // Мерцание антенн
  if(t%20<3){
    cx.globalAlpha=0.6;
    cx.fillStyle='#ffaaff';
    cx.fillRect((x-2)|0,(y-15)|0,1,1);cx.fillRect((x+2)|0,(y-15)|0,1,1);
    cx.globalAlpha=1;
  }
}

// Упрощённая версия пришельца — маленькая, чистая, без излишеств.
// Используется в сценах детекта/подбора, где он должен быть значительно
// меньше корабля игрока.
function drwAlienSimple(x,y,t,pose,facing){
  facing=facing||1;
  // Вместо вращения — простой bob.
  const bob=pose==='drift'?Math.sin(t*.07)*1:0;
  cx.save();cx.translate(x|0,(y+bob)|0);
  cx.scale(facing,1);
  // Тело — маленький овал (4 пикселя в высоту)
  rc(-2,-1,5,5,'#7744aa');
  rc(-2,-1,5,1,'#aa66cc');  // блик сверху
  rc(-2,3,5,1,'#552288');   // тень снизу
  // Голова — маленький пузырь
  cx.globalAlpha=0.85;disc(0,-3,3,'#aaeeff');cx.globalAlpha=1;
  // Глаза — две маленькие точки
  cx.fillStyle=P.BLK;
  if(pose==='drift'){
    // Без сознания — крестики X
    cx.fillRect(-2,-4,1,1);cx.fillRect(-1,-3,1,1);
    cx.fillRect(0,-4,1,1);cx.fillRect(1,-3,1,1);
  }else{
    // Открытые глаза
    cx.fillRect(-1,-3,1,1);cx.fillRect(1,-3,1,1);
  }
  // Щупальца — короткие
  rc(-2,4,1,1,'#7744aa');
  rc(2,4,1,1,'#7744aa');
  rc(0,4,1,1,'#552288');
  cx.restore();
}

// Рисует пиратский корабль (вид сбоку, маленький)
function drwPirateShip(x,y,t,sz){
  sz=sz||1;
  cx.save();cx.translate(x|0,y|0);cx.scale(sz,sz);
  // Корпус
  rc(-7,-2,12,4,P.PIR2);
  rc(-7,-1,12,2,P.PIR);
  rc(5,-1,2,2,P.PIR3);  // нос
  rc(-7,-3,3,1,'#330000'); // палуба
  rc(-7,2,3,1,'#330000');
  // Лазерная пушка
  rc(2,-3,1,2,'#aa3322');
  // Огни двигателя сзади
  if(t%4<2){rc(-9,-1,2,2,P.RED);rc(-10,0,1,1,'#ffaa44');}
  // Иллюминатор
  rc(-2,-1,2,1,'#ffaa44');
  cx.restore();
}

function updIntro(G){
  const I=G.intro;
  I.sceneT++;I.totalT++;
  if(I.totalT>40){
    I.skipShown=true;
    I.skipFadeIn=Math.min(1,I.skipFadeIn+.02);
  }
  // Пропуск
  if(I.totalT>50&&(KD.Enter||KD.Space||KD.Escape||mC)){
    sfxUI2();initAC();mC=false;
    startTrans(()=>initMenu(G));return;
  }
  updPts();updSHK();updFTX();

  // === ФЕЙД-ЛОГИКА ===
  // sceneFade: 1=полностью чёрный, 0=сцена видна.
  // Каждая сцена: первые 50 кадров затемнение → 0, последние 50 → 1.
  // ~0.83 сек на фейд (было 30 = ~0.5 сек).
  const dur=I.durations[I.sceneIdx];
  const FADE_LEN=50;
  if(I.sceneT<FADE_LEN){
    I.sceneFade=Math.max(0,1-I.sceneT/FADE_LEN);
  }else if(I.sceneT>dur-FADE_LEN){
    I.sceneFade=Math.min(1,(I.sceneT-(dur-FADE_LEN))/FADE_LEN);
  }else{
    I.sceneFade=0;
  }

  // Переход к следующей сцене
  if(I.sceneT>=dur){
    I.sceneIdx++;I.sceneT=0;I.sceneFade=1;
    // Сбрасываем некоторые состояния при переходе
    I.scanLines=[];
    if(I.sceneIdx>=I.durations.length){
      // Конец катсцены
      sfxUI2();initAC();
      startTrans(()=>initMenu(G));return;
    }
  }
  // === ОБНОВЛЕНИЕ ПО СЦЕНАМ ===
  // 0=titlecard, 1=peace_intro, 2=warning_signal, 3=pirates_arrive,
  // 4=sphere_build, 5=tina_complete, 6=frozen_planets,
  // 7=time_skip, 8=ship_approaches, 9=detect_alien,
  // 10=tractor_pickup, 11=cockpit_dialog, 12=mission_map
  const t=I.sceneT,s=I.sceneIdx;

  // Сцена 0 — заголовок (камера медленно плывёт)
  if(s===0){
    I.camY=Math.sin(t*.02)*1;
  }
  // Сцена 1 — мирная система: огоньки на планетах появляются
  if(s===1){
    if(t===80){
      // Фоновые гражданские огоньки — индикация что мир жил
      for(let i=0;i<25;i++){
        I.civilLights.push({
          baseX:LW/2+(Math.random()-.5)*180,
          baseY:LH/2+(Math.random()-.5)*100,
          ph:Math.random()*Math.PI*2,
          col:Math.random()<.5?'#ffeebb':'#88ccff',
        });
      }
    }
    // Звезда испускает частицы
    if(t%5===0){
      const a=Math.random()*Math.PI*2,r=18;
      PTS.push({x:I.starX+Math.cos(a)*r,y:I.starY+Math.sin(a)*r,vx:Math.cos(a)*.6,vy:Math.sin(a)*.6,lf:50,ml:60,col:Math.random()<.4?'#ffffff':'#ffee88',sz:1,gv:0,fade:.55});
    }
  }
  // Сцена 2 — Сигнал тревоги: красная пульсация, нет ещё пиратов
  if(s===2){
    if(t%4===0){
      const a=Math.random()*Math.PI*2,r=18;
      PTS.push({x:I.starX+Math.cos(a)*r,y:I.starY+Math.sin(a)*r,vx:Math.cos(a)*.5,vy:Math.sin(a)*.5,lf:40,ml:50,col:'#ffaa44',sz:1,gv:0,fade:.55});
    }
  }
  // Сцена 3 — пираты прилетают
  if(s===3){
    for(const p of I.pirates){
      if(t<p.delay)continue;
      if(!p.arr){
        p.x+=p.vx;p.y+=p.vy;
        const dx=I.starX-p.x,dy=I.starY-p.y,d=Math.hypot(dx,dy);
        if(d<60){p.arr=true;p.arrT=t;}
        if(t%3===0)PTS.push({x:p.x+9,y:p.y,vx:.5,vy:0,lf:8,ml:12,col:Math.random()<.5?P.RED:P.ORA,sz:1,gv:0,fade:.55});
      }else{
        const ang=t*0.018+p.arrT*0.04;
        p.x=I.starX+Math.cos(ang+p.arrT)*55;
        p.y=I.starY+Math.sin(ang+p.arrT)*40;
      }
    }
  }
  // Сцена 4 — сборка сферы
  if(s===4){
    for(let i=0;i<I.spherePieces.length;i++){
      const sp=I.spherePieces[i];
      sp.pieceT++;
      if(t>sp.placeT&&!sp.placed){
        sp.r=Math.max(sp.tr,sp.r-0.5);
        if(sp.r<=sp.tr+0.5){
          sp.placed=true;sp.r=sp.tr;
          spPts(I.starX+Math.cos(sp.angle)*sp.r,I.starY+Math.sin(sp.angle)*sp.r,5,['#aa6622','#ff4422',P.WHT],.3,1.5,15);
        }
      }
    }
    const placedCount=I.spherePieces.filter(sp=>sp.placed).length;
    I.starBright=1-placedCount/I.spherePieces.length*0.85;
  }
  // Сцена 5 — Тина готова, лучи выкачивают свет
  if(s===5){
    if(t%5===0){
      const a=Math.random()*Math.PI*2;
      PTS.push({x:I.starX+Math.cos(a)*30,y:I.starY+Math.sin(a)*30,vx:Math.cos(a)*1.2,vy:Math.sin(a)*1.2,lf:80,ml:90,col:'#ffaa44',sz:1,gv:0,fade:.4});
    }
  }
  // Сцена 6 — мёртвые миры замерзают
  if(s===6){
    I.iceProgress=Math.min(1,t/180);
    // Огоньки на планетах постепенно гаснут
    if(t%6===0&&I.civilLights.length>0){
      I.civilLights.splice((Math.random()*I.civilLights.length)|0,1);
    }
    // Снег летит
    if(t%4===0){
      PTS.push({x:Math.random()*LW,y:-2,vx:0,vy:.4+Math.random()*.3,lf:120,ml:130,col:'#ddeeff',sz:1,gv:0,fade:.7});
    }
  }
  // Сцена 7 — скачок во времени, годы мелькают
  if(s===7){
    if(t%2===0){
      const sy=Math.random()*LH;
      PTS.push({x:LW+5,y:sy,vx:-3-Math.random()*3,vy:0,lf:40,ml:50,col:Math.random()<.4?'#ffffff':P.S2,sz:1,gv:0,fade:.6});
    }
    scrollStars(2.4);
    I.yearTicker=Math.floor(t/4)*5; // годы быстро увеличиваются
  }
  // Сцена 8 — корабль игрока приближается, видна Тина вдалеке
  if(s===8){
    scrollStars(.9);
  }
  // Сцена 9 — детект пришельца (без SFX, без сканирующего луча)
  if(s===9){
    I.alien.rotT++;
    scrollStars(.5);
  }
  // Сцена 10 — подбор пришельца
  if(s===10){
    if(t>40)I.beam=Math.min(1,I.beam+0.02);
    I.alien.rotT++;
    if(t>40){
      const targetX=80+10,targetY=LH/2;
      I.alien.x+=(targetX-I.alien.x)*0.05;
      I.alien.y+=(targetY-I.alien.y)*0.05;
    }
    if(I.beam>.3&&t%4===0){
      PTS.push({x:I.alien.x,y:I.alien.y,vx:(Math.random()-.5)*.3,vy:-.4,lf:18,ml:24,col:'#aaeeff',sz:1,gv:0,fade:.55});
    }
  }
  // Сцена 11 — диалог в кокпите. Расширенный, с паузами.
  if(s===11){
    I.dialogT++;
    I.alien.bobT++;
    I.alien.wakeT=Math.min(60,I.alien.wakeT+0.5); // пришелец медленно "просыпается"
    const lines=[
      ['',''],                                                 // 0: тишина в начале
      ['ПИЛОТ:','...ТЫ ЖИВ?'],                                // 1
      ['ПРИШЕЛЕЦ:','*КАШЕЛЬ* ...ПОЧТИ.'],                     // 2
      ['ПРИШЕЛЕЦ:','БЛАГОДАРЮ ТЕБЯ, ПИЛОТ.'],                 // 3
      ['ПИЛОТ:','КАК ТЫ ОКАЗАЛСЯ ЗДЕСЬ?'],                    // 4
      ['ПРИШЕЛЕЦ:','...ЛУЧШЕ НЕ СПРАШИВАЙ.'],                 // 5
      ['ПРИШЕЛЕЦ:','НАШУ СИСТЕМУ ЗАХВАТИЛ СИНДИКАТ.'],        // 6
      ['ПРИШЕЛЕЦ:','ОНИ ЗАКОВАЛИ ЗВЕЗДУ В СФЕРУ.'],           // 7
      ['ПРИШЕЛЕЦ:','НАЗЫВАЮТ ЕЁ - ТИНА.'],                    // 8
      ['ПИЛОТ:','А МИРЫ?'],                                   // 9
      ['ПРИШЕЛЕЦ:','ЗАМЕРЗАЮТ. ОДИН ЗА ДРУГИМ.'],             // 10
      ['ПРИШЕЛЕЦ:','ТЫ - НАША ПОСЛЕДНЯЯ НАДЕЖДА.'],           // 11
      ['ПИЛОТ:','...ПРИНЯТО. КУРС НА ТИНУ.'],                 // 12
    ];
    const stepLen=110;  // дольше держим каждую реплику на экране
    const newStep=Math.min(lines.length-1,Math.floor(I.dialogT/stepLen));
    if(newStep!==I.dialogStep){
      I.dialogStep=newStep;I.dialogChar=0;
    }
    const curLine=lines[I.dialogStep]?lines[I.dialogStep][1]:'';
    // Печать символов: чуть медленнее (раз в 3 кадра вместо 2)
    if(I.dialogChar<curLine.length&&I.dialogT%3===0){
      I.dialogChar++;
    }
  }
  // Сцена 12 — карта системы
  if(s===12){
    I.mapT++;
    I.mapPing+=0.04;
    if(t%6===0){
      PTS.push({x:LW/2+(Math.random()-.5)*100,y:LH/2+(Math.random()-.5)*60,vx:0,vy:-.3,lf:40,ml:50,col:Math.random()<.4?P.YEL:P.UIT2,sz:1,gv:0,fade:.5});
    }
  }
}

function drwIntro(G){
  const I=G.intro,t=I.sceneT,s=I.sceneIdx,T=I.totalT;
  rc(0,0,LW,LH,P.BG);

  // ===== СЦЕНА 0: ЗАГЛАВИЕ =====
  if(s===0){
    drwStars();
    // Плавное появление текста
    const titleA=Math.min(1,t/40);
    const subA=Math.min(1,(t-30)/50);
    const proA=Math.min(1,(t-70)/40);
    cx.globalAlpha=titleA;
    txcs('SINTARA',LH/2-24,'#552200',P.BLK,3);  // тень
    txcs('SINTARA',LH/2-26,'#ffaa44',P.BLK,3);
    if(t%80<8){cx.globalAlpha=titleA*.4;txcs('SINTARA',LH/2-26,P.WHT,P.BLK,3);}
    cx.globalAlpha=Math.max(0,subA);
    txcs('ОСКОЛКИ ЗВЕЗДЫ',LH/2,P.UIT2,P.BLK,1);
    cx.globalAlpha=Math.max(0,proA);
    txcs('- ПРОЛОГ -',LH/2+14,'#aa6633',P.BLK,1);
    cx.globalAlpha=1;
    // Орбитальные искры вокруг заголовка
    if(t>20){
      for(let i=0;i<8;i++){
        const sx=(LW/2+Math.cos(i*0.785+T*.02)*65)|0;
        const sy=(LH/2-12+Math.sin(i*0.785+T*.02)*30)|0;
        cx.globalAlpha=(.5+.5*Math.sin(T*.1+i))*titleA;
        cx.fillStyle='#ffee88';cx.fillRect(sx,sy,1,1);
      }
      cx.globalAlpha=1;
    }
  }

  // ===== СЦЕНА 1: МИРНАЯ СИСТЕМА =====
  else if(s===1){
    drwStars();
    drwPts();
    // Звезда (с пульсацией)
    drwCutsceneStar(I.starX,I.starY,16,1,T,true);
    // Орбиты — плавное появление в начале
    const orbA=Math.min(1,t/45);
    cx.globalAlpha=.20*orbA;
    ring(I.starX,I.starY,40,P.CYA,1);ring(I.starX,I.starY,62,P.BUB3,1);ring(I.starX,I.starY,86,P.KRZ3,1);
    cx.globalAlpha=1;
    // Планеты на орбитах
    const orbT=T*.012;
    const planets=[
      {r:40,c:P.KRZ3,sz:4,ph:0,name:'КРАСНОЗЁМ'},
      {r:62,c:P.BUB1,sz:3,ph:2.1,name:'БУББЛИКА'},
      {r:86,c:P.PL1,sz:3,ph:4.3,name:'ДРОШ'},
    ];
    for(let pi=0;pi<planets.length;pi++){
      const pln=planets[pi];
      const px=(I.starX+Math.cos(orbT+pln.ph)*pln.r)|0;
      const py=(I.starY+Math.sin(orbT+pln.ph)*pln.r)|0;
      // След орбиты
      cx.globalAlpha=.18*orbA;
      for(let k=1;k<=5;k++){
        const ta=orbT+pln.ph-k*.07;
        cx.fillStyle=pln.c;cx.fillRect((I.starX+Math.cos(ta)*pln.r)|0,(I.starY+Math.sin(ta)*pln.r)|0,1,1);
      }
      cx.globalAlpha=1;
      // Лёгкое свечение планеты
      cx.globalAlpha=.4*orbA;disc(px,py,pln.sz+2,pln.c);cx.globalAlpha=1;
      disc(px,py,pln.sz,pln.c);
      // Подпись планеты появляется
      if(t>140){
        const labA=Math.min(1,(t-140)/40);
        cx.globalAlpha=labA;
        txs(pln.name,(px-gw(pln.name)/2)|0,py+pln.sz+3,pln.c,P.BLK,1);
        cx.globalAlpha=1;
      }
    }
    // Гражданские огоньки на планетах
    for(const v of I.civilLights){
      const blink=Math.sin(T*.1+v.ph);
      if(blink>0){cx.globalAlpha=.5*blink;cx.fillStyle=v.col;cx.fillRect(v.baseX|0,v.baseY|0,1,1);}
    }
    cx.globalAlpha=1;
    // Текст
    if(t>40){
      const a=Math.min(1,(t-40)/40);cx.globalAlpha=a;
      txcs('БЫЛА ЗВЁЗДНАЯ СИСТЕМА',LH-28,'#ffcc66','#332200',1);
      cx.globalAlpha=1;
    }
    if(t>120){
      const a2=Math.min(1,(t-120)/40);cx.globalAlpha=a2;
      txcs('ЖИЛИ МИРЫ. СВЕТИЛ ОГОНЬ.',LH-14,'#ffaa44','#332200',1);
      cx.globalAlpha=1;
    }
  }

  // ===== СЦЕНА 2: ТРЕВОЖНЫЙ СИГНАЛ =====
  else if(s===2){
    drwStars();drwPts();
    drwCutsceneStar(I.starX,I.starY,16,1,T,true);
    cx.globalAlpha=.10;
    ring(I.starX,I.starY,40,P.CYA,1);ring(I.starX,I.starY,62,P.BUB3,1);ring(I.starX,I.starY,86,P.KRZ3,1);
    cx.globalAlpha=1;
    // Планеты остаются
    const orbT=T*.012;
    const planets=[{r:40,c:P.KRZ3,sz:4,ph:0},{r:62,c:P.BUB1,sz:3,ph:2.1},{r:86,c:P.PL1,sz:3,ph:4.3}];
    for(const pln of planets){
      const px=(I.starX+Math.cos(orbT+pln.ph)*pln.r)|0;
      const py=(I.starY+Math.sin(orbT+pln.ph)*pln.r)|0;
      disc(px,py,pln.sz,pln.c);
    }
    // Красная пульсация по краям экрана — приближается беда
    const alarmIntensity=Math.min(1,t/60);
    if(Math.floor(T/14)%2){
      cx.globalAlpha=.18*alarmIntensity;
      rc(0,0,LW,5,P.RED);rc(0,LH-5,LW,5,P.RED);
      rc(0,0,5,LH,P.RED);rc(LW-5,0,5,LH,P.RED);
      cx.globalAlpha=1;
      // Маркер на радаре
      rc(2,2,4,4,P.RED);rc(LW-6,2,4,4,P.RED);
    }
    // Текст
    if(t>40){
      const a=Math.min(1,(t-40)/40);cx.globalAlpha=a;
      txcs('НО ОДНАЖДЫ...',LH-14,P.RED,P.BLK,1);
      cx.globalAlpha=1;
    }
    if(t>110){
      const a2=Math.min(1,(t-110)/40);cx.globalAlpha=a2;
      txcs('ИЗ ТЕМНОТЫ ПРИШЛИ ОНИ.',LH-26,'#ff8866',P.BLK,1);
      cx.globalAlpha=1;
    }
  }

  // ===== СЦЕНА 3: ПИРАТЫ СИНДИКАТА =====
  else if(s===3){
    drwStars();drwPts();
    drwCutsceneStar(I.starX,I.starY,16,.95,T,true);
    cx.globalAlpha=.10;
    ring(I.starX,I.starY,40,P.CYA,1);ring(I.starX,I.starY,62,P.BUB3,1);ring(I.starX,I.starY,86,P.KRZ3,1);
    cx.globalAlpha=1;
    // Планеты
    const orbT=T*.012;
    const planets=[{r:40,c:P.KRZ3,sz:4,ph:0},{r:62,c:P.BUB1,sz:3,ph:2.1},{r:86,c:P.PL1,sz:3,ph:4.3}];
    for(const pln of planets){
      const px=(I.starX+Math.cos(orbT+pln.ph)*pln.r)|0;
      const py=(I.starY+Math.sin(orbT+pln.ph)*pln.r)|0;
      disc(px,py,pln.sz,pln.c);
    }
    // Пираты (показываем только тех, чей delay прошёл)
    for(const p of I.pirates){
      if(t<p.delay)continue;
      drwPirateShip(p.x,p.y,T,p.sz);
    }
    // Красное затенение
    cx.globalAlpha=.10*Math.min(1,t/60);rc(0,0,LW,LH,'#440000');cx.globalAlpha=1;
    // Угловые огни тревоги
    if(Math.floor(T/12)%2){rc(2,18,3,3,P.RED);rc(LW-5,18,3,3,P.RED);}
    // Текст
    if(t>50){
      const a=Math.min(1,(t-50)/40);cx.globalAlpha=a;
      txcs('СИНДИКАТ. ПИРАТЫ ИЗ ПУСТОТЫ.',LH-14,P.RED,P.BLK,1);
      cx.globalAlpha=1;
    }
  }

  // ===== СЦЕНА 4: ПОСТРОЕНИЕ СФЕРЫ =====
  else if(s===4){
    drwStars();drwPts();
    drwCutsceneStar(I.starX,I.starY,16,I.starBright,T,I.starBright>0.5);
    // Куски сферы летят к звезде
    for(const sp of I.spherePieces){
      const px=I.starX+Math.cos(sp.angle)*sp.r;
      const py=I.starY+Math.sin(sp.angle)*sp.r;
      // Если ещё движется — рисуем след
      if(!sp.placed&&sp.r<80&&sp.r>sp.tr+0.5){
        cx.globalAlpha=.5;
        for(let k=1;k<=4;k++){
          const tx2=I.starX+Math.cos(sp.angle)*(sp.r+k*2);
          const ty2=I.starY+Math.sin(sp.angle)*(sp.r+k*2);
          cx.fillStyle='#aa6622';cx.fillRect(tx2|0,ty2|0,1,1);
        }
        cx.globalAlpha=1;
      }
      // Сам кусок
      cx.save();cx.translate(px|0,py|0);cx.rotate(sp.angle+Math.PI/2);
      rc(-3,-2,7,4,'#aa3322');
      rc(-2,-2,5,1,'#ff4422');
      rc(-3,1,7,1,'#440000');
      rc(-3,-2,1,1,'#ffaa44');
      rc(2,-2,1,1,'#ffaa44');
      cx.restore();
    }
    // Текст — поэтапно
    if(t>50){
      const a=Math.min(1,(t-50)/45);cx.globalAlpha=a;
      txcs('ОНИ ЗАКОВАЛИ ЗВЕЗДУ',LH-26,'#ff8866',P.BLK,1);
      cx.globalAlpha=1;
    }
    if(t>180){
      const a2=Math.min(1,(t-180)/45);cx.globalAlpha=a2;
      txcs('В СФЕРУ ДАЙСОНА',LH-12,'#ff4422',P.BLK,1);
      cx.globalAlpha=1;
    }
  }

  // ===== СЦЕНА 5: ТИНА ЗАВЕРШЕНА =====
  else if(s===5){
    drwStars();
    // Тёмная сфера на месте звезды
    cx.globalAlpha=0.85;disc(I.starX,I.starY,32,'#220011');cx.globalAlpha=1;
    // Внутри едва видны угольки звезды
    cx.globalAlpha=0.4+0.2*Math.sin(T*.08);
    disc(I.starX,I.starY,12,'#aa3322');
    disc(I.starX,I.starY,7,'#ff8844');
    cx.globalAlpha=1;
    // Гексагональная решётка сферы
    cx.strokeStyle='#882211';cx.lineWidth=1;
    for(let i=0;i<14;i++){
      const a=i/14*Math.PI*2;
      const x2=I.starX+Math.cos(a)*32,y2=I.starY+Math.sin(a)*32;
      cx.beginPath();
      for(let k=0;k<6;k++){
        const ka=k/6*Math.PI*2;
        const kx=x2+Math.cos(ka)*4,ky=y2+Math.sin(ka)*4;
        if(k===0)cx.moveTo(kx,ky);else cx.lineTo(kx,ky);
      }
      cx.closePath();cx.stroke();
    }
    // Лучи выкачивают свет
    for(let i=0;i<6;i++){
      const a=i/6*Math.PI*2+T*.01;
      cx.globalAlpha=.4+.3*Math.sin(T*.05+i);
      cx.strokeStyle='#ffaa44';cx.lineWidth=1;
      cx.beginPath();
      cx.moveTo(I.starX+Math.cos(a)*32,I.starY+Math.sin(a)*32);
      cx.lineTo(I.starX+Math.cos(a)*70,I.starY+Math.sin(a)*70);
      cx.stroke();
      cx.globalAlpha=1;
    }
    drwPts();
    // Текст
    if(t>40){
      const a=Math.min(1,(t-40)/40);cx.globalAlpha=a;
      txcs('ТАК РОДИЛАСЬ ТИНА',24,'#ff4422',P.BLK,1);
      cx.globalAlpha=1;
    }
    if(t>140){
      const a2=Math.min(1,(t-140)/45);cx.globalAlpha=a2;
      txcs('СВЕТ - ЦЕНТРУ. МИРАМ - ХОЛОД.',LH-14,'#ff6633',P.BLK,1);
      cx.globalAlpha=1;
    }
  }

  // ===== СЦЕНА 6: ЗАМЕРЗАЮЩИЕ МИРЫ =====
  else if(s===6){
    drwStars();
    // Тёмная Тина в центре маленькая
    cx.globalAlpha=.7;disc(I.starX,I.starY,12,'#220011');cx.globalAlpha=1;
    cx.globalAlpha=.3;disc(I.starX,I.starY,4,'#aa3322');cx.globalAlpha=1;
    // Орбиты бледные
    cx.globalAlpha=.06;ring(I.starX,I.starY,40,P.CYA,1);ring(I.starX,I.starY,62,P.BUB3,1);ring(I.starX,I.starY,86,P.KRZ3,1);cx.globalAlpha=1;
    // Планеты — постепенно покрываются льдом
    const orbT=T*.008;
    const planets=[{r:40,c:P.KRZ3,sz:4,ph:0},{r:62,c:P.BUB1,sz:3,ph:2.1},{r:86,c:P.PL1,sz:3,ph:4.3}];
    for(const pln of planets){
      const px=(I.starX+Math.cos(orbT+pln.ph)*pln.r)|0;
      const py=(I.starY+Math.sin(orbT+pln.ph)*pln.r)|0;
      // Затемнённая планета
      const dimC=I.iceProgress>0.3?'#5a6a8a':pln.c;
      disc(px,py,pln.sz,dimC);
      // Ледяная корка постепенно нарастает
      if(I.iceProgress>0.4){
        cx.globalAlpha=Math.min(.7,(I.iceProgress-0.4)/0.6);
        disc(px-1,py-1,pln.sz-1,'#dde8f2');
        cx.globalAlpha=1;
      }
    }
    // Падающий снег
    drwPts();
    // Огоньки гаснут
    for(const v of I.civilLights){
      const blink=Math.sin(T*.1+v.ph);
      if(blink>0){cx.globalAlpha=.4*blink*(1-I.iceProgress);cx.fillStyle=v.col;cx.fillRect(v.baseX|0,v.baseY|0,1,1);}
    }
    cx.globalAlpha=1;
    // Текст
    if(t>30){
      const a=Math.min(1,(t-30)/40);cx.globalAlpha=a;
      txcs('МИРЫ ОДИН ЗА ДРУГИМ',24,'#88aacc',P.BLK,1);
      cx.globalAlpha=1;
    }
    if(t>130){
      const a2=Math.min(1,(t-130)/40);cx.globalAlpha=a2;
      txcs('ПОГРУЖАЛИСЬ ВО ТЬМУ И ХОЛОД',LH-14,'#aabbdd',P.BLK,1);
      cx.globalAlpha=1;
    }
  }

  // ===== СЦЕНА 7: СКАЧОК ВО ВРЕМЕНИ =====
  else if(s===7){
    rc(0,0,LW,LH,'#000');
    drwPts();
    // Глитч-полосы
    if(t%6<3){
      for(let i=0;i<3;i++){
        const gy=Math.random()*LH|0;
        cx.globalAlpha=.3;cx.fillStyle=Math.random()<.5?P.CYA:P.RED;
        cx.fillRect(0,gy,LW,1);cx.globalAlpha=1;
      }
    }
    // Счётчик годов крутится
    const a=Math.min(1,t/30)*Math.min(1,(I.durations[s]-t)/30);
    cx.globalAlpha=a;
    txcs('ГОДЫ ШЛИ...',LH/2-14,'#aaaacc',P.BLK,1);
    cx.globalAlpha=a*.6;
    // Бегущий счётчик годов
    const yearText=I.yearTicker+' ЛЕТ';
    txcs(yearText,LH/2-2,P.WHT,P.BLK,2);
    cx.globalAlpha=a*.6;
    txcs('СВЕТ ПОЧТИ УГАС',LH/2+18,'#aa8844',P.BLK,1);
    cx.globalAlpha=1;
  }

  // ===== СЦЕНА 8: ПОСЛЕДНИЙ ПИЛОТ =====
  else if(s===8){
    drwStars();drwNebula();
    // Маленькая Тина вдалеке справа
    cx.globalAlpha=.6;disc(LW-30,30,8,'#220011');cx.globalAlpha=1;
    cx.globalAlpha=.3+.2*Math.sin(T*.07);disc(LW-30,30,3,'#aa3322');cx.globalAlpha=1;
    // Корабль игрока летит вперёд
    const px=80+Math.sin(T*.04)*4;
    const py=LH/2+Math.cos(T*.03)*3;
    drwShip(px,py,0,T,false,1);
    // Текст
    if(t>35){
      const a=Math.min(1,(t-35)/45);cx.globalAlpha=a;
      txcs('400 ЛЕТ СПУСТЯ.',24,P.CYA,P.BLK,1);
      cx.globalAlpha=1;
    }
    if(t>120){
      const a=Math.min(1,(t-120)/45);cx.globalAlpha=a;
      txcs('ПОСЛЕДНИЙ ПИЛОТ ИДЁТ К ТИНЕ.',LH-14,P.UIT2,P.BLK,1);
      cx.globalAlpha=1;
    }
  }

  // ===== СЦЕНА 9: ОБНАРУЖЕН ОБЪЕКТ (упрощённая версия) =====
  else if(s===9){
    drwStars();drwNebula();
    // Корабль слева — рисуется крупнее (интегерное масштабирование 2x для пиксель-перфектности)
    const px=70,py=LH/2;
    cx.save();
    cx.translate(px|0,py|0);
    cx.scale(2,2);
    drwShip(0,0,0,T,false,1);
    cx.restore();

    // Дрейфующий пришелец справа — теперь меньше относительно корабля
    const ax=220+Math.sin(T*.03)*3,ay=LH/2+Math.sin(T*.05)*4;
    I.alien.x=ax;I.alien.y=ay;
    drwAlienSimple(ax,ay,T,'drift',1);
    drwPts();

    // === ЗНАКИ ВОПРОСА над кораблём (он озадачен) ===
    if(t>30){
      const qBaseY=py-26;
      // Три знака вопроса появляются последовательно с разной высотой и пульсацией
      const questions=[
        {dx:-6,delay:30,bob:0},
        {dx:0,delay:55,bob:1.0},
        {dx:6,delay:80,bob:2.0},
      ];
      for(const q of questions){
        if(t<q.delay)continue;
        const qa=Math.min(1,(t-q.delay)/20);
        const qy=qBaseY-Math.sin(T*0.1+q.bob)*2;
        // Тень знака вопроса
        cx.globalAlpha=qa*.6;
        txs('?',(px+q.dx-1)|0,qy+1|0,P.BLK,P.BLK,1);
        // Светлый знак вопроса
        cx.globalAlpha=qa;
        txs('?',(px+q.dx-1)|0,qy|0,P.YEL,P.BLK,1);
        cx.globalAlpha=1;
      }
    }

    // Текст внизу — теперь спокойнее, без восклицаний
    if(t>80){
      const a=Math.min(1,(t-80)/45);cx.globalAlpha=a;
      txcs('ЧТО-ТО ДРЕЙФУЕТ В КОСМОСЕ...',LH-14,P.UIT2,P.BLK,1);
      cx.globalAlpha=1;
    }
  }

  // ===== СЦЕНА 10: ПОДБОР ТРАКТОР-ЛУЧОМ =====
  else if(s===10){
    drwStars();drwNebula();
    const sx=70,sy=LH/2;
    // Корабль крупнее
    cx.save();cx.translate(sx|0,sy|0);cx.scale(2,2);
    drwShip(0,0,0,T,false,1);
    cx.restore();
    const ax=I.alien.x,ay=I.alien.y;
    // === ТРАКТОР-ЛУЧ (статичный, не пульсирует) ===
    if(I.beam>0){
      // Используем фиксированную яркость, без модуляции по времени
      const baseA=I.beam;
      // Конусные направляющие
      const startX=sx+15;
      const startTopY=sy-4;
      const startBotY=sy+4;
      const endX=ax-3;
      const endTopY=ay-6;
      const endBotY=ay+6;
      // Внешние границы конуса — однотонные тонкие линии
      cx.globalAlpha=0.5*baseA;
      cx.strokeStyle='#88ddff';cx.lineWidth=1;
      cx.beginPath();cx.moveTo(startX,startTopY);cx.lineTo(endX,endTopY);cx.stroke();
      cx.beginPath();cx.moveTo(startX,startBotY);cx.lineTo(endX,endBotY);cx.stroke();
      // Заливка конуса — однородная, без пульсации, плавный градиент по длине
      for(let p=0;p<1;p+=.04){
        const lx=startX+(endX-startX)*p;
        const ly=sy+(ay-sy)*p;
        const wTop=startTopY+(endTopY-startTopY)*p;
        const wBot=startBotY+(endBotY-startBotY)*p;
        const halfH=(wBot-wTop)/2;
        cx.globalAlpha=0.16*baseA;
        cx.fillStyle='#aaeeff';
        cx.fillRect((lx)|0,(ly-halfH)|0,2,(halfH*2)|0);
      }
      cx.globalAlpha=1;
    }
    drwAlienSimple(ax,ay,T,'drift',1);
    drwPts();
    // Текст
    if(t>40){
      const a=Math.min(1,(t-40)/40);cx.globalAlpha=a;
      txcs('ТРАКТОР-ЛУЧ АКТИВЕН',LH-14,P.CYA,P.BLK,1);
      cx.globalAlpha=1;
    }
  }

  // ===== СЦЕНА 11: ДИАЛОГ В КОКПИТЕ (переработана) =====
  else if(s===11){
    // === ФОН: космическая туманность снаружи кокпита ===
    rc(0,0,LW,LH,'#020610');
    // Звёзды/туманность за окном
    for(let i=0;i<40;i++){
      const sx2=(i*9+Math.sin(T*.02+i)*2)%LW;
      const sy2=(7+(i*5)%50);
      cx.globalAlpha=.4+.4*Math.sin(T*.08+i*0.7);
      cx.fillStyle=i%4?'#ffffff':'#aaccff';
      cx.fillRect(sx2|0,sy2|0,1,1);
    }
    // Лёгкая туманность
    for(let i=0;i<3;i++){
      const nx=(LW/4+i*70-T*.2)%(LW+40)-20;
      cx.globalAlpha=.06;
      disc(nx|0,(20+i*8)|0,16+i*4,i%2?'#3a1a4a':'#1a2a5a');
    }
    cx.globalAlpha=1;

    // === КОКПИТ — компактный, вертикальная компоновка ===
    // Внутренние стены кокпита (рамка вокруг всего)
    rc(0,0,LW,LH,'#0a1525');
    // Большое окно/иллюминатор сверху — теперь меньше (только вверху)
    const winY=4,winH=42;
    rc(8,winY,LW-16,winH,'#000510');
    // Звёзды за окном
    for(let i=0;i<22;i++){
      const sx2=(12+i*6+T*.15)%(LW-22);
      const sy2=(winY+1+(i*7)%(winH-2));
      cx.globalAlpha=.5+.4*Math.sin(T*.12+i*0.8);
      cx.fillStyle='#ffffff';cx.fillRect(sx2|0,sy2|0,1,1);
    }
    cx.globalAlpha=1;
    // Рамка иллюминатора
    cx.strokeStyle='#1a3550';cx.lineWidth=2;
    cx.strokeRect(8,winY,LW-16,winH);
    // Болты по углам рамки
    rc(7,winY-1,3,3,'#445566');
    rc(LW-10,winY-1,3,3,'#445566');
    rc(7,winY+winH-1,3,3,'#445566');
    rc(LW-10,winY+winH-1,3,3,'#445566');
    // Заголовок над окном
    txs('КОКПИТ КОРАБЛЯ',6,winY+winH+2,P.UIT2,P.BLK,1);

    // === ПОЛ КОКПИТА И СЦЕНА С ПЕРСОНАЖАМИ ===
    // Зона персонажей теперь повыше — между окном и диалогом
    const floorY=winY+winH+10;  // y пола
    // Пол с перспективой (тёмные полосы)
    rc(0,floorY,LW,LH-floorY,'#0a141e');
    rc(0,floorY,LW,1,'#1a2f44');
    rc(0,floorY+1,LW,1,'#08101a');
    // Линии перспективы пола
    cx.strokeStyle='#0e1828';cx.lineWidth=1;
    for(let i=0;i<5;i++){
      const ly=floorY+4+i*8;
      if(ly<LH-30){
        cx.globalAlpha=.4;
        cx.beginPath();cx.moveTo(0,ly);cx.lineTo(LW,ly);cx.stroke();
      }
    }
    cx.globalAlpha=1;

    // === ПИЛОТ — справа, та же модель что и в игре ===
    const pilotX=LW-36;
    const pilotY=floorY+18;
    const fakePC={x:pilotX,y:pilotY,facing:-1,wt:0};
    drwPC(fakePC,T);

    // === ПРИШЕЛЕЦ — слева, на скамье ===
    const benchX=14, benchY=floorY+15, benchW=26;
    // Скамья
    rc(benchX,benchY,benchW,3,'#3a2a1a');
    rc(benchX,benchY,benchW,1,'#5a4a2a');
    // Ножки скамьи
    rc(benchX+1,benchY+3,2,4,'#2a1a0a');
    rc(benchX+benchW-3,benchY+3,2,4,'#2a1a0a');
    // Пришелец
    const apY=benchY-1+Math.sin(I.alien.bobT*.06)*1;
    drwAlien(benchX+benchW/2,apY,I.alien.bobT,'sit',1);

    // === ПРИБОРНАЯ ПАНЕЛЬ — узкая полоска внизу с экранами ===
    const dashY=LH-46;
    rc(0,dashY,LW,8,'#082030');
    rc(0,dashY,LW,1,'#1a3550');
    // Кнопки-индикаторы
    for(let i=0;i<10;i++){
      const bx=4+i*((LW-8)/10|0);
      rc(bx,dashY+2,3,3,(T+i*8)%24<12?P.GRN:'#003322');
    }

    // === ДИАЛОГОВОЕ ОБЛАКО ВНИЗУ ===
    const lines=[
      ['',''],
      ['ПИЛОТ:','...ТЫ ЖИВ?'],
      ['ПРИШЕЛЕЦ:','*КАШЕЛЬ* ...ПОЧТИ.'],
      ['ПРИШЕЛЕЦ:','БЛАГОДАРЮ ТЕБЯ, ПИЛОТ.'],
      ['ПИЛОТ:','КАК ТЫ ОКАЗАЛСЯ ЗДЕСЬ?'],
      ['ПРИШЕЛЕЦ:','...ЛУЧШЕ НЕ СПРАШИВАЙ.'],
      ['ПРИШЕЛЕЦ:','НАШУ СИСТЕМУ ЗАХВАТИЛ СИНДИКАТ.'],
      ['ПРИШЕЛЕЦ:','ОНИ ЗАКОВАЛИ ЗВЕЗДУ В СФЕРУ.'],
      ['ПРИШЕЛЕЦ:','НАЗЫВАЮТ ЕЁ - ТИНА.'],
      ['ПИЛОТ:','А МИРЫ?'],
      ['ПРИШЕЛЕЦ:','ЗАМЕРЗАЮТ. ОДИН ЗА ДРУГИМ.'],
      ['ПРИШЕЛЕЦ:','ТЫ - НАША ПОСЛЕДНЯЯ НАДЕЖДА.'],
      ['ПИЛОТ:','...ПРИНЯТО. КУРС НА ТИНУ.'],
    ];
    const cur=lines[I.dialogStep];
    if(cur&&cur[0]){
      // Диалоговое окно прямо над приборной панелью.
      // Внутренний паддинг: 5px по бокам, 4px сверху, 4px снизу для воздуха.
      const dboxH=18, dboxY=LH-46-dboxH+12, dboxX=4, dboxW=LW-8;
      bx2(dboxX,dboxY,dboxW,dboxH,'#001833','#3388cc',1);
      // Тонкая внутренняя полоска для отделения имени от текста
      rc(dboxX+1,dboxY+10,dboxW-2,1,'#1a4470');
      // Имя говорящего (цветное), с горизонтальным паддингом 5px и вертикальным 3px
      const isAlien=cur[0].startsWith('ПРИШЕЛЕЦ');
      txs(cur[0],dboxX+5,dboxY+3,isAlien?P.PUR:P.CYA,P.BLK,1);
      // Печатаемый текст с тем же паддингом
      const visible=cur[1].slice(0,I.dialogChar);
      txs(visible,dboxX+5,dboxY+12,P.WHT,P.BLK,1);
      // Курсор печати
      if(I.dialogChar<cur[1].length&&Math.floor(I.dialogT/8)%2){
        txs('_',dboxX+5+gw(visible),dboxY+12,P.YEL,P.BLK,1);
      }
      // Стрелка указывает на говорящего
      cx.fillStyle='#3388cc';
      if(isAlien){
        // Стрелка слева — вверх к пришельцу
        cx.fillRect(benchX+benchW/2-1,dboxY-2,3,2);
        cx.fillRect(benchX+benchW/2,dboxY-3,1,1);
      }else{
        // Стрелка справа — вверх к пилоту
        cx.fillRect(pilotX-1,dboxY-2,3,2);
        cx.fillRect(pilotX,dboxY-3,1,1);
      }
    }else{
      // Молчание в начале
      const dboxH=18, dboxY=LH-46-dboxH+12, dboxX=4, dboxW=LW-8;
      bx2(dboxX,dboxY,dboxW,dboxH,'#001220','#1a3550',1);
      cx.globalAlpha=.4+.2*Math.sin(T*.1);
      txcs('...',dboxY+7,P.UIT3,P.BLK,1);
      cx.globalAlpha=1;
    }
    drwPts();
  }

  // ===== СЦЕНА 12: КАРТА СИСТЕМЫ =====
  else if(s===12){
    drwStars();drwPts();
    const cx_=LW/2,cy_=LH/2-4;
    cx.globalAlpha=0.7;disc(cx_,cy_,16,'#220011');cx.globalAlpha=1;
    cx.globalAlpha=0.4+0.2*Math.sin(T*.1);
    disc(cx_,cy_,5,'#aa3322');cx.globalAlpha=1;
    cx.globalAlpha=.35;
    ring(cx_,cy_,40,P.CYA,1);ring(cx_,cy_,62,P.BUB3,1);ring(cx_,cy_,86,P.KRZ3,1);
    cx.globalAlpha=1;
    // Радар-пинг
    const pingR=(I.mapPing*30)%70+10;
    cx.globalAlpha=Math.max(0,1-pingR/70)*.4;
    ring(cx_,cy_,pingR|0,P.YEL,1);
    cx.globalAlpha=1;
    const planets=[
      {r:40,c:P.KRZ3,name:'КРАСНОЗЁМ',ph:0},
      {r:62,c:P.BUB1,name:'БУББЛИКА',ph:2.1},
      {r:86,c:P.PL1,name:'ДРОШ',ph:4.3},
    ];
    for(const pln of planets){
      const a=T*.012+pln.ph;
      const px=(cx_+Math.cos(a)*pln.r)|0,py=(cy_+Math.sin(a)*pln.r)|0;
      cx.globalAlpha=.6+.4*Math.sin(T*.15+pln.ph);
      ring(px,py,6,P.YEL,1);
      cx.globalAlpha=1;
      disc(px,py,3,pln.c);
      txs(pln.name,px-gw(pln.name)/2,py+8,pln.c,P.BLK,1);
    }
    if(t>30){
      const a=Math.min(1,(t-30)/40);cx.globalAlpha=a;
      txcs('МИССИЯ: ОСВОБОДИТЬ ЗВЕЗДУ',16,P.YEL,P.BLK,1);
      cx.globalAlpha=1;
    }
    if(t>110){
      const pulse=.7+.3*Math.sin(T*.2);
      cx.globalAlpha=pulse;
      txcs(USE_TOUCH_UI?'ТАП - НАЧАТЬ':'ENTER - НАЧАТЬ',LH-14,P.GRN,P.BLK,1);
      cx.globalAlpha=1;
    }
  }

  // === ЧЁРНАЯ ШТОРКА ФЕЙДА МЕЖДУ СЦЕНАМИ ===
  if(I.sceneFade>0){
    cx.globalAlpha=I.sceneFade;
    rc(0,0,LW,LH,P.BLK);
    cx.globalAlpha=1;
  }

  // === Подсказка о пропуске ===
  if(I.skipShown&&s<12){
    cx.globalAlpha=I.skipFadeIn*(.5+.2*Math.sin(T*.08));
    const m=USE_TOUCH_UI?'ТАП - ПРОПУСТИТЬ':'ESC - ПРОПУСТИТЬ';
    txs(m,LW-gw(m)-3,LH-7,P.UIT3,1);
    cx.globalAlpha=1;
  }

  // === Прогресс-бар сцены ===
  if(s<12){
    const totalDur=I.durations.reduce((a,b)=>a+b,0);
    const cur=I.durations.slice(0,s).reduce((a,b)=>a+b,0)+t;
    const fw=(LW*cur/totalDur)|0;
    rc(0,LH-1,fw,1,P.UIT3);
  }

  drawTrans();
}
// ======= /КАТСЦЕНА =======

// ======= СТАРТОВЫЙ ЭКРАН (ТИТУЛ) =======
// Это первый экран при загрузке игры — другой фон, чем у "old menu":
// планетный пейзаж, силуэт Тины на горизонте, аврора, без корабля.
// Здесь же доступны настройки.
function initTitle(G){
  TAP_FIRE=false;ALLOW_JOY=false;G.state='title';
  G.title={
    t:0,
    sel:0,             // 0=НАЧАТЬ, 1=НАСТРОЙКИ
    inSettings:false,
    setSel:0,          // 0=fullscreen, 1=sfx, 2=music, 3=back
    inDev:false,       // DEV меню открыто
    devSel:0,          // выбранный пункт DEV меню (0-6)
    bgT:0,
    auroraOff:0,
    stars:[],
    // Огоньки в "поселении" на горизонте
    villageLights:Array.from({length:8},(_,i)=>({
      x:30+i*36+Math.random()*8,
      blink:Math.random()*Math.PI*2,
    })),
    // Падающие звёзды (декорация)
    shootingStars:[],
  };
  // Звёзды — медленный дрейф
  for(let i=0;i<70;i++)G.title.stars.push({
    x:Math.random()*LW,
    y:Math.random()*120,
    sp:.015+Math.random()*.05,
    b:Math.random(),
    sz:Math.random()<.06?2:1,
    tw:Math.random()*Math.PI*2,
    twSp:.02+Math.random()*.05,
  });
  PTS.length=0;SHK.length=0;FTX.length=0;
  resetBtns();
}

function updTitle(G){
  const T=G.title;T.t++;T.bgT++;T.auroraOff+=.4;
  for(const s of T.stars){s.x-=s.sp;if(s.x<-1){s.x=LW;s.y=Math.random()*120;}s.tw+=s.twSp;}
  for(const v of T.villageLights){v.blink+=0.03+Math.random()*0.01;}
  // Падающие звёзды раз в ~5 сек
  if(T.t%280===0||(T.t%180===0&&Math.random()<.3)){
    T.shootingStars.push({
      x:Math.random()*LW,y:5+Math.random()*30,
      vx:-1.5-Math.random(),vy:0.5+Math.random()*.4,
      lf:50,ml:60,
    });
  }
  for(let i=T.shootingStars.length-1;i>=0;i--){
    const ss=T.shootingStars[i];
    ss.x+=ss.vx;ss.y+=ss.vy;ss.lf--;
    if(ss.lf<=0||ss.x<-30||ss.y>140)T.shootingStars.splice(i,1);
  }

  // Навигация
  if(T.inDev){
    // === DEV МЕНЮ ===
    const ND=8;
    if(KD.ArrowUp||KD.KeyW){T.devSel=(T.devSel+ND-1)%ND;sfxUI();KD.ArrowUp=KD.KeyW=false;}
    if(KD.ArrowDown||KD.KeyS){T.devSel=(T.devSel+1)%ND;sfxUI();KD.ArrowDown=KD.KeyS=false;}
    if(KD.Escape){T.inDev=false;sfxUI();KD.Escape=false;}
    if(KD.Enter||KD.Space){_executeDevAction(G,T.devSel);KD.Enter=KD.Space=false;}
    if(mC){
      initAC();
      if(G._devHits){for(const h of G._devHits){if(mX>=h.x&&mX<=h.x+h.w&&mY>=h.y&&mY<=h.y+h.h){T.devSel=h.idx;_executeDevAction(G,h.idx);break;}}}
      mC=false;
    }
  }else if(T.inSettings){
    if(KD.ArrowUp||KD.KeyW){T.setSel=(T.setSel+3)%4;sfxUI();}
    if(KD.ArrowDown||KD.KeyS){T.setSel=(T.setSel+1)%4;sfxUI();}
    if(KD.Escape){T.inSettings=false;sfxUI();}
    if(KD.Enter||KD.Space){
      _executeTitleSetting(G,T.setSel);
    }
    // Touch / mouse выбор пунктов настроек
    if(mC){
      initAC();
      // Hits — заполнятся при отрисовке
      if(G._titleHits){
        for(const h of G._titleHits){
          if(mX>=h.x&&mX<=h.x+h.w&&mY>=h.y&&mY<=h.y+h.h){
            T.setSel=h.idx;
            _executeTitleSetting(G,h.idx);
            break;
          }
        }
      }
      mC=false;
    }
  }else{
    if(KD.ArrowUp||KD.KeyW){T.sel=(T.sel+1)%2;sfxUI();}
    if(KD.ArrowDown||KD.KeyS){T.sel=(T.sel+1)%2;sfxUI();}
    if(KD.Enter||KD.Space){
      sfxUI2();initAC();
      if(T.sel===0){
        startTrans(()=>initIntro(G));
      }else{
        T.inSettings=true;T.setSel=0;
      }
    }
    // Touch / mouse main menu
    if(mC){
      initAC();
      // Клик по "V0.7" → открыть DEV меню
      if(mX>=2&&mX<=26&&mY>=LH-12&&mY<=LH-1){T.inDev=true;T.devSel=0;sfxUI();mC=false;}
      else if(G._titleHits){
        for(const h of G._titleHits){
          if(mX>=h.x&&mX<=h.x+h.w&&mY>=h.y&&mY<=h.y+h.h){
            sfxUI2();
            if(h.idx===0){
              startTrans(()=>initIntro(G));
            }else if(h.idx===1){
              T.inSettings=true;T.setSel=0;
            }
            break;
          }
        }
      }
      mC=false;
    }
  }
}

function _executeTitleSetting(G,idx){
  switch(idx){
    case 0: toggleFullscreen(); sfxUI2(); break;
    case 1: SFX_ON=!SFX_ON; if(SFX_ON)sfxUI2(); break;
    case 2: MUSIC_ON=!MUSIC_ON; sfxUI2(); break;
    case 3: G.title.inSettings=false; sfxUI(); break;
  }
}

// ======= DEV MENU =======
function _executeDevAction(G,idx){
  switch(idx){
    case 0: _DEV.immortal=!_DEV.immortal; sfxUI2(); break;
    case 1: {const si=_DEV_SPEEDS.indexOf(_DEV.speedMult);_DEV.speedMult=_DEV_SPEEDS[(si<0?0:si+1)%4];sfxUI2();break;}
    case 2: {const si=_DEV_DMGS.indexOf(_DEV.dmgMult);_DEV.dmgMult=_DEV_DMGS[(si<0?0:si+1)%4];sfxUI2();break;}
    case 3: devTeleport(G,'drosh'); break;
    case 4: devTeleport(G,'bubblika'); break;
    case 5: devTeleport(G,'krasnozem'); break;
    case 6: devTeleport(G,'tina'); break;
    case 7: G.title.inDev=false; sfxUI(); break;
  }
}
function devTeleport(G,dest){
  // Восстанавливаем корабль
  if(!G.ship)G.ship={fuel:100,decor:0}; else G.ship.fuel=100;
  // Восстанавливаем игрока
  G.pl.hp=G.pl.mhp;G.pl.en=G.pl.men;G.pl.inv=0;G.pl.shield=0;G.pl.boost=0;
  // Пушим планеты в visited
  const vis=G.campaignState.planetsVisited;
  const comp=G.campaignState.planetsCompleted;
  const inv=G.campaignState.inventory;
  const fl=G.campaignState.flags;
  function ensureVisited(p){if(!vis.includes(p))vis.push(p);}
  function ensureCompleted(p){if(!comp.includes(p))comp.push(p);}
  // Дрош → Бубблика → Краснозём prerequisites
  if(dest==='bubblika'||dest==='krasnozem'||dest==='tina'){
    fl.droshSideDone=true;fl.droshQuestAccepted=true;
    inv.laserBlueprint=true;G.droshDone=true;
    ensureVisited('drosh');ensureCompleted('drosh');
    G.campaignState.currentPlanet='drosh';
  }
  if(dest==='krasnozem'||dest==='tina'){
    fl.bubSideDone=true;fl.pfftGifted=true;fl.bubDeliveryDone=true;
    inv.bubblikaContract=true;G.bubblikaDone=true;
    ensureVisited('bubblika');ensureCompleted('bubblika');
    G.campaignState.currentPlanet='bubblika';
  }
  if(dest==='tina'){
    fl.krzQuestStarted=true;G.krasnozemDone=true;
    inv.laserStrong=true;inv.shieldBlueprint=true;inv.shieldBuilt=true;inv.starBattery=true;
    G.pl.wep=2;G.pl.mhp=360;G.pl.hp=360;G.pl.men=200;G.pl.en=200;
    G.pl.cr=300;G.pl.res=15;G.pl.workers=4;
    ensureVisited('krasnozem');ensureCompleted('krasnozem');
    G.campaignState.currentPlanet='krasnozem';
    G.campaignState.targetPlanet='center';
  }else{
    G.campaignState.currentPlanet=dest;
    G.campaignState.targetPlanet=dest;
  }
  G.title.inDev=false;sfxUI2();
  startTrans(()=>{
    if(dest==='drosh')initPlanetDrosh(G);
    else if(dest==='bubblika')initPlanetBubblika(G);
    else if(dest==='krasnozem')initPlanetKrasnozem(G);
    else if(dest==='tina')initFinaleTina(G);
  });
}
// ======= /DEV MENU =======

function drwTitle(G){
  const T=G.title,t=T.t;
  // === ГРАДИЕНТ НЕБА ===
  for(let y=0;y<140;y++){
    let col;
    if(y<24)col='#01030a';
    else if(y<48)col='#03061a';
    else if(y<80)col='#06112a';
    else if(y<110)col='#0a1a3a';
    else col='#152545';
    rc(0,y,LW,1,col);
  }

  // === ЗВЁЗДЫ ===
  for(const s of T.stars){
    const tw=.5+.5*Math.sin(s.tw);
    cx.globalAlpha=Math.max(.1,Math.min(1,s.b*tw));
    cx.fillStyle=s.b>.7?P.S1:s.b>.4?P.S2:P.S3;
    cx.fillRect(s.x|0,s.y|0,s.sz,s.sz);
  }
  cx.globalAlpha=1;

  // === ПАДАЮЩИЕ ЗВЁЗДЫ ===
  for(const ss of T.shootingStars){
    const tail=Math.min(8,ss.ml-ss.lf);
    cx.globalAlpha=Math.min(1,ss.lf/15);
    line(ss.x,ss.y,ss.x+tail*1.2,ss.y-tail*0.4,'#ffeebb',1);
    cx.fillStyle='#ffffff';
    cx.fillRect(ss.x|0,ss.y|0,1,1);
    cx.globalAlpha=1;
  }

  // === ДАЛЁКАЯ ТИНА — силуэт в небе ===
  const tx=LW-40,ty=34;
  // Внешний тёмный диск
  cx.globalAlpha=0.55;
  disc(tx,ty,11,'#220011');
  cx.globalAlpha=1;
  // Контур — медленно пульсирующий
  cx.globalAlpha=0.45+0.18*Math.sin(t*.05);
  ring(tx,ty,11,'#aa3322',1);
  cx.globalAlpha=1;
  // Тлеющее ядро
  cx.globalAlpha=0.45+0.2*Math.sin(t*.07);
  disc(tx,ty,3,'#ff4422');
  cx.globalAlpha=1;
  // Шесть тонких лучей энергии — Тина выкачивает свет
  for(let i=0;i<6;i++){
    const a=i/6*Math.PI*2+t*.008;
    cx.globalAlpha=.18+.10*Math.sin(t*.05+i*1.2);
    line(tx+Math.cos(a)*11,ty+Math.sin(a)*11,
         tx+Math.cos(a)*18,ty+Math.sin(a)*18,
         '#ff6633',1);
  }
  cx.globalAlpha=1;
  // Мелкая подпись возле Тины
  cx.globalAlpha=.5;
  txs('ТИНА',tx-9,ty+14,'#aa6644',P.BLK,1);
  cx.globalAlpha=1;

  // === АВРОРА (полярное сияние) ===
  for(let i=0;i<5;i++){
    cx.globalAlpha=.13-i*.018;
    const aColor=i<2?'#1a4a8a':(i<4?'#2a6aaa':'#3a8acc');
    cx.fillStyle=aColor;
    for(let x=0;x<LW;x+=2){
      const wy=132-i*5-Math.sin(x*.04+T.auroraOff*.05+i)*4-Math.sin(x*.09+T.auroraOff*.03)*3;
      cx.fillRect(x,wy|0,2,3);
    }
  }
  cx.globalAlpha=1;

  // === ГОРЫ НА ГОРИЗОНТЕ ===
  // Дальние горы (светло-синие)
  cx.fillStyle='#0e1a35';
  for(let x=-2;x<LW;x+=4){
    const h=4+Math.abs(Math.sin(x*.10))*5+Math.abs(Math.sin(x*.31))*3;
    cx.fillRect(x,144-h,4,h+10);
  }
  // Передние горы (тёмные)
  cx.fillStyle='#040818';
  for(let x=0;x<LW;x+=2){
    const h=8+Math.abs(Math.sin(x*.07))*7+Math.abs(Math.sin(x*.21))*4;
    cx.fillRect(x,150-h,2,LH-150+h);
  }
  // Снежные вершины
  for(let x=-2;x<LW;x+=10){
    const h=10+Math.abs(Math.sin(x*.13))*9;
    rc(x+1,150-h,1,1,'#dde8ee');
  }

  // === ОГОНЬКИ ПОСЕЛЕНИЯ В ДОЛИНЕ ===
  for(const v of T.villageLights){
    const lit=Math.sin(v.blink)>0.3;
    if(lit){
      cx.globalAlpha=.7+.2*Math.sin(v.blink*1.5);
      rc(v.x|0,150,1,1,'#ffcc66');
      cx.globalAlpha=.25;
      rc((v.x-1)|0,149,3,1,'#ffaa44');
      cx.globalAlpha=1;
    }
  }

  // === ПЕРЕДНИЙ ПЛАН (ТЁМНАЯ ЗЕМЛЯ) ===
  rc(0,158,LW,LH-158,'#02040e');
  for(let x=0;x<LW;x+=5){
    if(x%23<8)rc(x,158+(x%5),3,2,'#0a1226');
  }

  // === ЗАГОЛОВОК — двухслойный ===
  txcs('SINTARA',26,'#882200','#000',3);
  txcs('SINTARA',24,'#ffaa44','#000',3);
  if(t%80<6){cx.globalAlpha=.4;txcs('SINTARA',24,P.WHT,'#000',3);cx.globalAlpha=1;}
  // Подзаголовок
  txcs('ОСКОЛКИ ЗВЕЗДЫ',46,P.UIT2,P.BLK,1);

  G._titleHits=[];

  if(!T.inSettings){
    // === ГЛАВНОЕ МЕНЮ ===
    const items=['НАЧАТЬ ИГРУ','НАСТРОЙКИ'];
    for(let i=0;i<items.length;i++){
      const ity=88+i*16;
      const w=gw(items[i])+12;
      const ix=(LW-w)/2|0;
      const oh=11;
      const hover=mY>=ity-2&&mY<=ity+oh-2&&mX>=ix&&mX<=ix+w;
      if(hover)T.sel=i;
      const sel=T.sel===i;
      // Фон-плашка для выделенного
      if(sel){
        const pulse=.6+.4*Math.sin(t*.12);
        cx.globalAlpha=pulse*.4;
        rc(ix,ity-2,w,oh,'#3a1010');
        cx.globalAlpha=1;
        // Стрелки указатели
        txt('>',ix-2,ity,P.YEL,1);
        txt('<',ix+w-2,ity,P.YEL,1);
      }
      txc(items[i],ity,sel?P.YEL:P.UIT2,1);
      G._titleHits.push({x:ix,y:ity-2,w,h:oh,idx:i});
    }
    // Подсказка
    if(t>30){
      cx.globalAlpha=.4+.25*Math.sin(t*.07);
      const m=USE_TOUCH_UI?'ТАП ПО ПУНКТУ':'СТРЕЛКИ + ENTER';
      txcs(m,LH-9,P.UIT3,P.BLK,1);
      cx.globalAlpha=1;
    }
    // Версия (клик открывает DEV меню)
    const vCol=(_DEV.immortal||_DEV.speedMult>1||_DEV.dmgMult>1)?'#ffaa00':P.S3;
    txt('V0.7',2,LH-7,vCol,1);
    if(_DEV.immortal||_DEV.speedMult>1||_DEV.dmgMult>1){
      cx.globalAlpha=.7+.3*Math.sin(t*.15);
      rc(23,LH-7,2,2,'#ffaa00');
      cx.globalAlpha=1;
    }
  }else{
    // === ПАНЕЛЬ НАСТРОЕК ===
    cx.globalAlpha=.85;rc(0,0,LW,LH,P.BLK);cx.globalAlpha=1;
    const pw=140,ph=100,px=(LW-pw)/2|0,py=(LH-ph)/2|0;
    rc(px-2,py-2,pw+4,ph+4,P.UIT);
    rc(px,py,pw,ph,'#0a1828');
    rc(px+1,py+1,pw-2,ph-2,'#152d40');
    // Заголовок
    txcs('НАСТРОЙКИ',py+8,P.CYA,P.BLK,1);
    rc(px+10,py+15,pw-20,1,'#1a3a52');
    // Опции
    const opts=[
      {label:'ПОЛНЫЙ ЭКРАН', val:''},
      {label:'ЗВУК', val:SFX_ON?'ВКЛ':'ВЫКЛ', col:SFX_ON?P.GRN:P.UIT2},
      {label:'МУЗЫКА', val:MUSIC_ON?'ВКЛ':'ВЫКЛ', col:MUSIC_ON?P.GRN:P.UIT2},
      {label:'НАЗАД', val:''},
    ];
    for(let i=0;i<opts.length;i++){
      const o=opts[i];
      const oy=py+22+i*15;
      const sel=(T.setSel===i);
      const ox=px+10, ow=pw-20, oh=12;
      const hover=(mX>=ox&&mX<=ox+ow&&mY>=oy-1&&mY<=oy+oh);
      if(hover&&!sel)T.setSel=i;
      if(sel||hover){rc(ox,oy-1,ow,oh,sel?'#1a3a6a':'#0a2040');}
      if(sel){
        txt('>',ox+2,oy+2,P.YEL,1);
        txt('<',ox+ow-6,oy+2,P.YEL,1);
      }
      const labelCol=sel?P.WHT:P.UIT;
      txt(o.label,ox+10,oy+2,labelCol,1);
      if(o.val){
        const vw=gw(o.val);
        txt(o.val,ox+ow-12-vw,oy+2,o.col||P.UIT,1);
      }
      G._titleHits.push({x:ox,y:oy-1,w:ow,h:oh,idx:i});
    }
    // Подсказка
    txcs(USE_TOUCH_UI?'ТАП - ВЫБРАТЬ':'СТРЕЛКИ / ENTER / ESC',py+ph-9,P.UIT2,P.BLK,1);
  }

  // === DEV МЕНЮ OVERLAY ===
  if(T.inDev){
    G._devHits=[];
    const pw=176,ph=138,px=(LW-pw)/2|0,py=(LH-ph)/2|0;
    cx.globalAlpha=.93;rc(0,0,LW,LH,P.BLK);cx.globalAlpha=1;
    rc(px-2,py-2,pw+4,ph+4,'#554400');
    rc(px-1,py-1,pw+2,ph+2,'#332800');
    rc(px,py,pw,ph,'#0c0900');
    rc(px+1,py+1,pw-2,ph-2,'#130f02');
    txcs('[DEV] РЕЖИМ РАЗРАБОТЧИКА',py+8,'#ffaa00',P.BLK,1);
    rc(px+8,py+15,pw-16,1,'#443300');
    const DEV_ROWS=[
      {label:'БЕССМЕРТИЕ',type:'toggle'},
      {label:'СКОРОСТЬ ПОЛЁТА',type:'speed'},
      {label:'УРОН ИГРОКА',type:'dmg'},
      null,
      {label:'ДРОШ',type:'tp'},
      {label:'БУББЛИКА',type:'tp'},
      {label:'КРАСНОЗЁМ',type:'tp'},
      {label:'БОЙ С ТИНОЙ',type:'tp'},
      {label:'ЗАКРЫТЬ',type:'close'},
    ];
    // selectable items: 0,1,2 = indices 0,1,2; then 3=null; then 3,4,5,6,7 = indices 4,5,6,7,8
    const SEL_MAP=[0,1,2,4,5,6,7,8];
    let ry=py+20;
    for(let i=0;i<DEV_ROWS.length;i++){
      const row=DEV_ROWS[i];
      if(row===null){cx.globalAlpha=.6;txcs('── ТЕЛЕПОРТ ──',ry+3,'#886600',P.BLK,1);cx.globalAlpha=1;ry+=11;continue;}
      const si=SEL_MAP.indexOf(i);
      const isSel=(T.devSel===si);
      const ox=px+8,ow=pw-16,oh=11;
      const hover=(mX>=ox&&mX<=ox+ow&&mY>=ry-1&&mY<=ry+oh&&!isSel);
      if(hover)T.devSel=si;
      if(isSel||hover)rc(ox,ry-1,ow,oh,isSel?'#2a1a00':'#180f00');
      if(isSel){txt('>',ox+2,ry+1,'#ffcc00',1);txt('<',ox+ow-6,ry+1,'#ffcc00',1);}
      const lc=isSel?'#ffdd55':(row.type==='tp'?'#aa8833':'#cc9900');
      txt((row.type==='tp'?'> ':'')+row.label,ox+10,ry+1,lc,1);
      let val='',vc='#ffaa00';
      if(row.type==='toggle'){val=_DEV.immortal?'ВКЛ':'ВЫКЛ';vc=_DEV.immortal?P.GRN:'#663300';}
      else if(row.type==='speed'){val=_DEV.speedMult+'x';vc=_DEV.speedMult>1?'#ffbb00':'#666600';}
      else if(row.type==='dmg'){val=_DEV.dmgMult+'x';vc=_DEV.dmgMult>1?'#ff6600':'#666600';}
      if(val){txt(val,ox+ow-12-gw(val),ry+1,vc,1);}
      G._devHits.push({x:ox,y:ry-1,w:ow,h:oh,idx:si});
      ry+=11;
    }
    txcs(USE_TOUCH_UI?'ТАП - ВЫБРАТЬ':'СТРЕЛКИ / ENTER / ESC',py+ph-7,'#665500',P.BLK,1);
  }

  drawTrans();
}
// ======= /СТАРТОВЫЙ ЭКРАН =======

