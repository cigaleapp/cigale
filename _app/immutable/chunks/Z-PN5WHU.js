import{c as b,a as l,t as H}from"./CCZ_fMQU.js";import{af as U,ag as j,f as _,g as s,H as q,c as x,a as A,r as w,t as E,b as y,s as B,ah as F}from"./Bp-bnYO3.js";import{p as C,i as k}from"./D_KrK0IG.js";import{e as G,i as J}from"./CVyNc7-z.js";import{s as K}from"./R-I5KeFT.js";import{b as z}from"./DvX0M1aY.js";import{a as N}from"./DGSW8rYE.js";import Q from"./DNxwZLhm.js";import T from"./DOohY6Dm.js";import V from"./D1S2BzFw.js";import{u as X}from"./De97u9pv.js";var Y=H('<div class="content svelte-12yxguw"><!> <img alt="imagetocrop" style="width: 100%; height: 100%;"></div>'),Z=H('<div class="errored svelte-12yxguw"><!> <h1 class="svelte-12yxguw">Ooops!!</h1> <p>Image introuvable.</p></div>');function de(L,o){U(o,!0);let d=C(o,"opener",15,void 0),t=C(o,"boundingBoxes",19,()=>[]);const f=q(()=>X.previewURLs.get(o.id));let n=[];for(let e=0;e<t().length;e++)n.push({x:t()[e].x,y:t()[e].y,width:t()[e].width,height:t()[e].height});let u=B(0),p=B(0);V(L,{get key(){return o.key},title:"Crop",onconfirm:()=>o.onconfirm(N(n[0])),confirm:"Crop",cancel:"Cancel",get open(){return d()},set open(e){d(e)},children:(e,$)=>{var v=b(),P=_(v);{var W=i=>{var r=Y(),m=x(r);{var I=a=>{var c=b(),M=_(c);G(M,17,t,J,(O,R,h)=>{Q(O,{get bb(){return s(R)},get sizew(){return s(p)},get sizeh(){return s(u)},get bbout(){return n[h]},set bbout(S){n[h]=S}})}),l(a,c)};k(m,a=>{t()&&a(I)})}var g=A(m,2);w(r),E(()=>K(g,"src",s(f))),z(g,"clientHeight",a=>y(u,a)),z(g,"clientWidth",a=>y(p,a)),l(i,r)},D=i=>{var r=Z(),m=x(r);T(m,{variant:"error"}),F(4),w(r),l(i,r)};k(P,i=>{s(f)?i(W):i(D,!1)})}l(e,v)},$$slots:{default:!0}}),j()}export{de as default};
