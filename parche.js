/* Parche: temblor de puerta sin desplazar la oficina + menú encuadrado 16:9 con flechas alineadas. */
(function(){
 // 1) El temblor reemplazaba el translate(-50%,-50%) que centra #officeScreen.
 //    Se lo reponemos en cada fotograma clave: termina siempre en su lugar original.
 const nativeAnimate=Element.prototype.animate;
 Element.prototype.animate=function(keyframes,options){
  if(this.id==='officeScreen'&&Array.isArray(keyframes)){
   keyframes=keyframes.map(k=>k&&k.transform?Object.assign({},k,{transform:'translate(-50%,-50%) '+k.transform}):k);
  }
  return nativeAnimate.call(this,keyframes,options);
 };

 // 3) Volumen general: ganancia maestra en los AudioContext (con compresor para no saturar) y subida de los <audio>.
 const BOOST=2.4,MEDIA_BOOST=2.2;
 try{
  const dd=Object.getOwnPropertyDescriptor(BaseAudioContext.prototype,'destination');
  if(dd&&dd.get){
   Object.defineProperty(BaseAudioContext.prototype,'destination',{configurable:true,enumerable:dd.enumerable,get:function(){
    if(!this.__masterBoost){
     const real=dd.get.call(this),g=this.createGain(),c=this.createDynamicsCompressor();
     g.gain.value=BOOST;c.threshold.value=-8;c.knee.value=10;c.ratio.value=8;c.attack.value=.003;c.release.value=.15;
     g.connect(c);c.connect(real);this.__masterBoost=g;
    }
    return this.__masterBoost;
   }});
  }
  const vd=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'volume');
  if(vd&&vd.set){
   Object.defineProperty(HTMLMediaElement.prototype,'volume',{configurable:true,enumerable:vd.enumerable,get:vd.get,set:function(v){vd.set.call(this,Math.min(1,Math.max(0,Number(v)*MEDIA_BOOST)))}});
  }
 }catch(e){console.warn('parche volumen',e)}

 // 2) Menú: lienzo 16:9 (el arte llena el lienzo sin recortes) y hits/flechas en % del arte.
 const css=`
.side-door-status,#leftDoorStatus,#rightDoorStatus,.duct-shutter,#ductShutter,.office-look-hint,#officeLookHint{display:none!important;visibility:hidden!important;opacity:0!important}
@media(orientation:landscape){
 .menu-canvas{width:min(100vw,177.7778dvh)!important;height:auto!important;aspect-ratio:16/9!important;max-height:100dvh!important}
 .menu-background,.menu-film-frame{object-fit:cover!important;object-position:center center!important}
 .menu-hit{left:5.6%!important;width:33%!important;height:7.4%!important;min-height:0!important;padding:0!important}
 .menu-new{top:49.2%!important}
 .menu-continue{top:57.1%!important}
 .menu-options-hit{top:65.3%!important}
 .menu-hit::before{left:0!important;top:50%!important;transform:translateY(-50%)!important;font:700 clamp(24px,3.6vw,48px)/1 var(--mono)!important}
 .menu-arrow-cover{display:block!important;left:4.6%!important;top:49.4%!important;width:6.4%!important;height:7.2%!important;background:radial-gradient(ellipse at center,#050606f2 55%,#05060600 100%)!important;box-shadow:none!important;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);z-index:2!important}
 .menu-night-label{left:10.6%!important;width:28%!important;padding-left:0!important}
 .menu-night-new{top:56.6%!important}
 .menu-night-continue{top:64.5%!important}
}`;
 const style=document.createElement('style');
 style.id='parche-menu-puerta';
 style.textContent=css;
 document.head.appendChild(style);
})();

/* Transición de cámaras: al tocar el monitor la oficina hace zoom hacia la pantalla, se oscurece y las cámaras se encienden.
   Al salir hace el zoom inverso. Ajustá los tiempos (ms) y el zoom aquí abajo. */
(function(){
 const ZOOM_IN_MS=300,ZOOM_OUT_MS=200,CAM_ON_MS=220,ZOOM=3.4;
 const actOrig=window.act;if(typeof actOrig!=='function')return;
 const st=document.createElement('style');
 st.textContent='body.cam-zooming .stage{pointer-events:none}';document.head.appendChild(st);
 let busy=false;
 const origin=()=>{
  const z=document.getElementById('cameraZone').getBoundingClientRect(),o=document.getElementById('officeScreen').getBoundingClientRect();
  const x=Math.min(100,Math.max(0,(z.left+z.width/2-o.left)/o.width*100)),y=Math.min(100,Math.max(0,(z.top+z.height/2-o.top)/o.height*100));
  return x.toFixed(1)+'% '+y.toFixed(1)+'%';
 };
 window.act=function(name,fromPC){
  if(name!=='camera')return actOrig.apply(this,arguments);
  if(busy)return;
  const office=document.getElementById('officeScreen'),cams=document.getElementById('cameraScreen');
  // Abrir (solo desde el monitor, con las mismas condiciones que el juego)
  if(!showCamera&&fromPC&&running&&!blackout&&!introActive&&!animating()&&cameraMotion.view==='center'){
   busy=true;document.body.classList.add('cam-zooming');
   try{beep(120,.35,'triangle',.05)}catch{}
   const o=origin();
   const zin=office.animate([
    {transform:'scale(1)',filter:'brightness(1)',transformOrigin:o,offset:0},
    {transform:'scale('+(ZOOM*.8)+')',filter:'brightness(.8)',transformOrigin:o,offset:.7},
    {transform:'scale('+ZOOM+')',filter:'brightness(.05)',transformOrigin:o,offset:1}
   ],{duration:ZOOM_IN_MS,easing:'cubic-bezier(.55,0,.85,.45)',fill:'forwards'});
   const done=()=>{
    actOrig.call(window,'camera',true);   // el juego muestra las cámaras (update() oculta la oficina)
    zin.cancel();
    cams.animate([
     {opacity:0,transform:'scale(1.16)',filter:'brightness(2.4) contrast(1.3)'},
     {opacity:1,transform:'scale(1)',filter:'brightness(1) contrast(1)'}
    ],{duration:CAM_ON_MS,easing:'ease-out'});
    document.body.classList.remove('cam-zooming');busy=false;
   };
   zin.onfinish=done;zin.oncancel=()=>{document.body.classList.remove('cam-zooming');busy=false};
   return;
  }
  // Cerrar: vuelve la oficina con el zoom inverso
  const wasOpen=showCamera;
  const r=actOrig.apply(this,arguments);
  if(wasOpen&&!showCamera){
   const o=origin();
   office.animate([
    {transform:'scale('+(ZOOM*.55)+')',filter:'brightness(.15)',transformOrigin:o},
    {transform:'scale(1)',filter:'brightness(1)',transformOrigin:o}
   ],{duration:ZOOM_OUT_MS,easing:'cubic-bezier(.2,.7,.3,1)'});
  }
  return r;
 };
})();
