import{t as v,a as n,c as R,b as F}from"../chunks/CCZ_fMQU.js";import{af as z,B as J,f as b,ae as Y,ag as Z,g as o,s as Q,c as d,a as p,b as U,ah as V,r,t as I}from"../chunks/Bp-bnYO3.js";import{s as j}from"../chunks/DssHOt8e.js";import{a as W}from"../chunks/BSADJTd1.js";import{i as H}from"../chunks/D_KrK0IG.js";import{e as S}from"../chunks/CVyNc7-z.js";import{s as K}from"../chunks/R-I5KeFT.js";import{p as X}from"../chunks/CbzaXEtW.js";import $ from"../chunks/DOohY6Dm.js";const P=(O,C=Y)=>{var i=R(),D=b(i);S(D,19,()=>C().sort(()=>Math.random()-.5),({url:f,name:c})=>f||c,(f,c,x)=>{let h=()=>o(c).url,k=()=>o(c).name;var g=ae(),m=b(g);{var E=t=>{var e=F(",");n(t,e)};H(m,t=>{o(x)>0&&t(E)})}var u=p(m,2);{var T=t=>{var e=ee(),a=d(e,!0);r(e),I(()=>{K(e,"href",h()),j(a,k())}),n(t,e)},w=t=>{var e=F();I(()=>j(e,k())),n(t,e)};H(u,t=>{h()?t(T):t(w,!1)})}n(f,g)}),n(O,i)};var ee=v('<a target="_blank"> </a>'),ae=v("<!> <!>",1),te=v('<dt><a target="_blank"> </a></dt> <dd class="svelte-14virej"> </dd>',1),re=v('<dl class="svelte-14virej"></dl>'),se=v("<p>Impossible de charger les dépendances</p> <p> </p>",1),de=v("<p>Chargement des dépendances…</p>"),oe=v(`<header class="svelte-14virej"><!> <div class="text"><h1>C.i.g.a.l.e.</h1> <p class="subtitle svelte-14virej">Classification Intelligente et Gestion des Arthropodes et de L'Entomofaune</p></div></header> <dl class="svelte-14virej"><dt>Développé par</dt> <dd class="svelte-14virej"><!></dd> <dt>Sous la supervision de</dt> <dd class="svelte-14virej"><!></dd> <dt>Dans le cadre d'un</dt> <dd class="svelte-14virej">“Projet long” de l'<a href="https://enseeiht.fr">INP-ENSEEIHT</a></dd> <dt>Code source</dt> <dd class="svelte-14virej"><a href="https://git.inpt.fr/cigale/cigale.pages.inpt.fr">git.inpt.fr/cigale/app</a> <br> <a href="https://github.com/cigaleapp/cigale">github.com/cigaleapp/cigale</a> (mirroir)</dd> <dt>Gentillement hébergé par</dt> <dd class="svelte-14virej"><a href="https://net7.dev">net7</a>, l'association étudiante informatique de l'ENSEEIHT</dd> <dt>Avec les modèles</dt> <dd class="svelte-14virej"><dl class="svelte-14virej"><dt>Détection & recadrage</dt> <dd class="svelte-14virej"><a href="TODO">YOLO 11n</a></dd> <dt>Classification</dt> <dd class="svelte-14virej"><a href="TODO">ResNet50</a></dd></dl></dd> <dt>Fontes</dt> <dd class="svelte-14virej"><a href="https://elementtype.co/host-grotesk/">Host Grotesk</a> par Doğukan Karapınar et İbrahim
		Kaçtıoğlu</dd> <dt>Icônes</dt> <dd class="svelte-14virej"><a href="https://phosphoricons.com/">Phosphor Icons</a> par <a href="https://helenazhang.com">Helena Zhang</a> et <a href="https://tobiasfried.com">Tobias Fried</a></dd> <dt>Grâce aux bibliothèques</dt> <dd class="svelte-14virej"><!></dd></dl>`,1);function ge(O,C){z(C,!0);let i=Q(0);J(()=>{const e=setInterval(()=>{U(i,X(Math.max(1,o(i)+.03)))},10);return()=>{o(i)>=1&&clearInterval(e)}});const D=[{name:"Achraf Khairoun",gitlab:"khairoa"},{name:"Céleste Tiano",gitlab:"tianoc"},{name:"Gaetan Laumonier",gitlab:"laumong"},{name:"Gwenn Le Bihan",gitlab:"gwennlbh",url:"https://gwen.works"},{name:"Ines Charles",gitlab:"charlei"},{name:"Olivier Lamothe",gitlab:"lamotho"}].map(({name:e,gitlab:a,url:s})=>({name:e,url:s??`https://git.inpt.fr/${a}`})),f=[{name:"Axel C.",url:""},{name:"Maxime C.",url:""},{name:"Rémy E.",url:""},{name:"Thomas F.",url:""}];async function c(){return await fetch("https://git.inpt.fr/api/v4/projects/cigale%2Fcigale.pages.inpt.fr/repository/files/package.json/raw").then(a=>a.text()).then(a=>JSON.parse(a)).then(a=>[...Object.entries(a.dependencies),...Object.entries(a.devDependencies)].map(([s,l])=>[s,l.replace("^","")]))}var x=oe(),h=b(x),k=d(h);$(k,{get drawpercent(){return o(i)}}),V(2),r(h);var g=p(h,2),m=p(d(g),2),E=d(m);P(E,()=>D),r(m);var u=p(m,4),T=d(u);P(T,()=>f),r(u);var w=p(u,28),t=d(w);W(t,c,e=>{var a=de();n(e,a)},(e,a)=>{var s=re();S(s,21,()=>o(a),([l,_])=>l,(l,_)=>{let y=()=>o(_)[0],M=()=>o(_)[1];var N=te(),G=b(N),L=d(G),q=d(L,!0);r(L),r(G);var A=p(G,2),B=d(A,!0);r(A),I(()=>{K(L,"href",`https://npmjs.com/package/${y()??""}`),j(q,y()),j(B,M())}),n(l,N)}),r(s),n(e,s)},(e,a)=>{var s=se(),l=p(b(s),2),_=d(l,!0);r(l),I(()=>j(_,o(a))),n(e,s)}),r(w),r(g),n(O,x),Z()}export{ge as component};
