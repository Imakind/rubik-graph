/* Nine layer circles. Each sticker is an intersection of its two tangential layers. */
(function(root){
const {slots,faces,rotate,dot,moveRule}=Rubik,TAU=2*Math.PI;
const centers=[-30,90,210].map(deg=>[Math.cos(deg*Math.PI/180),Math.sin(deg*Math.PI/180)]);
const radius=layer=>1.64-.32*layer;
const rings=centers.flatMap((center,axis)=>[-1,0,1].map(layer=>({axis,layer,center,r:radius(layer)})));
const positions=slots.map(s=>{
 const normal=s.n.findIndex(v=>v!==0),[a,b]=[0,1,2].filter(axis=>axis!==normal),A=centers[a],B=centers[b];
 const delta=B.map((v,k)=>v-A[k]),distance=Math.hypot(...delta),unit=delta.map(v=>v/distance),ra=radius(s.p[a]),rb=radius(s.p[b]);
 const along=(ra*ra-rb*rb+distance*distance)/(2*distance),height=Math.sqrt(ra*ra-along*along);
 const midpoint=A.map((v,k)=>v+unit[k]*along),offset=[-unit[1]*height,unit[0]*height];
 const candidates=[midpoint.map((v,k)=>v+offset[k]),midpoint.map((v,k)=>v-offset[k])];
 candidates.sort((p,q)=>Math.hypot(...p.map((v,k)=>v-centers[normal][k]))-Math.hypot(...q.map((v,k)=>v-centers[normal][k])));
 return candidates[s.n[normal]>0?0:1];
});
function track(center,ids){return {center,ids:ids.sort((a,b)=>Math.atan2(positions[a][1]-center[1],positions[a][0]-center[0])-Math.atan2(positions[b][1]-center[1],positions[b][0]-center[0]))}}
rings.forEach(r=>r.track=track(r.center,slots.map((s,i)=>i).filter(i=>slots[i].p[r.axis]===r.layer&&slots[i].n[r.axis]===0)));
const graphEdges=[];rings.forEach(r=>r.track.ids.forEach((a,k,ids)=>graphEdges.push([a,ids[(k+1)%ids.length]])));
function permutation(move){const rule=moveRule(move),normal=rule.n,angle=rule.angle;return slots.map((s,i)=>{if(dot(s.p,normal)!==rule.layer)return i;const p=rotate(s.p,normal,angle).map(Math.round),n=rotate(s.n,normal,angle).map(Math.round);return slots.findIndex(t=>t.p.every((v,k)=>v===p[k])&&t.n.every((v,k)=>v===n[k]))})}
function motion(move){const rule=moveRule(move),normal=rule.n,axis=normal.findIndex(v=>v!==0),layer=normal[axis]*rule.layer,ring=rings.find(r=>r.axis===axis&&r.layer===layer),mapping=permutation(move);
 const face=slots.map((s,i)=>i).filter(i=>slots[i].n[axis]===layer),middle=face.find(i=>slots[i].p.every((v,k)=>k===axis||v===0));
 const tracks=[ring.track],routes=new Map();if(layer!==0)tracks.push(track(positions[middle],face.filter(i=>i!==middle)));
 tracks.forEach(tr=>tr.ids.forEach((id,k)=>{let steps=(tr.ids.indexOf(mapping[id])-k+tr.ids.length)%tr.ids.length;if(steps>tr.ids.length/2)steps-=tr.ids.length;routes.set(id,{tr,k,steps})}));
 return {ring,mapping,routes};
}
function point(m,id,t){const route=m?.routes.get(id);if(!route)return positions[id];const {tr,k,steps}=route,n=tr.ids.length,u=k+steps*t,floor=Math.floor(u),alpha=u-floor,idx=((floor%n)+n)%n;
 const p=positions[tr.ids[idx]],q=positions[tr.ids[(idx+1)%n]],c=tr.center;
 const a=Math.atan2(p[1]-c[1],p[0]-c[0]);let b=Math.atan2(q[1]-c[1],q[0]-c[0]);while(b<a)b+=TAU;
 const angle=a+(b-a)*alpha,r=Math.hypot(p[0]-c[0],p[1]-c[1])*(1-alpha)+Math.hypot(q[0]-c[0],q[1]-c[1])*alpha;
 return [c[0]+r*Math.cos(angle),c[1]+r*Math.sin(angle)];
}
root.RingGeometry={rings,positions,edges:graphEdges,permutation,motion,point};
if(typeof module!=='undefined')module.exports=root.RingGeometry;
})(typeof window==='undefined'?globalThis:window);
