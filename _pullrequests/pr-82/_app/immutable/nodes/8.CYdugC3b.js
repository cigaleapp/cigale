import{t as _,a as y}from"../chunks/Yi9iuJrU.js";import{ag as L,f as j,ah as D,a as M,b as g,s as u,g as o,M as p,c as S,r as k}from"../chunks/QTVBrZQz.js";import{p as v}from"../chunks/DE1d3na4.js";import B from"../chunks/2A1xXXgz.js";import{t as E}from"../chunks/5ilgnhI2.js";import{a as N,b as R,t as U}from"../chunks/CXhtr36u.js";import V from"../chunks/BTCvIZrA.js";import{t as c,B as w}from"../chunks/mB26ZYJI.js";import"../chunks/DF3AhSVV.js";import{s as J}from"../chunks/DsPA9dhD.js";import{u as d}from"../chunks/nkb6GWhH.js";var P=_('<!> <section class="observations svelte-72o75x"><!></section>',1);function $(b,C){L(C,!0);let s=u(void 0),r=u("");const x=p(()=>{var e,a;return R(U(((a=(e=c.Image.state.find(t=>t.id===o(r)))==null?void 0:e.metadata.crop)==null?void 0:a.value)??{x:0,y:0}))});function I(e){const a=o(r);console.log(e,"is cropped! at id : ",a);const t=c.Image.state.find(i=>i.id===a);let n=(t==null?void 0:t.metadata.crop)??void 0;if(t!=null&&t.metadata.crop.alternatives&&Object.entries(t.metadata.crop.alternatives).length>0){const[i,T]=Object.entries(t.metadata.crop.alternatives)[0];n={value:JSON.parse(i),confidence:T}}J({metadataId:w.crop,subjectId:a,type:"boundingbox",value:N(e),confidence:1,alternatives:n?[n]:[]})}const h=p(()=>E(c.Image.state,[],{isLoaded:e=>e.bufferExists&&d.previewURLs.has(e.id)}));var m=P(),l=j(m);const A=p(()=>[o(x)]);V(l,{key:"cropping",get id(){return o(r)},get boundingBoxes(){return o(A)},onconfirm:I,get opener(){return o(s)},set opener(e){g(s,v(e))}});var f=M(l,2),O=S(f);B(O,{get images(){return o(h)},loadingText:"Chargement…",oncardclick:e=>{g(r,v(e)),o(s)()},get selection(){return d.selection},set selection(e){d.selection=e}}),k(f),y(b,m),D()}export{$ as component};
