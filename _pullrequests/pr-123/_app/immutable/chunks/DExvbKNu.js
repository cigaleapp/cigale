import{p as U,t as g,a as f,c as W}from"./DirNOW_J.js";import{ai as Y,c as i,r as a,a as d,g as A,O as Z,ah as $,t as M,aj as ee,f as te}from"./CvChkXYy.js";import{d as ae,s as C}from"./W4LgCGT5.js";import{i as S}from"./GN9BvXTj.js";import{e as re}from"./C52KabVt.js";import{a as V,t as X}from"./Bf-NY11d.js";import{a as q,c as ie}from"./Bslt43vv.js";import{p as z}from"./DRRPJw_Y.js";import{C as oe}from"./zThcCK60.js";import{X as se}from"./BcZap8vb.js";import ne from"./BgISzq-T.js";const B=(h,e=$)=>{var v=W(),r=te(v);{var u=s=>{var o=le();let m;var w=i(o);a(o),M(y=>{m=ie(o,"",m,{color:`var(--fg-${(e()<.25?"error":e()<.5?"warning":e()<.95?"neutral":"success")??""})`}),C(w,`${y??""}%`)},[()=>Math.round(e()*100).toString().padStart(3," ")]),f(s,o)};S(r,s=>{e()&&e()>0&&e()<1&&s(u)})}f(h,v)};var le=g('<code class="confidence"> </code>'),ve=(h,e,v)=>{e()&&(e(void 0),v()(void 0))},ce=(h,e,v,r,u)=>{var s,o;e({value:JSON.parse(v()),confidence:r(),alternatives:((s=e())==null?void 0:s.alternatives)??{}}),u()((o=e())==null?void 0:o.value)},de=g('<li><div class="value svelte-es3752"> </div> <!> <button class="svelte-es3752"><!></button></li>'),_e=g('<section class="alternatives"><div class="title">Alternatives</div> <ul class="options"></ul></section>'),fe=g("<p> </p>"),ue=g('<a target="_blank">En savoir plus</a>'),me=g('<section class="learnmore"><!> <!></section>'),pe=g('<div class="metadata svelte-es3752"><section class="first-line svelte-es3752"><label class="svelte-es3752"> </label> <div class="value svelte-es3752"><!> <!> <button class="clear svelte-es3752"><!></button></div></section> <!> <!></div>');function we(h,e){const v=U();Y(e,!0);let r=z(e,"value",7),u=z(e,"onchange",3,()=>{});var s=pe(),o=i(s),m=i(o);q(m,"for",v);var w=i(m,!0);a(m);var y=d(m,2),D=i(y);const F=Z(()=>{var t;return(t=r())==null?void 0:t.value});ne(D,{id:v,get definition(){return e.definition},get value(){return A(F)},get onblur(){return u()}});var E=d(D,2);B(E,()=>{var t;return(t=r())==null?void 0:t.confidence});var k=d(E,2);k.__click=[ve,r,u];var G=i(k);se(G,{}),a(k),V(k,(t,c)=>{var _;return(_=X)==null?void 0:_(t,c)},()=>"Supprimer cette valeur"),a(y),a(o);var I=d(o,2);{var H=t=>{var c=_e(),_=d(i(c),2);re(_,21,()=>Object.entries(r().alternatives).sort(([,p],[,b])=>b-p),([p,b])=>p,(p,b)=>{let O=()=>A(b)[0],n=()=>A(b)[1];var l=de(),x=i(l),P=i(x,!0);a(x);var J=d(x,2);B(J,n);var j=d(J,2);j.__click=[ce,r,O,n,u];var Q=i(j);oe(Q,{}),a(j),V(j,(R,T)=>{var N;return(N=X)==null?void 0:N(R,T)},()=>"Sélectionner cette valeur"),a(l),M(()=>C(P,O())),f(p,l)}),a(_),a(c),f(t,c)};S(I,t=>{r()&&Object.keys(r().alternatives).length>0&&t(H)})}var K=d(I,2);{var L=t=>{var c=me(),_=i(c);{var p=n=>{var l=fe(),x=i(l,!0);a(l),M(()=>C(x,e.definition.description)),f(n,l)};S(_,n=>{e.definition.description&&n(p)})}var b=d(_,2);{var O=n=>{var l=ue();M(()=>q(l,"href",e.definition.learnMore)),f(n,l)};S(b,n=>{e.definition.learnMore&&n(O)})}a(c),f(t,c)};S(K,t=>{(e.definition.description||e.definition.learnMore)&&t(L)})}a(s),M(()=>{C(w,e.definition.label||e.definition.id),k.disabled=!r()}),f(h,s),ee()}ae(["click"]);export{we as default};
