var A=Object.getPrototypeOf;var C=Reflect.get;var $=n=>{throw TypeError(n)};var j=(n,u,e)=>u.has(n)||$("Cannot "+e);var s=(n,u,e)=>(j(n,u,"read from private field"),e?e.call(n):u.get(n)),d=(n,u,e)=>u.has(n)?$("Cannot add the same private member more than once"):u instanceof WeakSet?u.add(n):u.set(n,e);var w=(n,u,e)=>(j(n,u,"access private method"),e);var q=(n,u,e)=>C(A(n),e,u);import{p as G}from"./BYruc9P9.js";import{b as L}from"./gSEnYYGb.js";import{b as f,n as c,g as a}from"./DvvCRPia.js";function v(n){f(n,n.v+1)}var H=["forEach","isDisjointFrom","isSubsetOf","isSupersetOf"],J=["difference","intersection","symmetricDifference","union"],B=!1,m,o,g,y,M;const E=class E extends Set{constructor(e){super();d(this,y);d(this,m,new Map);d(this,o,c(0));d(this,g,c(0));if(e){for(var r of e)super.add(r);s(this,g).v=super.size}B||w(this,y,M).call(this)}has(e){var r=super.has(e),t=s(this,m),i=t.get(e);if(i===void 0){if(!r)return a(s(this,o)),!1;i=c(!0),t.set(e,i)}return a(i),r}add(e){return super.has(e)||(super.add(e),f(s(this,g),super.size),v(s(this,o))),this}delete(e){var r=super.delete(e),t=s(this,m),i=t.get(e);return i!==void 0&&(t.delete(e),f(i,!1)),r&&(f(s(this,g),super.size),v(s(this,o))),r}clear(){if(super.size!==0){super.clear();var e=s(this,m);for(var r of e.values())f(r,!1);e.clear(),f(s(this,g),0),v(s(this,o))}}keys(){return this.values()}values(){return a(s(this,o)),super.values()}entries(){return a(s(this,o)),super.entries()}[Symbol.iterator](){return this.keys()}get size(){return a(s(this,g))}};m=new WeakMap,o=new WeakMap,g=new WeakMap,y=new WeakSet,M=function(){B=!0;var e=E.prototype,r=Set.prototype;for(const t of H)e[t]=function(...i){return a(s(this,o)),r[t].apply(this,i)};for(const t of J)e[t]=function(...i){a(s(this,o));var _=r[t].apply(this,i);return new E(_)}};let D=E;var h,p,l,z,S;const I=class I extends Map{constructor(e){super();d(this,z);d(this,h,new Map);d(this,p,c(0));d(this,l,c(0));if(e){for(var[r,t]of e)super.set(r,t);s(this,l).v=super.size}}has(e){var r=s(this,h),t=r.get(e);if(t===void 0){var i=super.get(e);if(i!==void 0)t=c(0),r.set(e,t);else return a(s(this,p)),!1}return a(t),!0}forEach(e,r){w(this,z,S).call(this),super.forEach(e,r)}get(e){var r=s(this,h),t=r.get(e);if(t===void 0){var i=super.get(e);if(i!==void 0)t=c(0),r.set(e,t);else{a(s(this,p));return}}return a(t),super.get(e)}set(e,r){var P;var t=s(this,h),i=t.get(e),_=super.get(e),N=super.set(e,r),b=s(this,p);if(i===void 0)t.set(e,c(0)),f(s(this,l),super.size),v(b);else if(_!==r){v(i);var O=b.reactions===null?null:new Set(b.reactions),R=O===null||!((P=i.reactions)!=null&&P.every(U=>O.has(U)));R&&v(b)}return N}delete(e){var r=s(this,h),t=r.get(e),i=super.delete(e);return t!==void 0&&(r.delete(e),f(s(this,l),super.size),f(t,-1),v(s(this,p))),i}clear(){if(super.size!==0){super.clear();var e=s(this,h);f(s(this,l),0);for(var r of e.values())f(r,-1);v(s(this,p)),e.clear()}}keys(){return a(s(this,p)),super.keys()}values(){return w(this,z,S).call(this),super.values()}entries(){return w(this,z,S).call(this),super.entries()}[Symbol.iterator](){return this.entries()}get size(){return a(s(this,l)),super.size}};h=new WeakMap,p=new WeakMap,l=new WeakMap,z=new WeakSet,S=function(){a(s(this,p));var e=s(this,h);if(s(this,l).v!==e.size)for(var r of q(I.prototype,this,"keys").call(this))e.has(r)||e.set(r,c(0));for(var[,t]of s(this,h))a(t)};let x=I;const W=G({processing:{total:0,done:0,time:0,state:"",get progress(){return this.total?this.done/this.total:0}},selection:[],previewURLs:new x,erroredImages:new x,loadingImages:new D,keybinds:{},currentProtocol:"",setSelection:void 0});console.info(`Base path is ${L}`);var F;const X=(F=/cigale\/_pullrequests\/pr-(\d+)$/.exec(L))==null?void 0:F[1];export{x as S,D as a,X as p,W as u};
