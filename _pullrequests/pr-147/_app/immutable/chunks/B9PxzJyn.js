import{o as f,g as l,u as c,t as m,d as g}from"./CpEDwUPR.js";import{m as v}from"./fO1ZQ8d2.js";async function I(i){const t=i.map(e=>m.Observation.state.find(a=>a.id===e)).filter(e=>e!==void 0),o=i.map(e=>m.Image.state.find(a=>a.id===e)).filter(e=>e!==void 0),r=new Set(t.flatMap(e=>e.images)).union(new Set(o.map(e=>e.id))),n=l("Observation");return await m.Observation.do(async e=>{e.add({id:n,images:[...r],addedAt:new Date().toISOString(),label:b([...t,...o]),metadataOverrides:Object.fromEntries(Object.entries(await v(t.map(a=>a.metadataOverrides))).map(([a,{value:s,...d}])=>[a,{...d,value:JSON.stringify(s)}]))});for(const{id:a}of t)e.delete(a)}),n}async function w(i,{recursive:t=!1,notFoundOk:o=!0,tx:r=void 0}={}){await f(["Observation","Image","ImageFile","ImagePreviewFile"],{tx:r},async n=>{const e=await n.objectStore("Observation").get(i);if(!e){if(o)return;throw"Observation non trouvée"}if(n.objectStore("Observation").delete(i),t)for(const a of e.images)g(a,n,o)})}function b(i){for(const t of i){if("label"in t)return t.label;if("filename"in t)return t.filename.replace(/\.[^.]+$/,"")}return"Nouvelle observation"}async function S(i){await f(["Observation","Image"],{tx:i},async t=>{var n,e;const o=await t.objectStore("Image").getAll(),r=await t.objectStore("Observation").getAll();for(const a of o)if(!r.some(s=>s.images.includes(a.id))){const s=l("Observation");t.objectStore("Observation").add({id:s,images:[a.id],addedAt:new Date().toISOString(),label:b([a]),metadataOverrides:{}}),(e=(n=c).setSelection)==null||e.call(n,c.selection.map(d=>d===a.id?s:d))}})}export{w as d,S as e,I as m};
