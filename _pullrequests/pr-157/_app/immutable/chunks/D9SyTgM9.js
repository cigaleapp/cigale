import{i as u,u as p}from"./zaTfszOt.js";import{t as c}from"./DlOYpWUW.js";function b(n,s,{isLoaded:m,previewURL:r,showBoundingBoxes:o}){return r??(r=e=>p.getPreviewURL(e)),o??(o=()=>!0),[...n.filter(({id:e})=>!s.some(a=>a.images.includes(e))).map((e,a)=>{var i;return{image:r(e)??"",title:e.filename,id:e.id,index:a,stacksize:1,loading:m(e)?void 0:-1,boundingBoxes:o(e)&&((i=e.metadata.crop)!=null&&i.value)?[c(e.metadata.crop.value)]:[]}}),...s.map((e,a)=>{var d;const i=n.filter(l=>e.images.includes(l.id)),t=i.find(l=>l.id===e.images.toSorted(u)[0]);return{image:r(t)??"",subimages:e.images.toSorted(u),title:e.label??`Observation ${(t==null?void 0:t.filename)??""}`,index:n.length+a,id:e.id,stacksize:i.length,boundingBoxes:o(t)&&((d=t==null?void 0:t.metadata.crop)!=null&&d.value)?[c(t.metadata.crop.value)]:[],loading:i.every(m)?void 0:-1}})].sort((e,a)=>{const i=t=>{var d;return((d=t.subimages)==null?void 0:d[t.subimages.length-1])??t.id};return u(i(e),i(a))}).map((e,a)=>({...e,index:a}))}export{b as t};
