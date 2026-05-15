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

  if(KD.Tab||btnJust('back')){sfxUI();startTrans(()=>{ALLOW_JOY=true;TAP_FIRE=false;G.state=G.shipReturnState||'planet_drosh';resetBtns();
    if(G.state==='planet_drosh'){addBtn('int',LW-20,LH-20,12,'*',P.YEL);addBtn('ship',20,24,10,'S',P.UIT);}
    else if(G.state==='planet_bubblika'){addBtn('int',LW-20,LH-20,12,'*',P.YEL);addBtn('ship',20,24,10,'S',P.UIT);addBtn('jump',LW-20,LH-48,12,'J',P.CYA);}
    else if(G.state==='planet_krasnozem'){addBtn('int',LW-20,LH-20,12,'*',P.YEL);addBtn('ship',20,24,10,'S',P.UIT);}
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
  const _workshopItems=[
    {unbuilt:inv.laserBlueprint&&!inv.laserStrong, label:'Л2',     short:'Л2',     cost:90,  matCost:0, id:'l2'},
    {unbuilt:inv.bubblikaContract&&!inv.shieldBuilt, label:'ЩИТ',  short:'ЩИТ',    cost:60,  matCost:0, id:'shield'},
    {unbuilt:!inv.spreadUnlocked,  label:'СПРЕД',  short:'СПРЕД',  cost:50,  matCost:1, id:'spread'},
    {unbuilt:!inv.missileUnlocked, label:'РАКЕТА', short:'РАКЕТА', cost:80,  matCost:2, id:'missile'},
    {unbuilt:!inv.beamUnlocked,    label:'ЛУЧ',    short:'ЛУЧ',    cost:120, matCost:2, id:'beam'},
    {unbuilt:!inv.burstUnlocked,   label:'БЁРСТ',  short:'БЁРСТ',  cost:150, matCost:3, id:'burst'},
  ];
  const _workshopNext=_workshopItems.find(i=>i.unbuilt);
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

  const rooms=[
    {col:0,row:0,id:'power',name:'ЭЛЕКТРОСТАНЦИЯ',col2:P.EN,
     hint:'РАБОЧИХ: '+G.pl.workers, status:'info',
     action:null, notif:'РАБОЧИЕ ВЫРАБАТЫВАЮТ ЭНЕРГИЮ. БОЛЬШЕ РАБОЧИХ - БЫСТРЕЕ.'},
    {col:1,row:0,id:'fuel',name:'ТОПЛИВО',col2:P.RES,
     hint:FEED_COST+' РЕС => +'+FEED_FUEL+'%', status:fuelStatus,
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
     hint:workshopHint, status:workshopStatus,
     action:(G)=>{
       const inv2=G.campaignState.inventory;
       const items=[
         {unbuilt:inv2.laserBlueprint&&!inv2.laserStrong, label:'ЛАЗЕР', short:'Л2', cost:90, matCost:0, id:'l2'},
         {unbuilt:inv2.bubblikaContract&&!inv2.shieldBuilt, label:'ЩИТ', short:'ЩИТ', cost:60, matCost:0, id:'shield'},
         {unbuilt:!inv2.spreadUnlocked,  label:'СПРЕД',  short:'СПРЕД',  cost:50,  matCost:1, id:'spread'},
         {unbuilt:!inv2.missileUnlocked, label:'РАКЕТА', short:'РАКЕТА', cost:80,  matCost:2, id:'missile'},
         {unbuilt:!inv2.beamUnlocked,    label:'ЛУЧ',    short:'ЛУЧ',    cost:120, matCost:2, id:'beam'},
         {unbuilt:!inv2.burstUnlocked,   label:'БЁРСТ',  short:'БЁРСТ',  cost:150, matCost:3, id:'burst'},
       ];
       const next=items.find(i=>i.unbuilt);
       if(!next){
         G.notif='ВСЁ СОБРАНО! ЛЕТИ К ТИНЕ!';G.notifT=100;G.notifCol=P.GRN;sfxUI();return;
       }
       // Чертежи квестовых предметов требуют сами чертежи
       if(next.id==='l2'&&!inv2.laserBlueprint){G.notif='НУЖЕН ЧЕРТЁЖ Л2 (ДРОШ)';G.notifT=90;G.notifCol=P.YEL;sfxHit();return;}
       if(next.id==='shield'&&!inv2.bubblikaContract){G.notif='НУЖЕН ЧЕРТЁЖ ЩИТА (БУББЛИКА)';G.notifT=90;G.notifCol=P.YEL;sfxHit();return;}
       const haveCR=G.pl.cr, haveMat=G.campaignState.materials||0;
       if(haveCR<next.cost){G.notif=next.short+': НУЖНО '+next.cost+' КР (ЕСТЬ '+haveCR+')';G.notifT=90;G.notifCol=P.RED;sfxHit();return;}
       if(haveMat<next.matCost){G.notif=next.short+': НУЖНО '+next.matCost+' МАТЕР. (ЕСТЬ '+haveMat+')';G.notifT=90;G.notifCol=P.RED;sfxHit();return;}
       // Списываем и применяем эффект
       G.pl.cr-=next.cost;
       G.campaignState.materials=haveMat-next.matCost;
       const rewards=[{label:'-'+next.cost+' КРЕДИТОВ',col:P.YEL}];
       if(next.matCost>0)rewards.push({label:'-'+next.matCost+' МАТЕРИАЛОВ',col:P.CYA});
       let glowCol=P.GRN;
       switch(next.id){
         case 'l2':
           inv2.laserStrong=true;
           rewards.unshift({label:'ЛАЗЕР L2 АКТИВЕН',col:P.L3});
           glowCol=P.L3;
           break;
         case 'shield':
           inv2.shieldBuilt=true;
           G.pl.mhp+=40;G.pl.hp=Math.min(G.pl.mhp,G.pl.hp+40);
           rewards.unshift({label:'+40 МАКС. ХП',col:P.HP});
           rewards.unshift({label:'ЭНЕРГОЩИТ АКТИВЕН',col:P.CYA});
           glowCol=P.CYA;
           break;
         case 'spread':
           inv2.spreadUnlocked=true;
           rewards.unshift({label:'СПРЕД — ВЕЕР ИЗ 3 ПУЛЬ',col:P.L1L});
           glowCol=P.L1;
           break;
         case 'missile':
           inv2.missileUnlocked=true;
           rewards.unshift({label:'РАКЕТА — САМОНАВЕДЕНИЕ',col:P.ORA});
           glowCol=P.ORA;
           break;
         case 'beam':
           inv2.beamUnlocked=true;
           rewards.unshift({label:'ЛУЧ — НЕПРЕРЫВНЫЙ',col:P.L2});
           glowCol=P.L2;
           break;
         case 'burst':
           inv2.burstUnlocked=true;
           rewards.unshift({label:'БЁРСТ — ОЧЕРЕДЬ 5 ПУЛЬ',col:P.YEL});
           glowCol=P.YEL;
           break;
       }
       showQuestReward(G,'УЛУЧШЕНИЕ СОЗДАНО',rewards,glowCol);
       sfxPU();setTimeout(sfxUI2,80);setTimeout(sfxPU,160);flash(.4,glowCol);
       spPts(LW/2,LH/2,30,[glowCol,P.WHT,P.YEL],.7,4,30,.02,2);
       addShockwave(LW/2,LH/2,40,glowCol,20);shake(3);
     },
     notif:'СБОРКА УЛУЧШЕНИЙ ПО ЧЕРТЕЖАМ.'},
    {col:1,row:1,id:'bridge',name:'МОСТИК',col2:P.UIT,
     hint:'ЦЕЛЬ: '+((PLANETS[G.campaignState.targetPlanet]||PLANETS.drosh).name), status:'info',
     action:null, notif:'НАВИГАЦИЯ И КУРС КОРАБЛЯ.'},
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
  txs('РЕСУРСЫ',panelX+3,py,P.UIT2,P.BLK,1);py+=8;
  txs('КР '+G.pl.cr,panelX+3,py,P.YEL,P.BLK,1);
  txs('РЕ '+G.pl.res,panelX+3+(panelW>>1),py,P.RES,P.BLK,1);py+=8;
  txs('РАБОЧ '+G.pl.workers,panelX+3,py,P.EN,P.BLK,1);py+=8;
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
    for(const ws of T.weakSpots)ws.orbitSpd=0.013;
    T.droneCD=80;
    T.shootCD=40;
    G.briefing={t:0,planet:'tina_phase4'};
  }
  G.notif='ВОЗВРАТ В ФАЗУ '+targetPhase;G.notifT=120;G.notifCol=P.CYA;
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

