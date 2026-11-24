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
