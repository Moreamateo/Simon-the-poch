/* Five nights, graph-constrained AI and positional audio. No independent AI timers. */
const NIGHT_CONFIG=[null,
 {move:[10,14],reaction:10,doorHold:1.3,reroute:.04,sewerWeight:.15,watchSlow:1.45,retreat:8,flashCost:.5,flashCooldown:1000,ductStep:2.5},
 {move:[8,12],reaction:8.5,doorHold:1.6,reroute:.10,sewerWeight:.22,watchSlow:1.35,retreat:7,flashCost:.8,flashCooldown:1100,ductStep:2.2},
 {move:[6.5,10],reaction:7,doorHold:1.9,reroute:.17,sewerWeight:.30,watchSlow:1.25,retreat:6,flashCost:1,flashCooldown:1200,ductStep:1.9},
 {move:[5.2,8],reaction:5.6,doorHold:2.2,reroute:.24,sewerWeight:.36,watchSlow:1.15,retreat:5,flashCost:1.3,flashCooldown:1400,ductStep:1.6},
 {move:[4,6.8],reaction:4.4,doorHold:2.6,reroute:.32,sewerWeight:.42,watchSlow:1.05,retreat:4,flashCost:1.6,flashCooldown:1600,ductStep:1.3}
];
// Camera-to-camera corridors visible in the supplied map. Office is an attack endpoint, never a shortcut.
const ROOM_GRAPH={1:[2,5,3],2:[1,3,9],3:[1,2,4],4:[3,10],5:[1,6],6:[5,7],7:[6],8:[10],9:[2],10:[4,8,11],11:[10]};
const NIGHT_SAVE_KEY='simon-five-nights-v1';
let unlockedNight=1,selectedNight=1,currentNight=1,gateClosed=false,ductDepth=0,ductAdvance=0,defenseTime=0,retreatGrace=0,victoryTimer=0;
try{const p=JSON.parse(localStorage.getItem(NIGHT_SAVE_KEY)||'{}');unlockedNight=Math.max(1,Math.min(5,Number(p.unlocked)||1));selectedNight=Math.max(1,Math.min(unlockedNight,Number(p.selected)||1))}catch{}
function nightSettings(){return NIGHT_CONFIG[currentNight]}
function saveNights(){try{localStorage.setItem(NIGHT_SAVE_KEY,JSON.stringify({unlocked:unlockedNight,selected:selectedNight}))}catch{}}
function selectNight(n){if(!Number.isInteger(n)||n<1||n>unlockedNight||introActive)return;selectedNight=n;saveNights();renderNightMenu()}
function renderNightMenu(){
 // Selector de noches oculto: la mecánica de 5 noches sigue; solo se muestra la etiqueta.
 const box=$('nightSelector');if(box){box.hidden=true;box.replaceChildren()}
 const startLbl=$('startNightLabel');
 const contLbl=$('continueNightLabel');
 if(startLbl)startLbl.textContent='Noche '+selectedNight;
 if(contLbl)contLbl.textContent='Noche '+currentNight;
 const startSpan=$('startBtn')&&$('startBtn').querySelector('span');
 const contSpan=$('continueBtn')&&$('continueBtn').querySelector('span');
 if(startSpan)startSpan.textContent='New Game';
 if(contSpan)contSpan.textContent='Continue';
}
function shortestRoomPath(start,target){const q=[[start]],seen=new Set([start]);while(q.length){const path=q.shift(),node=path.at(-1);if(node===target)return path;for(const next of ROOM_GRAPH[node])if(!seen.has(next)){seen.add(next);q.push([...path,next])}}throw Error('Rooms not connected')}
function chooseTarget(exclude=0){const sewer=nightSettings().sewerWeight,choices=[[7,(1-sewer)/2],[8,(1-sewer)/2],[11,sewer]].filter(([n])=>n!==exclude);let r=Math.random()*choices.reduce((s,x)=>s+x[1],0);for(const [n,w] of choices){r-=w;if(r<=0)return n}return choices.at(-1)[0]}
function planSimonRoute(start=room(),exclude=0){
 const target=chooseTarget(exclude);let rooms=shortestRoomPath(start,target);
 // Bathrooms are a real dead-end patrol: enter and leave via the dining room.
 if(rooms.includes(2)&&Math.random()<nightSettings().reroute){const i=rooms.indexOf(2);rooms.splice(i+1,0,9,2)}
 route={name:target===7?'izquierda':target===8?'derecha':'alcantarilla',guard:target===7?'left':target===8?'right':'gate',rooms};routeStep=0;
}
function nextMoveDelay(){const c=nightSettings();return c.move[0]+Math.random()*(c.move[1]-c.move[0])}
function moveSimonTo(next){
 const previous=room();if(!ROOM_GRAPH[previous].includes(next))throw Error(`Invalid Simon move ${previous} -> ${next}`);
 routeStep++;if(room()!==next)throw Error('Route/state mismatch');dangerTime=0;defenseTime=0;ductDepth=0;ductAdvance=0;
 playMovementSound(previous,next);
}
function retreatSimon(scream=false){
 const from=room(),next=ROOM_GRAPH[from][0];
 stopSpatialSounds();
 // One adjacent step only; every later step still uses ROOM_GRAPH.
 route={rooms:[from,next],guard:route.guard,name:route.name};routeStep=0;moveSimonTo(next);
 if(scream)playSpatialSound('scream',0,.65,4500);
 planSimonRoute(next,from);moveIn=nightSettings().retreat;retreatGrace=moveIn;dangerTime=0;defenseTime=0;ductDepth=0;
}
function advanceSimon(dt){
 const c=nightSettings();retreatGrace=Math.max(0,retreatGrace-dt);
 if(routeStep===route.rooms.length-1){
  if(protectedAccess()){defenseTime+=dt;if(defenseTime>=c.doorHold){retreatSimon();return}}
  else defenseTime=0;
  if(room()===11&&ductDepth<2){ductAdvance+=dt;if(ductAdvance>=c.ductStep){ductAdvance-=c.ductStep;ductDepth++;playSpatialSound('duct',0,.22+ductDepth*.14,650+ductDepth*250,true)}return}
  dangerTime+=dt;
  if(!protectedAccess()&&dangerTime>=c.reaction){end(false);return}
 }else{
  moveIn-=dt/(showCamera&&sel===room()?c.watchSlow:1);
  if(moveIn<=0){
   const here=room();
   if(retreatGrace===0&&ROOM_GRAPH[here].length>1&&Math.random()<c.reroute)planSimonRoute(here);
   if(route.rooms.length>1)moveSimonTo(route.rooms[routeStep+1]);
   moveIn=nextMoveDelay();
  }
 }
}
function toggleSewerGate(){if(!running||blackout||introActive)return;gateClosed=!gateClosed;beep(gateClosed?170:220,.08);update()}
function updateNightUI(){
 $('nightLabel').textContent='Noche '+currentNight;
 const b=$('sewerGate');
 if(b){b.hidden=true;b.setAttribute('aria-hidden','true')}
 const duct=$('ductShutter');if(duct)duct.classList.toggle('down',!!gateClosed);
}
function resetNightSystems(){clearTimeout(victoryTimer);$('victoryTransition').hidden=true;document.body.classList.remove('attacking');stopSpatialSounds();currentNight=selectedNight;gateClosed=false;ductDepth=0;ductAdvance=0;defenseTime=0;retreatGrace=0;dangerTime=0;}
function winNight(){
 stopSpatialSounds();unlockedNight=Math.max(unlockedNight,Math.min(5,currentNight+1));selectedNight=Math.min(5,currentNight+1);saveNights();renderNightMenu();
 $('victoryTransition').hidden=false;$('victoryTransition').textContent='6 AM';beep(720,.35,'sine');
 victoryTimer=setTimeout(()=>{$('victoryTransition').hidden=true;$('menu').classList.remove('hidden');syncMenuMusic()},1800);
}
const SPATIAL_FILES={left:'recursos/sonidos/pasos_izquierda.mp3',right:'recursos/sonidos/pasos_derecha.mp3',scream:'recursos/sonidos/grito_simon.mp3',duct:'recursos/sonidos/alcantarilla.mp3'};
const spatialBytes={};let spatialReady=null,spatialBuffers={},spatialLoading=null,spatialActive=new Map();
function preloadSpatialAudio(){return spatialReady??=Promise.all(Object.entries(SPATIAL_FILES).map(async([k,url])=>{const r=await fetch(url);if(!r.ok)throw Error(url);spatialBytes[k]=await r.arrayBuffer()}))}
async function unlockGameAudio(){
 soundContext??=new (window.AudioContext||window.webkitAudioContext)();await soundContext.resume();
 if(!spatialLoading)spatialLoading=(async()=>{await preloadSpatialAudio();for(const [k,bytes] of Object.entries(spatialBytes)){const decoded=await soundContext.decodeAudioData(bytes.slice(0)),mono=soundContext.createBuffer(1,decoded.length,decoded.sampleRate),out=mono.getChannelData(0);for(let ch=0;ch<decoded.numberOfChannels;ch++){const input=decoded.getChannelData(ch);for(let i=0;i<out.length;i++)out[i]+=input[i]/decoded.numberOfChannels}spatialBuffers[k]=mono}})();
 return spatialLoading;
}
function stopSpatialSounds(){for(const stop of spatialActive.values())stop();spatialActive.clear()}
function playSpatialSound(kind,pan,volume,cutoff=2000,underground=false){
 if(muted||!running||document.hidden||!spatialBuffers[kind]||soundContext.state!=='running')return;
 const channel=kind==='scream'?'scream':'movement';spatialActive.get(channel)?.();
 const source=soundContext.createBufferSource(),filter=soundContext.createBiquadFilter(),gain=soundContext.createGain(),panner=soundContext.createStereoPanner(),delay=soundContext.createDelay(.3),wet=soundContext.createGain();
 source.buffer=spatialBuffers[kind];filter.type='lowpass';filter.frequency.value=cutoff;gain.gain.value=volume;panner.pan.value=pan;delay.delayTime.value=underground?.13:.065;wet.gain.value=underground?.16:.08;
 source.connect(filter);filter.connect(gain);gain.connect(panner);gain.connect(delay);delay.connect(wet);wet.connect(panner);panner.connect(soundContext.destination);
 let stopped=false;const stop=()=>{if(stopped)return;stopped=true;try{source.stop()}catch{}for(const node of [source,filter,gain,panner,delay,wet])node.disconnect()};spatialActive.set(channel,stop);
 source.onended=()=>{if(spatialActive.get(channel)===stop)spatialActive.delete(channel);stop()};source.start();
}
function playMovementSound(previous,next){
 if(next===11||previous===11){playSpatialSound('duct',0,next===11?.28:.16,800,true);return}
 const side=[5,6,7].includes(next)?'left':[3,4,8,10].includes(next)?'right':null;if(!side){spatialActive.get('movement')?.();return}
 const near=next===7||next===8,medium=next===6||next===10;
 playSpatialSound(side,side==='left'?-.9:.9,near?.5:medium?.29:.15,near?4200:medium?2300:1100);
}
async function startSelectedNight(retry=false){
 if(introActive)return;if(retry)selectedNight=currentNight;
 if(selectedNight>unlockedNight)return;
 $('startBtn').disabled=true;$('continueBtn').disabled=true;
 try{await Promise.all([unlockGameAudio(),jumpscareFramesReady,framesReady]);playNewGameIntro()}
 catch(error){console.error(error);$('assetError').hidden=false;$('assetError').textContent='No se pudieron cargar los recursos. Abrí el juego desde un servidor local o GitHub Pages y volvé a intentar.'}
 finally{$('startBtn').disabled=false;$('continueBtn').disabled=false}
}
