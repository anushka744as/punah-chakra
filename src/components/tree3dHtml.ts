// Self-contained three.js (r128) scene for the Impact Tree, loaded in a WebView. Ported from the
// "PunahChakra impact tree, 3D prototype" reference page; the HTML panel is gone (the app draws the
// title, stats and buttons natively).
//
// Native -> web:  window.__tree.show(payload) / window.__tree.animateTo(payload)
//   payload = { seed:number, pickups:[{id, items, kg}], newIds:[pickupId], reduced:boolean, intro?:boolean }
// Web -> native:  postMessage('ready' | 'error:...')
//
// Model: a branch skeleton generated once from the seed; one growth value G (0..1) reveals branches
// (length eases out as G passes each branch's birth, thickness grows over the tree's life). One donated
// item = one leaf cluster, attached to branches in birth order so old clusters never move. New clusters
// are a lighter lime ("fresh") and fade to the mature green once the user has seen them.
export const TREE3D_HTML = String.raw`<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
html,body{margin:0;height:100%;overflow:hidden;background:transparent}
canvas{display:block;width:100%;height:100%}
</style></head>
<body><canvas id="c"></canvas>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
(function(){
'use strict';
var W=window;
function post(m){ if(W.ReactNativeWebView) W.ReactNativeWebView.postMessage(String(m)); }
W.onerror=function(msg,u,l){ post('error:'+msg+' @'+l); };
if(!W.THREE){ post('error:three-not-loaded'); return; }
var T=THREE;

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function clamp(v,a,b){a=a===undefined?0:a;b=b===undefined?1:b;return Math.min(b,Math.max(a,v))}
function easeOutCubic(t){return 1-Math.pow(1-t,3)}
function easeInOut(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}
function easeOutBack(t){var c1=1.5,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2)}

/* ---------- renderer / scene ---------- */
var canvas=document.getElementById('c'), renderer;
try{
  renderer=new T.WebGLRenderer({canvas:canvas,antialias:true,alpha:true,premultipliedAlpha:true,powerPreference:'high-performance'});
  renderer.setClearColor(0x000000,0);
}catch(e){ post('error:webgl '+e); return; }
renderer.setPixelRatio(Math.min(W.devicePixelRatio||1,2));
renderer.outputEncoding=T.sRGBEncoding;
renderer.toneMapping=T.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.0;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=T.PCFSoftShadowMap;

var scene=new T.Scene();
var camera=new T.PerspectiveCamera(30,1,0.05,120);

// No sky or backdrop: the scene is transparent so the tree stands directly on the app background.

scene.add(new T.HemisphereLight(0xe4eee8,0x5e5040,0.65));
var sun=new T.DirectionalLight(0xfff0d8,2.1);
sun.position.set(3.2,6.5,2.6);
sun.castShadow=true;
var shadowRes=((navigator.deviceMemory||4)>=4)?2048:1024;
sun.shadow.mapSize.set(shadowRes,shadowRes);
Object.assign(sun.shadow.camera,{left:-3.5,right:3.5,top:5,bottom:-1.5,near:1,far:16});
sun.shadow.bias=-0.0004;sun.shadow.normalBias=0.02;
sun.target.position.set(0,1.2,0);
scene.add(sun,sun.target);
var fillLight=new T.DirectionalLight(0xbcd2e8,0.45);
fillLight.position.set(-4,2.5,-3);
scene.add(fillLight);

/* ---------- procedural textures ---------- */
function makeCanvas(w,h){var c=document.createElement('canvas');c.width=w;c.height=h;return c}
function barkTexture(){
  var c=makeCanvas(256,512),x=c.getContext('2d'),r=mulberry32(7);
  x.fillStyle='#6f5c4a';x.fillRect(0,0,256,512);
  for(var i=0;i<1600;i++){
    var px=r()*256,py=r()*512,len=20+r()*140,dark=r()<.55;
    x.strokeStyle=dark?'rgba(38,27,19,'+(.15+r()*.4)+')':'rgba(176,158,134,'+(.06+r()*.18)+')';
    x.lineWidth=.8+r()*3.2;
    x.beginPath();x.moveTo(px,py);
    x.bezierCurveTo(px+(r()-.5)*9,py+len*.33,px+(r()-.5)*9,py+len*.66,px+(r()-.5)*6,py+len);x.stroke();
  }
  var t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(1.5,1);t.encoding=T.sRGBEncoding;t.anisotropy=4;return t;
}
function leafTexture(){
  var w=128,h=256,c=makeCanvas(w,h),x=c.getContext('2d');
  x.translate(w/2,0);
  x.beginPath();x.moveTo(0,h-6);
  x.bezierCurveTo(-60,h*.72,-48,h*.2,0,6);
  x.bezierCurveTo(48,h*.2,60,h*.72,0,h-6);x.closePath();
  var g=x.createLinearGradient(-55,0,55,0);
  g.addColorStop(0,'#c2cfb4');g.addColorStop(.48,'#f4f7ee');g.addColorStop(.52,'#e9efe0');g.addColorStop(1,'#b3c3a4');
  x.fillStyle=g;x.fill();
  x.strokeStyle='rgba(110,130,90,.55)';x.lineWidth=2.4;
  x.beginPath();x.moveTo(0,h-4);x.lineTo(0,16);x.stroke();
  x.lineWidth=1.2;x.strokeStyle='rgba(110,130,90,.38)';
  for(var i=0;i<8;i++){var y=h*.86-i*(h*.09);[-1,1].forEach(function(s){x.beginPath();x.moveTo(0,y);x.quadraticCurveTo(s*18,y-14,s*34*(1-i*.07),y-30);x.stroke();});}
  x.fillStyle='#8c9a7a';x.fillRect(-2,h-8,4,8);
  var t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.anisotropy=4;return t;
}
function groundTexture(){
  var s=512,c=makeCanvas(s,s),x=c.getContext('2d'),img=x.createImageData(s,s),r=mulberry32(3);
  var soil=[84,64,47],grass=[92,102,64],dry=[150,140,110];
  for(var j=0;j<s;j++)for(var i=0;i<s;i++){
    var dx=(i-s/2)/(s/2),dy=(j-s/2)/(s/2),d=Math.sqrt(dx*dx+dy*dy);
    var m=clamp((d-.05)/.07),n=.82+r()*.32,dm=clamp((d-.35)/.4)*.35;
    var k=(i+j*s)*4;
    for(var ch=0;ch<3;ch++){var base=soil[ch]+(grass[ch]-soil[ch])*m;img.data[k+ch]=clamp((base+(dry[ch]-base)*dm)*n,0,255);}
    img.data[k+3]=255*(1-clamp((d-.18)/.72));
  }
  x.putImageData(img,0,0);
  var t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.anisotropy=4;return t;
}
function dotTexture(){
  var c=makeCanvas(64,64),x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.35,'rgba(255,255,255,.5)');g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=g;x.fillRect(0,0,64,64);return new T.CanvasTexture(c);
}

/* ---------- ground, mound, seed, grass ---------- */
var ground=new T.Mesh(new T.CircleGeometry(6,96),new T.MeshStandardMaterial({map:groundTexture(),transparent:true,roughness:1,depthWrite:false}));
ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);

var soilMat=new T.MeshStandardMaterial({color:new T.Color(0x4a3727).convertSRGBToLinear(),roughness:1,bumpMap:barkTexture(),bumpScale:.01});
var mound=new T.Mesh(new T.SphereGeometry(1,40,12,0,Math.PI*2,0,Math.PI/2),soilMat);
mound.scale.set(.42,.06,.42);mound.receiveShadow=true;mound.castShadow=true;scene.add(mound);

var seedMesh=new T.Mesh(new T.SphereGeometry(1,24,16),new T.MeshStandardMaterial({color:new T.Color(0x5b3a22).convertSRGBToLinear(),roughness:.42}));
seedMesh.scale.set(.045,.065,.042);seedMesh.position.set(0,.07,0);seedMesh.rotation.z=.5;seedMesh.castShadow=true;scene.add(seedMesh);

var grassMesh=(function grass(){
  var g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute([-.012,0,0,.012,0,0,0,1,0],3));
  g.setAttribute('normal',new T.Float32BufferAttribute([0,0,1,0,0,1,0,0,1],3));
  var mat=new T.MeshStandardMaterial({color:0xffffff,roughness:.9,side:T.DoubleSide});
  var N=2600,mesh=new T.InstancedMesh(g,mat,N),r=mulberry32(11),m=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler(),col=new T.Color();
  var k=0;
  while(k<N){
    var a=r()*Math.PI*2,d=.44+Math.pow(r(),.7)*2.5;
    if(r()>1-clamp((d-1.4)/1.6))continue;
    e.set((r()-.5)*.5,r()*Math.PI*2,(r()-.5)*.5);q.setFromEuler(e);
    var h=.03+r()*.06;
    m.compose(new T.Vector3(Math.cos(a)*d,0,Math.sin(a)*d),q,new T.Vector3(.7+r()*.6,h,1));
    mesh.setMatrixAt(k,m);
    col.setHSL(.19+r()*.07,.22+r()*.16,.17+r()*.1).convertSRGBToLinear();mesh.setColorAt(k,col);k++;
  }
  mesh.receiveShadow=true;scene.add(mesh);return mesh;
})();

/* ---------- tree skeleton + leaf clusters (built lazily from the user's seed) ---------- */
var SPAN=0.17;                       // how much of G one branch needs to grow fully
var LPC=22;                          // leaves per cluster (1 cluster = 1 donated item)
var rng, branches=[], slots=[], leafLocal=[], baseCol=[], freshCol=[], MAX_CLUSTERS=0, builtSeed=null;
var sway=new T.Group();scene.add(sway);
var barkMat=new T.MeshStandardMaterial({map:barkTexture(),roughness:.93,color:new T.Color(0xd8cbbd).convertSRGBToLinear()});
barkMat.bumpMap=barkMat.map;barkMat.bumpScale=.012;
var cylGeo=new T.CylinderGeometry(.7,1,1,10,1,true);cylGeo.translate(0,.5,0);
var knotGeo=new T.SphereGeometry(1,10,8);
var leafTex=leafTexture();
var leafMat=new T.MeshStandardMaterial({map:leafTex,alphaTest:.5,side:T.DoubleSide,roughness:.6,metalness:0});
var timeU={value:0};
leafMat.onBeforeCompile=function(sh){
  sh.uniforms.uTime=timeU;
  sh.vertexShader='uniform float uTime;\n'+sh.vertexShader.replace('#include <begin_vertex>',
    '#include <begin_vertex>\n#ifdef USE_INSTANCING\n'+
    'vec3 ip=vec3(instanceMatrix[3][0],instanceMatrix[3][1],instanceMatrix[3][2]);\n'+
    'float w=sin(uTime*1.6+ip.x*4.0+ip.z*3.0)*.6+sin(uTime*2.9+ip.y*5.0)*.3;\n'+
    'transformed.z+=w*.16*position.y;\ntransformed.x+=w*.05*position.y;\n#endif');
};
var leafGeo=new T.PlaneGeometry(.55,1);leafGeo.translate(0,.5,0);
var leafDepthMat=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking,map:leafTex,alphaTest:.5});
var leaves=null;

function gen(parent,order,len,rad,birth,tilt,yaw,attach){
  var id=branches.length;
  branches.push({parent:parent,order:order,len:len,rad:rad,birth:birth,tilt:tilt,yaw:yaw,attach:attach});
  if(order>=5)return;
  gen(id,order+1,len*(.74+rng()*.08),rad*.7,birth+SPAN*.82+rng()*.02,(rng()-.5)*.38,rng()*Math.PI*2,1);
  var nLat=order===0?4:(order<3?2:(rng()<.55?2:1));
  for(var k=0;k<nLat;k++){
    var frac=order===0?.62+k*.1+rng()*.06:.4+rng()*.5;
    var tl=order<1?.62+rng()*.28:(order<3?.55+rng()*.35:.4+rng()*.45);
    gen(id,order+1,len*(.58+rng()*.14)*(1.15-frac*.3),rad*.56,birth+SPAN*frac*.9+.015+rng()*.03,tl,k*2.39996+rng()*.7+id*.37,frac);
  }
}

// growth state
var disp={G:0,count:0}, anim={active:false,from:0,to:0,t0:0,dur:1};
var clusterStart=new Float32Array(1), freshness=new Float32Array(1), freshTarget=new Float32Array(1);
var nPick=0, treeHeight=.3, needsLayout=true, reduced=false, introDone=false, lastJSON='';

function build(seed){
  while(sway.children.length) sway.remove(sway.children[0]);
  if(leaves){ leaves.dispose(); leaves=null; }
  rng=mulberry32((seed>>>0)||1); branches=[];
  gen(-1,0,1.3,.09,0,0,0,0);
  var mb=Math.max.apply(null,branches.map(function(b){return b.birth}));
  branches.forEach(function(b){b.birth=b.birth/mb*(1-SPAN)});
  branches.forEach(function(b){
    b.group=new T.Group();b.group.rotation.set(b.tilt,b.yaw,0,'YXZ');
    (b.parent<0?sway:branches[b.parent].group).add(b.group);
    b.mesh=new T.Mesh(cylGeo,barkMat);b.mesh.castShadow=b.mesh.receiveShadow=true;
    b.knot=new T.Mesh(knotGeo,barkMat);b.knot.castShadow=true;
    b.group.add(b.mesh,b.knot);
    b.curLen=0;b.curRad=0;
  });
  slots=branches.map(function(b,i){return {branch:i,birth:b.birth+rng()*.01}}).sort(function(a,b){return a.birth-b.birth});
  MAX_CLUSTERS=slots.length;
  leafLocal=[];
  slots.forEach(function(s){
    var arr=[],b=branches[s.branch],spread=.1+.05*Math.min(1,b.len);
    for(var j=0;j<LPC;j++){
      var p=new T.Vector3((rng()-.5)*2*spread,(rng()-.5)*2*spread*.9-rng()*.1,(rng()-.5)*2*spread);
      var q=new T.Quaternion().setFromEuler(new T.Euler((rng()-.5)*2.6,rng()*Math.PI*2,(rng()-.5)*2.6));
      arr.push({p:p,q:q,size:.12+rng()*.07,along:rng()*.3,delay:j*.025+rng()*.05});
    }
    leafLocal.push(arr);
  });
  leaves=new T.InstancedMesh(leafGeo,leafMat,MAX_CLUSTERS*LPC);
  leaves.customDepthMaterial=leafDepthMat;
  leaves.castShadow=true;leaves.receiveShadow=false;leaves.frustumCulled=false;
  leaves.instanceMatrix.setUsage(T.DynamicDrawUsage);
  sway.add(leaves);
  baseCol=[];freshCol=[];
  for(var i=0;i<MAX_CLUSTERS*LPC;i++){
    var ord=branches[slots[Math.floor(i/LPC)].branch].order,inner=.55+.45*Math.min(1,ord/5)+(rng()-.5)*.1;
    baseCol.push(new T.Color().setHSL(.24+rng()*.07,.38+rng()*.2,(.26+rng()*.14)*inner).convertSRGBToLinear());
    freshCol.push(new T.Color().setHSL(.19+rng()*.04,.62+rng()*.15,(.44+rng()*.1)*(.75+.25*inner)).convertSRGBToLinear());
  }
  for(var i2=0;i2<MAX_CLUSTERS*LPC;i2++)leaves.setColorAt(i2,baseCol[i2]);
  leaves.count=0;  // must come after setColorAt (r128 sizes the colour buffer from count)
  clusterStart=new Float32Array(MAX_CLUSTERS).fill(-1e9);
  freshness=new Float32Array(MAX_CLUSTERS);freshTarget=new Float32Array(MAX_CLUSTERS);
  disp.G=0;disp.count=0;anim.active=false;builtSeed=seed;needsLayout=true;
}

/* ---------- sparkles when new leaves open ---------- */
var PN=500,pPos=new Float32Array(PN*3),pCol=new Float32Array(PN*3),pVel=new Float32Array(PN*3),pLife=new Float32Array(PN);
var pGeo=new T.BufferGeometry();
pGeo.setAttribute('position',new T.BufferAttribute(pPos,3));
pGeo.setAttribute('color',new T.BufferAttribute(pCol,3));
var points=new T.Points(pGeo,new T.PointsMaterial({size:.05,map:dotTexture(),vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));
points.frustumCulled=false;scene.add(points);
var pNext=0;
function spawnSparkles(pos,n){
  for(var k=0;k<n;k++){
    var i=pNext;pNext=(pNext+1)%PN;
    pPos[i*3]=pos.x+(Math.random()-.5)*.15;pPos[i*3+1]=pos.y+(Math.random()-.5)*.15;pPos[i*3+2]=pos.z+(Math.random()-.5)*.15;
    pVel[i*3]=(Math.random()-.5)*.08;pVel[i*3+1]=.12+Math.random()*.2;pVel[i*3+2]=(Math.random()-.5)*.08;
    pLife[i]=1;
  }
}
function updateSparkles(dt){
  for(var i=0;i<PN;i++){
    if(pLife[i]<=0){pCol[i*3]=pCol[i*3+1]=pCol[i*3+2]=0;continue;}
    pLife[i]-=dt*.7;
    pPos[i*3]+=pVel[i*3]*dt;pPos[i*3+1]+=pVel[i*3+1]*dt;pPos[i*3+2]+=pVel[i*3+2]*dt;
    var a=Math.max(0,pLife[i]),f=a*(1-a)*4;
    pCol[i*3]=1*f;pCol[i*3+1]=.9*f;pCol[i*3+2]=.55*f;
  }
  pGeo.attributes.position.needsUpdate=true;pGeo.attributes.color.needsUpdate=true;
}

/* ---------- layout: place branches and leaves for the current growth ---------- */
var M=new T.Matrix4(),TM=new T.Matrix4(),L=new T.Matrix4(),S=new T.Vector3(),V=new T.Vector3(),Q=new T.Quaternion(),tmpC=new T.Color();
function layout(now){
  var G=disp.G,maxY=.15,i,j;
  for(i=0;i<branches.length;i++){
    var b=branches[i],local=clamp((G-b.birth)/SPAN),e=easeOutCubic(local);
    var thick=.22+.78*clamp((G-b.birth)/(1-b.birth+1e-4));
    b.curLen=b.len*e;
    b.curRad=Math.max(.0016,b.rad*thick*(.35+.65*e));
    var vis=local>0.002;
    b.group.visible=vis;
    if(!vis)continue;
    if(b.parent>=0)b.group.position.y=branches[b.parent].curLen*b.attach;
    b.mesh.scale.set(b.curRad,b.curLen,b.curRad);
    b.knot.position.y=b.curLen;b.knot.scale.setScalar(b.curRad*.7);
  }
  var sx=sway.rotation.x,sz=sway.rotation.z;
  sway.rotation.set(0,0,0);sway.updateMatrixWorld(true);
  var count=disp.count;
  for(i=0;i<count;i++){
    var br=branches[slots[i].branch];
    var st=clamp((now-clusterStart[i])/0.85);
    var f=freshness[i];
    for(j=0;j<LPC;j++){
      var lf=leafLocal[i][j],idx=i*LPC+j;
      var sj=clamp((now-clusterStart[i]-lf.delay)/0.75);
      var s=st<=0?0:easeOutBack(sj)*lf.size;
      TM.makeTranslation(lf.p.x,br.curLen*(1-lf.along)+lf.p.y,lf.p.z);
      Q.copy(lf.q);
      var sc=Math.max(s,1e-5);
      L.compose(V.set(0,0,0),Q,S.set(sc,sc,sc));
      M.multiplyMatrices(br.group.matrixWorld,TM).multiply(L);
      leaves.setMatrixAt(idx,M);
      tmpC.copy(baseCol[idx]).lerp(freshCol[idx],f);
      leaves.setColorAt(idx,tmpC);
      if(j===0){V.setFromMatrixPosition(M);if(V.y>maxY)maxY=V.y;}
    }
  }
  for(i=0;i<branches.length;i++){var bb=branches[i];if(bb.group.visible){V.set(0,bb.curLen,0).applyMatrix4(bb.group.matrixWorld);if(V.y>maxY)maxY=V.y;}}
  sway.rotation.set(sx,0,sz);
  leaves.count=count*LPC;
  leaves.instanceMatrix.needsUpdate=true;
  if(leaves.instanceColor)leaves.instanceColor.needsUpdate=true;
  treeHeight=maxY;
  seedMesh.visible=G<.04;
}

/* ---------- growth model (G from item count, with kg as a floor) ---------- */
// Every pickup must visibly change the tree: growth comes from the pickup count (so each one extends
// the branches), with kg and item count as floors, and every pickup adds at least one cluster per item
// plus enough clusters to cover the branches that have just grown.
function gKgOf(kg){ return Math.sqrt(Math.min(kg,160)/160)*.35; }
function gPickOf(n){ return .05+.75*(1-Math.exp(-n/9)); }
function clustersReached(g){
  var c=0; while(c<slots.length&&slots[c].birth+SPAN*.45<=g) c++; return c;
}
function modelOf(p){
  var owners=[],kg=0,items=0,nC=0;
  p.pickups.forEach(function(pk,idx){
    kg+=pk.kg||0;items+=pk.items;
    var g=Math.max(gKgOf(kg),gPickOf(idx+1));
    var want=Math.min(MAX_CLUSTERS,Math.max(nC,items*3,clustersReached(g)));
    for(var j=nC;j<want;j++) owners.push(pk.id);
    nC=want;
  });
  var ns={};(p.newIds||[]).forEach(function(id){ns[id]=1;});
  var isNew=owners.map(function(o){return !!ns[o];});
  var n=p.pickups.length, G=0;
  if(n>0||kg>0||items>0){
    G=Math.max(gKgOf(kg),gPickOf(n),nC>0?slots[nC-1].birth+SPAN*.45:0,.05);
  }
  return{G:clamp(G),count:nC,isNew:isNew};
}
function ensureBuilt(p){ if(builtSeed!==p.seed) build(p.seed); }

function instant(m){
  disp.G=m.G;disp.count=m.count;anim.active=false;clusterStart.fill(-1e9);
  for(var i=0;i<MAX_CLUSTERS;i++){
    var on=i<m.count&&m.isNew[i];
    freshTarget[i]=on?1:0;
    if(on)freshness[i]=1; else if(i>=m.count)freshness[i]=0; // others fade down to mature green
  }
  needsLayout=true;
}
function growTo(m,intro){
  var old={G:disp.G,count:disp.count},now=performance.now()/1000;
  var dur=reduced?.01:(intro?2.6:1.8);
  anim.active=true;anim.from=old.G;anim.to=m.G;anim.t0=now;anim.dur=dur;
  var n=m.count-old.count;
  for(var i=0;i<MAX_CLUSTERS;i++){
    var on=i<m.count&&m.isNew[i];
    freshTarget[i]=on?1:0;
    if(i>=old.count&&i<m.count){
      var k=i-old.count;
      clusterStart[i]=now+(reduced?0:dur*.5+k*(intro?.05:Math.min(.16,1.4/Math.max(1,n))));
      freshness[i]=on?1:0;
    } else if(i>=m.count){ freshness[i]=0; }
  }
  disp.count=m.count;needsLayout=true;
}

W.__tree={
  show:function(p){
    var s=JSON.stringify(p);if(s===lastJSON)return;lastJSON=s;
    reduced=!!p.reduced;ensureBuilt(p);nPick=p.pickups.length;
    var m=modelOf(p);
    if(p.intro&&!introDone&&!reduced&&m.count>0){
      introDone=true;disp.G=0;disp.count=0;growTo(m,true);
    } else { introDone=true; instant(m); }
  },
  // A ready-to-post picture: the live tree on a soft card with the kg, stage and branding.
  // Returns base64 PNG (no data: prefix). Must render and draw in the same task so the GL buffer is valid.
  snapshot:function(meta,done){
    try{
      if(!leaves){ done(null); return; }
      renderer.render(scene,camera);
      // copy the GL canvas right now: its buffer is only guaranteed valid in this task
      var tc=makeCanvas(canvas.width,canvas.height);tc.getContext('2d').drawImage(canvas,0,0);
      var imgs={},left=2;
      var compose=function(){
        try{
          var w=1080,h=1350,c=makeCanvas(w,h),x=c.getContext('2d');
          var g=x.createLinearGradient(0,0,0,h);
          g.addColorStop(0,'#dff2e6');g.addColorStop(.5,'#f7f2e5');g.addColorStop(1,'#eadfc6');
          x.fillStyle=g;x.fillRect(0,0,w,h);
          var rg2=x.createRadialGradient(w/2,640,60,w/2,640,620);
          rg2.addColorStop(0,'rgba(255,255,255,.85)');rg2.addColorStop(1,'rgba(255,255,255,0)');
          x.fillStyle=rg2;x.fillRect(0,0,w,h);
          // real logo: emblem + wordmark side by side, like the app header
          var eh=118,ew=imgs.emblem?eh*imgs.emblem.width/imgs.emblem.height:0;
          var wh=64,ww=imgs.wordmark?wh*imgs.wordmark.width/imgs.wordmark.height:0;
          var gap=26,total=ew+(ew&&ww?gap:0)+ww,lx=(w-total)/2;
          if(imgs.emblem){x.drawImage(imgs.emblem,lx,50,ew,eh);lx+=ew+gap;}
          if(imgs.wordmark){x.drawImage(imgs.wordmark,lx,50+(eh-wh)/2,ww,wh);}
          x.textAlign='center';x.fillStyle='#5b695f';x.font='500 30px sans-serif';
          x.fillText('Every item deserves another chance',w/2,212);
          // the tree
          var cw=tc.width,ch=tc.height,s=Math.min(1000/cw,670/ch),dw=cw*s,dh=ch*s;
          x.drawImage(tc,(w-dw)/2,238,dw,dh);
          x.fillStyle='#0b6b30';x.font='800 150px sans-serif';
          x.fillText(String(meta.kg)+' kg',w/2,1078);
          x.fillStyle='#1c2821';x.font='600 40px sans-serif';
          x.fillText('rescued from landfill',w/2,1160);
          var line=meta.stage+(meta.name?'  \u201c'+meta.name+'\u201d':'');
          x.fillStyle='#16a34a';x.font='700 44px sans-serif';x.fillText(line,w/2,1222);
          var pill=function(txt,cx){
            x.font='700 30px sans-serif';var pw=x.measureText(txt).width+56;
            x.fillStyle='rgba(22,163,74,.14)';
            var px=cx-pw/2,py=1256,ph=64,r=32;
            x.beginPath();x.moveTo(px+r,py);x.arcTo(px+pw,py,px+pw,py+ph,r);x.arcTo(px+pw,py+ph,px,py+ph,r);x.arcTo(px,py+ph,px,py,r);x.arcTo(px,py,px+pw,py,r);x.closePath();x.fill();
            x.fillStyle='#0b6b30';x.fillText(txt,cx,py+43);
          };
          pill(meta.items+' items rehomed',w/2-170);pill(meta.pickups+(meta.pickups===1?' pickup':' pickups'),w/2+190);
          done(c.toDataURL('image/png').split(',')[1]);
        }catch(e){ post('error:snapshot '+e); done(null); }
      };
      var fin=function(){ if(--left===0) compose(); };
      ['emblem','wordmark'].forEach(function(k){
        if(!meta[k]){ fin(); return; }
        var im=new Image();im.onload=function(){imgs[k]=im;fin();};im.onerror=fin;im.src=meta[k];
      });
    }catch(e){ post('error:snapshot '+e); done(null); }
  },
  animateTo:function(p){
    lastJSON=JSON.stringify(p);reduced=!!p.reduced;ensureBuilt(p);nPick=p.pickups.length;
    var m=modelOf(p);
    if(reduced||(m.count<=disp.count&&m.G<=disp.G)){ instant(m); return; }
    growTo(m,false);
  }
};

function resize(){
  var w=W.innerWidth||300,h=W.innerHeight||300;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}
W.addEventListener('resize',resize);resize();

/* ---------- loop: grow, flutter, slow turn, keep the whole tree framed ---------- */
var cam={theta:.6,phi:1.32,r:6,ty:1.2}, rg=1.5, last=performance.now()/1000;
function frame(){
  requestAnimationFrame(frame);
  if(document.hidden||!leaves)return;
  var now=performance.now()/1000,dt=Math.min(.05,now-last);last=now;
  if(!reduced)timeU.value=now;
  if(anim.active){
    var t=clamp((now-anim.t0)/anim.dur);
    disp.G=anim.from+(anim.to-anim.from)*easeInOut(t);
    if(t>=1)anim.active=false;
    needsLayout=true;
  }
  var unfolding=false,i;
  for(i=0;i<disp.count;i++){
    var age=now-clusterStart[i];
    if(age>-0.05&&age<1.1)unfolding=true;
    if(age>=0&&age<dt*1.5&&!reduced){var bb=branches[slots[i].branch];V.set(0,bb.curLen,0).applyMatrix4(bb.group.matrixWorld);spawnSparkles(V,6);}
    if(freshness[i]!==freshTarget[i]){
      freshness[i]+=(freshTarget[i]-freshness[i])*Math.min(1,dt*1.2);
      if(Math.abs(freshness[i]-freshTarget[i])<.01)freshness[i]=freshTarget[i];
      needsLayout=true;
    }
  }
  if(unfolding)needsLayout=true;
  if(needsLayout){layout(now);needsLayout=false;}
  if(!reduced){
    sway.rotation.z=Math.sin(now*.55)*.008;sway.rotation.x=Math.sin(now*.41+1)*.006;
    cam.theta+=dt*.06;
    if(seedMesh.visible)seedMesh.position.y=.07+Math.sin(now*3)*.012;
  }
  updateSparkles(dt);
  // the frame itself grows with the pickup count, so every pickup visibly makes the tree bigger in view
  var h=Math.max(.35,treeHeight,1.1+2.3*Math.min(1,nPick/12)),tanH=Math.tan(T.MathUtils.degToRad(camera.fov/2));
  var needH=(h*1.3+.2)/(2*tanH*.9);
  var needW=(Math.max(1.2,h*1.05))/(2*tanH*camera.aspect*.92);
  var fitR=Math.max(needH,needW,1.6);
  // ground island: sized to what the view can show (below the tree base and across), so its soft edge
  // always fades out inside the view and never gets cut by the canvas boundary
  var rgT=Math.max(.8,Math.min(cam.r*tanH*camera.aspect*.8,(.2*h+.08)/.3));
  rg+=(rgT-rg)*Math.min(1,dt*2);
  ground.scale.set(rg/6,rg/6,rg/6);grassMesh.scale.setScalar(rg/3.3);
  cam.r+=(fitR-cam.r)*Math.min(1,dt*1.6);
  cam.ty+=(h*.5-cam.ty)*Math.min(1,dt*1.6);
  camera.position.set(Math.sin(cam.theta)*Math.sin(cam.phi)*cam.r,cam.ty+Math.cos(cam.phi)*cam.r,Math.cos(cam.theta)*Math.sin(cam.phi)*cam.r);
  camera.lookAt(0,cam.ty,0);
  renderer.render(scene,camera);
}
requestAnimationFrame(frame);
post('ready');
})();
</script></body></html>`;
