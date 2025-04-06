import{c as F,a as g,t as _}from"../chunks/Dg_JGDnQ.js";import{ac as N,ab as x,s as W,G as L,f as q,ad as V,g as n,c,a as b,r as d,t as T,b as $}from"../chunks/ypqVbSJJ.js";import{s as J}from"../chunks/BtM3C0Ax.js";import{a as K}from"../chunks/itZk9cZ1.js";import{i as Q}from"../chunks/Da-IF8S7.js";import{b as X,a as Y}from"../chunks/DGulLCEo.js";import Z from"../chunks/DiQER9P9.js";import{t as ee}from"../chunks/BAavPiKF.js";import{a as ae,t as se}from"../chunks/CTR5dLjF.js";import{u as s,t as w,b as A,c as C,e as te,f as E,d as oe}from"../chunks/C1YGbw5Z.js";import{i as re,b as ie,c as ne,M,t as le,l as ce,a as de,T as pe}from"../chunks/DI500XbJ.js";import O from"../chunks/bL4fVcQG.js";import{s as me}from"../chunks/TQV7YQsj.js";import{e as ge,d as fe}from"../chunks/xBIytXT2.js";import{t as U}from"../chunks/CbWNTRDb.js";const B=I=>{var p=ve(),f=c(p);f.textContent=M,d(p),T(v=>Y(p,"href",v),[()=>le(M)]),g(I,p)};var ve=_('<a target="_blank" class="svelte-jsn2lw"><code class="svelte-jsn2lw"></code></a>'),ue=_("<p>Cliquer ou déposer des images ici</p>"),we=_("<section><!> <!></section>"),_e=_('<section class="loading errored svelte-jsn2lw"><!> <h2 class="svelte-jsn2lw">Oops!</h2> <p class="svelte-jsn2lw">Impossible de charger le modèle de classification</p> <p class="source svelte-jsn2lw"><!></p> <p class="message svelte-jsn2lw"> </p></section>'),he=_('<section class="loading svelte-jsn2lw"><!> <p>Chargement du modèle de classification</p> <p class="source svelte-jsn2lw"><!></p></section>');function Be(I,p){N(p,!0);const f=x(()=>s.erroredImages),v=x(()=>ee(w.Image.state,w.Observation.state,{previewURL:e=>s.getPreviewURL(e,"cropped")??s.getPreviewURL(e,"full"),showBoundingBoxes:e=>!s.hasPreviewURL(e,"cropped"),isLoaded:e=>A(e)&&s.hasPreviewURL(e)&&C(e)}));let h=W(void 0);async function z(){$(h,await ce(!0),!0),U.success("Modèle de classification chargé")}async function G(e,a,{filename:t,metadata:r}){if(!n(h))return U.error("Modèle de classification non chargé, patentiez ou rechargez la page avant de rééssayer"),0;console.log("Analyzing image",a,t);let i=await re([e],pe,de);const{x:u,y:m,width:o,height:l}=ae(se(r.crop.value)),P=await ie([u,m,o,l],i);s.croppedPreviewURLs.set(E(a),P.toDataURL());const y=await ne([[P]],n(h),s,0),R=y[0],S=y[1];if(y[0].length==0)return console.warn("No species detected"),0;await me({subjectId:a,metadataId:"species",type:"enum",value:R[0][0].toString(),confidence:S[0][0],alternatives:R[0].slice(1).map((k,D)=>({value:k.toString(),confidence:S[0][D+1]}))})}L(()=>{s.setSelection&&ge()}),L(()=>void(async()=>{if(n(h)){for(const e of w.Image.state)if(A(e)&&!C(e)&&!s.loadingImages.has(e.id)){s.loadingImages.add(e.id);try{const a=await te("ImagePreviewFile",E(e.id));if(!a){console.log("pas de fichier ..?");return}await G(a.bytes,e.id,e)==0&&n(f).set(e.id,"Erreur inattendue l'ors de la classification")}catch(a){console.error(a),n(f).set(e.id,(a==null?void 0:a.toString())??"Erreur inattendue")}finally{s.loadingImages.delete(e.id)}}}})()),L(()=>{s.processing.total=w.Image.state.length,s.processing.done=w.Image.state.filter(e=>e.metadata.species).length});var j=F(),H=q(j);K(H,z,e=>{var a=he(),t=c(a);O(t,{loading:!0});var r=b(t,4),i=c(r);B(i),d(r),d(a),g(e,a)},(e,a)=>{var t=we();let r;var i=c(t);Z(i,{get images(){return n(v)},get errors(){return n(f)},loadingText:"Analyse…",ondelete:async o=>{await fe(o),await oe(o)},get selection(){return s.selection},set selection(o){s.selection=o}});var u=b(i,2);{var m=o=>{var l=ue();g(o,l)};Q(u,o=>{n(v).length||o(m)})}d(t),T(o=>r=X(t,1,"observations svelte-jsn2lw",null,r,o),[()=>({empty:!n(v).length})]),g(e,t)},(e,a)=>{var t=_e(),r=c(t);O(r,{variant:"error"});var i=b(r,6),u=c(i);B(u),d(i);var m=b(i,2),o=c(m,!0);d(m),d(t),T(l=>J(o,l),[()=>{var l;return((l=n(a))==null?void 0:l.toString())??"Erreur inattendue"}]),g(e,t)}),g(I,j),V()}export{Be as component};
