import{g as n,a8 as a}from"./CfN1TJh4.js";import{t as e}from"./BpZd5GYX.js";const r=a(()=>e.Settings.state.find(t=>t.id==="user")??e.Settings.state.find(t=>t.id==="defaults"));function u(){return n(r)}async function d(t,s){console.log("setSetting",t,s);const i=await e.Settings.get("user")??await e.Settings.get("defaults");if(!i)throw new Error("Les réglages par défaut n'ont pas été initialisés. Rechargez la page.");return e.Settings.set({...i,id:"user",[t]:s})}export{u as g,d as s};
