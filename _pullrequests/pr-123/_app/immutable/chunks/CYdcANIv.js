import{S as b,aa as D,ab as S,n as v,ac as T,g as m,U as u,b as l,ad as P,_ as A,ae as E,af as K,a1 as L}from"./CvChkXYy.js";function y(i,c=null,M){if(typeof i!="object"||i===null||b in i)return i;const I=K(i);if(I!==D&&I!==S)return i;var a=new Map,o=L(i),x=v(0);o&&a.set("length",v(i.length));var g;return new Proxy(i,{defineProperty(f,e,t){(!("value"in t)||t.configurable===!1||t.enumerable===!1||t.writable===!1)&&E();var n=a.get(e);return n===void 0?(n=v(t.value),a.set(e,n)):l(n,y(t.value,g)),!0},deleteProperty(f,e){var t=a.get(e);if(t===void 0)e in f&&a.set(e,v(u));else{if(o&&typeof e=="string"){var n=a.get("length"),r=Number(e);Number.isInteger(r)&&r<n.v&&l(n,r)}l(t,u),R(x)}return!0},get(f,e,t){var d;if(e===b)return i;var n=a.get(e),r=e in f;if(n===void 0&&(!r||(d=P(f,e))!=null&&d.writable)&&(n=v(y(r?f[e]:u,g)),a.set(e,n)),n!==void 0){var s=m(n);return s===u?void 0:s}return Reflect.get(f,e,t)},getOwnPropertyDescriptor(f,e){var t=Reflect.getOwnPropertyDescriptor(f,e);if(t&&"value"in t){var n=a.get(e);n&&(t.value=m(n))}else if(t===void 0){var r=a.get(e),s=r==null?void 0:r.v;if(r!==void 0&&s!==u)return{enumerable:!0,configurable:!0,value:s,writable:!0}}return t},has(f,e){var s;if(e===b)return!0;var t=a.get(e),n=t!==void 0&&t.v!==u||Reflect.has(f,e);if(t!==void 0||A!==null&&(!n||(s=P(f,e))!=null&&s.writable)){t===void 0&&(t=v(n?y(f[e],g):u),a.set(e,t));var r=m(t);if(r===u)return!1}return n},set(f,e,t,n){var O;var r=a.get(e),s=e in f;if(o&&e==="length")for(var d=t;d<r.v;d+=1){var _=a.get(d+"");_!==void 0?l(_,u):d in f&&(_=v(u),a.set(d+"",_))}r===void 0?(!s||(O=P(f,e))!=null&&O.writable)&&(r=v(void 0),l(r,y(t,g)),a.set(e,r)):(s=r.v!==u,l(r,y(t,g)));var w=Reflect.getOwnPropertyDescriptor(f,e);if(w!=null&&w.set&&w.set.call(n,t),!s){if(o&&typeof e=="string"){var N=a.get("length"),h=Number(e);Number.isInteger(h)&&h>=N.v&&l(N,h+1)}R(x)}return!0},ownKeys(f){m(x);var e=Reflect.ownKeys(f).filter(r=>{var s=a.get(r);return s===void 0||s.v!==u});for(var[t,n]of a)n.v!==u&&!(t in f)&&e.push(t);return e},setPrototypeOf(){T()}})}function R(i,c=1){l(i,i.v+c)}function j(i){return i!==null&&typeof i=="object"&&b in i?i[b]:i}function B(i,c){return Object.is(j(i),j(c))}export{B as i,y as p};
