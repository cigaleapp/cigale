import{g as n,M as a}from"./C5da3JO5.js";import{a as e}from"./CnQjtwGZ.js";const r=a(()=>e.Settings.state.find(t=>t.id==="user")??e.Settings.state.find(t=>t.id==="defaults"));function d(){return n(r)}async function f(t,s){console.log("setSetting",t,s);const i=await e.Settings.get("user")??await e.Settings.get("defaults");if(!i)throw new Error("Les réglages par défaut n'ont pas été initialisés. Rechargez la page.");return e.Settings.set({...i,id:"user",[t]:s})}export{d as g,f as s};
