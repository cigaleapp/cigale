import{t as j,a as _}from"../chunks/C2IogcR0.js";import{a9 as L,s as v,a8 as d,f as P,aa as R,a as S,g as o,b as I,c as T,r as V}from"../chunks/BsWIUf9a.js";import k from"../chunks/BFXN--mb.js";import{t as A}from"../chunks/3LAU9khV.js";import{f as D,t as E,g as J}from"../chunks/BntSFuIX.js";import N from"../chunks/DSKDti1u.js";import{u as t,t as l,o as U}from"../chunks/64b2i2KL.js";import{d as $,s as q}from"../chunks/BjN2kW9_.js";var z=j('<!> <section class="observations svelte-72o75x"><!></section>',1);function Y(b,C){L(C,!0);let c=v(void 0);const M=d(()=>D(t.currentProtocol));let n=v("");const h=d(()=>{var e,s;return o(M)(E(((s=(e=l.Image.state.find(a=>a.id===o(n)))==null?void 0:e.metadata[t.cropMetadataId])==null?void 0:s.value)??{x:0,y:0,w:.5,h:.5}))});async function w(e){const s=o(n);console.log(e,"is cropped! at id : ",s);const a=l.Image.state.find(r=>r.id===s);let p=(a==null?void 0:a.metadata[t.cropMetadataId])??void 0;if(a!=null&&a.metadata[t.cropMetadataId].alternatives&&Object.entries(a.metadata[t.cropMetadataId].alternatives).length>0){const[[r,i]]=Object.entries(a.metadata[t.cropMetadataId].alternatives);p={value:JSON.parse(r),confidence:i}}await U(["Image","Observation"],{},async r=>{const i=await r.objectStore("Image").get(s);if(!i)return;const g=i.metadata[t.classificationMetadataId];g&&!g.manuallyModified&&await $({tx:r,metadataId:t.classificationMetadataId,subjectId:s}),await q({tx:r,metadataId:t.cropMetadataId,subjectId:s,type:"boundingbox",value:J(e),confidence:1,alternatives:p?[p]:[]})})}const x=d(()=>A(l.Image.state,[],{isLoaded:e=>e.bufferExists&&t.hasPreviewURL(e)}));var m=z(),f=P(m);const y=d(()=>[o(h)]);N(f,{key:"cropping",get id(){return o(n)},get boundingBoxes(){return o(y)},onconfirm:w,get opener(){return o(c)},set opener(e){I(c,e,!0)}});var u=S(f,2),O=T(u);k(O,{get images(){return o(x)},loadingText:"Chargement…",oncardclick:e=>{I(n,e,!0),o(c)()},get selection(){return t.selection},set selection(e){t.selection=e}}),V(u),_(b,m),R()}export{Y as component};
