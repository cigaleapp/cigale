import{k as y,D as i,Q as h,h as _,a9 as C,aa as q,q as t}from"./je5hudcr.js";import{l as k}from"./rhXEw3QH.js";function E(e,l,a=l){var v=y();k(e,"input",r=>{var s=r?e.defaultValue:e.value;if(s=u(e)?b(s):s,a(s),v&&s!==(s=l())){var f=e.selectionStart,d=e.selectionEnd;e.value=s??"",d!==null&&(e.selectionStart=f,e.selectionEnd=Math.min(d,e.value.length))}}),(_&&e.defaultValue!==e.value||i(l)==null&&e.value)&&a(u(e)?b(e.value):e.value),h(()=>{var r=l();u(e)&&r===b(e.value)||e.type==="date"&&!r&&!e.value||r!==e.value&&(e.value=r??"")})}const n=new Set;function V(e,l,a,v,r=v){var s=a.getAttribute("type")==="checkbox",f=e;let d=!1;if(l!==null)for(var m of l)f=f[m]??(f[m]=[]);f.push(a),k(a,"change",()=>{var c=a.__value;s&&(c=S(f,c,a.checked)),r(c)},()=>r(s?[]:null)),h(()=>{var c=v();if(_&&a.defaultChecked!==a.checked){d=!0;return}s?(c=c||[],a.checked=c.includes(a.__value)):a.checked=C(a.__value,c)}),q(()=>{var c=f.indexOf(a);c!==-1&&f.splice(c,1)}),n.has(f)||(n.add(f),t(()=>{f.sort((c,o)=>c.compareDocumentPosition(o)===4?-1:1),n.delete(f)})),t(()=>{if(d){var c;if(s)c=S(f,c,a.checked);else{var o=f.find(w=>w.checked);c=o==null?void 0:o.__value}r(c)}})}function g(e,l,a=l){k(e,"change",v=>{var r=v?e.defaultChecked:e.checked;a(r)}),(_&&e.defaultChecked!==e.checked||i(l)==null)&&a(e.checked),h(()=>{var v=l();e.checked=!!v})}function S(e,l,a){for(var v=new Set,r=0;r<e.length;r+=1)e[r].checked&&v.add(e[r].__value);return a||v.delete(l),Array.from(v)}function u(e){var l=e.type;return l==="number"||l==="range"}function b(e){return e===""?null:+e}function B(e,l,a=l){k(e,"change",()=>{a(e.files)}),_&&e.files&&a(e.files),h(()=>{e.files=l()})}export{V as a,E as b,g as c,B as d};
