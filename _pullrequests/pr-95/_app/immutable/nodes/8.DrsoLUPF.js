import{t as A,a as _}from"../chunks/Bh4UdHfS.js";import{ag as L,f as M,ah as S,a as D,b as v,s as b,g as o,M as p,c as V,r as k}from"../chunks/DvvCRPia.js";import{p as I}from"../chunks/BYruc9P9.js";import B from"../chunks/CZNGFhrC.js";import{t as E}from"../chunks/BvMHHHoh.js";import{b as N,c as P,t as R}from"../chunks/Cctd6H-p.js";import U from"../chunks/BvT52Bud.js";import{u as d,a as m,o as J,B as C}from"../chunks/B4DedOup.js";import"../chunks/BmtddTfD.js";import{d as q,s as z}from"../chunks/D9xbhAoZ.js";var F=A('<!> <section class="observations svelte-72o75x"><!></section>',1);function te(h,x){L(x,!0);let i=b(void 0),n=b("");const y=p(()=>{var e,a;return P(R(((a=(e=m.Image.state.find(t=>t.id===o(n)))==null?void 0:e.metadata.crop)==null?void 0:a.value)??{x:0,y:0}))});async function O(e){const a=o(n);console.log(e,"is cropped! at id : ",a);const t=m.Image.state.find(s=>s.id===a);let c=(t==null?void 0:t.metadata.crop)??void 0;if(t!=null&&t.metadata.crop.alternatives&&Object.entries(t.metadata.crop.alternatives).length>0){const[s,r]=Object.entries(t.metadata.crop.alternatives)[0];c={value:JSON.parse(s),confidence:r}}await J(["Image","Observation"],{},async s=>{var u;const r=await s.objectStore("Image").get(a);r&&((u=r.metadata.species)!=null&&u.confidence&&r.metadata.species.confidence<1&&await q({tx:s,metadataId:C.species,subjectId:a}),await z({tx:s,metadataId:C.crop,subjectId:a,type:"boundingbox",value:N(e),confidence:1,alternatives:c?[c]:[]}))})}const T=p(()=>E(m.Image.state,[],{isLoaded:e=>e.bufferExists&&d.hasPreviewURL(e)}));var l=F(),f=M(l);const j=p(()=>[o(y)]);U(f,{key:"cropping",get id(){return o(n)},get boundingBoxes(){return o(j)},onconfirm:O,get opener(){return o(i)},set opener(e){v(i,I(e))}});var g=D(f,2),w=V(g);B(w,{get images(){return o(T)},loadingText:"Chargement…",oncardclick:e=>{v(n,I(e)),o(i)()},get selection(){return d.selection},set selection(e){d.selection=e}}),k(g),_(h,l),S()}export{te as component};
