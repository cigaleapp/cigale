import{u}from"./BXkCq4b2.js";import{t as p}from"./CXhtr36u.js";import{i as r}from"./DpDfwQNo.js";function g(o,s,{isLoaded:l}){return[...o.filter(({id:e})=>!s.some(i=>i.images.includes(e))).map((e,i)=>{var a;return{image:u.previewURLs.get(e.id)??"",title:e.filename,id:e.id,index:i,stacksize:1,loading:l(e)?void 0:-1,boundingBoxes:(a=e.metadata.crop)!=null&&a.value?[p(e.metadata.crop.value)]:[]}}),...s.map((e,i)=>{var d;const a=o.filter(n=>e.images.includes(n.id)),t=a.find(n=>n.id===e.images.toSorted(r)[0]);return{image:u.previewURLs.get((t==null?void 0:t.id)??"")??"",subimages:e.images.toSorted(r),title:e.label??`Observation ${(t==null?void 0:t.filename)??""}`,index:o.length+i,id:e.id,stacksize:a.length,boundingBoxes:(d=t==null?void 0:t.metadata.crop)!=null&&d.value?[p(t.metadata.crop.value)]:[],loading:a.every(l)?void 0:-1}})].sort((e,i)=>{const a=t=>{var d;return((d=t.subimages)==null?void 0:d[t.subimages.length-1])??t.id};return r(a(e),a(i))}).map((e,i)=>({...e,index:i}))}export{g as t};
