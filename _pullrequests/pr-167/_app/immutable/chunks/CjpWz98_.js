import{a8 as n,g as a}from"./BsWIUf9a.js";import{t as e}from"./CXw_UplO.js";const r=n(()=>e.Settings.state.find(t=>t.id==="user")??e.Settings.state.find(t=>t.id==="defaults"));function u(){return a(r)}async function d(t,s){console.log("setSetting",t,s);const i=await e.Settings.get("user")??await e.Settings.get("defaults");if(!i)throw new Error("Les réglages par défaut n'ont pas été initialisés. Rechargez la page.");return e.Settings.set({...i,id:"user",[t]:s})}export{u as g,d as s};
