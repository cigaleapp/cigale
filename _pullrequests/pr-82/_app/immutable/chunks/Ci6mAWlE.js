import{t as F,a as D}from"./Yi9iuJrU.js";import{ag as W,c as _,a as j,g as t,M as I,r as b,t as V,ah as q,b as h,s as z}from"./QTVBrZQz.js";import{d as B,s as G}from"./BijaW5W9.js";import{e as H}from"./DmiUy1W9.js";import{r as J,s as L,b as N}from"./DPbpzs5i.js";import{b as Q}from"./C1xk_wGi.js";import{p as A,r as O}from"./B-Yw5O5m.js";import{F as P}from"./Ch1WBRTM.js";var T=(v,l,s,i,f)=>{l(s()),i(f()),v.currentTarget.blur()},X=F('<li><button tabindex="-1"> </button></li>'),Y=F('<div class="listeRecherche svelte-153ulpk" role="listbox"><input> <ul class="container svelte-153ulpk"></ul></div>');function oe(v,l){W(l,!0);let s=A(l,"searchQuery",15,""),i=A(l,"selectedValue",15),f=O(l,["$$slots","$$events","$$legacy","options","onblur","placeholder","searchQuery","selectedValue"]);const S=I(()=>new P(l.options,{keys:["key","label"]})),n=I(()=>s()?t(S).search(s()).map(e=>e.item):l.options);let a=z(-1),o,m;function C(e){var c;const r=t(n).length;e.key==="ArrowDown"?(e.preventDefault(),h(a,(t(a)+1)%r)):e.key==="ArrowUp"?(e.preventDefault(),h(a,(t(a)-1+r)%r)):e.key==="Enter"&&r>0&&(e.preventDefault(),s(t(n)[t(a)].label),i(t(n)[t(a)].key),o.blur(),m.blur()),(c=o==null?void 0:o.children[t(a)])==null||c.scrollIntoView({block:"nearest"})}var p=Y(),u=_(p);J(u);var E=({currentTarget:e})=>{console.log("input",e.value),s(e.value),h(a,0)},K=()=>{var e;(e=l.onblur)==null||e.call(l,i()),h(a,0)};let g;Q(u,e=>m=e,()=>m);var k=j(u,2);H(k,23,()=>t(n),({key:e,label:r})=>e,(e,r,c)=>{let M=()=>t(r).key,w=()=>t(r).label;var y=X(),d=_(y);let x;d.__click=[T,i,M,s,w];var R=_(d,!0);b(d),b(y),V(U=>{x=N(d,1,"button svelte-153ulpk",null,x,U),G(R,w())},[()=>({highlighted:t(c)===t(a)})]),D(e,y)}),b(k),Q(k,e=>o=e,()=>o),b(p),V(()=>g=L(u,g,{...f,class:"search-bar",type:"text",placeholder:l.placeholder,value:s(),onkeydown:C,oninput:E,onblur:K},"svelte-153ulpk")),D(v,p),q()}B(["click"]);export{oe as default};
