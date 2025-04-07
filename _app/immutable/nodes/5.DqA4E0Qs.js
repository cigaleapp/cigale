import{c as V,a as g,t as I}from"../chunks/DVHRhNjq.js";import{ae as W,ad as S,s as q,B as P,f as $,af as J,g as n,c as d,a as y,r as m,t as T,b as K}from"../chunks/je5hudcr.js";import{s as Q}from"../chunks/rhXEw3QH.js";import{a as X}from"../chunks/DN0_YFns.js";import{i as Y}from"../chunks/CZpreLed.js";import{c as Z,a as ee}from"../chunks/CSTXPE61.js";import ae from"../chunks/T74qJv6f.js";import{t as te}from"../chunks/BqSXX8EC.js";import{a as se,t as oe}from"../chunks/CZK3dPLl.js";import{u as a,t as h,c as E,e as O,h as re,j as U,d as ie,l as ne}from"../chunks/CmndcWlX.js";import{i as le,b as ce,c as de,M as B,t as me,l as fe,a as pe,T as ge}from"../chunks/B3V5XpT0.js";import z from"../chunks/Dv6WUPvX.js";import{s as ve}from"../chunks/gVvSxqxT.js";import{e as ue,d as we}from"../chunks/CBRpaB-N.js";import{t as H}from"../chunks/BMPvt3D4.js";const k=L=>{var f=_e(),v=d(f);v.textContent=B,m(f),T(u=>ee(f,"href",u),[()=>me(B)]),g(L,f)};var _e=I('<a target="_blank" class="svelte-jsn2lw"><code class="svelte-jsn2lw"></code></a>'),he=I("<p>Cliquer ou déposer des images ici</p>"),Ie=I("<section><!> <!></section>"),be=I('<section class="loading errored svelte-jsn2lw"><!> <h2 class="svelte-jsn2lw">Oops!</h2> <p class="svelte-jsn2lw">Impossible de charger le modèle de classification</p> <p class="source svelte-jsn2lw"><!></p> <p class="message svelte-jsn2lw"> </p></section>'),ye=I('<section class="loading svelte-jsn2lw"><!> <p>Chargement du modèle de classification</p> <p class="source svelte-jsn2lw"><!></p></section>');function ke(L,f){W(f,!0);const v=S(()=>a.erroredImages),u=S(()=>te(h.Image.state,h.Observation.state,{previewURL:e=>a.getPreviewURL(e,"cropped")??a.getPreviewURL(e,"full"),showBoundingBoxes:e=>!a.hasPreviewURL(e,"cropped"),isLoaded:e=>E(e)&&a.hasPreviewURL(e)&&O(e)}));let b=q(void 0);async function D(){K(b,await fe(!0),!0),H.success("Modèle de classification chargé")}async function F(e,t,{filename:s,metadata:r}){var C,M;if(!n(b))return H.error("Modèle de classification non chargé, patentiez ou rechargez la page avant de rééssayer"),0;console.log("Analyzing image",t,s);let i=await le([e],ge,pe);const{x:w,y:p,width:o,height:l}=se(oe(r.crop.value)),x=await ce([w,p,o,l],i);a.croppedPreviewURLs.set(U(t),x.toDataURL());const[[N]]=await de([[x]],n(b),a,0),A=N.map((c,_)=>({confidence:c,value:_.toString()})).sort((c,_)=>_.confidence-c.confidence).slice(0,3).filter(({confidence:c})=>c>.005);if(A.length){const[c,..._]=A;if(!a.currentProtocol)return;const R={subjectId:t,...c,alternatives:_};(M=(C=a.currentProtocol.inference)==null?void 0:C.classification)!=null&&M.metadata?await ne({...R,protocol:a.currentProtocol,metadataId:a.currentProtocol.inference.classification.metadata}):await ve({...R,metadataId:a.classificationMetadataId})}else return console.warn("No species detected"),0}P(()=>{a.setSelection&&ue()}),P(()=>void(async()=>{if(n(b)){for(const e of h.Image.state)if(E(e)&&!O(e)&&!a.loadingImages.has(e.id)){a.loadingImages.add(e.id);try{const t=await re("ImagePreviewFile",U(e.id));if(!t){console.log("pas de fichier ..?");return}await F(t.bytes,e.id,e)==0&&n(v).set(e.id,"Erreur inattendue l'ors de la classification")}catch(t){console.error(t),n(v).set(e.id,(t==null?void 0:t.toString())??"Erreur inattendue")}finally{a.loadingImages.delete(e.id)}}}})()),P(()=>{a.processing.total=h.Image.state.length,a.processing.done=h.Image.state.filter(e=>e.metadata[a.classificationMetadataId]).length});var j=V(),G=$(j);X(G,D,e=>{var t=ye(),s=d(t);z(s,{loading:!0});var r=y(s,4),i=d(r);k(i),m(r),m(t),g(e,t)},(e,t)=>{var s=Ie();let r;var i=d(s);ae(i,{get images(){return n(u)},get errors(){return n(v)},loadingText:"Analyse…",ondelete:async o=>{await we(o),await ie(o)},get selection(){return a.selection},set selection(o){a.selection=o}});var w=y(i,2);{var p=o=>{var l=he();g(o,l)};Y(w,o=>{n(u).length||o(p)})}m(s),T(o=>r=Z(s,1,"observations svelte-jsn2lw",null,r,o),[()=>({empty:!n(u).length})]),g(e,s)},(e,t)=>{var s=be(),r=d(s);z(r,{variant:"error"});var i=y(r,6),w=d(i);k(w),m(i);var p=y(i,2),o=d(p,!0);m(p),m(s),T(l=>Q(o,l),[()=>{var l;return((l=n(t))==null?void 0:l.toString())??"Erreur inattendue"}]),g(e,s)}),g(L,j),J()}export{ke as component};
