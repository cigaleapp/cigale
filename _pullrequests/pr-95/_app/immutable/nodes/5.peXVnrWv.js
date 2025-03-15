import{c as N,a as g,t as _}from"../chunks/B4fTvO1f.js";import{ag as P,G as T,f as U,ah as q,g as o,s as $,M as j,c,a as w,r as d,t as S,b as J}from"../chunks/C5da3JO5.js";import{s as K}from"../chunks/CGuacY5z.js";import{a as Q}from"../chunks/DOC2QdkI.js";import{i as V}from"../chunks/CfqesXew.js";import{b as X,a as Y}from"../chunks/oOm2T-ds.js";import{p as Z}from"../chunks/CY4eTrAl.js";import ee from"../chunks/DdOs0EDW.js";import{t as se}from"../chunks/CCvWxKCj.js";import{a as ae}from"../chunks/HHTdpWX1.js";import{a as u,g as te}from"../chunks/CQ50htp4.js";import{e as oe,i as E,a as M,b as re,d as ie,c as ne}from"../chunks/CHmykQbx.js";import{i as le,b as ce,c as de,M as O,t as me,l as pe,T as ge,a as fe}from"../chunks/DDvny3ml.js";import z from"../chunks/B7ZOg_ky.js";import{u as r}from"../chunks/eQbZxTmL.js";import{s as ve}from"../chunks/DkL_9uYa.js";import{t as G}from"../chunks/DTIkBOvd.js";const H=b=>{var m=ue(),I=c(m);I.textContent=O,d(m),S(f=>Y(m,"href",f),[()=>me(O)]),g(b,m)};var ue=_('<a target="_blank" class="svelte-jsn2lw"><code class="svelte-jsn2lw"></code></a>'),_e=_("<p>Cliquer ou déposer des images ici</p>"),he=_("<section><!> <!></section>"),we=_('<section class="loading errored svelte-jsn2lw"><!> <h2 class="svelte-jsn2lw">Oops!</h2> <p class="svelte-jsn2lw">Impossible de charger le modèle de classification</p> <p class="source svelte-jsn2lw"><!></p> <p class="message svelte-jsn2lw"> </p></section>'),be=_('<section class="loading svelte-jsn2lw"><!> <p>Chargement du modèle de classification</p> <p class="source svelte-jsn2lw"><!></p></section>');function Fe(b,m){P(m,!0);const I=j(()=>r.previewURLs),f=j(()=>r.erroredImages),y=j(()=>se(u.Image.state,u.Observation.state,{isLoaded:e=>E(e)&&o(I).has(e.id)&&M(e)}));let h=$(void 0);async function R(){J(h,Z(await pe(!0))),G.success("Modèle de classification chargé")}async function k(e,s,{filename:a,metadata:i}){if(!o(h))return G.error("Modèle de classification non chargé, patentiez ou rechargez la page avant de rééssayer"),0;console.log("Analyzing image",s,a);let n=await le([e],fe,ge);const{x:v,y:p,width:t,height:l}=ae(i.crop.value),F=await ce([v,p,t,l],n),L=await de([[F]],o(h),r,0),x=L[0],C=L[1];if(L[0].length==0)return console.warn("No species detected"),0;await ve({subjectId:s,species:x[0][0].toString(),confidence:C[0][0],alternatives:x[0].slice(1).map((W,D)=>({value:W.toString(),confidence:C[0][D+1]}))})}T(()=>{r.setSelection&&oe()}),T(()=>{if(o(h))for(const e of u.Image.state)E(e)&&!M(e)&&!r.loadingImages.has(e.id)&&(r.loadingImages.add(e.id),(async()=>{try{const s=await te("ImageFile",re(e.id));if(!s){console.log("pas de fichier ..?");return}await k(s.bytes,e.id,e)==0&&o(f).set(e.id,"Erreur inattendue l'ors de la classification")}catch(s){console.error(s),o(f).set(e.id,(s==null?void 0:s.toString())??"Erreur inattendue")}finally{r.loadingImages.delete(e.id)}})())}),T(()=>{r.processing.total=u.Image.state.length,r.processing.done=u.Image.state.filter(e=>e.metadata.species).length});var A=N(),B=U(A);Q(B,R,e=>{var s=be(),a=c(s);z(a,{loading:!0});var i=w(a,4),n=c(i);H(n),d(i),d(s),g(e,s)},(e,s)=>{var a=he();let i;var n=c(a);ee(n,{get images(){return o(y)},get errors(){return o(f)},loadingText:"Analyse…",ondelete:async t=>{await ie(t),await ne(t)},get selection(){return r.selection},set selection(t){r.selection=t}});var v=w(n,2);{var p=t=>{var l=_e();g(t,l)};V(v,t=>{o(y).length||t(p)})}d(a),S(t=>i=X(a,1,"observations svelte-jsn2lw",null,i,t),[()=>({empty:!o(y).length})]),g(e,a)},(e,s)=>{var a=we(),i=c(a);z(i,{variant:"error"});var n=w(i,6),v=c(n);H(v),d(n);var p=w(n,2),t=c(p,!0);d(p),d(a),S(l=>K(t,l),[()=>{var l;return((l=o(s))==null?void 0:l.toString())??"Erreur inattendue"}]),g(e,a)}),g(b,A),q()}export{Fe as component};
