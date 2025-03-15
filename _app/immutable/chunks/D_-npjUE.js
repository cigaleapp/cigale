import{o as d,b as g,t as f}from"./Cmc3N3Ia.js";import{u as s}from"./CfMjFN68.js";import{m as u}from"./MZBHwYAq.js";function w(e,t=0){return`${Number.parseInt(e.toString(),0).toString().padStart(6,"0")}_${t.toString().padStart(6,"0")}`}function l(e){return e.replace(/(_\d+)+$/,"")}function O(e){return!!(e.metadata.crop||s.erroredImages.has(e.id))}function j(e){return!!(e.metadata.species||s.erroredImages.has(e.id))}function y(e){return!!(e.bufferExists||s.erroredImages.has(e.id))}async function I(e,t,r=!0){await d(["Image","ImageFile"],{tx:t},async i=>{if(!await i.objectStore("Image").get(e)){if(r)return;throw"Image non trouvée"}i.objectStore("Image").delete(e),i.objectStore("ImageFile").delete(l(e));const a=s.previewURLs.get(e);a&&(URL.revokeObjectURL(a),s.previewURLs.delete(e))})}async function L(e,t,r,i){await d(["Image","ImageFile"],{tx:i},async n=>{const a=await n.objectStore("Image").get(e);if(!a)throw"Image non trouvée";n.objectStore("ImageFile").put({id:l(e),bytes:t});const o=new Blob([t],{type:r});s.previewURLs.set(e,URL.createObjectURL(o)),n.objectStore("Image").put({...a,bufferExists:!0})})}async function R(e){const t=e.map(a=>f.Observation.state.find(o=>o.id===a)).filter(a=>a!==void 0),r=e.map(a=>f.Image.state.find(o=>o.id===a)).filter(a=>a!==void 0),i=new Set(t.flatMap(a=>a.images)).union(new Set(r.map(a=>a.id))),n=g("Observation");return await f.Observation.do(async a=>{a.add({id:n,images:[...i],addedAt:new Date().toISOString(),label:b([...t,...r]),metadataOverrides:Object.fromEntries(Object.entries(await u(t.map(o=>o.metadataOverrides))).map(([o,{value:m,...c}])=>[o,{...c,value:JSON.stringify(m)}]))});for(const{id:o}of t)a.delete(o)}),n}async function U(e,{recursive:t=!1,notFoundOk:r=!0,tx:i=void 0}={}){await d(["Observation","Image","ImageFile"],{tx:i},async n=>{const a=await n.objectStore("Observation").get(e);if(!a){if(r)return;throw"Observation non trouvée"}if(n.objectStore("Observation").delete(e),t)for(const o of a.images)I(o,n,r)})}function b(e){for(const t of e){if("label"in t)return t.label;if("filename"in t)return t.filename.replace(/\.[^.]+$/,"")}return"Nouvelle observation"}async function h(e){await d(["Observation","Image"],{tx:e},async t=>{var n,a;const r=await t.objectStore("Image").getAll(),i=await t.objectStore("Observation").getAll();for(const o of r)if(!i.some(m=>m.images.includes(o.id))){const m=g("Observation");t.objectStore("Observation").add({id:m,images:[o.id],addedAt:new Date().toISOString(),label:b([o]),metadataOverrides:{}}),(a=(n=s).setSelection)==null||a.call(n,s.selection.map(c=>c===o.id?m:c))}})}export{j as a,l as b,I as c,U as d,h as e,O as f,w as g,y as i,R as m,L as s};
