import{t as g,a as d}from"./DVHRhNjq.js";import{ae as y,c as T,ac as h,a as k,r as z,t as m,af as D}from"./je5hudcr.js";import{d as q,e as u}from"./rhXEw3QH.js";import{i as j}from"./CZpreLed.js";import{s as x}from"./BAGMfwKI.js";import{c as A,a as B}from"./CSTXPE61.js";import{p as F}from"./B3DmaASf.js";var w=(f,e)=>{var l;f.currentTarget.files&&((l=e.onfiles)==null||l.call(e,{event:f,files:[...f.currentTarget.files]}))},C=g('<input type="file" multiple class="svelte-izvmqg">'),E=g('<section role="form"><!> <div class="dragging-overlay svelte-izvmqg"><p>Déposer des images ici…</p></div> <!></section>');function O(f,e){y(e,!0);let l=F(e,"dragging",15,!1);function v(a){var i,o;if(l(!1),!a.dataTransfer)return;a.preventDefault();let t=[];if(a.dataTransfer.items?t=[...a.dataTransfer.items].map(n=>{if(n.kind==="file")return n.getAsFile()}).filter(n=>!!n):t=[...a.dataTransfer.files],e.filetypes&&e.filetypes.length>0&&t.some(n=>!e.filetypes.includes(n.type))){(i=e.onunacceptable)==null||i.call(e,t);return}(o=e.onfiles)==null||o.call(e,{event:a,files:t})}var r=E();let s;var c=T(r);x(c,()=>e.children??h);var _=k(c,4);{var b=a=>{var t=C();t.__input=[w,e],m(i=>B(t,"accept",i),[()=>{var i;return(i=e.filetypes)==null?void 0:i.join(",")}]),d(a,t)};j(_,a=>{e.clickable&&a(b)})}z(r),m(a=>s=A(r,1,"dropzone svelte-izvmqg",null,s,a),[()=>({dragging:l(),clickable:e.clickable})]),u("dragover",r,a=>{a.dataTransfer&&(a.preventDefault(),l(!0))}),u("drop",r,v),d(f,r),D()}q(["input"]);export{O as default};
