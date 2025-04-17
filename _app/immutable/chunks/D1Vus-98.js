const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./CEHPO5mC.js","./BsWIUf9a.js","./BgKMa18u.js","./C1FmrZbK.js","./D4qr2s0I.js"])))=>i.map(i=>d[i]);
import{_ as p}from"./C1FmrZbK.js";import{S as m,Y as f,s as h,a as w}from"./CEHPO5mC.js";function _(t){return`${window.location.origin}${t}/protocol.schema.json`}function b(t,e){return e=e.replace(/^.+__/,""),`${t}__${e}`}function E(t,e){return e.startsWith(`${t}__`)}function g(t){return t.replace(/^.+__/,"")}const d=m.ProtocolWithoutMetadata.in.and({metadata:{"[string]":m.MetadataWithoutID.describe("Métadonnée du protocole")}}).pipe(t=>({...t,metadata:Object.fromEntries(Object.entries(t.metadata).map(([e,a])=>[b(t.id,e),a]))}));async function M(t,e,a="json"){const{tables:n}=await p(async()=>{const{tables:o}=await import("./CEHPO5mC.js").then(r=>r.T);return{tables:o}},__vite__mapDeps([0,1,2,3,4]),import.meta.url),i=await n.Protocol.raw.get(e);if(!i)throw new Error(`Protocole ${e} introuvable`);u(t,a,{...i,metadata:Object.fromEntries(await n.Metadata.list().then(o=>o.filter(r=>i==null?void 0:i.metadata.includes(r.id)).map(({id:r,...s})=>[r,s])))})}async function O(t,e){u(t,e,{id:"mon-protocole",name:"Mon protocole",source:"https://github.com/moi/mon-protocole",authors:[{name:"Prénom Nom",email:"prenom.nom@example.com"}],description:"Description de mon protocole",metadata:{"une-metadonnee":{label:"Une métadonnée",description:"Description de la métadonnée",learnMore:"https://example.com",type:"float",required:!1,mergeMethod:"average"}}})}function u(t,e,a){let n=h(e,_(t),a,["id","name","source","authors","exports","metadata","inference"]);w(n,`${a.id}.${e}`,`application/${e}`)}async function T({allowMultiple:t}={}){return new Promise((e,a)=>{const n=document.createElement("input");n.type="file",n.multiple=t??!1,n.accept=[".json",".yaml","application/json"].join(","),n.onchange=async()=>{if(!n.files||!n.files[0])return;const i=await Promise.all([...n.files].map(async o=>{const r=new FileReader;return new Promise(s=>{r.onload=async()=>{if(!r.result)throw new Error("Fichier vide");if(r.result instanceof ArrayBuffer)throw new Error("Fichier binaire");P(r.result).then(s).catch(c=>{var l;return a(new Error(`Protocole invalide: ${((l=c==null?void 0:c.toString())==null?void 0:l.replace(/^Traversal Error: /,""))??"Erreur inattendue"}`))})},r.readAsText(o)})}));e(t?i:i[0])},n.click()})}async function P(t){const{openTransaction:e}=await p(async()=>{const{openTransaction:o}=await import("./CEHPO5mC.js").then(r=>r.T);return{openTransaction:o}},__vite__mapDeps([0,1,2,3,4]),import.meta.url);let a=f.parse(t);console.info(`Importing protocol ${a.id}`),console.info(a);const n=Object.entries(a.metadata??{}).filter(([,o])=>o==="builtin").map(([o])=>o);a.metadata=Object.fromEntries(Object.entries(a.metadata??{}).filter(([,o])=>o!=="builtin"));const i=d.in.assert(a);return await e(["Protocol","Metadata"],{},o=>{o.objectStore("Protocol").put({...i,metadata:[...Object.keys(i.metadata),...n]}),Object.entries(i.metadata).map(([r,s])=>typeof s=="string"||o.objectStore("Metadata").put({id:r,...s}))}),d.assert(i)}export{P as a,O as d,M as e,E as i,_ as j,T as p,g as r};
