import{o as f,g as l,u as c,t as m,d as g}from"./Dui9QthG.js";import{m as v}from"./Bu1kXq7H.js";async function I(n){const t=n.map(e=>m.Observation.state.find(a=>a.id===e)).filter(e=>e!==void 0),o=n.map(e=>m.Image.state.find(a=>a.id===e)).filter(e=>e!==void 0),r=new Set(t.flatMap(e=>e.images)).union(new Set(o.map(e=>e.id))),i=l("Observation");return await m.Observation.do(async e=>{e.add({id:i,images:[...r],addedAt:new Date().toISOString(),label:b([...t,...o]),metadataOverrides:Object.fromEntries(Object.entries(await v(t.map(a=>a.metadataOverrides))).map(([a,{value:s,...d}])=>[a,{...d,value:JSON.stringify(s)}]))});for(const{id:a}of t)e.delete(a)}),i}async function w(n,{recursive:t=!1,notFoundOk:o=!0,tx:r=void 0}={}){await f(["Observation","Image","ImageFile","ImagePreviewFile"],{},async i=>{const e=await i.objectStore("Observation").get(n);if(!e){if(o)return;throw"Observation non trouvée"}if(i.objectStore("Observation").delete(n),t)for(const a of e.images)g(a,i,o)})}function b(n){for(const t of n){if("label"in t)return t.label;if("filename"in t)return t.filename.replace(/\.[^.]+$/,"")}return"Nouvelle observation"}async function S(n){await f(["Observation","Image"],{},async t=>{var i,e;const o=await t.objectStore("Image").getAll(),r=await t.objectStore("Observation").getAll();for(const a of o)if(!r.some(s=>s.images.includes(a.id))){const s=l("Observation");t.objectStore("Observation").add({id:s,images:[a.id],addedAt:new Date().toISOString(),label:b([a]),metadataOverrides:{}}),(e=(i=c).setSelection)==null||e.call(i,c.selection.map(d=>d===a.id?s:d))}})}export{w as d,S as e,I as m};
