import{c as N,a as g,t as _}from"../chunks/Yi9iuJrU.js";import{ag as U,G as j,f as W,ah as q,g as o,s as V,M as L,c,a as h,r as d,t as S,b as $}from"../chunks/QTVBrZQz.js";import{s as J}from"../chunks/BijaW5W9.js";import{a as K}from"../chunks/rnCxOP1T.js";import{i as Q}from"../chunks/DC0ZX6qe.js";import{b as X,a as Y}from"../chunks/DPbpzs5i.js";import{p as Z}from"../chunks/DE1d3na4.js";import ee from"../chunks/2A1xXXgz.js";import{t as ae}from"../chunks/5ilgnhI2.js";import{t as se}from"../chunks/CXhtr36u.js";import{t as u,g as te}from"../chunks/mB26ZYJI.js";import{e as oe,i as C,a as E,b as re,d as ie,c as ne}from"../chunks/D4q-O7Jx.js";import{i as le,b as ce,c as de,M as O,t as me,l as pe,a as ge,T as fe}from"../chunks/DF3AhSVV.js";import z from"../chunks/BIWbyXLX.js";import{s as ve}from"../chunks/DsPA9dhD.js";import{u as r}from"../chunks/nkb6GWhH.js";import{t as G}from"../chunks/DiYDwYh3.js";const H=b=>{var m=ue(),I=c(m);I.textContent=O,d(m),S(f=>Y(m,"href",f),[()=>me(O)]),g(b,m)};var ue=_('<a target="_blank" class="svelte-jsn2lw"><code class="svelte-jsn2lw"></code></a>'),_e=_("<p>Cliquer ou déposer des images ici</p>"),we=_("<section><!> <!></section>"),he=_('<section class="loading errored svelte-jsn2lw"><!> <h2 class="svelte-jsn2lw">Oops!</h2> <p class="svelte-jsn2lw">Impossible de charger le modèle de classification</p> <p class="source svelte-jsn2lw"><!></p> <p class="message svelte-jsn2lw"> </p></section>'),be=_('<section class="loading svelte-jsn2lw"><!> <p>Chargement du modèle de classification</p> <p class="source svelte-jsn2lw"><!></p></section>');function Fe(b,m){U(m,!0);const I=L(()=>r.previewURLs),f=L(()=>r.erroredImages),y=L(()=>ae(u.Image.state,u.Observation.state,{isLoaded:e=>C(e)&&o(I).has(e.id)&&E(e)}));let w=V(void 0);async function R(){$(w,Z(await pe(!0))),G.success("Modèle de classification chargé")}async function k(e,a,{filename:s,metadata:i}){if(!o(w))return G.error("Modèle de classification non chargé, patentiez ou rechargez la page avant de rééssayer"),0;console.log("Analyzing image",a,s);let n=await le([e],fe,ge);const{x:v,y:p,width:t,height:l}=se(i.crop.value),F=await ce([v,p,t,l],n),T=await de([[F]],o(w),r,0),M=T[0],x=T[1];if(T[0].length==0)return console.warn("No species detected"),0;await ve({subjectId:a,metadataId:"species",type:"enum",value:M[0][0].toString(),confidence:x[0][0],alternatives:M[0].slice(1).map((P,D)=>({value:P.toString(),confidence:x[0][D+1]}))})}j(()=>{r.setSelection&&oe()}),j(()=>void(async()=>{if(o(w)){for(const e of u.Image.state)if(C(e)&&!E(e)&&!r.loadingImages.has(e.id)){r.loadingImages.add(e.id);try{const a=await te("ImagePreviewFile",re(e.id));if(!a){console.log("pas de fichier ..?");return}await k(a.bytes,e.id,e)==0&&o(f).set(e.id,"Erreur inattendue l'ors de la classification")}catch(a){console.error(a),o(f).set(e.id,(a==null?void 0:a.toString())??"Erreur inattendue")}finally{r.loadingImages.delete(e.id)}}}})()),j(()=>{r.processing.total=u.Image.state.length,r.processing.done=u.Image.state.filter(e=>e.metadata.species).length});var A=N(),B=W(A);K(B,R,e=>{var a=be(),s=c(a);z(s,{loading:!0});var i=h(s,4),n=c(i);H(n),d(i),d(a),g(e,a)},(e,a)=>{var s=we();let i;var n=c(s);ee(n,{get images(){return o(y)},get errors(){return o(f)},loadingText:"Analyse…",ondelete:async t=>{await ie(t),await ne(t)},get selection(){return r.selection},set selection(t){r.selection=t}});var v=h(n,2);{var p=t=>{var l=_e();g(t,l)};Q(v,t=>{o(y).length||t(p)})}d(s),S(t=>i=X(s,1,"observations svelte-jsn2lw",null,i,t),[()=>({empty:!o(y).length})]),g(e,s)},(e,a)=>{var s=he(),i=c(s);z(i,{variant:"error"});var n=h(i,6),v=c(n);H(v),d(n);var p=h(n,2),t=c(p,!0);d(p),d(s),S(l=>J(t,l),[()=>{var l;return((l=o(a))==null?void 0:l.toString())??"Erreur inattendue"}]),g(e,s)}),g(b,A),q()}export{Fe as component};
