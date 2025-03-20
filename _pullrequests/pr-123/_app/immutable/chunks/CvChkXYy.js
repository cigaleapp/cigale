const Yn=!1;var Hn=Array.isArray,Xt=Array.prototype.indexOf,jn=Array.from,Bn=Object.defineProperty,pt=Object.getOwnPropertyDescriptor,zt=Object.getOwnPropertyDescriptors,Un=Object.prototype,Vn=Array.prototype,Jt=Object.getPrototypeOf;function Gn(t){return typeof t=="function"}const $n=()=>{};function Kn(t){return typeof(t==null?void 0:t.then)=="function"}function Zn(t){return t()}function mt(t){for(var n=0;n<t.length;n++)t[n]()}function Wn(t,n,e=!1){return t===void 0?e?n():n:t}const m=2,gt=4,Q=8,ft=16,I=32,D=64,G=128,y=256,$=512,d=1024,S=2048,F=4096,P=8192,tt=16384,Qt=32768,Tt=65536,Xn=1<<17,tn=1<<19,At=1<<20,ht=Symbol("$state"),zn=Symbol("legacy props"),Jn=Symbol("");function xt(t){return t===this.v}function nn(t,n){return t!=t?n==n:t!==n||t!==null&&typeof t=="object"||typeof t=="function"}function Qn(t,n){return t!==n}function It(t){return!nn(t,this.v)}function en(t){throw new Error("https://svelte.dev/e/effect_in_teardown")}function rn(){throw new Error("https://svelte.dev/e/effect_in_unowned_derived")}function an(t){throw new Error("https://svelte.dev/e/effect_orphan")}function sn(){throw new Error("https://svelte.dev/e/effect_update_depth_exceeded")}function te(){throw new Error("https://svelte.dev/e/hydration_failed")}function ne(t){throw new Error("https://svelte.dev/e/props_invalid_value")}function ee(){throw new Error("https://svelte.dev/e/state_descriptors_fixed")}function re(){throw new Error("https://svelte.dev/e/state_prototype_fixed")}function ln(){throw new Error("https://svelte.dev/e/state_unsafe_local_read")}function un(){throw new Error("https://svelte.dev/e/state_unsafe_mutation")}let nt=!1;function ae(){nt=!0}const se=1,le=2,ue=4,oe=8,fe=16,ie=1,_e=2,ce=4,ve=8,pe=16,he=1,de=2,Ee=4,we=1,ye=2,on="[",fn="[!",_n="]",Rt={},me=Symbol(),ge="http://www.w3.org/1999/xhtml";function Ot(t){console.warn("https://svelte.dev/e/hydration_mismatch")}function cn(t){throw new Error("https://svelte.dev/e/lifecycle_outside_component")}let o=null;function dt(t){o=t}function Te(t){return rt().get(t)}function Ae(t,n){return rt().set(t,n),n}function xe(t){return rt().has(t)}function Ie(){return rt()}function Re(t,n=!1,e){var r=o={p:o,c:null,d:!1,e:null,m:!1,s:t,x:null,l:null};nt&&!n&&(o.l={s:null,u:null,r1:[],r2:it(!1)}),gn(()=>{r.d=!0})}function Oe(t){const n=o;if(n!==null){const l=n.e;if(l!==null){var e=f,r=u;n.e=null;try{for(var s=0;s<l.length;s++){var a=l[s];X(a.effect),W(a.reaction),Lt(a.fn)}}finally{X(e),W(r)}}o=n.p,n.m=!0}return{}}function et(){return!nt||o!==null&&o.l===null}function rt(t){return o===null&&cn(),o.c??(o.c=new Map(vn(o)||void 0))}function vn(t){let n=t.p;for(;n!==null;){const e=n.c;if(e!==null)return e;n=n.p}return null}const L=new Map;function it(t,n){var e={f:0,v:t,reactions:null,equals:xt,rv:0,wv:0};return e}function Se(t){return St(it(t))}function pn(t,n=!1){var r;const e=it(t);return n||(e.equals=It),nt&&o!==null&&o.l!==null&&((r=o.l).s??(r.s=[])).push(e),e}function ke(t,n=!1){return St(pn(t,n))}function St(t){return u!==null&&!w&&(u.f&m)!==0&&(A===null?Sn([t]):A.push(t)),t}function Ne(t,n){return kt(t,Ln(()=>ct(t))),n}function kt(t,n){return u!==null&&!w&&et()&&(u.f&(m|ft))!==0&&(A===null||!A.includes(t))&&un(),hn(t,n)}function hn(t,n){if(!t.equals(n)){var e=t.v;j?L.set(t,n):L.set(t,e),t.v=n,t.wv=$t(),Nt(t,S),et()&&f!==null&&(f.f&d)!==0&&(f.f&(I|D))===0&&(E===null?kn([t]):E.push(t))}return n}function De(t,n=1){var e=ct(t),r=n===1?e++:e--;return kt(t,e),r}function Nt(t,n){var e=t.reactions;if(e!==null)for(var r=et(),s=e.length,a=0;a<s;a++){var l=e[a],i=l.f;(i&S)===0&&(!r&&l===f||(x(l,n),(i&(d|y))!==0&&((i&m)!==0?Nt(l,F):st(l))))}}let N=!1;function Ce(t){N=t}let g;function q(t){if(t===null)throw Ot(),Rt;return g=t}function be(){return q(C(g))}function Pe(t){if(N){if(C(g)!==null)throw Ot(),Rt;g=t}}function Fe(t=1){if(N){for(var n=t,e=g;n--;)e=C(e);g=e}}function Me(){for(var t=0,n=g;;){if(n.nodeType===8){var e=n.data;if(e===_n){if(t===0)return n;t-=1}else(e===on||e===fn)&&(t+=1)}var r=C(n);n.remove(),n=r}}var Et,dn,En,Dt,Ct;function Le(){if(Et===void 0){Et=window,dn=document,En=/Firefox/.test(navigator.userAgent);var t=Element.prototype,n=Node.prototype;Dt=pt(n,"firstChild").get,Ct=pt(n,"nextSibling").get,t.__click=void 0,t.__className=void 0,t.__attributes=null,t.__style=void 0,t.__e=void 0,Text.prototype.__t=void 0}}function lt(t=""){return document.createTextNode(t)}function ut(t){return Dt.call(t)}function C(t){return Ct.call(t)}function qe(t,n){if(!N)return ut(t);var e=ut(g);if(e===null)e=g.appendChild(lt());else if(n&&e.nodeType!==3){var r=lt();return e==null||e.before(r),q(r),r}return q(e),e}function Ye(t,n){if(!N){var e=ut(t);return e instanceof Comment&&e.data===""?C(e):e}return g}function He(t,n=1,e=!1){let r=N?g:t;for(var s;n--;)s=r,r=C(r);if(!N)return r;var a=r==null?void 0:r.nodeType;if(e&&a!==3){var l=lt();return r===null?s==null||s.after(l):r.before(l),q(l),l}return q(r),r}function je(t){t.textContent=""}function bt(t){var n=m|S,e=u!==null&&(u.f&m)!==0?u:null;return f===null||e!==null&&(e.f&y)!==0?n|=y:f.f|=At,{ctx:o,deps:null,effects:null,equals:xt,f:n,fn:t,reactions:null,rv:0,v:null,wv:0,parent:e??f}}function Be(t){const n=bt(t);return n.equals=It,n}function Pt(t){var n=t.effects;if(n!==null){t.effects=null;for(var e=0;e<n.length;e+=1)O(n[e])}}function wn(t){for(var n=t.parent;n!==null;){if((n.f&m)===0)return n;n=n.parent}return null}function yn(t){var n,e=f;X(wn(t));try{Pt(t),n=Zt(t)}finally{X(e)}return n}function Ft(t){var n=yn(t),e=(R||(t.f&y)!==0)&&t.deps!==null?F:d;x(t,e),t.equals(n)||(t.v=n,t.wv=$t())}function Mt(t){f===null&&u===null&&an(),u!==null&&(u.f&y)!==0&&f===null&&rn(),j&&en()}function mn(t,n){var e=n.last;e===null?n.last=n.first=t:(e.next=t,t.prev=e,n.last=t)}function b(t,n,e,r=!0){var s=f,a={ctx:o,deps:null,nodes_start:null,nodes_end:null,f:t|S,first:null,fn:n,last:null,next:null,parent:s,prev:null,teardown:null,transitions:null,wv:0};if(e)try{_t(a),a.f|=Qt}catch(_){throw O(a),_}else n!==null&&st(a);var l=e&&a.deps===null&&a.first===null&&a.nodes_start===null&&a.teardown===null&&(a.f&(At|G))===0;if(!l&&r&&(s!==null&&mn(a,s),u!==null&&(u.f&m)!==0)){var i=u;(i.effects??(i.effects=[])).push(a)}return a}function Ue(){return u!==null&&!w}function gn(t){const n=b(Q,null,!1);return x(n,d),n.teardown=t,n}function Ve(t){Mt();var n=f!==null&&(f.f&I)!==0&&o!==null&&!o.m;if(n){var e=o;(e.e??(e.e=[])).push({fn:t,effect:f,reaction:u})}else{var r=Lt(t);return r}}function Ge(t){return Mt(),Tn(t)}function $e(t){const n=b(D,t,!0);return()=>{O(n)}}function Ke(t){const n=b(D,t,!0);return(e={})=>new Promise(r=>{e.outro?In(n,()=>{O(n),r(void 0)}):(O(n),r(void 0))})}function Lt(t){return b(gt,t,!1)}function Tn(t){return b(Q,t,!0)}function Ze(t,n=[],e=bt){const r=n.map(e);return An(()=>t(...r.map(ct)))}function An(t,n=0){return b(Q|ft|n,t,!0)}function We(t,n=!0){return b(Q|I,t,!0,n)}function qt(t){var n=t.teardown;if(n!==null){const e=j,r=u;yt(!0),W(null);try{n.call(null)}finally{yt(e),W(r)}}}function Yt(t,n=!1){var e=t.first;for(t.first=t.last=null;e!==null;){var r=e.next;(e.f&D)!==0?e.parent=null:O(e,n),e=r}}function xn(t){for(var n=t.first;n!==null;){var e=n.next;(n.f&I)===0&&O(n),n=e}}function O(t,n=!0){var e=!1;if((n||(t.f&tn)!==0)&&t.nodes_start!==null){for(var r=t.nodes_start,s=t.nodes_end;r!==null;){var a=r===s?null:C(r);r.remove(),r=a}e=!0}Yt(t,n&&!e),J(t,0),x(t,tt);var l=t.transitions;if(l!==null)for(const _ of l)_.stop();qt(t);var i=t.parent;i!==null&&i.first!==null&&Ht(t),t.next=t.prev=t.teardown=t.ctx=t.deps=t.fn=t.nodes_start=t.nodes_end=null}function Ht(t){var n=t.parent,e=t.prev,r=t.next;e!==null&&(e.next=r),r!==null&&(r.prev=e),n!==null&&(n.first===t&&(n.first=r),n.last===t&&(n.last=e))}function In(t,n){var e=[];jt(t,e,!0),Rn(e,()=>{O(t),n&&n()})}function Rn(t,n){var e=t.length;if(e>0){var r=()=>--e||n();for(var s of t)s.out(r)}else n()}function jt(t,n,e){if((t.f&P)===0){if(t.f^=P,t.transitions!==null)for(const l of t.transitions)(l.is_global||e)&&n.push(l);for(var r=t.first;r!==null;){var s=r.next,a=(r.f&Tt)!==0||(r.f&I)!==0;jt(r,n,a?e:!1),r=s}}}function Xe(t){Bt(t,!0)}function Bt(t,n){if((t.f&P)!==0){t.f^=P,(t.f&d)===0&&(t.f^=d),B(t)&&(x(t,S),st(t));for(var e=t.first;e!==null;){var r=e.next,s=(e.f&Tt)!==0||(e.f&I)!==0;Bt(e,s?n:!1),e=r}if(t.transitions!==null)for(const a of t.transitions)(a.is_global||n)&&a.in()}}const On=typeof requestIdleCallback>"u"?t=>setTimeout(t,1):requestIdleCallback;let Y=[],H=[];function Ut(){var t=Y;Y=[],mt(t)}function Vt(){var t=H;H=[],mt(t)}function ze(t){Y.length===0&&queueMicrotask(Ut),Y.push(t)}function Je(t){H.length===0&&On(Vt),H.push(t)}function wt(){Y.length>0&&Ut(),H.length>0&&Vt()}let V=!1,K=!1,Z=null,k=!1,j=!1;function yt(t){j=t}let M=[];let u=null,w=!1;function W(t){u=t}let f=null;function X(t){f=t}let A=null;function Sn(t){A=t}let c=null,h=0,E=null;function kn(t){E=t}let Gt=1,z=0,R=!1;function $t(){return++Gt}function B(t){var v;var n=t.f;if((n&S)!==0)return!0;if((n&F)!==0){var e=t.deps,r=(n&y)!==0;if(e!==null){var s,a,l=(n&$)!==0,i=r&&f!==null&&!R,_=e.length;if(l||i){var T=t,U=T.parent;for(s=0;s<_;s++)a=e[s],(l||!((v=a==null?void 0:a.reactions)!=null&&v.includes(T)))&&(a.reactions??(a.reactions=[])).push(T);l&&(T.f^=$),i&&U!==null&&(U.f&y)===0&&(T.f^=y)}for(s=0;s<_;s++)if(a=e[s],B(a)&&Ft(a),a.wv>t.wv)return!0}(!r||f!==null&&!R)&&x(t,d)}return!1}function Nn(t,n){for(var e=n;e!==null;){if((e.f&G)!==0)try{e.fn(t);return}catch{e.f^=G}e=e.parent}throw V=!1,t}function Dn(t){return(t.f&tt)===0&&(t.parent===null||(t.parent.f&G)===0)}function at(t,n,e,r){if(V){if(e===null&&(V=!1),Dn(n))throw t;return}e!==null&&(V=!0);{Nn(t,n);return}}function Kt(t,n,e=!0){var r=t.reactions;if(r!==null)for(var s=0;s<r.length;s++){var a=r[s];(a.f&m)!==0?Kt(a,n,!1):n===a&&(e?x(a,S):(a.f&d)!==0&&x(a,F),st(a))}}function Zt(t){var vt;var n=c,e=h,r=E,s=u,a=R,l=A,i=o,_=w,T=t.f;c=null,h=0,E=null,R=(T&y)!==0&&(w||!k||u===null),u=(T&(I|D))===0?t:null,A=null,dt(t.ctx),w=!1,z++;try{var U=(0,t.fn)(),v=t.deps;if(c!==null){var p;if(J(t,h),v!==null&&h>0)for(v.length=h+c.length,p=0;p<c.length;p++)v[h+p]=c[p];else t.deps=v=c;if(!R)for(p=h;p<v.length;p++)((vt=v[p]).reactions??(vt.reactions=[])).push(t)}else v!==null&&h<v.length&&(J(t,h),v.length=h);if(et()&&E!==null&&!w&&v!==null&&(t.f&(m|F|S))===0)for(p=0;p<E.length;p++)Kt(E[p],t);return s!==null&&(z++,E!==null&&(r===null?r=E:r.push(...E))),U}finally{c=n,h=e,E=r,u=s,R=a,A=l,dt(i),w=_}}function Cn(t,n){let e=n.reactions;if(e!==null){var r=Xt.call(e,t);if(r!==-1){var s=e.length-1;s===0?e=n.reactions=null:(e[r]=e[s],e.pop())}}e===null&&(n.f&m)!==0&&(c===null||!c.includes(n))&&(x(n,F),(n.f&(y|$))===0&&(n.f^=$),Pt(n),J(n,0))}function J(t,n){var e=t.deps;if(e!==null)for(var r=n;r<e.length;r++)Cn(t,e[r])}function _t(t){var n=t.f;if((n&tt)===0){x(t,d);var e=f,r=o,s=k;f=t,k=!0;try{(n&ft)!==0?xn(t):Yt(t),qt(t);var a=Zt(t);t.teardown=typeof a=="function"?a:null,t.wv=Gt;var l=t.deps,i}catch(_){at(_,t,e,r||t.ctx)}finally{k=s,f=e}}}function bn(){try{sn()}catch(t){if(Z!==null)at(t,Z,null);else throw t}}function Wt(){var t=k;try{var n=0;for(k=!0;M.length>0;){n++>1e3&&bn();var e=M,r=e.length;M=[];for(var s=0;s<r;s++){var a=Fn(e[s]);Pn(a)}}}finally{K=!1,k=t,Z=null,L.clear()}}function Pn(t){var n=t.length;if(n!==0)for(var e=0;e<n;e++){var r=t[e];if((r.f&(tt|P))===0)try{B(r)&&(_t(r),r.deps===null&&r.first===null&&r.nodes_start===null&&(r.teardown===null?Ht(r):r.fn=null))}catch(s){at(s,r,null,r.ctx)}}}function st(t){K||(K=!0,queueMicrotask(Wt));for(var n=Z=t;n.parent!==null;){n=n.parent;var e=n.f;if((e&(D|I))!==0){if((e&d)===0)return;n.f^=d}}M.push(n)}function Fn(t){for(var n=[],e=t;e!==null;){var r=e.f,s=(r&(I|D))!==0,a=s&&(r&d)!==0;if(!a&&(r&P)===0){if((r&gt)!==0)n.push(e);else if(s)e.f^=d;else{var l=u;try{u=e,B(e)&&_t(e)}catch(T){at(T,e,null,e.ctx)}finally{u=l}}var i=e.first;if(i!==null){e=i;continue}}var _=e.parent;for(e=e.next;e===null&&_!==null;)e=_.next,_=_.parent}return n}function Mn(t){var n;for(wt();M.length>0;)K=!0,Wt(),wt();return n}async function Qe(){await Promise.resolve(),Mn()}function ct(t){var n=t.f,e=(n&m)!==0;if(u!==null&&!w){A!==null&&A.includes(t)&&ln();var r=u.deps;t.rv<z&&(t.rv=z,c===null&&r!==null&&r[h]===t?h++:c===null?c=[t]:(!R||!c.includes(t))&&c.push(t))}else if(e&&t.deps===null&&t.effects===null){var s=t,a=s.parent;a!==null&&(a.f&y)===0&&(s.f^=y)}return e&&(s=t,B(s)&&Ft(s)),j&&L.has(t)?L.get(t):t.v}function Ln(t){var n=w;try{return w=!0,t()}finally{w=n}}const qn=-7169;function x(t,n){t.f=t.f&qn|n}function tr(t){if(!(typeof t!="object"||!t||t instanceof EventTarget)){if(ht in t)ot(t);else if(!Array.isArray(t))for(let n in t){const e=t[n];typeof e=="object"&&e&&ht in e&&ot(e)}}}function ot(t,n=new Set){if(typeof t=="object"&&t!==null&&!(t instanceof EventTarget)&&!n.has(t)){n.add(t),t instanceof Date&&t.getTime();for(let r in t)try{ot(t[r],n)}catch{}const e=Jt(t);if(e!==Object.prototype&&e!==Array.prototype&&e!==Map.prototype&&e!==Set.prototype&&e!==Date.prototype){const r=zt(e);for(let s in r){const a=r[s].get;if(a)try{a.call(t)}catch{}}}}}export{se as $,cn as A,Ve as B,nt as C,Ln as D,Tt as E,fn as F,Me as G,on as H,q as I,Ce as J,Ge as K,mt as L,Zn as M,tr as N,bt as O,Lt as P,Tn as Q,lt as R,ht as S,ue as T,me as U,ut as V,Be as W,_n as X,P as Y,jn as Z,f as _,He as a,Te as a$,le as a0,Hn as a1,oe as a2,jt as a3,je as a4,Rn as a5,O as a6,fe as a7,C as a8,gn as a9,En as aA,we as aB,ye as aC,Bn as aD,Qe as aE,Jn as aF,ge as aG,zt as aH,Je as aI,u as aJ,tn as aK,Le as aL,Rt as aM,Ot as aN,te as aO,Ke as aP,ft as aQ,Qt as aR,Ee as aS,he as aT,de as aU,De as aV,Yn as aW,nn as aX,Qn as aY,Ue as aZ,xe as a_,Un as aa,Vn as ab,re as ac,pt as ad,ee as ae,Jt as af,ae as ag,$n as ah,Re as ai,Oe as aj,Fe as ak,Wn as al,ne as am,Xn as an,ce as ao,It as ap,ve as aq,zn as ar,_e as as,ie as at,Gn as au,pe as av,Et as aw,dn as ax,ke as ay,Ne as az,kt as b,Ae as b0,Ie as b1,$e as b2,qe as c,be as d,An as e,Ye as f,ct as g,N as h,We as i,g as j,et as k,Kn as l,hn as m,it as n,pn as o,In as p,ze as q,Pe as r,Se as s,Ze as t,X as u,W as v,dt as w,o as x,Xe as y,Mn as z};
