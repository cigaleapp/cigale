import{c as b,a as l,t as H}from"./Dg_JGDnQ.js";import{ac as U,ab as _,s as x,ad as j,f as w,g as s,c as y,a as q,r as B,t as A,b as C,ae as E}from"./ypqVbSJJ.js";import{i as k}from"./Da-IF8S7.js";import{e as G,i as J}from"./Cd1247F3.js";import{a as K}from"./DGulLCEo.js";import{b as z}from"./i_07m2ZJ.js";import{p as I}from"./WeKPzUqQ.js";import{a as N}from"./Cx9wgmBK.js";import Q from"./BbrCjT5-.js";import{u as V,f as X}from"./qjbMVObw.js";import Y from"./bL4fVcQG.js";import Z from"./D4KYqWlw.js";var $=H('<div class="content svelte-12yxguw"><!> <img alt="imagetocrop" style="width: 100%; height: 100%;"></div>'),ee=H('<div class="errored svelte-12yxguw"><!> <h1 class="svelte-12yxguw">Ooops!!</h1> <p>Image introuvable.</p></div>');function ue(L,o){U(o,!0);let g=I(o,"opener",15,void 0),t=I(o,"boundingBoxes",19,()=>[]);const f=_(()=>V.previewURLs.get(X(o.id)));let n=[];for(let e=0;e<t().length;e++)n.push({x:t()[e].x,y:t()[e].y,width:t()[e].width,height:t()[e].height});let p=x(0),u=x(0);Z(L,{get key(){return o.key},title:"Crop",onconfirm:()=>o.onconfirm(n[0]),confirm:"Crop",cancel:"Cancel",get open(){return g()},set open(e){g(e)},children:(e,te)=>{var c=b(),P=w(c);{var W=i=>{var r=$(),m=y(r);{var F=a=>{var v=b(),M=w(v);G(M,17,t,J,(O,R,h)=>{const S=_(()=>N(s(R)));Q(O,{get bb(){return s(S)},get sizew(){return s(u)},get sizeh(){return s(p)},get bbout(){return n[h]},set bbout(T){n[h]=T}})}),l(a,v)};k(m,a=>{t()&&a(F)})}var d=q(m,2);B(r),A(()=>K(d,"src",s(f))),z(d,"clientHeight",a=>C(p,a)),z(d,"clientWidth",a=>C(u,a)),l(i,r)},D=i=>{var r=ee(),m=y(r);Y(m,{variant:"error"}),E(4),B(r),l(i,r)};k(P,i=>{s(f)?i(W):i(D,!1)})}l(e,c)},$$slots:{default:!0}}),j()}export{ue as default};
