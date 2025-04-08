import{h as S,aB as Y,aC as q,aD as z,aE as F,L as P,aF as K}from"./BJJyANvY.js";import{i as J,c as Q,d as W,b as X,n as Z,f as y,g as m}from"./BJDLrIW6.js";function B(r){var i,f,s="";if(typeof r=="string"||typeof r=="number")s+=r;else if(typeof r=="object")if(Array.isArray(r)){var u=r.length;for(i=0;i<u;i++)r[i]&&(f=B(r[i]))&&(s&&(s+=" "),s+=f)}else for(f in r)r[f]&&(s&&(s+=" "),s+=f);return s}function x(){for(var r,i,f=0,s="",u=arguments.length;f<u;f++)(r=arguments[f])&&(i=B(r))&&(s&&(s+=" "),s+=i);return s}function rr(r){return typeof r=="object"?x(r):r??""}const R=[...` 	
\r\f \v\uFEFF`];function fr(r,i,f){var s=r==null?"":""+r;if(i&&(s=s?s+" "+i:i),f){for(var u in f)if(f[u])s=s?s+" "+u:u;else if(s.length)for(var a=u.length,l=0;(l=s.indexOf(u,l))>=0;){var e=l+a;(l===0||R.includes(s[l-1]))&&(e===s.length||R.includes(s[e]))?s=(l===0?"":s.substring(0,l))+s.substring(e+1):l=e}}return s===""?null:s}function j(r,i=!1){var f=i?" !important;":";",s="";for(var u in r){var a=r[u];a!=null&&a!==""&&(s+=" "+u+": "+a+f)}return s}function I(r){return r[0]!=="-"||r[1]!=="-"?r.toLowerCase():r}function ir(r,i){if(i){var f="",s,u;if(Array.isArray(i)?(s=i[0],u=i[1]):s=i,r){r=String(r).replaceAll(/\s*\/\*.*?\*\/\s*/g,"").trim();var a=!1,l=0,e=!1,A=[];s&&A.push(...Object.keys(s).map(I)),u&&A.push(...Object.keys(u).map(I));var c=0,b=-1;const L=r.length;for(var v=0;v<L;v++){var g=r[v];if(e?g==="/"&&r[v-1]==="*"&&(e=!1):a?a===g&&(a=!1):g==="/"&&r[v+1]==="*"?e=!0:g==='"'||g==="'"?a=g:g==="("?l++:g===")"&&l--,!e&&a===!1&&l===0){if(g===":"&&b===-1)b=v;else if(g===";"||v===L-1){if(b!==-1){var O=I(r.substring(c,b).trim());if(!A.includes(O)){g!==";"&&v++;var p=r.substring(c,v).trim();f+=" "+p+";"}}c=v+1,b=-1}}}}return s&&(f+=j(s)),u&&(f+=j(u,!0)),f=f.trim(),f===""?null:f}return r==null?null:String(r)}function sr(r,i,f,s,u,a){var l=r.__className;if(S||l!==f){var e=fr(f,s,a);(!S||e!==r.getAttribute("class"))&&(e==null?r.removeAttribute("class"):i?r.className=e:r.setAttribute("class",e)),r.__className=f}else if(a&&u!==a)for(var A in a){var c=!!a[A];(u==null||c!==!!u[A])&&r.classList.toggle(A,c)}return a}function M(r,i={},f,s){for(var u in f){var a=f[u];i[u]!==a&&(f[u]==null?r.style.removeProperty(u):r.style.setProperty(u,a,s))}}function ur(r,i,f,s){var u=r.__style;if(S||u!==i){var a=ir(i,s);(!S||a!==r.getAttribute("style"))&&(a==null?r.removeAttribute("style"):r.style.cssText=a),r.__style=i}else s&&(Array.isArray(s)?(M(r,f==null?void 0:f[0],s[0]),M(r,f==null?void 0:f[1],s[1],"important")):M(r,f,s));return s}const _=Symbol("class"),E=Symbol("style"),U=Symbol("is custom element"),V=Symbol("is html");function lr(r){if(S){var i=!1,f=()=>{if(!i){if(i=!0,r.hasAttribute("value")){var s=r.value;C(r,"value",null),r.value=s}if(r.hasAttribute("checked")){var u=r.checked;C(r,"checked",null),r.checked=u}}};r.__on_r=f,K(f),y()}}function cr(r,i){var f=$(r);f.value===(f.value=i??void 0)||r.value===i&&(i!==0||r.nodeName!=="PROGRESS")||(r.value=i??"")}function ar(r,i){i?r.hasAttribute("selected")||r.setAttribute("selected",""):r.removeAttribute("selected")}function C(r,i,f,s){var u=$(r);S&&(u[i]=r.getAttribute(i),i==="src"||i==="srcset"||i==="href"&&r.nodeName==="LINK")||u[i]!==(u[i]=f)&&(i==="loading"&&(r[Y]=f),f==null?r.removeAttribute(i):typeof f!="string"&&D(r).includes(i)?r[i]=f:r.setAttribute(i,f))}function er(r,i,f,s,u=!1){var a=$(r),l=a[U],e=!a[V];let A=S&&l;A&&P(!1);var c=i||{},b=r.tagName==="OPTION";for(var v in i)v in f||(f[v]=null);f.class?f.class=rr(f.class):(s||f[_])&&(f.class=null),f[E]&&(f.style??(f.style=null));var g=D(r);for(const t in f){let o=f[t];if(b&&t==="value"&&o==null){r.value=r.__value="",c[t]=o;continue}if(t==="class"){var O=r.namespaceURI==="http://www.w3.org/1999/xhtml";sr(r,O,o,s,i==null?void 0:i[_],f[_]),c[t]=o,c[_]=f[_];continue}if(t==="style"){ur(r,o,i==null?void 0:i[E],f[E]),c[t]=o,c[E]=f[E];continue}var p=c[t];if(o!==p){c[t]=o;var L=t[0]+t[1];if(L!=="$$")if(L==="on"){const d={},N="$$"+t;let n=t.slice(2);var T=m(n);if(J(n)&&(n=n.slice(0,-7),d.capture=!0),!T&&p){if(o!=null)continue;r.removeEventListener(n,c[N],d),c[N]=null}if(o!=null)if(T)r[`__${n}`]=o,W([n]);else{let G=function(H){c[t].call(this,H)};c[N]=Q(n,r,G,d)}else T&&(r[`__${n}`]=void 0)}else if(t==="style")C(r,t,o);else if(t==="autofocus")X(r,!!o);else if(!l&&(t==="__value"||t==="value"&&o!=null))r.value=r.__value=o;else if(t==="selected"&&b)ar(r,o);else{var h=t;e||(h=Z(h));var w=h==="defaultValue"||h==="defaultChecked";if(o==null&&!l&&!w)if(a[t]=null,h==="value"||h==="checked"){let d=r;const N=i===void 0;if(h==="value"){let n=d.defaultValue;d.removeAttribute(h),d.defaultValue=n,d.value=d.__value=N?n:null}else{let n=d.defaultChecked;d.removeAttribute(h),d.defaultChecked=n,d.checked=N?n:!1}}else r.removeAttribute(t);else w||g.includes(h)&&(l||typeof o!="string")?r[h]=o:typeof o!="function"&&C(r,h,o)}}}return A&&P(!0),c}function $(r){return r.__attributes??(r.__attributes={[U]:r.nodeName.includes("-"),[V]:r.namespaceURI===q})}var k=new Map;function D(r){var i=k.get(r.nodeName);if(i)return i;k.set(r.nodeName,i=[]);for(var f,s=r,u=Element.prototype;u!==s;){f=F(s);for(var a in f)f[a].set&&i.push(a);s=z(s)}return i}export{_ as C,C as a,ur as b,sr as c,cr as d,x as e,lr as r,er as s};
