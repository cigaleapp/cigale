import{n as se,a as _,p as le,t as g,b as ve}from"./C2IogcR0.js";import{t as j,a9 as ce,c as v,r as o,a as f,a8 as q,g as m,aa as de,f as fe}from"./BsWIUf9a.js";import{d as ue,s as C}from"./Dh4X4SMs.js";import{i as h}from"./m4WIalkB.js";import{e as _e}from"./DwKQaEPv.js";import{a as V,t as A}from"./CcIq_Gf4.js";import{s as me,a as D}from"./BKfSxfdr.js";import{r as ge,p as F}from"./COZIH9cg.js";import{C as pe}from"./gERSC6UT.js";import{W as be}from"./Dt0JPg2o.js";import{X as xe}from"./BSKLeM20.js";import G from"./CodSFZtC.js";import{i as he}from"./BjN2kW9_.js";import je from"./fCunJYNe.js";import{g as we}from"./DYN9-Dgt.js";import{q as E}from"./64b2i2KL.js";var Me=se('<svg><path fill="currentColor" d="M230.91 172a8 8 0 0 1-2.91 10.91l-96 56a8 8 0 0 1-8.06 0l-96-56A8 8 0 0 1 36 169.09l92 53.65l92-53.65a8 8 0 0 1 10.91 2.91M220 121.09l-92 53.65l-92-53.65a8 8 0 0 0-8 13.82l96 56a8 8 0 0 0 8.06 0l96-56a8 8 0 1 0-8.06-13.82M24 80a8 8 0 0 1 4-6.91l96-56a8 8 0 0 1 8.06 0l96 56a8 8 0 0 1 0 13.82l-96 56a8 8 0 0 1-8.06 0l-96-56A8 8 0 0 1 24 80m23.88 0L128 126.74L208.12 80L128 33.26Z"></path></svg>');function ke(k,a){const p=ge(a,["$$slots","$$events","$$legacy"]);var r=Me();let b;j(()=>b=me(r,b,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...p})),_(k,r)}var Se=g('<div class="technical-indicator"><!></div> <code> </code>',1),Oe=g('<div class="merged-indicator svelte-acxwj1"><!></div>'),ye=(k,a,p)=>{a()&&(a(void 0),p()(void 0))},Ce=(k,a,p,r,b)=>{var w,M;a({value:JSON.parse(p()),confidence:r(),alternatives:((w=a())==null?void 0:w.alternatives)??{}}),b()((M=a())==null?void 0:M.value)},Ve=g('<li class="svelte-acxwj1"><div class="value svelte-acxwj1"> </div> <!> <button class="svelte-acxwj1"><!></button></li>'),Ae=g('<section class="alternatives svelte-acxwj1"><div class="title svelte-acxwj1">Alternatives</div> <ul class="options svelte-acxwj1"></ul></section>'),Je=g("<p> </p>"),Le=g('<a target="_blank">En savoir plus</a>'),Ne=g('<section class="learnmore"><!> <!></section>'),qe=g("<pre> </pre>"),Ee=g('<div class="metadata svelte-acxwj1"><section class="first-line svelte-acxwj1"><label class="svelte-acxwj1"><!></label> <div class="value svelte-acxwj1"><!> <!> <!> <button class="clear svelte-acxwj1"><!></button></div></section> <!> <!> <!></div>');function Ye(k,a){const p=le();ce(a,!0);let r=F(a,"value",7),b=F(a,"onchange",3,()=>{});var w=Ee(),M=v(w),J=v(M);D(J,"for",p);var H=v(J);{var K=e=>{var t=ve();j(()=>C(t,a.definition.label)),_(e,t)},Q=e=>{var t=Se(),i=fe(t),n=v(i);be(n,{}),o(i),V(i,(s,d)=>{var x;return(x=A)==null?void 0:x(s,d)},()=>"Métadonnée technique");var c=f(i,2),u=v(c,!0);o(c),j(()=>C(u,a.definition.id)),_(e,t)};h(H,e=>{a.definition.label?e(K):e(Q,!1)})}o(J);var P=f(J,2),T=v(P);const R=q(()=>{var e;return(e=r())==null?void 0:e.value}),U=q(()=>{var e,t,i,n;return Object.fromEntries([...Object.entries(((e=r())==null?void 0:e.alternatives)??{}).map(([c,u])=>{var s;return[(s=E(c))==null?void 0:s.toString(),u]}),[(i=E((t=r())==null?void 0:t.value))==null?void 0:i.toString(),(n=r())==null?void 0:n.confidence]])});je(T,{id:p,get definition(){return a.definition},get value(){return m(R)},get onblur(){return b()},get merged(){return a.merged},get confidences(){return m(U)}});var W=f(T,2);{var Y=e=>{G(e,{get value(){return r().confidence}})};h(W,e=>{var t;(t=r())!=null&&t.confidence&&e(Y)})}var B=f(W,2);{var $=e=>{var t=Oe(),i=v(t);ke(i,{}),o(t),V(t,(n,c)=>{var u;return(u=A)==null?void 0:u(n,c)},()=>"Valeur issue de la fusion de plusieurs valeurs différentes. Modifier cette valeur pour modifier toutes les valeurs de la sélection"),_(e,t)};h(B,e=>{a.merged&&e($)})}var S=f(B,2);S.__click=[ye,r,b];var ee=v(S);xe(ee,{}),o(S),V(S,(e,t)=>{var i;return(i=A)==null?void 0:i(e,t)},()=>"Supprimer cette valeur"),o(P),o(M);var I=f(M,2);{var te=e=>{var t=Ae(),i=f(v(t),2);_e(i,21,()=>Object.entries(r().alternatives).sort(([,n],[,c])=>c-n),([n,c])=>n,(n,c)=>{let u=()=>m(c)[0],s=()=>m(c)[1];var d=Ve();const x=q(()=>{var l;return(l=E(u()))==null?void 0:l.toString()}),Z=q(()=>{var l;return he("enum",a.definition.type,m(x))?(l=a.definition.options)==null?void 0:l.find(({key:O})=>O===m(x)):void 0});var L=v(d),ne=v(L,!0);o(L),V(L,(l,O)=>{var y;return(y=A)==null?void 0:y(l,O)},()=>{var l;return(l=m(Z))==null?void 0:l.description});var z=f(L,2);G(z,{get value(){return s()}});var N=f(z,2);N.__click=[Ce,r,u,s,b];var oe=v(N);pe(oe,{}),o(N),V(N,(l,O)=>{var y;return(y=A)==null?void 0:y(l,O)},()=>"Sélectionner cette valeur"),o(d),j(()=>{var l;return C(ne,((l=m(Z))==null?void 0:l.label)||m(x))}),_(n,d)}),o(i),o(t),_(e,t)};h(I,e=>{r()&&Object.keys(r().alternatives).length>0&&e(te)})}var X=f(I,2);{var ae=e=>{var t=Ne(),i=v(t);{var n=s=>{var d=Je(),x=v(d,!0);o(d),j(()=>C(x,a.definition.description)),_(s,d)};h(i,s=>{a.definition.description&&s(n)})}var c=f(i,2);{var u=s=>{var d=Le();j(()=>D(d,"href",a.definition.learnMore)),_(s,d)};h(c,s=>{a.definition.learnMore&&s(u)})}o(t),_(e,t)};h(X,e=>{(a.definition.description||a.definition.learnMore)&&e(ae)})}var ie=f(X,2);{var re=e=>{var t=qe(),i=v(t,!0);o(t),j(n=>C(i,n),[()=>JSON.stringify({id:a.definition.id,value:r()},null,2)]),_(e,t)};h(ie,e=>{we().showTechnicalMetadata&&e(re)})}o(w),j(()=>S.disabled=!r()),_(k,w),de()}ue(["click"]);export{Ye as default};
