import{c as W,a as g,t as h}from"../chunks/Bh4UdHfS.js";import{ag as q,G as L,f as $,ah as J,g as n,s as K,M as x,c,a as b,r as d,t as T,b as Q}from"../chunks/DvvCRPia.js";import{s as V}from"../chunks/Cvfnkkmk.js";import{a as X}from"../chunks/Dmj2CA_B.js";import{i as Y}from"../chunks/C7K4hmOx.js";import{b as Z,a as ee}from"../chunks/BuyP6kwd.js";import{p as se}from"../chunks/BYruc9P9.js";import ae from"../chunks/CZNGFhrC.js";import{t as te}from"../chunks/BvMHHHoh.js";import{a as oe,t as re}from"../chunks/Cctd6H-p.js";import{u as a,a as w,b as P,c as A,e as ie,f as R,d as ne}from"../chunks/B4DedOup.js";import{i as le,b as ce,c as de,M as S,t as pe,l as me,a as ge,T as fe}from"../chunks/BmtddTfD.js";import E from"../chunks/QwjA-2O9.js";import{e as ve,d as ue}from"../chunks/B-gQKBgG.js";import{s as we}from"../chunks/fJs9bsPC.js";import{t as M}from"../chunks/BsYwezHq.js";const O=I=>{var p=he(),f=c(p);f.textContent=S,d(p),T(v=>ee(p,"href",v),[()=>pe(S)]),g(I,p)};var he=h('<a target="_blank" class="svelte-jsn2lw"><code class="svelte-jsn2lw"></code></a>'),_e=h("<p>Cliquer ou déposer des images ici</p>"),be=h("<section><!> <!></section>"),Ie=h('<section class="loading errored svelte-jsn2lw"><!> <h2 class="svelte-jsn2lw">Oops!</h2> <p class="svelte-jsn2lw">Impossible de charger le modèle de classification</p> <p class="source svelte-jsn2lw"><!></p> <p class="message svelte-jsn2lw"> </p></section>'),ye=h('<section class="loading svelte-jsn2lw"><!> <p>Chargement du modèle de classification</p> <p class="source svelte-jsn2lw"><!></p></section>');function ke(I,p){q(p,!0);const f=x(()=>a.erroredImages),v=x(()=>te(w.Image.state,w.Observation.state,{previewURL:e=>a.getPreviewURL(e,"cropped")??a.getPreviewURL(e,"full"),showBoundingBoxes:e=>!a.hasPreviewURL(e,"cropped"),isLoaded:e=>P(e)&&a.hasPreviewURL(e)&&A(e)}));let _=K(void 0);async function U(){Q(_,se(await me(!0))),M.success("Modèle de classification chargé")}async function B(e,s,{filename:t,metadata:r}){if(!n(_))return M.error("Modèle de classification non chargé, patentiez ou rechargez la page avant de rééssayer"),0;console.log("Analyzing image",s,t);let i=await le([e],fe,ge);const{x:u,y:m,width:o,height:l}=oe(re(r.crop.value)),C=await ce([u,m,o,l],i);a.croppedPreviewURLs.set(R(s),C.toDataURL());const y=await de([[C]],n(_),a,0),G=y[0];if(y[1],y[0].length==0)return console.warn("No species detected"),0;{const[[H,k],...D]=G;await we({subjectId:s,clade:"species",value:H.toString(),confidence:k,alternatives:D.map(([F,N])=>({value:F.toString(),confidence:N}))})}}L(()=>{a.setSelection&&ve()}),L(()=>void(async()=>{if(n(_)){for(const e of w.Image.state)if(P(e)&&!A(e)&&!a.loadingImages.has(e.id)){a.loadingImages.add(e.id);try{const s=await ie("ImagePreviewFile",R(e.id));if(!s){console.log("pas de fichier ..?");return}await B(s.bytes,e.id,e)==0&&n(f).set(e.id,"Erreur inattendue l'ors de la classification")}catch(s){console.error(s),n(f).set(e.id,(s==null?void 0:s.toString())??"Erreur inattendue")}finally{a.loadingImages.delete(e.id)}}}})()),L(()=>{a.processing.total=w.Image.state.length,a.processing.done=w.Image.state.filter(e=>e.metadata.species).length});var j=W(),z=$(j);X(z,U,e=>{var s=ye(),t=c(s);E(t,{loading:!0});var r=b(t,4),i=c(r);O(i),d(r),d(s),g(e,s)},(e,s)=>{var t=be();let r;var i=c(t);ae(i,{get images(){return n(v)},get errors(){return n(f)},loadingText:"Analyse…",ondelete:async o=>{await ue(o),await ne(o)},get selection(){return a.selection},set selection(o){a.selection=o}});var u=b(i,2);{var m=o=>{var l=_e();g(o,l)};Y(u,o=>{n(v).length||o(m)})}d(t),T(o=>r=Z(t,1,"observations svelte-jsn2lw",null,r,o),[()=>({empty:!n(v).length})]),g(e,t)},(e,s)=>{var t=Ie(),r=c(t);E(r,{variant:"error"});var i=b(r,6),u=c(i);O(u),d(i);var m=b(i,2),o=c(m,!0);d(m),d(t),T(l=>V(o,l),[()=>{var l;return((l=n(s))==null?void 0:l.toString())??"Erreur inattendue"}]),g(e,t)}),g(I,j),J()}export{ke as component};
