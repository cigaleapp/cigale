var m=i=>{throw TypeError(i)};var k=(i,e,t)=>e.has(i)||m("Cannot "+t);var c=(i,e,t)=>(k(i,e,"read from private field"),t?t.call(i):e.get(i)),f=(i,e,t)=>e.has(i)?m("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(i):e.set(i,t);import{s as v,ah as A,g as M,b as p}from"./je5hudcr.js";import{m as y,n as O}from"./D4-qWg8E.js";function S(i){return Math.trunc(i*y)}const g=3;var r;class x{constructor(){f(this,r,v(A([])))}get items(){return M(c(this,r))}set items(e){p(c(this,r),e,!0)}add(e,t,n){if(!t)return;const{labels:s,data:o,closed:h,action:b,lifetime:d="inferred",...w}=n??{},u={closed:h,action:b};if(Object.values(u).some(Boolean)&&!o)throw new Error("You must provide data if you're using callbacks");const a=O(),T=t.split(" ").length+t.split(" ").length,l={addedAt:new Date,id:a,message:t.replaceAll(`
`,"; "),type:e,labels:s??{},callbacks:u,data:o??null,lifetime:d==="inferred"?3e3+S(T/300):d,...w};return Number.isFinite(l.lifetime)&&setTimeout(()=>{this.remove(a)},l.lifetime),this.items=[...this.items.slice(0,g-1),l],a}warn(e,t){return this.add("warning",e,t)}error(e,t){return this.add("error",(e==null?void 0:e.toString())??"Erreur inattendue",{...t,lifetime:(t==null?void 0:t.lifetime)??"inferred"})}success(e,t){return this.add("success",e,t)}async remove(e){var n;const t=this.items.find(s=>s.id===e);t&&((n=t.callbacks)!=null&&n.closed&&await t.callbacks.closed(t),this.items=this.items.filter(s=>s.id!==e))}}r=new WeakMap;const _=new x;export{_ as t};
