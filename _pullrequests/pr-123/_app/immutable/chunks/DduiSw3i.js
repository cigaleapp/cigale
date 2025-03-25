import{n as S,a as $,t as X,b as H}from"./DVHRhNjq.js";import{_ as W,E as Y,aO as aa,aP as ta,P as ea,D as ra,aQ as sa,aR as ia,aS as oa,as as na,q as ca,ac as k,v as z,u as U,aH as va,t as x,ae as fa,ad as j,c as F,g as I,r as C,a as N,af as la,ag as Z}from"./je5hudcr.js";import{j as da,w as ua,d as _a,s as L}from"./rhXEw3QH.js";import{i as D}from"./CZpreLed.js";import{c as pa}from"./C2lpXYXW.js";import{s as q,b as ma}from"./CSTXPE61.js";import{r as O}from"./B3DmaASf.js";import{C as ha}from"./NdHm-8Nh.js";import{X as G}from"./Gm9Ge_ip.js";import K from"./BNf-FgPz.js";const ga=()=>performance.now(),y={tick:t=>requestAnimationFrame(t),now:()=>ga(),tasks:new Set};function J(){const t=y.now();y.tasks.forEach(a=>{a.c(t)||(y.tasks.delete(a),a.f())}),y.tasks.size!==0&&y.tick(J)}function ba(t){let a;return y.tasks.size===0&&y.tick(J),{promise:new Promise(r=>{y.tasks.add(a={c:t,f:r})}),abort(){y.tasks.delete(a)}}}function A(t,a){ua(()=>{t.dispatchEvent(new CustomEvent(a))})}function ya(t){if(t==="float")return"cssFloat";if(t==="offset")return"cssOffset";if(t.startsWith("--"))return t;const a=t.split("-");return a.length===1?a[0]:a[0]+a.slice(1).map(r=>r[0].toUpperCase()+r.slice(1)).join("")}function Q(t){const a={},r=t.split(";");for(const s of r){const[e,n]=s.split(":");if(!e||n===void 0)break;const u=ya(e.trim());a[u]=n.trim()}return a}const wa=t=>t;function V(t,a,r,s){var e=(t&ia)!==0,n=(t&oa)!==0,u=e&&n,m=(t&sa)!==0,g=u?"both":e?"in":"out",d,c=a.inert,b=a.style.overflow,l,f;function h(){var v=va,w=W;z(null),U(null);try{return d??(d=r()(a,(s==null?void 0:s())??{},{direction:g}))}finally{z(v),U(w)}}var _={is_global:m,in(){var v;if(a.inert=c,!e){f==null||f.abort(),(v=f==null?void 0:f.reset)==null||v.call(f);return}n||l==null||l.abort(),A(a,"introstart"),l=M(a,h(),f,1,()=>{A(a,"introend"),l==null||l.abort(),l=d=void 0,a.style.overflow=b})},out(v){if(!n){v==null||v(),d=void 0;return}a.inert=!0,A(a,"outrostart"),f=M(a,h(),l,0,()=>{A(a,"outroend"),v==null||v()})},stop:()=>{l==null||l.abort(),f==null||f.abort()}},o=W;if((o.transitions??(o.transitions=[])).push(_),e&&da){var i=m;if(!i){for(var p=o.parent;p&&(p.f&Y)!==0;)for(;(p=p.parent)&&(p.f&aa)===0;);i=!p||(p.f&ta)!==0}i&&ea(()=>{ra(()=>_.in())})}}function M(t,a,r,s,e){var n=s===1;if(na(a)){var u,m=!1;return ca(()=>{if(!m){var o=a({direction:n?"in":"out"});u=M(t,o,r,s,e)}}),{abort:()=>{m=!0,u==null||u.abort()},deactivate:()=>u.deactivate(),reset:()=>u.reset(),t:()=>u.t()}}if(r==null||r.deactivate(),!(a!=null&&a.duration))return e(),{abort:k,deactivate:k,reset:k,t:()=>s};const{delay:g=0,css:d,tick:c,easing:b=wa}=a;var l=[];if(n&&r===void 0&&(c&&c(0,1),d)){var f=Q(d(0,1));l.push(f,f)}var h=()=>1-s,_=t.animate(l,{duration:g});return _.onfinish=()=>{var o=(r==null?void 0:r.t())??1-s;r==null||r.abort();var i=s-o,p=a.duration*Math.abs(i),v=[];if(p>0){var w=!1;if(d)for(var B=Math.ceil(p/16.666666666666668),E=0;E<=B;E+=1){var R=o+i*b(E/B),P=Q(d(R,1-R));v.push(P),w||(w=P.overflow==="hidden")}w&&(t.style.overflow="hidden"),h=()=>{var T=_.currentTime;return o+i*b(T/p)},c&&ba(()=>{if(_.playState!=="running")return!1;var T=h();return c(T,1-T),!0})}_=t.animate(v,{duration:p,fill:"forwards"}),_.onfinish=()=>{h=()=>s,c==null||c(s,1-s),e()}},{abort:()=>{_&&(_.cancel(),_.effect=null,_.onfinish=k)},deactivate:()=>{e=k},reset:()=>{s===0&&(c==null||c(1,0))},t:()=>h()}}var $a=S('<svg><path fill="currentColor" d="M144 92a12 12 0 1 1 12 12a12 12 0 0 1-12-12m-44-12a12 12 0 1 0 12 12a12 12 0 0 0-12-12m116 64a87.8 87.8 0 0 1-3 23l22.24 9.72A8 8 0 0 1 232 192a7.9 7.9 0 0 1-3.2-.67L207.38 182a88 88 0 0 1-158.76 0l-21.42 9.33a7.9 7.9 0 0 1-3.2.67a8 8 0 0 1-3.2-15.33L43 167a87.8 87.8 0 0 1-3-23v-8H16a8 8 0 0 1 0-16h24v-8a87.8 87.8 0 0 1 3-23l-22.2-9.67a8 8 0 1 1 6.4-14.66L48.62 74a88 88 0 0 1 158.76 0l21.42-9.36a8 8 0 0 1 6.4 14.66L213 89.05a87.8 87.8 0 0 1 3 23v8h24a8 8 0 0 1 0 16h-24ZM56 120h144v-8a72 72 0 0 0-144 0Zm64 95.54V136H56v8a72.08 72.08 0 0 0 64 71.54M200 144v-8h-64v79.54A72.08 72.08 0 0 0 200 144"></path></svg>');function xa(t,a){const r=O(a,["$$slots","$$events","$$legacy"]);var s=$a();let e;x(()=>e=q(s,e,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...r})),$(t,s)}var ka=S('<svg><path fill="currentColor" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m0 192a88 88 0 1 1 88-88a88.1 88.1 0 0 1-88 88m16-40a8 8 0 0 1-8 8a16 16 0 0 1-16-16v-40a8 8 0 0 1 0-16a16 16 0 0 1 16 16v40a8 8 0 0 1 8 8m-32-92a12 12 0 1 1 12 12a12 12 0 0 1-12-12"></path></svg>');function Fa(t,a){const r=O(a,["$$slots","$$events","$$legacy"]);var s=ka();let e;x(()=>e=q(s,e,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...r})),$(t,s)}var Ca=S('<svg><path fill="currentColor" d="M236.8 188.09L149.35 36.22a24.76 24.76 0 0 0-42.7 0L19.2 188.09a23.51 23.51 0 0 0 0 23.72A24.35 24.35 0 0 0 40.55 224h174.9a24.35 24.35 0 0 0 21.33-12.19a23.51 23.51 0 0 0 .02-23.72m-13.87 15.71a8.5 8.5 0 0 1-7.48 4.2H40.55a8.5 8.5 0 0 1-7.48-4.2a7.59 7.59 0 0 1 0-7.72l87.45-151.87a8.75 8.75 0 0 1 15 0l87.45 151.87a7.59 7.59 0 0 1-.04 7.72M120 144v-40a8 8 0 0 1 16 0v40a8 8 0 0 1-16 0m20 36a12 12 0 1 1-12-12a12 12 0 0 1 12 12"></path></svg>');function Ta(t,a){const r=O(a,["$$slots","$$events","$$legacy"]);var s=Ca();let e;x(()=>e=q(s,e,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...r})),$(t,s)}const Aa=t=>t;function Ea(t){const a=t-1;return a*a*a+1}function Ia(t,{delay:a=0,duration:r=400,easing:s=Aa}={}){const e=+getComputedStyle(t).opacity;return{delay:a,duration:r,easing:s,css:n=>`opacity: ${n*e}`}}function Na(t,{delay:a=0,duration:r=400,easing:s=Ea,axis:e="y"}={}){const n=getComputedStyle(t),u=+n.opacity,m=e==="y"?"height":"width",g=parseFloat(n[m]),d=e==="y"?["top","bottom"]:["left","right"],c=d.map(i=>`${i[0].toUpperCase()}${i.slice(1)}`),b=parseFloat(n[`padding${c[0]}`]),l=parseFloat(n[`padding${c[1]}`]),f=parseFloat(n[`margin${c[0]}`]),h=parseFloat(n[`margin${c[1]}`]),_=parseFloat(n[`border${c[0]}Width`]),o=parseFloat(n[`border${c[1]}Width`]);return{delay:a,duration:r,easing:s,css:i=>`overflow: hidden;opacity: ${Math.min(i*20,1)*u};${m}: ${i*g}px;padding-${d[0]}: ${i*b}px;padding-${d[1]}: ${i*l}px;margin-${d[0]}: ${i*f}px;margin-${d[1]}: ${i*h}px;border-${d[0]}-width: ${i*_}px;border-${d[1]}-width: ${i*o}px;min-${m}: 0`}}var La=X('<button class="svelte-154bf1q"><!></button>'),Ma=X('<article class="toast svelte-154bf1q"><div class="icon svelte-154bf1q"><!></div> <p class="svelte-154bf1q"> </p> <section class="actions svelte-154bf1q"><!> <!></section></article>');function ja(t,a){fa(a,!0);const r=j(()=>({warning:Ta,error:G,success:ha,info:Fa,debug:xa})[a.type]),s=j(()=>{switch(a.type){case"debug":return"neutral";case"info":return"primary";default:return a.type}});var e=Ma();let n;var u=F(e),m=F(u);pa(m,()=>I(r),(o,i)=>{i(o,{})}),C(u);var g=N(u,2),d=F(g,!0);C(g);var c=N(g,2),b=F(c);{var l=o=>{K(o,{get onclick(){return a.onaction},children:(i,p)=>{Z();var v=H();x(()=>L(v,a.action)),$(i,v)}})};D(b,o=>{a.action&&a.onaction&&o(l)})}var f=N(b,2);{var h=o=>{K(o,{get onclick(){return a.ondismiss},children:(i,p)=>{Z();var v=H();x(()=>L(v,a.dismiss)),$(i,v)}})},_=o=>{var i=La();i.__click=function(...v){var w;(w=a.ondismiss)==null||w.apply(this,v)};var p=F(i);G(p,{}),C(i),$(o,i)};D(f,o=>{a.dismiss?o(h):o(_,!1)})}C(c),C(e),x(()=>{n=ma(e,"",n,{"--bg":`var(--bg-${I(s)??""})`,"--fg":`var(--fg-${I(s)??""})`}),L(d,a.message)}),V(1,e,()=>Na,()=>({axis:"y",duration:200})),V(2,e,()=>Ia,()=>({duration:200})),$(t,e),la()}_a(["click"]);export{ja as default};
