// ============================================================
// 09-entities.js
// Entity renderers: ship, shield, asteroids, pirates, bullets, resources, power-ups, TINA boss, pirate boss
// depends on: 01-core.js, 04-font.js, 07-effects.js, 08-primitives-bg.js
// (originally sintara_v25.html lines 448-1640)
// ============================================================

function drwShipSmoke(px,py,hpRatio){if(hpRatio<.6&&Math.random()<(1-hpRatio)*.7){PTS.push({x:px-10+Math.random()*6,y:py+(Math.random()-.5)*6,vx:-.4-Math.random()*.3,vy:(Math.random()-.5)*.2,lf:20+Math.random()*20|0,ml:30,col:hpRatio<.3?(Math.random()<.5?'#444':'#882211'):'#555',sz:1+Math.random()*1.5,gv:0,fade:.5});}}
function drwShip(px,py,inv,thr,boost,hpRatio){if(inv>0&&Math.floor(inv/4)%2)return;px|=0;py|=0;const fl=thr%6<3;const bst=boost?1:0;const fLen=bst?6:3;rc(px-13-fLen,py-1,4+fLen,fl?4:3,P.TH1);rc(px-11-fLen,py-1,2+fLen,fl?4:3,P.TH2);if(fl)rc(px-16-fLen,py,2,2,P.TH2);if(bst&&fl)rc(px-18-fLen,py-1,3,3,'#ffffcc');if(thr%2===0){cx.fillStyle=P.ORA;cx.fillRect((px-17-Math.random()*3)|0,(py+Math.random()*4-1)|0,1,1);}rc(px-7,py+4,10,3,P.SH2);rc(px-4,py+7,6,2,P.SH2);rc(px-7,py-7,10,3,P.SH2);rc(px-4,py-9,6,2,P.SH2);rc(px-9,py-4,3,3,P.SH2);rc(px-9,py+1,3,3,P.SH2);rc(px-3,py+9,4,1,P.SH1);rc(px-3,py-10,4,1,P.SH1);rc(px-8,py-4,14,9,P.SH1);rc(px-6,py-6,10,3,P.SH1);rc(px+6,py+4,10,3,P.SH1);rc(px-8,py+4,14,1,P.SH4);rc(px-8,py-5,14,1,P.SH3);rc(px+6,py-2,4,5,P.SH3);rc(px+9,py-1,3,3,P.SH3);rc(px+11,py,1,1,P.SH3);rc(px+9,py-1,1,3,'#ddeeff');rc(px-1,py-2,5,5,P.COC);rc(px-1,py-2,1,1,P.SH1);rc(px+3,py+2,1,1,P.SH1);rc(px,py-2,1,1,'#ffffff');rc(px-3,py-1,2,3,P.SH2);rc(px-9,py-2,2,5,P.SH2);rc(px-5,py+5,3,1,P.SH3);rc(px-5,py-6,3,1,P.SH3);if(hpRatio!==undefined&&hpRatio<.4){cx.fillStyle='#221100';cx.fillRect(px-3,py-1,1,1);cx.fillRect(px+1,py+2,1,1);if(hpRatio<.2){cx.fillRect(px-5,py+1,2,1);cx.fillRect(px+2,py-3,1,1);}}}
function drwShield(px,py,t){cx.save();const r=16+Math.sin(t*.15)*1;const pulse=.4+.3*Math.sin(t*.2);for(let a=0;a<Math.PI*2;a+=.3){const xx=px+Math.cos(a)*r,yy=py+Math.sin(a)*r;cx.globalAlpha=pulse*(.2+.6*Math.random());cx.fillStyle=P.CYA;cx.fillRect(xx|0,yy|0,1,1);}cx.globalAlpha=pulse*.6;cx.strokeStyle=P.CYA;cx.lineWidth=1;cx.beginPath();cx.arc(px,py,r,-.6+t*.02,.1+t*.02);cx.stroke();cx.beginPath();cx.arc(px,py,r,Math.PI-.3+t*.03,Math.PI+.5+t*.03);cx.stroke();cx.restore();cx.globalAlpha=1;}

// ★ v16 r6: Offscreen-canvas для пиксель-чёткого рендера корабля при любом zoom.
// Рисуем корабль/щит в отдельный canvas в нативном размере, затем drawImage на основной
// с целевым размером nativeSize × zoom × playerScale при imageSmoothingEnabled=false.
// Браузер сделает nearest-neighbor scaling — пиксели остаются чёткими на любом масштабе.
const _shipOff=document.createElement('canvas');
_shipOff.width=64;_shipOff.height=40;
const _shipOffCx=_shipOff.getContext('2d');
_shipOffCx.imageSmoothingEnabled=false;
const _SHIP_OFF_CX=32,_SHIP_OFF_CY=20;
function _rcTo(tCx,x,y,w,h,c){tCx.fillStyle=c;tCx.fillRect(x|0,y|0,w|0,h|0);}
// drwShip но рисует в произвольный context (для offscreen рендера)
function drwShipTo(tCx,px,py,inv,thr,boost,hpRatio){if(inv>0&&Math.floor(inv/4)%2)return;px|=0;py|=0;const fl=thr%6<3;const bst=boost?1:0;const fLen=bst?6:3;_rcTo(tCx,px-13-fLen,py-1,4+fLen,fl?4:3,P.TH1);_rcTo(tCx,px-11-fLen,py-1,2+fLen,fl?4:3,P.TH2);if(fl)_rcTo(tCx,px-16-fLen,py,2,2,P.TH2);if(bst&&fl)_rcTo(tCx,px-18-fLen,py-1,3,3,'#ffffcc');if(thr%2===0){tCx.fillStyle=P.ORA;tCx.fillRect((px-17-Math.random()*3)|0,(py+Math.random()*4-1)|0,1,1);}_rcTo(tCx,px-7,py+4,10,3,P.SH2);_rcTo(tCx,px-4,py+7,6,2,P.SH2);_rcTo(tCx,px-7,py-7,10,3,P.SH2);_rcTo(tCx,px-4,py-9,6,2,P.SH2);_rcTo(tCx,px-9,py-4,3,3,P.SH2);_rcTo(tCx,px-9,py+1,3,3,P.SH2);_rcTo(tCx,px-3,py+9,4,1,P.SH1);_rcTo(tCx,px-3,py-10,4,1,P.SH1);_rcTo(tCx,px-8,py-4,14,9,P.SH1);_rcTo(tCx,px-6,py-6,10,3,P.SH1);_rcTo(tCx,px+6,py+4,10,3,P.SH1);_rcTo(tCx,px-8,py+4,14,1,P.SH4);_rcTo(tCx,px-8,py-5,14,1,P.SH3);_rcTo(tCx,px+6,py-2,4,5,P.SH3);_rcTo(tCx,px+9,py-1,3,3,P.SH3);_rcTo(tCx,px+11,py,1,1,P.SH3);_rcTo(tCx,px+9,py-1,1,3,'#ddeeff');_rcTo(tCx,px-1,py-2,5,5,P.COC);_rcTo(tCx,px-1,py-2,1,1,P.SH1);_rcTo(tCx,px+3,py+2,1,1,P.SH1);_rcTo(tCx,px,py-2,1,1,'#ffffff');_rcTo(tCx,px-3,py-1,2,3,P.SH2);_rcTo(tCx,px-9,py-2,2,5,P.SH2);_rcTo(tCx,px-5,py+5,3,1,P.SH3);_rcTo(tCx,px-5,py-6,3,1,P.SH3);if(hpRatio!==undefined&&hpRatio<.4){tCx.fillStyle='#221100';tCx.fillRect(px-3,py-1,1,1);tCx.fillRect(px+1,py+2,1,1);if(hpRatio<.2){tCx.fillRect(px-5,py+1,2,1);tCx.fillRect(px+2,py-3,1,1);}}}
function drwShieldTo(tCx,px,py,t){tCx.save();const r=16+Math.sin(t*.15)*1;const pulse=.4+.3*Math.sin(t*.2);for(let a=0;a<Math.PI*2;a+=.3){const xx=px+Math.cos(a)*r,yy=py+Math.sin(a)*r;tCx.globalAlpha=pulse*(.2+.6*Math.random());tCx.fillStyle=P.CYA;tCx.fillRect(xx|0,yy|0,1,1);}tCx.globalAlpha=pulse*.6;tCx.strokeStyle=P.CYA;tCx.lineWidth=1;tCx.beginPath();tCx.arc(px,py,r,-.6+t*.02,.1+t*.02);tCx.stroke();tCx.beginPath();tCx.arc(px,py,r,Math.PI-.3+t*.03,Math.PI+.5+t*.03);tCx.stroke();tCx.restore();tCx.globalAlpha=1;}

// ★ v16 r6/r7: Рисует корабль игрока в финале с правильным масштабированием по zoom.
// r7: Рисуем в offscreen-буфер боя (cx уже указывает на него во время applyFinaleCamera)
// в нативном размере + индивидуальный playerScale. Общий zoom применится при drawImage offscreen→основной.
function drwShipSharp(F,G,scale){
  const sc=scale||1;
  // Рендерим корабль в свой sprite-offscreen (_shipOff) в нативном размере
  _shipOffCx.clearRect(0,0,_shipOff.width,_shipOff.height);
  drwShipTo(_shipOffCx,_SHIP_OFF_CX,_SHIP_OFF_CY,G.pl.inv,G.pl.thrT,G.pl.boost>0,G.pl.hp/G.pl.mhp);
  if(G.pl.shield>0)drwShieldTo(_shipOffCx,_SHIP_OFF_CX,_SHIP_OFF_CY,G.sT);
  // cx сейчас указывает на _FIN_OFF_CX (буфер боя) с trans translate.
  // Координаты — мировые. Drawing на этот буфер с playerScale применит индивидуальный масштаб.
  cx.imageSmoothingEnabled=false;
  const dstW=_shipOff.width*sc;
  const dstH=_shipOff.height*sc;
  cx.drawImage(_shipOff,
    Math.round(G.pl.x-dstW/2),Math.round(G.pl.y-dstH/2),
    Math.max(1,Math.round(dstW)),Math.max(1,Math.round(dstH))
  );
}
function drwAst(a){const x=a.x|0,y=a.y|0,s=a.s;const rot=(a.rot||0)%6;rc(x-s+1,y-s,s*2-2,s*2,P.A1);rc(x-s,y-s+1,s*2,s*2-2,P.A1);rc(x-s+1,y-s+1,s-1,s-1,P.A2);rc(x+1,y+1,s-2,s-2,P.A2);rc(x-s+2,y-s+2,Math.max(1,s>>1),1,P.A3);rc(x-s+1,y-s+3,1,Math.max(1,s>>1),P.A3);rc(x+s-2,y+s-2,1,1,P.A4);rc(x-s,y+s-1,1,1,P.A4);cx.fillStyle=P.A2;for(const cr of a.cracks)cx.fillRect(x+((cr[0]+rot)%(s*2)-s|0),y+((cr[1]+rot)%(s*2)-s|0),1,1);if(a.hp<a.maxHp){const bw=s*2,ratio=a.hp/a.maxHp;rc(x-s,y-s-3,bw,1,'#220000');rc(x-s,y-s-3,(bw*ratio)|0,1,ratio>.5?P.GRN:ratio>.25?P.YEL:P.RED);}if(a.flash>0){cx.globalAlpha=a.flash;cx.fillStyle='#fff';cx.fillRect(x-s,y-s,s*2,s*2);cx.globalAlpha=1;a.flash*=.7;}}
function drwPirate(e){const x=e.x|0,y=e.y|0,t=e.t;rc(x-5,y-3,10,6,P.PIR);rc(x-6,y-1,12,2,P.PIR);rc(x-4,y-4,8,1,P.PIR2);rc(x-4,y+3,8,1,P.PIR2);const blink=Math.floor(t/20)%5===0;if(!blink){rc(x-1,y-1,3,2,P.PIR3);rc(x,y-1,1,1,'#ffddaa');}rc(x+5,y-3,2,1,'#222');rc(x+5,y+2,2,1,'#222');rc(x-8,y-2,3,1,P.PIR2);rc(x-8,y+1,3,1,P.PIR2);if(t%6<3)rc(x+7,y-1,2,2,P.L3);if(e.flash>0){cx.globalAlpha=e.flash;cx.fillStyle='#fff';cx.fillRect(x-8,y-4,16,9);cx.globalAlpha=1;e.flash*=.7;}if(e.hp<e.maxHp){rc(x-6,y-6,12,1,'#220000');rc(x-6,y-6,(12*(e.hp/e.maxHp))|0,1,P.RED);}}

// ★ Танк — широкий, угловатый, медленный. Тёмно-красный корпус с пульсирующим ядром.
function drwTank(e){
  const x=e.x|0,y=e.y|0,t=e.t;
  rc(x-10,y-3,20,6,P.PIR2);
  rc(x-9,y-5,18,10,P.PIR2);
  rc(x-8,y-6,16,1,'#331108');
  rc(x-8,y+5,16,1,'#331108');
  rc(x-7,y-4,14,8,P.PIR);
  rc(x-5,y-4,1,1,'#552010');rc(x+4,y-4,1,1,'#552010');
  rc(x-5,y+3,1,1,'#552010');rc(x+4,y+3,1,1,'#552010');
  const pulse=.6+.4*Math.sin(t*.15);
  cx.globalAlpha=pulse;disc(x,y,3,P.YEL);cx.globalAlpha=1;
  rc(x-1,y-1,3,3,P.RED);
  rc(x,y,1,1,P.WHT);
  rc(x-13,y-1,5,3,'#222');
  rc(x-15,y,2,1,P.PIR3);
  if(t%6<3)rc(x+9,y-1,3,3,P.L3);
  if(e.flash>0){cx.globalAlpha=e.flash;cx.fillStyle='#fff';cx.fillRect(x-11,y-7,22,15);cx.globalAlpha=1;e.flash*=.7;}
  if(e.hp<e.maxHp){rc(x-9,y-9,18,1,'#220000');rc(x-9,y-9,(18*(e.hp/e.maxHp))|0,1,P.RED);}
}

// ★ Дрон-камикадзе — маленький синий треугольник со светящимся хвостом.
function drwDrone(e){
  const x=e.x|0,y=e.y|0;
  cx.globalAlpha=.5;rc(x+2,y-1,5,3,P.L1L);cx.globalAlpha=1;
  rc(x,y-2,4,1,P.L1);
  rc(x-1,y-1,5,1,P.L1);
  rc(x-2,y,6,1,P.L1L);
  rc(x-1,y+1,5,1,P.L1);
  rc(x,y+2,4,1,P.L1);
  rc(x,y,1,1,P.WHT);
  if(e.flash>0){cx.globalAlpha=e.flash;cx.fillStyle='#fff';cx.fillRect(x-3,y-3,8,7);cx.globalAlpha=1;e.flash*=.7;}
}

// ★ Снайпер — тонкий корпус с оптикой. Во время зарядки виден красный луч-телеграф.
function drwSniper(e){
  const x=e.x|0,y=e.y|0,ch=e.chargeT||0;
  rc(x-8,y-2,16,4,'#331a44');
  rc(x-8,y-1,16,2,'#553366');
  rc(x-6,y-3,12,1,'#221033');
  rc(x-6,y+2,12,1,'#221033');
  const scopeCol=(ch>=0&&ch<60)?P.RED:P.PUR2;
  rc(x-3,y-1,3,3,scopeCol);
  rc(x-2,y,1,1,P.YEL);
  rc(x-12,y,4,1,'#222');
  if(ch>=0&&ch<60){
    const intensity=ch/60;
    const ty=(e.targetY!=null)?(e.targetY|0):y;
    // ★ Bugfix #8: теперь телеграф — ДИАГОНАЛЬНАЯ линия от снайпера к точке прицела (0, ty),
    //   а не горизонталь на ty. Пуля летит по этой же линии (см. spawn в 12-scene-space.js).
    cx.globalAlpha=.25+intensity*.45;
    cx.strokeStyle=P.RED;cx.lineWidth=1;
    cx.beginPath();
    cx.moveTo(x-12,y);
    cx.lineTo(0,ty);
    cx.stroke();
    // Мигающая точка прицела на цели (у левого края, где пуля выйдет за экран)
    if(Math.floor(ch/4)%2===0){
      cx.globalAlpha=.7+intensity*.3;
      rc(2,ty-1,3,3,P.RED);
      rc(3,ty,1,1,P.YEL);
    }
    cx.globalAlpha=1;
  }
  if(e.flash>0){cx.globalAlpha=e.flash;cx.fillStyle='#fff';cx.fillRect(x-10,y-4,20,8);cx.globalAlpha=1;e.flash*=.7;}
  if(e.hp<e.maxHp){rc(x-8,y-6,16,1,'#220000');rc(x-8,y-6,(16*(e.hp/e.maxHp))|0,1,P.RED);}
}

// ★ Мини-босс — большой пиратский крейсер. В фазе тарана светится красным.
function drwMiniboss(e){
  const x=e.x|0,y=e.y|0,t=e.t,ramming=e.phase==='ram';
  if(ramming){
    const r=1+.3*Math.sin(t*.4);
    cx.globalAlpha=.3*r;disc(x,y,18,P.RED);cx.globalAlpha=1;
  }
  rc(x-14,y-3,28,6,P.PIR2);
  rc(x-12,y-7,24,14,P.PIR2);
  rc(x-10,y-9,20,2,P.PIR);
  rc(x-10,y+7,20,2,P.PIR);
  rc(x-9,y-5,18,10,P.PIR);
  cx.fillStyle='#1a0604';
  cx.fillRect(x-7,y-4,1,3);cx.fillRect(x-6,y-3,1,1);
  cx.fillRect(x+4,y+2,1,3);cx.fillRect(x+5,y+3,1,1);
  rc(x-2,y-2,5,4,ramming?P.RED:P.PIR3);
  if(Math.floor(t/8)%4!==0)rc(x-1,y-1,3,2,'#ffddaa');
  rc(x-1,y-11,1,3,'#222');
  rc(x,y-11,t%30<15?3:2,2,P.RED);
  rc(x-16,y-4,4,2,'#331108');
  rc(x-16,y+2,4,2,'#331108');
  if(t%4<2)rc(x+12,y-2,3,4,P.L3);
  if(t%6<3)rc(x+15,y-1,2,2,P.YEL);
  if(e.flash>0){cx.globalAlpha=e.flash;cx.fillStyle='#fff';cx.fillRect(x-16,y-10,32,20);cx.globalAlpha=1;e.flash*=.7;}
  if(e.hp<e.maxHp){
    rc(x-14,y-13,28,2,'#220000');
    rc(x-14,y-13,(28*(e.hp/e.maxHp))|0,2,ramming?P.RED:P.HP);
  }
}

// ★ Диспетчер рендера — по e.type. Без type → пират (обратная совместимость).
function drwEnemy(e){
  switch(e.type){
    case 'tank':     drwTank(e);     break;
    case 'drone':    drwDrone(e);    break;
    case 'sniper':   drwSniper(e);   break;
    case 'miniboss': drwMiniboss(e); break;
    default:         drwPirate(e);   break;
  }
}

// ======== TINA BOSS DRAW ========
// ★ v16 r3: Энергоблоки крупнее (масштаб с Тиной), проработанный пиксель-арт
function drwEnergyBlock(eb,t){
  const x=eb.x|0,y=eb.y|0;
  // Защитное свечение — больше и интенсивнее
  cx.globalAlpha=0.25+0.15*Math.sin(t*0.1+eb.orbitA);
  disc(x,y,22,P.CYA);
  cx.globalAlpha=0.4+0.2*Math.sin(t*0.15+eb.orbitA);
  disc(x,y,16,'#88ccff');
  cx.globalAlpha=1;
  // Корпус блока — крупнее
  rc(x-14,y-14,28,28,'#001833');
  rc(x-12,y-12,24,24,'#003366');
  rc(x-11,y-11,22,22,'#004488');
  // Внутреннее ядро
  const pulse=0.7+0.3*Math.sin(t*0.15+eb.orbitA*2);
  cx.globalAlpha=pulse;
  rc(x-6,y-6,12,12,P.CYA);
  rc(x-4,y-4,8,8,'#aaeeff');
  rc(x-2,y-2,4,4,P.WHT);
  cx.globalAlpha=1;
  // Технические штрихи на корпусе
  rc(x-13,y-2,3,4,'#88ddff');rc(x+10,y-2,3,4,'#88ddff');
  rc(x-2,y-13,4,3,'#88ddff');rc(x-2,y+10,4,3,'#88ddff');
  // Углы
  rc(x-14,y-14,4,4,P.CYA);rc(x+10,y-14,4,4,P.CYA);
  rc(x-14,y+10,4,4,P.CYA);rc(x+10,y+10,4,4,P.CYA);
  // Линии связи к Тине
  if(t%4<2){
    cx.globalAlpha=0.5;
    cx.strokeStyle=P.CYA;cx.lineWidth=1.5;
    cx.beginPath();cx.moveTo(x,y);cx.lineTo(eb.cx,eb.cy);cx.stroke();
    cx.lineWidth=1;
    cx.globalAlpha=1;
  }
  // HP бар
  if(eb.hp<eb.mhp){
    rc(x-14,y-22,28,3,'#220000');
    rc(x-14,y-22,(28*(eb.hp/eb.mhp))|0,3,P.CYA);
  }
}
// ★ v16 r3: Турели крупнее
function drwTurret(tr,t){
  const x=tr.x|0,y=tr.y|0;
  // Основание — крупнее
  disc(x,y,12,'#330800');
  disc(x,y,10,P.TINA2);
  disc(x,y,7,'#882211');
  // Ствол направлен на игрока
  const ang=tr.aim||0;
  const bx=x+Math.cos(ang)*16,by=y+Math.sin(ang)*16;
  cx.strokeStyle=P.TINA;cx.lineWidth=4;
  cx.beginPath();cx.moveTo(x,y);cx.lineTo(bx|0,by|0);cx.stroke();
  cx.strokeStyle='#ff8844';cx.lineWidth=2;
  cx.beginPath();cx.moveTo(x,y);cx.lineTo(bx|0,by|0);cx.stroke();
  cx.lineWidth=1;
  // Огонёк
  if(tr.flash>0){
    cx.globalAlpha=tr.flash/8;
    disc(bx|0,by|0,5,P.YEL);
    disc(bx|0,by|0,3,P.WHT);
    cx.globalAlpha=1;
  }
  // Ядро
  rc(x-4,y-4,8,8,P.TINA3);
  rc(x-3,y-3,6,6,P.RED);
  rc(x-1,y-1,2,2,P.WHT);
  // HP бар
  if(tr.hp<tr.mhp){
    rc(x-12,y-18,24,3,'#220000');
    rc(x-12,y-18,(24*(tr.hp/tr.mhp))|0,3,P.YEL);
  }
}
// ★ v16 r4 #1: Слабая точка = брешь в щите. Рисуется отдельной функцией drwShieldWithBreaches
function drwWeakSpot(ws,t){
  // Эта функция теперь не рисует сам "spot" — отрисовка идёт через drwShieldWithBreaches.
  // Здесь только обновим экранные коорды для эффектов попадания / частиц.
}
// ★ v16 r4 #1: Рисует "ломаный" защитный щит с 3 брешами
function drwShieldWithBreaches(b,t){
  if(!b.weakSpots||b.weakSpots.length===0)return;
  const x=b.x|0,y=b.y|0;
  const sR=TINA_R+18;
  const N=72; // сегментов в круге
  // Внешнее свечение щита (затухающее, чтобы было видно повреждение)
  cx.globalAlpha=0.20+0.10*Math.sin(t*0.08);
  ring(x,y,sR+6,P.YEL,1);
  cx.globalAlpha=1;
  // Рисуем кольцо как набор дуг, пропуская углы под брешами
  for(let i=0;i<N;i++){
    const a=(i/N)*Math.PI*2;
    // Проверяем, попадает ли угол a в любую брешь
    let inBreach=false;
    for(const ws of b.weakSpots){
      let diff=a-ws.orbitA;
      while(diff>Math.PI)diff-=Math.PI*2;
      while(diff<-Math.PI)diff+=Math.PI*2;
      if(Math.abs(diff)<ws.arcWidth){inBreach=true;break;}
    }
    if(inBreach)continue;
    // Сегмент щита (дуга)
    const a2=((i+1)/N)*Math.PI*2;
    cx.strokeStyle='#cc0033';cx.lineWidth=4;
    cx.globalAlpha=0.65+0.15*Math.sin(t*0.05+i*0.4);
    cx.beginPath();cx.arc(x,y,sR,a,a2);cx.stroke();
    // Внутренний слой (тонкий)
    cx.strokeStyle='#ff4422';cx.lineWidth=2;
    cx.globalAlpha=0.85;
    cx.beginPath();cx.arc(x,y,sR,a,a2);cx.stroke();
    // Жёлтые "искры" между сегментами (символ электрического щита)
    if((i+Math.floor(t*0.05))%6===0){
      cx.globalAlpha=0.7+0.3*Math.sin(t*0.3);
      cx.fillStyle=P.YEL;
      cx.fillRect((x+Math.cos(a)*sR)|0,(y+Math.sin(a)*sR)|0,2,2);
    }
  }
  cx.lineWidth=1;cx.globalAlpha=1;
  // Подсвечиваем края брешей (чтобы игрок видел куда целиться)
  for(const ws of b.weakSpots){
    // Центр бреши — красная точка-маркёр (приманка-цель)
    const ca=ws.orbitA;
    const cR=sR;
    const cx_=x+Math.cos(ca)*cR;
    const cy_=y+Math.sin(ca)*cR;
    // Сохраняем экранные координаты для других эффектов
    ws.x=cx_;ws.y=cy_;
    // Пульсирующее свечение в центре бреши — приманка для игрока
    const pulseA=0.5+0.4*Math.sin(t*0.25);
    cx.globalAlpha=pulseA;
    disc(cx_|0,cy_|0,8,P.YEL);
    cx.globalAlpha=pulseA*0.7;
    disc(cx_|0,cy_|0,5,P.WHT);
    cx.globalAlpha=1;
    // Кольцо-мишень
    if(Math.floor(t/12)%2){
      cx.globalAlpha=0.5;
      ring(cx_|0,cy_|0,12,P.YEL,1);
      cx.globalAlpha=1;
    }
    // Боковые "разорванные края" бреши — короткие красные иголки на границах дуги
    for(const off of [-ws.arcWidth,ws.arcWidth]){
      const ea=ws.orbitA+off;
      const ex=x+Math.cos(ea)*cR;
      const ey=y+Math.sin(ea)*cR;
      // 3 коротких рваных штриха
      for(let s=0;s<3;s++){
        const r2=cR-2-s*2;
        const sx=x+Math.cos(ea)*r2;
        const sy=y+Math.sin(ea)*r2;
        cx.fillStyle='#ff6644';
        cx.fillRect(sx|0,sy|0,2,2);
      }
    }
  }
}
// ★ v16 r3: Тина в 3 раза крупнее. Все радиусы умножены на TINA_SCALE.
const TINA_SCALE=3;
const TINA_R=62*TINA_SCALE;          // радиус тела (186)
const TINA_GLOW_R=90*TINA_SCALE;      // внешнее свечение (270)
const TINA_HEX_R=52*TINA_SCALE;       // радиус сетки гексов (156)
const TINA_PORT_R=58*TINA_SCALE;      // экватор пушечных портов (174)
const TINA_SHIELD_R=71*TINA_SCALE;    // щит фазы 1 (213)

function drwTinaBoss(b){
  const eP=b.emergencyProtocol;
  // ★ v24b: Тина трясётся во время экстра режима (eT 60–1560)
  let shakeOff=0;
  if(eP&&eP.t>=60&&eP.t<1560){
    const eT=eP.t;
    const intensity=eT<540?(eT-60)/480*2.5:eT<1020?2.5+(eT-540)/480*3.5:6.0;
    shakeOff=intensity;
  }
  // Сильная тряска Тины во время фазового перехода — эпичнее при входе в режим ярости (phase 4)
  if(b.phaseTransition){
    const pT=b.phaseTransition;
    const prog=pT.t/pT.duration;
    const ramp=prog<0.5?prog*2:(1-prog)*2;
    const peak=pT.toPhase===4?10:pT.toPhase===3?6:4;
    shakeOff=Math.max(shakeOff,ramp*peak);
  }
  const x=(b.x+(Math.random()-.5)*shakeOff)|0;
  const y=(b.y+(Math.random()-.5)*shakeOff)|0;
  const t=b.t||0;
  // ★ v16 r10 #3: Во время сцены звезды (eT>=1740) тело Тины не рисуем — она разломилась
  // на осколки, видна только звезда внутри (всё рисуется в drwEmergencyProtocol)
  if(eP&&eP.t>=1740){
    drwEmergencyProtocol(b,t);
    return;
  }

  // === ВНЕШНЕЕ СВЕЧЕНИЕ — несколько слоёв с разной частотой пульса ===
  cx.globalAlpha=0.10+0.05*Math.sin(t*0.05);
  disc(x,y,TINA_GLOW_R,'#aa3322');
  cx.globalAlpha=0.16+0.06*Math.sin(t*0.07+1);
  disc(x,y,TINA_GLOW_R*0.83,'#661100');
  cx.globalAlpha=0.22;
  disc(x,y,TINA_GLOW_R*0.65,'#330800');
  cx.globalAlpha=1;

  // Защитное поле в фазе 1 — циан-свечение, теперь толще
  if(b.phase===1){
    cx.globalAlpha=0.30+0.18*Math.sin(t*0.08);
    ring(x,y,TINA_SHIELD_R-1,P.CYA,2);
    ring(x,y,TINA_SHIELD_R+2,P.CYA,1);
    cx.globalAlpha=0.18+0.08*Math.sin(t*0.13);
    ring(x,y,TINA_SHIELD_R+8,P.CYA,1);
    cx.globalAlpha=1;
    // Гексагональная решётка щита — едва заметные узоры на сферической поверхности
    for(let i=0;i<24;i++){
      const a=i/24*Math.PI*2+t*0.004;
      cx.globalAlpha=0.25+0.15*Math.sin(t*0.1+i);
      const sx=x+Math.cos(a)*(TINA_SHIELD_R-2);
      const sy=y+Math.sin(a)*(TINA_SHIELD_R-2);
      cx.fillStyle='#88ccff';cx.fillRect(sx|0,sy|0,2,2);
    }
    cx.globalAlpha=1;
  }

  // === ОСНОВНОЕ ТЕЛО ===
  disc(x,y,TINA_R,'#1a0800');
  disc(x,y,TINA_R-4,'#220c00');
  // Кратеры/тени по поверхности (для глубины)
  for(let i=0;i<8;i++){
    const a=i*0.785+t*0.002;
    const cr=TINA_R-20+Math.sin(i)*8;
    const cx_=x+Math.cos(a)*cr*0.7;
    const cy_=y+Math.sin(a)*cr*0.7;
    cx.globalAlpha=0.4;
    disc(cx_|0,cy_|0,8,'#0a0400');
    cx.globalAlpha=1;
  }

  // === ГЕКСАГОНАЛЬНАЯ СЕТКА ПАНЕЛЕЙ ===
  // Больше гексов — масштабируем количество с радиусом
  const hexCount=72;
  for(let i=0;i<hexCount;i++){
    const golden=Math.PI*(3-Math.sqrt(5));
    const k=i/hexCount;
    const phi=Math.acos(1-2*k);
    const theta=golden*i+t*.005;
    const sx=x+Math.sin(phi)*Math.cos(theta)*TINA_HEX_R;
    const sy=y+Math.sin(phi)*Math.sin(theta)*TINA_HEX_R;
    const depth=Math.cos(phi);
    if(depth<-0.05)continue;
    const brightness=Math.max(0.3,depth);
    const litUp=(i+Math.floor(t*0.025))%5===0;
    let panelCol;
    if(litUp){
      // Активная (стреляющая) панель
      panelCol=t%30<8?'#ff8833':'#ff4422';
    }else{
      const cv=Math.floor(60+brightness*90);
      panelCol='rgb('+cv+','+(cv*0.3|0)+','+(cv*0.1|0)+')';
    }
    cx.fillStyle=panelCol;
    cx.beginPath();
    const hexSize=6*brightness;
    for(let h=0;h<6;h++){
      const ha=h/6*Math.PI*2;
      const hx=sx+Math.cos(ha)*hexSize;
      const hy=sy+Math.sin(ha)*hexSize;
      if(h===0)cx.moveTo(hx,hy);else cx.lineTo(hx,hy);
    }
    cx.closePath();cx.fill();
    cx.strokeStyle='#0a0400';cx.lineWidth=0.5;cx.stroke();
  }

  // === ТРЕЩИНЫ ИЗ ЯДРА (звезда хочет вырваться) — больше, динамичнее ===
  // Фаза 3 → ярче, фаза 2 → средне, фаза 1 → тонкие
  const crackI=b.phase===3?1.2:b.phase===2?0.8:0.4;
  for(let i=0;i<12;i++){
    const a=i/12*Math.PI*2+t*0.008+i*0.7;
    const len=TINA_R*0.85+Math.sin(t*0.1+i)*8;
    const w=2*crackI;
    cx.globalAlpha=(0.6+0.2*Math.sin(t*0.18+i))*crackI;
    cx.strokeStyle='#ff4422';cx.lineWidth=w;
    cx.beginPath();
    let px=x+Math.cos(a)*16,py=y+Math.sin(a)*16;
    cx.moveTo(px,py);
    for(let s=1;s<=5;s++){
      const sa=a+Math.sin(t*0.05+i*1.7+s*0.9)*0.18;
      px=x+Math.cos(sa)*(16+s*(len-16)/5);
      py=y+Math.sin(sa)*(16+s*(len-16)/5);
      cx.lineTo(px,py);
    }
    cx.stroke();
    // Жёлтая горячая жила в центре трещины
    cx.globalAlpha=(0.4+0.3*Math.sin(t*0.22+i))*crackI;
    cx.strokeStyle='#ffcc44';cx.lineWidth=w*0.5;cx.stroke();
    cx.globalAlpha=1;
  }

  // === ПУШЕЧНЫЕ ПОРТЫ — крупные, на экваторе ===
  for(let i=0;i<12;i++){
    const a=i/12*Math.PI*2+t*0.006;
    const gx=x+Math.cos(a)*TINA_PORT_R,gy=y+Math.sin(a)*TINA_PORT_R;
    rc((gx-6)|0,(gy-6)|0,12,12,'#330800');
    rc((gx-5)|0,(gy-5)|0,10,10,'#661100');
    rc((gx-3)|0,(gy-3)|0,6,6,P.TINA2);
    if(t%30<8){cx.globalAlpha=0.9;rc((gx-2)|0,(gy-2)|0,4,4,'#ff8844');cx.globalAlpha=1;}
  }

  // === ЭКВАТОРИАЛЬНОЕ КОЛЬЦО — характерная деталь сферы Дайсона ===
  cx.globalAlpha=0.85;
  ring(x,y,TINA_PORT_R,'#441100',2);
  ring(x,y,TINA_PORT_R+3,'#221000',1);
  cx.globalAlpha=1;

  // === ЦЕНТРАЛЬНОЕ ЯДРО — заточенная звезда (намного ярче и больше) ===
  const pulse=0.8+0.2*Math.sin(t*0.12);
  cx.globalAlpha=pulse;
  disc(x,y,(45*pulse)|0,'#ff4422');
  disc(x,y,(33*pulse)|0,'#ff8844');
  disc(x,y,(21*pulse)|0,'#ffcc66');
  disc(x,y,(9*pulse)|0,'#ffffff');
  cx.globalAlpha=1;

  // Лучи звезды — длиннее и динамичнее
  for(let i=0;i<8;i++){
    const a=i/8*Math.PI*2+t*0.02;
    cx.globalAlpha=0.4+0.2*Math.sin(t*0.15+i);
    cx.strokeStyle='#ffaa44';cx.lineWidth=2;
    cx.beginPath();
    cx.moveTo(x+Math.cos(a)*24,y+Math.sin(a)*24);
    cx.lineTo(x+Math.cos(a)*48,y+Math.sin(a)*48);
    cx.stroke();
  }
  cx.globalAlpha=1;

  // === ДУГИ ЭНЕРГИИ ВОКРУГ КОРПУСА (новое - усиление драмы) ===
  if(b.phase>=2){
    for(let i=0;i<3;i++){
      const a1=t*0.025+i*Math.PI*2/3;
      const a2=a1+0.6+Math.sin(t*0.05+i)*0.3;
      const r=TINA_R+5+Math.sin(t*0.1+i*2)*4;
      cx.globalAlpha=0.5+0.3*Math.sin(t*0.2+i);
      cx.strokeStyle=b.phase===3?P.YEL:P.RED;cx.lineWidth=1.5;
      cx.beginPath();
      cx.arc(x,y,r,a1,a2);
      cx.stroke();
      cx.globalAlpha=1;
    }
  }

  // === ЧАСТИЦЫ ЯРОСТИ — постоянная аура (новое) ===
  if(t%2===0&&b.phase>=2){
    const pa=Math.random()*Math.PI*2;
    const pr=TINA_R+Math.random()*30;
    PTS.push({
      x:x+Math.cos(pa)*pr,y:y+Math.sin(pa)*pr,
      vx:Math.cos(pa)*0.5,vy:Math.sin(pa)*0.5,
      lf:20,ml:24,col:b.phase===3?P.YEL:'#ff8844',
      sz:1,gv:0,fade:0.6,
    });
  }

  // Эффект мигания при попадании в неуязвимую часть
  if(b.reflectFlash>0){
    cx.globalAlpha=b.reflectFlash/15;
    ring(x,y,TINA_R,P.WHT,2);
    ring(x,y,TINA_R+2,P.WHT,1);
    cx.globalAlpha=1;
  }
  // Слабые места в фазе 3 и 4 (ярость) — БРЕШИ В ЩИТЕ
  if((b.phase===3||b.phase===4) && b.weakSpots){
    drwShieldWithBreaches(b,t);
  }
  // Энергоблоки в фазе 1
  if(b.phase===1 && b.energyBlocks){
    for(const eb of b.energyBlocks) drwEnergyBlock(eb,t);
  }
  // Турели в фазе 2
  if(b.phase===2 && b.turrets){
    for(const tr of b.turrets) drwTurret(tr,t);
  }

  // === ★ v16 r3 #9: ЭКСТРЕННЫЙ ПРОТОКОЛ — броня + пушки ===
  if(eP){
    drwEmergencyProtocol(b,t);
  }

  // ★ v16 r4 #4: HP бар и метки фазы Тины БОЛЬШЕ НЕ рисуются над ней (выходили за экран и были размытыми).
  // Они теперь отображаются исключительно в screen-space HUD (см. drwFinaleTina ниже).
}

// ★ v16 r3 #9: Экстренный протокол — броня обхватывает Тину, появляются пушки, заряжаются → кот!
// ★ v16 r10: 1740 кадров (29 сек). Пушки 2× медленнее, 2× больше, добавлена 5я центральная пушка
// и видимая трансформация Тины (трещины ширятся, цвет становится злее, корпус "вспучивается").
// Тайминг по фазам:
//   0–60     (1 сек):  Тина: «ХВАТИТ ИГР! ПЕРЕХОЖУ В ЭКСТРА РЕЖИМ!»
//   60–540   (8 сек):  5 ОГРОМНЫХ пушек появляются и наводятся на игрока
//  540–1020  (8 сек):  заряжание — энерго-шары + обратный отсчёт 5..4..3..2..1
// 1020–1200  (3 сек):  «недоумение» — пушки теряют заряд
// 1200–1380  (3 сек):  кот перегрызает провода
// 1380–1560  (3 сек):  массовые взрывы
// 1560–1740  (3 сек):  финальная вспышка → tinaDie
function drwEmergencyProtocol(b,t){
  const x=b.x|0,y=b.y|0;
  const eP=b.emergencyProtocol;
  const eT=eP.t;
  const p=window.G&&window.G.pl;

  // === АУРА ЯРОСТИ ===
  if(eT<1560){
    const rage=Math.min(1,eT/60);
    cx.globalAlpha=rage*(0.4+0.2*Math.sin(t*0.3));
    ring(x,y,TINA_R+8,P.RED,3);
    ring(x,y,TINA_R+14,P.RED,2);
    cx.globalAlpha=rage*(0.2+0.15*Math.sin(t*0.4+1));
    ring(x,y,TINA_R+22,P.RED,1);
    cx.globalAlpha=1;
  }

  // === ★ v16 r10 #4: ТРАНСФОРМАЦИЯ ТИНЫ — нарастает с прогрессом катсцены ===
  // Тина становится "злее": красное свечение тела, расширяющиеся трещины, дрожь
  if(eT>=60&&eT<1380){
    const morphT=Math.min(1,(eT-60)/300); // полностью сформирована к концу появления пушек
    // 1) Красное свечение тела (поверх обычной отрисовки Тины)
    cx.globalAlpha=morphT*(0.35+0.15*Math.sin(t*0.18));
    disc(x,y,TINA_R-2,'#aa1100');
    cx.globalAlpha=morphT*0.20;
    disc(x,y,TINA_R-12,'#ff3322');
    cx.globalAlpha=1;
    // 2) Расширяющиеся жёлто-белые трещины — "звезда внутри прорывается"
    const cracks=8+Math.floor(morphT*8); // 8..16 трещин
    for(let i=0;i<cracks;i++){
      const ang=i/cracks*Math.PI*2+t*0.003;
      const cLen=TINA_R*(0.5+morphT*0.55);
      const cWidth=1+morphT*2;
      cx.globalAlpha=morphT*(0.55+0.3*Math.sin(t*0.15+i*1.7));
      cx.strokeStyle=Math.random()<0.5?'#ffee44':'#ff6622';
      cx.lineWidth=cWidth;
      // Зигзаговая трещина
      cx.beginPath();
      let lx=x,ly=y;
      const segs=4;
      for(let s=1;s<=segs;s++){
        const tt=s/segs;
        const wob=(Math.random()-0.5)*morphT*8;
        const tx=x+Math.cos(ang+wob*0.02)*cLen*tt;
        const ty=y+Math.sin(ang+wob*0.02)*cLen*tt;
        if(s===1){cx.moveTo(lx,ly);}
        cx.lineTo(tx,ty);
        lx=tx;ly=ty;
      }
      cx.stroke();
      cx.lineWidth=1;
    }
    cx.globalAlpha=1;
    // 3) "Вспучивание" — пузыри-шишки на корпусе (выпуклости)
    const bumps=Math.floor(morphT*6);
    for(let i=0;i<bumps;i++){
      const ba=t*0.005+i*1.05;
      const br=TINA_R+Math.sin(t*0.08+i)*4;
      const bx_=x+Math.cos(ba)*br;
      const by_=y+Math.sin(ba)*br;
      cx.globalAlpha=0.7*morphT;
      disc(bx_|0,by_|0,(4+Math.sin(t*0.1+i)*2)|0,'#ff4422');
      cx.globalAlpha=0.9*morphT;
      disc(bx_|0,by_|0,2,'#ffaa44');
      cx.globalAlpha=1;
    }
    // 4) Микро-частицы пара/осколков — слабые и постоянные
    if(t%4===0){
      const pa=Math.random()*Math.PI*2;
      const pr=TINA_R+Math.random()*8;
      PTS.push({
        x:x+Math.cos(pa)*pr,y:y+Math.sin(pa)*pr,
        vx:Math.cos(pa)*0.5,vy:Math.sin(pa)*0.5-0.3,
        lf:24,ml:28,col:Math.random()<0.5?'#aa3322':'#664422',sz:1,gv:-0.01,fade:0.4
      });
    }
    // 5) Дрожание тела (постоянная микро-тряска) — лёгкое смещение для всего рендера
    if(eT%14===0)shake(1+morphT*1.5);
  }

  // === ФАЗА 0 (0-60): «ХВАТИТ ИГР!» ===
  if(eT<60){
    const breath=eT/60;
    cx.globalAlpha=breath*0.35;
    disc(x,y,TINA_R+10,'#ff2200');
    cx.globalAlpha=1;
  }

  // === ФАЗА 1 (60-540): ПОЯВЛЕНИЕ 5 ОГРОМНЫХ ПУШЕК (8 сек, 2× больше) ===
  // ★ v16 r11: 5 пушек распределены ШИРЕ по периметру Тины (полный круг ±π радиан)
  // и появляются ПО ОЧЕРЕДИ — внешние первыми, центральная последней.
  // Главная пушка чуть короче (×0.8): 260→208.
  let gunPositions=null;
  if(eT>=60){
    let angleToPlayer=Math.PI;
    if(p){angleToPlayer=Math.atan2(p.y-y,p.x-x);}
    // Распределение по дуге ±π (180° сектор обращённый к игроку, расстановка ровная)
    // Оффсеты от наружных к центру: [-1.4, +1.4, -0.7, +0.7, 0]
    // (порядок появления — от широких к центру)
    const sequence=[
      {off:-1.4, slot:0},  // самая дальняя левая
      {off: 1.4, slot:1},  // самая дальняя правая
      {off:-0.7, slot:2},  // ближняя левая
      {off: 0.7, slot:3},  // ближняя правая
      {off: 0.0, slot:4},  // центральная (главная)
    ];
    // Длительность фазы появления = 480 кадров
    // Каждая пушка получает окно 80 кадров: появление + промежуток
    // Pos i стартует в eT = 60 + i*80, длится 160 кадров на полное выдвижение
    // Последняя стартует на eT = 60+4*80 = 380, заканчивается ~540
    gunPositions=[];
    for(const item of sequence){
      const isCenter=(item.off===0);
      const startT=60+item.slot*80;
      const localT=eT-startT;
      if(localT<-2)continue; // ещё не должна появляться
      const gunT=Math.max(0,Math.min(1,localT/160));
      const eased=easeOutCube(gunT);
      const angle=angleToPlayer+item.off;
      const baseR=isCenter?TINA_R-4:TINA_R+10;
      // ★ r11: Главная пушка короче ×0.8 (208 вместо 260)
      // ★ r12 #1: Пушки в 1.5× меньше (главная 208→138, обычные 160→107)
      const maxProtrude=isCenter?138:107;
      let protrude=8+(maxProtrude-8)*eased;
      // ★ v16 r12 #2: ВОЗВРАТ ПУШЕК ВНУТРЬ во время confusion-фазы (eT 1140..1380)
      // Дать 120 кадров сжатия энерго-шаров, потом 240 кадров ретракции
      if(eT>=1140&&eT<1380){
        const retractT=Math.min(1,(eT-1140)/240); // 0..1 за 4 сек
        const retractEased=easeOutCube(retractT);
        // Протруд интерполируется обратно к нулю (-12 чтобы пушка совсем спряталась внутрь корпуса)
        protrude=protrude*(1-retractEased)+(-12)*retractEased;
      }else if(eT>=1380){
        protrude=-12; // полностью внутри Тины
      }
      const baseX=x+Math.cos(angle)*baseR;
      const baseY=y+Math.sin(angle)*baseR;
      const aimAngle=p?Math.atan2(p.y-baseY,p.x-baseX):angle;
      const muzzleX=baseX+Math.cos(aimAngle)*protrude;
      const muzzleY=baseY+Math.sin(aimAngle)*protrude;
      gunPositions.push({baseX,baseY,muzzleX,muzzleY,aimAngle,protrude,isCenter,localT,gunT});

      // ★ v16 r12 #2: Если пушка задвинута внутрь Тины — не рисуем (но позиция запомнена для charging)
      if(protrude<-8){
        continue;
      }

      // Звук появления (один раз при старте)
      if(localT===0){
        bip(50,.4,.3,'sawtooth',isCenter?60:120,isCenter?30:55);
        // Дымовой пыхт. при появлении
        for(let s=0;s<14;s++){
          PTS.push({
            x:baseX+(Math.random()-0.5)*30,
            y:baseY+(Math.random()-0.5)*30,
            vx:(Math.random()-0.5)*1.6,vy:(Math.random()-0.5)*1.6-0.3,
            lf:24,ml:30,col:Math.random()<0.5?'#664422':'#aa6633',sz:1+Math.random(),gv:0,fade:0.45
          });
        }
        if(isCenter){shake(8);flash(.25,P.RED);}
        else shake(3);
      }

      // === ОТРИСОВКА ПУШКИ ===
      cx.save();
      cx.translate(baseX,baseY);
      cx.rotate(aimAngle);
      if(isCenter){
        // ★ r12 #1+#5: ЦЕНТРАЛЬНАЯ супер-пушка — детализированная, технологичная (×0.66 от прежней)
        // База — шестигранная многослойная платформа
        cx.fillStyle='#000000';
        cx.fillRect(-22,-22,44,44);
        cx.fillStyle='#1a0606';
        cx.fillRect(-20,-20,40,40);
        cx.fillStyle='#3a1208';
        cx.fillRect(-18,-18,36,36);
        cx.fillStyle='#552211';
        cx.fillRect(-16,-16,32,32);
        cx.fillStyle='#772211';
        cx.fillRect(-14,-14,28,28);
        // Тёмный шестиугольный сердечник
        cx.fillStyle='#220606';
        cx.fillRect(-10,-10,20,20);
        // Пульсирующий энергоядро в центре
        const corePulse=0.6+0.4*Math.sin(eT*0.18);
        cx.globalAlpha=corePulse;
        cx.fillStyle='#ff4422';cx.fillRect(-6,-6,12,12);
        cx.fillStyle='#ffaa44';cx.fillRect(-4,-4,8,8);
        cx.fillStyle='#ffee88';cx.fillRect(-2,-2,4,4);
        cx.globalAlpha=1;
        // Радиаторы-рёбра по бокам базы
        cx.fillStyle='#aa6633';
        for(let f=-14;f<=12;f+=4){
          cx.fillRect(-22,f,2,3);cx.fillRect(20,f,2,3);
        }
        // Декоративные клёпки по углам
        cx.fillStyle='#cc6633';
        cx.fillRect(-20,-20,2,2);cx.fillRect(18,-20,2,2);
        cx.fillRect(-20,18,2,2);cx.fillRect(18,18,2,2);
        // Ствол — двойной контур + энергожила
        cx.fillStyle='#000000';
        cx.fillRect(0,-10,protrude+6,20);
        cx.fillStyle='#220606';
        cx.fillRect(2,-8,protrude+2,16);
        cx.fillStyle='#3a1208';
        cx.fillRect(4,-6,protrude-2,12);
        cx.fillStyle='#552211';
        cx.fillRect(6,-4,protrude-6,8);
        // Энергоканал внутри ствола (пульсирующая полоса)
        cx.globalAlpha=0.8+0.2*Math.sin(eT*0.25);
        cx.fillStyle='#ff4422';
        cx.fillRect(8,-2,protrude-10,4);
        cx.fillStyle='#ffaa66';
        cx.fillRect(8,-1,protrude-10,2);
        cx.globalAlpha=1;
        // Кольца усиления (более тонкие чем раньше)
        cx.fillStyle='#664422';
        const cRings=Math.floor(protrude/14);
        for(let r=1;r<=cRings;r++){
          cx.fillRect(r*14,-10,2,20);
          // Световой блик на кольце
          cx.fillStyle='#cc8855';
          cx.fillRect(r*14,-10,2,2);
          cx.fillStyle='#664422';
        }
        // Срез ствола — энергомаска (линза)
        cx.fillStyle='#000000';
        cx.fillRect(protrude,-7,4,14);
        cx.globalAlpha=0.7+0.3*Math.sin(eT*0.3);
        cx.fillStyle='#ff2200';
        cx.fillRect(protrude+1,-5,2,10);
        cx.fillStyle='#ffaa44';
        cx.fillRect(protrude+1,-3,2,6);
        cx.globalAlpha=1;
      }else{
        // ★ r12 #1+#5: Угловые пушки — компактные но детализированные (×0.66 от прежних)
        cx.fillStyle='#000000';
        cx.fillRect(-15,-17,30,34);
        cx.fillStyle='#1a0606';
        cx.fillRect(-13,-15,26,30);
        cx.fillStyle='#3a1208';
        cx.fillRect(-12,-14,24,28);
        cx.fillStyle='#552211';
        cx.fillRect(-10,-12,20,24);
        cx.fillStyle='#772211';
        cx.fillRect(-8,-10,16,20);
        // Энергоядро базы
        const corePulse2=0.5+0.4*Math.sin(eT*0.2+item.slot);
        cx.globalAlpha=corePulse2;
        cx.fillStyle='#ff4422';cx.fillRect(-4,-4,8,8);
        cx.fillStyle='#ffaa44';cx.fillRect(-2,-2,4,4);
        cx.globalAlpha=1;
        // Радиаторы
        cx.fillStyle='#aa6633';
        for(let f=-10;f<=8;f+=4){
          cx.fillRect(-15,f,2,2);cx.fillRect(13,f,2,2);
        }
        // Клёпки по углам
        cx.fillStyle='#cc6633';
        cx.fillRect(-13,-15,2,2);cx.fillRect(11,-15,2,2);
        cx.fillRect(-13,13,2,2);cx.fillRect(11,13,2,2);
        // Ствол
        cx.fillStyle='#000000';
        cx.fillRect(0,-8,protrude+4,16);
        cx.fillStyle='#220606';
        cx.fillRect(2,-6,protrude,12);
        cx.fillStyle='#3a1208';
        cx.fillRect(4,-5,protrude-4,10);
        cx.fillStyle='#552211';
        cx.fillRect(6,-3,protrude-8,6);
        // Энергожила
        cx.globalAlpha=0.7+0.3*Math.sin(eT*0.25+item.slot);
        cx.fillStyle='#ff4422';
        cx.fillRect(8,-1,protrude-12,2);
        cx.fillStyle='#ffaa66';
        cx.fillRect(8,-1,protrude-12,1);
        cx.globalAlpha=1;
        // Кольца усиления
        cx.fillStyle='#552211';
        const rings=Math.floor(protrude/12);
        for(let r=1;r<=rings;r++){
          cx.fillRect(r*12,-8,2,16);
          cx.fillStyle='#aa7744';
          cx.fillRect(r*12,-8,2,1);
          cx.fillStyle='#552211';
        }
        // Срез — линза
        cx.fillStyle='#000000';
        cx.fillRect(protrude,-5,3,10);
        cx.globalAlpha=0.6+0.3*Math.sin(eT*0.3+item.slot);
        cx.fillStyle='#ff2200';
        cx.fillRect(protrude+1,-3,1,6);
        cx.fillStyle='#ffaa44';
        cx.fillRect(protrude+1,-2,1,4);
        cx.globalAlpha=1;
      }
      cx.restore();

      // Подсветка дула во время появления
      if(gunT<1){
        cx.globalAlpha=0.4*Math.sin(eT*0.3+item.slot);
        disc(muzzleX|0,muzzleY|0,isCenter?6:4,P.RED);
        cx.globalAlpha=1;
      }
      // Лазерный прицел на игрока
      if(p&&gunT>0.5&&Math.floor(eT/3)%2===0){
        cx.globalAlpha=isCenter?(0.5+0.3*Math.sin(eT*0.4)):(0.3+0.2*Math.sin(eT*0.4));
        cx.strokeStyle=P.RED;cx.lineWidth=isCenter?2:1;
        cx.beginPath();
        cx.moveTo(muzzleX|0,muzzleY|0);
        cx.lineTo(p.x|0,p.y|0);
        cx.stroke();
        cx.lineWidth=1;
        cx.globalAlpha=1;
      }
    }
    // Звуки появления (старые — теперь дублируем при первом появлении каждой пушки выше; оставим тут общий "пробуждение")
    // Частицы при выдвижении
    if(eT<540&&t%2===0){
      for(const g of gunPositions){
        if(Math.random()<0.5){
          PTS.push({
            x:g.baseX+(Math.random()-0.5)*20,
            y:g.baseY+(Math.random()-0.5)*20,
            vx:(Math.random()-0.5)*0.8,vy:(Math.random()-0.5)*0.8,
            lf:18,ml:22,col:Math.random()<0.5?'#882211':'#552211',sz:1,gv:0,fade:0.5
          });
        }
      }
    }
    // ★ v16 r11: Сохраняем последние позиции пушек — пригодятся при взрыве (frags)
    b._lastGunPositions=gunPositions.map(g=>({baseX:g.baseX,baseY:g.baseY,isCenter:g.isCenter}));
  }

  // === ФАЗА 2 (300-600): ЗАРЯЖАНИЕ + ОТСЧЁТ 5..4..3..2..1 ===
  // Растущий энерго-шар на дуле каждой пушки + красная обратная нумерация.
  if(eT>=540&&eT<1020&&gunPositions){
    const chargeT=eT-540; // 0..480
    const chargeProgress=chargeT/480;
    // Энерго-шары на дулах
    for(let i=0;i<gunPositions.length;i++){
      const g=gunPositions[i];
      // ★ v16 r10: Размер шара зависит от типа пушки. Центральная — в 1.7× больше
      const ballR=Math.round(g.isCenter?(3+chargeProgress*44):(2+chargeProgress*26));
      // Ярко-красное внешнее свечение
      cx.globalAlpha=0.4+0.2*Math.sin(eT*0.3+i);
      disc(g.muzzleX|0,g.muzzleY|0,ballR+5,'#ff2200');
      cx.globalAlpha=0.6+0.2*Math.sin(eT*0.4+i);
      disc(g.muzzleX|0,g.muzzleY|0,ballR+2,'#ff6622');
      cx.globalAlpha=0.85;
      disc(g.muzzleX|0,g.muzzleY|0,ballR,'#ffaa44');
      cx.globalAlpha=1;
      disc(g.muzzleX|0,g.muzzleY|0,Math.max(1,ballR-2),'#ffee88');
      disc(g.muzzleX|0,g.muzzleY|0,Math.max(1,ballR-5),'#ffffff');
      // Электрические дуги-молнии от шара к стволу
      if(t%2===0){
        for(let arc=0;arc<3;arc++){
          const aa=Math.random()*Math.PI*2;
          const ar=ballR+Math.random()*8;
          PTS.push({
            x:g.muzzleX+Math.cos(aa)*ar,
            y:g.muzzleY+Math.sin(aa)*ar,
            vx:Math.cos(aa)*0.4,vy:Math.sin(aa)*0.4,
            lf:8,ml:10,col:Math.random()<0.5?'#ffff88':'#ffaa44',sz:1,gv:0,fade:0.6
          });
        }
      }
      // Линия от Тины к шару (питание)
      cx.globalAlpha=0.5+0.3*Math.sin(eT*0.5);
      cx.strokeStyle='#ff6622';cx.lineWidth=2;
      cx.beginPath();cx.moveTo(x,y);cx.lineTo(g.muzzleX|0,g.muzzleY|0);cx.stroke();
      cx.lineWidth=1;cx.globalAlpha=1;
    }
    // Притягивающиеся к Тине частицы (питание ядра)
    if(t%2===0){
      const pa=Math.random()*Math.PI*2;
      const pr=TINA_R+50+Math.random()*150;
      PTS.push({
        x:x+Math.cos(pa)*pr,y:y+Math.sin(pa)*pr,
        vx:-Math.cos(pa)*1.5,vy:-Math.sin(pa)*1.5,
        lf:30,ml:35,col:Math.random()<0.5?'#ffaa44':P.YEL,sz:1,gv:0,fade:0.5,
      });
    }
    // Нарастающее свечение Тины
    cx.globalAlpha=chargeProgress*0.5;
    disc(x,y,TINA_R+20,'#ff6622');
    cx.globalAlpha=1;
    // Звук заряжания — ровный гул
    if(eT%20===0)bip(80+chargeProgress*120,.18,.18,'sawtooth',150,75);
    // ★ v16 r8: Обратный отсчёт 5..4..3..2..1 — 96 кадров на цифру = 1.6 сек на каждую (медленнее, драматичнее)
    const num=chargeT<96?'5':chargeT<192?'4':chargeT<288?'3':chargeT<384?'2':'1';
    const numAlpha=Math.max(0,1-((chargeT%96)/96));
    cx.globalAlpha=numAlpha;
    if(chargeT%96===0)bip(220+(5-parseInt(num))*60,.5,.3,'square',440,220);
    txcs(num,LH/2-30,P.RED,P.BLK,5);
    cx.globalAlpha=1;
  }

  // === ФАЗА 3 (780-960): «НЕДОУМЕНИЕ» — заряд гаснет, пушки трясутся ===
  if(eT>=1020&&eT<1380&&gunPositions){
    const cnfT=eT-1020;
    const fadeOut=Math.max(0,1-cnfT/60); // первые 60 кадров — сжатие шаров
    // Дрожание (шейк положений) — на каждом кадре чуть-чуть смещаем
    for(let i=0;i<gunPositions.length;i++){
      const g=gunPositions[i];
      const tremor=Math.sin(eT*0.6+i*1.7)*1.5;
      const ballR=Math.round((2+14*1)*fadeOut);
      if(ballR>0){
        cx.globalAlpha=fadeOut*0.6;
        disc((g.muzzleX+tremor)|0,(g.muzzleY+tremor*0.5)|0,ballR+1,'#ff6622');
        cx.globalAlpha=fadeOut*0.85;
        disc((g.muzzleX+tremor)|0,(g.muzzleY+tremor*0.5)|0,ballR,'#ffaa44');
        cx.globalAlpha=1;
      }
      // Дымок от пушек
      if(cnfT>30&&t%4===0){
        PTS.push({
          x:g.muzzleX,y:g.muzzleY,
          vx:(Math.random()-0.5)*0.3,vy:-0.3-Math.random()*0.3,
          lf:30,ml:36,col:'#666666',sz:2,gv:-0.02,fade:0.35
        });
      }
    }
    // Знак «???» над Тиной
    if(cnfT>30){
      const a=Math.min(1,(cnfT-30)/20);
      cx.globalAlpha=a;
      const wobble=Math.sin(eT*0.4)*2;
      txcs('?!?!?!',LH/2-40+wobble,P.YEL,P.BLK,3);
      cx.globalAlpha=1;
    }
    // Лёгкое подёргивание Тины
    if(cnfT%15===0)shake(2);
    if(cnfT===0)bip(120,.4,.4,'sine',60,30); // глюк-звук
  }

  // === ФАЗА 4 (960-1140): КОТ ПЕРЕГРЫЗАЕТ ПРОВОДА + ИСКРЫ ===
  if(eT>=1380&&eT<1560){
    const catT=eT-1380;
    // Кот пробегает по нижней части Тины
    const totalCatRun=180; // 3 сек
    const catProgress=catT/totalCatRun;
    // Стартует справа сверху от Тины, бежит влево вниз
    const catX=x+TINA_R+20-catT*1.4;
    const catY=y+TINA_R-25+Math.sin(catT*0.3)*4;
    // Тельце кота — крупнее
    cx.fillStyle='#ff8844';
    cx.fillRect(catX|0,catY|0,7,4); // тело
    cx.fillRect((catX+1)|0,(catY-1)|0,5,1);
    // Голова + ушки
    cx.fillRect((catX+5)|0,(catY-2)|0,3,3);
    cx.fillRect((catX+5)|0,(catY-4)|0,1,2);
    cx.fillRect((catX+7)|0,(catY-4)|0,1,2);
    // Глазки
    cx.fillStyle='#000000';
    cx.fillRect((catX+6)|0,(catY-1)|0,1,1);
    // Лапки бегущие
    cx.fillStyle='#ff8844';
    const run=Math.floor(catT/4)%2;
    cx.fillRect(catX|0,(catY+4)|0,1,1+run);
    cx.fillRect((catX+2)|0,(catY+4)|0,1,1+(1-run));
    cx.fillRect((catX+5)|0,(catY+4)|0,1,1+run);
    // Хвост
    cx.fillRect((catX-2)|0,(catY+1)|0,2,1);
    cx.fillRect((catX-3)|0,catY|0,1,1);

    // «МЯУ!» появляется на 30-м кадре
    if(catT===30)sfxUI();
    if(catT>=30&&catT<90){
      const a=Math.min(1,(catT-30)/8)*Math.max(0,1-(catT-60)/30);
      cx.globalAlpha=a;
      txcs('МЯУ!',(catY-30)|0,P.YEL,P.BLK,2);
      cx.globalAlpha=1;
    }

    // Электрические искры от тела Тины (там где кот «грызёт»)
    if(t%2===0){
      // Несколько источников искр по периметру Тины
      for(let s=0;s<4;s++){
        const sa=catT*0.05+s*Math.PI/2;
        const sr=TINA_R+Math.random()*15;
        const sx=x+Math.cos(sa)*sr;
        const sy=y+Math.sin(sa)*sr;
        PTS.push({
          x:sx,y:sy,
          vx:(Math.random()-0.5)*2,vy:(Math.random()-0.5)*2-0.3,
          lf:8+Math.random()*6,ml:14,
          col:Math.random()<0.5?'#ffff88':Math.random()<0.5?'#88ddff':'#ffffff',
          sz:1,gv:0,fade:0.7
        });
      }
    }
    // Электрические молнии — длинные зигзаги от Тины к пушкам
    if(t%6===0&&gunPositions){
      const g=gunPositions[Math.floor(Math.random()*gunPositions.length)];
      cx.globalAlpha=0.7+0.3*Math.random();
      cx.strokeStyle='#88ddff';cx.lineWidth=1.5;
      cx.beginPath();
      let lx=x,ly=y;
      const segs=5;
      for(let s=1;s<=segs;s++){
        const tt=s/segs;
        const tx=x+(g.muzzleX-x)*tt+(Math.random()-0.5)*8;
        const ty=y+(g.muzzleY-y)*tt+(Math.random()-0.5)*8;
        if(s===1)cx.moveTo(lx,ly);
        cx.lineTo(tx,ty);
        lx=tx;ly=ty;
      }
      cx.stroke();
      cx.lineWidth=1;cx.globalAlpha=1;
    }
    // Искры от кота — каждый кадр
    if(t%3===0){
      spPts(catX-2,catY+2,4,['#ffff44','#88ddff','#ffffff'],.6,1.8,10,0,1);
    }
    // Подёргивание
    if(catT%10===0)shake(1.5);
    // Глюк-звук от перегрыза проводов
    if(catT===20||catT===80||catT===140)bip(180+Math.random()*200,.06,.18,'square',280,140);

    // Текст «КАБЕЛИ ПЕРЕГРЫЗЕНЫ!»
    if(catT>=120&&catT<170){
      const a=Math.min(1,(catT-120)/15);
      cx.globalAlpha=a;
      txcs('КАБЕЛИ ПЕРЕГРЫЗЕНЫ!',LH/2+10,P.YEL,P.BLK,1);
      cx.globalAlpha=1;
    }
  }

  // === ФАЗА 5 (1560-1740): ВЗРЫВЫ КОРПУСА ТИНЫ (без пушек — они задвинуты) ===
  if(eT>=1560&&eT<1740){
    const expT=eT-1560;
    // ★ v24b: Взрывы — частота снижена на ~20% (%2→%3)
    if(expT%3===0){
      const ea=Math.random()*Math.PI*2;
      const er=TINA_R*(0.3+Math.random()*0.8);
      const ex=x+Math.cos(ea)*er;
      const ey=y+Math.sin(ea)*er;
      spPts(ex,ey,28,[P.YEL,'#ff8844',P.WHT,P.RED,'#ffcc44'],1.2,6.5,32,.018,3.5);
      addShockwave(ex,ey,38,P.RED,20);
      if(Math.random()<0.4)addShockwave(ex,ey,20,P.YEL,12);
      if(Math.random()<0.35)bip(120+Math.random()*180,.09,.25,'sawtooth',260,100);
    }
    // Крупный взрыв — каждые 15 кадров (было 12, -20%)
    if(expT%15===0){
      const ea2=Math.random()*Math.PI*2;
      const ex2=x+Math.cos(ea2)*TINA_R*0.6;
      const ey2=y+Math.sin(ea2)*TINA_R*0.6;
      spPts(ex2,ey2,55,[P.YEL,'#ff6600',P.WHT,'#ffcc00','#ff4422'],2.0,9.0,40,.014,4.5);
      addShockwave(ex2,ey2,70,P.RED,30);
      addShockwave(ex2,ey2,40,'#ffaa44',22);
      flash(0.15,P.RED);shake(6);
      bip(100+Math.random()*80,.12,.3,'sawtooth',200,60);
    }
    // Обломки — дальность увеличена (lf 100→180, ml 140→220)
    if(expT%3===0){
      const a=Math.random()*Math.PI*2;
      const r=TINA_R*(0.5+Math.random()*0.6);
      PTS.push({
        x:x+Math.cos(a)*r,y:y+Math.sin(a)*r,
        vx:Math.cos(a)*3.5+(Math.random()-0.5)*1.2,
        vy:Math.sin(a)*3.5+(Math.random()-0.5)*1.2,
        lf:180,ml:220,col:Math.random()<0.5?'#553322':'#882211',
        sz:2+Math.random()*3,gv:0.04,fade:0.18,
      });
    }
    // Текст
    if(expT<60){
      const a=Math.min(1,expT/10)*Math.max(0,1-expT/55);
      cx.globalAlpha=a;
      txcs('СБОЙ! ОТКАЗ СИСТЕМ!',LH/2-20,P.YEL,P.BLK,2);
      cx.globalAlpha=1;
    }
    // Тряска постоянная — усиливается
    if(expT%3===0)shake(5+expT/180*4);
  }

  // === ★ v16 r10 #3: ИНТЕГРИРОВАННАЯ СЦЕНА РАЗЛОМА ТИНЫ И ОСВОБОЖДЕНИЯ ЗВЕЗДЫ ===
  // Раньше была отдельная victory-сцена в screen-space с другой камерой/зумом — это путало.
  // Теперь всё происходит ВНУТРИ боевой камеры с её zoom — без рывков.
  // 1560-1620 (1с): краткая белая вспышка при разломе (умеренная)
  // 1620-1740 (2с): вырываются осколки наружу из тела Тины, видна звезда внутри
  // 1740-2400 (11с): осколки разлетаются, звезда продолжает расти, появляется текст
  if(eT>=1740){
    const sT=eT-1740;          // время с начала сцены звезды
    // === Спавн осколков один раз на старте ===
    if(eT===1740&&!b._fragsSpawned){
      b._fragsSpawned=true;
      b._frags=[];
      // Тело Тины — мелкие/средние осколки
      const NUM=64;
      for(let i=0;i<NUM;i++){
        const a=Math.random()*Math.PI*2;
        const sp=0.6+Math.random()*1.8;
        const isLarge=i<20;
        b._frags.push({
          x:x+Math.cos(a)*(TINA_R*0.3+Math.random()*TINA_R*0.6),
          y:y+Math.sin(a)*(TINA_R*0.3+Math.random()*TINA_R*0.6),
          vx:Math.cos(a)*sp,
          vy:Math.sin(a)*sp,
          rot:Math.random()*6,
          vr:(Math.random()-0.5)*0.15,
          sz:isLarge?(14+Math.random()*22):(6+Math.random()*8),
          col:i%5===0?P.TINA3:i%5===1?P.TINA2:i%5===2?'#441100':i%5===3?P.ORA:'#ff8844'
        });
      }
      // ★ v24b: Главный взрыв при разломе — ЭПИЧНЫЙ
      spPts(x,y,320,[P.TINA,P.TINA2,P.TINA3,P.WHT,P.ORA,'#ffff44','#ff8844'],1.5,13,160,.010,5);
      spPts(x,y,80,[P.WHT,'#ffffcc','#ffee88'],0.5,5,200,.006,2); // яркое ядро
      addShockwave(x,y,260,P.TINA3,90);
      addShockwave(x,y,190,P.WHT,70);
      addShockwave(x,y,130,'#ffaa44',55);
      addShockwave(x,y,80,P.YEL,40);
      addShockwave(x,y,35,'#ffffff',25);
    }
    // === Вспышка разлома — яркая, держится дольше ===
    if(sT<90){
      cx.globalAlpha=Math.min(0.85,sT/15)*Math.max(0,1-(sT-45)/45);
      cx.fillStyle='#ffffff';
      cx.fillRect(x-LW*4,y-LH*4,LW*8,LH*8);
      cx.globalAlpha=1;
    }
    // === ОСКОЛКИ ТИНЫ — летят и крутятся ===
    if(b._frags){
      for(const fr of b._frags){
        // Только первые 480 кадров двигаемся, потом фиксируемся (но продолжаем крутиться)
        if(sT<480){fr.x+=fr.vx;fr.y+=fr.vy;fr.vx*=.992;fr.vy*=.992;}
        fr.rot+=fr.vr;
        const alpha=Math.max(0,1-sT/720);
        if(alpha<=0)continue;
        // След искр у крупных
        if(fr.sz>14&&sT<300&&t%6===0){
          PTS.push({
            x:fr.x,y:fr.y,
            vx:-fr.vx*0.2+(Math.random()-.5)*0.3,
            vy:-fr.vy*0.2+(Math.random()-.5)*0.3,
            lf:18,ml:22,col:Math.random()<0.5?P.ORA:'#ff4422',sz:1,gv:0,fade:0.55
          });
        }
        cx.save();
        cx.translate(fr.x|0,fr.y|0);
        cx.rotate(fr.rot);
        cx.globalAlpha=alpha;
        // Тёмный контур
        rc(-fr.sz/2-1,-fr.sz/3-1,fr.sz+2,Math.max(2,fr.sz*.6)+2,'#1a0808');
        rc(-fr.sz/2,-fr.sz/3,fr.sz,Math.max(2,fr.sz*.6),fr.col);
        rc(-fr.sz/3,-fr.sz/4,fr.sz*.6,1,P.WHT);
        cx.restore();
        cx.globalAlpha=1;
      }
    }
    // === ЗВЕЗДА вырастает из центра ===
    const starGrow=Math.min(1,sT/480);   // ★ v24b: медленнее — 8 сек вместо 4
    const starR=Math.round(20+starGrow*240);
    const starA=Math.min(1,sT/40);
    const pulse=0.85+0.15*Math.sin(sT*0.07);
    const rot=sT*0.006;
    // ★ v24b: Многослойная корона — плотнее к центру
    cx.globalAlpha=starA*0.07;disc(x,y,(starR*4.5)|0,'#ff8800');
    cx.globalAlpha=starA*0.12;disc(x,y,(starR*3.2)|0,'#ffaa44');
    cx.globalAlpha=starA*0.20;disc(x,y,(starR*2.1)|0,'#ffff44');
    cx.globalAlpha=starA*0.38;disc(x,y,(starR*1.4)|0,'#ffee88');
    cx.globalAlpha=starA*0.70;disc(x,y,(starR*0.85)|0,'#ffffcc');
    cx.globalAlpha=1;         disc(x,y,(starR*0.4)|0,'#ffffff');
    cx.globalAlpha=1;
    // ★ v24b: Лучи звезды — длинные + короткие чередуются, каждый трёхслойный
    if(sT>40){
      const longN=8,baseA=Math.min(1,sT/80);
      for(let i=0;i<longN;i++){
        const a=i/longN*Math.PI*2+rot;
        const len=(starR*1.45+Math.sin(sT*0.09+i*1.3)*starR*0.18)*pulse;
        // 3 слоя длинного луча: широкое свечение → средний → тонкий яркий
        cx.globalAlpha=baseA*0.16;cx.strokeStyle='#ffcc44';cx.lineWidth=5;
        cx.beginPath();cx.moveTo(x,y);cx.lineTo((x+Math.cos(a)*len)|0,(y+Math.sin(a)*len)|0);cx.stroke();
        cx.globalAlpha=baseA*0.42;cx.strokeStyle='#ffee88';cx.lineWidth=2;
        cx.beginPath();cx.moveTo(x,y);cx.lineTo((x+Math.cos(a)*len)|0,(y+Math.sin(a)*len)|0);cx.stroke();
        cx.globalAlpha=baseA*0.82;cx.strokeStyle='#ffffff';cx.lineWidth=1;
        cx.beginPath();cx.moveTo(x,y);cx.lineTo((x+Math.cos(a)*len)|0,(y+Math.sin(a)*len)|0);cx.stroke();
        // Блик на конце длинного луча
        if(starGrow>0.25){
          cx.globalAlpha=baseA*pulse*0.65;
          disc((x+Math.cos(a)*len*0.96)|0,(y+Math.sin(a)*len*0.96)|0,2,'#ffffff');
        }
        // Короткий промежуточный луч (двухслойный)
        const aS=a+Math.PI/longN;
        const lenS=(starR*0.72+Math.sin(sT*0.11+i*1.1)*starR*0.1)*pulse;
        cx.globalAlpha=baseA*0.25;cx.strokeStyle='#ffdd66';cx.lineWidth=2;
        cx.beginPath();cx.moveTo(x,y);cx.lineTo((x+Math.cos(aS)*lenS)|0,(y+Math.sin(aS)*lenS)|0);cx.stroke();
        cx.globalAlpha=baseA*0.55;cx.strokeStyle='#ffeeaa';cx.lineWidth=1;
        cx.beginPath();cx.moveTo(x,y);cx.lineTo((x+Math.cos(aS)*lenS)|0,(y+Math.sin(aS)*lenS)|0);cx.stroke();
      }
      cx.lineWidth=1;cx.globalAlpha=1;
    }
    // Орбитальные кольца с маркёрами (тоже в мировых коорах, центр строго в (x,y))
    if(sT>120){
      const orbits=[
        {r:starR*1.6,n:8,col:'#ffaa66'},
        {r:starR*2.2,n:12,col:'#ff8844'},
        {r:starR*3.0,n:16,col:'#cc6633'}
      ];
      for(let oi=0;oi<orbits.length;oi++){
        const o=orbits[oi];
        cx.globalAlpha=Math.min(0.3,(sT-120)/120)*(0.4+0.1*Math.sin(sT*0.05+oi));
        ring(x,y,o.r|0,o.col,1);
        cx.globalAlpha=Math.min(0.7,(sT-120)/100);
        const rotSpeed=0.005-oi*0.001;
        for(let m=0;m<o.n;m++){
          const ma=m/o.n*Math.PI*2+sT*rotSpeed;
          const mx=x+Math.cos(ma)*o.r;
          const my=y+Math.sin(ma)*o.r;
          cx.fillStyle=o.col;
          cx.fillRect(mx|0,my|0,2,2);
        }
      }
      cx.globalAlpha=1;
    }
    // Искры от звезды
    if(sT>200&&t%4===0){
      const a=Math.random()*Math.PI*2;
      PTS.push({
        x:x+Math.cos(a)*starR*0.7,
        y:y+Math.sin(a)*starR*0.7,
        vx:Math.cos(a)*1.5,vy:Math.sin(a)*1.5,
        lf:30,ml:36,
        col:Math.random()<0.5?'#ffffff':'#ffee88',
        sz:1+(Math.random()<0.3?1:0),
        gv:0,fade:0.55
      });
    }
    // ★ v16 r12 #6: Восклицательный знак внутри мира убран — заменён на анимированную
    // стрелку на правой границе экрана (см. drwFinaleTina post-camera блок)
  }
}
function easeOutCube(t){t=Math.max(0,Math.min(1,t));return 1-Math.pow(1-t,3);}

function drwPirateBoss(b){const x=b.x|0,y=b.y|0,t=b.t||0;rc(x-72,y-40,144,80,'#2a0c08');rc(x-66,y-34,132,68,P.PIR2);for(let i=0;i<13;i++){const ox=-60+i*10;rc(x+ox,y-30,7,58,(i%2)?'#4a160e':'#5a1c10');}rc(x-78,y-8,16,16,P.PIR3);rc(x+62,y-8,16,16,P.PIR3);rc(x-20,y-14,40,28,'#220707');rc(x-14,y-9,28,18,'#44110c');if(t%8<4){rc(x-6,y-2,12,6,'#ffcc88');}for(let i=0;i<8;i++){const yy=y-30+i*9;rc(x-82,yy,10,4,'#77220f');rc(x+72,yy,10,4,'#77220f');}if(b.hp<b.mhp){rc(x-72,y-47,144,4,'#220000');rc(x-72,y-47,(144*(b.hp/b.mhp))|0,4,P.RED);}}
function drwEnemyBul(b){const x=b.x|0,y=b.y|0;
// ★ Танковый снаряд — крупный, медленный, с тёмным ядром и горячим центром.
if(b.kind==='bigshell'){
  cx.globalAlpha=.5;disc(x,y,5,'#220000');cx.globalAlpha=1;
  disc(x,y,3,P.PIR2);
  rc(x-1,y-1,3,3,P.PIR3);
  rc(x,y,1,1,P.YEL);
  if(Math.random()<.5)PTS.push({x:x+2,y:y+(Math.random()-.5)*2,vx:0.5+Math.random(),vy:(Math.random()-.5)*.3,lf:10,ml:14,col:'#661108',sz:1,gv:0,fade:.6});
  return;
}
// ★ Снайперский снаряд — тонкая ярко-красная игла с тянущимся шлейфом.
if(b.kind==='pierce'){
  cx.globalAlpha=.5;rc(x-1,y,8,1,P.RED);cx.globalAlpha=1;
  rc(x,y,5,1,P.YEL);
  rc(x+1,y,3,1,P.WHT);
  rc(x-2,y,1,1,P.RED);
  if(Math.random()<.7)PTS.push({x:x+4,y,vx:1+Math.random(),vy:(Math.random()-.5)*.1,lf:5,ml:7,col:P.RED,sz:1,gv:0,fade:.7});
  return;
}
if(b.kind==='meteor'){
// ★ v16 r12 #8: Метеорит — крупный неровный снаряд с тлеющим следом
const t=b.life||0;
// Тёмный кратерный фон
cx.globalAlpha=0.4;
disc(x,y,9,'#aa3322');
cx.globalAlpha=0.7;
disc(x,y,7,'#882211');
cx.globalAlpha=1;
disc(x,y,5,'#552211');
// Огненная сердцевина
const corePulse=0.7+0.3*Math.sin(t*0.3);
cx.globalAlpha=corePulse;
disc(x,y,3,P.RED);
cx.globalAlpha=1;
disc(x,y,1,P.YEL);
// Кратеры на поверхности
cx.fillStyle='#220000';
cx.fillRect(x-3,y-2,1,1);
cx.fillRect(x+2,y+1,1,1);
cx.fillRect(x-1,y+3,1,1);
return;
}if(b.kind==='laser'){const a=Math.atan2(b.vy,b.vx),len=b.reflected?18:22;cx.save();cx.translate(x,y);cx.rotate(a);cx.globalAlpha=.35;rc(-len*.55,-4,len+6,8,b.reflected?P.RED:P.TINA3);cx.globalAlpha=.9;rc(-len*.45,-1,len,3,b.reflected?P.RED:P.TINA2);rc(-len*.45,0,len,1,P.WHT);cx.globalAlpha=1;cx.restore();return;}if(b.kind==='plasma'){// Плазменный шар ТИНЫ
cx.globalAlpha=.5;disc(x,y,6,'#551100');cx.globalAlpha=1;disc(x,y,3,P.TINA3);rc(x-1,y-1,3,3,P.YEL);if(Math.random()<.7)PTS.push({x,y,vx:(Math.random()-.5)*.8,vy:(Math.random()-.5)*.8,lf:10,ml:12,col:P.TINA,sz:1,gv:0,fade:.6});return;}if(b.kind==='energyBurst'){// ★ v24b: Точечный энерговсплеск — крупный пульсирующий шар
const ep=.6+.4*Math.sin(Date.now()*.025);cx.globalAlpha=ep*.45;disc(x,y,9,'#ff6600');cx.globalAlpha=ep*.8;disc(x,y,5,P.TINA3);cx.globalAlpha=1;disc(x,y,2,'#ffff88');if(Math.random()<.8)PTS.push({x,y,vx:(Math.random()-.5)*1.2,vy:(Math.random()-.5)*1.2,lf:8,ml:11,col:Math.random()<.5?P.ORA:P.YEL,sz:1,gv:0,fade:.65});return;}if(b.kind==='spiral'){// Спиральный снаряд ТИНЫ
const pulse=.7+.3*Math.sin(Date.now()*.02);cx.globalAlpha=pulse*.8;disc(x,y,4,'#330022');cx.globalAlpha=1;disc(x,y,2,'#ff44ff');if(Math.random()<.5)PTS.push({x,y,vx:(Math.random()-.5)*.5,vy:(Math.random()-.5)*.5,lf:8,ml:10,col:'#ff44ff',sz:1,gv:0,fade:.7});return;}rc(x-2,y-1,4,2,P.PIR3);rc(x-1,y,2,1,'#ffcc88');if(Math.random()<.6)PTS.push({x:x+2,y:y,vx:0.3+Math.random(),vy:(Math.random()-.5)*.2,lf:8,ml:10,col:'#882211',sz:1,gv:0,fade:.6});}
function drwBul(b){
  const x=b.x|0,y=b.y|0;
  // ★ Phase 2.3: маркер «отскочит» — жёлто-красный ореол поверх обычного снаряда.
  //   Флаг ставится в updTinaBattle для фаз 3+ когда снаряд не пройдёт через брешь.
  if(b._danger){
    const pulse=.5+.5*Math.sin((b.t||0)*.4);
    cx.globalAlpha=.35+pulse*.35;
    cx.fillStyle=P.RED;
    cx.fillRect(x-3,y-3,9,6);
    cx.globalAlpha=.5+pulse*.4;
    cx.fillStyle=P.YEL;
    cx.fillRect(x-2,y-2,8,4);
    cx.globalAlpha=1;
  }
  // ★ Луч — растянутая зелёная полоса с белым ядром
  if(b.beam){
    cx.globalAlpha=.4;rc(x-2,y-1,12,3,P.L2L);cx.globalAlpha=.9;
    rc(x-1,y,10,1,P.L2);
    rc(x+2,y,5,1,P.WHT);
    cx.globalAlpha=1;
    return;
  }
  // ★ Ракета — крупный оранжевый снаряд с горячим хвостом
  if(b.missile){
    const ang=Math.atan2(b.vy||0,b.vx||1);
    cx.save();cx.translate(x,y);cx.rotate(ang);
    cx.globalAlpha=.4;rc(-4,-3,12,6,'#883300');cx.globalAlpha=1;
    rc(-3,-2,10,4,P.ORA);
    rc(-3,-1,2,2,P.RED);              // выхлоп
    rc(2,-1,5,2,P.YEL);                // центр
    rc(5,0,3,1,P.WHT);                 // нос
    cx.restore();
    if(Math.random()<.7)PTS.push({x:x-(b.vx>0?2:-2),y:y+(Math.random()-.5)*2,vx:-(b.vx||3)*.3,vy:(b.vy||0)*.3+(Math.random()-.5)*.4,lf:10,ml:14,col:Math.random()<.5?P.ORA:P.RED,sz:1,gv:0,fade:.6});
    return;
  }
  // ★ Spread — мелкая голубая пуля, угол по vy
  if(b.spread){
    const ang=Math.atan2(b.vy||0,b.vx||1);
    cx.save();cx.translate(x,y);cx.rotate(ang);
    cx.globalAlpha=.45;rc(-1,-2,8,4,P.L1L);cx.globalAlpha=1;
    rc(0,-1,6,2,P.L1);
    rc(2,0,3,1,P.WHT);
    cx.restore();
    return;
  }
  // Стандартные уровни лазера (без изменений)
  if(b.lv===1){cx.globalAlpha=.4;rc(x-1,y-2,9,4,P.L1L);cx.globalAlpha=1;rc(x,y-1,7,2,P.L1);rc(x+2,y,3,1,P.WHT);rc(x+6,y-1,2,2,P.L1L);}
  else if(b.lv===2){cx.globalAlpha=.35;rc(x-1,y-3,12,7,P.L2L);cx.globalAlpha=1;rc(x,y-2,9,5,P.L2);rc(x+1,y-1,7,3,P.L2L);rc(x+3,y,4,1,P.WHT);rc(x+9,y-1,2,2,P.WHT);if(Math.random()<.5)PTS.push({x,y:y+(Math.random()-.5)*4,vx:-1,vy:0,lf:6,ml:8,col:P.L2L,sz:1,gv:0,fade:.8});}
  else{cx.globalAlpha=.3;rc(x-2,y-6,19,13,P.L3L);cx.globalAlpha=1;rc(x,y-4,14,9,P.L3);rc(x+1,y-3,12,7,P.L3L);rc(x+3,y-1,8,3,P.WHT);rc(x+14,y-2,3,2,P.L3);rc(x+15,y,3,2,P.L3L);rc(x+14,y+2,3,2,P.L3);if(Math.random()<.7)PTS.push({x:x+Math.random()*8,y:y+(Math.random()-.5)*6,vx:-1-Math.random(),vy:(Math.random()-.5)*.6,lf:10,ml:14,col:Math.random()<.5?P.L3L:P.L3,sz:1,gv:0,fade:.7});}
}
function drwRes(r){const x=r.x|0,y=r.y|0,p=r.t%8;
  if(r.mat){
    cx.globalAlpha=.35+.2*Math.sin(r.t*.15);disc(x,y,4,'#44aadd');cx.globalAlpha=1;
    rc(x-1,y-2,3,4,'#44aadd');rc(x-2,y-1,5,2,'#44aadd');rc(x,y-1,1,2,'#88ddff');
    rc(x-1+(p<4?1:0),y-2,1,1,'#fff');rc(x,y+1,1,1,'#006688');
  }else{
    cx.globalAlpha=.35+.2*Math.sin(r.t*.15);disc(x,y,4,P.RES);cx.globalAlpha=1;rc(x-1,y-2,3,4,P.RES);rc(x-2,y-1,5,2,P.RES);rc(x,y-1,1,2,P.RES2);rc(x-1+(p<4?1:0),y-2,1,1,'#fff');rc(x,y+1,1,1,P.RES3);
  }
}
function drwPowerUp(pu){const x=pu.x|0,y=pu.y|0,t=pu.t;const pulse=1+.2*Math.sin(t*.2);const col=pu.type==='shield'?P.CYA:pu.type==='health'?P.HP:P.YEL;cx.globalAlpha=.3;disc(x,y,(5*pulse)|0,col);cx.globalAlpha=1;if(pu.type==='shield'){ring(x,y,4,P.CYA,1);ring(x,y,2,P.WHT,1);rc(x,y-1,1,3,P.WHT);}else if(pu.type==='health'){rc(x-1,y-3,3,7,'#880000');rc(x,y-3,1,7,P.HP);rc(x-3,y-1,7,3,'#880000');rc(x-3,y,7,1,P.HP);rc(x,y,1,1,'#fff');}else{rc(x,y-3,1,7,'#003300');rc(x-1,y-3,3,1,P.EN);rc(x-1,y-1,3,1,P.EN);rc(x-1,y+3,3,1,P.EN);rc(x,y-2,1,2,P.EN);rc(x,y,1,3,P.EN);}}

