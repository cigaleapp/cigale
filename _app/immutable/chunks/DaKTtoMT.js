import{u as n,i as s}from"./BYhnaSwe.js";import{t as p}from"./Jzq_ufTt.js";function b(r,m,{isLoaded:c,previewURL:o,showBoundingBoxes:l}){return o??(o=t=>n.getPreviewURL(t)),l??(l=()=>!0),[...r.filter(({id:t})=>!m.some(a=>a.images.includes(t))).map((t,a)=>{var d;return{image:o(t)??"",title:t.filename,id:t.id,index:a,stacksize:1,loading:c(t)?void 0:-1,boundingBoxes:l(t)&&((d=t.metadata[n.cropMetadataId])!=null&&d.value)?[p(t.metadata[n.cropMetadataId].value)]:[]}}),...m.map((t,a)=>{var i;const d=r.filter(u=>t.images.includes(u.id)),e=d.find(u=>u.id===t.images.toSorted(s)[0]);return{image:o(e)??"",subimages:t.images.toSorted(s),title:t.label??`Observation ${(e==null?void 0:e.filename)??""}`,index:r.length+a,id:t.id,stacksize:d.length,boundingBoxes:l(e)&&((i=e==null?void 0:e.metadata[n.cropMetadataId])!=null&&i.value)?[p(e.metadata[n.cropMetadataId].value)]:[],loading:d.every(c)?void 0:-1}})].sort((t,a)=>{const d=e=>{var i;return((i=e.subimages)==null?void 0:i[e.subimages.length-1])??e.id};return s(d(t),d(a))}).map((t,a)=>({...t,index:a}))}export{b as t};
