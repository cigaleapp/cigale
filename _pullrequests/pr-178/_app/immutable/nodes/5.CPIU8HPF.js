import{c as W,a as g,t as h}from"../chunks/ZqgaobIy.js";import{a9 as $,J as T,f as q,aa as J,g as n,s as K,a8 as M,c as d,a as P,r as m,t as j,b as Q}from"../chunks/CfN1TJh4.js";import{s as X}from"../chunks/CUZPwsy4.js";import{a as Y}from"../chunks/BSFKUUJr.js";import{i as Z}from"../chunks/BoXY7CH-.js";import{c as ee,a as ae}from"../chunks/iQtKr0bc.js";import te from"../chunks/Bo49WnUG.js";import{t as se}from"../chunks/BDX2iQmo.js";import{i as oe,T as re,a as ie,t as ne,b as ce,c as le,M as O,d as de,l as me,e as fe}from"../chunks/DwOhrTrR.js";import{u as a,t as w,b as U,c as B,e as pe,f as z,d as ge,h as ue}from"../chunks/BwnbgMYq.js";import H from"../chunks/BWPrmIBY.js";import{a as ve,s as we}from"../chunks/AJ8NNFTy.js";import{e as he,d as Ie}from"../chunks/BIcl7pPN.js";import{toasts as _e}from"../chunks/CUe4EHFl.js";const k=b=>{var f=Pe(),I=d(f);I.textContent=O,m(f),j(y=>ae(f,"href",y),[()=>de(O)]),g(b,f)};var Pe=h('<a target="_blank" class="svelte-jsn2lw"><code class="svelte-jsn2lw"></code></a>'),be=h("<p>Cliquer ou déposer des images ici</p>"),ye=h("<section><!> <!></section>"),Le=h('<section class="loading errored svelte-jsn2lw"><!> <h2 class="svelte-jsn2lw">Oops!</h2> <p class="svelte-jsn2lw">Impossible de charger le modèle de classification</p> <p class="source svelte-jsn2lw"><!></p> <p class="message svelte-jsn2lw"> </p></section>'),Te=h('<section class="loading svelte-jsn2lw"><!> <p>Chargement du modèle de classification</p> <p class="source svelte-jsn2lw"><!></p></section>');function De(b,f){$(f,!0);const I=M(()=>a.erroredImages),y=M(()=>fe(a.currentProtocol)),L=M(()=>se(w.Image.state,w.Observation.state,{previewURL:e=>a.getPreviewURL(e,"cropped")??a.getPreviewURL(e,"full"),showBoundingBoxes:e=>!a.hasPreviewURL(e,"cropped"),isLoaded:e=>U(e)&&a.hasPreviewURL(e)&&B(e)}));let _=K(void 0);async function D(){a.currentProtocol&&(Q(_,await me(a.currentProtocol,"classification"),!0),_e.success("Modèle de classification chargé"))}async function F(e,t,{filename:o,metadata:r}){var E,R;if(!a.currentProtocol)throw new Error("Aucun protocole sélectionné");if(!n(_))throw new Error("Modèle de classification non chargé, patentiez ou rechargez la page avant de rééssayer");console.log("Analyzing image",t,o);const i=((R=(E=a.currentProtocol.inference)==null?void 0:E.detection)==null?void 0:R.input)??{width:ie,height:re};let u=await oe([e],{...i,normalized:!0});const{x:p,y:s,width:c,height:N}=n(y)(ne(r[a.cropMetadataId].value)),A=await ce([p,s,c,N],u);a.croppedPreviewURLs.set(z(t),A.toDataURL());const[[V]]=await le(a.currentProtocol,[[A]],n(_),a,0),C=V.map((l,v)=>({confidence:l,value:v.toString()})).sort((l,v)=>v.confidence-l.confidence).slice(0,3).filter(({confidence:l})=>l>.005);if(C.length){const[l,...v]=C;if(!a.currentProtocol)return;const S={subjectId:t,...l,alternatives:v};"taxonomic"in(ve(a.classificationMetadataId)??{})?await ue({...S,protocol:a.currentProtocol,metadataId:a.classificationMetadataId}):await we({...S,metadataId:a.classificationMetadataId})}else throw new Error("No species detected")}T(()=>{a.setSelection&&he()}),T(()=>void(async()=>{if(n(_)){for(const e of w.Image.state)if(U(e)&&!B(e)&&!a.loadingImages.has(e.id)){a.loadingImages.add(e.id);try{const t=await pe("ImagePreviewFile",z(e.id));if(!t)throw new Error("No file ..?");await F(t.bytes,e.id,e)}catch(t){console.error(t),n(I).set(e.id,(t==null?void 0:t.toString())??"Erreur inattendue")}finally{a.loadingImages.delete(e.id)}}}})()),T(()=>{a.processing.total=w.Image.state.length,a.processing.done=w.Image.state.filter(e=>e.metadata[a.classificationMetadataId]).length});var x=W(),G=q(x);Y(G,D,e=>{var t=Te(),o=d(t);H(o,{loading:!0});var r=P(o,4),i=d(r);k(i),m(r),m(t),g(e,t)},(e,t)=>{var o=ye();let r;var i=d(o);te(i,{get images(){return n(L)},get errors(){return n(I)},loadingText:"Analyse…",ondelete:async s=>{await Ie(s),await ge(s)},get selection(){return a.selection},set selection(s){a.selection=s}});var u=P(i,2);{var p=s=>{var c=be();g(s,c)};Z(u,s=>{n(L).length||s(p)})}m(o),j(s=>r=ee(o,1,"observations svelte-jsn2lw",null,r,s),[()=>({empty:!n(L).length})]),g(e,o)},(e,t)=>{var o=Le(),r=d(o);H(r,{variant:"error"});var i=P(r,6),u=d(i);k(u),m(i);var p=P(i,2),s=d(p,!0);m(p),m(o),j(c=>X(s,c),[()=>{var c;return((c=n(t))==null?void 0:c.toString())??"Erreur inattendue"}]),g(e,o)}),g(b,x),J()}export{De as component};
