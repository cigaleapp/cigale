import{t as k,a as y}from"./Yi9iuJrU.js";import{ag as E,G as C,ah as j,r as p,f as S,c as g,g as b,a as A,t as O}from"./QTVBrZQz.js";import{s as P}from"./BijaW5W9.js";import{c as D}from"./D_3UiLlf.js";import{e as H}from"./DmiUy1W9.js";import{p as w}from"./B-Yw5O5m.js";import{o as K}from"./DNQPVM0U.js";import L from"./CjGVU5J0.js";import R from"./B3Nx63ej.js";var G=["Shift","Meta","Alt","Control"],M=typeof navigator=="object"?navigator.platform:"",_=/Mac|iPod|iPhone|iPad/.test(M),T=_?"Meta":"Control",U=M==="Win32"?["Control","Alt"]:_?["Alt"]:[];function v(t,n){return typeof t.getModifierState=="function"&&(t.getModifierState(n)||U.includes(n)&&t.getModifierState("AltGraph"))}function z(t){return t.trim().split(" ").map(function(n){var i=n.split(/\b\+/),o=i.pop(),e=o.match(/^\((.+)\)$/);return e&&(o=new RegExp("^"+e[1]+"$")),[i=i.map(function(r){return r==="$mod"?T:r}),o]})}function W(t,n){var i=n[0],o=n[1];return!((o instanceof RegExp?!o.test(t.key)&&!o.test(t.code):o.toUpperCase()!==t.key.toUpperCase()&&o!==t.code)||i.find(function(e){return!v(t,e)})||G.find(function(e){return!i.includes(e)&&o!==e&&v(t,e)}))}function q(t,n){var i;n===void 0&&(n={});var o=(i=n.timeout)!=null?i:1e3,e=Object.keys(t).map(function(a){return[z(a),t[a]]}),r=new Map,s=null;return function(a){a instanceof KeyboardEvent&&(e.forEach(function(l){var u=l[0],f=l[1],c=r.get(u)||u;W(a,c[0])?c.length>1?r.set(u,c.slice(1)):(r.delete(u),f(a)):v(a,a.key)||r.delete(u)}),s&&clearTimeout(s),s=setTimeout(r.clear.bind(r),o))}}function B(t,n,i){var o={},e=o.event,r=e===void 0?"keydown":e,s=o.capture,a=q(n,{timeout:o.timeout});return t.addEventListener(r,a,s),function(){t.removeEventListener(r,a,s)}}var F=k('<dt class="svelte-yxepe9"><svelte-css-wrapper style="display: contents"><!></svelte-css-wrapper></dt> <dd class="svelte-yxepe9"> </dd>',1),I=k('<dl class="svelte-yxepe9"></dl>');function te(t,n){E(n,!0);let i=w(n,"openHelp",15),o=w(n,"preventDefault",3,!1);C(()=>B(window,Object.fromEntries(Object.entries(n.binds).map(([e,r])=>[e,async s=>{r.when&&!r.when(s)||(o()&&s.preventDefault(),r.do(s))}])))),K(()=>{window.addEventListener("keyup",e=>{var r;e.key==="?"&&((r=i())==null||r())})}),L(t,{key:"observations-keyboard-shortcuts-help",title:"Raccourcis clavier",get open(){return i()},set open(e){i(e)},children:(e,r)=>{var s=I();H(s,21,()=>Object.entries(n.binds).filter(([a,{hidden:l}])=>!l),([a,{help:l}])=>a,(a,l)=>{let u=()=>b(l)[0],f=()=>b(l)[1].help;var c=F(),d=S(c),m=g(d);D(m,()=>({"--size":"1.2em"})),R(m.lastChild,{get shortcut(){return u()},get help(){return f()}}),p(m),p(d);var h=A(d,2),x=g(h,!0);p(h),O(()=>P(x,f())),y(a,c)}),p(s),y(e,s)},$$slots:{default:!0}}),j()}export{te as default};
