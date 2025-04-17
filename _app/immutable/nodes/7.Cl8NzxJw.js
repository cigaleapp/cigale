import{t as v,a as n,c as B,b as P}from"../chunks/C2IogcR0.js";import{a9 as J,s as R,F as W,f as b,a6 as Y,aa as Z,g as o,c as d,a as c,b as Q,ab as U,r as s,t as I}from"../chunks/BsWIUf9a.js";import{s as j}from"../chunks/Dh4X4SMs.js";import{a as V}from"../chunks/DF75oJVz.js";import{i as S}from"../chunks/m4WIalkB.js";import{e as H}from"../chunks/CUijCxkt.js";import{a as M}from"../chunks/BKfSxfdr.js";import X from"../chunks/tiskVc8I.js";const T=(C,A=Y)=>{var l=B(),F=b(l);H(F,19,()=>A().sort(()=>Math.random()-.5),({url:g,name:p})=>g||p,(g,p,x)=>{let h=()=>o(p).url,w=()=>o(p).name;var f=ee(),m=b(f);{var L=t=>{var e=P(",");n(t,e)};S(m,t=>{o(x)>0&&t(L)})}var u=c(m,2);{var y=t=>{var e=$(),a=d(e,!0);s(e),I(()=>{M(e,"href",h()),j(a,w())}),n(t,e)},k=t=>{var e=P();I(()=>j(e,w())),n(t,e)};S(u,t=>{h()?t(y):t(k,!1)})}n(g,f)}),n(C,l)};var $=v('<a target="_blank"> </a>'),ee=v("<!> <!>",1),ae=v('<dt><a target="_blank"> </a></dt> <dd class="svelte-14virej"> </dd>',1),te=v('<dl class="svelte-14virej"></dl>'),se=v("<p>Impossible de charger les dépendances</p> <p> </p>",1),re=v("<p>Chargement des dépendances…</p>"),de=v(`<header class="svelte-14virej"><!> <div class="text"><h1>C.i.g.a.l.e.</h1> <p class="subtitle svelte-14virej">Classification Intelligente et Gestion des Arthropodes et de L'Entomofaune</p></div></header> <dl class="svelte-14virej"><dt>Développé par</dt> <dd class="svelte-14virej"><!></dd> <dt>Sous la supervision de</dt> <dd class="svelte-14virej"><!></dd> <dt>Dans le cadre d'un</dt> <dd class="svelte-14virej">“Projet long” de l'<a href="https://enseeiht.fr">INP-ENSEEIHT</a></dd> <dt>Code source</dt> <dd class="svelte-14virej"><a href="https://github.com/cigaleapp/cigale">github.com/cigaleapp/cigale</a></dd> <dt>Avec les données</dt> <dd class="svelte-14virej"><dl class="svelte-14virej"><dt>Aides à l'identification</dt> <dd class="svelte-14virej"><a href="https://jessica-joachim.com/identification">Les carnets nature de Jessica</a></dd> <dt>Arbre taxonomique</dt> <dd class="svelte-14virej"><a href="https://techdocs.gbif.org/en/openapi/v1/species#/Searching%20names/searchNames">API de GBIF</a></dd></dl></dd> <dt>Avec les modèles</dt> <dd class="svelte-14virej"><dl class="svelte-14virej"><dt>Détection & recadrage</dt> <dd class="svelte-14virej">YOLO 11n</dd> <dt>Classification</dt> <dd class="svelte-14virej">ResNet50</dd></dl></dd> <dt>Fontes</dt> <dd class="svelte-14virej"><dl class="svelte-14virej"><dt><a href="https://elementtype.co/host-grotesk/">Host Grotesk</a></dt> <dd class="svelte-14virej">par <a href="https://doughkan.com/">Doğukan Karapınar</a> et <a href="https://ibrahimkactioglu.com/">İbrahim Kaçtıoğlu</a>, chez <a href="https://elementtype.co/">Element Type Foundry</a></dd> <dt><a href="https://github.com/weiweihuanghuang/fragment-mono/"><code>Fragment Mono</code></a></dt> <dd class="svelte-14virej"><code>par <a href="https://weiweihuanghuang.github.io/">Wei Huang</a>, chez <a href="https://studiolin.org/projects/374-2/">Studio Lin</a></code></dd></dl></dd> <dt>Icônes</dt> <dd class="svelte-14virej"><a href="https://phosphoricons.com/">Phosphor Icons</a> par <a href="https://helenazhang.com">Helena Zhang</a> et <a href="https://tobiasfried.com">Tobias Fried</a></dd> <dt>Grâce aux bibliothèques</dt> <dd class="svelte-14virej"><!></dd></dl>`,1);function me(C,A){J(A,!0);let l=R(0);W(()=>{const e=setInterval(()=>{Q(l,Math.max(1,o(l)+.03),!0)},10);return()=>{o(l)>=1&&clearInterval(e)}});const F=[{name:"Achraf Khairoun",gitlab:"khairoa"},{name:"Céleste Tiano",gitlab:"tianoc"},{name:"Gaetan Laumonier",gitlab:"laumong"},{name:"Gwenn Le Bihan",gitlab:"gwennlbh",url:"https://gwen.works"},{name:"Ines Charles",gitlab:"charlei"},{name:"Olivier Lamothe",gitlab:"lamotho"}].map(({name:e,gitlab:a,url:r})=>({name:e,url:r??`https://git.inpt.fr/${a}`})),g=[{name:"Axel C.",url:""},{name:"Maxime C.",url:""},{name:"Rémy E.",url:""},{name:"Thomas F.",url:""}];async function p(){return await fetch("https://git.inpt.fr/api/v4/projects/cigale%2Fcigale.pages.inpt.fr/repository/files/package.json/raw").then(a=>a.text()).then(a=>JSON.parse(a)).then(a=>[...Object.entries(a.dependencies),...Object.entries(a.devDependencies)].map(([r,i])=>[r,i.replace("^","")]))}var x=de(),h=b(x),w=d(h);X(w,{get drawpercent(){return o(l)}}),U(2),s(h);var f=c(h,2),m=c(d(f),2),L=d(m);T(L,()=>F),s(m);var u=c(m,4),y=d(u);T(y,()=>g),s(u);var k=c(u,28),t=d(k);V(t,p,e=>{var a=re();n(e,a)},(e,a)=>{var r=te();H(r,21,()=>o(a),([i,_])=>i,(i,_)=>{let G=()=>o(_)[0],z=()=>o(_)[1];var O=ae(),D=b(O),E=d(D),K=d(E,!0);s(E),s(D);var N=c(D,2),q=d(N,!0);s(N),I(()=>{M(E,"href",`https://npmjs.com/package/${G()??""}`),j(K,G()),j(q,z())}),n(i,O)}),s(r),n(e,r)},(e,a)=>{var r=se(),i=c(b(r),2),_=d(i,!0);s(i),I(()=>j(_,o(a))),n(e,r)}),s(k),s(f),n(C,x),Z()}export{me as component};
