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
 if(startLbl)startLbl.textContent='Noche 1';
 if(contLbl)contLbl.textContent='Noche '+selectedNight;
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
/* Golpes fuertes en la puerta cuando Simón se rinde y se va: audio recursos/sonidos/golpes_puerta.mp3, estéreo según el lado. */
let knockStop=null;
function stopDoorKnocks(){if(knockStop){knockStop();knockStop=null}}
function playDoorKnocks(side){
 if(side!=='left'&&side!=='right')return;
 if(muted||!soundContext||soundContext.state!=='running'||!spatialBuffers.knock)return;
 stopDoorKnocks();
 const ctx=soundContext,source=ctx.createBufferSource(),gain=ctx.createGain(),panner=ctx.createStereoPanner();
 source.buffer=spatialBuffers.knock;gain.gain.value=1.8;panner.pan.value=side==='left'?-1:1;
 source.connect(gain);gain.connect(panner);panner.connect(ctx.destination);
 knockStop=()=>{try{source.stop()}catch{}for(const n of [source,gain,panner])try{n.disconnect()}catch{}};
 source.onended=()=>{if(knockStop)knockStop=null;for(const n of [source,gain,panner])try{n.disconnect()}catch{}};
 source.start();
}
function advanceSimon(dt){
 const c=nightSettings();retreatGrace=Math.max(0,retreatGrace-dt);
 if(routeStep===route.rooms.length-1){
  if(protectedAccess()){defenseTime+=dt;if(defenseTime>=c.doorHold){const side=route.guard;retreatSimon();playDoorKnocks(side);return}}
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
function resetNightSystems(){noseCount=0;noseLast=0;clearTimeout(victoryTimer);stopVictoryFx();document.body.classList.remove('power-out');stopDoorKnocks();document.body.classList.remove('attacking');stopSpatialSounds();currentNight=selectedNight;gateClosed=false;ductDepth=0;ductAdvance=0;defenseTime=0;retreatGrace=0;dangerTime=0;}
/* Victoria: pantalla negra, "5 AM" -> el 6 cae desde arriba, confeti y sonido de campanas + aplausos. Clic para saltar. */
let vtTimers=[],vtRaf=0,vtAudioStop=null;
function stopVictoryFx(){
 vtTimers.forEach(clearTimeout);vtTimers=[];cancelAnimationFrame(vtRaf);
 if(vtAudioStop){vtAudioStop();vtAudioStop=null}
 const v=$('victoryTransition');if(v){v.hidden=true;v.onclick=null;v.replaceChildren()}
}
function playVictoryAudio(){
 if(muted||!soundContext||soundContext.state!=='running')return;
 const ctx=soundContext,t0=ctx.currentTime,nodes=[],master=ctx.createGain();master.gain.value=.8;master.connect(ctx.destination);
 // Campanas: cuatro notas ascendentes con armónicos de campana.
 for(const [f,d] of [[523.25,0],[659.25,.3],[783.99,.6],[1046.5,.95]])for(const [m,amp,dec] of [[1,.5,2.4],[2.76,.18,1.3],[5.4,.07,.6]]){
  const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=f*m;
  g.gain.setValueAtTime(.0001,t0+d);g.gain.exponentialRampToValueAtTime(amp*.55,t0+d+.012);g.gain.exponentialRampToValueAtTime(.0001,t0+d+dec);
  o.connect(g);g.connect(master);o.start(t0+d);o.stop(t0+d+dec+.05);nodes.push(o);
 }
 // Aplausos: cientos de palmadas cortas de ruido, más densas hacia el centro.
 const sr=ctx.sampleRate,len=Math.floor(sr*3.4),buf=ctx.createBuffer(2,len,sr);
 for(let ch=0;ch<2;ch++){const data=buf.getChannelData(ch);
  for(let i=0;i<1500;i++){const start=Math.floor((Math.random()+Math.random())/2*(len-900)),n=250+Math.floor(Math.random()*550),amp=.12+Math.random()*.4;
   for(let k=0;k<n;k++)data[start+k]+=(Math.random()*2-1)*amp*Math.exp(-k/(n*.25));}}
 const src=ctx.createBufferSource(),hp=ctx.createBiquadFilter(),env=ctx.createGain();
 src.buffer=buf;hp.type='highpass';hp.frequency.value=700;
 env.gain.setValueAtTime(.0001,t0+.5);env.gain.linearRampToValueAtTime(.55,t0+1.1);env.gain.setValueAtTime(.55,t0+2.6);env.gain.linearRampToValueAtTime(.0001,t0+3.9);
 src.connect(hp);hp.connect(env);env.connect(master);src.start(t0+.5);
 vtAudioStop=()=>{for(const o of [...nodes,src]){try{o.stop()}catch{}}try{master.disconnect()}catch{}};
}
function launchConfetti(canvas){
 if(!canvas)return;const c=canvas.getContext('2d'),dpr=Math.min(2,window.devicePixelRatio||1);
 const W=canvas.width=Math.floor(innerWidth*dpr),H=canvas.height=Math.floor(innerHeight*dpr);
 const cols=['#ff4d6d','#ffd23f','#3bceac','#4ea8ff','#c77dff','#ffffff','#ff9f1c'],ps=[];
 const mk=(x,y,ang,spd,delay)=>ps.push({x,y,vx:Math.cos(ang)*spd*dpr,vy:Math.sin(ang)*spd*dpr,w:(6+Math.random()*7)*dpr,h:(10+Math.random()*9)*dpr,r:Math.random()*6.28,vr:(Math.random()-.5)*.35,s:Math.random()*6.28,c:cols[Math.floor(Math.random()*cols.length)],delay});
 for(let i=0;i<220;i++)mk(W/2,H*.45,Math.random()*6.283,6+Math.random()*16,0);                               // explosión desde el número
 for(let i=0;i<70;i++){mk(0,H,-Math.PI/2+Math.random()*.7,14+Math.random()*12,.25);mk(W,H,-Math.PI/2-Math.random()*.7,14+Math.random()*12,.25)} // cañones laterales
 for(let i=0;i<120;i++)mk(Math.random()*W,-20*dpr-Math.random()*H*.5,Math.PI/2,1+Math.random()*2,.6);         // lluvia desde arriba
 const t0=performance.now();let last=t0;
 (function frame(now){
  const t=(now-t0)/1000,dt=Math.min(.05,(now-last)/1000)*60;last=now;c.clearRect(0,0,W,H);
  c.globalAlpha=t>3.4?Math.max(0,1-(t-3.4)/.8):1;
  for(const p of ps){if(t<p.delay)continue;
   p.vx*=Math.pow(.985,dt);p.vy=p.vy*Math.pow(.985,dt)+.32*dpr*dt;p.s+=.08*dt;p.x+=(p.vx+Math.sin(p.s)*.8*dpr)*dt;p.y+=p.vy*dt;p.r+=p.vr*dt;
   c.save();c.translate(p.x,p.y);c.rotate(p.r);c.scale(1,Math.abs(Math.cos(p.s)));c.fillStyle=p.c;c.fillRect(-p.w/2,-p.h/2,p.w,p.h);c.restore();}
  if(t<4.2)vtRaf=requestAnimationFrame(frame);else c.clearRect(0,0,W,H);
 })(t0);
}
function winNight(){
 stopSpatialSounds();unlockedNight=Math.max(unlockedNight,Math.min(5,currentNight+1));selectedNight=Math.min(5,currentNight+1);saveNights();renderNightMenu();
 stopVictoryFx();const box=$('victoryTransition');
 box.innerHTML='<div class="vt-clock"><span class="vt-num"><span class="vt-d vt-old">5</span><span class="vt-d vt-new">6</span></span><span class="vt-am">AM</span></div><canvas id="vtConfetti"></canvas>';
 box.hidden=false;
 const finish=()=>{stopVictoryFx();$('menu').classList.remove('hidden');syncMenuMusic()};
 vtTimers.push(setTimeout(()=>{playVictoryAudio();launchConfetti($('vtConfetti'))},1450));
 vtTimers.push(setTimeout(()=>{box.onclick=finish},1600));
 vtTimers.push(setTimeout(finish,6000));
}
const SPATIAL_FILES={left:'recursos/sonidos/pasos_izquierda.mp3',right:'recursos/sonidos/pasos_derecha.mp3',scream:'recursos/sonidos/grito_simon.mp3',duct:'recursos/sonidos/alcantarilla.mp3',knock:'recursos/sonidos/golpes_puerta.mp3'};
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
// New Game: borra el progreso y arranca en la noche 1. Continue: sigue en la noche guardada (la siguiente tras ganar, la misma tras perder).
async function startSelectedNight(newGame=false){
 if(introActive)return;if(newGame){unlockedNight=1;selectedNight=1;saveNights();renderNightMenu()}
 if(selectedNight>unlockedNight)return;
 $('startBtn').disabled=true;$('continueBtn').disabled=true;
 try{await Promise.all([unlockGameAudio(),jumpscareFramesReady,framesReady]);playNewGameIntro()}
 catch(error){console.error(error);$('assetError').hidden=false;$('assetError').textContent='No se pudieron cargar los recursos. Abrí el juego desde un servidor local o GitHub Pages y volvé a intentar.'}
 finally{$('startBtn').disabled=false;$('continueBtn').disabled=false}
}

/* Easter egg: la nariz de Simón (póster de la oficina). Suena un "honk" de peluche; si lo apretás muchas veces seguidas, perdés. */
const NOSE={x:370,y:413,r:30,w:1671,h:941},NOSE_LIMIT=12,NOSE_DECAY_MS=2500,NOSE_FILE='recursos/sonidos/nariz_simon.mp3';
let noseCount=0,noseLast=0,noseFileOk=null;
fetch(NOSE_FILE,{method:'HEAD'}).then(r=>{noseFileOk=r.ok}).catch(()=>{noseFileOk=false});
function noseSynth(level){
 // Peluche de goma: dos osciladores levemente desafinados + filtro "vocal"; sube de tono a medida que lo apretás.
 if(!soundContext||soundContext.state!=='running')return;
 const t=soundContext.currentTime,base=300+level*14,o1=soundContext.createOscillator(),o2=soundContext.createOscillator(),
  bp=soundContext.createBiquadFilter(),lp=soundContext.createBiquadFilter(),g=soundContext.createGain();
 o1.type='sawtooth';o2.type='square';
 for(const [o,k] of [[o1,1],[o2,1.012]]){o.frequency.setValueAtTime(base*.78*k,t);o.frequency.exponentialRampToValueAtTime(base*1.28*k,t+.05);o.frequency.exponentialRampToValueAtTime(base*.9*k,t+.2)}
 bp.type='bandpass';bp.frequency.setValueAtTime(900,t);bp.frequency.exponentialRampToValueAtTime(1500,t+.06);bp.frequency.exponentialRampToValueAtTime(800,t+.2);bp.Q.value=2.2;
 lp.type='lowpass';lp.frequency.value=3200;
 g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.9,t+.012);g.gain.exponentialRampToValueAtTime(.55,t+.09);g.gain.exponentialRampToValueAtTime(.0001,t+.24);
 o1.connect(bp);o2.connect(bp);bp.connect(lp);lp.connect(g);g.connect(soundContext.destination);
 o1.start(t);o2.start(t);o1.stop(t+.26);o2.stop(t+.26);
}
function noseHonk(level){
 if(muted)return;
 if(noseFileOk){const a=new Audio(NOSE_FILE);a.volume=1;a.playbackRate=1+level*.02;a.play().catch(()=>noseSynth(level));return}
 noseSynth(level);
}
function noseHit(clientX,clientY){
 const img=$('officeBg')&&$('officeBg').querySelector('.office-photo');if(!img)return false;
 const r=img.getBoundingClientRect(),s=Math.max(r.width/NOSE.w,r.height/NOSE.h);
 const px=r.left+(r.width-NOSE.w*s)/2+NOSE.x*s,py=r.top+(r.height-NOSE.h*s)/2+NOSE.y*s;
 return Math.hypot(clientX-px,clientY-py)<=NOSE.r*s;
}
function noseBoop(){
 const now=performance.now();
 noseCount=Math.max(0,noseCount-Math.floor((now-noseLast)/NOSE_DECAY_MS))+1;noseLast=now;
 noseHonk(noseCount);
 if(noseCount>=NOSE_LIMIT)end(false,'Apretaste demasiado la nariz de Simón... no le gustó.');
}
document.addEventListener('click',e=>{
 if(!running||finished||showCamera||blackout||introActive||cameraMotion.view!=='center'||cameraMotion.turning)return;
 if(!e.target.closest||!e.target.closest('#officeScreen'))return;
 if(!noseHit(e.clientX,e.clientY))return;
 e.stopPropagation();e.preventDefault();noseBoop();
},true);
