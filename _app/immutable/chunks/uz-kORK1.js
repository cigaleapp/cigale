import{c as _,a as l,t as H}from"./C2IogcR0.js";import{a9 as q,a8 as g,s as x,aa as A,f as w,g as a,c as y,a as E,r as C,t as G,b as B,ab as J}from"./BsWIUf9a.js";import{i as P}from"./m4WIalkB.js";import{e as K,i as N}from"./DwKQaEPv.js";import{a as Q}from"./BKfSxfdr.js";import{b as k}from"./BsXC0hzp.js";import{p as z}from"./COZIH9cg.js";import{a as V}from"./DtLM_Vom.js";import X from"./CcuqVOvR.js";import{u as I,f as Y}from"./DfTm-m0I.js";import Z from"./tiskVc8I.js";import $ from"./CNzpB-MU.js";var ee=H('<div class="content svelte-12yxguw"><!> <img alt="imagetocrop" style="width: 100%; height: 100%;"></div>'),te=H('<div class="errored svelte-12yxguw"><!> <h1 class="svelte-12yxguw">Ooops!!</h1> <p>Image introuvable.</p></div>');function pe(L,i){q(i,!0);const W=g(()=>V(I.currentProtocol));let f=z(i,"opener",15,void 0),t=z(i,"boundingBoxes",19,()=>[]);const u=g(()=>I.previewURLs.get(Y(i.id)));let n=[];for(let e=0;e<t().length;e++)n.push({x:t()[e].x,y:t()[e].y,width:t()[e].width,height:t()[e].height});let c=x(0),p=x(0);$(L,{get key(){return i.key},title:"Crop",onconfirm:()=>i.onconfirm(n[0]),confirm:"Crop",cancel:"Cancel",get open(){return f()},set open(e){f(e)},children:(e,re)=>{var v=_(),D=w(v);{var F=s=>{var r=ee(),m=y(r);{var O=o=>{var h=_(),R=w(h);K(R,17,t,N,(S,T,b)=>{const U=g(()=>a(W)(a(T)));X(S,{get bb(){return a(U)},get sizew(){return a(p)},get sizeh(){return a(c)},get bbout(){return n[b]},set bbout(j){n[b]=j}})}),l(o,h)};P(m,o=>{t()&&o(O)})}var d=E(m,2);C(r),G(()=>Q(d,"src",a(u))),k(d,"clientHeight",o=>B(c,o)),k(d,"clientWidth",o=>B(p,o)),l(s,r)},M=s=>{var r=te(),m=y(r);Z(m,{variant:"error"}),J(4),C(r),l(s,r)};P(D,s=>{a(u)?s(F):s(M,!1)})}l(e,v)},$$slots:{default:!0}}),A()}export{pe as default};
