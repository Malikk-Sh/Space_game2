// ============================================================
// 15-scene-ship.js
// Ship interior view (4 rooms: Power, Fuel, Bridge, Workstation) + animation scenes
// depends on: everything above
// (originally sintara_v25.html lines 5434-6451)
// ============================================================

// ======= SHIP VIEW + ВЕРСТАК =======
function updShip(G){
  handlePauseInput(G);if(G.paused)return;
  // Туториал блокирует игровой ввод
  if(G.tutorial){updTutorial(G);return;}
  G.shipT++;if(G.notifT>0)G.notifT--;
  // ★ PR C: если открыт sub-screen — обрабатываем его и выходим
  if(G.shipUI==='workshop'){updShipWorkshop(G);updFTX();return;}
  if(G.shipUI==='workers'){updShipWorkers(G);updFTX();return;}
  if(G.shipUI==='map'){updShipMap(G);updFTX();return;}

  // === ТУТОРИАЛ КОРАБЛЯ (только при первом входе) ===
  if(!G.campaignState.flags.tutShipShown&&G.shipT===1){
    G.campaignState.flags.tutShipShown=true;
    setTimeout(()=>{
      if(G.state!=='ship_view')return;
      const touch=USE_TOUCH_UI;
      // Координаты ячеек: см. drwShipView. 2x2 сетка по 110x64, начиная от (4,14) с зазором 2.
      const cellW=110, cellH=64;
      // Power: col=0,row=0 → (4,14)+cellW/2,cellH/2 = (59,46)
      // Fuel: col=1,row=0 → (116,14)+ → (171,46)
      // Workshop: col=0,row=1 → (4,80)+ → (59,112)
      // Bridge: col=1,row=1 → (116,80)+ → (171,112)
      // Right panel: panelX = 2*(110+2)+4+4 = 232, начало
      startTutorial(G,[
        {text:['ИНТЕРФЕЙС КОРАБЛЯ.','4 ОТСЕКА И ПАНЕЛЬ СТАТУСА.'],
         tx:LW/2-90,ty:LH/2-20},
        {text:['ЭЛЕКТРОСТАНЦИЯ:','РАБОЧИЕ ВЫРАБАТЫВАЮТ ЭНЕРГИЮ.','БОЛЬШЕ РАБОЧИХ - БЫСТРЕЕ.'],
         hx:59,hy:46,arrow:'left',tx:120,ty:30,hr:32},
        {text:['ТОПЛИВО:','НАЖМИ - ОБМЕНЯЙ РЕСУРСЫ','НА ТОПЛИВО ДЛЯ ПОЛЁТОВ.'],
         hx:171,hy:46,arrow:'left',tx:8,ty:30,hr:32},
        {text:['ВЕРСТАК:','СОБИРАЕТ ОРУЖИЕ И ЩИТЫ','ИЗ НАЙДЕННЫХ ЧЕРТЕЖЕЙ.'],
         hx:59,hy:112,arrow:'left',tx:120,ty:90,hr:32},
        {text:['МОСТИК:','НАВИГАЦИЯ.','ПОКАЗЫВАЕТ ТЕКУЩИЙ КУРС.'],
         hx:171,hy:112,arrow:'left',tx:8,ty:90,hr:32},
        {text:['СПРАВА - СТАТУС:','ХП, ЭН, ТОПЛ, РЕСУРСЫ,','УЛУЧШЕНИЯ.'],
         hx:264,hy:LH/2,arrow:'right',tx:120,ty:LH/2-20,hr:30},
        {text:touch?['КНОПКА < В ВЕРХУ - ВЫХОД.','НАЖИМАЙ НА ОТСЕК - ИНФА/ДЕЙСТВИЕ.']:['TAB - ВЫЙТИ.','КЛИКНИ ПО ОТСЕКУ - ИНФА/ДЕЙСТВИЕ.']},
      ]);
    },100);
  }

  // ★ PR C: Tab/back на sub-screen — возврат к главному экрану корабля (а не выход)
  if((KD.Tab||btnJust('back'))&&G.shipUI&&G.shipUI!=='main'){
    G.shipUI='main';sfxUI();return;
  }
  if(KD.Tab||btnJust('back')){sfxUI();startTrans(()=>{ALLOW_JOY=true;TAP_FIRE=false;G.state=G.shipReturnState||'planet_drosh';resetBtns();
    if(G.state==='planet_drosh'){addBtn('int',LW-20,LH-20,12,'*',P.YEL);addBtn('ship',20,24,10,'S',P.UIT);}
    else if(G.state==='planet_bubblika'){addBtn('int',LW-20,LH-20,12,'*',P.YEL);addBtn('ship',20,24,10,'S',P.UIT);addBtn('jump',LW-20,LH-48,12,'J',P.CYA);}
    else if(G.state==='planet_krasnozem'){addBtn('int',LW-20,LH-20,12,'*',P.YEL);addBtn('ship',20,24,10,'S',P.UIT);}
    else if(G.state==='space'){
      // ★ Phase 2.4: возврат в космос с сохранённым состоянием полёта
      TAP_FIRE=true;ALLOW_JOY=true;
      if(USE_TOUCH_UI){addBtn('boost',LW-20,36,14,'>>',P.TH2);addBtn('wcyc',LW-40,LH-22,11,'WP',P.L1);addBtn('ship',LW-20,LH-22,10,'S',P.UIT);}
    }
    else if(G.state==='finale_tina'){addBtn('w1',LW-52,LH-22,11,'1',P.L1);addBtn('w2',LW-28,LH-22,11,'2',P.L3);}
    return;
  });}

  // ★ v16 r4 (other-4): ВЗЛЁТ из интерфейса корабля по [L] / тач-кнопке
  // (только если игрок прибыл сюда с планеты и квест на ней выполнен)
  {
    const ret=G.shipReturnState;
    let canLaunchHere=false, planetKey=null;
    if(ret==='planet_drosh'&&G.droshDone){canLaunchHere=true;planetKey='drosh';}
    else if(ret==='planet_bubblika'&&G.bubblikaDone){canLaunchHere=true;planetKey='bubblika';}
    else if(ret==='planet_krasnozem'&&G.krasDone){canLaunchHere=true;planetKey='krasnozem';}
    if(canLaunchHere&&(KD.KeyL||(USE_TOUCH_UI&&btnJust('launch')))){
      sfxLand();
      if(!G.campaignState.planetsCompleted.includes(planetKey))G.campaignState.planetsCompleted.push(planetKey);
      G.campaignState.targetPlanet=PLANETS[planetKey].nextPlanet;
      G.shipReturnState=null;
      startTrans(()=>{G.pl.hp=Math.min(G.pl.mhp,G.pl.hp+30);G.pl.en=G.pl.men;G.ship.fuel=Math.min(100,G.ship.fuel+40);initSpace(G);});
      return;
    }
  }


  // === ОБРАБОТКА КЛИКОВ ПО ОТСЕКАМ КОРАБЛЯ ===
  // Раньше эта логика была внутри drwShipView, но из-за нового delta-time loop
  // mC (флаг клика) уже очищен flushIn() к моменту рендера.
  // Поэтому теперь обработка ввода полностью переехала в update.
  if(mC){
    const hits=G._shipRoomHits;
    if(hits){
      for(const h of hits){
        if(mX>=h.x&&mX<=h.x+h.w&&mY>=h.y&&mY<=h.y+h.h){
          sfxUI2();
          if(h.action){h.action(G);fText(h.x+h.w/2,h.y+12,'OK',h.col);}
          else{fText(h.x+h.w/2,h.y+12,'INFO',h.col);G.notif=h.notif;G.notifT=120;G.notifCol=h.col;}
          mC=false;
          break;
        }
      }
    }
  }
  updFTX();
}

function drwRoomPower(G,x,y){
  const t=G.shipT;
  // Фон комнаты
  rc(x,y,20,18,'#15293a');rc(x+1,y+1,18,16,'#0c1a25');
  // Стены/панели
  rc(x+1,y+1,18,1,'#1d3a52');
  // === БЕГОВЫЕ ДОРОЖКИ ===
  // 4 параллельные дорожки, по которым бегают рабочие
  const workers=Math.max(1,Math.min(4,G.pl.workers));
  for(let lane=0;lane<4;lane++){
    const ly=y+5+lane*3;
    // Полотно беговой дорожки (бегущая лента)
    rc(x+2,ly,12,2,'#2a3a4a');
    // Полоски движения на ленте
    const offset=Math.floor(t*0.6+lane*3)%4;
    for(let s=0;s<3;s++){
      const sx=x+2+((s*4+offset)%12);
      rc(sx,ly,1,1,'#445566');
      rc(sx,ly+1,1,1,'#334455');
    }
    // Поручни дорожки (тёмная окантовка)
    rc(x+2,ly-1,12,1,'#1a2a3a');
    rc(x+1,ly,1,2,'#445566'); // правая ручка
    rc(x+14,ly,1,2,'#445566'); // левая ручка
    // Бегущий рабочий (если есть)
    if(lane<workers){
      const runT=Math.floor(t/4)+lane*2;
      const wx=x+5+(runT%4); // рабочий "бегает" вперёд-назад на месте
      const wy=ly-3;
      const legPhase=runT%2;
      // Тело
      rc(wx,wy+1,2,2,'#88ccff');
      // Голова
      rc(wx,wy-1,2,2,'#aaccee');
      // Ноги (анимация бега)
      if(legPhase===0){
        rc(wx-1,wy+3,1,1,'#6688aa');
        rc(wx+2,wy+3,1,1,'#6688aa');
      }else{
        rc(wx,wy+3,1,1,'#6688aa');
        rc(wx+1,wy+3,1,1,'#6688aa');
      }
      // Капля пота
      if(t%30+lane*7<3)rc(wx-1,wy-1,1,1,'#aaeeff');
    }
  }
  // === ЭНЕРГОБЛОК / ГЕНЕРАТОР справа ===
  rc(x+15,y+4,3,11,'#332244');
  rc(x+15,y+4,3,1,'#553366');
  // Шкалы заряда
  for(let c=0;c<3;c++){
    const py=y+6+c*3;
    rc(x+16,py,1,2,'#003322');
    if((t+c*5)%18<10)rc(x+16,py,1,Math.min(2,(t+c*5)%4),P.EN);
  }
  // Кабель идёт от дорожек к генератору
  rc(x+14,y+10,1,1,P.EN);
  if(t%6<3)rc(x+15,y+10,1,1,P.EN);
  // Свечение генератора
  cx.globalAlpha=.4+.2*Math.sin(t*.18);
  rc(x+15,y+5,3,1,P.EN);
  cx.globalAlpha=1;
  // Большая лампочка-индикатор
  if(t%20<14)rc(x+19,y+3,1,2,P.EN2);
  else rc(x+19,y+3,1,2,P.EN);
}
function drwRoomFuel(G,x,y){rc(x+4,y,12,15,'#223322');rc(x+5,y+1,10,13,'#334433');const fl=Math.floor(13*0.7);rc(x+5,y+1+(13-fl),10,fl,P.RES);if(G.shipT%18<9)rc(x+8,y+2,2,2,'#aaffaa');if(G.shipT%24<12)rc(x+12,y+4,1,1,'#aaffaa');rc(x+4,y+15,12,2,'#1a2a1a');rc(x+7,y-2,6,2,'#445544');rc(x+8,y-3,4,1,'#556655');}
function drwRoomBridge(G,x,y){const t=G.shipT;rc(x,y,20,18,'#1d1a2d');rc(x+1,y+1,18,16,'#0f0e18');rc(x+2,y+2,10,7,'#082626');for(let ln=0;ln<4;ln++)if(ln<Math.floor(t/10)%5)rc(x+3,y+3+ln,8+((t+ln*7)%2),1,P.GRN);rc(x+13,y+2,5,6,'#1d2f3f');rc(x+14,y+3,3,1,P.UIT2);rc(x+3,y+11,14,6,'#334455');rc(x+4,y+12,12,1,'#667788');rc(x+8,y+10,4,2,'#778899');}

// --- ВЕРСТАК (Workstation) — показывает что можно построить ---
function drwRoomWorkstation(G,x,y){
  const t=G.shipT;
  const inv=G.campaignState.inventory;
  // Фон-стена с панелями
  rc(x,y,20,18,'#0e1a0e');rc(x+1,y+1,18,16,'#091409');
  rc(x+1,y+1,18,1,'#1a3a1a'); // верхняя планка

  // === ПОЛКА С ЧЕРТЕЖАМИ (верхняя часть) ===
  // Чертёж лазера слева
  if(inv.laserBlueprint){
    rc(x+2,y+2,7,5,'#001a44');rc(x+2,y+2,7,1,'#0033aa');
    // Линии чертежа
    cx.fillStyle=inv.laserStrong?'#33ff66':'#3388ff';
    cx.fillRect(x+3,y+4,5,1);cx.fillRect(x+3,y+5,3,1);cx.fillRect(x+5,y+3,1,3);
    // Метка
    if(inv.laserStrong){
      // Готов — зелёная галка
      rc(x+7,y+2,2,1,'#33ff66');
    }else if(t%24<14){
      // Доступно — мигающий маркер
      rc(x+7,y+2,2,1,P.YEL);
    }
  }else{
    // Пустое место (нет чертежа)
    rc(x+2,y+2,7,5,'#0a0f0a');
    if(t%30<2)txt('?',x+5,y+3,'#332233',1);
  }
  // Чертёж щита справа
  if(inv.bubblikaContract){
    rc(x+11,y+2,7,5,'#003322');rc(x+11,y+2,7,1,'#005544');
    // Иконка щита
    cx.fillStyle=inv.shieldBuilt?'#33ff66':'#88ccff';
    cx.fillRect(x+13,y+3,4,1);cx.fillRect(x+13,y+4,4,2);
    cx.fillRect(x+14,y+5,2,1);
    // Метка
    if(inv.shieldBuilt){
      rc(x+16,y+2,2,1,'#33ff66');
    }else if(t%24<14){
      rc(x+16,y+2,2,1,P.YEL);
    }
  }else{
    rc(x+11,y+2,7,5,'#0a0f0a');
    if(t%30<2)txt('?',x+14,y+3,'#332233',1);
  }

  // === ВЕРСТАК (стол) ===
  rc(x+1,y+10,18,2,'#3a2a0a');rc(x+1,y+12,18,1,'#2a1a05');
  rc(x+1,y+13,18,3,'#1a0a05'); // тёмная нижняя часть стола

  // === ИНСТРУМЕНТЫ НА СТОЛЕ ===
  // Молоток (анимация удара)
  const hammerY=y+(t%20<10?9:10);
  rc(x+3,hammerY,2,1,'#aa8833');
  rc(x+3,hammerY-1,3,2,'#cc9944');
  rc(x+5,hammerY+1,1,3,'#553311');
  // Гаечный ключ
  rc(x+8,y+9,1,3,'#888899');
  rc(x+7,y+9,3,1,'#aaaabb');
  // Паяльник с искрами
  rc(x+12,y+8,1,4,'#445566');
  rc(x+12,y+8,1,1,'#ff8800');
  // Деталь, которая собирается прямо сейчас
  const canBuildLaser=inv.laserBlueprint&&!inv.laserStrong&&G.pl.cr>=90;
  const canBuildShield=inv.bubblikaContract&&!inv.shieldBuilt&&G.pl.cr>=60;
  const allDone=inv.laserStrong&&inv.shieldBuilt;
  if(canBuildLaser){
    // На столе собирается красный лазер
    cx.globalAlpha=.7+.3*Math.sin(t*.15);
    rc(x+14,y+10,4,1,P.L3);rc(x+15,y+9,2,1,P.L3L);
    cx.globalAlpha=1;
    if(t%6<3)rc(x+18,y+9,1,1,'#ffffff'); // искры
  }else if(canBuildShield){
    cx.globalAlpha=.6+.4*Math.sin(t*.15);
    ring(x+16,y+10,2,P.CYA,1);
    rc(x+15,y+10,3,1,P.CYA);
    cx.globalAlpha=1;
  }
  // === ИНДИКАТОР СОСТОЯНИЯ (вверху справа) ===
  if(allDone){
    // Все собраны — зелёный
    if(t%20<10){rc(x+16,y+15,3,2,P.GRN);}else{rc(x+16,y+15,3,2,'#003300');}
  }else if(canBuildLaser||canBuildShield){
    // Можно строить — мигающий жёлтый
    if(t%16<8){rc(x+16,y+15,3,2,P.YEL);}else{rc(x+16,y+15,3,2,'#332200');}
  }else if(inv.laserBlueprint||inv.bubblikaContract){
    // Чертёж есть, но мало кредитов — оранжевый
    rc(x+16,y+15,3,2,'#aa4400');
  }else{
    // Нет чертежей
    rc(x+16,y+15,3,2,'#221100');
  }
}

function drwShipView(G){
  // ★ PR C / PR E: диспетчер sub-screens — мастерская, рабочие, системная карта
  if(G.shipUI==='workshop'){drwShipWorkshop(G);return;}
  if(G.shipUI==='workers'){drwShipWorkers(G);return;}
  if(G.shipUI==='map'){drwShipMap(G);return;}
  // ===== ВЕРХНЯЯ ПАНЕЛЬ =====
  rc(0,0,LW,LH,'#020610');
  // Тонкая решётка фона - имитация интерфейса
  const go=(G.shipT*.3)%8;cx.strokeStyle='#040a14';cx.lineWidth=.5;
  for(let x=0;x<LW;x+=16){cx.beginPath();cx.moveTo(x-go,0);cx.lineTo(x-go,LH);cx.stroke();}
  for(let y=0;y<LH;y+=16){cx.beginPath();cx.moveTo(0,y);cx.lineTo(LW,y);cx.stroke();}

  // Полоса заголовка
  rc(0,0,LW,12,'#0a1828');rc(0,12,LW,1,'#1a3550');
  txs('SINTARA - ИНТЕРЬЕР КОРАБЛЯ',3,3,P.CYA,P.BLK,1);
  txs(USE_TOUCH_UI?'[<] НАЗАД':'[TAB] НАЗАД',LW-58,3,P.UIT2,P.BLK,1);

  const inv=G.campaignState.inventory;
  const FEED_COST=2,FEED_FUEL=22;
  const t=G.shipT;

  // ===== СЕТКА ИЗ 4 КОМНАТ (2x2) =====
  // Каждая комната — реальный интерьер с собственными стенами и сценой.
  const gridX=4, gridY=14;
  const cellW=110, cellH=64;
  const gap=2;

  // Описания всех 4 комнат
  // ★ Phase 2.2: верстак теперь даёт 4 новых оружия в дополнение к Л2 и Щиту.
  //   Stop-gap acquisition: пока нет квестов на Бубблике/Краснозёме — все оружия покупаются здесь.
  const cr=G.pl.cr, mat=G.campaignState.materials||0;
  // ★ Phase 2.4: фильтруем уже стоящие в очереди — не предлагаем их повторно
  const _queuedIds=new Set((G.ship&&G.ship.craftQueue?G.ship.craftQueue:[]).map(c=>c.id));
  const _workshopItems=[
    {unbuilt:inv.laserBlueprint&&!inv.laserStrong, label:'Л2',     short:'Л2',     cost:90,  matCost:0, id:'l2'},
    {unbuilt:inv.bubblikaContract&&!inv.shieldBuilt, label:'ЩИТ',  short:'ЩИТ',    cost:60,  matCost:0, id:'shield'},
    // ★ Balance #9: цены оружий снижены — слишком долго копились
    {unbuilt:!inv.spreadUnlocked,  label:'СПРЕД',  short:'СПРЕД',  cost:30,  matCost:0, id:'spread'},
    {unbuilt:!inv.missileUnlocked, label:'РАКЕТА', short:'РАКЕТА', cost:50,  matCost:1, id:'missile'},
    {unbuilt:!inv.beamUnlocked,    label:'ЛУЧ',    short:'ЛУЧ',    cost:80,  matCost:1, id:'beam'},
    {unbuilt:!inv.burstUnlocked,   label:'БЁРСТ',  short:'БЁРСТ',  cost:100, matCost:2, id:'burst'},
  ];
  const _workshopNext=_workshopItems.find(i=>i.unbuilt&&!_queuedIds.has(i.id));
  let workshopHint='';
  let workshopStatus='info';
  if(_workshopNext){
    const i=_workshopNext;
    workshopHint=i.short+': '+i.cost+'КР'+(i.matCost>0?' '+i.matCost+'М':'');
    const ok=(cr>=i.cost)&&(mat>=i.matCost);
    const needsBp=(i.id==='l2'&&!inv.laserBlueprint)||(i.id==='shield'&&!inv.bubblikaContract);
    workshopStatus=needsBp?'locked':(ok?'ready':'need');
  } else {
    workshopHint='ВСЁ ГОТОВО!';workshopStatus='done';
  }
  // Показываем материалы в общем интерфейсе корабля
  if(mat>0){workshopHint+=' | МАТ: '+mat;}

  const fuelStatus=G.pl.res>=FEED_COST?'ready':'need';

  // ★ Phase 2.4: per-room worker counts для подсказок и +/- кнопок
  ensureShipWorkers(G);
  const _w=G.ship.workers;
  const rooms=[
    // ★ PR C: чистые подсказки без аббревиатур. Воркеры теперь на отдельном экране (клик по Power открывает его).
    {col:0,row:0,id:'power',name:'ЭЛЕКТРОСТАНЦИЯ',col2:P.EN,
     hint:'РАБОЧИЕ: '+G.pl.workers+'   ОТКРЫТЬ →',
     status:'info',
     action:(G)=>{G.shipUI='workers';sfxUI2();},
     notif:'РАСПРЕДЕЛЕНИЕ РАБОЧИХ ПО ОТСЕКАМ КОРАБЛЯ.'},
    {col:1,row:0,id:'fuel',name:'ТОПЛИВО',col2:P.RES,
     hint:'ОБМЕН: '+FEED_COST+' РЕСУРСА → +'+FEED_FUEL+'% ТОПЛИВА',
     status:fuelStatus,
     action:(G)=>{
       if(G.pl.res>=FEED_COST){
         G.pl.res-=FEED_COST;G.ship.fuel=Math.min(100,G.ship.fuel+FEED_FUEL);
         G.notif='+'+FEED_FUEL+'% ТОПЛИВА';G.notifT=100;G.notifCol=P.RES;
         sfxPU();setTimeout(sfxPU,80);
       }else{
         G.notif='МАЛО РЕСУРСОВ! НУЖНО '+FEED_COST;G.notifT=80;G.notifCol=P.RED;sfxHit();
       }
     },
     notif:'ЗАПРАВКА КОРАБЛЯ ТОПЛИВОМ.'},
    {col:0,row:1,id:'workshop',name:'ВЕРСТАК',col2:P.GRN,
     // ★ PR C: верстак — индикатор + клик открывает отдельный экран мастерской.
     hint:(G.ship.craftQueue&&G.ship.craftQueue.length>0
       ? 'В РАБОТЕ: '+G.ship.craftQueue[0].short+' ('+((G.ship.craftQueue[0].progress/G.ship.craftQueue[0].total*100)|0)+'%)'
       : 'ОТКРЫТЬ →'),
     status:workshopStatus,
     action:(G)=>{G.shipUI='workshop';sfxUI2();},
     notif:'СОЗДАНИЕ И ОЧЕРЕДЬ КРАФТА. ПРОГРЕСС ИДЁТ В ПОЛЁТЕ.'},
    {col:1,row:1,id:'bridge',name:'МОСТИК',col2:P.UIT,
     // ★ PR C / PR E: курс + клик открывает системную карту (если Клирр выдал)
     hint:inv.starMap
       ? 'КУРС: '+((PLANETS[G.campaignState.targetPlanet]||PLANETS.drosh).name)+'   КАРТА →'
       : 'КУРС: '+((PLANETS[G.campaignState.targetPlanet]||PLANETS.drosh).name),
     status:inv.starMap?'ready':'info',
     action:inv.starMap?(G)=>{G.shipUI='map';sfxUI2();}:null,
     notif:inv.starMap?'СИСТЕМНАЯ КАРТА — ВЫБОР МАРШРУТА.':'НАВИГАЦИЯ И КУРС КОРАБЛЯ.'},
  ];

  // Готовим список зон клика для updShip (сбрасываем каждый кадр)
  G._shipRoomHits=[];

  for(const rm of rooms){
    const rx=gridX+rm.col*(cellW+gap);
    const ry=gridY+rm.row*(cellH+gap);
    const hov=(!USE_TOUCH_UI&&mX>=rx&&mX<=rx+cellW&&mY>=ry&&mY<=ry+cellH);

    // Цвет рамки и подсветка зависят от статуса
    let frameCol='#1a3550';
    let bgTop='#0a1525';
    let bgBot='#050a18';
    if(rm.status==='ready'){frameCol=P.GRN;bgTop='#0a2818';bgBot='#051a0e';}
    else if(rm.status==='need'){frameCol='#aa8822';bgTop='#1f1808';bgBot='#100c04';}
    else if(rm.status==='locked'){frameCol='#552233';bgTop='#180a0e';bgBot='#0c0506';}
    else if(rm.status==='done'){frameCol=P.GRN;bgTop='#0a2818';bgBot='#051a0e';}

    // Внешняя рамка
    rc(rx,ry,cellW,cellH,frameCol);
    // Фон-градиент (две полосы)
    rc(rx+1,ry+1,cellW-2,cellH/2|0,bgTop);
    rc(rx+1,ry+1+(cellH/2|0),cellW-2,cellH-2-(cellH/2|0),bgBot);
    // Подсветка при наведении
    if(hov){
      cx.globalAlpha=.18;
      rc(rx+1,ry+1,cellW-2,cellH-2,rm.col2);
      cx.globalAlpha=1;
    }

    // === ЗАГОЛОВОК КОМНАТЫ ===
    rc(rx+1,ry+1,cellW-2,8,'#0a1525');
    rc(rx+1,ry+9,cellW-2,1,frameCol);
    txs(rm.name,rx+3,ry+2,rm.col2,P.BLK,1);

    // Бейдж статуса в верхнем правом углу
    if(rm.status==='ready'||rm.status==='done'){
      const blink=t%24<12;
      bx2(rx+cellW-13,ry+1,11,7,blink?P.GRN:'#003311',P.GRN,1);
      txs('OK',rx+cellW-11,ry+2,P.WHT,P.BLK,1);
    }else if(rm.status==='need'){
      bx2(rx+cellW-9,ry+1,7,7,'#332200',P.YEL,1);
      if(t%20<10)txs('$',rx+cellW-7,ry+2,P.YEL,P.BLK,1);
    }else if(rm.status==='locked'){
      cx.globalAlpha=.7;
      bx2(rx+cellW-9,ry+1,7,7,'#220000',P.RED,1);
      txs('X',rx+cellW-7,ry+2,P.RED,P.BLK,1);
      cx.globalAlpha=1;
    }

    // === ИНТЕРЬЕР КОМНАТЫ ===
    // Размеры рисуемой сцены
    const sceneX=rx+3, sceneY=ry+11, sceneW=cellW-6, sceneH=cellH-32;
    // Пол
    rc(sceneX,sceneY+sceneH-3,sceneW,3,'#080a14');
    rc(sceneX,sceneY+sceneH-3,sceneW,1,'#101a28');
    // Боковые стены (тонкие колонны)
    rc(sceneX,sceneY,1,sceneH,'#1a2f44');
    rc(sceneX+sceneW-1,sceneY,1,sceneH,'#1a2f44');

    // Уникальный интерьер каждой комнаты
    if(rm.id==='power')drwShipPowerScene(G,sceneX,sceneY,sceneW,sceneH,t);
    else if(rm.id==='fuel')drwShipFuelScene(G,sceneX,sceneY,sceneW,sceneH,t);
    else if(rm.id==='workshop')drwShipWorkshopScene(G,sceneX,sceneY,sceneW,sceneH,t,inv);
    else if(rm.id==='bridge')drwShipBridgeScene(G,sceneX,sceneY,sceneW,sceneH,t);

    // === НИЖНЯЯ ПОЛОСА — описание/действие ===
    rc(rx+1,ry+cellH-19,cellW-2,1,frameCol);
    rc(rx+1,ry+cellH-18,cellW-2,17,'#050a14');
    // Подсказка действия (короткая, влезает гарантированно)
    let hintCol=rm.col2;
    if(rm.status==='ready'||rm.status==='done')hintCol=P.GRN;
    else if(rm.status==='need')hintCol=P.YEL;
    else if(rm.status==='locked')hintCol='#aa6677';
    txs(rm.hint,rx+3,ry+cellH-15,hintCol,P.BLK,1);

    // Кнопка действия
    let btnText='';
    let btnCol=rm.col2;
    if(rm.action){
      if(rm.status==='ready')btnText='[ВЫПОЛНИТЬ]',btnCol=P.GRN;
      else if(rm.status==='need')btnText='[НЕ ХВАТАЕТ]',btnCol=P.YEL;
      else if(rm.status==='done')btnText='[ГОТОВО]',btnCol=P.GRN;
      else if(rm.status==='locked')btnText='[ЗАБЛОК.]',btnCol='#aa6677';
      else btnText='[АКТИВ.]';
    }else{
      btnText='[ИНФО]';btnCol=P.UIT;
    }
    const btnW=gw(btnText)+2;
    txs(btnText,rx+cellW-btnW-3,ry+cellH-7,btnCol,P.BLK,1);

    G._shipRoomHits.push({
      x:rx,y:ry,w:cellW,h:cellH,
      action:rm.action, col:rm.col2, notif:rm.notif
    });
    // ★ PR C: маленькие +/- убраны — распределение воркеров теперь на отдельном экране (G.shipUI='workers')
  }

  // ===== ПРАВАЯ ПАНЕЛЬ ДАННЫХ =====
  const panelX=2*(cellW+gap)+gridX+4;
  const panelY=gridY;
  const panelW=LW-panelX-2;
  const panelH=2*cellH+gap;

  // Рамка
  rc(panelX,panelY,panelW,panelH,'#1a3550');
  rc(panelX+1,panelY+1,panelW-2,panelH-2,'#0a1828');

  // === ЗАГОЛОВОК "ХАРАКТЕРИСТИКИ" ===
  rc(panelX+1,panelY+1,panelW-2,8,'#152d40');
  rc(panelX+1,panelY+9,panelW-2,1,P.UIT);
  txcAt('СТАТУС',panelX+1,panelY+2,panelW-2,P.CYA,P.BLK);

  // ===== РАЗДЕЛ "КОРАБЛЬ" =====
  let py=panelY+13;
  txs('КОРАБЛЬ',panelX+3,py,P.UIT2,P.BLK,1);py+=8;
  // ХП
  txs('ХП '+(G.pl.hp|0)+'/'+G.pl.mhp,panelX+3,py,P.HP,P.BLK,1);py+=6;
  bar(panelX+3,py,panelW-7,2,G.pl.hp/G.pl.mhp,P.HP,P.HPB);py+=4;
  // ЭН
  txs('ЭН '+(G.pl.en|0)+'/'+G.pl.men,panelX+3,py,P.EN,P.BLK,1);py+=6;
  bar(panelX+3,py,panelW-7,2,G.pl.en/G.pl.men,P.EN,'#002211');py+=4;
  // ТОПЛИВО
  txs('ТОПЛ '+(G.ship.fuel|0)+'%',panelX+3,py,P.RES,P.BLK,1);py+=6;
  bar(panelX+3,py,panelW-7,2,G.ship.fuel/100,P.RES,'#221100');py+=4;
  // Разделитель
  rc(panelX+3,py,panelW-7,1,'#1a3550');py+=3;

  // ===== РАЗДЕЛ "РЕСУРСЫ" =====
  // ★ PR C: чистые названия без сокращений
  txs('РЕСУРСЫ',panelX+3,py,P.UIT2,P.BLK,1);py+=8;
  txs('КРЕДИТЫ: '+G.pl.cr,panelX+3,py,P.YEL,P.BLK,1);py+=7;
  txs('РЕСУРСЫ: '+G.pl.res,panelX+3,py,P.RES,P.BLK,1);py+=7;
  ensureShipWorkers(G);
  txs('РАБОЧИЕ: '+G.pl.workers,panelX+3,py,P.EN,P.BLK,1);py+=7;
  const _statMat=G.campaignState.materials||0;
  if(_statMat>0){txs('МАТЕРИАЛЫ: '+_statMat,panelX+3,py,P.CYA,P.BLK,1);py+=7;}
  // Очередь крафта — только индикатор «идёт работа», детали на экране мастерской
  if(G.ship.craftQueue&&G.ship.craftQueue.length>0){
    const cq=G.ship.craftQueue[0];
    const pct=(cq.progress/cq.total*100)|0;
    txs('КРАФТ: '+pct+'%',panelX+3,py,P.CYA,P.BLK,1);py+=7;
  }
  // Разделитель
  rc(panelX+3,py,panelW-7,1,'#1a3550');py+=3;

  // ===== РАЗДЕЛ "УЛУЧШЕНИЯ" =====
  txs('УЛУЧШЕНИЯ',panelX+3,py,P.UIT2,P.BLK,1);py+=8;
  // Лазер
  const lzCol=inv.laserStrong?P.GRN:(inv.laserBlueprint?P.YEL:'#445566');
  const lzMark=inv.laserStrong?'V':(inv.laserBlueprint?'?':'-');
  txs(lzMark+' ЛАЗЕР',panelX+3,py,lzCol,P.BLK,1);py+=7;
  // Щит
  const scCol=inv.shieldBuilt?P.GRN:(inv.bubblikaContract?P.YEL:'#445566');
  const scMark=inv.shieldBuilt?'V':(inv.bubblikaContract?'?':'-');
  txs(scMark+' ЩИТ',panelX+3,py,scCol,P.BLK,1);py+=7;
  // Звёздная батарея
  const btCol=inv.starBattery?P.YEL:'#445566';
  const btMark=inv.starBattery?'*':'-';
  txs(btMark+' БАТАРЕЯ',panelX+3,py,btCol,P.BLK,1);
  if(inv.starBattery){
    cx.globalAlpha=.4+.3*Math.sin(G.shipT*.15);
    rc(panelX+3,py-1,panelW-7,7,'#332200');
    cx.globalAlpha=1;
  }

  // ★ v16 r4 (other-4): КНОПКА ВЗЛЁТА в интерфейсе корабля
  // ★ v16 r11: Полностью переделан дизайн — прямоугольная панель с рамкой, иконкой ракеты слева,
  // двумя строками текста справа. Стиль соответствует общему UI верстака.
  let canLaunch=false, launchPlanetLabel='', planetReadyKey=null;
  const ret=G.shipReturnState;
  if(ret==='planet_drosh'){canLaunch=!!G.droshDone;launchPlanetLabel='БУББЛИКА';planetReadyKey='drosh';}
  else if(ret==='planet_bubblika'){canLaunch=!!G.bubblikaDone;launchPlanetLabel='КРАСНОЗЁМ';planetReadyKey='bubblika';}
  else if(ret==='planet_krasnozem'){canLaunch=!!G.krasDone;launchPlanetLabel='ЦЕНТР';planetReadyKey='krasnozem';}
  const onPlanet=ret&&ret.indexOf('planet_')===0;
  // Размещение: располагаем над панелью статуса (весь верх — большая панель доступа к взлёту)
  // panelX, panelY, panelW заданы выше в drwShipView (это панель «СТАТУС» справа)
  const launchH=18;
  const launchY=panelY+panelH+3; // строго под панелью статуса
  if(onPlanet&&canLaunch){
    // === АКТИВНАЯ КНОПКА «ВЗЛЁТ» ===
    const pulse=0.55+0.20*Math.sin(G.shipT*0.18);
    // Внешняя двойная рамка (как у других панелей в верстаке)
    cx.fillStyle='#0a3010';
    cx.fillRect(panelX,launchY,panelW,launchH);
    cx.fillStyle='#1a5520';
    cx.fillRect(panelX+1,launchY+1,panelW-2,launchH-2);
    // Заголовочная полоса (по аналогии с заголовком панели статуса)
    cx.fillStyle='#22aa44';
    cx.fillRect(panelX+1,launchY+1,panelW-2,7);
    cx.fillStyle='#0a3010';
    cx.fillRect(panelX+1,launchY+8,panelW-2,1);
    // Заголовок «ВЗЛЁТ»
    txcAt('ВЗЛЁТ',panelX+1,launchY+2,panelW-2,'#003311',P.BLK);
    // Содержимое — иконка ракеты слева + назначение справа
    const cntY=launchY+10;
    // Маленькая ракета (анимированное пламя)
    const iconX=panelX+5,iconY=cntY+4;
    cx.fillStyle=P.GRN;
    cx.fillRect(iconX,iconY-3,3,5);  // тело
    cx.fillRect(iconX+1,iconY-4,1,1); // нос
    cx.fillRect(iconX-1,iconY+1,1,2); // левое крыло
    cx.fillRect(iconX+3,iconY+1,1,2); // правое крыло
    // Анимированное пламя
    const fl=Math.floor(G.shipT/4)%2;
    cx.fillStyle='#ff8822';cx.fillRect(iconX,iconY+2,3,fl?2:1);
    cx.fillStyle='#ffee44';cx.fillRect(iconX+1,iconY+2,1,fl?2:1);
    // Стрелка → к названию планеты
    txs('→ '+launchPlanetLabel,panelX+11,cntY,P.GRN,P.BLK,1);
    // Подсказка управления внизу (мигает)
    cx.globalAlpha=pulse;
    txs(USE_TOUCH_UI?'[ТАП]':'[L]',panelX+panelW-14,cntY,P.GRN,P.BLK,1);
    cx.globalAlpha=1;
    // Touch UI: добавляем виртуальную кнопку поверх всей плашки
    if(USE_TOUCH_UI){
      const bcx=panelX+panelW/2,bcy=launchY+launchH/2;
      const lb=getBtn('launch');
      if(!lb){
        addBtn('launch',bcx|0,bcy|0,Math.max(launchH,panelW>>1)>>1,'L',P.GRN);
        const lb2=getBtn('launch');if(lb2){lb2.hidden=false;lb2.rect=true;lb2.rectW=panelW;lb2.rectH=launchH;}
      }else{
        lb.x=bcx|0;lb.y=bcy|0;lb.hidden=false;lb.rect=true;lb.rectW=panelW;lb.rectH=launchH;
      }
    }
    // Старая легенда «V=ГОТОВО» больше не нужна — место заняла кнопка
  }else if(onPlanet){
    // === ЗАБЛОКИРОВАННЫЙ ВЗЛЁТ ===
    cx.fillStyle='#220a0a';
    cx.fillRect(panelX,launchY,panelW,launchH);
    cx.fillStyle='#330a0a';
    cx.fillRect(panelX+1,launchY+1,panelW-2,launchH-2);
    // Заголовочная полоса
    cx.fillStyle='#882222';
    cx.fillRect(panelX+1,launchY+1,panelW-2,7);
    cx.fillStyle='#220000';
    cx.fillRect(panelX+1,launchY+8,panelW-2,1);
    txcAt('ВЗЛЁТ',panelX+1,launchY+2,panelW-2,'#220000',P.BLK);
    const cntY=launchY+10;
    // Иконка замка
    const iconX=panelX+5,iconY=cntY+4;
    cx.fillStyle='#882222';
    cx.fillRect(iconX-1,iconY-3,4,1);
    cx.fillRect(iconX-1,iconY-2,1,2);
    cx.fillRect(iconX+2,iconY-2,1,2);
    cx.fillRect(iconX-2,iconY,5,4);
    cx.fillStyle='#440000';cx.fillRect(iconX,iconY+1,1,2);
    txs('ЗАКРЫТ',panelX+11,cntY,'#cc4444',P.BLK,1);
    if(USE_TOUCH_UI){const lb=getBtn('launch');if(lb)lb.hidden=true;}
  }
  // Подсказка-легенда внизу панели статуса (если есть место)
  const legY=panelY+panelH-13;
  if(!onPlanet){
    rc(panelX+1,legY-1,panelW-2,1,'#1a3550');
    txs('V=ГОТОВО  ?=ЕСТЬ',panelX+3,legY,P.UIT3,P.BLK,1);
    txs('-=НЕ НАЙДЕНО',panelX+3,legY+6,P.UIT3,P.BLK,1);
  }

  // Уведомление
  if(G.notifT>0&&G.notif){
    const a=Math.min(1,G.notifT/15);cx.globalAlpha=a;
    bx2(8,LH-12,LW-16,10,'#0a1828',G.notifCol,1);
    txc(G.notif,LH-11,G.notifCol,1);
    cx.globalAlpha=1;
  }

  drwPauseIcon();
  drwActionBtns();drwFTX();
  if(G.paused)drwPauseOverlay(G);
  drwTutorial(G);
  drawTrans();
}

// === ИНТЕРЬЕРНЫЕ СЦЕНЫ ОТСЕКОВ ===

function drwShipPowerScene(G,x,y,w,h,t){
  // Тренажёрный зал. Вид сбоку, бегуны бегут "вправо" по горизонтальной ленте.
  // Поэтому всю сцену видно как профиль: поручни — передняя/задняя пара стоек,
  // лента — горизонтальная, бегун — в профиль.
  const workers=Math.max(1,Math.min(3,G.pl.workers));
  // Задняя стена с панелями (тёмная)
  rc(x+1,y,w-2,h-3,'#0a1825');
  // Окна-индикаторы наверху (показывают активность)
  for(let i=0;i<4;i++){
    const wx=x+4+i*((w-12)/4|0);
    rc(wx,y+1,((w-12)/4|0)-1,2,'#001a2a');
    if((t+i*7)%24<14)rc(wx+1,y+2,((w-12)/4|0)-3,1,P.EN);
  }

  // === БЕГОВЫЕ ДОРОЖКИ ===
  // Каждая дорожка — компактный модуль: короткая лента + поручень + бегун.
  // Длина дорожки = ширина бегуна + место для рук впереди и сзади.
  const trackW=Math.min(18,((w-6)/workers|0)-2);
  const trackH=18;
  const totalW=workers*trackW+(workers-1)*3;
  const startX=x+(w-totalW)/2|0;
  const trackY=y+5;

  for(let i=0;i<workers;i++){
    const tx=startX+i*(trackW+3);
    const ty=trackY;

    // === ОСНОВАНИЕ ===
    rc(tx,ty+trackH-4,trackW,4,'#222a33');
    rc(tx,ty+trackH-4,trackW,1,'#3a4654');
    rc(tx,ty+trackH-1,trackW,1,'#0a0e14');
    // Ножки
    rc(tx+1,ty+trackH,2,1,'#1a1a1a');
    rc(tx+trackW-3,ty+trackH,2,1,'#1a1a1a');

    // === ПОЛОТНО — горизонтальная лента ===
    const beltY=ty+trackH-7;
    rc(tx+1,beltY,trackW-2,3,'#15191e');
    rc(tx+1,beltY,trackW-2,1,'#252b34');  // верхняя кромка
    rc(tx+1,beltY+2,trackW-2,1,'#0a0e14'); // нижняя
    // Бегущие штрихи на ленте (вправо)
    const offset=Math.floor(t*0.7+i*5)%5;
    for(let s=0;s<((trackW-2)/5|0)+1;s++){
      const sx=tx+1+((s*5+offset)%(trackW-2));
      if(sx<tx+trackW-1)rc(sx,beltY+1,1,1,'#4a5a6a');
    }

    // === ПЕРЕДНИЙ ПОРУЧЕНЬ (горизонтальный, перед бегуном) ===
    // Стойка спереди (прямо у носа) и стойка сзади (за спиной), соединённые штангой
    const railY=ty+1;
    const railH=beltY-railY-2;
    rc(tx+2,railY,1,railH,'#556677');               // задняя стойка (за спиной бегуна)
    rc(tx+trackW-3,railY,1,railH,'#556677');        // передняя стойка (перед бегуном)
    rc(tx+2,railY,trackW-4,1,'#778899');             // верхняя штанга
    // Маленькая ручка-перекладина впереди (бегун держится)
    rc(tx+trackW-7,railY+3,4,1,'#667788');
    rc(tx+trackW-7,railY+4,4,1,'#445566');

    // === ПАНЕЛЬ УПРАВЛЕНИЯ (на передней стойке) ===
    rc(tx+trackW-4,railY+1,3,3,'#001833');
    if((t+i*5)%18<10)rc(tx+trackW-3,railY+2,1,1,P.EN); // мигающий огонёк

    // === БЕГУН (в профиль, лицом ВПРАВО) ===
    const runT=Math.floor(t/4)+i*3;
    const legPhase=runT%2;
    // Подскок при беге
    const bob=Math.sin(t*0.4+i*2)*0.6|0;
    // Бегун стоит в центре дорожки
    const wx=tx+trackW/2-1|0;   // центр по X
    const wy=beltY-1+bob;       // макушка над лентой

    // Тело — наклонено вперёд (как у настоящих бегунов)
    rc(wx,wy-2,2,3,'#5588cc');
    rc(wx,wy-2,2,1,'#7799dd');  // верхняя часть жилета
    // Голова — в профиль, видим висок (с одним глазом)
    rc(wx,wy-5,2,3,'#aaccee');
    rc(wx,wy-5,1,1,'#88bbdd');   // тень волос (затылок)
    rc(wx+1,wy-4,1,1,'#1a3380'); // глаз (один — мы видим в профиль)
    // Нос — выступает вперёд (вправо)
    rc(wx+2,wy-4,1,1,'#aaccee');

    // Руки — синхронны с ногами но в противофазе
    if(legPhase===0){
      // Левая рука вперёд, правая назад (мы видим обе в профиль как наложение)
      rc(wx-1,wy-1,1,2,'#5588cc');     // задняя рука
      rc(wx+2,wy-1,1,2,'#5588cc');     // передняя рука вытянута вперёд
    }else{
      rc(wx-1,wy,1,2,'#5588cc');       // задняя рука внизу
      rc(wx+2,wy-2,1,2,'#5588cc');     // передняя рука согнута выше
    }

    // Ноги — анимация шагов в профиль
    if(legPhase===0){
      // Передняя нога вытянута вперёд, задняя согнута сзади
      rc(wx+1,wy+1,1,2,'#1a3380');     // передняя нога
      rc(wx+1,wy+3,1,1,'#221122');     // ботинок впереди
      rc(wx-1,wy+1,1,1,'#1a3380');     // задняя нога согнута
      rc(wx-1,wy+2,1,1,'#221122');     // задний ботинок
    }else{
      // Передняя нога согнута, задняя вытянута
      rc(wx,wy+1,1,2,'#1a3380');
      rc(wx,wy+3,1,1,'#221122');
      rc(wx+2,wy+1,1,1,'#1a3380');
      rc(wx+2,wy+2,1,1,'#221122');
    }

    // Капля пота (летит назад при беге)
    if((t+i*7)%32<3){
      rc(wx-2,wy-3,1,1,'#aaeeff');
      rc(wx-3,wy-2,1,1,'#88ccee');
    }
  }

  // Энергопровод: от дорожек идёт энергия вправо к индикатору
  if(t%6<3){
    const sparkY=y+h-7;
    const sparkX=x+w-6-((t%6)*1)|0;
    rc(sparkX,sparkY,1,1,P.EN);
  }
  // Индикатор энергопотока
  rc(x+w-5,y+5,3,4,'#001a0a');
  rc(x+w-4,y+6,1,Math.max(1,(t%18)/6|0),P.EN);
}

function drwShipFuelScene(G,x,y,w,h,t){
  // Большой бак, индикатор, насос
  // Задняя стена
  rc(x+1,y,w-2,h-3,'#0e1a0a');
  // Огромный топливный бак в центре
  const tankW=Math.min(40,w-20),tankH=h-8;
  const tankX=x+(w-tankW)/2|0,tankY=y+2;
  rc(tankX,tankY,tankW,tankH,'#1a2a14');
  rc(tankX+1,tankY+1,tankW-2,tankH-2,'#283820');
  // Уровень топлива
  const fuelPct=G.ship.fuel/100;
  const fuelH=Math.max(1,((tankH-4)*fuelPct)|0);
  const fuelY=tankY+tankH-2-fuelH;
  // Заливка с волнами
  for(let r=0;r<fuelH;r++){
    const wave=Math.sin(t*0.15+r*0.3)*0.5;
    rc(tankX+2,fuelY+r,tankW-4,1,r<3?'#aaff66':P.RES);
    if(r===0){rc(tankX+2+wave,fuelY,tankW-4,1,'#ffff88');}
  }
  // Шкала на боку
  for(let i=0;i<5;i++){
    const my=tankY+1+i*((tankH-2)/5);
    rc(tankX-2,my|0,2,1,'#446644');
  }
  // Трубы сверху
  rc(tankX+tankW/2-1,y,2,3,'#445544');
  rc(x+w-6,y,2,h/2|0,'#445544');
  rc(x+w-7,y+h/2|0,3,1,'#445544');
  // Пузырьки в топливе
  if(t%8===0&&fuelPct>0.1){
    const bx=tankX+2+Math.random()*(tankW-4);
    PTS.push({x:bx,y:fuelY+fuelH-1,vx:0,vy:-0.4,lf:20,ml:24,col:'#aaff66',sz:1,gv:0,fade:.7});
  }
  // Цифры процентов
  const pct=Math.round(G.ship.fuel)+'%';
  const pw=gw(pct);
  txs(pct,tankX+(tankW-pw)/2|0,tankY+tankH/2|0-2,'#ddffaa',P.BLK,1);
}

function drwShipWorkshopScene(G,x,y,w,h,t,inv){
  // Стол с инструментами и чертежами
  rc(x+1,y,w-2,h-3,'#1a1408');
  // Чертежи на стене сзади
  // Чертёж лазера слева
  rc(x+3,y+2,w/2-6|0,h/2-2|0,inv.laserBlueprint?'#001a44':'#0a0a0a');
  if(inv.laserBlueprint){
    rc(x+3,y+2,w/2-6|0,1,'#0033aa');
    cx.fillStyle=inv.laserStrong?'#33ff66':'#3388ff';
    cx.fillRect(x+5,y+5,w/4|0,1);
    cx.fillRect(x+5,y+7,(w/4|0)-2,1);
    if(inv.laserStrong){
      const lzW=gw('OK');
      txs('OK',x+(w/4-lzW/2)|0,y+4,'#33ff66',P.BLK,1);
    }
  }else{
    txs('?',x+w/4|0,y+5,'#221122',1);
  }
  // Чертёж щита справа
  const rx2=x+w/2|0;
  rc(rx2,y+2,w/2-3|0,h/2-2|0,inv.bubblikaContract?'#003322':'#0a0a0a');
  if(inv.bubblikaContract){
    rc(rx2,y+2,w/2-3|0,1,'#005544');
    cx.fillStyle=inv.shieldBuilt?'#33ff66':'#88ccff';
    cx.fillRect(rx2+2,y+5,w/3|0,1);
    cx.fillRect(rx2+2,y+7,(w/3|0)-2,1);
    if(inv.shieldBuilt){
      txs('OK',rx2+w/4|0,y+4,'#33ff66',P.BLK,1);
    }
  }else{
    txs('?',rx2+w/4|0,y+5,'#221122',1);
  }
  // Стол
  const tableY=y+h/2+1|0;
  rc(x+1,tableY,w-2,3,'#3a2a0a');
  rc(x+1,tableY,w-2,1,'#5a4a2a');
  rc(x+1,tableY+3,w-2,1,'#1a0a05');
  // Инструменты на столе
  // Молоток
  const hammerY=tableY-1+(t%20<10?0:1);
  rc(x+5,hammerY-1,3,2,'#cc9944');
  rc(x+5,hammerY,1,3,'#553311');
  // Гаечный ключ
  rc(x+12,tableY-3,1,4,'#888899');
  rc(x+11,tableY-3,3,1,'#aaaabb');
  // Паяльник с искрами
  const solderX=x+w-12;
  rc(solderX,tableY-4,1,4,'#445566');
  rc(solderX,tableY-4,1,1,'#ff8800');
  if(t%4<2)rc(solderX-1,tableY-5,1,1,'#ffff44');
  // Деталь, которая собирается
  const canBuildLaser=inv.laserBlueprint&&!inv.laserStrong&&G.pl.cr>=90;
  const canBuildShield=inv.bubblikaContract&&!inv.shieldBuilt&&G.pl.cr>=60;
  if(canBuildLaser){
    cx.globalAlpha=.7+.3*Math.sin(t*.15);
    rc(x+w/2-2,tableY-1,5,1,P.L3);
    rc(x+w/2-1,tableY-2,3,1,P.L3L);
    cx.globalAlpha=1;
    if(t%6<3)rc(x+w/2+3,tableY-2,1,1,'#ffffff');
  }else if(canBuildShield){
    cx.globalAlpha=.6+.4*Math.sin(t*.15);
    ring(x+w/2,tableY-1,2,P.CYA,1);
    cx.globalAlpha=1;
  }
}

function drwShipBridgeScene(G,x,y,w,h,t){
  // === ЭКРАН-КАРТА СОЛНЕЧНОЙ СИСТЕМЫ ===
  // Показывает 4 объекта в ряд (Дрош, Бубблика, Краснозём, Тина)
  // Стрелка указывает где находится игрок прямо сейчас.
  rc(x+1,y,w-2,h-3,'#0a0814');

  // Заголовок монитора
  rc(x+1,y+1,w-2,7,'#102030');
  rc(x+1,y+8,w-2,1,'#1a3550');
  txs('СОЛ.СИСТЕМА',x+3,y+2,P.CYA,P.BLK,1);

  // === ЗОНА ОТРИСОВКИ КАРТЫ ===
  const mapY=y+10;
  const mapH=h-13;

  // Линия орбиты
  cx.strokeStyle='#1a3550';cx.lineWidth=1;
  cx.beginPath();
  cx.moveTo(x+4,mapY+mapH/2|0);
  cx.lineTo(x+w-4,mapY+mapH/2|0);
  cx.stroke();

  // === ОБЪЕКТЫ В РЯД ===
  // Порядок: Дрош (внешняя орбита, первая планета), Бубблика, Краснозём, Тина
  const objects=[
    {id:'drosh',name:'ДР',col:P.PL1,sz:3},
    {id:'bubblika',name:'БУ',col:P.BUB1,sz:3},
    {id:'krasnozem',name:'КР',col:P.KRZ3,sz:4},
    {id:'tina',name:'ТИНА',col:'#ff4422',sz:5,isTina:true},
  ];

  const slotW=(w-8)/objects.length;
  // Определяем где сейчас игрок — по shipReturnState (чтобы и на корабле работало)
  // Для целевой планеты используем targetPlanet.
  let currentId=G.shipReturnState||G.state||'planet_drosh';
  // Нормализация: planet_drosh → drosh, finale_tina → tina
  if(currentId==='planet_drosh')currentId='drosh';
  else if(currentId==='planet_bubblika')currentId='bubblika';
  else if(currentId==='planet_krasnozem')currentId='krasnozem';
  else if(currentId==='finale_tina')currentId='tina';
  else currentId=G.campaignState&&G.campaignState.targetPlanet||'drosh';

  for(let i=0;i<objects.length;i++){
    const obj=objects[i];
    const cx_=(x+4+slotW*(i+0.5))|0;
    const cy_=mapY+mapH/2|0;
    // Пунктирное соединение между объектами
    if(i<objects.length-1){
      const nx=(x+4+slotW*(i+1.5))|0;
      cx.fillStyle='#2a4560';
      for(let dx=cx_+obj.sz+2;dx<nx-objects[i+1].sz-2;dx+=2){
        cx.fillRect(dx,cy_,1,1);
      }
    }
    // Сама планета/Тина
    if(obj.isTina){
      // Тина — красный шар с тёмным контуром
      disc(cx_,cy_,obj.sz,'#220011');
      disc(cx_,cy_,obj.sz-1,obj.col);
      // Лучи
      cx.fillStyle='#ff8844';
      cx.fillRect(cx_-obj.sz-2,cy_,2,1);
      cx.fillRect(cx_+obj.sz+1,cy_,2,1);
    }else{
      disc(cx_,cy_,obj.sz,obj.col);
      // Лёгкий блик
      rc(cx_-1,cy_-2,1,1,P.WHT);
    }
    // Подпись (под объектом)
    const nw=gw(obj.name);
    txs(obj.name,(cx_-nw/2)|0,cy_+obj.sz+3,P.UIT2,P.BLK,1);

    // Если это текущая позиция игрока — стрелка сверху + подсветка
    if(obj.id===currentId){
      // Кольцо вокруг
      cx.globalAlpha=.5+.4*Math.sin(t*.18);
      ring(cx_,cy_,obj.sz+2,P.YEL,1);
      cx.globalAlpha=1;
      // Стрелка вниз (анимированная) — указывает на текущую позицию
      const aBob=Math.sin(t*.15)*1|0;
      const ax=cx_,ay=cy_-obj.sz-6-aBob;
      cx.fillStyle=P.YEL;
      cx.fillRect(ax-1,ay,2,3);
      cx.fillRect(ax-2,ay+2,1,1);cx.fillRect(ax+1,ay+2,1,1);
      cx.fillRect(ax-3,ay+1,1,1);cx.fillRect(ax+2,ay+1,1,1);
    }
  }

  // Сноска внизу
  if(t%60<30){
    txs('NAV.SYS OK',x+3,y+h-7,P.GRN,P.BLK,1);
  }
}

// Хелпер для центрированного текста в боксе
function txcAt(s,x,y,w,col,sh){
  const sw=gw(s);
  const sx=x+((w-sw)/2|0);
  txs(s,sx,y,col,sh,1);
}
// ======= ДИАЛОГ ТИНЫ =======
function tinaDialog(){
  return{type:'graph',start:'scan',speaker:'ТИНА',nodes:{
    scan:{text:['ТИНА - ЯДРО СФЕРЫ ДАЙСОНА:','НАРУШИТЕЛЬ.','ИДЕНТИФИКАЦИЯ: ПИЛОТ. БЕЗ ПОЛНОМОЧИЙ.','ОТКУДА?'],goto:'from'},
    from:{text:['ТИНА:','ДРОШ. БУББЛИКА. КРАСНОЗЁМ.','ТРИ ПЛАНЕТЫ. ТЫ НАСТОЙЧИВЫЙ.','ЭТО РЕДКОСТЬ. ОБЫЧНО РАЗВОРАЧИВАЮТСЯ НА БУББЛИКЕ.'],goto:'purpose'},
    purpose:{text:['ТИНА:','ЗВЁЗДНАЯ БАТАРЕЯ. ЗНАЧИТ - МРАУ ПОМОГ.','ХОЧЕШЬ ОСВОБОДИТЬ ЗВЕЗДУ.','ЭТО НЕВОЗМОЖНО БЕЗ БОЯ.','НАЧНЁМ.'],end:true,effect:(G)=>{
      G.notif='ТИНА АКТИВИРОВАЛА ЗАЩИТУ. БОЙ НАЧАЛСЯ!';G.notifT=170;G.notifCol=P.TINA3;
      closeDlg(G);setTimeout(()=>startTinaBattle(G),700);
    }},
  }};
}

// ======= БОЙ С ТИНОЙ — 3 ФАЗЫ =======
function startTinaBattle(G){
  G.finale.battleActive=true;
  // ★ v16: Переход в боевую кинематик-фазу — камера держит широкий зум
  if(G.finale.cinematic){G.finale.cinematic.phase='battle';G.finale.cinematic.t=0;}
  // ★ v16 r3: Тина в центре нового большого мира (для 3x масштаба)
  G.finale.tina={
    x:G.finale.hx,y:G.finale.hy,
    hp:750,mhp:750,
    phase:1,
    subphase:'1',  // ★ Phase 2.3: '1' | '1.5' | '2' | '2.5' | '3' | '3.5' | '4'
    t:0,defeated:false,
    shootCD:100,
    reflectFlash:0,
    energyBlocks:[
      {orbitA:0,orbitR:234,hp:30,mhp:30,maxHp:30,alive:true,flash:0,t:0,x:0,y:0},
      {orbitA:Math.PI*2/3,orbitR:234,hp:30,mhp:30,maxHp:30,alive:true,flash:0,t:0,x:0,y:0},
      {orbitA:Math.PI*4/3,orbitR:234,hp:30,mhp:30,maxHp:30,alive:true,flash:0,t:0,x:0,y:0},
    ],
    turrets:[],
    weakSpots:[],
    emergencyProtocol:null,
    drones:[],
    droneCD:0,
    attackPattern:0,
    chargingSweep:null,
    chargeDrones:[],
    sweepBeam:null,
    phase4entered:false,
    // ★ Phase 2.3: чекпоинт-точки между фазами (см. 02-checkpoint.js)
    _subphaseTriggered:{},
  };
  G.notif='ФАЗА 1: СЛОМАЙ 3 ЭНЕРГОБЛОКА!';G.notifT=200;G.notifCol=P.CYA;
  // ★ v16: Брифинг пришельца — подсказка по фазе 1
  G.briefing={t:0,planet:'tina_phase1'};
  // ★ Эпичный «дроп» при появлении Тины
  shake(10);flash(.6,P.TINA2);sfxBoss();hitStopAdd(4);
  TAP_FIRE=true;
  // ★ Bugfix #6: гарантируем работающий джойстик в бою (initFinaleTina ранее отключил его для катсцены)
  setJoyEnabled(true);
}

function spawnTinaTurrets(T){
  T.turrets=[];
  for(let i=0;i<4;i++){
    const a=i/4*Math.PI*2;
    T.turrets.push({
      orbitA:a,orbitR:216,    // ★ v16 r3: 72*3
      x:0,y:0,t:0,
      hp:10,mhp:10,maxHp:10,alive:true,
      shootCD:60+Math.random()*60,
      flash:0,
    });
  }
}

// ★ Phase 2.3: spawnTinaWeakSpots теперь принимает count (1, 2 или 3) для плавного градиента сложности.
//   Фаза 3 = 1 брешь, фаза 3.5 = 2 бреши, фаза 4 = 3 бреши + rage.
function spawnTinaWeakSpots(T,count){
  count=count||1;
  T.weakSpots=[];
  // Изначальная скорость вращения для фазы 3 — медленная (0.005). Ускоряется в 3.5/4.
  const initSpd=0.005;
  for(let i=0;i<count;i++){
    const a=i/count*Math.PI*2;
    T.weakSpots.push({
      orbitA:a,                    // центральный угол бреши
      arcWidth:0.18,               // дуга бреши (~10 градусов)
      orbitR:TINA_R+18,            // радиус щита (для отрисовки бреши)
      orbitSpd:initSpd,            // ★ Phase 2.3: медленнее в фазе 3 (0.005), ускоряется в 3.5/4
      t:0,
      x:0,y:0,
      facing:false,
    });
  }
}

// ★ Phase 2.3: восстановление боя с Тиной с указанной фазы (для чекпоинтов finale_phase_N).
//   Используется в gameover-перезапуске вместо initFinaleTina+startTinaBattle с нуля.
// ★ Phase 2.4: завершение крафта — устанавливает inventory-флаг и показывает награду.
//   Вызывается из updSpace когда item.progress >= item.total.
function _completeCraft(G,item){
  const inv=G.campaignState.inventory;
  const rewards=[];
  let glowCol=P.GRN;
  switch(item.id){
    case 'l2':
      inv.laserStrong=true;
      rewards.push({label:'ЛАЗЕР L2 АКТИВЕН',col:P.L3});
      glowCol=P.L3; break;
    case 'shield':
      inv.shieldBuilt=true;
      G.pl.mhp+=40;G.pl.hp=Math.min(G.pl.mhp,G.pl.hp+40);
      rewards.push({label:'ЭНЕРГОЩИТ АКТИВЕН',col:P.CYA});
      rewards.push({label:'+40 МАКС. ХП',col:P.HP});
      glowCol=P.CYA; break;
    case 'spread':
      inv.spreadUnlocked=true;
      rewards.push({label:'СПРЕД — ВЕЕР ИЗ 3 ПУЛЬ',col:P.L1L});
      glowCol=P.L1; break;
    case 'missile':
      inv.missileUnlocked=true;
      rewards.push({label:'РАКЕТА — САМОНАВЕДЕНИЕ',col:P.ORA});
      glowCol=P.ORA; break;
    case 'beam':
      inv.beamUnlocked=true;
      rewards.push({label:'ЛУЧ — НЕПРЕРЫВНЫЙ',col:P.L2});
      glowCol=P.L2; break;
    case 'burst':
      inv.burstUnlocked=true;
      rewards.push({label:'БЁРСТ — ОЧЕРЕДЬ 5 ПУЛЬ',col:P.YEL});
      glowCol=P.YEL; break;
  }
  showQuestReward(G,'КРАФТ ЗАВЕРШЁН',rewards,glowCol);
  sfxPU();setTimeout(sfxUI2,80);setTimeout(sfxPU,160);
  flash(.4,glowCol);
  spPts(G.pl.x,G.pl.y,18,[glowCol,P.WHT,P.YEL],.6,3,22,.02,1.8);
  addShockwave(G.pl.x,G.pl.y,24,glowCol,16);shake(2);
  // ★ Phase 5.3: достижение "Арсенал" — L1+L2+Spread+Missile+Beam одновременно
  if(inv.laserStrong&&inv.spreadUnlocked&&inv.missileUnlocked&&inv.beamUnlocked){
    unlockAchievement(G,'arsenal');
  }
}

function restoreFinalePhase(G,targetPhase,targetHp){
  initFinaleTina(G);
  const F=G.finale;
  // Пропускаем кинематик-катсцену — сразу в бой
  F.cinematic.phase='battle';
  F.cinematic.t=0;
  F.cinematic.started=false;
  startTinaBattle(G);
  const T=F.tina;
  // Перенастраиваем Тину под нужную фазу
  T.phase=targetPhase;
  T.hp=Math.max(1,targetHp||T.mhp*0.7);
  if(targetPhase===2){
    T.subphase='2';
    for(const eb of T.energyBlocks)eb.alive=false;
    spawnTinaTurrets(T);
    T.droneCD=99999;
    G.briefing={t:0,planet:'tina_phase2'};
  } else if(targetPhase===3){
    T.subphase='3';
    for(const eb of T.energyBlocks)eb.alive=false;
    T.turrets=[];
    spawnTinaWeakSpots(T,1);
    G.briefing={t:0,planet:'tina_phase3'};
  } else if(targetPhase===4){
    T.subphase='4';
    T.phase4entered=true;
    for(const eb of T.energyBlocks)eb.alive=false;
    T.turrets=[];
    spawnTinaWeakSpots(T,3);
    // ★ Bugfix #5: фаза ярости — расширенные бреши (0.26 рад) для видимости
    for(const ws of T.weakSpots){ws.orbitSpd=0.013;ws.arcWidth=0.26;}
    T.droneCD=80;
    T.shootCD=40;
    G.briefing={t:0,planet:'tina_phase4'};
  }
  G.notif='ВОЗВРАТ В ФАЗУ '+targetPhase;G.notifT=120;G.notifCol=P.CYA;
  // ★ Bugfix #11: пересохраняем чекпоинт под текущую фазу, иначе следующая смерть
  //   уйдёт в чекпоинт 'tina' (созданный initFinaleTina) — и игрок начнёт с фазы 1.
  saveCheckpoint(G,'finale_phase_'+targetPhase);
}

// ★ Phase 2.3: добавляет одну дополнительную брешь к существующим (для переходов 3→3.5, 3.5→4).
//   Распределяет углы равномерно с учётом существующих.
function addTinaWeakSpot(T){
  const n=T.weakSpots.length;
  if(n>=3)return;
  // Берём текущую среднюю скорость, чтобы новая брешь не «выпала» из ритма
  const spd=n>0?T.weakSpots[0].orbitSpd:0.005;
  const a=(T.weakSpots[n-1]?T.weakSpots[n-1].orbitA:0)+Math.PI*2/(n+1);
  T.weakSpots.push({
    orbitA:a,
    arcWidth:0.18,
    orbitR:TINA_R+18,
    orbitSpd:spd,
    t:0,
    x:0,y:0,
    facing:false,
  });
}


// ============================================================
// ★ PR C: ОТДЕЛЬНЫЕ ЭКРАНЫ КОРАБЛЯ (мастерская + распределение рабочих)
// ============================================================

// Список всех крафтовых предметов с актуальными ценами (синхронизирован с balance pass)
function _workshopItems(G){
  const inv=G.campaignState.inventory;
  return [
    {id:'l2',     label:'ЛАЗЕР L2', cost:90,  matCost:0, total:480,
      have:inv.laserStrong, lock:!inv.laserBlueprint, lockHint:'НУЖЕН ЧЕРТЁЖ (ДРОШ)'},
    {id:'shield', label:'ЭНЕРГОЩИТ', cost:60, matCost:0, total:360,
      have:inv.shieldBuilt, lock:!inv.bubblikaContract, lockHint:'НУЖЕН ЧЕРТЁЖ (БУББЛИКА)'},
    {id:'spread', label:'СПРЕД',   cost:30, matCost:0, total:300, have:inv.spreadUnlocked},
    {id:'missile',label:'РАКЕТА',  cost:50, matCost:1, total:600, have:inv.missileUnlocked},
    {id:'beam',   label:'ЛУЧ',     cost:80, matCost:1, total:840, have:inv.beamUnlocked},
    {id:'burst',  label:'БЁРСТ',   cost:100,matCost:2, total:960, have:inv.burstUnlocked},
  ];
}

// Поставить конкретный предмет в очередь крафта (используется кнопкой на экране мастерской)
function _queueWeapon(G,itemId){
  ensureShipWorkers(G);
  const inv=G.campaignState.inventory;
  const item=_workshopItems(G).find(i=>i.id===itemId);
  if(!item)return;
  if(item.have){G.notif='УЖЕ ПОСТРОЕНО';G.notifT=80;G.notifCol=P.YEL;sfxHit();return;}
  if(item.lock){G.notif=item.lockHint;G.notifT=90;G.notifCol=P.YEL;sfxHit();return;}
  if((G.ship.craftQueue||[]).some(c=>c.id===itemId)){G.notif='УЖЕ В ОЧЕРЕДИ';G.notifT=80;G.notifCol=P.YEL;sfxHit();return;}
  const haveCR=G.pl.cr, haveMat=G.campaignState.materials||0;
  if(haveCR<item.cost){G.notif='МАЛО КРЕДИТОВ ('+item.cost+')';G.notifT=90;G.notifCol=P.RED;sfxHit();return;}
  if(haveMat<item.matCost){G.notif='МАЛО МАТЕРИАЛОВ ('+item.matCost+')';G.notifT=90;G.notifCol=P.RED;sfxHit();return;}
  G.pl.cr-=item.cost;
  G.campaignState.materials=haveMat-item.matCost;
  G.ship.craftQueue.push({id:item.id,short:item.label,progress:0,total:item.total});
  G.notif=item.label+' В ОЧЕРЕДИ';G.notifT=120;G.notifCol=P.CYA;
  sfxUI2();sfxPU();flash(.2,P.CYA);spPts(LW/2,LH/2,12,[P.CYA,P.WHT],.4,2,14);
}

// ============================================================
// ЭКРАН МАСТЕРСКОЙ
// ============================================================
// ★ PR D: Постоянные апгрейды корабля (sink для накопленных КР/РЕС в конце игры).
//   Каждый апгрейд имеет несколько уровней с растущей ценой. Эффект применяется при покупке.
function _upgradeItems(G){
  const u=(G.campaignState.upgrades||{hp:0,en:0,workers:0});
  // Каждый элемент = ОДИН следующий уровень (если есть). costs/effects индексируются от 0.
  const hpDefs   =[{cr:60, res:4, eff:'+20 МАКСИМАЛЬНОГО ХП'},
                   {cr:100,res:6, eff:'+20 МАКСИМАЛЬНОГО ХП'},
                   {cr:150,res:10,eff:'+20 МАКСИМАЛЬНОГО ХП'}];
  const enDefs   =[{cr:50, res:3, eff:'+25 МАКСИМАЛЬНОЙ ЭНЕРГИИ'},
                   {cr:90, res:5, eff:'+25 МАКСИМАЛЬНОЙ ЭНЕРГИИ'},
                   {cr:140,res:8, eff:'+25 МАКСИМАЛЬНОЙ ЭНЕРГИИ'}];
  const workerDefs=[{cr:100,res:8, eff:'+1 РАБОЧИЙ'},
                    {cr:200,res:15,eff:'+1 РАБОЧИЙ'}];
  const out=[];
  if(u.hp<hpDefs.length){
    const d=hpDefs[u.hp];
    out.push({id:'hp',label:'УЛУЧШЕНИЕ КОРПУСА',lvl:u.hp+1,maxLvl:hpDefs.length,cost:d.cr,res:d.res,effect:d.eff,col:P.HP});
  }
  if(u.en<enDefs.length){
    const d=enDefs[u.en];
    out.push({id:'en',label:'ЭНЕРГОБЛОК',lvl:u.en+1,maxLvl:enDefs.length,cost:d.cr,res:d.res,effect:d.eff,col:P.EN});
  }
  if(u.workers<workerDefs.length){
    const d=workerDefs[u.workers];
    out.push({id:'workers',label:'НАЁМ РАБОЧЕГО',lvl:u.workers+1,maxLvl:workerDefs.length,cost:d.cr,res:d.res,effect:d.eff,col:P.CYA});
  }
  return out;
}

function _buyUpgrade(G,upgradeId){
  const item=_upgradeItems(G).find(i=>i.id===upgradeId);
  if(!item){G.notif='УЖЕ МАКСИМАЛЬНЫЙ УРОВЕНЬ';G.notifT=80;G.notifCol=P.YEL;sfxHit();return;}
  if(G.pl.cr<item.cost){G.notif='МАЛО КРЕДИТОВ ('+item.cost+')';G.notifT=90;G.notifCol=P.RED;sfxHit();return;}
  if(G.pl.res<item.res){G.notif='МАЛО РЕСУРСОВ ('+item.res+')';G.notifT=90;G.notifCol=P.RED;sfxHit();return;}
  // Списываем
  G.pl.cr-=item.cost;
  G.pl.res-=item.res;
  if(!G.campaignState.upgrades)G.campaignState.upgrades={hp:0,en:0,workers:0};
  // Применяем эффект
  if(upgradeId==='hp'){
    G.pl.mhp+=20;
    G.pl.hp=Math.min(G.pl.mhp,G.pl.hp+20);
    G.campaignState.upgrades.hp++;
  } else if(upgradeId==='en'){
    G.pl.men+=25;
    G.pl.en=Math.min(G.pl.men,G.pl.en+25);
    G.campaignState.upgrades.en++;
  } else if(upgradeId==='workers'){
    G.pl.workers++;
    ensureShipWorkers(G);G.ship.workers.power++;
    G.campaignState.upgrades.workers++;
  }
  G.notif=item.label+' КУПЛЕНО!';G.notifT=130;G.notifCol=item.col;
  sfxPU();setTimeout(sfxPU,80);
  flash(.25,item.col);
  spPts(LW/2,LH/2,16,[item.col,P.WHT,P.YEL],.5,2.5,18);
}

function updShipWorkshop(G){
  // Tab/back обрабатывается в updShip (возврат на main)
  if(mC){
    const hits=G._shipSubHits||[];
    for(const h of hits){
      if(mX>=h.x&&mX<=h.x+h.w&&mY>=h.y&&mY<=h.y+h.h){
        if(h.itemId)_queueWeapon(G,h.itemId);
        else if(h.upgradeId)_buyUpgrade(G,h.upgradeId);
        mC=false;break;
      }
    }
  }
}

function drwShipWorkshop(G){
  ensureShipWorkers(G);
  const t=G.shipT;
  rc(0,0,LW,LH,'#03060d');
  // Тонкая фоновая решётка
  for(let y=0;y<LH;y+=8){cx.globalAlpha=0.05;rc(0,y,LW,1,P.UIT);}
  cx.globalAlpha=1;
  // ===== ВЕРХНИЙ ЗАГОЛОВОК =====
  rc(0,0,LW,16,'#0a1828');
  rc(0,15,LW,1,P.GRN);
  // Кнопка назад (использует существующую addBtn 'back', клик уже в updShip)
  txs('< НАЗАД',24,5,P.UIT2,P.BLK,1);
  txcs('МАСТЕРСКАЯ',5,P.GRN,P.BLK,1);
  // Ресурсы справа
  const resTxt='КРЕДИТЫ: '+G.pl.cr+'  МАТЕРИАЛЫ: '+(G.campaignState.materials||0);
  txs(resTxt,LW-gw(resTxt)-3,5,P.YEL,P.BLK,1);

  // ===== ОЧЕРЕДЬ =====
  let py=20;
  if(G.ship.craftQueue&&G.ship.craftQueue.length>0){
    txs('В РАБОТЕ:',6,py,P.CYA,P.BLK,1);py+=8;
    const cq=G.ship.craftQueue[0];
    const pct=(cq.progress/cq.total*100)|0;
    txs(cq.short,12,py,P.WHT,P.BLK,1);
    txs(pct+'%',LW-gw(pct+'%')-6,py,P.CYA,P.BLK,1);py+=7;
    bar(12,py,LW-20,3,cq.progress/cq.total,P.CYA,'#001122');py+=6;
    if(G.ship.craftQueue.length>1){
      txs('В ОЧЕРЕДИ: '+(G.ship.craftQueue.length-1),12,py,P.DIM,P.BLK,1);py+=8;
    }
  } else {
    txs('ОЧЕРЕДЬ ПУСТА',6,py,P.DIM,P.BLK,1);py+=10;
  }
  // Разделитель
  rc(2,py,LW-4,1,'#1a3550');py+=4;
  // ===== СПИСОК ДОСТУПНЫХ =====
  txs('ДОСТУПНО:',6,py,P.UIT2,P.BLK,1);py+=10;
  const items=_workshopItems(G);
  const queued=new Set((G.ship.craftQueue||[]).map(c=>c.id));
  G._shipSubHits=[];
  const cardH=18,cardMargin=2;
  for(const item of items){
    const cardY=py;
    const cardW=LW-12;
    const cardX=6;
    // Цвет рамки/фона по статусу
    let frame='#1a3550', bg='#0a1828', btn='СДЕЛАТЬ', btnCol=P.GRN, btnBg='#1a3a18';
    let nameCol=P.WHT;
    if(item.have){frame=P.GRN;bg='#0a1f12';btn='✓ ГОТОВО';btnCol=P.GRN;btnBg='#0a2818';nameCol=P.GRN;}
    else if(queued.has(item.id)){frame=P.CYA;bg='#0a1828';btn='В ОЧЕРЕДИ';btnCol=P.CYA;btnBg='#082030';}
    else if(item.lock){frame='#552233';bg='#180a0e';btn='ЗАКРЫТО';btnCol='#aa6655';btnBg='#250a0e';nameCol='#aa8866';}
    else {
      const haveCR=G.pl.cr,haveMat=G.campaignState.materials||0;
      if(haveCR<item.cost||haveMat<item.matCost){frame='#aa8822';bg='#1f1808';btn='МАЛО';btnCol=P.YEL;btnBg='#2a1f08';}
    }
    // Рамка
    rc(cardX,cardY,cardW,cardH,frame);
    rc(cardX+1,cardY+1,cardW-2,cardH-2,bg);
    // Название
    txs(item.label,cardX+4,cardY+3,nameCol,P.BLK,1);
    // Цена
    const priceTxt=item.cost+' КР'+(item.matCost>0?' + '+item.matCost+' МАТ':'');
    txs(priceTxt,cardX+4,cardY+10,P.YEL,P.BLK,1);
    // Лок-хинт справа от имени
    if(item.lock){
      txs(item.lockHint,cardX+cardW-gw(item.lockHint)-50,cardY+3,'#aa6655',P.BLK,1);
    }
    // Кнопка справа
    const btnW=gw(btn)+8, btnX=cardX+cardW-btnW-3, btnY=cardY+4;
    rc(btnX,btnY,btnW,10,btnBg);
    rc(btnX,btnY,btnW,1,btnCol);
    rc(btnX,btnY+9,btnW,1,btnCol);
    txs(btn,btnX+4,btnY+2,btnCol,P.BLK,1);
    // Регистрируем клик только если доступно для постановки в очередь
    if(!item.have&&!item.lock&&!queued.has(item.id)){
      G._shipSubHits.push({x:cardX,y:cardY,w:cardW,h:cardH,itemId:item.id});
    }
    py+=cardH+cardMargin;
  }
  // ★ PR D: секция АПГРЕЙДОВ — постоянные улучшения за КР+РЕС
  const upgrades=_upgradeItems(G);
  if(upgrades.length>0||(G.campaignState.upgrades&&(G.campaignState.upgrades.hp>0||G.campaignState.upgrades.en>0||G.campaignState.upgrades.workers>0))){
    py+=4;
    rc(2,py-1,LW-4,1,'#552288');py+=4;
    txs('АПГРЕЙДЫ КОРАБЛЯ (РЕСУРСЫ: '+G.pl.res+'):',6,py,P.PUR,P.BLK,1);py+=10;
    for(const up of upgrades){
      const cardY=py;
      const cardW=LW-12, cardX=6;
      const haveCR=G.pl.cr, haveRES=G.pl.res;
      const affordable=haveCR>=up.cost&&haveRES>=up.res;
      const frame=affordable?up.col:'#aa8822', bg='#0a1828';
      const btn=affordable?'КУПИТЬ':'МАЛО', btnCol=affordable?up.col:P.YEL, btnBg=affordable?'#1a1830':'#2a1f08';
      // Рамка + фон + цветная полоса
      rc(cardX,cardY,cardW,cardH,frame);
      rc(cardX+1,cardY+1,cardW-2,cardH-2,bg);
      rc(cardX+1,cardY+1,3,cardH-2,up.col);
      // Название с уровнем
      txs(up.label+' ['+up.lvl+'/'+up.maxLvl+']',cardX+7,cardY+3,affordable?P.WHT:'#aa8866',P.BLK,1);
      // Эффект слева
      txs(up.effect,cardX+7,cardY+10,up.col,P.BLK,1);
      // Кнопка справа
      const btnW=gw(btn)+8, btnX=cardX+cardW-btnW-3, btnY=cardY+4;
      rc(btnX,btnY,btnW,10,btnBg);
      rc(btnX,btnY,btnW,1,btnCol);
      rc(btnX,btnY+9,btnW,1,btnCol);
      txs(btn,btnX+4,btnY+2,btnCol,P.BLK,1);
      // Цена под кнопкой (или над, чтобы не пересекалась с эффектом)
      const priceTxt=up.cost+'КР+'+up.res+'РЕС';
      const priceW=gw(priceTxt);
      txs(priceTxt,btnX+btnW-priceW,cardY+15,affordable?P.YEL:'#aa6655',P.BLK,1);
      if(affordable){
        G._shipSubHits.push({x:cardX,y:cardY,w:cardW,h:cardH,upgradeId:up.id});
      }
      py+=cardH+cardMargin;
    }
  }
}

// ============================================================
// ЭКРАН РАБОЧИХ
// ============================================================
function updShipWorkers(G){
  if(mC){
    const hits=G._shipSubHits||[];
    for(const h of hits){
      if(mX>=h.x&&mX<=h.x+h.w&&mY>=h.y&&mY<=h.y+h.h){
        if(h.workerAction){
          const ok=reallocWorkers(G,h.workerRoom,h.workerAction==='plus'?+1:-1);
          if(ok){sfxUI();fText(h.x+h.w/2,h.y+12,h.workerAction==='plus'?'+1':'-1',P.EN);}
          else{sfxHit();fText(h.x+h.w/2,h.y+12,'НЕТ',P.RED);}
          mC=false;break;
        }
      }
    }
  }
}

function drwShipWorkers(G){
  ensureShipWorkers(G);
  const t=G.shipT, w=G.ship.workers;
  rc(0,0,LW,LH,'#03060d');
  for(let y=0;y<LH;y+=8){cx.globalAlpha=0.05;rc(0,y,LW,1,P.UIT);}
  cx.globalAlpha=1;
  // ===== ВЕРХ =====
  rc(0,0,LW,16,'#0a1828');
  rc(0,15,LW,1,P.EN);
  txs('< НАЗАД',24,5,P.UIT2,P.BLK,1);
  txcs('РАСПРЕДЕЛЕНИЕ РАБОЧИХ',5,P.EN,P.BLK,1);
  txs('ВСЕГО: '+G.pl.workers,LW-gw('ВСЕГО: '+G.pl.workers)-3,5,P.WHT,P.BLK,1);

  // ===== КАРТОЧКИ ОТСЕКОВ =====
  G._shipSubHits=[];
  const rooms=[
    {id:'power',name:'ЭЛЕКТРОСТАНЦИЯ',col:P.EN,
      effect:'+'+(w.power*0.18).toFixed(2)+' ЭНЕРГИИ/КАДР'},
    {id:'fuel',name:'ТОПЛИВО',col:P.RES,
      effect:(w.fuel>0?'-'+(w.fuel*5)+'% РАСХОДА':'НЕТ ЭФФЕКТА')},
    {id:'bridge',name:'МОСТИК',col:P.UIT,
      effect:(w.bridge>0?'-'+(w.bridge*5)+'% ВХОДЯЩЕГО УРОНА':'НЕТ ЭФФЕКТА')},
    {id:'workshop',name:'МАСТЕРСКАЯ',col:P.GRN,
      effect:(w.workshop>0?'+'+w.workshop+' ЕД./КАДР КРАФТА':'КРАФТ ОСТАНОВЛЕН')},
  ];
  let py=22;
  const cardH=28,cardMargin=4;
  for(const rm of rooms){
    const cardW=LW-12, cardX=6;
    rc(cardX,py,cardW,cardH,'#1a3550');
    rc(cardX+1,py+1,cardW-2,cardH-2,'#0a1828');
    // Цветная полоса слева
    rc(cardX+1,py+1,3,cardH-2,rm.col);
    // Название
    txs(rm.name,cardX+8,py+4,rm.col,P.BLK,1);
    // Эффект
    txs(rm.effect,cardX+8,py+14,P.UIT2,P.BLK,1);
    // [-] [count] [+] справа
    const bw=14,bh=14;
    const minusX=cardX+cardW-bw*3-12, plusX=cardX+cardW-bw-4;
    const cntX=minusX+bw+2, cntY=py+(cardH-bh)/2;
    const my=py+(cardH-bh)/2;
    // [-]
    const minusEnabled=w[rm.id]>0;
    rc(minusX,my,bw,bh,minusEnabled?'#3a1a1a':'#1a1010');
    rc(minusX+1,my+1,bw-2,bh-2,minusEnabled?'#5a2a2a':'#221717');
    txs('-',minusX+(bw-gw('-'))/2,my+(bh-5)/2-1,minusEnabled?P.RED:'#664444',1);
    G._shipSubHits.push({x:minusX,y:my,w:bw,h:bh,workerAction:'minus',workerRoom:rm.id});
    // Счётчик
    const cntTxt=String(w[rm.id]);
    txs(cntTxt,cntX+(bw-gw(cntTxt))/2,cntY+(bh-5)/2-1,P.WHT,P.BLK,1);
    // [+]
    const sum=w.power+w.fuel+w.bridge+w.workshop;
    const plusEnabled=sum<G.pl.workers||true; // realloc может всегда забрать из другого
    rc(plusX,my,bw,bh,'#1a3a1a');
    rc(plusX+1,my+1,bw-2,bh-2,'#2a5a2a');
    txs('+',plusX+(bw-gw('+'))/2,my+(bh-5)/2-1,P.GRN,1);
    G._shipSubHits.push({x:plusX,y:my,w:bw,h:bh,workerAction:'plus',workerRoom:rm.id});
    py+=cardH+cardMargin;
  }
  // ===== ИТОГ =====
  py+=2;
  txcs('+/- ПЕРЕНОСИТ РАБОЧЕГО МЕЖДУ ОТСЕКАМИ',py,P.UIT2,P.BLK,1);
}

// ============================================================
// ★ PR E: СИСТЕМНАЯ КАРТА (даётся Клирром после квеста Дроша)
//   Полноэкранный обзор системы: центр Тины + орбиты планет + текущая цель.
//   Клик по разблокированной планете → переключение целевой планеты.
// ============================================================

// Координаты планет на карте (статичные позиции для согласованности).
//   centerX/centerY вычисляются от LW/LH в drwShipMap.
const _MAP_PLANETS=[
  {id:'drosh',     name:'ДРОШ',      angle:Math.PI*1.1, r:32, col:P.PL1,  body:P.IC3},
  {id:'bubblika',  name:'БУББЛИКА',  angle:Math.PI*1.7, r:48, col:P.BUB1, body:P.BUB3},
  {id:'krasnozem', name:'КРАСНОЗЁМ', angle:Math.PI*0.4, r:62, col:P.KRZ1, body:P.KRZ3},
  {id:'center',    name:'ТИНА',      angle:0,            r:0,  col:P.TINA, body:P.TINA_CORE},
];

function _mapIsUnlocked(G,planetId){
  // Игрок может выбрать любую посещённую планету ИЛИ следующую по очереди
  if(planetId==='drosh')return true;
  if(planetId==='bubblika')return !!G.droshDone;
  if(planetId==='krasnozem')return !!G.bubblikaDone;
  if(planetId==='center')return !!G.krasDone;
  return false;
}

function updShipMap(G){
  if(mC){
    const hits=G._shipSubHits||[];
    for(const h of hits){
      if(mX>=h.x&&mX<=h.x+h.w&&mY>=h.y&&mY<=h.y+h.h){
        if(h.mapPlanet){
          if(_mapIsUnlocked(G,h.mapPlanet)){
            G.campaignState.targetPlanet=h.mapPlanet;
            G.notif='КУРС ЗАДАН: '+(PLANETS[h.mapPlanet]||PLANETS.drosh).name;
            G.notifT=130;G.notifCol=P.CYA;
            sfxUI2();sfxPU();flash(.2,P.CYA);
            // Возвращаемся на главный экран корабля
            G.shipUI='main';
          } else {
            G.notif='ПЛАНЕТА ЗАКРЫТА';G.notifT=80;G.notifCol=P.RED;sfxHit();
          }
          mC=false;break;
        }
      }
    }
  }
}

function drwShipMap(G){
  const t=G.shipT;
  rc(0,0,LW,LH,'#020412');
  // Фоновая решётка координат
  for(let y=0;y<LH;y+=10){cx.globalAlpha=0.06;rc(0,y,LW,1,P.UIT);}
  for(let x=0;x<LW;x+=10){cx.globalAlpha=0.06;rc(x,0,1,LH,P.UIT);}
  cx.globalAlpha=1;
  // ===== ВЕРХНИЙ ЗАГОЛОВОК =====
  rc(0,0,LW,16,'#0a1828');
  rc(0,15,LW,1,P.PUR);
  txs('< НАЗАД',24,5,P.UIT2,P.BLK,1);
  txcs('СИСТЕМНАЯ КАРТА',5,P.PUR,P.BLK,1);
  const dest=(PLANETS[G.campaignState.targetPlanet]||PLANETS.drosh).name;
  const destTxt='ЦЕЛЬ: '+dest;
  txs(destTxt,LW-gw(destTxt)-3,5,P.CYA,P.BLK,1);

  // ===== ЦЕНТР КАРТЫ =====
  const cx_=LW/2, cy_=LH/2+8;
  // Орбиты как тусклые кольца
  cx.globalAlpha=.15;
  ring(cx_,cy_,32,P.PUR2,1);
  ring(cx_,cy_,48,P.PUR2,1);
  ring(cx_,cy_,62,P.PUR2,1);
  cx.globalAlpha=1;
  // Маршрут (соединительные линии между планетами по порядку)
  cx.globalAlpha=.30;
  cx.strokeStyle=P.UIT2;cx.lineWidth=1;
  cx.setLineDash([2,2]);
  cx.beginPath();
  for(let i=0;i<_MAP_PLANETS.length;i++){
    const p=_MAP_PLANETS[i];
    const px=cx_+Math.cos(p.angle)*p.r;
    const py=cy_+Math.sin(p.angle)*p.r;
    if(i===0)cx.moveTo(px,py);else cx.lineTo(px,py);
  }
  cx.stroke();
  cx.setLineDash([]);
  cx.globalAlpha=1;

  // Тина в центре (особый рендер)
  const tinaPulse=.7+.3*Math.sin(t*.08);
  cx.globalAlpha=.4*tinaPulse;disc(cx_|0,cy_|0,9,P.TINA);
  cx.globalAlpha=.7*tinaPulse;disc(cx_|0,cy_|0,5,P.TINA2);
  cx.globalAlpha=1;disc(cx_|0,cy_|0,3,P.TINA_CORE);

  G._shipSubHits=[];

  // Планеты с подписями
  const curPlanet=G.campaignState.currentPlanet||'drosh';
  const targetPlanet=G.campaignState.targetPlanet||'drosh';
  for(const p of _MAP_PLANETS){
    const px=(cx_+Math.cos(p.angle)*p.r)|0;
    const py=(cy_+Math.sin(p.angle)*p.r)|0;
    const unlocked=_mapIsUnlocked(G,p.id);
    const isCurrent=(curPlanet===p.id);
    const isTarget=(targetPlanet===p.id);
    const sz=p.id==='center'?6:5;
    // Тень
    cx.fillStyle='rgba(0,0,0,0.5)';cx.fillRect(px-sz,py+sz,sz*2,1);
    // Тело планеты
    if(unlocked){
      disc(px,py,sz,p.col);
      disc(px-1,py-1,sz-2,p.body);
    } else {
      // Закрытая — затемнённая
      cx.globalAlpha=.35;disc(px,py,sz,'#445566');cx.globalAlpha=1;
      txs('?',px-1,py-2,'#aaaaaa',P.BLK,1);
    }
    // Индикаторы статуса
    if(isCurrent){
      // Текущая планета — белое кольцо
      cx.globalAlpha=.7+.3*Math.sin(t*.15);
      ring(px,py,sz+3,P.WHT,1);
      cx.globalAlpha=1;
    }
    if(isTarget&&!isCurrent){
      // Целевая планета — жёлтый пульсирующий маркёр
      cx.globalAlpha=.6+.4*Math.sin(t*.2);
      ring(px,py,sz+4,P.YEL,1);
      ring(px,py,sz+6,P.YEL,1);
      cx.globalAlpha=1;
    }
    // Подпись (выше или ниже планеты, чтобы не пересекалось)
    if(unlocked){
      const lblY=py-sz-9;
      const lblX=px-(gw(p.name)/2|0);
      txs(p.name,lblX,lblY,isTarget?P.YEL:isCurrent?P.WHT:P.UIT,P.BLK,1);
    }
    // Хит-зона (немного шире самой планеты для удобства тача)
    G._shipSubHits.push({x:px-10,y:py-10,w:20,h:20,mapPlanet:p.id});
  }

  // ===== НИЖНЯЯ ПОДСКАЗКА =====
  const hint=USE_TOUCH_UI?'ТАП НА ПЛАНЕТУ — ВЫБРАТЬ КУРС':'КЛИК НА ПЛАНЕТУ — ВЫБРАТЬ КУРС';
  txcs(hint,LH-12,P.UIT2,P.BLK,1);

  // Иконка корабля игрока возле currentPlanet
  const cur=_MAP_PLANETS.find(p=>p.id===curPlanet);
  if(cur){
    const cpx=(cx_+Math.cos(cur.angle)*cur.r)|0;
    const cpy=(cy_+Math.sin(cur.angle)*cur.r)|0;
    // Мини-корабль рядом
    const shx=cpx+10, shy=cpy-2;
    rc(shx-2,shy-1,4,2,P.SH1);
    rc(shx-1,shy-2,3,1,P.SH3);
    rc(shx+2,shy-1,2,1,P.SH1);
    rc(shx-3,shy,1,1,P.TH1);
  }
}
