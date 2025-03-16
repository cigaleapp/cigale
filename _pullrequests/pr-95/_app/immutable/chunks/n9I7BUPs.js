import{n as Re,a as u,t as g,b as ye,c as Ie}from"./B4fTvO1f.js";import{t as S,ag as je,G as we,b as Z,s as fe,c as D,a as w,r as P,ah as Ze,f as V,ai as be,g as c,M as _e}from"./C5da3JO5.js";import{s as De,e as A}from"./CGuacY5z.js";import{i as y}from"./CfqesXew.js";import{s as Ae}from"./BTiqJsOv.js";import{a as Ke,t as Ue}from"./CCc71EmP.js";import{s as Je,a as T,r as K,d as ze}from"./oOm2T-ds.js";import{b as $}from"./Cg8KTPwf.js";import{p as ge}from"./CY4eTrAl.js";import{r as $e,p as ae}from"./DTwrH9wU.js";import et from"./BAGK9RnB.js";import tt from"./CsTRZQon.js";import rt from"./Bw2C8XpN.js";import at from"./D1nmsqgf.js";import{g as nt}from"./sQOkCmaf.js";import{f as it,h as ce,j as Pe,k as ot,l as st,p as ut,q as ct,r as dt,u as lt,v as ft,w as gt,x as mt,y as vt,z as ht}from"./CnQjtwGZ.js";import{a as i}from"./6--iqVZy.js";function yt(r,...t){const e=it.bind(null,t.find(a=>typeof a=="object"));return t.map(e)}function Se(r,t){const e=ce(r,t==null?void 0:t.in);return e.setHours(0,0,0,0),e}function wt(r,t,e){const[a,n]=yt(e==null?void 0:e.in,r,t),o=Se(a),R=Se(n),m=+o-Pe(o),_=+R-Pe(R);return Math.round((m-_)/ot)}function bt(r){return r instanceof Date||typeof r=="object"&&Object.prototype.toString.call(r)==="[object Date]"}function _t(r){return!(!bt(r)&&typeof r!="number"||isNaN(+ce(r)))}function xt(r,t){const e=ce(r,t==null?void 0:t.in);return e.setFullYear(e.getFullYear(),0,1),e.setHours(0,0,0,0),e}function pt(r,t){const e=ce(r,t==null?void 0:t.in);return wt(e,xt(e))+1}const U={y(r,t){const e=r.getFullYear(),a=e>0?e:1-e;return i(t==="yy"?a%100:a,t.length)},M(r,t){const e=r.getMonth();return t==="M"?String(e+1):i(e+1,2)},d(r,t){return i(r.getDate(),t.length)},a(r,t){const e=r.getHours()/12>=1?"pm":"am";switch(t){case"a":case"aa":return e.toUpperCase();case"aaa":return e;case"aaaaa":return e[0];case"aaaa":default:return e==="am"?"a.m.":"p.m."}},h(r,t){return i(r.getHours()%12||12,t.length)},H(r,t){return i(r.getHours(),t.length)},m(r,t){return i(r.getMinutes(),t.length)},s(r,t){return i(r.getSeconds(),t.length)},S(r,t){const e=t.length,a=r.getMilliseconds(),n=Math.trunc(a*Math.pow(10,e-3));return i(n,t.length)}},ne={midnight:"midnight",noon:"noon",morning:"morning",afternoon:"afternoon",evening:"evening",night:"night"},ke={G:function(r,t,e){const a=r.getFullYear()>0?1:0;switch(t){case"G":case"GG":case"GGG":return e.era(a,{width:"abbreviated"});case"GGGGG":return e.era(a,{width:"narrow"});case"GGGG":default:return e.era(a,{width:"wide"})}},y:function(r,t,e){if(t==="yo"){const a=r.getFullYear(),n=a>0?a:1-a;return e.ordinalNumber(n,{unit:"year"})}return U.y(r,t)},Y:function(r,t,e,a){const n=dt(r,a),o=n>0?n:1-n;if(t==="YY"){const R=o%100;return i(R,2)}return t==="Yo"?e.ordinalNumber(o,{unit:"year"}):i(o,t.length)},R:function(r,t){const e=ct(r);return i(e,t.length)},u:function(r,t){const e=r.getFullYear();return i(e,t.length)},Q:function(r,t,e){const a=Math.ceil((r.getMonth()+1)/3);switch(t){case"Q":return String(a);case"QQ":return i(a,2);case"Qo":return e.ordinalNumber(a,{unit:"quarter"});case"QQQ":return e.quarter(a,{width:"abbreviated",context:"formatting"});case"QQQQQ":return e.quarter(a,{width:"narrow",context:"formatting"});case"QQQQ":default:return e.quarter(a,{width:"wide",context:"formatting"})}},q:function(r,t,e){const a=Math.ceil((r.getMonth()+1)/3);switch(t){case"q":return String(a);case"qq":return i(a,2);case"qo":return e.ordinalNumber(a,{unit:"quarter"});case"qqq":return e.quarter(a,{width:"abbreviated",context:"standalone"});case"qqqqq":return e.quarter(a,{width:"narrow",context:"standalone"});case"qqqq":default:return e.quarter(a,{width:"wide",context:"standalone"})}},M:function(r,t,e){const a=r.getMonth();switch(t){case"M":case"MM":return U.M(r,t);case"Mo":return e.ordinalNumber(a+1,{unit:"month"});case"MMM":return e.month(a,{width:"abbreviated",context:"formatting"});case"MMMMM":return e.month(a,{width:"narrow",context:"formatting"});case"MMMM":default:return e.month(a,{width:"wide",context:"formatting"})}},L:function(r,t,e){const a=r.getMonth();switch(t){case"L":return String(a+1);case"LL":return i(a+1,2);case"Lo":return e.ordinalNumber(a+1,{unit:"month"});case"LLL":return e.month(a,{width:"abbreviated",context:"standalone"});case"LLLLL":return e.month(a,{width:"narrow",context:"standalone"});case"LLLL":default:return e.month(a,{width:"wide",context:"standalone"})}},w:function(r,t,e,a){const n=ut(r,a);return t==="wo"?e.ordinalNumber(n,{unit:"week"}):i(n,t.length)},I:function(r,t,e){const a=st(r);return t==="Io"?e.ordinalNumber(a,{unit:"week"}):i(a,t.length)},d:function(r,t,e){return t==="do"?e.ordinalNumber(r.getDate(),{unit:"date"}):U.d(r,t)},D:function(r,t,e){const a=pt(r);return t==="Do"?e.ordinalNumber(a,{unit:"dayOfYear"}):i(a,t.length)},E:function(r,t,e){const a=r.getDay();switch(t){case"E":case"EE":case"EEE":return e.day(a,{width:"abbreviated",context:"formatting"});case"EEEEE":return e.day(a,{width:"narrow",context:"formatting"});case"EEEEEE":return e.day(a,{width:"short",context:"formatting"});case"EEEE":default:return e.day(a,{width:"wide",context:"formatting"})}},e:function(r,t,e,a){const n=r.getDay(),o=(n-a.weekStartsOn+8)%7||7;switch(t){case"e":return String(o);case"ee":return i(o,2);case"eo":return e.ordinalNumber(o,{unit:"day"});case"eee":return e.day(n,{width:"abbreviated",context:"formatting"});case"eeeee":return e.day(n,{width:"narrow",context:"formatting"});case"eeeeee":return e.day(n,{width:"short",context:"formatting"});case"eeee":default:return e.day(n,{width:"wide",context:"formatting"})}},c:function(r,t,e,a){const n=r.getDay(),o=(n-a.weekStartsOn+8)%7||7;switch(t){case"c":return String(o);case"cc":return i(o,t.length);case"co":return e.ordinalNumber(o,{unit:"day"});case"ccc":return e.day(n,{width:"abbreviated",context:"standalone"});case"ccccc":return e.day(n,{width:"narrow",context:"standalone"});case"cccccc":return e.day(n,{width:"short",context:"standalone"});case"cccc":default:return e.day(n,{width:"wide",context:"standalone"})}},i:function(r,t,e){const a=r.getDay(),n=a===0?7:a;switch(t){case"i":return String(n);case"ii":return i(n,t.length);case"io":return e.ordinalNumber(n,{unit:"day"});case"iii":return e.day(a,{width:"abbreviated",context:"formatting"});case"iiiii":return e.day(a,{width:"narrow",context:"formatting"});case"iiiiii":return e.day(a,{width:"short",context:"formatting"});case"iiii":default:return e.day(a,{width:"wide",context:"formatting"})}},a:function(r,t,e){const n=r.getHours()/12>=1?"pm":"am";switch(t){case"a":case"aa":return e.dayPeriod(n,{width:"abbreviated",context:"formatting"});case"aaa":return e.dayPeriod(n,{width:"abbreviated",context:"formatting"}).toLowerCase();case"aaaaa":return e.dayPeriod(n,{width:"narrow",context:"formatting"});case"aaaa":default:return e.dayPeriod(n,{width:"wide",context:"formatting"})}},b:function(r,t,e){const a=r.getHours();let n;switch(a===12?n=ne.noon:a===0?n=ne.midnight:n=a/12>=1?"pm":"am",t){case"b":case"bb":return e.dayPeriod(n,{width:"abbreviated",context:"formatting"});case"bbb":return e.dayPeriod(n,{width:"abbreviated",context:"formatting"}).toLowerCase();case"bbbbb":return e.dayPeriod(n,{width:"narrow",context:"formatting"});case"bbbb":default:return e.dayPeriod(n,{width:"wide",context:"formatting"})}},B:function(r,t,e){const a=r.getHours();let n;switch(a>=17?n=ne.evening:a>=12?n=ne.afternoon:a>=4?n=ne.morning:n=ne.night,t){case"B":case"BB":case"BBB":return e.dayPeriod(n,{width:"abbreviated",context:"formatting"});case"BBBBB":return e.dayPeriod(n,{width:"narrow",context:"formatting"});case"BBBB":default:return e.dayPeriod(n,{width:"wide",context:"formatting"})}},h:function(r,t,e){if(t==="ho"){let a=r.getHours()%12;return a===0&&(a=12),e.ordinalNumber(a,{unit:"hour"})}return U.h(r,t)},H:function(r,t,e){return t==="Ho"?e.ordinalNumber(r.getHours(),{unit:"hour"}):U.H(r,t)},K:function(r,t,e){const a=r.getHours()%12;return t==="Ko"?e.ordinalNumber(a,{unit:"hour"}):i(a,t.length)},k:function(r,t,e){let a=r.getHours();return a===0&&(a=24),t==="ko"?e.ordinalNumber(a,{unit:"hour"}):i(a,t.length)},m:function(r,t,e){return t==="mo"?e.ordinalNumber(r.getMinutes(),{unit:"minute"}):U.m(r,t)},s:function(r,t,e){return t==="so"?e.ordinalNumber(r.getSeconds(),{unit:"second"}):U.s(r,t)},S:function(r,t){return U.S(r,t)},X:function(r,t,e){const a=r.getTimezoneOffset();if(a===0)return"Z";switch(t){case"X":return Le(a);case"XXXX":case"XX":return ee(a);case"XXXXX":case"XXX":default:return ee(a,":")}},x:function(r,t,e){const a=r.getTimezoneOffset();switch(t){case"x":return Le(a);case"xxxx":case"xx":return ee(a);case"xxxxx":case"xxx":default:return ee(a,":")}},O:function(r,t,e){const a=r.getTimezoneOffset();switch(t){case"O":case"OO":case"OOO":return"GMT"+qe(a,":");case"OOOO":default:return"GMT"+ee(a,":")}},z:function(r,t,e){const a=r.getTimezoneOffset();switch(t){case"z":case"zz":case"zzz":return"GMT"+qe(a,":");case"zzzz":default:return"GMT"+ee(a,":")}},t:function(r,t,e){const a=Math.trunc(+r/1e3);return i(a,t.length)},T:function(r,t,e){return i(+r,t.length)}};function qe(r,t=""){const e=r>0?"-":"+",a=Math.abs(r),n=Math.trunc(a/60),o=a%60;return o===0?e+String(n):e+String(n)+t+i(o,2)}function Le(r,t){return r%60===0?(r>0?"-":"+")+i(Math.abs(r)/60,2):ee(r,t)}function ee(r,t=""){const e=r>0?"-":"+",a=Math.abs(r),n=i(Math.trunc(a/60),2),o=i(a%60,2);return e+n+t+o}const Mt=/[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g,Ot=/P+p+|P+|p+|''|'(''|[^'])+('|$)|./g,Et=/^'([^]*?)'?$/,Dt=/''/g,Pt=/[a-zA-Z]/;function Ne(r,t,e){var Y,G,te,J;const a=lt(),n=a.locale??ft,o=a.firstWeekContainsDate??((G=(Y=a.locale)==null?void 0:Y.options)==null?void 0:G.firstWeekContainsDate)??1,R=a.weekStartsOn??((J=(te=a.locale)==null?void 0:te.options)==null?void 0:J.weekStartsOn)??0,m=ce(r,e==null?void 0:e.in);if(!_t(m))throw new RangeError("Invalid time value");let _=t.match(Ot).map(v=>{const h=v[0];if(h==="p"||h==="P"){const ie=gt[h];return ie(v,n.formatLong)}return v}).join("").match(Mt).map(v=>{if(v==="''")return{isToken:!1,value:"'"};const h=v[0];if(h==="'")return{isToken:!1,value:St(v)};if(ke[h])return{isToken:!0,value:v};if(h.match(Pt))throw new RangeError("Format string contains an unescaped latin alphabet character `"+h+"`");return{isToken:!1,value:v}});n.localize.preprocessor&&(_=n.localize.preprocessor(m,_));const C={firstWeekContainsDate:o,weekStartsOn:R,locale:n};return _.map(v=>{if(!v.isToken)return v.value;const h=v.value;(mt(h)||vt(h))&&ht(h,t,String(r));const ie=ke[h[0]];return ie(m,h,n.localize,C)}).join("")}function St(r){const t=r.match(Et);return t?t[1].replace(Dt,"'"):r}var kt=Re('<svg><path fill="currentColor" d="M228.92 49.69a8 8 0 0 0-6.86-1.45l-61.13 15.28l-61.35-30.68a8 8 0 0 0-5.52-.6l-64 16A8 8 0 0 0 24 56v144a8 8 0 0 0 9.94 7.76l61.13-15.28l61.35 30.68a8.15 8.15 0 0 0 3.58.84a8 8 0 0 0 1.94-.24l64-16A8 8 0 0 0 232 200V56a8 8 0 0 0-3.08-6.31M104 52.94l48 24v126.12l-48-24Zm-64 9.31l48-12v127.5l-48 12Zm176 131.5l-48 12V78.25l48-12Z"></path></svg>');function qt(r,t){const e=$e(t,["$$slots","$$events","$$legacy"]);var a=kt();let n;S(()=>n=Je(a,n,{class:"icon",viewBox:"0 0 256 256",width:"1.2em",height:"1.2em",...e})),u(r,a)}var Lt=g('<div class="confidence svelte-1g8gm5y"><!></div>'),Nt=g('<a class="gmaps-link" target="_blank"><!></a>'),Tt=g("<p> </p>"),Yt=g(`<a target="_blank">Plus d'infos</a>`),Gt=g("<p>Plusieurs valeurs</p>"),Qt=g('<div class="date-and-time"><!> <input type="date" class="svelte-1g8gm5y"> <input type="time" class="svelte-1g8gm5y"></div> <div class="ligne svelte-1g8gm5y"></div>',1),Wt=g('<input type="text" inputmode="numeric" class="svelte-1g8gm5y"> <div class="ligne svelte-1g8gm5y"></div>',1),Ht=g('<div class="niOuiNiNon svelte-1g8gm5y"><!></div>'),Bt=g(" <!>",1),Xt=g(" <!>",1),Vt=g(" <!>",1),Ct=g('<input type="text" class="svelte-1g8gm5y"> <div class="ligne svelte-1g8gm5y"></div>',1),Ft=g(' <input aria-label="Latitude" type="text" class="svelte-1g8gm5y">',1),Rt=g('<input type="text" inputmode="numeric" aria-label="Latitude" class="svelte-1g8gm5y">'),It=g(' <input aria-label="Longitude" type="text" class="svelte-1g8gm5y">',1),jt=g('<input type="text" inputmode="numeric" aria-label="Longitude" class="svelte-1g8gm5y">'),Zt=g('<div class="subfield"> <!></div> <div class="subfield"> <!></div>',1),At=g('<pre class="unrepresentable-datatype svelte-1g8gm5y"> </pre>'),Kt=g('<div class="meta svelte-1g8gm5y"><label class="svelte-1g8gm5y"><div class="first-line svelte-1g8gm5y"><!> <!> <!></div> <section class="about"><!> <!></section></label> <!></div>');function gr(r,t){je(t,!0);let e=ae(t,"value",15),a=ae(t,"options",19,()=>[]),n=ae(t,"description",3,""),o=ae(t,"learnMore",3,null),R=ae(t,"onchange",3,()=>{}),m=ae(t,"onblur",3,()=>{}),_=fe(void 0),C=fe(void 0),Y=fe(void 0),G=fe(void 0);we(()=>{t.type==="location"&&e()!==void 0&&(Z(_,ge(e().latitude)),Z(C,ge(e().longitude)))}),we(()=>{t.type==="date"&&e()!==void 0&&(Z(Y,ge(Ne(e(),"yyyy-MM-dd"))),Z(G,ge(Ne(e(),"HH:mm:ss"))))}),we(()=>{e()!==void 0&&R()(e())});var te=Kt(),J=D(te),v=D(J),h=D(v);{var ie=d=>{var l=Lt(),Q=D(l);tt(Q,{get value(){return t.confidence}}),P(l),Ke(l,(re,W)=>{var x;return(x=Ue)==null?void 0:x(re,W)},()=>`Confiance: ${Math.round(t.confidence*1e4)/100}%`),u(d,l)};y(h,d=>{t.confidence!==void 0&&t.confidence<1&&d(ie)})}var xe=w(h,2);Ae(xe,()=>t.children);var Te=w(xe,2);{var Ye=d=>{var l=Nt(),Q=D(l);qt(Q,{}),P(l),S(()=>T(l,"href",`https://maps.google.com/maps/@${e().latitude??""},${e().longitude??""},17z`)),u(d,l)};y(Te,d=>{t.type==="location"&&e()!==void 0&&d(Ye)})}P(v);var pe=w(v,2),Me=D(pe);{var Ge=d=>{var l=Tt(),Q=D(l,!0);P(l),S(()=>De(Q,n())),u(d,l)};y(Me,d=>{n()&&d(Ge)})}var Qe=w(Me,2);{var We=d=>{var l=Yt();S(()=>T(l,"href",o())),u(d,l)};y(Qe,d=>{o()&&d(We)})}P(pe),P(J);var He=w(J,2);{var Be=d=>{var l=Qt(),Q=V(l),re=D(Q);{var W=q=>{var L=Gt();u(q,L)};y(re,q=>{!e()&&t.conflicted&&q(W)})}var x=w(re,2);K(x);var k=w(x,2);K(k),P(Q),be(2),S(()=>T(x,"id",`metadata-${t.id??""}`)),A("blur",x,()=>{c(Y)&&c(G)&&m()(new Date(`${c(Y)}T${c(G)}`))}),$(x,()=>c(Y),q=>Z(Y,q)),A("blur",k,()=>{c(Y)&&c(G)&&m()(new Date(`${c(Y)}T${c(G)}`))}),$(k,()=>c(G),q=>Z(G,q)),u(d,l)},Xe=(d,l)=>{{var Q=W=>{var x=Wt(),k=V(x);K(k),be(2),S(()=>{T(k,"id",`metadata-${t.id??""}`),T(k,"placeholder",t.conflicted?"Plusieurs valeurs":"Nombre"),ze(k,e()??"")}),A("blur",k,({currentTarget:q})=>{const L=q.valueAsNumber;isNaN(L)||m()(L)}),u(W,x)},re=(W,x)=>{{var k=L=>{var de=Bt(),le=V(de);le.nodeValue=" ";var me=w(le);et(me,{get id(){return`metadata-${t.id??""}`},get onchange(){return m()},get value(){return e()},set value(H){e(H)},children:(H,oe)=>{var z=Ht(),se=D(z);{var B=f=>{var N=ye("Plusieurs valeurs");u(f,N)},p=(f,N)=>{{var O=b=>{var E=ye("Oui");u(b,E)},X=b=>{var E=ye("Non");u(b,E)};y(f,b=>{e()?b(O):b(X,!1)},N)}};y(se,f=>{e()===void 0&&t.conflicted?f(B):f(p,!1)})}P(z),u(H,z)},$$slots:{default:!0}}),u(L,de)},q=(L,de)=>{{var le=H=>{var oe=Ie(),z=V(oe);{var se=p=>{var f=Xt(),N=V(f);N.nodeValue=" ";var O=w(N);rt(O,{get onchange(){return m()},get options(){return a()},get value(){return e()},set value(X){e(X)}}),u(p,f)},B=p=>{var f=Vt(),N=V(f);N.nodeValue=" ";var O=w(N);const X=_e(()=>t.conflicted?"Plusieurs valeurs":"Rechercher…"),b=_e(()=>{var I;return e()?((I=a().find(ue=>ue.key===e()))==null?void 0:I.label)??e():""}),E=_e(()=>typeof e()=="string"?e():void 0);at(O,{get id(){return`metadata-${t.id??""}`},get placeholder(){return c(X)},get onblur(){return m()},get options(){return a()},get searchQuery(){return c(b)},get selectedValue(){return c(E)}}),u(p,f)};y(z,p=>{a().length<=5?p(se):p(B,!1)})}u(H,oe)},me=(H,oe)=>{{var z=B=>{var p=Ct(),f=V(p);K(f),be(2),S(()=>T(f,"id",`metadata-${t.id??""}`)),A("blur",f,()=>m()(e())),$(f,e),u(B,p)},se=(B,p)=>{{var f=O=>{var X=Zt(),b=V(X),E=D(b);E.nodeValue=`Lat.
			 `;var I=w(E);{var ue=M=>{var s=Ft(),F=V(s);F.nodeValue=" ";var j=w(F);K(j),S(()=>T(j,"id",`metadata-${t.id??""}`)),A("blur",j,()=>m()(e())),$(j,()=>e().latitude,he=>e(e().latitude=he,!0)),u(M,s)},ve=M=>{var s=Rt();K(s),S(()=>{T(s,"id",`metadata-${t.id??""}`),T(s,"placeholder",t.conflicted?"Plusieurs valeurs":"43.602419")}),A("blur",s,()=>{c(_)&&c(C)&&m()({latitude:c(_),longitude:c(C)})}),$(s,()=>c(_),F=>Z(_,F)),u(M,s)};y(I,M=>{var s;((s=e())==null?void 0:s.latitude)!==void 0?M(ue):M(ve,!1)})}P(b);var Oe=w(b,2),Ee=D(Oe);Ee.nodeValue=`Lon.
			 `;var Ve=w(Ee);{var Ce=M=>{var s=It(),F=V(s);F.nodeValue=" ";var j=w(F);K(j),A("blur",j,()=>m()(e())),$(j,()=>e().longitude,he=>e(e().longitude=he,!0)),u(M,s)},Fe=M=>{var s=jt();K(s),S(()=>T(s,"placeholder",t.conflicted?"Plusieurs valeurs":"1.456366")),A("blur",s,()=>{c(_)&&c(C)&&m()({latitude:c(_),longitude:c(C)})}),$(s,()=>c(C),F=>Z(C,F)),u(M,s)};y(Ve,M=>{var s;((s=e())==null?void 0:s.longitude)!==void 0?M(Ce):M(Fe,!1)})}P(Oe),u(O,X)},N=(O,X)=>{{var b=E=>{var I=At(),ue=D(I,!0);P(I),S(ve=>De(ue,ve),[()=>e()?JSON.stringify(e(),null,2):t.conflicted?"Plusieurs valeurs":"undefined"]),u(E,I)};y(O,E=>{nt().showTechnicalMetadata&&E(b)},X)}};y(B,O=>{t.type==="location"?O(f):O(N,!1)},p)}};y(H,B=>{t.type==="string"?B(z):B(se,!1)},oe)}};y(L,H=>{t.type==="enum"?H(le):H(me,!1)},de)}};y(W,L=>{t.type==="boolean"?L(k):L(q,!1)},x)}};y(d,W=>{t.type==="float"||t.type==="integer"?W(Q):W(re,!1)},l)}};y(He,d=>{t.type==="date"?d(Be):d(Xe,!1)})}P(te),S(()=>T(J,"for",`metadata-${t.id??""}`)),u(r,te),Ze()}export{gr as default};
