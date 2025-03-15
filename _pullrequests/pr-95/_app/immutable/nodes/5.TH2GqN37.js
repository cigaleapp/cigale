import{c as W,a as g,t as _}from"../chunks/B4fTvO1f.js";import{ag as q,G as j,f as $,ah as J,g as o,s as K,M as L,c,a as w,r as d,t as C,b as Q}from"../chunks/C5da3JO5.js";import{s as V}from"../chunks/CGuacY5z.js";import{a as X}from"../chunks/DOC2QdkI.js";import{i as Y}from"../chunks/CfqesXew.js";import{b as Z,a as ee}from"../chunks/oOm2T-ds.js";import{p as ae}from"../chunks/CY4eTrAl.js";import se from"../chunks/BolH26qL.js";import{t as te}from"../chunks/COxH1d8U.js";import{a as oe}from"../chunks/HHTdpWX1.js";import{a as u,g as re}from"../chunks/BPFMCpXk.js";import{e as ie,i as S,a as x,b as ne,d as le,c as ce}from"../chunks/CMgxL4rZ.js";import{i as de,b as me,c as pe,M as E,t as ge,l as fe,T as ve,a as ue}from"../chunks/DDvny3ml.js";import M from"../chunks/B7ZOg_ky.js";import{u as r}from"../chunks/Cq-qkr0E.js";import{s as _e}from"../chunks/CcKXLZQU.js";import{t as O}from"../chunks/DsLj0m-e.js";const z=b=>{var m=he(),I=c(m);I.textContent=E,d(m),C(f=>ee(m,"href",f),[()=>ge(E)]),g(b,m)};var he=_('<a target="_blank" class="svelte-jsn2lw"><code class="svelte-jsn2lw"></code></a>'),we=_("<p>Cliquer ou déposer des images ici</p>"),be=_("<section><!> <!></section>"),Ie=_('<section class="loading errored svelte-jsn2lw"><!> <h2 class="svelte-jsn2lw">Oops!</h2> <p class="svelte-jsn2lw">Impossible de charger le modèle de classification</p> <p class="source svelte-jsn2lw"><!></p> <p class="message svelte-jsn2lw"> </p></section>'),ye=_('<section class="loading svelte-jsn2lw"><!> <p>Chargement du modèle de classification</p> <p class="source svelte-jsn2lw"><!></p></section>');function De(b,m){q(m,!0);const I=L(()=>r.previewURLs),f=L(()=>r.erroredImages),y=L(()=>te(u.Image.state,u.Observation.state,{isLoaded:e=>S(e)&&o(I).has(e.id)&&x(e)}));let h=K(void 0);async function G(){Q(h,ae(await fe(!0))),O.success("Modèle de classification chargé")}async function H(e,a,{filename:s,metadata:i}){if(!o(h))return O.error("Modèle de classification non chargé, patentiez ou rechargez la page avant de rééssayer"),0;console.log("Analyzing image",a,s);let n=await de([e],ue,ve);const{x:v,y:p,width:t,height:l}=oe(i.crop.value),k=await me([v,p,t,l],n),T=await pe([[k]],o(h),r,0),B=T[0];if(T[1],T[0].length==0)return console.warn("No species detected"),0;{const[[F,P],...D]=B;await _e({subjectId:a,clade:"species",value:F.toString(),confidence:P,alternatives:D.map(([N,U])=>({value:N.toString(),confidence:U}))})}}j(()=>{r.setSelection&&ie()}),j(()=>{if(o(h))for(const e of u.Image.state)S(e)&&!x(e)&&!r.loadingImages.has(e.id)&&(r.loadingImages.add(e.id),(async()=>{try{const a=await re("ImageFile",ne(e.id));if(!a){console.log("pas de fichier ..?");return}await H(a.bytes,e.id,e)==0&&o(f).set(e.id,"Erreur inattendue l'ors de la classification")}catch(a){console.error(a),o(f).set(e.id,(a==null?void 0:a.toString())??"Erreur inattendue")}finally{r.loadingImages.delete(e.id)}})())}),j(()=>{r.processing.total=u.Image.state.length,r.processing.done=u.Image.state.filter(e=>e.metadata.species).length});var A=W(),R=$(A);X(R,G,e=>{var a=ye(),s=c(a);M(s,{loading:!0});var i=w(s,4),n=c(i);z(n),d(i),d(a),g(e,a)},(e,a)=>{var s=be();let i;var n=c(s);se(n,{get images(){return o(y)},get errors(){return o(f)},loadingText:"Analyse…",ondelete:async t=>{await le(t),await ce(t)},get selection(){return r.selection},set selection(t){r.selection=t}});var v=w(n,2);{var p=t=>{var l=we();g(t,l)};Y(v,t=>{o(y).length||t(p)})}d(s),C(t=>i=Z(s,1,"observations svelte-jsn2lw",null,i,t),[()=>({empty:!o(y).length})]),g(e,s)},(e,a)=>{var s=Ie(),i=c(s);M(i,{variant:"error"});var n=w(i,6),v=c(n);z(v),d(n);var p=w(n,2),t=c(p,!0);d(p),d(s),C(l=>V(t,l),[()=>{var l;return((l=o(a))==null?void 0:l.toString())??"Erreur inattendue"}]),g(e,s)}),g(b,A),J()}export{De as component};
