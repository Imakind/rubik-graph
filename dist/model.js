(function(root){
const faces=[{id:'U',name:'Верх',color:'#f0f1e9',n:[0,1,0],u:[1,0,0],v:[0,0,1]}, {id:'R',name:'Правая',color:'#fa645b',n:[1,0,0],u:[0,0,-1],v:[0,-1,0]}, {id:'F',name:'Передняя',color:'#76d9a0',n:[0,0,1],u:[1,0,0],v:[0,-1,0]}, {id:'D',name:'Низ',color:'#f5cf5e',n:[0,-1,0],u:[1,0,0],v:[0,0,-1]}, {id:'L',name:'Левая',color:'#ffa557',n:[-1,0,0],u:[0,0,1],v:[0,-1,0]}, {id:'B',name:'Задняя',color:'#679eff',n:[0,0,-1],u:[-1,0,0],v:[0,-1,0]}];
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),add=(a,b)=>a.map((x,i)=>x+b[i]),scale=(a,s)=>a.map(x=>x*s);
function rotate(p,axis,angle){let c=Math.cos(angle),s=Math.sin(angle),d=dot(axis,p);return p.map((x,i)=>x*c+(axis[(i+1)%3]*p[(i+2)%3]-axis[(i+2)%3]*p[(i+1)%3])*s+axis[i]*d*(1-c));}
const slots=faces.flatMap((f,fi)=>Array.from({length:9},(_,j)=>({id:f.id+(j+1),fi,j,p:add(f.n,add(scale(f.u,j%3-1),scale(f.v,Math.floor(j/3)-1))),n:f.n,q:add(scale(f.n,1.5),add(scale(f.u,j%3-1),scale(f.v,Math.floor(j/3)-1)))})));
const edges=[];for(let a=0;a<54;a++)for(let b=a+1;b<54;b++){const x=slots[a],y=slots[b],d=x.q.reduce((s,v,i)=>s+(v-y.q[i])**2,0);if((x.fi===y.fi&&Math.abs(d-1)<.001)||(x.fi!==y.fi&&Math.abs(d-.5)<.001))edges.push([a,b]);}
function moveRule(move){
 if(typeof move!=='string'||!/^[URFDLBMES]'?$/.test(move))throw Error('Недопустимый ход');
 const f=faces.find(f=>f.id===move[0]),slice={M:{n:[1,0,0],sign:1},E:{n:[0,1,0],sign:1},S:{n:[0,0,1],sign:-1}}[move[0]];
 return {n:f?f.n:slice.n,layer:f?1:0,angle:(f?-1:slice.sign)*(move.endsWith("'")?-1:1)*Math.PI/2};
}
class CubeModel{constructor(){this.reset()}reset(){this.colors=slots.map(s=>s.fi);this.history=[]}turn(move,record=true){let f=moveRule(move),angle=f.angle,out=[...this.colors];slots.forEach((s,i)=>{if(dot(s.p,f.n)!==f.layer)return;const p=rotate(s.p,f.n,angle).map(Math.round),n=rotate(s.n,f.n,angle).map(Math.round),j=slots.findIndex(t=>t.p.every((v,k)=>v===p[k])&&t.n.every((v,k)=>v===n[k]));if(j<0)throw Error('Invalid permutation');out[j]=this.colors[i]});this.colors=out;if(record)this.history.push(move)}get solved(){return this.colors.every((c,i)=>c===this.colors[slots[i].fi*9+4])}}
root.Rubik={faces,slots,edges,CubeModel,rotate,dot,add,scale,moveRule};if(typeof module!=='undefined')module.exports=root.Rubik;
})(typeof window==='undefined'?globalThis:window);
