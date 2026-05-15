// ============================================================
// 02-checkpoint.js
// Checkpoint save/load + DEV state flags
// depends on: 01-core.js
// (originally sintara_v25.html lines 15-32)
// ============================================================

// ======= CHECKPOINT SYSTEM =======
function deepCopy(obj){return JSON.parse(JSON.stringify(obj));}
function saveCheckpoint(G,type){
  G.checkpoint={
    type,
    campaignState:deepCopy(G.campaignState),
    pl:deepCopy(G.pl),
    ship:G.ship?deepCopy(G.ship):null,
    departPlanet:G.campaignState.currentPlanet||'drosh',
  };
  // ★ Phase 2.3: для чекпоинтов между фазами Тины сохраняем её состояние
  //   (HP, текущая фаза/субфаза). При смерти восстанавливаем бой с текущей фазы,
  //   а не с начала — снижает фрустрацию на длинном бою.
  if(typeof type==='string'&&type.indexOf('finale_phase_')===0&&G.finale&&G.finale.tina){
    const T=G.finale.tina;
    G.checkpoint.tinaPhase=T.phase;
    G.checkpoint.tinaSubphase=T.subphase;
    G.checkpoint.tinaHp=T.hp;
    G.checkpoint.tinaMhp=T.mhp;
    G.checkpoint.tinaPhase4entered=!!T.phase4entered;
  }
}
// ================================

// ======= DEV STATE (никогда не сбрасывается вместе с G) =======
const _DEV={immortal:false,speedMult:1,dmgMult:1};
const _DEV_SPEEDS=[1,2,5,10];
const _DEV_DMGS=[1,2,5,10];
// =============================================================
