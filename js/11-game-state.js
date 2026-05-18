// ============================================================
// 11-game-state.js
// newGame factory + G global state + transitions + pause overlay
// depends on: 01-core.js, 02-checkpoint.js, 04-font.js, 05-audio.js, 06-input.js
// (originally sintara_v25.html lines 2128-2252)
// ============================================================


function newGame(){return{state:'menu',menuT:0,menuSt:[],pl:{x:50,y:LH/2,vx:0,vy:0,hp:240,mhp:240,en:120,men:150,wep:1,cr:0,res:0,workers:1,sCD:0,thrT:0,inv:0,shield:0,boost:0,squash:0,drift:0,boostWas:false,autoFire:false},asts:[],buls:[],rits:[],enms:[],ebuls:[],pups:[],sT:0,prog:0,appr:false,landT:0,astST:40,enmST:240,npcs:[],pc:{x:90,y:90,facing:1,wt:0},dlg:null,dlgChar:0,droshDone:false,zorpRec:false,bubblikaDone:false,krasnozemDone:false,notif:null,notifT:0,notifCol:P.CYA,qrw:null,shipT:0,goT:0,combo:0,comboT:0,transIn:60,transOut:0,transNext:null,shipReturnState:'planet_drosh',paused:false,pauseSel:0,
  // Туториал — массив подсказок текущей сцены. null когда туториала нет.
  tutorial:null,
  campaignState:{currentPlanet:'drosh',targetPlanet:'drosh',planetsVisited:[],planetsCompleted:[],inventory:{krokRecords:false,bubblikaContract:false,laserBlueprint:false,laserStrong:false,shieldBlueprint:false,shieldBuilt:false,starBattery:false,energyShield:false,spreadUnlocked:false,missileUnlocked:false,beamUnlocked:false,starMap:false},materials:0,inventory_extra:{},
    // ★ PR D: постоянные апгрейды (sink для КР/РЕС в конце игры)
    upgrades:{hp:0,en:0,workers:0,speed:0,dmg:0},flags:{pfftGifted:false,droshSideDone:false,bubSideDone:false,
    // Флаги показа туториалов (один раз)
    tutSpaceShown:false,tutDroshShown:false,tutShipShown:false,tutWorkshopShown:false,tutWorkersShown:false,tutMapShown:false,tutFuelShown:false,
  }},ship:{fuel:70,decor:0,workers:{power:1,fuel:0,bridge:0,workshop:0},craftQueue:[]},
  // ★ PR C: текущий экран корабля — 'main' | 'workshop' | 'workers' (сбрасывается на 'main' при входе)
  shipUI:'main',
  // ★ Phase 5.3: ачивки + аккумулирующие счётчики
  achievements:{},
  achievementBanner:null,
  _aStartT:Date.now(),
  _aTotalPirateKills:0,
  _aTotalResCollected:0,
  _aBeaconsLost:0,
  _aFinaleDeaths:0,
  _aNpcsTalked:{},
  _aFirstAstKilled:false,
  };}

// ★ Phase 2.4: гарантирует наличие новых полей в G.ship для старых сейвов.
//   Старая модель имела только G.pl.workers (всего рабочих). Новая хранит
//   распределение по комнатам в G.ship.workers. По умолчанию все в Power.
function ensureShipWorkers(G){
  if(!G.ship)return;
  if(!G.ship.workers){
    G.ship.workers={power:G.pl?G.pl.workers||1:1,fuel:0,bridge:0,workshop:0};
  }
  if(!G.ship.craftQueue){G.ship.craftQueue=[];}
  // Sanity: общая сумма должна равняться G.pl.workers; если нет — корректируем power.
  const sum=G.ship.workers.power+G.ship.workers.fuel+G.ship.workers.bridge+G.ship.workers.workshop;
  const total=G.pl?G.pl.workers||sum:sum;
  if(sum!==total){
    const delta=total-sum;
    G.ship.workers.power=Math.max(0,G.ship.workers.power+delta);
  }
}

// Helper: add one new worker to the ship, placing them in the first room with <5 workers.
// Preferred order: power → workshop → fuel → bridge.
function addWorkerToShip(G){
  ensureShipWorkers(G);
  const w=G.ship.workers;
  for(const r of ['power','workshop','fuel','bridge']){
    if(w[r]<5){w[r]++;return;}
  }
  w.power++; // all rooms at cap — still add (shouldn't happen normally)
}

// ★ Phase 2.4: перемещение 1 рабочего между комнатами (used by ship UI).
//   delta=+1 — взять у самой «густой» (>0) другой комнаты и положить сюда.
//   delta=-1 — отдать в Power (или Fuel если room уже Power).
function reallocWorkers(G,room,delta){
  ensureShipWorkers(G);
  const w=G.ship.workers;
  if(delta>0){
    if(w[room]>=5)return false; // лимит 5 рабочих на отсек
    let donor=null,maxC=0;
    for(const r of ['power','fuel','bridge','workshop']){
      if(r===room)continue;
      if(w[r]>maxC){maxC=w[r];donor=r;}
    }
    if(donor){w[donor]--;w[room]++;return true;}
    return false;
  }
  if(w[room]<=0)return false;
  const recipient=room==='power'?'fuel':'power';
  if(w[recipient]>=5)return false;
  w[room]--;w[recipient]++;
  return true;
}

let G=newGame();window.G=G;
function startTrans(nextFn){G.transOut=30;G.transNext=nextFn;}
function drawTrans(){if(G.transIn>0){const a=G.transIn/60;cx.globalAlpha=a;cx.fillStyle='#000';cx.fillRect(0,0,LW,LH);cx.globalAlpha=1;G.transIn--;}if(G.transOut>0){const a=1-G.transOut/30;cx.globalAlpha=a;cx.fillStyle='#000';cx.fillRect(0,0,LW,LH);cx.globalAlpha=1;G.transOut--;if(G.transOut===0&&G.transNext){G.transNext();G.transNext=null;G.transIn=30;}}}

// ======= ПАУЗА И НАСТРОЙКИ =======
const PAUSE_ICON_X=LW-13, PAUSE_ICON_Y=2, PAUSE_ICON_W=11, PAUSE_ICON_H=11;
function drwPauseIcon(){
  // Иконка паузы в правом верхнем углу
  const x=PAUSE_ICON_X, y=PAUSE_ICON_Y;
  const hover=(mX>=x&&mX<=x+PAUSE_ICON_W&&mY>=y&&mY<=y+PAUSE_ICON_H);
  cx.globalAlpha=hover?0.95:0.75;
  rc(x,y,PAUSE_ICON_W,PAUSE_ICON_H,P.UIB);
  cx.strokeStyle=hover?P.YEL:P.UIT2;cx.lineWidth=0.5;
  cx.strokeRect(x+0.5,y+0.5,PAUSE_ICON_W-1,PAUSE_ICON_H-1);
  rc(x+3,y+3,2,5,hover?P.YEL:P.UIT);
  rc(x+6,y+3,2,5,hover?P.YEL:P.UIT);
  cx.globalAlpha=1;
}
function pauseIconClicked(){
  return mC && mX>=PAUSE_ICON_X && mX<=PAUSE_ICON_X+PAUSE_ICON_W && mY>=PAUSE_ICON_Y && mY<=PAUSE_ICON_Y+PAUSE_ICON_H;
}
function drwPauseOverlay(G){
  // Затемнение
  cx.globalAlpha=0.78;rc(0,0,LW,LH,'#000');cx.globalAlpha=1;
  // Рамка панели
  const pw=180, ph=136, px=(LW-pw)/2, py=(LH-ph)/2;
  rc(px-2,py-2,pw+4,ph+4,P.PUR);
  rc(px,py,pw,ph,'#0a0418');
  rc(px+1,py+1,pw-2,ph-2,'#150828');

  // ★ Подтверждение выхода в меню — отдельный экран поверх обычных опций
  if(G._pauseConfirmExit){
    txcs('ВЫЙТИ В МЕНЮ?',py+24,P.RED,P.BLK,2);
    txcs('ВЕСЬ ПРОГРЕСС БУДЕТ ПОТЕРЯН',py+50,P.UIT2,P.BLK,1);
    // Две кнопки: ДА / НЕТ
    const opts=[{label:'ОТМЕНА', col:P.GRN},{label:'ВЫЙТИ', col:P.RED}];
    G._pauseHits=[];
    for(let i=0;i<opts.length;i++){
      const o=opts[i];
      const ow=70, oh=14;
      const ox=px+(pw/2)-ow-6+i*(ow+12), oy=py+78;
      const sel=(G.pauseSel===i);
      const hover=(mX>=ox&&mX<=ox+ow&&mY>=oy&&mY<=oy+oh);
      if(sel||hover){rc(ox,oy,ow,oh,sel?'#2a1054':'#1a0838');}
      const lblW=gw(o.label);
      txt(o.label,ox+(ow-lblW)/2,oy+4,sel?P.WHT:o.col,1);
      G._pauseHits.push({x:ox,y:oy,w:ow,h:oh,idx:i,confirm:true});
    }
    txcs(USE_TOUCH_UI?'ТАП - ВЫБРАТЬ':'СТРЕЛКИ / ENTER / ESC - ОТМЕНА',py+ph-10,P.UIT2,P.BLK,1);
    return;
  }

  // Заголовок
  txcs('ПАУЗА',py+8,P.YEL,P.BLK,2);
  ring(LW/2-30,py+11,3,P.YEL,1);ring(LW/2+30,py+11,3,P.YEL,1);
  // Опции
  const opts=[
    {label:'ПРОДОЛЖИТЬ', val:''},
    {label:'ЗВУК', val:SFX_ON?'ВКЛ':'ВЫКЛ', col:SFX_ON?P.GRN:P.UIT2},
    {label:'МУЗЫКА', val:MUSIC_ON?'ВКЛ':'ВЫКЛ', col:MUSIC_ON?P.GRN:P.UIT2},
    {label:'ТРЕК', val:getCurrentTrackName(), col:P.CYA},
    {label:'ПОЛНЫЙ ЭКРАН', val:''},
    {label:'В ГЛАВНОЕ МЕНЮ', val:''},
  ];
  G._pauseHits=[];
  for(let i=0;i<opts.length;i++){
    const o=opts[i];
    const oy=py+28+i*16;
    const sel=(G.pauseSel===i);
    const ox=px+10, ow=pw-20, oh=12;
    const hover=(mX>=ox&&mX<=ox+ow&&mY>=oy-1&&mY<=oy+oh);
    if(sel||hover){rc(ox,oy-1,ow,oh,sel?'#2a1054':'#1a0838');}
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
    G._pauseHits.push({x:ox,y:oy-1,w:ow,h:oh,idx:i});
  }
  // Подсказка
  txcs(USE_TOUCH_UI?'ТАП - ВЫБРАТЬ':'СТРЕЛКИ / ENTER / ESC',py+ph-10,P.UIT2,P.BLK,1);
  // ★ Phase 5.3: счётчик ачивок в нижнем левом углу
  if(typeof countAchievements==='function'){
    const n=countAchievements(G);
    txs('★ '+n+'/15',px+4,py+ph-19,P.YEL,P.BLK,1);
  }
}

// ★ Завершает выход в главное меню (вызывается после подтверждения)
function _finalizePauseExit(G){
  G.paused=false;
  G._pauseConfirmExit=false;
  sfxUI2();
  startTrans(()=>{
    const fresh=newGame();
    for(const k in G){if(G.hasOwnProperty(k))delete G[k];}
    Object.assign(G,fresh);
    window.G=G;
    resetBtns();
    initTitle(G);
  });
}

function executePauseOption(G,idx){
  switch(idx){
    case 0: G.paused=false; sfxUI2(); break;
    case 1: SFX_ON=!SFX_ON; if(SFX_ON)sfxUI(); break;
    case 2: MUSIC_ON=!MUSIC_ON; if(_mAudio)_mAudio.volume=MUSIC_ON?musicVol:0; sfxUI(); break;
    case 3: cycleMusicTrack(G); break;
    case 4: toggleFullscreen(); sfxUI(); break;
    case 5:
      // ★ Не выходим сразу — открываем подтверждение
      G._pauseConfirmExit=true;
      G.pauseSel=0;  // по умолчанию выбрана ОТМЕНА
      sfxUI();
      break;
  }
}

function handlePauseInput(G){
  // Переключение паузы (но не во время переходов или диалогов)
  const canToggle=!G.transIn && !G.transOut && !G.dlg;
  if(canToggle){
    if(KD.Escape || KD.KeyP || pauseIconClicked()){
      // Если открыто подтверждение — Escape закрывает его, не саму паузу
      if(G.paused && G._pauseConfirmExit){
        G._pauseConfirmExit=false;G.pauseSel=5;sfxUI();mC=false;return;
      }
      G.paused=!G.paused;
      G.pauseSel=0;
      G._pauseConfirmExit=false;
      sfxUI();
      mC=false; // чтобы клик по иконке не проваливался дальше
      return;
    }
  }
  if(G.paused){
    if(G._pauseConfirmExit){
      // Навигация в подтверждении (0=ОТМЕНА, 1=ВЫЙТИ)
      if(KD.ArrowLeft||KD.ArrowRight||KD.ArrowUp||KD.ArrowDown||KD.KeyA||KD.KeyD||KD.KeyW||KD.KeyS){
        G.pauseSel=1-G.pauseSel;sfxUI();
      }
      if(KD.Enter||KD.Space){
        if(G.pauseSel===0){G._pauseConfirmExit=false;G.pauseSel=5;sfxUI();}
        else _finalizePauseExit(G);
      }
      if(mC && G._pauseHits){
        for(const h of G._pauseHits){
          if(mX>=h.x&&mX<=h.x+h.w&&mY>=h.y&&mY<=h.y+h.h){
            G.pauseSel=h.idx;
            if(h.idx===0){G._pauseConfirmExit=false;G.pauseSel=5;sfxUI();}
            else _finalizePauseExit(G);
            mC=false;break;
          }
        }
      }
      return;
    }
    // Навигация
    if(KD.ArrowUp||KD.KeyW){G.pauseSel=(G.pauseSel+5)%6;sfxUI();}
    if(KD.ArrowDown||KD.KeyS){G.pauseSel=(G.pauseSel+1)%6;sfxUI();}
    if(KD.Enter||KD.Space){executePauseOption(G,G.pauseSel);}
    // Клик по опциям
    if(mC && G._pauseHits){
      for(const h of G._pauseHits){
        if(mX>=h.x&&mX<=h.x+h.w&&mY>=h.y&&mY<=h.y+h.h){
          G.pauseSel=h.idx;
          executePauseOption(G,h.idx);
          mC=false;
          break;
        }
      }
    }
  }
}

