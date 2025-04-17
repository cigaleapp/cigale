import{c as W,a as g,t as h}from"../chunks/C2IogcR0.js";import{a9 as $,a8 as T,s as q,F as M,f as J,aa as K,g as n,c as d,a as P,r as m,t as j,b as Q}from"../chunks/BsWIUf9a.js";import{s as X}from"../chunks/Dh4X4SMs.js";import{a as Y}from"../chunks/DF75oJVz.js";import{i as Z}from"../chunks/m4WIalkB.js";import{c as ee,a as ae}from"../chunks/BKfSxfdr.js";import te from"../chunks/D4xw_cfV.js";import{t as se}from"../chunks/DDszD4VD.js";import{a as oe,i as re,T as ie,b as ne,t as ce,c as le,d as de,M as O,e as me,l as fe}from"../chunks/CwdUlFUd.js";import{u as a,t as w,b as U,c as B,e as pe,f as z,d as ge,h as ue}from"../chunks/Cw05eZV8.js";import F from"../chunks/tiskVc8I.js";import{a as ve,s as we}from"../chunks/CR_RWD6A.js";import{e as he,d as Ie}from"../chunks/B6NQ8l8I.js";import{toasts as _e}from"../chunks/CACcPHQQ.js";const H=b=>{var f=Pe(),I=d(f);I.textContent=O,m(f),j(y=>ae(f,"href",y),[()=>me(O)]),g(b,f)};var Pe=h('<a target="_blank" class="svelte-jsn2lw"><code class="svelte-jsn2lw"></code></a>'),be=h("<p>Cliquer ou déposer des images ici</p>"),ye=h("<section><!> <!></section>"),Le=h('<section class="loading errored svelte-jsn2lw"><!> <h2 class="svelte-jsn2lw">Oops!</h2> <p class="svelte-jsn2lw">Impossible de charger le modèle de classification</p> <p class="source svelte-jsn2lw"><!></p> <p class="message svelte-jsn2lw"> </p></section>'),Te=h('<section class="loading svelte-jsn2lw"><!> <p>Chargement du modèle de classification</p> <p class="source svelte-jsn2lw"><!></p></section>');function ke(b,f){$(f,!0);const I=T(()=>a.erroredImages),y=T(()=>oe(a.currentProtocol)),L=T(()=>se(w.Image.state,w.Observation.state,{previewURL:e=>a.getPreviewURL(e,"cropped")??a.getPreviewURL(e,"full"),showBoundingBoxes:e=>!a.hasPreviewURL(e,"cropped"),isLoaded:e=>U(e)&&a.hasPreviewURL(e)&&B(e)}));let _=q(void 0);async function k(){a.currentProtocol&&(Q(_,await fe(a.currentProtocol,"classification"),!0),_e.success("Modèle de classification chargé"))}async function D(e,t,{filename:o,metadata:r}){var E,R;if(!a.currentProtocol)throw new Error("Aucun protocole sélectionné");if(!n(_))throw new Error("Modèle de classification non chargé, patentiez ou rechargez la page avant de rééssayer");console.log("Analyzing image",t,o);const i=((R=(E=a.currentProtocol.inference)==null?void 0:E.detection)==null?void 0:R.input)??{width:ne,height:ie};let u=await re([e],{...i,normalized:!0});const{x:p,y:s,width:c,height:N}=n(y)(ce(r[a.cropMetadataId].value)),A=await le([p,s,c,N],u);a.croppedPreviewURLs.set(z(t),A.toDataURL());const[[V]]=await de(a.currentProtocol,[[A]],n(_),a,0),C=V.map((l,v)=>({confidence:l,value:v.toString()})).sort((l,v)=>v.confidence-l.confidence).slice(0,3).filter(({confidence:l})=>l>.005);if(C.length){const[l,...v]=C;if(!a.currentProtocol)return;const S={subjectId:t,...l,alternatives:v};"taxonomic"in(ve(a.classificationMetadataId)??{})?await ue({...S,protocol:a.currentProtocol,metadataId:a.classificationMetadataId}):await we({...S,metadataId:a.classificationMetadataId})}else throw new Error("No species detected")}M(()=>{a.setSelection&&he()}),M(()=>void(async()=>{if(n(_)){for(const e of w.Image.state)if(U(e)&&!B(e)&&!a.loadingImages.has(e.id)){a.loadingImages.add(e.id);try{const t=await pe("ImagePreviewFile",z(e.id));if(!t)throw new Error("No file ..?");await D(t.bytes,e.id,e)}catch(t){console.error(t),n(I).set(e.id,(t==null?void 0:t.toString())??"Erreur inattendue")}finally{a.loadingImages.delete(e.id)}}}})()),M(()=>{a.processing.total=w.Image.state.length,a.processing.done=w.Image.state.filter(e=>e.metadata[a.classificationMetadataId]).length});var x=W(),G=J(x);Y(G,k,e=>{var t=Te(),o=d(t);F(o,{loading:!0});var r=P(o,4),i=d(r);H(i),m(r),m(t),g(e,t)},(e,t)=>{var o=ye();let r;var i=d(o);te(i,{get images(){return n(L)},get errors(){return n(I)},loadingText:"Analyse…",ondelete:async s=>{await Ie(s),await ge(s)},get selection(){return a.selection},set selection(s){a.selection=s}});var u=P(i,2);{var p=s=>{var c=be();g(s,c)};Z(u,s=>{n(L).length||s(p)})}m(o),j(s=>r=ee(o,1,"observations svelte-jsn2lw",null,r,s),[()=>({empty:!n(L).length})]),g(e,o)},(e,t)=>{var o=Le(),r=d(o);F(r,{variant:"error"});var i=P(r,6),u=d(i);H(u),m(i);var p=P(i,2),s=d(p,!0);m(p),m(o),j(c=>X(s,c),[()=>{var c;return((c=n(t))==null?void 0:c.toString())??"Erreur inattendue"}]),g(e,o)}),g(b,x),K()}export{ke as component};
