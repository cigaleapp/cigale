import{Y as Ka,aE as Ua,aT as Za,aU as Ga,t as Z,a9 as Se,a8 as V,f as ee,g,a as x,c as O,r as L,a6 as ka,ab as ce,aa as Le,s as ve,b as Q,F as je}from"../chunks/BsWIUf9a.js";import{t as re,o as Ja,P as le,v as Qa,u as K,S as ua,a as da,s as Wa,e as ja,f as Ia,Q as Ya}from"../chunks/BojhtsgJ.js";import{a as Xa,i as ga,r as pa}from"../chunks/Bhhi0v22.js";import{toasts as ye}from"../chunks/DdosIcSB.js";import{H as er,g as Ze}from"../chunks/Y6Vcp7MK.js";import{n as xe,a as k,c as Sa,b as fe,t as H}from"../chunks/C2IogcR0.js";import{s as pe,d as La,h as ar}from"../chunks/Dh4X4SMs.js";import{e as rr}from"../chunks/DwKQaEPv.js";import{s as tr}from"../chunks/JvKoHCmT.js";import{s as Me,a as ae,c as nr}from"../chunks/BKfSxfdr.js";import{r as Pe,p as ra,s as or}from"../chunks/COZIH9cg.js";import{b as Ge}from"../chunks/EuML1_TQ.js";import{p as Ba}from"../chunks/DnIOC_Qj.js";import sr from"../chunks/DdgyBh4L.js";import ir from"../chunks/DO6nkSTp.js";import{s as Ue,g as me}from"../chunks/sc6eWptX.js";import{i as oe}from"../chunks/m4WIalkB.js";import{c as Je}from"../chunks/DfcF9V-c.js";import{b as lr}from"../chunks/BsXC0hzp.js";import $e from"../chunks/C3Mao4Fe.js";import cr from"../chunks/tiskVc8I.js";import Ca from"../chunks/BG3mXGTU.js";import{D as Oa}from"../chunks/D5EbfbuS.js";import{a as Qe}from"../chunks/DF75oJVz.js";import Ta from"../chunks/Cu_xDW_D.js";import vr from"../chunks/CGCEo_ab.js";import{e as fr}from"../chunks/De4p8MXH.js";import ur from"../chunks/BNY0s2qy.js";import{k as dr,t as gr}from"../chunks/BjzE4j1B.js";import{o as ma,e as ke,g as Be,h as pr}from"../chunks/976Y_sjS.js";import{a as ha}from"../chunks/BWAvk7Gj.js";import{b as mr}from"../chunks/zyWsatLj.js";import wa from"../chunks/D9kBmoMF.js";import _a from"../chunks/BiC2psgq.js";const hr=[];function wr(a,e=!1){return Te(a,new Map,"",hr)}function Te(a,e,r,t,n=null){if(typeof a=="object"&&a!==null){var o=e.get(a);if(o!==void 0)return o;if(a instanceof Map)return new Map(a);if(a instanceof Set)return new Set(a);if(Ka(a)){var s=Array(a.length);e.set(a,s),n!==null&&e.set(n,s);for(var l=0;l<a.length;l+=1){var c=a[l];l in a&&(s[l]=Te(c,e,r,t))}return s}if(Ua(a)===Za){s={},e.set(a,s),n!==null&&e.set(n,s);for(var f in a)s[f]=Te(a[f],e,r,t);return s}if(a instanceof Date)return structuredClone(a);if(typeof a.toJSON=="function")return Te(a.toJSON(),e,r,t,a)}if(a instanceof EventTarget)return a;try{return structuredClone(a)}catch{return a}}const _r=Ga;function yr(a,e){throw new er(a,e)}new TextEncoder;async function $r(){try{await re.initialize(),await br(),await re.initialize()}catch(a){console.error(a),yr(400,{message:(a==null?void 0:a.toString())??"Erreur inattendue"})}}async function br(){if(await Ja(["Metadata","Protocol","Settings"],{},async e=>{e.objectStore("Settings").put({id:"defaults",protocols:[],theme:"auto",gridSize:10,language:"fr",showInputHints:!0,showTechnicalMetadata:_r})}),!await re.Protocol.get("io.github.cigaleapp.arthropods.transects"))try{await fetch("https://raw.githubusercontent.com/cigaleapp/cigale/main/examples/arthropods.cigaleprotocol.json").then(e=>e.text()).then(Xa)}catch(e){console.error(e),ye.error("Impossible de charger le protocole par défaut. Vérifiez votre connexion Internet ou essayez de recharger la page.")}}const tn=Object.freeze(Object.defineProperty({__proto__:null,load:$r},Symbol.toStringTag,{value:"Module"}));var xr=xe('<svg><path fill="currentColor" d="m181.66 133.66l-80 80a8 8 0 0 1-11.32-11.32L164.69 128L90.34 53.66a8 8 0 0 1 11.32-11.32l80 80a8 8 0 0 1 0 11.32"></path></svg>');function Ce(a,e){const r=Pe(e,["$$slots","$$events","$$legacy"]);var t=xr();let n;Z(()=>n=Me(t,n,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...r})),k(a,t)}const ya=(a,e=ka)=>{var r=Mr(),t=O(r),n=x(t,2);Qe(n,()=>fetch(e().url).then(o=>o.json()),o=>{var s=fe();Z(()=>pe(s,e().login)),k(o,s)},(o,s)=>{var l=V(()=>{var{name:i}=g(s);return{name:i}}),c=V(()=>g(l).name),f=fe();Z(()=>pe(f,g(c)||e().login)),k(o,f)},(o,s)=>{var l=fe();Z(()=>pe(l,e().login)),k(o,l)}),L(r),Z(()=>{ae(r,"href",e().html_url),ae(r,"title",`@${e().login}`),ae(t,"src",e().avatar_url),ae(t,"alt",`Avatar de ${e().login??""}`)}),k(a,r)};var Mr=H('<a class="github-user svelte-b46tju"><img class="svelte-b46tju"> <!></a>'),Pr=H("<!> <!>",1),kr=H("pour l'issue <a> </a> de <!>",1),jr=H('<li class="svelte-b46tju"><!></li>'),Ir=H('<p class="svelte-b46tju">Ceci est un déploiement de preview</p> <ul><li class="svelte-b46tju">pour la PR <a> </a> de <!></li> <!> <br></ul> <p class="svelte-b46tju"> </p>',1),Sr=H('<p class="svelte-b46tju">Ceci est un déploiement de preview pour la PR <a></a></p>');function Lr(a,e){Se(e,!0);let r=ra(e,"open",15);{const t=(n,o)=>{let s=()=>o==null?void 0:o().close;var l=Pr(),c=ee(l);$e(c,{help:"Supprime toutes les données pour ce déploiement de preview",onclick:()=>{Qa(),window.location.reload()},children:(i,d)=>{ce();var v=fe("Nettoyer la base de données");k(i,v)},$$slots:{default:!0}});var f=x(c,2);$e(f,{onclick:()=>{window.open(`https://github.com/cigaleapp/cigale/pull/${le}`),s()()},children:(i,d)=>{ce();var v=fe("Voir sur Github");k(i,v)},$$slots:{default:!0}}),k(n,l)};Ta(a,{key:"preview-pr",title:`Preview de la PR #${le??""}`,get open(){return r()},set open(n){r(n)},footer:t,children:(n,o)=>{var s=Sa();const l=V(()=>`https://github.com/cigaleapp/cigale/pull/${le}`);var c=ee(s);Qe(c,()=>fetch(`https://api.github.com/repos/cigaleapp/cigale/pulls/${le}`).then(f=>f.json()),f=>{var i=Sr(),d=x(O(i));d.textContent=`#${le??""}`,L(i),Z(()=>ae(d,"href",g(l))),k(f,i)},(f,i)=>{var d=V(()=>{var{title:S,user:R,body:C}=g(i);return{title:S,user:R,body:C}}),v=V(()=>g(d).title),u=V(()=>g(d).user),M=V(()=>g(d).body),p=Ir();const _=V(()=>{var S;return(S=/(Closes|Fixes) #(\d+)/i.exec(g(M)))==null?void 0:S[2]});var P=x(ee(p),2),B=O(P),$=x(O(B)),y=O($,!0);L($);var j=x($,2);ya(j,()=>g(u)),L(B);var z=x(B,2);{var m=S=>{var R=jr(),C=O(R);Qe(C,()=>fetch(`https://api.github.com/repos/cigaleapp/cigale/issues/${g(_)}`).then(F=>F.json()),null,(F,D)=>{var E=V(()=>{var{title:b,number:I,user:X,html_url:ie}=g(D);return{title:b,number:I,user:X,html_url:ie}}),q=V(()=>g(E).title),A=V(()=>g(E).number),J=V(()=>g(E).user),Y=V(()=>g(E).html_url),ue=kr(),N=x(ee(ue)),se=O(N);L(N);var te=x(N,2);ya(te,()=>g(J)),Z(()=>{ae(N,"href",g(Y)),pe(se,`#${g(A)??""} ${g(q)??""}`)}),k(F,ue)}),L(R),k(S,R)};oe(z,S=>{g(_)&&S(m)})}ce(2),L(P);var h=x(P,2),w=O(h,!0);L(h),Z(()=>{ae($,"href",g(l)),pe(y,g(v)),pe(w,g(M))}),k(f,p)},(f,i)=>{var d=fe();d.nodeValue=`#${le??""}`,k(f,d)}),k(n,s)},$$slots:{footer:!0,default:!0}})}Le()}var $a={},Br=function(a,e,r,t,n){var o=new Worker($a[e]||($a[e]=URL.createObjectURL(new Blob([a+';addEventListener("error",function(e){e=e.error;postMessage({$e$:[e.message,e.code,e.stack]})})'],{type:"text/javascript"}))));return o.onmessage=function(s){var l=s.data,c=l.$e$;if(c){var f=new Error(c[0]);f.code=c[1],f.stack=c[2],n(f,null)}else n(null,l)},o.postMessage(r,t),o},G=Uint8Array,W=Uint16Array,Re=Int32Array,qe=new G([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0,0]),Ve=new G([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,0,0]),We=new G([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),Ea=function(a,e){for(var r=new W(31),t=0;t<31;++t)r[t]=e+=1<<a[t-1];for(var n=new Re(r[30]),t=1;t<30;++t)for(var o=r[t];o<r[t+1];++o)n[o]=o-r[t]<<5|t;return{b:r,r:n}},Aa=Ea(qe,2),Cr=Aa.b,Ae=Aa.r;Cr[28]=258,Ae[258]=28;var Or=Ea(Ve,0),Ye=Or.r,ze=new W(32768);for(var T=0;T<32768;++T){var de=(T&43690)>>1|(T&21845)<<1;de=(de&52428)>>2|(de&13107)<<2,de=(de&61680)>>4|(de&3855)<<4,ze[T]=((de&65280)>>8|(de&255)<<8)>>1}var _e=function(a,e,r){for(var t=a.length,n=0,o=new W(e);n<t;++n)a[n]&&++o[a[n]-1];var s=new W(e);for(n=1;n<e;++n)s[n]=s[n-1]+o[n-1]<<1;var l;if(r){l=new W(1<<e);var c=15-e;for(n=0;n<t;++n)if(a[n])for(var f=n<<4|a[n],i=e-a[n],d=s[a[n]-1]++<<i,v=d|(1<<i)-1;d<=v;++d)l[ze[d]>>c]=f}else for(l=new W(t),n=0;n<t;++n)a[n]&&(l[n]=ze[s[a[n]-1]++]>>15-a[n]);return l},ge=new G(288);for(var T=0;T<144;++T)ge[T]=8;for(var T=144;T<256;++T)ge[T]=9;for(var T=256;T<280;++T)ge[T]=7;for(var T=280;T<288;++T)ge[T]=8;var Ie=new G(32);for(var T=0;T<32;++T)Ie[T]=5;var za=_e(ge,9,0),Fa=_e(Ie,5,0),ta=function(a){return(a+7)/8|0},na=function(a,e,r){return(e==null||e<0)&&(e=0),(r==null||r>a.length)&&(r=a.length),new G(a.subarray(e,r))},Tr=["unexpected EOF","invalid block type","invalid length/literal","invalid distance","stream finished","no stream handler",,"no callback","invalid UTF-8 data","extra field too long","date not in range 1980-2099","filename too long","stream finishing","invalid zip data"],be=function(a,e,r){var t=new Error(e||Tr[a]);if(t.code=a,Error.captureStackTrace&&Error.captureStackTrace(t,be),!r)throw t;return t},ne=function(a,e,r){r<<=e&7;var t=e/8|0;a[t]|=r,a[t+1]|=r>>8},he=function(a,e,r){r<<=e&7;var t=e/8|0;a[t]|=r,a[t+1]|=r>>8,a[t+2]|=r>>16},Ee=function(a,e){for(var r=[],t=0;t<a.length;++t)a[t]&&r.push({s:t,f:a[t]});var n=r.length,o=r.slice();if(!n)return{t:sa,l:0};if(n==1){var s=new G(r[0].s+1);return s[r[0].s]=1,{t:s,l:1}}r.sort(function(j,z){return j.f-z.f}),r.push({s:-1,f:25001});var l=r[0],c=r[1],f=0,i=1,d=2;for(r[0]={s:-1,f:l.f+c.f,l,r:c};i!=n-1;)l=r[r[f].f<r[d].f?f++:d++],c=r[f!=i&&r[f].f<r[d].f?f++:d++],r[i++]={s:-1,f:l.f+c.f,l,r:c};for(var v=o[0].s,t=1;t<n;++t)o[t].s>v&&(v=o[t].s);var u=new W(v+1),M=Fe(r[i-1],u,0);if(M>e){var t=0,p=0,_=M-e,P=1<<_;for(o.sort(function(z,m){return u[m.s]-u[z.s]||z.f-m.f});t<n;++t){var B=o[t].s;if(u[B]>e)p+=P-(1<<M-u[B]),u[B]=e;else break}for(p>>=_;p>0;){var $=o[t].s;u[$]<e?p-=1<<e-u[$]++-1:++t}for(;t>=0&&p;--t){var y=o[t].s;u[y]==e&&(--u[y],++p)}M=e}return{t:new G(u),l:M}},Fe=function(a,e,r){return a.s==-1?Math.max(Fe(a.l,e,r+1),Fe(a.r,e,r+1)):e[a.s]=r},Xe=function(a){for(var e=a.length;e&&!a[--e];);for(var r=new W(++e),t=0,n=a[0],o=1,s=function(c){r[t++]=c},l=1;l<=e;++l)if(a[l]==n&&l!=e)++o;else{if(!n&&o>2){for(;o>138;o-=138)s(32754);o>2&&(s(o>10?o-11<<5|28690:o-3<<5|12305),o=0)}else if(o>3){for(s(n),--o;o>6;o-=6)s(8304);o>2&&(s(o-3<<5|8208),o=0)}for(;o--;)s(n);o=1,n=a[l]}return{c:r.subarray(0,t),n:e}},we=function(a,e){for(var r=0,t=0;t<e.length;++t)r+=a[t]*e[t];return r},oa=function(a,e,r){var t=r.length,n=ta(e+2);a[n]=t&255,a[n+1]=t>>8,a[n+2]=a[n]^255,a[n+3]=a[n+1]^255;for(var o=0;o<t;++o)a[n+o+4]=r[o];return(n+4+t)*8},ea=function(a,e,r,t,n,o,s,l,c,f,i){ne(e,i++,r),++n[256];for(var d=Ee(n,15),v=d.t,u=d.l,M=Ee(o,15),p=M.t,_=M.l,P=Xe(v),B=P.c,$=P.n,y=Xe(p),j=y.c,z=y.n,m=new W(19),h=0;h<B.length;++h)++m[B[h]&31];for(var h=0;h<j.length;++h)++m[j[h]&31];for(var w=Ee(m,7),S=w.t,R=w.l,C=19;C>4&&!S[We[C-1]];--C);var F=f+5<<3,D=we(n,ge)+we(o,Ie)+s,E=we(n,v)+we(o,p)+s+14+3*C+we(m,S)+2*m[16]+3*m[17]+7*m[18];if(c>=0&&F<=D&&F<=E)return oa(e,i,a.subarray(c,c+f));var q,A,J,Y;if(ne(e,i,1+(E<D)),i+=2,E<D){q=_e(v,u,0),A=v,J=_e(p,_,0),Y=p;var ue=_e(S,R,0);ne(e,i,$-257),ne(e,i+5,z-1),ne(e,i+10,C-4),i+=14;for(var h=0;h<C;++h)ne(e,i+3*h,S[We[h]]);i+=3*C;for(var N=[B,j],se=0;se<2;++se)for(var te=N[se],h=0;h<te.length;++h){var b=te[h]&31;ne(e,i,ue[b]),i+=S[b],b>15&&(ne(e,i,te[h]>>5&127),i+=te[h]>>12)}}else q=za,A=ge,J=Fa,Y=Ie;for(var h=0;h<l;++h){var I=t[h];if(I>255){var b=I>>18&31;he(e,i,q[b+257]),i+=A[b+257],b>7&&(ne(e,i,I>>23&31),i+=qe[b]);var X=I&31;he(e,i,J[X]),i+=Y[X],X>3&&(he(e,i,I>>5&8191),i+=Ve[X])}else he(e,i,q[I]),i+=A[I]}return he(e,i,q[256]),i+A[256]},Da=new Re([65540,131080,131088,131104,262176,1048704,1048832,2114560,2117632]),sa=new G(0),Ra=function(a,e,r,t,n,o){var s=o.z||a.length,l=new G(t+s+5*(1+Math.ceil(s/7e3))+n),c=l.subarray(t,l.length-n),f=o.l,i=(o.r||0)&7;if(e){i&&(c[0]=o.r>>3);for(var d=Da[e-1],v=d>>13,u=d&8191,M=(1<<r)-1,p=o.p||new W(32768),_=o.h||new W(M+1),P=Math.ceil(r/3),B=2*P,$=function(Ke){return(a[Ke]^a[Ke+1]<<P^a[Ke+2]<<B)&M},y=new Re(25e3),j=new W(288),z=new W(32),m=0,h=0,w=o.i||0,S=0,R=o.w||0,C=0;w+2<s;++w){var F=$(w),D=w&32767,E=_[F];if(p[D]=E,_[F]=D,R<=w){var q=s-w;if((m>7e3||S>24576)&&(q>423||!f)){i=ea(a,c,0,y,j,z,h,S,C,w-C,i),S=m=h=0,C=w;for(var A=0;A<286;++A)j[A]=0;for(var A=0;A<30;++A)z[A]=0}var J=2,Y=0,ue=u,N=D-E&32767;if(q>2&&F==$(w-N))for(var se=Math.min(v,q)-1,te=Math.min(32767,w),b=Math.min(258,q);N<=te&&--ue&&D!=E;){if(a[w+J]==a[w+J-N]){for(var I=0;I<b&&a[w+I]==a[w+I-N];++I);if(I>J){if(J=I,Y=N,I>se)break;for(var X=Math.min(N,I-2),ie=0,A=0;A<X;++A){var He=w-N+A&32767,Na=p[He],ca=He-Na&32767;ca>ie&&(ie=ca,E=He)}}}D=E,E=p[D],N+=D-E&32767}if(Y){y[S++]=268435456|Ae[J]<<18|Ye[Y];var va=Ae[J]&31,fa=Ye[Y]&31;h+=qe[va]+Ve[fa],++j[257+va],++z[fa],R=w+J,++m}else y[S++]=a[w],++j[a[w]]}}for(w=Math.max(w,R);w<s;++w)y[S++]=a[w],++j[a[w]];i=ea(a,c,f,y,j,z,h,S,C,w-C,i),f||(o.r=i&7|c[i/8|0]<<3,i-=7,o.h=_,o.p=p,o.i=w,o.w=R)}else{for(var w=o.w||0;w<s+f;w+=65535){var Ne=w+65535;Ne>=s&&(c[i/8|0]=f,Ne=s),i=oa(c,i+1,a.subarray(w,Ne))}o.i=s}return na(l,0,t+ta(i)+n)},Er=function(){for(var a=new Int32Array(256),e=0;e<256;++e){for(var r=e,t=9;--t;)r=(r&1&&-306674912)^r>>>1;a[e]=r}return a}(),Ar=function(){var a=-1;return{p:function(e){for(var r=a,t=0;t<e.length;++t)r=Er[r&255^e[t]]^r>>>8;a=r},d:function(){return~a}}},qa=function(a,e,r,t,n){if(!n&&(n={l:1},e.dictionary)){var o=e.dictionary.subarray(-32768),s=new G(o.length+a.length);s.set(o),s.set(a,o.length),a=s,n.w=o.length}return Ra(a,e.level==null?6:e.level,e.mem==null?n.l?Math.ceil(Math.max(8,Math.min(13,Math.log(a.length)))*1.5):20:12+e.mem,r,t,n)},ia=function(a,e){var r={};for(var t in a)r[t]=a[t];for(var t in e)r[t]=e[t];return r},ba=function(a,e,r){for(var t=a(),n=a.toString(),o=n.slice(n.indexOf("[")+1,n.lastIndexOf("]")).replace(/\s+/g,"").split(","),s=0;s<t.length;++s){var l=t[s],c=o[s];if(typeof l=="function"){e+=";"+c+"=";var f=l.toString();if(l.prototype)if(f.indexOf("[native code]")!=-1){var i=f.indexOf(" ",8)+1;e+=f.slice(i,f.indexOf("(",i))}else{e+=f;for(var d in l.prototype)e+=";"+c+".prototype."+d+"="+l.prototype[d].toString()}else e+=f}else r[c]=l}return e},Oe=[],zr=function(a){var e=[];for(var r in a)a[r].buffer&&e.push((a[r]=new a[r].constructor(a[r])).buffer);return e},Fr=function(a,e,r,t){if(!Oe[r]){for(var n="",o={},s=a.length-1,l=0;l<s;++l)n=ba(a[l],n,o);Oe[r]={c:ba(a[s],n,o),e:o}}var c=ia({},Oe[r].e);return Br(Oe[r].c+";onmessage=function(e){for(var k in e.data)self[k]=e.data[k];onmessage="+e.toString()+"}",r,c,zr(c),t)},Dr=function(){return[G,W,Re,qe,Ve,We,Ae,Ye,za,ge,Fa,Ie,ze,Da,sa,_e,ne,he,Ee,Fe,Xe,we,oa,ea,ta,na,Ra,qa,la,Va]},Va=function(a){return postMessage(a,[a.buffer])},Rr=function(a,e,r,t,n,o){var s=Fr(r,t,n,function(l,c){s.terminate(),o(l,c)});return s.postMessage([a,e],e.consume?[a.buffer]:[]),function(){s.terminate()}},U=function(a,e,r){for(;r;++e)a[e]=r,r>>>=8};function qr(a,e,r){return r||(r=e,e={}),typeof r!="function"&&be(7),Rr(a,e,[Dr],function(t){return Va(la(t.data[0],t.data[1]))},0,r)}function la(a,e){return qa(a,e||{},0,0)}var Ha=function(a,e,r,t){for(var n in a){var o=a[n],s=e+n,l=t;Array.isArray(o)&&(l=ia(t,o[1]),o=o[0]),o instanceof G?r[s]=[o,l]:(r[s+="/"]=[new G(0),l],Ha(o,s,r,t))}},xa=typeof TextEncoder<"u"&&new TextEncoder,Vr=typeof TextDecoder<"u"&&new TextDecoder,Hr=0;try{Vr.decode(sa,{stream:!0}),Hr=1}catch{}function De(a,e){var r;if(xa)return xa.encode(a);for(var t=a.length,n=new G(a.length+(a.length>>1)),o=0,s=function(f){n[o++]=f},r=0;r<t;++r){if(o+5>n.length){var l=new G(o+8+(t-r<<1));l.set(n),n=l}var c=a.charCodeAt(r);c<128||e?s(c):c<2048?(s(192|c>>6),s(128|c&63)):c>55295&&c<57344?(c=65536+(c&1047552)|a.charCodeAt(++r)&1023,s(240|c>>18),s(128|c>>12&63),s(128|c>>6&63),s(128|c&63)):(s(224|c>>12),s(128|c>>6&63),s(128|c&63))}return na(n,0,o)}var aa=function(a){var e=0;if(a)for(var r in a){var t=a[r].length;t>65535&&be(9),e+=t+4}return e},Ma=function(a,e,r,t,n,o,s,l){var c=t.length,f=r.extra,i=l&&l.length,d=aa(f);U(a,e,s!=null?33639248:67324752),e+=4,s!=null&&(a[e++]=20,a[e++]=r.os),a[e]=20,e+=2,a[e++]=r.flag<<1|(o<0&&8),a[e++]=n&&8,a[e++]=r.compression&255,a[e++]=r.compression>>8;var v=new Date(r.mtime==null?Date.now():r.mtime),u=v.getFullYear()-1980;if((u<0||u>119)&&be(10),U(a,e,u<<25|v.getMonth()+1<<21|v.getDate()<<16|v.getHours()<<11|v.getMinutes()<<5|v.getSeconds()>>1),e+=4,o!=-1&&(U(a,e,r.crc),U(a,e+4,o<0?-o-2:o),U(a,e+8,r.size)),U(a,e+12,c),U(a,e+14,d),e+=16,s!=null&&(U(a,e,i),U(a,e+6,r.attrs),U(a,e+10,s),e+=14),a.set(t,e),e+=c,d)for(var M in f){var p=f[M],_=p.length;U(a,e,+M),U(a,e+2,_),a.set(p,e+4),e+=4+_}return i&&(a.set(l,e),e+=i),e},Nr=function(a,e,r,t,n){U(a,e,101010256),U(a,e+8,r),U(a,e+10,r),U(a,e+12,t),U(a,e+16,n)};function Kr(a,e,r){r||(r=e,e={}),typeof r!="function"&&be(7);var t={};Ha(a,"",t,e);var n=Object.keys(t),o=n.length,s=0,l=0,c=o,f=new Array(o),i=[],d=function(){for(var _=0;_<i.length;++_)i[_]()},v=function(_,P){Pa(function(){r(_,P)})};Pa(function(){v=r});var u=function(){var _=new G(l+22),P=s,B=l-s;l=0;for(var $=0;$<c;++$){var y=f[$];try{var j=y.c.length;Ma(_,l,y,y.f,y.u,j);var z=30+y.f.length+aa(y.extra),m=l+z;_.set(y.c,m),Ma(_,s,y,y.f,y.u,j,l,y.m),s+=16+z+(y.m?y.m.length:0),l=m+j}catch(h){return v(h,null)}}Nr(_,s,f.length,B,P),v(null,_)};o||u();for(var M=function(_){var P=n[_],B=t[P],$=B[0],y=B[1],j=Ar(),z=$.length;j.p($);var m=De(P),h=m.length,w=y.comment,S=w&&De(w),R=S&&S.length,C=aa(y.extra),F=y.level==0?0:8,D=function(E,q){if(E)d(),v(E,null);else{var A=q.length;f[_]=ia(y,{size:z,crc:j.d(),c:q,f:m,m:S,u:h!=P.length||S&&w.length!=R,compression:F}),s+=30+h+C+A,l+=76+2*(h+C)+(R||0)+A,--o||u()}};if(h>65535&&D(be(11,0,1),null),!F)D(null,$);else if(z<16e4)try{D(null,la($,y))}catch(E){D(E,null)}else i.push(qr($,y,D))},p=0;p<c;++p)M(p);return d}var Pa=typeof queueMicrotask=="function"?queueMicrotask:typeof setTimeout=="function"?setTimeout:function(a){a()};async function Ur(a,e,{include:r="croppedonly",base:t}){const n=Object.fromEntries(await Promise.all(a.map(async i=>[i.id,{label:i.label,metadata:await ma(i).then(ke),protocolMetadata:Object.fromEntries(Object.entries(await ma(i).then(ke)).filter(([d])=>ga(e.id,d)).map(([d,v])=>[pa(d),v])),images:i.images.map(d=>{const v=re.Image.state.find(u=>u.id===d);if(v)return{...v,metadata:ke(v.metadata)}})}]))),o=[...new Set(a.flatMap(i=>Object.keys(n[i.id].metadata)))],s=Object.fromEntries(re.Metadata.state.map(i=>[i.id,i]));let l=[];if(K.processing.state="generating-zip",K.processing.total=1,K.processing.done=0,r!=="metadataonly"){K.processing.total+=a.flatMap(i=>i.images).length;for(const[i,d]of a.flatMap(v=>v.images.map(u=>[v,u]))){const v=await re.Image.get(d);if(!v)throw"Image non trouvée";const u={...v.metadata,...i.metadataOverrides},{contentType:M,filename:p}=v,{cropped:_,original:P}=await Zr(e,v);l.push({imageId:d,croppedBytes:ha(_,Object.values(s),u),originalBytes:r==="full"?ha(P,Object.values(s),u):void 0,contentType:M,filename:p}),K.processing.done++}}console.log({buffersOfImages:l});const c=e.exports??{images:{cropped:ua.FilepathTemplate.assert("cropped/{{sequence}}.{{extension image.filename}}"),original:ua.FilepathTemplate.assert("original/{{sequence}}.{{extension image.filename}}")},metadata:{json:"analysis.json",csv:"metadata.csv"}},f=await new Promise((i,d)=>Kr({[c.metadata.json]:De(Wa("json",`${window.location.origin}${t}/results.schema.json`,{observations:n,protocol:e},["protocol","observations"])),[c.metadata.csv]:De(Gr(["Identifiant","Observation",...o.flatMap(v=>[Be(s[v]),`${Be(s[v])}: Confiance`])],a.map(v=>({Identifiant:v.id,Observation:v.label,...Object.fromEntries(Object.entries(n[v.id].metadata).flatMap(([u,{value:M,confidence:p}])=>[[Be(s[u]),pr(s[u],M)],[`${Be(s[u])}: Confiance`,p.toString()]]))})))),...Object.fromEntries(r==="metadataonly"?[]:a.flatMap(v=>v.images.map(u=>[v,u])).flatMap(([v,u],M)=>{const p=l.find($=>$.imageId===u);if(!p)throw"Image non trouvée";const _=re.Image.state.find($=>$.id===u);if(!_)throw"Image non trouvée";const P=wr({image:{..._,metadata:ke(_.metadata),protocolMetadata:Object.fromEntries(Object.entries(ke(_.metadata)).filter(([$])=>ga(e.id,$)).map(([$,y])=>[pa($),y]))},observation:v,sequence:M+1});da(new Blob([p.croppedBytes],{type:"image/jpeg"}),"feur.jpeg");const B=[[c.images.cropped.render(P),[p.croppedBytes,{level:0}]],[c.images.original.render(P),[p.originalBytes,{level:0}]]].filter(([,[$]])=>$!==void 0);return console.log({out:B}),B}))},{comment:`Generated by C.i.g.a.l.e on ${new Date().toISOString()} - ${window.location.origin}`},(v,u)=>{v&&d(v),i(u)}));K.processing.done++,da(f,"results.zip","application/zip")}async function Zr(a,e){var s,l,c;const r=(l=e.metadata[((s=a.crop)==null?void 0:s.metadata)??"crop"])==null?void 0:l.value;if(!r)throw"L'image n'a pas d'information de recadrage";const t=await ja("ImageFile",Ia(e.id)).then(f=>f==null?void 0:f.bytes);if(!t)throw"L'image n'a pas de fichier associé";const n=await createImageBitmap(new Blob([t],{type:e.contentType})),o=dr({x:n.width,y:n.height})(gr(r));try{const f=await createImageBitmap(n,o.x,o.y,o.width,o.height),i=document.createElement("canvas");return i.width=f.width,i.height=f.height,(c=i.getContext("2d"))==null||c.drawImage(f,0,0),{cropped:await new Promise(v=>i.toBlob(v,["image/png","image/jpeg"].includes(e.contentType)?e.contentType:"image/png")).then(v=>v.arrayBuffer()),original:t}}catch(f){ye.warn(`Impossible de recadrer ${e.filename}, l'image sera incluse sans recadrage`),console.error(`Couldn't crop ${e.filename} (id ${e.id}) with `,{boundingBox:o},":",f)}finally{n.close()}return{cropped:t,original:t}}function Gr(a,e,r=";"){const t=n=>`"${(n==null?void 0:n.replace(/"/g,'""'))??""}"`;return[a.map(t).join(r),...e.map(n=>a.map(o=>t(n[o])).join(r))].join(`
`)}var Jr=H("<code> </code> <!>",1),Qr=H("<!> results.zip",1),Wr=H('<section class="progress svelte-q4lxxz"><!></section> <!>',1),Yr=H('<svelte-css-wrapper style="display: contents"><!></svelte-css-wrapper>',1);function Xr(a,e){Se(e,!0);let r=ra(e,"open",15),t=ve(!1),n=ve("croppedonly");async function o(){Q(t,!0);const c=re.Protocol.state.find(f=>f.id===K.currentProtocolId);if(!c){ye.error("Aucun protocole sélectionné"),Q(t,!1);return}try{await fr(),await Ur(re.Observation.state,c,{base:Ge,include:g(n)})}catch(f){console.error(f),ye.error(`Erreur lors de l'exportation des résultats: ${(f==null?void 0:f.toString())??"Erreur inattendue"}`)}finally{Q(t,!1)}}var s=Yr(),l=ee(s);{const c=f=>{var i=Wr(),d=ee(i),v=O(d);{var u=p=>{var _=Jr(),P=ee(_),B=O(P);L(P);var $=x(P,2);Ca($,{get progress(){return e.progress}}),Z(y=>pe(B,`${y??""}%`),[()=>Math.floor(e.progress*100)]),k(p,_)};oe(v,p=>{[0,1].includes(e.progress)||p(u)})}L(d);var M=x(d,2);$e(M,{onclick:o,children:(p,_)=>{var P=Qr(),B=ee(P);{var $=j=>{vr(j,{})},y=j=>{Oa(j,{})};oe(B,j=>{g(t)?j($):j(y,!1)})}ce(),k(p,P)},$$slots:{default:!0}}),k(f,i)};Je(l,()=>({"--footer-direction":"column"})),Ta(l.lastChild,{key:"export-results",title:"Exporter les résultats",get open(){return r()},set open(f){r(f)},footer:c,children:(f,i)=>{ur(f,{options:[{key:"metadataonly",label:"Métadonnées seulement"},{key:"croppedonly",label:"Métadonnées et images recadrées"},{key:"full",label:"Métadonnées, images recadrées et images originales"}],get value(){return g(n)},set value(d){Q(n,d,!0)},children:(d,v)=>{ce();var u=fe("Quoi inclure dans l'export");k(d,u)},$$slots:{default:!0}})},$$slots:{footer:!0,default:!0}}),L(l)}k(a,s),Le()}var et=xe('<svg><path fill="currentColor" d="M128 82a46 46 0 1 0 46 46a46.06 46.06 0 0 0-46-46m0 80a34 34 0 1 1 34-34a34 34 0 0 1-34 34m86-31.16c.06-1.89.06-3.79 0-5.68L229.33 106a6 6 0 0 0 1.11-5.29a105.3 105.3 0 0 0-10.68-25.81a6 6 0 0 0-4.53-3l-24.45-2.71q-1.93-2.07-4-4l-2.72-24.46a6 6 0 0 0-3-4.53a105.7 105.7 0 0 0-25.77-10.66a6 6 0 0 0-5.29 1.14l-19.2 15.37a90 90 0 0 0-5.68 0L106 26.67a6 6 0 0 0-5.29-1.11A105.3 105.3 0 0 0 74.9 36.24a6 6 0 0 0-3 4.53l-2.67 24.45q-2.07 1.94-4 4L40.76 72a6 6 0 0 0-4.53 3a105.7 105.7 0 0 0-10.66 25.77a6 6 0 0 0 1.11 5.23l15.37 19.2a90 90 0 0 0 0 5.68l-15.38 19.17a6 6 0 0 0-1.11 5.29a105.3 105.3 0 0 0 10.68 25.76a6 6 0 0 0 4.53 3l24.45 2.71q1.94 2.07 4 4L72 215.24a6 6 0 0 0 3 4.53a105.7 105.7 0 0 0 25.77 10.66a6 6 0 0 0 5.29-1.11l19.1-15.32c1.89.06 3.79.06 5.68 0l19.21 15.38a6 6 0 0 0 3.75 1.31a6.2 6.2 0 0 0 1.54-.2a105.3 105.3 0 0 0 25.76-10.68a6 6 0 0 0 3-4.53l2.71-24.45q2.07-1.93 4-4l24.46-2.72a6 6 0 0 0 4.53-3a105.5 105.5 0 0 0 10.66-25.77a6 6 0 0 0-1.11-5.29Zm-3.1 41.63l-23.64 2.63a6 6 0 0 0-3.82 2a75 75 0 0 1-6.31 6.31a6 6 0 0 0-2 3.82l-2.63 23.63a94.3 94.3 0 0 1-17.36 7.14l-18.57-14.86a6 6 0 0 0-3.75-1.31h-.36a78 78 0 0 1-8.92 0a6 6 0 0 0-4.11 1.3L100.87 218a94 94 0 0 1-17.34-7.17l-2.63-23.62a6 6 0 0 0-2-3.82a75 75 0 0 1-6.31-6.31a6 6 0 0 0-3.82-2l-23.63-2.63A94.3 94.3 0 0 1 38 155.14l14.86-18.57a6 6 0 0 0 1.3-4.11a78 78 0 0 1 0-8.92a6 6 0 0 0-1.3-4.11L38 100.87a94 94 0 0 1 7.17-17.34l23.62-2.63a6 6 0 0 0 3.82-2a75 75 0 0 1 6.31-6.31a6 6 0 0 0 2-3.82l2.63-23.63A94.3 94.3 0 0 1 100.86 38l18.57 14.86a6 6 0 0 0 4.11 1.3a78 78 0 0 1 8.92 0a6 6 0 0 0 4.11-1.3L155.13 38a94 94 0 0 1 17.34 7.17l2.63 23.64a6 6 0 0 0 2 3.82a75 75 0 0 1 6.31 6.31a6 6 0 0 0 3.82 2l23.63 2.63a94.3 94.3 0 0 1 7.14 17.29l-14.86 18.57a6 6 0 0 0-1.3 4.11a78 78 0 0 1 0 8.92a6 6 0 0 0 1.3 4.11L218 155.13a94 94 0 0 1-7.15 17.34Z"></path></svg>');function at(a,e){const r=Pe(e,["$$slots","$$events","$$legacy"]);var t=et();let n;Z(()=>n=Me(t,n,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...r})),k(a,t)}var rt=xe('<svg><path fill="currentColor" d="M122 40V16a6 6 0 0 1 12 0v24a6 6 0 0 1-12 0m68 88a62 62 0 1 1-62-62a62.07 62.07 0 0 1 62 62m-12 0a50 50 0 1 0-50 50a50.06 50.06 0 0 0 50-50M59.76 68.24a6 6 0 1 0 8.48-8.48l-16-16a6 6 0 0 0-8.48 8.48Zm0 119.52l-16 16a6 6 0 1 0 8.48 8.48l16-16a6 6 0 1 0-8.48-8.48M192 70a6 6 0 0 0 4.24-1.76l16-16a6 6 0 0 0-8.48-8.48l-16 16A6 6 0 0 0 192 70m4.24 117.76a6 6 0 0 0-8.48 8.48l16 16a6 6 0 0 0 8.48-8.48ZM46 128a6 6 0 0 0-6-6H16a6 6 0 0 0 0 12h24a6 6 0 0 0 6-6m82 82a6 6 0 0 0-6 6v24a6 6 0 0 0 12 0v-24a6 6 0 0 0-6-6m112-88h-24a6 6 0 0 0 0 12h24a6 6 0 0 0 0-12"></path></svg>');function tt(a,e){const r=Pe(e,["$$slots","$$events","$$legacy"]);var t=rt();let n;Z(()=>n=Me(t,n,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...r})),k(a,t)}var nt=xe('<svg><path fill="currentColor" d="M88 104H40a8 8 0 0 1-8-8V48a8 8 0 0 1 16 0v28.69l14.63-14.63A95.43 95.43 0 0 1 130 33.94h.53a95.36 95.36 0 0 1 67.07 27.33a8 8 0 0 1-11.18 11.44a79.52 79.52 0 0 0-55.89-22.77h-.45a79.56 79.56 0 0 0-56.14 23.43L59.31 88H88a8 8 0 0 1 0 16m128 48h-48a8 8 0 0 0 0 16h28.69l-14.63 14.63a79.56 79.56 0 0 1-56.13 23.43h-.45a79.52 79.52 0 0 1-55.89-22.77a8 8 0 1 0-11.18 11.44a95.36 95.36 0 0 0 67.07 27.33h.52a95.43 95.43 0 0 0 67.36-28.12L208 179.31V208a8 8 0 0 0 16 0v-48a8 8 0 0 0-8-8"></path></svg>');function ot(a,e){const r=Pe(e,["$$slots","$$events","$$legacy"]);var t=nt();let n;Z(()=>n=Me(t,n,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...r})),k(a,t)}var st=xe('<svg><path fill="currentColor" d="M232.13 143.64a6 6 0 0 0-6-1.49a90.07 90.07 0 0 1-112.27-112.3a6 6 0 0 0-7.49-7.48a102.88 102.88 0 0 0-51.89 36.31a102 102 0 0 0 142.84 142.84a102.88 102.88 0 0 0 36.31-51.89a6 6 0 0 0-1.5-5.99m-42 48.29a90 90 0 0 1-126-126a90.9 90.9 0 0 1 35.52-28.27a102.06 102.06 0 0 0 118.69 118.69a90.9 90.9 0 0 1-28.24 35.58Z"></path></svg>');function it(a,e){const r=Pe(e,["$$slots","$$events","$$legacy"]);var t=st();let n;Z(()=>n=Me(t,n,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...r})),k(a,t)}var lt=xe('<svg><path fill="currentColor" d="M164.24 100.24L136.48 128l27.76 27.76a6 6 0 1 1-8.48 8.48L128 136.48l-27.76 27.76a6 6 0 0 1-8.48-8.48L119.52 128l-27.76-27.76a6 6 0 0 1 8.48-8.48L128 119.52l27.76-27.76a6 6 0 0 1 8.48 8.48M230 128A102 102 0 1 1 128 26a102.12 102.12 0 0 1 102 102m-12 0a90 90 0 1 0-90 90a90.1 90.1 0 0 0 90-90"></path></svg>');function ct(a,e){const r=Pe(e,["$$slots","$$events","$$legacy"]);var t=lt();let n;Z(()=>n=Me(t,n,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...r})),k(a,t)}var vt=(a,e)=>{Q(e,!1)},ft=H('<!> <dialog class="container svelte-k25xuh"><div class="listParam svelte-k25xuh"><div class="setting svelte-k25xuh">Thème <!> <!></div> <div class="setting svelte-k25xuh">Mode debug <!></div> <div class="setting svelte-k25xuh"><!></div> <div class="setting svelte-k25xuh"><!></div> <footer>C.i.g.a.l.e vDEV · <a href="#/about">À propos</a></footer></div></dialog>',1);function ut(a,e){Se(e,!0);let r=ve(!1),t=ve(void 0);je(()=>{window.addEventListener("mouseup",({target:m})=>{var h;m!==g(t)&&((h=g(t))!=null&&h.contains(m)||Q(r,!1))})});let n=ve(!0);je(()=>{window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",m=>{Q(n,!m.matches)})});var o=ft(),s=ee(o);const l=V(()=>g(r)?"Fermer":"Réglages");wa(s,{get help(){return g(l)},onclick:()=>{Q(r,!g(r))},children:(m,h)=>{var w=Sa(),S=ee(w);{var R=F=>{ct(F,{})},C=F=>{at(F,{})};oe(S,F=>{g(r)?F(R):F(C,!1)})}k(m,w)}});var c=x(s,2),f=O(c),i=O(f),d=x(O(i));const v=V(()=>me().theme==="auto"?g(n):me().theme==="light");_a(d,{get value(){return g(v)},onchange:async m=>{await Ue("theme",m?"light":"dark")},icons:{on:tt,off:it}});var u=x(d,2);const M=V(()=>me().theme==="auto");wa(u,{get disabled(){return g(M)},onclick:async()=>await Ue("theme","auto"),help:"Synchroniser avec le thème du système",children:(m,h)=>{ot(m,{})}}),L(i);var p=x(i,2),_=x(O(p));_a(_,{get value(){return me().showTechnicalMetadata},onchange:async m=>{await Ue("showTechnicalMetadata",m)}}),L(p);var P=x(p,2),B=O(P);$e(B,{onclick:async()=>{Q(r,!1),await Ze("#/protocols")},children:(m,h)=>{ce();var w=fe("Gérer les protocoles");k(m,w)},$$slots:{default:!0}}),L(P);var $=x(P,2),y=O($);$e(y,{onclick:()=>{var m;(m=e.openKeyboardShortcuts)==null||m.call(e)},children:(m,h)=>{ce();var w=fe("Raccourcis clavier");k(m,w)},$$slots:{default:!0}}),L($);var j=x($,2),z=x(O(j));z.__click=[vt,r],L(j),L(f),L(c),mr(c,m=>Q(t,m),()=>g(t)),Z(m=>{ae(c,"data-theme",m),c.open=g(r)?!0:void 0},[()=>me().theme]),k(a,o),Le()}La(["click"]);var dt=H('<button class="pr-number svelte-1i3vnya"></button>'),gt=H('<div class="line svelte-1i3vnya"></div>'),pt=H('<div class="line svelte-1i3vnya"></div>'),mt=H('<div class="line svelte-1i3vnya"></div>'),ht=H('<div class="line svelte-1i3vnya"></div>'),wt=H("<!> Résultats",1),_t=H('<!> <!> <header><nav class="svelte-1i3vnya"><div class="logo svelte-1i3vnya"><a href="#/" class="svelte-1i3vnya"><svelte-css-wrapper style="display: contents"><!></svelte-css-wrapper> C.i.g.a.l.e.</a> <!></div> <div class="steps svelte-1i3vnya"><a href="#/" class="svelte-1i3vnya">Protocole <!></a> <!> <a href="#/import" class="svelte-1i3vnya">Importer <!></a> <!> <a href="#/crop" class="svelte-1i3vnya">Recadrer <!></a> <!> <a href="#/classify" class="svelte-1i3vnya">Classifier <!></a> <!> <!></div> <svelte-css-wrapper style="display: contents"><!></svelte-css-wrapper></nav> <!></header>',1);function yt(a,e){Se(e,!0);let r=ra(e,"progress",3,0);const t=V(()=>Ba.url.hash.replace(/^#/,"")),n=V(()=>re.Image.state.length>0);let o=ve(void 0),s=ve(void 0);je(()=>{K.currentProtocolId||Ze("#/"),K.currentProtocolId&&!g(n)&&Ze("#/import")});let l=ve(void 0);var c=_t(),f=ee(c);Xr(f,{get progress(){return r()},get open(){return g(s)},set open(b){Q(s,b,!0)}});var i=x(f,2);{var d=b=>{Lr(b,{get open(){return g(l)},set open(I){Q(l,I,!0)}})};oe(i,b=>{le&&b(d)})}var v=x(i,2),u=O(v),M=O(u),p=O(M),_=O(p);Je(_,()=>({"--fill":"var(--bg-primary)"})),cr(_.lastChild,{}),L(_),ce(),L(p);var P=x(p,2);{var B=b=>{var I=dt();I.__click=function(...X){var ie;(ie=g(l))==null||ie.apply(this,X)},I.textContent=`Preview #${le??""}`,k(b,I)};oe(P,b=>{le&&b(B)})}L(M);var $=x(M,2),y=O($),j=x(O(y));{var z=b=>{var I=gt();k(b,I)};oe(j,b=>{g(t)=="/"&&b(z)})}L(y);var m=x(y,2);Ce(m,{});var h=x(m,2),w=x(O(h));{var S=b=>{var I=pt();k(b,I)};oe(w,b=>{g(t)=="/import"&&b(S)})}L(h);var R=x(h,2);Ce(R,{});var C=x(R,2),F=x(O(C));{var D=b=>{var I=mt();k(b,I)};oe(F,b=>{g(t)=="/crop"&&b(D)})}L(C);var E=x(C,2);Ce(E,{});var q=x(E,2),A=x(O(q));{var J=b=>{var I=ht();k(b,I)};oe(A,b=>{g(t)=="/classify"&&b(J)})}L(q);var Y=x(q,2);Ce(Y,{});var ue=x(Y,2);$e(ue,{get onclick(){return g(s)},children:(b,I)=>{var X=wt(),ie=ee(X);Oa(ie,{}),ce(),k(b,X)},$$slots:{default:!0}}),L($);var N=x($,2);Je(N,()=>({"--navbar-height":`${g(o)??""}px`})),ut(N.lastChild,{get openKeyboardShortcuts(){return e.openKeyboardShortcuts}}),L(N),L(u);var se=x(u,2);const te=V(()=>K.processing.state==="generating-zip"?0:r());Ca(se,{get progress(){return g(te)}}),L(v),Z(()=>{ae(h,"aria-disabled",!K.currentProtocolId),ae(C,"aria-disabled",!K.currentProtocolId||!g(n)),ae(q,"aria-disabled",!K.currentProtocolId||!g(n))}),lr(v,"clientHeight",b=>Q(o,b)),k(a,c),Le()}La(["click"]);var $t=H("<base>"),bt=H('<!> <!> <section class="toasts svelte-1s1jxo8"></section> <div><!></div>',1);function nn(a,e){Se(e,!0);const r={capture(){return Ya(K,"currentProtocolId")},restore({currentProtocolId:v}){K.currentProtocolId=v}};je(()=>{for(const v of re.Image.state)K.hasPreviewURL(v)||(async()=>{const u=await ja("ImagePreviewFile",Ia(v.id));if(!u)return;const M=new Blob([u.bytes],{type:v.contentType});K.setPreviewURL(v,URL.createObjectURL(M))})()});const t=V(me);je(()=>{document.documentElement.dataset.theme=g(t).theme});let n=ve(void 0);var o=bt();ar(v=>{var u=$t();ae(u,"href",Ge?`${Ge}/index.html`:""),k(v,u)});var s=ee(o);yt(s,{get openKeyboardShortcuts(){return g(n)},get progress(){return K.processing.progress}});var l=x(s,2);sr(l,{preventDefault:!0,get binds(){return K.keybinds},get openHelp(){return g(n)},set openHelp(v){Q(n,v,!0)}});var c=x(l,2);rr(c,21,()=>ye.items,v=>v.id,(v,u)=>{ir(v,or(()=>g(u),{get action(){return g(u).labels.action},get dismiss(){return g(u).labels.close},onaction:()=>{var M,p;(p=(M=g(u).callbacks)==null?void 0:M.action)==null||p.call(M,g(u))},ondismiss:()=>{ye.remove(g(u).id)}}))}),L(c);var f=x(c,2);let i;var d=O(f);return tr(d,()=>e.children??ka),L(f),Z(v=>i=nr(f,1,"contents svelte-1s1jxo8",null,i,v),[()=>{var v;return{padded:!((v=Ba.route.id)!=null&&v.includes("/(sidepanel)"))}}]),k(a,o),Le({snapshot:r})}export{nn as component,tn as universal};
