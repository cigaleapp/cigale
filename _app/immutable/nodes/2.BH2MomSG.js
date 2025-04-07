import{aU as Fa,t as Z,ae as Se,ad as U,f as ee,g as d,a as $,c as T,r as B,ac as ba,ag as ce,af as je,s as ve,b as Q,B as Ie}from"../chunks/je5hudcr.js";import{t as ae,P as qa,o as Ua,B as Va,Q as le,p as Ha,u as K,S as fa,s as Ka,b as Na,h as $a,j as xa,R as Za}from"../chunks/KjAwBPrY.js";import{a as Ga}from"../chunks/ClVTZZUq.js";import{t as Wa}from"../chunks/B3V5XpT0.js";import{t as _e}from"../chunks/D4bQdaOF.js";import{H as Qa,g as Ne}from"../chunks/BXB8YhCl.js";import{n as xe,a as M,c as Ma,b as fe,t as V}from"../chunks/DVHRhNjq.js";import{s as me,d as ka,h as Xa}from"../chunks/rhXEw3QH.js";import{e as Ya}from"../chunks/BOy7pdjG.js";import{s as Ja}from"../chunks/BAGMfwKI.js";import{s as Me,a as re,c as er}from"../chunks/CSTXPE61.js";import{r as ke,p as aa,s as ar}from"../chunks/B3DmaASf.js";import{base as Ze}from"../chunks/Djrgn3pf.js";import{p as Ia}from"../chunks/Gh3zAgH_.js";import rr from"../chunks/DNbKtRBs.js";import tr from"../chunks/DduiSw3i.js";import{s as Ke,g as ge}from"../chunks/ChmYjxc2.js";import{i as oe}from"../chunks/CZpreLed.js";import{c as Ge}from"../chunks/BcP6sXja.js";import{b as nr}from"../chunks/CfSr-YiY.js";import be from"../chunks/CC0qxDGr.js";import or from"../chunks/Dv6WUPvX.js";import{D as Pa}from"../chunks/C9BslBmU.js";import{a as We}from"../chunks/DN0_YFns.js";import Sa from"../chunks/P0hB6nq9.js";import ir from"../chunks/CUkEI23n.js";import{e as sr}from"../chunks/ggJx2sUu.js";import ja from"../chunks/BEI18f0N.js";import lr from"../chunks/CLerKni0.js";import{d as cr,t as vr}from"../chunks/CZK3dPLl.js";import{o as ua,b as Ce,c as Be,e as fr}from"../chunks/COjehg1Q.js";import{b as ur}from"../chunks/DEwYytbT.js";import pa from"../chunks/9FSTz81j.js";import da from"../chunks/BZ3-vauV.js";const pr=Fa;async function dr(a){const e=await fetch(Wa("class_mapping.txt")).then(t=>t.text()).then(t=>t.split(`
`));await ae.Metadata.set({id:a,description:"",label:"Espèce",mergeMethod:"max",required:!1,type:"enum",options:e.filter(Boolean).map((t,n)=>({key:n.toString(),label:t,description:"",learnMore:`https://en.wikipedia.org/wiki/${encodeURIComponent(t)}`}))});const r=await qa();await ae.Metadata.do(t=>{const n=[...new Set(Object.values(r.items).map(o=>o.kingdom))];t.put({id:"kingdom",description:"",label:"Règne",mergeMethod:"max",required:!1,type:"enum",options:n.map((o,u)=>({key:u.toString(),label:o,description:"",learnMore:`https://en.wikipedia.org/wiki/${encodeURIComponent(o)}`}))});const i=[...new Set(Object.values(r.items).map(o=>o.phylum))];t.put({id:"phylum",description:"",label:"Phylum",mergeMethod:"max",required:!1,type:"enum",options:i.map((o,u)=>({key:u.toString(),label:o,description:"",learnMore:`https://en.wikipedia.org/wiki/${encodeURIComponent(o)}`}))});const s=[...new Set(Object.values(r.items).map(o=>o.class))];t.put({id:"class",description:"",label:"Classe",mergeMethod:"max",required:!1,type:"enum",options:s.map((o,u)=>({key:u.toString(),label:o,description:"",learnMore:`https://en.wikipedia.org/wiki/${encodeURIComponent(o)}`}))});const l=[...new Set(Object.values(r.items).map(o=>o.order))];t.put({id:"order",description:"",label:"Ordre",mergeMethod:"max",required:!1,type:"enum",options:l.map((o,u)=>({key:u.toString(),label:o,description:"",learnMore:`https://en.wikipedia.org/wiki/${encodeURIComponent(o)}`}))});const c=[...new Set(Object.values(r.items).map(o=>o.family))];t.put({id:"family",description:"",label:"Famille",mergeMethod:"max",required:!1,type:"enum",options:c.map((o,u)=>({key:u.toString(),label:o,description:"",learnMore:`https://en.wikipedia.org/wiki/${encodeURIComponent(o)}`}))});const f=[...new Set(Object.values(r.items).map(o=>o.genus))];t.put({id:"genus",description:"",label:"Genre",mergeMethod:"max",required:!1,type:"enum",options:f.map((o,u)=>({key:u.toString(),label:o,description:"",learnMore:`https://en.wikipedia.org/wiki/${encodeURIComponent(o)}`}))})})}function mr(a,e){throw new Qa(a,e)}new TextEncoder;async function gr(){try{await ae.initialize(),await hr(),await dr("species"),await ae.initialize()}catch(a){console.error(a),mr(400,{message:(a==null?void 0:a.toString())??"Erreur inattendue"})}}async function hr(){if(await Ua(["Metadata","Protocol","Settings"],{},async e=>{for(const r of Va)e.objectStore("Metadata").put(r);e.objectStore("Settings").put({id:"defaults",protocols:[],theme:"auto",gridSize:10,language:"fr",showInputHints:!0,showTechnicalMetadata:pr})}),!await ae.Protocol.get("io.github.cigaleapp.transects.arthropods"))try{await fetch("https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.json").then(e=>e.text()).then(Ga)}catch(e){console.error(e),_e.error("Impossible de charger le protocole par défaut. Vérifiez votre connexion Internet ou essayez de recharger la page.")}}const Yt=Object.freeze(Object.defineProperty({__proto__:null,load:gr},Symbol.toStringTag,{value:"Module"}));var wr=xe('<svg><path fill="currentColor" d="m181.66 133.66l-80 80a8 8 0 0 1-11.32-11.32L164.69 128L90.34 53.66a8 8 0 0 1 11.32-11.32l80 80a8 8 0 0 1 0 11.32"></path></svg>');function Le(a,e){const r=ke(e,["$$slots","$$events","$$legacy"]);var t=wr();let n;Z(()=>n=Me(t,n,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...r})),M(a,t)}const ma=(a,e=ba)=>{var r=yr(),t=T(r),n=$(t,2);We(n,()=>fetch(e().url).then(i=>i.json()),i=>{var s=fe();Z(()=>me(s,e().login)),M(i,s)},(i,s)=>{var l=U(()=>{var{name:o}=d(s);return{name:o}}),c=U(()=>d(l).name),f=fe();Z(()=>me(f,d(c)||e().login)),M(i,f)},(i,s)=>{var l=fe();Z(()=>me(l,e().login)),M(i,l)}),B(r),Z(()=>{re(r,"href",e().html_url),re(r,"title",`@${e().login}`),re(t,"src",e().avatar_url),re(t,"alt",`Avatar de ${e().login??""}`)}),M(a,r)};var yr=V('<a class="github-user svelte-b46tju"><img class="svelte-b46tju"> <!></a>'),_r=V("<!> <!>",1),br=V("pour l'issue <a> </a> de <!>",1),$r=V('<li class="svelte-b46tju"><!></li>'),xr=V('<p class="svelte-b46tju">Ceci est un déploiement de preview</p> <ul><li class="svelte-b46tju">pour la PR <a> </a> de <!></li> <!> <br></ul> <p class="svelte-b46tju"> </p>',1),Mr=V('<p class="svelte-b46tju">Ceci est un déploiement de preview pour la PR <a></a></p>');function kr(a,e){Se(e,!0);let r=aa(e,"open",15);{const t=(n,i)=>{let s=()=>i==null?void 0:i().close;var l=_r(),c=ee(l);be(c,{help:"Supprime toutes les données pour ce déploiement de preview",onclick:()=>{Ha(),window.location.reload()},children:(o,u)=>{ce();var v=fe("Nettoyer la base de données");M(o,v)},$$slots:{default:!0}});var f=$(c,2);be(f,{onclick:()=>{window.open(`https://github.com/cigaleapp/cigale/pull/${le}`),s()()},children:(o,u)=>{ce();var v=fe("Voir sur Github");M(o,v)},$$slots:{default:!0}}),M(n,l)};Sa(a,{key:"preview-pr",title:`Preview de la PR #${le??""}`,get open(){return r()},set open(n){r(n)},footer:t,children:(n,i)=>{var s=Ma();const l=U(()=>`https://github.com/cigaleapp/cigale/pull/${le}`);var c=ee(s);We(c,()=>fetch(`https://api.github.com/repos/cigaleapp/cigale/pulls/${le}`).then(f=>f.json()),f=>{var o=Mr(),u=$(T(o));u.textContent=`#${le??""}`,B(o),Z(()=>re(u,"href",d(l))),M(f,o)},(f,o)=>{var u=U(()=>{var{title:C,user:F,body:L}=d(o);return{title:C,user:F,body:L}}),v=U(()=>d(u).title),p=U(()=>d(u).user),x=U(()=>d(u).body),m=xr();const _=U(()=>{var C;return(C=/(Closes|Fixes) #(\d+)/i.exec(d(x)))==null?void 0:C[2]});var k=$(ee(m),2),j=T(k),I=$(T(j)),y=T(I,!0);B(I);var P=$(I,2);ma(P,()=>d(p)),B(j);var R=$(j,2);{var g=C=>{var F=$r(),L=T(F);We(L,()=>fetch(`https://api.github.com/repos/cigaleapp/cigale/issues/${d(_)}`).then(z=>z.json()),null,(z,D)=>{var E=U(()=>{var{title:b,number:S,user:J,html_url:se}=d(D);return{title:b,number:S,user:J,html_url:se}}),q=U(()=>d(E).title),A=U(()=>d(E).number),W=U(()=>d(E).user),Y=U(()=>d(E).html_url),ue=br(),H=$(ee(ue)),ie=T(H);B(H);var te=$(H,2);ma(te,()=>d(W)),Z(()=>{re(H,"href",d(Y)),me(ie,`#${d(A)??""} ${d(q)??""}`)}),M(z,ue)}),B(F),M(C,F)};oe(R,C=>{d(_)&&C(g)})}ce(2),B(k);var h=$(k,2),w=T(h,!0);B(h),Z(()=>{re(I,"href",d(l)),me(y,d(v)),me(w,d(x))}),M(f,m)},(f,o)=>{var u=fe();u.nodeValue=`#${le??""}`,M(f,u)}),M(n,s)},$$slots:{footer:!0,default:!0}})}je()}var ga={},Ir=function(a,e,r,t,n){var i=new Worker(ga[e]||(ga[e]=URL.createObjectURL(new Blob([a+';addEventListener("error",function(e){e=e.error;postMessage({$e$:[e.message,e.code,e.stack]})})'],{type:"text/javascript"}))));return i.onmessage=function(s){var l=s.data,c=l.$e$;if(c){var f=new Error(c[0]);f.code=c[1],f.stack=c[2],n(f,null)}else n(null,l)},i.postMessage(r,t),i},G=Uint8Array,X=Uint16Array,De=Int32Array,Fe=new G([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0,0]),qe=new G([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,0,0]),Qe=new G([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),Ca=function(a,e){for(var r=new X(31),t=0;t<31;++t)r[t]=e+=1<<a[t-1];for(var n=new De(r[30]),t=1;t<30;++t)for(var i=r[t];i<r[t+1];++i)n[i]=i-r[t]<<5|t;return{b:r,r:n}},Ba=Ca(Fe,2),Pr=Ba.b,Ee=Ba.r;Pr[28]=258,Ee[258]=28;var Sr=Ca(qe,0),Xe=Sr.r,Ae=new X(32768);for(var O=0;O<32768;++O){var pe=(O&43690)>>1|(O&21845)<<1;pe=(pe&52428)>>2|(pe&13107)<<2,pe=(pe&61680)>>4|(pe&3855)<<4,Ae[O]=((pe&65280)>>8|(pe&255)<<8)>>1}var ye=function(a,e,r){for(var t=a.length,n=0,i=new X(e);n<t;++n)a[n]&&++i[a[n]-1];var s=new X(e);for(n=1;n<e;++n)s[n]=s[n-1]+i[n-1]<<1;var l;if(r){l=new X(1<<e);var c=15-e;for(n=0;n<t;++n)if(a[n])for(var f=n<<4|a[n],o=e-a[n],u=s[a[n]-1]++<<o,v=u|(1<<o)-1;u<=v;++u)l[Ae[u]>>c]=f}else for(l=new X(t),n=0;n<t;++n)a[n]&&(l[n]=Ae[s[a[n]-1]++]>>15-a[n]);return l},de=new G(288);for(var O=0;O<144;++O)de[O]=8;for(var O=144;O<256;++O)de[O]=9;for(var O=256;O<280;++O)de[O]=7;for(var O=280;O<288;++O)de[O]=8;var Pe=new G(32);for(var O=0;O<32;++O)Pe[O]=5;var La=ye(de,9,0),Ta=ye(Pe,5,0),ra=function(a){return(a+7)/8|0},ta=function(a,e,r){return(e==null||e<0)&&(e=0),(r==null||r>a.length)&&(r=a.length),new G(a.subarray(e,r))},jr=["unexpected EOF","invalid block type","invalid length/literal","invalid distance","stream finished","no stream handler",,"no callback","invalid UTF-8 data","extra field too long","date not in range 1980-2099","filename too long","stream finishing","invalid zip data"],$e=function(a,e,r){var t=new Error(e||jr[a]);if(t.code=a,Error.captureStackTrace&&Error.captureStackTrace(t,$e),!r)throw t;return t},ne=function(a,e,r){r<<=e&7;var t=e/8|0;a[t]|=r,a[t+1]|=r>>8},he=function(a,e,r){r<<=e&7;var t=e/8|0;a[t]|=r,a[t+1]|=r>>8,a[t+2]|=r>>16},Oe=function(a,e){for(var r=[],t=0;t<a.length;++t)a[t]&&r.push({s:t,f:a[t]});var n=r.length,i=r.slice();if(!n)return{t:oa,l:0};if(n==1){var s=new G(r[0].s+1);return s[r[0].s]=1,{t:s,l:1}}r.sort(function(P,R){return P.f-R.f}),r.push({s:-1,f:25001});var l=r[0],c=r[1],f=0,o=1,u=2;for(r[0]={s:-1,f:l.f+c.f,l,r:c};o!=n-1;)l=r[r[f].f<r[u].f?f++:u++],c=r[f!=o&&r[f].f<r[u].f?f++:u++],r[o++]={s:-1,f:l.f+c.f,l,r:c};for(var v=i[0].s,t=1;t<n;++t)i[t].s>v&&(v=i[t].s);var p=new X(v+1),x=Re(r[o-1],p,0);if(x>e){var t=0,m=0,_=x-e,k=1<<_;for(i.sort(function(R,g){return p[g.s]-p[R.s]||R.f-g.f});t<n;++t){var j=i[t].s;if(p[j]>e)m+=k-(1<<x-p[j]),p[j]=e;else break}for(m>>=_;m>0;){var I=i[t].s;p[I]<e?m-=1<<e-p[I]++-1:++t}for(;t>=0&&m;--t){var y=i[t].s;p[y]==e&&(--p[y],++m)}x=e}return{t:new G(p),l:x}},Re=function(a,e,r){return a.s==-1?Math.max(Re(a.l,e,r+1),Re(a.r,e,r+1)):e[a.s]=r},Ye=function(a){for(var e=a.length;e&&!a[--e];);for(var r=new X(++e),t=0,n=a[0],i=1,s=function(c){r[t++]=c},l=1;l<=e;++l)if(a[l]==n&&l!=e)++i;else{if(!n&&i>2){for(;i>138;i-=138)s(32754);i>2&&(s(i>10?i-11<<5|28690:i-3<<5|12305),i=0)}else if(i>3){for(s(n),--i;i>6;i-=6)s(8304);i>2&&(s(i-3<<5|8208),i=0)}for(;i--;)s(n);i=1,n=a[l]}return{c:r.subarray(0,t),n:e}},we=function(a,e){for(var r=0,t=0;t<e.length;++t)r+=a[t]*e[t];return r},na=function(a,e,r){var t=r.length,n=ra(e+2);a[n]=t&255,a[n+1]=t>>8,a[n+2]=a[n]^255,a[n+3]=a[n+1]^255;for(var i=0;i<t;++i)a[n+i+4]=r[i];return(n+4+t)*8},Je=function(a,e,r,t,n,i,s,l,c,f,o){ne(e,o++,r),++n[256];for(var u=Oe(n,15),v=u.t,p=u.l,x=Oe(i,15),m=x.t,_=x.l,k=Ye(v),j=k.c,I=k.n,y=Ye(m),P=y.c,R=y.n,g=new X(19),h=0;h<j.length;++h)++g[j[h]&31];for(var h=0;h<P.length;++h)++g[P[h]&31];for(var w=Oe(g,7),C=w.t,F=w.l,L=19;L>4&&!C[Qe[L-1]];--L);var z=f+5<<3,D=we(n,de)+we(i,Pe)+s,E=we(n,v)+we(i,m)+s+14+3*L+we(g,C)+2*g[16]+3*g[17]+7*g[18];if(c>=0&&z<=D&&z<=E)return na(e,o,a.subarray(c,c+f));var q,A,W,Y;if(ne(e,o,1+(E<D)),o+=2,E<D){q=ye(v,p,0),A=v,W=ye(m,_,0),Y=m;var ue=ye(C,F,0);ne(e,o,I-257),ne(e,o+5,R-1),ne(e,o+10,L-4),o+=14;for(var h=0;h<L;++h)ne(e,o+3*h,C[Qe[h]]);o+=3*L;for(var H=[j,P],ie=0;ie<2;++ie)for(var te=H[ie],h=0;h<te.length;++h){var b=te[h]&31;ne(e,o,ue[b]),o+=C[b],b>15&&(ne(e,o,te[h]>>5&127),o+=te[h]>>12)}}else q=La,A=de,W=Ta,Y=Pe;for(var h=0;h<l;++h){var S=t[h];if(S>255){var b=S>>18&31;he(e,o,q[b+257]),o+=A[b+257],b>7&&(ne(e,o,S>>23&31),o+=Fe[b]);var J=S&31;he(e,o,W[J]),o+=Y[J],J>3&&(he(e,o,S>>5&8191),o+=qe[J])}else he(e,o,q[S]),o+=A[S]}return he(e,o,q[256]),o+A[256]},Oa=new De([65540,131080,131088,131104,262176,1048704,1048832,2114560,2117632]),oa=new G(0),Ea=function(a,e,r,t,n,i){var s=i.z||a.length,l=new G(t+s+5*(1+Math.ceil(s/7e3))+n),c=l.subarray(t,l.length-n),f=i.l,o=(i.r||0)&7;if(e){o&&(c[0]=i.r>>3);for(var u=Oa[e-1],v=u>>13,p=u&8191,x=(1<<r)-1,m=i.p||new X(32768),_=i.h||new X(x+1),k=Math.ceil(r/3),j=2*k,I=function(He){return(a[He]^a[He+1]<<k^a[He+2]<<j)&x},y=new De(25e3),P=new X(288),R=new X(32),g=0,h=0,w=i.i||0,C=0,F=i.w||0,L=0;w+2<s;++w){var z=I(w),D=w&32767,E=_[z];if(m[D]=E,_[z]=D,F<=w){var q=s-w;if((g>7e3||C>24576)&&(q>423||!f)){o=Je(a,c,0,y,P,R,h,C,L,w-L,o),C=g=h=0,L=w;for(var A=0;A<286;++A)P[A]=0;for(var A=0;A<30;++A)R[A]=0}var W=2,Y=0,ue=p,H=D-E&32767;if(q>2&&z==I(w-H))for(var ie=Math.min(v,q)-1,te=Math.min(32767,w),b=Math.min(258,q);H<=te&&--ue&&D!=E;){if(a[w+W]==a[w+W-H]){for(var S=0;S<b&&a[w+S]==a[w+S-H];++S);if(S>W){if(W=S,Y=H,S>ie)break;for(var J=Math.min(H,S-2),se=0,A=0;A<J;++A){var Ue=w-H+A&32767,Da=m[Ue],la=Ue-Da&32767;la>se&&(se=la,E=Ue)}}}D=E,E=m[D],H+=D-E&32767}if(Y){y[C++]=268435456|Ee[W]<<18|Xe[Y];var ca=Ee[W]&31,va=Xe[Y]&31;h+=Fe[ca]+qe[va],++P[257+ca],++R[va],F=w+W,++g}else y[C++]=a[w],++P[a[w]]}}for(w=Math.max(w,F);w<s;++w)y[C++]=a[w],++P[a[w]];o=Je(a,c,f,y,P,R,h,C,L,w-L,o),f||(i.r=o&7|c[o/8|0]<<3,o-=7,i.h=_,i.p=m,i.i=w,i.w=F)}else{for(var w=i.w||0;w<s+f;w+=65535){var Ve=w+65535;Ve>=s&&(c[o/8|0]=f,Ve=s),o=na(c,o+1,a.subarray(w,Ve))}i.i=s}return ta(l,0,t+ra(o)+n)},Cr=function(){for(var a=new Int32Array(256),e=0;e<256;++e){for(var r=e,t=9;--t;)r=(r&1&&-306674912)^r>>>1;a[e]=r}return a}(),Br=function(){var a=-1;return{p:function(e){for(var r=a,t=0;t<e.length;++t)r=Cr[r&255^e[t]]^r>>>8;a=r},d:function(){return~a}}},Aa=function(a,e,r,t,n){if(!n&&(n={l:1},e.dictionary)){var i=e.dictionary.subarray(-32768),s=new G(i.length+a.length);s.set(i),s.set(a,i.length),a=s,n.w=i.length}return Ea(a,e.level==null?6:e.level,e.mem==null?n.l?Math.ceil(Math.max(8,Math.min(13,Math.log(a.length)))*1.5):20:12+e.mem,r,t,n)},ia=function(a,e){var r={};for(var t in a)r[t]=a[t];for(var t in e)r[t]=e[t];return r},ha=function(a,e,r){for(var t=a(),n=a.toString(),i=n.slice(n.indexOf("[")+1,n.lastIndexOf("]")).replace(/\s+/g,"").split(","),s=0;s<t.length;++s){var l=t[s],c=i[s];if(typeof l=="function"){e+=";"+c+"=";var f=l.toString();if(l.prototype)if(f.indexOf("[native code]")!=-1){var o=f.indexOf(" ",8)+1;e+=f.slice(o,f.indexOf("(",o))}else{e+=f;for(var u in l.prototype)e+=";"+c+".prototype."+u+"="+l.prototype[u].toString()}else e+=f}else r[c]=l}return e},Te=[],Lr=function(a){var e=[];for(var r in a)a[r].buffer&&e.push((a[r]=new a[r].constructor(a[r])).buffer);return e},Tr=function(a,e,r,t){if(!Te[r]){for(var n="",i={},s=a.length-1,l=0;l<s;++l)n=ha(a[l],n,i);Te[r]={c:ha(a[s],n,i),e:i}}var c=ia({},Te[r].e);return Ir(Te[r].c+";onmessage=function(e){for(var k in e.data)self[k]=e.data[k];onmessage="+e.toString()+"}",r,c,Lr(c),t)},Or=function(){return[G,X,De,Fe,qe,Qe,Ee,Xe,La,de,Ta,Pe,Ae,Oa,oa,ye,ne,he,Oe,Re,Ye,we,na,Je,ra,ta,Ea,Aa,sa,Ra]},Ra=function(a){return postMessage(a,[a.buffer])},Er=function(a,e,r,t,n,i){var s=Tr(r,t,n,function(l,c){s.terminate(),i(l,c)});return s.postMessage([a,e],e.consume?[a.buffer]:[]),function(){s.terminate()}},N=function(a,e,r){for(;r;++e)a[e]=r,r>>>=8};function Ar(a,e,r){return r||(r=e,e={}),typeof r!="function"&&$e(7),Er(a,e,[Or],function(t){return Ra(sa(t.data[0],t.data[1]))},0,r)}function sa(a,e){return Aa(a,e||{},0,0)}var za=function(a,e,r,t){for(var n in a){var i=a[n],s=e+n,l=t;Array.isArray(i)&&(l=ia(t,i[1]),i=i[0]),i instanceof G?r[s]=[i,l]:(r[s+="/"]=[new G(0),l],za(i,s,r,t))}},wa=typeof TextEncoder<"u"&&new TextEncoder,Rr=typeof TextDecoder<"u"&&new TextDecoder,zr=0;try{Rr.decode(oa,{stream:!0}),zr=1}catch{}function ze(a,e){var r;if(wa)return wa.encode(a);for(var t=a.length,n=new G(a.length+(a.length>>1)),i=0,s=function(f){n[i++]=f},r=0;r<t;++r){if(i+5>n.length){var l=new G(i+8+(t-r<<1));l.set(n),n=l}var c=a.charCodeAt(r);c<128||e?s(c):c<2048?(s(192|c>>6),s(128|c&63)):c>55295&&c<57344?(c=65536+(c&1047552)|a.charCodeAt(++r)&1023,s(240|c>>18),s(128|c>>12&63),s(128|c>>6&63),s(128|c&63)):(s(224|c>>12),s(128|c>>6&63),s(128|c&63))}return ta(n,0,i)}var ea=function(a){var e=0;if(a)for(var r in a){var t=a[r].length;t>65535&&$e(9),e+=t+4}return e},ya=function(a,e,r,t,n,i,s,l){var c=t.length,f=r.extra,o=l&&l.length,u=ea(f);N(a,e,s!=null?33639248:67324752),e+=4,s!=null&&(a[e++]=20,a[e++]=r.os),a[e]=20,e+=2,a[e++]=r.flag<<1|(i<0&&8),a[e++]=n&&8,a[e++]=r.compression&255,a[e++]=r.compression>>8;var v=new Date(r.mtime==null?Date.now():r.mtime),p=v.getFullYear()-1980;if((p<0||p>119)&&$e(10),N(a,e,p<<25|v.getMonth()+1<<21|v.getDate()<<16|v.getHours()<<11|v.getMinutes()<<5|v.getSeconds()>>1),e+=4,i!=-1&&(N(a,e,r.crc),N(a,e+4,i<0?-i-2:i),N(a,e+8,r.size)),N(a,e+12,c),N(a,e+14,u),e+=16,s!=null&&(N(a,e,o),N(a,e+6,r.attrs),N(a,e+10,s),e+=14),a.set(t,e),e+=c,u)for(var x in f){var m=f[x],_=m.length;N(a,e,+x),N(a,e+2,_),a.set(m,e+4),e+=4+_}return o&&(a.set(l,e),e+=o),e},Dr=function(a,e,r,t,n){N(a,e,101010256),N(a,e+8,r),N(a,e+10,r),N(a,e+12,t),N(a,e+16,n)};function Fr(a,e,r){r||(r=e,e={}),typeof r!="function"&&$e(7);var t={};za(a,"",t,e);var n=Object.keys(t),i=n.length,s=0,l=0,c=i,f=new Array(i),o=[],u=function(){for(var _=0;_<o.length;++_)o[_]()},v=function(_,k){_a(function(){r(_,k)})};_a(function(){v=r});var p=function(){var _=new G(l+22),k=s,j=l-s;l=0;for(var I=0;I<c;++I){var y=f[I];try{var P=y.c.length;ya(_,l,y,y.f,y.u,P);var R=30+y.f.length+ea(y.extra),g=l+R;_.set(y.c,g),ya(_,s,y,y.f,y.u,P,l,y.m),s+=16+R+(y.m?y.m.length:0),l=g+P}catch(h){return v(h,null)}}Dr(_,s,f.length,j,k),v(null,_)};i||p();for(var x=function(_){var k=n[_],j=t[k],I=j[0],y=j[1],P=Br(),R=I.length;P.p(I);var g=ze(k),h=g.length,w=y.comment,C=w&&ze(w),F=C&&C.length,L=ea(y.extra),z=y.level==0?0:8,D=function(E,q){if(E)u(),v(E,null);else{var A=q.length;f[_]=ia(y,{size:R,crc:P.d(),c:q,f:g,m:C,u:h!=k.length||C&&w.length!=F,compression:z}),s+=30+h+L+A,l+=76+2*(h+L)+(F||0)+A,--i||p()}};if(h>65535&&D($e(11,0,1),null),!z)D(null,I);else if(R<16e4)try{D(null,sa(I,y))}catch(E){D(E,null)}else o.push(Ar(I,y,D))},m=0;m<c;++m)x(m);return u}var _a=typeof queueMicrotask=="function"?queueMicrotask:typeof setTimeout=="function"?setTimeout:function(a){a()};async function qr(a,e,{include:r="croppedonly",base:t}){const n=Object.fromEntries(await Promise.all(a.map(async o=>[o.id,{label:o.label,metadata:await ua(o).then(Ce),protocolMetadata:Object.fromEntries(Object.entries(await ua(o).then(Ce)).filter(([u])=>u.startsWith(`${e.id}__`)).map(([u,v])=>[u.replace(`${e.id}__`,""),v])),images:o.images.map(u=>{const v=ae.Image.state.find(p=>p.id===u);if(v)return{...v,metadata:Ce(v.metadata)}})}]))),i=[...new Set(a.flatMap(o=>Object.keys(n[o.id].metadata)))],s=Object.fromEntries(ae.Metadata.state.map(o=>[o.id,o]));let l=[];if(K.processing.state="generating-zip",K.processing.total=1,K.processing.done=0,r!=="metadataonly"){K.processing.total+=a.flatMap(o=>o.images).length;for(const o of a.flatMap(u=>u.images)){const u=await ae.Image.get(o);if(!u)throw"Image non trouvée";const{contentType:v,filename:p}=u,{cropped:x,original:m}=await Ur(u);l.push({imageId:o,croppedBytes:new Uint8Array(x),originalBytes:r==="full"?new Uint8Array(m):void 0,contentType:v,filename:p}),K.processing.done++}}const c=e.exports??{images:{cropped:fa.FilepathTemplate.assert("cropped/{{sequence}}.{{extension image.filename}}"),original:fa.FilepathTemplate.assert("original/{{sequence}}.{{extension image.filename}}")},metadata:{json:"analysis.json",csv:"metadata.csv"}},f=await new Promise((o,u)=>Fr({[c.metadata.json]:ze(Ka("json",`${window.location.origin}${t}/results.schema.json`,{observations:n,protocol:e},["protocol","observations"])),[c.metadata.csv]:ze(Vr(["Identifiant","Observation",...i.flatMap(v=>[Be(s[v]),`${Be(s[v])}: Confiance`])],a.map(v=>({Identifiant:v.id,Observation:v.label,...Object.fromEntries(Object.entries(n[v.id].metadata).flatMap(([p,{value:x,confidence:m}])=>[[Be(s[p]),fr(s[p],x)],[`${Be(s[p])}: Confiance`,m.toString()]]))})))),...Object.fromEntries(r==="metadataonly"?[]:a.flatMap(v=>v.images.map(p=>[v,p])).flatMap(([v,p],x)=>{const m=l.find(j=>j.imageId===p);if(!m)throw"Image non trouvée";const _=ae.Image.state.find(j=>j.id===p);if(!_)throw"Image non trouvée";const k={image:{..._,metadata:Ce(_.metadata)},observation:v,sequence:x+1};return[[c.images.cropped(k),[m.croppedBytes,{level:0}]],[c.images.original(k),[m.originalBytes,{level:0}]]].filter(([,[j]])=>j!==void 0)}))},{comment:`Generated by C.i.g.a.l.e on ${new Date().toISOString()} - ${window.location.origin}`},(v,p)=>{v&&u(v),o(p)}));K.processing.done++,Na(f,"results.zip","application/zip")}async function Ur(a){var i,s;const e=(i=a.metadata.crop)==null?void 0:i.value;if(!e)throw"L'image n'a pas d'information de recadrage";const r=await $a("ImageFile",xa(a.id)).then(l=>l==null?void 0:l.bytes);if(!r)throw"L'image n'a pas de fichier associé";const t=await createImageBitmap(new Blob([r],{type:a.contentType})),n=cr({x:t.width,y:t.height})(vr(e));try{const l=await createImageBitmap(t,n.x,n.y,n.width,n.height),c=document.createElement("canvas");return c.width=l.width,c.height=l.height,(s=c.getContext("2d"))==null||s.drawImage(l,0,0),{cropped:await new Promise(o=>c.toBlob(o,["image/png","image/jpeg"].includes(a.contentType)?a.contentType:"image/png")).then(o=>o.arrayBuffer()),original:r}}catch(l){_e.warn(`Impossible de recadrer ${a.filename}, l'image sera incluse sans recadrage`),console.error(`Couldn't crop ${a.filename} (id ${a.id}) with `,{boundingBox:n},":",l)}finally{t.close()}return{cropped:r,original:r}}function Vr(a,e,r=";"){const t=n=>`"${(n==null?void 0:n.replace(/"/g,'""'))??""}"`;return[a.map(t).join(r),...e.map(n=>a.map(i=>t(n[i])).join(r))].join(`
`)}var Hr=V("<code> </code> <!>",1),Kr=V("<!> results.zip",1),Nr=V('<section class="progress svelte-q4lxxz"><!></section> <!>',1),Zr=V('<svelte-css-wrapper style="display: contents"><!></svelte-css-wrapper>',1);function Gr(a,e){Se(e,!0);let r=aa(e,"open",15),t=ve(!1),n=ve("croppedonly");async function i(){Q(t,!0);const c=ae.Protocol.state.find(f=>f.id===K.currentProtocolId);if(!c){_e.error("Aucun protocole sélectionné"),Q(t,!1);return}try{await sr(),await qr(ae.Observation.state,c,{base:Ze,include:d(n)})}catch(f){console.error(f),_e.error(`Erreur lors de l'exportation des résultats: ${(f==null?void 0:f.toString())??"Erreur inattendue"}`)}finally{Q(t,!1)}}var s=Zr(),l=ee(s);{const c=f=>{var o=Nr(),u=ee(o),v=T(u);{var p=m=>{var _=Hr(),k=ee(_),j=T(k);B(k);var I=$(k,2);ja(I,{get progress(){return e.progress}}),Z(y=>me(j,`${y??""}%`),[()=>Math.floor(e.progress*100)]),M(m,_)};oe(v,m=>{[0,1].includes(e.progress)||m(p)})}B(u);var x=$(u,2);be(x,{onclick:i,children:(m,_)=>{var k=Kr(),j=ee(k);{var I=P=>{ir(P,{})},y=P=>{Pa(P,{})};oe(j,P=>{d(t)?P(I):P(y,!1)})}ce(),M(m,k)},$$slots:{default:!0}}),M(f,o)};Ge(l,()=>({"--footer-direction":"column"})),Sa(l.lastChild,{key:"export-results",title:"Exporter les résultats",get open(){return r()},set open(f){r(f)},footer:c,children:(f,o)=>{lr(f,{options:[{key:"metadataonly",label:"Métadonnées seulement"},{key:"croppedonly",label:"Métadonnées et images recadrées"},{key:"full",label:"Métadonnées, images recadrées et images originales"}],get value(){return d(n)},set value(u){Q(n,u,!0)},children:(u,v)=>{ce();var p=fe("Quoi inclure dans l'export");M(u,p)},$$slots:{default:!0}})},$$slots:{footer:!0,default:!0}}),B(l)}M(a,s),je()}var Wr=xe('<svg><path fill="currentColor" d="M128 82a46 46 0 1 0 46 46a46.06 46.06 0 0 0-46-46m0 80a34 34 0 1 1 34-34a34 34 0 0 1-34 34m86-31.16c.06-1.89.06-3.79 0-5.68L229.33 106a6 6 0 0 0 1.11-5.29a105.3 105.3 0 0 0-10.68-25.81a6 6 0 0 0-4.53-3l-24.45-2.71q-1.93-2.07-4-4l-2.72-24.46a6 6 0 0 0-3-4.53a105.7 105.7 0 0 0-25.77-10.66a6 6 0 0 0-5.29 1.14l-19.2 15.37a90 90 0 0 0-5.68 0L106 26.67a6 6 0 0 0-5.29-1.11A105.3 105.3 0 0 0 74.9 36.24a6 6 0 0 0-3 4.53l-2.67 24.45q-2.07 1.94-4 4L40.76 72a6 6 0 0 0-4.53 3a105.7 105.7 0 0 0-10.66 25.77a6 6 0 0 0 1.11 5.23l15.37 19.2a90 90 0 0 0 0 5.68l-15.38 19.17a6 6 0 0 0-1.11 5.29a105.3 105.3 0 0 0 10.68 25.76a6 6 0 0 0 4.53 3l24.45 2.71q1.94 2.07 4 4L72 215.24a6 6 0 0 0 3 4.53a105.7 105.7 0 0 0 25.77 10.66a6 6 0 0 0 5.29-1.11l19.1-15.32c1.89.06 3.79.06 5.68 0l19.21 15.38a6 6 0 0 0 3.75 1.31a6.2 6.2 0 0 0 1.54-.2a105.3 105.3 0 0 0 25.76-10.68a6 6 0 0 0 3-4.53l2.71-24.45q2.07-1.93 4-4l24.46-2.72a6 6 0 0 0 4.53-3a105.5 105.5 0 0 0 10.66-25.77a6 6 0 0 0-1.11-5.29Zm-3.1 41.63l-23.64 2.63a6 6 0 0 0-3.82 2a75 75 0 0 1-6.31 6.31a6 6 0 0 0-2 3.82l-2.63 23.63a94.3 94.3 0 0 1-17.36 7.14l-18.57-14.86a6 6 0 0 0-3.75-1.31h-.36a78 78 0 0 1-8.92 0a6 6 0 0 0-4.11 1.3L100.87 218a94 94 0 0 1-17.34-7.17l-2.63-23.62a6 6 0 0 0-2-3.82a75 75 0 0 1-6.31-6.31a6 6 0 0 0-3.82-2l-23.63-2.63A94.3 94.3 0 0 1 38 155.14l14.86-18.57a6 6 0 0 0 1.3-4.11a78 78 0 0 1 0-8.92a6 6 0 0 0-1.3-4.11L38 100.87a94 94 0 0 1 7.17-17.34l23.62-2.63a6 6 0 0 0 3.82-2a75 75 0 0 1 6.31-6.31a6 6 0 0 0 2-3.82l2.63-23.63A94.3 94.3 0 0 1 100.86 38l18.57 14.86a6 6 0 0 0 4.11 1.3a78 78 0 0 1 8.92 0a6 6 0 0 0 4.11-1.3L155.13 38a94 94 0 0 1 17.34 7.17l2.63 23.64a6 6 0 0 0 2 3.82a75 75 0 0 1 6.31 6.31a6 6 0 0 0 3.82 2l23.63 2.63a94.3 94.3 0 0 1 7.14 17.29l-14.86 18.57a6 6 0 0 0-1.3 4.11a78 78 0 0 1 0 8.92a6 6 0 0 0 1.3 4.11L218 155.13a94 94 0 0 1-7.15 17.34Z"></path></svg>');function Qr(a,e){const r=ke(e,["$$slots","$$events","$$legacy"]);var t=Wr();let n;Z(()=>n=Me(t,n,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...r})),M(a,t)}var Xr=xe('<svg><path fill="currentColor" d="M122 40V16a6 6 0 0 1 12 0v24a6 6 0 0 1-12 0m68 88a62 62 0 1 1-62-62a62.07 62.07 0 0 1 62 62m-12 0a50 50 0 1 0-50 50a50.06 50.06 0 0 0 50-50M59.76 68.24a6 6 0 1 0 8.48-8.48l-16-16a6 6 0 0 0-8.48 8.48Zm0 119.52l-16 16a6 6 0 1 0 8.48 8.48l16-16a6 6 0 1 0-8.48-8.48M192 70a6 6 0 0 0 4.24-1.76l16-16a6 6 0 0 0-8.48-8.48l-16 16A6 6 0 0 0 192 70m4.24 117.76a6 6 0 0 0-8.48 8.48l16 16a6 6 0 0 0 8.48-8.48ZM46 128a6 6 0 0 0-6-6H16a6 6 0 0 0 0 12h24a6 6 0 0 0 6-6m82 82a6 6 0 0 0-6 6v24a6 6 0 0 0 12 0v-24a6 6 0 0 0-6-6m112-88h-24a6 6 0 0 0 0 12h24a6 6 0 0 0 0-12"></path></svg>');function Yr(a,e){const r=ke(e,["$$slots","$$events","$$legacy"]);var t=Xr();let n;Z(()=>n=Me(t,n,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...r})),M(a,t)}var Jr=xe('<svg><path fill="currentColor" d="M88 104H40a8 8 0 0 1-8-8V48a8 8 0 0 1 16 0v28.69l14.63-14.63A95.43 95.43 0 0 1 130 33.94h.53a95.36 95.36 0 0 1 67.07 27.33a8 8 0 0 1-11.18 11.44a79.52 79.52 0 0 0-55.89-22.77h-.45a79.56 79.56 0 0 0-56.14 23.43L59.31 88H88a8 8 0 0 1 0 16m128 48h-48a8 8 0 0 0 0 16h28.69l-14.63 14.63a79.56 79.56 0 0 1-56.13 23.43h-.45a79.52 79.52 0 0 1-55.89-22.77a8 8 0 1 0-11.18 11.44a95.36 95.36 0 0 0 67.07 27.33h.52a95.43 95.43 0 0 0 67.36-28.12L208 179.31V208a8 8 0 0 0 16 0v-48a8 8 0 0 0-8-8"></path></svg>');function et(a,e){const r=ke(e,["$$slots","$$events","$$legacy"]);var t=Jr();let n;Z(()=>n=Me(t,n,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...r})),M(a,t)}var at=xe('<svg><path fill="currentColor" d="M232.13 143.64a6 6 0 0 0-6-1.49a90.07 90.07 0 0 1-112.27-112.3a6 6 0 0 0-7.49-7.48a102.88 102.88 0 0 0-51.89 36.31a102 102 0 0 0 142.84 142.84a102.88 102.88 0 0 0 36.31-51.89a6 6 0 0 0-1.5-5.99m-42 48.29a90 90 0 0 1-126-126a90.9 90.9 0 0 1 35.52-28.27a102.06 102.06 0 0 0 118.69 118.69a90.9 90.9 0 0 1-28.24 35.58Z"></path></svg>');function rt(a,e){const r=ke(e,["$$slots","$$events","$$legacy"]);var t=at();let n;Z(()=>n=Me(t,n,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...r})),M(a,t)}var tt=xe('<svg><path fill="currentColor" d="M164.24 100.24L136.48 128l27.76 27.76a6 6 0 1 1-8.48 8.48L128 136.48l-27.76 27.76a6 6 0 0 1-8.48-8.48L119.52 128l-27.76-27.76a6 6 0 0 1 8.48-8.48L128 119.52l27.76-27.76a6 6 0 0 1 8.48 8.48M230 128A102 102 0 1 1 128 26a102.12 102.12 0 0 1 102 102m-12 0a90 90 0 1 0-90 90a90.1 90.1 0 0 0 90-90"></path></svg>');function nt(a,e){const r=ke(e,["$$slots","$$events","$$legacy"]);var t=tt();let n;Z(()=>n=Me(t,n,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...r})),M(a,t)}var ot=(a,e)=>{Q(e,!1)},it=V('<!> <dialog class="container svelte-k25xuh"><div class="listParam svelte-k25xuh"><div class="setting svelte-k25xuh">Thème <!> <!></div> <div class="setting svelte-k25xuh">Mode debug <!></div> <div class="setting svelte-k25xuh"><!></div> <div class="setting svelte-k25xuh"><!></div> <footer>C.i.g.a.l.e vDEV · <a href="#/about">À propos</a></footer></div></dialog>',1);function st(a,e){Se(e,!0);let r=ve(!1),t=ve(void 0);Ie(()=>{window.addEventListener("mouseup",({target:g})=>{var h;g!==d(t)&&((h=d(t))!=null&&h.contains(g)||Q(r,!1))})});let n=ve(!0);Ie(()=>{window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",g=>{Q(n,!g.matches)})});var i=it(),s=ee(i);const l=U(()=>d(r)?"Fermer":"Réglages");pa(s,{get help(){return d(l)},onclick:()=>{Q(r,!d(r))},children:(g,h)=>{var w=Ma(),C=ee(w);{var F=z=>{nt(z,{})},L=z=>{Qr(z,{})};oe(C,z=>{d(r)?z(F):z(L,!1)})}M(g,w)}});var c=$(s,2),f=T(c),o=T(f),u=$(T(o));const v=U(()=>ge().theme==="auto"?d(n):ge().theme==="light");da(u,{get value(){return d(v)},onchange:async g=>{await Ke("theme",g?"light":"dark")},icons:{on:Yr,off:rt}});var p=$(u,2);const x=U(()=>ge().theme==="auto");pa(p,{get disabled(){return d(x)},onclick:async()=>await Ke("theme","auto"),help:"Synchroniser avec le thème du système",children:(g,h)=>{et(g,{})}}),B(o);var m=$(o,2),_=$(T(m));da(_,{get value(){return ge().showTechnicalMetadata},onchange:async g=>{await Ke("showTechnicalMetadata",g)}}),B(m);var k=$(m,2),j=T(k);be(j,{onclick:async()=>{Q(r,!1),await Ne("#/protocols")},children:(g,h)=>{ce();var w=fe("Gérer les protocoles");M(g,w)},$$slots:{default:!0}}),B(k);var I=$(k,2),y=T(I);be(y,{onclick:()=>{var g;(g=e.openKeyboardShortcuts)==null||g.call(e)},children:(g,h)=>{ce();var w=fe("Raccourcis clavier");M(g,w)},$$slots:{default:!0}}),B(I);var P=$(I,2),R=$(T(P));R.__click=[ot,r],B(P),B(f),B(c),ur(c,g=>Q(t,g),()=>d(t)),Z(g=>{re(c,"data-theme",g),c.open=d(r)?!0:void 0},[()=>ge().theme]),M(a,i),je()}ka(["click"]);var lt=V('<button class="pr-number svelte-1i3vnya"></button>'),ct=V('<div class="line svelte-1i3vnya"></div>'),vt=V('<div class="line svelte-1i3vnya"></div>'),ft=V('<div class="line svelte-1i3vnya"></div>'),ut=V('<div class="line svelte-1i3vnya"></div>'),pt=V("<!> Résultats",1),dt=V('<!> <!> <header><nav class="svelte-1i3vnya"><div class="logo svelte-1i3vnya"><a href="#/" class="svelte-1i3vnya"><svelte-css-wrapper style="display: contents"><!></svelte-css-wrapper> C.i.g.a.l.e.</a> <!></div> <div class="steps svelte-1i3vnya"><a href="#/" class="svelte-1i3vnya">Protocole <!></a> <!> <a href="#/import" class="svelte-1i3vnya">Importer <!></a> <!> <a href="#/crop" class="svelte-1i3vnya">Recadrer <!></a> <!> <a href="#/classify" class="svelte-1i3vnya">Classifier <!></a> <!> <!></div> <svelte-css-wrapper style="display: contents"><!></svelte-css-wrapper></nav> <!></header>',1);function mt(a,e){Se(e,!0);let r=aa(e,"progress",3,0);const t=U(()=>Ia.url.hash.replace(/^#/,"")),n=U(()=>ae.Image.state.length>0);let i=ve(void 0),s=ve(void 0);Ie(()=>{K.currentProtocolId||Ne("#/"),K.currentProtocolId&&!d(n)&&Ne("#/import")});let l=ve(void 0);var c=dt(),f=ee(c);Gr(f,{get progress(){return r()},get open(){return d(s)},set open(b){Q(s,b,!0)}});var o=$(f,2);{var u=b=>{kr(b,{get open(){return d(l)},set open(S){Q(l,S,!0)}})};oe(o,b=>{le&&b(u)})}var v=$(o,2),p=T(v),x=T(p),m=T(x),_=T(m);Ge(_,()=>({"--fill":"var(--bg-primary)"})),or(_.lastChild,{}),B(_),ce(),B(m);var k=$(m,2);{var j=b=>{var S=lt();S.__click=function(...J){var se;(se=d(l))==null||se.apply(this,J)},S.textContent=`Preview #${le??""}`,M(b,S)};oe(k,b=>{le&&b(j)})}B(x);var I=$(x,2),y=T(I),P=$(T(y));{var R=b=>{var S=ct();M(b,S)};oe(P,b=>{d(t)=="/"&&b(R)})}B(y);var g=$(y,2);Le(g,{});var h=$(g,2),w=$(T(h));{var C=b=>{var S=vt();M(b,S)};oe(w,b=>{d(t)=="/import"&&b(C)})}B(h);var F=$(h,2);Le(F,{});var L=$(F,2),z=$(T(L));{var D=b=>{var S=ft();M(b,S)};oe(z,b=>{d(t)=="/crop"&&b(D)})}B(L);var E=$(L,2);Le(E,{});var q=$(E,2),A=$(T(q));{var W=b=>{var S=ut();M(b,S)};oe(A,b=>{d(t)=="/classify"&&b(W)})}B(q);var Y=$(q,2);Le(Y,{});var ue=$(Y,2);be(ue,{get onclick(){return d(s)},children:(b,S)=>{var J=pt(),se=ee(J);Pa(se,{}),ce(),M(b,J)},$$slots:{default:!0}}),B(I);var H=$(I,2);Ge(H,()=>({"--navbar-height":`${d(i)??""}px`})),st(H.lastChild,{get openKeyboardShortcuts(){return e.openKeyboardShortcuts}}),B(H),B(p);var ie=$(p,2);const te=U(()=>K.processing.state==="generating-zip"?0:r());ja(ie,{get progress(){return d(te)}}),B(v),Z(()=>{re(h,"aria-disabled",!K.currentProtocolId),re(L,"aria-disabled",!K.currentProtocolId||!d(n)),re(q,"aria-disabled",!K.currentProtocolId||!d(n))}),nr(v,"clientHeight",b=>Q(i,b)),M(a,c),je()}ka(["click"]);var gt=V("<base>"),ht=V('<!> <!> <section class="toasts svelte-1s1jxo8"></section> <div><!></div>',1);function Jt(a,e){Se(e,!0);const r={capture(){return Za(K,"currentProtocolId")},restore({currentProtocolId:v}){K.currentProtocolId=v}};Ie(()=>{for(const v of ae.Image.state)K.hasPreviewURL(v)||(async()=>{const p=await $a("ImagePreviewFile",xa(v.id));if(!p)return;const x=new Blob([p.bytes],{type:v.contentType});K.setPreviewURL(v,URL.createObjectURL(x))})()});const t=U(ge);Ie(()=>{document.documentElement.dataset.theme=d(t).theme});let n=ve(void 0);var i=ht();Xa(v=>{var p=gt();re(p,"href",Ze?`${Ze}/index.html`:""),M(v,p)});var s=ee(i);mt(s,{get openKeyboardShortcuts(){return d(n)},get progress(){return K.processing.progress}});var l=$(s,2);rr(l,{preventDefault:!0,get binds(){return K.keybinds},get openHelp(){return d(n)},set openHelp(v){Q(n,v,!0)}});var c=$(l,2);Ya(c,21,()=>_e.items,v=>v.id,(v,p)=>{tr(v,ar(()=>d(p),{get action(){return d(p).labels.action},get dismiss(){return d(p).labels.close},onaction:()=>{var x,m;(m=(x=d(p).callbacks)==null?void 0:x.action)==null||m.call(x,d(p))},ondismiss:()=>{_e.remove(d(p).id)}}))}),B(c);var f=$(c,2);let o;var u=T(f);return Ja(u,()=>e.children??ba),B(f),Z(v=>o=er(f,1,"contents svelte-1s1jxo8",null,o,v),[()=>{var v;return{padded:!((v=Ia.route.id)!=null&&v.includes("/(sidepanel)"))}}]),M(a,i),je({snapshot:r})}export{Jt as component,Yt as universal};
