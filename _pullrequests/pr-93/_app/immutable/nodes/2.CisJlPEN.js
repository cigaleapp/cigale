import{aV as za,t as N,ag as Ae,f as se,a as x,c as j,r as L,af as xa,g as d,M as V,ai as ve,ah as Ie,b as Q,s as ce,G as Le}from"../chunks/C5da3JO5.js";import{t as te,o as Ua,d as qa,B as je,c as Ha,S as da,s as Va,e as Wa,g as Ma}from"../chunks/BQmFu-uO.js";import{H as Ga,g as Ze}from"../chunks/BBMHoen_.js";import{t as Ka,J as Na,T as Za,a as Ja}from"../chunks/DDvny3ml.js";import{n as Me,a as M,c as ka,b as fe,t as K}from"../chunks/B4fTvO1f.js";import{s as _e,d as Ta,h as Qa}from"../chunks/CGuacY5z.js";import{e as Xa}from"../chunks/sjLvnAiL.js";import{s as Ya}from"../chunks/BTiqJsOv.js";import{s as ke,a as ee,b as La,c as er}from"../chunks/oOm2T-ds.js";import{p as De}from"../chunks/CY4eTrAl.js";import{r as Te,p as ta,s as ar}from"../chunks/DTwrH9wU.js";import{b as Je}from"../chunks/Jba2UZPy.js";import{p as Pa}from"../chunks/Bk6Buxfv.js";import rr from"../chunks/CaUg37pi.js";import tr from"../chunks/DLICtEU3.js";import{s as Ke,g as ge}from"../chunks/DsVe7qVr.js";import{p as ie,u as oe}from"../chunks/CN6OcoZF.js";import{t as Pe}from"../chunks/CjnctbQb.js";import{i as le}from"../chunks/CfqesXew.js";import{c as pa}from"../chunks/CVEOtOUC.js";import{b as nr}from"../chunks/BASKcC2-.js";import be from"../chunks/DKcneCgN.js";import or from"../chunks/B7ZOg_ky.js";import{D as Sa}from"../chunks/CWq00jaY.js";import{a as Qe}from"../chunks/DOC2QdkI.js";import Aa from"../chunks/CwUVLChJ.js";import sr from"../chunks/DlkEi4U1.js";import{b as ir,e as lr}from"../chunks/1bSUy2Y8.js";import vr from"../chunks/Bw2C8XpN.js";import{a as cr}from"../chunks/HHTdpWX1.js";import{o as fr,a as Ne,b as Ee,c as ur}from"../chunks/B9jFIwne.js";import{b as dr}from"../chunks/D6e4hLnv.js";import ha from"../chunks/D-CInXfC.js";import ma from"../chunks/C7Rp7sbc.js";const pr=za;function hr(e,a){throw new Ga(e,a)}new TextEncoder;async function mr(e){const a=await fetch(Ka("class_mapping.txt")).then(r=>r.text()).then(r=>r.split(`
`));await te.Metadata.set({id:e,description:"L'espèce de l'individu",label:"Espèce",mergeMethod:"max",required:!1,type:"enum",options:a.filter(Boolean).map((r,t)=>({key:t.toString(),label:r,description:"",learnMore:`https://en.wikipedia.org/wiki/${encodeURIComponent(r)}`}))})}async function gr(){try{await te.initialize(),await wr(),await mr("species"),await te.initialize()}catch(e){console.error(e),hr(400,{message:(e==null?void 0:e.toString())??"Erreur inattendue"})}}async function wr(){await Ua(["Metadata","Protocol","Settings"],{},e=>{for(const a of qa)e.objectStore("Metadata").put(a);e.objectStore("Protocol").put({id:"io.github.cigaleapp.transect",metadata:[je.species,je.shoot_date,je.shoot_location,je.crop],authors:[],exports:{images:{cropped:'Cropped/{{ fallback image.metadata.species.valueLabel "(Unknown)" }}_{{ sequence }}.{{ extension image.filename }}',original:'Original/{{ fallback image.metadata.species.valueLabel "(Unknown)" }}_{{ sequence }}.{{ extension image.filename }}'},metadata:{json:"analysis.json",csv:"metadata.csv"}},name:"Transect",source:"https://github.com/cigaleapp/cigale"}),e.objectStore("Settings").put({id:"defaults",protocols:[],theme:"auto",gridSize:10,language:"fr",showInputHints:!0,showTechnicalMetadata:pr})})}const Jt=Object.freeze(Object.defineProperty({__proto__:null,load:gr},Symbol.toStringTag,{value:"Module"}));var yr=Me('<svg><path fill="currentColor" d="m181.66 133.66l-80 80a8 8 0 0 1-11.32-11.32L164.69 128L90.34 53.66a8 8 0 0 1 11.32-11.32l80 80a8 8 0 0 1 0 11.32"></path></svg>');function Ce(e,a){const r=Te(a,["$$slots","$$events","$$legacy"]);var t=yr();let n;N(()=>n=ke(t,n,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...r})),M(e,t)}const ga=(e,a=xa)=>{var r=_r(),t=j(r),n=x(t,2);Qe(n,()=>fetch(a().url).then(o=>o.json()),o=>{var s=fe();N(()=>_e(s,a().login)),M(o,s)},(o,s)=>{var i=V(()=>{var{name:l}=d(s);return{name:l}}),v=V(()=>d(i).name),u=fe();N(()=>_e(u,d(v))),M(o,u)},(o,s)=>{var i=fe();N(()=>_e(i,a().login)),M(o,i)}),L(r),N(()=>{ee(r,"href",a().html_url),ee(r,"title",`@${a().login}`),ee(t,"src",a().avatar_url),ee(t,"alt",`Avatar de ${a().login??""}`)}),M(e,r)};var _r=K('<a class="github-user svelte-b46tju"><img class="svelte-b46tju"> <!></a>'),$r=K("<!> <!>",1),br=K("pour l'issue <a> </a> de <!>",1),xr=K('<li class="svelte-b46tju"><!></li>'),Mr=K('<p class="svelte-b46tju">Ceci est un déploiement de preview</p> <ul><li class="svelte-b46tju">pour la PR <a> </a> de <!></li> <!> <br></ul> <p class="svelte-b46tju"> </p>',1),kr=K('<p class="svelte-b46tju">Ceci est un déploiement de preview pour la PR <a></a></p>');function Tr(e,a){Ae(a,!0);let r=ta(a,"open",15);{const t=(n,o)=>{let s=()=>o==null?void 0:o().close;var i=$r(),v=se(i);be(v,{help:"Supprime toutes les données pour ce déploiement de preview",onclick:()=>{Ha(),window.location.reload()},children:(l,f)=>{ve();var c=fe("Nettoyer la base de données");M(l,c)},$$slots:{default:!0}});var u=x(v,2);be(u,{onclick:()=>{window.open(`https://github.com/cigaleapp/cigale/pull/${ie}`),s()()},children:(l,f)=>{ve();var c=fe("Voir sur Github");M(l,c)},$$slots:{default:!0}}),M(n,i)};Aa(e,{key:"preview-pr",title:`Preview de la PR #${ie??""}`,get open(){return r()},set open(n){r(n)},footer:t,children:(n,o)=>{var s=ka();const i=V(()=>`https://github.com/cigaleapp/cigale/pull/${ie}`);var v=se(s);Qe(v,()=>fetch(`https://api.github.com/repos/cigaleapp/cigale/pulls/${ie}`).then(u=>u.json()),u=>{var l=kr(),f=x(j(l));f.textContent=`#${ie??""}`,L(l),N(()=>ee(f,"href",d(i))),M(u,l)},(u,l)=>{var f=V(()=>{var{title:k,user:z,body:A}=d(l);return{title:k,user:z,body:A}}),c=V(()=>d(f).title),p=V(()=>d(f).user),y=V(()=>d(f).body),w=Mr();const _=V(()=>{var k;return(k=/(Closes|Fixes) #(\d+)/i.exec(d(y)))==null?void 0:k[2]});var P=x(se(w),2),S=j(P),T=x(j(S)),$=j(T,!0);L(T);var I=x(T,2);ga(I,()=>d(p)),L(S);var O=x(S,2);{var h=k=>{var z=xr(),A=j(z);Qe(A,()=>fetch(`https://api.github.com/repos/cigaleapp/cigale/issues/${d(_)}`).then(D=>D.json()),null,(D,R)=>{var C=V(()=>{var{title:J,number:F,user:b,html_url:H}=d(R);return{title:J,number:F,user:b,html_url:H}}),U=V(()=>d(C).title),B=V(()=>d(C).number),Z=V(()=>d(C).user),Y=V(()=>d(C).html_url),ue=br(),q=x(se(ue)),ae=j(q);L(q);var re=x(q,2);ga(re,()=>d(Z)),N(()=>{ee(q,"href",d(Y)),_e(ae,`#${d(B)??""} ${d(U)??""}`)}),M(D,ue)}),L(z),M(k,z)};le(O,k=>{d(_)&&k(h)})}ve(2),L(P);var m=x(P,2),g=j(m,!0);L(m),N(()=>{ee(T,"href",d(i)),_e($,d(c)),_e(g,d(y))}),M(u,w)},(u,l)=>{var f=fe();f.nodeValue=`#${ie??""}`,M(u,f)}),M(n,s)},$$slots:{footer:!0,default:!0}})}Ie()}var wa={},Lr=function(e,a,r,t,n){var o=new Worker(wa[a]||(wa[a]=URL.createObjectURL(new Blob([e+';addEventListener("error",function(e){e=e.error;postMessage({$e$:[e.message,e.code,e.stack]})})'],{type:"text/javascript"}))));return o.onmessage=function(s){var i=s.data,v=i.$e$;if(v){var u=new Error(v[0]);u.code=v[1],u.stack=v[2],n(u,null)}else n(null,i)},o.postMessage(r,t),o},G=Uint8Array,X=Uint16Array,qe=Int32Array,He=new G([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0,0]),Ve=new G([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,0,0]),Xe=new G([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),Ia=function(e,a){for(var r=new X(31),t=0;t<31;++t)r[t]=a+=1<<e[t-1];for(var n=new qe(r[30]),t=1;t<30;++t)for(var o=r[t];o<r[t+1];++o)n[o]=o-r[t]<<5|t;return{b:r,r:n}},ja=Ia(He,2),Pr=ja.b,Re=ja.r;Pr[28]=258,Re[258]=28;var Sr=Ia(Ve,0),Ye=Sr.r,Fe=new X(32768);for(var E=0;E<32768;++E){var pe=(E&43690)>>1|(E&21845)<<1;pe=(pe&52428)>>2|(pe&13107)<<2,pe=(pe&61680)>>4|(pe&3855)<<4,Fe[E]=((pe&65280)>>8|(pe&255)<<8)>>1}var $e=function(e,a,r){for(var t=e.length,n=0,o=new X(a);n<t;++n)e[n]&&++o[e[n]-1];var s=new X(a);for(n=1;n<a;++n)s[n]=s[n-1]+o[n-1]<<1;var i;if(r){i=new X(1<<a);var v=15-a;for(n=0;n<t;++n)if(e[n])for(var u=n<<4|e[n],l=a-e[n],f=s[e[n]-1]++<<l,c=f|(1<<l)-1;f<=c;++f)i[Fe[f]>>v]=u}else for(i=new X(t),n=0;n<t;++n)e[n]&&(i[n]=Fe[s[e[n]-1]++]>>15-e[n]);return i},he=new G(288);for(var E=0;E<144;++E)he[E]=8;for(var E=144;E<256;++E)he[E]=9;for(var E=256;E<280;++E)he[E]=7;for(var E=280;E<288;++E)he[E]=8;var Se=new G(32);for(var E=0;E<32;++E)Se[E]=5;var Ea=$e(he,9,0),Ca=$e(Se,5,0),na=function(e){return(e+7)/8|0},oa=function(e,a,r){return(a==null||a<0)&&(a=0),(r==null||r>e.length)&&(r=e.length),new G(e.subarray(a,r))},Ar=["unexpected EOF","invalid block type","invalid length/literal","invalid distance","stream finished","no stream handler",,"no callback","invalid UTF-8 data","extra field too long","date not in range 1980-2099","filename too long","stream finishing","invalid zip data"],xe=function(e,a,r){var t=new Error(a||Ar[e]);if(t.code=e,Error.captureStackTrace&&Error.captureStackTrace(t,xe),!r)throw t;return t},ne=function(e,a,r){r<<=a&7;var t=a/8|0;e[t]|=r,e[t+1]|=r>>8},we=function(e,a,r){r<<=a&7;var t=a/8|0;e[t]|=r,e[t+1]|=r>>8,e[t+2]|=r>>16},Oe=function(e,a){for(var r=[],t=0;t<e.length;++t)e[t]&&r.push({s:t,f:e[t]});var n=r.length,o=r.slice();if(!n)return{t:ia,l:0};if(n==1){var s=new G(r[0].s+1);return s[r[0].s]=1,{t:s,l:1}}r.sort(function(I,O){return I.f-O.f}),r.push({s:-1,f:25001});var i=r[0],v=r[1],u=0,l=1,f=2;for(r[0]={s:-1,f:i.f+v.f,l:i,r:v};l!=n-1;)i=r[r[u].f<r[f].f?u++:f++],v=r[u!=l&&r[u].f<r[f].f?u++:f++],r[l++]={s:-1,f:i.f+v.f,l:i,r:v};for(var c=o[0].s,t=1;t<n;++t)o[t].s>c&&(c=o[t].s);var p=new X(c+1),y=ze(r[l-1],p,0);if(y>a){var t=0,w=0,_=y-a,P=1<<_;for(o.sort(function(O,h){return p[h.s]-p[O.s]||O.f-h.f});t<n;++t){var S=o[t].s;if(p[S]>a)w+=P-(1<<y-p[S]),p[S]=a;else break}for(w>>=_;w>0;){var T=o[t].s;p[T]<a?w-=1<<a-p[T]++-1:++t}for(;t>=0&&w;--t){var $=o[t].s;p[$]==a&&(--p[$],++w)}y=a}return{t:new G(p),l:y}},ze=function(e,a,r){return e.s==-1?Math.max(ze(e.l,a,r+1),ze(e.r,a,r+1)):a[e.s]=r},ea=function(e){for(var a=e.length;a&&!e[--a];);for(var r=new X(++a),t=0,n=e[0],o=1,s=function(v){r[t++]=v},i=1;i<=a;++i)if(e[i]==n&&i!=a)++o;else{if(!n&&o>2){for(;o>138;o-=138)s(32754);o>2&&(s(o>10?o-11<<5|28690:o-3<<5|12305),o=0)}else if(o>3){for(s(n),--o;o>6;o-=6)s(8304);o>2&&(s(o-3<<5|8208),o=0)}for(;o--;)s(n);o=1,n=e[i]}return{c:r.subarray(0,t),n:a}},ye=function(e,a){for(var r=0,t=0;t<a.length;++t)r+=e[t]*a[t];return r},sa=function(e,a,r){var t=r.length,n=na(a+2);e[n]=t&255,e[n+1]=t>>8,e[n+2]=e[n]^255,e[n+3]=e[n+1]^255;for(var o=0;o<t;++o)e[n+o+4]=r[o];return(n+4+t)*8},aa=function(e,a,r,t,n,o,s,i,v,u,l){ne(a,l++,r),++n[256];for(var f=Oe(n,15),c=f.t,p=f.l,y=Oe(o,15),w=y.t,_=y.l,P=ea(c),S=P.c,T=P.n,$=ea(w),I=$.c,O=$.n,h=new X(19),m=0;m<S.length;++m)++h[S[m]&31];for(var m=0;m<I.length;++m)++h[I[m]&31];for(var g=Oe(h,7),k=g.t,z=g.l,A=19;A>4&&!k[Xe[A-1]];--A);var D=u+5<<3,R=ye(n,he)+ye(o,Se)+s,C=ye(n,c)+ye(o,w)+s+14+3*A+ye(h,k)+2*h[16]+3*h[17]+7*h[18];if(v>=0&&D<=R&&D<=C)return sa(a,l,e.subarray(v,v+u));var U,B,Z,Y;if(ne(a,l,1+(C<R)),l+=2,C<R){U=$e(c,p,0),B=c,Z=$e(w,_,0),Y=w;var ue=$e(k,z,0);ne(a,l,T-257),ne(a,l+5,O-1),ne(a,l+10,A-4),l+=14;for(var m=0;m<A;++m)ne(a,l+3*m,k[Xe[m]]);l+=3*A;for(var q=[S,I],ae=0;ae<2;++ae)for(var re=q[ae],m=0;m<re.length;++m){var J=re[m]&31;ne(a,l,ue[J]),l+=k[J],J>15&&(ne(a,l,re[m]>>5&127),l+=re[m]>>12)}}else U=Ea,B=he,Z=Ca,Y=Se;for(var m=0;m<i;++m){var F=t[m];if(F>255){var J=F>>18&31;we(a,l,U[J+257]),l+=B[J+257],J>7&&(ne(a,l,F>>23&31),l+=He[J]);var b=F&31;we(a,l,Z[b]),l+=Y[b],b>3&&(we(a,l,F>>5&8191),l+=Ve[b])}else we(a,l,U[F]),l+=B[F]}return we(a,l,U[256]),l+B[256]},Ba=new qe([65540,131080,131088,131104,262176,1048704,1048832,2114560,2117632]),ia=new G(0),Oa=function(e,a,r,t,n,o){var s=o.z||e.length,i=new G(t+s+5*(1+Math.ceil(s/7e3))+n),v=i.subarray(t,i.length-n),u=o.l,l=(o.r||0)&7;if(a){l&&(v[0]=o.r>>3);for(var f=Ba[a-1],c=f>>13,p=f&8191,y=(1<<r)-1,w=o.p||new X(32768),_=o.h||new X(y+1),P=Math.ceil(r/3),S=2*P,T=function(Ge){return(e[Ge]^e[Ge+1]<<P^e[Ge+2]<<S)&y},$=new qe(25e3),I=new X(288),O=new X(32),h=0,m=0,g=o.i||0,k=0,z=o.w||0,A=0;g+2<s;++g){var D=T(g),R=g&32767,C=_[D];if(w[R]=C,_[D]=R,z<=g){var U=s-g;if((h>7e3||k>24576)&&(U>423||!u)){l=aa(e,v,0,$,I,O,m,k,A,g-A,l),k=h=m=0,A=g;for(var B=0;B<286;++B)I[B]=0;for(var B=0;B<30;++B)O[B]=0}var Z=2,Y=0,ue=p,q=R-C&32767;if(U>2&&D==T(g-q))for(var ae=Math.min(c,U)-1,re=Math.min(32767,g),J=Math.min(258,U);q<=re&&--ue&&R!=C;){if(e[g+Z]==e[g+Z-q]){for(var F=0;F<J&&e[g+F]==e[g+F-q];++F);if(F>Z){if(Z=F,Y=q,F>ae)break;for(var b=Math.min(q,F-2),H=0,B=0;B<b;++B){var de=g-q+B&32767,me=w[de],ca=de-me&32767;ca>H&&(H=ca,C=de)}}}R=C,C=w[R],q+=R-C&32767}if(Y){$[k++]=268435456|Re[Z]<<18|Ye[Y];var fa=Re[Z]&31,ua=Ye[Y]&31;m+=He[fa]+Ve[ua],++I[257+fa],++O[ua],z=g+Z,++h}else $[k++]=e[g],++I[e[g]]}}for(g=Math.max(g,z);g<s;++g)$[k++]=e[g],++I[e[g]];l=aa(e,v,u,$,I,O,m,k,A,g-A,l),u||(o.r=l&7|v[l/8|0]<<3,l-=7,o.h=_,o.p=w,o.i=g,o.w=z)}else{for(var g=o.w||0;g<s+u;g+=65535){var We=g+65535;We>=s&&(v[l/8|0]=u,We=s),l=sa(v,l+1,e.subarray(g,We))}o.i=s}return oa(i,0,t+na(l)+n)},Ir=function(){for(var e=new Int32Array(256),a=0;a<256;++a){for(var r=a,t=9;--t;)r=(r&1&&-306674912)^r>>>1;e[a]=r}return e}(),jr=function(){var e=-1;return{p:function(a){for(var r=e,t=0;t<a.length;++t)r=Ir[r&255^a[t]]^r>>>8;e=r},d:function(){return~e}}},Da=function(e,a,r,t,n){if(!n&&(n={l:1},a.dictionary)){var o=a.dictionary.subarray(-32768),s=new G(o.length+e.length);s.set(o),s.set(e,o.length),e=s,n.w=o.length}return Oa(e,a.level==null?6:a.level,a.mem==null?n.l?Math.ceil(Math.max(8,Math.min(13,Math.log(e.length)))*1.5):20:12+a.mem,r,t,n)},la=function(e,a){var r={};for(var t in e)r[t]=e[t];for(var t in a)r[t]=a[t];return r},ya=function(e,a,r){for(var t=e(),n=e.toString(),o=n.slice(n.indexOf("[")+1,n.lastIndexOf("]")).replace(/\s+/g,"").split(","),s=0;s<t.length;++s){var i=t[s],v=o[s];if(typeof i=="function"){a+=";"+v+"=";var u=i.toString();if(i.prototype)if(u.indexOf("[native code]")!=-1){var l=u.indexOf(" ",8)+1;a+=u.slice(l,u.indexOf("(",l))}else{a+=u;for(var f in i.prototype)a+=";"+v+".prototype."+f+"="+i.prototype[f].toString()}else a+=u}else r[v]=i}return a},Be=[],Er=function(e){var a=[];for(var r in e)e[r].buffer&&a.push((e[r]=new e[r].constructor(e[r])).buffer);return a},Cr=function(e,a,r,t){if(!Be[r]){for(var n="",o={},s=e.length-1,i=0;i<s;++i)n=ya(e[i],n,o);Be[r]={c:ya(e[s],n,o),e:o}}var v=la({},Be[r].e);return Lr(Be[r].c+";onmessage=function(e){for(var k in e.data)self[k]=e.data[k];onmessage="+a.toString()+"}",r,v,Er(v),t)},Br=function(){return[G,X,qe,He,Ve,Xe,Re,Ye,Ea,he,Ca,Se,Fe,Ba,ia,$e,ne,we,Oe,ze,ea,ye,sa,aa,na,oa,Oa,Da,va,Ra]},Ra=function(e){return postMessage(e,[e.buffer])},Or=function(e,a,r,t,n,o){var s=Cr(r,t,n,function(i,v){s.terminate(),o(i,v)});return s.postMessage([e,a],a.consume?[e.buffer]:[]),function(){s.terminate()}},W=function(e,a,r){for(;r;++a)e[a]=r,r>>>=8};function Dr(e,a,r){return r||(r=a,a={}),typeof r!="function"&&xe(7),Or(e,a,[Br],function(t){return Ra(va(t.data[0],t.data[1]))},0,r)}function va(e,a){return Da(e,a||{},0,0)}var Fa=function(e,a,r,t){for(var n in e){var o=e[n],s=a+n,i=t;Array.isArray(o)&&(i=la(t,o[1]),o=o[0]),o instanceof G?r[s]=[o,i]:(r[s+="/"]=[new G(0),i],Fa(o,s,r,t))}},_a=typeof TextEncoder<"u"&&new TextEncoder,Rr=typeof TextDecoder<"u"&&new TextDecoder,Fr=0;try{Rr.decode(ia,{stream:!0}),Fr=1}catch{}function Ue(e,a){var r;if(_a)return _a.encode(e);for(var t=e.length,n=new G(e.length+(e.length>>1)),o=0,s=function(u){n[o++]=u},r=0;r<t;++r){if(o+5>n.length){var i=new G(o+8+(t-r<<1));i.set(n),n=i}var v=e.charCodeAt(r);v<128||a?s(v):v<2048?(s(192|v>>6),s(128|v&63)):v>55295&&v<57344?(v=65536+(v&1047552)|e.charCodeAt(++r)&1023,s(240|v>>18),s(128|v>>12&63),s(128|v>>6&63),s(128|v&63)):(s(224|v>>12),s(128|v>>6&63),s(128|v&63))}return oa(n,0,o)}var ra=function(e){var a=0;if(e)for(var r in e){var t=e[r].length;t>65535&&xe(9),a+=t+4}return a},$a=function(e,a,r,t,n,o,s,i){var v=t.length,u=r.extra,l=i&&i.length,f=ra(u);W(e,a,s!=null?33639248:67324752),a+=4,s!=null&&(e[a++]=20,e[a++]=r.os),e[a]=20,a+=2,e[a++]=r.flag<<1|(o<0&&8),e[a++]=n&&8,e[a++]=r.compression&255,e[a++]=r.compression>>8;var c=new Date(r.mtime==null?Date.now():r.mtime),p=c.getFullYear()-1980;if((p<0||p>119)&&xe(10),W(e,a,p<<25|c.getMonth()+1<<21|c.getDate()<<16|c.getHours()<<11|c.getMinutes()<<5|c.getSeconds()>>1),a+=4,o!=-1&&(W(e,a,r.crc),W(e,a+4,o<0?-o-2:o),W(e,a+8,r.size)),W(e,a+12,v),W(e,a+14,f),a+=16,s!=null&&(W(e,a,l),W(e,a+6,r.attrs),W(e,a+10,s),a+=14),e.set(t,a),a+=v,f)for(var y in u){var w=u[y],_=w.length;W(e,a,+y),W(e,a+2,_),e.set(w,a+4),a+=4+_}return l&&(e.set(i,a),a+=l),a},zr=function(e,a,r,t,n){W(e,a,101010256),W(e,a+8,r),W(e,a+10,r),W(e,a+12,t),W(e,a+16,n)};function Ur(e,a,r){r||(r=a,a={}),typeof r!="function"&&xe(7);var t={};Fa(e,"",t,a);var n=Object.keys(t),o=n.length,s=0,i=0,v=o,u=new Array(o),l=[],f=function(){for(var _=0;_<l.length;++_)l[_]()},c=function(_,P){ba(function(){r(_,P)})};ba(function(){c=r});var p=function(){var _=new G(i+22),P=s,S=i-s;i=0;for(var T=0;T<v;++T){var $=u[T];try{var I=$.c.length;$a(_,i,$,$.f,$.u,I);var O=30+$.f.length+ra($.extra),h=i+O;_.set($.c,h),$a(_,s,$,$.f,$.u,I,i,$.m),s+=16+O+($.m?$.m.length:0),i=h+I}catch(m){return c(m,null)}}zr(_,s,u.length,S,P),c(null,_)};o||p();for(var y=function(_){var P=n[_],S=t[P],T=S[0],$=S[1],I=jr(),O=T.length;I.p(T);var h=Ue(P),m=h.length,g=$.comment,k=g&&Ue(g),z=k&&k.length,A=ra($.extra),D=$.level==0?0:8,R=function(C,U){if(C)f(),c(C,null);else{var B=U.length;u[_]=la($,{size:O,crc:I.d(),c:U,f:h,m:k,u:m!=P.length||k&&g.length!=z,compression:D}),s+=30+m+A+B,i+=76+2*(m+A)+(z||0)+B,--o||p()}};if(m>65535&&R(xe(11,0,1),null),!D)R(null,T);else if(O<16e4)try{R(null,va(T,$))}catch(C){R(C,null)}else l.push(Dr(T,$,R))},w=0;w<v;++w)y(w);return f}var ba=typeof queueMicrotask=="function"?queueMicrotask:typeof setTimeout=="function"?setTimeout:function(e){e()};async function qr(e,a,{include:r="croppedonly",base:t}){const n=Object.fromEntries(await Promise.all(e.map(async l=>[l.id,{label:l.label,metadata:await fr(l).then(Ne),images:l.images.map(f=>{const c=te.Image.state.find(p=>p.id===f);if(c)return{...c,metadata:Ne(c.metadata)}})}]))),o=[...new Set(e.flatMap(l=>Object.keys(n[l.id].metadata)))],s=Object.fromEntries(te.Metadata.state.map(l=>[l.id,l]));let i=[];r!=="metadataonly"&&(i=await Promise.all(e.flatMap(l=>l.images.map(async f=>{const c=await te.Image.get(f);if(!c)throw"Image non trouvée";const{contentType:p,filename:y}=c,{cropped:w,original:_}=await Hr(c);return{imageId:f,croppedBytes:new Uint8Array(w),originalBytes:r==="full"?new Uint8Array(_):void 0,contentType:p,filename:y}}))));const v=a.exports??{images:{cropped:da.FilepathTemplate.assert("cropped/{{sequence}}.{{extension image.filename}}"),original:da.FilepathTemplate.assert("original/{{sequence}}.{{extension image.filename}}")},metadata:{json:"analysis.json",csv:"metadata.csv"}},u=await new Promise((l,f)=>Ur({[v.metadata.json]:Ue(Va("json",`${window.location.origin}${t}/results.schema.json`,{observations:n,protocol:a},["protocol","observations"])),[v.metadata.csv]:Ue(Vr(["Identifiant","Observation",...o.flatMap(c=>[Ee(s[c]),`${Ee(s[c])}: Confiance`])],e.map(c=>({Identifiant:c.id,Observation:c.label,...Object.fromEntries(Object.entries(n[c.id].metadata).flatMap(([p,{value:y,confidence:w}])=>[[Ee(s[p]),ur(s[p],y)],[`${Ee(s[p])}: Confiance`,w.toString()]]))})))),...Object.fromEntries(r==="metadataonly"?[]:e.flatMap(c=>c.images.map(p=>[c,p])).flatMap(([c,p],y)=>{const w=i.find(S=>S.imageId===p);if(!w)throw"Image non trouvée";const _=te.Image.state.find(S=>S.id===p);if(!_)throw"Image non trouvée";const P={image:{..._,metadata:Ne(_.metadata)},observation:c,sequence:y+1};return[[v.images.cropped(P),[w.croppedBytes,{level:0}]],[v.images.original(P),[w.originalBytes,{level:0}]]].filter(([,[S]])=>S!==void 0)}))},{comment:`Generated by C.i.g.a.l.e on ${new Date().toISOString()} - ${window.location.origin}`},(c,p)=>{c&&f(c),l(p)}));Wa(u,"results.zip","application/zip")}async function Hr(e){var s;const a=(s=e.metadata.crop)==null?void 0:s.value;if(!a)throw"L'image n'a pas d'information de recadrage";const r=cr(a),t=await Ma("ImageFile",ir(e.id)).then(i=>i==null?void 0:i.bytes);if(!t)throw"L'image n'a pas de fichier associé";const n=await Na.read(t),o={widthWise:n.width/Ja,heightWise:n.height/Za};try{return{cropped:await n.crop({x:r.x*o.widthWise,y:r.y*o.heightWise,w:r.width*o.widthWise,h:r.height*o.heightWise}).getBuffer(e.contentType),original:t}}catch(i){Pe.warn(`Impossible de recadrer ${e.filename}, l'image sera incluse sans recadrage`),console.error(`Couldn't crop ${e.filename} (id ${e.id}) with `,{boundingBox:r,scaleFactors:o},":",i)}return{cropped:t,original:t}}function Vr(e,a,r=";"){const t=n=>`"${(n==null?void 0:n.replace(/"/g,'""'))??""}"`;return[e.map(t).join(r),...a.map(n=>e.map(o=>t(n[o])).join(r))].join(`
`)}var Wr=K("<!> results.zip",1);function Gr(e,a){Ae(a,!0);let r=ta(a,"open",15),t=ce(!1),n=ce("croppedonly");async function o(){Q(t,!0);const s=te.Protocol.state.find(i=>i.id===oe.currentProtocol);if(!s){Pe.error("Aucun protocole sélectionné"),Q(t,!1);return}try{await lr(),await qr(te.Observation.state,s,{base:Je,include:d(n)})}catch(i){console.error(i),Pe.error(`Erreur lors de l'exportation des résultats: ${(i==null?void 0:i.toString())??"Erreur inattendue"}`)}finally{Q(t,!1)}}Aa(e,{key:"export-results",title:"Exporter les résultats",get open(){return r()},set open(i){r(i)},footer:i=>{be(i,{onclick:o,children:(v,u)=>{var l=Wr(),f=se(l);{var c=y=>{sr(y,{})},p=y=>{Sa(y,{})};le(f,y=>{d(t)?y(c):y(p,!1)})}ve(),M(v,l)},$$slots:{default:!0}})},children:(i,v)=>{vr(i,{options:[{key:"metadataonly",label:"Métadonnées seulement"},{key:"croppedonly",label:"Métadonnées et images recadrées"},{key:"full",label:"Métadonnées, images recadrées et images originales"}],get value(){return d(n)},set value(u){Q(n,De(u))},children:(u,l)=>{ve();var f=fe("Quoi inclure dans l'export");M(u,f)},$$slots:{default:!0}})},$$slots:{footer:!0,default:!0}}),Ie()}var Kr=Me('<svg><path fill="currentColor" d="M128 82a46 46 0 1 0 46 46a46.06 46.06 0 0 0-46-46m0 80a34 34 0 1 1 34-34a34 34 0 0 1-34 34m86-31.16c.06-1.89.06-3.79 0-5.68L229.33 106a6 6 0 0 0 1.11-5.29a105.3 105.3 0 0 0-10.68-25.81a6 6 0 0 0-4.53-3l-24.45-2.71q-1.93-2.07-4-4l-2.72-24.46a6 6 0 0 0-3-4.53a105.7 105.7 0 0 0-25.77-10.66a6 6 0 0 0-5.29 1.14l-19.2 15.37a90 90 0 0 0-5.68 0L106 26.67a6 6 0 0 0-5.29-1.11A105.3 105.3 0 0 0 74.9 36.24a6 6 0 0 0-3 4.53l-2.67 24.45q-2.07 1.94-4 4L40.76 72a6 6 0 0 0-4.53 3a105.7 105.7 0 0 0-10.66 25.77a6 6 0 0 0 1.11 5.23l15.37 19.2a90 90 0 0 0 0 5.68l-15.38 19.17a6 6 0 0 0-1.11 5.29a105.3 105.3 0 0 0 10.68 25.76a6 6 0 0 0 4.53 3l24.45 2.71q1.94 2.07 4 4L72 215.24a6 6 0 0 0 3 4.53a105.7 105.7 0 0 0 25.77 10.66a6 6 0 0 0 5.29-1.11l19.1-15.32c1.89.06 3.79.06 5.68 0l19.21 15.38a6 6 0 0 0 3.75 1.31a6.2 6.2 0 0 0 1.54-.2a105.3 105.3 0 0 0 25.76-10.68a6 6 0 0 0 3-4.53l2.71-24.45q2.07-1.93 4-4l24.46-2.72a6 6 0 0 0 4.53-3a105.5 105.5 0 0 0 10.66-25.77a6 6 0 0 0-1.11-5.29Zm-3.1 41.63l-23.64 2.63a6 6 0 0 0-3.82 2a75 75 0 0 1-6.31 6.31a6 6 0 0 0-2 3.82l-2.63 23.63a94.3 94.3 0 0 1-17.36 7.14l-18.57-14.86a6 6 0 0 0-3.75-1.31h-.36a78 78 0 0 1-8.92 0a6 6 0 0 0-4.11 1.3L100.87 218a94 94 0 0 1-17.34-7.17l-2.63-23.62a6 6 0 0 0-2-3.82a75 75 0 0 1-6.31-6.31a6 6 0 0 0-3.82-2l-23.63-2.63A94.3 94.3 0 0 1 38 155.14l14.86-18.57a6 6 0 0 0 1.3-4.11a78 78 0 0 1 0-8.92a6 6 0 0 0-1.3-4.11L38 100.87a94 94 0 0 1 7.17-17.34l23.62-2.63a6 6 0 0 0 3.82-2a75 75 0 0 1 6.31-6.31a6 6 0 0 0 2-3.82l2.63-23.63A94.3 94.3 0 0 1 100.86 38l18.57 14.86a6 6 0 0 0 4.11 1.3a78 78 0 0 1 8.92 0a6 6 0 0 0 4.11-1.3L155.13 38a94 94 0 0 1 17.34 7.17l2.63 23.64a6 6 0 0 0 2 3.82a75 75 0 0 1 6.31 6.31a6 6 0 0 0 3.82 2l23.63 2.63a94.3 94.3 0 0 1 7.14 17.29l-14.86 18.57a6 6 0 0 0-1.3 4.11a78 78 0 0 1 0 8.92a6 6 0 0 0 1.3 4.11L218 155.13a94 94 0 0 1-7.15 17.34Z"></path></svg>');function Nr(e,a){const r=Te(a,["$$slots","$$events","$$legacy"]);var t=Kr();let n;N(()=>n=ke(t,n,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...r})),M(e,t)}var Zr=Me('<svg><path fill="currentColor" d="M122 40V16a6 6 0 0 1 12 0v24a6 6 0 0 1-12 0m68 88a62 62 0 1 1-62-62a62.07 62.07 0 0 1 62 62m-12 0a50 50 0 1 0-50 50a50.06 50.06 0 0 0 50-50M59.76 68.24a6 6 0 1 0 8.48-8.48l-16-16a6 6 0 0 0-8.48 8.48Zm0 119.52l-16 16a6 6 0 1 0 8.48 8.48l16-16a6 6 0 1 0-8.48-8.48M192 70a6 6 0 0 0 4.24-1.76l16-16a6 6 0 0 0-8.48-8.48l-16 16A6 6 0 0 0 192 70m4.24 117.76a6 6 0 0 0-8.48 8.48l16 16a6 6 0 0 0 8.48-8.48ZM46 128a6 6 0 0 0-6-6H16a6 6 0 0 0 0 12h24a6 6 0 0 0 6-6m82 82a6 6 0 0 0-6 6v24a6 6 0 0 0 12 0v-24a6 6 0 0 0-6-6m112-88h-24a6 6 0 0 0 0 12h24a6 6 0 0 0 0-12"></path></svg>');function Jr(e,a){const r=Te(a,["$$slots","$$events","$$legacy"]);var t=Zr();let n;N(()=>n=ke(t,n,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...r})),M(e,t)}var Qr=Me('<svg><path fill="currentColor" d="M88 104H40a8 8 0 0 1-8-8V48a8 8 0 0 1 16 0v28.69l14.63-14.63A95.43 95.43 0 0 1 130 33.94h.53a95.36 95.36 0 0 1 67.07 27.33a8 8 0 0 1-11.18 11.44a79.52 79.52 0 0 0-55.89-22.77h-.45a79.56 79.56 0 0 0-56.14 23.43L59.31 88H88a8 8 0 0 1 0 16m128 48h-48a8 8 0 0 0 0 16h28.69l-14.63 14.63a79.56 79.56 0 0 1-56.13 23.43h-.45a79.52 79.52 0 0 1-55.89-22.77a8 8 0 1 0-11.18 11.44a95.36 95.36 0 0 0 67.07 27.33h.52a95.43 95.43 0 0 0 67.36-28.12L208 179.31V208a8 8 0 0 0 16 0v-48a8 8 0 0 0-8-8"></path></svg>');function Xr(e,a){const r=Te(a,["$$slots","$$events","$$legacy"]);var t=Qr();let n;N(()=>n=ke(t,n,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...r})),M(e,t)}var Yr=Me('<svg><path fill="currentColor" d="M232.13 143.64a6 6 0 0 0-6-1.49a90.07 90.07 0 0 1-112.27-112.3a6 6 0 0 0-7.49-7.48a102.88 102.88 0 0 0-51.89 36.31a102 102 0 0 0 142.84 142.84a102.88 102.88 0 0 0 36.31-51.89a6 6 0 0 0-1.5-5.99m-42 48.29a90 90 0 0 1-126-126a90.9 90.9 0 0 1 35.52-28.27a102.06 102.06 0 0 0 118.69 118.69a90.9 90.9 0 0 1-28.24 35.58Z"></path></svg>');function et(e,a){const r=Te(a,["$$slots","$$events","$$legacy"]);var t=Yr();let n;N(()=>n=ke(t,n,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...r})),M(e,t)}var at=Me('<svg><path fill="currentColor" d="M164.24 100.24L136.48 128l27.76 27.76a6 6 0 1 1-8.48 8.48L128 136.48l-27.76 27.76a6 6 0 0 1-8.48-8.48L119.52 128l-27.76-27.76a6 6 0 0 1 8.48-8.48L128 119.52l27.76-27.76a6 6 0 0 1 8.48 8.48M230 128A102 102 0 1 1 128 26a102.12 102.12 0 0 1 102 102m-12 0a90 90 0 1 0-90 90a90.1 90.1 0 0 0 90-90"></path></svg>');function rt(e,a){const r=Te(a,["$$slots","$$events","$$legacy"]);var t=at();let n;N(()=>n=ke(t,n,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...r})),M(e,t)}var tt=(e,a)=>{Q(a,!1)},nt=K('<!> <dialog class="container svelte-k25xuh"><div class="listParam svelte-k25xuh"><div class="setting svelte-k25xuh">Thème <!> <!></div> <div class="setting svelte-k25xuh">Mode debug <!></div> <div class="setting svelte-k25xuh"><!></div> <div class="setting svelte-k25xuh"><!></div> <footer>C.i.g.a.l.e vDEV · <a href="#/about">À propos</a></footer></div></dialog>',1);function ot(e,a){Ae(a,!0);let r=ce(!1),t=ce(void 0);Le(()=>{window.addEventListener("mouseup",({target:h})=>{var m;h!==d(t)&&((m=d(t))!=null&&m.contains(h)||Q(r,!1))})});let n=ce(!0);Le(()=>{window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",h=>{Q(n,!h.matches)})});var o=nt(),s=se(o);const i=V(()=>d(r)?"Fermer":"Réglages");ha(s,{get help(){return d(i)},onclick:()=>{Q(r,!d(r))},children:(h,m)=>{var g=ka(),k=se(g);{var z=D=>{rt(D,{})},A=D=>{Nr(D,{})};le(k,D=>{d(r)?D(z):D(A,!1)})}M(h,g)}});var v=x(s,2),u=j(v),l=j(u),f=x(j(l));const c=V(()=>ge().theme==="auto"?d(n):ge().theme==="light");ma(f,{get value(){return d(c)},onchange:async h=>{await Ke("theme",h?"light":"dark")},icons:{on:Jr,off:et}});var p=x(f,2);const y=V(()=>ge().theme==="auto");ha(p,{get disabled(){return d(y)},onclick:async()=>await Ke("theme","auto"),help:"Synchroniser avec le thème du système",children:(h,m)=>{Xr(h,{})}}),L(l);var w=x(l,2),_=x(j(w));ma(_,{get value(){return ge().showTechnicalMetadata},onchange:async h=>{await Ke("showTechnicalMetadata",h)}}),L(w);var P=x(w,2),S=j(P);be(S,{onclick:async()=>{Q(r,!1),await Ze("#/protocols")},children:(h,m)=>{ve();var g=fe("Gérer les protocoles");M(h,g)},$$slots:{default:!0}}),L(P);var T=x(P,2),$=j(T);be($,{onclick:()=>{var h;(h=a.openKeyboardShortcuts)==null||h.call(a)},children:(h,m)=>{ve();var g=fe("Raccourcis clavier");M(h,g)},$$slots:{default:!0}}),L(T);var I=x(T,2),O=x(j(I));O.__click=[tt,r],L(I),L(u),L(v),dr(v,h=>Q(t,h),()=>d(t)),N(h=>{ee(v,"data-theme",h),v.open=d(r)?!0:void 0},[()=>ge().theme]),M(e,o),Ie()}Ta(["click"]);var st=K('<button class="pr-number svelte-ny3sol"></button>'),it=K('<div class="line svelte-ny3sol"></div>'),lt=K('<div class="line svelte-ny3sol"></div>'),vt=K('<div class="line svelte-ny3sol"></div>'),ct=K('<div class="line svelte-ny3sol"></div>'),ft=K("<!> Résultats",1),ut=K('<!> <!> <header><nav class="svelte-ny3sol"><div class="logo svelte-ny3sol"><a href="#/" class="svelte-ny3sol"><svelte-css-wrapper style="display: contents"><!></svelte-css-wrapper> C.i.g.a.l.e.</a> <!></div> <div class="steps svelte-ny3sol"><a href="#/" class="svelte-ny3sol">Protocole <!></a> <!> <a href="#/import" class="svelte-ny3sol">Importer <!></a> <!> <a href="#/crop" class="svelte-ny3sol">Recadrer <!></a> <!> <a href="#/classify" class="svelte-ny3sol">Classifier <!></a> <!> <!></div> <svelte-css-wrapper style="display: contents"><!></svelte-css-wrapper></nav> <div><div class="completed svelte-ny3sol"></div></div></header>',1);function dt(e,a){Ae(a,!0);let r=ta(a,"progress",3,0);const t=V(()=>Pa.url.hash.replace(/^#/,"")),n=V(()=>te.Image.state.length>0);let o=ce(void 0),s=ce(void 0);Le(()=>{oe.currentProtocol||Ze("#/"),oe.currentProtocol&&!d(n)&&Ze("#/import")});let i=ce(void 0);var v=ut(),u=se(v);Gr(u,{get open(){return d(s)},set open(b){Q(s,De(b))}});var l=x(u,2);{var f=b=>{Tr(b,{get open(){return d(i)},set open(H){Q(i,De(H))}})};le(l,b=>{ie&&b(f)})}var c=x(l,2),p=j(c),y=j(p),w=j(y),_=j(w);pa(_,()=>({"--fill":"var(--bg-primary)"})),or(_.lastChild,{}),L(_),ve(),L(w);var P=x(w,2);{var S=b=>{var H=st();H.__click=function(...de){var me;(me=d(i))==null||me.apply(this,de)},H.textContent=`Preview #${ie??""}`,M(b,H)};le(P,b=>{ie&&b(S)})}L(y);var T=x(y,2),$=j(T),I=x(j($));{var O=b=>{var H=it();M(b,H)};le(I,b=>{d(t)=="/"&&b(O)})}L($);var h=x($,2);Ce(h,{});var m=x(h,2),g=x(j(m));{var k=b=>{var H=lt();M(b,H)};le(g,b=>{d(t)=="/import"&&b(k)})}L(m);var z=x(m,2);Ce(z,{});var A=x(z,2),D=x(j(A));{var R=b=>{var H=vt();M(b,H)};le(D,b=>{d(t)=="/crop"&&b(R)})}L(A);var C=x(A,2);Ce(C,{});var U=x(C,2),B=x(j(U));{var Z=b=>{var H=ct();M(b,H)};le(B,b=>{d(t)=="/classify"&&b(Z)})}L(U);var Y=x(U,2);Ce(Y,{});var ue=x(Y,2);be(ue,{get onclick(){return d(s)},children:(b,H)=>{var de=ft(),me=se(de);Sa(me,{}),ve(),M(b,de)},$$slots:{default:!0}}),L(T);var q=x(T,2);pa(q,()=>({"--navbar-height":`${d(o)??""}px`})),ot(q.lastChild,{get openKeyboardShortcuts(){return a.openKeyboardShortcuts}}),L(q),L(p);var ae=x(p,2);let re;var J=j(ae);let F;L(ae),L(c),N(b=>{ee(m,"aria-disabled",!oe.currentProtocol),ee(A,"aria-disabled",!oe.currentProtocol||!d(n)),ee(U,"aria-disabled",!oe.currentProtocol||!d(n)),re=La(ae,1,"global-progress-bar svelte-ny3sol",null,re,b),F=er(J,"",F,{width:`${r()*100}%`})},[()=>({inactive:[0,1].includes(r())})]),nr(c,"clientHeight",b=>Q(o,b)),M(e,v),Ie()}Ta(["click"]);var pt=K("<base>"),ht=K('<!> <!> <section class="toasts svelte-fbiwzh"></section> <div><!></div>',1);function Qt(e,a){Ae(a,!0),Le(()=>{for(const f of te.Image.state)oe.previewURLs.has(f.id)||(async()=>{const c=await Ma("ImageFile",f.id.replace(/(_\d+)+$/,""));if(!c)return;const p=new Blob([c.bytes],{type:f.contentType});oe.previewURLs.set(f.id,URL.createObjectURL(p))})()});const r=V(ge);Le(()=>{document.documentElement.dataset.theme=d(r).theme});let t=ce(void 0);var n=ht();Qa(f=>{var c=pt();ee(c,"href",Je?`${Je}/index.html`:""),M(f,c)});var o=se(n);dt(o,{get openKeyboardShortcuts(){return d(t)},hasImages:!0,get progress(){return oe.processing.progress}});var s=x(o,2);rr(s,{preventDefault:!0,get binds(){return oe.keybinds},get openHelp(){return d(t)},set openHelp(f){Q(t,De(f))}});var i=x(s,2);Xa(i,21,()=>Pe.items,f=>f.id,(f,c)=>{tr(f,ar(()=>d(c),{get action(){return d(c).labels.action},get dismiss(){return d(c).labels.close},onaction:()=>{var p,y;(y=(p=d(c).callbacks)==null?void 0:p.action)==null||y.call(p,d(c))},ondismiss:()=>{Pe.remove(d(c).id)}}))}),L(i);var v=x(i,2);let u;var l=j(v);Ya(l,()=>a.children??xa),L(v),N(f=>u=La(v,1,"contents svelte-fbiwzh",null,u,f),[()=>{var f;return{padded:!((f=Pa.route.id)!=null&&f.includes("/(sidepanel)"))}}]),M(e,n),Ie()}export{Qt as component,Jt as universal};
