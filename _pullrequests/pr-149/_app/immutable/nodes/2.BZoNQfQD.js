import{aT as Ra,t as Z,ac as Se,ab as q,f as ee,g as p,a as b,c as C,r as B,aa as $a,ae as ve,ad as Te,s as ce,b as Q,G as ke}from"../chunks/ypqVbSJJ.js";import{t as re,o as Ua,k as qa,B as Ie,L as le,j as Ha,u as N,S as ua,s as Va,l as Ka,e as ba,f as xa}from"../chunks/aY_pDKx0.js";import{H as Na,g as Ze}from"../chunks/Wvd8z37Z.js";import{t as Za}from"../chunks/DxpV8_iS.js";import{n as be,a as x,c as Ma,b as fe,t as H}from"../chunks/Dg_JGDnQ.js";import{s as ge,d as ka,h as Ga}from"../chunks/BtM3C0Ax.js";import{e as Wa}from"../chunks/Cd1247F3.js";import{s as Qa}from"../chunks/BlQmPJq4.js";import{s as xe,a as ae,b as Xa}from"../chunks/DGulLCEo.js";import{r as Me,p as ra,s as Ya}from"../chunks/WeKPzUqQ.js";import{b as Ge}from"../chunks/pb_F7HoW.js";import{p as Pa}from"../chunks/DxAGPvhG.js";import Ja from"../chunks/kHWxWSOU.js";import er from"../chunks/BgjJvG7h.js";import{s as Ke,g as me}from"../chunks/D7_ekkQY.js";import{t as Pe}from"../chunks/D5D-wivE.js";import{i as oe}from"../chunks/Da-IF8S7.js";import{c as We}from"../chunks/CZUpoavn.js";import{b as ar}from"../chunks/i_07m2ZJ.js";import ye from"../chunks/BgCNwF5q.js";import rr from"../chunks/bL4fVcQG.js";import{D as La}from"../chunks/Ck-pdhHX.js";import{a as Qe}from"../chunks/itZk9cZ1.js";import Sa from"../chunks/CFHjNBkn.js";import tr from"../chunks/B6DlE5O3.js";import{e as nr}from"../chunks/BrTG1MbF.js";import Ta from"../chunks/BjjKKZCh.js";import or from"../chunks/Cb2A5aQv.js";import{d as sr,t as ir}from"../chunks/DHtif_Cv.js";import{o as lr,a as Ne,b as Be,c as vr}from"../chunks/DZxZTJQS.js";import{b as cr}from"../chunks/BjcWHYSf.js";import pa from"../chunks/B0-BHedC.js";import da from"../chunks/Kj4w7Vaj.js";const fr=Ra;function ur(e,a){throw new Na(e,a)}new TextEncoder;async function pr(e){const a=await fetch(Za("class_mapping.txt")).then(r=>r.text()).then(r=>r.split(`
`));await re.Metadata.set({id:e,description:"L'espèce de l'individu",label:"Espèce",mergeMethod:"max",required:!1,type:"enum",options:a.filter(Boolean).map((r,t)=>({key:t.toString(),label:r,description:"",learnMore:`https://en.wikipedia.org/wiki/${encodeURIComponent(r)}`}))})}async function dr(){try{await re.initialize(),await gr(),await pr("species"),await re.initialize()}catch(e){console.error(e),ur(400,{message:(e==null?void 0:e.toString())??"Erreur inattendue"})}}async function gr(){await Ua(["Metadata","Protocol","Settings"],{},e=>{for(const a of qa)e.objectStore("Metadata").put(a);e.objectStore("Protocol").put({id:"io.github.cigaleapp.transect",metadata:[Ie.species,Ie.shoot_date,Ie.shoot_location,Ie.crop],authors:[],exports:{images:{cropped:'Cropped/{{ fallback image.metadata.species.valueLabel "(Unknown)" }}_{{ sequence }}.{{ extension image.filename }}',original:'Original/{{ fallback image.metadata.species.valueLabel "(Unknown)" }}_{{ sequence }}.{{ extension image.filename }}'},metadata:{json:"analysis.json",csv:"metadata.csv"}},name:"Transect",source:"https://github.com/cigaleapp/cigale"}),e.objectStore("Settings").put({id:"defaults",protocols:[],theme:"auto",gridSize:10,language:"fr",showInputHints:!0,showTechnicalMetadata:fr})})}const Wt=Object.freeze(Object.defineProperty({__proto__:null,load:dr},Symbol.toStringTag,{value:"Module"}));var mr=be('<svg><path fill="currentColor" d="m181.66 133.66l-80 80a8 8 0 0 1-11.32-11.32L164.69 128L90.34 53.66a8 8 0 0 1 11.32-11.32l80 80a8 8 0 0 1 0 11.32"></path></svg>');function je(e,a){const r=Me(a,["$$slots","$$events","$$legacy"]);var t=mr();let n;Z(()=>n=xe(t,n,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...r})),x(e,t)}const ga=(e,a=$a)=>{var r=hr(),t=C(r),n=b(t,2);Qe(n,()=>fetch(a().url).then(o=>o.json()),o=>{var s=fe();Z(()=>ge(s,a().login)),x(o,s)},(o,s)=>{var l=q(()=>{var{name:i}=p(s);return{name:i}}),v=q(()=>p(l).name),f=fe();Z(()=>ge(f,p(v)||a().login)),x(o,f)},(o,s)=>{var l=fe();Z(()=>ge(l,a().login)),x(o,l)}),B(r),Z(()=>{ae(r,"href",a().html_url),ae(r,"title",`@${a().login}`),ae(t,"src",a().avatar_url),ae(t,"alt",`Avatar de ${a().login??""}`)}),x(e,r)};var hr=H('<a class="github-user svelte-b46tju"><img class="svelte-b46tju"> <!></a>'),wr=H("<!> <!>",1),_r=H("pour l'issue <a> </a> de <!>",1),yr=H('<li class="svelte-b46tju"><!></li>'),$r=H('<p class="svelte-b46tju">Ceci est un déploiement de preview</p> <ul><li class="svelte-b46tju">pour la PR <a> </a> de <!></li> <!> <br></ul> <p class="svelte-b46tju"> </p>',1),br=H('<p class="svelte-b46tju">Ceci est un déploiement de preview pour la PR <a></a></p>');function xr(e,a){Se(a,!0);let r=ra(a,"open",15);{const t=(n,o)=>{let s=()=>o==null?void 0:o().close;var l=wr(),v=ee(l);ye(v,{help:"Supprime toutes les données pour ce déploiement de preview",onclick:()=>{Ha(),window.location.reload()},children:(i,c)=>{ve();var u=fe("Nettoyer la base de données");x(i,u)},$$slots:{default:!0}});var f=b(v,2);ye(f,{onclick:()=>{window.open(`https://github.com/cigaleapp/cigale/pull/${le}`),s()()},children:(i,c)=>{ve();var u=fe("Voir sur Github");x(i,u)},$$slots:{default:!0}}),x(n,l)};Sa(e,{key:"preview-pr",title:`Preview de la PR #${le??""}`,get open(){return r()},set open(n){r(n)},footer:t,children:(n,o)=>{var s=Ma();const l=q(()=>`https://github.com/cigaleapp/cigale/pull/${le}`);var v=ee(s);Qe(v,()=>fetch(`https://api.github.com/repos/cigaleapp/cigale/pulls/${le}`).then(f=>f.json()),f=>{var i=br(),c=b(C(i));c.textContent=`#${le??""}`,B(i),Z(()=>ae(c,"href",p(l))),x(f,i)},(f,i)=>{var c=q(()=>{var{title:I,user:R,body:j}=p(i);return{title:I,user:R,body:j}}),u=q(()=>p(c).title),d=q(()=>p(c).user),M=q(()=>p(c).body),w=$r();const y=q(()=>{var I;return(I=/(Closes|Fixes) #(\d+)/i.exec(p(M)))==null?void 0:I[2]});var k=b(ee(w),2),T=C(k),P=b(C(T)),_=C(P,!0);B(P);var L=b(P,2);ga(L,()=>p(d)),B(T);var z=b(T,2);{var g=I=>{var R=yr(),j=C(R);Qe(j,()=>fetch(`https://api.github.com/repos/cigaleapp/cigale/issues/${p(y)}`).then(D=>D.json()),null,(D,F)=>{var E=q(()=>{var{title:$,number:S,user:J,html_url:ie}=p(F);return{title:$,number:S,user:J,html_url:ie}}),U=q(()=>p(E).title),O=q(()=>p(E).number),W=q(()=>p(E).user),Y=q(()=>p(E).html_url),ue=_r(),V=b(ee(ue)),se=C(V);B(V);var te=b(V,2);ga(te,()=>p(W)),Z(()=>{ae(V,"href",p(Y)),ge(se,`#${p(O)??""} ${p(U)??""}`)}),x(D,ue)}),B(R),x(I,R)};oe(z,I=>{p(y)&&I(g)})}ve(2),B(k);var m=b(k,2),h=C(m,!0);B(m),Z(()=>{ae(P,"href",p(l)),ge(_,p(u)),ge(h,p(M))}),x(f,w)},(f,i)=>{var c=fe();c.nodeValue=`#${le??""}`,x(f,c)}),x(n,s)},$$slots:{footer:!0,default:!0}})}Te()}var ma={},Mr=function(e,a,r,t,n){var o=new Worker(ma[a]||(ma[a]=URL.createObjectURL(new Blob([e+';addEventListener("error",function(e){e=e.error;postMessage({$e$:[e.message,e.code,e.stack]})})'],{type:"text/javascript"}))));return o.onmessage=function(s){var l=s.data,v=l.$e$;if(v){var f=new Error(v[0]);f.code=v[1],f.stack=v[2],n(f,null)}else n(null,l)},o.postMessage(r,t),o},G=Uint8Array,X=Uint16Array,Fe=Int32Array,Re=new G([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0,0]),Ue=new G([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,0,0]),Xe=new G([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),Ia=function(e,a){for(var r=new X(31),t=0;t<31;++t)r[t]=a+=1<<e[t-1];for(var n=new Fe(r[30]),t=1;t<30;++t)for(var o=r[t];o<r[t+1];++o)n[o]=o-r[t]<<5|t;return{b:r,r:n}},Ba=Ia(Re,2),kr=Ba.b,Ee=Ba.r;kr[28]=258,Ee[258]=28;var Pr=Ia(Ue,0),Ye=Pr.r,Oe=new X(32768);for(var A=0;A<32768;++A){var pe=(A&43690)>>1|(A&21845)<<1;pe=(pe&52428)>>2|(pe&13107)<<2,pe=(pe&61680)>>4|(pe&3855)<<4,Oe[A]=((pe&65280)>>8|(pe&255)<<8)>>1}var _e=function(e,a,r){for(var t=e.length,n=0,o=new X(a);n<t;++n)e[n]&&++o[e[n]-1];var s=new X(a);for(n=1;n<a;++n)s[n]=s[n-1]+o[n-1]<<1;var l;if(r){l=new X(1<<a);var v=15-a;for(n=0;n<t;++n)if(e[n])for(var f=n<<4|e[n],i=a-e[n],c=s[e[n]-1]++<<i,u=c|(1<<i)-1;c<=u;++c)l[Oe[c]>>v]=f}else for(l=new X(t),n=0;n<t;++n)e[n]&&(l[n]=Oe[s[e[n]-1]++]>>15-e[n]);return l},de=new G(288);for(var A=0;A<144;++A)de[A]=8;for(var A=144;A<256;++A)de[A]=9;for(var A=256;A<280;++A)de[A]=7;for(var A=280;A<288;++A)de[A]=8;var Le=new G(32);for(var A=0;A<32;++A)Le[A]=5;var ja=_e(de,9,0),Ca=_e(Le,5,0),ta=function(e){return(e+7)/8|0},na=function(e,a,r){return(a==null||a<0)&&(a=0),(r==null||r>e.length)&&(r=e.length),new G(e.subarray(a,r))},Lr=["unexpected EOF","invalid block type","invalid length/literal","invalid distance","stream finished","no stream handler",,"no callback","invalid UTF-8 data","extra field too long","date not in range 1980-2099","filename too long","stream finishing","invalid zip data"],$e=function(e,a,r){var t=new Error(a||Lr[e]);if(t.code=e,Error.captureStackTrace&&Error.captureStackTrace(t,$e),!r)throw t;return t},ne=function(e,a,r){r<<=a&7;var t=a/8|0;e[t]|=r,e[t+1]|=r>>8},he=function(e,a,r){r<<=a&7;var t=a/8|0;e[t]|=r,e[t+1]|=r>>8,e[t+2]|=r>>16},Ae=function(e,a){for(var r=[],t=0;t<e.length;++t)e[t]&&r.push({s:t,f:e[t]});var n=r.length,o=r.slice();if(!n)return{t:sa,l:0};if(n==1){var s=new G(r[0].s+1);return s[r[0].s]=1,{t:s,l:1}}r.sort(function(L,z){return L.f-z.f}),r.push({s:-1,f:25001});var l=r[0],v=r[1],f=0,i=1,c=2;for(r[0]={s:-1,f:l.f+v.f,l,r:v};i!=n-1;)l=r[r[f].f<r[c].f?f++:c++],v=r[f!=i&&r[f].f<r[c].f?f++:c++],r[i++]={s:-1,f:l.f+v.f,l,r:v};for(var u=o[0].s,t=1;t<n;++t)o[t].s>u&&(u=o[t].s);var d=new X(u+1),M=ze(r[i-1],d,0);if(M>a){var t=0,w=0,y=M-a,k=1<<y;for(o.sort(function(z,g){return d[g.s]-d[z.s]||z.f-g.f});t<n;++t){var T=o[t].s;if(d[T]>a)w+=k-(1<<M-d[T]),d[T]=a;else break}for(w>>=y;w>0;){var P=o[t].s;d[P]<a?w-=1<<a-d[P]++-1:++t}for(;t>=0&&w;--t){var _=o[t].s;d[_]==a&&(--d[_],++w)}M=a}return{t:new G(d),l:M}},ze=function(e,a,r){return e.s==-1?Math.max(ze(e.l,a,r+1),ze(e.r,a,r+1)):a[e.s]=r},Je=function(e){for(var a=e.length;a&&!e[--a];);for(var r=new X(++a),t=0,n=e[0],o=1,s=function(v){r[t++]=v},l=1;l<=a;++l)if(e[l]==n&&l!=a)++o;else{if(!n&&o>2){for(;o>138;o-=138)s(32754);o>2&&(s(o>10?o-11<<5|28690:o-3<<5|12305),o=0)}else if(o>3){for(s(n),--o;o>6;o-=6)s(8304);o>2&&(s(o-3<<5|8208),o=0)}for(;o--;)s(n);o=1,n=e[l]}return{c:r.subarray(0,t),n:a}},we=function(e,a){for(var r=0,t=0;t<a.length;++t)r+=e[t]*a[t];return r},oa=function(e,a,r){var t=r.length,n=ta(a+2);e[n]=t&255,e[n+1]=t>>8,e[n+2]=e[n]^255,e[n+3]=e[n+1]^255;for(var o=0;o<t;++o)e[n+o+4]=r[o];return(n+4+t)*8},ea=function(e,a,r,t,n,o,s,l,v,f,i){ne(a,i++,r),++n[256];for(var c=Ae(n,15),u=c.t,d=c.l,M=Ae(o,15),w=M.t,y=M.l,k=Je(u),T=k.c,P=k.n,_=Je(w),L=_.c,z=_.n,g=new X(19),m=0;m<T.length;++m)++g[T[m]&31];for(var m=0;m<L.length;++m)++g[L[m]&31];for(var h=Ae(g,7),I=h.t,R=h.l,j=19;j>4&&!I[Xe[j-1]];--j);var D=f+5<<3,F=we(n,de)+we(o,Le)+s,E=we(n,u)+we(o,w)+s+14+3*j+we(g,I)+2*g[16]+3*g[17]+7*g[18];if(v>=0&&D<=F&&D<=E)return oa(a,i,e.subarray(v,v+f));var U,O,W,Y;if(ne(a,i,1+(E<F)),i+=2,E<F){U=_e(u,d,0),O=u,W=_e(w,y,0),Y=w;var ue=_e(I,R,0);ne(a,i,P-257),ne(a,i+5,z-1),ne(a,i+10,j-4),i+=14;for(var m=0;m<j;++m)ne(a,i+3*m,I[Xe[m]]);i+=3*j;for(var V=[T,L],se=0;se<2;++se)for(var te=V[se],m=0;m<te.length;++m){var $=te[m]&31;ne(a,i,ue[$]),i+=I[$],$>15&&(ne(a,i,te[m]>>5&127),i+=te[m]>>12)}}else U=ja,O=de,W=Ca,Y=Le;for(var m=0;m<l;++m){var S=t[m];if(S>255){var $=S>>18&31;he(a,i,U[$+257]),i+=O[$+257],$>7&&(ne(a,i,S>>23&31),i+=Re[$]);var J=S&31;he(a,i,W[J]),i+=Y[J],J>3&&(he(a,i,S>>5&8191),i+=Ue[J])}else he(a,i,U[S]),i+=O[S]}return he(a,i,U[256]),i+O[256]},Aa=new Fe([65540,131080,131088,131104,262176,1048704,1048832,2114560,2117632]),sa=new G(0),Ea=function(e,a,r,t,n,o){var s=o.z||e.length,l=new G(t+s+5*(1+Math.ceil(s/7e3))+n),v=l.subarray(t,l.length-n),f=o.l,i=(o.r||0)&7;if(a){i&&(v[0]=o.r>>3);for(var c=Aa[a-1],u=c>>13,d=c&8191,M=(1<<r)-1,w=o.p||new X(32768),y=o.h||new X(M+1),k=Math.ceil(r/3),T=2*k,P=function(Ve){return(e[Ve]^e[Ve+1]<<k^e[Ve+2]<<T)&M},_=new Fe(25e3),L=new X(288),z=new X(32),g=0,m=0,h=o.i||0,I=0,R=o.w||0,j=0;h+2<s;++h){var D=P(h),F=h&32767,E=y[D];if(w[F]=E,y[D]=F,R<=h){var U=s-h;if((g>7e3||I>24576)&&(U>423||!f)){i=ea(e,v,0,_,L,z,m,I,j,h-j,i),I=g=m=0,j=h;for(var O=0;O<286;++O)L[O]=0;for(var O=0;O<30;++O)z[O]=0}var W=2,Y=0,ue=d,V=F-E&32767;if(U>2&&D==P(h-V))for(var se=Math.min(u,U)-1,te=Math.min(32767,h),$=Math.min(258,U);V<=te&&--ue&&F!=E;){if(e[h+W]==e[h+W-V]){for(var S=0;S<$&&e[h+S]==e[h+S-V];++S);if(S>W){if(W=S,Y=V,S>se)break;for(var J=Math.min(V,S-2),ie=0,O=0;O<J;++O){var qe=h-V+O&32767,Fa=w[qe],va=qe-Fa&32767;va>ie&&(ie=va,E=qe)}}}F=E,E=w[F],V+=F-E&32767}if(Y){_[I++]=268435456|Ee[W]<<18|Ye[Y];var ca=Ee[W]&31,fa=Ye[Y]&31;m+=Re[ca]+Ue[fa],++L[257+ca],++z[fa],R=h+W,++g}else _[I++]=e[h],++L[e[h]]}}for(h=Math.max(h,R);h<s;++h)_[I++]=e[h],++L[e[h]];i=ea(e,v,f,_,L,z,m,I,j,h-j,i),f||(o.r=i&7|v[i/8|0]<<3,i-=7,o.h=y,o.p=w,o.i=h,o.w=R)}else{for(var h=o.w||0;h<s+f;h+=65535){var He=h+65535;He>=s&&(v[i/8|0]=f,He=s),i=oa(v,i+1,e.subarray(h,He))}o.i=s}return na(l,0,t+ta(i)+n)},Sr=function(){for(var e=new Int32Array(256),a=0;a<256;++a){for(var r=a,t=9;--t;)r=(r&1&&-306674912)^r>>>1;e[a]=r}return e}(),Tr=function(){var e=-1;return{p:function(a){for(var r=e,t=0;t<a.length;++t)r=Sr[r&255^a[t]]^r>>>8;e=r},d:function(){return~e}}},Oa=function(e,a,r,t,n){if(!n&&(n={l:1},a.dictionary)){var o=a.dictionary.subarray(-32768),s=new G(o.length+e.length);s.set(o),s.set(e,o.length),e=s,n.w=o.length}return Ea(e,a.level==null?6:a.level,a.mem==null?n.l?Math.ceil(Math.max(8,Math.min(13,Math.log(e.length)))*1.5):20:12+a.mem,r,t,n)},ia=function(e,a){var r={};for(var t in e)r[t]=e[t];for(var t in a)r[t]=a[t];return r},ha=function(e,a,r){for(var t=e(),n=e.toString(),o=n.slice(n.indexOf("[")+1,n.lastIndexOf("]")).replace(/\s+/g,"").split(","),s=0;s<t.length;++s){var l=t[s],v=o[s];if(typeof l=="function"){a+=";"+v+"=";var f=l.toString();if(l.prototype)if(f.indexOf("[native code]")!=-1){var i=f.indexOf(" ",8)+1;a+=f.slice(i,f.indexOf("(",i))}else{a+=f;for(var c in l.prototype)a+=";"+v+".prototype."+c+"="+l.prototype[c].toString()}else a+=f}else r[v]=l}return a},Ce=[],Ir=function(e){var a=[];for(var r in e)e[r].buffer&&a.push((e[r]=new e[r].constructor(e[r])).buffer);return a},Br=function(e,a,r,t){if(!Ce[r]){for(var n="",o={},s=e.length-1,l=0;l<s;++l)n=ha(e[l],n,o);Ce[r]={c:ha(e[s],n,o),e:o}}var v=ia({},Ce[r].e);return Mr(Ce[r].c+";onmessage=function(e){for(var k in e.data)self[k]=e.data[k];onmessage="+a.toString()+"}",r,v,Ir(v),t)},jr=function(){return[G,X,Fe,Re,Ue,Xe,Ee,Ye,ja,de,Ca,Le,Oe,Aa,sa,_e,ne,he,Ae,ze,Je,we,oa,ea,ta,na,Ea,Oa,la,za]},za=function(e){return postMessage(e,[e.buffer])},Cr=function(e,a,r,t,n,o){var s=Br(r,t,n,function(l,v){s.terminate(),o(l,v)});return s.postMessage([e,a],a.consume?[e.buffer]:[]),function(){s.terminate()}},K=function(e,a,r){for(;r;++a)e[a]=r,r>>>=8};function Ar(e,a,r){return r||(r=a,a={}),typeof r!="function"&&$e(7),Cr(e,a,[jr],function(t){return za(la(t.data[0],t.data[1]))},0,r)}function la(e,a){return Oa(e,a||{},0,0)}var Da=function(e,a,r,t){for(var n in e){var o=e[n],s=a+n,l=t;Array.isArray(o)&&(l=ia(t,o[1]),o=o[0]),o instanceof G?r[s]=[o,l]:(r[s+="/"]=[new G(0),l],Da(o,s,r,t))}},wa=typeof TextEncoder<"u"&&new TextEncoder,Er=typeof TextDecoder<"u"&&new TextDecoder,Or=0;try{Er.decode(sa,{stream:!0}),Or=1}catch{}function De(e,a){var r;if(wa)return wa.encode(e);for(var t=e.length,n=new G(e.length+(e.length>>1)),o=0,s=function(f){n[o++]=f},r=0;r<t;++r){if(o+5>n.length){var l=new G(o+8+(t-r<<1));l.set(n),n=l}var v=e.charCodeAt(r);v<128||a?s(v):v<2048?(s(192|v>>6),s(128|v&63)):v>55295&&v<57344?(v=65536+(v&1047552)|e.charCodeAt(++r)&1023,s(240|v>>18),s(128|v>>12&63),s(128|v>>6&63),s(128|v&63)):(s(224|v>>12),s(128|v>>6&63),s(128|v&63))}return na(n,0,o)}var aa=function(e){var a=0;if(e)for(var r in e){var t=e[r].length;t>65535&&$e(9),a+=t+4}return a},_a=function(e,a,r,t,n,o,s,l){var v=t.length,f=r.extra,i=l&&l.length,c=aa(f);K(e,a,s!=null?33639248:67324752),a+=4,s!=null&&(e[a++]=20,e[a++]=r.os),e[a]=20,a+=2,e[a++]=r.flag<<1|(o<0&&8),e[a++]=n&&8,e[a++]=r.compression&255,e[a++]=r.compression>>8;var u=new Date(r.mtime==null?Date.now():r.mtime),d=u.getFullYear()-1980;if((d<0||d>119)&&$e(10),K(e,a,d<<25|u.getMonth()+1<<21|u.getDate()<<16|u.getHours()<<11|u.getMinutes()<<5|u.getSeconds()>>1),a+=4,o!=-1&&(K(e,a,r.crc),K(e,a+4,o<0?-o-2:o),K(e,a+8,r.size)),K(e,a+12,v),K(e,a+14,c),a+=16,s!=null&&(K(e,a,i),K(e,a+6,r.attrs),K(e,a+10,s),a+=14),e.set(t,a),a+=v,c)for(var M in f){var w=f[M],y=w.length;K(e,a,+M),K(e,a+2,y),e.set(w,a+4),a+=4+y}return i&&(e.set(l,a),a+=i),a},zr=function(e,a,r,t,n){K(e,a,101010256),K(e,a+8,r),K(e,a+10,r),K(e,a+12,t),K(e,a+16,n)};function Dr(e,a,r){r||(r=a,a={}),typeof r!="function"&&$e(7);var t={};Da(e,"",t,a);var n=Object.keys(t),o=n.length,s=0,l=0,v=o,f=new Array(o),i=[],c=function(){for(var y=0;y<i.length;++y)i[y]()},u=function(y,k){ya(function(){r(y,k)})};ya(function(){u=r});var d=function(){var y=new G(l+22),k=s,T=l-s;l=0;for(var P=0;P<v;++P){var _=f[P];try{var L=_.c.length;_a(y,l,_,_.f,_.u,L);var z=30+_.f.length+aa(_.extra),g=l+z;y.set(_.c,g),_a(y,s,_,_.f,_.u,L,l,_.m),s+=16+z+(_.m?_.m.length:0),l=g+L}catch(m){return u(m,null)}}zr(y,s,f.length,T,k),u(null,y)};o||d();for(var M=function(y){var k=n[y],T=t[k],P=T[0],_=T[1],L=Tr(),z=P.length;L.p(P);var g=De(k),m=g.length,h=_.comment,I=h&&De(h),R=I&&I.length,j=aa(_.extra),D=_.level==0?0:8,F=function(E,U){if(E)c(),u(E,null);else{var O=U.length;f[y]=ia(_,{size:z,crc:L.d(),c:U,f:g,m:I,u:m!=k.length||I&&h.length!=R,compression:D}),s+=30+m+j+O,l+=76+2*(m+j)+(R||0)+O,--o||d()}};if(m>65535&&F($e(11,0,1),null),!D)F(null,P);else if(z<16e4)try{F(null,la(P,_))}catch(E){F(E,null)}else i.push(Ar(P,_,F))},w=0;w<v;++w)M(w);return c}var ya=typeof queueMicrotask=="function"?queueMicrotask:typeof setTimeout=="function"?setTimeout:function(e){e()};async function Fr(e,a,{include:r="croppedonly",base:t}){const n=Object.fromEntries(await Promise.all(e.map(async i=>[i.id,{label:i.label,metadata:await lr(i).then(Ne),images:i.images.map(c=>{const u=re.Image.state.find(d=>d.id===c);if(u)return{...u,metadata:Ne(u.metadata)}})}]))),o=[...new Set(e.flatMap(i=>Object.keys(n[i.id].metadata)))],s=Object.fromEntries(re.Metadata.state.map(i=>[i.id,i]));let l=[];if(N.processing.state="generating-zip",N.processing.total=1,N.processing.done=0,r!=="metadataonly"){N.processing.total+=e.flatMap(i=>i.images).length;for(const i of e.flatMap(c=>c.images)){const c=await re.Image.get(i);if(!c)throw"Image non trouvée";const{contentType:u,filename:d}=c,{cropped:M,original:w}=await Rr(c);l.push({imageId:i,croppedBytes:new Uint8Array(M),originalBytes:r==="full"?new Uint8Array(w):void 0,contentType:u,filename:d}),N.processing.done++}}const v=a.exports??{images:{cropped:ua.FilepathTemplate.assert("cropped/{{sequence}}.{{extension image.filename}}"),original:ua.FilepathTemplate.assert("original/{{sequence}}.{{extension image.filename}}")},metadata:{json:"analysis.json",csv:"metadata.csv"}},f=await new Promise((i,c)=>Dr({[v.metadata.json]:De(Va("json",`${window.location.origin}${t}/results.schema.json`,{observations:n,protocol:a},["protocol","observations"])),[v.metadata.csv]:De(Ur(["Identifiant","Observation",...o.flatMap(u=>[Be(s[u]),`${Be(s[u])}: Confiance`])],e.map(u=>({Identifiant:u.id,Observation:u.label,...Object.fromEntries(Object.entries(n[u.id].metadata).flatMap(([d,{value:M,confidence:w}])=>[[Be(s[d]),vr(s[d],M)],[`${Be(s[d])}: Confiance`,w.toString()]]))})))),...Object.fromEntries(r==="metadataonly"?[]:e.flatMap(u=>u.images.map(d=>[u,d])).flatMap(([u,d],M)=>{const w=l.find(T=>T.imageId===d);if(!w)throw"Image non trouvée";const y=re.Image.state.find(T=>T.id===d);if(!y)throw"Image non trouvée";const k={image:{...y,metadata:Ne(y.metadata)},observation:u,sequence:M+1};return[[v.images.cropped(k),[w.croppedBytes,{level:0}]],[v.images.original(k),[w.originalBytes,{level:0}]]].filter(([,[T]])=>T!==void 0)}))},{comment:`Generated by C.i.g.a.l.e on ${new Date().toISOString()} - ${window.location.origin}`},(u,d)=>{u&&c(u),i(d)}));N.processing.done++,Ka(f,"results.zip","application/zip")}async function Rr(e){var o,s;const a=(o=e.metadata.crop)==null?void 0:o.value;if(!a)throw"L'image n'a pas d'information de recadrage";const r=await ba("ImageFile",xa(e.id)).then(l=>l==null?void 0:l.bytes);if(!r)throw"L'image n'a pas de fichier associé";const t=await createImageBitmap(new Blob([r],{type:e.contentType})),n=sr({x:t.width,y:t.height})(ir(a));try{const l=await createImageBitmap(t,n.x,n.y,n.width,n.height),v=document.createElement("canvas");return v.width=l.width,v.height=l.height,(s=v.getContext("2d"))==null||s.drawImage(l,0,0),{cropped:await new Promise(i=>v.toBlob(i,["image/png","image/jpeg"].includes(e.contentType)?e.contentType:"image/png")).then(i=>i.arrayBuffer()),original:r}}catch(l){Pe.warn(`Impossible de recadrer ${e.filename}, l'image sera incluse sans recadrage`),console.error(`Couldn't crop ${e.filename} (id ${e.id}) with `,{boundingBox:n},":",l)}finally{t.close()}return{cropped:r,original:r}}function Ur(e,a,r=";"){const t=n=>`"${(n==null?void 0:n.replace(/"/g,'""'))??""}"`;return[e.map(t).join(r),...a.map(n=>e.map(o=>t(n[o])).join(r))].join(`
`)}var qr=H("<code> </code> <!>",1),Hr=H("<!> results.zip",1),Vr=H('<section class="progress svelte-q4lxxz"><!></section> <!>',1),Kr=H('<svelte-css-wrapper style="display: contents"><!></svelte-css-wrapper>',1);function Nr(e,a){Se(a,!0);let r=ra(a,"open",15),t=ce(!1),n=ce("croppedonly");async function o(){Q(t,!0);const v=re.Protocol.state.find(f=>f.id===N.currentProtocol);if(!v){Pe.error("Aucun protocole sélectionné"),Q(t,!1);return}try{await nr(),await Fr(re.Observation.state,v,{base:Ge,include:p(n)})}catch(f){console.error(f),Pe.error(`Erreur lors de l'exportation des résultats: ${(f==null?void 0:f.toString())??"Erreur inattendue"}`)}finally{Q(t,!1)}}var s=Kr(),l=ee(s);{const v=f=>{var i=Vr(),c=ee(i),u=C(c);{var d=w=>{var y=qr(),k=ee(y),T=C(k);B(k);var P=b(k,2);Ta(P,{get progress(){return a.progress}}),Z(_=>ge(T,`${_??""}%`),[()=>Math.floor(a.progress*100)]),x(w,y)};oe(u,w=>{[0,1].includes(a.progress)||w(d)})}B(c);var M=b(c,2);ye(M,{onclick:o,children:(w,y)=>{var k=Hr(),T=ee(k);{var P=L=>{tr(L,{})},_=L=>{La(L,{})};oe(T,L=>{p(t)?L(P):L(_,!1)})}ve(),x(w,k)},$$slots:{default:!0}}),x(f,i)};We(l,()=>({"--footer-direction":"column"})),Sa(l.lastChild,{key:"export-results",title:"Exporter les résultats",get open(){return r()},set open(f){r(f)},footer:v,children:(f,i)=>{or(f,{options:[{key:"metadataonly",label:"Métadonnées seulement"},{key:"croppedonly",label:"Métadonnées et images recadrées"},{key:"full",label:"Métadonnées, images recadrées et images originales"}],get value(){return p(n)},set value(c){Q(n,c,!0)},children:(c,u)=>{ve();var d=fe("Quoi inclure dans l'export");x(c,d)},$$slots:{default:!0}})},$$slots:{footer:!0,default:!0}}),B(l)}x(e,s),Te()}var Zr=be('<svg><path fill="currentColor" d="M128 82a46 46 0 1 0 46 46a46.06 46.06 0 0 0-46-46m0 80a34 34 0 1 1 34-34a34 34 0 0 1-34 34m86-31.16c.06-1.89.06-3.79 0-5.68L229.33 106a6 6 0 0 0 1.11-5.29a105.3 105.3 0 0 0-10.68-25.81a6 6 0 0 0-4.53-3l-24.45-2.71q-1.93-2.07-4-4l-2.72-24.46a6 6 0 0 0-3-4.53a105.7 105.7 0 0 0-25.77-10.66a6 6 0 0 0-5.29 1.14l-19.2 15.37a90 90 0 0 0-5.68 0L106 26.67a6 6 0 0 0-5.29-1.11A105.3 105.3 0 0 0 74.9 36.24a6 6 0 0 0-3 4.53l-2.67 24.45q-2.07 1.94-4 4L40.76 72a6 6 0 0 0-4.53 3a105.7 105.7 0 0 0-10.66 25.77a6 6 0 0 0 1.11 5.23l15.37 19.2a90 90 0 0 0 0 5.68l-15.38 19.17a6 6 0 0 0-1.11 5.29a105.3 105.3 0 0 0 10.68 25.76a6 6 0 0 0 4.53 3l24.45 2.71q1.94 2.07 4 4L72 215.24a6 6 0 0 0 3 4.53a105.7 105.7 0 0 0 25.77 10.66a6 6 0 0 0 5.29-1.11l19.1-15.32c1.89.06 3.79.06 5.68 0l19.21 15.38a6 6 0 0 0 3.75 1.31a6.2 6.2 0 0 0 1.54-.2a105.3 105.3 0 0 0 25.76-10.68a6 6 0 0 0 3-4.53l2.71-24.45q2.07-1.93 4-4l24.46-2.72a6 6 0 0 0 4.53-3a105.5 105.5 0 0 0 10.66-25.77a6 6 0 0 0-1.11-5.29Zm-3.1 41.63l-23.64 2.63a6 6 0 0 0-3.82 2a75 75 0 0 1-6.31 6.31a6 6 0 0 0-2 3.82l-2.63 23.63a94.3 94.3 0 0 1-17.36 7.14l-18.57-14.86a6 6 0 0 0-3.75-1.31h-.36a78 78 0 0 1-8.92 0a6 6 0 0 0-4.11 1.3L100.87 218a94 94 0 0 1-17.34-7.17l-2.63-23.62a6 6 0 0 0-2-3.82a75 75 0 0 1-6.31-6.31a6 6 0 0 0-3.82-2l-23.63-2.63A94.3 94.3 0 0 1 38 155.14l14.86-18.57a6 6 0 0 0 1.3-4.11a78 78 0 0 1 0-8.92a6 6 0 0 0-1.3-4.11L38 100.87a94 94 0 0 1 7.17-17.34l23.62-2.63a6 6 0 0 0 3.82-2a75 75 0 0 1 6.31-6.31a6 6 0 0 0 2-3.82l2.63-23.63A94.3 94.3 0 0 1 100.86 38l18.57 14.86a6 6 0 0 0 4.11 1.3a78 78 0 0 1 8.92 0a6 6 0 0 0 4.11-1.3L155.13 38a94 94 0 0 1 17.34 7.17l2.63 23.64a6 6 0 0 0 2 3.82a75 75 0 0 1 6.31 6.31a6 6 0 0 0 3.82 2l23.63 2.63a94.3 94.3 0 0 1 7.14 17.29l-14.86 18.57a6 6 0 0 0-1.3 4.11a78 78 0 0 1 0 8.92a6 6 0 0 0 1.3 4.11L218 155.13a94 94 0 0 1-7.15 17.34Z"></path></svg>');function Gr(e,a){const r=Me(a,["$$slots","$$events","$$legacy"]);var t=Zr();let n;Z(()=>n=xe(t,n,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...r})),x(e,t)}var Wr=be('<svg><path fill="currentColor" d="M122 40V16a6 6 0 0 1 12 0v24a6 6 0 0 1-12 0m68 88a62 62 0 1 1-62-62a62.07 62.07 0 0 1 62 62m-12 0a50 50 0 1 0-50 50a50.06 50.06 0 0 0 50-50M59.76 68.24a6 6 0 1 0 8.48-8.48l-16-16a6 6 0 0 0-8.48 8.48Zm0 119.52l-16 16a6 6 0 1 0 8.48 8.48l16-16a6 6 0 1 0-8.48-8.48M192 70a6 6 0 0 0 4.24-1.76l16-16a6 6 0 0 0-8.48-8.48l-16 16A6 6 0 0 0 192 70m4.24 117.76a6 6 0 0 0-8.48 8.48l16 16a6 6 0 0 0 8.48-8.48ZM46 128a6 6 0 0 0-6-6H16a6 6 0 0 0 0 12h24a6 6 0 0 0 6-6m82 82a6 6 0 0 0-6 6v24a6 6 0 0 0 12 0v-24a6 6 0 0 0-6-6m112-88h-24a6 6 0 0 0 0 12h24a6 6 0 0 0 0-12"></path></svg>');function Qr(e,a){const r=Me(a,["$$slots","$$events","$$legacy"]);var t=Wr();let n;Z(()=>n=xe(t,n,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...r})),x(e,t)}var Xr=be('<svg><path fill="currentColor" d="M88 104H40a8 8 0 0 1-8-8V48a8 8 0 0 1 16 0v28.69l14.63-14.63A95.43 95.43 0 0 1 130 33.94h.53a95.36 95.36 0 0 1 67.07 27.33a8 8 0 0 1-11.18 11.44a79.52 79.52 0 0 0-55.89-22.77h-.45a79.56 79.56 0 0 0-56.14 23.43L59.31 88H88a8 8 0 0 1 0 16m128 48h-48a8 8 0 0 0 0 16h28.69l-14.63 14.63a79.56 79.56 0 0 1-56.13 23.43h-.45a79.52 79.52 0 0 1-55.89-22.77a8 8 0 1 0-11.18 11.44a95.36 95.36 0 0 0 67.07 27.33h.52a95.43 95.43 0 0 0 67.36-28.12L208 179.31V208a8 8 0 0 0 16 0v-48a8 8 0 0 0-8-8"></path></svg>');function Yr(e,a){const r=Me(a,["$$slots","$$events","$$legacy"]);var t=Xr();let n;Z(()=>n=xe(t,n,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...r})),x(e,t)}var Jr=be('<svg><path fill="currentColor" d="M232.13 143.64a6 6 0 0 0-6-1.49a90.07 90.07 0 0 1-112.27-112.3a6 6 0 0 0-7.49-7.48a102.88 102.88 0 0 0-51.89 36.31a102 102 0 0 0 142.84 142.84a102.88 102.88 0 0 0 36.31-51.89a6 6 0 0 0-1.5-5.99m-42 48.29a90 90 0 0 1-126-126a90.9 90.9 0 0 1 35.52-28.27a102.06 102.06 0 0 0 118.69 118.69a90.9 90.9 0 0 1-28.24 35.58Z"></path></svg>');function et(e,a){const r=Me(a,["$$slots","$$events","$$legacy"]);var t=Jr();let n;Z(()=>n=xe(t,n,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...r})),x(e,t)}var at=be('<svg><path fill="currentColor" d="M164.24 100.24L136.48 128l27.76 27.76a6 6 0 1 1-8.48 8.48L128 136.48l-27.76 27.76a6 6 0 0 1-8.48-8.48L119.52 128l-27.76-27.76a6 6 0 0 1 8.48-8.48L128 119.52l27.76-27.76a6 6 0 0 1 8.48 8.48M230 128A102 102 0 1 1 128 26a102.12 102.12 0 0 1 102 102m-12 0a90 90 0 1 0-90 90a90.1 90.1 0 0 0 90-90"></path></svg>');function rt(e,a){const r=Me(a,["$$slots","$$events","$$legacy"]);var t=at();let n;Z(()=>n=xe(t,n,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...r})),x(e,t)}var tt=(e,a)=>{Q(a,!1)},nt=H('<!> <dialog class="container svelte-k25xuh"><div class="listParam svelte-k25xuh"><div class="setting svelte-k25xuh">Thème <!> <!></div> <div class="setting svelte-k25xuh">Mode debug <!></div> <div class="setting svelte-k25xuh"><!></div> <div class="setting svelte-k25xuh"><!></div> <footer>C.i.g.a.l.e vDEV · <a href="#/about">À propos</a></footer></div></dialog>',1);function ot(e,a){Se(a,!0);let r=ce(!1),t=ce(void 0);ke(()=>{window.addEventListener("mouseup",({target:g})=>{var m;g!==p(t)&&((m=p(t))!=null&&m.contains(g)||Q(r,!1))})});let n=ce(!0);ke(()=>{window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",g=>{Q(n,!g.matches)})});var o=nt(),s=ee(o);const l=q(()=>p(r)?"Fermer":"Réglages");pa(s,{get help(){return p(l)},onclick:()=>{Q(r,!p(r))},children:(g,m)=>{var h=Ma(),I=ee(h);{var R=D=>{rt(D,{})},j=D=>{Gr(D,{})};oe(I,D=>{p(r)?D(R):D(j,!1)})}x(g,h)}});var v=b(s,2),f=C(v),i=C(f),c=b(C(i));const u=q(()=>me().theme==="auto"?p(n):me().theme==="light");da(c,{get value(){return p(u)},onchange:async g=>{await Ke("theme",g?"light":"dark")},icons:{on:Qr,off:et}});var d=b(c,2);const M=q(()=>me().theme==="auto");pa(d,{get disabled(){return p(M)},onclick:async()=>await Ke("theme","auto"),help:"Synchroniser avec le thème du système",children:(g,m)=>{Yr(g,{})}}),B(i);var w=b(i,2),y=b(C(w));da(y,{get value(){return me().showTechnicalMetadata},onchange:async g=>{await Ke("showTechnicalMetadata",g)}}),B(w);var k=b(w,2),T=C(k);ye(T,{onclick:async()=>{Q(r,!1),await Ze("#/protocols")},children:(g,m)=>{ve();var h=fe("Gérer les protocoles");x(g,h)},$$slots:{default:!0}}),B(k);var P=b(k,2),_=C(P);ye(_,{onclick:()=>{var g;(g=a.openKeyboardShortcuts)==null||g.call(a)},children:(g,m)=>{ve();var h=fe("Raccourcis clavier");x(g,h)},$$slots:{default:!0}}),B(P);var L=b(P,2),z=b(C(L));z.__click=[tt,r],B(L),B(f),B(v),cr(v,g=>Q(t,g),()=>p(t)),Z(g=>{ae(v,"data-theme",g),v.open=p(r)?!0:void 0},[()=>me().theme]),x(e,o),Te()}ka(["click"]);var st=H('<button class="pr-number svelte-1i3vnya"></button>'),it=H('<div class="line svelte-1i3vnya"></div>'),lt=H('<div class="line svelte-1i3vnya"></div>'),vt=H('<div class="line svelte-1i3vnya"></div>'),ct=H('<div class="line svelte-1i3vnya"></div>'),ft=H("<!> Résultats",1),ut=H('<!> <!> <header><nav class="svelte-1i3vnya"><div class="logo svelte-1i3vnya"><a href="#/" class="svelte-1i3vnya"><svelte-css-wrapper style="display: contents"><!></svelte-css-wrapper> C.i.g.a.l.e.</a> <!></div> <div class="steps svelte-1i3vnya"><a href="#/" class="svelte-1i3vnya">Protocole <!></a> <!> <a href="#/import" class="svelte-1i3vnya">Importer <!></a> <!> <a href="#/crop" class="svelte-1i3vnya">Recadrer <!></a> <!> <a href="#/classify" class="svelte-1i3vnya">Classifier <!></a> <!> <!></div> <svelte-css-wrapper style="display: contents"><!></svelte-css-wrapper></nav> <!></header>',1);function pt(e,a){Se(a,!0);let r=ra(a,"progress",3,0);const t=q(()=>Pa.url.hash.replace(/^#/,"")),n=q(()=>re.Image.state.length>0);let o=ce(void 0),s=ce(void 0);ke(()=>{N.currentProtocol||Ze("#/"),N.currentProtocol&&!p(n)&&Ze("#/import")});let l=ce(void 0);var v=ut(),f=ee(v);Nr(f,{get progress(){return r()},get open(){return p(s)},set open($){Q(s,$,!0)}});var i=b(f,2);{var c=$=>{xr($,{get open(){return p(l)},set open(S){Q(l,S,!0)}})};oe(i,$=>{le&&$(c)})}var u=b(i,2),d=C(u),M=C(d),w=C(M),y=C(w);We(y,()=>({"--fill":"var(--bg-primary)"})),rr(y.lastChild,{}),B(y),ve(),B(w);var k=b(w,2);{var T=$=>{var S=st();S.__click=function(...J){var ie;(ie=p(l))==null||ie.apply(this,J)},S.textContent=`Preview #${le??""}`,x($,S)};oe(k,$=>{le&&$(T)})}B(M);var P=b(M,2),_=C(P),L=b(C(_));{var z=$=>{var S=it();x($,S)};oe(L,$=>{p(t)=="/"&&$(z)})}B(_);var g=b(_,2);je(g,{});var m=b(g,2),h=b(C(m));{var I=$=>{var S=lt();x($,S)};oe(h,$=>{p(t)=="/import"&&$(I)})}B(m);var R=b(m,2);je(R,{});var j=b(R,2),D=b(C(j));{var F=$=>{var S=vt();x($,S)};oe(D,$=>{p(t)=="/crop"&&$(F)})}B(j);var E=b(j,2);je(E,{});var U=b(E,2),O=b(C(U));{var W=$=>{var S=ct();x($,S)};oe(O,$=>{p(t)=="/classify"&&$(W)})}B(U);var Y=b(U,2);je(Y,{});var ue=b(Y,2);ye(ue,{get onclick(){return p(s)},children:($,S)=>{var J=ft(),ie=ee(J);La(ie,{}),ve(),x($,J)},$$slots:{default:!0}}),B(P);var V=b(P,2);We(V,()=>({"--navbar-height":`${p(o)??""}px`})),ot(V.lastChild,{get openKeyboardShortcuts(){return a.openKeyboardShortcuts}}),B(V),B(d);var se=b(d,2);const te=q(()=>N.processing.state==="generating-zip"?0:r());Ta(se,{get progress(){return p(te)}}),B(u),Z(()=>{ae(m,"aria-disabled",!N.currentProtocol),ae(j,"aria-disabled",!N.currentProtocol||!p(n)),ae(U,"aria-disabled",!N.currentProtocol||!p(n))}),ar(u,"clientHeight",$=>Q(o,$)),x(e,v),Te()}ka(["click"]);var dt=H("<base>"),gt=H('<!> <!> <section class="toasts svelte-fbiwzh"></section> <div><!></div>',1);function Qt(e,a){Se(a,!0),ke(()=>{for(const c of re.Image.state)N.hasPreviewURL(c)||(async()=>{const u=await ba("ImagePreviewFile",xa(c.id));if(!u)return;const d=new Blob([u.bytes],{type:c.contentType});N.setPreviewURL(c,URL.createObjectURL(d))})()});const r=q(me);ke(()=>{document.documentElement.dataset.theme=p(r).theme});let t=ce(void 0);var n=gt();Ga(c=>{var u=dt();ae(u,"href",Ge?`${Ge}/index.html`:""),x(c,u)});var o=ee(n);pt(o,{get openKeyboardShortcuts(){return p(t)},hasImages:!0,get progress(){return N.processing.progress}});var s=b(o,2);Ja(s,{preventDefault:!0,get binds(){return N.keybinds},get openHelp(){return p(t)},set openHelp(c){Q(t,c,!0)}});var l=b(s,2);Wa(l,21,()=>Pe.items,c=>c.id,(c,u)=>{er(c,Ya(()=>p(u),{get action(){return p(u).labels.action},get dismiss(){return p(u).labels.close},onaction:()=>{var d,M;(M=(d=p(u).callbacks)==null?void 0:d.action)==null||M.call(d,p(u))},ondismiss:()=>{Pe.remove(p(u).id)}}))}),B(l);var v=b(l,2);let f;var i=C(v);Qa(i,()=>a.children??$a),B(v),Z(c=>f=Xa(v,1,"contents svelte-fbiwzh",null,f,c),[()=>{var c;return{padded:!((c=Pa.route.id)!=null&&c.includes("/(sidepanel)"))}}]),x(e,n),Te()}export{Qt as component,Wt as universal};
