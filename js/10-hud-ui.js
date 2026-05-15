// ============================================================
// 10-hud-ui.js
// HUD, joystick UI, action buttons, exclamations, quest panel, alien briefing, tutorial
// depends on: 01-core.js, 04-font.js, 06-input.js, 08-primitives-bg.js
// (originally sintara_v25.html lines 1641-2127)
// ============================================================

function drwWorkerHUD(G){if(USE_TOUCH_UI){const bx=LW-20,by=4,t=G.sT;const run=Math.floor(t/6)%4;cx.fillStyle=P.SH1;cx.fillRect(bx,by+2,2,3);cx.fillRect(bx,by,2,2);if(run===0){cx.fillRect(bx-1,by+5,1,2);cx.fillRect(bx+2,by+5,1,2);}else{cx.fillRect(bx-1,by+5,1,2);cx.fillRect(bx+2,by+5,2,1);}txt('+'+G.pl.workers,bx+4,by+1,P.EN,1);return;}}
function drwHUD(G){const p=G.pl;rc(0,0,LW,16,P.UIB);rc(0,15,LW,1,P.DIM);txt('ХП',2,3,P.UIT2,1);bar(14,3,42,5,p.hp/p.mhp,p.hp/p.mhp<.3?P.HPH:P.HP,P.HPB,P.DIM);txt('ЭН',2,10,P.UIT2,1);bar(14,10,42,4,p.en/p.men,p.en<20?P.ENL:P.EN,P.DIM2,P.DIM);let ix=58;if(p.shield>0){const a=.6+.4*Math.sin(G.sT*.2);cx.globalAlpha=a;ring(ix+2,5,3,P.CYA,1);cx.globalAlpha=1;bar(ix,9,5,1,p.shield/600,P.CYA,P.DIM2);ix+=8;}const pbx=Math.max(62,ix),pby=4,pbw=140-(ix-62);rc(pbx,pby,pbw,6,P.SCAN);const fw=Math.floor(pbw*G.prog);rc(pbx,pby,fw,6,P.PL1);if(fw>1)rc(pbx,pby,fw,1,P.PL2);cx.strokeStyle=P.DIM;cx.lineWidth=.5;cx.strokeRect(pbx+.5,pby+.5,pbw-1,5);const boostPix=(G.pl.boost>0)?2:0;const shipPx=pbx+Math.max(0,Math.min(pbw-3,(fw-3)+boostPix));rc(shipPx,pby,3,1,P.CYA);rc(shipPx+1,pby+1,2,1,P.WHT);rc(shipPx,pby+2,3,1,P.CYA);const destInfo=PLANETS[G.campaignState.targetPlanet]||PLANETS.drosh;txt(destInfo.name,pbx+pbw+2,pby-1,P.PL2,1);if(G.combo>1){const cxx=pbx+pbw+2;txs('x'+G.combo,cxx,pby+5,G.combo>=5?P.YEL:P.UIT2,P.BLK,1);}/* ★ Phase 2.2: 6 слотов оружия. Активное — название+стоимость EN.
   Под названием — компактная панель индикаторов 1..6: заблокированные тусклые, разблокированные цветные, текущий обведён жёлтым. */
const _haveWeapons=(typeof WEAPONS!=='undefined');
const activeIdxNew=_haveWeapons?(p.wepIdx||0):0;
const activeWep=_haveWeapons?WEAPONS[activeIdxNew]:null;
const activeName=activeWep?activeWep.name:'ЛАЗЕР L1';
const activeCol=activeWep?activeWep.col:P.L1;
const activeEN=activeWep?activeWep.en:10;
if(!USE_TOUCH_UI){
  // Название активного оружия + стоимость EN
  txs(activeName,pbx,10,activeCol,P.BLK,1);
  txt(activeEN+'EN',pbx+gw(activeName)+3,10,p.en>=activeEN?P.UIT2:P.HPH,1);
  txt('КР:'+p.cr,pbx+pbw+26,2,P.YEL,1);
  txt('РЕ:'+p.res,pbx+pbw+26,9,P.RES,1);
}else{
  txt('КР:'+p.cr,pbx,10,P.YEL,1);
  txt('РЕ:'+p.res,pbx+34,10,P.RES,1);
  txs(activeName,pbx+74,10,activeCol,P.BLK,1);
}if(G.ship){const fy=18;const fc=G.ship.fuel<20?P.RED:P.ORA;cx.globalAlpha=.92;rc(2,fy,54,7,P.UIB);txt('ТОПЛ',4,fy+1,P.UIT2,1);bar(25,fy+1,28,4,G.ship.fuel/100,fc,P.DIM2,P.DIM);if(G.ship.fuel<1&&Math.floor(G.sT/12)%2)txs('АВАР.ХОД',58,fy+1,P.RED,P.BLK,1);cx.globalAlpha=1;}drwWorkerHUD(G);}
function drwJoystick(){if(!USE_TOUCH_UI||!ALLOW_JOY)return;if(!TOUCH.joyActive){const bx=38,by=LH-38;cx.globalAlpha=.25;ring(bx,by,22,P.UIT2,1);ring(bx,by,8,P.UIT2,1);cx.globalAlpha=.4;txt('MOVE',bx-9,by+26,P.UIT2,1);cx.globalAlpha=1;}else{cx.globalAlpha=.5;disc(TOUCH.joyBaseX|0,TOUCH.joyBaseY|0,22,'#001122');ring(TOUCH.joyBaseX|0,TOUCH.joyBaseY|0,22,P.UIT,1);cx.globalAlpha=1;cx.globalAlpha=.85;disc(TOUCH.joyX|0,TOUCH.joyY|0,9,P.UIT);disc(TOUCH.joyX|0,TOUCH.joyY|0,6,P.UIT2);cx.globalAlpha=1;}}
// ★ v16: Стилизованные иконки для ship/launch — рисуют корабль/ракету вместо буквы
function drwShipIcon(cx_,cy_,col){
  // Маленькая иконка-корабль (5x3px), профиль — нос вправо
  cx.fillStyle=col;
  // Корпус
  cx.fillRect(cx_-3,cy_-1,6,3);
  // Нос (треугольный кончик)
  cx.fillRect(cx_+3,cy_,2,1);
  // Крылья
  cx.fillRect(cx_-2,cy_-2,3,1);
  cx.fillRect(cx_-2,cy_+2,3,1);
  // Хвостовое пламя
  cx.fillStyle='#ff8822';
  cx.fillRect(cx_-5,cy_,2,1);
  cx.fillStyle='#ffee44';
  cx.fillRect(cx_-4,cy_,1,1);
  // Кокпит
  cx.fillStyle='#aaeeff';
  cx.fillRect(cx_,cy_,1,1);
}
function drwLaunchIcon(cx_,cy_,col,locked,t){
  // Иконка-ракета взлетающая вверх (3x6px)
  cx.fillStyle=col;
  // Корпус ракеты
  cx.fillRect(cx_-1,cy_-3,3,4);
  // Нос
  cx.fillRect(cx_,cy_-4,1,1);
  // Крылья по бокам у основания
  cx.fillRect(cx_-2,cy_,1,1);
  cx.fillRect(cx_+2,cy_,1,1);
  // Иллюминатор
  cx.fillStyle=locked?'#660000':'#aaeeff';
  cx.fillRect(cx_,cy_-2,1,1);
  // Пламя снизу (если разблокирована — анимированное)
  if(!locked){
    const fl=Math.floor(t/4)%2;
    cx.fillStyle='#ff8822';
    cx.fillRect(cx_-1,cy_+2,3,fl?2:1);
    cx.fillStyle='#ffee44';
    cx.fillRect(cx_,cy_+2,1,fl?2:1);
    if(fl){
      cx.fillStyle='#ffff88';
      cx.fillRect(cx_,cy_+3,1,1);
    }
  }else{
    // Замок (две перекрещённые линии) для заблокированной кнопки
    cx.fillStyle='#660000';
    cx.fillRect(cx_-1,cy_+2,3,1);
  }
}
function drwActionBtns(){
  if(!USE_TOUCH_UI)return;
  const t=(window.G&&window.G.sT)||0;
  for(const b of TOUCH.btns){
    if(!b.enabled||b.hidden)continue;
    const pressed=b.pressed;
    // ★ v16: Стилизованные кнопки ship и launch
    if(b.id==='ship'||b.id==='launch'){
      // Внешний фон с лёгкой пульсацией для привлечения внимания
      const pulse=0.85+0.15*Math.sin(t*0.08);
      cx.globalAlpha=pressed?0.95:0.78;
      // Тёмный фон-кружок
      disc(b.x|0,b.y|0,b.r,'#031020');
      // Внутренний градиент-кольцо
      cx.globalAlpha=pressed?0.7:0.45;
      disc(b.x|0,b.y|0,b.r-2,pressed?b.col:'#072038');
      cx.globalAlpha=1;
      // Двойной обвод для "проработанности"
      ring(b.x|0,b.y|0,b.r,b.col,1);
      cx.globalAlpha=0.55;
      ring(b.x|0,b.y|0,b.r-3,b.col,1);
      cx.globalAlpha=1;
      // Иконка
      if(b.id==='ship'){
        // ★ v16 r9 #4: Кнопка корабля МИГАЕТ когда взлёт готов
        const G=window.G;
        let launchReady=false;
        if(G&&G.state==='planet_drosh'&&G.droshDone)launchReady=true;
        else if(G&&G.state==='planet_bubblika'&&G.bubblikaDone)launchReady=true;
        else if(G&&G.state==='planet_krasnozem'&&G.krasDone)launchReady=true;
        if(launchReady){
          // Зелёное мигание + свечение-кольцо
          const blink=Math.floor(t/12)%2;
          cx.globalAlpha=0.4+0.3*Math.sin(t*0.18);
          ring(b.x|0,b.y|0,b.r+3,P.GRN,1);
          ring(b.x|0,b.y|0,b.r+5,P.GRN,1);
          cx.globalAlpha=1;
          // Иконка корабля окрашена в зелёный
          drwShipIcon(b.x|0,(b.y-1)|0,blink?P.GRN:'#aaffcc');
          // Подпись «ВЗЛЁТ!» вместо «КОРАБЛЬ»
          cx.globalAlpha=pressed?1:0.95;
          txs('ВЗЛЁТ!',(b.x-gw('ВЗЛЁТ!')/2)|0,(b.y+b.r+2)|0,P.GRN,P.BLK,1);
          cx.globalAlpha=1;
        }else{
          drwShipIcon(b.x|0,(b.y-1)|0,pressed?P.BLK:b.col);
          // Подпись снизу
          cx.globalAlpha=pressed?1:0.85;
          txs('КОРАБЛЬ',(b.x-gw('КОРАБЛЬ')/2)|0,(b.y+b.r+2)|0,b.col,P.BLK,1);
          cx.globalAlpha=1;
        }
      }else{
        const locked=(b.col===P.RED||b.col===P.UIT2);
        drwLaunchIcon(b.x|0,(b.y-1)|0,pressed?P.BLK:b.col,locked,t);
        cx.globalAlpha=pressed?1:0.85;
        const lbl=locked?'ЗАКРЫТО':'ВЗЛЁТ';
        txs(lbl,(b.x-gw(lbl)/2)|0,(b.y+b.r+2)|0,b.col,P.BLK,1);
        cx.globalAlpha=1;
        // Анимированное свечение если готов взлетать (не заблокирована)
        if(!locked){
          cx.globalAlpha=0.25+0.15*Math.sin(t*0.18);
          ring(b.x|0,b.y|0,b.r+2,b.col,1);
          cx.globalAlpha=1;
        }
      }
      continue;
    }
    // Стандартная кнопка
    cx.globalAlpha=pressed?.9:.6;
    disc(b.x|0,b.y|0,b.r,pressed?b.col:'#001122');
    ring(b.x|0,b.y|0,b.r,b.col,1);
    cx.globalAlpha=1;
    const lw=gw(b.label);
    txs(b.label,(b.x-lw/2)|0,(b.y-2)|0,pressed?P.BLK:b.col,P.BLK);
  }
}

// ======= ВОСКЛИЦАТЕЛЬНЫЙ ЗНАК (квест-индикатор) =======
// Большой, выразительный, со свечением и пульсацией.
// x,y — позиция вершины восклицательного знака (макушка)
// t — глобальный таймер для анимации
// col — основной цвет (по умолчанию жёлтый)
function drwExclaim(x,y,t,col){
  col=col||P.YEL;
  // Pulse-эффект (масштаб + alpha)
  const pulse=0.85+0.15*Math.sin(t*0.18);
  const bob=Math.sin(t*0.10)*1.5;
  // Свечение-ореол вокруг (мягкое)
  cx.globalAlpha=0.18*pulse;
  disc((x)|0,(y+5+bob)|0,7,col);
  cx.globalAlpha=0.30*pulse;
  disc((x)|0,(y+5+bob)|0,5,col);
  cx.globalAlpha=1;
  // Тень/контур (1px смещение вниз-вправо)
  cx.fillStyle='#000';
  cx.fillRect((x-1)|0,(y+1+bob)|0,4,8);   // палочка-тень
  cx.fillRect((x-1)|0,(y+10+bob)|0,4,3);   // точка-тень
  // Сам знак — крупный (3px ширина, 7px палочка + точка)
  cx.fillStyle=col;
  cx.fillRect((x-1)|0,(y+bob)|0,3,7);     // палочка
  cx.fillRect((x-1)|0,(y+9+bob)|0,3,3);    // точка
  // Блик (1px белая точка слева)
  cx.fillStyle='#fff';
  cx.fillRect((x-1)|0,(y+bob)|0,1,2);
  cx.globalAlpha=1;
}

// ======= КВЕСТ-ПАНЕЛЬ (верхний правый угол) =======
// Возвращает массив активных квестов с заголовком и прогрессом.
function getActiveQuests(G){
  const out=[];
  // Дрош — маяки или удержание
  if(G.droshSide&&G.droshSide.questAccepted&&!G.droshSide.done){
    if(G.droshSide.holdActive){
      const pct=Math.floor(G.droshSide.holdT/G.droshSide.holdDur*100);
      out.push({title:'УДЕРЖИ ОГОНЬ',progress:pct+'%',col:P.YEL});
    }else{
      const f=G.droshSide.beacons.filter(b=>b.fixed).length;
      const total=G.droshSide.beacons.length;
      out.push({title:'ЗАЖГИ МАЯКИ',progress:f+'/'+total,col:f<total?P.CYA:P.YEL});
    }
  }
  // Бубблика — доставка спор
  if(G.bub&&G.bub.delivery&&G.bub.delivery.active&&!G.campaignState.flags.bubDeliveryDone){
    const D=G.bub.delivery;
    if(D.carrying){
      const ts=Math.ceil(D.timer/60);
      const dest=G.bub.islands[D.to]?G.bub.islands[D.to].name:'?';
      out.push({title:'ДОСТАВКА СПОР',progress:'НА '+dest+' '+ts+'С',col:ts<5?P.RED:P.YEL});
    }else if(D.completed<D.target){
      out.push({title:'ДОСТАВКА СПОР',progress:D.completed+'/'+D.target+' К ПФФФТУ',col:P.CYA});
    }else{
      out.push({title:'ДОСТАВКА СПОР',progress:'ВЕРНИСЬ К ПФФФТУ',col:P.GRN});
    }
  }
  // Краснозём — снаряды и хищники
  if(G.krz&&G.krz.questActive&&!G.krasDone){
    const KZ=G.krz;
    const total=KZ.shells.length;
    if(KZ.carryIdx>=0){
      out.push({title:'ЗАРЯДИ ТУРЕЛЬ',progress:'НЕСИ К ТУРЕЛИ ('+KZ.delivered+'/'+total+')',col:P.YEL});
    }else if(KZ.delivered<total){
      out.push({title:'СНАРЯДЫ',progress:'СОБЕРИ '+KZ.delivered+'/'+total,col:P.CYA});
    }else{
      const alive=KZ.scavengers.filter(s=>s.alive).length;
      out.push({title:'ХИЩНИКИ',progress:'ОСТАЛОСЬ: '+alive,col:alive>0?P.RED:P.GRN});
    }
  }
  return out;
}

function drwQuestPanel(G){
  const quests=getActiveQuests(G);
  if(!quests.length)return;
  // ★ v16: Панель меньше (×0.8) и прозрачнее (-20%, 0.85→0.68)
  const panelW=106;     // ★ v16 r9 #3: 88→106 (+20%) для умещения текста
  const headerH=8;     // было 10
  const rowH=14;       // было 18 (текст помельче, плотнее)
  const totalH=headerH+quests.length*rowH+3;
  const px=LW-panelW-2;
  const py=18; // под HUD-баром
  // Фон с лёгкой прозрачностью (была 0.85, стала 0.68)
  cx.globalAlpha=0.68;
  bx2(px,py,panelW,totalH,'#0a0820',P.YEL,1);
  cx.globalAlpha=1;
  // Заголовок секции
  cx.globalAlpha=0.78;
  rc(px+1,py+1,panelW-2,6,'#221800');
  cx.globalAlpha=1;
  txs('КВЕСТЫ',px+3,py+1,P.YEL,P.BLK,1);
  // Маленький мигающий индикатор активности
  const ind=Math.floor(G.sT/15)%2;
  if(ind)rc(px+panelW-5,py+2,2,2,P.YEL);
  // Список квестов
  let yPos=py+headerH+1;
  for(const q of quests){
    cx.globalAlpha=0.95;
    txs(q.title,px+3,yPos,P.WHT,P.BLK,1);
    txs(q.progress,px+5,yPos+7,q.col,P.BLK,1);
    cx.globalAlpha=1;
    yPos+=rowH;
  }
}

// ======= БРИФИНГ ПРИШЕЛЬЦА — отдельная функция =======
// Состояние: G.briefing = {t:N, planet:'drosh|...'}
// Активирует увеличение t каждый кадр, рендерит окно "входящий вызов",
// автоматически скрывается через ~4 секунды после окончания печати.
function drwAlienBriefing(G){
  if(!G.briefing)return;
  const B=G.briefing;
  B.t++;
  const briefing=getAlienBriefing(B.planet);
  if(!briefing){G.briefing=null;return;}
  const t=B.t;
  // Тайминги: задержка появления → fade-in → печать → задержка → fade-out
  const isTinaBriefing=B.planet&&B.planet.startsWith('tina_phase');
  const SHOW_DELAY=40;
  const FADE_IN=30;
  const TYPE_RATE=isTinaBriefing?0.9:1.4;
  const STAY_AFTER_TYPE=isTinaBriefing?100:240;
  const FADE_OUT=30;
  const charsTotal=briefing.length;
  const typingStartT=SHOW_DELAY;
  const typingEndT=typingStartT+charsTotal*TYPE_RATE;
  const fadeOutStartT=typingEndT+STAY_AFTER_TYPE;
  const fadeOutEndT=fadeOutStartT+FADE_OUT;
  if(t<SHOW_DELAY)return;
  if(t>fadeOutEndT){G.briefing=null;return;}
  // Альфа канал
  let alienA;
  if(t<SHOW_DELAY+FADE_IN) alienA=(t-SHOW_DELAY)/FADE_IN;
  else if(t<fadeOutStartT) alienA=1;
  else alienA=1-(t-fadeOutStartT)/FADE_OUT;
  alienA=Math.max(0,Math.min(1,alienA));
  cx.globalAlpha=alienA;
  // Окно сигнала внизу экрана (рация-портрет слева + текст справа)
  const boxX=4, boxY=LH-58, boxW=LW-8, boxH=52;
  bx2(boxX,boxY,boxW,boxH,'#020a14','#3388cc',1);
  const beepBlink=Math.sin(t*0.18)*0.5+0.5;
  cx.globalAlpha=alienA*(0.5+beepBlink*0.5);
  rc(boxX+1,boxY+1,boxW-2,1,'#5599cc');
  cx.globalAlpha=alienA;
  // === ЛЕВЫЙ БЛОК: ПОРТРЕТ ПРИШЕЛЬЦА ===
  const portX=boxX+5, portY=boxY+5, portW=22, portH=42;
  bx2(portX,portY,portW,portH,'#001122','#1a4470',1);
  for(let sl=0;sl<portH-2;sl++){
    if(sl%2===0){
      cx.globalAlpha=alienA*0.4;
      cx.fillStyle='#0a2030';
      cx.fillRect(portX+1,portY+1+sl,portW-2,1);
      cx.globalAlpha=alienA;
    }
  }
  const apx=portX+portW/2|0;
  const apy=portY+portH/2+6|0;
  rc(apx-3,apy-3,7,7,'#7744aa');
  rc(apx-2,apy-3,5,1,'#aa66cc');
  rc(apx-3,apy+3,7,1,'#552288');
  cx.globalAlpha=alienA*0.85;
  disc(apx,apy-8,5,'#aaeeff');
  cx.globalAlpha=alienA;
  ring(apx,apy-8,5,'#88ccee',1);
  const eyeBlink=Math.floor(t/55)%5===0;
  cx.fillStyle='#000';
  if(!eyeBlink){
    cx.fillRect(apx-2,apy-10,2,2);
    cx.fillRect(apx+1,apy-10,2,2);
    cx.fillStyle='#ffffff';
    cx.fillRect(apx-2,apy-10,1,1);
    cx.fillRect(apx+1,apy-10,1,1);
  }else{
    cx.fillRect(apx-2,apy-9,2,1);
    cx.fillRect(apx+1,apy-9,2,1);
  }
  // Рот двигается во время печати, замирает после
  if(t<typingEndT&&t%6<3){
    cx.fillStyle='#552288';
    cx.fillRect(apx-1,apy-6,2,1);
  }
  rc(apx-2,apy-14,1,2,'#aaeeff');
  rc(apx+2,apy-14,1,2,'#aaeeff');
  if(t%14<7){
    cx.fillStyle='#ff44aa';
    cx.fillRect(apx-2,apy-15,1,1);
    cx.fillRect(apx+2,apy-15,1,1);
  }
  txs('СИГНАЛ',portX+1,portY+portH-7,'#5599cc',P.BLK,1);
  // === ПРАВЫЙ БЛОК: ТЕКСТ БРИФИНГА ===
  const txtX=portX+portW+6, txtY=boxY+4;
  const txtW=boxW-portW-12;
  txs('ВХОДЯЩИЙ ВЫЗОВ',txtX,txtY,'#5599cc',P.BLK,1);
  for(let bb=0;bb<3;bb++){
    const blAlpha=Math.sin(t*0.15+bb*1.5)*0.5+0.5;
    cx.globalAlpha=alienA*blAlpha;
    cx.fillStyle='#5599cc';
    cx.fillRect(txtX+gw('ВХОДЯЩИЙ ВЫЗОВ')+3+bb*2,txtY+1,1,3);
    cx.globalAlpha=alienA;
  }
  rc(txtX,txtY+8,txtW,1,'#1a4470');
  // Текст брифинга — печатается посимвольно, ускоренный темп
  const charsRevealed=Math.max(0,Math.min(charsTotal,Math.floor((t-typingStartT)/TYPE_RATE)));
  const visibleText=briefing.slice(0,charsRevealed);
  const allLines=[];
  const words=visibleText.split(' ');
  let curLine='';
  for(const w of words){
    const trial=curLine?curLine+' '+w:w;
    if(gw(trial)<=txtW)curLine=trial;
    else{if(curLine)allLines.push(curLine);curLine=w;if(allLines.length>=3)break;}
  }
  if(curLine&&allLines.length<4)allLines.push(curLine);
  for(let i=0;i<Math.min(4,allLines.length);i++){
    txs(allLines[i],txtX,txtY+11+i*8,'#cce8ff',P.BLK,1);
  }
  // Курсор печати
  if(charsRevealed<charsTotal&&Math.floor(t/8)%2){
    const lastLine=allLines[allLines.length-1]||'';
    const ly=txtY+11+(allLines.length-1)*8;
    txs('_',txtX+gw(lastLine),ly,'#5599cc',P.BLK,1);
  }
  cx.globalAlpha=1;
}

// ======= ТУТОРИАЛ =======
// Простая система подсказок: показывает стрелки и текст указывающие на элементы UI/механики.
// Игрок может закрыть тап/Enter/Esc или пройти по шагам.
// G.tutorial = {steps:[{x,y,text,arrow:'left|right|up|down'}], step:0, t:0}

function startTutorial(G,steps){
  G.tutorial={steps,step:0,t:0,visible:true};
  // Не трогаем TAP_FIRE — тач-стрельба в правой части экрана блокируется тем,
  // что upd-функции возвращают рано при G.tutorial. Если же отключить TAP_FIRE,
  // он останется false после закрытия туториала — и игрок не сможет стрелять.
}

function updTutorial(G){
  if(!G.tutorial||!G.tutorial.visible)return false;
  G.tutorial.t++;
  // Закрытие: продвинуться к следующему шагу или закрыть
  if(G.tutorial.t>20&&(KD.Enter||KD.Space||mC||KD.Escape||btnJust('int'))){
    KD.Enter=false;KD.Space=false;mC=false;
    sfxUI();
    if(G.tutorial.step<G.tutorial.steps.length-1){
      G.tutorial.step++;G.tutorial.t=0;
    }else{
      G.tutorial.visible=false;
      G.tutorial=null;
    }
    return true;  // ввод обработан
  }
  return true; // блокирует игровой ввод пока туториал активен
}

function drwTutorial(G){
  if(!G.tutorial||!G.tutorial.visible)return;
  const T=G.tutorial;
  const cur=T.steps[T.step];
  if(!cur)return;
  // Полупрозрачное затемнение
  cx.globalAlpha=0.45;
  rc(0,0,LW,LH,P.BLK);
  cx.globalAlpha=1;

  // Подсветка области:
  //  - если задан hrect — рисуем прямоугольник (для протяжённых UI типа HUD)
  //  - иначе если hx/hy — пульсирующий круг
  if(cur.hrect){
    const hr=cur.hrect;
    cx.globalAlpha=0.4+0.25*Math.sin(T.t*0.15);
    // Контур пунктирной рамки
    cx.strokeStyle=P.YEL;cx.lineWidth=1;
    cx.strokeRect(hr.x-1,hr.y-1,hr.w+2,hr.h+2);
    cx.strokeRect(hr.x-3,hr.y-3,hr.w+6,hr.h+6);
    // Уголки усиленные
    const cn=3;
    cx.fillStyle=P.YEL;
    // Верхние углы
    cx.fillRect(hr.x-3,hr.y-3,cn,1);cx.fillRect(hr.x-3,hr.y-3,1,cn);
    cx.fillRect(hr.x+hr.w+3-cn,hr.y-3,cn,1);cx.fillRect(hr.x+hr.w+2,hr.y-3,1,cn);
    // Нижние углы
    cx.fillRect(hr.x-3,hr.y+hr.h+2,cn,1);cx.fillRect(hr.x-3,hr.y+hr.h+3-cn,1,cn);
    cx.fillRect(hr.x+hr.w+3-cn,hr.y+hr.h+2,cn,1);cx.fillRect(hr.x+hr.w+2,hr.y+hr.h+3-cn,1,cn);
    cx.globalAlpha=1;
  }else if(cur.hx!=null&&cur.hy!=null&&!cur.noRing){
    const r=cur.hr||14;
    cx.globalAlpha=0.3+0.2*Math.sin(T.t*0.15);
    ring(cur.hx,cur.hy,r,P.YEL,1);
    ring(cur.hx,cur.hy,r+3,P.YEL,1);
    cx.globalAlpha=1;
  }

  // Стрелка к указываемому элементу
  if(cur.hx!=null&&cur.hy!=null&&cur.arrow){
    const off=Math.sin(T.t*0.12)*2;
    cx.fillStyle=P.YEL;
    if(cur.arrow==='left'){
      // указывает влево (от подсказки)
      const ax=cur.hx+10+off,ay=cur.hy;
      cx.fillRect(ax,ay-1,4,2);
      cx.fillRect(ax,ay-2,2,1);cx.fillRect(ax,ay+1,2,1);
      cx.fillRect(ax+1,ay-3,1,1);cx.fillRect(ax+1,ay+2,1,1);
    }else if(cur.arrow==='right'){
      const ax=cur.hx-14-off,ay=cur.hy;
      cx.fillRect(ax,ay-1,4,2);
      cx.fillRect(ax+2,ay-2,2,1);cx.fillRect(ax+2,ay+1,2,1);
      cx.fillRect(ax+3,ay-3,1,1);cx.fillRect(ax+3,ay+2,1,1);
    }else if(cur.arrow==='up'){
      const ax=cur.hx,ay=cur.hy+10+off;
      cx.fillRect(ax-1,ay,2,4);
      cx.fillRect(ax-2,ay,1,2);cx.fillRect(ax+1,ay,1,2);
      cx.fillRect(ax-3,ay+1,1,1);cx.fillRect(ax+2,ay+1,1,1);
    }else if(cur.arrow==='down'){
      const ax=cur.hx,ay=cur.hy-14-off;
      cx.fillRect(ax-1,ay,2,4);
      cx.fillRect(ax-2,ay+2,1,2);cx.fillRect(ax+1,ay+2,1,2);
      cx.fillRect(ax-3,ay+1,1,1);cx.fillRect(ax+2,ay+1,1,1);
    }
  }

  // Облако с текстом
  const lines=Array.isArray(cur.text)?cur.text:[cur.text];
  let maxW=0;for(const l of lines)maxW=Math.max(maxW,gw(l));
  const boxW=maxW+10,boxH=lines.length*8+8;
  let bx=cur.tx!=null?cur.tx:(LW-boxW)/2;
  let by=cur.ty!=null?cur.ty:LH-boxH-26;
  bx=Math.max(2,Math.min(LW-boxW-2,bx));
  by=Math.max(20,Math.min(LH-boxH-2,by));
  bx=bx|0;by=by|0;

  // Появление с лёгким fade-in
  const fade=Math.min(1,T.t/15);
  cx.globalAlpha=fade;
  bx2(bx,by,boxW,boxH,'#001833',P.YEL,1);
  rc(bx+1,by+1,boxW-2,1,'#33aacc');  // верхняя планка
  for(let i=0;i<lines.length;i++){
    txs(lines[i],bx+5,by+4+i*8,P.WHT,P.BLK,1);
  }
  cx.globalAlpha=1;

  // Подсказка в углу — "тап продолжить"
  if(T.t>30&&Math.floor(T.t/22)%2){
    const m=USE_TOUCH_UI?'ТАП':'ENTER';
    const isLast=T.step>=T.steps.length-1;
    const action=isLast?'ЗАКРЫТЬ':'ДАЛЬШЕ';
    txcs(m+' - '+action,LH-5,P.UIT3,P.BLK,1);
  }

  // Прогресс шагов (точки внизу слева)
  for(let i=0;i<T.steps.length;i++){
    const dx=4+i*5,dy=LH-5;
    rc(dx,dy,3,3,i===T.step?P.YEL:'#333344');
  }
}
// ======= /ТУТОРИАЛ =======
