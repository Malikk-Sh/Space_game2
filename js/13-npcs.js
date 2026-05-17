// ============================================================
// 13-npcs.js
// NPC graphs/draw functions (Klirr, Zorp, Krok, Blab, Pfft, Mrau, Kruz), drwDome helper
// depends on: 01-core.js, 04-font.js, 08-primitives-bg.js
// (originally sintara_v25.html lines 2939-3536)
// ============================================================

// ======= NPC DROSH =======
function klirrGraph(){
  // Эффект принятия квеста — общий для всех путей. Срабатывает на ЛЮБОЙ выбор
  // в стартовом узле, гарантируя что игрок получит квест независимо от того,
  // как именно он начнёт разговор.
  const acceptQuest=(G)=>{
    if(G.droshSide&&!G.droshSide.questAccepted){
      G.droshSide.questAccepted=true;
      G.campaignState.flags.droshQuestAccepted=true;
      G.notif='КВЕСТ ПРИНЯТ! ЗАЖГИ 5 МАЯКОВ.';G.notifT=200;G.notifCol=P.YEL;
      sfxPU();setTimeout(sfxPU,80);
    }
  };
  return{type:'graph',start:'intro',speaker:'КЛИРР',nodes:{
    intro:{text:['КОМЕНДАНТ КЛИРР:','О. ЖИВОЙ ЧЕЛОВЕК.','ЗАХОДИ. НЕ СТОЙ - ЗАМЁРЗНЕШЬ.'],choices:[
      {label:'ЧТО СЛУЧИЛОСЬ СО ЗВЕЗДОЙ?',goto:'star',effect:acceptQuest},
      {label:'ЭТА МЕТЕЛЬ - ВРЕМЕННАЯ?',goto:'blizzard',effect:acceptQuest},
    ]},
    star:{text:['КЛИРР:','СИНДИКАТ. 400 ЛЕТ НАЗАД ЗАПЕРЛИ ЗВЕЗДУ','В СФЕРУ ДАЙСОНА - НАЗЫВАЮТ ЕЁ ТИНА.','МЫ ЖИВЁМ НА ОСТАТКАХ ТЕПЛА.'],goto:'help'},
    blizzard:{text:['КЛИРР:','МАЯКИ ПОГАСЛИ - БЕЗ НИХ МЕТЕЛЬ НЕ УНЯТЬ.','А БЕЗ ТЕПЛА - КОНЕЦ.','ТЕРМОМЕТР УЖЕ ПРЕДУПРЕЖДАЕТ. МОЛЧА.'],goto:'help'},
    help:{text:['КЛИРР:','ЗАЖГИ ПЯТЬ МАЯКОВ - РАЗГОНИШЬ ХОЛОД.','ЗА ЭТО - ЧЕРТЁЖ ЛАЗЕРА ВТОРОГО КЛАССА.','ОН ПРОБЬЁТ ТИНУ. МНЕ ОН УЖЕ НЕ ПРИГОДИТСЯ.'],choices:[
      {label:'ДОГОВОРИЛИСЬ.',goto:'accept'},
      {label:'А ЗАЧЕМ МНЕ ЛАЗЕР?',goto:'why_laser'},
    ]},
    why_laser:{text:['КЛИРР:','ТЫ ЛЕТИШЬ К ТИНЕ - ЭТО ОЧЕВИДНО.','ИНАЧЕ ЗАЧЕМ ЗДЕСЬ?','ЛАЗЕР - ЭТО РАЗНИЦА МЕЖДУ "БЫЛ" И "ВЕРНУЛСЯ".'],goto:'accept'},
    accept:{text:['КЛИРР:','ЗОРП СНАРУЖИ - ОН МОЖЕТ ПОМОЧЬ.','БЕГАЕТ ВОКРУГ КУПОЛА. НАЙДЁШЬ.'],end:true},
    bye:{text:['КЛИРР:','ИДИ. ВРЕМЯ ИДЁТ. ЧАЙ ЗАКАНЧИВАЕТСЯ.'],end:true},
    repeat:{text:['КЛИРР:','МАЯКИ - НЕ ВСЕ ЕЩЁ ЗАЖЖЕНЫ.','ХОЛОДНЕЕ СТАЛО. ЧАЙ ЗАКАНЧИВАЕТСЯ.','ЧАЙ - ЭТО СЕРЬЁЗНО.'],end:true},
    // ★ Phase 3.3: реакция на прогресс — после завершения квеста (все маяки зажжены).
    //   Тёплая благодарность + лёгкий кивок на Райгара. Этот узел выбирается из 14-scenes-planets.js
    //   при G.droshDone, имея приоритет над 'repeat'.
    post_quest:{text:['КЛИРР:','МАЯКИ ГОРЯТ. ЛЮДИ СОБИРАЮТСЯ У НИХ.','ЧАЙ ПОЯВИЛСЯ. ДЕТИ ИГРАЮТ.','БЛАГОДАРЮ. И ПОБЛАГОДАРИ СВОЕГО ПРИШЕЛЬЦА —','РАЙГАР, ВЕРНО? У НЕГО МУДРЫЕ ГЛАЗА.'],end:true},
  }};
}
function zorpGraph(){
  // Эффект найма Зорпа на электростанцию.
  const recruit=(G)=>{
    const z=G.npcs.find(n=>n.id==='zorp');
    if(z&&!z.rec){
      z.rec=true;G.zorpRec=true;G.pl.workers++;
      addWorkerToShip(G);
      G.notif='+1 РАБОЧИЙ НА ЭЛЕКТРОСТАНЦИИ! ЭНЕРГИЯ ВОССТАНАВЛИВАЕТСЯ БЫСТРЕЕ.';
      G.notifT=200;G.notifCol=P.GRN;
      sfxPU();setTimeout(sfxPU,80);
    }
  };
  return{type:'graph',start:'intro',speaker:'ЗОРП',nodes:{
    intro:{text:['ЗОРП:','О! НОВЫЙ! СТОЙ - Я ЩААААС.','...ОК. СТОЮ. ЧТО НАДО?'],choices:[
      {label:'ТЫ ЗДЕСЬ РАБОТАЕШЬ?',goto:'job'},
      {label:'ЧТО ЗА ВИД СУЩЕСТВ?',goto:'lore'},
      {label:'ПОЙДЁШЬ КО МНЕ НА КОРАБЛЬ?',goto:'offer'},
    ]},
    lore:{text:['ЗОРП:','МЫ — РЕЙГАРЫ.','НАШ МИР УНИЧТОЖИЛ СИНДИКАТ.','ЗА СЛИШКОМ УПОРНОЕ СОПРОТИВЛЕНИЕ.','ТЕ АСТЕРОИДЫ В КОСМОСЕ — ЭТО МЫ.','НАША ПЛАНЕТА. ОБЛОМКИ.'],goto:'lore2'},
    lore2:{text:['ЗОРП:','ВЫЖИВШИЕ РЕЙГАРЫ БРОДЯТ В АСТЕРОИДНОМ ПОЛЕ.','Я ИХ ИЩУ. ЗАВЕРБУЮ — И К ТИНЕ.','СИНДИКАТ УНИЧТОЖИЛ НАШ МИР.','МЫ ПОМОЖЕМ УНИЧТОЖИТЬ ТИНУ.'],goto:'offer'},
    job:{text:['ЗОРП:','ОХРАНЯЮ ПЕРИМЕТР. ЛИЧНО.','КЛИРР ГОВОРИТ - ЭТО ПРОСТО БЕГ.','Я ГОВОРЮ - СТРАТЕГИЧЕСКОЕ ПАТРУЛИРОВАНИЕ.','МЫ НЕ ДОГОВОРИЛИСЬ.'],goto:'offer'},
    offer:{text:['ЗОРП:','НА КОРАБЛЬ? ТУДА, ГДЕ ЕСТЬ ТИНА?','ДА. ПОЙДУ.','СИДЕТЬ ЗДЕСЬ И ЖДАТЬ - ЭТО НЕ ДЛЯ МЕНЯ.'],choices:[
      {label:'БУДУ КРУТИТЬ ПЕДАЛИ ГЕНЕРАТОРА.',goto:'join'},
      {label:'ПОТОМ РЕШУ.',goto:'later'},
    ]},
    join:{text:['ЗОРП - В КОМАНДЕ!','ПЕДАЛИ - ЭТО ХОРОШО.','СКАЖИ КЛИРРУ, ЧТО Я УШЁЛ.','В КОСМОСЕ МОЖЕШЬ ПОДБИРАТЬ РЕЙГАРОВ —','ОНИ СТАНУТ РАБОЧИМИ.'],end:true,effect:recruit},
    later:{text:['ЗОРП:','ОК. Я БУДУ ВОН ТАМ.','И ВОН ТАМ.','И СНОВА ВОН ТАМ.'],end:true},
    bye:{text:['ЗОРП:','БЕГИ. Я ТОЖЕ ПОБЕЖАЛ.'],end:true},
    // ★ Phase 3.3: обновлён — Зорп говорит о вербовке сородичей
    repeat:{text:['ЗОРП:','Я УЖЕ НА БОРТУ - НЕ ОТВЛЕКАЙ.','...ШУТКА. Я ЗДЕСЬ.','В АСТЕРОИДНОМ ПОЛЕ ЕСТЬ МОИ СОРОДИЧИ.','ПОДБЕРИ РЕЙГАРА В КОСМОСЕ — ОН ВСТАНЕТ НА ПЕДАЛИ.'],end:true},
  }};
}
function krokGraph(){
  return{type:'graph',start:'intro',speaker:'КРОК',nodes:{
    intro:{text:['ПРОФ. КРОК:','А. ПРИШЕЛЕЦ.','МОИ ПРИБОРЫ ПОКАЗАЛИ - ТЫ ПРИЛЕТИШЬ.','Я НЕ ВЕРИЛ. ТЕПЕРЬ ВЕРЮ.'],choices:[
      {label:'ЧТО ПОКАЗЫВАЮТ ВАШИ ПРИБОРЫ?',goto:'data'},
      {label:'МОЖНО ВЗЯТЬ ВАШИ ЗАПИСИ?',goto:'records'},
    ]},
    data:{text:['КРОК:','ЗВЕЗДА УГАСАЕТ БЫСТРЕЕ, ЧЕМ ДОЛЖНА.','ТИНА ПОГЛОЩАЕТ ЕЁ АКТИВНЕЕ.','ВОЗМОЖНО - ЗНАЕТ, ЧТО КТО-ТО ЛЕТИТ.','ЭТО МОЯ ТЕОРИЯ. НАДЕЮСЬ, ОШИБОЧНАЯ.'],goto:'records'},
    records:{text:['КРОК:','ВОЗЬМИ. 40 ЛЕТ НАБЛЮДЕНИЙ.','ТАМ ЕСТЬ СЛАБЫЕ ТОЧКИ ТИНЫ.','И ОДНА КУЛИНАРНАЯ ГЛАВА - ОНА СЛУЧАЙНО.'],end:true,effect:(G)=>{
      const k=G.npcs.find(n=>n.id==='krok');
      if(k&&!k.lore){k.lore=true;G.pl.res+=2;G.campaignState.inventory.krokRecords=true;G.notif='+2 РЕС + ЗАПИСИ КРОКА!';G.notifT=130;G.notifCol=P.RES;fText(LW/2,LH/2,'+2 РЕС',P.RES3);sfxPU();}
    }},
    bye:{text:['КРОК:','УДАЧИ. ИЗУЧАЙ ЗАПИСИ ВНИМАТЕЛЬНО.'],end:true},
    // ★ Phase 3.3: кросс-референс на Зорпа + критическая подсказка про Тину
    repeat:{text:['КРОК:','ТЫ ЕЩЁ ЗДЕСЬ.','ЗОРП? СЛИШКОМ ЭНЕРГИЧЕН ДЛЯ НАУКИ.','ОН ПОТЕРЯЛ БЫ МОИ ДАННЫЕ ЗА ДЕНЬ.','ВАЖНО: У ТИНЫ ЕСТЬ ЖЁЛТЫЕ ТОЧКИ В ЯДРЕ.','БЕЙ ПО НИМ - ПРОБИВАЮТ ЩИТ.'],end:true},
  }};
}

const NPC_DEFS=[
  {id:'klirr',x:148,y:90,col:P.NPC,name:'КЛИРР',graph:klirrGraph(),
    // Восклицательный знак показывается, пока игрок не принял квест
    questAvailable:(G)=>G&&G.droshSide&&!G.droshSide.questAccepted&&!G.droshSide.done},
  {id:'zorp',x:212,y:116,col:'#88ccff',name:'ЗОРП',graph:zorpGraph(),rec:false,wRadius:36},
  {id:'krok',x:96,y:130,col:'#ccaa88',name:'КРОК',graph:krokGraph(),lore:false},
];
function drwDome(dcx,dcy,r){
  // === СНЕЖНЫЙ ХОЛМ-ОСНОВАНИЕ (под куполом) ===
  // Большой ледяной холм, на котором стоит купол. Идёт ВНИЗ от dcy.
  const hillH=Math.max(8,(r*0.55)|0);
  const hillW=r+8;
  // Тёмная тень холма (земля)
  cx.globalAlpha=0.5;
  for(let dy=0;dy<hillH+2;dy++){
    const w=hillW*(1-dy/(hillH+4))|0;
    cx.fillStyle='#0a1830';
    cx.fillRect((dcx-w-1)|0,(dcy+dy)|0,w*2+2,1);
  }
  cx.globalAlpha=1;
  // Тело холма — лёд
  for(let dy=0;dy<hillH;dy++){
    const w=hillW*(1-dy/(hillH+3))|0;
    cx.fillStyle=dy<2?'#dde8f2':(dy<5?'#a8c0d8':'#7a98b8');
    cx.fillRect((dcx-w)|0,(dcy+dy)|0,w*2,1);
  }
  // Снежная "шапка" вершины холма (под куполом)
  cx.fillStyle='#ffffff';
  cx.fillRect((dcx-r-2)|0,(dcy-1)|0,r*2+4,2);
  cx.fillStyle='#cce0ee';
  cx.fillRect((dcx-r-3)|0,(dcy+1)|0,r*2+6,1);
  // Декоративные ледяные глыбы у подножия
  for(let i=-1;i<=1;i+=2){
    const bx=dcx+i*(r+2);
    cx.fillStyle='#a8c0d8';rc(bx-2,dcy+hillH-3,4,3,'#a8c0d8');
    rc(bx-1,dcy+hillH-4,2,1,'#dde8f2');
  }

  // === ТЕНЬ ПОД КУПОЛОМ (на холме) ===
  cx.globalAlpha=0.35;disc(dcx+1,dcy-1,r-1,P.BLK);cx.globalAlpha=1;

  // === ОСНОВАНИЕ КУПОЛА — каменный фундамент ===
  // Узкая тёмная полоса фундамента непосредственно под куполом
  rc(dcx-r,dcy-1,r*2,2,'#1a2840');
  rc(dcx-r+1,dcy-1,r*2-2,1,'#2a3a55');

  // === КУПОЛ (полусфера) ===
  // Тёмная подложка
  cx.fillStyle=P.DOM;
  for(let dy=-r;dy<=0;dy++){
    const w=Math.sqrt(r*r-dy*dy)|0;
    cx.fillRect((dcx-w)|0,(dcy+dy)|0,w*2,1);
  }
  // Светлая левая часть (свет)
  cx.fillStyle=P.DO2;
  for(let dy=-r;dy<=0;dy++){
    const w=Math.sqrt(r*r-dy*dy)|0;
    cx.fillRect((dcx-w)|0,(dcy+dy)|0,Math.ceil(w*.42),1);
  }
  // Самая светлая полоска сверху-слева — блик
  cx.fillStyle=P.DOG;
  for(let dy=-r;dy<-r*.5;dy++){
    const w=Math.sqrt(r*r-dy*dy)|0;
    cx.fillRect((dcx-w+2)|0,(dcy+dy)|0,Math.ceil(w*.18),1);
  }
  // Контур купола (металлические дуги)
  cx.strokeStyle='#0a1828';cx.lineWidth=1;
  cx.beginPath();cx.arc(dcx,dcy,r,Math.PI,0);cx.stroke();
  // Вертикальный шов посередине
  line(dcx,dcy-r,dcx,dcy,'#1a2a40',1);

  // === ОКНА — светящиеся проёмы ===
  const lit=Math.floor(Date.now()/800)%3!==0;
  const winY=(dcy-r*0.55)|0;
  rc(dcx-9,winY,5,4,'#0a1828');rc(dcx+4,winY,5,4,'#0a1828');
  rc(dcx-8,winY+1,3,2,lit?'#ffeebb':'#88aaff');
  rc(dcx+5,winY+1,3,2,lit?'#ffcc66':'#88aaff');
  // Маленькое окно по центру
  rc(dcx-1,winY-1,2,2,'#0a1828');
  if(lit)rc(dcx-1,winY-1,2,1,'#ffeebb');

  // === АНТЕННА ===
  rc(dcx-1,(dcy-r-5)|0,2,5,'#445566');
  rc(dcx,(dcy-r-7)|0,1,3,P.DOG);
  // Мигалка
  if(Math.floor(Date.now()/400)%2)rc(dcx,(dcy-r-8)|0,1,1,P.RED);
  else rc(dcx,(dcy-r-8)|0,1,1,'#440000');

  // === ВЕНТИЛЯЦИОННЫЕ ТРУБЫ ПО БОКАМ ===
  rc(dcx-r-1,dcy-3,2,3,'#445566');
  rc(dcx+r-1,dcy-3,2,3,'#445566');
}
// === Детализированные NPC ===
// Каждый NPC имеет уникальный силуэт, аксессуары, и собственную walk-анимацию.
function drwNPC(n,pcx,pcy,t){
  // Walking animation - update wander state
  if(n.walking==null){
    // Один раз инициализируем walk-параметры на основе id
    n.walking=true;
    n._wT=Math.random()*100;
    n._wDir=Math.random()<0.5?-1:1;
    n._wWait=0;
    n._wFacing=n._wDir;
    n._homeX=n.x;
    n._homeY=n.y;
    // wRadius может быть передан в NPC defs (для ограничения на платформах)
    n._wRadius=(n.wRadius!=null)?n.wRadius:(20+Math.random()*15);
  }
  // Двигаемся только если игрок не близко (чтобы не "убегать")
  const distToPlayer=Math.hypot(pcx-n.x,pcy-n.y);
  const npcCanWalk=n.walking&&distToPlayer>30&&!n.near;
  // Zorp — бегун: двигается быстрее и почти не отдыхает
  const isRunner=n.id==='zorp';
  const moveSp=isRunner?0.65:0.42;
  const pauseChance=isRunner?0.0015:0.004;
  // Таймер и пауза обновляются всегда — так ноги анимируются даже рядом с игроком
  n._wT++;
  if(n._wWait>0)n._wWait--;
  else if(npcCanWalk){
    // Двигаемся в текущем направлении
    n.x+=n._wDir*moveSp;
    n._wFacing=n._wDir;
    // Если ушли слишком далеко от дома — разворачиваем
    if(n.x<n._homeX-n._wRadius){n._wDir=1;n._wWait=isRunner?5+((Math.random()*15)|0):10+((Math.random()*25)|0);}
    else if(n.x>n._homeX+n._wRadius){n._wDir=-1;n._wWait=isRunner?5+((Math.random()*15)|0):10+((Math.random()*25)|0);}
    // Случайные паузы
    else if(Math.random()<pauseChance){n._wWait=isRunner?5+((Math.random()*15)|0):8+((Math.random()*30)|0);if(Math.random()<0.5)n._wDir*=-1;}
  }
  n.near=Math.abs(pcx-n.x)<22&&Math.abs(pcy-n.y)<22;
  const facing=n._wFacing||1;
  const blink=Math.floor(t/60)%4===0;
  // walkPhase не зависит от дистанции — ноги всегда двигаются когда NPC "хочет" идти
  const walkPhase=n.walking&&n._wWait<=0;
  // Blab бежит — быстрее анимация ног и подскок
  const legCycle=isRunner?5:8;
  // ★ Увеличенная амплитуда шага: раньше ±3/±2 — почти незаметно. Теперь шаг хорошо виден.
  const legOff=walkPhase?(Math.floor(t/legCycle)%2)*(isRunner?5:4):0;
  // Подскок при беге
  const runBob=(walkPhase&&isRunner)?Math.sin(t*0.4)*1:0;
  const x=n.x|0;
  const y=(n.y+runBob)|0;
  // Тень
  cx.fillStyle='rgba(0,0,0,0.28)';cx.fillRect(x-5,y+3,11,2);

  // Зеркальное отображение в зависимости от направления движения
  const flip=(facing>0)?1:-1;
  cx.save();cx.translate(x,0);cx.scale(flip,1);

  // Диспетчер по id — у каждого свой стиль (рисуем в локальных координатах x=0).
  // Внутри передаём facing=1: вся асимметрия рисуется "лицом вправо",
  // а внешняя обёртка зеркалит всё целиком если NPC смотрит влево.
  switch(n.id){
    case 'klirr': drwNPC_Klirr(0,y,t,1,blink,walkPhase,legOff);break;
    case 'zorp':  drwNPC_Zorp(0,y,t,1,blink,walkPhase,legOff);break;
    case 'krok':  drwNPC_Krok(0,y,t,1,blink,walkPhase,legOff);break;
    case 'blab':  drwNPC_Blab(0,y,t,1,blink,walkPhase,legOff);break;
    case 'pfft':  drwNPC_Pfft(0,y,t,1,blink,walkPhase,legOff);break;
    case 'mrau':  drwNPC_Mrau(0,y,t,1,blink,walkPhase,legOff);break;
    case 'kruz':  drwNPC_Kruz(0,y,t,1,blink,walkPhase,legOff);break;
    default: drwNPC_Generic(0,y,t,1,blink,walkPhase,legOff,n.col);
  }

  cx.restore();

  // Спецэффекты, требующие мировых координат (после восстановления контекста)
  if(n.id==='zorp'&&walkPhase&&t%5===0){
    PTS.push({x:x-facing*4,y:y+2,vx:-facing*0.6,vy:-0.1,lf:8,ml:12,col:'#88ccff',sz:1,gv:0,fade:0.6});
  }

  const nw=gw(n.name);txs(n.name,(x-nw/2)|0,y-26,P.UIT2,P.BLK,1);
  if(n.near&&Math.floor(t/18)%2){
    const bob=Math.sin(t*.15)*1;
    bx2(x-6,y-34+bob,12,10,P.YEL,P.WHT,1);
    txt(USE_TOUCH_UI?'*':'E',x-2,y-32+bob,P.BLK,1);
  }

  // === КВЕСТ-ИНДИКАТОР (восклицательный знак) ===
  // Появляется над NPC если у него есть нужный квест/важная информация для игрока.
  // Скрывается когда игрок рядом (заменяется на E-prompt) или когда квест уже принят.
  if(!n.near&&n.questAvailable&&n.questAvailable(window.G)){
    drwExclaim(x,y-38,t);
  }
}

function drwNPC_Generic(x,y,t,facing,blink,walking,legOff,col){
  // Тело (одеяние)
  rc(x-3,y-8,7,8,col);rc(x-3,y-8,7,1,'#ffddaa');
  // Голова
  rc(x-2,y-15,5,7,col);rc(x-2,y-15,5,1,'#ffddaa');
  // Глаза
  cx.fillStyle=P.BLK;
  if(!blink){cx.fillRect(x-1+(facing>0?0:0),y-13,1,2);cx.fillRect(x+1,y-13,1,2);}
  else{cx.fillRect(x-1,y-12,1,1);cx.fillRect(x+1,y-12,1,1);}
  cx.fillRect(x-1,y-10,3,1);
  // Ноги
  cx.fillStyle='#334455';
  cx.fillRect(x-3+legOff,y,3,2);
  cx.fillRect(x+1-legOff,y,3,2);
}

// КЛИРР — комендант в военной форме с фуражкой
function drwNPC_Klirr(x,y,t,f,blink,walking,legOff){
  // Ноги в сапогах
  rc(x-3+legOff,y,3,3,'#222');rc(x+1-legOff,y,3,3,'#222');
  rc(x-3+legOff,y+2,3,1,'#554422');rc(x+1-legOff,y+2,3,1,'#554422'); // сапоги
  // Тёмно-зелёная форма с поясом
  rc(x-4,y-9,9,9,'#3a5c3a');rc(x-4,y-1,9,1,'#1a2a1a');// пояс
  rc(x-4,y-9,9,1,'#557755');// плечи светлее
  // Знаки различия (две жёлтые полоски)
  rc(x-3,y-8,1,1,'#ffcc44');rc(x-3,y-6,1,1,'#ffcc44');
  // Голова
  rc(x-3,y-16,7,7,'#e8c89a');rc(x-3,y-16,7,1,'#d8b88a');
  // Усы
  rc(x-2,y-11,5,1,'#553322');
  // Глаза (стальные, серьёзные)
  cx.fillStyle='#1a3344';
  if(!blink){cx.fillRect(x-1,y-13,1,2);cx.fillRect(x+2,y-13,1,2);}
  else{cx.fillRect(x-1,y-12,1,1);cx.fillRect(x+2,y-12,1,1);}
  // Фуражка с козырьком
  rc(x-4,y-19,9,3,'#2a4a2a');rc(x-4,y-19,9,1,'#3a5c3a');
  rc(x-5,y-17,11,1,'#1a2a1a');// козырёк
  // Звезда на фуражке
  rc(x,y-18,1,1,'#ffcc44');
}

// ЗОРП — спортсмен в трико с повязкой и часами
function drwNPC_Zorp(x,y,t,f,blink,walking,legOff){
  // Ноги — длинные, в кроссовках
  rc(x-3+legOff,y,3,3,'#1a2a4a');// шорты-низ
  rc(x+1-legOff,y,3,3,'#1a2a4a');
  rc(x-3+legOff,y+2,3,1,'#ddffff');// кроссовки
  rc(x+1-legOff,y+2,3,1,'#ddffff');
  // Спортивная майка с номером
  rc(x-3,y-9,7,8,'#3399ff');// синяя
  rc(x-3,y-3,7,1,'#1a2a4a');
  rc(x-1,y-7,3,3,'#ffffff');// номер
  rc(x,y-6,1,1,'#3399ff');// "1"
  // Голова с повязкой
  rc(x-3,y-16,7,7,'#e8c89a');
  rc(x-4,y-15,9,2,'#ff4488');// повязка розовая
  rc(x-4,y-15,9,1,'#ffaa44');
  // Глаза — энергичные, всегда открытые с искрой
  cx.fillStyle='#1a2a4a';
  if(!blink){cx.fillRect(x-1,y-13,2,2);cx.fillRect(x+2,y-13,2,2);}
  else{cx.fillRect(x-1,y-12,2,1);cx.fillRect(x+2,y-12,2,1);}
  // Улыбка
  rc(x-1,y-10,3,1,'#aa3333');
  // Часы на руке
  rc(x+4,y-6,2,1,'#ff4488');
}

// КРОК — пожилой астроном с очками и блокнотом
function drwNPC_Krok(x,y,t,f,blink,walking,legOff){
  // Ноги в сандалиях
  rc(x-3+legOff,y,3,3,'#664422');rc(x+1-legOff,y,3,3,'#664422');
  rc(x-3+legOff,y+2,3,1,'#886633');rc(x+1-legOff,y+2,3,1,'#886633'); // подошвы
  // Серая роба учёного
  rc(x-4,y-9,9,9,'#aaaaaa');rc(x-4,y-9,9,1,'#888888');
  // Карман с блокнотом
  rc(x-3,y-5,3,3,'#ddccaa');rc(x-3,y-5,3,1,'#aa9988');
  rc(x-2,y-4,1,1,'#445566');
  // Голова с белыми волосами
  rc(x-3,y-16,7,7,'#e8c89a');
  rc(x-4,y-18,9,3,'#ddffff');// белые волосы
  rc(x-4,y-17,1,3,'#bbccdd');
  rc(x+4,y-17,1,3,'#bbccdd');
  // Очки — большие круглые
  cx.fillStyle='#222';
  cx.fillRect(x-2,y-13,2,2);cx.fillRect(x+1,y-13,2,2);
  cx.fillRect(x-1,y-13,1,1);cx.fillRect(x+2,y-13,1,1);
  // Стёкла с бликом
  cx.fillStyle='#aaccff';
  cx.fillRect(x-1,y-13,1,1);
  // Седая борода
  rc(x-2,y-11,5,3,'#ddffff');rc(x-2,y-9,5,1,'#bbccdd');
  // Карандаш за ухом
  rc(x+4,y-15,2,1,'#ffaa44');
}

// БЛАБ — изобретатель в комбинезоне с гаечным ключом
function drwNPC_Blab(x,y,t,f,blink,walking,legOff){
  // Ноги в рабочих сапогах
  rc(x-3+legOff,y,3,3,'#332211');rc(x+1-legOff,y,3,3,'#332211');
  rc(x-3+legOff,y+2,3,1,'#ffcc44');rc(x+1-legOff,y+2,3,1,'#ffcc44');
  // Жёлтый комбинезон
  rc(x-4,y-9,9,9,'#ddaa33');rc(x-4,y-9,9,1,'#eebb44');
  // Лямки и пуговицы
  rc(x-2,y-8,1,7,'#aa7722');rc(x+2,y-8,1,7,'#aa7722');
  rc(x-2,y-5,1,1,'#ffeecc');rc(x+2,y-5,1,1,'#ffeecc');
  // Карман с инструментом
  rc(x,y-4,3,3,'#aa7722');
  // Голова — пузырь (Бубблика-обитатель)
  cx.globalAlpha=0.85;
  disc(x+1,y-13,5,'#aaeeff');
  cx.globalAlpha=1;
  ring(x+1,y-13,5,'#88ccee',1);
  // Лицо внутри пузыря
  cx.fillStyle=P.BLK;
  if(!blink){cx.fillRect(x-1,y-14,1,2);cx.fillRect(x+2,y-14,1,2);}
  else{cx.fillRect(x-1,y-13,1,1);cx.fillRect(x+2,y-13,1,1);}
  // Очки-гогглы поверх пузыря
  rc(x-2,y-15,5,1,'#332211');
  // Усмешка
  rc(x,y-11,2,1,'#aa3333');
  // Антенна на пузыре
  rc(x+1,y-19,1,2,'#aa7722');
  rc(x+1,y-20,1,1,'#ff4488');
  // Гаечный ключ в руке
  if(t%80<40){
    rc(x-7+f*4,y-7,3,1,'#888899');
    rc(x-7+f*4,y-8,2,1,'#aaaabb');
  }
}

// ПФФФТ — старейшина в плаще с посохом
function drwNPC_Pfft(x,y,t,f,blink,walking,legOff){
  // Длинный плащ-балахон до пола
  rc(x-5,y-8,11,9,'#5544aa');rc(x-5,y-8,11,1,'#7766cc');
  rc(x-5,y-1,11,1,'#332266');
  // Узор на плаще — звёзды
  cx.fillStyle='#ffeecc';
  cx.fillRect(x-3,y-5,1,1);cx.fillRect(x+3,y-3,1,1);cx.fillRect(x,y-7,1,1);
  // Голова — пузырь старейшины
  cx.globalAlpha=0.8;
  disc(x,y-13,5,'#ddccff');
  cx.globalAlpha=1;
  ring(x,y-13,5,'#aaccff',1);
  // Седая борода-облачко выходит из пузыря
  cx.globalAlpha=0.85;
  disc(x,y-9,4,'#ffffff');
  cx.globalAlpha=1;
  // Глаза мудрые, прищуренные
  cx.fillStyle='#1a2244';
  if(!blink){cx.fillRect(x-2,y-13,2,1);cx.fillRect(x+1,y-13,2,1);}
  else{cx.fillRect(x-2,y-13,2,1);cx.fillRect(x+1,y-13,2,1);}
  // Капюшон
  rc(x-4,y-17,9,3,'#332266');rc(x-4,y-15,1,2,'#332266');rc(x+4,y-15,1,2,'#332266');
  rc(x-3,y-18,7,1,'#5544aa');
  // Посох с кристаллом
  rc(x-7+f*0,y-15,1,15,'#6644aa');// древко
  cx.globalAlpha=0.8+0.2*Math.sin(t*0.1);
  rc(x-8+f*0,y-17,3,3,'#aaffcc');// кристалл
  rc(x-7+f*0,y-16,1,1,'#ffffff');
  cx.globalAlpha=1;
}

// МРАУ — капитан в военной униформе с нашивками, рядом кошка
function drwNPC_Mrau(x,y,t,f,blink,walking,legOff){
  // Ноги в военных ботинках
  rc(x-3+legOff,y,3,3,'#1a1a1a');rc(x+1-legOff,y,3,3,'#1a1a1a');
  rc(x-3+legOff,y+2,3,1,'#332211');rc(x+1-legOff,y+2,3,1,'#332211');
  // Камуфляжный комбинезон
  rc(x-4,y-9,9,9,'#665533');rc(x-4,y-9,9,1,'#887744');
  // Камуфляжные пятна
  rc(x-3,y-7,2,1,'#443322');rc(x+1,y-5,2,1,'#443322');
  rc(x-1,y-3,2,1,'#443322');rc(x+2,y-7,1,2,'#887744');
  // Нашивки на плече
  rc(x-4,y-9,1,3,'#aa3333');
  rc(x+4,y-9,1,3,'#aa3333');
  // Пояс с пряжкой
  rc(x-4,y-2,9,1,'#332211');rc(x,y-2,1,1,'#ffcc44');
  // Голова — суровое лицо
  rc(x-3,y-16,7,7,'#dd9966');
  // Шрам через щёку
  rc(x+2,y-13,1,2,'#aa3322');
  // Усы военные
  rc(x-2,y-11,5,1,'#332211');
  // Глаза — острые, янтарные
  cx.fillStyle='#aa6622';
  if(!blink){cx.fillRect(x-1,y-13,1,2);cx.fillRect(x+2,y-13,1,2);}
  else{cx.fillRect(x-1,y-12,1,1);cx.fillRect(x+2,y-12,1,1);}
  // Военная фуражка с гербом
  rc(x-4,y-19,9,3,'#443322');rc(x-4,y-19,9,1,'#665533');
  rc(x-5,y-17,11,1,'#222');
  rc(x,y-18,1,1,'#ffcc44');// звезда
  // Кошка рядом!
  const catX=x+f*7+Math.sin(t*0.05)*1;
  const catY=y+1;
  // Тело кошки
  rc(catX-2,catY,4,3,'#dd8844');
  rc(catX-2,catY,1,3,'#dd8844');// хвост
  rc(catX+1,catY-1,1,3,'#dd8844');// хвост вверх
  // Голова кошки
  rc(catX-1,catY-2,2,2,'#dd8844');
  // Уши
  rc(catX-1,catY-3,1,1,'#dd8844');
  rc(catX,catY-3,1,1,'#dd8844');
  // Глаза кошки
  cx.fillStyle='#ffcc44';
  cx.fillRect(catX-1,catY-2,1,1);cx.fillRect(catX,catY-2,1,1);
}

// КРУЗ — бородатый старожил в пыльнике и шляпе
function drwNPC_Kruz(x,y,t,f,blink,walking,legOff){
  // Ноги в пыльных ботинках
  rc(x-3+legOff,y,3,3,'#553322');rc(x+1-legOff,y,3,3,'#553322');
  // Пыльник коричневый
  rc(x-5,y-9,11,10,'#886644');rc(x-5,y-9,11,1,'#aa8866');
  rc(x-5,y-1,11,1,'#664422');// низ темнее
  // Кожаные заплатки
  rc(x-3,y-6,2,2,'#553322');
  rc(x+2,y-3,2,2,'#553322');
  // Голова
  rc(x-3,y-16,7,7,'#dd9966');
  // Лохматая борода
  rc(x-3,y-12,7,4,'#554433');
  rc(x-4,y-11,1,3,'#554433');rc(x+4,y-11,1,3,'#554433');
  // Глаза прищуренные
  cx.fillStyle='#1a2244';
  if(!blink){cx.fillRect(x-1,y-13,1,1);cx.fillRect(x+2,y-13,1,1);}
  else{cx.fillRect(x-1,y-12,1,1);cx.fillRect(x+2,y-12,1,1);}
  // Шляпа-стэтсон с широкими полями
  rc(x-6,y-17,13,1,'#553322');
  rc(x-3,y-21,7,4,'#664433');rc(x-3,y-21,7,1,'#776644');
  // Лента на шляпе
  rc(x-3,y-18,7,1,'#aa8855');
  // Соломинка во рту
  rc(x+3,y-10,3,1,'#ffcc44');
}
function drwPC(pc,t){
  const x=pc.x|0,y=pc.y|0;
  const st=Math.floor(pc.wt/5)%4;
  const moving=pc.wt>0;
  const bob=moving?Math.sin(pc.wt*.25)*0.5:0;
  // Дополнительный подскок при беге
  const armSwing=moving?Math.sin(pc.wt*.32)*1:0;
  const ly=(y-bob)|0;
  const flip=(pc.facing===1)?1:-1;
  cx.save();cx.translate(x,0);cx.scale(flip,1);

  // === ТЕНЬ ===
  cx.fillStyle='rgba(0,0,0,0.32)';
  cx.fillRect(-4,ly+5,9,2);
  cx.fillRect(-3,ly+6,7,1);

  // === НОГИ ===
  cx.fillStyle='#1a3380';  // тёмно-синие штаны
  if(st===0||st===2){
    cx.fillRect(-3,ly,3,5);cx.fillRect(1,ly,3,5);
    // Ботинки
    cx.fillStyle='#221122';
    cx.fillRect(-3,ly+4,3,1);cx.fillRect(1,ly+4,3,1);
  }else if(st===1){
    cx.fillRect(-4,ly,3,6);cx.fillRect(2,ly,3,4);
    cx.fillStyle='#221122';
    cx.fillRect(-4,ly+5,3,1);cx.fillRect(2,ly+3,3,1);
  }else{
    cx.fillRect(-4,ly,3,4);cx.fillRect(2,ly,3,6);
    cx.fillStyle='#221122';
    cx.fillRect(-4,ly+3,3,1);cx.fillRect(2,ly+5,3,1);
  }

  // === КОРПУС / СКАФАНДР ===
  // Основной костюм - двухтоновый синий
  rc(-3,ly-8,7,9,'#2266cc');
  // Светлая верхняя часть - наплечники
  rc(-3,ly-8,7,2,'#3377dd');
  rc(-3,ly-8,7,1,'#4488ee');
  // Жёлтая полоса на груди (ремень)
  rc(-3,ly-3,7,1,'#ffcc44');
  rc(-1,ly-3,1,1,'#ffeecc'); // пряжка
  // Карман на боку
  rc(-3,ly-5,2,2,'#1144aa');
  // Ассиметричная нашивка (плечо)
  rc(2,ly-7,2,2,'#ff4488');
  rc(2,ly-6,2,1,'#ffaaaa');

  // === ШЛЕМ ===
  // Тёмная окантовка шлема
  rc(-3,ly-15,7,8,'#1a3380');
  // Внешний шлем
  rc(-2,ly-15,5,7,'#3388ee');
  rc(-2,ly-15,5,1,'#5599ff');
  // Визор - стеклянный
  rc(-1,ly-14,4,5,P.COC);
  // Блики на визоре
  rc(-1,ly-14,1,1,'#aaffdd');
  rc(2,ly-10,1,1,'#88eecc');
  rc(0,ly-13,2,1,'#66ddbb');
  // Антенна на шлеме
  rc(2,ly-17,1,2,'#888899');
  rc(2,ly-18,1,1,'#ff4488');
  // Мигалка антенны
  if(t%30<8)rc(2,ly-18,1,1,'#ffcc44');

  // === РУКИ ===
  cx.fillStyle='#2266cc';
  if(moving){
    // Анимация рук — качаются при беге
    const armOff=armSwing|0;
    if(st<2){
      cx.fillRect(-4,ly-7+armOff,2,4);
      cx.fillRect(5,ly-5-armOff,2,4);
    }else{
      cx.fillRect(-4,ly-5-armOff,2,4);
      cx.fillRect(5,ly-7+armOff,2,4);
    }
    // Перчатки
    cx.fillStyle='#1a3380';
    if(st<2){
      cx.fillRect(-4,ly-4+armOff,2,1);
      cx.fillRect(5,ly-2-armOff,2,1);
    }else{
      cx.fillRect(-4,ly-2-armOff,2,1);
      cx.fillRect(5,ly-4+armOff,2,1);
    }
  }else{
    // Стоит спокойно
    cx.fillRect(-4,ly-7,2,4);
    cx.fillRect(5,ly-7,2,4);
    cx.fillStyle='#1a3380';
    cx.fillRect(-4,ly-4,2,1);
    cx.fillRect(5,ly-4,2,1);
  }

  cx.restore();
}

function startDlg(G,npc){
  if(!npc)return;
  if(npc.graph){startDlgGraph(G,npc);return;}
  if(!npc.dlgs){return;} // нет ни graph, ни dlgs — просто выходим
  sfxUI2();let lines,cb=null;
  if(npc.id==='krok'&&!npc.lore){npc.lore=true;lines=npc.dlgs[2];cb=()=>{G.pl.res+=2;G.campaignState.inventory.krokRecords=true;G.notif='+2 РЕС + ЗАПИСИ КРОКА!';G.notifT=130;G.notifCol=P.RES;fText(LW/2,LH/2,'+2 РЕС',P.RES3);sfxPU();};}
  else{lines=npc.dlgs[npc.di%npc.dlgs.length];npc.di++;}
  G.dlg={mode:'linear',lines,cb,speaker:npc.name,prevAllowJoy:ALLOW_JOY};G.dlgChar=0;setJoyEnabled(false);
}

