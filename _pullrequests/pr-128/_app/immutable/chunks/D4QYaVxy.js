import{c as b,a as l,t as H}from"./Bh4UdHfS.js";import{ag as U,ah as j,f as _,g as s,M as x,c as w,a as q,r as y,t as A,b as B,s as C,ai as E}from"./DvvCRPia.js";import{i as k}from"./C7K4hmOx.js";import{e as G,i as J}from"./DWXKDKNe.js";import{a as K}from"./BuyP6kwd.js";import{b as z}from"./CLC5vanr.js";import{p as I}from"./DIX51SrO.js";import{a as N}from"./BLp-lg6r.js";import Q from"./HR3QI-Ll.js";import{u as V,f as X}from"./5XuBhNBq.js";import Y from"./QwjA-2O9.js";import Z from"./D4uFRzW1.js";var $=H('<div class="content svelte-12yxguw"><!> <img alt="imagetocrop" style="width: 100%; height: 100%;"></div>'),ee=H('<div class="errored svelte-12yxguw"><!> <h1 class="svelte-12yxguw">Ooops!!</h1> <p>Image introuvable.</p></div>');function ue(L,a){U(a,!0);let d=I(a,"opener",15,void 0),t=I(a,"boundingBoxes",19,()=>[]);const f=x(()=>V.previewURLs.get(X(a.id)));let n=[];for(let e=0;e<t().length;e++)n.push({x:t()[e].x,y:t()[e].y,width:t()[e].width,height:t()[e].height});let p=C(0),u=C(0);Z(L,{get key(){return a.key},title:"Crop",onconfirm:()=>a.onconfirm(n[0]),confirm:"Crop",cancel:"Cancel",get open(){return d()},set open(e){d(e)},children:(e,te)=>{var v=b(),M=_(v);{var P=i=>{var r=$(),m=w(r);{var D=o=>{var c=b(),F=_(c);G(F,17,t,J,(O,R,h)=>{const S=x(()=>N(s(R)));Q(O,{get bb(){return s(S)},get sizew(){return s(u)},get sizeh(){return s(p)},get bbout(){return n[h]},set bbout(T){n[h]=T}})}),l(o,c)};k(m,o=>{t()&&o(D)})}var g=q(m,2);y(r),A(()=>K(g,"src",s(f))),z(g,"clientHeight",o=>B(p,o)),z(g,"clientWidth",o=>B(u,o)),l(i,r)},W=i=>{var r=ee(),m=w(r);Y(m,{variant:"error"}),E(4),y(r),l(i,r)};k(M,i=>{s(f)?i(P):i(W,!1)})}l(e,v)},$$slots:{default:!0}}),j()}export{ue as default};
