var k=Object.defineProperty;var w=t=>{throw TypeError(t)};var _=(t,r,s)=>r in t?k(t,r,{enumerable:!0,configurable:!0,writable:!0,value:s}):t[r]=s;var g=(t,r,s)=>_(t,typeof r!="symbol"?r+"":r,s),u=(t,r,s)=>r.has(t)||w("Cannot "+s);var i=(t,r,s)=>(u(t,r,"read from private field"),s?s.call(t):r.get(t)),b=(t,r,s)=>r.has(t)?w("Cannot add the same private member more than once"):r instanceof WeakSet?r.add(t):r.set(t,s),c=(t,r,s,e)=>(u(t,r,"write to private field"),e?e.call(t,s):r.set(t,s),s),p=(t,r,s)=>(u(t,r,"access private method"),s);import{A as z,C as M}from"./B4FbSzIj.js";var o,a,v,h,x;const f=class f{constructor(r){b(this,h);b(this,o,new WeakMap);b(this,a);b(this,v);c(this,v,r)}observe(r,s){var e=i(this,o).get(r)||new Set;return e.add(s),i(this,o).set(r,e),p(this,h,x).call(this).observe(r,i(this,v)),()=>{var n=i(this,o).get(r);n.delete(s),n.size===0&&(i(this,o).delete(r),i(this,a).unobserve(r))}}};o=new WeakMap,a=new WeakMap,v=new WeakMap,h=new WeakSet,x=function(){return i(this,a)??c(this,a,new ResizeObserver(r=>{for(var s of r){f.entries.set(s.target,s);for(var e of i(this,o).get(s.target)||[])e(s)}}))},g(f,"entries",new WeakMap);let d=f;var W=new d({box:"border-box"});function j(t,r,s){var e=W.observe(t,()=>s(t[r]));z(()=>(M(()=>s(t[r])),e))}export{j as b};
