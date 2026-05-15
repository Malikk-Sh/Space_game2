// ============================================================
// 16-scene-finale.js
// TINA boss battle (init/upd/drw), camera, victory screen, sharp-world helper
// depends on: everything above
// (originally sintara_v25.html lines 6452-8541)
// ============================================================

function updTinaBattle(G){
  const p=G.pl,F=G.finale,T=F.tina;
  if(!T||T.defeated)return;
  T.t++;if(T.reflectFlash>0)T.reflectFlash--;

  // ★ v16 r3 #5: Катсцена смены фазы — Тина пульсирует, поле очищено, через ~90 кадров переходит к новой фазе
  if(T.phaseTransition){
    T.phaseTransition.t++;
    G.buls=[];G.ebuls=[]; // никто не стреляет во время катсцены
    const pT=T.phaseTransition;
    // Усиливающийся импульс под конец
    if(pT.t===Math.floor(pT.duration*0.5)){
      // На середине катсцены — большой взрыв
      addShockwave(T.x,T.y,TINA_R,pT.toPhase===2?P.RED:P.YEL,30);
      flash(.6,pT.toPhase===2?P.RED:P.YEL);shake(8);
      spPts(T.x,T.y,50,[pT.toPhase===2?P.RED:P.YEL,P.WHT,P.ORA],1,5,40,.025,2.5);
    }
    // Орбитирующие частицы вокруг Тины во время катсцены
    if(pT.t%2===0){
      const a=Math.random()*Math.PI*2;
      const r=TINA_R+10+Math.random()*40;
      PTS.push({
        x:T.x+Math.cos(a)*r,y:T.y+Math.sin(a)*r,
        vx:-Math.cos(a)*1.2,vy:-Math.sin(a)*1.2,
        lf:25,ml:30,col:pT.toPhase===2?P.RED:P.YEL,sz:1,gv:0,fade:0.5
      });
    }
    // По завершении катсцены — переключаем фазу и запускаем брифинг пришельца
    if(pT.t>=pT.duration){
      T.phase=pT.toPhase;
      if(pT.toPhase===2){
        spawnTinaTurrets(T);
        T.subphase='2';
        T.droneCD=99999; // ★ Phase 2.3: дронов нет, пока не вошли в субфазу 2.5
        G.briefing={t:0,planet:'tina_phase2'};
        // ★ Чекпоинт: 1→2
        saveCheckpoint(G,'finale_phase_2');
      }else if(pT.toPhase===3){
        spawnTinaWeakSpots(T,1);     // ★ Phase 2.3: ОДНА брешь в начале фазы 3
        T.subphase='3';
        G.briefing={t:0,planet:'tina_phase3'};
        // ★ Чекпоинт: 2→3
        saveCheckpoint(G,'finale_phase_3');
      }else if(pT.toPhase===4){
        // ★ Phase 2.3: вход в фазу 4 — добавляем 3-ю брешь (если нет), включаем rage
        if(T.weakSpots.length<3)addTinaWeakSpot(T);
        for(const ws of T.weakSpots)ws.orbitSpd=0.013;
        T.subphase='4';
        T.droneCD=Math.min(T.droneCD,80);
        T.shootCD=Math.min(T.shootCD,40);
        G.briefing={t:0,planet:'tina_phase4'};
        // ★ Чекпоинт: 3→4
        saveCheckpoint(G,'finale_phase_4');
      }
      shake(10);flash(.5,pT.toPhase===4?'#ffaa00':pT.toPhase===2?P.RED:P.YEL);sfxBoss();
      T.phaseTransition=null;
    }
    return;
  }

  // ★ v16 r3 #9: Экстренный протокол при HP <= 5% в фазе 3 или 4
  if((T.phase===3||T.phase===4)&&!T.emergencyProtocol&&T.hp<=T.mhp*0.05&&T.hp>0){
    // ★ v16 r7: Полная переработка — 20 секунд (1200 кадров) по новой спецификации
    T.emergencyProtocol={t:0,duration:2220};
    T.chargingSweep=null;
    shake(15);flash(.6,P.RED);sfxBoss();sfxX(2);
    spPts(T.x,T.y,40,[P.RED,P.YEL,P.WHT],1,5,45,.03,2.5);
    addShockwave(T.x,T.y,80,P.RED,40);
    G.ebuls=[];G.buls=[];
    return;
  }

  // ★ v16 r3 #9: Если активен экстренный протокол — Тина неуязвима, игрок не стреляет
  if(T.emergencyProtocol){
    const eT=T.emergencyProtocol.t;
    G.buls=[];G.ebuls=[];
    // ★ v16 r12 #8: Также очищаем дронов в начале катсцены
    if(eT===1)T.drones=[];

    // ★ v24b: Нарастающая тряска — только непрерывный каждый кадр, без интервальных рывков
    // steady-state shM = val/0.20 (decay=0.80)
    if(eT>=60&&eT<540){
      const progress=(eT-60)/480;      // 0→1
      shake(0.5+progress*1.2);         // steady-state shM ≈ 2.5→8.5
    }else if(eT>=540&&eT<1020){
      const progress=(eT-540)/480;     // 0→1
      shake(1.3+progress*2.2);         // steady-state shM ≈ 6.5→17
    }
    // ★ v24b: Мгновенный удар в момент взрыва звезды — максимально эпично
    if(eT===1740){shake(40);hitStopAdd(7);flash(1.0,'#ffffff');}
    // Взрывная тряска финальной вспышки (оригинал)
    if(eT>=1560&&eT<1740&&eT%6===0)shake(2);
    // ★ v16 r11: На eT >= 2400 катсцена ЗАМОРАЖИВАЕТСЯ — игрок должен сам долететь
    // до центра звезды. Не инкрементируем больше eT.
    if(eT<2580){
      T.emergencyProtocol.t++;
    }else if(!T.emergencyProtocol.starWaiting){
      T.emergencyProtocol.starWaiting=true;
      // ★ v16 r12 #6: Инициализация трекинга для стрелки-направления
      T.emergencyProtocol.starWaitT=0;
      T.emergencyProtocol.minDist=Math.hypot(p.x-T.x,p.y-T.y);
      T.emergencyProtocol.lastImproveT=0;
      T.emergencyProtocol.hasMoved=false;
      G.notif='ЛЕТИ К ЦЕНТРУ ЗВЕЗДЫ!';G.notifT=400;G.notifCol=P.YEL;
    }
    // ★ v16 r12 #6: Обновляем трекинг прогресса игрока
    if(T.emergencyProtocol.starWaiting){
      T.emergencyProtocol.starWaitT++;
      const curDist=Math.hypot(p.x-T.x,p.y-T.y);
      if(Math.hypot(p.vx,p.vy)>0.1)T.emergencyProtocol.hasMoved=true;
      if(curDist<T.emergencyProtocol.minDist-0.5){
        T.emergencyProtocol.minDist=curDist;
        T.emergencyProtocol.lastImproveT=T.emergencyProtocol.starWaitT;
      }
    }
    // ★ v16 r11: В starWaiting НЕ делаем return — даём игроку управлять кораблём.
    if(!T.emergencyProtocol.starWaiting){
      return;
    }
  }

  // ★ Звёздная батарея: бесконечная энергия
  if(G.campaignState.inventory.starBattery){
    p.en=p.men;
  }

  // Движение ТИНЫ (медленное в фазе 1, активнее дальше)
  // ★ Phase 2.3: в субфазе 1.5 — скорость x1.2 (предчувствие фазы 2)
  if(T.phase===1){
    const sp=T.subphase==='1.5'?0.048:0.04;
    const amp=T.subphase==='1.5'?0.5:0.4;
    T.y+=Math.sin(T.t*sp)*amp;
  } else {
    T.y+=(p.y-T.y)*0.012+Math.sin(T.t*0.03)*0.5;
  }
  // ★ v16 r3: Тина дрейфует в пределах ±40px от центра, чтобы не вылезать из границ мира
  const tcy=F.hy;
  T.y=Math.max(tcy-50,Math.min(tcy+50,T.y));

  // ===== ФАЗА 1: ЭНЕРГОБЛОКИ =====
  if(T.phase===1){
    let aliveCount=0;
    for(const eb of T.energyBlocks){
      if(!eb.alive)continue;
      aliveCount++;
      eb.t++;
      eb.orbitA+=0.014;
      eb.x=T.x+Math.cos(eb.orbitA)*eb.orbitR;
      eb.y=T.y+Math.sin(eb.orbitA)*eb.orbitR;
      eb.flash*=0.7;
    }
    // Игрок попадает по энергоблокам
    for(let j=G.buls.length-1;j>=0;j--){
      const b=G.buls[j];
      let hit=false;
      for(const eb of T.energyBlocks){
        if(!eb.alive)continue;
        // ★ v16 r3: Хит-бокс энергоблока крупнее (под новый размер)
        if(Math.abs(b.x-eb.x)<18&&Math.abs(b.y-eb.y)<18){
          eb.hp-=b.dmg;eb.flash=1;
          spPts(b.x,b.y,5,[P.CYA,P.WHT,P.YEL],.4,2,12);
          sfxHit();G.buls.splice(j,1);
          if(eb.hp<=0){
            eb.alive=false;
            spPts(eb.x,eb.y,22,[P.CYA,P.YEL,P.WHT,P.L1L],.7,3.5,30,.02,2);
            addShockwave(eb.x,eb.y,24,P.CYA,18);
            sfxX(1.2);shake(5);flash(.4,P.CYA);
            // ★ v16 r10 #2: Награда за энергоблок убрана (как и за турели)
            const remain=T.energyBlocks.filter(e=>e.alive).length;
            if(remain===0){
              // ★ v16 r3 #5: Кинематик-катсцена перехода в фазу 2
              T.phaseTransition={t:0,toPhase:2,duration:120};
              G.ebuls=[];G.buls=[]; // очищаем поле
              shake(15);flash(.9,P.RED);sfxBoss();sfxX(1.5);
              // Множественные взрывы по всему щиту — щит рушится
              for(let exp=0;exp<8;exp++){
                setTimeout(()=>{
                  const a=Math.random()*Math.PI*2;
                  const r=TINA_SHIELD_R-10+Math.random()*20;
                  const ex=T.x+Math.cos(a)*r,ey=T.y+Math.sin(a)*r;
                  spPts(ex,ey,12,[P.CYA,P.WHT,'#88ccff'],.6,3,18,.02,2);
                  addShockwave(ex,ey,18,P.CYA,15);
                  shake(3);
                },exp*60);
              }
            }else{
              G.notif='ЭНЕРГОБЛОК СЛОМАН! ОСТАЛОСЬ '+remain;
              G.notifT=120;G.notifCol=P.CYA;
            }
          }
          hit=true;break;
        }
      }
      if(hit)continue;
      // ★ v16 r8 #3: Снаряды отражаются от ЩИТА Тины (радиус TINA_SHIELD_R=213)
      // — раньше пропадали только при попадании в тело (<144), что выглядело как "проход насквозь"
      const dist=Math.hypot(b.x-T.x,b.y-T.y);
      if(dist<TINA_SHIELD_R){
        // Эффект отскока на щите: яркая вспышка + кольцо ряби
        spPts(b.x,b.y,5,[P.CYA,P.WHT,'#88ccff'],.4,2,12);
        addShockwave(b.x,b.y,8,P.CYA,8);
        if(G.sT%30===0)fText(T.x-200,T.y,'ЭНЕРГОЩИТ - НЕУЯЗВИМ!',P.CYA);
        G.buls.splice(j,1);
      }
    }
    // ★ Phase 2.3: вход в субфазу 1.5 — когда уничтожено 2 из 3 блоков
    const aliveCountForSub=T.energyBlocks.filter(e=>e.alive).length;
    if(aliveCountForSub===1&&T.subphase==='1'&&!T._subphaseTriggered['1.5']){
      T._subphaseTriggered['1.5']=true;
      T.subphase='1.5';
      G.notif='ТИНА УСКОРЯЕТСЯ! ОСТАЛСЯ 1 БЛОК!';G.notifT=120;G.notifCol=P.ORA;
      flash(.3,P.ORA);shake(4);
    }
    // Тина обстреливает — 3 паттерна (4 в субфазе 1.5 — добавляется спираль)
    T.shootCD--;
    if(T.shootCD<=0){
      const angle=Math.atan2(p.y-T.y,p.x-T.x);
      const blocksAlive=T.energyBlocks.filter(e=>e.alive).length;
      // В субфазе 1.5 — 4 паттерна (добавлен 3 = спиральный залп)
      const patCount=T.subphase==='1.5'?4:3;
      const pat=T.attackPattern%patCount;
      if(pat===0){
        // Отслеживающий лазер
        G.ebuls.push({x:T.x-50,y:T.y,vx:Math.cos(angle)*2.6,vy:Math.sin(angle)*2.6,isTina:true,kind:'laser',dmg:10,tracking:true,target:p});
        bip(130,.15,.16,'sawtooth',180,80);addShockwave(T.x-50,T.y,10,P.TINA2,6);
      }else if(pat===1){
        // ★ v24b: Энерговсплеск — 5 шаров веером
        for(let i=0;i<5;i++){
          const a=angle+(i-2)*0.24;
          G.ebuls.push({x:T.x-80,y:T.y,vx:Math.cos(a)*2.1,vy:Math.sin(a)*2.1,isTina:true,kind:'energyBurst',dmg:14});
        }
        bip(160,.2,.2,'sawtooth',220,100);flash(.15,P.TINA3);addShockwave(T.x-80,T.y,14,P.TINA3,8);
      }else if(pat===2){
        // ★ v24b: Двойной лазер с двух точек
        for(let i=-1;i<=1;i+=2){
          G.ebuls.push({x:T.x-50,y:T.y+i*35,vx:Math.cos(angle)*3.1,vy:Math.sin(angle)*3.1,isTina:true,kind:'laser',dmg:11});
        }
        bip(150,.12,.15,'sawtooth',200,90);addShockwave(T.x-50,T.y,10,P.TINA2,6);
      }else{
        // ★ Phase 2.3 / субфаза 1.5: спиральный залп — 6 снарядов по кругу
        for(let i=0;i<6;i++){
          const sa=i/6*Math.PI*2+T.t*0.025;
          G.ebuls.push({x:T.x+Math.cos(sa)*60,y:T.y+Math.sin(sa)*60,vx:Math.cos(sa)*2.0,vy:Math.sin(sa)*2.0,isTina:true,kind:'spiral',dmg:8,lifeMax:80});
        }
        bip(110,.18,.2,'sawtooth',150,70);shake(3);addShockwave(T.x,T.y,18,P.PUR,12);
      }
      T.attackPattern++;
      T.shootCD=blocksAlive===3?100:blocksAlive===2?75:T.subphase==='1.5'?45:55;
    }
  }

  // ===== ФАЗА 2: ТУРЕЛИ + ПРЯМОЙ УРОН =====
  if(T.phase===2){
    // Турели орбитируют и стреляют
    for(const tr of T.turrets){
      if(!tr.alive)continue;
      tr.t++;
      tr.orbitA+=0.018;
      tr.x=T.x+Math.cos(tr.orbitA)*tr.orbitR;
      tr.y=T.y+Math.sin(tr.orbitA)*tr.orbitR;
      tr.flash*=0.7;
      tr.shootCD--;
      if(tr.shootCD<=0&&tr.x<LW-15){
        const angle=Math.atan2(p.y-tr.y,p.x-tr.x);tr.aim=angle;
        G.ebuls.push({x:tr.x,y:tr.y,vx:Math.cos(angle)*2.8,vy:Math.sin(angle)*2.8,isTina:true,fromTurret:true});
        tr.shootCD=80+Math.random()*40;
        bip(280,.07,.12,'square',350,180);
      }
    }
    // Игрок попадает по турелям и Тине
    for(let i=G.buls.length-1;i>=0;i--){
      const b=G.buls[i];
      let hit=false;
      for(const tr of T.turrets){
        if(!tr.alive)continue;
        // ★ v16 r3: Турель крупнее
        if(Math.abs(b.x-tr.x)<14&&Math.abs(b.y-tr.y)<14){
          tr.hp-=b.dmg;tr.flash=1;
          spPts(b.x,b.y,4,[P.PIR3,P.YEL,P.WHT],.4,2,10);
          sfxHit();G.buls.splice(i,1);
          if(tr.hp<=0){
            tr.alive=false;
            spPts(tr.x,tr.y,14,[P.PIR3,P.ORA,P.WHT],.6,3,20,.03);
            addShockwave(tr.x,tr.y,18,P.ORA);
            sfxX(.7);shake(2);flash(.15,P.ORA);
            // ★ v16 r7: Награда за турель убрана — деньги уже не нужны на этом этапе
          }
          hit=true;break;
        }
      }
      if(hit)continue;
      const dist=Math.hypot(b.x-T.x,b.y-T.y);
      if(dist<165){    // ★ v16 r3: 55*3
        T.hp-=b.dmg;
        G.buls.splice(i,1);
        spPts(b.x,b.y,8,[P.TINA3,P.TINA,P.WHT],.5,2.5,14,.02);
        sfxHit();
        if(T.hp<=T.mhp*0.50&&T.phase===2){
          // ★ v16 r3 #5: Кинематик-катсцена перехода в фазу 3
          T.phaseTransition={t:0,toPhase:3,duration:120};
          G.ebuls=[];G.buls=[]; // очищаем поле
          shake(15);flash(.9,P.YEL);sfxBoss();sfxX(2);
          // Турели взрываются по очереди (если ещё живы)
          let trIdx=0;
          for(const tr of T.turrets){
            if(!tr.alive)continue;
            setTimeout(()=>{
              spPts(tr.x,tr.y,18,[P.RED,P.YEL,P.WHT,P.ORA],.7,3.5,22,.03,1.8);
              addShockwave(tr.x,tr.y,22,P.YEL,18);
              shake(4);
            },trIdx*120);
            tr.alive=false;
            trIdx++;
          }
        }
        if(T.hp<=0){T.hp=0;tinaDie(G);return;}
      }
    }
    T.shootCD--;
    if(T.shootCD<=0){
      const baseAngle=Math.atan2(p.y-T.y,p.x-T.x);
      const pat=T.attackPattern%6;
      if(pat===0){
        // ПАТТЕРН A: тройной залп лазерами
        const spread=3;
        for(let i=0;i<spread;i++){
          const angle=baseAngle+(i-(spread-1)/2)*0.22;
          G.ebuls.push({x:T.x-186,y:T.y,vx:Math.cos(angle)*3.6,vy:Math.sin(angle)*3.6,isTina:true,kind:'laser',dmg:14});
        }
        bip(120,.14,.18,'sawtooth',170,80);addShockwave(T.x-186,T.y,8,P.TINA2,5);
      }else if(pat===1){
        // ПАТТЕРН B: широкий веер плазменных снарядов
        const fanCount=7;
        for(let i=0;i<fanCount;i++){
          const angle=baseAngle+(i-(fanCount-1)/2)*0.18;
          G.ebuls.push({x:T.x-186,y:T.y,vx:Math.cos(angle)*2.4,vy:Math.sin(angle)*2.4,isTina:true,kind:'plasma',dmg:10});
        }
        bip(180,.18,.2,'square',240,120);flash(.15,P.TINA3);addShockwave(T.x-186,T.y,12,P.TINA3,8);
      }else if(pat===2){
        // ПАТТЕРН C: тяжёлый метеорит
        G.ebuls.push({x:T.x-186,y:T.y,vx:Math.cos(baseAngle)*1.5,vy:Math.sin(baseAngle)*1.5,isTina:true,kind:'meteor',dmg:24,isHeavy:true,life:0});
        bip(60,.5,.35,'sawtooth',90,40);flash(.25,P.RED);shake(2);addShockwave(T.x-186,T.y,18,P.RED,12);
      }else if(pat===3){
        // ПАТТЕРН D: спиральный залп
        for(let i=0;i<8;i++){
          const sa=i/8*Math.PI*2+T.t*0.02;
          G.ebuls.push({x:T.x+Math.cos(sa)*100,y:T.y+Math.sin(sa)*100,vx:Math.cos(sa)*2.2,vy:Math.sin(sa)*2.2,isTina:true,kind:'spiral',dmg:9,lifeMax:80});
        }
        bip(90,.2,.2,'sawtooth',120,60);shake(3);
      }else if(pat===4){
        // ★ v24b: ПАТТЕРН E: СХОДЯЩАЯСЯ АТАКА — 3 дрона летят к текущей позиции игрока
        if(!T.chargeDrones||T.chargeDrones.length===0){
          T.chargeDrones=[];
          for(let i=0;i<3;i++){
            const a=i/3*Math.PI*2;
            T.chargeDrones.push({x:T.x+Math.cos(a)*200,y:T.y+Math.sin(a)*200,vx:0,vy:0,t:0,hp:15,mhp:15,flash:0});
          }
          bip(80,.4,.3,'sawtooth',120,50);flash(.2,P.PUR);shake(3);
        }
      }else{
        // ★ v24b: ПАТТЕРН F: ДВИЖУЩИЙСЯ ЛУЧА — горизонтальная полоса
        if(!T.sweepBeam){
          const startY=T.y+(Math.random()<0.5?-130:130);
          T.sweepBeam={y:startY,vy:startY>T.y?-0.9:0.9,h:30,t:0,active:false,done:false};
          bip(100,.6,.35,'sawtooth',140,60);
        }
      }
      T.attackPattern++;
      T.shootCD=70+(pat===2?50:pat===4||pat===5?40:0);
    }
    // ★ Phase 2.3: переход 2 → 2.5 — когда суммарное HP турелей <= 50%
    if(T.subphase==='2'){
      let trHp=0,trMax=0;
      for(const tr of T.turrets){if(tr.alive){trHp+=tr.hp;}trMax+=tr.maxHp;}
      if(trMax>0&&trHp/trMax<=0.5&&!T._subphaseTriggered['2.5']){
        T._subphaseTriggered['2.5']=true;
        T.subphase='2.5';
        T.droneCD=60; // запускаем спавн дронов почти сразу
        G.notif='ТИНА ПРИЗЫВАЕТ ДРОНОВ!';G.notifT=120;G.notifCol=P.PUR;
        flash(.3,P.PUR);shake(4);
      }
    }
    // ★ Phase 2.3: дроны спавнятся ТОЛЬКО в субфазе 2.5+
    if(T.subphase==='2.5'){
      T.droneCD--;
      if(T.droneCD<=0&&T.drones.length<3){
        const ang=Math.random()*Math.PI*2;
        const sx=T.x+Math.cos(ang)*(TINA_R+10);
        const sy=T.y+Math.sin(ang)*(TINA_R+10);
        T.drones.push({
          x:sx,y:sy,vx:0,vy:0,
          hp:18,mhp:18,t:0,flash:0,
          cd:60+Math.floor(Math.random()*30)
        });
        spPts(sx,sy,12,[P.TINA3,P.YEL,P.WHT],.5,2.5,16,0,1.4);
        addShockwave(sx,sy,10,P.TINA2,8);
        bip(280,.15,.15,'square',360,180);
        T.droneCD=300;
      }
    }
  }

  // ===== ФАЗА 3 + 4: БРЕШИ В ЩИТЕ — стрелять надо через них =====
  if(T.phase===3||T.phase===4){
    // Обновление вращения брешей
    for(const ws of T.weakSpots){
      ws.t++;
      ws.orbitA+=ws.orbitSpd;
    }
    // ★ Phase 2.3: каждый кадр прогнозируем, попадёт ли пуля в брешь, и маркируем b._danger.
    //   Используется в drwBul: пули, которые отскочат, рисуются жёлто-красными — игрок видит риск.
    const _sR=TINA_R+18;
    for(const b of G.buls){
      const _dx=b.x-T.x,_dy=b.y-T.y;
      const _dist=Math.hypot(_dx,_dy);
      if(_dist>_sR+2&&_dist<_sR+120){
        // Прогноз: за ~6 кадров куда летит снаряд → угол к центру Тины
        const fx=b.x+(b.vx||0)*6,fy=b.y+(b.vy||0)*6;
        const fa=Math.atan2(fy-T.y,fx-T.x);
        let inB=false;
        for(const ws of T.weakSpots){
          let diff=fa-ws.orbitA;
          while(diff>Math.PI)diff-=Math.PI*2;
          while(diff<-Math.PI)diff+=Math.PI*2;
          if(Math.abs(diff)<ws.arcWidth){inB=true;break;}
        }
        b._danger=!inB;
      } else {
        b._danger=false;
      }
    }
    // Снаряды игрока vs щит и бреши
    for(let i=G.buls.length-1;i>=0;i--){
      const b=G.buls[i];
      const dx=b.x-T.x,dy=b.y-T.y;
      const dist=Math.hypot(dx,dy);
      // ★ v16 r4 #1: Если снаряд внутри тела Тины — попадание
      if(dist<TINA_R){
        T.hp-=b.dmg*2;
        G.buls.splice(i,1);
        spPts(b.x,b.y,14,[P.YEL,P.GRN,P.WHT,P.L1],.7,3,20,.02,1.6);
        addShockwave(b.x,b.y,14,P.YEL,12);
        sfxX(.5);shake(3);flash(.25,P.YEL);
        fText(b.x,b.y-12,'ПРОБИТО! x2',P.YEL);
        p.cr+=10;
        if(T.hp<=0){T.hp=0;tinaDie(G);return;}
        // ★ Phase 2.3: переход 3 → 3.5 при HP < 30% — добавляется ВТОРАЯ брешь, бреши ускоряются до 0.010
        if(T.hp<=T.mhp*0.30&&T.subphase==='3'&&!T._subphaseTriggered['3.5']){
          T._subphaseTriggered['3.5']=true;
          T.subphase='3.5';
          if(T.weakSpots.length<2)addTinaWeakSpot(T);
          for(const ws of T.weakSpots)ws.orbitSpd=0.010;
          G.notif='ВТОРАЯ БРЕШЬ! БРЕШИ УСКОРЯЮТСЯ!';G.notifT=140;G.notifCol=P.YEL;
          flash(.4,P.YEL);shake(6);sfxBoss();
        }
        // ★ Phase 2.3: переход 3.5 → 4 при HP < 15% (раньше было 25%)
        if(T.hp<=T.mhp*0.15&&T.phase===3&&!T.phase4entered&&!T.phaseTransition){
          T.phase4entered=true;
          T.phaseTransition={t:0,toPhase:4,duration:120};
          G.ebuls=[];G.buls=[];shake(18);flash(.9,'#ffaa00');sfxBoss();sfxX(2.5);
        }
        continue;
      }
      // Снаряд за пределами щита — пропускаем
      const sR=TINA_R+18;
      if(dist>sR+5)continue;
      // Снаряд на радиусе щита: проверяем угол — попадает ли в брешь
      const ba=Math.atan2(dy,dx);
      let inBreach=false;
      for(const ws of T.weakSpots){
        let diff=ba-ws.orbitA;
        while(diff>Math.PI)diff-=Math.PI*2;
        while(diff<-Math.PI)diff+=Math.PI*2;
        if(Math.abs(diff)<ws.arcWidth){inBreach=true;break;}
      }
      if(inBreach){
        // Снаряд проходит через брешь — летит дальше до тела (на следующих кадрах попадёт в Тину)
        // Эффект "проход через брешь"
        if(b.t!==undefined){b.t++;}
        if(G.sT%4===0)spPts(b.x,b.y,2,[P.YEL,P.WHT],.3,1,8);
        continue;
      }
      // Снаряд бьёт по щиту — отражение
      const refAngle=Math.atan2(p.y-b.y,p.x-b.x);T.reflectFlash=14;
      G.ebuls.push({
        x:b.x,y:b.y,
        vx:Math.cos(refAngle)*4.8,
        vy:Math.sin(refAngle)*4.8,
        isTina:true,reflected:true,kind:'reflected',dmg:18,
      });
      spPts(b.x,b.y,8,[P.RED,P.WHT,P.TINA2],.5,2.5,14);
      addShockwave(b.x,b.y,10,P.RED,10);
      sfxHit();shake(1.5);flash(.15,P.RED);
      if(G.sT%20===0)fText(b.x,b.y-10,'ЦЕЛЬСЯ В БРЕШИ!',P.RED);
      G.buls.splice(i,1);
    }
    // ★ v16 r12 #8: ТАКТИЧЕСКИЕ АТАКИ ФАЗЫ 3 — циклически + развёрточный лазер
    T.shootCD--;
    if(T.shootCD<=0&&!T.chargingSweep){
      const angle=Math.atan2(p.y-T.y,p.x-T.x);
      const pat=T.attackPattern%4;
      if(pat===0){
        // Тройной залп лазерами
        for(let i=0;i<3;i++){
          const a=angle+(i-1)*0.18;
          G.ebuls.push({x:T.x-186,y:T.y,vx:Math.cos(a)*3.6,vy:Math.sin(a)*3.6,isTina:true,kind:'laser',dmg:15});
        }
        bip(140,.1,.15,'sawtooth',190,85);
      }else if(pat===1){
        // Развёрточный лазер — заряжается 60 кадров, потом выпускает на 60 кадров
        T.chargingSweep={t:0,duration:60,fireDuration:60,startAngle:angle-0.5,endAngle:angle+0.5};
        
        bip(60,.6,.4,'sawtooth',90,35);
      }else if(pat===2){
        // Спиральный залп (как раньше)
        for(let i=0;i<6;i++){
          const sa=i/6*Math.PI*2+T.t*0.02;
          G.ebuls.push({x:T.x+Math.cos(sa)*100,y:T.y+Math.sin(sa)*100,vx:Math.cos(sa)*2.2,vy:Math.sin(sa)*2.2,isTina:true,kind:'spiral',dmg:9,lifeMax:55});
        }
        shake(4);bip(90,.2,.2,'sawtooth',120,60);
      }else{
        // Тяжёлый метеорит
        G.ebuls.push({
          x:T.x-186,y:T.y,
          vx:Math.cos(angle)*1.5,vy:Math.sin(angle)*1.5,
          isTina:true,kind:'meteor',dmg:20,isHeavy:true,life:0
        });
        bip(60,.5,.35,'sawtooth',90,40);flash(.2,P.RED);shake(2);
      }
      T.attackPattern++;
      T.shootCD=85;
    }
    // ★ v16 r12 #8: Развёрточный лазер — заряжание + выпуск
    if(T.chargingSweep){
      T.chargingSweep.t++;
      const cs=T.chargingSweep;
      if(cs.t===cs.duration){
        // Начинается выпуск — спавним 12 быстрых лазеров через равные интервалы
        bip(180,.3,.25,'sawtooth',280,100);
        flash(.4,P.RED);shake(8);
      }
      if(cs.t>=cs.duration&&cs.t<=cs.duration+cs.fireDuration){
        const sweepProgress=(cs.t-cs.duration)/cs.fireDuration;
        const sweepAngle=cs.startAngle+(cs.endAngle-cs.startAngle)*sweepProgress;
        // Выпускаем 1 лазер каждые 5 кадров
        if((cs.t-cs.duration)%5===0){
          G.ebuls.push({
            x:T.x-186,y:T.y,
            vx:Math.cos(sweepAngle)*4.4,vy:Math.sin(sweepAngle)*4.4,
            isTina:true,kind:'laser',dmg:13
          });
        }
      }
      if(cs.t>cs.duration+cs.fireDuration){
        T.chargingSweep=null;
      }
    }
    // ★ v16 r12 #8: Призыв дронов (фаза 3 — больше дронов)
    T.droneCD--;
    if(T.droneCD<=0&&T.drones.length<4){
      const ang=Math.random()*Math.PI*2;
      const sx=T.x+Math.cos(ang)*(TINA_R+10);
      const sy=T.y+Math.sin(ang)*(TINA_R+10);
      T.drones.push({
        x:sx,y:sy,vx:0,vy:0,
        hp:18,mhp:18,t:0,flash:0,
        cd:60+Math.floor(Math.random()*30)
      });
      spPts(sx,sy,12,[P.TINA3,P.YEL,P.WHT],.5,2.5,16,0,1.4);
      addShockwave(sx,sy,10,P.TINA2,8);
      bip(280,.15,.15,'square',360,180);
      T.droneCD=240;
    }
  }

  // ===== ★ v24b: ФАЗА 4 — РЕЖИМ ЯРОСТИ =====
  // Те же бреши что в фазе 3, но быстрее + новые атаки
  if(T.phase===4){
    // Бреши обновляются (как фаза 3)
    for(const ws of T.weakSpots){ws.t++;ws.orbitA+=ws.orbitSpd;}
    // chargingSweep (как фаза 3)
    if(T.chargingSweep){
      T.chargingSweep.t++;const cs=T.chargingSweep;
      if(cs.t===cs.duration){bip(180,.3,.25,'sawtooth',280,100);flash(.4,P.RED);shake(8);}
      if(cs.t>=cs.duration&&cs.t<=cs.duration+cs.fireDuration){
        const sp=(cs.t-cs.duration)/cs.fireDuration;
        const sa=cs.startAngle+(cs.endAngle-cs.startAngle)*sp;
        if((cs.t-cs.duration)%4===0)G.ebuls.push({x:T.x-186,y:T.y,vx:Math.cos(sa)*5.0,vy:Math.sin(sa)*5.0,isTina:true,kind:'laser',dmg:15});
      }
      if(cs.t>cs.duration+cs.fireDuration)T.chargingSweep=null;
    }
    // Атаки фазы 4 — 5 паттернов (как фаза 3 + rageVolley)
    T.shootCD--;
    if(T.shootCD<=0&&!T.chargingSweep){
      const angle=Math.atan2(p.y-T.y,p.x-T.x);
      const pat=T.attackPattern%5;
      if(pat===0){
        for(let i=0;i<3;i++){const a=angle+(i-1)*0.18;G.ebuls.push({x:T.x-186,y:T.y,vx:Math.cos(a)*4.0,vy:Math.sin(a)*4.0,isTina:true,kind:'laser',dmg:15});}
        bip(140,.1,.15,'sawtooth',190,85);
      }else if(pat===1){
        T.chargingSweep={t:0,duration:50,fireDuration:70,startAngle:angle-0.6,endAngle:angle+0.6};
        bip(60,.6,.4,'sawtooth',90,35);
      }else if(pat===2){
        for(let i=0;i<6;i++){const sa=i/6*Math.PI*2+T.t*0.03;G.ebuls.push({x:T.x+Math.cos(sa)*100,y:T.y+Math.sin(sa)*100,vx:Math.cos(sa)*2.8,vy:Math.sin(sa)*2.8,isTina:true,kind:'spiral',dmg:11,lifeMax:55});}
        shake(4);bip(90,.2,.2,'sawtooth',120,60);
      }else if(pat===3){
        G.ebuls.push({x:T.x-186,y:T.y,vx:Math.cos(angle)*1.6,vy:Math.sin(angle)*1.6,isTina:true,kind:'meteor',dmg:22,isHeavy:true,life:0});
        bip(60,.5,.35,'sawtooth',90,40);flash(.2,P.RED);shake(2);
      }else{
        // ★ v24b: ПАТТЕРН ЯРОСТЬ — 8 точечных всплесков быстро подряд
        for(let i=0;i<8;i++){
          const a=angle+(i-3.5)*0.14;
          G.ebuls.push({x:T.x-100,y:T.y+(i-3.5)*20,vx:Math.cos(a)*3.4,vy:Math.sin(a)*3.4,isTina:true,kind:'energyBurst',dmg:12});
        }
        flash(.2,P.RED);shake(4);bip(200,.12,.2,'sawtooth',280,120);
      }
      T.attackPattern++;T.shootCD=60+(pat===1?30:pat===3?40:0);
    }
    // Дроны (до 5 в фазе 4)
    T.droneCD--;
    if(T.droneCD<=0&&T.drones.length<5){
      const ang=Math.random()*Math.PI*2;const sx=T.x+Math.cos(ang)*(TINA_R+10);const sy=T.y+Math.sin(ang)*(TINA_R+10);
      T.drones.push({x:sx,y:sy,vx:0,vy:0,hp:18,mhp:18,t:0,flash:0,cd:50+Math.floor(Math.random()*25)});
      spPts(sx,sy,12,[P.TINA3,P.YEL,P.WHT],.5,2.5,16,0,1.4);addShockwave(sx,sy,10,P.TINA2,8);bip(280,.15,.15,'square',360,180);T.droneCD=180;
    }
  }

  // ★ v24b: Сходящиеся дроны — обновление
  if(T.chargeDrones&&T.chargeDrones.length){
    let allClose=true;
    for(let i=T.chargeDrones.length-1;i>=0;i--){
      const cd=T.chargeDrones[i];cd.t++;if(cd.flash>0)cd.flash--;
      // ★ v24b: Дроны летят к ТЕКУЩЕЙ позиции игрока каждый кадр
      const tdx=p.x-cd.x,tdy=p.y-cd.y,td=Math.hypot(tdx,tdy)||1;
      cd.vx+=tdx/td*0.18;cd.vy+=tdy/td*0.18;cd.vx*=0.93;cd.vy*=0.93;
      const ms=Math.hypot(cd.vx,cd.vy);if(ms>3.0){cd.vx=cd.vx/ms*3.0;cd.vy=cd.vy/ms*3.0;}
      cd.x+=cd.vx;cd.y+=cd.vy;
      if(td>35)allClose=false;
      for(let j=G.buls.length-1;j>=0;j--){
        const b=G.buls[j];
        if(Math.hypot(b.x-cd.x,b.y-cd.y)<12){cd.hp-=b.dmg;cd.flash=4;spPts(b.x,b.y,5,[P.PUR,P.WHT,P.YEL],.3,2,10);G.buls.splice(j,1);}
      }
      if(cd.hp<=0){spPts(cd.x,cd.y,14,[P.PUR,P.WHT,P.YEL],.7,3,20,.02,1.8);addShockwave(cd.x,cd.y,18,P.PUR,14);T.chargeDrones.splice(i,1);}
    }
    if(allClose&&T.chargeDrones.length===3){
      // Взрыв на позиции игрока
      const cx_=p.x,cy_=p.y;
      spPts(cx_,cy_,70,[P.PUR,P.WHT,P.YEL,'#aa44ff'],1.5,9,38,.013,4);
      addShockwave(cx_,cy_,80,P.PUR,40);addShockwave(cx_,cy_,45,'#aa44ff',28);
      if(p.inv<=0&&Math.hypot(p.x-cx_,p.y-cy_)<55){
        if(p.shield>0){p.shield=Math.max(0,p.shield-350);p.inv=20;sfxShield();flash(.3,P.CYA);}
        else{const dmg=30;p.hp-=dmg;p.inv=45;shake(10);flash(.6,P.PUR);sfxHit();G.combo=0;fText(p.x,p.y-12,'-'+dmg+'HP',P.RED);}
      }
      flash(.35,P.PUR);shake(10);bip(60,.6,.4,'sawtooth',100,40);T.chargeDrones=[];
    }
    if(T.chargeDrones.length&&T.chargeDrones[0].t>320)T.chargeDrones=[];
  }

  // ★ v24b: Движущийся луч — обновление
  if(T.sweepBeam&&!T.sweepBeam.done){
    const sb=T.sweepBeam;sb.t++;sb.y+=sb.vy;
    if(sb.t>60&&!sb.active)sb.active=true;
    if(sb.active){
      if(p.inv<=0&&Math.abs(p.y-sb.y)<sb.h/2){
        if(p.shield>0){p.shield=Math.max(0,p.shield-160);p.inv=15;sfxShield();flash(.2,P.CYA);}
        else{const dmg=20;p.hp-=dmg;p.inv=30;shake(5);flash(.4,P.HP);sfxHit();G.combo=0;fText(p.x,p.y-12,'-'+dmg+'HP',P.RED);}
      }
      if(G.sT%2===0){
        const wb=F.worldBounds;
        PTS.push({x:wb.minX+Math.random()*(wb.maxX-wb.minX),y:sb.y+(Math.random()-.5)*sb.h,vx:(Math.random()-.5)*2,vy:(Math.random()-.5)*2,lf:14,ml:18,col:Math.random()<.5?'#ff4422':'#ffaa44',sz:1,gv:0,fade:0.6});
      }
    }
    const wb2=F.worldBounds;
    if(sb.t>220||sb.y<wb2.minY-50||sb.y>wb2.maxY+50)T.sweepBeam=null;
  }

  // ★ v16 r12 #8: Метеорит — медленный, при попадании в игрока ИЛИ выходе за границу взрывается шрапнелью
  for(let i=G.ebuls.length-1;i>=0;i--){
    const b=G.ebuls[i];
    if(!b.isTina||b.kind!=='meteor')continue;
    b.life=(b.life||0)+1;
    // Дым/пар сзади
    if(G.sT%3===0){
      PTS.push({
        x:b.x+(Math.random()-0.5)*4,y:b.y+(Math.random()-0.5)*4,
        vx:-b.vx*0.3+(Math.random()-0.5)*0.5,vy:-b.vy*0.3+(Math.random()-0.5)*0.5,
        lf:18,ml:24,col:Math.random()<0.5?'#aa3322':'#552211',sz:2,gv:0,fade:0.4
      });
    }
    // Взрыв при попадании в игрока ИЛИ через 200 кадров жизни
    const distToP=Math.hypot(p.x-b.x,p.y-b.y);
    const wb=G.finale.worldBounds;
    const oob=wb&&(b.x<wb.minX-20||b.x>wb.maxX+20||b.y<wb.minY-20||b.y>wb.maxY+20);
    if(distToP<14||b.life>240||oob){
      // Шрапнель — 8 быстрых снарядов в стороны
      for(let s=0;s<8;s++){
        const sa=s/8*Math.PI*2;
        G.ebuls.push({
          x:b.x,y:b.y,
          vx:Math.cos(sa)*3.0,vy:Math.sin(sa)*3.0,
          isTina:true,kind:'plasma',dmg:7
        });
      }
      spPts(b.x,b.y,30,[P.RED,P.YEL,P.WHT,P.ORA],.9,4,28,.025,2.4);
      addShockwave(b.x,b.y,30,P.RED,18);
      flash(.3,P.YEL);shake(5);
      bip(70,.4,.3,'sawtooth',100,40);
      G.ebuls.splice(i,1);
    }
  }

  // ★ v16 r12 #8: Обновление и атаки ДРОНОВ
  if(T.drones&&T.drones.length){
    for(let i=T.drones.length-1;i>=0;i--){
      const d=T.drones[i];
      d.t++;
      if(d.flash>0)d.flash--;
      // Движение: преследуют игрока с плавным ускорением
      const dx=p.x-d.x,dy=p.y-d.y;
      const dd=Math.hypot(dx,dy)||1;
      const desiredDist=140;
      // Если далеко — приближаются, если близко — держат дистанцию (с лёгким орбитированием)
      if(dd>desiredDist){
        d.vx+=dx/dd*0.08;d.vy+=dy/dd*0.08;
      }else{
        // Орбитальное движение
        const orbitA=Math.atan2(dy,dx)+Math.PI/2;
        d.vx+=Math.cos(orbitA)*0.08;d.vy+=Math.sin(orbitA)*0.08;
        // Лёгкий repel
        d.vx-=dx/dd*0.02;d.vy-=dy/dd*0.02;
      }
      // Демпфирование
      d.vx*=0.96;d.vy*=0.96;
      const ms=Math.hypot(d.vx,d.vy);
      if(ms>2.0){d.vx=d.vx/ms*2.0;d.vy=d.vy/ms*2.0;}
      d.x+=d.vx;d.y+=d.vy;
      // Стрельба по игроку
      d.cd--;
      if(d.cd<=0){
        const a=Math.atan2(p.y-d.y,p.x-d.x);
        G.ebuls.push({
          x:d.x,y:d.y,
          vx:Math.cos(a)*3.0,vy:Math.sin(a)*3.0,
          isTina:true,kind:'plasma',dmg:8
        });
        d.cd=80+Math.floor(Math.random()*40);
        bip(360,.06,.1,'square',440,260);
      }
      // Проверка попадания пуль игрока в дрона
      for(let j=G.buls.length-1;j>=0;j--){
        const b=G.buls[j];
        if(Math.hypot(b.x-d.x,b.y-d.y)<10){
          d.hp-=b.dmg;d.flash=4;
          spPts(b.x,b.y,5,[P.WHT,P.YEL,P.TINA3],.3,2,10);
          G.buls.splice(j,1);
          if(d.hp<=0){
            spPts(d.x,d.y,18,[P.TINA3,P.YEL,P.WHT,P.ORA],.7,3,22,.02,1.6);
            addShockwave(d.x,d.y,16,P.TINA2,12);
            flash(.2,P.YEL);shake(2);
            sfxX(.6);
            T.drones.splice(i,1);
            break;
          }
        }
      }
    }
  }

  // Урон игроку от снарядов Тины
  for(let i=G.ebuls.length-1;i>=0;i--){
    const b=G.ebuls[i];
    if(!b.isTina)continue;
    if(b.kind==='meteor')continue; // метеорит обрабатывается отдельно выше
    const hitR=b.kind==='laser'?11:b.kind==='plasma'?9:b.kind==='energyBurst'?10:b.kind==='spiral'?7:8;
    if(p.inv<=0&&Math.hypot(p.x-b.x,p.y-b.y)<hitR){
      if(p.shield>0){
        sfxShield();flash(.2,P.CYA);
        p.shield=Math.max(0,p.shield-200);p.inv=20;
        if(G.campaignState.inventory.shieldBuilt)p.shield=Math.max(0,p.shield-100);
      }else{
        const baseDmg=G.campaignState.inventory.shieldBuilt?6:14;
        const dmg=b.dmg||(b.reflected?baseDmg+6:baseDmg);
        p.hp-=dmg;p.inv=35;shake(3);flash(.35,P.HP);sfxHit();G.combo=0;
        fText(p.x,p.y-12,'-'+dmg+'HP',P.RED);
      }
      spPts(b.x,b.y,6,[P.TINA3,P.YEL,P.WHT],.4,2,12);
      G.ebuls.splice(i,1);
    }
  }

  // ★ v16 r12 #8: Дрон-коллизия с игроком
  if(T.drones){
    for(let i=T.drones.length-1;i>=0;i--){
      const d=T.drones[i];
      if(p.inv<=0&&Math.hypot(p.x-d.x,p.y-d.y)<10){
        if(p.shield>0){
          sfxShield();flash(.2,P.CYA);
          p.shield=Math.max(0,p.shield-150);p.inv=20;
        }else{
          p.hp-=12;p.inv=30;shake(3);flash(.3,P.HP);sfxHit();G.combo=0;
          fText(p.x,p.y-12,'-12HP',P.RED);
        }
        // Дрон не уничтожается, только пушает
        const knockA=Math.atan2(d.y-p.y,d.x-p.x);
        d.vx+=Math.cos(knockA)*1.5;d.vy+=Math.sin(knockA)*1.5;
        spPts(p.x,p.y,5,[P.RED,P.YEL,P.WHT],.4,1.8,12);
      }
    }
  }
}

function tinaDie(G){
  const F=G.finale,T=F.tina;
  T.defeated=true;TAP_FIRE=false;
  // ★ v16 r10 #3: Если игрок убил Тину штатно (без катсцены кота) — показываем взрыв.
  // Если катсцена кота уже отыграла сцену звезды (eT>=1740) — пропускаем взрыв и идём прямо к коту
  const fromCatScene=T.emergencyProtocol&&T.emergencyProtocol.t>=1740;
  // Игрок появляется в screen-space (60, LH/2)
  G.pl.x=60;G.pl.y=LH/2;G.pl.vx=0;G.pl.vy=0;
  if(!fromCatScene){
    // Создаём фрагменты — обычный путь смерти (без катсцены)
    F.frags=Array.from({length:90},(_,i)=>{
      const a=Math.random()*Math.PI*2,sp=0.4+Math.random()*1.6;
      const isLarge=i<28;
      const isMid=i<58;
      return{
        x:T.x+Math.cos(a)*(20+Math.random()*40),
        y:T.y+Math.sin(a)*(20+Math.random()*40),
        vx:Math.cos(a)*sp*(isLarge?0.7:isMid?1.0:1.4),
        vy:Math.sin(a)*sp*(isLarge?0.7:isMid?1.0:1.4),
        rot:Math.random()*6,
        vr:(Math.random()-.5)*.2,
        sz:isLarge?(18+Math.random()*22):isMid?(10+Math.random()*10):(5+Math.random()*6),
        col:i%5===0?P.TINA3:i%5===1?P.TINA2:i%5===2?'#441100':i%5===3?P.ORA:'#ff8844',
        spin:true
      };
    });
    F.starReveal=0;
    G.notif='ТИНА УНИЧТОЖЕНА! ЗВЕЗДА СВОБОДНА!';G.notifT=300;G.notifCol=P.TINA3;
    spPts(T.x,T.y,260,[P.TINA,P.TINA2,P.TINA3,P.WHT,P.ORA,'#ffff44','#ff4422'],1.0,10,140,.012,4.5);
    addShockwave(T.x,T.y,200,P.TINA3,80);
    addShockwave(T.x,T.y,140,P.WHT,55);
    addShockwave(T.x,T.y,80,P.YEL,40);
    addShockwave(T.x,T.y,40,'#ffffff',25);
    shake(22);flash(0.5,P.WHT);sfxX(4);sfxX(5);
    sfxVictory();
    setTimeout(()=>sfxVictory(),600);
    setTimeout(()=>{
      flash(0.5,'#ffff44');
      addShockwave(T.x,T.y,220,'#ffff88',100);
      bip(523,.8,.3,'sine',800,400);
    },800);
    setTimeout(()=>{
      flash(0.6,'#ffffff');
      setTimeout(()=>{
        F.battleActive=false;F.showingVictory=true;F.victoryT=0;
      },100);
    },500);
  }else{
    // ★ Катсцена кота уже всё показала — сразу к финалу (поиск кота)
    F.frags=[]; // Очищаем — звезда и осколки уже в drwEmergencyProtocol
    F.battleActive=false;
    F.showingVictory=true;
    F.victoryT=130; // ставим таймер чтобы сразу пропустить вступление и оказаться в стадии "ZVEZDA SVOBODNA"
    G.notif='ЗВЕЗДА СВОБОДНА!';G.notifT=200;G.notifCol=P.TINA3;
    sfxVictory();
  }
}

// ======= ФИНАЛ ТИНА (состояние) =======
function initFinaleTina(G){
  saveCheckpoint(G,'tina');
  TAP_FIRE=false;ALLOW_JOY=true;G.state='finale_tina';G.shipReturnState='finale_tina';
  // ★ v16 r5 #6 / r9 #5 / r12 #5: Игрок начинает ДАЛЕКО слева (~540, было -460), летит к Тине
  Object.assign(G.pl,{x:LW/2-540,y:LH/2,vx:0.6,vy:0,inv:0,boost:0});
  G.buls=[];G.ebuls=[];G.enms=[];G.pups=[];G.rits=[];G.asts=[];
  // ★ v16 r3: Огромный мир под огромную Тину (масштаб x3)
  G.finale={
    t:0,hx:LW/2,hy:LH/2,
    battleActive:false,showingVictory:false,victoryT:0,farewell:null,
    tina:null,nextPower:90,epilogueStarted:false,frags:[],
    worldBounds:{minX:LW/2-660,maxX:LW/2+500,minY:LH/2-320,maxY:LH/2+320},
    cam:{zoom:1.0,x:LW/2-540,y:LH/2},
    // ★ v16 r5 #6: Стартуем с flyby1 — игрок летит, обычный зум, акцент на нём
    cinematic:{phase:'flyby1',t:0,started:false},
  };
  G.notif='ЦЕНТР СИСТЕМЫ. СИГНАЛ: ТИНА...';G.notifT=180;G.notifCol=P.PUR;
  resetBtns();
  if(USE_TOUCH_UI){addBtn('w1',LW-52,LH-22,11,'1',P.L1);addBtn('w2',LW-28,LH-22,11,'2',P.L3);}
  setJoyEnabled(false);
  // ★ Phase 4.3: мёртвая зона у Тины — тёмно-пурпурные/чёрные туманности
  PTS.length=0;SHK.length=0;FTX.length=0;initStars('center');G.transIn=60;
}

// ★ v16 r2: Клампим камеру так, чтобы view не выходил за worldBounds
function clampFinaleCam(F){
  const cam=F.cam,wb=F.worldBounds;
  const halfW=LW/(2*cam.zoom);
  const halfH=LH/(2*cam.zoom);
  // Если view шире мира — центруем камеру по миру
  if((wb.maxX-wb.minX)<halfW*2){cam.targetX=(wb.minX+wb.maxX)/2;}
  else{cam.targetX=Math.max(wb.minX+halfW,Math.min(wb.maxX-halfW,cam.targetX));}
  if((wb.maxY-wb.minY)<halfH*2){cam.targetY=(wb.minY+wb.maxY)/2;}
  else{cam.targetY=Math.max(wb.minY+halfH,Math.min(wb.maxY-halfH,cam.targetY));}
}

// ★ v16 r2: Логика камеры для финального боя
// ★ v16 r5 #6: easeInOutQuad — плавный старт и плавный финиш (для переходов между фазами)
function easeInOutQuad(t){t=Math.max(0,Math.min(1,t));return t<0.5?2*t*t:1-Math.pow(-2*t+2,2)/2;}

function updFinaleCamera(G){
  const F=G.finale,p=G.pl,cam=F.cam,T=F.tina,cin=F.cinematic;
  cin.t++;
  // ★ v16 r5 #6: Каждая кинематик-фаза имеет фиксированную длительность и сохранённое начальное состояние,
  // чтобы камера ДЕРЖАЛА таргет, а переходы между фазами шли по easing-кривой.
  // Если фаза только что началась — запоминаем текущее состояние камеры как стартовое
  if(!cin.started){
    cin.startZoom=cam.zoom;cin.startX=cam.x;cin.startY=cam.y;
    cin.started=true;
  }
  // Целевые значения — отрабатываются согласно фазе
  // ★ v16 r8: Новый набор настроек из DEV-режима
  let tZ=cam.zoom, tX=cam.x, tY=cam.y;
  let easeProgress=true;
  if(cin.phase==='flyby1'){
    tZ=2.0;
    tX=p.x+40;
    tY=p.y;
    easeProgress=false;
  }else if(cin.phase==='flyby2'){
    tZ=2.0;
    const tinaEdgeView=F.hx-186-LW/2+50;
    tX=Math.max(p.x+40,tinaEdgeView);
    tY=p.y;
    easeProgress=false;
  }else if(cin.phase==='intro_zoomout'){
    const tt=easeInOutQuad(cin.t/90);
    tZ=cin.startZoom+(0.4-cin.startZoom)*tt;
    tX=cin.startX+((p.x+F.hx)/2-cin.startX)*tt;
    tY=cin.startY+((p.y+F.hy)/2-cin.startY)*tt;
    easeProgress=null;
  }else if(cin.phase==='pre_dialog'){
    tZ=0.4;
    tX=(p.x+F.hx)/2;
    tY=(p.y+F.hy)/2;
    easeProgress=false;
  }else if(cin.phase==='battle'){
    if(T&&T.phaseTransition){
      const pulseZ=0.01*Math.sin(T.phaseTransition.t*0.25);
      tZ=0.44+pulseZ;
      tX=T.x;
      tY=T.y;
      easeProgress=false;
    }else if(T&&T.emergencyProtocol&&T.emergencyProtocol.starWaiting){
      // ★ v24b: После взрыва — игрок летит к центру звезды, зум +40% для крупности
      tZ=1.4;
      tX=p.x*0.9+T.x*0.1;
      tY=p.y*0.9+T.y*0.1;
      easeProgress=false;
    }else if(T&&T.emergencyProtocol){
      const eT=T.emergencyProtocol.t;
      if(eT>=1740){
        // ★ v24b: Взрыв — snap zoom, камера уже на Тине
        tZ=0.55;
        tX=T.x;
        tY=T.y;
        easeProgress=null;
      }else if(eT>=1680){
        // ★ v24b: За 1 сек до взрыва — плавный дрейф камеры на Тину
        const preT=easeInOutQuad(Math.min(1,(eT-1680)/60));
        tZ=0.48+(0.55-0.48)*preT;
        tX=(T.x+p.x)/2+((T.x)-((T.x+p.x)/2))*preT;
        tY=(T.y+p.y)/2+((T.y)-((T.y+p.y)/2))*preT;
        easeProgress=false;
      }else if(eT>=540){
        // ★ v24b: Обратный отсчёт → взрыв — камера охватывает Тину И игрока
        tZ=0.48;
        tX=(T.x+p.x)/2;
        tY=(T.y+p.y)/2;
        easeProgress=false;
      }else{
        // ★ v24b: Фаза появления пушек — акцент только на Тине, игрок за кадром.
        // zoom=0.48: видимая ширина LW/0.48≈667px, левый край = T.x-333.
        // Стена с eT=60 держит игрока на T.x-360 — вне кадра.
        tZ=0.48;
        tX=T.x;
        tY=T.y;
        easeProgress=false;
      }
    }else{
      // ★ v16 r10: Бой — zoom 1.0, акцент 90% игрок / 10% Тина (battleFocusP=0.9)
      // (Раньше было tZ=0.4 с follow или фиксированный центр — оба не совпадали с DEV-режимом)
      tZ=1.0;
      if(T){
        tX=p.x*0.9+T.x*0.1;
        tY=p.y*0.9+T.y*0.1;
      }else{
        tX=(p.x+F.hx)/2;tY=(p.y+F.hy)/2;
      }
      easeProgress=false;
    }
  }else{
    // 'done' / 'outro_zoomback' (больше не используется) — стандартный 1:1
    tZ=1.0;tX=LW/2;tY=LH/2;
    easeProgress=false;
  }

  // Применяем целевые значения
  if(easeProgress===null){
    cam.zoom=tZ;cam.x=tX;cam.y=tY;
  }else if(easeProgress===false){
    cam.zoom+=(tZ-cam.zoom)*0.10;
    cam.x+=(tX-cam.x)*0.12;
    cam.y+=(tY-cam.y)*0.12;
  }
  cam.targetX=cam.x;cam.targetY=cam.y;
  clampFinaleCam(F);
  cam.x=cam.targetX;cam.y=cam.targetY;

  // Переходы фаз по таймеру (длительности из config)
  if(cin.phase==='flyby1'&&cin.t>=120){
    cin.phase='flyby2';cin.t=0;cin.started=false;
  }else if(cin.phase==='flyby2'&&cin.t>=120){
    cin.phase='intro_zoomout';cin.t=0;cin.started=false;
  }else if(cin.phase==='intro_zoomout'&&cin.t>=90){
    cin.phase='pre_dialog';cin.t=0;cin.started=false;
    if(!G.dlg){
      const g=tinaDialog();
      G.dlg={mode:'graph',graph:g,node:g.start,choiceIdx:0,speaker:'TINA',noSpaceConfirm:true,prevAllowJoy:true};
      G.dlgChar=0;
    }
  }
}

// ★ v16 r7: Off-screen render buffer для финального боя.
// Все объекты боя (Тина, турели, снаряды, частицы) рисуются в большой offscreen canvas
// в нативном размере (без cx.scale). На основной canvas drawImage с целевым размером,
// imageSmoothingEnabled=false → nearest-neighbor → пиксели чёткие на любом zoom.
const _FIN_OFF=document.createElement('canvas');
// Размер: достаточный чтобы вместить весь worldBounds (1000×640) + margin
_FIN_OFF.width=1100;_FIN_OFF.height=700;
const _FIN_OFF_CX=_FIN_OFF.getContext('2d');
_FIN_OFF_CX.imageSmoothingEnabled=false;
const _FIN_OFF_W=_FIN_OFF.width,_FIN_OFF_H=_FIN_OFF.height;

function applyFinaleCamera(F){
  const cam=F.cam;
  // Очищаем offscreen
  _FIN_OFF_CX.clearRect(0,0,_FIN_OFF_W,_FIN_OFF_H);
  // Переключаем глобальный cx на offscreen
  cx=_FIN_OFF_CX;
  cx.save();
  // Сдвиг: чтобы (cam.x, cam.y) попало в центр offscreen-буфера
  cx.translate(_FIN_OFF_W/2-Math.round(cam.x),_FIN_OFF_H/2-Math.round(cam.y));
}
function clearFinaleCamera(F){
  // Снимаем offscreen-трансформ
  cx.restore();
  // Возвращаемся на основной canvas
  cx=_MAIN_CX;
  // Рисуем offscreen на основной с zoom: вырезаем LW/zoom × LH/zoom вокруг центра буфера
  const cam=F&&F.cam?F.cam:{zoom:1};
  const prevSmoothing=cx.imageSmoothingEnabled;
  cx.imageSmoothingEnabled=false;
  const srcW=LW/cam.zoom,srcH=LH/cam.zoom;
  const srcX=_FIN_OFF_W/2-srcW/2;
  const srcY=_FIN_OFF_H/2-srcH/2;
  cx.drawImage(_FIN_OFF,srcX,srcY,srcW,srcH,0,0,LW,LH);
  cx.imageSmoothingEnabled=prevSmoothing;
}

// ★ v16 r4 #2,#4: Преобразование мировых координат → экранные пиксели (целочисленные)
function worldToScreen(F,wx,wy){
  const cam=F.cam;
  return {
    x:Math.round(LW/2+(wx-cam.x)*cam.zoom),
    y:Math.round(LH/2+(wy-cam.y)*cam.zoom),
  };
}

// ★ v16 r4/r7: Раньше — для рендера спрайта в screen-space внутри scaled-камеры.
// Сейчас (r7): cx уже указывает на offscreen-буфер боя 1:1, поэтому просто рисуем в мировых коорах.
function drwSharpAtWorld(F,wx,wy,drawFn,scale){
  const s=scale||1;
  if(s===1){drawFn(wx|0,wy|0);return;}
  cx.save();cx.translate(wx,wy);cx.scale(s,s);drawFn(0,0);cx.restore();
}

// ★ v16 r2: Игрок должен лететь в пределах worldBounds во время боя.
function clampPlayerToBattleBounds(F,p){
  const wb=F.worldBounds;
  p.x=Math.max(wb.minX+10,Math.min(wb.maxX-10,p.x));
  p.y=Math.max(wb.minY+10,Math.min(wb.maxY-10,p.y));
  // ★ v16 r11: Во время кат-сцены кота игрок не может пролететь правее крайнего левого
  // края главной пушки. Но в фазе starWaiting (после взрыва) — стена снимается.
  const T=F.tina;
  if(T&&T.emergencyProtocol&&!T.emergencyProtocol.starWaiting){
    const eT=T.emergencyProtocol.t;
    if(eT>=60){
      // ★ v24b: Стена активна через весь экстра режим, включая сцену звезды
      // В фазе взрыва/звезды стена смещается влево, отталкивая игрока
      let starWallX;
      if(eT<1560){
        starWallX=T.x-360; // фаза пушек — фиксированная стена
      }else{
        // Звёздная стена: с нарастанием смещается влево по мере роста звезды
        const starShift=Math.min(130,(eT-1560)/5.5);
        starWallX=T.x-360-starShift;
      }
      p.x=Math.min(p.x,starWallX);
    }
  }
}

function spawnFinalePowerUp(G){
  const types=['shield','health','energy'];
  const type=types[(Math.random()*types.length)|0];
  // ★ v16 r12 #7: Спавн на правой границе мира + быстрее + ДОЛЬШЕ живут
  // (мир сейчас от -660 до +500, расстояние до игрока на -540 ~ 1200 px)
  const F=G.finale;
  const wb=F&&F.worldBounds?F.worldBounds:{minX:-660,maxX:660};
  const py=(F?F.hy:90)+(Math.random()-0.5)*120;
  G.pups.push({
    x:wb.maxX-20,
    y:py,
    vx:-2.5-Math.random()*0.6,  // 2.5..3.1 — было 2.0..2.5
    vy:(Math.random()-.5)*0.3,
    type,
    lf:900,                     // было 600 — теперь хватает на полный пролёт мира
    t:0
  });
}
function updFinalePowerUps(G){
  const p=G.pl;
  // ★ v16 r12 #7: используем границы мира финала, а не screen-space
  const wb=G.finale&&G.finale.worldBounds?G.finale.worldBounds:{minX:-100};
  for(let i=G.pups.length-1;i>=0;i--){
    const pu=G.pups[i];
    pu.x+=pu.vx;pu.y+=pu.vy;pu.t++;pu.lf--;
    pu.vy*=.98;
    const dx=p.x-pu.x,dy=p.y-pu.y,d=Math.hypot(dx,dy)||1;
    // Магнитное притяжение увеличено — раньше реагировал только если игрок в 60 px,
    // но игрок не успевал догнать. Теперь магнит работает шире, бонус "ловит" игрока сам.
    if(d<160){pu.vx+=dx/d*.6;pu.vy+=dy/d*.6;}
    if(d<14){
      if(pu.type==='shield'){p.shield=720;fText(pu.x,pu.y,'SHIELD!',P.CYA);}
      else if(pu.type==='health'){p.hp=Math.min(p.mhp,p.hp+45);fText(pu.x,pu.y,'+45HP',P.HPH);}
      else{p.en=Math.min(p.men,p.en+70);fText(pu.x,pu.y,'OVERCHARGE',P.EN);if(G.campaignState.inventory.starBattery)p.shield=Math.max(p.shield,180);}
      sfxPU();flash(.25,pu.type==='shield'?P.CYA:pu.type==='health'?P.HP:P.EN);
      spPts(pu.x,pu.y,16,[pu.type==='shield'?P.CYA:pu.type==='health'?P.HP:P.EN,P.WHT],.5,2.7,24);
      addShockwave(pu.x,pu.y,18,pu.type==='shield'?P.CYA:pu.type==='health'?P.HP:P.EN);
      G.pups.splice(i,1);continue;
    }
    // ★ v16 r12 #7: Despawn — за левой границей мира, а не screen-space (-14)
    if(pu.x<wb.minX-20||pu.lf<=0)G.pups.splice(i,1);
  }
}
function updFinaleTina(G){
  handlePauseInput(G);if(G.paused)return;
  G.sT++;const p=G.pl,F=G.finale;F.t++;
  if(G.notifT>0)G.notifT--;
  // ★ v16 r2: Камера и кинематик-фазы
  if(F.cam)updFinaleCamera(G);
  // ★ v16 r5 #6: Кинематик-фазы перед боем — игрок дрейфует, управления нет
  if(F.cinematic&&(F.cinematic.phase==='flyby1'||F.cinematic.phase==='flyby2'||F.cinematic.phase==='intro_zoomout'||F.cinematic.phase==='pre_dialog')){
    // На flyby1/2 игрок медленно летит вперёд (подлетает к Тине)
    if(F.cinematic.phase==='flyby1'||F.cinematic.phase==='flyby2'){
      // Постоянная небольшая скорость вправо
      p.vx=Math.min(p.vx+0.005,1.0);
      p.vy*=0.92;
    }else{
      // На zoom-out фазах корабль притормаживает (уже подлетел)
      p.vx*=.94;p.vy*=.94;
    }
    p.x+=p.vx;p.y+=p.vy;
    if(F.worldBounds)clampPlayerToBattleBounds(F,p);
    else{p.x=Math.max(16,Math.min(LW*.72,p.x));p.y=Math.max(20,Math.min(LH-16,p.y));}
    p.thrT++;
    // Диалог уже может быть открыт — обновляем
    if(G.dlg)updDialog(G);
    updPts();updSHK();updFTX();scrollStars(.2);
    return;
  }
  // После победы — плавный возврат игрока в центр
  if(F.cinematic&&F.cinematic.phase==='outro_zoomback'){
    // ★ v16 r4 #5: Плавный лерп к центру (медленнее под новый темп камеры)
    p.x+=(LW/2-p.x)*0.022;
    p.y+=(LH/2-p.y)*0.022;
    p.vx*=.85;p.vy*=.85;
    p.thrT++;
    updPts();updSHK();updFTX();scrollStars(.2);
    return;
  }

  // Победный экран
  if(F.showingVictory){
    F.victoryT++;
    scrollStars(.3);updPts();updFTX();
    // Триггер: после показа победы → переходим в сцену "Найти Генерала"
    if((F.victoryT>80||((KD.Enter||KD.Space||mC||btnJust('int'))&&F.victoryT>40))&&!F.catSceneStarted&&!F.epilogueStarted){
      F.catSceneStarted=true;F.catT=0;mC=false;
      // Инициализируем кота: он плавает в обломках Тины
      F.catX=F.hx+24;F.catY=F.hy+10;F.catVx=-0.3;F.catVy=0.2;
      F.catFound=false;F.catRotated=0;
      // Сообщение начало
      G.notif='ЧТО-ТО МЕЛЬКНУЛО В ОБЛОМКАХ...';G.notifT=180;G.notifCol=P.YEL;
      sfxUI();
    }
    // === СЦЕНА: НАЙТИ КОТА ГЕНЕРАЛА ===
    if(F.catSceneStarted&&!F.epilogueStarted){
      F.catT++;
      // Кот плавает в невесомости — лёгкое вращение
      F.catRotated+=0.02;
      // Слегка дрейфует к игроку (магнетизм)
      const dxc=p.x-F.catX,dyc=p.y-F.catY,dc=Math.hypot(dxc,dyc)||1;
      F.catVx+=dxc/dc*0.018;F.catVy+=dyc/dc*0.018;
      F.catVx*=0.97;F.catVy*=0.97;
      F.catX+=F.catVx;F.catY+=F.catVy;
      // Управление кораблём (можно лететь к коту)
      let cIx=0,cIy=0;
      if(K.KeyW||K.ArrowUp)cIy-=1;if(K.KeyS||K.ArrowDown)cIy+=1;
      if(K.KeyA||K.ArrowLeft)cIx-=1;if(K.KeyD||K.ArrowRight)cIx+=1;
      if(USE_TOUCH_UI&&TOUCH.joyActive){cIx=TOUCH.joyDX;cIy=TOUCH.joyDY;}
      const cIl=Math.hypot(cIx,cIy)||1;
      p.vx+=(cIx/cIl)*0.18*(cIx?1:0);p.vy+=(cIy/cIl)*0.18*(cIy?1:0);
      p.vx*=.92;p.vy*=.92;
      p.x=Math.max(16,Math.min(LW-16,p.x+p.vx));
      p.y=Math.max(20,Math.min(LH-16,p.y+p.vy));
      // Подсказка автонаведения — мерцающее кольцо вокруг кота
      // Подобрали кота?
      if(!F.catFound){
        const pickD=Math.hypot(p.x-F.catX,p.y-F.catY);
        if(pickD<14){
          F.catFound=true;F.catPickT=0;
          G.notif='ГЕНЕРАЛ НАЙДЕН! ОН ВЫЖИЛ В СЕРДЦЕ ТИНЫ!';G.notifT=300;G.notifCol=P.YEL;
          sfxPU();setTimeout(sfxPU,80);setTimeout(sfxVictory,200);
          spPts(F.catX,F.catY,28,[P.YEL,P.WHT,'#ffaa44','#dd8844'],.7,3,40,.02,2);
          flash(.4,P.YEL);shake(3);
          addShockwave(F.catX,F.catY,30,P.YEL,30);
          fText(F.catX,F.catY-8,'МЯУ!',P.YEL);
        }
      }else{
        // Кот пристёгнут к кораблю
        F.catPickT++;
        F.catX+=(p.x+10-F.catX)*0.2;
        F.catY+=(p.y-F.catY)*0.2;
        // ★ Phase 3.2: после сцены с котом — прощальная сцена с Райгаром (вместо прямого перехода к титрам)
        if(F.catPickT>480&&!F.epilogueStarted){
          F.epilogueStarted=true;mC=false;
          startTrans(()=>{F.farewell={t:0,done:false};sfxEmotional();});
        }
        if(F.catPickT>80&&(KD.Enter||KD.Space||mC||btnJust('int'))&&!F.epilogueStarted){
          F.epilogueStarted=true;mC=false;
          startTrans(()=>{F.farewell={t:0,done:false};sfxEmotional();});
        }
      }
      return;
    }
    // ★ Phase 3.2: фаза прощания с Райгаром — пауза перед титрами
    if(F.farewell&&!F.farewell.done){
      F.farewell.t++;
      const t=F.farewell.t;
      // Через ~10 сек автоматом или ENTER/тап после 90 кадров → титры
      if(t>600||((KD.Enter||KD.Space||mC||btnJust('int'))&&t>90)){
        F.farewell.done=true;mC=false;
        startTrans(()=>initVictoryScreen(G));
      }
      return;
    }
    return;
  }

  const tinaBriefingActive=G.briefing&&G.briefing.planet&&G.briefing.planet.startsWith('tina_phase');

  // ★ v24b: Во время брифинга фаз Тины — игрок и снаряды заморожены
  if(tinaBriefingActive){
    for(const b of G.ebuls){b.x-=b.vx;b.y-=b.vy;}// держим снаряды на месте
    for(const b of G.buls){b.x-=b.vx;b.y-=b.vy;}
    p.vx*=0.7;p.vy*=0.7;
    return;
  }

  // Управление кораблём
  let ix=0,iy=0;
  if(K.KeyW||K.ArrowUp)iy-=1;if(K.KeyS||K.ArrowDown)iy+=1;
  if(K.KeyA||K.ArrowLeft)ix-=1;if(K.KeyD||K.ArrowRight)ix+=1;
  if(USE_TOUCH_UI&&TOUCH.joyActive){ix=TOUCH.joyDX;iy=TOUCH.joyDY;}
  const il=Math.hypot(ix,iy)||1;
  const hasBattery=G.campaignState.inventory.starBattery;
  const boostOn=(K.ShiftLeft||btnHeld('boost'))&&(hasBattery||p.en>10);
  // ★ v16 r12 #6 / v20: Скорости игрока в бою на 36% меньше оригинала (−20% ещё раз)
  const thrust=boostOn?.40:.25;
  if(boostOn){if(!hasBattery)p.en-=.5;p.boost=4;}
  p.vx+=(ix/il)*thrust*(ix?1:0);p.vy+=(iy/il)*thrust*(iy?1:0);
  p.vx*=.86;p.vy*=.86;
  const maxSp=boostOn?1.92:1.44;
  const sp=Math.hypot(p.vx,p.vy);
  if(sp>maxSp){p.vx=p.vx/sp*maxSp;p.vy=p.vy/sp*maxSp;}
  p.x+=p.vx;p.y+=p.vy;
  // ★ v16 r9 #10: Коллизия с телом Тины — игрок не может пройти сквозь
  // ★ v16 r9 fix: T берётся из F.tina (в этом скоупе T напрямую не определена)
  const _T=F.tina;
  if(_T&&!_T.defeated&&!_T.emergencyProtocol){
    const collR=TINA_R+8;
    const dx=p.x-_T.x,dy=p.y-_T.y;
    const d=Math.hypot(dx,dy)||1;
    if(d<collR){
      const nx=dx/d,ny=dy/d;
      p.x=_T.x+nx*collR;
      p.y=_T.y+ny*collR;
      const vn=p.vx*nx+p.vy*ny;
      if(vn<0){
        p.vx-=2*vn*nx*0.7;
        p.vy-=2*vn*ny*0.7;
      }
      if(p.inv<=0){
        const dmg=p.shield>0?0:8;
        if(p.shield>0){
          p.shield=Math.max(0,p.shield-150);sfxShield();flash(.2,P.CYA);
        }else{
          p.hp-=dmg;sfxHit();flash(.3,P.HP);shake(2);
          fText(p.x,p.y-12,'-'+dmg+'HP',P.RED);
        }
        p.inv=30;
      }
      spPts(p.x,p.y,5,[P.RED,P.YEL,P.WHT],.4,1.8,12);
    }
  }
  // ★ v16 r2: Игрок ограничен worldBounds во время боя (они расширились благодаря зум-ауту)
  if(F.worldBounds){clampPlayerToBattleBounds(F,p);}
  else{p.x=Math.max(16,Math.min(LW*.72,p.x));p.y=Math.max(20,Math.min(LH-20,p.y));}
  p.thrT++;
  // ★ v16 r11 fix: Проверка достижения центра звезды (фаза starWaiting)
  // T в этом скоупе не определена — используем F.tina
  const _Tstar=F.tina;
  if(_Tstar&&_Tstar.emergencyProtocol&&_Tstar.emergencyProtocol.starWaiting){
    const dx=p.x-_Tstar.x, dy=p.y-_Tstar.y;
    const dd=Math.hypot(dx,dy);
    if(dd<60){
      tinaDie(G);
      return;
    }
    // Во время starWaiting не стреляем и не запускаем остальную логику Тины
    return;
  }
  if(hasBattery){p.en=p.men;}else{p.en=Math.min(p.men,p.en+.15);}
  if(p.shield>0)p.shield--;
  // ★ БАГ-ФИКС: декремент кадров неуязвимости в финале.
  // Без этого после первого попадания p.inv остаётся >0 и блокирует все последующие удары.
  if(p.inv>0)p.inv--;

  // ★ Phase 2.2: переключение через тот же диспетчер 1..6 и циклическую кнопку
  for(let d=0;d<6;d++){
    if(KD['Digit'+(d+1)]||KD['Numpad'+(d+1)]){_switchWeapon(G,d);break;}
  }
  if(btnJust('wcyc'))_cycleWeapon(G);

  // ★ Стрельба — диспетчер по типу оружия. Дальность увеличена (rangeBoost=4) под широкий мир финала.
  p.sCD=Math.max(0,p.sCD-1);
  const firing=K.Space||K.KeyZ||(USE_TOUCH_UI&&TOUCH.fire);
  const inCatScene=F.tina&&F.tina.emergencyProtocol;
  // Burst-очередь работает независимо
  if(p.burstQueue>0&&F.battleActive&&!inCatScene){
    if(p.burstNext<=0){
      G.buls.push({x:p.x+12,y:p.y+(Math.random()-.5)*4,vx:7,vy:0,lv:2,lf:160,dmg:3*_DEV.dmgMult,t:0,burst:true});
      spPts(p.x+12,p.y,2,[P.YEL,P.WHT],.3,1,5,0);sfxL(1);
      p.burstQueue--;p.burstNext=6;
    } else p.burstNext--;
  }
  if(firing&&F.battleActive&&!inCatScene){
    const w=(typeof WEAPONS!=='undefined'?WEAPONS[p.wepIdx||0]:null);
    if(!w){
      // Fallback на legacy-логику, если WEAPONS почему-то не загружен
      const ec=[10,44][p.wep-1],cd=[7,28][p.wep-1];
      if((hasBattery||p.en>=ec)&&p.sCD===0){
        if(!hasBattery)p.en-=ec;p.sCD=cd;
        G.buls.push({x:p.x+12,y:p.y,vx:[7,5][p.wep-1],vy:0,lv:p.wep===2?3:1,lf:160,dmg:[2,10][p.wep-1]*_DEV.dmgMult,t:0});
        sfxL(p.wep);
        if(p.wep===2){shake(2.5);flash(.2,P.L3L);}
      }
    } else if(w.kind==='beam'){
      if(hasBattery||p.en>=w.en){
        if(!hasBattery)p.en-=w.en;
        // В финале луч летит дальше (rangeBoost=4)
        _fireFromWeapon(G,p,w,4);
        // Перезаписываем lf и t у только что вставленной пули (для совместимости с финалом)
        const last=G.buls[G.buls.length-1];if(last){last.t=0;last.vy=0;}
      } else if(G.sT%15===0)fText(p.x,p.y-12,'NET EN',P.ENL);
    } else if(w.kind==='burst'){
      if(p.sCD===0&&p.burstQueue===0){
        if(hasBattery||p.en>=w.en){
          if(!hasBattery)p.en-=w.en;p.sCD=w.cd;
          p.burstQueue=5;p.burstNext=0;shake(2);
        } else if(G.sT%15===0)fText(p.x,p.y-12,'NET EN',P.ENL);
      }
    } else if(p.sCD===0){
      if(hasBattery||p.en>=w.en){
        if(!hasBattery)p.en-=w.en;p.sCD=w.cd;
        _fireFromWeapon(G,p,w,4);
        // Финал ожидает t:0 и vy:0 на пулях
        const last=G.buls[G.buls.length-1];
        if(last){last.t=last.t||0;if(last.vy===undefined)last.vy=0;}
      } else if(G.sT%15===0)fText(p.x,p.y-12,'NET EN',P.ENL);
    }
  }

  // Обновление снарядов игрока
  // ★ v16 r3: Снаряды живут пока в worldBounds (мир огромный)
  for(let i=G.buls.length-1;i>=0;i--){
    const b=G.buls[i];b.x+=b.vx;b.y+=(b.vy||0);b.lf--;
    const wb=F.worldBounds;
    const oob=wb?(b.x>wb.maxX+20||b.x<wb.minX-20||b.y<wb.minY-20||b.y>wb.maxY+20):(b.x>LW+10);
    if(b.lf<=0||oob){G.buls.splice(i,1);}
  }

  // Обновление снарядов врагов
  for(let i=G.ebuls.length-1;i>=0;i--){
    const b=G.ebuls[i];b.x+=b.vx;b.y+=b.vy;
    // Отслеживающие лазеры медленно ведут к цели
    if(b.tracking&&b.target){
      const dx=b.target.x-b.x,dy=b.target.y-b.y,d=Math.hypot(dx,dy)||1;
      b.vx+=dx/d*0.04;b.vy+=dy/d*0.04;
      const sp=Math.hypot(b.vx,b.vy);if(sp>3){b.vx=b.vx/sp*3;b.vy=b.vy/sp*3;}
    }
    // ★ v16 r3: Самонаводящиеся ракеты Тины — преследуют игрока (новая атака)
    if(b.homing&&p){
      const dx=p.x-b.x,dy=p.y-b.y,d=Math.hypot(dx,dy)||1;
      b.vx+=dx/d*0.10;b.vy+=dy/d*0.10;
      const sp=Math.hypot(b.vx,b.vy),mxs=2.5;
      if(sp>mxs){b.vx=b.vx/sp*mxs;b.vy=b.vy/sp*mxs;}
      // След частиц
      if(G.sT%2===0)PTS.push({x:b.x,y:b.y,vx:(Math.random()-0.5)*0.3,vy:(Math.random()-0.5)*0.3,lf:14,ml:18,col:Math.random()<0.5?P.YEL:P.ORA,sz:1,gv:0,fade:0.6});
    }
    if(b.lifeMax){b.lf=(b.lf||b.lifeMax)-1;if(b.lf<=0){G.ebuls.splice(i,1);continue;}}
    // ★ v16 r3: Расширенные границы под worldBounds — снаряды живут пока в мировых рамках
    const wb=F.worldBounds||{minX:-10,maxX:LW+10,minY:10,maxY:LH-10};
    if(b.x<wb.minX-20||b.x>wb.maxX+20||b.y<wb.minY-20||b.y>wb.maxY+20){G.ebuls.splice(i,1);continue;}
  }

  // Периодические бонусы в бою с Тиной.
  // ★ v16 r12 #7: Не спавним новые бонусы во время катсцены (emergencyProtocol активен)
  if(F.battleActive&&F.tina&&!F.tina.defeated&&!tinaBriefingActive){
    if(!F.tina.emergencyProtocol){
      F.nextPower--;
      if(F.nextPower<=0){spawnFinalePowerUp(G);F.nextPower=150+((Math.random()*80)|0);}
    }
    updFinalePowerUps(G);
  }

  // ★ v24b: Во время брифинга фаз Тины — бой полностью заморожен

  // Бой с ТИНОЙ
  if(F.battleActive&&F.tina&&!F.tina.defeated){
    if(!tinaBriefingActive)updTinaBattle(G);
  }

  // Диалог
  if(G.dlg)updDialog(G);

  // Смерть игрока
  if(_DEV.immortal&&p.hp<=0){p.hp=p.mhp;p.en=p.men;p.shield=0;} // DEV: бессмертие
  if(p.hp<=0){
    spPts(p.x,p.y,34,[P.SH1,P.TH1,P.WHT,P.L1],1,5.5,50,.06,2);
    addShockwave(p.x,p.y,40,P.WHT,25);sfxX(3);flash(.9,P.WHT);shake(10);
    G.state='gameover';G.goT=0;resetBtns();return;
  }

  updPts();updSHK();updFTX();scrollStars(.4);
}

function drwFinaleTina(G){
  rc(0,0,LW,LH,'#03010a');applyShake();drwNebula();drwStars();
  const F=G.finale,t=F.t;

  // Победный экран — звезда освобождается
  if(F.showingVictory){
    const vt=F.victoryT;
    rc(0,0,LW,LH,'#03010a');drwNebula();drwStars();
    // ★ Фоновое нарастание яркости от освобождённой звезды
    const starGlow=Math.min(1,vt/120);
    cx.globalAlpha=starGlow*0.12;
    cx.fillStyle='#ffee88';
    cx.fillRect(0,0,LW,LH);
    cx.globalAlpha=1;
    // Осколки Тины разлетаются, внутри видна звезда
    // ★ v16 r9 #6: дольше живут (240→400), чёткие, с искрами-следом
    if(F.frags){
      for(const fr of F.frags){
        if(vt<300){fr.x+=fr.vx;fr.y+=fr.vy;fr.vx*=.992;fr.vy*=.992;fr.rot+=fr.vr;}
        const alpha=Math.max(0,1-vt/400);
        if(alpha<=0)continue;
        // Искра-след за крупным куском
        if(fr.sz>14&&vt<200&&G.sT%4===0){
          PTS.push({
            x:fr.x,y:fr.y,
            vx:-fr.vx*0.2+(Math.random()-.5)*0.3,
            vy:-fr.vy*0.2+(Math.random()-.5)*0.3,
            lf:18,ml:22,col:Math.random()<0.5?P.ORA:'#ff4422',sz:1,gv:0,fade:0.55
          });
        }
        cx.save();cx.translate(fr.x|0,fr.y|0);cx.rotate(fr.rot);
        cx.globalAlpha=alpha;
        // Тёмная тень-контур для контраста
        rc(-fr.sz/2-1,-fr.sz/3-1,fr.sz+2,Math.max(2,fr.sz*.6)+2,'#1a0808');
        rc(-fr.sz/2,-fr.sz/3,fr.sz,Math.max(2,fr.sz*.6),fr.col);
        rc(-fr.sz/3,-fr.sz/4,fr.sz*.6,1,P.WHT);
        cx.restore();cx.globalAlpha=1;
      }
    }
    // ★ v16 r9 #7: Полностью переделанная сцена появления звезды
    // — звезда в 2 раза крупнее (соответствует масштабу Тины)
    // — все элементы (звезда, ореолы, лучи, кольца орбит) центрированы строго в (cxs, cys)
    // — добавлены концентрические орбитальные кольца с дрейфом (как у солнечной системы)
    const cxs=F.hx,cys=F.hy;  // единый центр для всех элементов

    // Звезда внутри — нарастает (теперь крупнее)
    const starA=Math.min(1,vt/70);
    const starR=Math.min(160,(12+vt*0.9)|0); // было: max 80, base 8 + vt*0.55. Теперь max 160
    // Концентрические внешние ореолы — все центрированы
    cx.globalAlpha=starA*0.10;disc(cxs,cys,(starR*3.0)|0,'#ffaa44');
    cx.globalAlpha=starA*0.18;disc(cxs,cys,(starR*2.2)|0,'#ffff44');
    cx.globalAlpha=starA*0.35;disc(cxs,cys,(starR*1.4)|0,'#ffee88');
    cx.globalAlpha=starA*0.75;disc(cxs,cys,starR,'#ffffcc');
    cx.globalAlpha=1;disc(cxs,cys,(starR*0.4)|0,'#ffffff');
    cx.globalAlpha=1;
    // Лучи звезды — больше и длиннее под новый размер
    if(vt>25){
      const rays=20,pulse=0.7+0.3*Math.sin(vt*0.08);
      for(let i=0;i<rays;i++){
        const a=i/rays*Math.PI*2+vt*0.009;
        const len=(60+vt*1.3+Math.sin(vt*0.12+i*0.8)*30)*pulse;
        cx.globalAlpha=Math.min(0.55,vt/90)*0.55;
        cx.strokeStyle=i%2?'#ffff44':'#ffee88';cx.lineWidth=i%3?1:2;
        cx.beginPath();cx.moveTo(cxs,cys);
        cx.lineTo((cxs+Math.cos(a)*len)|0,(cys+Math.sin(a)*len)|0);cx.stroke();
      }
      cx.globalAlpha=1;
    }
    // Орбитальные кольца — несколько концентрических колец с медленным вращением маркеров
    if(vt>40){
      const orbits=[{r:starR*1.8,n:8,col:'#ffaa66'},{r:starR*2.4,n:12,col:'#ff8844'},{r:starR*3.2,n:16,col:'#cc6633'}];
      for(let oi=0;oi<orbits.length;oi++){
        const o=orbits[oi];
        // Сама орбитальная линия — слабое свечение
        cx.globalAlpha=Math.min(0.3,(vt-40)/100)*(0.4+0.1*Math.sin(vt*0.05+oi));
        ring(cxs,cys,o.r,o.col,1);
        // Маркеры на орбите (точки) — медленно вращаются
        cx.globalAlpha=Math.min(0.7,(vt-40)/80);
        const rotSpeed=0.005-oi*0.001;
        for(let m=0;m<o.n;m++){
          const ma=m/o.n*Math.PI*2+vt*rotSpeed;
          const mx=cxs+Math.cos(ma)*o.r;
          const my=cys+Math.sin(ma)*o.r;
          cx.fillStyle=o.col;cx.fillRect(mx|0,my|0,2,2);
        }
      }
      cx.globalAlpha=1;
    }
    // Дополнительные искры от освобождения звезды
    if(vt>50&&vt%4===0){
      const a=Math.random()*Math.PI*2;
      PTS.push({x:F.hx+Math.cos(a)*starR*0.6,y:F.hy+Math.sin(a)*starR*0.6,vx:Math.cos(a)*1.5,vy:Math.sin(a)*1.5,lf:30,ml:36,col:Math.random()<0.5?'#ffffff':'#ffee88',sz:1+(Math.random()<0.3?1:0),gv:0,fade:0.55});
    }
    if(vt>55&&!F.catSceneStarted){
      cx.globalAlpha=Math.min(1,(vt-55)/35);
      txcs('ЗВЕЗДА СВОБОДНА!',LH/2-22,P.TINA3,P.BLK,2);
      cx.globalAlpha=1;
    }
    if(vt>90&&!F.catSceneStarted){
      cx.globalAlpha=Math.min(1,(vt-90)/30);
      txcs('СВЕТ ВОЗВРАЩАЕТСЯ В СИСТЕМУ',LH/2+6,P.YEL,P.BLK,1);
      cx.globalAlpha=1;
    }
    if(vt>130&&!F.catSceneStarted&&Math.floor(vt/22)%2){
      txcs(USE_TOUCH_UI?'ТАП - ЭПИЛОГ':'ENTER - ЭПИЛОГ',LH-20,P.WHT,P.BLK,1);
    }
    // ★ v16 r7: Корабль игрока должен быть виден во время взрыва и сцены звезды
    if(!F.catSceneStarted){
      drwShip(G.pl.x,G.pl.y,0,F.t||0,false,G.pl.hp/G.pl.mhp);
    }

    // === СЦЕНА: ПОИСК КОТА ГЕНЕРАЛА ===
    if(F.catSceneStarted){
      // Кот: маленький рыжий пушистик, плавающий в обломках
      const cx_=F.catX|0,cy_=F.catY|0;
      // Свечение вокруг кота — золотистое
      cx.globalAlpha=.4+.3*Math.sin(F.catT*.2);
      disc(cx_,cy_,(F.catFound?6:9),P.YEL);
      cx.globalAlpha=1;
      // Аура мистическая
      if(!F.catFound){
        cx.globalAlpha=.5+.4*Math.sin(F.catT*.15);
        ring(cx_,cy_,11,P.YEL,1);
        ring(cx_,cy_,14,'#ffaa44',1);
        cx.globalAlpha=1;
      }
      // Сам кот — плавает в невесомости. Без поворота (поворот даёт subpixel-blur),
      // вместо этого плавный bob + ленивый поворот лево/право.
      const catBob=F.catFound?0:Math.sin(F.catT*0.08)*1;
      const catFacing=Math.sin(F.catT*0.05)>0?1:-1;
      cx.save();cx.translate(cx_,(cy_+catBob)|0);cx.scale(catFacing,1);
      // === КОТ В ПОЗЕ "СИДИТ В ПРОФИЛЬ" ===
      // Размеры: 9px шириной, 11px высотой. Лицом ВПРАВО (по умолчанию).
      // Тень под котом
      cx.fillStyle='rgba(0,0,0,0.32)';
      cx.fillRect(-4,5,9,1);

      // ТЕЛО — задняя часть, сидячая поза
      rc(-4,-1,6,5,'#dd8844');         // основная масса тела (зад)
      rc(-4,-1,6,1,'#ee9955');         // блик на спине
      rc(-4,3,6,1,'#aa6633');          // тень снизу
      // Полоски на боку (рыжий тигриный окрас)
      rc(-3,0,1,1,'#aa6633');
      rc(-1,0,1,1,'#aa6633');
      rc(1,0,1,1,'#aa6633');
      // Грудь (более светлая часть впереди)
      rc(2,1,2,3,'#ee9955');
      rc(2,1,2,1,'#ffaa66');           // блик на груди

      // ХВОСТ — изогнутый сзади (характерный для кота)
      const tailWag=F.catFound?0:Math.sin(F.catT*.15)*1;
      // Основание хвоста
      rc(-5,-1,1,2,'#dd8844');
      // Хвост идёт вверх и закручивается
      rc(-6,-2,1,2,'#dd8844');
      rc(-7,-3+tailWag,1,2,'#dd8844');
      rc(-7,-4+tailWag,1,1,'#aa6633');  // кончик хвоста темнее
      // Полоски на хвосте
      rc(-6,-1,1,1,'#aa6633');

      // ГОЛОВА — большая, спереди
      rc(0,-5,5,4,'#dd8844');         // основа головы
      rc(0,-5,5,1,'#ee9955');         // макушка
      rc(0,-2,5,1,'#aa6633');         // подбородок
      // Морда (выступает вперёд)
      rc(4,-3,1,2,'#ee9955');         // нос-выступ
      // УШИ — треугольные торчат вверх
      // Заднее ухо (видим основание сбоку)
      rc(0,-7,1,2,'#dd8844');
      rc(0,-7,1,1,'#aa6633');         // тёмная окантовка
      rc(1,-6,1,1,'#dd8844');
      // Переднее ухо (полностью видим)
      rc(3,-7,2,2,'#dd8844');
      rc(3,-7,2,1,'#aa6633');         // тёмная окантовка
      rc(4,-6,1,1,'#ffaaaa');         // розовая внутренность уха

      // ГЛАЗА — большие, светящиеся (один виден в профиль)
      const eyeOpen=F.catT%50<45;
      if(eyeOpen){
        cx.fillStyle=P.YEL;
        cx.fillRect(2,-4,2,2);          // жёлтая радужка
        cx.fillStyle='#000000';
        cx.fillRect(3,-4,1,2);          // вертикальный кошачий зрачок
        cx.fillStyle='#ffffff';
        cx.fillRect(2,-4,1,1);          // блик
      }else{
        // Прищуренный глаз
        cx.fillStyle='#aa6633';
        cx.fillRect(2,-3,2,1);
      }

      // НОС — маленький розовый треугольник
      cx.fillStyle='#ff6699';
      cx.fillRect(4,-2,1,1);

      // РОТ
      cx.fillStyle='#552233';
      cx.fillRect(4,-1,1,1);

      // УСЫ — три тонкие линии вперёд
      cx.fillStyle='#ffffff';
      cx.fillRect(5,-2,2,1);  // верхний ус
      cx.fillRect(5,-1,3,1);  // средний ус
      cx.fillRect(5,0,2,1);   // нижний ус

      // ПЕРЕДНИЕ ЛАПЫ — сидячая поза, лапы вместе
      rc(2,4,1,1,'#aa6633');
      rc(3,4,1,1,'#aa6633');
      // Подушечка лапок
      rc(2,4,1,1,'#221122');

      cx.restore();

      // Имя/подсказка над котом
      if(!F.catFound&&F.catT>30){
        const a=.6+.4*Math.sin(F.catT*.2);
        cx.globalAlpha=a;
        txcs('?',cx_-2,cy_-14,P.YEL,P.BLK,1);
        cx.globalAlpha=1;
        // Название как обнаружили
        if(F.catT>60){
          const w=gw('ГЕНЕРАЛ?')+4;
          bx2(cx_-w/2,cy_-22,w,9,P.UIB,P.YEL,1);
          txt('ГЕНЕРАЛ?',cx_-w/2+2,cy_-20,P.YEL,1);
        }
      }
      if(F.catFound){
        // Эффект подбора — кот за кораблём
        if(F.catPickT<60){
          // Сердечки вверх
          if(F.catPickT%6===0){
            PTS.push({x:F.catX+(Math.random()-.5)*4,y:F.catY-4,vx:(Math.random()-.5)*.4,vy:-.7,lf:40,ml:50,col:'#ff4488',sz:1,gv:0,fade:.5});
          }
        }
        // === ТЕКСТ ПОБЕДЫ + ОБЛОМОК ЛОГА ТИНЫ (РАСКРЫТИЕ) ===
        // Фаза 1 (10-60 кадр): "ГЕНЕРАЛ ВЫЖИЛ!" — короткая радость
        if(F.catPickT>10&&F.catPickT<60){
          const a=Math.min(1,(F.catPickT-10)/20)*Math.min(1,(60-F.catPickT)/15);
          cx.globalAlpha=a;
          txcs('ГЕНЕРАЛ ВЫЖИЛ!',LH/2-30,P.YEL,P.BLK,2);
          cx.globalAlpha=1;
        }
        // ★ v16 r2: Вместо обломка лога Тины — короткий диалог между игроком и Генералом (котом)
        // Тайминги:
        //  60-?: реплика игрока ("Так вот куда ты подевался!") — typewriter
        //  +60 пауза  →  реплика кота ("Мяу!") — typewriter
        //  +60 пауза  →  подсказка "ENTER — ЭПИЛОГ"
        const dlgStart=60;
        const playerLine='ТАК ВОТ КУДА ТЫ ПОДЕВАЛСЯ!';
        const catLine='МЯУ!';
        const TYPE_R=1.6;                                  // 1 символ за 1.6 кадра
        const playerEnd=dlgStart+(playerLine.length*TYPE_R|0);
        const playerHold=playerEnd+50;                     // держим реплику игрока 50 кадров
        const catStart=playerHold;
        const catEnd=catStart+(catLine.length*TYPE_R*1.4|0); // кот печатает чуть медленнее (драма)
        const catHold=catEnd+60;                            // держим реплику кота 60 кадров
        // Координаты двух "пузырей" — игрок снизу-слева, генерал снизу-справа (рядом с кораблём)
        if(F.catPickT>=dlgStart){
          const fadeIn=Math.min(1,(F.catPickT-dlgStart)/20);
          cx.globalAlpha=fadeIn;
          // Реплика игрока (низ-слева)
          const pBx=8,pBy=LH-50,pBw=LW/2-12,pBh=22;
          bx2(pBx,pBy,pBw,pBh,'#040a14',P.CYA,1);
          txs('ПИЛОТ:',pBx+3,pBy+2,P.CYA,P.BLK,1);
          const pCnt=Math.min(playerLine.length,((F.catPickT-dlgStart)/TYPE_R)|0);
          const pSub=playerLine.substring(0,pCnt);
          txs(pSub,pBx+3,pBy+11,P.WHT,P.BLK,1);
          // Курсор-мигалка пока печатает
          if(pCnt<playerLine.length&&Math.floor(F.catPickT/6)%2){
            rc(pBx+3+gw(pSub),pBy+11,2,5,P.WHT);
          }
          cx.globalAlpha=1;
        }
        if(F.catPickT>=catStart){
          const fadeIn=Math.min(1,(F.catPickT-catStart)/15);
          cx.globalAlpha=fadeIn;
          // Реплика кота (низ-справа)
          const cBx=LW/2+4,cBy=LH-50,cBw=LW/2-12,cBh=22;
          bx2(cBx,cBy,cBw,cBh,'#1a0a04',P.YEL,1);
          txs('ГЕНЕРАЛ:',cBx+3,cBy+2,P.YEL,P.BLK,1);
          const cCnt=Math.min(catLine.length,((F.catPickT-catStart)/(TYPE_R*1.4))|0);
          const cSub=catLine.substring(0,cCnt);
          // Реплика кота — крупный шрифт (драма)
          txs(cSub,cBx+3,cBy+10,P.YEL,P.BLK,2);
          if(cCnt<catLine.length&&Math.floor(F.catPickT/6)%2){
            rc(cBx+3+gw(cSub)*2,cBy+10,2,7,P.YEL);
          }
          // Маленькое сердечко рядом с репликой кота когда она допечатана
          if(cCnt>=catLine.length){
            const heartA=0.7+0.3*Math.sin(F.catPickT*0.18);
            cx.globalAlpha=fadeIn*heartA;
            cx.fillStyle='#ff4488';
            cx.fillRect(cBx+cBw-7,cBy+9,1,1);cx.fillRect(cBx+cBw-5,cBy+9,1,1);
            cx.fillRect(cBx+cBw-8,cBy+10,5,1);cx.fillRect(cBx+cBw-7,cBy+11,3,1);cx.fillRect(cBx+cBw-6,cBy+12,1,1);
          }
          cx.globalAlpha=1;
        }
        // Подсказка ENTER после кота
        if(F.catPickT>catHold&&Math.floor(F.catPickT/22)%2){
          txcs(USE_TOUCH_UI?'ТАП - ЭПИЛОГ':'ENTER - ЭПИЛОГ',LH-10,P.YEL,P.BLK,1);
        }
      }
      // Корабль игрока виден в этой сцене
      drwShip(G.pl.x,G.pl.y,0,F.catT,false,G.pl.hp/G.pl.mhp);
    }

    drwPts();drwSHK();drwFTX();drawFlash();clearShake();drawTrans();return;
  }

  // ★ Phase 3.2: финальная сцена с Райгаром — портрет + текст
  if(F.farewell&&!F.farewell.done){
    const ft=F.farewell.t;
    rc(0,0,LW,LH,'#000');
    drwStars();
    // Туманное свечение фоном
    const ga=Math.min(1,ft/40);
    cx.globalAlpha=ga*.35;
    disc(LW/2,LH/2-18,40+(ft%60)/2,'#1a2245');
    cx.globalAlpha=1;
    // Портрет Райгара — крупно, по центру (drwAlien без масштаба тут мал, используем scale)
    if(ft>10){
      const aA=Math.min(1,(ft-10)/40);
      cx.globalAlpha=aA;
      cx.save();
      cx.translate(LW/2,LH/2-22);
      cx.scale(2,2);
      drwAlien(0,0,ft,'sit',1);
      cx.restore();
      cx.globalAlpha=1;
    }
    // Имя
    if(ft>50){
      const aN=Math.min(1,(ft-50)/30);
      cx.globalAlpha=aN;
      txcs('РАЙГАР',LH/2+22,P.CYA,P.BLK,1);
      cx.globalAlpha=1;
    }
    // Печать реплики
    if(ft>90){
      const startType=90,TYPE_RATE=1.6;
      const lines=['ТЫ СДЕЛАЛ ЭТО.','СВЕТ ВЕРНУЛСЯ.'];
      const totalChars=lines.reduce((s,l)=>s+l.length,0);
      const charsToShow=Math.min(totalChars,Math.floor((ft-startType)/TYPE_RATE));
      let drawn=0;
      for(let i=0;i<lines.length;i++){
        const ln=lines[i];
        const vis=ln.substring(0,Math.max(0,charsToShow-drawn));
        if(vis.length>0)txcs(vis,LH/2+38+i*12,P.YEL,P.BLK,1);
        drawn+=ln.length;
      }
    }
    // Подсказка на пропуск
    if(ft>180&&Math.floor(ft/22)%2){
      txcs(USE_TOUCH_UI?'ТАП - ДАЛЬШЕ':'ENTER - ДАЛЬШЕ',LH-12,P.UIT2,P.BLK,1);
    }
    drwPts();drawFlash();drawTrans();return;
  }

  // Фон — центр системы
  const pulse=1+.08*Math.sin(t*.08);

  // ★ v16: Применяем трансформ камеры (зум + следование) для всего мирового слоя
  if(F.cam)applyFinaleCamera(F);

  // Если бой не начался — рисуем ту же огромную Тину что и в бою
  if(!F.battleActive||!F.tina){
    // ★ v16 r3: Используем тот же рендер что и в бою (огромная сфера Дайсона)
    // — это значит на zoom=1.0 в кадр влезает только её часть (по фидбеку #2)
    const fakeT={
      x:F.hx,y:F.hy,t:t,
      phase:1,hp:380,mhp:380,
      energyBlocks:null,turrets:null,weakSpots:null,
      reflectFlash:0,emergencyProtocol:null,
    };
    drwTinaBoss(fakeT);
    // Световые частицы — летят К сфере (поглощение). Расстояния x3.
    if(t%3===0){
      const a=Math.random()*Math.PI*2;
      const r=330+Math.random()*120;
      PTS.push({
        x:F.hx+Math.cos(a)*r,y:F.hy+Math.sin(a)*r,
        vx:-Math.cos(a)*1.0,vy:-Math.sin(a)*1.0,
        lf:60,ml:70,col:Math.random()<.4?P.YEL:'#ff8844',sz:1,gv:0,fade:.5
      });
    }
    // ★ v16 r6/r12: Корабль через offscreen → drawImage с zoom-aware nearest-neighbor
    // r12 #6: scale=0.8 во время кинематика (до диалога), 0.5 в бою
    if(F.cinematic&&(F.cinematic.phase!=='done')){
      drwPts();drwSHK();drwFTX();
      drwShipSharp(F,G,0.8);
    }else{
      drwPts();drwSHK();drwFTX();
    }
  }else{
    // ★ v16: Боевая сцена — рисуется в трансформе камеры (зум управляется системой выше)
    // Активный бой — рисуем ТИНУ (графика, без текста)
    const T=F.tina;
    if(!T.defeated){
      drwTinaBoss(T);
      // Снаряды ТИНЫ: основные атаки выглядят как лазерные копья.
      for(const b of G.ebuls){if(b.isTina){const x=b.x|0,y=b.y|0;drwEnemyBul(b);}}
      // ★ v16 r12 #8: Рендер ДРОНОВ — небольшие летающие враги Тины
      if(T.drones&&T.drones.length){
        for(const d of T.drones){
          const dx=d.x|0,dy=d.y|0;
          // Свечение при попадании
          if(d.flash>0){
            cx.globalAlpha=d.flash/4;
            disc(dx,dy,8,P.WHT);
            cx.globalAlpha=1;
          }
          // Тёмный контур
          rc(dx-5,dy-4,10,8,'#220000');
          // Тело
          rc(dx-4,dy-3,8,6,P.TINA2);
          // Светящееся ядро
          const corePulse=0.6+0.4*Math.sin(d.t*0.18);
          cx.globalAlpha=corePulse;
          rc(dx-2,dy-1,4,2,P.YEL);
          cx.globalAlpha=1;
          rc(dx-1,dy,2,1,P.WHT);
          // Антенны
          rc(dx-4,dy-5,1,1,P.RED);
          rc(dx+3,dy-5,1,1,P.RED);
          // HP-бар
          const hpFrac=d.hp/d.mhp;
          if(hpFrac<1){
            rc(dx-5,dy-7,10,1,'#220000');
            rc(dx-5,dy-7,Math.ceil(10*hpFrac),1,P.RED);
          }
        }
      }
      // ★ v16 r12 #8: Визуализация ЗАРЯЖАЮЩЕГОСЯ развёрточного лазера (фаза 3)
      if(T.chargingSweep){
        const cs=T.chargingSweep;
        if(cs.t<cs.duration){
          // Фаза заряжания — пульсирующая красная линия по сектору
          const chargeAlpha=Math.min(1,cs.t/cs.duration);
          const startA=cs.startAngle, endA=cs.endAngle;
          const rays=8;
          for(let i=0;i<rays;i++){
            const a=startA+(endA-startA)*(i/(rays-1));
            cx.globalAlpha=chargeAlpha*(0.3+0.3*Math.sin(cs.t*0.4+i));
            cx.strokeStyle=P.RED;cx.lineWidth=1;
            cx.beginPath();
            cx.moveTo(T.x-186,T.y);
            cx.lineTo(T.x-186+Math.cos(a)*400,T.y+Math.sin(a)*400);
            cx.stroke();
          }
          cx.lineWidth=1;cx.globalAlpha=1;
          // Ядро заряжается ярко
          cx.globalAlpha=chargeAlpha*(0.7+0.3*Math.sin(cs.t*0.3));
          disc(T.x-186,T.y,8+chargeAlpha*8,P.RED);
          cx.globalAlpha=chargeAlpha;
          disc(T.x-186,T.y,4+chargeAlpha*4,P.YEL);
          cx.globalAlpha=1;
        }
      }
    }else{
      // ТИНА побеждена — взрывные частицы
      if(t%2===0)spPts(T.x,T.y,3,[P.TINA,P.TINA2,P.ORA,P.WHT],.5,3,30,.03,2);
    }

    // Бонусы боя
    for(const pu of G.pups)drwPowerUp(pu);

    // Снаряды игрока
    for(const b of G.buls)drwBul(b);

    // ★ v24b: Сходящиеся дроны — рендер
    if(T&&T.chargeDrones&&T.chargeDrones.length){
      const pulse=0.6+0.4*Math.sin(F.t*0.2);
      for(const cd of T.chargeDrones){
        const cx_=cd.x|0,cy_=cd.y|0;
        cx.globalAlpha=pulse*0.4;disc(cx_,cy_,12,'#aa44ff');
        cx.globalAlpha=pulse*0.75;disc(cx_,cy_,6,P.PUR);
        cx.globalAlpha=1;disc(cx_,cy_,3,'#ffaaff');
        // HP bar
        if(cd.hp<cd.mhp){rc(cx_-8,cy_-11,16,2,'#220022');rc(cx_-8,cy_-11,Math.ceil(16*cd.hp/cd.mhp),2,P.PUR);}
        // Trail
        if(F.t%2===0)PTS.push({x:cd.x,y:cd.y,vx:-cd.vx*.3+(Math.random()-.5)*.4,vy:-cd.vy*.3+(Math.random()-.5)*.4,lf:10,ml:14,col:'#aa44ff',sz:1,gv:0,fade:.7});
        cx.globalAlpha=1;
        // Line to player (live target)
        cx.globalAlpha=0.2;cx.strokeStyle='#aa44ff';cx.lineWidth=1;
        cx.beginPath();cx.moveTo(cx_,cy_);cx.lineTo(G.pl.x|0,G.pl.y|0);cx.stroke();
        cx.globalAlpha=1;
      }
    }

    // ★ v24b: Движущийся луч — рендер в мировых координатах
    if(T&&T.sweepBeam){
      const sb=T.sweepBeam;
      const wb=F.worldBounds||{minX:-600,maxX:500};
      const w=wb.maxX-wb.minX;
      if(!sb.active){
        // Телеграф — мигающая предупредительная полоса
        cx.globalAlpha=0.25+0.2*Math.sin(sb.t*0.35);
        cx.fillStyle='#ffaa22';
        cx.fillRect(wb.minX,sb.y-sb.h/2,w,sb.h);
        // Рамка
        cx.globalAlpha=0.6;cx.strokeStyle='#ffcc44';cx.lineWidth=1;
        cx.strokeRect(wb.minX,sb.y-sb.h/2,w,sb.h);
      }else{
        // Активный луч — яркий и опасный
        cx.globalAlpha=0.55;cx.fillStyle='#ff3300';cx.fillRect(wb.minX,sb.y-sb.h/2,w,sb.h);
        cx.globalAlpha=0.9;cx.fillStyle='#ff6633';cx.fillRect(wb.minX,sb.y-2,w,4);
        cx.globalAlpha=1;cx.fillStyle='#ffcc88';cx.fillRect(wb.minX,sb.y-1,w,2);
      }
      cx.lineWidth=1;cx.globalAlpha=1;
    }


    drwPts();drwSHK();drwFTX();

    // ★ v16 r6: Корабль и щит — через offscreen + drawImage с zoom-aware масштабом
    drwShipSharp(F,G,0.5);
  }

  // ★ v16: Снимаем трансформ камеры — далее идут HUD и тексты в экранных координатах
  if(F.cam)clearFinaleCamera(F);

  // ★ v24b: Виньетка опасности — радиальный градиент от центра к краям
  if(F.battleActive&&F.tina&&F.tina.emergencyProtocol&&!F.tina.emergencyProtocol.starWaiting){
    const eT=F.tina.emergencyProtocol.t;
    let vigA=0;
    if(eT>=60&&eT<1020){
      const danger=Math.min(1,(eT-60)/960);
      const pulse=0.7+0.3*Math.sin(t*0.14);
      vigA=danger*pulse*0.72;
    }else if(eT>=1020&&eT<1200){
      vigA=Math.max(0,1-(eT-1020)/180)*0.3;
    }
    if(vigA>0.01){
      // Радиальный градиент: прозрачный центр → тёмно-красные края
      const cx_=LW/2,cy_=LH/2;
      const innerR=Math.min(LW,LH)*0.18;
      const outerR=Math.hypot(LW,LH)*0.6; // покрывает все углы
      const grad=cx.createRadialGradient(cx_,cy_,innerR,cx_,cy_,outerR);
      grad.addColorStop(0,'rgba(0,0,0,0)');
      grad.addColorStop(0.45,'rgba(40,0,0,0)');
      grad.addColorStop(1,`rgba(90,0,0,${vigA.toFixed(2)})`);
      cx.fillStyle=grad;
      cx.fillRect(0,0,LW,LH);
    }
  }

  // === ТЕКСТ И HP-БАРЫ — РИСУЕМ БЕЗ SCALE ДЛЯ ЧЁТКОСТИ ===
  if(F.battleActive&&F.tina){
    const T=F.tina;
    const hideBar=T.emergencyProtocol&&T.emergencyProtocol.t>=1740;
    // ★ v24b: Плавное исчезновение при входе в экстра режим (eT 0→60)
    const barAlpha=T.emergencyProtocol?Math.max(0,1-T.emergencyProtocol.t/60):1;
    if(!T.defeated&&!hideBar&&barAlpha>0){
      cx.globalAlpha=barAlpha;
      // ★ v24b: Смещено ниже для лучшей видимости (было y=20/12, стало y=28/19)
      if(T.phase>=2){
        rc(40,28,240,8,'#220000');
        rc(40,28,(240*(T.hp/T.mhp))|0,8,T.hp/T.mhp>0.5?P.TINA:P.TINA3);
        if(T.hp/T.mhp<0.5&&Math.floor(t/10)%2){rc(40,28,(240*(T.hp/T.mhp))|0,8,P.RED);}
        cx.strokeStyle=P.TINA2;cx.lineWidth=.5;cx.strokeRect(40,28,240,8);
      }else{
        // В фазе 1 показываем счётчик энергоблоков вместо HP
        const ebsAlive=T.energyBlocks?T.energyBlocks.filter(e=>e.alive).length:0;
        rc(40,28,240,8,'#001833');
        rc(40,28,(240*(ebsAlive/3))|0,8,P.CYA);
        cx.strokeStyle=P.CYA;cx.lineWidth=.5;cx.strokeRect(40,28,240,8);
        txs('НЕУЯЗВИМА',(LW-gw('НЕУЯЗВИМА'))/2,29,'#003344',P.BLK,1);
      }
      txcs('ТИНА - СФЕРА ДАЙСОНА',19,P.TINA2,P.BLK,1);
      cx.globalAlpha=1;
      // ★ v16 r12: Индикатор фазы убран — пользователь просил без банеров фаз
    }
  }

  // ★ v22: Стрелка к звезде — скрывается СРАЗУ при движении вправо, появляется при остановке
  if(F.battleActive&&F.tina&&F.tina.emergencyProtocol&&F.tina.emergencyProtocol.starWaiting){
    const eP=F.tina.emergencyProtocol;
    // Только скорость вправо управляет видимостью
    const showArrow=G.pl.vx<=0.1;
    if(showArrow){
      const t=eP.starWaitT;
      const arrowY=(LH/2)|0;
      const blink=0.6+0.4*Math.sin(t*0.13);
      // Скользящая анимация: шевроны «текут» вправо
      const slide=((Math.sin(t*0.09)+1)*0.5*4)|0; // 0..4px
      // — Панель (тёмный синеватый фон) —
      cx.globalAlpha=0.78;
      rc(LW-42,arrowY-25,42,50,'#020c1a');
      cx.globalAlpha=1;
      // Светящийся левый бордер (cyan glow)
      cx.globalAlpha=blink;
      cx.fillStyle=P.L1;   // #18ffee
      cx.fillRect(LW-42,arrowY-25,1,50);
      // Верхний и нижний бордер (приглушённее)
      cx.fillStyle='#0a3a4a';
      cx.fillRect(LW-41,arrowY-25,41,1);
      cx.fillRect(LW-41,arrowY+24,41,1);
      cx.globalAlpha=1;
      // — Три шеврона «>>>» с волновой прозрачностью —
      // ci=0 дальний (тусклый), ci=2 ближний к краю (яркий)
      for(let ci=0;ci<3;ci++){
        const wave=(Math.sin(t*0.07-ci*0.7)+1)*0.5; // 0..1
        const alpha=blink*(0.18+0.28*ci+0.22*wave);
        const bx=(LW-36+ci*9+slide)|0;
        const by=arrowY;
        cx.globalAlpha=Math.min(1,alpha);
        // Тень шеврона (1px смещение)
        cx.fillStyle='#001c2c';
        for(let r=0;r<5;r++){cx.fillRect(bx+r+1,by-4+r+1,1,9-2*r);}
        // Основной шеврон
        cx.fillStyle=ci===2?P.L1L:P.L1; // #a8fff4 или #18ffee
        for(let r=0;r<5;r++){cx.fillRect(bx+r,by-4+r,1,9-2*r);}
        // Блик (1px ярче на первом столбце)
        if(ci===2){cx.fillStyle='#ffffff';cx.globalAlpha=alpha*0.35;cx.fillRect(bx,by-4,1,9);}
        cx.globalAlpha=1;
      }
      // — Подпись «ТУДА» под шевронами —
      cx.globalAlpha=blink*0.75;
      txs('ТУДА',(LW-28)|0,(arrowY+17)|0,P.L1,'#001422',1);
      cx.globalAlpha=1;
      // Звуковой хинт после долгого простоя (каждые 1.5 сек)
      if(eP.starWaitT>120&&t%90===0)bip(660,.18,.15,'sine',880,440);
    }
  }

  drawFlash();clearShake();

  // HUD
  rc(0,0,LW,16,P.UIB);rc(0,15,LW,1,P.DIM);
  txs('ЦЕНТР СИСТЕМЫ',4,3,P.PUR,P.BLK,1);
  if(F.battleActive){
    // ХП игрока — приоритет в HUD
    txt('ХП',76,3,P.UIT2,1);
    bar(90,3,42,5,G.pl.hp/G.pl.mhp,G.pl.hp/G.pl.mhp<.3?P.HPH:P.HP,P.HPB,P.DIM);
    txt(Math.floor(G.pl.hp)+'/'+G.pl.mhp,134,3,P.WHT,1);
    // Щит, если есть
    if(G.campaignState.inventory.shieldBuilt){
      txt('ЩИТ',76,10,P.CYA,1);
      bar(90,10,42,4,G.pl.shield/600,P.CYA,'#001133',P.DIM);
    }else{
      // Энергия игрока вместо щита
      txt('ЭН',76,10,P.UIT2,1);
      bar(90,10,42,4,G.pl.en/G.pl.men,G.pl.en<20?P.ENL:P.EN,P.DIM2,P.DIM);
    }
    // Звёздная батарея (правый блок)
    if(G.campaignState.inventory.starBattery){
      const bp=.7+.3*Math.sin(t*.15);
      cx.globalAlpha=bp;
      txs('* ЗВ.БАТ *',180,3,P.YEL,P.BLK,1);
      cx.globalAlpha=1;
    }
    // Подсказка управления
    if(USE_TOUCH_UI)txt('ТАП=ОГОНЬ',180,10,P.UIT2,1);
    else txt('ПРОБЕЛ=ОГОНЬ',180,10,P.UIT2,1);
  }else{
    txt(USE_TOUCH_UI?'*=ДАЛЕЕ':'E/ENTER=ДАЛЕЕ',LW-92,3,P.YEL,1);
  }
  // Особый вариант: позиция сверху (ny=30), цвет PUR
  if(G.notifT>0&&G.notif){const oldCol=G.notifCol;G.notifCol=P.PUR;drwNotif(G,30);G.notifCol=oldCol;}
  // ★ v16 r8: Баннер «ФАЗА N» убран — пользователь попросил, и так без него понятно.
  // (Эффекты — взрывы, частицы, shake, flash, перестройка щита — самодостаточны)
  // ★ v16 r7: Реплика Тины «ХВАТИТ ИГР! ПЕРЕХОЖУ В ЭКСТРА РЕЖИМ!» в начале катсцены
  if(F.battleActive&&F.tina&&F.tina.emergencyProtocol){
    const eT=F.tina.emergencyProtocol.t;
    if(eT<300){
      // Двухфазный диалог: 0-30 fade-in, 30-240 hold, 240-300 fade-out
      const a=Math.min(1,eT/20)*Math.max(0,1-(eT-260)/40);
      // Фон диалога — красная плашка с рамкой
      cx.globalAlpha=a*0.85;
      rc(8,LH-44,LW-16,32,'#220000');
      cx.globalAlpha=a;
      cx.strokeStyle=P.RED;cx.lineWidth=1;
      cx.strokeRect(8,LH-44,LW-16,32);
      // Двойная рамка для эффекта
      rc(8,LH-44,LW-16,1,'#ff4422');
      rc(8,LH-13,LW-16,1,'#ff4422');
      // Имя
      txs('ТИНА:',12,LH-40,P.RED,P.BLK,1);
      // Реплика — в две строки
      // 1: ХВАТИТ ИГР!
      // 2: ПЕРЕХОЖУ В ЭКСТРА РЕЖИМ!
      const line1='ХВАТИТ ИГР!';
      const line2='ПЕРЕХОЖУ В ЭКСТРА РЕЖИМ!';
      // Typewriter для драмы
      const charsTotal=line1.length+line2.length;
      const charsShown=Math.min(charsTotal,Math.floor((eT-15)/1.2));
      let s1=line1.substring(0,Math.min(line1.length,charsShown));
      let s2=charsShown>line1.length?line2.substring(0,charsShown-line1.length):'';
      txs(s1,12,LH-30,P.WHT,P.BLK,1);
      txs(s2,12,LH-22,P.WHT,P.BLK,1);
      // Курсор-мигалка
      if(charsShown<charsTotal&&Math.floor(eT/4)%2){
        const ly=charsShown<=line1.length?LH-30:LH-22;
        const lt=charsShown<=line1.length?s1:s2;
        rc(12+gw(lt),ly,3,5,P.WHT);
      }
      cx.globalAlpha=1;
    }
  }
  // ★ v16 r2: Брифинг пришельца на фазах Тины (раньше не вызывался в финале — поэтому подсказки между фазами не появлялись)
  drwAlienBriefing(G);
  drwPauseIcon();
  drwDialog(G);drwJoystick();drwActionBtns();
  if(G.paused)drwPauseOverlay(G);
  drawTrans();
}

// ======= ЭКРАН ПОБЕДЫ =======
function initVictoryScreen(G){
  TAP_FIRE=false;G.state='credits';G.credT=0;
  resetBtns();if(USE_TOUCH_UI)addBtn('ok',LW-20,LH-20,12,'OK',P.YEL);
  PTS.length=0;SHK.length=0;FTX.length=0;initStars();G.transIn=40;
  // Победный фейерверк
  for(let i=0;i<5;i++){
    setTimeout(()=>{
      spPts(30+Math.random()*260,20+Math.random()*140,30,[P.TINA3,P.YEL,P.WHT,P.GRN],1,4,50,.01,2.5);
      addShockwave(30+Math.random()*260,20+Math.random()*140,30,P.YEL,20);
    },i*200);
  }
}

function updCredits(G){
  G.credT++;scrollStars(.3);updPts();
  if(G.credT%5===0)PTS.push({x:Math.random()*LW,y:20+Math.random()*(LH-40),vx:(Math.random()-.5)*.4,vy:-.5-Math.random()*.5,lf:60,ml:70,col:Math.random()<.5?P.TINA3:P.YEL,sz:1,gv:-.005,fade:.6});
  const ok=KD.Enter||KD.Space||mC||btnJust('ok');
  if(ok&&G.credT>60){sfxUI2();startTrans(()=>initTitle(G));}
}

function drwCredits(G){
  rc(0,0,LW,LH,P.BG);drwNebula();drwStars();drwPts();
  const t=G.credT;
  // Сохранённая система: пульсирующая звезда с планетами на орбитах
  const starPulse=0.85+0.15*Math.sin(t*0.055);
  const sX=LW/2,sY=LH/2;
  // Внешнее свечение звезды
  cx.globalAlpha=0.12*starPulse;disc(sX,sY,(85*starPulse)|0,'#ffee44');
  cx.globalAlpha=0.25*starPulse;disc(sX,sY,(55*starPulse)|0,'#ffff88');
  cx.globalAlpha=0.55*starPulse;disc(sX,sY,(28*starPulse)|0,'#ffffff');
  cx.globalAlpha=0.9*starPulse;disc(sX,sY,(14*starPulse)|0,'#ffffff');
  cx.globalAlpha=1;
  // Орбитальные кольца
  cx.globalAlpha=.28;ring(sX,sY,38,P.CYA,1);ring(sX,sY,60,P.BUB3,1);ring(sX,sY,84,P.KRZ3,1);cx.globalAlpha=1;
  // Три планеты по орбитам
  const pls=[{r:38,c:P.KRZ3,s:6,ph:0,name:'KRZ'},{r:60,c:P.BUB1,s:5,ph:2.1,name:'BUB'},{r:84,c:P.PL1,s:5,ph:4.3,name:'ДРОШ'}];
  for(const pln of pls){
    const a=t*0.012+pln.ph;
    const px=(sX+Math.cos(a)*pln.r)|0,py=(sY+Math.sin(a)*pln.r)|0;
    // Орбитальный след
    cx.globalAlpha=0.18;
    for(let i=1;i<=6;i++){const ta=a-i*0.12;cx.fillStyle=pln.c;cx.fillRect((sX+Math.cos(ta)*pln.r)|0,(sY+Math.sin(ta)*pln.r)|0,2,2);}
    cx.globalAlpha=1;
    disc(px,py,pln.s,pln.c);
    // Луна у планет
    if(pln.r>50){const ma=t*0.04+pln.ph;disc((px+Math.cos(ma)*8)|0,(py+Math.sin(ma)*8)|0,2,'#888899');}
  }
  // Лучи освобождённой звезды
  for(let i=0;i<10;i++){
    const a=i/10*Math.PI*2+t*0.006;
    const len=(12+8*Math.sin(t*0.07+i))*starPulse;
    cx.globalAlpha=0.28*starPulse;cx.strokeStyle=i%2?'#ffff44':'#ffee88';cx.lineWidth=1;
    cx.beginPath();cx.moveTo(sX,sY);cx.lineTo((sX+Math.cos(a)*len)|0,(sY+Math.sin(a)*len)|0);cx.stroke();
  }
  cx.globalAlpha=1;
  // Заголовок
  txcs('SINTARA',10,P.TINA3,P.BLK,3);
  txcs('ЗВЕЗДА СВОБОДНА',30,P.YEL,P.BLK,1);
  const lines=[
    'ТИНА ВЗОРВАЛАСЬ - И РАСКОЛОЛАСЬ НА 52 КУСОЧКА.',
    'ДРОШ: ПЕРВЫЙ РАССВЕТ ЗА 3 ГОДА.',
    'БУББЛИКА: БЛАБ ДЕЛАЕТ СОРОК ВТОРУЮ ПОПЫТКУ.',
    'КРАСНОЗЁМ: МРАУ НАШЁЛ ГЕНЕРАЛА. ВКУСНЯШКА ВЫДАНА.',
    'ЗОРП ВСЁ ЕЩЁ КРУТИТ ПЕДАЛИ. ПО ИНЕРЦИИ.',
    'СИСТЕМА СПАСЕНА. СВЕТ ВЕРНУЛСЯ.',
    'P.S. ГЕНЕРАЛ ДОЕДАЕТ ПРОВОДА. УЖЕ ЧЕТВЁРТЫЙ.',
  ];
  cx.globalAlpha=Math.min(1,(t-15)/35);
  for(let i=0;i<lines.length;i++)txcs(lines[i],54+i*13,i%2?P.S2:P.UIT2,P.BLK,1);
  cx.globalAlpha=1;
  if(t>130&&Math.floor(t/22)%2){const msg=USE_TOUCH_UI?'ТАП - МЕНЮ':'ENTER - МЕНЮ';txcs(msg,LH-14,P.YEL,P.BLK,1);}
  drawTrans();
}
