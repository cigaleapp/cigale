import{n as ve,a as r,t as p,b as J,c as ge}from"../chunks/DVHRhNjq.js";import{t as j,ae as Pe,s as G,f as h,g as e,af as xe,a as c,c as m,b as K,ag as P,r as n,ac as be}from"../chunks/je5hudcr.js";import{s as y}from"../chunks/rhXEw3QH.js";import{i as V}from"../chunks/CZpreLed.js";import{e as Q}from"../chunks/BOy7pdjG.js";import{a as je,t as we}from"../chunks/DDmqFdpi.js";import{s as pe,a as W}from"../chunks/CSTXPE61.js";import{base as F}from"../chunks/cafVxeXe.js";import z from"../chunks/CC0qxDGr.js";import ye from"../chunks/nfNp3OCH.js";import Se from"../chunks/CYcK52XP.js";import{o as Me,t as ie}from"../chunks/C9uHGDdK.js";import{p as ke,j as Ce,i as Ae,d as ne,e as De}from"../chunks/Dt42o1aI.js";import Te from"../chunks/BiTNi1rt.js";import{t as H}from"../chunks/CwvyXnNp.js";import{r as me}from"../chunks/B3DmaASf.js";import{D as ce}from"../chunks/C9BslBmU.js";import{D as Ne}from"../chunks/cES6x9c_.js";import{T as Oe}from"../chunks/DI0olKhS.js";import Be from"../chunks/Cl2o74m-.js";var Ie=ve('<svg><path fill="currentColor" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m0 192a88 88 0 1 1 88-88a88.1 88.1 0 0 1-88 88m48-88a8 8 0 0 1-8 8h-32v32a8 8 0 0 1-16 0v-32H88a8 8 0 0 1 0-16h32V88a8 8 0 0 1 16 0v32h32a8 8 0 0 1 8 8"></path></svg>');function Le(T,N){const O=me(N,["$$slots","$$events","$$legacy"]);var $=Ie();let w;j(()=>w=pe($,w,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...O})),r(T,$)}var Ve=ve('<svg><path fill="currentColor" d="m229.66 109.66l-48 48a8 8 0 0 1-11.32-11.32L204.69 112H165a88 88 0 0 0-85.23 66a8 8 0 0 1-15.5-4A103.94 103.94 0 0 1 165 96h39.71l-34.37-34.34a8 8 0 0 1 11.32-11.32l48 48a8 8 0 0 1 0 11.32M192 208H40V88a8 8 0 0 0-16 0v128a8 8 0 0 0 8 8h160a8 8 0 0 0 0-16"></path></svg>');function ze(T,N){const O=me(N,["$$slots","$$events","$$legacy"]);var $=Ve();let w;j(()=>w=pe($,w,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...O})),r(T,$)}var He=p("<!> Format JSON",1),Je=p("<!> Format YAML",1),Fe=p('<section class="actions svelte-fvemj5"><!> <!></section>'),Re=p(`<p>Pour l'instant, C.i.g.a.l.e ne permet pas de créer ou modifier des protocoles dans l'interface</p> <p>Cependant, les protocoles sont représentables par des fichiers de configuration JSON ou YAML</p> <p>Vous pouvez télécharger un modèle de protocole vide pour vous faciliter la tâche</p> <p>Sachant qu'un <a>JSON Schema</a> est déclaré dans ces fichiers, la plupart
		des éditeurs de code modernes vous proposeront de l'autocomplétion et de la documentation</p> <p>Vous pourrez ensuite importer votre protocole ici. Si vous voulez le modifier par la suite, il
		suffit de l'exporter, modifier le fichier, et réimporter</p>`,1),Ye=p("<!> Importer",1),qe=p("<!> Créer",1),Ee=p("<p><a> </a></p>"),Ue=p(" <a> </a>)",1),Ge=p("<p>Par <!></p>"),Ke=p("<li><!></li>"),Qe=p('<p>Par</p> <ul class="svelte-fvemj5"></ul>',1),We=p("<li> <!></li>"),Xe=p("<!> Exporter",1),Ze=p("<!> Supprimer",1),et=p('<header class="svelte-fvemj5"><h2> </h2> <!> <!></header> <section class="metadata svelte-fvemj5"><p> </p> <ul class="svelte-fvemj5"></ul></section> <section class="actions svelte-fvemj5"><!> <!></section>',1),tt=p("<li><!></li>"),ot=p('<!> <!> <header class="svelte-fvemj5"><h1 class="svelte-fvemj5">Protocoles</h1> <section class="actions svelte-fvemj5"><!> <!></section></header> <ul class="protocoles svelte-fvemj5"></ul>',1);function jt(T,N){Pe(N,!0);function O(t,o){return t.filter(a=>o.metadata.includes(a.id))}let $=G(void 0),w=G(void 0),R=G(void 0);var X=ot(),Z=h(X);Be(Z,{key:"download-protocol-template",title:"Créer un protocole",get open(){return e(R)},set open(o){K(R,o,!0)},footer:(o,a)=>{let g=()=>a==null?void 0:a().close;var S=Fe(),B=m(S);ye(B,{onclick:async()=>{var f;await ne(F,"json"),(f=g())==null||f()},children:(f,I)=>{var M=He(),D=h(M);ce(D,{}),P(),r(f,M)},$$slots:{default:!0}});var A=c(B,2);z(A,{onclick:async()=>{var f;await ne(F,"yaml"),(f=g())==null||f()},children:(f,I)=>{var M=Je(),D=h(M);ce(D,{}),P(),r(f,M)},$$slots:{default:!0}}),n(S),r(o,S)},children:(o,a)=>{var g=Re(),S=c(h(g),6),B=c(m(S));P(),n(S),P(2),j(A=>W(B,"href",A),[()=>Ce(F)]),r(o,g)},$$slots:{footer:!0,default:!0}});var ee=c(Z,2);Te(ee,{title:"Êtes-vous sûr·e?",key:"delete-protocol",cancel:"Annuler",confirm:"Oui, supprimer",onconfirm:async()=>{await Me(["Protocol","Metadata"],{},t=>{if(!e($))return;t.objectStore("Protocol").delete(e($).id);const o=e($).metadata.filter(a=>Ae(e($).id,a));for(const a of o)t.objectStore("Metadata").delete(a)}),H.success("Protocole supprimé")},get open(){return e(w)},set open(t){K(w,t,!0)},children:(t,o)=>{P();var a=J("Il est impossible de revenir en arrière après avoir supprimé un protocole.");r(t,a)},$$slots:{default:!0}});var Y=c(ee,2),te=c(m(Y),2),oe=m(te);z(oe,{onclick:async()=>{await ke({allowMultiple:!0}).catch(t=>H.error(t)).then(t=>{!t||typeof t=="string"||t.length===0||(t.length===1?H.success(`Protocole “${t[0].name}” importé`):H.success(`${t.length} protocoles importés`))})},children:(t,o)=>{var a=Ye(),g=h(a);Ne(g,{}),P(),r(t,a)},$$slots:{default:!0}});var de=c(oe,2);z(de,{onclick:()=>{var t;return(t=e(R))==null?void 0:t()},children:(t,o)=>{var a=qe(),g=h(a);Le(g,{}),P(),r(t,a)},$$slots:{default:!0}}),n(te),n(Y);var re=c(Y,2);Q(re,21,()=>ie.Protocol.state,t=>t.id,(t,o)=>{var a=tt(),g=m(a);Se(g,{children:(S,B)=>{var A=et(),f=h(A),I=m(f),M=m(I,!0);n(I);var D=c(I,2);{var ue=s=>{var l=Ee(),v=m(l),x=m(v,!0);n(v),n(l),j(L=>{W(v,"href",e(o).source),y(x,L)},[()=>e(o).source.replace("https://","")]),r(s,l)};V(D,s=>{e(o).source&&s(ue)})}var fe=c(D,2);{var _e=s=>{var l=ge();const v=(b,i=be)=>{P();var u=Ue(),d=h(u),k=c(d),_=m(k,!0);n(k),P(),j(()=>{y(d,`${i().name??""}
							(`),W(k,"href",`mailto:${i().email??""}`),y(_,i().email)}),r(b,u)};var x=h(l);{var L=b=>{var i=Ge(),u=c(m(i));v(u,()=>e(o).authors[0]),n(i),r(b,i)},U=b=>{var i=Qe(),u=c(h(i),2);Q(u,21,()=>e(o).authors,d=>d.email,(d,k)=>{var _=Ke(),C=m(_);v(C,()=>e(k)),n(_),r(d,_)}),n(u),r(b,i)};V(x,b=>{e(o).authors.length===1?b(L):b(U,!1)})}r(s,l)};V(fe,s=>{e(o).authors.length&&s(_e)})}n(f);var q=c(f,2),E=m(q),he=m(E);n(E);var ae=c(E,2);Q(ae,21,()=>O(ie.Metadata.state,e(o)),s=>s.id,(s,l)=>{var v=We(),x=m(v),L=c(x);{var U=i=>{var u=J();j(d=>y(u,`(${d??""})`),[()=>e(l).options.map(d=>d.label).slice(0,5).join(", ")]),r(i,u)},b=(i,u)=>{{var d=_=>{var C=J();j(()=>y(C,`(${e(l).options.length??""} options)`)),r(_,C)},k=_=>{var C=J();j(()=>y(C,`(${e(l).type??""})`)),r(_,C)};V(i,_=>{e(l).type==="enum"&&e(l).options?_(d):_(k,!1)},u)}};V(L,i=>{e(l).type==="enum"&&e(l).options&&e(l).options.length<=5?i(U):i(b,!1)})}n(v),je(v,(i,u)=>{var d;return(d=we)==null?void 0:d(i,u)},()=>`ID: ${e(l).id}`),j(()=>y(x,`${e(l).label??""} `)),r(s,v)}),n(ae),n(q);var se=c(q,2),le=m(se);z(le,{onclick:async()=>{await De(F,e(o).id).catch(s=>H.error(s))},children:(s,l)=>{var v=Xe(),x=h(v);ze(x,{}),P(),r(s,v)},$$slots:{default:!0}});var $e=c(le,2);z($e,{onclick:()=>{var s;K($,{...e(o)},!0),(s=e(w))==null||s()},children:(s,l)=>{var v=Ze(),x=h(v);Oe(x,{}),P(),r(s,v)},$$slots:{default:!0}}),n(se),j(()=>{y(M,e(o).name),y(he,`Avec ${e(o).metadata.length??""} métadonnées`)}),r(S,A)},$$slots:{default:!0}}),n(a),r(t,a)}),n(re),r(T,X),xe()}export{jt as component};
