/* MODO PROGRAMADOR — oculto. Se carga después de parche.js y no hace nada hasta activarlo.
   Activar:  escribí "pochdev" en el teclado (en cualquier pantalla)
        o:   tocá 7 veces seguidas, en menos de 3 s, la esquina superior izquierda de la pantalla.
   Desactivar: repetí lo mismo o usá la X del panel.
   Para cambiar la clave, editá CLAVE. */
(function(){
 'use strict';
 const CLAVE='pochdev';
 let buf='',panel=null,tapTimes=[];
 const st={pausa:false,congelar:false,energiaInf:false,noGuardar:true,timer:0};

 // ---- ganchos (se instalan una sola vez; sin el panel activo no cambian nada) ----
 const tickOrig=window.tick, advOrig=window.advanceSimon, saveOrig=window.saveNights;
 window.tick=function(now){
  if(st.pausa&&running){lastTime=now;raf=requestAnimationFrame(window.tick);return}
  return tickOrig(now);
 };
 window.advanceSimon=function(dt){ if(!(panel&&st.congelar))return advOrig(dt) };
 window.saveNights=function(){ if(!(panel&&st.noGuardar))return saveOrig() };

 // ---- utilidades ----
 const fmt=n=>(Math.round(n*10)/10).toFixed(1);
 function sinJuego(){ if(!running){msg('Primero iniciá una noche (botón "Iniciar noche N").');return true} return false }
 function msg(t){const m=panel&&panel.querySelector('#dvMsg');if(m)m.textContent=t}
 function refrescar(){try{update()}catch{}}

 async function iniciarNoche(n){
  n=Math.max(1,Math.min(5,n));
  unlockedNight=Math.max(unlockedNight,n);selectedNight=n;
  try{await Promise.all([unlockGameAudio(),jumpscareFramesReady,framesReady])}catch(e){console.warn('dev: carga',e)}
  if(introActive){skipIntro();closeIntro()}
  reset();msg('Noche '+n+' iniciada.');
 }
 function irA(sala){
  if(sinJuego())return;
  planSimonRoute(sala);moveIn=nextMoveDelay();dangerTime=0;defenseTime=0;ductDepth=0;ductAdvance=0;
  refrescar();msg('Simón en CAM '+sala+' (ruta '+route.name+').');
 }
 function atacar(lado){
  if(sinJuego())return;
  const destino=lado==='left'?7:lado==='right'?8:11;
  route={name:lado==='left'?'izquierda':lado==='right'?'derecha':'alcantarilla',guard:lado==='left'?'left':lado==='right'?'right':'gate',rooms:[destino]};
  routeStep=0;moveIn=0;dangerTime=0;defenseTime=0;ductDepth=0;ductAdvance=0;
  refrescar();msg('Simón en la puerta: '+route.name+'.');
 }
 function sumarTiempo(s){
  if(sinJuego())return;
  elapsed=Math.max(0,Math.min(DURATION-0.5,elapsed+s));refrescar();msg('Hora: '+fmt(elapsed)+' s / '+DURATION+' s');
 }
 function accion(a,v){
  switch(a){
   case 'noche':iniciarNoche(v);break;
   case 'desbloquear':unlockedNight=5;msg('Noches 1-5 desbloqueadas (solo en memoria).');break;
   case 'borrarProgreso':try{localStorage.removeItem(NIGHT_SAVE_KEY)}catch{}unlockedNight=1;selectedNight=1;renderNightMenu();msg('Progreso guardado borrado.');break;
   case 'tiempo':sumarTiempo(v);break;
   case 'casiSeis':if(!sinJuego()){elapsed=DURATION-6;refrescar();msg('Faltan 6 s para las 6 AM.')}break;
   case 'ganar':if(!sinJuego())end(true);break;
   case 'perder':if(!sinJuego())end(false,'Modo programador: derrota forzada.');break;
   case 'energia':if(!sinJuego()){power=v;blackout=0;refrescar();msg('Energía: '+v+'%')}break;
   case 'sala':irA(v);break;
   case 'puerta':atacar(v);break;
   case 'pausa':st.pausa=!st.pausa;msg(st.pausa?'Juego en PAUSA.':'Juego reanudado.');break;
   case 'congelar':st.congelar=!st.congelar;msg(st.congelar?'Simón CONGELADO.':'Simón se mueve de nuevo.');break;
   case 'energiaInf':st.energiaInf=!st.energiaInf;msg(st.energiaInf?'Energía infinita ACTIVA.':'Energía normal.');break;
   case 'noGuardar':st.noGuardar=!st.noGuardar;msg(st.noGuardar?'No se guarda el progreso.':'El progreso SÍ se guarda.');break;
   case 'cerrar':desactivar();return;
  }
  marcar();
 }
 function marcar(){
  if(!panel)return;
  for(const [k,v] of Object.entries({pausa:st.pausa,congelar:st.congelar,energiaInf:st.energiaInf,noGuardar:st.noGuardar})){
   const b=panel.querySelector('[data-a="'+k+'"]');if(b)b.classList.toggle('on',v);
  }
 }
 function lectura(){
  if(!panel)return;
  const o=panel.querySelector('#dvInfo');if(!o)return;
  if(st.energiaInf&&running&&!blackout)power=100;
  let t='Noche '+currentNight+' | '+(running?'JUGANDO':'detenido')+(st.pausa?' (PAUSA)':'')+'\n';
  if(running&&route){
   const alPuerta=routeStep===route.rooms.length-1;
   t+='Hora '+fmt(elapsed)+'/'+DURATION+' s · Energía '+Math.ceil(power)+'%\n';
   t+='Simón: CAM '+room()+' · ruta '+route.name+' · paso '+(routeStep+1)+'/'+route.rooms.length+'\n';
   t+='Camino: '+route.rooms.join(' > ')+'\n';
   t+=alPuerta?('EN LA PUERTA · peligro '+fmt(dangerTime)+'/'+fmt(nightSettings().reaction)+' s · defensa '+fmt(defenseTime)+'/'+fmt(nightSettings().doorHold)+' s'+(room()===11?' · conducto '+ductDepth+'/2':'')+'\n')
            :('Próximo movimiento en '+fmt(Math.max(0,moveIn))+' s\n');
   t+='Puerta izq '+(left?'CERR':'abierta')+' · der '+(right?'CERR':'abierta')+' · rejilla '+(gateClosed?'CERR':'abierta')+' · luz '+(light?'on':'off');
  }
  o.textContent=t;
 }

 // ---- panel ----
 function crearPanel(){
  const s=document.createElement('style');s.id='dvStyle';
  s.textContent=`#dvPanel{position:fixed;left:6px;bottom:6px;z-index:2147483000;width:270px;max-height:92dvh;overflow:auto;background:#050806ee;color:#b8ffc0;border:1px solid #3c9a4b;border-radius:6px;font:11px/1.35 ui-monospace,Consolas,monospace;padding:6px;touch-action:manipulation}
#dvPanel *{box-sizing:border-box}#dvPanel h4{margin:6px 0 3px;color:#ffd36b;font-size:11px;letter-spacing:.06em}
#dvPanel button{background:#0f2a14;color:#b8ffc0;border:1px solid #2f7a3b;border-radius:4px;padding:4px 6px;margin:1px;font:inherit;cursor:pointer}
#dvPanel button:active{background:#1d5a28}#dvPanel button.on{background:#3c9a4b;color:#021005;font-weight:700}
#dvPanel .row{display:flex;flex-wrap:wrap}#dvPanel .dvtop{display:flex;justify-content:space-between;align-items:center}
#dvInfo{white-space:pre-wrap;background:#000;border:1px solid #1c4a24;padding:4px;margin:4px 0;min-height:7em;color:#9dffa8}#dvMsg{color:#ffd36b;min-height:1.4em}
#dvPanel.min .cuerpo{display:none}`;
  document.head.appendChild(s);
  const p=document.createElement('div');p.id='dvPanel';
  const B=(a,txt,v)=>'<button data-a="'+a+'"'+(v!==undefined?' data-v="'+v+'"':'')+'>'+txt+'</button>';
  p.innerHTML=
   '<div class="dvtop"><b>MODO PROGRAMADOR</b><span><button data-a="min">_</button>'+B('cerrar','X')+'</span></div>'+
   '<div class="cuerpo"><div id="dvInfo"></div><div id="dvMsg"></div>'+
   '<h4>NOCHE (reinicia)</h4><div class="row">'+[1,2,3,4,5].map(n=>B('noche','N'+n,n)).join('')+'</div>'+
   '<div class="row">'+B('desbloquear','Desbloquear 1-5')+B('borrarProgreso','Borrar progreso')+'</div>'+
   '<h4>TIEMPO</h4><div class="row">'+B('tiempo','+30s (1h)',30)+B('tiempo','+60s',60)+B('tiempo','-30s',-30)+B('casiSeis','Casi 6 AM')+B('ganar','Ganar noche')+'</div>'+
   '<h4>ENERGÍA</h4><div class="row">'+B('energia','100%',100)+B('energia','50%',50)+B('energia','5%',5)+B('energia','0%',0.01)+B('energiaInf','Infinita')+'</div>'+
   '<h4>SIMÓN: ir a cámara</h4><div class="row">'+[1,2,3,4,5,6,7,8,9,10,11].map(n=>B('sala','C'+n,n)).join('')+'</div>'+
   '<h4>SIMÓN: atacar por</h4><div class="row">'+B('puerta','Izquierda','left')+B('puerta','Derecha','right')+B('puerta','Alcantarilla','gate')+'</div>'+
   '<h4>CONTROL</h4><div class="row">'+B('pausa','Pausa')+B('congelar','Congelar Simón')+B('perder','Jumpscare')+B('noGuardar','No guardar progreso')+'</div></div>';
  p.addEventListener('click',e=>{
   const b=e.target.closest('button');if(!b)return;e.stopPropagation();
   if(b.dataset.a==='min'){p.classList.toggle('min');return}
   let v=b.dataset.v;if(v!==undefined&&/^-?[\d.]+$/.test(v))v=Number(v);
   accion(b.dataset.a,v);
  });
  for(const ev of ['pointerdown','mousedown','touchstart','dblclick','contextmenu'])p.addEventListener(ev,e=>e.stopPropagation());
  document.body.appendChild(p);return p;
 }
 function activar(){
  if(panel)return;panel=crearPanel();marcar();lectura();
  st.timer=setInterval(lectura,150);
 }
 function desactivar(){
  if(!panel)return;
  clearInterval(st.timer);panel.remove();panel=null;
  const s=document.getElementById('dvStyle');if(s)s.remove();
  st.pausa=st.congelar=st.energiaInf=false;st.noGuardar=true;
 }
 function alternar(){panel?desactivar():activar()}

 // ---- activación secreta ----
 document.addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey||e.key.length!==1)return;
  buf=(buf+e.key.toLowerCase()).slice(-CLAVE.length);
  if(buf===CLAVE){buf='';alternar()}
 },true);
 document.addEventListener('pointerdown',e=>{
  if(e.clientX>70||e.clientY>70){tapTimes=[];return}
  const now=performance.now();tapTimes=tapTimes.filter(t=>now-t<3000);tapTimes.push(now);
  if(tapTimes.length>=7){tapTimes=[];alternar()}
 },true);
})();
