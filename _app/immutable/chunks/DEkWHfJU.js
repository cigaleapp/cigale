import{g as n,H as a}from"./Bp-bnYO3.js";import{t as e}from"./Bp5q8Cqy.js";const r=a(()=>e.Settings.state.find(t=>t.id==="user")??e.Settings.state.find(t=>t.id==="defaults"));function u(){return n(r)}async function d(t,i){const s=await e.Settings.get("user")??await e.Settings.get("defaults");if(!s)throw new Error("Les réglages par défaut n'ont pas été initialisés. Rechargez la page.");return e.Settings.set({...s,id:"user",[t]:i})}export{u as g,d as s};
