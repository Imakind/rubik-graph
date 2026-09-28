const {faces,slots,CubeModel,rotate,dot,add,scale,moveRule}=Rubik;
const model=new CubeModel(),$=id=>document.getElementById(id),svg=$('graph'),canvas=$('cube'),ctx=canvas.getContext('2d');
let selected=-1,busy=false,animation=null,yaw=-.57,pitch=.46,hitPolys=[],drag=null;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const {rings,positions,edges,motion,point}=RingGeometry;
const graphScale=73,screen=p=>[330+p[0]*graphScale,246-p[1]*graphScale];
let activeMotion=null,demo=false,demoTimer=null;
function el(tag,attrs,parent=svg){const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);parent.appendChild(n);return n}
const ringEls=rings.map(r=>{const c=screen(r.center),n=el('circle',{cx:c[0],cy:c[1],r:r.r*graphScale,fill:'none',stroke:'#65778d','stroke-width':1.4,opacity:.62,class:'layer-ring'});return n});
const nodes=slots.map((s,i)=>{const p=screen(positions[i]),g=el('g',{class:'node',role:'button',tabindex:0,'aria-label':s.id});el('circle',{cx:p[0],cy:p[1],r:6.2,fill:faces[s.fi].color,stroke:'#141b25','stroke-width':1.4},g);g.addEventListener('click',()=>select(i));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(i)}});return g});
function graphFrame(t=0){nodes.forEach((g,i)=>{const p=screen(point(activeMotion,i,t));g.firstChild.setAttribute('cx',p[0]);g.firstChild.setAttribute('cy',p[1])});ringEls.forEach((n,i)=>{const active=activeMotion?.ring===rings[i],related=selected>=0&&rings[i].track.ids.includes(selected);n.setAttribute('stroke',active?'#c4f49e':related?'#e5f0fe':'#65778d');n.setAttribute('stroke-width',active?2.8:related?2:1.4);n.setAttribute('opacity',active||related?1:0.62);n.style.display=$('edges').checked?'':'none'})}
function select(i){if(busy)return;selected=selected===i?-1:i;update();draw()}
function update(){nodes.forEach((g,i)=>{g.firstChild.setAttribute('fill',faces[model.colors[i]].color);g.firstChild.setAttribute('stroke',i===selected?'#ffffff':'#141b25');g.firstChild.setAttribute('stroke-width',i===selected?3:1.4);g.setAttribute('aria-label',`${slots[i].id}: цвет грани ${faces[model.colors[i]].id}`);g.setAttribute('aria-pressed',String(i===selected));g.style.pointerEvents=busy?'none':''});graphFrame();$('status').textContent=model.solved?'Кубик собран':'Кубик перемешан';$('status').style.color=model.solved?'':'#bac8d9';$('moves').textContent=`Ходов: ${model.history.length}`;$('history').replaceChildren();if(!model.history.length)$('history').textContent='Пока без поворотов';model.history.slice(-60).forEach(m=>{let b=document.createElement('b');b.textContent=m;$('history').append(b)});$('history').scrollTop=9999;$('undo').disabled=busy||!model.history.length;document.querySelectorAll('.turns button,#shuffle,#reset').forEach(b=>b.disabled=busy);if(selected>=0){const s=slots[selected],f=faces[model.colors[selected]],layers=rings.filter(r=>r.track.ids.includes(selected)).map(r=>`${'XYZ'[r.axis]} = ${r.layer}`);$('selection').textContent=`${s.id} · ${faces[s.fi].name} · цвет ${f.id}`;$('neighbor-note').textContent=`Пересечение слоёв ${layers.join(' и ')}. При ходе точка движется по окружности своего слоя.`}else{$('selection').textContent='Выберите цветной узел на графе';$('neighbor-note').textContent='54 наклейки расположены на пересечениях 9 окружностей. Каждая точка принадлежит двум окружностям.'}}
function camera(p){return rotate(rotate(p,[0,1,0],yaw),[1,0,0],pitch)}
function draw(){const box=canvas.getBoundingClientRect(),w=box.width,h=box.height,dpr=devicePixelRatio||1;if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr)}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);const size=Math.min(w*.16,h*.165),project=p=>{let c=camera(p),k=7/(7-c[2]);return [w/2+c[0]*size*k,h*.46-c[1]*size*k,c[2]]};let polygons=[];slots.forEach((s,i)=>{const f=faces[s.fi],turn=animation&&dot(s.p,animation.axis)===animation.layer,tx=p=>turn?rotate(p,animation.axis,animation.angle):p,n=tx(s.n);if(camera(n)[2]<.025)return;const corners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v])=>project(tx(add(s.q,add(scale(f.u,u*.463),scale(f.v,v*.463))))));polygons.push({i,corners,z:corners.reduce((a,p)=>a+p[2],0)/4})});polygons.sort((a,b)=>a.z-b.z);hitPolys=polygons;polygons.forEach(({i,corners})=>{ctx.beginPath();corners.forEach((p,j)=>j?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=faces[model.colors[i]].color;ctx.fill();ctx.strokeStyle=i===selected?'#ffffff':'#090d14';ctx.lineWidth=i===selected?4:2;ctx.lineJoin='round';ctx.stroke();if(i===selected){let x=corners.reduce((a,p)=>a+p[0],0)/4,y=corners.reduce((a,p)=>a+p[1],0)/4;ctx.fillStyle='#142132';ctx.font='bold 14px monospace';ctx.textAlign='center';ctx.fillText(slots[i].id,x,y+5)}})}
async function move(m,record=true){const rule=moveRule(m);activeMotion=motion(m);$('current-turn').textContent=m;if(!reduced)await new Promise(resolve=>{let start=performance.now();function frame(now){let t=Math.min(1,(now-start)/680),ease=t*t*(3-2*t);animation={axis:rule.n,layer:rule.layer,angle:rule.angle*ease};graphFrame(ease);draw();if(t<1)requestAnimationFrame(frame);else resolve()}requestAnimationFrame(frame)});if(selected>=0)selected=activeMotion.mapping[selected];animation=null;activeMotion=null;model.turn(m,record);update();draw()}
async function run(moves){if(busy)return false;if(!Array.isArray(moves)||moves.length>100||moves.some(m=>typeof m!=='string'||!/^[URFDLBMES]'?$/.test(m)))throw Error('Допустимо от 0 до 100 ходов U, R, F, D, L, B, M, E, S с необязательным штрихом.');busy=true;update();try{for(const m of moves)await move(m)}finally{busy=false;update()}return true}
for(const f of faces){let group=document.createElement('div');group.className='turn-pair';for(const inverse of [false,true]){let m=f.id+(inverse?"'":''),b=document.createElement('button');b.textContent=m;b.title=`${f.name}: ${inverse?'против':'по'} часовой стрелке`;b.setAttribute('aria-label',b.title);b.onclick=()=>run([m]);group.append(b)}$('turns').append(group);let span=document.createElement('span'),swatch=document.createElement('i');swatch.style.background=f.color;span.append(swatch,`${f.id} ${f.name}`);$('legend').append(span)}
$('edges').onchange=()=>graphFrame();$('view').onclick=()=>{yaw=-.57;pitch=.46;draw()};$('reset').onclick=()=>{if(busy)return;stopDemo();model.reset();selected=-1;$('current-turn').textContent='—';update();draw()};$('undo').onclick=async()=>{if(busy||!model.history.length)return;busy=true;const m=model.history.pop();update();try{await move(m.endsWith("'")?m[0]:m+"'",false)}finally{busy=false;update()}};$('shuffle').onclick=()=>{let seq=[],prev='';for(let i=0;i<20;i++){let ids='URFDLB'.split('').filter(x=>x!==prev),id=ids[Math.floor(Math.random()*ids.length)];prev=id;seq.push(id+(Math.random()<.5?"'":''))}run(seq)};
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.target.matches('input,textarea,select,button')||e.repeat)return;let c=e.key.toUpperCase();if('URFDLBMES'.includes(c)&&c.length===1){e.preventDefault();run([c+(e.shiftKey?"'":'')])}});
// Hit testing uses the painted polygons, so gestures follow the current camera.
function hitSticker(x,y){for(const poly of [...hitPolys].reverse()){let inside=false,p=poly.corners;for(let i=0,j=p.length-1;i<p.length;j=i++){if((p[i][1]>y)!==(p[j][1]>y)&&x<(p[j][0]-p[i][0])*(y-p[i][1])/(p[j][1]-p[i][1])+p[i][0])inside=!inside}if(inside)return poly.i}return -1}
function gestureProjection(p){const c=camera(p),k=7/(7-c[2]);return [c[0]*k,-c[1]*k]}
function swipeMove(sticker,dx,dy){
 const s=slots[sticker],origin=gestureProjection(s.q),length=Math.hypot(dx,dy);let best=null;
 // A row/column swipe rotates about one of the two axes tangent to the touched face.
 for(let axis=0;axis<3;axis++){if(s.n[axis]!==0)continue;const n=[0,0,0];n[axis]=1;
  const tangent=n.map((v,k)=>n[(k+1)%3]*s.n[(k+2)%3]-n[(k+2)%3]*s.n[(k+1)%3]),projected=gestureProjection(add(s.q,scale(tangent,.02))),vx=projected[0]-origin[0],vy=projected[1]-origin[1],vlen=Math.hypot(vx,vy);if(vlen<1e-6)continue;
  const alignment=(vx*dx+vy*dy)/(vlen*length),score=Math.abs(alignment),layer=s.p[axis];
  let id=layer===0?'MES'[axis]:faces.find(f=>f.n[axis]===layer).id,rule=moveRule(id),positive=rule.angle*rule.n[axis]>0;
  if((alignment>0)!==positive)id+="'";
  if(!best||score>best.score)best={move:id,score};
 }
 return best?.score>=.5?best.move:null;
}
canvas.addEventListener('pointerdown',e=>{
 if(!e.isPrimary||e.button!==0||drag)return;stopDemo();if(busy)return;
 e.preventDefault();const b=canvas.getBoundingClientRect(),sticker=hitSticker(e.clientX-b.left,e.clientY-b.top);
 canvas.setPointerCapture(e.pointerId);drag={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,sticker,orbit:sticker<0||e.shiftKey,moved:false,consumed:false};
});
canvas.addEventListener('pointermove',e=>{
 if(!drag||e.pointerId!==drag.id)return;e.preventDefault();if(drag.consumed)return;
 const dx=e.clientX-drag.x,dy=e.clientY-drag.y,totalX=e.clientX-drag.startX,totalY=e.clientY-drag.startY,distance=Math.hypot(totalX,totalY);
 if(distance>6)drag.moved=true;
 if(drag.orbit){yaw+=dx*.009;pitch=Math.max(-1.5,Math.min(1.5,pitch+dy*.009));draw()}
 else if(distance>=22){const m=swipeMove(drag.sticker,totalX,totalY);if(m){drag.consumed=true;run([m])}}
 drag.x=e.clientX;drag.y=e.clientY;
});
canvas.addEventListener('pointerup',e=>{
 if(!drag||e.pointerId!==drag.id)return;const gesture=drag;drag=null;
 if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
 if(!gesture.moved&&!gesture.consumed&&gesture.sticker>=0)select(gesture.sticker);
});
for(const event of ['pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{if(drag?.id===e.pointerId)drag=null});
new ResizeObserver(draw).observe(canvas);update();draw();
if(document.modelContext?.registerTool){const tool={name:'turn_rubik_cube',title:'Повернуть кубик Рубика',description:'Выполняет последовательность ходов и обновляет кубик и цветной граф.',inputSchema:{type:'object',properties:{moves:{type:'array',items:{type:'string',pattern:"^[URFDLBMES]'?$"},maxItems:100}},required:['moves'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},async execute(input){if(!input||Object.keys(input).some(k=>k!=='moves'))throw Error('Ожидается объект moves');if(busy)throw Error('Дождитесь завершения текущих ходов');await run(input.moves);return {solved:model.solved,moves:model.history.length,colors:model.colors.map(c=>faces[c].id)}}};try{Promise.resolve(document.modelContext.registerTool(tool)).catch(console.warn)}catch(e){console.warn(e)}}

function stopDemo(){demo=false;clearTimeout(demoTimer);$('demo').textContent='▶ Демо';$('demo').setAttribute('aria-pressed','false')}
async function demoStep(){if(!demo)return;if(!busy){const id='URFDLB'[Math.floor(Math.random()*6)];await run([id+(Math.random()<.5?"'":'')])}if(demo)demoTimer=setTimeout(demoStep,400)}
$('demo').onclick=()=>{if(demo){stopDemo();return}demo=true;$('demo').textContent='Ⅱ Пауза';$('demo').setAttribute('aria-pressed','true');demoStep()};
