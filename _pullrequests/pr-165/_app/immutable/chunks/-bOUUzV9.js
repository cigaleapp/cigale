import{t as k,a as y}from"./cH4Vs66L.js";import{a9 as E,F as C,aa as j,r as p,f as S,c as g,g as b,a as A,t as O}from"./D272NdJT.js";import{s as P}from"./BVT1_9fA.js";import{c as D}from"./BjwUxc8m.js";import{e as H}from"./BZWWRvga.js";import{p as w}from"./2aJrL4Zg.js";import{o as K}from"./DSqpQu3y.js";import L from"./BonRXc-r.js";import R from"./cQuNSEo_.js";var T=["Shift","Meta","Alt","Control"],M=typeof navigator=="object"?navigator.platform:"",_=/Mac|iPod|iPhone|iPad/.test(M),U=_?"Meta":"Control",z=M==="Win32"?["Control","Alt"]:_?["Alt"]:[];function v(t,n){return typeof t.getModifierState=="function"&&(t.getModifierState(n)||z.includes(n)&&t.getModifierState("AltGraph"))}function F(t){return t.trim().split(" ").map(function(n){var i=n.split(/\b\+/),o=i.pop(),e=o.match(/^\((.+)\)$/);return e&&(o=new RegExp("^"+e[1]+"$")),[i=i.map(function(r){return r==="$mod"?U:r}),o]})}function G(t,n){var i=n[0],o=n[1];return!((o instanceof RegExp?!o.test(t.key)&&!o.test(t.code):o.toUpperCase()!==t.key.toUpperCase()&&o!==t.code)||i.find(function(e){return!v(t,e)})||T.find(function(e){return!i.includes(e)&&o!==e&&v(t,e)}))}function W(t,n){var i;n===void 0&&(n={});var o=(i=n.timeout)!=null?i:1e3,e=Object.keys(t).map(function(a){return[F(a),t[a]]}),r=new Map,s=null;return function(a){a instanceof KeyboardEvent&&(e.forEach(function(l){var u=l[0],f=l[1],c=r.get(u)||u;G(a,c[0])?c.length>1?r.set(u,c.slice(1)):(r.delete(u),f(a)):v(a,a.key)||r.delete(u)}),s&&clearTimeout(s),s=setTimeout(r.clear.bind(r),o))}}function q(t,n,i){var o={},e=o.event,r=e===void 0?"keydown":e,s=o.capture,a=W(n,{timeout:o.timeout});return t.addEventListener(r,a,s),function(){t.removeEventListener(r,a,s)}}var B=k('<dt class="svelte-yxepe9"><svelte-css-wrapper style="display: contents"><!></svelte-css-wrapper></dt> <dd class="svelte-yxepe9"> </dd>',1),I=k('<dl class="svelte-yxepe9"></dl>');function te(t,n){E(n,!0);let i=w(n,"openHelp",15),o=w(n,"preventDefault",3,!1);C(()=>q(window,Object.fromEntries(Object.entries(n.binds).map(([e,r])=>[e,async s=>{r.when&&!r.when(s)||(o()&&s.preventDefault(),r.do(s))}])))),K(()=>{window.addEventListener("keyup",e=>{var r;e.key==="?"&&((r=i())==null||r())})}),L(t,{key:"observations-keyboard-shortcuts-help",title:"Raccourcis clavier",get open(){return i()},set open(e){i(e)},children:(e,r)=>{var s=I();H(s,21,()=>Object.entries(n.binds).filter(([a,{hidden:l}])=>!l),([a,{help:l}])=>a,(a,l)=>{let u=()=>b(l)[0],f=()=>b(l)[1].help;var c=B(),d=S(c),m=g(d);D(m,()=>({"--size":"1.2em"})),R(m.lastChild,{get shortcut(){return u()},get help(){return f()}}),p(m),p(d);var h=A(d,2),x=g(h,!0);p(h),O(()=>P(x,f())),y(a,c)}),p(s),y(e,s)},$$slots:{default:!0}}),j()}export{te as default};
