import{c as V,a as g,t as I}from"../chunks/BDmfjmOz.js";import{ai as W,B as P,f as q,aj as $,g as n,s as J,O,c as d,a as y,r as m,t as T,b as K}from"../chunks/Cg6bMued.js";import{s as Q}from"../chunks/C2T-a-jY.js";import{a as X}from"../chunks/Ba5PP6WD.js";import{i as Y}from"../chunks/CkSO6QB0.js";import{c as Z,a as ee}from"../chunks/0cE5EWVW.js";import{p as ae}from"../chunks/CBzL59nF.js";import te from"../chunks/qb8U-krC.js";import{t as se}from"../chunks/BKvFm8kK.js";import{a as oe,t as re}from"../chunks/Btb_01-Y.js";import{u as a,t as h,a as S,b as E,c as ie,e as U,d as ne,s as le}from"../chunks/ByRZpHlO.js";import{i as ce,b as de,c as me,M as B,t as fe,l as pe,a as ge,T as ve}from"../chunks/CHZVmyM7.js";import z from"../chunks/DMbgJuY1.js";import{s as ue}from"../chunks/Cfza64zB.js";import{e as we,d as _e}from"../chunks/EtydynFd.js";import{t as H}from"../chunks/D8yGYpeE.js";const k=L=>{var f=he(),v=d(f);v.textContent=B,m(f),T(u=>ee(f,"href",u),[()=>fe(B)]),g(L,f)};var he=I('<a target="_blank" class="svelte-jsn2lw"><code class="svelte-jsn2lw"></code></a>'),Ie=I("<p>Cliquer ou déposer des images ici</p>"),be=I("<section><!> <!></section>"),ye=I('<section class="loading errored svelte-jsn2lw"><!> <h2 class="svelte-jsn2lw">Oops!</h2> <p class="svelte-jsn2lw">Impossible de charger le modèle de classification</p> <p class="source svelte-jsn2lw"><!></p> <p class="message svelte-jsn2lw"> </p></section>'),Le=I('<section class="loading svelte-jsn2lw"><!> <p>Chargement du modèle de classification</p> <p class="source svelte-jsn2lw"><!></p></section>');function Fe(L,f){W(f,!0);const v=O(()=>a.erroredImages),u=O(()=>se(h.Image.state,h.Observation.state,{previewURL:e=>a.getPreviewURL(e,"cropped")??a.getPreviewURL(e,"full"),showBoundingBoxes:e=>!a.hasPreviewURL(e,"cropped"),isLoaded:e=>S(e)&&a.hasPreviewURL(e)&&E(e)}));let b=J(void 0);async function D(){K(b,ae(await pe(!0))),H.success("Modèle de classification chargé")}async function F(e,t,{filename:s,metadata:r}){var C,M;if(!n(b))return H.error("Modèle de classification non chargé, patentiez ou rechargez la page avant de rééssayer"),0;console.log("Analyzing image",t,s);let i=await ce([e],ve,ge);const{x:w,y:p,width:o,height:l}=oe(re(r.crop.value)),x=await de([w,p,o,l],i);a.croppedPreviewURLs.set(U(t),x.toDataURL());const[[N]]=await me([[x]],n(b),a,0),A=N.map((c,_)=>({confidence:c,value:_.toString()})).sort((c,_)=>_.confidence-c.confidence).slice(0,3).filter(({confidence:c})=>c>.005);if(A.length){const[c,..._]=A;if(!a.currentProtocol)return;const R={subjectId:t,...c,alternatives:_};(M=(C=a.currentProtocol.inference)==null?void 0:C.classification)!=null&&M.metadata?await le({...R,protocol:a.currentProtocol,metadataId:a.currentProtocol.inference.classification.metadata}):await ue({...R,metadataId:a.classificationMetadataId})}else return console.warn("No species detected"),0}P(()=>{a.setSelection&&we()}),P(()=>void(async()=>{if(n(b)){for(const e of h.Image.state)if(S(e)&&!E(e)&&!a.loadingImages.has(e.id)){a.loadingImages.add(e.id);try{const t=await ie("ImagePreviewFile",U(e.id));if(!t){console.log("pas de fichier ..?");return}await F(t.bytes,e.id,e)==0&&n(v).set(e.id,"Erreur inattendue l'ors de la classification")}catch(t){console.error(t),n(v).set(e.id,(t==null?void 0:t.toString())??"Erreur inattendue")}finally{a.loadingImages.delete(e.id)}}}})()),P(()=>{a.processing.total=h.Image.state.length,a.processing.done=h.Image.state.filter(e=>e.metadata[a.classificationMetadataId]).length});var j=V(),G=q(j);X(G,D,e=>{var t=Le(),s=d(t);z(s,{loading:!0});var r=y(s,4),i=d(r);k(i),m(r),m(t),g(e,t)},(e,t)=>{var s=be();let r;var i=d(s);te(i,{get images(){return n(u)},get errors(){return n(v)},loadingText:"Analyse…",ondelete:async o=>{await _e(o),await ne(o)},get selection(){return a.selection},set selection(o){a.selection=o}});var w=y(i,2);{var p=o=>{var l=Ie();g(o,l)};Y(w,o=>{n(u).length||o(p)})}m(s),T(o=>r=Z(s,1,"observations svelte-jsn2lw",null,r,o),[()=>({empty:!n(u).length})]),g(e,s)},(e,t)=>{var s=ye(),r=d(s);z(r,{variant:"error"});var i=y(r,6),w=d(i);k(w),m(i);var p=y(i,2),o=d(p,!0);m(p),m(s),T(l=>Q(o,l),[()=>{var l;return((l=n(t))==null?void 0:l.toString())??"Erreur inattendue"}]),g(e,s)}),g(L,j),$()}export{Fe as component};
