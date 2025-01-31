(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))o(i);new MutationObserver(i=>{for(const s of i)if(s.type==="childList")for(const r of s.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&o(r)}).observe(document,{childList:!0,subtree:!0});function n(i){const s={};return i.integrity&&(s.integrity=i.integrity),i.referrerPolicy&&(s.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?s.credentials="include":i.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function o(i){if(i.ep)return;i.ep=!0;const s=n(i);fetch(i.href,s)}})();window.AudioContext??=window.webkitAudioContext;const N=new AudioContext,Ce=N.createGain();Ce.connect(N.destination);const Re={muteSoundEffects:"snakeshift:muteSoundEffects",volume:"snakeshift:volume"},Lt=document.getElementById("load-progress"),Oe=document.getElementById("mute-button");let q=!1;try{q=localStorage[Re.muteSoundEffects]==="true";let t=parseFloat(localStorage[Re.volume]);(!isFinite(t)||t<0||t>1)&&(t=.5),Ce.gain.value=t}catch(t){console.error("Couldn't initialize preferences:",t)}const rt={},at={undo:"/audio/sound-effects/undo.wav",redo:"/audio/sound-effects/redo.wav",gong:"/audio/sound-effects/gong-2-232435.mp3",gongBrilliant:"/audio/sound-effects/486629__jenszygar__gong-brilliant-paiste-32.mp3",eat:"/audio/sound-effects/kayageum1_c3-91074.mp3",move:"/audio/sound-effects/tiny-drip.wav",switchSnakes:"/audio/sound-effects/snake-hissing-6092.mp3"},It=Object.keys(at).length;let Ze=0;const xt=14,Qe=[],Tt=async t=>{const e=Object.entries(t);let n=!1;return Object.fromEntries(await Promise.all(e.map(async([o,i])=>{let s;try{s=await Bt(i)}catch(r){n||(location.protocol==="file:"?(et(`This page must be served by a web server,
in order to load files needed for the game.`,r),n=!0):et(`Failed to load resource '${i}'`,r))}if(Ze+=1,Ze/It*xt>Qe.length){const r=document.createElement("div");r.classList.add("load-progress-brick"),Qe.push(r),Lt.appendChild(r)}return[o,s]})))},lt=()=>{q||N.resume()},ct=({savePreference:t=!0}={})=>{q=!q,ht();try{t&&(localStorage[Re.muteSoundEffects]=q)}catch{}q?N.suspend():N.resume()},ht=()=>{Oe.ariaPressed=q?"true":"false",Oe.textContent=q?"Unmute":"Mute"},At=async t=>{const e=await fetch(t);if(e.ok)return await N.decodeAudioData(await e.arrayBuffer());throw new Error(`got HTTP ${e.status} fetching '${t}'`)},Bt=At,et=(t,e)=>{alert(`${t}

${e}`)},Z=(t,{playbackRate:e=1,volume:n=1,cutOffEndFraction:o=0}={})=>{try{const i=rt[t];if(!i)throw new Error(`No AudioBuffer loaded for sound '${t}'`);if(q||N.state!=="running")return;const s=N.createGain(),r=N.createBufferSource();r.buffer=i,r.connect(s),s.connect(Ce),s.gain.value=n,r.playbackRate.value=e,o&&s.gain.linearRampToValueAtTime(0,N.currentTime+i.duration*(1-o)),r.start(0)}catch(i){console.error(`Failed to play sound '${t}':`,i)}};Oe.addEventListener("click",()=>{ct()});ht();class dt{solid=!0}var L=(t=>(t[t.KeyboardAbsoluteDirection=0]="KeyboardAbsoluteDirection",t[t.KeyboardFacingRelative=1]="KeyboardFacingRelative",t[t.Gamepad=2]="Gamepad",t[t.Pointer=3]="Pointer",t))(L||{}),w=(t=>(t[t.None=0]="None",t[t.White=1]="White",t[t.Black=2]="Black",t))(w||{});const ve=[{x:1,y:0},{x:0,y:1},{x:-1,y:0},{x:0,y:-1}];class X extends dt{constructor(e=0,n=0,o=1,i=1,s=w.White){super(),this.x=e,this.y=n,this.width=o,this.height=i,this.layer=s}at(e,n){return e>=this.x&&e<this.x+this.width&&n>=this.y&&n<this.y+this.height?{entity:this,layer:this.layer}:null}draw(e){const n=1/e.getTransform().a;e.fillStyle=this.layer===w.White?"#fff":"#000",e.fillRect(this.x,this.y,this.width+n,this.height+n)}}class ft extends X{}class C extends X{static VISUAL_SIZE=.8;solid=!1;#e=0;step(e){this.#e=e}draw(e){e.save(),e.lineWidth=.1,e.strokeStyle=this.layer===w.White?"#000":"#fff",e.fillStyle=this.layer===w.White?"#fff":"#000",e.translate(this.x,this.y),e.scale(this.width,this.height),e.translate(1/2,1/2),e.rotate(Math.sin(this.#e/1e3+this.x/10+this.y/10)*Math.PI/12),e.beginPath(),e.moveTo(0,-C.VISUAL_SIZE/2);for(let n=0;n<4;n++)e.rotate(Math.PI/2),e.quadraticCurveTo(0,0,0,-C.VISUAL_SIZE/2);e.stroke(),e.fill(),e.restore()}}class Ge extends X{draw(e){const n=1/e.getTransform().a;e.save(),e.lineWidth=.2,e.strokeStyle=this.layer===w.White?"#fff":"#000",e.fillStyle=this.layer===w.White?"#fff":"#000",e.beginPath();const o=.1;e.rect(this.x+o,this.y+o,this.width-o*2+n,this.height-o*2+n),e.fill(),e.stroke(),e.lineWidth=.05,e.strokeStyle=this.layer===w.White?"#000":"#fff",e.stroke(),e.clip(),e.beginPath(),e.moveTo(this.x,this.y),e.lineTo(this.x+this.width,this.y+this.height),e.lineWidth=.2,e.strokeStyle=this.layer===w.White?"#000":"#fff",e.stroke(),e.lineWidth=.1,e.strokeStyle=this.layer===w.White?"#fff":"#000",e.stroke(),e.beginPath(),e.moveTo(this.x+this.width,this.y),e.lineTo(this.x,this.y+this.height),e.lineWidth=.2,e.strokeStyle=this.layer===w.White?"#000":"#fff",e.stroke(),e.lineWidth=.1,e.strokeStyle=this.layer===w.White?"#fff":"#000",e.stroke(),e.restore()}}class v extends dt{segments=[];id=crypto.randomUUID();growOnNextMove=!1;_highlightTime=-1/0;_highlightCanvas=document.createElement("canvas");_melodyIndex=0;static HIGHLIGHT_DURATION=500;static DEBUG_SNAKE_DRAGGING=!1;constructor(){super();for(let e=0;e<10;e++)this.segments.push({x:e,y:0,width:1,height:1,layer:w.White})}toJSON(){return{id:this.id,segments:this.segments,growOnNextMove:this.growOnNextMove}}highlight(){this._highlightTime=performance.now()}draw(e){this._bodyPath(e),e.fillStyle=this.segments[0].layer===w.White?"#fff":"#000",e.fill()}draw2(e){this._drawHeadDetails(e),this._drawBodyOutline(e,(n,o)=>{n.strokeStyle=this.segments[0].layer===w.White?"#fff":"#000",n.lineWidth=Math.min(.6,Math.max(.1,2/o.a))*2,n.stroke()}),this._drawBodyOutline(e,(n,o)=>{n.strokeStyle=this.segments[0].layer===w.White?"#000":"#fff",n.lineWidth=Math.min(.6,Math.max(.1,2/o.a)),n.stroke()})}draw3(e){const n=performance.now()-this._highlightTime,o=Math.min(1,Math.max(0,1-n/v.HIGHLIGHT_DURATION));if(o>0&&this._drawBodyOutline(e,(i,s)=>{i.strokeStyle="hsl(40, 100%, 50%)",i.lineWidth=Math.min(1,Math.max(.2,10/s.a)),i.stroke(),i.resetTransform(),i.globalCompositeOperation="destination-out",i.globalAlpha=1-o,i.fillStyle="#fff",i.fillRect(0,0,i.canvas.width,i.canvas.height),i.setTransform(s),i.globalAlpha=1}),v.DEBUG_SNAKE_DRAGGING){e.font="bold 0.5px sans-serif",e.textAlign="center",e.textBaseline="alphabetic";for(let i=0;i<this.segments.length;i++){const s=this.segments[i];e.fillStyle=`hsl(${i*360/this.segments.length}, 100%, 50%)`;const r=Math.PI/2;e.fillText(i.toString(),s.x+s.width/2+Math.sin(i*r+Math.PI/4)*.3,s.y+s.height*.7+Math.cos(i*r+Math.PI/4)*.3)}}}_drawBodyOutline(e,n){const o=e.getTransform();this._highlightCanvas.width=e.canvas.width,this._highlightCanvas.height=e.canvas.height;const i=this._highlightCanvas.getContext("2d");i.save(),i.clearRect(0,0,i.canvas.width,i.canvas.height),i.lineJoin="round",i.lineCap="round",i.setTransform(o),this._bodyPath(i),n(i,o),i.globalCompositeOperation="destination-out",this._bodyPath(i),i.fill(),i.restore(),e.resetTransform();try{e.drawImage(this._highlightCanvas,0,0)}catch{}e.setTransform(o)}_drawHeadDetails(e){const n=this.segments[0];e.save(),e.translate(n.x+n.width/2,n.y+n.height/2),e.scale(n.width,n.height);const o=this.segments[1]?Math.atan2(this.segments[1].y-n.y,this.segments[1].x-n.x):Math.PI/2;e.rotate(o),e.beginPath();const i=1/8,s=.45;e.arc(0,s/2,i,0,Math.PI*2,!0),e.arc(0,-s/2,i,0,Math.PI*2,!0),e.fillStyle=n.layer===w.White?"#000":"#fff",e.fill();const r=performance.now()-this._highlightTime,u=Math.min(1,Math.max(0,1-r/v.HIGHLIGHT_DURATION));u>0&&(e.beginPath(),e.translate(-1/2,0),e.scale(Math.pow(Math.sin(u),.2),1),e.rotate(Math.sin(performance.now()/50)*Math.PI/8),e.moveTo(0,0),e.translate(-.5,0),e.lineTo(0,0),e.rotate(Math.sin(performance.now()/50-1.5)*Math.PI/8),e.lineTo(-.4,-.2),e.lineTo(0,0),e.lineTo(-.4,.2),e.strokeStyle="#fff",e.globalCompositeOperation="exclusion",e.lineWidth=1/12,e.stroke()),e.restore()}_bodyPath(e){e.beginPath();const n=[];function o(s){s(),n.push({matrix:e.getTransform(),draw(){e.scale(1,-1),s()}})}for(let s=0;s<this.segments.length;s++){const r=this.segments[s];e.save(),e.translate(r.x+r.width/2,r.y+r.height/2);const u=Math.atan2(this.segments[s+1]?.y-r.y,this.segments[s+1]?.x-r.x),d=Math.atan2(r.y-this.segments[s-1]?.y,r.x-this.segments[s-1]?.x);if(s===0)this.segments.length===1?e.arc(0,0,1/2,0,Math.PI*2):(e.rotate(u),e.scale(1,.9),o(()=>e.lineTo(1/2,1/2)),e.arc(0,0,1/2,Math.PI/2,-Math.PI/2),e.lineTo(1/2,-1/2),e.lineTo(1/2,1/2));else if(s===this.segments.length-1){e.rotate(d),e.scale(1,.9),e.lineTo(-1/2,-1/2);const S=.5,T=0;e.quadraticCurveTo(S*(1-T),-1/2,S,0),e.quadraticCurveTo(S*(1-T),1/2,-1/2,1/2)}else e.rotate(d),e.scale(1,.9),o(()=>e.lineTo(-1/2,-1/2)),o(()=>e.lineTo(1/2,-1/2));e.restore()}const i=e.getTransform();for(let s=n.length-1;s>=0;s--)e.setTransform(n[s].matrix),n[s].draw();e.closePath(),e.setTransform(i)}at(e,n,o=!0,i=!0){for(let s=o?0:1;s<this.segments.length-(i?0:1);s++){const r=this.segments[s];if(e===r.x&&n===r.y)return{entity:this,layer:r.layer,segmentIndex:s}}return null}analyzeMoveAbsolute(e){const n=Math.round(e.x-this.segments[0].x),o=Math.round(e.y-this.segments[0].y);return this.analyzeMoveRelative(n,o)}analyzeMoveRelative(e,n){const o=this.segments[0],i=this.segments[this.segments.length-1],s=e*o.width,r=n*o.height,u=o.x+s,d=o.y+r,S=j(u,d,{ignoreTailOfSnake:this.growOnNextMove?void 0:this}),T=j(i.x,i.y),R=this.segments.length>1&&e===Math.sign(this.segments[1].x-o.x)&&n===Math.sign(this.segments[1].y-o.y);return{valid:(e===0||n===0)&&(Math.abs(e)===1||Math.abs(n)===1)&&!R&&Ee(S)!==o.layer&&Ee(T)===o.layer,to:{x:u,y:d,width:o.width,height:o.height},entitiesThere:S.map(c=>c.entity)}}takeMove(e){_(),Z("move"),this.growOnNextMove&&(this._grow(),this.growOnNextMove=!1);const n=this.segments[0];for(let r=this.segments.length-1;r>0;r--){const u=this.segments[r],d=this.segments[r-1];u.x=d.x,u.y=d.y}n.x=e.to.x,n.y=e.to.y,n.width=e.to.width,n.height=e.to.height;const o=e.entitiesThere.filter(r=>r.solid).map(r=>g.indexOf(r)),i=Math.max(...o),s=g.indexOf(this);s<i&&(g.splice(i+1,0,this),g.splice(s,1));for(const r of e.entitiesThere)if(r instanceof C&&r.layer===n.layer){g.splice(g.indexOf(r),1),this.growOnNextMove=!0;const u=c=>440*Math.pow(2,(c-69)/12),T=[...`
X:231
T:The Snake Charmer Song
T:The Streets of Cairo
Z:Jack Campin, http://www.campin.me.uk/
F:Jack Campin's Nine-Note Tunebook
% last edit 03-02-2013
C:Sol Bloom and James Thornton, 1893 
H:see http://www.shira.net/streets-of-cairo.htm
M:4/4
L:1/8
Q:1/4=120
K:DMin
DE| F2 E2 D2 DE|FA  EF  D2   :|z2| AA AB AG EF|
                GG  GA  GF     DE| FF FG FE DE|F2  EE  D2 z2||
K:F
  |:A4    A3  F|G>A G>F D2 C2 |[1  F2 A2 c2 d2|
                c2  d2  cA G2:|[2  F2 AF G2 A2|F4      z2   |]
`.split("K:DMin")[1].matchAll(/([A-G])([,'])*/gi)].map(c=>{const a=c[1],l=c[2]==="'"?1:c[2]===","?-1:0;return 12*((a===a.toUpperCase()?1:0)+l+6)+"CDEFGAB".indexOf(a.toUpperCase())}).map(u),R=T[this._melodyIndex++%T.length]/440;Mt()||Z("eat",{playbackRate:R})}}_grow(){const n={...this.segments[this.segments.length-1]};this.segments.push(n)}}function J(t,e){return t===e?!0:!t||!e?!1:t.x===e.x&&t.y===e.y&&t.width===e.width&&t.height===e.height}function Dt(t,e){return{x:t.x+e.x*t.width,y:t.y+e.y*t.height,width:t.width,height:t.height}}function V(t){return t.x>=0&&t.y>=0&&t.x+t.width<=b.width&&t.y+t.height<=b.height}function tt(t){return{x:Math.max(0,Math.min(b.width-t.width,t.x)),y:Math.max(0,Math.min(b.height-t.height,t.y)),width:t.width,height:t.height}}function*nt(t,e){const n=Math.abs(e.x-t.x),o=-Math.abs(e.y-t.y),i=t.x<e.x?1:-1,s=t.y<e.y?1:-1;let r=t.x,u=t.y,d=n+o;for(;yield{x:r,y:u},!(r===e.x&&u===e.y);){const S=2*d;S>=o&&(d+=o,r+=i),S<=n&&(d+=n,u+=s)}}function*it(t,e){const n=Math.abs(e.x-t.x),o=-Math.abs(e.y-t.y),i=t.x<e.x?1:-1,s=t.y<e.y?1:-1;let r=t.x,u=t.y,d=n+o;for(;yield{x:r,y:u},!(r===e.x&&u===e.y);)2*d-o>n-2*d?(d+=o,r+=i):(d+=n,u+=s)}function Ne(t){switch(t){case"Block":return new ft;case"Snake":return new v;case"Collectable":return new C;case"Crate":return new Ge;default:throw new Error(`Unknown entity type: ${t}`)}}function Be(){g.sort((t,e)=>+(t instanceof C)-+(e instanceof C)||+(e instanceof Ge&&t instanceof v)-+(t instanceof Ge&&e instanceof v))}function j(t,e,n={}){const o=[];for(const i of g)if(i instanceof v){const s=i.at(t,e,!0,i!==n.ignoreTailOfSnake);s&&o.push(s)}else if(i.at){const s=i.at(t,e);s&&o.push(s)}return o}function Ee(t){let e=w.Black;for(const n of t)n.entity.solid&&(e=n.layer);return e}function ut(){const t=[];function e(o,i,s,r){o.addEventListener(i,s,r),t.push(()=>o.removeEventListener(i,s,r))}function n(){for(const o of t)o()}return{on:e,removeEventListeners:n}}const yt=document.querySelector("#play-button"),Pt=document.querySelector("#level-select-button"),Rt=document.querySelector("#level-editor-button"),Ot=document.querySelector("#credits-button"),Gt=document.querySelectorAll(".back-to-main-menu-button"),Nt=document.querySelector("#main-menu"),Ft=document.querySelector("#level-select"),qt=document.querySelector("#credits"),ee=document.querySelector("#level-splash"),Wt=document.querySelector("#level-splash-title");function _t(){yt.addEventListener("click",()=>{Y(),tn()}),Pt.addEventListener("click",()=>{Y(),Ft.classList.add("active")}),Rt.addEventListener("click",()=>{Y(),oe("edit"),Ae()}),Ot.addEventListener("click",()=>{Y(),qt.classList.add("active")});for(const t of Gt)t.addEventListener("click",Le);Le()}function Y(t={}){for(const e of document.querySelectorAll(".screen.active"))t.except?.includes(e.id)||e.classList.remove("active")}function Le(){Y(),Nt.classList.add("active"),oe("menu"),yt.focus()}function Ct(t){Y(),ee.classList.add("active"),Wt.textContent=t.title,Z("gong"),setTimeout(()=>{ee.style.transition="opacity .5s",ee.style.opacity="0",setTimeout(()=>{ee.classList.remove("active"),ee.style.transition="",ee.style.opacity=""},600)},2e3)}let F,le;function gt(t,e={}){F&&(F.remove(),F=void 0),t&&m&&(F=document.createElement("div"),F.classList.add("hover-effect"),document.body.appendChild(F),F?.classList.toggle("active-effect",e.pressed??!1),F?.classList.toggle("valid",e.valid??!0),Ke(F,ze(t)))}function Kt(t){le||(le=document.createElement("div"),le.classList.add("level-border"),document.body.appendChild(le)),Ke(le,ze({x:0,y:0,width:t.width,height:t.height}))}function Ke(t,e){t.style.left=`${e.x}px`,t.style.top=`${e.y}px`,t.style.width=`${e.width}px`,t.style.height=`${e.height}px`}function ce(t,e={}){const n=t?m?.analyzeMoveAbsolute(t).valid:!1;gt(t,{valid:n,...e})}const p=document.createElement("canvas"),O=p.getContext("2d");document.body.appendChild(p);const ot=document.getElementById("entities-bar"),Ut=document.querySelector(".back-to-main-menu-button");let Ue;function Fe(){const t=window.innerWidth,e=ot.getBoundingClientRect(),n=Ut.getBoundingClientRect(),o=window.innerHeight-e.bottom;p.style.transform=`translateY(${e.top}px)`,p.style.width=`${t}px`,p.style.height=`${o}px`,ot.style.paddingLeft=`${n.right}px`;const i=Math.floor(t*devicePixelRatio),s=Math.floor(o*devicePixelRatio),r=p.width!==i||p.height!==s;r&&(p.width=i,p.height=s),O.fillStyle="#000",O.fillRect(0,0,p.width,p.height),O.save(),O.translate(p.width/2,p.height/2);const u=.2,d=b.width+u*2,S=b.height+u*2,T=b.width/2,R=b.height/2,c=Math.min(p.width/d,p.height/S);O.scale(c,c),O.translate(-T,-R),Ue=O.getTransform(),r&&sn(),mt(O,g),zt(O),Kt(b),O.restore();for(const a of document.querySelectorAll(".level-specific-overlay"))Ke(a,ze({x:0,y:0,width:b.width,height:b.height}))}function mt(t,e){for(const n of e)n.draw?.(t);for(const n of e)n.draw2?.(t);for(const n of e)n.draw3?.(t)}const $e=[];function he(t,e){$e.push({tile:t,type:e})}function $t(){$e.length=0}function zt(t){t.save(),t.globalAlpha=.5,t.fillStyle="#f00",t.font="1px sans-serif",t.textAlign="center",t.textBaseline="middle";for(const{tile:e,type:n}of $e){const o=n==="overlap"?"🗗":"🛇",i=Math.sin(performance.now()/200)*.2+1;t.save(),t.translate(e.x+e.width/2,e.y+e.height/2),t.scale(i,i),t.fillText(o,0,0),t.restore()}t.restore()}function Ht(t){const e=p.getBoundingClientRect(),n=t.clientX-e.left,o=t.clientY-e.top,i=new DOMPoint(n*devicePixelRatio,o*devicePixelRatio).matrixTransform(Ue.inverse());return{x:i.x,y:i.y}}function st(t){const e=p.getBoundingClientRect(),n=new DOMPoint(t.x,t.y).matrixTransform(Ue);return{x:n.x/devicePixelRatio+e.left,y:n.y/devicePixelRatio+e.top}}function ie(t){const e=Ht(t);return{x:Math.floor(e.x),y:Math.floor(e.y),width:1,height:1}}function ze(t){const e=st(t),n=st({x:t.x+t.width,y:t.y+t.height});return{x:e.x,y:e.y,width:n.x-e.x,height:n.y-e.y}}let G="Brush",ye=ft,ge=w.White,E,de=0,te,fe=!1;function Vt(){const t=document.getElementById("entities-bar"),e=t.querySelectorAll(".entity-button"),n=t.querySelectorAll(".tool-button");function o(c){for(const a of n)a.classList.remove("selected");c.classList.add("selected")}const i=document.querySelector(".tool-button[data-tool='Eraser'"),s=document.querySelector(".tool-button[data-tool='Move'"),r=document.querySelector("#clear-button"),u=document.querySelector("#level-info-button"),d=document.querySelector("#level-info-editor"),S=document.querySelector("#level-info-editor-ok-button"),T=document.querySelector("#level-info-editor-cancel-button");i.addEventListener("click",()=>{G="Eraser",o(i)}),s.addEventListener("click",()=>{G="Move",o(s)}),r.addEventListener("click",()=>{Ae()}),u.addEventListener("click",()=>{d.showModal();const c=d.querySelector("#level-width"),a=d.querySelector("#level-height");c.value=b.width.toString(),a.value=b.height.toString()}),d.addEventListener("close",()=>{console.log(d.returnValue)}),S.addEventListener("click",c=>{c.preventDefault(),_(),b.width=parseInt(d.querySelector("#level-width").value),b.height=parseInt(d.querySelector("#level-height").value),Q(),d.close()}),T.addEventListener("click",c=>{c.preventDefault(),d.close()});for(const c of e)R(c);G==="Move"?o(s):G==="Eraser"&&o(i);function R(c){const a=c.getAttribute("data-entity"),l=c.getAttribute("data-color"),h=l==="White"?w.White:l==="Black"?w.Black:w.None;function y(){const B=Ne(a);if(B instanceof v)for(const pe of B.segments)pe.layer=h;else B instanceof X&&(B.layer=h);return B}c.addEventListener("click",()=>{ye=Ne(a).constructor,ge=h,G="Brush",o(c)}),c.classList.toggle("selected",a===ye.name&&h===ge&&G==="Brush");const f=document.createElement("canvas"),k=f.getContext("2d");c.prepend(f);const M=48,z=48;function K(){f.style.width=`${M}px`,f.style.height=`${z}px`,f.width=M*devicePixelRatio,f.height=z*devicePixelRatio;const B=y();k.scale(devicePixelRatio,devicePixelRatio),k.translate(8,8),k.scale(32,32),mt(k,[B])}K(),addEventListener("resize",K)}}function jt(t){const{on:e,removeEventListeners:n}=ut();function o(){const a=s&&J(r,s);let l=!1;r&&(G==="Move"?l=j(r.x,r.y).length>0:V(r)&&(l=!0)),gt(r,{pressed:a,valid:l}),i()}Je(o),kt(o);function i(){$t();const a=new Map;for(const l of g){const h=`${l.x??"?"},${l.y??"?"}`,y=a.get(h)??[];if(y.push(l),a.set(h,y),l instanceof X)V(l)||he(l,"out-of-bounds");else if(l instanceof v)for(const f of l.segments){V(f)||he(f,"out-of-bounds");for(const M of l.segments)f!==M&&J(f,M)&&he(f,"overlap");const k=j(f.x,f.y);Ee(k.filter(M=>M.entity!==l))===f.layer&&he(f,"collision")}}for(const l of a.values()){const h=l.filter(y=>y instanceof C);h.length>1&&he(h[1],"overlap")}}let s,r;e(t,"pointerdown",a=>{if(s=ie(a),V(s)||(s=void 0),r=s,s&&!E&&a.button===0&&G==="Move"){const l=j(s.x,s.y),h=l[l.length-1];E=h?.entity,de=h?.segmentIndex??0,E&&(_(),g.splice(g.indexOf(E),1),g.push(E),Be()),o()}else r&&d(a,r,r)}),e(window,"pointerup",u),e(window,"pointercancel",u);function u(a){s=void 0,te=void 0,E=void 0,de=0,fe=!1,r=ie(a),V(r)||(r=void 0),o()}e(window,"pointermove",a=>{const l=r;r=ie(a),!s&&!V(r)&&(r=void 0),r&&(E?R(r):d(a,l,r)),J(l,r)||o()});function d(a,l,h){if(!(!l||!h||!s)){if(a.buttons===2||G==="Eraser"&&a.buttons===1)for(const y of nt(l,h))T({x:y.x,y:y.y,width:1,height:1});else if(a.buttons===1&&G==="Brush"){const y=ye===v?it:nt;for(const f of y(l,h)){const k={x:f.x,y:f.y,width:1,height:1};S(ye===v?tt(k):k)}}}}function S(a){const l=j(a.x,a.y);if(V(a)&&Ee(l)!==ge||te instanceof v&&!J(a,te.segments[0])){fe||(_(),fe=!0);const h=te??new ye;te||h instanceof v&&(h.segments.length=0,te=h),h instanceof v?h.segments.unshift({layer:ge,x:a.x,y:a.y,width:1,height:1}):h instanceof X&&(h.layer=ge,h.x=a.x,h.y=a.y),g.includes(h)||g.push(h),Be(),Q()}}function T(a){const l=j(a.x,a.y);for(const h of l){const y=g.indexOf(h.entity);if(y>=0)if(fe||(_(),fe=!0),h.entity instanceof v&&h.entity.segments.length>=2){const f=h.entity.segments.slice(0,h.segmentIndex),k=h.entity.segments.slice(h.segmentIndex+1);if(h.entity.segments.length=f.length,k.length>0){const M=new v;M.segments.length=0,M.segments.push(...k),g.push(M),h.entity.segments.length===0&&(g.splice(y,1),h.entity===m&&We(M)),Be()}}else g.splice(y,1),h.entity===m&&We(void 0)}}function R(a){if(a=tt(a),E instanceof X)E.x=a.x,E.y=a.y;else if(E instanceof v){const l=E.segments[de];if(l.x!==a.x||l.y!==a.y){const h={x:l.x,y:l.y};for(const y of[...it(h,a)].slice(1)){for(let f=E.segments.length-1;f>de;f--)c(E.segments[f-1],E.segments[f]);for(let f=0;f<de;f++)c(E.segments[f+1],E.segments[f]);l.x=y.x,l.y=y.y,v.DEBUG_SNAKE_DRAGGING&&Fe()}}}}function c(a,l){l.x=a.x,l.y=a.y,l.width=a.width,l.height=a.height,v.DEBUG_SNAKE_DRAGGING&&Fe()}return n}function Jt(){const t=se(),e=new Blob([t],{type:"application/json"}),n=URL.createObjectURL(e),o=document.createElement("a");o.href=n,o.download="snakeshift-level.json",o.click()}function Yt(){const t=JSON.stringify([...D,se()]),e=new Blob([t],{type:"application/json"}),n=URL.createObjectURL(e),o=document.createElement("a");o.href=n,o.download="snakeshift-level-playthrough.json",o.click()}function Xt(t){const e=JSON.parse(t);if(!Array.isArray(e))throw new Error("Invalid playthrough format");pt(e[0],"play");for(const n of e.toReversed())P.push(n);Te(),alert(`Loaded playthrough with ${e.length} moves. Press 'Y' (Redo) to step through it.`)}function He(t,e,n){t.text().then(o=>{pt(o,e)&&n?.()},o=>{alert(`Failed to read level file. ${o}`)})}function pt(t,e){const n={state:se(),undos:[...D],redos:[...P]};if(_(),t.startsWith("["))return Xt(t),!0;try{if(me(t),!m){for(const o of g)if(o instanceof v){We(o);break}}}catch(o){return me(n.state),D.splice(0,D.length,...n.undos),P.splice(0,P.length,...n.redos),alert(`Failed to load level. ${o.toString()}`),!1}return oe(e),Y({except:["level-splash"]}),!0}function Zt(){const t=document.createElement("input");t.type="file",t.accept="application/json",t.addEventListener("change",()=>{const e=t.files?.[0];e&&He(e,"edit")}),t.click()}let W;function Qt(){const t=document.querySelectorAll(".level-button");for(const e of t)e.addEventListener("click",()=>{const n=e.getAttribute("data-level");Ct({title:e.textContent??"Loading..."}),en(n,()=>{W=e,Ve()})})}async function en(t,e){const n=await fetch(t);if(!n.ok){alert(`Failed to load level ${JSON.stringify(t)}: ${n.statusText}`);return}const o=await n.blob();He(o,"play",e)}function tn(){document.querySelector(".level-button").click()}function nn(){if(!W)return;const t=[...document.querySelectorAll(".level-button")],e=t.indexOf(W),n=t[e+1];n&&(W.closest("#test-cases-not-real-levels")||!n.closest("#test-cases-not-real-levels"))?n.click():(document.querySelector("#game-win-screen").classList.add("active"),Z("gongBrilliant"))}function vt(){W=void 0}function on(t){if(!t){vt();return}W=document.querySelector(`button[data-level="${t}"]`)??void 0}function Ie(){return W?.getAttribute("data-level")??""}function Ve(){W?document.title=`Snakeshift - ${W.textContent}`:x==="edit"?document.title="Snakeshift - Level Editor":document.title="Snakeshift";for(const t of document.querySelectorAll(".level-specific-overlay"))t.hidden=t.dataset.forLevel!==Ie()}const g=[],xe={width:16,height:16},b={width:xe.width,height:xe.height};let m,ue=L.KeyboardAbsoluteDirection;const D=[],P=[];function _(){D.push(se()),P.length=0}let we=0,De=0;function wt(){je(D,P,!0)&&(Z("undo",{playbackRate:1/(1+we/2),cutOffEndFraction:Math.min(.2,we/5)}),we+=1,setTimeout(()=>{we-=1},400))}function Te(){je(P,D)&&(Z("redo",{playbackRate:1+De/10}),De+=1,setTimeout(()=>{De-=1},400))}function je(t,e,n=!1){const o=t.pop();if(!o)return!1;const i=se();return e.push(i),n&&JSON.parse(i).levelId!==JSON.parse(o).levelId?(je(t,e),!0):(me(o),!0)}const qe=4;function se(){return JSON.stringify({format:"snakeshift",formatVersion:qe,levelInfo:b,entities:g,entityTypes:g.map(t=>t.constructor.name),activePlayerEntityIndex:g.indexOf(m),levelId:Ie()},null,2)+`
`}function me(t){const e=m?.id??"";g.length=0;const n=JSON.parse(t);if(n.format!=="snakeshift")throw new Error("Invalid format");if(n.formatVersion>qe)throw new Error("Format version is too new");if(n.formatVersion===1){n.formatVersion=2;for(let i=0;i<n.entities.length;i++){const s=n.entities[i];if(n.entityTypes[i]==="Snake")for(const r of s.segments)"width"in r||(r.width=r.height=r.size)}}if(n.formatVersion===2&&(n.formatVersion=3,n.levelInfo={width:16,height:16}),n.formatVersion===3){n.formatVersion=4;for(const i of n.entities)delete i._time}if(n.formatVersion!==qe)throw new Error("Invalid format version");for(let i=0;i<n.entities.length;i++){const s=n.entities[i],r=n.entityTypes[i],u=Ne(r);Object.assign(u,s),g.push(u)}b.width=n.levelInfo.width,b.height=n.levelInfo.height,m=g[n.activePlayerEntityIndex];const o=m?.id??"";e!==o&&x=="play"&&m?.highlight(),on(n.levelId),Ve(),Q()}function Ae(t=!0){t&&_(),g.length=0,b.width=xe.width,b.height=xe.height,m=void 0,Q()}function Pe(t=!1){const e=g.filter(i=>i instanceof v),o=(e.indexOf(m)+(t?-1:1)+e.length)%e.length;e[o]&&(_(),m=e[o],Z("switchSnakes"),m.highlight(),Q())}const bt=[],St=[];function Je(t){bt.push(t)}function kt(t){St.push(t)}function Q(){for(const t of bt)t()}function sn(){for(const t of St)t()}function $(t){ue=t,Q()}function We(t){m=t,Q()}function Mt(){return window._winLevelCheat?(window._winLevelCheat=!1,!0):g.filter(t=>t instanceof C).length===0}function _e(t){const{on:e,removeEventListeners:n}=ut();function o(){if(ue!==L.KeyboardFacingRelative){if(ue===L.KeyboardAbsoluteDirection)ce(void 0);else if(ue===L.Pointer){const c=i&&J(s,i);ce(s,{pressed:c})}}}Je(o),kt(o);let i,s;x!=="menu"&&(e(t,"pointerdown",c=>{i=ie(c),i&&$(L.Pointer)}),e(window,"pointerup",c=>{const a=ie(c);if(m&&a&&J(a,i)){const l=Math.round(a.x-m.segments[0].x),h=Math.round(a.y-m.segments[0].y),y=m.analyzeMoveRelative(l,h);y.valid&&(m.takeMove(y),$(L.Pointer))}i=void 0,ce(s)}),e(window,"pointercancel",()=>{i=void 0,ce(s)}),e(window,"pointermove",c=>{const a=s;s=ie(c),J(a,s)||$(L.Pointer)}));function r(c,a,l=L.KeyboardAbsoluteDirection){if(!m){const y=document.activeElement??document.body,f=y.getBoundingClientRect(),k={x:f.x+f.width/2,y:f.y+f.height/2},M={x:c/Math.hypot(c,a),y:a/Math.hypot(c,a)},z=A=>{const I=A.getBoundingClientRect(),U={x:I.x+I.width/2,y:I.y+I.height/2},re=U.x-k.x,ae=U.y-k.y,Xe={x:re/Math.hypot(re,ae),y:ae/Math.hypot(re,ae)};return M.x*Xe.x+M.y*Xe.y},K=A=>{const I=A.getBoundingClientRect(),U={x:I.x+I.width/2,y:I.y+I.height/2},re=U.x-k.x,ae=U.y-k.y;return Math.hypot(re,ae)},B=A=>K(A)/z(A),pe=A=>{const I=A.getBoundingClientRect(),U={x:I.x+I.width/2,y:I.y+I.height/2};return document.elementFromPoint(U.x,U.y)===A},H=[...document.querySelectorAll("button, a")].filter(A=>A!==y&&pe(A)&&z(A)>0);H.sort((A,I)=>B(A)-B(I)),H.length&&(console.log("focusing",H[0]),H[0].focus());return}const h=m.analyzeMoveRelative(c,a);if(!h.valid){$(l);return}m.takeMove(h),$(l)}e(window,"keydown",c=>{if(c.ctrlKey||c.metaKey||c.altKey)return;let a=!0;switch(c.code){case"ArrowLeft":case"KeyA":case"Numpad4":case"KeyH":r(-1,0);break;case"ArrowRight":case"KeyD":case"Numpad6":case"KeyL":r(1,0);break;case"ArrowUp":case"KeyW":case"Numpad8":case"KeyK":r(0,-1);break;case"ArrowDown":case"KeyS":case"Numpad2":case"KeyJ":r(0,1);break;case"Tab":case"ShiftLeft":case"ShiftRight":x==="play"?Pe():a=!1;break;default:a=!1;break}a&&c.preventDefault()});const u=new Map;function d(c,a){const l=u.get(a.index)?.get(c);return a.buttons[c].pressed&&!l}const S=.5;function T(){const c=navigator.getGamepads();let a;for(const l of c){if(!l)continue;let h=!1;if(m){const[y,f]=l.axes.slice(0,2),k=m.segments[0],M=Math.hypot(y,f),z=Math.atan2(f,y);let K=Math.round(z/(Math.PI/2));K=(K%ve.length+ve.length)%ve.length;const B=ve[K];if(M>S){h=!0,a=Dt(k,B);const H=m.analyzeMoveRelative(B.x,B.y);a&&d(0,l)&&H.valid?(m.takeMove(H),$(L.Gamepad),a=void 0):$(L.Gamepad)}}d(12,l)?r(0,-1,L.Gamepad):d(13,l)?r(0,1,L.Gamepad):d(14,l)?r(-1,0,L.Gamepad):d(15,l)&&r(1,0,L.Gamepad),d(4,l)?Pe():d(5,l)&&Pe(!0),d(0,l)?m||document.activeElement instanceof HTMLElement&&document.activeElement.click():d(2,l)?wt():d(1,l)?Te():d(3,l)&&Ye(),d(8,l)&&Le(),u.set(l.index,new Map(l.buttons.map((y,f)=>[f,y.pressed])));for(const y of l.buttons)y.pressed&&(h=!0);h&&$(L.Gamepad)}ue===L.Gamepad&&ce(a)}const R=setInterval(T,1e3/60);return()=>{n(),clearInterval(R)}}function rn(t){for(const e of g)e.step?.(t)}function Et(t=0){requestAnimationFrame(Et),rn(t),Fe()}let x="menu";const be=[],Se=[];let ne,ke=_e(p);function oe(t){x!==t&&(console.log("Switching from",x,"to",t),ke(),x=t,document.body.classList.toggle("editing",x==="edit"),vt(),Ve(),x==="edit"?(ke=jt(p),ne&&(D.splice(0,D.length,...be),P.splice(0,P.length,...Se),me(ne))):x==="play"?(ke=_e(p),be.splice(0,be.length,...D),Se.splice(0,Se.length,...P),ne=se(),D.length=0,P.length=0):(ke=_e(p),Ae(!1),D.length=0,P.length=0,be.length=0,Se.length=0,ne=void 0))}function Ye(){x==="play"&&ne&&(_(),me(ne))}const an=document.querySelector("#restart-level-button");an.addEventListener("click",Ye);addEventListener("keydown",t=>{t.key==="`"&&!t.repeat?(x==="play"?oe("edit"):x==="edit"&&oe("play"),t.preventDefault()):t.key==="z"||t.key==="Z"?(t.shiftKey?Te():wt(),t.preventDefault()):t.key==="y"?(Te(),t.preventDefault()):t.key==="r"?(Ye(),t.preventDefault()):t.key==="p"?(Yt(),t.preventDefault()):t.key==="s"&&(t.ctrlKey||t.metaKey)?(Jt(),t.preventDefault()):t.key==="o"&&(t.ctrlKey||t.metaKey)?(Zt(),t.preventDefault()):t.key==="n"&&x=="edit"?(Ae(),t.preventDefault()):t.key==="Escape"?(x==="play"?oe("edit"):Le(),t.preventDefault()):t.key==="m"&&(ct(),t.preventDefault()),lt()});p.addEventListener("pointerdown",t=>{t.preventDefault(),window.getSelection()?.removeAllRanges()});window.addEventListener("pointerdown",()=>{lt()});p.addEventListener("contextmenu",t=>{t.preventDefault()});addEventListener("dragover",t=>{t.preventDefault()});addEventListener("drop",t=>{t.preventDefault();const e=t.dataTransfer?.files[0];e&&He(e,"edit")});let Me="";Je(()=>{x==="play"&&Me!==Ie()&&(Mt()?(Me=Ie(),console.log("Level won!",Me),nn()):Me="")});_t();Vt();Qt();Object.assign(rt,await Tt(at));Et();
