var m=i=>{throw TypeError(i)};var k=(i,e,t)=>e.has(i)||m("Cannot "+t);var o=(i,e,t)=>(k(i,e,"read from private field"),t?t.call(i):e.get(i)),f=(i,e,t)=>e.has(i)?m("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(i):e.set(i,t);import{s as v,g as A,b as M}from"./DvvCRPia.js";import{p as h}from"./BYruc9P9.js";import{m as y,n as O}from"./z9t0MZu1.js";function S(i){return Math.trunc(i*y)}const g=3;var r;class x{constructor(){f(this,r,v(h([])))}get items(){return A(o(this,r))}set items(e){M(o(this,r),h(e))}add(e,t,n){if(!t)return;const{labels:s,data:c,closed:b,action:w,lifetime:d="inferred",...T}=n??{},u={closed:b,action:w};if(Object.values(u).some(Boolean)&&!c)throw new Error("You must provide data if you're using callbacks");const a=O(),p=t.split(" ").length+t.split(" ").length,l={addedAt:new Date,id:a,message:t.replaceAll(`
`,"; "),type:e,labels:s??{},callbacks:u,data:c??null,lifetime:d==="inferred"?3e3+S(p/300):d,...T};return Number.isFinite(l.lifetime)&&setTimeout(()=>{this.remove(a)},l.lifetime),this.items=[...this.items.slice(0,g-1),l],a}warn(e,t){return this.add("warning",e,t)}error(e,t){return this.add("error",(e==null?void 0:e.toString())??"Erreur inattendue",{...t,lifetime:(t==null?void 0:t.lifetime)??"inferred"})}success(e,t){return this.add("success",e,t)}async remove(e){var n;const t=this.items.find(s=>s.id===e);t&&((n=t.callbacks)!=null&&n.closed&&await t.callbacks.closed(t),this.items=this.items.filter(s=>s.id!==e))}}r=new WeakMap;const j=new x;export{j as t};
