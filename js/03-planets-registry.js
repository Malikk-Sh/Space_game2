// ============================================================
// 03-planets-registry.js
// PLANETS registry + landOnTargetPlanet dispatcher
// depends on: 01-core.js (forward refs init*Planet from 14-scenes-planets.js, 16-scene-finale.js)
// (originally sintara_v25.html lines 33-35)
// ============================================================

const PLANETS = {
  drosh: {
    id: 'drosh', name: 'ДРОШ', stateName: 'planet_drosh',
    approachCol: P.PL1, approachAtmo: P.PLD, approachCap: P.IC3,
    nextPlanet: 'bubblika', arrivedText: 'ПРИБЛИЖЕНИЕ: ДРОШ',
  },
  bubblika: {
    id: 'bubblika', name: 'БУББЛИКА', stateName: 'planet_bubblika',
    approachCol: P.BUB1, approachAtmo: P.BUB_ATM, approachCap: P.BUB3,
    nextPlanet: 'krasnozem', arrivedText: 'ПРИБЛИЖЕНИЕ: БУББЛИКА',
  },
  krasnozem: {
    id: 'krasnozem', name: 'КРАСНОЗЁМ', stateName: 'planet_krasnozem',
    approachCol: P.KRZ1, approachAtmo: P.KRZ_ATM, approachCap: P.KRZ3,
    nextPlanet: 'center', arrivedText: 'ПРИБЛИЖЕНИЕ: КРАСНОЗЁМ',
  },
  center: {
    id: 'center', name: 'ТИНА', stateName: 'finale_tina',
    approachCol: P.CTR2, approachAtmo: P.CTR, approachCap: P.PUR2,
    nextPlanet: null, arrivedText: 'СИГНАЛ: ЦЕНТР - ТИНА',
  },
};

function landOnTargetPlanet(G) {
  const id = G.campaignState.targetPlanet || 'drosh';
  G.campaignState.currentPlanet = id;
  if (!G.campaignState.planetsVisited.includes(id)) {
    G.campaignState.planetsVisited.push(id);
  }
  if (id === 'drosh')     return initPlanetDrosh(G);
  if (id === 'bubblika')  return initPlanetBubblika(G);
  if (id === 'krasnozem') return initPlanetKrasnozem(G);
  if (id === 'center')    return initFinaleTina(G);
  // фолбэк на случай неизвестной планеты
  G.campaignState.targetPlanet = 'drosh';
  return initPlanetDrosh(G);
}
