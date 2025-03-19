import{n as pe,a as r,t as p,b as J,c as Pe}from"../chunks/Bh4UdHfS.js";import{t as y,ag as xe,f as h,g as e,s as G,ah as be,a as c,c as m,b as K,ai as P,r as n,af as ye}from"../chunks/DvvCRPia.js";import{s as w}from"../chunks/Cvfnkkmk.js";import{i as z}from"../chunks/C7K4hmOx.js";import{e as Q}from"../chunks/DWXKDKNe.js";import{a as je,t as we}from"../chunks/CrD8tmia.js";import{s as me,a as W}from"../chunks/BuyP6kwd.js";import{p as X}from"../chunks/BYruc9P9.js";import{b as F}from"../chunks/gSEnYYGb.js";import H from"../chunks/BNZlkhI1.js";import Se from"../chunks/BFE48xZE.js";import Me from"../chunks/hi27JyK6.js";import{o as ke,t as ne}from"../chunks/BCLC5lfh.js";import{i as Ce,j as Ae,a as De,D as Te,d as ce,e as Ne}from"../chunks/CCKESv6X.js";import Oe from"../chunks/BtLvvrG9.js";import{t as I}from"../chunks/D5kPLoVY.js";import{r as de}from"../chunks/DIX51SrO.js";import{D as ve}from"../chunks/CbthBSw7.js";import{T as Be}from"../chunks/J4AqWbO8.js";import Le from"../chunks/EiV02bOo.js";var Ve=pe('<svg><path fill="currentColor" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m0 192a88 88 0 1 1 88-88a88.1 88.1 0 0 1-88 88m48-88a8 8 0 0 1-8 8h-32v32a8 8 0 0 1-16 0v-32H88a8 8 0 0 1 0-16h32V88a8 8 0 0 1 16 0v32h32a8 8 0 0 1 8 8"></path></svg>');function ze(T,N){const O=de(N,["$$slots","$$events","$$legacy"]);var $=Ve();let j;y(()=>j=me($,j,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...O})),r(T,$)}var He=pe('<svg><path fill="currentColor" d="m229.66 109.66l-48 48a8 8 0 0 1-11.32-11.32L204.69 112H165a88 88 0 0 0-85.23 66a8 8 0 0 1-15.5-4A103.94 103.94 0 0 1 165 96h39.71l-34.37-34.34a8 8 0 0 1 11.32-11.32l48 48a8 8 0 0 1 0 11.32M192 208H40V88a8 8 0 0 0-16 0v128a8 8 0 0 0 8 8h160a8 8 0 0 0 0-16"></path></svg>');function Ie(T,N){const O=de(N,["$$slots","$$events","$$legacy"]);var $=He();let j;y(()=>j=me($,j,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...O})),r(T,$)}var Je=p("<!> Format JSON",1),Fe=p("<!> Format YAML",1),Re=p('<section class="actions svelte-fvemj5"><!> <!></section>'),Ye=p(`<p>Pour l'instant, C.i.g.a.l.e ne permet pas de créer ou modifier des protocoles dans l'interface</p> <p>Cependant, les protocoles sont représentables par des fichiers de configuration JSON ou YAML</p> <p>Vous pouvez télécharger un modèle de protocole vide pour vous faciliter la tâche</p> <p>Sachant qu'un <a>JSON Schema</a> est déclaré dans ces fichiers, la plupart
		des éditeurs de code modernes vous proposeront de l'autocomplétion et de la documentation</p> <p>Vous pourrez ensuite importer votre protocole ici. Si vous voulez le modifier par la suite, il
		suffit de l'exporter, modifier le fichier, et réimporter</p>`,1),qe=p("<!> Importer",1),Ee=p("<!> Créer",1),Ue=p("<p><a> </a></p>"),Ge=p(" <a> </a>)",1),Ke=p("<p>Par <!></p>"),Qe=p("<li><!></li>"),We=p('<p>Par</p> <ul class="svelte-fvemj5"></ul>',1),Xe=p("<li> <!></li>"),Ze=p("<!> Exporter",1),et=p("<!> Supprimer",1),tt=p('<header class="svelte-fvemj5"><h2> </h2> <!> <!></header> <section class="metadata svelte-fvemj5"><p> </p> <ul class="svelte-fvemj5"></ul></section> <section class="actions svelte-fvemj5"><!> <!></section>',1),ot=p("<li><!></li>"),rt=p('<!> <!> <header class="svelte-fvemj5"><h1 class="svelte-fvemj5">Protocoles</h1> <section class="actions svelte-fvemj5"><!> <!></section></header> <ul class="protocoles svelte-fvemj5"></ul>',1);function jt(T,N){xe(N,!0);function O(t,o){return t.filter(a=>o.metadata.includes(a.id))}let $=G(void 0),j=G(void 0),R=G(void 0);var Z=rt(),ee=h(Z);Le(ee,{key:"download-protocol-template",title:"Créer un protocole",get open(){return e(R)},set open(o){K(R,X(o))},footer:(o,a)=>{let g=()=>a==null?void 0:a().close;var S=Re(),B=m(S);Se(B,{onclick:async()=>{var u;await ce(F,"json"),(u=g())==null||u()},children:(u,L)=>{var M=Je(),D=h(M);ve(D,{}),P(),r(u,M)},$$slots:{default:!0}});var A=c(B,2);H(A,{onclick:async()=>{var u;await ce(F,"yaml"),(u=g())==null||u()},children:(u,L)=>{var M=Fe(),D=h(M);ve(D,{}),P(),r(u,M)},$$slots:{default:!0}}),n(S),r(o,S)},children:(o,a)=>{var g=Ye(),S=c(h(g),6),B=c(m(S));P(),n(S),P(2),y(A=>W(B,"href",A),[()=>Ae(F)]),r(o,g)},$$slots:{footer:!0,default:!0}});var te=c(ee,2);Oe(te,{title:"Êtes-vous sûr·e?",key:"delete-protocol",cancel:"Annuler",confirm:"Oui, supprimer",onconfirm:async()=>{await ke(["Protocol","Metadata"],{},t=>{if(!e($))return;t.objectStore("Protocol").delete(e($).id);const o=e($).metadata.filter(a=>De(e($).id,a));for(const a of o)t.objectStore("Metadata").delete(a)}),I.success("Protocole supprimé")},get open(){return e(j)},set open(t){K(j,X(t))},children:(t,o)=>{P();var a=J("Il est impossible de revenir en arrière après avoir supprimé un protocole.");r(t,a)},$$slots:{default:!0}});var Y=c(te,2),oe=c(m(Y),2),re=m(oe);H(re,{onclick:async()=>{await Ce({allowMultiple:!0}).catch(t=>I.error(t)).then(t=>{!t||typeof t=="string"||t.length===0||(t.length===1?I.success(`Protocole “${t[0].name}” importé`):I.success(`${t.length} protocoles importés`))})},children:(t,o)=>{var a=qe(),g=h(a);Te(g,{}),P(),r(t,a)},$$slots:{default:!0}});var fe=c(re,2);H(fe,{onclick:()=>{var t;return(t=e(R))==null?void 0:t()},children:(t,o)=>{var a=Ee(),g=h(a);ze(g,{}),P(),r(t,a)},$$slots:{default:!0}}),n(oe),n(Y);var ae=c(Y,2);Q(ae,21,()=>ne.Protocol.state,t=>t.id,(t,o)=>{var a=ot(),g=m(a);Me(g,{children:(S,B)=>{var A=tt(),u=h(A),L=m(u),M=m(L,!0);n(L);var D=c(L,2);{var ue=s=>{var l=Ue(),v=m(l),x=m(v,!0);n(v),n(l),y(V=>{W(v,"href",e(o).source),w(x,V)},[()=>e(o).source.replace("https://","")]),r(s,l)};z(D,s=>{e(o).source&&s(ue)})}var _e=c(D,2);{var he=s=>{var l=Pe();const v=(b,i=ye)=>{P();var f=Ge(),d=h(f),k=c(d),_=m(k,!0);n(k),P(),y(()=>{w(d,`${i().name??""}
							(`),W(k,"href",`mailto:${i().email??""}`),w(_,i().email)}),r(b,f)};var x=h(l);{var V=b=>{var i=Ke(),f=c(m(i));v(f,()=>e(o).authors[0]),n(i),r(b,i)},U=b=>{var i=We(),f=c(h(i),2);Q(f,21,()=>e(o).authors,d=>d.email,(d,k)=>{var _=Qe(),C=m(_);v(C,()=>e(k)),n(_),r(d,_)}),n(f),r(b,i)};z(x,b=>{e(o).authors.length===1?b(V):b(U,!1)})}r(s,l)};z(_e,s=>{e(o).authors.length&&s(he)})}n(u);var q=c(u,2),E=m(q),$e=m(E);n(E);var se=c(E,2);Q(se,21,()=>O(ne.Metadata.state,e(o)),s=>s.id,(s,l)=>{var v=Xe(),x=m(v),V=c(x);{var U=i=>{var f=J();y(d=>w(f,`(${d??""})`),[()=>e(l).options.map(d=>d.label).slice(0,5).join(", ")]),r(i,f)},b=(i,f)=>{{var d=_=>{var C=J();y(()=>w(C,`(${e(l).options.length??""} options)`)),r(_,C)},k=_=>{var C=J();y(()=>w(C,`(${e(l).type??""})`)),r(_,C)};z(i,_=>{e(l).type==="enum"&&e(l).options?_(d):_(k,!1)},f)}};z(V,i=>{e(l).type==="enum"&&e(l).options&&e(l).options.length<=5?i(U):i(b,!1)})}n(v),je(v,(i,f)=>{var d;return(d=we)==null?void 0:d(i,f)},()=>`ID: ${e(l).id}`),y(()=>w(x,`${e(l).label??""} `)),r(s,v)}),n(se),n(q);var le=c(q,2),ie=m(le);H(ie,{onclick:async()=>{await Ne(F,e(o).id).catch(s=>I.error(s))},children:(s,l)=>{var v=Ze(),x=h(v);Ie(x,{}),P(),r(s,v)},$$slots:{default:!0}});var ge=c(ie,2);H(ge,{onclick:()=>{var s;K($,X({...e(o)})),(s=e(j))==null||s()},children:(s,l)=>{var v=et(),x=h(v);Be(x,{}),P(),r(s,v)},$$slots:{default:!0}}),n(le),y(()=>{w(M,e(o).name),w($e,`Avec ${e(o).metadata.length??""} métadonnées`)}),r(S,A)},$$slots:{default:!0}}),n(a),r(t,a)}),n(ae),r(T,Z),be()}export{jt as component};
