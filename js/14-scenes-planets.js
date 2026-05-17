// ============================================================
// 14-scenes-planets.js
// Planet scenes: Drosh, Bubblika, Krasnozem (init/upd/drw each), drwScavenger
// depends on: everything above
// (originally sintara_v25.html lines 3537-5433)
// ============================================================

// Shared launch helper: heals player, refuels, starts space flight.
// If player has the star map, opens nav map first; preserves planet return state for launch button.
function _launchToSpace(G,hpGain,fuelGain){
  const savedReturnState=G.shipReturnState;
  startTrans(()=>{
    G.pl.hp=Math.min(G.pl.mhp,G.pl.hp+hpGain);
    G.pl.en=G.pl.men;
    G.ship.fuel=Math.min(100,G.ship.fuel+fuelGain);
    initSpace(G);
    if(G.campaignState.inventory&&G.campaignState.inventory.starMap){
      G.state='ship_view';G.shipUI='map';
      G.shipReturnState=savedReturnState; // keep planet state so launch button stays visible
      G._navFromLaunch=true; // already launched — pressing launch again just goes to space
      G.shipT=0;TAP_FIRE=false;ALLOW_JOY=false;
      resetBtns();addBtn('back',20,24,10,'<',P.UIT);
    }
  });
}

// ======= PLANET DROSH =======
function initPlanetDrosh(G){
  TAP_FIRE=false;ALLOW_JOY=true;G.state='planet_drosh';G.shipReturnState='planet_drosh';
  G.pc={x:165,y:100,facing:1,wt:0};G.dlg=null;G.dlgChar=0;
  G.notif='ПОГОВОРИ С КЛИРРОМ.';G.notifT=180;G.notifCol=P.CYA;
  G.npcs=NPC_DEFS.map(d=>({...d,near:false}));
  G.crystals=[];
  const positions=[[30,140],[120,160],[155,128],[230,152],[255,130],[300,158],[50,160],[200,140]];
  for(const[cx_,cy_]of positions)G.crystals.push({x:cx_,y:cy_,t:Math.random()*Math.PI*2,collected:false});
  // 5 маяков (раньше было 3) разбросаны по карте — нужно зажечь все по порядку, каждый требует 1 ресурс
  G.droshSide={
    done:!!G.campaignState.flags.droshSideDone,
    // Квест нужно принять у Клирра — без этого нельзя зажигать маяки
    questAccepted:!!G.campaignState.flags.droshQuestAccepted,
    beacons:[
      {x:60,y:80,fixed:false,t:0,cost:1},
      {x:138,y:140,fixed:false,t:8,cost:1},
      {x:218,y:80,fixed:false,t:16,cost:1},
      {x:284,y:138,fixed:false,t:24,cost:1},
      {x:38,y:138,fixed:false,t:32,cost:1},
    ],
    // Дополнительная фаза: после зажжения всех — 30 сек "удержать огонь" (метель пытается погасить)
    holdPhase:false, holdT:0, holdDur:1200, holdActive:false,
  };
  if(G.droshSide.done)for(const b of G.droshSide.beacons)b.fixed=true;
  // Тепло: ИЗНАЧАЛЬНО только один маленький купол в центре. Остальные купола привязаны к маякам.
  // Купола стоят на снежных холмах вдоль горизонта (фоновые объекты, не пересекаются с игровым полем).
  G.drosh={
    warmth:100, mwarmth:100,
    blizT:0, blizDur:0, blizDX:0, blizDY:0, nextBliz:240+((Math.random()*200)|0),
    // y - это позиция БАЗЫ купола (ниже неё рисуется снежный холм-основание),
    // hr - радиус действия тепла (больше визуального r)
    domes:[
      {x:178,y:50,r:18,hr:42,active:true,linkedBeacon:-1,activation:1},  // стартовый, маленький
      {x:60,y:54,r:30,hr:62,active:false,linkedBeacon:0,activation:0},
      {x:262,y:54,r:24,hr:54,active:false,linkedBeacon:2,activation:0},
    ],
    snowflakes:Array.from({length:42},()=>({x:Math.random()*LW,y:Math.random()*LH,sp:0.3+Math.random()*0.7,sz:1+(Math.random()<0.2?1:0),sw:Math.random()*Math.PI*2})),
  };
  // Если квест уже выполнен (повторный визит) - все купола активны
  if(G.droshSide.done){
    for(const d of G.drosh.domes){d.active=true;d.activation=1;}
  }
  PTS.length=0;FTX.length=0;resetBtns();
  if(USE_TOUCH_UI){addBtn('int',LW-20,LH-20,12,'*',P.YEL);addBtn('ship',20,24,10,'S',P.UIT);}
  // === ТУТОРИАЛ ПЛАНЕТЫ (только при первом приземлении) ===
  if(!G.campaignState.flags.tutDroshShown){
    G.campaignState.flags.tutDroshShown=true;
    setTimeout(()=>{
      if(G.state!=='planet_drosh')return;
      const touch=USE_TOUCH_UI;
      startTutorial(G,[
        {text:['ДОБРО ПОЖАЛОВАТЬ НА ПЛАНЕТУ!','ЗДЕСЬ ТЫ МОЖЕШЬ ХОДИТЬ И ИССЛЕДОВАТЬ.'],
         tx:LW/2-100,ty:LH/2-22},
        {text:touch?['ДЖОЙСТИК - УПРАВЛЯТЬ ДВИЖЕНИЕМ.','НПС С ! - ИМЕЮТ ВАЖНУЮ ИНФУ ИЛИ КВЕСТ.']:['WASD ИЛИ СТРЕЛКИ - ДВИЖЕНИЕ.','НПС С ! - ИМЕЮТ ВАЖНУЮ ИНФУ ИЛИ КВЕСТ.']},
        {text:touch?['КНОПКА * - ВЗАИМОДЕЙСТВИЕ.','ПОДОЙДИ К НПС И НАЖМИ.']:['КЛАВИША X ИЛИ E - ВЗАИМОДЕЙСТВИЕ.','ПОДОЙДИ К НПС И НАЖМИ.'],
         hx:touch?LW-20:LW/2,hy:touch?LH-20:LH-20,arrow:'right',
         tx:touch?LW-152:LW/2-110,ty:touch?LH-44:LH-44,hr:14},
        {text:touch?['КНОПКА S - ВОЙТИ В КОРАБЛЬ.','ТАМ ЗАПРАВКА И УЛУЧШЕНИЯ.']:['КЛАВИША TAB - ВОЙТИ В КОРАБЛЬ.','ТАМ ЗАПРАВКА И УЛУЧШЕНИЯ.'],
         hx:touch?20:LW/2,hy:touch?24:24,arrow:touch?'right':'up',
         tx:touch?54:LW/2-110,ty:touch?40:38,hr:12},
        {text:touch?['КОГДА КВЕСТ ВЫПОЛНЕН - НА HUD','ПОЯВИТСЯ КНОПКА L (ВЗЛЁТ).','ОНА ВЕРНЁТ КОРАБЛЬ В КОСМОС.']:['КОГДА КВЕСТ ВЫПОЛНЕН - НА HUD','ПОЯВИТСЯ ПОДСКАЗКА [L] ВЗЛЁТ.','НАЖМИ L - КОРАБЛЬ ВЕРНЁТСЯ В КОСМОС.'],
         hrect:{x:230,y:0,w:50,h:14},arrow:'up',hx:255,hy:14,
         tx:LW/2-110,ty:30},
        {text:['КОММЕНДАНТ КЛИРР ДАСТ КВЕСТ.','НАЙДИ ЕГО И ВЫПОЛНИ ПОРУЧЕНИЕ!']},
      ]);
    },500);
  }
}

function droshIsWarm(G){
  // Возвращает скорость восстановления тепла
  const pc=G.pc,D=G.drosh;
  let bestRate=0;
  // Купола (только активированные)
  for(const d of D.domes){
    if(!d.active||d.activation<0.05)continue;
    const dist=Math.hypot(pc.x-d.x,pc.y-d.y);
    const eff=d.activation;
    const hr=d.hr||(d.r+10);
    if(dist<hr){const rate=0.55*(1-Math.min(1,dist/hr))*eff;if(rate>bestRate)bestRate=rate;}
  }
  // Зажжённые маяки
  if(G.droshSide){
    for(const b of G.droshSide.beacons){
      if(!b.fixed)continue;
      const dist=Math.hypot(pc.x-b.x,pc.y-b.y);
      if(dist<28){const rate=0.40*(1-dist/28);if(rate>bestRate)bestRate=rate;}
    }
  }
  return bestRate;
}

function droshStartBlizzard(G){
  const D=G.drosh;
  D.blizT=0;D.blizDur=120+((Math.random()*100)|0);
  // Ветер обычно дует слева направо или справа налево
  D.blizDX=(Math.random()<0.5?-1:1)*(0.6+Math.random()*0.5);
  D.blizDY=0.1+Math.random()*0.2;
  G.notif='МЕТЕЛЬ! УКРОЙСЯ В КУПОЛЕ!';G.notifT=110;G.notifCol=P.CYA;sfxUI();
}

function updPlanetDrosh(G){
  handlePauseInput(G);if(G.paused)return;
  if(G.tutorial){updTutorial(G);return;}
  G.notifT=Math.max(0,G.notifT-1);
  if(G.dlg){updDialog(G);G.sT++;flushIn();return;}
  G.sT++;const pc=G.pc,D=G.drosh;
  const inBlizzard=D.blizDur>0;
  let spd=1.1;
  if(inBlizzard)spd=0.85;  // в метель медленнее
  let ix=0,iy=0;
  if(K.KeyA||K.ArrowLeft)ix-=1;if(K.KeyD||K.ArrowRight)ix+=1;
  if(K.KeyW||K.ArrowUp)iy-=1;if(K.KeyS||K.ArrowDown)iy+=1;
  if(USE_TOUCH_UI&&TOUCH.joyActive){ix=TOUCH.joyDX;iy=TOUCH.joyDY;}
  let mv=false;if(ix||iy){const l=Math.hypot(ix,iy)||1;pc.x+=ix/l*spd;pc.y+=iy/l*spd;if(ix)pc.facing=ix>0?1:-1;mv=true;}
  if(mv)pc.wt++;else pc.wt=0;
  // Игрок ходит ПОД куполами (в снежной долине). Минимум y=70 — это под основаниями куполов.
  pc.x=Math.max(8,Math.min(LW-8,pc.x));pc.y=Math.max(70,Math.min(LH-16,pc.y));
  if(mv&&G.sT%8===0)spPts(pc.x,pc.y+5,2,[P.IC3,'#ddeeff'],.2,.8,12,0,.8);

  // Метели
  D.nextBliz--;
  if(D.nextBliz<=0&&!D.blizDur){droshStartBlizzard(G);D.nextBliz=400+((Math.random()*350)|0);}
  if(D.blizDur>0){
    D.blizT++;D.blizDur--;
    pc.x+=D.blizDX*0.45;pc.y+=D.blizDY*0.3;
    pc.x=Math.max(8,Math.min(LW-8,pc.x));
  }

  // Снег: всегда падает, в метель — летит сильнее в направлении ветра
  for(const f of D.snowflakes){
    f.sw+=0.05;
    const baseDX=inBlizzard?D.blizDX*1.6:Math.sin(f.sw)*0.15;
    const baseDY=inBlizzard?(0.5+D.blizDY*1.4):f.sp;
    f.x+=baseDX;f.y+=baseDY;
    if(f.y>LH){f.y=28+Math.random()*4;f.x=Math.random()*LW;}
    if(f.x<-2)f.x=LW+2;
    if(f.x>LW+2)f.x=-2;
  }

  // Купола: плавная активация (если связан маяк зажжён - постепенно набирает 1.0; иначе - падает)
  for(const d of D.domes){
    if(d.linkedBeacon<0){d.activation=1;d.active=true;continue;}
    const linked=G.droshSide&&G.droshSide.beacons[d.linkedBeacon];
    if(linked&&linked.fixed){
      d.activation=Math.min(1,d.activation+0.012);
      d.active=true;
    }else{
      d.activation=Math.max(0,d.activation-0.005);
      if(d.activation<=0)d.active=false;
    }
  }

  // Метель может погасить маяк (5% шанс при сильной метели на каждом тике)
  if(inBlizzard&&G.droshSide&&!G.droshSide.done&&G.sT%30===0){
    const lit=G.droshSide.beacons.filter(b=>b.fixed);
    if(lit.length>0&&Math.random()<0.30){
      const target=lit[Math.floor(Math.random()*lit.length)];
      target.fixed=false;
      // ★ Phase 5.3: учёт потерь для достижения "Мастер маяков"
      G._aBeaconsLost=(G._aBeaconsLost||0)+1;
      G.notif='МЕТЕЛЬ ПОГАСИЛА МАЯК!';G.notifT=110;G.notifCol=P.RED;
      sfxHit();
      spPts(target.x,target.y-10,12,['#888899','#ddeeff','#aaaacc'],.4,2,20,.02);
    }
  }

  // Тепло: восстанавливается у источников, теряется на холоде
  const warmRate=droshIsWarm(G);
  if(warmRate>0)D.warmth=Math.min(D.mwarmth,D.warmth+warmRate);
  else{
    // ★ v16: Игрок замерзает в 1.5 раза быстрее (0.10*1.5=0.15, 0.35*1.5=0.525)
    D.warmth=Math.max(0,D.warmth-(inBlizzard?0.525:0.15));
  }
  // Если замёрз — теряет HP
  if(D.warmth<=0&&G.sT%18===0){G.pl.hp=Math.max(1,G.pl.hp-3);shake(1.5);fText(pc.x,pc.y-12,'-3 ХП',P.RED);if(G.pl.hp<=15&&G.sT%180===0){G.notif='ЗАМЕРЗАЕШЬ! БЕГИ К КУПОЛУ!';G.notifT=80;G.notifCol=P.RED;}}

  let nearNPC=null;
  for(const n of G.npcs){n.near=Math.abs(pc.x-n.x)<22&&Math.abs(pc.y-n.y)<22;if(n.near&&!nearNPC)nearNPC=n;}
  for(const c of G.crystals){
    if(c.collected)continue;c.t+=.04;
    const dx=pc.x-c.x,dy=pc.y-c.y;
    if(dx*dx+dy*dy<100){c.collected=true;G.pl.res++;sfxPU();spPts(c.x,c.y,10,[P.IC3,P.CYA,P.WHT],.5,2.5,18,.02);addShockwave(c.x,c.y,12,P.CYA);fText(c.x,c.y,'+РЕС!',P.CYA);}
  }
  const action=(KD.KeyE||KD.Enter||btnJust('int'));
  let nearBeacon=null;
  if(G.droshSide&&!G.droshSide.done&&G.droshSide.questAccepted){
    for(const b of G.droshSide.beacons){
      if(!b.fixed&&Math.abs(pc.x-b.x)<16&&Math.abs(pc.y-b.y)<16){nearBeacon=b;break;}
    }
  }
  if(action&&nearBeacon){
    nearBeacon.fixed=true;sfxPU();spPts(nearBeacon.x,nearBeacon.y,14,[P.CYA,P.WHT,P.YEL],.45,2.4,20,.02);addShockwave(nearBeacon.x,nearBeacon.y,16,P.CYA);
    const left=G.droshSide.beacons.filter(b=>!b.fixed).length;
    if(left>0){G.notif='МАЯК ЗАЖЖЁН! ОСТАЛОСЬ '+left;G.notifT=130;G.notifCol=P.CYA;fText(nearBeacon.x,nearBeacon.y-12,'ТЕПЛО',P.CYA);}
    else{
      // Все маяки зажжены — фаза удержания
      if(!G.droshSide.holdActive){
        G.droshSide.holdActive=true;G.droshSide.holdPhase=true;G.droshSide.holdT=0;
        G.notif='ВСЕ ГОРЯТ! УДЕРЖИ ИХ 20 СЕКУНД!';G.notifT=200;G.notifCol=P.YEL;
      }
    }
  }else if(action&&nearNPC)startDlg(G,nearNPC);

  // Фаза удержания
  if(G.droshSide&&G.droshSide.holdActive&&!G.droshSide.done){
    const allLit=G.droshSide.beacons.every(b=>b.fixed);
    if(allLit){
      // Прогресс идёт только пока все горят. Накопительный — не сбрасывается!
      G.droshSide.holdT++;
    }else{
      // маяк погас → прогресс паузится (не сбрасывается)
      if(G.sT%80===0){G.notif='МАЯК ПОГАС! ЗАЖГИ СНОВА. ПРОГРЕСС НЕ СГОРЕЛ.';G.notifT=70;G.notifCol=P.YEL;}
    }
    if(G.droshSide.holdT>=G.droshSide.holdDur){
      // Победа
      G.droshSide.done=true;G.droshDone=true;G.campaignState.flags.droshSideDone=true;G.pl.cr+=120;G.ship.fuel=Math.min(100,G.ship.fuel+30);
      G.pl.mhp+=40;G.pl.hp=Math.min(G.pl.mhp,G.pl.hp+40);
      // ★ PR E: Клирр даёт системную карту в награду — открывается через Мостик корабля
      G.campaignState.inventory.starMap=true;
      // ★ Phase 5.3: спаситель Дроша + мастер маяков (если ни один не погас от метели)
      unlockAchievement(G,'droshSave');
      if((G._aBeaconsLost||0)===0)unlockAchievement(G,'beaconMaster');
      showQuestReward(G,'ЗАДАНИЕ ВЫПОЛНЕНО',[
        {label:'+120 КРЕДИТОВ',col:P.YEL},
        {label:'+30 ТОПЛИВА',col:P.ORA},
        {label:'+40 МАКС. ХП',col:P.HP},
      ],P.YEL);
      flash(.35,P.CYA);sfxPU();setTimeout(sfxPU,90);setTimeout(sfxPU,180);
      G.droshSide.holdActive=false;
    }
  }

  if(KD.Tab||btnJust('ship')){startTrans(()=>{G.shipReturnState='planet_drosh';G.state='ship_view';G.shipUI='main';G.shipT=0;TAP_FIRE=false;resetBtns();addBtn('back',20,24,10,'<',P.UIT);ALLOW_JOY=false;TOUCH.joyId=-1;TOUCH.joyActive=false;});}
  // ★ v16 r5 #1: Убран квест "5 ресурсов → починка генератора". Теперь взлёт только после
  // выполнения квеста на УДЕРЖАНИЕ 5 маяков (droshSide.done). Зажигание маяков — промежуточный этап.
  // Чертёж лазера выдаём как награду за удержание маяков (раз бесплатно достаётся).
  if(G.droshSide&&G.droshSide.done&&!G.campaignState.inventory.laserBlueprint){
    G.campaignState.inventory.laserBlueprint=true;
    showQuestReward(G,'ПРЕДМЕТ ПОЛУЧЕН',[
      {label:'ЧЕРТЁЖ ЛАЗЕРА LVL2',col:P.L1},
      {label:'ПОСТРОЙ НА ВЕРСТАКЕ',col:P.UIT2},
    ],P.GRN);
    spPts(LW/2,LH/2,18,[P.GRN,P.YEL,P.WHT],.5,3,25,.02,1.5);
    flash(.3,P.GRN);sfxPU();
  }
  // Удалили: автозавершение по G.pl.res>=5
  // Удалили: подсказка "Сначала поговори с Клирром" (по сбору ресурсов)
  const droshLaunchOK=!!(G.droshSide&&G.droshSide.done);
  if(KD.KeyL||(USE_TOUCH_UI&&btnJust('launch'))){
    if(droshLaunchOK){
      sfxLand();
      if(!G.campaignState.planetsCompleted.includes('drosh'))G.campaignState.planetsCompleted.push('drosh');
      if(!G._visitTargetSet)G.campaignState.targetPlanet=PLANETS.drosh.nextPlanet;
      G._visitTargetSet=false;
      _launchToSpace(G,30,40);
    } else if(G._launchWarnT>0){
      // Второе нажатие — вылет без выполненного квеста
      sfxLand();
      if(!G._visitTargetSet)G.campaignState.targetPlanet=PLANETS.drosh.nextPlanet;
      G._visitTargetSet=false;G._launchWarnT=0;
      _launchToSpace(G,30,40);
    } else {
      // Первое нажатие — предупреждение
      if(!G.droshSide||!G.droshSide.questAccepted){G.notif='КВЕСТ НЕ ПРИНЯТ! НАЖМИ ЕЩЁ РАЗ ДЛЯ ВЫЛЕТА.';}
      else if(!G.droshSide.done){G.notif='КВЕСТ НЕ ЗАВЕРШЁН! НАЖМИ ЕЩЁ РАЗ ДЛЯ ВЫЛЕТА.';}
      G.notifT=180;G.notifCol=P.ORA;G._launchWarnT=180;sfxHit();
    }
  }
  if(G._launchWarnT>0)G._launchWarnT--;
  // ★ v16 r5: Поддерживаем G.droshDone как алиас для совместимости с другими местами
  G.droshDone=droshLaunchOK;
  updPts();updFTX();updSHK();
}

function drwPlanetDrosh(G){
  const t=G.sT,D=G.drosh;
  for(let y=0;y<28;y++){const c=y<6?'#030518':y<14?'#060c22':y<22?'#0a1228':'#0e1838';rc(0,y,LW,1,c);}
  for(let i=0;i<25;i++){const sx=(i*37+Math.floor(t*.3))%LW;const sy=(i*13)%22+2;cx.globalAlpha=.4+.3*Math.sin(t*.03+i);cx.fillStyle=P.S1;cx.fillRect(sx,sy,1,1);}
  cx.globalAlpha=1;
  for(let x=0;x<LW;x+=2){const h=Math.sin(x*.05+t*.03)*3+2;cx.globalAlpha=.15*Math.max(0,Math.sin(x*.03+t*.02));cx.fillStyle='#22aa88';cx.fillRect(x,8+h,2,1);cx.globalAlpha=.08*Math.max(0,Math.sin(x*.05+t*.025+1));cx.fillStyle='#8844cc';cx.fillRect(x,10+h,2,1);}
  cx.globalAlpha=1;
  cx.fillStyle='#0e1830';for(let x=0;x<LW;x+=4){const h=5+Math.abs(Math.sin(x*.08))*7+Math.abs(Math.sin(x*.23))*4;cx.fillRect(x,28-h,4,h);}
  cx.fillStyle='#17253d';for(let x=-4;x<LW;x+=6){const h=3+Math.abs(Math.sin(x*.12))*5;cx.fillRect(x,28-h,6,h);rc(x,28-h,2,1,P.IC2);}
  for(let tx=0;tx<LW;tx+=16)for(let ty=28;ty<LH;ty+=16){const sh=((tx+ty)/16|0)%2;rc(tx,ty,16,16,sh?P.ICE:P.IC2);rc(tx,ty,16,1,sh?'#c0d8ee':'#8ab0d4');rc(tx,ty,1,16,sh?'#c0d8ee':'#8ab0d4');const h1=((tx*7+ty*13)%97);if(h1<25)rc(tx+3+h1%7,ty+5+h1%5,4,1,'#9ab8d4');const h2=((tx*11+ty*3)%83);if(h2<18)rc(tx+9+h2%4,ty+11+h2%3,3,1,'#8aa8cc');if((tx*31+ty*7)%71<6){const sp=((t/8)|0)+h1;if(sp%40<4)rc(tx+7+(sp%6),ty+3+(sp%4),1,1,'#ffffff');}}
  rc(0,28,LW,2,P.IC3);rc(0,27,LW,1,'#ffffff');

  // Купола: визуально показываем активные / неактивные
  for(const d of D.domes){
    const hr=d.hr||(d.r+10);
    if(d.active||d.activation>0){
      // Тёплое свечение проектируется ВНИЗ от купола на лёд (круг тепла на земле)
      cx.globalAlpha=0.18*d.activation;disc(d.x,d.y+8,(hr*0.85)|0,'#ffeebb');
      cx.globalAlpha=0.10*d.activation;disc(d.x,d.y+12,hr|0,'#ff9966');
      cx.globalAlpha=1;
    }
    // Сам купол всегда виден, но цвет меняется
    drwDome(d.x,d.y,d.r);
    if(!d.active||d.activation<0.1){
      // Замёрзший / неактивный — оверлей льда
      cx.globalAlpha=0.55;
      disc(d.x,d.y-d.r*0.4,d.r,'#446677');
      cx.globalAlpha=0.4;
      // Иней на куполе
      for(let i=0;i<6;i++){
        const a=i/6*Math.PI;
        const ix=d.x+Math.cos(a-Math.PI*0.5)*d.r*0.7;
        const iy=d.y-d.r*0.4-Math.sin(a)*d.r*0.5;
        cx.fillStyle='#aaccee';cx.fillRect(ix|0,iy|0,2,2);
      }
      cx.globalAlpha=1;
      // Подсказка: "ЗАЖГИ МАЯК"
      if(d.linkedBeacon>=0&&G.droshSide&&!G.droshSide.beacons[d.linkedBeacon].fixed&&Math.floor(t/22)%2){
        const lbl='ЗАЖГИ МАЯК';
        bx2(d.x-gw(lbl)/2-2,d.y-d.r-12,gw(lbl)+4,9,P.UIB,'#888899',1);
        txt(lbl,d.x-gw(lbl)/2,d.y-d.r-10,'#aaccee',1);
      }
    }
  }

  // Снежинки на фоне (всегда)
  const inBliz=D.blizDur>0;
  for(const f of D.snowflakes){
    cx.globalAlpha=inBliz?0.85:0.55;
    cx.fillStyle=f.sz>1?'#ffffff':'#ddeeff';
    cx.fillRect(f.x|0,f.y|0,f.sz,f.sz);
    if(inBliz){
      // в метель снежинки оставляют "штрихи" в направлении ветра
      cx.globalAlpha=0.35;
      cx.strokeStyle='#aaccee';cx.lineWidth=1;
      cx.beginPath();cx.moveTo(f.x|0,f.y|0);cx.lineTo((f.x-D.blizDX*4)|0,(f.y-D.blizDY*4)|0);cx.stroke();
    }
  }
  cx.globalAlpha=1;

  // Тепло у зажжённых маяков
  for(const b of G.droshSide.beacons){
    if(b.fixed){cx.globalAlpha=.18;disc(b.x,b.y,28,'#ffaa44');cx.globalAlpha=.10;disc(b.x,b.y,42,'#ff7733');cx.globalAlpha=1;}
  }

  for(const c of G.crystals){
    if(c.collected)continue;
    const gx=c.x|0,gy=c.y|0;const bob=Math.sin(c.t)*1|0;
    cx.fillStyle='rgba(0,0,0,0.25)';cx.fillRect(gx-2,gy+3,5,1);
    cx.globalAlpha=.25+.2*Math.sin(c.t*1.5);disc(gx,gy+bob,5,P.CYA);cx.globalAlpha=1;
    rc(gx-1,gy-3+bob,3,5,P.IC3);rc(gx-2,gy-1+bob,5,2,P.ICE);rc(gx,gy-4+bob,1,7,'#ffffff');rc(gx-1,gy-2+bob,1,1,'#ffffff');
    if(Math.floor(c.t*5)%6===0)rc(gx+2,gy-3+bob,1,1,'#ffffff');
    const dx=G.pc.x-c.x,dy=G.pc.y-c.y;
    if(dx*dx+dy*dy<400){cx.globalAlpha=.5+.3*Math.sin(G.sT*.2);ring(gx,gy-1,8,P.CYA,1);cx.globalAlpha=1;}
  }
  if(G.droshSide){
    // ★ Найдём ближайший НЕзажжённый маяк (для стрелки-указателя)
    let nearestUnlit=null, nearestDist=Infinity;
    if(G.droshSide.questAccepted){
      for(const b of G.droshSide.beacons){
        if(b.fixed)continue;
        const d=Math.hypot(b.x-G.pc.x,b.y-G.pc.y);
        if(d<nearestDist){nearestDist=d;nearestUnlit=b;}
      }
    }

    for(const b of G.droshSide.beacons){
      b.t=(b.t||0)+.06;const bx=b.x|0,by=b.y|0;const hot=b.fixed;
      cx.fillStyle='rgba(0,0,0,0.3)';cx.fillRect(bx-4,by+6,9,2);
      rc(bx-3,by-7,7,13,hot?'#226644':'#34485a');rc(bx-2,by-8,5,2,hot?P.YEL:P.IC3);
      cx.globalAlpha=hot?.45:.18;disc(bx,by-12,hot?10:5,hot?P.YEL:P.CYA);cx.globalAlpha=1;
      // Пламя
      if(hot){const flick=0.7+0.3*Math.sin(t*0.4+bx);cx.globalAlpha=flick*0.8;rc(bx-1,by-14,3,3,P.YEL);cx.globalAlpha=flick*0.5;rc(bx,by-16,1,2,P.WHT);cx.globalAlpha=1;}

      // ★ Маркер незажжённого маяка — пульсирующее жёлтое кольцо над ним
      //   (только после принятия квеста, чтобы не спойлерить до диалога)
      if(!hot&&G.droshSide.questAccepted){
        const pulse=.5+.5*Math.sin(t*.18+bx*.1);
        cx.globalAlpha=.4+.4*pulse;
        ring(bx,by-22,3+pulse,P.YEL,1);
        cx.globalAlpha=.7+.3*pulse;
        rc(bx-1,by-23,3,1,P.YEL);rc(bx,by-24,1,3,P.YEL);  // мини-крестик внутри
        cx.globalAlpha=1;
      }

      // Подсказка "ЗАЖЕЧЬ" показывается только если квест уже принят.
      if(!hot&&G.droshSide.questAccepted&&Math.abs(G.pc.x-b.x)<16&&Math.abs(G.pc.y-b.y)<16&&Math.floor(t/18)%2){
        const lbl=USE_TOUCH_UI?'* ЗАЖЕЧЬ':'E ЗАЖЕЧЬ';
        const w=gw(lbl)+4;
        bx2(bx-w/2,by-25,w,10,P.YEL,P.WHT,1);
        txt(lbl,bx-w/2+2,by-23,P.BLK,1);
      }
    }

    // ★ Стрелка-указатель на ближайший незажжённый маяк, если он далеко
    if(nearestUnlit && nearestDist>34){
      const ang=Math.atan2(nearestUnlit.y-G.pc.y, nearestUnlit.x-G.pc.x);
      const r=14+2*Math.sin(t*.2);  // пульсация
      const ax=G.pc.x+Math.cos(ang)*r;
      const ay=G.pc.y+Math.sin(ang)*r-6;
      cx.globalAlpha=.85;
      // треугольник-стрелка
      const ca=Math.cos(ang),sa=Math.sin(ang);
      const _tri=(dx,dy)=>{const x=ax+dx*ca-dy*sa,y=ay+dx*sa+dy*ca;cx.fillRect(x|0,y|0,1,1);};
      cx.fillStyle=P.YEL;
      for(let i=0;i<5;i++){_tri(i,0);_tri(i-1,1);_tri(i-1,-1);}
      _tri(4,0);_tri(3,1);_tri(3,-1);_tri(2,2);_tri(2,-2);
      cx.globalAlpha=1;
    }
  }
  for(const n of G.npcs)drwNPC(n,G.pc.x,G.pc.y,t*1.2);drwPC(G.pc,t);

  // Холодное дыхание игрока (иней изо рта)
  if(D.warmth<60&&G.sT%18===0){
    PTS.push({x:G.pc.x+G.pc.facing*4,y:G.pc.y-3,vx:G.pc.facing*0.4,vy:-0.2,lf:18,ml:22,col:'#ddeeff',sz:1,gv:0,fade:0.55});
  }
  // Метель: затемнение + ускоренные снежинки
  if(inBliz){
    cx.globalAlpha=0.20;rc(0,28,LW,LH-28,'#446688');cx.globalAlpha=1;
    // Дополнительные быстрые снежинки в направлении ветра
    for(let i=0;i<22;i++){
      const fx=((i*47+t*Math.abs(D.blizDX*8))%LW+(D.blizDX>0?0:LW))%LW;
      const fy=30+((i*31+t*1.5)%(LH-32));
      cx.globalAlpha=0.65;cx.fillStyle='#ffffff';cx.fillRect(fx|0,fy|0,1,1);
      cx.globalAlpha=0.35;cx.strokeStyle='#cce8ff';cx.lineWidth=1;
      cx.beginPath();cx.moveTo(fx|0,fy|0);cx.lineTo((fx-D.blizDX*7)|0,(fy-D.blizDY*7)|0);cx.stroke();
    }
    cx.globalAlpha=1;
  }

  drwPts();drwDialog(G);

  // === ХОЛОДОВОЙ ОВЕРЛЕЙ ===
  // Чем меньше тепла у игрока, тем сильнее экран синит и появляется иней по краям.
  {
    const wp=D.warmth/D.mwarmth;
    if(wp<0.85){
      // Лёгкий синий тинт начинается уже при 85% тепла
      const intensity=Math.min(0.45,(0.85-wp)*0.65);
      cx.globalAlpha=intensity;
      cx.fillStyle='#3a7099';
      cx.fillRect(0,16,LW,LH-16);
      cx.globalAlpha=1;
      // Виньетка-рамка по краям при wp<45%
      if(wp<0.45){
        const vignAlpha=Math.min(0.55,(0.45-wp)*1.4);
        cx.globalAlpha=vignAlpha;
        rc(0,16,LW,6,'#1a4a7a');
        rc(0,LH-6,LW,6,'#1a4a7a');
        rc(0,16,6,LH-16,'#1a4a7a');
        rc(LW-6,16,6,LH-16,'#1a4a7a');
        cx.globalAlpha=vignAlpha*0.6;
        rc(0,22,LW,4,'#2a5a8a');
        rc(0,LH-10,LW,4,'#2a5a8a');
        rc(6,16,4,LH-16,'#2a5a8a');
        rc(LW-10,16,4,LH-16,'#2a5a8a');
        cx.globalAlpha=1;
      }
      // Иней по углам при критичном переохлаждении wp<30%
      if(wp<0.3){
        const frostAlpha=Math.min(0.65,(0.3-wp)*2.2);
        cx.globalAlpha=frostAlpha;
        cx.fillStyle='#ddeeff';
        // Симметричный иней по 4 углам
        const fr=[
          [4,20],[8,18],[12,22],[6,26],[16,20],[2,30],[10,30],[14,16],
          [LW-5,20],[LW-9,18],[LW-13,22],[LW-7,26],[LW-17,20],[LW-3,30],[LW-11,30],[LW-15,16],
          [4,LH-8],[8,LH-12],[12,LH-6],[6,LH-16],[16,LH-10],[2,LH-22],[10,LH-22],[14,LH-14],
          [LW-5,LH-8],[LW-9,LH-12],[LW-13,LH-6],[LW-7,LH-16],[LW-17,LH-10],[LW-3,LH-22],[LW-11,LH-22],[LW-15,LH-14],
        ];
        for(const f of fr){
          cx.fillRect(f[0],f[1],1,1);
          if(((f[0]+f[1])*7+t)%30<15)cx.fillRect(f[0]+1,f[1],1,1);
        }
        cx.globalAlpha=1;
      }
    }
  }

  drwNotif(G);

  // === HUD — одна строка, с правильными отступами ===
  rc(0,0,LW,16,P.UIB);rc(0,15,LW,1,P.DIM);
  // Слева направо:
  // [Название]  [ХП]   [КР]   [РЕ]   [Прогресс квеста]   [Действие/прогресс]   [TAB]
  // Шаги между элементами 8-10px для воздуха.
  txs('ДРОШ',4,3,P.PL2,P.BLK,1);
  // ХП
  txt('ХП:'+Math.floor(G.pl.hp),38,3,P.RED,1);
  // КР
  txt('КР:'+G.pl.cr,80,3,P.YEL,1);
  // РЕ
  txt('РЕ:'+G.pl.res,114,3,P.RES,1);

  // Прогресс квеста теперь отображается в правой верхней плашке (drwQuestPanel)

  // Прогресс посадки или взлёт
  // ★ v16 r5 #1: Индикатор привязан к квесту "удержание маяков" (G.droshDone уже алиас droshSide.done)
  if(!G.droshDone){
    if(G.droshSide&&G.droshSide.holdActive){
      // Фаза удержания: прогресс-бар времени
      const pct=Math.min(1,G.droshSide.holdT/G.droshSide.holdDur);
      txt('УДЕРЖИ',206,3,P.YEL,1);
      bar(232,4,40,5,pct,P.YEL,'#221800',P.DIM);
    }else if(G.droshSide&&G.droshSide.beacons){
      const lit=G.droshSide.beacons.filter(b=>b.fixed).length;
      const tot=G.droshSide.beacons.length;
      txt('МАЯК '+lit+'/'+tot,205,3,P.CYA,1);
      bar(232,4,40,5,lit/tot,P.CYA,'#001833',P.DIM);
    }
    // ★ v16 r9 #4: Кнопка взлёта убрана из интерфейса игрока — теперь только в интерфейсе корабля
    if(USE_TOUCH_UI){const lb=getBtn('launch');if(lb)lb.hidden=true;}
  }else{
    // ★ v16 r9 #4: Корабль-кнопка мигает когда взлёт готов (вместо отдельной L-кнопки)
    const pulse=.7+.3*Math.sin(G.sT*.18);cx.globalAlpha=pulse;
    txs('[S] ВЗЛЁТ ГОТОВ!',200,3,P.GRN,P.BLK,1);cx.globalAlpha=1;
    if(USE_TOUCH_UI){const lb=getBtn('launch');if(lb)lb.hidden=true;}
  }
  // TAB справа
  txt(USE_TOUCH_UI?'[S]':'TAB',LW-20,3,P.UIT2,1);

  // === ТЕРМОИНДИКАТОР НАД ИГРОКОМ ===
  // Маленькая шкала тепла парит над головой персонажа (без иконки).
  const wp=D.warmth/D.mwarmth;
  const wcol=wp>0.5?P.CYA:wp>0.25?P.YEL:P.RED;
  const indW=20;
  const ind_x=(G.pc.x-indW/2)|0;
  const ind_y=(G.pc.y-26)|0;
  // Фоновая плашка
  bx2(ind_x,ind_y,indW,7,'#0a1828',wcol,1);
  // Полоска температуры (на всю ширину плашки)
  bar(ind_x+2,ind_y+2,indW-4,3,wp,wcol,'#222244',P.DIM);
  // Восклицательный знак если критично — справа от шкалы
  if(wp<0.3&&Math.floor(t/8)%2){
    rc(ind_x+indW+1,ind_y,2,5,P.RED);
    rc(ind_x+indW+1,ind_y+6,2,1,P.RED);
  }

  drwQuestPanel(G);
  drwAlienBriefing(G);
  drwPauseIcon();drwJoystick();drwActionBtns();drwFTX();drawFlash();if(G.paused)drwPauseOverlay(G);drwTutorial(G);drawTrans();
}

// ======= BUBBLIKA =======
function bubblikaTradeGraph(){return{type:'graph',start:'intro',speaker:'БЛАБ',nodes:{
  intro:{text:['ИНЖЕНЕР БЛАБ:','О! ПРИШЕЛЕЦ.','НЕ ТРОГАЙ ЭТО. И ВОН ТО. И ВОН ТО ТОЖЕ.'],choices:[
    {label:'ЧТО ТЫ СТРОИШЬ?',goto:'what'},
    {label:'Я ИЩУ СНАРЯЖЕНИЕ В БОЙ.',goto:'deal'},
  ]},
  what:{text:['БЛАБ:','ЭНЕРГОЩИТ. СКОРЛУПА-7.','СОРОК ПОПЫТОК. СОРОК ПЕРВАЯ - ВЫШЛА.','Я НЕ ОСТАНАВЛИВАЮСЬ, ПОКА НЕ РАБОТАЕТ.'],goto:'deal'},
  deal:{text:['БЛАБ:','ТРИ РЕСУРСА - И ЧЕРТЁЖ ТВОЙ.','ЩИТ ПОГЛОЩАЕТ УРОН.','Я НЕ ТЕСТИРОВАЛ НА ЛЮДЯХ - ТЫ ПЕРВЫЙ.'],choices:[
    {label:'СОГЛАСЕН.',goto:'buy'},
    {label:'НЕ СЕЙЧАС.',goto:'nodeal'},
  ]},
  buy:{text:['БЛАБ:','ВОТ ЧЕРТЁЖ. ПОСТРОЙ НА ВЕРСТАКЕ.'],end:true,effect:(G)=>{
    if(G.campaignState.inventory.bubblikaContract){G.notif='У ТЕБЯ УЖЕ ЕСТЬ ЧЕРТЁЖ.';G.notifT=100;G.notifCol=P.UIT2;return;}
    if(G.pl.res>=3){G.pl.res-=3;G.campaignState.inventory.bubblikaContract=true;G.pl.men+=20;G.pl.en=G.pl.men;G.notif='+ЧЕРТЁЖ ЩИТА! ЭН МАКС +20';G.notifT=160;G.notifCol=P.RES;sfxPU();setTimeout(sfxPU,90);}
    else{G.notif='МАЛО РЕСУРСОВ! НУЖНО 3';G.notifT=120;G.notifCol=P.RED;sfxHit();}
  }},
  nodeal:{text:['БЛАБ:','БЕЗ ЩИТА ТУРЕЛИ ТИНЫ СДЕЛАЮТ ИЗ ТЕБЯ','ОЧЕНЬ ЯРКИЙ ДУРШЛАГ.','ВОЗВРАЩАЙСЯ, КОГДА РЕШИШЬ.'],end:true},
  after:{text:['БЛАБ:','ТЫ ЖИВ.','ЗНАЧИТ - СКОРЛУПА СРАБОТАЛА.','Я ЗАПИШУ: "СОРОК ПЕРВАЯ ПОПЫТКА - УСПЕХ".'],end:true},
}};}

function bubblikaElderGraph(){return{type:'graph',start:'hello',speaker:'ПФФФТ',nodes:{
  hello:{text:['ПФФФТ - СТАРЕЙШИНА:','ПРИШЕЛЕЦ.','ОТКУДА?','И КУДА ЛЕТИШЬ?'],choices:[
    {label:'С ДРОША. ЛЕЧУ К ТИНЕ.',goto:'journey'},
    {label:'ЕЩЁ НЕ РЕШИЛ. ЕСТЬ РАБОТА?',goto:'deliveryIntro'},
  ]},
  journey:{text:['ПФФФТ:','ДРОШ. ЗНАЧИТ - ВИДЕЛ ТЬМУ БЕЗ ЗВЕЗДЫ.','МЫ ТОЖЕ ВИДИМ. УЖЕ ДАВНО.','ВОЗЬМИ 30 КРЕДИТОВ - ПРИГОДЯТСЯ В ПУТИ.'],end:true,effect:(G)=>{
    if(!G.campaignState.flags.pfftGifted){G.pl.cr+=30;fText(LW/2,LH/2,'+30 КР',P.YEL);sfxPU();}
    G.campaignState.flags.pfftGifted=true;
  }},
  // === ДОСТАВКА ===
  deliveryIntro:{text:['ПФФФТ:','ДА. ОТНЕСИ ОБРАЗЦЫ СПОР НА 5 РАЗНЫХ ОСТРОВОВ.','ПО 50 КРЕДИТОВ ЗА КАЖДУЮ.','ПОСЛЕ КАЖДОЙ - ВОЗВРАЩАЙСЯ ЗА СЛЕДУЮЩЕЙ.'],choices:[
    {label:'СОГЛАСЕН. ДАЙ ПЕРВУЮ.',goto:'deliveryGive'},
    {label:'НЕ СЕЙЧАС.',goto:'no'},
  ]},
  deliveryGive:{text:['ПФФФТ:','ОБРАЗЕЦ ВЫДАН. ОСТОРОЖНО - ГЕЙЗЕРЫ.','ЗА СКОРОСТЬ - БОНУС.'],end:true,effect:(G)=>{
    const D=G.bub.delivery;
    if(!D.active)D.active=true;
    if(D.completed>=D.target){G.notif='УЖЕ ВСЁ ВЫПОЛНЕНО!';G.notifT=100;G.notifCol=P.UIT2;return;}
    if(D.carrying){G.notif='ТЫ УЖЕ НЕСЁШЬ ПОСЫЛКУ!';G.notifT=100;G.notifCol=P.UIT2;return;}
    const cur=G.bub.currentIsland;
    // ★ v16: Доставка на 5 РАЗНЫХ платформ — исключаем текущий и уже посещённые
    if(!D.deliveredTo)D.deliveredTo=[];
    const others=[];
    for(let i=0;i<G.bub.islands.length;i++){
      if(i===cur)continue;
      if(D.deliveredTo.indexOf(i)!==-1)continue;
      others.push(i);
    }
    // Защита: если вдруг все уже посещены (теоретически невозможно при 5 целях из 7), берём любой кроме текущего
    if(others.length===0)for(let i=0;i<G.bub.islands.length;i++)if(i!==cur)others.push(i);
    D.to=others[Math.floor(Math.random()*others.length)];
    D.carrying=true;
    D.timer=D.maxTimer;
    G.notif='ОТНЕСИ НА ОСТРОВ '+G.bub.islands[D.to].name+'!';G.notifT=160;G.notifCol=P.CYA;sfxPU();
  }},
  // Если уже завершил предыдущую и надо взять новую
  deliveryNext:{text:['ПФФФТ:','ХОРОШО. ВОТ СЛЕДУЮЩИЙ ОБРАЗЕЦ.','НЕ МЕДЛИ.'],end:true,effect:(G)=>{
    const D=G.bub.delivery;
    if(D.completed>=D.target){G.notif='ВСЁ УЖЕ ВЫПОЛНЕНО!';G.notifT=100;G.notifCol=P.UIT2;return;}
    if(D.carrying){G.notif='У ТЕБЯ УЖЕ ЕСТЬ ПОСЫЛКА!';G.notifT=100;G.notifCol=P.UIT2;return;}
    const cur=G.bub.currentIsland;
    // ★ v16: Доставка на 5 РАЗНЫХ платформ
    if(!D.deliveredTo)D.deliveredTo=[];
    const others=[];
    for(let i=0;i<G.bub.islands.length;i++){
      if(i===cur)continue;
      if(D.deliveredTo.indexOf(i)!==-1)continue;
      others.push(i);
    }
    if(others.length===0)for(let i=0;i<G.bub.islands.length;i++)if(i!==cur)others.push(i);
    D.to=others[Math.floor(Math.random()*others.length)];
    D.carrying=true;
    D.timer=D.maxTimer;
    G.notif='ОТНЕСИ НА ОСТРОВ '+G.bub.islands[D.to].name+'!';G.notifT=160;G.notifCol=P.CYA;sfxPU();
  }},
  deliveryDone:{text:['ПФФФТ:','ВСЕ ОБРАЗЦЫ ДОСТАВЛЕНЫ.','СПОРЫ - ЭТО ЖИЗНЬ ЭТОЙ ПЛАНЕТЫ.','ВЕТЕР ПОПУТНЫЙ ТЕБЕ.'],end:true,effect:(G)=>{
    if(G.campaignState.flags.bubDeliveryDone)return;
    G.campaignState.flags.bubDeliveryDone=true;
    G.pl.res+=3;G.pl.men+=15;G.pl.en=G.pl.men;
    showQuestReward(G,'ЗАДАНИЕ ВЫПОЛНЕНО',[
      {label:'+3 РЕСУРСА',col:P.RES},
      {label:'+15 МАКС. ЭНЕРГИИ',col:P.EN},
    ],P.YEL);
    flash(.3,P.YEL);sfxPU();setTimeout(sfxPU,80);setTimeout(sfxPU,160);
  }},
  deliveryCarry:{text:['ПФФФТ:','У ТЕБЯ ПОСЫЛКА. ОТНЕСИ - ВЕРНИСЬ.'],end:true},
  no:{text:['ПФФФТ:','ОК. ПРЕДЛОЖЕНИЕ ОСТАЁТСЯ.'],end:true},
  repeat:{text:['ПФФФТ:','СНОВА ТЫ.','ЕСТЬ РАБОТА - ЕСЛИ НУЖНО.'],choices:[
    {label:'ЕСТЬ РАБОТА?',goto:'deliveryIntro'},
    {label:'НЕТ, СПАСИБО.',goto:'bye'},
  ]},
  bye:{text:['ПФФФТ:','УДАЧИ В ПУТИ.'],end:true},
}};}

function startDlgGraph(G,npc){
  sfxUI2();const g=npc.graph;let start=g.start;
  if(npc.id==='pfft'){
    const D=G.bub&&G.bub.delivery;
    if(D){
      if(D.completed>=D.target&&!G.campaignState.flags.bubDeliveryDone)start='deliveryDone';
      else if(D.carrying)start='deliveryCarry';
      else if(D.active&&D.completed>0&&D.completed<D.target)start='deliveryNext';
      else if(G.campaignState.flags.pfftGifted)start='repeat';
    }else if(G.campaignState.flags.pfftGifted)start='repeat';
  }
  if(npc.id==='blab'&&G.campaignState.inventory.bubblikaContract)start='after';
  if(npc.id==='mrau'){
    if(G.krasDone)start='repeatDone';
    else if(G.krz&&G.krz.questActive)start='repeat';
  }
  // Дрош NPC: повторный диалог при возврате
  if(npc.id==='klirr'&&G._met_klirr&&g.nodes.repeat)start='repeat';
  if(npc.id==='zorp'&&G._met_zorp&&g.nodes.repeat)start='repeat';
  if(npc.id==='krok'&&G._met_krok&&g.nodes.repeat&&G.campaignState.inventory.krokRecords)start='repeat';
  // ★ Phase 3.3: после завершения квеста Дроша — особый "post_quest" узел Клирра
  //   (приоритет над 'repeat')
  if(npc.id==='klirr'&&G.droshDone&&g.nodes.post_quest)start='post_quest';
  // Помечаем что встретились
  if(npc.id==='klirr')G._met_klirr=true;
  if(npc.id==='zorp')G._met_zorp=true;
  if(npc.id==='krok')G._met_krok=true;
  // ★ Phase 5.3: учёт встреченных NPC — для достижения "Кошка в курсе"
  if(!G._aNpcsTalked)G._aNpcsTalked={};
  if(npc.id&&!G._aNpcsTalked[npc.id]){
    G._aNpcsTalked[npc.id]=true;
    if(Object.keys(G._aNpcsTalked).length>=7)unlockAchievement(G,'catChat');
  }
  G.dlg={mode:'graph',graph:g,node:start,choiceIdx:0,speaker:g.speaker||npc.name,prevAllowJoy:ALLOW_JOY};
  G.dlgChar=0;setJoyEnabled(false);
}

function initPlanetBubblika(G){
  TAP_FIRE=false;ALLOW_JOY=true;G.state='planet_bubblika';G.shipReturnState='planet_bubblika';
  G.dlg=null;G.dlgChar=0;
  G.notif='ПОГОВОРИ С ПФФФТОМ.';G.notifT=180;G.notifCol=P.BUB3;
  G.bub={
    // === НОВАЯ КАРТА: 7 платформ образуют мини-лабиринт ===
    // Платформы стали меньше и расположены на разных высотах для создания петель.
    islands:[
      {x:4,y:120,w:64,thick:6,name:'З1'},    // 0: левый низ (стартовая)
      {x:74,y:90,w:50,thick:6,name:'Ц1'},    // 1: центр-средний
      {x:134,y:55,w:46,thick:6,name:'В1'},   // 2: верхний средний
      {x:194,y:85,w:50,thick:6,name:'В2'},   // 3: правый средний
      {x:252,y:118,w:64,thick:6,name:'П1'},  // 4: правый низ
      {x:24,y:60,w:44,thick:6,name:'З2'},    // 5: верхний левый (тупик)
      {x:170,y:130,w:44,thick:6,name:'Н1'},  // 6: нижний центральный
    ],
    // === ПРЫЖКОВЫЕ ПАДЫ: образуют связи между островами ===
    // Каждая пара (a→b, b→a) разрешает прыжок в обоих направлениях.
    pads:[
      // Левая нижняя (4..68) -> Центр (74..124)
      {x:60,iIdx:0,to:1},{x:80,iIdx:1,to:0},
      // Центр -> Верхний средний (134..180)
      {x:118,iIdx:1,to:2},{x:138,iIdx:2,to:1},
      // Верхний средний -> Правый средний (194..244)
      {x:174,iIdx:2,to:3},{x:200,iIdx:3,to:2},
      // Правый средний -> Правая нижняя (252..316)
      {x:238,iIdx:3,to:4},{x:258,iIdx:4,to:3},
      // ПЕТЛЯ: Левая нижняя -> Верхний левый (24..68)
      {x:10,iIdx:0,to:5},{x:30,iIdx:5,to:0},
      // Центр -> Нижний центральный (170..214)
      {x:96,iIdx:1,to:6},{x:174,iIdx:6,to:1},
      // Правая нижняя -> Нижний центральный
      {x:260,iIdx:4,to:6},{x:208,iIdx:6,to:4},
    ],
    flying:null,currentIsland:0,
    clouds:Array.from({length:18},()=>({x:Math.random()*LW,y:30+Math.random()*(LH-40),sp:.2+Math.random()*.4,sz:8+Math.random()*18,col:Math.random()<.5?P.BUB_GAS1:P.BUB_GAS2})),
    padSel:0,selCD:0,
    // === СПОРЫ: 4 штуки разбросаны по платформам, включая тупик ===
    spores:[
      {i:0,x:36,t:0,got:false},     // на левой нижней (4..68, центр ~36)
      {i:5,x:46,t:1.0,got:false},   // в верхнем-левом тупике (24..68)
      {i:2,x:156,t:2.0,got:false},  // верхний средний (134..180)
      {i:4,x:284,t:3.0,got:false},  // правый низ (252..316)
    ],
    sideDone:!!G.campaignState.flags.bubSideDone,
    sporeShield:0,
    sporeShieldT:0,
    sporeMaxShield:0,
    windDX:0.5, windT:0, windNext:120+((Math.random()*120)|0), windTargetDX:0.5,
    // ★ Phase 4.1: плавающие пузыри в атмосфере
    bubbles:Array.from({length:14},()=>({
      x:Math.random()*LW,
      y:30+Math.random()*(LH-40),
      r:4+Math.random()*11,         // диаметр 8..30
      vy:-0.2-Math.random()*0.2,    // всплывают (vy -0.2..-0.4)
      wobblePh:Math.random()*Math.PI*2,
      wobbleAmp:0.5+Math.random()*1.2,
      t:0,
    })),
    // === ГЕЙЗЕРЫ: размещены под уязвимыми платформами ===
    geysers:[
      {x:103,y:LH-1,maxH:170,t:0,active:false,nextT:60+((Math.random()*40)|0),warmup:0,intensity:0,wobble:Math.random()*Math.PI*2},
      {x:175,y:LH-1,maxH:185,t:0,active:false,nextT:90+((Math.random()*40)|0),warmup:0,intensity:0,wobble:Math.random()*Math.PI*2},
      {x:228,y:LH-1,maxH:175,t:0,active:false,nextT:130+((Math.random()*40)|0),warmup:0,intensity:0,wobble:Math.random()*Math.PI*2},
    ],
    falling:null,
    delivery:{
      active:false,
      carrying:false,
      to:-1,
      timer:0,maxTimer:520,
      completed:0,target:5,reward:50,
      // ★ v16: Track destinations to ensure 5 deliveries go to 5 DIFFERENT islands
      deliveredTo:[],
    },
  };
  if(G.bub.sideDone){
    for(const sp of G.bub.spores)sp.got=true;
    if(G.bub.sporeShield===0)G.bub.sporeShield=4;
    G.bub.sporeMaxShield=4;
  }
  const i0=G.bub.islands[0];G.pc={x:i0.x+i0.w/2,y:i0.y-1,facing:1,wt:0};
  G.npcs=[
    // Блаб теперь стоит на правой нижней платформе (центральная для торговли)
    {id:'blab',x:284,y:117,col:P.BUB3,name:'БЛАБ',graph:bubblikaTradeGraph(),near:false,wRadius:22,
      // ! над Блабом если у игрока есть 3 ресурса и ещё нет чертежа
      questAvailable:(G)=>G&&!G.campaignState.inventory.bubblikaContract&&G.pl.res>=3},
    // Пффффт на верхней платформе (мудрец живёт высоко)
    {id:'pfft',x:157,y:54,col:'#88eeff',name:'ПФФФТ',graph:bubblikaElderGraph(),near:false,wRadius:18,
      // ! над Пфффтом в трёх случаях:
      // 1) Квест ещё не активен (можно взять)
      // 2) У игрока нет посылки в руках, но он завершил доставку и должен вернуться за следующей
      // 3) Все 5 доставок выполнены — нужно прийти за финальной наградой
      questAvailable:(G)=>{
        if(!G||!G.bub||!G.bub.delivery)return false;
        if(G.campaignState.flags.bubDeliveryDone)return false;
        const D=G.bub.delivery;
        // (1) квест ещё не взят
        if(!D.active)return true;
        // Если игрок несёт посылку — ! над Пфффтом не нужен (нужно нести в указанное место)
        if(D.carrying)return false;
        // (2) Завершил все: пришли за наградой / (3) или нужно взять следующую
        return D.completed<=D.target;
      }},
  ];
  PTS.length=0;FTX.length=0;resetBtns();
  if(USE_TOUCH_UI){addBtn('int',LW-20,LH-20,12,'*',P.YEL);addBtn('ship',20,24,10,'S',P.UIT);addBtn('jump',LW-20,LH-48,12,'J',P.CYA);}
}

function bubNearestPad(G){const pc=G.pc,B=G.bub;let best=null,bd=16;for(const pad of B.pads){if(pad.iIdx!==B.currentIsland)continue;const d=Math.abs(pc.x-pad.x);if(d<bd){bd=d;best=pad;}}return best;}

// Симулирует траекторию прыжка с учётом ветра (для предпросмотра)
function bubSimJump(sx,sy,tx,ty,wind){
  const pts=[];const steps=20;
  for(let i=0;i<=steps;i++){
    const p=i/steps;
    const x=sx+(tx-sx)*p+wind*p*(1-p)*60;  // ветер сильнее всего в середине дуги
    const y=sy+(ty-sy)*p-Math.sin(p*Math.PI)*26;
    pts.push({x,y});
  }
  return pts;
}

function updPlanetBubblika(G){
  handlePauseInput(G);if(G.paused)return;
  G.notifT=Math.max(0,G.notifT-1);const B=G.bub;
  if(G.dlg){updDialog(G);G.sT++;flushIn();return;}
  G.sT++;
  // ★ Phase 4.1: обновление пузырей — всплытие + sin-колебание по X, респавн у нижней границы
  if(B.bubbles){
    for(const b of B.bubbles){
      b.t++;
      b.y+=b.vy;
      // sin-колебание относительно базовой X (накапливается малыми смещениями)
      b.x+=Math.sin(b.t*0.05+b.wobblePh)*0.15*b.wobbleAmp;
      if(b.y<-b.r){
        // вышел сверху — респавн внизу
        b.y=LH+b.r;
        b.x=Math.random()*LW;
        b.r=4+Math.random()*11;
        b.vy=-0.2-Math.random()*0.2;
      }
    }
  }

  // Ветер плавно меняется. Несильный обычно, периодически порывы.
  B.windT++;
  if(B.windT>=B.windNext){
    B.windT=0;B.windNext=140+((Math.random()*180)|0);
    // Иногда сильный порыв (20% шанс)
    if(Math.random()<0.20)B.windTargetDX=(Math.random()<0.5?-1:1)*(2.5+Math.random()*0.8);
    else B.windTargetDX=(Math.random()-0.5)*1.6;
  }
  B.windDX+=(B.windTargetDX-B.windDX)*0.012;

  // Гейзеры: warmup -> active -> down. Высокие мощные столбы.
  for(const g of B.geysers){
    g.wobble+=0.08;
    g.nextT--;
    if(g.nextT<=0){
      if(!g.active&&g.warmup<=0){
        // Начало предупреждения — более длинное, чтобы успеть среагировать
        g.warmup=50;g.nextT=999;
        // Тихое булькание воды — мягче чем было
        bip(90,.25,.05,'sine',150,80);
        // Лёгкое содрогание основания
        addShockwave(g.x,g.y,8,'#88ccff',14);
      }
    }
    if(g.warmup>0){
      g.warmup--;
      // Пузыри во время разогрева
      if(g.warmup%3===0){
        for(let i=0;i<2;i++)PTS.push({
          x:g.x+(Math.random()-0.5)*10,
          y:g.y-Math.random()*4,
          vx:(Math.random()-0.5)*0.5,
          vy:-0.5-Math.random()*0.5,
          lf:18,ml:22,col:Math.random()<0.5?'#88ddff':'#ffffff',sz:1+(Math.random()<0.4?1:0),gv:0,fade:0.55
        });
      }
      // Мини-всплески
      if(g.warmup>30&&g.warmup%8===0){
        for(let i=0;i<3;i++)PTS.push({
          x:g.x+(Math.random()-0.5)*6,
          y:g.y-Math.random()*8,
          vx:(Math.random()-0.5)*1.2,
          vy:-1.2-Math.random()*0.8,
          lf:14,ml:18,col:'#aaeeff',sz:1,gv:0.05,fade:0.6
        });
      }
      if(g.warmup<=0){
        // Гейзер начал стрелять — звук менее громкий и более похож на реальный гейзер
        // Низкий шум воды + средний свист пара
        g.active=true;g.t=0;g.intensity=0;g.nextT=85+((Math.random()*30)|0);
        bip(60,.8,.10,'sawtooth',180,40);    // глубокий низ
        bip(180,.6,.06,'sine',420,160);      // средний свист
        bip(280,.4,.04,'sine',520,260);      // высокий свист
        addShockwave(g.x,g.y,28,'#ddffff',24);
        addShockwave(g.x,g.y,16,'#ffffff',18);
        shake(2);
      }
    }
    if(g.active){
      g.t++;
      // Интенсивность нарастает в первые 20 кадров, держится, спадает в конце
      if(g.t<20)g.intensity=g.t/20;
      else if(g.t>g.nextT-20)g.intensity=Math.max(0,(g.nextT-g.t)/20);
      else g.intensity=1;
      // плавное затухание - после спада интервал 130-220 (раньше было 240+)
      if(g.t>g.nextT){g.active=false;g.intensity=0;g.nextT=130+((Math.random()*90)|0);}
      // Активные брызги — много частиц по всей высоте столба
      const curH=Math.min(g.maxH,g.t*10)*g.intensity;
      if(g.t%2===0){
        // Верхушка — большие капли разлетаются в стороны
        for(let i=0;i<4;i++)PTS.push({
          x:g.x+(Math.random()-0.5)*9,
          y:g.y-curH+Math.random()*15,
          vx:(Math.random()-0.5)*2.6,
          vy:-2.4-Math.random()*1.6,
          lf:35,ml:42,col:Math.random()<0.5?'#ffffff':'#aaeeff',sz:1+(Math.random()<0.4?1:0),gv:0.05,fade:0.6
        });
        // Боковые брызги по столбу
        for(let i=0;i<2;i++){
          const py=g.y-Math.random()*curH;
          PTS.push({
            x:g.x+(Math.random()-0.5)*16,
            y:py,
            vx:(Math.random()-0.5)*1.8,
            vy:-0.5-Math.random()*0.8,
            lf:22,ml:28,col:'#88ccee',sz:1,gv:0.04,fade:0.55
          });
        }
      }
      // Громкий звук в пиковой фазе
      if(g.t%18===0&&g.intensity>0.7){
        bip(70+Math.random()*30,.15,.1,'sawtooth',120,50);
      }
    }
  }

  // ===== РЕЖИМ ПАДЕНИЯ =====
  if(B.falling){
    const f=B.falling;
    f.t++;
    if(f.phase==='down'){
      // Падает за пределы экрана
      G.pc.y+=f.vy;f.vy+=0.12;G.pc.x+=f.vx*0.95;f.vx*=0.985;
      // Эффекты — следы конденсата
      if(f.t%2===0)PTS.push({x:G.pc.x,y:G.pc.y-3,vx:(Math.random()-.5)*.4,vy:-0.2-Math.random()*0.3,lf:14,ml:18,col:'#ddccff',sz:1,gv:0,fade:0.55});
      if(G.pc.y>LH+30){
        // Уходит за нижний край — пауза, потом возврат гейзером
        f.phase='wait';f.t=0;
        // Создаём "спасательный гейзер" под позицией остров возврата
        const targetI=B.islands[f.toIdx];
        f.geyserX=Math.max(targetI.x+10,Math.min(targetI.x+targetI.w-10,G.pc.x));
        f.geyserY=LH-1;
        // Сообщение
        G.notif='ГЕЙЗЕР ВЫНОСИТ ОБРАТНО!';G.notifT=80;G.notifCol=P.CYA;
      }
    }else if(f.phase==='wait'){
      // Короткая пауза
      G.pc.y=LH+40;G.pc.x=f.geyserX;
      // Подготовка гейзера — пузыри снизу
      if(f.t%2===0){
        const baseY=LH-2;
        for(let i=0;i<3;i++)PTS.push({
          x:f.geyserX+(Math.random()-0.5)*8,
          y:baseY-Math.random()*8,
          vx:(Math.random()-0.5)*0.6,
          vy:-0.3-Math.random()*0.3,
          lf:16,ml:20,col:'#88ddff',sz:1,gv:0,fade:0.6
        });
      }
      if(f.t>30){
        f.phase='up';f.t=0;
        // Резкий выброс
        sfxBoom();shake(5);flash(.25,P.CYA);
        addShockwave(f.geyserX,LH-1,30,P.CYA,30);
      }
    }else if(f.phase==='up'){
      // Гейзер выталкивает игрока вверх к платформе
      const targetI=B.islands[f.toIdx];
      const targetY=targetI.y-1;
      const ty=targetY,tx=f.geyserX;
      // плавная анимация подъёма
      const totalDur=42;
      const p=Math.min(1,f.t/totalDur);
      // Старт у LH+40, пик чуть выше платформы, посадка на платформу
      const easeOut=1-(1-p)*(1-p);
      G.pc.y=(LH+40)+(ty-(LH+40))*easeOut-Math.sin(p*Math.PI)*8;
      G.pc.x=tx;
      // Видимый столб воды снизу
      const colH=Math.min(LH-ty,(LH+40)-G.pc.y+20);
      // Брызги от столба
      if(f.t%2===0){
        for(let i=0;i<4;i++)PTS.push({
          x:tx+(Math.random()-0.5)*8,
          y:Math.max(ty,G.pc.y+Math.random()*20),
          vx:(Math.random()-0.5)*1.4,vy:-1.5-Math.random(),
          lf:24,ml:30,col:Math.random()<0.5?'#aaeeff':'#ffffff',sz:1+(Math.random()<0.3?1:0),
          gv:0.04,fade:0.55
        });
      }
      // Сохраняем геометрию столба для отрисовки
      f.colH=colH;f.colX=tx;f.colTopY=G.pc.y+4;
      if(f.t>=totalDur){
        // Приземление
        G.pc.y=ty;G.pc.x=tx;
        B.currentIsland=f.toIdx;
        B.falling=null;
        sfxLand();shake(2);
        spPts(tx,ty,12,[P.CYA,P.WHT,P.BUB3],.5,2.5,18,.02);
      }
    }
    for(const c of B.clouds){c.x-=c.sp;if(c.x<-c.sz){c.x=LW+c.sz;c.y=30+Math.random()*(LH-40);}}
    updPts();updFTX();updSHK();return;
  }

  // ===== РЕЖИМ ПОЛЁТА (прыжок между островами) =====
  if(B.flying){
    const f=B.flying;f.t++;const p=Math.min(1,f.t/f.dur);
    // Ветер НЕ влияет на траекторию прыжка
    G.pc.x=f.sx+(f.tx-f.sx)*p;
    G.pc.y=f.sy+(f.ty-f.sy)*p-Math.sin(p*Math.PI)*26;
    if(f.t%2===0)PTS.push({x:G.pc.x,y:G.pc.y+2,vx:(Math.random()-.5)*.5,vy:(Math.random()-.5)*.3,lf:20,ml:22,col:Math.random()<.5?P.BUB3:P.CYA,sz:1,gv:0,fade:.6});

    // Проверка попадания в гейзер во время прыжка
    for(const g of B.geysers){
      if(!g.active||g.intensity<0.3)continue;
      const colH=Math.min(g.maxH,g.t*10)*g.intensity;
      // Шире хитбокс (10 вместо 7)
      if(Math.abs(G.pc.x-g.x)<10&&G.pc.y>g.y-colH&&G.pc.y<g.y){
        // Если есть запас щита от споры — тратим, проходим невредимыми
        if(B.sporeShield>0){
          B.sporeShield--;
          B.sporeShieldT=30;
          flash(.25,'#aaffcc');shake(2);
          spPts(G.pc.x,G.pc.y,18,['#aaffcc',P.CYA,P.WHT],.6,2.2,20,.02);
          fText(G.pc.x,G.pc.y-12,'СПОРА ЗАЩИТА!',P.CYA);
          bip(700,.15,.12,'sine',900,500);
          continue;
        }
        // ★ v16 r12 #2: Урон гейзера 25 → 15
        sfxHit();shake(8);flash(.45,P.CYA);G.pl.hp=Math.max(1,G.pl.hp-15);
        fText(G.pc.x,G.pc.y-12,'-15 ХП',P.RED);
        spPts(G.pc.x,G.pc.y,32,[P.BUB3,P.CYA,P.WHT,'#aaeeff'],1,4,30,.02,2);
        B.flying=null;
        B.falling={phase:'down',t:0,vx:(Math.random()-0.5)*1.4,vy:1.2,toIdx:B.currentIsland};
        // Если несёт посылку - теряет
        if(B.delivery.carrying){
          B.delivery.carrying=false;B.delivery.to=-1;
          G.notif='ПОСЫЛКА ПОТЕРЯНА! ВЕРНИСЬ К ПФФФТУ.';G.notifT=160;G.notifCol=P.RED;
        }
        return;
      }
    }
    if(p>=1){
      B.flying=null;G.pc.x=f.tx;G.pc.y=f.ty;
      const targetI=B.islands[f.toIdx];
      if(G.pc.x<targetI.x-12||G.pc.x>targetI.x+targetI.w+12){
        // Промахнулся мимо платформы → падение
        sfxHit();G.pl.hp=Math.max(1,G.pl.hp-6);
        fText(G.pc.x,G.pc.y-12,'-6 ХП',P.RED);
        B.falling={phase:'down',t:0,vx:0,vy:0.6,toIdx:B.currentIsland};
        if(B.delivery.carrying){G.notif='УПАЛ! ПОСЫЛКА УЦЕЛЕЛА.';G.notifT=120;G.notifCol=P.YEL;}
        return;
      }else{
        G.pc.x=Math.max(targetI.x,Math.min(targetI.x+targetI.w,G.pc.x));
        B.currentIsland=f.toIdx;spPts(G.pc.x,G.pc.y,10,[P.BUB3,P.WHT,P.CYA],.4,2,16);shake(2);
      }
    }
    for(const c of B.clouds){c.x-=c.sp;if(c.x<-c.sz){c.x=LW+c.sz;c.y=30+Math.random()*(LH-40);}}
    updPts();updFTX();updSHK();return;
  }

  // ===== ОБЫЧНОЕ ХОЖДЕНИЕ =====
  const pc=G.pc,spd=1.05;let ix=0;
  if(K.KeyA||K.ArrowLeft)ix-=1;if(K.KeyD||K.ArrowRight)ix+=1;
  if(USE_TOUCH_UI&&TOUCH.joyActive)ix=TOUCH.joyDX;
  let mv=false;if(ix){pc.x+=(ix/Math.abs(ix))*spd;pc.facing=ix>0?1:-1;mv=true;}
  if(mv)pc.wt++;else pc.wt=0;

  const I=B.islands[B.currentIsland];
  // Сильный ветер сдвигает игрока на платформе
  const strongWind=Math.abs(B.windDX)>2.0;
  if(strongWind){
    pc.x+=B.windDX*0.20;
    // Визуально показываем, что игрока сносит
    if(G.sT%5===0)PTS.push({x:pc.x,y:pc.y-2+Math.random()*4,vx:B.windDX*0.6,vy:(Math.random()-0.5)*0.2,lf:14,ml:18,col:P.BUB3,sz:1,gv:0,fade:0.5});
  }

  pc.y=I.y-1;

  // Проверка попадания гейзера в игрока стоящего на платформе
  // (если столб гейзера достаёт до уровня платформы — он сбивает игрока)
  for(const g of B.geysers){
    if(!g.active||g.intensity<0.5)continue;
    const colH=Math.min(g.maxH,g.t*10)*g.intensity;
    const colTopY=g.y-colH; // верх столба
    // столб дотягивается до игрока (с небольшим запасом 4px)?
    if(colTopY>pc.y+4)continue;
    if(Math.abs(pc.x-g.x)<10){
      // Если есть запас щита от споры — тратим, проходим невредимыми
      if(B.sporeShield>0){
        B.sporeShield--;B.sporeShieldT=30;
        flash(.25,'#aaffcc');shake(2);
        spPts(pc.x,pc.y,18,['#aaffcc',P.CYA,P.WHT],.6,2.2,20,.02);
        fText(pc.x,pc.y-12,'СПОРА ЗАЩИТА!',P.CYA);
        bip(700,.15,.12,'sine',900,500);
        // Отшвыриваем игрока в сторону, чтобы он не попадал ещё раз
        pc.x+=(pc.x<g.x?-12:12);
        pc.x=Math.max(I.x-3,Math.min(I.x+I.w+3,pc.x));
        break;
      }
      // Прямое попадание гейзера снизу — сбрасывает с платформы
      sfxHit();shake(8);flash(.45,P.CYA);G.pl.hp=Math.max(1,G.pl.hp-25);
      fText(pc.x,pc.y-12,'-25 ХП',P.RED);
      spPts(pc.x,pc.y,32,[P.BUB3,P.CYA,P.WHT,'#aaeeff'],1,4,30,.02,2);
      // Сбрасываем игрока вниз — гейзер выбросит обратно
      const fallVx=(pc.x<g.x?-0.4:0.4)+(Math.random()-0.5)*1.2;
      B.falling={phase:'down',t:0,vx:fallVx,vy:-1.5,toIdx:B.currentIsland};
      if(B.delivery.carrying){
        B.delivery.carrying=false;B.delivery.to=-1;
        G.notif='ПОСЫЛКА ПОТЕРЯНА! ВЕРНИСЬ К ПФФФТУ.';G.notifT=160;G.notifCol=P.RED;
      }
      return;
    }
  }

  // Проверка падения с края платформы
  if(pc.x<I.x-3||pc.x>I.x+I.w+3){
    // Игрок свалился с платформы
    sfxHit();shake(3);
    const fallVx=pc.x<I.x?-0.8:0.8;
    B.falling={phase:'down',t:0,vx:fallVx+(strongWind?B.windDX*0.3:0),vy:0.6,toIdx:B.currentIsland};
    if(strongWind){G.notif='ВЕТЕР СНЁС С ПЛАТФОРМЫ!';G.notifT=120;G.notifCol=P.RED;}
    else{G.notif='УПАЛ С ПЛАТФОРМЫ!';G.notifT=120;G.notifCol=P.RED;}
    G.pl.hp=Math.max(1,G.pl.hp-4);fText(pc.x,pc.y-12,'-4 ХП',P.RED);
    return;
  }
  pc.x=Math.max(I.x-3,Math.min(I.x+I.w+3,pc.x));

  const pad=bubNearestPad(G);const wantsJump=KD.KeyJ||btnJust('jump')||KD.Space;
  if(pad&&wantsJump){
    const targetIsland=B.islands[pad.to];
    const backPad=B.pads.find(pp=>pp.iIdx===pad.to&&pp.to===pad.iIdx);
    const tx=backPad?backPad.x:(targetIsland.x+targetIsland.w/2);
    B.flying={t:0,dur:30,sx:pc.x,sy:pc.y,tx,ty:targetIsland.y-1,toIdx:pad.to};
    sfxUI2();spPts(pc.x,pc.y,8,[P.BUB3,P.CYA,P.WHT],.4,2,14);shake(1.5);
    return;
  }

  let nearNPC=null;for(const n of G.npcs){n.near=Math.abs(pc.x-n.x)<22&&Math.abs(pc.y-n.y)<22;if(n.near&&!nearNPC)nearNPC=n;}

  // Доставка: таймер идёт только пока несёшь посылку
  if(B.delivery.active&&B.delivery.carrying){
    B.delivery.timer--;
    if(B.delivery.timer<=0){
      // Время вышло — посылка испорчена, нужно вернуться к Пфффту за новой
      B.delivery.carrying=false;B.delivery.to=-1;
      G.notif='ВРЕМЯ ВЫШЛО! ВЕРНИСЬ К ПФФФТУ.';G.notifT=140;G.notifCol=P.RED;sfxHit();
    }else if(B.currentIsland===B.delivery.to){
      // Успешная доставка — посылка сдана. Пора возвращаться к Пфффту.
      // ★ v16: Запоминаем остров — посылки идут на 5 РАЗНЫХ платформ
      if(!B.delivery.deliveredTo)B.delivery.deliveredTo=[];
      if(B.delivery.deliveredTo.indexOf(B.delivery.to)===-1)B.delivery.deliveredTo.push(B.delivery.to);
      B.delivery.completed++;G.pl.cr+=B.delivery.reward;
      B.delivery.carrying=false;B.delivery.to=-1;
      fText(LW/2,LH/2,'+'+B.delivery.reward+' КР',P.YEL);sfxPU();spPts(pc.x,pc.y,16,[P.YEL,P.BUB3,P.WHT],.5,2.5,20,.02);
      if(B.delivery.completed>=B.delivery.target){
        G.notif='ВСЕ '+B.delivery.target+' ДОСТАВЛЕНЫ! ВЕРНИСЬ К ПФФФТУ.';G.notifT=200;G.notifCol=P.YEL;
      }else{
        // Уменьшаем время для следующей посылки
        B.delivery.maxTimer=Math.max(320,520-B.delivery.completed*40);
        G.notif=B.delivery.completed+'/'+B.delivery.target+' СДАНО. ВЕРНИСЬ К ПФФФТУ ЗА СЛЕД.';G.notifT=160;G.notifCol=P.CYA;
      }
    }
  }

  // Споры — собираемые в любой момент. Каждая даёт +1 заряд "защиты от гейзера".
  // Это НЕ квест — просто сбор полезных предметов.
  for(const sp of B.spores){
    if(sp.got||sp.i!==B.currentIsland)continue;
    const sx=sp.x,sy=B.islands[sp.i].y-8;
    if(Math.abs(pc.x-sx)<10&&Math.abs(pc.y-sy)<12){
      sp.got=true;sfxPU();spPts(sx,sy,16,[P.BUB3,P.CYA,P.WHT],.55,2.4,20,.02);addShockwave(sx,sy,14,P.CYA);fText(sx,sy-12,'+1 ЗАЩИТА',P.CYA);
      B.sporeShield++;B.sporeMaxShield++;
      G.notif='СПОРА ЗАЩИТЫ ОТ ГЕЙЗЕРОВ +1';G.notifT=110;G.notifCol=P.CYA;
    }
  }
  // Эффект щита от споры — таймер уменьшается
  if(B.sporeShieldT>0)B.sporeShieldT--;

  if((KD.KeyE||KD.Enter||btnJust('int'))&&nearNPC)startDlgGraph(G,nearNPC);
  if(KD.Tab||btnJust('ship')){startTrans(()=>{G.shipReturnState='planet_bubblika';G.state='ship_view';G.shipUI='main';G.shipT=0;TAP_FIRE=false;resetBtns();addBtn('back',20,24,10,'<',P.UIT);ALLOW_JOY=false;TAP_FIRE=false;TOUCH.joyId=-1;TOUCH.joyActive=false;});}
  // ★ v16 r4 (other-2): Чертёж от Блаба сам по себе НЕ открывает взлёт. Нужны оба:
  // 1) Завершённая доставка от Пфффта (5/5)
  // 2) Чертёж щита от Блаба
  // bubblikaDone = true только когда оба условия выполнены
  const pfftDone=B.delivery&&B.delivery.completed>=B.delivery.target;
  const blabDone=!!G.campaignState.inventory.bubblikaContract;
  if(!G.bubblikaDone&&pfftDone&&blabDone){
    G.bubblikaDone=true;G.pl.cr+=100;
    // ★ Phase 5.3: спаситель Бубблики
    unlockAchievement(G,'bubblikaSave');
    showQuestReward(G,'ПЛАНЕТА ПРОЙДЕНА',[
      {label:'+100 КРЕДИТОВ',col:P.YEL},
      {label:'МАРШРУТ ОТКРЫТ',col:P.GRN},
    ],P.GRN);
    spPts(LW/2,LH/2,30,[P.BUB3,P.YEL,P.WHT,P.GRN],.6,3.5,32,.02,2);
    flash(.4,P.GRN);sfxPU();setTimeout(sfxPU,80);setTimeout(sfxPU,160);
  }
  // Уведомление при получении чертежа щита (отдельно от завершения квеста)
  if(blabDone&&!G._blabNotified){
    G._blabNotified=true;
    G.notif='ЧЕРТЁЖ ЩИТА ПОЛУЧЕН! ПОСТРОЙ НА ВЕРСТАКЕ!';
    G.notifT=180;G.notifCol=P.BUB3;
    spPts(LW/2,LH/2,20,[P.BUB3,P.YEL,P.WHT],.5,3,25,.02,1.5);flash(.25,P.BUB3);sfxPU();
  }
  // ★ v16 r4: На Бубблике взлететь можно только когда ОБА квеста выполнены
  if(KD.KeyL||(USE_TOUCH_UI&&btnJust('launch'))){
    if(G.bubblikaDone){
      sfxLand();
      if(!G.campaignState.planetsCompleted.includes('bubblika'))G.campaignState.planetsCompleted.push('bubblika');
      if(!G._visitTargetSet)G.campaignState.targetPlanet=PLANETS.bubblika.nextPlanet;
      G._visitTargetSet=false;
      _launchToSpace(G,30,40);
    } else if(G._launchWarnT>0){
      sfxLand();
      if(!G._visitTargetSet)G.campaignState.targetPlanet=PLANETS.bubblika.nextPlanet;
      G._visitTargetSet=false;G._launchWarnT=0;
      _launchToSpace(G,30,40);
    } else {
      if(!pfftDone&&!blabDone)G.notif='КВЕСТЫ НЕ ВЫПОЛНЕНЫ! НАЖМИ ЕЩЁ РАЗ ДЛЯ ВЫЛЕТА.';
      else if(!pfftDone)G.notif='ПОСЫЛКИ НЕ ДОСТАВЛЕНЫ! НАЖМИ ЕЩЁ РАЗ ДЛЯ ВЫЛЕТА.';
      else G.notif='ЧЕРТЁЖ ЩИТА НЕ ВЗЯТ! НАЖМИ ЕЩЁ РАЗ ДЛЯ ВЫЛЕТА.';
      G.notifT=180;G.notifCol=P.ORA;G._launchWarnT=180;sfxHit();
    }
  }
  if(G._launchWarnT>0)G._launchWarnT--;
  for(const c of B.clouds){c.x-=c.sp;if(c.x<-c.sz){c.x=LW+c.sz;c.y=30+Math.random()*(LH-40);}}
  updPts();updFTX();updSHK();
}

// ★ Phase 4.1: атмосфера Бубблики — вертикальный газовый градиент + облачные слои + пузыри + шиммер.
//   Заменяет старые горизонтальные полосы на цельную газовую глубину.
function _hexLerp(a,b,t){
  const ar=parseInt(a.slice(1,3),16),ag=parseInt(a.slice(3,5),16),ab=parseInt(a.slice(5,7),16);
  const br=parseInt(b.slice(1,3),16),bg=parseInt(b.slice(3,5),16),bb=parseInt(b.slice(5,7),16);
  const r=Math.round(ar+(br-ar)*t),g=Math.round(ag+(bg-ag)*t),bl=Math.round(ab+(bb-ab)*t);
  return '#'+r.toString(16).padStart(2,'0')+g.toString(16).padStart(2,'0')+bl.toString(16).padStart(2,'0');
}
function drwBubblikaAtmosphere(G,t){
  const B=G.bub;
  // Вертикальный градиент: верх P.BUB_GAS1 → середина P.BUB_GAS2 → низ P.BUB_GAS3.
  // Шиммер: лёгкое горизонтальное смещение каждые 4 кадра — ощущение «плывущего воздуха».
  const shimmer=(Math.floor(t/4)%2)?1:0;
  for(let y=0;y<LH;y++){
    const f=y/(LH-1);
    let col;
    if(f<0.5)col=_hexLerp(P.BUB_GAS1,P.BUB_GAS2,f*2);
    else     col=_hexLerp(P.BUB_GAS2,P.BUB_GAS3,(f-0.5)*2);
    rc(shimmer,y,LW,1,col);
  }
  // Облачные слои (parallax) — используем существующий B.clouds, разные скорости
  for(const c of B.clouds){
    cx.globalAlpha=.30;
    // более вытянутые эллипсы для облаков (sz x 1.6 по горизонтали через две полосы)
    disc(c.x|0,c.y|0,c.sz|0,c.col);
    cx.fillStyle=c.col;cx.globalAlpha=.18;
    cx.fillRect((c.x-c.sz*1.4)|0,(c.y-c.sz*0.3)|0,(c.sz*2.8)|0,(c.sz*0.6)|0);
    cx.globalAlpha=1;
  }
  // Пузыри — полупрозрачные с белой бликовой точкой
  if(B.bubbles){
    for(const b of B.bubbles){
      const bx=b.x|0, by=b.y|0;
      cx.globalAlpha=.18;disc(bx,by,b.r|0,P.BUB3);cx.globalAlpha=1;
      cx.globalAlpha=.42;ring(bx,by,b.r|0,P.BUB3,1);cx.globalAlpha=1;
      // Блик
      cx.globalAlpha=.65;
      cx.fillStyle='#ffffff';
      cx.fillRect((bx-b.r*0.4)|0,(by-b.r*0.4)|0,1,1);
      cx.globalAlpha=1;
    }
  }
}

function drwPlanetBubblika(G){
  const t=G.sT,B=G.bub;
  // ★ Phase 4.1: газовая атмосфера (градиент + облака + пузыри) — заменяет старые полосы
  drwBubblikaAtmosphere(G,t);
  // Тонкие световые лучи поверх (декоративный шум)
  for(let i=0;i<6;i++){const sy=((i*31+t*.4)%LH)|0;cx.globalAlpha=.10;rc(0,sy,LW,1,P.BUB3);}cx.globalAlpha=1;
  // Старая отрисовка облаков (теперь делается внутри drwBubblikaAtmosphere) — оставляем дрейф позиций
  for(const c of B.clouds){c.x+=B.windDX*0.3;}
  // Гейзеры — мощные многослойные столбы с волновой анимацией
  for(const g of B.geysers){
    // === НАТУРАЛЬНОЕ ОСНОВАНИЕ — каменистая ниша с водяным "котлом" ===
    // Используем псевдо-случайные смещения камней (стабильно по g.x)
    const rngBase=g.x*7;
    const rndAt=(i)=>((Math.sin(rngBase+i*13.31)*43758.5453)%1+1)%1;
    // Грязно-серая земля под основанием
    rc(g.x-14,g.y,28,2,'#2a1f33');
    rc(g.x-14,g.y+1,28,1,'#1a0e22');
    // Большие неровные валуны слева и справа (4-5 шт. с разной формой)
    // ЛЕВЫЙ валун
    rc(g.x-13,g.y-4,5,4,'#4a3a55');
    rc(g.x-12,g.y-5,3,1,'#5a4a65');     // макушка светлее
    rc(g.x-13,g.y-3,1,2,'#3a2a45');     // тёмная грань
    rc(g.x-13,g.y-1,5,1,'#2a1a35');     // тень снизу
    // Мох на левом валуне
    rc(g.x-12,g.y-5,2,1,'#4a8855');
    rc(g.x-11,g.y-6,1,1,'#5a9966');
    // Маленький валун рядом
    rc(g.x-7,g.y-3,3,3,'#3a2a45');
    rc(g.x-7,g.y-3,3,1,'#5a4a65');
    rc(g.x-6,g.y-4,1,1,'#4a8855');      // мох сверху
    // ПРАВЫЙ валун (другая форма)
    rc(g.x+5,g.y-4,4,4,'#4a3a55');
    rc(g.x+6,g.y-5,2,1,'#5a4a65');
    rc(g.x+5,g.y-1,4,1,'#2a1a35');
    rc(g.x+9,g.y-3,3,3,'#3a2a45');     // ещё камешек
    rc(g.x+10,g.y-4,1,1,'#4a8855');    // мох
    rc(g.x+9,g.y-3,3,1,'#5a4a65');
    // Маленькие камушки на земле
    rc(g.x-9,g.y-1,1,1,'#3a2a45');
    rc(g.x+11,g.y-1,1,1,'#3a2a45');
    rc(g.x-3,g.y-1,1,1,'#3a2a45');
    // === ВОДЯНОЙ КОТЁЛ — углубление с водой ===
    // Тёмная скважина (изогнутый эллипс)
    rc(g.x-5,g.y-2,11,2,'#000511');
    rc(g.x-4,g.y-3,9,1,'#000816');
    rc(g.x-3,g.y-4,7,1,'#001020');
    // Водная поверхность с лёгкой рябью
    cx.globalAlpha=0.7+0.2*Math.sin(t*0.12+g.x*0.1);
    rc(g.x-4,g.y-2,9,1,'#1a4470');
    cx.globalAlpha=0.85+0.15*Math.sin(t*0.2);
    rc(g.x-3,g.y-3,7,1,'#226699');
    cx.globalAlpha=1;
    // Светящееся дно
    cx.globalAlpha=0.5+0.3*Math.sin(t*0.18+g.x);
    rc(g.x-2,g.y-2,5,1,'#0099cc');
    cx.globalAlpha=1;
    // Маленькие пузырьки поднимаются из котла
    if(t%6===Math.floor(rndAt(0)*6)){
      PTS.push({x:g.x-2+rndAt(t)*4,y:g.y-3,vx:0,vy:-0.3,lf:18,ml:24,col:'#aaeeff',sz:1,gv:0,fade:.7});
    }
    // Капельки росы на камнях (декор, статичные)
    if(t%50<10){
      cx.fillStyle='#aaeeff';
      cx.globalAlpha=0.6;
      cx.fillRect(g.x-10,g.y-3,1,1);
      cx.fillRect(g.x+8,g.y-3,1,1);
      cx.globalAlpha=1;
    }

    if(g.warmup>0){
      // Лёгкое предупреждение — пульсирующее кольцо у основания + дрожание камней
      const w=Math.sin(t*0.4)*0.5+0.5;
      cx.globalAlpha=0.30+w*0.25;
      ring(g.x,g.y-2,8+w*3,'#ffaa44',1);
      cx.globalAlpha=1;
      // Светящаяся зона над котлом — вода нагревается
      cx.globalAlpha=0.4+0.3*Math.sin(t*0.5);
      rc(g.x-4,g.y-3,9,1,'#ffaa44');
      cx.globalAlpha=1;
      // Дрожащие пузыри
      const sh=Math.sin(t*0.8)*1;
      cx.fillStyle='#ffcc66';
      cx.fillRect((g.x-2+sh)|0,(g.y-2)|0,5,1);
    }

    if(g.active){
      const curH=Math.min(g.maxH,g.t*10)*g.intensity;
      const w0=8*g.intensity; // ширина у основания

      // === ВНЕШНИЙ ГАЛО (туман) ===
      cx.globalAlpha=0.10*g.intensity;
      for(let i=0;i<curH;i+=4){
        const w=Math.max(4,w0+5-i*0.012);
        cx.fillStyle='#aaeeff';
        cx.fillRect((g.x-w)|0,(g.y-i)|0,w*2,4);
      }
      cx.globalAlpha=1;

      // === ОСНОВНОЙ СТОЛБ — слоистый, с волной, более прозрачный ===
      for(let i=0;i<curH;i+=2){
        // Волна по столбу (синусоидально колышется)
        const wob=Math.sin((i*0.18)+g.wobble)*1.5*g.intensity;
        const w=Math.max(2,w0-i*0.018);
        // Цветовые слои сверху вниз — все более прозрачные
        let col,alpha;
        if(i<8){col='#ffffff';alpha=0.55;}
        else if(i<24){col='#ddffff';alpha=0.5;}
        else if(i<60){col='#aaeeff';alpha=0.45;}
        else if(i<110){col='#77ccee';alpha=0.4;}
        else{col='#5599cc';alpha=0.35;}
        cx.globalAlpha=alpha;
        cx.fillStyle=col;
        cx.fillRect((g.x-w+wob)|0,(g.y-i)|0,Math.max(2,w*2|0),3);
        // Светлое ядро — теперь совсем тонкое и полупрозрачное
        if(w>2){
          cx.globalAlpha=Math.min(0.55,alpha+0.1);
          cx.fillStyle=i<30?'#ffffff':'#ddffff';
          cx.fillRect((g.x-w*0.25+wob)|0,(g.y-i)|0,Math.max(1,w*0.4|0),3);
        }
      }
      cx.globalAlpha=1;

      // === ГРЕБЕНЬ / КОРОНА на вершине ===
      const topY=g.y-curH;
      const crownPulse=0.9+0.1*Math.sin(t*0.3);
      cx.globalAlpha=0.85;
      // Кольцо пены
      ring(g.x,topY,5*g.intensity*crownPulse,'#ffffff',1);
      ring(g.x,topY,8*g.intensity*crownPulse,'#ddffff',1);
      // Капли разлетаются
      for(let i=0;i<8;i++){
        const a=i/8*Math.PI*2+t*0.05;
        const r=(7+Math.sin(t*0.2+i)*2)*g.intensity;
        const dx=Math.cos(a)*r,dy=Math.sin(a)*r*0.6-2;
        cx.fillStyle='#ffffff';
        cx.fillRect((g.x+dx)|0,(topY+dy)|0,2,2);
      }
      cx.globalAlpha=1;

      // === ЯРКИЙ ИСТОЧНИК у основания (более мягкий) ===
      cx.globalAlpha=0.30*g.intensity;
      disc(g.x,g.y-3,12,'#ffffff');
      cx.globalAlpha=0.45*g.intensity;
      disc(g.x,g.y-3,5,P.CYA);
      cx.globalAlpha=1;

      // === БОКОВЫЕ ВЫБРОСЫ (короткие струи в стороны на пиковой фазе) ===
      if(g.intensity>0.7){
        for(let side=-1;side<=1;side+=2){
          for(let i=0;i<3;i++){
            const sx=g.x+side*(8+i*3);
            const sy=g.y-30-i*14+Math.sin(t*0.3+i)*3;
            cx.globalAlpha=0.6;
            cx.fillStyle='#aaeeff';
            cx.fillRect(sx|0,sy|0,3,2);
            cx.fillRect((sx+side*2)|0,(sy+1)|0,2,1);
          }
        }
        cx.globalAlpha=1;
      }
    }
  }

  // Спасательный гейзер (если игрок падает)
  if(B.falling&&B.falling.phase!=='down'&&B.falling.geyserX!=null){
    const f=B.falling;
    if(f.phase==='wait'){
      // Пульсация перед извержением — водяной котёл нагревается
      const w=Math.sin(t*0.5)*0.5+0.5;
      cx.globalAlpha=0.4+w*0.3;
      ring(f.geyserX,LH-3,10,P.CYA,1);
      cx.globalAlpha=0.4+0.3*Math.sin(t*0.7);
      rc(f.geyserX-4,LH-3,9,1,'#ffaa44');
      cx.globalAlpha=1;
      // Брызги предупреждения
      if(t%4===0){
        PTS.push({x:f.geyserX,y:LH-2,vx:(Math.random()-0.5)*0.8,vy:-0.6-Math.random()*0.4,lf:18,ml:24,col:'#aaeeff',sz:1,gv:0.05,fade:.7});
      }
    }else if(f.phase==='up'){
      // === МНОГОСЛОЙНЫЙ СТОЛБ ВОДЫ — как у обычных гейзеров ===
      const colTop=Math.max(B.islands[f.toIdx].y-1,(G.pc.y+4)|0);
      const colH=LH-colTop;
      const w0=8;
      const wobble=Math.sin(t*.15)*0.3;

      // Внешний гало (туман)
      cx.globalAlpha=0.10;
      for(let i=0;i<colH;i+=4){
        const w=Math.max(4,w0+5-i*0.012);
        cx.fillStyle='#aaeeff';
        cx.fillRect((f.geyserX-w)|0,(LH-i)|0,w*2,4);
      }
      cx.globalAlpha=1;

      // Основной столб — слоистый, с волной
      for(let i=0;i<colH;i+=2){
        const wob=Math.sin((i*0.18)+t*.2+wobble)*1.5;
        const w=Math.max(2,w0-i*0.018);
        let col,alpha;
        if(i<8){col='#ffffff';alpha=0.65;}
        else if(i<24){col='#ddffff';alpha=0.6;}
        else if(i<60){col='#aaeeff';alpha=0.55;}
        else if(i<110){col='#77ccee';alpha=0.5;}
        else{col='#5599cc';alpha=0.45;}
        cx.globalAlpha=alpha;
        cx.fillStyle=col;
        cx.fillRect((f.geyserX-w+wob)|0,(LH-i)|0,Math.max(2,w*2|0),3);
        // Светлое ядро
        if(w>2){
          cx.globalAlpha=Math.min(0.65,alpha+0.1);
          cx.fillStyle=i<30?'#ffffff':'#ddffff';
          cx.fillRect((f.geyserX-w*0.25+wob)|0,(LH-i)|0,Math.max(1,w*0.4|0),3);
        }
      }
      cx.globalAlpha=1;

      // Светящееся свечение под игроком (вершина столба)
      cx.globalAlpha=0.55+0.2*Math.sin(t*0.3);
      disc(f.geyserX,(G.pc.y+4)|0,6,'#ffffff');
      cx.globalAlpha=0.45;
      disc(f.geyserX,(G.pc.y+4)|0,3,'#ddffff');
      cx.globalAlpha=1;
    }
  }
  // === ОБЛАЧНЫЕ ПЛАТФОРМЫ ===
  // Каждая платформа отрисована как пушистое облако с верхней
  // плотной частью (ходовая поверхность) и мягкими нижними щупальцами.
  for(const I of B.islands){
    const cy=I.y;
    const cx_=I.x+I.w/2;
    // Тень под облаком
    cx.globalAlpha=0.18;
    for(let xx=-4;xx<I.w+4;xx+=3){
      const drop=10+Math.abs(Math.sin((xx+I.x)*.16))*4;
      rc(I.x+xx,cy+I.thick,3,drop|0,'#22184a');
    }
    cx.globalAlpha=1;

    // Нижние щупальца облака (комья)
    for(let xx=-2;xx<I.w+2;xx+=3){
      const drop=4+Math.abs(Math.sin((xx+I.x)*.22))*5+Math.abs(Math.sin((xx+I.x)*.08))*3;
      // Мягкий низ — фиолетово-розовая дымка
      cx.globalAlpha=0.55;
      rc(I.x+xx,cy+I.thick-1,3,drop|0,'#7755bb');
      cx.globalAlpha=0.85;
      rc(I.x+xx,cy+I.thick-1,3,Math.max(2,(drop*.6)|0),'#9966cc');
      cx.globalAlpha=1;
    }
    // Скруглённые края: маленькие "пузырьки" по бокам платформы
    for(let bb=0;bb<3;bb++){
      const off=bb*2;
      cx.globalAlpha=0.7;
      disc(I.x-1-bb,cy+I.thick/2|0,3-bb,'#aa77dd');
      disc(I.x+I.w+bb,cy+I.thick/2|0,3-bb,'#aa77dd');
      cx.globalAlpha=1;
    }
    // Основная верхняя плита — "земля" облака
    rc(I.x,cy,I.w,I.thick,'#bb88dd');
    rc(I.x,cy,I.w,1,'#ddaaee');
    rc(I.x,cy+1,I.w,1,'#cc99dd');
    // Верхние клубки — пузырьки на поверхности
    for(let xx=2;xx<I.w-2;xx+=5){
      const ph=Math.abs(Math.sin((xx+I.x+t*0.05)*.4));
      const bSize=2+ph;
      cx.globalAlpha=0.9;
      disc(I.x+xx,cy-1,bSize|0,'#eebbff');
      disc(I.x+xx,cy-1,Math.max(1,bSize-1)|0,'#ffddff');
    }
    cx.globalAlpha=1;
    // Дополнительные большие облачные пушинки на крупных платформах
    if(I.w>40){
      for(let xx=4;xx<I.w-4;xx+=12){
        const off=Math.sin(t*.04+I.x*.1+xx)*1;
        cx.globalAlpha=0.6;
        disc(I.x+xx,cy-3+off,3,'#ddaaee');
        cx.globalAlpha=0.9;
        disc(I.x+xx,cy-3+off,2,'#eebbff');
        cx.globalAlpha=1;
      }
    }
    // Имя платформы — теперь поменьше, поверх облака
    txs(I.name,I.x+2,cy+1,'#ffffff','#552288',1);
  }

  const padsCur=B.pads.filter(p=>p.iIdx===B.currentIsland);const selPad=padsCur[B.padSel||0];
  for(const pad of B.pads){const I=B.islands[pad.iIdx];const y=I.y-2;cx.globalAlpha=.5+.3*Math.sin(t*.15+pad.x);ring(pad.x,y,6,P.CYA,1);cx.globalAlpha=1;rc(pad.x-3,y-1,7,2,'#0055aa');rc(pad.x-2,y,5,1,P.CYA);rc(pad.x-1,y-1,3,1,P.WHT);if(selPad&&pad.iIdx===B.currentIsland&&pad.x===selPad.x){cx.globalAlpha=.6;ring(pad.x,y,9,P.YEL,1);cx.globalAlpha=1;}if(Math.abs(G.pc.x-pad.x)<14&&B.currentIsland===pad.iIdx){for(let i=0;i<3;i++){const py=y-(t*.5+i*4)%14;cx.globalAlpha=.7-(y-py)/14;rc(pad.x-1+(i%3-1),py,1,1,P.CYA);}cx.globalAlpha=1;if(Math.floor(t/18)%2){bx2(pad.x-10,y-16,20,10,P.YEL,P.WHT,1);txt('J',pad.x-1,y-14,P.BLK,1);}}}
  if(t%3===0)PTS.push({x:Math.random()*LW,y:LH+4,vx:(Math.random()-.5)*.1+B.windDX*0.3,vy:-.3-Math.random()*.3,lf:70+Math.random()*30|0,ml:90,col:Math.random()<.5?P.BUB3:'#ddaaee',sz:1+Math.random(),gv:-.005,fade:.5});
  if(B.spores){
    for(const sp of B.spores){
      if(sp.got)continue;sp.t+=.05;const I=B.islands[sp.i];const sx=sp.x|0,sy=(I.y-8+Math.sin(sp.t)*2)|0;
      cx.globalAlpha=.35+.25*Math.sin(sp.t*2);disc(sx,sy,7,P.CYA);cx.globalAlpha=1;
      rc(sx-3,sy-3,7,6,P.BUB3);rc(sx-2,sy-2,5,4,'#ddccff');rc(sx-1,sy-1,1,1,P.WHT);rc(sx+2,sy+1,1,1,P.CYA);
      if(sp.i===B.currentIsland&&Math.abs(G.pc.x-sx)<18){cx.globalAlpha=.5;ring(sx,sy,10,P.YEL,1);cx.globalAlpha=1;}
    }
  }

  // Индикатор доставки (если активна)
  // Если несём посылку - стрелка указывает на остров доставки
  if(B.delivery.carrying&&B.delivery.to>=0){
    const tI=B.islands[B.delivery.to];
    cx.globalAlpha=0.6+0.3*Math.sin(t*0.2);
    const cx_=tI.x+tI.w/2;
    cx.fillStyle=P.YEL;
    const ay=tI.y-22;
    for(let i=0;i<5;i++)rc(cx_-2+i,ay,1,5-Math.abs(i-2)*2,P.YEL);
    cx.globalAlpha=1;
    // Игрок несёт пакет
    const pkx=G.pc.x|0,pky=(G.pc.y-12)|0;
    rc(pkx-2,pky,5,4,P.YEL);rc(pkx-1,pky+1,3,2,'#ffffaa');rc(pkx,pky-1,1,1,P.YEL);
    // Лента на пакете
    rc(pkx,pky,1,4,P.RED);rc(pkx-2,pky+1,5,1,P.RED);
  }else if(B.delivery.active&&!B.delivery.carrying&&B.delivery.completed<B.delivery.target){
    // Ждём, что игрок вернётся к Пфффту
    const pfft=G.npcs.find(n=>n.id==='pfft');
    if(pfft){
      const py0=pfft.y-22+Math.sin(t*0.15)*2;
      cx.globalAlpha=0.7+0.3*Math.sin(t*0.2);
      // Иконка посылки
      const px0=pfft.x|0;
      rc(px0-4,(py0-4)|0,9,8,P.YEL);
      rc(px0-3,(py0-3)|0,7,6,'#ffeeaa');
      rc(px0,(py0-4)|0,1,8,P.RED);
      rc(px0-4,py0|0,9,1,P.RED);
      // Стрелка вниз
      cx.fillStyle=P.YEL;
      for(let i=0;i<5;i++)rc(px0-2+i,(py0+5)|0,1,5-Math.abs(i-2)*2,P.YEL);
      cx.globalAlpha=1;
    }
  }

  for(const n of G.npcs)drwNPC(n,G.pc.x,G.pc.y,t*1.2);drwPC(G.pc,t);
  // Щит-аура от спор: всегда мерцает если есть запас, ярко вспыхивает при поглощении
  if(B.sporeShield>0||B.sporeShieldT>0){
    const px=G.pc.x|0,py=G.pc.y-3|0;
    const flashT=B.sporeShieldT/30;
    const baseA=B.sporeShield>0?(0.35+0.15*Math.sin(t*0.18)):0;
    const a=Math.max(baseA,flashT*0.85);
    cx.globalAlpha=a;
    ring(px,py,9,P.CYA,1);
    ring(px,py,11,'#aaffcc',1);
    cx.globalAlpha=a*0.5;
    disc(px,py,11,P.CYA);
    cx.globalAlpha=1;
    // Орбитирующие частицы споры
    for(let i=0;i<B.sporeShield;i++){
      const a2=t*0.04+i*Math.PI*2/Math.max(1,B.sporeShield);
      const ox=px+Math.cos(a2)*10;
      const oy=py+Math.sin(a2)*5;
      cx.fillStyle='#aaffcc';cx.fillRect(ox|0,oy|0,2,2);
      cx.fillStyle=P.WHT;cx.fillRect((ox+0.5)|0,(oy+0.5)|0,1,1);
    }
  }
  drwPts();drwDialog(G);
  drwNotif(G);

  // HUD
  rc(0,0,LW,16,P.UIB);rc(0,15,LW,1,P.DIM);txs('БУББЛИКА',4,3,P.BUB3,P.BLK,1);txt('КР:'+G.pl.cr,55,3,P.YEL,1);txt('РЕ:'+G.pl.res,95,3,P.RES,1);txt('ХП:'+Math.floor(G.pl.hp),130,3,P.RED,1);

  // ★ v16 r9 #4: Кнопка взлёта убрана из интерфейса игрока (только в корабле)
  {const lb=getBtn('launch');if(lb)lb.hidden=true;}
  if(B.sporeMaxShield>0||B.spores.some(sp=>!sp.got)){
    txt('ЗАЩ:'+B.sporeShield,4,10,B.sporeShield>0?P.CYA:P.UIT2,1);
    if(B.sporeShield>0){
      // Иконка щита
      cx.globalAlpha=0.8+0.2*Math.sin(t*0.2);
      ring(28,12,3,P.CYA,1);
      cx.globalAlpha=1;
    }
  }
  // ★ v16 r9 #4: Текст подсказки про взлёт через корабль
  if(G.bubblikaDone){
    const pulse=.7+.3*Math.sin(G.sT*.18);cx.globalAlpha=pulse;
    txs('[S] ВЗЛЁТ ГОТОВ!',195,10,P.GRN,P.BLK,1);cx.globalAlpha=1;
  }
  drwQuestPanel(G);
  drwAlienBriefing(G);
  drwPauseIcon();drwJoystick();drwActionBtns();drwFTX();drawFlash();if(G.paused)drwPauseOverlay(G);drawTrans();
}

// ======= KRASNOZEM =======
function mrauGraph(){
  return{type:'graph',start:'intro',speaker:'МРАУ',nodes:{
    intro:{text:['КАПИТАН МРАУ:','СТОЙ! СВОЙ ИЛИ ЧУЖОЙ?','...ПРИШЕЛЕЦ. ХОРОШО.','ЗАХОДИ. ХИЩНИКИ ПОКА ДЕРЖАТСЯ ПОДАЛЬШЕ.'],choices:[
      {label:'ЧТО ЗДЕСЬ ПРОИЗОШЛО?',goto:'what_happened'},
      {label:'ПОЧЕМУ СНАРЯДЫ ВЕЗДЕ?',goto:'ammo_why'},
    ]},
    what_happened:{text:['МРАУ:','ХРАНИЛИЩЕ ВЗОРВАЛОСЬ.','ВИНОВАТА КРАСНАЯ КНОПКА.','А ТОЧНЕЕ - КОТ, КОТОРЫЙ ЕЁ НАЖАЛ.'],goto:'cat_intro'},
    ammo_why:{text:['МРАУ:','ВЗРЫВ РАЗБРОСАЛ ВСЁ ПО ОКРУГЕ.','ХРАНИЛИЩЕ СНЁС КОТ. КРАСНАЯ КНОПКА.','ОН ЛЮБИТ КНОПКИ.'],goto:'cat_intro'},
    cat_intro:{text:['МРАУ:','ЕГО ЗОВУТ ГЕНЕРАЛ. ОН МОЙ.','ТОЧНЕЕ - Я ЕГО.','ЛЮБИТ ГРЕТЬСЯ У ГЕНЕРАТОРА И ГРЫЗТЬ ПРОВОДА.','УЖЕ ТРИ КАБЕЛЯ.'],goto:'mission'},
    mission:{text:['МРАУ:','МНЕ НУЖНА ПОМОЩЬ.','СОБЕРИ СНАРЯДЫ С КАРТЫ - ЗАРЯДИ ТУРЕЛЬ.','ЗА ЭТО ОТДАМ ЗВЁЗДНУЮ БАТАРЕЮ.','ОНА ПРИГОДИТСЯ В БОЮ С ТИНОЙ.'],choices:[
      {label:'ЧТО ЗА БАТАРЕЯ?',goto:'battery'},
      {label:'ПРИНИМАЮ. ДЕЙСТВУЮ.',goto:'accept'},
    ]},
    battery:{text:['МРАУ:','БЕСКОНЕЧНАЯ ЭНЕРГИЯ В БОЮ.','ТРОФЕЙ ОТ СИНДИКАТА.','БЕЗ НЕЁ С ТИНОЙ - НЕ ВЫЙДЕТ.'],goto:'accept'},
    accept:{text:['МРАУ:','СНАРЯДЫ НА КАРТЕ. ХИЩНИКИ ОПАСНЫ.','КСТАТИ - ГЕНЕРАЛ ПРОПАЛ ВЧЕРА.','НАВЕРНОЕ ЗАЛЕЗ КУДА-ТО ТЁПЛОМУ.'],end:true,effect:(G)=>{
      if(!G.krz.questActive){
        G.krz.questActive=true;
        G.campaignState.flags.krzQuestStarted=true;
        G.notif='КВЕСТ АКТИВЕН! НЕСИ СНАРЯДЫ К ТУРЕЛИ.';G.notifT=200;G.notifCol=P.YEL;
        sfxPU();setTimeout(sfxPU,80);
      }
    }},
    repeat:{text:['МРАУ:','СНАРЯДЫ. ТУРЕЛЬ.','ГЕНЕРАЛ ТАК И НЕ ВЕРНУЛСЯ.','ХИЩНИКИ ВСЁ ЕЩЁ ДЕРЖАТСЯ ДАЛЕКО. СТРАННО.'],end:true},
    repeatDone:{text:['МРАУ:','БАТАРЕЯ ТВОЯ. ЛЕТИ.','ЕСЛИ НАЙДЁШЬ РЫЖЕГО КОТА - ОН МОЙ.'],end:true},
  }};
}

function kruzGraph(){
  return{type:'graph',start:'hello',speaker:'КРУЗ',nodes:{
    hello:{text:['КРУЗ:','О. ЖИВОЙ.','ДАВНО НЕ ВИДЕЛ ЧУЖИХ.','ХИЩНИКОВ МНОГО СТАЛО - С ТЕХ ПОР КАК БЕЗ ЗВЕЗДЫ.'],choices:[
      {label:'КАК С НИМИ СПРАВЛЯТЬСЯ?',goto:'tip'},
      {label:'ТЫ ЗДЕСЬ ДАВНО?',goto:'self'},
    ]},
    tip:{text:['КРУЗ:','ХИЩНИК НАПАДАЕТ СЗАДИ. ВСЕГДА.','НЕ СТОЙ НА МЕСТЕ.','И СЛЕДИ ЗА ВЕТРОМ - ЧУЮТ ЗАПАХ.'],end:true},
    self:{text:['КРУЗ:','ДВАДЦАТЬ ЛЕТ.','РАНЬШЕ БЫЛО ТЕПЛО И ТИХО.','ПОТОМ ЗВЕЗДА ПРОПАЛА.','СЕЙЧАС - ХОЛОДНО И ГРОМКО.'],choices:[
      {label:'Я ЛЕЧУ К ТИНЕ.',goto:'mission'},
      {label:'ПОНЯТНО. УДАЧИ.',goto:'bye'},
    ]},
    mission:{text:['КРУЗ:','СЛЫШАЛ.','МОЙ СОВЕТ: НЕ ТЯНИ.','КАЖДЫЙ ДЕНЬ БЕЗ ЗВЕЗДЫ - ХУЖЕ.'],end:true},
    bye:{text:['КРУЗ:','ВЕТЕР ПОПУТНЫЙ.'],end:true},
  }};
}

const KRZ_NPC_DEFS=[
  {id:'mrau',x:70,y:78,col:P.KRZ3,name:'МРАУ',graph:mrauGraph(),
    // Знак вопроса до принятия квеста
    questAvailable:(G)=>G&&G.krz&&!G.krz.questActive&&!G.krasDone},
  {id:'kruz',x:238,y:112,col:'#ddccaa',name:'КРУЗ',graph:kruzGraph()},
];
function initPlanetKrasnozem(G){
  TAP_FIRE=false;ALLOW_JOY=true;G.state='planet_krasnozem';G.shipReturnState='planet_krasnozem';
  G.dlg=null;G.dlgChar=0;
  G.notif='ПОГОВОРИ С КАПИТАНОМ МРАУ.';G.notifT=180;G.notifCol=P.KRZ3;
  G.pc={x:92,y:116,facing:-1,wt:0,hurtT:0};
  G.npcs=KRZ_NPC_DEFS.map(n=>({...n,near:false}));
  G.krz={baseX:72,baseY:88,turretA:0,turretFlash:0,
    questActive:!!G.campaignState.flags.krzQuestStarted,
    shells:[
      {x:282,y:90,picked:false,delivered:false,t:0},
      {x:205,y:95,picked:false,delivered:false,t:2},
      {x:132,y:148,picked:false,delivered:false,t:3},
      {x:248,y:152,picked:false,delivered:false,t:4},
      {x:171,y:85,picked:false,delivered:false,t:1},
    ],
    carryIdx:-1,delivered:0,shellShots:[],coreReady:false,
    // Базовый ветер всегда дует, порывы — сильнее
    baseDX:0.6,baseDY:0.05,
    gustT:0,gustDur:0,gustDX:0.6,gustDY:0.05,nextGust:55+((Math.random()*40)|0),
    // Постоянные частицы пыли, которые всегда движутся в направлении ветра
    dust:Array.from({length:36},()=>({x:Math.random()*LW,y:34+Math.random()*120,sp:0.3+Math.random()*0.5,sz:1+(Math.random()<0.25?1:0),life:Math.random()*100})),
    streaks:Array.from({length:18},()=>({x:Math.random()*LW,y:34+Math.random()*120,sp:0.5+Math.random()*0.6,len:6+Math.random()*8})),
    scavengers:[
      {x:230,y:120,vx:0,vy:0,t:0,cooldown:0,wanderA:0,alive:true},
      {x:154,y:88,vx:0,vy:0,t:30,cooldown:0,wanderA:Math.PI,alive:true},
      {x:286,y:132,vx:0,vy:0,t:60,cooldown:0,wanderA:Math.PI*0.5,alive:true},
      {x:252,y:82,vx:0,vy:0,t:90,cooldown:0,wanderA:Math.PI*1.2,alive:true},
      {x:185,y:150,vx:0,vy:0,t:120,cooldown:0,wanderA:Math.PI*0.2,alive:true},
    ],
    // ★ Phase 4.2: данные для атмосферы — дальние горы (2 слоя зубчатых силуэтов),
    //   диагональные пылевые потоки, пыльные вихри (spawn'ятся периодически).
    // Горы: 30 точек на слой, X равномерно, Y — псевдослучайная высота (стабильна между кадрами).
    mountains:{
      far:Array.from({length:32},(_,i)=>({
        x:i*(LW/30),
        h:8+Math.abs(Math.sin(i*1.7+3.1))*6+Math.abs(Math.cos(i*0.9+1.2))*4
      })),
      near:Array.from({length:36},(_,i)=>({
        x:i*(LW/34),
        h:14+Math.abs(Math.sin(i*1.3+2.5))*10+Math.abs(Math.cos(i*0.7))*5
      })),
    },
    // Диагональные пылевые штрихи — улучшение существующих streaks
    sandStreaks:Array.from({length:32},()=>({
      x:Math.random()*LW,y:30+Math.random()*70,
      vx:0.3+Math.random()*0.3,
      len:4+Math.random()*4,a:0.2+Math.random()*0.2,
    })),
    // Пыльные вихри (активные)
    devils:[],
    nextDevil:600+((Math.random()*300)|0),
    devilT:0,
  };
  PTS.length=0;FTX.length=0;SHK.length=0;resetBtns();
  if(USE_TOUCH_UI){addBtn('int',LW-20,LH-20,12,'*',P.YEL);addBtn('ship',20,24,10,'S',P.UIT);}
}

function krzStartGust(G){const KZ=G.krz;KZ.gustT=0;KZ.gustDur=80+((Math.random()*60)|0);
  // Порыв может быть в любом направлении (-20% к силе)
  const a=Math.random()*Math.PI*2;
  KZ.gustDX=Math.cos(a)*(1.12+Math.random()*0.72);
  KZ.gustDY=Math.sin(a)*(0.48+Math.random()*0.32);
  // Базовый ветер тоже сдвигается в сторону порыва
  KZ.baseDX=KZ.gustDX*0.4;KZ.baseDY=KZ.gustDY*0.3;
  sfxUI();
}

function drwScavenger(s){
  if(s.dead)return;
  const x=s.x|0,y=s.y|0,t=s.t;
  // Тень
  cx.fillStyle='rgba(0,0,0,0.3)';cx.fillRect(x-5,y+4,11,2);
  // Тело
  rc(x-5,y-3,11,7,'#552015');
  rc(x-4,y-2,9,5,'#883322');
  rc(x-3,y-3,7,1,'#aa4422');
  // Глаза светятся
  if(t%40<32){
    rc(x-3,y-1,2,2,P.RED);
    rc(x+1,y-1,2,2,P.RED);
    cx.globalAlpha=0.5;rc(x-3,y-1,2,2,'#ff8866');rc(x+1,y-1,2,2,'#ff8866');cx.globalAlpha=1;
  }
  // Зубы
  rc(x-2,y+2,1,2,P.WHT);rc(x+1,y+2,1,2,P.WHT);
  // Ноги (бегут)
  if(t%6<3){
    rc(x-4,y+4,1,2,'#331100');rc(x-1,y+4,1,2,'#331100');rc(x+3,y+4,1,2,'#331100');
  } else {
    rc(x-3,y+4,1,2,'#331100');rc(x,y+4,1,2,'#331100');rc(x+4,y+4,1,2,'#331100');
  }
  // Шипы
  rc(x-1,y-4,1,1,'#cc4422');rc(x+2,y-4,1,1,'#cc4422');
}

function krzFireTurret(G){
  const KZ=G.krz;
  const target=KZ.scavengers.find(s=>s.alive);
  KZ.turretFlash=14;
  if(target){
    const sx=KZ.baseX+5,sy=KZ.baseY-9;
    KZ.turretA=Math.atan2(target.y-sy,target.x-sx);
    KZ.shellShots.push({x:sx,y:sy,tx:target.x,ty:target.y,target,spd:4.2,life:70});
    G.notif='ТУРЕЛЬ: ВЫСТРЕЛ! ХИЩНИК В ОПАСНОСТИ.';G.notifT=90;G.notifCol=P.YEL;
    sfxShoot();shake(3);addShockwave(sx,sy,16,P.YEL);
  }else{
    G.notif='ТУРЕЛЬ ЗАРЯЖЕНА. ХИЩНИКОВ НЕТ.';G.notifT=90;G.notifCol=P.GRN;
    sfxPU();
  }
}

function updPlanetKrasnozem(G){
  handlePauseInput(G);if(G.paused)return;
  if(G.notifT>0)G.notifT--;
  if(G.dlg){updDialog(G);G.sT++;flushIn();return;}
  G.sT++;const pc=G.pc,KZ=G.krz;let ix=0,iy=0;
  // ★ Phase 4.2: пыльные вихри — спавн каждые ~600-900 кадров; каждый идёт слева направо.
  if(KZ.devils){
    KZ.devilT++;
    if(KZ.devilT>=KZ.nextDevil){
      KZ.devilT=0;
      KZ.nextDevil=600+((Math.random()*300)|0);
      KZ.devils.push({
        x:-12,y:60+Math.random()*70,
        vx:0.8+Math.random()*0.6,
        t:0,life:0,maxLife:240+((Math.random()*60)|0),
      });
    }
    for(let i=KZ.devils.length-1;i>=0;i--){
      const d=KZ.devils[i];
      d.t++;d.life++;d.x+=d.vx;
      if(d.x>LW+20||d.life>d.maxLife)KZ.devils.splice(i,1);
    }
  }
  // Обновление диагональных пылевых штрихов — респавн слева когда уходят за правый край
  if(KZ.sandStreaks){
    for(const s of KZ.sandStreaks){
      s.x+=s.vx;
      if(s.x>LW+s.len){s.x=-s.len;s.y=30+Math.random()*70;}
    }
  }
  if(K.KeyA||K.ArrowLeft)ix-=1;if(K.KeyD||K.ArrowRight)ix+=1;if(K.KeyW||K.ArrowUp)iy-=1;if(K.KeyS||K.ArrowDown)iy+=1;
  if(USE_TOUCH_UI&&TOUCH.joyActive){ix=TOUCH.joyDX;iy=TOUCH.joyDY;}
  const carrying=KZ.carryIdx>=0;const spd=carrying?0.62:1.05;let mv=false;
  if(ix||iy){const l=Math.hypot(ix,iy)||1;pc.x+=ix/l*spd;pc.y+=iy/l*spd;if(ix)pc.facing=ix>0?1:-1;mv=true;}
  if(mv)pc.wt++;else pc.wt=0;

  // Базовый ветер плавно затухает к слабому, а порыв возвращает базовый к нему.
  KZ.baseDX*=0.992;KZ.baseDY*=0.992;
  // Минимальный фоновый ветер
  if(Math.abs(KZ.baseDX)<0.4)KZ.baseDX+=Math.sign(KZ.baseDX||1)*0.005;

  // Порывы ветра
  KZ.nextGust--;if(KZ.nextGust<=0&&!KZ.gustDur){krzStartGust(G);KZ.nextGust=180+((Math.random()*120)|0);}
  if(KZ.gustDur>0){
    KZ.gustT++;KZ.gustDur--;
    pc.x+=KZ.gustDX*(carrying?1.15:.7);pc.y+=KZ.gustDY*(carrying?1.15:.7);
    if(G.sT%2===0){
      // Снаряды пыли в направлении ветра
      PTS.push({x:Math.random()*LW,y:28+Math.random()*(LH-28),vx:KZ.gustDX*1.2,vy:KZ.gustDY*0.8,lf:30,ml:35,col:P.KRZ2,sz:1,gv:0,fade:.5});
    }
  }

  // Пыль всегда летит по ветру (текущему = base или gust)
  const curDX=KZ.gustDur>0?KZ.gustDX:KZ.baseDX;
  const curDY=KZ.gustDur>0?KZ.gustDY:KZ.baseDY;
  for(const d of KZ.dust){
    d.x+=curDX*0.85;d.y+=curDY*0.85;d.life++;
    // Заворачивание
    if(d.x>LW+4)d.x=-4;
    if(d.x<-4)d.x=LW+4;
    if(d.y>LH-2)d.y=34;
    if(d.y<32)d.y=LH-4;
  }
  for(const s of KZ.streaks){
    s.x+=curDX*1.4;s.y+=curDY*1.0;
    if(s.x>LW+s.len)s.x=-s.len;
    if(s.x<-s.len)s.x=LW+s.len;
    if(s.y>LH-2)s.y=34;
    if(s.y<32)s.y=LH-4;
  }

  pc.x=Math.max(8,Math.min(LW-8,pc.x));pc.y=Math.max(76,Math.min(LH-16,pc.y));
  if(pc.hurtT>0)pc.hurtT--;
  if(mv&&G.sT%6===0)spPts(pc.x,pc.y+5,1,[P.KRZ2,P.KRZ3],.2,.8,10,0,.8);

  // Падальщики (активируются после начала квеста)
  if(KZ.questActive){
    for(const s of KZ.scavengers){
      if(!s.alive)continue;
      s.t++;const dx=pc.x-s.x,dy=pc.y-s.y,d=Math.hypot(dx,dy)||1;
      const chase=d<80;
      if(chase){s.vx+=dx/d*0.035;s.vy+=dy/d*0.035;}
      else{s.wanderA+=0.025;s.vx+=Math.cos(s.wanderA)*0.015;s.vy+=Math.sin(s.wanderA*1.3)*0.015;}
      s.vx*=0.94;s.vy*=0.94;s.x+=s.vx;s.y+=s.vy;
      s.x=Math.max(12,Math.min(LW-12,s.x));s.y=Math.max(76,Math.min(LH-14,s.y));
      if(d<10&&s.cooldown<=0){s.cooldown=55;pc.hurtT=28;G.pl.hp=Math.max(1,G.pl.hp-8);sfxHit();shake(4);spPts(pc.x,pc.y,10,[P.RED,P.KRZ3],.6,2.2,18,.02);fText(pc.x,pc.y-12,'-8 ХП',P.RED);if(carrying&&Math.random()<.35){const sh=KZ.shells[KZ.carryIdx];sh.picked=false;sh.x=pc.x-8*pc.facing;sh.y=pc.y;KZ.carryIdx=-1;G.notif='СНАРЯД ВЫБИТ ИЗ РУК!';G.notifT=90;G.notifCol=P.RED;}}
      if(s.cooldown>0)s.cooldown--;
    }
  }else{
    // До квеста — хищники "спят" вдалеке, не приближаются
    for(const s of KZ.scavengers){
      if(!s.alive)continue;
      s.t++;
      // Лёгкое покачивание на месте
      s.x+=Math.sin(s.t*0.04+s.wanderA)*0.1;
    }
  }

  // Полёт снарядов туррели
  for(let i=KZ.shellShots.length-1;i>=0;i--){
    const sh=KZ.shellShots[i],dx=sh.tx-sh.x,dy=sh.ty-sh.y,d=Math.hypot(dx,dy)||1;
    sh.x+=dx/d*sh.spd;sh.y+=dy/d*sh.spd;sh.life--;
    if(d<6||sh.life<=0){
      if(sh.target&&sh.target.alive){sh.target.alive=false;spPts(sh.target.x,sh.target.y,28,[P.KRZ3,P.YEL,P.WHT,P.RED],.8,3.4,28,.02,1.5);addShockwave(sh.target.x,sh.target.y,22,P.YEL);fText(sh.target.x,sh.target.y-12,'УБИТ!',P.YEL);sfxBoom();shake(6);}
      KZ.shellShots.splice(i,1);
    }
  }
  if(KZ.turretFlash>0)KZ.turretFlash--;

  // Подбор и доставка
  const action=(KD.KeyE||KD.Enter||btnJust('int'));
  let nearNPC=null;for(const n of G.npcs){n.near=Math.abs(pc.x-n.x)<22&&Math.abs(pc.y-n.y)<22;if(n.near&&!nearNPC)nearNPC=n;}
  let nearShell=-1;
  // Снаряды доступны только после старта квеста
  if(KZ.questActive&&KZ.carryIdx<0){
    for(let i=0;i<KZ.shells.length;i++){const sh=KZ.shells[i];if(!sh.picked&&!sh.delivered&&Math.hypot(pc.x-sh.x,pc.y-sh.y)<15){nearShell=i;break;}}
  }
  const nearTurret=Math.hypot(pc.x-KZ.baseX,pc.y-KZ.baseY)<24;
  if(action&&nearShell>=0){
    KZ.carryIdx=nearShell;KZ.shells[nearShell].picked=true;sfxPU();G.notif='ТЫ НЕСЁШЬ СНАРЯД. ВЕТЕР СИЛЬНЕЕ, СКОРОСТЬ НИЖЕ.';G.notifT=120;G.notifCol=P.YEL;fText(pc.x,pc.y-14,'СНАРЯД',P.YEL);
  }else if(action&&KZ.carryIdx>=0&&nearTurret){
    const idx=KZ.carryIdx,sh=KZ.shells[idx];sh.delivered=true;KZ.carryIdx=-1;KZ.delivered++;krzFireTurret(G);
  }else if(action&&nearNPC)startDlg(G,nearNPC);

  const alive=KZ.scavengers.filter(s=>s.alive).length;
  if(!G.krasDone&&KZ.delivered>=KZ.shells.length&&alive===0&&KZ.shellShots.length===0){
    G.krasDone=true;KZ.coreReady=true;G.campaignState.inventory.energyShield=true;G.campaignState.inventory.starBattery=true;G.pl.cr+=200;
    // ★ Phase 5.3: спаситель Краснозёма
    unlockAchievement(G,'krasSave');
    G.pl.men+=40;G.pl.en=G.pl.men;G.ship.fuel=Math.min(100,G.ship.fuel+80);
    G.notif='ЩИТ И БАТАРЕЯ ПОЛУЧЕНЫ! ГОТОВ К БОЮ С ТИНОЙ.';G.notifT=260;G.notifCol=P.CYA;
    spPts(LW/2,LH/2,42,[P.YEL,P.WHT,P.KRZ3,P.CYA],1,4,45,.02,2);addShockwave(LW/2,LH/2,42,P.YEL,35);flash(.45,P.YEL);sfxPU();setTimeout(sfxPU,90);setTimeout(sfxPU,180);
  }

  if(KD.Tab||btnJust('ship')){startTrans(()=>{G.shipReturnState='planet_krasnozem';G.state='ship_view';G.shipUI='main';G.shipT=0;TAP_FIRE=false;resetBtns();addBtn('back',20,24,10,'<',P.UIT);ALLOW_JOY=false;TOUCH.joyId=-1;TOUCH.joyActive=false;});}
  if(KD.KeyL||(USE_TOUCH_UI&&btnJust('launch'))){
    if(G.krasDone){
      sfxLand();
      if(!G.campaignState.planetsCompleted.includes('krasnozem'))G.campaignState.planetsCompleted.push('krasnozem');
      if(!G._visitTargetSet)G.campaignState.targetPlanet='center';
      G._visitTargetSet=false;
      _launchToSpace(G,G.pl.mhp,100);
    } else if(G._launchWarnT>0){
      sfxLand();
      if(!G._visitTargetSet)G.campaignState.targetPlanet='center';
      G._visitTargetSet=false;G._launchWarnT=0;
      _launchToSpace(G,G.pl.mhp,100);
    } else {
      G.notif='ЗАДАНИЕ НЕ ЗАВЕРШЕНО! НАЖМИ ЕЩЁ РАЗ ДЛЯ ВЫЛЕТА.';
      G.notifT=180;G.notifCol=P.ORA;G._launchWarnT=180;sfxHit();
    }
  }
  if(G._launchWarnT>0)G._launchWarnT--;
  updPts();updFTX();updSHK();
}

// ★ Phase 4.2: атмосфера Краснозёма — небесный градиент, красное солнце, далёкие горы,
//   диагональные пылевые потоки, пыльные вихри. Горизонт ≈ y=70.
function drwKrasnozemAtmosphere(G,t){
  const KZ=G.krz;
  // Вертикальный градиент: тёмное красно-чёрное небо сверху → оранжевая земля снизу.
  // Горизонт примерно на y=70 — там цвет смещается резче.
  for(let y=0;y<LH;y++){
    let col;
    if(y<70){
      // Небо: KRZ_ATM (тёмный) → плавно тёплый красный
      const f=y/70;
      col=_hexLerp(P.KRZ_ATM,'#70251a',f);
    } else {
      // Земля: KRZ_ATM-edge → KRZ1 (яркий оранж снизу)
      const f=(y-70)/(LH-70);
      col=_hexLerp('#70251a',P.KRZ1,f);
    }
    rc(0,y,LW,1,col);
  }
  // Красное солнце — тусклый диск в правом верхнем углу
  const sx=LW-30,sy=22;
  cx.globalAlpha=.35;disc(sx,sy,14,P.KRZ3);cx.globalAlpha=.55;disc(sx,sy,10,P.KRZ3);cx.globalAlpha=.85;disc(sx,sy,5,'#ffcc88');cx.globalAlpha=1;
  // Далёкие горы: 2 слоя зубчатых силуэтов как polyline-силуэты.
  if(KZ.mountains){
    // Дальний слой — alpha 0.7, цвет KRZ2 (более бледный)
    cx.globalAlpha=.7;cx.fillStyle=P.KRZ2;
    for(const m of KZ.mountains.far){
      // Высота горы — относительно горизонта y=70. Вершина в y=70-h.
      cx.fillRect(m.x|0,(70-m.h)|0,Math.ceil(LW/30)+1,(m.h+2)|0);
    }
    cx.globalAlpha=1;
    // Ближний слой — alpha 1.0, темнее
    cx.fillStyle='#3a0e08';
    for(const m of KZ.mountains.near){
      cx.fillRect(m.x|0,(70-m.h)|0,Math.ceil(LW/34)+1,(m.h+2)|0);
    }
    // Лёгкая верхняя кромка света на ближних горах
    cx.fillStyle='#882a18';
    for(const m of KZ.mountains.near){
      cx.fillRect(m.x|0,(70-m.h)|0,Math.ceil(LW/34)+1,1);
    }
  }
  // Диагональные пылевые потоки
  if(KZ.sandStreaks){
    for(const s of KZ.sandStreaks){
      cx.globalAlpha=s.a;
      cx.fillStyle=P.KRZ3;
      // линия наклоном вправо-вверх (dx>dy)
      cx.fillRect(s.x|0,s.y|0,(s.len|0),1);
      cx.fillRect((s.x+1)|0,(s.y-1)|0,(s.len-1)|0,1);
    }
    cx.globalAlpha=1;
  }
  // Пыльные вихри — sin-спираль вокруг центральной X-позиции
  if(KZ.devils){
    for(const d of KZ.devils){
      const fade=Math.min(1,d.life/20)*Math.min(1,(d.maxLife-d.life)/30);
      cx.globalAlpha=.55*fade;
      // 12 частиц по спирали
      for(let i=0;i<12;i++){
        const a=i/12*Math.PI*2+d.t*0.18;
        const r=4+i*0.8;
        const px=d.x+Math.cos(a)*r;
        const py=d.y+Math.sin(a)*r*0.55-i*0.6; // более вытянутая вертикально
        cx.fillStyle=i%3===0?P.KRZ3:P.KRZ2;
        cx.fillRect(px|0,py|0,1,1);
      }
      cx.globalAlpha=1;
    }
  }
}

function drwPlanetKrasnozem(G){
  const t=G.sT,KZ=G.krz;
  // Текущий ветер (порыв или базовый)
  const curDX=KZ.gustDur>0?KZ.gustDX:KZ.baseDX;
  const curDY=KZ.gustDur>0?KZ.gustDY:KZ.baseDY;
  const windSpd=Math.hypot(curDX,curDY);

  // ★ Phase 4.2: атмосфера (градиент + солнце + горы + пыль + вихри)
  drwKrasnozemAtmosphere(G,t);

  // Дальние слои пыли движутся в направлении ветра (поверх атмосферы)
  for(let i=0;i<20;i++){
    const layerSpd=0.3+(i%4)*0.15;
    const x=((i*41+t*layerSpd*Math.abs(curDX*8)*Math.sign(curDX||1))%LW+LW)%LW,y=34+(i*23)%90;
    cx.globalAlpha=.12;rc(x,y,12+(i%4)*6,1,P.KRZ2);
  }
  cx.globalAlpha=1;

  // Дальний карьер.
  cx.fillStyle='#33100b';for(let x=0;x<LW;x+=6){const h=8+Math.abs(Math.sin(x*.05))*12+Math.abs(Math.sin(x*.17))*6;cx.fillRect(x,72-h,6,h);}
  cx.fillStyle=P.KRZ1;for(let x=-10;x<LW;x+=10){const h=18+Math.abs(Math.sin(x*.04+t*.005))*22;cx.fillRect(x,117-h,10,h);}
  cx.fillStyle=P.KRZ2;for(let x=0;x<LW;x+=16){const h=5+Math.abs(Math.sin(x*.09))*8;cx.fillRect(x,118-h,16,h);}
  // Земля
  for(let tx=0;tx<LW;tx+=16)for(let ty=118;ty<LH;ty+=16){const sh=((tx+ty)/16|0)%2;rc(tx,ty,16,16,sh?P.KRZ1:'#7a281b');rc(tx,ty,16,1,sh?'#b04a2c':'#91351f');if((tx*13+ty*7)%31<8)rc(tx+4,ty+7,5,2,P.KRZ2);}

  // Постоянные частицы пыли — летят строго по ветру
  for(const d of KZ.dust){
    cx.globalAlpha=0.4+0.3*Math.sin(d.life*0.05);
    cx.fillStyle=d.sz>1?P.KRZ3:P.KRZ2;
    cx.fillRect(d.x|0,d.y|0,d.sz,d.sz);
  }
  cx.globalAlpha=1;

  // Длинные штрихи (показывают направление ветра)
  for(const s of KZ.streaks){
    cx.globalAlpha=0.35*Math.min(1,windSpd*1.4);
    cx.strokeStyle=P.KRZ3;cx.lineWidth=1;
    const lx=Math.sign(curDX||1)*s.len*Math.min(1,Math.abs(curDX)+0.3);
    const ly=Math.sign(curDY||0.1)*s.len*Math.min(1,Math.abs(curDY)+0.1);
    cx.beginPath();cx.moveTo(s.x|0,s.y|0);cx.lineTo((s.x-lx)|0,(s.y-ly)|0);cx.stroke();
  }
  cx.globalAlpha=1;

  // Песчаные дюнки на земле — движутся по ветру (только если ветер сильный)
  if(windSpd>0.4){
    cx.globalAlpha=.5;
    for(let i=0;i<14;i++){
      const lifeT=((t*Math.abs(curDX)*0.5+i*23)%80)|0;
      const startX=curDX>0?-10:LW+10;
      const px=(startX+lifeT*curDX*1.5+i*30)%(LW+20);
      const py=120+i*4-Math.sin((px+t*0.05)*0.1)*2;
      cx.fillStyle=P.KRZ2;
      cx.fillRect(px|0,py|0,3,1);
    }
    cx.globalAlpha=1;
  }

  // База и туррель.
  const bx=KZ.baseX|0,by=KZ.baseY|0;
  cx.fillStyle='rgba(0,0,0,0.35)';cx.fillRect(bx-18,by+13,38,4);
  rc(bx-18,by,36,16,'#3a2420');rc(bx-16,by+2,32,12,'#6a4438');rc(bx-12,by+5,8,6,P.COC);rc(bx+3,by+5,8,6,P.COC);
  const gunX=bx+5,gunY=by-9;rc(bx-4,by-4,18,8,'#56382d');ring(gunX,gunY,7,P.KRZ3,1);
  cx.save();cx.translate(gunX,gunY);cx.rotate(KZ.turretA||0);rc(0,-2,22,4,KZ.turretFlash>0?P.YEL:'#222');rc(7,-1,14,2,KZ.turretFlash>0?P.WHT:P.KRZ3);cx.restore();
  if(KZ.turretFlash>0){cx.globalAlpha=.75;disc(gunX+Math.cos(KZ.turretA)*24,gunY+Math.sin(KZ.turretA)*24,5,P.YEL);cx.globalAlpha=1;}
  if(KZ.questActive&&Math.hypot(G.pc.x-bx,G.pc.y-by)<24&&KZ.carryIdx>=0&&Math.floor(t/18)%2){bx2(bx-18,by-25,38,10,P.YEL,P.WHT,1);txt(USE_TOUCH_UI?'* ЗАРЯД':'E ЗАРЯД',bx-15,by-23,P.BLK,1);}
  // ! над турелью когда игрок несёт снаряд (показывает куда нести)
  if(KZ.questActive&&KZ.carryIdx>=0){
    drwExclaim(bx+5,by-22,t);
  }

  // Снаряды.
  for(let i=0;i<KZ.shells.length;i++){
    const sh=KZ.shells[i];if(sh.delivered||sh.picked)continue;sh.t+=.04;const sx=sh.x|0,sy=(sh.y+Math.sin(sh.t)*1)|0;
    cx.fillStyle='rgba(0,0,0,0.3)';cx.fillRect(sx-5,sy+5,11,2);
    rc(sx-4,sy-4,9,8,'#222');rc(sx-3,sy-3,7,6,P.KRZ3);rc(sx-2,sy-4,5,1,P.YEL);rc(sx-1,sy-1,2,2,P.WHT);
    // E-prompt только если квест активен И игрок рядом
    if(KZ.questActive&&KZ.carryIdx<0&&Math.hypot(G.pc.x-sh.x,G.pc.y-sh.y)<15&&Math.floor(t/18)%2){bx2(sx-10,sy-18,20,10,P.YEL,P.WHT,1);txt(USE_TOUCH_UI?'*':'E',sx-1,sy-16,P.BLK,1);}
    // ! над снарядом — если квест активен, игрок не несёт другой снаряд, и игрок далеко (чтобы не дублировать E-prompt)
    if(KZ.questActive&&KZ.carryIdx<0&&Math.hypot(G.pc.x-sh.x,G.pc.y-sh.y)>=15){
      drwExclaim(sx,sy-18,t+i*7);
    }
  }
  if(KZ.carryIdx>=0){const sx=(G.pc.x+G.pc.facing*7)|0,sy=(G.pc.y-10)|0;rc(sx-4,sy-4,9,8,'#222');rc(sx-3,sy-3,7,6,P.KRZ3);rc(sx-2,sy-4,5,1,P.YEL);}

  // Падальщики и выстрелы.
  for(const sc of KZ.scavengers)if(sc.alive)drwScavenger(sc);
  for(const shot of KZ.shellShots){
    cx.globalAlpha=.8;line(shot.x,shot.y,shot.tx,shot.ty,P.YEL,1);cx.globalAlpha=1;
    disc(shot.x|0,shot.y|0,3,P.YEL);disc(shot.x|0,shot.y|0,1,P.WHT);
    if(t%2===0)PTS.push({x:shot.x,y:shot.y,vx:(Math.random()-.5)*.5,vy:(Math.random()-.5)*.5,lf:12,ml:14,col:P.KRZ3,sz:1,gv:0,fade:.6});
  }

  // Сильный порыв — большие диагональные штрихи в направлении ветра
  if(KZ.gustDur>0){
    cx.globalAlpha=.45;
    for(let i=0;i<22;i++){
      const yy=32+((i*13+t*Math.abs(curDY*4))%145);
      const xx=(i*47+t*3*Math.sign(curDX||1))%LW;
      const lx=curDX*22,ly=curDY*14;
      cx.strokeStyle=P.KRZ3;cx.lineWidth=1;
      cx.beginPath();cx.moveTo(xx|0,yy|0);cx.lineTo((xx+lx)|0,(yy+ly)|0);cx.stroke();
    }
    cx.globalAlpha=1;
    // Затемнение в сторону ветра
    cx.globalAlpha=0.10;rc(0,30,LW,LH-30,'#332211');cx.globalAlpha=1;
  }

  // NPC / игрок
  for(const n of G.npcs)drwNPC(n,G.pc.x,G.pc.y,t*1.2);
  if(G.pc.hurtT>0&&Math.floor(G.pc.hurtT/3)%2){cx.globalAlpha=.45;disc(G.pc.x|0,G.pc.y|0,12,P.RED);cx.globalAlpha=1;}
  drwPC(G.pc,t);

  // Игрок наклоняется на ветру (если несёт снаряд и сильный ветер)
  if(KZ.gustDur>0&&KZ.carryIdx>=0){
    cx.globalAlpha=0.5;
    for(let i=0;i<3;i++)PTS.push({x:G.pc.x+(Math.random()-0.5)*4,y:G.pc.y-2+Math.random()*4,vx:curDX*1.2,vy:curDY*0.6,lf:12,ml:14,col:P.KRZ2,sz:1,gv:0,fade:0.55});
    cx.globalAlpha=1;
  }

  drwPts();drwDialog(G);
  drwNotif(G);

  // HUD
  rc(0,0,LW,16,P.UIB);rc(0,15,LW,1,P.DIM);
  txs('КРАСНОЗЁМ',4,3,P.KRZ3,P.BLK,1);txt('ХП:'+Math.floor(G.pl.hp),60,3,P.RED,1);txt('КР:'+G.pl.cr,90,3,P.YEL,1);

  const alive=KZ.scavengers.filter(s=>s.alive).length;
  // Прогресс квеста (снаряды, хищники) теперь в правой верхней плашке (drwQuestPanel)
  if(!G.krasDone){
    txt('ВРАГ:'+alive,206,3,alive>0?P.RED:P.GRN,1);
  }else{
    // ★ v16 r9 #4: Кнопка взлёта только в корабле, текст подсказки на S
    const pulse=.7+.3*Math.sin(G.sT*.18);cx.globalAlpha=pulse;
    txs('[S] ВЗЛЁТ ГОТОВ!',152,3,P.GRN,P.BLK,1);cx.globalAlpha=1;
  }
  if(USE_TOUCH_UI){const lb=getBtn('launch');if(lb)lb.hidden=true;}
  txt(USE_TOUCH_UI?'S]КОР':'[TAB]КОРАБЛЬ',LW-54,10,P.UIT2,1);
  drwQuestPanel(G);
  drwAlienBriefing(G);
  drwPauseIcon();drwJoystick();drwActionBtns();drwFTX();drawFlash();if(G.paused)drwPauseOverlay(G);drawTrans();
}

