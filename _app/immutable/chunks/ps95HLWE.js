import{ad as n,g as a}from"./je5hudcr.js";import{t as e}from"./D9tE2mPo.js";const r=n(()=>e.Settings.state.find(t=>t.id==="user")??e.Settings.state.find(t=>t.id==="defaults"));function d(){return a(r)}async function u(t,s){console.log("setSetting",t,s);const i=await e.Settings.get("user")??await e.Settings.get("defaults");if(!i)throw new Error("Les réglages par défaut n'ont pas été initialisés. Rechargez la page.");return e.Settings.set({...i,id:"user",[t]:s})}export{d as g,u as s};
