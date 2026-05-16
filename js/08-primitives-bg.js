// ============================================================
// 08-primitives-bg.js
// Drawing primitives (disc/ring/bar/bx2/rc/line), stars/nebula background
// depends on: 01-core.js
// (originally sintara_v25.html lines 283-447)
// ============================================================

const STARS=[],NEBULA=[];
// ★ Phase 4.3: палитры туманностей по биомам/целевым планетам.
//   drosh — холодная зона, синие/льдистые; bubblika — газовая, фиолетово-розовая;
//   krasnozem — раскалённая, красно-оранжевая; center — мёртвая, тёмно-пурпурная;
//   default — старая смешанная палитра (для меню/титульника/интро).
const NEBULA_PALETTES={
  drosh:    ['#1a2a4a','#2a3a5a','#3a4a6a','#5a7aaa'],
  bubblika: ['#3a0a2a','#5a1a3a','#4a1a4a','#7a3388'],
  krasnozem:['#3a1a0a','#5a2a0a','#aa3322','#882211'],
  center:   ['#0a0a1a','#1a0a2a','#2a0a1a','#3a0a0a'],
  default:  ['#1a0a3a','#0a1a3a','#3a0a2a','#0a2a3a'],
};
function initStars(biome){
  STARS.length=0;
  const sp=[.05,.18,.45,.9],cl=[P.S4,P.S3,P.S2,P.S1];
  for(let i=0;i<200;i++){
    const l=i<70?0:i<130?1:i<180?2:3;
    STARS.push({x:Math.random()*LW,y:Math.random()*LH,l,col:cl[l],sp:sp[l],tw:Math.random()*Math.PI*2,twSp:.02+Math.random()*.06});
  }
  NEBULA.length=0;
  const palette=NEBULA_PALETTES[biome]||NEBULA_PALETTES.default;
  for(let i=0;i<14;i++){
    NEBULA.push({
      x:Math.random()*LW,y:Math.random()*LH,
      r:12+Math.random()*22,
      col:palette[(Math.random()*palette.length)|0],
      sp:.04+Math.random()*.08,
      a:.08+Math.random()*.14,
    });
  }
}
// Параллакс: слой 0 (дальний) — 0.08×, слой 1 — 0.28×, слой 2 — 0.62×, слой 3 (ближний) — 1.0×
const _STAR_PAR=[0.08,0.28,0.62,1.0];
function scrollStars(m=1){for(const s of STARS){s.x-=s.sp*m*_STAR_PAR[s.l];if(s.x<0){s.x=LW;s.y=Math.random()*LH;}s.tw+=s.twSp;}for(const n of NEBULA){n.x-=n.sp*m;if(n.x<-40){n.x=LW+40;n.y=Math.random()*LH;}}}
function drwNebula(){for(const n of NEBULA){for(let r=n.r|0;r>2;r-=2){const al=n.a*(1-(n.r-r)/n.r)*.55;cx.globalAlpha=al;cx.fillStyle=n.col;const ry=Math.max(1,(r*.7)|0);for(let dy=-ry;dy<=ry;dy++){const w=Math.sqrt(1-(dy/ry)*(dy/ry))*r|0;cx.fillRect((n.x-w)|0,(n.y+dy)|0,w*2,1);}}}cx.globalAlpha=1;}
function drwStars(){
  // ★ Мерцание на всех слоях: дальние (l=0..1) мерцают мягко, ближние (l=2..3) — сильнее.
  // _twAmp задаёт глубину пульсации; lower layers едва пульсируют, upper — заметно.
  const _twAmp=[0.15, 0.22, 0.35, 0.45];
  for(const s of STARS){
    const a=1-_twAmp[s.l]+_twAmp[s.l]*Math.sin(s.tw)*0.5+0.5*_twAmp[s.l];
    cx.globalAlpha=Math.min(1,Math.max(0.35,a));
    cx.fillStyle=s.col;
    cx.fillRect(s.x|0,s.y|0,1,1);
    if(s.l===3&&Math.sin(s.tw)>.7){
      cx.fillRect((s.x-1)|0,s.y|0,1,1);cx.fillRect((s.x+1)|0,s.y|0,1,1);
      cx.fillRect(s.x|0,(s.y-1)|0,1,1);cx.fillRect(s.x|0,(s.y+1)|0,1,1);
    }
    cx.globalAlpha=1;
  }
}

function disc(dcx,dcy,r,col){cx.fillStyle=col;for(let dy=-r;dy<=r;dy++){const w=Math.sqrt(r*r-dy*dy)|0;cx.fillRect((dcx-w)|0,(dcy+dy)|0,w*2,1);}}
function ring(dcx,dcy,r,col,th=1){cx.strokeStyle=col;cx.lineWidth=th;cx.beginPath();cx.arc(dcx,dcy,r,0,Math.PI*2);cx.stroke();}
function bar(x,y,w,h,v,col,bg,border){cx.fillStyle=bg;cx.fillRect(x,y,w,h);const fw=Math.max(0,Math.min(w,(w*v)|0));cx.fillStyle=col;cx.fillRect(x,y,fw,h);if(fw>1){cx.fillStyle='rgba(255,255,255,0.25)';cx.fillRect(x,y,fw,1);}if(border){cx.strokeStyle=border;cx.lineWidth=.5;cx.strokeRect(x+.5,y+.5,w-1,h-1);}}
function bx2(x,y,w,h,fl,st,lw=.5){cx.fillStyle=fl;cx.fillRect(x,y,w,h);cx.strokeStyle=st;cx.lineWidth=lw;cx.strokeRect(x+.5,y+.5,w-1,h-1);}

// Разбить строку на 1-2 строчки по ширине пикселей. Делит по пробелам.
// Возвращает массив строк (1 или 2).
function wrapTextNotif(s,maxW){
  if(gw(s)<=maxW)return [s];
  const words=s.split(' ');
  // Ищем точку разреза, при которой вторая строка тоже помещается.
  // Идём от конца к началу — стараемся максимально загрузить первую строку.
  let bestSplit=-1;
  for(let i=words.length-1;i>=1;i--){
    const line1=words.slice(0,i).join(' ');
    const line2=words.slice(i).join(' ');
    if(gw(line1)<=maxW&&gw(line2)<=maxW){
      bestSplit=i;break;
    }
  }
  if(bestSplit>0){
    return [words.slice(0,bestSplit).join(' '),words.slice(bestSplit).join(' ')];
  }
  // Если даже две строки не помещаются — берём максимально возможную первую,
  // и обрезаем конец многоточием если очень длинно.
  let line1='';
  for(let i=0;i<words.length;i++){
    const trial=line1?line1+' '+words[i]:words[i];
    if(gw(trial)<=maxW)line1=trial;else break;
  }
  const line2=words.slice(line1.split(' ').length).join(' ');
  return [line1,line2.length>40?line2.slice(0,38)+'..':line2];
}

// ★ v22 — Ретро-RPG попап «ЗАДАНИЕ ВЫПОЛНЕНО» с анимированными наградами
// rewards: [{label:'...', col:'...'}, ...]
function showQuestReward(G,title,rewards,col){
  G.qrw={active:true,t:0,title:title,rewards:rewards,col:col||P.YEL,
    duration:Math.max(260,200+rewards.length*45),_rev:new Array(rewards.length).fill(false)};
}
function drwQuestReward(G){
  const q=G.qrw;if(!q||!q.active)return;
  const t=q.t,N=q.rewards.length;
  // ★ Bugfix #12: BW 170 → 260 — длинные строки наград (название оружия + комментарий) не помещались
  const BW=260,RPAD=14,BH=RPAD+11+N*11+RPAD;
  const BX=(LW-BW)/2|0;
  // Slide-in ease-out cubic
  const slideP=Math.min(1,Math.max(0,(t-1)/15));
  const ease=1-Math.pow(1-slideP,3);
  const targetY=(LH-BH)/2|0;
  const BY=(targetY*ease+(-BH-8)*(1-ease))|0;
  // Dim overlay
  cx.globalAlpha=Math.min(0.82,ease*0.82);
  rc(0,0,LW,LH,'#000814');
  cx.globalAlpha=1;
  if(slideP<0.04)return;
  // — Внешнее свечение (3px, цвет квеста) —
  cx.globalAlpha=0.35*ease;
  rc(BX-3,BY-3,BW+6,BH+6,q.col);
  cx.globalAlpha=1;
  // — Основной бокс —
  rc(BX-1,BY-1,BW+2,BH+2,'#001828');
  rc(BX,BY,BW,BH,'#010d1e');
  // Скан-линии
  cx.globalAlpha=0.07;cx.fillStyle='#aaddff';
  for(let y=0;y<BH;y+=2)cx.fillRect(BX,BY+y,BW,1);
  cx.globalAlpha=1;
  // — Заголовочная полоса —
  rc(BX,BY,BW,12,'#030f22');
  cx.fillStyle=q.col;cx.fillRect(BX,BY,BW,1);       // верхний бордер
  cx.fillStyle=q.col;cx.fillRect(BX,BY+11,BW,1);    // нижний бордер заголовка
  // Левый и правый бордер всего бокса
  cx.fillStyle=q.col;cx.fillRect(BX,BY,1,BH);
  cx.fillStyle=q.col;cx.fillRect(BX+BW-1,BY,1,BH);
  cx.fillStyle=q.col;cx.fillRect(BX,BY+BH-1,BW,1);
  // Уголки яркие (2×2)
  cx.fillStyle='#ffffff';
  cx.fillRect(BX,BY,2,2);cx.fillRect(BX+BW-2,BY,2,2);
  cx.fillRect(BX,BY+BH-2,2,2);cx.fillRect(BX+BW-2,BY+BH-2,2,2);
  // Заголовок с пульсом
  const hblink=slideP>=1?1:Math.min(1,(t-12)/8);
  cx.globalAlpha=hblink;
  txcs('★ '+q.title+' ★',BY+2,q.col,'#001828',1);
  cx.globalAlpha=1;
  // — Строки наград —
  for(let i=0;i<N;i++){
    const r=q.rewards[i];
    const revT=20+i*16;
    if(t<revT)continue;
    if(t===revT&&!q._rev[i]){
      q._rev[i]=true;
      // Нарастающий arpeggio: каждая награда выше
      bip(700+i*140,0.22,0.18,'sine',1000+i*100,650+i*60);
      spPts(BX+BW/2,BY+13+i*11,4,[r.col,P.WHT],.3,1.5,10,.01);
    }
    const age=Math.min(14,t-revT);
    const fa=Math.min(1,age/8);
    const ox=(8-age)*2;  // выезжает слева
    const ry=BY+13+RPAD/2+i*11;
    cx.globalAlpha=fa;
    // Маленький ромб-иконка
    cx.fillStyle=r.col;
    cx.fillRect((BX+10+ox)|0,ry+2,1,5);
    cx.fillRect((BX+11+ox)|0,ry+1,1,7);
    cx.fillRect((BX+12+ox)|0,ry,1,9);  // пик
    cx.fillRect((BX+13+ox)|0,ry+1,1,7);
    cx.fillRect((BX+14+ox)|0,ry+2,1,5);
    // Метка награды
    txs(r.label,(BX+20+ox)|0,ry+1,r.col,'#000d1c',1);
    // Тонкая разделительная линия под строкой
    if(i<N-1){cx.fillStyle='#0a1e30';cx.fillRect(BX+8,ry+10,BW-16,1);}
    cx.globalAlpha=1;
  }
  // — Футер «ПРОДОЛЖИТЬ» —
  const allDone=t>20+N*16+14;
  if(allDone){
    const fb=Math.floor(t/16)%2;
    cx.globalAlpha=fb?1:0.35;
    const FY=BY+BH-RPAD+2;
    rc(BX+1,FY-2,BW-2,1,'#0a1e30');
    txcs('[ ПРОБЕЛ — ПРОДОЛЖИТЬ ]',FY,P.UIT2,'#000814',1);
    cx.globalAlpha=1;
  }
  // — Угловые искры (пока бокс виден) —
  if(t>18&&t%4===0){
    const corners=[[BX+2,BY+2],[BX+BW-2,BY+2],[BX+2,BY+BH-2],[BX+BW-2,BY+BH-2]];
    for(const[cx2,cy2]of corners)
      PTS.push({x:cx2+(Math.random()-.5)*3,y:cy2+(Math.random()-.5)*3,
        vx:(Math.random()-.5)*1.2,vy:-Math.random()*1.4,
        lf:8+Math.random()*6|0,ml:14,col:q.col,sz:1,gv:0,fade:.65});
  }
}

// Универсальная панель уведомления: до 2 строк по центру, с сноской если нужно.
// y=ny — координата верхнего края бокса.
function drwNotif(G,ny){
  if(!(G.notifT>0&&G.notif))return;
  const a=Math.min(1,G.notifT/20);
  cx.globalAlpha=a;
  // Целевая ширина бокса — 80% экрана (не во всю ширину)
  const maxW=Math.floor(LW*0.8);
  const lines=wrapTextNotif(G.notif,maxW-8);
  // Высота бокса: 8px на строку + 6px паддинг
  const boxH=lines.length*8+6;
  // Реальная ширина по самой длинной строке
  let realW=0;for(const l of lines)realW=Math.max(realW,gw(l));
  realW=Math.min(maxW,realW+8);
  const nx=(LW-realW)/2|0;
  if(ny==null)ny=LH/2-boxH/2|0;
  bx2(nx-1,ny-1,realW+2,boxH+2,P.SCAN,G.notifCol,1);
  for(let i=0;i<lines.length;i++){
    txc(lines[i],ny+3+i*8,G.notifCol,1);
  }
  cx.globalAlpha=1;
}
function rc(x,y,w,h,col){cx.fillStyle=col;cx.fillRect(x,y,w,h);}
function line(x1,y1,x2,y2,col,lw=1){cx.strokeStyle=col;cx.lineWidth=lw;cx.beginPath();cx.moveTo(x1|0,y1|0);cx.lineTo(x2|0,y2|0);cx.stroke();}

