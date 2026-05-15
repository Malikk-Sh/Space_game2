// ============================================================
// 01-core.js
// Canvas setup, viewport, color palette, resize handler
// (originally sintara_v25.html lines 5-13)
// ============================================================

const CV=document.getElementById('c');let cx=CV.getContext('2d');
const _MAIN_CX=cx;
const LW=320,LH=180;
const IS_TOUCH=('ontouchstart' in window)||navigator.maxTouchPoints>0;
let USE_TOUCH_UI=IS_TOUCH;
function resize(){const W=innerWidth,H=innerHeight;const portrait=H>W;document.getElementById('rot').classList.toggle('on',IS_TOUCH&&portrait&&W<500);const s=Math.max(1,Math.min(W/LW,H/LH));CV.style.width=(LW*s|0)+'px';CV.style.height=(LH*s|0)+'px';CV.width=LW;CV.height=LH;cx.imageSmoothingEnabled=false;}
resize();addEventListener('resize',resize);addEventListener('orientationchange',()=>setTimeout(resize,150));

const P={BG:'#05050f',BG2:'#0a0a1c',S1:'#ffffff',S2:'#9ab0d0',S3:'#34405e',S4:'#151a2e',SH1:'#46aaff',SH2:'#1a66cc',SH3:'#a8dcff',SH4:'#0a3870',COC:'#b8ffee',TH1:'#ff8800',TH2:'#ffee44',TH3:'#ffccaa',A1:'#8a95a5',A2:'#4a5060',A3:'#b0bbca',A4:'#2a3040',L1:'#18ffee',L1L:'#a8fff4',L2:'#ffee22',L2L:'#ffffaa',L3:'#ff4422',L3L:'#ff9966',RES:'#ffdd44',RES2:'#cc8800',RES3:'#ffee88',EN:'#44ff66',ENL:'#ff3300',EN2:'#00aa33',HP:'#ee2222',HPB:'#220000',HPH:'#ff6666',UIB:'#03080e',UIB2:'#081426',UIT:'#44ccff',UIT2:'#aadeff',UIT3:'#66aadd',YEL:'#ffee22',CYA:'#00ffff',RED:'#ff2200',GRN:'#22ff44',DIM:'#003355',DIM2:'#002040',ORA:'#ff8811',PL1:'#5588aa',PL2:'#88aabb',PLD:'#1a2d3e',ICE:'#aaccee',IC2:'#7799bb',IC3:'#ddeeff',DOM:'#1a3355',DO2:'#2a4466',DOG:'#66aacc',NPC:'#ffcc88',DLG:'#001224',DLB:'#0055aa',WHT:'#ffffff',BLK:'#000000',PUR:'#aa44ff',PUR2:'#6622aa',SCAN:'#002244',PIR:'#993311',PIR2:'#661a08',PIR3:'#ff4422',BUB1:'#cc88cc',BUB2:'#8844aa',BUB3:'#ffaaee',BUB_ATM:'#331144',BUB_GAS1:'#5a2266',BUB_GAS2:'#7a3388',BUB_GAS3:'#9944aa',KRZ1:'#cc5522',KRZ2:'#882211',KRZ3:'#ffaa66',KRZ_ATM:'#441100',CTR:'#06020a',CTR2:'#160624',TINA:'#ff6600',TINA2:'#cc3300',TINA3:'#ff9944',TINA_CORE:'#ffcc00'};
