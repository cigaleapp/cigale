import{t as _,a as y}from"../chunks/B4fTvO1f.js";import{ag as L,f as j,ah as D,a as M,b as g,s as u,g as o,M as p,c as S,r as k}from"../chunks/C5da3JO5.js";import{p as v}from"../chunks/CY4eTrAl.js";import B from"../chunks/DoFCDMdA.js";import{t as E}from"../chunks/hROWd884.js";import{b as N,t as R,a as U}from"../chunks/WZYaOFm4.js";import V from"../chunks/DYtDzI_j.js";import{t as c,B as w}from"../chunks/DphHNEY8.js";import"../chunks/D4XGVAmU.js";import{s as J}from"../chunks/CVCyVGAR.js";import{u as d}from"../chunks/CfMjFN68.js";var P=_('<!> <section class="observations svelte-72o75x"><!></section>',1);function $(b,C){L(C,!0);let s=u(void 0),r=u("");const x=p(()=>{var e,a;return R(U(((a=(e=c.Image.state.find(t=>t.id===o(r)))==null?void 0:e.metadata.crop)==null?void 0:a.value)??{x:0,y:0}))});function I(e){const a=o(r);console.log(e,"is cropped! at id : ",a);const t=c.Image.state.find(i=>i.id===a);let n=(t==null?void 0:t.metadata.crop)??void 0;if(t!=null&&t.metadata.crop.alternatives&&Object.entries(t.metadata.crop.alternatives).length>0){const[i,T]=Object.entries(t.metadata.crop.alternatives)[0];n={value:JSON.parse(i),confidence:T}}J({metadataId:w.crop,subjectId:a,type:"boundingbox",value:N(e),confidence:1,alternatives:n?[n]:[]})}const h=p(()=>E(c.Image.state,[],{isLoaded:e=>e.bufferExists&&d.previewURLs.has(e.id)}));var m=P(),l=j(m);const A=p(()=>[o(x)]);V(l,{key:"cropping",get id(){return o(r)},get boundingBoxes(){return o(A)},onconfirm:I,get opener(){return o(s)},set opener(e){g(s,v(e))}});var f=M(l,2),O=S(f);B(O,{get images(){return o(h)},loadingText:"Chargement…",oncardclick:e=>{g(r,v(e)),o(s)()},get selection(){return d.selection},set selection(e){d.selection=e}}),k(f),y(b,m),D()}export{$ as component};
