import{n as A,a as l,t as w,c as lt,b as U}from"./DVHRhNjq.js";import{t as q,ae as rt,c as O,r as P,af as st,ad as W,g as X,f as Y,a as Z,ag as dt}from"./je5hudcr.js";import{e as p}from"./rhXEw3QH.js";import{i as x}from"./CZpreLed.js";import{a as ot,t as ut}from"./DDmqFdpi.js";import{s as G,r as I,a as J,d as vt}from"./CSTXPE61.js";import{b as z}from"./m64OIgX8.js";import{r as K,p as $}from"./B3DmaASf.js";import ft from"./CBcQjJce.js";import{i as y,f as ct}from"./BkMEr8z_.js";import mt from"./5crReVnA.js";import{q as gt,r as bt}from"./BUKRFr_1.js";var _t=A('<svg><path fill="currentColor" d="M224 128a8 8 0 0 1-8 8h-80v80a8 8 0 0 1-16 0v-80H40a8 8 0 0 1 0-16h80V40a8 8 0 0 1 16 0v80h80a8 8 0 0 1 8 8"></path></svg>');function ht(M,t){const e=K(t,["$$slots","$$events","$$legacy"]);var o=_t();let a;q(()=>a=G(o,a,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...e})),l(M,o)}var xt=A('<svg><path fill="currentColor" d="M200 24H56a16 16 0 0 0-16 16v176a16 16 0 0 0 16 16h144a16 16 0 0 0 16-16V40a16 16 0 0 0-16-16m-72 136a12 12 0 1 1-12 12a12 12 0 0 1 12-12m-8-24V80a8 8 0 0 1 16 0v56a8 8 0 0 1-16 0"></path></svg>');function yt(M,t){const e=K(t,["$$slots","$$events","$$legacy"]);var o=xt();let a;q(()=>a=G(o,a,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...e})),l(M,o)}var Mt=A('<svg><path fill="currentColor" d="M224 128a8 8 0 0 1-8 8H40a8 8 0 0 1 0-16h176a8 8 0 0 1 8 8"></path></svg>');function qt(M,t){const e=K(t,["$$slots","$$events","$$legacy"]);var o=Mt();let a;q(()=>a=G(o,a,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...e})),l(M,o)}var Ct=w('<input type="text" class="svelte-qtxn8o">'),St=w('<button class="increment"><!></button> <input type="text" inputmode="numeric" class="svelte-qtxn8o"> <button class="decrement"><!></button>',1),wt=w('<input type="date" class="svelte-qtxn8o">'),kt=w('<input type="text" class="svelte-qtxn8o">'),Bt=w('<div class="unrepresentable svelte-qtxn8o"><!> <p>Irreprésentable</p></div>'),Ht=w('<div class="metadata-input svelte-qtxn8o"><!></div>');function At(M,t){rt(t,!0);let e=$(t,"value",15),o=$(t,"confidences",19,()=>({}));const{type:a,options:tt=[]}=t.definition;var V=Ht(),et=O(V);{var at=C=>{const D=W(()=>tt.map(({key:v,...i})=>({key:v.toString(),...i}))),E=W(()=>{var v,i;return(i=gt((v=e())==null?void 0:v.toString()))==null?void 0:i.toString()});mt(C,{get id(){return t.id},get disabled(){return t.disabled},get options(){return X(D)},get confidences(){return o()},type:"single",get value(){return X(E)},onValueChange:v=>{var i,b;if(v===void 0){(i=t.onblur)==null||i.call(t,void 0);return}(b=t.onblur)==null||b.call(t,v.toString())}})},it=(C,D)=>{{var E=i=>{ft(i,{get id(){return t.id},get disabled(){return t.disabled},get value(){return e()},set value(b){e(b)},children:(b,L)=>{var B=lt(),_=Y(B);{var f=h=>{var u=U("Oui");l(h,u)},F=(h,u)=>{{var S=c=>{var k=U("Non");l(c,k)};x(h,c=>{e()===!1&&c(S)},u)}};x(_,h=>{e()?h(f):h(F,!1)})}l(b,B)},$$slots:{default:!0}})},v=(i,b)=>{{var L=_=>{var f=Ct();I(f),q(()=>{J(f,"id",t.id),f.disabled=t.disabled}),z(f,e),l(_,f)},B=(_,f)=>{{var F=u=>{var S=St(),c=Y(S),k=O(c);ht(k,{}),P(c);var n=Z(c,2);I(n);var r=Z(n,2),s=O(r);qt(s,{}),P(r),q(()=>{J(n,"id",t.id),n.disabled=t.disabled}),z(n,e),l(u,S)},h=(u,S)=>{{var c=n=>{var r=wt();I(r),q(()=>{J(r,"id",t.id),r.disabled=t.disabled}),p("blur",r,()=>{var s;return(s=t.onblur)==null?void 0:s.call(t,e())}),z(r,()=>{if(console.log(" () => { "),!!y("date",a,e())&&e()!==void 0)return ct(e(),"yyyy-MM-dd")},s=>{var H,m;if(console.log(" (newValue) => { ",s),s===void 0){(H=t.onblur)==null||H.call(t,void 0);return}return(m=t.onblur)==null||m.call(t,bt(s,"yyyy-MM-dd",new Date)),s}),l(n,r)},k=(n,r)=>{{var s=m=>{var d=kt();I(d),q(()=>{J(d,"id",t.id),d.disabled=t.disabled,vt(d,e()?`${e().latitude}, ${e().longitude}`:"")}),p("blur",d,({currentTarget:T})=>{var Q,R;let g=T.value;if(g===void 0){(Q=t.onblur)==null||Q.call(t,void 0);return}if(!g.includes(",")||g.split(",").length>3)return;g.split(",").length===3&&(g=g.replace(",",".").replace(";",","));const[j,N]=g.split(",").map(nt=>parseFloat(nt.trim()));(R=t.onblur)==null||R.call(t,{latitude:j,longitude:N})}),l(m,d)},H=m=>{var d=Bt(),T=O(d);yt(T,{}),dt(2),P(d),ot(d,(g,j)=>{var N;return(N=ut)==null?void 0:N(g,j)},()=>JSON.stringify(e(),null,2)),l(m,d)};x(n,m=>{y("location",a,e())?m(s):m(H,!1)},r)}};x(u,n=>{y("date",a,e())?n(c):n(k,!1)},S)}};x(_,u=>{y("integer",a,e())||y("float",a,e())?u(F):u(h,!1)},f)}};x(i,_=>{y("string",a,e())?_(L):_(B,!1)},b)}};x(C,i=>{y("boolean",a,e())?i(E):i(v,!1)},D)}};x(et,C=>{y("enum",a,e())?C(at):C(it,!1)})}P(V),l(M,V),st()}export{At as default};
