import{u}from"./DNAod6UB.js";import{t as p,a as m}from"./goSH3dgy.js";import{i as r}from"./DeT_GI9d.js";function v(d,s,{isLoaded:l}){return[...d.filter(({id:e})=>!s.some(i=>i.images.includes(e))).map((e,i)=>{var a;return{image:u.previewURLs.get(e.id)??"",title:e.filename,id:e.id,index:i,stacksize:1,loading:l(e)?void 0:-1,boundingBoxes:(a=e.metadata.crop)!=null&&a.value?[p(m(e.metadata.crop.value))]:[]}}),...s.map((e,i)=>{var o;const a=d.filter(n=>e.images.includes(n.id)),t=a.find(n=>n.id===e.images.toSorted(r)[0]);return{image:u.previewURLs.get((t==null?void 0:t.id)??"")??"",subimages:e.images.toSorted(r),title:e.label??`Observation ${(t==null?void 0:t.filename)??""}`,index:d.length+i,id:e.id,stacksize:a.length,boundingBoxes:(o=t==null?void 0:t.metadata.crop)!=null&&o.value?[p(m(t.metadata.crop.value))]:[],loading:a.every(l)?void 0:-1}})].sort((e,i)=>{const a=t=>{var o;return((o=t.subimages)==null?void 0:o[t.subimages.length-1])??t.id};return r(a(e),a(i))}).map((e,i)=>({...e,index:i}))}export{v as t};
