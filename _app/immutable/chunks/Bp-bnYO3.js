const Ln=!1;var Mn=Array.isArray,Zt=Array.prototype.indexOf,qn=Array.from,Yn=Object.defineProperty,vt=Object.getOwnPropertyDescriptor,zt=Object.getOwnPropertyDescriptors,Hn=Object.prototype,jn=Array.prototype,Jt=Object.getPrototypeOf;function Bn(t){return typeof t=="function"}const Un=()=>{};function Vn(t){return typeof(t==null?void 0:t.then)=="function"}function Gn(t){return t()}function yt(t){for(var n=0;n<t.length;n++)t[n]()}function Kn(t,n,r=!1){return t===void 0?r?n():n:t}const y=2,Tt=4,X=8,ot=16,R=32,b=64,G=128,E=256,K=512,d=1024,O=2048,P=4096,C=8192,tt=16384,Qt=32768,gt=65536,$n=1<<17,Xt=1<<19,mt=1<<20,pt=Symbol("$state"),Wn=Symbol("legacy props"),Zn=Symbol("");function At(t){return t===this.v}function tn(t,n){return t!=t?n==n:t!==n||t!==null&&typeof t=="object"||typeof t=="function"}function It(t){return!tn(t,this.v)}function nn(t){throw new Error("https://svelte.dev/e/effect_in_teardown")}function rn(){throw new Error("https://svelte.dev/e/effect_in_unowned_derived")}function en(t){throw new Error("https://svelte.dev/e/effect_orphan")}function an(){throw new Error("https://svelte.dev/e/effect_update_depth_exceeded")}function zn(){throw new Error("https://svelte.dev/e/hydration_failed")}function Jn(t){throw new Error("https://svelte.dev/e/props_invalid_value")}function Qn(){throw new Error("https://svelte.dev/e/state_descriptors_fixed")}function Xn(){throw new Error("https://svelte.dev/e/state_prototype_fixed")}function sn(){throw new Error("https://svelte.dev/e/state_unsafe_local_read")}function ln(){throw new Error("https://svelte.dev/e/state_unsafe_mutation")}let nt=!1;function tr(){nt=!0}const nr=1,rr=2,er=4,ar=8,sr=16,lr=1,ur=2,or=4,fr=8,ir=16,_r=1,cr=2,vr=4,pr=1,hr=2,un="[",on="[!",fn="]",Rt={},dr=Symbol(),Er="http://www.w3.org/1999/xhtml";function xt(t){console.warn("https://svelte.dev/e/hydration_mismatch")}let i=null;function ht(t){i=t}function wr(t,n=!1,r){var e=i={p:i,c:null,d:!1,e:null,m:!1,s:t,x:null,l:null};nt&&!n&&(i.l={s:null,u:null,r1:[],r2:ft(!1)}),wn(()=>{e.d=!0})}function yr(t){const n=i;if(n!==null){const l=n.e;if(l!==null){var r=o,e=u;n.e=null;try{for(var s=0;s<l.length;s++){var a=l[s];z(a.effect),Z(a.reaction),Lt(a.fn)}}finally{z(r),Z(e)}}i=n.p,n.m=!0}return{}}function rt(){return!nt||i!==null&&i.l===null}const M=new Map;function ft(t,n){var r={f:0,v:t,reactions:null,equals:At,rv:0,wv:0};return r}function Tr(t){return Ot(ft(t))}function _n(t,n=!1){var e;const r=ft(t);return n||(r.equals=It),nt&&i!==null&&i.l!==null&&((e=i.l).s??(e.s=[])).push(r),r}function gr(t,n=!1){return Ot(_n(t,n))}function Ot(t){return u!==null&&!w&&(u.f&y)!==0&&(m===null?Rn([t]):m.push(t)),t}function mr(t,n){return St(t,Pn(()=>_t(t))),n}function St(t,n){return u!==null&&!w&&rt()&&(u.f&(y|ot))!==0&&(m===null||!m.includes(t))&&ln(),cn(t,n)}function cn(t,n){if(!t.equals(n)){var r=t.v;j?M.set(t,n):M.set(t,r),t.v=n,t.wv=Gt(),Nt(t,O),rt()&&o!==null&&(o.f&d)!==0&&(o.f&(R|b))===0&&(I===null?xn([t]):I.push(t))}return n}function Ar(t,n=1){var r=_t(t),e=n===1?r++:r--;return St(t,r),e}function Nt(t,n){var r=t.reactions;if(r!==null)for(var e=rt(),s=r.length,a=0;a<s;a++){var l=r[a],f=l.f;(f&O)===0&&(!e&&l===o||(A(l,n),(f&(d|E))!==0&&((f&y)!==0?Nt(l,P):at(l))))}}let N=!1;function Ir(t){N=t}let T;function q(t){if(t===null)throw xt(),Rt;return T=t}function Rr(){return q(D(T))}function xr(t){if(N){if(D(T)!==null)throw xt(),Rt;T=t}}function Or(t=1){if(N){for(var n=t,r=T;n--;)r=D(r);T=r}}function Sr(){for(var t=0,n=T;;){if(n.nodeType===8){var r=n.data;if(r===fn){if(t===0)return n;t-=1}else(r===un||r===on)&&(t+=1)}var e=D(n);n.remove(),n=e}}var dt,vn,pn,kt,Dt;function Nr(){if(dt===void 0){dt=window,vn=document,pn=/Firefox/.test(navigator.userAgent);var t=Element.prototype,n=Node.prototype;kt=vt(n,"firstChild").get,Dt=vt(n,"nextSibling").get,t.__click=void 0,t.__className=void 0,t.__attributes=null,t.__style=void 0,t.__e=void 0,Text.prototype.__t=void 0}}function st(t=""){return document.createTextNode(t)}function lt(t){return kt.call(t)}function D(t){return Dt.call(t)}function kr(t,n){if(!N)return lt(t);var r=lt(T);if(r===null)r=T.appendChild(st());else if(n&&r.nodeType!==3){var e=st();return r==null||r.before(e),q(e),e}return q(r),r}function Dr(t,n){if(!N){var r=lt(t);return r instanceof Comment&&r.data===""?D(r):r}return T}function Cr(t,n=1,r=!1){let e=N?T:t;for(var s;n--;)s=e,e=D(e);if(!N)return e;var a=e==null?void 0:e.nodeType;if(r&&a!==3){var l=st();return e===null?s==null||s.after(l):e.before(l),q(l),l}return q(e),e}function br(t){t.textContent=""}function Ct(t){var n=y|O,r=u!==null&&(u.f&y)!==0?u:null;return o===null||r!==null&&(r.f&E)!==0?n|=E:o.f|=mt,{ctx:i,deps:null,effects:null,equals:At,f:n,fn:t,reactions:null,rv:0,v:null,wv:0,parent:r??o}}function Pr(t){const n=Ct(t);return n.equals=It,n}function bt(t){var n=t.effects;if(n!==null){t.effects=null;for(var r=0;r<n.length;r+=1)k(n[r])}}function hn(t){for(var n=t.parent;n!==null;){if((n.f&y)===0)return n;n=n.parent}return null}function dn(t){var n,r=o;z(hn(t));try{bt(t),n=$t(t)}finally{z(r)}return n}function Pt(t){var n=dn(t),r=(x||(t.f&E)!==0)&&t.deps!==null?P:d;A(t,r),t.equals(n)||(t.v=n,t.wv=Gt())}function Ft(t){o===null&&u===null&&en(),u!==null&&(u.f&E)!==0&&o===null&&rn(),j&&nn()}function En(t,n){var r=n.last;r===null?n.last=n.first=t:(r.next=t,t.prev=r,n.last=t)}function F(t,n,r,e=!0){var s=o,a={ctx:i,deps:null,nodes_start:null,nodes_end:null,f:t|O,first:null,fn:n,last:null,next:null,parent:s,prev:null,teardown:null,transitions:null,wv:0};if(r)try{it(a),a.f|=Qt}catch(_){throw k(a),_}else n!==null&&at(a);var l=r&&a.deps===null&&a.first===null&&a.nodes_start===null&&a.teardown===null&&(a.f&(mt|G))===0;if(!l&&e&&(s!==null&&En(a,s),u!==null&&(u.f&y)!==0)){var f=u;(f.effects??(f.effects=[])).push(a)}return a}function wn(t){const n=F(X,null,!1);return A(n,d),n.teardown=t,n}function Fr(t){Ft();var n=o!==null&&(o.f&R)!==0&&i!==null&&!i.m;if(n){var r=i;(r.e??(r.e=[])).push({fn:t,effect:o,reaction:u})}else{var e=Lt(t);return e}}function Lr(t){return Ft(),yn(t)}function Mr(t){const n=F(b,t,!0);return(r={})=>new Promise(e=>{r.outro?mn(n,()=>{k(n),e(void 0)}):(k(n),e(void 0))})}function Lt(t){return F(Tt,t,!1)}function yn(t){return F(X,t,!0)}function qr(t,n=[],r=Ct){const e=n.map(r);return Tn(()=>t(...e.map(_t)))}function Tn(t,n=0){return F(X|ot|n,t,!0)}function Yr(t,n=!0){return F(X|R,t,!0,n)}function Mt(t){var n=t.teardown;if(n!==null){const r=j,e=u;wt(!0),Z(null);try{n.call(null)}finally{wt(r),Z(e)}}}function qt(t,n=!1){var r=t.first;for(t.first=t.last=null;r!==null;){var e=r.next;(r.f&b)!==0?r.parent=null:k(r,n),r=e}}function gn(t){for(var n=t.first;n!==null;){var r=n.next;(n.f&R)===0&&k(n),n=r}}function k(t,n=!0){var r=!1;if((n||(t.f&Xt)!==0)&&t.nodes_start!==null){for(var e=t.nodes_start,s=t.nodes_end;e!==null;){var a=e===s?null:D(e);e.remove(),e=a}r=!0}qt(t,n&&!r),Q(t,0),A(t,tt);var l=t.transitions;if(l!==null)for(const _ of l)_.stop();Mt(t);var f=t.parent;f!==null&&f.first!==null&&Yt(t),t.next=t.prev=t.teardown=t.ctx=t.deps=t.fn=t.nodes_start=t.nodes_end=null}function Yt(t){var n=t.parent,r=t.prev,e=t.next;r!==null&&(r.next=e),e!==null&&(e.prev=r),n!==null&&(n.first===t&&(n.first=e),n.last===t&&(n.last=r))}function mn(t,n){var r=[];Ht(t,r,!0),An(r,()=>{k(t),n&&n()})}function An(t,n){var r=t.length;if(r>0){var e=()=>--r||n();for(var s of t)s.out(e)}else n()}function Ht(t,n,r){if((t.f&C)===0){if(t.f^=C,t.transitions!==null)for(const l of t.transitions)(l.is_global||r)&&n.push(l);for(var e=t.first;e!==null;){var s=e.next,a=(e.f&gt)!==0||(e.f&R)!==0;Ht(e,n,a?r:!1),e=s}}}function Hr(t){jt(t,!0)}function jt(t,n){if((t.f&C)!==0){t.f^=C,(t.f&d)===0&&(t.f^=d),B(t)&&(A(t,O),at(t));for(var r=t.first;r!==null;){var e=r.next,s=(r.f&gt)!==0||(r.f&R)!==0;jt(r,s?n:!1),r=e}if(t.transitions!==null)for(const a of t.transitions)(a.is_global||n)&&a.in()}}const In=typeof requestIdleCallback>"u"?t=>setTimeout(t,1):requestIdleCallback;let Y=[],H=[];function Bt(){var t=Y;Y=[],yt(t)}function Ut(){var t=H;H=[],yt(t)}function jr(t){Y.length===0&&queueMicrotask(Bt),Y.push(t)}function Br(t){H.length===0&&In(Ut),H.push(t)}function Et(){Y.length>0&&Bt(),H.length>0&&Ut()}let V=!1,$=!1,W=null,S=!1,j=!1;function wt(t){j=t}let L=[];let u=null,w=!1;function Z(t){u=t}let o=null;function z(t){o=t}let m=null;function Rn(t){m=t}let c=null,h=0,I=null;function xn(t){I=t}let Vt=1,J=0,x=!1;function Gt(){return++Vt}function B(t){var v;var n=t.f;if((n&O)!==0)return!0;if((n&P)!==0){var r=t.deps,e=(n&E)!==0;if(r!==null){var s,a,l=(n&K)!==0,f=e&&o!==null&&!x,_=r.length;if(l||f){var g=t,U=g.parent;for(s=0;s<_;s++)a=r[s],(l||!((v=a==null?void 0:a.reactions)!=null&&v.includes(g)))&&(a.reactions??(a.reactions=[])).push(g);l&&(g.f^=K),f&&U!==null&&(U.f&E)===0&&(g.f^=E)}for(s=0;s<_;s++)if(a=r[s],B(a)&&Pt(a),a.wv>t.wv)return!0}(!e||o!==null&&!x)&&A(t,d)}return!1}function On(t,n){for(var r=n;r!==null;){if((r.f&G)!==0)try{r.fn(t);return}catch{r.f^=G}r=r.parent}throw V=!1,t}function Sn(t){return(t.f&tt)===0&&(t.parent===null||(t.parent.f&G)===0)}function et(t,n,r,e){if(V){if(r===null&&(V=!1),Sn(n))throw t;return}r!==null&&(V=!0);{On(t,n);return}}function Kt(t,n,r=!0){var e=t.reactions;if(e!==null)for(var s=0;s<e.length;s++){var a=e[s];(a.f&y)!==0?Kt(a,n,!1):n===a&&(r?A(a,O):(a.f&d)!==0&&A(a,P),at(a))}}function $t(t){var ct;var n=c,r=h,e=I,s=u,a=x,l=m,f=i,_=w,g=t.f;c=null,h=0,I=null,x=(g&E)!==0&&(w||!S||u===null),u=(g&(R|b))===0?t:null,m=null,ht(t.ctx),w=!1,J++;try{var U=(0,t.fn)(),v=t.deps;if(c!==null){var p;if(Q(t,h),v!==null&&h>0)for(v.length=h+c.length,p=0;p<c.length;p++)v[h+p]=c[p];else t.deps=v=c;if(!x)for(p=h;p<v.length;p++)((ct=v[p]).reactions??(ct.reactions=[])).push(t)}else v!==null&&h<v.length&&(Q(t,h),v.length=h);if(rt()&&I!==null&&!w&&v!==null&&(t.f&(y|P|O))===0)for(p=0;p<I.length;p++)Kt(I[p],t);return s!==null&&J++,U}finally{c=n,h=r,I=e,u=s,x=a,m=l,ht(f),w=_}}function Nn(t,n){let r=n.reactions;if(r!==null){var e=Zt.call(r,t);if(e!==-1){var s=r.length-1;s===0?r=n.reactions=null:(r[e]=r[s],r.pop())}}r===null&&(n.f&y)!==0&&(c===null||!c.includes(n))&&(A(n,P),(n.f&(E|K))===0&&(n.f^=K),bt(n),Q(n,0))}function Q(t,n){var r=t.deps;if(r!==null)for(var e=n;e<r.length;e++)Nn(t,r[e])}function it(t){var n=t.f;if((n&tt)===0){A(t,d);var r=o,e=i,s=S;o=t,S=!0;try{(n&ot)!==0?gn(t):qt(t),Mt(t);var a=$t(t);t.teardown=typeof a=="function"?a:null,t.wv=Vt;var l=t.deps,f}catch(_){et(_,t,r,e||t.ctx)}finally{S=s,o=r}}}function kn(){try{an()}catch(t){if(W!==null)et(t,W,null);else throw t}}function Wt(){var t=S;try{var n=0;for(S=!0;L.length>0;){n++>1e3&&kn();var r=L,e=r.length;L=[];for(var s=0;s<e;s++){var a=Cn(r[s]);Dn(a)}}}finally{$=!1,S=t,W=null,M.clear()}}function Dn(t){var n=t.length;if(n!==0)for(var r=0;r<n;r++){var e=t[r];if((e.f&(tt|C))===0)try{B(e)&&(it(e),e.deps===null&&e.first===null&&e.nodes_start===null&&(e.teardown===null?Yt(e):e.fn=null))}catch(s){et(s,e,null,e.ctx)}}}function at(t){$||($=!0,queueMicrotask(Wt));for(var n=W=t;n.parent!==null;){n=n.parent;var r=n.f;if((r&(b|R))!==0){if((r&d)===0)return;n.f^=d}}L.push(n)}function Cn(t){for(var n=[],r=t;r!==null;){var e=r.f,s=(e&(R|b))!==0,a=s&&(e&d)!==0;if(!a&&(e&C)===0){if((e&Tt)!==0)n.push(r);else if(s)r.f^=d;else{var l=u;try{u=r,B(r)&&it(r)}catch(g){et(g,r,null,r.ctx)}finally{u=l}}var f=r.first;if(f!==null){r=f;continue}}var _=r.parent;for(r=r.next;r===null&&_!==null;)r=_.next,_=_.parent}return n}function bn(t){var n;for(Et();L.length>0;)$=!0,Wt(),Et();return n}async function Ur(){await Promise.resolve(),bn()}function _t(t){var n=t.f,r=(n&y)!==0;if(u!==null&&!w){m!==null&&m.includes(t)&&sn();var e=u.deps;t.rv<J&&(t.rv=J,c===null&&e!==null&&e[h]===t?h++:c===null?c=[t]:(!x||!c.includes(t))&&c.push(t))}else if(r&&t.deps===null&&t.effects===null){var s=t,a=s.parent;a!==null&&(a.f&E)===0&&(s.f^=E)}return r&&(s=t,B(s)&&Pt(s)),j&&M.has(t)?M.get(t):t.v}function Pn(t){var n=w;try{return w=!0,t()}finally{w=n}}const Fn=-7169;function A(t,n){t.f=t.f&Fn|n}function Vr(t){if(!(typeof t!="object"||!t||t instanceof EventTarget)){if(pt in t)ut(t);else if(!Array.isArray(t))for(let n in t){const r=t[n];typeof r=="object"&&r&&pt in r&&ut(r)}}}function ut(t,n=new Set){if(typeof t=="object"&&t!==null&&!(t instanceof EventTarget)&&!n.has(t)){n.add(t),t instanceof Date&&t.getTime();for(let e in t)try{ut(t[e],n)}catch{}const r=Jt(t);if(r!==Object.prototype&&r!==Array.prototype&&r!==Map.prototype&&r!==Set.prototype&&r!==Date.prototype){const e=zt(r);for(let s in e){const a=e[s].get;if(a)try{a.call(t)}catch{}}}}}export{ar as $,Lr as A,Fr as B,yt as C,Pn as D,gt as E,Gn as F,Vr as G,Ct as H,Lt as I,yn as J,st as K,er as L,q as M,lt as N,Pr as O,on as P,Sr as Q,Ir as R,pt as S,fn as T,dr as U,C as V,qn as W,o as X,nr as Y,rr as Z,Mn as _,Cr as a,Ht as a0,br as a1,An as a2,k as a3,sr as a4,D as a5,wn as a6,Hn as a7,jn as a8,Xn as a9,pr as aA,hr as aB,Yn as aC,Ur as aD,Zn as aE,Er as aF,zt as aG,Br as aH,u as aI,Xt as aJ,Nr as aK,Rt as aL,xt as aM,zn as aN,Mr as aO,ot as aP,Qt as aQ,vr as aR,_r as aS,cr as aT,Ar as aU,Ln as aV,tn as aW,vt as aa,Qn as ab,Jt as ac,tr as ad,Un as ae,wr as af,yr as ag,Or as ah,Kn as ai,nt as aj,dt as ak,vn as al,un as am,Jn as an,$n as ao,or as ap,It as aq,fr as ar,Wn as as,ur as at,lr as au,Bn as av,ir as aw,gr as ax,mr as ay,pn as az,St as b,kr as c,Rr as d,Tn as e,Dr as f,_t as g,N as h,Yr as i,T as j,rt as k,Vn as l,cn as m,ft as n,_n as o,mn as p,jr as q,xr as r,Tr as s,qr as t,z as u,Z as v,ht as w,i as x,Hr as y,bn as z};
