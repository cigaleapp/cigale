import{c as q,a as g,t as h}from"../chunks/64mctwwP.js";import{a9 as J,a8 as T,s as K,F as j,f as Q,aa as X,g as n,c as d,a as P,r as m,t as x,b as Y}from"../chunks/BJJyANvY.js";import{s as Z}from"../chunks/BJDLrIW6.js";import{a as ee}from"../chunks/BNdkfdSy.js";import{i as te}from"../chunks/B3vYgvhU.js";import{c as ae,a as se}from"../chunks/BCVj7Vec.js";import oe from"../chunks/BYrW0Xvq.js";import{t as re}from"../chunks/xdBWQ3b_.js";import{a as ie,i as ne,T as ce,b as le,t as de,c as me,d as fe,M as z,e as pe,l as ge}from"../chunks/BRIqVPnB.js";import{u as t,t as w,c as B,e as F,h as ue,j as H,d as ve,l as we}from"../chunks/BdKEBFrC.js";import k from"../chunks/Bc1MtT8E.js";import{s as he}from"../chunks/BPXtzIjC.js";import{e as _e,d as Ie}from"../chunks/CNm6ONcf.js";import{t as Pe}from"../chunks/CR9N5Y3I.js";const D=b=>{var f=be(),_=d(f);_.textContent=z,m(f),x(y=>se(f,"href",y),[()=>pe(z)]),g(b,f)};var be=h('<a target="_blank" class="svelte-jsn2lw"><code class="svelte-jsn2lw"></code></a>'),ye=h("<p>Cliquer ou déposer des images ici</p>"),Le=h("<section><!> <!></section>"),Te=h('<section class="loading errored svelte-jsn2lw"><!> <h2 class="svelte-jsn2lw">Oops!</h2> <p class="svelte-jsn2lw">Impossible de charger le modèle de classification</p> <p class="source svelte-jsn2lw"><!></p> <p class="message svelte-jsn2lw"> </p></section>'),je=h('<section class="loading svelte-jsn2lw"><!> <p>Chargement du modèle de classification</p> <p class="source svelte-jsn2lw"><!></p></section>');function De(b,f){J(f,!0);const _=T(()=>t.erroredImages),y=T(()=>ie(t.currentProtocol)),L=T(()=>re(w.Image.state,w.Observation.state,{previewURL:e=>t.getPreviewURL(e,"cropped")??t.getPreviewURL(e,"full"),showBoundingBoxes:e=>!t.hasPreviewURL(e,"cropped"),isLoaded:e=>B(e)&&t.hasPreviewURL(e)&&F(e)}));let I=K(void 0);async function G(){t.currentProtocol&&(Y(I,await ge(t.currentProtocol,"classification"),!0),Pe.success("Modèle de classification chargé"))}async function N(e,a,{filename:o,metadata:r}){var M,R,S,O;if(!t.currentProtocol)throw new Error("Aucun protocole sélectionné");if(!n(I))throw new Error("Modèle de classification non chargé, patentiez ou rechargez la page avant de rééssayer");console.log("Analyzing image",a,o);const i=((R=(M=t.currentProtocol.inference)==null?void 0:M.detection)==null?void 0:R.input)??{width:le,height:ce};let u=await ne([e],{...i,normalized:!0});const{x:p,y:s,width:c,height:W}=n(y)(de(r.crop.value)),C=await me([p,s,c,W],u);t.croppedPreviewURLs.set(H(a),C.toDataURL());const[[$]]=await fe(t.currentProtocol,[[C]],n(I),t,0),E=$.map((l,v)=>({confidence:l,value:v.toString()})).sort((l,v)=>v.confidence-l.confidence).slice(0,3).filter(({confidence:l})=>l>.005);if(E.length){const[l,...v]=E;if(!t.currentProtocol)return;const U={subjectId:a,...l,alternatives:v};(O=(S=t.currentProtocol.inference)==null?void 0:S.classification)!=null&&O.taxonomic?await we({...U,protocol:t.currentProtocol,metadataId:t.currentProtocol.inference.classification.metadata}):await he({...U,metadataId:t.classificationMetadataId})}else throw new Error("No species detected")}j(()=>{t.setSelection&&_e()}),j(()=>void(async()=>{if(n(I)){for(const e of w.Image.state)if(B(e)&&!F(e)&&!t.loadingImages.has(e.id)){t.loadingImages.add(e.id);try{const a=await ue("ImagePreviewFile",H(e.id));if(!a)throw new Error("No file ..?");await N(a.bytes,e.id,e)}catch(a){console.error(a),n(_).set(e.id,(a==null?void 0:a.toString())??"Erreur inattendue")}finally{t.loadingImages.delete(e.id)}}}})()),j(()=>{t.processing.total=w.Image.state.length,t.processing.done=w.Image.state.filter(e=>e.metadata[t.classificationMetadataId]).length});var A=q(),V=Q(A);ee(V,G,e=>{var a=je(),o=d(a);k(o,{loading:!0});var r=P(o,4),i=d(r);D(i),m(r),m(a),g(e,a)},(e,a)=>{var o=Le();let r;var i=d(o);oe(i,{get images(){return n(L)},get errors(){return n(_)},loadingText:"Analyse…",ondelete:async s=>{await Ie(s),await ve(s)},get selection(){return t.selection},set selection(s){t.selection=s}});var u=P(i,2);{var p=s=>{var c=ye();g(s,c)};te(u,s=>{n(L).length||s(p)})}m(o),x(s=>r=ae(o,1,"observations svelte-jsn2lw",null,r,s),[()=>({empty:!n(L).length})]),g(e,o)},(e,a)=>{var o=Te(),r=d(o);k(r,{variant:"error"});var i=P(r,6),u=d(i);D(u),m(i);var p=P(i,2),s=d(p,!0);m(p),m(o),x(c=>Z(s,c),[()=>{var c;return((c=n(a))==null?void 0:c.toString())??"Erreur inattendue"}]),g(e,o)}),g(b,A),X()}export{De as component};
