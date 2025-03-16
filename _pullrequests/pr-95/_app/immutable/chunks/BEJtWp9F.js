import{t as a,B as e,o as T}from"./CnQjtwGZ.js";import{s as p,l as h,k as u}from"./FVd3uxdF.js";import{b as A}from"./Hef_2wRC.js";const b=a({gbifId:"number.integer","gbifBackboneId?":"number.integer",kingdom:"string",phylum:"string",order:"string",family:"string",species:"string",genus:"string",accepted:"boolean","notAcceptedWhy?":a.enumerated("DOUBTFUL","SYNONYM","HETEROTYPIC_SYNONYM","HOMOTYPIC_SYNONYM","PROPARTE_SYNONYM","MISAPPLIED")}),w=a({items:b.array(),phyla:a({"[string]":"string"}).describe("phyla -> kingdoms"),orders:a({"[string]":"string"}).describe("orders -> phyla"),families:a({"[string]":"string"}).describe("families -> orders"),genera:a({"[string]":"string"}).describe("genera -> families"),species:a({"[string]":"string"}).describe("species -> genera")}),y=[e.kingdom,e.phylum,e.order,e.family,e.genus,e.species],E={[e.kingdom]:"kingdom",[e.phylum]:"phyla",[e.order]:"orders",[e.family]:"families",[e.genus]:"genera",[e.species]:"species"};a.enumerated(...y);let r={species:{},phyla:{},orders:{},families:{},genera:{},items:[]};async function O({subjectId:i,clade:n,value:s,confidence:d,alternatives:c,tx:l}){await I(),console.log(`Setting taxon on ${i}: ${n} = ${s}`),await T(["Image","Observation"],{tx:l},async t=>{if(n==="kingdom")return p({tx:t,subjectId:i,metadataId:e.kingdom,value:s,confidence:d,alternatives:c});await p({tx:t,subjectId:i,metadataId:n,value:s,confidence:d,alternatives:c});const o=y[y.indexOf(n)-1],m=await h(n,s);if(!m)throw new Error(`No ${n} with key ${s} in taxonomy`);const g=r[E[n]][m];if(!g)throw new Error(`${m} has no ${o} in taxonomy`);const f=await u(o,g);if(!f)throw new Error(`${g} not found in taxonomy`);return O({tx:t,subjectId:i,clade:o,value:f})})}async function I(){Object.keys(r).length===0&&await k()}async function k(){const i=await fetch(`${A}/taxonomy.json`).then(n=>n.json());return r=w.assert(i),r}export{y as C,k as i,O as s};
