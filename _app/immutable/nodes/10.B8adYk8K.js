import{t as m,a as h}from"../chunks/DVHRhNjq.js";import"../chunks/Be2uL4Qi.js";import{a,f as w,ac as q,c as u,t as C,W as k,g as T,ai as P,r as y}from"../chunks/je5hudcr.js";import{d as W,s as j,e as z}from"../chunks/rhXEw3QH.js";import{c as A,b as B,a as D}from"../chunks/CSTXPE61.js";const r=(i,e=q,o)=>{let l=k(()=>P(o==null?void 0:o(),"light"));var t=F();let s;t.__click=[E,e];var d=u(t);y(t),C(n=>{s=A(t,1,"color-square svelte-12aon7g",null,s,n),B(t,`background-color: var(--${e()??""});`),D(t,"title",`Copier var(--${e()??""})`),j(d,`--${e()??""}`)},[()=>({"dark-text":T(l)==="dark"})],k),z("keypress",t,async()=>{await navigator.clipboard.writeText(`var(--${e()})`)}),h(i,t)};var E=async(i,e)=>{await navigator.clipboard.writeText(`var(--${e()})`)},F=m('<div tabindex="0" role="button"> </div>'),G=m('<h1>Color Palette</h1> <div class="palette svelte-12aon7g"><!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!> <!></div>',1);function M(i){var e=G(),o=a(w(e),2),l=u(o);r(l,()=>"bg-primary",()=>"light");var t=a(l,2);r(t,()=>"bg-primary-translucent",()=>"dark");var s=a(t,2);r(s,()=>"fg-primary",()=>"light");var d=a(s,2);r(d,()=>"bg-dark-primary",()=>"light");var n=a(d,2);r(n,()=>"fg-dark-primary",()=>"light");var v=a(n,2);r(v,()=>"bg-warning",()=>"dark");var c=a(v,2);r(c,()=>"fg-warning",()=>"dark");var g=a(c,2);r(g,()=>"bg-error",()=>"dark");var _=a(g,2);r(_,()=>"fg-error",()=>"light");var p=a(_,2);r(p,()=>"bg-success",()=>"dark");var f=a(p,2);r(f,()=>"fg-success",()=>"light");var b=a(f,2);r(b,()=>"bg-neutral",()=>"dark");var x=a(b,2);r(x,()=>"fg-neutral",()=>"light"),y(o),h(i,e)}W(["click"]);export{M as component};
