import{t as _,a as y}from"../chunks/Yi9iuJrU.js";import{ag as L,f as j,ah as D,a as M,b as g,s as u,g as a,M as p,c as S,r as k}from"../chunks/QTVBrZQz.js";import{p as v}from"../chunks/DE1d3na4.js";import B from"../chunks/Cqi72FHu.js";import{t as E}from"../chunks/D1pJG42g.js";import{a as N,b as P,t as R}from"../chunks/4isvWXcf.js";import U from"../chunks/DHg7WEMW.js";import{u as c,t as d,B as V}from"../chunks/kK7snVmK.js";import"../chunks/DY08AJR4.js";import{s as w}from"../chunks/CH408cX2.js";var J=_('<!> <section class="observations svelte-72o75x"><!></section>',1);function Z(b,C){L(C,!0);let s=u(void 0),r=u("");const x=p(()=>{var e,o;return P(R(((o=(e=d.Image.state.find(t=>t.id===a(r)))==null?void 0:e.metadata.crop)==null?void 0:o.value)??{x:0,y:0}))});function I(e){const o=a(r);console.log(e,"is cropped! at id : ",o);const t=d.Image.state.find(i=>i.id===o);let n=(t==null?void 0:t.metadata.crop)??void 0;if(t!=null&&t.metadata.crop.alternatives&&Object.entries(t.metadata.crop.alternatives).length>0){const[i,T]=Object.entries(t.metadata.crop.alternatives)[0];n={value:JSON.parse(i),confidence:T}}w({metadataId:V.crop,subjectId:o,type:"boundingbox",value:N(e),confidence:1,alternatives:n?[n]:[]})}const h=p(()=>E(d.Image.state,[],{isLoaded:e=>e.bufferExists&&c.hasPreviewURL(e)}));var m=J(),l=j(m);const A=p(()=>[a(x)]);U(l,{key:"cropping",get id(){return a(r)},get boundingBoxes(){return a(A)},onconfirm:I,get opener(){return a(s)},set opener(e){g(s,v(e))}});var f=M(l,2),O=S(f);B(O,{get images(){return a(h)},loadingText:"Chargement…",oncardclick:e=>{g(r,v(e)),a(s)()},get selection(){return c.selection},set selection(e){c.selection=e}}),k(f),y(b,m),D()}export{Z as component};
