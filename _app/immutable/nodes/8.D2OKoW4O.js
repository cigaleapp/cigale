import{t as j,a as _}from"../chunks/ZqgaobIy.js";import{a9 as L,f as P,aa as R,a as S,b as v,s as I,g as o,a8 as d,c as T,r as V}from"../chunks/CfN1TJh4.js";import k from"../chunks/-nfVLDee.js";import{t as A}from"../chunks/UFbVMj-y.js";import{f as D,t as E,g as J}from"../chunks/DDy7GkZ0.js";import N from"../chunks/DoAZczw9.js";import{u as a,t as l,o as U}from"../chunks/BX5Gs09y.js";import{d as $,s as q}from"../chunks/C_8W-bru.js";var z=j('<!> <section class="observations svelte-72o75x"><!></section>',1);function Y(b,C){L(C,!0);let c=I(void 0);const M=d(()=>J(a.currentProtocol));let n=I("");const h=d(()=>{var t,s;return o(M)(E(((s=(t=l.Image.state.find(e=>e.id===o(n)))==null?void 0:t.metadata[a.cropMetadataId])==null?void 0:s.value)??{x:0,y:0,w:.5,h:.5}))});async function w(t){const s=o(n);console.log(t,"is cropped! at id : ",s);const e=l.Image.state.find(r=>r.id===s);let p=(e==null?void 0:e.metadata[a.cropMetadataId])??void 0;if(e!=null&&e.metadata[a.cropMetadataId].alternatives&&Object.entries(e.metadata[a.cropMetadataId].alternatives).length>0){const[[r,i]]=Object.entries(e.metadata[a.cropMetadataId].alternatives);p={value:JSON.parse(r),confidence:i}}await U(["Image","Observation"],{},async r=>{const i=await r.objectStore("Image").get(s);if(!i)return;const g=i.metadata[a.classificationMetadataId];g&&!g.manuallyModified&&await $({tx:r,metadataId:a.classificationMetadataId,subjectId:s}),await q({tx:r,metadataId:a.cropMetadataId,subjectId:s,type:"boundingbox",value:D(t),confidence:1,alternatives:p?[p]:[]})})}const x=d(()=>A(l.Image.state,[],{isLoaded:t=>t.bufferExists&&a.hasPreviewURL(t)}));var m=z(),f=P(m);const y=d(()=>[o(h)]);N(f,{key:"cropping",get id(){return o(n)},get boundingBoxes(){return o(y)},onconfirm:w,get opener(){return o(c)},set opener(t){v(c,t,!0)}});var u=S(f,2),O=T(u);k(O,{get images(){return o(x)},loadingText:"Chargement…",oncardclick:t=>{v(n,t,!0),o(c)()},get selection(){return a.selection},set selection(t){a.selection=t}}),V(u),_(b,m),R()}export{Y as component};
