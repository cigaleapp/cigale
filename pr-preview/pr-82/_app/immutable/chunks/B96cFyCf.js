import{c as b,a as l,t as H}from"./Yi9iuJrU.js";import{ag as U,ah as j,f as _,g as s,M as q,c as x,a as A,r as w,t as E,b as y,s as B,ai as F}from"./QTVBrZQz.js";import{i as C}from"./DC0ZX6qe.js";import{e as G,i as J}from"./DmiUy1W9.js";import{a as K}from"./DPbpzs5i.js";import{b as k}from"./BL_0X1-P.js";import{p as z}from"./B-Yw5O5m.js";import{c as N}from"./ZqeMffpX.js";import Q from"./B8kO3CWc.js";import T from"./BIWbyXLX.js";import V from"./CY8JZRhg.js";import{u as X}from"./BXkCq4b2.js";var Y=H('<div class="content svelte-12yxguw"><!> <img alt="imagetocrop" style="width: 100%; height: 100%;"></div>'),Z=H('<div class="errored svelte-12yxguw"><!> <h1 class="svelte-12yxguw">Ooops!!</h1> <p>Image introuvable.</p></div>');function fe(L,a){U(a,!0);let d=z(a,"opener",15,void 0),t=z(a,"boundingBoxes",19,()=>[]);const f=q(()=>X.previewURLs.get(a.id));let n=[];for(let e=0;e<t().length;e++)n.push({x:t()[e].x,y:t()[e].y,width:t()[e].width,height:t()[e].height});let p=B(0),u=B(0);V(L,{get key(){return a.key},title:"Crop",onconfirm:()=>a.onconfirm(N(n[0])),confirm:"Crop",cancel:"Cancel",get open(){return d()},set open(e){d(e)},children:(e,$)=>{var v=b(),M=_(v);{var P=i=>{var r=Y(),m=x(r);{var D=o=>{var c=b(),I=_(c);G(I,17,t,J,(O,R,h)=>{Q(O,{get bb(){return s(R)},get sizew(){return s(u)},get sizeh(){return s(p)},get bbout(){return n[h]},set bbout(S){n[h]=S}})}),l(o,c)};C(m,o=>{t()&&o(D)})}var g=A(m,2);w(r),E(()=>K(g,"src",s(f))),k(g,"clientHeight",o=>y(p,o)),k(g,"clientWidth",o=>y(u,o)),l(i,r)},W=i=>{var r=Z(),m=x(r);T(m,{variant:"error"}),F(4),w(r),l(i,r)};C(M,i=>{s(f)?i(P):i(W,!1)})}l(e,v)},$$slots:{default:!0}}),j()}export{fe as default};
