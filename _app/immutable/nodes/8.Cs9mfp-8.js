import{t as w,a as y}from"../chunks/Dg_JGDnQ.js";import{ac as A,s as v,ab as d,f as L,ad as S,a as D,g as o,b,c as M,r as V}from"../chunks/ypqVbSJJ.js";import k from"../chunks/CsIV7uXl.js";import{t as B}from"../chunks/Di6ak5cG.js";import{b as E,t as N,c as P}from"../chunks/D3i69cwA.js";import R from"../chunks/BkzPQsVX.js";import{t as p,u as m,o as U,B as I}from"../chunks/Bz7iNXXt.js";import"../chunks/Ctig8wqH.js";import{d as J,s as q}from"../chunks/ZvC0JF4m.js";var z=w('<!> <section class="observations svelte-72o75x"><!></section>',1);function $(C,h){A(h,!0);let i=v(void 0),n=v("");const x=d(()=>{var e,a;return E(N(((a=(e=p.Image.state.find(t=>t.id===o(n)))==null?void 0:e.metadata.crop)==null?void 0:a.value)??{x:0,y:0}))});async function O(e){const a=o(n);console.log(e,"is cropped! at id : ",a);const t=p.Image.state.find(s=>s.id===a);let c=(t==null?void 0:t.metadata.crop)??void 0;if(t!=null&&t.metadata.crop.alternatives&&Object.entries(t.metadata.crop.alternatives).length>0){const[s,r]=Object.entries(t.metadata.crop.alternatives)[0];c={value:JSON.parse(s),confidence:r}}await U(["Image","Observation"],{},async s=>{var g;const r=await s.objectStore("Image").get(a);r&&((g=r.metadata.species)!=null&&g.confidence&&r.metadata.species.confidence<1&&await J({tx:s,metadataId:I.species,subjectId:a}),await q({tx:s,metadataId:I.crop,subjectId:a,type:"boundingbox",value:P(e),confidence:1,alternatives:c?[c]:[]}))})}const T=d(()=>B(p.Image.state,[],{isLoaded:e=>e.bufferExists&&m.hasPreviewURL(e)}));var l=z(),f=L(l);const _=d(()=>[o(x)]);R(f,{key:"cropping",get id(){return o(n)},get boundingBoxes(){return o(_)},onconfirm:O,get opener(){return o(i)},set opener(e){b(i,e,!0)}});var u=D(f,2),j=M(u);k(j,{get images(){return o(T)},loadingText:"Chargement…",oncardclick:e=>{b(n,e,!0),o(i)()},get selection(){return m.selection},set selection(e){m.selection=e}}),V(u),y(C,l),S()}export{$ as component};
