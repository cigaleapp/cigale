import{ad as w,ae as Y,af as j,ag as E,P as C,ah as G,g as p,ai as K,aj as M,b as N,o as U,C as A,ak as $,S as D,al as L,G as z,am as V,an as Z,ao as d,ap as F}from"./BsWIUf9a.js";let P=!1;function H(e){var r=P;try{return P=!1,[e(),P]}finally{P=r}}const J={get(e,r){if(!e.exclude.includes(r))return e.props[r]},set(e,r){return!1},getOwnPropertyDescriptor(e,r){if(!e.exclude.includes(r)&&r in e.props)return{enumerable:!0,configurable:!0,value:e.props[r]}},has(e,r){return e.exclude.includes(r)?!1:r in e.props},ownKeys(e){return Reflect.ownKeys(e.props).filter(r=>!e.exclude.includes(r))}};function X(e,r,t){return new Proxy({props:e,exclude:r},J)}const Q={get(e,r){let t=e.props.length;for(;t--;){let n=e.props[t];if(d(n)&&(n=n()),typeof n=="object"&&n!==null&&r in n)return n[r]}},set(e,r,t){let n=e.props.length;for(;n--;){let i=e.props[n];d(i)&&(i=i());const u=w(i,r);if(u&&u.set)return u.set(t),!0}return!1},getOwnPropertyDescriptor(e,r){let t=e.props.length;for(;t--;){let n=e.props[t];if(d(n)&&(n=n()),typeof n=="object"&&n!==null&&r in n){const i=w(n,r);return i&&!i.configurable&&(i.configurable=!0),i}}},has(e,r){if(r===D||r===L)return!1;for(let t of e.props)if(d(t)&&(t=t()),t!=null&&r in t)return!0;return!1},ownKeys(e){const r=[];for(let t of e.props){d(t)&&(t=t());for(const n in t)r.includes(n)||r.push(n)}return r}};function k(...e){return new Proxy({props:e},Q)}function y(e){var r;return((r=e.ctx)==null?void 0:r.d)??!1}function ee(e,r,t,n){var R;var i=(t&Z)!==0,u=!z||(t&V)!==0,v=(t&$)!==0,T=(t&F)!==0,I=!1,l;v?[l,I]=H(()=>e[r]):l=e[r];var q=D in e||L in e,c=v&&(((R=w(e,r))==null?void 0:R.set)??(q&&r in e&&(s=>e[r]=s)))||void 0,f=n,h=!0,b=!1,x=()=>(b=!0,h&&(h=!1,T?f=A(n):f=n),f);l===void 0&&n!==void 0&&(c&&u&&Y(),l=x(),c&&c(l));var o;if(u)o=()=>{var s=e[r];return s===void 0?x():(h=!0,b=!1,s)};else{var O=(i?E:C)(()=>e[r]);O.f|=j,o=()=>{var s=p(O);return s!==void 0&&(f=void 0),s===void 0?f:s}}if((t&G)===0)return o;if(c){var B=e.$$legacy;return function(s,_){return arguments.length>0?((!u||!_||B||I)&&c(_?o():s),s):o()}}var S=!1,g=U(l),a=E(()=>{var s=o(),_=p(g);return S?(S=!1,_):g.v=s});return v&&p(a),i||(a.equals=K),function(s,_){if(arguments.length>0){const m=_?p(a):u&&v?M(s):s;if(!a.equals(m)){if(S=!0,N(g,m),b&&f!==void 0&&(f=m),y(a))return s;A(()=>p(a))}return s}return y(a)?a.v:p(a)}}export{ee as p,X as r,k as s};
