import{t as p,a as n,c as z,b as N}from"../chunks/B4fTvO1f.js";import{ag as B,G as J,f as b,af as Y,ah as Z,g as d,s as Q,c as o,a as v,b as U,ai as V,r,t as O}from"../chunks/C5da3JO5.js";import{s as j}from"../chunks/CGuacY5z.js";import{a as W}from"../chunks/DOC2QdkI.js";import{i as P}from"../chunks/CfqesXew.js";import{e as K}from"../chunks/sjLvnAiL.js";import{a as M}from"../chunks/oOm2T-ds.js";import{p as X}from"../chunks/CY4eTrAl.js";import $ from"../chunks/B7ZOg_ky.js";const H=(C,D=Y)=>{var i=z(),I=b(i);K(I,19,()=>D().sort(()=>Math.random()-.5),({url:f,name:c})=>f||c,(f,c,x)=>{let h=()=>d(c).url,k=()=>d(c).name;var g=ae(),m=b(g);{var G=t=>{var e=N(",");n(t,e)};P(m,t=>{d(x)>0&&t(G)})}var u=v(m,2);{var L=t=>{var e=ee(),a=o(e,!0);r(e),O(()=>{M(e,"href",h()),j(a,k())}),n(t,e)},w=t=>{var e=N();O(()=>j(e,k())),n(t,e)};P(u,t=>{h()?t(L):t(w,!1)})}n(f,g)}),n(C,i)};var ee=p('<a target="_blank"> </a>'),ae=p("<!> <!>",1),te=p('<dt><a target="_blank"> </a></dt> <dd class="svelte-14virej"> </dd>',1),re=p('<dl class="svelte-14virej"></dl>'),se=p("<p>Impossible de charger les dépendances</p> <p> </p>",1),oe=p("<p>Chargement des dépendances…</p>"),de=p(`<header class="svelte-14virej"><!> <div class="text"><h1>C.i.g.a.l.e.</h1> <p class="subtitle svelte-14virej">Classification Intelligente et Gestion des Arthropodes et de L'Entomofaune</p></div></header> <dl class="svelte-14virej"><dt>Développé par</dt> <dd class="svelte-14virej"><!></dd> <dt>Sous la supervision de</dt> <dd class="svelte-14virej"><!></dd> <dt>Dans le cadre d'un</dt> <dd class="svelte-14virej">“Projet long” de l'<a href="https://enseeiht.fr">INP-ENSEEIHT</a></dd> <dt>Code source</dt> <dd class="svelte-14virej"><a href="https://github.com/cigaleapp/cigale">github.com/cigaleapp/cigale</a></dd> <dt>Avec les modèles</dt> <dd class="svelte-14virej"><dl class="svelte-14virej"><dt>Détection & recadrage</dt> <dd class="svelte-14virej"><a href="TODO">YOLO 11n</a></dd> <dt>Classification</dt> <dd class="svelte-14virej"><a href="TODO">ResNet50</a></dd></dl></dd> <dt>Fontes</dt> <dd class="svelte-14virej"><a href="https://elementtype.co/host-grotesk/">Host Grotesk</a> par Doğukan Karapınar et İbrahim
		Kaçtıoğlu</dd> <dt>Icônes</dt> <dd class="svelte-14virej"><a href="https://phosphoricons.com/">Phosphor Icons</a> par <a href="https://helenazhang.com">Helena Zhang</a> et <a href="https://tobiasfried.com">Tobias Fried</a></dd> <dt>Grâce aux bibliothèques</dt> <dd class="svelte-14virej"><!></dd></dl>`,1);function ge(C,D){B(D,!0);let i=Q(0);J(()=>{const e=setInterval(()=>{U(i,X(Math.max(1,d(i)+.03)))},10);return()=>{d(i)>=1&&clearInterval(e)}});const I=[{name:"Achraf Khairoun",gitlab:"khairoa"},{name:"Céleste Tiano",gitlab:"tianoc"},{name:"Gaetan Laumonier",gitlab:"laumong"},{name:"Gwenn Le Bihan",gitlab:"gwennlbh",url:"https://gwen.works"},{name:"Ines Charles",gitlab:"charlei"},{name:"Olivier Lamothe",gitlab:"lamotho"}].map(({name:e,gitlab:a,url:s})=>({name:e,url:s??`https://git.inpt.fr/${a}`})),f=[{name:"Axel C.",url:""},{name:"Maxime C.",url:""},{name:"Rémy E.",url:""},{name:"Thomas F.",url:""}];async function c(){return await fetch("https://git.inpt.fr/api/v4/projects/cigale%2Fcigale.pages.inpt.fr/repository/files/package.json/raw").then(a=>a.text()).then(a=>JSON.parse(a)).then(a=>[...Object.entries(a.dependencies),...Object.entries(a.devDependencies)].map(([s,l])=>[s,l.replace("^","")]))}var x=de(),h=b(x),k=o(h);$(k,{get drawpercent(){return d(i)}}),V(2),r(h);var g=v(h,2),m=v(o(g),2),G=o(m);H(G,()=>I),r(m);var u=v(m,4),L=o(u);H(L,()=>f),r(u);var w=v(u,24),t=o(w);W(t,c,e=>{var a=oe();n(e,a)},(e,a)=>{var s=re();K(s,21,()=>d(a),([l,_])=>l,(l,_)=>{let E=()=>d(_)[0],S=()=>d(_)[1];var A=te(),T=b(A),y=o(T),R=o(y,!0);r(y),r(T);var F=v(T,2),q=o(F,!0);r(F),O(()=>{M(y,"href",`https://npmjs.com/package/${E()??""}`),j(R,E()),j(q,S())}),n(l,A)}),r(s),n(e,s)},(e,a)=>{var s=se(),l=v(b(s),2),_=o(l,!0);r(l),O(()=>j(_,d(a))),n(e,s)}),r(w),r(g),n(C,x),Z()}export{ge as component};
