import{c as K,a as P,t as S}from"../chunks/C2IogcR0.js";import{a9 as Q,a8 as j,s as k,F,f as X,aa as ee,g as l,c as y,a as D,r as b,t as N,b as R,ar as te,ab as ae}from"../chunks/BsWIUf9a.js";import{s as oe}from"../chunks/Dh4X4SMs.js";import{a as re}from"../chunks/DF75oJVz.js";import{i as se}from"../chunks/m4WIalkB.js";import{c as ne,a as ie}from"../chunks/BKfSxfdr.js";import ce from"../chunks/DEnOzj3d.js";import{t as le}from"../chunks/CCRDardT.js";import{h as de,f as pe,j as H,l as ge}from"../chunks/SYhgx4gl.js";import ue from"../chunks/rovKr5Vs.js";import{p as me}from"../chunks/DBELAle1.js";import{j as fe,u as t,b as Z,k as J,t as _,e as ve,f as he,d as ye,l as U,o as be,r as Ie,p as _e}from"../chunks/CEzqsM_Y.js";import L from"../chunks/tiskVc8I.js";import{b as h,s as V}from"../chunks/Bnps6QHS.js";import{d as we}from"../chunks/D1uGfDU7.js";import{toasts as E}from"../chunks/CJIEpc6r.js";function W($,g){const s=fe($,g==null?void 0:g.in);if(isNaN(+s))throw new RangeError("Invalid time value");let u="",f="";const q="-",z=":";{const v=h(s.getDate(),2),I=h(s.getMonth()+1,2);u=`${h(s.getFullYear(),4)}${q}${I}${q}${v}`}{const v=s.getTimezoneOffset();if(v!==0){const r=Math.abs(v),o=h(Math.trunc(r/60),2),n=h(r%60,2);f=`${v<0?"+":"-"}${o}:${n}`}else f="Z";const I=h(s.getHours(),2),B=h(s.getMinutes(),2),A=h(s.getSeconds(),2),e=u===""?"":"T",a=[I,B,A].join(z);u=`${u}${e}${a}${f}`}return u}const Y=$=>{var g=xe();ie(g,"href",`https://git.inpt.fr/cigale/cigale.pages.inpt.fr/-/tree/main/models/${H}`);var s=y(g);s.textContent=H,b(g),P($,g)};var xe=S('<a target="_blank" class="svelte-qps1i2"><code class="svelte-qps1i2"></code></a>'),Pe=S('<div class="empty-state svelte-qps1i2"><!> <p>Cliquer ou déposer des images ici</p></div>'),$e=S("<section><!> <!></section>"),Be=S('<section class="loading errored svelte-qps1i2"><!> <h2 class="svelte-qps1i2">Oops!</h2> <p class="svelte-qps1i2">Impossible de charger le modèle de recadrage</p> <p class="source svelte-qps1i2"><!></p> <p class="message svelte-qps1i2"> </p></section>'),Se=S('<section class="loading svelte-qps1i2"><!> <p>Chargement du modèle de recadrage…</p> <p class="source svelte-qps1i2"><!></p></section>');function Ze($,g){Q(g,!0);const s=j(()=>t.erroredImages),u=j(()=>le(_.Image.state,[],{isLoaded:e=>!!(t.currentProtocol&&Z(e)&&t.hasPreviewURL(e)&&J(t.currentProtocol,e))}));let f=k(void 0);async function q(){t.currentProtocol&&(R(f,await ge(t.currentProtocol,"detection"),!0),E.success("Modèle de recadrage chargé"))}async function z(e,a){if(!t.currentProtocol){E.error("Aucun protocole sélectionné");return}await _.Image.set({id:a,filename:e.name,addedAt:W(new Date),metadata:{},bufferExists:!1,contentType:e.type});const r=await e.arrayBuffer(),o=await Ie({source:e});await _e({id:a,resizedBytes:o,originalBytes:r,contentType:e.type}),await me(t.currentProtocol.id,a,r,e),await v(a,o,e)}async function v(e,a,{type:r,name:o}){var w;if(!t.currentProtocol){E.error("Aucun protocole sélectionné");return}if(!l(f)){E.error("Modèle de recadrage non chargé, patentiez ou rechargez la page avant de rééssayer");return}const[[n],[d]]=await de(t.currentProtocol,[a],l(f));console.log("Bounding boxes:",n);let[i,...p]=n,[m,...C]=d;if(!i||!m){await V({subjectId:e,metadataId:((w=t.currentProtocol.crop)==null?void 0:w.metadata)??"crop",type:"boundingbox",value:{x:0,y:0,w:0,h:0},confidence:0});return}const c=([x,M,O,T])=>pe(t.currentProtocol)({x,y:M,w:O,h:T});await be(["Image","Observation"],{},async x=>{var M,O;await V({tx:x,subjectId:e,metadataId:((O=(M=t.currentProtocol)==null?void 0:M.crop)==null?void 0:O.metadata)??"crop",type:"boundingbox",value:c(i),confidence:m});for(const[T,G]of p.entries())await x.objectStore("Image").put({id:U(parseInt(e),T+1),filename:o,contentType:r,addedAt:W(new Date),bufferExists:!0,metadata:{crop:{value:JSON.stringify(c(G)),confidence:C[T],alternatives:{}}}})})}F(()=>{if(l(f)&&t.currentProtocol)for(const e of _.Image.state)Z(e)&&!J(t.currentProtocol,e)&&!t.loadingImages.has(e.id)&&(async()=>{try{const a=await ve("ImagePreviewFile",he(e.id));if(!a)return;t.loadingImages.add(e.id),await v(e.id,a.bytes,{type:e.contentType,name:e.filename})}catch(a){console.error(a),l(s).set(e.id,(a==null?void 0:a.toString())??"Erreur inattendue")}finally{t.loadingImages.delete(e.id)}})()});let I=k(0);F(()=>{t.processing.total=_.Image.state.length+l(I),t.processing.total=_.Image.state.length,t.processing.done=_.Image.state.filter(e=>e.metadata[t.cropMetadataId]).length});var B=K(),A=X(B);re(A,q,e=>{var a=Se(),r=y(a);L(r,{loading:!0});var o=D(r,4),n=y(o);Y(n),b(o),b(a),P(e,a)},(e,a)=>{const r=j(()=>l(u).length===0);ue(e,{get clickable(){return l(r)},onfiles:async({files:o})=>{R(I,o.length,!0);for(const n of o){const d=_.Image.state.length,i=U(d);try{t.loadingImages.add(i),await z(n,i),te(I,-1)}catch(p){console.error(p),l(s).set(i,(p==null?void 0:p.toString())??"Erreur inattendue")}finally{t.loadingImages.delete(i)}}},children:(o,n)=>{var d=$e();let i;var p=y(d);ce(p,{get images(){return l(u)},get errors(){return l(s)},loadingText:"Analyse…",ondelete:async c=>{await we(c),await ye(c)},get selection(){return t.selection},set selection(c){t.selection=c}});var m=D(p,2);{var C=c=>{var w=Pe(),x=y(w);L(x,{variant:"empty"}),ae(2),b(w),P(c,w)};se(m,c=>{l(u).length||c(C)})}b(d),N(c=>i=ne(d,1,"observations svelte-qps1i2",null,i,c),[()=>({empty:!l(u).length})]),P(o,d)},$$slots:{default:!0}})},(e,a)=>{var r=Be(),o=y(r);L(o,{variant:"error"});var n=D(o,6),d=y(n);Y(d),b(n);var i=D(n,2),p=y(i,!0);b(i),b(r),N(m=>oe(p,m),[()=>{var m;return((m=l(a))==null?void 0:m.toString())??"Erreur inattendue"}]),P(e,r)}),P($,B),ee()}export{Ze as component};
