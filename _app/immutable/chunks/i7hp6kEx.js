import{c as b,a as l,t as H}from"./DVHRhNjq.js";import{ae as T,ad as _,s as x,af as U,f as w,g as s,c as y,a as q,r as B,t as A,b as C,ag as E}from"./je5hudcr.js";import{i as k}from"./CZpreLed.js";import{e as G,i as J}from"./BOy7pdjG.js";import{a as K}from"./CSTXPE61.js";import{b as z}from"./CfSr-YiY.js";import{p as I}from"./B3DmaASf.js";import{a as N}from"./CZK3dPLl.js";import Q from"./Cg12O2Cy.js";import{u as V,j as X}from"./CmndcWlX.js";import Y from"./Dv6WUPvX.js";import Z from"./B-OxuJVs.js";var $=H('<div class="content svelte-12yxguw"><!> <img alt="imagetocrop" style="width: 100%; height: 100%;"></div>'),ee=H('<div class="errored svelte-12yxguw"><!> <h1 class="svelte-12yxguw">Ooops!!</h1> <p>Image introuvable.</p></div>');function ue(L,o){T(o,!0);let d=I(o,"opener",15,void 0),t=I(o,"boundingBoxes",19,()=>[]);const f=_(()=>V.previewURLs.get(X(o.id)));let n=[];for(let e=0;e<t().length;e++)n.push({x:t()[e].x,y:t()[e].y,width:t()[e].width,height:t()[e].height});let p=x(0),u=x(0);Z(L,{get key(){return o.key},title:"Crop",onconfirm:()=>o.onconfirm(n[0]),confirm:"Crop",cancel:"Cancel",get open(){return d()},set open(e){d(e)},children:(e,te)=>{var v=b(),P=w(v);{var W=i=>{var r=$(),m=y(r);{var D=a=>{var c=b(),F=w(c);G(F,17,t,J,(M,O,h)=>{const R=_(()=>N(s(O)));Q(M,{get bb(){return s(R)},get sizew(){return s(u)},get sizeh(){return s(p)},get bbout(){return n[h]},set bbout(S){n[h]=S}})}),l(a,c)};k(m,a=>{t()&&a(D)})}var g=q(m,2);B(r),A(()=>K(g,"src",s(f))),z(g,"clientHeight",a=>C(p,a)),z(g,"clientWidth",a=>C(u,a)),l(i,r)},j=i=>{var r=ee(),m=y(r);Y(m,{variant:"error"}),E(4),B(r),l(i,r)};k(P,i=>{s(f)?i(W):i(j,!1)})}l(e,v)},$$slots:{default:!0}}),U()}export{ue as default};
