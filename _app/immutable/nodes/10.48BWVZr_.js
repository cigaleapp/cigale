import{t as m,a as h}from"../chunks/64mctwwP.js";import"../chunks/DhZ3rzd1.js";import{a,f as w,a7 as q,c as u,t as C,P as k,g as P,ad as T,r as y}from"../chunks/BJJyANvY.js";import{d as j,s as z,e as A}from"../chunks/BJDLrIW6.js";import{c as B,b as D,a as E}from"../chunks/BCVj7Vec.js";const r=(i,e=q,o)=>{let l=k(()=>T(o==null?void 0:o(),"light"));var t=G();let s;t.__click=[F,e];var d=u(t);y(t),C(n=>{s=B(t,1,"color-square svelte-12aon7g",null,s,n),D(t,`background-color: var(--${e()??""});`),E(t,"title",`Copier var(--${e()??""})`),z(d,`--${e()??""}`)},[()=>({"dark-text":P(l)==="dark"})],k),A("keypress",t,async()=>{await navigator.clipboard.writeText(`var(--${e()})`)}),h(i,t)};var F=async(i,e)=>{await navigator.clipboard.writeText(`var(--${e()})`)},G=m('<div tabindex="0" role="button"> </div>'),H=m('<h1>Color Palette</h1> <div class="palette svelte-12aon7g"><!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!></div>',1);function N(i){var e=H(),o=a(w(e),2),l=u(o);r(l,()=>"bg-primary",()=>"light");var t=a(l,2);r(t,()=>"bg-primary-translucent",()=>"dark");var s=a(t,2);r(s,()=>"fg-primary",()=>"light");var d=a(s,2);r(d,()=>"bg-dark-primary",()=>"light");var n=a(d,2);r(n,()=>"fg-dark-primary",()=>"light");var v=a(n,2);r(v,()=>"bg-warning",()=>"dark");var c=a(v,2);r(c,()=>"fg-warning",()=>"dark");var g=a(c,2);r(g,()=>"bg-error",()=>"dark");var _=a(g,2);r(_,()=>"fg-error",()=>"light");var p=a(_,2);r(p,()=>"bg-success",()=>"dark");var f=a(p,2);r(f,()=>"fg-success",()=>"light");var b=a(f,2);r(b,()=>"bg-neutral",()=>"dark");var x=a(b,2);r(x,()=>"fg-neutral",()=>"light"),y(o),h(i,e)}j(["click"]);export{N as component};
