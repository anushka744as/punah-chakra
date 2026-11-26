// Self-contained three.js (r128) scene for the Impact Tree, loaded in a WebView.
// Native -> web:  window.__tree.show(payload) / window.__tree.animateTo(payload)
//   payload = { seed:number, pickups:[{id, items, kg}], newIds:[pickupId], reduced:boolean }
// Web -> native:  postMessage('ready' | 'error:...')
//
// Model: a branch skeleton generated once from the seed. Each branch has a `birth` in 0..1; a single
// growth value G reveals branches (length eases out as G passes the birth), and trunk/branches thicken
// with G. One donated item = one leaf cluster, attached to branches in birth order, so old clusters
// never move. New clusters render lime and mature to dark green once seen.
export const TREE3D_HTML = String.raw`<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
html,body{margin:0;height:100%;overflow:hidden;background:linear-gradient(#e6f6ec,#fbf8ee)}
canvas{display:block;width:100%;height:100%}
</style></head>
<body><canvas id="c"></canvas>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
(function(){
var W=window;
function post(m){ if(W.ReactNativeWebView) W.ReactNativeWebView.postMessage(String(m)); }
W.onerror=function(msg,u,l){ post('error:'+msg+' @'+l); };
if(!W.THREE){ post('error:three-not-loaded'); return; }
var T=THREE;

var renderer;
try{
  renderer=new T.WebGLRenderer({canvas:document.getElementById('c'),antialias:true,alpha:true,powerPreference:'high-performance'});
}catch(e){ post('error:webgl '+e); return; }
renderer.setPixelRatio(Math.min(W.devicePixelRatio||1,2));
renderer.outputEncoding=T.sRGBEncoding;
renderer.toneMapping=T.ACESFilmicToneMapping;
renderer.toneMappingExposure=0.92;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=T.PCFSoftShadowMap;

var scene=new T.Scene();
var camera=new T.PerspectiveCamera(32,1,0.1,100);
var FOV=32;

// ---------- lights: warm key + cool fill + hemisphere ----------
var key=new T.DirectionalLight(0xffe6c0,1.55); key.position.set(4,7,5); key.castShadow=true;
key.shadow.mapSize.set(1024,1024); key.shadow.camera.left=-5; key.shadow.camera.right=5;
key.shadow.camera.top=6; key.shadow.camera.bottom=-2; key.shadow.camera.near=1; key.shadow.camera.far=22; key.shadow.bias=-0.0006;
scene.add(key);
var fill=new T.DirectionalLight(0xa9c4ff,0.4); fill.position.set(-5,3,-3); scene.add(fill);
scene.add(new T.HemisphereLight(0xd8efff,0x4a3b2a,0.5));

// ---------- helpers ----------
function mulberry(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; var t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function clamp(x,a,b){ return Math.max(a,Math.min(b,x)); }
function easeIO(p){ return p<0.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2; }
function easeOutBack(p){ var c1=1.70158,c3=c1+1; return 1+c3*Math.pow(p-1,3)+c1*Math.pow(p-1,2); }
var UP=new T.Vector3(0,1,0);

// ---------- procedural textures ----------
function barkTexture(){
  var c=document.createElement('canvas'); c.width=256; c.height=512; var g=c.getContext('2d');
  g.fillStyle='#6a4e39'; g.fillRect(0,0,256,512);
  var r=mulberry(7);
  for(var i=0;i<420;i++){
    var x=r()*256, w=1+r()*3, a=0.08+r()*0.22, dark=r()>0.45;
    g.fillStyle=dark?'rgba(30,18,10,'+a+')':'rgba(150,115,80,'+a+')';
    g.fillRect(x,0,w,512);
  }
  for(var j=0;j<1800;j++){ g.fillStyle='rgba(20,12,6,'+(r()*0.25)+')'; g.fillRect(r()*256,r()*512,1+r()*3,1+r()*6); }
  var t=new T.CanvasTexture(c); t.wrapS=t.wrapT=T.RepeatWrapping; t.encoding=T.sRGBEncoding; t.anisotropy=4; return t;
}
function leafTexture(){
  var c=document.createElement('canvas'); c.width=128; c.height=192; var g=c.getContext('2d');
  g.clearRect(0,0,128,192);
  g.beginPath(); g.moveTo(64,186);
  g.bezierCurveTo(10,140,8,60,64,6); g.bezierCurveTo(120,60,118,140,64,186); g.closePath();
  var grad=g.createLinearGradient(0,0,0,192); grad.addColorStop(0,'#f1faE4'); grad.addColorStop(1,'#c6e2a8');
  g.fillStyle=grad; g.fill();
  g.strokeStyle='rgba(120,160,90,0.9)'; g.lineWidth=2.4;
  g.beginPath(); g.moveTo(64,186); g.lineTo(64,16); g.stroke();
  g.lineWidth=1.3;
  for(var i=0;i<6;i++){ var y=150-i*22; g.beginPath(); g.moveTo(64,y); g.lineTo(64-34+i*3,y-26); g.moveTo(64,y); g.lineTo(64+34-i*3,y-26); g.stroke(); }
  var t=new T.CanvasTexture(c); t.encoding=T.sRGBEncoding; t.anisotropy=4; return t;
}
var barkTex=barkTexture(), leafTex=leafTexture();

// ---------- ground, soil mound, grass ----------
var ground=new T.Mesh(new T.CircleGeometry(2.3,48),new T.MeshStandardMaterial({color:0x5f9448,roughness:1}));
ground.rotation.x=-Math.PI/2; ground.position.y=-0.02; ground.receiveShadow=true; scene.add(ground);
var soilTex=barkTex.clone(); soilTex.needsUpdate=true; soilTex.repeat.set(3,2);
var mound=new T.Mesh(new T.SphereGeometry(1,32,16),new T.MeshStandardMaterial({color:0x6b5038,roughness:1,bumpMap:soilTex,bumpScale:0.6}));
mound.scale.set(0.55,0.13,0.55); mound.position.y=0.0; mound.receiveShadow=true; mound.castShadow=true; scene.add(mound);
(function grass(){
  var n=210, geo=new T.ConeGeometry(0.026,0.2,3); geo.translate(0,0.1,0);
  var m=new T.InstancedMesh(geo,new T.MeshStandardMaterial({roughness:0.9}),n);
  var r=mulberry(99), d=new T.Object3D(), col=new T.Color();
  for(var i=0;i<n;i++){
    var a=r()*Math.PI*2, rad=0.45+Math.sqrt(r())*1.8;
    d.position.set(Math.cos(a)*rad,0,Math.sin(a)*rad); d.rotation.set((r()-0.5)*0.3,r()*6,(r()-0.5)*0.3);
    var s=0.7+r()*1.1; d.scale.set(s,s*(0.8+r()*0.9),s); d.updateMatrix(); m.setMatrixAt(i,d.matrix);
    col.setHSL(0.27+r()*0.06,0.55+r()*0.2,0.2+r()*0.12); m.setColorAt(i,col);
  }
  m.instanceMatrix.needsUpdate=true; m.instanceColor.needsUpdate=true; m.castShadow=false; scene.add(m);
})();

// seed shown before the first pickup
var seedMesh=new T.Mesh(new T.SphereGeometry(0.09,16,12),new T.MeshStandardMaterial({color:0x5a3d22,roughness:0.7}));
seedMesh.scale.set(1,1.3,1); seedMesh.position.y=0.14; seedMesh.castShadow=true; scene.add(seedMesh);

// ---------- tree skeleton (generated once per seed) ----------
var SPAN=[0.30,0.16,0.12,0.10,0.09];
function spanFor(d){ return SPAN[d]; }
var MAXC=120, LP=22;
var treeGroup=new T.Group(); scene.add(treeGroup);
var branchGeo=new T.CylinderGeometry(0.62,1,1,7,1); branchGeo.translate(0,0.5,0);
var barkMat=new T.MeshStandardMaterial({map:barkTex,bumpMap:barkTex,bumpScale:0.7,roughness:0.95,color:0xffffff});
var B=[], meshes=[], leafB=[], leafData=[], skSeed=null;

function buildSkeleton(seed){
  for(var i=0;i<meshes.length;i++){ treeGroup.remove(meshes[i]); }
  B=[]; meshes=[]; skSeed=seed;
  var R=mulberry((seed>>>0)||1);
  function add(base,dir,len,rad,depth,parent,t){
    var b={base:base.clone(),dir:dir.clone().normalize(),len:len,rad:rad,depth:depth,parent:parent,t:t,birth:0,p:0,vis:0,
           cb:new T.Vector3(),ct:new T.Vector3()};
    B.push(b); return b;
  }
  var trunk=add(new T.Vector3(0,0,0),new T.Vector3((R()-0.5)*0.1,1,(R()-0.5)*0.1),2.0,0.17,0,null,0);
  function spawn(p){
    if(p.depth>=4) return;
    var n=p.depth===0?9:(p.depth===1?3:(p.depth===2?3:2));
    var u=new T.Vector3(), v=new T.Vector3();
    u.crossVectors(p.dir,Math.abs(p.dir.y)>0.9?new T.Vector3(1,0,0):UP).normalize(); v.crossVectors(p.dir,u).normalize();
    for(var i=0;i<n;i++){
      var t=p.depth===0?0.3+0.65*(i/(n-1)):0.3+0.65*R();
      var az=i*2.399963+R()*0.8+p.depth*1.3;
      var tilt=(p.depth===0?0.7:0.62)+R()*0.38;
      var side=u.clone().multiplyScalar(Math.cos(az)).addScaledVector(v,Math.sin(az));
      var d=p.dir.clone().multiplyScalar(Math.cos(tilt)).addScaledVector(side,Math.sin(tilt));
      d.y+=0.3; d.normalize();
      var base=p.base.clone().addScaledVector(p.dir,p.len*t);
      var scale=(p.depth===0?0.52:0.68)*(1.15-0.5*t)*(0.88+0.28*R());
      var c=add(base,d,Math.max(0.22,p.len*scale),Math.max(0.012,p.rad*0.62),p.depth+1,p,t);
      c.birth=p.birth+spanFor(p.depth)*t*0.9+R()*0.01;
      spawn(c);
    }
  }
  spawn(trunk);
  var maxBirth=0; for(var k=0;k<B.length;k++) maxBirth=Math.max(maxBirth,B[k].birth);
  var f=0.86/maxBirth; for(var k2=0;k2<B.length;k2++) B[k2].birth*=f;
  for(var q=0;q<B.length;q++){ var m=new T.Mesh(branchGeo,barkMat); m.castShadow=true; m.visible=false; treeGroup.add(m); meshes.push(m); }
  // leaf clusters attach to branches in birth order (depth>=1), so older clusters never move
  leafB=B.filter(function(b){return b.depth>=1;}).sort(function(a,b){return a.birth-b.birth;}).slice(0,MAXC);
  var LR=mulberry(((seed>>>0)||1)+31337); leafData=[];
  var q2=new T.Quaternion(), e=new T.Euler();
  for(var kk=0;kk<MAXC;kk++){
    for(var ii=0;ii<LP;ii++){
      var rad=0.18+LR()*0.3, th=LR()*Math.PI*2, ph=Math.acos(2*LR()-1);
      e.set(LR()*6.28,LR()*6.28,LR()*6.28); q2.setFromEuler(e);
      leafData.push({x:Math.sin(ph)*Math.cos(th)*rad,y:Math.sin(ph)*Math.sin(th)*rad*0.85,z:Math.cos(ph)*rad,q:q2.clone(),sc:0.8+LR()*0.55,shade:Math.floor(LR()*4)});
    }
  }
}

// ---------- instanced leaves (one InstancedMesh) ----------
var leafGeo=new T.PlaneGeometry(0.2,0.3); leafGeo.translate(0,0.15,0);
var uTime={value:0};
var leafMat=new T.MeshStandardMaterial({map:leafTex,alphaTest:0.5,side:T.DoubleSide,roughness:0.6,metalness:0});
leafMat.onBeforeCompile=function(sh){
  sh.uniforms.uTime=uTime;
  sh.vertexShader='uniform float uTime;\n'+sh.vertexShader.replace('#include <begin_vertex>',
    '#include <begin_vertex>\n#ifdef USE_INSTANCING\nfloat ph=instanceMatrix[3].x*5.0+instanceMatrix[3].z*4.0+instanceMatrix[3].y*3.0;\n'+
    'transformed.x+=sin(uTime*2.2+ph)*position.y*0.16;\ntransformed.z+=cos(uTime*1.9+ph)*position.y*0.16;\n#endif');
};
var leaves=new T.InstancedMesh(leafGeo,leafMat,MAXC*LP);
var PALETTE=[0x2f6f2f,0x3a7d34,0x2a6a3a,0x437f3a].map(function(h){return new T.Color(h);});
var LIME=new T.Color(0xb9e63a);
var dummy=new T.Object3D(), tmpC=new T.Color();
// colour buffer must exist before count is set (three r128 sizes it from count)
for(var ci=0;ci<MAXC*LP;ci++) leaves.setColorAt(ci,PALETTE[0]);
leaves.count=0; leaves.castShadow=false; leaves.frustumCulled=false; treeGroup.add(leaves);

// ---------- motes (warm light specks rising as a cluster opens) ----------
var NM=64, moteGeo=new T.BufferGeometry(), motePos=new Float32Array(NM*3), moteLife=new Float32Array(NM), moteVel=new Float32Array(NM);
for(var mi=0;mi<NM;mi++){ motePos[mi*3+1]=-100; }
moteGeo.setAttribute('position',new T.BufferAttribute(motePos,3));
var motes=new T.Points(moteGeo,new T.PointsMaterial({color:0xffe08a,size:0.09,transparent:true,opacity:0.9,depthWrite:false,blending:T.AdditiveBlending}));
motes.frustumCulled=false; treeGroup.add(motes);
var moteNext=0;
function spawnMotes(p){
  for(var i=0;i<3;i++){ var j=moteNext++%NM; motePos[j*3]=p.x+(Math.random()-0.5)*0.3; motePos[j*3+1]=p.y; motePos[j*3+2]=p.z+(Math.random()-0.5)*0.3; moteLife[j]=1; moteVel[j]=0.4+Math.random()*0.5; }
}

// ---------- state ----------
var model=null, view={G:0,nC:0,openAt:[],spawned:[],isNew:[]}, anim=null, limeMix=0, limeFade=null, lastJSON='';
var frameInfo={maxY:0.4,maxR:0.5}, cam={y:0.5,dist:6,ty:0.5,td:6}, animEnd=0, reduced=false, dirtyLeaves=true;

function buildModel(p){
  var owner=[], total=0, kg=0;
  for(var i=0;i<p.pickups.length;i++){ kg+=p.pickups[i].kg||0; for(var j=0;j<p.pickups[i].items;j++){ if(owner.length<MAXC) owner.push(p.pickups[i].id); } total+=p.pickups[i].items; }
  var nC=owner.length, gi=0;
  if(nC>0){ var lb=leafB[nC-1]; gi=Math.min(1,lb.birth+spanFor(lb.depth)+0.02); }
  var gk=0.5*(1-Math.exp(-kg/60));
  var ns={}; (p.newIds||[]).forEach(function(id){ns[id]=1;});
  var isNew=owner.map(function(o){return !!ns[o];});
  return {nC:nC,G:Math.max(gi,gk),isNew:isNew,anyNew:isNew.some(function(x){return x;})};
}

function layout(G){
  var th=0.42+0.58*G, maxY=0.3, maxR=0.4;
  for(var i=0;i<B.length;i++){
    var b=B[i], pp=clamp((G-b.birth)/spanFor(b.depth),0,1);
    b.p=pp; b.vis=b.len*easeIO(pp);
    if(b.parent) b.cb.copy(b.parent.cb).addScaledVector(b.parent.dir,b.parent.vis*b.t); else b.cb.set(0,0,0);
    b.ct.copy(b.cb).addScaledVector(b.dir,b.vis);
    var m=meshes[i];
    if(b.vis<0.002){ m.visible=false; continue; }
    m.visible=true; var r=b.rad*th;
    m.position.copy(b.cb); m.scale.set(r,b.vis,r); m.quaternion.setFromUnitVectors(UP,b.dir);
    if(b.ct.y>maxY) maxY=b.ct.y; var hr=Math.sqrt(b.ct.x*b.ct.x+b.ct.z*b.ct.z); if(hr>maxR) maxR=hr;
  }
  frameInfo.maxY=maxY+(view.nC>0?0.45:0); frameInfo.maxR=maxR+(view.nC>0?0.45:0);
  var rad=Math.max(frameInfo.maxY*0.5,frameInfo.maxR)+0.35;
  var aspect=camera.aspect, vf=FOV*Math.PI/180, hf=2*Math.atan(Math.tan(vf/2)*aspect);
  cam.ty=frameInfo.maxY*0.5+0.05; cam.td=rad/Math.tan(Math.min(vf,hf)/2)*0.8;
  seedMesh.visible=(view.nC===0 && G<0.01);
}

function updateColors(){
  var n=MAXC*LP;
  for(var k=0;k<MAXC;k++){ var nw=view.isNew[k];
    for(var i=0;i<LP;i++){
      var base=PALETTE[leafData[k*LP+i].shade];
      if(nw&&limeMix>0){ tmpC.copy(base).lerp(LIME,limeMix); leaves.setColorAt(k*LP+i,tmpC); } else leaves.setColorAt(k*LP+i,base);
    }
  }
  leaves.instanceColor.needsUpdate=true;
}

function updateLeaves(now){
  var n=Math.min(view.nC,MAXC), active=false;
  for(var k=0;k<n;k++){
    var b=leafB[k], reached=b.p>=0.999, oa=view.openAt[k];
    if(oa>=0 && !view.spawned[k] && now>=oa){ view.spawned[k]=true; spawnMotes(b.ct); }
    for(var i=0;i<LP;i++){
      var s=0;
      if(reached){
        if(oa<0) s=1; else { var u=(now-oa-i*25)/750; if(u<1) active=true; s=u<=0?0:easeOutBack(Math.min(u,1)); }
      }
      var L=leafData[k*LP+i];
      dummy.position.set(b.ct.x+L.x*s,b.ct.y+L.y*s,b.ct.z+L.z*s);
      dummy.quaternion.copy(L.q); dummy.scale.setScalar(Math.max(0.0001,L.sc*s));
      dummy.updateMatrix(); leaves.setMatrixAt(k*LP+i,dummy.matrix);
    }
  }
  leaves.count=n*LP; leaves.instanceMatrix.needsUpdate=true;
  return active||(now<animEnd);
}

function apply(p, instant){
  if(skSeed!==p.seed) buildSkeleton(p.seed);
  var m=buildModel(p); var prevAnyNew=!!(model&&model.anyNew);
  model=m; reduced=!!p.reduced;
  view.nC=m.nC; view.G=m.G; view.isNew=m.isNew; view.openAt=[]; view.spawned=[];
  for(var k=0;k<MAXC;k++){ view.openAt.push(-1); view.spawned.push(true); }
  anim=null; animEnd=0;
  if(m.anyNew){ limeMix=1; limeFade=null; }
  else if(prevAnyNew||limeMix>0){ limeFade={t0:performance.now(),dur:3000}; }
  layout(view.G); updateColors(); updateLeaves(performance.now());
  cam.y=cam.ty; cam.dist=cam.td; dirtyLeaves=true;
}

W.__tree={
  show:function(p){ var s=JSON.stringify(p); if(s===lastJSON) return; lastJSON=s; apply(p,true); },
  animateTo:function(p){
    lastJSON=JSON.stringify(p);
    var prevG=view.G, prevN=view.nC;
    if(skSeed!==p.seed) buildSkeleton(p.seed);
    var m=buildModel(p);
    if(p.reduced || (m.nC<=prevN && m.G<=prevG)){ apply(p,true); return; }
    model=m; reduced=false;
    var t0=performance.now(), P1=1800, step=Math.min(140,2200/Math.max(1,m.nC-prevN));
    view.nC=m.nC; view.isNew=m.isNew; view.openAt=[]; view.spawned=[];
    for(var k=0;k<MAXC;k++){
      if(k<prevN||k>=m.nC){ view.openAt.push(-1); view.spawned.push(true); }
      else { view.openAt.push(t0+P1+(k-prevN)*step); view.spawned.push(false); }
    }
    animEnd=t0+P1+(m.nC-prevN)*step+750+LP*25;
    limeMix=m.anyNew?1:0; limeFade=null; updateColors();
    anim={t0:t0,P1:P1,Ga:prevG,Gb:m.G};
  }
};

function resize(){
  var w=W.innerWidth||300,h=W.innerHeight||300; renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
  if(model) layout(view.G);
}
W.addEventListener('resize',resize); resize();

var last=performance.now(), yaw=0;
function tick(t){
  requestAnimationFrame(tick);
  if(document.hidden) return;
  var dt=Math.min(0.05,(t-last)/1000); last=t;
  if(!reduced){ uTime.value=t/1000; yaw+=dt*0.14; }
  var needLeaves=dirtyLeaves; dirtyLeaves=false;
  if(anim){
    var u=(t-anim.t0)/anim.P1, g=u>=1?anim.Gb:anim.Ga+(anim.Gb-anim.Ga)*easeIO(Math.max(0,u));
    view.G=g; layout(g); needLeaves=true; if(u>=1) anim=null;
  }
  if(needLeaves||t<animEnd) updateLeaves(t);
  if(limeFade){
    var f=(t-limeFade.t0)/limeFade.dur; limeMix=Math.max(0,1-f); updateColors(); if(f>=1){ limeFade=null; limeMix=0; }
  }
  // motes
  var any=false;
  for(var i=0;i<NM;i++){ if(moteLife[i]>0){ any=true; moteLife[i]-=dt*0.7; motePos[i*3+1]+=moteVel[i]*dt; if(moteLife[i]<=0) motePos[i*3+1]=-100; } }
  if(any) moteGeo.attributes.position.needsUpdate=true;
  // idle life: slow turn + gentle sway; seed bobs
  treeGroup.rotation.y=yaw; treeGroup.rotation.z=reduced?0:Math.sin(t*0.0007)*0.012;
  if(seedMesh.visible) seedMesh.position.y=0.14+(reduced?0:Math.sin(t*0.003)*0.03);
  // camera eases to keep the whole tree framed
  var ease=1-Math.pow(0.001,dt);
  cam.y+=(cam.ty-cam.y)*ease; cam.dist+=(cam.td-cam.dist)*ease;
  camera.position.set(0,cam.y+cam.dist*0.12,cam.dist); camera.lookAt(0,cam.y,0);
  renderer.render(scene,camera);
}
buildSkeleton(1);
requestAnimationFrame(tick);
post('ready');
})();
</script></body></html>`;
