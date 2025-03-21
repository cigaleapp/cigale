import{aW as Fa,t as Z,ai as Ce,f as ae,a as $,c as B,r as L,ah as xa,g as p,O as F,ak as ve,aj as Pe,b as X,s as fe,B as Se}from"../chunks/Cg6bMued.js";import{t as te,M as Ha,o as Va,h as Ka,B as K,N as ce,f as Na,u as W,S as pa,j as Wa,k as Za,c as ka,e as Ma}from"../chunks/DowfS9_Z.js";import{t as Ga}from"../chunks/HAvqTYhs.js";import{H as Qa,g as Ze}from"../chunks/BHheonVZ.js";import{n as xe,a as x,c as Sa,b as ue,t as H}from"../chunks/BDmfjmOz.js";import{s as ge,d as Ia,h as Xa}from"../chunks/C2T-a-jY.js";import{e as Ya}from"../chunks/BSDbgvu0.js";import{s as Ja}from"../chunks/DBTQDV85.js";import{s as ke,a as re,b as et}from"../chunks/BJIrtPoo.js";import{p as Ee}from"../chunks/CBzL59nF.js";import{r as Me,p as ra,s as at}from"../chunks/DTeG0TNF.js";import{base as Ge}from"../chunks/B4KXGXoU.js";import{p as ja}from"../chunks/BSyqdJUw.js";import tt from"../chunks/CMazWY1e.js";import rt from"../chunks/C1E6Yxf8.js";import{s as We,g as he}from"../chunks/BKFv-ZDm.js";import{t as Ie}from"../chunks/DKruwryt.js";import{i as ie}from"../chunks/CkSO6QB0.js";import{c as Qe}from"../chunks/DKau_VHj.js";import{b as nt}from"../chunks/D8a3YZY8.js";import be from"../chunks/D2SGXA41.js";import ot from"../chunks/DA3UTKkV.js";import{D as Ca}from"../chunks/DQHSFJ_a.js";import{a as Xe}from"../chunks/Ba5PP6WD.js";import Pa from"../chunks/BSNp1wbf.js";import it from"../chunks/CJGoXSSL.js";import{e as st}from"../chunks/ByfWfqQI.js";import La from"../chunks/B3lpbtMl.js";import lt from"../chunks/DiSSRkEU.js";import{d as ct,t as vt}from"../chunks/Cj1jFpA3.js";import{o as da,b as Le,c as Te,e as ft}from"../chunks/BUNfAsA7.js";import{b as ut}from"../chunks/D0JiNhYs.js";import ma from"../chunks/DmQVLbka.js";import ga from"../chunks/4Abrmhhi.js";import"../chunks/BWWVvFPy.js";const pt=Fa;async function dt(e){const a=await fetch(Ga("class_mapping.txt")).then(r=>r.text()).then(r=>r.split(`
`));await te.Metadata.set({id:e,description:"",label:"Espèce",mergeMethod:"max",required:!1,type:"enum",options:a.filter(Boolean).map((r,n)=>({key:n.toString(),label:r,description:"",learnMore:`https://en.wikipedia.org/wiki/${encodeURIComponent(r)}`}))});const t=await Ha();await te.Metadata.do(r=>{const n=[...new Set(Object.values(t.items).map(o=>o.kingdom))];r.put({id:"kingdom",description:"",label:"Règne",mergeMethod:"max",required:!1,type:"enum",options:n.map((o,v)=>({key:v.toString(),label:o,description:"",learnMore:`https://en.wikipedia.org/wiki/${encodeURIComponent(o)}`}))});const i=[...new Set(Object.values(t.items).map(o=>o.phylum))];r.put({id:"phylum",description:"",label:"Phylum",mergeMethod:"max",required:!1,type:"enum",options:i.map((o,v)=>({key:v.toString(),label:o,description:"",learnMore:`https://en.wikipedia.org/wiki/${encodeURIComponent(o)}`}))});const s=[...new Set(Object.values(t.items).map(o=>o.class))];r.put({id:"class",description:"",label:"Classe",mergeMethod:"max",required:!1,type:"enum",options:s.map((o,v)=>({key:v.toString(),label:o,description:"",learnMore:`https://en.wikipedia.org/wiki/${encodeURIComponent(o)}`}))});const l=[...new Set(Object.values(t.items).map(o=>o.order))];r.put({id:"order",description:"",label:"Ordre",mergeMethod:"max",required:!1,type:"enum",options:l.map((o,v)=>({key:v.toString(),label:o,description:"",learnMore:`https://en.wikipedia.org/wiki/${encodeURIComponent(o)}`}))});const c=[...new Set(Object.values(t.items).map(o=>o.family))];r.put({id:"family",description:"",label:"Famille",mergeMethod:"max",required:!1,type:"enum",options:c.map((o,v)=>({key:v.toString(),label:o,description:"",learnMore:`https://en.wikipedia.org/wiki/${encodeURIComponent(o)}`}))});const f=[...new Set(Object.values(t.items).map(o=>o.genus))];r.put({id:"genus",description:"",label:"Genre",mergeMethod:"max",required:!1,type:"enum",options:f.map((o,v)=>({key:v.toString(),label:o,description:"",learnMore:`https://en.wikipedia.org/wiki/${encodeURIComponent(o)}`}))})})}function mt(e,a){throw new Qa(e,a)}new TextEncoder;async function gt(){try{await te.initialize(),await ht(),await dt("species"),await te.initialize()}catch(e){console.error(e),mt(400,{message:(e==null?void 0:e.toString())??"Erreur inattendue"})}}async function ht(){await Va(["Metadata","Protocol","Settings"],{},e=>{for(const a of Ka)e.objectStore("Metadata").put(a);e.objectStore("Protocol").put({id:"io.github.cigaleapp.transects.arthropods",name:"Transect",source:"https://github.com/cigaleapp/cigale",authors:[],metadata:[K.species,K.kingdom,K.phylum,K.order,K.family,K.genus,K.shoot_date,K.shoot_location,K.crop,"kingdom","phylum","class","order","family","genus"],metadataOrder:[K.crop,K.species,K.genus,K.family,K.order,K.shoot_date,K.shoot_location],inference:{classification:{model:"https://media.gwen.works/cigale/models/model_classif.onnx",classmapping:"https://media.gwen.works/cigale/models/class_mapping.txt",metadata:K.species,taxonomic:{clade:"species",taxonomy:"https://raw.githubusercontent.com/cigaleapp/cigale/static/taxonomy.json",targets:{kingdoms:"kingdom",phyla:"phylum",classes:"class",orders:"order",families:"family",genera:"genus"}},input:{height:640,width:640,disposition:"CHW",normalized:!1}},detection:{model:"https://media.gwen.works/cigale/models/arthropod_detector_yolo11n_conf0.437.onnx",input:{height:224,width:224,disposition:"1CHW",normalized:!0},output:{normalized:!0,shape:["cx","cy","w","h","score","_"]}}},exports:{images:{cropped:'Cropped/{{ fallback image.metadata.species.valueLabel "(Unknown)" }}_{{ sequence }}.{{ extension image.filename }}',original:'Original/{{ fallback image.metadata.species.valueLabel "(Unknown)" }}_{{ sequence }}.{{ extension image.filename }}'},metadata:{json:"analysis.json",csv:"metadata.csv"}}}),e.objectStore("Settings").put({id:"defaults",protocols:[],theme:"auto",gridSize:10,language:"fr",showInputHints:!0,showTechnicalMetadata:pt})})}const Jr=Object.freeze(Object.defineProperty({__proto__:null,load:gt},Symbol.toStringTag,{value:"Module"}));var wt=xe('<svg><path fill="currentColor" d="m181.66 133.66l-80 80a8 8 0 0 1-11.32-11.32L164.69 128L90.34 53.66a8 8 0 0 1 11.32-11.32l80 80a8 8 0 0 1 0 11.32"></path></svg>');function Be(e,a){const t=Me(a,["$$slots","$$events","$$legacy"]);var r=wt();let n;Z(()=>n=ke(r,n,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...t})),x(e,r)}const ha=(e,a=xa)=>{var t=yt(),r=B(t),n=$(r,2);Xe(n,()=>fetch(a().url).then(i=>i.json()),i=>{var s=ue();Z(()=>ge(s,a().login)),x(i,s)},(i,s)=>{var l=F(()=>{var{name:o}=p(s);return{name:o}}),c=F(()=>p(l).name),f=ue();Z(()=>ge(f,p(c)||a().login)),x(i,f)},(i,s)=>{var l=ue();Z(()=>ge(l,a().login)),x(i,l)}),L(t),Z(()=>{re(t,"href",a().html_url),re(t,"title",`@${a().login}`),re(r,"src",a().avatar_url),re(r,"alt",`Avatar de ${a().login??""}`)}),x(e,t)};var yt=H('<a class="github-user svelte-b46tju"><img class="svelte-b46tju"> <!></a>'),_t=H("<!> <!>",1),bt=H("pour l'issue <a> </a> de <!>",1),$t=H('<li class="svelte-b46tju"><!></li>'),xt=H('<p class="svelte-b46tju">Ceci est un déploiement de preview</p> <ul><li class="svelte-b46tju">pour la PR <a> </a> de <!></li> <!> <br></ul> <p class="svelte-b46tju"> </p>',1),kt=H('<p class="svelte-b46tju">Ceci est un déploiement de preview pour la PR <a></a></p>');function Mt(e,a){Ce(a,!0);let t=ra(a,"open",15);{const r=(n,i)=>{let s=()=>i==null?void 0:i().close;var l=_t(),c=ae(l);be(c,{help:"Supprime toutes les données pour ce déploiement de preview",onclick:()=>{Na(),window.location.reload()},children:(o,v)=>{ve();var u=ue("Nettoyer la base de données");x(o,u)},$$slots:{default:!0}});var f=$(c,2);be(f,{onclick:()=>{window.open(`https://github.com/cigaleapp/cigale/pull/${ce}`),s()()},children:(o,v)=>{ve();var u=ue("Voir sur Github");x(o,u)},$$slots:{default:!0}}),x(n,l)};Pa(e,{key:"preview-pr",title:`Preview de la PR #${ce??""}`,get open(){return t()},set open(n){t(n)},footer:r,children:(n,i)=>{var s=Sa();const l=F(()=>`https://github.com/cigaleapp/cigale/pull/${ce}`);var c=ae(s);Xe(c,()=>fetch(`https://api.github.com/repos/cigaleapp/cigale/pulls/${ce}`).then(f=>f.json()),f=>{var o=kt(),v=$(B(o));v.textContent=`#${ce??""}`,L(o),Z(()=>re(v,"href",p(l))),x(f,o)},(f,o)=>{var v=F(()=>{var{title:P,user:q,body:T}=p(o);return{title:P,user:q,body:T}}),u=F(()=>p(v).title),d=F(()=>p(v).user),k=F(()=>p(v).body),w=xt();const _=F(()=>{var P;return(P=/(Closes|Fixes) #(\d+)/i.exec(p(k)))==null?void 0:P[2]});var M=$(ae(w),2),C=B(M),S=$(B(C)),y=B(S,!0);L(S);var I=$(S,2);ha(I,()=>p(d)),L(C);var z=$(C,2);{var m=P=>{var q=$t(),T=B(q);Xe(T,()=>fetch(`https://api.github.com/repos/cigaleapp/cigale/issues/${p(_)}`).then(R=>R.json()),null,(R,D)=>{var A=F(()=>{var{title:b,number:j,user:ee,html_url:le}=p(D);return{title:b,number:j,user:ee,html_url:le}}),U=F(()=>p(A).title),E=F(()=>p(A).number),Q=F(()=>p(A).user),J=F(()=>p(A).html_url),pe=bt(),V=$(ae(pe)),se=B(V);L(V);var ne=$(V,2);ha(ne,()=>p(Q)),Z(()=>{re(V,"href",p(J)),ge(se,`#${p(E)??""} ${p(U)??""}`)}),x(R,pe)}),L(q),x(P,q)};ie(z,P=>{p(_)&&P(m)})}ve(2),L(M);var g=$(M,2),h=B(g,!0);L(g),Z(()=>{re(S,"href",p(l)),ge(y,p(u)),ge(h,p(k))}),x(f,w)},(f,o)=>{var v=ue();v.nodeValue=`#${ce??""}`,x(f,v)}),x(n,s)},$$slots:{footer:!0,default:!0}})}Pe()}var wa={},St=function(e,a,t,r,n){var i=new Worker(wa[a]||(wa[a]=URL.createObjectURL(new Blob([e+';addEventListener("error",function(e){e=e.error;postMessage({$e$:[e.message,e.code,e.stack]})})'],{type:"text/javascript"}))));return i.onmessage=function(s){var l=s.data,c=l.$e$;if(c){var f=new Error(c[0]);f.code=c[1],f.stack=c[2],n(f,null)}else n(null,l)},i.postMessage(t,r),i},G=Uint8Array,Y=Uint16Array,Ue=Int32Array,Fe=new G([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0,0]),He=new G([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,0,0]),Ye=new G([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),Ta=function(e,a){for(var t=new Y(31),r=0;r<31;++r)t[r]=a+=1<<e[r-1];for(var n=new Ue(t[30]),r=1;r<30;++r)for(var i=t[r];i<t[r+1];++i)n[i]=i-t[r]<<5|r;return{b:t,r:n}},Ba=Ta(Fe,2),It=Ba.b,ze=Ba.r;It[28]=258,ze[258]=28;var jt=Ta(He,0),Je=jt.r,Re=new Y(32768);for(var O=0;O<32768;++O){var de=(O&43690)>>1|(O&21845)<<1;de=(de&52428)>>2|(de&13107)<<2,de=(de&61680)>>4|(de&3855)<<4,Re[O]=((de&65280)>>8|(de&255)<<8)>>1}var _e=function(e,a,t){for(var r=e.length,n=0,i=new Y(a);n<r;++n)e[n]&&++i[e[n]-1];var s=new Y(a);for(n=1;n<a;++n)s[n]=s[n-1]+i[n-1]<<1;var l;if(t){l=new Y(1<<a);var c=15-a;for(n=0;n<r;++n)if(e[n])for(var f=n<<4|e[n],o=a-e[n],v=s[e[n]-1]++<<o,u=v|(1<<o)-1;v<=u;++v)l[Re[v]>>c]=f}else for(l=new Y(r),n=0;n<r;++n)e[n]&&(l[n]=Re[s[e[n]-1]++]>>15-e[n]);return l},me=new G(288);for(var O=0;O<144;++O)me[O]=8;for(var O=144;O<256;++O)me[O]=9;for(var O=256;O<280;++O)me[O]=7;for(var O=280;O<288;++O)me[O]=8;var je=new G(32);for(var O=0;O<32;++O)je[O]=5;var Oa=_e(me,9,0),Aa=_e(je,5,0),na=function(e){return(e+7)/8|0},oa=function(e,a,t){return(a==null||a<0)&&(a=0),(t==null||t>e.length)&&(t=e.length),new G(e.subarray(a,t))},Ct=["unexpected EOF","invalid block type","invalid length/literal","invalid distance","stream finished","no stream handler",,"no callback","invalid UTF-8 data","extra field too long","date not in range 1980-2099","filename too long","stream finishing","invalid zip data"],$e=function(e,a,t){var r=new Error(a||Ct[e]);if(r.code=e,Error.captureStackTrace&&Error.captureStackTrace(r,$e),!t)throw r;return r},oe=function(e,a,t){t<<=a&7;var r=a/8|0;e[r]|=t,e[r+1]|=t>>8},we=function(e,a,t){t<<=a&7;var r=a/8|0;e[r]|=t,e[r+1]|=t>>8,e[r+2]|=t>>16},Ae=function(e,a){for(var t=[],r=0;r<e.length;++r)e[r]&&t.push({s:r,f:e[r]});var n=t.length,i=t.slice();if(!n)return{t:sa,l:0};if(n==1){var s=new G(t[0].s+1);return s[t[0].s]=1,{t:s,l:1}}t.sort(function(I,z){return I.f-z.f}),t.push({s:-1,f:25001});var l=t[0],c=t[1],f=0,o=1,v=2;for(t[0]={s:-1,f:l.f+c.f,l,r:c};o!=n-1;)l=t[t[f].f<t[v].f?f++:v++],c=t[f!=o&&t[f].f<t[v].f?f++:v++],t[o++]={s:-1,f:l.f+c.f,l,r:c};for(var u=i[0].s,r=1;r<n;++r)i[r].s>u&&(u=i[r].s);var d=new Y(u+1),k=De(t[o-1],d,0);if(k>a){var r=0,w=0,_=k-a,M=1<<_;for(i.sort(function(z,m){return d[m.s]-d[z.s]||z.f-m.f});r<n;++r){var C=i[r].s;if(d[C]>a)w+=M-(1<<k-d[C]),d[C]=a;else break}for(w>>=_;w>0;){var S=i[r].s;d[S]<a?w-=1<<a-d[S]++-1:++r}for(;r>=0&&w;--r){var y=i[r].s;d[y]==a&&(--d[y],++w)}k=a}return{t:new G(d),l:k}},De=function(e,a,t){return e.s==-1?Math.max(De(e.l,a,t+1),De(e.r,a,t+1)):a[e.s]=t},ea=function(e){for(var a=e.length;a&&!e[--a];);for(var t=new Y(++a),r=0,n=e[0],i=1,s=function(c){t[r++]=c},l=1;l<=a;++l)if(e[l]==n&&l!=a)++i;else{if(!n&&i>2){for(;i>138;i-=138)s(32754);i>2&&(s(i>10?i-11<<5|28690:i-3<<5|12305),i=0)}else if(i>3){for(s(n),--i;i>6;i-=6)s(8304);i>2&&(s(i-3<<5|8208),i=0)}for(;i--;)s(n);i=1,n=e[l]}return{c:t.subarray(0,r),n:a}},ye=function(e,a){for(var t=0,r=0;r<a.length;++r)t+=e[r]*a[r];return t},ia=function(e,a,t){var r=t.length,n=na(a+2);e[n]=r&255,e[n+1]=r>>8,e[n+2]=e[n]^255,e[n+3]=e[n+1]^255;for(var i=0;i<r;++i)e[n+i+4]=t[i];return(n+4+r)*8},aa=function(e,a,t,r,n,i,s,l,c,f,o){oe(a,o++,t),++n[256];for(var v=Ae(n,15),u=v.t,d=v.l,k=Ae(i,15),w=k.t,_=k.l,M=ea(u),C=M.c,S=M.n,y=ea(w),I=y.c,z=y.n,m=new Y(19),g=0;g<C.length;++g)++m[C[g]&31];for(var g=0;g<I.length;++g)++m[I[g]&31];for(var h=Ae(m,7),P=h.t,q=h.l,T=19;T>4&&!P[Ye[T-1]];--T);var R=f+5<<3,D=ye(n,me)+ye(i,je)+s,A=ye(n,u)+ye(i,w)+s+14+3*T+ye(m,P)+2*m[16]+3*m[17]+7*m[18];if(c>=0&&R<=D&&R<=A)return ia(a,o,e.subarray(c,c+f));var U,E,Q,J;if(oe(a,o,1+(A<D)),o+=2,A<D){U=_e(u,d,0),E=u,Q=_e(w,_,0),J=w;var pe=_e(P,q,0);oe(a,o,S-257),oe(a,o+5,z-1),oe(a,o+10,T-4),o+=14;for(var g=0;g<T;++g)oe(a,o+3*g,P[Ye[g]]);o+=3*T;for(var V=[C,I],se=0;se<2;++se)for(var ne=V[se],g=0;g<ne.length;++g){var b=ne[g]&31;oe(a,o,pe[b]),o+=P[b],b>15&&(oe(a,o,ne[g]>>5&127),o+=ne[g]>>12)}}else U=Oa,E=me,Q=Aa,J=je;for(var g=0;g<l;++g){var j=r[g];if(j>255){var b=j>>18&31;we(a,o,U[b+257]),o+=E[b+257],b>7&&(oe(a,o,j>>23&31),o+=Fe[b]);var ee=j&31;we(a,o,Q[ee]),o+=J[ee],ee>3&&(we(a,o,j>>5&8191),o+=He[ee])}else we(a,o,U[j]),o+=E[j]}return we(a,o,U[256]),o+E[256]},Ea=new Ue([65540,131080,131088,131104,262176,1048704,1048832,2114560,2117632]),sa=new G(0),za=function(e,a,t,r,n,i){var s=i.z||e.length,l=new G(r+s+5*(1+Math.ceil(s/7e3))+n),c=l.subarray(r,l.length-n),f=i.l,o=(i.r||0)&7;if(a){o&&(c[0]=i.r>>3);for(var v=Ea[a-1],u=v>>13,d=v&8191,k=(1<<t)-1,w=i.p||new Y(32768),_=i.h||new Y(k+1),M=Math.ceil(t/3),C=2*M,S=function(Ne){return(e[Ne]^e[Ne+1]<<M^e[Ne+2]<<C)&k},y=new Ue(25e3),I=new Y(288),z=new Y(32),m=0,g=0,h=i.i||0,P=0,q=i.w||0,T=0;h+2<s;++h){var R=S(h),D=h&32767,A=_[R];if(w[D]=A,_[R]=D,q<=h){var U=s-h;if((m>7e3||P>24576)&&(U>423||!f)){o=aa(e,c,0,y,I,z,g,P,T,h-T,o),P=m=g=0,T=h;for(var E=0;E<286;++E)I[E]=0;for(var E=0;E<30;++E)z[E]=0}var Q=2,J=0,pe=d,V=D-A&32767;if(U>2&&R==S(h-V))for(var se=Math.min(u,U)-1,ne=Math.min(32767,h),b=Math.min(258,U);V<=ne&&--pe&&D!=A;){if(e[h+Q]==e[h+Q-V]){for(var j=0;j<b&&e[h+j]==e[h+j-V];++j);if(j>Q){if(Q=j,J=V,j>se)break;for(var ee=Math.min(V,j-2),le=0,E=0;E<ee;++E){var Ve=h-V+E&32767,Ua=w[Ve],va=Ve-Ua&32767;va>le&&(le=va,A=Ve)}}}D=A,A=w[D],V+=D-A&32767}if(J){y[P++]=268435456|ze[Q]<<18|Je[J];var fa=ze[Q]&31,ua=Je[J]&31;g+=Fe[fa]+He[ua],++I[257+fa],++z[ua],q=h+Q,++m}else y[P++]=e[h],++I[e[h]]}}for(h=Math.max(h,q);h<s;++h)y[P++]=e[h],++I[e[h]];o=aa(e,c,f,y,I,z,g,P,T,h-T,o),f||(i.r=o&7|c[o/8|0]<<3,o-=7,i.h=_,i.p=w,i.i=h,i.w=q)}else{for(var h=i.w||0;h<s+f;h+=65535){var Ke=h+65535;Ke>=s&&(c[o/8|0]=f,Ke=s),o=ia(c,o+1,e.subarray(h,Ke))}i.i=s}return oa(l,0,r+na(o)+n)},Pt=function(){for(var e=new Int32Array(256),a=0;a<256;++a){for(var t=a,r=9;--r;)t=(t&1&&-306674912)^t>>>1;e[a]=t}return e}(),Lt=function(){var e=-1;return{p:function(a){for(var t=e,r=0;r<a.length;++r)t=Pt[t&255^a[r]]^t>>>8;e=t},d:function(){return~e}}},Ra=function(e,a,t,r,n){if(!n&&(n={l:1},a.dictionary)){var i=a.dictionary.subarray(-32768),s=new G(i.length+e.length);s.set(i),s.set(e,i.length),e=s,n.w=i.length}return za(e,a.level==null?6:a.level,a.mem==null?n.l?Math.ceil(Math.max(8,Math.min(13,Math.log(e.length)))*1.5):20:12+a.mem,t,r,n)},la=function(e,a){var t={};for(var r in e)t[r]=e[r];for(var r in a)t[r]=a[r];return t},ya=function(e,a,t){for(var r=e(),n=e.toString(),i=n.slice(n.indexOf("[")+1,n.lastIndexOf("]")).replace(/\s+/g,"").split(","),s=0;s<r.length;++s){var l=r[s],c=i[s];if(typeof l=="function"){a+=";"+c+"=";var f=l.toString();if(l.prototype)if(f.indexOf("[native code]")!=-1){var o=f.indexOf(" ",8)+1;a+=f.slice(o,f.indexOf("(",o))}else{a+=f;for(var v in l.prototype)a+=";"+c+".prototype."+v+"="+l.prototype[v].toString()}else a+=f}else t[c]=l}return a},Oe=[],Tt=function(e){var a=[];for(var t in e)e[t].buffer&&a.push((e[t]=new e[t].constructor(e[t])).buffer);return a},Bt=function(e,a,t,r){if(!Oe[t]){for(var n="",i={},s=e.length-1,l=0;l<s;++l)n=ya(e[l],n,i);Oe[t]={c:ya(e[s],n,i),e:i}}var c=la({},Oe[t].e);return St(Oe[t].c+";onmessage=function(e){for(var k in e.data)self[k]=e.data[k];onmessage="+a.toString()+"}",t,c,Tt(c),r)},Ot=function(){return[G,Y,Ue,Fe,He,Ye,ze,Je,Oa,me,Aa,je,Re,Ea,sa,_e,oe,we,Ae,De,ea,ye,ia,aa,na,oa,za,Ra,ca,Da]},Da=function(e){return postMessage(e,[e.buffer])},At=function(e,a,t,r,n,i){var s=Bt(t,r,n,function(l,c){s.terminate(),i(l,c)});return s.postMessage([e,a],a.consume?[e.buffer]:[]),function(){s.terminate()}},N=function(e,a,t){for(;t;++a)e[a]=t,t>>>=8};function Et(e,a,t){return t||(t=a,a={}),typeof t!="function"&&$e(7),At(e,a,[Ot],function(r){return Da(ca(r.data[0],r.data[1]))},0,t)}function ca(e,a){return Ra(e,a||{},0,0)}var qa=function(e,a,t,r){for(var n in e){var i=e[n],s=a+n,l=r;Array.isArray(i)&&(l=la(r,i[1]),i=i[0]),i instanceof G?t[s]=[i,l]:(t[s+="/"]=[new G(0),l],qa(i,s,t,r))}},_a=typeof TextEncoder<"u"&&new TextEncoder,zt=typeof TextDecoder<"u"&&new TextDecoder,Rt=0;try{zt.decode(sa,{stream:!0}),Rt=1}catch{}function qe(e,a){var t;if(_a)return _a.encode(e);for(var r=e.length,n=new G(e.length+(e.length>>1)),i=0,s=function(f){n[i++]=f},t=0;t<r;++t){if(i+5>n.length){var l=new G(i+8+(r-t<<1));l.set(n),n=l}var c=e.charCodeAt(t);c<128||a?s(c):c<2048?(s(192|c>>6),s(128|c&63)):c>55295&&c<57344?(c=65536+(c&1047552)|e.charCodeAt(++t)&1023,s(240|c>>18),s(128|c>>12&63),s(128|c>>6&63),s(128|c&63)):(s(224|c>>12),s(128|c>>6&63),s(128|c&63))}return oa(n,0,i)}var ta=function(e){var a=0;if(e)for(var t in e){var r=e[t].length;r>65535&&$e(9),a+=r+4}return a},ba=function(e,a,t,r,n,i,s,l){var c=r.length,f=t.extra,o=l&&l.length,v=ta(f);N(e,a,s!=null?33639248:67324752),a+=4,s!=null&&(e[a++]=20,e[a++]=t.os),e[a]=20,a+=2,e[a++]=t.flag<<1|(i<0&&8),e[a++]=n&&8,e[a++]=t.compression&255,e[a++]=t.compression>>8;var u=new Date(t.mtime==null?Date.now():t.mtime),d=u.getFullYear()-1980;if((d<0||d>119)&&$e(10),N(e,a,d<<25|u.getMonth()+1<<21|u.getDate()<<16|u.getHours()<<11|u.getMinutes()<<5|u.getSeconds()>>1),a+=4,i!=-1&&(N(e,a,t.crc),N(e,a+4,i<0?-i-2:i),N(e,a+8,t.size)),N(e,a+12,c),N(e,a+14,v),a+=16,s!=null&&(N(e,a,o),N(e,a+6,t.attrs),N(e,a+10,s),a+=14),e.set(r,a),a+=c,v)for(var k in f){var w=f[k],_=w.length;N(e,a,+k),N(e,a+2,_),e.set(w,a+4),a+=4+_}return o&&(e.set(l,a),a+=o),a},Dt=function(e,a,t,r,n){N(e,a,101010256),N(e,a+8,t),N(e,a+10,t),N(e,a+12,r),N(e,a+16,n)};function qt(e,a,t){t||(t=a,a={}),typeof t!="function"&&$e(7);var r={};qa(e,"",r,a);var n=Object.keys(r),i=n.length,s=0,l=0,c=i,f=new Array(i),o=[],v=function(){for(var _=0;_<o.length;++_)o[_]()},u=function(_,M){$a(function(){t(_,M)})};$a(function(){u=t});var d=function(){var _=new G(l+22),M=s,C=l-s;l=0;for(var S=0;S<c;++S){var y=f[S];try{var I=y.c.length;ba(_,l,y,y.f,y.u,I);var z=30+y.f.length+ta(y.extra),m=l+z;_.set(y.c,m),ba(_,s,y,y.f,y.u,I,l,y.m),s+=16+z+(y.m?y.m.length:0),l=m+I}catch(g){return u(g,null)}}Dt(_,s,f.length,C,M),u(null,_)};i||d();for(var k=function(_){var M=n[_],C=r[M],S=C[0],y=C[1],I=Lt(),z=S.length;I.p(S);var m=qe(M),g=m.length,h=y.comment,P=h&&qe(h),q=P&&P.length,T=ta(y.extra),R=y.level==0?0:8,D=function(A,U){if(A)v(),u(A,null);else{var E=U.length;f[_]=la(y,{size:z,crc:I.d(),c:U,f:m,m:P,u:g!=M.length||P&&h.length!=q,compression:R}),s+=30+g+T+E,l+=76+2*(g+T)+(q||0)+E,--i||d()}};if(g>65535&&D($e(11,0,1),null),!R)D(null,S);else if(z<16e4)try{D(null,ca(S,y))}catch(A){D(A,null)}else o.push(Et(S,y,D))},w=0;w<c;++w)k(w);return v}var $a=typeof queueMicrotask=="function"?queueMicrotask:typeof setTimeout=="function"?setTimeout:function(e){e()};async function Ut(e,a,{include:t="croppedonly",base:r}){const n=Object.fromEntries(await Promise.all(e.map(async o=>[o.id,{label:o.label,metadata:await da(o).then(Le),protocolMetadata:Object.fromEntries(Object.entries(await da(o).then(Le)).filter(([v])=>v.startsWith(`${a.id}__`)).map(([v,u])=>[v.replace(`${a.id}__`,""),u])),images:o.images.map(v=>{const u=te.Image.state.find(d=>d.id===v);if(u)return{...u,metadata:Le(u.metadata)}})}]))),i=[...new Set(e.flatMap(o=>Object.keys(n[o.id].metadata)))],s=Object.fromEntries(te.Metadata.state.map(o=>[o.id,o]));let l=[];if(W.processing.state="generating-zip",W.processing.total=1,W.processing.done=0,t!=="metadataonly"){W.processing.total+=e.flatMap(o=>o.images).length;for(const o of e.flatMap(v=>v.images)){const v=await te.Image.get(o);if(!v)throw"Image non trouvée";const{contentType:u,filename:d}=v,{cropped:k,original:w}=await Ft(v);l.push({imageId:o,croppedBytes:new Uint8Array(k),originalBytes:t==="full"?new Uint8Array(w):void 0,contentType:u,filename:d}),W.processing.done++}}const c=a.exports??{images:{cropped:pa.FilepathTemplate.assert("cropped/{{sequence}}.{{extension image.filename}}"),original:pa.FilepathTemplate.assert("original/{{sequence}}.{{extension image.filename}}")},metadata:{json:"analysis.json",csv:"metadata.csv"}},f=await new Promise((o,v)=>qt({[c.metadata.json]:qe(Wa("json",`${window.location.origin}${r}/results.schema.json`,{observations:n,protocol:a},["protocol","observations"])),[c.metadata.csv]:qe(Ht(["Identifiant","Observation",...i.flatMap(u=>[Te(s[u]),`${Te(s[u])}: Confiance`])],e.map(u=>({Identifiant:u.id,Observation:u.label,...Object.fromEntries(Object.entries(n[u.id].metadata).flatMap(([d,{value:k,confidence:w}])=>[[Te(s[d]),ft(s[d],k)],[`${Te(s[d])}: Confiance`,w.toString()]]))})))),...Object.fromEntries(t==="metadataonly"?[]:e.flatMap(u=>u.images.map(d=>[u,d])).flatMap(([u,d],k)=>{const w=l.find(C=>C.imageId===d);if(!w)throw"Image non trouvée";const _=te.Image.state.find(C=>C.id===d);if(!_)throw"Image non trouvée";const M={image:{..._,metadata:Le(_.metadata)},observation:u,sequence:k+1};return[[c.images.cropped(M),[w.croppedBytes,{level:0}]],[c.images.original(M),[w.originalBytes,{level:0}]]].filter(([,[C]])=>C!==void 0)}))},{comment:`Generated by C.i.g.a.l.e on ${new Date().toISOString()} - ${window.location.origin}`},(u,d)=>{u&&v(u),o(d)}));W.processing.done++,Za(f,"results.zip","application/zip")}async function Ft(e){var i,s;const a=(i=e.metadata.crop)==null?void 0:i.value;if(!a)throw"L'image n'a pas d'information de recadrage";const t=await ka("ImageFile",Ma(e.id)).then(l=>l==null?void 0:l.bytes);if(!t)throw"L'image n'a pas de fichier associé";const r=await createImageBitmap(new Blob([t],{type:e.contentType})),n=ct({x:r.width,y:r.height})(vt(a));try{const l=await createImageBitmap(r,n.x,n.y,n.width,n.height),c=document.createElement("canvas");return c.width=l.width,c.height=l.height,(s=c.getContext("2d"))==null||s.drawImage(l,0,0),{cropped:await new Promise(o=>c.toBlob(o,["image/png","image/jpeg"].includes(e.contentType)?e.contentType:"image/png")).then(o=>o.arrayBuffer()),original:t}}catch(l){Ie.warn(`Impossible de recadrer ${e.filename}, l'image sera incluse sans recadrage`),console.error(`Couldn't crop ${e.filename} (id ${e.id}) with `,{boundingBox:n},":",l)}finally{r.close()}return{cropped:t,original:t}}function Ht(e,a,t=";"){const r=n=>`"${(n==null?void 0:n.replace(/"/g,'""'))??""}"`;return[e.map(r).join(t),...a.map(n=>e.map(i=>r(n[i])).join(t))].join(`
`)}var Vt=H("<code> </code> <!>",1),Kt=H("<!> results.zip",1),Nt=H('<section class="progress svelte-q4lxxz"><!></section> <!>',1),Wt=H('<svelte-css-wrapper style="display: contents"><!></svelte-css-wrapper>',1);function Zt(e,a){Ce(a,!0);let t=ra(a,"open",15),r=fe(!1),n=fe("croppedonly");async function i(){X(r,!0);const c=te.Protocol.state.find(f=>f.id===W.currentProtocolId);if(!c){Ie.error("Aucun protocole sélectionné"),X(r,!1);return}try{await st(),await Ut(te.Observation.state,c,{base:Ge,include:p(n)})}catch(f){console.error(f),Ie.error(`Erreur lors de l'exportation des résultats: ${(f==null?void 0:f.toString())??"Erreur inattendue"}`)}finally{X(r,!1)}}var s=Wt(),l=ae(s);{const c=f=>{var o=Nt(),v=ae(o),u=B(v);{var d=w=>{var _=Vt(),M=ae(_),C=B(M);L(M);var S=$(M,2);La(S,{get progress(){return a.progress}}),Z(y=>ge(C,`${y??""}%`),[()=>Math.floor(a.progress*100)]),x(w,_)};ie(u,w=>{[0,1].includes(a.progress)||w(d)})}L(v);var k=$(v,2);be(k,{onclick:i,children:(w,_)=>{var M=Kt(),C=ae(M);{var S=I=>{it(I,{})},y=I=>{Ca(I,{})};ie(C,I=>{p(r)?I(S):I(y,!1)})}ve(),x(w,M)},$$slots:{default:!0}}),x(f,o)};Qe(l,()=>({"--footer-direction":"column"})),Pa(l.lastChild,{key:"export-results",title:"Exporter les résultats",get open(){return t()},set open(f){t(f)},footer:c,children:(f,o)=>{lt(f,{options:[{key:"metadataonly",label:"Métadonnées seulement"},{key:"croppedonly",label:"Métadonnées et images recadrées"},{key:"full",label:"Métadonnées, images recadrées et images originales"}],get value(){return p(n)},set value(v){X(n,Ee(v))},children:(v,u)=>{ve();var d=ue("Quoi inclure dans l'export");x(v,d)},$$slots:{default:!0}})},$$slots:{footer:!0,default:!0}}),L(l)}x(e,s),Pe()}var Gt=xe('<svg><path fill="currentColor" d="M128 82a46 46 0 1 0 46 46a46.06 46.06 0 0 0-46-46m0 80a34 34 0 1 1 34-34a34 34 0 0 1-34 34m86-31.16c.06-1.89.06-3.79 0-5.68L229.33 106a6 6 0 0 0 1.11-5.29a105.3 105.3 0 0 0-10.68-25.81a6 6 0 0 0-4.53-3l-24.45-2.71q-1.93-2.07-4-4l-2.72-24.46a6 6 0 0 0-3-4.53a105.7 105.7 0 0 0-25.77-10.66a6 6 0 0 0-5.29 1.14l-19.2 15.37a90 90 0 0 0-5.68 0L106 26.67a6 6 0 0 0-5.29-1.11A105.3 105.3 0 0 0 74.9 36.24a6 6 0 0 0-3 4.53l-2.67 24.45q-2.07 1.94-4 4L40.76 72a6 6 0 0 0-4.53 3a105.7 105.7 0 0 0-10.66 25.77a6 6 0 0 0 1.11 5.23l15.37 19.2a90 90 0 0 0 0 5.68l-15.38 19.17a6 6 0 0 0-1.11 5.29a105.3 105.3 0 0 0 10.68 25.76a6 6 0 0 0 4.53 3l24.45 2.71q1.94 2.07 4 4L72 215.24a6 6 0 0 0 3 4.53a105.7 105.7 0 0 0 25.77 10.66a6 6 0 0 0 5.29-1.11l19.1-15.32c1.89.06 3.79.06 5.68 0l19.21 15.38a6 6 0 0 0 3.75 1.31a6.2 6.2 0 0 0 1.54-.2a105.3 105.3 0 0 0 25.76-10.68a6 6 0 0 0 3-4.53l2.71-24.45q2.07-1.93 4-4l24.46-2.72a6 6 0 0 0 4.53-3a105.5 105.5 0 0 0 10.66-25.77a6 6 0 0 0-1.11-5.29Zm-3.1 41.63l-23.64 2.63a6 6 0 0 0-3.82 2a75 75 0 0 1-6.31 6.31a6 6 0 0 0-2 3.82l-2.63 23.63a94.3 94.3 0 0 1-17.36 7.14l-18.57-14.86a6 6 0 0 0-3.75-1.31h-.36a78 78 0 0 1-8.92 0a6 6 0 0 0-4.11 1.3L100.87 218a94 94 0 0 1-17.34-7.17l-2.63-23.62a6 6 0 0 0-2-3.82a75 75 0 0 1-6.31-6.31a6 6 0 0 0-3.82-2l-23.63-2.63A94.3 94.3 0 0 1 38 155.14l14.86-18.57a6 6 0 0 0 1.3-4.11a78 78 0 0 1 0-8.92a6 6 0 0 0-1.3-4.11L38 100.87a94 94 0 0 1 7.17-17.34l23.62-2.63a6 6 0 0 0 3.82-2a75 75 0 0 1 6.31-6.31a6 6 0 0 0 2-3.82l2.63-23.63A94.3 94.3 0 0 1 100.86 38l18.57 14.86a6 6 0 0 0 4.11 1.3a78 78 0 0 1 8.92 0a6 6 0 0 0 4.11-1.3L155.13 38a94 94 0 0 1 17.34 7.17l2.63 23.64a6 6 0 0 0 2 3.82a75 75 0 0 1 6.31 6.31a6 6 0 0 0 3.82 2l23.63 2.63a94.3 94.3 0 0 1 7.14 17.29l-14.86 18.57a6 6 0 0 0-1.3 4.11a78 78 0 0 1 0 8.92a6 6 0 0 0 1.3 4.11L218 155.13a94 94 0 0 1-7.15 17.34Z"></path></svg>');function Qt(e,a){const t=Me(a,["$$slots","$$events","$$legacy"]);var r=Gt();let n;Z(()=>n=ke(r,n,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...t})),x(e,r)}var Xt=xe('<svg><path fill="currentColor" d="M122 40V16a6 6 0 0 1 12 0v24a6 6 0 0 1-12 0m68 88a62 62 0 1 1-62-62a62.07 62.07 0 0 1 62 62m-12 0a50 50 0 1 0-50 50a50.06 50.06 0 0 0 50-50M59.76 68.24a6 6 0 1 0 8.48-8.48l-16-16a6 6 0 0 0-8.48 8.48Zm0 119.52l-16 16a6 6 0 1 0 8.48 8.48l16-16a6 6 0 1 0-8.48-8.48M192 70a6 6 0 0 0 4.24-1.76l16-16a6 6 0 0 0-8.48-8.48l-16 16A6 6 0 0 0 192 70m4.24 117.76a6 6 0 0 0-8.48 8.48l16 16a6 6 0 0 0 8.48-8.48ZM46 128a6 6 0 0 0-6-6H16a6 6 0 0 0 0 12h24a6 6 0 0 0 6-6m82 82a6 6 0 0 0-6 6v24a6 6 0 0 0 12 0v-24a6 6 0 0 0-6-6m112-88h-24a6 6 0 0 0 0 12h24a6 6 0 0 0 0-12"></path></svg>');function Yt(e,a){const t=Me(a,["$$slots","$$events","$$legacy"]);var r=Xt();let n;Z(()=>n=ke(r,n,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...t})),x(e,r)}var Jt=xe('<svg><path fill="currentColor" d="M88 104H40a8 8 0 0 1-8-8V48a8 8 0 0 1 16 0v28.69l14.63-14.63A95.43 95.43 0 0 1 130 33.94h.53a95.36 95.36 0 0 1 67.07 27.33a8 8 0 0 1-11.18 11.44a79.52 79.52 0 0 0-55.89-22.77h-.45a79.56 79.56 0 0 0-56.14 23.43L59.31 88H88a8 8 0 0 1 0 16m128 48h-48a8 8 0 0 0 0 16h28.69l-14.63 14.63a79.56 79.56 0 0 1-56.13 23.43h-.45a79.52 79.52 0 0 1-55.89-22.77a8 8 0 1 0-11.18 11.44a95.36 95.36 0 0 0 67.07 27.33h.52a95.43 95.43 0 0 0 67.36-28.12L208 179.31V208a8 8 0 0 0 16 0v-48a8 8 0 0 0-8-8"></path></svg>');function er(e,a){const t=Me(a,["$$slots","$$events","$$legacy"]);var r=Jt();let n;Z(()=>n=ke(r,n,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...t})),x(e,r)}var ar=xe('<svg><path fill="currentColor" d="M232.13 143.64a6 6 0 0 0-6-1.49a90.07 90.07 0 0 1-112.27-112.3a6 6 0 0 0-7.49-7.48a102.88 102.88 0 0 0-51.89 36.31a102 102 0 0 0 142.84 142.84a102.88 102.88 0 0 0 36.31-51.89a6 6 0 0 0-1.5-5.99m-42 48.29a90 90 0 0 1-126-126a90.9 90.9 0 0 1 35.52-28.27a102.06 102.06 0 0 0 118.69 118.69a90.9 90.9 0 0 1-28.24 35.58Z"></path></svg>');function tr(e,a){const t=Me(a,["$$slots","$$events","$$legacy"]);var r=ar();let n;Z(()=>n=ke(r,n,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...t})),x(e,r)}var rr=xe('<svg><path fill="currentColor" d="M164.24 100.24L136.48 128l27.76 27.76a6 6 0 1 1-8.48 8.48L128 136.48l-27.76 27.76a6 6 0 0 1-8.48-8.48L119.52 128l-27.76-27.76a6 6 0 0 1 8.48-8.48L128 119.52l27.76-27.76a6 6 0 0 1 8.48 8.48M230 128A102 102 0 1 1 128 26a102.12 102.12 0 0 1 102 102m-12 0a90 90 0 1 0-90 90a90.1 90.1 0 0 0 90-90"></path></svg>');function nr(e,a){const t=Me(a,["$$slots","$$events","$$legacy"]);var r=rr();let n;Z(()=>n=ke(r,n,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...t})),x(e,r)}var or=(e,a)=>{X(a,!1)},ir=H('<!> <dialog class="container svelte-k25xuh"><div class="listParam svelte-k25xuh"><div class="setting svelte-k25xuh">Thème <!> <!></div> <div class="setting svelte-k25xuh">Mode debug <!></div> <div class="setting svelte-k25xuh"><!></div> <div class="setting svelte-k25xuh"><!></div> <footer>C.i.g.a.l.e vDEV · <a href="#/about">À propos</a></footer></div></dialog>',1);function sr(e,a){Ce(a,!0);let t=fe(!1),r=fe(void 0);Se(()=>{window.addEventListener("mouseup",({target:m})=>{var g;m!==p(r)&&((g=p(r))!=null&&g.contains(m)||X(t,!1))})});let n=fe(!0);Se(()=>{window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",m=>{X(n,!m.matches)})});var i=ir(),s=ae(i);const l=F(()=>p(t)?"Fermer":"Réglages");ma(s,{get help(){return p(l)},onclick:()=>{X(t,!p(t))},children:(m,g)=>{var h=Sa(),P=ae(h);{var q=R=>{nr(R,{})},T=R=>{Qt(R,{})};ie(P,R=>{p(t)?R(q):R(T,!1)})}x(m,h)}});var c=$(s,2),f=B(c),o=B(f),v=$(B(o));const u=F(()=>he().theme==="auto"?p(n):he().theme==="light");ga(v,{get value(){return p(u)},onchange:async m=>{await We("theme",m?"light":"dark")},icons:{on:Yt,off:tr}});var d=$(v,2);const k=F(()=>he().theme==="auto");ma(d,{get disabled(){return p(k)},onclick:async()=>await We("theme","auto"),help:"Synchroniser avec le thème du système",children:(m,g)=>{er(m,{})}}),L(o);var w=$(o,2),_=$(B(w));ga(_,{get value(){return he().showTechnicalMetadata},onchange:async m=>{await We("showTechnicalMetadata",m)}}),L(w);var M=$(w,2),C=B(M);be(C,{onclick:async()=>{X(t,!1),await Ze("#/protocols")},children:(m,g)=>{ve();var h=ue("Gérer les protocoles");x(m,h)},$$slots:{default:!0}}),L(M);var S=$(M,2),y=B(S);be(y,{onclick:()=>{var m;(m=a.openKeyboardShortcuts)==null||m.call(a)},children:(m,g)=>{ve();var h=ue("Raccourcis clavier");x(m,h)},$$slots:{default:!0}}),L(S);var I=$(S,2),z=$(B(I));z.__click=[or,t],L(I),L(f),L(c),ut(c,m=>X(r,m),()=>p(r)),Z(m=>{re(c,"data-theme",m),c.open=p(t)?!0:void 0},[()=>he().theme]),x(e,i),Pe()}Ia(["click"]);var lr=H('<button class="pr-number svelte-1i3vnya"></button>'),cr=H('<div class="line svelte-1i3vnya"></div>'),vr=H('<div class="line svelte-1i3vnya"></div>'),fr=H('<div class="line svelte-1i3vnya"></div>'),ur=H('<div class="line svelte-1i3vnya"></div>'),pr=H("<!> Résultats",1),dr=H('<!> <!> <header><nav class="svelte-1i3vnya"><div class="logo svelte-1i3vnya"><a href="#/" class="svelte-1i3vnya"><svelte-css-wrapper style="display: contents"><!></svelte-css-wrapper> C.i.g.a.l.e.</a> <!></div> <div class="steps svelte-1i3vnya"><a href="#/" class="svelte-1i3vnya">Protocole <!></a> <!> <a href="#/import" class="svelte-1i3vnya">Importer <!></a> <!> <a href="#/crop" class="svelte-1i3vnya">Recadrer <!></a> <!> <a href="#/classify" class="svelte-1i3vnya">Classifier <!></a> <!> <!></div> <svelte-css-wrapper style="display: contents"><!></svelte-css-wrapper></nav> <!></header>',1);function mr(e,a){Ce(a,!0);let t=ra(a,"progress",3,0);const r=F(()=>ja.url.hash.replace(/^#/,"")),n=F(()=>te.Image.state.length>0);let i=fe(void 0),s=fe(void 0);Se(()=>{W.currentProtocolId||Ze("#/"),W.currentProtocolId&&!p(n)&&Ze("#/import")});let l=fe(void 0);var c=dr(),f=ae(c);Zt(f,{get progress(){return t()},get open(){return p(s)},set open(b){X(s,Ee(b))}});var o=$(f,2);{var v=b=>{Mt(b,{get open(){return p(l)},set open(j){X(l,Ee(j))}})};ie(o,b=>{ce&&b(v)})}var u=$(o,2),d=B(u),k=B(d),w=B(k),_=B(w);Qe(_,()=>({"--fill":"var(--bg-primary)"})),ot(_.lastChild,{}),L(_),ve(),L(w);var M=$(w,2);{var C=b=>{var j=lr();j.__click=function(...ee){var le;(le=p(l))==null||le.apply(this,ee)},j.textContent=`Preview #${ce??""}`,x(b,j)};ie(M,b=>{ce&&b(C)})}L(k);var S=$(k,2),y=B(S),I=$(B(y));{var z=b=>{var j=cr();x(b,j)};ie(I,b=>{p(r)=="/"&&b(z)})}L(y);var m=$(y,2);Be(m,{});var g=$(m,2),h=$(B(g));{var P=b=>{var j=vr();x(b,j)};ie(h,b=>{p(r)=="/import"&&b(P)})}L(g);var q=$(g,2);Be(q,{});var T=$(q,2),R=$(B(T));{var D=b=>{var j=fr();x(b,j)};ie(R,b=>{p(r)=="/crop"&&b(D)})}L(T);var A=$(T,2);Be(A,{});var U=$(A,2),E=$(B(U));{var Q=b=>{var j=ur();x(b,j)};ie(E,b=>{p(r)=="/classify"&&b(Q)})}L(U);var J=$(U,2);Be(J,{});var pe=$(J,2);be(pe,{get onclick(){return p(s)},children:(b,j)=>{var ee=pr(),le=ae(ee);Ca(le,{}),ve(),x(b,ee)},$$slots:{default:!0}}),L(S);var V=$(S,2);Qe(V,()=>({"--navbar-height":`${p(i)??""}px`})),sr(V.lastChild,{get openKeyboardShortcuts(){return a.openKeyboardShortcuts}}),L(V),L(d);var se=$(d,2);const ne=F(()=>W.processing.state==="generating-zip"?0:t());La(se,{get progress(){return p(ne)}}),L(u),Z(()=>{re(g,"aria-disabled",!W.currentProtocolId),re(T,"aria-disabled",!W.currentProtocolId||!p(n)),re(U,"aria-disabled",!W.currentProtocolId||!p(n))}),nt(u,"clientHeight",b=>X(i,b)),x(e,c),Pe()}Ia(["click"]);var gr=H("<base>"),hr=H('<!> <!> <section class="toasts svelte-fbiwzh"></section> <div><!></div>',1);function en(e,a){Ce(a,!0),Se(()=>{for(const v of te.Image.state)W.hasPreviewURL(v)||(async()=>{const u=await ka("ImagePreviewFile",Ma(v.id));if(!u)return;const d=new Blob([u.bytes],{type:v.contentType});W.setPreviewURL(v,URL.createObjectURL(d))})()});const t=F(he);Se(()=>{document.documentElement.dataset.theme=p(t).theme});let r=fe(void 0);var n=hr();Xa(v=>{var u=gr();re(u,"href",Ge?`${Ge}/index.html`:""),x(v,u)});var i=ae(n);mr(i,{get openKeyboardShortcuts(){return p(r)},hasImages:!0,get progress(){return W.processing.progress}});var s=$(i,2);tt(s,{preventDefault:!0,get binds(){return W.keybinds},get openHelp(){return p(r)},set openHelp(v){X(r,Ee(v))}});var l=$(s,2);Ya(l,21,()=>Ie.items,v=>v.id,(v,u)=>{rt(v,at(()=>p(u),{get action(){return p(u).labels.action},get dismiss(){return p(u).labels.close},onaction:()=>{var d,k;(k=(d=p(u).callbacks)==null?void 0:d.action)==null||k.call(d,p(u))},ondismiss:()=>{Ie.remove(p(u).id)}}))}),L(l);var c=$(l,2);let f;var o=B(c);Ja(o,()=>a.children??xa),L(c),Z(v=>f=et(c,1,"contents svelte-fbiwzh",null,f,v),[()=>{var v;return{padded:!((v=ja.route.id)!=null&&v.includes("/(sidepanel)"))}}]),x(e,n),Pe()}export{en as component,Jr as universal};
